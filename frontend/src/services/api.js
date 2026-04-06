import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

export async function analyzeDebug(payload) {
  const { data } = await api.post('/analyze', payload)
  return data
}

export async function sendChat(sessionId, message, history) {
  const { data } = await api.post('/chat', {
    session_id: sessionId,
    message,
    history: history.map(m => ({ role: m.role, content: m.content })),
  })
  return data
}

export async function ingestIssue(payload) {
  const { data } = await api.post('/ingest', payload)
  return data
}

export async function searchKnowledge(query, limit = 5) {
  const { data } = await api.get('/search', { params: { q: query, limit } })
  return data
}

export async function getExamples() {
  const { data } = await api.get('/examples')
  return data
}

// WebSocket streaming analysis
export function createAnalysisSocket(payload, { onProgress, onComplete, onError }) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/analyze`)

  ws.onopen = () => ws.send(JSON.stringify(payload))

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'progress') onProgress?.(msg)
    else if (msg.type === 'complete') { onComplete?.(msg.result); ws.close() }
    else if (msg.type === 'error') { onError?.(msg.message); ws.close() }
  }

  ws.onerror = () => onError?.('WebSocket connection failed')
  return ws
}
