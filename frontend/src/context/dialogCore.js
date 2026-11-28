import { createContext, useContext } from 'react'

// Tách khỏi DialogContext.jsx để file đó chỉ export component (yêu cầu của React Fast Refresh)
export const DialogContext = createContext(null)

let globalDialog = null

export function setGlobalDialog(value) {
  globalDialog = value
}

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

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    return dialog
  }
  return context
}
