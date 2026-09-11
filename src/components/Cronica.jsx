import { useEffect, useRef, useState } from 'react'
import { analizarCronica, streamCronica } from '../api.js'
import { descargarPergamino, generarPergamino } from '../compartir.js'

const GLIFO = {
  mania: '☀',
  euforia: '☀',
  ambicion: '▲',
  calma: '●',
  duda: '?',
  temor: '▼',
  panico: '⚡',
  ruina: '✖',
  rechazo: '⤓',
  rescate: '⤒',
}

function claveGuardado(simbolo, intervalo, genero, premisa) {
  return `vela-rota:cronica:${simbolo}|${intervalo}|${genero}|${premisa}`
}

export default function Cronica({
  simbolo,
  intervalo,
  seleccion,
  onSeleccion,
  genero,
  onGenero,
  premisa,
  onPremisa,
  capitulos,
  onCapitulos,
  generos,
}) {
  const [datos, setDatos] = useState(null)
  const [relato, setRelato] = useState([])
  const [resumenRodante, setResumenRodante] = useState('')
  const [fase, setFase] = useState('inactivo')
  const [motor, setMotor] = useState(null)
  const [error, setError] = useState(null)
  const [vozOn, setVozOn] = useState(false)
  const [hablante, setHablante] = useState(-1)
  const [aviso, setAviso] = useState(null)

  const abortRef = useRef(null)
  const capsRef = useRef([])
  const premisaRef = useRef(premisa)
  const vozRef = useRef(vozOn)
  const nodosRef = useRef({})

  useEffect(() => {
    premisaRef.current = premisa
  }, [premisa])
  useEffect(() => {
    vozRef.current = vozOn
  }, [vozOn])
  useEffect(() => {
    capsRef.current = relato
  }, [relato])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  useEffect(() => {
    let vivo = true
    analizarCronica({ symbol: simbolo, interval: intervalo, capitulos, genero })
      .then((d) => {
        if (!vivo) return
        setDatos(d)
        try {
          const crudo = localStorage.getItem(claveGuardado(simbolo, intervalo, genero, premisaRef.current))
          if (crudo) {
            const guardado = JSON.parse(crudo)
            if (Array.isArray(guardado.capitulos) && guardado.capitulos.length) {
              setRelato(guardado.capitulos)
              setResumenRodante(guardado.resumen || '')
              setMotor(guardado.motor || null)
              setFase('listo')
            }
          }
        } catch {
          /* saga corrupta: se ignora */
        }
      })
      .catch((e) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [simbolo, intervalo, genero, capitulos])

  function guardar(caps, resumen, info) {
    try {
      localStorage.setItem(
        claveGuardado(simbolo, intervalo, genero, premisaRef.current),
        JSON.stringify({
          capitulos: caps,
          resumen,
          motor: info || motor,
          protagonista: datos?.protagonista,
          trama: datos?.trama,
        }),
      )
    } catch {
      /* sin almacenamiento */
    }
  }

  function ultimoOpenTime() {
    return relato.length ? relato[relato.length - 1].openTime : 0
  }

  function tejer(continuar) {
    const beats = datos?.beats
    if (!beats?.length) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    detener()

    const desde = continuar ? ultimoOpenTime() : 0
    const inicio = continuar ? relato.length : 0
    const resumen = continuar ? resumenRodante : ''
    if (!continuar) {
      setRelato([])
      setResumenRodante('')
    }
    setError(null)
    setMotor(null)
    setFase('tejiendo')

    streamCronica(
      { symbol: simbolo, interval: intervalo, capitulos, premisa, genero, desde, inicio, resumen },
      {
        signal: ctrl.signal,
        onMeta: (meta) => setDatos((prev) => ({ ...(prev || {}), ...meta })),
        onCapitulo: (c) => {
          onSeleccion?.(c.indice)
          setRelato((prev) => [...prev, { ...c, texto: '' }])
        },
        onTrozo: (t) =>
          setRelato((prev) => {
            if (!prev.length) return prev
            const copia = prev.slice()
            const ultimo = copia[copia.length - 1]
            copia[copia.length - 1] = { ...ultimo, texto: ultimo.texto + t.texto }
            return copia
          }),
        onFin: (fin) => {
          setMotor(fin)
          setFase('listo')
          setRelato((prev) => {
            const resumen = prev.map((c) => c.texto).join(' ').slice(-1000)
            setResumenRodante(resumen)
            guardar(prev, resumen, fin)
            if (vozRef.current) narrar(prev)
            return prev
          })
        },
      },
    ).catch((e) => {
      if (e?.name !== 'AbortError') {
        setError(e.message)
        setFase('inactivo')
      }
    })
  }

  function nueva() {
    abortRef.current?.abort()
    detener()
    setRelato([])
    setResumenRodante('')
    setMotor(null)
    setFase('inactivo')
    try {
      localStorage.removeItem(claveGuardado(simbolo, intervalo, genero, premisaRef.current))
    } catch {
      /* sin almacenamiento */
    }
  }

  function narrar(caps) {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const voces = synth.getVoices()
    const voz = voces.find((v) => /^es[-_]/i.test(v.lang)) || voces.find((v) => /spanish|español/i.test(v.name))
    caps.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(`${c.acto}. ${c.texto}`)
      if (voz) u.voice = voz
      u.lang = voz?.lang || 'es-ES'
      u.rate = 0.95
      u.pitch = 0.9
      u.onstart = () => {
        setHablante(i)
        nodosRef.current[c.indice]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
      }
      if (i === caps.length - 1) u.onend = () => setHablante(-1)
      synth.speak(u)
    })
  }

  function detener() {
    window.speechSynthesis?.cancel()
    setHablante(-1)
  }

  function alternarVoz() {
    const siguiente = !vozOn
    setVozOn(siguiente)
    if (siguiente && fase === 'listo' && relato.length) narrar(relato)
    if (!siguiente) detener()
  }

  function elegirGenero(clave) {
    onGenero(clave)
    setFase('inactivo')
    setRelato([])
  }

  async function alDescargar() {
    if (!relato.length) return
    const canvas = await generarPergamino(
      {
        carta: { nombre: `${datos?.protagonista || 'La Crónica'} — ${genero}` },
        orientacion: '',
        pregunta: premisa,
        texto: relato.map((c) => `${c.acto} · ${c.titulo}\n${c.texto}`).join('\n\n'),
      },
      { symbol: simbolo, interval: intervalo },
    )
    descargarPergamino(canvas, `cronica-${simbolo}-${intervalo}.png`)
  }

  function avisar(mensaje) {
    setAviso(mensaje)
    setTimeout(() => setAviso(null), 2400)
  }

  async function alCopiar() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      avisar('enlace copiado')
    } catch {
      avisar('no se pudo copiar')
    }
  }

  const beats = datos?.beats || []
  const tejiendo = fase === 'tejiendo'
  const hayNuevos = relato.length > 0 && beats.some((b) => b.openTime > ultimoOpenTime())

  return (
    <>
      <aside className="oraculo cronica-panel">
        <div className="oraculo-cabecera">
          <h2 className="seccion-titulo">La Crónica</h2>
          <button type="button" className={`vivo ${vozOn ? 'vivo-on' : ''}`} onClick={alternarVoz}>
            {vozOn ? '♪ voz' : '♪ voz off'}
          </button>
        </div>
        <p className="seccion-glosa">el precio dicta el ánimo; el ánimo teje la historia</p>
        {datos?.trama ? <p className="cronica-trama">{datos.trama}</p> : null}

        <div className="cronica-controles">
          <label className="control">
            <span>género</span>
            <select value={genero} onChange={(e) => elegirGenero(e.target.value)}>
              {(generos.length ? generos : [{ clave: 'epico', nombre: 'Épico' }]).map((g) => (
                <option key={g.clave} value={g.clave}>{g.nombre}</option>
              ))}
            </select>
          </label>
          <label className="control">
            <span>actos</span>
            <select value={capitulos} onChange={(e) => onCapitulos(Number(e.target.value))}>
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="pregunta">
          <input
            value={premisa}
            maxLength={180}
            placeholder="Premisa o protagonista (opcional)…"
            onChange={(e) => onPremisa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tejer(false)}
          />
        </div>

        <div className="cronica-botones">
          <button type="button" className="consultar" onClick={() => tejer(false)} disabled={tejiendo || !beats.length}>
            {tejiendo ? 'tejiendo…' : 'Tejer'}
          </button>
          {relato.length ? (
            <button type="button" className="consultar" onClick={() => tejer(true)} disabled={tejiendo}>
              Continuar
            </button>
          ) : null}
          {relato.length ? (
            <button type="button" className="consultar" onClick={nueva}>Nueva</button>
          ) : null}
        </div>
        {relato.length ? (
          <p className={`cronica-pista ${hayNuevos ? 'hay-nuevos' : ''}`}>
            {hayNuevos ? 'hay velas nuevas: puedes continuar la saga' : 'la saga está al día con el mercado'}
          </p>
        ) : null}

        {beats.length ? (
          <div className="timeline">
            {beats.map((b, i) => (
              <button
                key={`${b.indice}-${i}`}
                type="button"
                className={`nodo mood-${b.mood} ${seleccion === b.indice ? 'nodo-activo' : ''} ${hablante === i ? 'nodo-habla' : ''}`}
                onClick={() => onSeleccion?.(b.indice)}
              >
                <span className="nodo-glifo">{GLIFO[b.mood] || '●'}</span>
                <span className="nodo-funcion">{b.funcion}</span>
                <span className="nodo-cambio">{b.cambioTxt}</span>
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="cronica-error">{error}</p> : null}
      </aside>

      <section className="lectura cronica">
        {relato.length ? (
          <div className="cronica-relato">
            <div className="lectura-acciones">
              <button type="button" onClick={alCopiar}>copiar enlace</button>
              <button type="button" onClick={alDescargar}>pergamino</button>
              {hablante >= 0 ? (
                <button type="button" onClick={detener}>detener voz</button>
              ) : null}
            </div>
            <h2 className="seccion-titulo">
              {datos?.protagonista || 'La Crónica'}
              <span className="lectura-fecha">{relato.length} actos · {genero}</span>
            </h2>
            {relato.map((c, i) => (
              <article
                key={`${c.indice}-${i}`}
                ref={(el) => { nodosRef.current[c.indice] = el }}
                className={`cronica-acto mood-${c.mood} ${hablante === i ? 'esta-hablando' : ''}`}
              >
                <h3 className="cronica-acto-titulo">{c.acto} — {c.titulo}</h3>
                <span className="cronica-acto-tono">{c.funcion} · {c.tono} · {c.cambioTxt}</span>
                <p className="cronica-acto-texto">
                  {c.texto}
                  {tejiendo && i === relato.length - 1 ? <span className="cursor">▌</span> : null}
                </p>
                {c.estado ? <Estado estado={c.estado} /> : null}
              </article>
            ))}
            <p className="motor">
              motor: {motor?.motor === 'ia' ? `inteligencia oracular · ${motor.modelo || ''}` : motor ? 'oráculo local' : '…'}
            </p>
          </div>
        ) : (
          <p className="vacio">
            El pergamino está en blanco. Elige un género, escribe una premisa si quieres y pulsa «Tejer».
          </p>
        )}
      </section>

      {aviso ? <div className="aviso">{aviso}</div> : null}
    </>
  )
}

function Estado({ estado }) {
  return (
    <div className="estado">
      <span><i>riqueza</i> {estado.riqueza}</span>
      <span><i>heridas</i> {estado.heridas}</span>
      <span><i>deuda</i> {estado.deuda}</span>
      {estado.lugar ? <span><i>lugar</i> {estado.lugar}</span> : null}
      {estado.aliados?.length ? <span><i>aliados</i> {estado.aliados.join(', ')}</span> : null}
      {estado.objetos?.length ? <span><i>objetos</i> {estado.objetos.join(', ')}</span> : null}
    </div>
  )
}
