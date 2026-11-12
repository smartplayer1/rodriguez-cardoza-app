"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';
import { Toaster } from 'sonner';
import { useUserStore } from '@/app/store/useUserStore';

export default function LoginRoute() {
  const router = useRouter();
  const status = useUserStore((state) => state.status);

  // Respaldo del lado cliente (p. ej. botón "atrás" del navegador que
  // muestra el login desde caché): si la sesión está validada, salir de aquí.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/main-menu');
    }
  }, [status, router]);

  // replace (no push) para que el login no quede en el historial.
  const handleLoginSuccess = () => {
    router.replace('/main-menu');
  };

  return (
    <>
      <LoginPage onLoginSuccess={handleLoginSuccess} />
      <Toaster position="top-right" richColors />
    </>
  );
}
