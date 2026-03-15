'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[2000] flex flex-col items-center bg-white dark:bg-[#1f2b3d] border border-gray-200 dark:border-[#2a3a50] rounded-2xl shadow-lg overflow-hidden">

      {/* Sun — light mode */}
      <button
        onClick={() => setTheme('light')}
        className={`p-3 transition-colors ${
          theme === 'light'
            ? 'text-yellow-500'
            : 'text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400'
        }`}
        title="Light mode"
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-5 h-px bg-gray-100 dark:bg-[#2a3a50]" />

      {/* Moon — dark mode */}
      <button
        onClick={() => setTheme('dark')}
        className={`p-3 transition-colors ${
          theme === 'dark'
            ? 'text-blue-400'
            : 'text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400'
        }`}
        title="Dark mode"
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>

    </div>
  );
}
