import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyCars } from "../services/carService";
import { getBalanceInfo } from "../services/withdrawalService";

// ===== ICONS (tối giản, đồng bộ aesthetic) =====
const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 7 Q3 5, 5 5 L 17 5 Q 19 5, 19 7 L 19 9" />
    <rect x="3" y="9" width="18" height="12" rx="2" />
    <circle cx="16" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

const IconCoin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6 L 12 18 M 9 9 L 12 6 L 15 9 M 9 15 L 12 18 L 15 15" strokeLinecap="round" />
  </svg>
);

const IconChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M 4 20 L 4 12 M 10 20 L 10 8 M 16 20 L 16 14 M 20 20 L 20 6" strokeLinecap="round" />
  </svg>
);

const IconHourglass = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M 6 3 L 18 3 M 6 21 L 18 21 M 6 3 L 6 7 Q 6 11, 12 12 Q 18 13, 18 17 L 18 21 M 18 3 L 18 7 Q 18 11, 12 12 Q 6 13, 6 17 L 6 21" strokeLinejoin="round" />
  </svg>
);

const IconCar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M 3 17 L 3 12 Q 3 10, 5 10 L 7 10 L 9 6 L 15 6 L 17 10 L 19 10 Q 21 10, 21 12 L 21 17 L 3 17 Z" strokeLinejoin="round" />
    <circle cx="7" cy="17" r="2" fill="currentColor" />
    <circle cx="17" cy="17" r="2" fill="currentColor" />
  </svg>
);

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalBookings: 0,
    availableBalance: 0,
    pendingWithdrawal: 0,
  });
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyCars().catch(() => ({ data: [] })),
      getBalanceInfo().catch(() => ({ data: null })),
    ])
      .then(([carsRes, statsRes]) => {
        setCars(carsRes.data || []);
        if (statsRes.data) {
          const d = statsRes.data;
          setStats({
            totalIncome: d.totalIncome || 0,
            totalBookings: d.totalBookings || 0,
            availableBalance: d.availableBalance || 0,
            pendingWithdrawal: d.pendingWithdrawal || 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  // ★ Chỉ hiện 5 xe đầu
  const displayedCars = cars.slice(0, 5);
  const hasMoreCars = cars.length > 5;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chủ Xe — Doanh Thu
      </div>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          marginBottom: "48px",
        }}
      >
        Doanh <em style={{ fontStyle: "italic", color: "var(--do)" }}>thu.</em>
      </h1>

      {/* ===== 4 THẺ THỐNG KÊ ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
          marginBottom: "60px",
        }}
      >
        <StatCard
          icon={<IconCoin />}
          label="Tổng thu nhập"
          value={formatPrice(stats.totalIncome) + "đ"}
          hint="Sau khi trừ hoa hồng nền tảng"
          color="var(--do)"
        />
        <StatCard
          icon={<IconChart />}
          label="Số lượt thuê"
          value={stats.totalBookings}
          hint="Đơn đã hoàn tất"
          color="var(--xanh-reu)"
        />
        <StatCard
          icon={<IconWallet />}
          label="Số dư khả dụng"
          value={formatPrice(stats.availableBalance) + "đ"}
          hint="Có thể rút ngay"
          color="var(--dong)"
        />
        <StatCard
          icon={<IconHourglass />}
          label="Đang chờ rút"
          value={formatPrice(stats.pendingWithdrawal) + "đ"}
          hint="Chờ Admin duyệt"
          color="var(--tim)"
        />
      </div>

      {/* ===== WITHDRAW BANNER ===== */}
      <div
        style={{
          background: "var(--muc)",
          color: "var(--kem)",
          padding: "32px",
          marginBottom: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid var(--dong)",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Yêu cầu rút tiền
          </div>
          <div
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              color: "rgba(245,240,230,0.6)",
            }}
          >
            Số dư khả dụng: {formatPrice(stats.availableBalance)}đ
          </div>
        </div>
        <Link
          to="/owner/withdrawals"
          className="btn-login"
          style={{
            background: "var(--dong)",
            color: "var(--muc)",
            padding: "14px 28px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>Rút tiền →</span>
        </Link>
      </div>

      {/* ===== CARS — CHỈ HIỆN 5 XE ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "var(--dong)" }}>
            <IconCar />
          </span>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "36px",
              fontWeight: 900,
              margin: 0,
            }}
          >
            Cỗ xe của tôi
          </h2>
          {!loading && cars.length > 0 && (
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                letterSpacing: "2px",
                color: "var(--muc-mo)",
                marginTop: "8px",
              }}
            >
              ({cars.length})
            </span>
          )}
        </div>

        <Link
          to="/owner/cars"
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--do)",
            borderBottom: "1px solid var(--do)",
            paddingBottom: "2px",
            textDecoration: "none",
          }}
        >
          Quản lý xe →
        </Link>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--serif-2)", fontStyle: "italic" }}>
          Đang tải...
        </p>
      ) : cars.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "var(--kem-dam)",
            border: "1px dashed rgba(15,14,12,0.2)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "20px",
              color: "var(--muc-mo)",
              marginBottom: "16px",
            }}
          >
            Chưa có cỗ xe nào.
          </p>
          <Link
            to="/cars/create"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "var(--muc)",
              color: "var(--kem)",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            + Thêm xe đầu tiên
          </Link>
        </div>
      ) : (
        <>
          <div>
            {displayedCars.map((car) => (
              <Link
                key={car.id}
                to={`/owner/cars`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto",
                  gap: "24px",
                  padding: "20px 0",
                  borderBottom: "1px solid rgba(15,14,12,0.12)",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Ảnh / Icon */}
                <div
                  style={{
                    width: "80px",
                    height: "60px",
                    background: "var(--kem-dam)",
                    border: "1px solid rgba(15,14,12,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    overflow: "hidden",
                  }}
                >
                  {car.imageUrls && car.imageUrls.length > 0 ? (
                    <img
                      src={car.imageUrls[0]}
                      alt={car.plate}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "🚗"
                  )}
                </div>

                {/* Info */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "20px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    {car.brand} {car.model}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      color: "var(--muc-mo)",
                    }}
                  >
                    {car.plate} · {car.seats} chỗ · {car.carType}
                  </div>
                </div>

                {/* Price */}
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--do)",
                  }}
                >
                  {formatPrice(car.pricePerDay)}đ
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      fontWeight: 400,
                      color: "var(--muc-mo)",
                      marginLeft: "4px",
                    }}
                  >
                    /ngày
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* ★ NÚT XEM TẤT CẢ */}
          {hasMoreCars && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <Link
                to="/owner/cars"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  background: "transparent",
                  border: "1px solid var(--muc)",
                  color: "var(--muc)",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--muc)";
                  e.currentTarget.style.color = "var(--kem)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muc)";
                }}
              >
                Xem tất cả {cars.length} cỗ xe →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ===== STAT CARD =====
function StatCard({ icon, label, value, hint, color = "var(--muc)" }) {
  return (
    <div
      style={{
        background: "var(--kem-dam)",
        border: "1px solid rgba(15,14,12,0.15)",
        padding: "28px",
        position: "relative",
      }}
    >
      {/* Icon góc phải trên */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          color: color,
          opacity: 0.6,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--muc-mo)",
          marginBottom: "12px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: "32px",
          fontWeight: 900,
          letterSpacing: "-1px",
          color: color,
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            fontSize: "12px",
            color: "var(--muc-mo)",
            marginTop: "8px",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}