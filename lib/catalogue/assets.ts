import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

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
  electrical: require('@assets/images/services/batch-1-core/electrical_maintenance_tools_and_symbols.png'),
  plumbing: require('@assets/images/services/batch-1-core/plumbing_tools_and_pipe_assembly.png'),
  ac: require('@assets/images/services/batch-1-core/ac_repair_icon_with_cool_airflow.png'),
  fridge: require('@assets/images/services/batch-1-core/refrigerator_and_repair_tools_icon.png'),
  generator: require('@assets/images/services/batch-1-core/portable_generator_with_wrench_and_power_icon.png'),
  solar: require('@assets/images/services/batch-1-core/solar_panel_with_wrench_and_sun.png'),
  painting: require('@assets/images/services/batch-1-core/paint_tools_in_vibrant_harmony.png'),
  carpentry: require('@assets/images/services/batch-1-core/woodworking_tools_on_wooden_plank.png'),
  appliance: require('@assets/images/services/batch-2-extra/washing_machine_with_tools_for_repair.png'),
  cleaning: require('@assets/images/services/batch-1-core/shiny_cleaning_tools_on_display.png'),
  welding: require('@assets/images/services/batch-1-core/welding_tools_and_sparks_in_motion.png'),
  tiling: require('@assets/images/services/batch-2-extra/tiling_tools_and_stacked_ceramic_tiles.png'),
  roofing: require('@assets/images/services/batch-2-extra/roof_repair_tools_in_sleek_3d.png'),
  security: require('@assets/images/services/batch-2-extra/security_camera_with_tools_setup.png'),
  'pest-control': require('@assets/images/services/batch-2-extra/pest_control_shield_and_spray_can.png'),
  locksmith: require('@assets/images/services/batch-2-extra/lock_and_wrench_repair_tools.png'),
  electronics: require('@assets/images/services/batch-2-extra/laptop_and_phone_repair_tools_icon.png'),
  satellite: require('@assets/images/services/batch-2-extra/satellite_dish_installation_with_tools.png'),
  plastering: require('@assets/images/services/batch-2-extra/ceiling_panel_and_plastering_tools_set.png'),
  'water-pump': require('@assets/images/services/batch-2-extra/mechanical_pump_and_wrench_icon.png'),
};

/** Artisan avatar (portrait), keyed by artisan imageKey. */
const ARTISAN_AVATARS: Record<string, ImageSourcePropType> = {
  'emeka-okafor': require('@assets/images/artisans/avatars/friendly_electrician_with_cable_coil.png'),
  'ibrahim-yusuf': require('@assets/images/artisans/avatars/confident_plumber_with_red_wrench.png'),
  'chidi-okeke': require('@assets/images/artisans/avatars/hvac_technician_portrait_in_uniform.png'),
};

/** Artisan cover/banner photo, keyed by artisan imageKey. */
const ARTISAN_COVERS: Record<string, ImageSourcePropType> = {
  'emeka-okafor': require('@assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
  'ibrahim-yusuf': require('@assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
  'chidi-okeke': require('@assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
};

/** Work-gallery photos, keyed by gallery key. */
const WORKING_PHOTOS: Record<string, ImageSourcePropType> = {
  electrician: require('@assets/images/artisans/working/electrician_working_on_wall_electrical_box.png'),
  plumber: require('@assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png'),
  hvac: require('@assets/images/artisans/working/hvac_technician_working_on_ac_unit.png'),
  fridge: require('@assets/images/artisans/working/technician_repairing_refrigerator_with_tools.png'),
  carpenter: require('@assets/images/artisans/working/carpenter_focused_on_sawing_wood.png'),
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
