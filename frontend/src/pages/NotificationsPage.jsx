import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";

// ============================================================
// TYPE MAP — 46 loại notification, phân nhóm theo role
// ============================================================
const TYPE_MAP = {
  // ===== BOOKING =====
  BOOKING_NEW: { label: "Đơn mới", color: "var(--dong)", group: "BOOKING" },
  BOOKING_APPROVED: { label: "Đơn duyệt", color: "var(--xanh-reu)", group: "BOOKING" },
  BOOKING_REJECTED: { label: "Đơn từ chối", color: "var(--do)", group: "BOOKING" },
  BOOKING_CANCELLED: { label: "Đơn hủy", color: "var(--do)", group: "BOOKING" },
  BOOKING_COMPLETED: { label: "Đơn hoàn tất", color: "var(--muc-mo)", group: "BOOKING" },
  BOOKING_FINAL_PAYMENT: { label: "Thanh toán nốt", color: "var(--do)", group: "BOOKING" },
  BOOKING_REMINDER: { label: "Nhắc thanh toán", color: "var(--dong)", group: "BOOKING" },
  BOOKING_DRIVER_ASSIGNED: { label: "Gán tài xế", color: "var(--xanh-ngoc)", group: "BOOKING" },
  BOOKING_DRIVER_ACCEPTED: { label: "TX nhận chuyến", color: "var(--xanh-reu)", group: "BOOKING" },
  BOOKING_DRIVER_REJECTED: { label: "TX từ chối", color: "var(--do)", group: "BOOKING" },

  // ===== PAYMENT =====
  PAYMENT_SUCCESS: { label: "Thanh toán OK", color: "var(--xanh-reu)", group: "PAYMENT" },
  PAYMENT_FAILED: { label: "TT thất bại", color: "var(--do)", group: "PAYMENT" },

  // ===== REFUND =====
  REFUND_REQUESTED: { label: "Yêu cầu hoàn", color: "var(--dong)", group: "REFUND" },
  REFUND_SUCCESS: { label: "Hoàn tiền OK", color: "var(--xanh-reu)", group: "REFUND" },
  REFUND_REJECTED: { label: "Hoàn bị từ chối", color: "var(--do)", group: "REFUND" },

  // ===== CAR =====
  CAR_PENDING: { label: "Xe chờ duyệt", color: "var(--dong)", group: "CAR" },
  CAR_RESUBMITTED: { label: "Xe duyệt lại", color: "var(--dong)", group: "CAR" },
  CAR_APPROVED: { label: "Xe được duyệt", color: "var(--xanh-reu)", group: "CAR" },
  CAR_REJECTED: { label: "Xe bị từ chối", color: "var(--do)", group: "CAR" },

  // ===== DRIVER =====
  DRIVER_PENDING: { label: "TX chờ duyệt", color: "var(--dong)", group: "DRIVER" },
  DRIVER_APPROVED: { label: "TX được duyệt", color: "var(--xanh-reu)", group: "DRIVER" },
  DRIVER_REJECTED: { label: "TX bị từ chối", color: "var(--do)", group: "DRIVER" },

  // ===== HANDOVER =====
  HANDOVER_PICKUP_CREATED: { label: "BB giao đã tạo", color: "var(--dong)", group: "HANDOVER" },
  HANDOVER_PICKUP_SIGNED: { label: "BB giao đã ký", color: "var(--xanh-reu)", group: "HANDOVER" },
  HANDOVER_RETURN_CREATED: { label: "BB nhận đã tạo", color: "var(--dong)", group: "HANDOVER" },
  HANDOVER_RETURN_SIGNED: { label: "BB nhận đã ký", color: "var(--xanh-reu)", group: "HANDOVER" },

  // ===== REVIEW =====
  REVIEW_NEW: { label: "Đánh giá mới", color: "var(--tim)", group: "REVIEW" },
  REVIEW_REPLY: { label: "Phản hồi ĐG", color: "var(--tim)", group: "REVIEW" },

  // ===== DISPUTE =====
  DISPUTE_CREATED: { label: "Tranh chấp mới", color: "var(--do)", group: "DISPUTE" },
  DISPUTE_COUNTER_FILED: { label: "Đã phản bác", color: "var(--do)", group: "DISPUTE" },
  DISPUTE_ACCEPTED: { label: "Đồng ý TC", color: "var(--xanh-reu)", group: "DISPUTE" },
  DISPUTE_NEED_EVIDENCE: { label: "Cần bổ sung", color: "var(--do)", group: "DISPUTE" },
  DISPUTE_DEADLINE_WARNING: { label: "Sắp hết hạn", color: "var(--do)", group: "DISPUTE" },
  DISPUTE_RESOLVED: { label: "TC giải quyết", color: "var(--xanh-reu)", group: "DISPUTE" },

  // ===== WITHDRAWAL =====
  WITHDRAWAL_REQUESTED: { label: "YC rút tiền", color: "var(--dong)", group: "WITHDRAWAL" },
  WITHDRAWAL_APPROVED: { label: "Rút được duyệt", color: "var(--xanh-reu)", group: "WITHDRAWAL" },
  WITHDRAWAL_REJECTED: { label: "Rút bị từ chối", color: "var(--do)", group: "WITHDRAWAL" },
  WITHDRAWAL_COMPLETED: { label: "Đã chuyển khoản", color: "var(--xanh-reu)", group: "WITHDRAWAL" },

  // ===== VERIFICATION =====
  VERIFICATION_SUBMITTED: { label: "HS xác thực mới", color: "var(--dong)", group: "VERIFICATION" },
  VERIFICATION_APPROVED: { label: "Xác thực OK", color: "var(--xanh-reu)", group: "VERIFICATION" },
  VERIFICATION_REJECTED: { label: "Xác thực bị từ chối", color: "var(--do)", group: "VERIFICATION" },

  // ===== OWNER REQUEST =====
  OWNER_REQUEST_SUBMITTED: { label: "ĐK chủ xe mới", color: "var(--dong)", group: "OWNER_REQUEST" },
  OWNER_REQUEST_APPROVED: { label: "ĐK chủ xe OK", color: "var(--xanh-reu)", group: "OWNER_REQUEST" },
  OWNER_REQUEST_REJECTED: { label: "ĐK chủ xe bị từ chối", color: "var(--do)", group: "OWNER_REQUEST" },

  // ===== SYSTEM =====
  SYSTEM: { label: "Hệ thống", color: "var(--muc-mo)", group: "SYSTEM" },
  SYSTEM_BROADCAST: { label: "Broadcast", color: "var(--muc-mo)", group: "SYSTEM" },
};

