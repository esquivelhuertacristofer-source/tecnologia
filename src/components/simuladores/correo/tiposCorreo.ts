/**
 * TECNIA CORREO · los datos, sin React.
 *
 * El cliente de correo de Tecnia. No es Outlook ni Gmail —ningún logotipo
 * real—: es el programa de correo de la plataforma. Sale de partir en tres lo
 * que `CANON-ARMAZONES.md` había agrupado bajo «10 · Tecnia Nube»: correo,
 * tablero y agenda no son el mismo programa ni se parecen por dentro.
 *
 * ── Lo que el canon dijo y lo que la medición encontró ──────────────────────
 *
 * El canon afirma que `LabPartesDelCorreo.tsx` (1 363 líneas) «ya tiene el
 * cliente de correo completo de un extremo a otro». Leído entero, NO lo tiene:
 * pinta la anatomía de un correo, que es otra cosa. Lo que hay de verdad:
 *
 *   TIENE      la anatomía (De/Para/CC/Asunto/cuerpo/adjunto) y el chrome
 *              (barra, columna de carpetas, lista, panel de lectura, dos
 *              ventanas flotantes).
 *   NO TIENE   ni un solo mensaje como DATO: `CORREO_ABIERTO` es una constante
 *              y el panel de lectura la pinta siempre, pulses la fila que
 *              pulses (las tres filas de `RECIBIDOS` llaman a `tocarZona`, no
 *              seleccionan nada).
 *   NO TIENE   carpetas: las cuatro están `disabled` y «Enviados» es un
 *              `useState<number>` que pasa de 0 a 1. Ningún mensaje se mueve.
 *   NO TIENE   responder, responder a todos, reenviar, marcar ni borrar.
 *   NO TIENE   «no deseado».
 *   NO TIENE   remitente que mienta ni enlaces con destino.
 *
 * Quien SÍ modeló la mentira fue `LabAtrapaElPhishing.tsx`, con `deNombre` /
 * `deDireccion` y `Enlace { texto, destino }` — en constantes propias, sin
 * compartir con nadie. Ese vocabulario es el que se sube aquí, y por eso
 * `RemitenteCorreo` no es un `string`.
 *
 * ── Las cuatro decisiones de datos ──────────────────────────────────────────
 *
 * 1. **Un remitente son DOS campos.** `nombre` lo escribe quien manda —pone lo
 *    que quiere— y `direccion` es la de verdad. Si el remitente fuera una
 *    cadena, la mitad de las clases de este armazón (phishing, suplantación,
 *    malware) no tendrían nada que enseñar: la mentira no cabría en el dato.
 *    Lo mismo con `EnlaceCorreo`: `texto` es lo que se lee, `destino` a dónde
 *    va. El engaño vive en la DISTANCIA entre los dos campos.
 *
 * 2. **El armazón no corrige.** No existe `esPhishing()`. `enlaceEnganoso` no
 *    dice «esto es una estafa»: dice el HECHO de que el texto del enlace
 *    aparenta un dominio y el destino es otro. Igual `adjuntoPeligroso`, que
 *    sólo mira el tipo de archivo, como haría el propio sistema. Quién muerde
 *    y por qué lo decide la clase.
 *
 * 3. **Borrar no borra** (misma regla que `tiposMuro.ts`): borrar mueve a la
 *    papelera. Ningún mensaje se quita nunca del arreglo, y desde la papelera
 *    volver a borrar no destruye — devuelve `'ya-en-papelera'`.
 *
 * 4. **Responder y reenviar son funciones puras que arman un borrador**, no
 *    efectos. La diferencia entre las dos está en los datos y es la clase
 *    entera: responder rellena el destinatario y NO se lleva los adjuntos;
 *    reenviar deja el destinatario VACÍO y sí se los lleva.
 *
 * `extensionDe` se importa de `simuladores/sistema/tiposSistema` —la misma que
 * usa el explorador y `tiposNube.ts`—; no se reescribe aquí.
 */

import { extensionDe } from '../sistema/tiposSistema';

/* ── carpetas ───────────────────────────────────────────────────────────── */

/** Las cinco del encargo, ni una más. */
export type CarpetaCorreo = 'recibidos' | 'enviados' | 'borradores' | 'papelera' | 'no-deseado';

export const CARPETAS: readonly CarpetaCorreo[] = [
  'recibidos',
  'enviados',
  'borradores',
  'papelera',
  'no-deseado',
] as const;

