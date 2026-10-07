import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SignatureCanvas from '../components/SignatureCanvas'
import {
  getHandoverById,
  signHandover,
  uploadSignature,
} from '../services/handoverService'
import { useAuth } from '../hooks/useAuth'

export default function HandoverPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [handover, setHandover] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [signatureData, setSignatureData] = useState(null)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [msg, setMsg] = useState('')

  // ===== ĐIỀU HƯỚNG NÚT "VỀ" THEO ROLE =====
  const getBackInfo = () => {
    if (user?.role === 'OWNER') {
      return { path: '/owner/bookings', label: 'Về đơn hàng' }
    }
    if (user?.role === 'ADMIN') {
      return { path: '/admin/dashboard', label: 'Về quản trị' }
    }
    return { path: '/my-bookings', label: 'Về chuyến đi' }
  }

  const backInfo = getBackInfo()

  // ===== LOAD =====
  useEffect(() => {
    loadHandover()
  }, [id])

  const loadHandover = async () => {
    setLoading(true)
    try {
      const res = await getHandoverById(id)
      setHandover(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được biên bản')
    } finally {
      setLoading(false)
    }
  }

  // ===== KÝ =====
  const handleSign = async (role) => {
    if (!signatureData) {
      setSignError('Vui lòng vẽ chữ ký trước')
      return
    }

    setSigning(true)
    setSignError('')

    try {
      const res = await fetch(signatureData)
      const blob = await res.blob()
      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' })

      const uploadRes = await uploadSignature(file)
      const signatureUrl = uploadRes.data

      await signHandover(id, role, signatureUrl)

      setMsg('✅ Ký biên bản thành công!')
      setTimeout(() => setMsg(''), 3000)

      await loadHandover()
      setSignatureData(null)
    } catch (err) {
      setSignError(err.response?.data?.message || 'Ký thất bại')
    } finally {
      setSigning(false)
    }
  }

  // ===== UTILS =====
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

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', color: 'var(--muc-mo)' }}>
          Đang tải biên bản...
        </p>
      </div>
    )
  }

  // ===== ERROR =====
  if (error || !handover) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', fontWeight: 900, color: 'var(--do)' }}>
          !
        </h1>
        <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '22px', color: 'var(--muc-mo)' }}>
          {error || 'Không tìm thấy biên bản'}
        </p>
        <Link
          to={backInfo.path}
          style={{
            display: 'inline-block',
            marginTop: '24px',
            color: 'var(--do)',
            borderBottom: '1px solid var(--do)',
          }}
        >
          ← {backInfo.label}
        </Link>
      </div>
    )
  }

  const isPickup = handover.handoverType === 'PICKUP'
  const title = isPickup ? 'Biên bản giao xe' : 'Biên bản nhận xe'
  const hasOwnerSigned = !!handover.ownerSignature
  const hasCustomerSigned = !!handover.customerSignature
  const isCompleted = hasOwnerSigned && hasCustomerSigned

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px' }}>
      <Link
        to={backInfo.path}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          display: 'inline-block',
          marginBottom: '24px',
        }}
      >
        ← {backInfo.label}
      </Link>

      <div className="chapter-num" style={{ marginBottom: '24px' }}>
        Chương Biên Bản — {isPickup ? 'Giao Xe' : 'Nhận Xe'}
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
        {title.split(' ')[0]}{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--do)' }}>
          {title.split(' ').slice(1).join(' ')}
        </em>
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--muc-mo)',
          marginBottom: '40px',
        }}
      >
        Đơn #{handover.bookingId} · {handover.status}
      </p>

      {msg && (
        <div
          style={{
            background: 'rgba(74,93,63,0.1)',
            border: '1px solid var(--xanh-reu)',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--xanh-reu)',
            fontFamily: 'var(--serif-2)',
            fontStyle: 'italic',
          }}
        >
          {msg}
        </div>
      )}

      {/* ===== INFO CARD ===== */}
      <div
        style={{
          background: 'var(--kem-dam)',
          border: '1px solid var(--muc)',
          padding: '32px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <InfoRow label="Số km" value={`${handover.kmReading?.toLocaleString('vi-VN') || '—'} km`} />
          <InfoRow label="Mức xăng" value={`${handover.fuelLevel ?? '—'}%`} />
        </div>

        {/* SO SÁNH KM KHI RETURN */}
        {!isPickup && handover.kmDriven != null && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(74,93,63,0.08)',
              borderLeft: '3px solid var(--xanh-reu)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--xanh-reu)',
                marginBottom: '6px',
              }}
            >
              📊 SO SÁNH VỚI LÚC GIAO XE
            </div>
            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
              }}
            >
              Km lúc giao: <strong>{handover.pickupKmReading?.toLocaleString('vi-VN')}</strong> km
              <br />
              Km lúc nhận: <strong>{handover.kmReading?.toLocaleString('vi-VN')}</strong> km
              <br />
              Đã chạy: <strong style={{ color: 'var(--xanh-reu)', fontSize: '20px' }}>{handover.kmDriven?.toLocaleString('vi-VN')} km</strong>
            </div>
          </div>
        )}

        {/* UC-C12: PHÍ VƯỢT GIỜ */}
        {!isPickup && handover.lateFee > 0 && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(139,44,44,0.1)',
              borderLeft: '3px solid var(--do)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--do)',
                marginBottom: '8px',
              }}
            >
              ⏰ PHÍ TRẢ XE MUỘN
            </div>
            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
                marginBottom: '8px',
              }}
            >
              Trả muộn:{' '}
              <strong>
                {Math.floor(handover.lateMinutes / 60)}h
                {String(handover.lateMinutes % 60).padStart(2, '0')}p
              </strong>
              {handover.actualReturnTime && (
                <>
                  {' '}— Thời gian thực tế:{' '}
                  <strong>{formatDate(handover.actualReturnTime)}</strong>
                </>
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--do)',
              }}
            >
              + {formatPrice(handover.lateFee)}đ
            </div>
          </div>
        )}

        {/* ★ UC-C13: PHÍ VƯỢT KM */}
        {!isPickup && handover.kmOverageFee > 0 && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(139,44,44,0.08)',
              borderLeft: '3px solid var(--do)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--do)',
                marginBottom: '8px',
              }}
            >
              🛣️ PHÍ VƯỢT KM
            </div>

            <div
              style={{
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: 1.7,
                marginBottom: '8px',
              }}
            >
              Đã chạy: <strong>{handover.kmDriven?.toLocaleString('vi-VN')} km</strong>
              <br />
              Định mức: <strong>{handover.kmAllowed?.toLocaleString('vi-VN')} km</strong>
              <br />
              Vượt: <strong style={{ color: 'var(--do)', fontSize: '20px' }}>
                {handover.kmOverage?.toLocaleString('vi-VN')} km
              </strong>
            </div>

            {handover.kmOverageBreakdown && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--kem)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  marginBottom: '12px',
                }}
              >
                {handover.kmOverageBreakdown}
              </div>
            )}

            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--do)',
              }}
            >
              + {formatPrice(handover.kmOverageFee)}đ
            </div>
          </div>
        )}

        {handover.exteriorNote && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Ngoại thất</div>
            <div style={textValue}>"{handover.exteriorNote}"</div>
          </div>
        )}

        {handover.interiorNote && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Nội thất</div>
            <div style={textValue}>"{handover.interiorNote}"</div>
          </div>
        )}

        {handover.damages && (
          <div style={{ marginBottom: '16px' }}>
            <div style={labelSmall}>Hư hỏng mới</div>
            <div style={{ ...textValue, color: 'var(--do)' }}>"{handover.damages}"</div>
          </div>
        )}

        {handover.extraFees > 0 && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(201,169,97,0.15)',
              borderLeft: '3px solid var(--dong)',
              marginTop: '16px',
            }}
          >
            <div style={labelSmall}>Phí phát sinh khác</div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--dong)',
              }}
            >
              {formatPrice(handover.extraFees)}đ
              {handover.extraFeesNote && (
                <span
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    fontWeight: 400,
                    marginLeft: '12px',
                    color: 'var(--muc-mo)',
                  }}
                >
                  — {handover.extraFeesNote}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== ẢNH ===== */}
      {handover.images && handover.images.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            📎 Ảnh ({handover.images.length})
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            {handover.images.map((img) => (
              <a
                key={img.id}
                href={img.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    aspectRatio: '4/3',
                    border: '1px solid var(--muc-mo)',
                    background: `url(${img.imageUrl}) center/cover`,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '9px',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    color: 'var(--muc-mo)',
                    marginTop: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {img.imageType}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ===== CHỮ KÝ 2 BÊN ===== */}
      <div style={{ marginBottom: '32px' }}>
        <h3
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          Chữ ký xác nhận
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div
            style={{
              padding: '20px',
              background: 'var(--kem-dam)',
              border: `2px solid ${hasOwnerSigned ? 'var(--xanh-reu)' : 'var(--muc-mo)'}`,
              textAlign: 'center',
            }}
          >
            <div style={labelSmall}>CHỦ XE</div>
            {hasOwnerSigned ? (
              <>
                <img
                  src={handover.ownerSignature}
                  alt="Chữ ký chủ xe"
                  style={{ maxWidth: '100%', maxHeight: '100px', margin: '12px 0' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'var(--xanh-reu)',
                  }}
                >
                  ✓ Đã ký {formatDate(handover.ownerSignedAt)}
                </div>
              </>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: 'var(--muc-mo)',
                  padding: '30px 0',
                }}
              >
                ⏳ Chưa ký
              </div>
            )}
          </div>

          <div
            style={{
              padding: '20px',
              background: 'var(--kem-dam)',
              border: `2px solid ${hasCustomerSigned ? 'var(--xanh-reu)' : 'var(--muc-mo)'}`,
              textAlign: 'center',
            }}
          >
            <div style={labelSmall}>KHÁCH THUÊ</div>
            {hasCustomerSigned ? (
              <>
                <img
                  src={handover.customerSignature}
                  alt="Chữ ký khách"
                  style={{ maxWidth: '100%', maxHeight: '100px', margin: '12px 0' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'var(--xanh-reu)',
                  }}
                >
                  ✓ Đã ký {formatDate(handover.customerSignedAt)}
                </div>
              </>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--serif-2)',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: 'var(--muc-mo)',
                  padding: '30px 0',
                }}
              >
                ⏳ Chưa ký
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SIGN FORM ===== */}
      {!isCompleted && (
        <div
          style={{
            padding: '32px',
            background: 'var(--kem-dam)',
            border: '2px solid var(--do)',
            marginBottom: '32px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            ✍️ Ký xác nhận
          </h3>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--muc-mo)',
              marginBottom: '20px',
            }}
          >
            Vẽ chữ ký của bạn vào ô bên dưới, sau đó chọn vai trò và bấm "Ký xác nhận".
          </p>

          <SignatureCanvas
            onChange={setSignatureData}
            width={700}
            height={200}
          />

          {signError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(139,44,44,0.1)',
                border: '1px solid var(--do)',
                color: 'var(--do)',
                fontFamily: 'var(--serif-2)',
                fontStyle: 'italic',
              }}
            >
              {signError}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {!hasOwnerSigned && (
              <button
                type="button"
                onClick={() => handleSign('OWNER')}
                disabled={signing || !signatureData}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: 'var(--xanh-reu)',
                  color: 'var(--kem)',
                  border: '1px solid var(--xanh-reu)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: signing || !signatureData ? 'not-allowed' : 'pointer',
                  opacity: signing || !signatureData ? 0.5 : 1,
                }}
              >
                {signing ? 'Đang ký...' : '✍️ Ký với vai trò CHỦ XE'}
              </button>
            )}

            {!hasCustomerSigned && (
              <button
                type="button"
                onClick={() => handleSign('CUSTOMER')}
                disabled={signing || !signatureData}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '16px',
                  background: 'var(--muc)',
                  color: 'var(--kem)',
                  border: '1px solid var(--muc)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: signing || !signatureData ? 'not-allowed' : 'pointer',
                  opacity: signing || !signatureData ? 0.5 : 1,
                }}
              >
                {signing ? 'Đang ký...' : '✍️ Ký với vai trò KHÁCH THUÊ'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== ĐÃ HOÀN TẤT ===== */}
      {isCompleted && (
        <div
          style={{
            padding: '32px',
            background: 'rgba(74,93,63,0.08)',
            border: '2px solid var(--xanh-reu)',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--xanh-reu)',
              marginBottom: '8px',
            }}
          >
            Biên bản đã hoàn tất
          </h3>
          <p
            style={{
              fontFamily: 'var(--serif-2)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--muc-mo)',
            }}
          >
            Cả 2 bên đã ký xác nhận. Trạng thái đơn đã được cập nhật.
          </p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--muc-mo)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--muc)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

const labelSmall = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muc-mo)',
  marginBottom: '6px',
}

const textValue = {
  fontFamily: 'var(--serif-2)',
  fontStyle: 'italic',
  fontSize: '16px',
  color: 'var(--muc)',
  lineHeight: 1.6,
}