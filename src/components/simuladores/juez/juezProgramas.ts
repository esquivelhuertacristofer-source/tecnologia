/**
 * El juez · `juezProgramas.ts` — juzgar un programa entero: lo que se teclea y
 * lo que contesta (§68.4).
 *
 * El juez de `juezPython.ts` llama a una **función**. Las cinco clases de Python
 * de N7 van antes de que el alumno sepa `def`: su programa no recibe
 * argumentos, **pregunta con `input` y contesta con `print`**. Así es también
 * un juez de concurso de verdad —entrada estándar, salida estándar—, y éste es
 * ese juez: cada caso trae **lo que se teclea**, en orden, y **las líneas que
 * el programa tiene que imprimir**.
 *
 * Mismo intérprete que la ventana (misma razón que en `juezPython.ts`: si el
 * juez corriera en otra máquina, un caso podría pasar en la consola y fallar
 * aquí), mismo tope de pasos y mismo tachado de ocultos (`veredictoDe`).
 *
 * ── Las dos decisiones que son de este juez y no del otro ───────────────────
 *
 * **1. Sólo cuenta lo que el programa contesta.** Cada `input` deja en la
 * salida una línea con la pregunta y la respuesta pegadas; la máquina las
 * apunta en `ecos` y aquí se descartan. En una consola de verdad el aviso sale
 * por la salida estándar, y un alumno de 12 años suspendería por escribir
 * «¿Cómo te llamas?» en vez de «Nombre:». El texto de la pregunta es libre.
 *
 * **2. El contrato es qué se lee y en qué orden.** Pedir un dato de más es un
 * veredicto propio (`pide-de-mas`), y dejar datos sin leer suspende aunque lo
 * impreso cuadre: leer los datos que da el problema es parte del problema.
 *
 * Y lo que **no** hay: marca ni ruido. Todo lo que el programa imprime es su
 * respuesta; un `print` de más se explica solo («sobra una línea al final»).
 *
 * ── M4 (§69.21): proyectos de varios archivos ───────────────────────────────
 *
 * Tres cosas más, todas opcionales. `archivos` del problema: los archivos de
 * datos que **cada caso cambia** —como `datos`, pero en el disco—. `principal`
 * de un caso: un programa del juez que se corre **en vez del** del alumno y
 * prueba su módulo por la frontera (`clasifica(15.0)`); es la única forma de
 * distinguir «la regla está en el módulo» de «la regla está copiada en el
 * principal», que imprimen lo mismo. Y `escribe`: las líneas que tiene que
 * tener cada archivo que el programa escribe. Los demás archivos del proyecto
 * (los módulos del alumno) llegan como `proyecto`.
 */

import { recortarCelda } from '../codigo/celdas';
import { ejecutar, type Maquina } from '../codigo/maquina';
import { PASOS_DEL_JUEZ } from './juezPython';
import {
  explicarDiferencia,
  iguales,
  veredictoDe,
  type ResultadoCaso,
  type Veredicto,
} from './modelo';

/* ── El problema ────────────────────────────────────────────────────────────*/

