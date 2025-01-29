
const request = require('supertest');
const app = require('../src/app');
const { AppError } = require('../src/infrastructure/errors');

describe('Middleware Tests', () => {
  describe('Auth Middleware', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
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

  describe('Error Handler', () => {
    it('should handle AppError', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
