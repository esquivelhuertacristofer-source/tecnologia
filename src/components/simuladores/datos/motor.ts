/**
 * Tecnia Datos · `motor.ts` — ejecutar el árbol contra la base.
 *
 * Cuarta pieza, y la que hace el trabajo. Tres cosas que conviene saber antes
 * de leerlo:
 *
 * **(1) Una fila es un array, no un objeto.** `{ nombre: 'Ana', edad: 12 }` se
 * lee muy bien en el depurador y cuesta una búsqueda por cadena de texto en
 * cada acceso, en cada fila, en cada consulta. El §46 ya dejó dicho dos veces
 * dónde se va el tiempo en este proyecto, así que aquí los nombres se resuelven
 * **una vez**, al planificar, y lo que corre por fila es `fila[3]`.
 *
 * **(2) Cada expresión se compila a una función.** `compilar()` devuelve un
 * `(fila) => Valor`; no hay un `switch` gigante ejecutándose una vez por nodo y
 * por fila. Es lo mismo que hace `formula/calculo.ts` guardando el árbol
 * analizado: el trabajo que no depende de la fila se hace antes de la primera.
 * Y sale gratis lo que más importa: **los errores de columna desconocida, de
 * tipos y de `GROUP BY` se dan al planificar**, con su línea y su columna, sin
 * haber tocado un solo dato.
 *
 * **(3) El `JOIN` es por tabla de dispersión cuando puede.** Si el `ON` es una
 * igualdad entre una columna de cada lado —que es el 100% de lo que escribe una
 * clase— se construye un índice de la tabla de la derecha y se recorre la de la
 * izquierda una vez. Diez mil por cincuenta con bucles anidados son medio
 * millón de comparaciones; con el índice son diez mil. Si el `ON` es cualquier
 * otra cosa, bucles anidados con tope, que es lento pero no miente.
 *
 * ── Y la regla que hereda de `modelo.ts` ────────────────────────────────────
 *
 * La base que entra no se toca nunca. Cada instrucción devuelve otra base que
 * comparte las tablas que no cambiaron. Deshacer es quedarse con la de antes.
 */

import { fallo, pistaDeLista, Tropiezo, type ErrorSQL } from './errores';
import {
  comparar,
  esCierto,
  esFechaValida,
  esIncomparable,
  hijasDe,
  indiceDeColumna,
  no,
  NOMBRE_DE_TIPO,
  nombreDeTipo,
  o,
  ordenar,
  patronDeLike,
  plegar,
  tablaPorNombre,
  textoDeValor,
  y,
  type Base,
  type Columna,
  type Logico,
  type Tabla,
  type TipoColumna,
  type Valor,
} from './modelo';
import {
  analizarGuion,
  llevaResumen,
  nombreDeExpresion,
  type ClaveOrden,
  type Expr,
  type Fuente,
  type Sent,
  type Sitio,
} from './sintaxis';
import { TOPES } from './subconjunto';

/* ── lo que sale por la puerta ──────────────────────────────────────────────*/

export interface ColumnaResultado {
  nombre: string;
  /** El tipo declarado, cuando la columna sale tal cual de una tabla. */
  tipo: TipoColumna | null;
}

export interface Resultado {
  clase: 'consulta' | 'cambio' | 'esquema';
  columnas: ColumnaResultado[];
  filas: Valor[][];
  /** Cuántas filas devolvió, insertó, cambió o borró. */
  filasAfectadas: number;
  /** Lo que no es un error pero la clase tiene que poder enseñar. */
  avisos: string[];
}

export type Ejecucion =
  | { ok: true; base: Base; resultados: Resultado[] }
  | { ok: false; base: Base; resultados: Resultado[]; error: ErrorSQL };

/**
 * Ejecuta un guion entero. **No lanza.**
 *
 * Si la instrucción 3 de 5 falla, las dos primeras **quedan aplicadas** y la
 * base que se devuelve las lleva puestas. No es un descuido: aquí no hay
 * transacciones (`subconjunto.ts`), y fingir que las hay escondiendo un
 * `ROLLBACK` sería enseñar un motor que no existe. Volver atrás es el botón de
 * deshacer, que trabaja con la base entera y está fuera de la consulta.
 */
export function ejecutar(base: Base, sql: string): Ejecucion {
  const analisis = analizarGuion(sql);
  if (!analisis.ok) return { ok: false, base, resultados: [], error: analisis.error };

  const resultados: Resultado[] = [];
  let actual = base;
  for (const s of analisis.sentencias) {
    try {
      const paso = ejecutarSentencia(actual, s);
      actual = paso.base;
      resultados.push(paso.resultado);
    } catch (e) {
      if (e instanceof Tropiezo) return { ok: false, base: actual, resultados, error: e.detalle };
      throw e;
    }
  }
  return { ok: true, base: actual, resultados };
}

function ejecutarSentencia(base: Base, s: Sent): { base: Base; resultado: Resultado } {
  switch (s.t) {
    case 'create':
      return crearTabla(base, s);
    case 'insert':
      return insertar(base, s);
    case 'update':
      return actualizar(base, s);
    case 'delete':
      return borrar(base, s);
    case 'select':
      return { base, resultado: consultar(base, s) };
  }
}

/* ── la sesión: la base de ahora y la pila de deshacer ──────────────────────*/

/**
 * Decisión 4 del encargo, entera: **un `DELETE` sin `WHERE` borra la tabla y se
 * puede deshacer**.
 *
 * Que se pueda hacer es lo que permite que la clase enseñe el estropicio; que
 * se pueda deshacer es lo que permite repetirlo. La pila guarda bases enteras,
 * y eso no es caro porque una base nueva comparte con la anterior todas las
 * tablas que no cambiaron: lo que se copia es un array de punteros.
 */
export interface Sesion {
  base: Base;
  pila: Base[];
  deshechas: Base[];
}

export function crearSesion(base: Base): Sesion {
  return { base, pila: [], deshechas: [] };
}

export function correr(sesion: Sesion, sql: string): Ejecucion {
  const antes = sesion.base;
  const r = ejecutar(antes, sql);
  if (r.base !== antes) {
    sesion.pila.push(antes);
    sesion.deshechas = [];
    sesion.base = r.base;
  }
  return r;
}

export function deshacer(sesion: Sesion): boolean {
  const anterior = sesion.pila.pop();
  if (!anterior) return false;
  sesion.deshechas.push(sesion.base);
  sesion.base = anterior;
  return true;
}

export function rehacer(sesion: Sesion): boolean {
  const siguiente = sesion.deshechas.pop();
  if (!siguiente) return false;
  sesion.pila.push(sesion.base);
  sesion.base = siguiente;
  return true;
}

/* ── CREATE TABLE ───────────────────────────────────────────────────────────*/

