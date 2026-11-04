import { apiClient } from '@/lib/api/client';

/** Checked artisans who could take a job at a point now, and how many cover it at all. */
export type Availability = { availableNow: number; covering: number };

export type ServiceInterestBody = {
  categorySlug: string | null;
  note: string | null;
  areaLabel: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function getAvailability(coords?: { latitude: number; longitude: number } | null, category?: string): Promise<Availability> {
  const { data } = await apiClient.get<Availability>('/api/v1/availability', {
    params: { ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}), ...(category ? { category } : {}) },
  });
  return data;
}

/** "Tell us what you need": a service or an area Servika does not offer yet. Guests may send it. */
export async function recordServiceInterest(body: ServiceInterestBody): Promise<void> {
  await apiClient.post('/api/v1/service-interest', body);
}

export type EstateEnquiryBody = {
  organisationName: string;
  contactName: string;
  contactRole: string | null;
  phone: string;
  email: string | null;
  location: string;
  unitCount: number | null;
  servicesWanted: string[];
  frequency: string;
  notes: string | null;
};

/** An estate or facility manager says what they need; Servika ops follow up by phone. Guests may send it. */
export async function submitEstateEnquiry(body: EstateEnquiryBody): Promise<void> {
  await apiClient.post('/api/v1/estate-enquiries', body);
}
