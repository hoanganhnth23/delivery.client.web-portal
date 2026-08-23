import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import { ROUTES } from '@/utils/constants';

const VerifyEmailPage = () => {
  const { auth } = useAppDependencies();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Đang xác minh email…' : 'Liên kết xác minh không hợp lệ');

  useEffect(() => {
    if (!token) return;
    void auth.confirmEmailVerification(token)
      .then(() => {
        setState('success');
        setMessage('Email đã được xác minh. Bạn có thể đăng nhập để đặt món.');
      })
      .catch((caught) => {
        setState('error');
        setMessage(caught instanceof Error ? caught.message : 'Không thể xác minh email');
      });
  }, [auth, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] p-6">
      <section className="w-full max-w-md rounded-3xl border border-[#eadfce] bg-white p-8 text-center shadow-lg">
        <span className={`material-symbols-outlined text-5xl ${state === 'success' ? 'text-green-600' : state === 'error' ? 'text-red-500' : 'text-[#ed8a16]'}`}>
          {state === 'success' ? 'verified' : state === 'error' ? 'error' : 'hourglass_top'}
        </span>
        <h1 className="mt-5 text-2xl font-black">Xác minh email</h1>
        <p className="mt-3 text-[#806c57]">{message}</p>
        <Link to={ROUTES.CUSTOMER_LOGIN} className="mt-7 inline-flex rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white">Tới trang đăng nhập</Link>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
