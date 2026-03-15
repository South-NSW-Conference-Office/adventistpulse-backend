'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/format-date';

interface ResearchPaper {
  id: string;
  title: string;
  coreQuestion: string;
  status: string;
  grade: string;
  score: number;
  tags: string[];
  sourceCount: number;
  lastUpdated: string;
  execSummary: string;
  wordCount: number;
}

const UNSPLASH_POOL = [
  'photo-1451187580459-43490279c0fa', // globe/earth
  'photo-1551288049-bebda4e38f71', // data dashboard
  'photo-1460925895917-afdab827c52f', // laptop data
  'photo-1529156069898-49953e39b3ac', // diverse community
  'photo-1519389950473-47ba0277781c', // people collaborating
  'photo-1454165804606-c3d57bc86b40', // research desk
  'photo-1488521787496-c6e09b87b73d', // community/hands
  'photo-1434030216411-0b793f4b6f1d', // study/learning
  'photo-1532619675605-1ede6c2ed2b0', // conference/meeting
  'photo-1504711434969-e33886168f5c', // speaker/presenter
  'photo-1562564055-71e051d33c19', // congregation/church
  'photo-1516321318423-f06f85e504b3', // church gathering
  'photo-1507003211169-0a1dd7228f2d', // thinking/person
  'photo-1577896851905-42c6b46e2a84', // writing/notes
  'photo-1473116763249-2faaef81ccda', // books/research
];

function getUnsplashUrl(id: string, w = 400, h = 280): string {
  // Deterministic index from paper ID string
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  const photo = UNSPLASH_POOL[hash % UNSPLASH_POOL.length];
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-emerald-500';
  if (grade.startsWith('B')) return 'text-teal-400';
  if (grade.startsWith('C')) return 'text-amber-400';
  if (grade.startsWith('D')) return 'text-red-400';
  return 'text-slate-400';
}

const PAGE_SIZE = 10;

export default function ResearchAllList({ papers }: { papers: ResearchPaper[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = papers.slice(0, visible);
  const hasMore = visible < papers.length;

  return (
    <div>
      <div className="divide-y divide-gray-100 dark:divide-[#2a3a50]">
        {shown.map(paper => (
          <Link key={paper.id} href={`/research/${paper.id}`} className="flex items-start gap-4 py-5 group">
            {/* Thumbnail */}
            <div className="w-16 h-11 rounded-lg shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getUnsplashUrl(paper.id)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-teal-400">{paper.id}</span>
                {paper.id.startsWith('LRP-') && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">LRP</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-slate-200 group-hover:text-teal-500 transition-colors line-clamp-1 mb-1">
                {paper.title}
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-1">
                {paper.coreQuestion || paper.execSummary || ''}
              </p>
            </div>

            <div className="shrink-0 text-right text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
              <div className={`font-bold ${getGradeColor(paper.grade)}`}>{paper.grade}</div>
              <div className="mt-0.5">{paper.sourceCount ?? 0} sources</div>
              <div className="mt-0.5">{formatDate(paper.lastUpdated)}</div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="px-6 py-2.5 rounded-full border border-gray-200 dark:border-[#2a3a50] text-sm font-medium text-gray-600 dark:text-slate-400 hover:border-teal-400/50 hover:text-teal-500 transition-colors"
          >
            View more ({papers.length - visible} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
