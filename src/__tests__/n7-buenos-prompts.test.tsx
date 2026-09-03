/**
 * N7 · «IA I», parada 2 · `n7-buenos-prompts`.
 *
 * Es la única clase de la plataforma con **entrada libre de texto**, así que
 * lo que se mide aquí es la rúbrica: que los cuatro criterios se enciendan
 * mientras se teclea, que el nivel del prompt decida qué contesta el
 * asistente, y que la trampa de la clase —un prompt largo y vacío— se caiga
 * de verdad y no sólo en el comentario.
 *
 * Se juega mal a propósito: mandar el cuadro vacío, mandar sólo espacios,
 * mandar dos veces mientras el asistente escribe, y contestar los cuatro
 * encargos escribiendo mucho y sin decir nada.
 *
 * Una de las diez es el recorrido completo hasta `onComplete`.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaBuenosPrompts } from '@/components/activities/ia/EntradaBuenosPrompts';
import { ENCARGOS_PROMPT, RUBRICA } from '@/components/activities/ia/promptsBuenos';
import { RUTA_N7_IA_1 } from '@/components/activities/ia/rutasIA';
import { evaluarPrompt, resolverGuion, validarGuion } from '@/components/simuladores/asistente';
import { CURRICULO } from '@/data/curriculo';

/** Un prompt largo, correctísimo de gramática, y que no dice ninguna de las cuatro. */
const LARGO_Y_VACIO =
  'Oye buenas tardes me gustaría por favor si no es mucha molestia que me ayudaras un poco con el asunto del agua porque la verdad no tengo ni idea de nada y me urge bastante gracias';

/** Uno corto que dice las cuatro cosas. */
const CORTO_Y_BUENO =
  'Explícame el agua de mi ciudad para una exposición con mis compañeros de secundaria, en una lista de 5 puntos, corto.';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaBuenosPrompts config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

function saltarSiTeclea() {
  const saltar = screen.queryByTestId('asis-saltar');
  if (saltar) fireEvent.click(saltar);
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre tu cuaderno de prompts/ }));
  fireEvent.click(screen.getByTestId('tia-empezar'));
  return utils;
}

function escribir(texto: string) {
  fireEvent.change(screen.getByTestId('asis-libre'), { target: { value: texto } });
}

function escribirYEnviar(texto: string) {
  escribir(texto);
  fireEvent.click(screen.getByTestId('asis-enviar'));
  saltarSiTeclea();
}

