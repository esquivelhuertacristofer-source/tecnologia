/**
 * TECNIA SISTEMA · EL ÁRBOL DE ARCHIVOS
 *
 * El armazón «Tecnia Escritorio» (CANON-ARMAZONES.md, «8 · Tecnia Escritorio
 * — 6 actividades»). El canon no traía una interfaz de datos propuesta para
 * este armazón —a diferencia de DISEÑO o BANCO FÍSICO 3D, que sí traían un
 * bloque `interface`—, así que ésta se diseñó de cero a partir de la prosa
 * de la sección 8 y de la lista de operaciones del encargo. Puro: ni React,
 * ni DOM. Aquí no se pinta nada —eso es `VentanaExplorador.tsx` y
 * `Escritorio.tsx`— y aquí no hay estado —eso es `useSistema.ts`—.
 *
 * ── Qué es y qué NO es ────────────────────────────────────────────────────
 *
 * Esto simula UN SISTEMA DE ARCHIVOS: un árbol de carpetas y archivos, con
 * las operaciones de un explorador de verdad (crear, renombrar, mover,
 * copiar, borrar-a-la-papelera, restaurar, buscar) y un gestor de ventanas
 * mínimo para el escritorio. No es un motor de plantillas: no sabe qué
 * ejercicio se está jugando, no pinta preguntas y no decide si el alumno
 * acertó. Cada una de las 6 clases decide qué árbol siembra, qué iconos pone
 * en el escritorio y qué hace con cada resultado.
 *
 * ── Las cuatro decisiones que ordenan el archivo ──────────────────────────
 *
 * 1. **El árbol es un dato inmutable.** Cada operación (`crearCarpeta`,
 *    `mover`, `borrar`…) recibe el árbol y devuelve uno nuevo; nunca lo
 *    muta. Si una operación es un no-operación —el sitio no existe, el
 *    nombre no cambia nada, la papelera ya estaba vacía— devuelve el MISMO
 *    objeto por identidad, igual que `quitar()` en `arbolBloques.ts`: así
 *    una prueba puede comparar `===` y React no repinta de más.
 *
 * 2. **Nombres repetidos e imposibles, con una regla distinta para cada
 *    verbo y explicada en español.** Un nombre inválido (vacío, con
 *    `\ / : * ? " < > |`, o los reservados `.`/`..`) SIEMPRE se rechaza: no
 *    hay forma de arreglarlo a espaldas del alumno. Un nombre que ya existe
 *    en la carpeta destino se trata distinto según el verbo, porque son dos
 *    situaciones distintas de la vida real:
 *      · **crear** y **copiar** SIEMPRE añaden «(2)», «(3)»… — son actos que
 *        multiplican, como pulsar «Nueva carpeta» cien veces o duplicar un
 *        archivo en el mismo sitio donde ya vive.
 *      · **renombrar** y **mover** RECHAZAN el choque con un aviso — son
 *        actos donde el alumno pidió un nombre exacto, y cambiarlo en
 *        silencio sería mentirle. El aviso en sí ES la clase: «Ya hay algo
 *        con ese nombre aquí; dos cosas no pueden llamarse igual en el
 *        mismo sitio.»
 *
 * 3. **La papelera es una lista aparte, no una bandera.** A diferencia de
 *    `PublicacionMuro.borrada` (donde «borrar no borra» y el dato se queda
 *    en el mismo arreglo), un archivo borrado de verdad SALE del árbol: así
 *    `tamanoDe(raiz)` refleja el disco real y una carpeta no puede listar un
 *    hijo fantasma. Cada `ElementoPapelera` guarda `origenId`, el id de la
 *    carpeta donde vivía — que puede haber dejado de existir. `restaurar`
 *    comprueba eso y, si la carpeta original ya no está, cae al disco
 *    principal y lo dice: la prueba «restaurar algo cuya carpeta ya no
 *    existe» del encargo es justo este camino.
 *
 * 4. **La extensión decide qué programa abre el archivo; `contenidoReal` es
 *    la verdad, y las dos viven en campos distintos que nunca se mezclan**
 *    — el mismo patrón que `veracidad` / `marca` en `guionAsistente.ts`.
 *    `programaDe()` sólo mira el nombre. `contenidoReal` es opcional y lo
 *    pone la clase que quiera montar la lección «renombrar `foto.jpg` a
 *    `foto.txt` no la convierte en texto»: compara las dos por su cuenta.
 *    El armazón no corrige — sólo expone los dos hechos.
 */

