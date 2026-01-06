'use client';

import { profileAPI } from '@/lib/api/profile';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import type {
  ChangeEmailInitiateRequest,
  UpdateProfileRequest,
  VerifyEmailChangeRequest,
} from '@/lib/types/profile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileAPI.getProfile();
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch profile');
        throw new Error(errorMessage);
      }
      return response.data?.profile || null;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await profileAPI.updateProfile(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to update profile');
        throw new Error(errorMessage);
      }
      return response.data?.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

export const useChangeEmailInitiate = () => {
  return useMutation({
    mutationFn: async (data: ChangeEmailInitiateRequest) => {
      const response = await profileAPI.changeEmailInitiate(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to initiate email change');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      toast.success('OTP sent to your new email address');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to initiate email change');
    },
  });
};

export const useVerifyEmailChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VerifyEmailChangeRequest) => {
      const response = await profileAPI.verifyEmailChange(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to verify email change');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Email changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify email change');
    },
  });
};









