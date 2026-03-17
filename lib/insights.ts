import path from 'path';
import fs from 'fs';

interface Insight {
  type: string;         // 'context' | 'trend' | 'comparison' | 'challenge' | 'opportunity'
  title: string;
  body: string;
  confidence: string;   // 'verified' | 'estimated' | 'projected'
  source?: string;
}

interface EntityInsight {
  entity_level: string;
  entity_name: string;
  entity_code: string;
  insights: Insight[];
}

let insightsCache: EntityInsight[] | null = null;

function loadInsights(): EntityInsight[] {
  if (insightsCache) return insightsCache;
  try {
    const filePath = path.join(process.cwd(), 'data', 'entity-insights.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    insightsCache = data.insights || [];
    return insightsCache!;
  } catch {
    return [];
  }
}

// Map alternate codes used in insights to canonical entity codes
const CODE_ALIASES: Record<string, string> = {
  'G10001': 'GC',
  'NZP': 'NZPUC',
};

export function getEntityInsights(code: string): Insight[] {
  const all = loadInsights();
  // Try direct match first, then alias
  const alias = CODE_ALIASES[code];
  const entity = all.find(e => e.entity_code === code || e.entity_code === alias);
  return entity?.insights || [];
}
