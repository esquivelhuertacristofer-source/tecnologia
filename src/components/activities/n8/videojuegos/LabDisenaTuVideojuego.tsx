'use client';

/**
 * `n8-disena-tu-videojuego` · N8·«Producción multimedia y videojuegos», parada 3.
 * **13–14 años** (2.º de Secundaria, `curriculo.ts`). Documento maestro §67.
 *
 * REESCRITO EL 12-sep-2026. Lo que había: tres.js escrito a mano, dos
 * deslizadores y tres botones, una corrección que comparaba los cinco
 * parámetros del panel, y un nivel que se ganaba manteniendo → sin saltar.
 * Lo que hay: **Tecnia Juegos**, el creador de videojuegos 2D de la casa
 * (`simuladores/juego/`), y nueve encargos que se comprueban SIMULANDO el
 * nivel con los guiones del alumno —nunca leyendo el panel—.
 *
 * ── LOS TRES ACTOS ───────────────────────────────────────────────────────
 *
 *   1. La mecánica: el héroe no hace nada hasta que sus guiones digan qué.
 *      Caminar (E1), saltar una vez y no en el aire (E2), llegar a la repisa
 *      ajustando impulso y gravedad (E3).
 *   2. Las reglas del mundo: la moneda (E4), el pincho (E5) y la puerta con
 *      su condición (E6) son guiones de OTROS actores.
 *   3. El nivel y la prueba con jugadores: diseñar (E7), equilibrar con tres
 *      jugadores de prueba de distinta pericia (E8), y la única pregunta de
 *      elección (E9).
 *
 * ── CÓMO SE COMPRUEBA CADA ENCARGO ───────────────────────────────────────
 *
 * Con el motor: `simular` para caminar y saltar, una SONDA que deja caer al
 * héroe sobre la moneda / el pincho / la puerta para los contactos (así el
 * encargo de la moneda no depende de saber llegar a ella), y los resultados
 * VIGENTES del jugador de prueba para el nivel propio. Cada comprobación es
 * una función pura de `(nivel, pruebas)`, exportada para que la prueba de
 * Jest la mida con niveles armados sin ratón y con los señuelos.
 *
 * Los encargos NO son puertas de un solo sentido: si el alumno borra el `si`
 * del salto después de cumplir E2, el panel vuelve a E2. El avance que se
 * reporta a la plataforma sí es monótono (cada encargo cuenta la primera vez
 * que se cumple), porque un progreso que baja confunde al docente.
 *
 * ── LO QUE RESTA PUNTOS ──────────────────────────────────────────────────
 *
 * Fallar la pregunta de elección, y abrir la TERCERA pista de un encargo (la
 * que da la línea concreta). Nada más: jugar mal es el temario.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  actoresDeTipo,
  alturaDeSaltoDelHeroe,
  alturaMaximaAlcanzada,
  fichasDe,
  heroeDe,
  mantener,
  nivelSinMonedas,
  saltarCada,
  simular,
  sondaDeContacto,
  useJuego,
  VentanaJuego,
  versionDe,
  type Juego,
  type Nivel,
  type PerfilId,
  type ResultadoPrueba,
} from '@/components/simuladores/juego';
import { useSonidosJuego } from '@/components/simuladores/juego/ventana/useSonidosJuego';
import { ArcadeSala, useBit, type FinalMaquina } from '../../n1/arcade/ArcadeSala';
import { PortadaBloques } from '../../bloques/SalaBloques';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { FICHAS_DE_LA_CLASE, ID_HEROE, nivelLaMina } from './nivelLaMina';
import { ordenDeOpciones } from '@/lib/ordenDeOpciones';
import '../../bloques/salaBloques.css';
import './disenaTuVideojuego.css';

/* ───────────────────────────── los encargos ─────────────────────────────── */

export interface Pruebas {
  vigente: (id: PerfilId) => ResultadoPrueba | null;
}

export type Comprobar = (nivel: Nivel, pruebas: Pruebas) => boolean;

export interface Encargo {
  id: string;
  acto: 1 | 2 | 3;
  titulo: string;
  instruccion: string;
  /** Tres pistas: la idea, la estructura, la línea concreta. La tercera resta. */
  pistas: readonly [string, string, string];
  /** Lo que Bit dice al cumplirlo. */
  aprendido: string;
  logro: { tipo: 'estado'; comprueba: Comprobar } | { tipo: 'eleccion'; opciones: readonly string[]; correcta: number };
}

