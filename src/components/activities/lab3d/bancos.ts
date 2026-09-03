/**
 * Las tres clases de volumen, en aritmética pura (documento §53).
 *
 * ─── Por qué la verdad de las clases vive aquí y no en el componente ─────────
 *
 * El armazón `laboratorio3d` **no corrige**: sabe de física —una clavija HDMI no
 * entra en un puerto USB, un zócalo lleno no admite otra— y nada más. Quién
 * acierta y quién se equivoca lo dice la clase, y lo dice con una tabla.
 *
 * Esas tablas están aquí, sueltas de React y de three, por la misma razón que
 * el núcleo del armazón: jsdom no tiene WebGL, así que cualquier regla que viva
 * dentro de la escena es una regla sin probar. Aquí son datos y funciones puras,
 * y por eso las pruebas de las tres clases pueden comprobar sin montar nada que
 * el jack entra en los tres agujeros de audio y que sólo el verde está bien.
 *
 * ─── Geometría: los números están calculados, no tanteados ───────────────────
 *
 * `validarBanco` denuncia dos anclajes cuyas tolerancias se solapan, y con
 * razón: si el punto que el alumno apunta cae dentro de los dos, gana el más
 * cercano por milímetros y eso no es dificultad, es lotería. Los tres bancos de
 * abajo cumplen la separación con margen y hay una prueba que lo comprueba
 * —para los tres— antes de que nadie los juegue.
 *
 * Convención de ejes: el alumno arranca mirando desde +Z. El equipo enseña **su
 * panel trasero de cara a la cámara**, porque es de lo que trata la clase: para
 * conectar un cable uno se pone detrás de la máquina, y ahí es donde arranca.
 * La cara delantera —con su led y su botón— es la recompensa de dar la vuelta.
 */

import {
  ESTADO_VACIO,
  dondeEsta,
  seAplico,
  type BancoDef,
  type EstadoBanco,
  type Punto3,
} from '@/components/simuladores/laboratorio3d/bancoFisico';

// ─────────────────────────────────────────────────────────────────────────────
// 1 · n5-conecta-perifericos — «Conecta los periféricos» (N5, 10–11 años)
// ─────────────────────────────────────────────────────────────────────────────

/** Los seis conectores de la mesa, y el orden en que descansan de izquierda a derecha. */
export type CablePerif = 'teclado' | 'raton' | 'monitor' | 'bocinas' | 'red' | 'corriente';

export const CABLES: readonly CablePerif[] = ['teclado', 'raton', 'monitor', 'bocinas', 'red', 'corriente'];

/** Z del panel de puertos. El cuerpo del equipo llega hasta 0,65. */
const PANEL_Z = 0.66;
/** Hacia dónde miran los aros del panel: hacia el alumno. */
const MIRA_PANEL: Punto3 = [0, 0, 1];
/** La mesa: dónde descansan los conectores mientras nadie los toca. */
const MESA_Y = -0.92;

const reposo = (i: number): Punto3 => [-1.55 + i * 0.62, MESA_Y, 1.5];

/**
 * El banco de «Conecta los periféricos».
 *
 * Tres decisiones que son la clase entera:
 *
 * 1. **Los dos USB son UN anclaje de capacidad 2**, no dos anclajes. El teclado
 *    y el ratón son intercambiables entre sí en un equipo de verdad, y hacer de
 *    eso un error sería castigar al alumno por tener razón — que es justo el
 *    defecto que ya apareció una vez en este proyecto («jugar BIEN daba la peor
 *    nota»). Un bloque USB doble es además lo que se ve en una trasera real.
 * 2. **Los tres jacks de audio aceptan el jack.** Físicamente son idénticos por
 *    dentro y por eso están pintados. El aparato deja meterlo en los tres; que
 *    el de las bocinas sea el verde lo dice la tabla de verdad, no el hueco. Es
 *    la diferencia entre «no entra» y «está mal», y es la lección central.
 * 3. **El VGA existe y no admite nada de lo que hay en la mesa.** Es un hueco
 *    para que el error ocurra: el HDMI rebota ahí por forma y Bit lo explica.
 */
