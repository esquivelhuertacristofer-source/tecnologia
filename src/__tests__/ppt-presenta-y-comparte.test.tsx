/**
 * `of-ppt-presenta-y-comparte` · «Modo presentador y PDF» (doc §43.1), jugada
 * entera desde la portada de objetivos hasta la pantalla de cierre.
 *
 * La primera de las siete exclusivas, y la que abrió DOS puertas del motor a la
 * vez: el escenario (`DosPantallas`) y el Backstage (la pestaña Archivo). Las
 * dos las heredaron después seis clases más, así que un defecto aquí no es de
 * una clase: es de seis.
 *
 * Lo que se juega mal a propósito: copiar el cuerpo de la diapositiva en las
 * notas —el error que comete todo el mundo la primera vez—, y salir a media
 * clase con la pestaña Archivo abierta.
 */

import { LabPresentaYComparte } from '@/components/activities/office/powerpoint/presenta-y-comparte/Lab';
import {
  abrirArchivo,
  celebrar,
  cuenta,
  elegirLa,
  encargo,
  escribirNota,
  exportarComo,
  hayInsignia,
  irAPestana,
  irADiapositiva,
  jugarDesdeLaPortada,
  pulsar,
  pulsarEn,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
  seccionDeArchivo,
} from './ayuda-ppt';

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

const queVaEnLasNotas = () => elegirLa(1);

const escribirLaNota = () => {
  irADiapositiva(1);
  escribirNota('Aquí les cuento el viaje que hace el agua antes de llegar a casa.');
};

const empezarLaPresentacion = () => {
  irAPestana('presentacion');
  pulsar('desde-principio');
};

const abrirElModerador = () => {
  // Salir de la función y volver a entrar con el otro botón: es literalmente lo
  // que pide el encargo («Sal y pulsa…»).
  pulsarEn('.dpt-mandos', 'Terminar');
  irAPestana('presentacion');
  pulsar('vista-moderador');
};

const queVeElPublico = () => elegirLa(2);

/** Las cinco, hasta el final: llegar a la última ES el encargo. */
const pasarLasCinco = () => {
  for (let i = 0; i < 4; i += 1) pulsarEn('.dpt-mandos', 'Siguiente');
};

const sacarElPdf = async () => {
  pulsarEn('.dpt-mandos', 'Terminar');
  abrirArchivo();
  seccionDeArchivo('exportar');
  await exportarComo('pdf');
};

const cualSeManda = () => elegirLa(1);

const PASOS: Array<() => void | Promise<void>> = [
  queVaEnLasNotas,
  escribirLaNota,
  empezarLaPresentacion,
  abrirElModerador,
  queVeElPublico,
  pasarLasCinco,
  sacarElPdf,
  cualSeManda,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    await PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('of-ppt-presenta-y-comparte de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabPresentaYComparte);

    await hastaEl(8);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('8 de 8');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabPresentaYComparte, { alSalir });

    await hastaEl(8);

    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('of-ppt-presenta-y-comparte, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('copiar el cuerpo de la diapositiva en las notas no cierra el encargo', async () => {
    const partida = await jugarDesdeLaPortada(LabPresentaYComparte);
    await hastaEl(1);
    expect(encargo()).toBe('Escríbela tú');

    // JUGAR MAL · las viñetas copiadas tal cual, que es el error de todos.
    irADiapositiva(1);
    escribirNota('De una presa\nSe limpia en una planta\nLlega por tubos');
    await celebrar();
    expect(encargo()).toBe('Escríbela tú');

    // JUGAR MAL · una nota de dos palabras: un recordatorio para nadie.
    escribirNota('el agua');
    await celebrar();
    expect(encargo()).toBe('Escríbela tú');

    escribirNota('Aquí les cuento el viaje que hace el agua.');
    await celebrar();
    expect(encargo()).toBe('Empieza la presentación');
    partida.desmontar();
  });

  it('salir a media clase con la pestaña Archivo abierta no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabPresentaYComparte, { alSalir });
    await hastaEl(2);

    abrirArchivo();
    seccionDeArchivo('exportar');
    // El Backstage tapa la ventana entera, así que el alumno sale por su
    // «Volver» y de ahí por la ✕ de la barra de título.
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
