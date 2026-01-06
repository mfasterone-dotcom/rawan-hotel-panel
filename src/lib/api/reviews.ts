import type { ReviewsResponse } from '@/lib/types/review';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const reviewsAPI = {
  getAll: async (roomId?: number) => {
    const url = roomId
      ? `/api/${LANG}/ratings/me?roomId=${roomId}`
      : `/api/${LANG}/ratings/me`;
    console.log('🔵 [ReviewsAPI] Fetching reviews from:', url);
    const response = await callAPI<ReviewsResponse>('GET', url);
    console.log('🟢 [ReviewsAPI] Response:', {
      success: response.success,
      message: response.message,
      reviewsCount: response.data?.reviews?.length || 0,
      reviews: response.data?.reviews
    });
    return response;
  },
};
