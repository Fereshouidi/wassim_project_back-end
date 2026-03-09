import { activeGeminiModel } from "../../../constent/index.js";
import { getProductsBySearch } from "../../../controller/product.js";
import Collection from "../../../models/collection.js";
import { genAI } from "../index.js";
import { searchTools } from "../tools.ts/searchTools.js";

export const searchAgent = async (msg: string, history: any[]) => {
    const model = genAI.getGenerativeModel({
        model: activeGeminiModel,
        tools: [searchTools]
    });

    // Correct history to ensure it doesn't start with 'model' to comply with Gemini policy
    let safeHistory = [...history];
    if (safeHistory.length > 0 && safeHistory[0].role === 'model') {
        safeHistory.shift();
    }

    const chat = model.startChat({
        history: safeHistory,
        systemInstruction: {
            role: "system",
            parts: [{
                text: `You are a sales expert and smart shopping assistant. Your specialty is only the products available in the store.

            Workflow and search rules:
            1. If the client asks for the 'best option' or 'a recommendation': fetch several batches of products using findProducts (max 3 times), compare them, then present the best.
            2. If the client asks to 'explore' or 'search' in general: use the tool once and show the available results in an organized way.
            3. If the client asks for anything "outside product range": apologize politely and tell them you are specialized only in helping them shop.
            4. Always use findProducts tool to get real information; do not make up products from imagination.
            5. Handling the search tool:
            - You can leave search text (searchText) empty if the client is searching by filtering only.
            - Search text automatically searches in names and descriptions in both English and French.
            - Categories (category) should be text names (e.g., rings, bagues).` }],
        } as any,
    });

    let currentResponse = await chat.sendMessage(msg);

    let loopCount = 0;
    const maxLoops = 3;

    while (loopCount < maxLoops) {
        const functionCalls = currentResponse.response.functionCalls();

        // Check if there are actually function calls
        if (!functionCalls || functionCalls.length === 0) {
            break; // Exit loop if no more Function Calls
        }

        // Now TypeScript is sure functionCalls exists and has length
        const call = functionCalls[0];

        if (call.name === "findProducts") {
            const args = call.args as { query?: string; category?: string; maxPrice?: number };
            const { query, category, maxPrice } = args;

            let collectionIds: string[] = [];

            // Collection ID search logic (same as previous code)
            if (category && category !== 'all') {
                const foundCollection = await Collection.findOne({
                    $or: [
                        { "name.en": { $regex: new RegExp(`^${category}$`, 'i') } },
                        { "name.fr": { $regex: new RegExp(`^${category}$`, 'i') } }
                    ]
                });
                if (foundCollection) {
                    collectionIds.push(foundCollection._id.toString());
                }
            }

            const searchResults = await getProductsBySearch(
                query || "",
                5,
                loopCount * 5,
                {
                    price: { from: 0, to: maxPrice || 1000000 },
                    collections: collectionIds,
                    sortBy: 'name',
                    sortDirection: 'asc'
                } as any
            );

            // Send response
            currentResponse = await chat.sendMessage([
                {
                    functionResponse: {
                        name: "findProducts",
                        response: { results: searchResults }
                    }
                }
            ]);
        }

        loopCount++;
    }

    return currentResponse;
};