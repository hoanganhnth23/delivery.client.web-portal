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
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] p-6">
      <section className="w-full max-w-md rounded-3xl border border-[#eadfce] bg-white p-8 shadow-lg">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-xl font-black text-[#ed8a16]">
          <span aria-hidden="true" className="material-symbols-outlined">local_dining</span>
          Delivery
        </Link>
        <h1 className="mt-8 text-3xl font-black">Đăng nhập để đặt món</h1>
        <p className="mt-2 text-[#806c57]">Theo dõi đơn và lưu địa chỉ giao hàng của bạn.</p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-bold">Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <label className="block text-sm font-bold">Mật khẩu<input aria-label="Mật khẩu" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#806c57]">Chưa có tài khoản? <Link to={ROUTES.CUSTOMER_REGISTER} className="font-bold text-[#a85d0c]">Đăng ký ngay</Link></p>
        <p className="mt-3 text-center text-sm"><Link to={ROUTES.LOGIN} className="font-semibold text-[#806c57]">Đăng nhập portal nhà hàng</Link></p>
      </section>
    </main>
  );
};

export default CustomerLoginPage;
