'use client';

import { bookingsAPI } from '@/lib/api/bookings';
import type { RejectBookingRequest } from '@/lib/types/booking';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      console.log('🟡 [useBookings] Starting to fetch bookings...');
      try {
        const response = await bookingsAPI.getAll();
        console.log('🟢 [useBookings] API Response received:', response);
        if (!response.success) {
          const errorMessage = extractErrorMessage(response, 'Failed to fetch bookings');
          console.error('❌ [useBookings] API Error:', errorMessage);
          throw new Error(errorMessage);
        }
        const bookings = response.data?.bookings || [];
        console.log('✅ [useBookings] Returning bookings:', bookings.length, 'items');
        return bookings;
      } catch (error) {
        console.error('❌ [useBookings] Exception:', error);
        throw error;
      }
    },
  });
};

export const useBookingEnumValues = () => {
  return useQuery({
    queryKey: ['booking-enum-values'],
    queryFn: async () => {
      const response = await bookingsAPI.getEnumValues();
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch booking enum values');
        throw new Error(errorMessage);
      }
      return response.data?.enumValues || [];
    },
  });
};

export const useApproveBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await bookingsAPI.approve(bookingId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to approve booking');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      data,
    }: {
      bookingId: number;
      data?: RejectBookingRequest;
    }) => {
      const response = await bookingsAPI.reject(bookingId, data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to reject booking');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
