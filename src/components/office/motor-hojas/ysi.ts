/**
 * Tecnia Hojas · `ysi.ts` — el análisis «Y si»: **buscar objetivo** y
 * **escenarios** (bloque 57 del temario, §45.2, grado Avanzado).
 *
 * Es la única pieza de toda la sala que hace correr el motor **hacia atrás**. En
 * las otras veintidós clases el alumno escribe una regla y la hoja enseña el
 * resultado; aquí escribe el resultado y la hoja tiene que averiguar el dato. No
 * hay álgebra que valga —una hoja de cálculo no sabe despejar `SUMA`, ni
 * `BUSCARX`, ni un `SI` anidado—: **se prueba, se mide y se corrige**, que es
 * exactamente lo que hace Excel y lo que esta clase enseña.
 *
 * ── Las cuatro decisiones de este archivo ───────────────────────────────────
 *
 * **(1) El criterio de «ya llegó» es el que ve el alumno.** No hay una
 * tolerancia inventada aquí abajo —ni un `< 0.001`, ni un épsilon— porque la
 * anti-regla del §46.2 manda también hacia atrás: *dos números son iguales si la
 * hoja los enseña iguales*. Se llega cuando `mostrar(valorActual, formato)` y
 * `mostrar(objetivo, formato)` son la misma cadena, **con el formato de la celda
 * objetivo**, que es lo que el alumno tiene delante. En una celda sin formato eso
 * son los 15 dígitos significativos de `textoDeNumero` —la precisión que el
 * propio programa exhibe—; en una celda de moneda con dos decimales, dos
 * decimales. Un épsilon nuestro aprobaría una hoja mal hecha o rechazaría una
 * bien hecha; esto no puede hacer ni lo uno ni lo otro, porque pregunta por lo
 * único que el alumno puede ver y corregir.
 *
 * **(2) Correr el motor cien veces no ensucia el libro.** Cada tanteo escribe el
 * número en una **copia** del libro y la calcula en un motor de usar y tirar
 * (`crearMotor`, el mismo camino que ya usaba `pegar` para congelar valores). El
 * libro de verdad no se toca ni una vez durante la búsqueda: sólo el resultado
 * final entra, y entra por `ejecutarVarios` como un gesto más. **Si no se
 * converge, el libro queda siendo el mismo objeto**, no uno igual.
 *
 * Y el tanteo escribe el crudo, no el número: `escribir` es la misma función que
 * usará el comando al final, inyectada. Si el tanteo escribiera de otra manera
 * que la escritura final, se podría encontrar un valor que después no da lo
 * mismo al escribirlo de verdad — y eso no se vería, porque el número estaría
 * ahí puesto.
 *
 * **(3) Las formas de fallar son material de clase, no un `null`.** Buscar
 * objetivo falla de tres maneras y las tres se enseñan distintas:
 *
 *   · **la celda objetivo no es una fórmula** — no hay nada que buscar;
 *   · **la celda que se mueve no afecta a la objetivo** — el error número uno del
 *     alumno, y se caza **antes de iterar**, leyendo el grafo que el motor ya
 *     tiene, en vez de gastar cien tanteos para descubrir que ninguno movía nada;
 *   · **no converge** — la relación no es monótona o el objetivo es inalcanzable
 *     («que un cuadrado valga −10»). Entonces **se dice**; no se devuelve el
 *     último intento fingiendo que es la respuesta.
 *
 * Y dos guardas de entrada que Excel también enseña en su cuadro de diálogo: la
 * celda que se mueve tiene que guardar **un número escrito a mano** (una fórmula
 * no se puede mover: la mueve su propia regla) y las direcciones tienen que
 * existir.
 *
 * **(4) Un escenario guarda crudos y se aplica de una sola vez.** Ver
 * `Escenario` en `modelo.ts`. Aplicarlo son N escrituras dentro de **un** gesto,
 * así que el recálculo es uno solo y el deshacer devuelve el escenario entero de
 * una — que es justo lo que `ejecutarVarios` regala.
 *
 * ── El método, y por qué éste ───────────────────────────────────────────────
 *
 * **Secante con bisección de respaldo**, techo de 100 tanteos (el de Excel).
 *
 * La secante traza la recta entre los dos últimos tanteos y salta a donde esa
 * recta corta el objetivo. En una hoja de cálculo eso es casi siempre la
 * respuesta exacta **al primer salto**, porque la inmensa mayoría de las
 * relaciones de una hoja son lineales en el dato que se mueve: una suma, un
 * porcentaje, un precio por una cantidad. Newton necesitaría la derivada —que
 * aquí no existe— y la bisección sola necesitaría un intervalo de partida que
 * nadie ha dado y tardaría cincuenta vueltas donde la secante tarda una.
 *
 * La bisección entra **de respaldo**, y hace falta: en cuanto hay dos tanteos
 * con el objetivo en medio (uno se queda corto y otro se pasa) hay una solución
 * atrapada entre ellos, y desde ahí **la secante no puede salirse del cerco**;
 * si su salto cae fuera, o si el cerco no se está partiendo por la mitad, se
 * parte a la mitad a mano. Sin ese cerco, una secante sobre una curva con poca
 * pendiente se dispara a un número absurdo y no vuelve.
 *
 * Dos casos que están escritos a propósito y que la clase va a usar:
 *
 *   · **Un tanteo puede no dar número.** Probar un 0 en un divisor da `#¡DIV/0!`.
 *     Eso no es un fallo de la búsqueda: es un valor que la hoja enseña
 *     (decisión 2 del §46.1). Se retrocede a medio camino del último tanteo que
 *     sí dio número y se sigue.
 *   · **Una relación puede tener dos soluciones.** `=B1*B1` vale 9 con 3 y con
 *     −3, y buscar objetivo encuentra **la que está del lado de donde arrancas**,
 *     igual que Excel. No es una limitación que haya que esconder: es la clase.
 */

