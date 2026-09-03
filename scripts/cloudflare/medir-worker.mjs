/**
 * Cuánto pesa lo que se sube a Cloudflare, y si cabe.
 *
 * Los dos techos que importan, y que no avisan hasta que el despliegue falla:
 *
 *   · El código del Worker: 3 MiB comprimido en el plan gratuito, 10 MiB en el
 *     de pago. Se mide COMPRIMIDO, que es como lo mide Cloudflare.
 *   · Workers Assets: 25 MiB POR ARCHIVO, sin excepción. Por eso los videos
 *     viven en R2 y no aquí.
 *
 * QUÉ CUENTA COMO «EL WORKER», que es donde es fácil equivocarse. No es todo
 * lo que hay en `.open-next`: ahí dentro viven manifiestos, plantillas y copias
 * de node_modules que no se suben. Lo que se sube es `worker.js` —un envoltorio
 * de unos pocos KB— y el paquete de esbuild al que apunta,
 * `server-functions/default/handler.mjs`. Sumar la carpeta entera daba 7,6 MB
 * cuando el Worker real pesa 1,4: un numero que asusta sin motivo y que, si se
 * cree, lleva a recortar cosas que no hacía falta recortar.
 *
 *   node scripts/cloudflare/medir-worker.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RAIZ = '.open-next';
const MB = 1048576;
const LIMITE_ASSET = 25 * MB;
const PIEZAS = ['worker.js', path.join('server-functions', 'default', 'handler.mjs')];

let crudo = 0;
let comprimido = 0;
for (const rel of PIEZAS) {
  const p = path.join(RAIZ, rel);
  if (!fs.existsSync(p)) {
    console.log(`${rel.padEnd(46)} (no existe — ¿falta construir?)`);
    continue;
  }
  const b = fs.readFileSync(p);
  const g = zlib.gzipSync(b).length;
  crudo += b.length;
  comprimido += g;
  console.log(`${rel.padEnd(46)} ${(b.length / MB).toFixed(2)} MB → ${(g / MB).toFixed(2)} MB comprimido`);
}
const techo = comprimido / MB;
console.log(`\nWorker completo    ${(crudo / MB).toFixed(2)} MB → ${techo.toFixed(2)} MB comprimido   `
  + (techo < 3 ? 'cabe hasta en el plan gratuito (techo 3 MiB)'
    : techo < 10 ? 'cabe en el de pago (techo 10 MiB); NO en el gratuito'
      : '*** NO CABE: el techo del plan de pago son 10 MiB ***'));

let assets = 0;
let bytes = 0;
const grandes = [];
(function recorre(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorre(p);
    else {
      const tam = fs.statSync(p).size;
      assets += 1;
      bytes += tam;
      if (tam > LIMITE_ASSET) grandes.push(`${p} (${(tam / MB).toFixed(1)} MB)`);
    }
  }
}(path.join(RAIZ, 'assets')));

console.log(`assets             ${assets} archivos · ${(bytes / MB).toFixed(1)} MB`);
console.log(`de más de 25 MiB   ${grandes.length ? '*** ' + grandes.length + ' — el despliegue fallará ***' : 'ninguno'}`);
grandes.forEach((g) => console.log('  x ' + g));
if (grandes.length || techo >= 10) process.exitCode = 1;
