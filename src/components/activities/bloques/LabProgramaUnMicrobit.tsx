'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  arrancar,
  nuevoBloque,
  pila,
  programaDe,
  siguiente,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SalaBloques, type ClaseBloques, type EncargoBloques, type EscenarioProps } from './SalaBloques';
import './microbit.css';

/**
 * N6 · U «Robótica y STEAM» · parada 2 — «Programa un micro:bit» (curriculo.ts:
 * `n6-programa-un-microbit`, unidad `n6-robotica-y-steam`).
 *
 * **6.º de primaria, 11–12 años**, comprobado en `curriculo.ts` antes de
 * escribir: mismo registro que `n6-primeras-lineas-python` (§50) — la
 * metáfora ayuda, las frases son cortas, el error no regaña.
 *
 * ── Por qué ÉSTA es la primera de las tres clases de bloques ────────────────
 *
 * Es la única de las tres que NO necesita control (`si`/`repetir`): enseña
 * algo distinto y anterior — que un programa puede tener VARIOS guiones, cada
 * uno con su propio sombrero, y que quién los dispara es el mundo (un botón
 * de verdad), no el orden en que se escribieron. Es exactamente el caso que
 * motivó que el armazón admitiera «varias pilas con sombrero, y `correr(pila)`
 * arrancando la que toque» (`simuladores/bloques/index.ts`, punto 7).
 *
 * La paleta está acotada a propósito: sin `si` ni `repetir`, porque ésos son
 * el tema de `n6-reto-robot`, la siguiente parada.
 */

/* ───────────────────────────── el mundo: la placa ─────────────────────────── */

export type IconoMicrobit = 'feliz' | 'triste' | 'flecha-arriba' | 'estrella';

const EMOJI_ICONO: Record<IconoMicrobit, string> = {
  feliz: '🙂',
  triste: '😢',
  'flecha-arriba': '⬆️',
  estrella: '⭐',
};

export interface MundoMicrobit {
  pantalla: IconoMicrobit | null;
  ultimaAccion: string | null;
  vecesA: number;
  vecesB: number;
  /** La pila que disparó el último botón (§69.11): el juez sabe así QUÉ botón se pulsó al final. */
  ultimaPila: string | null;
}

export const MUNDO_INICIAL: MundoMicrobit = { pantalla: null, ultimaAccion: null, vecesA: 0, vecesB: 0, ultimaPila: null };

function esIcono(v: unknown): v is IconoMicrobit {
  return v === 'feliz' || v === 'triste' || v === 'flecha-arriba' || v === 'estrella';
}

/** Puro: sólo lee el evento, nunca el reloj. */
function reducirMicrobit(m: MundoMicrobit, e: EventoBloques): MundoMicrobit {
  if (e.tipo !== 'accion') return m;
  if (e.accion === 'mostrar-icono') {
    const icono = esIcono(e.args.icono) ? e.args.icono : 'feliz';
    return { ...m, pantalla: icono, ultimaAccion: e.accion };
  }
  if (e.accion === 'apagar-pantalla') {
    return { ...m, pantalla: null, ultimaAccion: e.accion };
  }
  return m;
}

