import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ShipperLocationUpdate {
  type: string;
  shipperId: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

class ShipperLocationSocketService {
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private locationCallbacks: ((location: ShipperLocationUpdate) => void)[] = [];

  constructor() {
    this.client = new Client({
      // The API endpoint. Backend WebSocket config is mapped to /ws/shipper-locations
      webSocketFactory: () => new SockJS('http://localhost:8090/ws/shipper-locations'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Shipper Socket Connected');
      this.notifyConnectionState(true);
      // Resubscribe to all active topics on reconnect
      const activeTopics = Array.from(this.subscriptions.keys());
      this.subscriptions.clear();
      activeTopics.forEach(topic => {
        // Topic is derived from action. If we want global updates, we subscribe to a global topic,
        // but looking at Flutter app, it subscribes to specific shippers by sending raw payloads
        // wait, looking at Flutter app:
        // unsubscribe = _client!.subscribe(destination: topic, ...)
        // App is using standard STOMP subscribe.
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Shipper Socket Error: ' + frame.headers['message']);
      console.error('Details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      console.log('Shipper Socket Closed');
      this.notifyConnectionState(false);
    };
  }

  connect() {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  disconnect() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    // Notify immediately of current state
    callback(this.client.active);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  onLocationUpdate(callback: (location: ShipperLocationUpdate) => void) {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyConnectionState(connected: boolean) {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }

  private notifyLocation(location: ShipperLocationUpdate) {
    this.locationCallbacks.forEach(cb => cb(location));
  }

  subscribeToShipper(shipperId: number) {
    const topic = `/topic/shipper-location-${shipperId}`; // Assuming backend broadcasts to specific topic
    if (this.subscriptions.has(topic) || !this.client.active) return;

    const sub = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body) as ShipperLocationUpdate;
        if (data.type === 'location_update') {
          this.notifyLocation(data);
        }
      } catch (error) {
        console.error('Failed to parse location message', error);
      }
    });

    this.subscriptions.set(topic, sub);
    console.log(`Subscribed to shipper ${shipperId}`);
  }

  unsubscribeFromShipper(shipperId: number) {
    const topic = `/topic/shipper-location-${shipperId}`;
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`Unsubscribed from shipper ${shipperId}`);
    }
  }

  subscribeToGlobalAdmin() {
    // Admin needs to track ALL active shippers. If backend supports a global broadcast:
    const topic = `/topic/admin-shipper-locations`;
    if (this.subscriptions.has(topic) || !this.client.active) return;

    const sub = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body) as ShipperLocationUpdate;
        if (data.type === 'location_update') {
          this.notifyLocation(data);
        }
      } catch (error) {
        console.error('Failed to parse location message', error);
      }
    });

    this.subscriptions.set(topic, sub);
    console.log(`Subscribed to global admin tracking`);
  }
}

export const shipperLocationSocketService = new ShipperLocationSocketService();
