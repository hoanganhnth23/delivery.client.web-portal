/**
 * RestaurantForm Component
 * Form để tạo mới hoặc chỉnh sửa nhà hàng
 */

import { useEffect, useState } from 'react';
import { useRestaurant } from '../hooks/useRestaurant';
import type { Restaurant } from '@/types/api.types';
import JsonFixtureImporter from '@/components/forms/JsonFixtureImporter';
import LocationPicker from '@/components/maps/LocationPicker';
import { fixtureText, fixtureTime, type JsonFixtureRecord } from '@/utils/jsonFixture';

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
  addressLat: string;
  addressLng: string;
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
  addressLat?: string;
  addressLng?: string;
}

const RestaurantForm = ({ restaurant = null, onSuccess, onCancel }: RestaurantFormProps) => {
  const { createRestaurant, updateRestaurant, loading } = useRestaurant();
  
  const [formData, setFormData] = useState<FormData>(() => ({
    name: restaurant?.name || '',
    address: restaurant?.address || '',
    phone: restaurant?.phone || '',
    openingHour: restaurant?.openingHour || '08:00',
    closingHour: restaurant?.closingHour || '22:00',
    image: restaurant?.image || '',
    addressLat:
      typeof restaurant?.addressLat === 'number' && Number.isFinite(restaurant.addressLat)
        ? String(restaurant.addressLat)
        : '',
    addressLng:
      typeof restaurant?.addressLng === 'number' && Number.isFinite(restaurant.addressLng)
        ? String(restaurant.addressLng)
        : '',
    description: restaurant?.description || '',
  }));

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        openingHour: restaurant.openingHour || '08:00',
        closingHour: restaurant.closingHour || '22:00',
        image: restaurant.image || '',
        addressLat:
          typeof restaurant.addressLat === 'number' && Number.isFinite(restaurant.addressLat)
            ? String(restaurant.addressLat)
            : '',
        addressLng:
          typeof restaurant.addressLng === 'number' && Number.isFinite(restaurant.addressLng)
            ? String(restaurant.addressLng)
            : '',
        description: restaurant.description || '',
      });
      setErrors({});
    }
  }, [restaurant?.id]);

  const handleFixtureImport = (fixture: JsonFixtureRecord) => {
    setFormData((previous) => ({
      ...previous,
      name: fixtureText(fixture, 'name', previous.name),
      address: fixtureText(fixture, 'address', previous.address),
      phone: fixtureText(fixture, 'phone', previous.phone),
      openingHour: fixtureTime(fixture, 'openingHour', previous.openingHour),
      closingHour: fixtureTime(fixture, 'closingHour', previous.closingHour),
      image: fixtureText(fixture, 'image', previous.image),
      addressLat: fixtureText(
        fixture,
        'addressLat',
        fixtureText(fixture, 'latitude', previous.addressLat),
      ),
      addressLng: fixtureText(
        fixture,
        'addressLng',
        fixtureText(fixture, 'longitude', previous.addressLng),
      ),
      description: fixtureText(fixture, 'description', previous.description),
    }));
    setErrors({});
  };

  const handleLocationChange = (newLat: number, newLng: number) => {
    setFormData((prev) => ({
      ...prev,
      addressLat: String(newLat),
      addressLng: String(newLng),
    }));
    setErrors((prev) => ({
      ...prev,
      addressLat: '',
      addressLng: '',
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Địa chỉ nhà hàng phải có ít nhất 10 ký tự (số nhà, tên đường, phường/xã, quận/huyện)';
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

    const latitude = Number(formData.addressLat);
    if (!formData.addressLat.trim() || !Number.isFinite(latitude) || latitude < 8 || latitude > 24) {
      newErrors.addressLat = 'Vĩ độ phải nằm trong phạm vi Việt Nam (8 đến 24)';
    }

    const longitude = Number(formData.addressLng);
    if (!formData.addressLng.trim() || !Number.isFinite(longitude) || longitude < 102 || longitude > 110) {
      newErrors.addressLng = 'Kinh độ phải nằm trong phạm vi Việt Nam (102 đến 110)';
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
      const request = {
        ...formData,
        addressLat: Number(formData.addressLat),
        addressLng: Number(formData.addressLng),
      };
      
      if (restaurant?.id) {
        // Update
        result = await updateRestaurant(restaurant.id, request, { skipRedirect: true });
      } else {
        // Create
        result = await createRestaurant(request, { skipRedirect: true });
      }

      if (result.success) {
        onSuccess?.(result.data);
      }
    } catch {
      // The restaurant hook owns the user-visible mutation error state.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <JsonFixtureImporter
        label="JSON fixture nhà hàng"
        onImport={handleFixtureImport}
      />

      {/* Tên nhà hàng */}
      <div>
        <label htmlFor="restaurant-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tên nhà hàng <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="restaurant-name"
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
        <label htmlFor="restaurant-address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Địa chỉ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="restaurant-address"
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

      {/* Chọn vị trí trên bản đồ */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Vị trí nhà hàng trên bản đồ <span className="text-red-500">*</span>
        </label>
        <LocationPicker
          lat={formData.addressLat ? Number(formData.addressLat) : null}
          lng={formData.addressLng ? Number(formData.addressLng) : null}
          address={formData.address}
          onChange={handleLocationChange}
          disabled={loading}
        />
      </div>

      {/* Tọa độ (tự động cập nhật từ bản đồ hoặc chỉnh sửa thủ công) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="restaurant-latitude" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Vĩ độ (Latitude)
          </label>
          <input
            type="number"
            id="restaurant-latitude"
            step="any"
            name="addressLat"
            value={formData.addressLat}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="10.762622"
          />
          {errors.addressLat && (
            <p className="mt-1 text-sm text-red-500">{errors.addressLat}</p>
          )}
        </div>
        <div>
          <label htmlFor="restaurant-longitude" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Kinh độ (Longitude)
          </label>
          <input
            type="number"
            id="restaurant-longitude"
            step="any"
            name="addressLng"
            value={formData.addressLng}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="106.660172"
          />
          {errors.addressLng && (
            <p className="mt-1 text-sm text-red-500">{errors.addressLng}</p>
          )}
        </div>
      </div>

      {/* Số điện thoại */}
      <div>
        <label htmlFor="restaurant-phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="restaurant-phone"
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="restaurant-opening-hour" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Giờ mở cửa <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="restaurant-opening-hour"
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
          <label htmlFor="restaurant-closing-hour" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Giờ đóng cửa <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="restaurant-closing-hour"
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
        <label htmlFor="restaurant-image" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          URL ảnh đại diện
        </label>
        <input
          type="url"
          id="restaurant-image"
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
        <label htmlFor="restaurant-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Mô tả
        </label>
        <textarea
          id="restaurant-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Mô tả về nhà hàng của bạn..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
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
