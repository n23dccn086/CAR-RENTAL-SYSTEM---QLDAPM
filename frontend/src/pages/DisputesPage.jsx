import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function DisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [againstMe, setAgainstMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("my");
  const [message, setMessage] = useState("");

  // ===== PHÂN TRANG =====
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // ===== MODAL TẠO =====
  const [createModal, setCreateModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    bookingId: "",
    category: "damage",
    description: "",
    claimedAmount: "",
  });
  const [createFiles, setCreateFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ===== MODAL PHẢN BÁC =====
  const [counterModal, setCounterModal] = useState(false);
  const [counteringDispute, setCounteringDispute] = useState(null);
  const [counterForm, setCounterForm] = useState({ description: "" });
  const [counterFiles, setCounterFiles] = useState([]);
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [counterError, setCounterError] = useState("");

  // ===== MODAL BỔ SUNG =====
  const [editModal, setEditModal] = useState(false);
  const [editingDispute, setEditingDispute] = useState(null);
  const [editForm, setEditForm] = useState({ description: "", userNote: "" });
  const [editFiles, setEditFiles] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [uploading, setUploading] = useState(false);

  // ===== FETCH =====
  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const [myRes, againstRes] = await Promise.all([
        api.get("/disputes/my"),
        api.get("/disputes/against-me"),
      ]);
      setDisputes(myRes.data.data || []);
      setAgainstMe(againstRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const endpoint =
        user?.role === "OWNER" ? "/bookings/owner" : "/bookings/my";
      const res = await api.get(endpoint);
      const list = res.data.data || [];
      const eligible = list.filter((b) => b.status === "COMPLETED");
      setBookings(eligible);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Reset page khi filter/tab đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, tab]);

  // ===== UPLOAD FILE =====
  const handleUploadFile = async (file, setFiles, files) => {
    if (files.length >= 3) {
      alert("Tối đa 3 file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/disputes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFile = {
        url: res.data.data.url,
        filename: res.data.data.filename,
        note: "",
      };
      setFiles([...files, newFile]);
    } catch (err) {
      alert("Upload thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index, setFiles, files) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpdateFileNote = (index, note, setFiles, files) => {
    const updated = [...files];
    updated[index].note = note;
    setFiles(updated);
  };

  // ===== OPEN MODALS =====
  const openCreateModal = async () => {
    setForm({
      bookingId: "",
      category: "damage",
      description: "",
      claimedAmount: "",
    });
    setCreateFiles([]);
    setFormError("");
    await fetchBookings();
    setCreateModal(true);
  };

  const openCounterModal = (dispute) => {
    setCounteringDispute(dispute);
    setCounterForm({ description: "" });
    setCounterFiles([]);
    setCounterError("");
    setCounterModal(true);
  };

  const openEditModal = (dispute) => {
    setEditingDispute(dispute);
    // Prefill: nếu user là AGAINST → dùng counterDescription làm default
    const isAgainstUser = user?.id === dispute.againstUser;
    const defaultDescription = isAgainstUser
      ? dispute.counterDescription || ""
      : dispute.description || "";
    setEditForm({ description: defaultDescription, userNote: "" });
    setEditFiles([]);
    setEditError("");
    setEditModal(true);
  };

  // ===== ACCEPT =====
  const handleAccept = async (disputeId) => {
    if (!window.confirm("Bạn xác nhận ĐỒNG Ý với tranh chấp này?")) return;
    try {
      await api.put(`/disputes/${disputeId}/accept`);
      setMessage("Đã xác nhận đồng ý với tranh chấp");
      fetchDisputes();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // ===== SUBMIT CREATE =====
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.bookingId) return setFormError("Vui lòng chọn đơn hàng");
    if (!form.description?.trim()) return setFormError("Vui lòng mô tả vấn đề");

    setSubmitting(true);
    try {
      const payload = {
        bookingId: parseInt(form.bookingId),
        category: form.category,
        description: form.description.trim(),
        evidence: createFiles.length > 0 ? JSON.stringify(createFiles) : null,
      };
      if (form.claimedAmount) {
        payload.claimedAmount = parseInt(form.claimedAmount);
      }

      await api.post("/disputes", payload);
      setMessage("Gửi tranh chấp thành công!");
      setCreateModal(false);
      fetchDisputes();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== SUBMIT COUNTER =====
  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    setCounterError("");

    if (!counterForm.description?.trim())
      return setCounterError("Vui lòng nhập nội dung phản bác");

    setCounterSubmitting(true);
    try {
      await api.put(`/disputes/${counteringDispute.id}/counter-evidence`, {
        description: counterForm.description.trim(),
        evidence: counterFiles.length > 0 ? JSON.stringify(counterFiles) : null,
      });
      setMessage("Đã gửi phản bác thành công");
      setCounterModal(false);
      fetchDisputes();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setCounterError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setCounterSubmitting(false);
    }
  };

  // ===== SUBMIT EDIT (bổ sung khi admin yêu cầu) =====
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");

    if (!editForm.description?.trim())
      return setEditError("Vui lòng mô tả vấn đề");

    setEditSubmitting(true);
    try {
      // Ghép file cũ + file mới tùy theo user là ai
      const isAgainstUser = user?.id === editingDispute.againstUser;
      const existingFiles = isAgainstUser
        ? editingDispute.counterEvidence
          ? JSON.parse(editingDispute.counterEvidence)
          : []
        : editingDispute.evidence
          ? JSON.parse(editingDispute.evidence)
          : [];

      const allFiles = [...existingFiles, ...editFiles];

      const payload = {
        description: editForm.description.trim(),
        evidence: allFiles.length > 0 ? JSON.stringify(allFiles) : null,
        userNote: editForm.userNote?.trim() || null,
      };

      await api.put(`/disputes/${editingDispute.id}/submit-review`, payload);
      setMessage("Đã gửi bằng chứng bổ sung thành công!");
      setEditModal(false);
      fetchDisputes();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setEditError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ===== MAPS =====
  const statusMap = {
    PENDING: { label: "Chờ xử lý", color: "var(--dong)" },
    ACCEPTED: { label: "Khách đã đồng ý", color: "var(--xanh-reu)" },
    COUNTER_FILED: { label: "Khách đã phản bác", color: "var(--do)" },
    WAITING_EVIDENCE: { label: "Chờ bổ sung bằng chứng", color: "var(--do)" },
    APPROVED_RAISER: {
      label: "Đã duyệt form chủ xe",
      color: "var(--xanh-reu)",
    },
    APPROVED_AGAINST: {
      label: "Đã duyệt form khách",
      color: "var(--xanh-reu)",
    },
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

  const currentList = tab === "my" ? disputes : againstMe;
  const filtered = filter
    ? currentList.filter((d) => d.status === filter)
    : currentList;

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDisputes = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 48px" }}>
      <div className="chapter-num" style={{ marginBottom: "24px" }}>
        Chương Tranh Chấp
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-2px",
            margin: 0,
          }}
        >
          Tranh{" "}
          <em style={{ fontStyle: "italic", color: "var(--do)" }}>chấp.</em>
        </h1>
        {tab === "my" && (
          <button
            onClick={openCreateModal}
            style={{
              padding: "14px 28px",
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
            + Tạo tranh chấp
          </button>
        )}
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(15,14,12,0.15)",
        }}
      >
        <button
          onClick={() => setTab("my")}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "none",
            borderBottom:
              tab === "my" ? "2px solid var(--do)" : "2px solid transparent",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: tab === "my" ? "var(--do)" : "var(--muc-mo)",
            cursor: "pointer",
          }}
        >
          Tôi tạo ({disputes.length})
        </button>
        <button
          onClick={() => setTab("against-me")}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "none",
            borderBottom:
              tab === "against-me"
                ? "2px solid var(--do)"
                : "2px solid transparent",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: tab === "against-me" ? "var(--do)" : "var(--muc-mo)",
            cursor: "pointer",
          }}
        >
          Bị kiện ({againstMe.length})
        </button>
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
        }}
      >
        {[
          { v: "", l: "Tất cả" },
          { v: "PENDING", l: "Chờ xử lý" },
          { v: "COUNTER_FILED", l: "Đã phản bác" },
          { v: "ACCEPTED", l: "Đã đồng ý" },
          { v: "WAITING_EVIDENCE", l: "Chờ bằng chứng" },
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
            {tab === "my"
              ? "Chưa có tranh chấp nào."
              : "Bạn không bị kiện trong tranh chấp nào."}
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

              const needsEvidence = d.status === "WAITING_EVIDENCE";
              const isAgainst = tab === "against-me";

              // ===== FIX: Bên B chỉ được phản bác 1 LẦN DUY NHẤT =====
              const hasCounterFiled =
                !!d.counterFiledAt || !!d.counterDescription;
              const canRespond =
                isAgainst && d.status === "PENDING" && !hasCounterFiled;

              const deadline = d.counterDeadlineAt
                ? new Date(d.counterDeadlineAt)
                : null;
              const isExpired = deadline && deadline < new Date();

              const awaiting = d.awaitingResponseFrom;
              const reviewDeadline = d.reviewDeadlineAt
                ? new Date(d.reviewDeadlineAt)
                : null;
              const isReviewExpired =
                reviewDeadline && reviewDeadline < new Date();

              const canSubmitEdit =
                needsEvidence &&
                !isReviewExpired &&
                ((awaiting === "RAISER" && tab === "my") ||
                  (awaiting === "AGAINST" && isAgainst) ||
                  awaiting === "BOTH");

              return (
                <div
                  key={d.id}
                  style={{
                    padding: "24px",
                    marginBottom: "16px",
                    background: needsEvidence
                      ? "rgba(139,44,44,0.05)"
                      : "var(--kem-dam)",
                    border: needsEvidence
                      ? "2px solid var(--do)"
                      : "1px solid rgba(15,14,12,0.15)",
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

                  {needsEvidence && d.adminRequest && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "rgba(139,44,44,0.1)",
                        border: "1px solid var(--do)",
                        borderLeft: "4px solid var(--do)",
                        marginBottom: "16px",
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
                        ⚠️ ADMIN YÊU CẦU BỔ SUNG
                        {awaiting &&
                          ` (Bên ${awaiting === "RAISER" ? "A" : awaiting === "AGAINST" ? "B" : "Cả 2"})`}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "16px",
                          color: "var(--muc)",
                        }}
                      >
                        "{d.adminRequest}"
                      </div>
                      {d.reviewDeadlineAt && (
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "11px",
                            color: "var(--do)",
                            marginTop: "10px",
                            paddingTop: "10px",
                            borderTop: "1px solid rgba(139,44,44,0.2)",
                          }}
                        >
                          ⏰ Hạn bổ sung: {formatDate(d.reviewDeadlineAt)}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: "var(--serif-2)",
                      fontStyle: "italic",
                      fontSize: "16px",
                      color: "var(--muc)",
                      lineHeight: 1.7,
                      marginBottom: "16px",
                    }}
                  >
                    <strong
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "10px",
                        letterSpacing: "2px",
                        color: "var(--muc-mo)",
                        display: "block",
                        marginBottom: "6px",
                        fontStyle: "normal",
                      }}
                    >
                      MÔ TẢ (BÊN A)
                    </strong>
                    "{d.description}"
                  </div>

                  {d.counterDescription && (
                    <div
                      style={{
                        padding: "16px",
                        background: "rgba(201,169,97,0.08)",
                        borderLeft: "3px solid var(--dong)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          color: "var(--dong)",
                          marginBottom: "6px",
                        }}
                      >
                        PHẢN BÁC (BÊN B)
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          fontSize: "15px",
                          color: "var(--muc)",
                        }}
                      >
                        "{d.counterDescription}"
                      </div>
                    </div>
                  )}

                  {files.length > 0 && (
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
                        📎 BẰNG CHỨNG BÊN A ({files.length})
                      </div>
                      <FileList files={files} />
                    </div>
                  )}

                  {counterFiles.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          letterSpacing: "2px",
                          color: "var(--dong)",
                          marginBottom: "8px",
                        }}
                      >
                        📎 BẰNG CHỨNG BÊN B ({counterFiles.length})
                      </div>
                      <FileList files={counterFiles} />
                    </div>
                  )}

                  {/* ===== GHI CHÚ BỔ SUNG (evidenceHistory) ===== */}
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
                                  : "var(--kem-dam)",
                                borderLeft: `3px solid ${isSystem ? "var(--muc-mo)" : "var(--dong)"}`,
                                fontFamily: "var(--serif-2)",
                                fontStyle: "italic",
                                fontSize: "14px",
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
                                {isSystem
                                  ? "⚙ Hệ thống"
                                  : h.by === user?.id
                                    ? `👤 Bạn`
                                    : `👤 User #${h.by}`}
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
                    <span>📅 {formatDate(d.createdAt)}</span>
                    {d.claimedAmount > 0 && (
                      <span>💰 Yêu cầu: {formatPrice(d.claimedAmount)}đ</span>
                    )}
                    {d.resolvedAmount > 0 && (
                      <span style={{ color: "var(--xanh-reu)" }}>
                        ✓ Bồi thường: {formatPrice(d.resolvedAmount)}đ
                      </span>
                    )}
                    {deadline && d.status === "PENDING" && isAgainst && (
                      <span
                        style={{
                          color: isExpired ? "var(--do)" : "var(--dong)",
                        }}
                      >
                        ⏰ Hạn phản hồi: {formatDate(deadline)}
                      </span>
                    )}
                  </div>

                  {d.resolution && (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(74,93,63,0.08)",
                        borderLeft: "3px solid var(--xanh-reu)",
                        fontFamily: "var(--serif-2)",
                        fontStyle: "italic",
                        fontSize: "15px",
                        color: "var(--muc)",
                        marginBottom: "16px",
                      }}
                    >
                      <strong>Kết quả:</strong> {d.resolution}
                    </div>
                  )}

                  {d.contractUrl && (
                    <div style={{ marginBottom: "16px" }}>
                      <a
                        href={d.contractUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 18px",
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

                  {canRespond && !isExpired && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        background: "rgba(201,169,97,0.1)",
                        border: "1px solid var(--dong)",
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
                        ⚠️ BẠN CẦN PHẢN HỒI
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => handleAccept(d.id)}
                          style={{
                            flex: 1,
                            padding: "14px",
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
                          ✓ Tôi đồng ý
                        </button>
                        <button
                          onClick={() => openCounterModal(d)}
                          style={{
                            flex: 1,
                            padding: "14px",
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
                          ⚖ Phản bác
                        </button>
                      </div>
                    </div>
                  )}

                  {isAgainst &&
                    isExpired &&
                    d.status === "PENDING" &&
                    !hasCounterFiled && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px 16px",
                          background: "rgba(139,44,44,0.1)",
                          border: "1px solid var(--do)",
                          fontFamily: "var(--serif-2)",
                          fontStyle: "italic",
                          color: "var(--do)",
                        }}
                      >
                        ⚠️ Đã hết hạn phản hồi. Hệ thống coi như bạn đã chấp
                        nhận.
                      </div>
                    )}

                  {canSubmitEdit && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px",
                      }}
                    >
                      <button
                        onClick={() => openEditModal(d)}
                        style={{
                          padding: "12px 24px",
                          background: "var(--do)",
                          border: "1px solid var(--do)",
                          color: "var(--kem)",
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        📎 Cung cấp bằng chứng
                      </button>
                    </div>
                  )}

                  {needsEvidence && isReviewExpired && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        background: "rgba(139,44,44,0.1)",
                        border: "1px solid var(--do)",
                        fontFamily: "var(--serif-2)",
                        fontStyle: "italic",
                        color: "var(--do)",
                      }}
                    >
                      ⚠️ Đã hết hạn bổ sung bằng chứng. Admin sẽ duyệt dựa trên
                      thông tin hiện có.
                    </div>
                  )}
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
                Trang {currentPage} / {totalPages} · Tổng {filtered.length}{" "}
                tranh chấp
              </div>
            </>
          )}
        </>
      )}

      {/* ===== MODAL CREATE ===== */}
      {createModal && (
        <Modal title="Tạo tranh chấp." onClose={() => setCreateModal(false)}>
          {formError && <ErrorAlert message={formError} />}
          {bookings.length === 0 ? (
            <InfoBox>
              Bạn chưa có đơn hàng nào đã hoàn tất để tạo tranh chấp.
            </InfoBox>
          ) : (
            <form onSubmit={handleCreateSubmit}>
              <FormSelect
                label="Đơn hàng *"
                value={form.bookingId}
                onChange={(e) =>
                  setForm({ ...form, bookingId: e.target.value })
                }
              >
                <option value="">-- Chọn đơn hàng --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} — {b.carName || "Xe"}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Danh mục *"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="damage">Hư hỏng xe</option>
                <option value="late_return">Trả xe muộn</option>
                <option value="overage_km">Vượt km</option>
                <option value="no_show">Không nhận xe</option>
                <option value="payment">Thanh toán</option>
                <option value="behavior">Thái độ</option>
                <option value="other">Khác</option>
              </FormSelect>

              <FormTextarea
                label="Mô tả chi tiết *"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={2000}
                placeholder="Mô tả vấn đề..."
              />

              <FormInput
                label="Số tiền yêu cầu bồi thường (VNĐ)"
                type="number"
                value={form.claimedAmount}
                onChange={(e) =>
                  setForm({ ...form, claimedAmount: e.target.value })
                }
                min="0"
                placeholder="0"
              />

              <FileUploader
                files={createFiles}
                onUpload={(file) =>
                  handleUploadFile(file, setCreateFiles, createFiles)
                }
                onRemove={(i) =>
                  handleRemoveFile(i, setCreateFiles, createFiles)
                }
                onUpdateNote={(i, note) =>
                  handleUpdateFileNote(i, note, setCreateFiles, createFiles)
                }
                uploading={uploading}
                max={3}
              />

              <ModalActions
                onCancel={() => setCreateModal(false)}
                submitLabel={submitting ? "Đang gửi..." : "Gửi tranh chấp"}
                submitting={submitting}
              />
            </form>
          )}
        </Modal>
      )}

      {/* ===== MODAL COUNTER ===== */}
      {counterModal && counteringDispute && (
        <Modal
          title="Phản bác tranh chấp."
          subtitle={`${counteringDispute.disputeCode} · Đơn #${counteringDispute.bookingId}`}
          onClose={() => setCounterModal(false)}
        >
          {counterError && <ErrorAlert message={counterError} />}
          <div
            style={{
              padding: "16px",
              background: "var(--kem-dam)",
              marginBottom: "24px",
              fontFamily: "var(--serif-2)",
              fontStyle: "italic",
              fontSize: "15px",
              lineHeight: 1.6,
            }}
          >
            <strong>Bên A nói:</strong> "{counteringDispute.description}"
          </div>

          {counteringDispute.counterDeadlineAt && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(201,169,97,0.15)",
                border: "1px solid var(--dong)",
                marginBottom: "20px",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "1px",
                color: "var(--dong)",
              }}
            >
              ⏰ Hạn phản hồi: {formatDate(counteringDispute.counterDeadlineAt)}
            </div>
          )}

          <form onSubmit={handleCounterSubmit}>
            <FormTextarea
              label="Nội dung phản bác *"
              value={counterForm.description}
              onChange={(e) =>
                setCounterForm({ ...counterForm, description: e.target.value })
              }
              maxLength={2000}
              rows={5}
              placeholder="Giải thích lý do bạn không đồng ý..."
            />
            <FileUploader
              files={counterFiles}
              onUpload={(file) =>
                handleUploadFile(file, setCounterFiles, counterFiles)
              }
              onRemove={(i) =>
                handleRemoveFile(i, setCounterFiles, counterFiles)
              }
              onUpdateNote={(i, note) =>
                handleUpdateFileNote(i, note, setCounterFiles, counterFiles)
              }
              uploading={uploading}
              max={3}
              label="FILE BẰNG CHỨNG PHẢN BÁC"
            />
            <ModalActions
              onCancel={() => setCounterModal(false)}
              submitLabel={counterSubmitting ? "Đang gửi..." : "Gửi phản bác"}
              submitting={counterSubmitting}
              submitColor="var(--do)"
            />
          </form>
        </Modal>
      )}

      {/* ===== MODAL EDIT (bổ sung) ===== */}
      {editModal && editingDispute && (
        <Modal
          title={
            user?.id === editingDispute.againstUser
              ? "Phản bác bổ sung."
              : "Cung cấp bằng chứng."
          }
          subtitle={`${editingDispute.disputeCode} · Đơn #${editingDispute.bookingId}`}
          onClose={() => setEditModal(false)}
        >
          {editError && <ErrorAlert message={editError} />}

          {editingDispute.adminRequest && (
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
                ⚠️ YÊU CẦU TỪ ADMIN
                {editingDispute.awaitingResponseFrom && (
                  <>
                    {" — "}
                    {editingDispute.awaitingResponseFrom === "RAISER"
                      ? "Bên A (người tạo)"
                      : editingDispute.awaitingResponseFrom === "AGAINST"
                        ? "Bên B (người bị kiện)"
                        : "Cả 2 bên"}
                  </>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif-2)",
                  fontStyle: "italic",
                  fontSize: "16px",
                }}
              >
                "{editingDispute.adminRequest}"
              </div>
            </div>
          )}

          {editingDispute.reviewDeadlineAt && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(201,169,97,0.15)",
                border: "1px solid var(--dong)",
                marginBottom: "20px",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "1px",
                color: "var(--dong)",
              }}
            >
              ⏰ Hạn bổ sung: {formatDate(editingDispute.reviewDeadlineAt)}
            </div>
          )}

          <form onSubmit={handleEditSubmit}>
            <FormTextarea
              label={
                user?.id === editingDispute.againstUser
                  ? "Nội dung phản bác *"
                  : "Mô tả chi tiết *"
              }
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              maxLength={2000}
              rows={5}
              placeholder={
                user?.id === editingDispute.againstUser
                  ? "Cập nhật nội dung phản bác chi tiết hơn..."
                  : "Cập nhật mô tả chi tiết hơn..."
              }
            />
            <FormTextarea
              label="Ghi chú thêm"
              value={editForm.userNote}
              onChange={(e) =>
                setEditForm({ ...editForm, userNote: e.target.value })
              }
              maxLength={500}
              rows={3}
              placeholder="Ví dụ: Đã upload file mới..."
            />

            {/* File cũ — hiển thị theo đúng vai trò */}
            {(() => {
              const isAgainstUser = user?.id === editingDispute.againstUser;
              const existingRaw = isAgainstUser
                ? editingDispute.counterEvidence
                : editingDispute.evidence;
              if (!existingRaw) return null;
              let existingFiles = [];
              try {
                existingFiles = JSON.parse(existingRaw);
              } catch (e) {}
              if (existingFiles.length === 0) return null;
              return (
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
                    FILE CŨ (đã gửi)
                  </div>
                  <FileList files={existingFiles} disabled />
                </div>
              );
            })()}

            <FileUploader
              files={editFiles}
              onUpload={(file) =>
                handleUploadFile(file, setEditFiles, editFiles)
              }
              onRemove={(i) => handleRemoveFile(i, setEditFiles, editFiles)}
              onUpdateNote={(i, note) =>
                handleUpdateFileNote(i, note, setEditFiles, editFiles)
              }
              uploading={uploading}
              max={3}
              label="FILE MỚI BỔ SUNG"
            />

            <ModalActions
              onCancel={() => setEditModal(false)}
              submitLabel={editSubmitting ? "Đang gửi..." : "Gửi bằng chứng"}
              submitting={editSubmitting}
              submitColor="var(--do)"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== COMPONENTS =====
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,12,0.6)",
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
          maxWidth: "620px",
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
          }}
        >
          ✕
        </button>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "32px",
            fontWeight: 900,
            marginBottom: subtitle ? "8px" : "32px",
            paddingRight: "48px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "var(--muc-mo)",
              marginBottom: "32px",
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function ErrorAlert({ message }) {
  return (
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
      {message}
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(201,169,97,0.1)",
        border: "1px solid var(--dong)",
        fontFamily: "var(--serif-2)",
        fontStyle: "italic",
        color: "var(--muc)",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function FormSelect({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={labelStyle}>{label}</label>
      <select {...props} style={inputStyle}>
        {children}
      </select>
    </div>
  );
}

function FormTextarea({ label, maxLength, rows = 4, ...props }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        {...props}
        rows={rows}
        maxLength={maxLength}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontFamily: "var(--serif-2)",
        }}
      />
      {maxLength && props.value !== undefined && (
        <div
          style={{
            textAlign: "right",
            fontFamily: "var(--mono)",
            fontSize: "10px",
            color: "var(--muc-mo)",
            marginTop: "4px",
          }}
        >
          {props.value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={labelStyle}>{label}</label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

function FileList({ files, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              background: "var(--kem)",
              border: "1px solid rgba(15,14,12,0.15)",
              textDecoration: "none",
              color: "var(--muc)",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: "22px" }}>
              {f.filename?.endsWith(".pdf")
                ? "📄"
                : f.filename?.match(/\.docx?$/i)
                  ? "📝"
                  : f.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? "🖼️"
                    : "📎"}
            </span>
            <span
              style={{
                fontFamily: "var(--serif-2)",
                fontSize: "14px",
                flex: 1,
                wordBreak: "break-all",
              }}
            >
              {f.filename || "File bằng chứng"}
            </span>
            {!disabled && (
              <span style={{ color: "var(--do)", fontSize: "14px" }}>↗</span>
            )}
          </a>

          {f.note && (
            <div
              style={{
                paddingLeft: "46px",
                fontFamily: "var(--serif-2)",
                fontStyle: "italic",
                fontSize: "13px",
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

function FileUploader({
  files,
  onUpload,
  onRemove,
  onUpdateNote,
  uploading,
  max = 3,
  label = "FILE BẰNG CHỨNG",
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={labelStyle}>
        {label} (tối đa {max} file — Word, PDF hoặc ảnh)
      </label>
      {files.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 1fr 30px",
                gap: "12px",
                alignItems: "center",
                padding: "10px",
                background: "var(--kem-dam)",
                border: "1px solid rgba(15,14,12,0.15)",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontSize: "26px", textAlign: "center" }}>
                {f.filename?.endsWith(".pdf")
                  ? "📄"
                  : f.filename?.match(/\.docx?$/i)
                    ? "📝"
                    : "🖼️"}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif-2)",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "2px",
                    wordBreak: "break-all",
                  }}
                >
                  {f.filename || "File bằng chứng"}
                </div>
                <input
                  type="text"
                  value={f.note || ""}
                  onChange={(e) => onUpdateNote(i, e.target.value)}
                  placeholder="Ghi chú (tùy chọn)"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    background: "var(--kem)",
                    border: "1px solid rgba(15,14,12,0.15)",
                    fontFamily: "var(--serif-2)",
                    fontSize: "13px",
                    outline: "none",
                    marginTop: "4px",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  width: "30px",
                  height: "30px",
                  background: "var(--do)",
                  color: "var(--kem)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {files.length < max && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "24px",
            border: "2px dashed rgba(15,14,12,0.2)",
            background: "var(--kem-dam)",
            cursor: uploading ? "wait" : "pointer",
            fontFamily: "var(--serif-2)",
            fontStyle: "italic",
            fontSize: "15px",
            color: "var(--muc-mo)",
          }}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
            style={{ display: "none" }}
            disabled={uploading}
          />
          <span style={{ fontSize: "24px" }}>📎</span>
          <span>
            {uploading ? "Đang upload..." : "Chọn file (Word, PDF hoặc ảnh)"}
          </span>
        </label>
      )}
    </div>
  );
}

function ModalActions({
  onCancel,
  submitLabel,
  submitting,
  submitColor = "var(--do)",
}) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        type="button"
        onClick={onCancel}
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
          background: submitColor,
          border: `1px solid ${submitColor}`,
          color: "var(--kem)",
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          cursor: submitting ? "wait" : "pointer",
        }}
      >
        {submitLabel}
      </button>
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
