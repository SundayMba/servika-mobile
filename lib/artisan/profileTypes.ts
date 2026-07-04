/** Mirrors the backend MyArtisanProfileDto / SaveArtisanProfileRequest + KYC DTOs. */

export type ArtisanVerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export type MyArtisanProfile = {
  id: string;
  imageKey: string;
  fullName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  verificationStatus: ArtisanVerificationStatus;
  experienceYears: number;
  location: string;
  inspectionFeeNaira: number;
  about: string;
  categorySlugs: string[];
  services: string[];
};

export type SaveArtisanProfileRequest = {
  specialty: string;
  categorySlugs: string[];
  services: string[];
  about: string;
  experienceYears: number;
  location: string;
  inspectionFeeNaira: number;
  latitude?: number | null;
  longitude?: number | null;
  imageKey?: string | null;
};

export type KycIdType = 'Nin' | 'VotersCard' | 'DriversLicense' | 'Passport';

/** "NotSubmitted" | "Pending" | "Verified" | "Rejected". */
export type KycStatusValue =
  | 'NotSubmitted'
  | 'Pending'
  | 'Verified'
  | 'Rejected';

export type KycStatus = {
  status: KycStatusValue;
  idType: string | null;
  idNumber: string | null;
  reviewNote: string | null;
  submittedAtUtc: string | null;
  reviewedAtUtc: string | null;
};

export type SubmitKycRequest = {
  idType: KycIdType;
  idNumber?: string | null;
  selfieBase64: string;
  idImageBase64: string;
};
