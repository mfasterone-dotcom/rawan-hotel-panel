export interface StatisticsData {
  totalPendingBooking: number;
  totalConfirmedBooking: number;
  totalRooms: number;
  totalAvailablesRooms: number;
  totalMoney: number;
}

export interface StatisticsResponse {
  statistics: StatisticsData;
}
