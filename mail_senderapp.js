import express from "express";
import dotenv from "dotenv";
import { sendEmail } from "./config/email.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Using 3001 to avoid conflict with the main app if running

app.use(express.urlencoded({ extended: true }));

const HTML = `
<!doctype html>
<html>
<head>
<title>Mail Sender</title>
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
<h2>Send Email</h2>
<form method="post">
<input type="email" name="to" placeholder="Recipient email" required>
<input type="text" name="subject" placeholder="Subject" required>
<textarea name="message" rows="10" placeholder="Message" required></textarea>
<button type="submit">Send</button>
</form>
<div id="status-container"></div>
</div>

<script>
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const msg = urlParams.get('message');
    if (status) {
        const container = document.getElementById('status-container');
        container.innerHTML = \`<p class="status \${status === 'success' ? 'success' : 'error'}">\${msg}</p>\`;
    }
</script>
</body>
</html>
`;

app.get("/", (req, res) => {
    res.send(HTML);
});

app.post("/", async (req, res) => {
    const { to, subject, message } = req.body;

    try {
        await sendEmail({
            to,
            subject,
            html: message.replace(/\n/g, '<br>'),
            text: message
        });
        console.log("✅ Email sent to", to);
        res.redirect("/?status=success&message=Email sent successfully");
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.redirect(`/?status=error&message=Failed to send email: ${encodeURIComponent(error.message)}`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Mail Sender App running at http://localhost:${PORT}`);
});