import {
  celdaEn,
  clave,
  dirAColFila,
  esError,
  hojaDe,
  partirClave,
  textoDeNumero,
  type Clave,
  type Escenario,
  type Formato,
  type Libro,
} from './modelo';
import { esFormula } from './formula/lexico';
import { crearMotor, precedentesDe, valorDeClave, valorDeTextoCrudo, type Motor } from './formula/calculo';
import { mostrar } from './formatos';
import type { Contexto } from './formula/funciones';

/* ── el método numérico, sin saber que existen las hojas ────────────────────*/

/**
 * Cuántas veces se corre el motor como mucho. **Son las 100 de Excel**, y el
 * número está copiado a conciencia: es lo que el alumno leerá en el cuadro de
 * «Opciones de cálculo» del programa de verdad.
 */
export const TECHO_DE_TANTEOS = 100;

/** Lo que devuelve un tanteo: o la celda enseñó un número, o hay que decir qué enseñó. */
export type Tanteo = { ok: true; v: number } | { ok: false; motivo: string };

interface Punto {
  /** El valor que se probó en la celda que se mueve. */
  x: number;
  /** Lo que enseñó la celda objetivo. */
  v: number;
  /** Lo que sobra o falta para el objetivo. Su signo es lo único que se mira. */
  y: number;
}

export interface Camino {
  /** El valor que hizo que la celda enseñara el objetivo. `null` si no se llegó. */
  x: number | null;
  /** Lo que enseñaba la celda objetivo al llegar. */
  v: number | null;
  /** Cuántas veces se corrió el motor. Es la cifra que la clase enseña. */
  tanteos: number;
  /** Lo más cerca que se estuvo, para poder decirlo cuando no se llega. */
  mejor: Punto | null;
  /** Lo que dijo el último tanteo que no dio un número: `#¡DIV/0!`, por ejemplo. */
  fallo: string | null;
}

/**
 * Busca el `x` que hace que `probar(x)` enseñe algo que `llego()` acepte.
 *
 * No sabe de libros ni de celdas a propósito: así el método se puede probar
 * contra una función de papel —una recta, una parábola— y ver que converge sin
 * montar media hoja de cálculo alrededor. `objetivo` sólo se usa para el signo
 * (¿me quedo corto o me paso?); **quien decide si se ha llegado es `llego`**, que
 * es donde vive la regla del §46.2 y donde no hay ninguna tolerancia.
 */
