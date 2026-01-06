'use client';

import { reviewsAPI } from '@/lib/api/reviews';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useQuery } from '@tanstack/react-query';

export const useReviews = (roomId?: number) => {
  return useQuery({
    queryKey: ['reviews', roomId],
    queryFn: async () => {
      console.log('🟡 [useReviews] Starting to fetch reviews...', roomId ? `RoomId: ${roomId}` : 'All rooms');
      try {
        const response = await reviewsAPI.getAll(roomId);
        console.log('🟢 [useReviews] API Response received:', response);
        if (!response.success) {
          const errorMessage = extractErrorMessage(response, 'Failed to fetch reviews');
          console.error('❌ [useReviews] API Error:', errorMessage);
          throw new Error(errorMessage);
        }
        const reviews = response.data?.reviews || [];
        console.log('✅ [useReviews] Returning reviews:', reviews.length, 'items');
        return reviews;
      } catch (error) {
        console.error('❌ [useReviews] Exception:', error);
        throw error;
      }
    },
  });
};
