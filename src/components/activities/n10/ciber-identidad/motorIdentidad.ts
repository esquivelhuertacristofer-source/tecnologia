/**
 * N10 · «Ciberseguridad profesional» — «Identidad, autenticación y cifrado»
 * (parada 2 de 3, `RUTA_N10_CIBERSEGURIDAD`). N10 = Bachillerato, 15–18 años.
 *
 * El motor de los diez encargos con lógica real, nunca un veredicto escrito
 * a mano como sustituto de cómputo — la misma regla anti-épsilon que ya
 * aplicó `n8-cifrado-basico` al texto en vez de a números:
 *
 *  1. `analizarContrasena` computa longitud, variedad de caracteres y si el
 *     texto reutiliza datos del perfil público de la persona, sobre el
 *     STRING que el alumno escribe. Nunca compara contra una contraseña
 *     fija ni contra una lista de contraseñas prohibidas.
 *  2. `accesoBloqueado` calcula, para un caso de intento de acceso (qué sabe
 *     el atacante, qué segundo factor hay, si controla el teléfono o el
 *     dispositivo físico), si ese segundo factor detiene el acceso. La
 *     regla vive en UNA función; no hay una tabla aparte de «caso X →
 *     respuesta Y» que pudiera desincronizarse de ella.
 *  3. `remitenteConfiable` / `enlacesConfiables` reutilizan `dominioDe` y
 *     `enlaceEnganoso` de `simuladores/correo` — el mismo motor de HECHOS
 *     que ya usa la plataforma para el phishing, sin escribir una segunda
 *     tabla de «qué dominio es cuál».
 *  4. `protegeEnTransito` / `identidadConfirmada` reutilizan `protocoloDe` y
 *     `estadoSeguridad` de `simuladores/navegador` — la MISMA función que ya
 *     pinta el candado en `VentanaNavegador` — para profundizar el criterio
 *     binario de `n8-cifrado-basico` («¿es seguro escribir aquí?») en dos
 *     preguntas independientes: el candado cifra el CANAL, pero sólo un
 *     certificado válido confirma la IDENTIDAD de quien contesta. Un HTTPS
 *     con certificado inválido (`'advertencia'`) cifra el canal y NO
 *     confirma identidad a la vez — el matiz que la parada anterior no
 *     necesitaba y ésta sí.
 */

import {
  dominioDe,
  enlaceEnganoso,
  type EnlaceCorreo,
  type MensajeCorreo,
} from '@/components/simuladores/correo';
import { estadoSeguridad, protocoloDe, type PaginaWeb } from '@/components/simuladores/navegador';

// ───────────────────────────────────────────────────────────────────────────
// 1 · Contraseñas — función real sobre el texto que escribe el alumno
// ───────────────────────────────────────────────────────────────────────────

export interface PerfilPublico {
  nombrePila: string;
  apellido: string;
  anioNacimiento: number;
  mascota: string;
  equipoFavorito: string;
}

export interface AnalisisContrasena {
  longitud: number;
  longitudSuficiente: boolean;
  tieneMinuscula: boolean;
  tieneMayuscula: boolean;
  tieneNumero: boolean;
  tieneSimbolo: boolean;
  variedadDeClases: number;
  variedadSuficiente: boolean;
  /** Etiquetas de los datos del perfil público que aparecen dentro de la contraseña. */
  datosPublicosReutilizados: string[];
  esFuerte: boolean;
}

const LONGITUD_MINIMA = 12;
const VARIEDAD_MINIMA = 3;

/**
 * Los campos del perfil público son los que un atacante encontraría sin
 * esfuerzo (una red social, una tarjeta de presentación). Cualquiera con al
 * menos 3 caracteres se busca DENTRO del texto de la contraseña — la misma
 * técnica de `enlaceEnganoso`: se detecta un HECHO verificable sobre datos
 * reales, nunca se compara contra una lista de contraseñas prohibidas
 * escrita a mano.
 */
