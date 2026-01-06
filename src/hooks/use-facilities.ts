'use client';

import { facilitiesAPI } from '@/lib/api/facilities';
import { useQuery } from '@tanstack/react-query';

export const useFacilities = () => {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await facilitiesAPI.getAll();
      if (response.success && response.data?.facilities) {
        return response.data.facilities;
      }
      return [];
    },
  });
};
