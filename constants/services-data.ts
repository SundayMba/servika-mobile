import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

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

/**
 * Builds the list of bookable services for a category. The service rows are
 * presentational copy (Installation/Repair/Maintenance/Emergency) tailored to
 * the category; the category itself comes from the API.
 */
export function getCategoryServices(category: {
  slug: string;
  name: string;
  image?: ImageSourcePropType;
}): ServiceListing[] {
  const photo = CATEGORY_PHOTOS[category.slug] ?? category.image;
  const label = category.name;

  return [
    {
      id: `${category.slug}-installation`,
      title: `${label} Installation`,
      description: 'New setup, fitting and configuration',
      priceFrom: '₦15,000',
      rating: 4.8,
      reviews: 124,
      type: 'Installation',
      image: photo,
    },
    {
      id: `${category.slug}-repair`,
      title: `${label} Repair`,
      description: 'Fault diagnosis and quick fixes',
      priceFrom: '₦10,000',
      rating: 4.7,
      reviews: 98,
      type: 'Repair',
      image: photo,
    },
    {
      id: `${category.slug}-maintenance`,
      title: `${label} Maintenance`,
      description: 'Routine servicing and safety checks',
      priceFrom: '₦12,000',
      rating: 4.9,
      reviews: 76,
      type: 'Maintenance',
      image: photo,
    },
    {
      id: `${category.slug}-emergency`,
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
