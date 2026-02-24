import axiosInstance from '../api/axios';
import type { LoginResponse, RegisterRequest } from '../types';

export type LoginRequest = {
  email: string;
  password: string;
};

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/api/auth/login', payload);
  return data;
}

export async function registerUser(payload: RegisterRequest): Promise<void> {
  await axiosInstance.post('/api/auth/register', payload);
}
