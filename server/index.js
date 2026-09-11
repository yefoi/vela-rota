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
} from './handlers.js'

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

const dist = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PUERTO, () => {
  console.log(`[vela-rota] el oficio escucha en http://localhost:${PUERTO}`)
})
