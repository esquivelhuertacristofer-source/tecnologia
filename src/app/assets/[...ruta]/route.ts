/**
 * Los videos, servidos desde R2 (3-sep-2026).
 *
 * En Cloudflare, `public/` se sube como Workers Assets y ahí el límite es **25
 * MiB por archivo**: 30 de los 238 videos de la plataforma lo pasan (el mayor,
 * 49,9 MB), así que el despliegue entero fallaría por ellos. Los videos —y sólo
 * los videos— viven en un bucket de R2; las 762 imágenes se quedan en Assets,
 * porque `next/image` las lee por el binding ASSETS y una imagen en R2 sería
 * una imagen que el optimizador no encuentra.
 *
 * Esta ruta es el puente, y funciona por una propiedad del binding de Assets:
 * **lo que existe lo sirve Assets sin despertar al Worker; lo que no existe cae
 * aquí**. Como el guion `scripts/cloudflare/medios.mjs` aparta los `.mp4` antes
 * de construir, las peticiones de video son justo las que no encuentran archivo
 * y llegan a este manejador. Ninguna URL cambia: los 89 componentes que
 * escriben `/assets/actividades/<id>/video-explicativo.mp4` siguen igual.
 *
 * En desarrollo no hay R2, así que lee del disco. Eso también cubre el caso de
 * que algún día el servidor de Next sirva `public/` DESPUÉS de las rutas: la
 * pantalla nunca se queda sin su video por un cambio de precedencia.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { rutaSegura, tipoDeContenido } from '@/lib/medios/rutas';

export const dynamic = 'force-dynamic';

/** Lo que usamos de un bucket de R2, sin arrastrar `@cloudflare/workers-types`. */
interface ObjetoR2 {
  body: ReadableStream | null;
  size: number;
  httpEtag: string;
  range?: { offset?: number; length?: number };
  writeHttpMetadata?: (headers: Headers) => void;
}
interface CubetaR2 {
  get(clave: string, opciones?: { range?: Headers }): Promise<ObjetoR2 | null>;
}

function cabeceras(objeto: ObjetoR2, ruta: string): Headers {
  const h = new Headers();
  objeto.writeHttpMetadata?.(h);
  h.set('Content-Type', tipoDeContenido(ruta));
  h.set('ETag', objeto.httpEtag);
  h.set('Accept-Ranges', 'bytes');
  // El nombre del archivo lleva dentro el id de la actividad y su contenido no
  // cambia sin cambiar de actividad, así que se puede guardar para siempre.
  h.set('Cache-Control', 'public, max-age=31536000, immutable');
  return h;
}

async function desdeElDisco(ruta: string, pedirRango: string | null): Promise<Response> {
  // Sólo ocurre en desarrollo: en el Worker no hay sistema de archivos.
  const { readFile, stat } = await import('node:fs/promises');
  const { join, resolve, sep } = await import('node:path');
  const base = resolve(process.cwd(), 'public', 'assets');
  const archivo = resolve(join(base, ruta));
  if (!archivo.startsWith(base + sep)) return new Response('Ruta inválida', { status: 400 });
  try {
    const info = await stat(archivo);
    const datos = await readFile(archivo);
    const h = new Headers({
      'Content-Type': tipoDeContenido(ruta),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });
    const m = /^bytes=(\d*)-(\d*)$/.exec(pedirRango ?? '');
    if (m) {
      const inicio = m[1] ? Number(m[1]) : 0;
      const fin = m[2] ? Number(m[2]) : info.size - 1;
      h.set('Content-Range', `bytes ${inicio}-${fin}/${info.size}`);
      h.set('Content-Length', String(fin - inicio + 1));
      return new Response(new Uint8Array(datos.subarray(inicio, fin + 1)), { status: 206, headers: h });
    }
    h.set('Content-Length', String(info.size));
    return new Response(new Uint8Array(datos), { headers: h });
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
}

export async function GET(peticion: Request, ctx: { params: Promise<{ ruta: string[] }> }) {
  const { ruta: trozos } = await ctx.params;
  const ruta = rutaSegura(trozos);
  if (!ruta) return new Response('Ruta inválida', { status: 400 });

  let cubeta: CubetaR2 | undefined;
  try {
    cubeta = (getCloudflareContext().env as unknown as { MEDIOS?: CubetaR2 }).MEDIOS;
  } catch {
    // Fuera de un Worker (desarrollo, pruebas) no hay contexto de Cloudflare.
  }
  if (!cubeta) return desdeElDisco(ruta, peticion.headers.get('range'));

  const pedirRango = peticion.headers.get('range');
  const objeto = await cubeta.get(`assets/${ruta}`, pedirRango ? { range: peticion.headers } : undefined);
  if (!objeto || !objeto.body) return new Response('No encontrado', { status: 404 });

  const h = cabeceras(objeto, ruta);
  if (pedirRango && objeto.range) {
    const inicio = objeto.range.offset ?? 0;
    const largo = objeto.range.length ?? objeto.size - inicio;
    h.set('Content-Range', `bytes ${inicio}-${inicio + largo - 1}/${objeto.size}`);
    h.set('Content-Length', String(largo));
    return new Response(objeto.body, { status: 206, headers: h });
  }
  h.set('Content-Length', String(objeto.size));
  return new Response(objeto.body, { headers: h });
}

export async function HEAD(peticion: Request, ctx: { params: Promise<{ ruta: string[] }> }) {
  const respuesta = await GET(peticion, ctx);
  return new Response(null, { status: respuesta.status, headers: respuesta.headers });
}
