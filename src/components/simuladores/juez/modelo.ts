/**
 * El juez · `modelo.ts` — el problema, los casos y el veredicto.
 *
 * Ni una línea de React y ni una línea de intérprete: aquí vive **qué es un
 * problema de concurso** y **cómo se comparan dos salidas**, que es lo único
 * que los dos jueces (Python y SQL) tienen en común.
 *
 * ── De dónde viene ────────────────────────────────────────────────────────────
 *
 * De la auditoría del 12-sep-2026 (`ROBUSTECIMIENTO-SECUNDARIA-Y-BACHILLERATO.md`):
 * de los 71 laboratorios de N7–N10, **14 dictan la solución en el enunciado** y
 * después comprueban con una expresión regular sobre el texto del alumno. El
 * caso estrella es `n10-problemas-de-concurso`: se llama concurso y el
 * enunciado del primer problema dice literalmente `avanzan = avanzan + 1`.
 *
 * La regla 2 del estándar de secundaria (§4 del mismo documento) es la que este
 * paquete hace posible: **enunciado + casos visibles y ocultos + tres pistas en
 * escalera, nunca la solución**.
 *
 * ── Las cuatro decisiones de modelo, y por qué ───────────────────────────────
 *
 * **1. La salida esperada es LITERAL.** `esperada: ['5']`, no una función que la
 * calcule. En el momento en que el juez tiene una solución de referencia, esa
 * solución está en el código fuente que se le sirve al navegador del alumno, y
 * el problema se resuelve con Ctrl+U. Un literal no se puede leer al revés.
 *
 * **2. Hay casos OCULTOS y el modelo los tacha él mismo.** `redactar()` deja
 * `esperada` y `obtenida` en `null` antes de que el veredicto salga de aquí, de
 * modo que **ningún panel puede filtrarlos por descuido**: no es una regla de
 * pintado, es una propiedad del dato. Los ocultos son lo que distingue un juez
 * de un verificador: con sólo casos visibles, escribir `return 5` aprueba.
 *
 * **3. El juez compara LÍNEAS, no un chorro de texto.** Porque el veredicto
 * tiene que poder decirse en voz alta a un alumno de 16 años: «sobra una
 * línea», «la línea 2 dice 7 y tenía que decir 5». Un `diff` de cadenas larga
 * no se puede leer; una línea concreta sí.
 *
 * **4. Lo que el programa imprime por su cuenta NO cuenta, pero se ve.** El
 * juez mete una marca, llama a la función del alumno y compara sólo lo que sale
 * **después** de la marca. Los `print` de depuración que el alumno dejó puestos
 * salen en `ruido` —para que los vea y los quite— pero no tumban el caso. Un
 * juez que suspende por una línea de depuración enseña a no depurar.
 */

/* ── La marca ───────────────────────────────────────────────────────────────*/

/**
 * La línea que el juez imprime antes de llamar a lo del alumno.
 *
 * Lleva caracteres de control a propósito: no es que sea improbable que un
 * alumno la escriba, es que **no puede** escribirla con el teclado. Si se
 * eligiera algo como `---JUEZ---`, un alumno que imprimiera eso movería la
 * frontera y el juez leería su depuración como respuesta.
 */
export const MARCA = 'juez';

/* ── El problema ────────────────────────────────────────────────────────────*/

/** Un caso de prueba de un problema de Python. */
export interface Caso {
  /**
   * Cómo se llama este caso en el panel. Los ocultos también lo tienen y
   * también se ve: «no se puede terminar» no enseña nada, «números pequeños»
   * sí. Es la diferencia entre un juez y una pared.
   */
  nombre: string;
  /**
   * El código que el juez **añade al final** del programa del alumno para
   * llamar a lo que escribió. Va sin sangría, después de la marca.
   *
   * Se añade al final y nunca al principio por una razón concreta: así los
   * números de línea de los errores del alumno siguen siendo los de su
   * editor. Un juez que corre los renglones miente al señalar el fallo.
   */
  llamada: string;
  /** Las líneas exactas que esa llamada tiene que imprimir. Literales (decisión 1). */
  esperada: string[];
  /** Un caso oculto informa sólo pasa/falla. Nunca su llamada ni su salida. */
  oculto?: boolean;
}

export interface Problema {
  id: string;
  titulo: string;
  /** Qué hay que conseguir. **Nunca cómo**: ni bucles, ni nombres de variable. */
  enunciado: string;
  /**
   * La firma que el juez va a llamar, tal cual. No es una pista: es el contrato.
   * Sin ella el alumno tendría que adivinar el nombre y el orden de los
   * argumentos, que es lo único de un problema de concurso que sí se regala.
   */
  firma: string;
  casos: Caso[];
  /**
   * Tres, en escalera: la primera reencuadra, la segunda señala el sitio, la
   * tercera **cuesta puntos** y dice el método. Nunca el código.
   */
  pistas: readonly [string, string, string];
}

