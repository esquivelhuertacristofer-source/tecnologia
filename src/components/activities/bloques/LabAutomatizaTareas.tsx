'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  nuevoBloque,
  pila,
  programaDe,
  recorrer,
  type BloquePuesto,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SalaBloques, type ClaseBloques, type EncargoBloques, type EscenarioProps } from './SalaBloques';
import './automatiza.css';

/**
 * N9 · U «IA y automatización» · parada 1 — «Automatiza tareas repetitivas»
 * (curriculo.ts: `n9-automatiza-tareas`, unidad `n9-ia-y-automatizacion`).
 *
 * **3.º de secundaria, 14–15 años**, comprobado en `curriculo.ts` antes de
 * escribir. Registro distinto de las dos clases de N6: aquí no hay metáfora
 * de caja ni «no te regaña» — se nombra el mecanismo con su porqué, como en
 * el salto de registro descrito en §30.4 y §50.0 para N7/N9: se explica POR
 * QUÉ una regla vacía se contesta que no, no sólo QUÉ hace.
 *
 * ── El escenario, y por qué es el tercero que necesitaba el armazón ─────────
 *
 * Una bandeja de entrada con reglas «si esto entonces aquello» es
 * exactamente el caso de uso que el canon apunta en la cabecera del armazón:
 * «en `n9` no se llaman Movimiento y Sensores sino Cuando y Entonces» — así
 * que las categorías de este catálogo son literalmente ésas.
 *
 * El mundo NO se reinicia entre corridas (a diferencia de `n6-reto-robot`):
 * el resultado de cada correo simulado se queda a la vista, porque el reto
 * aquí es leer el efecto de una regla, no repetir un recorrido desde cero.
 */

/* ─────────────────────────────── el mundo: la bandeja ─────────────────────── */

interface CorreoSim {
  id: string;
  asunto: string;
}

interface ResultadoCorreo {
  id: string;
  carpeta: string;
}

export interface MundoAutomatiza {
  correoActual: CorreoSim | null;
  ultimoResultado: ResultadoCorreo | null;
}

const CORREOS: readonly CorreoSim[] = [
  { id: 'factura', asunto: 'Tu factura de luz está lista' },
  { id: 'spam', asunto: 'GANA UN VIAJE GRATIS AHORA' },
];

const MUNDO_INICIAL: MundoAutomatiza = { correoActual: null, ultimoResultado: null };

/** Puro: sólo lee el evento y el correo que ya estaba puesto en el mundo. */
function reducirAutomatiza(m: MundoAutomatiza, e: EventoBloques): MundoAutomatiza {
  if (e.tipo !== 'accion' || !m.correoActual) return m;
  if (e.accion === 'archivar-en') {
    const carpeta = typeof e.args.carpeta === 'string' ? e.args.carpeta : 'Otros';
    return { ...m, ultimoResultado: { id: m.correoActual.id, carpeta } };
  }
  return m;
}

function preguntarAutomatiza(pregunta: string, bloque: BloquePuesto, m: MundoAutomatiza): boolean {
  if (pregunta === 'asunto-contiene') {
    const buscado = typeof bloque.args?.texto === 'string' ? bloque.args.texto : '';
    const asunto = m.correoActual?.asunto.toLowerCase() ?? '';
    return buscado.length > 0 && asunto.includes(buscado.toLowerCase());
  }
  return false;
}

/** ¿Hay un «si» cuyo hueco hexagonal quedó sin pieza? */
function tieneSiSinCondicion(programa: Programa): boolean {
  return recorrer(programa).some((b) => b.ficha === 'si' && b.condicion === null);
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

const CATALOGO: FichaBloque[] = [
  { id: 'cuando-llega-correo', categoria: 'cuando', etiqueta: 'cuando llega un correo', semantica: { tipo: 'sombrero' } },
  {
    id: 'asunto-contiene',
    categoria: 'entonces',
    etiqueta: 'el asunto contiene',
    semantica: { tipo: 'condicion' },
    verbo: 'asunto-contiene',
    ranuras: [{ id: 'texto', tipo: 'texto', valor: 'factura' }],
  },
  { id: 'si', categoria: 'entonces', etiqueta: 'si _ si no', semantica: { tipo: 'si-sino' } },
  {
    id: 'archivar-en',
    categoria: 'entonces',
    etiqueta: 'archivar en',
    semantica: { tipo: 'accion' },
    verbo: 'archivar-en',
    ranuras: [{ id: 'carpeta', tipo: 'texto', valor: 'Facturas', opciones: ['Facturas', 'Otros'] }],
    texto: 'archivar_en(...)',
  },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'cuando', nombre: 'Cuando', color: '#22d3ee' },
  { id: 'entonces', nombre: 'Entonces', color: '#a78bfa' },
];

