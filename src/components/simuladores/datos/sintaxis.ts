/**
 * Tecnia Datos · `sintaxis.ts` — de fichas a árbol.
 *
 * Tercera de las siete piezas. Descenso recursivo, un nivel por precedencia,
 * exactamente como `formula/sintaxis.ts`, y por dentro una sola excepción
 * —`Tropiezo`— para salir de la recursión, que **no cruza la puerta**: la
 * atrapa `analizarGuion` y la devuelve como dato.
 *
 * De menos a más apretado:
 *
 *   OR
 *   AND
 *   NOT
 *   comparación   =  <>  !=  <  >  <=  >=  ·  IS [NOT] NULL  ·  [NOT] LIKE
 *   suma          +  −
 *   producto      *  /
 *   negación      −x
 *
 * ── Lo único que este archivo hace además de analizar ───────────────────────
 *
 * **Enseñar cuando falla.** Cada error de sintaxis pasa por `este.tropiezo()`,
 * y ahí se mira primero si la palabra que estorba está en
 * `PALABRAS_PROHIBIDAS`: si el alumno escribió `DISTINCT`, `IN`, `LEFT JOIN` o
 * `ROLLBACK`, lo que lee no es «se esperaba FROM», es la frase que explica por
 * qué eso no está y con qué se escribe aquí. Es la misma tabla y el mismo
 * mecanismo que `codigo/subconjunto.ts` montó para `import` y `class`.
 *
 * Y tres errores que este archivo se inventa porque un motor de verdad no los
 * da y valen una clase entera:
 *
 * - **la coma de más** — `SELECT nombre, FROM alumnos` dice «sobra una coma
 *   antes de FROM», no «near FROM: syntax error»;
 * - **la coma que falta** — `SELECT nombre apellido FROM alumnos` es SQL válido
 *   de verdad (renombra la columna) y aquí es un error que pregunta si falta la
 *   coma. Es la desviación 4 del subconjunto;
 * - **la coma entre tablas** — `FROM alumnos, grupos` explica que eso cruza
 *   cada fila con todas las de la otra tabla, y que una unión lleva su `ON`.
 */

import { fallo, pistaDeLista, Tropiezo, type ErrorSQL } from './errores';
import { analizar, type Ficha } from './lexico';
import type { TipoColumna } from './modelo';
import { PALABRAS_PROHIBIDAS, RESUMENES, TIPOS, TOPES } from './subconjunto';

export interface Sitio {
  linea: number;
  columna: number;
}

export type OpBin = '=' | '<>' | '<' | '>' | '<=' | '>=' | '+' | '-' | '*' | '/';

export type Expr = Sitio &
  (
    | { t: 'num'; v: number }
    | { t: 'txt'; v: string }
    | { t: 'bool'; v: boolean }
    | { t: 'nulo' }
    | { t: 'col'; tabla: string | null; nombre: string }
    | { t: 'bin'; op: OpBin; izq: Expr; der: Expr }
    | { t: 'neg'; arg: Expr }
    | { t: 'y'; izq: Expr; der: Expr }
    | { t: 'o'; izq: Expr; der: Expr }
    | { t: 'no'; arg: Expr }
    | { t: 'esNulo'; arg: Expr; negado: boolean }
    | { t: 'like'; arg: Expr; patron: string; negado: boolean }
    | { t: 'resumen'; nombre: string; arg: Expr | null }
  );

export interface DefColumna extends Sitio {
  nombre: string;
  tipo: TipoColumna;
  clavePrimaria: boolean;
  noNulo: boolean;
  referencia: { tabla: string; columna: string } | null;
}

export interface Fuente extends Sitio {
  tabla: string;
  alias: string | null;
}

export type ItemSel = Sitio & ({ t: 'todas' } | { t: 'expr'; expr: Expr; alias: string | null });

export interface ClaveOrden {
  expr: Expr;
  desc: boolean;
}

