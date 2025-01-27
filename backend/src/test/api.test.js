const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ObjectId } = require('mongodb');


// Отключаем автоматическое открытие веб-интерфейса при тестах
process.env.NODE_ENV = 'test';
process.env.DISABLE_WEB = 'true';

let authToken;
let testOrderId;
let testDisputeId;
let testReviewId;
let resetToken;

// Test setup and teardown
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});

  // Создаем уникального тестового пользователя
  const testUser = new User({
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    password: 'hashedpassword',
    isEmailConfirmed: true,
    isActive: true
  });
  await testUser.save();

  // Создаем валидный токен для тестового пользователя
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
  if (global.redisClient) {
    await global.redisClient.quit();
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Закрываем все открытые соединения
  await Promise.all([
    new Promise(resolve => setTimeout(resolve, 500))
  ]);
  if (global.tronWeb) {
    await Promise.all([
      tronWeb.fullNode.instance.destroy(),
      tronWeb.solidityNode.instance.destroy(),
      tronWeb.eventServer.instance.destroy()
    ]);
  }
});


// Test Data
const testData = {
  user: {
    username: 'testuser',
    email: 'test' + Date.now() + '@example.com',
    password: 'Test123!'
  },
  order: {
    type: 'buy',
    amount: 100,
    price: 50000
  },
  dispute: {
    reason: 'Test dispute reason'
  },
  review: {
    rating: 5,
    comment: 'Great service!'
  },
  notification: {
    settings: {
      email: true,
      sms: false,
      push: true
    }
  }
};

// Authentication Tests
describe('Authentication API', () => {
  describe('Registration', () => {
    test('POST /api/auth/register - success', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testData.user);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('userId');
    });

    test('POST /api/auth/register - duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testData.user);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/login - success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.user.email,
          password: testData.user.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
    });

    test('POST /api/auth/login - wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.user.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Password Reset', () => {
    test('POST /api/auth/forgot-password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testData.user.email });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');

      const user = await User.findOne({ email: testData.user.email });
      resetToken = user.resetPasswordToken;
    });

    test('POST /api/auth/reset-password/:token', async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'NewPassword123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});

// Validation Tests
describe('Input Validation', () => {
  test('POST /api/orders - invalid amount', async () => {
    const invalidOrder = {
      ...testData.order,
      amount: -100
    };
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidOrder);
    expect(res.statusCode).toBe(400);
  });
});

// Role Tests
describe('Role Authorization', () => {
  test('GET /api/admin/users - unauthorized access', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// Escrow Tests
describe('Escrow Operations', () => {
  test('POST /api/escrow/release - unauthorized release', async () => {
    const res = await request(app)
      .post('/api/escrow/release')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ dealId: testOrderId });
    expect(res.statusCode).toBe(403);
  });
});

// Orders API Tests
describe('Orders API', () => {
  test('GET /api/orders/public', async () => {
    const res = await request(app)
      .get('/api/orders/public');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/orders - create order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testData.order);

    expect(res.statusCode).toBe(201);
    testOrderId = res.body.order._id;
  });

  test('GET /api/orders/:id - get specific order', async () => {
    const res = await request(app)
      .get(`/api/orders/${testOrderId}`);
    expect(res.statusCode).toBe(200);
  });
});

// Escrow API Tests
describe('Escrow API', () => {
  test('POST /api/escrow/deposit', async () => {
    const depositData = {
      dealId: testOrderId,
      amount: 1000
    };

    const res = await request(app)
      .post('/api/escrow/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send(depositData);

    expect(res.statusCode).toBe(200);
  });
});

// Disputes API Tests
describe('Disputes API', () => {
  test('POST /api/disputes - create dispute', async () => {
    const disputeData = {
      order_id: testOrderId,
      reason: testData.dispute.reason
    };

    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(disputeData);

    expect(res.statusCode).toBe(201);
    testDisputeId = res.body._id;
  });

  test('GET /api/disputes - get disputes list', async () => {
    const res = await request(app)
      .get('/api/disputes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });
});

// Reviews API Tests
describe('Reviews API', () => {
  test('POST /api/reviews - create review', async () => {
    const reviewData = {
      dealId: testOrderId,
      to: '65b3f7b8e32a37c1234567891',
      ...testData.review
    };

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reviewData);

    expect(res.statusCode).toBe(201);
    testReviewId = res.body.review._id;
  });

  test('GET /api/reviews/:userId - get user reviews', async () => {
    const res = await request(app)
      .get(`/api/reviews/65b3f7b8e32a37c1234567891`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reviews');
  });
});

// Notifications API Tests
describe('Notifications API', () => {
  test('GET /api/notifications/settings', async () => {
    const res = await request(app)
      .get('/api/notifications/settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('notificationSettings');
  });

  test('PUT /api/notifications/settings - update settings', async () => {
    const res = await request(app)
      .put('/api/notifications/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testData.notification.settings);

    expect(res.statusCode).toBe(200);
  });
});