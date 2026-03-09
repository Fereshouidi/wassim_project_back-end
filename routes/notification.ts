import express from "express";
import { getNotifications, getUnreadCount, markAsRead } from "../controller/notification.js";

const router = express.Router();

router.get("/getNotifications", getNotifications);
router.get("/getUnreadNotificationCount", getUnreadCount);
router.put("/markNotificationsAsRead", markAsRead);

export default router;
