/* eslint-disable @typescript-eslint/no-explicit-any */
import { useUserStore } from '@/app/store/useUserStore';
import { mapUserFromToken } from '@/app/utils/mapUser';
import { AuthUser } from '@/app/type/user';
import jwt from 'jsonwebtoken';
import {isJwtDecoded} from '@/app/utils/mapUser';

const JWT_SECRET = process.env.JWT_SECRET!;

export const getUserFromToken = (req: any): AuthUser | null => {
  try {
    // 1. Obtener token desde cookies
    const token = req.cookies.get('token')?.value;

    if (!token) return null;

    // 2. Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    return decoded;
  } catch (error) {
    return null;
  }
};



export const initAuth = () => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) return;

 const decoded = jwt.decode(token);

if (!isJwtDecoded(decoded)) return;

const user = mapUserFromToken(decoded);

  useUserStore.getState().setUser(user);
};


