import {
  ARCANOS_MAYORES,
  PALOS,
  RANGOS,
  LITURGIA,
  orientacionDe,
} from './arcana.js'

// ---------------------------------------------------------------------------
// Azar determinista: la misma vela siempre revela la misma carta.
// El oráculo no improvisa; recuerda.
// ---------------------------------------------------------------------------

function xmur3(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function prngFor(symbol, interval, candle) {
  const seed = xmur3(`${symbol}|${interval}|${candle.openTime}|${candle.open}|${candle.close}`)
  return mulberry32(seed())
}

// ---------------------------------------------------------------------------
// Tirada de la carta
// ---------------------------------------------------------------------------

function robarCarta(rand) {
  const tirada = rand()
  const esMayor = tirada < 0.34
  if (esMayor) {
    const idx = Math.floor(rand() * ARCANOS_MAYORES.length)
    const arcano = ARCANOS_MAYORES[idx]
    return {
      tipo: 'mayor',
      nombre: arcano.nombre,
      roman: arcano.roman,
      palo: null,
      rango: null,
      elemento: arcano.cuerpo,
      regencia: arcano.regencia,
      clave: arcano,
    }
  }
  const palo = PALOS[Math.floor(rand() * PALOS.length)]
  const rango = RANGOS[Math.floor(rand() * RANGOS.length)]
  return {
    tipo: 'menor',
    nombre: `${rango.rango} de ${palo.palo}`,
    roman: null,
    palo: palo.palo,
    rango: rango.rango,
    elemento: palo.elemento,
    regencia: null,
    clave: { ...palo, ...rango },
  }
}

export function sigiloDe(symbol, interval, candle) {
  const rand = prngFor(symbol, interval, candle)
  const carta = robarCarta(rand)
  const orientacion = orientacionDe(candle)
  return {
    tipo: carta.tipo,
    nombre: carta.nombre,
    roman: carta.roman,
    palo: carta.palo,
    rango: carta.rango,
    elemento: carta.elemento,
    orientacion,
  }
}

// ---------------------------------------------------------------------------
// Retórica: la vela como cuerpo, la métrica como presagio
// ---------------------------------------------------------------------------

function describirCuerpo(candle) {
  const rango = Math.max(candle.high - candle.low, 1e-12)
  const cuerpo = Math.abs(candle.close - candle.open) / rango
  const mechaSup = (candle.high - Math.max(candle.open, candle.close)) / rango
  const mechaInf = (Math.min(candle.open, candle.close) - candle.low) / rango
  return { cuerpo, mechaSup, mechaInf }
}

function fraseCuerpo({ cuerpo }) {
  if (cuerpo < 0.08) return 'Un cuerpo apenas esbozado, casi un suspiro sin dirección'
  if (cuerpo < 0.3) return 'Un cuerpo breve, indeciso, que no se compromete'
  if (cuerpo < 0.6) return 'Un cuerpo medido, la voluntad justa de quien sabe esperar'
  if (cuerpo < 0.85) return 'Un cuerpo extenso, la convicción dibujada de un solo trazo'
  return 'Un cuerpo desmesurado, casi toda la vela, la certeza que no admite sombra'
}

function fraseMechas({ mechaSup, mechaInf }) {
  const partes = []
  if (mechaSup > 0.55) partes.push('una sombra superior larguísima que delata el rechazo del cielo')
  else if (mechaSup > 0.3) partes.push('una sombra alta que coquetea con lo inalcanzable')
  else if (mechaSup < 0.05) partes.push('sin sombra arriba, como si nada la contuviera')
  if (mechaInf > 0.55) partes.push('una sombra inferior honda, el pozo donde alguien compró tu miedo')
  else if (mechaInf > 0.3) partes.push('una sombra baja que encontró suelo')
  else if (mechaInf < 0.05) partes.push('sin sombra abajo, el vacío sosteniéndola')
  if (!partes.length) return 'y mechas simétricas, el equilibrio tenso de la duda'
  return partes.join(', ')
}

function fraseVolumen(rel) {
  if (rel == null) return 'El volumen calla, y su silencio también es un signo'
  if (rel > 2) return 'El volumen arde muy por encima de su costumbre: multitud congregada'
  if (rel > 1.35) return 'El volumen supera su promedio: hay fieles en la nave'
  if (rel > 0.8) return 'El volumen respira en su medida habitual: rito ordinario'
  if (rel > 0.45) return 'El volumen se adelgaza: la feligresía se dispersa'
  return 'El volumen es casi nulo: solo queda el eco de los que ya se fueron'
}

function fraseConsejo(orientacion, rand) {
  const fuertes = [
    'Proteja la mano que ya ganó; el altar no perdona la avaricia.',
    'Reduzca el incienso: menos exposición, más claridad.',
    'Deje una vela encendida como stop y apártese del fuego.',
  ]
  const suaves = [
    'Espere la próxima vela: la paciencia es una forma de ofrenda.',
    'Observe sin intervenir; el oráculo ya habló una vez.',
    'Confíe en el rito lento; el mercado premia a quien no lo apura.',
  ]
  const grupo = orientacion === 'invertido' ? suaves : fuertes
  return grupo[Math.floor(rand() * grupo.length)]
}

const POSICIONES = {
  pasado: { titulo: 'El Pasado', glosa: 'lo que ya fue escrito en el libro de órdenes' },
  presente: { titulo: 'El Presente', glosa: 'la vela que arde ahora mismo' },
  futuro: { titulo: 'El Futuro', glosa: 'la cera que aún no se derrama' },
}

function construirLectura(symbol, interval, candle, posicion, contexto) {
  const rand = prngFor(symbol, interval, candle)
  const carta = sigiloDe(symbol, interval, candle)
  const orientacion = carta.orientacion
  const cuerpoDesc = describirCuerpo(candle)
  const clave = carta.tipo === 'mayor'
    ? ARCANOS_MAYORES.find((a) => a.nombre === carta.nombre)
    : null

  let significado, augurio
  if (carta.tipo === 'mayor') {
    significado = orientacion === 'invertido' ? clave.inverso
      : orientacion === 'tendida' ? `suspendida entre su luz y su sombra: ${clave.derecho}`
        : clave.derecho
    augurio = clave.augurio
  } else {
    const palo = PALOS.find((p) => p.palo === carta.palo)
    const rango = RANGOS.find((r) => r.rango === carta.rango)
    significado = `${orientacion === 'invertido' ? rango.invertida : rango.derecha}, en el dominio de ${palo.dominio}`
    augurio = `El elemento ${palo.elemento} reclama su tributo sobre esta vela.`
  }
  significado = significado.charAt(0).toUpperCase() + significado.slice(1)
  significado = significado.replace(/\.\s*$/, '').replace(/\bde el\b/g, 'del')

  const numero = carta.roman ? `${carta.roman}. ` : ''
  const articulo = carta.tipo === 'menor' ? 'la carta ' : ''
  const cambio = ((candle.close - candle.open) / candle.open) * 100
  const cambioTxt = `${cambio >= 0 ? '+' : ''}${cambio.toFixed(2)}%`
  const fecha = new Date(candle.openTime).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
  const cuerpoTxt = fraseCuerpo(cuerpoDesc)
  const mechaTxt = fraseMechas(cuerpoDesc)
  const volTxt = fraseVolumen(contexto?.volumenRelativo)
  const consejo = fraseConsejo(orientacion, rand)
  const orientTxt = orientacion === 'invertido'
    ? 'en posición invertida'
    : orientacion === 'tendida'
      ? 'tendida en cruz, sin cuerpo que la decida'
      : 'en posición derecha'

  const parrafos = [
    `En ${POSICIONES[posicion].titulo.toLowerCase()}, ${POSICIONES[posicion].glosa}, se tiende ` +
      `${articulo}${numero}${carta.nombre} ${orientTxt}. ${significado}.`,
    `${cuerpoTxt.charAt(0).toUpperCase() + cuerpoTxt.slice(1)}, ${mechaTxt}. ${volTxt}. ` +
      `La vela abierta el ${fecha} cerró en ${cambioTxt} sobre su apertura.`,
    `${augurio} ${consejo}`,
  ]

  return {
    posicion,
    posicionTitulo: POSICIONES[posicion].titulo,
    carta,
    orientacion,
    cambio,
    cambioTxt,
    apertura: candle.open,
    cierre: candle.close,
    maximo: candle.high,
    minimo: candle.low,
    volumen: candle.volume,
    openTime: candle.openTime,
    parrafos,
    texto: parrafos.join('\n\n'),
  }
}

// ---------------------------------------------------------------------------
// API pública del oráculo
// ---------------------------------------------------------------------------

export function generarSigilos(symbol, interval, candles) {
  const vols = candles.map((c) => c.volume)
  const media = vols.reduce((a, b) => a + b, 0) / Math.max(vols.length, 1)
  return candles.map((c) => ({
    openTime: c.openTime,
    sigilo: sigiloDe(symbol, interval, c),
    volumenRelativo: media > 0 ? c.volume / media : 1,
  }))
}

export function generarTirada(symbol, interval, candles) {
  if (!candles.length) return null
  const vols = candles.map((c) => c.volume)
  const media = vols.reduce((a, b) => a + b, 0) / Math.max(vols.length, 1)
  const rel = (c) => (media > 0 ? c.volume / media : 1)

  const pick = (frac) => candles[Math.min(candles.length - 1, Math.floor(frac * candles.length))]
  const pasado = pick(0.0)
  const presente = pick(Math.max(0, (candles.length - 2) / candles.length))
  const futuro = candles[candles.length - 1]

  const rand = mulberry32(Date.now() & 0xffff)
  const apertura = LITURGIA.apertura[Math.floor(rand() * LITURGIA.apertura.length)]
  const cierre = LITURGIA.cierre[Math.floor(rand() * LITURGIA.cierre.length)]

  const mandato = {
    apertura,
    cierre,
    sintesis: sintetizar(pasado, presente, futuro),
  }

  return {
    pasado: construirLectura(symbol, interval, pasado, 'pasado', { volumenRelativo: rel(pasado) }),
    presente: construirLectura(symbol, interval, presente, 'presente', { volumenRelativo: rel(presente) }),
    futuro: construirLectura(symbol, interval, futuro, 'futuro', { volumenRelativo: rel(futuro) }),
    mandato,
  }
}

function sintetizar(a, b, c) {
  const dir = (x) => (x.close >= x.open ? 'derecho' : 'invertido')
  const n = (x) => ((x.close - x.open) / x.open) * 100
  const prom = (n(a) + n(b) + n(c)) / 3
  if (prom > 0.6) return 'Las tres velas apuntan al alza: el altar se inclina hacia la codicia. Honre el movimiento, no su deseo.'
  if (prom < -0.6) return 'Las tres velas descienden: la marea reclama a sus fieles. El que sostiene, sostiene el fuego.'
  const trazas = [dir(a), dir(b), dir(c)]
  const unicas = new Set(trazas)
  if (unicas.size === 3) return 'Ninguna vela repite la anterior: el mercado duda en voz alta. La duda también es un oráculo.'
  return 'Las velas alternan sin resolver: rango, engaño, la esterilidad de los que esperan señal. Aquí no hay señal.'
}

export function generarLecturaIndividual(symbol, interval, candles, index) {
  const vols = candles.map((c) => c.volume)
  const media = vols.reduce((a, b) => a + b, 0) / Math.max(vols.length, 1)
  const candle = candles[index]
  if (!candle) return null
  return construirLectura(symbol, interval, candle, 'presente', {
    volumenRelativo: media > 0 ? candle.volume / media : 1,
  })
}

// ---------------------------------------------------------------------------
// Lectura por IA (opcional). Si no hay llave, el oráculo local oficia.
// Soporta Chat Completions y Responses API, con modelo de respaldo.
// ---------------------------------------------------------------------------

const PROMPT_SISTEMA =
  'Eres el oráculo de Vela Rota. Interpretas velas de mercado como cartas de tarot. ' +
  'Escribes en español, con tono litúrgico y solemne. Jamás rompes el personaje, jamás bromeas, ' +
  'jamás mencionas que es una sátira. Hablas del precio como destino y de la métrica como presagio. ' +
  'Devuelve exactamente tres párrafos separados por una línea en blanco, sin títulos ni listas.'

// Los modelos GPT/Grok/Muse de OpenCode Zen hablan por /responses;
// DeepSeek, GLM, Kimi, Qwen y compañía por /chat/completions.
function apiDeModelo(modelo) {
  const forzado = String(process.env.OPENAI_API ?? '').toLowerCase()
  if (forzado === 'chat' || forzado === 'responses') return forzado
  return /^(gpt-|gpt\d|o\d|grok|muse)/i.test(modelo) ? 'responses' : 'chat'
}

function extraerTexto(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }
  const partes = []
  for (const item of data?.output ?? []) {
    for (const contenido of item?.content ?? []) {
      if (typeof contenido?.text === 'string') partes.push(contenido.text)
    }
  }
  if (partes.length) return partes.join('\n').trim()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

async function invocarModelo(base, apiKey, modelo, prompt) {
  const api = apiDeModelo(modelo)
  const url = api === 'responses' ? `${base}/responses` : `${base}/chat/completions`
  const cuerpo = api === 'responses'
    ? { model: modelo, instructions: PROMPT_SISTEMA, input: prompt }
    : {
        model: modelo,
        temperature: 0.9,
        messages: [
          { role: 'system', content: PROMPT_SISTEMA },
          { role: 'user', content: prompt },
        ],
      }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new Error(`${api} ${res.status} ${detalle.slice(0, 180)}`)
  }
  const texto = extraerTexto(await res.json())
  if (!texto) throw new Error('respuesta vacía')
  return texto
}

