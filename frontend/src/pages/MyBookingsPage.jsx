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

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchBookings = () => {
    getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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

  const handleCancel = async (booking) => {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

    const deposit = booking.depositAmount || 0;
    let refundPercent = 0;
    let refundAmount = 0;
    let ruleReason = "";
    let timeInfo = "";

    const formatDuration = (hours) => {
      if (hours < 0) return "đã qua";
      const h = Math.floor(hours);
      const m = Math.floor((hours - h) * 60);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        const remH = h % 24;
        return `${d} ngày ${remH} giờ`;
      }
      if (h > 0) return `${h} giờ ${m} phút`;
      return `${m} phút`;
    };

    if (booking.status === "PENDING") {
      refundPercent = 0;
      refundAmount = 0;
      ruleReason = "Đơn chưa thanh toán cọc";
      timeInfo = `Còn ${formatDuration(hoursUntilStart)} đến giờ nhận xe`;
    } else if (hoursUntilStart >= 24) {
      refundPercent = 100;
      refundAmount = deposit;
      ruleReason = "Vì bạn hủy TRƯỚC 24 giờ so với giờ nhận xe";
      timeInfo = `Còn ${formatDuration(hoursUntilStart)} → thuộc mốc "Trước 24h"`;
    } else if (hoursUntilStart >= 4) {
      refundPercent = 70;
      refundAmount = Math.floor(deposit * 0.7);
      ruleReason = "Vì bạn hủy trong khoảng 4-24 giờ trước giờ nhận xe";
      timeInfo = `Còn ${formatDuration(hoursUntilStart)} → thuộc mốc "4h - 24h"`;
    } else if (hoursUntilStart > 0) {
      refundPercent = 50;
      refundAmount = Math.floor(deposit * 0.5);
      ruleReason = "Vì bạn hủy DƯỚI 4 giờ trước giờ nhận xe";
      timeInfo = `Còn ${formatDuration(hoursUntilStart)} → thuộc mốc "Dưới 4h"`;
    } else {
      refundPercent = 0;
      refundAmount = 0;
      ruleReason = "Vì đã qua giờ nhận xe";
      timeInfo = `Đã qua giờ nhận ${formatDuration(Math.abs(hoursUntilStart))}`;
    }

    const lostAmount = deposit - refundAmount;
    const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

    const fmtDate = (d) =>
      new Date(d).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    const message =
      `Bạn có chắc muốn hủy đơn #${booking.id}?\n\n` +
      `📅 Ngày nhận xe: ${fmtDate(booking.startDate)}\n` +
      `⏰ Thời gian còn lại: ${timeInfo}\n\n` +
      `📋 Chính sách hoàn cọc:\n` +
      `   • Trước 24h      → Hoàn 100% cọc\n` +
      `   • Từ 4h - 24h    → Hoàn 70% cọc\n` +
      `   • Dưới 4h        → Hoàn 50% cọc\n` +
      `   • Sau giờ nhận   → Hoàn 0%\n\n` +
      `⚖️ Áp dụng cho đơn này: ${ruleReason}\n` +
      `💰 Tiền cọc: ${fmt(deposit)}đ\n` +
      `✅ Sẽ hoàn: ${refundPercent}% (${fmt(refundAmount)}đ)\n` +
      `❌ Sẽ mất: ${100 - refundPercent}% (${fmt(lostAmount)}đ)\n\n` +
      `Tiếp tục hủy đơn?`;

    if (!window.confirm(message)) return;

    const reason = window.prompt(
      "Lý do hủy đơn (không bắt buộc):",
      "Khách hủy",
    );
    if (reason === null) return;

    try {
      await api.put(
        `/bookings/${booking.id}/cancel?reason=${encodeURIComponent(reason || "Khách hủy")}`,
      );
      setMessage(
        `Đã hủy đơn #${booking.id}. Yêu cầu hoàn cọc ${fmt(refundAmount)}đ đã gửi tới Admin.`,
      );
      fetchBookings();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(
        "Hủy đơn thất bại: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const canCancel = (status) =>
    !["RENTED", "RETURNED", "COMPLETED", "CANCELLED"].includes(status);

  const handleViewHandover = async (booking) => {
    try {
      const res = await api.get(`/handovers/booking/${booking.id}`);
      const handovers = res.data.data || [];

      if (handovers.length === 0) {
        alert("Chưa có biên bản nào cho đơn này");
        return;
      }

      const pendingHandover = handovers.find((h) => h.status === "PENDING");
      const target = pendingHandover || handovers[handovers.length - 1];

      navigate(`/handover/${target.id}`);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const filtered =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chuyến Đi
      </div>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          marginBottom: "40px",
        }}
      >
        Những{" "}
        <em style={{ fontStyle: "italic", color: "var(--do)" }}>hành trình.</em>
      </h1>

      {message && (
        <div
          style={{
            background: "rgba(74,93,63,0.1)",
            border: "1px solid var(--xanh-reu)",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "var(--xanh-reu)",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {[
          "ALL",
          "PENDING",
          "PAID",
          "APPROVED",
          "RENTED",
          "RETURNED",
          "COMPLETED",
          "CANCELLED",
        ].map((s) => (
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
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            padding: "40px",
          }}
        >
          Đang tải...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "24px",
              color: "var(--muc-mo)",
            }}
          >
            Chưa có hành trình nào.
          </p>
          <Link
            to="/search"
            style={{
              display: "inline-block",
              marginTop: "24px",
              color: "var(--do)",
              borderBottom: "1px solid var(--do)",
            }}
          >
            Khám phá bộ sưu tập →
          </Link>
        </div>
      ) : (
        <>
          <div>
            {currentBookings.map((b) => {
              const canSignHandover = ["RENTED", "RETURNED"].includes(b.status);
              const canViewHandover = [
                "RENTED",
                "RETURNED",
                "COMPLETED",
              ].includes(b.status);

              const canPayFinal =
                b.status === "RETURNED" &&
                (b.remainingAmount > 0 || b.totalExtraFees > 0);

              return (
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
                  <Link to={`/bookings/${b.id}`} style={{ color: "inherit" }}>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        letterSpacing: "2px",
                        color: "var(--muc-mo)",
                        marginBottom: "8px",
                      }}
                    >
                      #{b.id}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "22px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      {b.carName || "Cỗ xe"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif-2)",
                        fontStyle: "italic",
                        color: "var(--muc-mo)",
                      }}
                    >
                      {new Date(b.startDate).toLocaleDateString("vi-VN")} →{" "}
                      {new Date(b.endDate).toLocaleDateString("vi-VN")}
                    </div>

                    {/* ★ MỚI: Cảnh báo tự hủy cho đơn PENDING */}
                    {b.status === "PENDING" && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          background: "rgba(201,169,97,0.12)",
                          borderLeft: "3px solid var(--dong)",
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "1px",
                          color: "var(--dong)",
                        }}
                      >
                        ⏰ Đơn sẽ tự hủy nếu không thanh toán trong 12 giờ tiếp
                        theo
                      </div>
                    )}

                    {/* ⚠️ Phí phát sinh + nhắc thanh toán nốt */}
                    {(b.totalExtraFees > 0 || b.remainingAmount > 0) &&
                      b.status === "RETURNED" && (
                        <>
                          {b.totalExtraFees > 0 && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                background: "rgba(139,44,44,0.08)",
                                borderLeft: "3px solid var(--do)",
                                fontFamily: "var(--mono)",
                                fontSize: "11px",
                                letterSpacing: "1px",
                                color: "var(--do)",
                              }}
                            >
                              ⚠️ Phí phát sinh: {formatPrice(b.totalExtraFees)}đ
                              {b.lateFee > 0 && (
                                <span
                                  style={{ marginLeft: "8px", opacity: 0.7 }}
                                >
                                  (trả muộn: {formatPrice(b.lateFee)}đ)
                                </span>
                              )}
                              {b.kmOverageFee > 0 && (
                                <span
                                  style={{ marginLeft: "8px", opacity: 0.7 }}
                                >
                                  (vượt km: {formatPrice(b.kmOverageFee)}đ)
                                </span>
                              )}
                            </div>
                          )}

                          {/* ★ MỚI: Nhắc thanh toán nốt trong 12h */}
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px 12px",
                              background: "rgba(201,169,97,0.12)",
                              borderLeft: "3px solid var(--dong)",
                              fontFamily: "var(--mono)",
                              fontSize: "11px",
                              letterSpacing: "1px",
                              color: "var(--dong)",
                            }}
                          >
                            ⏰ Vui lòng thanh toán nốt{" "}
                            <strong>
                              {formatPrice(
                                (b.remainingAmount || 0) +
                                  (b.totalExtraFees || 0),
                              )}
                              đ
                            </strong>{" "}
                            trong 12 giờ
                          </div>
                        </>
                      )}
                  </Link>

                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "20px",
                      fontWeight: 500,
                    }}
                  >
                    {formatPrice(b.totalPrice)}đ
                  </div>

                  <div
                    style={{
                      padding: "6px 14px",
                      border: `1px solid ${statusMap[b.status]?.color || "var(--muc-mo)"}`,
                      color: statusMap[b.status]?.color || "var(--muc-mo)",
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {statusMap[b.status]?.label || b.status}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* ★ MỚI: NÚT THANH TOÁN CỌC — CHỈ KHI PENDING */}
                    {b.status === "PENDING" && (
                      <Link
                        to={`/payment/${b.id}`}
                        style={{
                          padding: "8px 16px",
                          background: "var(--do)",
                          border: "1px solid var(--do)",
                          color: "var(--kem)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        💳 Thanh toán cọc ({formatPrice(b.depositAmount || 0)}đ)
                      </Link>
                    )}

                    {/* NÚT THANH TOÁN NỐT — CHỈ KHI RETURNED */}
                    {canPayFinal && (
                      <Link
                        to={`/payment-final/${b.id}`}
                        style={{
                          padding: "8px 16px",
                          background: "var(--do)",
                          border: "1px solid var(--do)",
                          color: "var(--kem)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        💰 Thanh toán nốt ({formatPrice(b.remainingAmount || 0)}
                        đ)
                      </Link>
                    )}

                    {/* Nút KÝ BIÊN BẢN */}
                    {canSignHandover && (
                      <button
                        onClick={() => handleViewHandover(b)}
                        style={{
                          padding: "8px 16px",
                          background: "var(--do)",
                          border: "1px solid var(--do)",
                          color: "var(--kem)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✍️ Ký biên bản
                      </button>
                    )}

                    {/* Nút XEM BIÊN BẢN */}
                    {b.status === "COMPLETED" && (
                      <button
                        onClick={() => handleViewHandover(b)}
                        style={{
                          padding: "8px 16px",
                          background: "transparent",
                          border: "1px solid var(--muc)",
                          color: "var(--muc)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        👁 Xem biên bản
                      </button>
                    )}

                    {/* Hủy đơn / Đánh giá */}
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
                          whiteSpace: "nowrap",
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
                          whiteSpace: "nowrap",
                        }}
                      >
                        ★ Đánh giá
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "32px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={paginationBtnStyle(currentPage === 1)}
                >
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={paginationNumStyle(currentPage === p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={paginationBtnStyle(currentPage === totalPages)}
                >
                  Sau →
                </button>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--muc-mo)",
                  marginTop: "16px",
                  marginBottom: "24px",
                }}
              >
                Trang {currentPage} / {totalPages} · Tổng {filtered.length} đơn
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function paginationBtnStyle(disabled) {
  return {
    padding: "8px 16px",
    background: "transparent",
    border: "1px solid var(--muc)",
    color: disabled ? "var(--muc-mo)" : "var(--muc)",
    fontFamily: "var(--mono)",
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
}

function paginationNumStyle(active) {
  return {
    padding: "8px 14px",
    background: active ? "var(--muc)" : "transparent",
    color: active ? "var(--kem)" : "var(--muc)",
    border: "1px solid var(--muc)",
    fontFamily: "var(--mono)",
    fontSize: "11px",
    cursor: "pointer",
    minWidth: "40px",
  };
}