export function resolverPorSecante(
  probar: (x: number) => Tanteo,
  llego: (v: number) => boolean,
  objetivo: number,
  desde: number,
  techo: number = TECHO_DE_TANTEOS,
): Camino {
  let tanteos = 0;
  let fallo: string | null = null;
  let mejor: Punto | null = null;

  /** El anterior y el actual: los dos puntos con los que se traza la recta. */
  let a: Punto | null = null;
  let b: Punto | null = null;
  /** El cerco: un tanteo que se queda corto y otro que se pasa. */
  let corto: Punto | null = null;
  let pasado: Punto | null = null;
  let ancho = Infinity;

  /*
   * El primer paso de exploración: la mitad de donde se está. En una relación
   * lineal —o sea, casi siempre— da igual cuánto sea, porque la recta que se
   * traza con él es la relación entera y el salto siguiente ya es la respuesta.
   * Sólo importa cuando la relación es curva, y ahí un paso generoso abre más
   * terreno que uno tímido. Con la celda en cero no hay «mitad de nada», y el 1
   * es el paso más pequeño con el que un alumno escribe.
   */
  let paso = desde === 0 ? 1 : Math.abs(desde) / 2;
  let direccion = 1;

  const medir = (x: number): Punto | null => {
    tanteos += 1;
    const t = probar(x);
    if (!t.ok) {
      fallo = t.motivo;
      return null;
    }
    if (!Number.isFinite(t.v)) {
      fallo = '#¡NUM!';
      return null;
    }
    const p: Punto = { x, v: t.v, y: t.v - objetivo };
    if (!mejor || Math.abs(p.y) < Math.abs(mejor.y)) mejor = p;
    return p;
  };

  /** Donde la recta entre los dos últimos tanteos corta el objetivo. */
  const secante = (): number => {
    if (!a || !b || a.y === b.y) return NaN;
    return b.x - b.y * ((b.x - a.x) / (b.y - a.y));
  };

  const siguiente = (): number => {
    const actual = b as Punto;
    // Con un solo tanteo no hay recta que trazar: se da el paso de exploración.
    if (!a) return actual.x + paso;

    // Hacia dónde se estaba acercando, por si hay que abrir terreno.
    const d = Math.sign(actual.x - a.x) || 1;
    direccion = Math.abs(actual.y) <= Math.abs(a.y) ? d : -d;

    const c = secante();
    const izq = corto;
    const der = pasado;
    if (izq && der) {
      const min = Math.min(izq.x, der.x);
      const max = Math.max(izq.x, der.x);
      const anchoAhora = max - min;
      /*
       * La regla de Brent, y hace falta: una secante puede acercarse a un
       * extremo del cerco a pasos cada vez más chicos y no terminar nunca. Si el
       * cerco no se ha partido por la mitad desde hace dos pasos, se parte a
       * mano. El `/2` no es una tolerancia: es «la mitad», que es lo que una
       * bisección garantiza.
       */
      const perezosa = anchoAhora >= ancho / 2;
      ancho = anchoAhora;
      // Y **nunca** se sale del cerco: dentro hay solución y fuera no se sabe.
      return Number.isFinite(c) && c > min && c < max && !perezosa ? c : (izq.x + der.x) / 2;
    }
    if (Number.isFinite(c) && c !== actual.x) return c;
    // La recta no dice nada (dos tanteos con el mismo valor: la relación está
    // plana por aquí). Se abre terreno al doble hacia donde se iba mejorando.
    paso *= 2;
    return actual.x + paso * direccion;
  };

  const retroceso = (x: number): number => {
    // El tanteo no dio número (`#¡DIV/0!`, un texto, un infinito). De él sólo se
    // sabe que no sirve: se vuelve a medio camino del último que sí sirvió.
    if (b) return (x + b.x) / 2;
    // Ni el valor de partida sirve: se prueba al otro lado, cada vez más lejos.
    paso *= 2;
    direccion = -direccion;
    return desde + paso * direccion;
  };

  let x = desde;
  while (tanteos < techo) {
    const p = medir(x);
    if (!p) {
      const r = retroceso(x);
      if (!Number.isFinite(r) || r === x) break;
      x = r;
      continue;
    }
    if (llego(p.v)) return { x: p.x, v: p.v, tanteos, mejor, fallo: null };
    a = b;
    b = p;
    if (p.y < 0) corto = p;
    else pasado = p;
    const r = siguiente();
    if (!Number.isFinite(r) || r === x) break;
    x = r;
  }
  return { x: null, v: null, tanteos, mejor, fallo };
}

