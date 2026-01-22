import Plan from "../models/plan.model.js";

/* CREATE */
export const adminCreatePlan = async (req, res) => {
  const { name, description, dailyRoi, durationDays, minDeposit, maxDeposit, isRecommended } = req.body;

  const exists = await Plan.findOne({ name });
  if (exists) {
    return res.status(400).json({ message: "Plan already exists" });
  }

  const plan = await Plan.create({
    name,
    description,
    dailyRoi,
    durationDays,
    minDeposit,
    maxDeposit,
    isRecommended: isRecommended || false
  });

  res.status(201).json(plan);
};

/* READ */
export const adminGetPlans = async (req, res) => {
  const plans = await Plan.find().sort({ minDeposit: 1 });
  res.status(200).json(plans);
};

/* UPDATE */
export const adminUpdatePlan = async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findByIdAndUpdate(
    planId,
    req.body,
    { new: true }
  );

  res.status(200).json(plan);
};

/* SOFT DISABLE */
export const adminDisablePlan = async (req, res) => {
  const { planId } = req.params;

  await Plan.findByIdAndUpdate(planId, { isActive: false });
  res.status(200).json({ message: "Plan disabled" });
};

//for users to get active plans
export const getActivePlansForUsers = async (req, res) => {
    const plans = await Plan.find(
      { isActive: true },
      // Return all fields the UI needs. Mongoose returns all by default if projection is omitted, which is safer here.
    ).sort({ minDeposit: 1 });
  
    res.status(200).json(plans);
  };
