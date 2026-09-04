export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

const MAPBOX_STYLE_TILE_URL =
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}';
const MAPBOX_GEOCODING_URL =
  'https://api.mapbox.com/geocoding/v5/mapbox.places';

export const buildMapboxTileUrl = (token: string = MAPBOX_ACCESS_TOKEN): string =>
  `${MAPBOX_STYLE_TILE_URL}?access_token=${encodeURIComponent(token)}`;

export const buildMapboxGeocodingUrl = (
  query: string,
  token: string = MAPBOX_ACCESS_TOKEN,
): string =>
  `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(
    token,
  )}&country=vn&limit=1&language=vi`;

export interface MapboxLocationResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export const parseMapboxGeocodingResponse = (
  payload: unknown,
): MapboxLocationResult | null => {
  if (!isRecord(payload) || !Array.isArray(payload.features)) return null;

  const firstFeature = payload.features[0];
  if (!isRecord(firstFeature) || !Array.isArray(firstFeature.center)) {
    return null;
  }

  const [longitudeValue, latitudeValue] = firstFeature.center;
  const longitude = Number(longitudeValue);
  const latitude = Number(latitudeValue);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    displayName:
      typeof firstFeature.place_name === 'string' ? firstFeature.place_name : '',
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
