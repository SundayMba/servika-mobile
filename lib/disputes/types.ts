/** Mirrors the backend Dispute DTOs (Servika.Contracts.Disputes). */

export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved';
export type DisputeResolution = 'None' | 'FavourCustomer' | 'FavourArtisan';

export type Dispute = {
  id: string;
  bookingId: string;
  customerName: string;
  serviceName: string;
  category: string;
  description: string;
  status: DisputeStatus;
  resolution: DisputeResolution;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAtUtc: string | null;
};

export type RaiseDisputeRequest = {
  category: string;
  description: string;
};
