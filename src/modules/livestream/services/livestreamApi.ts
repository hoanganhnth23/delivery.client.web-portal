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
}

interface StartLivestreamResponse {
  token: string;
  uid: number;
  channelName: string;
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
};