/* ── buscar objetivo, ya con el libro delante ───────────────────────────────*/

/** «Quiero que **B10** valga **5000** cambiando **B3**». */
export interface PeticionObjetivo {
  hoja: string;
  /** La celda que tiene que valer lo que se pide. Tiene que ser una fórmula. */
  objetivo: string;
  valor: number;
  /** La celda que se puede mover. Tiene que guardar un número, no una regla. */
  cambiando: string;
  /**
   * El reloj, para un libro con `=HOY()`. Viaja en el gesto por la misma razón
   * que en `pegar`: una macro reproducida no puede depender del día en que se
   * reproduzca.
   */
  ahora?: number;
}

/**
 * Las cinco respuestas, **distinguidas**. Un `null` obligaría a la clase a
 * adivinar por qué falló, y el porqué es justamente lo que se enseña.
 */
export type ResultadoObjetivo =
  | { estado: 'encontrado'; x: number; crudo: string; valor: number; tanteos: number }
  | { estado: 'sin-formula'; mensaje: string }
  | { estado: 'no-influye'; mensaje: string }
  | { estado: 'origen-no-numero'; mensaje: string }
  | { estado: 'mal-escrito'; mensaje: string }
  | { estado: 'no-converge'; mensaje: string; tanteos: number; mejor: number | null };

/** Escribe un crudo en la celda que se mueve. Lo inyecta quien tiene el comando. */
export type Escritor = (libro: Libro, crudo: string) => Libro;

/** ¿Entra `origen` en la cuenta de `destino`, aunque sea a través de otras celdas? */
export function influyeEn(motor: Motor, origen: Clave, destino: Clave): boolean {
  const vistas = new Set<Clave>([destino]);
  const pila: Clave[] = [destino];
  while (pila.length) {
    const k = pila.pop() as Clave;
    for (const p of precedentesDe(motor, k)) {
      if (p === origen) return true;
      if (!vistas.has(p)) {
        vistas.add(p);
        pila.push(p);
      }
    }
  }
  return false;
}

/**
 * La última búsqueda, guardada.
 *
 * `revisar()` y `aplicar()` de un mismo gesto preguntan lo mismo sobre el mismo
 * libro —uno para decidir si se puede y otro para escribir el resultado—, y sin
 * esto la búsqueda se haría dos veces: hasta doscientas corridas del motor por
 * pulsar un botón. Es la caché de una función pura, con la identidad del libro y
 * la petición entera como llave, así que vaciarla sólo puede costar tiempo,
 * nunca cambiar una respuesta. El escritor no entra en la llave porque se deriva
 * de la propia petición.
 */
let ultima: { libro: Libro; firma: string; resultado: ResultadoObjetivo } | null = null;

/** Para las pruebas y para quien quiera medir de verdad cuánto cuesta una búsqueda. */
export function olvidarUltimaBusqueda(): void {
  ultima = null;
}

export function resolverObjetivo(libro: Libro, p: PeticionObjetivo, escribir: Escritor): ResultadoObjetivo {
  const firma = `${p.hoja}|${p.objetivo}|${p.valor}|${p.cambiando}|${p.ahora ?? ''}`;
  if (ultima && ultima.libro === libro && ultima.firma === firma) return ultima.resultado;
  const resultado = buscar(libro, p, escribir);
  ultima = { libro, firma, resultado };
  return resultado;
}

