
import Deposit from '../../deposit/deposit.model.js';
import User from '../../user/user.model.js';
import Withdrawal from '../../withdrawal/withdrawal.model.js';
import Ticket from '../../ticket/ticket.model.js';
import Ledger from '../../ledger/ledger.model.js';

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Chart Data: Last 7 days revenue
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const revenueChart = await Deposit.aggregate([
            {
                $match: {
                    status: 'APPROVED',
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: { $toDouble: "$approvedAmount" } } 
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = revenueChart.find(r => r._id === dateStr);
            chartData.unshift({
                name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                date: dateStr,
                revenue: found ? found.revenue : 0
            });
        }

        // 2. Summary Counts (Optimization: Count documents instead of fetching all)
        const totalUsers = await User.countDocuments();
        
        // Revenue Total: Use approvedAmount (Decimal) converted to double
        const totalRevenueAgg = await Deposit.aggregate([
            { $match: { status: 'APPROVED' } },
            { $group: { _id: null, total: { $sum: { $toDouble: "$approvedAmount" } } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        // Payouts Total: Use 'COMPLETED' status
        const totalPayoutsAgg = await Withdrawal.aggregate([
            { $match: { status: 'COMPLETED' } }, 
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalPayouts = totalPayoutsAgg[0]?.total || 0;

        // Total Profit Distributed (Ledger sum)
        const totalProfitAgg = await Ledger.aggregate([
            { $match: { type: 'PROFIT_CREDIT' } },
            { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
        ]);
        const totalProfit = totalProfitAgg[0]?.total || 0;

        // Active Tickets: OPEN or IN_PROGRESS
        const activeTickets = await Ticket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } });

        res.json({
            stats: {
                totalUsers,
                totalRevenue,
                totalPayouts,
                totalProfit,
                activeTickets
            },
            chartData
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};
