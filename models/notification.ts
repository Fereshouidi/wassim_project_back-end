import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        type: {
            type: String, // 'new_client', 'add_to_cart', 'remove_from_cart', 'like', etc.
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        linkInfo: {
            type: String, // Useful to navigate if needed (client id, purchase id, etc)
            default: null
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            default: null
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null
        },
        actionDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
