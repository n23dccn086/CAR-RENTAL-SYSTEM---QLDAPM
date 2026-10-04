import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../services/bookingService";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    getMyBookings()
      .then((res) => {
        setBookings(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const filtered =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

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
          "LED",
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
        <div>
          {filtered.map((b) => (
            <Link
              key={b.id}
              to={`/payment/${b.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: "32px",
                alignItems: "center",
                padding: "24px 0",
                borderBottom: "1px solid rgba(15,14,12,0.12)",
                color: "inherit",
                transition: "all 0.3s",
              }}
            >
              <div>
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
              </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
