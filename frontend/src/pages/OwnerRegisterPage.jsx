import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  submitOwnerRequest,
  uploadOwnerDocuments,
  getMyOwnerRequest,
} from '../services/ownerRegistrationService'

const BANKS = [
  'Vietcombank', 'Techcombank', 'BIDV', 'VietinBank', 'MB Bank',
  'VPBank', 'ACB', 'Sacombank', 'TPBank', 'Agribank',
  'SHB', 'Eximbank', 'HDBank', 'VIB', 'LienVietPostBank',
]

const DOC_TYPES = [
  { key: 'CCCD_FRONT', label: 'CCCD — Mặt trước' },
  { key: 'CCCD_BACK', label: 'CCCD — Mặt sau' },
  { key: 'GPLX_FRONT', label: 'GPLX — Mặt trước' },
  { key: 'GPLX_BACK', label: 'GPLX — Mặt sau' },
  { key: 'SELFIE', label: 'Selfie cầm CCCD' },
]

export default function OwnerRegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [existingRequest, setExistingRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    cccd: '',
    cccdIssuedDate: '',
    cccdIssuedPlace: '',
    bankName: 'Vietcombank',
    bankAccount: '',
    accountHolder: '',
    agreeTerms: false,
    agreePrivacy: false,
    confirmAccuracy: false,
  })

  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [requestId, setRequestId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ===== LOAD EXISTING REQUEST =====
  useEffect(() => {
    getMyOwnerRequest()
      .then((res) => {
        if (res.data) {
          setExistingRequest(res.data)
          setRequestId(res.data.id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleFileSelect = (type, file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh vượt quá 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh')
      return
    }
    setFiles((prev) => ({ ...prev, [type]: file }))
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }))
    setError('')
  }

  const handleRemoveFile = (type) => {
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

  // ===== VALIDATE TỪNG BƯỚC =====
  const validateStep = (s) => {
    setError('')
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.length < 2) {
        return 'Vui lòng nhập họ tên (≥2 ký tự)'
      }
      if (!form.dateOfBirth) return 'Vui lòng chọn ngày sinh'
      const age = new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear()
      if (age < 18) return 'Bạn phải đủ 18 tuổi'
      if (!form.address.trim() || form.address.length < 10) {
        return 'Địa chỉ phải từ 10 ký tự'
      }
      if (!/^[0-9]{12}$/.test(form.cccd)) return 'Số CCCD phải là 12 chữ số'
      if (!form.cccdIssuedDate) return 'Vui lòng chọn ngày cấp CCCD'
      if (new Date(form.cccdIssuedDate) > new Date()) {
        return 'Ngày cấp CCCD không được trong tương lai'
      }
      if (!form.cccdIssuedPlace.trim() || form.cccdIssuedPlace.length < 5) {
        return 'Nơi cấp phải từ 5 ký tự'
      }
    }
    if (s === 2) {
      if (!form.bankName) return 'Vui lòng chọn ngân hàng'
      if (!/^[0-9]{8,20}$/.test(form.bankAccount)) {
        return 'Số tài khoản phải từ 8-20 chữ số'
      }
      if (!form.accountHolder.trim()) return 'Vui lòng nhập chủ tài khoản'
    }
    if (s === 4) {
      if (!form.agreeTerms) return 'Vui lòng đồng ý điều khoản dịch vụ'
      if (!form.agreePrivacy) return 'Vui lòng đồng ý chính sách bảo mật'
      if (!form.confirmAccuracy) return 'Vui lòng cam kết thông tin chính xác'
    }
    return null
  }

  const nextStep = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
  }

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    const err = validateStep(4)
    if (err) {
      setError(err)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      // Bước 1: Tạo request (nếu chưa có)
      let rid = requestId
      if (!rid) {
        const res = await submitOwnerRequest(form)
        rid = res.data.id
        setRequestId(rid)
      }

      // Bước 2: Upload 5 ảnh
      const fileArray = DOC_TYPES.map((d) => files[d.key])
      const typeArray = DOC_TYPES.map((d) => d.key)
      await uploadOwnerDocuments(rid, fileArray, typeArray)

      // Bước 3: Hiển thị message thành công
      setSuccess('Đã gửi yêu cầu đăng ký chủ xe! Vui lòng chờ Admin duyệt.')

      // ★ FIX CÁCH B: Fetch lại data để hiển thị card "Chờ duyệt" (không navigate)
      setTimeout(async () => {
        try {
          const refreshRes = await getMyOwnerRequest()
          if (refreshRes.data) {
            setExistingRequest(refreshRes.data)
            setRequestId(refreshRes.data.id)
          }
          setSuccess('')
        } catch (refreshErr) {
          console.error('Failed to refresh:', refreshErr)
        }
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>Đang tải...</p>
      </div>
    )
  }

  // ===== ĐÃ CÓ REQUEST =====
  if (existingRequest) {
    const statusMap = {
      PENDING: { label: 'Chờ duyệt', color: 'var(--dong)' },
      APPROVED: { label: 'Đã duyệt', color: 'var(--xanh-reu)' },
      REJECTED: { label: 'Bị từ chối', color: 'var(--do)' },
    }
    const st = statusMap[existingRequest.status] || statusMap.PENDING

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 48px' }}>
        <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đăng Ký Chủ Xe</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '40px' }}>
          Trạng thái <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>yêu cầu.</em>
        </h1>

        <div style={{
          padding: '32px',
          background: 'var(--kem-dam)',
          border: `2px solid ${st.color}`,
          marginBottom: '32px',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muc-mo)', marginBottom: '12px' }}>
            YÊU CẦU #{existingRequest.id} · {new Date(existingRequest.createdAt).toLocaleString('vi-VN')}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 900, color: st.color, marginBottom: '16px' }}>
            {st.label}
          </div>

          {existingRequest.status === 'APPROVED' && (
            <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muc-mo)' }}>
              Chúc mừng! Bạn đã trở thành chủ xe. Vui lòng <strong>đăng xuất và đăng nhập lại</strong> để thấy menu mới.
            </p>
          )}

          {existingRequest.status === 'PENDING' && (
            <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muc-mo)' }}>
              Admin sẽ xem xét hồ sơ của bạn. Vui lòng chờ.
            </p>
          )}

          {existingRequest.status === 'REJECTED' && (
            <div style={{ padding: '16px', background: 'rgba(139,44,44,0.1)', borderLeft: '3px solid var(--do)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--do)', marginBottom: '6px' }}>
                LÝ DO TỪ CHỐI
              </div>
              <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '15px' }}>
                {existingRequest.rejectionReason}
              </div>
            </div>
          )}
        </div>

        {existingRequest.status === 'REJECTED' && (
          <button
            onClick={() => {
              setExistingRequest(null)
              setRequestId(null)
              setFiles({})
              setPreviews({})
              setForm({
                fullName: existingRequest.fullName || '',
                dateOfBirth: existingRequest.dateOfBirth || '',
                gender: existingRequest.gender || 'MALE',
                address: existingRequest.address || '',
                cccd: existingRequest.cccd || '',
                cccdIssuedDate: existingRequest.cccdIssuedDate || '',
                cccdIssuedPlace: existingRequest.cccdIssuedPlace || '',
                bankName: existingRequest.bankName || 'Vietcombank',
                bankAccount: existingRequest.bankAccount || '',
                accountHolder: existingRequest.accountHolder || '',
                agreeTerms: false,
                agreePrivacy: false,
                confirmAccuracy: false,
              })
              setStep(1)
            }}
            style={{
              padding: '16px 32px',
              background: 'var(--do)',
              color: 'var(--kem)',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Gửi lại yêu cầu
          </button>
        )}
      </div>
    )
  }

  // ===== FORM 4 BƯỚC =====
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>Chương Đăng Ký Chủ Xe</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '12px' }}>
        Đăng ký <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>chủ xe.</em>
      </h1>
      <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muc-mo)', marginBottom: '40px' }}>
        Hoàn thành 4 bước để gửi yêu cầu cho Admin duyệt.
      </p>

      {/* STEP INDICATOR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              padding: '12px',
              textAlign: 'center',
              background: s === step ? 'var(--muc)' : s < step ? 'var(--xanh-reu)' : 'var(--kem-dam)',
              color: s <= step ? 'var(--kem)' : 'var(--muc-mo)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
            }}
          >
            BƯỚC {s}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(139,44,44,0.1)', border: '1px solid var(--do)', padding: '12px 16px', marginBottom: '24px', color: 'var(--do)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(74,93,63,0.1)', border: '1px solid var(--xanh-reu)', padding: '12px 16px', marginBottom: '24px', color: 'var(--xanh-reu)', fontFamily: 'var(--serif-2)', fontStyle: 'italic' }}>
          {success}
        </div>
      )}

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
            Thông tin cá nhân
          </h2>

          <Field label="Họ tên *" name="fullName" value={form.fullName} onChange={handleChange} />
          <Field label="Ngày sinh *" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Giới tính *</label>
            <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <Field label="Địa chỉ thường trú *" name="address" value={form.address} onChange={handleChange} />
          <Field label="Số CCCD (12 số) *" name="cccd" value={form.cccd} onChange={handleChange} />
          <Field label="Ngày cấp CCCD *" name="cccdIssuedDate" type="date" value={form.cccdIssuedDate} onChange={handleChange} />
          <Field label="Nơi cấp CCCD *" name="cccdIssuedPlace" value={form.cccdIssuedPlace} onChange={handleChange} />
        </>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
            Thông tin ngân hàng
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Tên ngân hàng *</label>
            <select name="bankName" value={form.bankName} onChange={handleChange} style={inputStyle}>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <Field label="Số tài khoản *" name="bankAccount" value={form.bankAccount} onChange={handleChange} />
          <Field label="Chủ tài khoản (viết hoa không dấu) *" name="accountHolder" value={form.accountHolder} onChange={handleChange} />
        </>
      )}

      {/* ===== STEP 3 ===== */}
      {step === 3 && (
        <>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
            Upload 5 ảnh giấy tờ
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {DOC_TYPES.map((doc) => (
              <div key={doc.key}>
                <label style={labelStyle}>{doc.label} *</label>
                {previews[doc.key] ? (
                  <div style={{ position: 'relative', aspectRatio: '4/3', border: '1px solid var(--dong)', overflow: 'hidden' }}>
                    <img src={previews[doc.key]} alt={doc.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(doc.key)}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '26px', height: '26px', background: 'var(--do)', color: 'var(--kem)', border: 'none', cursor: 'pointer', fontSize: '14px' }}
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
                    <span style={{ fontSize: '28px', marginBottom: '4px' }}>📷</span>
                    <span>Chọn ảnh</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== STEP 4 ===== */}
      {step === 4 && (
        <>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
            Điều khoản & Cam kết
          </h2>

          <div style={{ padding: '20px', background: 'var(--kem-dam)', border: '1px solid rgba(15,14,12,0.15)', marginBottom: '24px' }}>
            <CheckboxField
              name="agreeTerms"
              checked={form.agreeTerms}
              onChange={handleChange}
              label="Tôi đồng ý với Điều khoản dịch vụ của MAISON"
            />
            <CheckboxField
              name="agreePrivacy"
              checked={form.agreePrivacy}
              onChange={handleChange}
              label="Tôi đồng ý với Chính sách bảo mật"
            />
            <CheckboxField
              name="confirmAccuracy"
              checked={form.confirmAccuracy}
              onChange={handleChange}
              label="Tôi cam kết các thông tin trên là chính xác"
            />
          </div>

          <div style={{ padding: '16px', background: 'rgba(201,169,97,0.1)', borderLeft: '3px solid var(--dong)', fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muc-mo)' }}>
            ⚠️ Sau khi gửi, bạn không thể sửa thông tin. Vui lòng kiểm tra kỹ.
          </div>
        </>
      )}

      {/* ===== NAVIGATION ===== */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: '1px solid var(--muc)',
              color: 'var(--muc)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            ← Quay lại
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            style={{
              flex: 2,
              padding: '16px',
              background: 'var(--muc)',
              color: 'var(--kem)',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !allFilesReady}
            style={{
              flex: 2,
              padding: '16px',
              background: submitting || !allFilesReady ? 'var(--muc-mo)' : 'var(--do)',
              color: 'var(--kem)',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: submitting || !allFilesReady ? 'not-allowed' : 'pointer',
              opacity: submitting || !allFilesReady ? 0.5 : 1,
            }}
          >
            {submitting ? 'Đang gửi...' : !allFilesReady ? 'Chưa đủ 5 ảnh' : 'Gửi yêu cầu'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Field({ label, name, type = 'text', value, onChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} style={inputStyle} />
    </div>
  )
}

function CheckboxField({ name, checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      fontFamily: 'var(--serif-2)',
      fontSize: '15px',
      cursor: 'pointer',
    }}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      {label}
    </label>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '8px',
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--kem-dam)',
  border: '1px solid rgba(15,14,12,0.2)',
  fontFamily: 'var(--serif-2)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
}