function crearTabla(base: Base, s: Sent & { t: 'create' }): { base: Base; resultado: Resultado } {
  const ya = tablaPorNombre(base, s.tabla);
  if (ya) {
    throw fallo('restriccion', `ya existe una tabla llamada «${ya.nombre}»`, {
      ...s,
      pista: 'si quieres cambiarla, deshaz y corrige tu CREATE TABLE',
      familia: `table ${s.tabla} already exists`,
    });
  }

  const columnas: Columna[] = [];
  let claves = 0;
  for (const d of s.columnas) {
    if (columnas.some((c) => plegar(c.nombre) === plegar(d.nombre))) {
      throw fallo('restriccion', `esta tabla ya tiene una columna llamada «${d.nombre}»`, {
        ...d,
        pista: 'dos columnas de la misma tabla no se pueden llamar igual',
        familia: `duplicate column name: ${d.nombre}`,
      });
    }
    if (d.clavePrimaria) {
      claves += 1;
      if (claves > 1) {
        throw fallo('restriccion', 'una tabla sólo puede tener una clave primaria', {
          ...d,
          pista: 'la clave primaria es la columna que distingue una fila de todas las demás; elige una sola',
        });
      }
    }
    columnas.push({
      nombre: d.nombre,
      tipo: d.tipo,
      clavePrimaria: d.clavePrimaria,
      noNulo: d.noNulo,
      referencia: d.referencia,
    });
  }

  const nueva: Tabla = { nombre: s.tabla, columnas, filas: [] };

  /* Las referencias se comprueban con la tabla nueva ya dentro, para que una
   * tabla pueda apuntarse a sí misma —el jefe de un empleado es otro empleado—
   * que es el ejemplo con el que se explican las relaciones. */
  const conNueva: Base = { tablas: [...base.tablas, nueva] };
  for (const d of s.columnas) {
    if (!d.referencia) continue;
    const destino = tablaPorNombre(conNueva, d.referencia.tabla);
    if (!destino) {
      throw fallo('tabla', `no existe ninguna tabla llamada «${d.referencia.tabla}»`, {
        ...d,
        pista: pistaDeLista(
          'en esta base hay',
          d.referencia.tabla,
          conNueva.tablas.map((t) => t.nombre),
        ),
        familia: `no such table: ${d.referencia.tabla}`,
      });
    }
    const i = indiceDeColumna(destino, d.referencia.columna);
    if (i < 0) {
      throw fallo('columna', `«${destino.nombre}» no tiene ninguna columna llamada «${d.referencia.columna}»`, {
        ...d,
        pista: pistaDeLista(
          `«${destino.nombre}» tiene`,
          d.referencia.columna,
          destino.columnas.map((c) => c.nombre),
        ),
        familia: `no such column: ${d.referencia.columna}`,
      });
    }
    if (!destino.columnas[i].clavePrimaria) {
      throw fallo('restriccion', `«${destino.nombre}.${destino.columnas[i].nombre}» no es la clave primaria de «${destino.nombre}»`, {
        ...d,
        pista: 'una clave foránea apunta siempre a la clave primaria de la otra tabla, que es la que no se repite',
      });
    }
    if (familia(destino.columnas[i].tipo) !== familia(d.tipo)) {
      throw fallo('tipo', `«${d.nombre}» guarda ${NOMBRE_DE_TIPO[d.tipo]} y «${destino.nombre}.${destino.columnas[i].nombre}» guarda ${NOMBRE_DE_TIPO[destino.columnas[i].tipo]}`, {
        ...d,
        pista: 'las dos columnas de una relación tienen que ser del mismo tipo: van a guardar el mismo dato',
      });
    }
  }

  return {
    base: conNueva,
    resultado: {
      clase: 'esquema',
      columnas: [],
      filas: [],
      filasAfectadas: 0,
      avisos: [`tabla «${s.tabla}» creada con ${columnas.length} columnas`],
    },
  };
}

/* ── INSERT ─────────────────────────────────────────────────────────────────*/

function insertar(base: Base, s: Sent & { t: 'insert' }): { base: Base; resultado: Resultado } {
  const tabla = exigeTabla(base, s.tabla, s);

  let destino: number[];
  if (s.columnas) {
    destino = s.columnas.map((n, k) => {
      const i = indiceDeColumna(tabla, n);
      if (i < 0) throw sinColumna(tabla, n, s.columnas?.[k] ? s : s);
      return i;
    });
    const vistas = new Set<number>();
    destino.forEach((i, k) => {
      if (vistas.has(i)) {
        throw fallo('columna', `has puesto «${s.columnas?.[k]}» dos veces`, { ...s });
      }
      vistas.add(i);
    });
  } else {
    destino = tabla.columnas.map((_, i) => i);
  }

  const nuevas: Valor[][] = [];
  for (const tupla of s.tuplas) {
    if (tupla.length !== destino.length) {
      const cuantas = s.columnas
        ? `has nombrado ${destino.length} columnas y has dado ${tupla.length} valores`
        : `«${tabla.nombre}» tiene ${tabla.columnas.length} columnas y has dado ${tupla.length} valores`;
      throw fallo('valor', cuantas, {
        ...s,
        pista: `las columnas de «${tabla.nombre}» son: ${tabla.columnas.map((c) => c.nombre).join(', ')}`,
        familia: `table ${tabla.nombre} has ${tabla.columnas.length} columns but ${tupla.length} values were supplied`,
      });
    }
    const fila: Valor[] = tabla.columnas.map(() => null);
    tupla.forEach((e, k) => {
      const col = tabla.columnas[destino[k]];
      fila[destino[k]] = valorLiteral(e, col, tabla.nombre);
    });
    nuevas.push(fila);
  }

  if (tabla.filas.length + nuevas.length > TOPES.FILAS) {
    throw fallo('limite', `«${tabla.nombre}» no puede pasar de ${TOPES.FILAS.toLocaleString('es-MX')} filas`, { ...s });
  }

  const conFilas: Tabla = { ...tabla, filas: tabla.filas.concat(nuevas) };
  const nueva = conTabla(base, conFilas);
  validarTabla(nueva, conFilas, s);

  return {
    base: nueva,
    resultado: {
      clase: 'cambio',
      columnas: [],
      filas: [],
      filasAfectadas: nuevas.length,
      avisos: [],
    },
  };
}

/**
 * Un valor de `INSERT` o de `SET` se calcula sin fila, porque no hay ninguna:
 * `INSERT INTO alumnos VALUES (1, nombre)` no tiene de dónde sacar `nombre`.
 */
function valorLiteral(e: Expr, col: Columna, tabla: string): Valor {
  const v = literal(e);
  return validarValor(v, col, tabla, e);
}

function literal(e: Expr): Valor {
  switch (e.t) {
    case 'num':
      return e.v;
    case 'txt':
      return e.v;
    case 'bool':
      return e.v;
    case 'nulo':
      return null;
    case 'neg': {
      const v = literal(e.arg);
      if (typeof v !== 'number') throw noEsNumero(v, e);
      return -v;
    }
    case 'bin': {
      const a = literal(e.izq);
      const b = literal(e.der);
      return aritmetica(e.op, a, b, e);
    }
    case 'col':
      throw fallo('columna', `aquí no se puede usar la columna «${e.nombre}»`, {
        ...e,
        pista: 'los valores que se insertan son datos sueltos: números, textos entre comillas, TRUE, FALSE o NULL',
      });
    default:
      throw fallo('valor', 'aquí va un dato, no una condición', { ...e });
  }
}

