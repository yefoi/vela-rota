// Arcana — corpus litúrgico de Wickfable.
// El mercado no predice: revela. Cada vela es una carta tendida en el altar.

export const ARCANOS_MAYORES = [
  {
    n: 0, roman: '0', nombre: 'El Loco',
    cuerpo: 'Aire', regencia: 'Urano',
    derecho: 'El salto sin red, la posición que aún no existe y por eso no puede fallar.',
    inverso: 'La entrada impulsiva vestida de intuición; el vértigo disfrazado de tesis.',
    augurio: 'Quien no arriesga no liquida, pero quien arriesga sin stop pertenece al abismo.',
  },
  {
    n: 1, roman: 'I', nombre: 'El Mago',
    cuerpo: 'Mercurio', regencia: 'Mercurio',
    derecho: 'La voluntad que mueve el precio; la orden ejecutada en el instante exacto.',
    inverso: 'La manipulación, el truco, el pump anunciado a los que ya compraron.',
    augurio: 'La mano que señala el gráfico también lo dibuja.',
  },
  {
    n: 2, roman: 'II', nombre: 'La Sacerdotisa',
    cuerpo: 'Luna', regencia: 'Luna',
    derecho: 'El silencio entre vela y vela; la información que el ruido no deja oír.',
    inverso: 'Los secretos del libro de órdenes vedados a quien mira solo el precio.',
    augurio: 'Lo no dicho mueve más volumen que lo publicado.',
  },
  {
    n: 3, roman: 'III', nombre: 'La Emperatriz',
    cuerpo: 'Venus', regencia: 'Venus',
    derecho: 'La abundancia que germina; el interés compuesto como milagro lento.',
    inverso: 'El exceso, la gula de apalancamiento, la cosecha que se pudre por retenerla.',
    augurio: 'Toda fertilidad exige poda, incluso la del saldo.',
  },
  {
    n: 4, roman: 'IV', nombre: 'El Emperador',
    cuerpo: 'Aries', regencia: 'Aries',
    derecho: 'La estructura, el soporte, la autoridad del nivel que sostiene todo.',
    inverso: 'La rigidez del que confunde disciplina con terquedad ante el mercado.',
    augurio: 'El muro que no cede es también el que sepulta.',
  },
  {
    n: 5, roman: 'V', nombre: 'El Sumo Sacerdote',
    cuerpo: 'Tauro', regencia: 'Tauro',
    derecho: 'La ortodoxia del método; el rito repetido que da fe al operador.',
    inverso: 'El dogma vacío, el indicador heredado que ya nadie comprende.',
    augurio: 'La tradición sin comprensión es una vela encendida a un dios muerto.',
  },
  {
    n: 6, roman: 'VI', nombre: 'Los Enamorados',
    cuerpo: 'Géminis', regencia: 'Géminis',
    derecho: 'La elección entre dos futuros; el par de activos que jura fidelidad.',
    inverso: 'La indecisión que cobra peaje; el sí y el no que anulan la posición.',
    augurio: 'Elegir es renunciar a todo lo demás, y el mercado lo sabe.',
  },
  {
    n: 7, roman: 'VII', nombre: 'El Carro',
    cuerpo: 'Cáncer', regencia: 'Cáncer',
    derecho: 'El avance triunfal, la tendencia que arrastra y no pide permiso.',
    inverso: 'El carro sin auriga, el descontrol, la aceleración que termina en volcadura.',
    augurio: 'La velocidad sin dirección no es movimiento: es caída.',
  },
  {
    n: 8, roman: 'VIII', nombre: 'La Fuerza',
    cuerpo: 'Leo', regencia: 'Sol',
    derecho: 'La doma del impulso; la mano firme sobre la bestia del pánico.',
    inverso: 'La fuerza bruta del que aplasta su propio capital por orgullo.',
    augurio: 'La verdadera potencia se mide en lo que se abstiene de hacer.',
  },
  {
    n: 9, roman: 'IX', nombre: 'El Ermitaño',
    cuerpo: 'Virgo', regencia: 'Mercurio',
    derecho: 'El repliegue fecundo, la calma que precede a la claridad.',
    inverso: 'El aislamiento obstinado; el que apaga la pantalla y llama a eso convicción.',
    augurio: 'A veces la mejor posición es ninguna, y eso también se cobra.',
  },
  {
    n: 10, roman: 'X', nombre: 'La Rueda de la Fortuna',
    cuerpo: 'Júpiter', regencia: 'Júpiter',
    derecho: 'El giro del ciclo, la fortuna que reparte sin distinguir méritos.',
    inverso: 'El ciclo que se completa hacia abajo; la lección que llega sin aviso.',
    augurio: 'La rueda no sube ni baja: gira, y tú eliges dónde mirarla.',
  },
  {
    n: 11, roman: 'XI', nombre: 'La Justicia',
    cuerpo: 'Libra', regencia: 'Venus',
    derecho: 'El equilibrio exacto, la liquidación justa de cada deuda.',
    inverso: 'El juicio torcido, la cuenta que nunca cuadra, el sesgo que cobra intereses.',
    augurio: 'El mercado no juzga: cobra. La diferencia es tu consuelo.',
  },
  {
    n: 12, roman: 'XII', nombre: 'El Colgado',
    cuerpo: 'Agua', regencia: 'Neptuno',
    derecho: 'La pausa forzada que revela lo que la acción ocultaba.',
    inverso: 'La trampa del que espera eternamente el precio de entrada perfecto.',
    augurio: 'Estar colgado es una posición: alguien siempre sostiene la cuerda.',
  },
  {
    n: 13, roman: 'XIII', nombre: 'La Muerte',
    cuerpo: 'Escorpio', regencia: 'Plutón',
    derecho: 'El fin que renueva; el stop que libera capital para otra vida.',
    inverso: 'La negación de la pérdida, el bolso que no suelta su cadáver.',
    augurio: 'Lo que no se corta a tiempo se corta solo, y más profundo.',
  },
  {
    n: 14, roman: 'XIV', nombre: 'La Templanza',
    cuerpo: 'Sagitario', regencia: 'Júpiter',
    derecho: 'La mezcla justa de riesgo y paciencia, vertida gota a gota.',
    inverso: 'La dosificación rota; todo o nada, vértigo o letargo.',
    augurio: 'La proporción es la única magia que no desgasta al mago.',
  },
  {
    n: 15, roman: 'XV', nombre: 'El Diablo',
    cuerpo: 'Capricornio', regencia: 'Saturno',
    derecho: 'La atadura elegida: el vicio, la codicia, el gráfico que no se puede soltar.',
    inverso: 'La cadena que se rompe cuando se nombra en voz alta.',
    augurio: 'El mercado es libre; la esclavitud la firmas tú cada madrugada.',
  },
  {
    n: 16, roman: 'XVI', nombre: 'La Torre',
    cuerpo: 'Marte', regencia: 'Marte',
    derecho: 'El derrumbe súbito, la vela que borra semanas en una hora.',
    inverso: 'El rayo que no cae y deja la estructura agrietada respirando.',
    augurio: 'Toda torre construida sobre el apalancamiento incluye su propio relámpago.',
  },
  {
    n: 17, roman: 'XVII', nombre: 'La Estrella',
    cuerpo: 'Acuario', regencia: 'Urano',
    derecho: 'La esperanza tras la ruina; el proyecto nuevo sobre el saldo en cenizas.',
    inverso: 'La promesa que se posterga; la guía que dejó de orientar.',
    augurio: 'La estrella no promete el puerto: promete que hay uno.',
  },
  {
    n: 18, roman: 'XVIII', nombre: 'La Luna',
    cuerpo: 'Piscis', regencia: 'Neptuno',
    derecho: 'La marea del sentimiento, el miedo y la euforia que dictan el volumen.',
    inverso: 'La ilusión que se disipa y deja a la vista el pantano.',
    augurio: 'De noche el mercado no duerme: delira, y tú también.',
  },
  {
    n: 19, roman: 'XIX', nombre: 'El Sol',
    cuerpo: 'Sol', regencia: 'Sol',
    derecho: 'La claridad meridiana, la ganancia que se muestra sin sombras.',
    inverso: 'El resplandor que ciega; el techo que parece cielo abierto.',
    augurio: 'A plena luz todos vemos el gráfico, y por eso nadie ve nada.',
  },
  {
    n: 20, roman: 'XX', nombre: 'El Juicio',
    cuerpo: 'Fuego', regencia: 'Plutón',
    derecho: 'El llamado a rendir cuentas; la revisión que resucita o entierra.',
    inverso: 'El veredicto postergado, el diario de operaciones que no se lee.',
    augurio: 'Sera juzgado por sus velas, no por sus intenciones.',
  },
  {
    n: 21, roman: 'XXI', nombre: 'El Mundo',
    cuerpo: 'Saturno', regencia: 'Saturno',
    derecho: 'La consumación del ciclo, la cartera en paz consigo misma.',
    inverso: 'El ciclo que no cierra; la ganancia que nunca se da por completa.',
    augurio: 'Ningún mundo termina: solo cambia de marcos temporales.',
  },
]

