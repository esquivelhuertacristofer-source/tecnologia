/**
 * Tecnia Imagina (§69.3): las propiedades que la clase da por ciertas, medidas
 * sobre cientos de semillas y no sobre un caso suelto.
 */

import {
  cumple,
  generar,
  mismaPeticion,
  PETICION_VACIA,
  peticionCubre,
  queLeFalta,
  textoDePeticion,
  type Peticion,
  type Requisitos,
} from '@/components/simuladores/generador';

const ENCARGO: Requisitos = { tema: 'volcan', estilo: 'plastilina', formato: 'vertical', sin: ['texto', 'persona', 'marca'] };
const COMPLETA: Peticion = { tema: 'volcan', estilo: 'plastilina', formato: 'vertical', prohibidos: ['texto', 'persona', 'marca'] };
const N = 300;

describe('el generador', () => {
  it('es determinista: la misma petición con el mismo número da la misma tanda', () => {
    expect(generar(COMPLETA, 7)).toEqual(generar(COMPLETA, 7));
  });

  it('la misma petición con otro número casi nunca da la misma tanda', () => {
    const vaga: Peticion = { ...PETICION_VACIA, tema: 'volcan' };
    let iguales = 0;
    for (let n = 1; n <= N; n++) {
      const a = generar(vaga, n).imagenes.map(({ id: _id, ...resto }) => resto);
      const b = generar(vaga, n + 1).imagenes.map(({ id: _id, ...resto }) => resto);
      if (JSON.stringify(a) === JSON.stringify(b)) iguales++;
    }
    expect(iguales).toBeLessThan(N * 0.02);
  });

  it('ni siquiera la petición completa repite una tanda: el encuadre cambia aunque las piezas no', () => {
    let iguales = 0;
    for (let n = 1; n <= N; n++) {
      const a = generar(COMPLETA, n).imagenes.map(({ id: _id, ...resto }) => resto);
      const b = generar(COMPLETA, n + 1).imagenes.map(({ id: _id, ...resto }) => resto);
      if (JSON.stringify(a) === JSON.stringify(b)) iguales++;
    }
    expect(iguales).toBe(0);
  });

  it('lo que no se pide lo decide el generador: con sólo el tema salen estilos y formatos de todo tipo', () => {
    const vaga: Peticion = { ...PETICION_VACIA, tema: 'volcan' };
    const estilos = new Set<string>();
    const formatos = new Set<string>();
    for (let n = 1; n <= 40; n++) for (const im of generar(vaga, n).imagenes) {
      expect(im.tema).toBe('volcan');
      estilos.add(im.estilo);
      formatos.add(im.formato);
    }
    expect(estilos.size).toBe(3);
    expect(formatos.size).toBe(2);
  });

  it('y se VE en cada tanda: sin estilo pedido salen tres estilos; sin formato pedido, nunca tres iguales', () => {
    const vaga: Peticion = { ...PETICION_VACIA, tema: 'volcan' };
    for (let n = 1; n <= N; n++) {
      const { imagenes } = generar(vaga, n);
      expect(new Set(imagenes.map((im) => im.estilo)).size).toBe(3);
      expect(new Set(imagenes.map((im) => im.formato)).size).toBe(2);
    }
  });

  it('lo prohibido se cuela a veces, y bastante menos que lo que no se dijo', () => {
    let colado = 0;
    let sinDecir = 0;
    const sinProhibir: Peticion = { ...COMPLETA, prohibidos: [] };
    for (let n = 1; n <= N; n++) {
      colado += generar(COMPLETA, n).imagenes.filter((im) => im.elementos.includes('persona')).length;
      sinDecir += generar(sinProhibir, n).imagenes.filter((im) => im.elementos.includes('persona')).length;
    }
    expect(colado).toBeGreaterThan(0);
    expect(colado / (N * 3)).toBeLessThan(0.22);
    expect(sinDecir / (N * 3)).toBeGreaterThan(0.3);
  });

  it('una petición completa deja SIEMPRE al menos una imagen que cumple', () => {
    for (let n = 1; n <= N; n++) {
      expect(generar(COMPLETA, n).imagenes.some((im) => cumple(im, ENCARGO))).toBe(true);
    }
  });

  it('y no por eso todas cumplen: hay tandas con alguna que hay que descartar', () => {
    let conDescarte = 0;
    for (let n = 1; n <= N; n++) if (generar(COMPLETA, n).imagenes.some((im) => !cumple(im, ENCARGO))) conDescarte++;
    expect(conDescarte).toBeGreaterThan(N * 0.2);
  });

  it('la petición se escribe en un orden fijo, así dos peticiones iguales se reconocen', () => {
    const a: Peticion = { ...COMPLETA, prohibidos: ['marca', 'texto', 'persona'] };
    expect(textoDePeticion(a)).toBe(textoDePeticion(COMPLETA));
    expect(mismaPeticion(a, COMPLETA)).toBe(true);
    expect(textoDePeticion(COMPLETA)).toBe(
      'Un volcán de bicarbonato · Dibujo de plastilina · Fondo de un cartel vertical · Sin texto dentro · Sin personas · Sin marcas de refrescos',
    );
  });

  it('queLeFalta dice lo que falta en palabras, y peticionCubre lee la petición contra el encargo', () => {
    const encuadre = { x: 50, y: 50, escala: 1, giro: 0 };
    expect(queLeFalta({ id: 'x', tema: 'cohete', estilo: 'noche', formato: 'horizontal', elementos: ['persona', 'texto'], encuadre }, ENCARGO)).toEqual([
      'no es un volcán de bicarbonato',
      'no está hecha como dibujo de plastilina',
      'no es vertical',
      'trae letras dentro',
      'sale una persona',
    ]);
    expect(peticionCubre(COMPLETA, ENCARGO)).toBe(true);
    expect(peticionCubre({ ...COMPLETA, prohibidos: ['persona', 'marca'] }, ENCARGO)).toBe(false);
  });
});
