/**
 * Livestream API Service
 * Xử lý tất cả API calls liên quan đến livestream
 */

import apiClient, { handleResponse, handleError } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';

// ============================================
// TYPES
// ============================================

// Stream Provider enum
export enum StreamProvider {
  AGORA = 'AGORA',
  // Có thể thêm các provider khác: ZOOM, YOUTUBE, etc.
}

// Request payload cho create livestream
export interface CreateLivestreamRequest {
  title: string;
  description?: string;
  restaurantId: number;
  streamProvider: StreamProvider;
}

interface CreateLivestreamResponse {
  roomId: string;
  channelName: string;
  id: string; // UUID của livestream
  status: LivestreamStatus;
}

interface StartLivestreamResponse {
  token: string;
  uid: number;
  channelName: string;
}

// Livestream status từ backend
export enum LivestreamStatus {
  CREATED = 'CREATED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
}

// Livestream response từ backend
export interface LivestreamResponse {
  id: string; // UUID
  sellerId: number;
  restaurantId: number;
  title: string;
  description?: string;
  status: LivestreamStatus;
  streamProvider: StreamProvider;
  roomId: string;
  channelName: string;
  startedAt?: string; // ISO date string
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API FUNCTIONS
// ============================================

export const livestreamApi = {
  /**
   * Tạo livestream (phòng logic)
   * POST /api/livestreams
   * @param request - Thông tin livestream (title, description, restaurantId, streamProvider)
   */
  async createLivestream(request: CreateLivestreamRequest): Promise<CreateLivestreamResponse> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LIVESTREAM.CREATE,
        request
      );
      return handleResponse<CreateLivestreamResponse>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Bắt đầu livestream
   * POST /api/livestreams/{id}/start
   */
  async startLivestream(livestreamId: string): Promise<StartLivestreamResponse> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LIVESTREAM.START(livestreamId)
      );
      return handleResponse<StartLivestreamResponse>(response);
    } catch (error) {
      throw handleError(error);
    }
  },
  async joinLivestream(livestreamId: string): Promise<StartLivestreamResponse> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LIVESTREAM.JOINT(livestreamId)
      );
      return handleResponse<StartLivestreamResponse>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Kết thúc livestream
   * POST /api/livestreams/{id}/end
   */
  async endLivestream(livestreamId: string): Promise<void> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.LIVESTREAM.END(livestreamId)
      );
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Lấy chi tiết livestream theo ID
   * GET /api/livestreams/{id}
   */
  async getLivestreamDetail(livestreamId: string): Promise<LivestreamResponse> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.LIVESTREAM.GET_BY_ID(livestreamId)
      );
      return handleResponse<LivestreamResponse>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Lấy danh sách livestream của seller
   * GET /api/livestreams/seller/{sellerId}
   */
  async getLivestreamsBySeller(sellerId: number): Promise<LivestreamResponse[]> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.LIVESTREAM.GET_BY_SELLER(sellerId)
      );
      return handleResponse<LivestreamResponse[]>(response);
    } catch (error) {
      throw handleError(error);
    }
  },
};
