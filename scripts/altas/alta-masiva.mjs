/**
 * Alta masiva de una escuela: alumnos, docentes y grupos, de una sentada.
 *
 *   node scripts/altas/alta-masiva.mjs --archivo listas/froebel.csv \
 *     --escuela "Colegio Federico Froebel" --cct 15PPR1234X \
 *     --dominio froebel.tecnia.mx --nivel mixto --simulacro
 *
 * Quita `--simulacro` para que escriba de verdad.
 *
 * EL CSV. Cabecera obligatoria, en cualquier orden:
 *
 *   nombre,apellidos,rol,grupo,grado
 *   Ana Sofia,Perez Lopez,alumno,1A,P1
 *   Luis,Ramirez Soto,docente,"1A,1B",
 *
 * `rol` es alumno | docente | admin. Un docente puede llevar varios grupos
 * separados por coma: se le pone como titular de todos. `grado` es libre y
 * sólo describe al grupo (P1..P6, S1..S3, PREPA).
 *
 * POR QUÉ UN GUION CON LA LLAVE DE SERVICIO Y NO UNA PANTALLA. Crear usuarios
 * exige la llave secreta, y esa llave no está desplegada a propósito: una
 * pantalla de administrador que dé de alta cuentas es una puerta permanente
 * abierta a quien consiga una sesión de admin. Esto corre en el equipo de
 * quien ya tiene la llave, un rato, y se apaga.
 *
 * SE PUEDE REPETIR. Todo es «busca y si no está, crea». Un correo que ya
 * existe no se toca ni se le cambia la contraseña; sale marcado como `ya`.
 *
 * EMPIEZA SIEMPRE POR --simulacro. Imprime los correos que va a fabricar sin
 * escribir nada. Los nombres de niños los manda la escuela en una hoja de
 * cálculo hecha a mano: revisar esa lista antes de crear cuarenta y siete
 * cuentas cuesta cinco minutos, y deshacerlas cuesta la mañana.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { asignarCorreos, contrasena } from './correos.mjs';
import { resumen, veredicto } from './verificacion.mjs';

const URL_BASE = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`);
  return i > -1 ? args[i + 1] : porDefecto;
};
const bandera = (nombre) => args.includes(`--${nombre}`);

const ARCHIVO = opcion('archivo');
const ESCUELA = opcion('escuela');
const CCT = opcion('cct');
const NIVEL = opcion('nivel', 'mixto');
const DOMINIO = opcion('dominio');
const SALIDA = opcion('salida');
const SIMULACRO = bandera('simulacro');

if (!ARCHIVO || !ESCUELA || !DOMINIO) {
  console.error('Faltan argumentos. Uso:');
  console.error('  node scripts/altas/alta-masiva.mjs --archivo lista.csv \\');
  console.error('    --escuela "Colegio X" --dominio colegiox.tecnia.mx [--cct ...] [--nivel mixto] [--simulacro]');
  process.exit(1);
}
if (!SIMULACRO && (!URL_BASE || !LLAVE)) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.');
  console.error('La llave secreta NO esta desplegada: sacala de tu .env.local.');
  console.error('Para ver la lista sin escribir nada, usa --simulacro.');
  process.exit(1);
}

/* ── CSV ─────────────────────────────────────────────────────────────────── */

/** Lector de CSV con comillas, que es lo que sale de Excel. */
function leerCsv(texto) {
  const filas = [];
  let campo = '';
  let fila = [];
  let entreComillas = false;

  const limpio = texto.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < limpio.length; i += 1) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') { campo += '"'; i += 1; }
      else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }

  const noVacias = filas.filter((f) => f.some((x) => x.trim() !== ''));
  if (noVacias.length === 0) return [];

  const cabecera = noVacias[0].map((h) => h.trim().toLowerCase());
  return noVacias.slice(1).map((f) => {
    const o = {};
    cabecera.forEach((h, i) => { o[h] = (f[i] ?? '').trim(); });
    return o;
  });
}

const crudo = leerCsv(readFileSync(ARCHIVO, 'utf8'));
if (crudo.length === 0) {
  console.error(`El archivo ${ARCHIVO} no tiene filas.`);
  process.exit(1);
}

