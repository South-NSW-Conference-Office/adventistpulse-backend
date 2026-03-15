'use client';

import dynamic from 'next/dynamic';

const HarvestMap = dynamic(() => import('@/components/HarvestMap'), { ssr: false });

export function HarvestMapLoader({ fill }: { fill?: boolean }) {
  return <HarvestMap fill={fill} />;
}
