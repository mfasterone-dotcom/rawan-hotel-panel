import type {
  CreatePayoutProfileRequest,
  PayoutProfileResponse,
  PayoutProfilesResponse,
  RequestPayoutRequest,
  UpdatePayoutProfileRequest,
} from '@/lib/types/payout';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const payoutAPI = {
  getAll: async () => {
    return callAPI<PayoutProfilesResponse>('GET', `/api/${LANG}/payout`);
  },

  getById: async (payoutProfileId: number) => {
    return callAPI<PayoutProfileResponse>('GET', `/api/${LANG}/payout/${payoutProfileId}`);
  },

  create: async (data: CreatePayoutProfileRequest) => {
    return callAPI<PayoutProfileResponse>('POST', `/api/${LANG}/payout`, data);
  },

  update: async (payoutProfileId: number, data: UpdatePayoutProfileRequest) => {
    return callAPI<PayoutProfileResponse>('PUT', `/api/${LANG}/payout/${payoutProfileId}`, data);
  },

  delete: async (payoutProfileId: number) => {
    return callAPI<{ message: string }>('DELETE', `/api/${LANG}/payout/${payoutProfileId}`);
  },

  request: async (data: RequestPayoutRequest) => {
    return callAPI<{ message: string }>('POST', `/api/${LANG}/payout/request`, data);
  },
};
