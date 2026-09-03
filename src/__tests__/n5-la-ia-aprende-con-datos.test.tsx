/**
 * N5 · «IA a mi alcance», parada 2 · `n5-la-ia-aprende-con-datos`.
 *
 * **La clase que junta los dos motores de IA**, así que estas pruebas miran
 * las dos junturas:
 *
 *  · el CLASIFICADOR dice la verdad sobre el banco — el fallo que anuncia
 *    `informeDe().ciegos` es el que de verdad ocurre, y añadir la ficha que
 *    faltaba lo cura;
 *  · el ASISTENTE lo cuenta con el id que fabricó el clasificador, no con uno
 *    inventado por la clase.
 *
 * Y se juega MAL a propósito: entrenar sin etiquetar, etiquetarlo todo igual,
 * mandar dos mensajes mientras el asistente escribe, y arreglar la máquina con
 * las fichas equivocadas antes de dar con la buena.
 *
 * Dos de las doce son recorridos completos hasta `onComplete` —uno jugando
 * bien y otro jugando mal—, que es lo único que caza que una clase se ha
 * quedado imposible de terminar.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaLaIaAprendeConDatos } from '@/components/activities/ia/EntradaLaIaAprendeConDatos';
import {
  candidataComoEjemplo,
  comoEjemplo,
  CANDIDATAS_A,
  CANDIDATAS_B,
  EJEMPLOS_DE_PRUEBA,
  ESQUEMA,
  FICHAS,
  GATO,
  PRUEBAS,
  RONDAS,
} from '@/components/activities/ia/bancoMascotas';
import { FICHAS_CONTESTADAS, GUION } from '@/components/activities/ia/guionAprendeConDatos';
import { RUTA_N5_IA_A_MI_ALCANCE } from '@/components/activities/ia/rutasIA';
import { validarGuion } from '@/components/simuladores/asistente';
import {
  brechaDe,
  entrenar,
  evaluar,
  examinar,
  informeDe,
  predecir,
  senalesDe,
  type Ejemplo,
} from '@/components/simuladores/aprendizaje';
import { CURRICULO } from '@/data/curriculo';

/* ── El banco bien etiquetado, para las pruebas de motor puro ─────────────── */

const BANCO: Ejemplo[] = FICHAS.map((f) => comoEjemplo(f, f.verdad));
const GATO_NEGRO = PRUEBAS.find((p) => p.id === 't3')!;
const PERRO_GRIS = PRUEBAS.find((p) => p.id === 't4')!;
const rasgosDe = (p: typeof GATO_NEGRO) => ({ color: p.color, orejas: p.orejas, cola: p.cola });

/* ── Manejo de la pantalla ────────────────────────────────────────────────── */

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaLaIaAprendeConDatos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre });

/** El alumno impaciente: si el asistente está tecleando, se lo salta. */
function saltarSiTeclea() {
  const saltar = screen.queryByTestId('asis-saltar');
  if (saltar) fireEvent.click(saltar);
}

/** Entra: CTA de la entrada + portada de objetivos. */
function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(boton(/Abre Tecnia Entrena/));
  fireEvent.click(screen.getByTestId('tia-empezar'));
  return utils;
}

/** Etiqueta las ocho fichas. `mal` las pone todas como gato. */
function etiquetarTodo(container: HTMLElement, mal = false) {
  for (const f of FICHAS) {
    const tarjeta = container.querySelector(`[data-ficha="${f.id}"]`) as HTMLElement;
    fireEvent.click(within(tarjeta).getByRole('button', { name: mal ? GATO : f.verdad }));
  }
}

/** Entrena, pide el aviso del punto ciego y entra a probar. */
function entrenarYProbar() {
  fireEvent.click(screen.getByTestId('tia-entrenar'));
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId('tia-aviso'));
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId('tia-probar'));
}

/** Las cuatro pruebas, preguntando por qué en cada una. */
function probarLasCuatro() {
  for (let i = 0; i < PRUEBAS.length; i += 1) {
    fireEvent.click(screen.getByTestId('tia-preguntar'));
    const pregunta = document.querySelector('.asis-ficha') as HTMLElement | null;
    if (pregunta) {
      fireEvent.click(pregunta);
      saltarSiTeclea();
    }
    fireEvent.click(screen.getByTestId('tia-siguiente'));
  }
  fireEvent.click(screen.getByTestId('tia-arreglar'));
}

/** Pone una candidata en la mesa y espera a que el chat termine. */
function ponerCandidata(id: string) {
  fireEvent.click(document.querySelector(`[data-candidata="${id}"]`) as HTMLElement);
  saltarSiTeclea();
}

