import { manejarOracle } from '../server/handlers.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' })
  try {
    res.status(200).json(await manejarOracle(req.body || {}))
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
}
