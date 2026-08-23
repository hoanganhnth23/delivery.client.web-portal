import apiClient, { handleError, handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { requireArray, requireBoolean, requireInteger, requireNumber, requireRecord, requireString } from './contract';

export interface CustomerVoucher {
  id: number;
  code: string;
  name: string;
  description: string;
  creatorType: 'PLATFORM' | 'SHOP';
  rewardType: 'FIXED' | 'PERCENTAGE' | 'FREESHIP';
  discountValue: number;
  maxDiscountValue: number | null;
  minOrderValue: number;
  scopeType: 'ALL' | 'SHOP';
  scopeRefId: number | null;
  active: boolean;
  layer?: 'SHOP_DISCOUNT' | 'PLATFORM_DISCOUNT' | 'FREESHIP';
  fundingSource?: 'SHOP' | 'PLATFORM';
  approvalStatus?: string;
  endTime?: string;
}

export interface VoucherCapability {
  enabled: boolean;
  maxVouchers: number;
  layers: string[];
  selectionModes: string[];
  conflictsWithFlashSale: boolean;
}

const parseVoucher = (value: unknown, label: string): CustomerVoucher => {
  const item = requireRecord(value, label);
  return {
    id: requireInteger(item.id, `${label}.id`, 1),
    code: requireString(item.code, `${label}.code`),
    name: requireString(item.name, `${label}.name`),
    description: typeof item.description === 'string' ? item.description : '',
    creatorType: item.creatorType === 'SHOP' ? 'SHOP' : 'PLATFORM',
    rewardType: item.rewardType === 'PERCENTAGE' || item.rewardType === 'FREESHIP' ? item.rewardType : 'FIXED',
    discountValue: requireNumber(item.discountValue, `${label}.discountValue`),
    maxDiscountValue: item.maxDiscountValue == null ? null : requireNumber(item.maxDiscountValue, `${label}.maxDiscountValue`),
    minOrderValue: requireNumber(item.minOrderValue ?? 0, `${label}.minOrderValue`),
    scopeType: item.scopeType === 'SHOP' ? 'SHOP' : 'ALL',
    scopeRefId: item.scopeRefId == null ? null : requireInteger(item.scopeRefId, `${label}.scopeRefId`, 1),
    active: requireBoolean(item.active, `${label}.active`),
    ...(typeof item.layer === 'string' ? { layer: item.layer as CustomerVoucher['layer'] } : {}),
    ...(typeof item.fundingSource === 'string' ? { fundingSource: item.fundingSource as CustomerVoucher['fundingSource'] } : {}),
    ...(typeof item.approvalStatus === 'string' ? { approvalStatus: item.approvalStatus } : {}),
    ...(typeof item.endTime === 'string' ? { endTime: item.endTime } : {}),
  };
};

const parseCapability = (value: unknown): VoucherCapability => {
  const item = requireRecord(value, 'voucher capability');
  return {
    enabled: requireBoolean(item.enabled, 'voucher capability.enabled'),
    maxVouchers: requireInteger(item.maxVouchers, 'voucher capability.maxVouchers', 1),
    layers: requireArray(item.layers, 'voucher capability.layers', (entry, label) => requireString(entry, label)),
    selectionModes: requireArray(item.selectionModes, 'voucher capability.selectionModes', (entry, label) => requireString(entry, label)),
    conflictsWithFlashSale: requireBoolean(item.conflictsWithFlashSale, 'voucher capability.conflictsWithFlashSale'),
  };
};

export const getMyVouchers = async (): Promise<CustomerVoucher[]> => {
  try { return requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.PROMOTION.MY_VOUCHERS)), 'my vouchers', parseVoucher); }
  catch (error) { throw handleError(error); }
};

export const getVoucherCapability = async (): Promise<VoucherCapability> => {
  try { return parseCapability(handleResponse(await apiClient.get(API_ENDPOINTS.PROMOTION.CAPABILITY))); }
  catch (error) { throw handleError(error); }
};

export const collectVoucher = async (code: string): Promise<void> => {
  try { handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.COLLECT(code.trim().toUpperCase()))); }
  catch (error) { throw handleError(error); }
};

export interface CreateShopVoucherRequest {
  code: string;
  name: string;
  description?: string;
  rewardType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  maxDiscountValue?: number | null;
  totalQuantity: number;
  usageLimitPerUser: number;
  startTime: string;
  endTime: string;
  minOrderValue: number;
  restaurantId: number;
}

export const createShopVoucher = async (request: CreateShopVoucherRequest): Promise<CustomerVoucher> => {
  try { return parseVoucher(handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.CREATE_SHOP, request)), 'shop voucher'); }
  catch (error) { throw handleError(error); }
};

export const listShopVouchers = async (): Promise<CustomerVoucher[]> => {
  try { return requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.PROMOTION.SHOP_LIST)), 'shop vouchers', parseVoucher); }
  catch (error) { throw handleError(error); }
};
