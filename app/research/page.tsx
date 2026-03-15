import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { formatDate } from '@/lib/format-date';
import { Microscope, BookOpen, TrendingUp, FileText, Sparkles, BarChart3, Clock } from 'lucide-react';

export const metadata = {
  title: 'Research | Adventist Pulse',
  description: 'Evidence-based research powering every insight on Adventist Pulse — 200+ living research projects on church health, growth, and mission.',
};

interface ResearchPaper {
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
  execSummary: string;
  keyFindings: string[];
  file: string;
  wordCount: number;
}

function getAllResearch(): { research: ResearchPaper[]; totalCount: number } {
  try {
    const researchPath = path.join(process.cwd(), 'public', 'data', 'research-index.json');
    const researchData = JSON.parse(fs.readFileSync(researchPath, 'utf-8'));
    return {
      research: researchData.research || [],
      totalCount: researchData.totalCount || 0
    };
  } catch (error) {
    console.error('Error loading research:', error);
    return { research: [], totalCount: 0 };
  }
}

function getAllTags(research: ResearchPaper[]): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const paper of research) {
    for (const tag of ((Array.isArray(paper.tags) ? paper.tags : []))) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-[#6366F1]';
  if (grade.startsWith('C')) return 'text-yellow-400';
  if (grade.startsWith('D')) return 'text-red-400';
  return 'text-slate-400';
}

function getGradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/10 border-emerald-500/30';
  if (grade.startsWith('B')) return 'bg-[#6366F1]/10 border-[#6366F1]/30';
  if (grade.startsWith('C')) return 'bg-yellow-500/10 border-yellow-500/30';
  if (grade.startsWith('D')) return 'bg-red-500/10 border-red-500/30';
  return 'bg-slate-500/10 border-slate-500/30';
}

function getEvidenceDepth(score: number, status: string): { label: string; color: string } {
  if (status === 'research_note') return { label: 'Research Note', color: 'text-slate-400' };
  if (score >= 85) return { label: 'Comprehensive', color: 'text-emerald-400' };    // 🟢
  if (score >= 70) return { label: 'Substantive', color: 'text-yellow-400' };        // 🟡
  if (score >= 50) return { label: 'Developing', color: 'text-red-400' };            // 🔴
  return { label: 'Foundational', color: 'text-gray-900 dark:text-gray-300' };       // ⚫
}

