import { redirect } from 'next/navigation';
export default function AtRiskPage() {
  redirect('/rankings?level=conference&sort=growthRate&dir=asc');
}
