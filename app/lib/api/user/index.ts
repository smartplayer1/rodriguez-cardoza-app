import { CreateUserDto, UpdateUserDto } from '../../../type/user';

export const insertUser = async (data: CreateUserDto) => {
return await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
};

  
export const updateUser = async (data: UpdateUserDto) => {
return await fetch(`/api/users`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
} 

export const getUsers = async () => {
return await fetch('/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
};

export const updatePassword = async (userId: string, newPassword: string) => {
  return await fetch(`/api/users/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: userId, password: newPassword }),
  });
}

export const deleteUser = async (userId: string) => {
  return await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json', 
    },
  });
}
