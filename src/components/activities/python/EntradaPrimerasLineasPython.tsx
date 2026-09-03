'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabPrimerasLineasPython } from './LabPrimerasLineasPython';

/**
 * Entrada de N6 · «De bloques a texto» · parada 2 «Primeras líneas de Python».
 *
 * Monta `EntradaN4Base`, que es **agnóstica de nivel pese al nombre** —lo dice
 * su propia cabecera y N5 ya la reutiliza— y recibe la ruta de la unidad por
 * configuración. Duplicar sus 350 líneas en una carpeta nueva para cambiar dos
 * cadenas sería exactamente el port que deja las entradas mintiendo.
 *
 * **Cada cadena de aquí está escrita para esta clase**: no hay ni una heredada
 * de la entrada de la que se copió el molde. Los títulos de la ruta son
 * verbatim de `curriculo.ts`, y el registro es 6.º de primaria (11–12 años),
 * comprobado antes de escribir.
 *
 * `assetsPendientes` está puesto porque el video y las cuatro láminas de esta
 * clase no existen todavía: la campaña de videos sigue pausada desde el
 * 1-ago-2026. La entrada conserva todo lo demás de la plantilla de oro —datos,
 * letrero, fichas con su texto entero, CTA gigante y ruta—; lo único que cambia
 * es que se dice en pantalla que el video llega después, en vez de servir un
 * reproductor roto.
 */

const RUTA_N6_DE_BLOQUES_A_TEXTO: PasoRuta[] = [
  { id: 'n6-bloques-vs-codigo', titulo: 'El mismo programa, dos caras' },
  { id: 'n6-primeras-lineas-python', titulo: 'Primeras líneas de Python' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-primeras-lineas-python',
  laboratorio: LabPrimerasLineasPython,
  ruta: RUTA_N6_DE_BLOQUES_A_TEXTO,
  parada: 2,
  globo:
    'Hasta hoy programabas arrastrando bloques. Hoy abres un editor de código y escribes las órdenes tú, letra por letra.',
  arranqueSub:
    'Vas a abrir **saludo.py**, tu primer archivo de Python, y a escribir dentro las tres piezas que tiene cualquier programa.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Piezas', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las tres piezas de un programa',
  fichas: [
    {
      key: 'orden',
      tag: 'Cómo se cumple',
      numero: 1,
      titulo: 'De arriba abajo, una por una',
      detalle:
        'Un programa es una lista de órdenes. La computadora empieza por la primera línea y baja. **Ni se salta ninguna ni cambia el orden.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'print',
      tag: 'Pieza 1',
      numero: 2,
      titulo: 'print escribe',
      detalle:
        'Lo que pongas **entre comillas** dentro de los paréntesis sale escrito en la consola, tal cual, sin cambiarle nada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'variable',
      tag: 'Pieza 2',
      numero: 3,
      titulo: 'Una variable guarda',
      detalle:
        'Es una caja con nombre. El nombre va **sin comillas**; lo que guardas dentro va con comillas si es texto. Luego la usas escribiendo su nombre.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'error',
      tag: 'Y lo que nadie te dice',
      numero: 4,
      titulo: 'El error es parte del oficio',
      detalle:
        'Todos los programas se rompen. El editor te dice **en qué línea** y **qué no entendió**: se lee, se arregla esa línea y ya. **No es tu culpa.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Ocho encargos: ejecuta un programa, míralo ir despacio, escribe tu propio print, guarda tu nombre en una variable, **rómpelo a propósito**, arréglalo y haz que decida solo.',
  assetsPendientes: false,
};

export function EntradaPrimerasLineasPython(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPrimerasLineasPython;
