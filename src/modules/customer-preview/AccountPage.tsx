type Props = { signedIn: boolean; navigate: (path: string) => void; logout: () => void };
export default function AccountPage({ signedIn, navigate, logout }: Props) {
  return <>
    <section className="sf-account-hero"><div className="sf-account-avatar"><span className="material-symbols-outlined" aria-hidden="true">person</span></div><div><h2>{signedIn ? 'Khách trải nghiệm' : 'Chào bạn!'}</h2><p>{signedIn ? 'Tài khoản trải nghiệm' : 'Đăng nhập để đặt món ngon mỗi ngày'}</p>{!signedIn && <button onClick={() => navigate('login')}>Đăng nhập / Đăng ký</button>}</div></section>
    <section className="sf-account-links" aria-label="Quản lý tài khoản">{[['account/profile','person','Thông tin cá nhân','Quản lý họ tên, số điện thoại và email'],['addresses','location_on','Địa chỉ của tôi','Quản lý địa chỉ nhận món'],['orders','receipt_long','Đơn hàng của tôi','Theo dõi và xem lịch sử đơn hàng'],['support','support_agent','Hỗ trợ CSKH','Trò chuyện với đội ngũ Delivery'],['account/settings','settings','Cài đặt','Giao diện và công cụ trải nghiệm']].map(([path,icon,title,subtitle])=><button key={path} onClick={()=>navigate(signedIn ? path : 'login')}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><span><b>{title}</b><small>{subtitle}</small></span><span className="material-symbols-outlined" aria-hidden="true">chevron_right</span></button>)}</section>
    {signedIn && <button className="sf-account-logout" onClick={logout}><span className="material-symbols-outlined" aria-hidden="true">logout</span>Đăng xuất</button>}
  </>;
}
