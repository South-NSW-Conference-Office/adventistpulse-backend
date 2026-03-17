import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import {
  Users, Church, Upload, UserCheck, BarChart3,
  ChevronRight, Lock, Calendar, Shield, Building2,
  ClipboardList, ArrowUpRight, UserCog
} from 'lucide-react';

export const metadata = {
  title: 'Conference Dashboard | Adventist Pulse',
  description: 'Conference administration — manage pastoral staffing, track assignments, and build your personnel intelligence layer.',
};

const SAMPLE_STAFFING = [
  { church: 'Canberra National', code: 'SNSW-CANBNAT', pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 312, status: 'current' },
  { church: 'South Canberra',    code: 'SNSW-STHCAN', pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 88,  status: 'current' },
  { church: 'Tuggeranong',       code: 'SNSW-TUGG',   pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 61,  status: 'current' },
  { church: 'Goulburn',          code: 'SNSW-GOUL',   pastor: 'Brett Pitman',     since: 'Mar 2019', members: 42,  status: 'current' },
  { church: 'Tumut',             code: 'SNSW-TUMUT',  pastor: 'Brett Pitman',     since: 'Mar 2019', members: 28,  status: 'current' },
  { church: 'Tumbarumba',        code: 'SNSW-TUMBA',  pastor: 'Brett Pitman',     since: 'Mar 2019', members: 19,  status: 'current' },
  { church: 'Queanbeyan',        code: 'SNSW-QUEAN',  pastor: '—',               since: '—',        members: 47,  status: 'vacant' },
];

const TABS = [
  { id: 'staffing',   label: 'Staffing',        icon: UserCheck },
  { id: 'history',    label: 'History Import',  icon: Upload },
  { id: 'delegation', label: 'Delegations',     icon: Shield },
  { id: 'access',     label: 'Access',          icon: UserCog },
];

