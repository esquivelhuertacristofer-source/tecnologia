/**
 * ¿FUNCIONA LA PLATAFORMA DESPLEGADA? Se abre con un navegador de verdad.
 *
 * Contra el sitio en producción, las 235 clases, y de cada una se comprueban
 * tres cosas distintas —porque fallan por motivos distintos—:
 *
 *   1. QUE NO FALTE NADA. Cualquier respuesta >= 400 (imagen, tipografía,
 *      paquete de JS, hoja de estilos) queda apuntada con la clase que la
 *      pidió. Esto es lo que ni `tsc` ni jest ni `next build` ven: para ellos
 *      una ruta a un archivo es un string que compila igual de bien exista o no.
 *
 *   2. QUE EL VIDEO ESTÉ. Los 238 videos no viven con el sitio: están en R2 y
 *      los sirve `/assets/[...ruta]`. Un fallo ahí no da error de consola: el
 *      alumno ve un reproductor negro. Se comprueba pidiendo el primer kilobyte
 *      con `Range`, que además prueba lo que usa el navegador para saltar
 *      dentro del video. Descargar los 42 MB de cada uno sería absurdo, así que
 *      la petición que hace la página se corta y se mide aparte.
 *
 *   3. QUE SE PUEDA ENTRAR AL LABORATORIO. Que la entrada cargue no significa
 *      que la práctica funcione. Se pulsa el CTA y se espera a que monte algo:
 *      un lienzo, una ventana de programa o, como mínimo, que la entrada
 *      desaparezca. Un laboratorio que no abre es una clase que no existe.
 *
 *   PLAYWRIGHT_PATH="$(npm root -g)/playwright" BASE=https://centecnologia.com.mx \
 *     node scripts/auditoria/barrido-produccion.mjs [--limite 20]
 */
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const donde = process.env.PLAYWRIGHT_PATH;
const { chromium } = await import(donde ? pathToFileURL(join(donde, 'index.mjs')).href : 'playwright');

const BASE = (process.env.BASE || 'https://centecnologia.com.mx').replace(/\/$/, '');
const CARRILES = Number(process.env.CARRILES || 2);
const iLim = process.argv.indexOf('--limite');
const LIMITE = iLim > -1 ? Number(process.argv[iLim + 1]) : Infinity;
// `--solo a,b,c` para volver sobre unas cuantas sin repetir las 235.
const iSolo = process.argv.indexOf('--solo');
const SOLO = iSolo > -1 ? new Set(process.argv[iSolo + 1].split(',')) : null;

function deRegistro(archivo) {
  const s = readFileSync(join(RAIZ, archivo), 'utf8');
  return [...s.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]);
}
/**
 * La sala (`app`) se lee del registro. Adivinarla partiendo el id da 'ppt' para
 * `of-ppt-patron`, cuando el registro dice 'powerpoint': la URL sale mal, la
 * pagina responde 200 con la sala vacia, y las 13 clases de PowerPoint parecen
 * rotas sin estarlo. Costo un informe entero de falsos positivos.
 */
