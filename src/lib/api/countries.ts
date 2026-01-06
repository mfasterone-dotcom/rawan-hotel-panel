import { callAPI } from '@/lib/utils/config';

export interface Country {
  id: number;
  title: string;
  img: string;
}

export interface CountriesResponse {
  countries: Country[];
}

const LANG = 'en';

export const countriesAPI = {
  getCountries: async () => {
    return callAPI<CountriesResponse>('GET', `/api/${LANG}/countries`);
  },
};

