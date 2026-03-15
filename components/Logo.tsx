interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { text: 'text-lg', ecg: 'h-4 w-6' },
    md: { text: 'text-2xl', ecg: 'h-5 w-7' },
    lg: { text: 'text-3xl', ecg: 'h-6 w-8' },
  };
  const s = sizes[size];

  return (
    <span className={`inline-flex items-baseline gap-0 font-extrabold ${s.text} ${className}`} style={{ letterSpacing: '-0.02em' }}>
      <span className="text-white dark:text-white text-gray-900" style={{ color: 'inherit' }}>
        Adventist
      </span>
      <svg viewBox="0 0 32 24" fill="none" className={`${s.ecg} self-center mx-[1px]`} aria-hidden="true">
        <polyline
          points="0,14 4,14 8,8 12,20 16,2 20,16 24,10 32,10"
          stroke="#14b8a6"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[#14b8a6]">Pulse</span>
    </span>
  );
}
