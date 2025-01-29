
const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('./generateTestToken');

describe('Admin Routes', () => {
  let adminToken;
  
  beforeAll(async () => {
    adminToken = await generateTestToken('admin');
  });

  describe('GET /api/admin/users', () => {
    it('should return users list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('should update user role', async () => {
      const userId = 'test-user-id';
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role', 'moderator');
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return admin logs', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
