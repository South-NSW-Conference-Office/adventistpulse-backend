import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { BarChart3, BookOpen, Globe2, Users, Shield, Mail } from 'lucide-react';

export const metadata = {
  title: 'About | Adventist Pulse',
  description: 'Adventist Pulse is a mission intelligence platform built to help Seventh-day Adventist leaders understand, measure, and grow the church.',
};

export default function AboutPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-3xl mx-auto px-4 py-16">

        <div className="mb-12">
          <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', tokens.text.accent)}>About</p>
          <h1 className={cn('text-4xl font-extrabold tracking-tight mb-4', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
            Built for the mission
          </h1>
          <p className={cn('text-lg leading-relaxed', tokens.text.body)}>
            Adventist Pulse is a mission intelligence platform developed by the South New South Wales Conference of the Seventh-day Adventist Church. We exist to help leaders at every level — from local church pastor to conference president — understand what&apos;s actually happening in the church and act on it.
          </p>
        </div>

        {/* Why */}
        <div className={cn('rounded-2xl border p-8 mb-8', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-xl font-bold mb-4', tokens.text.heading)}>Why we built this</h2>
          <div className="space-y-4">
            <p className={cn('text-sm leading-relaxed', tokens.text.body)}>
              For too long, the Adventist Church has had a data problem. Statistics exist — buried in the Yearbook, scattered across GC spreadsheets, locked in conference offices. But leaders on the ground rarely see it. Decisions about mission strategy, staffing, and resource allocation are made on instinct rather than evidence.
            </p>
            <p className={cn('text-sm leading-relaxed', tokens.text.body)}>
              Adventist Pulse changes that. We take publicly available denominational data — membership trends, baptism rates, church growth patterns, financial flows — and make it accessible, visual, and actionable. We layer research from 208+ Living Research Projects to turn raw numbers into mission intelligence.
            </p>
            <p className={cn('text-sm leading-relaxed font-medium', tokens.text.heading)}>
              Growing comes from knowing.
            </p>
          </div>
        </div>

        {/* What it is */}
        <h2 className={cn('text-xl font-bold mb-4', tokens.text.heading)}>What Pulse includes</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: BarChart3, title: 'Statistics',      desc: '20+ years of membership, baptism, tithe, and growth data across every conference, union, and division.' },
            { icon: BookOpen,  title: 'Living Research', desc: '208 active research projects synthesising peer-reviewed studies, field data, and denominational reports.' },
            { icon: Globe2,    title: 'Mission Maps',    desc: 'Geographic visualisations of church presence, growth corridors, and unreached territories.' },
            { icon: Users,     title: 'Church Profiles', desc: 'Every local church with profile scores, ministry coverage, and community engagement data.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className={cn('rounded-xl border p-5', tokens.bg.card, tokens.border.default)}>
              <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-[#6366F1]" />
              </div>
              <h3 className={cn('text-sm font-semibold mb-1', tokens.text.heading)}>{title}</h3>
              <p className={cn('text-xs leading-relaxed', tokens.text.muted)}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Data sources */}
        <div className={cn('rounded-2xl border p-8 mb-8', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-xl font-bold mb-4', tokens.text.heading)}>Data sources</h2>
          <ul className="space-y-3">
            {[
              { source: 'GC Office of Archives, Statistics & Research', url: 'https://www.adventiststatistics.org', note: 'Primary source for global statistics' },
              { source: 'Adventist Yearbook', url: 'https://www.adventistyearbook.org', note: 'Historical entity data going back over 100 years' },
              { source: 'ACNC — Australian Charities Register', url: 'https://www.acnc.gov.au', note: 'Australian financial disclosures' },
              { source: 'South Pacific Division', url: 'https://www.spd.adventist.org.au', note: 'Regional strategic data' },
            ].map(({ source, url, note }) => (
              <li key={source} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                <div>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={cn('text-sm font-medium hover:text-[#6366F1] transition-colors', tokens.text.heading)}>{source}</a>
                  <p className={cn('text-xs', tokens.text.muted)}>{note}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Principles */}
        <div className={cn('rounded-2xl border p-8 mb-8', tokens.bg.card, tokens.border.default)}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#6366F1]" />
            <h2 className={cn('text-xl font-bold', tokens.text.heading)}>Our principles</h2>
          </div>
          <ul className="space-y-3">
            {[
              'Data over narrative — we follow the evidence, even when it\'s uncomfortable.',
              'Transparency over spin — every metric is explained, every source cited.',
              'Mission first — the goal is a healthier, more mission-effective church.',
              'No personal family data — only paid workers and assigned roles.',
              'Not an official General Conference product — independently developed.',
            ].map(p => (
              <li key={p} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                <p className={cn('text-sm', tokens.text.body)}>{p}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className={cn('rounded-2xl border p-8 text-center', tokens.bg.card, tokens.border.default)}>
          <Mail className="w-8 h-8 text-[#6366F1] mx-auto mb-3" />
          <h3 className={cn('text-lg font-bold mb-2', tokens.text.heading)}>Get in touch</h3>
          <p className={cn('text-sm mb-4', tokens.text.muted)}>
            Questions about the data, the platform, or how to bring Pulse to your conference?
          </p>
          <a
            href="mailto:pulse@adventist.org.au"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#6366F1] text-white hover:bg-[#4f46e5] transition-colors"
          >
            pulse@adventist.org.au
          </a>
          <p className={cn('text-xs mt-4', tokens.text.muted)}>
            South New South Wales Conference · Seventh-day Adventist Church
          </p>
        </div>

      </div>
    </main>
  );
}
