// La Crónica: el vaivén del precio se convierte en una saga por actos.
// Cada vela es un ánimo; cada ánimo empuja la historia que ya venía.

import { transmitirTexto } from './oracle.js'

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI']

export const GENEROS = {
  epico: {
    nombre: 'Épico',
    estilo: 'fantasía heroica',
    aliados: ['Bruma', 'Tobías', 'el Juglar Ciego', 'Halvard', 'la Doncella de Hierro'],
    objetos: ['una corona partida', 'un estandarte raído', 'una espada sin nombre', 'un cuerno de guerra'],
    lugares: ['la Ciudadela', 'el Paso del Norte', 'el Puerto Gris', 'las Llanuras de Sal'],
  },
  noir: {
    nombre: 'Noir',
    estilo: 'novela negra',
    aliados: ['Vera', 'el Gordo Sal', 'la Cantante', 'el Sargento Ruiz'],
    objetos: ['una pistola con una sola bala', 'un expediente manchado', 'una llave de habitación'],
    lugares: ['el Bar La Última', 'el Muelle 7', 'la Comisaría Vieja', 'el Hotel Rialto'],
  },
  lovecraft: {
    nombre: 'Horror cósmico',
    estilo: 'terror',
    aliados: ['el Bibliotecario', 'el Farero', 'Hester', 'la Expedición de Miskatonic'],
    objetos: ['un tomo encuadernado en piel', 'un amuleto de obsidiana', 'un espejo que no refleja'],
    lugares: ['Innsmouth', 'el Arrecife Sumergido', 'la Casa Marchita', 'el Faro Nuevo'],
  },
  western: {
    nombre: 'Western',
    estilo: 'oeste',
    aliados: ['Cassidy', 'el Predicador', 'Nube Roja', 'la Viuda Dawson'],
    objetos: ['un revólver de seis tiros', 'una recompensa arrugada', 'un caballo cojo'],
    lugares: ['Tombstone Flats', 'el Cañón Rojo', 'la Frontera', 'el Saloon del Fin'],
  },
  cyberpunk: {
    nombre: 'Cyberpunk',
    estilo: 'ciencia ficción',
    aliados: ['Vex', 'Nube', 'Kira-9', 'el Fixer'],
    objetos: ['un implante robado', 'un chip cifrado', 'un dron de bolsillo'],
    lugares: ['el Sector Bajo', 'la Torre Delta', 'el Mercado de Carne', 'los Muelles de Datos'],
  },
  tragedia: {
    nombre: 'Tragedia griega',
    estilo: 'tragedia',
    aliados: ['el Coro', 'Tiresias', 'Antígona', 'el Mensajero'],
    objetos: ['una máscara de oro', 'un oráculo mal leído', 'una copa envenenada'],
    lugares: ['la Acrópolis', 'el Oráculo de Delfos', 'el Ágora', 'el Mar Egeo'],
  },
}

const MOODS = {
  mania: { titulo: 'La Manía', tono: 'euforia', glosa: 'la subida se desborda' },
  euforia: { titulo: 'La Euforia', tono: 'alegría', glosa: 'una subida clara' },
  ambicion: { titulo: 'La Ambición', tono: 'codicia', glosa: 'una subida moderada' },
  calma: { titulo: 'La Calma', tono: 'sosiego', glosa: 'apenas hay movimiento' },
  duda: { titulo: 'La Duda', tono: 'incertidumbre', glosa: 'movimiento lateral, sin dirección' },
  temor: { titulo: 'El Temor', tono: 'sombra', glosa: 'una bajada moderada' },
  panico: { titulo: 'El Pánico', tono: 'horror', glosa: 'una bajada fuerte' },
  ruina: { titulo: 'La Ruina', tono: 'tragedia', glosa: 'un desplome' },
  rechazo: { titulo: 'El Rechazo', tono: 'desdén', glosa: 'un rechazo en la parte alta' },
  rescate: { titulo: 'El Rescate', tono: 'esperanza', glosa: 'un rebote desde la parte baja' },
}

export function listarGeneros() {
  return Object.entries(GENEROS).map(([clave, g]) => ({ clave, nombre: g.nombre }))
}

// ---------------------------------------------------------------------------
// Análisis: dónde están los giros y qué ánimo tiene cada uno
// ---------------------------------------------------------------------------

