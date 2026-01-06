import { callAPI } from '@/lib/utils/config';

export interface Government {
  id: number;
  name: string;
  countryId: number;
}

export interface GovernmentsResponse {
  governments: Government[];
}

const LANG = 'en';

export const governmentsAPI = {
  getGovernments: async (countryId: number) => {
    return callAPI<GovernmentsResponse>('GET', `/api/${LANG}/governments?countryId=${countryId}`);
  },
};

