const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:5001';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
  errors?: Array<{ field: string; message: string }>;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function refreshToken(): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.json();
}

export async function getProfile(token: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/api/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });
  return response.json();
}

export function setAccessToken(token: string): void {
  document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict`;
}

export function getAccessToken(): string | null {
  const match = document.cookie.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

export function removeAccessToken(): void {
  document.cookie = 'accessToken=; path=/; max-age=0';
}
