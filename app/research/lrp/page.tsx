import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { ClipboardCheck, BarChart3, Microscope, Sparkles, Target, BookOpen, Globe2, Users, Heart, Scale, RefreshCw, ArrowRight } from 'lucide-react';

const ROOT_QUESTIONS = [
  { id: 'R1', name: 'Mission Effectiveness', iconKey: 'target', description: 'Are we fulfilling the Great Commission? Are people being reached, discipled, and retained?' },
  { id: 'R2', name: 'Institutional Stewardship', iconKey: 'bar-chart', description: 'Are our structures, systems, and resources being managed faithfully and efficiently?' },
  { id: 'R3', name: 'Generational Continuity', iconKey: 'users', description: 'Are we keeping our young people? Is faith being transmitted across generations?' },
  { id: 'R4', name: 'Spiritual Vitality', iconKey: 'heart', description: 'Are members growing spiritually? Is worship meaningful? Is discipleship deepening?' },
  { id: 'R5', name: 'Global Mission Sustainability', iconKey: 'globe', description: 'Can the church sustain and expand its global mission? Are growth patterns healthy worldwide?' },
  { id: 'R6', name: 'Leadership & Governance', iconKey: 'scale', description: 'Are leaders being developed? Is governance transparent, participatory, and effective?' },
  { id: 'R7', name: 'Adaptive Capacity', iconKey: 'refresh', description: 'Can the church adapt to changing contexts without losing its identity and mission?' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  'target': <Target className="w-5 h-5 text-[#14b8a6]" />,
  'bar-chart': <BarChart3 className="w-5 h-5 text-[#14b8a6]" />,
  'users': <Users className="w-5 h-5 text-[#14b8a6]" />,
  'heart': <Heart className="w-5 h-5 text-[#14b8a6]" />,
  'globe': <Globe2 className="w-5 h-5 text-[#14b8a6]" />,
  'scale': <Scale className="w-5 h-5 text-[#14b8a6]" />,
  'refresh': <RefreshCw className="w-5 h-5 text-[#14b8a6]" />,
};

const EXAMPLE_LRPS = [
  {
    id: 'LRP-001',
    title: 'The Comeback — Why Is Gen Z Returning to Church?',
    question: 'What factors are driving measurable increases in Gen Z church attendance after decades of decline?',
    roots: ['R1', 'R3'],
    tags: ['youth-retention', 'generational'],
    grade: 'A-',
    score: 86,
  },
  {
    id: 'LRP-044',
    title: 'Cultural Diversity as Strength and Weakness',
    question: "Migration growth means we're not reaching locals. How do we fix this?",
    roots: ['R1', 'R3', 'R5'],
    tags: ['migration-growth', 'secular-outreach'],
    grade: 'A-',
    score: 86,
  },
  {
    id: 'LRP-070',
    title: 'Composite Church Health Index',
    question: 'Can we build a single, defensible number that captures the health of any Adventist church?',
    roots: ['R1', 'R2', 'R3', 'R4'],
    tags: ['church-health', 'vitality-check'],
    grade: 'A',
    score: 91,
  },
  {
    id: 'LRP-181',
    title: 'Tithe Sharing Formula — How Money Flows Through the System',
    question: 'How does the Adventist tithe distribution formula actually work, and is it equitable?',
    roots: ['R2', 'R7'],
    tags: ['tithe-flow', 'financial'],
    grade: 'B+',
    score: 79,
  },
];

const QUALITY_DIMENSIONS = [
  { label: 'Source Quality', max: 20, example: 18 },
  { label: 'Source Diversity', max: 15, example: 14 },
  { label: 'Geographic Scope', max: 15, example: 12 },
  { label: 'Evidence Density', max: 15, example: 14 },
  { label: 'Methodology', max: 10, example: 8 },
  { label: 'Gap Honesty', max: 10, example: 8 },
  { label: 'Competing Views', max: 10, example: 7 },
  { label: 'Recency', max: 5, example: 5 },
];

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'A': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'A-': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'B-': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', colors[grade] || 'bg-gray-500/20 text-gray-400 border-gray-500/30')}>
      {grade} ({score}/100)
    </span>
  );
}