export const BANCO_PERIFERICOS: BancoDef = {
  tolerancia: 0.22,
  piezas: [
    { id: 'teclado', tipo: 'usb', origen: reposo(0), etiqueta: 'Teclado · USB' },
    { id: 'raton', tipo: 'usb', origen: reposo(1), etiqueta: 'Ratón · USB' },
    { id: 'monitor', tipo: 'hdmi', origen: reposo(2), etiqueta: 'Monitor · HDMI' },
    { id: 'bocinas', tipo: 'audio', origen: reposo(3), etiqueta: 'Bocinas · jack 3,5 mm' },
    { id: 'red', tipo: 'rj45', origen: reposo(4), etiqueta: 'Red · RJ-45' },
    { id: 'corriente', tipo: 'iec', origen: reposo(5), etiqueta: 'Corriente' },
  ],
  anclajes: [
    {
      id: 'usb',
      punto: [-0.45, 1.0, PANEL_Z],
      mira: MIRA_PANEL,
      acepta: ['usb'],
      capacidad: 2,
      tolerancia: 0.22,
      etiqueta: 'USB (dos puertos)',
    },
    { id: 'vga', punto: [0.14, 1.0, PANEL_Z], mira: MIRA_PANEL, acepta: ['vga'], tolerancia: 0.22, etiqueta: 'VGA' },
    { id: 'red', punto: [0.58, 1.0, PANEL_Z], mira: MIRA_PANEL, acepta: ['rj45'], tolerancia: 0.18, etiqueta: 'Red' },
    { id: 'hdmi', punto: [0.14, 0.52, PANEL_Z], mira: MIRA_PANEL, acepta: ['hdmi'], tolerancia: 0.22, etiqueta: 'HDMI' },
    {
      id: 'audio-verde',
      punto: [-0.5, 0.46, PANEL_Z],
      mira: MIRA_PANEL,
      acepta: ['audio'],
      tolerancia: 0.17,
      etiqueta: 'Audio verde',
    },
    {
      id: 'audio-rosa',
      punto: [-0.5, 0.06, PANEL_Z],
      mira: MIRA_PANEL,
      acepta: ['audio'],
      tolerancia: 0.17,
      etiqueta: 'Audio rosa',
    },
    {
      id: 'audio-azul',
      punto: [-0.5, -0.34, PANEL_Z],
      mira: MIRA_PANEL,
      acepta: ['audio'],
      tolerancia: 0.17,
      etiqueta: 'Audio azul',
    },
    {
      id: 'corriente',
      punto: [0.42, -0.46, PANEL_Z],
      mira: MIRA_PANEL,
      acepta: ['iec'],
      tolerancia: 0.24,
      etiqueta: 'Toma de corriente',
    },
  ],
};

/** Dónde va cada cable. Es el `esperado` que recibe `evaluar`. */
export const ESPERADO_PERIFERICOS: Readonly<Record<CablePerif, string>> = {
  teclado: 'usb',
  raton: 'usb',
  monitor: 'hdmi',
  bocinas: 'audio-verde',
  red: 'red',
  corriente: 'corriente',
};

/** Lo que Bit dice al conectar bien cada cable. */
export const VOZ_CABLE: Readonly<Record<CablePerif, string>> = {
  teclado:
    'Entró. Los dos USB son iguales por dentro: el teclado y el ratón van uno en cada uno, y da igual cuál en cuál.',
  raton: 'El ratón, en el otro USB. Fíjate en que no hubo que forzar nada: cuando la forma es la correcta, entra sola.',
  monitor: 'HDMI: plano y con las dos esquinas de abajo recortadas. Lleva la imagen y el sonido por el mismo cable.',
  bocinas: 'Verde. Los tres agujeros son idénticos por dentro, y por eso están pintados: éste es el de las bocinas.',
  red: 'Y ese clic de la pestaña es la señal de que quedó bien. Para sacarlo, se aprieta la pestaña primero.',
  corriente: 'La corriente, al final y siempre tomándola del conector. Ya está todo: sube la palanca del regulador.',
};

/**
 * Por qué está mal un jack en el agujero que no es. El armazón lo dejó entrar
 * —físicamente entra— y aquí la clase dice que no es su sitio.
 */
export const VOZ_AUDIO_MAL: Readonly<Record<string, string>> = {
  'audio-rosa':
    'Entra, sí. Pero ése es el del micrófono. Los tres agujeros son idénticos por dentro: el de las bocinas es el verde.',
  'audio-azul':
    'Entra, pero el azul es la entrada de línea, para meter sonido de otro aparato. Las bocinas van en el verde.',
};

/**
 * ¿Este cable quedó donde le toca?
 *
 * Se pregunta por el anclaje y no por la pieza porque es lo que se sabe en el
 * momento de soltar, antes de tocar el estado.
 */
