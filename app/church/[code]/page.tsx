import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GatedSection } from '@/components/GatedSection';
import Script from 'next/script';
import dynamic from 'next/dynamic';

const AttendanceTrendChart = dynamic(() => import('@/components/church/ChurchCharts').then(m => m.AttendanceTrendChart));
const AgeDemographicsChart  = dynamic(() => import('@/components/church/ChurchCharts').then(m => m.AgeDemographicsChart));
const MinistryActivityChart = dynamic(() => import('@/components/church/ChurchCharts').then(m => m.MinistryActivityChart));
const VisitorRetentionChart = dynamic(() => import('@/components/church/ChurchCharts').then(m => m.VisitorRetentionChart));
import {
  getChurchBySlug,
  getAllChurches,
  churchNameToSlug,
  getNearbyChurches,
  type GeocodedChurch,
} from '@/lib/data';
import { tokens, cn } from '@/lib/theme';
import { Card, Section } from '@/components/ui';
import {
  MapPin,
  Globe,
  Clock,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Users,
  Brain,
  DollarSign,
  BarChart3,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  Phone,
  Mail,
  Navigation,
  Building2,
} from 'lucide-react';

interface Props {
  params: Promise<{ code: string }>;
}

// ── Score helpers ──────────────────────────────────────────────────────────────

interface ScoreField {
  field: string;
  points: number;
  max: number;
  present: boolean;
}

interface ScoreResult {
  total: number;
  breakdown: ScoreField[];
}

function computeScore(church: GeocodedChurch): ScoreResult {
  const checks: ScoreField[] = [
    { field: 'Church name',           points: 5,  max: 5,  present: !!church.name },
    { field: 'Street address',        points: 10, max: 10, present: !!church.address },
    { field: 'Suburb / location',     points: 5,  max: 5,  present: !!church.suburb },
    { field: 'Website',               points: 15, max: 15, present: !!church.website },
    { field: 'GPS coordinates',       points: 10, max: 10, present: !!(church.lat && church.lng) },
    { field: 'Worship service time',  points: 15, max: 15, present: !!church.worshipTime },
    { field: 'Sabbath School time',   points: 10, max: 10, present: !!church.sabbathSchoolTime },
    { field: 'Programs & ministries', points: 10, max: 10, present: !!(church.programs?.length) },
    { field: 'Pastor name',           points: 10, max: 10, present: !!church.pastor },
    { field: 'Phone or email',        points: 10, max: 10, present: !!(church.phone || church.email) },
  ];
  const total = checks.reduce((sum, c) => sum + (c.present ? c.points : 0), 0);
  return { total, breakdown: checks };
}

// ── Circular SVG gauge ─────────────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color =
    score >= 80 ? '#22c55e' :
    score >= 50 ? '#eab308' :
    '#ef4444';

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
      <circle
        cx="50" cy="50" r={radius}
        fill="none" stroke="currentColor" strokeWidth="8"
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx="50" cy="50" r={radius}
        fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x="50" y="50"
        textAnchor="middle" dominantBaseline="central"
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: '50px 50px',
          fontSize: '18px',
          fontWeight: 700,
          fill: color,
        }}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Ministry footprint helpers ─────────────────────────────────────────────────

interface Ministry {
  key: string;
  name: string;
  keywords: string[];
}

const MINISTRIES: Ministry[] = [
  { key: 'community-services', name: 'Adventist Community Services', keywords: ['community service', 'acs', ] },
  { key: 'free-meals',         name: 'Free Meals Program',            keywords: ['free meal', 'meals program', 'soup kitchen', 'food bank', 'food pantry'] },
  { key: 'pathfinders',        name: 'Pathfinders Club',              keywords: ['pathfinder'] },
  { key: 'adventurers',        name: 'Adventurers Club',              keywords: ['adventurer'] },
  { key: 'youth',              name: 'Youth Ministry (AYS)',          keywords: ['youth', 'ays'] },
  { key: 'young-adults',       name: 'Young Adults',                  keywords: ['young adult'] },
  { key: 'sabbath-school',     name: 'Sabbath School',                keywords: ['sabbath school'] },
  { key: 'health',             name: 'Health Ministry',               keywords: ['health'] },
  { key: 'prayer',             name: 'Prayer Ministry',               keywords: ['prayer'] },
  { key: 'womens',             name: "Women's Ministry",              keywords: ["women"] },
  { key: 'mens',               name: "Men's Ministry",                keywords: ["men's", "mens ministry"] },
  { key: 'community-outreach', name: 'Community Outreach',            keywords: ['outreach', 'community outreach', 'evangelism'] },
];

