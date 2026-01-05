/**
 * Example: Cách sử dụng Restaurant & Menu Module
 * File này demo tất cả các use cases
 */

import React, { useState, useEffect } from 'react';
import { 
  useRestaurant, 
  useMenu, 
  RestaurantForm, 
  MenuItemForm 
} from '@/modules/restaurant';

// ============================================
// EXAMPLE 1: RESTAURANT MANAGEMENT
// ============================================
export function RestaurantExample() {
  const { 
    restaurants, 
    loading, 
    error,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getAllRestaurants,
    searchRestaurants
  } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // Load data khi mount
  useEffect(() => {
    getAllRestaurants();
  }, [getAllRestaurants]);

  // Tạo mới
  const handleCreate = async () => {
    const data = {
      name: 'Bún Chả Hà Nội',
      address: '123 Nguyễn Huệ, Q.1, TP.HCM',
      phone: '0901234567',
      openingHour: '08:00',
      closingHour: '22:00',
      image: 'https://example.com/image.jpg',
      addressLat: 10.762622,
      addressLng: 106.660172,
      description: 'Bún chả Hà Nội chính hiệu'
    };

    const result = await createRestaurant(data, { skipRedirect: true });
    
    if (result.success) {
      alert('Tạo thành công!');
      getAllRestaurants(); // Refresh
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  };

  // Cập nhật
  const handleUpdate = async (id) => {
    const data = {
      name: 'Bún Chả HN (Updated)',
      // ... other fields
    };

    const result = await updateRestaurant(id, data, { skipRedirect: true });
    if (result.success) {
      alert('Cập nhật thành công!');
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa?')) {
      const result = await deleteRestaurant(id, { skipRedirect: true });
      if (result.success) {
        alert('Đã xóa!');
      }
    }
  };

  // Tìm kiếm
  const handleSearch = async (keyword) => {
    await searchRestaurants(keyword);
  };

  // Form success callback
  const handleFormSuccess = (data) => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
    alert('Lưu thành công!');
    getAllRestaurants();
  };

  return (
    <div>
      <h1>Restaurant Management</h1>
      
      {/* Search */}
      <input 
        type="text" 
        placeholder="Tìm kiếm..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Create Button */}
      <button onClick={() => {
        setEditingRestaurant(null);
        setIsModalOpen(true);
      }}>
        Thêm nhà hàng
      </button>

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/* Error */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* List */}
      <div>
        {restaurants.map(restaurant => (
          <div key={restaurant.id}>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.address}</p>
            <button onClick={() => {
              setEditingRestaurant(restaurant);
              setIsModalOpen(true);
            }}>
              Sửa
            </button>
            <button onClick={() => handleDelete(restaurant.id)}>
              Xóa
            </button>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal">
          <RestaurantForm
            restaurant={editingRestaurant}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 2: MENU MANAGEMENT
// ============================================
export function MenuExample() {
  const { 
    menuItems, 
    loading,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemsByRestaurant,
    getAllMenuItems
  } = useMenu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [restaurantId] = useState(1); // Hardcode hoặc lấy từ props

  // Load menu items theo restaurant
  useEffect(() => {
    getMenuItemsByRestaurant(restaurantId);
    // hoặc: getAllMenuItems();
  }, [restaurantId, getMenuItemsByRestaurant]);

  // Tạo mới
  const handleCreate = async () => {
    const data = {
      restaurantId: 1,
      name: 'Phở Bò Tái',
      description: 'Phở bò tái nạm đặc biệt',
      price: 50000,
      image: 'https://example.com/pho.jpg'
    };

    const result = await createMenuItem(data, { skipRedirect: true });
    
    if (result.success) {
      alert('Thêm món thành công!');
      getMenuItemsByRestaurant(restaurantId);
    }
  };

  // Cập nhật
  const handleUpdate = async (id) => {
    const data = {
      restaurantId: 1,
      name: 'Phở Bò Tái (Updated)',
      description: 'Updated description',
      price: 55000,
      image: 'https://...'
    };

    const result = await updateMenuItem(id, data, { skipRedirect: true });
    if (result.success) {
      alert('Cập nhật thành công!');
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (confirm('Xóa món này?')) {
      const result = await deleteMenuItem(id, { skipRedirect: true });
      if (result.success) {
        alert('Đã xóa!');
        getMenuItemsByRestaurant(restaurantId);
      }
    }
  };

  // Form success
  const handleFormSuccess = (data) => {
    setIsModalOpen(false);
    setEditingMenuItem(null);
    alert('Lưu thành công!');
    getMenuItemsByRestaurant(restaurantId);
  };

  return (
    <div>
      <h1>Menu Management</h1>

      {/* Create Button */}
      <button onClick={() => {
        setEditingMenuItem(null);
        setIsModalOpen(true);
      }}>
        Thêm món ăn
      </button>

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/* Menu Items Grid */}
      <div className="grid">
        {menuItems.map(item => (
          <div key={item.id} className="card">
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p className="price">${item.price}</p>
            <button onClick={() => {
              setEditingMenuItem(item);
              setIsModalOpen(true);
            }}>
              Sửa
            </button>
            <button onClick={() => handleDelete(item.id)}>
              Xóa
            </button>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal">
          <MenuItemForm
            menuItem={editingMenuItem}
            restaurantId={restaurantId}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 3: SỬ DỤNG TRỰC TIẾP SERVICE
// ============================================
import { restaurantService, menuService } from '@/modules/restaurant';

export async function directServiceExample() {
  try {
    // Restaurant Service
    const restaurants = await restaurantService.getAllRestaurants();
    console.log('All restaurants:', restaurants);

    const restaurant = await restaurantService.getRestaurantById(1);
    console.log('Restaurant #1:', restaurant);

    const created = await restaurantService.createRestaurant({
      name: 'Test Restaurant',
      address: '123 Test St',
      phone: '0901234567',
      openingHour: '09:00',
      closingHour: '21:00',
      image: '',
      addressLat: 0,
      addressLng: 0,
      description: ''
    });
    console.log('Created:', created);

    // Menu Service
    const menuItems = await menuService.getMenuItemsByRestaurant(1);
    console.log('Menu items:', menuItems);

    const menuCreated = await menuService.createMenuItem({
      restaurantId: 1,
      name: 'Test Dish',
      description: 'Test',
      price: 10000,
      image: ''
    });
    console.log('Menu created:', menuCreated);

  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================
// EXAMPLE 4: TÍCH HỢP VÀO APP
// ============================================
/*
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RestaurantProvider, MenuProvider } from '@/modules/restaurant';
import { 
  RestaurantListPage, 
  RestaurantDashboard, 
  MenuManagement 
} from '@/modules/restaurant';

function App() {
  return (
    <BrowserRouter>
      <RestaurantProvider>
        <MenuProvider>
          <Routes>
            <Route path="/restaurants" element={<RestaurantListPage />} />
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
            <Route path="/restaurant/menu" element={<MenuManagement />} />
          </Routes>
        </MenuProvider>
      </RestaurantProvider>
    </BrowserRouter>
  );
}
*/
