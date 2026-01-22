
import Ledger from "./ledger.model.js";

/**
 * Get current user's transaction history (Ledger)
 * GET /api/transactions
 */
export const getMyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { userId: req.user.userId };

    if (type) {
      query.type = type;
    }

    const transactions = await Ledger.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Ledger.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};
