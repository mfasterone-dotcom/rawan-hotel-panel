export interface Profile {
  id: number;
  hotelName: string;
  email: string;
  description: string;
  location: string;
  additionalEmail?: string;
  mobile: string;
  additionalMobile?: string;
  nearestAirportName?: string;
  nearestAirportKm?: number;
  stars?: number;
  twoFAEnabled: boolean;
  isDisabled: boolean;
  facilityIds: number[];
  countryId?: number | null;
  governmentId?: number | null;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface UpdateProfileRequest {
  hotelName?: string;
  description?: string;
  location?: string;
  additionalEmail?: string;
  mobile?: string;
  additionalMobile?: string;
  nearestAirportName?: string;
  nearestAirportKm?: number;
  stars?: number;
  twoFAEnabled?: boolean;
  isDisabled?: boolean;
  facilityIds?: number[];
  countryId?: number | null;
  governmentId?: number | null;
}

export interface ChangeEmailInitiateRequest {
  newEmail: string;
}

export interface ChangeEmailInitiateResponse {
  message: string;
  cooldownSeconds?: number;
}

export interface VerifyEmailChangeRequest {
  newEmail: string;
  otp: string;
}

export interface VerifyEmailChangeResponse {
  message: string;
}
