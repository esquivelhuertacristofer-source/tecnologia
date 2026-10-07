/**
 * TECNIA JUEGOS · EL JUGADOR DE PRUEBA
 *
 * Alguien que no hizo el nivel intenta terminarlo. No es un truco de
 * pedagogía: es una búsqueda sobre el simulador real, con los guiones que
 * escribió el alumno. Si dice que se puede terminar, es porque encontró una
 * ruta de teclas que lo termina; si dice que no, es porque agotó su
 * presupuesto sin encontrarla —y devuelve dónde murió mientras buscaba, que
 * es lo que un diseñador de niveles quiere ver—.
 *
 * ── LOS TRES PERFILES ────────────────────────────────────────────────────
 *
 * Un jugador decide cada `ticsPorDecision` tics y mantiene la tecla entre
 * decisiones. El experto decide cada 3 tics, el novato cada 12: el novato no
 * puede afinar un salto al píxel, y por eso un hueco que el experto cruza
 * puede matar al novato. Esa diferencia es exactamente la que E8 pide
 * equilibrar. No hay azar: dos pruebas del mismo nivel dan lo mismo.
 *
 * ── LA BÚSQUEDA: A* SOBRE MACRO-ACCIONES ─────────────────────────────────
 *
 * La primera versión era una búsqueda en anchura pura y **agotaba 9 000 nodos
 * sin salir del primer tercio de «La mina»**: con una babosa moviéndose, cada
 * estado del héroe se multiplicaba por cada posición de la babosa, y la
 * anchura no llegaba a ninguna parte. Dos correcciones, medidas:
 *
 *   1. Se busca con prioridad —tics gastados más una estimación de lo que
 *      falta: la distancia a la moneda más cercana, o a la puerta si no
 *      quedan monedas—. Es A* con una heurística optimista: la ruta que
 *      encuentra es corta, y por eso `ticsRuta` sirve como «cuánto tarda
 *      alguien que juega bien».
 *   2. Los enemigos sólo entran en la clave del estado cuando están CERCA del
 *      héroe (a menos de tres casillas), y en casillas enteras. Lejos, su
 *      posición no cambia lo que el héroe puede hacer; cerca, sí. Esto puede
 *      podar alguna ruta que sólo funciona con una sincronía exacta —a cambio
 *      de que la búsqueda termine—; y como cada ruta encontrada se simuló de
 *      verdad, un «se puede terminar» nunca es falso.
 *
 * ── POR QUÉ CORRE EN TROZOS ──────────────────────────────────────────────
 *
 * `avanzar(n)` explora `n` nodos y devuelve el control. La ventana lo llama
 * por cuadros y pinta «jugando…»; Jest lo llama en un bucle hasta acabar.
 *
 * ── LO QUE CUENTA COMO MUERTE ────────────────────────────────────────────
 *
 * Perder una vida. El jugador de prueba busca una ruta LIMPIA —sin perder
 * ninguna vida—, porque «se puede terminar perdiendo dos vidas» no es lo que
 * un diseñador quiere saber primero. Los estados donde murió no se expanden,
 * pero se apuntan.
 */

import { CASILLA, type Nivel, versionDe } from './modelo';
import { heroeDePartida, nuevaPartida, terminada, tic, type EstadoActor, type Entradas, type Partida } from './partida';

export type PerfilId = 'novato' | 'medio' | 'experto';

export interface PerfilJugador {
  id: PerfilId;
  nombre: string;
  /** Cada cuántos tics puede cambiar de tecla. */
  ticsPorDecision: number;
  /** Cuántos nodos explora antes de rendirse. */
  presupuesto: number;
}

export const PERFILES: readonly PerfilJugador[] = [
  { id: 'novato', nombre: 'Novato', ticsPorDecision: 12, presupuesto: 4000 },
  { id: 'medio', nombre: 'Medio', ticsPorDecision: 6, presupuesto: 6000 },
  { id: 'experto', nombre: 'Experto', ticsPorDecision: 3, presupuesto: 9000 },
];

export function perfil(id: PerfilId): PerfilJugador {
  const p = PERFILES.find((x) => x.id === id);
  if (!p) throw new Error(`Perfil desconocido: ${id}`);
  return p;
}

export type Macro = 'nada' | 'derecha' | 'izquierda' | 'salto' | 'salto-derecha' | 'salto-izquierda';

const MACROS: readonly Macro[] = ['derecha', 'salto-derecha', 'izquierda', 'salto-izquierda', 'salto', 'nada'];

function entradasDe(macro: Macro, primerTic: boolean): Entradas {
  return {
    derecha: macro === 'derecha' || macro === 'salto-derecha',
    izquierda: macro === 'izquierda' || macro === 'salto-izquierda',
    salto: primerTic && macro.startsWith('salto'),
  };
}

