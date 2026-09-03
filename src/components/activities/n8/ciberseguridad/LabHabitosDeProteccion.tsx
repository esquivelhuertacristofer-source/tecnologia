'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  enlaceEnganoso,
  mismoDominio,
  useCorreo,
  VentanaCorreo,
  type MensajeCorreo,
  type RemitenteCorreo,
} from '../../../simuladores/correo';
import {
  estadoSeguridad,
  useNavegador,
  VentanaNavegador,
  type MapaSitios,
} from '../../../simuladores/navegador';

/**
 * N8 · «Redes y ciberseguridad» — «Hábitos de protección» (currículo §56.4).
 * CIERRE de la unidad: mismo papel que `n7-retos-python`/`n8-proyectos-consola`
 * tienen al final de las suyas — no enseña un programa nuevo, COMBINA los tres
 * que ya dejaron las hermanas de esta unidad:
 *
 *   `n8-ip-wifi-servidores`            → panel ultra-lite propio (Tecnia Red)
 *   `n8-malware-e-ingenieria-social`   → `simuladores/correo`
 *   `n8-cifrado-basico`                → `simuladores/navegador`
 *
 * Los tres actos nuevos (contraseñas, actualizaciones, verificación en dos
 * pasos) van en un panel propio, «Tecnia Escudo» — no hay ningún simulador
 * compartido de «ajustes de seguridad» en `simuladores/`, y construir uno para
 * un solo uso sería la misma abstracción prematura que ya evitó
 * `LabIpWifiServidores` con «Tecnia Red». El acto final SÍ cruza a
 * `simuladores/correo` y `simuladores/navegador`, con contenido nuevo —ningún
 * correo ni sitio repetido de las hermanas—, aplicando el criterio que el
 * alumno ya construyó, no repitiendo su encargo.
 *
 * ── Por qué el medidor de contraseñas nunca compara contra un texto fijo ────
 *
 * `evaluarFuerza()` es una función pura sobre CUALQUIER cadena que el alumno
 * escriba: longitud, mayúsculas, minúsculas, números, símbolo, y dos fallas
 * instantáneas (estar en la lista de contraseñas más usadas, o contener un
 * dato personal de Mateo). No hay una contraseña «correcta» memorizada en
 * ningún sitio — el veredicto se calcula en vivo, como haría un medidor de
 * verdad. Es la regla anti-épsilon de §46 aplicada a texto: cualquier
 * contraseña que el alumno invente, incluidas las que nadie escribió al
 * diseñar esta clase, se evalúa igual.
 *
 * `riesgoDeApp()` (actualizaciones) y `esIntentoSospechoso()` (2FA) son la
 * misma idea aplicada a sus propios actos: hechos calculados sobre datos,
 * nunca un id comparado a mano contra otro id.
 *
 * En el acto final, `correoEsSeguro()` NO reinventa el detector de engaños:
 * llama a `mismoDominio()` y `enlaceEnganoso()`, las MISMAS funciones puras
 * que ya usa `n8-malware-e-ingenieria-social` — la clase de cierre confía en
 * el mismo armazón, no en una copia.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Acto «Contraseñas fuertes» — el medidor real
// ═══════════════════════════════════════════════════════════════════════════

export type NivelFuerza = 'debil' | 'media' | 'fuerte';

export interface ResultadoFuerza {
  puntos: number;
  nivel: NivelFuerza;
  tieneLargo: boolean;
  tieneMayuscula: boolean;
  tieneMinuscula: boolean;
  tieneNumero: boolean;
  tieneSimbolo: boolean;
  esComun: boolean;
  contieneDato: boolean;
}

/** Las contraseñas más repetidas en cualquier lista de filtraciones real. */
const CONTRASENAS_COMUNES = new Set([
  '123456',
  '12345678',
  '123456789',
  'password',
  'contrasena',
  'contraseña',
  'qwerty',
  'abc123',
  '111111',
  '000000',
  'iloveyou',
  'admin',
  'letmein',
]);

/**
 * El medidor de verdad: cinco criterios suman un punto cada uno, pero estar
 * en la lista de comunes o contener un dato personal fuerza el puntaje a 0 sin
 * importar qué más cumpla — una contraseña larga y con símbolos sigue siendo
 * mala idea si esa larga cadena con símbolos ES tu propio nombre.
 */
export function evaluarFuerza(contrasenaCruda: string, datosPersonales: string[] = []): ResultadoFuerza {
  const contrasena = contrasenaCruda.trim();
  const tieneLargo = contrasena.length >= 10;
  const tieneMayuscula = /[A-ZÁÉÍÓÚÑ]/.test(contrasena);
  const tieneMinuscula = /[a-záéíóúñ]/.test(contrasena);
  const tieneNumero = /[0-9]/.test(contrasena);
  const tieneSimbolo = /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(contrasena);
  const esComun = CONTRASENAS_COMUNES.has(contrasena.toLowerCase());
  const contieneDato = datosPersonales.some(
    (dato) => dato.trim().length > 0 && contrasena.toLowerCase().includes(dato.trim().toLowerCase()),
  );

  let puntos = 0;
  if (tieneLargo) puntos += 1;
  if (tieneMayuscula) puntos += 1;
  if (tieneMinuscula) puntos += 1;
  if (tieneNumero) puntos += 1;
  if (tieneSimbolo) puntos += 1;
  if (esComun || contieneDato || contrasena.length === 0) puntos = 0;

  const nivel: NivelFuerza = puntos <= 1 ? 'debil' : puntos <= 3 ? 'media' : 'fuerte';

  return { puntos, nivel, tieneLargo, tieneMayuscula, tieneMinuscula, tieneNumero, tieneSimbolo, esComun, contieneDato };
}

