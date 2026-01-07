/**
 * RegisterPageV2 Component
 * ShopeeFood Style - Split Screen Design
 * Based on ShopeeFood's actual registration interface
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '@/utils/constants';

// ============================================
// LOCAL TYPES
// ============================================

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  general?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const RegisterPageV2 = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): RegisterErrors => {
    const newErrors: RegisterErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to Terms of Service';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      navigate(ROUTES.LOGIN, { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      const message = (err as Error).message || 'Registration failed';
      setErrors({ general: message });
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Social registration with ${provider}`);
    // TODO: Implement social registration
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#221a10] font-display">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-[#f4eee7] dark:border-neutral-800 px-6 py-4 md:px-10 lg:px-20 bg-white dark:bg-[#1c160d]">
        <Link to="/" className="flex items-center gap-4 text-[#1c160d] dark:text-white">
          <div className="size-8 text-[#f49d25]">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight">ShopeeFood</h2>
        </Link>
        <Link to={ROUTES.LOGIN} className="text-sm font-bold text-[#f49d25] hover:text-[#d68b1f] transition-colors">
          Log In
        </Link>
      </header>

      {/* Main Content: Split Layout */}
      <main className="flex flex-1 w-full min-h-[calc(100vh-73px)]">
        {/* Left Side: Hero Image - Hidden on mobile/tablet */}
        <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop')"
            }}
          ></div>
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-12 left-12 text-white z-10 max-w-md">
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">Craving satisfied.</h1>
            <p className="text-lg text-white/90">
              Join millions of foodies and order from the best restaurants near you.
            </p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto bg-white dark:bg-[#1c160d]">
          <div className="w-full max-w-[520px] flex flex-col gap-6">
            {/* Heading */}
            <div className="flex flex-col gap-2 mb-2">
              <p className="text-[#1c160d] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight">
                Create your account
              </p>
              <p className="text-[#9c7a49] dark:text-neutral-400 text-base font-normal">
                Join us to order your favorite food.
              </p>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Full Name */}
              <label className="flex flex-col flex-1">
                <p className="text-[#1c160d] dark:text-neutral-200 text-sm font-medium leading-normal pb-2">
                  Full Name
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-[#f49d25]/50 transition-all duration-200">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#1c160d] dark:text-white border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] focus:border-[#f49d25] focus:outline-0 h-12 placeholder:text-[#9c7a49] dark:placeholder:text-neutral-500 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal"
                    placeholder="Enter your full name"
                  />
                  <div className="text-[#9c7a49] dark:text-neutral-500 flex border border-l-0 border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] items-center justify-center pr-[15px] rounded-r-lg group-focus-within:border-[#f49d25]">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </label>

              {/* Email */}
              <label className="flex flex-col flex-1">
                <p className="text-[#1c160d] dark:text-neutral-200 text-sm font-medium leading-normal pb-2">
                  Email Address
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-[#f49d25]/50 transition-all duration-200">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#1c160d] dark:text-white border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] focus:border-[#f49d25] focus:outline-0 h-12 placeholder:text-[#9c7a49] dark:placeholder:text-neutral-500 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal"
                    placeholder="Enter your email"
                  />
                  <div className="text-[#9c7a49] dark:text-neutral-500 flex border border-l-0 border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] items-center justify-center pr-[15px] rounded-r-lg group-focus-within:border-[#f49d25]">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </label>

              {/* Password Row */}
              <div className="flex flex-col md:flex-row gap-5">
                {/* Password */}
                <label className="flex flex-col flex-1">
                  <p className="text-[#1c160d] dark:text-neutral-200 text-sm font-medium leading-normal pb-2">
                    Password
                  </p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-[#f49d25]/50 transition-all duration-200">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#1c160d] dark:text-white border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] focus:border-[#f49d25] focus:outline-0 h-12 placeholder:text-[#9c7a49] dark:placeholder:text-neutral-500 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#9c7a49] dark:text-neutral-500 flex border border-l-0 border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] items-center justify-center pr-[15px] rounded-r-lg cursor-pointer group-focus-within:border-[#f49d25]"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </label>

                {/* Confirm Password */}
                <label className="flex flex-col flex-1">
                  <p className="text-[#1c160d] dark:text-neutral-200 text-sm font-medium leading-normal pb-2">
                    Confirm Password
                  </p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-[#f49d25]/50 transition-all duration-200">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#1c160d] dark:text-white border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] focus:border-[#f49d25] focus:outline-0 h-12 placeholder:text-[#9c7a49] dark:placeholder:text-neutral-500 p-[15px] border-r-0 pr-2 text-base font-normal leading-normal"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#9c7a49] dark:text-neutral-500 flex border border-l-0 border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] items-center justify-center pr-[15px] rounded-r-lg cursor-pointer group-focus-within:border-[#f49d25]"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showConfirmPassword ? 'visibility' : 'check_circle'}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </label>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-1">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-[#f49d25] bg-gray-100 border-gray-300 rounded focus:ring-[#f49d25] dark:focus:ring-[#f49d25] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <label htmlFor="terms" className="text-xs text-[#9c7a49] dark:text-neutral-400">
                  By registering, you agree to our{' '}
                  <a href="#" className="text-[#f49d25] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#f49d25] hover:underline">Privacy Policy</a>.
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-xs -mt-3">{errors.terms}</p>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-[#f49d25] hover:bg-[#d68b1f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-[#1c160d] text-base font-bold leading-normal tracking-[0.015em] mt-2 shadow-sm"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#e8ddce] dark:border-neutral-700"></div>
                <span className="flex-shrink-0 mx-4 text-sm text-[#9c7a49] dark:text-neutral-500">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-[#e8ddce] dark:border-neutral-700"></div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-lg border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] hover:bg-neutral-50 dark:hover:bg-[#332a1e] transition-colors text-[#1c160d] dark:text-neutral-200 text-sm font-bold"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                    <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
                    <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
                    <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-lg border border-[#e8ddce] dark:border-neutral-700 bg-white dark:bg-[#2a2218] hover:bg-neutral-50 dark:hover:bg-[#332a1e] transition-colors text-[#1c160d] dark:text-neutral-200 text-sm font-bold"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.415 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.6c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.585 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="flex justify-center mt-4">
                <p className="text-sm text-[#9c7a49] dark:text-neutral-400">
                  Already have an account?{' '}
                  <Link to={ROUTES.LOGIN} className="text-[#f49d25] font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPageV2;
