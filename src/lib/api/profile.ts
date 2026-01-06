import type {
  ChangeEmailInitiateRequest,
  ChangeEmailInitiateResponse,
  ProfileResponse,
  UpdateProfileRequest,
  VerifyEmailChangeRequest,
  VerifyEmailChangeResponse,
} from '@/lib/types/profile';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const profileAPI = {
  getProfile: async () => {
    return callAPI<ProfileResponse>('GET', `/api/${LANG}/profile/me`);
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return callAPI<ProfileResponse>('PUT', `/api/${LANG}/profile/me`, data);
  },

  changeEmailInitiate: async (data: ChangeEmailInitiateRequest) => {
    return callAPI<ChangeEmailInitiateResponse>(
      'POST',
      `/api/${LANG}/profile/me/change-email`,
      data,
    );
  },

  verifyEmailChange: async (data: VerifyEmailChangeRequest) => {
    return callAPI<VerifyEmailChangeResponse>(
      'POST',
      `/api/${LANG}/profile/me/verify-email-change`,
      data,
    );
  },
};