function validarValor(v: Valor, col: Columna, tabla: string, sitio: Sitio): Valor {
  if (v === null) {
    if (col.noNulo) {
      throw fallo('restriccion', `«${col.nombre}» no puede quedar vacía`, {
        ...sitio,
        pista: col.clavePrimaria
          ? 'es la clave primaria: es lo que distingue esta fila de todas las demás, así que siempre tiene que valer algo'
          : `se declaró NOT NULL en «${tabla}»`,
        familia: `NOT NULL constraint failed: ${tabla}.${col.nombre}`,
      });
    }
    return null;
  }

  const dado = nombreDeTipo(v);
  const malTipo = (detalle: string, pista: string): Tropiezo =>
    fallo('tipo', `«${col.nombre}» guarda ${NOMBRE_DE_TIPO[col.tipo]} y ${detalle}`, {
      ...sitio,
      pista,
      familia: `datatype mismatch: ${tabla}.${col.nombre}`,
    });

  switch (col.tipo) {
    case 'entero':
      if (typeof v !== 'number') {
        throw malTipo(
          `${textoDeValorEnMensaje(v)} es ${dado}`,
          typeof v === 'string' ? 'los números se escriben sin comillas: 12, no \'12\'' : 'aquí va un número',
        );
      }
      if (!Number.isInteger(v)) {
        throw malTipo(`${v} tiene decimales`, 'si esta columna necesita decimales, declárala REAL en vez de INTEGER');
      }
      return v;
    case 'real':
      if (typeof v !== 'number') {
        throw malTipo(
          `${textoDeValorEnMensaje(v)} es ${dado}`,
          typeof v === 'string' ? 'los números se escriben sin comillas y con punto decimal: 8.5' : 'aquí va un número',
        );
      }
      return v;
    case 'texto':
      if (typeof v !== 'string') {
        throw malTipo(`${textoDeValorEnMensaje(v)} es ${dado}`, 'el texto va entre comillas simples: \'Ana\'');
      }
      return v;
    case 'fecha':
      if (typeof v !== 'string') {
        throw malTipo(`${textoDeValorEnMensaje(v)} es ${dado}`, 'una fecha se escribe entre comillas: \'2026-08-15\'');
      }
      if (!esFechaValida(v)) {
        throw fallo('tipo', `«${v}» no es una fecha`, {
          ...sitio,
          pista: 'las fechas se escriben año-mes-día con cuatro cifras de año: \'2026-08-15\'. Así ordenadas como texto quedan ordenadas por antigüedad',
          familia: `datatype mismatch: ${tabla}.${col.nombre}`,
        });
      }
      return v;
    case 'booleano':
      if (typeof v !== 'boolean') {
        throw malTipo(`${textoDeValorEnMensaje(v)} es ${dado}`, 'un sí/no se escribe TRUE o FALSE, sin comillas');
      }
      return v;
  }
}

function textoDeValorEnMensaje(v: Valor): string {
  return typeof v === 'string' ? `«'${v}'»` : `«${textoDeValor(v)}»`;
}

/* ── UPDATE ─────────────────────────────────────────────────────────────────*/

function actualizar(base: Base, s: Sent & { t: 'update' }): { base: Base; resultado: Resultado } {
  const tabla = exigeTabla(base, s.tabla, s);
  const ambito = ambitoDe([{ alias: tabla.nombre, tabla, desplazamiento: 0 }]);
  const avisos: string[] = [];
  const filtro = s.donde ? compilarFiltro(s.donde, { ambito, avisos, grupo: null }, 'WHERE') : null;

  const cambios = s.asignaciones.map((a) => {
    const i = indiceDeColumna(tabla, a.columna);
    if (i < 0) throw sinColumna(tabla, a.columna, a.sitio);
    return { indice: i, col: tabla.columnas[i], calcular: compilar(a.valor, { ambito, avisos, grupo: null }), sitio: a.sitio };
  });

  let tocadas = 0;
  const filas = tabla.filas.map((f) => {
    if (filtro && !esCierto(filtro(f))) return f;
    tocadas += 1;
    const copia = f.slice();
    for (const c of cambios) copia[c.indice] = validarValor(c.calcular(f), c.col, tabla.nombre, c.sitio);
    return copia;
  });

  if (!s.donde && tocadas > 0) {
    avisos.push(`un UPDATE sin WHERE cambia todas las filas: han cambiado las ${tocadas} de «${tabla.nombre}»`);
  }

  const conFilas: Tabla = { ...tabla, filas };
  const nueva = conTabla(base, conFilas);
  validarTabla(nueva, conFilas, s);
  comprobarHijasHuerfanas(nueva, tabla, conFilas, s);

  return {
    base: nueva,
    resultado: { clase: 'cambio', columnas: [], filas: [], filasAfectadas: tocadas, avisos },
  };
}

/* ── DELETE ─────────────────────────────────────────────────────────────────*/

function borrar(base: Base, s: Sent & { t: 'delete' }): { base: Base; resultado: Resultado } {
  const tabla = exigeTabla(base, s.tabla, s);
  const ambito = ambitoDe([{ alias: tabla.nombre, tabla, desplazamiento: 0 }]);
  const avisos: string[] = [];
  const filtro = s.donde ? compilarFiltro(s.donde, { ambito, avisos, grupo: null }, 'WHERE') : null;

  const quedan: Valor[][] = [];
  const fuera: Valor[][] = [];
  for (const f of tabla.filas) {
    if (!filtro || esCierto(filtro(f))) fuera.push(f);
    else quedan.push(f);
  }

  /* Antes de borrar, ¿alguien apunta a estas filas? Es la clase de la clave
   * foránea y el error tiene que decir quién apunta y cuántas veces. */
  const clave = tabla.columnas.findIndex((c) => c.clavePrimaria);
  if (clave >= 0 && fuera.length > 0) {
    const borradas = new Set(fuera.map((f) => f[clave]));
    for (const hija of hijasDe(base, tabla.nombre)) {
      if (hija.tabla === tabla) continue;
      for (const f of hija.tabla.filas) {
        const v = f[hija.indice];
        if (v !== null && borradas.has(v)) {
          const cuantas = hija.tabla.filas.filter((x) => x[hija.indice] === v).length;
          throw fallo('restriccion', `no se puede borrar la fila con ${tabla.columnas[clave].nombre} = ${textoDeValor(v)}: la está usando «${hija.tabla.nombre}»`, {
            ...s,
            pista: `${cuantas} fila${cuantas === 1 ? '' : 's'} de «${hija.tabla.nombre}» apunta${cuantas === 1 ? '' : 'n'} ahí con «${hija.columna.nombre}». Cámbialas o bórralas primero`,
            familia: 'FOREIGN KEY constraint failed',
          });
        }
      }
    }
  }

  if (!s.donde && fuera.length > 0) {
    avisos.push(
      `un DELETE sin WHERE borra la tabla entera: se han ido las ${fuera.length} filas de «${tabla.nombre}». La tabla sigue existiendo, vacía`,
    );
  }

  return {
    base: conTabla(base, { ...tabla, filas: quedan }),
    resultado: { clase: 'cambio', columnas: [], filas: [], filasAfectadas: fuera.length, avisos },
  };
}

/* ── SELECT ─────────────────────────────────────────────────────────────────*/

interface FuenteResuelta {
  alias: string;
  tabla: Tabla;
  desplazamiento: number;
}

interface Ambito {
  fuentes: FuenteResuelta[];
  ancho: number;
}

function ambitoDe(fuentes: FuenteResuelta[]): Ambito {
  const ancho = fuentes.reduce((n, f) => n + f.tabla.columnas.length, 0);
  return { fuentes, ancho };
}

