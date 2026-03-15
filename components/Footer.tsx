import Link from 'next/link';
import Image from 'next/image';
import { DataSourcesPanel } from './DataSourcesPanel';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo size="sm" className="text-gray-900 dark:text-white" />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed">
              Growing comes from knowing. The global church health intelligence platform for the Seventh-day Adventist Church.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-3">Explore</h4>
            <div className="space-y-2">
              <Link href="/rankings" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">Rankings</Link>
              <Link href="/compare" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">Compare</Link>
              <Link href="/at-risk" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">Entities at Risk</Link>
              <Link href="/entity/G10001" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">World Church</Link>
            </div>
          </div>

          {/* Data */}
          <div>
            <h4 className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-3">Data Sources</h4>
            <div className="space-y-2">
              <a href="https://adventiststatistics.org" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">
                Office of Archives, Statistics & Research
              </a>
              <a href="https://adventistyearbook.org" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">
                Adventist Yearbook
              </a>
              <a href="https://www.acnc.gov.au" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white transition-colors">
                ACNC (Australian Charities)
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-[#2a3a50]/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-slate-600">
            © {new Date().getFullYear()} Adventist Pulse · South NSW Conference
          </p>
          <div className="flex items-center gap-3">
            <DataSourcesPanel />
            <p className="text-xs text-gray-400 dark:text-slate-600">
              Not an official General Conference product.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
