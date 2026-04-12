import mongoose from "mongoose";

import { Schema } from 'mongoose';

const messageSchema = new Schema({
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: String, required: false },
    tool_calls: [{
        id: String,
        type: { type: String, default: "function" },
        function: {
            name: String,
            arguments: Schema.Types.Mixed
        }
    }],
    tool_call_id: { type: String, required: false },
    name: { type: String, required: false }
}, { _id: false });

const ChatSchema = new Schema({
    userId: { type: String, required: true, index: true },
    status: { type: String, default: 'active' },
    summary: { type: String, default: "" },
    messages: [messageSchema]
}, { timestamps: true });


const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
