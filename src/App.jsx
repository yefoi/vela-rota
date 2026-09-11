import { useEffect, useState } from 'react'
import { consultarAltar, obtenerConfig, pedirLectura } from './api.js'
import CandleChart from './components/CandleChart.jsx'
import Ruido from './components/Ruido.jsx'
import TarotCard from './components/TarotCard.jsx'
import VelasDeCera from './components/VelasDeCera.jsx'

export default function App() {
  const [config, setConfig] = useState(null)
  const [simbolo, setSimbolo] = useState('BTCUSDT')
  const [intervalo, setIntervalo] = useState('1h')
  const [data, setData] = useState(null)
  const [seleccion, setSeleccion] = useState(null)
  const [lectura, setLectura] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerConfig().then(setConfig).catch(() => {})
  }, [])

  useEffect(() => {
    let vivo = true
    consultarAltar(simbolo, intervalo)
      .then((d) => {
        if (!vivo) return
        setData(d)
        const idx = d.velas.length - 1
        setSeleccion(idx)
        setLectura(d.tirada?.futuro ?? null)
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [simbolo, intervalo])

  async function consagrar(idx) {
    setSeleccion(idx)
    try {
      const r = await pedirLectura(simbolo, intervalo, idx)
      setLectura(r.lectura)
    } catch (e) {
      setError(e.message)
    }
  }

  function consagrarPorTiempo(openTime) {
    if (!data?.velas) return
    const idx = data.velas.findIndex((v) => v.openTime === openTime)
    if (idx >= 0) consagrar(idx)
  }

  const tirada = data?.tirada

  return (
    <div className="app">
      <Ruido />

      <header className="cabecera">
        <div className="titulo-bloque">
          <h1 className="titulo" data-texto="VELA ROTA">VELA ROTA</h1>
          <p className="lema">
            los mercados como oráculo · cada vela es una carta tendida en el altar
          </p>
        </div>

        <div className="controles">
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
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="consultar"
            onClick={consultarManual}
          >
            Consultar
          </button>
        </div>
      </header>

      <section className="mesa">
        <div className="mesa-barra">
          <span className="par">{simbolo}<i>·</i>{intervalo}</span>
          {data ? (
            <span className={`fuente fuente-${data.fuente}`}>
              {data.fuente === 'binance' ? 'velas reales · binance' : 'velas sintéticas · el mundo calló'}
            </span>
          ) : null}
          {cargando ? <span className="cargando">consultando el altar…</span> : null}
        </div>

        <CandleChart
          velas={data?.velas}
          sigilos={data?.sigilos}
          selectedIndex={seleccion}
          onSelect={consagrar}
        />

        <div className="leyenda">
          <span><i className="punto punto-alza" /> alza = carta derecha</span>
          <span><i className="punto punto-baja" /> baja = carta invertida</span>
          <span><i className="punto punto-cruz" /> doji = tendida en cruz</span>
          <span className="glifo-pista">recorre el gráfico y clickea una vela para consagrarla</span>
        </div>
      </section>

      <aside className="oraculo">
        <h2 className="seccion-titulo">La Tirada</h2>
        <p className="seccion-glosa">tres velas del ciclo, leídas como arcana</p>

        <div className="tirada">
          {tirada ? (
            ['pasado', 'presente', 'futuro'].map((pos) => (
              <TarotCard
                key={pos}
                carta={tirada[pos].carta}
                posicion={tirada[pos].posicionTitulo}
                active={seleccion === indiceDe(data, tirada[pos].openTime)}
                onClick={() => consagrarPorTiempo(tirada[pos].openTime)}
              />
            ))
          ) : (
            ['pasado', 'presente', 'futuro'].map((p) => (
              <div key={p} className="tarot tarot-vacia">
                <span className="tarot-posicion">{p}</span>
                <span className="tarot-glifo">✧</span>
              </div>
            ))
          )}
        </div>

        {tirada?.mandato ? (
          <div className="mandato">
            <p className="mandato-apertura">{tirada.mandato.apertura}</p>
            <p className="mandato-sintesis">{tirada.mandato.sintesis}</p>
            <p className="mandato-cierre">{tirada.mandato.cierre}</p>
          </div>
        ) : null}
      </aside>

      <section className="lectura">
        {lectura ? (
          <>
            <div className="lectura-carta">
              <TarotCard carta={lectura.carta} active compact />
              <span className="motor">motor: {motor(lectura.motor)}</span>
            </div>
            <div className="lectura-texto">
              <h2 className="seccion-titulo">
                {lectura.posicionTitulo}
                <span className="lectura-fecha">
                  {new Date(lectura.openTime).toISOString().replace('T', ' ').slice(0, 16)} utc
                </span>
              </h2>
              <p className="lectura-versiculo">
                {lectura.carta.roman ? `${lectura.carta.roman}. ` : ''}
                {lectura.carta.nombre}
                <span className={`sello sello-${lectura.orientacion}`}>{lectura.orientacion}</span>
              </p>
              {lectura.parrafos.map((p, i) => (
                <p key={i} className="lectura-parrafo">{p}</p>
              ))}

              <dl className="datos">
                <div><dt>apertura</dt><dd>{num(lectura.apertura)}</dd></div>
                <div><dt>cierre</dt><dd>{num(lectura.cierre)}</dd></div>
                <div><dt>máximo</dt><dd>{num(lectura.maximo)}</dd></div>
                <div><dt>mínimo</dt><dd>{num(lectura.minimo)}</dd></div>
                <div><dt>volumen</dt><dd>{num(lectura.volumen)}</dd></div>
                <div><dt>cambio</dt><dd className={lectura.cambio >= 0 ? 'sube' : 'baja'}>{lectura.cambioTxt}</dd></div>
              </dl>
            </div>
          </>
        ) : (
          <p className="vacio">Ninguna vela consagrada todavía.</p>
        )}
      </section>

      <VelasDeCera />

      <footer className="pie">
        <span>VELA ROTA</span>
        <span>el precio no predice: revela</span>
        <span>no es consejo de inversión · es liturgia</span>
      </footer>

      {error ? <div className="error">{error}</div> : null}
    </div>
  )

  function consultarManual() {
    setCargando(true)
    setError(null)
    consultarAltar(simbolo, intervalo)
      .then((d) => {
        setData(d)
        const idx = d.velas.length - 1
        setSeleccion(idx)
        setLectura(d.tirada?.futuro ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }
}

function indiceDe(data, openTime) {
  return data?.velas?.findIndex((v) => v.openTime === openTime) ?? -1
}

function num(n) {
  if (n == null) return '—'
  if (n >= 1000) return n.toFixed(0)
  if (n >= 100) return n.toFixed(2)
  if (n >= 1) return n.toFixed(3)
  return n.toFixed(5)
}

function motor(m) {
  return m === 'ia' ? 'inteligencia oracular' : 'oráculo local'
}
