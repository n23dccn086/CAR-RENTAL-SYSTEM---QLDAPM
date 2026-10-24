import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const DialogContext = createContext(null)

let globalDialog = null

export const dialog = {
  confirm: (options) => {
    if (globalDialog?.confirm) return globalDialog.confirm(options)
    return Promise.resolve(window.confirm(typeof options === 'string' ? options : (options?.message || options?.title || 'Xác nhận?')))
  },
  prompt: (options) => {
    if (globalDialog?.prompt) return globalDialog.prompt(options)
    return Promise.resolve(window.prompt(typeof options === 'string' ? options : (options?.message || options?.inputLabel || 'Nhập nội dung:'), options?.defaultValue || ''))
  },
  alert: (options) => {
    if (globalDialog?.alert) return globalDialog.alert(options)
    window.alert(typeof options === 'string' ? options : (options?.message || options?.title || ''))
    return Promise.resolve()
  }
}

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const resolverRef = useRef(null)
  const inputRef = useRef(null)

  const openDialog = useCallback((type, options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      const defVal = options.defaultValue || ''
      setInputValue(defVal)
      setInputError('')
      setDialogState({
        type,
        title: options.title || (type === 'prompt' ? 'Nhập thông tin' : type === 'confirm' ? 'Xác nhận' : 'Thông báo'),
        subtitle: options.subtitle || (type === 'prompt' ? 'Ghi chú / Phản hồi' : type === 'confirm' ? 'Xác nhận thao tác' : 'Hệ thống Maison'),
        message: options.message || '',
        inputLabel: options.inputLabel || (type === 'prompt' ? 'Nội dung *' : ''),
        placeholder: options.placeholder || 'Nhập lý do hoặc nội dung chi tiết...',
        defaultValue: defVal,
        required: options.required !== false,
        inputType: options.inputType || 'textarea',
        rows: options.rows || 3,
        confirmText: options.confirmText || (type === 'prompt' ? 'Xác nhận' : type === 'confirm' ? 'Đồng ý' : 'Đóng'),
        cancelText: options.cancelText || 'Hủy',
        variant: options.variant || (type === 'prompt' ? 'danger' : 'default'), // 'danger' | 'success' | 'gold' | 'default'
        details: options.details || null
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (!dialogState) return

    if (dialogState.type === 'prompt') {
      const val = inputValue.trim()
      if (dialogState.required && !val) {
        setInputError('Vui lòng nhập nội dung trước khi tiếp tục.')
        inputRef.current?.focus()
        return
      }
      resolverRef.current?.(val)
    } else if (dialogState.type === 'confirm') {
      resolverRef.current?.(true)
    } else {
      resolverRef.current?.(true)
    }

    setDialogState(null)
    resolverRef.current = null
  }, [dialogState, inputValue])

  const handleCancel = useCallback(() => {
    if (!dialogState) return

    if (dialogState.type === 'prompt') {
      resolverRef.current?.(null)
    } else if (dialogState.type === 'confirm') {
      resolverRef.current?.(false)
    } else {
      resolverRef.current?.(false)
    }

    setDialogState(null)
    resolverRef.current = null
  }, [dialogState])

  // Gán singleton cho các utility hoặc component gọi trực tiếp
  useEffect(() => {
    globalDialog = {
      confirm: (opts) => openDialog('confirm', typeof opts === 'string' ? { message: opts } : opts),
      prompt: (opts) => openDialog('prompt', typeof opts === 'string' ? { message: opts } : opts),
      alert: (opts) => openDialog('alert', typeof opts === 'string' ? { message: opts } : opts)
    }
    return () => {
      globalDialog = null
    }
  }, [openDialog])

  // Tự động focus input khi mở prompt
  useEffect(() => {
    if (dialogState && dialogState.type === 'prompt') {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [dialogState])

  // Lắng nghe phím Esc và Enter
  useEffect(() => {
    if (!dialogState) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      } else if (e.key === 'Enter') {
        // Nếu là textarea, chỉ submit khi ấn Ctrl+Enter hoặc Cmd+Enter
        if (dialogState.type === 'prompt' && dialogState.inputType === 'textarea') {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleConfirm()
          }
        } else if (dialogState.type !== 'prompt' || dialogState.inputType === 'text') {
          e.preventDefault()
          handleConfirm()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialogState, handleCancel, handleConfirm])

  const contextValue = {
    confirm: (opts) => openDialog('confirm', typeof opts === 'string' ? { message: opts } : opts),
    prompt: (opts) => openDialog('prompt', typeof opts === 'string' ? { message: opts } : opts),
    alert: (opts) => openDialog('alert', typeof opts === 'string' ? { message: opts } : opts)
  }

  // Màu sắc button xác nhận theo variant
  const getButtonStyles = (variant) => {
    switch (variant) {
      case 'danger':
        return {
          background: 'var(--do)',
          borderColor: 'var(--do)',
          color: 'var(--kem)',
          hoverBg: '#702222'
        }
      case 'success':
        return {
          background: 'var(--xanh-reu)',
          borderColor: 'var(--xanh-reu)',
          color: 'var(--kem)',
          hoverBg: '#3b4b32'
        }
      case 'gold':
        return {
          background: 'var(--dong)',
          borderColor: 'var(--dong)',
          color: 'var(--muc)',
          hoverBg: '#b89852'
        }
      case 'default':
      default:
        return {
          background: 'var(--muc)',
          borderColor: 'var(--muc)',
          color: 'var(--kem)',
          hoverBg: '#2a2825'
        }
    }
  }

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogState &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(15, 14, 12, 0.72)',
              backdropFilter: 'blur(3px)',
              animation: 'fadeIn 0.18s ease-out'
            }}
            onClick={handleCancel}
          >
            <div
              style={{
                position: 'relative',
                background: 'var(--kem)',
                border: '1px solid var(--muc)',
                boxShadow: '0 24px 48px rgba(15, 14, 12, 0.35)',
                maxWidth: '480px',
                width: '100%',
                padding: '36px 32px 28px',
                boxSizing: 'border-box',
                animation: 'fadeUp 0.22s var(--ease)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nút đóng X */}
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Đóng"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: '1px solid rgba(15, 14, 12, 0.2)',
                  color: 'var(--muc)',
                  fontFamily: 'var(--mono)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--muc)'
                  e.currentTarget.style.background = 'rgba(15, 14, 12, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(15, 14, 12, 0.2)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                ✕
              </button>

              {/* Subtitle / Chapter indicator */}
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: dialogState.variant === 'danger' ? 'var(--do)' : dialogState.variant === 'success' ? 'var(--xanh-reu)' : 'var(--muc-mo)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{dialogState.variant === 'danger' ? '✦' : '•'}</span>
                <span>{dialogState.subtitle}</span>
              </div>

              {/* Tiêu đề chính */}
              <h3
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  color: 'var(--muc)',
                  margin: '0 0 12px 0',
                  lineHeight: 1.25,
                  paddingRight: '28px'
                }}
              >
                {dialogState.title}
              </h3>

              {/* Nội dung thông điệp */}
              {dialogState.message && (
                <div
                  style={{
                    fontFamily: 'var(--serif-2)',
                    fontSize: '16px',
                    lineHeight: 1.55,
                    color: 'var(--muc-nhat)',
                    marginBottom: dialogState.type === 'prompt' ? '18px' : '24px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {dialogState.message}
                </div>
              )}

              {/* Chi tiết đính kèm (nếu có) */}
              {dialogState.details && (
                <div
                  style={{
                    background: 'var(--kem-dam)',
                    borderLeft: `3px solid ${getButtonStyles(dialogState.variant).background}`,
                    padding: '10px 14px',
                    marginBottom: '20px',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    color: 'var(--muc)',
                    lineHeight: 1.5
                  }}
                >
                  {dialogState.details}
                </div>
              )}

              {/* Input cho Prompt */}
              {dialogState.type === 'prompt' && (
                <div style={{ marginBottom: '22px' }}>
                  {dialogState.inputLabel && (
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: 'var(--muc-mo)',
                        marginBottom: '8px'
                      }}
                    >
                      {dialogState.inputLabel}
                    </label>
                  )}

                  {dialogState.inputType === 'text' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value)
                        if (inputError) setInputError('')
                      }}
                      placeholder={dialogState.placeholder}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--kem-dam)',
                        border: inputError ? '1px solid var(--do)' : '1px solid rgba(15, 14, 12, 0.25)',
                        outline: 'none',
                        fontFamily: 'var(--serif-2)',
                        fontSize: '16px',
                        color: 'var(--muc)',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <textarea
                      ref={inputRef}
                      rows={dialogState.rows}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value)
                        if (inputError) setInputError('')
                      }}
                      placeholder={dialogState.placeholder}
                      maxLength={500}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--kem-dam)',
                        border: inputError ? '1px solid var(--do)' : '1px solid rgba(15, 14, 12, 0.25)',
                        outline: 'none',
                        fontFamily: 'var(--serif-2)',
                        fontSize: '15px',
                        color: 'var(--muc)',
                        resize: 'vertical',
                        lineHeight: 1.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  )}

                  {/* Ký tự và gợi ý phím */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px',
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      color: 'var(--muc-mo)'
                    }}
                  >
                    <span>{dialogState.inputType === 'textarea' ? 'Ctrl + Enter để xác nhận' : 'Enter để xác nhận'}</span>
                    <span>{inputValue.length}/500</span>
                  </div>

                  {/* Báo lỗi nếu thiếu input bắt buộc */}
                  {inputError && (
                    <div
                      style={{
                        marginTop: '8px',
                        color: 'var(--do)',
                        fontFamily: 'var(--serif-2)',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⚠</span>
                      <span>{inputError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Nút hành động */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '8px'
                }}
              >
                {dialogState.type !== 'alert' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: '10px 18px',
                      background: 'transparent',
                      border: '1px solid var(--muc)',
                      color: 'var(--muc)',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 14, 12, 0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {dialogState.cancelText}
                  </button>
                )}

                {(() => {
                  const btnStyles = getButtonStyles(dialogState.variant)
                  return (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      style={{
                        padding: '10px 22px',
                        background: btnStyles.background,
                        border: `1px solid ${btnStyles.borderColor}`,
                        color: btnStyles.color,
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = btnStyles.hoverBg
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = btnStyles.background
                      }}
                    >
                      {dialogState.confirmText}
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    return dialog
  }
  return context
}
