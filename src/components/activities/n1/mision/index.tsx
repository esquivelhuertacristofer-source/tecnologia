'use client';

/**
 * Misión: Aprende Computación — núcleo del juego (port fiel de app.js).
 *
 * Máquina de estados del prototipo de referencia (módulos 0–6, EduOS,
 * insignias, panel docente, CSV) adaptada a React y al contrato de
 * actividad Tecnia. Cada actividad registrada entra por un módulo
 * (`moduloInicial`); el contrato reporta el progreso de ESE módulo.
 */

import { useEffect, useRef, useState } from 'react';

import { inter } from '@/app/fonts';
import type { ActivityProps } from '@/types/activity-contract';

import EduOS from './EduOS';
import { decir, detenerVoz, prepararVoz, reproducirTono, setSonidoActivo } from './audio';
import {
  MODULOS,
  SECUENCIA_CONEXIONES,
  SECUENCIA_ENCENDIDO,
  SECUENCIA_EXTERNA,
  SECUENCIA_INTERNA,
  TEXTOS,
} from './datos';
import { cargarEstado, guardarEstado } from './estado';
import { crearLaboratorio } from './laboratorio';
import type {
  AppId,
  EduOSAPI,
  EduOSEvento,
  FilaModuloDocente,
  LabAPI,
  MetricaPanel,
  MisionConfig,
  MisionEstado,
  ModoOS,
  TarjetaModulo,
} from './tipos';
import {
  BarraInferior,
  HUD,
  PanelBit,
  PantallaCarga,
  PantallaDocente,
  PantallaFinal,
  PantallaInicio,
  PantallaMenu,
  TarjetaInteraccion,
  ToastMision,
} from './ui';
import './mision.css';

// ─── Constantes y utilidades (port de app.js) ────────────────────────────────

const MENSAJE_INICIAL = '¡Hola! Hoy convertirás este laboratorio en una estación lista para aprender.';

const OBJETIVOS_FINAL = [
  'Selecciona el monitor.',
  'Selecciona el teclado.',
  'Selecciona el ratón.',
  'Conecta el cable de video.',
  'Enciende el regulador.',
  'Enciende el monitor.',
  'Enciende el gabinete.',
  'Abre Texto Fácil.',
  'Escribe una frase.',
  'Guarda el documento.',
];

function estadoNuevo(): MisionEstado {
  return {
    student: '',
    currentModule: 0,
    unlocked: 1,
    completed: [],
    stars: 0,
    errors: 0,
    hints: 0,
    startedAt: null,
    playSeconds: 0,
    badges: [],
    moduleStats: {},
    savedFiles: [],
    folders: [],
  };
}

function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function formatoTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'estudiante';
}

interface FlagsUI {
  fase: 'cargando' | 'inicio' | 'jugando';
  menuVisible: boolean;
  docenteVisible: boolean;
  finalVisible: boolean;
  osVisible: boolean;
  osInstruccion: string;
  /** Se incrementa en cada apertura de EduOS → remonta ventanas limpias. */
  osSesion: number;
  mensajeBit: string;
  tarjeta: { visible: boolean; tag: string; nombre: string; descripcion: string };
  toast: { visible: boolean; mensaje: string; tipo: string };
  sonido: boolean;
  reloj: string;
}

/** Estado mutable del juego fuera de React (como las variables de app.js). */
interface Nucleo {
  estado: MisionEstado;
  ui: FlagsUI;
  currentStep: number;
  pendingAdvance: boolean;
  cableSeleccionado: string | null;
  finalStage: number;
  osMode: ModoOS | null;
  osStep: number;
  ultimoMensaje: string;
  moduloIniciadoEn: number;
  erroresAlIniciar: number;
  completadoEmitido: boolean;
  lab: LabAPI | null;
  desmontado: boolean;
  toastTimer: ReturnType<typeof setTimeout> | null;
}

export interface PropsMision extends ActivityProps {
  /** Módulo curricular por el que entra esta actividad (0..6). */
  moduloInicial: number;
}

