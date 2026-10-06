import { useState, useEffect } from 'react'
import {
  getAllConfigs,
  updateConfig,
  createConfig,
} from '../services/configService'

// ===== METADATA cho 8 config có sẵn (để hiển thị đẹp) =====
const CONFIG_META = {
  commission_rate: {
    label: 'Hoa hồng nền tảng',
    unit: '%',
    hint: 'Phần trăm nền tảng thu từ mỗi đơn hàng hoàn tất',
    min: 0,
    max: 100,
  },
  min_withdrawal: {
    label: 'Số tiền rút tối thiểu',
    unit: 'đ',
    hint: 'Số tiền nhỏ nhất chủ xe có thể yêu cầu rút',
    min: 0,
  },
  withdrawal_fee: {
    label: 'Phí rút tiền',
    unit: 'đ',
    hint: 'Phí xử lý cho mỗi yêu cầu rút (0 = miễn phí)',
    min: 0,
  },
  default_deposit_percent: {
    label: 'Tỷ lệ cọc mặc định',
    unit: '%',
    hint: 'Phần trăm tiền cọc so với tổng giá trị đơn',
    min: 0,
    max: 100,
  },
  default_overage_km_price: {
    label: 'Phí vượt km',
    unit: 'đ/km',
    hint: 'Phí cho mỗi km vượt quá định mức',
    min: 0,
  },
  default_late_fee_per_hour: {
    label: 'Phí trả xe muộn',
    unit: 'đ/giờ',
    hint: 'Phí cho mỗi giờ trả xe muộn',
    min: 0,
  },
  support_hotline: {
    label: 'Hotline hỗ trợ',
    unit: '',
    hint: 'Số điện thoại hỗ trợ khách hàng 24/7',
    type: 'text',
  },
  support_email: {
    label: 'Email hỗ trợ',
    unit: '',
    hint: 'Địa chỉ email liên hệ hỗ trợ',
    type: 'email',
  },
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  // ===== EDIT STATE — map[configKey] = value đang edit =====
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState({}) // map[configKey] = bool

  // ===== CREATE MODAL =====
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    key: '',
    value: '',
    type: 'STRING',
    description: '',
  })
  const [createError, setCreateError] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // ===== FETCH =====
  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await getAllConfigs()
      const list = res.data || []
      setConfigs(list)
      // Init edits = giá trị hiện tại
      const initEdits = {}
      list.forEach((c) => {
        initEdits[c.configKey] = c.configValue
      })
      setEdits(initEdits)
    } catch (err) {
      console.error(err)
      showMessage('error', 'Không tải được cấu hình')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // ===== VALIDATE theo configType =====
  const validateValue = (config, value) => {
    const meta = CONFIG_META[config.configKey] || {}

    if (value === '' || value === null || value === undefined) {
      return 'Giá trị không được để trống'
    }

    const type = config.configType || meta.type || 'STRING'

    if (type === 'NUMBER') {
      const num = Number(value)
      if (isNaN(num)) return 'Phải là số'
      if (meta.min !== undefined && num < meta.min) {
        return `Giá trị tối thiểu là ${meta.min}`
      }
      if (meta.max !== undefined && num > meta.max) {
        return `Giá trị tối đa là ${meta.max}`
      }
    }

    if (type === 'BOOLEAN') {
      const lower = String(value).toLowerCase()
      if (!['true', 'false'].includes(lower)) {
        return 'Phải là true hoặc false'
      }
    }

    if (type === 'JSON') {
      try {
        JSON.parse(value)
      } catch (e) {
        return 'JSON không hợp lệ'
      }
    }

    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email không đúng định dạng'
      }
    }

    return null
  }

  // ===== SAVE 1 CONFIG =====
  const handleSave = async (config) => {
    const newValue = edits[config.configKey]

    // Không đổi thì skip
    if (String(newValue) === String(config.configValue)) {
      return
    }

    // Validate
    const err = validateValue(config, newValue)
    if (err) {
      showMessage('error', `${config.configKey}: ${err}`)
      return
    }

    setSaving((prev) => ({ ...prev, [config.configKey]: true }))
    try {
      await updateConfig(config.configKey, String(newValue))
      showMessage('success', `Đã cập nhật "${getLabel(config.configKey)}"`)

      // Update local state
      setConfigs((prev) =>
        prev.map((c) =>
          c.configKey === config.configKey
            ? { ...c, configValue: String(newValue) }
            : c
        )
      )
    } catch (err) {
      showMessage(
        'error',
        err.response?.data?.message || 'Cập nhật thất bại'
      )
      // Revert edit
      setEdits((prev) => ({
        ...prev,
        [config.configKey]: config.configValue,
      }))
    } finally {
      setSaving((prev) => ({ ...prev, [config.configKey]: false }))
    }
  }

  // ===== RESET 1 CONFIG =====
  const handleReset = (config) => {
    setEdits((prev) => ({
      ...prev,
      [config.configKey]: config.configValue,
    }))
  }

  // ===== CREATE =====
  const openCreateModal = () => {
    setCreateForm({ key: '', value: '', type: 'STRING', description: '' })
    setCreateError('')
    setCreateModal(true)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateError('')

    if (!createForm.key.trim()) {
      return setCreateError('Key không được để trống')
    }
    if (!/^[a-z0-9_]+$/.test(createForm.key.trim())) {
      return setCreateError(
        'Key chỉ chứa chữ thường, số và dấu gạch dưới (a-z, 0-9, _)'
      )
    }
    if (!createForm.value.trim()) {
      return setCreateError('Giá trị không được để trống')
    }

    setCreateSubmitting(true)
    try {
      await createConfig(
        createForm.key.trim(),
        createForm.value.trim(),
        createForm.type,
        createForm.description.trim() || null
      )
      showMessage('success', `Đã tạo config "${createForm.key}"`)
      setCreateModal(false)
      fetchConfigs()
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // ===== HELPERS =====
  const getLabel = (key) => CONFIG_META[key]?.label || key
  const getHint = (key) => CONFIG_META[key]?.hint || ''
  const getUnit = (key) => CONFIG_META[key]?.unit || ''
  const getInputType = (config) => {
    const meta = CONFIG_META[config.configKey] || {}
    if (meta.type === 'email') return 'email'
    if (meta.type === 'text') return 'text'
    if (config.configType === 'NUMBER') return 'number'
    return 'text'
  }

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  // ===== TÍNH dirty =====
  const isDirty = (config) =>
    String(edits[config.configKey]) !== String(config.configValue)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px' }}>
      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Quản Trị — Cấu Hình
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              margin: 0,
            }}
          >
            Cấu{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>hình.</em>
          </h1>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
              marginTop: '12px',
              margin: 0,
            }}
          >
            Điều chỉnh các tham số vận hành của nền tảng.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            padding: '14px 28px',
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
          + Thêm config mới
        </button>
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
            border: `1px solid ${
              message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)'
            }`,
            color:
              message.type === 'success' ? 'var(--xanh-reu)' : 'var(--do)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
          }}
        >
          {message.text}
        </div>
      )}

      {/* ===== LIST ===== */}
      {loading ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            padding: '40px',
          }}
        >
          Đang tải...
        </p>
      ) : configs.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
            padding: '40px',
            color: 'var(--muc-mo)',
          }}
        >
          Chưa có cấu hình nào.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '20px',
          }}
        >
          {configs.map((c) => {
            const dirty = isDirty(c)
            const isSaving = saving[c.configKey]

            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--kem-dam)',
                  border: `1px solid ${
                    dirty ? 'var(--do)' : 'rgba(15,14,12,0.15)'
                  }`,
                  padding: '24px',
                  transition: 'border-color 0.3s',
                }}
              >
                {/* LABEL */}
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {getLabel(c.configKey)}
                </div>

                {/* KEY CODE */}
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                    color: 'var(--muc-mo)',
                    marginBottom: '8px',
                  }}
                >
                  {c.configKey}
                  {c.configType && c.configType !== 'STRING' && (
                    <span
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: 'var(--muc)',
                        color: 'var(--kem)',
                        fontSize: '9px',
                      }}
                    >
                      {c.configType}
                    </span>
                  )}
                </div>

                {/* HINT */}
                {getHint(c.configKey) && (
                  <div
                    style={{
                      fontFamily: 'var(--serif-2)',
                      fontStyle: 'italic',
                      fontSize: '13px',
                      color: 'var(--muc-mo)',
                      marginBottom: '16px',
                      lineHeight: 1.5,
                    }}
                  >
                    {getHint(c.configKey)}
                  </div>
                )}

                {/* INPUT */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    alignItems: 'stretch',
                  }}
                >
                  <input
                    type={getInputType(c)}
                    value={edits[c.configKey] ?? ''}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [c.configKey]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(c)
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: 'var(--kem)',
                      border: `1px solid ${
                        dirty ? 'var(--do)' : 'rgba(15,14,12,0.2)'
                      }`,
                      fontFamily: 'var(--mono)',
                      fontSize: '16px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {getUnit(c.configKey) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 14px',
                        background: 'var(--kem)',
                        border: '1px solid rgba(15,14,12,0.2)',
                        borderLeft: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: '13px',
                        color: 'var(--muc-mo)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getUnit(c.configKey)}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(15,14,12,0.1)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      letterSpacing: '1px',
                      color: 'var(--muc-mo)',
                    }}
                  >
                    Cập nhật: {formatDate(c.updatedAt)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => handleReset(c)}
                        style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          border: '1px solid var(--muc-mo)',
                          color: 'var(--muc-mo)',
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave(c)}
                      disabled={!dirty || isSaving}
                      style={{
                        padding: '8px 18px',
                        background: !dirty
                          ? 'var(--muc-mo)'
                          : isSaving
                            ? 'var(--muc-mo)'
                            : 'var(--do)',
                        border: 'none',
                        color: 'var(--kem)',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: !dirty || isSaving ? 'not-allowed' : 'pointer',
                        opacity: !dirty ? 0.5 : 1,
                      }}
                    >
                      {isSaving ? '...' : dirty ? '✓ Lưu' : 'Đã lưu'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {createModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,14,12,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--kem)',
              border: '1px solid var(--muc)',
              maxWidth: '520px',
              width: '100%',
              padding: '48px',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: '1px solid var(--muc)',
                color: 'var(--muc)',
                fontFamily: 'var(--mono)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                marginBottom: '8px',
                paddingRight: '48px',
              }}
            >
              Thêm config mới.
            </h2>
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'var(--muc-mo)',
                marginBottom: '24px',
              }}
            >
              CHỈ DÀNH CHO ADMIN
            </p>

            {createError && (
              <div
                style={{
                  background: 'rgba(139,44,44,0.1)',
                  border: '1px solid var(--do)',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: 'var(--do)',
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Key *</label>
                <input
                  type="text"
                  value={createForm.key}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, key: e.target.value })
                  }
                  placeholder="my_new_config"
                  style={inputStyle}
                />
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: 'var(--muc-mo)',
                    marginTop: '4px',
                  }}
                >
                  Chỉ a-z, 0-9, dấu gạch dưới
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Giá trị *</label>
                <input
                  type="text"
                  value={createForm.value}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, value: e.target.value })
                  }
                  placeholder="100000"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Kiểu dữ liệu</label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="STRING">STRING</option>
                  <option value="NUMBER">NUMBER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Mô tả</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  maxLength={255}
                  placeholder="Mô tả ngắn về config này..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  style={{
                    flex: 2,
                    padding: '16px',
                    background: 'var(--muc)',
                    border: 'none',
                    color: 'var(--kem)',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: createSubmitting ? 'wait' : 'pointer',
                  }}
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== STYLES =====
const labelStyle = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '3px',
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