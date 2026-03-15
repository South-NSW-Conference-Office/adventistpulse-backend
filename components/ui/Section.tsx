import { ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';
import { Badge } from './Badge';

interface SectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ title, subtitle, badge, children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className={cn('text-2xl font-semibold', tokens.text.heading)}>
            {title}
          </h2>
          {badge && <Badge variant="accent">{badge}</Badge>}
        </div>
        {subtitle && (
          <p className={cn('text-lg', tokens.text.body)}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}