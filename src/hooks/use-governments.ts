import { useQuery } from '@tanstack/react-query';
import { governmentsAPI } from '@/lib/api/governments';

export function useGovernments(countryId: number | null | undefined) {
  return useQuery({
    queryKey: ['governments', countryId],
    queryFn: async () => {
      if (!countryId) {
        return [];
      }
      const response = await governmentsAPI.getGovernments(countryId);
      return response.data.governments;
    },
    enabled: !!countryId, // Only fetch when countryId is provided
  });
}