function buscar(libro: Libro, p: PeticionObjetivo, escribir: Escritor): ResultadoObjetivo {
  const hoja = hojaDe(libro, p.hoja);
  if (!hoja) return { estado: 'mal-escrito', mensaje: 'esa hoja no existe' };

  const destino = dirAColFila(p.objetivo);
  if (!destino) return { estado: 'mal-escrito', mensaje: `«${p.objetivo}» no es una celda` };
  const movil = dirAColFila(p.cambiando);
  if (!movil) return { estado: 'mal-escrito', mensaje: `«${p.cambiando}» no es una celda` };
  if (!Number.isFinite(p.valor)) return { estado: 'mal-escrito', mensaje: 'el valor que se busca tiene que ser un número' };

  const objetivo = p.objetivo.toUpperCase();
  const cambiando = p.cambiando.toUpperCase();

  // (1) La celda objetivo tiene que guardar una REGLA. Sin regla no hay nada que
  //     buscar: el número ya está escrito y cambiarlo es teclearlo.
  const celdaDestino = celdaEn(libro, hoja.id, destino.col, destino.fila);
  if (!esFormula(celdaDestino?.crudo ?? '')) {
    return {
      estado: 'sin-formula',
      mensaje: `«${objetivo}» no guarda una fórmula: ahí no hay nada que buscar. Escribe primero la regla que depende de «${cambiando}».`,
    };
  }

  // (2) La celda que se mueve tiene que guardar un número escrito a mano. Una
  //     fórmula no se puede mover: la mueve su propia regla, y ésa es la frase
  //     que Excel dice en su cuadro de diálogo.
  const celdaMovil = celdaEn(libro, hoja.id, movil.col, movil.fila);
  const crudoMovil = celdaMovil?.crudo ?? '';
  if (esFormula(crudoMovil)) {
    return {
      estado: 'origen-no-numero',
      mensaje: `«${cambiando}» guarda una fórmula: buscar objetivo sólo puede cambiar una celda con un número escrito a mano.`,
    };
  }
  const partida = crudoMovil.trim() === '' ? 0 : valorDeTextoCrudo(crudoMovil);
  if (typeof partida !== 'number') {
    return {
      estado: 'origen-no-numero',
      mensaje: `«${cambiando}» no guarda un número: buscar objetivo sólo sabe mover números.`,
    };
  }

  const kDestino = clave(hoja.id, destino.col, destino.fila);
  const kMovil = clave(hoja.id, movil.col, movil.fila);
  const contexto: Contexto | undefined = p.ahora === undefined ? undefined : { ahora: p.ahora };
  const motor = contexto ? crearMotor(libro, contexto) : crearMotor(libro);

  // (3) ¿La celda que se mueve entra siquiera en la cuenta de la otra? Se
  //     pregunta al grafo que el motor ya tiene, **antes** de tantear: es el
  //     error número uno del alumno y no vale gastar cien corridas del motor
  //     para acabar diciendo «no converge», que además sería mentira.
  if (!influyeEn(motor, kMovil, kDestino)) {
    return {
      estado: 'no-influye',
      mensaje: `cambiar «${cambiando}» no mueve «${objetivo}»: esa celda no entra en su cuenta. Mira de qué celdas se alimenta «${objetivo}».`,
    };
  }

  const formato: Formato | undefined = celdaDestino?.formato;
  const comoSeVeElObjetivo = mostrar(p.valor, formato);
  // Aquí, y en ninguna otra línea de este archivo, se decide si se ha llegado.
  const llego = (v: number): boolean => mostrar(v, formato) === comoSeVeElObjetivo;

  const probar = (x: number): Tanteo => {
    const tanteo = escribir(libro, textoDeNumero(x));
    const espejo = contexto ? crearMotor(tanteo, contexto) : crearMotor(tanteo);
    const v = valorDeClave(espejo, kDestino);
    if (esError(v)) return { ok: false, motivo: v.error };
    if (typeof v !== 'number') return { ok: false, motivo: `«${objetivo}» no enseña un número` };
    return { ok: true, v };
  };

  const camino = resolverPorSecante(probar, llego, p.valor, partida);
  if (camino.x !== null && camino.v !== null) {
    return { estado: 'encontrado', x: camino.x, crudo: textoDeNumero(camino.x), valor: camino.v, tanteos: camino.tanteos };
  }
  const cerca = camino.mejor
    ? ` Lo más cerca que estuvo fue ${mostrar(camino.mejor.v, formato)} con ${cambiando} = ${textoDeNumero(camino.mejor.x)}.`
    : '';
  const enseño = camino.fallo ? ` Por el camino «${objetivo}» llegó a enseñar ${camino.fallo}.` : '';
  return {
    estado: 'no-converge',
    mensaje: `buscar objetivo no encontró una solución: probó ${camino.tanteos} veces y «${objetivo}» nunca llegó a ${comoSeVeElObjetivo}.${cerca}${enseño}`,
    tanteos: camino.tanteos,
    mejor: camino.mejor ? camino.mejor.v : null,
  };
}

