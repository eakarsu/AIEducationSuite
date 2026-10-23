const request = require('supertest');

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    app = require('../index');
  });

  it('POST /api/auth/login without credentials should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login with wrong credentials should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/demo-credentials is disabled (no default accounts)', async () => {
    const res = await request(app).get('/api/auth/demo-credentials');
    expect(res.statusCode).toBe(404);
    expect(res.body).not.toHaveProperty('password');
  });

  it('GET /api/auth/verify without token should return 401', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.statusCode).toBe(401);
  });
});
