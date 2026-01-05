/**
 * MenuItemForm Component
 * Form để tạo mới hoặc chỉnh sửa món ăn
 */

import React, { useState, useEffect } from 'react';
import { useMenu } from '../hooks/useMenu';

const MenuItemForm = ({ menuItem = null, restaurantId, onSuccess, onCancel }) => {
  const { createMenuItem, updateMenuItem, loading } = useMenu();
  
  const [formData, setFormData] = useState({
    restaurantId: restaurantId || '',
    name: '',
    description: '',
    price: '',
    image: ''
  });

  const [errors, setErrors] = useState({});

  // Load dữ liệu khi edit
  useEffect(() => {
    if (menuItem) {
      setFormData({
        restaurantId: menuItem.restaurantId || restaurantId || '',
        name: menuItem.name || '',
        description: menuItem.description || '',
        price: menuItem.price || '',
        image: menuItem.image || ''
      });
    }
  }, [menuItem, restaurantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.restaurantId) {
      newErrors.restaurantId = 'Restaurant ID không được để trống';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên món ăn không được để trống';
    }
    
    if (!formData.price) {
      newErrors.price = 'Giá không được để trống';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Giá phải là số dương';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Restaurant ID (hidden nếu đã có) */}
      {!restaurantId && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Restaurant ID <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tên món ăn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Giá (VNĐ) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          URL ảnh món ăn
        </label>
        <input
          type="url"
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
            onError={(e) => e.target.style.display = 'none'}
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