export default function ResearchPage() {
  const { research, totalCount } = getAllResearch();
  const tags = getAllTags(research);
  
  // Sort research papers - LRPs first (newest first), then fin-research (newest first)
  const sortedResearch = [...research].sort((a, b) => {
    // LRPs first
    const aIsLRP = a.id.startsWith('LRP-');
    const bIsLRP = b.id.startsWith('LRP-');
    
    if (aIsLRP && !bIsLRP) return -1;
    if (!aIsLRP && bIsLRP) return 1;
    
    // Within same type, sort by date (newest first)
    const aDate = new Date(a.lastUpdated || '1900-01-01');
    const bDate = new Date(b.lastUpdated || '1900-01-01');
    return bDate.getTime() - aDate.getTime();
  });
  
  // Featured research — editorially selected (Kyle confirmed 15 Mar 2026)
  const FEATURED_IDS = ['LRP-167', 'LRP-044', 'LRP-065']
  const featured = FEATURED_IDS
    .map(id => sortedResearch.find(r => r.id === id))
    .filter(Boolean) as typeof sortedResearch;
  
  // Recent research notes
  const recentNotes = sortedResearch.filter(r => 
    r.status === 'research_note'
  ).slice(0, 5);
  
  // Top tags for filter
  const topTags = tags.slice(0, 12);

  return (
    <main id="main-content" className="min-h-screen bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Microscope className="w-8 h-8 text-[#6366F1]" />
            <h1 className="text-3xl font-bold tracking-tight">
              Research
            </h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-2xl text-base leading-relaxed">
            Every insight, health score, and recommendation on Adventist Pulse is grounded in evidence. 
            {totalCount > 0 && <> <span className="text-[#6366F1] font-semibold">{totalCount} Living Research Projects</span></> } track 
            the questions that matter most — from membership retention to mission effectiveness — continuously updated as new data emerges.
          </p>
        </div>

        {/* Featured Research */}
        {featured.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6366F1]" />
              Featured Research
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map(paper => {
                const status = getEvidenceDepth(paper.score, paper.status);
                return (
                  <Link
                    key={paper.id}
                    href={`/research/${paper.id}`}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1f2b3d] dark:to-[#253344] border border-[#6366F1]/30 rounded-lg p-5 hover:border-[#6366F1]/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded border flex items-center justify-center ${getGradeBg(paper.grade)}`}>
                        <span className={`text-sm font-bold ${getGradeColor(paper.grade)}`}>{paper.grade}</span>
                      </div>
                      <span className="text-xs font-mono text-[#6366F1]">{paper.id}</span>
                      <span className={`text-xs ${status.color}`}>{status.label}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#6366F1] transition-colors mb-2">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {paper.execSummary || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-slate-500">
                      <span>{(paper.sourceCount ?? 0)} sources</span>
                      <span>•</span>
                      <span>{(paper.wordCount ?? 0).toLocaleString()} words</span>
                      <span>•</span>
                      <span>{formatDate(paper.lastUpdated)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search research papers..."
              className="flex-1 bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
            />
            <select className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#6366F1]">
              <option value="">All Types</option>
              <option value="LRP">Living Research Projects</option>
              <option value="FIN">Research Notes</option>
            </select>
          </div>
          
          {/* Tag filters */}
          <div className="flex flex-wrap gap-2">
            <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#6366F1]/40 text-[#6366F1] bg-[#6366F1]/10">
              All Research ({totalCount})
            </button>
            {topTags.map(({ tag, count }) => (
              <button
                key={tag}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 dark:border-slate-600/40 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500 transition-colors"
              >
                {tag} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Research Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main research list */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {sortedResearch.map(paper => {
                const status = getEvidenceDepth(paper.score, paper.status);
                const isLRP = paper.id.startsWith('LRP-');
                
                return (
                  <Link
                    key={paper.id}
                    href={`/research/${paper.id}`}
                    className="block bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4 hover:border-[#6366F1]/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Grade badge */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded border flex flex-col items-center justify-center ${getGradeBg(paper.grade)}`}>
                        <span className={`text-xs font-bold ${getGradeColor(paper.grade)}`}>{paper.grade || '—'}</span>
                        {paper.score > 0 && (
                          <span className="text-[8px] text-slate-600">{paper.score}</span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#6366F1]">{paper.id}</span>
                          <span className={`text-xs ${status.color}`}>{status.label}</span>
                          {isLRP && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              LRP
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-800 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors mb-2 line-clamp-2">
                          {paper.title}
                        </h3>
                        
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2">
                          {paper.coreQuestion || paper.execSummary || ""}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(((Array.isArray(paper.tags) ? paper.tags : [])) as string[]).slice(0, 4).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 rounded">
                              {tag}
                            </span>
                          ))}
                          {(((Array.isArray(paper.tags) ? paper.tags : [])) as string[]).length > 4 && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-600">+{(((Array.isArray(paper.tags) ? paper.tags : [])) as string[]).length - 4}</span>
                          )}
                        </div>
                        
                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                          <span>{(paper.sourceCount ?? 0)} sources</span>
                          <span>•</span>
                          <span>{(paper.wordCount ?? 0).toLocaleString()} words</span>
                          <span>•</span>
                          <span>{formatDate(paper.lastUpdated)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Research Notes */}
            {recentNotes.length > 0 && (
              <div className="bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6366F1]" />
                  Recent Research Notes
                </h3>
                <div className="space-y-2">
                  {recentNotes.map(note => (
                    <Link
                      key={note.id}
                      href={`/research/${note.id}`}
                      className="block text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <div className="text-[10px] text-gray-400 dark:text-slate-600 mb-1">{formatDate(note.lastUpdated)}</div>
                      <div className="line-clamp-2">{note.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Research Stats */}
            <div className="bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-300 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#6366F1]" />Research Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Total Papers</span>
                  <span className="text-gray-900 dark:text-white">{totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Living Research Projects</span>
                  <span className="text-emerald-400">{research.filter(r => r.id.startsWith('LRP-')).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Research Notes</span>
                  <span className="text-gray-500 dark:text-slate-400">{research.filter(r => r.status === 'research_note').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Research Topics</span>
                  <span className="text-gray-900 dark:text-white">{tags.length}</span>
                </div>
              </div>
            </div>
            
            {/* About Research */}
            <div className="bg-gray-50 dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-300 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#6366F1]" />About Our Research</h3>
              <div className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed space-y-2">
                <p>
                  <strong className="text-gray-800 dark:text-slate-300">Living Research Projects (LRPs)</strong> are comprehensive, 
                  continuously updated analyses of key questions facing the Adventist Church.
                </p>
                <p>
                  <strong className="text-gray-800 dark:text-slate-300">Research Notes</strong> are daily findings and data points 
                  that feed into our larger research projects.
                </p>
                <p>
                  All research is graded for quality and transparency. Higher grades indicate more robust 
                  methodology and evidence density.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center py-8 border border-dashed border-gray-200 dark:border-[#2a3a50] rounded-lg">
          <p className="text-gray-500 dark:text-slate-500 text-sm">
            Interactive research explorer, advanced search, and member research contributions coming soon.
          </p>
          <p className="text-gray-400 dark:text-slate-600 text-xs mt-2">
            This research library grows daily — bookmark us to stay current on church health insights.
          </p>
        </div>
      </div>
    </main>
  );
}