const SIN_PRUEBAS: Pruebas = { vigente: () => null };

/** El nivel de la clase, con el héroe (guiones y números) de ESTE nivel puesto al pie de la repisa. */
function sondaDeRepisa(nivel: Nivel): Nivel | null {
  const heroe = heroeDe(nivel);
  if (!heroe) return null;
  const base = nivelLaMina();
  return {
    ...base,
    actores: base.actores.map((a) => (a.tipo === 'heroe' ? { ...heroe, id: a.id, cx: 15, cy: 9 } : a)),
  };
}

export const comprobarE1: Comprobar = (nivel) => {
  const heroe = heroeDe(nivel);
  if (!heroe) return false;
  const x0 = heroe.cx * 16;
  const derecha = simular(nivel, mantener(false, true), 60);
  const izquierda = simular(nivel, mantener(true, false), 60);
  const hd = derecha.actores.find((a) => a.tipo === 'heroe');
  const hi = izquierda.actores.find((a) => a.tipo === 'heroe');
  if (!hd || !hi) return false;
  return hd.x - x0 >= 40 && hi.x < x0;
};

export const comprobarE2: Comprobar = (nivel) => {
  if (!heroeDe(nivel)) return false;
  const formula = alturaDeSaltoDelHeroe(nivel);
  if (!Number.isFinite(formula) || formula <= 0) return false;
  const alcanzada = alturaMaximaAlcanzada(nivel, saltarCada(8), 240);
  const partida = simular(nivel, saltarCada(8), 240);
  /* Con el techo del nivel, un impulso enorme no llega a su fórmula: eso lo
   * juzga E3, no éste. Aquí basta con que salte de verdad y no vuele. */
  return partida.saltos >= 1 && alcanzada >= 1 && alcanzada <= formula * 1.6;
};

export const comprobarE3: Comprobar = (nivel) => {
  const formula = alturaDeSaltoDelHeroe(nivel);
  if (!(formula >= 3.2 && formula <= 5)) return false;
  const sonda = sondaDeRepisa(nivel);
  if (!sonda) return false;
  const p = simular(sonda, (t) => ({ izquierda: false, derecha: true, salto: t === 2 }), 90);
  const h = p.actores.find((a) => a.tipo === 'heroe');
  return Boolean(h && h.y <= 7 * 16 && h.x >= 17 * 16);
};

export const comprobarE4: Comprobar = (nivel) => {
  const monedas = actoresDeTipo(nivel, 'moneda');
  if (monedas.length === 0) return false;
  return monedas.every((m) => {
    const s = sondaDeContacto(nivel, m.id);
    if (!s || !s.tocado) return false;
    const sigue = s.partida.actores.find((a) => a.id === m.id)?.visible ?? true;
    return s.partida.puntos >= 1 && !sigue;
  });
};

export const comprobarE5: Comprobar = (nivel) => {
  const pinchos = actoresDeTipo(nivel, 'pincho');
  if (pinchos.length === 0) return false;
  return pinchos.every((p) => {
    const s = sondaDeContacto(nivel, p.id);
    return Boolean(s && s.tocado && s.vidasPerdidas === 1 && s.volvioAlInicio);
  });
};

export const comprobarE6: Comprobar = (nivel) => {
  const puerta = actoresDeTipo(nivel, 'puerta')[0];
  if (!puerta) return false;
  if (actoresDeTipo(nivel, 'moneda').length === 0) return false;
  const faltan = sondaDeContacto(nivel, puerta.id);
  if (!faltan || !faltan.tocado || faltan.partida.gano || !faltan.dijoAlgo) return false;
  const todas = sondaDeContacto(nivelSinMonedas(nivel), puerta.id);
  return Boolean(todas && todas.partida.gano);
};

/** El plano de La mina —losetas y posiciones— para saber si el alumno cambió algo. */
function planoDe(nivel: Nivel): string {
  return JSON.stringify({
    l: nivel.losetas,
    a: nivel.actores.map((a) => [a.tipo, a.cx, a.cy]).sort(),
  });
}
const PLANO_DE_LA_MINA = planoDe(nivelLaMina());

