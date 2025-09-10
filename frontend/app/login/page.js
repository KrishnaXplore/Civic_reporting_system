// frontend/app/login/page.js
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from "jwt-decode";
import Link from 'next/link';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('citizen');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [visaNumber, setVisaNumber] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let response;
    try {
      if (loginType === 'citizen') {
        response = await axios.post('http://127.0.0.1:8000/api/token/', { username, password });
      } else {
        response = await axios.post('http://127.0.0.1:8000/api/foreigner-login/', { visa_number: visaNumber });
      }
      
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      const decodedToken = jwtDecode(access);
      const userType = decodedToken.user_type;
      localStorage.setItem('userType', userType);
      
      switch (userType) {
        case 'local':
        case 'foreigner':
          router.push('/dashboard/local');
          break;
        case 'official':
          router.push('/dashboard/official');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/');
      }

    } catch (err) {
      // --- THIS IS THE CORRECTED ERROR HANDLING ---
      if (err.response && err.response.data) {
        // Display the specific error message from the backend
        const detail = err.response.data.detail || err.response.data.error;
        setError(detail || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed due to a network error.');
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex border-b">
          <button onClick={() => setLoginType('citizen')} className={`px-4 py-2 -mb-px font-semibold text-sm focus:outline-none ${loginType === 'citizen' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
            Citizen / Official
          </button>
          <button onClick={() => setLoginType('foreigner')} className={`px-4 py-2 -mb-px font-semibold text-sm focus:outline-none ${loginType === 'foreigner' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
            Visitor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginType === 'citizen' ? (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"/>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="visaNumber" className="block text-sm font-medium text-gray-700">Visa Number</label>
              <input id="visaNumber" type="text" required value={visaNumber} onChange={(e) => setVisaNumber(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"/>
            </div>
          )}
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Log In</button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}