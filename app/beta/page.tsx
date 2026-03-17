'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tokens, cn } from '@/lib/theme';
import { CheckCircle, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'pastor', label: 'Pastor' },
  { value: 'leader', label: 'Church Leader / Elder' },
  { value: 'admin', label: 'Conference Administrator' },
  { value: 'researcher', label: 'Researcher / Educator' },
  { value: 'member', label: 'Church Member' },
];

export default function BetaPage() {
  const [form, setForm] = useState({ name: '', email: '', role: '', church: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/auth/beta-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            churchCode: form.church || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? data?.message ?? 'Something went wrong');
      }
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

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-16', tokens.bg.page)}>
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-[#6366F1]">⚡ Adventist Pulse</div>
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
              required
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={cn('w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
              placeholder="Pastor James White"
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1', tokens.text.body)}>Email Address</label>
            <input
              required
              type="email"
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
              Church or Conference <span className={cn('font-normal', tokens.text.muted)}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.church}
              onChange={e => setForm(f => ({ ...f, church: e.target.value }))}
              className={cn('w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]', tokens.bg.card, tokens.border.default, tokens.text.body)}
              placeholder="Canberra National Church"
            />
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
