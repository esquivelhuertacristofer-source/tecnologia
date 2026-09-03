'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabTraelaHecha } from './Lab';

/**
 * Entrada de `of-ppt-traela-hecha` (doc §44.5).
 *
 * La ficha 3 es la que hace que esta clase valga el doble: **el informe de Word
 * ya son diapositivas**. Es la primera vez que los dos programas del Edificio de
 * Oficinas se tocan, y es también la factura de una promesa que Word dejó
 * pendiente — allí se dijo que los estilos de título son etiquetas y no negrita
 * grande, y aquí es donde eso sirve para algo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-traela-hecha',
  laboratorio: LabTraelaHecha,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-traela-hecha'),
  globo: 'La mitad de esta presentación ya está hecha. En otro archivo, y en Word.',
  arranqueSub:
    'Tienes que presentar el proyecto del huerto y te faltan la portada de la escuela y la del equipo. Las dos existen: las hiciste el trimestre pasado y están en otro archivo. Y el informe entero está escrito en Word, con sus títulos puestos. Hoy aprendes que **la diapositiva que mejor sale es la que no hiciste**: traer las de otro archivo sin abrirlo, decidir con qué cara entran, convertir un documento de Word en diapositivas y dejar que el índice se haga solo.',
  stats: [
    { etiqueta: 'Fuentes', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Diapositivas', valor: '6', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'No la hagas dos veces',
  fichas: [
    {
      key: 'la-que-ya-estaba-hecha',
      tag: 'El atajo',
      numero: 1,
      titulo: 'La que ya estaba hecha',
      detalle:
        '**Reutilizar diapositivas** abre otro archivo sin abrirlo: te enseña sus diapositivas en miniatura y te llevas las que quieras. La portada de la escuela, la del equipo, la del método que ya explicaste — todo eso se hace una vez en la vida.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'con-que-cara-viene',
      tag: 'La casilla',
      numero: 2,
      titulo: '¿Con su cara o con la tuya?',
      detalle:
        'Arriba del panel hay una casilla —**Conservar el formato de origen**— que casi nadie mira, y decide si lo que traes se queda con los colores de su archivo o toma los del tuyo. Es la razón de que los trabajos en equipo salgan con tres caras distintas.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'de-word-a-diapositivas',
      tag: 'Los dos programas',
      numero: 3,
      titulo: 'Tu informe ya son diapositivas',
      detalle:
        'Un documento de Word escrito con estilos se convierte solo: cada **Título 1** es una diapositiva y cada **Título 2**, una de sus viñetas. Y aquí se ve para qué servían los estilos: no eran negrita grande, eran **etiquetas** — un documento hecho a mano no se convierte en nada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-indice-se-hace-solo',
      tag: 'Un clic',
      numero: 4,
      titulo: 'El índice se hace solo',
      detalle:
        'El **Zoom de resumen** mira tus secciones, coge la primera de cada una y arma la diapositiva-índice con miniaturas que saltan. Es el mismo menú que en otra clase armaste a mano: a mano se controla todo y se tarda; así es un clic y depende de que las secciones estén bien puestas.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Trae lo que ya existe',
  ctaDetalle:
    'Se abre «El huerto de la escuela.pptx», con cinco diapositivas y tres secciones ya puestas. Lo de traer está en **Inicio → Diapositivas**: «Reutilizar» y «Del esquema», los dos al lado de «Nueva diapositiva». El índice automático, en **Insertar → Vínculos → Zoom de resumen**.',
};

export function EntradaTraelaHecha(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaTraelaHecha;

export default EntradaTraelaHecha;
