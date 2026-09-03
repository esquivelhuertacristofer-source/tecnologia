/**
 * Comprueba que ninguna ruta de archivo escrita en el código apunta al vacío.
 *
 * Después de renombrar 762 imágenes, la pregunta que importa no es «¿cuántas
 * referencias cambié?» sino «¿queda alguna rota?». Esto lo responde: saca del
 * código todas las rutas literales a `public/` y comprueba una por una que el
 * archivo existe.
 *
 * Lo que NO puede ver son las plantillas (`` `${assets}/portada.webp` ``),
 * porque la carpeta es una variable. Para ésas se comprueba lo contrario: que
 * cada carpeta de actividad tenga el archivo con ese nombre.
 *
 *   node scripts/imagenes/comprobar-rutas.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONES = 'png|webp|jpg|jpeg|svg|gif|mp3|wav|mp4|webm|json|html';

function fuentes(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuentes(p, salida);
    else if (/\.(tsx?|css)$/.test(e.name)) salida.push(p);
  }
  return salida;
}

const literales = new Map();   // ruta -> archivos que la citan
const plantillas = new Map();  // nombre de archivo -> archivos que lo citan
const reLiteral = new RegExp(`['"\`](/(?:assets|marca|audio|juegos)/[^'"\`\\n]+?\\.(?:${EXTENSIONES}))['"\`]`, 'g');
const rePlantilla = new RegExp(`\\}([-a-zA-Z0-9_/.]*?\\.(?:${EXTENSIONES}))`, 'g');

for (const f of fuentes('src')) {
  const texto = fs.readFileSync(f, 'utf-8');
  for (const m of texto.matchAll(reLiteral)) {
    if (!literales.has(m[1])) literales.set(m[1], []);
    literales.get(m[1]).push(f);
  }
  for (const m of texto.matchAll(rePlantilla)) {
    const nombre = m[1].replace(/^\//, '');
    if (!plantillas.has(nombre)) plantillas.set(nombre, []);
    plantillas.get(nombre).push(f);
  }
}

console.log(`${literales.size} rutas literales distintas · ${plantillas.size} nombres usados en plantillas\n`);

const rotas = [];
for (const [ruta, quien] of literales) {
  if (!fs.existsSync(path.join('public', ruta.slice(1)))) {
    rotas.push(`${ruta}   ← ${[...new Set(quien)].slice(0, 2).join(', ')}`);
  }
}
console.log(rotas.length ? `RUTAS ROTAS: ${rotas.length}` : 'las rutas literales apuntan todas a un archivo que existe');
rotas.forEach((r) => console.log('  x ' + r));

// Las plantillas: para cada nombre, ¿en cuántas carpetas de actividad falta?
const dirActividades = path.join('public', 'assets', 'actividades');
const carpetas = fs.existsSync(dirActividades)
  ? fs.readdirSync(dirActividades, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];
console.log(`\ncarpetas de actividad: ${carpetas.length}`);
for (const [nombre, quien] of plantillas) {
  const tienen = carpetas.filter((c) => fs.existsSync(path.join(dirActividades, c, nombre))).length;
  if (tienen === 0) continue;   // no es un archivo por actividad, no dice nada
  const marca = tienen === carpetas.length ? 'todas' : `${tienen}/${carpetas.length}`;
  console.log(`  ${nombre.padEnd(28)} ${marca.padStart(10)}   (${[...new Set(quien)].length} archivos lo citan)`);
}

if (rotas.length) process.exitCode = 1;
