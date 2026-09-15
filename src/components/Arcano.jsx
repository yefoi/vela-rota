// Emblemas de los 22 Arcanos Mayores, dibujados como SVG de línea.
// Heredan el color con `currentColor` para integrarse en la carta.

const ICONOS = {
  'El Loco': (
    <>
      <path d="M5 25h15" />
      <path d="M20 25v5" />
      <circle cx="14" cy="12" r="2.2" />
      <path d="M14 14.2V20" />
      <path d="M14 16l4-1" />
      <path d="M14 20l-2 5" />
      <path d="M14 20l2 5" />
      <circle cx="26" cy="7" r="2.6" />
    </>
  ),
  'El Mago': (
    <>
      <path d="M16 9c1.8-2.6 4.8-2.6 4.8 0s-3 2.6-4.8 0c-1.8-2.6-4.8-2.6-4.8 0s3 2.6 4.8 0z" />
      <path d="M16 14v12" />
      <path d="M9 26h14" />
    </>
  ),
  'La Sacerdotisa': (
    <>
      <path d="M7 7v20" />
      <path d="M25 7v20" />
      <path d="M18 10a6 6 0 1 0 0 12 7 7 0 1 1 0-12z" />
    </>
  ),
  'La Emperatriz': (
    <>
      <path d="M11 8h10l-1.5 3h-7z" />
      <path d="M16 27V11" />
      <path d="M16 14l-3.5-2.5M16 14l3.5-2.5" />
      <path d="M16 18l-3.5-2.5M16 18l3.5-2.5" />
      <path d="M16 22l-3.5-2.5M16 22l3.5-2.5" />
    </>
  ),
  'El Emperador': (
    <>
      <path d="M11 27V11h10v16" />
      <path d="M11 19h10" />
      <path d="M8 27h16" />
      <path d="M13 11c-2-3-5-2-4 1M19 11c2-3 5-2 4 1" />
    </>
  ),
  'El Sumo Sacerdote': (
    <>
      <path d="M16 5v22" />
      <path d="M10 10h12" />
      <path d="M12 14h8" />
      <path d="M13.5 18h5" />
      <path d="M10 27h12" />
    </>
  ),
  'Los Enamorados': (
    <>
      <circle cx="12" cy="16" r="5.5" />
      <circle cx="20" cy="16" r="5.5" />
    </>
  ),
  'El Carro': (
    <>
      <path d="M8 13a8 8 0 0 1 16 0" />
      <path d="M9.5 13v5M22.5 13v5" />
      <circle cx="16" cy="22" r="4.5" />
      <path d="M16 17.5v9M11.5 22h9" />
    </>
  ),
  'La Fuerza': (
    <>
      <path d="M16 7c1.5-2.2 4-2.2 4 0s-2.5 2.2-4 0c-1.5-2.2-4-2.2-4 0s2.5 2.2 4 0z" />
      <circle cx="16" cy="20" r="5" />
      <path d="M16 15v-3M21 20h3M16 25v3M11 20H8M19.5 16.5l2-2M12.5 16.5l-2-2M19.5 23.5l2 2M12.5 23.5l-2 2" />
    </>
  ),
  'El Ermitaño': (
    <>
      <path d="M13 12a3 3 0 0 1 6 0" />
      <rect x="12" y="12" width="8" height="9" rx="1" />
      <circle cx="16" cy="16.5" r="1.6" />
      <path d="M23 27L11 6" />
    </>
  ),
  'La Rueda de la Fortuna': (
    <>
      <circle cx="16" cy="16" r="9" />
      <circle cx="16" cy="16" r="3" />
      <path d="M16 7v6M16 19v6M7 16h6M19 16h6" />
      <path d="M9.6 9.6l4.2 4.2M18.2 18.2l4.2 4.2M22.4 9.6l-4.2 4.2M13.8 18.2l-4.2 4.2" />
    </>
  ),
  'La Justicia': (
    <>
      <path d="M16 6v20" />
      <path d="M7 11h18" />
      <path d="M12 27h8" />
      <path d="M7 11l-3.5 6h7z" />
      <path d="M25 11l-3.5 6h7z" />
    </>
  ),
  'El Colgado': (
    <>
      <path d="M6 6h20" />
      <path d="M16 6v7" />
      <circle cx="16" cy="15.5" r="2.6" />
      <path d="M16 18.1v4.4" />
      <path d="M16 22.5l-3 3.5M16 22.5l3 3.5" />
    </>
  ),
  'La Muerte': (
    <>
      <circle cx="16" cy="15" r="6.5" />
      <circle cx="13.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <path d="M13.5 19.5h5" />
      <path d="M14.5 19.5v2M16 19.5v2M17.5 19.5v2" />
    </>
  ),
  'La Templanza': (
    <>
      <path d="M5 11h9l-1.5 5h-6z" />
      <path d="M19 22h9l-1.5 5h-6z" />
      <path d="M13 17c1.2 1.4 2.2 3.2 4 4.2 1.4.8 2.6.6 3.6-.2" />
    </>
  ),
  'El Diablo': (
    <>
      <circle cx="16" cy="18" r="6" />
      <path d="M12 13c-1.5-4-5-4-4 0M20 13c1.5-4 5-4 4 0" />
      <circle cx="13.8" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.2" cy="17" r="1" fill="currentColor" stroke="none" />
      <path d="M14 21h4" />
      <circle cx="16" cy="27" r="1.8" />
    </>
  ),
  'La Torre': (
    <>
      <path d="M11 27V13h10v14" />
      <path d="M11 13v-3h2v3h2.5v-3h2v3H20v-3h1v3" />
      <path d="M8 27h16" />
      <path d="M20 4l-6 9h4l-5 9" />
    </>
  ),
  'La Estrella': (
    <>
      <path d="M16 4v14M9 11h14M11.5 6.5l9 9M20.5 6.5l-9 9" />
      <path d="M6 28c1.5-1.6 3-1.6 4.5 0s3-1.6 4.5 0 3-1.6 4.5 0 3-1.6 4.5 0" />
      <circle cx="6" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="26" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  'La Luna': (
    <>
      <path d="M20 9a7 7 0 1 0 0 14 8 8 0 1 1 0-14z" />
      <path d="M7 27v-6l2-2 2 2v6" />
      <path d="M23 27v-6l2-2 2 2v6" />
      <path d="M5 27h22" />
    </>
  ),
  'El Sol': (
    <>
      <circle cx="16" cy="16" r="6" />
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l3 3M21.5 21.5l3 3M24.5 7.5l-3 3M10.5 21.5l-3 3" />
    </>
  ),
  'El Juicio': (
    <>
      <path d="M6 26l12-10" />
      <path d="M18 16l4-5 4 4-5 4z" />
      <path d="M6 26l-2 2" />
    </>
  ),
  'El Mundo': (
    <>
      <ellipse cx="16" cy="16" rx="9.5" ry="11" />
      <path d="M16 10l4 6-4 6-4-6z" />
      <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="27" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="27" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
}

export default function Arcano({ nombre }) {
  const icono = ICONOS[nombre]
  if (!icono) return null
  return (
    <svg
      className="arcano"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icono}
    </svg>
  )
}
