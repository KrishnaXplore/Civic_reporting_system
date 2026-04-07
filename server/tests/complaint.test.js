const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');

// Mock external services
jest.mock('../config/cloudinary', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image.jpg' }),
}));
jest.mock('../utils/mlProcessor', () => ({
  runMLChecks: jest.fn().mockResolvedValue({ isDuplicate: false, isAIGenerated: false }),
}));
jest.mock('../utils/geocode', () => ({
  reverseGeocode: jest.fn().mockResolvedValue({
    country: 'India', state: 'Karnataka', city: 'Bengaluru',
    district: 'Bengaluru Urban', ward: 'Ward 1', locality: 'Koramangala', pincode: '560034',
  }),
}));

const AUTH = '/api/v1/auth';
const BASE = '/api/v1/complaints';

const registerAndLogin = async (role = 'citizen', email = 'citizen@test.com') => {
  const payload = { name: 'Test User', email, phone: '9999999901', password: 'password123' };
  await request(app).post(`${AUTH}/register`).send(payload);
  if (role !== 'citizen') {
    await User.findOneAndUpdate({ email }, { role });
  }
  const res = await request(app).post(`${AUTH}/login`).send({ email, password: 'password123' });
  return res.headers['set-cookie'];
};

const seedComplaint = async (citizenId, status = 'Submitted') => {
  return Complaint.create({
    title: 'Test Complaint',
    description: 'Test description',
    category: 'Roads & Infrastructure',
    beforeImage: 'https://example.com/image.jpg',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    locationDetails: { country: 'India', state: 'Karnataka', city: 'Bengaluru', ward: 'Ward 1', locality: 'Koramangala' },
    status,
    citizen: citizenId,
    timeline: [{ status, note: 'Test', updatedBy: citizenId }],
  });
};

// ─── Public Routes ────────────────────────────────────────────────────────────

