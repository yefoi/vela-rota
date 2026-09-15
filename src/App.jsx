import { useCallback, useEffect, useRef, useState } from 'react'
import { consultarAltar, obtenerConfig, streamLectura } from './api.js'
import CandleChart from './components/CandleChart.jsx'
import Cronica from './components/Cronica.jsx'
import Disclaimer from './components/Disclaimer.jsx'
import Ruido from './components/Ruido.jsx'
import TarotCard from './components/TarotCard.jsx'
import VelasDeCera from './components/VelasDeCera.jsx'
import {
  generarPergamino,
  generarPergaminoTirada,
  nombreArchivo,
  descargarPergamino,
  compartirPergamino,
} from './compartir.js'

const MODOS = ['tiempo', 'cruz', 'herradura', 'si_no', 'dia']
const ETIQUETA_MODO = {
  tiempo: 'Tres tiempos',
  cruz: 'Cruz (5)',
  herradura: 'Herradura (7)',
  si_no: 'Sí o no',
  dia: 'Carta del día',
}

const GLOSA_MODO = {
  tiempo: 'tres velas del ciclo, leídas como arcana',
  cruz: 'cinco velas en cruz, del deseo a su desenlace',
  herradura: 'siete velas en herradura, de lo que fue a lo que será',
  si_no: 'una sola vela responde: sí o no',
  dia: 'una vela rige la jornada',
}

const CARTAS_POR_MODO = { tiempo: 3, cruz: 5, herradura: 7, si_no: 1, dia: 1 }

