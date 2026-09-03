'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N7_IA_1 } from './rutasIA';
import { LabBuenosPrompts } from './LabBuenosPrompts';

/**
 * Entrada de `n7-buenos-prompts` — N7 · «IA I», parada 2 de 3.
 * **1.º de secundaria, 12–13 años** (comprobado en `curriculo.ts`).
 *
 * Se reutiliza `EntradaN5Base` aunque la clase sea de N7: esa base no lee el
 * nivel de ningún dato —recibe la ruta y la parada por parámetro— y es la
 * misma plantilla de oro heredada de N1·U5 en adelante. Es exactamente lo que
 * ya hizo N5 con `EntradaN4Base` el 15-ago-2026. Copiar 350 líneas de
 * plantilla para cambiarle el número al comentario habría sido la sexta copia
 * de lo mismo.
 *
 * **El tono es de secundaria y se nota.** Frases más largas que en las dos
 * paradas de N5, las cosas por su nombre —prompt, contexto, formato,
 * destinatario— y ni un diminutivo. Y cada cadena es de esta clase: la
 * exposición del agua, los cuatro criterios y la trampa del prompt largo.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n7-buenos-prompts',
  laboratorio: LabBuenosPrompts,
  ruta: RUTA_N7_IA_1,
  parada: 2,
  globo:
    'Tienes cinco minutos de exposición sobre el agua en tu ciudad. El asistente te va a contestar exactamente igual de bien o de mal que le preguntes.',
  arranqueSub:
    'Ésta es la única clase en la que **escribes tú**: nada de elegir entre tres opciones. Vas a pedirle cuatro cosas para tu exposición, y debajo del cuadro de texto hay **cuatro criterios que se encienden mientras tecleas**. Con dos encendidos la respuesta ya sirve pero no la puedes usar; con los cuatro, sale lista para el lunes. Y vas a comprobar algo que sorprende: **el prompt más largo que escribas no va a ser el mejor.**',
  stats: [
    { etiqueta: 'Encargos', valor: '4', acento: '#a78bfa' },
    { etiqueta: 'Criterios', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las cuatro cosas que tiene que decir tu petición',
  fichas: [
    {
      key: 'destinatario',
      tag: 'Criterio 1',
      numero: 1,
      titulo: 'Para quién es',
      detalle:
        'No es lo mismo explicárselo a tus compañeros de secundaria que a un niño de seis años o a tu maestra. Si no lo dices, el asistente elige por ti — y casi siempre elige mal.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'formato',
      tag: 'Criterio 2',
      numero: 2,
      titulo: 'Qué formato quieres',
      detalle:
        'Una lista de cinco puntos, una tabla, un guion en tres partes. Pedir el formato es la diferencia entre una respuesta que copias y pegas y una que tienes que rehacer entera.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'contexto',
      tag: 'Criterio 3',
      numero: 3,
      titulo: 'De qué va y para qué',
      detalle:
        'Una exposición de clase, un trabajo, un examen. El contexto es lo que hace que la respuesta hable de **tu** ciudad y de **tu** materia, y no del tema en general.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'extension',
      tag: 'Criterio 4 · y la trampa',
      numero: 4,
      titulo: 'Qué tan largo lo quieres',
      detalle:
        'Cinco minutos, tres frases, doscientas palabras. Y ojo con la trampa de esta clase: **escribir mucho no es pedir bien**. Un prompt de treinta palabras que no dice para quién es vale menos que uno de doce que lo dice todo.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video depende de la campaña, congelada en 8 de 60 por decisión de
  // Cristofer; la entrada lo dice en pantalla en vez de cargar un reproductor
  // roto. Las láminas de las fichas tampoco existen todavía.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre tu cuaderno de prompts',
  ctaDetalle:
    'Cuatro encargos de la misma exposición: entender el tema, armar el guion, conseguir datos con su fuente y escribir la diapositiva de cierre. Reescribir no cuesta nada, y cada intento se te queda anotado en el cuaderno.',
};

export function EntradaBuenosPrompts(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaBuenosPrompts;
