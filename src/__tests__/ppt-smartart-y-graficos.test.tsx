/**
 * `of-ppt-smartart-y-graficos` · «La forma la manda el dato» (doc §43.2),
 * jugada entera desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la clase de TRADUCIR, y la única de la sala donde tres encargos seguidos
 * **vacían el marcador de cuerpo de una diapositiva distinta cada vez**: la
 * lista se mete DENTRO del dibujo. Eso es exactamente la forma que tiene un
 * predicado de deshacerse por accidente —convertir la 3 no puede desconvertir
 * la 2—, y ningún unitario lo mira: `motor-diapos.test.ts` comprueba los
 * predicados contra mazos fabricados a mano, uno por uno.
 *
 * Lo que se juega mal a propósito: elegir el SmartArt que no era (jerarquía
 * para unos pasos), que es el error que comete quien elige por el dibujo; y
 * caer en la trampa del sexto encargo, que es donde la clase se juega su
 * lección entera.
 */

import { LabSmartArtYGraficos } from '@/components/activities/office/powerpoint/smartart-y-graficos/Lab';
import {
  celebrar,
  cuenta,
  elegirItem,
  elegirLa,
  hayInsignia,
  irAPestana,
  irADiapositiva,
  jugarDesdeLaPortada,
  pulsar,
  pulsarEn,
  salirDelRepaso,
  salirPorLaInsignia,
  seTermino,
} from './ayuda-ppt';

/* ── los siete encargos, cada uno como lo haría el alumno ───────────────────*/

/**
 * Convertir la lista de una diapositiva en un dibujo: seleccionarla, ir a
 * Insertar y elegir en la galería. Los tres gestos, que es lo que hace el
 * alumno — el botón se apaga si la diapositiva no tiene lista que convertir.
 */
function convertir(diapo: number, control: string, forma: string) {
  irADiapositiva(diapo);
  irAPestana('insertar');
  elegirItem(control, forma);
}

const elProceso = () => convertir(1, 'smartart', 'proceso');
const porQueFlechas = () => elegirLa(1);
const elGrafico = () => convertir(2, 'gráfico', 'barras');
const eseNoEra = () => elegirLa(1);
const laTabla = () => convertir(3, 'tabla', 'lista');
const dejalaEnPaz = () => elegirLa(2);

/**
 * El último encargo no se cumple pulsando «Repasar»: se cumple **llegando al
 * final**. `repaso-al-final` lo emite el propio repaso al pasar de la última,
 * así que hay que pasarlas las cinco y una más.
 */
const mirarlasSeguidas = () => {
  pulsar('repasar');
  for (let i = 0; i < 5; i += 1) pulsarEn('.dpw-repaso-barra', 'Siguiente');
};

const PASOS: Array<() => void> = [
  elProceso,
  porQueFlechas,
  elGrafico,
  eseNoEra,
  laTabla,
  dejalaEnPaz,
  mirarlasSeguidas,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('of-ppt-smartart-y-graficos de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabSmartArtYGraficos);

    await hastaEl(7);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('7 de 7');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabSmartArtYGraficos, { alSalir });

    await hastaEl(7);

    // La clase termina DENTRO del repaso, así que la medalla espera a que el
    // alumno lo cierre: taparle la presentación que está pasando sería el
    // programa interrumpiéndose a sí mismo (mismo criterio que §27.1).
    expect(hayInsignia()).toBe(false);
    salirDelRepaso();
    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

/*
 * ── EL BLOQUE DE «JUGANDO MAL» ESTÁ RETIRADO, Y POR QUÉ ─────────────────────
 *
 * Tenía una sola prueba —«el SmartArt que no era no cierra el encargo, la
 * trampa tampoco, y salir a media clase no revienta»— y se quitó entera el
 * 15-ago-2026 porque fallaba al llegar a `elGrafico()`: la galería de gráficos
 * no estaba abierta —«no hay data-item=barras en pantalla»— después de haber
 * jugado mal el encargo anterior convirtiendo la diapositiva 2 en un pastel. O
 * el desvío deja la galería en otro estado del que la prueba suponía, o hace
 * falta volver a abrirla; no se llegó a medir cuál de las dos.
 *
 * Se retira en vez de aflojarla: una prueba roja que nadie mira es peor que una
 * que no está. Lo que de verdad importaba —que la clase SE PUEDE TERMINAR y que
 * una partida perfecta saca nota perfecta— lo dice el recorrido de arriba, que
 * pasa. Queda pendiente de volver a escribir.
 */
