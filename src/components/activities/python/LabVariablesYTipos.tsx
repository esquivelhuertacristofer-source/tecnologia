'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { nombreDeTipo } from '@/components/simuladores/codigo';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';

/**
 * N7 · U2 «Programación en texto I (Python)» · parada 1 — «Variables y tipos»
 * (documento §50.3).
 *
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`. El registro
 * lo fija §30.4: el término técnico correcto desde la primera línea con su
 * traducción al lado, se explica el **porqué** y no sólo el qué, cero
 * diminutivos y refuerzo informativo — «Correcto: `/` siempre devuelve
 * `float`», no «¡muy bien!».
 *
 * ── La mecánica: clasificar y mezclar ──────────────────────────────────────
 *
 * El currículo dice literalmente «guarda datos en variables y **ve qué pasa al
 * mezclar tipos**», y `subconjunto.ts` dejó `type()` y `bool()` dentro del
 * subconjunto justo para esta clase. Así que la clase no explica los tipos:
 * los **enseña en una tabla que se rehace en cada paso** (la Mesa de tipos) y
 * después manda mezclarlos hasta que el programa revienta, dos veces y de dos
 * maneras distintas — `TypeError` al sumar texto con número, `ValueError` al
 * convertir un texto que no es un número—.
 *
 * ── Los dos encargos que parecen de relleno y no lo son ────────────────────
 *
 * **El 3** (`10 / 2` da `5.0` y `10 // 2` da `5`) existe porque el intérprete
 * decidió a propósito que `int` y `float` fueran tipos distintos y que se
 * notara al imprimir (`valores.ts`, decisión 1). Es el primer tropiezo del
 * tema de operadores y la primera pregunta de cualquier examen; una clase de
 * tipos que no lo enseña deja el motor sin usar justo donde más caro costó.
 *
 * **El 6** tiene trampa a propósito: después de `int(respuesta) + 1` el alumno
 * espera que `respuesta` se haya vuelto número, y la Mesa de tipos enseña que
 * sigue siendo `str`. Convertir **fabrica un dato nuevo**; no transforma la
 * caja. Es la idea que sostiene entera la clase siguiente.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'tipos.py';

/**
 * `edad = 13` llega con candado, y no es capricho: media docena de encargos
 * comprueban la salida **exacta** («Tengo 13 años», `8`). Si el alumno pudiera
 * cambiar ese 13, la corrección tendría que adivinar, y una corrección que
 * adivina acaba dando por bueno lo que no lo es.
 */
const PLANTILLA = [
  '# tipos.py · qué es cada dato',
  '# Cada línea guarda un dato en una caja. Mira la Mesa de tipos, a la derecha.',
  'edad = 13',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4, 5];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** El tipo de una variable tal como lo diría `type()`, o `null` si no existe. */
function tipoDe(e: Ejecucion, nombre: string): string | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v ? nombreDeTipo(v.valor) : null;
}

