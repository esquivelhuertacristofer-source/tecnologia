/**
 * Estudio de impacto — exportación para análisis (§11).
 *
 * Saca en CSV lo que va a recibir la universidad: respuestas de cuestionarios,
 * dosis semanal, eventos, contexto de plantel, consentimientos y bitácora
 * docente. Cada columna está descrita en `docs/README_export.md`.
 *
 * ES UN GUION Y NO UN ENDPOINT, a propósito. Un endpoint de administrador que
 * devuelve el volcado entero del estudio es una puerta permanente al dato más
 * sensible del proyecto, abierta a quien consiga una sesión de admin. Un guion
 * que corre en el equipo de quien tiene la llave secreta no está expuesto a
 * internet, y esa llave **no está desplegada** (ver `DESPLIEGUE-CLOUDFLARE.md`).
 *
 * LO QUE NUNCA SALE. `estudio_alumnos` —la única tabla que une el seudónimo con
 * la cuenta real— no se exporta jamás. Es lo que hace que el volcado sea
 * anónimo, y por eso el guion se niega en redondo si alguien se la pide.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/estudio/exportar.mjs [--escuela sec-14-toluca] [--salida ./export]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const URL_BASE = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !LLAVE) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.');
  console.error('La llave secreta NO está desplegada: sácala de tu .env.local.');
  process.exit(1);
}

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`);
  return i > -1 ? args[i + 1] : porDefecto;
};

const ESCUELA = opcion('escuela');
const DESTINO = opcion('salida', './export-estudio');

/** Tablas y vistas que se exportan. NUNCA `estudio_alumnos`. */
const FUENTES = [
  { nombre: 'respuestas', tabla: 'estudio_respuestas' },
  { nombre: 'cuestionarios_aplicados', tabla: 'estudio_cuestionarios_aplicados' },
  { nombre: 'eventos', tabla: 'eventos_aprendizaje' },
  { nombre: 'dosis_semanal', tabla: 'estudio_dosis' },
  { nombre: 'contexto_escuela', tabla: 'estudio_contexto_escuela' },
  { nombre: 'consentimientos', tabla: 'consentimientos' },
  { nombre: 'bitacora_docente', tabla: 'estudio_bitacora_docente' },
  { nombre: 'errores', tabla: 'estudio_errores' },
];

/**
 * Columnas que se tachan antes de escribir el CSV.
 *
 * `consentimientos` es la única tabla exportada con datos ligados a una cuenta
 * —es una prueba legal, no telemetría— así que sale sin el `uuid` de la cuenta
 * y sin el user-agent: para el análisis basta saber CUÁNTOS consintieron, con
 * qué versión y cuándo.
 */
const TACHAR = {
  consentimientos: ['cuenta', 'user_agent', 'tutor_de', 'codigo', 'ip_truncada'],
  estudio_contexto_escuela: ['capturado_por'],
};

const PROHIBIDA = 'estudio_alumnos';

/** Escapa un valor para CSV según RFC 4180. */
function celda(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function aCsv(filas) {
  if (filas.length === 0) return '';
  const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))];
  const cuerpo = filas.map((f) => columnas.map((c) => celda(f[c])).join(','));
  return [columnas.join(','), ...cuerpo].join('\r\n') + '\r\n';
}

/** Trae una tabla entera paginando: PostgREST tope en 1000 filas por petición. */
async function traer(tabla) {
  if (tabla === PROHIBIDA) throw new Error(`${PROHIBIDA} no se exporta nunca`);

  const filas = [];
  const PASO = 1000;
  for (let desde = 0; ; desde += PASO) {
    const u = new global.URL(`${URL_BASE}/rest/v1/${tabla}`);
    u.searchParams.set('select', '*');
    const r = await fetch(u, {
      headers: {
        apikey: LLAVE,
        Authorization: `Bearer ${LLAVE}`,
        Range: `${desde}-${desde + PASO - 1}`,
        Accept: 'application/json',
      },
    });
    if (!r.ok) throw new Error(`${tabla}: HTTP ${r.status} ${await r.text()}`);
    const lote = await r.json();
    filas.push(...lote);
    if (lote.length < PASO) break;
  }
  return filas;
}

function limpiar(tabla, filas) {
  const fuera = TACHAR[tabla];
  if (!fuera) return filas;
  return filas.map((f) => {
    const copia = { ...f };
    for (const c of fuera) delete copia[c];
    return copia;
  });
}

const marca = new Date().toISOString().slice(0, 10);
const carpeta = join(DESTINO, ESCUELA ? `${marca}-${ESCUELA}` : marca);
mkdirSync(carpeta, { recursive: true });

console.log(`Exportando a ${carpeta}${ESCUELA ? ` (escuela ${ESCUELA})` : ' (todas las escuelas)'}\n`);

let total = 0;
for (const { nombre, tabla } of FUENTES) {
  try {
    const filas = limpiar(tabla, await traer(tabla));
    const csv = aCsv(filas);
    writeFileSync(join(carpeta, `${nombre}.csv`), csv, 'utf8');
    console.log(`  ${nombre.padEnd(26)} ${String(filas.length).padStart(7)} filas`);
    total += filas.length;
  } catch (e) {
    // Una tabla que falla no puede llevarse por delante el resto del volcado.
    console.error(`  ${nombre.padEnd(26)} ERROR: ${e.message}`);
  }
}

/*
 * EL FILTRO POR ESCUELA NO ESTÁ HECHO, Y SE DICE EN VEZ DE FINGIRLO.
 *
 * Las tablas de eventos guardan `alumno` (el seudónimo) y no `escuela_id`:
 * filtrar por escuela obliga a pasar por `estudio_alumnos`, que es justo la
 * tabla que este guion tiene prohibido tocar. Se resuelve añadiendo
 * `escuela_id` a las tablas de eventos —está en PENDIENTES_ESTUDIO.md— y
 * mientras tanto se exporta todo y el filtro se hace en el análisis.
 */
if (ESCUELA) {
  console.log(
    `\n  AVISO: --escuela todavía no filtra. Las tablas de eventos no guardan\n` +
    `  la escuela, sólo el seudónimo del alumno. Se exportó TODO. Ver\n` +
    `  PENDIENTES_ESTUDIO.md → «escuela_id en las tablas de eventos».`,
  );
}

console.log(`\n${total.toLocaleString('es-MX')} filas en total.`);
console.log('Recuerda: `estudio_alumnos` NO se exporta. Sin ella, este volcado es anónimo.');
