/**
 * `n6-proyecto-integrador` · «Tu proyecto integrador», jugada entera desde la
 * portada de objetivos hasta la pantalla de cierre — los tres actos, los dos
 * programas (DISEÑO-N6-proyecto-integrador.md).
 *
 * No usa `jugarDesdeLaPortada` de `ayuda-ppt.tsx`: esa clase entra directo a
 * `VentanaDiapositivas`, y aquí el acto 1 es el navegador. Del resto de
 * `ayuda-ppt` sí se reutiliza todo lo del acto 2/3: escribir en un marcador,
 * abrir una galería de clase, avanzar la tira, dejar pasar la celebración.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { LabProyectoIntegrador } from '@/components/activities/n6/proyecto-integrador/LabProyectoIntegrador';
import {
  abrirLaPresentacion,
  celebrar,
  elegirItem,
  encargo,
  enEscena,
  escribirEn,
  irADiapositiva,
  irAPestana,
  pulsar,
  salirPorLaCruz,
} from './ayuda-ppt';

/* ── montar la clase, como lo hace el anfitrión de actividad ────────────── */

function montar(extra: Record<string, unknown> = {}) {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <LabProyectoIntegrador config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} {...extra} />,
  );
  return { onProgress, onScore, onComplete, ...utils };
}

const empezar = () => fireEvent.click(screen.getByTestId('pgw-empezar'));

/* ── el acto 1, en el navegador ──────────────────────────────────────────── */

const resultado = (i: number): HTMLElement =>
  document.querySelectorAll<HTMLElement>('.tn-resultado-titulo')[i];

const estrella = () => document.querySelector('.tn-marcador') as HTMLElement;
const marcarLaActual = () => fireEvent.click(estrella());
const desmarcarLaActual = () => fireEvent.click(estrella());
const atras = () => fireEvent.click(screen.getByLabelText('Atrás'));

/** Visita el resultado `i`, decide si lo marca, y vuelve a los resultados. */
function visitarResultado(i: number, marcar: boolean) {
  fireEvent.click(resultado(i));
  if (marcar) marcarLaActual();
  atras();
}

const seguirE1 = () => fireEvent.click(screen.getByTestId('pin-seguir-e1'));

/** `VentanaDiapositivas` mide su cinta al montar; deja correr un respiro. */
async function asentar() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
}

/** Marca los dos artículos firmados (índices 2 y 3) y sigue al E2. */
function resolverE1() {
  visitarResultado(2, true); // artículo A, firmado
  visitarResultado(3, true); // artículo B, firmado
  seguirE1();
}

/** Va a la página de la escuela (el enlace, no un resultado), la marca y
 *  elige el motivo correcto — con eso el acto 1 se cierra. */
function resolverE2() {
  fireEvent.click(screen.getByText('La página de nuestra escuela'));
  marcarLaActual();
  fireEvent.click(screen.getByText('Porque la medimos nosotros, en el bote del que hablamos'));
}

/* ── el acto 2 y 3 ────────────────────────────────────────────────────────── */

async function resolverActo2Y3() {
  // La portada corta de recordatorio del propio motor (GuionDiapos.portada).
  await asentar();
  await abrirLaPresentacion();

  // E3 · la portada
  escribirEn('titulo', 'La basura de nuestro salón');
  await celebrar();
  expect(encargo()).toBe('Lo que vas a sostener');

  // E4 · lo que sostiene
  irADiapositiva(1);
  escribirEn('titulo', 'Lo que más se tira es papel');
  await celebrar();
  expect(encargo()).toBe('La gráfica que habla de eso');

  // E5 · la gráfica que le habla a esa afirmación
  irAPestana('insertar');
  elegirItem('gráfico', 'barras');
  await celebrar();
  expect(encargo()).toBe('Las fuentes');

  // E6 · las fuentes
  irADiapositiva(3);
  irAPestana('insertar');
  elegirItem('imagen', 'medicion');
  elegirItem('imagen', 'articulo-a');
  await celebrar();
  expect(encargo()).toBe('De dónde sacaste ese número');

  // Acto 3 · el auditorio
  irAPestana('presentacion');
  pulsar('desde-principio');
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
}