export const cableCorrecto = (cable: CablePerif, anclaje: string): boolean =>
  ESPERADO_PERIFERICOS[cable] === anclaje;

/** ¿Están los seis cables en su sitio? (La palanca es aparte.) */
export const seisConectados = (banco: EstadoBanco): boolean =>
  CABLES.every((c) => dondeEsta(banco, c) === ESPERADO_PERIFERICOS[c]);

// ─────────────────────────────────────────────────────────────────────────────
// 2 · n5-manos-al-mantenimiento — «Manos al mantenimiento» (N5, 10–11 años)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Los diez pasos, en el orden en que se hacen, y el orden **es** media lección.
 *
 * Tres de ellos —`ventilador`, `disipador`, `ram`— son un bloque suelto: dentro
 * del equipo abierto da igual por cuál se empiece, y exigir un orden ahí sería
 * inventarse una regla que en el taller no existe. Lo que sí es estricto es
 * todo lo que rodea a ese bloque, porque son reglas de seguridad de verdad:
 * primero fuera la corriente, luego la estática, luego los tornillos, luego se
 * abre; y al revés para cerrar.
 */
export type PasoMant =
  | 'corriente-fuera'
  | 'estatica'
  | 'tornillos-fuera'
  | 'abrir'
  | 'ventilador'
  | 'disipador'
  | 'ram'
  | 'cerrar'
  | 'tornillos-puestos'
  | 'corriente-puesta';

export const PASOS_MANT: readonly PasoMant[] = [
  'corriente-fuera',
  'estatica',
  'tornillos-fuera',
  'abrir',
  'ventilador',
  'disipador',
  'ram',
  'cerrar',
  'tornillos-puestos',
  'corriente-puesta',
];

/** Lo que hay que haber hecho antes de cada paso. Tabla, no cadena de `if`. */
export const REQUISITOS_MANT: Readonly<Record<PasoMant, readonly PasoMant[]>> = {
  'corriente-fuera': [],
  estatica: ['corriente-fuera'],
  'tornillos-fuera': ['corriente-fuera', 'estatica'],
  abrir: ['corriente-fuera', 'estatica', 'tornillos-fuera'],
  ventilador: ['abrir'],
  disipador: ['abrir'],
  ram: ['abrir'],
  cerrar: ['ventilador', 'disipador', 'ram'],
  'tornillos-puestos': ['cerrar'],
  'corriente-puesta': ['tornillos-puestos'],
};

/** ¿Se puede dar este paso ya, con lo que hay hecho? */
export const pasoPermitido = (paso: PasoMant, hechos: readonly PasoMant[]): boolean =>
  REQUISITOS_MANT[paso].every((r) => hechos.includes(r));

const INTERIOR_Z = 0.1;
const CHAPA_Z = 0.66;
const MIRA_LADO: Punto3 = [0, 0, 1];

export const BANCO_MANTENIMIENTO: BancoDef = {
  tolerancia: 0.22,
  piezas: [
    // Empiezan puestas: el equipo está montado y funcionando, y de eso trata la
    // clase — se desarma lo justo y se vuelve a dejar como estaba.
    { id: 'corriente', tipo: 'iec', origen: [-1.5, -0.92, 1.6], etiqueta: 'Cable de corriente' },
    { id: 'ram', tipo: 'ram', origen: [-0.5, -0.92, 1.6], etiqueta: 'Módulo de RAM' },
    // Los dos se llaman distinto a propósito: son idénticos como objeto, pero
    // el respaldo sin WebGL los nombra en voz alta y «Tornillo» dos veces deja
    // al alumno de teclado sin saber cuál está tocando.
    { id: 'tornillo1', tipo: 'tornillo', origen: [0.15, -0.92, 1.6], etiqueta: 'Tornillo de arriba' },
    { id: 'tornillo2', tipo: 'tornillo', origen: [0.6, -0.92, 1.6], etiqueta: 'Tornillo de abajo' },
    // La lata se aplica y vuelve a la mesa: no ocupa sitio dentro del equipo.
    { id: 'aire', tipo: 'aire', origen: [1.3, -0.88, 1.6], etiqueta: 'Aire comprimido', gasta: true },
  ],
  anclajes: [
    {
      // El enchufe del regulador, en la mesa: es el que de verdad se desconecta,
      // y está a la vista desde el arranque sin tener que rodear el equipo.
      id: 'toma-corriente',
      punto: [-1.5, -0.86, 0.85],
      mira: MIRA_LADO,
      acepta: ['iec'],
      tolerancia: 0.22,
      etiqueta: 'Toma del regulador',
    },
    {
      id: 'ranura-ram',
      punto: [-0.18, 0.72, INTERIOR_Z],
      mira: MIRA_LADO,
      acepta: ['ram'],
      tolerancia: 0.2,
      etiqueta: 'Ranura de RAM',
    },
    {
      id: 'disipador',
      punto: [-0.18, 0.18, INTERIOR_Z],
      mira: MIRA_LADO,
      acepta: ['aire'],
      tolerancia: 0.24,
      etiqueta: 'Disipador',
    },
    {
      id: 'ventilador',
      punto: [0.46, 0.95, INTERIOR_Z],
      mira: MIRA_LADO,
      acepta: ['aire'],
      tolerancia: 0.22,
      etiqueta: 'Ventilador',
    },
    {
      id: 'tornillo-a',
      punto: [0.66, 0.95, CHAPA_Z],
      mira: MIRA_LADO,
      acepta: ['tornillo'],
      tolerancia: 0.15,
      etiqueta: 'Tornillo de arriba',
    },
    {
      id: 'tornillo-b',
      punto: [0.66, -0.55, CHAPA_Z],
      mira: MIRA_LADO,
      acepta: ['tornillo'],
      tolerancia: 0.15,
      etiqueta: 'Tornillo de abajo',
    },
  ],
};

