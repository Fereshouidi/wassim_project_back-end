import { activeGeminiModel } from "../../../constent/index.js";
import { genAI } from "../index.js";

export const summaryAgent = async (msg: string, history: any[] = []) => {
    try {
        const model = genAI.getGenerativeModel({
            model: activeGeminiModel,
            // Placing instructions here is more stable in Gemini than inside startChat
            systemInstruction: "You are a text and conversation compression expert. Your mission is to accurately summarize the data passed to you while maintaining essential information (products, budget, preferences)."
        });

        // Ensure history always starts with 'user' if not empty
        let safeHistory = history;
        if (safeHistory.length > 0 && safeHistory[0].role === 'model') {
            safeHistory.shift();
        }

        const chat = model.startChat({
            history: safeHistory,
        });

        const result = await chat.sendMessage(msg);

        // Return text directly for easy handling in Controller
        return result.response.text();

    } catch (error) {
        console.error("Summary Agent Error:", error);
        return "Failed to create summary currently.";
    }
};