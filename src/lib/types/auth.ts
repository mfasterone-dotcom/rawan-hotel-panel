export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  hotelName: string;
  description: string;
  location: string;
  email: string;
  additionalEmail?: string | null;
  mobile: string;
  additionalMobile?: string | null;
  password: string;
  passwordConfirm: string;
  stars: number;
  facilityIds: number[];
  countryId?: number | null;
  governmentId?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  hotel: {
    id: number;
    hotelName: string;
    email: string;
    twoFAEnabled?: boolean;
  };
}

export interface LoginResponse {
  requiresOtp: boolean;
  email?: string;
  cooldownSeconds?: number;
  accessToken?: string;
  refreshToken?: string;
  hotel?: {
    id: number;
    hotelName: string;
    email: string;
    twoFAEnabled?: boolean;
  };
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  hotel: {
    id: number;
    hotelName: string;
    email: string;
    twoFAEnabled?: boolean;
  };
}

export interface Facility {
  id: number;
  title: string;
  img: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  cooldownSeconds?: number;
}

export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyForgotPasswordOtpResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyRegistrationOtpRequest {
  email: string;
  otp: string;
  hotelName: string;
  description: string;
  location: string;
  additionalEmail?: string | null;
  mobile: string;
  additionalMobile?: string | null;
  password: string;
  stars: number;
  facilityIds: number[];
  countryId?: number | null;
  governmentId?: number | null;
}

export interface VerifyRegistrationOtpResponse {
  accessToken: string;
  refreshToken: string;
  hotel: {
    id: number;
    hotelName: string;
    email: string;
    twoFAEnabled?: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
