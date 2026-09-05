/**
 * Estudio de impacto — de qué tipo de equipo se conectó el alumno.
 *
 * Se guarda una ETIQUETA GRUESA («escritorio», «tablet», «movil»), no la
 * cadena de user-agent completa. La cadena completa, combinada con la hora y
 * la escuela, se acerca peligrosamente a una huella que identifica a una
 * persona, y estas tablas prometen no identificar a ningún menor.
 *
 * La excepción es `consentimientos` (§4), donde el encargo pide el user-agent
 * a propósito: ahí no es telemetría, es la prueba de quién aceptó qué y desde
 * dónde, y esa tabla sí va ligada a una cuenta.
 */

export type TipoDispositivo = 'escritorio' | 'tablet' | 'movil' | 'desconocido';

export function tipoDeDispositivo(ua?: string): TipoDispositivo {
  const s = (ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '').toLowerCase();
  if (!s) return 'desconocido';
  // El orden importa: un iPad moderno dice «macintosh» y muchas tablets
  // Android dicen «mobile» sólo cuando NO son tablets.
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(s)) return 'movil';
  if (/windows|macintosh|linux|cros/.test(s)) return 'escritorio';
  return 'desconocido';
}

/**
 * IP truncada — el último octeto a cero (§4). No se calcula en el navegador:
 * el cliente no conoce su IP pública, la pone el servidor. Esta función existe
 * para que el truncado sea UNA sola implementación, probada, y no dos
 * ligeramente distintas en el código y en el SQL.
 */
export function truncarIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const limpia = ip.trim();

  // IPv4: se pone a cero el último octeto → 187.190.44.0
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(limpia);
  if (v4) {
    const partes = [v4[1], v4[2], v4[3]].map(Number);
    if (partes.some((n) => n > 255) || Number(v4[4]) > 255) return null;
    return `${partes.join('.')}.0`;
  }

  // IPv6: se conservan los cuatro primeros grupos (/64 es la red doméstica
  // típica; el resto identifica al equipo concreto dentro de esa red).
  if (limpia.includes(':')) {
    const grupos = limpia.split(':').filter(Boolean);
    if (grupos.length === 0) return null;
    return `${grupos.slice(0, 4).join(':')}::`;
  }

  return null;
}
