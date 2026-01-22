import dotenv from "dotenv";
import { sendEmail } from "./config/email.service.js";

dotenv.config();

const testBrevo = async () => {
  try {
    console.log("Starting Brevo SMTP test...");
    const result = await sendEmail({
      to: "test@example.com", // User should change this or I can use a temp one if needed
      subject: "Brevo SMTP Test Support",
      html: "<h1>Test Email</h1><p>This is a test email from the new Brevo SMTP configuration.</p>",
      text: "This is a test email from the new Brevo SMTP configuration."
    });
    console.log("Test result:", result);
  } catch (error) {
    console.error("Test failed:", error.message);
  }
};

testBrevo();