export function analizarBeats(symbol, interval, candles, cap = 5, genero = 'epico') {
  const gen = GENEROS[genero] ? genero : 'epico'
  if (!candles.length) return { beats: [], trama: '', protagonista: '', genero: gen }

  const cambios = candles.map((c) => (c.close - c.open) / c.open)
  const media = cambios.reduce((a, b) => a + Math.abs(b), 0) / cambios.length
  const base = Math.max(media, 1e-6)
  const indices = seleccionarIndices(candles, cap, base)

  let posFuerte = -1
  let negFuerte = -1
  let maxZ = 0
  let minZ = 0
  indices.forEach((idx, k) => {
    const z = cambios[idx] / base
    if (z > maxZ) {
      maxZ = z
      posFuerte = k
    }
    if (z < minZ) {
      minZ = z
      negFuerte = k
    }
  })

  let estado = estadoInicial()
  const beats = indices.map((indice, k) => {
    const c = candles[indice]
    const cambio = cambios[indice]
    const mood = clasificar(c, cambio / base)
    estado = evolucionarEstado(estado, mood, gen, indice)
    return {
      indice,
      acto: `Acto ${ROMANOS[k] || k + 1}`,
      mood,
      titulo: MOODS[mood].titulo,
      tono: MOODS[mood].tono,
      glosa: MOODS[mood].glosa,
      funcion: funcionNarrativa(k, indices.length, mood, posFuerte, negFuerte),
      cambio,
      cambioTxt: `${cambio >= 0 ? '+' : ''}${(cambio * 100).toFixed(2)}%`,
      apertura: c.open,
      cierre: c.close,
      maximo: c.high,
      minimo: c.low,
      volumen: c.volume,
      openTime: c.openTime,
      estado,
    }
  })

  return { beats, trama: tramar(cambios), protagonista: protagonista(symbol, gen), genero: gen }
}

function seleccionarIndices(candles, cap, base) {
  const n = candles.length
  if (n <= cap) return Array.from({ length: n }, (_, i) => i)
  const puntaje = candles.map((c, i) => {
    const z = Math.abs((c.close - c.open) / c.open) / base
    const rango = (c.high - c.low) / c.close
    const pivote = esPivote(candles, i) ? 1.5 : 0
    const borde = i === 0 || i === n - 1 ? 2 : 0
    return z + rango * 2 + pivote + borde
  })
  const elegidos = new Set([0, n - 1])
  const orden = candles.map((_, i) => i).sort((a, b) => puntaje[b] - puntaje[a])
  for (const i of orden) {
    if (elegidos.size >= cap) break
    elegidos.add(i)
  }
  return [...elegidos].sort((a, b) => a - b)
}

function esPivote(candles, i) {
  const v = candles[i]
  const izq = candles[i - 1]
  const der = candles[i + 1]
  if (!izq || !der) return false
  return (v.high >= izq.high && v.high >= der.high) || (v.low <= izq.low && v.low <= der.low)
}

function clasificar(c, z) {
  const rango = Math.max(c.high - c.low, 1e-12)
  const mechaSup = (c.high - Math.max(c.open, c.close)) / rango
  const mechaInf = (Math.min(c.open, c.close) - c.low) / rango
  if (z > 3) return 'mania'
  if (z > 1.8) return 'euforia'
  if (z > 0.8) return 'ambicion'
  if (z < -3) return 'ruina'
  if (z < -1.8) return 'panico'
  if (z < -0.8) return 'temor'
  if (mechaSup > 0.55) return 'rechazo'
  if (mechaInf > 0.55) return 'rescate'
  return 'calma'
}

function funcionNarrativa(k, total, mood, posFuerte, negFuerte) {
  if (k === 0) return 'Planteo'
  if (k === total - 1) return 'Desenlace'
  if (k === posFuerte) return 'Clímax'
  if (k === negFuerte) return 'Catástrofe'
  if (mood === 'rescate') return 'Vuelta'
  if (mood === 'temor' || mood === 'duda' || mood === 'rechazo') return 'Tensión'
  if (mood === 'mania' || mood === 'euforia' || mood === 'ambicion') return 'Ascenso'
  return 'Nudo'
}

