import { OpenAI } from "openai";
import { activeOpenRouterModel, openRouterApiKey } from "../../../constent/index.js";

// OpenRouter client setup
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey, // Correction: use the key, not the model
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "E-commerce AI Agent",
    }
});

export const summaryAgent = async (msg: string): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model: activeOpenRouterModel,
            messages: [
                {
                    role: "system",
                    content: `You are a text and conversation compression expert.
                    Mission: Accurately summarize the conversation passed to you.
                    Important Rules:
                    1. Do not lose essential data (product names, budget, preferences, problems).
                    2. Make the summary short and focused in bullet points or a dense paragraph.
                    3. Merge new information with the old summary if it exists to create a "cumulative memory" for the user.`
                },
                {
                    role: "user",
                    content: `Summarize this data: ${msg}`
                }
            ],
            temperature: 0.3,
        });

        // Return summarized text or empty text as protection
        return response.choices[0].message.content || "";

    } catch (error) {
        console.error("Summary Agent Error:", error);
        return "Summary failed, I'll try again later.";
    }
};