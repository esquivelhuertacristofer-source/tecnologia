/**
 * N5 · «IA a mi alcance», parada 1 · `n5-la-ia-en-mi-vida`.
 *
 * Lo que hay que cuidar aquí no se parece a lo de sus dos hermanas: esta clase
 * no entrena nada (eso es la parada 2) y no da ni un dato personal (eso es la
 * parada 3). Lo que se mide es **que el criterio se descubra y no se regale**:
 *
 *  · que la pregunta buena **se calcule** contra la pizarra del alumno y no
 *    esté escrita a mano en ningún sitio;
 *  · que las tres malas se caigan **con el contraejemplo de esa misma
 *    pizarra**, y por los dos motivos distintos (el intruso y el ausente);
 *  · que la corazonada **no reste**, y que el radar **sí**;
 *  · que la pizarra **sólo crezca**: ningún encargo posterior deshace lo que
 *    el alumno descubrió en uno anterior.
 *
 * Se juega mal a propósito: preguntar antes de apostar, cambiar la apuesta
 * cuando el aparato ya habló, probar las cuatro preguntas del alto, colocar en
 * la bandeja equivocada una y otra vez, y terminar la clase habiendo fallado
 * todas las corazonadas.
 *
 * Dos de las pruebas son recorridos completos hasta `onComplete`: el del que
 * falla la mitad de las corazonadas —que **saca 100 igual**— y el del que se
 * equivoca con el radar ya en la mano, que sí paga.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaLaIaEnMiVida } from '@/components/activities/ia/EntradaLaIaEnMiVida';
import {
  CASOS_CORAZONADA,
  CASOS_RADAR,
  CRITERIOS,
  F_RADAR,
  GUION_MI_VIDA,
  PENALIZACION,
  TOTAL_PASOS,
  criterioQueSepara,
  motivoDelFallo,
  probarCriterio,
} from '@/components/activities/ia/casosDelDia';
import { RUTA_N5_IA_A_MI_ALCANCE } from '@/components/activities/ia/rutasIA';
import { resolverGuion, validarGuion } from '@/components/simuladores/asistente';
import { CURRICULO } from '@/data/curriculo';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaLaIaEnMiVida config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const pieza = (selector: string) => document.querySelector(selector) as HTMLElement;

function saltarSiTeclea() {
  const saltar = screen.queryByTestId('asis-saltar');
  if (saltar) fireEvent.click(saltar);
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Asistente/ }));
  fireEvent.click(screen.getByTestId('tia-empezar'));
  return utils;
}

/** Apuesta, deja que el aparato cuente su historia y pasa al siguiente. */
function corazonada(creoQueSi: boolean) {
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId(creoQueSi ? 'tvida-si' : 'tvida-no'));
  fireEvent.click(screen.getByTestId('tvida-preguntar'));
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId('tvida-seguir'));
}

/** Prueba una de las cuatro preguntas candidatas del alto. */
function probarPregunta(id: string) {
  saltarSiTeclea();
  fireEvent.click(pieza(`[data-criterio="${id}"]`));
  saltarSiTeclea();
}

/** Coloca el aparato del acto 3 en una de las dos bandejas. */
function colocar(lado: 'ia' | 'regla') {
  saltarSiTeclea();
  fireEvent.click(pieza(`[data-bandeja="${lado}"]`));
  saltarSiTeclea();
}

const tarjetas = () => screen.getByTestId('tvida-pizarra').querySelectorAll('li');

/** La partida entera. `apuestas` son las corazonadas del acto 1, en orden. */
function jugarEntera(apuestas: boolean[]) {
  const utils = abrirLaboratorio();
  for (const a of apuestas) corazonada(a);
  probarPregunta('aprende');
  fireEvent.click(screen.getByTestId('tvida-empezar-radar'));
  for (const caso of CASOS_RADAR) {
    colocar(caso.esIa ? 'ia' : 'regla');
    fireEvent.click(screen.getByTestId('tvida-seguir'));
  }
  return utils;
}

