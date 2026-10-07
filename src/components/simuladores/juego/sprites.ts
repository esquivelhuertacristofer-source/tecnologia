/**
 * TECNIA JUEGOS · LOS SPRITES
 *
 * Píxel-art de 16×16 escrito como texto: una letra por píxel, una fila por
 * línea, `.` es transparente. Se convierte a SVG con rectángulos por tramos
 * (`shape-rendering: crispEdges`) y se sirve como `data:` URI, así que no hay
 * archivos que cargar, funciona sin red, y jsdom lo puede leer.
 *
 * Están aquí y no en PNG por tres motivos: el proyecto va sin CDN y sin
 * dependencias de imágenes que se pierdan al empaquetar; el dibujo se puede
 * revisar en una revisión de código; y una prueba comprueba que cada sprite
 * mide exactamente 16×16 —un PNG mal recortado no avisa, una fila de 15
 * caracteres sí—.
 *
 * Nada de cubos ni esferas: un explorador con casco, una moneda con brillo,
 * pinchos de acero, una puerta de madera, una babosa. Es lo que el alumno ve
 * en los juegos que juega, y lo que la auditoría del 12-sep-2026 echó en falta.
 */

export const LADO_SPRITE = 16;

/** La paleta compartida. Una letra, un color pleno. */
export const PALETA: Readonly<Record<string, string>> = {
  k: '#101828', // contorno
  w: '#f8fafc', // blanco
  b: '#38bdf8', // traje claro
  B: '#0369a1', // traje oscuro
  y: '#facc15', // amarillo
  Y: '#fef08a', // amarillo claro
  O: '#b45309', // dorado oscuro
  r: '#ef4444', // rojo
  s: '#e2e8f0', // acero claro
  S: '#94a3b8', // acero
  m: '#334155', // metal oscuro
  M: '#64748b', // metal
  D: '#7c2d12', // madera oscura
  d: '#c2410c', // madera
  g: '#4ade80', // babosa clara
  G: '#15803d', // babosa oscura
  v: '#22c55e', // césped
  V: '#166534', // césped sombra
  t: '#7c4a1e', // tierra
  T: '#5b3416', // tierra sombra
  l: '#b91c1c', // ladrillo
  L: '#7f1d1d', // ladrillo sombra
  c: '#e7d3c0', // cemento
  p: '#c084fc', // visor del héroe (violeta claro)
  a: '#a855f7', // violeta
};

/* Cada sprite: 16 líneas de 16 caracteres. La prueba `juego-motor.test.ts`
 * lo comprueba fila por fila. */

const HEROE = [
  '................',
  '.....kkkkkk.....',
  '....kyyyyyyk....',
  '...kyyyyyyyyk...',
  '...kppppppppk...',
  '...kpkkppkkpk...',
  '...kppppppppk...',
  '....kkkkkkkk....',
  '...kbbbbbbbbk...',
  '..kbBbbbbbbBbk..',
  '..kb.kbbbbk.bk..',
  '..kk.kbBBbk.kk..',
  '.....kbbbbk.....',
  '.....kBkkBk.....',
  '....kkrkkrkk....',
  '....krr..rrk....',
];

const MONEDA = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kyyyyyyk....',
  '...kyYYyyyyyk...',
  '...kyYyyyyyyk...',
  '...kyyyOOyyyk...',
  '...kyyyOOyyyk...',
  '...kyyyOOyyyk...',
  '...kyyyOOyyyk...',
  '...kyyyyyyyyk...',
  '....kyyyyyyk....',
  '.....kkkkkk.....',
  '................',
  '................',
  '................',
];

const PINCHO = [
  '................',
  '................',
  '................',
  '................',
  '..s....s....s...',
  '.sSs..sSs..sSs..',
  '.sSs..sSs..sSs..',
  '.sSSs.sSSs.sSSs.',
  'sSSSssSSSssSSSs.',
  'sSSSSSSSSSSSSSs.',
  'SSSSSSSSSSSSSSS.',
  'kkkkkkkkkkkkkkkk',
  'kmmmmmmmmmmmmmmk',
  'kmMmmMmmMmmMmmmk',
  'kkkkkkkkkkkkkkkk',
  '................',
];

