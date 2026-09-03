/**
 * SEXTA PUERTA — LA BANDERA CONTRA EL DISCO.
 *
 * `EntradaN4Base` y `EntradaN5Base` deciden qué enseñar en el hueco del
 * reproductor con una sola línea de la entrada:
 *
 *     assetsPendientes: true   → «El video de esta clase todavía se está grabando.»
 *     (sin la línea)           → <video src="/assets/actividades/<id>/video-explicativo.mp4">
 *
 * Son **dos hechos distintos**: la bandera vive en el `.tsx` y el archivo vive
 * en `public/`. Nadie los cose, y los dos se desincronizan en las dos
 * direcciones, cada una con su avería:
 *
 *   · bandera puesta y archivo presente  → el video está hecho y **nadie lo ve**.
 *     Le pasó a `n10-consultas-sql`: renderizado y publicado el 18-ago-2026,
 *     enseñando «se está grabando» hasta el 1-sep-2026. Catorce días de una
 *     clase con su video escondido detrás de un aviso, y sin un solo error en
 *     consola que lo delatara.
 *   · bandera quitada y archivo ausente  → un `<video>` que apunta a un 404.
 *     En Chrome eso es un rectángulo negro mudo; el alumno cree que su internet
 *     falla. Es la avería que la auditoría del 1-sep-2026 encontró en 7 clases.
 *
 * Esta puerta compara las dos listas y falla si discrepan. No juzga el video
 * (eso lo hace `revisa-guion.py` antes de renderizar): sólo comprueba que lo que
 * la entrada promete es lo que hay en el disco.
 *
 * Lee el `actividadId` de cada entrada aceptando las dos formas que conviven en
 * el árbol —el literal `actividadId: 'n7-…'` y el indirecto `actividadId:
 * ACTIVIDAD` con su `const ACTIVIDAD = 'n10-…'` arriba—, porque medir sólo la
 * primera fue exactamente lo que hizo que esta avería tardara dos semanas en
 * salir: un `grep` del literal deja fuera 28 archivos y devuelve un silencio
 * tranquilizador.
 *
 *   node scripts/auditoria/video-vs-bandera.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = join(RAIZ, 'src', 'components', 'activities');
const VIDEO = (id) => join(RAIZ, 'public', 'assets', 'actividades', id, 'video-explicativo.mp4');

function todos(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) todos(p, acc);
    else if (/\.tsx$/.test(e)) acc.push(p);
  }
  return acc;
}

/** El id que la entrada declara, sea literal o a través de una `const` del mismo archivo. */
function idDeclarado(texto) {
  const directo = texto.match(/actividadId:\s*'([a-z0-9-]+)'/);
  if (directo) return directo[1];
  const indirecto = texto.match(/actividadId:\s*([A-Z_][A-Z0-9_]*)\s*,/);
  if (!indirecto) return null;
  const constante = texto.match(
    new RegExp(`const\\s+${indirecto[1]}\\s*(?::[^=]+)?=\\s*'([a-z0-9-]+)'`),
  );
  return constante ? constante[1] : null;
}

/**
 * `assetsPendientes` sólo cuenta cuando está **puesta a true en el objeto de
 * configuración**: el tipo la declara opcional en las dos bases, y varias
 * entradas la nombran en su comentario de cabecera para explicar por qué NO la
 * llevan. Un `includes('assetsPendientes')` daría por pendiente a media
 * plataforma.
 */
const pendiente = (texto) => /^\s*assetsPendientes:\s*true\s*,/m.test(texto);

const escondidos = []; // video hecho, bandera puesta → nadie lo ve
const rotos = []; // sin video, sin bandera → reproductor a 404
let miradas = 0;

for (const archivo of todos(BASE)) {
  const texto = readFileSync(archivo, 'utf8');
  if (!/actividadId:/.test(texto)) continue;
  /*
   * Sólo las entradas pintan el reproductor; los laboratorios repiten el id.
   * Una entrada se reconoce porque **importa** una plantilla de estudio, sea
   * cual sea: hay cuatro vivas (N4, N5, N6 y la de situación de N7) y nombrar
   * dos a mano dejaba fuera niveles enteros sin decir nada — que es la misma
   * forma de fallar que esta puerta existe para cazar.
   */
  if (!/^import .*\bEntrada\w*Base\b/m.test(texto)) continue;

  const id = idDeclarado(texto);
  if (!id) {
    console.log(`  ojo   ${relative(RAIZ, archivo)}: no pude leer su actividadId`);
    continue;
  }
  miradas++;
  const hay = existsSync(VIDEO(id));
  const dice = pendiente(texto);
  if (hay && dice) escondidos.push([id, relative(RAIZ, archivo)]);
  if (!hay && !dice) rotos.push([id, relative(RAIZ, archivo)]);
}

for (const [id, f] of escondidos) {
  console.log(`  ESCONDIDO  ${id}`);
  console.log(`             el video existe y la entrada enseña el aviso — quita assetsPendientes`);
  console.log(`             ${f}`);
}
for (const [id, f] of rotos) {
  console.log(`  ROTO       ${id}`);
  console.log(`             no hay video y la entrada pinta el reproductor — pon assetsPendientes: true`);
  console.log(`             ${f}`);
}

const mal = escondidos.length + rotos.length;
/*
 * El número de entradas miradas se imprime siempre y a propósito: un «bien» sin
 * él es indistinguible de un filtro que no encontró nada que mirar, y esa es la
 * manera favorita que tiene una puerta de estar rota sin que nadie lo note.
 */
console.log(
  mal === 0
    ? `  bien  ${miradas} entradas, cada una promete lo que hay en el disco`
    : `  ${mal} de ${miradas} entradas mienten sobre su video`,
);
process.exit(mal === 0 ? 0 : 1);
