// components/Map.js
'use client'; // This component will only run on the client side

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
const icon = L.icon({ iconUrl: "/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });

// Dummy data for now
const complaints = [
    { id: 1, lat: 28.6139, lon: 77.2090, description: "Pothole on main road", status: "resolved" },
    { id: 2, lat: 28.6150, lon: 77.2100, description: "Garbage overflow", status: "submitted" },
];

const getPinColor = (status) => {
    // In a real app, you would have different colored marker icons
    // For simplicity, we are not changing colors here yet.
    return icon;
}

export default function Map() {
    const position = [28.6139, 77.2090]; // Default center (e.g., Delhi)

    return (
        <MapContainer center={position} zoom={13} style={{ height: '600px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {complaints.map(complaint => (
                <Marker 
                    key={complaint.id} 
                    position={[complaint.lat, complaint.lon]}
                    icon={getPinColor(complaint.status)}
                >
                    <Popup>
                       <b>Status: {complaint.status}</b> <br /> {complaint.description}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}