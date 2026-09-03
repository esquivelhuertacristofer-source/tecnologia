/**
 * `n5-el-cerebro-de-la-compu` · N5·U1 «El sistema de cómputo», parada 1.
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio), no una copia de
 * sus datos. Lo que se cuida aquí:
 *
 *  · Que la entrada respete la plantilla de oro y que el CTA abra «Tecnia
 *    Monitor» sin ningún `<canvas>` de por medio — esta actividad no lleva 3D.
 *  · Que los tres medidores muestren números de verdad, distintos según la
 *    situación: no son un adorno, son la prueba que hay que leer.
 *  · Jugar MAL a propósito: diagnosticar el recurso equivocado no avanza y
 *    resta, y aplicar el arreglo equivocado —el caso explícito de "más
 *    memoria no arregla lo que le falta al procesador"— tampoco mueve el
 *    medidor que corresponde.
 *  · Que los números se declaren inventados en la propia pantalla.
 *  · El recorrido completo, incluida la prueba de que la memoria no guarda
 *    nada: tras el apagón, el archivo que ya estaba en el disco sigue ahí y
 *    el que sólo vivía en la memoria desaparece.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EntradaElCerebroDeLaCompu from '@/components/activities/n5/estudio/EntradaElCerebroDeLaCompu';
import type { ActivityResult } from '@/types/activity-contract';

type Recurso = 'procesador' | 'memoria' | 'disco';

const NOMBRE: Record<Recurso, string> = { procesador: 'Procesador', memoria: 'Memoria', disco: 'Disco' };
const ARREGLO: Record<Recurso, string> = {
  procesador: 'Cerrar programas que también piden cuentas, o esperar a que termine',
  memoria: 'Cerrar pestañas y programas que no estés usando ahora',
  disco: 'Borrar o mover archivos viejos a otro lugar',
};
const LINEAS_APAGON_ANTES = 'Llevas veinticinco minutos escribiendo un cuento en Tecnia Textos. Todavía no le diste guardar.';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaElCerebroDeLaCompu config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

function entrarAlLaboratorio() {
  fireEvent.click(screen.getByText('Abre Tecnia Monitor'));
}

async function encender() {
  fireEvent.click(screen.getByText('⏻ Encender'));
  await act(async () => {
    jest.advanceTimersByTime(1200);
  });
}

function mandarTrabajo() {
  fireEvent.click(screen.getByText('📥 Mandar este trabajo'));
}

/** Manda el trabajo activo y lo resuelve bien de punta a punta. */
async function resolverBien(recurso: Recurso) {
  mandarTrabajo();
  fireEvent.click(screen.getByRole('button', { name: NOMBRE[recurso] }));
  fireEvent.click(screen.getByRole('button', { name: ARREGLO[recurso] }));
  await act(async () => {
    jest.advanceTimersByTime(2300);
  });
}

const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const valorMedidor = (recurso: Recurso) =>
  document.querySelector(`.tm-medidor.es-${recurso} .tm-medidor-valor`)?.textContent ?? '';

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n5-el-cerebro-de-la-compu · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Monitor', () => {
    montar();
    expect(screen.getByText('El monitor de tareas')).not.toBeNull();
    expect(screen.getByText('Tres partes, tres trabajos')).not.toBeNull();
    expect(screen.getByText('"Va lento" no es un diagnóstico')).not.toBeNull();
    expect(screen.getByText('Más memoria no arregla el procesador')).not.toBeNull();
    expect(screen.getByText('La memoria no guarda nada')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Monitor')).not.toBeNull();
  });
});

describe('n5-el-cerebro-de-la-compu · software de verdad, sin 3D', () => {
  it('el CTA abre "Tecnia Monitor" apagado, con su botón de encender y sin ningún <canvas>', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelector('.tm-marco')).not.toBeNull();
    expect(screen.getByText('⏻ Encender')).not.toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });
});

describe('n5-el-cerebro-de-la-compu · los tres medidores', () => {
  it('tras mandar el primer trabajo (veinte pestañas), la memoria se llena y los otros dos no', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    mandarTrabajo();

    expect(valorMedidor('memoria')).toBe('96%');
    expect(valorMedidor('procesador')).toBe('22%');
    expect(valorMedidor('disco')).toBe('45%');
  });
});

