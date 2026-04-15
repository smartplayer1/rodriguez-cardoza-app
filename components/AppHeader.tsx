"use client"

import React, { useState } from 'react';
import { Menu, LogOut, Settings, User } from 'lucide-react';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onLogout?: () => void;
}

export default function AppHeader({ onToggleSidebar, onLogout }: AppHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentUser = {
    name: 'Juan Perez',
    email: 'juan.perez@rodriguezcardoza.com',
    role: 'Administrador',
    avatar: 'JP'
  };

  return (
    <header className="bg-primary text-primary-foreground elevation-3 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl tracking-wide">RODRIGUEZ CARDOZA</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <div className="text-sm">{currentUser.name}</div>
              <div className="text-xs opacity-80">{currentUser.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">{currentUser.avatar}</span>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-surface rounded elevation-4 overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <span>{currentUser.avatar}</span>
                    </div>
                    <div>
                      <div className="text-foreground">{currentUser.name}</div>
                      <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground">
                    <User size={18} />
                    <span>Mi Perfil</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-foreground">
                    <Settings size={18} />
                    <span>Configuracion</span>
                  </button>
                </div>
                <div className="border-t border-border py-2">
                  <button 
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-destructive"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}