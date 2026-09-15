// Contacto con el mundo exterior: velas reales.
// Cadena de fuentes: Binance global -> Binance US -> Coinbase -> cera sintética.

const BINANCE_GLOBAL = [
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api1.binance.com',
]
const BINANCE_US = 'https://api.binance.us'

export const SIMBOLOS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'LINKUSDT', 'AVAXUSDT']
export const INTERVALOS = ['5m', '15m', '1h', '4h', '1d', '1w', '1M']

const cache = new Map()
const TTL = 20_000

function desdeBinance(fila) {
  return {
    openTime: fila[0],
    open: Number(fila[1]),
    high: Number(fila[2]),
    low: Number(fila[3]),
    close: Number(fila[4]),
    volume: Number(fila[5]),
    closeTime: fila[6],
    trades: fila[8] ?? 0,
  }
}

async function klines(host, symbol, interval, limit) {
  const url = `${host}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const datos = await res.json()
  if (!Array.isArray(datos) || !datos.length) throw new Error('respuesta vacía')
  return datos.map(desdeBinance)
}

// Coinbase sólo acepta ciertas granularidades; 4h, 1w y 1M se arman agregando.
const COINBASE_GRAN = { '5m': 300, '15m': 900, '1h': 3600, '4h': 3600, '1d': 86400, '1w': 86400, '1M': 86400 }
const COINBASE_FACTOR = { '5m': 1, '15m': 1, '1h': 1, '4h': 4, '1d': 1, '1w': 7, '1M': 30 }

function agrupar(velas, factor) {
  const salida = []
  for (let i = 0; i < velas.length; i += factor) {
    const grupo = velas.slice(i, i + factor)
    if (!grupo.length) break
    salida.push({
      openTime: grupo[0].openTime,
      open: grupo[0].open,
      high: Math.max(...grupo.map((v) => v.high)),
      low: Math.min(...grupo.map((v) => v.low)),
      close: grupo[grupo.length - 1].close,
      volume: grupo.reduce((a, v) => a + v.volume, 0),
      closeTime: grupo[grupo.length - 1].closeTime,
      trades: grupo.reduce((a, v) => a + (v.trades || 0), 0),
    })
  }
  return salida
}

async function desdeCoinbase(symbol, interval, limit) {
  const par = symbol.replace(/USDT$/, '-USD')
  const gran = COINBASE_GRAN[interval] || 86400
  const factor = COINBASE_FACTOR[interval] || 1
  const url = `https://api.exchange.coinbase.com/products/${par}/candles?granularity=${gran}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'wickfable/0.1' },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) throw new Error(`Coinbase HTTP ${res.status}`)
  const filas = await res.json()
  if (!Array.isArray(filas) || !filas.length) throw new Error('Coinbase vacío')
  let velas = filas
    .slice(0, limit * factor)
    .reverse()
    .map((f) => ({
      openTime: f[0] * 1000,
      open: Number(f[3]),
      high: Number(f[2]),
      low: Number(f[1]),
      close: Number(f[4]),
      volume: Number(f[5]),
      closeTime: (f[0] + gran) * 1000,
      trades: 0,
    }))
  if (factor > 1) velas = agrupar(velas, factor)
  return velas.slice(-limit)
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
  const paso = { '5m': 5 * 60e3, '15m': 15 * 60e3, '1h': 3600e3, '4h': 4 * 3600e3, '1d': 86400e3, '1w': 7 * 86400e3, '1M': 30 * 86400e3 }[interval] || 3600e3
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

  // 1) Binance global (los hosts en paralelo, gana el primero que responda)
  try {
    const velas = await Promise.any(BINANCE_GLOBAL.map((h) => klines(h, symbol, interval, limit)))
    return guardar(clave, 'binance', velas)
  } catch (err) {
    ultimoError = err
  }

  // 2) Binance US y Coinbase en paralelo (geobloqueo de EE.UU.)
  try {
    const resultado = await Promise.any([
      klines(BINANCE_US, symbol, interval, limit).then((velas) => ({ fuente: 'binance-us', velas })),
      desdeCoinbase(symbol, interval, limit).then((velas) => ({ fuente: 'coinbase', velas })),
    ])
    if (!resultado.velas.length) throw new Error('sin velas')
    return guardar(clave, resultado.fuente, resultado.velas)
  } catch (err) {
    ultimoError = err
  }

  const velas = sinteticas(symbol, interval, limit)
  return guardar(clave, 'sintetico', velas, String(ultimoError?.message || ultimoError))
}

function guardar(clave, fuente, velas, error) {
  const valor = { fuente, velas, error }
  cache.set(clave, { t: Date.now(), v: valor })
  return valor
}
