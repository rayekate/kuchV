import dotenv from "dotenv";
dotenv.config();

console.log("[ENV] Variables loaded from .env");
if (!process.env.MONGO_URI) {
    console.error("[ENV] CRITICAL: MONGO_URI is missing after loading!");
}
