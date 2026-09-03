/**
 * Los videos de Tecnia, fuera del Worker.
 *
 * `public/` pesa 5,09 GB. De eso, 238 videos son 4,46 GB —el mayor de 49,9
 * MB— y Workers Assets no los admite: el limite es **25 MiB por archivo** y 30
 * de ellos lo pasan. Ademas el adaptador de OpenNext copia `public/` entero
 * dentro de `.open-next/assets` antes de empaquetar, asi que sin esto el build
 * duplicaria 5 GB en un disco que hoy tiene 10 libres.
 *
 * Las imagenes NO se tocan: 762 PNG de menos de 25 MiB caben en Workers Assets
 * y tienen que seguir ahi para que `next/image` funcione (el optimizador de
 * OpenNext lee las imagenes locales por el binding ASSETS; una imagen en R2
 * seria una imagen que next/image no encuentra).
 *
 * Los videos viven en R2 y los sirve `src/app/assets/[...ruta]/route.ts`
 * cuando el binding de Assets no encuentra el archivo. Ordenes:
 *
 *   apartar   mueve los .mp4 de `public/assets` a `.medios/assets`, misma
 *             estructura de carpetas (renombrar, instantaneo). ANTES de construir.
 *   devolver  los deja como estaban. DESPUES, pase lo que pase.
 *   subir     sube los .mp4 al bucket de R2, saltandose lo que ya esta (lleva
 *             su propia lista, se puede cortar y reanudar).
 *   estado    donde estan los videos ahora mismo y cuanto pesan.
 *
 * En desarrollo no cambia nada: `next dev` sigue sirviendo `public/assets`.
 */
import fs from 'node:fs';
import { firma, codificaRuta, listar as listarBucket } from './s3.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EN_PUBLIC = path.join(RAIZ, 'public', 'assets');
const APARTADO = path.join(RAIZ, '.medios', 'assets');
const LISTA_SUBIDOS = path.join(RAIZ, '.medios', 'subidos.txt');
const BUCKET = process.env.R2_BUCKET_MEDIOS || 'tecnia-medios';
const CONCURRENCIA = Number(process.env.R2_CONCURRENCIA || 4);

const MB = 1024 * 1024;

function pesoDe(dir) {
  let bytes = 0;
  let archivos = 0;
  const pila = [dir];
  while (pila.length) {
    const d = pila.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) pila.push(p);
      else { bytes += fs.statSync(p).size; archivos += 1; }
    }
  }
  return { bytes, archivos };
}

function listar(dir, base = dir) {
  const fuera = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuera.push(...listar(p, base));
    else fuera.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return fuera;
}

const ES_VIDEO = /\.(mp4|webm|mov)$/i;

/** Todos los videos bajo un directorio, como rutas relativas a el. */
function videosDe(dir) {
  return fs.existsSync(dir) ? listar(dir).filter((r) => ES_VIDEO.test(r)) : [];
}

