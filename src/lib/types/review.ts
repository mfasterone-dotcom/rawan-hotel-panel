export interface Review {
  id: number;
  rating: number;
  comment: string;
  roomId: number;
  roomName: string;
  userId: number;
  userName?: string | null;
  createdAt: string;
  status: number;
  bookId: number;
}

export interface ReviewsResponse {
  reviews: Review[];
}