/* ── los escenarios ─────────────────────────────────────────────────────────*/

export const escenariosDe = (libro: Libro): Escenario[] => libro.escenarios ?? [];

const mismoNombre = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

export function escenarioDe(libro: Libro, nombre: string): Escenario | null {
  return escenariosDe(libro).find((e) => mismoNombre(e.nombre, nombre)) ?? null;
}

/** Cambia la lista entera. Lista vacía ⇒ **se quita la clave**, como `combinadas`. */
export function conEscenarios(libro: Libro, lista: Escenario[]): Libro {
  const fuera: Libro = { ...libro };
  if (lista.length) fuera.escenarios = lista;
  else delete fuera.escenarios;
  return fuera;
}

/** El escenario que sale de fotografiar estas celdas **tal como están ahora**. */
export function fotoDe(libro: Libro, nombre: string, claves: Clave[]): Escenario {
  const celdas: Record<Clave, string> = {};
  for (const k of claves) {
    const p = partirClave(k);
    if (!p) continue;
    celdas[k] = celdaEn(libro, p.hoja, p.col, p.fila)?.crudo ?? '';
  }
  return { nombre: nombre.trim(), celdas };
}

/**
 * Guarda el escenario, y si el nombre ya estaba **lo reemplaza en su sitio**.
 *
 * Reemplazar y no añadir es lo que impide dos «Optimista» en la lista, que es un
 * libro en el que `aplicar-escenario` haría una cosa u otra según cuál encuentre
 * primero — la peor forma de fallar, la que no se ve. Que el aviso salga antes
 * es cosa de `revisar`.
 */
export function conEscenarioGuardado(libro: Libro, e: Escenario): Libro {
  const lista = escenariosDe(libro);
  const i = lista.findIndex((x) => mismoNombre(x.nombre, e.nombre));
  return conEscenarios(libro, i < 0 ? [...lista, e] : lista.map((x, j) => (j === i ? e : x)));
}

export function sinEscenario(libro: Libro, nombre: string): Libro {
  const lista = escenariosDe(libro);
  const quedan = lista.filter((e) => !mismoNombre(e.nombre, nombre));
  return quedan.length === lista.length ? libro : conEscenarios(libro, quedan);
}

/** Las celdas de un escenario, en el orden en que se guardaron. */
export const celdasDeEscenario = (e: Escenario): Clave[] => Object.keys(e.celdas);

/**
 * Las celdas donde aplicar este escenario **sustituiría una regla por un
 * número** — que es exactamente el defecto que el bloque 57 enseña a no cometer.
 *
 * Sólo cuenta ese caso: cambiar una fórmula por otra fórmula es cambiar de
 * regla, y una celda de datos por otro dato es para lo que sirve un escenario.
 */
export function pisaFormulas(libro: Libro, e: Escenario): Clave[] {
  const fuera: Clave[] = [];
  for (const [k, crudo] of Object.entries(e.celdas)) {
    const p = partirClave(k);
    if (!p) continue;
    if (esFormula(celdaEn(libro, p.hoja, p.col, p.fila)?.crudo ?? '') && !esFormula(crudo)) fuera.push(k);
  }
  return fuera;
}

/** Las hojas que un escenario nombra y que el libro ya no tiene. */
export function hojasQueFaltan(libro: Libro, e: Escenario): string[] {
  const fuera = new Set<string>();
  for (const k of Object.keys(e.celdas)) {
    const p = partirClave(k);
    if (p && !hojaDe(libro, p.hoja)) fuera.add(p.hoja);
  }
  return [...fuera];
}
