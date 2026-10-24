import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [deposits, setDeposits] = useState(null);
  const [activeDepositTab, setActiveDepositTab] = useState("holding");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [res, depRes] = await Promise.all([
        api.get("/admin/dashboard/stats"),
        api.get("/admin/dashboard/deposits").catch(() => null),
      ]);
      setStats(res.data.data);
      if (depRes?.data?.data) setDeposits(depRes.data.data);
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

  const renderDepositTable = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <div
          style={{
            padding: "36px",
            textAlign: "center",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            color: "var(--muc-mo)",
            background: "var(--kem)",
            border: "1px dashed rgba(15,14,12,0.2)",
          }}
        >
          {type === "holding"
            ? "Hiện không có đơn nào đang tạm giữ cọc (tất cả đơn đã được duyệt hoặc đã xử lý xong)."
            : type === "merged"
            ? "Chưa có đơn nào được sáp nhập cọc vào doanh thu."
            : "Chưa có khoản cọc nào được hoàn trả."}
        </div>
      );
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--kem)",
            border: "1px solid rgba(15,14,12,0.1)",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(15,14,12,0.05)",
                borderBottom: "2px solid rgba(15,14,12,0.2)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--muc-mo)",
              }}
            >
              <th style={{ padding: "12px 14px", textAlign: "left" }}>Đơn</th>
              <th style={{ padding: "12px 14px", textAlign: "left" }}>Xe</th>
              <th style={{ padding: "12px 14px", textAlign: "left" }}>Khách hàng</th>
              <th style={{ padding: "12px 14px", textAlign: "left" }}>Chủ xe</th>
              <th style={{ padding: "12px 14px", textAlign: "right" }}>Tiền cọc</th>
              <th style={{ padding: "12px 14px", textAlign: "right" }}>Tổng giá thuê</th>
              <th style={{ padding: "12px 14px", textAlign: "left" }}>Nghiệp vụ cọc</th>
              <th style={{ padding: "12px 14px", textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr
                key={b.bookingId}
                style={{
                  borderBottom: "1px solid rgba(15,14,12,0.08)",
                  fontFamily: "var(--serif-2)",
                }}
              >
                <td style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontWeight: 700 }}>
                  #{b.bookingId}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <strong>{b.carName}</strong>
                  {b.carPlate && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muc-mo)" }}>
                      {b.carPlate}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div>{b.customerName}</div>
                  {b.customerPhone && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muc-mo)" }}>
                      {b.customerPhone}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div>{b.ownerName}</div>
                  {b.ownerPhone && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muc-mo)" }}>
                      {b.ownerPhone}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    color:
                      type === "holding"
                        ? "var(--dong)"
                        : type === "merged"
                        ? "var(--xanh-reu)"
                        : "var(--do)",
                  }}
                >
                  {formatPrice(b.depositAmount)}đ
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "var(--mono)" }}>
                  {formatPrice(b.totalPrice)}đ
                </td>
                <td style={{ padding: "12px 14px", maxWidth: "280px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      background:
                        type === "holding"
                          ? "rgba(201,169,97,0.15)"
                          : type === "merged"
                          ? "rgba(74,93,63,0.15)"
                          : "rgba(139,44,44,0.15)",
                      color:
                        type === "holding"
                          ? "var(--dong)"
                          : type === "merged"
                          ? "var(--xanh-reu)"
                          : "var(--do)",
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    {b.statusDescription || b.status}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muc-mo)", fontStyle: "italic", lineHeight: 1.4 }}>
                    {b.note}
                  </div>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <Link
                    to={`/bookings/${b.bookingId}`}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--do)",
                      textDecoration: "underline",
                      fontWeight: 700,
                    }}
                  >
                    Xem đơn
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

      {/* ===== TÀI CHÍNH & TIỀN CỌC QUỸ TẠM GIỮ ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          label="Doanh thu sàn"
          value={`${formatPrice(stats?.totalRevenue)}đ`}
          hint="Tổng doanh thu đơn hoàn tất (đã bao gồm cọc + thanh toán nốt)"
        />
        <StatCard
          label={`Nền tảng thực nhận (${stats?.commissionRate ?? 10}%)`}
          value={`${formatPrice(stats?.platformRevenue)}đ`}
          color="var(--do)"
          hint={`Hoa hồng ${stats?.commissionRate ?? 10}% · Cọc mặc định ${stats?.depositPercent ?? 30}% (từ cấu hình sàn)`}
        />
        <StatCard
          label="Tiền cọc đang tạm giữ"
          value={`${formatPrice(stats?.holdingDepositAmount || 0)}đ`}
          color="var(--dong)"
          hint={`${stats?.holdingDepositCount || 0} đơn cọc chờ duyệt · Để riêng sẵn sàng hoàn trả nếu hủy/từ chối`}
        />
      </div>

      {/* ===== CÁC CHỈ SỐ HOẠT ĐỘNG KHÁC ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        <StatCard
          label="Tỉ lệ hủy đơn"
          value={`${stats?.cancelRate}%`}
          color="var(--xanh-reu)"
          hint={`${stats?.cancelledBookings}/${stats?.totalBookings} đơn bị hủy`}
        />
        <StatCard
          label="CSAT tổng quan"
          value={`${stats?.csat}★`}
          hint={`Xe ${stats?.csatCar}★ · Chủ xe ${stats?.csatOwner}★`}
        />
        <StatCard
          label="Tổng đơn hàng"
          value={stats?.totalBookings}
          hint={`${stats?.completedBookings} đơn đã hoàn tất`}
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
          gridTemplateColumns: "repeat(4, 1fr)",
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

      {/* ===== BẢNG QUẢN LÝ TIỀN CỌC & QUỸ TẠM GIỮ (ESCROW) ===== */}
      <div
        style={{
          background: "var(--kem-dam)",
          border: "2px solid var(--muc)",
          padding: "32px",
          marginBottom: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--do)",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              HỆ THỐNG QUẢN TRỊ TÀI CHÍNH
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "26px",
                fontWeight: 900,
                margin: 0,
                color: "var(--muc)",
              }}
            >
              Quản lý Tiền Cọc & Quỹ Tạm Giữ (Escrow)
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "var(--kem)",
              padding: "4px",
              border: "1px solid rgba(15,14,12,0.15)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveDepositTab("holding")}
              style={{
                padding: "8px 16px",
                border: "none",
                background:
                  activeDepositTab === "holding" ? "var(--dong)" : "transparent",
                color:
                  activeDepositTab === "holding" ? "var(--kem)" : "var(--muc)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: activeDepositTab === "holding" ? 700 : 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              📌 Đang tạm giữ ({deposits?.holdingBookings?.length || stats?.holdingDepositCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveDepositTab("merged")}
              style={{
                padding: "8px 16px",
                border: "none",
                background:
                  activeDepositTab === "merged" ? "var(--xanh-reu)" : "transparent",
                color:
                  activeDepositTab === "merged" ? "var(--kem)" : "var(--muc)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: activeDepositTab === "merged" ? 700 : 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ✓ Đã duyệt nhập doanh thu ({deposits?.mergedBookings?.length || stats?.mergedDepositCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveDepositTab("refunded")}
              style={{
                padding: "8px 16px",
                border: "none",
                background:
                  activeDepositTab === "refunded" ? "var(--do)" : "transparent",
                color:
                  activeDepositTab === "refunded" ? "var(--kem)" : "var(--muc)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: activeDepositTab === "refunded" ? 700 : 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ↩ Đã hoàn trả ({deposits?.refundedBookings?.length || stats?.refundedDepositCount || 0})
            </button>
          </div>
        </div>

        {/* Banner nguyên tắc vận hành */}
        <div
          style={{
            padding: "14px 18px",
            background: "var(--kem)",
            borderLeft: "4px solid var(--dong)",
            marginBottom: "24px",
            fontFamily: "var(--serif-2)",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "var(--muc)",
          }}
        >
          <strong>💡 Nguyên tắc vận hành tiền cọc:</strong> Khi khách cọc xe, toàn bộ tiền cọc được lưu giữ riêng tại <strong>Quỹ tạm giữ (Escrow)</strong> và chưa tính vào doanh thu sàn. Trong trường hợp chủ xe không duyệt đơn hoặc khách hủy đơn, hệ thống sẽ trích trả lại cọc cho khách. Chỉ khi chủ xe/tài xế duyệt đơn, tiền cọc mới chính thức được <strong>sáp nhập vào doanh thu sàn</strong>.
        </div>

        {/* Danh sách các đơn theo tab */}
        {renderDepositTable(
          activeDepositTab === "holding"
            ? deposits?.holdingBookings || []
            : activeDepositTab === "merged"
            ? deposits?.mergedBookings || []
            : deposits?.refundedBookings || [],
          activeDepositTab
        )}
      </div>
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