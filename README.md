# VELA ROTA

> mercados como oráculo · cada vela es una carta tendida en el altar

Toma velas reales de mercado (cripto, vía Binance) y las lee como cartas de tarot.
Cada candlestick se convierte en un arcano: alcista = carta derecha, bajista =
invertida, doji = tendida en cruz. La lectura se compone en tono litúrgico, sin
guiño, sin ironía, con la seriedad de un rito. Estética de altar roto: cera,
glitch, ruido, sombras.

## Cómo funciona

1. El servidor pide velas reales a la API pública de Binance (`/api/v3/klines`).
   Si el mundo calla, fabrica velas sintéticas para no dejar el altar vacío.
2. Un oráculo **determinista** convierte cada vela en una carta (siempre la misma
   vela revela la misma carta) y redacta la lectura a partir de su cuerpo,
   mechas, volumen y variación.
3. Si defines `OPENAI_API_KEY`, la lectura puede pasar por un modelo real; si no,
   oficia el oráculo local.

## Arranque

```bash
npm install
npm run dev
```

- Altar (UI): http://localhost:5173
- Oficio (API): http://localhost:8787

Para producción:

```bash
npm run build
npm start        # sirve dist/ + API en :8787
```

## IA opcional

Copia `.env.example` a `.env` (o define las variables en el entorno) y completa:

```
OPENAI_API_KEY=sk-...                         # OpenCode Zen
OPENAI_BASE_URL=https://opencode.ai/zen/v1
OPENAI_MODEL=gpt-5.6-luna                      # usa Responses API
OPENAI_FALLBACK_MODEL=deepseek-v4-flash        # usa Chat Completions
```

- El protocolo se autodetecta por modelo (GPT/Grok/Muse → `/responses`;
  DeepSeek/GLM/Kimi/Qwen → `/chat/completions`). Forzalo con `OPENAI_API=chat|responses`.
- Si el modelo primario falla, se reintenta con `OPENAI_FALLBACK_MODEL`.
- Sin `OPENAI_API_KEY`, oficia el oráculo local sin dependencias externas.

## Deploy en Vercel

El repo ya trae el adaptador serverless: `api/*.js` reutiliza la lógica de
`server/handlers.js`, y `vercel.json` publica el build de Vite en `dist`.

1. Importá el repo en Vercel (framework: Vite).
2. Definí las variables: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`,
   `OPENAI_FALLBACK_MODEL`.
3. Deploy. La UI queda estática y los endpoints `/api/*` corren como funciones.

## Endpoints

- `GET  /api/config` — símbolos, intervalos, motor IA, modelo y respaldo.
- `GET  /api/candles?symbol=BTCUSDT&interval=1h&limit=48`
- `POST /api/oracle` — velas + sigilos + tirada (pasado/presente/futuro) + mandato.
- `POST /api/lectura` — lectura completa de una vela (`{ symbol, interval, index }`).

## Aviso

No es consejo de inversión. Es liturgia.
