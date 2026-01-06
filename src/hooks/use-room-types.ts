'use client';

import { roomTypesAPI } from '@/lib/api/room-types';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useQuery } from '@tanstack/react-query';

export const useRoomTypes = () => {
  return useQuery({
    queryKey: ['roomTypes'],
    queryFn: async () => {
      const response = await roomTypesAPI.getAll();
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch room types');
        throw new Error(errorMessage);
      }
      return response.data?.roomTypes || [];
    },
  });
};
