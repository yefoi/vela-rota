import { useEffect, useRef, useState } from 'react'
import { analizarCronica, streamCronica } from '../api.js'

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

export default function Cronica({ simbolo, intervalo, seleccion, onSeleccion }) {
  const [datos, setDatos] = useState(null)
  const [cap, setCap] = useState(5)
  const [premisa, setPremisa] = useState('')
  const [capitulos, setCapitulos] = useState([])
  const [fase, setFase] = useState('inactivo')
  const [motor, setMotor] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    let vivo = true
    analizarCronica({ symbol: simbolo, interval: intervalo, capitulos: cap })
      .then((d) => {
        if (vivo) {
          setDatos(d)
          setError(null)
        }
      })
      .catch((e) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [simbolo, intervalo, cap])

  useEffect(() => () => abortRef.current?.abort(), [])

  function tejer() {
    const beats = datos?.beats
    if (!beats?.length) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setCapitulos([])
    setError(null)
    setMotor(null)
    setFase('tejiendo')
    streamCronica(
      { symbol: simbolo, interval: intervalo, capitulos: cap, premisa },
      {
        signal: ctrl.signal,
        onMeta: (meta) => setDatos((prev) => ({ ...(prev || {}), ...meta })),
        onCapitulo: (c) => {
          onSeleccion?.(c.indice)
          setCapitulos((prev) => [...prev, { ...c, texto: '' }])
        },
        onTrozo: (t) =>
          setCapitulos((prev) => {
            if (!prev.length) return prev
            const copia = prev.slice()
            const ultimo = copia[copia.length - 1]
            copia[copia.length - 1] = { ...ultimo, texto: ultimo.texto + t.texto }
            return copia
          }),
        onFin: (fin) => {
          setMotor(fin)
          setFase('listo')
        },
      },
    ).catch((e) => {
      if (e?.name !== 'AbortError') {
        setError(e.message)
        setFase('inactivo')
      }
    })
  }

  function descargar() {
    const texto = [
      `LA CRÓNICA DE ${datos?.symbol || simbolo} · ${intervalo}`,
      datos?.trama || '',
      '',
      ...capitulos.map((c) => `${c.acto} — ${c.titulo} (${c.tono})\n${c.texto}`),
    ].join('\n\n')
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = `cronica-${simbolo}-${intervalo}.txt`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  const beats = datos?.beats || []
  const tejiendo = fase === 'tejiendo'

  return (
    <>
      <aside className="oraculo cronica-panel">
        <div className="oraculo-cabecera">
          <h2 className="seccion-titulo">La Crónica</h2>
        </div>
        <p className="seccion-glosa">
          el precio dicta el ánimo; el ánimo teje la historia
        </p>
        {datos?.trama ? <p className="cronica-trama">{datos.trama}</p> : null}

        <div className="pregunta">
          <input
            value={premisa}
            maxLength={200}
            placeholder="Premisa o protagonista (opcional)…"
            onChange={(e) => setPremisa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tejer()}
          />
          <button type="button" onClick={tejer} disabled={tejiendo}>
            {tejiendo ? 'tejiendo…' : 'Tejer'}
          </button>
        </div>

        <label className="control cronica-cap">
          <span>actos</span>
          <select value={cap} onChange={(e) => setCap(Number(e.target.value))}>
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <ol className="actos">
          {beats.map((b, i) => (
            <li key={`${b.indice}-${i}`} className={`acto mood-${b.mood} ${seleccion === b.indice ? 'acto-activo' : ''}`}>
              <button type="button" onClick={() => onSeleccion?.(b.indice)}>
                <span className="acto-glifo">{GLIFO[b.mood] || '●'}</span>
                <span className="acto-texto">
                  <b>{b.acto} · {b.titulo}</b>
                  <i>{b.tono} · {b.cambioTxt}</i>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {error ? <p className="cronica-error">{error}</p> : null}
      </aside>

      <section className="lectura cronica">
        {capitulos.length ? (
          <div className="cronica-relato">
            <div className="lectura-acciones">
              <button type="button" onClick={descargar}>descargar</button>
            </div>
            <h2 className="seccion-titulo">
              {datos?.protagonista || 'La Crónica'}
              <span className="lectura-fecha">{capitulos.length} actos</span>
            </h2>
            {capitulos.map((c, i) => (
              <article key={`${c.indice}-${i}`} className={`cronica-acto mood-${c.mood}`}>
                <h3 className="cronica-acto-titulo">{c.acto} — {c.titulo}</h3>
                <span className="cronica-acto-tono">{c.tono} · {c.cambioTxt}</span>
                <p className="cronica-acto-texto">
                  {c.texto}
                  {tejiendo && i === capitulos.length - 1 ? <span className="cursor">▌</span> : null}
                </p>
              </article>
            ))}
            <p className="motor">
              motor: {motor?.motor === 'ia' ? `inteligencia oracular · ${motor.modelo || ''}` : motor ? 'oráculo local' : '…'}
            </p>
          </div>
        ) : (
          <p className="vacio">
            El pergamino está en blanco. Pulsá «Tejer» para que el precio cuente una historia.
          </p>
        )}
      </section>
    </>
  )
}
