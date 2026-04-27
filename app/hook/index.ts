export const useAuth = () => {
  const user = useUserStore(); // zustand / context

  const can = (permission: string) => {
    return user?.permissions?.includes(permission);
  };

  return { user, can };
};