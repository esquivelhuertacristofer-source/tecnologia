import type { RecursoWeb } from '@/components/simuladores/web';

/**
 * Las dos fotografías de práctica de `n10-publica-tu-sitio`: los dos
 * proyectos que Estudio Lumen enseña en su sitio. Mismo trato que
 * `n6/web/imagenesDePractica.ts`: van dibujadas aquí dentro, no en `/public`,
 * porque la vista previa de Tecnia Web no hace ni una petición de red — pinta
 * lo que la clase le pone en `recursos` (`pagina.ts`, `RecursoWeb`).
 */

function comoImagen(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

const CASA_JACARANDA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <rect width="320" height="200" fill="#f0e6d2"/>
  <rect x="40" y="90" width="160" height="90" fill="#e8dcc0"/>
  <polygon points="40,90 120,50 200,90" fill="#8a5a35"/>
  <rect x="90" y="130" width="34" height="50" fill="#5c4a33"/>
  <rect x="150" y="115" width="30" height="30" fill="#c9d6e8"/>
  <circle cx="250" cy="70" r="34" fill="#9b7cb6"/>
  <circle cx="270" cy="90" r="24" fill="#a98cc2"/>
  <circle cx="230" cy="95" r="20" fill="#b39bce"/>
  <rect x="248" y="90" width="6" height="60" fill="#5c4a33"/>
  <rect x="0" y="180" width="320" height="20" fill="#c8b98f"/>
</svg>`;

const CAFE_ALMENDRO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <rect width="320" height="200" fill="#efe0c8"/>
  <rect x="0" y="150" width="320" height="50" fill="#c9a06a"/>
  <rect x="30" y="60" width="70" height="90" fill="#8a5a35"/>
  <rect x="120" y="40" width="14" height="110" fill="#5c4a33"/>
  <circle cx="200" cy="70" r="26" fill="#e0c9a0"/>
  <rect x="188" y="90" width="24" height="40" fill="#e0c9a0"/>
  <rect x="240" y="50" width="50" height="70" fill="#5c4a33"/>
  <rect x="248" y="60" width="34" height="50" fill="#c9a06a"/>
</svg>`;

export const IMAGENES_ESTUDIO_LUMEN: readonly RecursoWeb[] = [
  { nombre: 'casa-jacaranda.jpg', url: comoImagen(CASA_JACARANDA), descripcion: 'Casa Jacaranda: fachada con techo a dos aguas y una jacaranda al lado' },
  { nombre: 'cafe-almendro.jpg', url: comoImagen(CAFE_ALMENDRO), descripcion: 'Café Almendro: la barra de madera clara con la máquina de café' },
];

export default IMAGENES_ESTUDIO_LUMEN;
