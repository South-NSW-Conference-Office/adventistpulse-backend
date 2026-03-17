import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import {
  Users, Church, Upload, UserCheck, BarChart3,
  ChevronRight, Lock, Calendar, Shield, Building2,
  ClipboardList, ArrowUpRight, UserCog, Settings, Globe2,
  ToggleLeft, Info
} from 'lucide-react';

export const metadata = {
  title: 'Admin Dashboard | Adventist Pulse',
  description: 'Conference, union, and division administration — manage pastoral staffing, track assignments, and build your personnel intelligence layer.',
};

// --- Org structure variants ---
// This is the key architectural feature: the dashboard adapts to the actual org structure.
// Australia: has conferences | Norway: no conferences, direct union→church | Philippines: has districts too

const ORG_EXAMPLES = [
  {
    name: 'South New South Wales Conference',
    type: 'Conference',
    region: 'SPD · AUC · SNSW',
    levels: { conference: true, church: true },
    stats: { churches: 52, pastors: 18, members: 4800, vacant: 1 },
    note: null,
  },
  {
    name: 'Norwegian Union',
    type: 'Union',
    region: 'TED · Nordic-Baltic Division',
    levels: { conference: false, region: true, church: true },
    stats: { churches: 87, pastors: 32, members: 12400, vacant: 3 },
    note: 'No conference tier — union manages churches directly via North/South regions.',
  },
  {
    name: 'Central Philippines Conference',
    type: 'Conference',
    region: 'SSD · Philippine Union',
    levels: { conference: true, district: true, church: true },
    stats: { churches: 410, pastors: 28, members: 61000, vacant: 0 },
    note: 'District tier enabled — one pastor may serve 30+ churches in a district.',
  },
];

const SAMPLE_STAFFING = [
  { church: 'Canberra National', code: 'SNSW-CANBNAT', pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 312, delegations: 2, status: 'current' },
  { church: 'South Canberra',    code: 'SNSW-STHCAN', pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 88,  delegations: 1, status: 'current' },
  { church: 'Tuggeranong',       code: 'SNSW-TUGG',   pastor: 'Morgan Vincent',   since: 'Jan 2021', members: 61,  delegations: 0, status: 'current' },
  { church: 'Goulburn',          code: 'SNSW-GOUL',   pastor: 'Brett Pitman',     since: 'Mar 2019', members: 42,  delegations: 1, status: 'current' },
  { church: 'Tumut',             code: 'SNSW-TUMUT',  pastor: 'Brett Pitman',     since: 'Mar 2019', members: 28,  delegations: 0, status: 'current' },
  { church: 'Tumbarumba',        code: 'SNSW-TUMBA',  pastor: 'Brett Pitman',     since: 'Mar 2019', members: 19,  delegations: 1, status: 'current' },
  { church: 'Queanbeyan',        code: 'SNSW-QUEAN',  pastor: '—',               since: '—',        members: 47,  delegations: 0, status: 'vacant' },
];