export default function MisionAprendeComputacion(props: PropsMision) {
  const { moduloInicial } = props;
  const config = (props.config ?? {}) as MisionConfig;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const osApi = useRef<EduOSAPI | null>(null);
  const [, setTick] = useState(0);

  const nRef = useRef<Nucleo | null>(null);
  if (!nRef.current) {
    nRef.current = {
      estado: estadoNuevo(),
      ui: {
        fase: 'cargando',
        menuVisible: false,
        docenteVisible: false,
        finalVisible: false,
        osVisible: false,
        osInstruccion: 'Haz doble clic en “Mis archivos”.',
        osSesion: 0,
        mensajeBit: MENSAJE_INICIAL,
        tarjeta: { visible: false, tag: 'DISPOSITIVO', nombre: '', descripcion: '' },
        toast: { visible: false, mensaje: '', tipo: '' },
        sonido: true,
        reloj: '12:00',
      },
      currentStep: 0,
      pendingAdvance: false,
      cableSeleccionado: null,
      finalStage: 0,
      osMode: null,
      osStep: 0,
      ultimoMensaje: MENSAJE_INICIAL,
      moduloIniciadoEn: 0,
      erroresAlIniciar: 0,
      completadoEmitido: false,
      lab: null,
      desmontado: false,
      toastTimer: null,
    };
  }
  const n = nRef.current;

  // ─── Contrato Tecnia ────────────────────────────────────────────────────────

  function progresoModulo(): number {
    const e = n.estado;
    const totales = [
      SECUENCIA_EXTERNA.length,
      SECUENCIA_INTERNA.length,
      SECUENCIA_CONEXIONES.length,
      SECUENCIA_ENCENDIDO.length,
      4,
      4,
      10,
    ];
    if (e.completed.includes(e.currentModule)) return 100;
    if (e.currentModule === 6) return Math.round((n.finalStage / 10) * 100);
    if (e.currentModule === 4 || e.currentModule === 5) return Math.round((n.osStep / 4) * 100);
    return Math.round((n.currentStep / (totales[e.currentModule] || 1)) * 100);
  }

  function reportarContrato() {
    const e = n.estado;
    if (e.completed.includes(moduloInicial)) {
      const stats = e.moduleStats[String(moduloInicial)];
      props.onProgress(1);
      props.onScore(clamp(100 - (stats?.errors ?? 0) * 10, 60, 100));
      return;
    }
    if (n.ui.fase === 'jugando' && e.currentModule === moduloInicial) {
      props.onProgress(clamp(progresoModulo() / 100, 0, 1));
      props.onScore(clamp(100 - (e.errors - n.erroresAlIniciar) * 10, 0, 100));
      return;
    }
    props.onProgress(0);
    props.onScore(0);
  }

  function refrescar(cambios?: Partial<FlagsUI>) {
    if (cambios) Object.assign(n.ui, cambios);
    reportarContrato();
    setTick(t => t + 1);
  }

  function guardar() {
    guardarEstado(n.estado);
    props.onSaveState?.(JSON.parse(JSON.stringify(n.estado)) as MisionEstado);
  }

  // ─── Voz de Bit, toasts y errores (say/showToast/incorrect) ────────────────

  function decirBit(mensaje: string, forzar = false) {
    n.ultimoMensaje = mensaje;
    n.ui.mensajeBit = mensaje;
    decir(mensaje, { forzar });
  }

  function mostrarToast(mensaje: string, tipo = '') {
    if (n.toastTimer) clearTimeout(n.toastTimer);
    n.ui.toast = { visible: true, mensaje, tipo };
    refrescar();
    n.toastTimer = setTimeout(() => {
      if (n.desmontado) return;
      n.ui.toast = { ...n.ui.toast, visible: false };
      refrescar();
    }, 2600);
  }

  function marcarError(mensaje: string) {
    n.estado.errors += 1;
    guardar();
    reproducirTono('error');
    decirBit(mensaje);
    mostrarToast(mensaje, 'error');
  }

  /** incorrectOS de la referencia: error dentro del escritorio. */
  function errorOS(mensaje: string) {
    n.estado.errors += 1;
    guardar();
    reproducirTono('error');
    decirBit(mensaje);
    mostrarToast(mensaje, 'error');
  }

  // ─── Objetivos y pistas (getObjectiveText/hint) ─────────────────────────────

  function objetivoFinal(): string {
    return OBJETIVOS_FINAL[Math.min(n.finalStage, OBJETIVOS_FINAL.length - 1)];
  }

  function objetivoTexto(): string {
    const e = n.estado;
    switch (e.currentModule) {
      case 0:
        return n.currentStep < SECUENCIA_EXTERNA.length
          ? `Selecciona: ${SECUENCIA_EXTERNA[n.currentStep].nombre}.`
          : 'Módulo completado.';
      case 1:
        return n.currentStep < SECUENCIA_INTERNA.length
          ? `Encuentra: ${SECUENCIA_INTERNA[n.currentStep].nombre}.`
          : 'Módulo completado.';
      case 2: {
        const paso = SECUENCIA_CONEXIONES[n.currentStep];
        if (!paso) return TEXTOS['objetivo-conexiones-completadas'];
        return n.cableSeleccionado
          ? TEXTOS['objetivo-conecta-cable'].replace('{nombre}', paso.nombre)
          : TEXTOS['objetivo-selecciona-cable'].replace('{nombre}', paso.nombre);
      }
      case 3:
        return SECUENCIA_ENCENDIDO[n.currentStep]?.mensaje ?? 'Encendido completado.';
      case 4:
        return [
          'Abre Mis archivos con doble clic.',
          'Minimiza la ventana.',
          'Restáurala desde la barra de tareas.',
          'Cierra la ventana.',
        ][n.osStep] ?? 'Exploración completada.';
      case 5:
        return [
          'Crea y guarda un texto.',
          'Realiza un dibujo.',
          'Resuelve 2 + 3.',
          'Crea y renombra una carpeta.',
        ][n.osStep] ?? 'Programas completados.';
      case 6:
        return objetivoFinal();
      default:
        return '';
    }
  }

  function pista() {
    const e = n.estado;
    e.hints += 1;
    guardar();
    let mensaje = objetivoTexto();
    if (e.currentModule === 0) {
      const objeto = SECUENCIA_EXTERNA[n.currentStep];
      if (objeto) mensaje = `Busca ${objeto.nombre}. Los objetos se iluminan al pasar el cursor.`;
    }
    if (e.currentModule === 1) {
      const objeto = SECUENCIA_INTERNA[n.currentStep];
      if (objeto) mensaje = `Busca ${objeto.nombre} dentro del gabinete transparente.`;
    }
    if (e.currentModule === 2) {
      const paso = SECUENCIA_CONEXIONES[n.currentStep];
      if (paso) {
        mensaje = n.cableSeleccionado
          ? TEXTOS['pista-conexion-cable-seleccionado'].replace('{nombre}', paso.nombre)
          : MODULOS[2].pista.replace('{nombre}', paso.nombre);
      }
    }
    if (e.currentModule === 3) {
      mensaje = SECUENCIA_ENCENDIDO[n.currentStep]?.mensaje ?? mensaje;
    }
    if (e.currentModule === 6) {
      mensaje = `Pista ${Math.min(e.hints, 3)}/3: ${objetivoFinal()}`;
    }
    decirBit(mensaje);
    mostrarToast(mensaje, 'success');
  }

  // ─── Ciclo de módulos (beginGame/loadModule/completeModule) ────────────────

  function comenzar(nombre: string, continuar: boolean) {
    const limpio = nombre.trim().slice(0, 24) || 'Estudiante';
    if (!continuar || !n.estado.student) {
      n.estado = { ...estadoNuevo(), student: limpio, startedAt: new Date().toISOString() };
    } else {
      n.estado.student = limpio;
    }
    // La plataforma decide qué actividad abre el alumno: entrar por una
    // actividad habilita su módulo aunque no haya completado los anteriores.
    n.estado.unlocked = Math.max(n.estado.unlocked, Math.min(MODULOS.length, moduloInicial + 1));
    guardar();
    n.ui.fase = 'jugando';
    n.completadoEmitido = n.estado.completed.includes(moduloInicial);
    cargarModulo(moduloInicial);
    refrescar();
  }

  function cargarModulo(indice: number) {
    const e = n.estado;
    const destino = clamp(indice, 0, MODULOS.length - 1);
    e.currentModule = destino;
    n.currentStep = 0;
    n.pendingAdvance = false;
    n.cableSeleccionado = null;
    n.finalStage = 0;
    n.osMode = null;
    n.osStep = 0;
    n.moduloIniciadoEn = Date.now();
    n.erroresAlIniciar = e.errors;
    guardar();
    n.lab?.clearConnections();
    n.lab?.resetObjectVisuals();
    n.lab?.setModuleEnvironment(destino);
    n.ui.tarjeta = { ...n.ui.tarjeta, visible: false };
    n.ui.osVisible = false;
    n.ui.menuVisible = false;
    n.ui.docenteVisible = false;
    n.ui.finalVisible = false;
    switch (destino) {
      case 0:
        decirBit(`Bienvenido, ${e.student}. Observa la estación y selecciona el monitor.`);
        break;
      case 1:
        decirBit('El gabinete está abierto de forma segura. Selecciona la tarjeta madre.');
        break;
      case 2:
        decirBit('Selecciona primero el cable de video. Después elige su puerto correcto.');
        break;
      case 3:
        n.lab?.preparePowerModule();
        decirBit('Antes de encender, revisamos las conexiones. Todo está listo: enciende el regulador.');
        break;
      case 4:
        abrirOS('navigation');
        break;
      case 5:
        abrirOS('apps');
        break;
      case 6:
        decirBit('Misión final: identifica el monitor, el teclado y el ratón. Tendrás tres pistas disponibles.');
        break;
    }
    refrescar();
  }

  function completarModulo(indice: number) {
    const e = n.estado;
    const transcurrido = Math.max(1, Math.round((Date.now() - n.moduloIniciadoEn) / 1000));
    const erroresModulo = Math.max(0, e.errors - n.erroresAlIniciar);
    e.moduleStats[String(indice)] = {
      seconds: transcurrido,
      errors: erroresModulo,
      completedAt: new Date().toISOString(),
    };
    if (!e.completed.includes(indice)) {
      e.completed.push(indice);
      e.stars += indice === 6 ? 5 : 3;
      const insignia = MODULOS[indice].insignia;
      if (!e.badges.includes(insignia)) e.badges.push(insignia);
    }
    e.unlocked = Math.max(e.unlocked, Math.min(MODULOS.length, indice + 2));
    guardar();
    reproducirTono('complete');
    if (indice === moduloInicial && !n.completadoEmitido) {
      n.completadoEmitido = true;
      const score = clamp(100 - erroresModulo * 10, 60, 100);
      props.onComplete({
        score,
        stars: 3,
        xp: score,
        errores: erroresModulo,
        tiempoSegundos: transcurrido,
      });
    }
    if (indice === 6) {
      n.ui.osVisible = false;
      n.ui.finalVisible = true;
      refrescar();
      return;
    }
    decirBit(TEXTOS['modulo-completado-voz'].replace('{nombre}', MODULOS[indice].insignia));
    mostrarToast(TEXTOS['toast-modulo-completado'].replace('{nombre}', MODULOS[indice].insignia), 'success');
    refrescar();
    setTimeout(() => {
      if (n.desmontado) return;
      n.ui.menuVisible = true;
      refrescar();
    }, 900);
  }

  // ─── Interacción 3D (handleObjectClick y familia) ───────────────────────────

  function nombreExterno(key: string): string {
    return SECUENCIA_EXTERNA.find(objeto => objeto.key === key)?.nombre ?? key;
  }

  function quitarResalte(key: string) {
    if (!n.lab) return;
    if (n.lab.clearPersistentHighlight) n.lab.clearPersistentHighlight(key);
    else n.lab.resetObjectVisuals();
  }

  function encenderBoton(key: string) {
    if (!n.lab) return;
    if (n.lab.setPowerButtonOn) n.lab.setPowerButtonOn(key);
    else n.lab.setPersistentHighlight(key);
  }

  function manejarClick3D(key: string, categoria: string) {
    if (n.ui.fase !== 'jugando' || n.ui.osVisible || n.ui.menuVisible || n.ui.docenteVisible || n.ui.finalVisible) {
      return;
    }
    const modulo = n.estado.currentModule;
    if (modulo === 0 || modulo === 1) {
      manejarSecuencia(key, categoria, modulo === 0 ? SECUENCIA_EXTERNA : SECUENCIA_INTERNA);
      return;
    }
    if (modulo === 2) manejarConexion(key, categoria);
    if (modulo === 3) manejarEncendido(key);
    if (modulo === 6) manejarFinal(key, categoria);
  }

  function manejarSecuencia(
    key: string,
    categoria: string,
    secuencia: typeof SECUENCIA_EXTERNA,
  ) {
    void categoria;
    if (n.pendingAdvance) return;
    const esperado = secuencia[n.currentStep];
    if (!esperado) return;
    if (key !== esperado.key) {
      marcarError(TEXTOS['error-secuencia'].replace('{nombre}', esperado.nombre));
      return;
    }
    reproducirTono('correct');
    n.lab?.focusObject(key);
    n.ui.tarjeta = {
      visible: true,
      tag: n.estado.currentModule === 0 ? TEXTOS['tag-dispositivo'] : TEXTOS['tag-componente-interno'],
      nombre: esperado.nombre,
      descripcion: esperado.descripcion,
    };
    n.pendingAdvance = true;
    decirBit(`¡Correcto! ${esperado.descripcion}`);
    refrescar();
  }

  function avanzarTrasInfo() {
    n.ui.tarjeta = { ...n.ui.tarjeta, visible: false };
    if (!n.pendingAdvance) {
      refrescar();
      return;
    }
    n.pendingAdvance = false;
    n.currentStep += 1;
    const secuencia = n.estado.currentModule === 0 ? SECUENCIA_EXTERNA : SECUENCIA_INTERNA;
    if (n.currentStep >= secuencia.length) {
      completarModulo(n.estado.currentModule);
      return;
    }
    n.lab?.resetCamera();
    decirBit(`Muy bien. Ahora selecciona ${secuencia[n.currentStep].nombre}.`);
    refrescar();
  }

  function manejarConexion(key: string, categoria: string) {
    const esperado = SECUENCIA_CONEXIONES[n.currentStep];
    if (!esperado) return;
    if (!n.cableSeleccionado) {
      if (categoria !== 'cable') {
        marcarError(TEXTOS['error-conexion-no-cable']);
        return;
      }
      if (key !== esperado.cable) {
        marcarError(TEXTOS['error-conexion-cable-equivocado'].replace('{nombre}', esperado.nombre));
        return;
      }
      n.cableSeleccionado = key;
      n.lab?.setPersistentHighlight(key);
      reproducirTono('select');
      decirBit(TEXTOS['conexion-cable-seleccionado'].replace('{nombre}', TEXTOS[`dispositivo-${esperado.cable}`]));
      refrescar();
      return;
    }
    if (categoria !== 'port') {
      marcarError(TEXTOS['error-conexion-no-puerto']);
      return;
    }
    if (key !== esperado.puerto) {
      marcarError(TEXTOS['error-conexion-puerto-equivocado']);
      return;
    }
    n.lab?.drawConnection(n.cableSeleccionado, key, esperado.color);
    quitarResalte(n.cableSeleccionado);
    n.cableSeleccionado = null;
    reproducirTono('connect');
    mostrarToast(TEXTOS['toast-conexion-correcta'], 'success');
    n.currentStep += 1;
    if (n.currentStep >= SECUENCIA_CONEXIONES.length) {
      refrescar();
      completarModulo(2);
      return;
    }
    decirBit(TEXTOS['conexion-siguiente'].replace('{nombre}', SECUENCIA_CONEXIONES[n.currentStep].nombre));
    refrescar();
  }

  function manejarEncendido(key: string) {
    const esperado = SECUENCIA_ENCENDIDO[n.currentStep];
    if (!esperado) return;
    if (key !== esperado.key) {
      marcarError(`Todavía no. ${esperado.mensaje}`);
      return;
    }
    reproducirTono('power');
    if (key === 'power-regulator') n.lab?.setRegulatorOn();
    if (key === 'power-monitor') n.lab?.setMonitorOn();
    if (key === 'power-tower') {
      decirBit('Perfecto. Presionaste una sola vez. El sistema está iniciando…');
      n.lab?.playBootAnimation(() => undefined);
    }
    n.currentStep += 1;
    if (n.currentStep >= SECUENCIA_ENCENDIDO.length) {
      refrescar();
      setTimeout(() => {
        if (!n.desmontado) completarModulo(3);
      }, 1800);
      return;
    }
    decirBit(SECUENCIA_ENCENDIDO[n.currentStep].mensaje);
    refrescar();
  }

  function manejarFinal(key: string, categoria: string) {
    void categoria;
    const identificacion = ['monitor', 'keyboard', 'mouse'];
    if (n.finalStage < 3) {
      const esperado = identificacion[n.finalStage];
      if (key !== esperado) {
        marcarError(`Busca ${nombreExterno(esperado)}.`);
        return;
      }
      reproducirTono('correct');
      n.finalStage += 1;
      mostrarToast('Identificación correcta', 'success');
      if (n.finalStage === 3) {
        decirBit('Ahora conecta el cable de video al puerto azul.');
      } else {
        decirBit(`Correcto. Ahora selecciona ${nombreExterno(identificacion[n.finalStage])}.`);
      }
      refrescar();
      return;
    }
    if (n.finalStage === 3) {
      if (!n.cableSeleccionado) {
        if (key !== 'cable-video') {
          marcarError('Selecciona el cable de video.');
          return;
        }
        n.cableSeleccionado = key;
        n.lab?.setPersistentHighlight(key);
        reproducirTono('select');
        decirBit('Ahora selecciona el puerto de video.');
        refrescar();
        return;
      }
      if (key !== 'port-video') {
        marcarError('Ese no es el puerto de video.');
        return;
      }
      n.lab?.drawConnection(n.cableSeleccionado, 'port-video', 0x56b8ff);
      quitarResalte(n.cableSeleccionado);
      n.cableSeleccionado = null;
      reproducirTono('connect');
      n.finalStage = 4;
      decirBit('Enciende el regulador.');
      refrescar();
      return;
    }
    if (n.finalStage >= 4 && n.finalStage <= 6) {
      const indice = n.finalStage - 4;
      const esperado = SECUENCIA_ENCENDIDO[indice];
      if (key !== esperado.key) {
        marcarError(esperado.mensaje);
        return;
      }
      encenderBoton(esperado.key);
      reproducirTono('power');
      n.finalStage += 1;
      if (n.finalStage === 7) {
        decirBit('El equipo está listo. Entra a EduOS y guarda una frase en Texto Fácil.');
        setTimeout(() => {
          if (!n.desmontado) abrirOS('final');
        }, 700);
      } else {
        decirBit(SECUENCIA_ENCENDIDO[indice + 1].mensaje);
      }
      refrescar();
    }
  }

  // ─── EduOS (openOS/openApp/handle*) ────────────────────────────────────────

  function abrirOS(modo: ModoOS) {
    n.osMode = modo;
    n.osStep = 0;
    n.ui.osVisible = true;
    n.ui.osSesion += 1;
    if (modo === 'navigation') {
      n.ui.osInstruccion = 'Haz doble clic en “Mis archivos”.';
      decirBit('Bienvenido a EduOS. Haz doble clic en Mis archivos.');
    }
    if (modo === 'apps') {
      n.ui.osInstruccion = 'Abre Texto Fácil y guarda una oración.';
      decirBit('Comenzaremos con Texto Fácil. Abre el programa, escribe una oración y guárdala.');
    }
    if (modo === 'final') {
      n.ui.osInstruccion = 'Abre Texto Fácil.';
    }
    refrescar();
  }

  function salirOS() {
    n.ui.osVisible = false;
    const modulo = n.estado.currentModule;
    if (modulo === 4 || modulo === 5) {
      decirBit('Puedes volver al escritorio desde el módulo cuando quieras.');
    }
    refrescar();
  }

  /** openApp de la referencia: valida la app correcta según modo/paso. */
  function permitirAbrir(app: AppId): boolean {
    if (app === 'trash') {
      mostrarToast(TEXTOS['os-papelera-vacia'], 'success');
      return false;
    }
    if (n.osMode === 'navigation') {
      if (n.osStep === 0 && app !== 'files') {
        errorOS(TEXTOS['os-error-abre-archivos']);
        return false;
      }
      return true;
    }
    if (n.osMode === 'apps') {
      const esperada: AppId[] = ['text', 'paint', 'calc', 'files'];
      const objetivo = esperada[Math.min(n.osStep, esperada.length - 1)];
      if (app !== objetivo) {
        const errores: Record<AppId, string> = {
          text: TEXTOS['os-error-abre-texto'],
          paint: TEXTOS['os-error-abre-paint'],
          calc: TEXTOS['os-error-abre-calc'],
          files: TEXTOS['os-error-abre-archivos-final'],
          trash: TEXTOS['os-papelera-vacia'],
        };
        errorOS(errores[objetivo]);
        return false;
      }
      return true;
    }
    if (n.osMode === 'final') {
      if (n.finalStage === 7 && app !== 'text') {
        errorOS(TEXTOS['os-error-abre-texto-final']);
        return false;
      }
      return true;
    }
    return true;
  }

  function manejarEventoOS(evento: EduOSEvento) {
    switch (evento.tipo) {
      case 'abrir-app': {
        reproducirTono('open');
        if (n.osMode === 'navigation' && n.osStep === 0 && evento.app === 'files') {
          n.osStep = 1;
          n.ui.osInstruccion = TEXTOS['os-nav-instruccion-1'];
          decirBit(TEXTOS['os-nav-voz-1']);
        }
        if (n.osMode === 'final' && n.finalStage === 7 && evento.app === 'text') {
          n.finalStage = 8;
          n.ui.osInstruccion = TEXTOS['os-final-instruccion-1'];
        }
        refrescar();
        return;
      }
      case 'minimizar': {
        reproducirTono('minimize');
        if (n.osMode === 'navigation' && n.osStep === 1 && evento.app === 'files') {
          n.osStep = 2;
          n.ui.osInstruccion = TEXTOS['os-nav-instruccion-2'];
          decirBit(TEXTOS['os-nav-voz-2']);
        }
        refrescar();
        return;
      }
      case 'restaurar': {
        reproducirTono('open');
        if (n.osMode === 'navigation' && n.osStep === 2 && evento.app === 'files') {
          n.osStep = 3;
          n.ui.osInstruccion = TEXTOS['os-nav-instruccion-3'];
          decirBit(TEXTOS['os-nav-voz-3']);
        }
        refrescar();
        return;
      }
      case 'maximizar': {
        reproducirTono('open');
        refrescar();
        return;
      }
      case 'cerrar-app': {
        reproducirTono('close');
        if (n.osMode === 'navigation' && n.osStep === 3 && evento.app === 'files') {
          n.osStep = 4;
          refrescar();
          completarModulo(4);
          return;
        }
        refrescar();
        return;
      }
      case 'texto-cambia': {
        if (n.osMode === 'final' && n.finalStage === 8 && evento.contenido.trim().length >= 12) {
          n.finalStage = 9;
          n.ui.osInstruccion = TEXTOS['os-final-instruccion-2'];
          refrescar();
        }
        return;
      }
      case 'guardar-texto': {
        const contenido = evento.contenido.trim();
        if (contenido.length < 8) {
          errorOS(TEXTOS['os-error-texto-corto']);
          return;
        }
        reproducirTono('save');
        n.estado.savedFiles.push({
          nombre: TEXTOS['archivo-documento'].replace('{n}', String(n.estado.savedFiles.filter(a => a.tipo === 'texto').length + 1)),
          tipo: 'texto',
        });
        guardar();
        mostrarToast(TEXTOS['toast-documento-guardado'], 'success');
        if (n.osMode === 'apps' && n.osStep === 0) {
          n.osStep = 1;
          n.ui.osInstruccion = TEXTOS['os-apps-instruccion-1'];
          decirBit(TEXTOS['os-apps-voz-1']);
          osApi.current?.cerrarVentana('text');
        }
        if (n.osMode === 'final' && n.finalStage >= 8 && contenido.length >= 12) {
          n.finalStage = 10;
          refrescar();
          setTimeout(() => {
            if (n.desmontado) return;
            n.ui.osVisible = false;
            completarModulo(6);
          }, 700);
          return;
        }
        refrescar();
        return;
      }
      case 'guardar-dibujo': {
        if (evento.trazos < 5) {
          errorOS(TEXTOS['os-error-dibujo-vacio']);
          return;
        }
        reproducirTono('save');
        mostrarToast(TEXTOS['toast-dibujo-guardado'], 'success');
        if (n.osMode === 'apps' && n.osStep === 1) {
          n.osStep = 2;
          n.ui.osInstruccion = TEXTOS['os-apps-instruccion-2'];
          decirBit(TEXTOS['os-apps-voz-2']);
          osApi.current?.cerrarVentana('paint');
        }
        refrescar();
        return;
      }
      case 'calculo': {
        if (
          n.osMode === 'apps' &&
          n.osStep === 2 &&
          evento.resultado === 5 &&
          /2\s*\+\s*3/.test(evento.expresion)
        ) {
          reproducirTono('save');
          mostrarToast(TEXTOS['toast-calculo-correcto'], 'success');
          n.osStep = 3;
          n.ui.osInstruccion = TEXTOS['os-apps-instruccion-3'];
          decirBit(TEXTOS['os-apps-voz-3']);
          setTimeout(() => osApi.current?.cerrarVentana('calc'), 500);
          refrescar();
        }
        return;
      }
      case 'crear-carpeta': {
        n.estado.folders.push(evento.nombre.slice(0, 24));
        guardar();
        mostrarToast('Carpeta creada. Haz doble clic para renombrarla.', 'success');
        refrescar();
        return;
      }
      case 'renombrar-carpeta': {
        const indice = n.estado.folders.indexOf(evento.de);
        if (indice >= 0) n.estado.folders[indice] = evento.a.slice(0, 24);
        guardar();
        reproducirTono('save');
        if (n.osMode === 'apps' && n.osStep === 3) {
          n.osStep = 4;
          refrescar();
          completarModulo(5);
          return;
        }
        refrescar();
        return;
      }
    }
  }

  // ─── Menú, docente, reinicio, sonido ────────────────────────────────────────

  function alternarSonido() {
    n.ui.sonido = !n.ui.sonido;
    setSonidoActivo(n.ui.sonido);
    if (!n.ui.sonido) detenerVoz();
    mostrarToast(n.ui.sonido ? TEXTOS['toast-sonido-activado'] : TEXTOS['toast-sonido-desactivado'], 'success');
  }

  function reiniciarProgreso() {
    if (typeof window === 'undefined') return;
    if (!window.confirm(TEXTOS['confirmar-reinicio'])) return;
    const nombre = n.estado.student;
    n.estado = { ...estadoNuevo(), student: nombre, startedAt: new Date().toISOString() };
    n.completadoEmitido = false;
    guardar();
    n.ui.menuVisible = false;
    cargarModulo(0);
  }

  function salirAlHub() {
    guardar();
    detenerVoz();
    if (typeof window !== 'undefined') window.location.href = '/hub/nivel/1';
  }

  function exportarCSV() {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return;
    const e = n.estado;
    const filas: string[][] = [TEXTOS['csv-encabezado'].split(',')];
    MODULOS.forEach((modulo, i) => {
      const stats = e.moduleStats[String(i)];
      const completado = e.completed.includes(i);
      filas.push([
        e.student || TEXTOS['docente-sin-nombre'],
        modulo.titulo,
        completado ? TEXTOS['estado-completado'] : TEXTOS['estado-pendiente'],
        String(stats?.seconds ?? 0),
        String(stats?.errors ?? 0),
        completado ? modulo.insignia : '',
      ]);
    });
    const csv = filas
      .map(fila => fila.map(celda => `"${String(celda).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = TEXTOS['csv-nombre-archivo'].replace('{nombre}', slug(e.student));
    enlace.click();
    URL.revokeObjectURL(url);
  }

  // ─── Montaje: hidratación, laboratorio 3D, reloj ────────────────────────────

  const clickRef = useRef<(key: string, categoria: string) => void>(() => undefined);
  useEffect(() => {
    clickRef.current = manejarClick3D;
  });

  useEffect(() => {
    n.desmontado = false;
    const guardado = cargarEstado();
    if (guardado) {
      n.estado = { ...estadoNuevo(), ...guardado };
    } else if (props.savedState && typeof props.savedState === 'object') {
      const externo = props.savedState as Partial<MisionEstado>;
      if (typeof externo.student === 'string') {
        n.estado = { ...estadoNuevo(), ...externo };
      }
    }
    setSonidoActivo(true);
    // El catálogo de voces del navegador llega asíncrono: pedirlo ya para
    // que la primera línea de Bit salga con la voz buena, no con la SAPI.
    prepararVoz();
    refrescar();

    let vivo = true;
    const canvas = canvasRef.current;
    if (canvas) {
      crearLaboratorio(canvas, {
        onObjectClick: (key, categoria) => clickRef.current(key, categoria),
      })
        .then(api => {
          if (!vivo) {
            api?.dispose();
            return;
          }
          n.lab = api;
          api?.setModuleEnvironment(0);
        })
        .catch(() => {
          // Sin WebGL (jsdom/tests): el juego sigue con UI DOM únicamente.
        });
    }
    const timerCarga = setTimeout(() => {
      if (!vivo) return;
      if (n.ui.fase === 'cargando') refrescar({ fase: 'inicio' });
    }, 900);
    const reloj = setInterval(() => {
      if (!vivo) return;
      n.ui.reloj = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      if (n.ui.fase === 'jugando') {
        n.estado.playSeconds = (n.estado.playSeconds || 0) + 1;
        if (n.estado.playSeconds % 10 === 0) guardar();
      }
      if (n.ui.osVisible) refrescar();
    }, 1000);
    return () => {
      vivo = false;
      n.desmontado = true;
      clearTimeout(timerCarga);
      clearInterval(reloj);
      if (n.toastTimer) clearTimeout(n.toastTimer);
      n.lab?.dispose();
      n.lab = null;
      detenerVoz();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render (DOM de index.html en orden) ────────────────────────────────────

  const e = n.estado;
  const ui = n.ui;
  const moduloActual = MODULOS[e.currentModule] ?? MODULOS[0];

  const tarjetasModulo: TarjetaModulo[] = MODULOS.map((modulo, i) => ({
    indice: i,
    icono: modulo.icono,
    titulo: modulo.titulo,
    resumen: modulo.resumen,
    bloqueado: i >= e.unlocked,
    completado: e.completed.includes(i),
    actual: i === e.currentModule,
  }));

  const progresoTotal = Math.round((e.completed.length / MODULOS.length) * 100);
  const metricasDocente: MetricaPanel[] = [
    { etiqueta: TEXTOS['stat-estudiante'], valor: e.student || TEXTOS['docente-sin-nombre'] },
    { etiqueta: TEXTOS['stat-progreso'], valor: `${progresoTotal}%` },
    { etiqueta: TEXTOS['stat-estrellas'], valor: String(e.stars) },
    { etiqueta: TEXTOS['stat-tiempo'], valor: formatoTiempo(e.playSeconds) },
  ];
  const filasDocente: FilaModuloDocente[] = MODULOS.map((modulo, i) => {
    const stats = e.moduleStats[String(i)];
    const completado = e.completed.includes(i);
    return {
      titulo: `${modulo.icono} ${modulo.titulo}`,
      estado: completado ? '100%' : '0%',
      detalle: stats ? TEXTOS['docente-completado-en'].replace('{tiempo}', formatoTiempo(stats.seconds)) : TEXTOS['estado-pendiente'],
    };
  });

  const statsFinal: MetricaPanel[] = [
    { etiqueta: TEXTOS['stat-estrellas'], valor: String(e.stars) },
    { etiqueta: TEXTOS['stat-modulos'], valor: `${e.completed.length}/${MODULOS.length}` },
    { etiqueta: TEXTOS['stat-errores'], valor: String(e.errors) },
    { etiqueta: TEXTOS['stat-tiempo'], valor: formatoTiempo(e.playSeconds) },
  ];

  return (
    <div className={`mision-n1 ${inter.variable}`}>
      <PantallaCarga visible={ui.fase === 'cargando'} />
      <canvas ref={canvasRef} className="scene" aria-label="Laboratorio 3D" />
      <div className="app">
        <HUD
          icono={moduloActual.icono}
          eyebrow={e.currentModule === 6 ? TEXTOS['hud-evaluacion-final'] : TEXTOS['modulo-numero'].replace('{n}', String(e.currentModule + 1))}
          titulo={moduloActual.titulo}
          objetivo={objetivoTexto()}
          progresoPct={progresoModulo()}
          estrellas={e.stars}
          sonidoActivo={ui.sonido}
          onMenu={() => refrescar({ menuVisible: true })}
          onToggleSonido={alternarSonido}
        />
        <PanelBit mensaje={ui.mensajeBit} onRepetir={() => decir(n.ultimoMensaje, { forzar: true })} />
        <TarjetaInteraccion
          visible={ui.tarjeta.visible}
          tag={ui.tarjeta.tag}
          nombre={ui.tarjeta.nombre}
          descripcion={ui.tarjeta.descripcion}
          textoBoton="Continuar"
          onContinuar={avanzarTrasInfo}
        />
        <BarraInferior
          onPista={pista}
          onModulos={() => refrescar({ menuVisible: true })}
          onCentrar={() => n.lab?.resetCamera()}
          onDocente={() => refrescar({ docenteVisible: true })}
        />
        <ToastMision mensaje={ui.toast.mensaje} visible={ui.toast.visible} tipo={ui.toast.tipo} />
      </div>
      <PantallaInicio
        visible={ui.fase === 'inicio'}
        nombreInicial={e.student || config.nombreAlumno || ''}
        puedeContinuar={Boolean(e.student)}
        onComenzar={nombre => comenzar(nombre, false)}
        onContinuar={() => comenzar(e.student, true)}
      />
      <PantallaMenu
        visible={ui.menuVisible}
        modulos={tarjetasModulo}
        onSeleccionar={indice => cargarModulo(indice)}
        onReiniciar={reiniciarProgreso}
        onCerrar={() => refrescar({ menuVisible: false })}
        onSalirHub={salirAlHub}
      />
      <PantallaDocente
        visible={ui.docenteVisible}
        metricas={metricasDocente}
        filas={filasDocente}
        onExportarCSV={exportarCSV}
        onCerrar={() => refrescar({ docenteVisible: false })}
      />
      <EduOS
        key={ui.osSesion}
        visible={ui.osVisible}
        instruccion={ui.osInstruccion}
        reloj={ui.reloj}
        archivos={e.savedFiles}
        carpetas={e.folders}
        onEvento={manejarEventoOS}
        onSalir={salirOS}
        permitirAbrir={permitirAbrir}
        apiRef={osApi}
      />
      <PantallaFinal
        visible={ui.finalVisible}
        stats={statsFinal}
        insignias={e.badges.map(nombre => ({ nombre }))}
        mensaje={TEXTOS['final-copy'].replace('{nombre}', e.student)}
        onVolver={() => {
          n.ui.finalVisible = false;
          cargarModulo(0);
        }}
      />
    </div>
  );
}
