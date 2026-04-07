# CivicConnect — System Design

## 1. Overview

CivicConnect is a civic complaint management platform that allows citizens to report public infrastructure issues (potholes, power outages, water leaks, etc.), tracks their resolution through a multi-tier government hierarchy, and uses AI to detect duplicate and fake complaints. Citizens can upvote issues they care about, comment on complaints for community discussion, and filter complaints by their local area.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                │
│  Public Pages │ Citizen Dashboard │ Admin Dashboards         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
                           │ Cookie-based JWT
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVER (Node.js + Express)                │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │Complaints│  │  Admin   │  │ Comments  │  │
│  │ Routes   │  │  Routes  │  │  Routes  │  │  Routes   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │               │        │
│  ┌────▼──────────────▼──────────────▼───────────────▼────┐  │
│  │           Controllers + Middleware Layer               │  │
│  │  protect │ roleGuard │ rateLimiter │ errorHandler      │  │
│  └────┬──────────────┬──────────────┬────────────────────┘  │
│       │              │              │                        │
│  ┌────▼────┐   ┌──────▼──┐   ┌─────▼──────┐                │
│  │ MongoDB │   │  Redis  │   │ ML Service │ ← fire-forget   │
│  │Mongoose │   │  Cache  │   │  (Flask)   │                 │
│  └─────────┘   └─────────┘   └────────────┘                │
│                                                             │
│  ┌──────────┐   ┌───────────┐   ┌──────────┐               │
│  │Cloudinary│   │  Nominatim│   │ Nodemailer│               │
│  │(Images)  │   │ (Geocode) │   │  (Email) │               │
│  └──────────┘   └───────────┘   └──────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Key Design Decisions

### 3.1 Why MongoDB over PostgreSQL?

| Factor | Decision |
|--------|----------|
| Complaint schema | Complaints embed `locationDetails` (country/state/city/ward/locality) — schema varies by geography. MongoDB's flexible documents handle this naturally. |
| Geospatial queries | MongoDB has native `2dsphere` index and `$near` operator for map-based complaint lookups. |
| Embedded timeline | Status history is an array inside each complaint document — no joins needed for the most common read path. |
| Horizontal scale | Sharding by location is straightforward in MongoDB Atlas. |

**Trade-off**: We lose ACID transactions for multi-document writes (e.g., banning a user + writing audit log). Mitigated by making audit logs fire-and-forget — the main operation always succeeds.

---

### 3.2 JWT via HttpOnly Cookies (not localStorage)

Storing JWT in `localStorage` is vulnerable to XSS attacks. Using `HttpOnly` cookies means JavaScript cannot read the token — even if an attacker injects malicious scripts, they cannot steal the session token.

```
Login → Server sets HttpOnly cookie (token=<jwt>)
Request → Browser auto-sends cookie with every request
Server → reads req.cookies.token → verifies JWT
```

---

### 3.3 Role Hierarchy and Jurisdiction Scoping

```
superAdmin
  └── stateAdmin     (scoped to one state)
        └── cityAdmin    (scoped to one city)
              └── wardOfficer  (scoped to one ward)
deptAdmin            (scoped to one department)
  └── officer        (resolves complaints, posts public comments)
citizen              (files complaints, upvotes, comments)
```

Each admin role has a `jurisdiction` object `{country, state, city, district, ward}` on the User model. The `getLocationStats` API filters complaints by these fields using MongoDB regex queries, enabling each admin level to see only their relevant data.

---

### 3.4 Redis Caching with Graceful Fallback

Frequently-read, rarely-changing data is cached in Redis:

| Cache Key | TTL | Invalidated When |
|-----------|-----|-----------------|
| `admin:stats` | 5 min | User banned |
| `departments:list` | 10 min | Department created/modified |

```js
// Graceful fallback pattern — Redis never blocks a request
const cached = await getCache(key);
if (cached) return ApiSuccess(res, { data: cached });
// ... fetch from MongoDB ...
await setCache(key, data, ttl); // silently fails if Redis is down
```

Redis uses `lazyConnect: true` and `retryStrategy: () => null` — if Redis is unavailable, every request falls through to MongoDB with zero impact on functionality.

---

### 3.5 Complaint Timeline (Status History)

Every complaint embeds a `timeline` array that records every status transition:

```js
timeline: [{
  status: 'Assigned',
  updatedBy: ref(User),
  note: 'Assigned to officer John',
  timestamp: Date
}]
```

This powers the Activity Timeline UI on the complaint detail page. Storing it embedded (not as a separate collection) keeps reads fast — one document fetch returns the full history.

`resolvedAt` is stored explicitly (not derived from `updatedAt`) to enable accurate average resolution time calculations via `$subtract` aggregation.

