/**
 * TECNIA DISEÑO · el verificador
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mismo molde que `Veredicto` / `verificar()` de `motor-diapos/verificar.ts`:
 * devuelve **enteros** y un `detalle` de texto, y es el instrumento de
 * producción, no una copia para pruebas. Una sonda que trae su propia medición
 * se queda atrás y acaba midiendo otra cosa que el motor (§36.5).
 *
 * Las seis cifras se eligieron por lo que de verdad puede salir mal en un
 * lienzo de clase, no por simetría:
 *
 * 1. `fuera`     — capas que no caben enteras en el lienzo.
 * 2. `sueltas`   — capas cuya caja dejó de ser entera. **Si esto no es 0, el
 *                  modelo se rompió y todo lo demás es mentira.**
 * 3. `vacias`    — cajas de texto sin una palabra dentro.
 * 4. `perdidas`  — capas que apuntan a un color o a una imagen que no existe.
 * 5. `deformadas`— fotos estiradas respecto a su proporción natural.
 * 6. `rebosan`   — textos más largos que su caja. La única que necesita
 *                  pantalla, y aun así sin tolerancia: se le pregunta al
 *                  navegador si el contenido le cabe al elemento.
 *
 * Las cinco primeras se contestan con enteros y viven en `consultas.ts`.
 */

import { reproducir } from './comandos';
import { deformadas, fueraDelLienzo, sueltas, textosVacios, tintasRepetidas } from './consultas';
import { cortesImposibles } from './cinta';
import { documento, type Historia } from './historia';
import type { Documento } from './modelo';

export interface Veredicto {
  fuera: number;
  sueltas: number;
  vacias: number;
  perdidas: number;
  deformadas: number;
  rebosan: number;
  /** Tintas distintas de la paleta que pintan el mismo color. Culpa de la clase. */
  tintasIguales: number;
  /** Cortes de la cinta que se pasan del original o cuyo recurso no está. */
  cortesRotos: number;
  detalle: string[];
}

/** Capas que apuntan a algo que no está en la paleta o en el banco. */
function contarPerdidas(doc: Documento, detalle: string[]): number {
  let n = 0;
  for (const p of doc.paginas) {
    if (p.fondo && !doc.paleta[p.fondo]) {
      n += 1;
      detalle.push(`fondo perdido en «${p.nombre}»: ${p.fondo}`);
    }
    for (const c of p.capas) {
      const faltan: string[] = [];
      if (c.tipo === 'forma') {
        if (c.relleno && !doc.paleta[c.relleno]) faltan.push(`relleno ${c.relleno}`);
        if (c.borde && !doc.paleta[c.borde]) faltan.push(`borde ${c.borde}`);
      }
      if (c.tipo === 'texto' && !doc.paleta[c.color]) faltan.push(`color ${c.color}`);
      if (c.tipo === 'imagen' && !doc.banco[c.recurso]) faltan.push(`imagen ${c.recurso}`);
      if (faltan.length) {
        n += faltan.length;
        detalle.push(`«${c.nombre}» apunta a lo que no hay: ${faltan.join(', ')}`);
      }
    }
  }
  return n;
}

/**
 * Cuenta los textos que no caben en su caja.
 *
 * `dom` es el lienzo pintado. Se busca cada texto por `data-texto` y se le
 * pregunta al navegador. Se admite `null` para poder verificar el modelo sin
 * pantalla —que es media gracia de tener consultas puras—; entonces `rebosan`
 * vale 0 y **el detalle lo dice**, en vez de callarse y parecer un cero bueno.
 */
function contarRebosados(dom: HTMLElement | null, detalle: string[]): number {
  if (!dom) {
    detalle.push('sin pantalla: «rebosan» no se midió');
    return 0;
  }
  let n = 0;
  for (const el of Array.from(dom.querySelectorAll<HTMLElement>('[data-texto]'))) {
    // Sin holgura y sin épsilon: o el navegador dice que no cabe, o cabe.
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      n += 1;
      detalle.push(`rebosa: «${(el.textContent ?? '').slice(0, 24)}…»`);
    }
  }
  return n;
}

export function verificar(doc: Documento, dom: HTMLElement | null = null): Veredicto {
  const detalle: string[] = [];
  let fuera = 0;
  let rotas = 0;
  let vacias = 0;
  let torcidas = 0;

  for (const p of doc.paginas) {
    for (const id of fueraDelLienzo(doc, p.id)) {
      fuera += 1;
      detalle.push(`fuera del lienzo: ${id} (${p.nombre})`);
    }
    for (const id of sueltas(doc, p.id)) {
      rotas += 1;
      detalle.push(`fuera de la rejilla: ${id} (${p.nombre})`);
    }
    for (const id of textosVacios(doc, p.id)) {
      vacias += 1;
      detalle.push(`caja de texto vacía: ${id} (${p.nombre})`);
    }
    for (const id of deformadas(doc, p.id)) {
      torcidas += 1;
      detalle.push(`imagen deformada: ${id} (${p.nombre})`);
    }
  }

  const repetidas = tintasRepetidas(doc);
  for (const par of repetidas) detalle.push(`dos tintas pintan igual: ${par}`);

  const cortesRotos = cortesImposibles(doc);
  for (const id of cortesRotos) detalle.push(`corte imposible en la cinta: ${id}`);

  return {
    fuera,
    sueltas: rotas,
    vacias,
    perdidas: contarPerdidas(doc, detalle),
    deformadas: torcidas,
    rebosan: contarRebosados(dom, detalle),
    tintasIguales: repetidas.length,
    cortesRotos: cortesRotos.length,
    detalle,
  };
}

/** ¿Todo en orden? El único sitio donde se decide qué cifras son fatales. */
export const estaSano = (v: Veredicto): boolean =>
  v.fuera === 0 && v.sueltas === 0 && v.perdidas === 0 && v.cortesRotos === 0;

/**
 * La invariante que demuestra que el historial es la verdad y no un adorno:
 * reproducir la lista de acciones desde el punto de partida tiene que dar
 * exactamente el documento de ahora. Si falla, algún comando está mirando algo
 * que no son sus argumentos —un reloj, un azar, un contador global— y las
 * macros, el deshacer y la corrección se caen los tres a la vez.
 *
 * Vive aquí y no en las pruebas a propósito: es un instrumento que una clase
 * puede colgar de `window` para auditarse sola, igual que `__verificarDiapo`.
 */
export function historiaCuadra(h: Historia): boolean {
  return JSON.stringify(reproducir(h.base, h.hechas)) === JSON.stringify(documento(h));
}