describe('n5-el-cerebro-de-la-compu · jugar mal a propósito', () => {
  it('diagnosticar el recurso equivocado no avanza y resta; el correcto sí abre la pregunta del arreglo', async () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    await encender();
    mandarTrabajo();

    fireEvent.click(screen.getByRole('button', { name: 'Disco' }));
    expect(bitDice()).toContain('No es Disco');
    expect(screen.getByText('¿Cuál de los tres se llenó?')).not.toBeNull();
    expect(onScore).toHaveBeenCalledWith(94);

    fireEvent.click(screen.getByRole('button', { name: 'Memoria' }));
    expect(screen.getByText('¿Qué harías para arreglarlo?')).not.toBeNull();
  });

  it('"más memoria no arregla el procesador": el arreglo equivocado no mueve el medidor que sí está lleno', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    // Situación 1 (pestañas → memoria), resuelta bien para llegar a la 2.ª.
    await resolverBien('memoria');

    // Situación 2: exportar un video → el procesador es el que está lleno.
    mandarTrabajo();
    expect(valorMedidor('procesador')).toBe('97%');
    fireEvent.click(screen.getByRole('button', { name: 'Procesador' }));

    // El arreglo equivocado: "agregar memoria" no hace nada.
    fireEvent.click(screen.getByRole('button', { name: ARREGLO.memoria }));
    expect(bitDice()).toContain('Mira el medidor de Procesador: sigue exactamente igual');
    expect(screen.getByText('¿Qué harías para arreglarlo?')).not.toBeNull();
    expect(valorMedidor('procesador')).toBe('97%');

    // El arreglo correcto sí resuelve la situación.
    fireEvent.click(screen.getByRole('button', { name: ARREGLO.procesador }));
    expect(bitDice()).toContain('Meterle más memoria no habría movido ni un fotograma');
  });
});

describe('n5-el-cerebro-de-la-compu · lo honesto', () => {
  it('declara en pantalla que los números están inventados', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    expect(document.querySelector('.gabinete-nota')?.textContent).toContain('son inventados para que se entienda');
  });
});

describe('n5-el-cerebro-de-la-compu · el recorrido completo y el apagón', () => {
  it('resolviendo las diez situaciones —y la prueba de que la memoria no guarda nada— cierra con onComplete', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    await encender();

    const orden: Recurso[] = ['memoria', 'procesador', 'disco', 'procesador', 'memoria', 'disco', 'procesador', 'disco', 'memoria'];
    for (const recurso of orden) {
      await resolverBien(recurso);
    }

    // El apagón: escribiste un cuento sin guardar y se va la luz.
    expect(screen.getByText(LINEAS_APAGON_ANTES, { selector: '.tm-apagon-texto' })).not.toBeNull();
    fireEvent.click(screen.getByText('😬 Sigue escribiendo…'));
    await act(async () => {
      jest.advanceTimersByTime(1300);
    });

    // La prueba: lo que estaba en el disco sigue; lo que sólo vivía en la
    // memoria, no.
    expect(screen.getByText('📄 Tarea de Ciencias.docx').closest('.tm-archivo')?.textContent).toContain('Sigue ahí');
    expect(screen.getByText('📝 Mi cuento').closest('.tm-archivo')?.textContent).toContain('Desapareció');

    // Jugar mal primero: la respuesta que confunde importancia con dónde vivía el archivo.
    fireEvent.click(screen.getByRole('button', { name: 'Porque la tarea de Ciencias es más importante' }));
    expect(bitDice()).toContain('No es por importancia');

    // Y ahora la correcta.
    fireEvent.click(
      screen.getByRole('button', { name: 'Porque el cuento vivía sólo en la memoria, y la memoria se borra sin corriente' }),
    );
    await act(async () => {
      jest.advanceTimersByTime(1700);
    });

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(94); // un solo error, el de la respuesta del apagón.
    expect(resultado.stars).toBe(3);
    expect(screen.getByText('¡Monitor completo!')).not.toBeNull();
  });
});
