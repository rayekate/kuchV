import axios from 'axios';
import { Settings } from '../settings/settings.model.js';

/**
 * Send a message to the admin via Telegram
 * @param {string} message - The message to send
 */
export const sendTelegramAdminNotification = async (message) => {
    try {
        console.log("[TELEGRAM] Fetching settings...");
        const settings = await Settings.getSingleton();

        console.log(`[TELEGRAM] Settings loaded. Enabled: ${settings.enableTelegramNotifications}, Token present: ${!!settings.telegramBotToken}, AdminIDs: ${settings.telegramAdminIds}`);

        if (!settings.enableTelegramNotifications) {
            console.log("[TELEGRAM] Notifications are disabled in settings.");
            return;
        }

        const token = settings.telegramBotToken;
        let adminIds = settings.telegramAdminIds; // Comma-separated list
        
        // Fallback to Channel ID if Admin IDs are missing
        if (!adminIds && settings.telegramChannelId) {
            console.log(`[TELEGRAM] Admin IDs missing, using Channel ID: ${settings.telegramChannelId}`);
            adminIds = settings.telegramChannelId;
        }

        if (!token || !adminIds) {
            console.warn(`[TELEGRAM] Missing configuration. Token: ${!!token}, AdminIDs: ${adminIds}`);
            return;
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const ids = adminIds.split(',').map(id => id.trim()).filter(id => id);

        for (const chatId of ids) {
            try {
                await axios.post(url, {
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                });
                console.log(`[TELEGRAM] Notification sent to admin ${chatId}.`);
            } catch (innerError) {
                console.error(`[TELEGRAM] Failed to send to ${chatId}:`, innerError.message);
                if (innerError.response) {
                    console.error("[TELEGRAM] Error Details:", JSON.stringify(innerError.response.data, null, 2));
                }
            }
        }
    } catch (error) {
        console.error("[TELEGRAM] System Error:", error.message);
    }
};
