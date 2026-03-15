import { ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  accent?: boolean;
}

export function Card({ children, className, hover = false, accent = false }: CardProps) {
  return (
    <div 
      className={cn(
        // Base card styling
        tokens.bg.card,
        tokens.border.default,
        'border rounded-xl p-6',
        
        // Conditional styling
        hover && tokens.bg.cardHover,
        accent && `border-l-4 ${tokens.border.accent}`,
        
        // Custom className override
        className
      )}
    >
      {children}
    </div>
  );
}