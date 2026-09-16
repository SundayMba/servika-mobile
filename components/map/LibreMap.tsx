import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  Marker,
  UserLocation,
  type CameraRef,
  type LngLat,
  type LngLatBounds,
  type MapProps,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { forwardRef, type ReactElement, type ReactNode } from 'react';

import type { LatLng } from '@/lib/tracking/geo';

/**
 * The app's map, on MapLibre with OpenFreeMap's free vector tiles (OpenStreetMap
 * data, no key, no billing account). Replaces react-native-maps / Google Maps so a
 * lapsed Google billing account can never blank the map again. One shared kit for
 * both apps: a styled Map, a Camera, pins, a line overlay and lat/lng helpers.
 */

/** Calm light style with place labels visible, like a ride app. */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Nigeria's bounding box as MapLibre wants it: [west, south, east, north]. */
export const NIGERIA_BOUNDS: LngLatBounds = [2.6, 4.2, 14.7, 13.9];

export const toLngLat = (p: LatLng): LngLat => [p.longitude, p.latitude];
export const fromLngLat = ([longitude, latitude]: LngLat): LatLng => ({ latitude, longitude });

/** Bounds around a set of points, or null when there are fewer than two. */
export function boundsFor(points: LatLng[]): LngLatBounds | null {
  if (points.length < 2) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of points) {
    w = Math.min(w, p.longitude); e = Math.max(e, p.longitude);
    s = Math.min(s, p.latitude); n = Math.max(n, p.latitude);
  }
  return [w, s, e, n];
}

/** A web-mercator zoom that shows roughly `spanDegrees` of latitude on screen. */
export function zoomForSpan(spanDegrees: number, viewportHeightPx = 700) {
  // 360° of latitude at zoom 0 spans 512px; each zoom level halves the span.
  const z = Math.log2((viewportHeightPx / 512) * (360 / Math.max(spanDegrees, 0.0005)));
  return Math.min(19, Math.max(3, z));
}

export { Camera, Marker, UserLocation };
export type { CameraRef, LngLat, LngLatBounds, MapRef };

type LibreMapProps = Omit<MapProps, 'mapStyle'> & { mapStyle?: MapProps['mapStyle']; children?: ReactNode };

/** The Map with the app's defaults: free tiles, no ornaments, no rotate or pitch. */
export const LibreMap = forwardRef<MapRef, LibreMapProps>(function LibreMap(
  { mapStyle = MAP_STYLE, children, ...rest },
  ref,
) {
  return (
    <MapLibreMap
      ref={ref}
      mapStyle={mapStyle}
      logo={false}
      compass={false}
      scaleBar={false}
      attribution
      attributionPosition={{ bottom: 6, left: 8 }}
      touchRotate={false}
      touchPitch={false}
      {...rest}
    >
      {children}
    </MapLibreMap>
  );
});

/** A line between points: solid for real road geometry, dashed for a straight-line estimate. */
export function LineOverlay({
  id,
  points,
  color,
  width = 4,
  dashed = false,
}: {
  id: string;
  points: LatLng[];
  color: string;
  width?: number;
  dashed?: boolean;
}) {
  if (points.length < 2) return null;
  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: points.map(toLngLat) },
  };
  return (
    <GeoJSONSource id={`${id}-src`} data={data}>
      <Layer
        id={`${id}-line`}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': color,
          'line-width': width,
          ...(dashed ? { 'line-dasharray': [0.2, 2] } : {}),
        }}
      />
    </GeoJSONSource>
  );
}

/** A view pinned to a coordinate. `anchor="bottom"` puts the tip of a teardrop on the spot. */
export function Pin({
  position,
  anchor = 'center',
  onPress,
  children,
}: {
  position: LatLng;
  anchor?: 'center' | 'bottom';
  onPress?: () => void;
  children: ReactElement;
}) {
  return (
    <Marker lngLat={toLngLat(position)} anchor={anchor} onPress={onPress}>
      {children}
    </Marker>
  );
}
