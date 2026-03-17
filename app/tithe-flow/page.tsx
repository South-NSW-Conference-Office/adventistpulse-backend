export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import { tokens, cn } from '@/lib/theme';
import { TitheFlowClient } from '@/components/TitheFlowClient';

export const metadata = {
  title: 'Tithe Flow | Adventist Pulse',
  description: 'See exactly how your tithe dollar flows through the Adventist organisation — from local church to General Conference.',
};

function loadData() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'tithe-flow.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export default function TitheFlowPage() {
  const data = loadData();

  return (
    <main className={cn('min-h-screen', tokens.bg.page)}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className={cn('text-3xl font-extrabold tracking-tight mb-2', tokens.text.heading)}>
            Where Does Your Tithe Go?
          </h1>
          <p className={cn('text-base max-w-2xl', tokens.text.body)}>
            Every dollar of tithe given in a local church flows through a carefully structured system. 
            Here&apos;s how it works across each division of the global church.
          </p>
        </div>

        {data ? (
          <TitheFlowClient divisions={data.divisions} gcPlan={data.gc_tithe_parity_plan} />
        ) : (
          <div className={cn('rounded-xl p-8 text-center border', tokens.bg.card, tokens.border.default)}>
            <p className={cn(tokens.text.muted)}>Tithe flow data is not available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
