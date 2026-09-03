/**
 * Banco Físico 3D — el núcleo, sin React y sin three.
 *
 * ─── Por qué existe este archivo separado ────────────────────────────────────
 *
 * Las pruebas de esta plataforma corren en jsdom, y jsdom **no tiene WebGL**.
 * Tampoco tiene `PointerEvent` con coordenadas ni un `getBoundingClientRect`
 * que devuelva algo distinto de ceros. Cualquier lógica de «¿esta pieza entra
 * en este hueco?» que viva dentro de la escena es, en la práctica, lógica sin
 * probar: la prueba sale verde porque no llegó a ejecutar nada.
 *
 * Así que el reparto es el mismo que hizo el armazón de bloques:
 *
 *   **El navegador fabrica UN dato: el punto del mundo donde el alumno soltó.**
 *   **Todo lo demás son funciones puras de este archivo.**
 *
 * Ese único dato lo produce el raycast de react-three-fiber (`evento.point`) y
 * entra aquí como una terna de números. A partir de ahí no hay escena, no hay
 * cámara, no hay eventos: hay geometría de tres números y tablas. Por eso el
 * 90 % de las pruebas de este armazón no monta nada.
 *
 * ─── Lo que este archivo NO hace ─────────────────────────────────────────────
 *
 * **No corrige.** No sabe cuál es la pieza correcta para cada hueco, porque eso
 * es la clase y no el aparato. Lo único que sabe es *física*: una clavija HDMI
 * entra en un puerto HDMI y no entra en uno USB; un zócalo ocupado ya no admite
 * otra. Si una actividad quiere saber si el alumno acertó, le pasa su tabla de
 * verdad a `evaluar()` — igual que `VentanaHojas` recibe sus tablas por
 * parámetro. La verdad viaja como argumento, nunca vive aquí.
 *
 * Es la diferencia entre «no entra» (lo dice el aparato) y «está mal» (lo dice
 * la maestra), y es exactamente lo que enseña `n5-conecta-perifericos`: el
 * teclado USB *entra* en cualquier USB, y aun así hay un sitio donde va.
 */

/** Terna `[x, y, z]` en coordenadas del mundo. */
export type Punto3 = readonly [number, number, number];

/**
 * Un hueco donde encaja algo: un puerto de la parte de atrás, el zócalo del
 * CPU, el marco de la puerta donde va el sensor, el punto de medida de la
 * fuente.
 */
export interface AnclajeDef {
  id: string;
  /** Centro del hueco, en el mundo. La escena dibuja el aro aquí. */
  punto: Punto3;
  /**
   * Hacia dónde da el hueco. Por defecto hacia el frente (`[0, 0, 1]`).
   *
   * No es cosmético: el aro de un puerto de la trasera tiene que mirar hacia
   * atrás, y el de un sensor de techo hacia abajo. Un aro de canto no se ve, y
   * un hueco que no se ve es un hueco que el alumno no encuentra.
   */
  mira?: Punto3;
  /**
   * Qué **tipos** de pieza entran físicamente. Vacío = no entra nada (hueco
   * decorativo); `validarBanco` lo denuncia como defecto de autor.
   */
  acepta: readonly string[];
  /** Radio de encaje en unidades de mundo. Si falta, el del banco. */
  tolerancia?: number;
  /** Cuántas piezas caben (dos módulos de RAM en un par de ranuras). Def. 1. */
  capacidad?: number;
  /** Lo que dice el letrero anclado cuando el alumno se acerca. */
  etiqueta: string;
}

/**
 * Una pieza del banco: el cable del monitor, el módulo de RAM, el sensor de
 * puerta, la lata de aire comprimido.
 */
