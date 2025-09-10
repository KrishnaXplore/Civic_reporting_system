// frontend/app/dashboard/official/page.js
'use client';
import ClientMap from '@/components/ClientMap';

export default function OfficialDashboard() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Official Dashboard</h1>
        {/* TODO: Add filters for department, status, etc. */}
        <div>Filters Placeholder</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Live Complaints Map</h2>
        <div className="h-[600px] w-full">
          <ClientMap />
        </div>
      </div>
      
      {/* TODO: Add a list view of complaints below the map */}
    </div>
  );
}