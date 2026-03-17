'use client';

import dynamic from 'next/dynamic';

const MatrixCanvas = dynamic(() => import('./MatrixCanvas'), { ssr: false });

export function MatrixCanvasLoader() {
  return <MatrixCanvas />;
}
