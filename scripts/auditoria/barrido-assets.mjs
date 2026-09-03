/**
 * ¿ALGUNA CLASE PIDE UNA IMAGEN QUE NO EXISTE?
 *
 * Se abre la ENTRADA de las 235 actividades con un navegador de verdad y se
 * apunta toda respuesta >= 400 que sea una imagen. No se adivina leyendo el
 * código: se mira lo que el navegador pide.
 *
 * POR QUÉ HACE FALTA, Y POR QUÉ NINGUNA OTRA PUERTA LO VE (auditoría del
 * 2-sep-2026, que es cuando se escribió esto y encontró doce tarjetas rotas):
 *
 *   · `tsc` no sabe si un PNG existe. `img: 'ficha-reparte.png'` es un string
 *     y compila perfectamente aunque el archivo no esté.
 *   · `jest` corre en jsdom, que NO descarga imágenes. Un `<img src>` roto
 *     monta igual y todas las pruebas pasan.
 *   · `next build` no comprueba los archivos de `public/`: los copia.
 *
 * Tres clases enseñaban cuatro huecos cada una y las tres puertas estaban en
 * verde. Ésta es la cuarta puerta. Conviene pasarla antes de cada entrega.
 *
 * OJO CON `public/`: `next start` sirve una foto de `public/` tomada en el
 * build. Si acabas de añadir imágenes, RECONSTRUYE antes de barrer o saldrán
 * 404 que ya no son ciertos. Se aprendió perdiendo un rato.
 *
 * HASTA DÓNDE LLEGA ESTO, para que nadie lo lea como más de lo que es: abre la
 * ENTRADA de cada clase, no el laboratorio de dentro. Cubre portadas, fichas y
 * reproductores —donde estaban los doce huecos— pero si un laboratorio pide una
 * textura o un sonido que no existe, esto NO lo ve. Entrar al laboratorio pide
 * pulsar un CTA distinto en cada clase; el día que se automatice, ese es el
 * siguiente escalón.
 *
 * Uso — con el servidor de producción levantado en :3002
 *
 *   npm run build && npx next start -p 3002
 *   PLAYWRIGHT_PATH="$(npm root -g)/playwright" node scripts/auditoria/barrido-assets.mjs
 *   ... --office     sólo las 38 de la sala de Office
 *   ... --todo       las 235 (lo que hay que correr antes de entregar)
 */
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

// En Windows un import() con ruta absoluta se lee como protocolo `c:`: file://
const donde = process.env.PLAYWRIGHT_PATH;
const { chromium } = await import(donde ? pathToFileURL(join(donde, 'index.mjs')).href : 'playwright');

const BASE = process.env.BASE || 'http://localhost:3002';
const soloOffice = process.argv.includes('--office');
const todo = process.argv.includes('--todo') || !soloOffice;

/** Las actividades salen del registro, que es la única fuente de verdad. */
function deRegistro(archivo) {
  const s = readFileSync(join(RAIZ, archivo), 'utf8');
  return [...s.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]);
}

const rutas = [];
if (todo) {
  for (const id of deRegistro('src/components/activities/registry.ts')) {
    rutas.push({ id, url: `/hub/nivel/${id.match(/^n(\d+)-/)[1]}/actividad/${id}` });
  }
}
if (todo || soloOffice) {
  for (const id of deRegistro('src/components/activities/office/registroOffice.ts')) {
    rutas.push({ id, url: `/hub/office/${id.split('-')[1]}/actividad/${id}` });
  }
}

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/log-in`, { waitUntil: 'domcontentloaded' });
// No hay login real: basta con dejar el perfil puesto (§5.1 del informe).
await p.evaluate(() => localStorage.setItem('tecnia_perfil', JSON.stringify({
  nombre: 'Auditoria', grado: '1° de Secundaria', grupo: 'A', avatar: '🤖', nivelActual: 10,
})));

const rotas = new Map();
let actual = null;
p.on('response', (r) => {
  const u = r.url();
  if (r.status() < 400) return;
  // El script de Vercel no existe fuera de Vercel y no es un defecto.
  if (u.includes('_vercel/insights')) return;
  if (!/\.(png|jpg|jpeg|webp|svg|gif|mp4)(\?|$)|_next\/image/.test(u)) return;
  const limpia = decodeURIComponent(u.replace(BASE, '')).replace(/[?&](w|q)=\d+/g, '');
  if (!rotas.has(actual)) rotas.set(actual, new Set());
  rotas.get(actual).add(`${r.status()} ${limpia}`);
});

let i = 0;
for (const r of rutas) {
  actual = r.id;
  i++;
  try {
    await p.goto(BASE + r.url, { waitUntil: 'networkidle', timeout: 25000 });
  } catch { /* una que tarde no rompe el barrido */ }
  if (i % 40 === 0) console.log(`  ...${i}/${rutas.length}`);
}

const salida = [...rotas.entries()].map(([id, s]) => ({ id, rotas: [...s] }));
writeFileSync(join(AQUI, 'assets-rotos.json'), JSON.stringify(salida, null, 1));
console.log('');
console.log(`clases visitadas: ${rutas.length}`);
console.log(`clases con alguna imagen rota: ${salida.length}`);
for (const s of salida) {
  console.log(`\n  ${s.id}  (${s.rotas.length})`);
  for (const r of s.rotas) console.log('      ' + r);
}
await nav.close();
process.exit(salida.length === 0 ? 0 : 1);
