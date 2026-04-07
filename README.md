# CivicConnect

A full-stack civic complaint management platform that allows citizens to report public infrastructure issues, tracks resolution through a multi-tier government hierarchy, and uses AI to detect duplicate and fake complaints.

[![CI/CD](https://github.com/KrishnaXplore/civic-reporting-system/actions/workflows/ci.yml/badge.svg)](https://github.com/KrishnaXplore/civic-reporting-system/actions)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=krishnaxplore_civic-reporting-system&metric=alert_status)](https://sonarcloud.io/project/overview?id=krishnaxplore_civic-reporting-system)

**Live Demo**: [civic-reporting-system-two.vercel.app](https://civic-reporting-system-two.vercel.app)
**API**: [civic-reporting-system-rfyn.onrender.com/health](https://civic-reporting-system-rfyn.onrender.com/health)

---

## Features

- **Complaint submission** with GPS location, photo upload, and category tagging
- **AI duplicate detection** — cosine similarity on complaint embeddings flags near-duplicate reports
- **AI image verification** — classifier rejects AI-generated or digitally altered photos
- **Real-time notifications** via Server-Sent Events (SSE)
- **Interactive map** showing all active complaints by location
- **Multi-tier dashboards** — Ward Officer → City Admin → State Admin → Super Admin
- **Role-based access control** — 7 roles with jurisdiction-scoped data access
- **Reverse geocoding** — auto-fills state/city/ward from GPS coordinates (OpenStreetMap)
- **Complaint upvoting** — citizens upvote issues they care about (deduplication via upvotedBy array)
- **Status timeline** — every complaint status change is recorded with actor, note, and timestamp
- **Public comments** — citizens and officers can comment on complaints; paginated, with delete controls
- **Location-based filtering** — filter public complaints by city/ward; "My Area" auto-detects via browser geolocation
- **Average resolution time** — analytics across all admin dashboards showing avg days to resolve
- **CSV export** — admins export filtered complaint data as downloadable CSV
- **Redis caching** — stats and department list cached (5–10 min TTL) with graceful fallback
- **Trust score system** — citizens accumulate strikes for false reports; 3+ strikes = flagged, blocked from commenting
- **Audit logs** — every admin action (ban, strike clear) is logged with actor and IP
- **Password reset** via email with SHA-256 hashed tokens (15-min TTL)
- **Support ticket system** with admin reply workflow
- **Profile photo upload** — citizens upload profile photos via Cloudinary

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database with geospatial indexing |
| Redis (ioredis) | Response caching with graceful fallback |
| JWT (HttpOnly cookies) | Stateless authentication |
| Cloudinary | Image storage and CDN |
| Nodemailer (Gmail SMTP) | Transactional emails |
| OpenStreetMap Nominatim | Free reverse geocoding |
| Helmet + express-rate-limit | Security hardening |
| Jest + Supertest + mongodb-memory-server | API testing (78 tests) |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| React Router v6 | Client-side routing |
| Recharts | Dashboard charts |
| Leaflet | Interactive complaint map |
| Axios | HTTP client with interceptors |

### ML Service
| Technology | Purpose |
|---|---|
| Python + Flask | ML API server |
| Hugging Face Transformers | Complaint text embeddings |
| ONNX Runtime | Optimized inference |

### DevOps
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Container orchestration |
| Kubernetes + HPA | Auto-scaling (1→5 pods at 50% CPU) |
| GitHub Actions | CI/CD pipeline |
| SonarCloud | Code quality & security analysis |
| Trivy | Container vulnerability scanning |
| Render | Backend hosting |
| Vercel | Frontend hosting |

---

## Role Hierarchy

```
superAdmin
  └── stateAdmin     (scoped to one state)
        └── cityAdmin    (scoped to one city)
              └── wardOfficer  (scoped to one ward)
deptAdmin            (scoped to one department)
  └── officer        (resolves individual complaints)
citizen              (files complaints, upvotes, comments)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+ (for ML service)
- MongoDB (or MongoDB Atlas account)
- Redis (optional — app falls back gracefully if unavailable)

### 1. Clone the repository
```bash
git clone https://github.com/KrishnaXplore/civic-reporting-system.git
cd civic-reporting-system
```

### 2. Server setup
```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Client setup
```bash
cd client
npm install
npm run dev
```

### 4. ML Service setup (optional)
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### 5. Seed the database
```bash
cd server
node seed.js
```

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/civicconnect
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5001
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
REDIS_URL=redis://localhost:6379   # optional
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5001
```

---

## Seed Credentials

After running `node seed.js`, use these to log in:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@civicconnect.com | Admin@123 |
| State Admin (Karnataka) | stateadmin@civicconnect.com | Admin@123 |
| City Admin (Bengaluru) | cityadmin.bengaluru@civicconnect.com | Admin@123 |
| Ward Officer | ward1@civicconnect.com | Admin@123 |
| Dept Admin (Roads) | admin.roads@civicconnect.com | Admin@123 |
| Officer (Roads) | officer1.roads@civicconnect.com | Officer@123 |
| Citizen | citizen@civicconnect.com | Test@123 |

---

## Running Tests

```bash
cd server
npm test              # run all 78 tests
npm run test:coverage # with coverage report
```

| Test File | Coverage | Tests |
|-----------|----------|-------|
| `auth.test.js` | Register, login, logout, getMe, forgot password | 12 |
| `complaint.test.js` | Public routes, location filters, submit, upvote, get by id | 22 |
| `comment.test.js` | Get (pagination), add, delete, auth guards, strike block | 14 |
| `admin.test.js` | Stats, avgResolutionDays, CSV export, flagged users, ban, audit logs | 16 |
| `department.test.js` | List, create, add/remove officer | 9 |
| **Total** | | **78** |

---

## API Overview

Full API documentation in [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/upload-photo           ← profile photo
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/complaints/map              ← public
GET    /api/v1/complaints/public           ← public, paginated, city/ward filters
POST   /api/v1/complaints                  ← citizen only
GET    /api/v1/complaints/:id
PUT    /api/v1/complaints/:id/status       ← officer+
PUT    /api/v1/complaints/:id/resolve      ← officer+
POST   /api/v1/complaints/:id/upvote       ← any logged-in user

GET    /api/v1/complaints/:id/comments     ← public, paginated
POST   /api/v1/complaints/:id/comments     ← logged-in, not flagged
DELETE /api/v1/complaints/:id/comments/:commentId  ← author or superAdmin

GET    /api/v1/departments
POST   /api/v1/departments                 ← superAdmin
POST   /api/v1/departments/:id/officers    ← deptAdmin+

GET    /api/v1/admin/stats                 ← public (Redis cached 5 min)
GET    /api/v1/admin/stats/location        ← admin roles
GET    /api/v1/admin/export                ← superAdmin/cityAdmin/stateAdmin (CSV)
GET    /api/v1/admin/flagged-users         ← superAdmin
PUT    /api/v1/admin/users/:id/ban         ← superAdmin
GET    /api/v1/admin/audit-logs            ← superAdmin

GET    /api/v1/notifications/connect       ← SSE stream
```

---

## Kubernetes Deployment

```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/ml-deployment.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/server-hpa.yaml
```

The HPA scales the server from 1 to 5 pods when CPU exceeds 50%.

---

## Architecture

See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for:
- Full architecture diagram
- Key design decisions (why MongoDB, why SSE, why Redis, why async ML)
- Database schema with all new fields (timeline, upvotedBy, resolvedAt)
- Security measures
- Scaling considerations (100k → 1M users)

---

## Project Structure

```
civicconnect/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios API layer
│       ├── components/      # Reusable components
│       │   ├── common/      # Sidebar (mobile-responsive), Navbar, StatCard
│       │   ├── super-admin/ # OverviewTab (CSV export, avgResolutionDays)
│       │   └── dept-admin/  # DeptAdmin tab components
│       ├── pages/           # Page components
│       │   ├── ComplaintsPage.jsx      # Public list with upvote + My Area filter
│       │   ├── ComplaintDetail.jsx     # Timeline, upvote, paginated comments
│       │   ├── WardOfficerDashboard.jsx
│       │   ├── CityAdminDashboard.jsx
│       │   └── StateAdminDashboard.jsx
│       └── utils/           # constants, helpers
├── server/                  # Node.js backend
│   ├── controllers/         # Business logic
│   │   ├── auth.controller.js        # + uploadPhoto
│   │   ├── complaint.controller.js   # + upvote, timeline, resolvedAt
│   │   ├── admin.controller.js       # + Redis cache, avgResolutionDays, CSV export
│   │   ├── comment.controller.js     # NEW — paginated comments
│   │   └── department.controller.js  # + Redis cache
│   ├── models/
│   │   ├── Complaint.js     # + timeline[], upvotedBy[], resolvedAt
│   │   └── Comment.js       # NEW
│   ├── routes/
│   │   └── comment.routes.js         # NEW
│   ├── utils/
│   │   └── cache.js                  # NEW — Redis with graceful fallback
│   └── tests/               # Jest + Supertest (78 tests, 5 files)
├── ml-service/              # Python Flask ML API
├── k8s/                     # Kubernetes manifests
├── SYSTEM_DESIGN.md
└── README.md
```

---

## License

MIT
