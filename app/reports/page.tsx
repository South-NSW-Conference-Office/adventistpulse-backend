import { promises as fs } from 'fs';
import path from 'path';
import { PageLayout } from '@/components/ui';
import ReportsClient from '@/components/ReportsClient';

export const metadata = {
  title: 'Reports — Adventist Pulse',
  description: 'Vital Signs, State of Adventism, and Pulse Briefs — data-driven reports on the global Seventh-day Adventist Church.',
};

export default async function ReportsPage() {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'public/data/reports-index.json'),
    'utf-8'
  );
  const data = JSON.parse(raw);
  const { vitalSigns, stateOfAdventism, briefs } = data;

  return (
    <PageLayout title="Reports">
      <ReportsClient vitalSigns={vitalSigns} briefs={briefs} stateOfAdventism={stateOfAdventism} />
    </PageLayout>
  );
}
