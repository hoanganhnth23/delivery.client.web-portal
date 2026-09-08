import { Link } from 'react-router-dom';
import { CustomerShell } from '../components/CustomerShell';
import { useCustomerCart } from '../cart/useCustomerCart';
import { cartDisplaySubtotal } from '../cart/cart';
import { formatCurrency } from '../utils';
import { ROUTES } from '@/utils/constants';

const CustomerCartPage = () => {
  const { cart, updateQuantity, updateNotes, remove, clear } = useCustomerCart();

  return (
    <CustomerShell title="Giỏ hàng">
      {!cart ? (
        <section className="rounded-lg border border-dashed border-[#dddddd] bg-white p-8 text-center sm:rounded-lg sm:p-12">
          <div className="text-[#b88d7a]"><span aria-hidden="true" className="material-symbols-outlined text-6xl">shopping_bag</span></div>
          <h2 className="mt-5 text-2xl font-bold">Giỏ hàng đang trống</h2>
          <p className="mt-2 text-[#777777]">Hãy chọn một nhà hàng để bắt đầu.</p>
          <Link to={ROUTES.HOME} className="mt-6 inline-flex rounded-md bg-[#ee4d2d] px-5 py-3 font-bold text-white">Khám phá nhà hàng</Link>
        </section>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-[#eeeeee] pb-4 sm:items-center sm:pb-5">
              <div><p className="text-sm text-[#777777]">Nhà hàng</p><h2 className="text-xl font-bold">{cart.restaurantName}</h2></div>
              <button type="button" onClick={clear} className="text-sm font-bold text-red-600">Xóa giỏ</button>
            </div>
            <div className="divide-y divide-[#eeeeee]">
              {cart.items.map((item) => (
                <article key={item.menuItemId} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-4 sm:flex sm:gap-4 sm:py-5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#f5efeb] sm:h-20 sm:w-20">
                    {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#b88d7a]"><span aria-hidden="true" className="material-symbols-outlined text-2xl">restaurant_menu</span></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words font-bold">{item.menuItemName}</h3><button type="button" onClick={() => remove(item.menuItemId)} aria-label={`Xóa ${item.menuItemName}`} className="shrink-0 text-sm font-bold text-red-500">Xóa</button></div>
                    <p className="mt-1 text-sm font-semibold text-[#ee4d2d]">{formatCurrency(item.price)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center rounded-lg border border-[#dddddd]">
                        <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} aria-label={`Giảm ${item.menuItemName}`} className="min-h-10 min-w-10 px-2 py-1.5 text-lg">−</button>
                        <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} aria-label={`Tăng ${item.menuItemName}`} className="min-h-10 min-w-10 px-2 py-1.5 text-lg">+</button>
                      </div>
                      <input aria-label={`Ghi chú ${item.menuItemName}`} value={item.notes ?? ''} onChange={(event) => updateNotes(item.menuItemId, event.target.value)} placeholder="Ghi chú món" className="min-w-0 w-full flex-1 rounded-lg border border-[#dddddd] px-3 py-2 text-sm sm:min-w-44" />
                    </div>
                  </div>
                  <strong className="hidden self-start text-sm sm:block">{formatCurrency(item.price * item.quantity)}</strong>
                </article>
              ))}
            </div>
          </section>
          <aside className="h-fit rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">Tạm tính</h2>
            <div className="mt-5 flex justify-between text-[#777777]"><span>Tiền món</span><span>{formatCurrency(cartDisplaySubtotal(cart))}</span></div>
            <div className="mt-3 flex justify-between border-b border-[#eeeeee] pb-5 text-[#777777]"><span>Phí giao hàng</span><span>Tính ở checkout</span></div>
            <div className="mt-5 flex justify-between text-lg font-bold"><span>Tạm tính</span><span className="text-[#ee4d2d]">{formatCurrency(cartDisplaySubtotal(cart))}</span></div>
            <Link to={ROUTES.CUSTOMER_CHECKOUT} className="mt-6 flex min-h-11 items-center justify-center rounded-md bg-[#ee4d2d] px-5 py-3 font-bold text-white">Tiếp tục checkout</Link>
          </aside>
        </div>
      )}
    </CustomerShell>
  );
};

export default CustomerCartPage;
