export const tokens = {
  bg: {
    page: 'bg-[#F8F9FA] dark:bg-[#1a2332]',
    card: 'bg-white dark:bg-[#1f2b3d]',
    cardHover: 'hover:bg-gray-50 dark:hover:bg-[#253347]',
    cardAlt: 'bg-gray-50 dark:bg-[#162030]',
    accent: 'bg-[#14b8a6]',
    accentHover: 'hover:bg-[#0d9488]',
    accentSoft: 'bg-[#14b8a6]/10',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
  },
  text: {
    heading: 'text-gray-900 dark:text-white',
    body: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-400 dark:text-gray-500',
    accent: 'text-[#14b8a6]',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    onAccent: 'text-white',
    label: 'text-gray-500 dark:text-gray-400',
  },
  border: {
    default: 'border-gray-200 dark:border-[#2a3a50]',
    accent: 'border-[#14b8a6]',
    hover: 'hover:border-[#14b8a6]/50',
  },
  // Traffic light system — these must NEVER clash with accent
  status: {
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      dot: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      dot: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500'
    },
  },
  chart: {
    primary: '#14b8a6',    // indigo — main data line
    secondary: '#22c55e',  // green — comparison/positive
    tertiary: '#ef4444',   // red — negative/population
    quaternary: '#eab308', // yellow — warning
    grid: 'text-gray-200 dark:text-gray-700',
    axis: 'text-gray-400 dark:text-gray-500',
  },
} as const;

/**
 * Helper function to join CSS classes - like clsx
 * Filters out undefined and false values
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}