import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const TECH_STACK = [
  { cat: 'Frontend', items: 'React 18, Vite, Tailwind CSS, Recharts, React-Leaflet' },
  { cat: 'Backend', items: 'Node.js, Express.js, MongoDB, Mongoose, JWT, Multer' },
  { cat: 'ML Service', items: 'Python, FastAPI, HuggingFace (AI image detection, sentence-transformers)' },
  { cat: 'Storage', items: 'Cloudinary (images), MongoDB Atlas (database)' },
  { cat: 'DevOps', items: 'Docker, Docker Compose, GitHub Actions, SonarQube, Trivy' },
  { cat: 'Deployment', items: 'Vercel (frontend), Render (backend + ML), Docker Hub' },
];

const AboutPage = () => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
    <Navbar />

    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
      {/* Mission */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 16 }}>
          About CivicConnect
        </h1>
        <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          CivicConnect is a full-stack civic reporting platform that bridges the gap between citizens and government departments. Built to bring transparency, accountability, and real-world impact to local governance.
        </p>
      </div>

      {/* How it works */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>How it works</h2>
        {[
          { step: '1', title: 'Citizen reports an issue', desc: 'Fills a form with title, description, category, GPS location, and a photo.' },
          { step: '2', title: 'AI verification runs', desc: 'ML service checks if the image is AI-generated and detects duplicates using semantic similarity.' },
          { step: '3', title: 'Routed to department', desc: 'Complaint is assigned to the correct government department based on category.' },
          { step: '4', title: 'Officer resolves', desc: 'An officer picks up the complaint, works on it, and uploads a "before/after" proof to close it.' },
          { step: '5', title: 'Citizen notified', desc: 'Real-time SSE notifications keep the citizen updated at every status change.' },
        ].map((item) => (
          <div key={item.step} style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1D4ED8', flexShrink: 0 }}>
              {item.step}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 3px' }}>{item.title}</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Tech Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TECH_STACK.map((t) => (
            <div key={t.cat} style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>{t.cat}</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{t.items}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/register" style={{
          display: 'inline-block', padding: '12px 28px', background: '#0F172A', color: '#fff',
          borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          Get Started
        </Link>
      </div>
    </div>
  </div>
);

export default AboutPage;
