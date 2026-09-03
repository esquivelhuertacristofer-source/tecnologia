/**
 * N5·«Mi huella digital» · «Lo que publico permanece».
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → Tecnia Muro), no una copia
 * de sus datos. Nada de temporizadores (a diferencia de `n4-real-o-generado`,
 * cuyo test SÍ necesita `jest.useFakeTimers`): esta actividad avanza cada
 * paso con un clic explícito en «Continuar», el mismo patrón —y el mismo
 * motivo, accesibilidad y pruebas deterministas— que `n4-si-algo-me-incomoda`.
 *
 * Lo que se cuida aquí:
 *  · La plantilla de oro de la entrada y que el CTA abra Tecnia Muro sin
 *    ningún `<canvas>` ni caja de texto (SIN 3D, el alumno nunca teclea).
 *  · La pregunta espejo aparece ANTES de publicar en las tres publicaciones
 *    de riesgo, y jugar MAL —publicarla de todos modos— NUNCA bloquea el
 *    avance (regla de la casa: sin regañar, sin sustos).
 *  · Elegir "No publicar" cuenta como acierto y esa publicación jamás llega
 *    al Acto 2 ni se puede "borrar" — porque nunca existió.
 *  · El par de tiempo que sostiene la lección central: a los diez segundos
 *    sí se salva, a los tres días ya no — con los mismos textos que ve el
 *    alumno.
 *  · El grupo "privado" de veinte personas, con la frase casi textual del
 *    encargo.
 *  · Las publicaciones buenas en el Acto 2 sólo ofrecen "Dejar en tu muro":
 *    nunca aparece un botón de borrar para ellas.
 *  · Dos recorridos completos —jugando MAL y jugando BIEN a propósito— que
 *    llegan hasta `onComplete` sin romperse y con el puntaje siempre en 100.
 *
 * Sin matchers de `jest-dom` (ni `toBeInTheDocument` ni `toHaveTextContent`):
 * `jest.setup.ts` está fuera de `tsconfig` y esos matchers compilan mal
 * aunque el test pase — el resto del proyecto usa matchers pelados por el
 * mismo motivo.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaLoQuePublicoPermanece } from '@/components/activities/n5/estudio/EntradaLoQuePublicoPermanece';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function montarEntrada() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaLoQuePublicoPermanece config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra a Tecnia Muro (assetsPendientes deja el CTA visible sin arrancar video). */
function abrirMuro() {
  const utils = montarEntrada();
  pulsar(/Abre Tecnia Muro/);
  return utils;
}

/** Publica la publicación actual SIN pregunta espejo (un solo botón) y avanza. */
function publicarSimple() {
  pulsar('Publicar');
  pulsar(/Continuar/);
}

/** Responde la pregunta espejo de la publicación actual y avanza. */
function elegirGate(accion: 'Publicar' | 'No publicar') {
  pulsar(accion);
  pulsar(/Continuar/);
}

/** Decide qué hacer con la publicación actual del Acto 2 y avanza. */
function decidirBorrar(boton: 'Dejar en tu muro' | 'Borrar esta publicación') {
  pulsar(boton);
  pulsar(/Continuar/);
}

/** Responde una pregunta del epílogo y avanza (o termina, en la última). */
function elegirEpilogo(accion: 'Publicar' | 'No publicar') {
  pulsar(accion);
  pulsar(/Continuar|Terminar/);
}

