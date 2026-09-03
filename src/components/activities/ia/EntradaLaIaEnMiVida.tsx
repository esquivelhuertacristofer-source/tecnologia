'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N5_IA_A_MI_ALCANCE } from './rutasIA';
import { LabLaIaEnMiVida } from './LabLaIaEnMiVida';

/**
 * Entrada de `n5-la-ia-en-mi-vida` — N5 · «IA a mi alcance», **parada 1 de 3**.
 * 5.º de primaria, 10–11 años (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, y **con cada cadena escrita para esta clase**:
 * el globo, el arranque, los tres datos, el letrero, las cuatro fichas y el
 * CTA hablan del día del alumno, de la alarma que obedece y del teclado que
 * aprendió. Comparte la base y la ruta con las paradas 2 y 3, y nada más: *un
 * port que sólo cambia el import deja las entradas mintiendo.*
 *
 * El orden de las fichas es el de la clase, y es una trampa a propósito: se
 * abre con lo que la IA no es (un robot con cara), siguen las dos sorpresas
 * cruzadas —lo que parece listo no lo es, lo que parece tonto sí— y se cierra
 * con la herramienta, que es lo único que el alumno se lleva puesto.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-la-ia-en-mi-vida',
  laboratorio: LabLaIaEnMiVida,
  ruta: RUTA_N5_IA_A_MI_ALCANCE,
  parada: 1,
  globo:
    'Crees que la inteligencia artificial es un robot del futuro con cara. Hoy vas a descubrir que la usaste seis veces antes del recreo.',
  arranqueSub:
    'Vas a revisar **tu propio día**, aparato por aparato: la alarma, el teclado, la calculadora, el filtro de la cámara. Primero apuestas **sin saber nada**, por corazonada. Después cada aparato te cuenta cómo llegó a hacer lo que hace… y dos de ellos te van a sorprender. Al final buscarás **la pregunta que los separa**, probando cuatro contra tu propia pizarra. Sólo una sirve, y te la llevas puesta.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Aparatos', valor: '8', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Ya la usas, y no lo sabías',
  fichas: [
    {
      key: 'sin-cara',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'No tiene cara, y ya está aquí',
      detalle:
        'La inteligencia artificial de tu vida **no es un robot**. Es el teclado que adivina tu palabra, el filtro que encuentra tu cara y la lista de videos que sale sola. Ninguno tiene cara, y ninguno es del futuro.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'listo-no-es',
      tag: 'La trampa',
      numero: 2,
      titulo: 'Listo no quiere decir IA',
      detalle:
        'Una calculadora resuelve 348 × 27 antes de que sueltes el botón, y **no aprendió nada**: alguien le escribió los pasos de la multiplicación, uno por uno. Te dará lo mismo hoy y dentro de cien años.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tonto-si-es',
      tag: 'La otra trampa',
      numero: 3,
      titulo: 'Y tonto no quiere decir que no lo sea',
      detalle:
        'El teclado que te ofrece «escuela» parece una tontería, pero **nadie escribió qué palabra va después de cada palabra**: son demasiadas. Aprendió leyendo millones de mensajes. Y por eso a veces se equivoca.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'la-pregunta',
      tag: 'La herramienta',
      numero: 4,
      titulo: 'Una sola pregunta te sirve para todo',
      detalle:
        'Ni la pantalla, ni la voz, ni que haga algo difícil. Lo único que separa de verdad: **¿aprendió mirando montones de ejemplos, o alguien le escribió los pasos?** No te la vamos a dar: la vas a encontrar tú.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60, decisión de Cristofer) y
  // las láminas de las fichas todavía no existen: la entrada lo dice en
  // pantalla en vez de cargar un reproductor roto, igual que sus dos hermanas.
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n5-la-ia-en-mi-vida/video-explicativo.mp4`. Con la bandera en
   * `false` el `<video>` se pintaba igualmente y pedía un archivo que no
   * existe: el alumno veía un reproductor muerto y un 404 en la red, en vez
   * del aviso honesto de que el video todavía se está grabando. Cuando el
   * video exista, esto vuelve a `false` en el mismo commit que lo publica.
   */
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Asistente',
  ctaDetalle:
    'Vas a apostar por cuatro aparatos de tu mañana, oír de dónde les vino lo que saben, encontrar la pregunta que los separa y estrenarla con cuatro aparatos más de tu tarde.',
};

export function EntradaLaIaEnMiVida(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaLaIaEnMiVida;