const ROLES = { alumno: 'student', docente: 'teacher', admin: 'admin' };

const personas = [];
const rechazadas = [];
for (const [i, f] of crudo.entries()) {
  const linea = i + 2;
  const rolEs = (f.rol || 'alumno').toLowerCase();
  if (!ROLES[rolEs]) { rechazadas.push({ linea, motivo: `rol desconocido: ${f.rol}`, f }); continue; }
  if (!f.nombre && !f.apellidos) { rechazadas.push({ linea, motivo: 'sin nombre', f }); continue; }
  personas.push({
    linea,
    nombre: f.nombre || '',
    apellidos: f.apellidos || '',
    rolEs,
    role: ROLES[rolEs],
    grupos: (f.grupo || '').split(',').map((g) => g.trim()).filter(Boolean),
    grado: f.grado || null,
  });
}

/* ── Supabase por REST, sin dependencias ─────────────────────────────────── */

async function api(ruta, opciones = {}) {
  const r = await fetch(`${URL_BASE}${ruta}`, {
    ...opciones,
    headers: {
      apikey: LLAVE,
      Authorization: `Bearer ${LLAVE}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  const texto = await r.text();
  let cuerpo = null;
  try { cuerpo = texto ? JSON.parse(texto) : null; } catch { cuerpo = texto; }
  if (!r.ok) {
    const e = new Error(`${r.status} ${ruta} :: ${typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)}`);
    e.status = r.status;
    e.cuerpo = cuerpo;
    throw e;
  }
  return cuerpo;
}

const rest = (t, q = '') => api(`/rest/v1/${t}${q}`);

/** Todos los correos que ya existen en auth, para no repetir ninguno. */
async function correosExistentes() {
  const vistos = new Map();
  for (let pagina = 1; pagina <= 50; pagina += 1) {
    const d = await api(`/auth/v1/admin/users?page=${pagina}&per_page=200`);
    const us = Array.isArray(d) ? d : (d.users || []);
    for (const u of us) if (u.email) vistos.set(u.email.toLowerCase(), u.id);
    if (us.length < 200) break;
  }
  return vistos;
}

/* ── Plan ────────────────────────────────────────────────────────────────── */

const nombresDeGrupo = [...new Set(personas.flatMap((p) => p.grupos))].sort();

console.log('');
console.log(`Escuela : ${ESCUELA}${CCT ? ` (CCT ${CCT})` : ''}`);
console.log(`Dominio : ${DOMINIO}`);
console.log(`Archivo : ${ARCHIVO}`);
console.log(`Personas: ${personas.length}  (alumnos ${personas.filter((p) => p.rolEs === 'alumno').length}` +
            `, docentes ${personas.filter((p) => p.rolEs === 'docente').length}` +
            `, admin ${personas.filter((p) => p.rolEs === 'admin').length})`);
console.log(`Grupos  : ${nombresDeGrupo.length}  [${nombresDeGrupo.join(', ')}]`);
if (rechazadas.length) {
  console.log('');
  console.log(`FILAS RECHAZADAS: ${rechazadas.length}`);
  for (const r of rechazadas) console.log(`  linea ${r.linea}: ${r.motivo}`);
}

const yaEnAuth = SIMULACRO && !LLAVE ? new Map() : await correosExistentes().catch((e) => {
  console.error('No se pudo leer la lista de usuarios:', e.message);
  process.exit(1);
});

const conCorreo = asignarCorreos(personas, DOMINIO, new Set(yaEnAuth.keys()));
const sinCorreo = conCorreo.filter((p) => !p.correo);

console.log('');
console.log('CORREOS QUE SE VAN A USAR');
for (const p of conCorreo) {
  const marca = p.correo && yaEnAuth.has(p.correo) ? 'ya  ' : (p.correo ? 'nuevo' : 'ERROR');
  const quien = `${p.nombre} ${p.apellidos}`.trim();
  console.log(`  ${marca.padEnd(6)} ${(p.correo ?? p.motivo).padEnd(42)} ${p.rolEs.padEnd(8)} ${p.grupos.join('|')}  <- ${quien}`);
}
if (sinCorreo.length) {
  console.log('');
  console.log(`${sinCorreo.length} personas sin correo asignable. Corrige el CSV y vuelve a correr.`);
}

if (SIMULACRO) {
  console.log('');
  console.log('SIMULACRO: no se escribio nada. Quita --simulacro para aplicarlo.');
  process.exit(sinCorreo.length ? 1 : 0);
}
if (sinCorreo.length) {
  console.log('');
  console.log('No se aplica nada mientras haya filas sin correo. Corrige el CSV.');
  process.exit(1);
}

/* ── Escritura ───────────────────────────────────────────────────────────── */

async function buscaOCrea(tabla, filtro, fila) {
  const q = Object.entries(filtro).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const hay = await rest(tabla, `?${q}&select=*&limit=1`);
  if (hay.length) return { registro: hay[0], creado: false };
  const nuevo = await api(`/rest/v1/${tabla}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(fila),
  });
  return { registro: nuevo[0], creado: true };
}

