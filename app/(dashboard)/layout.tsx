"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import { Toaster } from 'sonner';
import { useUserStore } from '@/app/store/useUserStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleLogout = async () => {
    useUserStore.getState().logout();
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Si falla la llamada, igual cerramos la sesión localmente y navegamos a login.
    }
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader 
        onToggleSidebar={toggleSidebar} 
        onLogout={handleLogout} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar 
          expanded={sidebarExpanded} 
          onToggle={toggleSidebar} 
        />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}
