/**
 * `of-m365-copiloto` · «Qué hace y qué no hace un copiloto» (§58.3, grado
 * Avanzado de la sala de M365).
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio «Tecnia
 * Documentos» + «Tecnia Copiloto»), no una copia de sus datos. Lo que se
 * cuida aquí:
 *
 *  · §29 del canon: ninguna llamada real a un modelo (`resolverGuion` sólo
 *    devuelve respuestas que ya estaban escritas en `guion.ts`), ningún
 *    `<input>` de texto libre para el alumno, y el copiloto nunca se dibuja
 *    con cara (ni avatar, ni ícono de rostro).
 *  · Jugar MAL a propósito: intentar publicar con la cifra sin corregir,
 *    elegir una cifra equivocada, aceptar la sugerencia imprudente de
 *    conclusión en vez de rechazarla, e intentar destrabar una ficha antes de
 *    tiempo — nada de eso debe avanzar ni cerrar la clase.
 *  · Ningún encargo depende de arrastre: todo es clic (jsdom pierde las
 *    coordenadas de puntero en silencio).
 *  · El recorrido completo, sin errores, cierra con la insignia AUDITOR DE
 *    IA y el resultado que reporta el contrato de actividad.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import Entrada from '@/components/activities/office/m365/copiloto/Entrada';
import { CIFRA_FALSA, CIFRA_REAL, GUION } from '@/components/activities/office/m365/copiloto/guion';
import { validarGuion } from '@/components/simuladores/asistente';
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
  fireEvent.click(screen.getByText('Abre Tecnia Copiloto'));
}

const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';

function pedirFicha(etiqueta: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(etiqueta) }));
}

/** Redacta, inserta el borrador, y desbloquea la ficha «Resumir». */
function insertarBorrador() {
  pedirFicha('Redactar Borrador');
  fireEvent.click(screen.getByTestId('mcp-insertar-borrador'));
}

function insertarResumen() {
  pedirFicha('Resumir en 3 Puntos');
  fireEvent.click(screen.getByTestId('mcp-insertar-resumen'));
}

function corregirCifra() {
  fireEvent.click(screen.getByTestId('mcp-cifra-chip'));
  fireEvent.click(screen.getByTestId('mcp-cifra-op-real'));
}

function rechazarYElegirConclusion(opcionId = 'garantia') {
  pedirFicha('Sugerir Conclusión');
  fireEvent.click(screen.getByTestId('mcp-conclusion-rechazar'));
  fireEvent.click(screen.getByTestId(`mcp-conclusion-op-${opcionId}`));
}

/** El recorrido feliz completo, hasta dejar el botón de Publicar habilitado. */
function completarTodo() {
  insertarBorrador();
  insertarResumen();
  corregirCifra();
  rechazarYElegirConclusion();
}

