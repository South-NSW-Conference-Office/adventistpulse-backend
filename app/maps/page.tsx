'use client';

import { Suspense, lazy } from 'react';
import { Globe2 } from 'lucide-react';

const MapExplorer = lazy(() => import('@/components/map/MapExplorer'));

export default function MapPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white dark:bg-[#1a2332] flex items-center justify-center">
        <div className="text-center">
          <Globe2 className="w-10 h-10 text-[#6366F1] mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading map...</p>
        </div>
      </main>
    }>
      <MapExplorer />
    </Suspense>
  );
}