/* ── El veredicto ───────────────────────────────────────────────────────────*/

export type ClaseCaso =
  /** La salida es la esperada, línea por línea. */
  | 'pasa'
  /** Terminó y contestó otra cosa. */
  | 'falla'
  /** Se tropezó: nombre, tipo, índice… El programa no llegó a contestar. */
  | 'error'
  /** Gastó el tope de pasos. En un concurso de verdad esto se llama TLE. */
  | 'no-termina'
  /** Pidió un `input()` que un juez no puede contestar. */
  | 'pregunta'
  /**
   * Juez de programas (§68.4): pidió más datos por teclado de los que trae el
   * caso. No es «no termina» —el programa está esperando, no dando vueltas— y
   * no es «pregunta» —ahí el `input` sobraba entero; aquí sobra uno—.
   */
  | 'pide-de-mas';

export interface ResultadoCaso {
  nombre: string;
  oculto: boolean;
  clase: ClaseCaso;
  /** `null` **siempre** en los ocultos (decisión 2). */
  esperada: string[] | null;
  obtenida: string[] | null;
  /** Una frase que se le puede decir a un alumno de 16 años. Nunca «AssertionError». */
  explicacion: string;
  /** Lo que el programa imprimió por su cuenta, antes de la marca. Informativo. */
  ruido: string[];
  /**
   * La línea del editor a la que hay que ir, cuando el tropiezo tiene una.
   * `undefined` si no la tiene o si el tropiezo pasó en la llamada del juez,
   * que no es una línea del alumno y llevarle el cursor ahí sería mentirle.
   */
  linea?: number;
  /**
   * La explicación no lleva ningún dato del caso y se puede enseñar aunque el
   * caso esté oculto (M4). Sólo la pone el juez de programas cuando su propio
   * programa de prueba no encuentra lo que el enunciado dice que el módulo
   * tiene —«clima no tiene ninguna clasifica»—: eso es el contrato, que ya está
   * escrito arriba, y «se tropieza» a secas deja al alumno sin lo único que
   * necesita saber.
   */
  publica?: boolean;
}

export interface Veredicto {
  problemaId: string;
  casos: ResultadoCaso[];
  pasados: number;
  total: number;
  /** Todos los casos, visibles y ocultos. Es lo único que da el problema por hecho. */
  aceptado: boolean;
  /** Cuántos casos ocultos había. Se enseña: «5 de 6 · 1 caso oculto falló». */
  ocultos: number;
}

/* ── La comparación ─────────────────────────────────────────────────────────*/

/**
 * Se le quita el blanco de la derecha a cada línea y se tiran las líneas vacías
 * del final.
 *
 * Las dos son lo que hace cualquier juez de concurso y las dos se pueden
 * explicar: un espacio al final de una línea no se ve en pantalla, y un salto
 * de línea de más al final tampoco. Lo que **no** se normaliza es nada de
 * dentro de la línea: `5` y ` 5` son respuestas distintas y el alumno tiene que
 * poder verlo.
 */
export function normalizar(lineas: string[]): string[] {
  const limpias = lineas.map((l) => l.replace(/[ \t]+$/, ''));
  while (limpias.length > 0 && limpias[limpias.length - 1] === '') limpias.pop();
  return limpias;
}

/**
 * La frase del veredicto cuando la salida no cuadra.
 *
 * El orden de las preguntas es el orden en que un profesor las haría: primero
 * «¿imprimiste algo?», después «¿cuántas líneas?» y sólo al final «¿qué dice la
 * línea que no cuadra?». La primera línea distinta se nombra por su número,
 * porque es la que hay que ir a mirar.
 */
export function explicarDiferencia(obtenida: string[], esperada: string[]): string {
  const a = normalizar(obtenida);
  const b = normalizar(esperada);

  if (a.length === 0 && b.length > 0) {
    return b.length === 1
      ? 'tu programa no imprimió nada, y este caso esperaba una línea'
      : `tu programa no imprimió nada, y este caso esperaba ${b.length} líneas`;
  }

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      const donde = a.length === 1 && b.length === 1 ? 'la respuesta' : `la línea ${i + 1}`;
      return `${donde} dice «${a[i]}» y tenía que decir «${b[i]}»`;
    }
  }

  if (a.length > b.length) {
    const sobran = a.length - b.length;
    return sobran === 1
      ? `sobra una línea al final: «${a[b.length]}»`
      : `sobran ${sobran} líneas al final, empezando por «${a[b.length]}»`;
  }
  if (a.length < b.length) {
    const faltan = b.length - a.length;
    return faltan === 1 ? 'falta la última línea' : `faltan ${faltan} líneas`;
  }
  return 'la salida no cuadra';
}

