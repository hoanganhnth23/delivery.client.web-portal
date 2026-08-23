import apiClient, { handleError, handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import {
  optionalText,
  requireBoolean,
  requireInteger,
  requireNumberRange,
  requireRecord,
  requireString,
  requireTimestamp,
} from './contract';
import type { UserAddress } from '@/types/api.types';

export interface UserAddressInput {
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

const optionalCoordinate = (value: unknown, label: string, min: number, max: number): number | undefined => {
  if (value === null || value === undefined) return undefined;
  return requireNumberRange(value, label, min, max);
};

export const formatAddress = (address: Pick<UserAddress, 'addressLine' | 'ward' | 'district' | 'city'>): string =>
  [address.addressLine, address.ward, address.district, address.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

export const parseUserAddress = (value: unknown, label = 'address'): UserAddress => {
  const address = requireRecord(value, label);
  const postalCode = optionalText(address.postalCode, `${label}.postalCode`);
  const createdAt = address.createdAt === undefined || address.createdAt === null
    ? undefined
    : requireTimestamp(address.createdAt, `${label}.createdAt`);
  const updatedAt = address.updatedAt === undefined || address.updatedAt === null
    ? undefined
    : requireTimestamp(address.updatedAt, `${label}.updatedAt`);
  const isDefault = address.isDefault === undefined || address.isDefault === null
    ? undefined
    : requireBoolean(address.isDefault, `${label}.isDefault`);
  const latitude = optionalCoordinate(address.latitude, `${label}.latitude`, -90, 90);
  const longitude = optionalCoordinate(address.longitude, `${label}.longitude`, -180, 180);

  return {
    id: requireInteger(address.id, `${label}.id`, 1),
    userId: requireInteger(address.userId, `${label}.userId`, 1),
    label: requireString(address.label, `${label}.label`),
    recipientName: requireString(address.recipientName, `${label}.recipientName`),
    phoneNumber: requireString(address.phoneNumber, `${label}.phoneNumber`),
    addressLine: requireString(address.addressLine, `${label}.addressLine`),
    ward: requireString(address.ward, `${label}.ward`),
    district: requireString(address.district, `${label}.district`),
    city: requireString(address.city, `${label}.city`),
    ...(postalCode === null ? {} : { postalCode }),
    ...(latitude === undefined ? {} : { latitude }),
    ...(longitude === undefined ? {} : { longitude }),
    ...(isDefault === undefined ? {} : { isDefault }),
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  };
};

export const getUserAddresses = async (userId: number): Promise<UserAddress[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.ADDRESS.LIST(userId));
    const value = handleResponse(response);
    if (!Array.isArray(value)) throw new Error('addresses must be an array');
    return value.map((item, index) => parseUserAddress(item, `addresses[${index}]`));
  } catch (error) {
    throw handleError(error);
  }
};

export const createAddress = async (userId: number, input: UserAddressInput): Promise<UserAddress> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ADDRESS.CREATE(userId), input);
    return parseUserAddress(handleResponse(response));
  } catch (error) {
    throw handleError(error);
  }
};

export const updateAddress = async (id: number, input: UserAddressInput): Promise<UserAddress> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.ADDRESS.UPDATE(id), input);
    return parseUserAddress(handleResponse(response));
  } catch (error) {
    throw handleError(error);
  }
};

export const deleteAddress = async (id: number): Promise<void> => {
  try {
    const response = await apiClient.delete(API_ENDPOINTS.ADDRESS.DELETE(id));
    handleResponse<void>(response);
  } catch (error) {
    throw handleError(error);
  }
};

export const setDefaultAddress = async (id: number): Promise<UserAddress> => {
  try {
    const response = await apiClient.patch(API_ENDPOINTS.ADDRESS.SET_DEFAULT(id));
    return parseUserAddress(handleResponse(response));
  } catch (error) {
    throw handleError(error);
  }
};

export default {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
