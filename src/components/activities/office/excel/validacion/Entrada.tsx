'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabValidacion } from './Lab';

/**
 * Entrada de `of-excel-validacion` (bloques 32 · 39).
 *
 * La última clase exclusiva del grado Intermedio de Tecnia Hojas: la ruta y
 * la parada salen de `rutaExcel('intermedio')` y
 * `paradaExcel('intermedio', ...)`, **derivadas** de `EJERCICIOS_OFFICE` y no
 * escritas a mano, por la misma razón que ya dejaron escrita
 * `of-excel-buscarx` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-validacion',
  laboratorio: LabValidacion,
  ruta: rutaExcel('intermedio'),
  parada: paradaExcel('intermedio', 'of-excel-validacion'),
  globo: 'Una lista desplegable no es comodidad: es lo que hace posible todo lo demás.',
  arranqueSub:
    'El comité de la kermés reparte una hoja para que otras diez familias anoten qué van a traer, a mano y sin que nadie las vigile. Hoy vas a sufrir primero lo que pasa cuando esa columna se captura libre —una cuenta que debería dar cuatro y da dos—, y después vas a diseñar la hoja para que eso no pueda volver a pasar: una lista que Detiene cualquier categoría que no exista, y un rango de piezas que sólo Advierte y deja pasar si insistes. Vas a descubrir que una regla puesta hoy no revisa lo que ya estaba escrito ayer, vas a reemplazar un texto leyendo el aviso antes de confirmar para no romper una fórmula sin querer, y vas a buscar mirando el valor y la fórmula —no es lo mismo— e ir directo a un rango por su nombre.',
  stats: [
    { etiqueta: 'Familias', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'No lo pidas por favor: no dejes escribir otra cosa.',
  fichas: [
    {
      key: 'sufre-primero',
      tag: 'El problema',
      numero: 1,
      titulo: 'Una columna libre no se puede resumir',
      detalle:
        'Cuatro familias dijeron «Bebidas» y CONTAR.SI sólo encuentra dos: un espacio de más y una palabra a medias bastan para que la hoja entienda tres cosas distintas. No es un problema de mayúsculas —ése ya lo viste—: es que nadie impidió escribir cualquier cosa.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'no-revisa-lo-viejo',
      tag: 'Validación',
      numero: 2,
      titulo: 'La regla no mira para atrás',
      detalle:
        'Poner una validación HOY no revisa ni corrige lo que ya estaba escrito AYER. Sólo vigila lo nuevo, y esa sorpresa hay que verla con los propios ojos: lo viejo se queda tal cual, sin marca ni aviso.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'dos-formas-de-bloquear',
      tag: 'Detener o Advertir',
      numero: 3,
      titulo: 'No dejar, o avisar y dejar',
      detalle:
        'Detener es para lo que de verdad no puede pasar: una categoría que no existe. Advertencia es para lo que casi siempre está mal pero a veces es real: un número fuera de lo normal. Elegir cuál usar es diseñar para el que va a llenar la hoja.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'buscar-no-es-uno-solo',
      tag: 'Buscar, reemplazar, ir a',
      numero: 4,
      titulo: 'El valor y la fórmula no son lo mismo',
      detalle:
        'Buscar «100» mirando el valor encuentra una fórmula que también da 100; mirando la fórmula, no, porque «100» no está escrito en su texto. Y reemplazar sin leer el aviso puede partir, sin querer, una fórmula que usaba esa misma palabra.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Diseña la hoja para el que la va a llenar, no para ti',
  ctaDetalle:
    'Se abre «Lo que trae cada familia · kermés de fin de cursos.xlsx» con diez familias ya anotadas, la columna de categoría sucia a propósito. Trece encargos. Los cinco controles de hoy están en el panel «Validación», a la derecha, y actúan sobre lo que tengas marcado en la hoja. Si te equivocas, deshacer está arriba a la izquierda — salvo lo que Detener nunca dejó pasar, que no llega a tocar el libro.',
};

export function EntradaValidacion(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaValidacion;

export default EntradaValidacion;
