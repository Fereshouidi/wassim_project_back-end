import { Groq } from "groq-sdk";
import { searchAgent } from './agents/searchAgent.js';
import { supportAgent } from './agents/supportAgent.js';
import { activeAiApiKey, activeGrokModel } from "../../constent/index.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});



export const orchestrator = async (msg: string, history: any[], agent?: "SEARCH" | "SUPPORT") => {
    try {
        // 1. Pass history to the function to determine intent based on conversation context
        let intent = null;

        intent = agent ?? "SUPPORT";

        switch (intent) {
            case 'SEARCH':
                return await searchAgent(msg, history);

            case 'SUPPORT':
                return await supportAgent(msg, history);

            default:
                return await supportAgent(msg, history);
        }
    } catch (error: any) {
        if (error.status === 429) {
            return "The system is currently experiencing high load, please resend your message in a few seconds.";
        }
        return "Sorry, an unexpected error occurred. How else can I help you?";
    }
};

async function determineIntent(msg: string, history: any[]): Promise<string> {
    try {
        // 1. Shrink history to send only the last 4-5 messages to save Tokens and maintain focus
        const recentHistory = history.slice(-5);

        const response = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: [
                {
                    role: "system",
                    content: `You are a Context Analyzer for an E-commerce store. 
                    Your goal is to decide which agent should handle the user's request based on the WHOLE conversation.

                    RULES:
                    1. Use "SEARCH" if the user is looking for products, asking about prices, sizes, availability, or showing interest in buying (e.g., "how much", "do you have this", "show me more").
                    2. Use "SUPPORT" if the user is asking about delivery status, store location, payment methods, or general help.
                    3. CRITICAL: If the user previously asked about a product and now says "and the blue one?" or "is it available?", it is still "SEARCH".

                    Reply with ONLY one word: "SEARCH" or "SUPPORT".`
                },
                ...recentHistory,
                { role: "user", content: msg }
            ],
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
