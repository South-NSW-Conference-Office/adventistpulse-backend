import fs from 'fs';
import path from 'path';

export interface LRP {
  id: string;
  title: string;
  coreQuestion: string;
  status: string;
  grade: string;
  score: number;
  tags: string[];
  regions: string[];
  sourceCount: number;
  primarySources: number;
  lastUpdated: string;
  confidence: string;
  pulseNotesEnabled: boolean;
  qualityBreakdown: Record<string, number>;
  // Free layer (public, indexed by Google)
  execSummary: string;
  keyFindings: string[];
  references: string[];
  // Scriptural foundation
  bibleReferences: string[];
  // Meta
  file: string;
  bodyLength: number;
  wordCount: number;
}

let _cache: LRP[] | null = null;

export function getAllLRPs(): LRP[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'lrps.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  _cache = JSON.parse(raw) as LRP[];
  return _cache;
}

export function getLRP(id: string): LRP | undefined {
  return getAllLRPs().find(l => l.id === id);
}

export function getLRPsByTag(tag: string): LRP[] {
  return getAllLRPs().filter(l => l.tags.includes(tag));
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const lrp of getAllLRPs()) {
    for (const tag of lrp.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-[#6366F1]';
  if (grade.startsWith('C')) return 'text-yellow-400';
  if (grade.startsWith('D')) return 'text-red-400';
  return 'text-slate-400';
}

export function getGradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/10 border-emerald-500/30';
  if (grade.startsWith('B')) return 'bg-[#6366F1]/10 border-[#6366F1]/30';
  if (grade.startsWith('C')) return 'bg-yellow-500/10 border-yellow-500/30';
  if (grade.startsWith('D')) return 'bg-red-500/10 border-red-500/30';
  return 'bg-slate-500/10 border-slate-500/30';
}

export function getStatusLabel(status: string): { label: string; color: string } {
  const s = status.toLowerCase().replace(/[^a-z_]/g, '');
  switch (s) {
    case 'published': return { label: 'Published', color: 'text-emerald-400' };
    case 'peer_reviewed': return { label: 'Peer Reviewed', color: 'text-[#6366F1]' };
    default: return { label: '', color: '' };
  }
}

export function getEvidenceDepth(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Comprehensive', color: 'text-emerald-400' };    // 🟢
  if (score >= 70) return { label: 'Substantive', color: 'text-yellow-400' };        // 🟡
  if (score >= 50) return { label: 'Developing', color: 'text-red-400' };            // 🔴
  return { label: 'Foundational', color: 'text-gray-900 dark:text-gray-300' };       // ⚫
}

export function getConfidenceBadge(confidence: string): { label: string; color: string } {
  const c = confidence.toLowerCase();
  if (c.includes('high') || c.includes('strong') || c.includes('substantial')) return { label: '🟢 High', color: 'text-emerald-400' };
  if (c.includes('moderate') || c.includes('growing')) return { label: '🟡 Moderate', color: 'text-yellow-400' };
  if (c.includes('low') || c.includes('emerging')) return { label: '🔴 Low', color: 'text-red-400' };
  return { label: confidence || 'Unknown', color: 'text-slate-400' };
}

// Quality breakdown categories with max scores (out of 100 total)
export const QUALITY_CATEGORIES: { key: string; label: string; max: number }[] = [
  { key: 'source_quality', label: 'Source Quality', max: 20 },
  { key: 'source_diversity', label: 'Source Diversity', max: 15 },
  { key: 'geographic_scope', label: 'Geographic Scope', max: 10 },
  { key: 'evidence_density', label: 'Evidence Density', max: 15 },
  { key: 'methodology', label: 'Methodology', max: 15 },
  { key: 'gap_honesty', label: 'Gap Honesty', max: 10 },
  { key: 'competing_viewpoints', label: 'Competing Views', max: 10 },
  { key: 'recency', label: 'Recency', max: 5 },
];
