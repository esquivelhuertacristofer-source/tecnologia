'use client';

import { useMemo } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ejecutar } from '@/components/simuladores/codigo';
import type { Ejecucion, GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import {
  aceptado,
  crearPanelJuezProgramas,
  ultimoVeredicto,
  type ProblemaPrograma,
} from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import { CELDAS_PRIMERAS, MANUAL_PRIMERAS, P1, P2, PROBLEMAS_PRIMERAS } from './problemasPrimeras';

/**
 * N6 · U «De bloques a texto» · parada 2 — «Primeras líneas de Python»
 * (documento §50.2, reescrita en §69.22).
 *
 * **6.º de primaria, 11–12 años**. La variable es *una caja con nombre*, el
 * error *no te regaña*, las frases son cortas y no hay un solo término en
 * inglés sin traducir. La parada anterior (`n6-bloques-vs-codigo`) enseña el
 * mismo programa en bloques y en texto; ésta abre el primer archivo `.py`.
 *
 * ── El arco, y lo que cambió en §69.22 ─────────────────────────────────────
 *
 * Ejecutar → mirar despacio → escribir → guardar un dato → **romperlo a
 * propósito** → arreglarlo → decidir. El arco es el de §50.2; lo que cambió es
 * cómo se comprueba. Antes la caja y el `if` se dictaban línea por línea y se
 * juzgaban con expresiones regulares sobre ESA línea: `print("Mucho gusto,
 * Sofi")` aprobaba, y `>= 7` no. Ahora la caja y la decisión son dos problemas
 * con el juez del entrenamiento, que **cambia el nombre de la caja** por otros:
 * el saludo escrito a mano pasa a Sofi y cae con Ana, la frase sin `if`
 * contesta igual a todos y cae con Rodrigo. Ésa es la lección de la variable,
 * dicha por la máquina.
 *
 * Los encargos 5 y 6 siguen siendo dos y no uno: provocar el error y leerlo es
 * un aprendizaje; arreglarlo, otro. Y «arreglado» es que el juez vuelva a
 * aceptar el saludo, no que la caja roja se vaya.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'saludo.py';

/**
 * Las cinco primeras líneas llegan con candado, y la quinta es la invitación.
 * Las celdas van debajo, cada una con su caja: el juez cambia esa línea. El
 * candado sólo puede ir arriba, porque se fija por número de línea y lo que el
 * alumno escribe debajo de la flecha las movería.
 */
export const PLANTILLA = [
  '# saludo.py · mi primer programa',
  'print("Hola, soy tu computadora.")',
  'print("Cumplo las líneas de arriba abajo, una por una.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
  '',
  '# %% Problema 1 · El saludo',
  '# La caja nombre guarda un texto. El juez la cambia por otros nombres.',
  'nombre = "Sofi"',
  '',
  '',
  '# %% Problema 2 · ¿Largo o corto?',
  'nombre = "Sofi"',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4, 5];

const SUYAS = ['Hola, soy tu computadora.', 'Cumplo las líneas de arriba abajo, una por una.'];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** Lo que va antes de la primera celda: las dos líneas de la computadora y las tuyas. */
function cabeza(texto: string): string {
  const i = texto.split('\n').findIndex((l) => l.startsWith('# %%'));
  return i === -1 ? texto : texto.split('\n').slice(0, i).join('\n');
}

/** ¿Esta corrida terminó y dijo una frase que no es de las dos de la computadora? */
export function dijoUnaFraseTuya(e: Ejecucion): boolean {
  return e.fase === 'terminada' && e.error === null && e.salida.some((l) => l.trim() !== '' && !SUYAS.includes(l));
}

/** La primera línea (1 en adelante) que casa con el patrón a partir de `desde`. `0` si ninguna. */
function primeraLinea(texto: string, patron: RegExp, desde = 1): number {
  const lineas = texto.split('\n');
  for (let i = desde - 1; i < lineas.length; i += 1) {
    if (patron.test(lineas[i])) return i + 1;
  }
  return 0;
}

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «Las tres piezas» — el mapa de la clase. Ya no se enciende leyendo el texto
 * con expresiones regulares (decía «hecha» de cosas que no corrían): escribir
 * se enciende cuando lo de arriba de las celdas, corrido, dice una frase tuya;
 * guardar y decidir, cuando el juez aceptó su problema la última vez que lo
 * enviaste. Cada fila lleva a su línea en el editor.
 */
function PanelTresPiezas({ texto, senalarLinea }: PanelCodigoProps) {
  const arriba = cabeza(texto);
  const escribe = useMemo(() => {
    const m = ejecutar(arriba);
    return m.estado === 'terminada' && m.error === null && m.salida.some((l) => l.trim() !== '' && !SUYAS.includes(l));
  }, [arriba]);

  const piezas = [
    {
      id: 'escribir',
      nombre: 'print(...)',
      detalle: 'Escribir en la consola',
      hecha: escribe,
      linea: escribe ? primeraLinea(texto, /\bprint\s*\(/, 6) : 0,
    },
    {
      id: 'guardar',
      nombre: 'nombre = "..."',
      detalle: 'Guardar un dato en una caja',
      hecha: !!ultimoVeredicto(P1.id)?.aceptado,
      linea: primeraLinea(texto, /^# %% Problema 1/),
    },
    {
      id: 'decidir',
      nombre: 'if ... else',
      detalle: 'Decidir entre dos caminos',
      hecha: !!ultimoVeredicto(P2.id)?.aceptado,
      linea: primeraLinea(texto, /^# %% Problema 2/),
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

const PanelPrimeras = crearPanelJuezProgramas({
  problemas: PROBLEMAS_PRIMERAS,
  manual: MANUAL_PRIMERAS,
  fuera: PanelTresPiezas,
  /* «Arréglalo» se cumple volviendo a enviar el saludo: en él se ve su tablero. */
  vuelven: { arreglalo: P1.id },
  pie: PanelTresPiezas,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [P1.id]:
    'Una variable guarda un dato con un nombre, y luego lo usas escribiendo ese nombre sin comillas. Por eso tu saludo funcionó con nombres que no escribiste tú.',
  [P2.id]:
    'El if es una pregunta: si la respuesta es sí se cumple lo de dentro, y si es no, el else. Con 6 letras justas la respuesta a «¿más de 6?» es no.',
};

function pasoDeProblema(p: ProblemaPrograma): PasoCodigo {
  return {
    id: p.id,
    titulo: p.titulo,
    instruccion: `${p.enunciado} Escríbelo en la celda «${p.celda}», debajo de la caja (▶ corre sólo esa celda), y cuando creas que está listo pulsa «Enviar al juez».`,
    pista: p.pistas[0],
    senal: { control: 'editor' },
    logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
    aprendido: APRENDIDO[p.id],
  };
}

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'ejecuta',
      titulo: 'Dale al ▶',
      instruccion:
        'Las dos líneas de arriba ya están escritas. Pulsa ▶ Ejecutar y mira cómo la computadora las cumple de arriba abajo.',
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
        'Debajo de la flecha, haz que la computadora diga una frase más: la que tú quieras. Después ejecuta.',
      pista:
        'Las dos líneas de arriba son el molde. Mira qué tienen antes de la frase, qué la abraza y cómo se cierran. Copia la forma, no la frase.',
      senal: { control: 'editor' },
      logro: { tipo: 'ejecucion', comprueba: (e) => dijoUnaFraseTuya(e) },
      aprendido: 'print escribe en la consola lo que le pongas entre comillas.',
    },
    pasoDeProblema(P1),
    {
      id: 'rompelo',
      titulo: 'Rómpelo a propósito',
      instruccion:
        '¿Para qué son las comillas? Averígualo: en la celda «Problema 1», quítale las comillas a lo que guarda la caja nombre y ejecuta. El programa se va a parar, y eso es justo lo que queremos. Lee con calma la caja roja.',
      pista: 'Son las dos comillas de la línea de la caja, la de antes y la de después del nombre.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'error' && (e.error?.clase === 'nombre' || e.error?.clase === 'sintaxis'),
      },
      aprendido:
        'El error no te regaña: te dice la línea exacta y qué no entendió. Sin comillas, Python buscó una caja que se llama como tu nombre, y no existe.',
    },
    {
      id: 'arreglalo',
      titulo: 'Arréglalo',
      instruccion: 'Haz que tu saludo vuelva a funcionar, y mándalo otra vez al juez.',
      pista:
        'Se arregla la línea que dice el error, no todo el programa. En la caja roja hay un botón con el número de línea: púlsalo y el cursor se va solo hasta ahí.',
      senal: { control: 'editor' },
      logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(P1.id, fuente) },
      aprendido: 'Sin comillas era el nombre de otra caja; con comillas es texto. Esa es toda la diferencia.',
    },
    pasoDeProblema(P2),
    {
      id: 'quien-decide',
      titulo: 'Para cerrar · ¿Quién decidió la frase?',
      instruccion:
        'El juez cambió el nombre de la caja y tu programa contestó «largo» a unos y «corto» a otros, sin que tú cambiaras una sola letra del if. ¿Qué decidió qué frase salía?',
      pista: 'Piensa qué mira el if para contestar su pregunta, y qué fue lo único que cambió el juez.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Lo que valía «nombre» cuando el programa llegó al if: la pregunta era la misma, cambió la respuesta.',
          'El juez cambió mi if por otro para cada nombre.',
          'El botón que pulsé: ▶ escribe una frase y «Enviar al juez» la otra.',
          'El orden en que escribí las dos frases.',
        ],
        correcta: 0,
      },
      aprendido: 'El if no cambia: cambia el dato. Por eso un mismo programa sirve para cualquier nombre.',
    },
  ],
  cierre:
    'Ya escribiste un archivo .py de verdad, con sus tres piezas —escribir, guardar y decidir—, y funcionó con nombres que no escribiste tú.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n6-primeras-lineas-python',
  titulo: 'Primeras líneas de Python',
  archivo: ARCHIVO,
  insignia: { nombre: 'Primera línea', emoji: '🐍' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 6 · De bloques a texto · Parada 2 de 2',
    tema: 'Tu primer archivo de Python',
    objetivo:
      'Vas a salir de aquí habiendo escrito, ejecutado y arreglado un programa de verdad, con las tres piezas que tiene cualquiera: una orden que escribe, un dato guardado y una decisión. Y un juez lo va a probar con nombres que tú no escribiste.',
    vasAHacer: [
      'Ejecutar un programa que ya está escrito, y verlo ir despacio línea por línea.',
      'Escribir tu propia línea y un saludo que sirva para cualquier nombre.',
      'Romper el programa a propósito y aprender a leer lo que dice el error.',
      'Hacer que el programa decida solo si un nombre es largo o corto.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  celdas: CELDAS_PRIMERAS,
  /* «Lenta» y no «Normal»: en la primera clase de la vida, ver la línea
   * encenderse una por una ES el contenido. El alumno puede subir la velocidad
   * cuando se canse, que para eso están los cuatro botones. */
  velocidad: 'lenta',
  guion: GUION,
  panelFijo: { titulo: 'Las tres piezas', Cuerpo: PanelPrimeras },
  bit: {
    inicio:
      'Esto es un editor de código de verdad. Lo que escribas aquí es Python, el mismo que usan los programadores. Y al final, un juez va a probar tu programa con otros nombres.',
    cierre: 'Escribiste, guardaste y decidiste. Con esas tres piezas ya se hacen programas de verdad.',
  },
  final: {
    titulo: '¡Tu primer archivo .py!',
    detalle:
      'Escribiste un programa, lo rompiste a propósito, leíste el error y lo arreglaste; y el juez lo probó con nombres que no escribiste tú. Eso último es lo que hace que un programa sea un programa.',
  },
};

export function LabPrimerasLineasPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabPrimerasLineasPython;
