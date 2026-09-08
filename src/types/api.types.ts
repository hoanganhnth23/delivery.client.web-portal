/**
 * API Types
 * Centralized type definitions cho toàn bộ application
 */

// ============================================
// GENERIC TYPES
// ============================================

/**
 * Generic API Response Structure
 * Backend bắt buộc trả về format này
 */
export interface BaseResponse<T = unknown> {
  status: 1 | 0; // 1 = success, 0 = error
  data: T;
  message: string | null;
  error?: {
    code?: string;
    details?: unknown;
  } | null;
}

/**
 * Generic Action Result (cho hooks)
 * Trả về từ các action functions trong custom hooks
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Pagination Data Structure
 */
export interface PageData<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

// ============================================
// RESTAURANT TYPES
// ============================================

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone: string;
  openingHour: string;
  closingHour: string;
  image: string;
  addressLat: number;
  addressLng: number;
  description: string;
  open: boolean;
  createdAt?: string;
  updatedAt?: string;
  rating?: number;
  ratingCount?: number;
}

// Specific Response Types
export type RestaurantResponse = BaseResponse<Restaurant>;
export type RestaurantListResponse = BaseResponse<Restaurant[]>;

// Specific Action Result Types
export type RestaurantActionResult = ActionResult<Restaurant>;
export type RestaurantListActionResult = ActionResult<Restaurant[]>;

// ============================================
// MENU ITEM TYPES
// ============================================

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  image: string;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'DISCONTINUED';
  createdAt?: string;
  updatedAt?: string;
}

// Specific Response Types
export type MenuItemResponse = BaseResponse<MenuItem>;
export type MenuItemListResponse = BaseResponse<MenuItem[]>;

// Specific Action Result Types
export type MenuItemActionResult = ActionResult<MenuItem>;
export type MenuItemListActionResult = ActionResult<MenuItem[]>;

// ============================================
// DELETE TYPES
// ============================================

export interface DeleteData {
  id: number;
  message: string;
}

export type DeleteResponse = BaseResponse<DeleteData>;
export type DeleteActionResult = ActionResult<DeleteData>;

// ============================================
// AUTH TYPES (for future use)
// ============================================
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface UserAddress {
  id: number;
  userId: number;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutPreviewItem {
  menuItemId: number;
  menuItemName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutPreview {
  quoteId: string;
  expiresAt: string;
  restaurantId: number;
  restaurantName: string;
  items: CheckoutPreviewItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  couponCode?: string;
  couponMessage?: string;
  voucherId?: number;
  selectedVoucherIds?: number[];
  selectionMode?: 'AUTO' | 'MANUAL';
  itemDiscount?: number;
  shippingDiscount?: number;
  customerShippingFee?: number;
  grossShippingFee?: number;
  platformSubsidy?: number;
  shopDiscount?: number;
  appliedVouchers?: Array<{
    voucherId: number;
    code: string;
    layer: string;
    fundingSource: string;
    discountBase: number;
    discountAmount: number;
  }>;
  priceChanges: Array<{
    menuItemId: number;
    menuItemName: string;
    oldPrice?: number;
    newPrice: number;
  }>;
  unavailableItemIds: number[];
}

export interface CheckoutPreviewRequest {
  restaurantId: number;
  deliveryLat: number;
  deliveryLng: number;
  items: Array<{ menuItemId: number; quantity: number }>;
  selectedVoucherIds?: number[];
  selectionMode?: 'AUTO' | 'MANUAL';
}

export interface CreateCustomerOrderRequest {
  quoteId: string;
  restaurantId: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: 'COD';
  notes?: string;
  voucherIds?: number[];
  selectionMode?: 'AUTO' | 'MANUAL';
  items: Array<{ menuItemId: number; quantity: number; notes?: string }>;
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone?: string;
  restaurantLat: number;
  restaurantLng: number;
  shipperId?: number;
  subtotalPrice: number;
  discountAmount: number;
  shippingFee: number;
  totalPrice: number;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'FINDING_SHIPPER'
    | 'WAIT_SHIPPER_CONFIRM'
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'DELIVERING'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'SHIPPER_NOT_FOUND';
  paymentMethod: 'COD';
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  pickupLat: number;
  pickupLng: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// Specific Response Types
export type OrderResponse = BaseResponse<Order>;
export type OrderListResponse = BaseResponse<PageData<Order>>;

// Specific Action Result Types
export type OrderActionResult = ActionResult<Order>;
export type OrderListActionResult = ActionResult<PageData<Order>>;
