/**
 * `of-ppt-interactiva` · «Presentación que se navega» (doc §43.5), jugada
 * entera desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la única clase del bloque cuyos DOS encargos de gesto se cumplen **dentro
 * del modo presentación** y no con un botón de la cinta: `salto-en-presentacion`
 * y `volvio-y-siguio`. Ese es justo el sitio donde el motor tuvo que aprender a
 * no castigar por arrancar la presentación —si el control esperado no existe en
 * la cinta, el alumno queda «encerrado fuera de su propio encargo»— y por eso
 * esta clase es la que mejor mide si esa cautela sigue en pie: si se perdiera,
 * jugar bien costaría dos tropiezos y la partida perfecta sacaría 88.
 */

import { LabInteractiva } from '@/components/activities/office/powerpoint/interactiva/Lab';
import {
  BOTONES_DEL_MENU,
  NOMBRE_PERSONALIZADA,
  PARA_EL_JURADO,
  SECCIONES,
} from '@/components/activities/office/powerpoint/interactiva/guion';
import {
  celebrar,
  cuenta,
  elegirDe,
  elegirLa,
  encargo,
  escribirEnCampo,
  hayInsignia,
  irADiapositiva,
  irAPestana,
  jugarDesdeLaPortada,
  pulsar,
  pulsarPorAtributo,
  pulsarRotulo,
  salirDelRepaso,
  salirPorLaCruz,
  salirPorLaInsignia,
  saltarPorElVinculo,
  seTermino,
  seleccionarLibre,
} from './ayuda-ppt';

/* ── los siete encargos ─────────────────────────────────────────────────────*/

/** Cada botón del menú, a SU sección: uno que lleve a otra parece que funciona. */
const armarElMenu = () => {
  irAPestana('insertar');
  BOTONES_DEL_MENU.forEach((id, i) => {
    seleccionarLibre(id);
    elegirDe('vinculo', 'data-destino', String(SECCIONES[i]));
  });
};

const probarlo = () => {
  irAPestana('presentacion');
  pulsar('desde-principio');
  saltarPorElVinculo(SECCIONES[0]);
};

const elCallejon = () => {
  salirDelRepaso();
  elegirLa(1);
};

/** El botón de acción «Inicio» en cada sección: nace con su destino puesto. */
const ponerlesRegreso = () => {
  irAPestana('inicio');
  for (const i of SECCIONES) {
    irADiapositiva(i);
    elegirDe('formas', 'data-accion', 'inicio');
  }
};

const leerElMapa = () => elegirLa(1);

const laDelJurado = () => {
  irAPestana('presentacion');
  pulsar('personalizada');
  escribirEnCampo('nombre-personalizada', NOMBRE_PERSONALIZADA);
  for (const i of PARA_EL_JURADO) pulsarPorAtributo('data-elegir', String(i));
  pulsarRotulo('Crear');
};

/**
 * El recorrido de verdad: entrar, volver por el botón y entrar a otra.
 *
 * `volvioYSiguio` pide un sitio ya visitado al que se vuelve y, después de él,
 * uno nuevo. Arrancar la presentación siembra el recorrido con el menú, así que
 * la vuelta al menú es la repetición y la segunda sección es lo nuevo.
 */
const recorrerlo = () => {
  irAPestana('presentacion');
  pulsar('desde-principio');
  saltarPorElVinculo(SECCIONES[0]);
  saltarPorElVinculo(0);
  saltarPorElVinculo(SECCIONES[1]);
};

const PASOS = [
  armarElMenu,
  probarlo,
  elCallejon,
  ponerlesRegreso,
  leerElMapa,
  laDelJurado,
  recorrerlo,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('of-ppt-interactiva de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabInteractiva);

    await hastaEl(7);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('7 de 7');
    // Los dos encargos que se cumplen DENTRO de la presentación se abren con
    // «Desde el principio», y arrancar no puede cobrarse como error: si lo
    // hiciera, una partida impecable saldría con 88 y dos estrellas.
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabInteractiva, { alSalir });

    await hastaEl(7);

    salirDelRepaso();
    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('of-ppt-interactiva, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('un menú con los tres botones cruzados no cierra el encargo', async () => {
    const partida = await jugarDesdeLaPortada(LabInteractiva);
    expect(encargo()).toBe('Tres botones que no llevan a nada');

    // JUGAR MAL · los tres llevan a algún sitio, pero ninguno al suyo. Es el
    // menú que parece que funciona, que está peor que uno sin vínculos.
    irAPestana('insertar');
    seleccionarLibre(BOTONES_DEL_MENU[0]);
    elegirDe('vinculo', 'data-destino', String(SECCIONES[2]));
    seleccionarLibre(BOTONES_DEL_MENU[1]);
    elegirDe('vinculo', 'data-destino', String(SECCIONES[0]));
    seleccionarLibre(BOTONES_DEL_MENU[2]);
    elegirDe('vinculo', 'data-destino', String(SECCIONES[1]));
    await celebrar();
    expect(encargo()).toBe('Tres botones que no llevan a nada');

    armarElMenu();
    await celebrar();
    expect(encargo()).toBe('Pruébalo');
    partida.desmontar();
  });

  it('salir a media clase desde dentro de la presentación no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabInteractiva, { alSalir });
    await hastaEl(2);

    // El alumno está presentando, dentro de una sección, y se va sin salir del
    // repaso: la ✕ vive debajo, así que primero cierra el repaso.
    salirDelRepaso();
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
