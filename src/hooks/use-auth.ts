'use client';

import { setAuthTokens } from '@/lib/actions/auth';
import { authAPI } from '@/lib/api/auth';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyForgotPasswordOtpRequest,
  VerifyOtpRequest,
  VerifyRegistrationOtpRequest,
} from '@/lib/types/auth';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await authAPI.login(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Login failed');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async response => {
      // If 2FA is not enabled, login is complete
      if (
        response.data &&
        !response.data.requiresOtp &&
        response.data.accessToken &&
        response.data.refreshToken
      ) {
        await setAuthTokens(response.data.accessToken, response.data.refreshToken);
        router.push('/');
      }
      // If 2FA is enabled, we'll show the OTP form (handled in component)
    },
  });
};

export const useVerifyOtp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await authAPI.verifyOtp(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'OTP verification failed');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async response => {
      if (response.data?.accessToken && response.data?.refreshToken) {
        await setAuthTokens(response.data.accessToken, response.data.refreshToken);
        router.push('/');
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authAPI.register(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Registration failed');
        throw new Error(errorMessage);
      }
      return response;
      // Note: OTP verification will handle token and redirect
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await authAPI.forgotPassword(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to send reset email');
        throw new Error(errorMessage);
      }
      return response;
    },
  });
};

export const useVerifyForgotPasswordOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyForgotPasswordOtpRequest) => {
      const response = await authAPI.verifyForgotPasswordOtp(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'OTP verification failed');
        throw new Error(errorMessage);
      }
      return response;
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await authAPI.resetPassword(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Password reset failed');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      router.push('/login', { locale });
    },
  });
};

export const useVerifyRegistrationOtp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: VerifyRegistrationOtpRequest) => {
      const response = await authAPI.verifyRegistrationOtp(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Registration OTP verification failed');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async response => {
      if (response.data?.accessToken && response.data?.refreshToken) {
        await setAuthTokens(response.data.accessToken, response.data.refreshToken);
        router.push('/');
      }
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const locale = useLocale();

  const handleLogout = async () => {
    const { logout } = await import('@/lib/actions/auth');
    await logout();
    // Clear client-side cookies as well
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
    router.push('/login', { locale });
  };

  return {
    logout: handleLogout,
  };
};
