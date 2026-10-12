import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api from "../services/api";

const SEAT_OPTIONS = [4, 5, 7];

const CAR_TYPE_OPTIONS = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "MPV", label: "MPV" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "PICKUP", label: "Bán tải" },
  { value: "VAN", label: "Van" },
  { value: "LUXURY", label: "Xe cao cấp" },
];

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "var(--dong)" },
  AVAILABLE: { label: "Sẵn sàng", color: "var(--xanh-reu)" },
  RENTED: { label: "Đang được thuê", color: "var(--xanh-ngoc)" },
  MAINTENANCE: { label: "Bảo dưỡng", color: "var(--tim)" },
  BROKEN: { label: "Bị hỏng", color: "var(--do)" },
  INACTIVE: { label: "Đã khóa", color: "var(--muc-mo)" },
  REJECTED: { label: "Bị từ chối", color: "var(--do)" },
};

const OWNER_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Sẵn sàng" },
  { value: "MAINTENANCE", label: "Bảo dưỡng" },
  { value: "BROKEN", label: "Bị hỏng" },
  { value: "INACTIVE", label: "Đã khóa" },
];

const LOCKED_STATUSES = ["RENTED", "PENDING"];

const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

const TRANSMISSION_LABELS = {
  AUTOMATIC: "Tự động",
  MANUAL: "Số sàn",
};

const FUEL_LABELS = {
  GASOLINE: "Xăng",
  DIESEL: "Dầu",
  ELECTRIC: "Điện",
  HYBRID: "Hybrid",
};

const RENTAL_MODE_LABELS = {
  SELF_DRIVE: "Tự lái",
  WITH_DRIVER: "Có tài xế",
  BOTH: "Cả hai",
};

const CAR_TYPE_LABELS = {
  SEDAN: "Sedan",
  SUV: "SUV",
  MPV: "MPV",
  HATCHBACK: "Hatchback",
  PICKUP: "Bán tải",
  VAN: "Van",
  LUXURY: "Xe cao cấp",
};