const TABS = [
  { id: 'staffing',   label: 'Staffing',        icon: UserCheck },
  { id: 'history',    label: 'History Import',  icon: Upload },
  { id: 'delegation', label: 'Delegations',     icon: Shield },
  { id: 'access',     label: 'Access',          icon: UserCog },
  { id: 'settings',   label: 'Org Settings',    icon: Settings },
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
              <p className={cn('text-xs font-bold uppercase tracking-widest', tokens.text.accent)}>Admin Dashboard</p>
            </div>
            <h1 className={cn('text-2xl font-extrabold', tokens.text.heading)}>
              Conference · Union · Division
            </h1>
            <p className={cn('text-sm mt-1', tokens.text.muted)}>
              The same dashboard works at every organisational level — scoped to your territory
            </p>
          </div>
          <Link href="/beta" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#6366F1] text-white hover:bg-[#4f46e5] transition-colors">
            Get Access <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Preview banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 px-4 py-3 mb-8 mt-4">
          <Lock className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
          <p className={cn('text-xs', tokens.text.muted)}>
            <span className="font-semibold text-[#6366F1]">Preview mode</span> — data is illustrative.
            This dashboard is available to conference administrators, union offices, and division staff.{' '}
            <Link href="/beta" className="underline hover:text-[#6366F1]">Contact us to set up your territory →</Link>
          </p>
        </div>

        {/* Org structure flexibility callout */}
        <div className={cn('rounded-2xl border p-6 mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-[#6366F1]" />
            <h2 className={cn('text-sm font-bold', tokens.text.heading)}>Adapts to your org structure</h2>
            <span className={cn('ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold', 'bg-[#6366F1]/10 text-[#6366F1]')}>Key feature</span>
          </div>
          <p className={cn('text-xs leading-relaxed mb-5', tokens.text.muted)}>
            Not every union has conferences. Norway manages churches directly. The Philippines adds a district layer. 
            Pulse adapts — toggle off levels that don&apos;t exist in your territory. Labels are configurable too 
            (&ldquo;Conference&rdquo; vs &ldquo;Region&rdquo; vs &ldquo;Field&rdquo; vs &ldquo;Section&rdquo;).
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {ORG_EXAMPLES.map(org => (
              <div key={org.name} className={cn('rounded-xl border p-4', tokens.bg.page, tokens.border.default)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', 'bg-[#6366F1]/10 text-[#6366F1]')}>{org.type}</span>
                </div>
                <p className={cn('text-xs font-bold mb-0.5', tokens.text.heading)}>{org.name}</p>
                <p className={cn('text-[10px] mb-3', tokens.text.muted)}>{org.region}</p>
                {/* Level toggles */}
                <div className="space-y-1.5">
                  {Object.entries(org.levels).map(([level, active]) => (
                    <div key={level} className="flex items-center gap-2">
                      <div className={cn('w-6 h-3.5 rounded-full flex items-center transition-colors px-0.5',
                        active ? 'bg-[#6366F1]' : 'bg-gray-300 dark:bg-[#2a3a50]'
                      )}>
                        <div className={cn('w-2.5 h-2.5 rounded-full bg-white transition-transform',
                          active ? 'translate-x-2.5' : 'translate-x-0'
                        )} />
                      </div>
                      <span className={cn('text-[10px] capitalize', active ? tokens.text.body : tokens.text.muted)}>
                        {level} level {!active && '(hidden)'}
                      </span>
                    </div>
                  ))}
                </div>
                {org.note && (
                  <div className="mt-3 flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">{org.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary stats — SNSW example */}
        <h2 className={cn('text-xs font-bold uppercase tracking-widest mb-3', tokens.text.muted)}>
          Example: South New South Wales Conference
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Churches',            value: '52',  icon: Church },
            { label: 'Pastors',             value: '18',  icon: Users },
            { label: 'Avg churches/pastor', value: '2.9', icon: BarChart3 },
            { label: 'Vacant charges',      value: '1',   icon: ClipboardList },
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
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-[#2a3a50] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }, i) => (
            <div
              key={id}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-default whitespace-nowrap',
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
                  <th className="text-right px-4 py-3">Delegations</th>
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
                    <td className="px-4 py-3 text-right">
                      {row.delegations > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#6366F1]">
                          <Shield className="w-3 h-3" />{row.delegations}
                        </span>
                      ) : (
                        <span className={cn('text-xs', tokens.text.muted)}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className={cn('text-xs hover:text-[#6366F1] transition-colors mr-3', tokens.text.muted)}>Edit</button>
                      <button className="text-xs text-red-400 hover:text-red-500 transition-colors">Remove</button>
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
              Upload a CSV or Excel file with historical pastoral assignments. Every row builds 
              the Personnel Intelligence database — enabling tenure analysis, leadership history, 
              and successor planning reports.
            </p>
            <div className={cn('rounded-lg border border-dashed p-4 text-center mb-3', tokens.border.default)}>
              <Upload className={cn('w-5 h-5 mx-auto mb-1', tokens.text.muted)} />
              <p className={cn('text-xs font-medium', tokens.text.muted)}>Drop CSV/Excel here or click to browse</p>
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
                <p className={cn('text-xs', tokens.text.muted)}>Pastor → Church Elder access grants</p>
              </div>
            </div>
            <p className={cn('text-xs leading-relaxed mb-4', tokens.text.muted)}>
              Pastors with large districts train and equip elders to run their churches.
              Elders get the full local church toolkit for their one church — scoped, not global.
              Conference can revoke any delegation in their territory.
            </p>
            <div className="space-y-2">
              {[
                { pastor: 'Morgan Vincent', elder: 'David Chen',    church: 'Canberra National', since: 'Feb 2024' },
                { pastor: 'Morgan Vincent', elder: 'Sarah Mitchell', church: 'South Canberra',   since: 'Jan 2025' },
                { pastor: 'Brett Pitman',   elder: 'Luke Horton',   church: 'Goulburn',          since: 'Jul 2023' },
              ].map(d => (
                <div key={d.elder} className={cn('flex items-center justify-between rounded-lg px-3 py-2.5', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
                  <div>
                    <p className={cn('text-xs font-medium', tokens.text.heading)}>
                      {d.elder} <span className={cn('font-normal', tokens.text.muted)}>at {d.church}</span>
                    </p>
                    <p className={cn('text-[10px]', tokens.text.muted)}>via {d.pastor} · {d.since}</p>
                  </div>
                  <button className="text-[10px] text-red-400 hover:text-red-500 transition-colors font-medium">Revoke</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personnel Intelligence feed */}
        <div className={cn('rounded-2xl border p-6', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div className="flex-1">
              <h3 className={cn('text-sm font-bold mb-1', tokens.text.heading)}>Feeds Personnel Intelligence</h3>
              <p className={cn('text-xs leading-relaxed mb-4', tokens.text.muted)}>
                Every assignment entered — current or historical — builds the personnel record.
                Over time this powers tenure analysis, successor planning, and leadership effectiveness 
                research unique to your conference&apos;s context.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Avg pastoral tenure',  value: '4.2 yrs', note: 'SNSW historical' },
                  { label: 'Assignments tracked',  value: '186',     note: 'All time' },
                  { label: 'Data completeness',    value: '61%',     note: 'Since 2010' },
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
            <p className={cn('text-xs', tokens.text.muted)}>Personnel Intelligence is a Pulse Admin tier feature</p>
            <Link href="/beta" className="flex items-center gap-1 text-xs font-semibold text-[#6366F1] hover:underline">
              Get admin access <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
