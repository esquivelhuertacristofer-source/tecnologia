/**
 * TECNIA TABLERO · los datos, sin React.
 *
 * El tablero de tareas por columnas de Tecnia. No es Trello ni Planner ni
 * Jira —ningún logotipo real—: es el tablero de la plataforma. Sale de partir
 * «10 · Tecnia Nube» del canon, donde el tablero vivía escondido dentro del
 * armazón de archivos compartidos sin parecerse a él en nada.
 *
 * ── Lo que enseña, y por qué está en los datos ─────────────────────────────
 *
 * El encargo lo dice: «quién hace qué y para cuándo, que es lo que enseña».
 * Por eso `responsable` y `fecha` son campos de primera clase y hay dos
 * selectores —`tarjetasSinResponsable`, `tarjetasSinFecha`— que los buscan.
 * Una tarjeta sin dueño no es un error del dato: es exactamente lo que la
 * clase señala. El armazón la deja existir y la sabe encontrar; NO la corrige.
 *
 * ── Las cuatro decisiones de datos ──────────────────────────────────────────
 *
 * 1. **Mover es una función pura sobre los datos, no un arrastre.** Lo pide el
 *    encargo con esas palabras, y la razón es de prueba: en jsdom no existe
 *    `PointerEvent` y `getBoundingClientRect` devuelve ceros, así que una
 *    prueba de arrastre escrita de la forma natural pasa en verde sin
 *    comprobar nada. `moverTarjeta` se prueba de verdad; la ventana la invoca
 *    desde dos botones «◀ ▶» pegados a la tarjeta.
 *
 * 2. **La columna destino tiene que existir.** `moverTarjeta` recibe el
 *    tablero entero, no sólo las tarjetas, justo para poder rechazar
 *    `'columna-no-existe'`. Una tarjeta huérfana en una columna fantasma es un
 *    dato imposible de pintar, y el sitio donde eso se impide es aquí.
 *
 * 3. **Borrar una columna con tarjetas dentro se rechaza por omisión.** Es el
 *    caso de jugar mal más caro del tablero: se llevaría por delante trabajo
 *    ajeno sin decir nada. Quien de verdad quiera hacerlo pasa
 *    `destino: 'otra-columna'` y las tarjetas se mudan; sin destino, no.
 *
 * 4. **Las fechas son cadenas ISO `AAAA-MM-DD` y se comparan como texto**, que
 *    para ese formato es exactamente comparar fechas. `estadoFecha` recibe el
 *    día de hoy POR PARÁMETRO: aquí no se llama nunca a `Date.now()` ni a
 *    `new Date()` sin argumentos, o las pruebas fallarían mañana y nadie
 *    sabría por qué.
 *
 * Datos inmutables y operaciones puras: cuando no hay cambio se devuelve el
 * MISMO objeto por identidad (se comprueba con `toBe`, no con `toEqual`),
 * igual que en `tiposMuro.ts` y `tiposNube.ts`.
 */

/* ── las piezas ─────────────────────────────────────────────────────────── */

export interface ColumnaTablero {
  id: string;
  titulo: string;
}

export interface PersonaTablero {
  id: string;
  nombre: string;
  /** Emoji o inicial; si falta, la ventana usa la primera letra del nombre. */
  avatar?: string;
}

export interface EtiquetaTablero {
  id: string;
  texto: string;
  /** Color pleno en hexadecimal. Si falta, la ventana pone el suyo. */
  color?: string;
}

export interface TarjetaTablero {
  id: string;
  columnaId: string;
  titulo: string;
  descripcion?: string;
  /** Quién lo hace. Sin responsable la tarea no es de nadie — y eso se ve. */
  responsable?: PersonaTablero;
  /** Para cuándo, en ISO `AAAA-MM-DD`. */
  fecha?: string;
  etiquetas: EtiquetaTablero[];
}

/** Un tablero es sus columnas y sus tarjetas, juntas: sin las dos no se puede
 *  decir si un movimiento es legal. */
export interface DatosTablero {
  columnas: ColumnaTablero[];
  tarjetas: TarjetaTablero[];
}

/* ── selectores ─────────────────────────────────────────────────────────── */

/** Las de una columna, en el orden del arreglo. */
export function tarjetasDe(datos: DatosTablero, columnaId: string): TarjetaTablero[] {
  return datos.tarjetas.filter((t) => t.columnaId === columnaId);
}

export function columnaDe(datos: DatosTablero, columnaId: string): ColumnaTablero | null {
  return datos.columnas.find((c) => c.id === columnaId) ?? null;
}

export function tarjetaDe(datos: DatosTablero, tarjetaId: string): TarjetaTablero | null {
  return datos.tarjetas.find((t) => t.id === tarjetaId) ?? null;
}