function sombreroFijo(fichaId: string, id: string) {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

const PROGRAMA_INICIAL: Programa = programaDe(pila('p-correo', sombreroFijo('cuando-llega-correo', 'h-correo'), []));

/* ─────────────────────────────── el guion ─────────────────────────────────── */

const GUION: readonly EncargoBloques<MundoAutomatiza>[] = [
  {
    id: 'vacio',
    titulo: 'Bandeja sin reglas',
    instruccion: 'Pulsa «Simular correo: Factura de luz». Todavía no hay ninguna regla puesta: lee el aviso de abajo.',
    pista: 'El sombrero «cuando llega un correo» está ahí, pero sin nada debajo. El editor te lo dice.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && ctx.parte.fin === 'vacio' },
    aprendido: 'Una regla vacía no hace nada, y el sistema lo confirma en vez de fallar en silencio.',
  },
  {
    id: 'regla-factura',
    titulo: 'Tu primera regla',
    instruccion:
      'Bajo el sombrero pon «si _ si no»; en su hueco hexagonal, «el asunto contiene» con el texto «factura»; en la rama de arriba, «archivar en» → Facturas. Simula el correo de factura.',
    pista: 'El hueco hexagonal sólo acepta preguntas. Escribe «factura» en minúsculas.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.ultimoResultado?.id === 'factura' && ctx.mundo.ultimoResultado?.carpeta === 'Facturas',
    },
    aprendido: 'Una regla de automatización es siempre lo mismo: una pregunta y una acción.',
  },
  {
    id: 'spam-sin-regla',
    titulo: '¿Y el correo que no es factura?',
    instruccion:
      'Con la MISMA regla, simula ahora «Cadena de spam». Su asunto no contiene «factura», así que la pregunta contesta que no: fíjate en qué pasa.',
    pista: 'Mira el resultado: como no coincidió, la rama de abajo («si no») todavía está vacía.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        ctx.mundo.correoActual?.id === 'spam' &&
        ctx.parte !== null &&
        ctx.mundo.ultimoResultado?.id !== 'spam',
    },
    aprendido: 'Cuando la pregunta contesta que no, sólo se cumple el «si no» — y aquí todavía está vacío.',
  },
  {
    id: 'agrega-sino',
    titulo: 'Complétala con «si no»',
    instruccion: 'En la rama «si no» de tu regla, pon «archivar en» → Otros. Vuelve a simular «Cadena de spam».',
    pista: 'La rama «si no» está debajo del rótulo «si no», dentro del mismo bloque.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.ultimoResultado?.id === 'spam' && ctx.mundo.ultimoResultado?.carpeta === 'Otros',
    },
    aprendido: 'Con las dos ramas escritas, la regla decide SIEMPRE, conteste la pregunta que sí o que no.',
  },
  {
    id: 'hueco-vacio',
    titulo: 'Quítale la pregunta',
    instruccion:
      'Quita del hueco hexagonal la pieza «el asunto contiene» con su ✕, dejándolo vacío. Simula otra vez «Factura de luz» y mira a qué carpeta va.',
    pista: 'Sin pregunta, el «si» tiene que decidir solo. Mira el resultado con cuidado.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        tieneSiSinCondicion(ctx.programa) &&
        ctx.mundo.ultimoResultado?.id === 'factura' &&
        ctx.mundo.ultimoResultado?.carpeta === 'Otros',
    },
    aprendido: 'Sin pregunta, la respuesta es SIEMPRE no: por eso hasta la factura terminó en «Otros».',
  },
  {
    id: 'por-que',
    titulo: '¿Por qué se archivó mal?',
    instruccion:
      'El bloque para archivarla en «Facturas» seguía ahí. Entonces, ¿por qué la factura terminó en «Otros»?',
    pista: 'Piensa en qué contesta un hueco hexagonal cuando no tiene ninguna pieza dentro.',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'El programa se rompió y no hizo nada',
        'Una pregunta vacía se contesta que no, así que siempre tomó el «si no»',
        'El orden de las carpetas cambió solo',
      ],
      correcta: 1,
    },
    aprendido: 'En una automatización, comprobar la condición no es opcional: es la mitad de la regla.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