export type Sent = Sitio &
  (
    | { t: 'create'; tabla: string; columnas: DefColumna[] }
    | { t: 'insert'; tabla: string; columnas: string[] | null; tuplas: Expr[][] }
    | { t: 'update'; tabla: string; asignaciones: { columna: string; valor: Expr; sitio: Sitio }[]; donde: Expr | null }
    | { t: 'delete'; tabla: string; donde: Expr | null }
    | {
        t: 'select';
        items: ItemSel[];
        de: Fuente;
        union: { fuente: Fuente; on: Expr } | null;
        donde: Expr | null;
        agrupar: Expr[];
        teniendo: Expr | null;
        orden: ClaveOrden[];
        limite: number | null;
      }
  );

export type Analisis = { ok: true; sentencias: Sent[] } | { ok: false; error: ErrorSQL };

export function analizarGuion(sql: string): Analisis {
  if (sql.length > TOPES.TEXTO) {
    return {
      ok: false,
      error: fallo('limite', 'la consulta es demasiado larga', { linea: 1, columna: 1 }).detalle,
    };
  }
  const lectura = analizar(sql);
  if (!lectura.ok) return lectura;

  const p = new Analizador(lectura.fichas);
  try {
    return { ok: true, sentencias: p.guion() };
  } catch (e) {
    if (e instanceof Tropiezo) return { ok: false, error: e.detalle };
    throw e;
  }
}

const COMPARADORES: readonly string[] = ['=', '<>', '!=', '<', '>', '<=', '>='];

