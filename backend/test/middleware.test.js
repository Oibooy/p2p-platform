
const request = require('supertest');
const app = require('../src/app');
const { ValidationError, AuthorizationError } = require('../src/infrastructure/errors');
const { verifyToken, validateRequest } = require('../src/api/middleware');

describe('Middleware Tests', () => {
  describe('Auth Middleware', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should validate token format', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('Validation Middleware', () => {
    it('should catch validation errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiter', () => {
    it('should limit requests', async () => {
      for (let i = 0; i < 101; i++) {
        await request(app).post('/api/auth/login');
      }
      const res = await request(app).post('/api/auth/login');
      expect(res.status).toBe(429);
    });
  });
});
