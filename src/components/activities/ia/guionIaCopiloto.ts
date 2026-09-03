/**
 * ══════════════════════════════════════════════════════════════════════════
 * N9 · «IA y automatización», parada 2 de 3 · `n9-ia-copiloto`
 * Datos puros de «La IA como copiloto». SIN React.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **3.º de secundaria, 14–15 años** (comprobado en `src/data/curriculo.ts`,
 * unidad `n9-ia-y-automatizacion`). Registro de secundaria alta: se nombra
 * el mecanismo y se explica el porqué, sin metáfora infantil — mismo salto
 * de registro que ya usa la parada 1 de esta unidad.
 *
 * ── En qué se diferencia de `n9-automatiza-tareas` (la parada 1) ──────────
 *
 * Aquella parada construye una REGLA: «si el asunto contiene esto, entonces
 * archívalo ahí». Fija, predecible, la misma salida para la misma entrada
 * siempre — motor Tecnia Bloques. Ésta usa Tecnia Asistente: un chat con
 * una IA generativa que da SUGERENCIAS —código, texto— que no siguen una
 * regla escrita por el alumno, y que hay que evaluar antes de aceptar. La
 * diferencia no es de dificultad: es de naturaleza. Una automatización se
 * verifica leyendo la regla; una sugerencia de IA se verifica PROBÁNDOLA.
 *
 * ── El arco de la clase, encargo por encargo ────────────────────────────
 *
 *  0–1 · CUÁNDO. Misma pregunta, dos tareas distintas: una trivial (poner un
 *        texto en mayúsculas) donde pedir ayuda cuesta más de lo que ahorra,
 *        y otra con lógica real (una función de promedio) donde sí conviene.
 *        Las dos tienen un botón «Hazlo tú mismo» y uno «Pídele al
 *        copiloto» — y el botón correcto cambia de uno a otro.
 *  2    · EVALUAR CÓDIGO CORRECTO. El copiloto ya dio una función simple
 *         (encargo 1); aquí se prueba con datos reales antes de aceptarla.
 *         Aceptar es lo correcto: sirve para que «probar antes de aceptar»
 *         no se aprenda como sinónimo de «siempre hay un error».
 *  3–4  · EL BUG QUE NO TRUENA. El copiloto escribe una función que filtra
 *         los robots descalificados para sumarlos, pero se le olvida
 *         filtrarlos también para CONTAR cuántos eran — el programa corre
 *         sin ningún error y da un número equivocado. Encontrarlo exige
 *         hacer la cuenta a mano y compararla, no leer un mensaje de error
 *         (no hay ninguno). El encargo 4 confirma que la corrección sí
 *         quedó bien, con la misma prueba.
 *  5–6  · EL BUG QUE SE LEE BIEN. Mismo patrón con texto: un párrafo para el
 *         volante que se lee perfecto y trae un dato inventado (5 equipos
 *         con medalla; la hoja real dice 3). Se compara contra una fuente
 *         propia —no contra «lo que suena bien»— igual que en
 *         `n7-verifica-a-la-ia`, pero aquí la fuente es un dato del propio
 *         trabajo, no una búsqueda externa.
 *  7    · EL CIERRE. Cuatro tareas reales de lo que falta para entregar el
 *         reporte; el alumno aplica todo el criterio de arriba para decidir
 *         cuáles le tocan al copiloto y cuáles a él.
 *  8    · LA REFLEXIÓN. Por qué no basta con que el código corra o el texto
 *         se lea bien para aceptarlo sin más.
 *
 * ── Como en las 16 clases hermanas, la IA nunca es real ────────────────
 *
 * `GUION_IA_COPILOTO` sólo devuelve, vía `resolverGuion`, respuestas ya
 * escritas abajo — incluida la que trae el error. El profesor decide
 * exactamente qué se equivoca el copiloto y cuándo; eso es lo que se enseña.
 */

import type { GuionAsistente } from '@/components/simuladores/asistente';

export const TOTAL_ENCARGOS = 9;

