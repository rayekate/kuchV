import Notification from "./notification.model.js";
import Deposit from "../deposit/deposit.model.js";
import Withdrawal from "../withdrawal/withdrawal.model.js";
import Ticket from "../ticket/ticket.model.js";

// Get user notifications (specific + global)
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.userId },
        { isGlobal: true }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    console.error("DEBUG: getUserNotifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark single as read
export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

// Mark ALL as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

// Admin: Create Broadcast
export const createBroadcast = async (req, res) => {
    const { title, message } = req.body;
    try {
        await Notification.create({
            title,
            message,
            type: 'broadcast',
            isGlobal: true
        });
        res.json({ success: true, message: "Broadcast sent" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send broadcast" });
    }
};

// Admin: Get Recent Activity
export const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [deposits, withdrawals, tickets] = await Promise.all([
            Deposit.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'name customerId'),
            Withdrawal.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'name customerId'),
            Ticket.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'name customerId')
        ]);

        const activity = [];

        deposits.forEach(d => activity.push({
            type: 'deposit',
            user: d.userId?.name || d.userId?.customerId || 'Unknown',
            action: `deposited $${d.amount}`,
            date: d.createdAt
        }));

        withdrawals.forEach(w => activity.push({
            type: 'withdrawal',
            user: w.userId?.name || w.userId?.customerId || 'Unknown',
            action: `requested withdrawal of $${w.amount}`,
            date: w.createdAt
        }));

        tickets.forEach(t => activity.push({
            type: 'ticket',
            user: t.userId?.name || t.userId?.customerId || 'Unknown',
            action: `opened ticket: ${t.subject}`,
            date: t.createdAt
        }));

        // Sort combined and slice
        const sorted = activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
        
        res.json(sorted);

    } catch (error) {
        console.error("DEBUG: getRecentActivity error:", error);
        res.status(500).json({ message: "Failed to fetch activity" });
    }
};
