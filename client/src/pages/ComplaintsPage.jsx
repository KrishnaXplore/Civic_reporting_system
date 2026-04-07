import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import StatusBadge from '../components/common/StatusBadge';
import { getPublicComplaintsApi } from '../api/complaints.api';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const ComplaintsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState('');
  const [ward, setWard] = useState('');
  const [myArea, setMyArea] = useState(false);
  const [locating, setLocating] = useState(false);
  const [upvotingId, setUpvotingId] = useState(null);

  const fetchComplaints = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await getPublicComplaintsApi({ search, status, category, city, ward, page: p, limit: 12 });
      setComplaints(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(1); }, [search, status, category, city, ward]);

  const handleMyArea = () => {
    if (myArea) {
      setCity(''); setWard(''); setMyArea(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please type your city manually.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          if (detectedCity) {
            setCity(detectedCity);
            setMyArea(true);
          } else {
            alert('Could not detect your city. Please type it manually.');
          }
        } catch {
          alert('Location lookup failed. Please type your city manually.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert('Location access denied. Please type your city in the City filter.');
      }
    );
  };

  const handleUpvote = async (e, complaintId) => {
    e.stopPropagation();
    if (upvotingId) return;
    setUpvotingId(complaintId);
    try {
      const { data } = await api.post(`/api/v1/complaints/${complaintId}/upvote`);
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === complaintId
            ? { ...c, upvotes: data.data.upvotes, _upvoted: data.data.upvoted }
            : c
        )
      );
    } catch {
      // silently fail
    } finally {
      setUpvotingId(null);
    }
  };

  const inputStyle = {
    padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'DM Sans', color: '#0F172A',
  };

  const hasFilters = city || ward || search || status !== 'all' || category !== 'all';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.6px', margin: '0 0 6px' }}>
              Public Complaints
            </h1>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              {total} complaint{total !== 1 ? 's' : ''}
              {city ? ` in "${city}"` : ''}
              {ward ? ` · ward "${ward}"` : ''}
            </p>
          </div>

          {/* My Area — only for logged-in users */}
          {user && (
            <button
              onClick={handleMyArea}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10, border: '1.5px solid',
                borderColor: myArea ? '#3B82F6' : '#E2E8F0',
                background: myArea ? '#EFF6FF' : '#fff',
                color: myArea ? '#3B82F6' : '#64748B',
                fontSize: 13, fontWeight: 600, cursor: locating ? 'wait' : 'pointer',
                transition: 'all 0.15s', opacity: locating ? 0.7 : 1,
              }}
            >
              📍 {locating ? 'Detecting...' : myArea ? 'My Area (on)' : 'My Area'}
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints..."
            style={{ ...inputStyle, flex: '2 1 180px' }}
          />
          <input
            value={city}
            onChange={(e) => { setCity(e.target.value); setMyArea(false); }}
            placeholder="Filter by city..."
            style={{ ...inputStyle, flex: '1 1 130px' }}
          />
          <input
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="Filter by ward..."
            style={{ ...inputStyle, flex: '1 1 130px' }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, flex: '0 0 auto', color: '#475569' }}>
            <option value="all">All Status</option>
            {['Submitted', 'Assigned', 'InProgress', 'Resolved'].map((s) => (
              <option key={s} value={s}>{s === 'InProgress' ? 'In Progress' : s}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: '0 0 auto', color: '#475569' }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setCity(''); setWard(''); setStatus('all'); setCategory('all'); setMyArea(false); }}
              style={{ ...inputStyle, background: '#FEF2F2', borderColor: '#FECACA', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Loading...</div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', color: '#94A3B8', fontSize: 14 }}>
            No complaints found matching your filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {complaints.map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/complaint/${c._id}`)}
                style={{
                  background: '#fff', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
                  cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {c.beforeImage && (
                  <img src={c.beforeImage} alt={c.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0, lineHeight: 1.4 }}>{c.title}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px' }}>{c.category}</p>
                  {c.locationDetails?.city && (
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 8px' }}>
                      📍 {[c.locationDetails.ward, c.locationDetails.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 11, color: '#CBD5E1', margin: 0 }}>{formatDate(c.createdAt)}</p>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>💬 View</span>
                    </div>

                    {user?.role === 'citizen' ? (
                      <button
                        onClick={(e) => handleUpvote(e, c._id)}
                        disabled={upvotingId === c._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                          borderColor: c._upvoted ? '#3B82F6' : '#E2E8F0',
                          background: c._upvoted ? '#3B82F6' : '#fff',
                          color: c._upvoted ? '#fff' : '#64748B',
                          fontSize: 12, fontWeight: 600,
                          cursor: upvotingId === c._id ? 'wait' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        ▲ {c.upvotes || 0}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>
                        {c.upvotes > 0 ? `▲ ${c.upvotes}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button onClick={() => fetchComplaints(page - 1)} disabled={page === 1} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#475569',
            }}>← Prev</button>
            <span style={{ padding: '8px 16px', fontSize: 13, color: '#64748B' }}>Page {page} of {pages}</span>
            <button onClick={() => fetchComplaints(page + 1)} disabled={page === pages} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 13, cursor: page === pages ? 'not-allowed' : 'pointer', color: '#475569',
            }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsPage;