export interface PiezaDef {
  id: string;
  /** Su forma. Es lo que decide si entra: `'usb'`, `'hdmi'`, `'ram'`, `'aire'`. */
  tipo: string;
  /** Dónde descansa mientras nadie la toca (la charola, el suelo, la mesa). */
  origen: Punto3;
  etiqueta: string;
  /** `false` = está ahí para verse y nombrarse, pero no se puede coger. Def. true. */
  tomable?: boolean;
  /**
   * **Herramienta.** Se aplica sobre un anclaje y no se queda dentro: la lata
   * sopla el ventilador y vuelve a la mesa, el multímetro mide y vuelve.
   *
   * Cambio consciente respecto al `herramientas?: Herramienta3D[]` que proponía
   * el canon: una herramienta se coge, se lleva y se suelta encima de algo,
   * que es **el mismo gesto** que montar una pieza. Duplicar el subsistema para
   * cambiar sólo el desenlace habría sido construir dos motores donde hay uno.
   * Aquí es una bandera y quince líneas de desenlace distinto.
   */
  gasta?: boolean;
}

export interface BancoDef {
  piezas: readonly PiezaDef[];
  anclajes: readonly AnclajeDef[];
  /** Radio de encaje por defecto. */
  tolerancia?: number;
}

/**
 * El estado del banco, completo y serializable. La actividad lo tiene en su
 * `useState` y se lo pasa a la escena: la escena no guarda nada, igual que
 * `VentanaHojas`.
 */
export interface EstadoBanco {
  /** anclaje → piezas dentro, en orden de llegada. */
  readonly ocupacion: Readonly<Record<string, readonly string[]>>;
  /** anclaje → herramientas que se le han aplicado. */
  readonly aplicaciones: Readonly<Record<string, readonly string[]>>;
  /** La pieza que el alumno lleva en la mano, o `null`. */
  readonly tomada: string | null;
}

export const ESTADO_VACIO: EstadoBanco = Object.freeze({
  ocupacion: Object.freeze({}),
  aplicaciones: Object.freeze({}),
  tomada: null,
});

/** Radio de encaje por defecto, en unidades de mundo. */
export const TOLERANCIA = 0.42;

/**
 * Qué pasó al soltar. La escena no interpreta nada: reporta el punto, esto
 * decide, y la actividad decide qué contar.
 */
export type Suelta =
  /** Entró y se queda. */
  | { readonly tipo: 'encaja'; readonly pieza: string; readonly anclaje: string; readonly distancia: number }
  /** Herramienta aplicada: hizo su efecto y vuelve a su sitio. */
  | { readonly tipo: 'aplica'; readonly pieza: string; readonly anclaje: string; readonly distancia: number }
  /** Había un hueco cerca pero la pieza no cabe ahí. */
  | { readonly tipo: 'rebota'; readonly pieza: string; readonly anclaje: string; readonly motivo: 'forma' | 'lleno' }
  /** La soltó en mitad de la nada. */
  | { readonly tipo: 'vacio'; readonly pieza: string }
  /** No llevaba nada en la mano, o el banco está congelado. */
  | { readonly tipo: 'nada' };

// ─── Geometría ───────────────────────────────────────────────────────────────

