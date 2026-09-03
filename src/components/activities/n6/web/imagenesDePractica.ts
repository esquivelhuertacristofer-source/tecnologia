import type { RecursoWeb } from '@/components/simuladores/web';

/**
 * Las dos imágenes de la práctica de `n6-html-basico` (documento §51.2).
 *
 * **Van dibujadas aquí dentro, no en `/public`, y es a propósito.** La vista
 * previa de `Tecnia Web` no hace ni una petición de red: pinta lo que la clase
 * le pone en `recursos` (`pagina.ts`, `RecursoWeb`). Un `<img>` que apuntara a
 * un archivo del servidor sería la única petición de toda la actividad y el
 * único sitio donde un 404 dejaría la clase a medias.
 *
 * Se llaman «.png» porque es lo que un alumno de 11 años va a escribir el resto
 * de su vida cuando ponga una foto, y el nombre es lo único que él ve y teclea:
 * en esta práctica no hay disco, así que el nombre es la etiqueta que le pone
 * la clase al dibujo. Lo que hay detrás es un SVG en línea.
 */

function comoImagen(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

const ROBOT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <rect width="320" height="200" rx="14" fill="#e8f1ff"/>
  <rect x="24" y="150" width="272" height="18" rx="9" fill="#1f2937"/>
  <rect x="104" y="62" width="112" height="76" rx="16" fill="#2563eb"/>
  <rect x="120" y="80" width="80" height="34" rx="10" fill="#0f172a"/>
  <circle cx="142" cy="97" r="9" fill="#22d3ee"/>
  <circle cx="178" cy="97" r="9" fill="#22d3ee"/>
  <rect x="150" y="42" width="20" height="22" rx="6" fill="#64748b"/>
  <circle cx="160" cy="38" r="10" fill="#f59e0b"/>
  <rect x="80" y="86" width="24" height="14" rx="7" fill="#64748b"/>
  <rect x="216" y="86" width="24" height="14" rx="7" fill="#64748b"/>
  <circle cx="126" cy="146" r="18" fill="#0f172a"/>
  <circle cx="126" cy="146" r="7" fill="#94a3b8"/>
  <circle cx="194" cy="146" r="18" fill="#0f172a"/>
  <circle cx="194" cy="146" r="7" fill="#94a3b8"/>
  <rect x="140" y="124" width="40" height="8" rx="4" fill="#22c55e"/>
</svg>`;

const TALLER = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <rect width="320" height="200" rx="14" fill="#fff4e6"/>
  <rect x="20" y="126" width="280" height="16" rx="6" fill="#a16207"/>
  <rect x="40" y="142" width="14" height="42" fill="#78350f"/>
  <rect x="266" y="142" width="14" height="42" fill="#78350f"/>
  <rect x="54" y="74" width="86" height="52" rx="8" fill="#1e293b"/>
  <rect x="62" y="82" width="70" height="36" rx="4" fill="#38bdf8"/>
  <circle cx="196" cy="98" r="26" fill="none" stroke="#ef4444" stroke-width="12"/>
  <circle cx="196" cy="98" r="7" fill="#ef4444"/>
  <rect x="236" y="88" width="52" height="12" rx="6" fill="#0ea5e9"/>
  <rect x="236" y="106" width="34" height="12" rx="6" fill="#22c55e"/>
  <rect x="150" y="140" width="60" height="10" rx="5" fill="#f59e0b"/>
</svg>`;

export const IMAGENES_DE_PRACTICA: readonly RecursoWeb[] = [
  { nombre: 'robot.png', url: comoImagen(ROBOT), descripcion: 'El robot que sigue la línea negra' },
  { nombre: 'taller.png', url: comoImagen(TALLER), descripcion: 'La mesa del taller, con las herramientas' },
];
