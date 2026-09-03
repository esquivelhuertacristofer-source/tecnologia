'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabCeldasFilasColumnas } from './Lab';

/**
 * Entrada de `n5-celdas-filas-columnas` — la primera parada de N5 · U2 «Hoja de
 * cálculo I», y la primera clase de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA ───────────────────────────────────────────────────────
 *
 * `RUTA_N4U1..U4` están escritas a mano en `EntradaN4Base`, y en la sala de
 * PowerPoint eso ya costó cinco entradas mintiendo («parada 5 de 5» un día
 * después de que hubiera seis, §44.6). Aquí la ruta sale de la unidad del
 * currículo, que es donde una clase se da de alta: cuando se construya
 * `n5-captura-y-ordena`, aparece en la tira de ésta sin tocar este archivo.
 *
 * Se listan **las cuatro paradas de la unidad, no sólo las construidas**, al
 * revés que en la sala de PowerPoint. Es a propósito y es la diferencia entre
 * una ruta de sala y una ruta de unidad: la sala es un catálogo de lo que hay,
 * y una unidad de un nivel es un plan de trabajo — el alumno tiene que ver que
 * después de ésta vienen tres más, aunque hoy no pueda entrar.
 */

const RUTA_N5U2: PasoRuta[] = (getUnidad('n5-hoja-de-calculo-1')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-celdas-filas-columnas',
  laboratorio: LabCeldasFilasColumnas,
  ruta: RUTA_N5U2,
  parada: 1,
  globo: 'Aquí cada casilla tiene nombre y apellido. Te enseño a leerlos.',
  arranqueSub:
    'La tesorera de tu salón apuntó en una hoja de cálculo lo que costó la salida a Teotihuacán: seis gastos, lo que se pagó por cada uno y cuántos van. Está todo capturado y no hay ni una fórmula todavía, porque hoy no toca calcular: hoy toca saber DÓNDE está cada cosa. En una hoja de cálculo eso no es un detalle — es lo primero, porque todo lo que viene después —sumar, ordenar, hacer una gráfica— se le dice al programa nombrando celdas. Vas a aprender a leer el domicilio de un dato, a marcar un rectángulo entero de ellos, y a meter y quitar filas y columnas sin que la hoja se descuadre.',
  stats: [
    { etiqueta: 'Gastos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '11', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cada casilla tiene nombre',
  fichas: [
    {
      key: 'columna-mas-fila',
      tag: 'La dirección',
      numero: 1,
      titulo: 'Columna más fila, y ya está',
      detalle:
        'Las letras de arriba son las columnas y los números de la izquierda son las filas. Cruza una con otra y tienes el nombre de la casilla: D5. Con eso se acabó el «la de más abajo, no, la otra»: cada dato de la hoja tiene una dirección y sólo una.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'dos-preguntas',
      tag: 'Arriba',
      numero: 2,
      titulo: 'Dónde estás y qué hay ahí',
      detalle:
        'Arriba, encima de las letras, hay dos casillas que casi nadie mira y que contestan dos preguntas distintas. El cuadro de nombres dice DÓNDE estás. La barra de fórmulas dice QUÉ hay ahí de verdad — y por eso un texto que en la celda se ve cortado ahí arriba se lee entero.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-rectangulo',
      tag: 'El rango',
      numero: 3,
      titulo: 'A1:B5 no son dos celdas',
      detalle:
        'Los dos puntos se leen «hasta»: A1:B5 son todas las que caben en ese rectángulo, diez en total. Es la manera de hablarle al programa de un montón de datos de golpe, y es lo que vas a escribir dentro de cada fórmula que hagas de aquí en adelante.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'empuja',
      tag: 'Insertar',
      numero: 4,
      titulo: 'No hace hueco: empuja',
      detalle:
        'Meter una fila no abre un espacio en blanco y ya: baja un renglón todo lo que había debajo, y con ello cambia de dirección. Con las columnas pasa igual pero de lado. Por eso una celda no es una caja fija en la pantalla: es un domicilio, y los datos se mudan.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la hoja de los gastos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» tal y como lo dejó la tesorera, con sus dos hojas: la de la salida y la de las cotizaciones del camión. Once encargos. El cuadro de nombres y la barra de fórmulas están arriba, encima de las letras; insertar y eliminar filas y columnas, en Inicio → Celdas; y las líneas de la cuadrícula se apagan desde la pestaña Vista. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaCeldasFilasColumnas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaCeldasFilasColumnas;

export default EntradaCeldasFilasColumnas;
