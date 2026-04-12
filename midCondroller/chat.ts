import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/chat.js';
import { numOfMessageToSummary } from '../constent/index.js';
import { orchestrator } from '../ai/groq/index.js';
import { summaryAgent } from '../ai/groq/agents/summaryAgent.js';

export const getAnswerFromAi = async (req: express.Request, res: express.Response) => {
    const { userId, message, agent } = req.body;

    console.log({ aaaaaaaaaa: "aaaaaaaaaaaa" });


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
            history.push({ role: "system", content: `Context: ${session.summary}` });
        }

        const contextWindow = session.messages.slice(-15);
        const cleanedHistory = contextWindow.map(msg => {
            const m: any = {
                role: msg.role,
                content: msg.content || ""
            };
            if (msg.role === 'assistant' && (msg as any).tool_calls) {
                m.tool_calls = (msg as any).tool_calls;
            } else if (msg.role === 'tool' && (msg as any).tool_call_id) {
                m.tool_call_id = (msg as any).tool_call_id;
                m.name = (msg as any).name;
            }
            return m;
        });

        history = [...history, ...cleanedHistory];
        if (history.length > 0 && history[0].role === 'assistant') history.shift();

        // 3. Call Orchestrator with SSE status feedback
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const onStatus = (status: string) => {
            res.write(`event: status\ndata: ${JSON.stringify({ message: status })}\n\n`);
        };

        console.log("CRAB: Calling Orchestrator with message ->", message);
        const aiResponse = await orchestrator(message, history, session.summary, userId, agent, onStatus) as any;
        console.log("CRAB: Orchestrator responded.");

        let fullAiText = "";
        let uiAction = null;
        let productsFound = null;
        let filtrationUsed = null;
        let searchQuery = null;
        let fullHistory = null;
        let cartChanged = false;

        if (typeof aiResponse === 'string') {
            fullAiText = aiResponse;
        } else if (aiResponse && typeof aiResponse === 'object') {
            fullAiText = aiResponse.content || "";
            uiAction = aiResponse.uiAction || null;
            productsFound = aiResponse.productsFound || null;
            filtrationUsed = aiResponse.filtrationUsed || null;
            searchQuery = aiResponse.searchQuery || null;
            fullHistory = aiResponse.fullHistory || null;
            cartChanged = aiResponse.cartChanged || false;
        }

        fullAiText = fullAiText || "Sorry, I couldn't formulate a response right now.";

        // 4. Save messages (Preserving full tool history)
        if (fullHistory && Array.isArray(fullHistory)) {
            let indexOfUserMsg = -1;
            for (let i = fullHistory.length - 1; i >= 0; i--) {
                if (fullHistory[i].role === 'user' && (fullHistory[i].content?.trim() === message.trim() || fullHistory[i].content?.includes(message.trim()))) {
                    indexOfUserMsg = i;
                    break;
                }
            }
            const messagesToSave = indexOfUserMsg !== -1 ? fullHistory.slice(indexOfUserMsg + 1) : fullHistory;
            session.messages.push({ role: "user", content: message } as any);
            messagesToSave.forEach((m: any) => {
                const sessionMsg: any = { role: m.role, content: m.content || "" };
                if (m.role === 'assistant' && m.tool_calls) sessionMsg.tool_calls = m.tool_calls;
                else if (m.role === 'tool' && m.tool_call_id) {
                    sessionMsg.tool_call_id = m.tool_call_id;
                    sessionMsg.name = m.name;
                }
                session.messages.push(sessionMsg as any);
            });
        } else {
            session.messages.push({ role: "user", content: message } as any);
            session.messages.push({ role: "assistant", content: fullAiText } as any);
        }

        // 5. Summarization & Cleaning
        if (session.messages.length >= numOfMessageToSummary && session.messages.length % numOfMessageToSummary === 0) {
            try {
                const interactions = session.messages.slice(-numOfMessageToSummary)
                    .filter(m => m.role !== 'system')
                    .map(m => `${m.role}: ${m.content || (m.tool_calls ? "called tool " + m?.tool_calls[0]?.function?.name : "")}`).join("\n")
                const newSummary = await summaryAgent(`Old Summary: ${session.summary}\nNew Interactions:\n${interactions}`);
                if (newSummary && !newSummary.includes("Failed")) session.summary = newSummary;
            } catch (sumErr) {
                console.error("Summarization failed:", sumErr);
            }
        }

        await session.save();

        // 6. Final SSE response
        res.write(`event: answer\ndata: ${JSON.stringify({
            answer: fullAiText,
            uiAction,
            filtrationUsed,
            searchQuery,
            cartChanged,
            sessionId: (session as any).get ? (session as any).get('sessionId') : session._id
        })}\n\n`);

        res.end();
        return;

    } catch (err: any) {
        console.log({ err });
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