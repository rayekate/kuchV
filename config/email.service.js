import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify once at startup (optional but helpful)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter error:", err);
  } else {
    console.log("✅ Email server is ready");
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: "Crypto Team Support <ADMIN@cryptotradingpreview.xyz>",
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
