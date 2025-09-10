// app/report/page.js
'use client';

import { useState, useEffect } from 'react';

export default function ReportPage() {
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('other');
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);

    // app/report/page.js

useEffect(() => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
            });
        },
        (error) => {
            // Updated error logging
            console.error(`Error getting location: ${error.message} (Code: ${error.code})`);
            alert("Could not get your location. Please enable location services in your browser and OS.");
        }
    );
}, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location || !photo) {
            alert("Location and photo are required!");
            return;
        }

        const formData = new FormData();
        formData.append('description', description);
        formData.append('department', department);
        formData.append('photo', photo);
        formData.append('location_lat', location.lat);
        formData.append('location_lon', location.lon);

        // This is where you would use Axios to POST to your Django API
        // For example: axios.post('http://127.0.0.1:8000/api/complaints/', formData, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        console.log("Form data to be submitted:", Object.fromEntries(formData));
        alert("Complaint submitted successfully (simulation)!");
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Report a New Civic Issue</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        rows="4"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                        id="department"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    >
                        <option value="sanitation">Sanitation</option>
                        <option value="roads">Roads</option>
                        <option value="water">Water</option>
                        <option value="electricity">Electricity</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                 <div>
                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Upload Photo</label>
                    <input
                        type="file"
                        id="photo"
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => setPhoto(e.target.files[0])}
                        required
                    />
                </div>

                {location && (
                    <div className="text-sm text-gray-500">
                        📍 Your location has been tagged: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={!location}
                >
                    Submit Report
                </button>
            </form>
        </div>
    );
}