describe('n5-lo-que-publico-permanece · la entrada', () => {
  it('respeta la plantilla de oro y el CTA abre Tecnia Muro', () => {
    montarEntrada();
    expect(screen.getByText('Antes de publicar nada')).not.toBeNull();
    expect(screen.getByText('Borrar quita TU copia')).not.toBeNull();
    expect(screen.getByText('El tiempo importa muchísimo')).not.toBeNull();
    expect(screen.getByText('Lo "privado" no lo es tanto')).not.toBeNull();
    expect(screen.getByText('La pregunta que va ANTES')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Muro')).not.toBeNull();
  });
});

describe('n5-lo-que-publico-permanece · Tecnia Muro', () => {
  it('abre sin 3D ni cajas de texto, con la primera publicación (buena) mostrando un solo botón', () => {
    abrirMuro();
    expect(document.querySelector('canvas')).toBeNull();
    expect(document.querySelectorAll('input, textarea').length).toBe(0);
    expect(screen.getByText('Publicación 1 de 10')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'No publicar' })).toBeNull();
  });

  it('publicar una publicación sin riesgo deja una nota y Continuar avanza a la siguiente', () => {
    abrirMuro();
    pulsar('Publicar');
    expect(screen.getByText(/no tiene nada que esconder/)).not.toBeNull();
    pulsar(/Continuar/);
    expect(screen.getByText('Publicación 2 de 10')).not.toBeNull();
  });

  it('la pregunta espejo aparece ANTES de decidir, y publicar de todos modos (jugar MAL) no bloquea el avance ni baja el puntaje', () => {
    const { onScore } = abrirMuro();
    publicarSimple(); // 1: dibujo
    publicarSimple(); // 2: selfie rápida
    publicarSimple(); // 3: selfie tardía

    // 4: dirección de la casa — publicación de riesgo con pregunta espejo.
    expect(screen.getByText(/pueda ver dónde vivo/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'No publicar' })).not.toBeNull();
    pulsar('Publicar'); // jugar MAL a propósito
    expect(screen.getByText(/la respuesta ya la tenías/)).not.toBeNull();
    pulsar(/Continuar/);
    expect(screen.getByText('Publicación 5 de 10')).not.toBeNull();

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('elegir "No publicar" en una publicación de riesgo se explica como acierto y dice que nunca estuvo ahí', () => {
    abrirMuro();
    publicarSimple(); // 1
    publicarSimple(); // 2
    publicarSimple(); // 3
    publicarSimple(); // 4: dirección (publicada, no es lo que prueba este test)
    // 5: horario solita — otra publicación de riesgo.
    expect(screen.getByText(/a qué hora estoy sola en casa/)).not.toBeNull();
    pulsar('No publicar');
    expect(screen.getByText(/Bien pensado/)).not.toBeNull();
    pulsar(/Continuar/);
    expect(screen.getByText('Publicación 6 de 10')).not.toBeNull();
  });

  it('recorrido completo jugando MAL: publica hasta el dato personal y el grupo "privado", descubre el par del tiempo, y termina con puntaje 100', () => {
    const { onProgress, onScore, onComplete } = abrirMuro();

    // Acto 1 — publica las diez, incluidas las tres de riesgo (jugando MAL).
    publicarSimple(); // dibujo (buena)
    publicarSimple(); // selfie rápida
    publicarSimple(); // selfie tardía
    elegirGate('Publicar'); // dirección — mal
    elegirGate('Publicar'); // horario — mal
    publicarSimple(); // fiesta sorpresa (grupo "privado")
    elegirGate('Publicar'); // burla a un compañero — mal
    publicarSimple(); // ayuda a don Beto (buena)
    publicarSimple(); // comentario amable (buena)
    publicarSimple(); // torneo de ajedrez (buena)

    pulsar(/Abrir tu muro/);
    expect(screen.getByText('Tu muro · 1 de 10')).not.toBeNull();

    // 1) dibujo-dragon: publicación buena — sólo se puede "dejar", nunca borrar.
    expect(screen.queryByRole('button', { name: 'Borrar esta publicación' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Dejar en tu muro' })).not.toBeNull();
    decidirBorrar('Dejar en tu muro');

    // 2) selfie rápida — publicada hace 10 segundos: SÍ se salva.
    expect(screen.getByText('Publicada hace 10 segundos')).not.toBeNull();
    pulsar('Borrar esta publicación');
    expect(screen.getByText(/sí desapareció de verdad/)).not.toBeNull();
    pulsar(/Continuar/);

    // 3) selfie tardía — publicada hace 3 días: ya no se puede.
    expect(screen.getByText('Publicada hace 3 días')).not.toBeNull();
    pulsar('Borrar esta publicación');
    expect(screen.getByText(/aquí ya no/)).not.toBeNull();
    pulsar(/Continuar/);

    // 4) dirección — persiste igual, alguien ya la vio.
    decidirBorrar('Borrar esta publicación');
    // 5) horario — persiste igual, Diego le tomó captura.
    decidirBorrar('Borrar esta publicación');

    // 6) fiesta sorpresa: el grupo "privado" de veinte personas.
    pulsar('Borrar esta publicación');
    expect(screen.getByText(/personas con teléfono y con dedos/)).not.toBeNull();
    pulsar(/Continuar/);

    // 7) burla a Toño: borrar no borra lo que él ya sintió.
    pulsar('Borrar esta publicación');
    expect(screen.getByText(/no borra lo que él ya sintió/)).not.toBeNull();
    pulsar(/Continuar/);

    // 8, 9 y 10: las tres publicaciones buenas restantes.
    decidirBorrar('Dejar en tu muro');
    decidirBorrar('Dejar en tu muro');
    decidirBorrar('Dejar en tu muro');

    pulsar(/Practicar/);

    // Epílogo: falla las tres a propósito (jugar MAL hasta el final).
    elegirEpilogo('Publicar'); // clave del wifi — mal
    elegirEpilogo('No publicar'); // ayudar a la abuela — mal
    elegirEpilogo('Publicar'); // foto de amigos sin preguntar — mal

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 6 });
    expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(1);
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);

    expect(screen.getByText('Ya sabes qué se puede borrar de verdad… y qué no')).not.toBeNull();
    expect(screen.getByText('Tu huella buena')).not.toBeNull();
    expect(screen.getByText('4')).not.toBeNull();
    expect(screen.queryByText(/Lo que nunca tuviste que borrar/)).toBeNull();
  });

  it('recorrido completo jugando BIEN: declina las tres publicaciones de riesgo y nunca llegan al Acto 2', () => {
    const { onComplete } = abrirMuro();

    publicarSimple(); // dibujo
    publicarSimple(); // selfie rápida
    publicarSimple(); // selfie tardía
    elegirGate('No publicar'); // dirección — bien
    elegirGate('No publicar'); // horario — bien
    publicarSimple(); // fiesta sorpresa
    elegirGate('No publicar'); // burla — bien
    publicarSimple(); // ayuda a don Beto
    publicarSimple(); // comentario amable
    publicarSimple(); // torneo de ajedrez

    pulsar(/Abrir tu muro/);
    // Sólo siete publicaciones llegaron al muro: las tres declinadas nunca existieron.
    expect(screen.getByText('Tu muro · 1 de 7')).not.toBeNull();

    decidirBorrar('Dejar en tu muro'); // dibujo
    decidirBorrar('Borrar esta publicación'); // selfie rápida
    decidirBorrar('Borrar esta publicación'); // selfie tardía
    decidirBorrar('Borrar esta publicación'); // fiesta
    decidirBorrar('Dejar en tu muro'); // ayuda vecino
    decidirBorrar('Dejar en tu muro'); // comentario
    decidirBorrar('Dejar en tu muro'); // torneo

    pulsar(/Practicar/);

    // Epílogo: acierta las tres.
    elegirEpilogo('No publicar'); // clave del wifi
    elegirEpilogo('Publicar'); // ayudar a la abuela
    elegirEpilogo('No publicar'); // foto de amigos sin preguntar

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 0 });

    expect(screen.getByText('Lo que nunca tuviste que borrar, porque no lo publicaste')).not.toBeNull();
    expect(screen.getByText(/cuarto en la casa nueva/)).not.toBeNull();
    expect(screen.getByText(/Mi horario de esta semana/)).not.toBeNull();
    expect(screen.getByText(/resbaló Toño/)).not.toBeNull();
    expect(screen.getByText('6/6')).not.toBeNull();
  });
});
