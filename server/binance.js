// Contacto con el mundo exterior: velas reales de Binance.
// Si el mundo calla, el altar fabrica su propia cera (modo sintético).

const BINANCE_HOSTS = [
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api1.binance.com',
]

export const SIMBOLOS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'LINKUSDT', 'AVAXUSDT']
export const INTERVALOS = ['5m', '15m', '1h', '4h', '1d']

const cache = new Map()
const TTL = 30_000

function desdeBinance(fila) {
  return {
    openTime: fila[0],
    open: Number(fila[1]),
    high: Number(fila[2]),
    low: Number(fila[3]),
    close: Number(fila[4]),
    volume: Number(fila[5]),
    closeTime: fila[6],
    trades: fila[8],
  }
}

function sinteticas(symbol, interval, limit) {
  const base = 100 + (symbol.charCodeAt(0) % 40) * 137
  let precio = base
  let semilla = 0
  for (let i = 0; i < symbol.length; i++) semilla = (semilla * 31 + symbol.charCodeAt(i)) >>> 0
  const rand = () => {
    semilla = (semilla * 1664525 + 1013904223) >>> 0
    return semilla / 4294967296
  }
  const paso = { '5m': 5 * 60e3, '15m': 15 * 60e3, '1h': 3600e3, '4h': 4 * 3600e3, '1d': 86400e3 }[interval] || 3600e3
  const ahora = Date.now()
  const velas = []
  for (let i = limit - 1; i >= 0; i--) {
    const open = precio
    const deriva = (rand() - 0.48) * 0.035
    const close = Math.max(0.0001, open * (1 + deriva))
    const alto = Math.max(open, close) * (1 + rand() * 0.02)
    const bajo = Math.min(open, close) * (1 - rand() * 0.02)
    velas.push({
      openTime: ahora - i * paso,
      open: redondear(open),
      high: redondear(alto),
      low: redondear(bajo),
      close: redondear(close),
      volume: redondear(100 + rand() * 900),
      closeTime: ahora - i * paso + paso,
      trades: Math.floor(200 + rand() * 2000),
    })
    precio = close
  }
  return velas
}

function redondear(n) {
  return Math.round(n * 100) / 100
}

export async function obtenerVelas(symbol, interval, limit) {
  const clave = `${symbol}|${interval}|${limit}`
  const guardado = cache.get(clave)
  if (guardado && Date.now() - guardado.t < TTL) return guardado.v

  let ultimoError = null
  for (const host of BINANCE_HOSTS) {
    try {
      const url = `${host}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const datos = await res.json()
      if (!Array.isArray(datos) || !datos.length) throw new Error('respuesta vacía')
      const velas = datos.map(desdeBinance)
      cache.set(clave, { t: Date.now(), v: { fuente: 'binance', velas } })
      return { fuente: 'binance', velas }
    } catch (err) {
      ultimoError = err
    }
  }

  const velas = sinteticas(symbol, interval, limit)
  cache.set(clave, { t: Date.now(), v: { fuente: 'sintetico', velas } })
  return { fuente: 'sintetico', velas, error: String(ultimoError?.message || ultimoError) }
}
