"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WaterBackground from "@/app/components/WaterBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { submitOnboarding, getOnboardingStatus, type OnboardingProfileData } from "@/lib/api/onboarding";
import { ApiError } from "@/lib/api/client";
import CountrySelect from "@/components/ui/CountrySelect";
import { COUNTRIES } from "@/lib/data/countries";
import { getDivisions, getEntityChildren, type EntityOption } from "@/lib/api/entities";

const CHURCH_ROLES = [
  { value: "member",               label: "Church Member" },
  { value: "deacon",               label: "Deacon" },
  { value: "deaconess",            label: "Deaconess" },
  { value: "elder",                label: "Elder" },
  { value: "pastor",               label: "Pastor" },
  { value: "bible_worker",         label: "Bible Worker" },
  { value: "local_church_officer", label: "Local Church Officer" },
  { value: "conference_officer",   label: "Conference Officer" },
  { value: "union_officer",        label: "Union Officer" },
  { value: "division_officer",     label: "Division Officer" },
  { value: "gc_officer",           label: "GC Officer" },
  { value: "other",                label: "Other" },
];

const STEPS = ["Personal & Location", "Church Affiliation", "Role & Purpose"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-wide uppercase">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors appearance-none"
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors resize-none"
    />
  );
}

export default function OnboardingPage() {
  const { user, accessToken, logout } = useAuth();
  const { toast }                     = useToast();
  const router                        = useRouter();

  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  // Form state
  const [phone,            setPhone]            = useState("");
  const [countryCode,      setCountryCode]      = useState("");   // ISO alpha-2
  const [country,          setCountry]          = useState("");   // display name stored to backend
  // Entity IDs (for backend ref)
  const [divisionId,   setDivisionId]   = useState("");
  const [unionId,      setUnionId]      = useState("");
  const [conferenceId, setConferenceId] = useState("");
  // Entity display names (stored to OnboardingProfile as strings)
  const [division,     setDivision]     = useState("");
  const [union,        setUnion]        = useState("");
  const [conference,   setConference]   = useState("");
  // Entity option lists
  const [divisions,    setDivisions]    = useState<EntityOption[]>([]);
  const [unions,       setUnions]       = useState<EntityOption[]>([]);
  const [conferences,  setConferences]  = useState<EntityOption[]>([]);
  const [loadingDiv,   setLoadingDiv]   = useState(false);
  const [loadingUni,   setLoadingUni]   = useState(false);
  const [loadingConf,  setLoadingConf]  = useState(false);
  const [localChurch,      setLocalChurch]      = useState("");
  const [churchRole,       setChurchRole]       = useState("");
  const [roleDescription,  setRoleDescription]  = useState("");
  const [purposeStatement, setPurposeStatement] = useState("");
  const [rejectionReason,  setRejectionReason]  = useState<string | null>(null);

  // Guard: must be logged in with verified email
  useEffect(() => {
    if (!accessToken) { router.replace("/"); return; }
  }, [accessToken, router]);

  // Prefill if user has already submitted (re-application after rejection)
  useEffect(() => {
    if (!accessToken) return;
    getOnboardingStatus(accessToken)
      .then(status => {
        if (status.accountStatus === "approved")         { router.replace("/dashboard"); return; }
        if (status.accountStatus === "pending_approval") { router.replace("/pending-approval"); return; }
        if (status.rejectionReason) setRejectionReason(status.rejectionReason);
        const p = status.profile;
        if (p) {
          // Step 0
          setCountry(p.country ?? "");
          const match = COUNTRIES.find(c => c.name === p.country);
          if (match) setCountryCode(match.code);
          setPhone(p.phone ?? "");
          // Step 1 — restore display names; IDs restored via separate effects once lists load
          setDivision(p.division ?? "");
          setUnion(p.union ?? "");
          setConference(p.conference ?? "");
          if (p.divisionId)   setDivisionId(p.divisionId);
          if (p.unionId)      setUnionId(p.unionId);
          if (p.conferenceId) setConferenceId(p.conferenceId);
          setLocalChurch(p.localChurch ?? "");
          // Step 2
          setChurchRole(p.churchRole ?? "");
          setRoleDescription(p.roleDescription ?? "");
          setPurposeStatement(p.purposeStatement ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, [accessToken, router]);

  // Load divisions on mount
  useEffect(() => {
    setLoadingDiv(true);
    getDivisions()
      .then(setDivisions)
      .catch(() => {})
      .finally(() => setLoadingDiv(false));
  }, []);

  // Load unions when division changes
  useEffect(() => {
    if (!divisionId) { setUnions([]); setUnionId(""); setUnion(""); setConferences([]); setConferenceId(""); setConference(""); return; }
    setLoadingUni(true);
    const div = divisions.find(d => d._id === divisionId);
    if (div) {
      getEntityChildren(div.code)
        .then(setUnions)
        .catch(() => {})
        .finally(() => setLoadingUni(false));
    }
  }, [divisionId, divisions]);

  // Load conferences when union changes — always reset conference selection
  useEffect(() => {
    if (!unionId) { setConferences([]); setConferenceId(""); setConference(""); return; }
    setConferenceId(""); setConference("");
    setLoadingConf(true);
    const uni = unions.find(u => u._id === unionId);
    if (uni) {
      getEntityChildren(uni.code)
        .then(setConferences)
        .catch(() => {})
        .finally(() => setLoadingConf(false));
    }
  }, [unionId, unions]);

  const stepValid = () => {
    if (step === 0) return countryCode.length > 0;
    if (step === 1) return !!(divisionId && unionId && conference.trim() && localChurch.trim());
    if (step === 2) return churchRole && purposeStatement.trim().length >= 20;
    return false;
  };

  const handleNext = () => { if (stepValid()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!accessToken || !stepValid()) return;
    setSubmitting(true);
    const data: OnboardingProfileData = {
      phone:            phone.trim() || null,
      country:          country.trim(),
      division:         division.trim(),
      union:            union.trim(),
      conference:       conference.trim(),
      divisionId:       divisionId || null,
      unionId:          unionId    || null,
      conferenceId:     conferenceId || null,
      localChurch:      localChurch.trim(),
      churchRole,
      roleDescription:  roleDescription.trim() || null,
      purposeStatement: purposeStatement.trim(),
    };
    try {
      await submitOnboarding(accessToken, data);
      router.replace("/pending-approval");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.fromApiError(err, "We couldn't submit your application. Please try again.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => { await logout(); router.replace("/"); };

  if (prefilling) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: "relative" }}>
      <WaterBackground />
      <div className="relative z-10 w-full mx-auto" style={{ maxWidth: 560 }}>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/adventist-logo.png" alt="Adventist Pulse" width={44} height={44} priority />
          <span className="text-[22px] font-bold text-[#1a1a1a] tracking-tight">Adventist Pulse</span>
        </div>

        {/* Rejection notice */}
        {rejectionReason && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-5 py-4 mb-5">
            <p className="text-[13px] font-semibold text-[#991B1B] mb-1">Your previous application was not approved</p>
            <p className="text-[12px] text-[#7F1D1D]">{rejectionReason}</p>
            <p className="text-[12px] text-[#9CA3AF] mt-2">Please update your details and resubmit.</p>
          </div>
        )}

        {/* Card */}
        <div
          className="bg-white rounded-3xl px-8 py-8 flex flex-col gap-6 box-border"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
        >
          {/* Step indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-[20px] font-bold text-[#111]">{STEPS[step]}</h1>
              <span className="text-[12px] text-[#9CA3AF]">Step {step + 1} of {STEPS.length}</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {STEPS.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                  style={{ background: i <= step ? "#111" : "#E5E7EB" }} />
              ))}
            </div>
          </div>

          {/* Step 0 — Personal & Location */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6B7280]">
                Tell us a bit about yourself so we can verify your affiliation with the Seventh-day Adventist Church.
              </p>

              {/* Country first */}
              <CountrySelect
                value={countryCode}
                required
                onChange={(c) => {
                  setCountryCode(c.code);
                  setCountry(c.name);
                  // Dial code is shown as a visual badge — clear any dial-code-only value from the input
                  setPhone(prev => {
                    const stripped = prev.trim();
                    const wasDialCode = COUNTRIES.some(x => stripped === x.dialCode || stripped === x.dialCode + " " || stripped === "");
                    return wasDialCode ? "" : prev;
                  });
                }}
              />

              {/* Phone with dial code prefix badge */}
              <div>
                <FieldLabel>Phone <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></FieldLabel>
                <div className="relative">
                  {countryCode && (() => {
                    const c = COUNTRIES.find(x => x.code === countryCode);
                    return c ? (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-[15px]">{c.flag}</span>
                        <span className="text-[13px] text-[#6B7280] font-medium">{c.dialCode}</span>
                        <span className="text-[#E5E7EB] ml-0.5">|</span>
                      </div>
                    ) : null;
                  })()}
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={countryCode ? "4XX XXX XXX" : "Select a country first"}
                    className="w-full py-3 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    style={{ paddingLeft: countryCode ? (() => {
                      const d = COUNTRIES.find(c => c.code === countryCode)?.dialCode ?? "";
                      return `${48 + d.length * 7}px`;
                    })() : "16px" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Church Affiliation */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6B7280]">
                Select your church organisational details as accurately as possible.
              </p>

              {/* Division */}
              <div>
                <FieldLabel required>Division</FieldLabel>
                <select
                  value={divisionId}
                  onChange={e => {
                    const opt = divisions.find(d => d._id === e.target.value);
                    setDivisionId(e.target.value);
                    setDivision(opt?.name ?? "");
                    setUnionId(""); setUnion("");
                    setConferenceId(""); setConference("");
                  }}
                  disabled={loadingDiv}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors appearance-none disabled:opacity-50"
                >
                  <option value="">{loadingDiv ? "Loading…" : "Select a division…"}</option>
                  {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              {/* Union */}
              <div>
                <FieldLabel required>Union / Union Mission</FieldLabel>
                <select
                  value={unionId}
                  onChange={e => {
                    const opt = unions.find(u => u._id === e.target.value);
                    setUnionId(e.target.value);
                    setUnion(opt?.name ?? "");
                    setConferenceId(""); setConference("");
                  }}
                  disabled={!divisionId || loadingUni}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {!divisionId ? "Select a division first" : loadingUni ? "Loading…" : unions.length === 0 ? "No unions found" : "Select a union…"}
                  </option>
                  {unions.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>

              {/* Conference / Mission — dropdown if data exists, free-text fallback if not */}
              <div>
                <FieldLabel required>Conference / Mission</FieldLabel>
                {!unionId || loadingConf ? (
                  <select
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#9CA3AF] appearance-none opacity-50"
                  >
                    <option>{!unionId ? "Select a union first" : "Loading…"}</option>
                  </select>
                ) : conferences.length > 0 ? (
                  <select
                    value={conferenceId}
                    onChange={e => {
                      const opt = conferences.find(c => c._id === e.target.value);
                      setConferenceId(e.target.value);
                      setConference(opt?.name ?? "");
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors appearance-none"
                  >
                    <option value="">Select a conference…</option>
                    {conferences.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                ) : (
                  /* No conference data for this union — free-text fallback */
                  <div>
                    <input
                      type="text"
                      value={conference}
                      onChange={e => { setConference(e.target.value); setConferenceId(""); }}
                      placeholder="Type your conference or mission name…"
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#111] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    />
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                      We don't have a list for this region yet — please type it in.
                    </p>
                  </div>
                )}
              </div>

              {/* Local Church */}
              <div>
                <FieldLabel required>Local Church</FieldLabel>
                <Input value={localChurch} onChange={setLocalChurch} placeholder="e.g. Wahroonga Seventh-day Adventist Church" />
              </div>
            </div>
          )}

          {/* Step 2 — Role & Purpose */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6B7280]">
                Let us know your role in the church and why you need access to Adventist Pulse.
              </p>
              <div>
                <FieldLabel required>Church Role</FieldLabel>
                <Select value={churchRole} onChange={setChurchRole}
                  options={CHURCH_ROLES} placeholder="Select your role…" />
              </div>
              {(churchRole === "other" || churchRole === "local_church_officer" || churchRole === "conference_officer") && (
                <div>
                  <FieldLabel>Role Description <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></FieldLabel>
                  <Input value={roleDescription} onChange={setRoleDescription} placeholder="Describe your specific role" />
                </div>
              )}
              <div>
                <FieldLabel required>Why do you need access?</FieldLabel>
                <Textarea
                  value={purposeStatement}
                  onChange={setPurposeStatement}
                  placeholder="Please explain how you will use Adventist Pulse and why you need access to this data. Minimum 20 characters."
                  rows={5}
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                  {purposeStatement.length}/1000 characters · minimum 20
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 h-12 rounded-2xl border border-[#E5E7EB] text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!stepValid()}
                className="flex-1 h-12 rounded-2xl text-[14px] font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#111" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!stepValid() || submitting}
                className="flex-1 h-12 rounded-2xl text-[14px] font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#111" }}
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            )}
          </div>
        </div>

        <p className="text-[12px] text-[#9CA3AF] text-center mt-5">
          <button onClick={handleSignOut} className="hover:underline text-[#6B7280]">
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
