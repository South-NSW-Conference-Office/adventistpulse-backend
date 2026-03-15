import { tokens, cn } from '@/lib/theme';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, change, trend, className }: StatCardProps) {
  const trendColor = trend === 'up' 
    ? tokens.text.success 
    : trend === 'down' 
    ? tokens.text.danger 
    : tokens.text.muted;
    
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <Card className={cn('text-center', className)}>
      <div className="space-y-2">
        <p className={cn('text-sm font-medium', tokens.text.label)}>
          {label}
        </p>
        <div className="space-y-1">
          <p className={cn('text-3xl font-bold', tokens.text.heading)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className="flex items-center justify-center space-x-1">
              <span className={cn('text-sm', trendColor)}>
                {trendIcon}
              </span>
              <span className={cn('text-sm font-medium', trendColor)}>
                {change}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}