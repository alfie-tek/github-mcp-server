const request = require('supertest');
const app = require('../src/server');

describe('GitHub MCP Server', () => {
  test('should return 200 for health check endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('should return 401 for unauthorized access to protected endpoints', async () => {
    const response = await request(app).get('/api/github/repos');
    expect(response.statusCode).toBe(401);
  });

  test('should return 400 for invalid request body', async () => {
    const response = await request(app)
      .post('/api/github/webhook')
      .send({ invalid: 'data' });
    expect(response.statusCode).toBe(400);
  });
}); 