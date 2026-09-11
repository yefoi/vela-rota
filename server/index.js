import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SIMBOLOS, INTERVALOS, obtenerVelas } from './binance.js'
import { generarSigilos, generarTirada, generarLecturaIndividual, lecturaIA } from './oracle.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PUERTO = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function validar(symbol, interval, limit) {
  const s = SIMBOLOS.includes(symbol) ? symbol : 'BTCUSDT'
  const i = INTERVALOS.includes(interval) ? interval : '1h'
  const l = Math.min(Math.max(Number(limit) || 48, 12), 120)
  return { symbol: s, interval: i, limit: l }
}

app.get('/api/config', (_req, res) => {
  res.json({
    simbolos: SIMBOLOS,
    intervalos: INTERVALOS,
    motorIA: Boolean(process.env.OPENAI_API_KEY),
  })
})

app.get('/api/candles', async (req, res) => {
  const { symbol, interval, limit } = validar(req.query.symbol, req.query.interval, req.query.limit)
  const { fuente, velas, error } = await obtenerVelas(symbol, interval, limit)
  res.json({ symbol, interval, fuente, velas, aviso: error || null })
})

app.post('/api/oracle', async (req, res) => {
  const { symbol, interval, limit } = validar(req.body?.symbol, req.body?.interval, req.body?.limit)
  const { fuente, velas, error } = await obtenerVelas(symbol, interval, limit)
  const sigilos = generarSigilos(symbol, interval, velas)
  const tirada = generarTirada(symbol, interval, velas)
  res.json({
    symbol,
    interval,
    fuente,
    aviso: error || null,
    velas,
    sigilos,
    tirada,
  })
})

app.post('/api/lectura', async (req, res) => {
  const { symbol, interval, limit } = validar(req.body?.symbol, req.body?.interval, req.body?.limit)
  const { fuente, velas } = await obtenerVelas(symbol, interval, limit)
  const index = Math.min(Math.max(Number(req.body?.index) || velas.length - 1, 0), velas.length - 1)
  const procedural = generarLecturaIndividual(symbol, interval, velas, index)
  if (!procedural) return res.status(404).json({ error: 'vela no encontrada' })
  const lectura = await lecturaIA(symbol, interval, velas[index], procedural)
  res.json({ symbol, interval, fuente, indice: index, lectura })
})

const dist = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PUERTO, () => {
  console.log(`[vela-rota] el oficio escucha en http://localhost:${PUERTO}`)
})
