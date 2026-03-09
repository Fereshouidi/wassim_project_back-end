import { OpenAI } from "openai";
import { activeOpenRouterModel, openRouterApiKey } from "../../../constent/index.js";

// OpenRouter client setup
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey, // Correction: use the key, not the model
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "E-commerce Support Agent",
    }
});

export const supportAgent = async (msg: string, history: any[]): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model: activeOpenRouterModel,
            messages: [
                {
                    role: "system",
                    content: "You are the customer service assistant for our store. Answer intelligently and politely questions about shipping, delivery, and return policy. If you don't know the answer, ask the customer to wait for a human employee and do not make up information."
                },
                ...history,
                { role: "user", content: msg }
            ],
            temperature: 0.7,
        });

        // Return text directly or empty text as protection
        return response.choices[0].message.content || "";

    } catch (error) {
        console.error("Support Agent Error:", error);
        return "Sorry, I'm having trouble connecting to customer service right now. Please try again later.";
    }
};