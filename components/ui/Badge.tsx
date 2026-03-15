import { ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variantStyles = {
    success: cn(tokens.bg.success, tokens.text.success, tokens.border.default),
    warning: cn(tokens.bg.warning, tokens.text.warning, tokens.border.default),
    danger: cn(tokens.bg.danger, tokens.text.danger, tokens.border.default),
    accent: cn(tokens.bg.accent, tokens.text.onAccent),
    neutral: cn(tokens.bg.cardAlt, tokens.text.muted, tokens.border.default),
  };

  return (
    <span 
      className={cn(
        // Base badge styling
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        
        // Variant-specific styling
        variantStyles[variant],
        
        // Custom className override
        className
      )}
    >
      {children}
    </span>
  );
}