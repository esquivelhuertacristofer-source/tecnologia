/**
 * `of-ppt-formas-y-cajas` · «Lo que dibujas tú» (doc §44.2), jugada entera
 * desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la clase que más piezas del lienzo toca de las diecinueve: cuadro de
 * texto, figuras, relleno y contorno por separado, selección múltiple con
 * Shift, Organizar —agrupar y traer al frente— y un modelo 3D que se gira
 * arrastrando. Casi nada de eso pasa por un botón que se pulsa una vez: casi
 * todo es un gesto sobre el lienzo, que es donde una prueba unitaria no llega.
 *
 * Su guion trae escrito un hallazgo de los que este recorrido busca: agrupar va
 * ANTES que ordenar porque, al revés, dibujar las dos formas nuevas deshacía el
 * predicado de «se te tapó el título» y el motor devolvía al alumno al encargo
 * anterior. Esta prueba deja fijado ese orden.
 */

import { LabFormasYCajas } from '@/components/activities/office/powerpoint/formas-y-cajas/Lab';
import {
  anadirALaSeleccion,
  celebrar,
  cuenta,
  elegirDe,
  elegirItem,
  elegirLa,
  encargo,
  escribirEnLibre,
  girarModelo,
  hayInsignia,
  irAPestana,
  jugarDesdeLaPortada,
  pulsar,
  salirDelRepaso,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
  seleccionarLibre,
} from './ayuda-ppt';

/*
 * Los ids que el motor le pone a lo que el alumno mete. No son invención de la
 * prueba: `cuadro` numera por cuántos objetos sueltos hay ya en la diapositiva,
 * y las figuras igual. Escribirlos aquí es la manera de que, si mañana esa
 * numeración cambia, la prueba lo diga en vez de callarse.
 */
const TITULO = 'texto-1';
const ELIPSE = 'forma-elipse-2';
const FLECHA = 'forma-flecha-3';
const RECTANGULO = 'forma-rectangulo-4';
const GOTA = 'modelo-gota';

/* ── los nueve encargos ─────────────────────────────────────────────────────*/

const queSeUsa = () => elegirLa(1);

const ponerElCuadro = () => {
  irAPestana('insertar');
  pulsar('cuadro');
  escribirEnLibre(TITULO, 'El ciclo del agua');
};

const dibujarLaNube = () => {
  irAPestana('inicio');
  elegirItem('formas', 'elipse');
};

/**
 * Relleno y contorno, que son dos botones porque son dos cosas.
 *
 * La pestaña «Formato de forma» es contextual: sale sola al seleccionar una
 * forma. Sin selección no existe, así que el orden de los tres gestos no es
 * decorativo.
 */
const vestirLaForma = () => {
  seleccionarLibre(ELIPSE);
  irAPestana('formato-forma');
  elegirDe('relleno', 'data-color', '#2563EB');
  elegirDe('contorno', 'data-color', 'ninguno');
};

const agruparLasTres = () => {
  irAPestana('inicio');
  elegirItem('formas', 'flecha');
  elegirItem('formas', 'rectangulo');
  seleccionarLibre(ELIPSE);
  anadirALaSeleccion(FLECHA);
  anadirALaSeleccion(RECTANGULO);
  elegirDe('organizar', 'data-organizar', 'agrupar');
};

/**
 * El título rescatado de debajo del grupo.
 *
 * **El arrastre del grupo encima del título no entra en el recorrido**, y no es
 * un descuido: en jsdom no hay motor de maquetación, y arrastrar por el lienzo
 * acaba metiendo un `NaN` en la posición de la caja —`left: NaN`— que envenena
 * el resto de la partida. No se pierde nada al dejarlo fuera: el predicado mira
 * el `z` y **no exige que las cajas se pisen**, a propósito, porque exigir un
 * sitio concreto suspendería a quien armó su cartel en otro lado. Lo que esta
 * prueba fija es lo que la clase corrige: que el título quede por delante.
 *
 * Se rescata trayéndolo al frente; mandar las formas al fondo vale igual, y por
 * eso el predicado lee el modelo y no el botón que se pulsó.
 */
const rescatarElTitulo = () => {
  seleccionarLibre(TITULO);
  elegirDe('organizar', 'data-organizar', 'al-frente');
};

const meterLaGota = () => {
  irAPestana('insertar');
  pulsar('modelo3d');
  seleccionarLibre(GOTA);
  // Medio grado por píxel: sesenta píxeles son treinta grados, y el guion pide
  // veinticinco. Quieto no enseñaría que la gota tiene lados.
  girarModelo('[data-tirador="giro"]', 60);
};

const paraQueSirvio = () => elegirLa(1);

const mirarlaEntera = () => pulsar('repasar');

