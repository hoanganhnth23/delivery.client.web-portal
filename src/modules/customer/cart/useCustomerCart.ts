import { useCallback, useEffect, useState } from 'react';
import type { MenuItem, Restaurant } from '@/types/api.types';
import {
  addMenuItemToCart,
  addLivestreamItemToCart,
  removeCartItem,
  readCustomerCart,
  updateCartItemNotes,
  updateCartItemQuantity,
  writeCustomerCart,
  type CustomerCart,
} from './cart';

export const useCustomerCart = () => {
  const [cart, setCart] = useState<CustomerCart | null>(() => readCustomerCart());

  const refresh = useCallback(() => setCart(readCustomerCart()), []);

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener('delivery:customer-cart-change', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('delivery:customer-cart-change', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const persist = useCallback((next: CustomerCart | null) => {
    writeCustomerCart(next);
    setCart(next);
  }, []);

  const add = useCallback((restaurant: Pick<Restaurant, 'id' | 'name'>, item: Pick<MenuItem, 'id' | 'restaurantId' | 'name' | 'price' | 'image'>) => {
    const result = addMenuItemToCart(cart, restaurant, item);
    if (result.changed) persist(result.cart);
    return result;
  }, [cart, persist]);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    if (cart) persist(updateCartItemQuantity(cart, menuItemId, quantity));
  }, [cart, persist]);

  const addFromLivestream = useCallback((restaurant: Pick<Restaurant, 'id' | 'name'>, item: Pick<MenuItem, 'id' | 'restaurantId' | 'name' | 'price' | 'image'>, livestreamId: string) => {
    const result = addLivestreamItemToCart(cart, restaurant, item, livestreamId);
    if (result.changed) persist(result.cart);
    return result;
  }, [cart, persist]);

  const updateNotes = useCallback((menuItemId: number, notes: string) => {
    if (cart) persist(updateCartItemNotes(cart, menuItemId, notes));
  }, [cart, persist]);

  const remove = useCallback((menuItemId: number) => {
    if (cart) persist(removeCartItem(cart, menuItemId));
  }, [cart, persist]);

  const clear = useCallback(() => persist(null), [persist]);

  return { cart, add, addFromLivestream, updateQuantity, updateNotes, remove, clear, refresh };
};