export const comprobarE7: Comprobar = (nivel, pruebas) => {
  if (actoresDeTipo(nivel, 'moneda').length < 2) return false;
  if (actoresDeTipo(nivel, 'pincho').length < 1) return false;
  if (!actoresDeTipo(nivel, 'puerta')[0] || !heroeDe(nivel)) return false;
  if (planoDe(nivel) === PLANO_DE_LA_MINA) return false;
  const medio = pruebas.vigente('medio');
  return Boolean(medio && medio.terminable);
};

export const TICS_MINIMOS_EXPERTO = 180;

export const comprobarE8: Comprobar = (nivel, pruebas) => {
  if (!comprobarE7(nivel, pruebas)) return false;
  const novato = pruebas.vigente('novato');
  const medio = pruebas.vigente('medio');
  const experto = pruebas.vigente('experto');
  if (!novato?.terminable || !medio?.terminable || !experto?.terminable) return false;
  return experto.ticsRuta > TICS_MINIMOS_EXPERTO && experto.salto;
};

export const ENCARGOS: readonly Encargo[] = [
  {
    id: 'e1-caminar',
    acto: 1,
    titulo: 'Que camine',
    instruccion:
      'Pulsa ▶ Jugar: el héroe no se mueve. No sabe. Elige al héroe y, bajo «mientras → está pulsada», pon «mover a la derecha». Haz lo mismo para la izquierda.',
    pistas: [
      'Un personaje no se mueve porque «es» el personaje: se mueve porque un guion lo dice. Cada sombrero es un cuándo; lo que cuelga es el qué.',
      'Al héroe le cuelgan cuatro sombreros vacíos. Los dos primeros escuchan las flechas. Toca la ficha «mover a la derecha» y luego toca el hueco bajo el sombrero de →.',
      'Bajo «mientras → está pulsada» va «mover a la derecha»; bajo «mientras ← está pulsada» va «mover a la izquierda». Nada más.',
    ],
    aprendido: 'Ya camina. Fíjate: no cambiaste el dibujo, cambiaste una regla. Eso es programar un juego.',
    logro: { tipo: 'estado', comprueba: comprobarE1 },
  },
  {
    id: 'e2-saltar',
    acto: 1,
    titulo: 'Que salte, pero una vez',
    instruccion:
      'Bajo «cuando pulsan ESPACIO» pon «saltar» y juega. Machaca la barra: ¿vuela? Envuelve el «saltar» en «si ¿estoy en el suelo?» para que sólo salte apoyado.',
    pistas: [
      '«Saltar» es un empujón hacia arriba y nada más: no pregunta dónde estás. Si lo pones sin condición, en el aire también empuja.',
      'El bloque «si» tiene un hueco hexagonal para una pregunta y una boca para lo que hace. La pregunta es «¿estoy en el suelo?»; dentro va «saltar».',
      'Bajo «cuando pulsan ESPACIO»: un «si» con «¿estoy en el suelo?» en el hueco y «saltar» dentro de la boca. Quita el «saltar» suelto de fuera.',
    ],
    aprendido: 'Un salto de verdad tiene una condición. Sin el «si», tu juego tendría un truco que nadie quiso.',
    logro: { tipo: 'estado', comprueba: comprobarE2 },
  },
  {
    id: 'e3-repisa',
    acto: 1,
    titulo: 'Que llegue a la repisa',
    instruccion:
      'Con los números de fábrica el héroe sube 1,8 casillas y la repisa de la puerta mide 3. Ajusta el impulso y la gravedad del héroe hasta que la altura del salto quede entre 3,2 y 5 casillas, y compruébalo jugando.',
    pistas: [
      'El salto es física: más impulso, más alto; más gravedad, más bajo. El panel del héroe te dice la altura que sale con cada combinación.',
      'Elige al héroe y mueve el deslizador de «Impulso del salto». Mira cómo cambia «Altura del salto». Pasado de 5 sale del nivel por arriba.',
      'Impulso 6,5 con gravedad 0,35 da 3,8 casillas. Cualquier par que quede entre 3,2 y 5 vale.',
    ],
    aprendido: 'Dos números y el nivel cambia de posible a imposible. El diseñador de niveles vive de esos números.',
    logro: { tipo: 'estado', comprueba: comprobarE3 },
  },
  {
    id: 'e4-moneda',
    acto: 2,
    titulo: 'La moneda vale',
    instruccion:
      'Tocar una moneda no hace nada: la moneda no tiene guion. Elige cada moneda y bajo «cuando el héroe me toca» pon «sumar puntos» y «desaparecer». Bit dejará caer al héroe sobre ellas para comprobarlo.',
    pistas: [
      'La moneda no «sabe» que vale: alguien tiene que escribirlo en SU guion, no en el del héroe. Cada actor lleva sus reglas.',
      'El sombrero de la moneda es «cuando el héroe me toca». Debajo van dos órdenes seguidas. Hay cuatro monedas: todas necesitan su guion.',
      'En cada moneda, bajo «cuando el héroe me toca»: «sumar puntos» y luego «desaparecer».',
    ],
    aprendido: 'Las reglas del mundo son guiones de los otros actores. La moneda decide qué pasa cuando la tocan.',
    logro: { tipo: 'estado', comprueba: comprobarE4 },
  },
  {
    id: 'e5-pincho',
    acto: 2,
    titulo: 'El pincho duele',
    instruccion:
      'El pincho tampoco hace nada. En su guion «cuando el héroe me toca» pon «quitar una vida al héroe» y «devolver al héroe al inicio».',
    pistas: [
      'Si el pincho sólo quita la vida y no devuelve al inicio, el héroe se queda encima y el juego parece roto. Las dos órdenes juntas hacen una trampa justa.',
      'Elige el pincho (está después del hueco). Su único sombrero es el de contacto.',
      'Bajo «cuando el héroe me toca» del pincho: «quitar una vida al héroe» y «devolver al héroe al inicio».',
    ],
    aprendido: 'Perder una vida y volver al inicio: así el error cuesta, pero se puede volver a intentar.',
    logro: { tipo: 'estado', comprueba: comprobarE5 },
  },
  {
    id: 'e6-puerta',
    acto: 2,
    titulo: 'La puerta pide las monedas',
    instruccion:
      'La puerta tiene que ganar la partida, pero SÓLO si ya están todas las monedas. Si faltan, que lo diga. Usa «si … si no» con la pregunta «¿ya están todas las monedas?».',
    pistas: [
      'Una puerta que gana siempre es una puerta sin regla: se puede terminar sin tocar una moneda. La regla es una pregunta.',
      'El bloque «si … si no» tiene dos bocas: la de arriba pasa cuando la pregunta contesta sí, la de abajo cuando contesta no.',
      'Bajo «cuando el héroe me toca» de la puerta: «si … si no» con «¿ya están todas las monedas?» en el hueco; «ganar la partida» en la boca de arriba y «decir» en la de abajo.',
    ],
    aprendido: 'Ya es un juego: tiene un objetivo y una condición para lograrlo. Ahora hay que ver si alguien más puede jugarlo.',
    logro: { tipo: 'estado', comprueba: comprobarE6 },
  },
  {
    id: 'e7-nivel',
    acto: 3,
    titulo: 'Diseña tu nivel',
    instruccion:
      'Cambia La mina: mueve plataformas, añade al menos dos monedas y un pincho. Después pulsa 🧪 Probar con jugadores: el jugador medio tiene que poder terminarlo.',
    pistas: [
      'El jugador de prueba no sabe dónde saltar: sólo tiene tus reglas. Si dice «no pudo terminar», el nivel es imposible para alguien que no lo hizo.',
      'Con la paleta pintas losetas y colocas actores. Cada cosa nueva que pones necesita su guion —una moneda nueva nace vacía—.',
      'Un hueco más ancho que el salto o una puerta más alta que la altura del salto hacen el nivel imposible. Las calaveras te dicen dónde cae.',
    ],
    aprendido: 'Un nivel que sólo puede terminar su autor no está terminado. Ahora sabes medirlo.',
    logro: { tipo: 'estado', comprueba: comprobarE7 },
  },
  {
    id: 'e8-equilibrio',
    acto: 3,
    titulo: 'Equilíbralo',
    instruccion:
      'Tu nivel tiene que ser terminable por los tres jugadores —novato, medio y experto— y no trivial: al experto le tiene que costar más de 3 segundos y tener que saltar. Ajusta y vuelve a probar.',
    pistas: [
      'El novato decide cada 12 tics: no afina. Un pincho pegado a un salto lo mata siempre. Se equilibra moviendo el pincho o poniendo una plataforma, no quitando el reto.',
      'Cada vez que cambias el nivel, las pruebas caducan: vuelve a pulsar 🧪. Las calaveras del novato te dicen qué tramo es injusto.',
      'Si el experto termina en menos de 3 s, la puerta está demasiado cerca del inicio o no hace falta saltar. Aleja la puerta o ponla en alto.',
    ],
    aprendido: 'Equilibrar es medir con jugadores distintos, no adivinar. Eso hacen los estudios de verdad.',
    logro: { tipo: 'estado', comprueba: comprobarE8 },
  },
  {
    id: 'e9-cierre',
    acto: 3,
    titulo: '¿Por qué se prueba con alguien que no hizo el nivel?',
    instruccion: 'Elige la respuesta.',
    pistas: [
      'Piensa en lo que pasó en E7: tú sabías dónde estaba cada trampa. ¿El jugador de prueba?',
      'La pregunta es sobre medir la dificultad, no sobre gustos ni sobre el motor.',
      'El autor conoce el nivel de memoria, y por eso no puede medir lo difícil que es.',
    ],
    aprendido: 'Eso es. Quien hizo el nivel no puede medir su dificultad: ya sabe la solución.',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'Porque el autor ya sabe dónde está cada trampa y no puede medir la dificultad',
        'Porque así se ve si los gráficos gustan',
        'Porque el motor lo exige para guardar el nivel',
      ],
      correcta: 0,
    },
  },
];

