'use client';

import { useState } from 'react';

interface DataSource {
  name: string;
  url: string;
  description: string;
  dataTypes: string[];
  freshness: string;
}

const SOURCES: DataSource[] = [
  {
    name: 'Office of Archives, Statistics & Research (ASTR)',
    url: 'https://adventiststatistics.org',
    description: 'The official statistical arm of the General Conference. Compiles the Annual Statistical Report (ASR) from data submitted by every division.',
    dataTypes: ['Membership', 'Baptisms', 'Churches', 'Workers', 'Tithe', 'Growth rates'],
    freshness: 'Annual — typically 1-2 years behind',
  },
  {
    name: 'Adventist Yearbook',
    url: 'https://adventistyearbook.org',
    description: 'The authoritative directory of every Adventist organizational entity worldwide. Lists leadership, territory, institutions, and contact information.',
    dataTypes: ['Entity hierarchy', 'Leadership', 'Institutions', 'Territory boundaries'],
    freshness: 'Updated annually',
  },
  {
    name: 'ACNC (Australian Charities and Not-for-profits Commission)',
    url: 'https://www.acnc.gov.au',
    description: 'Australian charity regulator. Adventist entities registered as charities must submit annual financial reports.',
    dataTypes: ['Revenue', 'Expenses', 'Staff numbers', 'ABN details'],
    freshness: 'Annual financial reports',
  },
  {
    name: 'Australian Bureau of Statistics (Census)',
    url: 'https://www.abs.gov.au',
    description: 'National census data including religious affiliation. Key source for cross-denominational comparison.',
    dataTypes: ['Religious affiliation', 'Demographics', 'Population'],
    freshness: 'Every 5 years (last: 2021)',
  },
  {
    name: 'AdventistPulse Research Network',
    url: '#',
    description: 'Original research conducted by the Pulse team, including Living Research Projects (LRPs), comparative analysis, and data synthesis.',
    dataTypes: ['Entity insights', 'Comparative analysis', 'Health scores', 'Projections'],
    freshness: 'Ongoing',
  },
];

export function DataSourcesPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        Data Sources
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-[#1a2332] border-l border-gray-200 dark:border-[#2a3a50] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a2332] border-b border-gray-200 dark:border-[#2a3a50] px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Data Sources</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="px-5 py-4 space-y-6">
              <p className="text-xs text-slate-400">
                Adventist Pulse aggregates data from multiple authoritative sources. All data is publicly available. 
                We do not collect, store, or display private information.
              </p>

              {SOURCES.map((source, i) => (
                <div key={i} className="border border-gray-200 dark:border-[#2a3a50] rounded-lg p-4">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-[#14b8a6] transition-colors"
                  >
                    {source.name}
                  </a>
                  <p className="text-xs text-slate-400 mt-1">{source.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {source.dataTypes.map(dt => (
                      <span key={dt} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded">
                        {dt}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2">Freshness: {source.freshness}</p>
                </div>
              ))}

              <div className="border-t border-gray-200 dark:border-[#2a3a50] pt-4">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Data Policy</h3>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• All data sourced from public records</li>
                  <li>• No personal or family information collected</li>
                  <li>• Statistical data only — no individual-level data</li>
                  <li>• Sources attributed on every page</li>
                  <li>• Data may be 1-2 years behind due to reporting cycles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
