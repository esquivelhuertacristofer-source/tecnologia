/**
 * ¿Qué clases se quedaron sin video, y de ésas cuáles ya lo tienen en disco?
 *
 * La bandera `assetsPendientes: true` de una entrada dice «esta clase todavía
 * no tiene video»: en vez de un reproductor roto, la pantalla avisa de que
 * llega después. Es una bandera puesta a mano, así que puede quedarse puesta
 * después de que el video exista — y entonces el alumno no lo ve aunque esté
 * grabado, subido a R2 y sirviéndose bien.
 *
 * Esto cruza las dos cosas: la bandera contra el archivo.
 *
 *   node scripts/auditoria/videos-pendientes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

function fuentes(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuentes(p, salida);
    else if (/\.tsx?$/.test(e.name)) salida.push(p);
  }
  return salida;
}

let conBandera = 0;
const pendientes = [];
for (const f of fuentes(path.join('src', 'components', 'activities'))) {
  const s = fs.readFileSync(f, 'utf-8');
  const m = /assetsPendientes:\s*(true|false)/.exec(s);
  if (!m) continue;
  conBandera += 1;
  if (m[1] !== 'true') continue;
  const ids = [...s.matchAll(/actividadId:\s*'([a-z0-9-]+)'/g)].map((x) => x[1]);
  pendientes.push({ archivo: f.split(path.sep).join('/'), ids });
}

const yaTienen = [];
const faltan = [];
const sinId = [];
for (const p of pendientes) {
  if (p.ids.length === 0) { sinId.push(p.archivo); continue; }
  for (const id of p.ids) {
    const v = path.join('public', 'assets', 'actividades', id, 'video-explicativo.mp4');
    (fs.existsSync(v) ? yaTienen : faltan).push({ id, archivo: p.archivo, bytes: fs.existsSync(v) ? fs.statSync(v).size : 0 });
  }
}

console.log(`componentes con la bandera: ${conBandera}`);
console.log(`de ésos, con video PENDIENTE: ${pendientes.length}`);
console.log('');
console.log(`── el video YA existe en disco, la bandera sobra: ${yaTienen.length}`);
for (const x of yaTienen) console.log(`   ${x.id.padEnd(34)} ${(x.bytes / 1048576).toFixed(1)} MB   ${x.archivo}`);
console.log('');
console.log(`── el video NO existe, hay que fabricarlo: ${faltan.length}`);
for (const x of faltan) console.log(`   ${x.id.padEnd(34)} ${x.archivo}`);
if (sinId.length) {
  console.log('');
  console.log(`── con la bandera pero sin actividadId literal (hay que mirarlos a mano): ${sinId.length}`);
  sinId.forEach((f) => console.log('   ' + f));
}
