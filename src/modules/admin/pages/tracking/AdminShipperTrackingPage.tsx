import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ShipperTrackingMap } from '@/components/map/ShipperTrackingMap';

const AdminShipperTrackingPage = () => {
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Shipper Tracking</h1>
          <p className="text-gray-500">Giám sát vị trí thời gian thực của các shipper đang hoạt động</p>
        </div>
      </div>

      <div className="h-[75vh] w-full">
        <ShipperTrackingMap />
      </div>
    </AdminLayout>
  );
};

export default AdminShipperTrackingPage;