/** Las palabras que cierran una lista de columnas o de tablas. */
const CIERRAN = new Set(['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'JOIN', 'INNER', 'ON', 'SET', 'VALUES']);

class Analizador {
  private i = 0;

  constructor(private readonly fichas: Ficha[]) {}

  /* ── ayudas ─────────────────────────────────────────────────────────────*/

  private mirar(salto = 0): Ficha {
    return this.fichas[Math.min(this.i + salto, this.fichas.length - 1)];
  }

  private come(): Ficha {
    const f = this.mirar();
    if (f.tipo !== 'fin') this.i += 1;
    return f;
  }

  private esPalabra(alto: string, salto = 0): boolean {
    const f = this.mirar(salto);
    return f.tipo === 'nombre' && f.alto === alto;
  }

  private comePalabra(alto: string): boolean {
    if (!this.esPalabra(alto)) return false;
    this.i += 1;
    return true;
  }

  private exigePalabra(alto: string, mensaje: string, pista?: string): void {
    if (!this.comePalabra(alto)) throw this.tropiezo(mensaje, this.mirar(), pista);
  }

  private exige(tipo: Ficha['tipo'], mensaje: string, pista?: string): Ficha {
    const f = this.mirar();
    if (f.tipo !== tipo) throw this.tropiezo(mensaje, f, pista);
    return this.come();
  }

  /**
   * El único sitio por donde sale un error de sintaxis, y por eso el único
   * sitio donde hace falta acordarse de `PALABRAS_PROHIBIDAS`.
   */
  private tropiezo(mensaje: string, f: Ficha, pista?: string, clase: 'sintaxis' = 'sintaxis'): Tropiezo {
    const prohibida = f.tipo === 'nombre' ? PALABRAS_PROHIBIDAS[f.alto] : undefined;
    if (prohibida) {
      return fallo(clase, `aquí no se puede usar «${f.alto}»`, {
        linea: f.linea,
        columna: f.columna,
        pista: prohibida,
        familia: `near "${f.texto}": syntax error`,
      });
    }
    /* Los mensajes se leen igual de bien al final del texto que en medio —«falta
     * cerrar el paréntesis» dice lo mismo—, así que el final no se traga el
     * mensaje: sólo cambia la familia. Sin esto, `SELECT nombre` a secas decía
     * «la consulta se acaba antes de tiempo», que es verdad y no enseña nada. */
    const texto =
      mensaje !== '' ? mensaje : f.tipo === 'fin' ? 'la consulta se acaba antes de tiempo' : `«${f.texto}» no puede ir aquí`;
    return fallo(clase, texto, {
      linea: f.linea,
      columna: f.columna,
      pista,
      familia: f.tipo === 'fin' ? 'incomplete input' : `near "${f.texto}": syntax error`,
    });
  }

  /** Un nombre de tabla, de columna o de alias. */
  private nombre(que: string): Ficha {
    const f = this.mirar();
    if (f.tipo !== 'nombre' || PALABRAS_PROHIBIDAS[f.alto]) {
      throw this.tropiezo(`aquí va ${que}`, f);
    }
    return this.come();
  }

  private sitio(f: Ficha): Sitio {
    return { linea: f.linea, columna: f.columna };
  }

  /* ── el guion ───────────────────────────────────────────────────────────*/

  guion(): Sent[] {
    const sentencias: Sent[] = [];
    for (;;) {
      while (this.mirar().tipo === 'puntoYComa') this.come();
      if (this.mirar().tipo === 'fin') break;
      if (sentencias.length >= TOPES.SENTENCIAS) {
        throw this.tropiezo('el guion tiene demasiadas instrucciones', this.mirar());
      }
      sentencias.push(this.sentencia());
      const f = this.mirar();
      if (f.tipo === 'fin') break;
      if (f.tipo !== 'puntoYComa') {
        throw this.tropiezo(`sobra «${f.texto}» al final de la instrucción`, f, 'cada instrucción termina en «;»');
      }
    }
    if (sentencias.length === 0) {
      throw fallo('sintaxis', 'no has escrito ninguna instrucción', {
        linea: 1,
        columna: 1,
        pista: 'una consulta empieza por SELECT; para crear una tabla, por CREATE TABLE',
        familia: 'empty input',
      });
    }
    return sentencias;
  }

  private sentencia(): Sent {
    const f = this.mirar();
    if (f.tipo === 'nombre') {
      switch (f.alto) {
        case 'CREATE':
          return this.create();
        case 'INSERT':
          return this.insert();
        case 'UPDATE':
          return this.update();
        case 'DELETE':
          return this.borrar();
        case 'SELECT':
          return this.select();
        default:
          break;
      }
    }
    throw this.tropiezo(
      `«${f.texto}» no empieza ninguna instrucción`,
      f,
      'las instrucciones empiezan por CREATE TABLE, INSERT, SELECT, UPDATE o DELETE',
    );
  }

  /* ── CREATE TABLE ───────────────────────────────────────────────────────*/

  private create(): Sent {
    const inicio = this.come(); // CREATE
    this.exigePalabra('TABLE', 'después de CREATE va TABLE', 'se escribe: CREATE TABLE alumnos (...)');
    const nombre = this.nombre('el nombre de la tabla');
    this.exige('abre', 'después del nombre de la tabla va un paréntesis con sus columnas');

    const columnas: DefColumna[] = [];
    for (;;) {
      if (this.esPalabra('FOREIGN')) {
        this.definicionForanea(columnas);
      } else {
        columnas.push(this.definicionDeColumna());
      }
      if (this.mirar().tipo === 'coma') {
        this.come();
        if (this.mirar().tipo === 'cierra') {
          throw this.tropiezo('sobra una coma antes del paréntesis', this.mirar());
        }
        continue;
      }
      break;
    }
    this.exige('cierra', 'falta cerrar el paréntesis de las columnas');
    return { t: 'create', tabla: nombre.texto, columnas, ...this.sitio(inicio) };
  }

  private definicionDeColumna(): DefColumna {
    const nombre = this.nombre('el nombre de una columna');
    const ft = this.mirar();
    if (ft.tipo !== 'nombre' || !TIPOS[ft.alto]) {
      throw this.tropiezo(
        ft.tipo === 'nombre' ? `«${ft.texto}» no es un tipo de dato` : 'después del nombre de la columna va su tipo',
        ft,
        pistaDeLista('los tipos son', ft.alto, ['INTEGER', 'REAL', 'TEXT', 'DATE', 'BOOLEAN']),
      );
    }
    this.come();
    const def: DefColumna = {
      nombre: nombre.texto,
      tipo: TIPOS[ft.alto],
      clavePrimaria: false,
      noNulo: false,
      referencia: null,
      ...this.sitio(nombre),
    };

    for (;;) {
      if (this.comePalabra('PRIMARY')) {
        this.exigePalabra('KEY', 'después de PRIMARY va KEY');
        def.clavePrimaria = true;
        def.noNulo = true; // una clave primaria nunca puede quedar vacía
        continue;
      }
      if (this.esPalabra('NOT') && this.esPalabra('NULL', 1)) {
        this.come();
        this.come();
        def.noNulo = true;
        continue;
      }
      if (this.comePalabra('REFERENCES')) {
        def.referencia = this.destinoDeReferencia();
        continue;
      }
      const f = this.mirar();
      if (f.tipo === 'nombre' && PALABRAS_PROHIBIDAS[f.alto]) throw this.tropiezo('', f);
      break;
    }
    return def;
  }

  /** `REFERENCES grupos(id)` — el paréntesis con la columna es obligatorio. */
  private destinoDeReferencia(): { tabla: string; columna: string } {
    const tabla = this.nombre('el nombre de la tabla a la que apunta');
    this.exige(
      'abre',
      'después de REFERENCES va la tabla y, entre paréntesis, su columna',
      'se escribe: REFERENCES grupos(id)',
    );
    const columna = this.nombre('el nombre de la columna a la que apunta');
    this.exige('cierra', 'falta cerrar el paréntesis de REFERENCES');
    return { tabla: tabla.texto, columna: columna.texto };
  }

  /** La forma larga: `FOREIGN KEY (grupo_id) REFERENCES grupos(id)`. */
  private definicionForanea(columnas: DefColumna[]): void {
    this.come(); // FOREIGN
    this.exigePalabra('KEY', 'después de FOREIGN va KEY');
    this.exige('abre', 'después de FOREIGN KEY va, entre paréntesis, la columna de esta tabla');
    const cual = this.nombre('el nombre de una columna de esta tabla');
    this.exige('cierra', 'falta cerrar el paréntesis de FOREIGN KEY');
    this.exigePalabra('REFERENCES', 'después de FOREIGN KEY (…) va REFERENCES');
    const destino = this.destinoDeReferencia();

    const def = columnas.find((c) => c.nombre.toLowerCase() === cual.texto.toLowerCase());
    if (!def) {
      throw this.tropiezo(
        `esta tabla no tiene ninguna columna llamada «${cual.texto}»`,
        cual,
        pistaDeLista(
          'las columnas que has escrito son',
          cual.texto,
          columnas.map((c) => c.nombre),
        ),
        'sintaxis',
      );
    }
    def.referencia = destino;
  }

  /* ── INSERT ─────────────────────────────────────────────────────────────*/

  private insert(): Sent {
    const inicio = this.come(); // INSERT
    this.exigePalabra('INTO', 'después de INSERT va INTO', 'se escribe: INSERT INTO alumnos VALUES (1, \'Ana\')');
    const tabla = this.nombre('el nombre de la tabla');

    let columnas: string[] | null = null;
    if (this.mirar().tipo === 'abre') {
      this.come();
      columnas = [];
      for (;;) {
        columnas.push(this.nombre('el nombre de una columna').texto);
        if (this.mirar().tipo === 'coma') {
          this.come();
          continue;
        }
        break;
      }
      this.exige('cierra', 'falta cerrar el paréntesis de las columnas');
    }

    this.exigePalabra(
      'VALUES',
      'después de la tabla va VALUES con los datos',
      'se escribe: INSERT INTO alumnos (id, nombre) VALUES (1, \'Ana\')',
    );

    const tuplas: Expr[][] = [];
    for (;;) {
      this.exige('abre', 'cada fila de VALUES va entre paréntesis');
      const fila: Expr[] = [];
      for (;;) {
        fila.push(this.expresion());
        if (this.mirar().tipo === 'coma') {
          this.come();
          if (this.mirar().tipo === 'cierra') throw this.tropiezo('sobra una coma antes del paréntesis', this.mirar());
          continue;
        }
        break;
      }
      this.exige('cierra', 'falta cerrar el paréntesis de esta fila');
      tuplas.push(fila);
      if (this.mirar().tipo === 'coma') {
        this.come();
        continue;
      }
      break;
    }
    return { t: 'insert', tabla: tabla.texto, columnas, tuplas, ...this.sitio(inicio) };
  }

  /* ── UPDATE ─────────────────────────────────────────────────────────────*/

  private update(): Sent {
    const inicio = this.come(); // UPDATE
    const tabla = this.nombre('el nombre de la tabla');
    this.exigePalabra('SET', 'después de la tabla va SET', 'se escribe: UPDATE alumnos SET edad = 13 WHERE id = 1');

    const asignaciones: { columna: string; valor: Expr; sitio: Sitio }[] = [];
    for (;;) {
      const col = this.nombre('el nombre de la columna que quieres cambiar');
      const ig = this.mirar();
      if (ig.tipo !== 'operador' || ig.texto !== '=') {
        throw this.tropiezo('después de la columna va un «=» y el valor nuevo', ig);
      }
      this.come();
      asignaciones.push({ columna: col.texto, valor: this.expresion(), sitio: this.sitio(col) });
      if (this.mirar().tipo === 'coma') {
        this.come();
        continue;
      }
      break;
    }

    const donde = this.comePalabra('WHERE') ? this.expresion() : null;
    return { t: 'update', tabla: tabla.texto, asignaciones, donde, ...this.sitio(inicio) };
  }

  /* ── DELETE ─────────────────────────────────────────────────────────────*/

  private borrar(): Sent {
    const inicio = this.come(); // DELETE
    this.exigePalabra('FROM', 'después de DELETE va FROM', 'se escribe: DELETE FROM alumnos WHERE id = 3');
    const tabla = this.nombre('el nombre de la tabla');
    const donde = this.comePalabra('WHERE') ? this.expresion() : null;
    return { t: 'delete', tabla: tabla.texto, donde, ...this.sitio(inicio) };
  }

  /* ── SELECT ─────────────────────────────────────────────────────────────*/

  private select(): Sent {
    const inicio = this.come(); // SELECT
    const items = this.itemsDeSeleccion();

    if (!this.esPalabra('FROM')) {
      throw this.tropiezo('falta decir de qué tabla salen los datos', this.mirar(), 'después de las columnas va FROM y el nombre de la tabla: SELECT nombre FROM alumnos');
    }
    this.come();
    const de = this.fuente();

    let union: { fuente: Fuente; on: Expr } | null = null;
    if (this.mirar().tipo === 'coma') {
      throw this.tropiezo(
        'aquí dos tablas no se juntan con una coma',
        this.mirar(),
        'una coma entre tablas cruza cada fila con todas las de la otra; se escribe JOIN grupos ON alumnos.grupo_id = grupos.id',
      );
    }
    this.comePalabra('INNER');
    if (this.comePalabra('JOIN')) {
      const fuente = this.fuente();
      this.exigePalabra('ON', 'después de la tabla de JOIN va ON y la condición que las une', 'se escribe: JOIN grupos ON alumnos.grupo_id = grupos.id');
      union = { fuente, on: this.expresion() };
    }

    const donde = this.comePalabra('WHERE') ? this.expresion() : null;

    const agrupar: Expr[] = [];
    if (this.comePalabra('GROUP')) {
      this.exigePalabra('BY', 'después de GROUP va BY');
      for (;;) {
        agrupar.push(this.expresion());
        if (this.mirar().tipo === 'coma') {
          this.come();
          continue;
        }
        break;
      }
    }

    const teniendo = this.comePalabra('HAVING') ? this.expresion() : null;

    const orden: ClaveOrden[] = [];
    if (this.comePalabra('ORDER')) {
      this.exigePalabra('BY', 'después de ORDER va BY', 'se escribe: ORDER BY edad DESC');
      for (;;) {
        const expr = this.expresion();
        let desc = false;
        if (this.comePalabra('DESC')) desc = true;
        else this.comePalabra('ASC');
        orden.push({ expr, desc });
        if (this.mirar().tipo === 'coma') {
          this.come();
          continue;
        }
        break;
      }
    }

    let limite: number | null = null;
    if (this.comePalabra('LIMIT')) {
      const f = this.mirar();
      if (f.tipo !== 'numero' || f.numero === undefined || !Number.isInteger(f.numero) || f.numero < 0) {
        throw this.tropiezo('después de LIMIT va un número entero de filas', f, 'se escribe: LIMIT 10');
      }
      this.come();
      limite = f.numero;
    }

    return { t: 'select', items, de, union, donde, agrupar, teniendo, orden, limite, ...this.sitio(inicio) };
  }

  private itemsDeSeleccion(): ItemSel[] {
    const items: ItemSel[] = [];
    for (;;) {
      const f = this.mirar();
      if (f.tipo === 'operador' && f.texto === '*') {
        this.come();
        items.push({ t: 'todas', ...this.sitio(f) });
      } else {
        if (f.tipo === 'nombre' && CIERRAN.has(f.alto)) {
          throw items.length === 0
            ? this.tropiezo('falta decir qué columnas quieres', f, 'se escribe: SELECT nombre, edad FROM alumnos, o SELECT * para todas')
            : this.tropiezo(`sobra una coma antes de ${f.alto}`, f, 'entre dos columnas va una coma; antes de FROM, ninguna');
        }
        const expr = this.expresion();
        let alias: string | null = null;
        if (this.comePalabra('AS')) alias = this.nombre('el nombre nuevo de la columna').texto;
        else this.avisarDeAliasSinAs(expr);
        items.push({ t: 'expr', expr, alias, ...this.sitio(f) });
      }
      if (this.mirar().tipo === 'coma') {
        this.come();
        continue;
      }
      break;
    }
    return items;
  }

  /** La desviación 4 del subconjunto: aquí `SELECT a b` es la coma que falta. */
  private avisarDeAliasSinAs(expr: Expr): void {
    const f = this.mirar();
    if (f.tipo !== 'nombre' || CIERRAN.has(f.alto)) return;
    const antes = expr.t === 'col' ? expr.nombre : 'lo anterior';
    throw this.tropiezo(
      `falta una coma entre «${antes}» y «${f.texto}»`,
      f,
      `si querías dos columnas, sepáralas con una coma; si querías renombrar «${antes}», escribe AS: ${antes} AS ${f.texto}`,
    );
  }

  private fuente(): Fuente {
    const f = this.mirar();
    if (f.tipo === 'abre') {
      throw this.tropiezo(
        'aquí no se pueden meter consultas dentro de otras',
        f,
        'ejecuta la consulta de dentro, mira su resultado, y escribe la de fuera con lo que te haya salido',
      );
    }
    const nombre = this.nombre('el nombre de la tabla');
    let alias: string | null = null;
    const sig = this.mirar();
    if (this.comePalabra('AS')) alias = this.nombre('el alias de la tabla').texto;
    else if (sig.tipo === 'nombre' && !CIERRAN.has(sig.alto) && !PALABRAS_PROHIBIDAS[sig.alto]) {
      this.come();
      alias = sig.texto;
    } else if (sig.tipo === 'nombre' && PALABRAS_PROHIBIDAS[sig.alto]) {
      throw this.tropiezo('', sig);
    }
    return { tabla: nombre.texto, alias, ...this.sitio(nombre) };
  }

  /* ── expresiones ────────────────────────────────────────────────────────*/

  expresion(): Expr {
    return this.disyuncion();
  }

  private disyuncion(): Expr {
    let izq = this.conjuncion();
    while (this.esPalabra('OR')) {
      const f = this.come();
      izq = { t: 'o', izq, der: this.conjuncion(), ...this.sitio(f) };
    }
    return izq;
  }

  private conjuncion(): Expr {
    let izq = this.negacionLogica();
    while (this.esPalabra('AND')) {
      const f = this.come();
      izq = { t: 'y', izq, der: this.negacionLogica(), ...this.sitio(f) };
    }
    return izq;
  }

  private negacionLogica(): Expr {
    if (this.esPalabra('NOT') && !this.esPalabra('NULL', 1)) {
      const f = this.come();
      return { t: 'no', arg: this.negacionLogica(), ...this.sitio(f) };
    }
    return this.comparacion();
  }

  private comparacion(): Expr {
    const izq = this.suma();
    const f = this.mirar();

    if (f.tipo === 'nombre' && f.alto === 'IS') {
      this.come();
      const negado = this.comePalabra('NOT');
      this.exigePalabra(
        'NULL',
        'después de IS va NULL',
        'para preguntar si una casilla está vacía se escribe: nota IS NULL, o nota IS NOT NULL',
      );
      return { t: 'esNulo', arg: izq, negado, ...this.sitio(f) };
    }

    if (f.tipo === 'nombre' && (f.alto === 'LIKE' || (f.alto === 'NOT' && this.esPalabra('LIKE', 1)))) {
      const negado = f.alto === 'NOT';
      this.come();
      if (negado) this.come();
      const p = this.mirar();
      if (p.tipo !== 'texto') {
        throw this.tropiezo(
          'después de LIKE va un patrón entre comillas',
          p,
          "«%» vale por cualquier cosa y «_» por una letra: LIKE 'A%' son los que empiezan por A",
        );
      }
      this.come();
      return { t: 'like', arg: izq, patron: p.cadena ?? '', negado, ...this.sitio(f) };
    }

    if (f.tipo === 'operador' && COMPARADORES.includes(f.texto)) {
      this.come();
      const der = this.suma();
      const sig = this.mirar();
      if (sig.tipo === 'operador' && COMPARADORES.includes(sig.texto)) {
        throw this.tropiezo(
          'no se pueden encadenar dos comparaciones',
          sig,
          'escríbelas por separado y únelas con AND: edad >= 12 AND edad <= 15',
        );
      }
      const op = (f.texto === '!=' ? '<>' : f.texto) as OpBin;
      return { t: 'bin', op, izq, der, ...this.sitio(f) };
    }

    if (f.tipo === 'nombre' && PALABRAS_PROHIBIDAS[f.alto]) throw this.tropiezo('', f);
    return izq;
  }

  private suma(): Expr {
    let izq = this.producto();
    for (;;) {
      const f = this.mirar();
      if (f.tipo !== 'operador' || (f.texto !== '+' && f.texto !== '-')) return izq;
      this.come();
      izq = { t: 'bin', op: f.texto as OpBin, izq, der: this.producto(), ...this.sitio(f) };
    }
  }

  private producto(): Expr {
    let izq = this.unario();
    for (;;) {
      const f = this.mirar();
      if (f.tipo !== 'operador' || (f.texto !== '*' && f.texto !== '/')) return izq;
      this.come();
      izq = { t: 'bin', op: f.texto as OpBin, izq, der: this.unario(), ...this.sitio(f) };
    }
  }

  private unario(): Expr {
    const f = this.mirar();
    if (f.tipo === 'operador' && f.texto === '-') {
      this.come();
      return { t: 'neg', arg: this.unario(), ...this.sitio(f) };
    }
    return this.primario();
  }

  private primario(): Expr {
    const f = this.come();
    const sitio = this.sitio(f);

    if (f.tipo === 'numero') return { t: 'num', v: f.numero ?? 0, ...sitio };
    if (f.tipo === 'texto') return { t: 'txt', v: f.cadena ?? '', ...sitio };

    if (f.tipo === 'abre') {
      if (this.esPalabra('SELECT')) {
        throw this.tropiezo(
          'aquí no se pueden meter consultas dentro de otras',
          this.mirar(),
          'ejecuta la consulta de dentro, mira su resultado, y escribe la de fuera con lo que te haya salido',
        );
      }
      const dentro = this.expresion();
      this.exige('cierra', 'falta cerrar el paréntesis');
      return dentro;
    }

    if (f.tipo === 'nombre') {
      if (PALABRAS_PROHIBIDAS[f.alto]) throw this.tropiezo('', f);
      if (f.alto === 'NULL') return { t: 'nulo', ...sitio };
      if (f.alto === 'TRUE') return { t: 'bool', v: true, ...sitio };
      if (f.alto === 'FALSE') return { t: 'bool', v: false, ...sitio };

      if (this.mirar().tipo === 'abre') {
        if (!RESUMENES.includes(f.alto)) {
          throw this.tropiezo(
            `no existe ninguna función llamada «${f.texto}»`,
            f,
            pistaDeLista('las funciones que hay son', f.alto, RESUMENES),
          );
        }
        this.come();
        let arg: Expr | null = null;
        const est = this.mirar();
        if (est.tipo === 'operador' && est.texto === '*') {
          if (f.alto !== 'COUNT') {
            throw this.tropiezo(
              `«${f.alto}(*)» no existe: hay que decirle de qué columna`,
              est,
              `sólo COUNT(*) cuenta filas enteras; ${f.alto} necesita una columna: ${f.alto}(edad)`,
            );
          }
          this.come();
        } else {
          arg = this.expresion();
        }
        this.exige('cierra', `falta cerrar el paréntesis de ${f.alto}`);
        return { t: 'resumen', nombre: f.alto, arg, ...sitio };
      }

      if (this.mirar().tipo === 'punto') {
        this.come();
        const col = this.nombre('el nombre de la columna después del punto');
        return { t: 'col', tabla: f.texto, nombre: col.texto, ...sitio };
      }
      return { t: 'col', tabla: null, nombre: f.texto, ...sitio };
    }

    throw this.tropiezo(`«${f.texto}» no puede ir aquí`, f);
  }
}

/* ── leer el árbol ──────────────────────────────────────────────────────────*/

export function recorrer(e: Expr, visita: (e: Expr) => void): void {
  visita(e);
  switch (e.t) {
    case 'bin':
    case 'y':
    case 'o':
      recorrer(e.izq, visita);
      recorrer(e.der, visita);
      break;
    case 'neg':
    case 'no':
      recorrer(e.arg, visita);
      break;
    case 'esNulo':
    case 'like':
      recorrer(e.arg, visita);
      break;
    case 'resumen':
      if (e.arg) recorrer(e.arg, visita);
      break;
    default:
      break;
  }
}

/** ¿Esta expresión lleva un `COUNT`, `SUM`…? Lo pregunta el motor tres veces. */
export function llevaResumen(e: Expr): boolean {
  let si = false;
  recorrer(e, (x) => {
    if (x.t === 'resumen') si = true;
  });
  return si;
}

/** Cómo se llama la columna del resultado cuando nadie le puso un `AS`. */
export function nombreDeExpresion(e: Expr): string {
  switch (e.t) {
    case 'col':
      return e.nombre;
    case 'resumen':
      return `${e.nombre}(${e.arg ? nombreDeExpresion(e.arg) : '*'})`;
    case 'num':
      return String(e.v);
    case 'txt':
      return e.v;
    case 'bool':
      return e.v ? 'TRUE' : 'FALSE';
    case 'nulo':
      return 'NULL';
    case 'bin':
      return `${nombreDeExpresion(e.izq)} ${e.op} ${nombreDeExpresion(e.der)}`;
    case 'neg':
      return `-${nombreDeExpresion(e.arg)}`;
    case 'no':
      return `NOT ${nombreDeExpresion(e.arg)}`;
    case 'y':
      return `${nombreDeExpresion(e.izq)} AND ${nombreDeExpresion(e.der)}`;
    case 'o':
      return `${nombreDeExpresion(e.izq)} OR ${nombreDeExpresion(e.der)}`;
    case 'esNulo':
      return `${nombreDeExpresion(e.arg)} IS ${e.negado ? 'NOT ' : ''}NULL`;
    case 'like':
      return `${nombreDeExpresion(e.arg)} LIKE '${e.patron}'`;
  }
}