describe('n6-proyecto-integrador de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el acto 1 no deja pasar de acto con las manos vacías', async () => {
    montar();
    empezar();
    // JUGAR MAL · pulsar «seguir» sin marcar nada, mil veces no adelanta nada.
    for (let i = 0; i < 5; i += 1) seguirE1();
    expect(screen.getByTestId('pin-seguir-e1')).toBeInTheDocument();
  });

  it('marcar el anuncio o la página sin firma no deja terminar el E1', async () => {
    montar();
    empezar();
    visitarResultado(0, true); // el anuncio
    visitarResultado(2, true);
    visitarResultado(3, true);
    seguirE1();
    // Sigue en el E1: el anuncio marcado lo impide.
    expect(screen.getByTestId('pin-seguir-e1')).toBeInTheDocument();
  });

  it('marcar y desmarcar cien veces no hace crecer el contador de errores', async () => {
    const partida = montar();
    empezar();
    fireEvent.click(resultado(0)); // el anuncio
    for (let i = 0; i < 50; i += 1) {
      marcarLaActual();
      desmarcarLaActual();
    }
    marcarLaActual();
    // Un solo error registrado por el anuncio, no cincuenta.
    const ultimoScore = partida.onScore.mock.calls.at(-1)?.[0];
    expect(ultimoScore).toBe(94); // 100 − 1 error · 6
  });

  it('atrás con la pila vacía no revienta, y navegar a una URL inventada da «no encontrada»', async () => {
    montar();
    empezar();
    atras(); // pila vacía al arrancar: no-op
    expect(document.querySelector('[data-testid="nav-resultados"]')).not.toBeNull();
  });

  /*
   * Recorrido completo, acto 1 y 2 · E1–E6 de punta a punta.
   *
   * **Medido, y corrige al pliego:** el acto 3 (E7–E9) vive dentro de
   * `Auditorio` en `acto="funcion"`, que monta un `<Canvas>` de
   * `@react-three/fiber`. `jest.setup.ts` hace
   * `HTMLCanvasElement.prototype.getContext = jest.fn(() => null)` A PROPÓSITO
   * y para TODO el proyecto (comentario del propio archivo: «devolver null
   * deja el comportamiento igual… sólo que en silencio»). Sin contexto WebGL,
   * Three.js nunca monta la escena, así que la ficha del atril —de donde
   * salen los tres botones de decisión— no llega al DOM. No es un defecto de
   * esta clase: es el mismo límite que ya medía `zz-dbg2.test.tsx` sobre
   * `LabPresentaAlGrupo` (el «¿canvas?» de esa traza también da `false`), y
   * ninguna clase de la casa que usa `Auditorio` en función tiene hoy una
   * prueba que pulse esos botones. Lo que SÍ se puede comprobar aquí es que
   * `escenarioCuando` abre el escenario exactamente donde debe, sin reventar.
   * El resto del acto 3 —qué decisión trae cada paso, y con qué opción
   * correcta— se prueba aparte, como función pura, en
   * `n6-proyecto-integrador-auditorio.test.tsx`.
   */
  it('E1–E6 de punta a punta, y el escenario del acto 3 se abre sin reventar', async () => {
    const alSalir = jest.fn();
    montar({ alSalir });
    empezar();
    resolverE1();
    resolverE2();
    await resolverActo2Y3();

    expect(enEscena('.aud')).toBe(true);
    expect(document.querySelector('canvas')).not.toBeNull();

    // El camino de salida funciona también desde dentro del escenario.
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('el camino de salida funciona a media práctica del acto 2', async () => {
    const alSalir = jest.fn();
    montar({ alSalir });
    empezar();
    resolverE1();
    resolverE2();
    await asentar();
    await abrirLaPresentacion();
    escribirEn('titulo', 'Mi proyecto');
    await celebrar();
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('la afirmación pegada primero y borrada después: el E5 juzga contra la que está en el mazo AHORA', async () => {
    montar();
    empezar();
    resolverE1();
    resolverE2();
    await asentar();
    await abrirLaPresentacion();
    escribirEn('titulo', 'Portada');
    await celebrar();

    irADiapositiva(1);
    // Se escribe una que la tabla NO sostiene primero…
    escribirEn('titulo', 'En las escuelas del país se tira sobre todo plástico');
    await celebrar();
    expect(encargo()).toBe('Lo que vas a sostener'); // sigue en el E4: no la sostiene

    // …se cambia por la correcta.
    escribirEn('titulo', 'El jueves fue el día de más basura');
    await celebrar();
    expect(encargo()).toBe('La gráfica que habla de eso');

    // Y la gráfica tiene que responder a ÉSTA, no a la primera que se escribió:
    // «líneas» es la que sostiene «el jueves fue el día de más basura».
    irAPestana('insertar');
    elegirItem('gráfico', 'lineas');
    await celebrar();
    expect(encargo()).toBe('Las fuentes');
  });
});