---

### 3.6 Complaint Upvoting with Deduplication

```js
upvotes: Number,
upvotedBy: [{ type: ObjectId, ref: 'User' }]
```

The `upvotedBy` array prevents double-voting. On each upvote request, the server checks membership in O(n) — acceptable since upvote counts are bounded per complaint. The toggle pattern (add if not present, remove if present) provides undo functionality.

**Trade-off**: At very high upvote counts (10k+), checking array membership becomes slow. Fix: use a separate `Upvote` collection indexed by `{complaint, user}` with a unique compound index.

---

### 3.7 Public Comments with Abuse Controls

Comments are paginated (10 per page, newest first) and publicly readable without auth. Posting requires:
- Authentication (any role)
- `strikeCount < 3` for citizens (flagged users are blocked)
- Complaint must not be Rejected

Delete is restricted to the comment's author or superAdmin. This gives officers the ability to post public progress updates visible to all stakeholders, while keeping moderation control with admins.

---

### 3.8 AI Duplicate Detection — Async Processing

```
1. Citizen submits complaint
2. Server validates + saves complaint (status: Submitted)
3. Server responds 201 immediately ← user gets fast response
4. ML service runs in background (async, fire-and-forget)
5. ML checks: duplicate (cosine similarity) + AI image (classifier)
6. If duplicate/fake → complaint marked Rejected + citizen notified via SSE
```

**Why async?** ML inference takes 2–5 seconds. Blocking the API response would create terrible UX. The complaint is saved immediately; the AI check is a background correction.

---

### 3.9 Real-Time Notifications via SSE (not WebSockets)

| | SSE | WebSockets |
|---|---|---|
| Direction | Server → Client only | Bidirectional |
| Protocol | HTTP/1.1 | ws:// |
| Complexity | Simple, works with Express | Requires separate ws server |
| Use case | Push notifications | Chat, live collaboration |

Our use case is one-directional (server pushes complaint status updates to citizen). SSE is simpler and sufficient.

**Trade-off**: SSE connections stay open per user. At scale (10k+ concurrent users), this needs a Redis pub/sub layer to fan out events across multiple server instances.

---

### 3.10 Location-Based Filtering and "My Area"

Public complaints support filtering by `city` and `ward` using MongoDB regex:

```js
if (city) query['locationDetails.city'] = { $regex: city.trim(), $options: 'i' };
if (ward) query['locationDetails.ward'] = { $regex: ward.trim(), $options: 'i' };
```

The "My Area" button uses **browser geolocation + Nominatim reverse geocoding** to detect the user's current city automatically, then applies it as a filter — no manual typing required.

---

## 4. Database Schema (Key Models)

### User
```js
{
  name, email, phone, password,        // bcrypt hashed
  role: enum[citizen, officer, wardOfficer, deptAdmin, cityAdmin, stateAdmin, superAdmin],
  department: ref(Department),
  jurisdiction: { country, state, city, district, ward },
  locality: String,
  profilePhoto: String,                // Cloudinary URL
  trustScore: Number,                  // 0-100
  strikeCount: Number,                 // 3+ = flagged, blocks commenting
  status: enum[active, warned, banned]
}
```

### Complaint
```js
{
  title, description, category,
  beforeImage, afterImage,             // Cloudinary URLs
  location: GeoJSON Point,             // [lng, lat] — 2dsphere index
  locationDetails: { country, state, city, district, ward, locality, pincode },
  status: enum[Submitted, Assigned, InProgress, Resolved, Rejected],
  citizen: ref(User),
  assignedTo: ref(User),
  department: ref(Department),
  fundsSpent: Number,
  upvotes: Number,
  upvotedBy: [ref(User)],              // deduplication array
  resolvedAt: Date,                    // set explicitly for avg resolution calc
  duplicateOf: ref(Complaint),         // set by ML service
  rejectionReason: String,
  timeline: [{                         // embedded status history
    status, updatedBy: ref(User), note, timestamp
  }]
}
```

### Comment
```js
{
  complaint: ref(Complaint),
  author: ref(User),
  text: String,                        // max 500 chars
  createdAt, updatedAt
}
// Index: { complaint: 1, createdAt: -1 }
```

### Indexes
```
Complaint:
  { location: '2dsphere' }
  { 'locationDetails.state': 1, status: 1 }
  { 'locationDetails.city': 1, status: 1 }
  { 'locationDetails.ward': 1, status: 1 }

Comment:
  { complaint: 1, createdAt: -1 }
```

---

