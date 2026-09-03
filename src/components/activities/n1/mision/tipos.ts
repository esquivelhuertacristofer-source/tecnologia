/**
 * Misión: Aprende Computación — contratos internos del port (N1 completo).
 *
 * Port fiel del prototipo de referencia del cliente ("Misión: Aprende
 * Computación", Three.js + DOM) adaptado a React/TypeScript y al contrato
 * de actividad Tecnia. Este archivo define las interfaces entre las piezas
 * del juego; cada pieza replica el comportamiento y el look del original.
 *
 * Piezas:
 *  - laboratorio.ts  — escena 3D imperativa (Three.js) del laboratorio.
 *  - EduOS.tsx       — simulador de escritorio (ventanas, apps, taskbar).
 *  - ui.tsx          — HUD, panel de Bit, tarjetas, pantallas y modales.
 *  - datos.ts        — módulos, secuencias, pistas y textos (verbatim).
 *  - estado.ts       — estado persistente + localStorage.
 *  - audio.ts        — tonos WebAudio + narración speechSynthesis es-MX.
 *  - index.tsx       — núcleo del juego (máquina de estados, contrato Tecnia).
 */

// ─── Laboratorio 3D ───────────────────────────────────────────────────────────

/** Categorías de objeto interactivo, tal como en la referencia. */
export type CategoriaObjeto = 'external' | 'internal' | 'cable' | 'port' | 'power' | 'ambient';

export interface LabCallbacks {
  /** Clic sobre un objeto interactivo (key + categoría de la referencia). */
  onObjectClick: (key: string, categoria: string) => void;
}

/**
 * API imperativa que expone la escena. `crearLaboratorio(canvas, callbacks)`
 * en laboratorio.ts la construye de forma asíncrona; devuelve null si WebGL
 * no está disponible (p. ej. jsdom en tests).
 */
export interface LabAPI {
  /** Vista general del laboratorio (posición inicial de cámara). */
  focusMain(): void;
  /** Acercamiento al gabinete abierto (módulo "Dentro del gabinete"). */
  focusInternals(): void;
  /** Vista de cables y puertos (módulo "Conecta el equipo"). */
  focusConnections(): void;
  /** Acercamiento suave a un objeto por su key. */
  focusObject(key: string): void;
  /** Botón ⌂ Centrar vista. */
  resetCamera(): void;
  /**
   * Visibilidad de grupos + foco según módulo (0..6), igual que loadModule
   * de la referencia: equipo externo oculto solo en módulo 1; internos solo
   * en módulo 1; cables/puertos en módulos 2 y 6.
   */
  setModuleEnvironment(modulo: number): void;
  /** Resalte persistente cian (objeto identificado/conectado). */
  setPersistentHighlight(key: string): void;
  /** Limpia resaltes y emisivos a su estado original. */
  resetObjectVisuals(): void;
  /** Apaga el resalte persistente de un solo objeto (cable ya conectado). */
  clearPersistentHighlight?(key: string): void;
  /** Enciende el emisivo de un botón de encendido (misión final). */
  setPowerButtonOn?(key: string): void;
  /** Dibuja el tubo curvo de conexión cable→puerto con el color dado. */
  drawConnection(cableKey: string, portKey: string, color: number): void;
  /** Elimina todas las líneas de conexión dibujadas. */
  clearConnections(): void;
  /** Atenúa pantalla/emisivos para el módulo de encendido. */
  preparePowerModule(): void;
  /** Paso 1 del encendido: regulador activo. */
  setRegulatorOn(): void;
  /** Paso 2: pantalla del monitor encendida. */
  setMonitorOn(): void;
  /** Paso 3: parpadeos de arranque del gabinete; onDone al terminar. */
  playBootAnimation(onDone: () => void): void;
  /** Libera renderer, geometrías y listeners. */
  dispose(): void;
}

// ─── EduOS (simulador de escritorio) ─────────────────────────────────────────

export type ModoOS = 'navigation' | 'apps' | 'final';

export type AppId = 'files' | 'text' | 'paint' | 'calc' | 'trash';

export interface ArchivoGuardado {
  nombre: string;
  tipo: 'texto' | 'dibujo';
}

/** Eventos que EduOS reporta al núcleo; el núcleo valida y avanza pasos. */
export type EduOSEvento =
  | { tipo: 'abrir-app'; app: AppId }
  | { tipo: 'cerrar-app'; app: AppId }
  | { tipo: 'minimizar'; app: AppId }
  | { tipo: 'restaurar'; app: AppId }
  | { tipo: 'maximizar'; app: AppId }
  | { tipo: 'guardar-texto'; contenido: string }
  | { tipo: 'texto-cambia'; contenido: string }
  | { tipo: 'guardar-dibujo'; trazos: number }
  | { tipo: 'calculo'; expresion: string; resultado: number | null }
  | { tipo: 'crear-carpeta'; nombre: string }
  | { tipo: 'renombrar-carpeta'; de: string; a: string };

