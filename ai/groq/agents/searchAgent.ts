import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { getProductsBySearch } from "../../../controller/product.js";
import { searchTools } from "../tools.ts/searchTools.js";
import Collection from "../../../models/collection.js";

const groq = new Groq({ apiKey: activeAiApiKey });

export const searchAgent = async (msg: string, history: any[]) => {
    // 1. Truncate history to save tokens
    const truncatedHistory = history.slice(-6);

    const messages: any[] = [
        {
            role: "system",
            content: `You are a smart shopping assistant.
            Rules:
            1. ONLY use 'findProducts' tool for searching.
            2. 'query' is optional. If the user asks for a category without a name, leave query empty.
            3. After getting results, provide a helpful summary.
            4. When showing products, YOU MUST include the product image using markdown: ![Product Name](image_url).
            5. When showing products, ALWAYS include a link to the product page using this format: [Product Name](/product/id).
            6. NEVER send JSON to the user.`
        },
        ...truncatedHistory,
        { role: "user", content: msg }
    ];

    // Initialize variables at the top to ensure they are returned even if search is skipped
    let productsFound = null;
    let filtrationUsed = null;
    let searchQuery = null;

    try {
        let loopCount = 0;
        const maxLoops = 2;

        while (loopCount < maxLoops) {
            const response = await groq.chat.completions.create({
                model: activeGrokModel,
                messages: messages,
                tools: searchTools as any,
                tool_choice: "auto",
                temperature: 0.1
            });

            const responseMessage = response.choices[0].message;

            // If AI responds with text directly without calling tools
            if (responseMessage.content && (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0)) {
                return {
                    content: responseMessage.content,
                    productsFound,
                    filtrationUsed,
                    searchQuery
                };
            }

            if (responseMessage.tool_calls) {
                messages.push(responseMessage);

                for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name.split('<')[0].trim();

                    if (toolName === "findProducts") {
                        const args = JSON.parse(toolCall.function.arguments);

                        // Capture search data for frontend
                        searchQuery = args.query || "";

                        // Resolve collection if category is provided
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

                        // Build filtration object
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

                        // Execute DB search
                        const results = await getProductsBySearch(
                            searchQuery,
                            Number(args.limit) || 5,
                            Number(args.skip) || 0,
                            filtration
                        ) as any;

                        productsFound = results;

                        console.log(JSON.stringify(results.products.slice(0, 5), null, 2));

                        // Data thinning for AI context
                        const leanResults = {
                            products: results.products.slice(0, 5).map((p: any) => ({
                                id: p._id,
                                name: p.name.en || p.name.fr,
                                thumbNail: p.thumbNail,
                                price: p.price,
                                description: p.description.en || p.description.fr,
                                images: p.images,
                            })),
                            total: results.productsCount
                        };

                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(leanResults)
                        });
                    }
                }
                loopCount++;
            } else {
                break;
            }
        }

        // --- FIXED FINAL CALL ---
        // We remove 'tools' and 'tool_choice' to force a final text summary
        const finalResponse = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: messages,
            temperature: 0.7
        });

        console.log({content: finalResponse.choices[0].message.content});
        

        return {
            content: finalResponse.choices[0].message.content,
            productsFound,
            filtrationUsed,
            searchQuery
        };

    } catch (error: any) {
        return {
            content: "I'm sorry, I encountered a technical issue while searching.",
            productsFound: null,
            filtrationUsed: null,
            searchQuery: null
        };
    }
};