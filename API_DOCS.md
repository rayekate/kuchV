# API Documentation

Base URL: `/api`

## Authentication (`/api/auth`)

### Register
- **Endpoint**: `POST /signup`
- **Description**: Register a new user.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "registration successful."
  }
  ```

### Login
- **Endpoint**: `POST /login`
- **Description**: Login with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Login successful",
    "accessToken": "eyJhbG...",
    "user": {
      "id": "678...",
      "email": "user@example.com",
      "customerId": "CUST-..."
    }
  }
  ```
  *Note: A `refreshToken` is set in an HttpOnly cookie.*

### Refresh Token
- **Endpoint**: `POST /refresh`
- **Description**: Get a new access token using the refresh token cookie.
- **Request Headers**: Cookie `refreshToken=...`
- **Response** (200):
  ```json
  {
    "accessToken": "eyJhbG..."
  }
  ```

### Get Profile
- **Endpoint**: `GET /profile`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response** (200):
  ```json
  {
    "message": "JWT is valid",
    "user": { ... }
  }
  ```

### Logout
- **Endpoint**: `POST /logout`
- **Description**: Clears the refresh token cookie.
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## Wallet (`/api/wallet`)

### Get My Wallet
- **Endpoint**: `GET /me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response** (200):
  ```json
  {
    "_id": "...",
    "userId": "...",
    "balance": 0,
    "investmentBalanceUSD": 0,
    "isFrozen": false,
    ...
  }
  ```

### Admin: Get User Wallet
- **Endpoint**: `GET /:userId`
- **Headers**: `Authorization: Bearer <accessToken>` (Admin Role)
- **Response** (200): Wallet object.

---

## Deposits (`/api/deposits`)

### Get Deposit Options
- **Endpoint**: `GET /options`
- **Description**: Get available admin wallets for deposit.
- **Response** (200):
  ```json
  [
    {
      "coin": "USDT",
      "network": "TRC20",
      "address": "T..."
    }
  ]
  ```

### Create Deposit
- **Endpoint**: `POST /`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `adminWalletId`: ID of the selected deposit option
  - `claimedAmount`: Number (amount sent by user)
  - `txHash`: String (Transaction Hash)
  - `paymentLink`: String (Optional)
  - `screenshot`: File (Image)
- **Response** (201):
  ```json
  {
    "message": "Deposit submitted successfully",
    "deposit": { ... }
  }
  ```

### Get My Deposits
- **Endpoint**: `GET /me`
- **Response** (200): List of user's deposits.

### Admin: Approve Deposit
- **Endpoint**: `POST /:depositId/approve`
- **Headers**: Admin Role
- **Request Body**:
  ```json
  {
    "approvedAmount": 100
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Deposit approved. Profit will be added automatically."
  }
  ```

### Admin: Reject Deposit
- **Endpoint**: `POST /:depositId/reject`
- **Headers**: Admin Role
- **Request Body**:
  ```json
  {
    "remarks": "Invalid transaction hash"
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true"
  }
  ```

---

## Withdrawals (`/api/withdrawals`)

### Create Withdrawal
- **Endpoint**: `POST /`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "asset": "USDT",
    "network": "TRC20",
    "amount": 50,
    "destinationAddress": "T..."
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Withdrawal request submitted for admin review",
    "withdrawalId": "..."
  }
  ```

### Admin: Get Pending Withdrawals (`/api/admin-withdrawals`)
- **Endpoint**: `GET /withdrawals`
- **Headers**: Admin Role
- **Response** (200): List of pending withdrawals.

### Admin: Approve Withdrawal
- **Endpoint**: `POST /withdrawals/:id/approve`
- **Headers**: Admin Role
- **Response** (200):
  ```json
  {
    "message": "Withdrawal approved. Awaiting transaction confirmation."
  }
  ```

### Admin: Confirm Withdrawal (Complete)
- **Endpoint**: `POST /withdrawals/:id/confirm`
- **Headers**: Admin Role
- **Request Body**:
  ```json
  {
    "txHash": "0x..."
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Withdrawal completed successfully"
  }
  ```

### Admin: Reject Withdrawal
- **Endpoint**: `POST /withdrawals/:id/reject`
- **Headers**: Admin Role
- **Request Body**:
  ```json
  {
    "reason": "Invalid address"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Withdrawal rejected and funds refunded"
  }
  ```

---

## Admin Management (`/api/admin`)

### Get All Users
- **Endpoint**: `GET /users`
- **Response** (200):
  ```json
  [
    {
      "user": { ... },
      "wallet": { ... },
      "plan": { ... }
    }
  ]
  ```

### Get User Details
- **Endpoint**: `GET /users/:userId`
- **Response** (200):
  ```json
  {
    "user": { ... },
    "wallet": { ... },
    "transactions": [ ... ],
    "plan": { ... }
  }
  ```

### Create Plan
- **Endpoint**: `POST /plans`
- **Request Body**:
  ```json
  {
    "name": "Gold Plan",
    "description": "...",
    "billingCycle": "MONTHLY",
    "charges": 100,
    "profitPercentage": 5
  }
  ```
- **Response** (201): Plan object.

### Freeze Wallet
- **Endpoint**: `POST /wallet/:userId/freeze`
- **Response** (200): `{ "message": "Wallet frozen" }`

### Unfreeze Wallet
- **Endpoint**: `POST /wallet/:userId/unfreeze`
- **Response** (200): `{ "message": "Wallet unfrozen" }`

---

## Admin Treasury Wallets (`/api/admin/wallets`)

### Create Admin Wallet
- **Endpoint**: `POST /`
- **Request Body**:
  ```json
  {
    "coin": "USDT",
    "network": "ERC20",
    "address": "0x..."
  }
  ```
- **Response** (201): Wallet config object.

### Get Admin Wallets
- **Endpoint**: `GET /`
- **Response** (200): List of admin wallets.

### Update Admin Wallet
- **Endpoint**: `PUT /:id`
- **Request Body**:
  ```json
  {
    "address": "0xNewAddress...",
    "isActive": true
  }
  ```
- **Response** (200): Updated wallet object.

### Delete Admin Wallet
- **Endpoint**: `DELETE /:id`
- **Response** (200): `{ "success": true }`

---

## Admin Tickets (`/api/admin-ticket`)

### Get All Tickets
- **Endpoint**: `GET /tickets`
- **Response** (200): List of tickets.

### Reply to Ticket
- **Endpoint**: `POST /tickets/:id/reply`
- **Request Body**:
  ```json
  {
    "message": "Hello, we are looking into it.",
    "status": "IN_PROGRESS"
  }
  ```
- **Response** (200): `{ "message": "Reply sent" }`
