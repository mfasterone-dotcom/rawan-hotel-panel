'use server';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value || null;
  return token;
};

export const getRefreshToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(REFRESH_TOKEN_KEY)?.value || null;
  return token;
};

export const setAccessToken = async (value: string) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_TOKEN_KEY,
    value: value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // سنة واحدة
  });
};

export const setRefreshToken = async (value: string) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: REFRESH_TOKEN_KEY,
    value: value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // سنة واحدة
  });
};

export const setTokens = async (accessToken: string, refreshToken: string) => {
  await setAccessToken(accessToken);
  await setRefreshToken(refreshToken);
};

export const removeTokens = async () => {
  const cookieStore = await cookies();
  // Remove httpOnly cookies
  cookieStore.set({
    name: ACCESS_TOKEN_KEY,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // expires immediately
  });
  cookieStore.set({
    name: REFRESH_TOKEN_KEY,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // expires immediately
  });
  // Also remove non-httpOnly cookies (set by API route)
  cookieStore.set({
    name: 'accessToken',
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // expires immediately
  });
  cookieStore.set({
    name: 'refreshToken',
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // expires immediately
  });
};

// Legacy support - keep for backward compatibility
export const getToken = async () => {
  return getAccessToken();
};

export const setToken = async (value: string) => {
  await setAccessToken(value);
};

export const removeToken = async () => {
  await removeTokens();
};
