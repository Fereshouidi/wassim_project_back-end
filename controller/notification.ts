import Notification from "../models/notification.js";
import { Request, Response } from "express";

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 20;

        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('client')
            .populate('product');

        const total = await Notification.countDocuments();

        res.status(200).json({ success: true, notifications, total });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching notifications" });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const unreadCount = await Notification.countDocuments({ isRead: false });
        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error counting unread notifications" });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error marking as read" });
    }
};

export const createNotification = async (
    title: string,
    body: string,
    type: string,
    linkInfo?: string,
    clientStr?: string,
    productStr?: string,
    actionDetails?: any
) => {
    try {
        const newNotification = new Notification({
            title,
            body,
            type,
            linkInfo,
            client: clientStr || null,
            product: productStr || null,
            clientId: clientStr || null,
            productId: productStr || null,
            actionDetails: actionDetails || {}
        });
        await newNotification.save();

        const count = await Notification.countDocuments();
        if (count > 100) {
            const oldestNotifications = await Notification.find()
                .sort({ createdAt: 1 })
                .limit(count - 100);
            
            if (oldestNotifications.length > 0) {
                const idsToDelete = oldestNotifications.map(n => n._id);
                await Notification.deleteMany({ _id: { $in: idsToDelete } });
            }
        }
    } catch (e) {
        console.log("Failed to create notification", e);
    }
}
