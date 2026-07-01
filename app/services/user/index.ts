import { CreateUserDto, UpdateUserDto } from '../../type/user';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const insertUser = async (data: CreateUserDto, context?: ServiceRequestContext) => {
return await fetch(resolveServiceUrl('/api/users', context), {
  method: 'POST',
  headers: createJsonHeaders(context?.cookieHeader),
  body: JSON.stringify(data),
});
};

  
export const updateUser = async (data: UpdateUserDto, context?: ServiceRequestContext) => {
return await fetch(resolveServiceUrl('/api/users', context), {
  method: 'PUT',
  headers: createJsonHeaders(context?.cookieHeader),
  body: JSON.stringify(data),
});
} 

export const getUsers = async (context?: ServiceRequestContext) => {
return await fetch(resolveServiceUrl('/api/users', context), {
  method: 'GET',
  headers: createJsonHeaders(context?.cookieHeader),
});
};

export const updatePassword = async (userId: string, newPassword: string, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/users/change-password', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: userId, password: newPassword }),
  });
}

export const deleteUser = async (userId: string, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl(`/api/users/${userId}`, context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader), 
  });
}
