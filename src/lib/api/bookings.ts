import type {
  BookingEnumValuesResponse,
  BookingsResponse,
  RejectBookingRequest,
} from '@/lib/types/booking';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const bookingsAPI = {
  getAll: async () => {
    console.log('🔵 [BookingsAPI] Fetching all bookings from:', `/api/${LANG}/bookings`);
    const response = await callAPI<BookingsResponse>('GET', `/api/${LANG}/bookings`);
    console.log('🟢 [BookingsAPI] Response:', {
      success: response.success,
      message: response.message,
      bookingsCount: response.data?.bookings?.length || 0,
      bookings: response.data?.bookings
    });
    return response;
  },

  getEnumValues: async () => {
    return callAPI<BookingEnumValuesResponse>('GET', `/api/${LANG}/bookings/enum-values`);
  },

  approve: async (bookingId: number) => {
    return callAPI<{ message: string }>('PUT', `/api/${LANG}/bookings/${bookingId}/approve`);
  },

  reject: async (bookingId: number, data?: RejectBookingRequest) => {
    return callAPI<{ message: string }>('PUT', `/api/${LANG}/bookings/${bookingId}/reject`, data);
  },
};
