export interface PayoutProfile {
  id: number;
  uid: number;
  name: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  fullName: string;
  walletNumber: string | null;
  status: number;
  methodId: number;
}

export interface PayoutProfilesResponse {
  payoutProfiles: PayoutProfile[];
}

export interface PayoutProfileResponse {
  payoutProfile: PayoutProfile;
}

export interface CreatePayoutProfileRequest {
  name: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  fullName: string;
  walletNumber?: string | null;
  methodId: number;
  status: number;
}

export interface UpdatePayoutProfileRequest {
  name?: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  fullName?: string;
  walletNumber?: string | null;
  methodId?: number;
  status?: number;
}

export interface RequestPayoutRequest {
  bookIds: number[];
  profileId: number;
}