describe('Complaints — Public Routes', () => {
  it('GET /map returns complaints without auth', async () => {
    const res = await request(app).get(`${BASE}/map`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /public returns paginated complaints without auth', async () => {
    const res = await request(app).get(`${BASE}/public`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /public filters by status', async () => {
    const res = await request(app).get(`${BASE}/public?status=Submitted`);
    expect(res.status).toBe(200);
    res.body.data.forEach((c) => expect(c.status).toBe('Submitted'));
  });

  it('GET /public filters by city', async () => {
    const citizen = await User.create({
      name: 'C', email: 'c@loc.com', phone: '9111000001', password: 'password123', role: 'citizen',
    });
    await Complaint.create({
      title: 'Mumbai complaint', description: 'desc', category: 'Electricity',
      beforeImage: 'https://x.com/img.jpg',
      location: { type: 'Point', coordinates: [72.877, 19.076] },
      locationDetails: { city: 'Mumbai', state: 'Maharashtra', ward: 'Ward A', country: 'India', locality: 'Andheri' },
      status: 'Submitted', citizen: citizen._id,
    });
    const res = await request(app).get(`${BASE}/public?city=Mumbai`);
    expect(res.status).toBe(200);
    res.body.data.forEach((c) => expect(c.locationDetails.city).toMatch(/Mumbai/i));
  });

  it('GET /public filters by ward', async () => {
    const res = await request(app).get(`${BASE}/public?ward=Ward+1`);
    expect(res.status).toBe(200);
  });

  it('GET /public does not return Rejected complaints', async () => {
    const citizen = await User.create({
      name: 'Cit', email: 'rej@test.com', phone: '9111000002', password: 'password123', role: 'citizen',
    });
    await seedComplaint(citizen._id, 'Rejected');
    const res = await request(app).get(`${BASE}/public`);
    const statuses = res.body.data.map((c) => c.status);
    expect(statuses).not.toContain('Rejected');
  });
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

describe('Complaints — Protected Routes', () => {
  it('GET / returns 401 without auth', async () => {
    const res = await request(app).get(`${BASE}/`);
    expect(res.status).toBe(401);
  });

  it('POST / returns 401 without auth', async () => {
    const res = await request(app).post(`${BASE}/`).send({});
    expect(res.status).toBe(401);
  });

  it('officer cannot submit a complaint (403)', async () => {
    const cookies = await registerAndLogin('officer', 'officer@test.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .attach('image', Buffer.from('fake'), 'test.jpg')
      .field('title', 'Test').field('description', 'Test desc')
      .field('category', 'Roads & Infrastructure')
      .field('lat', '12.9716').field('lng', '77.5946');
    expect(res.status).toBe(403);
  });

  it('GET /department returns 401 without auth', async () => {
    expect((await request(app).get(`${BASE}/department`)).status).toBe(401);
  });

  it('citizen cannot access /department (403)', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen2@test.com');
    expect((await request(app).get(`${BASE}/department`).set('Cookie', cookies)).status).toBe(403);
  });

  it('officer can access /department', async () => {
    const cookies = await registerAndLogin('officer', 'officer2@test.com');
    const res = await request(app).get(`${BASE}/department`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── Submit ───────────────────────────────────────────────────────────────────

describe('Complaints — Submit', () => {
  it('citizen can submit a complaint', async () => {
    await Department.create({ name: 'Roads & Infrastructure', description: 'Test dept' });
    const cookies = await registerAndLogin('citizen', 'citizen3@test.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .attach('image', Buffer.from('fake image'), 'test.jpg')
      .field('title', 'Pothole on main road')
      .field('description', 'Large pothole near bus stop')
      .field('category', 'Roads & Infrastructure')
      .field('lat', '12.9716').field('lng', '77.5946');
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Pothole on main road');
    expect(res.body.data.status).toBe('Submitted');
    expect(res.body.data.timeline).toHaveLength(1);
    expect(res.body.data.timeline[0].status).toBe('Submitted');
  });

  it('returns 400 if title is missing', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen4@test.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .attach('image', Buffer.from('fake'), 'test.jpg')
      .field('description', 'Test').field('category', 'Roads & Infrastructure')
      .field('lat', '12.9716').field('lng', '77.5946');
    expect(res.status).toBe(400);
  });

  it('returns 400 if image is missing', async () => {
    const cookies = await registerAndLogin('citizen', 'citizen5@test.com');
    const res = await request(app)
      .post(`${BASE}/`)
      .set('Cookie', cookies)
      .field('title', 'No image').field('description', 'Test')
      .field('category', 'Roads & Infrastructure')
      .field('lat', '12.9716').field('lng', '77.5946');
    expect(res.status).toBe(400);
  });
});

// ─── Get By ID ────────────────────────────────────────────────────────────────

describe('Complaints — Get By ID', () => {
  it('citizen can view their own complaint', async () => {
    const cookies = await registerAndLogin('citizen', 'own@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id);
    const res = await request(app).get(`${BASE}/${complaint._id}`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(complaint._id.toString());
  });

  it("citizen can view another citizen's non-rejected complaint", async () => {
    const owner = await User.create({
      name: 'Owner', email: 'owner@test.com', phone: '9111100001', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id, 'Submitted');
    const cookies = await registerAndLogin('citizen', 'viewer@test.com');
    const res = await request(app).get(`${BASE}/${complaint._id}`).set('Cookie', cookies);
    expect(res.status).toBe(200);
  });

  it("citizen cannot view another citizen's rejected complaint (403)", async () => {
    const owner = await User.create({
      name: 'Owner2', email: 'owner2@test.com', phone: '9111100002', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id, 'Rejected');
    const cookies = await registerAndLogin('citizen', 'viewer2@test.com');
    const res = await request(app).get(`${BASE}/${complaint._id}`).set('Cookie', cookies);
    expect(res.status).toBe(403);
  });
});

// ─── Upvote ───────────────────────────────────────────────────────────────────

describe('Complaints — Upvote', () => {
  it('citizen can upvote a complaint', async () => {
    const owner = await User.create({
      name: 'Owner', email: 'upvoteowner@test.com', phone: '9111200001', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id);
    const cookies = await registerAndLogin('citizen', 'upvoter@test.com');
    const res = await request(app).post(`${BASE}/${complaint._id}/upvote`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data.upvotes).toBe(1);
    expect(res.body.data.upvoted).toBe(true);
  });

  it('upvoting twice toggles the upvote off', async () => {
    const owner = await User.create({
      name: 'Owner2', email: 'toggleowner@test.com', phone: '9111200002', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id);
    const cookies = await registerAndLogin('citizen', 'toggler@test.com');
    await request(app).post(`${BASE}/${complaint._id}/upvote`).set('Cookie', cookies);
    const res = await request(app).post(`${BASE}/${complaint._id}/upvote`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data.upvotes).toBe(0);
    expect(res.body.data.upvoted).toBe(false);
  });

  it('upvote requires auth (401)', async () => {
    const owner = await User.create({
      name: 'Owner3', email: 'noauthowner@test.com', phone: '9111200003', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id);
    const res = await request(app).post(`${BASE}/${complaint._id}/upvote`);
    expect(res.status).toBe(401);
  });

  it('multiple citizens upvote independently', async () => {
    const owner = await User.create({
      name: 'Owner4', email: 'multiowner@test.com', phone: '9111200004', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(owner._id);
    const cookies1 = await registerAndLogin('citizen', 'voter1@test.com');
    const cookies2 = await registerAndLogin('citizen', 'voter2@test.com');
    await request(app).post(`${BASE}/${complaint._id}/upvote`).set('Cookie', cookies1);
    const res = await request(app).post(`${BASE}/${complaint._id}/upvote`).set('Cookie', cookies2);
    expect(res.body.data.upvotes).toBe(2);
  });
});
