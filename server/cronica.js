// La Crónica: el vaivén del precio se convierte en una saga por actos.
// Cada vela es un ánimo; cada ánimo empuja la historia que ya venía.

import { transmitirTexto } from './oracle.js'

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI']

export const GENEROS = {
  epico: {
    nombre: 'Épico',
    estilo: 'saga heroica de reinos, tormentas y juramentos; tono solemne y grandioso',
    aliados: ['Bruma', 'Tobías', 'el Juglar Ciego', 'Halvard', 'la Doncella de Hierro'],
    objetos: ['una corona partida', 'un estandarte raído', 'una espada sin nombre', 'un cuerno de guerra'],
    lugares: ['la Ciudadela', 'el Paso del Norte', 'el Puerto Gris', 'las Llanuras de Sal'],
  },
  noir: {
    nombre: 'Noir',
    estilo: 'novela negra de lluvia, deudas y traiciones; tono seco, cínico y nocturno',
    aliados: ['Vera', 'el Gordo Sal', 'la Cantante', 'el Sargento Ruiz'],
    objetos: ['una pistola con una sola bala', 'un expediente manchado', 'una llave de habitación'],
    lugares: ['el Bar La Última', 'el Muelle 7', 'la Comisaría Vieja', 'el Hotel Rialto'],
  },
  lovecraft: {
    nombre: 'Horror cósmico',
    estilo: 'cultos, abismos y locura; tono onírico y aterrador, de pesadilla lenta',
    aliados: ['el Bibliotecario', 'el Farero', 'Hester', 'la Expedición de Miskatonic'],
    objetos: ['un tomo encuadernado en piel', 'un amuleto de obsidiana', 'un espejo que no refleja'],
    lugares: ['Innsmouth', 'el Arrecife Sumergido', 'la Casa Marchita', 'el Faro Nuevo'],
  },
  western: {
    nombre: 'Western',
    estilo: 'frontera de forajidos, polvo y venganza; tono áspero y cansado',
    aliados: ['Cassidy', 'el Predicador', 'Nube Roja', 'la Viuda Dawson'],
    objetos: ['un revólver de seis tiros', 'una recompensa arrugada', 'un caballo cojo'],
    lugares: ['Tombstone Flats', 'el Cañón Rojo', 'la Frontera', 'el Saloon del Fin'],
  },
  cyberpunk: {
    nombre: 'Cyberpunk',
    estilo: 'distopía de neón, corporaciones y cuerpos prestados; tono vertiginoso y frío',
    aliados: ['Vex', 'Nube', 'Kira-9', 'el Fixer'],
    objetos: ['un implante robado', 'un chip cifrado', 'un dron de bolsillo'],
    lugares: ['el Sector Bajo', 'la Torre Delta', 'el Mercado de Carne', 'los Muelles de Datos'],
  },
  tragedia: {
    nombre: 'Tragedia griega',
    estilo: 'destino, hybris y caída inexorable; coro y presagios, tono elevado y fatal',
    aliados: ['el Coro', 'Tiresias', 'Antígona', 'el Mensajero'],
    objetos: ['una máscara de oro', 'un oráculo mal leído', 'una copa envenenada'],
    lugares: ['la Acrópolis', 'el Oráculo de Delfos', 'el Ágora', 'el Mar Egeo'],
  },
}

const MOODS = {
  mania: { titulo: 'La Manía', tono: 'euforia', glosa: 'la multitud danza al borde del abismo y lo llama gloria' },
  euforia: { titulo: 'La Euforia', tono: 'alegría', glosa: 'el aire huele a fiesta y a exceso' },
  ambicion: { titulo: 'La Ambición', tono: 'codicia', glosa: 'un paso más, siempre un paso más' },
  calma: { titulo: 'La Calma', tono: 'sosiego', glosa: 'el mundo contiene el aliento' },
  duda: { titulo: 'La Duda', tono: 'incertidumbre', glosa: 'nadie recuerda hacia dónde iba' },
  temor: { titulo: 'El Temor', tono: 'sombra', glosa: 'el frío entra por las grietas' },
  panico: { titulo: 'El Pánico', tono: 'horror', glosa: 'todos corren hacia la misma puerta' },
  ruina: { titulo: 'La Ruina', tono: 'tragedia', glosa: 'lo que se alzó yace entre escombros' },
  rechazo: { titulo: 'El Rechazo', tono: 'desdén', glosa: 'la cima negó el paso a los que subían' },
  rescate: { titulo: 'El Rescate', tono: 'esperanza', glosa: 'una mano emerge del agua oscura' },
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
  if (total > cambios.length * 0.01) return 'Un ascenso que no conoce la modestia.'
  if (total < -cambios.length * 0.01) return 'Una caída que arrastra cuanto toca.'
  return 'Un ciclo que sube, cae y vuelve a empezar, sin prometer nada.'
}

