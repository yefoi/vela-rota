import { useEffect, useRef, useState } from 'react'

const ORO = '#d9b45b'
const CERA = '#e7d2a0'
const SANGRE = '#a32538'

export default function CandleChart({ velas, sigilos, selectedIndex, onSelect, mostrarSenales }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [size, setSize] = useState({ w: 800, h: 420 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const ro = new ResizeObserver((entradas) => {
      const caja = entradas[0].contentRect
      setSize({ w: Math.max(320, caja.width), h: Math.max(300, caja.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !velas?.length) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    dibujar(ctx, size.w, size.h, velas, sigilos, selectedIndex, hover, mostrarSenales)
  }, [velas, sigilos, selectedIndex, hover, size, mostrarSenales])

  function indiceDesdeX(clientX) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pad = 12
    const plotW = rect.width - pad - 64
    const i = Math.floor(((x - pad) / plotW) * velas.length)
    return i >= 0 && i < velas.length ? i : null
  }

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onMouseMove={(e) => setHover(indiceDesdeX(e.clientX))}
        onMouseLeave={() => setHover(null)}
        onClick={() => hover != null && onSelect?.(hover)}
      />
      {velas?.length ? (
        <div className="chart-marca">
          <span>vela {hover != null ? hover + 1 : (selectedIndex ?? 0) + 1}</span>
          <span className="marca-sep">/</span>
          <span>{velas.length}</span>
          <span className="marca-hint">click para consagrar</span>
        </div>
      ) : null}
    </div>
  )
}

function dibujar(ctx, w, h, velas, sigilos, selectedIndex, hover, mostrarSenales) {
  ctx.clearRect(0, 0, w, h)
  const pad = { top: 26, right: 64, bottom: 24, left: 12 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom
  const volH = plotH * 0.16
  const priceH = plotH - volH - 8

  const min = Math.min(...velas.map((v) => v.low))
  const max = Math.max(...velas.map((v) => v.high))
  const margen = (max - min) * 0.06 || 1
  const yMin = min - margen
  const yMax = max + margen
  const y = (p) => pad.top + priceH - ((p - yMin) / (yMax - yMin)) * priceH
  const maxVol = Math.max(...velas.map((v) => v.volume), 1)
  const paso = plotW / velas.length
  const ancho = Math.max(2, Math.min(16, paso * 0.6))

  // Rejilla y precios
  ctx.font = '10px "Share Tech Mono", monospace'
  for (let g = 0; g <= 4; g++) {
    const py = pad.top + (priceH / 4) * g
    const precio = yMax - ((yMax - yMin) / 4) * g
    ctx.strokeStyle = 'rgba(214, 180, 120, 0.08)'
    ctx.beginPath()
    ctx.moveTo(pad.left, py)
    ctx.lineTo(pad.left + plotW, py)
    ctx.stroke()
    ctx.fillStyle = 'rgba(214, 180, 120, 0.45)'
    ctx.fillText(formato(precio), pad.left + plotW + 6, py + 3)
  }

  velas.forEach((v, i) => {
    const cx = pad.left + paso * (i + 0.5)
    const sube = v.close >= v.open
    const color = sube ? CERA : SANGRE
    const borde = sube ? '#f6e9c4' : '#d94b5c'
    const yA = y(Math.max(v.open, v.close))
    const yB = y(Math.min(v.open, v.close))
    const cuerpoH = Math.max(1.5, yB - yA)
    const ilumina = i === selectedIndex || i === hover

    ctx.globalAlpha = ilumina ? 1 : 0.82
    // mecha
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, y(v.high))
    ctx.lineTo(cx, y(v.low))
    ctx.stroke()
    // cuerpo
    ctx.fillStyle = color
    if (ilumina) {
      ctx.shadowColor = ORO
      ctx.shadowBlur = 14
    }
    ctx.fillRect(cx - ancho / 2, yA, ancho, cuerpoH)
    ctx.shadowBlur = 0
    ctx.strokeStyle = borde
    ctx.strokeRect(cx - ancho / 2 + 0.5, yA + 0.5, ancho - 1, cuerpoH - 1)

    // volumen
    const vh = (v.volume / maxVol) * volH
    ctx.globalAlpha = ilumina ? 0.6 : 0.22
    ctx.fillStyle = color
    ctx.fillRect(cx - ancho / 2, pad.top + priceH + 8 + (volH - vh), ancho, vh)
    ctx.globalAlpha = 1

    if (ilumina) {
      ctx.strokeStyle = ORO
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(cx, pad.top)
      ctx.lineTo(cx, pad.top + priceH + 8 + volH)
      ctx.stroke()
      ctx.globalAlpha = 1
      const sig = sigilos?.[i]?.sigilo
      if (sig) {
        ctx.fillStyle = ORO
        ctx.textAlign = 'center'
        ctx.font = '13px "Cinzel", serif'
        ctx.fillText(sig.roman || glifoPalo(sig.palo), cx, pad.top - 10)
        ctx.textAlign = 'left'
      }
    }
  })

  // Capa de señal: solo Arcanos Mayores (dorado; rosado si van invertidos)
  if (mostrarSenales) {
    velas.forEach((v, i) => {
      if (i === selectedIndex || i === hover) return
      const sig = sigilos?.[i]?.sigilo
      if (!sig || sig.tipo !== 'mayor') return
      const cx = pad.left + paso * (i + 0.5)
      const cy = pad.top - 11
      ctx.fillStyle = sig.orientacion === 'invertido' ? 'rgba(217, 106, 130, 0.95)' : 'rgba(217, 180, 91, 0.95)'
      ctx.beginPath()
      ctx.moveTo(cx, cy - 3.4)
      ctx.lineTo(cx + 3.4, cy)
      ctx.lineTo(cx, cy + 3.4)
      ctx.lineTo(cx - 3.4, cy)
      ctx.closePath()
      ctx.fill()
    })
  }

  // lectura emergente de la vela señalada
  const idx = hover ?? selectedIndex
  if (idx != null && velas[idx]) {
    const v = velas[idx]
    const texto = `A ${formato(v.open)}  M ${formato(v.high)}  m ${formato(v.low)}  C ${formato(v.close)}`
    ctx.font = '11px "Share Tech Mono", monospace'
    const ancho2 = ctx.measureText(texto).width + 16
    ctx.fillStyle = 'rgba(10, 8, 8, 0.85)'
    ctx.strokeStyle = 'rgba(217, 180, 91, 0.5)'
    ctx.fillRect(pad.left, 4, ancho2, 18)
    ctx.strokeRect(pad.left + 0.5, 4.5, ancho2 - 1, 17)
    ctx.fillStyle = ORO
    ctx.fillText(texto, pad.left + 8, 17)
  }
}

function formato(n) {
  if (n >= 1000) return n.toFixed(0)
  if (n >= 100) return n.toFixed(2)
  if (n >= 1) return n.toFixed(3)
  return n.toFixed(5)
}

function glifoPalo(palo) {
  return { Bastos: '🜂', Copas: '🜄', Espadas: '🜁', Oros: '🜃' }[palo] || '✦'
}
