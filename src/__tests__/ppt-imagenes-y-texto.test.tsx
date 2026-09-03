/**
 * `n4-imagenes-y-texto` · «Imágenes y texto que se entienden» (doc §27.2),
 * jugada entera desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la clase 2 de la sala y la primera que **no empieza en blanco**: abre la
 * presentación de la clase 1 con tres defectos puestos a mano. Eso la convierte
 * en la más frágil de las cinco prestadas —cada encargo busca su diapositiva
 * **por el título**, no por el número, y si un encargo anterior le cambia el
 * título a la que sea, los siguientes dejan de encontrarla—.
 *
 * Y es la única de las cinco que pide **arrastrar un tirador**: los otros
 * encargos se cumplen pulsando botones, y éste sólo se puede jugar con el ratón
 * sobre el lienzo. Es justo la clase de gesto que ninguna prueba unitaria pisa.
 */

import { fireEvent } from '@testing-library/react';
import { LabImagenesYTexto } from '@/components/activities/office/powerpoint/LabImagenesYTexto';
import {
  avisos,
  celebrar,
  confirmar,
  cuenta,
  elegirDe,
  elegirItem,
  elegirLa,
  encargo,
  escribirEn,
  escribirNota,
  hayInsignia,
  irADiapositiva,
  irAPestana,
  jugarDesdeLaPortada,
  pulsar,
  salirDelRepaso,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
  seleccionarLibre,
  seleccionarMarcador,
} from './ayuda-ppt';

/* ── los dos ayudantes que esta clase necesita y el mando no trae ───────────*/

/**
 * Cambiar el tamaño de letra, que **no es un botón sino un `<select>`**.
 *
 * Va por `fireEvent.change` y no por un clic a propósito: la ventana lo inyecta
 * como desplegable de verdad (§37.5) y pasa por `pulsar` igual que un botón, así
 * que el desvío y el aro lo ven. Un clic no dispararía su `onChange` y el
 * encargo parecería imposible.
 */
function elegirTamano(pt: number) {
  const sel = document.querySelector('[data-control="fuente-tamano"]');
  if (!sel) throw new Error('no hay desplegable de tamaño de letra en la cinta');
  fireEvent.change(sel as HTMLSelectElement, { target: { value: String(pt) } });
}

/**
 * Un evento de puntero **con sus coordenadas**, que `fireEvent.pointerMove` no
 * sabe mandar.
 *
 * jsdom 26 no implementa `PointerEvent`, así que testing-library cae a `Event` y
 * `clientX`/`clientY` se pierden por el camino: el motor recibe `undefined`,
 * calcula `dx = NaN` y pinta la caja de destino con `width: NaN`. El síntoma es
 * el peor posible — el arrastre no falla, simplemente no mueve nada, y el
 * encargo parece imposible—. Un `MouseEvent` con el nombre del evento de puntero
 * sí lleva las coordenadas, y React lee del evento nativo.
 */
function puntero(el: Element, tipo: string, x: number, y: number) {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, clientX: x, clientY: y }));
}

/**
 * Arrastrar un tirador de la caja seleccionada, en píxeles del lienzo.
 *
 * Es el único gesto de la sala que no se puede hacer con un botón, y se puede
 * jugar en jsdom por un detalle del motor: `escalaViva()` deduce la escala del
 * DOM y, sin maquetación, cae a `zoom/100` — que arranca en 100 porque el ajuste
 * automático mide cero y no toca nada. O sea, un píxel es un píxel, y 80 × 60 es
 * exactamente una casilla (`COL_PX` × `FILA_PX`).
 */
function arrastrarTirador(cual: string, dx: number, dy: number) {
  const t = document.querySelector(`[data-tirador="${cual}"]`);
  if (!t) throw new Error(`no hay tirador «${cual}»: ¿está la caja seleccionada?`);
  const lienzo = document.querySelector('.dpw-lienzo');
  if (!lienzo) throw new Error('no hay lienzo en pantalla');
  puntero(t, 'pointerdown', 0, 0);
  puntero(lienzo, 'pointermove', dx, dy);
  puntero(lienzo, 'pointerup', dx, dy);
}

/* ── los once encargos, cada uno como lo haría el alumno ────────────────────*/

/** El párrafo de Sofi, que sale de la pantalla y se va a las notas. */
const PARRAFO =
  'El desierto es un lugar muy seco donde casi no llueve en todo el año, de día ' +
  'hace muchísimo calor y de noche hace tanto frío que los animales se esconden.';

const mirarDeLejos = () => confirmar();

const laVersionCorta = () => elegirLa(1);

/**
 * Los tres renglones, en la diapositiva 2.
 *
 * Hay que ir a ella primero: la clase abre en la portada, y el predicado busca
 * «¿Qué es el desierto?» por su título. Escribir sin moverse dejaría el muro de
 * texto intacto y el cuerpo de la portada —que no existe— sin tocar.
 */
const escribirLasTres = () => {
  irADiapositiva(1);
  escribirEn('cuerpo', 'Casi no llueve\nMucho calor de día\nFrío de noche');
};

const ponerlesVinetas = () => {
  seleccionarMarcador('cuerpo');
  irAPestana('inicio');
  pulsar('vinetas');
};

const guardarElParrafo = () => escribirNota(PARRAFO);