export interface Punto {
  x: number;
  y: number;
}

export interface ResultadoPrueba {
  perfil: PerfilId;
  /** Encontró una ruta limpia hasta ganar. */
  terminable: boolean;
  /** Se acabó el presupuesto sin encontrarla. */
  agotado: boolean;
  nodos: number;
  /** Tics de la ruta encontrada (0 si no la hay). */
  ticsRuta: number;
  ruta: readonly Macro[];
  /** Posiciones del héroe donde el jugador de prueba perdió una vida, sin repetir. */
  muertes: readonly Punto[];
  /** La ruta tuvo que saltar. */
  salto: boolean;
  /** Puntos con los que ganó. */
  puntos: number;
  /** Por dónde pasó el héroe en la ruta ganadora, una muestra por decisión. */
  huellas: readonly Punto[];
  /** La huella del nivel sobre el que se calculó. */
  version: string;
}

export interface Prueba {
  /** Explora hasta `nodos` nodos más. Devuelve `true` cuando ya no hay nada que hacer. */
  avanzar: (nodos: number) => boolean;
  terminada: () => boolean;
  /** 0..1, sobre el presupuesto. */
  progreso: () => number;
  resultado: () => ResultadoPrueba;
}

interface Nodo {
  partida: Partida;
  padre: number;
  macro: Macro | null;
  saltos: number;
}

const CERCA = 3 * CASILLA;

function claveDe(p: Partida, h: EstadoActor): string {
  const partes: string[] = [
    String(Math.round(h.x / 2)),
    String(Math.round(h.y / 2)),
    h.enSuelo ? 's' : 'a',
    String(Math.round(h.vy)),
  ];
  for (const a of p.actores) {
    if (a.tipo === 'moneda') partes.push(a.visible ? '1' : '0');
    else if (a.tipo === 'enemigo' && a.visible && Math.abs(a.x - h.x) < CERCA && Math.abs(a.y - h.y) < CERCA) {
      partes.push(`e${Math.round(a.x / CASILLA)},${Math.round(a.y / CASILLA)},${a.direccion}`);
    }
  }
  return partes.join('|');
}

/** Lo que falta, en tics optimistas: llegar a la moneda más cercana (o a la puerta) y, por cada moneda que queda, un rato. */
function estimar(p: Partida, h: EstadoActor): number {
  const velocidad = Math.max(0.5, h.propiedades.velocidad);
  let quedan = 0;
  let cercana = Infinity;
  let puerta = Infinity;
  for (const a of p.actores) {
    if (a.tipo === 'moneda' && a.visible) {
      quedan += 1;
      const d = Math.abs(a.x - h.x) + Math.abs(a.y - h.y) / 2;
      if (d < cercana) cercana = d;
    } else if (a.tipo === 'puerta' && a.visible) {
      puerta = Math.abs(a.x - h.x) + Math.abs(a.y - h.y) / 2;
    }
  }
  const objetivo = quedan > 0 ? cercana : puerta;
  if (!Number.isFinite(objetivo)) return 0;
  return objetivo / velocidad + quedan * 90;
}

/* Un montículo binario mínimo sobre (prioridad, índice). */
class Monticulo {
  private claves: number[] = [];
  private valores: number[] = [];

  get tamano(): number {
    return this.valores.length;
  }

  meter(prioridad: number, valor: number): void {
    this.claves.push(prioridad);
    this.valores.push(valor);
    let i = this.valores.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (this.claves[padre] <= this.claves[i]) break;
      this.cambiar(i, padre);
      i = padre;
    }
  }

  sacar(): number {
    const raiz = this.valores[0];
    const ultimoK = this.claves.pop() as number;
    const ultimoV = this.valores.pop() as number;
    if (this.valores.length > 0) {
      this.claves[0] = ultimoK;
      this.valores[0] = ultimoV;
      let i = 0;
      const n = this.valores.length;
      for (;;) {
        const izq = 2 * i + 1;
        const der = izq + 1;
        let menor = i;
        if (izq < n && this.claves[izq] < this.claves[menor]) menor = izq;
        if (der < n && this.claves[der] < this.claves[menor]) menor = der;
        if (menor === i) break;
        this.cambiar(i, menor);
        i = menor;
      }
    }
    return raiz;
  }

  private cambiar(a: number, b: number): void {
    const k = this.claves[a];
    this.claves[a] = this.claves[b];
    this.claves[b] = k;
    const v = this.valores[a];
    this.valores[a] = this.valores[b];
    this.valores[b] = v;
  }
}

