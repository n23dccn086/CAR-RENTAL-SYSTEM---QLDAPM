import { Link } from 'react-router-dom'
import WheelNav from './WheelNav'
import HeaderClock from './HeaderClock'

export default function Header() {
  return (
    <header>
      <div className="header-inner" style={{
        gridTemplateColumns: '1fr auto',
        position: 'relative'
      }}>
        {/* Bên trái: Clock + Hotline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <HeaderClock />
        </div>

        {/* Bên phải: Logo + WheelNav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '32px' }}>
          <Link to="/" className="logo" style={{ fontSize: '26px' }}>
            MAI<em>SON</em>
            <span className="sub">— Cỗ xe tao nhân —</span>
          </Link>
          <WheelNav />
        </div>
      </div>
    </header>
  )
}