interface PlanResumen {
  nombre: string;
  arg: Eval | null;
  sitio: Sitio;
}

interface Grupo {
  /** clave estructural → posición en la fila sintética del grupo. */
  posiciones: Map<string, number>;
  resumenes: PlanResumen[];
  indices: Map<string, number>;
  base: number;
}

interface Contexto {
  ambito: Ambito;
  avisos: string[];
  grupo: Grupo | null;
}

type Eval = (fila: readonly Valor[]) => Valor;

function consultar(base: Base, s: Sent & { t: 'select' }): Resultado {
  const avisos: string[] = [];
  const izq = resolverFuente(base, s.de, 0);
  const fuentes: FuenteResuelta[] = [izq];
  if (s.union) fuentes.push(resolverFuente(base, s.union.fuente, izq.tabla.columnas.length));

  const alias = fuentes.map((f) => f.alias);
  if (alias.length === 2 && plegar(alias[0]) === plegar(alias[1])) {
    throw fallo('tabla', `las dos tablas de la unión se llaman «${alias[0]}»`, {
      ...s.union!.fuente,
      pista: 'ponle un nombre corto a cada una para poder distinguirlas: FROM empleados a JOIN empleados b ON …',
    });
  }

  const ambito = ambitoDe(fuentes);
  const ctxFila: Contexto = { ambito, avisos, grupo: null };

  /* 1 · las filas de partida: una tabla, o la unión de dos. */
  let filas: readonly Valor[][] = s.union ? unir(izq, fuentes[1], s.union.on, ctxFila) : izq.tabla.filas;

  /* 2 · WHERE, que filtra ANTES de agrupar. Por eso un resumen no cabe aquí. */
  if (s.donde) {
    const filtro = compilarFiltro(s.donde, ctxFila, 'WHERE');
    filas = filas.filter((f) => esCierto(filtro(f)));
  }

  /* 3 · ¿resume la consulta? Sí si hay GROUP BY, o si algún item o el HAVING
   *     lleva un COUNT/SUM/AVG/MIN/MAX. */
  const resumeItems = s.items.some((i) => i.t === 'expr' && llevaResumen(i.expr));
  const agrupa = s.agrupar.length > 0 || resumeItems || (s.teniendo !== null && llevaResumen(s.teniendo));

  if (s.teniendo && !agrupa) {
    throw fallo('agrupacion', 'HAVING sólo tiene sentido cuando la consulta agrupa', {
      ...s,
      pista: 'HAVING filtra grupos; para filtrar filas se usa WHERE',
    });
  }

  const salida = agrupa ? proyectarAgrupado(s, filas, ctxFila) : proyectarPlano(s, filas, ctxFila);

  /* 4 · ORDER BY y LIMIT, encima de lo que salga. */
  ordenarSalida(salida, s.orden, agrupa ? salida.ctxGrupo! : ctxFila, salida.columnas);
  let filasFinales = salida.filas.map((p) => p.salida);
  if (s.limite !== null) filasFinales = filasFinales.slice(0, s.limite);

  return {
    clase: 'consulta',
    columnas: salida.columnas,
    filas: filasFinales,
    filasAfectadas: filasFinales.length,
    avisos,
  };
}

interface Proyeccion {
  columnas: ColumnaResultado[];
  /** `origen` es la fila de la tabla, o la fila sintética del grupo. */
  filas: { salida: Valor[]; origen: readonly Valor[] }[];
  ctxGrupo?: Contexto;
}

function proyectarPlano(s: Sent & { t: 'select' }, filas: readonly Valor[][], ctx: Contexto): Proyeccion {
  const columnas: ColumnaResultado[] = [];
  const evals: Eval[] = [];

  for (const item of s.items) {
    if (item.t === 'todas') {
      for (const f of ctx.ambito.fuentes) {
        f.tabla.columnas.forEach((c, i) => {
          const repetida = ctx.ambito.fuentes.some((g) => g !== f && indiceDeColumna(g.tabla, c.nombre) >= 0);
          columnas.push({ nombre: repetida ? `${f.alias}.${c.nombre}` : c.nombre, tipo: c.tipo });
          const k = f.desplazamiento + i;
          evals.push((fila) => fila[k]);
        });
      }
      continue;
    }
    columnas.push({ nombre: item.alias ?? nombreDeExpresion(item.expr), tipo: tipoDe(item.expr, ctx) });
    evals.push(compilar(item.expr, ctx));
  }

  return {
    columnas,
    filas: filas.map((f) => ({ salida: evals.map((e) => e(f)), origen: f })),
  };
}

function proyectarAgrupado(s: Sent & { t: 'select' }, filas: readonly Valor[][], ctx: Contexto): Proyeccion {
  /* Las expresiones del GROUP BY ocupan las primeras casillas de la fila
   * sintética; los resúmenes van detrás, y se registran al compilar. */
  const posiciones = new Map<string, number>();
  const clavesEval: Eval[] = [];
  s.agrupar.forEach((e, i) => {
    posiciones.set(claveEstructural(e, ctx.ambito), i);
    clavesEval.push(compilar(e, ctx));
  });

  const grupo: Grupo = { posiciones, resumenes: [], indices: new Map(), base: s.agrupar.length };
  const ctxGrupo: Contexto = { ...ctx, grupo };

  const columnas: ColumnaResultado[] = [];
  const evals: Eval[] = [];
  for (const item of s.items) {
    if (item.t === 'todas') {
      throw fallo('agrupacion', 'no se puede pedir «*» en una consulta que resume', {
        ...item,
        pista: 'di qué columnas quieres: las del GROUP BY y los resúmenes. Por ejemplo: SELECT grupo, COUNT(*)',
      });
    }
    columnas.push({ nombre: item.alias ?? nombreDeExpresion(item.expr), tipo: tipoDe(item.expr, ctx) });
    evals.push(compilar(item.expr, ctxGrupo));
  }
  const teniendo = s.teniendo ? compilarFiltro(s.teniendo, ctxGrupo, 'HAVING') : null;

  /* Agrupar. `NULL` cae en su propio grupo —y todos los `NULL` en el mismo—,
   * que es lo que hace SQL aunque `NULL` no sea igual a `NULL`: agrupar no es
   * comparar. Como `Map` distingue `null` de `0` y de `''`, sale solo. */
  const raiz = new Map<Valor, unknown>();
  const grupos: { clave: Valor[]; filas: Valor[][] }[] = [];
  if (s.agrupar.length === 0) {
    grupos.push({ clave: [], filas: filas as Valor[][] });
  } else {
    for (const f of filas) {
      const clave = clavesEval.map((e) => e(f));
      let mapa = raiz;
      for (let i = 0; i < clave.length - 1; i += 1) {
        let sig = mapa.get(clave[i]) as Map<Valor, unknown> | undefined;
        if (!sig) {
          sig = new Map<Valor, unknown>();
          mapa.set(clave[i], sig);
        }
        mapa = sig;
      }
      const ultima = clave[clave.length - 1];
      let cesta = mapa.get(ultima) as { clave: Valor[]; filas: Valor[][] } | undefined;
      if (!cesta) {
        cesta = { clave, filas: [] };
        mapa.set(ultima, cesta);
        grupos.push(cesta); // el orden de los grupos es el de aparición
      }
      cesta.filas.push(f as Valor[]);
    }
  }

  const salida: { salida: Valor[]; origen: readonly Valor[] }[] = [];
  for (const g of grupos) {
    const sintetica: Valor[] = g.clave.slice();
    for (const r of grupo.resumenes) sintetica.push(acumular(r, g.filas));
    if (teniendo && !esCierto(teniendo(sintetica))) continue;
    salida.push({ salida: evals.map((e) => e(sintetica)), origen: sintetica });
  }

  return { columnas, filas: salida, ctxGrupo };
}