/** Distancia euclídea entre dos puntos del mundo. */
export function distancia(a: Punto3, b: Punto3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

const toleranciaDe = (def: BancoDef, a: AnclajeDef): number =>
  a.tolerancia ?? def.tolerancia ?? TOLERANCIA;

/**
 * El anclaje cuyo centro cae más cerca del punto, **dentro de su tolerancia**.
 *
 * Ojo al orden: se compara contra la tolerancia de CADA anclaje, no contra una
 * global, porque un puerto de audio es un agujero de 3 mm y una bahía de fuente
 * es un cajón. Si dos entran en rango gana el más cercano; si ninguno entra,
 * `null`, y eso es «soltar en el vacío».
 */
export function anclajeMasCercano(
  def: BancoDef,
  punto: Punto3,
): { anclaje: AnclajeDef; distancia: number } | null {
  let mejor: { anclaje: AnclajeDef; distancia: number } | null = null;
  for (const a of def.anclajes) {
    const d = distancia(punto, a.punto);
    if (d > toleranciaDe(def, a)) continue;
    if (!mejor || d < mejor.distancia) mejor = { anclaje: a, distancia: d };
  }
  return mejor;
}

/**
 * El rayo que sale del ojo del alumno y atraviesa el píxel donde tiene el
 * puntero. Es **el único dato que fabrica el navegador** en todo el armazón:
 * react-three-fiber lo entrega ya hecho en `evento.ray`.
 *
 * `hacia` se espera unitario; `normalizarRayo` lo garantiza.
 */
export interface Rayo {
  readonly origen: Punto3;
  readonly hacia: Punto3;
}

/** Hacia dónde mira el alumno: un punto suelto del mundo, o su rayo. */
export type Mira = { readonly punto: Punto3 } | { readonly rayo: Rayo };

export function normalizarRayo(r: Rayo): Rayo {
  const [x, y, z] = r.hacia;
  const largo = Math.hypot(x, y, z);
  if (largo === 0) return { origen: r.origen, hacia: [0, 0, -1] };
  return { origen: r.origen, hacia: [x / largo, y / largo, z / largo] };
}

/**
 * Distancia de un punto a un rayo, y a qué profundidad queda.
 *
 * `avance` es cuánto hay que caminar por el rayo para quedar a la altura del
 * punto; negativo significa **detrás de la cámara**, y eso hay que descartarlo
 * o el alumno «apunta» a un puerto que tiene a su espalda.
 */
export function distanciaAlRayo(p: Punto3, rayo: Rayo): { distancia: number; avance: number } {
  const r = normalizarRayo(rayo);
  const vx = p[0] - r.origen[0];
  const vy = p[1] - r.origen[1];
  const vz = p[2] - r.origen[2];
  const avance = vx * r.hacia[0] + vy * r.hacia[1] + vz * r.hacia[2];
  const px = vx - r.hacia[0] * avance;
  const py = vy - r.hacia[1] * avance;
  const pz = vz - r.hacia[2] * avance;
  return { distancia: Math.hypot(px, py, pz), avance };
}

/** Un punto del rayo, a `avance` unidades del ojo. */
export function puntoSobreRayo(rayo: Rayo, avance: number): Punto3 {
  const r = normalizarRayo(rayo);
  return [
    r.origen[0] + r.hacia[0] * avance,
    r.origen[1] + r.hacia[1] * avance,
    r.origen[2] + r.hacia[2] * avance,
  ];
}

/**
 * **A qué anclaje está apuntando.**
 *
 * Ésta es la decisión de diseño que más se nota jugando, y está **medida**, no
 * supuesta: la prueba «MEDIDO: con huecos repartidos en profundidad…» de
 * `laboratorio3d.test.tsx` hace la cuenta entera y compara los dos métodos.
 *
 * La versión obvia es soltar la pieza sobre un plano de cara a la cámara y
 * comparar distancias de punto a punto. Al medirla resultó que aguanta más de
 * lo que parece —un reparto vertical, como un sensor en el techo y otro en el
 * suelo, cae *dentro* del plano y funciona—, pero se rompe cuando los huecos se
 * reparten **en la dirección en que mira el alumno**: la casa de
 * `n9-sensores-iot` con un sensor en la puerta de entrada y otro en el techo
 * del fondo del pasillo. Ahí la pieza cae a 2,3 unidades del hueco al que
 * apuntaba, con una tolerancia de 0,4, y no alcanza ni a ése ni al otro. La
 * actividad no sería difícil: sería imposible.
 *
 * Con el rayo la pregunta deja de ser «¿dónde cayó la pieza?» y pasa a ser «¿a
 * qué está apuntando?», que además es lo que el alumno cree que está haciendo.
 * Y la profundidad deja de importar.
 *
 * Empate: gana el que esté más centrado en la mira, no el más cercano al ojo.
 * Apuntar es apuntar.
 */
export function anclajeApuntado(
  def: BancoDef,
  mira: Mira,
): { anclaje: AnclajeDef; distancia: number } | null {
  if ('punto' in mira) return anclajeMasCercano(def, mira.punto);
  let mejor: { anclaje: AnclajeDef; distancia: number } | null = null;
  for (const a of def.anclajes) {
    const { distancia: d, avance } = distanciaAlRayo(a.punto, mira.rayo);
    if (avance <= 0) continue;
    if (d > toleranciaDe(def, a)) continue;
    if (!mejor || d < mejor.distancia) mejor = { anclaje: a, distancia: d };
  }
  return mejor;
}

/** El centro de todos los huecos: la profundidad a la que descansa el arrastre. */
export function centroAnclajes(def: BancoDef): Punto3 {
  if (def.anclajes.length === 0) return [0, 0, 0];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const a of def.anclajes) {
    x += a.punto[0];
    y += a.punto[1];
    z += a.punto[2];
  }
  const n = def.anclajes.length;
  return [x / n, y / n, z / n];
}

