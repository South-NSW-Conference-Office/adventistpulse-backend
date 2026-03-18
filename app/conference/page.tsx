import React from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import {
  Users, Church, Upload, UserCheck, BarChart3,
  ChevronRight, Lock, Calendar, Shield, Building2,
  ClipboardList, ArrowUpRight, UserCog, Settings, Globe2,
  Info, Zap, Radio, MessageSquare, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Bot
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
  { id: 'intel',      label: 'Intel Feed',      icon: Radio },
  { id: 'staffing',   label: 'Staffing',        icon: UserCheck },
  { id: 'history',    label: 'History Import',  icon: Upload },
  { id: 'delegation', label: 'Delegations',     icon: Shield },
  { id: 'access',     label: 'Access',          icon: UserCog },
  { id: 'settings',   label: 'Org Settings',    icon: Settings },
];

// Mission Intelligence Feed — Crucix-inspired tiered alert system
// FLASH = immediate action needed | PRIORITY = review this week | ROUTINE = watch list
const SIGNAL_FEED: {
  tier: 'FLASH' | 'PRIORITY' | 'ROUTINE';
  church: string;
  signal: string;
  detail: string;
  age: string;
  icon: React.ElementType;
}[] = [
  {
    tier:   'FLASH',
    church: 'Queanbeyan',
    signal: 'No pastor assigned',
    detail: 'Vacant for 3+ months. Elder delegation active but no head-pastor appointment.',
    age:    '97 days',
    icon:   AlertTriangle,
  },
  {
    tier:   'PRIORITY',
    church: 'Wollongong Central',
    signal: 'Membership down 18% over 24 months',
    detail: 'Consistent decline across 8 consecutive quarters. No growth events recorded.',
    age:    'Updated this week',
    icon:   TrendingDown,
  },
  {
    tier:   'PRIORITY',
    church: 'Goulburn',
    signal: 'Stats not submitted — 2 quarters',
    detail: 'Last data submission: Q2 2024. Automated reminders sent ×3.',
    age:    '6 months',
    icon:   Clock,
  },
  {
    tier:   'ROUTINE',
    church: 'Orange',
    signal: 'Pastoral tenure milestone — 7 years',
    detail: 'Pastor David Simms approaches 7yr tenure. Historical average SNSW: 4.2yr.',
    age:    'This month',
    icon:   Clock,
  },
  {
    tier:   'ROUTINE',
    church: 'Bathurst',
    signal: 'Elder delegation expiring in 30 days',
    detail: 'Access granted to Elder R. Thompson expires 18 Apr 2026. Renew or let lapse.',
    age:    '30 days',
    icon:   Shield,
  },
  {
    tier:   'ROUTINE',
    church: 'Canberra National',
    signal: 'Tithe growth +6% YTD',
    detail: 'Above conference average (+2%). Strong indicator — flag for case study.',
    age:    'This week',
    icon:   CheckCircle2,
  },
];