function ordenarSalida(p: Proyeccion, claves: ClaveOrden[], ctx: Contexto, columnas: ColumnaResultado[]): void {
  if (claves.length === 0) return;
  const plan = claves.map((k) => {
    /* Primero, ¿es el nombre de una columna del resultado? `ORDER BY total`
     * cuando `total` es el alias de un COUNT(*) es lo natural de escribir, y
     * compilarlo contra la tabla daría «no existe la columna total». */
    if (k.expr.t === 'col' && k.expr.tabla === null) {
      const i = columnas.findIndex((c) => plegar(c.nombre) === plegar((k.expr as { nombre: string }).nombre));
      if (i >= 0) return { desc: k.desc, leer: (par: { salida: Valor[]; origen: readonly Valor[] }) => par.salida[i] };
    }
    const e = compilar(k.expr, ctx);
    return { desc: k.desc, leer: (par: { salida: Valor[]; origen: readonly Valor[] }) => e(par.origen) };
  });

  /* `sort` de JavaScript es estable desde ES2019, así que los empates salen en
   * el orden en que estaban: el de inserción. Es la decisión 3 de `modelo.ts`. */
  p.filas.sort((a, b) => {
    for (const k of plan) {
      const c = ordenar(k.leer(a), k.leer(b));
      if (c !== 0) return k.desc ? -c : c;
    }
    return 0;
  });
}

/* ── la unión ───────────────────────────────────────────────────────────────*/

function unir(izq: FuenteResuelta, der: FuenteResuelta, on: Expr, ctx: Contexto): Valor[][] {
  if (llevaResumen(on)) {
    throw fallo('agrupacion', 'un resumen no puede ir en el ON de una unión', {
      ...on,
      pista: 'el ON dice qué fila de una tabla va con qué fila de la otra; los resúmenes se calculan después',
    });
  }

  const salida: Valor[][] = [];
  const porClave = claveDeUnion(on, izq, der);

  if (porClave) {
    /* Índice de la tabla de la derecha. Las filas con la clave a NULL no entran:
     * NULL no es igual a nada, ni siquiera a otro NULL. */
    const indice = new Map<Valor, Valor[][]>();
    for (const f of der.tabla.filas) {
      const k = f[porClave.der];
      if (k === null) continue;
      const cesta = indice.get(k);
      if (cesta) cesta.push(f);
      else indice.set(k, [f]);
    }
    for (const f of izq.tabla.filas) {
      const k = f[porClave.izq];
      if (k === null) continue;
      const cesta = indice.get(k);
      if (!cesta) continue;
      for (const g of cesta) {
        if (salida.length >= TOPES.PRODUCTO) throw demasiado(on);
        salida.push(f.concat(g));
      }
    }
    return salida;
  }

  const predicado = compilarFiltro(on, ctx, 'ON');
  const ancho = izq.tabla.columnas.length + der.tabla.columnas.length;
  const par: Valor[] = new Array<Valor>(ancho).fill(null);
  for (const f of izq.tabla.filas) {
    for (let i = 0; i < f.length; i += 1) par[i] = f[i];
    for (const g of der.tabla.filas) {
      for (let i = 0; i < g.length; i += 1) par[f.length + i] = g[i];
      if (!esCierto(predicado(par))) continue;
      if (salida.length >= TOPES.PRODUCTO) throw demasiado(on);
      salida.push(par.slice());
    }
  }
  return salida;
}

function demasiado(sitio: Sitio): Tropiezo {
  return fallo('limite', `la unión saca más de ${TOPES.PRODUCTO.toLocaleString('es-MX')} filas`, {
    ...sitio,
    pista: 'casi siempre significa que el ON no une por la clave y cada fila se está cruzando con todas las de la otra tabla',
  });
}

/**
 * ¿El `ON` es `a.x = b.y`? Entonces la unión se hace con un índice.
 *
 * Aquí es también donde se caza a tiempo el `JOIN` que uniría una columna de
 * números con una de texto: por el camino del índice ese error se convertiría
 * en «no salió ninguna fila», que es la peor respuesta posible en una clase.
 */
function claveDeUnion(on: Expr, izq: FuenteResuelta, der: FuenteResuelta): { izq: number; der: number } | null {
  if (on.t !== 'bin' || on.op !== '=' || on.izq.t !== 'col' || on.der.t !== 'col') return null;
  const a = ubicar(on.izq, izq, der);
  const b = ubicar(on.der, izq, der);
  if (!a || !b || a.lado === b.lado) return null;

  if (familia(a.col.tipo) !== familia(b.col.tipo)) {
    throw fallo('tipo', `«${a.col.nombre}» guarda ${NOMBRE_DE_TIPO[a.col.tipo]} y «${b.col.nombre}» guarda ${NOMBRE_DE_TIPO[b.col.tipo]}`, {
      ...on,
      pista: 'una unión junta dos columnas que guardan el mismo dato; si son de tipos distintos, no puede casar ninguna fila',
    });
  }
  return a.lado === 'izq' ? { izq: a.indice, der: b.indice } : { izq: b.indice, der: a.indice };
}

function ubicar(
  e: Expr & { t: 'col' },
  izq: FuenteResuelta,
  der: FuenteResuelta,
): { lado: 'izq' | 'der'; indice: number; col: Columna } | null {
  for (const [lado, f] of [
    ['izq', izq],
    ['der', der],
  ] as const) {
    if (e.tabla !== null && plegar(e.tabla) !== plegar(f.alias)) continue;
    const i = indiceDeColumna(f.tabla, e.nombre);
    if (i >= 0) return { lado, indice: i, col: f.tabla.columnas[i] };
  }
  return null;
}

/* ── compilar expresiones ───────────────────────────────────────────────────*/

function compilarFiltro(e: Expr, ctx: Contexto, donde: 'WHERE' | 'ON' | 'HAVING'): (f: readonly Valor[]) => Logico {
  if (donde === 'WHERE' && llevaResumen(e)) {
    throw fallo('agrupacion', 'un resumen no puede ir en el WHERE', {
      ...e,
      pista: 'WHERE filtra las filas ANTES de agruparlas, así que todavía no hay nada que contar ni que sumar. Para filtrar por un resumen se usa HAVING',
      familia: 'misuse of aggregate function',
    });
  }
  const f = compilar(e, ctx);
  return (fila) => {
    const v = f(fila);
    if (v !== null && typeof v !== 'boolean') {
      throw fallo('tipo', `el ${donde} tiene que ser una condición, y esto vale ${textoDeValorEnMensaje(v)}`, {
        ...e,
        pista: 'una condición se escribe con una comparación: WHERE edad > 12',
      });
    }
    return v;
  };
}