const PASOS = [
  queSeUsa,
  ponerElCuadro,
  dibujarLaNube,
  vestirLaForma,
  agruparLasTres,
  rescatarElTitulo,
  meterLaGota,
  paraQueSirvio,
  mirarlaEntera,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/*
 * ── EL RECORRIDO COMPLETO, Y LO QUE ESTUVO ROTO ──────────────────────────────
 *
 * Se escribió, se quitó y se volvió a escribir. La primera vez se quitó a
 * conciencia porque **la partida entera se atascaba en el encargo 7, «El que
 * tiene lados»**, con la cuenta cayendo a «6 de 9» en cuanto el alumno tocaba
 * el botón siguiente de verdad. El predicado es `modeloGirado`, que pide 25
 * grados de giro, y lo medido entonces —y sigue siendo cierto— es que esa misma
 * secuencia SUELTA (insertar, seleccionar, arrastrar el tirador) sí cerraba el
 * encargo, y encadenada detrás de los seis anteriores no.
 *
 * La causa, cazada bisectando con un mazo de diagnóstico: `empezarGiro`, en
 * `VentanaDiapositivas.tsx`, ata `pointermove`/`pointerup` al tirador con
 * `addEventListener` y sólo cortaba la propagación del `pointerdown` inicial.
 * Esos dos eventos seguían subiendo por el DOM —un `addEventListener` de más
 * adentro no impide que React los recoja en la raíz— y llegaban también a
 * `onPointerMove`/`onPointerUp` del `.dpw-lienzo`, los mismos que mueven
 * cualquier caja arrastrada. Ahí encontraban un `gesto` armado por el ÚLTIMO
 * clic de selección: `alBajar` lo pone en CUALQUIER clic, con arrastre o sin
 * él, y sólo `alSoltar` —el del lienzo— lo apaga; un clic de selección suelto,
 * como los seis `seleccionarLibre(...)` de los encargos anteriores, nunca pasa
 * por ahí y lo deja armado para el próximo gesto, sea cual sea. El lienzo leía
 * el arrastre de giro como si fuera un arrastre de caja y llamaba a su propio
 * `cambiar()` con `recolocar()` partiendo de `mazoVivo` —una foto de ANTES de
 * girar—, y como los dos `cambiar()` disparaban sobre el mismo `mazo` del
 * mismo render, el segundo ganaba: el giro quedaba borrado. El encargo se daba
 * por bueno un instante —el primer `cambiar()` sí vio el giro— y el alumno
 * avanzaba, pero en cuanto el guion volvía a mirar los encargos ya hechos
 * (`primerDeshecho`, que corre en cualquier botón real de después) encontraba
 * el giro deshecho y devolvía al alumno aquí mismo. Por eso encadenada se
 * atascaba y suelta no: sin un clic de selección antes, no había ningún
 * `gesto` que el lienzo pudiera confundir con un arrastre.
 *
 * El arreglo corta la propagación también en `mover` y en `soltar`, no sólo al
 * empezar, así que el gesto de girar queda del todo aislado del lienzo —que es
 * lo que el comentario original de `empezarGiro` ya prometía y no cumplía
 * entero—. Vive en el motor y no en esta clase, y ninguna otra clase de la sala
 * usa `modeloGirado` ni el tirador de giro (`grep` a `modelo3d` en
 * `activities/office/powerpoint` sólo encuentra ésta), así que el arreglo no
 * tiene una segunda clase que reabrir — pero protege a la que entre después.
 */

describe('of-ppt-formas-y-cajas de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabFormasYCajas);

    await hastaEl(9);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('9 de 9');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabFormasYCajas, { alSalir });

    await hastaEl(9);

    // El último encargo se cumple AL PULSAR «Repasar», no al terminar el
    // repaso, pero pulsarlo abre igual la pantalla completa: la medalla espera
    // a que el alumno la cierre (mismo criterio que §27.1 y que
    // `of-ppt-smartart-y-graficos`).
    expect(hayInsignia()).toBe(false);
    salirDelRepaso();
    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('of-ppt-formas-y-cajas, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('dejar el «Escribe aquí» de fábrica no cuenta como haber escrito el título', async () => {
    const partida = await jugarDesdeLaPortada(LabFormasYCajas);
    await hastaEl(1);
    expect(encargo()).toBe('Ponlo y escríbelo');

    // JUGAR MAL · poner el cuadro y no tocarlo.
    irAPestana('insertar');
    pulsar('cuadro');
    await celebrar();
    expect(encargo()).toBe('Ponlo y escríbelo');

    escribirEnLibre(TITULO, 'El ciclo del agua');
    await celebrar();
    expect(encargo()).toBe('Dibuja la primera');
    partida.desmontar();
  });

  it('sólo el relleno, sin quitar la raya, deja el encargo a medias', async () => {
    const partida = await jugarDesdeLaPortada(LabFormasYCajas);
    await hastaEl(3);
    expect(encargo()).toBe('El dentro y la raya');

    // JUGAR MAL · la mitad del encargo: color dentro y la raya puesta.
    seleccionarLibre(ELIPSE);
    irAPestana('formato-forma');
    elegirDe('relleno', 'data-color', '#2563EB');
    await celebrar();
    expect(encargo()).toBe('El dentro y la raya');

    elegirDe('contorno', 'data-color', 'ninguno');
    await celebrar();
    expect(encargo()).toBe('Que se muevan juntas');
    partida.desmontar();
  });

  it('salir a media clase con dos objetos seleccionados y un desplegable abierto no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabFormasYCajas, { alSalir });
    await hastaEl(4);

    /*
     * Con lo que hay puesto en este punto de la clase, que son el cuadro de
     * texto y la elipse: la flecha y el rectángulo nacen en el encargo 5, y
     * pedirlos aquí era pedir dos objetos que el alumno todavía no ha dibujado.
     */
    irAPestana('inicio');
    seleccionarLibre(ELIPSE);
    anadirALaSeleccion(TITULO);
    pulsar('organizar');
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
