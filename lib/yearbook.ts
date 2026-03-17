import path from 'path';
import fs from 'fs';

export interface YearbookEntity {
  name: string;
  code: string;
  level: string;
  territory?: string;
  churches?: number;
  membership?: number;
  population?: number;
  leadership?: {
    president?: string;
    secretary?: string;
    treasurer?: string;
  };
  children?: YearbookEntity[];
}

let treeCache: any = null;

function loadTree(): any {
  if (treeCache) return treeCache;
  try {
    const filePath = path.join(process.cwd(), 'data', 'yearbook-entity-tree.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    treeCache = JSON.parse(raw);
    return treeCache;
  } catch {
    return null;
  }
}

function findInTree(node: any, code: string): YearbookEntity | null {
  if (node.code === code) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findInTree(child, code);
      if (found) return found;
    }
  }
  return null;
}

export function getYearbookEntity(code: string): YearbookEntity | null {
  const data = loadTree();
  if (!data?.tree) return null;
  return findInTree(data.tree, code);
}
