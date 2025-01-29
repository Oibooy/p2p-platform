
# P2P Token Trading Platform Documentation

## Overview
A secure peer-to-peer trading platform for cryptocurrency tokens with escrow functionality, built on Tron blockchain.

## System Architecture
- **Frontend**: React.js with Vite
- **Backend**: Node.js/Express
- **Database**: MongoDB
- **Blockchain**: Tron Network
- **WebSocket**: Real-time notifications
- **Security**: JWT, Rate limiting, Helmet

## API Documentation

### Authentication
#### Register User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "username"
}
```
- **Response**: `201 Created`
```json
{
  "message": "Registration successful",
  "userId": "user_id"
}
```

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and get JWT token
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response**: `200 OK`
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Orders
#### Create Order
- **Endpoint**: `POST /api/orders`
- **Auth**: Required
- **Request Body**:
```json
{
  "type": "BUY/SELL",
  "amount": "100",
  "price": "1.5",
  "currency": "USDT"
}
```

#### Get Orders
- **Endpoint**: `GET /api/orders`
- **Auth**: Required
- **Query Parameters**:
  - `type`: "BUY" or "SELL"
  - `page`: Page number
  - `limit`: Items per page

### Escrow
#### Create Escrow
- **Endpoint**: `POST /api/escrow`
- **Auth**: Required
- **Request Body**:
```json
{
  "orderId": "order_id",
  "amount": "100",
  "currency": "USDT"
}
```

### Disputes
#### Create Dispute
- **Endpoint**: `POST /api/disputes`
- **Auth**: Required
- **Request Body**:
```json
{
  "dealId": "deal_id",
  "reason": "Description of the issue",
  "evidence": "evidence_url"
}
```

## WebSocket Events
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://your-domain/ws');

// Event Types
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'NEW_ORDER':
    case 'ORDER_UPDATE':
    case 'NEW_MESSAGE':
    case 'DISPUTE_UPDATE':
    // Handle events
  }
};
```

## Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limits
- Authentication: 5 requests per minute
- API endpoints: 100 requests per minute
- WebSocket: 60 messages per minute

## Security Features
1. JWT Authentication
2. Rate Limiting
3. Input Validation
4. XSS Protection
5. CORS Policy
6. Request Logging

## Blockchain Integration
### Smart Contracts
- `TronEscrow.sol`: USDT escrow contract
- `MTTEscrow.sol`: MTT token escrow contract

### Transaction Flow
1. Seller deposits tokens to escrow
2. Buyer confirms payment
3. Escrow releases tokens
4. Dispute resolution if needed

## Contact & Support
Email: kerimkulonesoul@gmail.com
Telegram: @oibooy
