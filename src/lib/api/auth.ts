

import type {
  AuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyForgotPasswordOtpRequest,
  VerifyForgotPasswordOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyRegistrationOtpRequest,
  VerifyRegistrationOtpResponse,
} from '@/lib/types/auth';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const authAPI = {
  login: async (data: LoginRequest) => {
    return callAPI<LoginResponse>('POST', `/api/${LANG}/auth/login`, data);
  },

  register: async (data: RegisterRequest) => {
    return callAPI<AuthResponse>('POST', `/api/${LANG}/auth/register`, data);
  },

  verifyOtp: async (data: VerifyOtpRequest) => {
    return callAPI<VerifyOtpResponse>('POST', `/api/${LANG}/auth/verify-otp`, data);
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    return callAPI<ForgotPasswordResponse>(
      'POST',
      `/api/${LANG}/forgotpassword/forgot-password`,
      data,
    );
  },

  verifyForgotPasswordOtp: async (data: VerifyForgotPasswordOtpRequest) => {
    return callAPI<VerifyForgotPasswordOtpResponse>(
      'POST',
      `/api/${LANG}/forgotpassword/verify-forgot-password-otp`,
      data,
    );
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    return callAPI<ResetPasswordResponse>(
      'POST',
      `/api/${LANG}/forgotpassword/reset-password`,
      data,
    );
  },

  verifyRegistrationOtp: async (data: VerifyRegistrationOtpRequest) => {
    return callAPI<VerifyRegistrationOtpResponse>(
      'POST',
      `/api/${LANG}/auth/verify-registration-otp`,
      data,
    );
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    return callAPI<RefreshTokenResponse>('POST', `/api/${LANG}/auth/refresh-token`, data);
  },
};
