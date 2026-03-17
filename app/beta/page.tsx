'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { CheckCircle, Loader2, Church, Search } from 'lucide-react';
import { Logo } from '@/components/Logo';

const ROLES = [
  { value: 'pastor',     label: 'Pastor' },
  { value: 'leader',     label: 'Church Leader / Elder' },
  { value: 'admin',      label: 'Conference Administrator' },
  { value: 'researcher', label: 'Researcher / Educator' },
  { value: 'member',     label: 'Church Member' },
];

interface ChurchResult { code: string; name: string; parentCode?: string }

function ChurchSearch({ value, onChange }: { value: string; onChange: (name: string, code: string) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ChurchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/v1/entities/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        const churches = (data?.data ?? []).filter((e: any) => e.level === 'church');
        setResults(churches);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
  }, [query, apiBase]);

  function select(r: ChurchResult) {
    const displayName = r.name.replace(/\s+(Seventh-day Adventist Church|Adventist Church|Church|SDA)$/i, '');
    setQuery(displayName);
    setOpen(false);
    onChange(displayName, r.code);
  }

  return (
    <div className="relative">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#6366F1]" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        }
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value, ''); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn('w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
          placeholder="Search for your church…"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul className={cn('absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden', tokens.bg.card, tokens.border.default)}>
          {results.map(r => (
            <li key={r.code}>
              <button
                type="button"
                onMouseDown={() => select(r)}
                className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#6366F1]/10 transition-colors')}
              >
                <Church className="w-3.5 h-3.5 text-[#6366F1] flex-shrink-0" />
                <div>
                  <p className={cn('text-sm font-medium', tokens.text.heading)}>
                    {r.name.replace(/\s+(Seventh-day Adventist Church|Adventist Church|SDA)$/i, '')}
                  </p>
                  {r.parentCode && <p className={cn('text-xs', tokens.text.muted)}>{r.parentCode}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BetaPage() {
  const [form, setForm] = useState({ name: '', email: '', role: '', churchName: '', churchCode: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          church: form.churchName || undefined,
          churchCode: form.churchCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? 'Something went wrong');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message ?? 'Could not submit. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center px-4', tokens.bg.page)}>
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h1 className={cn('text-2xl font-bold', tokens.text.heading)}>You&apos;re on the list</h1>
          <p className={cn('text-sm', tokens.text.muted)}>
            We&apos;ll be in touch when your beta access is ready. Keep an eye on your inbox.
          </p>
          <Link href="/" className={cn('inline-block text-sm font-medium', tokens.text.accent)}>
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isPastor = form.role === 'pastor' || form.role === 'leader';

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-16', tokens.bg.page)}>
      <div className="max-w-lg w-full space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1"><Logo size="md" /></div>
          <h1 className={cn('text-2xl font-bold', tokens.text.heading)}>Request Beta Access</h1>
          <p className={cn('text-sm', tokens.text.muted)}>
            Pulse is launching to a select group of pastors and conference leaders first.
            Join the waitlist and we&apos;ll reach out when your spot is ready.
          </p>
        </div>

        {/* What you get */}
        <div className={cn('rounded-xl border p-5 space-y-3', tokens.bg.card, tokens.border.default)}>
          <p className={cn('text-xs font-semibold uppercase tracking-widest', tokens.text.muted)}>Beta members get</p>
          {[
            'Full church & conference intelligence dashboard',
            'Membership trends, baptism rates, youth pipeline data',
            'Peer benchmarking — how does your church compare?',
            'Early access to the Leadership Research Portal',
            'Shape what Pulse becomes — your feedback drives the roadmap',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className={cn('text-sm', tokens.text.body)}>{item}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-1', tokens.text.body)}>Full Name</label>
            <input
              required type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={cn('w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
              placeholder="James White"
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', tokens.text.body)}>Email Address</label>
            <input
              required type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={cn('w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
              placeholder="you@adventist.org.au"
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', tokens.text.body)}>Your Role</label>
            <select
              required
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={cn('w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
            >
              <option value="">Select your role…</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', tokens.text.body)}>
              Your membership church
              <span className={cn('font-normal ml-1', tokens.text.muted)}>(where you&apos;re a member)</span>
            </label>
            <ChurchSearch
              value={form.churchName}
              onChange={(name, code) => setForm(f => ({ ...f, churchName: name, churchCode: code }))}
            />
            {isPastor && (
              <p className={cn('text-xs mt-1.5', tokens.text.muted)}>
                Your pastoral church assignments are configured by your conference — not entered here.
              </p>
            )}
          </div>

          {status === 'error' && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#6366F1] hover:bg-[#4f46e5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'loading' ? 'Submitting…' : 'Request Beta Access'}
          </button>

          <p className={cn('text-xs text-center', tokens.text.muted)}>
            No spam. Just an invite when your access is ready.
          </p>
        </form>
      </div>
    </div>
  );
}
