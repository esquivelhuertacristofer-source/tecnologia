'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabQueEsUnRobot } from './LabQueEsUnRobot';

/**
 * Entrada de `n6-que-es-un-robot` — N6 · U «Robótica y STEAM», **parada 1 de
 * 3** (DISEÑO-N6-que-es-un-robot.md).
 *
 * `EntradaN4Base` es agnóstica de nivel. **Cada cadena de aquí está escrita
 * para esta clase** —globo, stats, las cuatro fichas, el CTA—: un port que
 * sólo cambia el import deja las entradas mintiendo, y en esta plataforma ya
 * pasó una vez.
 *
 * Edad de referencia del tono: **6.º de primaria, 11–12 años**, leída en
 * `curriculo.ts`, no en el encargo.
 *
 * La ruta es la misma que ya escribió `EntradaProgramaUnMicrobit.tsx:18-22`
 * para las paradas 2 y 3, con los mismos tres títulos verbatim: esta parada
 * no puede editar ese archivo, así que la repite aquí con la misma forma.
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes`
 * ya es `false`: la entrada enseña el cubrepantalla primero y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no busques el
 * CTA por posición — búscalo por su texto.
 */

const RUTA: PasoRuta[] = [
  { id: 'n6-que-es-un-robot', titulo: '¿Qué es un robot?' },
  { id: 'n6-programa-un-microbit', titulo: 'Programa un micro:bit' },
  { id: 'n6-reto-robot', titulo: 'Reto: resuélvelo con tu robot' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-que-es-un-robot',
  laboratorio: LabQueEsUnRobot,
  ruta: RUTA,
  parada: 1,
  globo:
    'Un robot no es una forma: es un oficio. Se entera de algo, decide, y actúa. Hoy lo armas pieza por pieza y descubres por qué el mismo sensor en otro sitio deja de servir.',
  arranqueSub:
    'Vas a entrar a un laboratorio en 3D. Gira alrededor de la mesa, clasifica las siete piezas, móntalas en el cuerpo del robot y pruébalo contra un obstáculo.',
  stats: [
    { etiqueta: 'Piezas', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '9', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Sensar, decidir, actuar',
  fichas: [
    {
      key: 'primera-pregunta',
      tag: 'La primera pregunta',
      numero: 1,
      titulo: '¿Mete información o hace algo?',
      detalle:
        'Un sensor mete lo que pasa afuera hacia adentro. Un actuador saca algo del robot hacia afuera. Con esas dos palabras se describe **cualquier robot**.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'el-que-decide',
      tag: 'El que decide',
      numero: 2,
      titulo: 'La tarjeta no mide ni suena',
      detalle:
        'Recibe los números de los sensores y manda órdenes a los actuadores. **Ahí vivirá tu programa** en la siguiente parada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-trampa-de-hoy',
      tag: 'La trampa de hoy',
      numero: 3,
      titulo: 'Cabe no es lo mismo que sirve',
      detalle:
        'El sensor de distancia entra igual de bien en el frente y en el techo. **Sólo desde el frente** ve lo que se le viene encima.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'lo-que-no-te-dicen',
      tag: 'Lo que no te dicen',
      numero: 4,
      titulo: 'La pila no es ni sensor ni actuador',
      detalle: 'Hace falta para todo y **no se entera de nada**. Igual que el chasis y los cables.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al laboratorio 3D',
  ctaDetalle:
    'Nueve encargos: clasifica siete piezas, móntalas donde de verdad sirvan, y prueba el robot hasta que se pare antes de chocar.',
  assetsPendientes: false,
};

export function EntradaQueEsUnRobot(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaQueEsUnRobot;
