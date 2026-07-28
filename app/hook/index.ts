import { useUserStore } from '@/app/store/useUserStore';

export const useAuth = () => {
  const user = useUserStore((state) => state.user);
  const can = useUserStore((state) => state.can);

  return { user, can };
};
