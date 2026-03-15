// Projection engine for entity membership forecasting

export interface ProjectionPoint {
  year: number;
  current: number;
  moderate: number;
  revival: number;
}

export interface ScenarioContext {
  label: string;
  rate: number;
  description: string;       // What this scenario means practically
  actions: string[];          // What would need to happen
  vitalSignsAnchor: string;  // Deep-link anchor for Vital Signs report
}

export interface CriticalMilestone {
  threshold: number;       // e.g. 100, 500, 1000
  year: number;            // when it's reached
  label: string;           // e.g. "Below 100 members"
  yearsFromNow: number;
}

export interface ProjectionResult {
  points5: ProjectionPoint[];
  points20: ProjectionPoint[];
  points50: ProjectionPoint[];
  extinctionYear: number | null;
  milestones: CriticalMilestone[];  // punchy thresholds
  currentRate: number;
  moderateRate: number;
  revivalRate: number;
  scenarios: {
    current: ScenarioContext;
    moderate: ScenarioContext;
    revival: ScenarioContext;
  };
  insights: string[];
}

interface YearStats {
  membership?: number;
  baptisms?: number;
  churches?: number;
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || end <= 0 || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

function project(base: number, rate: number, years: number): number {
  return Math.max(0, Math.round(base * Math.pow(1 + rate, years)));
}

function formatRate(r: number): string {
  return (r >= 0 ? '+' : '') + (r * 100).toFixed(1) + '%';
}

/**
 * Find the best 5-year growth period in the LAST 20 YEARS only (not ancient history)
 */
function recentBestRate(membership: [number, number][]): number | null {
  const cutoff = (membership[membership.length - 1]?.[0] ?? 2024) - 20;
  const recent = membership.filter(([y]) => y >= cutoff);
  let best = -Infinity;
  for (let i = 0; i < recent.length - 5; i++) {
    const [, startMem] = recent[i];
    const [, endMem] = recent[i + 5];
    if (startMem > 0 && endMem > 0) {
      const rate = cagr(startMem, endMem, 5);
      if (rate > best) best = rate;
    }
  }
  return best > -Infinity ? best : null;
}

/**
 * Build scenario context with practical explanations
 */
function buildScenarios(
  currentRate: number,
  moderateRate: number,
  revivalRate: number,
  latestMem: number,
  latestBaptisms: number | null,
  latestChurches: number | null,
): { current: ScenarioContext; moderate: ScenarioContext; revival: ScenarioContext } {

  const annualLoss = currentRate < 0 ? Math.abs(Math.round(latestMem * currentRate)) : 0;
  const currentBapRate = latestBaptisms && latestMem ? latestBaptisms / latestMem : 0;

  // What baptism rate would be needed for each scenario?
  const moderateBapTarget = latestMem ? Math.round(latestMem * Math.max(moderateRate + 0.01, 0.01)) : 0;
  const revivalBapTarget = latestMem ? Math.round(latestMem * Math.max(revivalRate + 0.01, 0.02)) : 0;

  const current: ScenarioContext = {
    label: 'Current Trajectory',
    rate: currentRate,
    vitalSignsAnchor: 'current-trajectory',
    description: currentRate < -0.01
      ? `Continuing to lose ~${annualLoss} members per year with no change in strategy.`
      : currentRate < 0
      ? `Slow decline continues — death and dropout outpace new members.`
      : currentRate < 0.01
      ? `Stagnation — growth barely keeping pace with losses.`
      : `Steady growth continues at ${formatRate(currentRate)} per year.`,
    actions: currentRate < 0
      ? [
          'No intervention — existing patterns continue',
          `Net loss of ~${annualLoss} members annually`,
          'Ageing membership accelerates biological attrition',
        ]
      : ['Current evangelism and retention patterns maintained'],
  };

  const moderate: ScenarioContext = {
    label: 'Moderate Correction',
    rate: moderateRate,
    vitalSignsAnchor: 'moderate-correction',
    description: currentRate < 0
      ? `Decline is halted through targeted retention and modest evangelism growth.`
      : `Growth accelerates through improved retention and outreach.`,
    actions: currentRate < 0
      ? [
          'Reduce annual dropout by 50% through intentional pastoral follow-up',
          'Increase accessions to ~' + moderateBapTarget + '/year (currently ' + (latestBaptisms ?? 'N/A') + ')',
          'Launch 1-2 new outreach initiatives per year',
          'Engage inactive members with re-connection programs',
        ]
      : [
          `Increase accession rate to ${moderateBapTarget}/year`,
          'Strengthen new-member integration (first 12 months critical)',
          'Address the top 3 reasons members leave',
        ],
  };

  const revival: ScenarioContext = {
    label: 'Revival Scenario',
    rate: revivalRate,
    vitalSignsAnchor: 'revival-scenario',
    description: currentRate < 0
      ? `Sustained revival — significant growth through church planting, youth engagement, and community mission.`
      : `Breakthrough growth matching the top-performing entities at this level.`,
    actions: [
      `Accessions reach ${revivalBapTarget}/year through coordinated evangelism`,
      'Plant at least 1 new church or group every 2 years',
      'Youth retention program — 80%+ of Adventist youth stay active',
      'Public evangelism + digital outreach in local language',
      latestChurches && latestChurches < 100
        ? 'Every church runs at least one community-facing program'
        : 'Regional evangelism coordination across churches',
    ],
  };

  return { current, moderate, revival };
}

export function generateProjections(
  stats: Record<string, YearStats>,
  peerAvgGrowthRate?: number,
  divisionAvgGrowthRate?: number,
): ProjectionResult {
  const membership: [number, number][] = [];
  let latestBaptisms: number | null = null;
  let latestChurches: number | null = null;

  for (const [year, s] of Object.entries(stats)) {
    const y = parseInt(year);
    const m = s.membership;
    if (y && m && m > 0) membership.push([y, m]);
  }
  membership.sort((a, b) => a[0] - b[0]);

  if (membership.length < 2) {
    return {
      points5: [], points20: [], points50: [],
      extinctionYear: null,
      milestones: [],
      currentRate: 0, moderateRate: 0, revivalRate: 0,
      scenarios: {
        current: { label: '', rate: 0, description: 'Insufficient data.', actions: [], vitalSignsAnchor: '' },
        moderate: { label: '', rate: 0, description: '', actions: [], vitalSignsAnchor: '' },
        revival: { label: '', rate: 0, description: '', actions: [], vitalSignsAnchor: '' },
      },
      insights: ['Insufficient historical data for projections.'],
    };
  }

  const latestYear = membership[membership.length - 1][0];
  const latestMem = membership[membership.length - 1][1];

  // Get latest baptisms/churches for context
  const latestYearStats = stats[String(latestYear)];
  if (latestYearStats) {
    latestBaptisms = latestYearStats.baptisms ?? null;
    latestChurches = latestYearStats.churches ?? null;
  }

  // Current: last 5 years CAGR
  const recentYears = Math.min(5, membership.length - 1);
  const recentStart = membership[membership.length - 1 - recentYears];
  const currentRate = cagr(recentStart[1], latestMem, recentYears);

  // Moderate: division average growth, or halve the decline, or recent best — whichever is most realistic
  const divAvg = divisionAvgGrowthRate ?? 0.005;
  const halfDecline = currentRate < 0 ? currentRate / 2 : currentRate + 0.01;
  const recentBest = recentBestRate(membership);
  // Pick the middle option — not too optimistic, not too pessimistic
  const moderateCandidates = [halfDecline, divAvg, recentBest ?? halfDecline].sort((a, b) => a - b);
  let moderateRate = moderateCandidates[1]; // median
  // Ensure moderate > current
  if (moderateRate <= currentRate) moderateRate = currentRate + 0.015;

  // Revival: peer top quartile, or best historical period, or moderate + 2%
  const revivalCandidates = [
    peerAvgGrowthRate ?? moderateRate + 0.02,
    recentBest ?? moderateRate + 0.02,
    moderateRate + 0.02,
  ];
  let revivalRate = Math.max(...revivalCandidates);
  // Ensure revival > moderate
  if (revivalRate <= moderateRate) revivalRate = moderateRate + 0.015;
  // Cap revival at reasonable level (no entity grows 10%/yr sustainably)
  revivalRate = Math.min(revivalRate, 0.05);

  // Generate points
  const generate = (years: number): ProjectionPoint[] => {
    const points: ProjectionPoint[] = [];
    for (let y = 1; y <= years; y++) {
      points.push({
        year: latestYear + y,
        current: project(latestMem, currentRate, y),
        moderate: project(latestMem, moderateRate, y),
        revival: project(latestMem, revivalRate, y),
      });
    }
    return points;
  };

  // Extinction year (mathematical zero — often centuries away)
  let extinctionYear: number | null = null;
  if (currentRate < 0 && latestMem > 0) {
    const n = Math.log(1 / latestMem) / Math.log(1 + currentRate);
    extinctionYear = Math.round(latestYear + n);
  }

  // Critical milestones — thresholds that actually mean something
  const milestones: CriticalMilestone[] = [];
  if (currentRate < 0 && latestMem > 0) {
    // Dynamic thresholds based on current size
    const thresholds: { value: number; label: string }[] = [];

    // "Can't fill a church" — below 50
    if (latestMem > 50) thresholds.push({ value: 50, label: "Can't fill a single church" });
    // Below 100 — functionally dead
    if (latestMem > 100) thresholds.push({ value: 100, label: 'Below 100 members' });
    // Below 500 — can't sustain a conference
    if (latestMem > 500) thresholds.push({ value: 500, label: "Can't sustain a conference" });
    // Below 1,000
    if (latestMem > 1000) thresholds.push({ value: 1000, label: 'Below 1,000 members' });
    // Half of current
    if (latestMem > 200) thresholds.push({ value: Math.round(latestMem / 2), label: `Half of today (${Math.round(latestMem / 2).toLocaleString()})` });
    // 10% of current (for large entities)
    if (latestMem > 10000) thresholds.push({ value: Math.round(latestMem * 0.1), label: `90% loss (${Math.round(latestMem * 0.1).toLocaleString()} remaining)` });
    // Below 5,000 for medium entities
    if (latestMem > 5000 && latestMem <= 50000) thresholds.push({ value: 5000, label: 'Below 5,000 members' });
    // Below 10,000 for large entities
    if (latestMem > 10000) thresholds.push({ value: 10000, label: 'Below 10,000 members' });

    for (const t of thresholds) {
      // Solve: latestMem * (1 + rate)^n = threshold
      const n = Math.log(t.value / latestMem) / Math.log(1 + currentRate);
      const year = Math.round(latestYear + n);
      const yearsFromNow = year - latestYear;
      if (yearsFromNow > 0 && yearsFromNow <= 150) {
        milestones.push({ threshold: t.value, year, label: t.label, yearsFromNow });
      }
    }

    // Sort by soonest first
    milestones.sort((a, b) => a.yearsFromNow - b.yearsFromNow);
  }

  // Build scenario context
  const scenarios = buildScenarios(currentRate, moderateRate, revivalRate, latestMem, latestBaptisms, latestChurches);

  // Insights — lead with the punchiest milestone, not extinction
  const insights: string[] = [];
  if (currentRate < -0.02) {
    insights.push(`Losing ${Math.abs(Math.round(currentRate * 100 * 10) / 10)}% annually — critical decline.`);
  } else if (currentRate < 0) {
    insights.push(`Declining at ${Math.abs(Math.round(currentRate * 100 * 10) / 10)}% per year.`);
  } else if (currentRate > 0.03) {
    insights.push(`Strong growth: ${formatRate(currentRate)} annually.`);
  } else if (currentRate > 0) {
    insights.push(`Modest growth: ${formatRate(currentRate)} per year.`);
  }

  // Lead with the most impactful near-term milestone
  if (milestones.length > 0) {
    const nearest = milestones[0];
    insights.push(`${nearest.label} by ${nearest.year} (${nearest.yearsFromNow} years).`);
    // Add a second milestone if it's meaningfully different
    if (milestones.length > 1 && milestones[1].yearsFromNow > nearest.yearsFromNow + 5) {
      insights.push(`${milestones[1].label} by ${milestones[1].year}.`);
    }
  }

  const annualLoss = currentRate < 0 ? Math.round(latestMem * Math.abs(currentRate)) : 0;
  if (annualLoss > 0) {
    insights.push(`Every year of delay costs ~${annualLoss.toLocaleString()} members.`);
  }

  return {
    points5: generate(5),
    points20: generate(20),
    points50: generate(50),
    extinctionYear,
    milestones,
    currentRate, moderateRate, revivalRate,
    scenarios,
    insights,
  };
}
