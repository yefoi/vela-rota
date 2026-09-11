import { manejarConfig } from '../server/handlers.js'

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'método no permitido' })
  res.status(200).json(manejarConfig())
}
