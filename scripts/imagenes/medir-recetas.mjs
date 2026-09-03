/**
 * Cuánto ahorra cada receta y cuánto cuesta en calidad. Sobre una muestra
 * repartida por todo el árbol, no por las primeras N de una carpeta.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);
const N = Number(process.argv[2] || 36);

function todas(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todas(p, salida);
    else if (/\.png$/i.test(e.name)) salida.push(p);
  }
  return salida;
}

function rmse(a, b) {
  // Premultiplicado: debajo de un pixel transparente el color no se ve, y
  // compararlo daba RMSE 50 en conversiones sin perdida ninguna.
  let s = 0;
  for (let i = 0; i < a.length; i += 4) {
    const pa = a[i + 3] / 255;
    const pb = b[i + 3] / 255;
    for (let c = 0; c < 3; c += 1) {
      const d = a[i + c] * pa - b[i + c] * pb;
      s += d * d;
    }
    const da = a[i + 3] - b[i + 3];
    s += da * da;
  }
  return Math.sqrt(s / a.length);
}

const ficheros = todas('public');
const paso = Math.max(1, Math.floor(ficheros.length / N));
const muestra = ficheros.filter((_, i) => i % paso === 0).slice(0, N);

const RECETAS = {
  'webp q80': (s) => s.webp({ quality: 80, effort: 6 }),
  'webp q88': (s) => s.webp({ quality: 88, effort: 6 }),
  'webp q94': (s) => s.webp({ quality: 94, effort: 6 }),
  'webp s/perd': (s) => s.webp({ lossless: true, effort: 6 }),
};

const suma = { original: 0 };
for (const k of Object.keys(RECETAS)) suma[k] = 0;
const peor = {};
console.log(`muestra de ${muestra.length} de ${ficheros.length} PNG\n`);
console.log('imagen'.padEnd(46) + 'orig'.padStart(8) + Object.keys(RECETAS).map((k) => k.padStart(16)).join(''));

for (const f of muestra) {
  const orig = fs.statSync(f).size;
  suma.original += orig;
  const ref = await sharp(f).raw().ensureAlpha().toBuffer();
  let fila = f.replace(/^public[\\/]assets[\\/]/, '').padEnd(46).slice(0, 46) + (orig / 1024).toFixed(0).padStart(7) + 'K';
  for (const [nombre, receta] of Object.entries(RECETAS)) {
    const buf = await receta(sharp(f)).toBuffer();
    suma[nombre] += buf.length;
    const err = rmse(ref, await sharp(buf).raw().ensureAlpha().toBuffer());
    if (!peor[nombre] || err > peor[nombre]) peor[nombre] = err;
    fila += `${(buf.length / 1024).toFixed(0)}K/${err.toFixed(1)}`.padStart(16);
  }
  console.log(fila);
}

console.log('\n' + 'TOTAL'.padEnd(46) + (suma.original / 1048576).toFixed(1).padStart(7) + 'M'
  + Object.keys(RECETAS).map((k) => `${(suma[k] / 1048576).toFixed(1)}M`.padStart(16)).join(''));
console.log('ahorro'.padEnd(53) + Object.keys(RECETAS)
  .map((k) => `${((1 - suma[k] / suma.original) * 100).toFixed(0)}%`.padStart(16)).join(''));
console.log('peor RMSE'.padEnd(53) + Object.keys(RECETAS)
  .map((k) => peor[k].toFixed(2).padStart(16)).join(''));
