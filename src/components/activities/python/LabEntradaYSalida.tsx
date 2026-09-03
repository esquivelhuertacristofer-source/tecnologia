'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { nombreDeTipo } from '@/components/simuladores/codigo';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N7 · U2 «Programación en texto I (Python)» · parada 2 — «Entrada y salida»
 * (documento §50.4).
 *
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`. Viene de
 * `n7-variables-y-tipos`, así que ya sabe que un dato tiene tipo y que
 * convertir fabrica un dato nuevo. Aquí el programa deja de ser un monólogo.
 *
 * ── La mecánica: la entrevista ─────────────────────────────────────────────
 *
 * El alumno **contesta de verdad**, escribiendo en la consola del programa. No
 * se le dan `entradas` preparadas al armazón a propósito: media clase es ver
 * el programa **detenerse** a esperarte, y con las respuestas puestas de
 * antemano eso no pasa nunca. El precio es que hay que teclear las respuestas
 * en cada ejecución; el cuadro de la consola se enfoca solo y Enter envía, así
 * que son tres teclas por pregunta.
 *
 * ── El orden, que es lo que hace que la clase funcione ─────────────────────
 *
 * `input` → `print` → **`edad + 1` revienta** → `int(edad) + 1` → contestar mal
 * a propósito → varios datos en un `print` → f-string.
 *
 * El encargo 3 va **antes** de la conversión y ése es el corazón de la clase:
 * el alumno escribe 13, ve `13` en la pantalla, le suma 1 y el programa se
 * rompe. Sin ese golpe, `int(input(...))` es una fórmula que se copia de una
 * pizarra y no una decisión que se entiende.
 *
 * El encargo 5 pide **contestar mal**, que es distinto de escribir mal el
 * programa: aquí el código está bien y el que no vale es el dato. Un alumno de
 * 12 años no separa esas dos cosas solo, y es la puerta de entrada a la
 * validación que enseña la parada siguiente (`n7-condicionales-python`).
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'entrevista.py';

const PLANTILLA = [
  '# entrevista.py · el programa te entrevista',
  'print("Hola. Voy a hacerte tres preguntas.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** Una línea `algo = input("pregunta")` del archivo del alumno. */
interface Buzon {
  caja: string;
  pregunta: string;
  linea: number;
}

const ASIGNA_INPUT = /^\s*([A-Za-z_][A-Za-z_0-9]*)\s*=\s*input\s*\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)\s*$/;

function buzones(fuente: string): Buzon[] {
  const salida: Buzon[] = [];
  fuente.split('\n').forEach((linea, i) => {
    const m = ASIGNA_INPUT.exec(linea);
    if (!m) return;
    salida.push({ caja: m[1], pregunta: (m[2] ?? m[3] ?? '').trim(), linea: i + 1 });
  });
  return salida;
}

/** El texto guardado en una variable, o `null` si no existe o no es texto. */
function textoDe(e: Ejecucion, nombre: string): string | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v && v.valor.t === 'cad' ? v.valor.v : null;
}

function contestada(e: Ejecucion, nombre: string): boolean {
  const valor = textoDe(e, nombre);
  return valor !== null && valor.trim() !== '';
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'pregunta',
      titulo: 'Que te pregunte',
      instruccion:
        'Escribe abajo  nombre = input("¿Cómo te llamas? ")  y ejecuta. El programa se va a detener: te está esperando. Contesta en la consola, abajo del todo.',
      pista:
        'La pregunta va entre comillas dentro del input, con un espacio al final para que tu respuesta no salga pegada. Al ejecutar aparece un cuadro con ⌨ en la consola: escribe ahí y pulsa Enter.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'terminada' && contestada(e, 'nombre') },
      aprendido: 'input detiene el programa y espera. Lo que escribas se guarda en la caja de la izquierda.',
    },
    {
      id: 'contesta',
      titulo: 'Que te conteste',
      instruccion: 'Añade  print("Encantado, " + nombre + ".")  y ejecuta otra vez.',
      pista: 'Los dos textos fijos van entre comillas; nombre va sin comillas, porque es la caja y no la palabra.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'terminada' && e.salida.some((l) => l.startsWith('Encantado, ') && l.length > 12),
      },
      aprendido: 'input entra, print sale. Ésa es toda la conversación de un programa de consola.',
    },
    {
      id: 'llega-texto',
      titulo: 'Lo que llega es texto',
      instruccion:
        'Añade  edad = input("¿Cuántos años tienes? ")  y debajo  print(edad + 1). Ejecuta y contesta con un número. Se va a romper.',
      pista: 'Escríbelo tal cual y contesta con cifras, por ejemplo 13. Después mira el buzón, a la derecha.',
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'tipo' },
      aprendido:
        'Escribiste 13 y llegó el texto "13". input SIEMPRE devuelve str, aunque escribas un número.',
    },
    {
      id: 'conviertelo',
      titulo: 'Conviértelo',
      instruccion:
        'Cambia esa línea por  print(int(edad) + 1)  y ejecuta. Contesta con un número: te dirá cuántos años vas a cumplir.',
      pista: 'int(edad) fabrica el número a partir del texto. La caja edad sigue guardando texto: mira el buzón.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /int\s*\(\s*edad\s*\)/.test(fuente) && e.fase === 'terminada' && e.error === null && contestada(e, 'edad'),
      },
      aprendido: 'int(texto) convierte lo que llegó en número. La caja no cambia: se fabrica un dato nuevo.',
    },
    {
      id: 'contesta-mal',
      titulo: 'Contesta mal a propósito',
      instruccion:
        'Ejecuta otra vez y, cuando te pregunte la edad, contesta «trece» con letras. Lee el error: el programa está bien, lo que no vale es el dato.',
      pista: 'No cambies ni una línea. Sólo escribe trece en el cuadro de la consola y pulsa Enter.',
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'valor' },
      aprendido:
        'Un programa que pide un número tiene que contar con que le den otra cosa. Comprobarlo se aprende en la parada siguiente.',
    },
    {
      id: 'tres-datos',
      titulo: 'Tres datos en una línea',
      instruccion:
        'Añade  ciudad = input("¿De qué ciudad eres? ")  y luego  print(nombre, "tiene", edad, "años y vive en", ciudad). Ejecuta y contesta las tres.',
      pista:
        'Aquí las cosas van separadas por comas, no pegadas con +. Fíjate en que edad entra sin convertir y no se rompe nada.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.fase === 'terminada' && contestada(e, 'ciudad') && e.salida.some((l) => l.includes('años y vive en')),
      },
      aprendido:
        'print con comas escribe cualquier cosa con un espacio en medio y no exige convertir nada; el + sí.',
    },
    {
      id: 'la-ficha',
      titulo: 'La ficha',
      instruccion:
        'Última línea:  print(f"FICHA · {nombre} · {edad} años · {ciudad}"). Fíjate en la f pegada a las comillas. Ejecuta y contesta.',
      pista:
        'La f va antes de la primera comilla, sin espacio. Dentro del texto, lo que pongas entre llaves se cambia por el valor de esa caja.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'terminada' && e.salida.some((l) => l.startsWith('FICHA · ') && l.length > 10),
      },
      aprendido:
        'Con una f delante de las comillas, lo de entre llaves se sustituye por el valor. Es la forma corta de armar un texto.',
    },
    {
      id: 'que-trae-input',
      titulo: '¿De qué tipo es lo que trae input?',
      instruccion: 'Para cerrar: cuando alguien contesta 13 a un input, ¿qué tipo tiene ese dato al llegar?',
      pista: 'Vuelve a mirar el buzón de la derecha: ¿con comillas o sin comillas?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El tipo que escriban: int si escriben un número',
          'Siempre str, aunque escriban un número',
          'Depende de cómo esté escrita la pregunta',
        ],
        correcta: 1,
      },
      aprendido: 'Siempre str. Por eso existen int() y float(): para pasar de lo que llega a lo que necesitas.',
    },
  ],
  cierre: 'Tu programa ya pregunta, escucha, convierte y contesta. Con eso solo ya se escriben programas útiles.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «El buzón de respuestas» — qué pregunta el programa y qué llegó.
 *
 * Lee el archivo del alumno buscando las líneas `algo = input(...)` y, por
 * cada una, enseña la pregunta, **lo que llegó con sus comillas** y la chapa
 * de su tipo. Las comillas no son un detalle de formato: son el argumento
 * entero de la clase. No hay explicación que convenza como ver `'13'`
 * entrecomillado al lado de una caja que se llama `edad`.
 *
 * Se queda vacío mientras no haya `input` escrito, y eso también informa: la
 * primera fila aparece en el momento en que el alumno escribe su primera
 * pregunta, antes incluso de ejecutar.
 */
function PanelBuzon({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
  const cajas = buzones(texto);

  if (cajas.length === 0) {
    return (
      <p className="pyc-vacio">
        Todavía no le has pedido nada a nadie. En cuanto escribas una línea con <b>input</b>, aparecerá aquí con
        lo que te contesten.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-buzon">
        {cajas.map((b) => {
          const v = ejecucion.variables.find((x) => x.nombre === b.caja);
          return (
            <li key={`${b.caja}-${b.linea}`}>
              <button
                type="button"
                className={`pyc-fila${v ? ' es-hecha' : ''}`}
                data-buzon={b.caja}
                onClick={() => senalarLinea(b.linea)}
              >
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{v ? v.texto : '— sin contestar —'}</span>
                  <span className="pyc-fila-detalle">
                    {b.caja} ← {b.pregunta === '' ? 'sin pregunta escrita' : b.pregunta}
                  </span>
                </span>
                {v && (
                  <span className="pyc-tipo" data-tipo={nombreDeTipo(v.valor)}>
                    {nombreDeTipo(v.valor)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pyc-nota">
        Mira las comillas: todo lo que entra por <b>input</b> llega como <b>str</b>, aunque escribas un número.
      </p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n7-entrada-y-salida',
  titulo: 'Entrada y salida',
  archivo: ARCHIVO,
  insignia: { nombre: 'Pregunta y responde', emoji: '💬' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 2 de 5',
    tema: 'El programa pregunta y contesta',
    objetivo:
      'Vas a escribir un programa que te entrevista: pregunta con input, escucha lo que contestas y responde con print. Y vas a entender por qué lo que llega hay que convertirlo casi siempre.',
    vasAHacer: [
      'Hacer que el programa se detenga a preguntarte, y contestarle tú en la consola.',
      'Descubrir, rompiéndolo, que lo que entra por input siempre es texto.',
      'Convertirlo con int() y contestar mal a propósito para ver el otro error.',
      'Armar una ficha con tres datos usando print con comas y una f-string.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El buzón de respuestas', Cuerpo: PanelBuzon },
  bit: {
    inicio: 'Hasta ahora tus programas hablaban solos. Éste te va a preguntar, y va a esperar a que le contestes.',
    cierre: 'Preguntar, convertir y contestar. Con eso tu programa ya trabaja con datos que no escribiste tú.',
  },
  final: {
    titulo: 'Pregunta y responde',
    detalle:
      'Tu programa entrevista a quien lo usa y arma una ficha con lo que le contestan. Y sabes lo que casi nadie sabe el primer día: lo que entra por input es texto, siempre, y convertirlo es decisión tuya.',
  },
};

export function LabEntradaYSalida(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabEntradaYSalida;