/** Las razones REALES por las que una contraseña no llegó a fuerte, leídas
 *  directo del resultado — nunca un texto fijo repetido en cada intento. */
function razonesDebilidad(r: ResultadoFuerza): string[] {
  if (r.esComun) return ['está en la lista de las contraseñas más usadas del mundo: cualquier atacante la prueba primero'];
  if (r.contieneDato) return ['lleva tu propio nombre o apellido: cualquiera que te conozca la adivina'];
  const razones: string[] = [];
  if (!r.tieneLargo) razones.push('tiene menos de 10 caracteres');
  if (!r.tieneMayuscula) razones.push('no lleva ninguna mayúscula');
  if (!r.tieneMinuscula) razones.push('no lleva ninguna minúscula');
  if (!r.tieneNumero) razones.push('no lleva ningún número');
  if (!r.tieneSimbolo) razones.push('no lleva ningún símbolo');
  return razones;
}

function criteriosCumplidos(r: ResultadoFuerza): string {
  const partes: string[] = [];
  if (r.tieneLargo) partes.push('más de 10 caracteres');
  if (r.tieneMayuscula) partes.push('mayúsculas');
  if (r.tieneMinuscula) partes.push('minúsculas');
  if (r.tieneNumero) partes.push('números');
  if (r.tieneSimbolo) partes.push('un símbolo');
  return partes.join(', ');
}

/** Los datos personales de Mateo, el mismo alumno de `n8-malware-e-ingenieria-
 *  social` y `n8-cifrado-basico`: si su propia contraseña los contiene, es
 *  débil sin importar qué más tenga. */
const DATOS_MATEO = ['mateo', 'reyes'];

interface Candidata {
  id: string;
  contrasena: string;
}

/** Dos claramente débiles, dos claramente fuertes — sin casos «media» que
 *  vuelvan ambigua la clasificación de dos botones. */
const CANDIDATAS: Candidata[] = [
  { id: 'c1', contrasena: '123456' },
  { id: 'c2', contrasena: 'futbol' },
  { id: 'c3', contrasena: 'Rp7$vLuna42' },
  { id: 'c4', contrasena: 'Tr3n-Az1178!' },
];