/** Esta clase no usa hexágonos: ningún guion pregunta nada. */
function preguntarMicrobit(): boolean {
  return false;
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

export const CATALOGO: FichaBloque[] = [
  { id: 'al-empezar', categoria: 'inicio', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
  { id: 'al-presionar-a', categoria: 'inicio', etiqueta: 'al presionar A', semantica: { tipo: 'sombrero' } },
  { id: 'al-presionar-b', categoria: 'inicio', etiqueta: 'al presionar B', semantica: { tipo: 'sombrero' } },
  {
    id: 'mostrar-icono',
    categoria: 'pantalla',
    etiqueta: 'mostrar icono',
    semantica: { tipo: 'accion' },
    verbo: 'mostrar-icono',
    ranuras: [
      {
        id: 'icono',
        tipo: 'texto',
        valor: 'feliz',
        opciones: ['feliz', 'triste', 'flecha-arriba', 'estrella'],
      },
    ],
    texto: 'mostrar_icono(...)',
  },
  {
    id: 'apagar-pantalla',
    categoria: 'pantalla',
    etiqueta: 'apagar pantalla',
    semantica: { tipo: 'accion' },
    verbo: 'apagar-pantalla',
    texto: 'apagar_pantalla()',
  },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'inicio', nombre: 'Cuando', color: '#22d3ee' },
  { id: 'pantalla', nombre: 'Pantalla', color: '#fbbf24' },
];

function sombreroFijo(fichaId: string, id: string) {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

export const PROGRAMA_INICIAL: Programa = programaDe(
  pila('p-inicio', sombreroFijo('al-empezar', 'h-inicio'), []),
  pila('p-a', sombreroFijo('al-presionar-a', 'h-a'), []),
  pila('p-b', sombreroFijo('al-presionar-b', 'h-b'), []),
);

/* ─────────────────────────────── el juez ──────────────────────────────────── */

/**
 * Corre UNA pila sin pantalla, desde el mundo que se le dé, y devuelve lo que
 * queda en la placa (§69.11). Así el encargo 1 no se cumple con una cara feliz
 * que salió del sombrero de B: se juzga la pila del botón que la clase pide.
 */
export function pantallaTras(
  programa: Programa,
  pilaId: string,
  desde: MundoMicrobit = MUNDO_INICIAL,
): IconoMicrobit | null {
  let mundo = desde;
  let estado = arrancar(programa, CATALOGO, { pila: pilaId });
  while (!estado.fin) {
    const paso = siguiente(estado, preguntarMicrobit);
    estado = paso.estado;
    if (paso.evento) mundo = reducirMicrobit(mundo, paso.evento);
  }
  return mundo.pantalla;
}

function fichasDe(programa: Programa, pilaId: string): string[] {
  return programa.pilas.find((p) => p.id === pilaId)?.bloques.map((b) => b.ficha) ?? [];
}

/**
 * El botón se pulsó CON la pila ya bien armada: lo dice el parte de la última
 * corrida (su `programa` es la foto del momento en que corrió), no el editor.
 */
function botonCumple(
  ctx: { parte: { programa: Programa } | null; programa: Programa; mundo: MundoMicrobit },
  pilaId: string,
  icono: IconoMicrobit,
): boolean {
  return (
    ctx.parte !== null &&
    ctx.mundo.ultimaPila === pilaId &&
    ctx.mundo.pantalla === icono &&
    pantallaTras(ctx.parte.programa, pilaId) === icono &&
    pantallaTras(ctx.programa, pilaId) === icono
  );
}

/** Encargo 5: los dos bloques siguen ahí, y al reiniciar queda la estrella aunque hubiera otra cara puesta. */
export function reinicioDejaLaEstrella(programa: Programa): boolean {
  const fichas = fichasDe(programa, 'p-inicio');
  return (
    fichas.includes('apagar-pantalla') &&
    fichas.includes('mostrar-icono') &&
    pantallaTras(programa, 'p-inicio', { ...MUNDO_INICIAL, pantalla: 'triste' }) === 'estrella'
  );
}

/* ─────────────────────────────── el guion ─────────────────────────────────── */

export const GUION: readonly EncargoBloques<MundoMicrobit>[] = [
  {
    id: 'icono-a',
    titulo: 'Una cara feliz con el botón A',
    instruccion:
      'Haz que al pulsar el botón A la placa ponga una cara feliz 🙂. El bloque que dibuja en la pantalla se llama «mostrar icono» (está en Pantalla). Fíjate en los sombreros de arriba de cada guion: cada uno dice CUÁNDO corre lo que cuelga de él. Cuando lo tengas, pulsa A en la placa.',
    pista: 'Hay tres sombreros. Lee cada uno: ¿cuál de ellos corre cuando alguien pulsa A?',
    logro: { tipo: 'estado', comprueba: (ctx) => botonCumple(ctx, 'p-a', 'feliz') },
    aprendido: 'Cada guion empieza con un sombrero: «al presionar A» sólo corre cuando de verdad presionas A.',
  },
  {
    id: 'icono-b',
    titulo: 'Una cara triste con el botón B',
    instruccion: 'Ahora haz que el botón B ponga una cara triste 😢, sin que A deje de poner la feliz. Pruébalo pulsando B.',
    pista: 'Es el mismo bloque que usaste con A. La pregunta es la de antes: ¿qué sombrero corre cuando pulsas B?',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => botonCumple(ctx, 'p-b', 'triste') && pantallaTras(ctx.programa, 'p-a') === 'feliz',
    },
    aprendido: 'Dos sombreros, dos guiones distintos: cada botón corre SU pila, nunca la del otro.',
  },
  {
    id: 'vacio',
    titulo: 'El sombrero que arranca solo',
    instruccion:
      'Hay un tercer sombrero: «al empezar». Pulsa «Reiniciar placa» sin poner nada debajo todavía, y lee el aviso de abajo.',
    pista: 'El botón «Reiniciar placa» corre el guion de «al empezar». Como está vacío, el editor te lo dice: no es un error tuyo.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && ctx.parte.fin === 'vacio' },
    aprendido: 'Un guion vacío no truena: el editor avisa «está vacío» en vez de fallar en silencio.',
  },
  {
    id: 'orden',
    titulo: 'El orden importa',
    instruccion:
      'Bajo «al empezar» arrastra «mostrar icono» con ⬆️ y, DESPUÉS de ese, «apagar pantalla». Pulsa «Reiniciar placa»: usa ⏭ para verlo bloque por bloque antes de dejarlo correr solo.',
    pista: 'Con ⏭ ves qué bloque se ilumina. El último que corre es el que se queda en pantalla.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.ultimaAccion === 'apagar-pantalla' && ctx.mundo.pantalla === null,
    },
    aprendido: 'Los bloques se cumplen de arriba abajo: el último que corre es el que se queda.',
  },
  {
    id: 'arregla-orden',
    titulo: 'Arréglalo',
    instruccion:
      'Ahora queremos lo contrario: que al reiniciar, la pantalla se limpie y quede una estrella ⭐. Usa los MISMOS dos bloques, sin quitar ninguno; el icono puedes cambiarlo. Reinicia la placa para probarlo.',
    pista: 'Ya viste que se queda el último bloque que corre. ¿Cuál de los dos tiene que correr al final?',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        ctx.parte !== null &&
        ctx.mundo.ultimaPila === 'p-inicio' &&
        ctx.mundo.pantalla === 'estrella' &&
        reinicioDejaLaEstrella(ctx.parte.programa) &&
        reinicioDejaLaEstrella(ctx.programa),
    },
    aprendido: 'Cambiar el orden cambia el resultado, aunque los bloques sean exactamente los mismos.',
  },
  {
    id: 'quien-corre',
    titulo: '¿Quién decide qué guion corre?',
    instruccion: 'Última pregunta: ¿qué es lo que decide si corre el guion de A o el de B?',
    pista: 'Piensa en qué pasó cuando pulsaste cada botón.',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'El orden en que arrastraste los bloques',
        'Qué botón de la placa presionaste de verdad',
        'El color de las fichas',
      ],
      correcta: 1,
    },
    aprendido: 'Cada botón dispara SU sombrero. El micro:bit vive escuchando eventos, no ejecutando todo de corrido.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