export const TOTAL_ENCARGOS = ENCARGOS.length;
export const FICHAS = fichasDe(FICHAS_DE_LA_CLASE);

export function comprobar(encargo: Encargo, nivel: Nivel, pruebas: Pruebas = SIN_PRUEBAS, eleccion: number | null = null): boolean {
  if (encargo.logro.tipo === 'estado') return encargo.logro.comprueba(nivel, pruebas);
  return eleccion === encargo.logro.correcta;
}

const INSIGNIA = { nombre: 'Diseñadora de niveles', emoji: '🕹️' };

const PORTADA = {
  situacion: 'Producción multimedia y videojuegos · parada 3 de 4',
  tema: 'Diseña tu videojuego',
  objetivo:
    'Programar las reglas de un juego de plataformas —cómo salta el héroe, qué hace una moneda, cuándo abre la puerta—, diseñar un nivel y probarlo con jugadores que no lo hicieron.',
  vasAHacer: [
    'Escribir los guiones del héroe: caminar, saltar sólo desde el suelo, y ajustar impulso y gravedad.',
    'Programar la moneda, el pincho y la puerta: cada actor lleva sus reglas.',
    'Diseñar tu nivel y equilibrarlo con tres jugadores de prueba: novato, medio y experto.',
  ],
};

const BIT = {
  inicio: 'Esto es Tecnia Juegos. Pulsa ▶ y mira: el héroe no se mueve. No es que esté roto, es que nadie le ha dicho cómo. Eso lo escribes tú.',
  cierre: 'Tu nivel lo terminaron tres jugadores que nunca lo habían visto. Eso es diseñar un videojuego: reglas que otros pueden jugar.',
  sinGuiones: 'El héroe está quieto porque no tiene guiones. Elígelo y escribe qué pasa cuando pulsan las flechas.',
  perdio: 'Sin vidas. Tu nivel castiga; ahora decide si es justo.',
  gano: '¡Terminaste tu propio nivel! Ahora la pregunta es si alguien más puede.',
};

/* ─────────────────────────── el panel del encargo ───────────────────────── */

interface PanelEncargoProps {
  encargo: Encargo;
  indice: number;
  hecho: boolean;
  eleccion: number | null;
  onElegir: (i: number) => void;
  onPistaCara: () => void;
}

function PanelEncargo({ encargo, indice, hecho, eleccion, onElegir, onPistaCara }: PanelEncargoProps) {
  const [pistas, setPistas] = useState(0);
  const cobrada = useRef(false);

  const otraPista = () => {
    const siguiente = Math.min(3, pistas + 1);
    if (siguiente === 3 && !cobrada.current) {
      cobrada.current = true;
      onPistaCara();
    }
    setPistas(siguiente);
  };

  const logro = encargo.logro;
  return (
    <div className="blqs-panel dv-panel" data-testid="blqs-panel" data-hecho={hecho ? 'si' : 'no'} data-encargo={encargo.id}>
      <div className="blqs-panel-cabecera">
        <span className="blqs-panel-num">
          Acto {encargo.acto} · Encargo {indice + 1}/{TOTAL_ENCARGOS}
        </span>
        {hecho && (
          <span className="blqs-panel-check" aria-hidden="true">
            ✔
          </span>
        )}
      </div>
      <h3 className="blqs-panel-titulo">{encargo.titulo}</h3>
      <p className="blqs-panel-instruccion">{encargo.instruccion}</p>
      {logro.tipo === 'eleccion' && (
        <div className="blqs-panel-opciones" role="radiogroup" aria-label="Elige una respuesta">
          {ordenDeOpciones(logro.opciones.length, encargo.id)
            .map((i) => [logro.opciones[i], i] as const)
            .map(([op, i]) => (
            <button
              key={op}
              type="button"
              className={`blqs-opcion${eleccion === i ? (i === logro.correcta ? ' es-bien' : ' es-mal') : ''}`}
              aria-pressed={eleccion === i}
              onClick={() => onElegir(i)}
            >
              {op}
            </button>
          ))}
        </div>
      )}
      {encargo.pistas.slice(0, pistas).map((p, i) => (
        <p key={i} className="blqs-panel-pista-texto" data-testid="dv-pista">
          {p}
        </p>
      ))}
      {pistas < 3 && (
        <button type="button" className="blqs-panel-pista" data-testid="dv-mas-pista" onClick={otraPista}>
          {pistas === 0 ? '¿Necesitas una pista?' : pistas === 1 ? 'Otra pista' : 'La última pista (resta puntos)'}
        </button>
      )}
    </div>
  );
}

