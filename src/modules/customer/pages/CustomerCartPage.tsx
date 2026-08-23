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
        <section className="rounded-3xl border border-dashed border-[#d7c5af] bg-white p-12 text-center">
          <div className="text-6xl">🛍️</div>
          <h2 className="mt-5 text-2xl font-black">Giỏ hàng đang trống</h2>
          <p className="mt-2 text-[#806c57]">Hãy chọn một nhà hàng để bắt đầu.</p>
          <Link to={ROUTES.HOME} className="mt-6 inline-flex rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white">Khám phá nhà hàng</Link>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-[#eadfce] bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-[#eadfce] pb-5">
              <div><p className="text-sm text-[#806c57]">Nhà hàng</p><h2 className="text-xl font-black">{cart.restaurantName}</h2></div>
              <button type="button" onClick={clear} className="text-sm font-bold text-red-600">Xóa giỏ</button>
            </div>
            <div className="divide-y divide-[#eadfce]">
              {cart.items.map((item) => (
                <article key={item.menuItemId} className="flex gap-4 py-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f6ead9]">
                    {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🍱</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3"><h3 className="font-black">{item.menuItemName}</h3><button type="button" onClick={() => remove(item.menuItemId)} aria-label={`Xóa ${item.menuItemName}`} className="text-sm font-bold text-red-500">Xóa</button></div>
                    <p className="mt-1 text-sm font-semibold text-[#ed8a16]">{formatCurrency(item.price)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-lg border border-[#dfd2c1]">
                        <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} aria-label={`Giảm ${item.menuItemName}`} className="px-3 py-1.5 text-lg">−</button>
                        <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} aria-label={`Tăng ${item.menuItemName}`} className="px-3 py-1.5 text-lg">+</button>
                      </div>
                      <input aria-label={`Ghi chú ${item.menuItemName}`} value={item.notes ?? ''} onChange={(event) => updateNotes(item.menuItemId, event.target.value)} placeholder="Ghi chú món" className="min-w-44 flex-1 rounded-lg border border-[#dfd2c1] px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <strong className="hidden self-start text-sm sm:block">{formatCurrency(item.price * item.quantity)}</strong>
                </article>
              ))}
            </div>
          </section>
          <aside className="h-fit rounded-3xl border border-[#eadfce] bg-white p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-black">Tạm tính</h2>
            <div className="mt-5 flex justify-between text-[#806c57]"><span>Tiền món</span><span>{formatCurrency(cartDisplaySubtotal(cart))}</span></div>
            <div className="mt-3 flex justify-between border-b border-[#eadfce] pb-5 text-[#806c57]"><span>Phí giao hàng</span><span>Tính ở checkout</span></div>
            <div className="mt-5 flex justify-between text-lg font-black"><span>Tạm tính</span><span className="text-[#ed8a16]">{formatCurrency(cartDisplaySubtotal(cart))}</span></div>
            <Link to={ROUTES.CUSTOMER_CHECKOUT} className="mt-6 flex justify-center rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white">Tiếp tục checkout</Link>
          </aside>
        </div>
      )}
    </CustomerShell>
  );
};

export default CustomerCartPage;
