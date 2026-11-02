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
