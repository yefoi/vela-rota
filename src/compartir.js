// Convierte una lectura en un pergamino PNG, para descargar o compartir.

const COLOR = {
  oro: '#d9b45b',
  tinta: '#e6d9bd',
  suave: '#9a8c72',
}

export async function generarPergamino(lectura, meta = {}) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* seguimos con las fuentes del sistema */
    }
  }

  const W = 900
  const H = 1280
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#0d0a08')
  grad.addColorStop(0.5, '#0a0807')
  grad.addColorStop(1, '#070505')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(217, 180, 91, 0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.strokeStyle = 'rgba(217, 180, 91, 0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.textAlign = 'center'
  ctx.fillStyle = COLOR.oro
  ctx.font = '700 46px Cinzel, Georgia, serif'
  ctx.fillText('VELA ROTA', W / 2, 122)

  ctx.fillStyle = COLOR.suave
  ctx.font = 'italic 20px "EB Garamond", Georgia, serif'
  ctx.fillText(`${meta.symbol || ''} · ${meta.interval || ''}`, W / 2, 158)

  ctx.fillStyle = COLOR.tinta
  ctx.font = '600 30px Cinzel, Georgia, serif'
  const nombre = `${lectura.carta.roman ? lectura.carta.roman + '. ' : ''}${lectura.carta.nombre}`
  ctx.fillText(nombre, W / 2, 224)

  ctx.fillStyle = COLOR.oro
  ctx.font = '15px "Share Tech Mono", monospace'
  ctx.fillText(String(lectura.orientacion || '').toUpperCase(), W / 2, 254)

  let y = 300
  if (lectura.pregunta) {
    ctx.fillStyle = COLOR.suave
    ctx.font = 'italic 19px "EB Garamond", Georgia, serif'
    y = centrado(ctx, `«${lectura.pregunta}»`, W / 2, y, W - 180, 28) + 16
  }

  ctx.strokeStyle = 'rgba(217, 180, 91, 0.25)'
  ctx.beginPath()
  ctx.moveTo(90, y)
  ctx.lineTo(W - 90, y)
  ctx.stroke()
  y += 40

  const parrafos = String(lectura.texto || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  ctx.textAlign = 'left'
  for (const parrafo of parrafos) {
    ctx.fillStyle = COLOR.tinta
    ctx.font = '22px "EB Garamond", Georgia, serif'
    y = izquierda(ctx, parrafo, 90, y, W - 180, 34)
    y += 16
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = COLOR.suave
  ctx.font = '14px "Share Tech Mono", monospace'
  ctx.fillText('el precio no predice: revela', W / 2, H - 84)
  ctx.fillText('ficción · no es asesoría financiera', W / 2, H - 64)

  return canvas
}

function izquierda(ctx, texto, x, y, maxAncho, interlinea) {
  for (const linea of envolver(ctx, texto, maxAncho)) {
    ctx.fillText(linea, x, y)
    y += interlinea
  }
  return y
}

function centrado(ctx, texto, cx, y, maxAncho, interlinea) {
  for (const linea of envolver(ctx, texto, maxAncho)) {
    ctx.fillText(linea, cx, y)
    y += interlinea
  }
  return y
}

function envolver(ctx, texto, maxAncho) {
  const palabras = String(texto).split(/\s+/)
  const lineas = []
  let actual = ''
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (ctx.measureText(prueba).width > maxAncho && actual) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = prueba
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

export async function generarPergaminoTirada(tirada, meta = {}) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* seguimos con las fuentes del sistema */
    }
  }

  const W = 900
  const H = 1320
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#0d0a08')
  grad.addColorStop(0.5, '#0a0807')
  grad.addColorStop(1, '#070505')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(217, 180, 91, 0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.strokeStyle = 'rgba(217, 180, 91, 0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.textAlign = 'center'
  ctx.fillStyle = COLOR.oro
  ctx.font = '700 42px Cinzel, Georgia, serif'
  ctx.fillText('LA TIRADA', W / 2, 116)

  ctx.fillStyle = COLOR.suave
  ctx.font = 'italic 19px "EB Garamond", Georgia, serif'
  ctx.fillText(`${meta.symbol || ''} · ${meta.interval || ''} · ${meta.modo || ''}`, W / 2, 150)

  let y = 210
  for (const carta of tirada.cartas || []) {
    const orient = carta.orientacion || ''
    ctx.textAlign = 'left'
    ctx.fillStyle = COLOR.oro
    ctx.font = '13px "Share Tech Mono", monospace'
    ctx.fillText(String(carta.posicionTitulo || carta.posicion || '').toUpperCase(), 90, y)
    y += 26
    ctx.fillStyle = orient === 'invertido' ? '#d98a9a' : COLOR.tinta
    ctx.font = '600 24px Cinzel, Georgia, serif'
    ctx.fillText(`${carta.carta.roman ? carta.carta.roman + '. ' : ''}${carta.carta.nombre}`, 90, y)
    ctx.fillStyle = COLOR.suave
    ctx.font = '13px "Share Tech Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(orient.toUpperCase(), W - 90, y)
    ctx.textAlign = 'left'
    y += 30
  }

  y += 10
  ctx.strokeStyle = 'rgba(217, 180, 91, 0.25)'
  ctx.beginPath()
  ctx.moveTo(90, y)
  ctx.lineTo(W - 90, y)
  ctx.stroke()
  y += 40

  const analisis = tirada.mandato?.analisis?.texto || ''
  if (analisis) {
    ctx.fillStyle = COLOR.tinta
    ctx.font = '21px "EB Garamond", Georgia, serif'
    y = izquierda(ctx, analisis, 90, y, W - 180, 32)
    y += 18
  }

  const sintesis = tirada.mandato?.sintesis || ''
  if (sintesis) {
    ctx.fillStyle = COLOR.oro
    ctx.font = 'italic 20px "EB Garamond", Georgia, serif'
    izquierda(ctx, sintesis, 90, y, W - 180, 30)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = COLOR.suave
  ctx.font = '14px "Share Tech Mono", monospace'
  ctx.fillText('el precio no predice: revela', W / 2, H - 84)
  ctx.fillText('ficción · no es asesoría financiera', W / 2, H - 64)

  return canvas
}

export function nombreArchivo(lectura, meta = {}) {
  const par = `${meta.symbol || 'mercado'}-${meta.interval || ''}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const carta = String(lectura?.carta?.nombre || 'carta').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `vela-rota-${par}-${carta}.png`
}

export function descargarPergamino(canvas, nombre) {
  const enlace = document.createElement('a')
  enlace.href = canvas.toDataURL('image/png')
  enlace.download = nombre
  enlace.click()
}

export async function compartirPergamino(canvas, nombre) {
  if (typeof File !== 'undefined' && navigator.canShare) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (blob) {
      const archivo = new File([blob], nombre, { type: 'image/png' })
      if (navigator.canShare({ files: [archivo] })) {
        try {
          await navigator.share({ files: [archivo], title: 'Vela Rota' })
          return true
        } catch {
          /* el fiel canceló el compartir */
        }
      }
    }
  }
  descargarPergamino(canvas, nombre)
  return false
}
