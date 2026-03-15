'use client';

import { Suspense, lazy } from 'react';

const MapExplorer = lazy(() => import('@/components/map/MapExplorer'));

export default function MapPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white dark:bg-[#1a2332] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading map...</p>
        </div>
      </main>
    }>
      <MapExplorer />
    </Suspense>
  );
}