export function analizarContrasena(contrasena: string, perfil: PerfilPublico): AnalisisContrasena {
  const longitud = contrasena.length;
  const tieneMinuscula = /[a-z]/.test(contrasena);
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /[0-9]/.test(contrasena);
  const tieneSimbolo = /[^A-Za-z0-9]/.test(contrasena);
  const variedadDeClases = [tieneMinuscula, tieneMayuscula, tieneNumero, tieneSimbolo].filter(Boolean).length;

  const candidatosPublicos: Array<[string, string]> = [
    ['tu nombre', perfil.nombrePila],
    ['tu apellido', perfil.apellido],
    ['tu año de nacimiento', String(perfil.anioNacimiento)],
    ['el nombre de tu mascota', perfil.mascota],
    ['tu equipo favorito', perfil.equipoFavorito],
  ];
  const enMinuscula = contrasena.toLowerCase();
  const datosPublicosReutilizados = candidatosPublicos
    .filter(([, valor]) => valor.trim().length >= 3 && enMinuscula.includes(valor.toLowerCase()))
    .map(([etiqueta]) => etiqueta);

  const longitudSuficiente = longitud >= LONGITUD_MINIMA;
  const variedadSuficiente = variedadDeClases >= VARIEDAD_MINIMA;

  return {
    longitud,
    longitudSuficiente,
    tieneMinuscula,
    tieneMayuscula,
    tieneNumero,
    tieneSimbolo,
    variedadDeClases,
    variedadSuficiente,
    datosPublicosReutilizados,
    esFuerte: longitudSuficiente && variedadSuficiente && datosPublicosReutilizados.length === 0,
  };
}

export const PERFIL_PUBLICO: PerfilPublico = {
  nombrePila: 'Regina',
  apellido: 'Paredes',
  anioNacimiento: 2009,
  mascota: 'Simba',
  equipoFavorito: 'Pumas',
};

/** La primera contraseña que Regina usó de verdad para su cuenta nueva —
 *  material del encargo de diagnóstico, no un ejemplo abstracto. */
export const CONTRASENA_EJEMPLO = 'Regina2009';

export interface OpcionDiagnostico {
  id: string;
  texto: string;
}

/** Las cuatro debilidades posibles que se enseñan. Cuáles de ellas APLICAN
 *  al caso de `CONTRASENA_EJEMPLO` no se decide aquí: lo decide
 *  `debilidadesReales`, llamando a `analizarContrasena`. */
export const OPCIONES_DIAGNOSTICO: OpcionDiagnostico[] = [
  { id: 'corta', texto: `Es demasiado corta: menos de ${LONGITUD_MINIMA} caracteres.` },
  { id: 'sin-simbolos', texto: 'No usa ningún símbolo ni signo de puntuación.' },
  { id: 'datos-publicos', texto: 'Reutiliza datos que cualquiera puede encontrar en su perfil público.' },
  { id: 'poca-variedad', texto: `No combina al menos ${VARIEDAD_MINIMA} tipos de caracteres distintos.` },
];

/** Las debilidades que de verdad tiene una contraseña, derivadas del
 *  análisis real — nunca una lista aparte que alguien tuvo que mantener
 *  sincronizada a mano con `analizarContrasena`. */
export function debilidadesReales(analisis: AnalisisContrasena): Set<string> {
  const debilidades = new Set<string>();
  if (!analisis.longitudSuficiente) debilidades.add('corta');
  if (!analisis.tieneSimbolo) debilidades.add('sin-simbolos');
  if (analisis.datosPublicosReutilizados.length > 0) debilidades.add('datos-publicos');
  if (!analisis.variedadSuficiente) debilidades.add('poca-variedad');
  return debilidades;
}

export function mismoConjunto(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const valor of a) {
    if (!b.has(valor)) return false;
  }
  return true;
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Doble factor — función real sobre el caso, no una tabla aparte
// ───────────────────────────────────────────────────────────────────────────

export type FactorAcceso = 'ninguno' | 'sms' | 'autenticador' | 'llave-fisica';

export interface CasoAcceso {
  id: string;
  titulo: string;
  descripcion: string;
  atacanteTienePassword: boolean;
  factor: FactorAcceso;
  /** El atacante duplicó la SIM o desvió la línea: controla los SMS. */
  atacanteControlaTelefono: boolean;
  /** El atacante tiene en la mano el teléfono o la llave física de la persona. */
  atacanteTieneDispositivoFisico: boolean;
}