const escuela = await buscaOCrea(
  'escuelas',
  CCT ? { cct: CCT } : { nombre: ESCUELA },
  { nombre: ESCUELA, cct: CCT, nivel: NIVEL },
);
console.log('');
console.log(`Escuela ${escuela.creado ? 'creada' : 'ya existia'}: ${escuela.registro.id}`);

const gradoDeGrupo = new Map();
for (const p of personas) for (const g of p.grupos) if (p.grado && !gradoDeGrupo.has(g)) gradoDeGrupo.set(g, p.grado);

const grupos = new Map();
for (const nombre of nombresDeGrupo) {
  const g = await buscaOCrea(
    'grupos',
    { escuela_id: escuela.registro.id, nombre },
    { nombre, grado: gradoDeGrupo.get(nombre) ?? null, escuela_id: escuela.registro.id },
  );
  grupos.set(nombre, g.registro.id);
  console.log(`  grupo ${g.creado ? 'creado  ' : 'ya existe'} ${nombre} -> ${g.registro.id}`);
}

const credenciales = [];
const verificados = [];
let creados = 0;
let existentes = 0;
const fallos = [];

for (const p of conCorreo) {
  const nombreCompleto = `${p.nombre} ${p.apellidos}`.trim();
  const grupoPrincipal = p.rolEs === 'alumno' ? grupos.get(p.grupos[0]) ?? null : null;

  let id = yaEnAuth.get(p.correo) ?? null;
  let clave = null;

  if (!id) {
    clave = contrasena();
    try {
      const u = await api('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: p.correo,
          password: clave,
          email_confirm: true,
          user_metadata: {
            full_name: nombreCompleto,
            escuela_id: escuela.registro.id,
            ...(grupoPrincipal ? { group_id: grupoPrincipal } : {}),
          },
          /* El rol de la interfaz va en app_metadata y en espanol: solo lo
             escribe la llave de servicio, nunca el propio usuario. */
          app_metadata: { rol: p.rolEs },
        }),
      });
      id = u.id;
      creados += 1;
    } catch (e) {
      fallos.push({ correo: p.correo, motivo: e.message });
      continue;
    }
  } else {
    existentes += 1;
  }

  /*
   * EL PERFIL SE ESCRIBE AQUI, EXPLICITAMENTE, Y DESPUES SE RELEE.
   *
   * No se delega en el trigger. Un trigger que se equivoca no le puede
   * devolver el error a quien dio de alta, y el modo en que falla es
   * silencioso: el perfil nace con el rol por omision y sin escuela, y la
   * llamada responde 200.
   *
   * Y NO ES UN PATCH, ES UN UPSERT. Un PATCH sobre una fila que no existe
   * afecta a cero filas y PostgREST responde 204 No Content, que es
   * exactamente lo que responde cuando si actualizo: exito y fallo
   * indistinguibles. El upsert crea la fila si el trigger no llego a hacerlo.
   */
  const perfilEsperado = {
    id,
    role: p.role,
    full_name: nombreCompleto,
    email: p.correo,
    escuela_id: escuela.registro.id,
  };

  try {
    await api('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(perfilEsperado),
    });
  } catch (e) {
    fallos.push({ correo: p.correo, motivo: `perfil: ${e.message}` });
  }

  if (p.rolEs === 'alumno') {
    for (const nombreGrupo of p.grupos) {
      const idGrupo = grupos.get(nombreGrupo);
      if (!idGrupo) continue;
      try {
        await api('/rest/v1/alumnos_grupos', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({ id_alumno: id, id_grupo: idGrupo }),
        });
      } catch (e) {
        fallos.push({ correo: p.correo, motivo: `grupo ${nombreGrupo}: ${e.message}` });
      }
    }
  } else if (p.rolEs === 'docente') {
    for (const nombreGrupo of p.grupos) {
      const idGrupo = grupos.get(nombreGrupo);
      if (!idGrupo) continue;
      try {
        await api(`/rest/v1/grupos?id=eq.${idGrupo}`, {
          method: 'PATCH',
          body: JSON.stringify({ id_profesor: id }),
        });
      } catch (e) {
        fallos.push({ correo: p.correo, motivo: `titular de ${nombreGrupo}: ${e.message}` });
      }
    }
  }

  /*
   * RELEER. Es lo unico que distingue "lo escribi" de "quedo escrito".
   * Todo lo de arriba puede responder 200 y no haber dejado nada: el trigger
   * se traga sus errores, y un upsert que la RLS recorta tampoco protesta.
   */
  let comprobacion = { ok: false, problemas: ['no se pudo releer'] };
  try {
    const [perfilLeido] = await rest(
      'profiles',
      `?id=eq.${id}&select=id,role,full_name,email,escuela_id`,
    );
    const gruposEsperados = p.rolEs === 'alumno'
      ? p.grupos.map((g) => grupos.get(g)).filter(Boolean)
      : [];
    const gruposLeidos = gruposEsperados.length
      ? (await rest('alumnos_grupos', `?id_alumno=eq.${id}&select=id_grupo`)).map((f) => f.id_grupo)
      : [];
    comprobacion = veredicto({ esperado: perfilEsperado, perfilLeido, gruposEsperados, gruposLeidos });
  } catch (e) {
    comprobacion = { ok: false, problemas: [`no se pudo releer: ${e.message}`] };
  }

  verificados.push({ correo: p.correo, nombre: nombreCompleto, ...comprobacion });
  if (!comprobacion.ok) {
    for (const problema of comprobacion.problemas) {
      fallos.push({ correo: p.correo, motivo: problema });
    }
  }

  credenciales.push({
    nombre: nombreCompleto,
    rol: p.rolEs,
    grupo: p.grupos.join(' '),
    correo: p.correo,
    contrasena: clave ?? '(ya tenia cuenta)',
  });
}