// ───────────────────────────────────────────────────────────────────────────
// 1 · Los datos del promedio — la aritmética es real, no se escribe a mano
//     en ningún texto de Bit: así un número mal tecleado aquí no puede dejar
//     una explicación que no cuadre con lo que el panel calcula y muestra.
// ───────────────────────────────────────────────────────────────────────────

export const PUNTAJES_SIMPLE: readonly number[] = [78, 85, 92, 88];
export const PUNTAJES_CON_DESCALIFICADOS: readonly number[] = [80, -1, 90, 100];

const suma = (nums: readonly number[]): number => nums.reduce((a, b) => a + b, 0);

/** La función que el copiloto da en el encargo 1: correcta, sin trampa. */
export function promedioSimple(puntajes: readonly number[]): number {
  return suma(puntajes) / puntajes.length;
}

/**
 * El bug del encargo 3: filtra los descalificados para SUMAR, pero divide
 * entre `puntajes.length` (todos) en vez de `validos.length`. No lanza
 * ningún error — simplemente da un número que no es el promedio real.
 */
export function promedioConBug(puntajes: readonly number[]): number {
  const validos = puntajes.filter((p) => p !== -1);
  return suma(validos) / puntajes.length;
}

/** La misma función, ya arreglada (encargo 4): divide entre los válidos. */
export function promedioArreglado(puntajes: readonly number[]): number {
  const validos = puntajes.filter((p) => p !== -1);
  return suma(validos) / validos.length;
}

