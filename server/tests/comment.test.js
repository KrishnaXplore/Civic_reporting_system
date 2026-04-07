const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');

const AUTH = '/api/v1/auth';

const registerAndLogin = async (role = 'citizen', email = 'commenter@test.com') => {
  const payload = { name: 'Test User', email, phone: '9666666601', password: 'password123' };
  await request(app).post(`${AUTH}/register`).send(payload);
  if (role !== 'citizen') await User.findOneAndUpdate({ email }, { role });
  const res = await request(app).post(`${AUTH}/login`).send({ email, password: 'password123' });
  return res.headers['set-cookie'];
};

const seedComplaint = async (citizenId, status = 'Submitted') => {
  return Complaint.create({
    title: 'Comment Test Complaint',
    description: 'A complaint to test comments on',
    category: 'Electricity',
    beforeImage: 'https://example.com/img.jpg',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    locationDetails: { city: 'Bengaluru', state: 'Karnataka', ward: 'Ward 1', country: 'India', locality: 'HSR' },
    status,
    citizen: citizenId,
  });
};

const commentsUrl = (complaintId) => `/api/v1/complaints/${complaintId}/comments`;

// ─── Get Comments ─────────────────────────────────────────────────────────────

describe('Comments — Get', () => {
  it('GET comments is public (no auth required)', async () => {
    const citizen = await User.create({
      name: 'C', email: 'pubowner@test.com', phone: '9666000001', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const res = await request(app).get(commentsUrl(complaint._id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET comments returns pagination metadata', async () => {
    const citizen = await User.create({
      name: 'C2', email: 'pagowner@test.com', phone: '9666000002', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const res = await request(app).get(commentsUrl(complaint._id));
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
    expect(res.body).toHaveProperty('hasMore');
  });

  it('GET comments paginates correctly', async () => {
    const citizen = await User.create({
      name: 'C3', email: 'paglots@test.com', phone: '9666000003', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    // Insert 15 comments directly
    const comments = Array.from({ length: 15 }, (_, i) => ({
      complaint: complaint._id, author: citizen._id, text: `Comment ${i + 1}`,
    }));
    await Comment.insertMany(comments);

    const page1 = await request(app).get(`${commentsUrl(complaint._id)}?page=1&limit=10`);
    expect(page1.body.data).toHaveLength(10);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.total).toBe(15);

    const page2 = await request(app).get(`${commentsUrl(complaint._id)}?page=2&limit=10`);
    expect(page2.body.data).toHaveLength(5);
    expect(page2.body.hasMore).toBe(false);
  });
});

// ─── Add Comment ──────────────────────────────────────────────────────────────

describe('Comments — Add', () => {
  it('citizen can post a comment', async () => {
    const cookies = await registerAndLogin('citizen', 'poster@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id);

    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'Same issue in my street too!' });

    expect(res.status).toBe(201);
    expect(res.body.data.text).toBe('Same issue in my street too!');
    expect(res.body.data.author.name).toBe('Test User');
  });

  it('officer can post a comment (public update)', async () => {
    const cookies = await registerAndLogin('officer', 'officer@commenttest.com');
    const citizen = await User.create({
      name: 'Cit', email: 'citcmt@test.com', phone: '9666000010', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'Team dispatched, work in progress.' });
    expect(res.status).toBe(201);
    expect(res.body.data.author.role).toBe('officer');
  });

  it('posting a comment requires auth (401)', async () => {
    const citizen = await User.create({
      name: 'C', email: 'noauthcmt@test.com', phone: '9666000011', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .send({ text: 'Should fail' });
    expect(res.status).toBe(401);
  });

  it('empty text returns 400', async () => {
    const cookies = await registerAndLogin('citizen', 'emptytext@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id);
    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('text over 500 chars returns 400', async () => {
    const cookies = await registerAndLogin('citizen', 'longtext@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id);
    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('flagged citizen (3+ strikes) cannot comment', async () => {
    const payload = { name: 'Flagged', email: 'flagged@test.com', phone: '9666000020', password: 'password123' };
    await request(app).post(`${AUTH}/register`).send(payload);
    await User.findOneAndUpdate({ email: 'flagged@test.com' }, { strikeCount: 3 });
    const res = await request(app).post(`${AUTH}/login`).send({ email: 'flagged@test.com', password: 'password123' });
    const cookies = res.headers['set-cookie'];

    const citizen = await User.create({
      name: 'Owner', email: 'flagowner@test.com', phone: '9666000021', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);

    const commentRes = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'I should be blocked' });
    expect(commentRes.status).toBe(403);
  });

  it('cannot comment on a rejected complaint', async () => {
    const cookies = await registerAndLogin('citizen', 'rejectedcmt@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id, 'Rejected');
    const res = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'Should not work' });
    expect(res.status).toBe(400);
  });
});

// ─── Delete Comment ───────────────────────────────────────────────────────────

describe('Comments — Delete', () => {
  it('author can delete their own comment', async () => {
    const cookies = await registerAndLogin('citizen', 'deleter@test.com');
    const me = await request(app).get(`${AUTH}/me`).set('Cookie', cookies);
    const complaint = await seedComplaint(me.body.user._id);
    const postRes = await request(app)
      .post(commentsUrl(complaint._id))
      .set('Cookie', cookies)
      .send({ text: 'Delete me' });
    const commentId = postRes.body.data._id;

    const delRes = await request(app)
      .delete(`${commentsUrl(complaint._id)}/${commentId}`)
      .set('Cookie', cookies);
    expect(delRes.status).toBe(200);
  });

  it('another citizen cannot delete someone else\'s comment (403)', async () => {
    const author = await User.create({
      name: 'Author', email: 'author@test.com', phone: '9666000030', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(author._id);
    const comment = await Comment.create({ complaint: complaint._id, author: author._id, text: 'Mine' });

    const cookies = await registerAndLogin('citizen', 'othercitizen@test.com');
    const res = await request(app)
      .delete(`${commentsUrl(complaint._id)}/${comment._id}`)
      .set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('superAdmin can delete any comment', async () => {
    const citizen = await User.create({
      name: 'C', email: 'admindel@test.com', phone: '9666000031', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const comment = await Comment.create({ complaint: complaint._id, author: citizen._id, text: 'Admin can delete' });

    const adminCookies = await registerAndLogin('superAdmin', 'superadmin@commenttest.com');
    const res = await request(app)
      .delete(`${commentsUrl(complaint._id)}/${comment._id}`)
      .set('Cookie', adminCookies);
    expect(res.status).toBe(200);
  });

  it('delete requires auth (401)', async () => {
    const citizen = await User.create({
      name: 'C2', email: 'noauthdel@test.com', phone: '9666000032', password: 'password123', role: 'citizen',
    });
    const complaint = await seedComplaint(citizen._id);
    const comment = await Comment.create({ complaint: complaint._id, author: citizen._id, text: 'No auth' });

    const res = await request(app).delete(`${commentsUrl(complaint._id)}/${comment._id}`);
    expect(res.status).toBe(401);
  });
});
