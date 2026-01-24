import { sendEmail } from "../../config/email.service.js";

const WEBSITE_NAME = "CryptoProject";
const SENDER_NAME = "CryptoProject Support";

/**
 * Service to send structured transactional emails
 */
export const sendTransactionalEmail = async (user, type, data) => {
  const { email, name } = user;
  let subject = "";
  let html = "";
  let text = "";

  console.log(`[TRANSACTIONAL EMAIL] Entering sendTransactionalEmail. Type: ${type}, User: ${email}`);

  const footer = `
    <div style="margin-top: 20px; border-top: 1px solid #1f2937; padding-top: 20px; color: #6b7280; font-size: 12px; font-family: sans-serif;">
      <p>Best regards,<br/><b>${SENDER_NAME}</b><br/>${WEBSITE_NAME}</p>
    </div>
  `;

  const containerStyle = `font-family: sans-serif; padding: 20px; background: #ffffff; color: #374151; border-radius: 12px; border: 1px solid #e5e7eb; line-height: 1.6;`;
  const h2Style = `color: #111827; margin-top: 0;`;

  switch (type) {
    case "REGISTRATION_OTP":
      subject = `Verify your email - ${WEBSITE_NAME}`;
      text = `Hello,\n\nYou’re almost set to use your account on ${WEBSITE_NAME}.\n\nTo complete your registration, please verify your email address using the 6-digit code below:\n\n${data.otp}\n\nThis code is valid for the next ${data.expiry || 10} minutes.`;
      html = `
        <div style="${containerStyle}">
          <p>Hello,</p>
          <p>You’re almost set to use your account on <b>${WEBSITE_NAME}</b>.</p>
          <p>To complete your registration, please verify your email address using the 6-digit code below:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 0.2em; font-size: 32px; margin: 0; color: #111827;">${data.otp}</h1>
          </div>
          <p>This code is valid for the next <b>${data.expiry || 10}</b> minutes.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><b>For your security:</b></p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>Do not share this code with anyone</li>
              <li>${WEBSITE_NAME} will never ask you for this code outside the website</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #6b7280;">If you did not try to create an account, you can safely ignore this email.</p>
          ${footer}
        </div>
      `;
      break;

    case "LOGIN_OTP":
      subject = `Login Verification - ${WEBSITE_NAME}`;
      text = `Hello,\n\nA login attempt was made to your account on ${WEBSITE_NAME}.\n\nPlease confirm this login by entering the 6-digit code below:\n\n${data.otp}\n\nThis code is valid for ${data.expiry || 10} minutes.`;
      html = `
        <div style="${containerStyle}">
          <p>Hello,</p>
          <p>A login attempt was made to your account on <b>${WEBSITE_NAME}</b>.</p>
          <p>Because two-step verification is enabled in your profile settings, please confirm this login by entering the 6-digit code below:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 0.2em; font-size: 32px; margin: 0; color: #111827;">${data.otp}</h1>
          </div>
          <p>This code is valid for <b>${data.expiry || 10}</b> minutes and is required to complete your login.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><b>Security notice:</b></p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>Do not share this code with anyone</li>
              <li>${WEBSITE_NAME} staff will never ask you for this code</li>
              <li>If you did not attempt to log in, we recommend securing your account immediately</li>
            </ul>
          </div>
          ${footer}
        </div>
      `;
      break;

    case "PLAN_APPROVED":
      subject = `Your plan has been approved! - ${WEBSITE_NAME}`;
      text = `Hello,\n\nWe’re writing to let you know that your plan request on ${WEBSITE_NAME} has been reviewed and approved.\n\nPlan details:\n- Plan: ${data.planName}\n- Amount: $${data.amount}\n- ROI: ${data.planRoi}% Daily\n- Duration: ${data.planDuration} Days\n- Effective from: ${data.startDate}`;
      html = `
        <div style="${containerStyle}">
          <p>Hello,</p>
          <p>We’re writing to let you know that your plan request on <b>${WEBSITE_NAME}</b> has been reviewed and approved.</p>
          <h3 style="${h2Style}">Investment Details</h3>
          <ul style="color: #4b5563;">
            <li>Plan Name: <b>${data.planName}</b></li>
            <li>Invested Amount: <b>$${data.amount}</b></li>
            <li>Daily ROI: <b>${data.planRoi}%</b></li>
            <li>Duration: <b>${data.planDuration} Days</b></li>
            <li>Start Date: <b>${data.startDate}</b></li>
          </ul>
          <p>You now have access to the features and limits included in this plan. You can log in to your account to start using them immediately.</p>
          <p style="font-size: 14px; color: #6b7280;">If this request was not made by you, please contact us as soon as possible.</p>
          ${footer}
        </div>
      `;
      break;

    case "DEPOSIT_REQUESTED":
      subject = `Deposit Request Received - ${WEBSITE_NAME}`;
      text = `Hello,\n\nWe’ve received your deposit request on ${WEBSITE_NAME}.\n\nPlan: ${data.planName}\nAmount: ${data.amount} ${data.coin}\nROI: ${data.planRoi}% Daily\nDuration: ${data.planDuration} Days\n\nYour request is currently under review by our admin team.`;
      html = `
        <div style="${containerStyle}">
          <p>Hello,</p>
          <p>We’ve received your deposit request on <b>${WEBSITE_NAME}</b>.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
             <p style="margin: 0; color: #111827; font-weight: bold;">Plan: ${data.planName}</p>
             <p style="margin: 5px 0 0 0; color: #4b5563;">Amount: ${data.amount} ${data.coin}</p>
             <p style="margin: 5px 0 0 0; color: #4b5563;">ROI: ${data.planRoi}% Daily</p>
             <p style="margin: 5px 0 0 0; color: #4b5563;">Duration: ${data.planDuration} Days</p>
          </div>
          <p>Your request is currently under review by our admin team. Once the review is completed, your investment plan will be active.</p>
          <h3 style="${h2Style}">Review timeline</h3>
          <ul style="color: #4b5563;">
            <li>Approval usually takes 6 to 12 hours</li>
            <li>In some cases, the process may take up to 48 hours</li>
          </ul>
          <p>You’ll receive a confirmation email as soon as the review is completed and your plan is approved.</p>
          <p>No action is required from your side at this time.</p>
          ${footer}
        </div>
      `;
      break;

    case "DEPOSIT_REJECTED":
      subject = `Deposit Request Update - ${WEBSITE_NAME}`;
      text = `Hello,\n\nUnfortunately, your deposit request for ${data.planName || 'Plan'} on ${WEBSITE_NAME} could not be approved at this time.\n\nReason: ${data.reason || 'None provided'}`;
      html = `
        <div style="${containerStyle}">
          <p>Hello,</p>
          <p>Unfortunately, your deposit request for <b>${data.planName || 'Investment Plan'}</b> on <b>${WEBSITE_NAME}</b> has been reviewed and could not be approved at this time.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><b>Reason for rejection:</b></p>
            <p style="margin: 5px 0 0 0; color: #b91c1c;">${data.reason || "Please check the details of your request or contact support."}</p>
          </div>
          <p>If you believe this is an error, you can submit a new request with corrected information.</p>
          ${footer}
        </div>
      `;
      break;

    case "PASSWORD_CHANGED":
      subject = "Security Alert: Password Changed";
      text = `Hello,\n\nYour account password has been successfully changed. If you did not do this, please contact support immediately.`;
      html = `
        <div style="${containerStyle}">
          <h2 style="color: #10b981;">Security Update</h2>
          <p>Hello <b>${name || 'User'}</b>,</p>
          <p>This is to confirm that your account password was recently changed.</p>
          <p>If this was you, you can safely ignore this email.</p>
          ${footer}
        </div>
      `;
      break;

    case "WITHDRAWAL_REQUESTED":
      subject = "Withdrawal Request Submitted";
      text = `Hello,\n\nYour withdrawal request for ${data.amount} ${data.coin} has been received and is processing.`;
      html = `
        <div style="${containerStyle}">
          <h2 style="color: #111827;">Withdrawal Submitted</h2>
          <p>Hello <b>${name || 'User'}</b>,</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #111827;">Amount: <b>${data.amount} ${data.coin}</b></p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Address: ${data.address}</p>
          </div>
          <p>Your request is being processed according to our platform timelines.</p>
          ${footer}
        </div>
      `;
      break;

    case "WITHDRAWAL_APPROVED":
      subject = "Withdrawal Dispatched 💸";
      text = `Hello,\n\nYour withdrawal of ${data.amount} ${data.coin} has been approved and sent.`;
      html = `
        <div style="${containerStyle}">
          <h2 style="color: #10b981;">Withdrawal Approved</h2>
          <p>Hello <b>${name || 'User'}</b>,</p>
          <p>Your withdrawal has been processed successfully.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; color: #111827;">Sent: <b>${data.amount} ${data.coin}</b></p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">TXID: <span style="font-family: monospace; word-break: break-all;">${data.txid || 'N/A'}</span></p>
          </div>
          ${footer}
        </div>
      `;
      break;

    case "WITHDRAWAL_REJECTED":
      subject = "Withdrawal Request Update";
      text = `Hello,\n\nYour withdrawal request for ${data.amount} ${data.coin} was rejected. Reason: ${data.reason || 'None provided'}`;
      html = `
        <div style="${containerStyle}">
          <h2 style="color: #ef4444;">Withdrawal Rejected</h2>
          <p>Hello <b>${name || 'User'}</b>,</p>
          <p>Your withdrawal request could not be processed at this time.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; color: #111827;">Amount: <b>${data.amount} ${data.coin}</b></p>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Reason: ${data.reason || "Please check with support for details."}</p>
          </div>
          <p>Any locked funds have been returned to your balance.</p>
          ${footer}
        </div>
      `;
      break;

    default:
      return;
  }

  try {
    await sendEmail({ to: email, subject, html, text });
    console.log(`[TRANSACTIONAL EMAIL] Success: ${type} sent to ${email}`);
  } catch (error) {
    console.error(`[TRANSACTIONAL EMAIL] Failed to send ${type}:`, error.message);
  }
};
