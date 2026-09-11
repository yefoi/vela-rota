const GLIFO_PALO = { Bastos: '🜂', Copas: '🜄', Espadas: '🜁', Oros: '🜃' }

export default function TarotCard({ carta, posicion, active, onClick, compact }) {
  if (!carta) return null
  const invertida = carta.orientacion === 'invertido'
  const tendida = carta.orientacion === 'tendida'
  const glifo = carta.tipo === 'mayor' ? '✦' : GLIFO_PALO[carta.palo] || '✦'
  const encabezado = carta.roman || carta.rango

  return (
    <button
      type="button"
      className={[
        'tarot',
        invertida ? 'esta-invertida' : '',
        tendida ? 'esta-tendida' : '',
        active ? 'esta-activa' : '',
        compact ? 'tarot-compacta' : '',
      ].join(' ')}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="tarot-marco" aria-hidden="true" />
      {posicion ? <span className="tarot-posicion">{posicion}</span> : null}
      <span className="tarot-cuerpo">
        <span className="tarot-encabezado">{encabezado}</span>
        <span className="tarot-glifo" aria-hidden="true">{glifo}</span>
        <span className="tarot-nombre">{carta.nombre}</span>
        <span className="tarot-elemento">{carta.elemento}</span>
      </span>
      <span className="tarot-orientacion">
        {invertida ? 'invertida' : tendida ? 'tendida' : 'derecha'}
      </span>
      <span className="tarot-glitch" aria-hidden="true">{glifo}</span>
    </button>
  )
}