/** API imperativa que EduOS expone al núcleo (cierres programáticos). */
export interface EduOSAPI {
  cerrarVentana(app: AppId): void;
}

export interface EduOSProps {
  visible: boolean;
  /** Texto de #osInstruction en la topbar. */
  instruccion: string;
  /** Hora del reloj de la bandeja (el núcleo la actualiza cada segundo). */
  reloj: string;
  archivos: ArchivoGuardado[];
  carpetas: string[];
  onEvento: (evento: EduOSEvento) => void;
  /** Botón "Salir del escritorio". */
  onSalir: () => void;
  /**
   * Guardia de la misión (openApp de la referencia): si devuelve false, la
   * app NO se abre; el núcleo ya mostró el error correspondiente.
   */
  permitirAbrir?: (app: AppId) => boolean;
  /** El núcleo cierra ventanas al completar pasos (closeWindow de la ref.). */
  apiRef?: { current: EduOSAPI | null };
}

// ─── UI (pantallas y overlays) ────────────────────────────────────────────────

export interface PropsPantallaCarga {
  visible: boolean;
}

export interface PropsPantallaInicio {
  visible: boolean;
  /** Nombre precargado (perfil de la plataforma). */
  nombreInicial: string;
  /** Muestra "Continuar progreso" si hay partida guardada. */
  puedeContinuar: boolean;
  onComenzar: (nombre: string) => void;
  onContinuar: () => void;
}

export interface PropsHUD {
  icono: string;
  eyebrow: string;
  titulo: string;
  objetivo: string;
  /** 0–100 */
  progresoPct: number;
  estrellas: number;
  sonidoActivo: boolean;
  onMenu: () => void;
  onToggleSonido: () => void;
}

export interface PropsPanelBit {
  mensaje: string;
  onRepetir: () => void;
}

export interface PropsTarjetaInteraccion {
  visible: boolean;
  tag: string;
  nombre: string;
  descripcion: string;
  textoBoton: string;
  onContinuar: () => void;
}

export interface PropsBarraInferior {
  onPista: () => void;
  onModulos: () => void;
  onCentrar: () => void;
  onDocente: () => void;
}

export interface PropsToast {
  mensaje: string;
  visible: boolean;
  /** '' | 'success' | 'error' — clase del toast de la referencia. */
  tipo?: string;
}

export interface TarjetaModulo {
  indice: number;
  icono: string;
  titulo: string;
  resumen: string;
  bloqueado: boolean;
  completado: boolean;
  actual: boolean;
}

export interface PropsPantallaMenu {
  visible: boolean;
  modulos: TarjetaModulo[];
  onSeleccionar: (indice: number) => void;
  onReiniciar: () => void;
  onCerrar: () => void;
  /** Adaptación plataforma: volver al hub del Nivel 1. */
  onSalirHub: () => void;
}

export interface MetricaPanel {
  etiqueta: string;
  valor: string;
}

export interface FilaModuloDocente {
  titulo: string;
  estado: string;
  detalle: string;
}

export interface PropsPantallaDocente {
  visible: boolean;
  metricas: MetricaPanel[];
  filas: FilaModuloDocente[];
  onExportarCSV: () => void;
  onCerrar: () => void;
}

export interface InsigniaObtenida {
  nombre: string;
}

export interface PropsPantallaFinal {
  visible: boolean;
  stats: MetricaPanel[];
  insignias: InsigniaObtenida[];
  /** #completionCopy: mensaje personalizado con el nombre del estudiante. */
  mensaje?: string;
  onVolver: () => void;
}

// ─── Estado persistente ───────────────────────────────────────────────────────

export interface StatsModulo {
  seconds: number;
  errors: number;
  completedAt: string;
}

/** Estado completo de la misión (port 1:1 del defaultState de la referencia). */
export interface MisionEstado {
  student: string;
  currentModule: number;
  unlocked: number;
  completed: number[];
  stars: number;
  errors: number;
  hints: number;
  startedAt: string | null;
  playSeconds: number;
  badges: string[];
  moduleStats: Record<string, StatsModulo>;
  savedFiles: ArchivoGuardado[];
  folders: string[];
}

// ─── Config de la actividad (contrato Tecnia) ────────────────────────────────

export interface MisionConfig {
  /** Nombre del alumno inyectado por el host de actividad. */
  nombreAlumno?: string;
  /** Módulo curricular por el que se entra (0..6). */
  moduloInicial?: number;
}
