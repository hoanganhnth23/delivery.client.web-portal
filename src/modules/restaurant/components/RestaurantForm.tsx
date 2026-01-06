/**
 * RestaurantForm Component
 * Form để tạo mới hoặc chỉnh sửa nhà hàng
 */

import { useState, useEffect } from 'react';
import { useRestaurant } from '../hooks/useRestaurant';
import type { Restaurant } from '@/types/api.types';

// ============================================
// LOCAL TYPES
// ============================================

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  onSuccess?: (data: unknown) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  openingHour: string;
  closingHour: string;
  image: string;
  addressLat: number;
  addressLng: number;
  description: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
  openingHour?: string;
  closingHour?: string;
  image?: string;
  description?: string;
}

const RestaurantForm = ({ restaurant = null, onSuccess, onCancel }: RestaurantFormProps) => {
  const { createRestaurant, updateRestaurant, loading } = useRestaurant();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    openingHour: '08:00',
    closingHour: '22:00',
    image: '',
    addressLat: 0,
    addressLng: 0,
    description: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load dữ liệu khi edit
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        openingHour: restaurant.openingHour || '08:00',
        closingHour: restaurant.closingHour || '22:00',
        image: restaurant.image || '',
        addressLat: restaurant.addressLat || 0,
        addressLng: restaurant.addressLng || 0,
        description: restaurant.description || ''
      });
    }
  }, [restaurant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user nhập
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên nhà hàng không được để trống';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    }
    
    if (!formData.openingHour) {
      newErrors.openingHour = 'Giờ mở cửa không được để trống';
    }
    
    if (!formData.closingHour) {
      newErrors.closingHour = 'Giờ đóng cửa không được để trống';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (restaurant?.id) {
        // Update
        result = await updateRestaurant(restaurant.id, formData, { skipRedirect: true });
      } else {
        // Create
        result = await createRestaurant(formData, { skipRedirect: true });
      }

      if (result.success) {
        onSuccess?.(result.data);
      }
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tên nhà hàng */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tên nhà hàng <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="VD: Bún Chả Hà Nội"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Địa chỉ */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Địa chỉ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address}</p>
        )}
      </div>

      {/* Tọa độ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Vĩ độ (Latitude)
          </label>
          <input
            type="number"
            step="any"
            name="addressLat"
            value={formData.addressLat}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="10.762622"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Kinh độ (Longitude)
          </label>
          <input
            type="number"
            step="any"
            name="addressLng"
            value={formData.addressLng}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="106.660172"
          />
        </div>
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="0901234567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* Giờ mở cửa - đóng cửa */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Giờ mở cửa <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="openingHour"
            value={formData.openingHour}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.openingHour && (
            <p className="mt-1 text-sm text-red-500">{errors.openingHour}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Giờ đóng cửa <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="closingHour"
            value={formData.closingHour}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.closingHour && (
            <p className="mt-1 text-sm text-red-500">{errors.closingHour}</p>
          )}
        </div>
      </div>

      {/* URL ảnh */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          URL ảnh đại diện
        </label>
        <input
          type="url"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://example.com/image.jpg"
        />
        {formData.image && (
          <img 
            src={formData.image} 
            alt="Preview" 
            className="mt-2 w-32 h-32 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Mô tả
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Mô tả về nhà hàng của bạn..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin">refresh</span>
              Đang xử lý...
            </span>
          ) : (
            restaurant?.id ? 'Cập nhật' : 'Tạo mới'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};

export default RestaurantForm;
