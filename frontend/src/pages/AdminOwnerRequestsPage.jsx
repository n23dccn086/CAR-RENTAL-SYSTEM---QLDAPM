import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAllOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest,
} from "../services/ownerRegistrationService";

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "var(--dong)" },
  APPROVED: { label: "Đã duyệt", color: "var(--xanh-reu)" },
  REJECTED: { label: "Bị từ chối", color: "var(--do)" },
};

export default function AdminOwnerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [message, setMessage] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAllOwnerRequests(filter || null);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleApprove = async (req) => {
    if (!window.confirm(`Duyệt yêu cầu đăng ký chủ xe của "${req.fullName}"?`))
      return;
    try {
      await approveOwnerRequest(req.id);
      showMessage(
        `✅ Đã duyệt "${req.fullName}". Tài khoản được nâng lên OWNER.`,
      );
      fetchRequests();
      setDetailModal(false);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const openRejectModal = (req) => {
    setRejectingRequest(req);
    setRejectReason("");
    setRejectError("");
    setRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setRejectError("");

    if (!rejectReason.trim()) {
      return setRejectError("Vui lòng nhập lý do từ chối");
    }

    setRejectSubmitting(true);
    try {
      await rejectOwnerRequest(rejectingRequest.id, rejectReason.trim());
      showMessage(`✅ Đã từ chối yêu cầu của "${rejectingRequest.fullName}"`);
      setRejectModal(false);
      setDetailModal(false);
      fetchRequests();
    } catch (err) {
      setRejectError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setRejectSubmitting(false);
    }
  };

  // ===== Pagination =====
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRequests = requests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

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

  const docTypeLabels = {
    CCCD_FRONT: "CCCD — Mặt trước",
    CCCD_BACK: "CCCD — Mặt sau",
    GPLX_FRONT: "GPLX — Mặt trước",
    GPLX_BACK: "GPLX — Mặt sau",
    SELFIE: "Selfie cầm CCCD",
  };

  const genderLabels = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Quản Trị — Duyệt Chủ Xe
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "40px",
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
            Đăng ký{" "}
            <em style={{ fontStyle: "italic", color: "var(--do)" }}>chủ xe.</em>
          </h1>
          {pendingCount > 0 && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                color: "var(--do)",
                marginTop: "12px",
              }}
            >
              {pendingCount} YÊU CẦU ĐANG CHỜ DUYỆT
            </div>
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

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {[
          { v: "PENDING", l: "Chờ duyệt" },
          { v: "APPROVED", l: "Đã duyệt" },
          { v: "REJECTED", l: "Bị từ chối" },
          { v: "", l: "Tất cả" },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => setFilter(opt.v)}
            style={{
              padding: "8px 16px",
              background: filter === opt.v ? "var(--muc)" : "transparent",
              color: filter === opt.v ? "var(--kem)" : "var(--muc-mo)",
              border: `1px solid ${filter === opt.v ? "var(--muc)" : "rgba(15,14,12,0.2)"}`,
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
      </div>

      {/* List */}
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
      ) : requests.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            padding: "40px",
            color: "var(--muc-mo)",
          }}
        >
          Không có yêu cầu nào.
        </p>
      ) : (
        <>
          <div>
            {currentRequests.map((req) => {
              const st = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
              return (
                <div
                  key={req.id}
                  style={{
                    padding: "24px",
                    marginBottom: "16px",
                    background: "var(--kem-dam)",
                    border: "1px solid rgba(15,14,12,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "12px",
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
                        YÊU CẦU #{req.id} · {formatDate(req.createdAt)}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: "24px",
                          fontWeight: 700,
                          marginBottom: "4px",
                        }}
                      >
                        {req.fullName}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "1px",
                          color: "var(--muc-mo)",
                        }}
                      >
                        {req.userPhone} · {req.userEmail || "Không email"}
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
                      }}
                    >
                      {st.label}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "12px",
                      padding: "16px",
                      background: "var(--kem)",
                      borderLeft: "3px solid var(--dong)",
                      marginBottom: "16px",
                    }}
                  >
                    <Info label="CCCD" value={req.cccd} />
                    <Info label="Ngày sinh" value={req.dateOfBirth} />
                    <Info
                      label="Giới tính"
                      value={genderLabels[req.gender] || req.gender}
                    />
                    <Info label="Ngân hàng" value={req.bankName} />
                    <Info label="Số TK" value={req.bankAccount} />
                    <Info label="Chủ TK" value={req.accountHolder} />
                  </div>

                  {req.status === "REJECTED" && req.rejectionReason && (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(139,44,44,0.1)",
                        borderLeft: "3px solid var(--do)",
                        marginBottom: "16px",
                        fontFamily: "var(--serif-2)",
                        fontStyle: "italic",
                        fontSize: "14px",
                        color: "var(--do)",
                      }}
                    >
                      <strong>Lý do từ chối:</strong> {req.rejectionReason}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => {
                        setDetailRequest(req);
                        setDetailModal(true);
                      }}
                      style={btnStyle("var(--muc)", "var(--kem)")}
                    >
                      👁 Xem hồ sơ ({req.documents?.length || 0}/5 ảnh)
                    </button>

                    {req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          style={btnStyle("var(--xanh-reu)", "var(--kem)")}
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          onClick={() => openRejectModal(req)}
                          style={btnStyle("var(--do)", "var(--kem)")}
                        >
                          ✕ Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
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
                Trang {currentPage} / {totalPages} · Tổng {requests.length} yêu
                cầu
              </div>
            </>
          )}
        </>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {detailModal &&
        detailRequest &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,14,12,0.7)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              zIndex: 99999,
              padding: "40px 20px",
              overflowY: "auto",
            }}
            onClick={() => setDetailModal(false)}
          >
            <div
              style={{
                background: "var(--kem)",
                border: "1px solid var(--muc)",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "calc(100vh - 80px)",
                overflowY: "auto",
                padding: "32px",
                position: "relative",
                marginBottom: "40px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDetailModal(false)}
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

              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "32px",
                  fontWeight: 900,
                  marginBottom: "8px",
                  paddingRight: "48px",
                }}
              >
                Hồ sơ đăng ký.
              </h2>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "var(--muc-mo)",
                  marginBottom: "24px",
                }}
              >
                YÊU CẦU #{detailRequest.id} · {detailRequest.fullName}
              </p>

              {/* Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  padding: "20px",
                  background: "var(--kem-dam)",
                  border: "1px solid rgba(15,14,12,0.15)",
                  marginBottom: "32px",
                }}
              >
                <InfoRow label="Họ tên" value={detailRequest.fullName} />
                <InfoRow label="Ngày sinh" value={detailRequest.dateOfBirth} />
                <InfoRow
                  label="Giới tính"
                  value={genderLabels[detailRequest.gender]}
                />
                <InfoRow label="CCCD" value={detailRequest.cccd} />
                <InfoRow
                  label="Ngày cấp"
                  value={detailRequest.cccdIssuedDate}
                />
                <InfoRow
                  label="Nơi cấp"
                  value={detailRequest.cccdIssuedPlace}
                />
                <InfoRow label="Địa chỉ" value={detailRequest.address} />
                <InfoRow label="Ngân hàng" value={detailRequest.bankName} />
                <InfoRow label="Số TK" value={detailRequest.bankAccount} />
                <InfoRow label="Chủ TK" value={detailRequest.accountHolder} />
                <InfoRow label="SĐT" value={detailRequest.userPhone} />
                <InfoRow label="Email" value={detailRequest.userEmail || "—"} />
              </div>

              {/* Documents */}
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                Ảnh giấy tờ ({detailRequest.documents?.length || 0}/5)
              </h3>

              {!detailRequest.documents ||
              detailRequest.documents.length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--serif-2)",
                    fontStyle: "italic",
                    color: "var(--muc-mo)",
                  }}
                >
                  Chưa có ảnh nào.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "16px",
                    marginBottom: "32px",
                  }}
                >
                  {detailRequest.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          aspectRatio: "4/3",
                          border: "1px solid rgba(15,14,12,0.2)",
                          background: `url(${doc.documentUrl}) center/cover`,
                          marginBottom: "8px",
                          overflow: "hidden",
                        }}
                      />
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "1px",
                          color: "var(--muc-mo)",
                          textAlign: "center",
                        }}
                      >
                        {docTypeLabels[doc.documentType] || doc.documentType}
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Actions */}
              {detailRequest.status === "PENDING" && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(15,14,12,0.15)",
                  }}
                >
                  <button
                    onClick={() => openRejectModal(detailRequest)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: "var(--do)",
                      color: "var(--kem)",
                      border: "none",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(detailRequest)}
                    style={{
                      flex: 2,
                      padding: "16px",
                      background: "var(--xanh-reu)",
                      color: "var(--kem)",
                      border: "none",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    ✓ Duyệt & Nâng role OWNER
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ===== REJECT MODAL ===== */}
      {rejectModal &&
        rejectingRequest &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,14,12,0.7)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              zIndex: 99999,
              padding: "40px 20px",
              overflowY: "auto",
            }}
            onClick={() => setRejectModal(false)}
          >
            <div
              style={{
                background: "var(--kem)",
                border: "1px solid var(--muc)",
                maxWidth: "520px",
                width: "100%",
                maxHeight: "calc(100vh - 80px)",
                overflowY: "auto",
                padding: "32px",
                position: "relative",
                marginBottom: "40px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setRejectModal(false)}
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

              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "28px",
                  fontWeight: 900,
                  marginBottom: "8px",
                  paddingRight: "48px",
                }}
              >
                Từ chối yêu cầu.
              </h2>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "var(--muc-mo)",
                  marginBottom: "24px",
                }}
              >
                {rejectingRequest.fullName} · {rejectingRequest.userPhone}
              </p>

              {rejectError && (
                <div
                  style={{
                    background: "rgba(139,44,44,0.1)",
                    border: "1px solid var(--do)",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    color: "var(--do)",
                    fontFamily: "var(--serif-2)",
                    fontStyle: "italic",
                  }}
                >
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleRejectSubmit}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "var(--muc-mo)",
                    marginBottom: "8px",
                  }}
                >
                  Lý do từ chối *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="VD: Ảnh CCCD bị mờ, không đọc được số..."
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "var(--kem-dam)",
                    border: "1px solid rgba(15,14,12,0.2)",
                    fontFamily: "var(--serif-2)",
                    fontSize: "16px",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    color: "var(--muc-mo)",
                    marginTop: "4px",
                  }}
                >
                  {rejectReason.length}/500
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setRejectModal(false)}
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
                    disabled={rejectSubmitting}
                    style={{
                      flex: 2,
                      padding: "16px",
                      background: "var(--do)",
                      border: "none",
                      color: "var(--kem)",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      cursor: rejectSubmitting ? "wait" : "pointer",
                    }}
                  >
                    {rejectSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Info({ label, value }) {
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
          fontSize: "15px",
          color: "var(--muc)",
          fontWeight: 500,
        }}
      >
        {value || "—"}
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

function btnStyle(bg, color) {
  return {
    padding: "10px 18px",
    background: bg,
    color,
    border: `1px solid ${bg}`,
    fontFamily: "var(--mono)",
    fontSize: "10px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    cursor: "pointer",
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