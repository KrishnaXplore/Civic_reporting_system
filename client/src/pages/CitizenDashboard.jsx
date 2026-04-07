import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axios';

const statusStyles = {
  Submitted: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const trustColor = (score) => {
  if (score >= 70) return 'text-green-600 bg-green-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const CitizenDashboard = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/complaints')
      .then(({ data }) => setComplaints(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600 hover:opacity-80 transition">CivicConnect</Link>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600">Profile</Link>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.locality && <p className="text-sm text-gray-400">{user.locality}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${trustColor(user?.trustScore)}`}>
              Trust Score: {user?.trustScore}
            </span>
            {user?.strikeCount > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold">
                Strikes: {user.strikeCount}
              </span>
            )}
          </div>
        </div>

        {/* Report button */}
        <Link
          to="/complaint/new"
          className="block w-full text-center py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 mb-6"
        >
          + Report New Issue
        </Link>

        {/* Complaints list */}
        <h3 className="text-base font-semibold text-gray-700 mb-3">My Complaints</h3>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <p className="text-gray-400 text-sm">No complaints submitted yet.</p>
            <Link to="/complaint/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
              Submit your first complaint
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link
                key={c._id}
                to={`/complaint/${c._id}`}
                className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {c.beforeImage && (
                      <img
                        src={c.beforeImage}
                        alt="complaint"
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusStyles[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