const TIER_CONFIG = {
  FLASH:    { label: 'FLASH',    bg: 'bg-red-500/10',    text: 'text-red-500',    border: 'border-red-500/20',    dot: 'bg-red-500' },
  PRIORITY: { label: 'PRIORITY', bg: 'bg-amber-500/10',  text: 'text-amber-500',  border: 'border-amber-500/20',  dot: 'bg-amber-500' },
  ROUTINE:  { label: 'ROUTINE',  bg: 'bg-[#6366F1]/10',  text: 'text-[#6366F1]',  border: 'border-[#6366F1]/20',  dot: 'bg-[#6366F1]' },
};

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
                  : 'border-transparent text-gray-500 dark:text-slate-500',
                // Flash badge on Intel Feed tab
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>

        {/* ── INTEL FEED (active tab in preview) ── */}
        <div className={cn('rounded-2xl border overflow-hidden mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a3a50]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#6366F1]" />
              <h2 className={cn('text-sm font-bold', tokens.text.heading)}>Mission Intelligence Feed</h2>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" title="Live" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">1 FLASH</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">2 PRIORITY</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-bold">3 ROUTINE</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#2a3a50]">
            {SIGNAL_FEED.map((s, i) => {
              const cfg = TIER_CONFIG[s.tier];
              const Icon = s.icon;
              return (
                <div key={i} className={cn('flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors', i === 0 ? `border-l-4 ${s.tier === 'FLASH' ? 'border-red-500' : ''}` : '')}>
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', cfg.bg)}>
                    <Icon className={cn('w-4 h-4', cfg.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.text, cfg.border)}>
                        {s.tier}
                      </span>
                      <span className={cn('text-xs font-semibold', tokens.text.heading)}>{s.church}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">· {s.age}</span>
                    </div>
                    <p className={cn('text-sm font-medium', tokens.text.body)}>{s.signal}</p>
                    <p className={cn('text-xs mt-0.5 leading-relaxed', tokens.text.muted)}>{s.detail}</p>
                  </div>
                  <button className={cn('flex-shrink-0 text-xs font-medium hover:text-[#6366F1] transition-colors hidden sm:block', tokens.text.muted)}>
                    Act →
                  </button>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-[#2a3a50] flex items-center justify-between">
            <p className={cn('text-xs', tokens.text.muted)}>Signals refresh every 15 minutes · Powered by Pulse data engine</p>
            <button className={cn('text-xs font-semibold text-[#6366F1] hover:underline')}>View all signals →</button>
          </div>
        </div>

        {/* ── PULSE BOT — Telegram intelligence commands ── */}
        <div className={cn('rounded-2xl border p-6 mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#6366F1]" />
            </div>
            <div>
              <h3 className={cn('text-sm font-bold', tokens.text.heading)}>Pulse Bot — Intelligence on your phone</h3>
              <p className={cn('text-xs', tokens.text.muted)}>Telegram commands that query your territory in real time</p>
            </div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-semibold">Admin tier</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {[
              {
                cmd:    '/brief SNSW',
                label:  'Conference summary',
                desc:   'Current staffing, top signals, membership trend, tithe performance — in one message',
                icon:   MessageSquare,
              },
              {
                cmd:    '/sweep',
                label:  'Anomaly scan',
                desc:   'Cross-checks all churches in your territory for FLASH and PRIORITY signals right now',
                icon:   Radio,
              },
              {
                cmd:    '/church SNSW-CANBNAT',
                label:  'Church deep-dive',
                desc:   'Full profile for any church — pastor, stats, trends, delegations, last submission',
                icon:   Church,
              },
            ].map(({ cmd, label, desc, icon: Icon }) => (
              <div key={cmd} className={cn('rounded-xl p-4', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
                <Icon className="w-4 h-4 text-[#6366F1] mb-2" />
                <code className={cn('block text-xs font-mono font-bold mb-1', tokens.text.heading)}>{cmd}</code>
                <p className={cn('text-xs font-semibold mb-1', tokens.text.body)}>{label}</p>
                <p className={cn('text-[10px] leading-relaxed', tokens.text.muted)}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Sample bot response */}
          <div className="rounded-xl bg-[#0D1117] border border-[#2a3a50] p-4 font-mono text-xs">
            <p className="text-[#6366F1] font-bold mb-2">→ /brief SNSW</p>
            <p className="text-emerald-400 mb-1">⚡ Pulse · South New South Wales Conference</p>
            <p className="text-gray-400 mb-3">Wed 18 Mar 2026 · 14:32 AEDT</p>
            <p className="text-white mb-1">📍 <span className="text-amber-400 font-bold">1 FLASH</span>  <span className="text-amber-300 font-bold">2 PRIORITY</span>  <span className="text-[#818cf8]">3 ROUTINE</span></p>
            <p className="text-red-400 mb-1">🔴 FLASH — Queanbeyan: No pastor (97 days vacant)</p>
            <p className="text-amber-400 mb-1">🟡 PRIORITY — Wollongong Central: −18% membership 24mo</p>
            <p className="text-gray-300 mb-3">🟡 PRIORITY — Goulburn: Stats missing 2 quarters</p>
            <p className="text-gray-400 mb-1">👥 Pastors: 18 active · 1 vacant charge</p>
            <p className="text-gray-400 mb-1">⛪ Churches: 52 · 4,800 members</p>
            <p className="text-gray-400 mb-1">💰 Tithe: +3.2% YTD vs prior year</p>
            <p className="text-gray-500 mt-2 text-[10px]">Reply /sweep to run full anomaly scan · /church [code] for detail</p>
          </div>
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

        {/* Invite Flow Panel */}
        <div className={cn('rounded-2xl border p-6 mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#6366F1]" />
            </div>
            <div>
              <h3 className={cn('text-sm font-bold', tokens.text.heading)}>Add a Pastor or Worker</h3>
              <p className={cn('text-xs', tokens.text.muted)}>Nominating them creates their account and sends the invite</p>
            </div>
          </div>

          {/* How it works */}
          <div className="grid sm:grid-cols-4 gap-3 mb-5">
            {[
              { step: '1', label: 'Enter their email',    desc: 'Use their church-approved address' },
              { step: '2', label: 'Assign churches',      desc: 'Choose which churches they pastor' },
              { step: '3', label: 'Choose who pays',      desc: 'Conference seat or they subscribe' },
              { step: '4', label: 'Invite sent',          desc: 'They click, set password, done' },
            ].map(({ step, label, desc }) => (
              <div key={step} className={cn('rounded-xl p-3 text-center', 'bg-gray-50 dark:bg-[#1a2a3a]')}>
                <div className="w-6 h-6 rounded-full bg-[#6366F1] text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                  {step}
                </div>
                <p className={cn('text-xs font-semibold', tokens.text.heading)}>{label}</p>
                <p className={cn('text-[10px] mt-0.5', tokens.text.muted)}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Sample form */}
          <div className={cn('rounded-xl border p-4', tokens.bg.page, tokens.border.default)}>
            <p className={cn('text-xs font-semibold mb-3', tokens.text.muted)}>Nomination form — preview</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={cn('block text-[10px] font-semibold uppercase tracking-wider mb-1', tokens.text.muted)}>Full Name</label>
                <div className={cn('rounded-lg border px-3 py-2 text-sm', tokens.bg.card, tokens.border.default, tokens.text.body)}>
                  Morgan Vincent
                </div>
              </div>
              <div>
                <label className={cn('block text-[10px] font-semibold uppercase tracking-wider mb-1', tokens.text.muted)}>Church-approved email</label>
                <div className={cn('rounded-lg border px-3 py-2 text-sm flex items-center gap-2', tokens.bg.card, tokens.border.default, tokens.text.body)}>
                  mvincentor@adventist.org.au
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">✓ Known domain (SPD/AUC)</span>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className={cn('block text-[10px] font-semibold uppercase tracking-wider mb-1', tokens.text.muted)}>Assigned Churches</label>
              <div className={cn('rounded-lg border px-3 py-2 text-sm flex flex-wrap gap-1.5', tokens.bg.card, tokens.border.default)}>
                {['Canberra National', 'South Canberra', 'Tuggeranong'].map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6366F1]/10 text-[#6366F1]">
                    {c} ×
                  </span>
                ))}
                <span className={cn('text-[10px] px-2 py-0.5', tokens.text.muted)}>+ Add church…</span>
              </div>
            </div>
            <div className="mb-4">
              <label className={cn('block text-[10px] font-semibold uppercase tracking-wider mb-1', tokens.text.muted)}>Seat</label>
              <div className="grid grid-cols-2 gap-2">
                <div className={cn('rounded-lg border-2 border-[#6366F1] px-3 py-2 text-xs font-semibold', tokens.bg.card, tokens.text.heading)}>
                  ● Conference pays — include in our plan
                </div>
                <div className={cn('rounded-lg border px-3 py-2 text-xs', tokens.bg.card, tokens.border.default, tokens.text.muted)}>
                  ○ Pastor subscribes themselves
                </div>
              </div>
            </div>
            <div className={cn('rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/5 p-3 mb-4 text-xs', tokens.text.body)}>
              <span className="font-semibold text-[#6366F1]">Auto-granted on invitation:</span>{' '}
              verified member status · Pulse Notes · church profile visibility · pastor dashboard access
            </div>
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#6366F1] text-white hover:bg-[#4f46e5] transition-colors opacity-80 cursor-default">
              Send Invitation →
            </button>
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
