'use client';

import dynamic from 'next/dynamic';
import type { QuickStats } from '@/types/pulse';

const WorldMissionMap = dynamic(() => import('@/components/WorldMissionMap'), { ssr: false });

interface Props {
  gcStats: QuickStats | null;
}

export function WorldMissionMapLoader({ gcStats }: Props) {
  return <WorldMissionMap gcStats={gcStats} />;
}
