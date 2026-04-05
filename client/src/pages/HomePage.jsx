import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../api/axios';
import 'leaflet/dist/leaflet.css';

const statusColor = {
  Submitted: '#EF4444',
  Assigned: '#3B82F6',
  InProgress: '#F97316',
  Resolved: '#22C55E',
};

const HomePage = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    api.get('/api/v1/complaints/map')
      .then(({ data }) => setComplaints(data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <nav className="bg-white shadow z-10 flex items-center justify-between px-6 py-3">
        <span className="text-xl font-bold text-blue-600">CivicConnect</span>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Login</Link>
          <Link to="/register" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register</Link>
        </div>
      </nav>

      <div className="flex-1 relative">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {complaints.map((c) => (
            <CircleMarker
              key={c._id}
              center={[c.location.coordinates[1], c.location.coordinates[0]]}
              radius={8}
              fillColor={statusColor[c.status] || '#888'}
              color="#fff"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-gray-500">{c.category}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs text-white"
                    style={{ backgroundColor: statusColor[c.status] }}>
                    {c.status}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow p-3 z-[1000]">
          <p className="text-xs font-semibold text-gray-600 mb-2">Legend</p>
          {Object.entries(statusColor).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2 text-xs text-gray-700 mb-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
