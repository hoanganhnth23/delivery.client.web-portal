import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  catalog,
  previewInitialState,
  orderStatuses,
  reducer,
  subtotal,
  total,
  type Address,
  type Item,
  type Restaurant,
} from "./model";
import "./preview.css";
import "./desktop.css";
import OrderTracking from "./OrderTracking";
import AccountPage from "./AccountPage";
import AccountProfilePage from "./AccountProfilePage";
import AccountSettingsPage from "./AccountSettingsPage";
import type { PreviewTheme } from "./AccountSettingsPage";
import CustomerLiveStreamViewer from "./CustomerLiveStreamViewer";
import { LIVE_STREAMS_DATA } from "./liveStreamsData";
import SupportChatPage from "./SupportChatPage";
import { resetPreviewSupportChat } from "../support-preview/previewSupportChat";

const base = "/preview/shopeefood";
const money = (v: number) => `${v.toLocaleString("vi-VN")}đ`;
const screens = [
  ["home", "Trang chủ"],
  ["live", "ShopeeFood Live"],
  ["search", "Tìm kiếm"],
  ["restaurant/1", "Chi tiết quán"],
  ["cart", "Giỏ hàng"],
  ["addresses", "Địa chỉ của tôi"],
  ["account", "Tôi · Tài khoản"],
  ["account/profile", "Thông tin cá nhân"],
  ["account/settings", "Cài đặt"],
  ["support", "Hỗ trợ CSKH"],
  ["checkout", "Checkout"],
  ["orders", "Đơn hàng"],
  ["login", "Đăng nhập"],
  ["register", "Đăng ký"],
  ["verify", "Xác minh email"],
];
function Icon({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="material-symbols-outlined">
      {name}
    </span>
  );
}
function Photo({ src, className = "" }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`sf-photo-fallback ${className}`}>
      <Icon name="restaurant" />
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt=""
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
function Sheet({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="sf-sheet"
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button aria-label="Đóng" onClick={close}>
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export default function CustomerPreview() {
  const [state, dispatch] = useReducer(reducer, undefined, previewInitialState);
  const location = useLocation();
  const navigate = useNavigate();
  const route =
    location.pathname.slice(base.length).replace(/^\//, "") || "home";
  const params = new URLSearchParams(location.search);
  const phoneView = params.get("view") === "phone";
  const workbenchView = params.get("view") === "workbench";
  const context =
    params.get("context") === "checkout"
      ? "checkout"
      : params.get("context") === "home"
        ? "home"
        : "manage";
  const [width, setWidth] = useState(390);
  const [signedIn, setSignedIn] = useState(true);
  const [theme, setTheme] = useState<PreviewTheme>("light");
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [scenario, setScenario] = useState("normal");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("Đề xuất");
  const [orderTab, setOrderTab] = useState("Đang đến");
  const [menuTab, setMenuTab] = useState("Phổ biến");
  const [selected, setSelected] = useState<{
    item: Item;
    restaurant: Restaurant;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");
  const [replace, setReplace] = useState(false);
  const [voucherSheet, setVoucherSheet] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  const restaurant =
    catalog.find((r) => r.id === Number(route.split("/")[1])) ?? catalog[0];
  const cartRestaurant = catalog.find((r) => r.id === state.restaurantId);
  const homeAddress = state.addresses.find((a) => a.id === state.homeId);
  const deliveryAddress = state.addresses.find(
    (a) => a.id === (state.checkoutId ?? state.homeId),
  );
  const count = state.lines.reduce((n, l) => n + l.quantity, 0);
  const go = (path: string) => {
    const view = params.get("view");
    const suffix = view ? `${path.includes("?") ? "&" : "?"}view=${encodeURIComponent(view)}` : "";
    navigate(`${base}/${path}${suffix}`);
    setSelected(null);
    setEditing(null);
    setVoucherSheet(false);
  };
  const startCheckout = () => {
    dispatch({ type: "beginCheckout" });
    go("checkout");
  };
  const openItem = (item: Item, r: Restaurant) => {
    setQuantity(1);
    setItemNote("");
    setReplace(false);
    setSelected({ item, restaurant: r });
  };
  const add = () => {
    if (!selected) return;
    if (
      state.lines.length &&
      state.restaurantId !== selected.restaurant.id &&
      !replace
    ) {
      setReplace(true);
      return;
    }
    dispatch({
      type: "add",
      item: selected.item,
      restaurantId: selected.restaurant.id,
      quantity,
      note: itemNote,
      replace,
    });
    setSelected(null);
  };
  const heading = (title: string, back = "home") => (
    <header className="sf-header">
      <button aria-label="Quay lại" onClick={() => go(back)}>
        <Icon name="arrow_back" />
      </button>
      <h1>{title}</h1>
      <button aria-label="Giỏ hàng" onClick={() => go("cart")}>
        <Icon name="shopping_bag" />
        {count > 0 && <sup>{count}</sup>}
      </button>
    </header>
  );
  const empty = (
    title: string,
    subtitle: string,
    action = "Khám phá món ngon",
    path = "home",
  ) => (
    <div className="sf-empty">
      <Icon name="receipt_long" />
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <button className="sf-primary" onClick={() => { if (action === "Xóa tìm kiếm") { setQuery(""); setCategory("Tất cả"); setScenario("normal"); } go(path); }}>
        {action}
      </button>
    </div>
  );
  const nav = (
    <nav className="sf-nav" aria-label="Điều hướng">
      <button
        className={["home", "search"].includes(route) ? "active" : ""}
        onClick={() => go("home")}
      >
        <Icon name="home" />
        Trang chủ
      </button>
      <button
        className={route.startsWith("live") ? "active" : ""}
        onClick={() => go("live")}
      >
        <Icon name="live_tv" />
        Live
      </button>
      <button
        className={route.startsWith("order") ? "active" : ""}
        onClick={() => go("orders")}
      >
        <Icon name="receipt_long" />
        Đơn hàng
      </button>
      <button
        className={route === "cart" ? "active" : ""}
        onClick={() => go("cart")}
      >
        <Icon name="shopping_bag" />
        Giỏ hàng {count || ""}
      </button>
      <button
        className={route.startsWith("account") || (route === "addresses" && context === "manage") ? "active" : ""}
        onClick={() => go("account")}
      >
        <Icon name="person" />
        Tôi
      </button>
    </nav>
  );
  const restRow = (r: Restaurant) => (
    <button
      className="sf-rest"
      key={r.id}
      onClick={() => go(`restaurant/${r.id}`)}
    >
      <Photo src={r.image} />
      <div>
        <h3>
          <span className="sf-preferred">Yêu thích</span> {r.name}
        </h3>
        <p>
          <span className="sf-star">★</span> {r.rating}{" "}
          <span className="sf-divider">|</span> {r.distance} km{" "}
          <span className="sf-divider">|</span> 20–30 phút
        </p>
        <span className="sf-promo">Freeship Xtra</span>{" "}
        <span className="sf-promo light">Giảm 15.000đ</span>
      </div>
    </button>
  );
  const filtered = catalog
    .filter(
      (r) =>
        (!query ||
          `${r.name} ${r.items.map((i) => i.name).join(" ")}`
            .toLocaleLowerCase("vi")
            .includes(query.toLocaleLowerCase("vi"))) &&
        (category === "Tất cả" || r.category === category),
    )
    .sort((a, b) =>
      sort === "Đánh giá"
        ? b.rating - a.rating
        : Number(a.distance) - Number(b.distance),
    );
  let content: ReactNode;
  if (route === "home" || route === "search")
    content = (
      <>
        <div className="sf-home-top">
          <div className="sf-miniapp">
            <button onClick={() => go("login")} aria-label="Tài khoản Shopee">
              <Icon name="arrow_back" />
            </button>
            <strong>
              Shopee<span>Food</span>
            </strong>
            <div className="sf-capsule">
              <button
                aria-label="Quản lý địa chỉ"
                onClick={() => go("addresses")}
              >
                <Icon name="more_horiz" />
              </button>
              <i />
              <button
                aria-label="Về trang chủ"
                onClick={() => {
                  setQuery("");
                  go("home");
                }}
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
          <button
            className="sf-location"
            onClick={() => go("addresses?context=home")}
          >
            <Icon name="location_on" />
            <span>
              Giao đến: <b>{homeAddress?.line ?? "Chọn địa chỉ giao hàng"}</b>
            </span>
            <Icon name="chevron_right" />
          </button>
          <form
            className="sf-search"
            onSubmit={(e) => {
              e.preventDefault();
              go("search");
            }}
          >
            <Icon name="search" />
            <input
              aria-label="Tìm món hoặc quán"
              placeholder="Tìm món ngon, quán yêu thích…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Tìm</button>
          </form>
        </div>
        {route === "home" && (
          <>
            <section className="sf-banner">
              <div>
                <small>ĐẠI TIỆC MÓN NGON</small>
                <h2>
                  Ăn ngon mỗi ngày
                  <br />
                  <em>FREESHIP XTRA</em>
                </h2>
                <p>Ưu đãi giao hàng 15.000đ</p>
                <button
                  onClick={() => {
                    setCategory("Tất cả");
                    go("search");
                  }}
                >
                  Đặt ngay <Icon name="arrow_forward" />
                </button>
              </div>
              <Photo src={catalog[0].items[0].image} />
            </section>
            <div className="sf-dots">
              <b />
              <i />
              <i />
            </div>
            <div className="sf-shortcuts">
              {[
                ["Tất cả", "restaurant"],
                ["Mì & phở", "ramen_dining"],
                ["Cơm & bún", "rice_bowl"],
                ["Bánh cuốn", "bakery_dining"],
                ["Ăn vặt", "cookie"],
              ].map(([label, icon]) => (
                <button
                  key={label}
                  onClick={() => {
                    setCategory(label);
                    go("search");
                  }}
                >
                  <span>
                    <Icon name={icon} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <section className="sf-deal-strip">
              <Icon name="confirmation_number" />
              <span>
                <b>Freeship cho bữa ngon</b>
                <small>Áp dụng trong bản trải nghiệm</small>
              </span>
              <button onClick={() => setVoucherSheet(true)}>Lấy mã</button>
            </section>
            <section className="sf-featured">
              <div className="sf-section-title">
                <h2>Hôm nay ăn gì?</h2>
                <button onClick={() => go("search")}>
                  Xem tất cả <Icon name="chevron_right" />
                </button>
              </div>
              <div className="sf-horizontal">
                {catalog.slice(0, 4).map((r) => (
                  <button key={r.id} onClick={() => go(`restaurant/${r.id}`)}>
                    <Photo src={r.items[2].image} />
                    <b>{r.items[2].name}</b>
                    <span>{money(r.items[2].price)}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="sf-live-section">
              <div className="sf-section-title">
                <div className="sf-live-title-wrap">
                  <span className="sf-live-dot-pulse" />
                  <h2>ShopeeFood Live</h2>
                  <span className="sf-live-pill">Đang phát</span>
                </div>
                <button onClick={() => go("live")}>
                  Xem tất cả <Icon name="chevron_right" />
                </button>
              </div>
              <div className="sf-live-cards-scroll">
                {LIVE_STREAMS_DATA.map((stream) => (
                  <div
                    key={stream.id}
                    className="sf-live-card"
                    onClick={() => go(`live/${stream.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="sf-live-card-thumb">
                      <img src={stream.thumbnail} alt={stream.title} />
                      <div className="sf-live-card-badge">
                        <span className="sf-live-badge-red">🔴 LIVE</span>
                        <span className="sf-live-badge-viewers">{stream.viewers.toLocaleString()}</span>
                      </div>
                      <div className="sf-live-card-deal-tag">
                        <span>{stream.dealTag}</span>
                      </div>
                    </div>
                    <div className="sf-live-card-info">
                      <div className="sf-live-card-host">
                        <img src={stream.restaurantImage} alt={stream.restaurantName} />
                        <span className="truncate">{stream.restaurantName}</span>
                      </div>
                      <p className="sf-live-card-title">{stream.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <section className="sf-catalog">
          <h2>
            {route === "search" ? "Kết quả tìm kiếm" : "Quán ngon dành cho bạn"}
          </h2>
          <div className="sf-chips">
            {["Đề xuất", "Gần tôi", "Đánh giá"].map((v) => (
              <button
                className={sort === v ? "active" : ""}
                key={v}
                onClick={() => setSort(v)}
              >
                {v}
                {v === "Đề xuất" && <Icon name="tune" />}
              </button>
            ))}
            {category !== "Tất cả" && (
              <button onClick={() => setCategory("Tất cả")}>
                {category} ×
              </button>
            )}
          </div>
          {scenario === "loading" ? (
            <div className="sf-skeleton" role="status">
              Đang tìm món ngon…
              {[1, 2, 3].map((i) => (
                <div key={i} />
              ))}
            </div>
          ) : scenario === "error" ? (
            <div className="sf-empty" role="alert">
              <h2>Chưa tải được danh sách</h2>
              <p>Vui lòng thử lại.</p>
              <button
                className="sf-primary"
                onClick={() => setScenario("normal")}
              >
                Thử lại
              </button>
            </div>
          ) : scenario === "empty" || !filtered.length ? (
            empty(
              "Chưa tìm thấy quán",
              "Thử một tên món hoặc quán khác.",
              "Xóa tìm kiếm",
              "home",
            )
          ) : (
            filtered.map(restRow)
          )}
        </section>
        {nav}
      </>
    );
  else if (route.startsWith("restaurant/"))
    content = (
      <>
        {heading(restaurant.name)}
        <Photo src={restaurant.image} className="sf-cover" />
        <section className="sf-restaurant-info">
          <span className="sf-preferred">Quán yêu thích</span>
          <h1>{restaurant.name}</h1>
          <p>
            <span className="sf-star">★</span> {restaurant.rating} (100+){" "}
            <span className="sf-divider">|</span> {restaurant.distance} km
          </p>
          <p className="sf-muted">{restaurant.address}</p>
          <p>
            <span className="sf-open">● Đang mở cửa</span> · 08:00 – 22:00
          </p>
        </section>
        <button
          className="sf-delivery-row"
          onClick={() => go("addresses?context=home")}
        >
          <Icon name="delivery_dining" />
          <span>
            Giao trong 20–30 phút
            <small>{homeAddress?.label ?? "Chọn địa chỉ"}</small>
          </span>
          <Icon name="chevron_right" />
        </button>
        <button className="sf-offer-row" onClick={() => setVoucherSheet(true)}>
          <Icon name="confirmation_number" />
          Freeship Xtra · Giảm phí giao 15.000đ
          <Icon name="chevron_right" />
        </button>
        <div className="sf-tabs">
          {["Phổ biến", "Thực đơn", "Thông tin"].map((t) => (
            <button
              className={menuTab === t ? "active" : ""}
              key={t}
              onClick={() => setMenuTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {menuTab === "Thông tin" ? (
          <section className="sf-block">
            <h2>Thông tin quán</h2>
            <p>{restaurant.address}</p>
            <p>Giờ mở cửa: 08:00–22:00</p>
          </section>
        ) : (
          <section className="sf-menu">
            <h2>
              {menuTab === "Phổ biến" ? "Món được yêu thích" : "Thực đơn"}
            </h2>
            {restaurant.items.map((item) => (
              <article className="sf-menu-item" key={item.id}>
                <button
                  aria-label={`Xem ${item.name}`}
                  onClick={() => openItem(item, restaurant)}
                >
                  <Photo src={item.image} />
                </button>
                <div>
                  <h3>{item.name}</h3>
                  <p className="sf-muted">Chuẩn vị, chế biến khi nhận đơn</p>
                  <small>Được yêu thích</small>
                  <div className="sf-price-row">
                    <b>{money(item.price)}</b>
                    <button
                      className="sf-add"
                      aria-label={`Thêm ${item.name}`}
                      onClick={() => openItem(item, restaurant)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
        {count > 0 && (
          <div className="sf-bottom">
            <button
              className="sf-primary sf-cart-cta"
              onClick={() => go("cart")}
            >
              <span>
                {count} món · {money(subtotal(state))}
              </span>
              <span>Xem giỏ hàng →</span>
            </button>
          </div>
        )}
      </>
    );
  else if (route === "cart")
    content = (
      <>
        {heading("Giỏ hàng")}
        {!count ? (
          empty("Giỏ hàng đang trống", "Món ngon đang chờ bạn khám phá!")
        ) : (
          <>
            <section className="sf-block">
              <h2>{cartRestaurant?.name}</h2>
              {state.lines.map((l) => (
                <article className="sf-cart-line" key={l.item.id}>
                  <Photo src={l.item.image} />
                  <div>
                    <h3>{l.item.name}</h3>
                    <p className="sf-muted">{l.note || "Không có ghi chú"}</p>
                    <b>{money(l.item.price)}</b>
                    <div className="sf-stepper">
                      <button
                        aria-label={`Giảm ${l.item.name}`}
                        onClick={() =>
                          dispatch({
                            type: "quantity",
                            id: l.item.id,
                            quantity: l.quantity - 1,
                          })
                        }
                      >
                        −
                      </button>
                      <span>{l.quantity}</span>
                      <button
                        aria-label={`Tăng ${l.item.name}`}
                        onClick={() =>
                          dispatch({
                            type: "quantity",
                            id: l.item.id,
                            quantity: l.quantity + 1,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              <button
                className="sf-text-button"
                onClick={() => go(`restaurant/${state.restaurantId}`)}
              >
                + Thêm món
              </button>
            </section>
            <section className="sf-block sf-row">
              <span>Tạm tính ({count} món)</span>
              <b>{money(subtotal(state))}</b>
            </section>
            <div className="sf-bottom">
              <button className="sf-primary" onClick={startCheckout}>
                Giao hàng · {money(subtotal(state))}
              </button>
            </div>
          </>
        )}
        {nav}
      </>
    );
  else if (route === "account") content = <>{heading("Tôi")}<AccountPage signedIn={signedIn} navigate={go} logout={() => { setSignedIn(false); go("login"); }} />{nav}</>;
  else if (route === "account/profile") content = <>{heading("Thông tin cá nhân", "account")}<AccountProfilePage />{nav}</>;
  else if (route === "account/settings") content = <>{heading("Cài đặt", "account")}<AccountSettingsPage theme={theme} setTheme={setTheme} debugEnabled={debugEnabled} setDebugEnabled={setDebugEnabled} route={route} width={width} />{nav}</>;
  else if (route === "support") content = <SupportChatPage onBack={() => go("account")} />;
  else if (route === "addresses")
    content = (
      <>
        {heading(
          context === "manage" ? "Địa chỉ của tôi" : "Chọn địa chỉ giao hàng",
          context === "checkout" ? "checkout" : context === "manage" ? "account" : "home",
        )}
        <div className="sf-addresses">
          {state.addresses.map((a) => (
            <article
              key={a.id}
              className={`sf-address ${context !== "manage" && a.id === (context === "home" ? state.homeId : (state.checkoutId ?? state.homeId)) ? "selected" : ""}`}
            >
              <button
                className="sf-address-main"
                onClick={() => {
                  if (context === "manage") {
                    setEditing(a);
                    return;
                  }
                  dispatch({ type: "selectAddress", context, id: a.id });
                  go(context === "home" ? "home" : "checkout");
                }}
              >
                <Icon name={a.label === "Văn phòng" ? "work" : "home"} />
                <span>
                  <b>{a.name}</b>
                  <small>{a.phone}</small>
                  <p>{a.line}</p>
                  <span className="sf-address-tag">{a.label}</span>
                  {a.isDefault && <span className="sf-default">Mặc định</span>}
                </span>
              </button>
              <button className="sf-text-button" onClick={() => setEditing(a)}>
                Sửa
              </button>
            </article>
          ))}
        </div>
        <button
          className="sf-new-address"
          onClick={() =>
            setEditing({
              id: Math.max(0, ...state.addresses.map((a) => a.id)) + 1,
              label: "Nhà riêng",
              name: "",
              phone: "",
              line: "",
              isDefault: !state.addresses.length,
            })
          }
        >
          <Icon name="add_circle_outline" /> Thêm địa chỉ mới
        </button>
        {context === "manage" && nav}
      </>
    );
  else if (route === "checkout")
    content = (
      <>
        {heading("Xác nhận đơn hàng", "cart")}
        {!count ? (
          empty("Chưa có món trong giỏ", "Chọn món để bắt đầu đặt hàng.")
        ) : (
          <>
            <button
              className="sf-checkout-address"
              onClick={() => go("addresses?context=checkout")}
            >
              <Icon name="location_on" />
              <span>
                <b>{deliveryAddress?.label ?? "Thêm địa chỉ giao hàng"}</b>
                <p>{deliveryAddress?.line}</p>
                <small>
                  {deliveryAddress?.name} · {deliveryAddress?.phone}
                </small>
              </span>
              <Icon name="chevron_right" />
            </button>
            <section className="sf-block">
              <h2>{cartRestaurant?.name}</h2>
              <p className="sf-muted">Giao hàng · 20–30 phút</p>
              {state.lines.map((l) => (
                <div className="sf-order-line" key={l.item.id}>
                  <span className="sf-qty">{l.quantity}×</span>
                  <span>
                    {l.item.name}
                    {l.note && <small>{l.note}</small>}
                  </span>
                  <b>{money(l.item.price * l.quantity)}</b>
                </div>
              ))}
              <label className="sf-note">
                Ghi chú cho quán
                <input
                  placeholder="Ví dụ: ít cay, không hành"
                  value={state.note}
                  maxLength={500}
                  onChange={(e) =>
                    dispatch({ type: "note", note: e.target.value })
                  }
                />
              </label>
            </section>
            <button
              className="sf-setting-row"
              onClick={() => setVoucherSheet(true)}
            >
              <Icon name="confirmation_number" />
              <b>ShopeeFood Voucher</b>
              <span>
                {state.voucher ? "−15.000đ" : "Chọn mã"}{" "}
                <Icon name="chevron_right" />
              </span>
            </button>
            <section className="sf-block">
              <h2>Chi tiết thanh toán</h2>
              <div className="sf-row">
                <span>Tổng tiền món ({count} món)</span>
                <span>{money(subtotal(state))}</span>
              </div>
              <div className="sf-row">
                <span>Phí giao hàng</span>
                <span>15.000đ</span>
              </div>
              {state.voucher && (
                <div className="sf-row sf-orange">
                  <span>Ưu đãi phí giao hàng</span>
                  <span>−15.000đ</span>
                </div>
              )}
              <div className="sf-row sf-total">
                <b>Tổng thanh toán</b>
                <b>{money(total(state))}</b>
              </div>
            </section>
            <section className="sf-block sf-row">
              <Icon name="payments" />
              <span>Thanh toán khi nhận hàng</span>
            </section>
            <p className="sf-footnote">
              Kiểm tra địa chỉ và món ăn trước khi đặt đơn.
            </p>
            <div className="sf-bottom sf-pay">
              <div>
                <small>Tổng thanh toán</small>
                <b>{money(total(state))}</b>
              </div>
              <button
                className="sf-primary"
                disabled={!deliveryAddress}
                onClick={() => {
                  const id = state.orders.length + 1001;
                  dispatch({ type: "place" });
                  go(`order/${id}`);
                }}
              >
                Đặt đơn
              </button>
            </div>
          </>
        )}
      </>
    );
  else if (route === "orders") {
    const orders = state.orders.filter((o) =>
      orderTab === "Lịch sử"
        ? ["Đã giao", "Đã hủy"].includes(o.status)
        : !["Đã giao", "Đã hủy"].includes(o.status),
    );
    content = (
      <>
        {heading("Đơn hàng")}
        <div className="sf-tabs">
          {["Đang đến", "Lịch sử"].map((t) => (
            <button
              key={t}
              className={orderTab === t ? "active" : ""}
              onClick={() => setOrderTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {!orders.length
          ? empty(
              "Chưa có đơn hàng",
              "Đặt món yêu thích và theo dõi đơn tại đây.",
            )
          : orders.map((o) => (
              <button
                className="sf-order-card"
                key={o.id}
                onClick={() => go(`order/${o.id}`)}
              >
                <span className="sf-row">
                  <b>{catalog.find((r) => r.id === o.restaurantId)?.name}</b>
                  <Icon name="chevron_right" />
                </span>
                <p className="sf-orange">{o.status}</p>
                <div className="sf-row">
                  <Photo src={o.lines[0].item.image} />
                  <span>
                    {o.lines[0].item.name}
                    <small>
                      {o.lines.reduce((n, l) => n + l.quantity, 0)} món
                    </small>
                  </span>
                  <b>{money(o.total)}</b>
                </div>
                <small>Đơn #{o.id}</small>
              </button>
            ))}
        {nav}
      </>
    );
  } else if (route.startsWith("order/")) {
    const order = state.orders.find(
      (o) => o.id === Number(route.split("/")[1]),
    );
    content = (
      <>
        {heading("Chi tiết đơn hàng", "orders")}
        {!order ? (
          empty("Chưa có đơn này", "Hãy tạo một đơn trong bản trải nghiệm.")
        ) : (
          <>
            <div className="sf-order-status">
              <Icon
                name={
                  order.status === "Đã giao"
                    ? "check_circle"
                    : order.status === "Đã hủy"
                      ? "cancel"
                      : "delivery_dining"
                }
              />
              <h2>{order.status}</h2>
              <p>
                {order.status === "Chờ xác nhận"
                  ? "Quán đang tiếp nhận đơn hàng của bạn."
                  : order.status === "Đang giao"
                    ? "Tài xế đang mang món ngon đến bạn."
                    : order.status === "Đã giao"
                      ? "Chúc bạn ngon miệng!"
                      : order.status === "Đã hủy" ? "Đơn hàng đã được hủy." : order.status === "Quán đang chuẩn bị" ? "Quán đang chuẩn bị món ngon cho bạn." : "Tài xế đang đến quán lấy món."}
              </p>
            </div>
            <OrderTracking key={order.id} order={order} onStatus={(status) => dispatch({ type: "status", id: order.id, status })} />
            <section className="sf-block">
              <h2>{catalog.find((r) => r.id === order.restaurantId)?.name}</h2>
              {order.lines.map((l) => (
                <div className="sf-row" key={l.item.id}>
                  <span>
                    {l.quantity}× {l.item.name}
                  </span>
                  <b>{money(l.item.price * l.quantity)}</b>
                </div>
              ))}
              <div className="sf-row sf-total">
                <b>Tổng thanh toán</b>
                <b>{money(order.total)}</b>
              </div>
              <p>Thanh toán khi nhận hàng</p>
            </section>
            <section className="sf-block">
              <h2>Địa chỉ nhận hàng</h2>
              <b>
                {order.address.name} · {order.address.phone}
              </b>
              <p>{order.address.line}</p>
              {order.note && <p>Ghi chú: {order.note}</p>}
              <small>Đơn #{order.id}</small>
            </section>
            {order.status === "Chờ xác nhận" && (
              <button
                className="sf-new-address"
                onClick={() => setCancelId(order.id)}
              >
                Hủy đơn hàng
              </button>
            )}
          </>
        )}
      </>
    );
  } else if (["login", "register", "verify"].includes(route))
    content = (
      <>
        {heading(
          route === "login"
            ? "Đăng nhập"
            : route === "register"
              ? "Đăng ký"
              : "Xác minh email",
        )}
        <section className="sf-auth">
          <div className="sf-shopee-mark">S</div>
          <h2>
            {route === "verify"
              ? "Kiểm tra email của bạn"
              : "Chào mừng đến với ShopeeFood"}
          </h2>
          <p className="sf-muted">
            {route === "verify"
              ? "Liên kết xác minh đã sẵn sàng trong bản trải nghiệm."
              : "Đăng nhập để khám phá món ngon mỗi ngày"}
          </p>
          {route === "verify" ? (
            <button className="sf-primary" onClick={() => go("home")}>
              Mô phỏng xác minh thành công
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (route === "login") setSignedIn(true);
                go(route === "register" ? "verify" : "account");
              }}
            >
              {route === "register" && (
                <input aria-label="Họ tên" placeholder="Họ và tên" required />
              )}
              <input
                type="email"
                aria-label="Email"
                placeholder="Email"
                required
                autoComplete="off"
              />
              <input
                type="password"
                aria-label="Mật khẩu"
                placeholder="Mật khẩu"
                minLength={6}
                required
                autoComplete="off"
              />
              <button className="sf-primary">
                {route === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
              <p>Tài khoản chỉ được mô phỏng, không lưu thông tin đăng nhập.</p>
              <button
                type="button"
                className="sf-text-button"
                onClick={() => go(route === "login" ? "register" : "login")}
              >
                {route === "login"
                  ? "Chưa có tài khoản? Đăng ký"
                  : "Đã có tài khoản? Đăng nhập"}
              </button>
            </form>
          )}
        </section>
      </>
    );
  else if (route === "live" || route.startsWith("live/")) {
    const liveStreamId = route.startsWith("live/") ? route.split("/")[1] : undefined;
    content = (
      <CustomerLiveStreamViewer
        streamId={liveStreamId}
        onClose={() => go("home")}
        onAddToCart={(item, rest) => {
          dispatch({ type: "add", item, restaurantId: rest.id, quantity: 1, note: "" });
        }}
        cartCount={count}
        onOpenCart={() => go("cart")}
      />
    );
  }
  else
    content = (
      <>
        {heading("Không tìm thấy màn")}
        {empty("Màn không tồn tại", "Chọn một màn trong bộ điều khiển.")}
      </>
    );
  return (
    <div className={`sf-workbench ${!workbenchView ? "sf-clean" : ""} ${!phoneView && !workbenchView ? "sf-responsive" : ""} ${theme === "dark" ? "sf-dark" : theme === "system" ? "sf-system" : ""}`} style={{ "--sf-width": `${width}px` } as React.CSSProperties}>
      <header className="sf-desktop-header">
        <div className="sf-desktop-header-inner">
          <button className="sf-desktop-brand" onClick={() => go("home")}>Shopee<span>Food</span></button>
          <button className="sf-desktop-address" onClick={() => go("addresses?context=home")}>
            <Icon name="location_on" /><span><small>Giao đến</small><b>{homeAddress?.line ?? "Chọn địa chỉ giao hàng"}</b></span><Icon name="expand_more" />
          </button>
          <nav aria-label="Điều hướng desktop">
            {[["home", "restaurant", "Khám phá"], ["live", "live_tv", "Live"], ["orders", "receipt_long", "Đơn hàng"], ["cart", "shopping_bag", `Giỏ hàng${count ? ` (${count})` : ""}`], ["account", "person", "Tôi"]].map(([path, icon, label]) => (
              <button key={path} onClick={() => go(path)} aria-current={route === path || route.startsWith(`${path}/`) ? "page" : undefined}><Icon name={icon} />{label}</button>
            ))}
          </nav>
        </div>
      </header>
      <aside className="sf-controls">
        <div className="sf-workbench-logo">
          <Icon name="phonelink_setup" />
          <b>Mobile preview</b>
        </div>
        <h2>ShopeeFood</h2>
        <p>Trong Shopee · iPhone</p>
        <label>
          Màn hình
          <select
            value={screens.some(([p]) => p === route) ? route : ""}
            onChange={(e) => go(e.target.value)}
          >
            <option value="" disabled>
              Chi tiết đang mở
            </option>
            {screens.map(([path, label]) => (
              <option value={path} key={path}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chiều rộng
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            <option value={375}>375 · iPhone mini</option>
            <option value={390}>390 · iPhone 13/14</option>
            <option value={430}>430 · iPhone Pro Max</option>
          </select>
        </label>
        <label>
          Trạng thái catalog
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          >
            {[
              ["normal", "Có dữ liệu"],
              ["loading", "Đang tải"],
              ["empty", "Trống"],
              ["error", "Lỗi kết nối"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {state.orders[0] && (
          <label>
            Trạng thái đơn mới nhất
            <select
              value={state.orders[0].status}
              onChange={(e) =>
                dispatch({
                  type: "status",
                  id: state.orders[0].id,
                  status: e.target.value,
                })
              }
            >
              {orderStatuses.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        )}
        <button
          className="sf-reset"
          onClick={() => {
            dispatch({ type: "reset" });
            resetPreviewSupportChat();
            setSignedIn(true);
            setTheme("light");
            setDebugEnabled(false);
            setQuery("");
            setCategory("Tất cả");
            setScenario("normal");
            setOrderTab("Đang đến");
            go("home");
          }}
        >
          Đặt lại trải nghiệm
        </button>
        <div className="sf-reference-note">
          <b>Bản dựng tham khảo</b>
          <p>
            Chưa xác minh khớp từng pixel với Shopee hiện tại. Ảnh quán: catalog
            Grab; giá và ưu đãi: dữ liệu mẫu.
          </p>
          <a
            href="https://www.thegioididong.com/tin-tuc/cach-dat-do-an-freeship-1436012"
            target="_blank"
            rel="noreferrer"
          >
            Nguồn quán & checkout ↗
          </a>
          <a
            href="https://www.sapo.vn/blog/tra-cuu-don-hang-shopee-food"
            target="_blank"
            rel="noreferrer"
          >
            Nguồn đơn hàng ↗
          </a>
        </div>
      </aside>
      <div
        className="sf-device"
        style={{ "--sf-width": `${width}px` } as React.CSSProperties}
      >
        <div className="sf-ios">
          <b>9:41</b>
          <span>▮▮▮ ᯤ ▰</span>
        </div>
        <div className={`sf-app sf-page-${route.split("/")[0]}`} ref={scrollRef}>
          {debugEnabled && <div className="sf-debug-badge" role="status">DEBUG · {route}</div>}
          {content}
        </div>
        <div className="sf-home-indicator" />
      </div>
      {selected && (
        <Sheet
          title={replace ? "Thay đổi nhà hàng?" : selected.item.name}
          close={() => setSelected(null)}
        >
          {replace ? (
            <div className="sf-sheet-body">
              <p>
                Giỏ hàng có món của {cartRestaurant?.name}. Thay giỏ hiện tại
                bằng món của {selected.restaurant.name}?
              </p>
              <button className="sf-primary" onClick={add}>
                Thay giỏ và thêm món
              </button>
              <button
                className="sf-new-address"
                onClick={() => setSelected(null)}
              >
                Giữ giỏ hiện tại
              </button>
            </div>
          ) : (
            <>
              <Photo src={selected.item.image} className="sf-item-photo" />
              <div className="sf-sheet-body">
                <h2>{selected.item.name}</h2>
                <b className="sf-orange">{money(selected.item.price)}</b>
                <label className="sf-note">
                  Ghi chú
                  <input
                    placeholder="Ít cay, không hành…"
                    maxLength={200}
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                  />
                </label>
                <div className="sf-sheet-actions">
                  <div className="sf-stepper">
                    <button
                      aria-label="Giảm số lượng"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((n) => n - 1)}
                    >
                      −
                    </button>
                    <b>{quantity}</b>
                    <button
                      aria-label="Tăng số lượng"
                      disabled={quantity >= 99}
                      onClick={() => setQuantity((n) => n + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button className="sf-primary" onClick={add}>
                    Thêm · {money(selected.item.price * quantity)}
                  </button>
                </div>
              </div>
            </>
          )}
        </Sheet>
      )}
      {voucherSheet && (
        <Sheet title="ShopeeFood Voucher" close={() => setVoucherSheet(false)}>
          <div className="sf-sheet-body">
            <div className="sf-voucher">
              <Icon name="confirmation_number" />
              <div>
                <h2>Miễn phí giao hàng</h2>
                <p>Giảm 15.000đ phí vận chuyển</p>
                <small>Ưu đãi mẫu · áp dụng cho mọi đơn preview</small>
              </div>
            </div>
            <button
              className="sf-primary"
              onClick={() => {
                dispatch({ type: "voucher", enabled: !state.voucher });
                setVoucherSheet(false);
              }}
            >
              {state.voucher ? "Bỏ chọn mã" : "Dùng ngay"}
            </button>
          </div>
        </Sheet>
      )}
      {editing && (
        <Sheet title="Thông tin địa chỉ" close={() => setEditing(null)}>
          <form
            className="sf-sheet-body sf-address-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "saveAddress", address: editing });
              setEditing(null);
            }}
          >
            {(
              [
                ["name", "Họ tên"],
                ["phone", "Số điện thoại"],
                ["line", "Địa chỉ"],
                ["label", "Nhãn địa chỉ"],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  required
                  aria-label={label}
                  value={editing[field]}
                  pattern={field === "phone" ? "0[0-9]{9}" : undefined}
                  inputMode={field === "phone" ? "tel" : "text"}
                  onChange={(e) =>
                    setEditing({ ...editing, [field]: e.target.value })
                  }
                />
              </label>
            ))}
            <label className="sf-checkbox">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) =>
                  setEditing({ ...editing, isDefault: e.target.checked })
                }
              />
              Đặt làm địa chỉ mặc định
            </label>
            <button className="sf-primary">Lưu địa chỉ</button>
            {state.addresses.some((a) => a.id === editing.id) && (
              <button
                type="button"
                className="sf-new-address"
                onClick={() => {
                  dispatch({ type: "deleteAddress", id: editing.id });
                  setEditing(null);
                }}
              >
                Xóa địa chỉ
              </button>
            )}
          </form>
        </Sheet>
      )}
      {cancelId !== null && (
        <Sheet title="Hủy đơn hàng?" close={() => setCancelId(null)}>
          <div className="sf-sheet-body">
            <p>Bạn muốn hủy đơn này?</p>
            <button
              className="sf-primary"
              onClick={() => {
                dispatch({ type: "status", id: cancelId, status: "Đã hủy" });
                setCancelId(null);
              }}
            >
              Xác nhận hủy
            </button>
            <button
              className="sf-new-address"
              onClick={() => setCancelId(null)}
            >
              Tiếp tục chờ món
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