function compilar(e: Expr, ctx: Contexto): Eval {
  /* En modo grupo, lo primero es mirar si esta expresión entera es una de las
   * del GROUP BY: entonces se lee de la fila sintética y no se recorre más. */
  if (ctx.grupo) {
    const k = claveEstructural(e, ctx.ambito);
    const pos = ctx.grupo.posiciones.get(k);
    if (pos !== undefined) return (f) => f[pos];
    if (e.t === 'resumen') return compilarResumen(e, ctx, ctx.grupo);
    if (e.t === 'col') {
      const nombre = e.tabla ? `${e.tabla}.${e.nombre}` : e.nombre;
      throw fallo('agrupacion', `«${nombre}» no está en el GROUP BY`, {
        ...e,
        pista:
          ctx.grupo.posiciones.size === 0
            ? 'esta consulta devuelve una sola fila de resumen, así que no puede enseñar además el valor de una columna: ¿el de cuál de todas las filas sería?'
            : `cada fila del resultado es un grupo entero: o añades «${e.nombre}» al GROUP BY, o la resumes con COUNT, SUM, AVG, MIN o MAX`,
        familia: 'misuse of aggregate: column must appear in the GROUP BY clause',
      });
    }
  } else if (e.t === 'resumen') {
    throw fallo('agrupacion', `«${e.nombre}» resume varias filas y aquí sólo hay una`, {
      ...e,
      pista: 'los resúmenes van en el SELECT o en el HAVING de una consulta que agrupa',
    });
  }

  switch (e.t) {
    case 'num':
      return () => e.v;
    case 'txt':
      return () => e.v;
    case 'bool':
      return () => e.v;
    case 'nulo':
      return () => null;
    case 'col': {
      const i = resolverColumna(e, ctx.ambito);
      return (f) => f[i];
    }
    case 'neg': {
      const a = compilar(e.arg, ctx);
      return (f) => {
        const v = a(f);
        if (v === null) return null;
        if (typeof v !== 'number') throw noEsNumero(v, e);
        return -v;
      };
    }
    case 'y': {
      const a = compilar(e.izq, ctx);
      const b = compilar(e.der, ctx);
      return (f) => y(logico(a(f), e), logico(b(f), e));
    }
    case 'o': {
      const a = compilar(e.izq, ctx);
      const b = compilar(e.der, ctx);
      return (f) => o(logico(a(f), e), logico(b(f), e));
    }
    case 'no': {
      const a = compilar(e.arg, ctx);
      return (f) => no(logico(a(f), e));
    }
    case 'esNulo': {
      const a = compilar(e.arg, ctx);
      return e.negado ? (f) => a(f) !== null : (f) => a(f) === null;
    }
    case 'like': {
      const a = compilar(e.arg, ctx);
      const re = patronDeLike(e.patron);
      return (f) => {
        const v = a(f);
        if (v === null) return null;
        if (typeof v !== 'string') {
          throw fallo('tipo', `LIKE compara texto, y esto vale ${textoDeValorEnMensaje(v)}`, {
            ...e,
            pista: 'LIKE sólo se usa con columnas de texto',
          });
        }
        return e.negado ? !re.test(v) : re.test(v);
      };
    }
    case 'bin':
      return compilarBinaria(e, ctx);
  }
  /* Un `case 'resumen'` aquí no compila, y está bien que no compile: los dos
   * únicos sitios donde un resumen puede aparecer están arriba, y el tipo lo
   * sabe. Si alguien añade un nodo nuevo a `Expr`, este `switch` deja de ser
   * exhaustivo y `tsc` lo dice antes de que llegue a una clase. */
}

const COMPARADORES = new Set(['=', '<>', '<', '>', '<=', '>=']);

function compilarBinaria(e: Expr & { t: 'bin' }, ctx: Contexto): Eval {
  const a = compilar(e.izq, ctx);
  const b = compilar(e.der, ctx);

  if (!COMPARADORES.has(e.op)) {
    return (f) => aritmetica(e.op, a(f), b(f), e);
  }

  /* Comparar con NULL nunca es cierto ni falso, y escribir «= NULL» es la
   * trampa clásica: se avisa, no se corrige. La consulta es válida. */
  if (e.izq.t === 'nulo' || e.der.t === 'nulo') {
    ctx.avisos.push(
      `«${e.op} NULL» no es cierto nunca, ni siquiera para las casillas vacías: para preguntar por ellas se escribe IS NULL`,
    );
  }

  /* Si es «columna contra dato», el choque de tipos se caza aquí, antes de
   * mirar una sola fila, y el mensaje puede nombrar la columna y su tipo. */
  const est = choqueEstatico(e, ctx);
  if (est) throw est;

  const op = e.op;
  return (f) => {
    const x = a(f);
    const z = b(f);
    const c = comparar(x, z);
    if (c === null) return null;
    if (esIncomparable(c)) {
      throw fallo('tipo', `no se puede comparar ${nombreDeTipo(x)} con ${nombreDeTipo(z)}`, {
        ...e,
        pista: `a la izquierda hay ${textoDeValorEnMensaje(x)} y a la derecha ${textoDeValorEnMensaje(z)}`,
      });
    }
    switch (op) {
      case '=':
        return c === 0;
      case '<>':
        return c !== 0;
      case '<':
        return c < 0;
      case '<=':
        return c <= 0;
      case '>':
        return c > 0;
      default:
        return c >= 0;
    }
  };
}

/** `WHERE edad > 'doce'` — el error que más se escribe, dicho antes de correr. */
function choqueEstatico(e: Expr & { t: 'bin' }, ctx: Contexto): Tropiezo | null {
  const pares: [Expr, Expr][] = [
    [e.izq, e.der],
    [e.der, e.izq],
  ];
  for (const [uno, otro] of pares) {
    if (uno.t !== 'col') continue;
    const dato = otro.t === 'num' ? otro.v : otro.t === 'txt' ? otro.v : otro.t === 'bool' ? otro.v : undefined;
    if (dato === undefined) continue;
    const i = resolverColumna(uno, ctx.ambito);
    const col = columnaEn(ctx.ambito, i);
    if (familia(col.tipo) === familiaDeValor(dato)) continue;
    return fallo('tipo', `«${col.nombre}» guarda ${NOMBRE_DE_TIPO[col.tipo]} y ${textoDeValorEnMensaje(dato)} es ${nombreDeTipo(dato)}`, {
      ...e,
      pista:
        col.tipo === 'booleano'
          ? `«${col.nombre}» sólo vale TRUE o FALSE: escribe ${col.nombre} = TRUE`
          : col.tipo === 'fecha'
            ? `una fecha se compara con otra fecha, entre comillas y en año-mes-día: ${col.nombre} > '2013-01-01'`
            : familia(col.tipo) === 'numero'
              ? 'los números se comparan sin comillas: > 12, no > \'12\''
              : 'el texto se compara entre comillas simples',
    });
  }
  return null;
}

function compilarResumen(e: Expr & { t: 'resumen' }, ctx: Contexto, grupo: Grupo): Eval {
  const k = claveEstructural(e, ctx.ambito);
  let i = grupo.indices.get(k);
  if (i === undefined) {
    i = grupo.resumenes.length;
    grupo.indices.set(k, i);
    /* El argumento se calcula una vez por FILA, así que se compila en modo
     * fila: dentro de un COUNT(x) no puede haber otro COUNT. */
    const arg = e.arg ? compilar(e.arg, { ...ctx, grupo: null }) : null;
    if (e.arg && llevaResumen(e.arg)) {
      throw fallo('agrupacion', 'no se puede resumir un resumen', {
        ...e,
        pista: 'COUNT(SUM(x)) no significa nada: SUM ya devuelve un solo número por grupo',
      });
    }
    grupo.resumenes.push({ nombre: e.nombre, arg, sitio: { linea: e.linea, columna: e.columna } });
  }
  const pos = grupo.base + i;
  return (f) => f[pos];
}

