import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});


export const summaryAgent = async (msg: string, history: any[] = []): Promise<string> => {
    try {
        // Clean history to ensure compatibility (Always start from user side)
        let safeHistory = [...history];
        if (safeHistory.length > 0 && safeHistory[0].role === 'assistant') {
            safeHistory.shift();
        }

        const response = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: [
                {
                    role: "system",
                    content: `You are an expert in text compression. Your task: summarize the conversation between two parties (a customer and an AI assistant working in a shopping store). Rules: 1. Keep the essential information (products, budget, preferences). 2. Make the response 'very short' to minimize future memory use. 3. Each time, you will receive a summarized conversation along with additional messages between the two parties, and your task is to summarize those messages and then merge the old summary with the new one without repeating information and without making the summary long.
                    `
                },
                ...safeHistory,
                { role: "user", content: `Summarize the following conversation: ${msg}` }
            ],
            // Low temperature to ensure no hallucination and maintain technical accuracy
            temperature: 0.1,
            max_tokens: 500 // سقف كافٍ جداً لملخص مركز
        });

        // Return text directly as in previous version for easy handling in Controller
        return response.choices[0]?.message?.content || "";

    } catch (error: any) {
        // Handle congestion error (Rate Limit) to ensure system doesn't stop
        if (error.status === 429) {
            return ""; // Return empty text to avoid breaking the core process
        }

        return "Failed to update summary currently.";
    }
};