export interface CasoPrograma {
  /** Cómo se llama en el panel. Los ocultos también lo enseñan (ver `Caso`). */
  nombre: string;
  /** Lo que el juez teclea, una respuesta por cada `input`, en orden. */
  entradas: string[];
  /** Las líneas que el programa tiene que imprimir con `print`. Literales, medidas con CPython. */
  esperada: string[];
  oculto?: boolean;
  /**
   * Los datos de arriba de la celda para este caso, como literales de Python
   * (`{ nombre: '"Ana"', edad: '13' }`). Sólo en problemas con `datos`: el juez
   * cambia la primera línea `nombre = …` de la celda por la de este caso.
   */
  datos?: Readonly<Record<string, string>>;
  /** El contenido de cada archivo de `ProblemaPrograma.archivos` en este caso (M4). */
  archivos?: Readonly<Record<string, string>>;
  /**
   * Un programa del juez que se corre en vez del del alumno, para probar un
   * módulo suyo (M4). **Siempre oculto**: si se viera, sería el código de la
   * solución de la prueba.
   */
  principal?: string;
  /** Las líneas que tiene que dejar escritas en cada archivo, cada una con su salto (M4). */
  escribe?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Una ficha del manual: **un programa de otro tema** que usa la herramienta que
 * el encargo necesita, qué se tecleó y cómo quedó la consola.
 *
 * Existe porque un alumno de 12 años no puede inventar `int(input(...))` de la
 * nada y dictárselo es lo que §68.4 viene a quitar. Un programador que no sabe
 * algo lo busca en la documentación y lo **traslada** a su problema; el
 * traslado es el aprendizaje. Por eso el tema de la ficha no puede ser el del
 * encargo, y por eso cada ficha es una afirmación sobre el motor: la prueba de
 * la clase la ejecuta y exige que la consola salga exactamente así.
 */
export interface FichaManual {
  /** «input espera a que contesten». */
  titulo: string;
  /** El programa de ejemplo, línea por línea. */
  programa: string[];
  /** Lo que se contestó al ejecutarlo. Vacío si no pregunta nada. */
  tecleado: string[];
  /** Cómo queda la consola, ecos incluidos: es lo que el alumno ve al pulsar ▶. */
  consola: string[];
  /** Una frase que dice qué mirar. */
  nota: string;
  /** Los archivos que el programa de la ficha abre o importa (M4), con su contenido. La prueba los usa al ejecutarla. */
  archivos?: Readonly<Record<string, string>>;
}

export interface ProblemaPrograma {
  id: string;
  titulo: string;
  /** Qué hay que conseguir y el formato exacto de lo que se imprime. **Nunca cómo.** */
  enunciado: string;
  /** Los datos que el programa lee, en orden, en palabras: «tu nombre», «el año en que naciste». */
  lee: readonly string[];
  /**
   * El último dato de `lee` se repite: cero o más veces, las que traiga cada caso
   * («los kilómetros de cada día», «cada moneda hasta el 0»). Sin esto, cada caso
   * trae exactamente un dato por cosa de `lee`. Lo usan las clases de bucles (§69.17).
   */
  repiteElUltimo?: boolean;
  /**
   * Las variables que el juez rellena en cada caso (§69.19). Para las clases que
   * van antes de `input`: la celda empieza con una línea `nombre = …` por cada
   * una (en la plantilla, con candado), y el juez cambia su valor caso a caso
   * **sin mover ninguna línea** —así el número de línea de un error sigue siendo
   * el del alumno—. Lo que el alumno escriba a mano en vez de usar la variable
   * cae en cuanto el dato cambia.
   */
  datos?: readonly string[];
  /**
   * La celda `# %%` del archivo que es este programa («Problema 2»). Sin ella se
   * juzga el archivo entero. Ver `codigo/celdas.ts`.
   */
  celda?: string;
  /** Los archivos de datos que el juez cambia en cada caso (M4): `lecturas.csv`. */
  archivos?: readonly string[];
  /** Cómo se llama el archivo del programa (`estacion.py`), para `__name__` y para que no se importe a sí mismo. */
  archivo?: string;
  casos: CasoPrograma[];
  /** Tres, en escalera: reencuadra, señala el sitio, dice el método (y cuesta). Nunca código. */
  pistas: readonly [string, string, string];
}

/* ── Juzgar ─────────────────────────────────────────────────────────────────*/

/** Lo que imprimió `print`, sin los ecos de `input`. */
export function lineasImpresas(salida: readonly string[], ecos: readonly number[]): string[] {
  const esEco = new Set(ecos);
  return salida.filter((_, i) => !esEco.has(i));
}

function ordinal(n: number): string {
  return n === 1 ? '1.er' : n === 3 ? '3.er' : `${n}.º`;
}

function datos(n: number): string {
  return n === 1 ? 'un dato' : `${n} datos`;
}

/** El texto exacto de un archivo con estas líneas: cada una con su salto, también la última. */
function textoDeLineas(lineas: readonly string[]): string {
  return lineas.map((l) => `${l}\n`).join('');
}

/** ¿Escribió cada archivo lo que tenía que escribir? `null` si sí; si no, por qué. */
function revisarEscritos(caso: CasoPrograma, maq: Maquina): string | null {
  for (const [nombre, lineas] of Object.entries(caso.escribe ?? {})) {
    if (!maq.escritos.includes(nombre)) return `tu programa no escribió «${nombre}»`;
    const hay = maq.disco.get(nombre) ?? '';
    if (hay === textoDeLineas(lineas)) continue;
    const renglones = hay.endsWith('\n') ? hay.slice(0, -1).split('\n') : hay.split('\n');
    if (hay !== '' && iguales(renglones, [...lineas]) && !hay.endsWith('\n')) {
      return `a «${nombre}» le falta el salto de línea al final del último renglón`;
    }
    if (hay !== '' && !hay.includes('\n') && lineas.length > 1) {
      return `«${nombre}» quedó todo en un solo renglón: a cada línea le falta su salto («\\n»)`;
    }
    return `«${nombre}» no quedó como se esperaba: ${explicarDiferencia(hay === '' ? [] : renglones, [...lineas])}`;
  }
  return null;
}

export function juzgarCasoPrograma(
  caso: CasoPrograma,
  fuente: string,
  celda?: string,
  proyecto?: Readonly<Record<string, string>>,
  archivo?: string,
): ResultadoCaso {
  const base = { nombre: caso.nombre, oculto: !!caso.oculto, esperada: caso.esperada, ruido: [] as string[] };

  /* El programa del juez no lleva celdas ni datos de arriba: se corre tal cual. */
  if (caso.principal !== undefined) {
    fuente = caso.principal;
    celda = undefined;
  }

  if (celda !== undefined) {
    const recorte = recortarCelda(fuente, celda);
    if (recorte === null) {
      return {
        ...base,
        clase: 'error',
        obtenida: null,
        explicacion: `no encuentro en tu archivo la línea «# %% ${celda}»: el juez corre lo que hay debajo de ella`,
      };
    }
    fuente = recorte;
  }

  if (caso.datos && caso.principal === undefined) {
    const lineas = fuente.split('\n');
    for (const [nombre, literal] of Object.entries(caso.datos)) {
      const i = lineas.findIndex((l) => new RegExp(`^${nombre}\\s*=(?!=)`).test(l));
      if (i === -1) {
        return {
          ...base,
          clase: 'error',
          obtenida: null,
          explicacion: `no encuentro la línea «${nombre} = …» al principio de la celda: el juez pone ahí su dato, no la borres`,
        };
      }
      lineas[i] = `${nombre} = ${literal}`;
    }
    fuente = lineas.join('\n');
  }

  let maq: Maquina;
  try {
    maq = ejecutar(fuente, {
      entradas: caso.entradas,
      topes: { PASOS: PASOS_DEL_JUEZ },
      archivos: { ...proyecto, ...caso.archivos },
      archivo,
    });
  } catch {
    return { ...base, clase: 'error', obtenida: null, explicacion: 'el juez no pudo ejecutar tu programa' };
  }

  const impresas = lineasImpresas(maq.salida, maq.ecos);
  const leidos = caso.entradas.length - maq.entradas.length;

  if (maq.estado === 'esperando') {
    return {
      ...base,
      clase: 'pide-de-mas',
      obtenida: impresas,
      explicacion:
        caso.entradas.length === 0
          ? 'tu programa pide un dato por teclado, y en este problema no se teclea nada'
          : `tu programa pidió un ${ordinal(leidos + 1)} dato y este caso sólo trae ${datos(caso.entradas.length)}`,
    };
  }

  if (maq.estado === 'error' && maq.error) {
    if (maq.error.clase === 'limite') {
      return {
        ...base,
        clase: 'no-termina',
        obtenida: impresas,
        explicacion: `tu programa pasó de ${PASOS_DEL_JUEZ.toLocaleString('es-MX')} pasos y no terminó`,
      };
    }
    /* Sin `principal`, toda línea es del alumno. Con él, las del programa del
     * juez no se señalan (serían líneas que el alumno no tiene), y las de un
     * módulo dicen de qué archivo son. */
    const enOtro = maq.error.archivo ?? null;
    const delJuez = caso.principal !== undefined && enOtro === null;
    const donde = enOtro ? `${enOtro}, línea ${maq.error.linea}: ` : maq.error.linea > 0 && !delJuez ? `línea ${maq.error.linea}: ` : '';
    const deContrato = delJuez && (maq.error.clase === 'importacion' || maq.error.clase === 'modulo' || maq.error.clase === 'atributo');
    return {
      ...base,
      clase: 'error',
      obtenida: impresas,
      publica: deContrato || undefined,
      linea: maq.error.linea > 0 && !enOtro && !delJuez ? maq.error.linea : undefined,
      explicacion:
        (delJuez ? 'el juez importó tu módulo para probarlo y ' : '') +
        `${donde}${maq.error.mensaje}` +
        (celda !== undefined && maq.error.clase === 'nombre'
          ? ` (el juez corre sólo la celda «${celda}»: lo que guardaste en otra celda aquí no existe)`
          : ''),
    };
  }

  const cuadra = iguales(impresas, caso.esperada);
  const sobran = maq.entradas.length;
  const sinLeer =
    sobran === 0
      ? ''
      : leidos === 0
        ? `tu programa no pidió ningún dato y este caso trae ${datos(caso.entradas.length)}`
        : `tu programa leyó ${datos(leidos)} y este caso trae ${datos(caso.entradas.length)}`;

  if (cuadra && sobran === 0) {
    const escrito = revisarEscritos(caso, maq);
    if (escrito) return { ...base, clase: 'falla', obtenida: impresas, explicacion: escrito };
    return { ...base, clase: 'pasa', obtenida: impresas, explicacion: 'pasa' };
  }
  if (cuadra) {
    return { ...base, clase: 'falla', obtenida: impresas, explicacion: sinLeer };
  }
  const diferencia = explicarDiferencia(impresas, caso.esperada);
  return {
    ...base,
    clase: 'falla',
    obtenida: impresas,
    /* Un programa vacío no necesita dos quejas: con «no imprimió nada» basta. */
    explicacion: sobran > 0 && impresas.length > 0 ? `${diferencia}; además, ${sinLeer}` : diferencia,
  };
}

/** Todos los casos, sin pararse en el primero que falla (misma razón que `juzgar`). */
export function juzgarPrograma(
  problema: ProblemaPrograma,
  fuente: string,
  proyecto?: Readonly<Record<string, string>>,
): Veredicto {
  return veredictoDe(
    problema.id,
    problema.casos.map((c) => juzgarCasoPrograma(c, fuente, problema.celda, proyecto, problema.archivo)),
  );
}

/* ── Revisar que el problema esté bien escrito ─────────────────────────────*/

/** La versión de `revisarProblema` para programas. Lista vacía = bien. */
export function revisarProblemaPrograma(p: ProblemaPrograma): string[] {
  const quejas: string[] = [];
  if (p.casos.length < 3) quejas.push(`${p.id}: menos de 3 casos (${p.casos.length})`);
  if (!p.casos.some((c) => c.oculto)) quejas.push(`${p.id}: no tiene ningún caso oculto`);
  if (!p.casos.some((c) => !c.oculto)) quejas.push(`${p.id}: no tiene ningún caso visible`);
  if (p.casos.some((c) => c.esperada.length === 0)) quejas.push(`${p.id}: hay un caso sin salida esperada`);
  const cuadranLosDatos = (n: number) => (p.repiteElUltimo ? n >= p.lee.length - 1 : n === p.lee.length);
  if (p.casos.some((c) => !cuadranLosDatos(c.entradas.length))) {
    quejas.push(`${p.id}: hay un caso que no trae un dato por cada cosa que el problema dice que se lee`);
  }
  if (p.pistas.some((x) => !x.trim())) quejas.push(`${p.id}: hay una pista vacía`);

  if (p.datos) {
    const esperados = [...p.datos].sort().join(',');
    if (p.casos.some((c) => !c.datos || Object.keys(c.datos).sort().join(',') !== esperados)) {
      quejas.push(`${p.id}: hay un caso que no trae un valor para cada dato de arriba (${p.datos.join(', ')})`);
    }
  }

  if (p.archivos) {
    const esperados = [...p.archivos].sort().join(',');
    const sinArchivos = p.casos.filter((c) => c.principal === undefined && Object.keys(c.archivos ?? {}).sort().join(',') !== esperados);
    if (sinArchivos.length > 0) quejas.push(`${p.id}: hay un caso que no trae el contenido de cada archivo (${p.archivos.join(', ')})`);
  }
  if (p.casos.some((c) => c.principal !== undefined && !c.oculto)) {
    quejas.push(`${p.id}: un caso con programa del juez se ve, y es el código de la prueba`);
  }

  const entradas = new Set(p.casos.map((c) => JSON.stringify([c.entradas, c.datos ?? null, c.archivos ?? null, c.principal ?? null])));
  if (entradas.size !== p.casos.length) quejas.push(`${p.id}: dos casos teclean lo mismo`);

  const nombres = new Set(p.casos.map((c) => c.nombre.trim()));
  if (nombres.size !== p.casos.length) quejas.push(`${p.id}: dos casos se llaman igual`);

  /* La misma vigilancia de `revisarProblema`: el enunciado no puede llevar la
   * solución escrita como código. Aquí se añade la forma en que la llevaban
   * las clases de N7: la llamada entera, `algo = input(`. */
  if (
    /\b(for|while|if|elif)\b\s+\S+\s*:/.test(p.enunciado) ||
    /\w+\s*=\s*\w+\s*[+\-*/]/.test(p.enunciado) ||
    /\w+\s*=\s*(int|float|str)?\s*\(?\s*input\s*\(/.test(p.enunciado)
  ) {
    quejas.push(`${p.id}: el enunciado lleva código dentro (eso es dictar la solución)`);
  }
  return quejas;
}
