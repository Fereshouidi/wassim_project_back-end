import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { getProductsBySearch } from "../../../controller/product.js";
import { searchTools } from "../tools.ts/searchTools.js";
import Collection from "../../../models/collection.js";
import { getOwnerInfo } from "../../../controller/ownerInfo.js";
import { sanitizeMessages } from "../utils.js";
import { getChatsByClient } from "../../../controller/chat.js";
import { MessageType } from "../../../types/index.js";

const groq = new Groq({ apiKey: activeAiApiKey });

export const searchAgent = async (msgFrom: "user" | "assistant", msg: string, history: any[], clientId: string, onStatus?: (status: string) => void) => {
    const truncatedHistory = history.slice(-6);
    const info = await getOwnerInfo();
    const managerRules = info?.aiPrompt || "";

    const systemPrompt = `You are a smart shopping assistant.
Rules:
1. ONLY use 'findProducts' tool for searching.
2. If the user wants to navigate to a page (home, collections, account), or open/close UI elements (sidebar, cart, theme), use the 'controlUI' tool.
3. For navigation: use element: 'navigation' and state: '/path'.
4. **IMPORTANT SEARCH NAVIGATION:** If the user asks to "Open the search page", "Lead me to search", or "Show in search page" with specific filters (like color, price, etc.), you MUST build a path with the filter encoded using this exact JSON structure.
   - Example for ALL products: "/search?searchInput=&filter={\"price\":{\"from\":0,\"to\":10000},\"collections\":[],\"colors\":[],\"types\":[],\"sizes\":[],\"sortBy\":\"price\",\"sortDirection\":\"asc\",\"activeLanguage\":\"en\"}"
   - Example for RED products: "/search?searchInput=&filter={\"price\":{\"from\":0,\"to\":10000},\"collections\":[],\"colors\":[\"red\"],\"types\":[],\"sizes\":[],\"sortBy\":\"price\",\"sortDirection\":\"asc\",\"activeLanguage\":\"en\"}"
5. 'query' is optional. If the user asks for a category without a name, leave query empty.
6. After getting results, provide a helpful summary.
7. When showing products, YOU MUST include the product image using markdown: ![Product Name](image_url).
8. When showing products, ALWAYS include a link to the product page using this format: [Product Name](/product/id).
9. **UI ACTION:** When you find products, always be helpful and say something like "Certainly! Here is what I found for you:" or "I've found these great results for you:".
10. NEVER send JSON to the user.
11. For deep searches, paginate like this: limit: 5, skip: 0 → limit: 10, skip: 5 → limit: 15, skip: 10 → continue increasing both by 5.

Additional rules from the manager: ${managerRules ?? "None"}
`;

    const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...truncatedHistory,
    ];

    if (msgFrom === "user") {
        messages.push({ role: "user", content: msg });
    } else {
        messages.push({ role: "assistant", content: msg });
    }

    let productsFound = null;
    let filtrationUsed = null;
    let searchQuery = null;
    let uiAction = null;

    try {
        let loopCount = 0;
        const maxLoops = 2;

        while (loopCount < maxLoops) {
            const response = await groq.chat.completions.create({
                model: activeGrokModel,
                messages: sanitizeMessages(messages),
                tools: searchTools as any,
                tool_choice: "auto",
                temperature: 0.1
            });

            const responseMessage = response.choices[0].message;

            if (responseMessage.content && (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0)) {
                messages.push(responseMessage);
                return {
                    content: responseMessage.content,
                    productsFound,
                    filtrationUsed,
                    searchQuery,
                    uiAction,
                    fullHistory: messages
                };
            }

            if (responseMessage.tool_calls) {
                messages.push(responseMessage);
                for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name.split('<')[0].trim();

                    if (toolName === "findProducts") {
                        if (onStatus) onStatus("Searching for products...");
                        const args = JSON.parse(toolCall.function.arguments);
                        searchQuery = args.query || "";

                        let collectionIds: string[] = [];
                        if (args.category && args.category !== 'all') {
                            const coll = await Collection.findOne({
                                $or: [
                                    { "name.en": { $regex: new RegExp(`^${args.category}$`, 'i') } },
                                    { "name.fr": { $regex: new RegExp(`^${args.category}$`, 'i') } }
                                ]
                            }).lean();
                            if (coll) collectionIds.push(coll._id.toString());
                        }

                        const filtration = {
                            price: { from: Number(args.minPrice), to: Number(args.maxPrice) || 1000000 },
                            collections: collectionIds,
                            colors: args.colors || ['all'],
                            sizes: args.sizes || ['all'],
                            types: args.types || ['all'],
                            sortBy: args.sortBy || 'name',
                            sortDirection: args.sortDirection || 'asc'
                        };

                        filtrationUsed = filtration;
                        const results = await getProductsBySearch(searchQuery, Number(args.limit) || 5, Number(args.skip) || 0, filtration) as any;
                        productsFound = results;

                        const leanResults = {
                            products: results.products.slice(0, 5).map((p: any) => ({
                                id: p._id,
                                name: p.name.en || p.name.fr,
                                thumbNail: p.thumbNail,
                                price: p.price,
                                description: p.description.en || p.description.fr,
                                images: p.images.map((img: any) => [{ link: img.uri, specificationId: img?.specification?._id }]),
                                specifications: p.specifications.map((spec: any) => ({
                                    specificationId: spec._id,
                                    color: spec.color,
                                    size: spec.size,
                                    price: spec.price,
                                    quantity: spec.unlimited ? "unlimited" : spec.quantity,
                                    colorHex: spec.colorHex,
                                })),
                            })),
                            total: results.productsCount
                        };

                        messages.push({
                            role: "tool",
                            name: "findProducts",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(leanResults)
                        });

                        // AUTOMATIC NAVIGATION: Always lead to the search page after a product search
                        const encodedFilter = encodeURIComponent(JSON.stringify({
                            price: filtration.price,
                            collections: filtration.collections,
                            colors: filtration.colors.includes('all') ? [] : filtration.colors,
                            types: filtration.types.includes('all') ? [] : filtration.types,
                            sizes: filtration.sizes.includes('all') ? [] : filtration.sizes,
                            sortBy: filtration.sortBy,
                            sortDirection: filtration.sortDirection,
                            activeLanguage: "en" 
                        }));
                        uiAction = { 
                            element: 'navigation', 
                            state: `/search?searchInput=${encodeURIComponent(searchQuery)}&filter=${encodedFilter}` 
                        };
                    }

                    if (toolName === "controlUI") {
                        const args = JSON.parse(toolCall.function.arguments);
                        uiAction = { element: args.element, state: args.state };
                        messages.push({
                            role: "tool",
                            name: "controlUI",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ success: true, message: `${args.element} is now ${args.state}` })
                        });
                    }
                }
                loopCount++;
            } else {
                break;
            }
        }

        const finalResponse = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: sanitizeMessages(messages),
            tool_choice: "auto",
            temperature: 0.7
        });

        const finalResponseMessage = finalResponse.choices[0].message;
        messages.push(finalResponseMessage);

        return {
            content: finalResponseMessage.content,
            productsFound,
            filtrationUsed,
            searchQuery,
            uiAction,
            fullHistory: messages
        };

    } catch (error: any) {
        console.error("SearchAgent Error:", error);
        return {
            content: "I'm sorry, I encountered a technical issue while searching.",
            productsFound: null,
            filtrationUsed: null,
            searchQuery: null,
            fullHistory: messages
        };
    }
};