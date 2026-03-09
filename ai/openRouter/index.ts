import { OpenAI } from "openai";
import { openRouterApiKey, activeOpenRouterModel } from '../../constent/index.js';
import { searchAgent } from './agents/searchAgent.js';
import { supportAgent } from './agents/supportAgent.js';

// OpenRouter client setup
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey, // Use the correct key
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "E-commerce Orchestrator",
    }
});

export const orchestrator = async (msg: string, history: any[]): Promise<string> => {

    // 1. Determine intent using the selected model
    const intent = await determineIntent(msg);


    // 2. Routing based on the result
    // All agents now return Promise<string>
    switch (intent) {
        case 'SEARCH':
        // return await searchAgent(msg, history);
        case 'SUPPORT':
            return await supportAgent(msg, history);
        default:
            return await supportAgent(msg, history);
    }
};

async function determineIntent(msg: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: activeOpenRouterModel,
            messages: [
                {
                    role: "system",
                    content: "Classify the message into ONLY one word: SEARCH or SUPPORT. SEARCH for products, availability, or prices. SUPPORT for greetings, shipping, returns, or general help."
                },
                { role: "user", content: msg }
            ],
            temperature: 0, // Zero to ensure accuracy and avoid chatter
        });

        const content = response.choices[0].message.content?.trim().toUpperCase() || "SUPPORT";

        // Check keywords to ensure no error due to lengthy responses
        if (content.includes("SEARCH")) return "SEARCH";
        return "SUPPORT";

    } catch (error) {
        return "SUPPORT"; // Safety option in case of failure
    }
}