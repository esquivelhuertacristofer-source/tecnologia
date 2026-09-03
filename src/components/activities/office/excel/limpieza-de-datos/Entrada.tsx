'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabLimpiezaDeDatos } from './Lab';

/**
 * Entrada de `n8-limpieza-de-datos` — primera parada de N8 · «Datos y
 * análisis» (§49.3).
 *
 * **La ruta se deriva de su propia unidad y no se escribe a mano**, igual que
 * en `n6-interpreta-la-informacion` y `n7-datos-reales`: el id es `n8-`, la
 * clase vive en la unidad del nivel 8, y tanto la lista de paradas como el
 * número gigante del CTA salen de `getUnidad('n8-datos-y-analisis')`. No de
 * `comun/rutas.ts`: aquéllos derivan de `EJERCICIOS_OFFICE`, que es donde se
 * dan de alta las clases EXCLUSIVAS de la sala (`of-`), y ésta no lo es.
 *
 * **Cada cadena de esta entrada está escrita para ESTA clase.** Es la
 * advertencia que dejó escrita el bloque de Office y que ya mordió una vez:
 * un port que sólo cambia el import deja la entrada mintiendo —el título, el
 * objetivo, los pasos y la ruta—. Aquí no hay ni una frase heredada de
 * `of-excel-datos-limpios`, que es la clase con la que se podría confundir:
 * aquélla enseña tres botones y ésta no pulsa ninguno de los tres (§49.1).
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-datos-y-analisis')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-limpieza-de-datos';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabLimpiezaDeDatos,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'El primer número que sale casi nunca es el bueno.',
  arranqueSub:
    'Dieciocho alumnos de 3°B contestaron en papel cómo vienen a la escuela, qué distancia recorren y cuánto gastan al día. Cuatro compañeros distintos pasaron las hojas a la computadora, y el resultado es el que tiene cualquier tabla que llega de fuera: una edad de 130 años, una respuesta capturada como «$25 pesos», tres huecos que no se sabe si son ceros, una columna con metros y kilómetros mezclados, y un mismo transporte escrito de cinco maneras. Vas a contestar una sola pregunta —cuánto gasta al día en transporte un alumno de 3°B— y vas a verla dar tres números distintos con la misma fórmula. Ninguna de las tres cuentas está mal hecha.',
  stats: [
    { etiqueta: 'Respuestas', valor: '18', acento: '#22d3ee' },
    { etiqueta: 'Averías', valor: '5', acento: '#f5a524' },
    { etiqueta: 'Encargos', valor: '12', acento: '#34d399' },
  ],
  letrero: 'Ninguna de las cinco averías avisa de nada',
  fichas: [
    {
      key: 'extremos',
      tag: 'Antes del promedio',
      numero: 1,
      titulo: 'Un promedio nunca se mira solo',
      detalle:
        'La edad media de 3°B sale 20,5 años. No hay ni una marca roja: la hoja calculó perfectamente el promedio de lo que le dieron. Lo que lo delata es mirar el máximo —130— y por eso el máximo y el mínimo se escriben ANTES que el promedio, siempre, en cualquier columna de números que te llegue.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'silencio',
      tag: 'El error que no avisa',
      numero: 2,
      titulo: 'SUMA no falla: se salta la celda',
      detalle:
        'Una respuesta se capturó como «$25 pesos». SUMA no da error, no se pone roja, no avisa: la ignora y sigue trabajando con diecisiete de dieciocho. Se caza contando de tres maneras distintas —CONTAR, CONTARA y CONTAR.BLANCO— y viendo que los números no cuadran entre sí.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'hueco',
      tag: 'La decisión',
      numero: 3,
      titulo: 'Un vacío y un cero no son lo mismo',
      detalle:
        'Tres alumnos dejaron el gasto en blanco porque vienen caminando: su gasto real es cero, y el hueco lo está contando como «no sé». PROMEDIO ignora los huecos y divide entre quince; con los ceros escritos divide entre dieciocho. Las dos cuentas están bien hechas y dan resultados distintos: cuál vale no lo decide la fórmula.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'letras',
      tag: 'Cinco maneras',
      numero: 4,
      titulo: 'La máquina cuenta letras, tú cuentas ideas',
      detalle:
        'Diez alumnos vienen en autobús y lo escribieron como «camión», «Camión», «camion», «autobús» y «bus». CONTAR.SI contesta seis. Y el comodín «cami*» contesta diez, que es el número correcto — sólo que se lleva de paso a los tres que vienen CAMINANDO y se deja fuera a los tres del «autobús»: tres errores que se cancelan. Un número correcto por accidente es más peligroso que uno equivocado.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la encuesta de 3°B',
  ctaDetalle:
    'Se abre «Encuesta de transporte 3°B.xlsx», con las cinco averías ya dentro. Doce encargos. Todas las cuentas se escriben a mano en la columna H, al lado del rótulo que las nombra; el único botón de la cinta que hace falta es Copiar y Pegar, en Inicio → Portapapeles. La ficha de la derecha te dice en todo momento qué te falta por revisar.',
};

export function EntradaLimpiezaDeDatos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaLimpiezaDeDatos;

export default EntradaLimpiezaDeDatos;
