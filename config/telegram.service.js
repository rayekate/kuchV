
import { Settings } from "../modules/settings/settings.model.js";

/**
 * Send message to a specific Telegram Chat ID
 */
export const sendTelegramMessage = async (chatId, text) => {
    try {
        const settings = await Settings.getSingleton();
        if (!settings.enableTelegramNotifications || !settings.telegramBotToken) {
            return;
        }

        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
        const body = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('[TELEGRAM] Error sending message:', data);
        }
    } catch (error) {
        console.error('[TELEGRAM] Faile to send:', error.message);
    }
};

/**
 * Broadcast message to all configured Admin Telegram IDs
 */
export const sendAdminTelegramAlert = async (text) => {
    try {
        const settings = await Settings.getSingleton();
        if (!settings.enableTelegramNotifications || !settings.telegramBotToken || !settings.telegramAdminIds) {
            return; 
        }

        const adminIds = settings.telegramAdminIds.split(',').map(id => id.trim()).filter(id => id);
        
        // Send to all admins in parallel
        await Promise.all(adminIds.map(id => sendTelegramMessage(id, `🚨 <b>ADMIN ALERT</b> 🚨\n\n${text}`)));

    } catch (error) {
        console.error('[TELEGRAM] Failed to broadcast alert:', error.message);
    }
};
