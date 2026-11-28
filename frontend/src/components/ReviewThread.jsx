import { useState } from 'react'
import api from '../services/api'
import { useDialog } from '../context/dialogCore'

const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : ''

/**
 * Luồng hội thoại nhiều lượt giữa khách và chủ xe dưới một đánh giá.
 * review.replies: luồng do backend dựng sẵn (đã gộp owner_reply / customer_reply cũ, sắp theo thời gian).
 * viewerRole: 'CUSTOMER' | 'OWNER' — người xem có quyền nhắn; bỏ trống = chỉ xem (trang xe công khai, admin).
 * onRepliesChange(replies): gọi sau khi gửi thành công với luồng mới từ server.
 */
export default function ReviewThread({ review, viewerRole, onRepliesChange, background = 'var(--kem)', inputBackground = 'var(--kem-dam)', collapsibleCompose = false }) {
  const { alert: dialogAlert } = useDialog()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // collapsibleCompose: ẩn ô soạn sau một nút (dùng cho trang danh sách nhiều đánh giá)
  const [composeOpen, setComposeOpen] = useState(!collapsibleCompose)

  const thread = review?.replies || []
  const ownerHasReplied = thread.some(m => m.authorRole === 'OWNER')
  // Khách chỉ được nhắn sau khi chủ xe đã phản hồi ít nhất một lần
  const canCompose = viewerRole === 'OWNER' || (viewerRole === 'CUSTOMER' && ownerHasReplied)

  const labelFor = (m) => {
    const mine = m.authorRole === viewerRole
    if (m.authorRole === 'OWNER') return mine ? 'Phản hồi của bạn' : 'Phản hồi của chủ xe'
    return mine ? 'Trả lời của bạn' : 'Khách trả lời'
  }

  const handleSend = async () => {
    const content = text.trim()
    if (!content || !review?.id) return
    if (content.length > 1000) {
      dialogAlert({ title: 'Không gửi được', message: 'Phản hồi không quá 1000 ký tự', variant: 'danger' })
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post(`/reviews/${review.id}/replies`, { content })
      onRepliesChange?.(res.data?.data || [])
      setText('')
      if (collapsibleCompose) setComposeOpen(false)
    } catch (err) {
      dialogAlert({
        title: 'Gửi phản hồi thất bại',
        message: err.response?.data?.message || err.message,
        variant: 'danger'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {thread.map((m, idx) => {
        const isOwner = m.authorRole === 'OWNER'
        return (
          <div
            key={m.id != null ? `r-${m.id}` : `legacy-${idx}`}
            style={{
              marginTop: idx === 0 ? 0 : '12px',
              marginLeft: isOwner ? 0 : '24px',
              padding: '12px 16px',
              background,
              borderLeft: `3px solid ${isOwner ? 'var(--muc)' : 'var(--dong)'}`
            }}
          >
            <div style={labelStyle}>
              {labelFor(m)}{m.createdAt ? ` · ${formatDateTime(m.createdAt)}` : ''}
            </div>
            <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muc)', whiteSpace: 'pre-wrap' }}>
              "{m.content}"
            </div>
          </div>
        )
      })}

      {canCompose && !composeOpen ? (
        <div style={{ marginTop: thread.length ? '14px' : 0 }}>
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            style={{ padding: '4px 12px', background: 'transparent', border: '1px dashed var(--muc-mo)', color: 'var(--muc)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {thread.length ? '↩ Trả lời tiếp' : '+ Phản hồi đánh giá'}
          </button>
        </div>
      ) : canCompose ? (
        <div style={{ marginTop: thread.length ? '14px' : 0, background, padding: '16px', border: '1px solid rgba(15,14,12,0.2)' }}>
          <textarea
            rows={3}
            maxLength={1000}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={viewerRole === 'OWNER' ? 'Viết phản hồi cho khách hàng...' : 'Trả lời chủ xe...'}
            style={{ width: '100%', padding: '10px', fontFamily: 'var(--serif-2)', fontSize: '14px', border: '1px solid rgba(15,14,12,0.2)', background: inputBackground, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleSend}
              disabled={submitting || !text.trim()}
              style={{ padding: '6px 16px', background: 'var(--muc)', color: 'var(--kem)', border: 'none', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: submitting ? 'wait' : 'pointer', opacity: !text.trim() ? 0.5 : 1 }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
            {collapsibleCompose && (
              <button
                type="button"
                onClick={() => { setComposeOpen(false); setText('') }}
                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(15,14,12,0.3)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Hủy
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muc-mo)' }}>
              {text.length}/1000
            </span>
          </div>
        </div>
      ) : viewerRole === 'CUSTOMER' ? (
        <div style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muc-mo)' }}>
          Chủ xe chưa phản hồi đánh giá này.
        </div>
      ) : null}
    </div>
  )
}

const labelStyle = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '4px'
}
