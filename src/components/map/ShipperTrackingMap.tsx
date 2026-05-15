import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { shipperLocationSocketService, ShipperLocationUpdate } from '@/services/tracking/shipperLocationSocket';
import adminService, { AdminShipper } from '@/services/api/adminService';
import { toast } from 'react-hot-toast';

// Custom Shipper Icon
const shipperIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991201.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const ShipperTrackingMap = () => {
  const [shippers, setShippers] = useState<AdminShipper[]>([]);
  const [locations, setLocations] = useState<Map<number, ShipperLocationUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    // 1. Fetch all online shippers
    const fetchShippers = async () => {
      try {
        const data = await adminService.fetchOnlineShippers();
        setShippers(data);
      } catch (error) {
        toast.error('Failed to load online shippers');
      }
    };

    fetchShippers();

    // 2. Setup socket connection
    shipperLocationSocketService.connect();

    const unsubConnection = shipperLocationSocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        // Assume backend sends all updates to a global topic for admin tracking
        shipperLocationSocketService.subscribeToGlobalAdmin();
        // Fallback: If no global topic, subscribe to individual shippers (would need loop)
        // shippers.forEach(s => shipperLocationSocketService.subscribeToShipper(s.id));
      }
    });

    const unsubLocation = shipperLocationSocketService.onLocationUpdate((loc) => {
      setLocations(prev => {
        const next = new Map(prev);
        next.set(loc.shipperId, loc);
        return next;
      });
    });

    return () => {
      unsubConnection();
      unsubLocation();
      shipperLocationSocketService.disconnect();
    };
  }, []);

  const defaultCenter: [number, number] = [21.028511, 105.804817]; // Hanoi by default

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
      <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Realtime Shipper Tracking</h2>
          <p className="text-sm text-gray-500">Live positions of {shippers.length} online shippers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {isConnected ? 'LIVE CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 relative z-0 min-h-[500px]">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {Array.from(locations.values()).map(loc => {
            const shipper = shippers.find(s => s.id === loc.shipperId);
            return (
              <Marker 
                key={loc.shipperId} 
                position={[loc.latitude, loc.longitude]} 
                icon={shipperIcon}
              >
                <Popup>
                  <div className="font-bold text-gray-900">{shipper?.fullName || `Shipper #${loc.shipperId}`}</div>
                  <div className="text-xs text-gray-500">{shipper?.vehicleType} - {shipper?.licensePlate}</div>
                  <div className="text-xs text-blue-600 mt-1">Speed: {loc.speed ? Math.round(loc.speed * 3.6) : 0} km/h</div>
                  <div className="text-[10px] text-gray-400 mt-1">Updated: {new Date(loc.timestamp).toLocaleTimeString()}</div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
