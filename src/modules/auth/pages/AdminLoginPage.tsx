import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, general: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation: LoginErrors = {};
    if (!formData.email.trim()) validation.email = 'Email admin là bắt buộc';
    if (!formData.password) validation.password = 'Mật khẩu là bắt buộc';
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
      role: USER_ROLES.ADMIN,
    });
    if (result.success) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } else {
      setErrors({ general: result.message || 'Đăng nhập admin thất bại' });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
        <Link to={ROUTES.HOME} className="mb-8 inline-flex items-center gap-2 font-bold text-red-600">
          <span className="material-symbols-outlined">admin_panel_settings</span>
          Delivery Admin
        </Link>

        <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Chỉ tài khoản ADMIN được operator cấp mới truy cập được các màn hình MVP.
        </p>

        {errors.general && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          <div className="block">
            <label htmlFor="admin-login-email">
            <span className="text-sm font-semibold text-gray-800">Email</span>
            </label>
            <input
              id="admin-login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500/30"
            />
            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
          </div>

          <div className="block">
            <label htmlFor="admin-login-password">
            <span className="text-sm font-semibold text-gray-800">Mật khẩu</span>
            </label>
            <div className="relative mt-2">
              <input
                id="admin-login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute inset-y-0 right-0 px-4 text-gray-500"
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
            disabled={loading}
            className="min-h-11 w-full rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chủ nhà hàng?{' '}
          <Link to={ROUTES.LOGIN} className="font-bold text-red-600 hover:underline">
            Đăng nhập portal nhà hàng
          </Link>
        </p>
      </section>
    </main>
  );
};

export default AdminLoginPage;
