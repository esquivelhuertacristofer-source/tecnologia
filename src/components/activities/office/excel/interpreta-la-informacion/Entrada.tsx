'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabInterpretaLaInformacion } from './Lab';

/**
 * Entrada de `n6-interpreta-la-informacion` — parada de N6 · «Hoja de
 * cálculo II», y la cuarta clase del grado Intermedio de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA DE SU PROPIA UNIDAD, COMO EN TODA CLASE PRESTADA ──────
 *
 * Igual que `n6-funciones-esenciales` y `n7-datos-reales`: el id es `n6-`, la
 * clase vive en la unidad del nivel 6 y la sala de Excel la muestra desde
 * ahí, así que la ruta —y el número que resalta el CTA— salen de
 * `getUnidad('n6-hoja-de-calculo-2')` y no se escriben a mano (§44.6). No de
 * `comun/rutas.ts`: esos ayudantes derivan de `EJERCICIOS_OFFICE`, que es
 * donde se dan de alta las clases EXCLUSIVAS (`of-`), y ésta ya tiene su
 * propia lista, la de su unidad, con ella incluida.
 */

const RUTA_N6: PasoRuta[] = (getUnidad('n6-hoja-de-calculo-2')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n6-interpreta-la-informacion';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabInterpretaLaInformacion,
  ruta: RUTA_N6,
  parada: Math.max(1, RUTA_N6.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy la hoja no la escribiste tú. Tienes que entenderla.',
  arranqueSub:
    'El tesorero del Club de Ajedrez ya se graduó, y su último archivo se quedó sin ninguna nota: cuatro hojas, fórmulas por todos lados, dos errores escondidos y un índice a medias. Vas a encender «Mostrar fórmulas» para ver de un vistazo dónde hay reglas y dónde hay un número escrito a mano —la avería más común del mundo real—, y vas a usar «Inspeccionar libro» para preguntarle al archivo lo que a ojo no se ve: cuántos errores tiene y cuántas hojas están escondidas. Vas a leer un #¡REF! como la historia de algo que alguien borró y un #¡DIV/0! como la historia de un dato que falta, y a arreglar cada uno a su manera. Y vas a terminar el índice con hipervínculos de verdad, quitando el que ya no lleva a ningún lado.',
  stats: [
    { etiqueta: 'Hojas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '10', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Entender una hoja ajena, no escribir la tuya',
  fichas: [
    {
      key: 'ver-formulas',
      tag: 'Bloque 42',
      numero: 1,
      titulo: 'Un número a mano no avisa de nada',
      detalle:
        '«Mostrar fórmulas» levanta la tapa: cada celda enseña la regla que guarda en vez del resultado. Es la única forma de revisar de un vistazo una hoja que hizo otra persona, y así es como se caza un número escrito a mano en medio de una columna de fórmulas — la avería más común del mundo real.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'inspeccionar',
      tag: 'El parte',
      numero: 2,
      titulo: 'Preguntas que a ojo no se ven',
      detalle:
        '«Inspeccionar libro» contesta cuántas fórmulas, cuántos errores y cuántas hojas escondidas tiene el archivo, leyendo el libro de verdad y no una foto vieja. Hoy va a decir 2 errores y 1 hoja escondida, y ninguno de los dos se ve mirando la pantalla.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'dos-errores',
      tag: '#¡REF! y #¡DIV/0!',
      numero: 3,
      titulo: 'Un error cuenta una historia',
      detalle:
        'Un #¡REF! dice que alguien borró algo, y se arregla editando la fórmula. Un #¡DIV/0! dice que falta un dato, y se arregla rellenando el hueco sin tocar la regla. Confundir los dos es tapar un error sin haber entendido qué lo causó.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'hipervinculos',
      tag: 'Bloque 40',
      numero: 4,
      titulo: 'De archivo a documento',
      detalle:
        'Un índice con hipervínculos convierte cuatro hojas sueltas en algo navegable. Y un vínculo a una hoja que no existe se rechaza al crearlo —no falla en silencio—: lo vas a comprobar antes de terminar el índice que el tesorero anterior dejó a medias.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre las cuentas del club de ajedrez',
  ctaDetalle:
    'Se abre «Cuentas del Club de Ajedrez.xlsx», el archivo que dejó el tesorero anterior. Diez encargos. «Mostrar fórmulas» está en Fórmulas → Auditoría de fórmulas. «Inspeccionar libro» está en Archivo → Información. El hipervínculo se crea con la celda seleccionada, escribiendo a qué hoja saltar: «h2!A1».',
};

export function EntradaInterpretaLaInformacion(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaInterpretaLaInformacion;

export default EntradaInterpretaLaInformacion;
