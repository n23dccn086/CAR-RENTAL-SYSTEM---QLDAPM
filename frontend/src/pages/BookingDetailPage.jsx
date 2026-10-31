import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBookingById } from "../services/bookingService";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useDialog } from "../context/DialogContext";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prompt, alert: dialogAlert } = useDialog();
  const [booking, setBooking] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookingDetails = () => {
    Promise.all([
      getBookingById(id),
      api.get(`/handovers/booking/${id}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([bookingRes, handoverRes]) => {
        setBooking(bookingRes.data);
        setHandovers(handoverRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const handleReRequestRefund = async () => {
    if (!booking) return;
    const reason = await prompt({
      title: `Yêu cầu hoàn cọc lại · Đơn #${booking.id}`,
      subtitle: "Gửi khiếu nại / giải trình tới Ban Quản Trị",
      message: `Đơn hàng #${booking.id} đã bị Admin từ chối hoàn cọc.\n` +
        (booking.refund_reason ? `• Lý do từ chối: "${booking.refund_reason}"\n\n` : "\n") +
        `Vui lòng nhập lý do giải trình để Admin xem xét lại việc hoàn cọc:`,
      inputLabel: "Lý do / Giải trình khiếu nại",
      placeholder: "VD: Tôi đã liên hệ và thống nhất với chủ xe, kính mong xem xét hoàn cọc...",
      defaultValue: "",
      required: true,
      confirmText: "Gửi yêu cầu",
      variant: "warning",
    });
    if (reason === null) return;

    try {
      await api.post(`/bookings/${booking.id}/re-request-refund`, {
        reason: reason.trim(),
      });
      loadBookingDetails();
    } catch (err) {
      dialogAlert({
        title: "Gửi yêu cầu thất bại",
        message: err.response?.data?.message || err.message,
        variant: "danger",
      });
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const statusMap = {
    PENDING: { label: "Chờ thanh toán", color: "var(--do)" },
    PAID: { label: "Đã cọc", color: "var(--dong)" },
    APPROVED: { label: "Đã duyệt", color: "var(--xanh-reu)" },
    RENTED: { label: "Đang thuê", color: "var(--xanh-ngoc)" },
    RETURNED: { label: "Đã trả xe", color: "var(--tim)" },
    COMPLETED: { label: "Hoàn tất", color: "var(--muc-mo)" },
    CANCELLED: { label: "Đã hủy", color: "var(--do)" },
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "120px",
          textAlign: "center",
          fontFamily: "var(--serif-2)",
          fontStyle: "italic",
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: "120px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "96px",
            color: "var(--do)",
          }}
        >
          404
        </h1>
        <p style={{ fontFamily: "var(--serif-2)", fontStyle: "italic" }}>
          Không tìm thấy đơn.
        </p>
        <Link to="/my-bookings" style={{ color: "var(--do)" }}>
          ← Về chuyến đi
        </Link>
      </div>
    );
  }

  const pickupHandover = handovers.find((h) => h.handoverType === "PICKUP");
  const returnHandover = handovers.find((h) => h.handoverType === "RETURN");

  const isCancelled = booking.status === "CANCELLED";

  const needsSignPickup =
    !isCancelled &&
    pickupHandover &&
    pickupHandover.status === "PENDING" &&
    !pickupHandover.customerSignature;

  const needsSignReturn =
    !isCancelled &&
    returnHandover &&
    returnHandover.status === "PENDING" &&
    !returnHandover.customerSignature;

  const isOwner = user?.role === 'OWNER' || (booking && user?.id === booking.ownerId);
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = (user?.role === 'CUSTOMER' || (booking && user?.id === booking.customerId)) && !isOwner && !isAdmin;

  const canPayDeposit = isCustomer && booking.status === "PENDING";

  const canPayFinal =
    isCustomer &&
    booking.status === "RETURNED" &&
    (booking.remainingAmount > 0 || booking.totalExtraFees > 0);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 48px" }}>
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(user?.role === 'OWNER' ? '/owner/bookings' : user?.role === 'ADMIN' ? '/admin/dashboard' : '/my-bookings');
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--muc-mo)",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        ← {user?.role === 'OWNER' ? 'Về đơn của tôi' : user?.role === 'ADMIN' ? 'Quay lại' : 'Về chuyến đi'}
      </button>

      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chuyến Đi — Chi Tiết
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            Đơn{" "}
            <em style={{ fontStyle: "italic", color: "var(--do)" }}>
              #{booking.id}.
            </em>
          </h1>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "16px",
              color: "var(--muc-mo)",
              marginTop: "8px",
            }}
          >
            {booking.carName} {booking.carPlate && `— ${booking.carPlate}`}
          </p>
        </div>
        <div
          style={{
            padding: "10px 20px",
            border: `2px solid ${statusMap[booking.status]?.color}`,
            color: statusMap[booking.status]?.color,
            fontFamily: "var(--mono)",
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {statusMap[booking.status]?.label || booking.status}
        </div>
      </div>

      {/* ★ Banner thông báo đơn đã hủy + Trạng thái hoàn cọc */}
      {isCancelled && (
        <div
          style={{
            background: "rgba(139,44,44,0.08)",
            border: "2px solid var(--do)",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--do)",
              marginBottom: "8px",
            }}
          >
            🚫 Đơn hàng này đã bị hủy
          </div>
          <div
            style={{
              fontFamily: "var(--serif-2)",
              fontSize: "15px",
              color: "var(--muc)",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            Đơn hàng đã kết thúc vào lúc {formatDate(booking.cancelledAt)}.
            {booking.cancelReason && (
              <span> Lý do hủy: <strong>{booking.cancelReason}</strong>.</span>
            )}
          </div>

          {/* Refund Status Section */}
          {booking.refund_status === "SUCCESS" && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(40, 116, 68, 0.12)",
                borderLeft: "4px solid #287444",
                fontFamily: "var(--serif-2)",
                fontSize: "14px",
                color: "#287444",
              }}
            >
              ✅ <strong>Đã hoàn tiền cọc thành công:</strong> Số tiền {formatPrice(booking.refund_amount)}đ đã được hoàn lại theo chính sách sàn.
            </div>
          )}

          {booking.refund_status === "PENDING" && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(201,169,97,0.15)",
                borderLeft: "4px solid var(--dong)",
                fontFamily: "var(--serif-2)",
                fontSize: "14px",
                color: "var(--muc)",
              }}
            >
              ⏳ <strong>Đang chờ Admin duyệt hoàn tiền:</strong> Yêu cầu hoàn cọc {formatPrice(booking.refund_amount)}đ đang được ban quản trị xét duyệt.
            </div>
          )}

          {booking.refund_status === "CANCELLED" && (
            <div
              style={{
                padding: "14px 18px",
                background: "rgba(139,44,44,0.12)",
                borderLeft: "4px solid var(--do)",
                fontFamily: "var(--serif-2)",
                fontSize: "14px",
                color: "var(--do)",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                ❌ Yêu cầu hoàn cọc đã bị Admin từ chối
              </div>
              <div style={{ color: "var(--muc)", marginBottom: "10px" }}>
                Lý do từ chối: <em>{booking.refund_reason || "Không đủ điều kiện hoàn cọc theo quy chế."}</em>
              </div>
              <button
                type="button"
                onClick={handleReRequestRefund}
                style={{
                  padding: "8px 16px",
                  background: "var(--do)",
                  color: "var(--kem)",
                  border: "none",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🔄 Yêu cầu hoàn cọc lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* ★ Banner thông báo trạng thái ĐÃ CỌC — Chờ chủ xe duyệt trong 4 tiếng */}
      {booking.status === "PAID" && (
        <div
          style={{
            background: "rgba(184, 134, 11, 0.08)",
            border: "2px solid var(--dong)",
            borderLeft: "6px solid var(--dong)",
            padding: "20px 24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--dong)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⏱️ Đã thanh toán cọc — Chờ chủ xe xác nhận (Thời hạn: 4 tiếng)
          </div>
          <div
            style={{
              fontFamily: "var(--serif-2)",
              fontSize: "15px",
              color: "var(--muc)",
              lineHeight: 1.6,
            }}
          >
            {isOwner ? (
              <>
                Khách hàng đã thanh toán tiền cọc <strong>{formatPrice(booking.depositAmount)}đ</strong>.
                Vui lòng xác nhận duyệt đơn trong vòng <strong>4 tiếng</strong> kể từ lúc khách cọc.
                Nếu quá 4 tiếng không duyệt, hệ thống sẽ tự động hủy đơn và hoàn 100% tiền cọc lại cho khách hàng.
              </>
            ) : (
              <>
                Bạn đã thanh toán cọc thành công số tiền <strong>{formatPrice(booking.depositAmount)}đ</strong>.
                Chủ xe có tối đa <strong>4 tiếng</strong> để duyệt đơn.
                Nếu quá 4 tiếng chủ xe không duyệt, hệ thống sẽ tự động hủy đơn và tạo yêu cầu hoàn 100% tiền cọc cho bạn.
              </>
            )}
          </div>
        </div>
      )}

      {/* ★ Banner khi tất cả tài xế đều bận hoặc không thể nhận chuyến */}
      {!isCancelled && booking.rentalMode === "WITH_DRIVER" && (booking.driver_assignment_status === "NO_DRIVER_AVAILABLE" || (!booking.driverId && !booking.driver)) && (
        <div
          style={{
            background: "rgba(139,44,44,0.08)",
            border: "2px solid var(--do)",
            padding: "24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--do)",
                marginBottom: "6px",
              }}
            >
              ⚠️ Tất cả tài xế của chủ xe đều đã bận hoặc không nhận chuyến
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "15px",
                color: "var(--muc)",
                lineHeight: 1.6,
              }}
            >
              Hệ thống đã tự động tìm kiếm tài xế nhưng toàn bộ tài xế của chủ xe đều đang bận lịch hoặc từ chối đơn. Quý khách vui lòng <strong>lựa chọn cỗ xe khác</strong> hoặc hủy đơn để nhận lại tiền cọc.
            </div>
          </div>
          <Link
            to="/cars"
            style={{
              padding: "14px 28px",
              background: "var(--do)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            🚗 Chọn cỗ xe khác →
          </Link>
        </div>
      )}

      {/* ★ Banner nhắc ký biên bản giao xe */}
      {needsSignPickup && (
        <div
          style={{
            background: "rgba(139,44,44,0.08)",
            border: "2px solid var(--do)",
            padding: "24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--do)",
                marginBottom: "6px",
              }}
            >
              ✍️ Chủ xe đã lập biên bản giao xe
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "15px",
                color: "var(--muc)",
              }}
            >
              Vui lòng kiểm tra thông tin xe, số km, mức xăng và ký xác nhận để hoàn tất thủ tục nhận xe.
            </div>
          </div>
          <Link
            to={`/handover/${pickupHandover.id}`}
            style={{
              padding: "14px 28px",
              background: "var(--do)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            Ký biên bản giao xe →
          </Link>
        </div>
      )}

      {/* ★ Banner nhắc ký biên bản trả xe */}
      {needsSignReturn && (
        <div
          style={{
            background: "rgba(201,169,97,0.15)",
            border: "2px solid var(--dong)",
            padding: "24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--muc)",
                marginBottom: "6px",
              }}
            >
              ✍️ Chủ xe đã lập biên bản trả xe
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "15px",
                color: "var(--muc)",
              }}
            >
              Vui lòng kiểm tra số km thực tế, tình trạng xe và ký xác nhận hoàn thành trả xe.
            </div>
          </div>
          <Link
            to={`/handover/${returnHandover.id}`}
            style={{
              padding: "14px 28px",
              background: "var(--muc)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            Ký biên bản trả xe →
          </Link>
        </div>
      )}

      {/* Info */}
      <div
        style={{
          background: "var(--kem-dam)",
          border: "1px solid rgba(15,14,12,0.15)",
          padding: "32px",
          marginBottom: "32px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Thông tin đơn
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <InfoRow label="Ngày nhận xe" value={formatDate(booking.startDate)} />
          <InfoRow label="Ngày trả xe" value={formatDate(booking.endDate)} />
          <InfoRow label="Địa chỉ nhận" value={booking.pickupAddress} />
          <InfoRow
            label="Hình thức thuê"
            value={booking.rentalMode === "SELF_DRIVE" ? "Tự lái" : "Có tài xế"}
          />
          {booking.rentalMode === "WITH_DRIVER" && (
            <>
              <InfoRow
                label="Tài xế"
                value={
                  booking.driverName || booking.driver?.name
                    ? `${booking.driverName || booking.driver?.name} ${booking.driverPhone || booking.driver?.phone ? `(${booking.driverPhone || booking.driver?.phone})` : ''}`
                    : "Chưa có tài xế"
                }
              />
              <InfoRow
                label="Trạng thái tài xế"
                value={
                  booking.driver_assignment_status === "ACCEPTED"
                    ? "✅ Đã nhận chuyến"
                    : booking.driver_assignment_status === "PENDING"
                    ? "⏳ Chờ xác nhận"
                    : booking.driver_assignment_status === "NO_DRIVER_AVAILABLE"
                    ? "❌ Tất cả tài xế đều bận"
                    : booking.driver_assignment_status === "REJECTED"
                    ? "❌ Đã từ chối"
                    : booking.driver_assignment_status === "EXPIRED"
                    ? "⏰ Quá hạn phản hồi"
                    : (booking.driverName ? "Đã gán" : "Chưa gán")
                }
              />
            </>
          )}
          <InfoRow label="Khách hàng" value={booking.customerName} />
          <InfoRow label="Chủ xe" value={booking.ownerName} />
        </div>

        {(booking.customerNote || booking.ownerNote) && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(15,14,12,0.1)' }}>
            {booking.customerNote && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muc-mo)', marginBottom: '4px' }}>
                  Ghi chú của khách hàng:
                </div>
                <div style={{ fontFamily: 'var(--serif-2)', fontSize: '15px', color: 'var(--muc)', background: 'rgba(15,14,12,0.03)', padding: '10px 14px', borderLeft: '3px solid var(--dong)' }}>
                  "{booking.customerNote}"
                </div>
              </div>
            )}
            {booking.ownerNote && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--xanh-reu)', marginBottom: '4px' }}>
                  Ghi chú của chủ xe:
                </div>
                <div style={{ fontFamily: 'var(--serif-2)', fontSize: '15px', color: 'var(--xanh-reu)', background: 'rgba(74,93,63,0.05)', padding: '10px 14px', borderLeft: '3px solid var(--xanh-reu)', fontWeight: 600 }}>
                  "{booking.ownerNote}"
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tiền */}
      <div
        style={{
          background: "var(--kem-dam)",
          border: "1px solid rgba(15,14,12,0.15)",
          padding: "32px",
          marginBottom: "32px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Chi tiết tiền
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            fontFamily: "var(--serif-2)",
            fontSize: "16px",
          }}
        >
          <span>Tổng tiền thuê</span>
          <span style={{ fontFamily: "var(--mono)" }}>
            {formatPrice(booking.totalPrice)}đ
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            fontFamily: "var(--serif-2)",
            fontSize: "16px",
          }}
        >
          <span>Tiền cọc ({booking.depositPercent || 30}%)</span>
          <span style={{ fontFamily: "var(--mono)" }}>
            {formatPrice(booking.depositAmount)}đ
          </span>
        </div>
        {booking.totalExtraFees > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              fontFamily: "var(--serif-2)",
              fontSize: "16px",
              color: "var(--do)",
            }}
          >
            <span>Phí phát sinh</span>
            <span style={{ fontFamily: "var(--mono)" }}>
              +{formatPrice(booking.totalExtraFees)}đ
            </span>
          </div>
        )}
        <div
          style={{
            height: "1px",
            background: "rgba(15,14,12,0.15)",
            margin: "16px 0",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: booking.status === "CANCELLED" ? "var(--muc-mo)" : booking.status === "PENDING" ? "var(--do)" : "inherit",
              }}
            >
              {booking.status === "PENDING"
                ? "Cần thanh toán cọc (Đợt 1)"
                : booking.status === "CANCELLED"
                ? "Còn lại phải trả"
                : booking.status === "COMPLETED"
                ? "Còn lại phải trả"
                : "Còn lại phải trả (khi trả xe)"}
            </span>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "12px",
                color: "var(--muc-mo)",
                marginTop: "4px",
                fontStyle: "italic",
              }}
            >
              {booking.status === "CANCELLED" && (
                "Đơn đã bị hủy — Không phát sinh số tiền còn lại phải trả"
              )}
              {booking.status === "PENDING" && (
                `Chưa đóng cọc · Còn lại ${formatPrice((booking.totalPrice || 0) - (booking.depositAmount || 0))}đ thanh toán khi nhận / hoàn tất trả xe`
              )}
              {(booking.status === "PAID" || booking.status === "APPROVED" || booking.status === "RENTED") && (
                `Đã thanh toán trước ${booking.depositPercent || 30}% cọc (${formatPrice(booking.depositAmount)}đ)`
              )}
              {booking.status === "RETURNED" && (
                "Khoản tiền thuê còn lại và phụ phí phát sinh sau khi hoàn tất trả xe"
              )}
              {booking.status === "COMPLETED" && (
                "Đã hoàn tất thanh toán toàn bộ chi phí hợp đồng"
              )}
            </div>
          </div>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontSize: "28px",
              fontWeight: 900,
              color: booking.status === "CANCELLED" || booking.status === "COMPLETED" ? "var(--muc-mo)" : "var(--do)",
            }}
          >
            {booking.status === "CANCELLED" || booking.status === "COMPLETED"
              ? "0đ"
              : booking.status === "PENDING"
              ? `${formatPrice(booking.depositAmount)}đ`
              : booking.status === "RETURNED"
              ? `${formatPrice((booking.remainingAmount != null ? booking.remainingAmount : ((booking.totalPrice || 0) - (booking.depositAmount || 0))) + (booking.totalExtraFees || 0))}đ`
              : `${formatPrice((booking.totalPrice || 0) - (booking.depositAmount || 0) + (booking.totalExtraFees || 0))}đ`}
          </span>
        </div>
      </div>

      {/* Biên bản */}
      {(pickupHandover || returnHandover) && (
        <div
          style={{
            background: "var(--kem-dam)",
            border: "1px solid rgba(15,14,12,0.15)",
            padding: "32px",
            marginBottom: "32px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--serif)",
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            Biên bản bàn giao
          </h3>
          {isCancelled ? (
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(139,44,44,0.08)",
                border: "1px dashed var(--do)",
                color: "var(--do)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "1px",
                lineHeight: 1.6,
              }}
            >
              🚫 ĐƠN HÀNG ĐÃ HỦY — TẤT CẢ BIÊN BẢN GIAO/NHẬN XE ĐÃ BỊ VÔ HIỆU HÓA VÀ KHÔNG THỂ KÝ
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {pickupHandover && (
                <Link
                  to={`/handover/${pickupHandover.id}`}
                  style={{
                    padding: "16px",
                    background: "var(--kem)",
                    border: "1px solid var(--muc)",
                    textDecoration: "none",
                    color: "var(--muc)",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                  }}
                >
                  📝 Biên bản giao xe ({pickupHandover.status})
                </Link>
              )}
              {returnHandover && (
                <Link
                  to={`/handover/${returnHandover.id}`}
                  style={{
                    padding: "16px",
                    background: "var(--kem)",
                    border: "1px solid var(--muc)",
                    textDecoration: "none",
                    color: "var(--muc)",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                  }}
                >
                  📝 Biên bản nhận xe ({returnHandover.status})
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {/* ★ Nút Ký biên bản giao xe */}
        {needsSignPickup && (
          <Link
            to={`/handover/${pickupHandover.id}`}
            style={{
              padding: "16px 32px",
              background: "var(--do)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            ✍️ Ký biên bản giao xe
          </Link>
        )}

        {/* ★ Nút Ký biên bản trả xe */}
        {needsSignReturn && (
          <Link
            to={`/handover/${returnHandover.id}`}
            style={{
              padding: "16px 32px",
              background: "var(--muc)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            ✍️ Ký biên bản trả xe
          </Link>
        )}

        {/* NÚT THANH TOÁN CỌC — CHỈ DÀNH CHO KHÁCH HÀNG (CUSTOMER) */}
        {canPayDeposit && (
          <Link
            to={`/payment/${booking.id}`}
            style={{
              padding: "16px 32px",
              background: "var(--do)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            💳 Thanh toán cọc ({formatPrice(booking.depositAmount)}đ)
          </Link>
        )}

        {/* THÔNG BÁO CHO CHỦ XE KHI ĐƠN ĐANG CHỜ KHÁCH CỌC */}
        {isOwner && booking.status === "PENDING" && (
          <div
            style={{
              padding: "14px 24px",
              background: "rgba(184, 134, 11, 0.08)",
              border: "1px dashed var(--dong)",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "1px",
              color: "var(--dong)",
              textTransform: "uppercase",
            }}
          >
            ⏳ Đang chờ khách hàng thanh toán cọc ({formatPrice(booking.depositAmount)}đ)
          </div>
        )}

        {canPayFinal && (
          <Link
            to={`/payment-final/${booking.id}`}
            style={{
              padding: "16px 32px",
              background: "var(--do)",
              color: "var(--kem)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            💰 Thanh toán nốt
          </Link>
        )}

        {booking.status === "COMPLETED" && !booking.reviewed && isCustomer && (
          <Link
            to={`/review/${booking.id}`}
            style={{
              padding: "16px 32px",
              background: "var(--dong)",
              color: "var(--muc)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            ★ Đánh giá
          </Link>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "9px",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "var(--muc-mo)",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif-2)",
          fontSize: "16px",
          color: "var(--muc)",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
