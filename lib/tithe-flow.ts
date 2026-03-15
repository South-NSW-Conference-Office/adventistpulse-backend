import path from 'path';
import fs from 'fs';

export interface TitheFlow {
  code: string;
  name: string;
  conference_retention_pct: number;
  union_pct: number;
  division_pct: number;
  gc_pct: number;
  retirement_pct: number;
  special_assistance_fund_pct: number;
  special_funds: string;
  source: string;
}

let cache: TitheFlow[] | null = null;

function loadTitheFlow(): TitheFlow[] {
  if (cache) return cache!;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'tithe-flow.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    cache = data.divisions || [];
    return cache!;
  } catch {
    return [];
  }
}

export function getTitheFlowForDivision(code: string): TitheFlow | null {
  const all = loadTitheFlow();
  return all.find(d => d.code === code) || null;
}

export function getAllTitheFlows(): TitheFlow[] {
  return loadTitheFlow();
}
