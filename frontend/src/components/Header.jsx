import { Link } from 'react-router-dom'
import WheelNav from './WheelNav'
import HeaderClock from './HeaderClock'
import { useAuthStore } from '../stores/authStore'

export default function Header() {
  // ★ Lấy user từ store để biết role
  const user = useAuthStore((state) => state.user)
  const role = user?.role

  /**
   * Xác định link logo theo role:
   * - ADMIN  → /admin/dashboard
   * - OWNER  → /owner/dashboard
   * - Khác   → / (trang chủ)
   */
  const getLogoLink = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard'
      case 'OWNER':
        return '/owner/dashboard'
      default:
        return '/'
    }
  }

  return (
    <header>
      <div
        className="header-inner"
        style={{
          gridTemplateColumns: '1fr auto',
          position: 'relative',
        }}
      >
        {/* Bên trái: Clock + Hotline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <HeaderClock />
        </div>

        {/* Bên phải: Logo + WheelNav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '32px',
          }}
        >
          {/* ★ Logo — link động theo role */}
          <Link
            to={getLogoLink()}
            className="logo"
            style={{ fontSize: '26px' }}
          >
            MAI<em>SON</em>
            <span className="sub">— Cỗ xe tao nhân —</span>
          </Link>

          <WheelNav />
        </div>
      </div>
    </header>
  )
}