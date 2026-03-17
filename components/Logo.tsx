import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 140, height: 16 },
  md: { width: 180, height: 21 },
  lg: { width: 240, height: 28 },
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const { width, height } = sizes[size];
  return (
    <>
      {/* Dark mode — white "Adventist" + indigo "Pulse" */}
      <Image
        src="/brand/logo.svg"
        alt="Adventist Pulse"
        width={width}
        height={height}
        className={`hidden dark:block ${className}`}
        priority
      />
      {/* Light mode — dark "Adventist" + indigo "Pulse" */}
      <Image
        src="/brand/logo-light.svg"
        alt="Adventist Pulse"
        width={width}
        height={height}
        className={`block dark:hidden ${className}`}
        priority
      />
    </>
  );
}
