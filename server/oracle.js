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
  if (cuerpo < 0.08) return 'cuerpo casi inexistente, sin dirección clara'
  if (cuerpo < 0.3) return 'cuerpo pequeño, movimiento indeciso'
  if (cuerpo < 0.6) return 'cuerpo medio, movimiento moderado'
  if (cuerpo < 0.85) return 'cuerpo grande, movimiento firme'
  return 'cuerpo muy grande, casi toda la vela en un solo sentido'
}

function fraseMechas({ mechaSup, mechaInf }) {
  const partes = []
  if (mechaSup > 0.55) partes.push('una mecha superior larga')
  else if (mechaSup > 0.3) partes.push('una mecha superior moderada')
  else if (mechaSup < 0.05) partes.push('sin mecha superior')
  if (mechaInf > 0.55) partes.push('una mecha inferior larga')
  else if (mechaInf > 0.3) partes.push('una mecha inferior moderada')
  else if (mechaInf < 0.05) partes.push('sin mecha inferior')
  if (!partes.length) return 'mechas equilibradas'
  return partes.join(' y ')
}

function fraseVolumen(rel) {
  if (rel == null) return 'volumen sin dato'
  if (rel > 2) return 'volumen muy por encima de la media'
  if (rel > 1.35) return 'volumen por encima de la media'
  if (rel > 0.8) return 'volumen normal'
  if (rel > 0.45) return 'volumen bajo'
  return 'volumen muy bajo'
}

function fraseConsejo(orientacion, rand) {
  const fuertes = [
    'Protege la ganancia ya obtenida.',
    'Reduce la exposición.',
    'Coloca un límite de pérdidas.',
  ]
  const suaves = [
    'Espera a la siguiente vela.',
    'Observa sin actuar.',
    'No fuerces la operación.',
  ]
  const grupo = orientacion === 'invertido' ? suaves : fuertes
  return grupo[Math.floor(rand() * grupo.length)]
}

