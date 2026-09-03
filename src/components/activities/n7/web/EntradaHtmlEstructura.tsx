'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N7_WEB } from './rutaWebN7';
import { LabHtmlEstructura } from './LabHtmlEstructura';

/**
 * Entrada de `n7-html-estructura` — N7·«Desarrollo web I», parada 1.
 * Tono de **12–13 años** (N7, 1.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-html-estructura',
  laboratorio: LabHtmlEstructura,
  ruta: RUTA_N7_WEB,
  parada: 1,
  globo:
    'En secundaria construimos sitios web estructurados. Hoy aprenderás las etiquetas semánticas de HTML5 que usan los profesionales para dar orden, accesibilidad y significado a una página.',
  arranqueSub:
    'Tu proyecto llega con la plantilla base y vas a añadir paso a paso la estructura: cabecera (<header>), menú (<nav>), contenido principal (<main>), secciones (<section>), artículos (<article>) y pie de página (<footer>).',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#38bdf8' },
    { etiqueta: 'Etiquetas', valor: '6', acento: '#818cf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La arquitectura semántica de HTML5',
  fichas: [
    {
      key: 'header-nav',
      tag: 'La cabecera',
      numero: 1,
      titulo: '<header> y <nav>',
      detalle:
        'El <header> contiene el título principal y la marca del sitio, mientras que <nav> delimita las opciones de navegación.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'main-section',
      tag: 'El contenido',
      numero: 2,
      titulo: '<main> y <section>',
      detalle:
        '<main> aísla el contenido central del documento y <section> organiza los temas en bloques con sentido propio.',
      acento: { c: '#818cf8', deep: '#4f46e5' },
    },
    {
      key: 'article-footer',
      tag: 'Cierre y artículos',
      numero: 3,
      titulo: '<article> y <footer>',
      detalle:
        '<article> encapsula noticias o publicaciones autónomas y <footer> cierra la página con derechos y contacto.',
      acento: { c: '#34d399', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Iniciar el proyecto de maquetación',
  ctaDetalle:
    'Construirás el portal de ciencias desde el editor de código con previsualización en tiempo real e inspector de nodos.',
  // El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes`
  // ya es `false` de verdad: la entrada enseña el cubrepantalla primero y el
  // reproductor después. OJO si escribes pruebas: con el video puesto, el
  // primer `<button>` del documento ya no es el CTA sino el de la portada, así
  // que no lo busques por posición — búscalo por su texto.
  assetsPendientes: false,
};

export function EntradaHtmlEstructura(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaHtmlEstructura;
