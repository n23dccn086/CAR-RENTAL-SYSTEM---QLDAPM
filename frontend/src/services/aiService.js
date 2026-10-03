import axios from 'axios'

const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000'

export async function sendChatMessage(message, sessionId = null) {
  try {
    const response = await axios.post(`${AI_URL}/ai/chat`, {
      message,
      session_id: sessionId,
    }, { timeout: 30000 })
    return response.data
  } catch (err) {
    console.error('AI service error:', err.message)
    throw err
  }
}

export async function getChatHistory(sessionId) {
  const response = await axios.get(`${AI_URL}/ai/chat/${sessionId}/history`)
  return response.data
}

export async function sendFeedback(messageId, rating) {
  const response = await axios.post(`${AI_URL}/ai/chat/${messageId}/feedback`, { rating })
  return response.data
}