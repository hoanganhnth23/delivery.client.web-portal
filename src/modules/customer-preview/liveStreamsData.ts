// Preview fixture data for the customer livestream viewer (kept out of the
// component module so React Fast Refresh only sees component exports).
import { catalog, type Item } from './model';

export interface LiveStreamDetail {
  id: string;
  restaurantId: number;
  restaurantName: string;
  restaurantImage: string;
  title: string;
  thumbnail: string;
  viewers: number;
  hearts: number;
  dealTag: string;
  dish: Item;
  discountPrice: number;
}

export const LIVE_STREAMS_DATA: LiveStreamDetail[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    restaurantId: 1,
    restaurantName: catalog[0]?.name || 'Quán Test HÀ ĐÔNG',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    title: 'Đại tiệc Cơm Sườn Bì Chả giòn rụm — Giảm tới 40% trưa nay!',
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    viewers: 1480,
    hearts: 18400,
    dealTag: 'GIẢM 40% TRÊN LIVE',
    dish: catalog[0]?.items[0] || {
      id: 1,
      name: 'Cơm tấm sườn bì chả',
      price: 65000,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    },
    discountPrice: 39000,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    restaurantId: 2,
    restaurantName: catalog[1]?.name || 'Trà Sữa Xiang Cha',
    restaurantImage: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80',
    title: 'Xả kho Trà Sữa 1Đ — Tặng trân châu hoàng kim béo ngậy',
    thumbnail: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    viewers: 2950,
    hearts: 42100,
    dealTag: 'ĐỒNG GIÁ 25K',
    dish: catalog[1]?.items[0] || {
      id: 2,
      name: 'Trà sữa ô long nướng',
      price: 50000,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
    },
    discountPrice: 25000,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    restaurantId: 3,
    restaurantName: catalog[2]?.name || 'Gà Nướng Muối Ớt Cay',
    restaurantImage: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80',
    title: 'Gà quay nguyên con da giòn sốt tiêu xanh — Freeship Xtra',
    thumbnail: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    viewers: 890,
    hearts: 11200,
    dealTag: 'VOUCHER 50K',
    dish: catalog[2]?.items[0] || {
      id: 3,
      name: 'Gà nướng muối ớt cay',
      price: 180000,
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
    },
    discountPrice: 129000,
  },
];