export default function LRPExplainerPage() {
  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Nav */}
        <div className="mb-12">
          <nav className="text-sm text-gray-400 dark:text-slate-500">
            <Link href="/research" className="text-[#14b8a6] hover:underline">Research</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-600 dark:text-slate-400">Living Research Projects</span>
          </nav>
        </div>

        {/* Hero */}
        <h1 className={cn('text-3xl md:text-4xl font-extrabold tracking-tight mb-3', tokens.text.heading)}>
          Living Research Projects <span className="text-[#14b8a6]">(LRPs)</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-10">
          The research engine behind every AI recommendation, health score, and insight on Adventist Pulse.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { num: '200+', label: 'Research Projects' },
            { num: '100', label: 'Quality Score /100' },
            { num: '7', label: 'Root Questions' },
            { num: 'B−', label: 'Minimum Grade' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-xl p-5 border', tokens.bg.card, tokens.border.default)}>
              <div className="text-2xl md:text-3xl font-extrabold text-[#14b8a6]">{s.num}</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* What is an LRP */}
        <div className="rounded-2xl p-7 mb-10 bg-gradient-to-br from-teal-950/60 to-slate-800/40 border border-teal-500/30">
          <h2 className="text-xl font-bold text-teal-300 mb-3">What is an LRP?</h2>
          <p className="text-gray-300 mb-3">
            A <strong className="text-white">Living Research Project</strong> is a structured, evidence-based document that answers a specific question about church health, growth, or mission. Unlike static academic papers, LRPs are <em>living</em> — continuously updated as new data, studies, and field evidence emerges.
          </p>
          <p className="text-gray-300 mb-3">
            Each LRP connects to the Adventist Pulse scoring engine. When a church takes a Vitality Check, the AI generates specific, <strong className="text-white">citation-backed recommendations</strong> grounded in LRP evidence. But recommendations don&apos;t stop at data — they&apos;re weighted by <strong className="text-white">Scripture</strong> and the <strong className="text-white">Spirit of Prophecy</strong>, ensuring that AI-generated advice reflects Adventist mission and theology, not just statistics.
          </p>
          <p className="text-gray-300">
            Every LRP is open for <strong className="text-white">Pulse Notes</strong> — community feedback and contributions from pastors, church members, and conference leaders. These notes help shape how research is received, challenge assumptions, and surface what&apos;s actually happening on the ground. When an elder in Cairns pushes back on a finding, or a conference secretary adds context from their territory, that contribution drives the thinking for everyone. <strong className="text-white">The more each entity contributes, the more intelligence it receives back.</strong>
          </p>
        </div>

        {/* 7 Root Questions */}
        <h2 className={cn('text-2xl font-bold mb-2', tokens.text.heading)}>The 7 Root Questions</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">
          Every LRP exists to better answer one or more of these core questions about Adventist mission. Together, they define what a healthy, mission-driven church looks like.
        </p>
        <div className="space-y-3 mb-12">
          {ROOT_QUESTIONS.map(rq => (
            <div key={rq.id} className={cn('flex gap-4 rounded-xl p-4 border', tokens.bg.card, tokens.border.default)}>
              <div className="flex-shrink-0 mt-0.5">{ICON_MAP[rq.iconKey]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#14b8a6]">{rq.id}</span>
                  <span className={cn('font-semibold text-sm', tokens.text.heading)}>{rq.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{rq.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Anatomy */}
        <h2 className={cn('text-2xl font-bold mb-6', tokens.text.heading)}>Anatomy of an LRP</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {[
            { icon: <Target className="w-6 h-6 text-[#14b8a6]" />, title: 'Core Question', desc: 'Every LRP answers ONE specific, measurable question about church health or mission.' },
            { icon: <BarChart3 className="w-6 h-6 text-[#14b8a6]" />, title: 'Quality Score', desc: 'Graded 0–100 across 8 dimensions. Only B− or above ships. Full transparency on what we know and don\'t.' },
            { icon: <Microscope className="w-6 h-6 text-[#14b8a6]" />, title: 'Root Questions', desc: 'Maps to one or more of the 7 root questions — the fundamental questions of Adventist mission.' },
            { icon: <BookOpen className="w-6 h-6 text-[#14b8a6]" />, title: 'Evidence-Based', desc: 'Every claim cites sources: peer-reviewed research, denominational data, field reports, and Pulse Notes from the community.' },
          ].map(c => (
            <div key={c.title} className={cn('rounded-xl p-5 border', tokens.bg.card, tokens.border.default)}>
              <div className="mb-2">{c.icon}</div>
              <h3 className={cn('font-semibold text-sm mb-1', tokens.text.heading)}>{c.title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Example LRPs */}
        <h2 className={cn('text-2xl font-bold mb-6', tokens.text.heading)}>Example LRPs</h2>
        <div className="space-y-4 mb-12">
          {EXAMPLE_LRPS.map(lrp => (
            <div key={lrp.id} className={cn('rounded-xl p-5 border-l-[3px] border-l-[#14b8a6] border border-gray-200 dark:border-[#2a3a50]', tokens.bg.card)}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold text-[#14b8a6] tracking-wide">{lrp.id}</span>
                <GradeBadge grade={lrp.grade} score={lrp.score} />
              </div>
              <h3 className={cn('font-semibold mb-1', tokens.text.heading)}>{lrp.title}</h3>
              <p className="text-sm text-teal-400 dark:text-teal-300 italic mb-2">"{lrp.question}"</p>
              <div className="flex flex-wrap gap-2">
                {lrp.roots.map(r => (
                  <span key={r} className="text-[10px] font-bold bg-[#14b8a6]/15 text-[#14b8a6] px-2 py-0.5 rounded-full">{r}</span>
                ))}
                {lrp.tags.map(t => (
                  <span key={t} className="text-[10px] bg-gray-100 dark:bg-[#334155] text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quality Scoring */}
        <h2 className={cn('text-2xl font-bold mb-2', tokens.text.heading)}>Quality Scoring</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">
          Every LRP is graded on 8 dimensions. No project ships below B−. Full transparency on what we know and what we don't.
        </p>
        <div className={cn('rounded-xl p-6 border mb-12', tokens.bg.card, tokens.border.default)}>
          <div className="space-y-3">
            {QUALITY_DIMENSIONS.map(q => (
              <div key={q.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-slate-500 w-32 shrink-0">{q.label}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-[#334155] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#14b8a6]" 
                    style={{ width: `${(q.example / q.max) * 100}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500 w-10 text-right">{q.example}/{q.max}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#334155] flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-slate-400">Total Quality Score</span>
            <span className="text-xl font-extrabold text-[#14b8a6]">86/100 <span className="text-sm font-normal text-gray-400">(A−)</span></span>
          </div>
        </div>

        {/* How LRPs Power the Platform */}
        <h2 className={cn('text-2xl font-bold mb-6', tokens.text.heading)}>How LRPs Power the Platform</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {[
            { icon: <ClipboardCheck className="w-6 h-6 text-[#14b8a6]" />, label: 'Vitality Check', sub: '27 questions' },
            { icon: <BarChart3 className="w-6 h-6 text-[#14b8a6]" />, label: 'Scoring Engine', sub: '5 dimensions' },
            { icon: <Microscope className="w-6 h-6 text-[#14b8a6]" />, label: 'LRP Matching', sub: '200+ projects' },
            { icon: <Sparkles className="w-6 h-6 text-[#14b8a6]" />, label: 'AI Insights', sub: 'Cited recommendations' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className={cn('text-center rounded-xl p-4 border flex flex-col items-center', tokens.bg.card, tokens.border.default)}>
                {step.icon}
                <div className={cn('text-xs font-semibold mt-2', tokens.text.heading)}>{step.label}</div>
                <div className="text-[10px] text-gray-400 dark:text-slate-500">{step.sub}</div>
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 text-[#14b8a6]" />}
            </div>
          ))}
        </div>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">
          When a pastor runs a Vitality Check, scores flow through the engine. Low scores trigger a lookup against relevant LRPs. The AI generates specific, actionable recommendations — each one citing its source. Every recommendation backed by research that helps answer one of the 7 root questions of Adventist mission.
        </p>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#334155] pt-8 text-center">
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            <strong className="text-[#14b8a6]">Adventist Pulse</strong> — The health of every Adventist entity, measured.
          </p>
          <p className="text-gray-400 dark:text-slate-600 text-xs mt-1">
            200+ research projects · 1,229 entities · 13 world divisions · Every recommendation cited
          </p>
        </div>

      </div>
    </main>
  );
}
