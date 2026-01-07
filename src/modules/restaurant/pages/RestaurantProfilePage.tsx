/**
 * Restaurant Profile Management Page
 * Trang quản lý thông tin hồ sơ nhà hàng
 */

import { useState, useEffect } from 'react';
import { useRestaurant } from '../hooks/useRestaurant';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import type { CreateRestaurantRequest } from '../services/restaurantService';

interface FormData {
  name: string;
  description: string;
  cuisineType: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  openingHour: string;
  closingHour: string;
  image: string;
  addressLat: number;
  addressLng: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface OpeningHours {
  [key: string]: {
    enabled: boolean;
    open: string;
    close: string;
  };
}

const RestaurantProfilePage = () => {
  const { currentRestaurant, loading, error, updateRestaurant, getMyRestaurants } = useRestaurant();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    cuisineType: 'Asian Fusion',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    openingHour: '09:00',
    closingHour: '22:00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZXy9SdGBWO7fYEIBP0QIt_HFdIZeVZiXa-faoPvHVFCncRnrwTt3ZbjSVj2L6rvuFp2UcVYop1Apif2sLh8FWLxLOL3BemJA-fwLTC-YLC9Q2X1JLiCO8Gnm7UlHF2aK3r8SQtT-HfNpIvGkDlp6Mi2BpjaRZKJkg1wm0Uf3woUgXO5kcCcN7BcR1Gi07m4F7iN9sH-78ssE0e40MKubmKeFfM8Uhsbi4PrFqt_w1EC8JWTxoklFD5AJ3o23pCHKA7ROOvUZ7QGM',
    addressLat: 0,
    addressLng: 0,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [charCount, setCharCount] = useState(0);
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    Monday: { enabled: true, open: '09:00', close: '22:00' },
    Tuesday: { enabled: true, open: '09:00', close: '22:00' },
    Wednesday: { enabled: true, open: '09:00', close: '22:00' },
    Thursday: { enabled: true, open: '09:00', close: '22:00' },
    Friday: { enabled: true, open: '09:00', close: '22:00' },
    Saturday: { enabled: true, open: '09:00', close: '22:00' },
    Sunday: { enabled: false, open: '09:00', close: '22:00' },
  });

  // Load restaurant data khi component mount
  useEffect(() => {
    // Gọi API để lấy nhà hàng của user hiện tại
    getMyRestaurants();
  }, []);

  // Sync data từ currentRestaurant vào form
  useEffect(() => {
    if (currentRestaurant) {
      setFormData({
        name: currentRestaurant.name || '',
        description: currentRestaurant.description || '',
        cuisineType: 'Asian Fusion', // TODO: Add cuisineType to Restaurant type
        phone: currentRestaurant.phone || '',
        address: currentRestaurant.address || '',
        city: '', // TODO: Extract from address or add separate field
        postalCode: '', // TODO: Add to Restaurant type
        openingHour: currentRestaurant.openingHour || '09:00',
        closingHour: currentRestaurant.closingHour || '22:00',
        image: currentRestaurant.image || '',
        addressLat: currentRestaurant.addressLat || 0,
        addressLng: currentRestaurant.addressLng || 0,
      });
      setCharCount(currentRestaurant.description?.length || 0);
    }
  }, [currentRestaurant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'description') {
      setCharCount(value.length);
    }
    
    // Clear error khi user sửa
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOpeningHourChange = (day: string, field: 'enabled' | 'open' | 'close', value: boolean | string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const applyToAllDays = () => {
    const mondayHours = openingHours.Monday;
    const allDays = Object.keys(openingHours).reduce((acc, day) => ({
      ...acc,
      [day]: { ...mondayHours },
    }), {});
    setOpeningHours(allDays as OpeningHours);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Restaurant name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Contact number is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!currentRestaurant) {
      alert('No restaurant data found');
      return;
    }

    const requestData: CreateRestaurantRequest = {
      name: formData.name,
      address: `${formData.address}, ${formData.city}`,
      phone: formData.phone,
      openingHour: formData.openingHour,
      closingHour: formData.closingHour,
      image: formData.image,
      addressLat: formData.addressLat,
      addressLng: formData.addressLng,
      description: formData.description,
    };

    const result = await updateRestaurant(currentRestaurant.id, requestData, { skipRedirect: true });
    
    if (result.success) {
      alert('Restaurant profile updated successfully! ✅');
    } else {
      alert(`Failed to update: ${result.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    if (currentRestaurant) {
      // Reset form về dữ liệu ban đầu
      setFormData({
        name: currentRestaurant.name || '',
        description: currentRestaurant.description || '',
        cuisineType: 'Asian Fusion',
        phone: currentRestaurant.phone || '',
        address: currentRestaurant.address || '',
        city: '',
        postalCode: '',
        openingHour: currentRestaurant.openingHour || '09:00',
        closingHour: currentRestaurant.closingHour || '22:00',
        image: currentRestaurant.image || '',
        addressLat: currentRestaurant.addressLat || 0,
        addressLng: currentRestaurant.addressLng || 0,
      });
      setFormErrors({});
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar 
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-card-light/90 dark:bg-card-dark/90 px-8 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Restaurant Profile</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex h-10 w-64 items-center rounded-full bg-gray-100 dark:bg-white/5 px-4 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input 
                className="flex-1 border-none bg-transparent px-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 placeholder:text-gray-400" 
                placeholder="Search..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-3 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-1.5 border border-green-200 dark:border-green-800">
              <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-bold text-green-700 dark:text-green-400">Open for Business</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-red-500 border-2 border-white dark:border-card-dark"></span>
              </button>
              <div 
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-100 dark:border-gray-700 bg-gray-200"
                style={{ 
                  backgroundImage: `url('${formData.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <a className="hover:text-primary transition-colors" href="#">Home</a>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-text-primary-light dark:text-text-primary-dark font-medium">Profile Management</span>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Cover Image */}
              <div className="h-32 w-full bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-background-dark relative">
                <button className="absolute bottom-4 right-4 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  Change Cover
                </button>
              </div>

              <div className="px-8 pb-8">
                {/* Profile Header */}
                <div className="relative -mt-12 mb-8 flex flex-col sm:flex-row items-end sm:items-center gap-6">
                  <div className="relative group">
                    <div className="size-32 rounded-2xl border-4 border-white dark:border-card-dark bg-white shadow-md overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-zinc-800">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${formData.image}')` }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-white text-3xl">cloud_upload</span>
                      </div>
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105" title="Upload Logo">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>

                  <div className="flex-1 pb-2">
                    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {formData.name || 'Tasty Bites Restaurant'}
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                      Update your restaurant details and branding.
                    </p>
                  </div>

                  <div className="pb-2 hidden sm:block">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                      <span className="size-1.5 rounded-full bg-green-600"></span> Verified
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form className="space-y-8" onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <section>
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">store</span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Restaurant Name
                        </label>
                        <input
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          placeholder="Enter restaurant name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                          placeholder="Describe your restaurant (e.g. Best local food in town...)"
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                        />
                        <p className="text-right text-xs text-gray-400 mt-1">{charCount}/500 characters</p>
                        {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Cuisine Type
                        </label>
                        <select
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                          name="cuisineType"
                          value={formData.cuisineType}
                          onChange={handleChange}
                        >
                          <option>Asian Fusion</option>
                          <option>Fast Food</option>
                          <option>Italian</option>
                          <option>Local Delights</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Contact Number
                        </label>
                        <input
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-gray-100 dark:border-gray-800"></div>

                  {/* Location */}
                  <section>
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Street Address
                        </label>
                        <input
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                        />
                        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                        {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Postal Code
                        </label>
                        <input
                          className="w-full rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                        />
                        {formErrors.postalCode && <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>}
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-gray-100 dark:border-gray-800"></div>

                  {/* Opening Hours */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        Opening Hours
                      </h3>
                      <button
                        type="button"
                        onClick={applyToAllDays}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Apply to all days
                      </button>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/20 overflow-hidden">
                      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Day</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-7">Time Range</div>
                      </div>

                      {Object.entries(openingHours).map(([day, hours]) => (
                        <div
                          key={day}
                          className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-white dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="col-span-3 font-semibold text-sm">{day}</div>
                          <div className="col-span-2 flex justify-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={hours.enabled}
                                onChange={(e) => handleOpeningHourChange(day, 'enabled', e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                          </div>
                          <div className={`col-span-7 flex items-center gap-2 ${!hours.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                              className="flex-1 rounded-lg border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm px-2 py-1.5 focus:border-primary focus:ring-0"
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleOpeningHourChange(day, 'open', e.target.value)}
                              disabled={!hours.enabled}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              className="flex-1 rounded-lg border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm px-2 py-1.5 focus:border-primary focus:ring-0"
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleOpeningHourChange(day, 'close', e.target.value)}
                              disabled={!hours.enabled}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">* Unlisted days will follow default settings or show as closed.</p>
                  </section>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                      className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantProfilePage;
