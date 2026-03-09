import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/chat.js';
import { numOfMessageToSummary } from '../constent/index.js';
import { orchestrator } from '../ai/groq/index.js';
import { summaryAgent } from '../ai/groq/agents/summaryAgent.js';

export const getAnswerFromAi = async (req: express.Request, res: express.Response) => {
    const { userId, message, agent } = req.body;

    // Protection: Ensure userId exists to avoid creating anonymous sessions
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // 1. Get active session
        let session = await Chat.findOne({ userId, status: 'active' });

        if (!session) {
            const newId = new mongoose.Types.ObjectId();

            // Solution: use { strict: false } to force Mongoose to accept sessionId
            // even if it's not present in the Schema file
            session = new Chat({
                _id: newId,
                userId,
                messages: [],
                summary: "",
                status: 'active'
            });

            // Force the field to pass to the database
            session.set('sessionId', newId.toString(), { strict: false });

            try {
                await session.save();
            } catch (saveErr: any) {
                // If a Duplicate Key error occurs, it means there is an old record with null that must be deleted
                if (saveErr.code === 11000) {
                    await Chat.deleteMany({ sessionId: null }); // Clean damaged records
                    await session.save(); // Try again
                } else {
                    throw saveErr;
                }
            }
        }

        // 2. Build History (previous logic is correct)
        let history: any[] = [];
        if (session.summary && session.summary.trim() !== "") {
            history.push({ role: "user", content: `Context: ${session.summary}` });
            history.push({ role: "assistant", content: "Understood." });
        }

        const contextWindow = session.messages.slice(-numOfMessageToSummary);
        const cleanedHistory = contextWindow.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        history = [...history, ...cleanedHistory];
        if (history.length > 0 && history[0].role === 'assistant') history.shift();

        // 3. Call Orchestrator
        const aiResponse = await orchestrator(message, history, agent) as any;

        let fullAiText = "";
        let uiAction = null;
        let productsFound = null;
        let filtrationUsed = null;
        let searchQuery = null;

        if (typeof aiResponse === 'string') {
            fullAiText = aiResponse;
        } else if (aiResponse && typeof aiResponse === 'object') {
            fullAiText = aiResponse.content || "";
            uiAction = aiResponse.uiAction || null;
            productsFound = aiResponse.productsFound || null;
            filtrationUsed = aiResponse.filtrationUsed || null;
            searchQuery = aiResponse.searchQuery || null
        }

        fullAiText = fullAiText || "Sorry, I couldn't formulate a response right now.";

        // 4. Save messages
        session.messages.push({ role: "user", content: message } as any);
        session.messages.push({ role: "assistant", content: fullAiText } as any);

        // 5. Summarization logic
        if (session.messages.length % numOfMessageToSummary === 0) {
            try {
                const interactions = session.messages.slice(-numOfMessageToSummary)
                    .map(m => `${m.role}: ${m.content}`).join("\n");
                const newSummary = await summaryAgent(`Old: ${session.summary}\nNew: ${interactions}`);
                if (newSummary) session.summary = newSummary;
            } catch (sumErr) {
            }
        }

        await session.save();

        // 6. Final response
        return res.status(200).json({
            answer: fullAiText,
            uiAction: uiAction,
            // productsFound,
            filtrationUsed,
            searchQuery,
            sessionId: (session as any).get ? (session as any).get('sessionId') : session._id
        });

    } catch (err: any) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getChatHistory_ = async (req: express.Request, res: express.Response) => {
    try {
        const { clientId, limit, skip } = req.body;

        const limitNum = parseInt(limit as string) || 20;
        const skipNum = parseInt(skip as string) || 0;

        if (!clientId) {
            return res.status(400).json({ message: "Client ID is required" });
        }

        // Fetch conversation and use $slice to get messages from the end (newest)
        // [ - (skip + limit), limit ] means start from the end by a certain amount and get a certain number
        const chat = await Chat.findOne(
            { userId: clientId },
            { messages: { $slice: [-(skipNum + limitNum), limitNum] } }
        );

        if (!chat) {
            return res.status(200).json([]);
        }

        // Return the full chat object so the manager gets the summary field too
        res.status(200).json(chat);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};