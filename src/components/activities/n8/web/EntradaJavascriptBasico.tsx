'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N8_WEB } from './rutaWebN8';
import { LabJavascriptBasico } from './LabJavascriptBasico';

/**
 * Entrada de `n8-javascript-basico` — N8·«Desarrollo web II», parada 2.
 * Tono de **13–14 años** (N8, 2.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-javascript-basico',
  laboratorio: LabJavascriptBasico,
  ruta: RUTA_N8_WEB,
  parada: 2,
  globo:
    'El HTML pone lo que hay en la página y el CSS pone cómo se ve. Lo que hace que ocurra algo cuando alguien toca un botón es JavaScript, y eso es lo de hoy.',
  arranqueSub:
    'Tu proyecto tiene tres archivos —index.html, estilo.css y script.js— y hoy escribes el tercero: buscas un elemento de la página, te quedas a la escucha de lo que hace quien la usa, y cambias el texto y los estilos sin recargar nada.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#a855f7' },
    { etiqueta: 'Lenguajes', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'La Web Interactiva: HTML + CSS + JavaScript',
  fichas: [
    {
      key: 'dom-select',
      tag: 'El DOM',
      numero: 1,
      titulo: 'querySelector()',
      detalle:
        'Busca en la página el elemento con el que quieres trabajar, por su id (#id) o por su clase (.clase). Si no lo encuentras primero, lo demás no sirve de nada.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'events',
      tag: 'Eventos',
      numero: 2,
      titulo: 'addEventListener()',
      detalle:
        'Te quedas a la escucha de algo que hace la persona —un clic, una tecla, el ratón encima— para que tu función se ejecute justo en ese momento.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'dom-change',
      tag: 'Interactividad',
      numero: 3,
      titulo: 'textContent & classList',
      detalle:
        'Cambia el texto que se lee y enciende o apaga una clase de CSS. Con esas dos cosas sola ya se mueve media página.',
      acento: { c: '#facc15', deep: '#ca8a04' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre CyberStudio y empieza',
  ctaDetalle:
    'Cinco encargos en tu editor de tres archivos: seleccionas un elemento, escuchas un clic, cambias el texto que se ve y enciendes una clase — y la vista previa de al lado te lo enseña al momento.',
  /*
   * El video se grabó y se publicó el 2-sep-2026:
   * `public/assets/actividades/n8-javascript-basico/video-explicativo.mp4` ya
   * existe, así que la bandera bajó a `false` y `EntradaN4Base` monta el
   * `<video>` de verdad. OJO si escribes pruebas: con el video puesto, el
   * primer `<button>` del documento ya no es el CTA sino el de la portada.
   */
  assetsPendientes: false,
};

export function EntradaJavascriptBasico(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaJavascriptBasico;
