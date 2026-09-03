/**
 * `n4-tus-primeras-diapositivas` · «Tus primeras diapositivas» (doc §27.1),
 * jugada entera desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la clase 1 de la sala y la más antigua de las diecinueve: la que estrenó
 * `VentanaDiapositivas`. Todo lo que las otras dieciocho dan por hecho —crear,
 * dar diseño, escribir en un marcador, elegir tema, reordenar la tira— nació
 * aquí, así que si el motor se movió debajo de la sala, esta clase es la que
 * más superficie tiene para notarlo.
 *
 * El recorrido va por el `Lab` y no por la ventana a pelo: el `Lab` es quien
 * califica, y una partida perfecta que saca 88 es un defecto que sólo se ve
 * desde aquí.
 */

import { LabTusPrimerasDiapositivas } from '@/components/activities/office/powerpoint/LabTusPrimerasDiapositivas';
import {
  celebrar,
  cuenta,
  elegirDiseno,
  elegirLa,
  elegirTema,
  encargo,
  escribirEn,
  hayInsignia,
  irAPestana,
  irADiapositiva,
  jugarDesdeLaPortada,
  llevarMini,
  montar,
  pulsar,
  salirDelRepaso,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
  esperarLaVentana,
} from './ayuda-ppt';

/* ── los doce encargos, cada uno como lo haría el alumno ────────────────────*/

const crearLaPrimera = () => {
  irAPestana('inicio');
  pulsar('nueva');
};

const ponerlaDePortada = () => elegirDiseno('portada');

const escribirElTitulo = () => escribirEn('titulo', 'El desierto');

const escribirElSubtitulo = () => escribirEn('subtitulo', 'Sofi · 4° B');

const elegirLaCara = () => {
  irAPestana('diseno');
  elegirTema('arena');
};

const otraDiapositiva = () => {
  irAPestana('inicio');
  pulsar('nueva');
};

const laComparacion = () => {
  elegirDiseno('dos-contenidos');
  escribirEn('titulo', 'Zorro y camello');
};

const elZorro = () => {
  pulsar('nueva');
  elegirDiseno('solo-imagen');
  escribirEn('titulo', 'El zorro del desierto');
};

const queEs = () => {
  pulsar('nueva');
  elegirDiseno('titulo-texto');
  escribirEn('titulo', '¿Qué es el desierto?');
  escribirEn('cuerpo', 'Lugar muy seco donde casi no llueve');
};

const mirarLaTira = () => elegirLa(1);

/**
 * Las dos movidas de la fase 3.
 *
 * Sofi apuntó las ideas en el orden en que se le ocurrieron —comparación,
 * zorro, qué es— así que la tira llega revuelta: portada, «Zorro y camello»,
 * «El zorro», «¿Qué es el desierto?». Subir la última hasta el puesto 1 y
 * después «El zorro» hasta el 2 la deja contada: primero qué es, luego el
 * zorro, y comparar al final, que es lo único que no se entiende sin lo
 * anterior.
 */
const ordenarLaTira = () => {
  llevarMini(3, 1);
  llevarMini(3, 2);
};

const repasarla = () => pulsar('repasar');

const PASOS = [
  crearLaPrimera,
  ponerlaDePortada,
  escribirElTitulo,
  escribirElSubtitulo,
  elegirLaCara,
  otraDiapositiva,
  laComparacion,
  elZorro,
  queEs,
  mirarLaTira,
  ordenarLaTira,
  repasarla,
];

/** Juega los encargos del 1 al `n`, dejando pasar cada celebración. */
async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── se pinta y se entra ────────────────────────────────────────────────────*/

describe('n4-tus-primeras-diapositivas · la portada', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('anuncia el tema y la presentación abre vacía, como PowerPoint sin diapositivas', async () => {
    const partida = montar(LabTusPrimerasDiapositivas);
    await esperarLaVentana();
    expect(document.body.textContent).toContain('La presentación, sus diseños y su orden');
    partida.desmontar();
  });
});

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('n4-tus-primeras-diapositivas de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabTusPrimerasDiapositivas);

    await hastaEl(12);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('12 de 12');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabTusPrimerasDiapositivas, { alSalir });

    await hastaEl(12);

    /*
     * El último encargo es «Repásala entera», así que la clase termina **desde
     * dentro del repaso**, y ahí la insignia no se pinta a propósito: taparle
     * al alumno la presentación que está pasando con una medalla sería el
     * programa interrumpiéndose a sí mismo. Sale al cerrar el repaso, que es lo
     * que el alumno hace de todas formas.
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

describe('n4-tus-primeras-diapositivas, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el diseño que no era no cierra el encargo, y el título de cinco palabras tampoco', async () => {
    const partida = await jugarDesdeLaPortada(LabTusPrimerasDiapositivas);
    await hastaEl(1);

    // JUGAR MAL · el acomodo de al lado.
    elegirDiseno('titulo-texto');
    await celebrar();
    expect(encargo()).toBe('Que sea portada');

    ponerlaDePortada();
    await celebrar();
    await hastaEl(0);
    expect(encargo()).toBe('El título');

    // JUGAR MAL · el título largo que el público no lee de lejos.
    escribirEn('titulo', 'El desierto y todos sus animales raros');
    await celebrar();
    expect(encargo()).toBe('El título');

    escribirElTitulo();
    await celebrar();
    expect(encargo()).toBe('Quién la hizo');
    partida.desmontar();
  });

  it('salir a media clase, con una galería abierta, no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabTusPrimerasDiapositivas, { alSalir });
    await hastaEl(5);

    // La galería de temas abierta —estamos en la pestaña Diseño— y el alumno se va.
    pulsar('tema');
    irADiapositiva(0);
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
