import { activeGeminiModel } from "../../../constent/index.js";
import { genAI } from "../index.js";

export const supportAgent = async (msg: string, history: any[]) => {
    const model = genAI.getGenerativeModel({ model: activeGeminiModel });

    const chat = model.startChat({
        history: history,
        // Correction: convert text to object containing parts
        systemInstruction: {
            role: "system", // Or "user" in some older versions, but better as object with parts
            parts: [{ text: "You are the customer service assistant for our store. Answer intelligently and politely questions about shipping, delivery, and return policy. If you don't know the answer, ask the customer to wait for a human employee." }],
        } as any, // added 'as any' to avoid type conflicts if version is strict
    });

    const result = await chat.sendMessage(msg);
    return result;
};