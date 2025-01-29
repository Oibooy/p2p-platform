
const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('./generateTestToken');

describe('Order Routes', () => {
  let token;
  
  beforeAll(async () => {
    token = await generateTestToken();
  });

  describe('GET /api/orders/public', () => {
    it('should return public orders', async () => {
      const res = await request(app)
        .get('/api/orders/public')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('Protected Routes', () => {
    it('should create new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'buy',
          amount: 100,
          price: 50
        })
        .expect(201);
      
      expect(res.body).toHaveProperty('_id');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);
    });
  });
});