/** Los huecos que sólo existen con la tapa abierta. */
export const INTERIOR_MANT: readonly string[] = ['ranura-ram', 'disipador', 'ventilador'];

export const esInterior = (anclaje: string): boolean => INTERIOR_MANT.includes(anclaje);

/**
 * El estado de partida: el equipo **ya está montado**. Es lo contrario de
 * `n7-dentro-del-gabinete`, donde se arma desde cero, y es a propósito: aquí la
 * primera destreza es desmontar en el orden correcto.
 */
export const BANCO_MANT_INICIAL: EstadoBanco = Object.freeze({
  ocupacion: Object.freeze({
    'toma-corriente': Object.freeze(['corriente']) as readonly string[],
    'ranura-ram': Object.freeze(['ram']) as readonly string[],
    'tornillo-a': Object.freeze(['tornillo1']) as readonly string[],
    'tornillo-b': Object.freeze(['tornillo2']) as readonly string[],
  }),
  aplicaciones: Object.freeze({}),
  tomada: null,
});

/** Dónde acaba cada pieza cuando el mantenimiento está bien hecho. */
export const ESPERADO_MANT: Readonly<Record<string, string>> = {
  corriente: 'toma-corriente',
  ram: 'ranura-ram',
  tornillo1: 'tornillo-a',
  tornillo2: 'tornillo-b',
};

