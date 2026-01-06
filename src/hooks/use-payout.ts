'use client';

import { payoutAPI } from '@/lib/api/payout';
import type {
  CreatePayoutProfileRequest,
  RequestPayoutRequest,
  UpdatePayoutProfileRequest,
} from '@/lib/types/payout';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const usePayoutProfiles = () => {
  return useQuery({
    queryKey: ['payout-profiles'],
    queryFn: async () => {
      const response = await payoutAPI.getAll();
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch payout profiles');
        throw new Error(errorMessage);
      }
      return response.data?.payoutProfiles || [];
    },
  });
};

export const usePayoutProfile = (payoutProfileId: number | null) => {
  return useQuery({
    queryKey: ['payout-profile', payoutProfileId],
    queryFn: async () => {
      if (!payoutProfileId) return null;
      const response = await payoutAPI.getById(payoutProfileId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch payout profile');
        throw new Error(errorMessage);
      }
      return response.data?.payoutProfile || null;
    },
    enabled: !!payoutProfileId,
  });
};

export const useCreatePayoutProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePayoutProfileRequest) => {
      const response = await payoutAPI.create(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to create payout profile');
        throw new Error(errorMessage);
      }
      return response.data?.payoutProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-profiles'] });
    },
  });
};

export const useUpdatePayoutProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payoutProfileId,
      data,
    }: {
      payoutProfileId: number;
      data: UpdatePayoutProfileRequest;
    }) => {
      const response = await payoutAPI.update(payoutProfileId, data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to update payout profile');
        throw new Error(errorMessage);
      }
      return response.data?.payoutProfile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payout-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['payout-profile', variables.payoutProfileId] });
    },
  });
};

export const useDeletePayoutProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutProfileId: number) => {
      const response = await payoutAPI.delete(payoutProfileId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to delete payout profile');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-profiles'] });
    },
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RequestPayoutRequest) => {
      const response = await payoutAPI.request(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to request payout');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};





