'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { EjecucionSQL, GuionDatos, PasoDatos } from '@/components/simuladores/datos/ventana';
import { aceptado, crearPanelJuezSql } from '@/components/simuladores/juez';
import { SalaDatos, type ClaseDatos } from './SalaDatos';
import { BASE_CLUB } from './siembrasClub';
import { PROBLEMAS_SQL } from './problemasSql';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «Bases de datos y SQL», parada 2 de 3 · `n10-consultas-sql`
 * Bachillerato · 15–18 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Documento maestro §68. Reescrita el 12-sep-2026, sobre el juez.
 *
 * ── Qué era y por qué se reescribió ────────────────────────────────────────
 *
 * Era el caso más descarado de la familia F2 de la auditoría —los catorce
 * laboratorios que dictan la solución—, y no hace falta argumentarlo: su
 * primer encargo decía
 *
 *     instruccion: 'SELECT nombre, grado FROM integrantes ORDER BY nombre;'
 *     pista:       'SELECT nombre, grado FROM integrantes ORDER BY nombre;'
 *
 * La instrucción ERA la respuesta, y la pista la repetía por si acaso. Los
 * nueve encargos estaban escritos así. Un alumno podía terminar la clase
 * entera copiando nueve cadenas de texto de un panel a un editor sin haber
 * decidido nunca qué columna pedir ni por qué ordenar.
 *
 * Y había un segundo agujero, del que ya habla `siembrasClub.ts`: las doce
 * filas estaban sembradas en orden alfabético, así que incluso el que no
 * copiaba aprobaba el primer encargo sin escribir el `ORDER BY`.
 *
 * ── Qué es ahora ───────────────────────────────────────────────────────────
 *
 * Siete problemas con juez. Cada uno dice **qué tabla hay que devolver** —el
 * enunciado— y **con qué columnas y en qué orden** —el contrato—, enseña un
 * ejemplo con sus filas de verdad, y guarda **dos casos ocultos que corren
 * sobre otra siembra distinta**: otro club, con otra gente, otros equipos y
 * otros números de equipo. Catorce casos ocultos de veintiuno.
 *
 * Que el caso oculto sea **otra tabla** y no la misma con otros números es lo
 * que cierra las dos puertas de golpe: no se puede aprobar copiando las filas
 * del ejemplo, y no se puede aprobar aprovechando cómo están sembrados los
 * datos. El problema 7 lo lleva al extremo a propósito —«Los Circuitos» tiene
 * un número de equipo distinto en cada siembra—, así que filtrar por el número
 * pasa el caso visible y cae en los ocultos. Ése es el único problema cuyo
 * enunciado avisa, porque la lección que enseña es precisamente esa diferencia
 * entre un identificador interno y un nombre.
 *
 * ── Lo que se sigue enseñando, y con qué problema ───────────────────────────
 *
 * `ORDER BY` (1), `WHERE` + `DESC` (2), `LIKE` con su comodín (3), varias
 * columnas de orden + `LIMIT` (4), `JOIN … ON` con el error de columna
 * ambigua y `AS` (5), `IS NULL` (6) y un `JOIN` con filtro sobre la segunda
 * tabla (7). Los dos encargos de cierre son los de antes y se quedan: la tabla
 * de 150 sesiones y el tope de 100 filas del pie de la rejilla, que es lo único
 * de esta clase que no se puede aprender resolviendo un problema — hay que
 * verlo en pantalla.
 *
 * **A propósito, esta clase NO usa `COUNT`/`SUM`/`AVG`/`GROUP BY`/`HAVING`.**
 * `subconjunto.ts` es explícito: esas cinco piezas las pide
 * `n10-conecta-tus-datos` (canon, fila 89), y «si ninguna clase agrupa,
 * sobran». Meterlas aquí habría sido inventar una capacidad que esta fila del
 * canon no pide.
 *
 * ── Los dos errores que se siguen provocando, pero ahora sin dictarlos ──────
 *
 * 1. **Columna ambigua.** El problema 5 no le pide al alumno que provoque el
 *    error: le pide el nombre del integrante junto al de su equipo, y las dos
 *    tablas tienen una columna `nombre`. El error le sale solo, en su primer
 *    intento, y la segunda pista se lo explica cuando ya lo ha visto.
 * 2. **`NULL` dentro de un `JOIN`.** El problema 5 devuelve once filas de doce
 *    integrantes, y el juez lo acepta: esas once son la respuesta correcta. El
 *    que falta es el problema 6, cuyo enunciado empieza diciendo «en el
 *    problema anterior desapareció gente». La avería se convierte en el
 *    enunciado siguiente en vez de en una pregunta de opción múltiple.
 *
 * ── Qué texto juzga el juez ────────────────────────────────────────────────
 *
 * **Todo el archivo, y mira el resultado de la última consulta** (ver
 * `juezSql.ts`). No es un detalle de implementación escondido: está escrito en
 * la cabecera de la plantilla y en la instrucción del primer encargo, porque
 * determina cómo se trabaja —una consulta a la vez, borrando o comentando la
 * anterior— y porque un alumno que no lo sepa va a ver rechazada una consulta
 * correcta por culpa de otra que dejó arriba a medio escribir.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'consultas.sql';

