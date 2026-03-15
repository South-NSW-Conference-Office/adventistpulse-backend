'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitOnboarding, getOnboardingStatus, type OnboardingProfileData } from '@/lib/api/onboarding';
import { ApiError } from '@/lib/api/client';
import { getDivisions, getEntityChildren, type EntityOption } from '@/lib/api/entities';
import { COUNTRIES } from '@/lib/data/countries';
import { tokens, cn } from '@/lib/theme';

const CHURCH_ROLES = [
  { value: 'member', label: 'Church Member' },
  { value: 'deacon', label: 'Deacon' },
  { value: 'deaconess', label: 'Deaconess' },
  { value: 'elder', label: 'Elder' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'bible_worker', label: 'Bible Worker' },
  { value: 'local_church_officer', label: 'Local Church Officer' },
  { value: 'conference_officer', label: 'Conference Officer' },
  { value: 'union_officer', label: 'Union Officer' },
  { value: 'division_officer', label: 'Division Officer' },
  { value: 'gc_officer', label: 'GC Officer' },
  { value: 'other', label: 'Other' },
];

const STEPS = ['Personal & Location', 'Church Affiliation', 'Role & Purpose'];

const inputCls = cn('w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#6366f1]/40 focus:border-[#6366f1] transition bg-white dark:bg-[#162030] dark:text-white border-gray-200 dark:border-[#2a3a50] placeholder-gray-400 dark:placeholder-gray-600');
const labelCls = 'block text-xs font-medium mb-1.5 text-gray-500 dark:text-gray-400';

