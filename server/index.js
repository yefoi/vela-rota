import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  manejarConfig,
  manejarVelas,
  manejarOracle,
  manejarLectura,
  prepararLectura,
} from './handlers.js'
import { lecturaIAStream } from './oracle.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PUERTO = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/config', (_req, res) => {
  res.json(manejarConfig())
})

app.get('/api/candles', async (req, res) => {
  try {
    res.json(await manejarVelas(req.query))
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
})

app.post('/api/oracle', async (req, res) => {
  try {
    res.json(await manejarOracle(req.body || {}))
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
})

app.post('/api/lectura', async (req, res) => {
  try {
    const datos = await manejarLectura(req.body || {})
    res.status(datos.status || 200).json(datos)
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
})

// El oráculo escribe en tiempo real (Server-Sent Events)
app.get('/api/lectura-stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  const enviar = (evento, datos) => res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`)

  try {
    const { symbol, interval, fuente, indice, vela, procedural } = await prepararLectura({
      symbol: req.query.symbol,
      interval: req.query.interval,
      limit: req.query.limit,
      index: req.query.index,
      pregunta: req.query.pregunta,
    })
    if (!procedural) {
      enviar('fin', { error: 'vela no encontrada' })
      return res.end()
    }
    enviar('meta', metaDe(procedural, { symbol, interval, fuente, indice }))
    const info = await lecturaIAStream(symbol, interval, vela, procedural, {
      onChunk: (texto) => enviar('trozo', { texto }),
    })
    enviar('fin', info)
  } catch (e) {
    enviar('fin', { motor: 'oraculo-local', error: String(e?.message || e) })
  }
  res.end()
})

function metaDe(procedural, extra) {
  return {
    ...extra,
    carta: procedural.carta,
    orientacion: procedural.orientacion,
    posicionTitulo: procedural.posicionTitulo,
    pregunta: procedural.pregunta,
    cambio: procedural.cambio,
    cambioTxt: procedural.cambioTxt,
    apertura: procedural.apertura,
    cierre: procedural.cierre,
    maximo: procedural.maximo,
    minimo: procedural.minimo,
    volumen: procedural.volumen,
    openTime: procedural.openTime,
  }
}

const dist = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PUERTO, () => {
  console.log(`[vela-rota] el oficio escucha en http://localhost:${PUERTO}`)
})
