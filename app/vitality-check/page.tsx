import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { Activity, BarChart3, Users, BookOpen, TrendingUp, MessageSquare, Lock } from 'lucide-react';

export const metadata = {
  title: 'Vitality Check | Adventist Pulse',
  description: 'A diagnostic tool for pastors — understand your church\'s health across 7 mission dimensions.',
};

const DIMENSIONS = [
  { icon: Users,        label: 'Attendance & Engagement',    desc: 'Who\'s actually showing up, and how often?' },
  { icon: TrendingUp,   label: 'Membership Growth',          desc: 'Baptisms, transfers, retention — the full picture.' },
  { icon: BookOpen,     label: 'Discipleship Depth',         desc: 'Sabbath School, small groups, Bible studies.' },
  { icon: Activity,     label: 'Community Presence',         desc: 'How known is your church in its neighbourhood?' },
  { icon: BarChart3,    label: 'Financial Health',           desc: 'Tithe trends, giving per member, sustainability.' },
  { icon: Users,        label: 'Youth Retention',            desc: 'Are the next generation staying? If not, why?' },
  { icon: MessageSquare,label: 'Outreach Activity',          desc: 'Evangelism, reaping series, community events.' },
];

export default function VitalityCheckPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 mb-6">
            <Activity className="w-8 h-8 text-[#6366F1]" />
          </div>
          <h1 className={cn('text-4xl font-extrabold tracking-tight mb-4', tokens.text.heading)} style={{ letterSpacing: '-0.02em' }}>
            Vitality Check
          </h1>
          <p className={cn('text-lg max-w-lg mx-auto', tokens.text.body)}>
            A diagnostic tool for pastors. Answer 35 questions about your church and get an instant health report across 7 mission dimensions — with research-backed recommendations.
          </p>
        </div>

        {/* How it works */}
        <div className={cn('rounded-2xl border p-8 mb-8', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-xl font-bold mb-6', tokens.text.heading)}>How it works</h2>
          <div className="space-y-5">
            {[
              { step: '1', title: 'Answer 35 questions', desc: 'Takes about 10 minutes. Questions cover all 7 dimensions of church health. No right or wrong answers — just honest data.' },
              { step: '2', title: 'Get your score', desc: 'Each dimension scored 0–100. Your overall Vitality Score benchmarks you against similar churches in your conference.' },
              { step: '3', title: 'Read your brief', desc: 'Every low score triggers a lookup against relevant Living Research Projects. You get specific, cited recommendations — not generic advice.' },
              { step: '4', title: 'Track over time', desc: 'Run a Vitality Check every 6 months. Track your church\'s health trajectory. See what\'s improving and what needs attention.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#6366F1]">{step}</span>
                </div>
                <div>
                  <h3 className={cn('text-sm font-semibold mb-0.5', tokens.text.heading)}>{title}</h3>
                  <p className={cn('text-sm', tokens.text.body)}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7 Dimensions */}
        <h2 className={cn('text-xl font-bold mb-4', tokens.text.heading)}>7 Mission Dimensions</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {DIMENSIONS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className={cn('rounded-xl border p-4 flex gap-3', tokens.bg.card, tokens.border.default)}>
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <p className={cn('text-sm font-semibold mb-0.5', tokens.text.heading)}>{label}</p>
                <p className={cn('text-xs', tokens.text.muted)}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gated CTA */}
        <div className={cn('rounded-2xl border p-8 text-center', tokens.bg.card, tokens.border.default)}>
          <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#6366F1]" />
          </div>
          <h3 className={cn('text-xl font-bold mb-2', tokens.text.heading)}>Launching with Researcher tier</h3>
          <p className={cn('text-sm max-w-sm mx-auto mb-6', tokens.text.muted)}>
            The Vitality Check is part of the Researcher tier. Join the waitlist to be first in line when it launches.
          </p>
          <Link
            href="/beta"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white bg-[#6366F1] hover:bg-[#4f46e5] transition-colors"
          >
            Join the waitlist
          </Link>
          <p className={cn('text-xs mt-4', tokens.text.muted)}>
            Already a conference? <Link href="mailto:pulse@adventist.org.au" className="text-[#6366F1] hover:underline">Contact us</Link> about bulk rollout.
          </p>
        </div>
      </div>
    </main>
  );
}
