'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/app/store/useUserStore';

export function StoreHydration() {
  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  return null;
}
