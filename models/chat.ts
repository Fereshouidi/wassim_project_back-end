import mongoose from "mongoose";

import { Schema } from 'mongoose';

const messageSchema = new Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true }
}, { _id: false });

const ChatSchema = new Schema({
    userId: { type: String, required: true, index: true },
    status: { type: String, default: 'active' },
    summary: { type: String, default: "" },
    messages: [messageSchema]
}, { timestamps: true });


const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
