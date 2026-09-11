// Lógica del oficio, independiente del transporte.
// La usan tanto el servidor Express (dev) como las funciones de Vercel (prod).

import { SIMBOLOS, INTERVALOS, obtenerVelas } from './binance.js'
import {
  generarSigilos,
  generarTirada,
  generarLecturaIndividual,
  volatilidad,
  lecturaIA,
} from './oracle.js'

export function validar(symbol, interval, limit) {
  const s = SIMBOLOS.includes(symbol) ? symbol : 'BTCUSDT'
  const i = INTERVALOS.includes(interval) ? interval : '1h'
  const l = Math.min(Math.max(Number(limit) || 48, 12), 120)
  return { symbol: s, interval: i, limit: l }
}

function normalizarPregunta(pregunta) {
  return typeof pregunta === 'string' ? pregunta.replace(/\s+/g, ' ').trim().slice(0, 280) : ''
}

export function manejarConfig() {
  return {
    simbolos: SIMBOLOS,
    intervalos: INTERVALOS,
    motorIA: Boolean(process.env.OPENAI_API_KEY),
    modelo: process.env.OPENAI_MODEL || null,
    respaldo: process.env.OPENAI_FALLBACK_MODEL || null,
    streaming: true,
  }
}

export async function manejarVelas(query) {
  const { symbol, interval, limit } = validar(query?.symbol, query?.interval, query?.limit)
  const { fuente, velas, error } = await obtenerVelas(symbol, interval, limit)
  return { symbol, interval, fuente, velas, aviso: error || null, volatilidad: volatilidad(velas) }
}

export async function manejarOracle(cuerpo) {
  const { symbol, interval, limit } = validar(cuerpo?.symbol, cuerpo?.interval, cuerpo?.limit)
  const modo = cuerpo?.modo === 'cruz' ? 'cruz' : 'tiempo'
  const pregunta = normalizarPregunta(cuerpo?.pregunta)
  const { fuente, velas, error } = await obtenerVelas(symbol, interval, limit)
  return {
    symbol,
    interval,
    fuente,
    aviso: error || null,
    velas,
    sigilos: generarSigilos(symbol, interval, velas),
    volatilidad: volatilidad(velas),
    tirada: generarTirada(symbol, interval, velas, modo, pregunta),
  }
}

export async function prepararLectura(cuerpo) {
  const { symbol, interval, limit } = validar(cuerpo?.symbol, cuerpo?.interval, cuerpo?.limit)
  const pregunta = normalizarPregunta(cuerpo?.pregunta)
  const { fuente, velas } = await obtenerVelas(symbol, interval, limit)
  const index = Math.min(Math.max(Number(cuerpo?.index) || velas.length - 1, 0), velas.length - 1)
  const procedural = generarLecturaIndividual(symbol, interval, velas, index, pregunta)
  return { symbol, interval, fuente, indice: index, vela: velas[index], procedural }
}

export async function manejarLectura(cuerpo) {
  const datos = await prepararLectura(cuerpo)
  if (!datos.procedural) return { status: 404, error: 'vela no encontrada' }
  const lectura = await lecturaIA(datos.symbol, datos.interval, datos.vela, datos.procedural)
  return { symbol: datos.symbol, interval: datos.interval, fuente: datos.fuente, indice: datos.indice, lectura }
}