export const ETIQUETA_CARPETA: Record<CarpetaCorreo, { icono: string; etiqueta: string }> = {
  recibidos: { icono: '📥', etiqueta: 'Recibidos' },
  enviados: { icono: '📤', etiqueta: 'Enviados' },
  borradores: { icono: '📝', etiqueta: 'Borradores' },
  papelera: { icono: '🗑️', etiqueta: 'Papelera' },
  'no-deseado': { icono: '⚠️', etiqueta: 'Correo no deseado' },
};

/* ── el remitente que puede mentir ──────────────────────────────────────── */

/**
 * Decisión 1. Quien manda un correo escribe el `nombre` que quiere: es un
 * campo libre. La `direccion` es la que de verdad viaja. Que no concuerden no
 * es un error del dato: es el material de clase.
 */
export interface RemitenteCorreo {
  nombre: string;
  direccion: string;
}

/** Lo que va después de la arroba. `''` si no hay arroba. */
export function dominioDe(direccion: string): string {
  const i = direccion.lastIndexOf('@');
  if (i < 0) return '';
  return direccion.slice(i + 1).toLowerCase().trim();
}

/** Lo que va antes de la arroba. La dirección entera si no hay arroba. */
export function usuarioDe(direccion: string): string {
  const i = direccion.lastIndexOf('@');
  if (i < 0) return direccion.trim();
  return direccion.slice(0, i).trim();
}

export function mismoDominio(a: string, b: string): boolean {
  const da = dominioDe(a);
  return da !== '' && da === dominioDe(b);
}

/* ── direcciones rotas ──────────────────────────────────────────────────── */

export type MotivoDireccionRota =
  | 'vacia'
  | 'espacio'
  | 'sin-arroba'
  | 'dos-arrobas'
  | 'acento'
  | 'sin-usuario'
  | 'sin-servidor';

export type ResultadoDireccion =
  | { ok: true }
  | { ok: false; motivo: MotivoDireccionRota; aviso: string };

const ACENTOS = /[áéíóúàèìòùäëïöüâêîôûñçÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇ]/;

/**
 * Las seis maneras de romper una dirección que se enseñan en clase. El orden
 * importa: `maestra lucia@escuela.mx` tiene un espacio Y está bien por lo
 * demás, así que el espacio se mira antes que la arroba.
 */
export function revisarDireccion(direccion: string): ResultadoDireccion {
  const bruto = direccion.trim();
  if (bruto === '') {
    return { ok: false, motivo: 'vacia', aviso: 'No hay ninguna dirección escrita.' };
  }
  if (/\s/.test(bruto)) {
    return { ok: false, motivo: 'espacio', aviso: 'Una dirección de correo no lleva espacios nunca.' };
  }
  const arrobas = bruto.split('@').length - 1;
  if (arrobas === 0) {
    return { ok: false, motivo: 'sin-arroba', aviso: 'Le falta la arroba, que separa el usuario del servidor.' };
  }
  if (arrobas > 1) {
    return { ok: false, motivo: 'dos-arrobas', aviso: 'La arroba va una sola vez, siempre.' };
  }
  if (ACENTOS.test(bruto)) {
    return { ok: false, motivo: 'acento', aviso: 'Las direcciones no llevan acentos ni eñes.' };
  }
  if (usuarioDe(bruto) === '') {
    return { ok: false, motivo: 'sin-usuario', aviso: 'Le falta el usuario: lo que va antes de la arroba.' };
  }
  if (dominioDe(bruto) === '') {
    return { ok: false, motivo: 'sin-servidor', aviso: 'Le falta el servidor: lo que va después de la arroba.' };
  }
  return { ok: true };
}

/* ── enlaces: lo que se lee y a dónde va ────────────────────────────────── */

/** Decisión 1, otra vez: `texto` es lo que se lee, `destino` a dónde va. */
export interface EnlaceCorreo {
  texto: string;
  destino: string;
}

