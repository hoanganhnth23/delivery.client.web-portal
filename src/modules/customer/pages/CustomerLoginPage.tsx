import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES, USER_ROLES } from '@/utils/constants';

const safeReturnTo = (value: string | null): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : ROUTES.HOME;

const CustomerLoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError(null);
    const result = await login({ email: email.trim(), password, role: USER_ROLES.USER });
    if (!result.success) {
      setError(result.message || 'Đăng nhập thất bại');
      return;
    }
    navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4 sm:p-6">
      <section className="w-full max-w-md rounded-lg border border-[#eeeeee] bg-white p-6 shadow-lg sm:rounded-lg sm:p-8">
        <Link to={ROUTES.HOME} className="inline-flex items-center text-2xl font-bold tracking-tight text-[#ee4d2d]">
          Shopee<span className="font-normal">Food</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold sm:mt-8 sm:text-3xl">Đăng nhập để đặt món</h1>
        <p className="mt-2 text-sm text-[#777777] sm:text-base">Theo dõi đơn và lưu địa chỉ giao hàng của bạn.</p>
        {error && <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-5 sm:mt-7">
          <label className="block text-sm font-bold">Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className="mt-2 w-full rounded-md border border-[#dddddd] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ee4d2d]/30" /></label>
          <label className="block text-sm font-bold">Mật khẩu<input aria-label="Mật khẩu" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-md border border-[#dddddd] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ee4d2d]/30" /></label>
          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-md bg-[#ee4d2d] px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#777777]">Chưa có tài khoản? <Link to={ROUTES.CUSTOMER_REGISTER} className="font-bold text-[#c5371d]">Đăng ký ngay</Link></p>
        <p className="mt-3 text-center text-sm"><Link to={ROUTES.LOGIN} className="font-semibold text-[#777777]">Đăng nhập portal nhà hàng</Link></p>
      </section>
    </main>
  );
};

export default CustomerLoginPage;
