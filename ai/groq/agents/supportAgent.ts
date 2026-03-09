import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { supportTools } from "../tools.ts/supportTools.js";
import { searchAgent } from "./searchAgent.js";
import { getOwnerInfo } from "../../../controller/ownerInfo.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});

export const supportAgent = async (msg: string, history: any[]): Promise<any> => {
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
                    1. If the user asks about the "shopping cart", use the 'controlUI' tool.
                    2. If the user asks about "products, prices, availability, or search", use the 'searchProducts' tool immediately so the search expert can assist them.
                    3. Do not try to answer product-specific questions from imagination; always redirect to searchProducts.
                    this is more rules from the manager : ${managerRules?? "there is no rules from the manager"}
                `
            },
            ...safeHistory,
            { role: "user", content: msg }
        ];

        const response = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: messages,
            tools: supportTools,
            tool_choice: "auto",
            temperature: 0.5,
        });

        const responseMessage = response.choices[0]?.message;

        if (responseMessage.tool_calls) {
            const toolCall = responseMessage.tool_calls[0];
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            // --- التحويل إلى searchAgent ---
            if (functionName === "searchProducts") {
                return await searchAgent(msg, history);
            }

            // --- منطق controlUI الأصلي ---
            if (functionName === "controlUI") {
                messages.push(responseMessage);
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ success: true, message: `${args.element} is now ${args.state}` })
                });

                const secondResponse = await groq.chat.completions.create({
                    model: activeGrokModel,
                    messages: messages
                });

                return {
                    content: secondResponse.choices[0]?.message?.content,
                    uiAction: { element: args.element, state: args.state }
                };
            }
        }

        return {
            content: responseMessage?.content || "How can I help you?",
            uiAction: null
        };

    } catch (error: any) {
        return { content: "Sorry, I encountered a technical issue.", uiAction: null };
    }
};