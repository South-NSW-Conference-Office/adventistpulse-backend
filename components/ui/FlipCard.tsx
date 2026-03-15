'use client';

import { ReactNode, useState } from 'react';
import { tokens, cn } from '@/lib/theme';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  clickToFlip?: boolean; // If true, requires click; if false, hover flips
}

export function FlipCard({ front, back, className, clickToFlip = false }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleInteraction = () => {
    if (clickToFlip) {
      setIsFlipped(!isFlipped);
    }
  };

  const containerClasses = cn(
    // Container with perspective for 3D effect
    'group relative h-64 w-full',
    // 3D perspective
    'perspective-1000',
    className
  );

  const innerClasses = cn(
    // Inner container that rotates
    'relative h-full w-full transition-transform duration-600 ease-in-out',
    // 3D transform styles
    'transform-style-preserve-3d',
    // Flip logic - hover or state-based
    clickToFlip 
      ? isFlipped && 'rotate-y-180'
      : 'group-hover:rotate-y-180'
  );

  const faceClasses = cn(
    // Shared face styling - full size, absolute position
    'absolute inset-0 h-full w-full',
    // Hide back faces
    'backface-hidden',
    // Card styling using tokens
    tokens.bg.card,
    tokens.border.default,
    'border rounded-xl p-6',
    // Flex layout for centering content
    'flex flex-col items-center justify-center'
  );

  const backFaceClasses = cn(
    faceClasses,
    // Back face is rotated 180 degrees initially
    'rotate-y-180'
  );

  return (
    <div 
      className={containerClasses}
      onClick={handleInteraction}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={innerClasses}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face */}
        <div 
          className={faceClasses}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        
        {/* Back face */}
        <div 
          className={backFaceClasses}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}