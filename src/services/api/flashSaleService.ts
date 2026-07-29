import apiClient, { handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import {
  requireArray,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './contract';

const CAMPAIGN_STATUSES = ['UPCOMING', 'ACTIVE', 'ENDED'] as const;
const ITEM_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export interface FlashSaleCampaign {
  id: number;
  name: string;
  isRecurring: boolean;
  startTime: string; // HH:mm:ss for recurring or YYYY-MM-DDTHH:mm:ss for one-off
  endTime: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
}

export interface FlashSaleItem {
  id: number;
  campaignId: number;
  restaurantId: number;
  menuItemId: number;
  originalPrice: number;
  flashSalePrice: number;
  stockQuantity: number;
  soldQuantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CreateFlashSaleCampaignRequest {
  name: string;
  isRecurring: boolean;
  startTime: string;
  endTime: string;
}

export type FlashSaleCampaignStatus = FlashSaleCampaign['status'];

const parseCampaign = (value: unknown, label: string): FlashSaleCampaign => {
  const campaign = requireRecord(value, label);
  return {
    id: requireInteger(campaign.id, `${label}.id`, 1),
    name: requireString(campaign.name, `${label}.name`),
    isRecurring: requireBoolean(campaign.isRecurring, `${label}.isRecurring`),
    startTime: requireString(campaign.startTime, `${label}.startTime`),
    endTime: requireString(campaign.endTime, `${label}.endTime`),
    status: requireEnum(campaign.status, CAMPAIGN_STATUSES, `${label}.status`),
  };
};

const parseItem = (value: unknown, label: string): FlashSaleItem => {
  const item = requireRecord(value, label);
  return {
    id: requireInteger(item.id, `${label}.id`, 1),
    campaignId: requireInteger(item.campaignId, `${label}.campaignId`, 1),
    restaurantId: requireInteger(item.restaurantId, `${label}.restaurantId`, 1),
    menuItemId: requireInteger(item.menuItemId, `${label}.menuItemId`, 1),
    originalPrice: requireNumber(item.originalPrice, `${label}.originalPrice`),
    flashSalePrice: requireNumber(item.flashSalePrice, `${label}.flashSalePrice`),
    stockQuantity: requireInteger(item.stockQuantity, `${label}.stockQuantity`),
    soldQuantity: requireInteger(item.soldQuantity, `${label}.soldQuantity`),
    status: requireEnum(item.status, ITEM_STATUSES, `${label}.status`),
  };
};

export const flashSaleAdminService = {
  // Campaigns
  getAllCampaigns: async (): Promise<FlashSaleCampaign[]> => {
    const response = await apiClient.get(API_ENDPOINTS.FLASHSALE.ADMIN.GET_ALL_CAMPAIGNS);
    return requireArray(handleResponse(response), 'flash sale campaigns', parseCampaign);
  },

  createCampaign: async (data: CreateFlashSaleCampaignRequest): Promise<FlashSaleCampaign> => {
    const response = await apiClient.post(API_ENDPOINTS.FLASHSALE.ADMIN.CREATE_CAMPAIGN, data);
    return parseCampaign(handleResponse(response), 'flash sale campaign');
  },

  updateCampaignStatus: async (id: number, status: FlashSaleCampaignStatus): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.UPDATE_CAMPAIGN_STATUS(id), null, {
      params: { status },
    });
  },

  getCampaignItems: async (campaignId: number): Promise<FlashSaleItem[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.FLASHSALE.ADMIN.GET_CAMPAIGN_ITEMS(campaignId),
    );
    return requireArray(handleResponse(response), 'flash sale items', parseItem);
  },

  approveItem: async (id: number): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.APPROVE_ITEM(id));
  },
};
