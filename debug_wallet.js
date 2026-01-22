
import mongoose from "mongoose";
import dotenv from "dotenv";
import Wallet from "./modules/wallet/wallet.model.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const wallets = await Wallet.find({});
    console.log(`Found ${wallets.length} wallets`);

    for (const w of wallets) {
        console.log("--- Wallet ---");
        console.log("User:", w.userId);
        console.log("Balances (Raw Code):", w.balances);
        // console.log("Balances (JSON):", w.balances.toJSON());
        console.log("Investment Balance:", w.investmentBalanceUSD);

        // VERIFICATION OF FIX
        const walletObj = w.toObject();
        walletObj.balances = w.balances ? Object.fromEntries(w.balances) : {};
        console.log("Serialized Balances for Frontend:", JSON.stringify(walletObj.balances));
        
        // Simulate Dashboard Calc
        let balanceUSDT = 0;
        if (w.balances) {
             // Mongoose Map to Object?
             // Accessing map directly
             for (const [key, val] of w.balances) {
                 console.log(`Key: ${key}, Val: ${val}`);
                 balanceUSDT += parseFloat(val.toString());
             }
        }
        console.log("Calculated Withdrawable:", balanceUSDT);
    }
    
    process.exit();
};

run();
