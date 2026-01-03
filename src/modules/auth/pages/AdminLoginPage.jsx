/**
 * AdminLoginPage Component
 * Trang đăng nhập dành riêng cho ADMIN
 * Sử dụng ShopeeFood Design với màu đỏ cho Admin
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Admin email is required';
        if (!formData.password) newErrors.password = 'Password is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // Admin login - truyền role ADMIN
            const credentials = {
                ...formData,
                role: 'ADMIN', // Trang này dành cho ADMIN
            };
            
            console.log("Admin login credentials:", credentials);
            const result = await login(credentials);

            // useAuth hook sẽ tự động redirect đến /admin/dashboard
            if (!result.success && result.error) {
                setErrors({ general: result.error });
            }
        } catch (err) {
            setErrors({ general: err.message || 'Admin login failed' });
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Admin Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                            <span className="material-symbols-outlined text-4xl text-red-600">
                                admin_panel_settings
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Admin Portal
                        </h1>
                        <p className="text-gray-600">
                            Sign in to manage the platform
                        </p>
                    </div>

                    {/* Error Alert */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-600 text-xl">
                                error
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Login Failed</p>
                                <p className="text-sm text-red-600 mt-1">{errors.general}</p>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                                    mail
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="admin@deliveryvn.com"
                                    className={`w-full pl-12 pr-4 py-3.5 border ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                                    lock
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter admin password"
                                    className={`w-full pl-12 pr-12 py-3.5 border ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 border-gray-300 rounded text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-medium hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">login</span>
                                    Sign In as Admin
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">OR</span>
                        </div>
                    </div>

                    {/* Shop Owner Login Link */}
                    <div className="text-center">
                        <p className="text-gray-600">
                            Not an admin?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-[#f49d25] hover:text-[#e38b14] transition-colors"
                            >
                                Login as Shop Owner
                            </Link>
                        </p>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-4 bg-red-50 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-600 text-xl">
                            security
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Security Notice</p>
                            <p className="text-sm text-red-600 mt-1">
                                This portal is restricted to authorized administrators only. All access attempts are logged.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Admin Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-50 via-white to-red-50 items-center justify-center p-12">
                <div className="max-w-lg text-center">
                    {/* Admin Icon */}
                    <div className="mb-8 relative">
                        <div className="inline-flex items-center justify-center w-64 h-64 bg-white rounded-full shadow-2xl">
                            <span className="material-symbols-outlined text-[140px] text-red-600">
                                admin_panel_settings
                            </span>
                        </div>
                        {/* Floating Elements */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <span className="material-symbols-outlined text-2xl text-red-600">
                                verified_user
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                            <span className="material-symbols-outlined text-2xl text-orange-600">
                                manage_accounts
                            </span>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Administrator Portal
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Manage restaurants, monitor orders, and oversee platform operations with powerful admin tools.
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 text-left">
                        {[
                            { icon: 'store', label: 'Manage Restaurants' },
                            { icon: 'analytics', label: 'View Analytics' },
                            { icon: 'supervised_user_circle', label: 'User Management' },
                            { icon: 'settings', label: 'System Settings' },
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-2xl text-red-600">
                                    {feature.icon}
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                    {feature.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
