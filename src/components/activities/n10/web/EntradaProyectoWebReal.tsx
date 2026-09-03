'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_WEB } from './rutaWebN10';
import { LabProyectoWebReal } from './LabProyectoWebReal';

/**
 * Entrada de `n10-proyecto-web-real` — N10·«Desarrollo web integral», parada 1.
 * Tono de **15–18 años** (N10, Bachillerato).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-proyecto-web-real',
  laboratorio: LabProyectoWebReal,
  ruta: RUTA_N10_WEB,
  parada: 1,
  globo:
    'Un panel de control de verdad junta las tres cosas que ya sabes: la estructura en HTML, los estilos en CSS y el comportamiento en JavaScript. Hoy las juntas en una sola pantalla que se usa de verdad.',
  arranqueSub:
    'Vas a maquetar las tarjetas con CSS Grid, a sacar los colores a variables para poder cambiarlos en un solo sitio, y a escribir el filtro que va recortando la lista mientras alguien escribe.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#38bdf8' },
    { etiqueta: 'Nivel', valor: 'Bachillerato', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#10b981' },
  ],
  letrero: 'Proyecto Web Real: Nexus Analytics Dashboard',
  fichas: [
    {
      key: 'kpi-grid',
      tag: 'La maqueta',
      numero: 1,
      titulo: 'Rejilla y tarjetas',
      detalle:
        'Las tarjetas de un panel se colocan con una rejilla de CSS, no una a una a mano. Así la pantalla se recoloca sola cuando cambia el tamaño.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'css-vars',
      tag: 'Los colores',
      numero: 2,
      titulo: 'Variables de CSS',
      detalle:
        'Una variable guarda un color una sola vez, y lo usan todos los sitios que lo necesitan. Cambias el de arriba y cambia el panel entero de golpe.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'realtime-js',
      tag: 'El filtro',
      numero: 3,
      titulo: 'Filtrar mientras se escribe',
      detalle:
        'Escuchas lo que la persona teclea y vuelves a pintar la lista sólo con lo que encaja. Sin recargar la página y sin pedirle nada a ningún servidor.',
      acento: { c: '#10b981', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Nexus Studio',
  ctaDetalle:
    'Cinco encargos con los tres archivos abiertos: maquetas las tarjetas, sacas los colores a variables, escribes el filtro que responde al teclado y compruebas cada paso en la vista previa de al lado.',
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n10-proyecto-web-real/video-explicativo.mp4`. Con la bandera en
   * `false` el `<video>` se pintaba igualmente y pedía un archivo que no
   * existe: el alumno veía un reproductor muerto y un 404 en la red, en vez
   * del aviso honesto de que el video todavía se está grabando. Cuando el
   * video exista, esto vuelve a `false` en el mismo commit que lo publica.
   */
  assetsPendientes: false,
};

export function EntradaProyectoWebReal(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProyectoWebReal;
