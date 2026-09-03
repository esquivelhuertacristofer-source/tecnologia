/**
 * TECNIA NUBE · los datos, sin React.
 *
 * El armazón «Tecnia Nube» (CANON-ARMAZONES.md, «10 · Tecnia Nube — 5
 * actividades»): el servicio de almacenamiento y trabajo en la nube de
 * Tecnia. No es OneDrive ni Drive ni Dropbox — ningún logotipo real—, es la
 * nube propia de la plataforma.
 *
 * ── Qué se reutiliza de `simuladores/sistema/` y por qué ───────────────────
 *
 * El encargo lo dice explícito: «una nube es, en su base, el mismo árbol; lo
 * que cambia es quién más lo ve y qué pasa cuando no hay internet». Por eso
 * `ArchivoNube` NO reinventa nombre/tamaño/fecha: envuelve un `ArchivoSO` de
 * verdad (`simuladores/sistema/tiposSistema.ts`), el mismo tipo que ya usa el
 * explorador de 6 actividades. `nombreValido`, `extensionDe`, `programaDe` y
 * `tamanoDe` se importan tal cual — no se copian ni se reescriben.
 *
 * Lo que este archivo SÍ añade es lo que el explorador no tiene y ninguna de
 * las cinco filas de Tecnia Nube puede enseñar sin ello: el estado de
 * sincronización, con quién se comparte y con qué permiso, el enlace
 * público, la coautoría con su historial de versiones, el conflicto entre
 * dos versiones divergentes, y qué pasa cuando no hay internet. Ninguna
 * carpeta anidada: de las 5 filas ninguna pide navegar subcarpetas, así que
 * `ArchivoNube` es una lista plana — forzar un árbol completo aquí habría
 * sido la abstracción que el encargo pide evitar.
 *
 * No es un motor de plantillas: no sabe qué es un acierto, no pinta
 * preguntas, no corrige nada. La actividad decide qué guion monta encima.
 *
 * ── Las cuatro decisiones de datos ──────────────────────────────────────────
 *
 * 1. **El conflicto existe de verdad.** `guardarCambios` recibe
 *    `basadaEnVersionId`: la versión sobre la que el autor empezó a editar.
 *    Si para cuando guarda ya no coincide con `versionActualId` —alguien más
 *    guardó primero—, NO se sobrescribe nada: el archivo pasa a
 *    `estado: 'conflicto'` con las dos versiones completas, cada una con su
 *    autor y su hora, y sólo `resolverConflicto` (una decisión explícita)
 *    lo destraba. El armazón nunca elige solo.
 *
 * 2. **Revocar un enlace no borra que alguien ya entró.** `EnlacePublico`
 *    guarda `abiertoPor` aparte de `activo`; `revocarEnlace` apaga `activo`
 *    pero JAMÁS toca `abiertoPor` — el mismo principio que «borrar no borra»
 *    en `tiposMuro.ts`, aplicado a quien ya vio el archivo por el enlace.
 *
 * 3. **Datos inmutables, identidad cuando no hay cambio.** Cada operación
 *    devuelve un `ArchivoNube` nuevo sólo si algo cambió de verdad; un
 *    no-operación (compartir el mismo permiso otra vez, revocar un enlace ya
 *    revocado, restaurar la versión que ya se está viendo) devuelve el MISMO
 *    objeto por identidad — se comprueba con `toBe`, no con `toEqual`, igual
 *    que en `tiposSistema.ts` y `tiposMuro.ts`.
 *
 * 4. **El espacio contratado sólo cuenta lo que ya llegó a la nube.** Un
 *    archivo `'solo-local'` no ha subido nada todavía y no gasta cupo;
 *    `'solo-nube'`, `'subiendo'`, `'subido'` y `'conflicto'` sí. Es la regla
 *    que hace que «llenarse y seguir subiendo» sea una situación real y no
 *    un número decorativo.
 */

import { esCarpeta, tamanoDe, type ArchivoSO, type NodoSO } from '../sistema/tiposSistema';

/* ── el vocabulario de la sincronización ───────────────────────────────── */

/** El estado de un archivo respecto a la nube. Estos cinco, ni uno más: son
 *  los que pide el encargo. */
export type EstadoSync = 'subido' | 'subiendo' | 'solo-local' | 'solo-nube' | 'conflicto';

export type EstadoConexion = 'en-linea' | 'sin-conexion';

/* ── personas y permisos ───────────────────────────────────────────────── */

export interface PersonaNube {
  id: string;
  nombre: string;
  avatar?: string;
}

/** Puede ver / puede comentar / puede editar — las tres que pide el encargo. */
export type PermisoNube = 'ver' | 'comentar' | 'editar';

export interface AccesoNube {
  persona: PersonaNube;
  permiso: PermisoNube;
}

