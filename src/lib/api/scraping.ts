import axios from 'axios';

export interface ScrapedRoomData {
  name: string;
  beds: number;
  guests: number;
  room_size_m2: number;
  amenities: string[];
  bed_details: string[] | null;
  bathroom_features: string[];
  smoking_policy: string;
  bed_rating: number;
  review_count: number;
}

export interface ScrapedHotelData {
  hotel_name: string;
  facilities: string[];
  rooms: ScrapedRoomData[];
}

export const scrapingAPI = {
  scrape: async (url: string): Promise<ScrapedHotelData> => {
    const response = await axios.post<ScrapedHotelData>('/api/scrape', {
      url,
    });
    return response.data;
  },
};

