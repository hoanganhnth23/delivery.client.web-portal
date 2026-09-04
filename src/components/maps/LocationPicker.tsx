import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  buildMapboxGeocodingUrl,
  buildMapboxTileUrl,
  MAPBOX_ACCESS_TOKEN,
  parseMapboxGeocodingResponse,
} from './mapboxConfig';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  address?: string;
  onChange: (lat: number, lng: number, address?: string) => void;
  disabled?: boolean;
}

// Vietnam bounding box & default center (Hanoi / HCM)
const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542]; // Hanoi
const VIETNAM_BOUNDS = {
  minLat: 8.0,
  maxLat: 24.0,
  minLng: 102.0,
  maxLng: 110.0,
};

const createPinIcon = () =>
  L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C7.58 2 4 5.58 4 10C4 15.25 12 22 12 22S20 15.25 20 10C20 5.58 16.42 2 12 2Z" fill="#E11D48" stroke="#FFFFFF" stroke-width="1.5"/>
          <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

export const LocationPicker = ({
  lat,
  lng,
  address,
  onChange,
  disabled = false,
}: LocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  const isValidVietnamCoords = useCallback((latitude: number, longitude: number) => {
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= VIETNAM_BOUNDS.minLat &&
      latitude <= VIETNAM_BOUNDS.maxLat &&
      longitude >= VIETNAM_BOUNDS.minLng &&
      longitude <= VIETNAM_BOUNDS.maxLng
    );
  }, []);

  // Update marker position and notify parent
  const updatePosition = useCallback(
    (newLat: number, newLng: number, newAddress?: string) => {
      if (disabled) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      }
      onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)), newAddress);
    },
    [disabled, onChange]
  );

  const updatePositionRef = useRef(updatePosition);
  const disabledRef = useRef(disabled);
  const initialLatRef = useRef(lat);
  const initialLngRef = useRef(lng);

  useEffect(() => {
    updatePositionRef.current = updatePosition;
  }, [updatePosition]);

  useEffect(() => {
    disabledRef.current = disabled;
    const marker = markerRef.current;
    if (!marker?.dragging) return;
    if (disabled) {
      marker.dragging.disable();
    } else {
      marker.dragging.enable();
    }
  }, [disabled]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] =
      initialLatRef.current !== null &&
      initialLngRef.current !== null &&
      isValidVietnamCoords(initialLatRef.current, initialLngRef.current)
        ? [initialLatRef.current, initialLngRef.current]
        : DEFAULT_CENTER;

    const initialZoom =
      initialLatRef.current !== null && initialLngRef.current !== null
        ? 15
        : 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    if (MAPBOX_ACCESS_TOKEN) {
      L.tileLayer(buildMapboxTileUrl(), {
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> '
          + '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 22,
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(map);
    } else {
      setSearchStatus(
        'Bản đồ chưa được cấu hình. Hãy thêm VITE_MAPBOX_ACCESS_TOKEN vào env.',
      );
    }

    const marker = L.marker(initialCenter, {
      draggable: !disabledRef.current,
      icon: createPinIcon(),
    }).addTo(map);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      updatePositionRef.current(position.lat, position.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!disabledRef.current) {
        updatePositionRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isValidVietnamCoords]);

  // Synchronize map when incoming lat/lng change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (lat === null || lng === null || !isValidVietnamCoords(lat, lng)) return;

    const currentPos = markerRef.current.getLatLng();
    const diffLat = Math.abs(currentPos.lat - lat);
    const diffLng = Math.abs(currentPos.lng - lng);

    // Only update if difference is meaningful to prevent infinite loop
    if (diffLat > 0.0001 || diffLng > 0.0001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [lat, lng, isValidVietnamCoords]);

  // Geolocation: Find device location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchStatus('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    setIsLocating(true);
    setSearchStatus('Đang xác định vị trí hiện tại...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (isValidVietnamCoords(latitude, longitude)) {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16);
          }
          updatePosition(latitude, longitude);
          setSearchStatus('Đã định vị thành công vị trí hiện tại.');
        } else {
          setSearchStatus('Vị trí định vị nằm ngoài phạm vi hỗ trợ Việt Nam.');
        }
      },
      (err) => {
        setIsLocating(false);
        setSearchStatus(`Không thể lấy vị trí: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Geocoding: Search lat/lng from typed address using Mapbox Geocoding API
  const handleSearchFromAddress = async () => {
    const query = address?.trim();
    if (!query || query.length < 5) {
      setSearchStatus('Vui lòng nhập địa chỉ cụ thể trước khi tìm kiếm.');
      return;
    }
    if (!MAPBOX_ACCESS_TOKEN) {
      setSearchStatus(
        'Bản đồ chưa được cấu hình. Hãy thêm VITE_MAPBOX_ACCESS_TOKEN vào env.',
      );
      return;
    }

    setIsGeocoding(true);
    setSearchStatus('Đang tìm kiếm tọa độ từ địa chỉ...');

    try {
      const response = await fetch(buildMapboxGeocodingUrl(query));

      if (!response.ok) {
        throw new Error('Lỗi kết nối dịch vụ định vị');
      }

      const found = parseMapboxGeocodingResponse(await response.json());

      if (found && isValidVietnamCoords(found.latitude, found.longitude)) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([found.latitude, found.longitude], 16);
        }
        updatePosition(found.latitude, found.longitude);
        const displayName = found.displayName
          ? found.displayName.split(',').slice(0, 3).join(',')
          : 'vị trí đã chọn';
        setSearchStatus(`Đã tìm thấy: ${displayName}`);
      } else if (found) {
        setSearchStatus('Kết quả nằm ngoài phạm vi Việt Nam.');
      } else {
        setSearchStatus('Không tìm thấy tọa độ cho địa chỉ này. Bạn hãy bấm chọn trực tiếp trên bản đồ.');
      }
    } catch {
      setSearchStatus('Không thể tìm kiếm tọa độ tự động. Vui lòng bấm trực tiếp trên bản đồ.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const hasCoordinates = lat !== null && lng !== null && isValidVietnamCoords(lat, lng);

  return (
    <div className="space-y-3">
      {/* Map toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          💡 Click hoặc kéo ghim đỏ trên bản đồ để chọn vị trí chính xác:
        </span>
        <div className="flex items-center gap-2">
          {address && address.trim().length >= 5 && (
            <button
              type="button"
              onClick={handleSearchFromAddress}
              disabled={disabled || isGeocoding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {isGeocoding ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Tìm theo địa chỉ
            </button>
          )}

          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={disabled || isLocating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {isLocating ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            Vị trí hiện tại
          </button>
        </div>
      </div>

      {/* Map display */}
      <div
        ref={mapContainerRef}
        className="relative h-64 w-full overflow-hidden rounded-xl border border-gray-300 shadow-inner dark:border-gray-700"
        style={{ minHeight: '260px' }}
      />

      {/* Status indicator */}
      {searchStatus && (
        <p className="text-xs text-blue-600 dark:text-blue-400">{searchStatus}</p>
      )}

      {/* Selected coordinates indicator */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              hasCoordinates ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span>
            {hasCoordinates
              ? `Tọa độ đã chọn: ${lat?.toFixed(5)}, ${lng?.toFixed(5)}`
              : 'Chưa chọn tọa độ hợp lệ'}
          </span>
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Phạm vi: Việt Nam (8°–24°N, 102°–110°E)
        </span>
      </div>
    </div>
  );
};

export default LocationPicker;