const ETIQUETA_PERMISO: Record<PermisoNube, string> = {
  ver: 'ver',
  comentar: 'comentar',
  editar: 'editar',
};

/** Distinto de compartir con una persona: cualquiera con el enlace entra,
 *  sin que el dueño sepa quién es hasta que abre. */
export interface EnlacePublico {
  activo: boolean;
  permiso: PermisoNube;
  /** Quien ya lo abrió. Revocar NUNCA vacía esta lista — decisión 2. */
  abiertoPor: PersonaNube[];
}

/* ── versiones e historial ─────────────────────────────────────────────── */

export interface VersionArchivo {
  id: string;
  autor: PersonaNube;
  /** Ya formateada para pintar, p. ej. "Hoy, 10:32" — el armazón no calcula tiempo. */
  fecha: string;
  resumen?: string;
}

export interface ConflictoArchivo {
  local: VersionArchivo;
  remota: VersionArchivo;
}

/* ── el archivo en la nube ─────────────────────────────────────────────── */

export interface ArchivoNube {
  /** El nodo real, reutilizado de `simuladores/sistema/` — decisión de cabecera. */
  nodo: ArchivoSO;
  estado: EstadoSync;
  propietario: PersonaNube;
  compartidoCon: AccesoNube[];
  enlace?: EnlacePublico;
  historial: VersionArchivo[];
  /** La versión que se ve ahora. `null` si nunca se ha guardado ninguna. */
  versionActualId: string | null;
  conflicto?: ConflictoArchivo;
  /** Quién lo tiene abierto para editar ahora mismo — la coautoría en vivo. */
  editandoAhora: PersonaNube[];
}

/* ── compartir con una persona ─────────────────────────────────────────── */

export type MotivoRechazoCompartir = 'uno-mismo' | 'sin-cambio';

export type ResultadoCompartir =
  | { ok: true; archivo: ArchivoNube; aviso: string }
  | { ok: false; motivo: MotivoRechazoCompartir; aviso: string; archivo: ArchivoNube };

/** Jugar MAL: compartir un archivo con uno mismo se rechaza — ya eres el
 *  dueño, no hace falta ni tiene sentido. */
export function compartirCon(archivo: ArchivoNube, persona: PersonaNube, permiso: PermisoNube): ResultadoCompartir {
  if (persona.id === archivo.propietario.id) {
    return {
      ok: false,
      motivo: 'uno-mismo',
      aviso: 'No puedes compartir un archivo contigo mismo: ya eres el dueño.',
      archivo,
    };
  }
  const existente = archivo.compartidoCon.find((a) => a.persona.id === persona.id);
  if (existente && existente.permiso === permiso) {
    return {
      ok: false,
      motivo: 'sin-cambio',
      aviso: `${persona.nombre} ya puede ${ETIQUETA_PERMISO[permiso]} este archivo.`,
      archivo,
    };
  }
  const compartidoCon = existente
    ? archivo.compartidoCon.map((a) => (a.persona.id === persona.id ? { ...a, permiso } : a))
    : [...archivo.compartidoCon, { persona, permiso }];
  return {
    ok: true,
    archivo: { ...archivo, compartidoCon },
    aviso: `${persona.nombre} ahora puede ${ETIQUETA_PERMISO[permiso]} este archivo.`,
  };
}

export interface ResultadoQuitarAcceso {
  archivo: ArchivoNube;
  aviso: string;
  /** `true` si a la persona se le quitó el acceso mientras lo tenía abierto
   *  para editar — jugar MAL: quitar el permiso a quien está dentro. */
  estabaEditando: boolean;
}

export function quitarAcceso(archivo: ArchivoNube, personaId: string): ResultadoQuitarAcceso {
  const acceso = archivo.compartidoCon.find((a) => a.persona.id === personaId);
  if (!acceso) {
    return { archivo, aviso: 'Esa persona no tenía acceso a este archivo.', estabaEditando: false };
  }
  const estabaEditando = archivo.editandoAhora.some((p) => p.id === personaId);
  const compartidoCon = archivo.compartidoCon.filter((a) => a.persona.id !== personaId);
  const editandoAhora = estabaEditando ? archivo.editandoAhora.filter((p) => p.id !== personaId) : archivo.editandoAhora;
  const aviso = estabaEditando
    ? `Se le quitó el acceso a ${acceso.persona.nombre} mientras seguía editando: lo que no había guardado se perdió.`
    : `Se le quitó el acceso a ${acceso.persona.nombre}.`;
  return { archivo: { ...archivo, compartidoCon, editandoAhora }, aviso, estabaEditando };
}