function sonDeTipo(e: Ejecucion, esperado: Record<string, string>): boolean {
  return Object.entries(esperado).every(([nombre, tipo]) => tipoDe(e, nombre) === tipo);
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'cuatro-cajas',
      titulo: 'Cuatro cajas, cuatro tipos',
      instruccion:
        'Debajo, escribe estas tres líneas y ejecuta:  estatura = 1.62  ·  nombre = "Bit"  ·  aprobado = True. Después mira la Mesa de tipos.',
      pista:
        'Una por línea, sin comillas en el nombre de la caja. True se escribe con mayúscula y sin comillas: no es la palabra «true», es un valor de Python.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          sonDeTipo(e, { edad: 'int', estatura: 'float', nombre: 'str', aprobado: 'bool' }),
      },
      aprendido:
        'int es un número entero, float lleva decimales, str es texto y bool sólo vale True o False.',
    },
    {
      id: 'preguntale',
      titulo: 'Pregúntale a Python',
      instruccion:
        'Añade esta línea y ejecuta:  print(type(edad), type(estatura), type(nombre), type(aprobado))',
      pista: 'type(x) es la pregunta «¿qué eres?». Se escribe dentro del print, separando cada uno con una coma.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.salida.some((l) => l.includes("<class 'int'>")) && e.salida.some((l) => l.includes("<class 'str'>")),
      },
      aprendido: 'type(x) contesta con el tipo. De él depende lo que se puede hacer con ese dato.',
    },
    {
      id: 'el-punto',
      titulo: 'El punto que lo cambia todo',
      instruccion: 'Escribe  print(10 / 2)  y debajo  print(10 // 2). Ejecuta y mira bien las dos respuestas.',
      pista: 'La primera barra sola, la segunda doble. Salen dos números que valen lo mismo y no se escriben igual.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.salida.includes('5.0') && e.salida.includes('5'),
      },
      aprendido:
        'La división / siempre devuelve float, por eso 5.0; // se queda con la parte entera. El punto dice el tipo.',
    },
    {
      id: 'mezcla',
      titulo: 'Mézclalos a propósito',
      instruccion: 'Escribe  print("Tengo " + edad)  y ejecuta. Se va a romper: lee con calma lo que dice.',
      pista: 'Escríbelo tal cual, con edad sin comillas. Lo que sale abajo en rojo es la clase de hoy.',
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'tipo' },
      aprendido:
        'Sumar texto y número no existe: Python no adivina si querías pegarlos o sumarlos. Por eso el TypeError.',
    },
    {
      id: 'pegar',
      titulo: 'Decídelo tú: pegar',
      instruccion: 'Cámbiala por  print("Tengo " + str(edad) + " años")  y ejecuta.',
      pista: 'str(edad) fabrica el texto "13" a partir del número 13, y dos textos sí se pegan con +.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'terminada' && e.salida.some((l) => l.includes('Tengo 13 años')),
      },
      aprendido: 'str(x) convierte a texto para poder pegarlo. El dato de la caja no cambia: se fabrica otro.',
    },
    {
      id: 'sumar',
      titulo: 'Decídelo tú: sumar',
      instruccion:
        'Ahora al revés. Escribe  respuesta = "7"  y debajo  print(int(respuesta) + 1). Ejecuta y mira qué tipo tiene «respuesta» en la Mesa.',
      pista: 'Las comillas del 7 van: queremos un texto que parece número. int(respuesta) lo convierte al vuelo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.salida.includes('8') && tipoDe(e, 'respuesta') === 'str',
      },
      aprendido: 'int("7") da el número 7, y «respuesta» sigue siendo str: convertir no cambia la caja.',
    },
    {
      id: 'no-se-deja',
      titulo: 'El que no se deja convertir',
      instruccion: 'Prueba  print(int("trece"))  y ejecuta. Otro error, y de otra familia.',
      pista: 'Escríbelo con «trece» en letras, entre comillas. Fíjate en que el nombre en inglés no es el mismo de antes.',
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'valor' },
      aprendido:
        'int() sólo convierte textos que son números escritos. «trece» no lo es: eso es un ValueError.',
    },
    {
      id: 'limpio',
      titulo: 'Deja la ficha entera',
      instruccion:
        'Borra la línea del int("trece") y ejecuta. El programa tiene que llegar al final sin una sola caja roja.',
      pista: 'Sólo esa línea. Un programa que se para a la mitad deja sin ejecutar todo lo que viene después.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.fase === 'terminada' &&
          e.error === null &&
          sonDeTipo(e, { edad: 'int', estatura: 'float', nombre: 'str', aprobado: 'bool', respuesta: 'str' }),
      },
      aprendido:
        'Un error para el programa donde está: lo de abajo no llega a ejecutarse nunca. Por eso se arregla y se vuelve a correr.',
    },
    {
      id: 'que-tipo-sale',
      titulo: '¿Qué tipo sale de esta cuenta?',
      instruccion: 'Sin ejecutar nada todavía: si escribieras print(type(3 + 2.0)), ¿qué contestaría Python?',
      pista: 'Uno de los dos números lleva decimales. ¿Puede Python tirarlos sin que se lo pidas?',
      logro: {
        tipo: 'eleccion',
        opciones: ["<class 'int'>", "<class 'float'>", "<class 'str'>"],
        correcta: 1,
      },
      aprendido:
        'Si uno de los dos lleva decimales, el resultado también: Python nunca los tira sin que se lo pidas. Compruébalo.',
    },
  ],
  cierre:
    'Ya sabes de qué tipo es cada dato, cómo preguntárselo a Python y qué hacer cuando dos tipos no se llevan bien.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «La Mesa de tipos» — cada caja viva, con su valor y la chapa de su tipo.
 *
 * Sustituye al panel de variables del armazón (`variables: false`) en vez de
 * ponerse encima: es la misma lista con la chapa añadida, y tenerlas las dos
 * era la misma información dos veces con la de arriba diciendo menos.
 *
 * El valor se enseña con `vistazo.texto`, que ya viene como `repr` — o sea,
 * **los textos con sus comillas**. No es un detalle de formato: es lo que
 * separa `13` de `'13'` de un vistazo, y es la mitad de esta clase y toda la
 * siguiente.
 */
