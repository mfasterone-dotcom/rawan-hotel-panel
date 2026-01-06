'use client';

import type { StatisticsResponse } from '@/lib/types/statistics';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const statisticsAPI = {
  getStatistics: async () => {
    console.log('🔵 [StatisticsAPI] Fetching statistics from:', `/api/${LANG}/home/statistics`);
    const response = await callAPI<StatisticsResponse>('GET', `/api/${LANG}/home/statistics`);
    console.log('🟢 [StatisticsAPI] Response:', {
      success: response.success,
      message: response.message,
      statistics: response.data?.statistics
    });
    return response;
  },
};