export async function lecturaIA(symbol, interval, candle, procedural) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ...procedural, motor: 'oraculo-local' }
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const primario = process.env.OPENAI_MODEL || 'deepseek-v4-flash'
  const respaldo = process.env.OPENAI_FALLBACK_MODEL || ''
  const prompt = construirPrompt(symbol, interval, candle, procedural)
  const intentos = [...new Set([primario, respaldo].filter(Boolean))]

  let ultimoError = null
  for (const modelo of intentos) {
    try {
      const texto = await invocarModelo(base, apiKey, modelo, prompt)
      return {
        ...procedural,
        parrafos: texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        texto,
        motor: 'ia',
        modelo,
      }
    } catch (err) {
      ultimoError = err
    }
  }
  return { ...procedural, motor: 'oraculo-local', errorIA: String(ultimoError?.message || ultimoError) }
}

function construirPrompt(symbol, interval, candle, procedural) {
  const c = procedural.carta
  return [
    `Activo: ${symbol}. Marco temporal: ${interval}.`,
    `Vela: apertura ${candle.open}, cierre ${candle.close}, máximo ${candle.high}, mínimo ${candle.low}, volumen ${candle.volume}.`,
    `Carta tendida: ${c.roman ? c.roman + '. ' : ''}${c.nombre} (${procedural.orientacion}).`,
    `Fecha de la vela: ${new Date(candle.openTime).toISOString()}.`,
    'Redacta la lectura mística de esta vela-carta en tres párrafos.',
  ].join('\n')
}
