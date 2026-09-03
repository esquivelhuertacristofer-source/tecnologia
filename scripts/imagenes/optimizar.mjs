/**
 * Re-comprime las imágenes de `public/` sin cambiar ni una ruta.
 *
 * EL PROBLEMA. 766 PNG, 637,6 MB, 850 KB de media. No es que sean enormes en
 * píxeles —casi todas están entre 512 y 1536 de lado—: es que están guardadas
 * con la compresión por los suelos. Para un alumno con el wifi de una escuela
 * pública, cada pantalla de éstas es media pantalla que no carga.
 *
 * LA TRAMPA QUE COSTÓ UNA PASADA ENTERA. En sharp, `png({ effort: 10 })`
 * **activa la paleta sin decirlo** (`lib/output.js:635`: si defines `effort`,
 * `quality`, `colours` o `dither`, pone `pngPalette = true`). O sea que lo que
 * yo creía una recompresión sin pérdida estaba cuantizando a 256 colores: el
 * PNG salía con colorType 3 en vez de 2, y una foto de alumnos daba un error
 * de 5,88 RMSE con diferencias de hasta 66 niveles por canal. Eso es banding
 * visible, no «no se nota».
 *
 * QUÉ HACE AHORA. Para cada imagen prueba las dos recetas y decide con la
 * medida en la mano:
 *
 *   - SIN PÉRDIDA: `png({ compressionLevel: 9 })`. Idéntica al original, píxel
 *     a píxel. `compressionLevel` no está en la lista que activa la paleta.
 *   - PALETA: 256 colores con dithering. Mucho más pequeña, pero con pérdida.
 *
 * Se queda con la de paleta **sólo si el error medido es imperceptible**
 * (RMSE ≤ 1,5, por debajo de un nivel y medio sobre 255) y encima ahorra al
 * menos un 10 % sobre la versión sin pérdida. Si no, sin pérdida. Así los
 * dibujos planos —que son la mayoría del material— aprovechan la paleta, y las
 * fotos y los degradados se quedan intactos.
 *
 * QUÉ NO HACE. No convierte a WebP ni a AVIF: cambiaría la extensión y con
 * ella las rutas escritas en decenas de componentes. Esa conversión la hace
 * `next/image` al servir, sobre el original ya ligero.
 *
 * SEGURIDAD. Sólo sustituye el archivo si el resultado es al menos un 5 % más
 * pequeño y vuelve a abrirse con las dimensiones esperadas. Los originales
 * están en el historial de git, así que `git checkout -- public/` lo deshace
 * entero.
 *
 *   node scripts/imagenes/optimizar.mjs [--simular] [ruta.png …]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/*
 * Sin esto, 12 de los 766 fallaban SIEMPRE con «UNKNOWN: unknown error, open»
 * —los mismos doce en dos pasadas seguidas— y sin embargo abiertos de uno en
 * uno iban bien. Es la caché de libvips: deja el archivo mapeado en memoria y
 * en Windows eso choca al recorrer cientos seguidos.
 */
sharp.cache(false);

const SIMULAR = process.argv.includes('--simular');
const SOLO = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const RAIZ = 'public';
const LADO_MAXIMO = 2048;
const GANANCIA_MINIMA = 0.05;   // frente al archivo original
const VENTAJA_PALETA = 0.10;    // frente a la versión sin pérdida
const ERROR_MAXIMO = 1.5;       // RMSE por canal, sobre 255

function todas(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) todas(p, salida);
    else if (/\.png$/i.test(e.name)) salida.push(p);
  }
  return salida;
}

/** Diferencia media por canal entre dos imágenes del mismo tamaño, de 0 a 255. */
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

const ficheros = SOLO.length ? SOLO : todas(RAIZ);
let antes = 0;
let despues = 0;
const cuenta = { paleta: 0, sinPerdida: 0, intactas: 0 };
let peorError = 0;
let peorFichero = '';
const fallos = [];

console.log(`${ficheros.length} PNG${SIMULAR ? ' (simulación, no se escribe nada)' : ''}\n`);

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

    const sinPerdida = await base().png({ compressionLevel: 9 }).toBuffer();
    const conPaleta = await base()
      .png({ compressionLevel: 9, palette: true, effort: 10, quality: 90, dither: 1 })
      .toBuffer();

    // La referencia son los píxeles ya redimensionados, no el archivo de
    // partida: si no, el error de la paleta se mezclaría con el del reescalado.
    const referencia = await base().raw().ensureAlpha().toBuffer();
    const error = rmse(referencia, await sharp(conPaleta).raw().ensureAlpha().toBuffer());

    const vale = error <= ERROR_MAXIMO && conPaleta.length < sinPerdida.length * (1 - VENTAJA_PALETA);
    const elegido = vale ? conPaleta : sinPerdida;
    if (vale && error > peorError) { peorError = error; peorFichero = f; }

    if (elegido.length > original * (1 - GANANCIA_MINIMA)) {
      despues += original;
      cuenta.intactas += 1;
    } else {
      // Antes de pisar nada: que el resultado abra y tenga el tamaño esperado.
      const comprobar = await sharp(elegido).metadata();
      const esperado = encoge ? LADO_MAXIMO : lado;
      if (Math.max(comprobar.width ?? 0, comprobar.height ?? 0) !== esperado) {
        throw new Error(`dimensiones raras: ${comprobar.width}x${comprobar.height}`);
      }
      if (!SIMULAR) fs.writeFileSync(f, elegido);
      despues += elegido.length;
      cuenta[vale ? 'paleta' : 'sinPerdida'] += 1;
    }
  } catch (e) {
    fallos.push(`${f}: ${e.message}`);
    despues += original;
  }
  if ((i + 1) % 100 === 0) {
    console.log(`  ${i + 1}/${ficheros.length}  ${(antes / 1048576).toFixed(0)} MB → ${(despues / 1048576).toFixed(0)} MB`);
  }
}

const MB = 1048576;
console.log(`\ncon paleta: ${cuenta.paleta}   sin pérdida: ${cuenta.sinPerdida}   `
  + `sin ganancia (intactas): ${cuenta.intactas}   fallos: ${fallos.length}`);
console.log(`peor error aceptado: RMSE ${peorError.toFixed(2)}${peorFichero ? '  (' + peorFichero + ')' : ''}`);
console.log(`${(antes / MB).toFixed(1)} MB → ${(despues / MB).toFixed(1)} MB  (${((1 - despues / antes) * 100).toFixed(1)} % menos)`);
fallos.forEach((f) => console.log('  x ' + f));
