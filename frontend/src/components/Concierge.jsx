import { useState } from 'react'
import { sendChatMessage } from '../services/aiService'

export default function Concierge() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Xin chào! Tôi là trợ lý AI của MAISON. Bạn cần gì ạ?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await sendChatMessage(input)
      setMessages(prev => [...prev, { role: 'bot', content: response.reply || 'Xin lỗi, tôi không hiểu.' }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Xin lỗi, AI đang bận. Thử lại sau ạ.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="concierge">
        <div className="concierge-label">Trợ lý · đêm ngày</div>
        <button className="concierge-btn" onClick={() => setOpen(!open)} aria-label="Chat">
          <span className="notif-dot"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 4 6 Q 4 4, 6 4 L 18 4 Q 20 4, 20 6 L 20 16 Q 20 18, 18 18 L 10 18 L 6 22 L 6 18 Q 4 18, 4 16 Z"/>
            <circle cx="9" cy="11" r="1" fill="currentColor"/>
            <circle cx="12" cy="11" r="1" fill="currentColor"/>
            <circle cx="15" cy="11" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '110px',
          right: '32px',
          width: '380px',
          height: '500px',
          background: 'var(--kem)',
          border: '1px solid var(--muc)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(15,14,12,0.1)',
            fontFamily: 'var(--serif)',
            fontSize: '20px',
            fontWeight: 700
          }}>
            Trợ lý MAISON
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: '16px',
                textAlign: msg.role === 'user' ? 'right' : 'left'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '10px 14px',
                  background: msg.role === 'user' ? 'var(--muc)' : 'var(--kem-dam)',
                  color: msg.role === 'user' ? 'var(--kem)' : 'var(--muc)',
                  fontFamily: 'var(--serif-2)',
                  fontSize: '15px',
                  maxWidth: '80%',
                  textAlign: 'left'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontStyle: 'italic', color: 'var(--muc-mo)' }}>Đang trả lời...</div>}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid rgba(15,14,12,0.1)', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi trợ lý..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid rgba(15,14,12,0.2)',
                background: 'var(--kem-dam)',
                fontFamily: 'var(--serif-2)',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button onClick={handleSend} disabled={loading} style={{
              padding: '10px 16px',
              background: 'var(--muc)',
              color: 'var(--kem)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '2px'
            }}>
              GỬI
            </button>
          </div>
        </div>
      )}
    </>
  )
}