interface MinistryStatus {
  ministry: Ministry;
  active: boolean;
  detail?: string;
}

function getMinistryStatuses(church: GeocodedChurch): MinistryStatus[] {
  const allPrograms = [
    ...(church.programs || []),
    ...(church.outreach || []),
  ].map(p => p.toLowerCase());

  return MINISTRIES.map(m => {
    const match = allPrograms.find(p =>
      m.keywords.some(kw => p.includes(kw))
    );
    return { ministry: m, active: !!match, detail: match };
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ChurchPage({ params }: Props) {
  const { code } = await params;
  const church = await getChurchBySlug(code);
  if (!church) notFound();

  const score = computeScore(church);
  const missing = score.breakdown.filter(b => !b.present).sort((a, b) => b.max - a.max);
  const present = score.breakdown.filter(b => b.present);
  const quickWins = missing.slice(0, 3);

  const ministries = getMinistryStatuses(church);
  const nearby = await getNearbyChurches(code);

  const displayName = church.name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '');

  const mapsUrl = church.address
    ? `https://maps.google.com/?q=${encodeURIComponent(`${church.address} ${church.suburb} ${church.state} ${church.postcode}`)}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${church.name} ${church.suburb} ${church.state}`)}`;

  const scoreColor =
    score.total >= 80 ? tokens.text.success :
    score.total >= 50 ? tokens.text.warning :
    tokens.text.danger;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://adventistpulse.org';

  // JSON-LD structured data
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: church.name,
    url: `${baseUrl}/church/${code}`,
    ...(church.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: church.address,
        addressLocality: church.suburb,
        addressRegion: church.state,
        postalCode: church.postcode,
        addressCountry: 'AU',
      },
    }),
    ...(church.lat && church.lng && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: church.lat,
        longitude: church.lng,
      },
    }),
    ...(church.website && {
      sameAs: church.website.startsWith('http') ? church.website : `https://${church.website}`,
    }),
    denomination: 'Seventh-day Adventist Church',
  };

  return (
    <>
      <Script
        id="church-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />

      <main className={cn('min-h-screen', tokens.bg.page, tokens.text.heading)}>

        {/* ── 1. Hero ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#4338ca] via-[#14b8a6] to-[#1e1b4b]">

          {/* Dot-grid texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />

          {/* Bottom fade into page background */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#F8F9FA] dark:from-[#1a2332] to-transparent"
          />

          <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-16">
            <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">

              {/* ── Left: text content ── */}
              <div>

                {/* Breadcrumb */}
                <nav className="inline-flex items-center gap-1.5 text-sm mb-6 text-white/60">
                  <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Adventist Pulse
                  </Link>
                  {church.conference && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <Link href={`/entity/${church.conference}`} className="hover:text-white transition-colors">
                        {church.conferenceName || church.conference}
                      </Link>
                    </>
                  )}
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-white/40">{displayName}</span>
                </nav>

                {/* Church name */}
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
                  {displayName}
                </h1>

                {/* Denomination badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-sm mb-4">
                  <Building2 className="w-3 h-3" />
                  Seventh-day Adventist Church
                </span>

                {/* Pastor */}
                {church.pastor && (
                  <p className="flex items-center gap-1.5 text-sm text-white/75 mt-1">
                    <Users className="w-4 h-4 text-white/40 shrink-0" />
                    {church.pastor}
                  </p>
                )}

                {/* Description */}
                {church.description && (
                  <p className="mt-3 text-sm leading-relaxed text-white/65 max-w-lg">
                    {church.description}
                  </p>
                )}

                {/* Info pills */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {church.address && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      {church.address}, {church.suburb} {church.state} {church.postcode}
                    </span>
                  )}
                  {church.sabbathSchoolTime && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/90 border border-white/15">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      Sabbath School: {church.sabbathSchoolTime}
                    </span>
                  )}
                  {church.worshipTime && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/90 border border-white/15">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      Worship: {church.worshipTime}
                    </span>
                  )}
                  {church.phone && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/90 border border-white/15">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      {church.phone}
                    </span>
                  )}
                  {church.email && (
                    <a
                      href={`mailto:${church.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/90 border border-white/15 hover:bg-white/20 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-white/50" />
                      {church.email}
                    </a>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#0d9488] hover:bg-white/90 transition-colors shadow-md"
                  >
                    <MapPin className="w-4 h-4" />
                    Google Maps
                  </a>
                  {church.website && church.website !== '#' && !church.website.startsWith('#') && (
                    <a
                      href={church.website.startsWith('http') ? church.website : `https://${church.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors backdrop-blur-sm"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>

              </div>{/* end left content */}

              {/* ── Right: gauge + map ── */}
              <div className="hidden md:flex flex-col gap-3 pt-2">

                {/* Profile score card */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4">
                  <CircularGauge score={score.total} />
                  <div>
                    <p className="text-white font-semibold text-sm">Profile Score</p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      score.total >= 80 ? 'text-green-300' :
                      score.total >= 50 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {score.total >= 80 ? 'Fully contributing' :
                       score.total >= 50 ? 'Partially contributing' : 'Low contribution'}
                    </p>
                    <p className="text-white/45 text-xs mt-0.5">{score.total}/100 points</p>
                  </div>
                </div>

                {/* Map embed */}
                {church.address ? (
                  <div className="relative h-[260px] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_REMOVED&q=${encodeURIComponent(`${church.address}, ${church.suburb} ${church.state} ${church.postcode}`)}&zoom=15`}
                      className="absolute inset-0 w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map of ${church.name}`}
                    />
                  </div>
                ) : (
                  <div className="h-[260px] rounded-2xl bg-white/10 border border-white/15 flex flex-col items-center justify-center text-white/50 backdrop-blur-sm">
                    <MapPin className="w-8 h-8 mb-2 text-white/25" />
                    <p className="text-sm">Address not yet recorded</p>
                  </div>
                )}

              </div>{/* end right column */}

            </div>
          </div>
        </div>{/* end hero */}

        {/* ── Church Analytics Charts ───────────────────────────────── */}
        <div className={cn('border-b', tokens.border.default)}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className={cn('text-lg font-bold', tokens.text.heading)}>Church Analytics</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide">Sample Data</span>
            </div>
            <p className={cn('text-sm mb-6 -mt-3', tokens.text.muted)}>
              Intelligence unlocks as churches contribute data. The more your church contributes, the richer your report becomes.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
                <AttendanceTrendChart churchName={displayName} />
              </div>
              <div className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
                <AgeDemographicsChart churchName={displayName} />
              </div>
              <div className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
                <MinistryActivityChart churchName={displayName} />
              </div>
              <div className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
                <VisitorRetentionChart churchName={displayName} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Health Indicators ─────────────────────────────────────── */}
        <div className={cn('border-b', tokens.border.default)}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className={cn('text-lg font-bold mb-5', tokens.text.heading)}>Health Indicators</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Membership',      value: '—',    context: 'Not Contributing' },
                { label: 'Attendance Rate', value: '—',    context: 'Not Contributing' },
                { label: 'Baptisms (2024)', value: '—',    context: 'Not Contributing' },
                { label: 'Growth Rate',     value: '—',    context: 'Not Contributing' },
                { label: 'Transfer Balance',value: '—',    context: 'Not Contributing' },
              ].map(({ label, value, context }) => (
                <div key={label} className={cn('rounded-xl border p-4', tokens.bg.card, tokens.border.default)}>
                  <p className={cn('text-xs font-semibold uppercase tracking-wide mb-1', tokens.text.muted)}>{label}</p>
                  <p className="text-2xl font-bold text-gray-300 dark:text-gray-600 font-mono">{value}</p>
                  <p className={cn('text-xs mt-1 font-medium', tokens.text.muted)}>{context}</p>
                </div>
              ))}
            </div>
            <p className={cn('text-xs mt-4', tokens.text.muted)}>
              Health indicator data is contributed by church members and administrators.{' '}
              <a href={`mailto:pulse@adventist.org.au?subject=Contribute data: ${church.name}`} className={cn(tokens.text.accent, 'hover:underline')}>
                Submit your church data →
              </a>
            </p>
          </div>
        </div>

        {/* ── Activity Feed ─────────────────────────────────────────── */}
        <div className={cn('border-b', tokens.border.default)}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className={cn('text-lg font-bold mb-5', tokens.text.heading)}>Recent Activity</h2>
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { icon: MapPin, text: 'Address verified from Pulse geocoded data', time: 'Mar 2025' },
                { icon: Globe,  text: 'Website URL added', time: 'Mar 2025' },
                { icon: Zap,    text: 'Church profile created on Adventist Pulse', time: 'Jan 2025' },
              ].map(({ icon: Icon, text, time }) => (
                <div key={text} className="flex items-start gap-3 py-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', tokens.bg.cardAlt)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', tokens.text.body)}>{text}</p>
                    <p className={cn('text-xs mt-0.5', tokens.text.muted)}>{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pulse Notes (auth-gated) ──────────────────────────────── */}
        <div className={cn('border-b', tokens.border.default)}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className={cn('text-lg font-bold mb-5', tokens.text.heading)}>Pulse Notes</h2>
            <GatedSection
              title="Pulse Notes"
              description="Read and contribute Pulse Notes for this church"
            >
              <div className={cn('rounded-xl border p-5 space-y-3', tokens.bg.card, tokens.border.default)}>
                {[
                  '"School-to-church transition is our biggest gap." — Phil Y., Senior Member · 👍 12',
                  '"We need more young adult programs." — Sarah M., Youth Leader · 👍 8',
                  '"Our community outreach is growing but needs structure." — David R., Elder · 👍 5',
                ].map(note => (
                  <div key={note} className={cn('p-4 rounded-lg text-sm', tokens.bg.cardAlt, tokens.text.body)}>{note}</div>
                ))}
              </div>
            </GatedSection>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

          {/* ── 2. Profile Completeness Score ─────────────────────── */}
          <Section
            title="Profile Completeness"
            subtitle="Every empty field is a gap. Help your community find you."
          >
            <div className="space-y-4">
              {/* Score overview */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className={cn('text-2xl font-bold', scoreColor)}>{score.total}/100</p>
                  <p className={cn('text-sm', tokens.text.body)}>
                    {score.total >= 80 ? 'Contributing — receiving full intelligence' :
                     score.total >= 50 ? 'Partial data — some intelligence locked' :
                     'Low contribution — most intelligence locked'}
                  </p>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${score.total}%`,
                      backgroundColor: score.total >= 80 ? '#22c55e' : score.total >= 50 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
              </Card>

              {/* Field breakdown + quick wins */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* What's present */}
                <Card>
                  <h3 className={cn('text-sm font-semibold mb-3', tokens.text.heading)}>
                    What we have
                  </h3>
                  <ul className="space-y-2">
                    {present.map(b => (
                      <li key={b.field} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                        <span className={tokens.text.body}>{b.field}</span>
                        <span className={cn('ml-auto text-xs tabular-nums', tokens.text.muted)}>+{b.points}pts</span>
                      </li>
                    ))}
                    {present.length === 0 && (
                      <li className={cn('text-sm italic', tokens.text.muted)}>No fields completed yet</li>
                    )}
                  </ul>
                </Card>

                {/* Quick wins */}
                {missing.length > 0 && (
                  <Card accent>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-[#14b8a6]" />
                      <h3 className={cn('text-sm font-semibold', tokens.text.heading)}>
                        Quick Wins — unlock {quickWins.reduce((s, b) => s + b.max, 0)} pts
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {quickWins.map(b => (
                        <li key={b.field} className="flex items-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0 text-yellow-500" />
                          <span className={tokens.text.body}>{b.field}</span>
                          <span className={cn('ml-auto text-xs tabular-nums', tokens.text.muted)}>+{b.max}pts</span>
                        </li>
                      ))}
                    </ul>
                    {missing.length > 3 && (
                      <p className={cn('mt-3 text-xs', tokens.text.muted)}>
                        + {missing.length - 3} more fields missing
                      </p>
                    )}
                  </Card>
                )}
              </div>

              {/* Claim CTA */}
              <div className={cn(
                'flex items-start gap-3 p-4 rounded-xl border',
                tokens.bg.accentSoft, tokens.border.default
              )}>
                <Building2 className="w-5 h-5 shrink-0 text-[#14b8a6] mt-0.5" />
                <div>
                  <p className={cn('text-sm font-semibold', tokens.text.heading)}>
                    Is this your church?
                  </p>
                  <p className={cn('text-sm mt-0.5', tokens.text.body)}>
                    Complete your church profile to unlock the full intelligence report — benchmarks, growth patterns, and missional insights from across the denomination.
                  </p>
                  <a
                    href={`mailto:pulse@adventist.org.au?subject=Claim church page: ${church.name}`}
                    className={cn(
                      'inline-flex items-center gap-1.5 mt-2 text-sm font-medium',
                      tokens.text.accent, 'hover:underline'
                    )}
                  >
                    Unlock your intelligence report →
                  </a>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 3. Mission Footprint grid ─────────────────────────── */}
          <Section
            title="Mission Footprint"
            subtitle="Active ministries and community programs. 'Not Contributing' means this church is missing out on intelligence insights tied to this ministry."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ministries.map(({ ministry, active, detail }) => (
                <div
                  key={ministry.key}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    active
                      ? cn(tokens.bg.success, 'border-green-200 dark:border-green-800')
                      : cn(tokens.bg.card, tokens.border.default)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full mt-1.5 shrink-0',
                      active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium leading-tight',
                        active ? tokens.text.success : tokens.text.muted
                      )}>
                        {ministry.name}
                      </p>
                      <p className={cn(
                        'text-xs mt-1 font-medium',
                        active ? 'text-green-600 dark:text-green-400' : tokens.text.muted
                      )}>
                        {active ? (detail ? detail : 'Active') : 'Not Contributing'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className={cn('mt-3 text-xs', tokens.text.muted)}>
              {ministries.filter(m => m.active).length} of {ministries.length} ministries recorded ·{' '}
              <a
                href={`mailto:pulse@adventist.org.au?subject=Update ministry data: ${church.name}`}
                className={cn(tokens.text.accent, 'hover:underline')}
              >
                Submit your ministry data
              </a>
            </p>
          </Section>

          {/* ── 4. Location context ───────────────────────────────── */}
          <Section title="Location">
            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Suburb',     value: church.suburb || '—' },
                { label: 'State',      value: church.state || '—' },
                { label: 'Postcode',   value: church.postcode || '—' },
                { label: 'Conference', value: church.conference || '—' },
              ].map(({ label, value }) => (
                <Card key={label} className="p-4 text-center">
                  <p className={cn('text-xs font-medium uppercase tracking-wide mb-1', tokens.text.muted)}>{label}</p>
                  <p className={cn('text-base font-semibold', tokens.text.heading)}>{value}</p>
                </Card>
              ))}
            </div>

            {/* Nearby churches */}
            {nearby.length > 0 && (
              <div>
                <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', tokens.text.heading)}>
                  <Navigation className="w-4 h-4 text-[#14b8a6]" />
                  Nearby Adventist Churches
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {nearby.map(n => {
                    const nearSlug = churchNameToSlug(n.name);
                    const nearDisplay = n.name.replace(
                      /\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, ''
                    );
                    return (
                      <Link
                        key={n.name}
                        href={`/church/${nearSlug}`}
                        className={cn(
                          'block p-4 rounded-xl border transition-colors',
                          tokens.bg.card, tokens.border.default, tokens.bg.cardHover,
                          'hover:border-[#14b8a6]/50'
                        )}
                      >
                        <p className={cn('text-sm font-semibold', tokens.text.heading)}>
                          {nearDisplay}
                        </p>
                        <p className={cn('text-xs mt-0.5', tokens.text.muted)}>
                          {n.suburb}, {n.state}
                        </p>
                        <p className={cn('text-xs mt-1 font-medium', tokens.text.accent)}>
                          {n.distanceKm.toFixed(0)} km away
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          {/* ── 5. Soft gate — Membership & Demographics ─────────── */}
          <Section title="Membership &amp; Demographics">
            <GatedSection
              title="Membership &amp; Demographics"
              description="Access membership intelligence, demographics, and vitality scores for this church."
            >
              <div className={cn('p-6', tokens.bg.card, tokens.border.default, 'border rounded-xl')}>
                <div className="space-y-4">
                  {[70, 45, 85, 30, 60].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn('h-3 rounded-full', tokens.bg.accentSoft)} style={{ width: '60px' }} />
                      <div className="h-5 rounded-full bg-[#14b8a6]/30" style={{ width: `${w}%` }} />
                      <div className={cn('h-3 rounded-full', tokens.bg.cardAlt)} style={{ width: '40px' }} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={cn('rounded-lg p-4', tokens.bg.cardAlt)}>
                      <div className={cn('h-6 rounded mb-2', tokens.bg.accentSoft)} style={{ width: '50%' }} />
                      <div className={cn('h-3 rounded', tokens.bg.cardAlt)} />
                    </div>
                  ))}
                </div>
              </div>
            </GatedSection>
          </Section>

          {/* ── 6. Hard gate — Church Tools ──────────────────────── */}
          <Section title="Church Tools — Intelligence &amp; Growth">
            <div className="relative rounded-xl overflow-hidden">
              {/* Blurred feature list */}
              <div
                aria-hidden="true"
                className={cn('p-6', tokens.bg.card, tokens.border.default, 'border rounded-xl')}
                style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Brain,         label: 'AI Insights',     desc: 'Personalised church health AI analysis' },
                    { icon: DollarSign,    label: 'Financial Health', desc: 'Tithe & offering trends, budgeting tools' },
                    { icon: MessageSquare, label: 'Ask AI',           desc: 'Chat with your church data' },
                    { icon: BarChart3,     label: 'Benchmarking',     desc: 'Compare with similar churches' },
                    { icon: TrendingUp,    label: 'Strategy Reports', desc: 'Actionable growth strategies' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className={cn('flex items-start gap-3 p-4 rounded-lg', tokens.bg.cardAlt)}>
                      <Icon className="w-5 h-5 shrink-0 text-[#14b8a6] mt-0.5" />
                      <div>
                        <p className={cn('text-sm font-semibold', tokens.text.heading)}>{label}</p>
                        <p className={cn('text-xs mt-0.5', tokens.text.muted)}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-[#1a2332]/80 backdrop-blur-sm rounded-xl px-6 text-center">
                <div className={cn('p-3 rounded-xl mb-3', tokens.bg.accentSoft)}>
                  <Lock className={cn('w-7 h-7', tokens.text.accent)} />
                </div>
                <h3 className={cn('text-lg font-semibold mb-1', tokens.text.heading)}>
                  Church Tools
                </h3>
                <p className={cn('text-sm max-w-sm mb-2', tokens.text.muted)}>
                  Intelligence &amp; Growth suite for church leaders
                </p>
                <ul className={cn('text-xs mb-5 space-y-1', tokens.text.body)}>
                  {['AI Insights', 'Financial Health', 'Ask AI', 'Benchmarking', 'Strategy Reports'].map(f => (
                    <li key={f} className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#14b8a6]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    tokens.bg.accent, tokens.bg.accentHover, tokens.text.onAccent
                  )}
                >
                  Request Beta Access
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Section>

        </div>
      </main>
    </>
  );
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const church = await getChurchBySlug(code);
  if (!church) return { title: 'Church Not Found' };

  const displayName = church.name
    .replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://adventistpulse.org';
  const desc = `Mission data profile for ${church.name} in ${church.suburb}, ${church.state}. Service times, ministry footprint, and church intelligence data. Part of ${church.conferenceName}.`;

  return {
    title: `${displayName} | Adventist Pulse`,
    description: desc,
    openGraph: {
      title: `${displayName} Seventh-day Adventist Church | Adventist Pulse`,
      description: desc,
      url: `${baseUrl}/church/${code}`,
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | Adventist Pulse`,
      description: desc,
    },
  };
}

// ── Static params ──────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const churches = await getAllChurches();
  const slugs = new Map<string, boolean>();
  const params: { code: string }[] = [];

  for (const church of churches) {
    const slug = churchNameToSlug(church.name);
    if (slug && !slugs.has(slug)) {
      slugs.set(slug, true);
      params.push({ code: slug });
    }
  }

  return params;
}
