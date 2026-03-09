import { OpenAI } from "openai";
import { activeOpenRouterModel, openRouterApiKey } from "../../../constent/index.js";
import { getProductsBySearch } from "../../../controller/product.js";
import { searchTools } from "../tools.ts/searchTools.js";

// OpenRouter client setup
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "E-commerce AI Agent",
    }
});

export const searchAgent = async (msg: string, history: any[]) => {
    // 1. Setup message context
    const messages: any[] = [
        {
            role: "system",
            content: `You are a sales expert and smart shopping assistant. Your specialty is only the products available in the store.
            Workflow rules:
            1. If the client asks for the 'best option': use findProducts (max 3 times) to fetch different batches, compare them, then recommend the best.
            2. If the client asks for a 'general search': use the tool once.
            3. Outside produst range: apologize politely.
            4. Do not make up information; instead say you don't know.
            5. Tool usage: you can leave searchText empty, and use 'all' for colors/sizes if not specified.`
        },
        ...history,
        { role: "user", content: msg }
    ];

    let loopCount = 0;
    const maxLoops = 3;

    try {
        while (loopCount < maxLoops) {
            // 2. Request response from OpenRouter
            const response = await openai.chat.completions.create({
                model: activeOpenRouterModel,
                messages: messages,
                tools: searchTools as any,
                tool_choice: "auto"
            });

            const responseMessage = response.choices[0].message;
            messages.push(responseMessage); // Add AI response to context

            // 3. Check for Function Call
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                for (const toolCall of responseMessage.tool_calls) {
                    const functionCall = (toolCall as any).function;

                    if (functionCall) {
                        const args = JSON.parse(functionCall.arguments);
                        const { query, category, maxPrice, colors, sizes, types } = args;


                        // 4. Execute search in database
                        const searchResults = await getProductsBySearch(
                            query || "",
                            5,
                            loopCount * 5,
                            {
                                price: { from: 0, to: maxPrice || 1000000 },
                                collections: category ? [category] : [],
                                colors: colors || ['all'],
                                sizes: sizes || ['all'],
                                types: types || ['all'],
                                sortBy: 'name',
                                sortDirection: 'asc'
                            }
                        );

                        // 5. Send tool result to AI
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(searchResults)
                        });
                    }
                }
                loopCount++;
            } else {
                // If no tool calls, return final text to client
                return responseMessage.content;
            }
        }

        // If loops exhausted without final response, return last AI statement
        return messages[messages.length - 1].content;

    } catch (error) {
        return "Sorry, I'm having trouble accessing products right now. Please try again later.";
    }
};