export default function OnboardingPage() {
  const { user, accessToken, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [country, setCountry] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [unionId, setUnionId] = useState('');
  const [conferenceId, setConferenceId] = useState('');
  const [division, setDivision] = useState('');
  const [union, setUnion] = useState('');
  const [conference, setConference] = useState('');
  const [divisions, setDivisions] = useState<EntityOption[]>([]);
  const [unions, setUnions] = useState<EntityOption[]>([]);
  const [conferences, setConferences] = useState<EntityOption[]>([]);
  const [loadingDiv, setLoadingDiv] = useState(false);
  const [loadingUni, setLoadingUni] = useState(false);
  const [loadingConf, setLoadingConf] = useState(false);
  const [localChurch, setLocalChurch] = useState('');
  const [churchRole, setChurchRole] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [purposeStatement, setPurposeStatement] = useState('');

  useEffect(() => {
    if (!accessToken) { router.replace('/login'); return; }
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    getOnboardingStatus(accessToken)
      .then(status => {
        if (status.accountStatus === 'approved') { router.replace('/'); return; }
        if (status.accountStatus === 'pending_approval') { router.replace('/pending-approval'); return; }
        if (status.rejectionReason) setRejectionReason(status.rejectionReason);
        const p = status.profile;
        if (p) {
          setCountry(p.country ?? '');
          const match = COUNTRIES.find(c => c.name === p.country);
          if (match) setCountryCode(match.code);
          setPhone(p.phone ?? '');
          setDivision(p.division ?? '');
          setUnion(p.union ?? '');
          setConference(p.conference ?? '');
          if (p.divisionId) setDivisionId(p.divisionId);
          if (p.unionId) setUnionId(p.unionId);
          if (p.conferenceId) setConferenceId(p.conferenceId);
          setLocalChurch(p.localChurch ?? '');
          setChurchRole(p.churchRole ?? '');
          setRoleDescription(p.roleDescription ?? '');
          setPurposeStatement(p.purposeStatement ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, [accessToken, router]);

  useEffect(() => {
    setLoadingDiv(true);
    getDivisions().then(setDivisions).catch(() => {}).finally(() => setLoadingDiv(false));
  }, []);

  useEffect(() => {
    if (!divisionId) { setUnions([]); setUnionId(''); setUnion(''); setConferences([]); setConferenceId(''); setConference(''); return; }
    setLoadingUni(true);
    const div = divisions.find(d => d._id === divisionId);
    if (div) getEntityChildren(div.code).then(setUnions).catch(() => {}).finally(() => setLoadingUni(false));
  }, [divisionId, divisions]);

  useEffect(() => {
    if (!unionId) { setConferences([]); setConferenceId(''); setConference(''); return; }
    setConferenceId(''); setConference('');
    setLoadingConf(true);
    const uni = unions.find(u => u._id === unionId);
    if (uni) getEntityChildren(uni.code).then(setConferences).catch(() => {}).finally(() => setLoadingConf(false));
  }, [unionId, unions]);

  const stepValid = () => {
    if (step === 0) return countryCode.length > 0;
    if (step === 1) return !!(divisionId && unionId && conference.trim() && localChurch.trim());
    if (step === 2) return !!(churchRole && purposeStatement.trim().length >= 20);
    return false;
  };

  const handleSubmit = async () => {
    if (!accessToken || !stepValid()) return;
    setSubmitting(true);
    const data: OnboardingProfileData = {
      phone: phone.trim() || null,
      country: country.trim(),
      division: division.trim(),
      union: union.trim(),
      conference: conference.trim(),
      divisionId: divisionId || null,
      unionId: unionId || null,
      conferenceId: conferenceId || null,
      localChurch: localChurch.trim(),
      churchRole,
      roleDescription: roleDescription.trim() || null,
      purposeStatement: purposeStatement.trim(),
    };
    try {
      await submitOnboarding(accessToken, data);
      router.replace('/pending-approval');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.fromApiError(err, "Couldn't submit your application. Please try again.");
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (prefilling) return null;

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', tokens.bg.page)}>
      <div className="w-full max-w-lg">
        {/* Rejection notice */}
        {rejectionReason && (
          <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4">
            <p className={cn('text-sm font-semibold mb-1', tokens.text.danger)}>Previous application not approved</p>
            <p className="text-xs text-red-600 dark:text-red-400">{rejectionReason}</p>
            <p className={cn('text-xs mt-1', tokens.text.muted)}>Please update your details and resubmit.</p>
          </div>
        )}

        <div className={cn('rounded-2xl border p-8', tokens.bg.card, tokens.border.default)}>
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className={cn('text-xl font-bold', tokens.text.heading)}>{STEPS[step]}</h1>
              <span className={cn('text-xs', tokens.text.muted)}>Step {step + 1} of {STEPS.length}</span>
            </div>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-[#6366f1]' : 'bg-gray-200 dark:bg-gray-700')} />
              ))}
            </div>
          </div>

          {/* Step 0 — Personal & Location */}
          {step === 0 && (
            <div className="space-y-4">
              <p className={cn('text-sm mb-4', tokens.text.muted)}>Tell us a bit about yourself so we can verify your church affiliation.</p>
              <div>
                <label className={labelCls}>Country <span className="text-red-400">*</span></label>
                <select
                  value={countryCode}
                  onChange={e => {
                    const c = COUNTRIES.find(x => x.code === e.target.value);
                    setCountryCode(e.target.value);
                    setCountry(c?.name ?? '');
                  }}
                  required
                  className={inputCls}
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Phone (optional)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 1 — Church Affiliation */}
          {step === 1 && (
            <div className="space-y-4">
              <p className={cn('text-sm mb-4', tokens.text.muted)}>Select your church organisational details as accurately as possible.</p>
              <div>
                <label className={labelCls}>Division <span className="text-red-400">*</span></label>
                <select value={divisionId} onChange={e => { const o = divisions.find(d => d._id === e.target.value); setDivisionId(e.target.value); setDivision(o?.name ?? ''); setUnionId(''); setUnion(''); setConferenceId(''); setConference(''); }} disabled={loadingDiv} className={inputCls}>
                  <option value="">{loadingDiv ? 'Loading…' : 'Select a division…'}</option>
                  {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Union / Union Mission <span className="text-red-400">*</span></label>
                <select value={unionId} onChange={e => { const o = unions.find(u => u._id === e.target.value); setUnionId(e.target.value); setUnion(o?.name ?? ''); setConferenceId(''); setConference(''); }} disabled={!divisionId || loadingUni} className={inputCls}>
                  <option value="">{!divisionId ? 'Select a division first' : loadingUni ? 'Loading…' : 'Select a union…'}</option>
                  {unions.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Conference / Mission <span className="text-red-400">*</span></label>
                {conferences.length > 0 ? (
                  <select value={conferenceId} onChange={e => { const o = conferences.find(c => c._id === e.target.value); setConferenceId(e.target.value); setConference(o?.name ?? ''); }} className={inputCls}>
                    <option value="">Select a conference…</option>
                    {conferences.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input type="text" value={conference} onChange={e => { setConference(e.target.value); setConferenceId(''); }} placeholder={!unionId ? 'Select a union first' : 'Type your conference name…'} disabled={!unionId} className={inputCls} />
                )}
              </div>
              <div>
                <label className={labelCls}>Local Church <span className="text-red-400">*</span></label>
                <input type="text" value={localChurch} onChange={e => setLocalChurch(e.target.value)} placeholder="e.g. Wahroonga Seventh-day Adventist Church" className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 2 — Role & Purpose */}
          {step === 2 && (
            <div className="space-y-4">
              <p className={cn('text-sm mb-4', tokens.text.muted)}>Tell us your role and why you need access to Adventist Pulse.</p>
              <div>
                <label className={labelCls}>Church Role <span className="text-red-400">*</span></label>
                <select value={churchRole} onChange={e => setChurchRole(e.target.value)} className={inputCls}>
                  <option value="">Select your role…</option>
                  {CHURCH_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {['other', 'local_church_officer', 'conference_officer'].includes(churchRole) && (
                <div>
                  <label className={labelCls}>Role Description (optional)</label>
                  <input type="text" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} placeholder="Describe your specific role" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Why do you need access? <span className="text-red-400">*</span></label>
                <textarea value={purposeStatement} onChange={e => setPurposeStatement(e.target.value)} rows={5} placeholder="Explain how you will use Adventist Pulse and why you need access to this data. Minimum 20 characters." className={cn(inputCls, 'resize-none')} />
                <p className={cn('text-xs mt-1', tokens.text.muted)}>{purposeStatement.length}/1000 · minimum 20</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className={cn('flex-1 h-11 rounded-full border text-sm font-semibold transition-colors', tokens.border.default, tokens.text.body, 'hover:bg-gray-100 dark:hover:bg-[#253344]')}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => stepValid() && setStep(s => s + 1)} disabled={!stepValid()} className={cn('flex-1 h-11 rounded-full text-sm font-semibold text-white disabled:opacity-40', tokens.bg.accent)}>
                Continue
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!stepValid() || submitting} className={cn('flex-1 h-11 rounded-full text-sm font-semibold text-white disabled:opacity-40', tokens.bg.accent)}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            )}
          </div>
        </div>

        <p className={cn('text-center text-xs mt-4', tokens.text.muted)}>
          <button onClick={async () => { await logout(); router.replace('/'); }} className="hover:underline">Sign out</button>
        </p>
      </div>
    </div>
  );
}