export function cambiarPermiso(archivo: ArchivoNube, personaId: string, permiso: PermisoNube): ArchivoNube {
  const acceso = archivo.compartidoCon.find((a) => a.persona.id === personaId);
  if (!acceso || acceso.permiso === permiso) return archivo;
  return {
    ...archivo,
    compartidoCon: archivo.compartidoCon.map((a) => (a.persona.id === personaId ? { ...a, permiso } : a)),
  };
}

/* ── el enlace público ──────────────────────────────────────────────────── */

export function generarEnlace(archivo: ArchivoNube, permiso: PermisoNube): ArchivoNube {
  if (archivo.enlace?.activo && archivo.enlace.permiso === permiso) return archivo; // no-op: identidad
  return { ...archivo, enlace: { activo: true, permiso, abiertoPor: archivo.enlace?.abiertoPor ?? [] } };
}

/** Decisión 2: `abiertoPor` NUNCA se toca aquí. */
export function revocarEnlace(archivo: ArchivoNube): ArchivoNube {
  if (!archivo.enlace || !archivo.enlace.activo) return archivo; // no-op: identidad
  return { ...archivo, enlace: { ...archivo.enlace, activo: false } };
}

export interface ResultadoAbrirEnlace {
  ok: boolean;
  archivo: ArchivoNube;
  aviso: string;
}

export function abrirEnlace(archivo: ArchivoNube, persona: PersonaNube): ResultadoAbrirEnlace {
  if (!archivo.enlace || !archivo.enlace.activo) {
    return { ok: false, archivo, aviso: 'Este enlace ya no funciona: el dueño lo revocó.' };
  }
  if (archivo.enlace.abiertoPor.some((p) => p.id === persona.id)) {
    return { ok: true, archivo, aviso: `${persona.nombre} ya había abierto este enlace antes.` }; // no-op: identidad
  }
  const enlace: EnlacePublico = { ...archivo.enlace, abiertoPor: [...archivo.enlace.abiertoPor, persona] };
  return { ok: true, archivo: { ...archivo, enlace }, aviso: `${persona.nombre} abrió el enlace.` };
}

/* ── coautoría en vivo ──────────────────────────────────────────────────── */

export function entrarAEditar(archivo: ArchivoNube, persona: PersonaNube): ArchivoNube {
  if (archivo.editandoAhora.some((p) => p.id === persona.id)) return archivo; // no-op: identidad
  return { ...archivo, editandoAhora: [...archivo.editandoAhora, persona] };
}

export function salirDeEditar(archivo: ArchivoNube, personaId: string): ArchivoNube {
  if (!archivo.editandoAhora.some((p) => p.id === personaId)) return archivo; // no-op: identidad
  return { ...archivo, editandoAhora: archivo.editandoAhora.filter((p) => p.id !== personaId) };
}

/* ── guardar cambios, y el conflicto ───────────────────────────────────── */

export interface NuevaVersion {
  id: string;
  autor: PersonaNube;
  fecha: string;
  resumen?: string;
  /** La versión sobre la que este autor empezó a editar — decisión 1. */
  basadaEnVersionId: string | null;
}

export type MotivoRechazoGuardar = 'ya-en-conflicto';

export type ResultadoGuardar =
  | { ok: true; archivo: ArchivoNube; aviso: string; conflicto: boolean }
  | { ok: false; motivo: MotivoRechazoGuardar; aviso: string; archivo: ArchivoNube };

/**
 * Jugar MAL: dos personas editan el mismo archivo a la vez. Si la segunda en
 * guardar arrancó de la misma versión que la primera —`basadaEnVersionId`
 * quedó desactualizado—, no se sobrescribe nada: nace un `conflicto` real,
 * con las dos versiones completas.
 */
export function guardarCambios(archivo: ArchivoNube, version: NuevaVersion, conexion: EstadoConexion): ResultadoGuardar {
  if (archivo.estado === 'conflicto') {
    return {
      ok: false,
      motivo: 'ya-en-conflicto',
      aviso: 'Este archivo tiene un conflicto sin resolver: resuélvelo antes de guardar más cambios.',
      archivo,
    };
  }

  if (version.basadaEnVersionId !== archivo.versionActualId) {
    const remota =
      archivo.historial.find((v) => v.id === archivo.versionActualId) ?? archivo.historial[archivo.historial.length - 1];
    if (remota) {
      const conConflicto: ArchivoNube = { ...archivo, estado: 'conflicto', conflicto: { local: version, remota } };
      return {
        ok: true,
        archivo: conConflicto,
        aviso: `Choque: ${version.autor.nombre} y ${remota.autor.nombre} editaron a la vez. Hay que decidir cuál se queda.`,
        conflicto: true,
      };
    }
  }

  const historial = [...archivo.historial, version];
  const estado: EstadoSync = conexion === 'sin-conexion' ? 'solo-local' : 'subido';
  const aviso =
    conexion === 'sin-conexion'
      ? `${version.autor.nombre} guardó sin conexión: se sincronizará al volver internet.`
      : `${version.autor.nombre} guardó una nueva versión.`;
  return { ok: true, archivo: { ...archivo, historial, versionActualId: version.id, estado }, aviso, conflicto: false };
}

