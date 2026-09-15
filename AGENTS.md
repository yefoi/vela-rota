# AGENTS.md — Wickfable

Velas reales de mercado leídas como cartas de tarot y crónicas de ficción.
Node + Express (`server/`) y cliente Vite + React (`src/`). Deploy serverless en Vercel (`api/`).

## Flujo de trabajo

- **Tras cada cambio pedido por el usuario: hacer `git add -A`, commit y push** a `origin main`.
- Antes de commitear: `npm run lint` y `npm run build` deben pasar (0 avisos).
- Mensajes de commit concisos, en español sin tildes.

## Convenciones

- Idioma de la UI y de la prosa: **español de España**, sin voseo.
- La prosa generada es **sobria y directa** (sin poesía). La baraja (arcana) se mantiene.
- No romper el **disclaimer** de ficción: aviso inicial, cinta persistente y advertencia en cada salida.
- El oráculo local (`oracle.js`) debe funcionar sin `OPENAI_API_KEY` (fallback procedural).
- Fuentes de velas en orden: Binance global → Binance US → Coinbase → sintético.
