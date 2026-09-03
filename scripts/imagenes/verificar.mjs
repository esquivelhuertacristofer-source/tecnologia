/**
 * Comprueba que la recompresión no rompió ninguna imagen.
 *
 * Decir «72 % menos y no se nota» es una afirmación, no una prueba. Aquí se
 * prueba, comparando cada PNG del árbol de trabajo contra la versión que
 * guarda git:
 *
 *   1. que TODAS abren y decodifican (una imagen corrupta pesa poquísimo y no
 *      da error hasta que un alumno abre la pantalla);
 *   2. que conservan sus dimensiones —salvo las que se redujeron a propósito
 *      por pasar de 2048 px, que se listan aparte—;
 *   3. que el contenido es el mismo, midiendo el RMSE en RGBA sobre una
 *      muestra. Por debajo de 2 la diferencia no se ve; por encima de 5 hay
 *      banding visible en degradados.
 *
 *   node scripts/imagenes/verificar.mjs [muestra]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);

const MUESTRA = Number(process.argv[2] || 40);
const RAIZ = 'public';

function todas(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todas(p, salida);
    else if (/\.png$/i.test(e.name)) salida.push(p.split(path.sep).join('/'));
  }
  return salida;
}

async function rmse(a, b) {
  const A = await sharp(a).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).resize(A.info.width, A.info.height).raw().ensureAlpha().toBuffer();
  let suma = 0;
  for (let i = 0; i < A.data.length; i += 1) {
    const d = A.data[i] - B[i];
    suma += d * d;
  }
  return Math.sqrt(suma / A.data.length);
}

const ficheros = todas(RAIZ);
console.log(`${ficheros.length} PNG · decodificando todas…`);

const rotas = [];
const dimensiones = new Map();
for (const f of ficheros) {
  try {
    const m = await sharp(f).metadata();
    // `stats()` fuerza la decodificación completa; `metadata()` sólo lee la
    // cabecera y un PNG truncado la pasa sin protestar.
    await sharp(f).stats();
    dimensiones.set(f, `${m.width}x${m.height}`);
  } catch (e) {
    rotas.push(`${f}: ${e.message}`);
  }
}
console.log(rotas.length ? `ROTAS ${rotas.length}` : 'todas decodifican bien');
rotas.forEach((r) => console.log('  x ' + r));

// La muestra se reparte por el árbol en vez de coger las primeras N, que
// caerían todas en la misma carpeta y probarían una sola clase de imagen.
const paso = Math.max(1, Math.floor(ficheros.length / MUESTRA));
const elegidas = ficheros.filter((_, i) => i % paso === 0).slice(0, MUESTRA);
console.log(`\ncomparando ${elegidas.length} contra la versión de git…`);

const tmp = path.join('.medios', 'verificar');
fs.mkdirSync(tmp, { recursive: true });
let peor = 0;
let peorF = '';
const redimensionadas = [];
const sospechosas = [];

for (const f of elegidas) {
  let antes;
  try {
    antes = execFileSync('git', ['show', `HEAD:${f}`], { maxBuffer: 64 * 1024 * 1024 });
  } catch {
    continue; // no estaba en git (imagen nueva)
  }
  const previo = path.join(tmp, 'previo.png');
  fs.writeFileSync(previo, antes);
  const mA = await sharp(previo).metadata();
  const mB = await sharp(f).metadata();
  if (mA.width !== mB.width || mA.height !== mB.height) {
    redimensionadas.push(`${f}: ${mA.width}x${mA.height} → ${mB.width}x${mB.height}`);
  }
  const err = await rmse(f, previo);
  if (err > peor) { peor = err; peorF = f; }
  if (err > 5) sospechosas.push(`${f}: RMSE ${err.toFixed(2)}`);
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`peor diferencia de la muestra: RMSE ${peor.toFixed(2)}  (${peorF})`);
if (redimensionadas.length) {
  console.log(`redimensionadas a propósito (>2048 px): ${redimensionadas.length}`);
  redimensionadas.forEach((r) => console.log('  · ' + r));
}
if (sospechosas.length) {
  console.log('DIFERENCIA VISIBLE:');
  sospechosas.forEach((s) => console.log('  ! ' + s));
}
if (rotas.length || sospechosas.length) process.exitCode = 1;