/** Lo que enseña el tablero, primera mitad: qué tarea no es de nadie. */
export function tarjetasSinResponsable(datos: DatosTablero): TarjetaTablero[] {
  return datos.tarjetas.filter((t) => !t.responsable);
}

/** Lo que enseña el tablero, segunda mitad: qué tarea no tiene «para cuándo». */
export function tarjetasSinFecha(datos: DatosTablero): TarjetaTablero[] {
  return datos.tarjetas.filter((t) => !t.fecha);
}

/** Cuántas tarjetas lleva cada persona. Una persona sin tarjetas no aparece. */
export function cargaPorPersona(datos: DatosTablero): { persona: PersonaTablero; tarjetas: number }[] {
  const cuenta = new Map<string, { persona: PersonaTablero; tarjetas: number }>();
  for (const t of datos.tarjetas) {
    if (!t.responsable) continue;
    const previo = cuenta.get(t.responsable.id);
    if (previo) previo.tarjetas += 1;
    else cuenta.set(t.responsable.id, { persona: t.responsable, tarjetas: 1 });
  }
  return [...cuenta.values()];
}

/* ── el «para cuándo» ───────────────────────────────────────────────────── */

export type EstadoFecha = 'sin-fecha' | 'vencida' | 'hoy' | 'proxima';

/**
 * Decisión 4: `hoy` entra POR PARÁMETRO, en ISO `AAAA-MM-DD`. Si esta función
 * mirara el reloj, la prueba que hoy pasa fallaría mañana.
 */
export function estadoFecha(tarjeta: TarjetaTablero, hoy: string): EstadoFecha {
  if (!tarjeta.fecha) return 'sin-fecha';
  if (tarjeta.fecha < hoy) return 'vencida';
  if (tarjeta.fecha === hoy) return 'hoy';
  return 'proxima';
}

/* ── mover ──────────────────────────────────────────────────────────────── */

export type MotivoMover = 'tarjeta-no-existe' | 'columna-no-existe' | 'ya-esta-ahi';

export type ResultadoMover =
  | { ok: true; datos: DatosTablero; aviso: string }
  | { ok: false; motivo: MotivoMover; aviso: string; datos: DatosTablero };

/**
 * Decisiones 1 y 2. La tarjeta se va al FINAL de la columna destino, que es lo
 * que hace un tablero de verdad cuando sueltas algo en una columna sin
 * apuntar a un hueco concreto. Reordenar dentro de una columna no lo pide
 * ninguna fila del canon y por eso no existe.
 */
export function moverTarjeta(datos: DatosTablero, tarjetaId: string, columnaId: string): ResultadoMover {
  const tarjeta = tarjetaDe(datos, tarjetaId);
  if (!tarjeta) {
    return { ok: false, motivo: 'tarjeta-no-existe', aviso: 'Esa tarjeta ya no está en el tablero.', datos };
  }
  const columna = columnaDe(datos, columnaId);
  if (!columna) {
    return { ok: false, motivo: 'columna-no-existe', aviso: 'Ese destino no es una columna de este tablero.', datos };
  }
  if (tarjeta.columnaId === columnaId) {
    return { ok: false, motivo: 'ya-esta-ahi', aviso: `«${tarjeta.titulo}» ya estaba en ${columna.titulo}.`, datos };
  }
  const movida = { ...tarjeta, columnaId };
  return {
    ok: true,
    datos: { ...datos, tarjetas: [...datos.tarjetas.filter((t) => t.id !== tarjetaId), movida] },
    aviso: `«${tarjeta.titulo}» pasa a ${columna.titulo}.`,
  };
}

/* ── crear, editar, borrar tarjetas ─────────────────────────────────────── */

export type MotivoCrear = 'columna-no-existe' | 'titulo-vacio' | 'id-repetido';

export type ResultadoCrear =
  | { ok: true; datos: DatosTablero; tarjeta: TarjetaTablero }
  | { ok: false; motivo: MotivoCrear; aviso: string; datos: DatosTablero };

export interface NuevaTarjeta {
  id: string;
  columnaId: string;
  titulo: string;
  descripcion?: string;
  responsable?: PersonaTablero;
  fecha?: string;
  etiquetas?: EtiquetaTablero[];
}

/**
 * Una tarjeta SIN responsable y SIN fecha se crea sin protestar: es legal, es
 * lo que pasa en clase, y encontrarla es lo que enseña
 * `tarjetasSinResponsable`. Lo único que no se admite es una tarjeta sin
 * título, que no sería nada, y una que caiga en una columna inexistente.
 */
