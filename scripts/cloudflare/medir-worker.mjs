/**
 * Cuánto pesa lo que se va a subir a Cloudflare, y si cabe.
 *
 * Los dos techos que importan, y que no avisan hasta que el despliegue falla:
 *
 *   · El código del Worker: 3 MiB comprimido en el plan gratuito, 10 MiB en el
 *     de pago. Se mide COMPRIMIDO, que es como lo mide Cloudflare.
 *   · Workers Assets: 25 MiB POR ARCHIVO, sin excepción. Por eso los videos
 *     viven en R2 y no aquí.
 *
 *   node scripts/cloudflare/medir-worker.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RAIZ = '.open-next';
const MB = 1048576;
const LIMITE_ASSET = 25 * MB;

function recorre(dir, alVer) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorre(p, alVer);
    else alVer(p, fs.statSync(p).size);
  }
}

const worker = path.join(RAIZ, 'worker.js');
console.log(`worker.js          ${(fs.statSync(worker).size / MB).toFixed(2)} MB en crudo`);

let n = 0;
let crudo = 0;
let comprimido = 0;
recorre(RAIZ, (p, tam) => {
  if (p.includes(`${path.sep}assets${path.sep}`)) return;
  if (!/\.(js|mjs|cjs|json|wasm)$/i.test(p)) return;
  n += 1;
  crudo += tam;
  comprimido += zlib.gzipSync(fs.readFileSync(p)).length;
});
const techo = comprimido / MB;
console.log(`código del Worker  ${n} archivos · ${(crudo / MB).toFixed(2)} MB · `
  + `${techo.toFixed(2)} MB comprimido  ${techo < 3 ? '(cabe hasta en el plan gratuito)' : techo < 10 ? '(cabe en el de pago; NO en el gratuito)' : '*** NO CABE ***'}`);

let assets = 0;
let bytes = 0;
const grandes = [];
recorre(path.join(RAIZ, 'assets'), (p, tam) => {
  assets += 1;
  bytes += tam;
  if (tam > LIMITE_ASSET) grandes.push(`${p} (${(tam / MB).toFixed(1)} MB)`);
});
console.log(`assets             ${assets} archivos · ${(bytes / MB).toFixed(1)} MB`);
console.log(`de más de 25 MiB   ${grandes.length ? '*** ' + grandes.length + ' ***' : 'ninguno'}`);
grandes.forEach((g) => console.log('  x ' + g));
if (grandes.length || techo >= 10) process.exitCode = 1;
