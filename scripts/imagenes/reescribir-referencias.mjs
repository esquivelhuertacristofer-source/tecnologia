/**
 * Cambia `.png` por `.webp` en el código, pero SÓLO donde el archivo se
 * convirtió de verdad.
 *
 * Un `sed` global sobre `.png` sería un desastre: hay `.png` en comentarios,
 * en documentación, en los guiones de vídeo que leen material de fuera de
 * `public/`, y en `public/marca/`, que se queda en PNG a propósito (iconos de
 * pestaña y la imagen de OpenGraph, que WhatsApp y Facebook no muestran en
 * WebP). Así que cada sustitución se comprueba contra el mapa que dejó la
 * conversión.
 *
 * DOS FORMAS DE REFERENCIA. La mayoría son rutas literales
 * (`'/assets/actividades/x/portada.png'`) y se resuelven contra el mapa
 * directamente. Unas cuantas son plantillas (`` `${assets}/portada.png` ``),
 * donde la carpeta es una variable y no se puede resolver leyendo el archivo.
 * Para ésas la regla es: se cambia sólo si **ya no queda ningún PNG con ese
 * nombre** en todo `public/assets`. Si no queda ninguno, la plantilla no puede
 * apuntar más que a un `.webp`.
 *
 *   node scripts/imagenes/reescribir-referencias.mjs [--simular]
 */
import fs from 'node:fs';
import path from 'node:path';

const SIMULAR = process.argv.includes('--simular');
const MAPA = path.join('.medios', 'webp-convertidas.json');

const mapa = JSON.parse(fs.readFileSync(MAPA, 'utf-8'));
const convertidas = new Set(Object.keys(mapa));

/*
 * Los nombres que SI se convirtieron, sin carpeta. La mayoria de las
 * referencias del codigo no son rutas: son nombres sueltos (`img:
 * 'ficha-reparte.png'`) que cada actividad combina con su propia carpeta en
 * tiempo de ejecucion, y esos no se pueden resolver leyendo el archivo.
 */
const nombresConvertidos = new Set(
  Object.values(mapa).map((v) => v.split('/').pop().toLowerCase()),
);

/** Los PNG que SIGUEN existiendo bajo public/, para no romper lo que no se toco. */
function pngsQueQuedan(dir, salida = new Set()) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pngsQueQuedan(p, salida);
    else if (/\.png$/i.test(e.name)) salida.add(e.name.toLowerCase());
  }
  return salida;
}
const nombresQueQuedan = pngsQueQuedan('public');

/*
 * La regla para un nombre suelto, que es la que evita los dos desastres
 * posibles: se cambia SOLO si ese nombre esta en el mapa de conversiones Y
 * ademas no queda ningun PNG con ese nombre en ningun sitio. Lo primero deja
 * fuera lo que ni siquiera es un asset (los `icon.png` que se citan en un
 * comentario de `layout.tsx`); lo segundo deja fuera cualquier carpeta donde
 * la conversion no llegara.
 */
function seguroPorNombre(nombre) {
  const n = nombre.toLowerCase();
  return nombresConvertidos.has(n.replace(/\.png$/, '.webp')) && !nombresQueQuedan.has(n);
}

function fuentes(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuentes(p, salida);
    else if (/\.(tsx?|css)$/.test(e.name)) salida.push(p);
  }
  return salida;
}

let tocados = 0;
let cambios = 0;
const dudosas = [];

for (const f of fuentes('src')) {
  const antes = fs.readFileSync(f, 'utf-8');
  let n = 0;

  const despues = antes.replace(/([^\s'"`)(,]*?)\.png/g, (todo, ruta) => {
    // Ruta absoluta del sitio: se resuelve contra public/ y se mira el mapa.
    if (ruta.startsWith('/')) {
      const enDisco = path.join('public', ruta.slice(1) + '.png').split(path.sep).join('/');
      if (convertidas.has(enDisco)) { n += 1; return ruta + '.webp'; }
      return todo;
    }
    // Nombre suelto o cola de plantilla.
    const nombre = ruta.split('/').pop();
    if (nombre && seguroPorNombre(nombre + '.png')) { n += 1; return ruta + '.webp'; }
    if (nombre && nombresQueQuedan.has((nombre + '.png').toLowerCase())) {
      dudosas.push(`${nombre}.png (todavia existe un PNG con ese nombre)`);
    }
    return todo;
  });

  if (n) {
    if (!SIMULAR) fs.writeFileSync(f, despues);
    tocados += 1;
    cambios += n;
    console.log(`  ${n.toString().padStart(3)}  ${f}`);
  }
}

console.log(`\n${cambios} referencias cambiadas en ${tocados} archivos${SIMULAR ? ' (simulación)' : ''}`);
if (dudosas.length) {
  console.log('\nsin tocar por dudosas:');
  [...new Set(dudosas)].forEach((d) => console.log('  ? ' + d));
}
