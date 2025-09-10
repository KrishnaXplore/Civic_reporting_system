// frontend/app/page.js

import ClientMap from '@/components/ClientMap'; // Import the new loader component

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Live Issue Map</h1>
      <div className="rounded-lg overflow-hidden shadow-lg">
         <ClientMap />
      </div>
    </div>
  );
}