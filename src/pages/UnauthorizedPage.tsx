/**
 * Unauthorized Page
 * Trang hiển thị khi user không có quyền truy cập
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="material-symbols-outlined text-9xl text-red-500">
            block
          </span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Không có quyền truy cập
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản phù hợp.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={ROUTES.LOGIN}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
          >
            Đăng nhập lại
          </Link>
          
          <Link
            to={ROUTES.HOME}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
