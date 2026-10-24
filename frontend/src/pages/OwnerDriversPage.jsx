import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { useDialog } from "../context/DialogContext";

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "var(--dong)" },
  ACTIVE: { label: "Đang hoạt động", color: "var(--xanh-reu)" },
  BUSY: { label: "Đang chạy chuyến", color: "var(--xanh-ngoc)" },
  INACTIVE: { label: "Tạm nghỉ", color: "var(--muc-mo)" },
  REJECTED: { label: "Bị từ chối", color: "var(--do)" },
};

const LOCKED_STATUSES = ["PENDING", "BUSY"];

export default function OwnerDriversPage() {
  const { confirm, alert: dialogAlert } = useDialog();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt,desc");
  const [page, setPage] = useState(0);
  const SIZE = 10;

  const [importing, setImporting] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [detailModal, setDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    cccd: "",
    licenseNumber: "",
    licenseClass: "B2",
    licenseExpiry: "",
    dateOfBirth: "",
    address: "",
    experienceYears: 0,
    avatarUrl: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      params.append("sort", sort);
      params.append("page", page);
      params.append("size", SIZE);

      const res = await api.get(`/drivers/my?${params.toString()}`);
      const pageData = res.data.data || {};
      setDrivers(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (err) {
      console.error(err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [status, debouncedSearch, sort, page]);

  useEffect(() => {
    setPage(0);
  }, [status, debouncedSearch, sort]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const openDetail = async (driver) => {
    setSelectedDriver(driver);
    setDetailModal(true);
    try {
      const res = await api.get(`/drivers/${driver.id}`);
      setSelectedDriver(res.data.data || driver);
    } catch (err) {
      console.error("Failed to load driver detail:", err);
    }
  };

  const closeDetail = () => {
    setDetailModal(false);
    setSelectedDriver(null);
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
      dialogAlert({
        title: "Định dạng file không hỗ trợ",
        message: "Chỉ hỗ trợ file Excel định dạng .xlsx",
        variant: "danger"
      });
      e.target.value = "";
      return;
    }

    const ok = await confirm({
      title: "Nhập danh sách tài xế",
      subtitle: "Import Excel",
      message: `Import tài xế từ file "${file.name}"?\n\nTài xế mới sau khi import sẽ ở trạng thái "Chờ Admin duyệt".`,
      confirmText: "Bắt đầu import",
      variant: "gold",
    });
    if (!ok) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const res = await api.post("/owner/drivers/import", formData, {
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

      dialogAlert({
        title: "Kết quả Import",
        message: detailMsg,
        variant: "success"
      });
      setPage(0);
      fetchDrivers();
    } catch (err) {
      dialogAlert({
        title: "Lỗi import",
        message: err.response?.data?.message || err.message,
        variant: "danger"
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleStatusToggle = async (driver) => {
    const newStatus = driver.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = newStatus === "INACTIVE" ? "Khóa" : "Mở khóa";

    const ok = await confirm({
      title: `${action} tài xế`,
      subtitle: "Trạng thái hoạt động",
      message: `Bạn có chắc muốn ${action.toLowerCase()} tài xế "${driver.name}" (${driver.phone})?`,
      confirmText: action,
      variant: newStatus === "INACTIVE" ? "danger" : "success",
    });
    if (!ok) return;

    try {
      await api.patch(`/drivers/${driver.id}/status`, { status: newStatus });
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, status: newStatus } : d,
        ),
      );
      showMessage(`Đã ${action.toLowerCase()} tài xế ${driver.name}`);
    } catch (err) {
      dialogAlert({
        title: "Lỗi cập nhật trạng thái",
        message: err.response?.data?.message || err.message,
        variant: "danger"
      });
    }
  };

  const openCreateModal = () => {
    setEditingDriver(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      cccd: "",
      licenseNumber: "",
      licenseClass: "B2",
      licenseExpiry: "",
      dateOfBirth: "",
      address: "",
      experienceYears: 0,
      avatarUrl: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name || "",
      phone: driver.phone || "",
      email: driver.email || "",
      cccd: driver.cccd || "",
      licenseNumber: driver.licenseNumber || "",
      licenseClass: driver.licenseClass || "B2",
      licenseExpiry: driver.licenseExpiry || "",
      dateOfBirth: driver.dateOfBirth || "",
      address: driver.address || "",
      experienceYears: driver.experienceYears || 0,
      avatarUrl: driver.avatarUrl || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name?.trim()) return setFormError("Tên không được để trống");
    if (!/^[0-9]{10,11}$/.test(form.phone))
      return setFormError("SĐT phải 10-11 chữ số");
    if (form.cccd && !/^[0-9]{12}$/.test(form.cccd))
      return setFormError("CCCD phải 12 số");
    if (!form.licenseNumber?.trim())
      return setFormError("Số GPLX không được để trống");

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        licenseNumber: form.licenseNumber.trim(),
        licenseClass: form.licenseClass,
        experienceYears: parseInt(form.experienceYears) || 0,
      };
      if (form.email?.trim()) payload.email = form.email.trim();
      if (form.cccd?.trim()) payload.cccd = form.cccd.trim();
      if (form.licenseExpiry) payload.licenseExpiry = form.licenseExpiry;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.address?.trim()) payload.address = form.address.trim();
      if (form.avatarUrl?.trim()) payload.avatarUrl = form.avatarUrl.trim();

      if (editingDriver) {
        await api.put(`/drivers/${editingDriver.id}`, payload);
        showMessage(
          `Đã cập nhật tài xế ${form.name}. Tài xế chuyển về "Chờ duyệt".`,
        );
      } else {
        await api.post("/drivers", payload);
        showMessage(`Đã thêm tài xế ${form.name}`);
      }
      setModalOpen(false);
      setPage(0);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (driver) => {
    const isRejected = driver.status === "REJECTED";

    const ok = await confirm({
      title: isRejected ? "Xóa vĩnh viễn tài xế" : "Xóa tài xế",
      subtitle: "Hành động nguy hiểm",
      message: isRejected
        ? `XÓA VĨNH VIỄN tài xế "${driver.name}" (${driver.phone})?\n\nHành động này không thể hoàn tác!`
        : `Bạn có chắc chắn muốn xóa tài xế "${driver.name}"?`,
      confirmText: isRejected ? "Xóa vĩnh viễn" : "Xác nhận xóa",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.delete(`/drivers/${driver.id}`);
      showMessage(`Đã xóa tài xế ${driver.name}`);
      closeDetail();
      fetchDrivers();
    } catch (err) {
      dialogAlert({
        title: "Lỗi xóa tài xế",
        message: err.response?.data?.message || err.message,
        variant: "danger"
      });
    }
  };

  const clearFilters = () => {
    setStatus("");
    setSearch("");
    setSort("createdAt,desc");
    setPage(0);
  };

  const hasActiveFilters = status || search;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Chủ Xe — Đội Tài Xế
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
            Đội{" "}
            <em style={{ fontStyle: "italic", color: "var(--do)" }}>tài xế.</em>
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
              {totalElements} TÀI XẾ
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <label
            style={{
              padding: "14px 28px",
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

          <button
            onClick={openCreateModal}
            style={{
              padding: "14px 28px",
              background: "var(--muc)",
              color: "var(--kem)",
              border: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + Thêm tài xế
          </button>
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
          gridTemplateColumns: "1.5fr 2fr 1fr auto",
          gap: "16px",
          marginBottom: "32px",
          padding: "24px",
          background: "var(--kem-dam)",
          border: "1px solid rgba(15,14,12,0.15)",
          alignItems: "start",
        }}
      >
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
          <label style={labelStyle}>Tìm kiếm</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên, SĐT, số GPLX..."
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
            <option value="name,asc">Tên A → Z</option>
            <option value="rating,desc">Đánh giá cao</option>
            <option value="totalTrips,desc">Nhiều chuyến</option>
            <option value="experienceYears,desc">Kinh nghiệm nhiều</option>
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
      ) : drivers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "24px",
              color: "var(--muc-mo)",
            }}
          >
            Chưa có tài xế nào.
          </p>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "var(--muc-mo)",
              marginTop: "16px",
            }}
          >
            Bấm "+ Thêm tài xế" hoặc "📥 Import Excel" để bắt đầu
          </p>
        </div>
      ) : (
        <>
          <div>
            {drivers.map((d) => {
              const st = STATUS_MAP[d.status] || {
                label: d.status,
                color: "var(--muc-mo)",
              };
              const isLocked = LOCKED_STATUSES.includes(d.status);
              const canToggle = d.status === "ACTIVE" || d.status === "INACTIVE";

              return (
                <div
                  key={d.id}
                  onClick={() => openDetail(d)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto auto auto",
                    gap: "24px",
                    alignItems: "center",
                    padding: "24px 0",
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
                  {d.avatarUrl ? (
                    <img
                      src={d.avatarUrl}
                      alt={d.name}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid var(--dong)",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "var(--dong)",
                      color: "var(--muc)",
                      display: d.avatarUrl ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--serif)",
                      fontWeight: 700,
                      fontSize: "20px",
                    }}
                  >
                    {d.name?.charAt(0)?.toUpperCase() || "?"}
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
                      {d.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                        color: "var(--muc-mo)",
                      }}
                    >
                      {d.phone} · GPLX: {d.licenseNumber} ({d.licenseClass})
                    </div>
                    {d.experienceYears > 0 && (
                      <div
                        style={{
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "13px",
                          color: "var(--muc-mo)",
                          marginTop: "4px",
                        }}
                      >
                        {d.experienceYears} năm kinh nghiệm · {d.rating || 0}★ ·{" "}
                        {d.totalTrips || 0} chuyến
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "14px",
                      color: "var(--muc-mo)",
                      textAlign: "right",
                    }}
                  >
                    {d.rating?.toFixed(1) || "0.0"}★
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
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.label}
                  </div>

                  <div
                    style={{ display: "flex", gap: "8px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isLocked && (
                      <button
                        onClick={() => openEditModal(d)}
                        style={btnStyle("var(--muc)")}
                      >
                        Sửa
                      </button>
                    )}

                    {canToggle && (
                      <button
                        onClick={() => handleStatusToggle(d)}
                        style={btnStyle(
                          d.status === "ACTIVE"
                            ? "var(--muc-mo)"
                            : "var(--xanh-reu)",
                        )}
                      >
                        {d.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => handleDelete(d)}
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page === totalPages - 1}
                  style={paginationBtnStyle(page === totalPages - 1)}
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
                Trang {page + 1} / {totalPages} · Tổng {totalElements} tài xế
              </div>
            </>
          )}
        </>
      )}

      {detailModal && selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          onClose={closeDetail}
          onEdit={() => {
            closeDetail();
            openEditModal(selectedDriver);
          }}
          onDelete={() => handleDelete(selectedDriver)}
        />
      )}

      {modalOpen && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,14,12,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
            overflowY: "auto",
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: "var(--kem)",
              border: "1px solid var(--muc)",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "48px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "32px",
                fontWeight: 900,
                marginBottom: "8px",
                paddingRight: "48px",
              }}
            >
              {editingDriver ? "Sửa" : "Thêm"}{" "}
              <em style={{ fontStyle: "italic", color: "var(--do)" }}>
                tài xế.
              </em>
            </h2>

            {editingDriver && (
              <p
                style={{
                  fontFamily: "var(--serif-2)",
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: "var(--dong)",
                  marginBottom: "24px",
                }}
              >
                ⚠️ Khi bạn sửa, tài xế sẽ chuyển về trạng thái{" "}
                <strong>"Chờ duyệt"</strong> và Admin phải duyệt lại.
              </p>
            )}

            {formError && (
              <div
                style={{
                  background: "rgba(139,44,44,0.1)",
                  border: "1px solid var(--do)",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  color: "var(--do)",
                  fontFamily: "var(--serif-2)",
                  fontStyle: "italic",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Field
                  label="Tên *"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Field
                  label="SĐT *"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Field
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Field
                  label="CCCD"
                  name="cccd"
                  value={form.cccd}
                  onChange={(e) => setForm({ ...form, cccd: e.target.value })}
                />
                <Field
                  label="Số GPLX *"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) =>
                    setForm({ ...form, licenseNumber: e.target.value })
                  }
                />

                <div>
                  <label style={labelStyle}>Hạng GPLX *</label>
                  <select
                    value={form.licenseClass}
                    onChange={(e) =>
                      setForm({ ...form, licenseClass: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>

                <Field
                  label="Ngày hết hạn GPLX"
                  name="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) =>
                    setForm({ ...form, licenseExpiry: e.target.value })
                  }
                />
                <Field
                  label="Ngày sinh"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                />
                <Field
                  label="Số năm kinh nghiệm"
                  name="experienceYears"
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) =>
                    setForm({ ...form, experienceYears: e.target.value })
                  }
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <Field
                  label="Địa chỉ"
                  name="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <Field
                  label="URL Avatar"
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm({ ...form, avatarUrl: e.target.value })
                  }
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "transparent",
                    border: "1px solid var(--muc)",
                    color: "var(--muc)",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
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
                    cursor: formLoading ? "wait" : "pointer",
                  }}
                >
                  {formLoading
                    ? "Đang xử lý..."
                    : editingDriver
                      ? "Cập nhật"
                      : "Tạo tài xế"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById("modal-root") || document.body
      )}
    </div>
  );
}

