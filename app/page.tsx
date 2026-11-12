import { redirect } from 'next/navigation';

export default function Home() {
  // Sin sesión, el proxy redirige a /login antes de llegar aquí.
  redirect('/main-menu');
}
