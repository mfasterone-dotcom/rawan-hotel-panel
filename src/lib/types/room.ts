export interface PriceIncreaseRange {
  id?: number; // ID from database (present for existing ranges)
  StartDate: string; // YYYY-MM-DD format
  EndDate: string; // YYYY-MM-DD format
  IncreaseValue: number; // Percentage (0-1000)
}

export interface PriceDecreaseRange {
  id?: number; // ID from database (present for existing ranges)
  StartDate: string; // YYYY-MM-DD format
  EndDate: string; // YYYY-MM-DD format
  DecreaseValue: number; // Percentage (0-100)
}

export interface ExcludedDateRange {
  id?: number; // ID from database (present for existing ranges)
  StartDate: string; // YYYY-MM-DD format
  EndDate: string; // YYYY-MM-DD format
}

export interface Room {
  id: number;
  roomName: string;
  roomType: number;
  bedsCount: number;
  sqft: number;
  price: number;
  facilities: number[];
  featureImage: string;
  galleryImages?: string[];
  numberOfRooms?: number;
  priceIncreaseRanges?: PriceIncreaseRange[];
  priceDecreaseRanges?: PriceDecreaseRange[];
  excludedDateRanges?: ExcludedDateRange[];
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number | null;
  reviewCount?: number;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface RoomResponse {
  room: Room;
}

export interface CreateRoomRequest {
  RoomName: string;
  RoomType: string;
  BedsCount: string;
  Sqft: string;
  Price: string;
  Facilities: string[];
  FeatureImage: File;
  GalleryImages?: File[];
  NumberOfRooms: string;
  PriceIncreaseRanges?: PriceIncreaseRange[];
  PriceDecreaseRanges?: PriceDecreaseRange[];
  ExcludedDateRanges?: ExcludedDateRange[];
}

export interface UpdateRoomRequest {
  RoomName?: string;
  RoomType?: string;
  BedsCount?: string;
  Sqft?: string;
  Price?: string;
  Facilities?: string[];
  FeatureImage?: File;
  GalleryImages?: File[];
  PriceIncreaseRanges?: PriceIncreaseRange[];
  PriceDecreaseRanges?: PriceDecreaseRange[];
  ExcludedDateRanges?: ExcludedDateRange[];
}