export default function OwnerCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [carType, setCarType] = useState("");
  const [status, setStatus] = useState("");
  const [seats, setSeats] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt,desc");
  const [page, setPage] = useState(0);
  const SIZE = 10;

  const [updatingId, setUpdatingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const [detailModal, setDetailModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (carType) params.append("carType", carType);
      if (status) params.append("status", status);
      seats.forEach((s) => params.append("seats", s));
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      params.append("sort", sort);
      params.append("page", page);
      params.append("size", SIZE);

      const res = await api.get(`/owner/cars?${params.toString()}`);
      const pageData = res.data.data || {};
      setCars(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (err) {
      console.error("Failed to load cars:", err);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [carType, status, seats, debouncedSearch, sort, page]);

  useEffect(() => {
    setPage(0);
  }, [carType, status, seats, debouncedSearch, sort]);

  const toggleSeat = (s) => {
    setSeats((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const openDetail = async (car) => {
    setSelectedCar(car);
    setDetailModal(true);
    try {
      const res = await api.get(`/cars/${car.id}`);
      setSelectedCar(res.data.data || car);
    } catch (err) {
      console.error("Failed to load car detail:", err);
    }
  };

  const closeDetail = () => {
    setDetailModal(false);
    setSelectedCar(null);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && detailModal) closeDetail();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [detailModal]);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      alert("Chỉ hỗ trợ file .xlsx");
      e.target.value = "";
      return;
    }

    if (
      !window.confirm(
        `Import xe từ file "${file.name}"?\n\nXe mới sẽ ở trạng thái "Chờ Admin duyệt".`,
      )
    ) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const res = await api.post("/owner/cars/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data.data || {};
      const msg = res.data.message || "Import thành công";

      let detailMsg = msg;
      if (result.errors && result.errors.length > 0) {
        detailMsg += "\n\nChi tiết:\n" + result.errors.slice(0, 20).join("\n");
        if (result.errors.length > 20) {
          detailMsg += `\n... và ${result.errors.length - 20} lỗi khác`;
        }
      }

      alert(detailMsg);
      setPage(0);
      fetchCars();
    } catch (err) {
      alert("Lỗi import: " + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleStatusChange = async (car, newStatus) => {
    if (newStatus === car.status) return;

    const statusLabel = STATUS_MAP[newStatus]?.label || newStatus;
    if (
      !window.confirm(
        `Đổi trạng thái xe "${car.brand} ${car.model}" (${car.plate}) thành "${statusLabel}"?`,
      )
    ) {
      return;
    }

    setUpdatingId(car.id);
    try {
      await api.patch(`/owner/cars/${car.id}/status`, { status: newStatus });
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, status: newStatus } : c)),
      );
      showMessage(`Đã đổi trạng thái xe ${car.plate}`);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
      fetchCars();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (car) => {
    const isRejected = car.status === "REJECTED";

    const message = isRejected
      ? `XÓA VĨNH VIỄN xe "${car.brand} ${car.model}" (${car.plate})?\n\n` +
        `⚠️ Hành động này KHÔNG THỂ hoàn tác!\n` +
        `Xe và tất cả ảnh, giấy tờ sẽ bị xóa khỏi hệ thống.`
      : `Xóa xe "${car.brand} ${car.model}" (${car.plate})?\n\n` +
        `Xe sẽ bị ẩn khỏi Bộ sưu tập.`;

    if (!window.confirm(message)) return;

    try {
      await api.delete(`/cars/${car.id}`);
      showMessage(`Đã xóa xe ${car.plate}`);
      closeDetail();
      fetchCars();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const clearFilters = () => {
    setCarType("");
    setStatus("");
    setSeats([]);
    setSearch("");
    setSort("createdAt,desc");
    setPage(0);
  };

  const hasActiveFilters = carType || status || seats.length > 0 || search;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chủ Xe — Quản Lý Xe
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
            Cỗ xe{" "}
            <em style={{ fontStyle: "italic", color: "var(--do)" }}>
              của tôi.
            </em>
          </h1>
          {!loading && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                color: "var(--muc-mo)",
                marginTop: "12px",
              }}
            >
              {totalElements} CỖ XE
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <label
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid var(--muc)",
              color: importing ? "var(--muc-mo)" : "var(--muc)",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: importing ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              opacity: importing ? 0.5 : 1,
            }}
          >
            <input
              type="file"
              accept=".xlsx"
              style={{ display: "none" }}
              onChange={handleImportExcel}
              disabled={importing}
            />
            📥 {importing ? "Đang import..." : "Import Excel"}
          </label>

          <Link
            to="/cars/create"
            className="btn-login"
            style={{
              padding: "12px 24px",
              display: "inline-flex",
              textDecoration: "none",
            }}
          >
            <span>+ Thêm xe</span>
          </Link>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1fr auto",
          gap: "16px",
          marginBottom: "32px",
          padding: "24px",
          background: "var(--kem-dam)",
          border: "1px solid rgba(15,14,12,0.15)",
          alignItems: "start",
        }}
      >
        <div>
          <label style={labelStyle}>Loại xe</label>
          <select
            value={carType}
            onChange={(e) => setCarType(e.target.value)}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            {CAR_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Số chỗ</label>
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              paddingTop: "8px",
            }}
          >
            {SEAT_OPTIONS.map((s) => (
              <label key={s} style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={seats.includes(s)}
                  onChange={() => toggleSeat(s)}
                  style={{ cursor: "pointer" }}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Tìm kiếm</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Biển số, hãng, model, năm..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Sắp xếp</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={inputStyle}
          >
            <option value="createdAt,desc">Mới nhất</option>
            <option value="pricePerDay,asc">Giá thấp → cao</option>
            <option value="pricePerDay,desc">Giá cao → thấp</option>
            <option value="year,desc">Năm mới nhất</option>
            <option value="brand,asc">Hãng A → Z</option>
          </select>
        </div>

        <div style={{ paddingTop: "22px" }}>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: "12px 16px",
                background: "transparent",
                border: "1px solid var(--do)",
                color: "var(--do)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
        </div>
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
      ) : cars.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "24px",
              color: "var(--muc-mo)",
            }}
          >
            Chưa có cỗ xe nào.
          </p>
          <Link
            to="/cars/create"
            style={{
              display: "inline-block",
              marginTop: "24px",
              color: "var(--do)",
              borderBottom: "1px solid var(--do)",
            }}
          >
            Thêm cỗ xe đầu tiên →
          </Link>
        </div>
      ) : (
        <>
          <div>
            {cars.map((car) => {
              const st = STATUS_MAP[car.status] || {
                label: car.status,
                color: "var(--muc-mo)",
              };
              const isLocked = LOCKED_STATUSES.includes(car.status);
              const isUpdating = updatingId === car.id;

              return (
                <div
                  key={car.id}
                  onClick={() => openDetail(car)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1.5fr auto 200px auto",
                    gap: "20px",
                    alignItems: "center",
                    padding: "20px 0",
                    borderBottom: "1px solid rgba(15,14,12,0.12)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(15,14,12,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      width: "100px",
                      height: "70px",
                      background: "var(--kem-dam)",
                      border: "1px solid rgba(15,14,12,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
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

                  <div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "20px",
                        fontWeight: 700,
                        marginBottom: "4px",
                      }}
                    >
                      {car.brand} {car.model} — {car.year}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                        color: "var(--muc-mo)",
                      }}
                    >
                      {car.plate} · {car.seats} chỗ · {car.carType}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        marginTop: "8px",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                      }}
                    >
                      <span style={{ color: "var(--dong)" }}>
                        ★ {car.averageRating?.toFixed(1) || "0.0"}
                        <span
                          style={{ color: "var(--muc-mo)", marginLeft: "4px" }}
                        >
                          ({car.reviewCount || 0})
                        </span>
                      </span>
                      <span style={{ color: "var(--xanh-ngoc)" }}>
                        🚗 {car.rentalCount || 0} lượt thuê
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--do)",
                        marginTop: "8px",
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
                  </div>

                  <div
                    style={{
                      padding: "6px 14px",
                      border: `1px solid ${st.color}`,
                      color: st.color,
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      minWidth: "120px",
                    }}
                  >
                    {st.label}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {isLocked ? (
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "rgba(107,102,96,0.08)",
                          border: "1px solid rgba(15,14,12,0.15)",
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "12px",
                          color: "var(--muc-mo)",
                          textAlign: "center",
                        }}
                      >
                        {car.status === "RENTED" && "Đang cho thuê"}
                        {car.status === "PENDING" && "Chờ Admin duyệt"}
                      </div>
                    ) : car.status === "REJECTED" ? (
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "rgba(139,44,44,0.08)",
                          border: "1px solid var(--do)",
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "12px",
                          color: "var(--do)",
                          textAlign: "center",
                        }}
                      >
                        Bị từ chối — sửa lại hoặc xóa
                      </div>
                    ) : (
                      <select
                        value={car.status}
                        onChange={(e) =>
                          handleStatusChange(car, e.target.value)
                        }
                        disabled={isUpdating}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "var(--kem)",
                          border: "1px solid rgba(15,14,12,0.2)",
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          cursor: isUpdating ? "wait" : "pointer",
                          outline: "none",
                          opacity: isUpdating ? 0.5 : 1,
                        }}
                      >
                        {OWNER_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", gap: "8px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!LOCKED_STATUSES.includes(car.status) && (
                      <Link
                        to={`/cars/edit/${car.id}`}
                        style={btnStyle("var(--muc)")}
                      >
                        Sửa
                      </Link>
                    )}

                    {!LOCKED_STATUSES.includes(car.status) && (
                      <button
                        onClick={() => handleDelete(car)}
                        style={btnStyle("var(--do)")}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
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
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={paginationBtnStyle(page === 0)}
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={paginationNumStyle(page === p)}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={paginationBtnStyle(page === totalPages - 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {detailModal && selectedCar && (
        <CarDetailModalOwner
          car={selectedCar}
          onClose={closeDetail}
          onEdit={() => {
            window.location.href = `/cars/edit/${selectedCar.id}`;
          }}
          onDelete={() => handleDelete(selectedCar)}
        />
      )}
    </div>
  );
}

function CarDetailModalOwner({ car, onClose, onEdit, onDelete }) {
  const [activeImage, setActiveImage] = useState(0);

  const st = STATUS_MAP[car.status] || {
    label: car.status,
    color: "var(--muc-mo)",
  };

  const images = car.imageUrls || [];
  const isLocked = LOCKED_STATUSES.includes(car.status);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,12,0.75)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        paddingTop: "80px",
        paddingBottom: "40px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--kem)",
          border: "1px solid var(--muc)",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "48px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "40px",
            height: "40px",
            background: "transparent",
            border: "1px solid var(--muc)",
            color: "var(--muc)",
            fontFamily: "var(--mono)",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ paddingRight: "56px", marginBottom: "24px" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--muc-mo)",
              marginBottom: "8px",
            }}
          >
            Chi tiết xe #{car.id}
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 900,
              letterSpacing: "-1px",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            {car.brand} {car.model} — {car.year}
          </h2>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "1px",
              color: "var(--muc-mo)",
            }}
          >
            {car.plate}
          </div>
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            marginBottom: "24px",
            border: `1px solid ${st.color}`,
            color: st.color,
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {st.label}
        </div>

        {car.status === "REJECTED" &&
          car.description &&
          car.description.includes("[REJECT]") && (
            <div
              style={{
                background: "rgba(139,44,44,0.08)",
                border: "1px solid var(--do)",
                padding: "16px",
                marginBottom: "24px",
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "14px",
                color: "var(--do)",
              }}
            >
              ⚠️ <strong>Lý do từ chối:</strong>{" "}
              {car.description.split("[REJECT]").pop().trim()}
            </div>
          )}

        {images.length > 0 ? (
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                background: "var(--kem-dam)",
                border: "1px solid rgba(15,14,12,0.15)",
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              <img
                src={images[activeImage]}
                alt={car.plate}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                {images.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: "80px",
                      height: "60px",
                      flexShrink: 0,
                      cursor: "pointer",
                      border:
                        activeImage === i
                          ? "2px solid var(--do)"
                          : "1px solid rgba(15,14,12,0.15)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={url}
                      alt={`${car.plate}-${i}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "200px",
              background: "var(--kem-dam)",
              border: "1px dashed rgba(15,14,12,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              marginBottom: "32px",
              color: "var(--muc-mo)",
            }}
          >
            🚗
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h3 style={sectionTitleStyle}>Thông tin cơ bản</h3>
            <InfoRow label="Biển số" value={car.plate} />
            <InfoRow label="Hãng xe" value={car.brand} />
            <InfoRow label="Dòng xe" value={car.model} />
            <InfoRow label="Năm SX" value={car.year} />
            <InfoRow label="Màu sắc" value={car.color || "—"} />
            <InfoRow
              label="Loại xe"
              value={CAR_TYPE_LABELS[car.carType] || car.carType}
            />
            <InfoRow
              label="Số chỗ"
              value={car.seats ? `${car.seats} chỗ` : "—"}
            />
            <InfoRow
              label="Số KM"
              value={
                car.currentKm != null ? `${formatPrice(car.currentKm)} km` : "—"
              }
            />
          </div>

          <div>
            <h3 style={sectionTitleStyle}>Giá & Địa chỉ</h3>
            <InfoRow
              label="Giá thuê/ngày"
              value={`${formatPrice(car.pricePerDay)}đ`}
              highlight
            />
            <InfoRow label="Địa chỉ" value={car.address || "—"} />
            <InfoRow
              label="Hộp số"
              value={TRANSMISSION_LABELS[car.transmission] || car.transmission}
            />
            <InfoRow
              label="Nhiên liệu"
              value={FUEL_LABELS[car.fuelType] || car.fuelType}
            />
            <InfoRow
              label="Hình thức thuê"
              value={RENTAL_MODE_LABELS[car.rentalMode] || car.rentalMode}
            />
          </div>
        </div>

        {car.description && !car.description.includes("[REJECT]") && (
          <div style={{ marginBottom: "32px" }}>
            <h3 style={sectionTitleStyle}>Mô tả</h3>
            <p
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "15px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {car.description}
            </p>
          </div>
        )}

        <div style={{ marginBottom: "32px" }}>
          <h3 style={sectionTitleStyle}>Đánh giá & Lượt thuê</h3>
          <InfoRow
            label="Đánh giá trung bình"
            value={`★ ${car.averageRating?.toFixed(1) || "5.0"} / 5.0`}
            highlight
          />
          <InfoRow
            label="Số lượng đánh giá"
            value={`${car.reviewCount || 0} lượt`}
          />
          <InfoRow
            label="Số chuyến đã hoàn tất"
            value={`🚗 ${car.rentalCount || 0} chuyến`}
          />
        </div>

        {!isLocked && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(15,14,12,0.15)",
            }}
          >
            <button
              onClick={onDelete}
              style={{
                flex: 1,
                padding: "16px",
                background: "transparent",
                border: "1px solid var(--do)",
                color: "var(--do)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ✕ Xóa xe
            </button>
            <button
              onClick={onEdit}
              style={{
                flex: 2,
                padding: "16px",
                background: "var(--muc)",
                border: "1px solid var(--muc)",
                color: "var(--kem)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ✎ Sửa thông tin
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px dotted rgba(15,14,12,0.1)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "var(--muc-mo)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: highlight ? "var(--serif)" : "var(--serif-2)",
          fontSize: highlight ? "16px" : "14px",
          fontWeight: highlight ? 700 : 400,
          color: highlight ? "var(--do)" : "var(--muc)",
          textAlign: "right",
          marginLeft: "16px",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

const sectionTitleStyle = {
  fontFamily: "var(--mono)",
  fontSize: "10px",
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "var(--muc-mo)",
  marginBottom: "12px",
  marginTop: "0",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(15,14,12,0.15)",
};

const labelStyle = {
  display: "block",
  fontFamily: "var(--mono)",
  fontSize: "10px",
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "var(--muc-mo)",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  background: "var(--kem)",
  border: "1px solid rgba(15,14,12,0.2)",
  fontFamily: "var(--serif-2)",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
};

const checkboxLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "6px 10px",
  background: "var(--kem)",
  border: "1px solid rgba(15,14,12,0.15)",
  fontFamily: "var(--mono)",
  fontSize: "12px",
  cursor: "pointer",
};

function btnStyle(color) {
  return {
    padding: "6px 14px",
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    fontFamily: "var(--mono)",
    fontSize: "10px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
  };
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