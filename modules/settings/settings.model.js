import mongoose from 'mongoose';

console.log('DEBUG: settings.model.js file is being loaded');

const settingsSchema = new mongoose.Schema({
  // General
  platformName: {
    type: String,
    default: 'Project Crypto'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  
  // Security
  enable2FA: {
    type: Boolean,
    default: false
  },
  enableTicketSystem: {
    type: Boolean,
    default: true
  },
  showPaymentLink: {
    type: Boolean,
    default: true
  },

  // Finance
  minWithdrawal: {
    type: Number,
    default: 10
  },
  withdrawalFee: {
    type: Number,
    default: 5
  },

  // Support
  supportLinkPersonal: {
    type: String,
    default: 'https://t.me/admin'
  },
  supportLinkChannel: {
    type: String,
    default: 'https://t.me/channel'
  },

  // Automation
  telegramBotToken: {
    type: String,
    default: ''
  },
  telegramChannelId: {
    type: String,
    default: ''
  },

  // Registration & Access
  registrationEnabled: {
    type: Boolean,
    default: true
  },
  emailVerificationRequired: {
    type: Boolean,
    default: true
  },
  requireWithdrawVerification: {
    type: Boolean,
    default: false
  },
  kycRequired: {
    type: Boolean,
    default: false
  },

  // Deposit Settings
  autoDepositApproval: {
    type: Boolean,
    default: false
  },
  minDeposit: {
    type: Number,
    default: 10
  },
  requireTxHash: {
    type: Boolean,
    default: true
  },

  // Telegram Notifications
  enableTelegramNotifications: {
    type: Boolean,
    default: false
  },
  telegramAdminIds: {
    type: String, // Comma separated list of admin Telegram IDs
    default: ''
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  } else {
    // Check if new fields from schema are missing in the existing document and apply defaults
    const schemaPaths = this.schema.paths;
    let modified = false;
    
    for (const path in schemaPaths) {
      if (path !== '_id' && path !== '__v' && settings[path] === undefined) {
        settings[path] = schemaPaths[path].options.default;
        modified = true;
      }
    }
    
    if (modified) {
      await settings.save();
    }
  }
  return settings;
};

export const Settings = mongoose.model('Settings', settingsSchema);
