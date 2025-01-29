
const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('./generateTestToken');

describe('Dispute Routes', () => {
  let moderatorToken, userToken;

  beforeAll(async () => {
    moderatorToken = await generateTestToken('moderator');
    userToken = await generateTestToken('user');
  });

  describe('GET /api/disputes', () => {
    it('should return disputes for moderator', async () => {
      const res = await request(app)
        .get('/api/disputes')
        .set('Authorization', `Bearer ${moderatorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should reject non-moderator access', async () => {
      const res = await request(app)
        .get('/api/disputes')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  // Add more test cases for other routes
});
