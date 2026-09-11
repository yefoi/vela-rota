import { prepararLectura } from '../server/handlers.js'
import { lecturaIAStream } from '../server/oracle.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'método no permitido' })

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

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
    enviar('meta', {
      symbol, interval, fuente, indice,
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
    })
    const info = await lecturaIAStream(symbol, interval, vela, procedural, {
      onChunk: (texto) => enviar('trozo', { texto }),
    })
    enviar('fin', info)
  } catch (e) {
    enviar('fin', { motor: 'oraculo-local', error: String(e?.message || e) })
  }
  res.end()
}