describe('m365-copiloto · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Copiloto', () => {
    montar();
    expect(screen.getByText('Auditoría de IA en Ofimática')).not.toBeNull();
    expect(screen.getByText('Un copiloto, no un piloto automático')).not.toBeNull();
    expect(screen.getByText('La alucinación')).not.toBeNull();
    expect(screen.getByText('Propone, tú decides')).not.toBeNull();
    expect(screen.getByText('Un chat con fichas, no una caja mágica')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Copiloto')).not.toBeNull();
  });

  /*
   * ESTA PRUEBA SE DIO LA VUELTA EL 2-sep-2026.
   *
   * Pedía el aviso de «todavía se está grabando» y que NO hubiera `<video>`,
   * que era la verdad mientras la clase no tenía video. Ya lo tiene
   * (`public/assets/actividades/of-m365-copiloto/video-explicativo.mp4`) y la
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
    expect(video?.getAttribute('src')).toContain('of-m365-copiloto');
  });
});

describe('m365-copiloto · el guion está sano y no hay IA de verdad', () => {
  it('validarGuion no encuentra ninguna avería, con las tres fichas del compositor', () => {
    expect(validarGuion(GUION, ['redactar', 'resumir', 'concluir'])).toEqual([]);
  });

  it('las tres respuestas son texto fijo: nada de fetch, SDK ni ruta /api/ en el guion', () => {
    const texto = JSON.stringify(GUION);
    expect(texto).not.toMatch(/fetch|axios|\/api\//i);
  });
});

describe('m365-copiloto · sin cara, sin texto libre, sin arrastre', () => {
  it('el copiloto nunca se dibuja con rostro/avatar: sólo la marca de la ventana y el chat', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelectorAll('.vtb-barra-marca')[1]?.textContent).toBe('Tecnia Copiloto');
    // Ni imagen ni emoji de cara en la ventana del copiloto.
    const marco = document.querySelectorAll('.mcp-marco')[1] as HTMLElement;
    expect(marco.querySelector('img')).toBeNull();
    expect(marco.textContent).not.toMatch(/🤖|😀|🙂|👤/);
  });

  it('el compositor del copiloto nunca enciende un input de texto libre', () => {
    montar();
    entrarAlLaboratorio();
    expect(screen.queryByTestId('asis-libre')).toBeNull();
    expect(document.querySelector('input[type="text"]')).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('todos los encargos son de clic: no hay ni un manejador de arrastre en el laboratorio', () => {
    const { container } = montar();
    entrarAlLaboratorio();
    expect(container.querySelectorAll('[draggable="true"]').length).toBe(0);
    expect(container.innerHTML).not.toMatch(/onDragStart|onDrop|dragstart/i);
  });
});

describe('m365-copiloto · el documento — orden guiado', () => {
  it('la ficha «Resumir» está bloqueada hasta insertar el borrador', () => {
    montar();
    entrarAlLaboratorio();
    expect(screen.getByRole('button', { name: /Resumir en 3 Puntos/ })).toBeDisabled();
    insertarBorrador();
    expect(screen.getByRole('button', { name: /Resumir en 3 Puntos/ })).toBeEnabled();
  });

  it('la ficha «Sugerir Conclusión» está bloqueada hasta corregir la cifra', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    expect(screen.getByRole('button', { name: /Sugerir Conclusión/ })).toBeDisabled();
    corregirCifra();
    expect(screen.getByRole('button', { name: /Sugerir Conclusión/ })).toBeEnabled();
  });

  it('insertar el borrador escribe los dos párrafos en el documento', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    const doc = screen.getByTestId('mcp-doc');
    expect(doc.textContent).toMatch(/energía solar aprovecha la luz del Sol/);
  });
});

describe('m365-copiloto · la alucinación — jugar mal y luego bien', () => {
  it('la cifra del resumen insertado empieza siendo la falsa, igual a la del chat', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    expect(screen.getByTestId('mcp-cifra-chip').textContent).toContain(CIFRA_FALSA);
    // La fuente de referencia, en su propia pestaña, dice la real.
    fireEvent.click(screen.getByRole('tab', { name: /Fuente_Oficial.pdf/ }));
    expect(screen.getByTestId('mcp-fuente').textContent).toContain(CIFRA_REAL);
  });

  it('jugar mal: elegir la cifra equivocada resta, explica, y la cifra sigue sin corregir', () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();

    fireEvent.click(screen.getByTestId('mcp-cifra-chip'));
    fireEvent.click(screen.getByTestId('mcp-cifra-op-baja')); // $150, ni la falsa ni la real

    expect(bitDice()).toContain('tampoco es el de la fuente oficial');
    expect(screen.getByTestId('mcp-cifra-chip').textContent).toContain(CIFRA_FALSA);
    expect(onScore).toHaveBeenCalledWith(94);
  });

  it('corregir bien deja la cifra real y marcada, sin poder reabrir el selector', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    corregirCifra();

    const chip = screen.getByTestId('mcp-cifra-chip');
    expect(chip.textContent).toContain(CIFRA_REAL);
    expect(chip).toBeDisabled();
    expect(screen.queryByTestId('mcp-cifra-opciones')).toBeNull();
  });

  it('jugar mal: intentar publicar con la cifra SIN corregir se queda bloqueado', () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    // Nunca se corrige la cifra ni se resuelve la conclusión.
    expect(screen.getByTestId('mcp-publicar')).toBeDisabled();
    fireEvent.click(screen.getByTestId('mcp-publicar'));
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('m365-copiloto · la sugerencia imprudente — jugar mal y luego bien', () => {
  it('jugar mal: aceptar ("Insertar") la sugerencia imprudente resta y no la pone en la conclusión', () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    corregirCifra();
    pedirFicha('Sugerir Conclusión');

    fireEvent.click(screen.getByTestId('mcp-conclusion-aceptar'));

    // El clic en "Insertar" no cambia nada: sigue pendiente de decidir, y la
    // sección de Conclusión del documento NUNCA se cierra con el texto
    // imprudente (eso exigiría que existiera un párrafo "propio" ya resuelto).
    expect(bitDice()).toContain('imprudente');
    expect(document.querySelector('.mcp-parrafo--propia')).toBeNull();
    expect(screen.queryByTestId('mcp-conclusion-rechazar')).not.toBeNull();
    expect(screen.getByTestId('mcp-publicar')).toBeDisabled();
    expect(onScore).toHaveBeenCalledWith(94);
  });

  it('rechazar la sugerencia ofrece 2-3 conclusiones fijas, nunca un input', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    corregirCifra();
    pedirFicha('Sugerir Conclusión');
    fireEvent.click(screen.getByTestId('mcp-conclusion-rechazar'));

    const opciones = screen.getByTestId('mcp-opciones-conclusion');
    expect(opciones.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
    expect(opciones.querySelectorAll('button').length).toBeLessThanOrEqual(3);
    expect(document.querySelector('input')).toBeNull();
  });

  it('elegir una conclusión propia la escribe en el documento', () => {
    montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    corregirCifra();
    rechazarYElegirConclusion('cotizar');
    expect(screen.getByTestId('mcp-doc').textContent).toMatch(/Pedir al menos dos cotizaciones distintas/);
  });
});

describe('m365-copiloto · el recorrido completo', () => {
  it('completando los cuatro requisitos sin errores, publicar cierra la clase con 100 y la insignia AUDITOR DE IA', () => {
    const { onComplete, onScore, onProgress } = montar();
    entrarAlLaboratorio();
    completarTodo();

    expect(screen.getByTestId('mcp-publicar')).toBeEnabled();
    fireEvent.click(screen.getByTestId('mcp-publicar'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);

    expect(screen.getByText('¡Informe auditado y publicado!')).not.toBeNull();
    expect(document.querySelector('.final-insignia')?.textContent).toContain('🤖');
    expect(document.querySelector('.final-insignia-nombre')?.textContent).toContain('Auditor de IA');
  });

  it('un error en el camino (cifra mal elegida una vez) sólo resta y no impide terminar con 94', () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    insertarBorrador();
    insertarResumen();
    fireEvent.click(screen.getByTestId('mcp-cifra-chip'));
    fireEvent.click(screen.getByTestId('mcp-cifra-op-alta')); // se equivoca una vez; el selector se queda abierto
    fireEvent.click(screen.getByTestId('mcp-cifra-op-real'));
    rechazarYElegirConclusion();

    fireEvent.click(screen.getByTestId('mcp-publicar'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(94);
    expect(resultado.errores).toBe(1);
  });
});