export default function ConferenceDashboardPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#6366F1]" />
              <p className={cn('text-xs font-bold uppercase tracking-widest', tokens.text.accent)}>Conference Dashboard</p>
            </div>
            <h1 className={cn('text-2xl font-extrabold', tokens.text.heading)}>
              South New South Wales Conference
            </h1>
            <p className={cn('text-sm mt-1', tokens.text.muted)}>
              Manage pastoral staffing, track assignments, and control access for your territory
            </p>
          </div>
          <Link href="/beta" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#6366F1] text-white hover:bg-[#4f46e5] transition-colors">
            Request Access <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Preview banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 px-4 py-3 mb-8 mt-4">
          <Lock className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
          <p className={cn('text-xs', tokens.text.muted)}>
            <span className="font-semibold text-[#6366F1]">Preview mode</span> — this dashboard is available to conference administrators.
            Data shown is illustrative.{' '}
            <Link href="/beta" className="underline hover:text-[#6366F1]">Contact us to set up your conference →</Link>
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Churches',         value: '52',  icon: Church },
            { label: 'Pastors',          value: '18',  icon: Users },
            { label: 'Avg churches/pastor', value: '2.9', icon: BarChart3 },
            { label: 'Vacant charges',   value: '1',   icon: ClipboardList },
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

        {/* Tab strip */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-[#2a3a50]">
          {TABS.map(({ id, label, icon: Icon }, i) => (
            <div
              key={id}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-default',
                i === 0
                  ? 'border-[#6366F1] text-[#6366F1]'
                  : 'border-transparent text-gray-500 dark:text-slate-500'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>

        {/* Staffing table */}
        <div className={cn('rounded-2xl border overflow-hidden mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a3a50]">
            <h2 className={cn('text-sm font-bold', tokens.text.heading)}>Pastoral Staffing — Current</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-colors">
              <UserCheck className="w-3.5 h-3.5" /> Add Assignment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn('border-b text-[10px] font-bold uppercase tracking-wider', tokens.border.default, tokens.text.muted)}>
                  <th className="text-left px-5 py-3">Church</th>
                  <th className="text-left px-4 py-3">Assigned Pastor</th>
                  <th className="text-left px-4 py-3">Since</th>
                  <th className="text-right px-4 py-3">Members</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_STAFFING.map((row, i) => (
                  <tr
                    key={row.code}
                    className={cn(
                      'border-b transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
                      tokens.border.default,
                      i === SAMPLE_STAFFING.length - 1 ? 'border-b-0' : ''
                    )}
                  >
                    <td className="px-5 py-3">
                      <Link href={`/church/${row.code.toLowerCase()}`} className={cn('font-medium hover:text-[#6366F1] transition-colors', tokens.text.heading)}>
                        {row.church}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'vacant' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500">
                          Vacant
                        </span>
                      ) : (
                        <span className={tokens.text.body}>{row.pastor}</span>
                      )}
                    </td>
                    <td className={cn('px-4 py-3 tabular-nums', tokens.text.muted)}>
                      {row.since !== '—' && <Calendar className="w-3 h-3 inline mr-1" />}
                      {row.since}
                    </td>
                    <td className={cn('px-4 py-3 text-right tabular-nums font-medium', tokens.text.body)}>
                      {row.members}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className={cn('text-xs hover:text-[#6366F1] transition-colors', tokens.text.muted)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Import & Delegation side by side */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">

          {/* History Import */}
          <div className={cn('rounded-2xl border p-6', tokens.bg.card, tokens.border.default)}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <h3 className={cn('text-sm font-bold', tokens.text.heading)}>History Import</h3>
                <p className={cn('text-xs', tokens.text.muted)}>Upload past assignments</p>
              </div>
            </div>
            <p className={cn('text-xs leading-relaxed mb-4', tokens.text.muted)}>
              Upload a CSV or Excel file with historical pastoral assignments. Each row becomes a dated entry in the Personnel Intelligence database — enabling tenure analysis and historical reports.
            </p>
            <div className={cn('rounded-lg border border-dashed p-4 text-center mb-3', tokens.border.default)}>
              <Upload className={cn('w-5 h-5 mx-auto mb-1', tokens.text.muted)} />
              <p className={cn('text-xs font-medium', tokens.text.muted)}>Drop CSV here or click to browse</p>
              <p className={cn('text-[10px] mt-0.5', tokens.text.muted)}>
                Columns: pastor_name, church_code, start_date, end_date, role
              </p>
            </div>
            <div className={cn('rounded-lg p-3 text-xs space-y-1', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
              <p className={cn('font-semibold', tokens.text.heading)}>Example row</p>
              <code className={cn('block text-[10px] font-mono', tokens.text.muted)}>
                John Smith, SNSW-CANBNAT, 2015-01-01, 2019-06-30, head-pastor
              </code>
            </div>
          </div>

          {/* Delegation overview */}
          <div className={cn('rounded-2xl border p-6', tokens.bg.card, tokens.border.default)}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <h3 className={cn('text-sm font-bold', tokens.text.heading)}>Elder Delegations</h3>
                <p className={cn('text-xs', tokens.text.muted)}>Pastors → Church Elders</p>
              </div>
            </div>
            <p className={cn('text-xs leading-relaxed mb-4', tokens.text.muted)}>
              Pastors can delegate church-level access to elders. Elders get the full local church toolkit — just like a pastor, but scoped to their one church. You can revoke any delegation in your territory.
            </p>
            <div className="space-y-2">
              {[
                { pastor: 'Morgan Vincent', elder: 'David Chen',     church: 'Canberra National', since: 'Feb 2024' },
                { pastor: 'Morgan Vincent', elder: 'Sarah Mitchell',  church: 'South Canberra',    since: 'Jan 2025' },
                { pastor: 'Brett Pitman',   elder: 'Luke Horton',    church: 'Goulburn',          since: 'Jul 2023' },
              ].map(d => (
                <div key={d.elder} className={cn('flex items-center justify-between rounded-lg px-3 py-2', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
                  <div>
                    <p className={cn('text-xs font-medium', tokens.text.heading)}>{d.elder} <span className={cn('font-normal', tokens.text.muted)}>at {d.church}</span></p>
                    <p className={cn('text-[10px]', tokens.text.muted)}>delegated by {d.pastor} · {d.since}</p>
                  </div>
                  <button className="text-[10px] text-red-400 hover:text-red-500 transition-colors font-medium">Revoke</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it feeds Personnel Intelligence */}
        <div className={cn('rounded-2xl border p-6', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="flex-1">
              <h3 className={cn('text-sm font-bold mb-1', tokens.text.heading)}>Feeds Personnel Intelligence</h3>
              <p className={cn('text-xs leading-relaxed mb-3', tokens.text.muted)}>
                Every assignment you enter — current or historical — builds the Personnel Intelligence layer. 
                Over time this powers tenure analysis, successor planning, and leadership effectiveness research. 
                The more history you contribute, the richer your conference&apos;s reports become.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Avg pastoral tenure',  value: '4.2 yrs',  note: 'SNSW historical' },
                  { label: 'Assignments tracked',  value: '186',      note: 'All time' },
                  { label: 'Data completeness',    value: '61%',      note: 'Since 2010' },
                ].map(({ label, value, note }) => (
                  <div key={label} className={cn('rounded-lg p-3 text-center', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
                    <div className={cn('text-lg font-extrabold tabular-nums', tokens.text.heading)}>{value}</div>
                    <div className={cn('text-[10px] font-medium', tokens.text.body)}>{label}</div>
                    <div className={cn('text-[9px]', tokens.text.muted)}>{note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a3a50] flex items-center justify-between">
            <p className={cn('text-xs', tokens.text.muted)}>Personnel Intelligence is a Pulse Conference feature</p>
            <Link href="/beta" className="flex items-center gap-1 text-xs font-semibold text-[#6366F1] hover:underline">
              Learn more <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