const agrandarElTitulo = () => {
  irADiapositiva(2);
  seleccionarMarcador('titulo');
  elegirTamano(44);
};

/** Letra casi negra sobre el fondo arena del tema: contraste de sobra. */
const arreglarElContraste = () => elegirDe('color', 'data-color', '#111827');

const laImagenQueApoya = () => elegirLa(1);

const meterla = () => {
  irAPestana('insertar');
  elegirItem('imagen', 'zorro');
};

/**
 * Del tamaño justo: media diapositiva y sin comerse el título.
 *
 * Entra en 6 × 4 casillas (24) y el encargo pide 40. Tres casillas de ancho y
 * una de alto la dejan en 9 × 5 = 45, ocupando de la fila 3 a la 8 — el título
 * vive en las filas 1 y 2, así que no lo toca.
 */
const darleElTamano = () => {
  seleccionarLibre('zorro');
  arrastrarTirador('se', 240, 60);
};

const mirarlaOtraVez = () => pulsar('repasar');

const PASOS = [
  mirarDeLejos,
  laVersionCorta,
  escribirLasTres,
  ponerlesVinetas,
  guardarElParrafo,
  agrandarElTitulo,
  arreglarElContraste,
  laImagenQueApoya,
  meterla,
  darleElTamano,
  mirarlaOtraVez,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('n4-imagenes-y-texto de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabImagenesYTexto);

    await hastaEl(11);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('11 de 11');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabImagenesYTexto, { alSalir });

    await hastaEl(11);

    /*
     * El último encargo es «Mírala otra vez», así que la clase termina DENTRO
     * del repaso y la insignia espera a que el alumno lo cierre — taparle la
     * presentación que está pasando con una medalla sería el programa
     * interrumpiéndose a sí mismo. Es el mismo camino que la clase 1.
     */
    expect(hayInsignia()).toBe(false);
    salirDelRepaso();
    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('n4-imagenes-y-texto, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('las medias tintas no cierran los encargos: ni un renglón de más, ni un título chico, ni una foto que tape', async () => {
    const partida = await jugarDesdeLaPortada(LabImagenesYTexto);
    await hastaEl(2);
    expect(encargo()).toBe('Escríbelas');

    // JUGAR MAL · cuatro renglones en vez de tres: el muro más corto sigue
    // siendo un muro, y la regla del §27.2 es «tres frases», no «menos texto».
    irADiapositiva(1);
    escribirEn('cuerpo', 'Casi no llueve\nMucho calor de día\nFrío de noche\nY hay cactus');
    await celebrar();
    expect(encargo()).toBe('Escríbelas');

    escribirEn('cuerpo', 'Casi no llueve\nMucho calor de día\nFrío de noche');
    await celebrar();
    expect(encargo()).toBe('Ponles viñetas');

    PASOS[3]();
    await celebrar();
    PASOS[4]();
    await celebrar();
    expect(encargo()).toBe('Letra grande');

    // JUGAR MAL · subirlo a 32, que en una hoja sería enorme y en una
    // diapositiva sigue sin leerse desde atrás.
    irADiapositiva(2);
    seleccionarMarcador('titulo');
    elegirTamano(32);
    await celebrar();
    expect(encargo()).toBe('Letra grande');

    elegirTamano(44);
    await celebrar();
    expect(encargo()).toBe('Que contraste');

    // JUGAR MAL · el amarillo por otro amarillo. En la pantalla de casa parece
    // que se ve; proyectado desaparece, que es justo la lección.
    elegirDe('color', 'data-color', '#EAB308');
    await celebrar();
    expect(encargo()).toBe('Que contraste');

    PASOS[6]();
    await celebrar();
    PASOS[7]();
    await celebrar();
    PASOS[8]();
    await celebrar();
    expect(encargo()).toBe('Del tamaño justo');

    // JUGAR MAL · agrandarla hacia ARRIBA hasta comerse el título. Es grande
    // —de sobra— y aun así está mal, y ésa es la mitad del encargo que un
    // predicado de sólo superficie se dejaría.
    seleccionarLibre('zorro');
    arrastrarTirador('n', 0, -120);
    await celebrar();
    seleccionarLibre('zorro');
    arrastrarTirador('e', 320, 0);
    await celebrar();
    expect(encargo()).toBe('Del tamaño justo');

    partida.desmontar();
  });

  it('el desvío se avisa sin ensuciar la presentación, y salir a media clase con la galería abierta no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabImagenesYTexto, { alSalir });
    await hastaEl(6);
    expect(encargo()).toBe('Que contraste');

    /*
     * JUGAR MAL · el encargo señala «Color de letra» y el alumno pulsa Negrita.
     * El programa tiene que nombrarlo y NO aplicarlo: un botón equivocado que
     * cambia la presentación deja al alumno con dos cosas que arreglar.
     */
    pulsar('negrita');
    await celebrar();
    expect(avisos()).not.toBe('');
    expect(encargo()).toBe('Que contraste');

    // Y se sale con la galería de colores abierta y el zoom bajado a la última
    // butaca, que es como se queda la pantalla de quien se va a media clase.
    pulsar('color');
    fireEvent.change(document.querySelector('.txtw-zoom-mando input') as HTMLInputElement, {
      target: { value: '45' },
    });
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