function DriverDetailModal({ driver, onClose, onEdit, onDelete }) {
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  const st = STATUS_MAP[driver.status] || {
    label: driver.status,
    color: "var(--muc-mo)",
  };

  const isLocked = LOCKED_STATUSES.includes(driver.status);

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
          maxWidth: "700px",
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
            paddingRight: "56px",
          }}
        >
          {driver.avatarUrl ? (
            <img
              src={driver.avatarUrl}
              alt={driver.name}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--dong)",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--dong)",
              color: "var(--muc)",
              display: driver.avatarUrl ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif)",
              fontWeight: 700,
              fontSize: "32px",
              flexShrink: 0,
            }}
          >
            {driver.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "var(--muc-mo)",
                marginBottom: "4px",
              }}
            >
              Chi tiết tài xế #{driver.id}
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 900,
                letterSpacing: "-1px",
                margin: 0,
              }}
            >
              {driver.name}
            </h2>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                letterSpacing: "1px",
                color: "var(--muc-mo)",
                marginTop: "4px",
              }}
            >
              {driver.phone}
            </div>
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

        {driver.status === "REJECTED" && driver.rejectionReason && (
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
            ⚠️ <strong>Lý do từ chối:</strong> {driver.rejectionReason}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <h3 style={sectionTitleStyle}>Thông tin cá nhân</h3>
          <InfoRow label="Họ tên" value={driver.name} />
          <InfoRow label="SĐT" value={driver.phone} highlight />
          <InfoRow label="Email" value={driver.email || "—"} />
          <InfoRow label="CCCD" value={driver.cccd || "—"} />
          <InfoRow label="Ngày sinh" value={formatDate(driver.dateOfBirth)} />
          <InfoRow label="Địa chỉ" value={driver.address || "—"} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={sectionTitleStyle}>Bằng lái & Kinh nghiệm</h3>
          <InfoRow label="Số GPLX" value={driver.licenseNumber} highlight />
          <InfoRow label="Hạng GPLX" value={driver.licenseClass} />
          <InfoRow
            label="Ngày hết hạn"
            value={formatDate(driver.licenseExpiry)}
          />
          <InfoRow
            label="Kinh nghiệm"
            value={
              driver.experienceYears ? `${driver.experienceYears} năm` : "—"
            }
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={sectionTitleStyle}>Đánh giá & Lượt chạy</h3>
          <InfoRow
            label="Đánh giá trung bình"
            value={`★ ${driver.rating?.toFixed(1) || "5.0"} / 5.0`}
            highlight
          />
          <InfoRow
            label="Tổng số chuyến"
            value={`🚗 ${driver.totalTrips || 0} chuyến`}
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
              ✕ Xóa tài xế
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

function Field({ label, name, type = "text", value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
    </div>
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
  padding: "12px 14px",
  background: "var(--kem-dam)",
  border: "1px solid rgba(15,14,12,0.2)",
  fontFamily: "var(--serif-2)",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
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
  };
}