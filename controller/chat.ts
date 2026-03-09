import Chat from "../models/chat.js";

export const getChatsByClient = async (clientId: string) => {
    try {
        return await Chat.find(
            { userId: clientId.toString() },
            { messages: { $slice: -50 } }
        ).sort({ updatedAt: -1 });
    } catch (err) { return []; }
};