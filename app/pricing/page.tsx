import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { CheckCircle, Users, Church, Building2, Globe2, Lock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Pricing | Adventist Pulse',
  description: 'Three tiers for every level of Adventist leadership — Member, Pastor/Elder, and Conference Admin.',
};

const TIERS = [
  {
    id: 'member',
    name: 'Member',
    badge: 'Free',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: Users,
    tagline: 'For every Seventh-day Adventist',
    price: null,
    priceNote: 'Always free',
    cta: 'Create account',
    ctaHref: '/beta',
    ctaStyle: 'border',
    features: [
      'Browse all conferences, unions & divisions',
      'Membership & baptism trends (last 5 years)',
      'Church finder — all 90,000+ churches',
      'Research library — first 3 findings per study',
      'Mission maps — global church presence',
      'Pulse Briefs — full article access',
    ],
    locked: [
      'Church dashboard & analytics',
      'Peer benchmarking',
      'Full research access',
      'Pastoral toolkit',
    ],
  },
  {
    id: 'pastor',
    name: 'Pastor / Elder',
    badge: 'Coming soon',
    badgeColor: 'bg-[#6366F1]/10 text-[#6366F1]',
    icon: Church,
    tagline: 'For local church leaders',
    price: null,
    priceNote: 'Pricing to be confirmed',
    cta: 'Join waitlist',
    ctaHref: '/beta',
    ctaStyle: 'primary',
    highlight: true,
    features: [
      'Everything in Member',
      'Full research library — all findings & references',
      'Local church dashboard (attendance, trends, health)',
      'Peer benchmarking — compare to similar churches',
      'Baptism pipeline tracking',
      'Youth retention analytics',
      'Sabbath attendance patterns',
      'Ministry coverage map',
      'Pastor: multi-church district overview',
      'Pastor: delegate toolkit access to church elders',
    ],
    note: 'Elder access is identical to Pastor — scoped to one church. Granted by your pastor, not self-assigned.',
    locked: [
      'Conference-wide staffing management',
      'Historical assignment import',
      'Personnel Intelligence',
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    badge: 'Contact us',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: Building2,
    tagline: 'For conference, union & division offices',
    price: null,
    priceNote: 'Territory-based pricing',
    cta: 'Contact us',
    ctaHref: 'mailto:pulse@adventist.org.au',
    ctaStyle: 'border',
    features: [
      'Everything in Pastor / Elder',
      'Conference/union/division admin dashboard',
      'Pastoral staffing — assign & manage all churches',
      'Historical assignment import (CSV/Excel)',
      'Elder delegation management & revocation',
      'Personnel Intelligence — tenure & effectiveness data',
      'Territory-wide analytics & reporting',
      'Access control for all users in your territory',
      'Configurable org levels (no forced conference tier)',
      'Custom level labels (Conference / Region / Field / Section)',
    ],
    note: 'Works at any level: conference, union, or division. Org structure adapts to your territory — if you don\'t have a conference tier, it\'s hidden.',
  },
];

export default function PricingPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', tokens.text.accent)}>Pricing</p>
          <h1 className={cn('text-4xl font-extrabold tracking-tight mb-4', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
            Three tiers. Every level of leadership.
          </h1>
          <p className={cn('text-base max-w-xl mx-auto', tokens.text.muted)}>
            From church member to conference president — Pulse gives every Adventist leader the intelligence they need, at the level they need it.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {TIERS.map(tier => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={cn(
                  'rounded-2xl border flex flex-col',
                  tier.highlight
                    ? 'border-[#6366F1] ring-1 ring-[#6366F1]/30'
                    : tokens.border.default,
                  tokens.bg.card
                )}
              >
                {tier.highlight && (
                  <div className="bg-[#6366F1] text-white text-[10px] font-bold text-center py-1.5 rounded-t-2xl tracking-widest uppercase">
                    Pastor &amp; Elder
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Icon + tier name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', tier.badgeColor)}>
                      {tier.badge}
                    </span>
                  </div>

                  <h2 className={cn('text-lg font-extrabold mb-0.5', tokens.text.heading)}>{tier.name}</h2>
                  <p className={cn('text-xs mb-4', tokens.text.muted)}>{tier.tagline}</p>

                  <div className="mb-5">
                    <p className={cn('text-2xl font-extrabold', tokens.text.heading)}>
                      {tier.price ?? '—'}
                    </p>
                    <p className={cn('text-xs', tokens.text.muted)}>{tier.priceNote}</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={tier.ctaHref}
                    className={cn(
                      'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold mb-6 transition-colors',
                      tier.ctaStyle === 'primary'
                        ? 'bg-[#6366F1] text-white hover:bg-[#4f46e5]'
                        : cn('border', tokens.border.default, tokens.text.body, 'hover:border-[#6366F1]/50')
                    )}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Features */}
                  <div className="space-y-2 flex-1">
                    {tier.features.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className={cn('text-xs', tokens.text.body)}>{f}</span>
                      </div>
                    ))}
                    {tier.locked && tier.locked.map(f => (
                      <div key={f} className="flex items-start gap-2 opacity-40">
                        <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className={cn('text-xs line-through', tokens.text.muted)}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  {tier.note && (
                    <div className={cn('mt-5 pt-4 border-t text-[10px] leading-relaxed', tokens.border.default, tokens.text.muted)}>
                      {tier.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global / Union note */}
        <div className={cn('rounded-2xl border p-6 mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-start gap-4">
            <Globe2 className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className={cn('text-sm font-bold mb-1', tokens.text.heading)}>Designed for the global church</h3>
              <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>
                Not every union has conferences. Some manage churches directly (Norway, small Pacific islands). 
                Some have districts instead of sub-conferences (Philippines, Africa). 
                The Admin tier adapts to your actual structure — the conference layer can be toggled off, 
                level labels are configurable, and territory scope is automatically applied. 
                One product. Every org structure.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <h2 className={cn('text-lg font-bold mb-4', tokens.text.heading)}>Common questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'How does elder access work?',
              a: 'Church elders get the same local church toolkit as pastors — scoped to their one church. The access is granted by the pastor, not self-assigned. Pastors can revoke it at any time, and so can the conference admin.',
            },
            {
              q: 'Our union doesn\'t have conferences — can we still use the Admin tier?',
              a: 'Yes. The conference level is optional and can be toggled off per territory. If you manage churches directly from the union office, you\'ll see your churches without any conference grouping. Norway, some Pacific unions, and other territories already work this way.',
            },
            {
              q: 'Can a pastor with 30+ churches in the Philippines use Pulse?',
              a: 'Absolutely — that\'s a core design constraint. The pastor dashboard handles large districts gracefully: cards for small districts, compact lists for medium, tables for 10+ churches. All data aggregates across the district automatically.',
            },
            {
              q: 'Who controls what elders and pastors can see?',
              a: 'Conference admins assign the pastor role and control which churches are in each pastor\'s district. Pastors then delegate to elders church by church. Conference admins can revoke any access in their territory at any time.',
            },
          ].map(({ q, a }) => (
            <div key={q} className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
              <h3 className={cn('text-sm font-bold mb-2', tokens.text.heading)}>{q}</h3>
              <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>{a}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
