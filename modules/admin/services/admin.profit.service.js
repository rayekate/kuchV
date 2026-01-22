import UserPlan from "../models/userPlan.model.js";
import Plan from "../models/plan.model.js";

/**
 * Calculates profit ONLY for a single approved deposit
 * Applies ONLY if an ACTIVE plan exists
 */
export const calculateDepositProfit = async ({
  userId,
  coin,
  network,
  depositAmount,
  session
}) => {
  const userPlan = await UserPlan.findOne({
    userId,
    coin,
    network,
    status: "ACTIVE"
  }).populate("planId").session(session);

  if (!userPlan) {
    return { profit: 0, planApplied: false };
  }

  const profit =
    (depositAmount * userPlan.planId.profitPercentage) / 100;

  // Update informational aggregates (NOT wallet)
  userPlan.investedAmount += depositAmount;
  userPlan.profitAmount += profit;
  userPlan.totalAmount += depositAmount + profit;
  userPlan.lastCalculatedAt = new Date();

  await userPlan.save({ session });

  return {
    profit,
    planApplied: true,
    planName: userPlan.planId.name
  };
};
