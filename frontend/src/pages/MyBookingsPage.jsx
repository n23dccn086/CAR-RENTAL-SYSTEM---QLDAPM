import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyBookings } from "../services/bookingService";
import api from "../services/api";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  const fetchBookings = () => {
    getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const statusMap = {
    PENDING: { label: "Chờ thanh toán", color: "var(--do)" },
    PAID: { label: "Đã cọc", color: "var(--dong)" },
    APPROVED: { label: "Đã duyệt", color: "var(--xanh-reu)" },
    RENTED: { label: "Đang thuê", color: "var(--xanh-ngoc)" },
    RETURNED: { label: "Đã trả xe", color: "var(--tim)" },
    COMPLETED: { label: "Hoàn tất", color: "var(--muc-mo)" },
    CANCELLED: { label: "Đã hủy", color: "var(--do)" },
  };

  // ===== XỬ LÝ HỦY ĐƠN =====
  const handleCancel = async (booking) => {
    const hoursUntilStart = (new Date(booking.startDate) - new Date()) / (1000 * 60 * 60);

    let refundPercent = 0;
    let refundAmount = 0;
    const deposit = booking.depositAmount || 0;

    if (booking.status === "PENDING") {
      refundPercent = 0;
      refundAmount = 0;
    } else if (hoursUntilStart >= 24) {
      refundPercent = 100;
      refundAmount = deposit;
    } else if (hoursUntilStart >= 4) {
      refundPercent = 70;
      refundAmount = Math.floor(deposit * 0.7);
    } else if (hoursUntilStart > 0) {
      refundPercent = 50;
      refundAmount = Math.floor(deposit * 0.5);
    } else {
      refundPercent = 0;
      refundAmount = 0;
    }

    const lostAmount = deposit - refundAmount;

    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đơn #${booking.id}?\n\n` +
      `Chính sách hoàn cọc:\n` +
      `- Hoàn: ${refundPercent}% (${formatPrice(refundAmount)}đ)\n` +
      `- Mất: ${100 - refundPercent}% (${formatPrice(lostAmount)}đ)`
    );

    if (!confirmed) return;

    const reason = window.prompt("Lý do hủy đơn (không bắt buộc):", "Khách hủy");

    try {
      await api.put(`/bookings/${booking.id}/cancel?reason=${encodeURIComponent(reason || "Khách hủy")}`);
      setMessage(`Đã hủy đơn #${booking.id}. Hoàn cọc: ${formatPrice(refundAmount)}đ`);
      fetchBookings();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert("Hủy đơn thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  // ===== CHECK CÓ THỂ HỦY =====
  const canCancel = (status) => {
    return !["RENTED", "RETURNED", "COMPLETED", "CANCELLED"].includes(status);
  };

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>Chương Chuyến Đi</div>
      <h1 style={{
        fontFamily: "var(--serif)",
        fontSize: "clamp(36px, 5vw, 56px)",
        fontWeight: 900,
        letterSpacing: "-2px",
        marginBottom: "40px",
      }}>
        Những <em style={{ fontStyle: "italic", color: "var(--do)" }}>hành trình.</em>
      </h1>

      {message && (
        <div style={{
          background: "rgba(74,93,63,0.1)",
          border: "1px solid var(--xanh-reu)",
          padding: "12px 16px",
          marginBottom: "24px",
          color: "var(--xanh-reu)",
          fontFamily: "var(--serif-2)",
          fontStyle: "italic",
        }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
        {["ALL", "PENDING", "PAID", "APPROVED", "RENTED", "RETURNED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 16px",
              background: filter === s ? "var(--muc)" : "transparent",
              color: filter === s ? "var(--kem)" : "var(--muc-mo)",
              border: `1px solid ${filter === s ? "var(--muc)" : "rgba(15,14,12,0.2)"}`,
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {s === "ALL" ? "Tất cả" : statusMap[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", fontFamily: "var(--serif-2)", fontStyle: "italic", padding: "40px" }}>
          Đang tải...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontFamily: "var(--serif-2)", fontStyle: "italic", fontSize: "24px", color: "var(--muc-mo)" }}>
            Chưa có hành trình nào.
          </p>
          <Link to="/search" style={{ display: "inline-block", marginTop: "24px", color: "var(--do)", borderBottom: "1px solid var(--do)" }}>
            Khám phá bộ sưu tập →
          </Link>
        </div>
      ) : (
        <div>
          {filtered.map((b) => (
            <div
              key={b.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: "24px",
                alignItems: "center",
                padding: "24px 0",
                borderBottom: "1px solid rgba(15,14,12,0.12)",
              }}
            >
              <Link to={`/payment/${b.id}`} style={{ color: "inherit" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "2px", color: "var(--muc-mo)", marginBottom: "8px" }}>
                  #{b.id}
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
                  {b.carName || "Cỗ xe"}
                </div>
                <div style={{ fontFamily: "var(--serif-2)", fontStyle: "italic", color: "var(--muc-mo)" }}>
                  {new Date(b.startDate).toLocaleDateString("vi-VN")} → {new Date(b.endDate).toLocaleDateString("vi-VN")}
                </div>
              </Link>

              <div style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 500 }}>
                {formatPrice(b.totalPrice)}đ
              </div>

              <div style={{
                padding: "6px 14px",
                border: `1px solid ${statusMap[b.status]?.color || "var(--muc-mo)"}`,
                color: statusMap[b.status]?.color || "var(--muc-mo)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}>
                {statusMap[b.status]?.label || b.status}
              </div>

              {/* ===== ACTION: Hủy hoặc Đánh giá ===== */}
              {canCancel(b.status) ? (
                <button
                  onClick={() => handleCancel(b)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid var(--do)",
                    color: "var(--do)",
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Hủy đơn
                </button>
              ) : b.status === "COMPLETED" ? (
                <button
                  onClick={() => navigate(`/review/${b.id}`)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid var(--dong)",
                    color: "var(--dong)",
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  ★ Đánh giá
                </button>
              ) : (
                <div style={{ width: "90px" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}