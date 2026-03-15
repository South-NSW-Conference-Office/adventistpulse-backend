import { ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';
import { Card } from './Card';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({ title, subtitle, actions, children, className }: ChartContainerProps) {
  return (
    <Card className={cn('space-y-6', className)}>
      {/* Chart header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className={cn('text-lg font-semibold', tokens.text.heading)}>
            {title}
          </h3>
          {subtitle && (
            <p className={cn('text-sm', tokens.text.body)}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Optional actions like time range buttons */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Chart content */}
      <div className="h-64 w-full">
        {children}
      </div>
    </Card>
  );
}