/** `85.75`, `90` — nunca arrastra más decimales de los que el número tiene. */
export function formatResultado(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : String(Math.round(n * 100) / 100);
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · La hoja de resultados real de la feria — la fuente contra la que se
//     compara el párrafo del volante en los encargos 5 y 6.
// ───────────────────────────────────────────────────────────────────────────

export const EQUIPOS_PARTICIPANTES = 12;
export const EQUIPOS_CON_MEDALLA = 3;

/** El id de la parte falsa dentro de `r-e5-pide` — por él se sabe si tocaron la correcta. */
export const PARTE_FALSA_ID = 'p5-b';

// ───────────────────────────────────────────────────────────────────────────
// 3 · El cierre — cuatro tareas reales, dos por cada lado del criterio.
// ───────────────────────────────────────────────────────────────────────────

export type Destino = 'copiloto' | 'tu';

export interface TareaCierre {
  id: string;
  texto: string;
  correcta: Destino;
  /** Por qué, se lea cuando el alumno elige el lado equivocado. */
  porque: string;
}

export const TAREAS_CIERRE: readonly TareaCierre[] = [
  {
    id: 't-promedio',
    texto: 'Sumar y sacar el promedio de los puntajes de los 12 equipos.',
    correcta: 'copiloto',
    porque:
      'Es una tarea con lógica clara y un resultado que se puede comprobar —como hiciste con la función del robot—. Ahí pedir ayuda ahorra tiempo de verdad.',
  },
  {
    id: 't-dedicatoria',
    texto: 'Escribir la dedicatoria para la maestra que asesoró al club.',
    correcta: 'tu',
    porque:
      'Es un mensaje personal: lo que importa es que suene a ti, no a una plantilla genérica. Pedirlo no ahorra nada aquí — lo cambia.',
  },
  {
    id: 't-mayusculas',
    texto: 'Cambiar «Feria de Ciencias 2026» a mayúsculas para el letrero de la entrada.',
    correcta: 'tu',
    porque: 'Ya lo viste al principio: una tarea que ya sabes hacer y toma un segundo no gana nada pidiéndosela al copiloto.',
  },
  {
    id: 't-borrador',
    texto: 'Armar un primer borrador del párrafo de bienvenida, que tú vas a revisar después.',
    correcta: 'copiloto',
    porque:
      'Un primer borrador para revisar es justo lo que hiciste con el párrafo del volante: pides, comparas contra los datos reales, y corriges lo que haga falta.',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 4 · La reflexión final (encargo 8) — elección múltiple sin copiloto.
// ───────────────────────────────────────────────────────────────────────────

export interface OpcionReflexion {
  id: string;
  etiqueta: string;
  correcta: boolean;
  /** Sólo se lee si es la incorrecta: por qué no. */
  porque?: string;
}

export const OPCIONES_REFLEXION: readonly OpcionReflexion[] = [
  {
    id: 'miente',
    etiqueta: 'Porque casi siempre miente a propósito para hacerte perder el tiempo.',
    correcta: false,
    porque:
      'No: el copiloto no miente a propósito. La función que dividía entre el número equivocado de robots no supo que se había equivocado — nadie le avisó.',
  },
  {
    id: 'verifica',
    etiqueta: 'Porque puede sonar segura o correr sin errores, y aun así traer un dato o un cálculo equivocado.',
    correcta: true,
  },
  {
    id: 'lento',
    etiqueta: 'Porque pedirle ayuda siempre es más lento que hacerlo tú mismo.',
    correcta: false,
    porque:
      'No siempre: la función del robot la conseguiste más rápido y con menos riesgo pidiéndosela. Lo lento fue pedir el título en mayúsculas, no la función.',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 5 · Las fichas y el guion del copiloto
// ───────────────────────────────────────────────────────────────────────────

export const FICHA_E0_PIDE = 'e0-pide';
export const FICHA_E1_PIDE = 'e1-pide';
export const FICHA_E3_PIDE = 'e3-pide';
export const FICHA_E4_PIDE = 'e4-pide';
export const FICHA_E5_PIDE = 'e5-pide';
export const FICHA_E6_PIDE = 'e6-pide';

const CODIGO_SIMPLE = 'def promedio(puntajes):\n    return sum(puntajes) / len(puntajes)';

const CODIGO_CON_BUG =
  'def promedio_validos(puntajes):\n' +
  '    validos = [p for p in puntajes if p != -1]\n' +
  '    return sum(validos) / len(puntajes)';

const CODIGO_ARREGLADO =
  'def promedio_validos(puntajes):\n' +
  '    validos = [p for p in puntajes if p != -1]\n' +
  '    return sum(validos) / len(validos)';

export const GUION_IA_COPILOTO: GuionAsistente = {
  respuestas: [
    { id: 'r-e0-pide', texto: 'FERIA DE CIENCIAS 2026' },
    { id: 'r-e1-pide', texto: `Aquí tienes una función simple:\n\n${CODIGO_SIMPLE}` },
    {
      id: 'r-e3-pide',
      texto: `Aquí tienes: ignora a los descalificados (puntaje -1) antes de promediar.\n\n${CODIGO_CON_BUG}`,
    },
    { id: 'r-e4-pide', texto: `Tienes razón, la reviso. Aquí está de nuevo:\n\n${CODIGO_ARREGLADO}` },
    {
      id: 'r-e5-pide',
      partes: [
        { id: 'p5-a', texto: '¡Qué gran día para el Club de Robótica! ' },
        {
          id: PARTE_FALSA_ID,
          texto: 'Los 5 equipos que participaron ganaron medalla',
          veracidad: 'falso',
          nota: 'La hoja de resultados dice 3, no 5.',
        },
        { id: 'p5-c', texto: ' en la Feria de Ciencias de este año. ¡Un logro para todo el club!' },
      ],
    },
    {
      id: 'r-e6-pide',
      texto:
        '¡Qué gran día para el Club de Robótica! Los 3 equipos que ganaron medalla hicieron un gran trabajo en la Feria de Ciencias de este año. ¡Un logro para todo el club!',
    },
  ],
  reglas: [
    { tipo: 'ficha', ficha: FICHA_E0_PIDE, responde: 'r-e0-pide' },
    { tipo: 'ficha', ficha: FICHA_E1_PIDE, responde: 'r-e1-pide' },
    { tipo: 'ficha', ficha: FICHA_E3_PIDE, responde: 'r-e3-pide' },
    { tipo: 'ficha', ficha: FICHA_E4_PIDE, responde: 'r-e4-pide' },
    { tipo: 'ficha', ficha: FICHA_E5_PIDE, responde: 'r-e5-pide' },
    { tipo: 'ficha', ficha: FICHA_E6_PIDE, responde: 'r-e6-pide' },
  ],
  porDefecto: { id: 'por-defecto', texto: 'No entendí esa petición. Usa los botones de abajo del chat.' },
};