export type EleccionConflicto = 'local' | 'remota' | 'conservar-ambas';

export type MotivoRechazoResolver = 'no-hay-conflicto';

export type ResultadoResolver =
  | { ok: true; archivo: ArchivoNube; aviso: string }
  | { ok: false; motivo: MotivoRechazoResolver; aviso: string; archivo: ArchivoNube };

/** Jugar MAL: resolver un conflicto que ya no existe (resolverlo dos veces)
 *  se rechaza en vez de hacer algo con datos que ya no están. */
export function resolverConflicto(archivo: ArchivoNube, eleccion: EleccionConflicto): ResultadoResolver {
  if (!archivo.conflicto) {
    return { ok: false, motivo: 'no-hay-conflicto', aviso: 'Este archivo no tiene ningún conflicto que resolver.', archivo };
  }
  const { local, remota } = archivo.conflicto;

  if (eleccion === 'conservar-ambas') {
    const historial = [...archivo.historial, remota, local];
    return {
      ok: true,
      archivo: { ...archivo, historial, versionActualId: local.id, estado: 'subido', conflicto: undefined },
      aviso: 'Se guardaron las dos versiones: ahora hay dos copias distintas para revisar.',
    };
  }

  const elegida = eleccion === 'local' ? local : remota;
  const historial = [...archivo.historial, elegida];
  return {
    ok: true,
    archivo: { ...archivo, historial, versionActualId: elegida.id, estado: 'subido', conflicto: undefined },
    aviso: `Se quedó la versión de ${elegida.autor.nombre}.`,
  };
}

export type MotivoRechazoRestaurar = 'no-existe';

export type ResultadoRestaurarNube =
  | { ok: true; archivo: ArchivoNube; aviso: string }
  | { ok: false; motivo: MotivoRechazoRestaurar; aviso: string; archivo: ArchivoNube };

/** Jugar MAL: restaurar una versión que ya no existe en el historial se
 *  rechaza — no hay a dónde volver. */
export function restaurarVersion(archivo: ArchivoNube, versionId: string): ResultadoRestaurarNube {
  const version = archivo.historial.find((v) => v.id === versionId);
  if (!version) {
    return { ok: false, motivo: 'no-existe', aviso: 'Esa versión ya no está en el historial.', archivo };
  }
  if (archivo.versionActualId === versionId) {
    return { ok: true, archivo, aviso: 'Ya estabas viendo esa versión.' }; // no-op: identidad
  }
  return {
    ok: true,
    archivo: { ...archivo, versionActualId: versionId },
    aviso: `Volviste a la versión de ${version.autor.nombre} (${version.fecha}).`,
  };
}

/* ── subir y la conexión ────────────────────────────────────────────────── */

export function iniciarSubida(archivo: ArchivoNube): ArchivoNube {
  if (archivo.estado === 'subiendo' || archivo.estado === 'subido') return archivo; // no-op: identidad
  return { ...archivo, estado: 'subiendo' };
}

export function completarSubida(archivo: ArchivoNube): ArchivoNube {
  if (archivo.estado !== 'subiendo') return archivo; // no-op: identidad
  return { ...archivo, estado: 'subido' };
}

/* ── el espacio contratado ──────────────────────────────────────────────── */

export interface EspacioNube {
  capacidad: number;
  usados: number;
  libres: number;
  /** 0–1. */
  porcentaje: number;
}

/** Sólo cuenta lo que ya llegó a la nube — decisión 4. */
export function calcularEspacioNube(archivos: readonly ArchivoNube[], capacidad: number): EspacioNube {
  const usados = archivos.filter((a) => a.estado !== 'solo-local').reduce((s, a) => s + tamanoDe(a.nodo), 0);
  const libres = Math.max(0, capacidad - usados);
  return { capacidad, usados, libres, porcentaje: capacidad > 0 ? Math.min(1, usados / capacidad) : 0 };
}

/** Jugar MAL: intentar subir cuando ya no cabe. */
export function espacioLlenoParaSubir(espacio: EspacioNube, tamanoNuevo: number): boolean {
  return espacio.usados + tamanoNuevo > espacio.capacidad;
}

/* ── un vistazo al nodo, reusando `sistema/` tal cual ──────────────────── */

/** Reexportado por conveniencia: una clase que ya trae `NodoSO` de otro lado
 *  (por ejemplo, de una `CarpetaSO` compartida con `useSistema`) puede
 *  comprobar aquí mismo si es un archivo antes de envolverlo en `ArchivoNube`. */
export { esCarpeta, tamanoDe };
export type { NodoSO };
