'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { repr } from '@/components/simuladores/codigo/valores';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';
import { CELDAS_LISTAS, L1, L2, L3, L4, L5, MANUAL_LISTAS, PROBLEMAS_LISTAS } from './problemasListas';

/**
 * N8 · U «Programación en texto II» (n8-python-2) · parada 1 de 4 — «Listas y
 * diccionarios». **2.º de secundaria, 13–14 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §69.20. Reescrita el 6-oct-2026 sobre el juez de programas
 * con `datos` (§69.19).
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Diez encargos que dictaban la línea, incluido el `IndexError` «provocado»
 * (`print(mochila[10])`) y su arreglo. Y la lista era siempre la misma:
 * `mochila[2]` aprobaba igual que `mochila[-1]`.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Cinco problemas con juez (`problemasListas.ts`): el juez cambia la lista o el
 * diccionario de arriba de la celda —con una sola cosa, con cinco, vacía, con
 * un producto en 0—. Una exploración (la casilla que no existe) y un cierre
 * sobre `mochila[len(mochila)]`.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero y, debajo y fuera de los problemas, **La Mochila**: las casillas
 * de la primera lista que corrió con su número de posición (o las claves de un
 * diccionario), y el aviso cuando el error es de índice.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'mochila.py';

export const PLANTILLA = [
  '# mochila.py · muchos datos en una sola caja',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas.',
  '# Las primeras líneas de cada celda traen los datos: el juez los cambia.',
  '',
  '# %% Problema 1 · Lo primero y lo último',
  'mochila = ["cuaderno", "lápiz", "regla"]',
  '',
  '',
  '# %% Problema 2 · El pedido nuevo',
  'mochila = ["cuaderno", "lápiz"]',
  'nuevo = "regla"',
  '',
  '',
  '# %% Problema 3 · Lo que cuesta',
  'precios = [12, 30, 22]',
  '',
  '',
  '# %% Problema 4 · ¿Lo tenemos?',
  'inventario = {"lápiz": 12, "goma": 0, "regla": 5}',
  'buscar = "lápiz"',
  '',
  '',
  '# %% Problema 5 · Los agotados',
  'inventario = {"lápiz": 12, "goma": 0, "regla": 5}',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

/** «La Mochila» — las casillas de la primera lista (o las claves del primer diccionario) que corrió. */
function PanelMochila({ ejecucion }: PanelCodigoProps) {
  const caja = ejecucion.variables.find((v) => v.valor.t === 'lista' || v.valor.t === 'dicc');
  if (!caja || (caja.valor.t !== 'lista' && caja.valor.t !== 'dicc')) {
    return (
      <p className="pyc-vacio" data-testid="pyc-mochila-vacia">
        La Mochila: pulsa ▶ y aquí vas a ver cada casilla de tu lista con su número de posición.
      </p>
    );
  }

  const fueraDeRango = ejecucion.fase === 'error' && ejecucion.error?.clase === 'indice';

  if (caja.valor.t === 'dicc') {
    return (
      <div data-testid="pyc-mochila">
        <h5 className="pyc-semaforo-titulo">{caja.nombre} · por clave</h5>
        <ul className="pyc-filas">
          {[...caja.valor.v.values()].map(({ clave, valor }, i) => (
            <li key={i}>
              <span className="pyc-fila">
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{caja.nombre}[{repr(clave)}]</span>
                  <span className="pyc-fila-detalle">{repr(valor)}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="pyc-nota">Un diccionario no tiene posiciones: cada dato se pide por su clave.</p>
      </div>
    );
  }

  const casillas = caja.valor.v;
  return (
    <div data-testid="pyc-mochila">
      <h5 className="pyc-semaforo-titulo">{caja.nombre} · casilla por casilla</h5>
      <ul className="pyc-filas">
        {casillas.map((valor, i) => (
          <li key={i}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">
                  {caja.nombre}[{i}]
                </span>
                <span className="pyc-fila-detalle">{repr(valor)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="pyc-nota" data-fuera-de-rango={fueraDeRango ? 'si' : 'no'}>
        {casillas.length === 0
          ? 'La lista está vacía: no tiene ninguna casilla.'
          : fueraDeRango
            ? `Ese índice no tiene casilla: las que existen van de 0 a ${casillas.length - 1}.`
            : `Las posiciones van de 0 a ${casillas.length - 1}. La -1 es la última, contando desde el final.`}
      </p>
    </div>
  );
}

const PanelListas = crearPanelJuezProgramas({
  problemas: PROBLEMAS_LISTAS,
  manual: MANUAL_LISTAS,
  fuera: PanelMochila,
  pie: PanelMochila,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [L1.id]:
    'La primera casilla es la 0 y la última se pide con -1, sin saber cuántas hay. Escribir la posición a mano sólo funciona con la lista del ejemplo.',
  [L2.id]:
    'append agrega al final de la misma lista: no hace falta crear otra. Y print de una lista la escribe como Python: con corchetes y comillas.',
  [L3.id]:
    'Recorrer una lista recordando algo —un total, el mayor visto— es de las cosas que más se hacen con listas. sum() y max() lo hacen por ti, y está bien usarlos.',
  [L4.id]:
    'Con un diccionario, primero se pregunta si la clave existe (in) y después se lee. «¿Existe?» no es lo mismo que «¿hay piezas?»: un producto en 0 sí está.',
  [L5.id]:
    '.items() trae la clave y su valor a la vez, en el orden en que se guardaron. Contar sólo algunos es un contador que crece dentro de un if.',
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
    pasoDeProblema(L1),
    {
      id: 'la-casilla-que-no-existe',
      titulo: 'La casilla que no existe',
      instruccion:
        'En la misma celda, pídele a la mochila una casilla que no tenga y ejecuta. Lee con calma el error y mira La Mochila: ahí está qué casillas sí existen.',
      pista: 'La mochila del ejemplo tiene tres cosas. ¿Qué número de casilla ya no le toca a nadie?',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'indice' },
      aprendido:
        'Es un error de índice: la casilla no existe. No es un fallo raro; es la lista diciéndote hasta dónde llega. Por eso la última se pide con -1 y no con un número escrito a mano.',
    },
    pasoDeProblema(L2),
    pasoDeProblema(L3),
    pasoDeProblema(L4),
    pasoDeProblema(L5),
    {
      id: 'la-posicion-del-len',
      titulo: 'Para cerrar · La casilla de len',
      instruccion:
        'Un compañero quiso la última cosa de la mochila pidiendo la casilla que dice len de la mochila. Le salió un error de índice con cualquier mochila, con una cosa o con cinco. ¿Por qué?',
      pista: 'Con tres cosas, len vale 3. ¿Qué casillas tiene una lista de tres?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque las casillas empiezan en 0: con 3 cosas van de la 0 a la 2, y la 3 —lo que vale len— ya no existe. La última es len menos uno, o -1.',
          'Porque len sólo funciona con diccionarios.',
          'Porque len cuenta las letras de cada cosa y no las cosas.',
          'Porque a Python no le gusta usar una función dentro de los corchetes.',
        ],
        correcta: 0,
      },
      aprendido:
        'len dice cuántas cosas hay; como se empieza a contar en 0, la última casilla siempre es una menos. Es el error de índice más común de todos.',
    },
  ],
  cierre:
    'Leíste listas por posición, las hiciste crecer, las recorriste recordando lo importante, y preguntaste a un diccionario antes de pedirle algo. Y todo funcionó con mochilas e inventarios que no viste.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n8-listas-y-diccionarios',
  titulo: 'Listas y diccionarios',
  archivo: ARCHIVO,
  insignia: { nombre: 'Ordenaste tu mochila', emoji: '🎒' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 8 · Programación en texto II · Parada 1 de 4',
    tema: 'Listas y diccionarios: muchos datos, una sola caja',
    objetivo:
      'Una mochila es una lista y el inventario de la cooperativa es un diccionario. Vas a escribir cinco programas que los leen, los hacen crecer y los recorren, y un juez los va a probar con mochilas de una cosa, de cinco y vacías, e inventarios con productos en cero.',
    vasAHacer: [
      'Leer la primera y la última casilla de una lista sin saber cuántas trae.',
      'Pedir una casilla que no existe y leer el error.',
      'Hacer crecer una lista y recorrerla recordando el total y el más caro.',
      'Preguntarle a un diccionario antes de pedirle algo, y recorrerlo con su clave y su valor.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_LISTAS,
  guion: GUION,
  panelFijo: { titulo: 'El juez de la mochila', Cuerpo: PanelListas },
  bit: {
    inicio:
      'Hoy muchos datos viven en una sola caja. Y el juez no va a usar tu mochila: va a cambiarla por una de una cosa, una de cinco y una vacía.',
    cierre:
      'Ya sabes guardar muchos datos en una caja de dos formas: una lista por posición y un diccionario por clave. Y tus programas funcionan con cualquiera.',
  },
  final: {
    titulo: 'Ordenaste tu mochila',
    detalle:
      'Cinco programas con listas y diccionarios —los extremos, el pedido, el total y el más caro, ¿lo tenemos?, los agotados—, aceptados por un juez que cambió la mochila y el inventario en cada caso. Y sabes por qué la casilla de len no existe.',
  },
};

export function LabListasYDiccionarios(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabListasYDiccionarios;
