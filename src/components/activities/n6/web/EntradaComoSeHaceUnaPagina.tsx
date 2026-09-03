'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N6_WEB } from './rutaWeb';
import { LabComoSeHaceUnaPagina } from './LabComoSeHaceUnaPagina';

/**
 * Entrada de `n6-como-se-hace-una-pagina` — N6·«Mi primera página web»,
 * parada 1 (documento §51.1).
 *
 * Monta la plantilla de oro (`EntradaN4Base`, que pese al nombre es de todo el
 * sitio y toma la ruta por parámetro). **Cada cadena de aquí está escrita para
 * esta clase**: título, globo, datos, las cuatro fichas, el CTA y la ruta. Un
 * port que sólo cambia el import deja las entradas mintiendo, y en esta
 * plataforma ya pasó.
 *
 * Edad de referencia del tono: **11–12 años** (N6, 6.º de Primaria), leída en
 * `curriculo.ts` + `niveles.ts`, no en el encargo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-como-se-hace-una-pagina',
  laboratorio: LabComoSeHaceUnaPagina,
  ruta: RUTA_N6_WEB,
  parada: 1,
  globo:
    'Todas las páginas que abres al día están hechas de texto, y ese texto se puede leer. Hoy abrimos por dentro la del club de robótica de tu escuela, le cambias lo que quieras, y ves cómo cambia al momento.',
  arranqueSub:
    'Vas a abrir una página web por dentro: **el texto a la izquierda, la página a la derecha**. Cambias una línea y la ves cambiar mientras escribes. También la vas a romper a propósito, para aprender a leer lo que avisa el programa.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Archivos', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que hay detrás de una página',
  fichas: [
    {
      key: 'es-texto',
      tag: 'Lo primero que hay que saber',
      numero: 1,
      titulo: 'Una página web es un archivo de texto',
      detalle:
        'No es un dibujo ni un video: es **texto escrito** que el navegador lee de arriba abajo y dibuja. Por eso se puede abrir y cambiar.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'etiquetas',
      tag: 'Cómo está escrito',
      numero: 2,
      titulo: 'Las etiquetas son instrucciones',
      detalle:
        'La etiqueta «h1» no se ve en la página: le dice al navegador **«esto es el título grande»**. Cada etiqueta abre y cierra, como un paréntesis.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'al-momento',
      tag: 'Lo que más gusta',
      numero: 3,
      titulo: 'Se ve al momento, sin guardar',
      detalle: 'Escribes una letra y la página de al lado ya cambió. **No hay botón de comprobar**: hay una página que te obedece.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-error-avisa',
      tag: 'Y cuando algo sale mal',
      numero: 4,
      titulo: 'El programa te dice dónde',
      detalle:
        'Si olvidas cerrar una etiqueta, la página **no se queda en blanco**: se ve rara y abajo aparece qué falta y en qué línea. Leer eso es la mitad del oficio.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Cambia el nombre del club, ponle nombre a la pestaña, **rompe la página a propósito** para ver qué avisa el programa, arréglala leyendo el aviso y escribe tú una línea nueva. Siete encargos, y la página cambia mientras escribes.',
  assetsPendientes: false,
};

export function EntradaComoSeHaceUnaPagina(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaComoSeHaceUnaPagina;
