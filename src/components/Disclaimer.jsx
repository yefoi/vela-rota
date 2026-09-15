import { useState } from 'react'

const CLAVE = 'vela-rota:aviso'

export default function Disclaimer() {
  const [aceptado, setAceptado] = useState(() => {
    try {
      return localStorage.getItem(CLAVE) === '1'
    } catch {
      return false
    }
  })

  function aceptar() {
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      /* sin almacenamiento */
    }
    setAceptado(true)
  }

  return (
    <>
      {!aceptado ? (
        <div className="aviso-fondo" role="dialog" aria-modal="true" aria-label="Aviso legal">
          <div className="aviso-caja">
            <h2 className="titulo aviso-titulo" data-texto="WICKFABLE">WICKFABLE</h2>
            <p className="aviso-lead">Antes de encender la vela, un aviso que no es letra pequeña.</p>
            <p>
              WICKFABLE es una obra de <strong>ficción</strong>. Toma precios reales de mercado y los
              convierte en cartas de tarot y crónicas inventadas por una máquina.
            </p>
            <p>
              Ninguna lectura, carta, clima, tirada o crónica constituye <strong>asesoría financiera</strong>,
              análisis de inversión ni recomendación de compra, venta o tenencia de ningún activo.
              No tomes decisiones de inversión basándote en nada de lo que aparece aquí.
            </p>
            <button type="button" className="consultar aviso-boton" onClick={aceptar}>
              Lo entiendo. Encender la vela.
            </button>
          </div>
        </div>
      ) : null}

      <div className="cinta" role="note">
        <span>Ficción generada por IA sobre datos reales de mercado</span>
        <span className="cinta-sep">·</span>
        <span>no es asesoría financiera ni recomendación de inversión</span>
      </div>
    </>
  )
}
