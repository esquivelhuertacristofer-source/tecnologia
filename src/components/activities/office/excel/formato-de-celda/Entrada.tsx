'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabFormatoDeCelda } from './Lab';

/**
 * Entrada de `of-excel-formato-de-celda` (temario §45.2, bloques 6 · 9 · 10).
 *
 * La única clase exclusiva del grado Básico de Tecnia Hojas, y la que cierra el
 * grado: la ruta y la parada salen de `rutaExcel('basico')` y
 * `paradaExcel('basico', ...)`, **derivadas** de `EJERCICIOS_OFFICE` y no
 * escritas a mano, por lo mismo que costó cinco entradas mintiendo en la sala de
 * PowerPoint (§44.6).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-formato-de-celda',
  laboratorio: LabFormatoDeCelda,
  ruta: rutaExcel('basico'),
  parada: paradaExcel('basico', 'of-excel-formato-de-celda'),
  globo: 'Se ve bien y puede estar mal. Hoy aprendes la diferencia.',
  arranqueSub:
    'Es el mismo archivo de siempre, tres semanas después: la hoja de los gastos está bien calculada y se lee fatal, números sueltos sin saber si son pesos, kilos o alumnos. Hoy la dejas lista para entregar sin cambiarle un solo dato. Le pones formato de moneda a los precios y compruebas, con una cuenta al lado, que el número no cambió; y después haces la trampa al revés: tecleas tú mismo un signo de pesos y ves a tres cuentas dejar de contar esa celda, porque un número escrito con el signo deja de ser número. Vistes la tabla con fondo, letra y bordes de los que sí se imprimen, y descubres el precio de combinar celdas antes de que te toque pagarlo en una hoja de verdad.',
  stats: [
    { etiqueta: 'Gastos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Que se vea lo que vale',
  fichas: [
    {
      key: 've-y-vale',
      tag: 'La idea',
      numero: 1,
      titulo: 'El formato cambia lo que ves, no lo que vale',
      detalle:
        '`$5,200.00` en la pantalla y `5200` en la barra de fórmulas son la misma celda. El formato es una instrucción de cómo pintar el número, guardada aparte del número: por eso las sumas siguen saliendo igual de bien después de ponerle Moneda.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'teclear-rompe',
      tag: 'La trampa',
      numero: 2,
      titulo: 'Teclear el signo rompe la celda',
      detalle:
        'Escribir «$2,500» a mano convierte el número en texto: se va a la izquierda y ninguna suma lo cuenta, sin que salga ningún error. El botón de Moneda hace lo mismo que se ve y al revés por dentro: viste el número sin tocarlo.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'porcentaje-disfrazado',
      tag: 'El disfraz',
      numero: 3,
      titulo: 'Un porcentaje es 0 a 1 disfrazado',
      detalle:
        'Escribir 15 y ponerle Porcentaje da 1500%, no 15%. Un porcentaje se guarda como un número entre 0 y 1 y el formato lo multiplica por cien sólo al enseñarlo: 0.15 se ve 15%.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'combinar-tira',
      tag: 'El precio',
      numero: 4,
      titulo: 'Combinar tira lo que tapa',
      detalle:
        'Combinar dos celdas con datos en las dos se queda con una y **tira** la otra de verdad, avisando antes. Separar sólo deshace el dibujo: lo único que devuelve el dato perdido es deshacer, y sólo mientras sigas en la misma sesión.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Deja la hoja lista para entregar',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» con las fórmulas de la clase de fórmulas ya puestas y sin una sola pinta. Trece encargos. Los tipos de número están en Inicio → Número; los colores y bordes, en Inicio → Fuente; ajustar y combinar, en Inicio → Alineación. Los botones que abren una lista se pulsan una vez para abrirla y otra para elegir. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaFormatoDeCelda(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaFormatoDeCelda;

export default EntradaFormatoDeCelda;
