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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4 sm:p-6">
      <section className="w-full max-w-md rounded-lg border border-[#eeeeee] bg-white p-6 text-center shadow-lg sm:rounded-lg sm:p-8">
        <span className={`material-symbols-outlined text-5xl ${state === 'success' ? 'text-green-600' : state === 'error' ? 'text-red-500' : 'text-[#ee4d2d]'}`}>
          {state === 'success' ? 'verified' : state === 'error' ? 'error' : 'hourglass_top'}
        </span>
        <h1 className="mt-5 text-2xl font-bold">Xác minh email</h1>
        <p className="mt-3 text-[#777777]">{message}</p>
        <Link to={ROUTES.CUSTOMER_LOGIN} className="mt-7 inline-flex min-h-11 items-center rounded-md bg-[#ee4d2d] px-5 py-3 font-bold text-white">Tới trang đăng nhập</Link>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
