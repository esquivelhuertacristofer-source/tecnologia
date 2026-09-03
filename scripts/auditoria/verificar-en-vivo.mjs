/**
 * Verificación EN VIVO de los arreglos más visibles de la auditoría.
 * No mide nada de oídas: abre la plataforma de verdad y toma la medida.
 *
 *   node verificar-en-vivo.mjs            (espera el servidor en :3002)
 */
// En Windows un import() con ruta absoluta se lee como protocolo `c:`; va por file://
import { pathToFileURL } from 'node:url';
const donde = process.env.PLAYWRIGHT_PATH;
const { chromium } = await import(donde ? pathToFileURL(donde + '/index.mjs').href : 'playwright');

const BASE = process.env.BASE || 'http://localhost:3002';
const di = (...a) => console.log(...a);

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });

const errores = [];
ctx.on('page', (p) => p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); }));
ctx.on('page', (p) => p.on('pageerror', (e) => errores.push('pageerror: ' + e.message)));

/** Entra al hub como alumno demo (no hay login real: se guarda el perfil y ya). */
async function comoAlumno(ruta) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/log-in`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => {
    localStorage.setItem('tecnia_perfil', JSON.stringify({
      nombre: 'Auditoria', grado: '1° de Secundaria', grupo: 'A', avatar: '🤖', nivelActual: 7,
    }));
  });
  await p.goto(BASE + ruta, { waitUntil: 'networkidle' });
  return p;
}

let ok = 0;
let revisar = 0;
const veredicto = (bien, texto) => { if (bien) ok++; else revisar++; di('   VEREDICTO:', bien ? 'OK — ' + texto : 'REVISAR — ' + texto); };

/* ── 1 · Las clases sin video enseñan el aviso, no un reproductor muerto ──── */
for (const [n, id] of [[10, 'n10-amenazas-y-defensa'], [7, 'n7-sistemas-operativos'], [8, 'n8-javascript-basico']]) {
  const p = await comoAlumno(`/hub/nivel/${n}/actividad/${id}`);
  const aviso = await p.locator('.video-pendiente').count();
  const video = await p.locator('video').count();
  di(`1) ${id}: aviso=${aviso} video=${video}`);
  veredicto(aviso === 1 && video === 0, 'aviso honesto y sin reproductor roto');
  await p.close();
}

/* ── 2 · La portada de n6-proyecto-integrador ya no colapsa a 0 px ───────── */
{
  const p = await comoAlumno('/hub/nivel/6/actividad/n6-proyecto-integrador');
  const cta = p.locator('button, a').filter({ hasText: /investiga|empezar|iniciar|entrar|laboratorio/i }).first();
  if (await cta.count()) { await cta.click().catch(() => {}); await p.waitForTimeout(1500); }
  const caja = await p.locator('.pgw-portada').first().boundingBox().catch(() => null);
  di('2) n6-proyecto-integrador .pgw-portada =', JSON.stringify(caja));
  veredicto(caja !== null && caja.height > 400, 'la portada ocupa la pantalla');
  await p.close();
}

/* ── 3 · Las cabeceras de seguridad las pone el proxy, no el middleware ──── */
{
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const h = r.headers();
  const exigidas = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy'];
  const faltan = exigidas.filter((k) => !(k in h));
  di('3) cabeceras que faltan:', faltan.length ? faltan.join(', ') : 'ninguna');
  veredicto(faltan.length === 0, 'las cinco cabeceras vienen puestas');
  await p.close();
}

di('');
di(`RESUMEN: ${ok} OK · ${revisar} por revisar`);
di('errores de consola recogidos:', errores.length);
for (const e of errores.slice(0, 12)) di('   ·', e);

await navegador.close();
