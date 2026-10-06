import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function WheelNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const navItems = [
    { path: "/", label: "Trang chủ", icon: "⌂" },
    { path: "/search", label: "Bộ sưu tập", icon: "⚲" },
    ...(isLoggedIn
      ? [{ path: "/my-bookings", label: "Chuyến đi", icon: "✦" }]
      : []),
    ...(isLoggedIn
      ? [{ path: "/notifications", label: "Thông báo", icon: "◎" }]
      : []),
    ...(isLoggedIn && user?.role !== "ADMIN"
      ? [{ path: "/disputes", label: "Tranh chấp", icon: "⚖" }]
      : []),
    ...(isLoggedIn &&
    user?.verificationStatus !== "VERIFIED" &&
    user?.role !== "ADMIN"
      ? [{ path: "/verification", label: "Xác thực tài khoản", icon: "☑" }]
      : []),
    ...(isLoggedIn ? [{ path: "/profile", label: "Hồ sơ", icon: "❦" }] : []),
    ...(isLoggedIn && user?.role === "OWNER"
      ? [{ path: "/owner/dashboard", label: "Quản lý xe", icon: "⚙" }]
      : []),
    ...(isLoggedIn && user?.role === "OWNER"
      ? [{ path: "/owner/drivers", label: "Quản lý tài xế", icon: "◉" }]
      : []),
    ...(isLoggedIn && user?.role === "OWNER"
      ? [{ path: "/owner/bookings", label: "Đơn hàng", icon: "▤" }]
      : []),
    ...(isLoggedIn && user?.role === "OWNER"
      ? [{ path: "/owner/reviews", label: "Đánh giá", icon: "✿" }]
      : []),
    ...(isLoggedIn && user?.role === "OWNER"
      ? [{ path: "/owner/withdrawals", label: "Rút tiền", icon: "₫" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/dashboard", label: "Quản trị", icon: "⚙" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/approvals", label: "Duyệt xe", icon: "☑" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/disputes", label: "Tranh chấp", icon: "⚖" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/users", label: "Người dùng", icon: "◔" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/refunds", label: "Hoàn tiền", icon: "❖" }]
      : []),
    ...(isLoggedIn && user?.role === "ADMIN"
      ? [{ path: "/admin/withdrawals", label: "Duyệt rút tiền", icon: "₫" }]
      : []),
  ];

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* ============ WHEEL BUTTON ============ */}
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Menu"
        style={{
          width: "64px",
          height: "64px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: 0,
          transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
          transform: hover ? "scale(1.15)" : "scale(1)",
          filter: hover
            ? "drop-shadow(0 8px 20px rgba(201,169,97,0.5))"
            : "none",
        }}
      >
        {/* BÁNH XE Ô TÔ */}
        <svg
          viewBox="0 0 100 100"
          style={{
            width: "100%",
            height: "100%",
            animation: `wheelSpin ${hover || open ? "1.5s" : "25s"} linear infinite`,
          }}
        >
          <defs>
            <radialGradient id="tireGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#2a2825" />
              <stop offset="70%" stopColor="#0f0e0c" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <radialGradient id="rimGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#e8c987" />
              <stop offset="60%" stopColor="#c9a961" />
              <stop offset="100%" stopColor="#8b6d30" />
            </radialGradient>
            <linearGradient id="spokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f0e6" />
              <stop offset="100%" stopColor="#c9a961" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="48" fill="url(#tireGrad)" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#3a3835"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#3a3835"
            strokeWidth="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#3a3835"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#3a3835"
            strokeWidth="0.5"
          />

          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = 50 + 42 * Math.cos(angle);
            const y1 = 50 + 42 * Math.sin(angle);
            const x2 = 50 + 47 * Math.cos(angle);
            const y2 = 50 + 47 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#3a3835"
                strokeWidth="0.8"
              />
            );
          })}

          <circle cx="50" cy="50" r="36" fill="url(#rimGrad)" />
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#0f0e0c"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="33"
            fill="none"
            stroke="#0f0e0c"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />

          {[0, 72, 144, 216, 288].map((deg, i) => {
            const angle = ((deg - 90) * Math.PI) / 180;
            const x = 50 + 30 * Math.cos(angle);
            const y = 50 + 30 * Math.sin(angle);
            return (
              <g key={i}>
                <path
                  d={`M 50 50 L ${50 + 8 * Math.cos(angle + 0.3)} ${50 + 8 * Math.sin(angle + 0.3)} L ${x} ${y} L ${50 + 8 * Math.cos(angle - 0.3)} ${50 + 8 * Math.sin(angle - 0.3)} Z`}
                  fill="url(#spokeGrad)"
                  stroke="#0f0e0c"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {[0, 72, 144, 216, 288].map((deg, i) => {
            const angle = ((deg - 90) * Math.PI) / 180;
            const x = 50 + 14 * Math.cos(angle);
            const y = 50 + 14 * Math.sin(angle);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.5" fill="#0f0e0c" />
                <circle cx={x} cy={y} r="2.5" fill="#6b6660" />
                <circle cx={x} cy={y} r="1" fill="#c9a961" />
              </g>
            );
          })}

          <circle cx="50" cy="50" r="10" fill="#0f0e0c" />
          <circle cx="50" cy="50" r="9" fill="url(#rimGrad)" />
          <circle cx="50" cy="50" r="5" fill="#0f0e0c" />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontFamily="Playfair Display, serif"
            fontSize="8"
            fontStyle="italic"
            fontWeight="700"
            fill="#c9a961"
          >
            M
          </text>
        </svg>

        {hover && (
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(201,169,97,0.3) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "glowPulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        {isLoggedIn && (
          <div
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "10px",
              height: "10px",
              background: "var(--do)",
              border: "2px solid var(--kem)",
              borderRadius: "50%",
              animation: "heartbeat 2s ease-in-out infinite",
              zIndex: 2,
            }}
          />
        )}
      </button>

      {/* ============ MENU ============ */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 16px)",
            right: 0,
            minWidth: "280px",
            background: "var(--kem)",
            border: "1px solid var(--muc)",
            boxShadow: "0 20px 60px rgba(15,14,12,0.25)",
            zIndex: 1000,
            animation: "wheelMenuOpen 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(15,14,12,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              position: "relative",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 100 100"
              style={{ animation: "wheelSpin 15s linear infinite" }}
            >
              <circle cx="50" cy="50" r="46" fill="#0f0e0c" />
              <circle cx="50" cy="50" r="36" fill="#c9a961" />
              {[0, 72, 144, 216, 288].map((deg, i) => {
                const a = ((deg - 90) * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={50 + 30 * Math.cos(a)}
                    y2={50 + 30 * Math.sin(a)}
                    stroke="#0f0e0c"
                    strokeWidth="3"
                  />
                );
              })}
              <circle cx="50" cy="50" r="8" fill="#0f0e0c" />
            </svg>
            <div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                {user?.name || "Khách"}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  color: "var(--muc-mo)",
                }}
              >
                {user?.role || "GUEST"}
              </div>
            </div>
          </div>

          <div style={{ padding: "8px 0" }}>
            {navItems.map((item, i) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 20px",
                    fontFamily: "var(--serif-2)",
                    fontSize: "16px",
                    color: active ? "var(--do)" : "var(--muc)",
                    background: active ? "var(--kem-dam)" : "transparent",
                    transition: "all 0.3s",
                    animation: `wheelItemIn 0.4s ease-out ${i * 0.06}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--kem-dam)";
                    e.currentTarget.style.paddingLeft = "26px";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.paddingLeft = "20px";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "18px",
                      color: "var(--dong)",
                      width: "20px",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(15,14,12,0.1)",
              padding: "8px 0",
            }}
          >
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  fontFamily: "var(--serif-2)",
                  fontSize: "16px",
                  color: "var(--do)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(139,44,44,0.08)";
                  e.currentTarget.style.paddingLeft = "26px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.paddingLeft = "20px";
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "18px",
                    width: "20px",
                  }}
                >
                  ←
                </span>
                <span>Đăng xuất</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 20px",
                    fontFamily: "var(--serif-2)",
                    fontSize: "16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "18px",
                      color: "var(--dong)",
                      width: "20px",
                    }}
                  >
                    →
                  </span>
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 20px",
                    fontFamily: "var(--serif-2)",
                    fontSize: "16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "18px",
                      color: "var(--dong)",
                      width: "20px",
                    }}
                  >
                    ✦
                  </span>
                  <span>Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