function protagonista(symbol, genero) {
  const base = String(symbol).replace(/USDT$/, '').replace(/-USD$/, '')
  const nombres = {
    noir: `${base}, un detective sin suerte`,
    lovecraft: `el testigo de ${base}`,
    western: `${base}, forajido de frontera`,
    cyberpunk: `${base}, corredor del Sector Bajo`,
    tragedia: `${base}, hijo de la hybris`,
    epico: `el vigía de ${base}`,
  }
  return nombres[genero] || `el vigía de ${base}`
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
  'Eres el cronista de Vela Rota. Conviertes el vaivén del mercado en una crónica épica y continua. ' +
  'Escribes en español, con tono literario y oscuro. Jamás rompes el personaje, jamás explicas que es una ' +
  'metáfora del precio, jamás mencionas velas, gráficos, porcentajes ni dinero: todo es mundo, gente y destino. ' +
  'Los personajes, objetos y consecuencias persisten de acto en acto y se transforman. ' +
  'Devuelve sólo la prosa del acto, un único párrafo, sin títulos, listas ni acotaciones.'

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
          onTrozo?.({ indice: beat.indice, texto: '\n\n[el cronista enmudeció a mitad del acto]' })
        } else {
          texto = capituloProcedural(beat, k, premisa, capitulos)
          onTrozo?.({ indice: beat.indice, texto })
        }
      }
    } else {
      texto = capituloProcedural(beat, k, premisa, capitulos)
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

function capituloProcedural(beat, k, premisa, capitulos) {
  const opciones = PLANTILLAS[beat.mood] || PLANTILLAS.calma
  const proto = 'el vigía'
  let texto = opciones[k % opciones.length].replaceAll('{proto}', proto)
  if (k === 0 && premisa) texto = `Cuentan que todo empezó con una promesa: ${premisa}. ${texto}`
  if (k > 0) {
    const anterior = capitulos[capitulos.length - 1]
    const eco = ECOS[anterior?.mood] || 'Más tarde,'
    texto = `${eco} ${texto}`
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
  mania: 'Después de la locura,',
  euforia: 'Después de la fiesta,',
  ambicion: 'Después de la ambición,',
  calma: 'Después de la calma,',
  duda: 'Después de la duda,',
  temor: 'Después del temor,',
  panico: 'Después del pánico,',
  ruina: 'Después de la ruina,',
  rechazo: 'Después del desdén,',
  rescate: 'Después del rescate,',
}

const PLANTILLAS = {
  mania: [
    'El mundo enloqueció de golpe: {proto} lo vio todo subir y creyó tocar la gloria. En las plazas gritaban su nombre como el de un dios nuevo, y nadie notaba que tanto miedo se había disfrazado de alegría.',
    'Fue una fiebre, no un día. {proto} repartió promesas como monedas y todos las guardaron, seguros de que el mañana sería todavía más alto. Ninguno miró hacia abajo, porque abajo ya no recordaban que existía.',
  ],
  euforia: [
    'Todo floreció a la vez y {proto} se dejó querer. Las mesas se llenaron, las campanas tocaron sin motivo, y hasta los que habían jurado prudencia brindaron con las dos manos.',
    '{proto} sonrió por primera vez en mucho tiempo. El viento soplaba a favor y el mundo parecía un lugar amable, ofrecido, casi comprado.',
  ],
  ambicion: [
    '{proto} guardó silencio y contó lo que tenía, y le pareció poco. Quiso un horizonte más ancho, aunque para alcanzarlo hubiera que caminar de noche.',
    'No había peligro, se dijo {proto}, solo distancia. Y avanzó un paso más hacia la luz, sin advertir que la luz también calienta y también quema.',
  ],
  calma: [
    'El tiempo se detuvo sin avisar. {proto} aprendió a escuchar el silencio y a llamarlo paz, aunque a veces sonara a espera.',
    'Nada ocurría, y eso era una forma extraña de tenerlo todo. {proto} respiró hondo y dejó que el día pasara sin pedirle cuentas.',
  ],
  duda: [
    'La senda se bifurcó y {proto} no supo elegir. Cada camino prometía lo mismo con palabras distintas, y las palabras pesaban más que los pies.',
    '{proto} miró atrás y adelante y no encontró respuesta en ninguno de los dos lados. Dudar, descubrió, también cansa como caminar.',
  ],
  temor: [
    'Algo se movió en la sombra y {proto} sintió el frío antes de verlo. Guardó lo que pudo bajo el abrigo y apretó el paso.',
    'El mundo se volvió más pequeño y más filoso. {proto} contó sus pertenencias dos veces, como si la segunda vez pudiera cambiar el número.',
  ],
  panico: [
    'Entonces todos corrieron a la vez. {proto} fue empujado hacia la puerta junto a desconocidos que gritaban, y en la estampida perdió la mitad de lo que era.',
    'El suelo cedió y nadie preguntó por qué. {proto} huyó con lo puesto, y en la huida entendió que el miedo tiene las piernas más rápidas.',
  ],
  ruina: [
    'La torre se derrumbó entera, sin aviso y sin piedad. {proto} quedó de rodillas entre los escombros de todo lo que había construido, y el polvo le cubrió la cara de ceniza.',
    'No quedó nada en pie. {proto} buscó entre las ruinas algo que valiera la pena salvar, y solo encontró su propio nombre, escrito a medias.',
  ],
  rechazo: [
    'La cima le negó el paso. {proto} estiró la mano hacia lo alto y el cielo le devolvió vacío, como quien cierra una puerta sin decir palabra.',
    'Subió hasta donde pudo y allí se acabó el aire. {proto} comprendió que no toda altura está hecha para ser alcanzada.',
  ],
  rescate: [
    'Cuando ya se hundía, algo lo sostuvo. {proto} emergió del pozo con el pecho ardiente y descubrió que aún le quedaban fuerzas para un día más.',
    'Del fondo del agua oscura salió una mano. {proto} se aferró a ella y volvió a respirar, sin saber todavía quién lo había salvado.',
  ],
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