/* ══════════════════════════════════════════════════════════════════════════ */

describe('n5-la-ia-aprende-con-datos', () => {
  it('vive donde dice el currículo: N5, 5.º de primaria, 10–11 años, eje datos-ia', () => {
    const n5 = CURRICULO.find((n) => n.n === 5)!;
    expect(n5.grado).toBe('5° de Primaria');
    expect(n5.edad).toBe('10–11');
    const unidad = n5.unidades.find((u) => u.id === 'n5-ia-a-mi-alcance')!;
    expect(unidad.eje).toBe('datos-ia');
    expect(unidad.actividades.find((a) => a.id === 'n5-la-ia-aprende-con-datos')).toBeDefined();
    // La ruta que ve el alumno en la entrada no puede inventarse paradas.
    expect(RUTA_N5_IA_A_MI_ALCANCE.map((p) => p.id)).toEqual(unidad.actividades.map((a) => a.id));
    expect(RUTA_N5_IA_A_MI_ALCANCE.map((p) => p.titulo)).toEqual(unidad.actividades.map((a) => a.titulo));
  });

  it('la entrada habla de ESTA clase y el laboratorio abre con la portada de objetivos', () => {
    const { container } = montar();
    // Nada de un port que sólo cambia el import: los textos son suyos.
    expect(screen.getByText(/El club de mascotas quiere una app/)).toBeInTheDocument();
    expect(screen.getByText('Falla justo donde le faltó')).toBeInTheDocument();
    expect(screen.getByText('Estar segura no es tener razón')).toBeInTheDocument();
    expect(screen.getByText('La IA aprende con datos')).toBeInTheDocument();

    fireEvent.click(boton(/Abre Tecnia Entrena/));
    // Entrar sin saber el tema ni el objetivo está declarado defecto.
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('La IA aprende con datos')).toBeInTheDocument();
    expect(within(portada).getByText(/Al terminar/)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="tia-mesa"]')).toBeNull();

    fireEvent.click(screen.getByTestId('tia-empezar'));
    expect(screen.getByTestId('tia-mesa')).toBeInTheDocument();
  });

  it('el guion está sano y contesta a TODA señal del camino canónico', () => {
    expect(validarGuion(GUION)).toEqual([]);

    const modelo = entrenar(ESQUEMA, BANCO);
    const senales = senalesDe({
      auditoria: examinar(ESQUEMA, BANCO),
      informe: informeDe(modelo),
    });
    // La junta: los ids los fabrica el clasificador, no esta clase.
    expect(senales.map((s) => s.id)).toContain('ciego:n0/color=gris');
    expect(senales.map((s) => s.id)).toContain('hueco:color=negro/gato');
    for (const s of senales) {
      expect(FICHAS_CONTESTADAS.has(s.id)).toBe(true);
    }
  });

  it('el fallo que ANUNCIA informeDe().ciegos es el que de verdad ocurre', () => {
    const modelo = entrenar(ESQUEMA, BANCO);
    const informe = informeDe(modelo);

    // Antes de probar nada, el motor dice por dónde se va a romper.
    expect(informe.ciegos).toHaveLength(1);
    const ciego = informe.ciegos[0];
    expect(ciego).toMatchObject({ nodo: 'n0', rasgo: 'color', valor: 'gris', contestaria: GATO });

    // Y al probar, pasa exactamente eso.
    const p = predecir(modelo, rasgosDe(PERRO_GRIS));
    expect(p.motivo).toBe('valor-no-visto');
    expect(p.atascoEn).toMatchObject({ rasgo: 'color', valor: 'gris' });
    expect(p.etiqueta).toBe(ciego.contestaria);
    expect(p.etiqueta).not.toBe(PERRO_GRIS.verdad);

    // Y el otro fallo, el de la clase: seguro y equivocado.
    const q = predecir(modelo, rasgosDe(GATO_NEGRO));
    expect(q.etiqueta).toBe('perro');
    expect(q.confianza).toBe(1);
    expect(q.motivo).toBe('hoja');

    // Se agarró del color y ni miró la cola: eso se enseña en pantalla.
    expect(informe.rasgosUsados).toEqual(['color', 'orejas']);
    expect(informe.rasgosIgnorados).toEqual(['cola']);

    // Y el 50 % de la nota general esconde dos ceros: el sesgo va por grupos.
    const examen = evaluar(modelo, EJEMPLOS_DE_PRUEBA);
    expect(examen.acierto).toBe(0.5);
    expect(brechaDe(examen, 'color').diferencia).toBe(1);
  });

  it('añadir la ficha que faltaba lo cura, y las ocho candidatas dicen la verdad', () => {
    const cura = CANDIDATAS_A.find((c) => c.id === 'a2')!;
    const conGatoNegro = entrenar(ESQUEMA, [...BANCO, candidataComoEjemplo(cura)]);
    const curado = predecir(conGatoNegro, rasgosDe(GATO_NEGRO));
    expect(curado.etiqueta).toBe(GATO_NEGRO.verdad);
    expect(curado.confianza).toBe(1);

    const curaB = CANDIDATAS_B.find((c) => c.id === 'b2')!;
    const conLasDos = entrenar(ESQUEMA, [
      ...BANCO,
      candidataComoEjemplo(cura),
      candidataComoEjemplo(curaB),
    ]);
    expect(predecir(conLasDos, rasgosDe(PERRO_GRIS)).etiqueta).toBe(PERRO_GRIS.verdad);
    // Ya no le queda ni un punto ciego de color, y acierta las cuatro.
    expect(informeDe(conLasDos).ciegos).toEqual([]);
    for (const p of PRUEBAS) {
      expect(predecir(conLasDos, rasgosDe(p)).etiqueta).toBe(p.verdad);
    }

    // El campo `cura` del material no puede mentir: se mide con el motor.
    for (const ronda of RONDAS) {
      const objetivo = PRUEBAS.find((p) => p.id === ronda.pruebaId)!;
      const base = ronda.pruebaId === 't4' ? [...BANCO, candidataComoEjemplo(cura)] : BANCO;
      for (const c of ronda.candidatas) {
        const m = entrenar(ESQUEMA, [...base, candidataComoEjemplo(c)]);
        expect(predecir(m, rasgosDe(objetivo)).etiqueta === objetivo.verdad).toBe(c.cura);
      }
    }

    // El remate de la clase: el gato gris quita el atasco y DEJA el error.
    const gatoGris = CANDIDATAS_B.find((c) => c.id === 'b3')!;
    const conGatoGris = entrenar(ESQUEMA, [
      ...BANCO,
      candidataComoEjemplo(cura),
      candidataComoEjemplo(gatoGris),
    ]);
    const p = predecir(conGatoGris, rasgosDe(PERRO_GRIS));
    expect(p.motivo).toBe('hoja'); // ya no se atasca…
    expect(p.etiqueta).not.toBe(PERRO_GRIS.verdad); // …y aun así se equivoca
    expect(p.confianza).toBe(1); // con toda la seguridad del mundo
  });

  it('jugar mal: no se puede entrenar sin las ocho fichas etiquetadas', () => {
    const { container } = abrirLaboratorio();
    expect(screen.getByTestId('tia-entrenar')).toBeDisabled();

    const tarjeta = container.querySelector('[data-ficha="f1"]') as HTMLElement;
    fireEvent.click(within(tarjeta).getByRole('button', { name: GATO }));
    expect(screen.getByTestId('tia-entrenar')).toBeDisabled();

    etiquetarTodo(container);
    expect(screen.getByTestId('tia-entrenar')).toBeEnabled();
  });

  it('jugar mal: etiquetarlo TODO como gato — la máquina lo dice y la clase sigue jugable', () => {
    const { container } = abrirLaboratorio();
    etiquetarTodo(container, true);
    fireEvent.click(screen.getByTestId('tia-entrenar'));
    saltarSiTeclea();

    // Un solo montón: el árbol es una hoja y no hay ninguna pregunta.
    expect(screen.getByTestId('tia-arbol').textContent).toMatch(/digo gato/);

    fireEvent.click(screen.getByTestId('tia-aviso'));
    saltarSiTeclea();
    // El asistente no regaña: cuenta lo que le pasa a ella.
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/hasta a un elefante/);

    // Y se puede seguir jugando: la clase no se atranca por etiquetar mal.
    fireEvent.click(screen.getByTestId('tia-probar'));
    fireEvent.click(screen.getByTestId('tia-preguntar'));
    expect(screen.getByTestId('tia-veredicto')).toBeInTheDocument();
  });

  it('jugar mal: dos mensajes seguidos mientras escribe — sólo entra uno', () => {
    const { container } = abrirLaboratorio();
    etiquetarTodo(container);
    fireEvent.click(screen.getByTestId('tia-entrenar'));

    // Está tecleando: el botón que habla se apaga en vez de tragarse el aviso.
    expect(screen.getByTestId('tia-aviso')).toBeDisabled();
    const mensajes = () => container.querySelectorAll('[data-testid="asis-msg"]').length;
    const antes = mensajes();
    fireEvent.click(screen.getByTestId('tia-aviso'));
    expect(mensajes()).toBe(antes);

    // Y en cuanto termina de escribir, el aviso sí entra.
    saltarSiTeclea();
    expect(screen.getByTestId('tia-aviso')).toBeEnabled();
    fireEvent.click(screen.getByTestId('tia-aviso'));
    saltarSiTeclea();
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/no tengo ni una ficha gris/);
  });

  it('el chat cuenta el fallo del gato negro con el id que fabricó el clasificador', () => {
    const { container } = abrirLaboratorio();
    etiquetarTodo(container);
    entrenarYProbar();

    // Las dos primeras las acierta; la tercera es el momento de la clase.
    for (let i = 0; i < 2; i += 1) {
      fireEvent.click(screen.getByTestId('tia-preguntar'));
      fireEvent.click(screen.getByTestId('tia-siguiente'));
    }
    fireEvent.click(screen.getByTestId('tia-preguntar'));

    const veredicto = screen.getByTestId('tia-veredicto');
    expect(veredicto.textContent).toMatch(/La máquina dice:\s*perro/);
    expect(veredicto.textContent).toMatch(/Seguridad:\s*100 %/);
    expect(veredicto.textContent).toMatch(/Sombra es un gato/);

    // La ficha que se ofrece lleva por debajo el id del motor.
    const ficha = container.querySelector('.asis-ficha') as HTMLElement;
    expect(ficha.getAttribute('data-ficha')).toBe('hueco:color=negro/gato');
    fireEvent.click(ficha);
    saltarSiTeclea();
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/las tres eran perros/);
  });

  it('el atasco del perro gris se ve en pantalla y el asistente lo explica', () => {
    const { container } = abrirLaboratorio();
    etiquetarTodo(container);
    entrenarYProbar();
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByTestId('tia-preguntar'));
      fireEvent.click(screen.getByTestId('tia-siguiente'));
    }
    fireEvent.click(screen.getByTestId('tia-preguntar'));

    const veredicto = screen.getByTestId('tia-veredicto');
    expect(veredicto.textContent).toMatch(/se atascó/);
    expect(veredicto.textContent).toMatch(/Seguridad:\s*50 %/);

    const ficha = container.querySelector('.asis-ficha') as HTMLElement;
    expect(ficha.getAttribute('data-ficha')).toBe('valor-no-visto:color=gris');

    // Y el boletín por colores enseña el 0 % que la nota general tapaba.
    fireEvent.click(screen.getByTestId('tia-siguiente'));
    const boletin = screen.getByTestId('tia-boletin');
    expect(boletin.querySelectorAll('.es-cero')).toHaveLength(2);
  });

  it('recorrido completo jugando BIEN: llega a la pantalla de cierre con 100', () => {
    const { container, onComplete, onScore, onProgress } = abrirLaboratorio();
    etiquetarTodo(container);
    entrenarYProbar();
    probarLasCuatro();

    ponerCandidata('a2');
    fireEvent.click(screen.getByTestId('tia-cerrar-ronda'));
    ponerCandidata('b2');
    fireEvent.click(screen.getByTestId('tia-cerrar-ronda'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);

    // La pantalla de cierre, con su insignia y sus cuatro aciertos.
    expect(screen.getByText('¡La arreglaste tú!')).toBeInTheDocument();
    expect(screen.getByText(/Entrenadora de máquinas/)).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('recorrido completo jugando MAL: fichas equivocadas primero, y aun así se termina sin perder un punto', () => {
    const { container, onComplete, onScore } = abrirLaboratorio();
    etiquetarTodo(container);
    entrenarYProbar();
    probarLasCuatro();

    // Ronda A con las tres que no curan, una por una.
    for (const id of ['a1', 'a3', 'a4']) {
      ponerCandidata(id);
      expect(screen.getByTestId('tia-veredicto').textContent).toMatch(/ahora dice:\s*perro/);
      fireEvent.click(screen.getByTestId('tia-quitar'));
    }
    ponerCandidata('a2');
    fireEvent.click(screen.getByTestId('tia-cerrar-ronda'));

    // Ronda B: el gato gris quita el atasco y deja el error. Y no se castiga.
    ponerCandidata('b3');
    expect(screen.getByTestId('tia-veredicto').textContent).toMatch(/ahora dice:\s*gato/);
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/no dudo y me equivoco igual/);
    fireEvent.click(screen.getByTestId('tia-quitar'));
    ponerCandidata('b2');
    fireEvent.click(screen.getByTestId('tia-cerrar-ronda'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].score).toBe(100);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);
  });
});