/**
 * Las cinco funciones de resumen, y **`COUNT(*)` no es `COUNT(columna)`**.
 *
 * `COUNT(*)` cuenta filas: le da igual lo que haya dentro. `COUNT(nota)` cuenta
 * las notas que hay, y una casilla vacía no es una nota. Lo mismo vale para
 * `AVG`, que divide entre las que hay y no entre las filas: es la decisión que
 * el motor de hojas tomó con «vacío no es cero», y si no estuviera, el promedio
 * de un grupo con dos notas sin poner saldría más bajo de lo que es y nadie
 * sabría por qué.
 *
 * `SUM` de un grupo sin ningún valor da **NULL, no 0**: no es que la suma valga
 * cero, es que no hay nada que sumar. `COUNT` de ese mismo grupo sí da 0,
 * porque «cuántos hay» sí tiene respuesta.
 */
function acumular(plan: PlanResumen, filas: readonly Valor[][]): Valor {
  if (plan.nombre === 'COUNT' && plan.arg === null) return filas.length;
  const leer = plan.arg as Eval;

  if (plan.nombre === 'COUNT') {
    let n = 0;
    for (const f of filas) if (leer(f) !== null) n += 1;
    return n;
  }

  if (plan.nombre === 'MIN' || plan.nombre === 'MAX') {
    let mejor: Valor = null;
    for (const f of filas) {
      const v = leer(f);
      if (v === null) continue;
      if (mejor === null) {
        mejor = v;
        continue;
      }
      const c = comparar(v, mejor);
      if (c === null) continue;
      if (esIncomparable(c)) {
        throw fallo('tipo', `${plan.nombre} está comparando ${nombreDeTipo(v)} con ${nombreDeTipo(mejor)}`, {
          ...plan.sitio,
          pista: 'en esa columna hay valores de tipos distintos',
        });
      }
      if (plan.nombre === 'MIN' ? c < 0 : c > 0) mejor = v;
    }
    return mejor;
  }

  let suma = 0;
  let cuantos = 0;
  for (const f of filas) {
    const v = leer(f);
    if (v === null) continue;
    if (typeof v !== 'number') {
      throw fallo('tipo', `${plan.nombre} sólo trabaja con números, y ha encontrado ${nombreDeTipo(v)}`, {
        ...plan.sitio,
        pista: `${textoDeValorEnMensaje(v)} no se puede sumar. Para contar cuántos hay, usa COUNT`,
      });
    }
    suma += v;
    cuantos += 1;
  }
  if (cuantos === 0) return null; // no es cero: es que no hay nada
  return plan.nombre === 'SUM' ? suma : suma / cuantos;
}

/* ── resolver nombres ───────────────────────────────────────────────────────*/

function resolverColumna(e: Expr & { t: 'col' }, ambito: Ambito): number {
  const encontradas: { fuente: FuenteResuelta; indice: number }[] = [];
  for (const f of ambito.fuentes) {
    if (e.tabla !== null && plegar(e.tabla) !== plegar(f.alias)) continue;
    const i = indiceDeColumna(f.tabla, e.nombre);
    if (i >= 0) encontradas.push({ fuente: f, indice: f.desplazamiento + i });
  }

  if (encontradas.length === 1) return encontradas[0].indice;

  if (encontradas.length > 1) {
    throw fallo('columna', `«${e.nombre}» está en las dos tablas`, {
      ...e,
      pista: `di de cuál: ${ambito.fuentes.map((f) => `${f.alias}.${e.nombre}`).join(' o ')}`,
      familia: `ambiguous column name: ${e.nombre}`,
    });
  }

  if (e.tabla !== null && !ambito.fuentes.some((f) => plegar(f.alias) === plegar(e.tabla as string))) {
    throw fallo('tabla', `en esta consulta no hay ninguna tabla llamada «${e.tabla}»`, {
      ...e,
      pista: pistaDeLista(
        'aquí estás consultando',
        e.tabla,
        ambito.fuentes.map((f) => f.alias),
      ),
      familia: `no such column: ${e.tabla}.${e.nombre}`,
    });
  }

  const todas = ambito.fuentes.flatMap((f) =>
    f.tabla.columnas.map((c) => (ambito.fuentes.length > 1 ? `${f.alias}.${c.nombre}` : c.nombre)),
  );
  throw fallo('columna', `no existe ninguna columna llamada «${e.nombre}»`, {
    ...e,
    pista: pistaDeLista('las que hay son', e.nombre, todas),
    familia: `no such column: ${e.nombre}`,
  });
}

function columnaEn(ambito: Ambito, indice: number): Columna {
  for (const f of ambito.fuentes) {
    const i = indice - f.desplazamiento;
    if (i >= 0 && i < f.tabla.columnas.length) return f.tabla.columnas[i];
  }
  /* Inalcanzable: el índice sale siempre de `resolverColumna`. */
  throw fallo('columna', 'columna fuera de sitio', { linea: 0, columna: null });
}

function tipoDe(e: Expr, ctx: Contexto): TipoColumna | null {
  if (e.t !== 'col') return null;
  try {
    return columnaEn(ctx.ambito, resolverColumna(e, ctx.ambito)).tipo;
  } catch {
    return null;
  }
}

/**
 * La firma de una expresión, con las columnas ya resueltas a su sitio.
 *
 * Es lo que permite que `GROUP BY g.nombre` case con el `SELECT grupos.nombre`
 * de arriba aunque estén escritos distinto, y que `COUNT(*)` que sale en el
 * SELECT y en el HAVING se calcule **una sola vez**.
 */
function claveEstructural(e: Expr, ambito: Ambito): string {
  switch (e.t) {
    case 'col':
      return `#${resolverColumna(e, ambito)}`;
    case 'num':
      return `n${e.v}`;
    case 'txt':
      return `t${e.v}`;
    case 'bool':
      return `b${e.v}`;
    case 'nulo':
      return 'null';
    case 'bin':
      return `(${claveEstructural(e.izq, ambito)}${e.op}${claveEstructural(e.der, ambito)})`;
    case 'neg':
      return `(-${claveEstructural(e.arg, ambito)})`;
    case 'y':
      return `(${claveEstructural(e.izq, ambito)}&${claveEstructural(e.der, ambito)})`;
    case 'o':
      return `(${claveEstructural(e.izq, ambito)}|${claveEstructural(e.der, ambito)})`;
    case 'no':
      return `(!${claveEstructural(e.arg, ambito)})`;
    case 'esNulo':
      return `(${claveEstructural(e.arg, ambito)} is${e.negado ? 'not' : ''}null)`;
    case 'like':
      return `(${claveEstructural(e.arg, ambito)} like${e.negado ? 'not' : ''} ${e.patron})`;
    case 'resumen':
      return `${e.nombre}(${e.arg ? claveEstructural(e.arg, ambito) : '*'})`;
  }
}

