/**
 * N6 · «Diseño y multimedia», parada 3 de 3 · `n6-crea-con-ia`.
 *
 * Lo que hay que cuidar aquí, distinto de las otras clases de IA: el Estudio
 * de Generación es el `panel` de `VentanaAsistente` (no un chat de fichas
 * como `n5-uso-responsable-de-ia`), las tres tandas de imágenes son datos
 * FIJOS del guion (cero azar), y la ficha de procedencia tiene que exigir
 * las TRES opciones correctas, no «casi».
 *
 * Se juega mal a propósito: Generar sin piezas, elegir la imagen con el
 * defecto, descartar las tres (y recuperarlas), elegir y luego descartar la
 * elegida, firmar incompleto, y declarar autoría propia y corregir sin
 * perder la ficha.
 */

import fs from 'fs';
import path from 'path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaCreaConIa } from '@/components/activities/ia/EntradaCreaConIa';
import {
  ELEGIBLE_TANDA_2,
  FECHA_TRABAJO,
  FICHAS_DEL_ESTUDIO,
  GUION_CREA_CON_IA,
  TANDA_2,
  TANDA_3,
  TOTAL_ENCARGOS,
} from '@/components/activities/ia/guionCreaConIa';
import { RUTA_N6_DISENO_MULTIMEDIA } from '@/components/activities/n4/estudio/EntradaN4Base';
import { validarGuion } from '@/components/simuladores/asistente';
import { CURRICULO } from '@/data/curriculo';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaCreaConIa config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

function saltarSiTeclea() {
  const saltar = screen.queryByTestId('asis-saltar');
  if (saltar) fireEvent.click(saltar);
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre el generador/ }));
  fireEvent.click(screen.getByTestId('psn-empezar'));
  return utils;
}

const pieza = (selector: string) => document.querySelector(selector) as HTMLElement;

function elegirPieza(fila: string, id: string) {
  fireEvent.click(pieza(`[data-testid="${fila}"] [data-pieza="${id}"]`));
}

function elegirFirma(hueco: string, id: string) {
  fireEvent.click(pieza(`[data-testid="${hueco}"] [data-opcion="${id}"]`));
}

function armarPeticionCompleta() {
  elegirPieza('cia-fila-que', 'volcan');
  elegirPieza('cia-fila-como', 'noche');
  elegirPieza('cia-fila-para-donde', 'cartel');
  elegirPieza('cia-fila-que-no', 'sinPersonas');
}

function generar() {
  fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
  saltarSiTeclea();
}

function siguienteEncargo() {
  fireEvent.click(screen.getByRole('button', { name: /Siguiente encargo/ }));
}

/** Lleva la partida hasta el final del encargo 3 (elegida t2-a, B y C fuera). */
function pasarMiraAntes() {
  fireEvent.click(pieza('[data-imagen="t2-b"] [data-accion="descartar"]'));
  fireEvent.click(pieza('[data-imagen="t2-c"] [data-accion="descartar"]'));
  fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="elegir"]`));
}

function firmarBien() {
  elegirFirma('cia-firma-herramienta', 'tecnia-genera');
  elegirFirma('cia-firma-que-pediste', 'peticion-completa');
  elegirFirma('cia-firma-cuando', 'fecha-trabajo');
  fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));
}

/** Recorrido perfecto, encargos 1 a 6 (deja al alumno frente a la pregunta de la maestra). */
function recorrerHastaLaMaestra() {
  elegirPieza('cia-fila-que', 'volcan');
  generar(); // encargo 1
  siguienteEncargo();

  armarPeticionCompleta();
  generar(); // encargo 2
  siguienteEncargo();

  pasarMiraAntes(); // encargo 3
  siguienteEncargo();

  generar(); // encargo 4: pide otra vez
  fireEvent.click(screen.getByRole('button', { name: /Comparar con la tanda anterior/ }));
  siguienteEncargo();

  fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="poner-de-fondo"]`)); // encargo 5
  siguienteEncargo();

  firmarBien(); // encargo 6
  siguienteEncargo();
}

