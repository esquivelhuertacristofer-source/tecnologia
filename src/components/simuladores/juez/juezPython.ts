/**
 * El juez · `juezPython.ts` — corre el programa del alumno una vez por caso.
 *
 * Usa el intérprete real de Tecnia Código (`crearMaquina`/`ejecutar`), el mismo
 * que el alumno ve paso a paso en la ventana. **No hay un segundo intérprete
 * para juzgar**: si el juez aprobara con una máquina distinta de la que el
 * alumno depura, un caso podría pasar en la consola y fallar en el juez, y el
 * alumno aprendería que el juez miente.
 *
 * ── Cómo se llama a lo que el alumno escribió ────────────────────────────────
 *
 * Al final del programa, sin tocar ni una línea de arriba:
 *
 * ```
 * <todo lo del alumno, tal cual>
 * print("juez")
 * print(avanzan([78, 92, 65]))
 * ```
 *
 * Tres propiedades que salen gratis de hacerlo así y que no son obvias:
 *
 * 1. **Los números de línea de los errores siguen siendo los del editor.** Si
 *    el prólogo fuera arriba, «Línea 7» señalaría la línea 4 del alumno.
 * 2. **Lo que el alumno imprime por su cuenta queda ANTES de la marca.** Un
 *    `print` de depuración olvidado no tumba el caso: sale en `ruido`.
 * 3. **Un error dentro de la llamada del juez se distingue de un error del
 *    alumno** por el número de línea: si es mayor que las líneas del alumno, el
 *    tropiezo pasó en la llamada, y eso casi siempre significa una sola cosa —
 *    la función no existe o pide otros argumentos—, que es un veredicto mucho
 *    más útil que «NameError».
 *
 * ── El tope de pasos ────────────────────────────────────────────────────────
 *
 * `TOPES.PASOS` de fábrica es un millón, que en la ventana es correcto —ahí
 * hay un alumno mirando y puede pulsar ⏹—. Un juez corre seis casos seguidos
 * sin nadie mirando, así que baja el tope: un bucle infinito tiene que dar
 * veredicto en décimas, no en segundos. Y el veredicto es **«tu programa no
 * termina»**, nunca un error: en un concurso de verdad eso se llama «tiempo
 * excedido» y no es lo mismo que estar mal.
 */

import { ejecutar } from '../codigo/maquina';
import type { Maquina } from '../codigo/maquina';
import type { ErrorPy } from '../codigo/errores';
import {
  MARCA,
  explicarDiferencia,
  iguales,
  veredictoDe,
  type Caso,
  type Problema,
  type ResultadoCaso,
  type Veredicto,
} from './modelo';

/**
 * Cien mil pasos. Medido con los seis problemas de `n10-problemas-de-concurso`:
 * la solución más cara (`es_primo` probada con 999 983) gasta 3,1 millones… con
 * el método malo, y 6 400 con el bueno. Cien mil deja pasar cualquier solución
 * razonable de bachillerato y para un `while True:` en menos de 50 ms.
 */
export const PASOS_DEL_JUEZ = 100_000;

/** Cuántas líneas tiene el programa del alumno, para saber dónde empieza el juez. */
function lineasDe(fuente: string): number {
  return fuente.replace(/\r\n?/g, '\n').split('\n').length;
}

/** Lo que sale antes de la marca (ruido) y lo que sale después (respuesta). */
function partir(salida: string[]): { ruido: string[]; respuesta: string[]; llego: boolean } {
  const i = salida.indexOf(MARCA);
  if (i === -1) return { ruido: salida, respuesta: [], llego: false };
  return { ruido: salida.slice(0, i), respuesta: salida.slice(i + 1), llego: true };
}

/**
 * La explicación de un tropiezo, en las palabras del juez y no del intérprete.
 *
 * Un error en la llamada del juez —línea mayor que las del alumno— se traduce
 * a lo que de verdad pasó. Los demás se dan con el mensaje del intérprete, que
 * ya está escrito para un alumno y ya trae su pista.
 */
function explicarError(e: ErrorPy, lineasAlumno: number, firma: string): string {
  if (e.linea > lineasAlumno) {
    if (e.clase === 'nombre') {
      return `el juez llamó a «${firma}» y tu programa no la define con ese nombre`;
    }
    if (e.clase === 'tipo') {
      return `el juez llamó a «${firma}» y tu programa la definió con otros datos de entrada: ${e.mensaje}`;
    }
    return `el juez llamó a «${firma}» y eso falló: ${e.mensaje}`;
  }
  return `línea ${e.linea}: ${e.mensaje}`;
}

