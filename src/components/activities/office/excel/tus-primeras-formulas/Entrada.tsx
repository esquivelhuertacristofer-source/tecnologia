'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabTusPrimerasFormulas } from './Lab';

/**
 * Entrada de `n5-tus-primeras-formulas` — la **tercera parada** de N5 · U2
 * «Hoja de cálculo I», y la cuarta clase del grado Básico de la sala de Excel
 * (entre medias va `of-excel-formato-de-celda`, que es exclusiva de la sala y
 * por lo tanto no vive en esta unidad).
 *
 * ── LA RUTA Y EL NÚMERO SE DERIVAN, LOS DOS ─────────────────────────────────
 *
 * La ruta sale de la unidad del currículo, igual que en las clases 1 y 2 y por
 * lo que se escribió allí: en la sala de PowerPoint cinco entradas acabaron
 * mintiendo por llevar la ruta escrita a mano (§44.6).
 *
 * Y el **número del CTA** sale del mismo sitio, que es nuevo. Las dos clases
 * anteriores lo escriben a mano —`parada: 1` y `parada: 2`— y ahí coincidía con
 * la tira; aquí no habría coincidido: el encargo de esta clase la llamaba «la
 * parada 4» porque es la cuarta del **grado**, y en la tira de la **unidad** es
 * la tercera de cuatro. Escribir el 4 habría dejado un número gigante diciendo
 * una cosa y la ruta de al lado señalando otra, en la misma pantalla — que es
 * exactamente la forma del defecto del §44.6, con otro disfraz. El número que
 * se enseña y la parada que se resalta salen ahora del mismo dato, así que no
 * se pueden separar.
 */

const RUTA_N5U2: PasoRuta[] = (getUnidad('n5-hoja-de-calculo-1')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n5-tus-primeras-formulas';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabTusPrimerasFormulas,
  ruta: RUTA_N5U2,
  parada: Math.max(1, RUTA_N5U2.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy escribes un signo igual. Después de esto, tu hoja se corrige sola.',
  arranqueSub:
    'Mismo archivo, dos semanas después. La tesorera ya sabe qué costó la salida a Teotihuacán y ya sabe quién ha pagado; lo que no tiene es una sola cuenta hecha por la hoja — los importes de «Lo pagado» los sacó con una calculadora y los tecleó a mano, uno por uno. Y hoy, en cuanto le cambies un precio, vas a ver el problema con tus ojos: el número se queda como estaba y la hoja empieza a mentir sin avisar. Vas a arreglarlo escribiendo tu primera fórmula, a llenar la columna entera con esa sola regla, a sacar el total con Autosuma —y a cazarlo adivinando mal el rango, que le pasa casi nunca y por eso se revisa siempre—, a perderle el miedo a un #¡DIV/0! y a descubrir, con los números en pantalla, por qué una celda vacía no es un cero.',
  stats: [
    { etiqueta: 'Funciones', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Escribe reglas, no resultados',
  fichas: [
    {
      key: 'empieza-por-igual',
      tag: 'El igual',
      numero: 1,
      titulo: 'Todo empieza por =',
      detalle:
        'Sin el igual del principio, la hoja cree que le escribiste una palabra y la guarda tal cual. Con él, entiende que le estás pidiendo una cuenta: =B4*C4 no es «be cuatro por ce cuatro», es «multiplica lo que haya en esas dos celdas, ahora y siempre».',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'dos-vistas',
      tag: 'Dos vistas',
      numero: 2,
      titulo: 'Abajo el resultado, arriba la regla',
      detalle:
        'La celda enseña 5200 y la barra de fórmulas enseña =B4*C4. No son dos datos: son el mismo dato mirado desde dos sitios. Por eso cambiar un precio mueve la celda sola — el 5200 no estaba guardado en ninguna parte, se vuelve a calcular cada vez.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'autosuma-adivina',
      tag: 'Autosuma',
      numero: 3,
      titulo: 'Adivina el rango, y hay que revisarlo',
      detalle:
        'Autosuma sube por la columna hasta topar con algo que no sea un número y decide sola qué sumar. Acierta casi siempre, y casi siempre no es siempre: aquí la vas a ver meter el total dentro de la lista y contestarte que el gasto más caro es la suma de todos.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'vacio-no-es-cero',
      tag: 'Vacío y cero',
      numero: 4,
      titulo: 'Vacío no es cero',
      detalle:
        'Un cero es un dato: «ya lo sé, y vale cero». Una celda vacía es lo contrario: «todavía no lo sé». El promedio de cinco celdas con dos sin número reparte entre tres, no entre cinco — y en cuanto escribes un cero «para que no quede feo», el resultado cambia y la hoja empieza a mentir.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la hoja de los gastos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» donde lo dejaste, con la hoja de la salida delante. Trece encargos. Toda fórmula empieza por =; las funciones están en la pestaña Fórmulas y Autosuma también en Inicio → Edición; para arreglar una fórmula ya escrita, doble clic en su celda o F2. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaTusPrimerasFormulas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaTusPrimerasFormulas;

export default EntradaTusPrimerasFormulas;
