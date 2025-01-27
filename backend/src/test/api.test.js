
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let authToken;
let testOrderId;
let testDisputeId;
let testReviewId;
let testNotificationId;
let resetToken;

beforeAll(async () => {
  await User.deleteMany({}); // Clear users collection
  authToken = jwt.sign({ userId: '65b3f7b8e32a37c1234567890' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Auth Tests
describe('Authentication Endpoints', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!'
  };

  test('POST /auth/register should register new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('userId');
  });

  test('POST /auth/register should fail with existing email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /auth/login should authenticate user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
  });

  test('POST /auth/login should fail with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /auth/forgot-password should send reset email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Get user from database to get reset token
    const user = await User.findOne({ email: testUser.email });
    resetToken = user.resetPasswordToken;
  });

  test('POST /auth/reset-password/:token should reset password', async () => {
    const res = await request(app)
      .post(`/auth/reset-password/${resetToken}`)
      .send({ password: 'NewPassword123!' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'NewPassword123!'
      });
    
    expect(loginRes.statusCode).toBe(200);
  });
});

// Orders Tests
describe('Orders Endpoints', () => {
  test('GET /orders/public should return public orders', async () => {
    const res = await request(app).get('/orders/public');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /orders should create new order', async () => {
    const orderData = {
      type: 'buy',
      amount: 100,
      price: 50000
    };
    
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData);
      
    expect(res.statusCode).toBe(201);
    testOrderId = res.body.order._id;
  });

  test('GET /orders/:id should return specific order', async () => {
    const res = await request(app)
      .get(`/orders/${testOrderId}`);
    expect(res.statusCode).toBe(200);
  });
});

// Escrow Tests
describe('Escrow Endpoints', () => {
  test('POST /escrow/deposit should process deposit', async () => {
    const depositData = {
      dealId: testOrderId,
      amount: 1000
    };
    
    const res = await request(app)
      .post('/escrow/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send(depositData);
      
    expect(res.statusCode).toBe(200);
  });
});

// Disputes Tests
describe('Disputes Endpoints', () => {
  test('POST /disputes should create dispute', async () => {
    const disputeData = {
      order_id: testOrderId,
      reason: 'Test dispute reason'
    };
    
    const res = await request(app)
      .post('/disputes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(disputeData);
      
    expect(res.statusCode).toBe(201);
    testDisputeId = res.body._id;
  });

  test('GET /disputes should return disputes list', async () => {
    const res = await request(app)
      .get('/disputes')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });
});

// Reviews Tests
describe('Reviews Endpoints', () => {
  test('POST /reviews should create review', async () => {
    const reviewData = {
      dealId: testOrderId,
      to: '65b3f7b8e32a37c1234567891',
      rating: 5,
      comment: 'Great service!'
    };
    
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reviewData);
      
    expect(res.statusCode).toBe(201);
    testReviewId = res.body.review._id;
  });

  test('GET /reviews/:userId should return user reviews', async () => {
    const res = await request(app)
      .get('/reviews/65b3f7b8e32a37c1234567891');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reviews');
  });
});

// Notifications Tests
describe('Notifications Endpoints', () => {
  test('GET /notifications/settings should return settings', async () => {
    const res = await request(app)
      .get('/notifications/settings')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('notificationSettings');
  });

  test('PUT /notifications/settings should update settings', async () => {
    const settingsData = {
      email: true,
      sms: false,
      push: true
    };
    
    const res = await request(app)
      .put('/notifications/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(settingsData);
      
    expect(res.statusCode).toBe(200);
  });
});
