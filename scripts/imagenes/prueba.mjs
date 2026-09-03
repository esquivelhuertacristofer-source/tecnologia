/**
 * Antes de tocar 824 imágenes: probar en ocho y MEDIR la pérdida.
 *
 * Se comparan tres recetas contra el original, y no sólo por tamaño: se calcula
 * el RMSE en RGBA (la diferencia media por canal, de 0 a 255). Por debajo de ~2
 * la diferencia no se ve; entre 2 y 5 se nota sólo comparando lado a lado; por
 * encima de 5 hay banding visible en degradados.
 */
import sharp from 'sharp';
import fs from 'node:fs';

const MUESTRA = [
  'public/assets/temas/imprevistos/1.png',
  'public/assets/landing-v3/hero-mascot.png',
  'public/assets/actividades/n1-enciende-y-apaga/bit-cara.png',
  'public/assets/actividades/n1-conoce-las-partes/monitor.png',
  'public/assets/actividades/n5-la-ia-en-mi-vida/portada.png',
  'public/assets/actividades/n10-capstone/portada.png',
  'public/assets/actividades/of-word-la-cinta/portada.png',
  'public/assets/actividades/n2-secreto-o-publico/ficha-datos-secretos.png',
];

async function rmse(bufA, bufB) {
  const a = await sharp(bufA).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const b = await sharp(bufB).resize(a.info.width, a.info.height).raw().ensureAlpha().toBuffer();
  let suma = 0;
  for (let i = 0; i < a.data.length; i++) {
    const d = a.data[i] - b[i];
    suma += d * d;
  }
  return Math.sqrt(suma / a.data.length);
}

const RECETAS = {
  'png sin pérdida': (s) => s.png({ compressionLevel: 9, effort: 10 }),
  'png paleta q90': (s) => s.png({ compressionLevel: 9, effort: 10, palette: true, quality: 90, dither: 1 }),
  'png paleta q80': (s) => s.png({ compressionLevel: 9, effort: 10, palette: true, quality: 80, dither: 1 }),
};

for (const f of MUESTRA) {
  if (!fs.existsSync(f)) { console.log('(no existe) ' + f); continue; }
  const orig = fs.readFileSync(f);
  const m = await sharp(orig).metadata();
  console.log(`\n${f.replace('public/assets/', '')}  ${m.width}x${m.height}  ${(orig.length / 1024).toFixed(0)} KB`);
  for (const [nombre, receta] of Object.entries(RECETAS)) {
    const salida = await receta(sharp(orig)).toBuffer();
    const err = await rmse(orig, salida);
    console.log(`   ${nombre.padEnd(18)} ${(salida.length / 1024).toFixed(0).padStart(6)} KB  ` +
      `${((1 - salida.length / orig.length) * 100).toFixed(0).padStart(3)}% menos  RMSE ${err.toFixed(2)}`);
  }
}
