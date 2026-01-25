import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

const fixSettings = async () => {
    await connectDB();

    console.log("--- Fixing Telegram Settings ---");
    
    let settings = await Settings.getSingleton();
    
    console.log("Current Status:");
    console.log(`- Enabled: ${settings.enableTelegramNotifications}`);
    console.log(`- Admin IDs: '${settings.telegramAdminIds}'`);
    console.log(`- Bot Token: ${settings.telegramBotToken ? 'Present' : 'Missing'}`);

    // Update 1: Enable it
    if (!settings.enableTelegramNotifications) {
        console.log("ACTION: Enabling Telegram Notifications...");
        settings.enableTelegramNotifications = true;
    }

    // Update 2: Check Admin ID
    if (!settings.telegramAdminIds || settings.telegramAdminIds.trim() === '') {
        console.log("WARNING: Admin IDs are missing!");
        // We cannot fix this automatically without user input, but we will save the enable flag at least.
    }

    await settings.save();
    console.log("--- Settings Updated ---");
    console.log(`- Enabled: ${settings.enableTelegramNotifications}`);
    console.log(`- Admin IDs: '${settings.telegramAdminIds}'`);
    
    console.log("\nIf Admin IDs are blank, you MUST update them in the Admin Panel or provide them to me.");
    
    await mongoose.disconnect();
};

fixSettings();
