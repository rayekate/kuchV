import { sendEmail } from "../../config/email.service.js";

export const sendOtpEmail = async (email, otp, type = "Email Verification") => {
    await sendEmail({
      to: email,
      subject: `${type} - ${otp}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #09090b; color: #fff; border-radius: 12px;">
            <h2 style="color: #10b981;">${type}</h2>
            <p style="color: #94a3b8;">Your verification code is:</p>
            <h1 style="letter-spacing: 0.2em; font-size: 32px; background: rgba(255,255,255,0.05); padding: 20px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">${otp}</h1>
            <p style="color: #64748b; font-size: 12px;">This code is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Your ${type} code is ${otp}. Valid for 10 minutes.`
    });
  };