describe('n6-crea-con-ia', () => {
  it('vive donde dice el currículo: N6, 11–12 años, y cierra su unidad como parada 3 de 3', () => {
    const n6 = CURRICULO.find((n) => n.n === 6)!;
    expect(n6.edad).toBe('11–12');
    const unidad = n6.unidades.find((u) => u.id === 'n6-diseno-y-multimedia')!;
    expect(unidad.actividades[2].id).toBe('n6-crea-con-ia');
    expect(unidad.actividades[2].estado).toBe('disponible');
    expect(RUTA_N6_DISENO_MULTIMEDIA[2].id).toBe('n6-crea-con-ia');
    expect(TOTAL_ENCARGOS).toBe(7);
  });

  it('el guion está sano: sin reglas inalcanzables, sin ids huérfanos, todas las fichas cubiertas', () => {
    expect(validarGuion(GUION_CREA_CON_IA, FICHAS_DEL_ESTUDIO)).toEqual([]);
  });

  it('la tanda 3 no repite ni una imagen de la tanda 2 — es la lección entera de la clase', () => {
    const idsTanda2 = new Set(TANDA_2.map((im) => im.id));
    const repetidas = TANDA_3.filter((im) => idsTanda2.has(im.id));
    expect(repetidas).toEqual([]);
  });

  it('la fecha de la firma no es la de hoy: HOY no puede coincidir con el dato del guion', () => {
    // Trampa medida el 21-ago-2026: si el guion usara esa misma fecha, un
    // defecto «lee el reloj en vez del dato» pasaría inadvertido siempre.
    expect(FECHA_TRABAJO).not.toBe('21 de agosto de 2026');
    expect(FECHA_TRABAJO).not.toBe(new Date().toDateString());
  });

  it('barrido de la casa: sin fetch, sin /api/, sin proveedores de IA reales, sin Math.random', () => {
    const raiz = path.join(process.cwd(), 'src', 'components', 'activities', 'ia');
    const archivos = ['LabCreaConIa.tsx', 'EntradaCreaConIa.tsx', 'guionCreaConIa.ts', 'creaConIa.css'];
    const prohibido = /fetch\(|\/api\/|anthropic|openai|Math\.random/i;
    for (const archivo of archivos) {
      const contenido = fs.readFileSync(path.join(raiz, archivo), 'utf8');
      expect(contenido).not.toMatch(prohibido);
    }
  });

  it('la entrada es suya y el laboratorio abre con la portada de objetivos, no con la mesa', () => {
    montar();
    expect(screen.getByText('Generar no es buscar')).toBeInTheDocument();
    expect(screen.getByText('Citar es decir tres cosas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Abre el generador/ }));
    const portada = screen.getByTestId('psn-portada');
    expect(within(portada).getByText('Crea con IA: pídelo bien, míralo, y di de dónde salió')).toBeInTheDocument();
    expect(screen.queryByTestId('cia-estudio')).toBeNull();
  });

  it('encargo 1: con una sola pieza salen tres imágenes genéricas y el encargo cierra solo', () => {
    abrirLaboratorio();
    expect(screen.getByTestId('cia-encargo-numero').textContent).toMatch(/Encargo 1 de 7/);

    // Jugar mal: pulsar Generar sin elegir nada no manda nada.
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    expect(screen.queryByTestId('cia-grupo-tanda1')).toBeNull();
    expect(screen.getByText(/Todavía te falta elegir: Qué/)).toBeInTheDocument();

    elegirPieza('cia-fila-que', 'volcan');
    generar();

    expect(screen.getByTestId('cia-grupo-tanda1')).toBeInTheDocument();
    expect(screen.getAllByTestId('cia-imagen')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Siguiente encargo/ })).toBeInTheDocument();
  });

  it('encargo 2: pulsar Generar con piezas incompletas dice cuáles faltan, sin mandar nada', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();

    elegirPieza('cia-fila-como', 'noche');
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    expect(screen.getByText(/Todavía te falta elegir: Para dónde, Qué no/)).toBeInTheDocument();
    expect(screen.queryByTestId('cia-grupo-tanda2')).toBeNull();

    elegirPieza('cia-fila-para-donde', 'cartel');
    elegirPieza('cia-fila-que-no', 'sinPersonas');
    generar();

    expect(screen.getByTestId('cia-grupo-tanda2')).toBeInTheDocument();
    const b = pieza('[data-imagen="t2-b"]');
    expect(within(b).getByTestId('cia-imagen-motivo').textContent).toMatch(/letras revueltas/);
  });

  it('encargo 3, jugar mal: elegir la imagen con defecto no cierra el encargo', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();

    fireEvent.click(pieza('[data-imagen="t2-c"] [data-accion="elegir"]'));
    expect(screen.getByText(/Esa no cumple lo que pediste/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Siguiente encargo/ })).toBeNull();
  });

  it('encargo 3, jugar mal: descartar las tres NO es un callejón sin salida — se puede recuperar', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();

    fireEvent.click(pieza('[data-imagen="t2-a"] [data-accion="descartar"]'));
    fireEvent.click(pieza('[data-imagen="t2-b"] [data-accion="descartar"]'));
    fireEvent.click(pieza('[data-imagen="t2-c"] [data-accion="descartar"]'));
    expect(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"]`).getAttribute('data-estado')).toBe('descartada');

    // Recuperar: descartar otra vez la trae de vuelta.
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="descartar"]`));
    expect(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"]`).getAttribute('data-estado')).toBe('ninguno');
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="elegir"]`));
    expect(screen.getByRole('button', { name: /Siguiente encargo/ })).toBeInTheDocument();
  });

  it('encargo 3, jugar mal: elegir y luego descartar la elegida deja el encargo abierto otra vez', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();

    // Elige la buena ANTES de descartar las otras dos: el encargo sigue abierto.
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="elegir"]`));
    expect(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"]`).getAttribute('data-estado')).toBe('elegida');
    expect(screen.queryByRole('button', { name: /Siguiente encargo/ })).toBeNull();

    // La deshace: descartar la que estaba elegida le quita la elección.
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="descartar"]`));
    expect(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"]`).getAttribute('data-estado')).toBe('descartada');

    // La recupera y esta vez completa el encargo de verdad.
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="descartar"]`));
    fireEvent.click(pieza('[data-imagen="t2-b"] [data-accion="descartar"]'));
    fireEvent.click(pieza('[data-imagen="t2-c"] [data-accion="descartar"]'));
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="elegir"]`));
    expect(screen.getByRole('button', { name: /Siguiente encargo/ })).toBeInTheDocument();
  });

  it('encargo 4: pedir lo mismo otra vez trae tres imágenes distintas, y Comparar exige que ya hayan llegado', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();
    pasarMiraAntes();
    siguienteEncargo();

    // Antes de generar, el botón sigue siendo «Generar»: Comparar no existe todavía.
    expect(screen.queryByRole('button', { name: /Comparar con la tanda anterior/ })).toBeNull();

    generar();
    expect(screen.getByTestId('cia-grupo-tanda3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comparar con la tanda anterior/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Comparar con la tanda anterior/ }));
    expect(screen.getByTestId('cia-comparar-nota').textContent).toMatch(/repetidas[\s\S]*0/);
    expect(screen.getByRole('button', { name: /Siguiente encargo/ })).toBeInTheDocument();
  });

  it('encargo 5: «Poner de fondo» sólo aparece sobre la imagen elegida', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();
    pasarMiraAntes();
    siguienteEncargo();
    generar();
    fireEvent.click(screen.getByRole('button', { name: /Comparar con la tanda anterior/ }));
    siguienteEncargo();

    expect(pieza(`[data-imagen="t2-b"] [data-accion="poner-de-fondo"]`)).toBeNull();
    expect(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="poner-de-fondo"]`)).not.toBeNull();

    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="poner-de-fondo"]`));
    expect(screen.getByTestId('cia-cartel-lienzo').className).toMatch(/es-con-fondo/);
    expect(screen.getByTestId('cia-imagen-badge-fondo')).toBeInTheDocument();
  });

  it('encargo 6: firmar con opciones malas dice cuáles faltan — no «casi»', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    siguienteEncargo();
    armarPeticionCompleta();
    generar();
    siguienteEncargo();
    pasarMiraAntes();
    siguienteEncargo();
    generar();
    fireEvent.click(screen.getByRole('button', { name: /Comparar con la tanda anterior/ }));
    siguienteEncargo();
    fireEvent.click(pieza(`[data-imagen="${ELEGIBLE_TANDA_2}"] [data-accion="poner-de-fondo"]`));
    siguienteEncargo();

    elegirFirma('cia-firma-herramienta', 'lo-hice-yo');
    elegirFirma('cia-firma-que-pediste', 'un-dibujo');
    elegirFirma('cia-firma-cuando', 'no-me-acuerdo');
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));
    expect(screen.getByText(/Todavía falta: Herramienta, Qué pediste, Cuándo/)).toBeInTheDocument();
    expect(screen.queryByTestId('cia-cartel-sello')).toBeNull();

    elegirFirma('cia-firma-herramienta', 'tecnia-genera');
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));
    expect(screen.getByText(/Todavía falta: Qué pediste, Cuándo/)).toBeInTheDocument();

    elegirFirma('cia-firma-que-pediste', 'peticion-completa');
    elegirFirma('cia-firma-cuando', 'fecha-trabajo');
    fireEvent.click(screen.getByRole('button', { name: 'Firmar' }));
    expect(screen.getByTestId('cia-cartel-sello').textContent).toMatch(FECHA_TRABAJO);
  });

  it('encargo 7: declarar autoría propia marca el cartel sin fuente, y corregir lo restaura SIN rehacer la ficha', () => {
    abrirLaboratorio();
    recorrerHastaLaMaestra();

    expect(screen.getByText('¿Este dibujo lo hiciste tú?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, lo hice yo' }));
    expect(screen.getByTestId('cia-cartel-sinfuente')).toBeInTheDocument();
    expect(screen.queryByTestId('cia-cartel-sello')).toBeNull();
    expect(screen.getByTestId('cia-maestra-aviso')).toBeInTheDocument();

    // Corregir: la firma ya estaba hecha, no hay que rehacer nada.
    fireEvent.click(screen.getByRole('button', { name: /Lo generé con una IA/ }));
    expect(screen.getByTestId('cia-cartel-sello')).toBeInTheDocument();
    expect(screen.queryByTestId('cia-cartel-sinfuente')).toBeNull();
  });

  it('Generar se apaga mientras el asistente contesta: no queda botón para mandar una segunda tanda', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    const antes = screen.getAllByTestId('asis-msg').length; // el saludo
    fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    // Con velocidad > 0, el asistente sigue «ocupado» mientras teclea: el
    // botón real de Generar desaparece (se sustituye por «Generando…»,
    // deshabilitado), así que un segundo gesto no tiene a dónde llegar.
    expect(screen.queryByRole('button', { name: 'Generar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Generando…' })).toBeDisabled();
    saltarSiTeclea();
    const despues = screen.getAllByTestId('asis-msg').length;
    // Una sola tanda: la petición del alumno y una respuesta, nada más.
    expect(despues).toBe(antes + 2);
    expect(screen.getAllByTestId('asis-msg').filter((m) => m.getAttribute('data-tipo') === 'usuario')).toHaveLength(1);
  });

  it('el camino de salida funciona a media práctica', () => {
    abrirLaboratorio();
    elegirPieza('cia-fila-que', 'volcan');
    generar();
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.getByRole('button', { name: /Abre el generador/ })).toBeInTheDocument();
  });

  it('recorrido completo: se puede terminar, saca 100 y tres estrellas, y el camino de salida funciona desde el cierre', () => {
    const { onComplete, onProgress, onScore } = abrirLaboratorio();
    recorrerHastaLaMaestra();
    fireEvent.click(screen.getByRole('button', { name: /Lo generé con una IA/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(Math.max(...onProgress.mock.calls.map((c: [number]) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c: [number]) => c[0]))).toBe(100);

    expect(screen.getByText('¡Tu cartel está firmado!')).toBeInTheDocument();
    expect(screen.getByText(/Creador que cita/)).toBeInTheDocument();
    expect(screen.getByText('Veces que pediste')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Volver a la entrada' }));
    expect(screen.getByRole('button', { name: /Abre el generador/ })).toBeInTheDocument();
  });
});