/* ── el vocabulario del contenido ──────────────────────────────────────── */

/** Lo que un archivo ES de verdad, más allá de cómo se llame. Opcional: la
 *  mayoría de las clases no necesita esta lección y puede omitirlo. */
export type TipoContenido =
  | 'texto'
  | 'imagen'
  | 'audio'
  | 'video'
  | 'hoja-calculo'
  | 'presentacion'
  | 'documento'
  | 'pdf'
  | 'comprimido'
  | 'programa'
  | 'desconocido';

/* ── el árbol ───────────────────────────────────────────────────────────── */

export interface ArchivoSO {
  tipo: 'archivo';
  id: string;
  /** Con extensión, p. ej. "foto.jpg". */
  nombre: string;
  /** Bytes. */
  tamano: number;
  /** Ya formateada para pintar, p. ej. "12 ago 2026". */
  fecha: string;
  /** Marca de tiempo opcional SÓLO para ordenar correctamente por fecha; si
   *  falta, ordenar por fecha cae a comparar el texto de `fecha`. */
  fechaOrden?: number;
  /** Lo que el archivo es de verdad. Ver la decisión 4 de la cabecera. */
  contenidoReal?: TipoContenido;
}

export interface CarpetaSO {
  tipo: 'carpeta';
  id: string;
  nombre: string;
  fecha: string;
  fechaOrden?: number;
  hijos: NodoSO[];
}

export type NodoSO = ArchivoSO | CarpetaSO;

export function esCarpeta(nodo: NodoSO): nodo is CarpetaSO {
  return nodo.tipo === 'carpeta';
}

/* ── la papelera ────────────────────────────────────────────────────────── */

export interface ElementoPapelera {
  nodo: NodoSO;
  /** Id de la carpeta donde vivía. Puede haber dejado de existir para cuando
   *  se intente restaurar — ver la decisión 3 de la cabecera. */
  origenId: string;
  fechaBorrado: string;
}

/* ── el espacio en disco ───────────────────────────────────────────────── */

export interface EspacioDisco {
  capacidad: number;
  /** Lo que ocupa el árbol vivo. */
  usadosVivos: number;
  /** Lo que ocupa la papelera — sigue en el disco hasta que se vacía. */
  usadosPapelera: number;
  usados: number;
  libres: number;
  /** 0–1. */
  porcentaje: number;
}

/* ── programas y extensiones ───────────────────────────────────────────── */

/** Tabla por omisión, sustituible por parámetro (ver `programaDe`). Nombres
 *  genéricos de Tecnia — nunca una marca real. */
export const PROGRAMAS_POR_DEFECTO: Readonly<Record<string, string>> = Object.freeze({
  txt: 'Tecnia Textos',
  docx: 'Tecnia Textos',
  xlsx: 'Tecnia Hojas',
  csv: 'Tecnia Hojas',
  pptx: 'Tecnia Diapositivas',
  jpg: 'Tecnia Imágenes',
  jpeg: 'Tecnia Imágenes',
  png: 'Tecnia Imágenes',
  mp3: 'Tecnia Música',
  mp4: 'Tecnia Video',
  pdf: 'Tecnia Lector',
  zip: 'Tecnia Compresor',
});

/** La extensión en minúsculas, sin punto. `''` si no hay (o el punto es el
 *  primer carácter, como en ".gitignore": eso no es extensión, es nombre). */
export function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  if (i <= 0 || i === nombre.length - 1) return '';
  return nombre.slice(i + 1).toLowerCase();
}

/** El programa que abriría este nombre según su extensión. `null` si Tecnia
 *  no tiene registrado nada para ella — la clase decide qué hacer con eso. */
export function programaDe(
  nombre: string,
  mapa: Readonly<Record<string, string>> = PROGRAMAS_POR_DEFECTO,
): string | null {
  const ext = extensionDe(nombre);
  if (!ext) return null;
  return mapa[ext] ?? null;
}

/* ── nombres: válidos, disponibles ─────────────────────────────────────── */

const CARACTERES_INVALIDOS = /[\\/:*?"<>|]/;

export type MotivoNombreInvalido = 'nombre-vacio' | 'nombre-invalido';

export function nombreValido(nombre: string): { ok: true } | { ok: false; motivo: MotivoNombreInvalido; aviso: string } {
  const limpio = nombre.trim();
  if (limpio === '') {
    return { ok: false, motivo: 'nombre-vacio', aviso: 'El nombre no puede quedar vacío.' };
  }
  if (limpio === '.' || limpio === '..') {
    return { ok: false, motivo: 'nombre-invalido', aviso: 'Ese nombre está reservado por el sistema.' };
  }
  if (CARACTERES_INVALIDOS.test(limpio)) {
    return { ok: false, motivo: 'nombre-invalido', aviso: 'Un nombre no puede llevar \\ / : * ? " < > |' };
  }
  if (limpio.length > 255) {
    return { ok: false, motivo: 'nombre-invalido', aviso: 'Ese nombre es demasiado largo.' };
  }
  return { ok: true };
}

export function existeNombre(carpeta: CarpetaSO, nombre: string, excluirId?: string): boolean {
  const buscado = nombre.trim().toLowerCase();
  return carpeta.hijos.some((h) => h.id !== excluirId && h.nombre.toLowerCase() === buscado);
}

/** Añade «(2)», «(3)»… antes de la extensión hasta que el nombre no choque.
 *  Si `nombreDeseado` ya está libre, se devuelve tal cual. */
export function nombreDisponible(carpeta: CarpetaSO, nombreDeseado: string, excluirId?: string): string {
  if (!existeNombre(carpeta, nombreDeseado, excluirId)) return nombreDeseado;
  const ext = extensionDe(nombreDeseado);
  const base = ext ? nombreDeseado.slice(0, -(ext.length + 1)) : nombreDeseado;
  let n = 2;
  let candidato = ext ? `${base} (${n}).${ext}` : `${base} (${n})`;
  while (existeNombre(carpeta, candidato, excluirId)) {
    n += 1;
    candidato = ext ? `${base} (${n}).${ext}` : `${base} (${n})`;
  }
  return candidato;
}

/* ── recorrer el árbol ─────────────────────────────────────────────────── */

export function buscarNodo(raiz: CarpetaSO, id: string): NodoSO | null {
  if (raiz.id === id) return raiz;
  for (const h of raiz.hijos) {
    if (h.id === id) return h;
    if (esCarpeta(h)) {
      const r = buscarNodo(h, id);
      if (r) return r;
    }
  }
  return null;
}

export function buscarCarpeta(raiz: CarpetaSO, id: string): CarpetaSO | null {
  const n = buscarNodo(raiz, id);
  return n && esCarpeta(n) ? n : null;
}

/** ¿`id` es `carpeta` misma o cuelga de ella, aunque sea de nieta? */
export function esDescendiente(carpeta: CarpetaSO, id: string): boolean {
  if (carpeta.id === id) return true;
  for (const h of carpeta.hijos) {
    if (h.id === id) return true;
    if (esCarpeta(h) && esDescendiente(h, id)) return true;
  }
  return false;
}

/** La carpeta que contiene a `id` directamente. `null` para la raíz (no
 *  tiene padre) o si `id` no existe. */
export function padreDe(raiz: CarpetaSO, id: string): CarpetaSO | null {
  if (raiz.id === id) return null;
  for (const h of raiz.hijos) {
    if (h.id === id) return raiz;
    if (esCarpeta(h)) {
      const r = padreDe(h, id);
      if (r) return r;
    }
  }
  return null;
}

/** La cadena de carpetas de la raíz a `carpetaId`, inclusive. `null` si
 *  `carpetaId` no existe o no es una carpeta — así una clase puede detectar
 *  "la carpeta en la que estaba parado ya no está" y volver a la raíz. */
export function rutaCarpeta(raiz: CarpetaSO, carpetaId: string): CarpetaSO[] | null {
  function ir(actual: CarpetaSO, pila: CarpetaSO[]): CarpetaSO[] | null {
    const aqui = [...pila, actual];
    if (actual.id === carpetaId) return aqui;
    for (const h of actual.hijos) {
      if (esCarpeta(h)) {
        const r = ir(h, aqui);
        if (r) return r;
      }
    }
    return null;
  }
  return ir(raiz, []);
}

/** El tamaño de un archivo, o la suma recursiva de una carpeta. */
export function tamanoDe(nodo: NodoSO): number {
  if (nodo.tipo === 'archivo') return nodo.tamano;
  return nodo.hijos.reduce((s, h) => s + tamanoDe(h), 0);
}

/** Cuántos nodos (archivos + carpetas) cuelgan de `carpeta`, sin contarla. */
export function contarNodos(carpeta: CarpetaSO): number {
  let n = 0;
  for (const h of carpeta.hijos) {
    n += 1;
    if (esCarpeta(h)) n += contarNodos(h);
  }
  return n;
}

/* ── ordenar y buscar ──────────────────────────────────────────────────── */

export interface OrdenExplorador {
  campo: 'nombre' | 'tamano' | 'fecha';
  direccion: 'asc' | 'desc';
  /** Por omisión `true`: las carpetas siempre antes que los archivos,
   *  como en cualquier explorador real. */
  carpetasPrimero?: boolean;
}

export function ordenarHijos(hijos: readonly NodoSO[], orden: OrdenExplorador): NodoSO[] {
  const carpetasPrimero = orden.carpetasPrimero ?? true;
  const factor = orden.direccion === 'desc' ? -1 : 1;

  const comparar = (a: NodoSO, b: NodoSO): number => {
    switch (orden.campo) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) * factor;
      case 'tamano':
        return (tamanoDe(a) - tamanoDe(b)) * factor;
      case 'fecha': {
        if (a.fechaOrden !== undefined && b.fechaOrden !== undefined) {
          return (a.fechaOrden - b.fechaOrden) * factor;
        }
        return a.fecha.localeCompare(b.fecha, 'es', { sensitivity: 'base' }) * factor;
      }
    }
  };

  return hijos.slice().sort((a, b) => {
    if (carpetasPrimero && a.tipo !== b.tipo) return a.tipo === 'carpeta' ? -1 : 1;
    return comparar(a, b);
  });
}

export interface FiltroBusqueda {
  texto?: string;
  tipo?: 'archivo' | 'carpeta';
  extension?: string;
}

/** Recorre TODO el árbol bajo `carpeta` (sin incluirla) y devuelve lo que
 *  casa con el filtro. Por nombre (subcadena, sin mayúsculas) y por tipo. */
export function buscar(carpeta: CarpetaSO, filtro: FiltroBusqueda): NodoSO[] {
  const texto = filtro.texto?.trim().toLowerCase();
  const extension = filtro.extension?.toLowerCase();
  const salida: NodoSO[] = [];

  function recorrer(c: CarpetaSO) {
    for (const h of c.hijos) {
      let casa = true;
      if (texto && !h.nombre.toLowerCase().includes(texto)) casa = false;
      if (filtro.tipo && h.tipo !== filtro.tipo) casa = false;
      if (extension && (h.tipo !== 'archivo' || extensionDe(h.nombre) !== extension)) casa = false;
      if (casa) salida.push(h);
      if (esCarpeta(h)) recorrer(h);
    }
  }
  recorrer(carpeta);
  return salida;
}

export function calcularEspacio(raiz: CarpetaSO, papelera: readonly ElementoPapelera[], capacidad: number): EspacioDisco {
  const usadosVivos = tamanoDe(raiz);
  const usadosPapelera = papelera.reduce((s, e) => s + tamanoDe(e.nodo), 0);
  const usados = usadosVivos + usadosPapelera;
  const libres = Math.max(0, capacidad - usados);
  return {
    capacidad,
    usadosVivos,
    usadosPapelera,
    usados,
    libres,
    porcentaje: capacidad > 0 ? Math.min(1, usados / capacidad) : 0,
  };
}

/* ── editar el árbol: los tres primitivos ──────────────────────────────── */

/** Aplica `f` al descendiente `id` (nunca a `carpeta` misma) donde sea que
 *  esté, y devuelve un árbol nuevo. Si `id` no aparece, devuelve `carpeta`
 *  SIN TOCAR — por identidad, como pide el encargo. */
function conNodoHijo(carpeta: CarpetaSO, id: string, f: (n: NodoSO) => NodoSO): CarpetaSO {
  let cambio = false;
  const hijos = carpeta.hijos.map((h) => {
    if (h.id === id) {
      cambio = true;
      return f(h);
    }
    if (esCarpeta(h)) {
      const nuevo = conNodoHijo(h, id, f);
      if (nuevo !== h) {
        cambio = true;
        return nuevo;
      }
    }
    return h;
  });
  return cambio ? { ...carpeta, hijos } : carpeta;
}

/** Saca el nodo `id` de donde esté. Devuelve el árbol sin él y el nodo
 *  extraído (o `null` si no estaba). */
function quitarNodo(carpeta: CarpetaSO, id: string): { arbol: CarpetaSO; extraido: NodoSO | null } {
  let extraido: NodoSO | null = null;

  function enCarpeta(c: CarpetaSO): CarpetaSO {
    let cambio = false;
    const hijos: NodoSO[] = [];
    for (const h of c.hijos) {
      if (h.id === id) {
        extraido = h;
        cambio = true;
        continue;
      }
      if (esCarpeta(h)) {
        const nuevo = enCarpeta(h);
        if (nuevo !== h) cambio = true;
        hijos.push(nuevo);
      } else {
        hijos.push(h);
      }
    }
    return cambio ? { ...c, hijos } : c;
  }

  return { arbol: enCarpeta(carpeta), extraido };
}

/** Mete `nodo` como hijo de la carpeta `destinoId`. Da por hecho que existe
 *  (los llamadores lo comprueban antes). */
function insertarNodo(carpeta: CarpetaSO, destinoId: string, nodo: NodoSO): CarpetaSO {
  if (carpeta.id === destinoId) {
    return { ...carpeta, hijos: [...carpeta.hijos, nodo] };
  }
  let cambio = false;
  const hijos = carpeta.hijos.map((h) => {
    if (esCarpeta(h)) {
      const nuevo = insertarNodo(h, destinoId, nodo);
      if (nuevo !== h) cambio = true;
      return nuevo;
    }
    return h;
  });
  return cambio ? { ...carpeta, hijos } : carpeta;
}

/** Clona un nodo entero con ids nuevos para él y para todo su subárbol —
 *  necesario para que `copiar` no deje dos nodos con el mismo id vivos a la
 *  vez. `generarId` se llama una vez por nodo clonado. */
function clonarConNuevosIds(nodo: NodoSO, generarId: () => string, fecha: string): NodoSO {
  if (nodo.tipo === 'archivo') {
    return { ...nodo, id: generarId(), fecha };
  }
  return {
    ...nodo,
    id: generarId(),
    fecha,
    hijos: nodo.hijos.map((h) => clonarConNuevosIds(h, generarId, fecha)),
  };
}

/* ── el resultado uniforme de una operación ────────────────────────────── */

export type MotivoRechazo =
  | MotivoNombreInvalido
  | 'no-existe'
  | 'nombre-ocupado'
  | 'raiz-no-se-toca'
  | 'dentro-de-si-mismo'
  | 'destino-no-es-carpeta'
  | 'ya-esta-ahi';

export type ResultadoArbol =
  | { ok: true; raiz: CarpetaSO; aviso: string; nombreFinal?: string }
  | { ok: false; motivo: MotivoRechazo; aviso: string; raiz: CarpetaSO };

function rechazo(raiz: CarpetaSO, motivo: MotivoRechazo, aviso: string): ResultadoArbol {
  return { ok: false, motivo, aviso, raiz };
}

/* ── las operaciones ────────────────────────────────────────────────────── */

export function crearCarpeta(
  raiz: CarpetaSO,
  carpetaPadreId: string,
  nombreDeseado: string,
  id: string,
  fecha: string,
): ResultadoArbol {
  const padre = buscarCarpeta(raiz, carpetaPadreId);
  if (!padre) return rechazo(raiz, 'no-existe', 'Esa carpeta ya no existe.');

  const validez = nombreValido(nombreDeseado);
  if (!validez.ok) return rechazo(raiz, validez.motivo, validez.aviso);

  const nombreFinal = nombreDisponible(padre, nombreDeseado);
  const nueva: CarpetaSO = { tipo: 'carpeta', id, nombre: nombreFinal, fecha, hijos: [] };
  const nuevaRaiz = insertarNodo(raiz, carpetaPadreId, nueva);

  const aviso =
    nombreFinal === nombreDeseado
      ? `Se creó la carpeta «${nombreFinal}».`
      : `Ya había algo llamado «${nombreDeseado}» aquí, así que se creó como «${nombreFinal}».`;
  return { ok: true, raiz: nuevaRaiz, aviso, nombreFinal };
}

export function renombrar(raiz: CarpetaSO, id: string, nuevoNombre: string): ResultadoArbol {
  if (raiz.id === id) return rechazo(raiz, 'raiz-no-se-toca', 'El disco principal no se puede renombrar.');

  const nodo = buscarNodo(raiz, id);
  if (!nodo) return rechazo(raiz, 'no-existe', 'Eso ya no está aquí.');

  const validez = nombreValido(nuevoNombre);
  if (!validez.ok) return rechazo(raiz, validez.motivo, validez.aviso);
  const limpio = nuevoNombre.trim();

  if (limpio === nodo.nombre) return { ok: true, raiz, aviso: 'No cambió nada: es el mismo nombre.', nombreFinal: limpio };

  const padre = padreDe(raiz, id);
  if (padre && existeNombre(padre, limpio, id)) {
    return rechazo(
      raiz,
      'nombre-ocupado',
      `Ya hay algo llamado «${limpio}» en esta carpeta. Dos cosas no pueden llamarse igual en el mismo sitio.`,
    );
  }

  const nuevaRaiz = conNodoHijo(raiz, id, (n) => ({ ...n, nombre: limpio }));
  return { ok: true, raiz: nuevaRaiz, aviso: `Ahora se llama «${limpio}».`, nombreFinal: limpio };
}

export function mover(raiz: CarpetaSO, id: string, destinoId: string): ResultadoArbol {
  if (raiz.id === id) return rechazo(raiz, 'raiz-no-se-toca', 'El disco principal no se puede mover.');

  const nodo = buscarNodo(raiz, id);
  if (!nodo) return rechazo(raiz, 'no-existe', 'Eso ya no está aquí.');

  const destino = buscarCarpeta(raiz, destinoId);
  if (!destino) return rechazo(raiz, 'destino-no-es-carpeta', 'Ahí no hay ninguna carpeta donde mover esto.');

  if (esCarpeta(nodo) && esDescendiente(nodo, destinoId)) {
    return rechazo(
      raiz,
      'dentro-de-si-mismo',
      destinoId === id
        ? 'Una carpeta no puede meterse dentro de sí misma.'
        : 'Una carpeta no puede meterse dentro de una carpeta que ella misma contiene.',
    );
  }

  const padreActual = padreDe(raiz, id);
  if (padreActual?.id === destinoId) return rechazo(raiz, 'ya-esta-ahi', 'Ya está en esa carpeta.');

  if (existeNombre(destino, nodo.nombre)) {
    return rechazo(
      raiz,
      'nombre-ocupado',
      `Ya hay algo llamado «${nodo.nombre}» en el destino. Dos cosas no pueden llamarse igual en el mismo sitio.`,
    );
  }

  const { arbol: sinNodo, extraido } = quitarNodo(raiz, id);
  if (!extraido) return rechazo(raiz, 'no-existe', 'Eso ya no está aquí.');
  const nuevaRaiz = insertarNodo(sinNodo, destinoId, extraido);
  return { ok: true, raiz: nuevaRaiz, aviso: `Se movió «${nodo.nombre}» a «${destino.nombre}».` };
}

