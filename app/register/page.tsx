import Link from 'next/link';
import { redirect } from 'next/navigation';

// Beta access requests go through the beta page (mailing list flow)
// Full registration opens once beta invites go out
export default function RegisterPage() {
  redirect('/beta');
}
