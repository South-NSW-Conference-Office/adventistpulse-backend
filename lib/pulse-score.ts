// =============================================
// Pulse Score — Composite Health Index (0-100)
// =============================================
// Based on Finn's Church Health Frameworks research:
// NCD (Schwarz), NCLS (Australian), Barna, plus our own derived metrics.
//
// Design: Calculate what we CAN from statistical data. Show gaps.
// The gaps are the product — they drive entities to provide more data.
//
// Inspired by: NCD's 0-100 quality index, but automated from public data
// instead of requiring 30-person congregational surveys.

import type { DerivedMetrics } from './derived';

export interface ScoreComponent {
  category: string;
  weight: number;         // 0-1 (sums to 1.0)
  score: number | null;   // 0-100 or null if not calculable
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '—';
  available: boolean;     // whether we have data for this
  factors: { label: string; value: string; status: 'good' | 'warning' | 'danger' | 'neutral' }[];
  description: string;
}

export interface PulseScore {
  overall: number;                // 0-100 weighted composite
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F' | '—';
  dataCompleteness: number;       // 0-100 what % of the score we can calculate
  components: ScoreComponent[];
  missingData: string[];          // what data is needed for full score
}

function toGrade(score: number | null): 'A' | 'B' | 'C' | 'D' | 'F' | '—' {
  if (score === null) return '—';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

// Normalize a metric to 0-100 using min/max bounds
function norm(value: number | null, min: number, max: number, invert = false): number | null {
  if (value === null) return null;
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
}

export function calculatePulseScore(metrics: DerivedMetrics): PulseScore {
  const components: ScoreComponent[] = [];
  const missingData: string[] = [];

  // ---- 1. Spiritual Vitality (15%) ----
  // Baptism rate + profession of faith = proxy for spiritual vitality
  // Kingdom growth = baptisms + POF (not transfers — those are zero-sum)
  const accessionScore = norm(metrics.accessionRate, 0, 10);  // 10% = perfect
  const efficiencyScore = norm(metrics.accessionEfficiency, 0, 5);
  const formationScore = accessionScore !== null && efficiencyScore !== null
    ? (accessionScore * 0.6 + efficiencyScore * 0.4)
    : accessionScore ?? efficiencyScore;

  components.push({
    category: 'Kingdom Growth',
    weight: 0.15,
    score: formationScore,
    grade: toGrade(formationScore),
    available: formationScore !== null,
    factors: [
      { label: 'Kingdom Growth Rate', value: metrics.accessionRate !== null ? `${metrics.accessionRate.toFixed(1)}%` : '—', status: metrics.accessionRate !== null ? (metrics.accessionRate >= 5 ? 'good' : metrics.accessionRate >= 2 ? 'warning' : 'danger') : 'neutral' },
      { label: 'Accessions per Worker', value: metrics.accessionEfficiency !== null ? `${metrics.accessionEfficiency.toFixed(1)}` : '—', status: metrics.accessionEfficiency !== null ? (metrics.accessionEfficiency >= 3 ? 'good' : metrics.accessionEfficiency >= 1 ? 'warning' : 'danger') : 'neutral' },
    ],
    description: 'Kingdom growth — baptisms + professions of faith (not transfers).',
  });
  if (formationScore === null) missingData.push('Baptism and profession of faith data');

  // ---- 2. Mission Engagement (15%) ----
  const growthScore = norm(metrics.netGrowthRate, -5, 10);
  const organicScore = norm(metrics.organicGrowthRate, 0, 10);
  const missionScore = growthScore !== null && organicScore !== null
    ? (growthScore * 0.5 + organicScore * 0.5)
    : growthScore ?? organicScore;

  components.push({
    category: 'Mission Engagement',
    weight: 0.15,
    score: missionScore,
    grade: toGrade(missionScore),
    available: missionScore !== null,
    factors: [
      { label: 'Net Growth', value: metrics.netGrowthRate !== null ? `${metrics.netGrowthRate > 0 ? '+' : ''}${metrics.netGrowthRate.toFixed(1)}%` : '—', status: metrics.netGrowthRate !== null ? (metrics.netGrowthRate > 2 ? 'good' : metrics.netGrowthRate > 0 ? 'warning' : 'danger') : 'neutral' },
      { label: 'Organic Growth', value: metrics.organicGrowthRate !== null ? `${metrics.organicGrowthRate.toFixed(1)}%` : '—', status: metrics.organicGrowthRate !== null ? (metrics.organicGrowthRate >= 5 ? 'good' : metrics.organicGrowthRate >= 2 ? 'warning' : 'danger') : 'neutral' },
    ],
    description: 'Are we fulfilling the Great Commission? Net growth and organic reach.',
  });
  if (missionScore === null) missingData.push('Growth and accession data');

  // ---- 3. Community Connection / Retention (15%) ----
  const retScore = norm(metrics.retentionRate, 80, 100);
  const dropScore = norm(metrics.dropoutRate, 0, 20, true); // invert: lower dropout = better
  const connectionScore = retScore !== null ? retScore : dropScore;

  components.push({
    category: 'Community Connection',
    weight: 0.15,
    score: connectionScore,
    grade: toGrade(connectionScore),
    available: connectionScore !== null,
    factors: [
      { label: 'Retention Rate', value: metrics.retentionRate !== null ? `${metrics.retentionRate.toFixed(1)}%` : '—', status: metrics.retentionRate !== null ? (metrics.retentionRate >= 98 ? 'good' : metrics.retentionRate >= 95 ? 'warning' : 'danger') : 'neutral' },
      { label: 'Dropout Rate', value: metrics.dropoutRate !== null ? `${metrics.dropoutRate.toFixed(1)}%` : '—', status: metrics.dropoutRate !== null ? (metrics.dropoutRate < 2 ? 'good' : metrics.dropoutRate < 5 ? 'warning' : 'danger') : 'neutral' },
    ],
    description: 'Are members staying connected? Retention and belonging indicators.',
  });
  if (connectionScore === null) missingData.push('Membership gain/loss data');

  // ---- 4. Financial Stewardship (10%) ----
  // Tithe per capita normalized ($0-$5000 USD range) + growth rate
  const titheCapScore = norm(metrics.tithePerCapita, 0, 3000);
  const titheGrowScore = norm(metrics.titheGrowthRate, -10, 20);
  const finScore = titheCapScore !== null && titheGrowScore !== null
    ? (titheCapScore * 0.6 + titheGrowScore * 0.4)
    : titheCapScore ?? titheGrowScore;

  components.push({
    category: 'Financial Stewardship',
    weight: 0.10,
    score: finScore,
    grade: toGrade(finScore),
    available: finScore !== null,
    factors: [
      { label: 'Tithe per Capita', value: metrics.tithePerCapita !== null ? `$${metrics.tithePerCapita.toFixed(0)}` : '—', status: metrics.tithePerCapita !== null ? (metrics.tithePerCapita >= 2000 ? 'good' : metrics.tithePerCapita >= 500 ? 'warning' : 'danger') : 'neutral' },
      { label: 'Tithe Growth', value: metrics.titheGrowthRate !== null ? `${metrics.titheGrowthRate > 0 ? '+' : ''}${metrics.titheGrowthRate.toFixed(1)}%` : '—', status: metrics.titheGrowthRate !== null ? (metrics.titheGrowthRate > 5 ? 'good' : metrics.titheGrowthRate > 0 ? 'warning' : 'danger') : 'neutral' },
    ],
    description: 'Financial health and faithfulness — per capita giving and trends.',
  });
  if (finScore === null) missingData.push('Tithe and financial data');

  // ---- 5. Organizational Health (10%) ----
  const workerScore = norm(metrics.membersPerWorker, 50, 600, true); // lower = better
  const churchSizeScore = norm(metrics.membersPerChurch, 20, 300, false); // moderate is good
  const orgScore = workerScore !== null ? workerScore : null;

  components.push({
    category: 'Organizational Health',
    weight: 0.10,
    score: orgScore,
    grade: toGrade(orgScore),
    available: orgScore !== null,
    factors: [
      { label: 'Members per Worker', value: metrics.membersPerWorker !== null ? `${metrics.membersPerWorker.toFixed(0)}` : '—', status: metrics.membersPerWorker !== null ? (metrics.membersPerWorker <= 200 ? 'good' : metrics.membersPerWorker <= 400 ? 'warning' : 'danger') : 'neutral' },
      { label: 'Avg Church Size', value: metrics.membersPerChurch !== null ? `${metrics.membersPerChurch.toFixed(0)}` : '—', status: 'neutral' },
    ],
    description: 'Workforce capacity and organizational efficiency.',
  });
  if (orgScore === null) missingData.push('Worker and staffing data');

  // ---- 6. Leadership Effectiveness (15%) — NEEDS DATA ----
  components.push({
    category: 'Leadership Effectiveness',
    weight: 0.15,
    score: null,
    grade: '—',
    available: false,
    factors: [
      { label: 'Pastor Tenure', value: '—', status: 'neutral' },
      { label: 'Board Stability', value: '—', status: 'neutral' },
    ],
    description: 'Leadership quality and continuity. Requires personnel data — coming soon via Yearbook scrape.',
  });
  missingData.push('Leadership tenure and personnel data');

  // ---- 7. Worship Vitality (10%) — NEEDS DATA ----
  components.push({
    category: 'Worship Vitality',
    weight: 0.10,
    score: null,
    grade: '—',
    available: false,
    factors: [
      { label: 'Attendance Rate', value: '—', status: 'neutral' },
      { label: 'Age Diversity', value: '—', status: 'neutral' },
    ],
    description: 'Attendance engagement and demographic health. Requires attendance survey data.',
  });
  missingData.push('Attendance and demographic data');

  // ---- 8. Future Readiness (10%) — NEEDS DATA ----
  components.push({
    category: 'Future Readiness',
    weight: 0.10,
    score: null,
    grade: '—',
    available: false,
    factors: [
      { label: 'Youth Retention', value: '—', status: 'neutral' },
      { label: 'Digital Engagement', value: '—', status: 'neutral' },
    ],
    description: 'Preparedness for the future. Requires youth data, digital metrics, and demographic trends.',
  });
  missingData.push('Youth retention and digital engagement data');

  // ---- Calculate overall ----
  let totalWeight = 0;
  let weightedSum = 0;
  let availableWeight = 0;

  for (const comp of components) {
    if (comp.available && comp.score !== null) {
      weightedSum += comp.score * comp.weight;
      totalWeight += comp.weight;
    }
    if (comp.available) {
      availableWeight += comp.weight;
    }
  }

  // Scale to 0-100 based on available components
  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const dataCompleteness = (availableWeight / 1.0) * 100;

  return {
    overall: Math.round(overall * 10) / 10,
    overallGrade: toGrade(overall),
    dataCompleteness: Math.round(dataCompleteness),
    components,
    missingData,
  };
}