function cargarDiario() {
  try {
    const crudo = localStorage.getItem('vela-rota:diario')
    const datos = crudo ? JSON.parse(crudo) : []
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

const params = new URLSearchParams(window.location.search)
const RESTAURO = {
  simbolo: params.get('simbolo') || 'BTCUSDT',
  intervalo: params.get('i') || '1h',
  modo: MODOS.includes(params.get('modo')) ? params.get('modo') : 'tiempo',
  vela: params.has('vela') ? Number(params.get('vela')) : null,
  pregunta: params.get('pregunta') || '',
  vista: params.get('vista') === 'cronica' ? 'cronica' : 'oraculo',
  genero: params.get('genero') || 'epico',
  premisa: params.get('premisa') || '',
  capitulos: Number(params.get('capitulos')) || 5,
}

const ETIQUETA_FUENTE = {
  binance: 'velas reales · binance',
  'binance-us': 'velas reales · binance us',
  coinbase: 'velas reales · coinbase',
  sintetico: 'velas sintéticas · el mundo calló',
}

const ETIQUETA_INTERVALO = {
  '5m': '5 min',
  '15m': '15 min',
  '1h': '1 hora',
  '4h': '4 horas',
  '1d': '1 día',
  '1w': '1 semana',
  '1M': '1 mes',
}

export default function App() {
  const [config, setConfig] = useState(null)
  const [vista, setVista] = useState(RESTAURO.vista)
  const [genero, setGenero] = useState(RESTAURO.genero)
  const [premisa, setPremisa] = useState(RESTAURO.premisa)
  const [capitulos, setCapitulos] = useState(RESTAURO.capitulos)
  const [simbolo, setSimbolo] = useState(RESTAURO.simbolo)
  const [intervalo, setIntervalo] = useState(RESTAURO.intervalo)
  const [modo, setModo] = useState(RESTAURO.modo)
  const [pregunta, setPregunta] = useState(RESTAURO.pregunta)
  const [borrador, setBorrador] = useState(RESTAURO.pregunta)
  const [data, setData] = useState(null)
  const [seleccion, setSeleccion] = useState(null)
  const [lectura, setLectura] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [escribiendo, setEscribiendo] = useState(false)
  const [error, setError] = useState(null)
  const [enVivo, setEnVivo] = useState(true)
  const [senalesOn, setSenalesOn] = useState(false)
  const [vozOn, setVozOn] = useState(false)
  const [hablando, setHablando] = useState(false)
  const [diario, setDiario] = useState(cargarDiario)
  const [aviso, setAviso] = useState(null)

  const abortRef = useRef(null)
  const vivoRef = useRef({ simbolo, intervalo, modo, pregunta })
  const metaRef = useRef(null)
  const pendienteRef = useRef(RESTAURO.vela)
  const vozRef = useRef(vozOn)

  useEffect(() => {
    obtenerConfig().then(setConfig).catch(() => {})
  }, [])

  useEffect(() => {
    vivoRef.current = { simbolo, intervalo, modo, pregunta }
  }, [simbolo, intervalo, modo, pregunta])

  useEffect(() => {
    vozRef.current = vozOn
  }, [vozOn])

  const consagrar = useCallback((idx) => {
    if (idx == null || idx < 0) return
    setSeleccion(idx)
    setEscribiendo(true)
    setError(null)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const suyo = vivoRef.current
    let textoAcumulado = ''
    streamLectura(
      { symbol: suyo.simbolo, interval: suyo.intervalo, index: idx, pregunta: suyo.pregunta },
      {
        signal: ctrl.signal,
        onMeta: (meta) => {
          metaRef.current = meta
          setLectura({ ...meta, texto: '', parrafos: [] })
        },
        onChunk: (trozo) =>
          setLectura((prev) => {
            const texto = (prev?.texto || '') + trozo
            textoAcumulado = texto
            return { ...(prev || {}), texto, parrafos: texto.split(/\n\s*\n/) }
          }),
        onFin: (fin) => {
          setEscribiendo(false)
          setLectura((prev) => ({
            ...(prev || {}),
            motor: fin.motor,
            modelo: fin.modelo ?? null,
            errorIA: fin.error,
          }))
          const meta = metaRef.current
          if (meta) {
            recordar({
              ts: Date.now(),
              simbolo: suyo.simbolo,
              intervalo: suyo.intervalo,
              modo: suyo.modo,
              indice: idx,
              carta: meta.carta?.nombre,
              orientacion: meta.orientacion,
            })
          }
          if (vozRef.current && textoAcumulado) narrarTexto(textoAcumulado, meta)
        },
      },
    ).catch((e) => {
      if (e?.name !== 'AbortError') {
        setError(e.message)
        setEscribiendo(false)
      }
    })
  }, [])

  // Carga inicial y cada cambio de activo/tiempo/modo
  useEffect(() => {
    let vivo = true
    consultarAltar({ symbol: simbolo, interval: intervalo, modo, pregunta: vivoRef.current.pregunta })
      .then((d) => {
        if (!vivo) return
        setData(d)
        const idx = pendienteRef.current != null ? pendienteRef.current : indiceInicial(d)
        pendienteRef.current = null
        consagrar(idx)
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [simbolo, intervalo, modo, consagrar])

  // Actualización en vivo
  useEffect(() => {
    if (!enVivo) return undefined
    const id = setInterval(() => {
      if (document.hidden) return
      const suyo = vivoRef.current
      consultarAltar({ symbol: suyo.simbolo, interval: suyo.intervalo, modo: suyo.modo, pregunta: suyo.pregunta })
        .then((d) => setData(d))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(id)
  }, [enVivo])

  // Enlace permanente
  useEffect(() => {
    const p = new URLSearchParams()
    p.set('simbolo', simbolo)
    p.set('i', intervalo)
    if (vista === 'cronica') {
      p.set('vista', 'cronica')
      if (genero !== 'epico') p.set('genero', genero)
      if (premisa) p.set('premisa', premisa)
      if (capitulos !== 5) p.set('capitulos', String(capitulos))
    } else {
      if (modo === 'cruz') p.set('modo', 'cruz')
      if (pregunta) p.set('pregunta', pregunta)
    }
    if (seleccion != null) p.set('vela', String(seleccion))
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`)
  }, [simbolo, intervalo, modo, pregunta, seleccion, vista, genero, premisa, capitulos])

  function cambiarModo(nuevo) {
    if (nuevo === modo) return
    setCargando(true)
    setError(null)
    setModo(nuevo)
  }

  function consultarManual() {
    vivoRef.current = { simbolo, intervalo, modo, pregunta: borrador }
    setPregunta(borrador)
    setCargando(true)
    setError(null)
    consultarAltar({ symbol: simbolo, interval: intervalo, modo, pregunta: borrador })
      .then((d) => {
        setData(d)
        consagrar(indiceInicial(d))
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  async function alDescargar() {
    if (!lectura?.carta) return
    const canvas = await generarPergamino(lectura, { symbol: simbolo, interval: intervalo })
    descargarPergamino(canvas, nombreArchivo(lectura, { symbol: simbolo, interval: intervalo }))
  }

  async function alCompartir() {
    if (!lectura?.carta) return
    const canvas = await generarPergamino(lectura, { symbol: simbolo, interval: intervalo })
    const nativo = await compartirPergamino(canvas, nombreArchivo(lectura, { symbol: simbolo, interval: intervalo }))
    avisar(nativo ? 'compartido' : 'pergamino descargado')
  }

  async function alCopiar() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      avisar('enlace copiado')
    } catch {
      avisar('no se pudo copiar')
    }
  }

  function avisar(mensaje) {
    setAviso(mensaje)
    setTimeout(() => setAviso(null), 2600)
  }

  function recordar(entrada) {
    setDiario((prev) => {
      const nuevo = [
        entrada,
        ...prev.filter(
          (e) => !(e.simbolo === entrada.simbolo && e.intervalo === entrada.intervalo && e.indice === entrada.indice),
        ),
      ].slice(0, 24)
      try {
        localStorage.setItem('vela-rota:diario', JSON.stringify(nuevo))
      } catch {
        /* sin almacenamiento */
      }
      return nuevo
    })
  }

  function narrarTexto(texto, meta) {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const voces = synth.getVoices()
    const voz = voces.find((v) => /^es[-_]/i.test(v.lang)) || voces.find((v) => /spanish|español/i.test(v.name))
    const cabecera = meta?.carta?.nombre ? `${meta.carta.nombre}. ` : ''
    const u = new SpeechSynthesisUtterance(cabecera + texto)
    if (voz) u.voice = voz
    u.lang = voz?.lang || 'es-ES'
    u.rate = 0.96
    u.pitch = 0.9
    u.onend = () => setHablando(false)
    setHablando(true)
    synth.speak(u)
  }

  function detenerVoz() {
    window.speechSynthesis?.cancel()
    setHablando(false)
  }

  function alternarVoz() {
    const siguiente = !vozOn
    setVozOn(siguiente)
    if (!siguiente) detenerVoz()
    else if (lectura?.texto) narrarTexto(lectura.texto, lectura)
  }

  async function alDescargarTirada() {
    if (!data?.tirada) return
    const canvas = await generarPergaminoTirada(data.tirada, {
      symbol: simbolo,
      interval: intervalo,
      modo: data.tirada.modo,
    })
    descargarPergamino(canvas, `tirada-${simbolo}-${intervalo}.png`)
  }

  function restaurar(entrada) {
    detenerVoz()
    const mismo = entrada.simbolo === simbolo && entrada.intervalo === intervalo && entrada.modo === modo
    if (mismo) {
      consagrar(entrada.indice)
      return
    }
    pendienteRef.current = entrada.indice
    setCargando(true)
    setError(null)
    setSimbolo(entrada.simbolo)
    setIntervalo(entrada.intervalo)
    setModo(entrada.modo)
  }

  function borrarDiario() {
    setDiario([])
    try {
      localStorage.removeItem('vela-rota:diario')
    } catch {
      /* sin almacenamiento */
    }
  }

  const vol = data?.volatilidad || { global: 0.25, ultima: 0.25, direccion: 0 }
  const clases = ['app', vol.global > 0.6 ? 'vol-alta' : 'vol-baja']
  if (vol.ultima > 0.65 && vol.direccion < 0) clases.push('derrame')

  const cartas = data?.tirada?.cartas || []
  const modoTirada = data?.tirada?.modo || modo
  const fuente = data?.fuente || ''
  const parrafos = lectura?.parrafos?.length ? lectura.parrafos : lectura?.texto ? lectura.texto.split(/\n\s*\n/) : []

  return (
    <div className={clases.join(' ')} style={{ '--vol': String(vol.global), '--vol-ultima': String(vol.ultima) }}>
      <Ruido />
      <Disclaimer />

      <header className="cabecera">
        <div className="titulo-bloque">
          <h1 className="titulo" data-texto="WICKFABLE">WICKFABLE</h1>
          <p className="lema">
            los mercados como oráculo · cada vela es una carta tendida en el altar
          </p>
        </div>

        <div className="controles">
          <div className="vistas">
            <button type="button" className={vista === 'oraculo' ? 'activo' : ''} onClick={() => setVista('oraculo')}>Oráculo</button>
            <button type="button" className={vista === 'cronica' ? 'activo' : ''} onClick={() => setVista('cronica')}>Crónica</button>
          </div>
          <label className="control">
            <span>ofrenda</span>
            <select value={simbolo} onChange={(e) => { setSimbolo(e.target.value); setCargando(true); setError(null) }}>
              {(config?.simbolos || ['BTCUSDT']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="control">
            <span>tiempo</span>
            <select value={intervalo} onChange={(e) => { setIntervalo(e.target.value); setCargando(true); setError(null) }}>
              {(config?.intervalos || ['1h']).map((i) => (
                <option key={i} value={i}>{ETIQUETA_INTERVALO[i] || i}</option>
              ))}
            </select>
          </label>
          <button type="button" className="consultar" onClick={consultarManual}>Consultar</button>
        </div>
      </header>

      <section className="mesa">
        <div className="mesa-barra">
          <span className="par">{simbolo}<i>·</i>{ETIQUETA_INTERVALO[intervalo] || intervalo}</span>
          {data ? (
            <span className={`fuente ${fuente === 'sintetico' ? 'fuente-falsa' : 'fuente-real'}`}>
              {ETIQUETA_FUENTE[fuente] || fuente}
            </span>
          ) : null}
          {cargando ? <span className="cargando">consultando el altar…</span> : null}
          <button type="button" className={`vivo ${enVivo ? 'vivo-on' : ''}`} onClick={() => setEnVivo((v) => !v)}>
            {enVivo ? '● en vivo' : '○ pausado'}
          </button>
          <button type="button" className={`vivo ${senalesOn ? 'vivo-on' : ''}`} onClick={() => setSenalesOn((v) => !v)}>
            {senalesOn ? '◆ mayores' : '◇ mayores'}
          </button>
        </div>

        <CandleChart
          velas={data?.velas}
          sigilos={data?.sigilos}
          selectedIndex={seleccion}
          onSelect={consagrar}
          mostrarSenales={senalesOn}
        />

        <div className="leyenda">
          <span><i className="punto punto-alza" /> alza = carta derecha</span>
          <span><i className="punto punto-baja" /> baja = carta invertida</span>
          <span><i className="punto punto-cruz" /> doji = tendida en cruz</span>
          <span><i className="punto punto-mayor" /> ◆ arcano mayor (rosado si invertido)</span>
          <span className="glifo-pista">recorre el gráfico y pulsa una vela para consagrarla</span>
        </div>
      </section>

      {vista === 'oraculo' ? (
        <>
          <aside className="oraculo">
        <div className="oraculo-cabecera">
          <h2 className="seccion-titulo">La Tirada</h2>
          <label className="control modo-select">
            <select value={modo} onChange={(e) => cambiarModo(e.target.value)}>
              {MODOS.map((m) => (
                <option key={m} value={m}>{ETIQUETA_MODO[m]}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="seccion-glosa">{GLOSA_MODO[modoTirada] || ''}</p>

        {data?.clima ? (
          <div className="clima">
            <span className="clima-fuerte">{data.clima.elemento} · casa de {data.clima.palo}</span>
            <p>{data.clima.texto}</p>
          </div>
        ) : null}

        <div className="pregunta">
          <input
            value={borrador}
            maxLength={200}
            placeholder="Formula tu pregunta al altar…"
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultarManual()}
          />
          <button type="button" onClick={consultarManual}>Preguntar</button>
        </div>

        <div className={`tirada tirada-${modoTirada}`}>
          {cartas.length
            ? cartas.map((c) => (
                <div key={`${c.posicion}-${c.indice}`} className={`celda-tarot pos-${c.posicion}`}>
                  <TarotCard
                    carta={c.carta}
                    posicion={c.posicionTitulo}
                    active={seleccion === c.indice}
                    onClick={() => consagrar(c.indice)}
                  />
                </div>
              ))
            : Array.from({ length: CARTAS_POR_MODO[modoTirada] || 3 }).map((_, i) => (
                <div key={i} className="tarot tarot-vacia">
                  <span className="tarot-glifo">✧</span>
                </div>
              ))}
        </div>

        {data?.tirada?.mandato ? (
          <div className="mandato">
            <p className="mandato-apertura">{data.tirada.mandato.apertura}</p>
            {data.tirada.mandato.pregunta ? (
              <p className="mandato-pregunta">«{data.tirada.mandato.pregunta}»</p>
            ) : null}
            {data.tirada.mandato.analisis?.texto ? (
              <p className="mandato-analisis">{data.tirada.mandato.analisis.texto}</p>
            ) : null}
            <p className="mandato-sintesis">{data.tirada.mandato.sintesis}</p>
            <p className="mandato-cierre">{data.tirada.mandato.cierre}</p>
          </div>
        ) : null}

        {diario.length ? (
          <div className="diario">
            <div className="diario-cabecera">
              <h3 className="seccion-titulo">Diario</h3>
              <button type="button" onClick={borrarDiario}>vaciar</button>
            </div>
            <ul>
              {diario.slice(0, 6).map((e, i) => (
                <li key={`${e.ts}-${i}`}>
                  <button type="button" onClick={() => restaurar(e)}>
                    <span>{e.carta}</span>
                    <i>{e.simbolo} · {e.intervalo} · {ETIQUETA_MODO[e.modo] || e.modo}</i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <section className="lectura">
        {lectura ? (
          <>
            <div className="lectura-carta">
              <TarotCard carta={lectura.carta} active compact />
              <span className="motor">motor: {motor(lectura.motor, lectura.modelo)}</span>
            </div>
            <div className="lectura-texto">
              <div className="lectura-acciones">
                <button type="button" onClick={alCopiar}>copiar enlace</button>
                <button type="button" onClick={alCompartir}>compartir</button>
                <button type="button" onClick={alDescargar}>descargar</button>
                <button type="button" onClick={alDescargarTirada}>tirada</button>
                <button type="button" className={vozOn ? 'activo' : ''} onClick={alternarVoz}>
                  {hablando ? 'detener voz' : vozOn ? '♪ voz' : '♪ voz off'}
                </button>
              </div>
              <h2 className="seccion-titulo">
                {lectura.posicionTitulo}
                {lectura.openTime ? (
                  <span className="lectura-fecha">
                    {new Date(lectura.openTime).toISOString().replace('T', ' ').slice(0, 16)} utc
                  </span>
                ) : null}
              </h2>
              <p className="lectura-versiculo">
                {lectura.carta?.roman ? `${lectura.carta.roman}. ` : ''}
                {lectura.carta?.nombre}
                <span className={`sello sello-${lectura.orientacion}`}>{lectura.orientacion}</span>
              </p>
              {lectura.pregunta ? <p className="lectura-pregunta">«{lectura.pregunta}»</p> : null}
              {parrafos.map((p, i) => (
                <p key={i} className="lectura-parrafo">{p}</p>
              ))}
              {escribiendo ? <span className="cursor" aria-hidden="true">▌</span> : null}

              <dl className="datos">
                <div><dt>apertura</dt><dd>{num(lectura.apertura)}</dd></div>
                <div><dt>cierre</dt><dd>{num(lectura.cierre)}</dd></div>
                <div><dt>máximo</dt><dd>{num(lectura.maximo)}</dd></div>
                <div><dt>mínimo</dt><dd>{num(lectura.minimo)}</dd></div>
                <div><dt>volumen</dt><dd>{num(lectura.volumen)}</dd></div>
                <div><dt>cambio</dt><dd className={lectura.cambio >= 0 ? 'sube' : 'baja'}>{lectura.cambioTxt}</dd></div>
              </dl>
              <p className="disclaimer">Ficción generada por IA. No es asesoría financiera ni una señal de compra o venta.</p>
            </div>
          </>
        ) : (
          <p className="vacio">Ninguna vela consagrada todavía.</p>
        )}
      </section>
        </>
      ) : (
        <Cronica
          key={`${simbolo}|${intervalo}|${genero}|${capitulos}`}
          simbolo={simbolo}
          intervalo={intervalo}
          onSimbolo={setSimbolo}
          onIntervalo={setIntervalo}
          seleccion={seleccion}
          onSeleccion={setSeleccion}
          genero={genero}
          onGenero={setGenero}
          premisa={premisa}
          onPremisa={setPremisa}
          capitulos={capitulos}
          onCapitulos={setCapitulos}
          generos={config?.generos || []}
        />
      )}

      <VelasDeCera />

      <footer className="pie">
        <span>WICKFABLE</span>
        <span>el precio no predice: revela</span>
        <span>obra de ficción · no es asesoría financiera · es liturgia</span>
      </footer>

      {aviso ? <div className="aviso">{aviso}</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </div>
  )
}

function indiceInicial(d) {
  const cartas = d?.tirada?.cartas || []
  const presente = cartas.find((c) => c.posicion === 'presente')
  if (presente?.indice != null) return presente.indice
  return (d?.velas?.length || 1) - 1
}

function num(n) {
  if (n == null) return '—'
  if (n >= 1000) return n.toFixed(0)
  if (n >= 100) return n.toFixed(2)
  if (n >= 1) return n.toFixed(3)
  return n.toFixed(5)
}

function motor(m, modelo) {
  if (m === 'ia') return modelo ? `inteligencia oracular · ${modelo}` : 'inteligencia oracular'
  if (m === 'oraculo-local') return 'oráculo local'
  return '…'
}