## 5. API Design

Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | Public | Register new citizen |
| POST | /auth/login | Public | Login, sets JWT cookie |
| GET | /auth/me | Any | Get current user |
| POST | /auth/upload-photo | Auth | Upload profile photo |
| POST | /auth/forgot-password | Public | Send reset email |
| POST | /auth/reset-password | Public | Reset via token |
| GET | /complaints/map | Public | All complaints for map |
| GET | /complaints/public | Public | Paginated, city/ward filters |
| POST | /complaints | Citizen | Submit complaint |
| GET | /complaints/:id | Auth | Get complaint + timeline |
| PUT | /complaints/:id/status | Officer+ | Update status |
| PUT | /complaints/:id/resolve | Officer/DeptAdmin | Resolve with after image |
| POST | /complaints/:id/upvote | Auth | Toggle upvote |
| GET | /complaints/:id/comments | Public | Paginated comments |
| POST | /complaints/:id/comments | Auth, not flagged | Add comment |
| DELETE | /complaints/:id/comments/:cid | Author/SuperAdmin | Delete comment |
| GET | /departments | Auth | List (Redis cached 10 min) |
| POST | /departments | SuperAdmin | Create department |
| POST | /departments/:id/officers | DeptAdmin+ | Add officer |
| GET | /admin/stats | Public | Platform stats (Redis cached 5 min) |
| GET | /admin/stats/location | Admin+ | Location-filtered stats |
| GET | /admin/export | SuperAdmin/CityAdmin/StateAdmin | CSV download |
| GET | /admin/flagged-users | SuperAdmin | Users with 3+ strikes |
| PUT | /admin/users/:id/ban | SuperAdmin | Ban user |
| PUT | /admin/users/:id/clear-strikes | SuperAdmin | Clear strikes |
| GET | /admin/audit-logs | SuperAdmin | Paginated action history |
| GET | /notifications/connect | Auth | SSE stream |

---

## 6. Security Measures

| Threat | Mitigation |
|--------|-----------|
| XSS | HttpOnly cookies (JWT inaccessible to JS) |
| CSRF | SameSite=Lax cookies in dev, SameSite=None+Secure in prod |
| Brute force | express-rate-limit (auth: 20 req/15min, global: 500 req/5min) |
| SQL/NoSQL Injection | Mongoose parameterized queries; regex inputs sanitized with trim |
| Sensitive headers | helmet.js (removes X-Powered-By, sets CSP, HSTS etc.) |
| Mass assignment | Explicit field selection in every controller |
| Fake/AI images | ML classifier on every complaint submission |
| Password reset | SHA-256 hashed token in DB with 15-min TTL |
| Banned users | Status check on every authenticated request |
| Comment abuse | Strike system — 3+ strikes blocks commenting |
| Admin actions | Every ban/strike-clear logged to AuditLog with actor + IP |

---

## 7. Testing Strategy

**78 tests across 5 files** using Jest + Supertest + mongodb-memory-server.

| File | Tests | Key Scenarios |
|------|-------|---------------|
| auth.test.js | 12 | Register, login, cookie, logout, forgot password |
| complaint.test.js | 22 | Public routes, city/ward filter, upvote toggle, deduplication, auth guards |
| comment.test.js | 14 | Pagination, add/delete, strike block, rejected complaint block |
| admin.test.js | 16 | Stats shape, avgResolutionDays, CSV export, ban, audit log filter |
| department.test.js | 9 | List (cached), create, add officer, 404 |

Each test suite runs against an in-memory MongoDB instance — no external dependencies required.

---

## 8. Scaling Considerations

### Current Architecture (Monolith)
```
1 Express server → MongoDB Atlas → Redis → ML service
```

### At 100k Users
- Redis already in place for caching — extend to SSE pub/sub (fan out notifications across pods)
- MongoDB read replicas for heavy dashboard aggregation queries
- CDN for Cloudinary image delivery

### At 1M Users (Kubernetes HPA — already configured)
```bash
kubectl apply -f k8s/server-hpa.yaml
# Min 1 pod → auto-scales to 5 pods at 50% CPU
```
- Stateless server (JWT in cookies, no in-memory session) → safe horizontal scaling
- ML service scales independently (CPU-intensive inference separated from API)
- MongoDB Atlas auto-scaling for DB tier

### Known Bottlenecks at Scale
| Bottleneck | Fix |
|-----------|-----|
| Nominatim 1 req/sec limit | Self-host Nominatim or use paid geocoding API |
| SSE open connections (10k+) | Redis pub/sub + connection pooling |
| upvotedBy array O(n) lookup | Separate `Upvote` collection with unique compound index `{complaint, user}` |
| Comment pagination at scale | Cursor-based pagination (keyset) instead of skip/limit |
| Stats aggregation cost | Pre-aggregate with MongoDB change streams + scheduled jobs |
