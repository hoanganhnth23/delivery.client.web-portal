import { describe, expect, it } from 'vitest';
import {
  buildMapboxGeocodingUrl,
  buildMapboxTileUrl,
  parseMapboxGeocodingResponse,
} from './mapboxConfig';

describe('Mapbox location configuration', () => {
  it('builds a Mapbox style tile URL with the configured token', () => {
    expect(buildMapboxTileUrl('pk.test-token')).toBe(
      'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.test-token',
    );
  });

  it('builds a Vietnam-scoped geocoding URL from the typed address', () => {
    const url = buildMapboxGeocodingUrl('123 Trần Phú, Hà Đông', 'pk.test-token');

    expect(url).toContain(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/123%20Tr%E1%BA%A7n%20Ph%C3%BA%2C%20H%C3%A0%20%C4%90%C3%B4ng.json',
    );
    expect(url).toContain('access_token=pk.test-token');
    expect(url).toContain('country=vn');
    expect(url).toContain('language=vi');
  });

  it('normalizes Mapbox longitude/latitude center order', () => {
    expect(
      parseMapboxGeocodingResponse({
        features: [
          {
            center: [105.777, 20.9717],
            place_name: '123 Trần Phú, Hà Đông, Hà Nội, Việt Nam',
          },
        ],
      }),
    ).toEqual({
      latitude: 20.9717,
      longitude: 105.777,
      displayName: '123 Trần Phú, Hà Đông, Hà Nội, Việt Nam',
    });
  });

  it('rejects a malformed geocoding response', () => {
    expect(parseMapboxGeocodingResponse({ features: [{ center: [105.777] }] })).toBeNull();
  });
});