function tramar(cambios) {
  const total = cambios.reduce((a, b) => a + b, 0)
  if (total > cambios.length * 0.01) return 'La serie sube de principio a fin.'
  if (total < -cambios.length * 0.01) return 'La serie baja de principio a fin.'
  return 'La serie sube y baja sin una tendencia clara.'
}

function protagonista(symbol, genero) {
  const base = String(symbol).replace(/USDT$/, '').replace(/-USD$/, '')
  const nombres = {
    noir: `${base}, un detective sin suerte`,
    lovecraft: `el testigo de ${base}`,
    western: `${base}, forajido de frontera`,
    cyberpunk: `${base}, corredor del Sector Bajo`,
    tragedia: `${base}, héroe trágico`,
    epico: `el caballero de ${base}`,
  }
  return nombres[genero] || `el caballero de ${base}`
}

// El sujeto con el que narra la prosa, según el género.
function sujeto(genero) {
  const sujetos = {
    epico: 'el caballero',
    noir: 'el detective',
    lovecraft: 'el testigo',
    western: 'el forajido',
    cyberpunk: 'el corredor',
    tragedia: 'el héroe',
  }
  return sujetos[genero] || 'el caballero'
}

function minuscula(texto) {
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// ---------------------------------------------------------------------------
// Estado de la saga: la contabilidad del mundo
// ---------------------------------------------------------------------------

function estadoInicial() {
  return { riqueza: 0, heridas: 0, deuda: 0, aliados: [], objetos: [], lugar: 'el umbral' }
}

function evolucionarEstado(estado, mood, genero, semilla) {
  const g = GENEROS[genero] || GENEROS.epico
  const elegir = (arr, sal) => arr[(semilla + sal) % arr.length]
  const e = { ...estado, aliados: [...estado.aliados], objetos: [...estado.objetos] }
  switch (mood) {
    case 'mania':
      e.riqueza += 40
      e.deuda += 30
      e.objetos.push(elegir(g.objetos, 0))
      break
    case 'euforia':
      e.riqueza += 25
      e.aliados.push(elegir(g.aliados, 1))
      break
    case 'ambicion':
      e.riqueza += 10
      e.deuda += 10
      break
    case 'calma':
      e.riqueza += 3
      break
    case 'duda':
      e.deuda += 4
      break
    case 'temor':
      e.riqueza -= 12
      e.heridas += 1
      break
    case 'panico':
      e.riqueza -= 25
      e.heridas += 2
      e.aliados.pop()
      break
    case 'ruina':
      e.riqueza = Math.floor(e.riqueza * 0.2)
      e.heridas += 3
      e.deuda += 25
      e.objetos.pop()
      break
    case 'rechazo':
      e.heridas += 1
      e.deuda += 8
      break
    case 'rescate':
      e.riqueza += 8
      e.heridas = Math.max(0, e.heridas - 1)
      e.aliados.push(elegir(g.aliados, 2))
      break
    default:
      break
  }
  e.riqueza = Math.max(0, e.riqueza)
  e.aliados = e.aliados.slice(-4)
  e.objetos = e.objetos.slice(-4)
  e.lugar = elegir(g.lugares, semilla)
  return e
}

export function resumenDeBeat(beat) {
  return {
    indice: beat.indice,
    acto: beat.acto,
    mood: beat.mood,
    titulo: beat.titulo,
    tono: beat.tono,
    glosa: beat.glosa,
    funcion: beat.funcion,
    cambio: beat.cambio,
    cambioTxt: beat.cambioTxt,
    apertura: beat.apertura,
    cierre: beat.cierre,
    maximo: beat.maximo,
    minimo: beat.minimo,
    volumen: beat.volumen,
    openTime: beat.openTime,
    estado: beat.estado,
  }
}

// ---------------------------------------------------------------------------
// El cronista: un acto por vez, cada uno continuando el anterior
// ---------------------------------------------------------------------------

const ESTILO_BASE =
  'Eres el cronista de Wickfable. Conviertes el movimiento del mercado en una historia de ficción. ' +
  'Escribes en español, con frases cortas y directas, sin adornos. No rompes el personaje y no explicas ' +
  'la metáfora del mercado. No menciones velas, gráficos, porcentajes ni dinero. ' +
  'Los personajes y objetos continúan de un acto al siguiente. ' +
  'Devuelve solo la prosa del acto, un único párrafo, sin títulos ni listas.'

const cache = new Map()
const CACHE_TTL = 15 * 60_000

export async function cronicaIAStream(beats, opciones = {}) {
  const {
    symbol,
    genero = 'epico',
    premisa = '',
    resumen = '',
    desde = 0,
    inicio = 0,
    signal,
    onCapitulo,
    onTrozo,
  } = opciones

  const narrables = beats.filter((b) => b.openTime > desde)
  const conIA = Boolean(process.env.OPENAI_API_KEY)
  let modelo = null
  let rodante = String(resumen || '').slice(-1000)
  const capitulos = []

  const fresco = desde === 0 && !resumen
  const clave = fresco ? claveCache(symbol, genero, premisa, beats) : null
  if (clave) {
    const guardado = cache.get(clave)
    if (guardado && Date.now() - guardado.t < CACHE_TTL) {
      for (const cap of guardado.capitulos) {
        onCapitulo?.(cap)
        if (cap.texto) {
          onTrozo?.({ indice: cap.indice, texto: cap.texto })
          await dormir(140)
        }
      }
      return { motor: guardado.motor, modelo: guardado.modelo, cache: true }
    }
  }

  for (let k = 0; k < narrables.length; k++) {
    const beat = narrables[k]
    const numero = inicio + k
    const etiqueta = `Acto ${ROMANOS[numero] || numero + 1}`
    const capitulo = { ...resumenDeBeat(beat), acto: etiqueta }
    onCapitulo?.(capitulo)

    let texto = ''
    if (conIA) {
      const prompt = construirPrompt({ symbol, genero, premisa, resumen: rodante, beat, numero, funcion: beat.funcion })
      try {
        for await (const trozo of transmitirTexto({
          prompt,
          system: `${ESTILO_BASE} Género: ${GENEROS[genero]?.nombre || 'Épico'}. ${GENEROS[genero]?.estilo || ''}`,
          signal,
          onModelo: (m) => {
            modelo = m
          },
        })) {
          texto += trozo
          onTrozo?.({ indice: beat.indice, texto: trozo })
        }
      } catch {
        if (texto) {
          onTrozo?.({ indice: beat.indice, texto: '\n\n[la generación se interrumpió]' })
        } else {
          texto = capituloProcedural(beat, numero, premisa, capitulos, genero)
          onTrozo?.({ indice: beat.indice, texto })
        }
      }
    } else {
      texto = capituloProcedural(beat, numero, premisa, capitulos, genero)
      onTrozo?.({ indice: beat.indice, texto })
      await dormir(220)
    }

    texto = limpiar(texto)
    if (texto) rodante = `${rodante} ${texto}`.trim().slice(-1000)
    capitulos.push({ ...capitulo, texto })
  }

  const info = { motor: conIA ? 'ia' : 'oraculo-local', modelo }
  if (clave && capitulos.length) {
    cache.set(clave, { t: Date.now(), capitulos, ...info })
    if (cache.size > 40) cache.delete(cache.keys().next().value)
  }
  return info
}

function claveCache(symbol, genero, premisa, beats) {
  return `${symbol}|${genero}|${premisa}|${beats.map((b) => b.openTime).join(',')}`
}

function construirPrompt({ symbol, genero, premisa, resumen, beat, numero, funcion }) {
  const g = GENEROS[genero] || GENEROS.epico
  const lineas = [`Obra: «La Crónica de ${symbol}», según el vaivén del precio.`]
  lineas.push(`Género: ${g.nombre}. ${g.estilo}.`)
  if (premisa) lineas.push(`Premisa del fiel, respétala: ${premisa}.`)
  if (numero === 0 && !resumen) {
    lineas.push('Este es el primer acto. Presenta al protagonista, el mundo y aquello que lo mueve.')
  } else {
    if (resumen) lineas.push(`Lo que ya ocurrió: ${resumen}`)
    lineas.push('Continúa la historia: lo narrado antes tiene consecuencias, y los personajes y objetos persisten.')
  }
  const e = beat.estado || {}
  const estado = [
    `riqueza ${e.riqueza ?? 0}`,
    `heridas ${e.heridas ?? 0}`,
    `deuda ${e.deuda ?? 0}`,
    e.lugar ? `lugar: ${e.lugar}` : '',
    e.aliados?.length ? `aliados: ${e.aliados.join(', ')}` : '',
    e.objetos?.length ? `objetos: ${e.objetos.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  lineas.push(`Estado del mundo: ${estado}.`)
  lineas.push(`Escribe únicamente este acto: función narrativa «${funcion}», ánimo «${beat.tono}». ${beat.glosa}.`)
  lineas.push('Un solo párrafo de tres a cuatro frases. Sin títulos, sin listas, sin explicaciones, sin cifras.')
  return lineas.join('\n')
}

function capituloProcedural(beat, numero, premisa, capitulos, genero) {
  const opciones = PLANTILLAS[beat.mood] || PLANTILLAS.calma
  const proto = sujeto(genero)
  let texto = opciones[numero % opciones.length].replaceAll('{proto}', proto)
  const anterior = capitulos[capitulos.length - 1]
  if (numero === 0 && premisa) {
    texto = `Cuentan que todo empezó con una promesa: ${premisa}. ${mayuscula(texto)}`
  } else if (anterior) {
    texto = `${ECOS[anterior.mood] || 'Más tarde,'} ${minuscula(texto)}`
  }
  return texto
}

// Limpia preámbulos y adornos que el modelo a veces agrega.
function limpiar(texto) {
  return String(texto || '')
    .replace(/\r/g, '')
    .replace(/^\s*(?:aqu[ií]\s+tienes[^.:\n]*[:.-]?\s*|claro[,:]\s*|acto\s+[ivxlc]+\s*[:.-]\s*)/i, '')
    .replace(/[*_#`>]+/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const ECOS = {
  mania: 'Después de la manía,',
  euforia: 'Después de la euforia,',
  ambicion: 'Después de la ambición,',
  calma: 'Después de la calma,',
  duda: 'Después de la duda,',
  temor: 'Después del temor,',
  panico: 'Después del pánico,',
  ruina: 'Después de la ruina,',
  rechazo: 'Después del rechazo,',
  rescate: 'Después del rescate,',
}

const PLANTILLAS = {
  mania: [
    'Todo subió sin control y {proto} creyó que no podía fallar. Los demás hicieron lo mismo, y nadie se detuvo a pensar.',
    '{proto} celebró antes de tiempo y gastó lo que no tenía. La euforia se contagió a todos los presentes.',
  ],
  euforia: [
    'Las cosas iban bien y {proto} se sintió aliviado. Los demás también lo notaron y se acercaron a él.',
    '{proto} pasó un buen rato y se permitió confiar. Todo parecía, por una vez, en su sitio.',
  ],
  ambicion: [
    '{proto} quiso más de lo que tenía. Aunque no hacía falta, dio un paso más.',
    '{proto} no se conformó con lo ganado y decidió seguir. No midió bien el coste de hacerlo.',
  ],
  calma: [
    'No pasó nada, y {proto} aprovechó para descansar. El día fue tranquilo y sin sobresaltos.',
    '{proto} se quedó quieto y esperó. A veces no hacer nada es lo correcto.',
  ],
  duda: [
    '{proto} no supo qué hacer y se quedó mirando. Las opciones eran varias y ninguna le convencía.',
    '{proto} cambió de opinión dos veces y al final no hizo nada.',
  ],
  temor: [
    '{proto} vio que algo iba mal y se puso a la defensiva. Guardó lo que pudo y se preparó.',
    'El ambiente se tensó y {proto} empezó a preocuparse. Prefirió no arriesgar.',
  ],
  panico: [
    'De pronto todos quisieron salir a la vez. {proto} perdió en la confusión parte de lo que tenía.',
    'La situación empeoró deprisa y {proto} actuó sin pensar. Luego lo lamentó.',
  ],
  ruina: [
    'Todo lo que {proto} había construido se vino abajo. Perdió la mayor parte y no pudo evitarlo.',
    '{proto} lo perdió casi todo de golpe. Le costó aceptar que no había vuelta atrás.',
  ],
  rechazo: [
    '{proto} intentó seguir subiendo y se topó con un muro. No pudo avanzar más.',
    'La parte alta no dejó pasar a {proto}. Dio media vuelta sin conseguir lo que buscaba.',
  ],
  rescate: [
    'Cuando parecía que {proto} se hundía, algo lo sostuvo. Salió del apuro, aunque no intacto.',
    '{proto} encontró ayuda cuando más la necesitaba. La situación dio un respiro.',
  ],
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
