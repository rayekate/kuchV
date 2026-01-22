import { io } from "../../app.js";
import Notification from "./notification.model.js";
import User from "../user/user.model.js";
import { sendTelegramMessage } from "../../config/telegram.service.js";

/**
 * Send a real-time notification to a specific user.
 * Persists to DB + Socket.IO + Telegram (if configured)
 * @param {string} userId - The user's ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} type - 'info', 'success', 'warning', 'error', 'deposit', etc.
 */
export const sendNotification = async (userId, title, message, type = 'info') => {
  try {
    // 1. Create & Persist Notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
      isGlobal: false
    });

    // 2. Real-time Socket Emission
    if (io) {
      const payload = {
        _id: notification._id,
        title,
        message,
        type,
        isRead: false,
        createdAt: notification.createdAt
      };
      
      // Emit to specific user room (client joins 'user:ID')
      io.to(`user:${userId}`).emit("notification", payload);
    } else {
      console.warn("Socket.io instance not found, skipping socket emission");
    }

    // 3. Telegram Notification (Async, don't await/block)
    (async () => {
        try {
            const user = await User.findById(userId).select("telegramChatId notificationPreferences");
            
            // Check if user exists and has Telegram configured
            if (user && user.telegramChatId) {
                // Check if this type of notification is enabled by user
                // Map generic types to preferences if needed. 
                // For now, valid mappings: deposit -> deposit, security -> security
                // info/success/warning/error -> platform
                
                let shouldSend = true;
                if (user.notificationPreferences) {
                    if (['deposit', 'withdrawal'].includes(type) && !user.notificationPreferences.deposit) shouldSend = false;
                    if (type === 'security' && !user.notificationPreferences.security) shouldSend = false;
                    // platform default for others
                    if (['info', 'success', 'warning', 'error', 'system'].includes(type) && !user.notificationPreferences.platform) shouldSend = false;
                }

                if (shouldSend) {
                     const iconMap = {
                        success: '✅',
                        error: '❌',
                        warning: '⚠️',
                        info: 'ℹ️',
                        deposit: '💰',
                        withdrawal: '💸',
                        profit: '📈'
                    };
                    const icon = iconMap[type] || '🔔';

                    const telegramText = `<b>${icon} ${title}</b>\n\n${message}`;
                    await sendTelegramMessage(user.telegramChatId, telegramText);
                }
            }
        } catch (tgError) {
            console.error("[NOTIFICATION] Telegram send failed:", tgError.message);
        }
    })();

  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};
