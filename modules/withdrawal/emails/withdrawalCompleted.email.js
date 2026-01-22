// modules/withdrawal/emails/withdrawalCompleted.email.js
export const buildWithdrawalCompletedHTML = ({
  customerId,
  amount,
  asset,
  network,
  destinationAddress,
  txHash,
  completedAt
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Withdrawal Completed</title>
</head>
<body style="background:#f4f6f8;padding:20px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;">
          
          <tr>
            <td style="background:#0f9d58;padding:20px;color:#ffffff;">
              <h2 style="margin:0;">TeamCrypto</h2>
              <p style="margin:4px 0 0;">Withdrawal Completed</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;">
              <h1 style="color:#0f9d58;">
                ${amount} ${asset}
              </h1>
              <p style="color:#666;">
                Network: ${network}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;">
                <tr><td><b>Customer ID</b></td><td>${customerId}</td></tr>
                <tr><td><b>Destination Address</b></td><td style="word-break:break-all;">${destinationAddress}</td></tr>
                <tr><td><b>Transaction Hash</b></td><td style="word-break:break-all;">${txHash}</td></tr>
                <tr><td><b>Date & Time</b></td><td>${completedAt}</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#666;">
              If you did not request this withdrawal, contact support immediately.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
