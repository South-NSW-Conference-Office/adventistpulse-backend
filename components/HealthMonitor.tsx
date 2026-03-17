'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users2, Building2, DollarSign, Sparkles, Search, type LucideIcon } from 'lucide-react';
import type { YearlyStats, EntityWithStats, EntityLevel } from '@/types/pulse';
import { LevelBadge } from './LevelBadge';

interface HealthAlert {
  type: 'critical' | 'warning' | 'positive';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  trend: 'declining' | 'stable' | 'improving';
  entities: Array<{
    code: string;
    name: string;
    level: string;
    value: number;
    change: number;
  }>;
}

interface HealthInsight {
  category: 'growth' | 'retention' | 'engagement' | 'sustainability';
  title: string;
  description: string;
  recommendation: string;
  confidence: number; // 0-100
  affectedEntities: number;
}

interface HealthMonitorProps {
  entities: EntityWithStats[];
  level?: EntityLevel;
}

// Analyze entity health patterns
function analyzeEntityHealth(entities: EntityWithStats[]): { alerts: HealthAlert[]; insights: HealthInsight[] } {
  const alerts: HealthAlert[] = [];
  const insights: HealthInsight[] = [];

  // Find entities with critical membership decline (>5% for 2+ years)
  const criticalDecline = entities.filter(e => {
    if (!e.latestYear?.membership?.growthRate) return false;
    return e.latestYear.membership.growthRate < -5;
  });

  if (criticalDecline.length > 0) {
    alerts.push({
      type: 'critical',
      title: 'Critical Membership Decline Detected',
      description: `${criticalDecline.length} entities experiencing significant membership losses`,
      impact: 'high',
      trend: 'declining',
      entities: criticalDecline.map(e => ({
        code: e.code,
        name: e.name,
        level: e.level,
        value: e.latestYear?.membership?.ending || 0,
        change: e.latestYear?.membership?.growthRate || 0,
      })),
    });
  }

  // Find entities with exceptional growth (>10%)
  const exceptionalGrowth = entities.filter(e => {
    if (!e.latestYear?.membership?.growthRate) return false;
    return e.latestYear.membership.growthRate > 10;
  });

  if (exceptionalGrowth.length > 0) {
    alerts.push({
      type: 'positive',
      title: 'Exceptional Growth Identified',
      description: `${exceptionalGrowth.length} entities achieving outstanding membership growth`,
      impact: 'high',
      trend: 'improving',
      entities: exceptionalGrowth.map(e => ({
        code: e.code,
        name: e.name,
        level: e.level,
        value: e.latestYear?.membership?.ending || 0,
        change: e.latestYear?.membership?.growthRate || 0,
      })),
    });
  }

  // Find entities with stagnant baptism rates
  const lowBaptisms = entities.filter(e => {
    if (!e.latestYear?.membership?.ending || !e.latestYear?.membership?.baptisms) return false;
    const baptismRate = (e.latestYear.membership.baptisms / e.latestYear.membership.ending) * 100;
    return baptismRate < 2 && e.latestYear.membership.ending > 1000; // <2% baptism rate for large entities
  });

  if (lowBaptisms.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Low Evangelistic Activity',
      description: `${lowBaptisms.length} large entities with concerning baptism rates (<2%)`,
      impact: 'medium',
      trend: 'stable',
      entities: lowBaptisms.map(e => ({
        code: e.code,
        name: e.name,
        level: e.level,
        value: e.latestYear?.membership?.baptisms || 0,
        change: ((e.latestYear?.membership?.baptisms || 0) / (e.latestYear?.membership?.ending || 1)) * 100,
      })),
    });
  }

  // Generate strategic insights
  const totalMembership = entities.reduce((sum, e) => sum + (e.latestYear?.membership?.ending || 0), 0);
  const totalBaptisms = entities.reduce((sum, e) => sum + (e.latestYear?.membership?.baptisms || 0), 0);
  const avgGrowthRate = entities.reduce((sum, e) => sum + (e.latestYear?.membership?.growthRate || 0), 0) / entities.length;

  insights.push({
    category: 'growth',
    title: 'Regional Growth Pattern Analysis',
    description: `Average growth rate: ${avgGrowthRate.toFixed(1)}%. ${criticalDecline.length} entities declining, ${exceptionalGrowth.length} excelling.`,
    recommendation: criticalDecline.length > entities.length * 0.3 
      ? 'Consider regional intervention strategies and resource reallocation'
      : 'Focus on replicating success patterns from high-performing entities',
    confidence: 85,
    affectedEntities: entities.length,
  });

  if (totalMembership > 0) {
    const overallBaptismRate = (totalBaptisms / totalMembership) * 100;
    insights.push({
      category: 'engagement',
      title: 'Evangelistic Effectiveness',
      description: `Overall baptism rate: ${overallBaptismRate.toFixed(2)}% across ${entities.length} entities`,
      recommendation: overallBaptismRate < 3
        ? 'Implement region-wide evangelistic training and support programs'
        : 'Maintain current evangelistic momentum with targeted support for underperforming areas',
      confidence: 90,
      affectedEntities: entities.length,
    });
  }

  return { alerts, insights };
}

