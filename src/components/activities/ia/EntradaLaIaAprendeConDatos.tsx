'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N5_IA_A_MI_ALCANCE } from './rutasIA';
import { LabLaIaAprendeConDatos } from './LabLaIaAprendeConDatos';

/**
 * Entrada de `n5-la-ia-aprende-con-datos` — N5 · «IA a mi alcance», parada 2
 * de 3. **5.º de primaria, 10–11 años** (comprobado en `curriculo.ts`, no en
 * el encargo).
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Se reutiliza `EntradaN5Base` —que recibe la ruta
 * por parámetro— en vez de copiar 350 líneas de plantilla en una carpeta
 * nueva; es lo que ya hizo N5 con la base de N4.
 *
 * **Cada cadena de esta entrada está escrita para esta clase.** No es un port:
 * un port que sólo cambia el import deja las entradas mintiendo, y en este
 * proyecto ya pasó. El globo, el arranque, los tres datos, el letrero, las
 * cuatro fichas y el CTA hablan del club de mascotas, de las ocho fichas y del
 * gato negro; ninguna frase viene de otra clase.
 *
 * Las cuatro fichas van en el orden en que el laboratorio las necesita: la
 * primera dice qué es «aprender» aquí, la segunda es la idea que se lleva el
 * alumno a casa, la tercera es la trampa (estar seguro no es tener razón) y la
 * cuarta, el remate: se arregla poniendo el ejemplo que faltaba. Quien se
 * quede sólo con la segunda ya deja de creer que la máquina «es lista».
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-la-ia-aprende-con-datos',
  laboratorio: LabLaIaAprendeConDatos,
  ruta: RUTA_N5_IA_A_MI_ALCANCE,
  parada: 2,
  globo:
    'El club de mascotas quiere una app que reconozca gatos y perros. La máquina no sabe nada todavía: se lo tienes que enseñar tú.',
  arranqueSub:
    'Vas a abrir **Tecnia Entrena** y a enseñarle a una máquina con **ocho fichas**. Ella no ve fotos: sólo lee el color, las orejas y la cola. Cuando la pruebes con fichas nuevas va a acertar dos… y a fallar otras dos, siempre en lo mismo. Lo bueno es que el fallo **no es de la máquina: es de lo que le enseñaste**, y lo vas a poder arreglar tú.',
  stats: [
    { etiqueta: 'Fichas', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Pruebas', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo aprende de verdad una máquina',
  fichas: [
    {
      key: 'solo-lo-que-le-ensenas',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Sólo sabe lo que le enseñas',
      detalle:
        'Una IA no nace sabiendo. Alguien le pone delante un montón de ejemplos con su etiqueta, y ella busca la pregunta que mejor los separa. **Lo que no esté en ese montón, no existe para ella.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'falla-en-lo-que-falta',
      tag: 'La idea central',
      numero: 2,
      titulo: 'Falla justo donde le faltó',
      detalle:
        'Si sólo vio gatos naranjas y blancos, al gato negro le va a decir «perro». No porque esté rota: porque **todas las fichas negras que vio eran perros**. El fallo estaba en el montón, no en la máquina.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'segura-no-es-correcta',
      tag: 'La trampa',
      numero: 3,
      titulo: 'Estar segura no es tener razón',
      detalle:
        'Cuando se equivoque no va a dudar: lo va a decir con el **100 %** de seguridad. Ese número dice cuánto se parecían sus fichas entre sí, **no si acertó**. Es lo más difícil de creer de toda la clase.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'se-arregla-con-datos',
      tag: 'El remate',
      numero: 4,
      titulo: 'Se arregla con datos, no con regaños',
      detalle:
        'Le pones en la mesa la ficha que le faltaba, vuelves a entrenar, y ahora acierta. **Eso es lo que hace de verdad quien entrena una IA:** mirar los datos, no la máquina.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video depende de la campaña, congelada en 8 de 60 por decisión de
  // Cristofer; la entrada lo dice en pantalla en vez de cargar un reproductor
  // roto. Las láminas de las fichas tampoco existen todavía.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Entrena',
  ctaDetalle:
    'Vas a etiquetar ocho fichas, entrenar a la máquina, ver su árbol de preguntas escrito en palabras, preguntarle qué NO sabe antes de probarla, y arreglarla con la ficha que le faltaba.',
};

export function EntradaLaIaAprendeConDatos(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaLaIaAprendeConDatos;
