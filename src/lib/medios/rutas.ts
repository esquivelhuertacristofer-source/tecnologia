/**
 * Piezas puras de la ruta de medios (`src/app/assets/[...ruta]/route.ts`).
 *
 * Viven aquí y no en el propio `route.ts` por una regla de Next: un archivo de
 * ruta **sólo puede exportar** los manejadores (GET, POST…) y un puñado de
 * constantes conocidas. Cualquier otro `export` —aunque sea una función pura de
 * tres líneas— rompe el `next build` con un error de tipos que no aparece en
 * `tsc --noEmit`, porque lo genera el propio Next al construir. Separarlas
 * además las deja donde se pueden probar.
 */

const TIPOS: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  json: 'application/json',
  html: 'text/html; charset=utf-8',
};

export function tipoDeContenido(ruta: string): string {
  const ext = ruta.split('.').pop()?.toLowerCase() ?? '';
  return TIPOS[ext] ?? 'application/octet-stream';
}

/**
 * Comprueba que los trozos de la URL no se salgan de la carpeta.
 *
 * En R2 no hay traversal que valga —las claves son cadenas planas, `..` no sube
 * a ningún sitio—, pero un `..` sí importa en el respaldo de disco de
 * desarrollo, y ahí se comprueba dos veces: aquí y con `resolve()` contra la
 * carpeta base. Una barra dentro de un segmento no puede llegar (Next parte la
 * ruta por ellas), y se rechaza igual por si algún día llega decodificada.
 */
export function rutaSegura(trozos: string[]): string | null {
  if (trozos.length === 0) return null;
  for (const t of trozos) {
    if (!t || t === '.' || t === '..' || t.includes('/')) return null;
  }
  return trozos.join('/');
}
