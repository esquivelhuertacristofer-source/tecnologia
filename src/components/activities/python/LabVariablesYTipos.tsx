'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { nombreDeTipo } from '@/components/simuladores/codigo';
import type { Ejecucion, GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import { CELDAS_TIPOS, MANUAL_TIPOS, PROBLEMAS_TIPOS, T1, T2, T3 } from './problemasTipos';

/**
 * N7 · U «Programación en texto I (Python)» · parada 1 — «Variables y tipos».
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §69.19. Reescrita el 6-oct-2026.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Nueve encargos que dictaban la línea, y los datos con candado (`edad = 13`)
 * para que la salida exacta se pudiera comprobar: `print("Tengo 13 años")`
 * aprobaba igual que la conversión bien hecha.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Aquí todavía no hay `input`, así que el juez prueba **cambiando los datos de
 * arriba de la celda** (`datos`, §69.19): la primera línea `nombre = …` de la
 * celda lleva el dato del ejemplo y el juez la cambia caso a caso sin mover
 * ninguna línea. Cuatro exploraciones con la meta dicha (cuatro tipos, `type()`,
 * el error de tipo y el de valor) y tres problemas con juez: la credencial
 * (`str()`), las pizzas (`/` contra `//`) y el marcador (`int()`).
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero del juez y, debajo y fuera de los problemas, **la Mesa de tipos**:
 * cada caja con su valor —los textos con sus comillas— y la chapa de su tipo.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'tipos.py';

export const PLANTILLA = [
  '# tipos.py · qué es cada dato',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas.',
  '# En los problemas, las primeras líneas traen los datos: el juez los cambia.',
  '',
  '# %% Cajas',
  '',
  '',
  '# %% Problema 1 · La credencial',
  'nombre = "Ana"',
  'edad = 13',
  '',
  '',
  '# %% Problema 2 · Las pizzas del equipo',
  'pizzas = 10',
  'equipos = 4',
  '',
  '',
  '# %% Problema 3 · El marcador',
  'puntos = "7"',
  'bono = 3',
  '',
].join('\n');

/* ───────────────────────── lectores del programa ─────────────────────────── */

const TIPOS_BASICOS = ['int', 'float', 'str', 'bool'] as const;

/** ¿Hay al menos una variable de cada tipo básico? */
export function cuatroTipos(e: Ejecucion): boolean {
  const tipos = new Set(e.variables.map((v) => nombreDeTipo(v.valor)));
  return TIPOS_BASICOS.every((t) => tipos.has(t));
}

/* ─────────────────────────────── el panel ────────────────────────────────── */

/** «La Mesa de tipos» — cada caja viva, con su valor (los textos con comillas) y la chapa de su tipo. */
function PanelMesaDeTipos({ ejecucion }: PanelCodigoProps) {
  if (ejecucion.variables.length === 0) {
    return (
      <p className="pyc-vacio" data-testid="pyc-mesa-vacia">
        La Mesa de tipos: pulsa ▶ —o ⏭ Un paso— y aquí verás nacer cada caja con el color de su tipo.
      </p>
    );
  }
  return (
    <div data-testid="pyc-mesa-caja">
      <h5 className="pyc-semaforo-titulo">La Mesa de tipos · la última vez que pulsaste ▶</h5>
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
      <p className="pyc-nota">Los textos llevan comillas: así se distingue 13 de "13" de un vistazo.</p>
    </div>
  );
}

const PanelTipos = crearPanelJuezProgramas({
  problemas: PROBLEMAS_TIPOS,
  manual: MANUAL_TIPOS,
  fuera: PanelMesaDeTipos,
  pie: PanelMesaDeTipos,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [T1.id]:
    'Un texto y un número no se pegan con +: str() fabrica un texto a partir del número. Y como el juez cambió los datos, sabes que tu línea usa las variables y no el ejemplo.',
  [T2.id]:
    'Una barra divide con decimales y siempre da float, aunque el reparto sea exacto (4.0). Dos barras se quedan con la parte entera. Son dos operaciones distintas.',
  [T3.id]:
    'Lo que llega de un formulario o de un teclado es texto aunque parezca número. Se convierte con int() antes de hacer cuentas; si no, + pega en vez de sumar.',
};

function pasoDeProblema(p: ProblemaPrograma): PasoCodigo {
  return {
    id: p.id,
    titulo: p.titulo,
    instruccion: `${p.enunciado} Escríbelo en la celda «${p.celda}», debajo de los datos (▶ corre sólo esa celda), y cuando creas que está listo pulsa «Enviar al juez».`,
    pista: p.pistas[0],
    senal: { control: 'editor' },
    logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
    aprendido: APRENDIDO[p.id],
  };
}

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'cuatro-cajas',
      titulo: 'Cuatro cajas, cuatro tipos',
      instruccion:
        'En la celda «Cajas», guarda cuatro datos tuyos —los que quieras, con los nombres que quieras—: uno que sea un número entero, uno con decimales, uno que sea un texto y uno que sea verdadero o falso. Ejecuta y mira la Mesa de tipos.',
      pista: 'Mira la ficha del manual: la forma de escribir cada dato decide su tipo. ¿Qué lleva un texto para que Python sepa dónde empieza y dónde acaba?',
      senal: { control: 'editor' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.error === null && cuatroTipos(e) },
      aprendido:
        'El tipo no se declara: sale de cómo escribes el dato. Sin punto, int; con punto, float; entre comillas, str; True o False, bool.',
    },
    {
      id: 'preguntale',
      titulo: 'Pregúntale a Python',
      instruccion: 'En la misma celda, haz que Python te diga en la consola de qué tipo es alguna de tus cajas. Ejecuta.',
      pista: 'Hay una herramienta que contesta el tipo de lo que le das. Está en la ficha del manual.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.error === null && e.salida.some((l) => l.includes("<class '")) },
      aprendido: 'type() contesta con la clase del dato: <class \'int\'>, <class \'str\'>… Es la forma de salir de dudas cuando no sabes qué tienes en una caja.',
    },
    {
      id: 'mezcla-a-proposito',
      titulo: 'Mézclalos a propósito',
      instruccion:
        'En la celda «Problema 1» ya hay un nombre y una edad. Haz que Python se queje de juntar un texto con un número usando +, y lee con calma lo que dice el error.',
      pista: 'Junta el nombre, que es texto, con la edad, que es número, usando + como si los dos fueran texto.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'tipo' },
      aprendido:
        'Es un error de tipo: + sabe pegar dos textos y sabe sumar dos números, pero no sabe qué hacer con un texto y un número. Python no adivina: te pide que decidas.',
    },
    pasoDeProblema(T1),
    pasoDeProblema(T2),
    {
      id: 'no-se-deja',
      titulo: 'El que no se deja convertir',
      instruccion:
        'En la celda «Problema 3», intenta convertir a número entero un texto que no tenga escrito un número. Ejecuta: es otro error, y de otra familia.',
      pista: 'int() sabe leer un texto que tiene cifras. Dale uno con letras.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'valor' },
      aprendido:
        'Es un error de valor: el tipo está bien —int() recibe textos—, pero ese texto en particular no tiene un número. El de tipo es «no se mezcla»; el de valor, «este dato no sirve».',
    },
    pasoDeProblema(T3),
    {
      id: 'la-caja-del-texto',
      titulo: 'Para cerrar · ¿Qué pasó con la caja?',
      instruccion:
        'En El marcador convertiste los puntos con int() para sumar. Después de esa línea, si le preguntas a Python el tipo de la variable puntos, ¿qué contesta?',
      pista: 'Convertir, ¿cambia lo que hay en la caja, o fabrica un dato nuevo que se usa en la cuenta?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          "<class 'str'>: int() fabrica un número nuevo para la cuenta, pero la caja puntos sigue guardando el texto.",
          "<class 'int'>: al convertirla, la caja cambió de tipo para siempre.",
          "<class 'float'>: al sumarle el bono se volvió número con decimales.",
          'Ninguno: después de convertirla, la variable deja de existir.',
        ],
        correcta: 0,
      },
      aprendido:
        'Convertir fabrica un dato nuevo; la caja de origen no cambia. Si quisieras guardar el número, tendrías que meterlo en una caja. Esa idea sostiene toda la clase que sigue.',
    },
  ],
  cierre:
    'Sabes de qué tipo es cada dato, cómo preguntárselo a Python, qué error sale al mezclarlos y cuál al convertir lo que no se deja. Y tus tres programas funcionaron con datos que no escribiste tú.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n7-variables-y-tipos',
  titulo: 'Variables y tipos',
  archivo: ARCHIVO,
  insignia: { nombre: 'Cada dato en su caja', emoji: '📦' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 1 de 5',
    tema: 'Variables y tipos de dato',
    objetivo:
      'Vas a distinguir los cuatro tipos básicos de Python —int, float, str y bool—, a provocar los dos errores que salen al mezclarlos o convertirlos mal, y a escribir tres programas que un juez prueba cambiando sus datos.',
    vasAHacer: [
      'Guardar cuatro datos tuyos y ver de qué tipo nace cada uno.',
      'Preguntarle el tipo a Python y provocar un error de tipo a propósito.',
      'Imprimir una credencial y repartir pizzas con las dos divisiones.',
      'Provocar un error de valor y sumar un dato que llega como texto.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_TIPOS,
  guion: GUION,
  panelFijo: { titulo: 'El juez de los tipos', Cuerpo: PanelTipos },
  variables: false,
  bit: {
    inicio:
      'Un dato no es sólo su valor: también es su tipo. Y hoy el juez no teclea nada: cambia los datos de arriba de cada celda, así que tu programa tiene que funcionar con cualquiera.',
    cierre: 'Ya distingues los cuatro tipos y sabes convertir. Eso es la mitad de los errores de un programa.',
  },
  final: {
    titulo: 'Cada dato en su caja',
    detalle:
      'Clasificaste cuatro tipos, provocaste el error de tipo y el de valor, y escribiste tres programas que funcionaron con los datos que el juez quiso. El TypeError y el ValueError ya no son un susto: son dos preguntas con respuesta.',
  },
};

export function LabVariablesYTipos(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabVariablesYTipos;
