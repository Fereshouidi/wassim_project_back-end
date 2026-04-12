import Chat from "../models/chat.js";

export const getChatsByClient = async (clientId: string) => {
    try {
        return await Chat.find(
            { userId: clientId.toString() },
            { messages: { $slice: -50 } }
        ).sort({ updatedAt: -1 });
    } catch (err) { return []; }
};

export const updateChat = async (clientId: string, messages: any[]) => {
    try {
        return await Chat.updateOne(
            { userId: clientId.toString() },
            { $push: { messages: { $each: messages } } }
        );
    } catch (err) { return null; }
};