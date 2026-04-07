import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectMap = {
    citizen: '/dashboard',
    officer: '/staff/dashboard',
    wardOfficer: '/ward-officer/dashboard',
    deptAdmin: '/dept-admin/dashboard',
    cityAdmin: '/city-admin/dashboard',
    stateAdmin: '/state-admin/dashboard',
    superAdmin: '/admin/dashboard',
  };

  useEffect(() => {
    if (user) navigate(redirectMap[user.role] || '/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Trim accidental spaces
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    try {
      const loggedUser = await login(trimmedEmail, trimmedPassword);
      navigate(redirectMap[loggedUser.role] || '/dashboard');
    } catch (err) {
      console.error('Login Error:', err.response?.data);
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">CivicConnect</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
        </p>
        <p className="text-center text-sm mt-2">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">Forgot password?</Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-xs text-gray-400 hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
