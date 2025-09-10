// frontend/app/dashboard/local/page.js
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LocalDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [civicScore, setCivicScore] = useState(0); // Will be fetched from user profile later
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    const token = localStorage.getItem('accessToken');

    // If no token, redirect to login
    if (!token) {
      router.push('/login');
      return;
    }

    setUserType(storedUserType);

    const fetchMyData = async () => {
      try {
        // Fetch the user's specific complaints from the protected endpoint
        const response = await axios.get('http://127.0.0.1:8000/api/my-complaints/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setComplaints(response.data);
        // TODO: In the future, you'll also fetch the user's civic score here
      } catch (error) {
        console.error("Failed to fetch user complaints:", error);
        // Handle token expiration, e.g., redirect to login
        if (error.response && error.response.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyData();
  }, [router]); // Added router to dependency array

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading your dashboard...</div>;
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Citizen Dashboard</h1>
      
      {/* Conditionally render the Civic Score Card only for 'local' users */}
      {userType === 'local' && (
        <div className="p-6 mb-8 bg-blue-600 text-white rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Your Civic Score</h2>
          <p className="text-5xl font-bold">{civicScore}</p>
          <p className="mt-2">Keep reporting to improve your score!</p>
        </div>
      )}

      {/* Complaints List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Reported Issues</h2>
        <div className="space-y-4">
          {complaints.length > 0 ? complaints.map(complaint => (
            <div key={complaint.id} className="p-4 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">{complaint.description}</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {complaint.funds_spent ? `Funds Spent: ₹${complaint.funds_spent}` : 'Resolution in progress...'}
              </div>
            </div>
          )) : (
            <div className="p-4 bg-white rounded-lg shadow-md text-center text-gray-500">
              You have not reported any issues yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}