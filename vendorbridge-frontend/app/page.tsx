import { redirect } from 'next/navigation';

export default function HomePage() {
  // We want to immediately redirect the root path '/' to '/login'
  redirect('/login');
}
