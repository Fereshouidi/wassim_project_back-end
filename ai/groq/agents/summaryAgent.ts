import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel, numOfMessageToSummary } from "../../../constent/index.js";
import { sanitizeMessages } from "../utils.js";

const groq = new Groq({
    apiKey: activeAiApiKey
});


export const summaryAgent = async (msg: string): Promise<string> => {
    try {

        console.log("summaryAgent", msg);

        const response = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: sanitizeMessages([
                {
                    role: "system",
                    content: `You are an expert in text compression. 
                    Your task: summarize the conversation between two parties (a customer and an AI assistant working in a shopping store). 
                    Rules: 
                    1. Keep the essential information (products, budget, preferences). 
                    2. Make the response 'very short' to minimize future memory use. 
                    3. Each time, you will receive a summarized conversation along with additional messages between the two parties, and your task is to summarize those messages and then merge the old summary with the new one without repeating information and without losing the important information and without making the summary long.
                    4. example of data : "Olde: user start the conversation by asking who is the assistant, the assistant answer that he is the helper of a store called silver way, then the user said he wanna buy a promise ring between 70 dt and 90 dt , the assistant gave him 5 options then he chose the "promise ring" so assistant said that's a gret chose . 
                    new: {
                        "role": "user",
                        "content": "ok put it in my cart"
                    },
                    {
                        "role": "assistant",
                        "content": "ok , i put it in your cart"
                    }
                    "
                    5. example of output : "the user start the conversation by asking who is the assistant, the assistant introduced himself, then the user said he wanna buy a promise ring between 70 dt and 90 dt , the assistant gave him 5 options then he chose the "promise ring" so assistant said that's a gret chose , then the user asked him to put it in his cart and the assistant did it"

                    `
                },
                { role: "user", content: `Summarize the following conversation: ${msg}` }
            ]),
            // Low temperature to ensure no hallucination and maintain technical accuracy
            temperature: 0.1,
            max_tokens: 500 // سقف كافٍ جداً لملخص مركز
        });

        // Return text directly as in previous version for easy handling in Controller
        return response.choices[0]?.message?.content || "";

    } catch (error: any) {
        console.log(error);
        
        // Handle congestion error (Rate Limit) to ensure system doesn't stop
        if (error.status === 429) {
            return ""; // Return empty text to avoid breaking the core process
        }

        return "Failed to update summary currently.";
    }
};