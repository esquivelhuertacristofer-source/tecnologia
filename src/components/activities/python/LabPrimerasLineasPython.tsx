'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N6 · U «De bloques a texto» · parada 2 — «Primeras líneas de Python»
 * (documento §50.2).
 *
 * **6.º de primaria, 11–12 años**, comprobado en `curriculo.ts` antes de
 * escribir una línea. De ahí sale el registro: la variable es *una caja con
 * nombre*, el error *no te regaña*, las frases son cortas y no hay un solo
 * término en inglés sin traducir. La parada anterior (`n6-bloques-vs-codigo`)
 * enseña el mismo programa en bloques y en texto; ésta abre el primer archivo
 * `.py` de verdad.
 *
 * ── El arco, y por qué está en ese orden ───────────────────────────────────
 *
 * Ejecutar → mirar despacio → escribir → guardar un dato → **romperlo a
 * propósito** → arreglarlo → decidir. El orden no es el de un libro de Python:
 * es el orden en el que después de cada paso hay **algo que ejecutar**.
 *
 * Los encargos 5 y 6 son dos y no uno a propósito. Provocar el error y leerlo
 * es un aprendizaje; arreglarlo es otro. Juntarlos deja al alumno arreglando
 * algo que no ha terminado de leer, que es el hábito que este intérprete
 * existe para no crear.
 *
 * El 8 es de elección y no de código porque los siete anteriores se comprueban
 * mirando el archivo o la salida, y ninguno comprueba que haya **entendido**:
 * las cuatro líneas del `if` se pueden copiar de la pista sin saber qué
 * deciden.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'saludo.py';

/**
 * Las cinco primeras líneas llegan con candado, y la quinta es la invitación.
 *
 * Sin ella el alumno tiene que adivinar dónde escribir: el cursor de un
 * `<textarea>` cae al final del texto, sí, pero eso no se ve. Con la línea
 * escrita y el 🔒 en el margen, el sitio donde empieza lo suyo es visible.
 */