/* ───────────────────────────────── la mesa ──────────────────────────────── */

interface MesaProps {
  onAvance: () => void;
  onTerminado: (r: { segundos: number; partidas: number }) => void;
  onAprendido: (texto: string) => void;
  onBit: (texto: string) => void;
  onResta: () => void;
}

function Mesa({ onAvance, onTerminado, onAprendido, onBit, onResta }: MesaProps) {
  const sonar = useSonidosJuego();
  const inicioRef = useRef(0);
  useEffect(() => {
    inicioRef.current = Date.now();
  }, []);

  const juego = useJuego({
    inicial: useMemo(() => nivelLaMina(), []),
    fichas: FICHAS,
    onSonido: sonar,
    onPartidaTerminada: (p) => onBit(p.gano ? BIT.gano : BIT.perdio),
  });

  const [eleccion, setEleccion] = useState<number | null>(null);
  const hechosRef = useRef<Set<string>>(new Set());
  const falladasRef = useRef<Set<number>>(new Set());

  const pruebas: Pruebas = useMemo(() => ({ vigente: juego.pruebaVigente }), [juego.pruebaVigente]);

  /* Cada encargo se comprueba SIEMPRE, y el actual es el primero que falta. */
  const estados = useMemo(
    () => ENCARGOS.map((e) => comprobar(e, juego.nivel, pruebas, eleccion)),
    [juego.nivel, pruebas, eleccion],
  );
  const primeroQueFalta = estados.findIndex((h) => !h);
  const indice = primeroQueFalta === -1 ? TOTAL_ENCARGOS - 1 : primeroQueFalta;
  const encargo = ENCARGOS[indice];
  const hecho = estados[indice];

  useEffect(() => {
    let nuevos = 0;
    ENCARGOS.forEach((e, i) => {
      if (estados[i] && !hechosRef.current.has(e.id)) {
        hechosRef.current.add(e.id);
        nuevos += 1;
        onAvance();
        onAprendido(e.aprendido);
      }
    });
    if (nuevos > 0 && estados.every(Boolean)) {
      onTerminado({
        segundos: Math.round((Date.now() - inicioRef.current) / 1000),
        partidas: juego.partidasJugadas,
      });
    }
  }, [estados, onAvance, onAprendido, onTerminado, juego.partidasJugadas]);

  /* ▶ sin guiones en el héroe: Bit lo dice. */
  const jugadas = useRef(0);
  useEffect(() => {
    if (juego.modo !== 'jugar') return;
    jugadas.current += 1;
    const heroe = heroeDe(juego.nivel);
    const vacio = !heroe || heroe.guiones.pilas.every((p) => p.bloques.length === 0);
    if (vacio) onBit(BIT.sinGuiones);
    // Sólo al arrancar una partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juego.modo]);

  const elegir = useCallback(
    (i: number) => {
      setEleccion(i);
      if (encargo.logro.tipo === 'eleccion' && i !== encargo.logro.correcta && !falladasRef.current.has(i)) {
        falladasRef.current.add(i);
        onResta();
      }
    },
    [encargo, onResta],
  );

  const reponer = useCallback(() => juego.reponerNivel(nivelLaMina()), [juego]);

  const panel: ReactNode = (
    <PanelEncargo
      key={encargo.id}
      encargo={encargo}
      indice={indice}
      hecho={hecho}
      eleccion={eleccion}
      onElegir={elegir}
      onPistaCara={onResta}
    />
  );

  return (
    <VentanaBase marca="Tecnia Juegos" subtitulo={`nivel: ${juego.nivel.nombre} · versión ${versionDe(juego.nivel).slice(0, 6)}`} claseMarco="dv-marco">
      <VentanaJuego
        juego={juego}
        fichas={FICHAS}
        panel={panel}
        proyecto="la-mina.tecniajuego"
        accionesDeNivel={
          <button type="button" className="jg-accion-nivel" data-testid="dv-reponer" onClick={reponer}>
            Volver a La mina
          </button>
        }
      />
    </VentanaBase>
  );
}

/* ───────────────────────────────── la sala ──────────────────────────────── */

export function LabDisenaTuVideojuego({ alSalir, ...props }: ActivityProps & { alSalir?: () => void }) {
  const total = TOTAL_ENCARGOS;
  const { pasos, terminado, tiempoFinal, puntaje, restar, avanzar, terminar, reiniciar } = useLabActividad(props, total);
  const { linea: bitLinea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'practica'>('portada');
  const [intento, setIntento] = useState(0);
  const [resumen, setResumen] = useState<{ segundos: number; partidas: number } | null>(null);
  const [puntos, setPuntos] = useState(100);

  const empezar = useCallback(() => {
    setFase('practica');
    hablar(BIT.inicio);
  }, [hablar]);

  const alTerminado = useCallback(
    (r: { segundos: number; partidas: number }) => {
      setResumen(r);
      setPuntos(terminar(r.segundos, () => hablar(BIT.cierre)));
    },
    [terminar, hablar],
  );

  const alRestar = useCallback(() => {
    restar();
    setPuntos(puntaje());
  }, [restar, puntaje]);

  const repetir = useCallback(() => {
    reiniciar(() => {
      setResumen(null);
      setPuntos(100);
      setIntento((i) => i + 1);
      setFase('portada');
    });
  }, [reiniciar]);

  const final: FinalMaquina | null = terminado
    ? {
        insigniaNombre: INSIGNIA.nombre,
        insigniaEmoji: INSIGNIA.emoji,
        titulo: 'Tu nivel lo terminaron tres jugadores',
        detalle:
          'Escribiste las reglas del héroe, de la moneda, del pincho y de la puerta; diseñaste un nivel y lo equilibraste midiendo, no adivinando.',
        resumen: [
          { etiqueta: 'Encargos', valor: `${total}` },
          { etiqueta: 'Tiempo', valor: formatTiempo(resumen?.segundos ?? tiempoFinal) },
          { etiqueta: 'Partidas jugadas', valor: `${resumen?.partidas ?? 0}` },
          { etiqueta: 'Puntos', valor: `${puntos}` },
        ],
        alRepetir: repetir,
      }
    : null;

  return (
    <ArcadeSala
      titulo="Diseña tu videojuego"
      pasoEtiqueta="Encargo"
      pasoActual={Math.min(pasos + 1, total)}
      pasosTotal={total}
      marcadorEtiqueta="Puntos"
      marcadorValor={String(puntos)}
      bit={fase === 'practica' ? bitLinea : null}
      final={final}
      alSalir={alSalir}
    >
      {fase === 'portada' ? (
        <PortadaBloques portada={PORTADA} encargos={total} minutos={30} insignia={INSIGNIA} onEmpezar={empezar} />
      ) : (
        <Mesa
          key={intento}
          onAvance={avanzar}
          onTerminado={alTerminado}
          onAprendido={hablar}
          onBit={hablar}
          onResta={alRestar}
        />
      )}
    </ArcadeSala>
  );
}

export { ID_HEROE };
export default LabDisenaTuVideojuego;