/* ── Salida ──────────────────────────────────────────────────────────────── */

const celda = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const destino = SALIDA ?? `credenciales-${DOMINIO.split('.')[0]}-${new Date().toISOString().slice(0, 10)}.csv`;
const csv = [
  'nombre,rol,grupo,correo,contrasena',
  ...credenciales.map((c) => [c.nombre, c.rol, c.grupo, c.correo, c.contrasena].map(celda).join(',')),
].join('\n');
writeFileSync(destino, `﻿${csv}\n`, 'utf8');

const r = resumen(verificados);

console.log('');
console.log(`Cuentas creadas : ${creados}`);
console.log(`Ya existian     : ${existentes}`);
console.log('');
console.log(`COMPROBADO RELEYENDO: ${r.correctos} de ${r.total} perfiles quedaron como se pidio.`);
if (!r.exito) {
  console.log('');
  console.log('ESTAS PERSONAS NO QUEDARON BIEN:');
  for (const m of r.malos) {
    console.log(`  ${m.correo}  (${m.nombre})`);
    for (const problema of m.problemas) console.log(`      ${problema}`);
  }
  console.log('');
  console.log('Un perfil sin escuela no ve nada suyo, y un docente guardado como');
  console.log('alumno no puede entrar a su panel. Revisa antes de repartir claves.');
}

console.log('');
console.log(`Credenciales en ${destino}`);
console.log('ESE ARCHIVO LLEVA CONTRASENAS EN CLARO: entregalo y borralo. No lo subas al repositorio.');
process.exit(r.exito ? 0 : 1);
