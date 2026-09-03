'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabBloquesVsCodigo } from './LabBloquesVsCodigo';

/**
 * Entrada de N6 · «De bloques a texto» · parada 1 «El mismo programa, dos caras».
 *
 * Monta `EntradaN4Base`, agnóstica de nivel pese al nombre. Cada cadena de
 * aquí está escrita para esta clase — no hay ni una heredada de
 * `EntradaPrimerasLineasPython.tsx`, aunque el molde y la ruta de la unidad
 * (los mismos dos títulos, verbatim) vienen de ahí. El registro es 6.º de
 * primaria (11–12 años), comprobado en `curriculo.ts` antes de escribir.
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes` ya
 * es `false`: la entrada enseña primero el cubrepantalla y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no lo busques
 * por posición — búscalo por su texto.
 */

const RUTA_N6_DE_BLOQUES_A_TEXTO: PasoRuta[] = [
  { id: 'n6-bloques-vs-codigo', titulo: 'El mismo programa, dos caras' },
  { id: 'n6-primeras-lineas-python', titulo: 'Primeras líneas de Python' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-bloques-vs-codigo',
  laboratorio: LabBloquesVsCodigo,
  ruta: RUTA_N6_DE_BLOQUES_A_TEXTO,
  parada: 1,
  globo:
    'Los bloques que llevas dos años usando y las letras que escriben los programadores son lo mismo. Hoy los ves lado a lado, con un solo botón de ejecutar, y encuentras el punto exacto donde se parecen y donde no.',
  arranqueSub:
    'Vas a abrir una ventana con dos caras: a la izquierda tus bloques, a la derecha el mismo programa en Python, escribiéndose solo mientras armas.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Caras', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Un programa, dos formas de escribirlo',
  fichas: [
    {
      key: 'lo-primero',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'No son dos programas',
      detalle:
        'Es uno solo con dos caras, y por eso hay un solo botón de ejecutar. Lo que armas a la izquierda aparece escrito a la derecha en el mismo instante.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'equivalencia',
      tag: 'La equivalencia que importa',
      numero: 2,
      titulo: 'La boca del bloque son cuatro espacios',
      detalle:
        'Lo que en bloques se ve porque está dentro, en texto se ve porque está corrido a la derecha.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'trampa',
      tag: 'La trampa de hoy',
      numero: 3,
      titulo: 'Cuatro espacios cambian el resultado',
      detalle:
        'La misma línea dentro o fuera del repetir sale tres veces o una sola, y en texto nadie te avisa.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'nadie-te-dice',
      tag: 'Lo que nadie te dice',
      numero: 4,
      titulo: 'El sombrero no tiene línea',
      detalle:
        'Un archivo de texto empieza por su primera línea y ya. No todo se traduce pieza por pieza.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre las dos caras',
  ctaDetalle:
    'Ocho encargos: ejecuta y mira encenderse las dos caras a la vez, arma con bloques y ve el texto reescribirse solo, y encuentra los cuatro espacios que deciden si algo pasa una vez o tres.',
  assetsPendientes: false,
};

export function EntradaBloquesVsCodigo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBloquesVsCodigo;
