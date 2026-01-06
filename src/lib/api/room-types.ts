'use client';

import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export interface RoomType {
  id: number;
  name: string;
}

interface RoomTypesResponse {
  roomTypes: RoomType[];
}

export const roomTypesAPI = {
  getAll: async () => {
    return callAPI<RoomTypesResponse>('GET', `/api/${LANG}/room-types`);
  },
};
