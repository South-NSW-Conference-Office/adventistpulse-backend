import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import {
  Church, TrendingUp, TrendingDown, Users, BookOpen,
  BarChart3, Bell, Settings, MapPin, ChevronRight, Lock
} from 'lucide-react';

export const metadata = {
  title: 'Pastor Dashboard | Adventist Pulse',
  description: 'Your churches, at a glance. Multi-church pastoral intelligence dashboard.',
};

// Sample data for the teaser — shows what the real dashboard will look like for a multi-church pastor
const SAMPLE_CHURCHES = [
  {
    code: 'SNSW-CANBERRANATIONALCHURCH',
    name: 'Canberra National',
    suburb: 'Turner ACT',
    membership: 312,
    trend: +2.1,
    baptisms: 8,
    sabbathAttendance: 210,
    score: 72,
  },
  {
    code: 'SNSW-SOUTHCANBERRACHURCH',
    name: 'South Canberra',
    suburb: 'Wanniassa ACT',
    membership: 88,
    trend: -1.4,
    baptisms: 2,
    sabbathAttendance: 55,
    score: 51,
  },
  {
    code: 'SNSW-QUEANBEYAN',
    name: 'Queanbeyan',
    suburb: 'Queanbeyan NSW',
    membership: 47,
    trend: +0.8,
    baptisms: 1,
    sabbathAttendance: 38,
    score: 44,
  },
];

export default function DashboardPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', tokens.text.accent)}>Pastor Dashboard</p>
            <h1 className={cn('text-2xl font-extrabold', tokens.text.heading)}>Your Churches</h1>
            <p className={cn('text-sm mt-1', tokens.text.muted)}>
              Overview of all churches in your pastoral district
            </p>
          </div>
          <div className="flex gap-2">
            <button className={cn('p-2 rounded-lg border', tokens.bg.card, tokens.border.default, tokens.text.muted, 'hover:text-[#6366F1] transition-colors')}>
              <Bell className="w-4 h-4" />
            </button>
            <button className={cn('p-2 rounded-lg border', tokens.bg.card, tokens.border.default, tokens.text.muted, 'hover:text-[#6366F1] transition-colors')}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 px-4 py-3 mb-6">
          <Lock className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#6366F1]">Preview mode</p>
            <p className={cn('text-xs', tokens.text.muted)}>
              This is a preview of the pastor dashboard using sample data. Your conference admin assigns you to your churches.{' '}
              <Link href="/beta" className="underline hover:text-[#6366F1]">Request access →</Link>
            </p>
          </div>
        </div>

        {/* District summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Churches',       value: '3',   icon: Church },
            { label: 'Total Members',  value: '447', icon: Users },
            { label: 'Baptisms YTD',   value: '11',  icon: TrendingUp },
            { label: 'Avg Sabbath Att.',value: '101', icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={cn('rounded-xl border p-4', tokens.bg.card, tokens.border.default)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-[#6366F1]" />
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', tokens.text.muted)}>{label}</span>
              </div>
              <p className={cn('text-2xl font-extrabold tabular-nums', tokens.text.heading)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Church cards — 1–3 = side by side */}
        <h2 className={cn('text-sm font-bold uppercase tracking-widest mb-3', tokens.text.muted)}>District Churches</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {SAMPLE_CHURCHES.map(church => (
            <ChurchCard key={church.code} church={church} />
          ))}
        </div>

        {/* Research — context for multi-church pastors */}
        <div className={cn('rounded-2xl border p-6', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#6366F1]" />
            <h2 className={cn('text-sm font-bold', tokens.text.heading)}>Relevant Research</h2>
            <span className={cn('ml-auto text-xs', tokens.text.muted)}>Based on your district context</span>
          </div>
          <div className="space-y-3">
            {[
              { id: 'LRP-012', title: 'Multi-Church District Effectiveness', tag: 'pastoral-ministry', desc: 'What determines success when one pastor serves multiple congregations?' },
              { id: 'LRP-034', title: 'Small Church Vitality Factors', tag: 'church-health', desc: 'Sub-100 membership churches that grow — what they have in common.' },
              { id: 'LRP-008', title: 'Retention After Baptism', tag: 'evangelism', desc: 'Why 40% of baptisms don\'t appear in the following year\'s membership count.' },
            ].map(r => (
              <Link
                key={r.id}
                href={`/research/${r.id}`}
                className={cn('flex items-start gap-3 p-3 rounded-lg hover:bg-[#6366F1]/5 transition-colors group')}
              >
                <span className="text-[10px] font-mono font-bold text-[#6366F1] mt-0.5">{r.id}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', tokens.text.heading)}>{r.title}</p>
                  <p className={cn('text-xs mt-0.5 line-clamp-1', tokens.text.muted)}>{r.desc}</p>
                </div>
                <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5', tokens.text.muted)} />
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a3a50]">
            <Link href="/research" className={cn('text-xs font-medium', tokens.text.accent)}>
              Browse all 208 research projects →
            </Link>
          </div>
        </div>

        {/* Scale note — Philippine model */}
        <div className={cn('mt-6 rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
          <p className={cn('text-xs font-semibold mb-2', tokens.text.heading)}>Designed for every context</p>
          <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>
            Whether you pastor 2 churches in suburban Australia or 30+ congregations across a Philippine district, 
            this dashboard adapts. Small districts show rich cards side-by-side. 
            Large districts show a compact table with quick-action rows. 
            Your conference admin controls which churches appear here.
          </p>
        </div>

      </div>
    </main>
  );
}

function ChurchCard({ church }: { church: typeof SAMPLE_CHURCHES[0] }) {
  const isGrowing = church.trend > 0;
  const TrendIcon = isGrowing ? TrendingUp : TrendingDown;

  return (
    <div className={cn('rounded-xl border overflow-hidden', tokens.bg.card, tokens.border.default)}>
      {/* Score bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-[#1a2a3a]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${church.score}%`,
            background: church.score >= 65 ? '#10b981' : church.score >= 45 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className={cn('text-sm font-bold', tokens.text.heading)}>{church.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className={cn('text-xs', tokens.text.muted)}>{church.suburb}</span>
            </div>
          </div>
          <div className={cn(
            'flex items-center gap-1 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
            isGrowing ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          )}>
            <TrendIcon className="w-3 h-3" />
            {isGrowing ? '+' : ''}{church.trend}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Members',   value: church.membership },
            { label: 'Baptisms',  value: church.baptisms },
            { label: 'Avg Att.',  value: church.sabbathAttendance },
          ].map(({ label, value }) => (
            <div key={label} className={cn('rounded-lg p-2 text-center', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
              <div className={cn('text-base font-extrabold tabular-nums', tokens.text.heading)}>{value}</div>
              <div className={cn('text-[9px] uppercase tracking-wider', tokens.text.muted)}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] text-gray-400 dark:text-slate-500">Profile</div>
            <div className="h-1 w-16 rounded-full bg-gray-200 dark:bg-[#2a3a50]">
              <div className="h-full rounded-full bg-[#6366F1]" style={{ width: `${church.score}%` }} />
            </div>
            <div className="text-[10px] font-bold text-[#6366F1]">{church.score}</div>
          </div>
          <Link
            href={`/church/${church.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className={cn('text-xs font-medium', tokens.text.accent, 'hover:underline')}
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
