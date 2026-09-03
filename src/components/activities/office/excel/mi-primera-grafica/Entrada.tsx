'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabMiPrimeraGrafica } from './Lab';

/**
 * Entrada de `n5-mi-primera-grafica` — la cuarta y última parada de N5 · U2
 * «Hoja de cálculo I», y la quinta y última clase del grado Básico de la sala
 * de Excel.
 *
 * La ruta y el número del CTA se derivan de la unidad del currículo, igual
 * que en las tres clases anteriores y por lo mismo que se escribió allí: la
 * ruta escrita a mano fue la que dejó mintiendo a cinco entradas de
 * PowerPoint (§44.6).
 */

const RUTA_N5U2: PasoRuta[] = (getUnidad('n5-hoja-de-calculo-1')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n5-mi-primera-grafica';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabMiPrimeraGrafica,
  ruta: RUTA_N5U2,
  parada: Math.max(1, RUTA_N5U2.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy tus números se convierten en un dibujo, y ese dibujo sale en papel.',
  arranqueSub:
    'La tesorera ya sabe qué costó la salida, ya tiene sus fórmulas trabajando solas y ahora quiere enseñárselo a la junta de padres sin que nadie tenga que leer una tabla de números en voz alta. Vas a convertir esos números en una gráfica de columnas — y la vas a hacer mal la primera vez, a propósito, para ver con tus ojos qué pasa cuando el rango que marcas incluye algo que no debería. La vas a arreglar, le vas a poner título, ejes y los números exactos encima de cada barra, y vas a cerrar la clase entregándola de verdad: guardada, e impresa sólo con lo que hace falta, sin la tabla de trabajo delante.',
  stats: [
    { etiqueta: 'Gráficas', valor: '1', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '10', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Una gráfica es una vista, no un dibujo',
  fichas: [
    {
      key: 'seleccionar-es-la-mitad',
      tag: 'El rango',
      numero: 1,
      titulo: 'Seleccionar bien es la mitad del trabajo',
      detalle:
        'Si el rango que marcas incluye una fila de total, esa fila entra a la gráfica como si fuera un dato más — y como es la suma de todos los demás, siempre va a ser la barra más alta por mucho. La gráfica no se equivocó: comparó exactamente lo que le diste.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'vista-no-dibujo',
      tag: 'La idea',
      numero: 2,
      titulo: 'No guarda números: los va a buscar',
      detalle:
        'Una gráfica no es una foto de tu tabla en el momento en que la hiciste: es una ventana abierta a un rango. Cambia un dato ahí abajo y la barra se mueve sola, sin que tú toques el dibujo — es la misma idea de «la celda guarda la regla», un piso más arriba.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'cuatro-partes',
      tag: 'Bloque 18',
      numero: 3,
      titulo: 'Título, ejes, leyenda, rótulos',
      detalle:
        'Una gráfica sin título no se entiende sola, y una barra sin su número encima sólo dice «más o menos». Las cuatro partes se ponen y se quitan desde un panel que aparece al marcar tu gráfica — y a veces, como con la leyenda de una sola serie, lo correcto es quitar una que sobra.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'elegir-que-no',
      tag: 'Imprimir',
      numero: 4,
      titulo: 'Imprimir es elegir qué NO se imprime',
      detalle:
        'Sin un área marcada, tu hoja entera sale por la impresora: la tabla de trabajo, las fórmulas de más y la gráfica partida en dos páginas. El área de impresión es lo que separa entregar una hoja limpia de entregar varias con las cuentas de en medio.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la hoja de los gastos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» donde lo dejaste, con el resumen para la junta ya escrito. Diez encargos. Los tres tipos de gráfica están en Insertar → Gráficos; al marcar tu gráfica sale un panel a la derecha con sus partes; y guardar e imprimir están en Archivo.',
};

export function EntradaMiPrimeraGrafica(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaMiPrimeraGrafica;

export default EntradaMiPrimeraGrafica;