/**
 * A qué profundidad del rayo se dibuja la pieza que va en la mano.
 *
 * Si está apuntando a un hueco, a la profundidad de ese hueco: la pieza **se
 * acerca sola al puerto** conforme el alumno afina la puntería, y ése es todo
 * el aviso de «vas bien» que hace falta. Si no apunta a nada, a la profundidad
 * del centro del banco, para que no se vaya al infinito ni se meta en el ojo.
 */
export function avanceDeArrastre(def: BancoDef, rayo: Rayo): number {
  const apuntado = anclajeApuntado(def, { rayo });
  const destino = apuntado ? apuntado.anclaje.punto : centroAnclajes(def);
  const { avance } = distanciaAlRayo(destino, rayo);
  return avance > 0.2 ? avance : 0.2;
}

// ─── Consultas ───────────────────────────────────────────────────────────────

export const piezaDe = (def: BancoDef, id: string): PiezaDef | null =>
  def.piezas.find((p) => p.id === id) ?? null;

export const anclajeDe = (def: BancoDef, id: string): AnclajeDef | null =>
  def.anclajes.find((a) => a.id === id) ?? null;

/** En qué anclaje está esta pieza, o `null` si está en su sitio de descanso. */
export function dondeEsta(estado: EstadoBanco, pieza: string): string | null {
  for (const [anclaje, dentro] of Object.entries(estado.ocupacion)) {
    if (dentro.includes(pieza)) return anclaje;
  }
  return null;
}

/** Qué hay dentro de este anclaje. */
export const dentroDe = (estado: EstadoBanco, anclaje: string): readonly string[] =>
  estado.ocupacion[anclaje] ?? [];

/** ¿Le han aplicado ya esta herramienta a este anclaje? */
export const seAplico = (estado: EstadoBanco, anclaje: string, herramienta: string): boolean =>
  (estado.aplicaciones[anclaje] ?? []).includes(herramienta);

const libre = (def: BancoDef, estado: EstadoBanco, a: AnclajeDef): boolean =>
  dentroDe(estado, a.id).length < (a.capacidad ?? 1);

/**
 * ¿Se puede coger? Una pieza clavada como decorado no; una ya en la mano
 * tampoco; y con el banco congelado, ninguna.
 */
export function puedeTomar(
  def: BancoDef,
  estado: EstadoBanco,
  pieza: string,
  interactivo = true,
): boolean {
  if (!interactivo) return false;
  const p = piezaDe(def, pieza);
  if (!p) return false;
  if (p.tomable === false) return false;
  return estado.tomada !== pieza;
}

/**
 * **Dónde se dibuja la pieza ahora mismo.** Es puro a propósito: la escena no
 * decide posiciones, sólo pinta lo que esta función dice, y así se puede
 * comprobar sin WebGL que una pieza soltada al vacío vuelve exactamente a su
 * origen y no se queda flotando donde la dejaron.
 *
 * `puntero` es el único dato que viene del navegador; sólo manda mientras la
 * pieza está en la mano.
 */
export function posicionDe(
  def: BancoDef,
  estado: EstadoBanco,
  pieza: string,
  puntero: Punto3 | null,
): Punto3 {
  const p = piezaDe(def, pieza);
  if (!p) return [0, 0, 0];
  if (estado.tomada === pieza && puntero) return puntero;
  const anclaje = dondeEsta(estado, pieza);
  if (anclaje) {
    const a = anclajeDe(def, anclaje);
    if (a) return a.punto;
  }
  return p.origen;
}

