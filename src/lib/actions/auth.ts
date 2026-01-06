'use server';

import { removeTokens, setTokens } from '@/lib/utils/cookies';

export async function setAuthTokens(accessToken: string, refreshToken: string) {
  await setTokens(accessToken, refreshToken);
}

// Legacy support - keep for backward compatibility
export async function setAuthToken(token: string) {
  const { setAccessToken } = await import('@/lib/utils/cookies');
  await setAccessToken(token);
}

export async function logout() {
  await removeTokens();
}
