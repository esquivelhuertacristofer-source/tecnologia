'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabDatosLimpios } from './Lab';

/**
 * Entrada de `of-excel-datos-limpios` (bloques 44 · 45 · 46).
 *
 * La primera clase exclusiva del grado Avanzado de Tecnia Hojas: la ruta y la
 * parada salen de `rutaExcel('avanzado')` y `paradaExcel('avanzado', ...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano, por la misma
 * razón que ya dejaron escrita `of-excel-buscarx` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-datos-limpios',
  laboratorio: LabDatosLimpios,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-datos-limpios'),
  globo: 'Media hoja mal hecha no son fórmulas malas: son datos sucios.',
  arranqueSub:
    'La inscripción a la feria de ciencias se tomó en tres mesas distintas durante el receso, y alguien la pasó a una sola hoja sin revisar. Hay un alumno anotado dos veces, letra por letra igual; hay una alumna capturada de tres maneras que a la hoja le parecen tres personas distintas; y hay un nombre al que sólo le agarraron media palabra. Hoy vas a dejar esa lista lista para usarse: vas a quitar lo que de verdad se repite, a descubrir lo que no se repitió solo, a limpiar una columna con Relleno rápido viendo dónde se equivoca en silencio, a vestir un saldo con un formato que tú mismo escribes, y a pintar la fila entera del que debe dinero con una fórmula.',
  stats: [
    { etiqueta: 'Inscripciones', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '10', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El duplicado que se ve no es el peligroso',
  fichas: [
    {
      key: 'letra-por-letra',
      tag: 'Quitar duplicados',
      numero: 1,
      titulo: 'Compara letra por letra, no persona por persona',
      detalle:
        '«ANA», «Ana » y «ana» son tres textos distintos para la hoja, así que Quitar duplicados no los junta. El duplicado que se ve —copiado y pegado igual— es el fácil; el que hace daño es el que no se ve.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'texto-no-regla',
      tag: 'Relleno rápido',
      numero: 2,
      titulo: 'Escribe texto, no una regla',
      detalle:
        'Si cambia el dato original, lo que Relleno rápido ya escribió se queda viejo — al revés que una fórmula. Y si el patrón no está claro, prefiere dejar una celda vacía en silencio antes que adivinar mal a mitad de la columna.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'negativos-en-rojo',
      tag: 'Formato personalizado',
      numero: 3,
      titulo: 'Tres partes separadas por punto y coma',
      detalle:
        'Un patrón como #,##0;[Rojo](#,##0) dice cómo se ve un número positivo y cómo uno negativo, sin cambiar el dato: los negativos salen en rojo y entre paréntesis, como en un estado de cuenta.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'la-fila-entera',
      tag: 'Regla con fórmula',
      numero: 4,
      titulo: 'El $ fija la columna, no la fila',
      detalle:
        'Una regla como =$C4>1000 pinta la fila entera del que cumple, no sólo su celda. Sin el $, la fórmula se desliza también de columna en columna y pinta en diagonal — el error clásico.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Deja la lista lista para usarse',
  ctaDetalle:
    'Se abre «Inscripciones a la feria de ciencias.xlsx» con diez inscripciones tal y como llegaron, defectos incluidos. Diez encargos. Quitar duplicados y Relleno rápido están en Datos → Herramientas de datos; el formato personalizado, en Inicio → Número; la regla con fórmula, en Inicio → Estilos. Los tres últimos abren un cuadro de texto: se escribe y se pulsa Aplicar. Si te equivocas, deshacer está arriba a la izquierda — salvo en Quitar duplicados, que borra de verdad.',
};

export function EntradaDatosLimpios(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaDatosLimpios;

export default EntradaDatosLimpios;
