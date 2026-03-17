export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getAllEntities, getQuickStats } from '@/lib/data';
import { getAllLRPs } from '@/lib/lrps';
import { tokens, cn } from '@/lib/theme';
import {
  BarChart3, Microscope, Globe2, Users, TrendingUp, BookOpen,
  Check, Minus,
} from 'lucide-react';
import { MatrixCanvasLoader } from '@/components/landing/MatrixCanvasLoader';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

export default async function Home() {
  const [allEntities, gcStats, lrps] = await Promise.all([
    getAllEntities().catch(() => []),
    getQuickStats('G10001').catch(() => null),
    getAllLRPs().catch(() => []),
  ]);

  const heroStats = [
    { label: 'Members Worldwide', value: fmt(gcStats?.membership) },
    { label: 'Churches', value: fmt(gcStats?.churches) },
    { label: 'Entities Tracked', value: allEntities.length > 0 ? `${allEntities.length}+` : '116+' },
    { label: 'Research Projects', value: `${lrps.length}+` },
  ];

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Statistics', desc: 'Membership, baptisms, tithe and growth trends across every conference, union and division — decades of history in one place.' },
    { icon: <Microscope className="w-5 h-5" />, title: 'Living Research', desc: '208 active research projects synthesising decades of Adventist growth data into actionable mission intelligence.' },
    { icon: <Globe2 className="w-5 h-5" />, title: 'Mission Maps', desc: 'Interactive heat maps showing church presence, growth corridors, and territories where the work is yet to be finished.' },
    { icon: <Users className="w-5 h-5" />, title: 'Church Profiles', desc: 'Every local church with youth ministry data, community engagement metrics, and ministry coverage at a glance.' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Rankings', desc: 'Compare conferences and unions on key mission metrics — baptisms, retention, tithe per member, and net growth.' },
    { icon: <BookOpen className="w-5 h-5" />, title: 'Intelligence Briefs', desc: 'Curated mission intelligence delivered to leaders — data-backed, theologically grounded, actionable.' },
  ];

  const tiers = [
    {
      name: 'Observer',
      price: 'Free',
      priceSub: 'forever',
      desc: 'Get a feel for the data. See where the church stands.',
      featured: false,
      cta: 'Get started free',
      ctaHref: '/beta',
      ctaStyle: 'outline' as const,
      features: [
        { on: true,  text: 'Public statistics & trends' },
        { on: true,  text: 'Entity overview pages' },
        { on: true,  text: 'Research summaries' },
        { on: true,  text: 'Church directory' },
        { on: false, text: 'Full research access' },
        { on: false, text: 'Vitality Check tool' },
        { on: false, text: 'Maps & geographic data' },
        { on: false, text: 'Intelligence briefs' },
      ],
    },
    {
      name: 'Researcher',
      price: 'Coming Soon',
      priceSub: '',
      desc: 'For pastors, leaders and engaged members who want the full picture.',
      featured: true,
      cta: 'Join the waitlist',
      ctaHref: '/beta',
      ctaStyle: 'solid' as const,
      features: [
        { on: true,  text: 'Everything in Observer' },
        { on: true,  text: 'Full living research (208 projects)' },
        { on: true,  text: 'Vitality Check for your church' },
        { on: true,  text: 'Maps & geographic visualisations' },
        { on: true,  text: 'Intelligence briefs' },
        { on: true,  text: 'Contribute & earn recognition' },
        { on: false, text: 'Conference bulk tools' },
      ],
    },
    {
      name: 'Conference',
      price: 'Contact us',
      priceSub: '',
      desc: 'For conferences deploying Pulse across a leadership team.',
      featured: false,
      cta: 'Contact us',
      ctaHref: 'mailto:pulse@adventist.org.au',
      ctaStyle: 'outline' as const,
      features: [
        { on: true,  text: 'Everything in Researcher' },
        { on: true,  text: 'Bulk rollout tools' },
        { on: true,  text: 'Aggregated conference dashboard' },
        { on: true,  text: 'Personnel intelligence tools' },
        { on: true,  text: 'White-label reports' },
        { on: true,  text: 'Priority support' },
        { on: true,  text: 'Claimable via B&E allowance' },
      ],
    },
  ];

  return (
    <div className="min-h-screen -mt-14">

      {/* ── HERO — forced dark, matrix rain ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-[#0D1117]">

        {/* Matrix canvas background */}
        <MatrixCanvasLoader />

        {/* Indigo glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 700, height: 700,
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            zIndex: 1,
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm text-slate-400 border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
            Now tracking {allEntities.length > 0 ? `${allEntities.length}+` : '116+'} entities worldwide
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-3xl" style={{ letterSpacing: '-0.03em' }}>
            The <span className="text-[#6366F1]">Adventist Mission</span>{' '}
            Intelligence Dashboard.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
            Real data about real people for a global mission.<br />
            Because growing comes from knowing.
          </p>

          <div className="flex flex-wrap gap-4 mt-10 justify-center">
            <Link
              href="/beta"
              className="px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-[#6366F1] hover:bg-[#4f46e5] transition-all shadow-[0_0_32px_rgba(99,102,241,0.45)] hover:shadow-[0_0_52px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
            >
              Request Beta Access
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-xl text-base font-semibold text-white border border-white/15 hover:border-white/30 transition-colors"
            >
              See what&apos;s inside →
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-10 mt-16 justify-center">
            {heroStats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-extrabold text-[#6366F1] tabular-nums">{value}</div>
                <div className="text-xs mt-1 uppercase tracking-wider text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={cn('px-6 py-24', tokens.bg.page)}>
        <div className="max-w-5xl mx-auto">
          <p className={cn('text-xs font-bold uppercase tracking-widest text-center mb-3', tokens.text.accent)}>What&apos;s inside</p>
          <h2 className={cn('text-3xl md:text-4xl font-extrabold text-center mb-4', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
            Everything you need to understand the mission
          </h2>
          <p className={cn('text-center max-w-md mx-auto mb-14', tokens.text.body)}>
            From raw baptism stats to deep theological research — all in one place.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className={cn(
                  'rounded-2xl border p-7 transition-all duration-200 hover:-translate-y-1',
                  tokens.bg.card, tokens.border.default,
                  'hover:border-[#6366F1]/40'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] mb-5">
                  {icon}
                </div>
                <h3 className={cn('text-base font-bold mb-2', tokens.text.heading)}>{title}</h3>
                <p className={cn('text-sm leading-relaxed', tokens.text.body)}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={cn('px-6 py-24', tokens.bg.cardAlt)}>
        <div className="max-w-4xl mx-auto">
          <p className={cn('text-xs font-bold uppercase tracking-widest text-center mb-3', tokens.text.accent)}>Pricing</p>
          <h2 className={cn('text-3xl md:text-4xl font-extrabold text-center mb-4', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
            Start free. Go deeper when you&apos;re ready.
          </h2>
          <p className={cn('text-center max-w-sm mx-auto mb-14', tokens.text.body)}>
            No credit card required to get started. Upgrade when the mission demands more.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'relative rounded-2xl border p-8 flex flex-col transition-all hover:-translate-y-1',
                  tier.featured
                    ? 'border-[#6366F1] bg-gradient-to-b from-[#6366F1]/10 to-transparent shadow-[0_0_60px_rgba(99,102,241,0.18)]'
                    : cn(tokens.bg.card, tokens.border.default)
                )}
              >
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white text-[11px] font-bold px-4 py-1 rounded-full tracking-wide uppercase whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className={cn('text-xs font-bold uppercase tracking-widest mb-3', tokens.text.muted)}>{tier.name}</div>
                <div className={cn('text-3xl font-extrabold mb-1', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
                  {tier.price}
                  {tier.priceSub && <span className={cn('text-sm font-normal ml-1', tokens.text.muted)}>{tier.priceSub}</span>}
                </div>
                <p className={cn('text-sm mb-6 pb-6 border-b', tokens.text.body, tokens.border.default)}>{tier.desc}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.text} className={cn('flex items-start gap-2.5 text-sm', f.on ? tokens.text.heading : tokens.text.muted)}>
                      {f.on
                        ? <Check className="w-4 h-4 text-[#6366F1] mt-0.5 shrink-0" />
                        : <Minus className="w-4 h-4 mt-0.5 shrink-0 opacity-40" />
                      }
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={cn(
                    'block text-center py-3 rounded-xl text-sm font-semibold transition-all',
                    tier.ctaStyle === 'solid'
                      ? 'bg-[#6366F1] text-white hover:bg-[#4f46e5]'
                      : cn('border text-white hover:border-white/30', tokens.border.default)
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TAGLINE ── */}
      <section className="px-6 py-28 text-center bg-[#0D1117] border-t border-white/8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
          Growing comes from <span className="text-[#6366F1]">knowing.</span>
        </h2>
        <p className="text-slate-400 text-lg">The pulse of the mission — wherever it&apos;s beating.</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className={cn('px-6 py-10 border-t text-center', tokens.bg.page, tokens.border.default)}>
        <div className="flex flex-wrap gap-6 justify-center mb-4">
          {[
            { label: 'Home', href: '/' },
            { label: 'Features', href: '#features' },
            { label: 'Research', href: '/research' },
            { label: 'Beta Access', href: '/beta' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className={cn('text-sm hover:text-white transition-colors', tokens.text.muted)}>
              {label}
            </Link>
          ))}
        </div>
        <p className={cn('text-xs', tokens.text.muted)}>
          © 2026 Adventist Pulse · South New South Wales Conference
        </p>
      </footer>

    </div>
  );
}

export const metadata = {
  title: 'Adventist Pulse — Mission Intelligence for the Church',
  description: 'Real data. Living research. Honest analysis. The Adventist Mission Intelligence Dashboard.',
};
