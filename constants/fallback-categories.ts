/**
 * The seeded service categories, bundled so Home can draw Popular Services with no
 * connection. Same slugs, names and tints as the database seed; the live list replaces
 * this the moment the API answers. Artwork resolves by slug like everything else.
 */
import type { Category } from '@/lib/catalogue/types';

export const FALLBACK_CATEGORIES: Category[] = [
  { id: 'fallback-electrical', slug: 'electrical', name: 'Electrical', tint: '#F59E0B', iconKey: null, sortOrder: 0, isPopular: true },
  { id: 'fallback-plumbing', slug: 'plumbing', name: 'Plumbing', tint: '#3B82F6', iconKey: null, sortOrder: 1, isPopular: true },
  { id: 'fallback-ac', slug: 'ac', name: 'AC Repair', tint: '#0EA5E9', iconKey: null, sortOrder: 2, isPopular: true },
  { id: 'fallback-fridge', slug: 'fridge', name: 'Fridge Repair', tint: '#06B6D4', iconKey: null, sortOrder: 3, isPopular: true },
  { id: 'fallback-generator', slug: 'generator', name: 'Generator', tint: '#8B5CF6', iconKey: null, sortOrder: 4, isPopular: true },
  { id: 'fallback-solar', slug: 'solar', name: 'Solar', tint: '#F97316', iconKey: null, sortOrder: 5, isPopular: true },
  { id: 'fallback-painting', slug: 'painting', name: 'Painting', tint: '#EC4899', iconKey: null, sortOrder: 6, isPopular: true },
  { id: 'fallback-carpentry', slug: 'carpentry', name: 'Carpentry', tint: '#A16207', iconKey: null, sortOrder: 7, isPopular: true },
  { id: 'fallback-appliance', slug: 'appliance', name: 'Appliance Repair', tint: '#14B8A6', iconKey: null, sortOrder: 8, isPopular: false },
  { id: 'fallback-cleaning', slug: 'cleaning', name: 'Cleaning', tint: '#22C55E', iconKey: null, sortOrder: 9, isPopular: false },
  { id: 'fallback-welding', slug: 'welding', name: 'Welding', tint: '#EF4444', iconKey: null, sortOrder: 10, isPopular: false },
  { id: 'fallback-tiling', slug: 'tiling', name: 'Tiling', tint: '#6366F1', iconKey: null, sortOrder: 11, isPopular: false },
  { id: 'fallback-roofing', slug: 'roofing', name: 'Roofing', tint: '#0EA5E9', iconKey: null, sortOrder: 12, isPopular: false },
  { id: 'fallback-security', slug: 'security', name: 'CCTV & Security', tint: '#64748B', iconKey: null, sortOrder: 13, isPopular: false },
  { id: 'fallback-pest-control', slug: 'pest-control', name: 'Pest Control', tint: '#16A34A', iconKey: null, sortOrder: 14, isPopular: false },
  { id: 'fallback-locksmith', slug: 'locksmith', name: 'Locksmith', tint: '#CA8A04', iconKey: null, sortOrder: 15, isPopular: false },
  { id: 'fallback-electronics', slug: 'electronics', name: 'Electronics', tint: '#3B82F6', iconKey: null, sortOrder: 16, isPopular: false },
  { id: 'fallback-satellite', slug: 'satellite', name: 'Satellite & TV', tint: '#0891B2', iconKey: null, sortOrder: 17, isPopular: false },
  { id: 'fallback-plastering', slug: 'plastering', name: 'Plastering', tint: '#A16207', iconKey: null, sortOrder: 18, isPopular: false },
  { id: 'fallback-water-pump', slug: 'water-pump', name: 'Water Pumps', tint: '#2563EB', iconKey: null, sortOrder: 19, isPopular: false },
  { id: 'fallback-vulcanizer', slug: 'vulcanizer', name: 'Vulcanizer', tint: '#334155', iconKey: 'tire', sortOrder: 20, isPopular: false },
];
