import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildMapboxTileUrl, MAPBOX_ACCESS_TOKEN } from '@/components/maps/mapboxConfig';

export default function ShipperMap({ missing = false, delivering = false }: { missing?: boolean; delivering?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ref.current || missing || !MAPBOX_ACCESS_TOKEN) return;
    const map = L.map(ref.current, { zoomControl: false, scrollWheelZoom: false }).setView([20.984, 105.789], 14);
    L.tileLayer(buildMapboxTileUrl(), { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18 })
      .on('tileerror', () => setFailed(true)).addTo(map);
    const coordinates: [number, number][] = [[20.9711,105.7782],[20.977,105.784],[20.99,105.796],[20.996,105.803]];
    map.fitBounds(L.latLngBounds(coordinates), { padding: [34,34] });
    L.polyline(coordinates, { color: '#ee4d2d', weight: 5, dashArray: '8 7' }).addTo(map);
    coordinates.filter((_, i) => i === 0 || i === 3).forEach((point, i) => L.marker(point, { icon: L.divIcon({ className: 'sp-map-pin', html: i ? 'B' : 'A', iconSize: [32,32] }) }).addTo(map));
    L.circleMarker(coordinates[delivering ? 2 : 1], { color: 'white', weight: 4, fillColor: '#2878ce', fillOpacity: 1, radius: 10 }).addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(ref.current);
    return () => { resize.disconnect(); map.remove(); };
  }, [missing, delivering]);
  return <div className="sp-map-wrap"><div ref={ref} className="sp-map" aria-label="Bản đồ chuyến giao Hà Đông" />
    {(missing || !MAPBOX_ACCESS_TOKEN || failed) && <div className="sp-map-fallback"><span className="material-symbols-outlined">map</span><b>{failed ? 'Không tải được bản đồ' : 'Bản đồ chưa được cấu hình'}</b><p>Bạn vẫn có thể xem địa chỉ và thông tin chuyến.</p></div>}
    <span className="sp-map-note">Tuyến đường minh họa</span></div>;
}
