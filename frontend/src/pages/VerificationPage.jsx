import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  uploadDocuments,
  submitForReview,
  getMyVerification,
} from '../services/verificationService'

const DOC_TYPES = [
  { key: 'GPLX_FRONT', label: 'GPLX — Mặt trước', required: true },
  { key: 'GPLX_BACK', label: 'GPLX — Mặt sau', required: true },
  { key: 'CCCD_FRONT', label: 'CCCD — Mặt trước', required: true },
  { key: 'CCCD_BACK', label: 'CCCD — Mặt sau', required: true },
  { key: 'SELFIE', label: 'Ảnh chân dung (selfie)', required: true },
]

const STATUS_MAP = {
  UNVERIFIED: { label: 'Chưa xác thực', color: 'var(--muc-mo)' },
  PENDING: { label: 'Chờ duyệt', color: 'var(--dong)' },
  VERIFIED: { label: 'Đã xác thực', color: 'var(--xanh-reu)' },
  REJECTED: { label: 'Bị từ chối', color: 'var(--do)' },
}

export default function VerificationPage() {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // files[type] = File object (chưa upload)
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})

  useEffect(() => {
    fetchVerification()
  }, [])

  const fetchVerification = async () => {
    try {
      const res = await getMyVerification()
      setVerification(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleFileSelect = (type, file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Ảnh vượt quá 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Chỉ chấp nhận file ảnh')
      return
    }

    setFiles((prev) => ({ ...prev, [type]: file }))
    const url = URL.createObjectURL(file)
    setPreviews((prev) => ({ ...prev, [type]: url }))
  }

  const handleRemove = (type) => {
    setFiles((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setPreviews((prev) => {
      if (prev[type]) URL.revokeObjectURL(prev[type])
      const next = { ...prev }
      delete next[type]
      return next
    })
  }

  const allFilesReady = DOC_TYPES.every((d) => files[d.key])

  const handleUploadAndSubmit = async () => {
    if (!allFilesReady) {
      showMessage('error', 'Vui lòng chọn đủ 5 ảnh')
      return
    }

    setUploading(true)
    try {
      const fileArray = DOC_TYPES.map((d) => files[d.key])
      const typeArray = DOC_TYPES.map((d) => d.key)

      await uploadDocuments(fileArray, typeArray)
      setUploading(false)

      setSubmitting(true)
      await submitForReview()
      showMessage('success', 'Đã gửi hồ sơ, chờ admin duyệt')
      setFiles({})
      setPreviews({})
      fetchVerification()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          Đang tải...
        </p>
      </div>
    )
  }

  const status = verification?.status || 'UNVERIFIED'
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.UNVERIFIED
  const canUpload = status === 'UNVERIFIED' || status === 'REJECTED'
  const busy = uploading || submitting

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Xác Thực
      </div>
      <h1
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 900,
          letterSpacing: '-2px',
          marginBottom: '16px',
        }}
      >
        Xác thực{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>tài khoản.</em>
      </h1>
      <p
        style={{
          fontFamily: 'var(--serif-2)',
          fontStyle: 'italic',
          fontSize: '18px',
          color: 'var(--muc-mo)',
          marginBottom: '32px',
        }}
      >
        Upload GPLX, CCCD và ảnh chân dung để có thể thuê xe tự lái.
      </p>

      {/* STATUS BADGE */}
      <div
        style={{
          padding: '20px 24px',
          background: 'var(--kem-dam)',
          border: `2px solid ${statusInfo.color}`,
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '2px',
              color: 'var(--muc-mo)',
              marginBottom: '6px',
            }}
          >
            TRẠNG THÁI HIỆN TẠI
          </div>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '24px',
              fontWeight: 700,
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </div>
        </div>
        {status === 'REJECTED' && verification?.rejectionReason && (
          <div
            style={{
              maxWidth: '400px',
              padding: '12px 16px',
              background: 'rgba(139,44,44,0.1)',
              borderLeft: '3px solid var(--do)',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--do)',
            }}
          >
            <strong>Lý do:</strong> {verification.rejectionReason}
          </div>
        )}
      </div>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            background:
              message.type === 'success'
                ? 'rgba(74,93,63,0.1)'
                : 'rgba(139,44,44,0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)'}`,
            color: message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
          }}
        >
          {message.text}
        </div>
      )}

      {/* VERIFIED */}
      {status === 'VERIFIED' && (
        <div
          style={{
            padding: '40px',
            background: 'rgba(74,93,63,0.08)',
            border: '2px solid var(--xanh-reu)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--xanh-reu)',
              marginBottom: '12px',
            }}
          >
            Tài khoản đã được xác thực
          </h2>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
              marginBottom: '24px',
            }}
          >
            Bạn có thể đặt xe tự lái ngay bây giờ.
          </p>
          <Link
            to="/search"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'var(--muc)',
              color: 'var(--kem)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Khám phá bộ sưu tập →
          </Link>
        </div>
      )}

      {/* PENDING */}
      {status === 'PENDING' && (
        <div
          style={{
            padding: '40px',
            background: 'rgba(201,169,97,0.08)',
            border: '2px solid var(--dong)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--dong)',
              marginBottom: '12px',
            }}
          >
            Hồ sơ đang chờ duyệt
          </h2>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
            }}
          >
            Admin sẽ xem xét hồ sơ của bạn trong vòng 72 giờ.
          </p>
          {verification?.documents && verification.documents.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  color: 'var(--muc-mo)',
                  marginBottom: '12px',
                }}
              >
                ĐÃ UPLOAD {verification.documents.length} ẢNH
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  maxWidth: '500px',
                  margin: '0 auto',
                }}
              >
                {verification.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      aspectRatio: '1',
                      border: '1px solid var(--muc-mo)',
                      background: `url(${d.documentUrl}) center/cover`,
                      display: 'block',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD FORM (UNVERIFIED or REJECTED) */}
      {canUpload && (
        <div>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            {status === 'REJECTED' ? 'Upload lại hồ sơ' : 'Upload hồ sơ'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {DOC_TYPES.map((doc) => (
              <div key={doc.key}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'var(--muc-mo)',
                    marginBottom: '8px',
                  }}
                >
                  {doc.label} *
                </label>
                {previews[doc.key] ? (
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      border: '1px solid var(--dong)',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={previews[doc.key]}
                      alt={doc.label}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(doc.key)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        background: 'var(--do)',
                        color: 'var(--kem)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '4/3',
                      border: '2px dashed rgba(15,14,12,0.3)',
                      background: 'var(--kem-dam)',
                      cursor: 'pointer',
                      fontFamily: 'var(--serif-2)',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: 'var(--muc-mo)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--dong)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(15,14,12,0.3)'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleFileSelect(doc.key, e.target.files[0])
                        e.target.value = ''
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>
                      📷
                    </span>
                    <span>Chọn ảnh</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(201,169,97,0.1)',
              borderLeft: '3px solid var(--dong)',
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--muc-mo)',
              marginBottom: '24px',
            }}
          >
            ⚠️ Lưu ý: Ảnh rõ nét, không bị mờ, kích thước tối đa 5MB/ảnh. Hồ sơ
            đầy đủ 5 ảnh mới có thể gửi duyệt.
          </div>

          <button
            type="button"
            onClick={handleUploadAndSubmit}
            disabled={!allFilesReady || busy}
            style={{
              width: '100%',
              padding: '20px',
              background:
                !allFilesReady || busy ? 'var(--muc-mo)' : 'var(--do)',
              color: 'var(--kem)',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: !allFilesReady || busy ? 'not-allowed' : 'pointer',
              opacity: !allFilesReady || busy ? 0.6 : 1,
            }}
          >
            {uploading
              ? 'Đang upload ảnh...'
              : submitting
                ? 'Đang gửi hồ sơ...'
                : allFilesReady
                  ? 'Gửi hồ sơ'
                  : `Cần thêm ${DOC_TYPES.length - Object.keys(files).length} ảnh`}
          </button>
        </div>
      )}
    </div>
  )
}