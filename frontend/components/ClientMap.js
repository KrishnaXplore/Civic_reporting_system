// frontend/components/ClientMap.js

'use client'; // This is the crucial line

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default function ClientMap() {
  const Map = useMemo(() => dynamic(
    () => import('@/components/Map'), // Make sure this path is correct
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false 
    }
  ), []);

  return <Map />;
}