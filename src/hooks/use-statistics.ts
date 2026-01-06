'use client';

import { statisticsAPI } from '@/lib/api/statistics';
import type { StatisticsData } from '@/lib/types/statistics';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useQuery } from '@tanstack/react-query';

export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async (): Promise<StatisticsData | null> => {
      console.log('🟡 [useStatistics] Fetching statistics...');
      const response = await statisticsAPI.getStatistics();
      console.log('🟢 [useStatistics] Response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        statistics: response.data?.statistics
      });
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch statistics');
        console.error('❌ [useStatistics] Error:', errorMessage);
        throw new Error(errorMessage);
      }
      const statistics = response.data?.statistics || null;
      console.log('✅ [useStatistics] Returning statistics:', statistics);
      return statistics;
    },
  });
};