const PLANTILLA = [
  '# saludo.py · mi primer programa',
  'print("Hola, soy tu computadora.")',
  'print("Cumplo las líneas de arriba abajo, una por una.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4, 5];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** Cuántos `print(` hay escritos. Heurística: los encargos piden además salida. */
function cuentaPrints(fuente: string): number {
  return (fuente.match(/\bprint\s*\(/g) ?? []).length;
}

/** El texto guardado en una variable, o `null` si no existe o no es texto. */
function textoDe(e: Ejecucion, nombre: string): string | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v && v.valor.t === 'cad' ? v.valor.v : null;
}

/** La primera línea (1 en adelante) que casa con el patrón. `0` si ninguna. */
function primeraLinea(fuente: string, patron: RegExp): number {
  const lineas = fuente.split('\n');
  for (let i = 0; i < lineas.length; i += 1) {
    if (patron.test(lineas[i])) return i + 1;
  }
  return 0;
}

const ES_VARIABLE_NOMBRE = /^\s*nombre\s*=[^=]/;
const ES_IF = /^\s*if\s+len\s*\(\s*nombre\s*\)\s*>\s*6\s*:/;
const ES_ELSE = /^\s*else\s*:/;

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'ejecuta',
      titulo: 'Dale al ▶',
      instruccion:
        'Las tres líneas de arriba ya están escritas. Pulsa ▶ Ejecutar y mira cómo la computadora las cumple de arriba abajo.',
      pista: 'El botón ▶ Ejecutar está arriba del todo, en la barra del programa.',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.salida.some((l) => l.includes('Hola, soy tu computadora.')),
      },
      aprendido: 'Un programa es una lista de órdenes, y se cumplen en orden: de la primera línea a la última.',
    },
    {
      id: 'paso-a-paso',
      titulo: 'Míralo ir despacio',
      instruccion:
        'Ahora pulsa ⏭ Un paso. Se enciende un triángulo ▸ en la línea que va a ejecutarse: todavía no ha pasado nada. Pulsa otra vez y verás salir la frase. Cuando acabes de mirar, pulsa ⏹ Parar.',
      pista:
        '⏭ Un paso está al lado de ▶. La línea encendida es la que toca AHORA, no la que ya salió. Mientras el programa está a medias no te deja escribir: por eso al final se pulsa ⏹.',
      senal: { control: 'paso' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'pausada' && e.linea > 0 },
      aprendido: 'Con ⏭ ves tu programa por dentro. Mientras anda no se puede escribir: pulsa ⏹ y ya.',
    },
    {
      id: 'tu-print',
      titulo: 'Tu propia línea',
      instruccion:
        'Debajo del todo escribe un print tuyo, con lo que tú quieras dentro de las comillas. Después ejecuta.',
      pista: 'Escribe esto y cambia el texto: print("Aquí escribo yo"). Las comillas abrazan el texto y los paréntesis lo abrazan todo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) => cuentaPrints(fuente) >= 3 && e.salida.length >= 3,
      },
      aprendido: 'print escribe en la consola lo que le pongas entre comillas.',
    },
    {
      id: 'variable',
      titulo: 'Una caja con tu nombre',
      instruccion:
        'Una variable es una caja con nombre. Escribe abajo estas dos líneas y ejecuta:  nombre = "tu nombre"  y  print("Mucho gusto,", nombre)',
      pista: 'El nombre de la caja va SIN comillas; lo que guardas dentro, CON comillas porque es texto. Mira el panel Variables al ejecutar.',
      senal: { control: 'variables' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          const valor = textoDe(e, 'nombre');
          return valor !== null && valor !== '' && e.salida.some((l) => l.includes('Mucho gusto') && l.includes(valor));
        },
      },
      aprendido: 'Una variable guarda un dato con un nombre, y luego lo usas escribiendo ese nombre.',
    },
    {
      id: 'rompelo',
      titulo: 'Rómpelo a propósito',
      instruccion:
        'Ahora quítale las comillas a tu nombre: que quede nombre = Sofi, pero con el tuyo. Ejecuta. El programa se va a parar, y eso es justo lo que queremos.',
      pista: 'Borra la comilla de antes y la de después de tu nombre, y pulsa ▶. Luego lee con calma la caja roja de abajo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'error' && (e.error?.clase === 'nombre' || e.error?.clase === 'sintaxis'),
      },
      aprendido: 'El error no te regaña: te dice la línea exacta y qué no entendió. Leerlo es media clase.',
    },
    {
      id: 'arreglalo',
      titulo: 'Arréglalo',
      instruccion: 'Vuelve a ponerle las comillas a tu nombre y ejecuta otra vez. Sin caja roja.',
      pista:
        'Se arregla la línea que dice el error, no todo el programa. En la caja roja hay un botón con el número de línea: púlsalo y el cursor se va solo hasta ahí.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          const valor = textoDe(e, 'nombre');
          return (
            e.fase === 'terminada' &&
            e.error === null &&
            valor !== null &&
            valor !== '' &&
            e.salida.some((l) => l.includes('Mucho gusto'))
          );
        },
      },
      aprendido: 'Sin comillas era el nombre de otra caja; con comillas es texto. Esa es toda la diferencia.',
    },
    {
      id: 'decide',
      titulo: 'Que el programa decida',
      instruccion:
        'Última pieza: que el programa piense. Escribe abajo un if que mire si tu nombre tiene más de 6 letras, y un else para cuando no.',
      pista:
        'Cuatro líneas: if len(nombre) > 6:  ·  print("Tu nombre es largo.")  ·  else:  ·  print("Tu nombre es corto."). Tras los dos puntos, Enter te sangra solo; para volver al margen antes de else usa Mayús+Tab.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          primeraLinea(fuente, ES_IF) > 0 &&
          primeraLinea(fuente, ES_ELSE) > 0 &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.some((l) => l.includes('largo') || l.includes('corto')),
      },
      aprendido: 'El if es una pregunta: si la respuesta es sí se cumple lo de dentro, y si es no, el else.',
    },
    {
      id: 'quien-decide',
      titulo: '¿Quién decide qué frase sale?',
      instruccion:
        'Tu programa escribe una frase o la otra, nunca las dos. ¿Qué es lo que lo decide?',
      pista: 'Piensa qué mira el if para contestar su pregunta.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El botón ▶ que pulsé',
          'Lo que vale «nombre» cuando el programa llega al if',
          'El orden en que escribí las líneas',
        ],
        correcta: 1,
      },
      aprendido: 'Cambia el nombre por uno más largo, ejecuta y dirá lo otro. El if no cambia: cambia el dato.',
    },
  ],
  cierre: 'Ya escribiste un archivo .py de verdad, con sus tres piezas: escribir, guardar y decidir.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «Las tres piezas» — el mapa de la clase, leyendo el archivo del alumno.
 *
 * No corrige nada que el guion no corrija ya: es el mapa de lo que lleva
 * escrito, para que la meta se vea entera desde el primer minuto. Cada fila
 * lleva a su línea en el editor, que es la manera de que un panel de la
 * derecha no sea un adorno.
 */