describe('n5-la-ia-en-mi-vida', () => {
  it('vive donde dice el currículo: N5, 10–11 años, y es la parada 1 de su unidad', () => {
    const n5 = CURRICULO.find((n) => n.n === 5)!;
    expect(n5.edad).toBe('10–11');
    const unidad = n5.unidades.find((u) => u.id === 'n5-ia-a-mi-alcance')!;
    expect(unidad.actividades[0].id).toBe('n5-la-ia-en-mi-vida');
    expect(unidad.temas[0]).toBe('Qué es la IA y dónde la uso a diario');
    expect(RUTA_N5_IA_A_MI_ALCANCE[0].titulo).toBe(unidad.actividades[0].titulo);
    expect(TOTAL_PASOS).toBe(CASOS_CORAZONADA.length + 1 + CASOS_RADAR.length);
  });

  it('los ocho aparatos son coherentes: `aprende` está si y sólo si es IA, y hay mitad y mitad', () => {
    const todos = [...CASOS_CORAZONADA, ...CASOS_RADAR];
    for (const c of todos) {
      expect(c.rasgos.includes('aprende')).toBe(c.esIa);
    }
    expect(todos.filter((c) => c.esIa)).toHaveLength(4);
    expect(new Set(todos.map((c) => c.id)).size).toBe(todos.length);
    // Ni un caso enseña su verdad en el texto que el alumno lee antes de apostar.
    for (const c of todos) {
      expect(`${c.nombre} ${c.situacion}`.toLowerCase()).not.toMatch(/inteligencia artificial|\bes ia\b/);
    }
  });

  it('la pregunta del radar se CALCULA contra la pizarra, y sólo una separa', () => {
    const separan = CRITERIOS.filter((k) => probarCriterio(k.id, CASOS_CORAZONADA).separa);
    expect(separan).toHaveLength(1);
    expect(separan[0].id).toBe('aprende');
    expect(criterioQueSepara(CASOS_CORAZONADA)!.id).toBe('aprende');
  });

  it('las tres malas se caen por los DOS motivos distintos, cada una con su contraejemplo', () => {
    // El intruso: algo que no es IA se cuela por la puerta.
    const pantalla = probarCriterio('pantalla', CASOS_CORAZONADA);
    expect(pantalla.separa).toBe(false);
    expect(pantalla.intruso!.id).toBe('c-alarma');
    expect(motivoDelFallo(CRITERIOS[0], pantalla)).toMatch(/se te cuela/);

    const dificil = probarCriterio('dificil', CASOS_CORAZONADA);
    expect(dificil.separa).toBe(false);
    expect(dificil.intruso!.id).toBe('c-calculadora');

    // El ausente: una IA de verdad se escapa. Es el que corrige «IA = habla».
    const voz = probarCriterio('voz', CASOS_CORAZONADA);
    expect(voz.separa).toBe(false);
    expect(voz.intruso).toBeNull();
    expect(voz.ausente!.id).toBe('c-teclado');
    expect(motivoDelFallo(CRITERIOS[1], voz)).toMatch(/se te escapa/);
  });

  it('el guion está sano y todos los aparatos tienen quien cuente su historia', () => {
    expect(validarGuion(GUION_MI_VIDA)).toEqual([]);
    for (const c of [...CASOS_CORAZONADA, ...CASOS_RADAR]) {
      const { respuesta, porDefecto } = resolverGuion(GUION_MI_VIDA, { ficha: c.id });
      expect(porDefecto).toBe(false);
      expect(respuesta.id).toBe(c.cuenta);
      // Ningún aparato habla en primera persona: no hay robot con cara (§29).
      expect(respuesta.texto ?? '').not.toMatch(/^Soy /);
    }
    expect(resolverGuion(GUION_MI_VIDA, { ficha: F_RADAR }).porDefecto).toBe(false);
  });

  it('la entrada es suya y el laboratorio abre con la portada de objetivos', () => {
    montar();
    expect(screen.getByText('Listo no quiere decir IA')).toBeInTheDocument();
    expect(screen.getByText('Y tonto no quiere decir que no lo sea')).toBeInTheDocument();
    expect(screen.getByText('Ya la usas, y no lo sabías')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Asistente/ }));
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('La IA en mi vida diaria')).toBeInTheDocument();
    expect(within(portada).getByText(/Al terminar/)).toBeInTheDocument();
    expect(within(portada).getByText(/Radar de IA/)).toBeInTheDocument();
    expect(screen.queryByTestId('tvida-mesa')).toBeNull();
  });

  it('acto 1: no se puede preguntar sin apostar, y el aparato cuenta su historia después', () => {
    abrirLaboratorio();
    expect(screen.getByTestId('tvida-caso').getAttribute('data-caso')).toBe('c-alarma');
    expect(screen.getByTestId('tvida-pizarra').textContent).toMatch(/Todavía no has apostado/);
    // La apuesta va PRIMERO: si no, no habría apuesta, habría dictado.
    expect(screen.getByTestId('tvida-preguntar')).toBeDisabled();

    fireEvent.click(screen.getByTestId('tvida-si'));
    expect(screen.getByTestId('tvida-preguntar')).toBeEnabled();
    fireEvent.click(screen.getByTestId('tvida-preguntar'));
    saltarSiTeclea();

    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/si el reloj marca la hora que pusiste/);
    expect(tarjetas()).toHaveLength(1);
    expect(tarjetas()[0].textContent).toMatch(/te sorprendió/);
  });

  it('jugar mal: cuando el aparato ya habló, la apuesta se queda como estaba', () => {
    abrirLaboratorio();
    fireEvent.click(screen.getByTestId('tvida-no'));
    fireEvent.click(screen.getByTestId('tvida-preguntar'));
    saltarSiTeclea();

    expect(screen.getByTestId('tvida-si')).toBeDisabled();
    fireEvent.click(screen.getByTestId('tvida-si'));
    // La alarma no es IA: decir «no» fue acertar, y nadie puede reescribirlo.
    expect(tarjetas()[0].textContent).toMatch(/le atinaste/);
    expect(tarjetas()).toHaveLength(1);
  });

  it('acto 2: probar una pregunta mala la tacha con su contraejemplo, no abre el radar y no resta', () => {
    const { onScore } = abrirLaboratorio();
    for (const c of CASOS_CORAZONADA) corazonada(c.esIa);
    expect(screen.getByTestId('tvida-mesa').textContent).toMatch(/La pregunta que los separa/);
    expect(tarjetas()).toHaveLength(CASOS_CORAZONADA.length);

    probarPregunta('pantalla');
    expect(pieza('[data-criterio="pantalla"]').className).toMatch(/es-caida/);
    expect(pieza('[data-criterio="pantalla"]').textContent).toMatch(/La alarma del celular también contesta que sí/);
    expect(screen.queryByTestId('tvida-empezar-radar')).toBeNull();

    probarPregunta('voz');
    expect(pieza('[data-criterio="voz"]').textContent).toMatch(/El teclado que adivina la palabra contesta que no/);

    probarPregunta('dificil');
    expect(pieza('[data-criterio="dificil"]').textContent).toMatch(/La calculadora también contesta que sí/);

    // Equivocarse buscando el criterio NO cuesta puntos: es el experimento.
    expect(onScore.mock.calls.every((c) => c[0] === 100)).toBe(true);

    probarPregunta('aprende');
    expect(pieza('[data-criterio="aprende"]').className).toMatch(/es-buena/);
    expect(screen.getByTestId('tvida-empezar-radar')).toBeInTheDocument();
    // Y las tres tachadas siguen tachadas: nada de lo descubierto se deshace.
    expect(document.querySelectorAll('.tvida-pregunta.es-caida')).toHaveLength(3);
  });

  it('acto 3: el radar queda escrito arriba y fallar cuesta seis puntos, pero se puede reintentar', () => {
    const { onScore } = abrirLaboratorio();
    for (const c of CASOS_CORAZONADA) corazonada(c.esIa);
    probarPregunta('aprende');
    fireEvent.click(screen.getByTestId('tvida-empezar-radar'));

    expect(screen.getByTestId('tvida-radar').textContent).toMatch(/Aprendió mirando montones de ejemplos/);
    expect(screen.getByTestId('tvida-caso').getAttribute('data-caso')).toBe('c-videos');
    const antes = tarjetas().length;

    // La lista de videos SÍ es IA: mandarla a «le escribieron los pasos» falla.
    colocar('regla');
    expect(screen.getByTestId('tvida-pista')).toBeInTheDocument();
    expect(onScore.mock.calls[onScore.mock.calls.length - 1][0]).toBe(100 - PENALIZACION);
    // Fallar no coloca nada ni borra nada de lo que ya había.
    expect(tarjetas()).toHaveLength(antes);
    expect(screen.queryByTestId('tvida-seguir')).toBeNull();

    // Y se puede volver a intentar hasta acertar.
    colocar('ia');
    expect(screen.queryByTestId('tvida-pista')).toBeNull();
    expect(tarjetas()).toHaveLength(antes + 1);
    expect(screen.getByTestId('tvida-seguir')).toBeInTheDocument();
  });

  it('recorrido completo fallando TODAS las corazonadas: termina y saca 100 igual', () => {
    // Apuesta lo contrario de la verdad en los cuatro. La corazonada no puntúa.
    const { onComplete, onScore, onProgress } = jugarEntera(CASOS_CORAZONADA.map((c) => !c.esIa));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].score).toBe(100);
    expect(onComplete.mock.calls[0][0].stars).toBe(3);
    expect(onComplete.mock.calls[0][0].errores).toBe(0);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);

    expect(screen.getByText('¡Radar perfecto! Los cuatro de la tarde, a la primera')).toBeInTheDocument();
    expect(screen.getByText(/Radar de IA/)).toBeInTheDocument();
    expect(screen.getByText(/4 te sorprendieron/)).toBeInTheDocument();
  });

  it('recorrido completo con el radar mal usado: termina, y ahí sí paga', () => {
    const { onComplete } = abrirLaboratorio();
    for (const c of CASOS_CORAZONADA) corazonada(c.esIa);
    probarPregunta('aprende');
    fireEvent.click(screen.getByTestId('tvida-empezar-radar'));

    for (const caso of CASOS_RADAR) {
      colocar(caso.esIa ? 'regla' : 'ia'); // al revés a propósito
      colocar(caso.esIa ? 'ia' : 'regla');
      fireEvent.click(screen.getByTestId('tvida-seguir'));
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].errores).toBe(CASOS_RADAR.length);
    expect(onComplete.mock.calls[0][0].score).toBe(100 - CASOS_RADAR.length * PENALIZACION);
    expect(screen.getByText('Radar puesto. Ya reconoces una IA sin abrirla')).toBeInTheDocument();
  });

  it('jugar mal: aporrear la bandeja equivocada diez veces cuesta UN error, no diez', () => {
    const { onScore } = abrirLaboratorio();
    for (const c of CASOS_CORAZONADA) corazonada(c.esIa);
    probarPregunta('aprende');
    fireEvent.click(screen.getByTestId('tvida-empezar-radar'));

    // Bandejas hay dos: el segundo clic equivocado es el mismo clic repetido.
    for (let i = 0; i < 10; i += 1) colocar('regla');
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100 - PENALIZACION);
    expect(screen.getByTestId('tvida-pista')).toBeInTheDocument();

    // Y el siguiente aparato empieza con la cuenta a cero otra vez.
    colocar('ia');
    fireEvent.click(screen.getByTestId('tvida-seguir'));
    colocar(CASOS_RADAR[1].esIa ? 'ia' : 'regla');
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100 - PENALIZACION);
  });

  it('«Jugar otra vez» deja la mesa como al principio, y la partida se puede volver a terminar', () => {
    const { onComplete, onProgress } = jugarEntera(CASOS_CORAZONADA.map((c) => c.esIa));
    fireEvent.click(screen.getByRole('button', { name: /Jugar otra vez/ }));

    expect(screen.getByTestId('tvida-pizarra').textContent).toMatch(/Todavía no has apostado/);
    expect(screen.getByTestId('tvida-caso').getAttribute('data-caso')).toBe('c-alarma');
    expect(screen.getByTestId('tvida-preguntar')).toBeDisabled();
    expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(0);

    for (const c of CASOS_CORAZONADA) corazonada(c.esIa);
    probarPregunta('aprende');
    fireEvent.click(screen.getByTestId('tvida-empezar-radar'));
    for (const caso of CASOS_RADAR) {
      colocar(caso.esIa ? 'ia' : 'regla');
      fireEvent.click(screen.getByTestId('tvida-seguir'));
    }
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete.mock.calls[1][0].score).toBe(100);
  });

  it('la pizarra sólo crece: los ocho aparatos siguen ahí al final, y con su historia', () => {
    abrirLaboratorio();
    const cuentas: number[] = [];
    for (const c of CASOS_CORAZONADA) {
      corazonada(c.esIa);
      cuentas.push(tarjetas().length);
    }
    probarPregunta('pantalla');
    cuentas.push(tarjetas().length);
    probarPregunta('aprende');
    fireEvent.click(screen.getByTestId('tvida-empezar-radar'));
    cuentas.push(tarjetas().length);

    for (const caso of CASOS_RADAR) {
      colocar(caso.esIa ? 'ia' : 'regla');
      cuentas.push(tarjetas().length);
      if (caso !== CASOS_RADAR[CASOS_RADAR.length - 1]) {
        fireEvent.click(screen.getByTestId('tvida-seguir'));
      }
    }

    // Monótona: ni el alto ni el radar quitan nada de lo ya descubierto.
    for (let i = 1; i < cuentas.length; i += 1) expect(cuentas[i]).toBeGreaterThanOrEqual(cuentas[i - 1]);
    expect(cuentas[cuentas.length - 1]).toBe(CASOS_CORAZONADA.length + CASOS_RADAR.length);
    expect(screen.getByTestId('tvida-pizarra').textContent).toMatch(/repite una frase que alguien le escribió/);
    expect(screen.getByTestId('tvida-pizarra').textContent).toMatch(/escuchando miles de voces distintas/);
  });
});
