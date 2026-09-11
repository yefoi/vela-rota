import { prepararCronica } from '../server/handlers.js'
import { cronicaIAStream } from '../server/cronica.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'método no permitido' })

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

  const enviar = (evento, datos) => res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`)

  try {
    const { symbol, interval, fuente, beats, trama, protagonista, premisa, genero, desde, inicio, resumen } =
      await prepararCronica({
        symbol: req.query.symbol,
        interval: req.query.interval,
        limit: req.query.limit,
        capitulos: req.query.capitulos,
        premisa: req.query.premisa,
        genero: req.query.genero,
        desde: req.query.desde,
        inicio: req.query.inicio,
        resumen: req.query.resumen,
      })
    enviar('meta', { symbol, interval, fuente, beats, trama, protagonista, premisa, genero, desde, inicio })
    const info = await cronicaIAStream(beats, {
      symbol,
      genero,
      premisa,
      resumen,
      desde,
      inicio,
      onCapitulo: (capitulo) => enviar('capitulo', capitulo),
      onTrozo: (trozo) => enviar('trozo', trozo),
    })
    enviar('fin', info)
  } catch (e) {
    enviar('fin', { motor: 'oraculo-local', error: String(e?.message || e) })
  }
  res.end()
}
