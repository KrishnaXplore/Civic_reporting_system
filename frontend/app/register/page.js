// frontend/app/register/page.js
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('local');
  const [visaNumber, setVisaNumber] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let registrationData;
    if (userType === 'foreigner') {
      if (!username || !email || !visaNumber) {
        setError('Full name, email, and visa number are required.');
        return;
      }
      registrationData = { user_type: 'foreigner', visa_number: visaNumber, username, email };
    } else {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      registrationData = { username, password, email, user_type: 'local' };
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/register/', registrationData);
      alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (err) {
      // --- THIS IS THE CRITICAL FIX ---
      // It will now display the REAL error message from the server.
      if (err.response && err.response.data) {
        const apiErrors = err.response.data;
        // Get the first error message from the response
        const firstErrorKey = Object.keys(apiErrors)[0];
        const firstErrorMessage = apiErrors[firstErrorKey][0];
        setError(`Error: ${firstErrorKey} - ${firstErrorMessage}`);
      } else {
        setError('Registration failed. An unknown error occurred.');
      }
      console.error("Registration error:", err);
    }
  };

  // The JSX for the form remains the same as the last version
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Create an Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userType" className="block text-sm font-medium">I am a...</label>
            <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md bg-white">
              <option value="local">Local Citizen</option>
              <option value="foreigner">Foreigner / Visitor</option>
            </select>
          </div>
          <div className="border-t pt-4 space-y-4">
            {userType === 'local' ? (
              <>
                <div>
                  <label htmlFor="local-username" className="block text-sm font-medium">Username</label>
                  <input id="local-username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="local-email" className="block text-sm font-medium">Email Address</label>
                  <input id="local-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="local-password" className="block text-sm font-medium">Password</label>
                  <div className="relative">
                    <input id="local-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="foreigner-name" className="block text-sm font-medium">Full Name</label>
                  <input id="foreigner-name" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="foreigner-email" className="block text-sm font-medium">Email Address</label>
                  <input id="foreigner-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="visaNumber" className="block text-sm font-medium">Visa Number</label>
                  <input id="visaNumber" type="text" required value={visaNumber} onChange={(e) => setVisaNumber(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
                  <p className="text-xs text-gray-500 mt-1">You will use this to log in. No password is required.</p>
                </div>
              </>
            )}
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Create Account</button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}