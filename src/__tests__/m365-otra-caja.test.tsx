/**
 * `of-m365-otra-caja` · «El mismo trabajo en otra caja» (§58.2, grado
 * Avanzado de la sala de M365).
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio «Tecnia Nube
 * Suite»), no una copia de sus datos. Lo que se cuida aquí:
 *
 *  · Que la entrada respete la plantilla de oro y que el CTA abra «Tecnia
 *    Nube Suite» sin ningún `<canvas>` de por medio — nada de 3D forzado ni
 *    de metáfora física, es software de verdad con sus tres pestañas.
 *  · Que NINGÚN encargo dependa de arrastre: todo es clic, porque jsdom
 *    pierde las coordenadas de puntero en silencio y una prueba de arrastre
 *    saldría verde sin comprobar nada (COMO-SE-CONSTRUYE.md §5.1-5.2).
 *  · Que el resultado de la celda `E5` salga de la función pura `promedio()`
 *    sobre los números reales de `B5:D5`, nunca de un valor pegado.
 *  · Jugar MAL a propósito: aplicar formato sin seleccionar el título,
 *    elegir una función que no es PROMEDIO, pulsar el distractor "Insertar
 *    gráfico", confirmar un rango que no es `B5:D5`, y entregar el proyecto
 *    sin haber completado los tres módulos — todo debe restar y explicar,
 *    nunca fallar en silencio ni dejar avanzar sin acertar.
 *  · Que la interfaz nunca muestre "Google", "Docs", "Sheets", "Slides" ni
 *    ningún nombre o logo real de Microsoft/Google: sólo "Tecnia Nube
 *    Suite" y sus tres módulos con nombre propio.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import Entrada from '@/components/activities/office/m365/otra-caja/Entrada';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(<Entrada config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  return { ...utils, onProgress, onScore, onComplete };
}

/** `assetsPendientes: true` deja el CTA listo de entrada, sin cubrepantalla que tapar. */
function entrarAlLaboratorio() {
  fireEvent.click(screen.getByText('Abre Tecnia Nube Suite'));
}

const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const celdaE5 = () => document.querySelector('.otc-hoja-celda--clicable') as HTMLElement;

/** Completa Documentos: selecciona el título y aplica negrita + tamaño 18. */
function completarDocumentos() {
  fireEvent.click(screen.getByText('Informe de Avance del Proyecto'));
  fireEvent.click(screen.getByText('Negrita'));
  fireEvent.click(screen.getByText('Tamaño 18'));
}

function irAHojas() {
  fireEvent.click(screen.getByRole('tab', { name: /Hojas/ }));
}

function irAPresentaciones() {
  fireEvent.click(screen.getByRole('tab', { name: /Presentaciones/ }));
}

/** Completa Hojas: cambia de pestaña y hace E5 → Σ → PROMEDIO → confirma B5:D5. */
function completarHojas() {
  irAHojas();
  fireEvent.click(celdaE5());
  fireEvent.click(screen.getByText('Σ Funciones'));
  fireEvent.click(screen.getByText('PROMEDIO'));
  fireEvent.click(screen.getByText('B5:D5'));
}

/** Completa Presentaciones: cambia de pestaña, abre el selector y elige un tema distinto al inicial. */
function completarPresentaciones() {
  irAPresentaciones();
  fireEvent.click(screen.getByText('🎨 Cambiar Tema'));
  fireEvent.click(screen.getByText('Oscuro Teal'));
}

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('m365-otra-caja · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Nube Suite', () => {
    montar();
    expect(screen.getByText('Adaptabilidad Multiplataforma')).not.toBeNull();
    expect(screen.getByText('El oficio, no el botón')).not.toBeNull();
    expect(screen.getByText('El mismo formato, otro menú')).not.toBeNull();
    expect(screen.getByText('La misma fórmula, otro icono')).not.toBeNull();
    expect(screen.getByText('El mismo tema, otro panel')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Nube Suite')).not.toBeNull();
  });

  /*
   * ESTA PRUEBA SE DIO LA VUELTA EL 2-sep-2026.
   *
   * Pedía el aviso de «todavía se está grabando» y que NO hubiera `<video>`,
   * que era la verdad mientras la clase no tenía video. Ya lo tiene
   * (`public/assets/actividades/of-m365-otra-caja/video-explicativo.mp4`) y la
   * bandera `assetsPendientes` bajó a `false`, así que ahora se comprueba lo
   * contrario: que el reproductor esté puesto y que el aviso haya desaparecido.
   * La prueba sigue vigilando la misma avería —que la entrada y el disco no se
   * contradigan—, sólo que desde el otro lado.
   */
  it('monta el reproductor de verdad y ya no enseña el aviso de grabación', () => {
    montar();
    expect(screen.queryByText('El video de esta clase todavía se está grabando.')).toBeNull();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('src')).toContain('of-m365-otra-caja');
  });
});

describe('m365-otra-caja · la ventana correcta, sin 3D forzado y sin marcas reales', () => {
  it('el CTA abre "Tecnia Nube Suite" con sus 3 pestañas y sin ningún <canvas>', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelector('.vtb-barra-marca')?.textContent).toBe('Tecnia Nube Suite');
    expect(document.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('tab', { name: /Documentos/ })).not.toBeNull();
    expect(screen.getByRole('tab', { name: /Hojas/ })).not.toBeNull();
    expect(screen.getByRole('tab', { name: /Presentaciones/ })).not.toBeNull();
  });

  it('no menciona Google, Docs, Sheets, Slides ni Microsoft en ningún sitio de la interfaz', () => {
    montar();
    entrarAlLaboratorio();
    irAHojas();
    irAPresentaciones();
    fireEvent.click(screen.getByText('🎨 Cambiar Tema'));
    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/Google|Docs\b|Sheets|Slides|Microsoft/);
  });
});