export function crearTarjeta(datos: DatosTablero, nueva: NuevaTarjeta): ResultadoCrear {
  if (!columnaDe(datos, nueva.columnaId)) {
    return { ok: false, motivo: 'columna-no-existe', aviso: 'Esa columna no existe en este tablero.', datos };
  }
  const titulo = nueva.titulo.trim();
  if (titulo === '') {
    return { ok: false, motivo: 'titulo-vacio', aviso: 'Una tarjeta sin título no dice qué hay que hacer.', datos };
  }
  if (tarjetaDe(datos, nueva.id)) {
    return { ok: false, motivo: 'id-repetido', aviso: 'Ya hay una tarjeta con ese identificador.', datos };
  }
  const tarjeta: TarjetaTablero = {
    id: nueva.id,
    columnaId: nueva.columnaId,
    titulo,
    descripcion: nueva.descripcion,
    responsable: nueva.responsable,
    fecha: nueva.fecha,
    etiquetas: nueva.etiquetas ?? [],
  };
  return { ok: true, datos: { ...datos, tarjetas: [...datos.tarjetas, tarjeta] }, tarjeta };
}

export type CambioTarjeta = Partial<Omit<TarjetaTablero, 'id' | 'columnaId'>>;

/**
 * Editar NO mueve de columna: para eso está `moverTarjeta`, con sus guardas.
 * Un cambio que no cambia nada devuelve el MISMO tablero por identidad.
 */
export function editarTarjeta(datos: DatosTablero, tarjetaId: string, cambio: CambioTarjeta): DatosTablero {
  const tarjeta = tarjetaDe(datos, tarjetaId);
  if (!tarjeta) return datos; // no-op: identidad
  const editada: TarjetaTablero = { ...tarjeta, ...cambio };
  const igual = (Object.keys(cambio) as (keyof CambioTarjeta)[]).every(
    (k) => JSON.stringify(tarjeta[k]) === JSON.stringify(editada[k]),
  );
  if (igual) return datos; // no-op: identidad
  return { ...datos, tarjetas: datos.tarjetas.map((t) => (t.id === tarjetaId ? editada : t)) };
}

export function borrarTarjeta(datos: DatosTablero, tarjetaId: string): DatosTablero {
  if (!tarjetaDe(datos, tarjetaId)) return datos; // no-op: identidad
  return { ...datos, tarjetas: datos.tarjetas.filter((t) => t.id !== tarjetaId) };
}

/* ── columnas ───────────────────────────────────────────────────────────── */

export type MotivoBorrarColumna = 'columna-no-existe' | 'tiene-tarjetas' | 'destino-no-existe';

export type ResultadoBorrarColumna =
  | { ok: true; datos: DatosTablero; mudadas: number; aviso: string }
  | { ok: false; motivo: MotivoBorrarColumna; aviso: string; datos: DatosTablero };

/**
 * Decisión 3. Sin `destino`, una columna con tarjetas dentro NO se borra: se
 * llevaría por delante trabajo de alguien sin decirlo. Con `destino`, las
 * tarjetas se mudan primero y luego cae la columna.
 */
export function borrarColumna(
  datos: DatosTablero,
  columnaId: string,
  opciones?: { destino?: string },
): ResultadoBorrarColumna {
  const columna = columnaDe(datos, columnaId);
  if (!columna) {
    return { ok: false, motivo: 'columna-no-existe', aviso: 'Esa columna ya no está en el tablero.', datos };
  }
  const dentro = tarjetasDe(datos, columnaId);
  const destino = opciones?.destino;

  if (dentro.length > 0 && destino === undefined) {
    return {
      ok: false,
      motivo: 'tiene-tarjetas',
      aviso: `«${columna.titulo}» tiene ${dentro.length} tarjeta${dentro.length === 1 ? '' : 's'} dentro. Di a dónde van antes de quitarla.`,
      datos,
    };
  }
  if (destino !== undefined && (destino === columnaId || !columnaDe(datos, destino))) {
    return { ok: false, motivo: 'destino-no-existe', aviso: 'Ese destino no es otra columna de este tablero.', datos };
  }

  const columnas = datos.columnas.filter((c) => c.id !== columnaId);
  const tarjetas =
    destino === undefined
      ? datos.tarjetas
      : datos.tarjetas.map((t) => (t.columnaId === columnaId ? { ...t, columnaId: destino } : t));

  return {
    ok: true,
    datos: { columnas, tarjetas },
    mudadas: destino === undefined ? 0 : dentro.length,
    aviso:
      dentro.length === 0
        ? `«${columna.titulo}» fuera del tablero.`
        : `«${columna.titulo}» fuera, y sus ${dentro.length} tarjetas mudadas.`,
  };
}
