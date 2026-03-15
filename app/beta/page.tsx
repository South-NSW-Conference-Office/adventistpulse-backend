'use client'

import { useState } from 'react'
import Link from 'next/link'
import { tokens, cn } from '@/lib/theme'
import { ArrowLeft, CheckCircle2, Mail, Globe, Users, BarChart3, Loader2 } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, text: 'Full access to the LRP research library (208 reports)' },
  { icon: Globe,     text: 'Church, conference, union, and division data profiles' },
  { icon: Users,     text: 'Vitality Check — benchmark your church against the denomination' },
  { icon: Mail,      text: 'Board Report Generator — AI-powered, data-grounded' },
]

const CONFERENCES = [
  'South NSW Conference', 'North NSW Conference', 'Greater Sydney Conference',
  'Victorian Conference', 'South Australian Conference', 'South Queensland Conference',
  'West Australian Conference', 'Tasmanian Conference', 'North Australian Conference',
  'New Zealand Pacific Union Conference', 'Other / International',
]

const ROLES = ['Pastor', 'Conference Administrator', 'Church Elder/Leader', 'Member', 'Academic / Researcher', 'Other']

export default function BetaPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', church: '', conference: '', role: '', pastorEmail: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  if (status === 'done') return (
    <main className={cn('min-h-screen flex items-center justify-center', tokens.bg.page)}>
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className={cn('text-2xl font-bold mb-2', tokens.text.heading)}>Request received</h1>
        <p className={cn('text-sm mb-6', tokens.text.muted)}>
          Kyle Morrison will review your request personally. You&apos;ll hear back within 1–2 business days.
        </p>
        <Link href="/" className="text-sm text-indigo-400 hover:underline">← Back to Pulse</Link>
      </div>
    </main>
  )

  return (
    <main className={cn('min-h-screen', tokens.bg.page, tokens.text.heading)}>
      <div className="max-w-2xl mx-auto px-4 py-16">

        <Link href="/" className={cn('inline-flex items-center gap-1.5 text-sm mb-8 hover:underline', tokens.text.muted)}>
          <ArrowLeft className="w-3.5 h-3.5" /> Adventist Pulse
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Now in Beta
          </div>
          <h1 className={cn('text-4xl font-bold mb-3', tokens.text.heading)}>Request Beta Access</h1>
          <p className={cn('text-lg', tokens.text.body)}>
            Mission data intelligence for Adventist leaders. Beta access is limited and personally approved.
          </p>
        </div>

        {/* What you unlock */}
        <div className={cn('rounded-xl p-5 border mb-6', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-xs font-bold uppercase tracking-wide mb-3', tokens.text.muted)}>What beta access unlocks</h2>
          <ul className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                <span className={cn('text-sm', tokens.text.body)}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={cn('rounded-xl p-6 border space-y-4', tokens.bg.card, tokens.border.default)}>
          <h2 className={cn('text-base font-bold mb-1', tokens.text.heading)}>Apply for access</h2>
          <p className={cn('text-xs mb-4', tokens.text.muted)}>Kyle Morrison reviews every request personally. Membership standing may be verified with your pastor.</p>

          <div className="grid grid-cols-2 gap-3">
            {[['firstName','First name'],['lastName','Last name']].map(([k, label]) => (
              <div key={k}>
                <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>{label}</label>
                <input required value={form[k as keyof typeof form]} onChange={set(k)}
                  className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-transparent focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)} />
              </div>
            ))}
          </div>

          <div>
            <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>Email address</label>
            <input required type="email" value={form.email} onChange={set('email')}
              className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-transparent focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)} />
          </div>

          <div>
            <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>Church name</label>
            <input required value={form.church} onChange={set('church')} placeholder="e.g. Canberra National Adventist Church"
              className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-transparent focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>Conference</label>
              <select required value={form.conference} onChange={set('conference')}
                className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-[#1f2b3d] focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)}>
                <option value="">Select…</option>
                {CONFERENCES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>Your role</label>
              <select required value={form.role} onChange={set('role')}
                className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-[#1f2b3d] focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)}>
                <option value="">Select…</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={cn('block text-xs font-medium mb-1', tokens.text.muted)}>
              Pastor&apos;s email <span className="font-normal opacity-60">(optional — speeds up approval)</span>
            </label>
            <input type="email" value={form.pastorEmail} onChange={set('pastorEmail')} placeholder="pastor@church.com"
              className={cn('w-full px-3 py-2 rounded-lg border text-sm bg-transparent focus:outline-none focus:border-indigo-500', tokens.border.default, tokens.text.body)} />
            <p className={cn('text-xs mt-1', tokens.text.muted)}>Your pastor will receive a one-click confirmation email asking if you are a member in good and regular standing.</p>
          </div>

          <button type="submit" disabled={status === 'sending'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-60 mt-2">
            {status === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Mail className="w-4 h-4" /> Request beta access</>}
          </button>

          {status === 'error' && (
            <p className="text-xs text-red-400 text-center">Something went wrong. Email us directly at pulse@adventist.org.au</p>
          )}
        </form>

        <p className={cn('text-sm text-center mt-4', tokens.text.muted)}>
          Already approved?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">Sign in here</Link>
        </p>
      </div>
    </main>
  )
}
