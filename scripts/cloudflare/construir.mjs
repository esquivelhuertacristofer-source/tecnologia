/**
 * El build de Cloudflare, con los videos fuera y devueltos pase lo que pase.
 *
 * `opennextjs-cloudflare build` copia `public/` entero dentro de
 * `.open-next/assets`. Con 4,46 GB de video eso son cinco minutos de copia,
 * otros 4,46 GB de disco, y un despliegue que además fallaría: Workers Assets
 * rechaza cualquier archivo de más de 25 MiB y 30 de los videos lo pasan.
 *
 * Así que aquí se aparta, se construye y se devuelve. El `finally` es el punto
 * importante: si el build revienta a mitad, los videos vuelven igual. Sin él,
 * un fallo dejaría `public/assets` sin videos y la siguiente persona que
 * abriera la plataforma en local encontraría 238 pantallas sin video sin
 * ninguna pista de por qué.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const medios = path.join(AQUI, 'medios.mjs');

/*
 * `shell: true` sólo para `npx`. Para node NO: en Windows el ejecutable vive en
 * «C:\Program Files\nodejs\node.exe» y, pasado por el shell, el espacio parte
 * el comando en dos («"C:\Program" no se reconoce como un comando…»).
 */
/*
 * EL MONTÓN DE NODE. El contenedor de Cloudflare Workers Builds le da a Node
 * un montón de ~2 GB por omisión, y compilar 235 actividades con three.js
 * dentro se lo come: el build moría con «Ineffective mark-compacts near heap
 * limit — JavaScript heap out of memory». Se sube a 4 GB, que es holgado sin
 * pasarse del contenedor. Si alguien ya trae su propio NODE_OPTIONS, manda el
 * suyo: no es asunto de este guion pisarlo.
 */
const ENTORNO = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
};

function corre(cmd, args, etiqueta, { shell = false } = {}) {
  const r = spawnSync(cmd, args, { cwd: RAIZ, stdio: 'inherit', shell, env: ENTORNO });
  if (r.status !== 0) throw new Error(`${etiqueta} falló con código ${r.status}`);
}

/*
 * La caché de webpack se tira antes de cada build de despliegue. No es
 * higiene: es que crece sin techo —se midió en 3,76 GB dentro de `.next`— y
 * este equipo trabaja con 10 GB libres y 5 GB de medios al lado. Un build que
 * se queda sin disco no falla limpio: revienta a mitad de copiar
 * `libvips-42.dll` y deja `.next/standalone` a medias. Cuesta minuto y medio
 * de compilación y evita eso.
 */
const cache = path.join(RAIZ, '.next', 'cache');
function tiraLaCache(cuando) {
  if (!fs.existsSync(cache)) return;
  fs.rmSync(cache, { recursive: true, force: true });
  console.log(`caché de webpack borrada (${cuando})`);
}
tiraLaCache('antes de construir');

let apartado = false;
try {
  corre(process.execPath, [medios, 'apartar'], 'apartar los videos');
  apartado = true;
  corre('npx', ['opennextjs-cloudflare', 'build'], 'el build de OpenNext', { shell: true });
} finally {
  // Y otra vez al salir: el build la deja escrita en 2,16 GB. Borrarla sólo
  // antes serviría para construir hoy y quedarse sin disco mañana.
  tiraLaCache('después de construir');
  if (apartado) {
    const r = spawnSync(process.execPath, [medios, 'devolver'], {
      cwd: RAIZ, stdio: 'inherit',
    });
    if (r.status !== 0) {
      console.error('\n*** LOS VIDEOS NO VOLVIERON A public/assets ***');
      console.error('*** Ejecuta: node scripts/cloudflare/medios.mjs devolver ***\n');
    }
  }
}