// ─── Transiciones ────────────────────────────────────────────────────────────

/**
 * Coger una pieza.
 *
 * Dos cosas que parecen detalle y no lo son, y que salen de jugar mal:
 *
 * 1. Coger una pieza **ya montada la desmonta**. Es lo que pide «reasienta la
 *    RAM»: se saca y se vuelve a meter. Si el armazón se negara, la actividad
 *    tendría que inventarse su propio desmontaje y ya no sería el mismo gesto.
 * 2. Coger una **con otra en la mano** devuelve la primera a su origen. La
 *    alternativa —ignorar el segundo clic— deja al alumno con una pieza pegada
 *    a la mano sin saber por qué no responde nada.
 */
export function tomar(
  def: BancoDef,
  estado: EstadoBanco,
  pieza: string,
  interactivo = true,
): EstadoBanco {
  if (!puedeTomar(def, estado, pieza, interactivo)) return estado;
  const anclaje = dondeEsta(estado, pieza);
  const ocupacion = anclaje ? sinPieza(estado.ocupacion, pieza) : estado.ocupacion;
  return { ...estado, ocupacion, tomada: pieza };
}

/** Soltar lo que se lleva sin colocarlo: vuelve a su origen (tecla Escape). */
export function devolver(estado: EstadoBanco): EstadoBanco {
  if (estado.tomada === null) return estado;
  return { ...estado, tomada: null };
}

/** Sacar una pieza de su anclaje sin llevársela a la mano. */
export function quitarPieza(estado: EstadoBanco, pieza: string): EstadoBanco {
  if (dondeEsta(estado, pieza) === null) return estado;
  return { ...estado, ocupacion: sinPieza(estado.ocupacion, pieza) };
}

function sinPieza(
  ocupacion: Readonly<Record<string, readonly string[]>>,
  pieza: string,
): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = {};
  for (const [anclaje, dentro] of Object.entries(ocupacion)) {
    const quedan = dentro.filter((p) => p !== pieza);
    if (quedan.length) out[anclaje] = quedan;
  }
  return out;
}

/**
 * La decisión de soltar, entera y pura. Recibe el punto del mundo que fabricó
 * el raycast y devuelve qué pasó; no toca el estado (eso es `aplicarSuelta`),
 * para que la actividad pueda sonar el tono de error *antes* de mover nada.
 */
export function resolverSuelta(
  def: BancoDef,
  estado: EstadoBanco,
  mira: Mira,
  interactivo = true,
): Suelta {
  const cerca = anclajeApuntado(def, mira);
  if (!cerca) {
    const pieza = estado.tomada;
    if (!interactivo || pieza === null || !piezaDe(def, pieza)) return { tipo: 'nada' };
    return { tipo: 'vacio', pieza };
  }
  return desenlace(def, estado, cerca.anclaje, cerca.distancia, interactivo);
}

/**
 * El mismo desenlace, pero nombrando el hueco en vez de apuntarlo. Es la
 * puerta del teclado y la del respaldo sin WebGL: ahí no hay rayo ninguno, hay
 * un `<button>` que dice «ranura PCIe».
 */
export function resolverSueltaEn(
  def: BancoDef,
  estado: EstadoBanco,
  anclaje: string,
  interactivo = true,
): Suelta {
  const a = anclajeDe(def, anclaje);
  if (!a) return { tipo: 'nada' };
  return desenlace(def, estado, a, 0, interactivo);
}

function desenlace(
  def: BancoDef,
  estado: EstadoBanco,
  anclaje: AnclajeDef,
  d: number,
  interactivo: boolean,
): Suelta {
  const pieza = estado.tomada;
  if (!interactivo || pieza === null) return { tipo: 'nada' };
  const p = piezaDe(def, pieza);
  if (!p) return { tipo: 'nada' };

  if (!anclaje.acepta.includes(p.tipo)) {
    return { tipo: 'rebota', pieza, anclaje: anclaje.id, motivo: 'forma' };
  }
  // Una herramienta no ocupa sitio, así que un zócalo lleno no le estorba: se
  // puede soplar el polvo de un ventilador que ya está montado.
  if (p.gasta) return { tipo: 'aplica', pieza, anclaje: anclaje.id, distancia: d };
  if (!libre(def, estado, anclaje)) {
    return { tipo: 'rebota', pieza, anclaje: anclaje.id, motivo: 'lleno' };
  }
  return { tipo: 'encaja', pieza, anclaje: anclaje.id, distancia: d };
}

