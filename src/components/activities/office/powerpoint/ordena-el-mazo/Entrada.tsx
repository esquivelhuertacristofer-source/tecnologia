'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabOrdenaElMazo } from './Lab';

/**
 * Entrada de `of-ppt-ordena-el-mazo` (doc §44.1).
 *
 * La ficha 2 es la que carga la clase: **ocultar no es borrar** es de las pocas
 * cosas de PowerPoint que un alumno usa el mismo día que la aprende, porque la
 * diapositiva que hoy no toca la tiene todo el mundo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-ordena-el-mazo',
  laboratorio: LabOrdenaElMazo,
  ruta: rutaPPT('basico'),
  parada: paradaPPT('basico', 'of-ppt-ordena-el-mazo'),
  globo: 'Dieciocho diapositivas y ni una en su sitio.',
  arranqueSub:
    'La presentación del viaje de fin de curso la fueron llenando cinco personas y se nota: la portada quedó en tercer lugar, lo del museo está repartido por todas partes y hay una diapositiva de precios que era para la junta de padres. Desde la tira de la izquierda no se arregla, porque de dieciocho no ves ni la mitad. Hoy vas a aprender a mirarla desde arriba, a esconder sin borrar y a partirla en tramos con nombre.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '18', acento: '#22d3ee' },
    { etiqueta: 'Vistas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cuando se hace larga',
  fichas: [
    {
      key: 'tres-maneras-de-mirar',
      tag: 'Las vistas',
      numero: 1,
      titulo: 'Tres maneras de mirar lo mismo',
      detalle:
        'Normal para trabajar, Clasificador para verlas todas y ordenarlas, Lectura para pasarla dentro de la ventana. No son tres archivos ni tres presentaciones: es la misma, mirada de tres maneras.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'ocultar-no-es-borrar',
      tag: 'La que hoy no toca',
      numero: 2,
      titulo: 'Ocultar no es borrar',
      detalle:
        'Se queda dentro del archivo, con su número tachado, y no sale al presentar. Es para lo que preparaste por si acaso y para lo que hoy no viene a cuento. La semana que viene vuelve con el mismo botón.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'partirla-en-tramos',
      tag: 'Las secciones',
      numero: 3,
      titulo: 'Partirla en tramos con nombre',
      detalle:
        '«El viaje», «El museo», «El cierre». Una sección empieza donde tú digas y llega hasta la siguiente, y se puede plegar: dieciocho diapositivas caben en tres renglones y por fin se abarcan.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'viaja-contigo',
      tag: 'Lo que hay que saber',
      numero: 4,
      titulo: 'La escondida viaja igual',
      detalle:
        'Esconder una diapositiva es para ti, no es un candado: si mandas el archivo, va dentro. Sirve para no enseñarla, no para que nadie la vea nunca.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Ponla en orden',
  ctaDetalle:
    'Se abre «Viaje de fin de curso.pptx» con sus dieciocho diapositivas tal y como quedaron. Las tres vistas están abajo a la derecha, en la barra gris del final de la ventana. Sección está en Inicio, junto a Nueva diapositiva; y Ocultar, en Presentación → Configurar, que es donde está en PowerPoint de verdad.',
};

export function EntradaOrdenaElMazo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaOrdenaElMazo;

export default EntradaOrdenaElMazo;