/** Las tres tareas de dentro, que se pueden hacer en cualquier orden. */
export const interiorHecho = (banco: EstadoBanco): { ventilador: boolean; disipador: boolean; ram: boolean } => ({
  ventilador: seAplico(banco, 'ventilador', 'aire'),
  disipador: seAplico(banco, 'disipador', 'aire'),
  ram: dondeEsta(banco, 'ram') === 'ranura-ram',
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 · n7-diagnostica-y-soluciona — «Diagnostica y soluciona» (N7, 12–13 años)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ronda 1 · el protocolo. Cinco casillas de un carril y siete chapas grabadas:
 * las cinco del protocolo y dos que parecen soluciones y son el último recurso.
 * Todas son del mismo tipo, así que **todas entran en todas las casillas**: la
 * física no ayuda aquí, y ése es el punto — lo que se evalúa es el criterio.
 */
export const CHAPAS_PROTOCOLO: readonly { id: string; texto: string; orden: number | null }[] = [
  { id: 'observa', texto: 'Observa el síntoma exacto', orden: 1 },
  { id: 'simple', texto: 'Comprueba lo simple', orden: 2 },
  { id: 'aisla', texto: 'Aísla una variable', orden: 3 },
  { id: 'minima', texto: 'Aplica la solución mínima', orden: 4 },
  { id: 'verifica', texto: 'Verifica y anota', orden: 5 },
  { id: 'reinstala', texto: 'Reinstala el sistema', orden: null },
  { id: 'cara', texto: 'Cambia la pieza más cara', orden: null },
];

export const CASILLAS: readonly string[] = ['c1', 'c2', 'c3', 'c4', 'c5'];

export const BANCO_PROTOCOLO: BancoDef = {
  tolerancia: 0.22,
  piezas: CHAPAS_PROTOCOLO.map((c, i) => ({
    id: c.id,
    tipo: 'chapa',
    origen: [-1.35 + i * 0.45, -0.55, 1.35] as Punto3,
    etiqueta: c.texto,
  })),
  anclajes: CASILLAS.map((id, i) => ({
    id,
    punto: [-1.0 + i * 0.5, 0.05, 0.15] as Punto3,
    // Las casillas son ranuras de un carril horizontal: el aro se acuesta.
    mira: [0, 1, 0] as Punto3,
    acepta: ['chapa'],
    tolerancia: 0.22,
    etiqueta: `Casilla ${i + 1}`,
  })),
};

/** El orden correcto del protocolo, como tabla para `evaluar`. */
export const ESPERADO_PROTOCOLO: Readonly<Record<string, string>> = {
  observa: 'c1',
  simple: 'c2',
  aisla: 'c3',
  minima: 'c4',
  verifica: 'c5',
};

/** Por qué las dos chapas que sobran no son el primer paso de nada. */
export const VOZ_DISTRACTORA: Readonly<Record<string, string>> = {
  reinstala:
    'Reinstalar es el último recurso, no el primero: borras el problema junto con todo lo demás y sigues sin saber qué era.',
  cara: 'Cambiar la pieza más cara es cambiar tres cosas a la vez y quedarte sin saber cuál era. Y suele no ser ésa.',
};

/** Ronda 2 · las cinco averías. Cada una: un instrumento, un punto, una solución. */
export interface Averia {
  id: string;
  sintoma: string;
  /** El instrumento que descarta o confirma. */
  instrumento: string;
  /** Dónde se aplica. El sitio es la mitad del diagnóstico. */
  punto: string;
  /** Lo que el instrumento revela. */
  lectura: string;
  /** La pieza que resuelve, y adónde va. */
  solucion: { pieza: string; anclaje: string };
  /** Cómo se llama la solución cuando se cuenta. */
  arreglo: string;
}

export const AVERIAS: readonly Averia[] = [
  {
    id: 'sin-corriente',
    sintoma: 'No enciende nada: ni led, ni ventiladores',
    instrumento: 'probador-corriente',
    punto: 'toma-corriente',
    lectura: 'El probador no se enciende: a la toma no le llega corriente. El cable está flojo.',
    solucion: { pieza: 'cable-corriente', anclaje: 'toma-corriente' },
    arreglo: 'Reconectar el cable de corriente',
  },
  {
    id: 'sin-imagen',
    sintoma: 'Enciende y suena, pero la pantalla sigue negra',
    instrumento: 'lampara',
    punto: 'puerto-video',
    // Las lecturas se leen en una placa de 4 renglones de 26 caracteres: lo que
    // pase de ahí no se ve. Están medidas contra `partirEnLineas`, y hay una
    // prueba que lo comprueba para las cinco.
    lectura: 'El conector de video está medio salido: nunca hizo contacto.',
    solucion: { pieza: 'cable-video', anclaje: 'puerto-video' },
    arreglo: 'Reasentar el cable de video',
  },
  {
    id: 'pitidos',
    sintoma: 'Enciende, pita tres veces y no arranca',
    instrumento: 'lupa',
    punto: 'ranura-ram',
    lectura: 'Con la lupa se ve el módulo de RAM torcido: una palanca cerró y la otra no.',
    solucion: { pieza: 'ram', anclaje: 'ranura-ram' },
    arreglo: 'Reasentar el módulo de RAM',
  },
  {
    id: 'se-apaga',
    sintoma: 'Se apaga sola a los diez minutos de trabajar',
    instrumento: 'termometro',
    punto: 'disipador',
    lectura: '68 grados y subiendo. El disipador está tapado de polvo y el aire no pasa.',
    solucion: { pieza: 'aire', anclaje: 'disipador' },
    arreglo: 'Soplar el polvo del disipador',
  },
  {
    id: 'sin-red',
    sintoma: 'Todo funciona menos internet',
    instrumento: 'probador-red',
    punto: 'puerto-red',
    lectura: 'El probador enciende cuatro de los ocho hilos: ese cable está partido por dentro.',
    solucion: { pieza: 'cable-red', anclaje: 'puerto-red' },
    arreglo: 'Cambiar el cable de red',
  },
];

/** Los seis instrumentos de la caja. El sexto nunca es la comprobación de nada. */
export const INSTRUMENTOS: readonly { id: string; etiqueta: string; mide: string }[] = [
  { id: 'probador-corriente', etiqueta: 'Probador de corriente', mide: 'si llega corriente a una toma' },
  { id: 'lampara', etiqueta: 'Lámpara de inspección', mide: 'lo que no se ve a simple vista en un puerto' },
  { id: 'lupa', etiqueta: 'Lupa', mide: 'si una pieza está bien asentada en su ranura' },
  { id: 'termometro', etiqueta: 'Termómetro infrarrojo', mide: 'cuánto se calienta una pieza' },
  { id: 'probador-red', etiqueta: 'Probador de cable de red', mide: 'si los ocho hilos del cable llegan enteros' },
  { id: 'desarmador', etiqueta: 'Desarmador', mide: 'nada: sirve para desarmar, no para diagnosticar' },
];

const MESA_DIAG_Y = -0.55;
const MIRA_DIAG: Punto3 = [0, 0, 1];

export const BANCO_AVERIAS: BancoDef = {
  tolerancia: 0.24,
  piezas: [
    ...INSTRUMENTOS.map((h, i) => ({
      id: h.id,
      tipo: 'instrumento',
      origen: [-1.25 + i * 0.5, MESA_DIAG_Y, 1.3] as Punto3,
      etiqueta: h.etiqueta,
      gasta: true,
    })),
    { id: 'cable-corriente', tipo: 'iec', origen: [-1.1, MESA_DIAG_Y, 1.75], etiqueta: 'Cable de corriente' },
    { id: 'cable-video', tipo: 'hdmi', origen: [-0.5, MESA_DIAG_Y, 1.75], etiqueta: 'Cable de video' },
    { id: 'ram', tipo: 'ram', origen: [0.1, MESA_DIAG_Y, 1.75], etiqueta: 'Módulo de RAM' },
    { id: 'cable-red', tipo: 'rj45', origen: [0.7, MESA_DIAG_Y, 1.75], etiqueta: 'Cable de red' },
    { id: 'aire', tipo: 'aire', origen: [1.3, MESA_DIAG_Y, 1.75], etiqueta: 'Aire comprimido', gasta: true },
  ],
  anclajes: [
    {
      id: 'toma-corriente',
      punto: [-0.95, -0.3, 0.55],
      mira: MIRA_DIAG,
      acepta: ['instrumento', 'iec'],
      tolerancia: 0.22,
      etiqueta: 'Toma de corriente',
    },
    {
      id: 'puerto-video',
      punto: [-0.95, 0.2, 0.55],
      mira: MIRA_DIAG,
      acepta: ['instrumento', 'hdmi'],
      tolerancia: 0.22,
      etiqueta: 'Puerto de video',
    },
    {
      id: 'puerto-red',
      punto: [-0.95, 0.7, 0.55],
      mira: MIRA_DIAG,
      acepta: ['instrumento', 'rj45'],
      tolerancia: 0.22,
      etiqueta: 'Puerto de red',
    },
    {
      id: 'ranura-ram',
      punto: [0.3, 0.75, 0.3],
      mira: MIRA_DIAG,
      acepta: ['instrumento', 'ram'],
      tolerancia: 0.24,
      etiqueta: 'Ranura de RAM',
    },
    {
      id: 'disipador',
      punto: [0.3, 0.1, 0.3],
      mira: MIRA_DIAG,
      acepta: ['instrumento', 'aire'],
      tolerancia: 0.26,
      etiqueta: 'Disipador',
    },
  ],
};

/**
 * Cómo se juzga una comprobación. Hay **dos maneras de fallar y las dos
 * enseñan**: el instrumento que no mide eso, y el instrumento correcto en el
 * sitio donde el síntoma no puede estar.
 */
export type FalloComprobacion = 'ok' | 'instrumento' | 'sitio' | 'desarmador';

export function juzgarComprobacion(averia: Averia, instrumento: string, punto: string): FalloComprobacion {
  if (instrumento === 'desarmador') return 'desarmador';
  if (instrumento !== averia.instrumento) return 'instrumento';
  if (punto !== averia.punto) return 'sitio';
  return 'ok';
}

export const juzgarSolucion = (averia: Averia, pieza: string, anclaje: string): boolean =>
  averia.solucion.pieza === pieza && averia.solucion.anclaje === anclaje;

/**
 * El estado de partida de la ronda 2. El equipo de la mesa está **averiado a
 * propósito**: nada puesto, porque cada avería se arregla poniendo lo suyo.
 */
export const BANCO_AVERIAS_INICIAL: EstadoBanco = ESTADO_VACIO;