function Bandeja({ mundo, accionar }: EscenarioProps<MundoAutomatiza>) {
  return (
    <div className="at-bandeja" data-testid="at-bandeja">
      <div className="at-correos">
        {CORREOS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="at-correo"
            data-testid={`at-simular-${c.id}`}
            onClick={() => accionar(c.id)}
          >
            <span className="at-correo-glifo" aria-hidden="true">
              ✉️
            </span>
            <span>Simular correo: {c.asunto}</span>
          </button>
        ))}
      </div>
      <div className="at-resultado" data-testid="at-resultado">
        <span className="at-resultado-etiqueta">Último resultado</span>
        {mundo.ultimoResultado ? (
          <p>
            «{CORREOS.find((c) => c.id === mundo.ultimoResultado?.id)?.asunto}» →{' '}
            <strong data-testid="at-carpeta">{mundo.ultimoResultado.carpeta}</strong>
          </p>
        ) : (
          <p className="at-resultado-vacio">Todavía ningún correo se archivó.</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── la clase ─────────────────────────────────── */

const CLASE: ClaseBloques<MundoAutomatiza> = {
  actividadId: 'n9-automatiza-tareas',
  titulo: 'Automatiza tareas repetitivas',
  marca: 'Tecnia Bloques · Automatización',
  insignia: { nombre: 'Automatiza de verdad', emoji: '⚙️' },
  minutos: 25,
  portada: {
    situacion: 'Nivel 9 · IA y automatización · Parada 1 de 3',
    tema: 'Automatiza tareas repetitivas',
    objetivo:
      'Vas a salir de aquí sabiendo armar una regla «si esto, entonces aquello» de verdad, y entendiendo por qué una condición mal comprobada rompe la automatización aunque el código «se vea bien».',
    vasAHacer: [
      'Ver qué pasa cuando llega un correo y no hay ninguna regla.',
      'Armar una regla que archive un correo según su asunto.',
      'Completarla con lo que pasa cuando la pregunta contesta que no.',
      'Provocar el error clásico de automatización: una condición vacía.',
    ],
  },
  catalogo: CATALOGO,
  categorias: CATEGORIAS,
  categoriaInicial: 'entonces',
  programaInicial: PROGRAMA_INICIAL,
  pilaInicial: 'p-correo',
  velocidad: 350,
  mundoInicial: MUNDO_INICIAL,
  preguntar: preguntarAutomatiza,
  reducir: reducirAutomatiza,
  manejarAccion: (id, { correr, establecerMundo }) => {
    const correo = CORREOS.find((c) => c.id === id);
    if (!correo) return;
    establecerMundo((m) => ({ ...m, correoActual: correo }));
    correr('p-correo');
  },
  guion: GUION,
  Escenario: Bandeja,
  bit: {
    inicio: 'Esta es una bandeja que se programa sola. Cada correo que llega dispara la misma regla: la que tú armes.',
    cierre: 'Armaste una regla completa y viste qué pasa cuando una condición se queda vacía. Así se rompen las automatizaciones de verdad.',
  },
  final: {
    titulo: '¡Tu primera automatización!',
    detalle: 'Una regla, dos correos, y tú descubriendo por qué comprobar la condición no es opcional.',
  },
};

export function LabAutomatizaTareas(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE} />;
}

export default LabAutomatizaTareas;
