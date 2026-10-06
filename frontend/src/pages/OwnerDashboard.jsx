import { useState, useEffect } from "react";
import { getMyCars } from "../services/carService";
import { getOwnerDashboard } from "../services/bookingService";
import { Link } from 'react-router-dom'

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalIncome: 15000000,
    totalBookings: 12,
    availableBalance: 8500000,
    pendingWithdrawal: 0,
  });
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyCars().catch(() => ({ data: [] })),
      getOwnerDashboard().catch(() => ({ data: null })),
    ])
      .then(([carsRes, statsRes]) => {
        setCars(carsRes.data || []);
        if (statsRes.data) setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chủ Xe
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

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
          marginBottom: "60px",
        }}
      >
        {[
          {
            label: "Tổng thu nhập",
            value: formatPrice(stats.totalIncome) + "đ",
          },
          { label: "Số lượt thuê", value: stats.totalBookings },
          {
            label: "Số dư khả dụng",
            value: formatPrice(stats.availableBalance) + "đ",
          },
          {
            label: "Đang chờ rút",
            value: formatPrice(stats.pendingWithdrawal) + "đ",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "var(--kem-dam)",
              border: "1px solid rgba(15,14,12,0.15)",
              padding: "28px",
            }}
          >
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
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "32px",
                fontWeight: 900,
                letterSpacing: "-1px",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* WITHDRAW */}
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

      {/* CARS */}
      <h2
        style={{
          fontFamily: "var(--serif)",
          fontSize: "36px",
          fontWeight: 900,
          marginBottom: "24px",
        }}
      >
        Cỗ xe của tôi
      </h2>
      {loading ? (
        <p style={{ fontFamily: "var(--serif-2)", fontStyle: "italic" }}>
          Đang tải...
        </p>
      ) : cars.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            color: "var(--muc-mo)",
          }}
        >
          Chưa có cỗ xe nào.
        </p>
      ) : (
        <div>
          {cars.map((car) => (
            <div
              key={car.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "24px",
                padding: "20px 0",
                borderBottom: "1px solid rgba(15,14,12,0.12)",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "20px",
                    fontWeight: 700,
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
                  {car.plateNumber}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--do)",
                }}
              >
                {formatPrice(car.pricePerDay)}đ/ngày
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
