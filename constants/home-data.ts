import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

export type Service = {
  id: string;
  label: string;
  image: ImageSourcePropType;
  /** Tint used for the tile background wash. */
  tint: string;
};

export type Artisan = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  /** Distance from the user, in kilometres. */
  distanceKm: number;
  available: boolean;
  /** Accent color for the avatar ring. */
  accent: string;
  avatar: ImageSourcePropType;
  // ── Profile details ──
  /** Cover/banner photo shown behind the avatar on the profile. */
  cover: ImageSourcePropType;
  /** Number of customer reviews. */
  reviews: number;
  /** Years of experience. */
  experienceYears: number;
  /** City / region the artisan operates in. */
  location: string;
  /** Typical response time, e.g. "15 min". */
  responseTime: string;
  /** Jobs-completed badge, e.g. "120+". */
  jobsCount: string;
  /** Short bio shown in the About section. */
  about: string;
  /** Services offered, rendered as chips. */
  services: string[];
  /** Work-gallery photos. */
  gallery: ImageSourcePropType[];
};

export type WorkingArtisan = {
  id: string;
  /** Short service keyword typed after "Emergency" in the hero headline. */
  service: string;
  image: ImageSourcePropType;
};

export type RecentSearch = {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Tint used for the icon and its tinted square. */
  tint: string;
};

/** Recent search terms shown in the search bottom sheet. */
export const RECENT_SEARCHES: RecentSearch[] = [
  { id: 'electrician', label: 'Electrician', icon: 'flash', tint: '#F59E0B' },
  { id: 'plumber', label: 'Plumber', icon: 'water-pump', tint: '#3B82F6' },
  { id: 'fridge-repair', label: 'Fridge repair', icon: 'fridge-outline', tint: '#06B6D4' },
  { id: 'ac-repair', label: 'AC repair', icon: 'snowflake', tint: '#0EA5E9' },
  { id: 'generator-repair', label: 'Generator repair', icon: 'engine-outline', tint: '#F97316' },
];

/** Popular service categories shown in the home grid. */
export const POPULAR_SERVICES: Service[] = [
  {
    id: 'electrical',
    label: 'Electrical',
    tint: '#F59E0B',
    image: require('../assets/images/services/batch-1-core/electrical_maintenance_tools_and_symbols.png'),
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    tint: '#3B82F6',
    image: require('../assets/images/services/batch-1-core/plumbing_tools_and_pipe_assembly.png'),
  },
  {
    id: 'ac',
    label: 'AC Repair',
    tint: '#0EA5E9',
    image: require('../assets/images/services/batch-1-core/ac_repair_icon_with_cool_airflow.png'),
  },
  {
    id: 'fridge',
    label: 'Fridge',
    tint: '#06B6D4',
    image: require('../assets/images/services/batch-1-core/refrigerator_and_repair_tools_icon.png'),
  },
  {
    id: 'generator',
    label: 'Generator',
    tint: '#8B5CF6',
    image: require('../assets/images/services/batch-1-core/portable_generator_with_wrench_and_power_icon.png'),
  },
  {
    id: 'solar',
    label: 'Solar',
    tint: '#F97316',
    image: require('../assets/images/services/batch-1-core/solar_panel_with_wrench_and_sun.png'),
  },
  {
    id: 'painting',
    label: 'Painting',
    tint: '#EC4899',
    image: require('../assets/images/services/batch-1-core/paint_tools_in_vibrant_harmony.png'),
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    tint: '#A16207',
    image: require('../assets/images/services/batch-1-core/woodworking_tools_on_wooden_plank.png'),
  },
];

/** Nearby verified artisans shown in the horizontal carousel. */
export const NEARBY_ARTISANS: Artisan[] = [
  {
    id: 'emeka-okafor',
    name: 'Emeka Okafor',
    specialty: 'Electrical Specialist',
    rating: 4.8,
    distanceKm: 1.2,
    available: true,
    accent: '#F97316',
    avatar: require('../assets/images/artisans/avatars/friendly_electrician_with_cable_coil.png'),
    cover: require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
    reviews: 124,
    experienceYears: 6,
    location: 'Lagos, Nigeria',
    responseTime: '15 min',
    jobsCount: '120+',
    about:
      'Professional electrician specializing in installations, repairs and maintenance. Committed to quality work and customer safety.',
    services: ['Installation', 'Repair', 'Maintenance', 'Wiring'],
    gallery: [
      require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
      require('../assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
      require('../assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
      require('../assets/images/artisans/working/carpenter_focused_on_sawing_wood.png'),
    ],
  },
  {
    id: 'ibrahim-yusuf',
    name: 'Ibrahim Yusuf',
    specialty: 'Plumbing Expert',
    rating: 4.9,
    distanceKm: 2.3,
    available: true,
    accent: '#3B82F6',
    avatar: require('../assets/images/artisans/avatars/confident_plumber_with_red_wrench.png'),
    cover: require('../assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
    reviews: 98,
    experienceYears: 8,
    location: 'Lagos, Nigeria',
    responseTime: '10 min',
    jobsCount: '200+',
    about:
      'Experienced plumber handling installations, leak repairs and pipe maintenance. Reliable, neat and available for emergencies.',
    services: ['Leak Repair', 'Installation', 'Drainage', 'Maintenance'],
    gallery: [
      require('../assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
      require('../assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
      require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
      require('../assets/images/artisans/working/carpenter_focused_on_sawing_wood.png'),
    ],
  },
  {
    id: 'chidi-okeke',
    name: 'Chidi Okeke',
    specialty: 'AC Technician',
    rating: 4.7,
    distanceKm: 3.1,
    available: false,
    accent: '#10B981',
    avatar: require('../assets/images/artisans/avatars/hvac_technician_portrait_in_uniform.png'),
    cover: require('../assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
    reviews: 76,
    experienceYears: 5,
    location: 'Abuja, Nigeria',
    responseTime: '20 min',
    jobsCount: '90+',
    about:
      'Certified HVAC technician for AC servicing, installation and gas refill. Focused on efficient cooling and long-term reliability.',
    services: ['AC Servicing', 'Installation', 'Gas Refill', 'Repair'],
    gallery: [
      require('../assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
      require('../assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
      require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
      require('../assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
    ],
  },
];

/** Look up a single artisan by id (used by the profile route). */
export function getArtisanById(id: string): Artisan | undefined {
  return NEARBY_ARTISANS.find((artisan) => artisan.id === id);
}

/** Working artisans that rotate inside the emergency hero banner. */
export const WORKING_ARTISANS: WorkingArtisan[] = [
  {
    id: 'plumber',
    service: 'Plumbing',
    image: require('../assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
  },
  {
    id: 'electrician',
    service: 'Electrical',
    image: require('../assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
  },
  {
    id: 'hvac',
    service: 'AC Repair',
    image: require('../assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
  },
  {
    id: 'fridge',
    service: 'Fridge Fix',
    image: require('../assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
  },
  {
    id: 'carpenter',
    service: 'Carpentry',
    image: require('../assets/images/artisans/working/carpenter_focused_on_sawing_wood.png'),
  },
];
