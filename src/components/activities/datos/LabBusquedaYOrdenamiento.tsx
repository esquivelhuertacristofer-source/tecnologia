'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuez } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from '../python/SalaCodigo';
import { PROBLEMAS_BUSQUEDA } from './problemasBusqueda';

/**
 * N9 · U «Algoritmos y datos» (`n9-algoritmos-y-datos`) · parada 1 de 3 —
 * «Búsqueda y ordenamiento» (currículo: «Búsqueda y ordenamiento (noción de
 * eficiencia)»). **3.º de secundaria, 14–15 años.**
 *
 * Documento maestro §68.2. Reescrita el 12-sep-2026, sobre el juez.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Once encargos que dictaban el programa entero. El primero decía en su
 * instrucción «crea `nombres = ['Ana', 'Luis', …]` · `objetivo = 'Ana'` ·
 * `comparaciones = 0` · `for i in range(len(nombres)):` · (con sangría)…», y
 * su predicado exigía con **nueve expresiones regulares** que cada línea
 * estuviera escrita así: una búsqueda correcta que llamara `n` al contador
 * suspendía y la copia aprobaba. Dos encargos eran «cambia sólo esta línea».
 *
 * La idea de fondo era buena y se conserva: **la eficiencia no se memoriza, se
 * cuenta**. Lo que se quita es que el conteo lo dicte el guion.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Seis problemas con juez sobre la lista de reproducción del festival
 * (`problemasBusqueda.ts`): tres de búsqueda y tres de burbuja. Cuatro de los
 * seis devuelven **un número de trabajo** —comparaciones, intercambios,
 * pasadas— y eso es lo que cierra el atajo: `sorted()` existe en el intérprete
 * y ordenaría la lista en una línea, pero ninguna función de Python cuenta por
 * ti lo que costó ordenarla. Dieciocho casos ocultos de treinta, y cada ejemplo
 * visible elegido para que el error típico lo pase.
 *
 * La única pregunta de opción de la clase va al final y es sobre números que
 * produjeron las funciones del alumno.
 *
 * ── Lo que se confirmó del intérprete al escribir la clase vieja, y sigue ────
 *
 * - `a[i], a[i+1] = a[i+1], a[i]` compila de verdad: los dos lados se evalúan
 *   antes de guardar (`compilar.ts`, caso `'asigna'`).
 * - Rebanadas (`numeros[:]`), `return` dentro de un bucle y `range` con tope
 *   negativo (`range(-1)` de una lista vacía) funcionan: medido contra el
 *   intérprete el 12-sep-2026 con las seis soluciones de referencia.
 * - Un índice fuera de rango da `IndexError` de verdad, con su línea: el juez
 *   lo enseña como «se tropieza» con botón para ir a esa línea.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero del juez (§68). El «Contador de Operaciones» de la clase vieja se
 * retiró: leía variables con nombres que el guion dictaba. El panel de
 * variables de Tecnia Código se queda, porque es con lo que el alumno depura
 * sus funciones antes de enviarlas.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'playlist.py';

const PLANTILLA = [
  '# playlist.py · la app de la lista de reproducción del festival de fin de curso',
  '#',
  '# Los seis problemas están en el panel de la derecha, cada uno con su función,',
  '# sus ejemplos y sus casos ocultos. Escribe aquí las seis funciones —conviven',
  '# en este mismo archivo— y envía cada una al juez cuando esté lista.',
  '#',
  '# Cuatro de ellas devuelven cuánto trabajo costó algo. Eso no lo cuenta',
  '# ninguna función de Python por ti.',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

const PanelFestival = crearPanelJuez({ problemas: PROBLEMAS_BUSQUEDA });

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  'b1-la-posicion':
    'Buscar es parar en el primero que coincide. Y una búsqueda tiene que saber contestar también cuando lo que buscas no está.',
  'b2-lo-que-costo':
    'El costo de buscar depende de dónde esté el dato. El caso más caro es el que no está: para decir «no» hay que mirarlo todo.',
  'b3-parar-a-tiempo':
    'Una lista ordenada te deja parar antes: en cuanto pasaste el lugar donde tendría que estar, ya sabes que no está. Ordenar antes ahorra trabajo después.',
  'b4-una-pasada':
    'Una pasada no ordena la lista, pero siempre deja al más grande al final. Y una lista de n elementos tiene n − 1 parejas de vecinos, no n.',
  'b5-la-burbuja':
    'Ordenar tiene un costo que puedes contar. Y la función que ya trae Python te da la lista, pero no ese número: para medirlo hay que escribir el algoritmo.',
  'b6-cuantas-pasadas':
    'El mismo algoritmo cuesta distinto según cómo llegan los datos. Detenerse cuando ya no cambia nada convierte una lista ordenada en el caso más barato.',
};

const PASOS_DE_PROBLEMA: PasoCodigo[] = PROBLEMAS_BUSQUEDA.map((p) => ({
  id: p.id,
  titulo: p.titulo,
  instruccion: `${p.enunciado} · La función que va a llamar el juez y sus ejemplos están en el panel de la derecha. Cuando creas que está lista, pulsa «Enviar al juez».`,
  pista: p.pistas[0],
  senal: { control: 'editor' },
  logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
  aprendido: APRENDIDO[p.id],
}));

const GUION: GuionCodigo = {
  pasos: [
    ...PASOS_DE_PROBLEMA,
    {
      id: 'lo-que-dicen-tus-numeros',
      titulo: 'Para cerrar · Lo que dicen tus números',
      instruccion:
        'Tu función «pasadas» contesta 1 con la lista [1, 2, 3, 4, 5] y 5 con la lista [5, 4, 3, 2, 1]. Son los mismos cinco números. ¿Qué te dice eso?',
      pista:
        'Las dos listas tienen el mismo tamaño y los mismos números. Lo único distinto es el orden en que llegaron.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que el burbuja está mal escrito: con los mismos números tendría que tardar lo mismo.',
          'Que el trabajo de un algoritmo no depende sólo de cuántos datos hay, sino también de cómo llegan: los mismos cinco números cuestan cinco veces más al revés.',
          'Que las listas ordenadas ocupan menos memoria y por eso se recorren más rápido.',
          'Que siempre conviene usar sorted(), porque el burbuja nunca se detiene antes.',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es la eficiencia, y la mediste tú: no un número que se memoriza, sino el trabajo que de verdad hace un programa con unos datos concretos.',
    },
  ],
  cierre:
    'Seis funciones que usaría cualquier app de verdad, juzgadas con datos que no elegiste tú. Y cuatro de ellas no devuelven un resultado, sino lo que costó conseguirlo: ése es el hábito que separa un programa que funciona de uno que además sabes cuánto trabaja.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n9-busqueda-y-ordenamiento',
  titulo: 'Búsqueda y ordenamiento',
  archivo: ARCHIVO,
  insignia: { nombre: 'Mide su propio código', emoji: '🧮' },
  minutos: 45,
  portada: {
    situacion: 'Nivel 9 · Algoritmos y datos · Parada 1 de 3',
    tema: 'Búsqueda y ordenamiento: cuánto trabajo hace tu programa',
    objetivo:
      'La app del festival de fin de curso necesita buscar canciones y ordenar votos, y el equipo quiere saber cuánto trabajo le cuesta. Hoy no hay instrucciones que copiar: hay seis problemas, cada uno con sus ejemplos y con casos ocultos. Vas a escribir tú las funciones, enviarlas a un juez y leer por qué falla la que falla.',
    vasAHacer: [
      'Buscar una canción en la lista y contar cuántas comparaciones le costó a la app, esté donde esté o no esté.',
      'Aprovechar que una lista ordenada deja parar antes de tiempo.',
      'Escribir el ordenamiento burbuja: primero una pasada, después completo contando sus intercambios.',
      'Mejorarlo para que se detenga solo, y medir con tus funciones por qué la misma lista cuesta distinto según cómo llega.',
    ],
  },
  plantilla: PLANTILLA,
  guion: GUION,
  panelFijo: { titulo: 'El juez del festival', Cuerpo: PanelFestival },
  bit: {
    inicio:
      'La app del festival busca y ordena todo el día. Seis problemas y un juez que llama a tus funciones con listas que no has visto. Y ojo: en cuatro de ellos no basta con el resultado, hay que contar el trabajo.',
    cierre:
      'Seis funciones aceptadas. Y lo que te llevas no es el burbuja, que casi nadie escribe a mano en su trabajo: es la costumbre de preguntarte cuánto trabaja tu programa y medirlo en vez de suponerlo.',
  },
  final: {
    titulo: 'Mediste tu propio código',
    detalle:
      'Escribiste tres búsquedas y tres versiones del burbuja contra un juez con dieciocho casos ocultos, y comprobaste con tus propias funciones que el trabajo de un algoritmo depende de dónde está el dato y de cómo llega la lista.',
  },
};

export function LabBusquedaYOrdenamiento(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export { CLASE, GUION, PLANTILLA };

export default LabBusquedaYOrdenamiento;
