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

export function consultarAltar(symbol, interval, limit = 48) {
  return pedir('/oracle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval, limit }),
  })
}

export function pedirLectura(symbol, interval, index, limit = 48) {
  return pedir('/lectura', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval, index, limit }),
  })
}
