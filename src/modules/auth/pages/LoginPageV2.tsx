import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { useAuth } from '../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  general?: string;
  email?: string;
  password?: string;
}

const LoginPageV2 = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { getMyRestaurants } = useRestaurant();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantLoadFailed, setRestaurantLoadFailed] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, general: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation: LoginErrors = {};
    if (!formData.email.trim()) validation.email = 'Email is required';
    if (!formData.password) validation.password = 'Password is required';
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        role: USER_ROLES.RESTAURANT_OWNER,
      });
      if (!result.success) {
        setErrors({ general: result.message || 'Login failed' });
        return;
      }

      if (result.data?.user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
        return;
      }

      await loadRestaurantAndNavigate();
    } catch (error) {
      setErrors({ general: (error as Error).message || 'Login failed' });
    }
  };

  const loadRestaurantAndNavigate = async () => {
    setRestaurantLoading(true);
    setRestaurantLoadFailed(false);
    const result = await getMyRestaurants();
    if (result.success) {
      navigate(ROUTES.RESTAURANT_DASHBOARD);
    } else {
      setRestaurantLoadFailed(true);
      setErrors({ general: result.message || 'Không thể tải nhà hàng của bạn' });
    }
    setRestaurantLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf8] p-4 dark:bg-[#1c160d] sm:p-6">
      <section className="w-full max-w-md rounded-2xl border border-[#e8ddce] bg-white p-6 shadow-lg dark:bg-zinc-900 dark:border-zinc-700 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f49d25] font-bold mb-8">
          <span className="material-symbols-outlined">restaurant</span>
          Delivery Restaurant
        </Link>

        <h1 className="text-2xl font-black text-[#1c160d] dark:text-white sm:text-3xl">Đăng nhập nhà hàng</h1>
        <p className="mt-2 text-sm text-[#9c7a49] dark:text-zinc-400 sm:text-base">
          Tài khoản chủ nhà hàng được quản trị viên cấp cho MVP.
        </p>

        {errors.general && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          <div className="block">
            <label htmlFor="restaurant-login-email">
            <span className="text-sm font-semibold text-[#1c160d] dark:text-zinc-200">Email</span>
            </label>
            <input
              id="restaurant-login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-[#e8ddce] bg-[#f8f7f5] px-4 py-3 outline-none focus:ring-2 focus:ring-[#f49d25]/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
          </div>

          <div className="block">
            <label htmlFor="restaurant-login-password">
            <span className="text-sm font-semibold text-[#1c160d] dark:text-zinc-200">Mật khẩu</span>
            </label>
            <div className="relative mt-2">
              <input
                id="restaurant-login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#e8ddce] bg-[#f8f7f5] px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-[#f49d25]/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute inset-y-0 right-0 px-4 text-[#9c7a49]"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && <span className="mt-1 block text-xs text-red-500">{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || restaurantLoading}
            className="min-h-11 w-full rounded-lg bg-[#f49d25] px-5 py-3 font-bold text-white transition hover:bg-[#e38b14] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập…' : restaurantLoading ? 'Đang tải nhà hàng…' : 'Đăng nhập'}
          </button>
        </form>

        {restaurantLoadFailed && (
          <button
            type="button"
            onClick={() => void loadRestaurantAndNavigate()}
            disabled={restaurantLoading}
            className="mt-4 w-full rounded-lg border border-[#f49d25] px-5 py-3 font-bold text-[#c97912] transition hover:bg-[#f49d25]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {restaurantLoading ? 'Đang tải…' : 'Thử tải lại nhà hàng'}
          </button>
        )}

        <p className="mt-6 text-center text-sm text-[#9c7a49]">
          Quản trị viên?{' '}
          <Link to={ROUTES.ADMIN_LOGIN} className="font-bold text-[#f49d25] hover:underline">
            Đăng nhập admin
          </Link>
        </p>
      </section>
    </main>
  );
};

export default LoginPageV2;