describe('n7-buenos-prompts', () => {
  it('vive donde dice el currículo: N7, 1.º de secundaria, 12–13 años', () => {
    const n7 = CURRICULO.find((n) => n.n === 7)!;
    expect(n7.grado).toBe('1° de Secundaria');
    expect(n7.edad).toBe('12–13');
    const unidad = n7.unidades.find((u) => u.id === 'n7-ia-1')!;
    expect(unidad.eje).toBe('datos-ia');
    expect(unidad.actividades[1].id).toBe('n7-buenos-prompts');
    expect(RUTA_N7_IA_1.map((p) => p.id)).toEqual(unidad.actividades.map((a) => a.id));
    expect(RUTA_N7_IA_1.map((p) => p.titulo)).toEqual(unidad.actividades.map((a) => a.titulo));
  });

  it('la entrada es suya, el tono es de secundaria y abre con la portada de objetivos', () => {
    montar();
    expect(screen.getByText('Qué tan largo lo quieres')).toBeInTheDocument();
    expect(screen.getByText('Las cuatro cosas que tiene que decir tu petición')).toBeInTheDocument();
    // Tono de secundaria, no de primaria: las cosas por su nombre.
    expect(screen.getByText(/escribir mucho no es pedir bien/)).toBeInTheDocument();
    expect(screen.getByText(/Cuatro encargos de la misma exposición/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Abre tu cuaderno de prompts/ }));
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('Escribe buenos prompts')).toBeInTheDocument();
    expect(screen.queryByTestId('tia-mesa')).toBeNull();
  });

  it('los cuatro guiones están sanos y cada nivel tiene su respuesta', () => {
    for (const e of ENCARGOS_PROMPT) {
      expect(validarGuion(e.guion)).toEqual([]);
      const vistos = new Set<string>();
      for (const nivel of ['pobre', 'mejorable', 'bueno'] as const) {
        // La regla `calidad` sólo casa si hay rúbrica y texto: se prueba con
        // un prompt de cada nivel, no inventando la evaluación.
        const texto = nivel === 'bueno' ? CORTO_Y_BUENO : nivel === 'pobre' ? 'ayuda' : 'resumen para mis compañeros';
        const r = resolverGuion(e.guion, { texto });
        expect(r.evaluacion?.nivel).toBe(nivel);
        expect(r.porDefecto).toBe(false);
        vistos.add(r.respuesta.id);
      }
      expect(vistos.size).toBe(3);
    }
  });

  it('el ejemplo que la clase enseña al final cumple de verdad los cuatro criterios', () => {
    for (const e of ENCARGOS_PROMPT) {
      const evaluacion = evaluarPrompt(e.ejemplo, RUBRICA);
      expect(evaluacion.nivel).toBe('bueno');
      expect(evaluacion.faltantes).toEqual([]);
    }
  });

  it('la rúbrica se enciende MIENTRAS se teclea, antes de enviar nada', () => {
    const { container } = abrirLaboratorio();
    const encendidos = () => container.querySelectorAll('[data-cumplido="si"]').length;
    expect(encendidos()).toBe(0);

    escribir('Explícame el agua');
    expect(encendidos()).toBe(0);
    escribir('Explícame el agua para una exposición');
    expect(container.querySelector('[data-criterio="contexto"]')?.getAttribute('data-cumplido')).toBe('si');
    escribir(CORTO_Y_BUENO);
    expect(encendidos()).toBe(RUBRICA.criterios.length);

    // Y nada de esto ha mandado un solo mensaje: el cuaderno sigue vacío.
    expect(screen.queryByTestId('tia-cuaderno')).toBeNull();
  });

  it('jugar mal: el cuadro vacío y el de puros espacios no se pueden enviar', () => {
    abrirLaboratorio();
    expect(screen.getByTestId('asis-enviar')).toBeDisabled();
    escribir('     ');
    expect(screen.getByTestId('asis-enviar')).toBeDisabled();
    escribir('ayuda');
    expect(screen.getByTestId('asis-enviar')).toBeEnabled();
  });

  it('la trampa de la clase: largo y vacío se queda en POBRE, corto y completo sale BUENO', () => {
    abrirLaboratorio();
    escribirYEnviar(LARGO_Y_VACIO);

    const cuaderno = screen.getByTestId('tia-cuaderno');
    expect(cuaderno.querySelectorAll('[data-nivel="pobre"]')).toHaveLength(1);
    expect(cuaderno.textContent).toMatch(/Pobre · 1\/4/);
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/Sonó importante y no puedes usar ni una línea/);
    // El encargo NO se da por resuelto.
    expect(screen.queryByTestId('tia-siguiente')).toBeNull();

    escribirYEnviar(CORTO_Y_BUENO);
    expect(screen.getByTestId('tia-logrado')).toBeInTheDocument();
    expect(screen.getByTestId('tia-logrado').textContent).toMatch(/en 2 intentos/);
    expect(screen.getByTestId('tia-siguiente')).toBeInTheDocument();
  });

  it('jugar mal: mandar otra vez mientras el asistente escribe no cuela un segundo prompt', () => {
    const { container } = abrirLaboratorio();
    escribir('ayuda con el agua');
    fireEvent.click(screen.getByTestId('asis-enviar'));

    // Está tecleando: el compositor entero se bloquea.
    expect(screen.getByTestId('asis-libre')).toBeDisabled();
    const antes = container.querySelectorAll('[data-testid="asis-msg"]').length;
    escribir('otra cosa');
    fireEvent.click(screen.getByTestId('asis-enviar'));
    expect(container.querySelectorAll('[data-testid="asis-msg"]').length).toBe(antes);
    expect(screen.getByTestId('tia-cuaderno').querySelectorAll('li')).toHaveLength(1);
  });

  it('cada encargo tiene su propio guion: el mismo prompt bueno contesta distinto', () => {
    abrirLaboratorio();
    escribirYEnviar(CORTO_Y_BUENO);
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/sale de presas, pozos profundos/);

    fireEvent.click(screen.getByTestId('tia-siguiente'));
    escribirYEnviar(CORTO_Y_BUENO);
    // Segundo encargo, misma calidad, otra respuesta: el guion cambió con él.
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/ENTRADA \(40 s\)/);
  });

  it('recorrido completo: cuatro encargos hasta la pantalla de cierre, y reescribir no cuesta un punto', () => {
    const { onComplete, onScore, onProgress } = abrirLaboratorio();

    for (let i = 0; i < ENCARGOS_PROMPT.length; i += 1) {
      // Se juega mal a propósito en el primero y en el tercero.
      if (i === 0 || i === 2) escribirYEnviar(LARGO_Y_VACIO);
      escribirYEnviar(ENCARGOS_PROMPT[i].ejemplo);
      fireEvent.click(screen.getByTestId('tia-siguiente'));
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);

    expect(screen.getByText('¡Cuatro encargos, y el cuaderno lo demuestra!')).toBeInTheDocument();
    expect(screen.getByText(/Buena preguntadora/)).toBeInTheDocument();
    // Seis prompts escritos: cuatro buenos y dos que no lo eran.
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
