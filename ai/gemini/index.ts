
import { GoogleGenerativeAI } from '@google/generative-ai';
import { activeAiApiKey, activeGeminiModel } from '../../constent/index.js';
import { searchAgent } from './agents/searchAgent.js';
import { summaryAgent } from './agents/summaryAgent.js';
import { supportAgent } from './agents/supportAgent.js';

export const genAI = new GoogleGenerativeAI(activeAiApiKey);

export const orchestrator = async (msg: string, history: any[]) => {

    return searchAgent(msg, history);


    // Quick function to determine intent
    // const intent = await determineIntent(msg);

    // switch (intent) {
    //     case 'SEARCH':
    //         return searchAgent(msg, history);
    //     case 'SUMMARY':
    //         return summaryAgent(msg, history);
    //     default:
    //         return supportAgent(msg, history);
    // }
};

async function determineIntent(msg: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: activeGeminiModel });
    const prompt = `
        Classify the following user message into ONLY one category: [SEARCH] or [SUPPORT].

        - [SEARCH]: If the user is looking for products, asking about prices, or availability.
        - [SUPPORT]: If the user is greeting, asking about shipping, returns, or general help.

        User message: "${msg}"
        Output only the word (SEARCH or SUPPORT).
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}