export function copiar(
  raiz: CarpetaSO,
  id: string,
  destinoId: string,
  generarId: () => string,
  fecha: string,
): ResultadoArbol {
  const nodo = buscarNodo(raiz, id);
  if (!nodo) return rechazo(raiz, 'no-existe', 'Eso ya no está aquí.');

  const destino = buscarCarpeta(raiz, destinoId);
  if (!destino) return rechazo(raiz, 'destino-no-es-carpeta', 'Ahí no hay ninguna carpeta donde copiar esto.');

  if (esCarpeta(nodo) && esDescendiente(nodo, destinoId)) {
    return rechazo(raiz, 'dentro-de-si-mismo', 'Una carpeta no se puede copiar dentro de sí misma ni de lo que contiene.');
  }

  // Copiar SIEMPRE resuelve el choque con «(2)», «(3)»…: es un acto que
  // multiplica, no un acto que pide un nombre exacto. Ver decisión 2.
  const nombreFinal = nombreDisponible(destino, nodo.nombre);
  const clon = clonarConNuevosIds({ ...nodo, nombre: nombreFinal }, generarId, fecha);
  const nuevaRaiz = insertarNodo(raiz, destinoId, clon);

  const aviso =
    nombreFinal === nodo.nombre
      ? `Se copió «${nodo.nombre}» en «${destino.nombre}».`
      : `Ya había algo llamado «${nodo.nombre}» ahí, así que la copia se llama «${nombreFinal}».`;
  return { ok: true, raiz: nuevaRaiz, aviso, nombreFinal };
}

export interface ResultadoBorrar {
  ok: boolean;
  raiz: CarpetaSO;
  papelera: ElementoPapelera[];
  aviso: string;
  motivo?: MotivoRechazo;
}

export function borrar(
  raiz: CarpetaSO,
  papelera: readonly ElementoPapelera[],
  id: string,
  fecha: string,
): ResultadoBorrar {
  if (raiz.id === id) {
    return { ok: false, raiz, papelera: papelera as ElementoPapelera[], aviso: 'El disco principal no se puede borrar.', motivo: 'raiz-no-se-toca' };
  }
  const nodo = buscarNodo(raiz, id);
  if (!nodo) {
    return { ok: false, raiz, papelera: papelera as ElementoPapelera[], aviso: 'Eso ya no está aquí.', motivo: 'no-existe' };
  }
  const padre = padreDe(raiz, id);
  const { arbol: nuevaRaiz } = quitarNodo(raiz, id);
  const elemento: ElementoPapelera = { nodo, origenId: padre?.id ?? raiz.id, fechaBorrado: fecha };
  return {
    ok: true,
    raiz: nuevaRaiz,
    papelera: [elemento, ...papelera],
    aviso: `Se envió «${nodo.nombre}» a la papelera.`,
  };
}

export interface ResultadoRestaurar {
  ok: boolean;
  raiz: CarpetaSO;
  papelera: ElementoPapelera[];
  aviso: string;
  /** `true` si la carpeta original ya no existía y se restauró en la raíz. */
  origenPerdido?: boolean;
  motivo?: MotivoRechazo;
}