function resolverFuente(base: Base, f: Fuente, desplazamiento: number): FuenteResuelta {
  const tabla = exigeTabla(base, f.tabla, f);
  return { alias: f.alias ?? tabla.nombre, tabla, desplazamiento };
}

function exigeTabla(base: Base, nombre: string, sitio: Sitio): Tabla {
  const t = tablaPorNombre(base, nombre);
  if (t) return t;
  throw fallo('tabla', `no existe ninguna tabla llamada «${nombre}»`, {
    ...sitio,
    pista: pistaDeLista(
      `en esta base hay ${base.tablas.length}:`,
      nombre,
      base.tablas.map((x) => x.nombre),
    ),
    familia: `no such table: ${nombre}`,
  });
}

function sinColumna(tabla: Tabla, nombre: string, sitio: Sitio): Tropiezo {
  return fallo('columna', `«${tabla.nombre}» no tiene ninguna columna llamada «${nombre}»`, {
    ...sitio,
    pista: pistaDeLista(
      `«${tabla.nombre}» tiene`,
      nombre,
      tabla.columnas.map((c) => c.nombre),
    ),
    familia: `no such column: ${nombre}`,
  });
}

/* ── aritmética ─────────────────────────────────────────────────────────────*/

function aritmetica(op: string, a: Valor, b: Valor, sitio: Sitio): Valor {
  if (a === null || b === null) return null; // cuenta con un dato que falta: no se sabe
  if (typeof a !== 'number') throw noEsNumero(a, sitio);
  if (typeof b !== 'number') throw noEsNumero(b, sitio);
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    default:
      if (b === 0) {
        throw fallo('valor', 'no se puede dividir entre cero', {
          ...sitio,
          pista: 'un motor de verdad devuelve NULL aquí y el cero se pierde de vista dentro del promedio; aquí se para y se dice',
          familia: 'division by zero',
        });
      }
      return a / b;
  }
}

function noEsNumero(v: Valor, sitio: Sitio): Tropiezo {
  return fallo('tipo', `no se puede hacer una cuenta con ${nombreDeTipo(v)}`, {
    ...sitio,
    pista: `${textoDeValorEnMensaje(v)} no es un número`,
  });
}

function logico(v: Valor, sitio: Sitio): Logico {
  if (v === null || typeof v === 'boolean') return v;
  throw fallo('tipo', `AND, OR y NOT unen condiciones, y esto vale ${textoDeValorEnMensaje(v)}`, {
    ...sitio,
    pista: 'cada lado tiene que ser una comparación: edad > 12 AND grupo = \'A\'',
  });
}

/* ── restricciones ──────────────────────────────────────────────────────────*/

function conTabla(base: Base, tabla: Tabla): Base {
  const p = plegar(tabla.nombre);
  return { tablas: base.tablas.map((t) => (plegar(t.nombre) === p ? tabla : t)) };
}

/** Clave primaria única, `NOT NULL` respetado y claves foráneas que existen. */
function validarTabla(base: Base, tabla: Tabla, sitio: Sitio): void {
  const clave = tabla.columnas.findIndex((c) => c.clavePrimaria);
  if (clave >= 0) {
    const vistas = new Set<Valor>();
    for (const f of tabla.filas) {
      const v = f[clave];
      if (vistas.has(v)) {
        throw fallo('restriccion', `ya hay una fila con ${tabla.columnas[clave].nombre} = ${textoDeValor(v)}`, {
          ...sitio,
          pista: 'una clave primaria no se puede repetir: es lo que distingue una fila de todas las demás',
          familia: `UNIQUE constraint failed: ${tabla.nombre}.${tabla.columnas[clave].nombre}`,
        });
      }
      vistas.add(v);
    }
  }

  tabla.columnas.forEach((c, i) => {
    if (!c.referencia) return;
    const destino = tablaPorNombre(base, c.referencia.tabla);
    if (!destino) return;
    const j = indiceDeColumna(destino, c.referencia.columna);
    if (j < 0) return;
    const validos = new Set(destino.filas.map((f) => f[j]));
    for (const f of tabla.filas) {
      const v = f[i];
      if (v === null) continue; // una relación opcional se deja vacía, no se inventa
      if (!validos.has(v)) {
        const muestra = [...validos].slice(0, 8).map(textoDeValor);
        throw fallo('restriccion', `«${c.nombre}» = ${textoDeValor(v)} no existe en «${destino.nombre}»`, {
          ...sitio,
          pista:
            validos.size === 0
              ? `«${destino.nombre}» todavía está vacía: primero se llena la tabla a la que se apunta`
              : `en «${destino.nombre}.${destino.columnas[j].nombre}» hay: ${muestra.join(', ')}${validos.size > 8 ? '…' : ''}`,
          familia: 'FOREIGN KEY constraint failed',
        });
      }
    }
  });
}

/** Un `UPDATE` que cambia una clave primaria deja hijas apuntando a la nada. */
function comprobarHijasHuerfanas(base: Base, antes: Tabla, despues: Tabla, sitio: Sitio): void {
  const clave = antes.columnas.findIndex((c) => c.clavePrimaria);
  if (clave < 0) return;
  const siguen = new Set(despues.filas.map((f) => f[clave]));
  for (const hija of hijasDe(base, antes.nombre)) {
    if (plegar(hija.tabla.nombre) === plegar(antes.nombre)) continue;
    for (const f of hija.tabla.filas) {
      const v = f[hija.indice];
      if (v !== null && !siguen.has(v)) {
        throw fallo('restriccion', `«${hija.tabla.nombre}» apunta a ${antes.columnas[clave].nombre} = ${textoDeValor(v)} y ese valor ya no existe`, {
          ...sitio,
          pista: 'al cambiar una clave primaria hay que cambiar también las filas que la usan',
          familia: 'FOREIGN KEY constraint failed',
        });
      }
    }
  }
}

/* ── lo que se lleva el resultado a otra ventana ────────────────────────────*/

/**
 * El resultado como matriz de valores, con los nombres de columna arriba.
 *
 * Existe por la fila 89 del canon —«la consulta aterriza en la hoja»—, y
 * devuelve **valores, no texto**, a propósito: si `aMatriz` devolviera cadenas,
 * la hoja de cálculo recibiría `"12"` en vez de `12` y ninguna suma de la hoja
 * funcionaría. Quien lo pinte en una rejilla que use `textoDeValor`.
 */
export function aMatriz(r: Resultado): Valor[][] {
  return [r.columnas.map((c) => c.nombre), ...r.filas];
}

/** El resultado como texto, para la consola de la clase y para las pruebas. */
export function aTexto(r: Resultado): string {
  if (r.clase !== 'consulta') return r.avisos.join('\n');
  const lineas = [r.columnas.map((c) => c.nombre).join(' | ')];
  for (const f of r.filas) lineas.push(f.map(textoDeValor).join(' | '));
  return lineas.join('\n');
}

function familia(t: TipoColumna): 'numero' | 'texto' | 'logico' {
  if (t === 'entero' || t === 'real') return 'numero';
  if (t === 'booleano') return 'logico';
  return 'texto';
}

function familiaDeValor(v: Valor): 'numero' | 'texto' | 'logico' | null {
  if (typeof v === 'number') return 'numero';
  if (typeof v === 'string') return 'texto';
  if (typeof v === 'boolean') return 'logico';
  return null;
}