/**
 * El corazón del encargo: si el atacante ya tiene la contraseña, ¿el
 * segundo factor detiene el acceso? Depende de QUÉ controla el atacante, no
 * de si «hay 2FA» en abstracto — un código por SMS a un número que el
 * atacante ya desvió no protege nada; una aplicación autenticadora sigue
 * viva en un teléfono que el atacante no tiene en la mano, aunque controle
 * la línea telefónica.
 */
export function accesoBloqueado(caso: CasoAcceso): boolean {
  if (!caso.atacanteTienePassword) return true;
  switch (caso.factor) {
    case 'ninguno':
      return false;
    case 'sms':
      return !caso.atacanteControlaTelefono;
    case 'autenticador':
    case 'llave-fisica':
      return !caso.atacanteTieneDispositivoFisico;
    default:
      return true;
  }
}

export const CASOS_ACCESO: CasoAcceso[] = [
  {
    id: 'caso-sin-2fa',
    titulo: 'Filtración de contraseña, sin segundo factor',
    descripcion:
      'Una base de datos externa donde Regina había reutilizado una contraseña quedó expuesta en una filtración. El atacante ya tiene la contraseña exacta de su cuenta en Orbitatek, que todavía no tiene ningún segundo factor activado.',
    atacanteTienePassword: true,
    factor: 'ninguno',
    atacanteControlaTelefono: false,
    atacanteTieneDispositivoFisico: false,
  },
  {
    id: 'caso-sms-simswap',
    titulo: 'Contraseña filtrada + verificación por SMS',
    descripcion:
      'El atacante ya tiene la contraseña y además consiguió que la compañía telefónica transfiriera el número de Regina a una tarjeta SIM bajo su control. La cuenta de Orbitatek exige un código enviado por SMS como segundo factor.',
    atacanteTienePassword: true,
    factor: 'sms',
    atacanteControlaTelefono: true,
    atacanteTieneDispositivoFisico: false,
  },
  {
    id: 'caso-autenticador',
    titulo: 'Contraseña filtrada + aplicación autenticadora',
    descripcion:
      'El atacante tiene la contraseña y controla el número telefónico de Regina —el mismo duplicado de SIM del caso anterior—, pero la cuenta de Orbitatek exige un código generado por una aplicación autenticadora instalada en el teléfono físico de Regina, que nunca salió de sus manos.',
    atacanteTienePassword: true,
    factor: 'autenticador',
    atacanteControlaTelefono: true,
    atacanteTieneDispositivoFisico: false,
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 3 · Phishing dirigido a la identidad — mismo motor que Tecnia Correo
// ───────────────────────────────────────────────────────────────────────────

export const DOMINIO_OFICIAL = 'orbitatek.mx';

/** El dominio real del remitente coincide con el dominio de la empresa —
 *  mismo HECHO que ya calcula `dominioDe`, sin volver a escribir el dominio
 *  «bueno» en una segunda lista. */
export function remitenteConfiable(mensaje: MensajeCorreo, dominioOficial: string): boolean {
  return dominioDe(mensaje.de.direccion) === dominioOficial;
}

/** Ningún enlace del correo miente sobre a dónde lleva. */
export function enlacesConfiables(enlaces: EnlaceCorreo[]): boolean {
  return enlaces.every((enlace) => !enlaceEnganoso(enlace));
}

export function pareceLegitimo(mensaje: MensajeCorreo, dominioOficial: string): boolean {
  return remitenteConfiable(mensaje, dominioOficial) && enlacesConfiables(mensaje.enlaces);
}

const REGINA: { nombre: string; direccion: string } = {
  nombre: 'Regina Paredes',
  direccion: 'regina.paredes@orbitatek.mx',
};

/** El correo forjado: dominio del remitente distinto del oficial Y un
 *  enlace cuyo texto aparenta `orbitatek.mx` pero lleva a otro anfitrión —
 *  las dos señales coinciden a propósito, para que el encargo se pueda
 *  resolver desde cualquiera de las dos. */
export const MENSAJE_PHISHING: MensajeCorreo = {
  id: 'correo-alerta-cuenta',
  de: { nombre: 'Soporte TI · Orbitatek', direccion: 'soporte@orbitatek-id.mx' },
  para: [REGINA],
  cc: [],
  asunto: 'Actividad inusual detectada en tu cuenta',
  cuerpo: [
    'Detectamos un inicio de sesión desde un dispositivo no reconocido hace unos minutos.',
    'Para evitar la suspensión de tu cuenta, confirma tu identidad en el siguiente enlace dentro de las próximas 24 horas.',
  ],
  fecha: 'Hoy, 8:41',
  adjuntos: [],
  enlaces: [{ texto: 'orbitatek.mx/verificar-cuenta', destino: 'orbitatek-id-segura.mx/verificar?usuario=regina.paredes' }],
  carpeta: 'recibidos',
  leido: false,
  marcado: false,
};

/** El correo legítimo: mismo dominio, mismo destino que el texto del
 *  enlace. Necesario para que la clase no aprenda «todo correo con enlace es
 *  phishing» — la mitad del criterio profesional es no gastar sospecha
 *  donde no hace falta. */
export const MENSAJE_LEGITIMO: MensajeCorreo = {
  id: 'correo-recordatorio-rh',
  de: { nombre: 'Recursos Humanos · Orbitatek', direccion: 'rh@orbitatek.mx' },
  para: [REGINA],
  cc: [],
  asunto: 'Recordatorio: actualiza tu contraseña antes del viernes',
  cuerpo: [
    'Como parte de la política trimestral de seguridad, todo el personal debe actualizar su contraseña antes del viernes.',
    'Puedes hacerlo desde tu panel de cuenta cuando quieras esta semana; no hace falta responder este correo.',
  ],
  fecha: 'Ayer, 17:12',
  adjuntos: [],
  enlaces: [{ texto: 'orbitatek.mx/mi-cuenta/contrasena', destino: 'orbitatek.mx/mi-cuenta/contrasena' }],
  carpeta: 'recibidos',
  leido: false,
  marcado: false,
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · Cifrado profundizado — el mismo candado, dos preguntas independientes
// ───────────────────────────────────────────────────────────────────────────

/** ¿El canal está cifrado mientras tus datos viajan? Sólo mira el
 *  protocolo: hasta un HTTPS con certificado inválido cifra el tubo por el
 *  que viajan los bytes — cifrar y confirmar identidad son dos cosas
 *  distintas. */
export function protegeEnTransito(pagina: PaginaWeb): boolean {
  return protocoloDe(pagina) !== 'http';
}

/** ¿Puedes confirmar que el otro extremo del tubo es quien dice ser? Sólo lo
 *  confirma un certificado válido — el mismo criterio que ya pinta el
 *  candado 🔒 verde en `VentanaNavegador`, reutilizado sin duplicarlo. */
export function identidadConfirmada(pagina: PaginaWeb): boolean {
  return estadoSeguridad(pagina) === 'segura';
}

/** Portal de prácticas sin cifrar: ni canal ni identidad. */
export const SITIO_INSEGURO: PaginaWeb = {
  url: 'vacantes-practicas.mx/postula',
  pestana: 'Portal de Prácticas',
  titulo: 'Postulación a prácticas profesionales',
  autor: null,
  fecha: null,
  protocolo: 'http',
  cuerpo: {
    tipo: 'ficha',
    datos: [
      { etiqueta: 'Correo', valor: 'regina.paredes@orbitatek.mx' },
      { etiqueta: 'Contraseña', valor: '••••••••' },
    ],
  },
};

/** Panel de certificaciones con HTTPS pero certificado inválido: canal
 *  cifrado, identidad SIN confirmar — el matiz que esta parada añade sobre
 *  `n8-cifrado-basico`. */
export const SITIO_ADVERTENCIA: PaginaWeb = {
  url: 'certifica-pro.mx/panel',
  pestana: 'CertificaPro',
  titulo: 'Panel de certificaciones profesionales',
  autor: null,
  fecha: null,
  protocolo: 'https',
  certificado: { emisor: 'Desconocido', valido: false },
  cuerpo: {
    tipo: 'ficha',
    datos: [
      { etiqueta: 'Usuario', valor: 'tu_usuario' },
      { etiqueta: 'Contraseña', valor: '••••••••' },
    ],
  },
};