export function restaurar(
  raiz: CarpetaSO,
  papelera: readonly ElementoPapelera[],
  nodoId: string,
): ResultadoRestaurar {
  const elemento = papelera.find((e) => e.nodo.id === nodoId);
  if (!elemento) {
    return { ok: false, raiz, papelera: papelera as ElementoPapelera[], aviso: 'Eso ya no está en la papelera.', motivo: 'no-existe' };
  }

  const restoSinEste = papelera.filter((e) => e.nodo.id !== nodoId);
  const destinoOriginal = buscarCarpeta(raiz, elemento.origenId);
  const origenPerdido = !destinoOriginal;
  const destino = destinoOriginal ?? raiz;

  const nombreFinal = nombreDisponible(destino, elemento.nodo.nombre);
  const nodoRestaurado: NodoSO = nombreFinal === elemento.nodo.nombre ? elemento.nodo : { ...elemento.nodo, nombre: nombreFinal };
  const nuevaRaiz = insertarNodo(raiz, destino.id, nodoRestaurado);

  let aviso = `Se restauró «${nodoRestaurado.nombre}».`;
  if (origenPerdido) {
    aviso = `La carpeta donde vivía ya no existe, así que «${elemento.nodo.nombre}» se restauró en el disco principal.`;
  } else if (nombreFinal !== elemento.nodo.nombre) {
    aviso = `Ya hay algo llamado «${elemento.nodo.nombre}» en «${destino.nombre}»; se restauró como «${nombreFinal}».`;
  }

  return { ok: true, raiz: nuevaRaiz, papelera: restoSinEste, aviso, origenPerdido };
}

/** Vacía la papelera. Si ya estaba vacía, devuelve la MISMA lista por
 *  identidad — "borrar la papelera" cuando no hay nada que borrar no es un
 *  error, es un no-operación. */
export function vaciarPapelera(papelera: ElementoPapelera[]): ElementoPapelera[] {
  return papelera.length === 0 ? papelera : [];
}

/* ── el escritorio: iconos y ventanas ──────────────────────────────────── */

export interface IconoEscritorio {
  id: string;
  etiqueta: string;
  emoji: string;
  /** El nodo que abre este icono (un archivo o una carpeta del árbol). */
  nodoId?: string;
  /** Id de un programa fijo que no vive en el árbol (p. ej. "calculadora"),
   *  para los iconos que no son accesos directos a un archivo. */
  programaFijo?: string;
}

export interface VentanaSO {
  id: string;
  titulo: string;
  /** Qué programa la abrió: "explorador", "calculadora", "centro-seguridad"…
   *  El armazón no lo interpreta — sólo lo transporta para que la clase
   *  decida qué `children` pintar dentro. */
  programa: string;
  minimizada?: boolean;
}

/** Abre una ventana. Si ya había una con ese id, la trae al frente en vez de
 *  duplicarla — abrir el explorador dos veces desde el mismo icono no crea
 *  dos ventanas. */
export function abrirVentana(ventanas: readonly VentanaSO[], nueva: VentanaSO): VentanaSO[] {
  if (ventanas.some((v) => v.id === nueva.id)) return enfocarVentana(ventanas, nueva.id);
  return [...ventanas, nueva];
}

export function cerrarVentana(ventanas: readonly VentanaSO[], id: string): VentanaSO[] {
  if (!ventanas.some((v) => v.id === id)) return ventanas as VentanaSO[];
  return ventanas.filter((v) => v.id !== id);
}

/** El orden del arreglo ES el orden de apilado: la última es la de arriba. */
export function enfocarVentana(ventanas: readonly VentanaSO[], id: string): VentanaSO[] {
  const i = ventanas.findIndex((v) => v.id === id);
  if (i === -1) return ventanas as VentanaSO[];
  if (i === ventanas.length - 1 && !ventanas[i].minimizada) return ventanas as VentanaSO[];
  const copia = ventanas.slice();
  const [v] = copia.splice(i, 1);
  copia.push({ ...v, minimizada: false });
  return copia;
}

export function minimizarVentana(ventanas: readonly VentanaSO[], id: string): VentanaSO[] {
  const v = ventanas.find((x) => x.id === id);
  if (!v || v.minimizada) return ventanas as VentanaSO[];
  return ventanas.map((x) => (x.id === id ? { ...x, minimizada: true } : x));
}
