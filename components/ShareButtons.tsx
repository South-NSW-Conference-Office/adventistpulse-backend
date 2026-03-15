'use client';

interface ShareButtonsProps {
  entityName: string;
  entityCode: string;
}

export function ShareButtons({ entityName, entityCode }: ShareButtonsProps) {
  const url = typeof window !== 'undefined' ? window.location.href : `https://adventistpulse.org/entity/${entityCode}`;
  const text = `Check out ${entityName} on Adventist Pulse — church health data and analytics`;

  function copyLink() {
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        title="Copy link"
      >
        
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-2 py-1.5 rounded-lg transition-colors"
        title="Share on X"
      >
        𝕏
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-2 py-1.5 rounded-lg transition-colors"
        title="Share on Facebook"
      >
        f
      </a>
    </div>
  );
}
