import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { supportTools } from "../tools.ts/supportTools.js";
import { searchAgent } from "./searchAgent.js";
import { getOwnerInfo } from "../../../controller/ownerInfo.js";
import { CartManagerAgent } from "./CartManagerAgent.js";
import { OrderManagerAgent } from "./OrderManagerAgent.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});

import { sanitizeMessages } from "../utils.js";
import { ClientType } from "../../../types/index.js";

export const supportAgent = async (msgFrom: "user" | "assistant", msg: string, history: any[], summary: string, client: ClientType, onStatus?: (status: string) => void): Promise<any> => {
    try {
        let safeHistory = [...history];
        if (safeHistory.length > 0 && safeHistory[0].role === 'assistant') {
            safeHistory.shift();
        }

        const info = await getOwnerInfo();
        const managerRules = info?.aiPrompt || "";

        const messages: any[] = [
            {
                role: "system",
                content: `
                    You are a customer service assistant for Silverway store.
                    1. you will be talking to a client with this data : ${JSON.stringify(client)}.
                    2. If the user asks about the "shopping cart", "sidebar", or "theme", or wants to navigate to a specific page (like "home", "account", "profile", "collections", "contact"), use the 'controlUI' tool.
                    3. If the user wants to add or remove or edit an item in the cart, use the 'manageCart' tool immediately.
                    4. If the user asks about "products, prices, availability, or search", use the 'searchProducts' tool immediately so the search expert can assist them.
                    5. For navigation: use element: 'navigation' and state: '/path'. (e.g., '/', '/account', '/collections', '/pages/contactUs').
                    6. **IMPORTANT:** When navigating to the search page for "all products", ALWAYS use this exact path: '/search?searchInput=&filter=%7B%22price%22%3A%7B%22from%22%3A0%2C%22to%22%3A10000%7D%2C%22collections%22%3A%5B%5D%2C%22colors%22%3A%5B%5D%2C%22types%22%3A%5B%5D%2C%22sizes%22%3A%5B%5D%2C%22sortBy%22%3A%22price%22%2C%22sortDirection%22%3A%22asc%22%2C%22activeLanguage%22%3A%22en%22%7D' (never use just '/search').
                    
                    this is more rules from the manager : ${managerRules ?? "there is no rules from the manager"}
                    this is a summary of the conversation so far : ${summary}
                `
            },
            ...safeHistory,

        ];

        if (msgFrom === "user") {
            messages.push({ role: "user", content: msg });
        } else {
            messages.push({ role: "assistant", content: msg });
        }

        let loopCount = 0;
        const maxLoops = 5;
        const uiActions: any[] = [];

        while (loopCount < maxLoops) {
            const response = await groq.chat.completions.create({
                model: activeGrokModel,
                messages: sanitizeMessages(messages),
                tools: supportTools,
                tool_choice: "auto",
                temperature: 0.5,
            });

            const responseMessage = response.choices[0]?.message;
            if (!responseMessage) throw new Error("No response message from AI");

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                messages.push(responseMessage);
                let hadHandover = false;
                let handoverResponse: any = null;

                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    if (functionName === "searchProducts") {
                        console.log("Handover to searchProducts");
                        if (onStatus) onStatus("Searching for products...");
                        const clientId = client?._id?.toString() || client?.toString() || "";
                        if (clientId) {
                            hadHandover = true;
                            handoverResponse = await searchAgent(msgFrom, msg, history, clientId);
                        }
                    } else if (functionName === "manageCart") {
                        console.log("Handover to manageCart");
                        if (onStatus) onStatus("Managing your cart...");
                        const clientId = client?._id?.toString() || client?.toString() || "";
                        if (clientId) {
                            hadHandover = true;
                            //@ts-ignore
                            handoverResponse = await CartManagerAgent(msgFrom, msg, history, clientId, onStatus);
                        }
                    } else if (functionName === "manageOrders") {
                        console.log("Handover to OrderManagerAgent");
                        if (onStatus) onStatus("Checking orders...");
                        hadHandover = true;
                        handoverResponse = await OrderManagerAgent(msgFrom, msg, history, client, onStatus);
                    } else if (functionName === "controlUI") {
                        uiActions.push({ element: args.element, state: args.state });
                        messages.push({
                            role: "tool",
                            name: "controlUI",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ success: true, message: `${args.element} is now ${args.state}` })
                        });
                    }
                }

                if (hadHandover && handoverResponse) {
                    return {
                        ...handoverResponse,
                        uiAction: uiActions.length > 0 ? uiActions : handoverResponse.uiAction
                    };
                }

                loopCount++;
                continue; // Process next turn (likely for text summary)
            } else {
                // No more tool calls, return text content
                messages.push(responseMessage);
                return {
                    content: responseMessage?.content || "How can I help you?",
                    uiAction: uiActions.length > 0 ? uiActions : null,
                    fullHistory: messages
                };
            }
        }

        // Fallback if maxLoops reached
        return {
            content: "I've updated the interface as requested. How else can I help you?",
            uiAction: uiActions.length > 0 ? uiActions : null,
            fullHistory: messages
        };

    } catch (error: any) {
        console.log({ error });
        return { content: "Sorry, I encountered a technical issue.", uiAction: null };
    }
};