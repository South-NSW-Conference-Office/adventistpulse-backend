import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn, tokens } from '@/lib/theme'
import {
  Award, MapPin, Calendar, TrendingUp, Users, Church,
  ChevronRight, BookOpen, Star, Clock, TrendingDown, Minus, AlertCircle
} from 'lucide-react'
import dynamic from 'next/dynamic'

const CareerChart = dynamic(() => import('@/components/person/CareerChart'))

// ── Types ─────────────────────────────────────────────────────────────────────
interface CareerRole {
  entityCode: string
  entityName: string
  entityType: string
  title: string
  startYear: number
  endYear: number | null
  tenureYears: number
  isCurrent: boolean
}
interface YearStat {
  year: number
  membership: number
  baptisms: number
  net_gain: number
  isCovid?: boolean
}
interface EffectivenessMetric {
  label: string
  value: string
  benchmark: string
  delta: number
  note?: string
}
interface PredecessorRow {
  name: string
  personId?: string
  title: string
  years: string
  avgBaptismRate: number | null
  avgNetGain: number | null
  dataStatus: 'available' | 'pending' | 'historical'
}
interface PeerRow {
  personName: string | null    // null = not yet extracted from Yearbooks
  personId?: string
  entityCode: string
  entityName: string
  title: string
  tenureStart: number | null
  avgBaptismRate: number
  avgNetGain: number
  rank: number
  isSelf?: boolean
}
interface PersonData {
  personId: string
  name: string
  currentTitle: string
  currentEntity: string
  currentEntityCode: string
  division: string
  country: string
  totalYearsService: number
  firstYear: number
  lastYear: number | null
  highestLevel: string
  career: CareerRole[]
  statsDuringTenure: YearStat[]
  effectivenessMetrics: EffectivenessMetric[]
  overallEffectivenessScore: number   // 0–100
  trajectoryDirection: 'improving' | 'stable' | 'declining'
  assessmentSummary: string           // 2-3 sentence synthesis
  predecessor?: { name: string; personId: string; title: string; yearsServed: number }
  predecessorHistory: PredecessorRow[]
  peers: PeerRow[]           // Australian conference peers
  spdRanking: PeerRow[]      // All SPD entities same level
  entitiesServed: string[]
  titlesHeld: string[]
  confidence: 'high' | 'probable' | 'uncertain'
}

