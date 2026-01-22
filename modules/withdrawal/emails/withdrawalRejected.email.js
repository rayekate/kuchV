// modules/withdrawal/emails/withdrawalRejected.email.js
export const buildWithdrawalRejectedHTML = ({
  customerId,
  amount,
  asset,
  network,
  destinationAddress,
  reason,
  rejectedAt
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Withdrawal Rejected</title>
</head>
<body style="background:#f4f6f8;padding:20px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;">
          
          <!-- Header -->
          <tr>
            <td style="background:#d93025;padding:20px;color:#ffffff;">
              <h2 style="margin:0;">TeamCrypto</h2>
              <p style="margin:4px 0 0;">Withdrawal Rejected</p>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="padding:20px;text-align:center;">
              <h2 style="color:#d93025;margin-bottom:5px;">
                Withdrawal Not Processed
              </h2>
              <p style="color:#666;margin-top:0;">
                Your withdrawal request has been rejected.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:20px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;">
                <tr><td><b>Customer ID</b></td><td>${customerId}</td></tr>
                <tr><td><b>Amount</b></td><td>${amount} ${asset}</td></tr>
                <tr><td><b>Network</b></td><td>${network}</td></tr>
                <tr><td><b>Destination Address</b></td><td style="word-break:break-all;">${destinationAddress}</td></tr>
                <tr><td><b>Rejection Reason</b></td><td>${reason}</td></tr>
                <tr><td><b>Date & Time</b></td><td>${rejectedAt}</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#666;">
              The locked funds have been safely returned to your wallet.<br/>
              If you have questions, please contact support.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
