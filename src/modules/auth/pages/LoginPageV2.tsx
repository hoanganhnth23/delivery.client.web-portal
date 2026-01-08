/**
 * LoginPageV2 Component
 * ShopeeFood Style - Split Screen Design
 * Based on ShopeeFood's actual login interface
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { ROUTES, USER_ROLES } from '@/utils/constants';

// ============================================
// LOCAL TYPES
// ============================================

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
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof LoginErrors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        const newErrors: LoginErrors = {};
        if (!formData.email) newErrors.email = 'Email or username is required';
        if (!formData.password) newErrors.password = 'Password is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // Shop Owner login - truyền role
            const credentials = {
                ...formData,
                role: USER_ROLES.RESTAURANT_OWNER, // Trang này dành cho RESTAURANT_OWNER
            };

            console.log("Shop Owner login credentials:", credentials);
            const result = await login(credentials);

            // ✅ UI component tự xử lý navigation
            if (result.success) {
                // Load restaurant data ngay sau khi login thành công


                // Redirect based on role
                if (result.data?.user.role === USER_ROLES.ADMIN) {
                    navigate(ROUTES.ADMIN_DASHBOARD);
                } else {
                    await getMyRestaurants();
                    navigate(ROUTES.RESTAURANT_DASHBOARD); // Mặc định chuyển đến restaurant dashboard
                }
            } else {
                setErrors({ general: result.message || 'Login failed' });
            }
        } catch (err) {
            const message = (err as Error).message || 'Login failed';
            setErrors({ general: message });
        }
    };

    const handleSocialLogin = (provider: string) => {
        console.log(`Social login with ${provider}`);
        // TODO: Implement social login
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row w-full">
            {/* Left Side: Hero Image - Hidden on mobile */}
            <div className="hidden md:flex md:w-1/2 lg:w-7/12 relative bg-gray-900 items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop"
                        alt="Delicious pizza with fresh ingredients"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                </div>

                {/* Marketing Text Overlay */}
                <div className="relative z-10 p-12 text-white max-w-2xl">
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight drop-shadow-lg">
                        Craving something specific?
                    </h1>
                    <p className="text-xl font-medium opacity-90 drop-shadow-md">
                        Order from your favorite restaurants and get it delivered to your doorstep in minutes.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col min-h-screen bg-white dark:bg-[#1a1a1a]">
                {/* Header Logo */}
                <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-800">
                    <Link to="/" className="flex items-center gap-2 text-[#f49d25] hover:opacity-80 transition-opacity">
                        <div className="size-8">
                            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-[#1c160d] dark:text-white text-xl font-bold leading-tight">ShopeeFood</h2>
                    </Link>
                    <a href="#" className="text-sm font-medium text-[#9c7a49] dark:text-gray-400 hover:text-[#f49d25] transition-colors">
                        Help Center
                    </a>
                </header>

                {/* Login Content Container */}
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-8 max-w-[640px] w-full mx-auto">
                    {/* Page Heading */}
                    <div className="mb-10">
                        <h1 className="text-[#1c160d] dark:text-white text-4xl font-black leading-tight mb-3">
                            Welcome Back
                        </h1>
                        <p className="text-[#9c7a49] dark:text-gray-400 text-lg font-normal leading-normal">
                            Log in to continue ordering your favorite meals.
                        </p>
                    </div>

                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                        {/* Email Field */}
                        <label className="flex flex-col w-full">
                            <p className="text-[#1c160d] dark:text-white text-sm font-semibold leading-normal pb-2">
                                Email or Username
                            </p>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#1c160d] dark:text-white placeholder:text-[#9c7a49] dark:placeholder:text-gray-500 focus:outline-0 focus:ring-2 focus:ring-[#f49d25]/50 border border-[#e8ddce] dark:border-gray-700 bg-[#f8f7f5] dark:bg-zinc-800 focus:border-[#f49d25] h-14 px-4 text-base font-normal leading-normal transition-all duration-200"
                                placeholder="Enter your email or username"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </label>

                        {/* Password Field */}
                        <label className="flex flex-col w-full">
                            <div className="flex justify-between items-baseline pb-2">
                                <p className="text-[#1c160d] dark:text-white text-sm font-semibold leading-normal">
                                    Password
                                </p>
                            </div>
                            <div className="relative flex w-full items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#1c160d] dark:text-white placeholder:text-[#9c7a49] dark:placeholder:text-gray-500 focus:outline-0 focus:ring-2 focus:ring-[#f49d25]/50 border border-[#e8ddce] dark:border-gray-700 bg-[#f8f7f5] dark:bg-zinc-800 focus:border-[#f49d25] h-14 pl-4 pr-12 text-base font-normal leading-normal transition-all duration-200"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 bottom-0 px-4 text-[#9c7a49] dark:text-gray-400 hover:text-[#f49d25] transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[24px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                            )}

                            {/* Forgot Password Link */}
                            <div className="flex justify-end pt-2">
                                <Link
                                    to="/forgot-password"
                                    className="text-[#f49d25] hover:text-[#e38b14] text-sm font-semibold leading-normal transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#f49d25] hover:bg-[#e38b14] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-bold leading-normal tracking-[0.015em] w-full mt-2 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <span className="truncate">{loading ? 'Logging in...' : 'Log In'}</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex py-8 items-center">
                        <div className="flex-grow border-t border-[#e8ddce] dark:border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-[#9c7a49] dark:text-gray-500 text-sm font-medium">
                            Or login with
                        </span>
                        <div className="flex-grow border-t border-[#e8ddce] dark:border-gray-700"></div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="flex gap-4 justify-center w-full">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="flex-1 flex items-center justify-center gap-3 h-12 px-5 rounded-lg border border-[#e8ddce] dark:border-gray-600 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#1c160d] dark:text-white text-sm font-bold transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                            </svg>
                            <span className="hidden sm:inline">Google</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialLogin('facebook')}
                            className="flex-1 flex items-center justify-center gap-3 h-12 px-5 rounded-lg border border-[#e8ddce] dark:border-gray-600 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#1c160d] dark:text-white text-sm font-bold transition-all duration-200"
                        >
                            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.415 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.6c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.585 23.094 24 18.1 24 12.073z" />
                            </svg>
                            <span className="hidden sm:inline">Facebook</span>
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[#9c7a49] dark:text-gray-400 text-base font-normal">
                            Don't have an account?{' '}
                            <Link
                                to={ROUTES.REGISTER}
                                className="text-[#f49d25] hover:text-[#e38b14] font-bold hover:underline transition-all"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-6 px-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row justify-center md:justify-between items-center text-xs text-[#9c7a49] dark:text-gray-500 gap-4">
                        <p>© 2024 ShopeeFood. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-[#f49d25] transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-[#f49d25] transition-colors">Privacy Policy</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LoginPageV2;