export function iguales(obtenida: string[], esperada: string[]): boolean {
  const a = normalizar(obtenida);
  const b = normalizar(esperada);
  return a.length === b.length && a.every((l, i) => l === b[i]);
}

/* ── El tachado ─────────────────────────────────────────────────────────────*/

/**
 * Deja el resultado listo para salir del juez.
 *
 * De un caso oculto se borran `esperada`, `obtenida` y el ruido, y la
 * explicación se cambia por una que no filtre el dato. Se hace **aquí** y no en
 * el panel para que sea imposible equivocarse: lo que no está en el objeto no
 * se puede pintar.
 */
export function redactar(r: ResultadoCaso): ResultadoCaso {
  if (!r.oculto) return r;
  return {
    ...r,
    esperada: null,
    obtenida: null,
    ruido: [],
    linea: r.linea,
    explicacion: r.publica ? r.explicacion : EXPLICACION_OCULTA[r.clase],
  };
}

const EXPLICACION_OCULTA: Readonly<Record<ClaseCaso, string>> = {
  pasa: 'pasa',
  falla: 'con estos datos tu programa contesta otra cosa',
  error: 'con estos datos tu programa se tropieza',
  'no-termina': 'con estos datos tu programa no termina',
  pregunta: 'tu programa pide datos por teclado y un juez no puede contestarle',
  'pide-de-mas': 'con estos datos tu programa pide más datos de los que hay',
};

/* ── El recuento ────────────────────────────────────────────────────────────*/

export function veredictoDe(problemaId: string, casos: ResultadoCaso[]): Veredicto {
  const tachados = casos.map(redactar);
  const pasados = tachados.filter((c) => c.clase === 'pasa').length;
  return {
    problemaId,
    casos: tachados,
    pasados,
    total: tachados.length,
    aceptado: tachados.length > 0 && pasados === tachados.length,
    ocultos: tachados.filter((c) => c.oculto).length,
  };
}

/* ── La revisión del problema ───────────────────────────────────────────────*/

/**
 * ¿Este problema está bien escrito? Devuelve la lista de quejas; vacía = bien.
 *
 * Existe porque la trampa que este paquete viene a tapar se puede volver a
 * abrir **al escribir la clase**, no al escribir el motor: un problema con
 * casos sólo visibles vuelve a ser un ejercicio que se aprueba copiando la
 * respuesta. Es la versión de contenido de `trampas-de-jsdom`: la prueba verde
 * y vacía. Cada clase que use el juez llama a esto en su propia prueba de Jest
 * y exige lista vacía.
 */
export function revisarProblema(p: Problema): string[] {
  const quejas: string[] = [];
  if (p.casos.length < 3) quejas.push(`${p.id}: menos de 3 casos (${p.casos.length})`);
  if (!p.casos.some((c) => c.oculto)) quejas.push(`${p.id}: no tiene ningún caso oculto`);
  if (!p.casos.some((c) => !c.oculto)) quejas.push(`${p.id}: no tiene ningún caso visible`);
  if (p.casos.some((c) => c.esperada.length === 0)) quejas.push(`${p.id}: hay un caso sin salida esperada`);
  if (p.casos.some((c) => !c.llamada.trim())) quejas.push(`${p.id}: hay un caso sin llamada`);
  if (!p.firma.trim()) quejas.push(`${p.id}: no declara la firma que el juez va a llamar`);
  if (p.pistas.some((x) => !x.trim())) quejas.push(`${p.id}: hay una pista vacía`);

  const llamadas = new Set(p.casos.map((c) => c.llamada.trim()));
  if (llamadas.size !== p.casos.length) quejas.push(`${p.id}: dos casos hacen la misma llamada`);

  const nombres = new Set(p.casos.map((c) => c.nombre.trim()));
  if (nombres.size !== p.casos.length) quejas.push(`${p.id}: dos casos se llaman igual`);

  /* El enunciado no puede llevar la solución dentro. No se puede comprobar de
   * verdad —es prosa— pero sí las tres formas concretas en que los 14
   * laboratorios dictados la llevaban: una asignación, un `for` o un `if`
   * escritos como código dentro del texto. */
  if (/\b(for|while|if|elif)\b\s+\S+\s*:/.test(p.enunciado) || /\w+\s*=\s*\w+\s*[+\-*/]/.test(p.enunciado)) {
    quejas.push(`${p.id}: el enunciado lleva código dentro (eso es dictar la solución)`);
  }

  return quejas;
}
