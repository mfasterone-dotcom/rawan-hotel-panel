'use client';

import type { Facility } from '@/lib/types/auth';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

interface FacilitiesResponse {
  facilities: Facility[];
}

export const facilitiesAPI = {
  getAll: async () => {
    return callAPI<FacilitiesResponse>('GET', `/api/${LANG}/facilities`);
  },
};
