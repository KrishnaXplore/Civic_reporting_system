const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const AUTH = '/api/v1/auth';
const BASE = '/api/v1/admin';

const registerAndLogin = async (role, email) => {
  const payload = { name: 'Test User', email, phone: '9888888801', password: 'password123' };
  await request(app).post(`${AUTH}/register`).send(payload);
  if (role !== 'citizen') {
    await User.findOneAndUpdate({ email }, { role });
  }
  const res = await request(app).post(`${AUTH}/login`).send({ email, password: 'password123' });
  return res.headers['set-cookie'];
};

// ─── Stats ────────────────────────────────────────────────────────────────────

describe('Admin — Stats', () => {
  it('GET /stats is publicly accessible', async () => {
    const res = await request(app).get(`${BASE}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalComplaints');
    expect(res.body.data).toHaveProperty('resolved');
    expect(res.body.data).toHaveProperty('totalCitizens');
    expect(res.body.data).toHaveProperty('totalFunds');
    expect(res.body.data).toHaveProperty('byDept');
  });

  it('GET /stats includes avgResolutionDays field', async () => {
    const res = await request(app).get(`${BASE}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('avgResolutionDays');
  });

  it('GET /stats/location requires authentication', async () => {
    expect((await request(app).get(`${BASE}/stats/location?state=Karnataka`)).status).toBe(401);
  });

  it('GET /stats/location citizen gets 403', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen@admintest.com');
    expect((await request(app).get(`${BASE}/stats/location?state=Karnataka`).set('Cookie', cookies)).status).toBe(403);
  });

  it('GET /stats/location superAdmin can access', async () => {
    const cookies = await registerAndLogin('superAdmin', 'superadmin@admintest.com');
    const res = await request(app).get(`${BASE}/stats/location?state=Karnataka`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('byCategory');
    expect(res.body.data).toHaveProperty('avgResolutionDays');
  });

  it('GET /stats/location wardOfficer can access', async () => {
    const cookies = await registerAndLogin('wardOfficer', 'ward@admintest.com');
    const res = await request(app).get(`${BASE}/stats/location?city=Bengaluru`).set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});

// ─── CSV Export ───────────────────────────────────────────────────────────────

describe('Admin — CSV Export', () => {
  it('GET /export returns CSV for superAdmin', async () => {
    const cookies = await registerAndLogin('superAdmin', 'export@admintest.com');
    const res = await request(app).get(`${BASE}/export`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.text).toContain('ID,Title');
  });

  it('GET /export returns CSV for cityAdmin', async () => {
    const cookies = await registerAndLogin('cityAdmin', 'cityexport@admintest.com');
    const res = await request(app).get(`${BASE}/export`).set('Cookie', cookies);
    expect(res.status).toBe(200);
  });

  it('GET /export returns 403 for citizen', async () => {
    const cookies = await registerAndLogin('citizen', 'citizenexport@admintest.com');
    const res = await request(app).get(`${BASE}/export`).set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('GET /export returns 401 without auth', async () => {
    expect((await request(app).get(`${BASE}/export`)).status).toBe(401);
  });

  it('GET /export supports status filter', async () => {
    const cookies = await registerAndLogin('superAdmin', 'export2@admintest.com');
    const res = await request(app).get(`${BASE}/export?status=Resolved`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    const lines = res.text.split('\n');
    // All data rows (skip header) should have Resolved status
    lines.slice(1).filter(Boolean).forEach((line) => {
      if (line.trim()) expect(line).toContain('Resolved');
    });
  });
});

// ─── Flagged Users ────────────────────────────────────────────────────────────

describe('Admin — Flagged Users', () => {
  it('GET /flagged-users requires auth (401)', async () => {
    expect((await request(app).get(`${BASE}/flagged-users`)).status).toBe(401);
  });

  it('GET /flagged-users citizen gets 403', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen2@admintest.com');
    expect((await request(app).get(`${BASE}/flagged-users`).set('Cookie', cookies)).status).toBe(403);
  });

  it('GET /flagged-users superAdmin gets list of users with 3+ strikes', async () => {
    await User.create({
      name: 'Bad Actor', email: 'bad@test.com', phone: '9000000099',
      password: 'password123', role: 'citizen', strikeCount: 4, status: 'warned',
    });
    const cookies = await registerAndLogin('superAdmin', 'superadmin2@admintest.com');
    const res = await request(app).get(`${BASE}/flagged-users`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((u) => expect(u.strikeCount).toBeGreaterThanOrEqual(3));
  });
});

// ─── Ban User ─────────────────────────────────────────────────────────────────

describe('Admin — Ban User', () => {
  it('superAdmin can ban a user', async () => {
    const target = await User.create({
      name: 'Target', email: 'target@test.com', phone: '9000000077',
      password: 'password123', role: 'citizen',
    });
    const cookies = await registerAndLogin('superAdmin', 'superadmin3@admintest.com');
    const res = await request(app).put(`${BASE}/users/${target._id}/ban`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('banned');
  });

  it('citizen cannot ban a user (403)', async () => {
    const target = await User.create({
      name: 'Target2', email: 'target2@test.com', phone: '9000000076',
      password: 'password123', role: 'citizen',
    });
    const cookies = await registerAndLogin('citizen', 'citizen3@admintest.com');
    const res = await request(app).put(`${BASE}/users/${target._id}/ban`).set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent user', async () => {
    const cookies = await registerAndLogin('superAdmin', 'superadmin5@admintest.com');
    const fakeId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app).put(`${BASE}/users/${fakeId}/ban`).set('Cookie', cookies);
    expect(res.status).toBe(404);
  });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

describe('Admin — Audit Logs', () => {
  it('superAdmin can view audit logs', async () => {
    const cookies = await registerAndLogin('superAdmin', 'superadmin4@admintest.com');
    const res = await request(app).get(`${BASE}/audit-logs`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
  });

  it('deptAdmin cannot view audit logs (403)', async () => {
    const cookies = await registerAndLogin('deptAdmin', 'deptadmin@admintest.com');
    const res = await request(app).get(`${BASE}/audit-logs`).set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('audit logs support action filter', async () => {
    const cookies = await registerAndLogin('superAdmin', 'superadmin6@admintest.com');
    const res = await request(app).get(`${BASE}/audit-logs?action=USER_BANNED`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    res.body.data.forEach((log) => expect(log.action).toBe('USER_BANNED'));
  });
});
