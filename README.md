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

Copia `.env.example` a `.env` (o exporta las variables) y define:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Sin llave, el oráculo local sigue funcionando sin dependencias externas.

## Endpoints

- `GET  /api/config` — símbolos, intervalos y si hay motor IA.
- `GET  /api/candles?symbol=BTCUSDT&interval=1h&limit=48`
- `POST /api/oracle` — velas + sigilos + tirada (pasado/presente/futuro) + mandato.
- `POST /api/lectura` — lectura completa de una vela (`{ symbol, interval, index }`).

## Aviso

No es consejo de inversión. Es liturgia.
