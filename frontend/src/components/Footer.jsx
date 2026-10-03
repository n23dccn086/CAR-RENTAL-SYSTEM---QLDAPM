export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <h3>MAI<em>SON</em></h3>
            <p>Nền tảng thuê xe cao cấp — nơi những bậc chủ xe tận tâm gặp gỡ những hành khách đam mê khám phá.</p>
          </div>
          <div className="footer-col">
            <h4>Bộ sưu tập</h4>
            <ul>
              <li><a href="#">Sedan</a></li>
              <li><a href="#">SUV</a></li>
              <li><a href="#">MPV</a></li>
              <li><a href="#">Xe điện</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Hành trình</h4>
            <ul>
              <li><a href="#">Đà Lạt</a></li>
              <li><a href="#">Nha Trang</a></li>
              <li><a href="#">Phú Quốc</a></li>
              <li><a href="#">Sapa</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Liên lạc</h4>
            <ul>
              <li><a href="#">1900-xxxx</a></li>
              <li><a href="#">concierge@maison.vn</a></li>
              <li><a href="#">123 Nguyễn Huệ, Q1</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 MAISON · Mọi quyền được bảo lưu</p>
          <div className="signature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M 12 2 L 13 10 L 21 12 L 13 14 L 12 22 L 11 14 L 3 12 L 11 10 Z" fill="currentColor" opacity="0.7"/>
            </svg>
            — Chăm chút bằng cả tấm lòng —
          </div>
        </div>
      </div>
    </footer>
  )
}