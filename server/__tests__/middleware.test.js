const request = require('supertest');

describe('Middleware', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret';
    app = require('../index');
  });

  it('should return security headers (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-content-type-options');
  });

  it('should reject requests to protected routes without auth', async () => {
    const res = await request(app).get('/api/essays');
    expect(res.statusCode).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await request(app)
      .get('/api/essays')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.statusCode).toBe(401);
  });
});