// ── Static data — replaced by MongoDB API in week 2 ──────────────────────────
const PERSONS: Record<string, PersonData> = {
  'justin-lawman': {
    personId: 'justin-lawman',
    name: 'Justin Lawman',
    currentTitle: 'President',
    currentEntity: 'South New South Wales Conference',
    currentEntityCode: 'SNSW',
    division: 'South Pacific Division',
    country: 'Australia',
    totalYearsService: 9,
    firstYear: 2016,
    lastYear: null,
    highestLevel: 'Conference',
    overallEffectivenessScore: 78,
    trajectoryDirection: 'improving',
    assessmentSummary: 'The South New South Wales Conference has grown consistently under this administration. Net membership gain in non-COVID years is double the rate of the preceding administration, and the baptism rate has increased 32% per 100 members. The post-COVID recovery was among the strongest in the SPD — 2022–2024 represent the highest sustained growth in the available dataset.',
    career: [
      {
        entityCode: 'SNSW',
        entityName: 'South New South Wales Conference',
        entityType: 'Conference',
        title: 'President',
        startYear: 2016,
        endYear: null,
        tenureYears: 9,
        isCurrent: true,
      },
    ],
    effectivenessMetrics: [
      {
        label: 'Annual net growth rate',
        value: '54.7 members/year',
        benchmark: '27.0 (predecessor avg)',
        delta: 103,
        note: 'Excludes 2020–21 COVID years for fair comparison',
      },
      {
        label: 'Baptism rate',
        value: '2.14% per 100 members',
        benchmark: '1.62% (predecessor avg)',
        delta: 32,
        note: 'Measures evangelistic output normalised for conference size',
      },
      {
        label: 'Membership growth (total)',
        value: '+378 members (+13.6%)',
        benchmark: 'Conference was at 2,774 in 2016',
        delta: 14,
      },
      {
        label: 'Post-COVID recovery',
        value: '61 net members/year (2022–24)',
        benchmark: '49.8/year pre-COVID (2016–19)',
        delta: 23,
        note: 'Trajectory is accelerating, not reverting to pre-COVID baseline',
      },
    ],
    statsDuringTenure: [
      { year: 2016, membership: 2774, baptisms: 38, net_gain: 20 },
      { year: 2017, membership: 2859, baptisms: 77, net_gain: 85 },
      { year: 2018, membership: 2921, baptisms: 62, net_gain: 62 },
      { year: 2019, membership: 2953, baptisms: 53, net_gain: 32 },
      { year: 2020, membership: 2952, baptisms: 28, net_gain: -1, isCovid: true },
      { year: 2021, membership: 2968, baptisms: 26, net_gain: 16, isCovid: true },
      { year: 2022, membership: 3055, baptisms: 78, net_gain: 87 },
      { year: 2023, membership: 3048, baptisms: 56, net_gain: -7 },
      { year: 2024, membership: 3152, baptisms: 82, net_gain: 104 },
    ],
    predecessor: { name: 'Barry Oliver', personId: 'barry-oliver', title: 'President', yearsServed: 16 },
    predecessorHistory: [
      {
        name: 'Barry Oliver',
        personId: 'barry-oliver',
        title: 'President',
        years: '2000–2015',
        avgBaptismRate: 1.62,
        avgNetGain: 27.0,
        dataStatus: 'available',
      },
      {
        name: 'Previous President',
        title: 'President',
        years: '~1990–1999',
        avgBaptismRate: null,
        avgNetGain: null,
        dataStatus: 'pending',
      },
      {
        name: 'Previous President',
        title: 'President',
        years: '~1980–1989',
        avgBaptismRate: null,
        avgNetGain: null,
        dataStatus: 'historical',
      },
    ],
    // Layer 2: AUC union — president to president effectiveness comparison
    peers: [
      { personName: 'Simon Gigliotti', personId: 'simon-gigliotti', entityCode: 'NAC',  entityName: 'North Australia',   title: 'President', tenureStart: 2019, avgBaptismRate: 2.31, avgNetGain: 48.4,  rank: 1 },
      { personName: 'Justin Lawman',   personId: 'justin-lawman',   entityCode: 'SNSW', entityName: 'South NSW',          title: 'President', tenureStart: 2016, avgBaptismRate: 2.14, avgNetGain: 54.7,  rank: 2, isSelf: true },
      { personName: null, entityCode: 'GSYD', entityName: 'Greater Sydney',   title: 'President', tenureStart: null, avgBaptismRate: 2.02, avgNetGain: 130.9, rank: 3 },
      { personName: null, entityCode: 'VIC',  entityName: 'Victoria',         title: 'President', tenureStart: null, avgBaptismRate: 1.87, avgNetGain: 188.4, rank: 4 },
      { personName: null, entityCode: 'WAC',  entityName: 'West Australia',   title: 'President', tenureStart: null, avgBaptismRate: 1.82, avgNetGain: 100.3, rank: 5 },
      { personName: null, entityCode: 'SAC',  entityName: 'South Australia',  title: 'President', tenureStart: null, avgBaptismRate: 1.71, avgNetGain: 35.7,  rank: 6 },
      { personName: null, entityCode: 'NNSW', entityName: 'North NSW',        title: 'President', tenureStart: null, avgBaptismRate: 1.70, avgNetGain: 133.3, rank: 7 },
      { personName: null, entityCode: 'SQC',  entityName: 'South Queensland', title: 'President', tenureStart: null, avgBaptismRate: 1.56, avgNetGain: 123.1, rank: 8 },
      { personName: null, entityCode: 'TAS',  entityName: 'Tasmania',         title: 'President', tenureStart: null, avgBaptismRate: 1.48, avgNetGain: 16.3,  rank: 9 },
    ],
    // Layer 3: SPD-wide — president to president across the whole division
    spdRanking: [
      { personName: null, entityCode: 'PNG',   entityName: 'Papua New Guinea',            title: 'President', tenureStart: null, avgBaptismRate: 10.46, avgNetGain: 47848,  rank: 1 },
      { personName: null, entityCode: 'TPUM',  entityName: 'Trans-Pacific Union Mission', title: 'President', tenureStart: null, avgBaptismRate: 3.82,  avgNetGain: 3034.4, rank: 2 },
      { personName: null, entityCode: 'NZPUC', entityName: 'New Zealand',                 title: 'President', tenureStart: null, avgBaptismRate: 2.61,  avgNetGain: 353.4,  rank: 3 },
      { personName: 'Simon Gigliotti', personId: 'simon-gigliotti', entityCode: 'NAC',  entityName: 'North Australia', title: 'President', tenureStart: 2019, avgBaptismRate: 2.31, avgNetGain: 48.4,  rank: 4 },
      { personName: 'Justin Lawman',   personId: 'justin-lawman',   entityCode: 'SNSW', entityName: 'South NSW',       title: 'President', tenureStart: 2016, avgBaptismRate: 2.14, avgNetGain: 54.7,  rank: 5, isSelf: true },
      { personName: null, entityCode: 'GSYD', entityName: 'Greater Sydney',   title: 'President', tenureStart: null, avgBaptismRate: 2.02, avgNetGain: 130.9, rank: 6 },
      { personName: null, entityCode: 'VIC',  entityName: 'Victoria',         title: 'President', tenureStart: null, avgBaptismRate: 1.87, avgNetGain: 188.4, rank: 7 },
      { personName: null, entityCode: 'WAC',  entityName: 'West Australia',   title: 'President', tenureStart: null, avgBaptismRate: 1.82, avgNetGain: 100.3, rank: 8 },
      { personName: null, entityCode: 'SAC',  entityName: 'South Australia',  title: 'President', tenureStart: null, avgBaptismRate: 1.71, avgNetGain: 35.7,  rank: 9 },
      { personName: null, entityCode: 'NNSW', entityName: 'North NSW',        title: 'President', tenureStart: null, avgBaptismRate: 1.70, avgNetGain: 133.3, rank: 10 },
      { personName: null, entityCode: 'SQC',  entityName: 'South Queensland', title: 'President', tenureStart: null, avgBaptismRate: 1.56, avgNetGain: 123.1, rank: 11 },
      { personName: null, entityCode: 'TAS',  entityName: 'Tasmania',         title: 'President', tenureStart: null, avgBaptismRate: 1.48, avgNetGain: 16.3,  rank: 12 },
    ],
    entitiesServed: ['SNSW'],
    titlesHeld: ['President'],
    confidence: 'high',
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 55 ? '#6366f1' : '#f59e0b'
  const r = 36, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{score}</div>
        <div className="text-[10px] text-gray-400">/ 100</div>
      </div>
    </div>
  )
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 5) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
      <TrendingUp className="w-3 h-3" />+{delta}%
    </span>
  )
  if (delta < -5) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-red-400">
      <TrendingDown className="w-3 h-3" />{delta}%
    </span>
  )
  return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-400">
      <Minus className="w-3 h-3" />Stable
    </span>
  )
}

