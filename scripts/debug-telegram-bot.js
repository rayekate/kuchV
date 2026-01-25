import axios from 'axios';
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

const debugBot = async () => {
    await connectDB();

    const settings = await Settings.getSingleton();
    const token = settings.telegramBotToken;

    if (!token) {
        console.error("❌ No Bot Token found in database settings!");
        process.exit(1);
    }

    const baseUrl = `https://api.telegram.org/bot${token}`;

    console.log(`\n🔍 Debugging Bot (Token: ...${token.slice(-5)})`);

    // 1. Check Bot Identity
    try {
        const me = await axios.get(`${baseUrl}/getMe`);
        console.log(`\n✅ BOT CONNECTION SUCCESSFUL!`);
        console.log(`--------------------------------------------------`);
        console.log(`🤖 Bot Name:     ${me.data.result.first_name}`);
        console.log(`📧 Bot Username: @${me.data.result.username}`);
        console.log(`🆔 Bot ID:       ${me.data.result.id}`);
        console.log(`--------------------------------------------------`);
        console.log(`\n👉 ACTION: Go to your channel (${settings.telegramChannelId || 'unknown'})`);
        console.log(`👉 ACTION: Add "@${me.data.result.username}" as an Administrator.`);
        console.log(`👉 ACTION: Ensure "Post Messages" permission is ON.`);
    } catch (error) {
        console.error("\n❌ Bot Token is INVALID. Please check settings.");
        console.error(error.message);
        process.exit(1);
    }

    // 2. Check Updates (to find auto-ids)
    try {
        console.log(`\n📨 Checking for recent messages (getUpdates)...`);
        const updates = await axios.get(`${baseUrl}/getUpdates`);
        const result = updates.data.result;

        if (result.length === 0) {
            console.log("   ⚠️ No recent messages found.");
            console.log("   👉 TIP: Send a message to the bot or your channel NOW, then run this script again to see the ID.");
        } else {
            console.log(`   ✅ Found ${result.length} recent events!`);
            result.forEach(update => {
                if (update.message) {
                    const chat = update.message.chat;
                    console.log(`      - Message from: ${chat.type} | Title/Name: ${chat.title || chat.username} | ID: ${chat.id}`);
                }
                if (update.channel_post) {
                    const chat = update.channel_post.chat;
                    console.log(`      - Channel Post: ${chat.title} | ID: ${chat.id}`);
                }
                if (update.my_chat_member) {
                     const chat = update.my_chat_member.chat;
                     console.log(`      - Bot Added to: ${chat.title} (${chat.type}) | ID: ${chat.id}`);
                }
            });
        }
    } catch (error) {
        if (error.response && error.response.status === 409) {
            console.log("\n⚠️  Webhook is active (Conflict 409).");
            console.log("    Attempting to DELETE Webhook to enable auto-discovery...");
            
            try {
                await axios.post(`${baseUrl}/deleteWebhook`);
                console.log("    ✅ Webhook deleted! Retrying getUpdates...");
                
                // Retry getUpdates
                const updates = await axios.get(`${baseUrl}/getUpdates`);
                const result = updates.data.result;
                
                if (result.length > 0) {
                   console.log(`   ✅ Found ${result.length} recent messages!`);
                   result.forEach(update => {
                        const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat;
                        if (chat) {
                            console.log(`      👉 ID: ${chat.id} | Name: ${chat.first_name || chat.title} (${chat.type})`);
                        }
                   });
                } else {
                    console.log("   ⚠️  Webhook removed, but no messages found yet.");
                    console.log("       👉 ACTION: Send 'Hello' to your bot NOW and run this script again!");
                }
            } catch (delError) {
                console.error("    ❌ Failed to delete webhook:", delError.message);
            }
        } else {
            console.error("   ❌ Failed to get updates:", error.message);
        }
    }

    console.log("\nCurrent Configured ID in DB:", settings.telegramChannelId || settings.telegramAdminIds || "NONE");
    await mongoose.disconnect();
};

debugBot();