function veredictoCandidata(c: Candidata): 'fuerte' | 'debil' {
  return evaluarFuerza(c.contrasena, []).nivel === 'fuerte' ? 'fuerte' : 'debil';
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto «Actualizaciones» — la puerta que el malware aprovecha
// ═══════════════════════════════════════════════════════════════════════════

interface AppInstalada {
  id: string;
  nombre: string;
  icono: string;
  version: string;
  diasSinActualizar: number;
  boletin: { severidad: 'alta' | 'media'; resumen: string } | null;
}

const APPS: AppInstalada[] = [
  {
    id: 'navegador',
    nombre: 'Tecnia Navegador',
    icono: '🌐',
    version: '12.4',
    diasSinActualizar: 210,
    boletin: {
      severidad: 'alta',
      resumen:
        'Corrige una falla que dejaba instalar un archivo malicioso disfrazado de imagen — el mismo truco de doble extensión que ya viste en los correos de Mateo. Parche disponible desde hace más de un mes.',
    },
  },
  {
    id: 'notas',
    nombre: 'Tecnia Notas',
    icono: '📝',
    version: '2.3',
    diasSinActualizar: 12,
    boletin: { severidad: 'media', resumen: 'Corrige un error menor de guardado automático.' },
  },
  {
    id: 'arena',
    nombre: 'ArenaCraft',
    icono: '🎮',
    version: '3.1',
    diasSinActualizar: 3,
    boletin: null,
  },
];

/** Un hecho calculado, no una etiqueta puesta a mano: «urgente» sólo cuando
 *  hay un boletín de severidad alta Y llevan más de 30 días sin instalarlo. */
function riesgoDeApp(app: AppInstalada): 'urgente' | 'pendiente' | 'al-dia' {
  if (app.boletin && app.boletin.severidad === 'alta' && app.diasSinActualizar > 30) return 'urgente';
  if (app.boletin) return 'pendiente';
  return 'al-dia';
}

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto «Verificación en dos pasos»
// ═══════════════════════════════════════════════════════════════════════════

interface HuellaAcceso {
  navegador: string;
  ciudad: string;
}

const DISPOSITIVO_HABITUAL: HuellaAcceso = { navegador: 'Chrome', ciudad: 'Toluca' };
const INTENTO_SOSPECHOSO: HuellaAcceso & { hace: string } = { navegador: 'Firefox', ciudad: 'Bogotá', hace: 'hace 40 segundos' };

/** También un hecho: compara el intento contra el dispositivo habitual, no
 *  contra un id fijo de «el intento malo es éste». */
function esIntentoSospechoso(intento: HuellaAcceso, habitual: HuellaAcceso): boolean {
  return intento.navegador !== habitual.navegador || intento.ciudad !== habitual.ciudad;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto final — cruza Tecnia Correo y Tecnia Navegador
// ═══════════════════════════════════════════════════════════════════════════

const YO: RemitenteCorreo = { nombre: 'Mateo', direccion: 'mateo.reyes@secutec.edu.mx' };

/** Correo NUEVO, distinto de los cinco de `n8-malware-e-ingenieria-social»:
 *  esta vez es legítimo, y el alumno tiene que reconocerlo con el mismo
 *  criterio, no memorizando «todo correo es sospechoso». */
const MENSAJE_CIERRE: MensajeCorreo = {
  id: 'm-aviso-seguridad',
  de: { nombre: 'Seguridad secutec', direccion: 'seguridad@secutec.edu.mx' },
  para: [YO],
  cc: [],
  asunto: 'Cambia tu contraseña: filtración detectada',
  cuerpo: [
    'Una lista de contraseñas antiguas de OTROS sitios (no de secutec) quedó expuesta en internet, y tu correo estaba en esa lista.',
    'Por seguridad, cambia tu contraseña de secutec desde el enlace de abajo. Este correo nunca te va a pedir que escribas tu contraseña aquí ni que la respondas por mensaje.',
  ],
  fecha: 'Miércoles 9:00',
  adjuntos: [],
  enlaces: [{ texto: 'secutec.edu.mx/cambiar-clave', destino: 'secutec.edu.mx/cambiar-clave' }],
  carpeta: 'recibidos',
  leido: false,
  marcado: false,
};

/** No reinventa el detector: llama a las MISMAS funciones puras de
 *  `simuladores/correo` que ya usa la hermana de malware. */
function correoEsSeguro(mensaje: MensajeCorreo, yo: RemitenteCorreo): boolean {
  return mismoDominio(mensaje.de.direccion, yo.direccion) && mensaje.enlaces.every((e) => !enlaceEnganoso(e));
}

const URL_CAMBIAR_CLAVE = 'secutec.edu.mx/cambiar-clave';
const URL_VERIFICACION = 'secutec.edu.mx/verificacion-dos-pasos';

const MAPA_CIERRE: MapaSitios = {
  [URL_CAMBIAR_CLAVE]: {
    url: URL_CAMBIAR_CLAVE,
    pestana: 'Cambiar contraseña',
    titulo: 'Cambia tu contraseña de secutec',
    autor: null,
    fecha: null,
    protocolo: 'https',
    certificado: { emisor: 'AC Educación Digital', valido: true },
    cuerpo: { tipo: 'ficha', datos: [{ etiqueta: 'Cuenta', valor: 'mateo.reyes@secutec.edu.mx' }] },
  },
  [URL_VERIFICACION]: {
    url: URL_VERIFICACION,
    pestana: 'Verificación en dos pasos',
    titulo: 'Activa la verificación en dos pasos',
    autor: null,
    fecha: null,
    protocolo: 'https',
    certificado: { emisor: 'AC Educación Digital', valido: true },
    cuerpo: {
      tipo: 'ficha',
      datos: [{ etiqueta: 'Estado actual', valor: 'Sin activar' }],
      acciones: [{ id: 'activar-2fa', etiqueta: 'Activar verificación en dos pasos' }],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Reflexiones de opción múltiple, una por acto
// ═══════════════════════════════════════════════════════════════════════════

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_REFLEXION_CONTRASENAS: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque las dos son muy cortas, y una contraseña larga siempre es segura',
    correcta: false,
    explicacion:
      'No es sólo la longitud: «MateoReyesMateoReyes» sería larga y seguiría siendo pésima. Lo que las hace débiles a las dos es otra cosa.',
  },
  {
    id: 'b',
    texto: 'Porque un atacante prueba primero las contraseñas más usadas del mundo y los datos que ya sabe de ti —tu nombre, tu cumpleaños— antes que cualquier otra combinación',
    correcta: true,
    explicacion:
      'Exacto. Un programa que adivina contraseñas no prueba al azar: empieza por «123456», «password», y por cualquier dato tuyo que ya conoce. Por eso ambas caen primero, aunque una tenga sólo números y la otra sólo letras.',
  },
  {
    id: 'c',
    texto: 'Porque las computadoras no pueden trabajar con letras, sólo con números',
    correcta: false,
    explicacion: 'Las computadoras trabajan igual de bien con letras que con números — mezclar los dos es justo lo que ayuda.',
  },
  {
    id: 'd',
    texto: 'Porque ninguna de las dos tiene un símbolo como ! o $',
    correcta: false,
    explicacion:
      'Los símbolos ayudan, pero ésa no es la razón principal: son débiles sobre todo porque están entre las PRIMERAS cosas que alguien prueba.',
  },
];

const OPCIONES_REFLEXION_ACTUALIZACIONES: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque las actualizaciones tapan fallas de seguridad ya conocidas y publicadas: si no las instalas, cualquiera puede aprovechar exactamente esa falla, como el archivo disfrazado de imagen que ya viste',
    correcta: true,
    explicacion:
      'Correcto. Un boletín de seguridad es, literalmente, un mapa publicado de por dónde se puede entrar — la actualización cierra esa puerta específica. Sin instalarla, la puerta se queda abierta aunque tú no sepas dónde está.',
  },
  {
    id: 'b',
    texto: 'Porque las actualizaciones hacen que el celular vaya más rápido',
    correcta: false,
    explicacion: 'A veces pasa, pero no es la razón de seguridad: una app puede ir igual de rápida y seguir teniendo la falla sin parchar.',
  },
  {
    id: 'c',
    texto: 'Porque si no actualizas, la app deja de abrir por completo',
    correcta: false,
    explicacion: 'La mayoría de las apps desactualizadas siguen abriendo sin problema — ahí está el riesgo: nada avisa que están expuestas.',
  },
  {
    id: 'd',
    texto: 'Porque las actualizaciones sólo cambian el diseño de los íconos',
    correcta: false,
    explicacion: 'A veces cambia el diseño, pero lo que de verdad importa está adentro: el parche a la falla que el boletín describe.',
  },
];

const OPCIONES_REFLEXION_2FA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque conocer la contraseña ya no basta: hace falta también el segundo aparato que sólo tú tienes en la mano, y sin él nadie puede confirmar el ingreso',
    correcta: true,
    explicacion:
      'Exacto — lo acabas de vivir: el intento tenía tu contraseña correcta y aun así se quedó esperando un código que sólo llega a tu propio dispositivo.',
  },
  {
    id: 'b',
    texto: 'Porque la verificación en dos pasos cambia tu contraseña automáticamente cada semana',
    correcta: false,
    explicacion: 'No cambia ninguna contraseña: pide un segundo dato, aparte, que sólo tú puedes dar.',
  },
  {
    id: 'c',
    texto: 'Porque bloquea el internet de toda tu casa cuando detecta un intento raro',
    correcta: false,
    explicacion: 'No toca la red de tu casa en absoluto — sólo pregunta, en tu propio dispositivo, si el intento de entrar fuiste tú.',
  },
  {
    id: 'd',
    texto: 'Porque hace que tu contraseña sea más corta y fácil de recordar',
    correcta: false,
    explicacion: 'La contraseña sigue siendo la misma: la verificación en dos pasos es una capa aparte, no un cambio a la contraseña.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6 · El laboratorio — 10 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 10;

const INSTRUCCIONES: string[] = [
  'Escribe una contraseña nueva. El medidor te dice en vivo qué le falta.',
  'Marca cada contraseña como fuerte o débil, y presiona Comprobar.',
  'Elige la respuesta correcta.',
  'Toca la app que necesita actualizarse AHORA MISMO.',
  'Elige la respuesta correcta.',
  'Decide qué hacer con este intento de acceso.',
  'Elige la respuesta correcta.',
  '¿Es seguro seguir el enlace de este correo?',
  'Escribe una contraseña nueva, fuerte y DISTINTA de la que ya usaste.',
  'Activa la verificación en dos pasos para terminar.',
];

const NOMBRES_ACTO = ['Contraseñas fuertes', 'Actualizaciones', 'Verificación en dos pasos', 'Escenario final'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 3, 5, 7, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

export function LabHabitosDeProteccion(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1 · contraseñas
  const [valorC1, setValorC1] = useState('');
  const [contrasenaGuardada, setContrasenaGuardada] = useState<string | null>(null);
  const [seleccionCandidatas, setSeleccionCandidatas] = useState<Record<string, 'fuerte' | 'debil'>>({});
  const [reflexionContrasenasId, setReflexionContrasenasId] = useState<string | null>(null);

  // Acto 2 · actualizaciones
  const [appElegida, setAppElegida] = useState<string | null>(null);
  const [reflexionActualizacionesId, setReflexionActualizacionesId] = useState<string | null>(null);

  // Acto 3 · 2FA
  const [decisionIntento, setDecisionIntento] = useState<'aprobar' | 'bloquear' | null>(null);
  const [reflexion2faId, setReflexion2faId] = useState<string | null>(null);

  // Acto 4 · el cierre
  const [decisionCorreo, setDecisionCorreo] = useState<'seguro' | 'engano' | null>(null);
  const correo = useCorreo({ yo: YO, mensajes: [MENSAJE_CIERRE], carpetaInicial: 'recibidos' });
  const nav = useNavegador({ mapa: MAPA_CIERRE, inicio: URL_CAMBIAR_CLAVE });
  const [direccion, setDireccion] = useState(URL_CAMBIAR_CLAVE);
  const [valorC9, setValorC9] = useState('');

  // Al entrar al paso 7, se abre el único correo del cierre — igual que
  // cualquier hermana abre su correo semilla sin que el alumno teclee nada.
  useEffect(() => {
    if (pasoActual === 7 && correo.seleccionId !== MENSAJE_CIERRE.id) {
      correo.abrir(MENSAJE_CIERRE.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual]);

  // Al entrar a los pasos 8-9, el navegador salta a la URL de ese paso.
  useEffect(() => {
    if (pasoActual === 8 && nav.paginaActual.url !== URL_CAMBIAR_CLAVE) {
      nav.navegar(URL_CAMBIAR_CLAVE);
      setDireccion(URL_CAMBIAR_CLAVE);
    }
    if (pasoActual === 9 && nav.paginaActual.url !== URL_VERIFICACION) {
      nav.navegar(URL_VERIFICACION);
      setDireccion(URL_VERIFICACION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual]);

  const resultadoC1 = useMemo(() => evaluarFuerza(valorC1, DATOS_MATEO), [valorC1]);
  const resultadoC9 = useMemo(() => evaluarFuerza(valorC9, DATOS_MATEO), [valorC9]);

  const marcarAcierto = (texto: string) => {
    lab.avanzar();
    setMensaje({ ok: true, texto });
    setBloqueado(true);
  };

  const marcarError = (texto: string) => {
    lab.restar();
    setMensaje({ ok: false, texto });
  };

  const siguiente = () => {
    setMensaje(null);
    setBloqueado(false);
    setPasoActual((p) => p + 1);
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  // ── Acto 1 ────────────────────────────────────────────────────────────
  const intentarGuardarC1 = () => {
    if (bloqueado) return;
    if (resultadoC1.nivel === 'fuerte') {
      setContrasenaGuardada(valorC1.trim());
      marcarAcierto(
        `Fuerte de verdad: cumple ${criteriosCumplidos(resultadoC1)}, y no es una contraseña común ni lleva tu nombre. Guárdala en tu cabeza, no en un papel.`,
      );
    } else {
      const razones = razonesDebilidad(resultadoC1);
      marcarError(`Todavía no. Le falta: ${razones.join('; ')}.`);
    }
  };

  const elegirCandidata = (id: string, valor: 'fuerte' | 'debil') => {
    if (bloqueado) return;
    setSeleccionCandidatas((prev) => ({ ...prev, [id]: valor }));
  };

  const comprobarCandidatas = () => {
    if (bloqueado) return;
    const todasCorrectas = CANDIDATAS.every((c) => seleccionCandidatas[c.id] === veredictoCandidata(c));
    if (todasCorrectas) {
      marcarAcierto(
        'Las cuatro coinciden con el medidor: «123456» está en toda lista de filtraciones, y «futbol» sola —corta, sin mayúsculas ni números— cae en segundos. Las otras dos mezclan longitud, mayúsculas, minúsculas, números y símbolo.',
      );
    } else {
      marcarError('Todavía no coinciden todas con el medidor. Vuelve a mirarlas: longitud, mayúsculas, minúsculas, números y símbolo.');
    }
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const elegirApp = (app: AppInstalada) => {
    if (bloqueado) return;
    setAppElegida(app.id);
    if (riesgoDeApp(app) === 'urgente') {
      marcarAcierto(`${app.nombre}: ${app.boletin?.resumen} Lleva ${app.diasSinActualizar} días sin actualizarse — esa es la app urgente.`);
    } else if (app.boletin) {
      marcarError(`${app.nombre} tiene un boletín, pero de severidad media y no es la más urgente. Busca la que tiene severidad ALTA y lleva meses sin actualizarse.`);
    } else {
      marcarError(`${app.nombre} no tiene ningún boletín de seguridad pendiente: no es ésta.`);
    }
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const decidirIntento = (id: 'aprobar' | 'bloquear') => {
    if (bloqueado) return;
    setDecisionIntento(id);
    const sospechoso = esIntentoSospechoso(INTENTO_SOSPECHOSO, DISPOSITIVO_HABITUAL);
    const acerto = (id === 'bloquear') === sospechoso;
    if (acerto) {
      marcarAcierto(
        `Bloqueado. Ese intento venía desde ${INTENTO_SOSPECHOSO.ciudad} en ${INTENTO_SOSPECHOSO.navegador} — tú siempre entras desde ${DISPOSITIVO_HABITUAL.ciudad} en ${DISPOSITIVO_HABITUAL.navegador}. Tenían tu contraseña correcta y aun así no pudieron entrar sin tu aprobación.`,
      );
    } else {
      marcarError(
        `Ese intento no coincide con tu dispositivo habitual (${DISPOSITIVO_HABITUAL.ciudad}, ${DISPOSITIVO_HABITUAL.navegador}). Cuando algo no coincide, se bloquea.`,
      );
    }
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const decidirCorreo = (id: 'seguro' | 'engano') => {
    if (bloqueado) return;
    setDecisionCorreo(id);
    const real = correoEsSeguro(MENSAJE_CIERRE, YO);
    const acerto = (id === 'seguro') === real;
    if (acerto) {
      marcarAcierto(
        'Es legítimo: el remitente escribe desde secutec.edu.mx —el mismo dominio de tu propia cuenta— y el enlace lleva exactamente a donde dice ir, sin trucos. Y nota algo más: el correo nunca te pide escribir tu contraseña en el mensaje.',
      );
    } else {
      marcarError('Revisa otra vez el dominio del remitente y a dónde va de verdad el enlace — con eso alcanza para decidir.');
    }
  };

  const intentarGuardarC9 = () => {
    if (bloqueado) return;
    if (resultadoC9.nivel !== 'fuerte') {
      marcarError(`Todavía no. Le falta: ${razonesDebilidad(resultadoC9).join('; ')}.`);
      return;
    }
    if (contrasenaGuardada !== null && valorC9.trim() === contrasenaGuardada) {
      marcarError(
        'Es fuerte, pero es la MISMA que ya usaste para tu otra cuenta. Si algún día ESA cuenta filtra su lista de contraseñas, la misma clave abriría también ésta. Escribe una distinta.',
      );
      return;
    }
    marcarAcierto('Nueva, fuerte y distinta de la anterior: exactamente lo que hace falta para no repetir la misma llave en dos puertas.');
  };

  const manejarAccionFicha = (id: string) => {
    if (bloqueado || pasoActual !== 9) return;
    if (id === 'activar-2fa') {
      marcarAcierto('Verificación en dos pasos activada. De aquí en adelante, entrar a esta cuenta va a pedir siempre el segundo código.');
    }
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Escudo" subtitulo="Hábitos de protección">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🎖️
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Tus hábitos ya son tu escudo</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Forjaste una contraseña fuerte de verdad, reconociste cuál app necesitaba actualizarse antes de que el
            malware la aprovechara, bloqueaste un intento de acceso aunque tenía tu contraseña correcta, y cerraste
            cambiando tu clave —distinta de la anterior— y activando la verificación en dos pasos. IP y wifi, correo y
            candado, contraseñas y 2FA: los cuatro hábitos, trabajando juntos.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);
  const marca = pasoActual < 7 ? 'Tecnia Escudo' : pasoActual === 7 ? 'Tecnia Correo' : 'Tecnia Navegador';
  const subtitulo = pasoActual < 7 ? 'Centro de seguridad · mateo.reyes' : 'mateo.reyes@secutec.edu.mx';

  const todasCandidatasElegidas = CANDIDATAS.every((c) => seleccionCandidatas[c.id]);

  return (
    <VentanaBase marca={marca} subtitulo={subtitulo}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        {/* ── Pantalla principal: cambia de programa según el acto ── */}
        <div className="flex flex-col gap-4 min-w-0">
          {pasoActual < 7 && (
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
              {NOMBRES_ACTO.map((nombre, i) => {
                const activa = acto === i;
                const hecha = pasoActual >= LIMITES_ACTO[i + 1];
                return (
                  <span
                    key={nombre}
                    className={`px-3 py-1.5 rounded-full ${
                      activa ? 'bg-cyan-500 text-slate-950' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {hecha ? '✓ ' : ''}
                    {nombre}
                  </span>
                );
              })}
            </div>
          )}

          <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 flex flex-col gap-4" data-testid="pantalla-escudo">
            {/* Encargo 1 · forja una contraseña fuerte */}
            {pasoActual === 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-300">
                  Bit quiere una contraseña nueva para su cuenta. Escríbela abajo — el medidor reacciona a cada letra que
                  tecleas, en vivo.
                </p>
                <input
                  type="text"
                  data-testid="input-contrasena-1"
                  value={valorC1}
                  disabled={bloqueado}
                  onChange={(e) => setValorC1(e.target.value)}
                  placeholder="Escribe una contraseña"
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono disabled:opacity-50"
                />
                <MedidorFuerza resultado={resultadoC1} />
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="guardar-contrasena-1"
                    onClick={intentarGuardarC1}
                    className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold self-start"
                  >
                    Guardar esta contraseña
                  </button>
                )}
              </div>
            )}

            {/* Encargo 2 · clasifica cuatro candidatas */}
            {pasoActual === 1 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">Cuatro contraseñas que unos compañeros propusieron para su cuenta de juego. Clasifica cada una.</p>
                <ul className="flex flex-col gap-2" data-testid="lista-candidatas">
                  {CANDIDATAS.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                      <span className="font-mono text-white flex-1 break-all">{c.contrasena}</span>
                      <button
                        type="button"
                        data-testid="candidata-fuerte"
                        disabled={bloqueado}
                        onClick={() => elegirCandidata(c.id, 'fuerte')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                          seleccionCandidatas[c.id] === 'fuerte' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        💪 Fuerte
                      </button>
                      <button
                        type="button"
                        data-testid="candidata-debil"
                        disabled={bloqueado}
                        onClick={() => elegirCandidata(c.id, 'debil')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                          seleccionCandidatas[c.id] === 'debil' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        🔓 Débil
                      </button>
                    </li>
                  ))}
                </ul>
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="comprobar-candidatas"
                    disabled={!todasCandidatasElegidas}
                    onClick={comprobarCandidatas}
                    className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 3 · reflexión */}
            {pasoActual === 2 && (
              <McqBloque opciones={OPCIONES_REFLEXION_CONTRASENAS} elegidoId={reflexionContrasenasId} bloqueado={bloqueado}
                pregunta="¿Por qué «123456» y el propio nombre son ambas contraseñas débiles, aunque una tenga números y la otra letras?"
                onElegir={(op) => {
                  setReflexionContrasenasId(op.id);
                  if (op.correcta) marcarAcierto(op.explicacion);
                  else marcarError(op.explicacion);
                }}
              />
            )}

            {/* Encargo 4 · qué app actualizar */}
            {pasoActual === 3 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">El panel de actualizaciones de Bit muestra tres apps. ¿Cuál necesita actualizarse AHORA MISMO?</p>
                <ul className="flex flex-col gap-2" data-testid="lista-apps">
                  {APPS.map((app) => (
                    <li key={app.id}>
                      <button
                        type="button"
                        data-testid="app-opcion"
                        disabled={bloqueado}
                        onClick={() => elegirApp(app)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left disabled:opacity-50 ${
                          appElegida === app.id
                            ? riesgoDeApp(app) === 'urgente'
                              ? 'bg-emerald-500/20 border border-emerald-400'
                              : 'bg-rose-500/20 border border-rose-400'
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-lg" aria-hidden="true">{app.icono}</span>
                        <span className="flex-1">
                          <span className="block text-white font-semibold">{app.nombre}</span>
                          <span className="block text-xs text-slate-400">
                            v{app.version} · sin actualizar hace {app.diasSinActualizar} días
                          </span>
                        </span>
                        {app.boletin && (
                          <span className={`text-xs font-bold uppercase ${app.boletin.severidad === 'alta' ? 'text-rose-400' : 'text-amber-400'}`}>
                            {app.boletin.severidad}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Encargo 5 · reflexión */}
            {pasoActual === 4 && (
              <McqBloque opciones={OPCIONES_REFLEXION_ACTUALIZACIONES} elegidoId={reflexionActualizacionesId} bloqueado={bloqueado}
                pregunta="¿Por qué una app desactualizada es una puerta para el malware?"
                onElegir={(op) => {
                  setReflexionActualizacionesId(op.id);
                  if (op.correcta) marcarAcierto(op.explicacion);
                  else marcarError(op.explicacion);
                }}
              />
            )}

            {/* Encargo 6 · bloquear el intento sospechoso */}
            {pasoActual === 5 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">Notificación de acceso:</p>
                <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-100 font-mono" data-testid="tarjeta-intento">
                  <p>Alguien escribió tu contraseña CORRECTA e intenta entrar.</p>
                  <p className="mt-2">Desde: {INTENTO_SOSPECHOSO.ciudad} · {INTENTO_SOSPECHOSO.navegador} · {INTENTO_SOSPECHOSO.hace}</p>
                  <p className="text-slate-400">Tu dispositivo habitual: {DISPOSITIVO_HABITUAL.ciudad} · {DISPOSITIVO_HABITUAL.navegador}</p>
                </div>
                <p className="text-sm text-slate-300">Llegó un código a tu segundo dispositivo. ¿Qué haces?</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="intento-aprobar"
                    disabled={bloqueado}
                    onClick={() => decidirIntento('aprobar')}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-semibold disabled:opacity-50 ${
                      decisionIntento === 'aprobar' ? 'bg-slate-700 border border-slate-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    ✅ Aprobar, soy yo
                  </button>
                  <button
                    type="button"
                    data-testid="intento-bloquear"
                    disabled={bloqueado}
                    onClick={() => decidirIntento('bloquear')}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-semibold disabled:opacity-50 ${
                      decisionIntento === 'bloquear' ? 'bg-slate-700 border border-slate-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    🚫 No fui yo, bloquear el intento
                  </button>
                </div>
              </div>
            )}

            {/* Encargo 7 · reflexión */}
            {pasoActual === 6 && (
              <McqBloque opciones={OPCIONES_REFLEXION_2FA} elegidoId={reflexion2faId} bloqueado={bloqueado}
                pregunta="¿Por qué el código de verificación en dos pasos protege tu cuenta aunque alguien ya tenga tu contraseña?"
                onElegir={(op) => {
                  setReflexion2faId(op.id);
                  if (op.correcta) marcarAcierto(op.explicacion);
                  else marcarError(op.explicacion);
                }}
              />
            )}

            {/* Encargo 8 · el correo del cierre (Tecnia Correo) */}
            {pasoActual === 7 && (
              <div className="flex flex-col gap-3">
                <VentanaCorreo
                  carpetaActiva={correo.carpeta}
                  cuentas={correo.cuentas}
                  mensajes={correo.enCarpeta()}
                  seleccionId={correo.seleccionId}
                  abierto={correo.abierto}
                  mostrarDireccion
                  mostrarDestino
                  onCarpeta={correo.abrirCarpeta}
                  onSeleccionar={() => {}}
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="correo-seguro"
                    disabled={bloqueado}
                    onClick={() => decidirCorreo('seguro')}
                    className={`px-4 py-3 rounded-xl font-bold disabled:opacity-50 ${
                      decisionCorreo === 'seguro' ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300' : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    ✅ Es seguro, voy a cambiar mi contraseña ahí
                  </button>
                  <button
                    type="button"
                    data-testid="correo-engano"
                    disabled={bloqueado}
                    onClick={() => decidirCorreo('engano')}
                    className={`px-4 py-3 rounded-xl font-bold disabled:opacity-50 ${
                      decisionCorreo === 'engano' ? 'bg-rose-500 text-white ring-2 ring-rose-300' : 'bg-rose-500 text-white'
                    }`}
                  >
                    🚫 Parece un engaño, mejor no
                  </button>
                </div>
              </div>
            )}

            {/* Encargo 9 · nueva contraseña, con el candado de Tecnia Navegador */}
            {pasoActual === 8 && (
              <div className="flex flex-col gap-4">
                <VentanaNavegador
                  pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: MAPA_CIERRE[p.url]?.pestana ?? p.url }))}
                  pagina={nav.paginaActual}
                  puedeAtras={nav.puedeAtras}
                  puedeAdelante={nav.puedeAdelante}
                  barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
                  onAtras={() => nav.atras()}
                  onAdelante={() => nav.adelante()}
                  onRecargar={() => nav.recargar()}
                />
                <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-sm text-slate-300">
                    El candado dice <strong className="text-emerald-400">{estadoSeguridad(nav.paginaActual) === 'segura' ? 'conexión segura' : 'revisa el candado'}</strong>. Escribe tu contraseña nueva:
                  </p>
                  <input
                    type="text"
                    data-testid="input-contrasena-9"
                    value={valorC9}
                    disabled={bloqueado}
                    onChange={(e) => setValorC9(e.target.value)}
                    placeholder="Escribe tu nueva contraseña"
                    className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono disabled:opacity-50"
                  />
                  <MedidorFuerza resultado={resultadoC9} />
                  {!bloqueado && (
                    <button
                      type="button"
                      data-testid="guardar-contrasena-9"
                      onClick={intentarGuardarC9}
                      className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold self-start"
                    >
                      Guardar nueva contraseña
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Encargo 10 · activar 2FA dentro del propio sitio */}
            {pasoActual === 9 && (
              <div className="flex flex-col gap-4">
                <VentanaNavegador
                  pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: MAPA_CIERRE[p.url]?.pestana ?? p.url }))}
                  pagina={nav.paginaActual}
                  puedeAtras={nav.puedeAtras}
                  puedeAdelante={nav.puedeAdelante}
                  barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
                  onAtras={() => nav.atras()}
                  onAdelante={() => nav.adelante()}
                  onRecargar={() => nav.recargar()}
                  onAccionFicha={manejarAccionFicha}
                />
                <p className="text-sm text-slate-300">Presiona el botón dentro de la página para activarla.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel de control lateral ── */}
        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="mis-panel">
          <p className="text-sm text-slate-300">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> / {TOTAL}
          </p>
          <p className="text-xs uppercase tracking-wider font-bold text-cyan-400">{NOMBRES_ACTO[acto]}</p>

          {!mensaje && <p className="text-sm text-slate-400">{INSTRUCCIONES[pasoActual]}</p>}

          {mensaje && (
            <div className="flex flex-col gap-2" data-testid="explicacion">
              <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mensaje.ok ? '¡Correcto!' : 'Todavía no.'}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
            </div>
          )}

          {mensaje?.ok && pasoActual !== 9 && (
            <button
              type="button"
              data-testid="siguiente"
              onClick={siguiente}
              className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
            >
              Siguiente
            </button>
          )}

          {mensaje?.ok && pasoActual === 9 && (
            <button
              type="button"
              data-testid="terminar"
              onClick={terminar}
              className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
            >
              Recibir la insignia
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

/** El medidor visual: cinco segmentos + checklist, leídos directo del
 *  resultado real — nada se pinta a mano según el texto que se haya escrito. */
function MedidorFuerza({ resultado }: { resultado: ResultadoFuerza }) {
  const color = resultado.nivel === 'fuerte' ? 'bg-emerald-500' : resultado.nivel === 'media' ? 'bg-amber-400' : 'bg-rose-500';
  const criterios: { etiqueta: string; ok: boolean }[] = [
    { etiqueta: 'Más de 10 caracteres', ok: resultado.tieneLargo },
    { etiqueta: 'Mayúsculas', ok: resultado.tieneMayuscula },
    { etiqueta: 'Minúsculas', ok: resultado.tieneMinuscula },
    { etiqueta: 'Números', ok: resultado.tieneNumero },
    { etiqueta: 'Un símbolo', ok: resultado.tieneSimbolo },
  ];
  return (
    <div className="flex flex-col gap-2" data-testid="medidor-fuerza" data-nivel={resultado.nivel}>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i < resultado.puntos ? color : 'bg-slate-700'}`} />
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
        Nivel: <span className={resultado.nivel === 'fuerte' ? 'text-emerald-400' : resultado.nivel === 'media' ? 'text-amber-400' : 'text-rose-400'}>{resultado.nivel}</span>
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
        {criterios.map((c) => (
          <li key={c.etiqueta} className={c.ok ? 'text-emerald-400' : ''}>
            {c.ok ? '✓' : '✗'} {c.etiqueta}
          </li>
        ))}
      </ul>
      {(resultado.esComun || resultado.contieneDato) && (
        <p className="text-xs font-bold text-rose-400">
          {resultado.esComun ? '⚠️ Está en la lista de contraseñas más usadas' : '⚠️ Contiene tu nombre o apellido'}
        </p>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las tres reflexiones. */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-200 leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LabHabitosDeProteccion;
