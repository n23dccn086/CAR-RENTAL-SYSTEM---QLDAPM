import { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [detailModal, setDetailModal] = useState(false);
  const [detailDispute, setDetailDispute] = useState(null);

  const [resolveModal, setResolveModal] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    resolution: "",
    resolvedAmount: "",
  });
  const [resolveError, setResolveError] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get("/admin/disputes", { params });
      setDisputes(Array.isArray(res.data.data) ? res.data.data : (res.data.data?.disputes || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const openDetailModal = (dispute) => {
    setDetailDispute(dispute);
    setDetailModal(true);
  };

  const handleApproveRaiser = async (id) => {
    if (!window.confirm("Duyệt form người khởi kiện (Bên A)?")) return;
    try {
      await api.put(`/admin/disputes/${id}/approve-raiser`);
      showMessage("Đã duyệt form người khởi kiện");
      fetchDisputes();
      setDetailModal(false);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveAgainst = async (id) => {
    if (!window.confirm("Duyệt form người bị kiện (Bên B)?")) return;
    try {
      await api.put(`/admin/disputes/${id}/approve-against`);
      showMessage("Đã duyệt form người bị kiện");
      fetchDisputes();
      setDetailModal(false);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestEvidence = async (dispute, target) => {
    const targetLabel =
      target === "RAISER"
        ? "Bên A"
        : target === "AGAINST"
          ? "Bên B"
          : "cả 2 bên";
    const request = window.prompt(`Yêu cầu ${targetLabel} bổ sung bằng chứng:`);
    if (!request) return;
    try {
      await api.put(
        `/admin/disputes/${dispute.id}/request-evidence?target=${target}&request=${encodeURIComponent(request)}`,
      );
      showMessage(`Đã gửi yêu cầu bổ sung cho ${targetLabel}`);
      fetchDisputes();
      setDetailModal(false);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const openResolveModal = (dispute) => {
    setResolvingDispute(dispute);
    setResolveForm({
      resolution: "",
      resolvedAmount: dispute.claimedAmount
        ? String(dispute.claimedAmount)
        : "",
    });
    setResolveError("");
    setResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setResolveError("");

    if (!resolveForm.resolution?.trim()) {
      return setResolveError("Vui lòng nhập kết luận giải quyết");
    }

    let amount = null;
    if (
      resolveForm.resolvedAmount !== "" &&
      resolveForm.resolvedAmount !== null
    ) {
      const num = Number(resolveForm.resolvedAmount);
      if (isNaN(num)) return setResolveError("Số tiền phải là số");
      if (num < 0) return setResolveError("Số tiền không được âm");
      if (num > 999999999999) return setResolveError("Số tiền quá lớn");
      amount = Math.floor(num);
    }

    setResolveSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.append("resolution", resolveForm.resolution.trim());
      if (amount !== null) params.append("resolvedAmount", amount);

      await api.put(
        `/admin/disputes/${resolvingDispute.id}/resolve?${params.toString()}`,
      );
      showMessage("Đã giải quyết + tạo hợp đồng PDF");
      setResolveModal(false);
      setDetailModal(false);
      fetchDisputes();
    } catch (err) {
      setResolveError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setResolveSubmitting(false);
    }
  };

  const statusMap = {
    PENDING: { label: "Chờ xử lý", color: "var(--dong)" },
    ACCEPTED: { label: "Khách đã đồng ý", color: "var(--xanh-reu)" },
    COUNTER_FILED: { label: "Khách đã phản bác", color: "var(--do)" },
    WAITING_EVIDENCE: { label: "Chờ bổ sung bằng chứng", color: "var(--do)" },
    APPROVED_RAISER: { label: "Đã duyệt Bên A", color: "var(--xanh-reu)" },
    APPROVED_AGAINST: { label: "Đã duyệt Bên B", color: "var(--xanh-reu)" },
    READY_TO_FINALIZE: { label: "Sẵn sàng chốt", color: "var(--dong)" },
    RESOLVED: { label: "Đã giải quyết", color: "var(--xanh-reu)" },
    CLOSED: { label: "Đã đóng", color: "var(--muc-mo)" },
  };

  const categoryMap = {
    damage: "Hư hỏng xe",
    late_return: "Trả xe muộn",
    overage_km: "Vượt km",
    no_show: "Không nhận xe",
    payment: "Thanh toán",
    behavior: "Thái độ",
    other: "Khác",
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

  // Parse evidenceHistory JSON an toàn
  const parseHistory = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(disputes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDisputes = disputes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const stats = {
    total: disputes.length,
    pending: disputes.filter((d) => d.status === "PENDING").length,
    resolved: disputes.filter((d) => d.status === "RESOLVED").length,
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Quản Trị — Tranh Chấp
      </div>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          marginBottom: "16px",
        }}
      >
        Xử lý{" "}
        <em style={{ fontStyle: "italic", color: "var(--do)" }}>tranh chấp.</em>
      </h1>
      <p
        style={{
          fontFamily: "var(--serif-2)",
          fontStyle: "italic",
          fontSize: "18px",
          color: "var(--muc-mo)",
          marginBottom: "40px",
        }}
      >
        Phân xử công bằng cho khách thuê và chủ xe.
      </p>

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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        <StatCard label="Tổng tranh chấp" value={stats.total} />
        <StatCard label="Chờ xử lý" value={stats.pending} color="var(--do)" />
        <StatCard
          label="Đã giải quyết"
          value={stats.resolved}
          color="var(--xanh-reu)"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {[
          { v: "", l: "Tất cả" },
          { v: "PENDING", l: "Chờ xử lý" },
          { v: "COUNTER_FILED", l: "Đã phản bác" },
          { v: "WAITING_EVIDENCE", l: "Chờ bằng chứng" },
          { v: "READY_TO_FINALIZE", l: "Sẵn sàng chốt" },
          { v: "RESOLVED", l: "Đã giải quyết" },
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
      ) : disputes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "24px",
              color: "var(--muc-mo)",
            }}
          >
            Không có tranh chấp nào.
          </p>
        </div>
      ) : (
        <>
          <div>
            {currentDisputes.map((d) => {
              let files = [];
              try {
                files = d.evidence ? JSON.parse(d.evidence) : [];
              } catch (e) {}
              let counterFiles = [];
              try {
                counterFiles = d.counterEvidence
                  ? JSON.parse(d.counterEvidence)
                  : [];
              } catch (e) {}

              const history = parseHistory(d.evidenceHistory);

              const canApproveRaiser = [
                "PENDING",
                "COUNTER_FILED",
                "ACCEPTED",
                "APPROVED_AGAINST",
              ].includes(d.status);
              const canApproveAgainst = [
                "PENDING",
                "COUNTER_FILED",
                "ACCEPTED",
                "APPROVED_RAISER",
              ].includes(d.status);
              const canRequestRaiserEvidence = [
                "PENDING",
                "COUNTER_FILED",
                "ACCEPTED",
                "APPROVED_AGAINST",
              ].includes(d.status);
              const canRequestAgainstEvidence = [
                "PENDING",
                "COUNTER_FILED",
                "ACCEPTED",
                "APPROVED_RAISER",
              ].includes(d.status);
              const canResolve = d.status === "READY_TO_FINALIZE";
              const isResolved = ["RESOLVED", "CLOSED"].includes(d.status);

              return (
                <div
                  key={d.id}
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
                        {d.disputeCode} · Đơn #{d.bookingId}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: "22px",
                          fontWeight: 700,
                        }}
                      >
                        {categoryMap[d.category] || d.category}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 14px",
                        border: `1px solid ${statusMap[d.status]?.color || "var(--muc-mo)"}`,
                        color: statusMap[d.status]?.color || "var(--muc-mo)",
                        fontFamily: "var(--mono)",
                        fontSize: "10px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusMap[d.status]?.label || d.status}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        background: "var(--kem)",
                        borderLeft: "3px solid var(--do)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          letterSpacing: "1.5px",
                          color: "var(--do)",
                          marginBottom: "6px",
                        }}
                      >
                        BÊN A (Người khởi kiện) ·{" "}
                        {d.raisedByName || `User #${d.raisedBy}`}
                        {d.raisedByPhone && ` · ${d.raisedByPhone}`}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "14px",
                          lineHeight: 1.5,
                        }}
                      >
                        "{d.description}"
                      </div>
                      {files.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <FileLinkList files={files} />
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        background: "var(--kem)",
                        borderLeft: "3px solid var(--dong)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          letterSpacing: "1.5px",
                          color: "var(--dong)",
                          marginBottom: "6px",
                        }}
                      >
                        BÊN B (Người bị kiện) ·{" "}
                        {d.againstUserName || `User #${d.againstUser}`}
                        {d.againstUserPhone && ` · ${d.againstUserPhone}`}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {d.counterDescription
                          ? `"${d.counterDescription}"`
                          : "(Chưa phản hồi)"}
                      </div>
                      {counterFiles.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <FileLinkList files={counterFiles} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ===== LỊCH SỬ GHI CHÚ ===== */}
                  {history.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          color: "var(--muc-mo)",
                          marginBottom: "8px",
                        }}
                      >
                        💬 LỊCH SỬ GHI CHÚ ({history.length})
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {history.map((h, i) => {
                          const isSystem = h.by === "SYSTEM";
                          return (
                            <div
                              key={i}
                              style={{
                                padding: "10px 14px",
                                background: isSystem
                                  ? "rgba(107,102,96,0.08)"
                                  : "var(--kem)",
                                borderLeft: `3px solid ${isSystem ? "var(--muc-mo)" : "var(--dong)"}`,
                                fontFamily: "var(--serif-2)",
                                fontStyle: "italic",
                                fontSize: "13px",
                                color: "var(--muc)",
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: "9px",
                                  letterSpacing: "1.5px",
                                  color: "var(--muc-mo)",
                                  marginBottom: "4px",
                                  fontStyle: "normal",
                                  textTransform: "uppercase",
                                }}
                              >
                                {isSystem ? "⚙ Hệ thống" : `👤 User #${h.by}`}
                                {h.at ? ` · ${formatDate(h.at)}` : ""}
                              </div>
                              "{h.note}"
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "1px",
                      color: "var(--muc-mo)",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>📅 Tạo: {formatDate(d.createdAt)}</span>
                    {d.claimedAmount > 0 && (
                      <span>💰 Yêu cầu: {formatPrice(d.claimedAmount)}đ</span>
                    )}
                    {d.counterFiledAt && (
                      <span>⚖ Phản bác: {formatDate(d.counterFiledAt)}</span>
                    )}
                    {d.resolvedAmount > 0 && (
                      <span style={{ color: "var(--xanh-reu)" }}>
                        ✓ Bồi thường: {formatPrice(d.resolvedAmount)}đ
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => openDetailModal(d)}
                      style={btnStyle("var(--muc)", "var(--kem)")}
                    >
                      👁 Xem chi tiết
                    </button>
                    {canApproveRaiser && (
                      <button
                        onClick={() => handleApproveRaiser(d.id)}
                        style={btnStyle("var(--xanh-reu)", "var(--kem)")}
                      >
                        ✓ Duyệt Bên A
                      </button>
                    )}
                    {canApproveAgainst && (
                      <button
                        onClick={() => handleApproveAgainst(d.id)}
                        style={btnStyle("var(--xanh-reu)", "var(--kem)")}
                      >
                        ✓ Duyệt Bên B
                      </button>
                    )}
                    {canRequestRaiserEvidence && (
                      <button
                        onClick={() => handleRequestEvidence(d, "RAISER")}
                        style={btnStyle("var(--dong)", "var(--muc)")}
                      >
                        ↻ Yêu cầu A bổ sung
                      </button>
                    )}
                    {canRequestAgainstEvidence && (
                      <button
                        onClick={() => handleRequestEvidence(d, "AGAINST")}
                        style={btnStyle("var(--dong)", "var(--muc)")}
                      >
                        ↻ Yêu cầu B bổ sung
                      </button>
                    )}
                    {canResolve && (
                      <button
                        onClick={() => openResolveModal(d)}
                        style={btnStyle("var(--do)", "var(--kem)")}
                      >
                        ✓ Giải quyết + PDF
                      </button>
                    )}
                    {isResolved && d.contractUrl && (
                      <a
                        href={d.contractUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ...btnStyle("var(--xanh-reu)", "var(--kem)"),
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        📄 Tải PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== PHÂN TRANG ===== */}
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
                Trang {currentPage} / {totalPages} · Tổng {disputes.length}{" "}
                tranh chấp
              </div>
            </>
          )}
        </>
      )}

      {detailModal && detailDispute && (
        <DetailModal
          dispute={detailDispute}
          onClose={() => setDetailModal(false)}
          onApproveRaiser={() => handleApproveRaiser(detailDispute.id)}
          onApproveAgainst={() => handleApproveAgainst(detailDispute.id)}
          onRequestEvidence={(target) =>
            handleRequestEvidence(detailDispute, target)
          }
          onResolve={() => {
            setDetailModal(false);
            openResolveModal(detailDispute);
          }}
        />
      )}

      {resolveModal && resolvingDispute && (
        <ResolveModal
          dispute={resolvingDispute}
          form={resolveForm}
          setForm={setResolveForm}
          error={resolveError}
          submitting={resolveSubmitting}
          onClose={() => setResolveModal(false)}
          onSubmit={handleResolveSubmit}
        />
      )}
    </div>
  );
}

function ResolveModal({
  dispute,
  form,
  setForm,
  error,
  submitting,
  onClose,
  onSubmit,
}) {
  const formatPrice = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,12,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--kem)",
          border: "1px solid var(--muc)",
          maxWidth: "600px",
          width: "100%",
          padding: "48px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
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
            fontSize: "28px",
            fontWeight: 900,
            marginBottom: "8px",
            paddingRight: "48px",
          }}
        >
          Giải quyết tranh chấp.
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
          {dispute.disputeCode} · Đơn #{dispute.bookingId}
        </p>

        <div
          style={{
            padding: "12px 16px",
            background: "rgba(74,93,63,0.08)",
            borderLeft: "3px solid var(--xanh-reu)",
            marginBottom: "24px",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            fontSize: "14px",
          }}
        >
          ✓ Cả 2 bên đã được duyệt. Bạn có thể chốt kết quả + tạo hợp đồng PDF.
        </div>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "20px" }}>
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
              Kết luận giải quyết *
            </label>
            <textarea
              value={form.resolution}
              onChange={(e) => setForm({ ...form, resolution: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Ví dụ: Khách hàng bồi thường 100,000đ cho chủ xe..."
              style={{
                width: "100%",
                padding: "12px 14px",
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
              {form.resolution.length}/2000
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
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
              Số tiền bồi thường (VNĐ)
            </label>
            <input
              type="number"
              value={form.resolvedAmount}
              onChange={(e) =>
                setForm({ ...form, resolvedAmount: e.target.value })
              }
              min="0"
              max="999999999999"
              step="1000"
              placeholder="0"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--kem-dam)",
                border: "1px solid rgba(15,14,12,0.2)",
                fontFamily: "var(--serif-2)",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {form.resolvedAmount &&
              !isNaN(Number(form.resolvedAmount)) &&
              Number(form.resolvedAmount) >= 0 && (
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    color: "var(--xanh-reu)",
                    marginTop: "6px",
                  }}
                >
                  = {formatPrice(form.resolvedAmount)}đ
                </div>
              )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
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
              disabled={submitting}
              style={{
                flex: 2,
                padding: "16px",
                background: "var(--xanh-reu)",
                border: "1px solid var(--xanh-reu)",
                color: "var(--kem)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận + Tạo PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "var(--muc)" }) {
  return (
    <div
      style={{
        background: "var(--kem-dam)",
        border: "1px solid rgba(15,14,12,0.15)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--muc-mo)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: "36px",
          fontWeight: 900,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FileLinkList({ files }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {files.map((f, i) => (
        <div
          key={i}
          style={{ display: "flex", flexDirection: "column", gap: "2px" }}
        >
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              background: "var(--kem-dam)",
              border: "1px solid rgba(15,14,12,0.15)",
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "var(--muc)",
              textDecoration: "none",
              wordBreak: "break-all",
            }}
          >
            <span>
              {f.filename?.endsWith(".pdf")
                ? "📄"
                : f.filename?.match(/\.docx?$/i)
                  ? "📝"
                  : f.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? "🖼️"
                    : "📎"}
            </span>
            <span style={{ flex: 1 }}>{f.filename}</span>
            <span style={{ color: "var(--do)" }}>↗</span>
          </a>

          {f.note && (
            <div
              style={{
                paddingLeft: "22px",
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "11px",
                color: "var(--muc-mo)",
                wordBreak: "break-word",
              }}
            >
              💬 {f.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailModal({
  dispute,
  onClose,
  onApproveRaiser,
  onApproveAgainst,
  onRequestEvidence,
  onResolve,
}) {
  let files = [];
  try {
    files = dispute.evidence ? JSON.parse(dispute.evidence) : [];
  } catch (e) {}
  let counterFiles = [];
  try {
    counterFiles = dispute.counterEvidence
      ? JSON.parse(dispute.counterEvidence)
      : [];
  } catch (e) {}

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

  const parseHistory = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const history = parseHistory(dispute.evidenceHistory);

  const canApproveRaiser = [
    "PENDING",
    "COUNTER_FILED",
    "ACCEPTED",
    "APPROVED_AGAINST",
  ].includes(dispute.status);
  const canApproveAgainst = [
    "PENDING",
    "COUNTER_FILED",
    "ACCEPTED",
    "APPROVED_RAISER",
  ].includes(dispute.status);
  const canRequestRaiserEvidence = [
    "PENDING",
    "COUNTER_FILED",
    "ACCEPTED",
    "APPROVED_AGAINST",
  ].includes(dispute.status);
  const canRequestAgainstEvidence = [
    "PENDING",
    "COUNTER_FILED",
    "ACCEPTED",
    "APPROVED_RAISER",
  ].includes(dispute.status);
  const canResolve = dispute.status === "READY_TO_FINALIZE";
  const isResolved = ["RESOLVED", "CLOSED"].includes(dispute.status);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,12,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
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
          type="button"
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: "24px", paddingRight: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "32px",
              fontWeight: 900,
              marginBottom: "8px",
            }}
          >
            Chi tiết tranh chấp.
          </h2>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "var(--muc-mo)",
            }}
          >
            {dispute.disputeCode} · Đơn #{dispute.bookingId}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "var(--kem-dam)",
              border: "2px solid var(--do)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--do)",
                marginBottom: "12px",
              }}
            >
              FORM BÊN A · Người khởi kiện ·{" "}
              {dispute.raisedByName || `User #${dispute.raisedBy}`}
              {dispute.raisedByPhone && ` · ${dispute.raisedByPhone}`}
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "15px",
                lineHeight: 1.6,
                marginBottom: "16px",
              }}
            >
              "{dispute.description}"
            </div>
            {dispute.claimedAmount > 0 && (
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--do)",
                  marginBottom: "12px",
                }}
              >
                💰 Yêu cầu: {formatPrice(dispute.claimedAmount)}đ
              </div>
            )}
            {files.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    letterSpacing: "1.5px",
                    color: "var(--muc-mo)",
                    marginBottom: "8px",
                  }}
                >
                  📎 BẰNG CHỨNG ({files.length})
                </div>
                <FileLinkList files={files} />
              </div>
            )}
          </div>

          <div
            style={{
              padding: "20px",
              background: "var(--kem-dam)",
              border: "2px solid var(--dong)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--dong)",
                marginBottom: "12px",
              }}
            >
              FORM BÊN B · Người bị kiện ·{" "}
              {dispute.againstUserName || `User #${dispute.againstUser}`}
              {dispute.againstUserPhone && ` · ${dispute.againstUserPhone}`}
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "15px",
                lineHeight: 1.6,
                marginBottom: "16px",
              }}
            >
              {dispute.counterDescription
                ? `"${dispute.counterDescription}"`
                : "(Chưa phản hồi)"}
            </div>
            {dispute.counterFiledAt && (
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  color: "var(--muc-mo)",
                  marginBottom: "12px",
                }}
              >
                📅 {formatDate(dispute.counterFiledAt)}
              </div>
            )}
            {counterFiles.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    letterSpacing: "1.5px",
                    color: "var(--muc-mo)",
                    marginBottom: "8px",
                  }}
                >
                  📎 BẰNG CHỨNG ({counterFiles.length})
                </div>
                <FileLinkList files={counterFiles} />
              </div>
            )}
          </div>
        </div>

        {/* ===== LỊCH SỬ GHI CHÚ ===== */}
        {history.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--muc-mo)",
                marginBottom: "8px",
              }}
            >
              💬 LỊCH SỬ GHI CHÚ ({history.length})
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {history.map((h, i) => {
                const isSystem = h.by === "SYSTEM";
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px 14px",
                      background: isSystem
                        ? "rgba(107,102,96,0.08)"
                        : "var(--kem-dam)",
                      borderLeft: `3px solid ${isSystem ? "var(--muc-mo)" : "var(--dong)"}`,
                      fontFamily: "var(--serif-2)",
                      fontStyle: "italic",
                      fontSize: "13px",
                      color: "var(--muc)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        color: "var(--muc-mo)",
                        marginBottom: "4px",
                        fontStyle: "normal",
                        textTransform: "uppercase",
                      }}
                    >
                      {isSystem ? "⚙ Hệ thống" : `👤 User #${h.by}`}
                      {h.at ? ` · ${formatDate(h.at)}` : ""}
                    </div>
                    "{h.note}"
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dispute.adminRequest && (
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(139,44,44,0.1)",
              borderLeft: "4px solid var(--do)",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--do)",
                marginBottom: "8px",
              }}
            >
              ⚠️ YÊU CẦU BỔ SUNG ĐÃ GỬI
              {dispute.awaitingResponseFrom &&
                ` (Bên ${dispute.awaitingResponseFrom === "RAISER" ? "A" : dispute.awaitingResponseFrom === "AGAINST" ? "B" : "Cả 2"})`}
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "15px",
              }}
            >
              "{dispute.adminRequest}"
            </div>
            {dispute.reviewDeadlineAt && (
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--do)",
                  marginTop: "8px",
                }}
              >
                ⏰ Hạn bổ sung: {formatDate(dispute.reviewDeadlineAt)}
              </div>
            )}
          </div>
        )}

        {dispute.resolution && (
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(74,93,63,0.08)",
              borderLeft: "4px solid var(--xanh-reu)",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--xanh-reu)",
                marginBottom: "8px",
              }}
            >
              ✓ KẾT QUẢ
            </div>
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "15px",
                marginBottom: "8px",
              }}
            >
              {dispute.resolution}
            </div>
            {dispute.resolvedAmount > 0 && (
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--xanh-reu)",
                }}
              >
                💰 Bồi thường: {formatPrice(dispute.resolvedAmount)}đ
              </div>
            )}
          </div>
        )}

        {dispute.contractUrl && (
          <div style={{ marginBottom: "24px" }}>
            <a
              href={dispute.contractUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "var(--xanh-reu)",
                color: "var(--kem)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              📄 Tải hợp đồng PDF
            </a>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            paddingTop: "24px",
            borderTop: "1px solid rgba(15,14,12,0.15)",
          }}
        >
          {canApproveRaiser && (
            <button
              onClick={onApproveRaiser}
              style={btnStyle("var(--xanh-reu)", "var(--kem)")}
            >
              ✓ Duyệt form Bên A
            </button>
          )}
          {canApproveAgainst && (
            <button
              onClick={onApproveAgainst}
              style={btnStyle("var(--xanh-reu)", "var(--kem)")}
            >
              ✓ Duyệt form Bên B
            </button>
          )}
          {canRequestRaiserEvidence && (
            <button
              onClick={() => onRequestEvidence("RAISER")}
              style={btnStyle("var(--dong)", "var(--muc)")}
            >
              ↻ Yêu cầu A bổ sung
            </button>
          )}
          {canRequestAgainstEvidence && (
            <button
              onClick={() => onRequestEvidence("AGAINST")}
              style={btnStyle("var(--dong)", "var(--muc)")}
            >
              ↻ Yêu cầu B bổ sung
            </button>
          )}
          {canResolve && (
            <button
              onClick={onResolve}
              style={btnStyle("var(--do)", "var(--kem)")}
            >
              ✓ Giải quyết + Tạo PDF
            </button>
          )}
          {isResolved && (
            <div
              style={{
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "15px",
                color: "var(--xanh-reu)",
                padding: "10px 0",
              }}
            >
              ✓ Đã giải quyết xong
            </div>
          )}
        </div>
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
