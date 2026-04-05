import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const statusStyles = {
  Submitted: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const OfficerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [fundsSpent, setFundsSpent] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchComplaints = () => {
    const params = filter ? `?status=${filter}` : '';
    api.get(`/api/v1/complaints/department${params}`)
      .then(({ data }) => setComplaints(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/api/v1/complaints/${id}/status`, { status });
    fetchComplaints();
  };

  const handleResolve = async () => {
    if (!afterImage) return alert('Please upload an after image');
    setResolving(true);
    const fd = new FormData();
    fd.append('afterImage', afterImage);
    fd.append('fundsSpent', fundsSpent);
    await api.put(`/api/v1/complaints/${resolveModal}/resolve`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setResolveModal(null);
    setAfterImage(null);
    setFundsSpent('');
    setResolving(false);
    fetchComplaints();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-600">CivicConnect — Officer</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name} · {user?.department?.name}</span>
          <button onClick={async () => { await logout(); navigate('/login'); }} className="text-sm text-red-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-6 flex-wrap">
          {['', 'Submitted', 'Assigned', 'InProgress', 'Resolved'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
                ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No complaints found.</div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {c.beforeImage && (
                      <img src={c.beforeImage} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.category}</p>
                      <p className="text-xs text-gray-400">By: {c.citizen?.name} · {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[c.status]}`}>{c.status}</span>
                    <div className="flex gap-2">
                      <Link to={`/complaint/${c._id}`} className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">View</Link>
                      {c.status === 'Submitted' && (
                        <button onClick={() => updateStatus(c._id, 'Assigned')} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Assign to me</button>
                      )}
                      {c.status === 'Assigned' && (
                        <button onClick={() => updateStatus(c._id, 'InProgress')} className="text-xs px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Start</button>
                      )}
                      {c.status === 'InProgress' && (
                        <button onClick={() => setResolveModal(c._id)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Resolve</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Resolve Complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">After Image</label>
                <input type="file" accept="image/*" onChange={(e) => setAfterImage(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funds Spent (₹)</label>
                <input type="number" value={fundsSpent} onChange={(e) => setFundsSpent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleResolve} disabled={resolving} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {resolving ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
