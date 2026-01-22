import AdminWallet from "./adminWallet.model.js";
import AuditLog from "../audit-log/auditLog.model.js";
import cloudinary from "../upload/cloudinary.js";

export const createAdminWallet = async (req, res) => {
  const { coin, network, address } = req.body;

  if (!coin || !network || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await AdminWallet.findOne({ coin, network });
  if (existing) {
    return res.status(409).json({
      message: "Wallet config for this coin & network already exists"
    });
  }

  // Handle Image Upload
  let logoUrl = '';
  if (req.file) {
    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "wallet-logos" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        logoUrl = result.secure_url;
    } catch (error) {
        return res.status(500).json({ message: "Logo upload failed" });
    }
  }

  const wallet = await AdminWallet.create({ coin, network, address, logoUrl });

  await AuditLog.create({
    adminId: req.user.userId,
    action: "CREATE_ADMIN_WALLET",
    entity: "AdminWallet",
    entityId: wallet._id,
    after: wallet
  });

  res.status(201).json(wallet);
};

export const getAllAdminWallets = async (req, res) => {
  const wallets = await AdminWallet.find().sort({ createdAt: -1 });
  res.json(wallets);
};

export const updateAdminWallet = async (req, res) => {
  const { address, isActive } = req.body;

  const wallet = await AdminWallet.findById(req.params.id);
  if (!wallet) {
    return res.status(404).json({ message: "Wallet config not found" });
  }

  const before = wallet.toObject();

  if (address !== undefined) wallet.address = address;
  if (isActive !== undefined) wallet.isActive = isActive;

  if (req.file) {
    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "wallet-logos" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        wallet.logoUrl = result.secure_url;
    } catch (error) {
        return res.status(500).json({ message: "Logo upload failed" });
    }
  }

  await wallet.save();

  await AuditLog.create({
    adminId: req.user.userId,
    action: "UPDATE_ADMIN_WALLET",
    entity: "AdminWallet",
    entityId: wallet._id,
    before,
    after: wallet
  });

  res.json(wallet);
};

export const deleteAdminWallet = async (req, res) => {
  const wallet = await AdminWallet.findById(req.params.id);
  if (!wallet) {
    return res.status(404).json({ message: "Wallet config not found" });
  }

  await wallet.deleteOne();

  await AuditLog.create({
    adminId: req.user.userId,
    action: "DELETE_ADMIN_WALLET",
    entity: "AdminWallet",
    entityId: wallet._id,
    before: wallet
  });

  res.json({ success: true });
};
