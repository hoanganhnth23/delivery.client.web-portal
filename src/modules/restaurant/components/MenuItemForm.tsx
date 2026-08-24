/**
 * MenuItemForm Component
 * Form để tạo mới hoặc chỉnh sửa món ăn
 */

import { useRef, useState } from 'react';
import { useMenu } from '../hooks/useMenu';
import type { MenuItem } from '@/types/api.types';
import JsonFixtureImporter from '@/components/forms/JsonFixtureImporter';
import { fixtureText, type JsonFixtureRecord } from '@/utils/jsonFixture';

// ============================================
// LOCAL TYPES
// ============================================

interface MenuItemFormProps {
  menuItem?: MenuItem | null;
  restaurantId: number;
  onSuccess?: (data: unknown) => void;
  onCancel?: () => void;
}

interface FormData {
  restaurantId: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

interface FormErrors {
  restaurantId?: string;
  name?: string;
  description?: string;
  price?: string;
  image?: string;
}

const MenuItemForm = ({ menuItem = null, restaurantId, onSuccess, onCancel }: MenuItemFormProps) => {
  const { createMenuItem, updateMenuItem, loading } = useMenu();
  
  const [formData, setFormData] = useState<FormData>(() => ({
    restaurantId: menuItem?.restaurantId?.toString() || restaurantId.toString(),
    name: menuItem?.name || '',
    description: menuItem?.description || '',
    price: menuItem?.price?.toString() || '',
    image: menuItem?.image || '',
  }));

  const [errors, setErrors] = useState<FormErrors>({});
  const submittingRef = useRef(false);

  const handleFixtureImport = (fixture: JsonFixtureRecord) => {
    setFormData((previous) => ({
      ...previous,
      restaurantId: fixtureText(fixture, 'restaurantId', previous.restaurantId),
      name: fixtureText(fixture, 'name', previous.name),
      description: fixtureText(fixture, 'description', previous.description),
      price: fixtureText(fixture, 'price', previous.price),
      image: fixtureText(fixture, 'image', previous.image),
    }));
    setErrors({});
  };

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
    
    if (!formData.restaurantId) {
      newErrors.restaurantId = 'Restaurant ID không được để trống';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên món ăn không được để trống';
    }
    
    if (!formData.price) {
      newErrors.price = 'Giá không được để trống';
    } else if (isNaN(Number(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Giá phải là số dương';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // A same-tick double click can arrive before React commits the loading
    // state from the first request. Keep the mutation invariant synchronous
    // so one user action cannot create two menu records.
    if (submittingRef.current) return;
    
    if (!validateForm()) {
      return;
    }

    submittingRef.current = true;

    try {
      // Convert price to number
      const submitData = {
        ...formData,
        restaurantId: parseInt(formData.restaurantId),
        price: parseFloat(formData.price)
      };

      let result;
      
      if (menuItem?.id) {
        // Update
        result = await updateMenuItem(menuItem.id, submitData, { skipRedirect: true });
      } else {
        // Create
        result = await createMenuItem(submitData, { skipRedirect: true });
      }

      if (result.success) {
        onSuccess?.(result.data);
      }
    } catch {
      // The menu hook owns the user-visible mutation error state.
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <JsonFixtureImporter
        label="JSON fixture món ăn"
        onImport={handleFixtureImport}
      />

      {/* Restaurant ID (hidden nếu đã có) */}
      {!restaurantId && (
        <div>
          <label htmlFor="menu-restaurant-id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Restaurant ID <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="menu-restaurant-id"
            name="restaurantId"
            value={formData.restaurantId}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="1"
          />
          {errors.restaurantId && (
            <p className="mt-1 text-sm text-red-500">{errors.restaurantId}</p>
          )}
        </div>
      )}

      {/* Tên món ăn */}
      <div>
        <label htmlFor="menu-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tên món ăn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="menu-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="VD: Phở Bò Tái"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Giá */}
      <div>
        <label htmlFor="menu-price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Giá (VNĐ) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="menu-price"
          step="0.01"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="50000"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-500">{errors.price}</p>
        )}
      </div>

      {/* URL ảnh */}
      <div>
        <label htmlFor="menu-image" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          URL ảnh món ăn
        </label>
        <input
          type="url"
          id="menu-image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://example.com/pho-bo.jpg"
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
        <label htmlFor="menu-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Mô tả
        </label>
        <textarea
          id="menu-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Mô tả về món ăn..."
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
            menuItem?.id ? 'Cập nhật' : 'Tạo mới'
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

export default MenuItemForm;
