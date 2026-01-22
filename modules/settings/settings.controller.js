import { Settings } from './settings.model.js';

/**
 * Get current platform settings
 */
export const getSettings = async (req, res) => {
  console.log('DEBUG: getSettings called');
  try {
    const settings = await Settings.getSingleton();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update platform settings (Admin only)
 */
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.getSingleton();
    
    console.log('DEBUG: updateSettings received body:', req.body);
    
    // Only update fields allowed to be updated
    const allowedUpdates = [
      'enable2FA', 'enableTicketSystem', 'showPaymentLink',
      'minWithdrawal', 'withdrawalFee', 'minDeposit',
      'supportLinkPersonal', 'supportLinkChannel',
      'telegramBotToken', 'telegramChannelId', 'enableTelegramNotifications', 'telegramAdminIds',
      'registrationEnabled', 'emailVerificationRequired', 'kycRequired', 'autoDepositApproval',
      'maintenanceMode', 'requireWithdrawVerification'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        console.log(`DEBUG: Updating field ${field} to:`, req.body[field]);
        settings[field] = req.body[field];
      }
    });

    settings.lastUpdatedBy = req.user.userId;
    console.log('DEBUG: Settings document before save:', settings);
    await settings.save();
    console.log('DEBUG: Settings document after save:', settings);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