/** Un caso. Una ejecución. Un resultado. */
export function juzgarCaso(caso: Caso, fuente: string, firma: string): ResultadoCaso {
  const lineasAlumno = lineasDe(fuente);
  /* La marca va **cruda** dentro de las comillas y no como ``: medido el
   * 12-sep-2026 contra el léxico real, `print("")` imprime `u0001` —este
   * subconjunto sólo reconoce los escapes `\n`, `\t`, `\\` y `\"`—. Que no
   * reconozca `\u` es justo lo que vuelve la marca infalsificable: sin `chr()`
   * (que tampoco existe) y sin escape unicode, **no hay manera de teclearla**. */
  const conLlamada = `${fuente}\nprint("${MARCA}")\n${caso.llamada}\n`;

  let maq: Maquina;
  try {
    maq = ejecutar(conLlamada, { topes: { PASOS: PASOS_DEL_JUEZ } });
  } catch {
    /* El intérprete promete no lanzar (los errores salen como dato). Si algún
     * día rompe esa promesa, el juez da un veredicto y no tumba la pestaña. */
    return {
      nombre: caso.nombre,
      oculto: !!caso.oculto,
      clase: 'error',
      esperada: caso.esperada,
      obtenida: null,
      explicacion: 'el juez no pudo ejecutar tu programa',
      ruido: [],
    };
  }

  const { ruido, respuesta, llego } = partir(maq.salida);
  const base = { nombre: caso.nombre, oculto: !!caso.oculto, esperada: caso.esperada, ruido };

  if (maq.estado === 'esperando') {
    return {
      ...base,
      clase: 'pregunta',
      obtenida: respuesta,
      explicacion:
        'tu programa pide datos por teclado con «input» y el juez no puede contestarle: ' +
        'los datos de cada caso entran por los argumentos de la función',
    };
  }

  if (maq.estado === 'error' && maq.error) {
    const clase = maq.error.clase === 'limite' ? 'no-termina' : 'error';
    const suya = maq.error.linea > 0 && maq.error.linea <= lineasAlumno;
    return {
      ...base,
      clase,
      obtenida: respuesta,
      linea: suya ? maq.error.linea : undefined,
      explicacion:
        clase === 'no-termina'
          ? `tu programa pasó de ${PASOS_DEL_JUEZ.toLocaleString('es-MX')} pasos y no terminó`
          : explicarError(maq.error, lineasAlumno, firma),
    };
  }

  if (!llego) {
    /* Terminó sin llegar a la marca. Sólo puede pasar con un `exit` que este
     * subconjunto no tiene, o si la máquina se quedó a medias: se informa. */
    return { ...base, clase: 'error', obtenida: [], explicacion: 'tu programa terminó antes de que el juez pudiera llamarlo' };
  }

  if (iguales(respuesta, caso.esperada)) {
    return { ...base, clase: 'pasa', obtenida: respuesta, explicacion: 'pasa' };
  }

  return {
    ...base,
    clase: 'falla',
    obtenida: respuesta,
    explicacion: explicarDiferencia(respuesta, caso.esperada),
  };
}

/**
 * Correr el programa del alumno con un añadido y devolver **sólo lo que ese
 * añadido imprimió**, sin juzgarlo contra nada.
 *
 * Existe para los encargos que no son «resuelve esto» sino «demuéstrame algo»:
 * el de `n10-problemas-de-concurso` pega debajo una versión ROTA de la función
 * y le pide al alumno un caso en el que las dos contesten distinto. Ahí no hay
 * salida esperada —la escribe él— y por eso no es un `Caso`.
 *
 * Mismo trato que en `juzgarCaso` con el ruido y con la marca.
 */
export function salidaDe(fuente: string, anadido: string): { ok: boolean; lineas: string[]; porque: string } {
  const conAnadido = `${fuente}\nprint("${MARCA}")\n${anadido}\n`;
  let maq: Maquina;
  try {
    maq = ejecutar(conAnadido, { topes: { PASOS: PASOS_DEL_JUEZ } });
  } catch {
    return { ok: false, lineas: [], porque: 'no se pudo ejecutar' };
  }
  const { respuesta, llego } = partir(maq.salida);
  if (maq.estado === 'esperando') return { ok: false, lineas: respuesta, porque: 'pide datos por teclado' };
  if (maq.estado === 'error' && maq.error) {
    return {
      ok: false,
      lineas: respuesta,
      porque: maq.error.clase === 'limite' ? 'no termina' : `línea ${maq.error.linea}: ${maq.error.mensaje}`,
    };
  }
  if (!llego) return { ok: false, lineas: [], porque: 'terminó antes de tiempo' };
  return { ok: true, lineas: respuesta, porque: '' };
}

/**
 * El problema entero.
 *
 * Se corren **todos** los casos y no se para en el primero que falla, a
 * propósito: «3 de 6» le dice al alumno que va por buen camino y «0 de 6» que
 * el camino es otro. Un juez que se para en el primer fallo esconde esa
 * diferencia, que es justo la que decide si vuelve a intentarlo.
 */
export function juzgar(problema: Problema, fuente: string): Veredicto {
  return veredictoDe(
    problema.id,
    problema.casos.map((c) => juzgarCaso(c, fuente, problema.firma)),
  );
}