function PanelTresPiezas({ texto, senalarLinea }: PanelCodigoProps) {
  const lineaPrint = cuentaPrints(texto) >= 3 ? primeraLinea(texto, /\bprint\s*\(/) : 0;
  const lineaVar = primeraLinea(texto, ES_VARIABLE_NOMBRE);
  const lineaIf = primeraLinea(texto, ES_IF);
  const hayElse = primeraLinea(texto, ES_ELSE) > 0;

  const piezas = [
    {
      id: 'escribir',
      nombre: 'print(...)',
      detalle: 'Escribir en la consola',
      hecha: cuentaPrints(texto) >= 3,
      linea: lineaPrint,
    },
    {
      id: 'guardar',
      nombre: 'nombre = "..."',
      detalle: 'Guardar un dato en una caja',
      hecha: lineaVar > 0,
      linea: lineaVar,
    },
    {
      id: 'decidir',
      nombre: 'if ... else',
      detalle: 'Decidir entre dos caminos',
      hecha: lineaIf > 0 && hayElse,
      linea: lineaIf,
    },
  ];

  return (
    <ul className="pyc-filas" data-testid="pyc-piezas">
      {piezas.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            className={`pyc-fila${p.hecha ? ' es-hecha' : ''}`}
            data-pieza={p.id}
            data-hecha={p.hecha ? 'si' : 'no'}
            disabled={p.linea === 0}
            onClick={() => senalarLinea(p.linea)}
          >
            <span className="pyc-fila-marca" aria-hidden="true">
              {p.hecha ? '✔' : '·'}
            </span>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">{p.nombre}</span>
              <span className="pyc-fila-detalle">{p.detalle}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n6-primeras-lineas-python',
  titulo: 'Primeras líneas de Python',
  archivo: ARCHIVO,
  insignia: { nombre: 'Primera línea', emoji: '🐍' },
  minutos: 25,
  portada: {
    situacion: 'Nivel 6 · De bloques a texto · Parada 2 de 2',
    tema: 'Tu primer archivo de Python',
    objetivo:
      'Vas a salir de aquí habiendo escrito, ejecutado y arreglado un programa de verdad, con las tres piezas que tiene cualquiera: una orden que escribe, un dato guardado y una decisión.',
    vasAHacer: [
      'Ejecutar un programa que ya está escrito, y verlo ir despacio línea por línea.',
      'Escribir tu propio print y guardar tu nombre en una variable.',
      'Romper el programa a propósito y aprender a leer lo que dice el error.',
      'Hacer que el programa decida solo con un if y un else.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  /* «Lenta» y no «Normal»: en la primera clase de la vida, ver la línea
   * encenderse una por una ES el contenido. El alumno puede subir la velocidad
   * cuando se canse, que para eso están los cuatro botones. */
  velocidad: 'lenta',
  guion: GUION,
  panelFijo: { titulo: 'Las tres piezas', Cuerpo: PanelTresPiezas },
  bit: {
    inicio: 'Esto es un editor de código de verdad. Lo que escribas aquí es Python, el mismo que usan los programadores.',
    cierre: 'Escribiste, guardaste y decidiste. Con esas tres piezas ya se hacen programas de verdad.',
  },
  final: {
    titulo: '¡Tu primer archivo .py!',
    detalle:
      'Escribiste un programa, lo rompiste a propósito, leíste el error y lo arreglaste. Eso último es lo que hace un programador todos los días.',
  },
};

export function LabPrimerasLineasPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabPrimerasLineasPython;
