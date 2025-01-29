
const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('./generateTestToken');

describe('Reviews API', () => {
  let authToken;
  let testReviewId;

  beforeAll(async () => {
    authToken = await generateTestToken();
  });

  test('POST /api/reviews - create review', async () => {
    const reviewData = {
      dealId: '65b3f7b8e32a37c1234567890',
      rating: 5,
      comment: 'Great service!'
    };

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reviewData);

    expect(res.statusCode).toBe(201);
    testReviewId = res.body.review._id;
  });

  test('GET /api/reviews/user/:userId - get user reviews', async () => {
    const res = await request(app)
      .get('/api/reviews/user/65b3f7b8e32a37c1234567891')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  test('PUT /api/reviews/:id - update review', async () => {
    const updateData = {
      rating: 4,
      comment: 'Updated review comment'
    };

    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(res.statusCode).toBe(200);
  });
});
