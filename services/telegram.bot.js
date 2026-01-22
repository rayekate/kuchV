import User from "../modules/user/user.model.js";
import { Settings } from "../modules/settings/settings.model.js";

/**
 * Basic Telegram Bot Listener using Polling
 * (Suitable for low volumes and easy setup)
 */
export const startTelegramBot = async () => {
    let offset = 0;
    
    // Non-blocking loop
    const pollUpdates = async () => {
        try {
            const settings = await Settings.getSingleton();
            if (!settings.enableTelegramNotifications || !settings.telegramBotToken) {
                // If not enabled, retry later
                setTimeout(pollUpdates, 30000); 
                return;
            }

            const url = `https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates?offset=${offset}&timeout=30`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    
                    if (update.message && update.message.text) {
                        const { chat, text } = update.message;
                        const chatId = chat.id.toString();
                        const username = chat.username;

                        // Handle /start <referralCode>
                        if (text.startsWith('/start')) {
                            const parts = text.split(' ');
                            if (parts.length > 1) {
                                const referralCode = parts[1];
                                // Link by referral code
                                const user = await User.findOneAndUpdate(
                                    { referralCode },
                                    { telegramChatId: chatId, telegramUsername: username },
                                    { new: true }
                                );

                                if (user) {
                                    await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            chat_id: chatId,
                                            text: `✅ Hello ${user.name || 'User'}! Your account has been successfully linked to Telegram.`,
                                            parse_mode: 'HTML'
                                        })
                                    });
                                }
                            } else {
                                // Just /start - suggest how to link if not linked
                                await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        chat_id: chatId,
                                        text: `👋 Welcome! To link your account, please use the link provided in your Dashboard Settings.`,
                                        parse_mode: 'HTML'
                                    })
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[TELEGRAM BOT] Polling error:', error.message);
        }
        
        // Immediate next poll (long polling handles the wait)
        pollUpdates();
    };

    pollUpdates();
};
