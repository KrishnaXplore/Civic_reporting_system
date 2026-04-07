const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');

const AUTH = '/api/v1/auth';
const BASE = '/api/v1/departments';

const registerAndLogin = async (role, email) => {
  const payload = { name: 'Test User', email, phone: '9777777701', password: 'password123' };
  await request(app).post(`${AUTH}/register`).send(payload);
  if (role !== 'citizen') {
    await User.findOneAndUpdate({ email }, { role });
  }
  const res = await request(app).post(`${AUTH}/login`).send({ email, password: 'password123' });
  return res.headers['set-cookie'];
};

describe('Departments — List', () => {
  beforeEach(async () => {
    await Department.insertMany([
      { name: 'Roads & Infrastructure', description: 'Manages roads' },
      { name: 'Electricity',            description: 'Manages electricity' },
    ]);
  });

  it('GET / requires authentication', async () => {
    const res = await request(app).get(`${BASE}/`);
    expect(res.status).toBe(401);
  });

  it('GET / authenticated user can list departments', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen@listdepttest.com');
    const res = await request(app).get(`${BASE}/`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('GET / returns correct department names', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen2@listdepttest.com');
    const res = await request(app).get(`${BASE}/`).set('Cookie', cookies);
    const names = res.body.data.map((d) => d.name);
    expect(names).toContain('Roads & Infrastructure');
    expect(names).toContain('Electricity');
  });
});

describe('Departments — Create', () => {
  it('POST / superAdmin can create a department', async () => {
    const cookies = await registerAndLogin('superAdmin', 'superadmin@depttest.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .send({ name: 'Water & Sanitation', description: 'Manages water' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Water & Sanitation');
  });

  it('POST / citizen cannot create a department', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen@depttest.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .send({ name: 'Waste Management', description: 'Manages waste' });
    expect(res.status).toBe(403);
  });

  it('POST / unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post(`${BASE}/`)
      .send({ name: 'Parks & Public Spaces', description: 'Manages parks' });
    expect(res.status).toBe(401);
  });

  it('POST / should not create duplicate department', async () => {
    await Department.create({ name: 'Electricity', description: 'Already exists' });
    const cookies = await registerAndLogin('superAdmin', 'superadmin2@depttest.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .send({ name: 'Electricity', description: 'Duplicate' });
    expect(res.status).toBe(400);
  });
});

describe('Departments — Officers', () => {
  let dept, deptAdminCookies;

  beforeEach(async () => {
    dept = await Department.create({ name: 'Roads & Infrastructure', description: 'Test' });

    await request(app).post(`${AUTH}/register`).send({
      name: 'Dept Admin', email: 'deptadmin@depttest.com',
      phone: '9777777710', password: 'password123',
    });
    await User.findOneAndUpdate(
      { email: 'deptadmin@depttest.com' },
      { role: 'deptAdmin', department: dept._id }
    );
    const loginRes = await request(app).post(`${AUTH}/login`).send({
      email: 'deptadmin@depttest.com', password: 'password123',
    });
    deptAdminCookies = loginRes.headers['set-cookie'];
  });

  it('deptAdmin can add an officer by email (POST /:id/officers)', async () => {
    await User.create({
      name: 'New Officer', email: 'newofficer@test.com', phone: '9000001111',
      password: 'password123', role: 'citizen',
    });

    const res = await request(app)
      .post(`${BASE}/${dept._id}/officers`)  // POST not PUT
      .set('Cookie', deptAdminCookies)
      .send({ email: 'newofficer@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('officer');
  });

  it('adding non-existent user as officer returns 404', async () => {
    const res = await request(app)
      .post(`${BASE}/${dept._id}/officers`)
      .set('Cookie', deptAdminCookies)
      .send({ email: 'ghost@test.com' });
    expect(res.status).toBe(404);
  });
});