function officeDeRegistro(archivo) {
  const s = readFileSync(join(RAIZ, archivo), 'utf8');
  const fuera = [];
  for (const m of s.matchAll(/^  '([a-z0-9-]+)': \{[\s\S]*?app: '([a-z0-9]+)'/gm)) {
    fuera.push({ id: m[1], app: m[2] });
  }
  return fuera;
}

const rutas = [
  ...deRegistro('src/components/activities/registry.ts')
    .map((id) => ({ id, url: `/hub/nivel/${id.match(/^n(\d+)-/)[1]}/actividad/${id}` })),
  ...officeDeRegistro('src/components/activities/office/registroOffice.ts')
    .map(({ id, app }) => ({ id, url: `/hub/office/${app}/actividad/${id}` })),
].filter((r) => !SOLO || SOLO.has(r.id)).slice(0, LIMITE);

console.log(`${rutas.length} clases contra ${BASE}  (${CARRILES} en paralelo)\n`);

const nav = await chromium.launch({
  /*
   * MUDO. Un barrido abre 235 laboratorios y muchos tienen sonido: aunque el
   * navegador sea invisible, el audio SI sale por los altavoces del equipo.
   * Se descubrio de la peor manera, con el equipo sonando solo mientras
   * alguien intentaba trabajar.
   */
  args: ['--mute-audio', '--autoplay-policy=user-gesture-required'],
});
const informe = [];
const videosVistos = new Map();   // url -> resultado de la comprobación por rango

/** El primer kilobyte del video, que es lo que prueba que R2 responde y que se puede saltar. */
async function compruebaVideo(url) {
  if (videosVistos.has(url)) return videosVistos.get(url);
  let r;
  try {
    const resp = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    const rango = resp.headers.get('content-range');
    r = resp.status === 206 && rango
      ? { ok: true, detalle: rango }
      : { ok: false, detalle: `HTTP ${resp.status}${rango ? ' ' + rango : ' sin Content-Range'}` };
  } catch (e) {
    r = { ok: false, detalle: e.message };
  }
  videosVistos.set(url, r);
  return r;
}

async function revisa(ctx, r) {
  const p = await ctx.newPage();
  const fallos = [];
  const consola = [];
  const videos = new Set();

  p.on('response', (res) => {
    if (res.status() < 400) return;
    if (res.url().includes('_vercel/insights')) return;
    fallos.push(`${res.status()} ${decodeURIComponent(res.url().replace(BASE, ''))}`);
  });
  p.on('console', (m) => { if (m.type() === 'error') consola.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => consola.push('pageerror: ' + e.message.slice(0, 160)));

  // Los videos pesan 30-50 MB. Se apunta la URL y se corta la descarga; la
  // comprobación de verdad va aparte, por rango.
  await p.route('**/*.{mp4,webm,mov}', (ruta) => {
    videos.add(ruta.request().url());
    // Se responde en vez de abortar: un `abort()` deja un ERR_FAILED en la
    // consola de cada pagina y luego yo mismo lo cuento como defecto.
    ruta.fulfill({ status: 206, headers: { 'content-range': 'bytes 0-0/1', 'content-type': 'video/mp4' }, body: '' });
  });

  let entro = null;
  try {
    let respuesta = await p.goto(BASE + r.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Un 503 con dos navegadores encima es saturacion, no un defecto del sitio:
    // se reintenta una vez antes de apuntarlo.
    if (respuesta && respuesta.status() >= 500) {
      await p.waitForTimeout(3000);
      respuesta = await p.goto(BASE + r.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (respuesta && respuesta.status() < 400) fallos.length = 0;
    }
    // La actividad se monta en el cliente (`ssr: false`), asi que hay que
    // esperar a que el CTA exista, no a que pasen N segundos: las clases que
    // cargan el motor de presentaciones tardan mas y se declaraban rotas.
    await p.waitForSelector('.laboratorio-cta', { timeout: 25000 }).catch(() => {});
    await p.waitForTimeout(1200);

    // ¿Hay reproductor? Si el <video> no llegó a pedir nada, se saca del DOM.
    if (videos.size === 0) {
      const src = await p.evaluate(() => {
        const v = document.querySelector('video');
        if (!v) return null;
        return v.currentSrc || v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || null;
      });
      if (src) videos.add(src.startsWith('http') ? src : BASE + src);
    }

    // Entrar al laboratorio.
    const cta = p.locator('.laboratorio-cta, button:has-text("Empezar"), button:has-text("Comenzar"), button:has-text("Entrar")').first();
    if (await cta.count() === 0) {
      entro = 'sin CTA';
    } else {
      await cta.click({ timeout: 15000 });
      await p.waitForTimeout(4000);
      const montado = await p.evaluate(() => {
        if (document.querySelector('canvas')) return 'lienzo';
        if (document.querySelector('.ventana-programa, .ventana-base, [class*="ventana"]')) return 'ventana';
        if (!document.querySelector('.laboratorio-cta')) return 'la entrada desaparecio';
        return null;
      });
      entro = montado || 'NO ABRIO';
    }
  } catch (e) {
    fallos.push('navegacion: ' + e.message.split('\n')[0].slice(0, 120));
  }

  const videosMal = [];
  for (const v of videos) {
    const c = await compruebaVideo(v);
    if (!c.ok) videosMal.push(`${v.replace(BASE, '')} → ${c.detalle}`);
  }

  await p.close();
  return {
    id: r.id,
    fallos,
    consola: [...new Set(consola)],
    videos: videos.size,
    videosMal,
    entro,
  };
}

const cola = [...rutas];
let hechas = 0;
async function carril() {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    localStorage.setItem('tecnia_perfil', JSON.stringify({
      nombre: 'Auditoria', grado: '1° de Secundaria', grupo: 'A', avatar: '🤖', nivelActual: 10,
    }));
  });
  for (;;) {
    const r = cola.shift();
    if (!r) break;
    informe.push(await revisa(ctx, r));
    hechas += 1;
    if (hechas % 20 === 0) console.log(`  ...${hechas}/${rutas.length}`);
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: CARRILES }, carril));
await nav.close();

writeFileSync(join(AQUI, 'produccion.json'), JSON.stringify(informe, null, 1));

const conFallos = informe.filter((x) => x.fallos.length);
const sinVideo = informe.filter((x) => x.videos === 0);
const videoRoto = informe.filter((x) => x.videosMal.length);
const noAbre = informe.filter((x) => x.entro === 'NO ABRIO' || x.entro === 'sin CTA');
const conConsola = informe.filter((x) => x.consola.length);

console.log(`\n════ ${informe.length} clases contra ${BASE} ════`);
console.log(`peticiones fallidas (>=400) .... ${conFallos.length} clases`);
console.log(`sin reproductor de video ....... ${sinVideo.length} clases`);
console.log(`video que no responde .......... ${videoRoto.length} clases`);
console.log(`laboratorio que no abre ........ ${noAbre.length} clases`);
console.log(`errores de consola ............. ${conConsola.length} clases`);
console.log(`videos distintos comprobados ... ${videosVistos.size}`);

const muestra = (titulo, lista, campo) => {
  if (!lista.length) return;
  console.log(`\n── ${titulo} ──`);
  for (const x of lista.slice(0, 25)) {
    console.log(`  ${x.id}: ${campo ? JSON.stringify(x[campo]).slice(0, 180) : x.entro}`);
  }
  if (lista.length > 25) console.log(`  … y ${lista.length - 25} mas (ver produccion.json)`);
};
muestra('peticiones fallidas', conFallos, 'fallos');
muestra('video que no responde', videoRoto, 'videosMal');
muestra('sin reproductor', sinVideo, null);
muestra('laboratorio que no abre', noAbre, null);
muestra('errores de consola', conConsola, 'consola');

process.exitCode = (conFallos.length || videoRoto.length || noAbre.length) ? 1 : 0;