/**
 * Aplica el desenlace. `'nada'` devuelve **el mismo objeto**, no una copia: así
 * un `useMemo` o un `React.memo` río abajo no se despierta por un clic que no
 * hizo nada.
 */
export function aplicarSuelta(estado: EstadoBanco, s: Suelta): EstadoBanco {
  switch (s.tipo) {
    case 'nada':
      return estado;
    case 'vacio':
    case 'rebota':
      // La pieza vuelve a su origen. El error nunca borra lo ya montado.
      return { ...estado, tomada: null };
    case 'aplica': {
      const previas = estado.aplicaciones[s.anclaje] ?? [];
      if (previas.includes(s.pieza)) return { ...estado, tomada: null };
      return {
        ...estado,
        aplicaciones: { ...estado.aplicaciones, [s.anclaje]: [...previas, s.pieza] },
        tomada: null,
      };
    }
    case 'encaja':
      return {
        ...estado,
        ocupacion: { ...estado.ocupacion, [s.anclaje]: [...dentroDe(estado, s.anclaje), s.pieza] },
        tomada: null,
      };
  }
}

/** Atajo: resolver y aplicar de un golpe, cuando no hace falta el desenlace. */
export function soltar(
  def: BancoDef,
  estado: EstadoBanco,
  mira: Mira,
  interactivo = true,
): { estado: EstadoBanco; suelta: Suelta } {
  const suelta = resolverSuelta(def, estado, mira, interactivo);
  return { estado: aplicarSuelta(estado, suelta), suelta };
}

/** El mismo atajo por el nombre del hueco (teclado y respaldo). */
export function soltarEn(
  def: BancoDef,
  estado: EstadoBanco,
  anclaje: string,
  interactivo = true,
): { estado: EstadoBanco; suelta: Suelta } {
  const suelta = resolverSueltaEn(def, estado, anclaje, interactivo);
  return { estado: aplicarSuelta(estado, suelta), suelta };
}

// ─── Comprobar el estado ─────────────────────────────────────────────────────

/** Las que hay que montar: todas menos las herramientas. */
export const piezasPorMontar = (def: BancoDef): readonly PiezaDef[] =>
  def.piezas.filter((p) => !p.gasta && p.tomable !== false);

/**
 * «¿Está todo conectado?» — física pura: ninguna pieza montable en la charola y
 * ninguna en la mano. No dice si está BIEN conectado; eso es `evaluar`.
 */
export function montajeCompleto(def: BancoDef, estado: EstadoBanco): boolean {
  if (estado.tomada !== null) return false;
  return piezasPorMontar(def).every((p) => dondeEsta(estado, p.id) !== null);
}

export interface Evaluacion {
  /** Piezas montadas donde la clase dice. */
  readonly correctas: readonly string[];
  /** Montadas, pero en otro sitio. */
  readonly equivocadas: readonly { pieza: string; esta: string; deberia: string }[];
  /** Todavía sin montar. */
  readonly faltantes: readonly string[];
  readonly completo: boolean;
}

/**
 * «¿Esto va en el sitio correcto?»
 *
 * **`esperado` es un parámetro y ésa es toda la arquitectura**: el aparato no
 * lleva dentro la respuesta de ninguna clase. Dos actividades pueden montar el
 * mismo gabinete con dos tablas distintas —una enseña el orden de armado, otra
 * enseña qué falla— y el armazón no se entera.
 */
