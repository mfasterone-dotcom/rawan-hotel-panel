export type BookingStatus =
  | 'Booked'
  | 'Check_in'
  | 'Completed'
  | 'Cancelled'
  | 'Confirmed'
  | 'Excluded';

export interface Booking {
  id: number;
  propId: number;
  uid: number;
  bookDate: string;
  checkIn: string;
  checkOut: string;
  subtotal: number;
  total: number;
  tax: number;
  bookStatus: BookingStatus;
  propTitle: string;
  confirmedAt: string;
  confirmedBy: string;
}

export interface BookingsResponse {
  bookings: Booking[];
}

export interface BookingEnumValuesResponse {
  enumValues: BookingStatus[];
}

export interface RejectBookingRequest {
  cancelReason?: string;
  [key: string]: unknown;
}






