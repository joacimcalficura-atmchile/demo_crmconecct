import { redirect } from 'next/navigation';

// Trigger Vercel redeployment: sync with latest bot fixes
export default function HomePage() {
  redirect('/dashboard');
}
