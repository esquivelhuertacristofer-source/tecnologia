/**
 * Convierte a WebP los PNG de `public/assets` y arregla las referencias.
 *
 * POR QUÉ WEBP Y NO RECOMPRIMIR PNG. Se midió sobre una muestra repartida por
 * todo el árbol, comparando peso y error real (RMSE premultiplicado, que no
 * cuenta el color que hay debajo de los píxeles transparentes porque no se ve):
 *
 *   PNG sin pérdida   35 % MÁS grande   error 0      (no hay nada que rascar:
 *   PNG con paleta    70 % menos        error 3,03    los PNG ya venían bien
 *   WebP q88          95 % menos        error 2,95    comprimidos como PNG)
 *   WebP sin pérdida  36 % menos        error 0
 *
 * WebP q88 pesa la mitad que la paleta de PNG y encima pierde menos. 637 MB
 * se quedan en unos 32.
 *
 * LA ESCALERA. No todas las imágenes aguantan igual: las de degradados suaves
 * se rompen antes. Así que cada una prueba q88 y, si el error se pasa de 3,5,
 * sube a q94; si aún así se pasa, se guarda WebP sin pérdida (que sigue siendo
 * un 36 % más ligero que el PNG). Ninguna imagen se degrada por encima del
 * umbral: o cumple, o no se toca la calidad.
 *
 * QUÉ NO SE CONVIERTE. `public/marca/` se queda en PNG a propósito: son el
 * icono de la pestaña, el de iOS y la imagen de OpenGraph. WhatsApp, Facebook
 * y Twitter no muestran WebP de forma fiable como `og:image`, y un enlace
 * compartido sin imagen es peor que 83 KB de más.
 *
 *   node scripts/imagenes/a-webp.mjs [--simular]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);

const SIMULAR = process.argv.includes('--simular');
const RAIZ = path.join('public', 'assets');
const LADO_MAXIMO = 2048;
const ERROR_MAXIMO = 3.5;
const ESCALERA = [88, 94];
const MAPA = path.join('.medios', 'webp-convertidas.json');

function todas(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todas(p, salida);
    else if (/\.png$/i.test(e.name)) salida.push(p);
  }
  return salida;
}

/**
 * Diferencia media entre dos imágenes, de 0 a 255, premultiplicando el alfa:
 * debajo de un píxel transparente el color no se ve, y compararlo daba errores
 * enormes en conversiones que no perdían absolutamente nada.
 */
function rmse(a, b) {
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

const ficheros = todas(RAIZ);
console.log(`${ficheros.length} PNG en ${RAIZ}${SIMULAR ? ' (simulación)' : ''}\n`);

let antes = 0;
let despues = 0;
const porCalidad = { 88: 0, 94: 0, sinPerdida: 0, intactas: 0 };
let peorError = 0;
let peorFichero = '';
const convertidas = {};
const fallos = [];

for (const [i, f] of ficheros.entries()) {
  const original = fs.statSync(f).size;
  antes += original;
  try {
    const meta = await sharp(f).metadata();
    const lado = Math.max(meta.width ?? 0, meta.height ?? 0);
    const encoge = lado > LADO_MAXIMO;
    const base = () => {
      const s = sharp(f);
      return encoge
        ? s.resize({
          width: meta.width >= meta.height ? LADO_MAXIMO : undefined,
          height: meta.height > meta.width ? LADO_MAXIMO : undefined,
        })
        : s;
    };
    const referencia = await base().raw().ensureAlpha().toBuffer();

    let elegido = null;
    let etiqueta = 'sinPerdida';
    for (const q of ESCALERA) {
      const buf = await base().webp({ quality: q, effort: 6 }).toBuffer();
      const error = rmse(referencia, await sharp(buf).raw().ensureAlpha().toBuffer());
      if (error <= ERROR_MAXIMO) {
        elegido = buf;
        etiqueta = String(q);
        if (error > peorError) { peorError = error; peorFichero = f; }
        break;
      }
    }
    if (!elegido) elegido = await base().webp({ lossless: true, effort: 6 }).toBuffer();

    if (elegido.length >= original) {
      // Rarísimo, pero si el WebP no gana nada, el PNG se queda donde está.
      despues += original;
      porCalidad.intactas += 1;
      continue;
    }

    // Antes de borrar el original: que el WebP abra y mida lo que debe.
    const comprobar = await sharp(elegido).metadata();
    const esperado = encoge ? LADO_MAXIMO : lado;
    if (Math.max(comprobar.width ?? 0, comprobar.height ?? 0) !== esperado) {
      throw new Error(`dimensiones raras: ${comprobar.width}x${comprobar.height}`);
    }

    const destino = f.replace(/\.png$/i, '.webp');
    if (!SIMULAR) {
      fs.writeFileSync(destino, elegido);
      fs.unlinkSync(f);
    }
    convertidas[f.split(path.sep).join('/')] = destino.split(path.sep).join('/');
    despues += elegido.length;
    porCalidad[etiqueta] += 1;
  } catch (e) {
    fallos.push(`${f}: ${e.message}`);
    despues += original;
  }
  if ((i + 1) % 100 === 0) {
    console.log(`  ${i + 1}/${ficheros.length}  ${(antes / 1048576).toFixed(0)} MB → ${(despues / 1048576).toFixed(0)} MB`);
  }
}

if (!SIMULAR) {
  fs.mkdirSync(path.dirname(MAPA), { recursive: true });
  fs.writeFileSync(MAPA, JSON.stringify(convertidas, null, 1));
}

const MB = 1048576;
console.log(`\nq88: ${porCalidad[88]}   q94: ${porCalidad[94]}   sin pérdida: ${porCalidad.sinPerdida}   `
  + `sin ganancia (siguen en PNG): ${porCalidad.intactas}   fallos: ${fallos.length}`);
console.log(`peor error aceptado: RMSE ${peorError.toFixed(2)}${peorFichero ? '  (' + peorFichero + ')' : ''}`);
console.log(`${(antes / MB).toFixed(1)} MB → ${(despues / MB).toFixed(1)} MB  (${((1 - despues / antes) * 100).toFixed(1)} % menos)`);
console.log(`mapa de conversiones en ${MAPA} (${Object.keys(convertidas).length} entradas)`);
fallos.forEach((f) => console.log('  x ' + f));
