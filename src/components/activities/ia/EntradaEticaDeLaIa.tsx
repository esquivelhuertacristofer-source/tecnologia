'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N8_IA_2 } from './rutasIA';
import { LabEticaDeLaIa } from './LabEticaDeLaIa';

/**
 * Entrada de `n8-etica-de-la-ia` — N8 · «IA II», **parada 3 de 3, CIERRA LA UNIDAD**.
 * 2.º de secundaria, 13–14 años (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, con cada cadena escrita para esta clase: el
 * globo, el arranque, los tres datos, el letrero, las cuatro fichas y el CTA
 * hablan de plagio, deepfakes y citas — nada copiado de `n8-genera-con-ia`
 * (parada 1, la ética de PEDIR contenido) ni de `n8-sesgos-y-errores`
 * (parada 2, la ética de DETECTAR un error) con el import cambiado (regla de
 * la casa: *un port que sólo cambia el import deja las entradas mintiendo*).
 *
 * **El registro es el del §30.4**, igual que sus dos hermanas: término
 * técnico con su traducción la primera vez (*deepfake*), el porqué antes que
 * el qué, cero diminutivos y ni una celebración vacía. La entrada no promete
 * un juego: promete una auditoría de lo que ya hiciste con lo que una IA
 * generó — el mismo papel que tuvo `n8-derechos-y-licencias` cerrando
 * «Producción multimedia y videojuegos»: aplicar criterio, no aprender un
 * programa nuevo.
 *
 * El orden de las fichas es el de la clase: plagio primero (lo más cercano a
 * lo que el alumno ya sabía), deepfakes segundo (una amenaza nueva, a una
 * persona real), citar el uso tercero (la salida honesta cuando SÍ conviene
 * usar una IA), y se cierra con el hallazgo que integra los tres.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n8-etica-de-la-ia',
  laboratorio: LabEticaDeLaIa,
  ruta: RUTA_N8_IA_2,
  parada: 3,
  globo:
    'Ésta es la última parada de «IA II». Ya generaste contenido con una IA y ya encontraste sus errores — ahora toca decidir si lo que hiciste con eso estuvo bien.',
  arranqueSub:
    'Vas a decidir cuándo un texto de IA es plagio y cuándo es tuyo, aunque una IA lo haya ayudado a nacer. Vas a aprender a no confiar en un video o audio sólo porque **"se ve bien hecho"** —un deepfake imita a una persona real hasta parecer auténtico—, y vas a escribir la diferencia entre "usé IA" y una cita que de verdad dice **qué hizo la IA y qué hiciste tú**. Cierra con un trabajo escolar real que trae los tres problemas a la vez.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#fb7185' },
    { etiqueta: 'Casos decididos', valor: '12', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La herramienta no es el problema: la deshonestidad sí',
  fichas: [
    {
      key: 'plagio-con-ia',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Entregar texto de IA como propio es plagio',
      detalle:
        'No es una regla de «usar IA = malo». Dos preguntas deciden: **¿lo declaras?** ¿lo **transformaste** con tu propio análisis? Ninguna de las dos, es plagio, aunque no le hayas copiado a un compañero.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'deepfakes-senales',
      tag: 'El segundo',
      numero: 2,
      titulo: '«Se ve bien hecho» no verifica nada',
      detalle:
        'Un **deepfake** —*deepfake*, «falsificación profunda»— es un video o audio falso, hecho con IA, que imita a una persona real hasta parecer auténtico. Lo que importa es la fuente, la corroboración independiente y el contexto — nunca el acabado.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'citar-el-uso',
      tag: 'El tercero',
      numero: 3,
      titulo: 'Cuando sí usas una IA, dilo bien',
      detalle:
        'Cuando ayuda a organizar ideas o revisar gramática, usar una IA está bien — pero hace falta decir **qué hizo la IA y qué hiciste tú**. «Usé IA» a secas no alcanza, y negar que la usaste es simplemente mentir.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-cierre-integra',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Un trabajo real trae los tres a la vez',
      detalle:
        'Cierra «IA II»: un párrafo pegado sin decir nada, un dato sin fuente confiable y una cita honesta, en el mismo trabajo escolar. Ningún criterio es nuevo — aplicar los tres juntos es lo que cierra la unidad.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60, decisión de Cristofer) y
  // la carpeta de assets de esta clase no existe en disco todavía (confirmado
  // con `ls public/assets/actividades/`).
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Auditoría',
  ctaDetalle:
    'Nueve encargos: clasifica cuatro casos de plagio con un criterio real, verifica un rumor con señales de verdad —no con "se ve bien hecho"—, escribe una cita honesta de cómo usaste la IA, y cierra auditando un trabajo escolar real con los tres problemas a la vez.',
};

export function EntradaEticaDeLaIa(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaEticaDeLaIa;
