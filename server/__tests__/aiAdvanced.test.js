const request = require('supertest');

describe('aiAdvanced routes', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret';
    app = require('../index');
  });

  // Note: aiLimiter is applied at the router-mount level before auth, so an
  // unauthenticated request will get either 401 (auth check) or 429 (rate
  // limit) depending on which middleware fires first. Both are correct gates.
  const isGated = (code) => code === 401 || code === 429;

  it('gates unauthenticated tutor-chat', async () => {
    const res = await request(app)
      .post('/api/ai/tutor-chat')
      .send({ message: 'Hi' });
    expect(isGated(res.statusCode)).toBe(true);
  });

  it('gates unauthenticated originality check', async () => {
    const res = await request(app).post('/api/ai/essays/1/originality');
    expect(isGated(res.statusCode)).toBe(true);
  });

  it('gates unauthenticated next-difficulty', async () => {
    const res = await request(app).post('/api/ai/quizzes/1/next-difficulty');
    expect(isGated(res.statusCode)).toBe(true);
  });

  it('gates unauthenticated teacher-cohort-report', async () => {
    const res = await request(app)
      .post('/api/ai/teacher-cohort-report')
      .send({ date_range: { start: '2025-01-01', end: '2025-01-31' } });
    expect(isGated(res.statusCode)).toBe(true);
  });
});