// ============================================================
// FILTER THEO ROLE
// ============================================================
const FILTERS_BY_ROLE = {
  CUSTOMER: [
    { v: "", l: "Tất cả" },
    { v: "BOOKING_APPROVED", l: "Đơn duyệt" },
    { v: "BOOKING_REJECTED", l: "Đơn từ chối" },
    { v: "BOOKING_CANCELLED", l: "Đơn hủy" },
    { v: "BOOKING_COMPLETED", l: "Hoàn tất" },
    { v: "BOOKING_FINAL_PAYMENT", l: "Cần TT nốt" },
    { v: "PAYMENT_SUCCESS", l: "Thanh toán" },
    { v: "REFUND_SUCCESS", l: "Hoàn tiền" },
    { v: "HANDOVER_PICKUP_CREATED", l: "BB giao" },
    { v: "HANDOVER_RETURN_CREATED", l: "BB nhận" },
    { v: "DISPUTE_CREATED", l: "Tranh chấp" },
    { v: "VERIFICATION_APPROVED", l: "Xác thực" },
  ],
  OWNER: [
    { v: "", l: "Tất cả" },
    { v: "BOOKING_NEW", l: "Đơn mới" },
    { v: "BOOKING_CANCELLED", l: "Đơn hủy" },
    { v: "PAYMENT_SUCCESS", l: "Thanh toán" },
    { v: "CAR_APPROVED", l: "Xe duyệt" },
    { v: "CAR_REJECTED", l: "Xe từ chối" },
    { v: "DRIVER_APPROVED", l: "TX duyệt" },
    { v: "DRIVER_REJECTED", l: "TX từ chối" },
    { v: "HANDOVER_PICKUP_SIGNED", l: "BB giao ký" },
    { v: "HANDOVER_RETURN_SIGNED", l: "BB nhận ký" },
    { v: "REVIEW_NEW", l: "Đánh giá" },
    { v: "WITHDRAWAL_APPROVED", l: "Rút duyệt" },
    { v: "WITHDRAWAL_REJECTED", l: "Rút từ chối" },
  ],
  ADMIN: [
    { v: "", l: "Tất cả" },
    { v: "CAR_PENDING", l: "Xe chờ" },
    { v: "CAR_RESUBMITTED", l: "Xe duyệt lại" },
    { v: "DRIVER_PENDING", l: "TX chờ" },
    { v: "VERIFICATION_SUBMITTED", l: "Xác thực mới" },
    { v: "OWNER_REQUEST_SUBMITTED", l: "ĐK chủ xe" },
    { v: "REFUND_REQUESTED", l: "Hoàn tiền" },
    { v: "WITHDRAWAL_REQUESTED", l: "Rút tiền" },
    { v: "DISPUTE_CREATED", l: "Tranh chấp" },
  ],
};

