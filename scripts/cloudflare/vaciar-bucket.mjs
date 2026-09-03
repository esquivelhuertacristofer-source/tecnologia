/**
 * Vacía un bucket de R2 objeto a objeto y luego lo borra.
 *
 * POR QUÉ EXISTE. Los 238 videos se subieron a la cuenta equivocada. R2 cobra
 * por GB almacenado, así que dejarlos ahí es pagar por algo que nadie sirve.
 * Wrangler no tiene borrado masivo y `r2 bucket delete` exige el bucket vacío,
 * de modo que hay que ir uno por uno; la lista de claves es la misma que dejó
 * la subida (`.medios/subidos.txt`).
 *
 * Se invoca a `wrangler.js` con node directamente en vez de por `npx`: son 238
 * llamadas y npx añade un par de segundos de resolución a cada una.
 *
 *   node scripts/cloudflare/vaciar-bucket.mjs <bucket>
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const WRANGLER = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const bucket = process.argv[2];
if (!bucket) throw new Error('falta el nombre del bucket');

const lista = path.join(RAIZ, '.medios', 'subidos.txt');
const claves = fs.readFileSync(lista, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
console.log(`${claves.length} objetos a borrar de "${bucket}"\n`);

let hechos = 0;
const fallos = [];
for (const [i, clave] of claves.entries()) {
  const r = spawnSync(process.execPath,
    [WRANGLER, 'r2', 'object', 'delete', `${bucket}/${clave}`, '--remote'],
    { cwd: RAIZ, encoding: 'utf8' });
  if (r.status === 0) hechos += 1;
  else fallos.push(`${clave}: ${(r.stderr || '').trim().split('\n').slice(-2).join(' ')}`);
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${claves.length}  (${fallos.length} fallos)`);
}

console.log(`\nborrados: ${hechos}   fallos: ${fallos.length}`);
fallos.slice(0, 8).forEach((f) => console.log('  x ' + f));

// La prueba de que quedó vacío: `bucket delete` sólo funciona si no queda nada.
const b = spawnSync(process.execPath, [WRANGLER, 'r2', 'bucket', 'delete', bucket],
  { cwd: RAIZ, encoding: 'utf8' });
console.log(b.status === 0
  ? `\nbucket "${bucket}" borrado: estaba vacío`
  : `\nel bucket NO se pudo borrar:\n${(b.stderr || b.stdout || '').trim()}`);
