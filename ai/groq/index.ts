import { Groq } from "groq-sdk";
import { searchAgent } from './agents/searchAgent.js';
import { supportAgent } from './agents/supportAgent.js';
import { OrderManagerAgent } from './agents/OrderManagerAgent.js';
import { activeAiApiKey, activeGrokModel } from "../../constent/index.js";
import Client from "../../models/client.js";
import { sanitizeMessages } from "./utils.js";
import { ClientType, MessageType } from "../../types/index.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});

export const orchestrator = async (
    msg: string, 
    history: MessageType[], 
    summary: string,
    clientId: string, 
    agent?: "SEARCH" | "SUPPORT" | "ORDERS",
    onStatus?: (status: string) => void
) => {
    try {

        // sharedMemory = history.slice(-10);

        console.log("--- ORCHESTRATOR CALLED ---", { msg, clientId, agent });
        // 1. Pass history to the function to determine intent based on conversation context
        let intent = agent;
        if (!intent) {
            intent = await determineIntent(msg, history) as any;
        }

        const client = await Client.findOne({ _id: clientId }).select("fullName email phone") as unknown as ClientType

        console.log({ client });
        // console.log({sharedMemory});


        switch (intent) {
            case 'SEARCH':
                if (onStatus) onStatus("Searching for products...");
                return await searchAgent("user", msg, history, clientId, onStatus);

            case 'ORDERS':
                return await OrderManagerAgent("user", msg, history, client, onStatus);

            case 'SUPPORT':
                return await supportAgent("user", msg, history, summary, client, onStatus);

            default:
                return await supportAgent("user", msg, history, summary, client, onStatus);
        }
    } catch (error: any) {
        console.error("Orchestrator Error:", error);

        if (error.status === 429) {
            return { content: "The system is currently experiencing high load, please resend your message in a few seconds." };
        }
        return { content: "Sorry, an unexpected error occurred. How else can I help you?" };
    }
};

async function determineIntent(msg: string, history: any[]): Promise<string> {
    try {
        // 1. Shrink history to send only the last 4-5 messages to save Tokens and maintain focus
        const recentHistory = history.slice(-5);

        const response = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: sanitizeMessages([
                {
                    role: "system",
                    content: `You are a Context Analyzer for an E-commerce store. 
                    Your goal is to decide which agent should handle the user's request based on the WHOLE conversation.

                    RULES:
                    1. Use "SEARCH" if the user is looking for products, asking about prices, sizes, availability, or showing interest in buying (e.g., "how much", "do you have this", "show me more").
                    2. Use "ORDERS" if the user is asking about their orders, delivery status, order history, or "where is my stuff".
                    3. Use "SUPPORT" for general store info, location, payment methods, or help.
                    4. CRITICAL: If the user previously asked about a product and now says "and the blue one?" or "is it available?", it is still "SEARCH".

                    Reply with ONLY one word: "SEARCH", "ORDERS", or "SUPPORT".`
                },
                ...recentHistory,
                { role: "user", content: msg }
            ]),
            temperature: 0, // To ensure stability in response
            max_tokens: 5,
        });

        const aiDecision = response.choices[0]?.message?.content?.trim().toUpperCase() || "SUPPORT";

        // 2. Improve manual logic (Heuristics) to be complementary, not dominant
        const searchKeywords = ['دينار', 'سعر', 'بكم', 'price', 'dt', 'اشتري', 'متوفر', 'قياس', 'لون'];
        const isManualSearch = searchKeywords.some(keyword => msg.toLowerCase().includes(keyword));

        // Final Analysis: We trust AI if it understood the context, and use manual as extra safety
        if (aiDecision.includes("SEARCH") || isManualSearch) {
            return "SEARCH";
        }

        return "SUPPORT";

    } catch (error) {
        return "SUPPORT";
    }
}
