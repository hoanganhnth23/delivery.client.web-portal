export default function AccountProfilePage() {
  return <section className="sf-profile-page">
    <div className="sf-profile-avatar"><span className="material-symbols-outlined" aria-hidden="true">person</span></div>
    <h2>Khách trải nghiệm</h2>
    <p className="sf-muted">Tài khoản preview nội bộ</p>
    <dl className="sf-profile-details"><div><dt>Họ và tên</dt><dd>Khách trải nghiệm</dd></div><div><dt>Số điện thoại</dt><dd>0900000000</dd></div><div><dt>Email</dt><dd>khach@example.com</dd></div></dl>
    <p className="sf-profile-note"><span className="material-symbols-outlined" aria-hidden="true">info</span> Đây là dữ liệu mẫu để đối chiếu giao diện, không phải thông tin tài khoản thật.</p>
  </section>;
}
