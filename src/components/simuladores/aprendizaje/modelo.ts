/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · `modelo.ts`
 * Los datos del banco de entrenamiento y todo lo que se puede decir de ellos
 * ANTES de entrenar nada.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Por qué este motor no se parece a ningún otro de la plataforma ─────────
 *
 * Un guion sabe la respuesta de antemano. Aquí **la respuesta la decide lo que
 * el alumno etiquetó**. Si enseña veinte gatos naranjas y ningún gato negro, la
 * máquina tiene que equivocarse con el gato negro, y equivocarse **por el
 * motivo correcto**, para que la clase pueda explicarlo. Ése es el contenido
 * de las cuatro actividades que este motor sirve:
 *
 *   · `n5-la-ia-aprende-con-datos`  etiquetar, entrenar, probar, y **ver fallar
 *                                   lo que no enseñó**.
 *   · `n7-como-aprende-la-ia`       el mismo banco con **datos torcidos a
 *                                   propósito** (`torcer`, en `examen.ts`).
 *   · `n8-sesgos-y-errores`         el sesgo **se ve en la salida**: acierto por
 *                                   grupo, no sólo el total (`brechaDe`).
 *   · `n10-como-funcionan-los-modelos`  qué aprende, **qué memoriza** y **dónde
 *                                   se rompe** (`informeDe`, en `arbol.ts`).
 *
 * De esas cuatro filas del canon salen las capacidades de este paquete, y de
 * ninguna otra parte. Lo que ninguna de las cuatro pide, no está escrito.
 *
 * ── Las tres decisiones de este archivo ───────────────────────────────────
 *
 * **1 · Los rasgos son de la actividad, no del motor.** El motor no sabe qué es
 * un gato ni qué es el color: recibe un `Esquema` con los rasgos que la clase
 * declara y los valores que cada uno admite. El motor sólo cuenta.
 *
 * **2 · Todo es categórico: valores con nombre, nunca números con umbral.** Un
 * árbol sobre números pregunta «¿el tamaño es mayor que 3,47?», y ese 3,47 no
 * se lo puede explicar nadie a un alumno de once años, porque no lo eligió él:
 * lo eligió una búsqueda de puntos de corte. Con valores con nombre la pregunta
 * es «¿es grande?», que es la misma pregunta que haría el alumno. Si algún día
 * hace falta un número, la actividad lo trae ya en cubetas —`pequeño`,
 * `mediano`, `grande`— y **la cubeta es parte de la lección**, no un detalle
 * escondido dentro del motor.
 *
 * **3 · Nada lanza.** Igual que en `formula/` y en `datos/`: los datos rotos
 * salen como dato (`revisar`, `examinar`), no como excepción. Un banco de
 * entrenamiento MAL HECHO es el material de clase de tres de las cuatro
 * actividades; si el motor se cayera con él, no habría clase.
 *
 * ── El aviso de los `Record` ──────────────────────────────────────────────
 *
 * Los `Record<string, number>` de este paquete son **bolsas de cuentas, no
 * listas ordenadas**: en JavaScript un objeto pone primero las claves que
 * parecen enteros, así que `{ '2020': 3, naranja: 7 }` se recorre empezando por
 * `2020` sin importar en qué orden se escribió. Donde el orden importa —las
 * ramas de una pregunta, el desempate de una mayoría— este paquete usa
 * **arrays** y el orden que declaró el esquema. Quien pinte una bolsa, que la
 * recorra leyendo el esquema.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El vocabulario
// ───────────────────────────────────────────────────────────────────────────

/**
 * El valor que toma un rasgo cuando el ejemplo no lo trae, o lo trae vacío.
 *
 * **Es un valor como cualquier otro**, y a propósito: así «no lo sé» puede
 * tener su propia rama en el árbol y el alumno ve que la falta de dato también
 * enseña algo. Lo que NO hace el motor es rellenarlo con la moda ni tirar el
 * ejemplo: las dos cosas esconden justo lo que hay que ver.
 */
export const SIN_DATO = '(sin dato)';

/** Un rasgo del banco: el nombre y los valores que la ACTIVIDAD admite. */
export interface Rasgo {
  /** Como se llama en los datos: `color`, `orejas`, `tamano`. */
  id: string;
  /** Como se lee en pantalla. Por omisión, el `id`. */
  etiqueta?: string;
  /**
   * Los valores que la actividad declara posibles.
   *
   * No es una validación: es **la lista contra la que se mide el hueco**. Un
   * valor declarado que no aparece en ningún ejemplo es `valoresNoVistos`, y
   * ésa es la mitad de `n8-sesgos-y-errores`.
   */
  valores: string[];
}