function Placa({ mundo, accionar }: EscenarioProps<MundoMicrobit>) {
  return (
    <div className="mb-placa" data-testid="mb-placa">
      <div className="mb-pantalla" data-testid="mb-pantalla" data-icono={mundo.pantalla ?? 'apagada'}>
        <span aria-hidden="true">{mundo.pantalla ? EMOJI_ICONO[mundo.pantalla] : ''}</span>
      </div>
      <div className="mb-botones">
        <button type="button" className="mb-boton" data-testid="mb-boton-a" onClick={() => accionar('boton-a')}>
          A
        </button>
        <button type="button" className="mb-boton mb-boton--reset" data-testid="mb-reiniciar" onClick={() => accionar('reiniciar')}>
          ⟳ Reiniciar placa
        </button>
        <button type="button" className="mb-boton" data-testid="mb-boton-b" onClick={() => accionar('boton-b')}>
          B
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── la clase ─────────────────────────────────── */

const CLASE: ClaseBloques<MundoMicrobit> = {
  actividadId: 'n6-programa-un-microbit',
  titulo: 'Programa un micro:bit',
  marca: 'Tecnia Bloques · Micro:bit',
  insignia: { nombre: 'Programador de placas', emoji: '📟' },
  minutos: 20,
  portada: {
    situacion: 'Nivel 6 · Robótica y STEAM · Parada 2 de 3',
    tema: 'Programa un micro:bit',
    objetivo:
      'Vas a salir de aquí sabiendo que un programa puede tener varios guiones a la vez, cada uno con su propio disparador: un botón, un sensor, el momento de encender.',
    vasAHacer: [
      'Programar qué hace la placa al presionar el botón A y al presionar el B.',
      'Ver qué pasa cuando un guion está vacío.',
      'Provocar un resultado equivocado a propósito por el orden de los bloques, y arreglarlo.',
      'Decidir qué es lo que de verdad dispara cada guion.',
    ],
  },
  catalogo: CATALOGO,
  categorias: CATEGORIAS,
  categoriaInicial: 'inicio',
  programaInicial: PROGRAMA_INICIAL,
  velocidad: 400,
  mundoInicial: MUNDO_INICIAL,
  preguntar: preguntarMicrobit,
  reducir: reducirMicrobit,
  manejarAccion: (id, { correr, establecerMundo }) => {
    if (id === 'boton-a') {
      establecerMundo((m) => ({ ...m, vecesA: m.vecesA + 1, ultimaPila: 'p-a' }));
      correr('p-a');
    } else if (id === 'boton-b') {
      establecerMundo((m) => ({ ...m, vecesB: m.vecesB + 1, ultimaPila: 'p-b' }));
      correr('p-b');
    } else if (id === 'reiniciar') {
      establecerMundo((m) => ({ ...m, ultimaPila: 'p-inicio' }));
      correr('p-inicio');
    }
  },
  guion: GUION,
  Escenario: Placa,
  bit: {
    inicio: 'Esto es un simulador de micro:bit. Cada botón de la placa corre su propio guion: prográmalos.',
    cierre: 'Programaste tres guiones distintos y aprendiste qué los dispara a cada uno. Así piensa un micro:bit de verdad.',
  },
  final: {
    titulo: '¡Tu primera placa programada!',
    detalle: 'Tres sombreros, tres guiones, y tú decidiendo qué corre cuándo. Eso es programar por eventos.',
  },
};

export function LabProgramaUnMicrobit(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE} />;
}

export default LabProgramaUnMicrobit;
