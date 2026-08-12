import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ImageSourcePropType } from 'react-native';

import { config } from '@/lib/config';

/**
 * Bundled-artwork resolvers for the catalogue. The API sends stable string keys
 * (category `slug`, artisan `imageKey`, gallery keys) and the client maps them to
 * the images shipped in the app bundle. This keeps the (large, static) artwork
 * out of the database while all the structured data comes from the API.
 *
 * A key with no mapping falls back gracefully (undefined image → the screen shows
 * its tinted placeholder, or for categories an icon).
 */

/** Category tile artwork, keyed by category slug. */
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  electrical: require('@assets/images/services/batch-1-core/electrical_maintenance_tools_and_symbols.webp'),
  plumbing: require('@assets/images/services/batch-1-core/plumbing_tools_and_pipe_assembly.webp'),
  ac: require('@assets/images/services/batch-1-core/ac_repair_icon_with_cool_airflow.webp'),
  fridge: require('@assets/images/services/batch-1-core/refrigerator_and_repair_tools_icon.webp'),
  generator: require('@assets/images/services/batch-1-core/portable_generator_with_wrench_and_power_icon.webp'),
  solar: require('@assets/images/services/batch-1-core/solar_panel_with_wrench_and_sun.webp'),
  painting: require('@assets/images/services/batch-1-core/paint_tools_in_vibrant_harmony.webp'),
  carpentry: require('@assets/images/services/batch-1-core/woodworking_tools_on_wooden_plank.webp'),
  appliance: require('@assets/images/services/batch-2-extra/washing_machine_with_tools_for_repair.webp'),
  cleaning: require('@assets/images/services/batch-1-core/shiny_cleaning_tools_on_display.webp'),
  welding: require('@assets/images/services/batch-1-core/welding_tools_and_sparks_in_motion.webp'),
  tiling: require('@assets/images/services/batch-2-extra/tiling_tools_and_stacked_ceramic_tiles.webp'),
  roofing: require('@assets/images/services/batch-2-extra/roof_repair_tools_in_sleek_3d.webp'),
  security: require('@assets/images/services/batch-2-extra/security_camera_with_tools_setup.webp'),
  'pest-control': require('@assets/images/services/batch-2-extra/pest_control_shield_and_spray_can.webp'),
  locksmith: require('@assets/images/services/batch-2-extra/lock_and_wrench_repair_tools.webp'),
  electronics: require('@assets/images/services/batch-2-extra/laptop_and_phone_repair_tools_icon.webp'),
  satellite: require('@assets/images/services/batch-2-extra/satellite_dish_installation_with_tools.webp'),
  plastering: require('@assets/images/services/batch-2-extra/ceiling_panel_and_plastering_tools_set.webp'),
  'water-pump': require('@assets/images/services/batch-2-extra/mechanical_pump_and_wrench_icon.webp'),
};

/** Artisan avatar (portrait), keyed by artisan imageKey. */
const ARTISAN_AVATARS: Record<string, ImageSourcePropType> = {
  'emeka-okafor': require('@assets/images/artisans/avatars/friendly_electrician_with_cable_coil.webp'),
  'ibrahim-yusuf': require('@assets/images/artisans/avatars/confident_plumber_with_red_wrench.webp'),
  'chidi-okeke': require('@assets/images/artisans/avatars/hvac_technician_portrait_in_uniform.webp'),
};

/** Artisan cover/banner photo, keyed by artisan imageKey. */
const ARTISAN_COVERS: Record<string, ImageSourcePropType> = {
  'emeka-okafor': require('@assets/images/artisans/working/hero_electrician.webp'),
  'ibrahim-yusuf': require('@assets/images/artisans/working/hero_plumber.webp'),
  'chidi-okeke': require('@assets/images/artisans/working/hero_ac.webp'),
};

/** Work-gallery photos, keyed by gallery key. */
const WORKING_PHOTOS: Record<string, ImageSourcePropType> = {
  electrician: require('@assets/images/artisans/working/hero_electrician.webp'),
  plumber: require('@assets/images/artisans/working/hero_plumber.webp'),
  hvac: require('@assets/images/artisans/working/hero_ac.webp'),
  fridge: require('@assets/images/artisans/working/hero_fridge.webp'),
  carpenter: require('@assets/images/artisans/working/hero_carpenter.webp'),
};

export function categoryImage(slug: string): ImageSourcePropType | undefined {
  return CATEGORY_IMAGES[slug];
}

export function artisanAvatar(imageKey: string): ImageSourcePropType | undefined {
  return ARTISAN_AVATARS[imageKey];
}

export function artisanCover(imageKey: string): ImageSourcePropType | undefined {
  return ARTISAN_COVERS[imageKey] ?? ARTISAN_AVATARS[imageKey];
}

/**
 * Resolves an artisan's display image. The photo they uploaded from the Pro app
 * (served by the API at `photoUrl`) wins; otherwise the bundled `imageKey` art
 * (seed-era artisans); undefined → the caller renders its initials placeholder.
 * The same photo doubles as avatar and profile cover.
 */
export function artisanPhotoSource(
  photoUrl: string | null | undefined,
  imageKey?: string,
  cover = false,
): ImageSourcePropType | undefined {
  if (photoUrl) return { uri: `${config.apiBaseUrl}${photoUrl}` };
  if (!imageKey) return undefined;
  return cover ? artisanCover(imageKey) : artisanAvatar(imageKey);
}

/**
 * Resolves the profile-header cover image. The dedicated cover photo (them at
 * work) wins; then the profile photo; then bundled art; undefined → the screen
 * renders its branded initials cover.
 */
export function artisanCoverSource(
  coverPhotoUrl: string | null | undefined,
  photoUrl: string | null | undefined,
  imageKey?: string,
): ImageSourcePropType | undefined {
  if (coverPhotoUrl) return { uri: `${config.apiBaseUrl}${coverPhotoUrl}` };
  return artisanPhotoSource(photoUrl, imageKey, true);
}

export function galleryImages(keys: string[]): ImageSourcePropType[] {
  return keys.map((k) => WORKING_PHOTOS[k]).filter(Boolean) as ImageSourcePropType[];
}

/** Vector-icon fallback for categories with no tile image (e.g. "tire"). */
export function categoryIcon(
  iconKey: string | null,
): keyof typeof MaterialCommunityIcons.glyphMap | undefined {
  return (iconKey as keyof typeof MaterialCommunityIcons.glyphMap) ?? undefined;
}

/** Formats a Naira integer for display, e.g. 5000 → "₦5,000". */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
