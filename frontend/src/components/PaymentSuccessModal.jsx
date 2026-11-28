import { useState, useEffect } from "react";

export default function PaymentSuccessModal({
  isOpen,
  data,
  onClose,
  onGoToDetail,
}) {
  const [countdown, setCountdown] = useState(5);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset bộ đếm mỗi khi modal được mở lại (điều chỉnh state trong render thay vì trong effect)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setCountdown(5);
  }

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const methodNames = {
    MOMO: "Ví điện tử Momo",
    ZALOPAY: "Ví điện tử ZaloPay",
    VNPAY: "Cổng thanh toán VNPAY",
    BANKING: "Thẻ ngân hàng quốc tế",
  };

  const paymentTypeLabels = {
    DEPOSIT: "Thanh toán tiền cọc (Đợt 1)",
    REMAINING: "Thanh toán tiền thuê còn lại",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 14, 12, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "var(--kem)",
          border: "2px solid var(--dong)",
          boxShadow: "0 30px 90px rgba(15, 14, 12, 0.5)",
          padding: "40px 36px 32px",
          position: "relative",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Góc trang trí cổ điển */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            right: "8px",
            bottom: "8px",
            border: "1px dashed rgba(201, 169, 97, 0.4)",
            pointerEvents: "none",
          }}
        />

        {/* Huy hiệu thành công vàng kim / xanh rừng */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c9a961 0%, #8b6d30 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(201, 169, 97, 0.45)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--kem)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Tiêu đề chương */}
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "var(--dong)",
            marginBottom: "8px",
          }}
        >
          MAISON — BIÊN NHẬN THANH TOÁN
        </div>

        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "28px",
            fontWeight: 900,
            color: "var(--muc)",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          Thanh toán thành công!
        </h2>

        <p
          style={{
            fontFamily: "var(--serif-2)",
            fontSize: "15px",
            fontStyle: "italic",
            color: "var(--muc-mo)",
            margin: "0 0 24px",
          }}
        >
          Giao dịch đã được xác nhận và lưu vào Quỹ tạm giữ (Escrow) an toàn.
        </p>

        {/* Bảng chi tiết biên nhận phong cách cổ điển */}
        <div
          style={{
            background: "var(--kem-dam)",
            border: "1px solid rgba(15, 14, 12, 0.15)",
            padding: "20px 24px",
            marginBottom: "28px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontFamily: "var(--mono)", color: "var(--muc-mo)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>
              Mã đơn hàng
            </span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--muc)" }}>
              #{data.bookingId}
            </span>
          </div>

          {data.carName && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontSize: "13px",
              }}
            >
              <span style={{ fontFamily: "var(--mono)", color: "var(--muc-mo)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>
                Cỗ xe
              </span>
              <span style={{ fontFamily: "var(--serif-2)", fontWeight: 700, color: "var(--muc)" }}>
                {data.carName}
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontFamily: "var(--mono)", color: "var(--muc-mo)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>
              Khoản thanh toán
            </span>
            <span style={{ fontFamily: "var(--serif-2)", color: "var(--muc)" }}>
              {paymentTypeLabels[data.type] || "Tiền cọc"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontFamily: "var(--mono)", color: "var(--muc-mo)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>
              Phương thức
            </span>
            <span style={{ fontFamily: "var(--serif-2)", color: "var(--muc)" }}>
              {methodNames[data.method] || data.method}
            </span>
          </div>

          <div
            style={{
              height: "1px",
              background: "rgba(15, 14, 12, 0.12)",
              margin: "12px 0",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--muc)" }}>
              Số tiền đã nộp
            </span>
            <span style={{ fontFamily: "var(--serif)", fontSize: "26px", fontWeight: 900, color: "var(--do)" }}>
              {formatPrice(data.amount)}đ
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "16px",
              background: "var(--muc)",
              color: "var(--kem)",
              border: "1px solid var(--muc)",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 700,
              transition: "all 0.2s",
            }}
          >
            🚗 Về chuyến đi của tôi ({countdown}s)
          </button>

          {onGoToDetail && (
            <button
              type="button"
              onClick={onGoToDetail}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "var(--muc)",
                border: "1px solid rgba(15, 14, 12, 0.25)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              📄 Xem chi tiết đơn #{data.bookingId}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