/** El anfitrión de una dirección web, sin protocolo, sin ruta y sin `www.`. */
export function anfitrionDe(url: string): string {
  const sinProtocolo = url.trim().replace(/^[a-z]+:\/\//i, '');
  const sinRuta = sinProtocolo.split(/[/?#]/)[0] ?? '';
  return sinRuta.toLowerCase().replace(/^www\./, '');
}

/**
 * Decisión 2: esto es un HECHO, no un veredicto. Devuelve `true` sólo cuando
 * el texto del enlace APARENTA ser una dirección web (lleva un punto y no
 * lleva espacios) y su anfitrión no es el del destino. Un enlace cuyo texto
 * es «pulsa aquí» devuelve `false`: no miente, simplemente no dice nada — y
 * distinguir esas dos cosas es media clase de phishing.
 */
export function enlaceEnganoso(enlace: EnlaceCorreo): boolean {
  const texto = enlace.texto.trim();
  if (texto === '' || /\s/.test(texto)) return false;
  const aparenta = anfitrionDe(texto);
  if (!aparenta.includes('.')) return false;
  return aparenta !== anfitrionDe(enlace.destino);
}

/* ── adjuntos ───────────────────────────────────────────────────────────── */

export type TipoAdjunto =
  | 'documento'
  | 'imagen'
  | 'video'
  | 'audio'
  | 'comprimido'
  | 'programa'
  | 'guion'
  | 'desconocido';

const TIPO_POR_EXTENSION: Readonly<Record<string, TipoAdjunto>> = {
  pdf: 'documento',
  docx: 'documento',
  doc: 'documento',
  txt: 'documento',
  xlsx: 'documento',
  pptx: 'documento',
  jpg: 'imagen',
  jpeg: 'imagen',
  png: 'imagen',
  gif: 'imagen',
  webp: 'imagen',
  mp4: 'video',
  mov: 'video',
  mp3: 'audio',
  wav: 'audio',
  zip: 'comprimido',
  rar: 'comprimido',
  exe: 'programa',
  msi: 'programa',
  apk: 'programa',
  scr: 'programa',
  bat: 'guion',
  cmd: 'guion',
  vbs: 'guion',
  js: 'guion',
};

/**
 * El tipo se deriva de la ÚLTIMA extensión, que es la que manda: por eso
 * `foto-de-la-fiesta.jpg.exe` da `'programa'`. La doble extensión no es un
 * caso especial que haya que programar aparte — es lo que sale solo de leer
 * bien el nombre, y es justo la trampa que se enseña.
 */
export function tipoDeAdjunto(nombre: string): TipoAdjunto {
  const ext = extensionDe(nombre);
  if (ext === '') return 'desconocido';
  return TIPO_POR_EXTENSION[ext] ?? 'desconocido';
}

export interface AdjuntoCorreo {
  id: string;
  nombre: string;
  /** Kilobytes. La ventana los pinta con `pesoLegible`. */
  kb: number;
}

/**
 * Decisión 2: mira el TIPO de archivo, como haría el propio sistema al
 * avisar «esto es un programa». No dice que el correo sea una estafa.
 */
export function adjuntoPeligroso(adjunto: AdjuntoCorreo): boolean {
  const tipo = tipoDeAdjunto(adjunto.nombre);
  return tipo === 'programa' || tipo === 'guion';
}

export function pesoLegible(kb: number): string {
  if (kb < 1) return `${Math.round(kb * 1024)} B`;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* ── el mensaje ─────────────────────────────────────────────────────────── */

export interface MensajeCorreo {
  id: string;
  de: RemitenteCorreo;
  para: RemitenteCorreo[];
  cc: RemitenteCorreo[];
  asunto: string;
  /** Párrafos. Nunca HTML: un texto de aquí no puede inyectar etiquetas. */
  cuerpo: string[];
  /** Etiqueta ya formateada («7:42», «Ayer»): el armazón no calcula tiempo. */
  fecha: string;
  adjuntos: AdjuntoCorreo[];
  enlaces: EnlaceCorreo[];
  carpeta: CarpetaCorreo;
  leido: boolean;
  marcado: boolean;
  /** El id del mensaje al que responde o del que se reenvió, si hubo uno. */
  responde?: string;
}

export interface ConteoCarpeta {
  total: number;
  sinLeer: number;
}

export function mensajesEn(mensajes: MensajeCorreo[], carpeta: CarpetaCorreo): MensajeCorreo[] {
  return mensajes.filter((m) => m.carpeta === carpeta);
}

export function contarCarpetas(mensajes: MensajeCorreo[]): Record<CarpetaCorreo, ConteoCarpeta> {
  const cuenta = {
    recibidos: { total: 0, sinLeer: 0 },
    enviados: { total: 0, sinLeer: 0 },
    borradores: { total: 0, sinLeer: 0 },
    papelera: { total: 0, sinLeer: 0 },
    'no-deseado': { total: 0, sinLeer: 0 },
  } satisfies Record<CarpetaCorreo, ConteoCarpeta>;
  for (const m of mensajes) {
    const c = cuenta[m.carpeta];
    c.total += 1;
    if (!m.leido) c.sinLeer += 1;
  }
  return cuenta;
}

/* ── operaciones puras sobre UN mensaje (identidad si no hay cambio) ────── */

export function marcarLeido(mensaje: MensajeCorreo, leido = true): MensajeCorreo {
  if (mensaje.leido === leido) return mensaje; // no-op: identidad
  return { ...mensaje, leido };
}

export function alternarMarca(mensaje: MensajeCorreo): MensajeCorreo {
  return { ...mensaje, marcado: !mensaje.marcado };
}

export function moverA(mensaje: MensajeCorreo, carpeta: CarpetaCorreo): MensajeCorreo {
  if (mensaje.carpeta === carpeta) return mensaje; // no-op: identidad
  return { ...mensaje, carpeta };
}

/* ── el borrador ────────────────────────────────────────────────────────── */

export type OrigenBorrador = 'nuevo' | 'respuesta' | 'respuesta-a-todos' | 'reenvio';

export interface BorradorCorreo {
  origen: OrigenBorrador;
  /** De qué mensaje salió, si salió de alguno. */
  responde?: string;
  para: RemitenteCorreo[];
  cc: RemitenteCorreo[];
  asunto: string;
  cuerpo: string[];
  adjuntos: AdjuntoCorreo[];
}

export function borradorVacio(): BorradorCorreo {
  return { origen: 'nuevo', para: [], cc: [], asunto: '', cuerpo: [''], adjuntos: [] };
}

/** «Re: Re: Re:» no: el prefijo se pone una sola vez. */
function conPrefijo(asunto: string, prefijo: string): string {
  const limpio = asunto.trim();
  if (limpio.toLowerCase().startsWith(prefijo.toLowerCase())) return limpio;
  return `${prefijo} ${limpio}`;
}

/** La cita del mensaje original, en párrafos. Es lo que el correo de verdad
 *  arrastra debajo de la respuesta. */
function citar(mensaje: MensajeCorreo): string[] {
  return [
    '',
    `El ${mensaje.fecha}, ${mensaje.de.nombre} <${mensaje.de.direccion}> escribió:`,
    ...mensaje.cuerpo.map((p) => `> ${p}`),
  ];
}

function sinRepetidos(gente: RemitenteCorreo[]): RemitenteCorreo[] {
  const vistos = new Set<string>();
  return gente.filter((p) => {
    const clave = p.direccion.toLowerCase();
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

/**
 * Decisión 4. Responder rellena el destinatario con quien escribió; responder
 * a todos añade en CC a los demás destinatarios MENOS a uno mismo (si te
 * autoincluyes, te llega tu propia respuesta: es el error clásico y aquí no
 * puede pasar). Los adjuntos NO viajan: quien te escribió ya los tiene.
 */
export function borradorDeRespuesta(
  mensaje: MensajeCorreo,
  yo: RemitenteCorreo,
  opciones?: { aTodos?: boolean },
): BorradorCorreo {
  const aTodos = opciones?.aTodos ?? false;
  const yoClave = yo.direccion.toLowerCase();
  const otros = [...mensaje.para, ...mensaje.cc].filter(
    (p) => p.direccion.toLowerCase() !== yoClave && p.direccion.toLowerCase() !== mensaje.de.direccion.toLowerCase(),
  );
  return {
    origen: aTodos ? 'respuesta-a-todos' : 'respuesta',
    responde: mensaje.id,
    para: [mensaje.de],
    cc: aTodos ? sinRepetidos(otros) : [],
    asunto: conPrefijo(mensaje.asunto, 'Re:'),
    cuerpo: citar(mensaje),
    adjuntos: [],
  };
}

/**
 * Decisión 4. Reenviar deja `para` VACÍO —nadie sabe a quién se lo mandas— y
 * SÍ se lleva los adjuntos, que es la única razón por la que se reenvía la
 * mitad de las veces. Esos dos detalles son la diferencia entre responder y
 * reenviar, y por eso viven en los datos y no en un botón.
 */
export function borradorDeReenvio(mensaje: MensajeCorreo): BorradorCorreo {
  return {
    origen: 'reenvio',
    responde: mensaje.id,
    para: [],
    cc: [],
    asunto: conPrefijo(mensaje.asunto, 'Rv:'),
    cuerpo: citar(mensaje),
    adjuntos: [...mensaje.adjuntos],
  };
}
