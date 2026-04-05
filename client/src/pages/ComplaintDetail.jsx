import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../api/axios';
import 'leaflet/dist/leaflet.css';

const statusSteps = ['Submitted', 'Assigned', 'InProgress', 'Resolved'];
const statusStyles = {
  Submitted: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/complaints/${id}`)
      .then(({ data }) => setComplaint(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!complaint) return <div className="min-h-screen flex items-center justify-center text-gray-400">Complaint not found</div>;

  const coords = complaint.location?.coordinates;
  const currentStep = statusSteps.indexOf(complaint.status);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-400 mb-4">
          <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link> &rsaquo; Complaint #{complaint._id.slice(-6).toUpperCase()}
        </div>

        {complaint.status === 'Resolved' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
            This complaint has been resolved!
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{complaint.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{complaint.category}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusStyles[complaint.status]}`}>
              {complaint.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-5">{complaint.description}</p>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Before</p>
              <img src={complaint.beforeImage} alt="before" className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">After</p>
              {complaint.afterImage ? (
                <img src={complaint.afterImage} alt="after" className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  Pending resolution
                </div>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div className="flex items-center gap-2 mb-5">
            {statusSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                  ${i <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                {i < statusSteps.length - 1 && <div className={`flex-1 h-px ${i < currentStep ? 'bg-blue-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Map */}
          {coords && (
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer center={[coords[1], coords[0]]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[coords[1], coords[0]]} />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow p-6 text-sm space-y-3">
          <p className="text-gray-500">Department: <span className="font-medium text-gray-800">{complaint.department?.name || 'Unassigned'}</span></p>
          {complaint.assignedTo && (
            <p className="text-gray-500">Officer: <span className="font-medium text-gray-800">{complaint.assignedTo.name}</span></p>
          )}
          {complaint.fundsSpent > 0 && (
            <p className="text-gray-500">Funds Spent: <span className="font-medium text-gray-800">₹{complaint.fundsSpent.toLocaleString()}</span></p>
          )}
          <p className="text-gray-500">Submitted: <span className="font-medium text-gray-800">{new Date(complaint.createdAt).toLocaleDateString()}</span></p>
          <p className="text-gray-500">Upvotes: <span className="font-medium text-gray-800">{complaint.upvotes}</span></p>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