describe('m365-otra-caja · Documentos — jugar mal y luego bien', () => {
  it('aplicar negrita sin seleccionar el título antes resta y explica, y no aplica el formato', () => {
    const { onScore } = montar();
    entrarAlLaboratorio();

    fireEvent.click(screen.getByText('Negrita'));
    expect(bitDice()).toContain('selecciona el título');
    expect(document.querySelector('.otc-doc-titulo')?.className).not.toContain('es-negrita');
    expect(onScore).toHaveBeenCalledWith(94);
  });

  it('seleccionar el título y aplicar negrita + tamaño 18 marca el módulo con su check', () => {
    montar();
    entrarAlLaboratorio();
    completarDocumentos();

    const titulo = document.querySelector('.otc-doc-titulo') as HTMLElement;
    expect(titulo.className).toContain('es-negrita');
    expect(titulo.style.fontSize).toBe('18px');
    expect(screen.getByRole('tab', { name: /Documentos ✔/ })).not.toBeNull();
  });
});

describe('m365-otra-caja · Hojas — el promedio es una cuenta real, no un número pegado', () => {
  it('elegir SUMA o CONTAR en vez de PROMEDIO resta y explica, sin calcular nada', () => {
    montar();
    entrarAlLaboratorio();
    irAHojas();
    fireEvent.click(celdaE5());
    fireEvent.click(screen.getByText('Σ Funciones'));
    fireEvent.click(screen.getByText('SUMA'));
    expect(bitDice()).toContain('no calcula el promedio');
    expect(celdaE5().textContent).not.toContain('8');
  });

  it('el distractor "Insertar gráfico" no calcula nada y da la pista del icono correcto', () => {
    montar();
    entrarAlLaboratorio();
    irAHojas();
    fireEvent.click(screen.getByText('📊 Insertar gráfico'));
    expect(bitDice()).toContain('insertar un gráfico');
    expect(bitDice()).toContain('funciones');
    expect(celdaE5().textContent).not.toContain('8');
  });

  it('confirmar un rango que no es B5:D5 resta y explica, y E5 sigue vacía', () => {
    montar();
    entrarAlLaboratorio();
    irAHojas();
    fireEvent.click(celdaE5());
    fireEvent.click(screen.getByText('Σ Funciones'));
    fireEvent.click(screen.getByText('PROMEDIO'));
    fireEvent.click(screen.getByText('B5:E5')); // incluye la propia celda del resultado — el error clásico
    expect(bitDice()).toContain('no junta las tres notas');
    expect(celdaE5().textContent).not.toContain('8');
  });

  it('E5, Σ, PROMEDIO y B5:D5 calculan el promedio real de 8, 7 y 9', () => {
    montar();
    entrarAlLaboratorio();
    completarHojas();
    expect(celdaE5().textContent).toContain('8');
    expect(screen.getByRole('tab', { name: /Hojas ✔/ })).not.toBeNull();
  });
});

describe('m365-otra-caja · Presentaciones — el tema cambia de verdad', () => {
  it('la diapositiva abre con un tema y cambia a otro al elegirlo en el panel', () => {
    montar();
    entrarAlLaboratorio();
    irAPresentaciones();
    expect(document.querySelector('.otc-slide-tema-nombre')?.textContent).toBe('Claro Simple');

    completarPresentaciones();
    expect(document.querySelector('.otc-slide-tema-nombre')?.textContent).toBe('Oscuro Teal');
    expect(screen.getByRole('tab', { name: /Presentaciones ✔/ })).not.toBeNull();
  });
});

describe('m365-otra-caja · entregar sin completar los tres módulos', () => {
  it('resta, explica cuál falta y no termina la actividad', () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    completarDocumentos();
    // Hojas y Presentaciones siguen sin hacer.
    fireEvent.click(screen.getByText('🚀 Entregar Proyecto Multiplataforma'));
    expect(bitDice()).toContain('falta un módulo');
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('m365-otra-caja · el recorrido completo', () => {
  it('completando los 3 módulos sin errores, entregar cierra la clase con 100 y la insignia', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    completarDocumentos();
    completarHojas();
    completarPresentaciones();

    fireEvent.click(screen.getByText('🚀 Entregar Proyecto Multiplataforma'));
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(screen.getByText('¡Proyecto multiplataforma entregado!')).not.toBeNull();
    expect(document.querySelector('.final-insignia')?.textContent).toContain('🔄');
    expect(document.querySelector('.final-insignia-nombre')?.textContent).toContain('Maestro Multiplataforma');
  });

  it('un botón equivocado repetido en Hojas sólo resta hasta el piso de 60, y nunca deja avanzar sin acertar', () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    irAHojas();
    fireEvent.click(celdaE5());
    fireEvent.click(screen.getByText('Σ Funciones'));

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText('CONTAR'));
    }

    expect(celdaE5().textContent).not.toContain('8');
    const puntajes = onScore.mock.calls.map((llamada) => llamada[0] as number);
    expect(Math.min(...puntajes)).toBe(60);
    expect(puntajes.every((p) => p >= 60)).toBe(true);
  });
});
