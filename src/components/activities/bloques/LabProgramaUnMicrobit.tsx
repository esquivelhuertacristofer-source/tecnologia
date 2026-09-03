'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  nuevoBloque,
  pila,
  programaDe,
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
}

const MUNDO_INICIAL: MundoMicrobit = { pantalla: null, ultimaAccion: null, vecesA: 0, vecesB: 0 };

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

const CATALOGO: FichaBloque[] = [
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

const PROGRAMA_INICIAL: Programa = programaDe(
  pila('p-inicio', sombreroFijo('al-empezar', 'h-inicio'), []),
  pila('p-a', sombreroFijo('al-presionar-a', 'h-a'), []),
  pila('p-b', sombreroFijo('al-presionar-b', 'h-b'), []),
);

/* ─────────────────────────────── el guion ─────────────────────────────────── */

const GUION: readonly EncargoBloques<MundoMicrobit>[] = [
  {
    id: 'icono-a',
    titulo: 'Un icono cuando presionas A',
    instruccion:
      'Bajo el sombrero «al presionar A» arrastra (o toca y toca el hueco) el bloque «mostrar icono», y elige 🙂 feliz. Después pulsa el botón A de la placa.',
    pista: '«mostrar icono» está en la categoría Pantalla. Suéltalo justo debajo de «al presionar A» y elige «feliz» en la lista.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.pantalla === 'feliz' && ctx.mundo.ultimaAccion === 'mostrar-icono',
    },
    aprendido: 'Cada guion empieza con un sombrero: «al presionar A» sólo corre cuando de verdad presionas A.',
  },
  {
    id: 'icono-b',
    titulo: 'Otro icono para B',
    instruccion: 'Ahora bajo «al presionar B» pon «mostrar icono» con 😢 triste, y pulsa el botón B.',
    pista: 'Es el mismo bloque que usaste con A: tócalo en la paleta y toca el hueco debajo de «al presionar B».',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.mundo.pantalla === 'triste' },
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
      'Quita los dos bloques de «al empezar» con la ✕ y vuelve a ponerlos al revés: primero «apagar pantalla», después «mostrar icono» con ⭐. Reinicia la placa.',
    pista: 'La ✕ está a la derecha de cada bloque puesto. Después arrástralos (o tócalos) en el nuevo orden.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.mundo.pantalla === 'estrella' },
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
      establecerMundo((m) => ({ ...m, vecesA: m.vecesA + 1 }));
      correr('p-a');
    } else if (id === 'boton-b') {
      establecerMundo((m) => ({ ...m, vecesB: m.vecesB + 1 }));
      correr('p-b');
    } else if (id === 'reiniciar') {
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
