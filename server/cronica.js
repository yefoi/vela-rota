// La Crónica: el vaivén del precio se convierte en una saga por actos.
// Cada vela es un ánimo; cada ánimo empuja la historia que ya venía.

import { transmitirTexto } from './oracle.js'

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

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

export function analizarBeats(symbol, interval, candles, cap = 5) {
  if (!candles.length) return { beats: [], trama: '' }
  const cambios = candles.map((c) => (c.close - c.open) / c.open)
  const media = cambios.reduce((a, b) => a + Math.abs(b), 0) / cambios.length
  const base = Math.max(media, 1e-6)
  const proto = protagonista(symbol)
  const indices = muestrear(candles.length, cap)

  const beats = indices.map((indice, i) => {
    const c = candles[indice]
    const cambio = (c.close - c.open) / c.open
    const clave = clasificar(c, cambio / base)
    const mood = MOODS[clave]
    return {
      indice,
      acto: `Acto ${ROMANOS[i] || i + 1}`,
      mood: clave,
      titulo: mood.titulo,
      tono: mood.tono,
      glosa: mood.glosa,
      cambio,
      cambioTxt: `${cambio >= 0 ? '+' : ''}${(cambio * 100).toFixed(2)}%`,
      apertura: c.open,
      cierre: c.close,
      maximo: c.high,
      minimo: c.low,
      volumen: c.volume,
      openTime: c.openTime,
    }
  })

  return { beats, trama: tramar(cambios), protagonista: proto }
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

function muestrear(n, cap) {
  if (n <= cap) return Array.from({ length: n }, (_, i) => i)
  const indices = new Set()
  for (let i = 0; i < cap; i++) indices.add(Math.round((i * (n - 1)) / (cap - 1)))
  return [...indices].sort((a, b) => a - b)
}

function tramar(cambios) {
  const total = cambios.reduce((a, b) => a + b, 0)
  if (total > cambios.length * 0.01) return 'Un ascenso que no conoce la modestia.'
  if (total < -cambios.length * 0.01) return 'Una caída que arrastra cuanto toca.'
  return 'Un ciclo que sube, cae y vuelve a empezar, sin prometer nada.'
}

function protagonista(symbol) {
  const base = String(symbol).replace(/USDT$/, '').replace(/-USD$/, '')
  return `el vigía de ${base}`
}

export function resumenDeBeat(beat) {
  return {
    indice: beat.indice,
    acto: beat.acto,
    mood: beat.mood,
    titulo: beat.titulo,
    tono: beat.tono,
    glosa: beat.glosa,
    cambio: beat.cambio,
    cambioTxt: beat.cambioTxt,
    apertura: beat.apertura,
    cierre: beat.cierre,
    maximo: beat.maximo,
    minimo: beat.minimo,
    volumen: beat.volumen,
    openTime: beat.openTime,
  }
}

// ---------------------------------------------------------------------------
// La crónica por IA: un acto por vez, cada uno continuando el anterior.
// ---------------------------------------------------------------------------

const SISTEMA_CRONICA =
  'Eres el cronista de Vela Rota. Conviertes el vaivén del mercado en una crónica épica y continua. ' +
  'Escribes en español, con tono solemne, literario y oscuro. Jamás rompes el personaje, jamás explicas ' +
  'que es una metáfora del precio, jamás mencionas velas, gráficos, porcentajes ni dinero: todo es mundo, ' +
  'gente y destino. Los personajes, objetos y consecuencias persisten de acto en acto y se transforman. ' +
  'Devuelve sólo la prosa del acto pedido, sin títulos ni listas.'

export async function cronicaIAStream(beats, { symbol, premisa, signal, onCapitulo, onTrozo } = {}) {
  const conIA = Boolean(process.env.OPENAI_API_KEY)
  let modelo = null
  const capitulos = []

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]
    onCapitulo?.(resumenDeBeat(beat))
    let texto = ''

    if (conIA) {
      const prompt = construirPromptCronica(symbol, beats, i, premisa, capitulos)
      try {
        for await (const trozo of transmitirTexto({
          prompt,
          system: SISTEMA_CRONICA,
          signal,
          onModelo: (m) => { modelo = m },
        })) {
          texto += trozo
          onTrozo?.({ indice: i, texto: trozo })
        }
      } catch {
        if (texto) {
          onTrozo?.({ indice: i, texto: '\n\n[el cronista enmudeció a mitad del acto]' })
        } else {
          texto = capituloProcedural(beat, i, premisa, capitulos)
          onTrozo?.({ indice: i, texto })
        }
      }
    } else {
      texto = capituloProcedural(beat, i, premisa, capitulos)
      onTrozo?.({ indice: i, texto })
      await dormir(220)
    }

    capitulos.push({ ...resumenDeBeat(beat), texto })
  }

  return { motor: conIA ? 'ia' : 'oraculo-local', modelo }
}

function construirPromptCronica(symbol, beats, i, premisa, capitulos) {
  const b = beats[i]
  const lineas = [`Obra: «La Crónica de ${symbol}», en ${beats.length} actos, según el vaivén del precio.`]
  if (premisa) lineas.push(`Premisa del fiel, respétala: ${premisa}.`)
  if (i === 0) {
    lineas.push('Este es el Acto I. Presenta al protagonista, el mundo y aquello que lo mueve.')
  } else {
    lineas.push('Crónica hasta aquí:')
    lineas.push(capitulos.map((c) => `${c.acto} — ${c.titulo}: ${c.texto}`).join('\n'))
    lineas.push('Continúa la historia: lo ocurrido antes tiene consecuencias, y los personajes y objetos persisten.')
  }
  lineas.push(`Escribe únicamente el ${b.acto} — ${b.titulo} (${b.tono}). ${b.glosa}.`)
  lineas.push('Un solo párrafo de tres a cuatro frases. Sin títulos, sin listas, sin explicaciones.')
  return lineas.join('\n')
}

function capituloProcedural(beat, i, premisa, capitulos) {
  const opciones = PLANTILLAS[beat.mood] || PLANTILLAS.calma
  const proto = 'el vigía'
  let texto = opciones[i % opciones.length].replaceAll('{proto}', proto)
  if (i === 0 && premisa) texto = `Cuentan que todo empezó con una promesa: ${premisa}. ${texto}`
  if (i > 0) {
    const anterior = capitulos[capitulos.length - 1]
    const eco = ECOS[anterior?.mood] || 'Más tarde,'
    texto = `${eco} ${texto}`
  }
  return texto
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
