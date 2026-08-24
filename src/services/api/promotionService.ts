import apiClient, { handleError, handleResponse } from './apiClient';
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

const VOUCHER_CREATOR_TYPES = ['PLATFORM', 'SHOP'] as const;
const VOUCHER_REWARD_TYPES = ['FIXED', 'PERCENTAGE', 'FREESHIP'] as const;
const VOUCHER_SCOPE_TYPES = ['ALL', 'SHOP'] as const;
const VOUCHER_LAYERS = ['SHOP_DISCOUNT', 'PLATFORM_DISCOUNT', 'FREESHIP'] as const;
const FUNDING_SOURCES = ['SHOP', 'PLATFORM'] as const;

const parseVoucher = (value: unknown, label: string): CustomerVoucher => {
  const item = requireRecord(value, label);
  const creatorType = requireEnum(item.creatorType, VOUCHER_CREATOR_TYPES, `${label}.creatorType`);
  const rewardType = requireEnum(item.rewardType, VOUCHER_REWARD_TYPES, `${label}.rewardType`);
  const scopeType = requireEnum(item.scopeType, VOUCHER_SCOPE_TYPES, `${label}.scopeType`);
  const scopeRefId = item.scopeRefId == null
    ? null
    : requireInteger(item.scopeRefId, `${label}.scopeRefId`, 1);
  if ((scopeType === 'ALL' && scopeRefId !== null) || (scopeType === 'SHOP' && scopeRefId === null)) {
    throw new Error(`${label} has an invalid voucher scope identity`);
  }
  const rawLayer = typeof item.layerCode === 'string'
    ? item.layerCode
    : typeof item.layer === 'string' ? item.layer : undefined;
  const layer = rawLayer === undefined ? undefined : requireEnum(rawLayer, VOUCHER_LAYERS, `${label}.layerCode`);
  const fundingSource = item.fundingSource === undefined
    ? undefined
    : requireEnum(item.fundingSource, FUNDING_SOURCES, `${label}.fundingSource`);
  return {
    id: requireInteger(item.id, `${label}.id`, 1),
    code: requireString(item.code, `${label}.code`),
    name: requireString(item.name, `${label}.name`),
    description: typeof item.description === 'string' ? item.description : '',
    creatorType,
    rewardType,
    discountValue: requireNumber(item.discountValue, `${label}.discountValue`),
    maxDiscountValue: item.maxDiscountValue == null ? null : requireNumber(item.maxDiscountValue, `${label}.maxDiscountValue`),
    minOrderValue: requireNumber(item.minOrderValue ?? 0, `${label}.minOrderValue`),
    scopeType,
    scopeRefId,
    active: requireBoolean(item.active, `${label}.active`),
    ...(layer ? { layer } : {}),
    ...(fundingSource ? { fundingSource } : {}),
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
