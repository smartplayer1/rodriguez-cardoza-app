"use client"

import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';
import { Toaster } from 'sonner';

export default function LoginRoute() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/main-menu');
  };

  return (
    <>
      <LoginPage onLoginSuccess={handleLoginSuccess} />
      <Toaster position="top-right" richColors />
    </>
  );
}
