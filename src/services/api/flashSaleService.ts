import apiClient from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface FlashSaleCampaign {
  id: number;
  name: string;
  isRecurring: boolean;
  startTime: string; // HH:mm:ss for recurring or YYYY-MM-DDTHH:mm:ss for one-off
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
}

export interface FlashSaleItem {
  id: number;
  campaign: FlashSaleCampaign;
  restaurantId: number;
  menuItemId: number;
  menuItemName: string;
  originalPrice: number;
  flashSalePrice: number;
  stockQuantity: number;
  soldQuantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const flashSaleAdminService = {
  // Campaigns
  getAllCampaigns: async (): Promise<FlashSaleCampaign[]> => {
    const response = await apiClient.get(API_ENDPOINTS.FLASHSALE.ADMIN.GET_ALL_CAMPAIGNS);
    return response.data?.data || [];
  },

  createCampaign: async (data: Partial<FlashSaleCampaign>): Promise<FlashSaleCampaign> => {
    const response = await apiClient.post(API_ENDPOINTS.FLASHSALE.ADMIN.CREATE_CAMPAIGN, data);
    return response.data?.data;
  },

  updateCampaignStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.UPDATE_CAMPAIGN_STATUS(id) + `?status=${status}`);
  },

  // Items
  approveItem: async (id: number, status: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.APPROVE_ITEM(id) + `?status=${status}`);
  }
};

export const flashSaleMerchantService = {
  getMyItems: async (restaurantId: number): Promise<FlashSaleItem[]> => {
    const response = await apiClient.get(API_ENDPOINTS.FLASHSALE.MERCHANT.GET_MY_ITEMS + `?restaurantId=${restaurantId}`);
    return response.data?.data || [];
  },

  registerItem: async (data: any): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.FLASHSALE.MERCHANT.REGISTER_ITEM, data);
  }
};

export const flashSalePublicService = {
  getActiveCampaigns: async (): Promise<FlashSaleCampaign[]> => {
    const response = await apiClient.get(API_ENDPOINTS.FLASHSALE.PUBLIC.GET_ACTIVE_CAMPAIGNS);
    return response.data?.data || [];
  },

  getCampaignItems: async (campaignId: number): Promise<FlashSaleItem[]> => {
    const response = await apiClient.get(API_ENDPOINTS.FLASHSALE.PUBLIC.GET_CAMPAIGN_ITEMS(campaignId));
    return response.data?.data || [];
  }
};