export function crearPrueba(nivel: Nivel, perf: PerfilJugador): Prueba {
  const version = versionDe(nivel);
  const nodos: Nodo[] = [{ partida: nuevaPartida(nivel), padre: -1, macro: null, saltos: 0 }];
  const visitados = new Set<string>();
  const cola = new Monticulo();
  const muertes = new Map<string, Punto>();
  let explorados = 0;
  let ganador = -1;
  let fin = false;

  const heroeInicial = heroeDePartida(nodos[0].partida);
  if (!heroeInicial) fin = true;
  else {
    visitados.add(claveDe(nodos[0].partida, heroeInicial));
    cola.meter(estimar(nodos[0].partida, heroeInicial), 0);
  }

  function expandir(indice: number): void {
    const nodo = nodos[indice];
    for (const macro of MACROS) {
      let p = nodo.partida;
      const vidasAntes = p.vidas;
      for (let t = 0; t < perf.ticsPorDecision && !terminada(p) && p.vidas === vidasAntes; t += 1) {
        p = tic(p, entradasDe(macro, t === 0));
      }
      if (p.vidas < vidasAntes || p.perdio) {
        const donde = p.ultimaMuerte;
        if (donde) {
          const clave = `${Math.round(donde.x / CASILLA)},${Math.round(donde.y / CASILLA)}`;
          if (!muertes.has(clave)) muertes.set(clave, donde);
        }
        continue;
      }
      const saltos = nodo.saltos + (macro.startsWith('salto') ? 1 : 0);
      if (p.gano) {
        nodos.push({ partida: p, padre: indice, macro, saltos });
        ganador = nodos.length - 1;
        return;
      }
      const h = heroeDePartida(p);
      if (!h) continue;
      const clave = claveDe(p, h);
      if (visitados.has(clave)) continue;
      visitados.add(clave);
      nodos.push({ partida: p, padre: indice, macro, saltos });
      cola.meter(p.tic + estimar(p, h), nodos.length - 1);
    }
  }

  function avanzar(cuantos: number): boolean {
    let hechos = 0;
    while (!fin && hechos < cuantos) {
      if (ganador >= 0 || cola.tamano === 0 || explorados >= perf.presupuesto) {
        fin = true;
        break;
      }
      const indice = cola.sacar();
      explorados += 1;
      hechos += 1;
      expandir(indice);
      if (ganador >= 0) fin = true;
    }
    return fin;
  }

  function resultado(): ResultadoPrueba {
    const ruta: Macro[] = [];
    const huellas: Punto[] = [];
    if (ganador >= 0) {
      let i = ganador;
      while (i > 0) {
        const n = nodos[i];
        if (n.macro) ruta.push(n.macro);
        const h = heroeDePartida(n.partida);
        if (h) huellas.push({ x: h.x, y: h.y });
        i = n.padre;
      }
      ruta.reverse();
      huellas.reverse();
    }
    const final = ganador >= 0 ? nodos[ganador] : null;
    return {
      perfil: perf.id,
      terminable: ganador >= 0,
      agotado: ganador < 0 && explorados >= perf.presupuesto,
      nodos: explorados,
      ticsRuta: final ? final.partida.tic : 0,
      ruta,
      muertes: [...muertes.values()],
      salto: final ? final.saltos > 0 : false,
      puntos: final ? final.partida.puntos : 0,
      huellas,
      version,
    };
  }

  return {
    avanzar,
    terminada: () => fin,
    progreso: () => (fin ? 1 : Math.min(1, explorados / perf.presupuesto)),
    resultado,
  };
}

/** De un tirón. Es lo que usan las pruebas y las clases que no pintan progreso. */
export function probarNivel(nivel: Nivel, perf: PerfilJugador): ResultadoPrueba {
  const prueba = crearPrueba(nivel, perf);
  while (!prueba.avanzar(500)) {
    /* sigue */
  }
  return prueba.resultado();
}

/** ¿Este resultado sigue hablando del nivel que hay ahora? */
export function vigente(resultado: ResultadoPrueba | null | undefined, nivel: Nivel): resultado is ResultadoPrueba {
  return Boolean(resultado) && (resultado as ResultadoPrueba).version === versionDe(nivel);
}

/** Reproduce una ruta de macro-acciones tic a tic, para pintarla o comprobarla. */
export function entradasDeRuta(ruta: readonly Macro[], perf: PerfilJugador): (t: number) => Entradas {
  return (t) => {
    const i = Math.floor(t / perf.ticsPorDecision);
    const macro = ruta[i] ?? 'nada';
    return entradasDe(macro, t % perf.ticsPorDecision === 0);
  };
}
