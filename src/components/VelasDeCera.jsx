const VELAS = [
  { h: 120, tilt: -3, viva: true, ancha: 14 },
  { h: 82, tilt: 2, viva: true, ancha: 11 },
  { h: 148, tilt: 5, viva: false, ancha: 16, rota: true },
  { h: 64, tilt: -6, viva: true, ancha: 10 },
  { h: 104, tilt: 1, viva: true, ancha: 13 },
  { h: 132, tilt: -2, viva: false, ancha: 15, rota: true },
]

export default function VelasDeCera() {
  return (
    <div className="cera" aria-hidden="true">
      {VELAS.map((v, i) => (
        <div
          key={i}
          className={`cera-vela ${v.rota ? 'cera-rota' : ''} ${v.viva ? 'cera-viva' : 'cera-muerta'}`}
          style={{
            '--alto': `${v.h}px`,
            '--giro': `${v.tilt}deg`,
            '--ancho': `${v.ancha}px`,
            '--retardo': `${i * 0.4}s`,
          }}
        >
          {v.viva ? <span className="cera-llama" /> : <span className="cera-humo" />}
          <span className="cera-cuerpo" />
          <span className="cera-goteo" />
        </div>
      ))}
    </div>
  )
}
