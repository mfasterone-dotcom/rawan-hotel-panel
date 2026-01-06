import { useQuery } from '@tanstack/react-query';
import { countriesAPI } from '@/lib/api/countries';

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await countriesAPI.getCountries();
      return response.data.countries;
    },
  });
}