export function evaluar(
  def: BancoDef,
  estado: EstadoBanco,
  esperado: Readonly<Record<string, string>>,
): Evaluacion {
  const correctas: string[] = [];
  const equivocadas: { pieza: string; esta: string; deberia: string }[] = [];
  const faltantes: string[] = [];
  for (const [pieza, deberia] of Object.entries(esperado)) {
    const esta = dondeEsta(estado, pieza);
    if (esta === null) faltantes.push(pieza);
    else if (esta === deberia) correctas.push(pieza);
    else equivocadas.push({ pieza, esta, deberia });
  }
  return {
    correctas,
    equivocadas,
    faltantes,
    completo: faltantes.length === 0 && equivocadas.length === 0 && montajeCompleto(def, estado),
  };
}

// ─── Letreros del mundo ──────────────────────────────────────────────────────

/**
 * Parte un texto en renglones de como mucho `ancho` caracteres, sin cortar
 * palabras.
 *
 * Está aquí, en el módulo puro, porque el letrero del Banco Físico **no es
 * DOM**: se dibuja en un lienzo 2D y se pega como textura sobre una placa que
 * gira con el mundo. Un lienzo no reparte renglones solo, así que el reparto
 * hay que hacerlo a mano — y una vez hecho a mano, es aritmética de cadenas y
 * se prueba sin montar nada.
 *
 * Una palabra más larga que el renglón se queda sola en su renglón y se sale;
 * es preferible a partirla por la mitad, y `Radiofrecuencia` cabe.
 */
export function partirEnLineas(texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  const lineas: string[] = [];
  let actual = palabras[0];
  for (let i = 1; i < palabras.length; i++) {
    const cabe = actual.length + 1 + palabras[i].length <= ancho;
    if (cabe) actual += ` ${palabras[i]}`;
    else {
      lineas.push(actual);
      actual = palabras[i];
    }
  }
  lineas.push(actual);
  return lineas;
}

// ─── Defectos de autor ───────────────────────────────────────────────────────

/**
 * Revisa el banco antes de montarlo. No es paranoia de tipos: son los cinco
 * errores que dejan una actividad **imposible de terminar** y que sólo se
 * notan jugando, cuando el alumno lleva diez minutos apuntando a un hueco que
 * nunca lo va a admitir.
 *
 * El quinto —dos anclajes con las tolerancias solapadas— es el que no se ve
 * leyendo el código: los dos huecos existen, aceptan lo suyo, y aun así el
 * alumno no puede elegir cuál, porque el punto que suelta cae dentro de los
 * dos y gana el más cercano por milímetros. Eso no es dificultad, es lotería.
 */
export function validarBanco(def: BancoDef): string[] {
  const fallos: string[] = [];
  const idsPieza = new Set<string>();
  for (const p of def.piezas) {
    if (idsPieza.has(p.id)) fallos.push(`pieza duplicada: ${p.id}`);
    idsPieza.add(p.id);
  }
  const idsAnclaje = new Set<string>();
  for (const a of def.anclajes) {
    if (idsAnclaje.has(a.id)) fallos.push(`anclaje duplicado: ${a.id}`);
    idsAnclaje.add(a.id);
    if (a.acepta.length === 0) fallos.push(`anclaje sin formas admitidas: ${a.id}`);
    if ((a.capacidad ?? 1) < 1) fallos.push(`anclaje con capacidad menor que 1: ${a.id}`);
    if (a.tolerancia !== undefined && a.tolerancia <= 0) {
      fallos.push(`anclaje con tolerancia no positiva: ${a.id}`);
    }
  }
  const aceptados = new Set(def.anclajes.flatMap((a) => a.acepta));
  for (const p of piezasPorMontar(def)) {
    if (!aceptados.has(p.tipo)) fallos.push(`pieza que no entra en ningún anclaje: ${p.id}`);
  }
  for (let i = 0; i < def.anclajes.length; i++) {
    for (let j = i + 1; j < def.anclajes.length; j++) {
      const a = def.anclajes[i];
      const b = def.anclajes[j];
      const d = distancia(a.punto, b.punto);
      if (d < toleranciaDe(def, a) + toleranciaDe(def, b)) {
        fallos.push(`anclajes con tolerancias solapadas: ${a.id} y ${b.id}`);
      }
    }
  }
  return fallos;
}
