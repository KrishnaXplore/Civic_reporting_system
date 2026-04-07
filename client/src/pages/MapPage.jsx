import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/common/Navbar';
import { getMapComplaintsApi } from '../api/complaints.api';
import { STATUS_COLORS, CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    getMapComplaintsApi()
      .then(({ data }) => setComplaints(data.data || []))
      .catch(() => {});
  }, []);

  const filtered = complaints.filter((c) => {
    const statusOk = filter === 'all' || c.status === filter;
    const catOk = catFilter === 'all' || c.category === catFilter;
    return statusOk && catOk;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <Navbar />

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '12px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginRight: 4 }}>STATUS:</span>
        {['all', 'Submitted', 'Assigned', 'InProgress', 'Resolved'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: filter === s ? '#0F172A' : '#F1F5F9',
            color: filter === s ? '#fff' : '#64748B', border: 'none',
          }}>
            {s === 'all' ? 'All' : s === 'InProgress' ? 'In Progress' : s}
          </button>
        ))}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginLeft: 12, marginRight: 4 }}>CATEGORY:</span>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid #E2E8F0',
          color: '#475569', outline: 'none', background: '#fff',
        }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}>{filtered.length} complaints shown</span>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', minHeight: 'calc(100vh - 120px)' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map((c) => (
            <CircleMarker
              key={c._id}
              center={[c.location.coordinates[1], c.location.coordinates[0]]}
              radius={8}
              fillColor={STATUS_COLORS[c.status]?.hex || '#888'}
              color="#fff"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 180 }}>
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#0F172A' }}>{c.title}</p>
                  <p style={{ color: '#64748B', margin: '0 0 4px', fontSize: 12 }}>{c.category}</p>
                  {c.locationDetails?.city && (
                    <p style={{ color: '#94A3B8', margin: '0 0 6px', fontSize: 11 }}>
                      {[c.locationDetails.ward, c.locationDetails.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: STATUS_COLORS[c.status]?.bg, color: STATUS_COLORS[c.status]?.color,
                  }}>
                    {c.status}
                  </span>
                  <p style={{ color: '#94A3B8', margin: '6px 0 0', fontSize: 11 }}>{formatDate(c.createdAt)}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 24, left: 16, background: '#fff',
          borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '14px 18px', zIndex: 1000,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Legend</p>
          {['Submitted', 'Assigned', 'InProgress', 'Resolved'].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#475569' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[s]?.hex, flexShrink: 0 }} />
              {s === 'InProgress' ? 'In Progress' : s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