const PLANTILLA = [
  '-- consultas.sql · el club de robótica, ya con datos',
  '--',
  '-- El problema está en el panel de la derecha, con su contrato y su ejemplo.',
  '-- Escribe aquí tu consulta y pulsa «Enviar al juez».',
  '--',
  '-- El juez corre TODO este archivo y se queda con el resultado de la ÚLTIMA',
  '-- consulta. Si dejas arriba la del problema anterior, no pasa nada; si la',
  '-- dejas a medio escribir, sí.',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

const PanelJuezClub = crearPanelJuezSql({ problemas: PROBLEMAS_SQL });

/* ─────────────────────────────── el guion ────────────────────────────────── */

/**
 * La frase que se lleva el alumno de cada problema. No repite el enunciado:
 * dice lo que el problema le enseñó y que sirve fuera de él.
 */
const APRENDIDO: Readonly<Record<string, string>> = {
  's1-la-lista':
    'Las filas de una tabla no tienen orden propio. Si tu respuesta necesita un orden, hay que pedirlo: nunca se hereda.',
  's2-los-de-tercero': 'Filtrar y ordenar son dos decisiones distintas, y el motor las hace en ese orden: primero quita, luego acomoda.',
  's3-empiezan-por-a': 'Buscar «algo que se parece a» no es buscar «algo igual a». Son dos preguntas distintas y se escriben distinto.',
  's4-el-podio':
    'Cortar a las primeras filas sólo significa algo si antes dijiste cuáles son las primeras — y el desempate es parte de decirlo.',
  's5-quien-con-quien':
    'Un número de equipo no es un equipo: es una flecha a otra tabla. Juntarlas es seguir la flecha, y hay que decir de qué tabla es cada columna.',
  's6-sin-equipo': 'NULL no es un valor: es la ausencia de valor. No se le puede preguntar si es igual a algo, ni siquiera a otro NULL.',
  's7-la-plantilla':
    'Lo que un identificador vale hoy puede no valer mañana. Filtrar por el nombre de la cosa y no por su número interno es la diferencia entre una consulta que sirve y una que funcionaba.',
};

/** Lo que se le dice en el encargo, aparte de lo que ya dice el enunciado del panel. */
const ENCUADRE: Readonly<Record<string, string>> = {
  's1-la-lista':
    'El juez corre todo tu archivo y mira el resultado de la última consulta, así que puedes probar las que quieras antes de enviar.',
  's2-los-de-tercero': 'Dos cosas a la vez, y el juez comprueba las dos.',
  's3-empiezan-por-a': 'Aquí el orden de las filas da igual: el juez no lo mira.',
  's4-el-podio': 'Lee el enunciado dos veces. Hay una frase sobre los empates que no está de adorno.',
  's5-quien-con-quien': 'Tu primer intento probablemente no corra. Lee lo que te dice el motor: te está diciendo algo cierto.',
  's6-sin-equipo': 'Es el integrante que el problema anterior perdió por el camino.',
  's7-la-plantilla': 'Este problema tiene trampa, y el enunciado te dice dónde. Los casos ocultos son otros clubes.',
};

const PASOS_DE_PROBLEMA: PasoDatos[] = PROBLEMAS_SQL.map((p, i) => ({
  id: p.id,
  titulo: p.titulo,
  instruccion: `${p.enunciado} · El contrato de columnas y el ejemplo están en el panel de la derecha; cuando creas que tu consulta está lista, pulsa «Enviar al juez». ${ENCUADRE[p.id]}`,
  pista: p.pistas[0],
  senal: { control: i === 0 ? 'esquema' : 'editor' },
  /* `programa`, no `ejecucion`: lo que cierra el encargo es el veredicto del
   * juez —que corrió la consulta contra TRES bases distintas—, no lo que haya
   * devuelto el ▶ del alumno contra la suya. `aceptado` exige además que el
   * texto sea el MISMO que se envió, así que cambiar la consulta después de
   * aprobar reabre el encargo, que es lo correcto. */
  logro: { tipo: 'programa', comprueba: (sql) => aceptado(p.id, sql) },
  aprendido: APRENDIDO[p.id],
}));

/** ¿Alguna consulta de la ejecución devolvió las 150 sesiones? */
function trajoLasSesiones(e: EjecucionSQL): boolean {
  return e.ok && e.resultados.some((r) => r.clase === 'consulta' && r.filas.length === 150);
}

const GUION: GuionDatos = {
  pasos: [
    ...PASOS_DE_PROBLEMA,
    {
      id: 'muchas-filas',
      titulo: 'Una tabla grande de verdad',
      instruccion:
        'Se acabaron los problemas. Queda una cosa que no se aprende resolviendo nada: hay que verla. El club lleva el registro de cada sesión de entrenamiento desde que abrió, en la tabla «sesiones». Pídelas todas con ▶ y mira el PIE de la rejilla, no sólo las filas.',
      pista: 'Todas las filas y todas las columnas de una tabla se piden con el asterisco.',
      senal: { control: 'ejecutar' },
      logro: { tipo: 'ejecucion', comprueba: trajoLasSesiones },
      aprendido: 'El resultado trae las 150 filas; la pantalla sólo DIBUJA 100 para no colgar el navegador — y lo dice en el pie.',
    },
    {
      id: 'cuantas-de-verdad',
      titulo: 'Para cerrar · Lee el pie de la tabla',
      instruccion: '¿Cuántas sesiones hay en total, aunque la rejilla sólo pinte 100 filas?',
      pista: 'El pie dice «se muestran las primeras 100 de …». Ese segundo número es el total de verdad.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          '150: el resultado está completo y lo que se recorta es el dibujo.',
          '100: la consulta devolvió 100 filas.',
          'No se puede saber sin contarlas a mano.',
        ],
        correcta: 0,
      },
      aprendido:
        'Los datos están completos aunque la pantalla recorte el dibujo. Confundir lo que una pantalla enseña con lo que una consulta devuelve es el error que está detrás de la mitad de los informes mal hechos del mundo.',
    },
  ],
  cierre:
    'Siete problemas resueltos contra tres bases distintas: la tuya y dos que no habías visto. Filtraste, ordenaste, buscaste por patrón, cortaste el resultado, juntaste dos tablas y encontraste al que se quedó fuera — y ninguna de las siete te la dictó nadie.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseDatos = {
  actividadId: 'n10-consultas-sql',
  titulo: 'Consultas SQL',
  archivo: ARCHIVO,
  insignia: { nombre: 'Consultora de datos', emoji: '🔍' },
  minutos: 45,
  portada: {
    situacion: 'Nivel 10 · Bases de datos y SQL · Parada 2 de 3',
    tema: 'Consultas SQL: siete problemas y un juez que usa datos que no has visto',
    objetivo:
      'Hoy nadie te dice qué teclear. Hay siete problemas: cada uno describe la tabla que tienes que devolver, con qué columnas y en qué orden, y te enseña un ejemplo. Escribes tu consulta, la envías, y el juez la corre contra la base que tienes abierta y contra dos clubes más que no has visto nunca. Que funcione con el ejemplo no basta.',
    vasAHacer: [
      'Devolver tablas concretas: la lista del club, los que se graduan, el podio, el que se quedó sin equipo.',
      'Ordenar, filtrar, buscar por patrón, cortar el resultado y juntar dos tablas — eligiendo tú qué hace falta en cada problema.',
      'Leer veredictos: cuántos casos pasan, cuál falla y qué devolvió tu consulta en lugar de lo que se esperaba.',
      'Descubrir por qué un JOIN pierde filas, y por qué filtrar por un número de equipo es una consulta que funcionaba.',
    ],
  },
  plantilla: PLANTILLA,
  baseInicial: BASE_CLUB,
  guion: GUION,
  panelFijo: { titulo: 'El juez del club', Cuerpo: PanelJuezClub },
  bit: {
    inicio:
      'La base del club ya está montada: equipos, integrantes y el registro de sesiones. Hoy sólo preguntas — y hay un juez. Le mandas tu consulta y la corre con datos que tú no has visto. Que funcione con el ejemplo no significa nada; eso lo vas a descubrir en el primer envío.',
    cierre:
      'Siete aceptados contra tres bases distintas. Y de todas, la que más vale es la séptima: el número de un equipo cambia de un año a otro y su nombre no. Quien aprende eso deja de escribir consultas que funcionaban.',
  },
  final: {
    titulo: '¡Puedes consultar una base de verdad!',
    detalle:
      'Siete problemas con juez y catorce casos ocultos. Filtros, orden, patrón, corte y unión — y la lección que se lleva cualquiera que use SQL en serio: un JOIN sólo trae lo que casa, NULL no casa con nada, y un identificador interno no es un nombre.',
  },
};

export function LabConsultasSql(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaDatos {...props} clase={CLASE} />;
}

export { CLASE, GUION, PLANTILLA, PROBLEMAS_SQL };

export default LabConsultasSql;