const POSICIONES = {
  pasado: { titulo: 'El Pasado', glosa: 'lo que ya ocurrió' },
  presente: { titulo: 'El Presente', glosa: 'la vela actual' },
  futuro: { titulo: 'El Futuro', glosa: 'lo que viene' },
  obstaculo: { titulo: 'El Obstáculo', glosa: 'lo que se interpone' },
  entorno: { titulo: 'El Entorno', glosa: 'lo que rodea la situación' },
  consejo: { titulo: 'El Consejo', glosa: 'qué conviene hacer' },
  resultado: { titulo: 'El Resultado', glosa: 'el desenlace' },
  respuesta: { titulo: 'La Respuesta', glosa: 'lo que concede o niega' },
  dia: { titulo: 'La Carta del Día', glosa: 'lo que rige la jornada' },
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
    augurio = `Palo de ${palo.palo}, elemento ${palo.elemento}.`
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
      ? 'tendida, sin dirección'
      : 'en posición derecha'

  const parrafos = [
    `En ${POSICIONES[posicion].titulo.toLowerCase()}, ${POSICIONES[posicion].glosa}, se tiende ` +
      `${articulo}${numero}${carta.nombre} ${orientTxt}. ${significado}.`,
    `${cuerpoTxt.charAt(0).toUpperCase() + cuerpoTxt.slice(1)}, ${mechaTxt}. ` +
      `${volTxt.charAt(0).toUpperCase() + volTxt.slice(1)}. ` +
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
    indice: contexto?.indice ?? null,
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

const MODOS_TIRADA = {
  tiempo: ['pasado', 'presente', 'futuro'],
  cruz: ['presente', 'obstaculo', 'pasado', 'futuro', 'resultado'],
  herradura: ['pasado', 'presente', 'futuro', 'obstaculo', 'entorno', 'consejo', 'resultado'],
  si_no: ['respuesta'],
  dia: ['dia'],
}

function indicesDeTirada(n, modo) {
  const clamp = (i) => Math.max(0, Math.min(n - 1, i))
  if (modo === 'si_no' || modo === 'dia') return [n - 1]
  if (modo === 'herradura') {
    return [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1].map((f) => clamp(Math.round(f * (n - 1))))
  }
  if (modo === 'cruz') {
    return [clamp(n - 2), clamp(Math.floor(n * 0.3)), 0, clamp(Math.floor(n * 0.7)), n - 1]
  }
  return [0, clamp(n - 2), n - 1]
}

export function generarTirada(symbol, interval, candles, modo = 'tiempo', pregunta = '') {
  if (!candles.length) return null
  const modoLimpio = MODOS_TIRADA[modo] ? modo : 'tiempo'
  const indices = indicesDeTirada(candles.length, modoLimpio)
  const vols = candles.map((c) => c.volume)
  const media = vols.reduce((a, b) => a + b, 0) / Math.max(vols.length, 1)

  const rand = mulberry32(Date.now() & 0xffff)
  const apertura = LITURGIA.apertura[Math.floor(rand() * LITURGIA.apertura.length)]
  const cierre = LITURGIA.cierre[Math.floor(rand() * LITURGIA.cierre.length)]

  const cartas = MODOS_TIRADA[modoLimpio].map((posicion, k) => {
    const idx = indices[k]
    const vela = candles[idx]
    return construirLectura(symbol, interval, vela, posicion, {
      indice: idx,
      volumenRelativo: media > 0 ? vela.volume / media : 1,
    })
  })

  const mandato = {
    apertura,
    cierre,
    pregunta: pregunta?.trim() ? pregunta.trim() : null,
    sintesis: sintetizarVarias(indices.map((i) => candles[i])),
    analisis: analizarTirada(cartas, modoLimpio),
  }

  return { modo: modoLimpio, cartas, mandato }
}

function sintetizarVarias(velas) {
  if (!velas.length) return ''
  const n = (x) => ((x.close - x.open) / x.open) * 100
  const prom = velas.reduce((a, v) => a + n(v), 0) / velas.length
  if (prom > 0.6) return 'La serie apunta al alza: mandan los compradores.'
  if (prom < -0.6) return 'La serie cae: mandan los vendedores.'
  const unicas = new Set(velas.map((v) => (v.close >= v.open ? 'derecho' : 'invertido')))
  if (unicas.size === velas.length) return 'Ninguna vela repite dirección: el mercado no se decide.'
  return 'La serie alterna sin una dirección clara.'
}

// Lectura relacional: qué dicen las cartas entre sí.
function analizarTirada(cartas, modo) {
  const total = cartas.length
  const mayores = cartas.filter((c) => c.carta.tipo === 'mayor').length
  const invertidas = cartas.filter((c) => c.orientacion === 'invertido').length
  const tendidas = cartas.filter((c) => c.orientacion === 'tendida').length
  const elementos = { Fuego: 0, Agua: 0, Aire: 0, Tierra: 0 }
  const palos = { Bastos: 0, Copas: 0, Espadas: 0, Oros: 0 }
  for (const c of cartas) {
    elementos[c.carta.elemento] = (elementos[c.carta.elemento] || 0) + 1
    if (c.carta.tipo === 'menor') palos[c.carta.palo] = (palos[c.carta.palo] || 0) + 1
  }
  const domElem = Object.entries(elementos).sort((a, b) => b[1] - a[1])[0][0]
  const domPalo = Object.entries(palos).sort((a, b) => b[1] - a[1])[0]
  const frases = []

  if (total === 1) {
    frases.push(
      mayores === 1
        ? 'Es un Arcano Mayor: la tirada marca un momento importante.'
        : 'Es una carta menor: un asunto del día a día.',
    )
  } else if (mayores >= Math.ceil(total / 2)) {
    frases.push(`Hay ${mayores} Arcanos Mayores de ${total}: la tirada es relevante.`)
  } else if (mayores === 0) {
    frases.push('Sin Arcanos Mayores: un asunto ordinario.')
  } else {
    frases.push(`Hay ${mayores} Arcanos Mayores de ${total}.`)
  }

  if (invertidas === 0) {
    frases.push('Sin cartas invertidas.')
  } else if (invertidas >= Math.ceil(total / 2)) {
    frases.push(`${invertidas} ${invertidas === 1 ? 'carta invertida' : 'cartas invertidas'}: lectura con obstáculos.`)
  } else {
    frases.push(`${invertidas} ${invertidas === 1 ? 'carta invertida' : 'cartas invertidas'}.`)
  }

  if (tendidas) {
    frases.push(`${tendidas} ${tendidas === 1 ? 'carta tendida' : 'cartas tendidas'}: sin dirección.`)
  }

  if (modo !== 'si_no' && modo !== 'dia') {
    frases.push(`Domina el elemento ${domElem}${domPalo[1] > 0 ? ` (casa de ${domPalo[0]})` : ''}.`)
  }

  if (modo === 'si_no') {
    const c = cartas[0]
    const si = c.orientacion !== 'invertido'
    frases.push(`${si ? 'La carta responde sí' : 'La carta responde no'}: ${c.carta.nombre}${si ? ', en posición derecha' : ', invertida'}.`)
  }

  return {
    total,
    mayores,
    invertidas,
    tendidas,
    elementos,
    palos,
    elemento: domElem,
    palo: domPalo[0],
    texto: frases.join(' '),
  }
}

// Clima del mazo: el temperamento de toda la serie.
export function climaDelMazo(sigilos) {
  const total = sigilos.length || 1
  const elementos = { Fuego: 0, Agua: 0, Aire: 0, Tierra: 0 }
  const palos = { Bastos: 0, Copas: 0, Espadas: 0, Oros: 0 }
  let mayores = 0
  let invertidas = 0
  let tendidas = 0
  for (const { sigilo } of sigilos) {
    if (sigilo.tipo === 'mayor') mayores++
    else {
      elementos[sigilo.elemento] = (elementos[sigilo.elemento] || 0) + 1
      palos[sigilo.palo] = (palos[sigilo.palo] || 0) + 1
    }
    if (sigilo.orientacion === 'invertido') invertidas++
    if (sigilo.orientacion === 'tendida') tendidas++
  }
  const domElem = Object.entries(elementos).sort((a, b) => b[1] - a[1])[0]
  const domPalo = Object.entries(palos).sort((a, b) => b[1] - a[1])[0]
  const pctInv = invertidas / total
  const tono = pctInv > 0.55
    ? 'Predominan las cartas invertidas.'
    : pctInv < 0.3
      ? 'Predominan las cartas derechas.'
      : 'Cartas derechas e invertidas por igual.'
  const texto =
    `Sobre ${total} velas domina ${domPalo[0]} (elemento ${domElem[0]}); ` +
    `hay ${mayores} Arcanos Mayores y ${invertidas} cartas invertidas. ${tono}`
  return { total, mayores, invertidas, tendidas, elementos, palos, palo: domPalo[0], elemento: domElem[0], texto }
}

export function volatilidad(candles) {
  if (!candles.length) return { global: 0.25, ultima: 0.25, direccion: 0 }
  const recientes = candles.slice(-14)
  const atr = recientes.reduce((a, c) => a + (c.high - c.low) / c.close, 0) / recientes.length
  const ultima = candles[candles.length - 1]
  const rangoUltima = (ultima.high - ultima.low) / ultima.close
  return {
    global: limitar01(atr / 0.05),
    ultima: limitar01(rangoUltima / 0.05),
    direccion: ultima.close >= ultima.open ? 1 : -1,
  }
}

function limitar01(x) {
  return Math.round(Math.max(0, Math.min(1, x)) * 1000) / 1000
}

export function generarLecturaIndividual(symbol, interval, candles, index, pregunta = '') {
  const vols = candles.map((c) => c.volume)
  const media = vols.reduce((a, b) => a + b, 0) / Math.max(vols.length, 1)
  const candle = candles[index]
  if (!candle) return null
  const lectura = construirLectura(symbol, interval, candle, 'presente', {
    indice: index,
    volumenRelativo: media > 0 ? candle.volume / media : 1,
  })
  lectura.pregunta = pregunta?.trim() ? pregunta.trim() : null
  return lectura
}

// ---------------------------------------------------------------------------
// Lectura por IA (opcional). Si no hay llave, el oráculo local oficia.
// Soporta Chat Completions y Responses API, con modelo de respaldo.
// ---------------------------------------------------------------------------

const PROMPT_SISTEMA =
  'Eres el oráculo de Wickfable. Lees velas de mercado como cartas de tarot. ' +
  'Escribes en español, con frases cortas y directas, sin adornos ni metáforas. ' +
  'No rompes el personaje y no bromeas. Interpreta cada vela con claridad. ' +
  'Devuelve exactamente tres párrafos separados por una línea en blanco, sin títulos ni listas.'

const cacheLecturas = new Map()
const CACHE_LECT = 10 * 60_000

function claveLectura(symbol, interval, candle, pregunta) {
  return `${symbol}|${interval}|${candle.openTime}|${pregunta || ''}`
}

// Quita preámbulos y adornos que el modelo a veces agrega.
function limpiarProsa(texto) {
  return String(texto || '')
    .replace(/\r/g, '')
    .replace(/^\s*(?:aqu[ií]\s+tienes[^.:\n]*[:.-]?\s*|claro[,:]\s*)/i, '')
    .replace(/[*_#`>]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// Sanea el inicio del torrente sin romper el streaming.
function saneadorDeFlujo(emitir) {
  let buffer = ''
  let libre = false
  const fn = (trozo) => {
    if (libre) return emitir(trozo)
    buffer += trozo
    if (buffer.length < 48 && !/[\n.]/.test(buffer)) return
    buffer = limpiarProsa(buffer)
    libre = true
    if (buffer) emitir(buffer)
  }
  fn.flush = () => {
    if (!libre) {
      buffer = limpiarProsa(buffer)
      libre = true
      if (buffer) emitir(buffer)
    }
  }
  return fn
}

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
  const clave = claveLectura(symbol, interval, candle, procedural.pregunta)
  const guardada = cacheLecturas.get(clave)
  if (guardada && Date.now() - guardada.t < CACHE_LECT) {
    return {
      ...procedural,
      parrafos: guardada.texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      texto: guardada.texto,
      motor: 'ia',
      modelo: guardada.modelo,
      cache: true,
    }
  }

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const primario = process.env.OPENAI_MODEL || 'deepseek-v4-flash'
  const respaldo = process.env.OPENAI_FALLBACK_MODEL || ''
  const prompt = construirPrompt(symbol, interval, candle, procedural)
  const intentos = [...new Set([primario, respaldo].filter(Boolean))]

  let ultimoError = null
  for (const modelo of intentos) {
    try {
      const texto = limpiarProsa(await invocarModelo(base, apiKey, modelo, prompt))
      if (!texto) throw new Error('respuesta vacía')
      cacheLecturas.set(clave, { t: Date.now(), texto, modelo })
      if (cacheLecturas.size > 60) cacheLecturas.delete(cacheLecturas.keys().next().value)
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
  const lineas = [
    `Activo: ${symbol}. Marco temporal: ${interval}.`,
    `Vela: apertura ${candle.open}, cierre ${candle.close}, máximo ${candle.high}, mínimo ${candle.low}, volumen ${candle.volume}.`,
    `Carta tendida: ${c.roman ? c.roman + '. ' : ''}${c.nombre} (${procedural.orientacion}).`,
    `Fecha de la vela: ${new Date(candle.openTime).toISOString()}.`,
  ]
  if (procedural.pregunta) {
    lineas.push(`El fiel pregunta al altar: «${procedural.pregunta}». Responde a esa pregunta desde la carta.`)
  }
  lineas.push('Redacta la lectura mística de esta vela-carta en tres párrafos.')
  return lineas.join('\n')
}

// ---------------------------------------------------------------------------
// Lectura en streaming: el oráculo escribe en tiempo real.
// ---------------------------------------------------------------------------

async function* flujoModelo(base, apiKey, modelo, prompt, system, signal) {
  const api = apiDeModelo(modelo)
  const url = api === 'responses' ? `${base}/responses` : `${base}/chat/completions`
  const cuerpo = api === 'responses'
    ? { model: modelo, instructions: system, input: prompt, stream: true }
    : {
        model: modelo,
        temperature: 0.9,
        stream: true,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(cuerpo),
    signal: signal || AbortSignal.timeout(45_000),
  })
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new Error(`${api} ${res.status} ${detalle.slice(0, 180)}`)
  }
  if (!res.body) throw new Error('sin cuerpo de streaming')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lineas = buffer.split('\n')
    buffer = lineas.pop() ?? ''
    for (const linea of lineas) {
      const t = linea.trim()
      if (!t.startsWith('data:')) continue
      const data = t.slice(5).trim()
      if (!data || data === '[DONE]') continue
      let json
      try {
        json = JSON.parse(data)
      } catch {
        continue
      }
      const trozo = api === 'responses'
        ? json.type === 'response.output_text.delta' ? json.delta : ''
        : json.choices?.[0]?.delta?.content || ''
      if (trozo) yield trozo
    }
  }
}

export async function* transmitirTexto({ prompt, system = PROMPT_SISTEMA, signal, onModelo } = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('sin llave')
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const primario = process.env.OPENAI_MODEL || 'deepseek-v4-flash'
  const respaldo = process.env.OPENAI_FALLBACK_MODEL || ''
  const intentos = [...new Set([primario, respaldo].filter(Boolean))]

  let ultimoError = null
  for (const modelo of intentos) {
    let emitido = false
    try {
      for await (const trozo of flujoModelo(base, apiKey, modelo, prompt, system, signal)) {
        if (!emitido) {
          emitido = true
          onModelo?.(modelo)
        }
        yield trozo
      }
      return
    } catch (err) {
      ultimoError = err
      if (emitido) throw err
    }
  }
  throw ultimoError || new Error('sin modelos disponibles')
}

export async function lecturaIAStream(symbol, interval, candle, procedural, { onChunk, signal } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    return volcarProcedural(procedural, onChunk, 150)
  }

  const clave = claveLectura(symbol, interval, candle, procedural.pregunta)
  const guardada = cacheLecturas.get(clave)
  if (guardada && Date.now() - guardada.t < CACHE_LECT) {
    for (const parrafo of guardada.texto.split(/\n\s*\n/)) {
      onChunk?.(parrafo + '\n\n')
      await dormir(120)
    }
    return { motor: 'ia', modelo: guardada.modelo, cache: true }
  }

  const prompt = construirPrompt(symbol, interval, candle, procedural)
  const emitir = saneadorDeFlujo((t) => onChunk?.(t))
  let modelo = null
  let emitido = false
  let bruto = ''
  try {
    for await (const trozo of transmitirTexto({ prompt, signal, onModelo: (m) => { modelo = m } })) {
      emitido = true
      bruto += trozo
      emitir(trozo)
    }
    emitir.flush()
  } catch (err) {
    emitir.flush()
    if (emitido) {
      onChunk?.('\n\n[la generación se interrumpió]')
      return { motor: 'ia', modelo, error: String(err?.message || err) }
    }
    const info = await volcarProcedural(procedural, onChunk, 120)
    return { ...info, errorIA: String(err?.message || err) }
  }

  const limpio = limpiarProsa(bruto)
  if (limpio) {
    cacheLecturas.set(clave, { t: Date.now(), texto: limpio, modelo })
    if (cacheLecturas.size > 60) cacheLecturas.delete(cacheLecturas.keys().next().value)
    return { motor: 'ia', modelo }
  }
  return volcarProcedural(procedural, onChunk, 120)
}

async function volcarProcedural(procedural, onChunk, pausa) {
  for (const parrafo of procedural.parrafos) {
    onChunk?.(parrafo + '\n\n')
    await dormir(pausa)
  }
  return { motor: 'oraculo-local' }
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
