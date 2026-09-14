import { beforeEach, describe, expect, it } from 'vitest';
import { buildMenuItem, buildRestaurant } from '@/test/builders';
import {
  addMenuItemToCart,
  addLivestreamItemToCart,
  cartItemCount,
  readCustomerCart,
  updateCartItemQuantity,
  writeCustomerCart,
} from '../cart/cart';

describe('customer cart contract', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps one restaurant per cart and requires explicit replacement', () => {
    const restaurantA = buildRestaurant({ id: 201, name: 'Bếp A' });
    const restaurantB = buildRestaurant({ id: 202, name: 'Bếp B' });
    const itemA = buildMenuItem({ id: 301, restaurantId: 201 });
    const itemB = buildMenuItem({ id: 302, restaurantId: 202 });
    const first = addMenuItemToCart(null, restaurantA, itemA);
    expect(first.changed).toBe(true);
    const second = addMenuItemToCart(first.cart, restaurantB, itemB);
    expect(second.changed).toBe(false);
    expect(second.requiresRestaurantConfirmation).toBe(true);
    expect(second.cart?.restaurantId).toBe(201);
  });

  it('persists valid cart data and removes an item when quantity drops below one', () => {
    const restaurant = buildRestaurant();
    const item = buildMenuItem();
    const result = addMenuItemToCart(null, restaurant, item);
    writeCustomerCart(result.cart);
    expect(cartItemCount(readCustomerCart())).toBe(1);
    expect(updateCartItemQuantity(result.cart!, item.id, 0)).toBeNull();
  });

  it('discards malformed local storage instead of trusting it at checkout', () => {
    window.localStorage.setItem('delivery.customer-cart.v1', JSON.stringify({ restaurantId: 0, items: [] }));
    expect(readCustomerCart()).toBeNull();
    expect(window.localStorage.getItem('delivery.customer-cart.v1')).toBeNull();
  });

  it('keeps livestream context for a live item and clears it for normal catalog additions', () => {
    const restaurant = buildRestaurant({ id: 201, name: 'Bếp A' });
    const liveItem = buildMenuItem({ id: 301, restaurantId: 201 });
    const normalItem = buildMenuItem({ id: 302, restaurantId: 201 });
    const live = addLivestreamItemToCart(null, restaurant, liveItem, '00000000-0000-4000-8000-000000000001');
    expect(live.cart?.livestreamId).toBe('00000000-0000-4000-8000-000000000001');
    expect(addMenuItemToCart(live.cart, restaurant, normalItem).cart?.livestreamId).toBeUndefined();
  });
});
