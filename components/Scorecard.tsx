import type { DerivedMetrics } from '@/lib/derived';
import { tokens, cn } from '@/lib/theme';
import { Card } from '@/components/ui';

interface ScorecardProps {
  metrics: DerivedMetrics;
  year: number;
}

interface MetricRowProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'danger' | 'neutral';
  description?: string;
}

function MetricRow({ label, value, status, description }: MetricRowProps) {
  const statusColors = {
    good: tokens.text.success,
    warning: tokens.text.warning,
    danger: tokens.text.danger,
    neutral: tokens.text.muted,
  };

  const statusDots = {
    good: tokens.status.green.dot,
    warning: tokens.status.yellow.dot,
    danger: tokens.status.red.dot,
    neutral: 'bg-slate-500',
  };

  return (
    <div className={cn("flex items-center justify-between py-3 border-b", tokens.border.default + '/50')}>
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", statusDots[status])} />
        <div>
          <span className={cn("text-sm", tokens.text.heading)}>{label}</span>
          {description && (
            <p className={cn("text-xs mt-0.5", tokens.text.muted)}>{description}</p>
          )}
        </div>
      </div>
      <span className={cn("text-sm font-medium tabular-nums", statusColors[status])}>
        {value}
      </span>
    </div>
  );
}

function fmtPct(n: number | null): string {
  if (n === null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function fmtRatio(n: number | null): string {
  if (n === null) return '—';
  return n.toFixed(0);
}

function fmtCurrency(n: number | null): string {
  if (n === null) return '—';
  return `$${n.toFixed(0)}`;
}

// Determine health status based on metric value
function retentionStatus(n: number | null): 'good' | 'warning' | 'danger' | 'neutral' {
  if (n === null) return 'neutral';
  if (n >= 98) return 'good';
  if (n >= 95) return 'warning';
  return 'danger';
}

function growthStatus(n: number | null): 'good' | 'warning' | 'danger' | 'neutral' {
  if (n === null) return 'neutral';
  if (n > 2) return 'good';
  if (n > 0) return 'warning';
  return 'danger';
}

function baptismRateStatus(n: number | null): 'good' | 'warning' | 'danger' | 'neutral' {
  if (n === null) return 'neutral';
  if (n >= 5) return 'good';
  if (n >= 2) return 'warning';
  return 'danger';
}

function workloadStatus(n: number | null): 'good' | 'warning' | 'danger' | 'neutral' {
  if (n === null) return 'neutral';
  if (n <= 200) return 'good';
  if (n <= 400) return 'warning';
  return 'danger';
}

export function Scorecard({ metrics, year }: ScorecardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", tokens.text.heading)}>Health Scorecard</h3>
        <span className={cn("text-xs", tokens.text.muted)}>{year}</span>
      </div>

      {/* Retention & Growth */}
      <div className="mb-2">
        <span className={cn("text-xs uppercase tracking-wider", tokens.text.muted)}>Retention & Growth</span>
      </div>
      <MetricRow
        label="Retention Rate"
        value={fmtPct(metrics.retentionRate)}
        status={retentionStatus(metrics.retentionRate)}
        description="Members retained year-over-year"
      />
      <MetricRow
        label="Net Growth"
        value={fmtPct(metrics.netGrowthRate)}
        status={growthStatus(metrics.netGrowthRate)}
        description="Overall membership change"
      />
      <MetricRow
        label="Dropout Rate"
        value={fmtPct(metrics.dropoutRate)}
        status={metrics.dropoutRate !== null ? (metrics.dropoutRate < 2 ? 'good' : metrics.dropoutRate < 5 ? 'warning' : 'danger') : 'neutral'}
        description="Lost to dropped + missing"
      />

      {/* Evangelism */}
      <div className="mt-5 mb-2">
        <span className={cn("text-xs uppercase tracking-wider", tokens.text.muted)}>Evangelism</span>
      </div>
      <MetricRow
        label="Kingdom Growth Rate"
        value={fmtPct(metrics.accessionRate)}
        status={baptismRateStatus(metrics.accessionRate)}
        description="Baptisms + POF per 100 members"
      />
      <MetricRow
        label="Accessions per Worker"
        value={fmtRatio(metrics.accessionEfficiency)}
        status={metrics.accessionEfficiency !== null ? (metrics.accessionEfficiency >= 3 ? 'good' : metrics.accessionEfficiency >= 1 ? 'warning' : 'danger') : 'neutral'}
        description="Worker evangelistic productivity (baptisms + POF)"
      />
      <MetricRow
        label="Loss Rate"
        value={fmtPct(metrics.lossRate)}
        status={metrics.lossRate !== null ? (metrics.lossRate < 3 ? 'good' : metrics.lossRate < 6 ? 'warning' : 'danger') : 'neutral'}
        description="Total losses per 100 members"
      />

      {/* Workforce */}
      <div className="mt-5 mb-2">
        <span className={cn("text-xs uppercase tracking-wider", tokens.text.muted)}>Workforce</span>
      </div>
      <MetricRow
        label="Members per Worker"
        value={fmtRatio(metrics.membersPerWorker)}
        status={workloadStatus(metrics.membersPerWorker)}
        description="Workforce stretch ratio"
      />
      <MetricRow
        label="Members per Church"
        value={fmtRatio(metrics.membersPerChurch)}
        status="neutral"
        description="Average congregation size"
      />

      {/* Financial */}
      <div className="mt-5 mb-2">
        <span className={cn("text-xs uppercase tracking-wider", tokens.text.muted)}>Financial</span>
      </div>
      <MetricRow
        label="Tithe per Capita"
        value={fmtCurrency(metrics.tithePerCapita)}
        status="neutral"
        description="Annual tithe per member (USD)"
      />
      <MetricRow
        label="Tithe Growth"
        value={fmtPct(metrics.titheGrowthRate)}
        status={growthStatus(metrics.titheGrowthRate)}
        description="Year-over-year tithe change"
      />
    </Card>
  );
}
