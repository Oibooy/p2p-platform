const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let authToken;
let testOrderId;

beforeAll(async () => {
  const testUser = new User({
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    password: 'hashedpassword',
    isEmailConfirmed: true,
    isActive: true
  });
  await testUser.save();

  authToken = jwt.sign(
    { 
      userId: testUser._id,
      type: 'access',
      roles: ['user']
    }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Orders API Tests', () => {
  const testOrder = {
    type: 'buy',
    amount: 1000,
    price: 50000
  };

  test('POST /api/orders - Create order with valid data', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('order');
    expect(res.body.order.type).toBe(testOrder.type);
    expect(res.body.order.amount).toBe(testOrder.amount);
    testOrderId = res.body.order._id;
  });

  test('GET /api/orders/public - Get public orders', async () => {
    const res = await request(app)
      .get('/api/orders/public');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/orders/public - Get filtered orders', async () => {
    const res = await request(app)
      .get('/api/orders/public')
      .query({
        type: 'buy',
        minPrice: 1000,
        maxPrice: 100000
      });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/orders/:id - Get specific order', async () => {
    const res = await request(app)
      .get(`/api/orders/${testOrderId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(testOrderId);
  });

  test('POST /api/orders - Create order with invalid data', async () => {
    const invalidOrder = {
      type: 'invalid',
      amount: -100,
      price: 0
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidOrder);

    expect(res.statusCode).toBe(400);
  });

  test('DELETE /api/orders/:id - Delete order', async () => {
    const res = await request(app)
      .delete(`/api/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Order deleted successfully.');
  });
});