function mover(desde, hasta, rutas) {
  for (const rel of rutas) {
    const origen = path.join(desde, rel);
    const destino = path.join(hasta, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.renameSync(origen, destino);
  }
  return rutas.length;
}

function apartar() {
  const rutas = videosDe(EN_PUBLIC);
  if (rutas.length === 0) {
    console.log(`no queda ningun video en public/assets (${videosDe(APARTADO).length} ya apartados)`);
    return;
  }
  const n = mover(EN_PUBLIC, APARTADO, rutas);
  console.log(`${n} videos apartados en .medios/assets (el build no los vera)`);
}

function devolver() {
  const rutas = videosDe(APARTADO);
  if (rutas.length === 0) {
    console.log('no hay videos apartados: ya estan en su sitio');
    return;
  }
  const n = mover(APARTADO, EN_PUBLIC, rutas);
  console.log(`${n} videos devueltos a public/assets`);
}

function estado() {
  for (const [nombre, dir] of [['public/assets', EN_PUBLIC], ['.medios/assets', APARTADO]]) {
    if (!fs.existsSync(dir)) { console.log(`${nombre.padEnd(16)} —`); continue; }
    const { bytes, archivos } = pesoDe(dir);
    const videos = videosDe(dir).length;
    console.log(`${nombre.padEnd(16)} ${archivos} archivos (${videos} videos) · ${(bytes / MB / 1024).toFixed(2)} GB`);
  }
  const subidos = fs.existsSync(LISTA_SUBIDOS)
    ? fs.readFileSync(LISTA_SUBIDOS, 'utf-8').split('\n').filter(Boolean).length
    : 0;
  console.log(`subidos a R2      ${subidos} (bucket ${BUCKET})`);
}

/*
 * Las credenciales de R2. Se leen del entorno o de `.medios/credenciales.env`,
 * que no está en git.
 *
 * NO van en `.env.local`: wrangler v4 carga los ficheros `.env` por su cuenta,
 * así que un `CLOUDFLARE_API_TOKEN` ahí dentro le pisa la sesión de OAuth y
 * `wrangler deploy` empieza a hablar con la cuenta equivocada. Costó un rato
 * entender por qué wrangler decía «incorrect permissions» de repente.
 */
function credenciales() {
  const leidas = { ...process.env };
  const fichero = path.join(RAIZ, '.medios', 'credenciales.env');
  if (fs.existsSync(fichero)) {
    for (const linea of fs.readFileSync(fichero, 'utf-8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/.exec(linea);
      if (m && !leidas[m[1]]) leidas[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const cuenta = leidas.CLOUDFLARE_ACCOUNT_ID;
  const claveAcceso = leidas.R2_ACCESS_KEY_ID;
  const secreto = leidas.R2_SECRET_ACCESS_KEY;
  if (!cuenta || !claveAcceso || !secreto) {
    throw new Error('faltan CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID y/o '
      + 'R2_SECRET_ACCESS_KEY (en el entorno o en .medios/credenciales.env)');
  }
  return { host: `${cuenta}.r2.cloudflarestorage.com`, bucket: BUCKET, claveAcceso, secreto };
}

/*
 * La clave en R2 conserva la ruta pública: `assets/actividades/…`, así que la
 * ruta de medios traduce URL → objeto sin ninguna tabla de por medio.
 */
const claveDe = (rel) => 'assets/' + rel.split(path.sep).join('/');

const TIPOS = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

function videosPorSubir() {
  // Los videos pueden estar en cualquiera de los dos sitios según si hay un
  // build a medias; se suben desde donde estén.
  const desde = [EN_PUBLIC, APARTADO].filter((d) => fs.existsSync(d));
  if (desde.length === 0) throw new Error('no encuentro los medios');
  return desde.flatMap((d) => videosDe(d).map((r) => [d, r]));
}

async function subir() {
  const cred = credenciales();
  const todos = videosPorSubir();
  fs.mkdirSync(path.dirname(LISTA_SUBIDOS), { recursive: true });
  const yaEstan = new Set(
    fs.existsSync(LISTA_SUBIDOS) ? fs.readFileSync(LISTA_SUBIDOS, 'utf-8').split('\n').filter(Boolean) : [],
  );
  const faltan = todos.filter(([, r]) => !yaEstan.has(claveDe(r)));
  const peso = faltan.reduce((n, [d, r]) => n + fs.statSync(path.join(d, r)).size, 0);
  console.log(`${todos.length} archivos · ${yaEstan.size} ya subidos · ${faltan.length} por subir (${(peso / MB / 1024).toFixed(2)} GB)`);

  let hechos = 0;
  let fallos = 0;
  let bytes = 0;
  const arranque = Date.now();
  const cola = [...faltan];
  const obrero = async () => {
    for (;;) {
      const siguiente = cola.shift();
      if (!siguiente) return;
      const [dir, rel] = siguiente;
      const cuerpo = fs.readFileSync(path.join(dir, rel));
      const clave = claveDe(rel);
      const tipo = TIPOS[path.extname(rel).toLowerCase()] || 'application/octet-stream';
      const ruta = `/${cred.bucket}/${codificaRuta(clave)}`;
      let error = null;
      // Dos reintentos: 4,5 GB por una línea doméstica se topan con cortes
      // sueltos, y volver a empezar los 238 por culpa de uno sería absurdo.
      for (let intento = 1; intento <= 3; intento += 1) {
        try {
          const cabeceras = firma({
            metodo: 'PUT', host: cred.host, ruta, cuerpo, tipo,
            claveAcceso: cred.claveAcceso, secreto: cred.secreto,
          });
          const r = await fetch(`https://${cred.host}${ruta}`, { method: 'PUT', headers: cabeceras, body: cuerpo });
          if (r.ok) { error = null; break; }
          error = `HTTP ${r.status} ${(await r.text()).slice(0, 160)}`;
        } catch (e) {
          error = e.message;
        }
        await new Promise((res) => setTimeout(res, 2000 * intento));
      }
      if (error) {
        fallos += 1;
        console.error(`  x ${rel}: ${error}`);
      } else {
        fs.appendFileSync(LISTA_SUBIDOS, clave + '\n');
        hechos += 1;
        bytes += cuerpo.length;
      }
      if ((hechos + fallos) % 20 === 0) {
        const min = (Date.now() - arranque) / 60000;
        console.log(`  ${hechos + fallos}/${faltan.length} · ${(bytes / MB).toFixed(0)} MB · ${(bytes / MB / min).toFixed(1)} MB/min · ${fallos} fallos`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCIA }, obrero));
  console.log(`subidos ${hechos}, fallos ${fallos}`);
  await verificar();
  if (fallos) process.exitCode = 1;
}

/*
 * La comprobación que faltaba, y que costó una limpieza entera en falso:
 * borrar —o subir— una clave que no existe NO da error, así que un recuento de
 * éxitos no demuestra nada. Lo único que lo demuestra es pedirle al bucket su
 * lista y compararla con lo que hay en disco, clave a clave y byte a byte.
 */
async function verificar() {
  const cred = credenciales();
  const enR2 = await listarBucket(cred);
  const locales = videosPorSubir().map(([d, rel]) => [claveDe(rel), fs.statSync(path.join(d, rel)).size]);

  const ausentes = locales.filter(([k]) => !enR2.has(k));
  const distintos = locales.filter(([k, n]) => enR2.has(k) && enR2.get(k) !== n);
  console.log(`\nen R2: ${enR2.size} objetos · en disco: ${locales.length} videos`);
  if (ausentes.length) console.log(`FALTAN ${ausentes.length}: ` + ausentes.slice(0, 5).map(([k]) => k).join(', '));
  if (distintos.length) console.log(`PESO DISTINTO ${distintos.length}: ` + distintos.slice(0, 5).map(([k]) => k).join(', '));
  if (!ausentes.length && !distintos.length) console.log('todo subido y con el peso correcto');
  if (ausentes.length || distintos.length) process.exitCode = 1;
}

const orden = process.argv[2];
const acciones = { apartar, devolver, estado, subir, verificar };
if (!acciones[orden]) {
  console.error('uso: node scripts/cloudflare/medios.mjs apartar|devolver|subir|verificar|estado');
  process.exit(1);
}
await acciones[orden]();