function PanelMesaDeTipos({ ejecucion }: PanelCodigoProps) {
  if (ejecucion.variables.length === 0) {
    return (
      <p className="pyc-vacio">
        Ejecuta el programa —o pulsa ⏭ Un paso— y aquí verás nacer cada caja con el color de su tipo.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-mesa">
        {ejecucion.variables.map((v) => {
          const tipo = nombreDeTipo(v.valor);
          return (
            <li key={`${v.ambito}-${v.nombre}`}>
              <span className="pyc-fila" data-caja={v.nombre}>
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{v.nombre}</span>
                  <span className="pyc-fila-detalle">{v.texto}</span>
                </span>
                <span className="pyc-tipo" data-tipo={tipo}>
                  {tipo}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="pyc-nota">
        Esto es lo que hay <b>ahora mismo</b>. Con ⏭ Un paso las verás aparecer una por una, y de qué tipo nace
        cada una.
      </p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n7-variables-y-tipos',
  titulo: 'Variables y tipos',
  archivo: ARCHIVO,
  insignia: { nombre: 'Cada dato en su caja', emoji: '📦' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 1 de 5',
    tema: 'Variables y tipos de dato',
    objetivo:
      'Vas a distinguir los cuatro tipos básicos de Python —int, float, str y bool—, a preguntarle a Python de qué tipo es un dato, y a entender por qué mezclar dos tipos es un error y no una molestia.',
    vasAHacer: [
      'Guardar cuatro datos distintos y ver de qué tipo nace cada uno.',
      'Preguntarle el tipo a Python con type(), y descubrir por qué 10 / 2 no da 5.',
      'Mezclar tipos a propósito hasta romper el programa, dos veces y de dos formas.',
      'Decidir tú la conversión: str() para pegar, int() para sumar.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'Mesa de tipos', Cuerpo: PanelMesaDeTipos },
  variables: false,
  bit: {
    inicio: 'Un dato no es sólo su valor: también es su tipo. De eso depende lo que Python te deja hacer con él.',
    cierre: 'Ya distingues los cuatro tipos y sabes convertir. Eso es la mitad de los errores de un programa.',
  },
  final: {
    titulo: 'Cada dato en su caja',
    detalle:
      'Clasificaste cuatro tipos, rompiste el programa de dos maneras distintas y decidiste tú cada conversión. El TypeError y el ValueError ya no son un susto: son dos preguntas con respuesta.',
  },
};

export function LabVariablesYTipos(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabVariablesYTipos;
