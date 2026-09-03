/**
 * `of-ppt-patron` · «El patrón de diapositivas» (doc §43.4), jugada entera
 * desde la portada de objetivos hasta la pantalla de cierre.
 *
 * De las siete exclusivas es la que menos aparato propio tiene y **la que más
 * motor estrena**: la vista Patrón entera, la herencia al pintar y Restablecer.
 * Estando dentro del patrón la ventana trabaja sobre un mazo de una sola
 * diapositiva y devuelve el resultado a `patron` al guardar; si ese trasvase se
 * rompiera, la clase seguiría compilando y sería imposible de terminar.
 *
 * Se juega mal a propósito lo que de verdad se juega mal aquí: pulsar el color
 * sin haber seleccionado nada, y elegir uno de los siete que tampoco se lee
 * sobre el fondo oscuro — que es el error que la clase existe para enseñar.
 */

import { LabPatron } from '@/components/activities/office/powerpoint/patron/Lab';
import {
  celebrar,
  cuenta,
  elegirDe,
  elegirLa,
  encargo,
  hayInsignia,
  irADiapositiva,
  irAPestana,
  jugarDesdeLaPortada,
  pulsar,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
  seleccionarMarcador,
} from './ayuda-ppt';

/* ── los siete encargos ─────────────────────────────────────────────────────*/

const buscarElSitio = () => elegirLa(1);

const abrirElPatron = () => {
  irAPestana('vista');
  pulsar('patron');
};

/**
 * El título del patrón, en blanco.
 *
 * Primero se selecciona y luego se pinta: sin selección el botón de color está
 * apagado, porque no sabría a qué pintárselo. De los siete de la galería, sobre
 * el fondo de «Noche» sólo el blanco y el amarillo llegan al 4,5 de contraste
 * que pide la medida de WCAG del guion.
 */
const cambiarElTitulo = () => {
  seleccionarMarcador('titulo');
  irAPestana('inicio');
  elegirDe('color', 'data-color', '#FFFFFF');
};

const salirYMirar = () => {
  irAPestana('vista');
  pulsar('vista-normal');
};

const cualNoCambio = () => elegirLa(1);

const restablecerla = () => {
  irADiapositiva(6);
  irAPestana('inicio');
  pulsar('restablecer');
};

const deQueMeSuena = () => elegirLa(0);

const PASOS = [
  buscarElSitio,
  abrirElPatron,
  cambiarElTitulo,
  salirYMirar,
  cualNoCambio,
  restablecerla,
  deQueMeSuena,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('of-ppt-patron de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabPatron);

    await hastaEl(7);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('7 de 7');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabPatron, { alSalir });

    await hastaEl(7);

    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('of-ppt-patron, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('un color que tampoco se lee sobre el fondo oscuro no cierra el encargo', async () => {
    const partida = await jugarDesdeLaPortada(LabPatron);
    await hastaEl(2);
    expect(encargo()).toBe('Tócalo una vez');

    // JUGAR MAL · el azul de al lado: sigue sin despegarse del fondo.
    seleccionarMarcador('titulo');
    irAPestana('inicio');
    elegirDe('color', 'data-color', '#0369A1');
    await celebrar();
    expect(encargo()).toBe('Tócalo una vez');

    // El amarillo sí: es el otro de los dos que pasan la medida.
    elegirDe('color', 'data-color', '#EAB308');
    await celebrar();
    expect(encargo()).toBe('Ahora mira');
    partida.desmontar();
  });

  it('salir a media clase estando DENTRO del patrón no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabPatron, { alSalir });
    await hastaEl(2);

    // El alumno está en la vista Patrón, con el título seleccionado, y se va.
    seleccionarMarcador('titulo');
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