const DEFAULT_FILTERS = [
  { v: "", l: "Tất cả" },
  { v: "SYSTEM", l: "Hệ thống" },
];

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "CUSTOMER";
  const filters = FILTERS_BY_ROLE[role] || DEFAULT_FILTERS;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");

  // ★ MỚI: selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ★ Polling interval ref
  const pollingRef = useRef(null);

  // ===== FETCH =====
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.type = filter;
      if (unreadOnly) params.unreadOnly = true;

      const res = await api.get("/notifications", { params });
      setNotifications(res.data.data || []);
      setSelectedIds(new Set()); // reset selection khi reload
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.data || 0);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter, unreadOnly]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, unreadOnly]);

  // ★ Polling 5s khi tab active
  useEffect(() => {
    const startPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        fetchUnreadCount();
      }, 5000);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(); // cập nhật ngay khi quay lại tab
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Khởi động nếu tab active lúc mount
    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ===== ACTIONS =====
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!window.confirm("Đánh dấu tất cả đã đọc?")) return;
    try {
      await api.put("/notifications/read-all");
      setMessage("Đã đánh dấu tất cả đã đọc");
      fetchNotifications();
      fetchUnreadCount();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa thông báo này?")) return;
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // ★ Xóa nhiều thông báo đã chọn
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert("Vui lòng chọn ít nhất 1 thông báo");
      return;
    }
    if (!window.confirm(`Xóa ${selectedIds.size} thông báo đã chọn?`)) return;

    try {
      await api.delete("/notifications/batch", {
        data: { ids: Array.from(selectedIds) },
      });
      setMessage(`Đã xóa ${selectedIds.size} thông báo`);
      setSelectedIds(new Set());
      fetchNotifications();
      fetchUnreadCount();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // ★ Xóa tất cả theo filter hiện tại
  const handleDeleteAll = async () => {
    const filterLabel = filters.find((f) => f.v === filter)?.l || "tất cả";
    const confirmMsg = filter || unreadOnly
      ? `Xóa TẤT CẢ thông báo "${filterLabel}"${unreadOnly ? " chưa đọc" : ""}?`
      : "Xóa TẤT CẢ thông báo của bạn? Hành động này không thể hoàn tác!";

    if (!window.confirm(confirmMsg)) return;

    try {
      if (filter || unreadOnly) {
        // Xóa theo filter: gọi batch với tất cả IDs hiện tại
        const ids = notifications.map((n) => n.id);
        if (ids.length === 0) {
          alert("Không có thông báo nào để xóa");
          return;
        }
        await api.delete("/notifications/batch", { data: { ids } });
        setMessage(`Đã xóa ${ids.length} thông báo`);
      } else {
        // Xóa tất cả
        await api.delete("/notifications/all");
        setMessage("Đã xóa tất cả thông báo");
      }
      setSelectedIds(new Set());
      fetchNotifications();
      fetchUnreadCount();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // ★ Toggle checkbox 1 thông báo
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ===== UTILS =====
  const formatDateTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNotifications = notifications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Thông Báo
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "40px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              margin: 0,
            }}
          >
            Tin{" "}
            <em style={{ fontStyle: "italic", color: "var(--do)" }}>nhắn.</em>
          </h1>
          {unreadCount > 0 && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                color: "var(--do)",
                marginTop: "12px",
              }}
            >
              {unreadCount} CHƯA ĐỌC
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "1px solid var(--muc)",
                color: "var(--muc)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Đọc tất cả
            </button>
          )}

          {/* ★ Nút Xóa đã chọn */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: "12px 24px",
                background: "var(--do)",
                border: "1px solid var(--do)",
                color: "var(--kem)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ✕ Xóa đã chọn ({selectedIds.size})
            </button>
          )}

          {/* ★ Nút Xóa tất cả */}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                padding: "12px 24px",
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
              🗑 Xóa tất cả
            </button>
          )}
        </div>
      </div>

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

      {/* FILTER */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "40px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {filters.map((opt) => (
          <button
            key={opt.v}
            onClick={() => setFilter(opt.v)}
            style={{
              padding: "8px 16px",
              background: filter === opt.v ? "var(--muc)" : "transparent",
              color: filter === opt.v ? "var(--kem)" : "var(--muc-mo)",
              border: `1px solid ${
                filter === opt.v ? "var(--muc)" : "rgba(15,14,12,0.2)"
              }`,
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {opt.l}
          </button>
        ))}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Chỉ chưa đọc
        </label>
      </div>

      {/* LIST */}
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
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "24px",
              color: "var(--muc-mo)",
            }}
          >
            Không có thông báo nào.
          </p>
        </div>
      ) : (
        <>
          <div>
            {currentNotifications.map((n) => {
              const t = TYPE_MAP[n.type] || {
                label: n.type,
                color: "var(--muc-mo)",
              };
              const isSelected = selectedIds.has(n.id);

              return (
                <div
                  key={n.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 120px 1fr auto",
                    gap: "16px",
                    alignItems: "center",
                    padding: "24px 0",
                    borderBottom: "1px solid rgba(15,14,12,0.12)",
                    background: isSelected
                      ? "rgba(139,44,44,0.05)"
                      : n.isRead
                        ? "transparent"
                        : "rgba(201,169,97,0.05)",
                    opacity: n.isRead ? 0.7 : 1,
                    paddingLeft: n.isRead ? "0" : "16px",
                    paddingRight: n.isRead ? "0" : "16px",
                    transition: "all 0.3s",
                  }}
                >
                  {/* ★ Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(n.id)}
                    style={{
                      cursor: "pointer",
                      width: "18px",
                      height: "18px",
                    }}
                  />

                  {/* Badge type */}
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 12px",
                        border: `1px solid ${t.color}`,
                        color: t.color,
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {!n.isRead && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--do)",
                          }}
                        ></span>
                      )}
                      {t.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "18px",
                        fontWeight: 700,
                        marginBottom: "6px",
                        color: "var(--muc)",
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif-2)",
                        fontStyle: "italic",
                        fontSize: "15px",
                        color: "var(--muc-mo)",
                        marginBottom: "6px",
                        lineHeight: 1.5,
                      }}
                    >
                      {n.content}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "10px",
                        letterSpacing: "1px",
                        color: "var(--muc-mo)",
                      }}
                    >
                      {formatDateTime(n.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        title="Đánh dấu đã đọc"
                        style={btnStyle("var(--xanh-reu)")}
                      >
                        ✓ Đọc
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Xóa"
                      style={btnStyle("var(--do)")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PHÂN TRANG */}
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
                  )
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
                Trang {currentPage} / {totalPages} · Tổng {notifications.length}{" "}
                thông báo
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ===== STYLES =====
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

function btnStyle(color) {
  return {
    padding: "6px 12px",
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    fontFamily: "var(--mono)",
    fontSize: "10px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}