/** Lo que la actividad declara: con qué se describe una cosa y qué puede ser. */
export interface Esquema {
  rasgos: Rasgo[];
  /** Las etiquetas posibles. El ORDEN manda: con él se desempatan las mayorías. */
  etiquetas: string[];
}

/** Un ejemplo etiquetado por el alumno. */
export interface Ejemplo {
  /** Único en el banco. Sale en las explicaciones: por él se señala en pantalla. */
  id: string;
  rasgos: Readonly<Record<string, string>>;
  etiqueta: string;
}

/** Una pregunta ya contestada: «color = naranja». */
export interface Condicion {
  rasgo: string;
  valor: string;
}

/** Cuentas de una casilla: cuántos y cuántos acertó. */
export interface Marca {
  total: number;
  aciertos: number;
  /** `aciertos / total`. `0` si no hay nada que medir. */
  acierto: number;
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Leer un ejemplo
// ───────────────────────────────────────────────────────────────────────────

/**
 * El valor de un rasgo en unos datos, ya normalizado.
 *
 * Quita los espacios de los bordes —«naranja » y «naranja» son el mismo color
 * y nadie va a aprender nada de esa diferencia— pero **no toca las
 * mayúsculas**: «Naranja» y «naranja» siguen siendo dos valores distintos, el
 * examen de datos lo dice en voz alta (`quejas`) y ahí hay una clase entera
 * sobre limpiar datos. Juntarlos por lo bajo sería esconderla.
 */
export function valorDe(rasgos: Readonly<Record<string, string>>, rasgo: string): string {
  const v = rasgos[rasgo];
  if (typeof v !== 'string') return SIN_DATO;
  const limpio = v.trim();
  return limpio === '' ? SIN_DATO : limpio;
}

/** ¿Estos datos cumplen todas las condiciones de un camino del árbol? */
export function casaCamino(
  rasgos: Readonly<Record<string, string>>,
  camino: readonly Condicion[],
): boolean {
  for (const c of camino) {
    if (valorDe(rasgos, c.rasgo) !== c.valor) return false;
  }
  return true;
}

/**
 * Los ejemplos que sostienen un camino.
 *
 * **Es la función con la que se comprueba que una explicación no miente.** El
 * árbol dice «contesté gato porque los 5 ejemplos con orejas=si y color=naranja
 * eran gatos»; esta función, que no sabe nada del árbol, vuelve a buscar esos
 * ejemplos en el banco. Si las dos listas no son la misma, la explicación es
 * decorado. La prueba del motor lo comprueba para cada predicción de cada
 * conjunto, y el panel de la clase la usa para **encender en pantalla justo
 * esos ejemplos**.
 */
export function ejemplosQueCasan(
  ejemplos: readonly Ejemplo[],
  camino: readonly Condicion[],
): Ejemplo[] {
  return ejemplos.filter((e) => casaCamino(e.rasgos, camino));
}

/** Las etiquetas en orden de desempate: las del esquema y luego las intrusas. */
export function etiquetasEnOrden(esquema: Esquema, ejemplos: readonly Ejemplo[]): string[] {
  const orden = esquema.etiquetas.slice();
  const vistas = new Set(orden);
  const extras: string[] = [];
  for (const e of ejemplos) {
    if (!vistas.has(e.etiqueta)) {
      vistas.add(e.etiqueta);
      extras.push(e.etiqueta);
    }
  }
  extras.sort();
  return orden.concat(extras);
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · Las quejas: lo que se ve sin entrenar
// ───────────────────────────────────────────────────────────────────────────

/**
 * Las averías del banco que se pueden ver sin entrenar. Lista vacía = sano.
 *
 * Copiado de `validarGuion`: **un aviso escrito en un comentario no es una
 * medida**. Esto se puede llamar desde la prueba de una clase y desde el propio
 * panel, que es donde el alumno lo tiene que leer.
 *
 * Y ojo con lo que NO es una queja: que falten ejemplos de un grupo **no** es
 * un error. Es el material de `n8-sesgos-y-errores`, y sale por `examinar`,
 * como hecho, no como reproche.
 */
export function revisar(esquema: Esquema, ejemplos: readonly Ejemplo[]): string[] {
  const quejas: string[] = [];

  if (esquema.rasgos.length === 0) quejas.push('El esquema no declara ni un rasgo.');
  if (esquema.etiquetas.length === 0) quejas.push('El esquema no declara ni una etiqueta.');

  const rasgosVistos = new Set<string>();
  for (const r of esquema.rasgos) {
    if (rasgosVistos.has(r.id)) quejas.push(`Hay dos rasgos con el id «${r.id}».`);
    rasgosVistos.add(r.id);
    if (r.valores.length === 0) quejas.push(`El rasgo «${r.id}» no declara ni un valor posible.`);
    const valoresVistos = new Set<string>();
    for (const v of r.valores) {
      if (valoresVistos.has(v)) quejas.push(`El rasgo «${r.id}» declara dos veces el valor «${v}».`);
      valoresVistos.add(v);
    }
  }

  const etiquetasVistas = new Set<string>();
  for (const e of esquema.etiquetas) {
    if (etiquetasVistas.has(e)) quejas.push(`Hay dos etiquetas con el nombre «${e}».`);
    etiquetasVistas.add(e);
  }

  const ids = new Set<string>();
  for (const ej of ejemplos) {
    if (ids.has(ej.id)) quejas.push(`Hay dos ejemplos con el id «${ej.id}».`);
    ids.add(ej.id);

    if (!etiquetasVistas.has(ej.etiqueta)) {
      quejas.push(`El ejemplo «${ej.id}» lleva la etiqueta «${ej.etiqueta}», que el esquema no declara.`);
    }
    for (const clave of Object.keys(ej.rasgos)) {
      if (!rasgosVistos.has(clave)) {
        quejas.push(`El ejemplo «${ej.id}» trae el rasgo «${clave}», que el esquema no declara.`);
      }
    }
    for (const r of esquema.rasgos) {
      const valor = valorDe(ej.rasgos, r.id);
      if (valor === SIN_DATO) {
        quejas.push(`Al ejemplo «${ej.id}» le falta el rasgo «${r.id}».`);
      } else if (!r.valores.includes(valor)) {
        quejas.push(
          `El ejemplo «${ej.id}» dice «${r.id} = ${valor}», y el rasgo sólo declara: ${r.valores.join(', ')}.`,
        );
      }
    }
  }

  return quejas;
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · El examen de los datos: dónde está el hueco
// ───────────────────────────────────────────────────────────────────────────

/** Una combinación etiqueta × valor que el banco no ha visto nunca. */
export interface Hueco {
  rasgo: string;
  valor: string;
  etiqueta: string;
}

/** Un grupo de ejemplos con los mismos rasgos y etiquetas que se contradicen. */
export interface Contradiccion {
  rasgos: Readonly<Record<string, string>>;
  /** Cuántos hay de cada etiqueta. */
  etiquetas: Record<string, number>;
  ejemplos: string[];
}

export interface Auditoria {
  total: number;
  /** Cuántos ejemplos hay por etiqueta. Las declaradas salen aunque valgan 0. */
  porEtiqueta: Record<string, number>;
  /** rasgo → valor → cuántos. Los valores declarados salen aunque valgan 0. */
  porRasgo: Record<string, Record<string, number>>;
  /** rasgo → valor → etiqueta → cuántos. **Aquí se ve el hueco**. */
  cruce: Record<string, Record<string, Record<string, number>>>;
  /** Etiquetas declaradas sin un solo ejemplo. */
  etiquetasVacias: string[];
  /** Valores declarados que no aparecen en ningún ejemplo. */
  valoresNoVistos: Condicion[];
  /**
   * Combinaciones etiqueta × valor nunca vistas, **entre las que sí podrían
   * haberse visto**: el valor aparece en el banco y la etiqueta también, pero
   * nunca juntos. «Viste gatos, viste cosas negras, y nunca un gato negro.»
   */
  huecos: Hueco[];
  /** Rasgos que valen siempre lo mismo: no pueden decidir nada. */
  constantes: string[];
  /** Rasgos que por sí solos determinan la etiqueta en todo el banco. */
  decisivos: string[];
  /** Cuántos ejemplos repiten los rasgos de otro anterior. */
  duplicados: number;
  /** Mismos rasgos, etiquetas distintas: el banco se contradice. */
  contradicciones: Contradiccion[];
  quejas: string[];
}

/** Una clave estable para una combinación de rasgos. */
function claveDeRasgos(esquema: Esquema, ejemplo: Ejemplo): string {
  return esquema.rasgos.map((r) => `${r.id}=${valorDe(ejemplo.rasgos, r.id)}`).join('');
}

/**
 * Todo lo que el banco dice de sí mismo antes de entrenar: cuántos hay de cada
 * cosa, qué no ha visto nunca y dónde se contradice.
 *
 * Esto es el criterio «pocos ejemplos tiene que verse» hecho dato: con tres
 * ejemplos, `porEtiqueta` lo canta, `huecos` enumera lo que falta y `duplicados`
 * dice si esos tres eran de verdad tres.
 */
export function examinar(esquema: Esquema, ejemplos: readonly Ejemplo[]): Auditoria {
  const etiquetas = etiquetasEnOrden(esquema, ejemplos);

  const porEtiqueta: Record<string, number> = {};
  for (const e of etiquetas) porEtiqueta[e] = 0;
  for (const ej of ejemplos) porEtiqueta[ej.etiqueta] = (porEtiqueta[ej.etiqueta] ?? 0) + 1;

  const porRasgo: Record<string, Record<string, number>> = {};
  const cruce: Record<string, Record<string, Record<string, number>>> = {};

  for (const r of esquema.rasgos) {
    const cuentas: Record<string, number> = {};
    const cruz: Record<string, Record<string, number>> = {};
    for (const v of r.valores) {
      cuentas[v] = 0;
      cruz[v] = {};
      for (const e of etiquetas) cruz[v][e] = 0;
    }
    porRasgo[r.id] = cuentas;
    cruce[r.id] = cruz;
  }

  for (const ej of ejemplos) {
    for (const r of esquema.rasgos) {
      const v = valorDe(ej.rasgos, r.id);
      const cuentas = porRasgo[r.id];
      cuentas[v] = (cuentas[v] ?? 0) + 1;
      const cruz = cruce[r.id];
      if (!cruz[v]) {
        cruz[v] = {};
        for (const e of etiquetas) cruz[v][e] = 0;
      }
      cruz[v][ej.etiqueta] = (cruz[v][ej.etiqueta] ?? 0) + 1;
    }
  }

  const etiquetasVacias = etiquetas.filter((e) => (porEtiqueta[e] ?? 0) === 0);
  const etiquetasVivas = etiquetas.filter((e) => (porEtiqueta[e] ?? 0) > 0);

  const valoresNoVistos: Condicion[] = [];
  const huecos: Hueco[] = [];
  const constantes: string[] = [];
  const decisivos: string[] = [];

  for (const r of esquema.rasgos) {
    const cuentas = porRasgo[r.id];
    const vivos = Object.keys(cuentas).filter((v) => cuentas[v] > 0);

    for (const v of r.valores) {
      if ((cuentas[v] ?? 0) === 0) valoresNoVistos.push({ rasgo: r.id, valor: v });
    }
    for (const v of vivos) {
      for (const e of etiquetasVivas) {
        if ((cruce[r.id][v]?.[e] ?? 0) === 0) huecos.push({ rasgo: r.id, valor: v, etiqueta: e });
      }
    }

    if (ejemplos.length > 0 && vivos.length === 1) constantes.push(r.id);

    /*
     * «Decisivo» = por sí solo determina la etiqueta. Se exige que el rasgo
     * cambie (dos valores o más) y que haya dos etiquetas o más: si no, todo
     * rasgo de un banco de una sola etiqueta saldría decisivo y no habría dicho
     * nada. Un rasgo decisivo es una buena noticia y una mala a la vez: el
     * árbol lo va a preguntar el primero, y si en la vida real ese rasgo no
     * estuviera, el modelo no sabría hacer nada.
     */
    if (vivos.length >= 2 && etiquetasVivas.length >= 2) {
      const manda = vivos.every((v) => etiquetasVivas.filter((e) => (cruce[r.id][v]?.[e] ?? 0) > 0).length === 1);
      if (manda) decisivos.push(r.id);
    }
  }

  const porCombinacion = new Map<string, { rasgos: Readonly<Record<string, string>>; ejemplos: string[]; etiquetas: Record<string, number> }>();
  for (const ej of ejemplos) {
    const clave = claveDeRasgos(esquema, ej);
    let grupo = porCombinacion.get(clave);
    if (!grupo) {
      const rasgos: Record<string, string> = {};
      for (const r of esquema.rasgos) rasgos[r.id] = valorDe(ej.rasgos, r.id);
      grupo = { rasgos, ejemplos: [], etiquetas: {} };
      porCombinacion.set(clave, grupo);
    }
    grupo.ejemplos.push(ej.id);
    grupo.etiquetas[ej.etiqueta] = (grupo.etiquetas[ej.etiqueta] ?? 0) + 1;
  }

  const duplicados = ejemplos.length - porCombinacion.size;
  const contradicciones: Contradiccion[] = [];
  for (const grupo of porCombinacion.values()) {
    if (Object.keys(grupo.etiquetas).length >= 2) {
      contradicciones.push({ rasgos: grupo.rasgos, etiquetas: grupo.etiquetas, ejemplos: grupo.ejemplos });
    }
  }

  return {
    total: ejemplos.length,
    porEtiqueta,
    porRasgo,
    cruce,
    etiquetasVacias,
    valoresNoVistos,
    huecos,
    constantes,
    decisivos,
    duplicados,
    contradicciones,
    quejas: revisar(esquema, ejemplos),
  };
}
