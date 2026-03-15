'use client';

interface Section {
  id: string;
  label: string;
  available: boolean;
}

export function SectionNav({ sections }: { sections: Section[] }) {
  const available = sections.filter(s => s.available);
  if (available.length < 3) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map(section => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
