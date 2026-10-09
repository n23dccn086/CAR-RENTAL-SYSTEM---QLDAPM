import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError(err.response?.data?.message || "Không tải được số liệu");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  if (loading) {
    return (
      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}
      >
        <p
          style={{
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            padding: "40px",
            textAlign: "center",
          }}
        >
          Đang tải số liệu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}
      >
        <div
          style={{
            padding: "24px",
            background: "rgba(139,44,44,0.1)",
            border: "1px solid var(--do)",
            color: "var(--do)",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  // ★ Tổng hồ sơ chờ duyệt (bao gồm chủ xe)
  const totalPending =
    (stats?.pendingCars || 0) +
    (stats?.pendingDrivers || 0) +
    (stats?.pendingVerifications || 0) +
    (stats?.pendingOwnerRequests || 0);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Quản Trị
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
        Tổng <em style={{ fontStyle: "italic", color: "var(--do)" }}>quan.</em>
      </h1>

      {/* ===== 5 THẺ CHÍNH ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        <StatCard
          label="Doanh thu sàn"
          value={`${formatPrice(stats?.totalRevenue)}đ`}
          hint="Tổng doanh thu đơn hoàn tất"
        />
        <StatCard
          label={`Nền tảng thực nhận (${stats?.commissionRate}%)`}
          value={`${formatPrice(stats?.platformRevenue)}đ`}
          color="var(--do)"
          hint="% hoa hồng × Doanh thu sàn"
        />
        <StatCard
          label="Tỉ lệ hủy"
          value={`${stats?.cancelRate}%`}
          color="var(--xanh-reu)"
          hint={`${stats?.cancelledBookings}/${stats?.totalBookings} đơn bị hủy`}
        />
        <StatCard
          label="CSAT tổng"
          value={`${stats?.csat}★`}
          hint={`Xe ${stats?.csatCar}★ · Chủ xe ${stats?.csatOwner}★`}
        />
        <StatCard
          label="Tổng đơn"
          value={stats?.totalBookings}
          hint={`${stats?.completedBookings} hoàn tất`}
        />
      </div>

      {/* ===== CSAT CHI TIẾT ===== */}
      <h2
        style={{
          fontFamily: "var(--serif)",
          fontSize: "24px",
          fontWeight: 900,
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid var(--muc)",
        }}
      >
        CSAT chi tiết ({stats?.totalReviews} đánh giá)
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        <StatCard
          label="CSAT — Cỗ xe"
          value={`${stats?.csatCar}★`}
          hint="AVG(carRating) = Tổng carRating / Số review"
        />
        <StatCard
          label="CSAT — Chủ xe"
          value={`${stats?.csatOwner}★`}
          hint="AVG(ownerRating) = Tổng ownerRating / Số review"
        />
        <StatCard
          label="CSAT — Tổng"
          value={`${stats?.csat}★`}
          color="var(--do)"
          hint="(CSAT_xe + CSAT_chủ_xe) / 2"
        />
      </div>

      {/* ===== PENDING APPROVALS ===== */}
      <h2
        style={{
          fontFamily: "var(--serif)",
          fontSize: "24px",
          fontWeight: 900,
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid var(--muc)",
        }}
      >
        Hồ sơ đang chờ duyệt
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        <PendingCard
          label="Xe chờ duyệt"
          count={stats?.pendingCars || 0}
          link="/admin/approvals"
        />
        <PendingCard
          label="Tài xế chờ duyệt"
          count={stats?.pendingDrivers || 0}
          link="/admin/drivers"
        />
        <PendingCard
          label="Xác thực GPLX/CCCD"
          count={stats?.pendingVerifications || 0}
          link="/admin/users"
        />
        <PendingCard
          label="Đăng ký chủ xe"
          count={stats?.pendingOwnerRequests || 0}
          link="/admin/owner-requests"
        />
        <PendingCard
          label="Tranh chấp"
          count={stats?.pendingDisputes || 0}
          link="/admin/disputes"
        />
      </div>

      {/* ===== BANNER DUYỆT NGAY ===== */}
      {totalPending > 0 && (
        <div
          style={{
            background: "var(--do)",
            color: "var(--kem)",
            padding: "24px 32px",
            marginBottom: "48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            Có <em style={{ fontStyle: "italic" }}>{totalPending}</em> hồ sơ
            đang chờ duyệt
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {stats?.pendingCars > 0 && (
              <Link
                to="/admin/approvals"
                className="btn-login"
                style={{
                  background: "var(--kem)",
                  color: "var(--do)",
                  padding: "12px 24px",
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                <span>DUYỆT XE ({stats.pendingCars})</span>
              </Link>
            )}
            {stats?.pendingDrivers > 0 && (
              <Link
                to="/admin/drivers"
                className="btn-login"
                style={{
                  background: "var(--dong)",
                  color: "var(--muc)",
                  padding: "12px 24px",
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                <span>DUYỆT TÀI XẾ ({stats.pendingDrivers})</span>
              </Link>
            )}
            {stats?.pendingVerifications > 0 && (
              <Link
                to="/admin/users"
                className="btn-login"
                style={{
                  background: "var(--dong)",
                  color: "var(--muc)",
                  padding: "12px 24px",
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                <span>DUYỆT XÁC THỰC ({stats.pendingVerifications})</span>
              </Link>
            )}
            {/* ★ MỚI: Nút duyệt chủ xe */}
            {stats?.pendingOwnerRequests > 0 && (
              <Link
                to="/admin/owner-requests"
                className="btn-login"
                style={{
                  background: "var(--xanh-reu)",
                  color: "var(--kem)",
                  padding: "12px 24px",
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                <span>DUYỆT CHỦ XE ({stats.pendingOwnerRequests})</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, color = "var(--muc)" }) {
  return (
    <div
      style={{
        background: "var(--kem-dam)",
        border: "1px solid rgba(15,14,12,0.15)",
        padding: "24px",
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
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: "28px",
          fontWeight: 900,
          letterSpacing: "-1px",
          color,
          lineHeight: 1,
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

function PendingCard({ label, count, link, disabled = false }) {
  const content = (
    <div
      style={{
        background: count > 0 ? "rgba(139,44,44,0.05)" : "var(--kem-dam)",
        border: `1px solid ${count > 0 ? "var(--do)" : "rgba(15,14,12,0.15)"}`,
        padding: "24px",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
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
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: "36px",
          fontWeight: 900,
          letterSpacing: "-1px",
          color: count > 0 ? "var(--do)" : "var(--muc-mo)",
          lineHeight: 1,
        }}
      >
        {count}
      </div>
    </div>
  );
  if (disabled || count === 0) return content;
  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}