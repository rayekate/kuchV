import express from "express";
import { sendEmail } from "../../config/email.service.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";

const router = express.Router();

const HTML = (status, msg) => `
<!doctype html>
<html>
<head>
<title>Mail Sender Test</title>
<style>
body { font-family: Arial; margin: 40px; background-color: #f4f4f9; color: #333; }
.container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
h2 { color: #2c3e50; text-align: center; }
input, textarea { width: 100%; margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
button { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
button:hover { background-color: #2980b9; }
.status { text-align: center; margin-top: 20px; font-weight: bold; }
.success { color: #27ae60; }
.error { color: #e74c3c; }
</style>
</head>
<body>
<div class="container">
<h2>Send Test Email (Admin)</h2>
<form method="post">
<input type="email" name="to" placeholder="Recipient email" required>
<input type="text" name="subject" placeholder="Subject" required>
<textarea name="message" rows="10" placeholder="Message" required></textarea>
<button type="submit">Send</button>
</form>
${status ? `<p class="status ${status === 'success' ? 'success' : 'error'}">${msg}</p>` : ''}
</div>
</body>
</html>
`;

// Admin only access
router.get("/", authenticate, authorizeRoles("ADMIN"), (req, res) => {
    res.send(HTML());
});

router.post("/", authenticate, authorizeRoles("ADMIN"), async (req, res) => {
    const { to, subject, message } = req.body;

    try {
        await sendEmail({
            to,
            subject,
            html: message.replace(/\n/g, '<br>'),
            text: message
        });
        res.send(HTML('success', 'Email sent successfully'));
    } catch (error) {
        res.send(HTML('error', `Failed to send email: ${error.message}`));
    }
});

export default router;