function TrajectoryPill({ dir }: { dir: PersonData['trajectoryDirection'] }) {
  const map = {
    improving: { label: 'Improving trajectory', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    stable: { label: 'Stable trajectory', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    declining: { label: 'Declining trajectory', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  }
  const { label, color } = map[dir]
  return (
    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', color)}>
      {label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function PersonPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params
  const person = PERSONS[personId]
  if (!person) notFound()

  const stats = person.statsDuringTenure
  const totalBaptisms = stats.reduce((s, y) => s + y.baptisms, 0)
  const currentMembership = stats[stats.length - 1]?.membership ?? 0
  const growth = currentMembership - (stats[0]?.membership ?? 0)

  return (
    <div className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb */}
        <nav className={cn('flex items-center gap-1 text-xs', tokens.text.muted)}>
          <Link href="/" className="hover:text-white transition-colors">Pulse</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-white transition-colors cursor-pointer">People</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{person.name}</span>
        </nav>

        {/* Hero */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-white">
                {person.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className={cn('text-2xl font-bold', tokens.text.heading)}>{person.name}</h1>
                  <p className={cn('text-base mt-0.5', tokens.text.body)}>
                    {person.currentTitle} · {person.currentEntity}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <TrajectoryPill dir={person.trajectoryDirection} />
                  {person.confidence === 'high' && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Star className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <div className={cn('flex flex-wrap gap-4 mt-3 text-sm', tokens.text.muted)}>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{person.country}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Serving since {person.firstYear}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{person.totalYearsService} years of service</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{person.division}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Effectiveness Overview */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-4', tokens.text.heading)}>Tenure effectiveness</h2>
          <div className="flex items-start gap-6 flex-wrap">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ScoreRing score={person.overallEffectivenessScore} />
              <p className={cn('text-xs text-center', tokens.text.muted)}>Effectiveness<br />score</p>
            </div>
            {/* Assessment text */}
            <div className="flex-1 min-w-[200px]">
              <p className={cn('text-sm leading-relaxed', tokens.text.body)}>
                {person.assessmentSummary}
              </p>
              <div className="flex gap-4 mt-4 flex-wrap">
                <div>
                  <p className={cn('text-xs', tokens.text.muted)}>People baptised</p>
                  <p className={cn('text-xl font-bold tabular-nums text-emerald-400')}>{totalBaptisms}</p>
                </div>
                <div>
                  <p className={cn('text-xs', tokens.text.muted)}>Members added</p>
                  <p className={cn('text-xl font-bold tabular-nums', tokens.text.heading)}>+{growth}</p>
                </div>
                <div>
                  <p className={cn('text-xs', tokens.text.muted)}>Current membership</p>
                  <p className={cn('text-xl font-bold tabular-nums', tokens.text.heading)}>{currentMembership.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Effectiveness metrics */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-4', tokens.text.heading)}>Benchmarks vs predecessor administration</h2>
          <div className="space-y-3">
            {person.effectivenessMetrics.map((m, i) => (
              <div key={i} className={cn('rounded-xl p-4 border', tokens.bg.cardAlt, tokens.border.default)}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <p className={cn('text-xs font-medium mb-1', tokens.text.muted)}>{m.label}</p>
                    <p className={cn('text-sm font-bold', tokens.text.heading)}>{m.value}</p>
                    <p className={cn('text-xs mt-0.5', tokens.text.muted)}>
                      Benchmark: {m.benchmark}
                    </p>
                    {m.note && (
                      <p className={cn('text-xs mt-1 flex items-center gap-1', tokens.text.muted)}>
                        <AlertCircle className="w-3 h-3 shrink-0" />{m.note}
                      </p>
                    )}
                  </div>
                  <DeltaBadge delta={m.delta} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={cn('text-sm font-semibold', tokens.text.heading)}>Conference membership & baptisms</h2>
            <span className={cn('text-xs', tokens.text.muted)}>Source: adventiststatistics.org</span>
          </div>
          <p className={cn('text-xs mb-4', tokens.text.muted)}>2020–21 shaded as COVID years</p>
          <CareerChart data={stats} startYear={person.career[0].startYear} />
        </div>

        {/* Predecessor comparison */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>vs Previous administrations — SNSW</h2>
          <p className={cn('text-xs mb-4', tokens.text.muted)}>Baptism rate per 100 members/year (non-COVID, normalised for conference size)</p>
          <div className="space-y-2">
            {/* Current */}
            <div className="flex items-center gap-3 rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">★</div>
              <div className="flex-1">
                <span className={cn('text-sm font-semibold', tokens.text.heading)}>{person.name}</span>
                <span className={cn('text-xs ml-2', tokens.text.muted)}>{person.career[0].startYear}–present</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-400">2.14%</div>
                <div className={cn('text-xs', tokens.text.muted)}>+54.7/yr</div>
              </div>
            </div>
            {/* Predecessors */}
            {person.predecessorHistory.map((p, i) => (
              <div key={i} className={cn('flex items-center gap-3 rounded-xl p-3 border', tokens.bg.cardAlt, tokens.border.default)}>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                  p.dataStatus === 'available' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'
                )}>{i + 1}</div>
                <div className="flex-1">
                  <span className={cn('text-sm', p.personId ? 'font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer' : tokens.text.muted)}>
                    {p.dataStatus === 'available' ? p.name : p.name}
                  </span>
                  <span className={cn('text-xs ml-2', tokens.text.muted)}>{p.years}</span>
                </div>
                <div className="text-right">
                  {p.dataStatus === 'available' ? (
                    <>
                      <div className={cn('text-sm font-bold', tokens.text.body)}>{p.avgBaptismRate}%</div>
                      <div className={cn('text-xs', tokens.text.muted)}>+{p.avgNetGain}/yr</div>
                    </>
                  ) : (
                    <span className={cn('text-xs italic', tokens.text.muted)}>
                      {p.dataStatus === 'pending' ? 'Extracting…' : 'Historical — loading'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peer comparison — same union (AUC) */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>vs AUC union peers — president to president</h2>
          <p className={cn('text-xs mb-4', tokens.text.muted)}>Current presidents of every Australian Union Conference conference. Same period, same role, same metric. Names extracting from Yearbooks as data arrives.</p>
          <div className="space-y-2">
            {person.peers.map((p, i) => (
              <div key={i} className={cn('flex items-center gap-3 rounded-xl p-3 border',
                p.isSelf ? 'bg-indigo-500/10 border-indigo-500/20' : cn(tokens.bg.cardAlt, tokens.border.default)
              )}>
                <div className={cn('w-7 text-center text-sm font-bold tabular-nums shrink-0',
                  p.rank <= 3 ? 'text-amber-400' : tokens.text.muted
                )}>#{p.rank}</div>
                <div className="flex-1 min-w-0">
                  {p.personName ? (
                    <div className={cn('text-sm font-semibold', p.isSelf ? 'text-white' : tokens.text.heading)}>
                      {p.personName} {p.isSelf && <span className="text-indigo-400 text-xs ml-1">← this profile</span>}
                    </div>
                  ) : (
                    <div className={cn('text-sm italic', tokens.text.muted)}>President extracting…</div>
                  )}
                  <div className={cn('text-xs', tokens.text.muted)}>
                    {p.entityName}{p.tenureStart ? ` · since ${p.tenureStart}` : ''}
                  </div>
                </div>
                <div className="flex gap-4 text-right shrink-0">
                  <div>
                    <div className={cn('text-sm font-bold tabular-nums', p.isSelf ? 'text-indigo-400' : tokens.text.body)}>{p.avgBaptismRate}%</div>
                    <div className={cn('text-[10px]', tokens.text.muted)}>bapt rate</div>
                  </div>
                  <div className="w-16">
                    <div className={cn('text-sm font-bold tabular-nums', p.isSelf ? 'text-indigo-400' : tokens.text.body)}>
                      {p.avgNetGain > 0 ? '+' : ''}{p.avgNetGain}
                    </div>
                    <div className={cn('text-[10px]', tokens.text.muted)}>net/yr</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SPD-wide */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>vs SPD — all conference presidents (2016–2024)</h2>
          <p className={cn('text-xs mb-4', tokens.text.muted)}>Every conference-level president across the South Pacific Division. Leadership effectiveness comparison, not a conference size ranking.</p>
          <div className="space-y-2">
            {person.spdRanking.map((p, i) => (
              <div key={i} className={cn('flex items-center gap-3 rounded-xl p-3 border',
                p.isSelf ? 'bg-indigo-500/10 border-indigo-500/20' : cn(tokens.bg.cardAlt, tokens.border.default)
              )}>
                <div className={cn('w-7 text-center text-sm font-bold tabular-nums shrink-0',
                  p.rank === 1 ? 'text-amber-400' : p.rank <= 3 ? 'text-amber-400/70' : tokens.text.muted
                )}>#{p.rank}</div>
                <div className="flex-1 min-w-0">
                  {p.personName ? (
                    <div className={cn('text-sm font-semibold', p.isSelf ? 'text-white' : tokens.text.heading)}>
                      {p.personName} {p.isSelf && <span className="text-indigo-400 text-xs ml-1">← this profile</span>}
                    </div>
                  ) : (
                    <div className={cn('text-sm italic', tokens.text.muted)}>President extracting…</div>
                  )}
                  <div className={cn('text-xs', tokens.text.muted)}>
                    {p.entityName}{p.tenureStart ? ` · since ${p.tenureStart}` : ''}
                  </div>
                </div>
                <div className={cn('text-sm font-bold tabular-nums shrink-0', p.isSelf ? 'text-indigo-400' : tokens.text.body)}>
                  {p.avgBaptismRate}%
                </div>
              </div>
            ))}
          </div>
          <p className={cn('text-xs mt-3 pt-3 border-t', tokens.text.muted, tokens.border.default)}>
            PNG and Trans-Pacific rank 1–2 due to mass evangelism culture and field demographics. AUC context (ranks 4–12) is the more meaningful peer group for Australian conference presidents.
          </p>
        </div>

        {/* Global comparison — Layer 4 */}
        <div className={cn('rounded-2xl p-6 border border-dashed', tokens.bg.cardAlt, tokens.border.default)}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>vs Global — all conferences worldwide</h2>
              <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>
                This layer will rank SNSW against every conference on earth — all 13 GC Divisions.
                Global statistical data is currently being extracted from the Adventist Yearbook archive (1904–2023).
                Expected: mid-week.
              </p>
            </div>
          </div>
        </div>

        {/* Career timeline */}
        <div className={cn('rounded-2xl p-6 border', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-sm font-semibold mb-5', tokens.text.heading)}>Career timeline</h2>
          <div className="space-y-4">
            {person.career.map((role, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-3 h-3 rounded-full mt-1 shrink-0',
                    role.isCurrent ? 'bg-emerald-400' : 'bg-indigo-500')} />
                  {i < person.career.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                </div>
                <div className={cn('flex-1 pb-4 rounded-xl p-4 border -mt-1',
                  role.isCurrent ? 'bg-emerald-500/5 border-emerald-500/20' : cn(tokens.bg.cardAlt, tokens.border.default)
                )}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className={cn('font-semibold', tokens.text.heading)}>{role.title}</p>
                      <Link href={`/entity/${role.entityCode.toLowerCase()}`}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        {role.entityName}
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-medium', tokens.text.body)}>
                        {role.startYear}–{role.endYear ?? 'present'}
                      </p>
                      <p className={cn('text-xs', tokens.text.muted)}>{role.tenureYears} years</p>
                    </div>
                  </div>
                  {role.isCurrent && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Currently serving
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {person.predecessor && (
            <div className={cn('mt-4 pt-4 border-t flex items-center justify-between text-sm', tokens.border.default)}>
              <span className={tokens.text.muted}>Preceded by</span>
              <Link href={`/person/${person.predecessor.personId}`}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                {person.predecessor.name}
                <span className={cn('text-xs', tokens.text.muted)}>
                  ({person.predecessor.title}, {person.predecessor.yearsServed} yrs)
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Data source */}
        <div className={cn('rounded-xl p-4 border text-xs flex gap-3', tokens.border.default, tokens.bg.cardAlt)}>
          <BookOpen className={cn('w-4 h-4 shrink-0 mt-0.5', tokens.text.muted)} />
          <div className={tokens.text.muted}>
            <span className="font-medium text-white">Data sources: </span>
            Career history from the Seventh-day Adventist Yearbook (2016–2024) via Pulse's automated extraction pipeline. Statistics from adventiststatistics.org. Effectiveness metrics are tenure-adjusted and benchmarked against the preceding administration. COVID years (2020–21) are noted but not excluded from the overall score.{' '}
            <span className="text-amber-400">Access to full benchmarking data requires member access.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
