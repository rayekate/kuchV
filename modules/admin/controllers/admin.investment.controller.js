
import ProfitAccrual from '../../profit/profitAccrual.model.js';

/* GET ALL INVESTMENTS */
/* GET ALL INVESTMENTS */
export const getAllInvestments = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};

        const investments = await ProfitAccrual.find(query)
            .populate('userId', 'name email customerId')
            .populate({
                path: 'depositId',
                select: 'planId coin amount',
                populate: {
                    path: 'planId',
                    select: 'name dailyRoi durationDays'
                }
            })
            .sort({ createdAt: -1 });

        res.json(investments);
    } catch (error) {
        console.error("Fetch Investments Error:", error);
        res.status(500).json({ message: "Failed to fetch investments" });
    }
};

/* UPDATE INVESTMENT */
export const adminUpdateInvestment = async (req, res) => {
    try {
        const { investmentId } = req.params;
        const { status, profitPercent, totalCredited, createdAt, startAt, durationDays } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (profitPercent !== undefined) updateData.profitPercent = parseFloat(profitPercent);
        if (totalCredited !== undefined) updateData.totalCredited = parseFloat(totalCredited);
        if (durationDays !== undefined) updateData.durationDays = parseInt(durationDays);
        if (startAt) updateData.startAt = new Date(startAt);
        else if (createdAt) updateData.startAt = new Date(createdAt); // backward compatibility

        const investment = await ProfitAccrual.findByIdAndUpdate(
            investmentId,
            { $set: updateData },
            { new: true }
        );

        if (!investment) return res.status(404).json({ message: "Investment plan not found" });

        res.json({ success: true, data: investment });
    } catch (error) {
        console.error("Update Investment Error:", error);
        res.status(500).json({ message: "Failed to update investment" });
    }
};
