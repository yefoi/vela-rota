import { manejarLectura } from '../server/handlers.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' })
  try {
    const datos = await manejarLectura(req.body || {})
    res.status(datos.status || 200).json(datos)
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
}