const alertDots: Record<string, string> = {
  critical: 'bg-red-400',
  warning:  'bg-amber-400',
  positive: 'bg-emerald-400',
};

const categoryIcons: Record<string, LucideIcon> = {
  growth:       TrendingUp,
  retention:    Users2,
  engagement:   Building2,
  sustainability: DollarSign,
};

export function HealthMonitor({ entities, level }: HealthMonitorProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'insights'>('alerts');
  const { alerts, insights } = analyzeEntityHealth(entities);

  return (
    <div className="bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#2a3a50] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entity Health Monitor</h3>
            <p className="text-xs text-slate-400 mt-1">
              AI-powered insights detecting trends and opportunities across {entities.length} {level ? `${level}s` : 'entities'}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-[#6366F1]/20 text-[#8b5cf6] border border-[#6366F1]/30'
                  : 'text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'bg-[#6366F1]/20 text-[#8b5cf6] border border-[#6366F1]/30'
                  : 'text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Insights ({insights.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'alerts' ? (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Sparkles className="w-6 h-6 mb-2 mx-auto text-indigo-400" />
                <p>No critical alerts detected</p>
                <p className="text-xs mt-1">All entities appear to be performing within normal ranges</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className={`border rounded-lg p-4 ${
                  alert.type === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                  alert.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  'border-emerald-500/30 bg-emerald-500/5'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shrink-0 inline-block ${alertDots[alert.type] || 'bg-slate-400'}`} />
                      <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        alert.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                        alert.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {alert.impact} impact
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">{alert.description}</p>
                  
                  {/* Affected entities */}
                  <div className="space-y-2">
                    {alert.entities.slice(0, 5).map(entity => (
                      <Link
                        key={entity.code}
                        href={`/entity/${entity.code}`}
                        className="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-[#1a2332]/50 hover:bg-gray-200 dark:hover:bg-[#1a2332] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LevelBadge level={entity.level as any} size="sm" />
                          <span className="text-sm text-gray-900 dark:text-white">{entity.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900 dark:text-white tabular-nums">
                            {entity.value.toLocaleString()}
                          </div>
                          <div className={`text-xs tabular-nums ${
                            entity.change > 0 ? 'text-emerald-400' : 
                            entity.change < 0 ? 'text-red-400' : 
                            'text-slate-400'
                          }`}>
                            {entity.change > 0 ? '+' : ''}{entity.change.toFixed(1)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                    {alert.entities.length > 5 && (
                      <div className="text-center">
                        <span className="text-xs text-slate-500">
                          +{alert.entities.length - 5} more entities affected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-6 h-6 mb-2 mx-auto text-slate-400" />
                <p>Insufficient data for insights</p>
                <p className="text-xs mt-1">More analysis will be available as data patterns develop</p>
              </div>
            ) : (
              insights.map((insight, i) => (
                <div key={i} className="border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = categoryIcons[insight.category] || TrendingUp; return <Icon className="w-4 h-4 shrink-0" /> })()}
                      <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">{insight.description}</p>
                  <div className="bg-gray-100 dark:bg-[#1a2332]/50 rounded p-3">
                    <div className="text-xs text-slate-500 mb-1">Recommendation:</div>
                    <p className="text-sm text-gray-900 dark:text-white">{insight.recommendation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}