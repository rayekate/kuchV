import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendTelegramAdminNotification } from '../modules/notification/telegram-notification.service.js';
import { Settings } from '../modules/settings/settings.model.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('DB Connection Error:', error.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    console.log("--- Starting Telegram Service Verification ---");
    
    // 1. Check Settings Direct
    const settings = await Settings.getSingleton();
    console.log("Direct Settings Check:");
    console.log("- Enable Telegram:", settings.enableTelegramNotifications);
    console.log("- Bot Token:", settings.telegramBotToken ? "HIDDEN (Present)" : "MISSING");
    console.log("- Admin IDs:", settings.telegramAdminIds);
    console.log("- Channel ID:", settings.telegramChannelId);

    // 2. Try Sending
    console.log("\nAttempting to send test message...");
    await sendTelegramAdminNotification("🧪 *Test Message* from Debug Script.");

    console.log("\nDone. Disconnecting...");
    await mongoose.disconnect();
};

run();
