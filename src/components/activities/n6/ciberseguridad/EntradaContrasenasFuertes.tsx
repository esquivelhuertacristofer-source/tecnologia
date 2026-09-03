'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN6Base, ConfigEntradaN6, RUTA_N6_CIBERSEGURIDAD } from './EntradaN6Base';
import { LabContrasenasFuertes } from './LabContrasenasFuertes';

/**
 * Entrada de N6·«Ciberseguridad», parada 1 «Contraseñas fuertes y 2 pasos»
 * (currículo, unidad `n6-ciberseguridad`). Nivel 6 = 6.º de Primaria, 11–12
 * años.
 *
 * Primera clase construida sobre `simuladores/navegador/` (armazón cerrado
 * el 15-ago-2026, sin ninguna clase encima todavía — ver la medición en
 * `DISENO-N6-contrasenas-fuertes.md` y en `COMO-SE-CONSTRUYE.md`).
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes` ya
 * es `false`: la entrada enseña primero el cubrepantalla y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no lo busques
 * por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN6 = {
  actividadId: 'n6-contrasenas-fuertes',
  laboratorio: LabContrasenasFuertes,
  ruta: RUTA_N6_CIBERSEGURIDAD,
  parada: 1,
  globo: 'Tu contraseña no la adivina una persona sentada. La adivina un programa, y empieza por lo más fácil.',
  arranqueSub: 'Hoy vas a ver **cómo se adivina una contraseña**, paso por paso, y a armar una que no se adivina.',
  stats: [
    { etiqueta: 'Pasos del ataque', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Cuentas que cuidar', valor: '3', acento: '#4ade80' },
    { etiqueta: 'Contraseñas que tecleas', valor: '0', acento: '#f5a524' },
  ],
  letrero: 'Larga y no adivinable',
  fichas: [
    {
      key: 'programa',
      tag: 'Ficha 1',
      numero: 1,
      titulo: 'Quien adivina es un programa',
      detalle: 'No es una persona sentada escribiendo a mano: es un programa que prueba **en orden**, empezando por lo más probable.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'disfraz',
      tag: 'Ficha 2',
      numero: 2,
      titulo: 'El disfraz no es una llave nueva',
      detalle: 'Cambiar la `a` por `@` o la `o` por `0` no protege nada: el programa le quita el disfraz en un solo paso.',
      acento: { c: '#f5a524', deep: '#c2410c' },
    },
    {
      key: 'cuatro-palabras',
      tag: 'Ficha 3',
      numero: 3,
      titulo: 'Cuatro palabras al azar',
      detalle: '**Larga y no adivinable** gana a "rara": cuatro palabras que no tienen nada que ver entre ellas se recuerdan y no se adivinan.',
      acento: { c: '#4ade80', deep: '#15803d' },
    },
    {
      key: 'dos-pasos',
      tag: 'Ficha 4',
      numero: 4,
      titulo: 'La segunda llave es algo que tienes',
      detalle: 'La contraseña es algo que sabes. La verificación en dos pasos es algo que **tienes** — y con las dos puestas ya no basta con adivinar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el navegador',
  ctaDetalle: 'Abre las tres cuentas y deja que la máquina te enseñe cómo trabaja.',
  assetsPendientes: false,
};

export function EntradaContrasenasFuertes(props: ActivityProps) {
  return <EntradaN6Base {...props} entrada={CONFIG} />;
}

export default EntradaContrasenasFuertes;
