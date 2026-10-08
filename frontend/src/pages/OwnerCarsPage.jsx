import { useState, useEffect } from "react";
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
  APPROVED: { label: "Đã duyệt", color: "var(--xanh-reu)" },
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

const LOCKED_STATUSES = ["RENTED", "PENDING", "REJECTED"];

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

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

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

  // ★ HANDLE IMPORT EXCEL
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
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
      fetchCars();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (car) => {
    if (
      !window.confirm(
        `Xóa xe "${car.brand} ${car.model}" (${car.plate})?\n\nXe sẽ bị ẩn khỏi Bộ sưu tập.`,
      )
    )
      return;
    try {
      await api.delete(`/cars/${car.id}`);
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
  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

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

      {/* FILTER BAR */}
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
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1.5fr auto 200px auto",
                    gap: "20px",
                    alignItems: "center",
                    padding: "20px 0",
                    borderBottom: "1px solid rgba(15,14,12,0.12)",
                  }}
                >
                  {/* Ảnh xe */}
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

                  {/* Thông tin xe */}
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

                    {/* Stats */}
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

                    {/* Giá */}
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

                  {/* Nhãn trạng thái */}
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

                  {/* Dropdown đổi trạng thái */}
                  <div>
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
                        {car.status === "REJECTED" && "Admin đã từ chối"}
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

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Nút Sửa — ẨN hoàn toàn khi REJECTED */}
                    {car.status !== "REJECTED" && (
                      <Link
                        to={`/cars/edit/${car.id}`}
                        style={btnStyle("var(--muc)")}
                      >
                        Sửa
                      </Link>
                    )}

                    {/* Nút Xóa — Ẩn khi RENTED/PENDING/REJECTED */}
                    {!isLocked && (
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
    </div>
  );
}

// Styles
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
