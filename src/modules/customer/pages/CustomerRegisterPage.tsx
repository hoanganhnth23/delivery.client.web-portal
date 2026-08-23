import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import { ROUTES } from '@/utils/constants';

const CustomerRegisterPage = () => {
  const { auth } = useAppDependencies();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập họ tên, email và mật khẩu');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await auth.registerCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      navigate(`${ROUTES.CUSTOMER_LOGIN}?registered=1`, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] p-6">
      <section className="w-full max-w-lg rounded-3xl border border-[#eadfce] bg-white p-8 shadow-lg">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-xl font-black text-[#ed8a16]">
          <span aria-hidden="true" className="material-symbols-outlined">local_dining</span>
          Delivery
        </Link>
        <h1 className="mt-8 text-3xl font-black">Tạo tài khoản khách hàng</h1>
        <p className="mt-2 text-[#806c57]">Đăng ký xong, hãy kiểm tra email để kích hoạt tài khoản.</p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-bold sm:col-span-2">Họ và tên<input aria-label="Họ và tên" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <label className="block text-sm font-bold sm:col-span-2">Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <label className="block text-sm font-bold">Số điện thoại<input aria-label="Số điện thoại" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <label className="block text-sm font-bold">Mật khẩu<input aria-label="Mật khẩu" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <label className="block text-sm font-bold sm:col-span-2">Nhập lại mật khẩu<input aria-label="Nhập lại mật khẩu" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></label>
          <button type="submit" disabled={loading} className="sm:col-span-2 w-full rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#806c57]">Đã có tài khoản? <Link to={ROUTES.CUSTOMER_LOGIN} className="font-bold text-[#a85d0c]">Đăng nhập</Link></p>
      </section>
    </main>
  );
};

export default CustomerRegisterPage;
