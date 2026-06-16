import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

import type { Service } from '@/constants/home-data';

export type ServiceType = 'Installation' | 'Repair' | 'Maintenance';

export type ServiceListing = {
  id: string;
  title: string;
  description: string;
  /** Starting price, already formatted (e.g. "₦15,000"). */
  priceFrom: string;
  rating: number;
  reviews: number;
  type: ServiceType;
  image?: ImageSourcePropType;
};

/** Filter chips shown above the listing. */
export const SERVICE_FILTERS: {
  key: 'All' | ServiceType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'All', icon: 'grid-outline' },
  { key: 'Installation', icon: 'construct-outline' },
  { key: 'Repair', icon: 'build-outline' },
  { key: 'Maintenance', icon: 'settings-outline' },
];

/** Representative work photos used as listing thumbnails per category. */
const CATEGORY_PHOTOS: Record<string, ImageSourcePropType> = {
  electrical: require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
  plumbing: require('../assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
  ac: require('../assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
  fridge: require('../assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
  carpentry: require('../assets/images/artisans/working/carpenter_focused_on_sawing_wood.png'),
};

/** Maps a category to a representative artisan profile for its services. */
const CATEGORY_ARTISAN: Record<string, string> = {
  electrical: 'emeka-okafor',
  plumbing: 'ibrahim-yusuf',
  ac: 'chidi-okeke',
  fridge: 'chidi-okeke',
};

export function getCategoryArtisanId(categoryId: string): string {
  return CATEGORY_ARTISAN[categoryId] ?? 'emeka-okafor';
}

/**
 * Builds the list of bookable services for a category. Mock data — tailored
 * copy per service type, with the category label woven in.
 */
export function getCategoryServices(category: Service): ServiceListing[] {
  const photo = CATEGORY_PHOTOS[category.id] ?? category.image;
  const label = category.label;

  return [
    {
      id: `${category.id}-installation`,
      title: `${label} Installation`,
      description: 'New setup, fitting and configuration',
      priceFrom: '₦15,000',
      rating: 4.8,
      reviews: 124,
      type: 'Installation',
      image: photo,
    },
    {
      id: `${category.id}-repair`,
      title: `${label} Repair`,
      description: 'Fault diagnosis and quick fixes',
      priceFrom: '₦10,000',
      rating: 4.7,
      reviews: 98,
      type: 'Repair',
      image: photo,
    },
    {
      id: `${category.id}-maintenance`,
      title: `${label} Maintenance`,
      description: 'Routine servicing and safety checks',
      priceFrom: '₦12,000',
      rating: 4.9,
      reviews: 76,
      type: 'Maintenance',
      image: photo,
    },
    {
      id: `${category.id}-emergency`,
      title: `Emergency ${label}`,
      description: 'Fast response for urgent issues',
      priceFrom: '₦20,000',
      rating: 4.6,
      reviews: 54,
      type: 'Repair',
      image: photo,
    },
  ];
}
