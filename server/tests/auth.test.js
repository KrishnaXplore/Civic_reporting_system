const request = require('supertest');
const app = require('../app');

const BASE = '/api/v1/auth';

const citizenPayload = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '9999999999',
  password: 'password123',
};

// Helper: register + login and return cookie
const loginAs = async (payload = citizenPayload) => {
  await request(app).post(`${BASE}/register`).send(payload);
  const res = await request(app).post(`${BASE}/login`).send({
    email: payload.email,
    password: payload.password,
  });
  return res.headers['set-cookie'];
};

describe('Auth — Register', () => {
  it('should register a new citizen successfully', async () => {
    const res = await request(app).post(`${BASE}/register`).send(citizenPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(citizenPayload.email);
    expect(res.body.user.role).toBe('citizen');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should not register with a duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(citizenPayload);
    const res = await request(app).post(`${BASE}/register`).send(citizenPayload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should not register without a name', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      ...citizenPayload, name: '',
    });
    expect(res.status).toBe(400);
  });

  it('should not register without a phone', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      ...citizenPayload, phone: '',
    });
    expect(res.status).toBe(400);
  });

  it('should not register with a password shorter than 6 characters', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      ...citizenPayload, password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth — Login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(citizenPayload);
  });

  it('should login with correct credentials and set cookie', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: citizenPayload.email,
      password: citizenPayload.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(citizenPayload.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: citizenPayload.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth — Get Me', () => {
  it('should return current user when authenticated', async () => {
    const cookies = await loginAs();
    const res = await request(app).get(`${BASE}/me`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(citizenPayload.email);
  });

  it('should return 401 when no cookie is provided', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });
});

describe('Auth — Logout', () => {
  it('should logout and clear the cookie', async () => {
    const cookies = await loginAs();
    const res = await request(app).post(`${BASE}/logout`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Cookie should be cleared (maxAge=0 or empty)
    const setCookie = res.headers['set-cookie']?.[0] || '';
    expect(setCookie).toMatch(/token=;|token=$/);
  });
});

describe('Auth — Forgot Password', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(citizenPayload);
  });

  it('should return success for a registered email (no enumeration)', async () => {
    const res = await request(app).post(`${BASE}/forgot-password`).send({
      email: citizenPayload.email,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return success even for an unregistered email (prevents enumeration)', async () => {
    const res = await request(app).post(`${BASE}/forgot-password`).send({
      email: 'unknown@example.com',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
