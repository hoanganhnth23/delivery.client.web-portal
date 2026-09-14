import type { MenuItem, Restaurant } from '@/types/api.types';

export const CUSTOMER_CART_STORAGE_KEY = 'delivery.customer-cart.v1';

export interface CustomerCartItem {
  menuItemId: number;
  restaurantId: number;
  restaurantName: string;
  menuItemName: string;
  image?: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface CustomerCart {
  livestreamId?: string;
  restaurantId: number;
  restaurantName: string;
  items: CustomerCartItem[];
}

export interface AddToCartResult {
  changed: boolean;
  requiresRestaurantConfirmation: boolean;
  cart: CustomerCart | null;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const livestreamUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isCartItem = (value: unknown): value is CustomerCartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<CustomerCartItem>;
  return isPositiveInteger(item.menuItemId) &&
    isPositiveInteger(item.restaurantId) &&
    typeof item.restaurantName === 'string' &&
    typeof item.menuItemName === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    isPositiveInteger(item.quantity) &&
    item.quantity <= 99 &&
    (item.image === undefined || typeof item.image === 'string') &&
    (item.notes === undefined || typeof item.notes === 'string');
};

const isCart = (value: unknown): value is CustomerCart => {
  if (typeof value !== 'object' || value === null) return false;
  const cart = value as Partial<CustomerCart>;
  return isPositiveInteger(cart.restaurantId) &&
    (cart.livestreamId === undefined || (typeof cart.livestreamId === 'string' && livestreamUuid.test(cart.livestreamId))) &&
    typeof cart.restaurantName === 'string' &&
    Array.isArray(cart.items) &&
    cart.items.length > 0 &&
    cart.items.every(isCartItem) &&
    cart.items.every((item) => item.restaurantId === cart.restaurantId);
};

export const readCustomerCart = (): CustomerCart | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isCart(parsed)) {
      window.localStorage.removeItem(CUSTOMER_CART_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(CUSTOMER_CART_STORAGE_KEY);
    return null;
  }
};

export const writeCustomerCart = (cart: CustomerCart | null): void => {
  if (typeof window === 'undefined') return;
  if (!cart || cart.items.length === 0) {
    window.localStorage.removeItem(CUSTOMER_CART_STORAGE_KEY);
  } else {
    window.localStorage.setItem(CUSTOMER_CART_STORAGE_KEY, JSON.stringify(cart));
  }
  window.dispatchEvent(new Event('delivery:customer-cart-change'));
};

export const addMenuItemToCart = (
  current: CustomerCart | null,
  restaurant: Pick<Restaurant, 'id' | 'name'>,
  menuItem: Pick<MenuItem, 'id' | 'restaurantId' | 'name' | 'price' | 'image'>,
): AddToCartResult => {
  if (current && current.restaurantId !== restaurant.id) {
    return {
      changed: false,
      requiresRestaurantConfirmation: true,
      cart: current,
    };
  }
  const next: CustomerCart = current ?? {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    items: [],
  };
  const existing = next.items.find((item) => item.menuItemId === menuItem.id);
  const items = existing
    ? next.items.map((item) => item.menuItemId === menuItem.id
      ? { ...item, quantity: Math.min(99, item.quantity + 1), price: menuItem.price }
      : item)
    : [...next.items, {
      menuItemId: menuItem.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      menuItemName: menuItem.name,
      image: menuItem.image,
      price: menuItem.price,
      quantity: 1,
    }];
  return {
    changed: true,
    requiresRestaurantConfirmation: false,
    cart: { ...next, livestreamId: undefined, items },
  };
};

export const addLivestreamItemToCart = (
  current: CustomerCart | null,
  restaurant: Pick<Restaurant, 'id' | 'name'>,
  menuItem: Pick<MenuItem, 'id' | 'restaurantId' | 'name' | 'price' | 'image'>,
  livestreamId: string,
): AddToCartResult => {
  if (!livestreamUuid.test(livestreamId)) return { changed: false, requiresRestaurantConfirmation: false, cart: current };
  const result = addMenuItemToCart(current, restaurant, menuItem);
  return result.changed && result.cart ? { ...result, cart: { ...result.cart, livestreamId } } : result;
};

export const updateCartItemQuantity = (
  current: CustomerCart,
  menuItemId: number,
  quantity: number,
): CustomerCart | null => {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return removeCartItem(current, menuItemId);
  }
  return {
    ...current,
    items: current.items.map((item) => item.menuItemId === menuItemId
      ? { ...item, quantity: Math.min(99, quantity) }
      : item),
  };
};

export const updateCartItemNotes = (
  current: CustomerCart,
  menuItemId: number,
  notes: string,
): CustomerCart => ({
  ...current,
  items: current.items.map((item) => item.menuItemId === menuItemId
    ? { ...item, notes: notes.trim() || undefined }
    : item),
});

export const removeCartItem = (current: CustomerCart, menuItemId: number): CustomerCart | null => {
  const items = current.items.filter((item) => item.menuItemId !== menuItemId);
  return items.length === 0 ? null : { ...current, items };
};

export const cartItemCount = (cart: CustomerCart | null): number =>
  cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

export const cartDisplaySubtotal = (cart: CustomerCart | null): number =>
  cart?.items.reduce((total, item) => total + item.price * item.quantity, 0) ?? 0;
