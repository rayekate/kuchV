import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Settings } from '../modules/settings/settings.model.js';

dotenv.config();

const checkSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const settings = await Settings.findOne();
        console.log('--- Current Telegram Settings ---');
        console.log('Enable Notifications:', settings.enableTelegramNotifications);
        console.log('Bot Token:', settings.telegramBotToken ? 'SET' : 'MISSING');
        console.log('Channel ID:', settings.telegramChannelId);
        console.log('Admin IDs:', settings.telegramAdminIds);
        console.log('-------------------------------');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkSettings();