export const PALOS = [
  {
    palo: 'Bastos', elemento: 'Fuego',
    dominio: 'el impulso, la ruptura y la volatilidad que enciende',
  },
  {
    palo: 'Copas', elemento: 'Agua',
    dominio: 'la liquidez, el flujo y el sentimiento que sostiene el precio',
  },
  {
    palo: 'Espadas', elemento: 'Aire',
    dominio: 'el análisis, la noticia y el corte que separa tesis de deseo',
  },
  {
    palo: 'Oros', elemento: 'Tierra',
    dominio: 'el capital, el volumen y el soporte que pesa',
  },
]

export const RANGOS = [
  { rango: 'As', derecha: 'la chispa primera, el origen sin historial', invertida: 'la oportunidad que nace estéril' },
  { rango: 'Dos', derecha: 'el par, la dualidad que busca equilibrio', invertida: 'el desequilibrio que finge armonía' },
  { rango: 'Tres', derecha: 'la primera confirmación, el brote de la idea', invertida: 'la confirmación que llega tarde' },
  { rango: 'Cuatro', derecha: 'la pausa estable, el rango que respira', invertida: 'el estancamiento que se confunde con calma' },
  { rango: 'Cinco', derecha: 'la disputa, la pérdida que enseña', invertida: 'la pelea inútil contra la marea' },
  { rango: 'Seis', derecha: 'la armonía recuperada, el flujo que retorna', invertida: 'el retorno que no encuentra puerto' },
  { rango: 'Siete', derecha: 'la estrategia paciente, la postura en el asedio', invertida: 'la defensa de una posición ya perdida' },
  { rango: 'Ocho', derecha: 'la maestría repetida, el hábito que sostiene', invertida: 'la repetición mecánica sin conciencia' },
  { rango: 'Nueve', derecha: 'la cosecha casi plena, la recta final', invertida: 'la vigilia estéril del que no suelta' },
  { rango: 'Diez', derecha: 'la culminación del palo, la plenitud o el peso', invertida: 'la corona que dobla la cabeza' },
  { rango: 'Sota', derecha: 'la curiosidad que explora sin capital', invertida: 'la imprudencia del aprendiz' },
  { rango: 'Caballero', derecha: 'la acción decidida que cruza el tablero', invertida: 'la carrera hacia el abismo propio' },
  { rango: 'Reina', derecha: 'el dominio interior que nutre y ordena', invertida: 'el control que sofoca su propia fuente' },
  { rango: 'Rey', derecha: 'la autoridad madura que decide y responde', invertida: 'la tiranía del ego sobre el método' },
]

export const LITURGIA = {
  apertura: [
    'El mercado abre la lectura.',
    'Las velas muestran lo ocurrido.',
    'Cada vela se lee como una carta.',
  ],
  cierre: [
    'La lectura termina aquí.',
    'La carta describe, no aconseja.',
    'No es una recomendación de inversión.',
  ],
}

export function orientacionDe(candle) {
  const cuerpo = Math.abs(candle.close - candle.open)
  const rango = Math.max(candle.high - candle.low, 1e-12)
  if (cuerpo / rango < 0.08) return 'tendida'
  return candle.close >= candle.open ? 'derecho' : 'invertido'
}