const PUERTA = [
  '..kkkkkkkkkkkk..',
  '.kMMMMMMMMMMMMk.',
  'kMDDDDDDDDDDDDMk',
  'kMDddddddddddDMk',
  'kMDddddddddddDMk',
  'kMDdddDDDDdddDMk',
  'kMDdddDddDdddDMk',
  'kMDdddDddDdddDMk',
  'kMDdddDDDDdddDMk',
  'kMDddddddddddDMk',
  'kMDdddddddyddDMk',
  'kMDddddddddddDMk',
  'kMDddddddddddDMk',
  'kMDddddddddddDMk',
  'kMDDDDDDDDDDDDMk',
  'kkkkkkkkkkkkkkkk',
];

const ENEMIGO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '......kkkk......',
  '....kkggggkk....',
  '...kggggggggk...',
  '..kgwkggggkwgk..',
  '..kgkkggggkkgk..',
  '.kggggggggggggk.',
  '.kgGggggggggGgk.',
  'kggggggggggggggk',
  'kGGGGGGGGGGGGGGk',
  '.kkkkkkkkkkkkkk.',
  '................',
];

const CESPED = [
  'vvvvvvvvvvvvvvvv',
  'vVvvvVvvvvVvvvVv',
  'VVVVVVVVVVVVVVVV',
  'ttttttttttttTttt',
  'tttTtttttttttttt',
  'tttttttttTtttttt',
  'tTtttttttttttttt',
  'ttttttttttttttTt',
  'ttttTttttttttttt',
  'ttttttttttTttttt',
  'tttttttttttttttt',
  'tTtttttTtttttttt',
  'tttttttttttttTtt',
  'ttttttTttttttttt',
  'tttttttttttttttt',
  'TTTTTTTTTTTTTTTT',
];

const LADRILLO = [
  'llllllllcllllllll'.slice(0, 16),
  'lllllllcllllllll',
  'lllllllcllllllll',
  'cccccccccccccccc',
  'lllcllllllllllll',
  'lllcllllllllllll',
  'lllcllllllllllll',
  'cccccccccccccccc',
  'lllllllllllcllll',
  'lllllllllllcllll',
  'lllllllllllcllll',
  'cccccccccccccccc',
  'llllllcLLLLLLLLL',
  'llllllcLLLLLLLLL',
  'llllllcLLLLLLLLL',
  'cccccccccccccccc',
];

const METAL = [
  'MMMMMMMMMMMMMMMM',
  'MssssssssssssssM',
  'MsSSSSSSSSSSSSsM',
  'MsSwSSSSSSSSwSsM',
  'MsSSSSSSSSSSSSsM',
  'MsSSSSSSSSSSSSsM',
  'MsSSSSSmmSSSSSsM',
  'MsSSSSSmmSSSSSsM',
  'MsSSSSSmmSSSSSsM',
  'MsSSSSSmmSSSSSsM',
  'MsSSSSSSSSSSSSsM',
  'MsSSSSSSSSSSSSsM',
  'MsSwSSSSSSSSwSsM',
  'MsSSSSSSSSSSSSsM',
  'MmmmmmmmmmmmmmmM',
  'MMMMMMMMMMMMMMMM',
];

export const DIBUJOS: Readonly<Record<string, readonly string[]>> = {
  heroe: HEROE,
  moneda: MONEDA,
  pincho: PINCHO,
  puerta: PUERTA,
  enemigo: ENEMIGO,
  'loseta-1': CESPED,
  'loseta-2': LADRILLO,
  'loseta-3': METAL,
};

/** El SVG de un dibujo, con un rectángulo por tramo de color. */
export function svgDeDibujo(filas: readonly string[], paleta: Readonly<Record<string, string>> = PALETA): string {
  const rects: string[] = [];
  filas.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      const letra = fila[x];
      let fin = x + 1;
      while (fin < fila.length && fila[fin] === letra) fin += 1;
      const color = letra === '.' ? null : paleta[letra];
      if (color) rects.push(`<rect x="${x}" y="${y}" width="${fin - x}" height="1" fill="${color}"/>`);
      x = fin;
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO_SPRITE} ${LADO_SPRITE}" ` +
    `shape-rendering="crispEdges">${rects.join('')}</svg>`
  );
}

export function uriDeDibujo(filas: readonly string[]): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgDeDibujo(filas))}`;
}

const cache = new Map<string, string>();

/** El `data:` URI del sprite, calculado una vez. */
export function spriteUri(nombre: string): string {
  const hecho = cache.get(nombre);
  if (hecho) return hecho;
  const filas = DIBUJOS[nombre];
  if (!filas) throw new Error(`Sprite desconocido: ${nombre}`);
  const uri = uriDeDibujo(filas);
  cache.set(nombre, uri);
  return uri;
}
