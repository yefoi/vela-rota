const BASE = '/api'

async function pedir(ruta, opciones) {
  const res = await fetch(`${BASE}${ruta}`, opciones)
  if (!res.ok) {
    let detalle = `HTTP ${res.status}`
    try {
      const data = await res.json()
      detalle = data?.error || detalle
    } catch {
      /* sin cuerpo */
    }
    throw new Error(detalle)
  }
  return res.json()
}

export function obtenerConfig() {
  return pedir('/config')
}

export function consultarAltar({ symbol, interval, modo = 'tiempo', pregunta = '', limit = 48 }) {
  return pedir('/oracle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval, modo, pregunta, limit }),
  })
}

export function pedirLectura(symbol, interval, index, limit = 48) {
  return pedir('/lectura', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval, index, limit }),
  })
}

// Lee el torrente SSE de /api/lectura-stream y va avisando por callbacks.
export async function streamLectura(
  { symbol, interval, index, limit = 48, pregunta = '' },
  { onMeta, onChunk, onFin, signal } = {},
) {
  const qs = new URLSearchParams({ symbol, interval, index, limit, pregunta })
  const res = await fetch(`${BASE}/lectura-stream?${qs}`, { signal })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let evento = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lineas = buffer.split('\n')
    buffer = lineas.pop() ?? ''
    for (const linea of lineas) {
      const t = linea.replace(/\r$/, '')
      if (t.startsWith('event:')) {
        evento = t.slice(6).trim()
      } else if (t.startsWith('data:')) {
        const data = t.slice(5).trim()
        if (!data) continue
        let json
        try {
          json = JSON.parse(data)
        } catch {
          continue
        }
        if (evento === 'meta') onMeta?.(json)
        else if (evento === 'trozo') onChunk?.(json.texto)
        else if (evento === 'fin') onFin?.(json)
      }
    }
  }
}
