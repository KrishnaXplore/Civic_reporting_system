import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const trustColor = (score) => {
  if (score >= 70) return { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', label: 'Excellent' };
  if (score >= 40) return { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Fair' };
  return { color: '#BE123C', bg: '#FFF1F2', border: '#FECDD3', label: 'At Risk' };
};

const strikeColor = (count) => {
  if (count === 0) return { color: '#15803D', bg: '#F0FDF4' };
  if (count < 3) return { color: '#B45309', bg: '#FFFBEB' };
  return { color: '#BE123C', bg: '#FFF1F2' };
};

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    locality: user?.locality || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [preview, setPreview] = useState(user?.profilePhoto || '');

  const trust = trustColor(user?.trustScore ?? 100);
  const strike = strikeColor(user?.strikeCount ?? 0);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/api/v1/auth/upload-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, profilePhoto: data.url }));
    } catch {
      setMsg({ text: 'Photo upload failed. It will be saved with your profile update.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setMsg({ text: 'Name is required', type: 'error' });
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const payload = { ...form };
      if (preview && preview !== user?.profilePhoto && !preview.startsWith('blob:')) {
        payload.profilePhoto = preview;
      }
      const { data } = await api.put('/api/v1/auth/profile', payload);
      updateUser(data.user);
      setMsg({ text: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const backLink = () => {
    const map = { officer: '/staff/dashboard', deptAdmin: '/dept-admin/dashboard', superAdmin: '/admin/dashboard' };
    return map[user?.role] || '/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to={backLink()} style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          ← Back to Dashboard
        </Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px' }}>CivicConnect</span>
        <button onClick={async () => { await logout(); navigate('/login'); }}
          style={{ fontSize: 13, color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.4px' }}>Your Profile</h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>Manage your account information and preferences</p>

        {msg.text && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
            background: msg.type === 'success' ? '#F0FDF4' : '#FFF1F2',
            color: msg.type === 'success' ? '#15803D' : '#BE123C',
            border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECDD3'}`,
          }}>
            {msg.text}
          </div>
        )}

        {/* Account status cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Role</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <div style={{ background: trust.bg, border: `1px solid ${trust.border}`, borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: trust.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Trust Score</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: trust.color, lineHeight: 1 }}>{user?.trustScore ?? 100}</p>
              <p style={{ fontSize: 11, color: trust.color, fontWeight: 600 }}>{trust.label}</p>
            </div>
          </div>
          <div style={{ background: strike.bg, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, color: strike.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Image Strikes</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: strike.color, lineHeight: 1 }}>{user?.strikeCount ?? 0}</p>
              <p style={{ fontSize: 11, color: strike.color, fontWeight: 500 }}>of 5</p>
            </div>
          </div>
        </div>

        {/* Main form card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Profile photo section */}
          <div style={{ padding: '28px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid #E2E8F0',
              }}>
                {preview ? (
                  <img src={preview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#1D4ED8' }}>{user?.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <button onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
                  borderRadius: '50%', background: '#0F172A', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 12, color: '#fff',
                }}>✎</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '3px 0 0' }}>{user?.email}</p>
              {uploading && <p style={{ fontSize: 12, color: '#3B82F6', margin: '6px 0 0' }}>Uploading photo...</p>}
              {!uploading && (
                <button onClick={() => fileRef.current?.click()} style={{
                  marginTop: 8, fontSize: 12, color: '#3B82F6', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontWeight: 500, fontFamily: 'DM Sans',
                }}>Change photo</button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSave} style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.02em' }}>Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email Address</label>
              <input type="email" value={user?.email || ''} disabled
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #F1F5F9', borderRadius: 10, fontSize: 14, color: '#94A3B8', background: '#F8FAFC', fontFamily: 'DM Sans', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>Email cannot be changed</p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Locality / Area</label>
              <input type="text" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })}
                placeholder="e.g. Koramangala, Bengaluru"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{
                padding: '11px 28px', background: saving ? '#94A3B8' : '#0F172A', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', transition: 'background 0.15s',
              }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account status warning */}
        {user?.status === 'warned' && (
          <div style={{ marginTop: 20, padding: '14px 20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#B45309', margin: '0 0 4px' }}>Account Warning</p>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>Your account has been flagged due to multiple image strikes. Further violations may result in a ban.</p>
          </div>
        )}
        {user?.status === 'banned' && (
          <div style={{ marginTop: 20, padding: '14px 20px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#BE123C', margin: '0 0 4px' }}>Account Banned</p>
            <p style={{ fontSize: 12, color: '#9F1239', margin: 0 }}>Your account has been banned. Contact support to appeal.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600">403 - Unauthorized</h1>
      <p className="text-gray-400 mt-2">You do not have permission to view this page</p>
    </div>
  </div>
);

export { ProfilePage };
export default ProfilePage;
