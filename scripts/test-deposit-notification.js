import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendTelegramAdminNotification } from '../modules/notification/telegram-notification.service.js';

dotenv.config();

const testNotification = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Mock Data
        const user = {
            name: "Test User",
            email: "test@example.com",
            customerId: "CUST-12345"
        };
        const claimedAmount = 500;
        const plan = { name: "VIP Plan" };
        const txHash = "0x1234567890abcdef";

        // Construct Message (Same logic as in controller)
        const telegramMessage = `🔔 *New Deposit Request*\n\n` +
            `👤 *User Name:* ${user.name || "N/A"}\n` +
            `📧 *Email:* ${user.email || "N/A"}\n` +
            `💰 *Amount:* ${claimedAmount} USDT\n` +
            `📝 *Plan:* ${plan ? plan.name : 'Default'}\n` + 
            `🔗 *TxHash:* \`${txHash}\`\n`;

        console.log("Sending message:\n", telegramMessage);

        await sendTelegramAdminNotification(telegramMessage);

        console.log("Message sent.");
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

testNotification();
