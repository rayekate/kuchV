
import mongoose from "mongoose";
import dotenv from "dotenv";
import Wallet from "./modules/wallet/wallet.model.js";
import Ledger from "./modules/ledger/ledger.model.js";
import Withdrawal from "./modules/withdrawal/withdrawal.model.js";
import { createWithdrawal } from "./modules/withdrawal/controllers/withdrawal.controller.js";

dotenv.config();

// Mock Req/Res
const mockReq = (body, userId) => ({
    body,
    user: { id: userId, userId }
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Find a wallet with balance
    const wallet = await Wallet.findOne({});
    if (!wallet) {
        console.log("No wallet found");
        process.exit();
    }
    
    // Convert text map to object to find a key with balance
    const wObj = wallet.toObject();
    wObj.balances = wallet.balances ? Object.fromEntries(wallet.balances) : {};
    
    let asset = "USDT";
    let amount = 10;
    
    // Find a key with > 10
    for(const [k, v] of Object.entries(wObj.balances)) {
        if (parseFloat(v) > 10) {
            asset = k; 
            break;
        }
    }
    
    // If no balance, force inject for testing? No, better not mess with real data if empty.
    // I'll assume my previous debug script showed balance.
    // Previous debug script showed: {"btc_bjdhkjef":{"$numberDecimal":"85117"}}
    // So asset = "btc_bjdhkjef" (weird name, but okay)
    
    console.log(`Testing withdrawal for User: ${wallet.userId} Asset: ${asset}`);
    
    // 2. Call Controller
    const req = mockReq({
        asset,
        amount: 10,
        network: "TestNet",
        destinationAddress: "T_TEST_ADDR"
    }, wallet.userId);
    
    const res = mockRes();
    
    try {
        await createWithdrawal(req, res);
        console.log("Response Status:", res.statusCode);
        console.log("Response Data:", res.data);
        
        if (res.statusCode === 201) {
            console.log("SUCCESS! Checking Ledger...");
            const l = await Ledger.findOne({ type: "WITHDRAWAL" }).sort({ createdAt: -1 });
            console.log("Ledger Entry:", l);
            
            const w = await Withdrawal.findById(res.data.withdrawalId);
            console.log("Withdrawal Entry:", w);
        } else {
             console.log("FAILED (Expected if logical error or insufficient funds)");
        }
        
    } catch (e) {
        console.error("CRASH:", e);
    }
    
    process.exit();
};

run();
