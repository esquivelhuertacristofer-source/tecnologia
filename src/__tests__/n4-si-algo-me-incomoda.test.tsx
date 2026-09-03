/**
 * N4·U6 parada 3 · «Si algo me incomoda en línea».
 *
 * Es la actividad más delicada del nivel, así que estas pruebas no se
 * conforman con que monte: recorren conversaciones enteras con el DOM en la
 * mano, y la mitad de ellas juegan MAL a propósito —callarse, contestarle a
 * un desconocido, borrar la prueba antes de contarlo— porque «aquí no se
 * pierde» sólo es cierto si elegir mal no rompe nada y deja volver a
 * intentarlo. El recorrido de principio a fin (última prueba) es el que caza
 * que la clase se haya quedado imposible de terminar.
 *
 * Sin matchers de `jest-dom` —ni `toBeInTheDocument` ni `toHaveTextContent`—:
 * `jest.setup.ts` está en el `exclude` del tsconfig, así que su augmentación
 * de tipos nunca llega a `tsc` y esos matchers compilan mal aunque el test
 * pase. Las 47 suites del proyecto usan matchers pelados por ese mismo motivo.
 *
 * Nada de temporizadores: a diferencia de sus hermanas de N4·Estudio, esta
 * actividad no encadena ningún `setTimeout` para avanzar de pantalla —cada
 * decisión resuelve en el mismo click—, así que no hace falta `jest.
 * useFakeTimers()` ni avanzar el reloj en ningún momento.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaSiAlgoMeIncomoda } from '@/components/activities/n4/estudio/EntradaSiAlgoMeIncomoda';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));
const abrirContacto = (nombre: string) => pulsar(`Abrir conversación con ${nombre}`);
const ultimo = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0];

/** Monta la entrada y entra directo a Tecnia Mensajes (sin video que arrancar). */
function abrirMensajes() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const { container } = render(
    <EntradaSiAlgoMeIncomoda config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  pulsar(/Abre Tecnia Mensajes/);
  return { container, onProgress, onScore, onComplete };
}

/* ── fast-forward por las cinco conversaciones, siempre acertando a la
   primera: cada prueba lo usa para llegar rápido a la que le toca probar. ── */

function completarS1() {
  pulsar('Silencio el chat y se lo cuento a mi papá');
}
function completarS2() {
  abrirContacto('Emilio');
  pulsar('Le repito que no y silencio el chat un rato');
}
function completarS3() {
  abrirContacto('Nova_Star99');
  pulsar('No contesto esa pregunta y sigo jugando');
  pulsar('No contesto y salgo del chat del juego');
}
function completarS4() {
  abrirContacto('Fer');
  pulsar('Dejo de contestar y se lo digo a un adulto');
  pulsar('No se la mando y dejo de contestar');
  pulsar('Tomo una captura de la conversación');
  pulsar('Bloqueo y reporto a Fer');
  pulsar('Se lo cuento a un adulto de confianza');
}
function completarS5() {
  abrirContacto('Grupo 4°B');
  pulsar('Se lo cuento a la maestra, aunque me dé miedo');
}

describe('n4-si-algo-me-incomoda', () => {
  it('la entrada dice las cuatro reglas y su CTA abre Tecnia Mensajes sin ninguna caja de texto', () => {
    render(<EntradaSiAlgoMeIncomoda config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);

    // Las cuatro cosas que no se pueden quedar a medias, dichas antes de jugar.
    expect(screen.getByText('No es tu culpa')).not.toBeNull();
    expect(screen.getByText('La señal número uno')).not.toBeNull();
    expect(screen.getByText('Contar no es acusar')).not.toBeNull();
    expect(screen.getByText('Qué hacer si pasa')).not.toBeNull();

    pulsar(/Abre Tecnia Mensajes/);
    expect(screen.getByText('Tecnia Mensajes')).not.toBeNull();
    // Aparece dos veces a propósito: el nombre en la lista y el título del
    // chat que se abre solo, porque Club de Dibujo es la primera conversación.
    expect(screen.getAllByText('Club de Dibujo').length).toBeGreaterThanOrEqual(2);

    // Privacidad: el alumno nunca teclea, en ningún punto de la actividad.
    expect(document.querySelectorAll('input, textarea').length).toBe(0);
  });

  it('Bit permanece bloqueado hasta terminar las cinco conversaciones', () => {
    abrirMensajes();
    const botonBit = screen.getByRole('button', { name: /Bit: disponible cuando termines/ }) as HTMLButtonElement;
    expect(botonBit.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Abrir conversación con Bit' })).toBeNull();
  });

  it('elegir mal en el Club de Dibujo no castiga el puntaje y deja la misma decisión abierta', () => {
    const { onScore } = abrirMensajes();

    pulsar('Les contesto algo feo también');
    expect(screen.getByText(/Contestar feo no arregla nada/)).not.toBeNull();
    // La decisión sigue ahí: las tres opciones, incluida la buena, no se fueron.
    expect(screen.getByRole('button', { name: 'Silencio el chat y se lo cuento a mi papá' })).not.toBeNull();

    pulsar('Me quedo callada, aunque me sienta mal');
    expect(screen.getByText(/Tienes derecho a hacer algo/)).not.toBeNull();

    // Ningún intento malo bajó el puntaje: aquí no se pierde.
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('lo que incomoda sin ser peligroso también cuenta, y acertar desbloquea la siguiente conversación', () => {
    abrirMensajes();
    expect(screen.queryByRole('button', { name: 'Abrir conversación con Emilio' })).toBeNull();

    completarS1();
    expect(screen.getByText('✓ Conversación resuelta')).not.toBeNull();
    abrirContacto('Emilio');

    pulsar('Le hago caso, no es tan grave');
    expect(screen.getByText(/Eso también cuenta/)).not.toBeNull();
    pulsar('Le repito que no y silencio el chat un rato');
    expect(screen.getByText(/Sentirte incómoda ya es razón suficiente/)).not.toBeNull();
  });

  it('a un desconocido en un juego no se le comparten datos personales, aunque insista', () => {
    abrirMensajes();
    completarS1();
    completarS2();
    abrirContacto('Nova_Star99');

    pulsar('Le digo el nombre de mi escuela');
    expect(screen.getByText(/Alguien podría encontrarte de verdad/)).not.toBeNull();
    pulsar('No contesto esa pregunta y sigo jugando');

    pulsar('Le digo mi edad, eso no tiene nada de malo');
    expect(screen.getByText(/Tampoco se la des a un desconocido/)).not.toBeNull();
    pulsar('No contesto y salgo del chat del juego');

    expect(screen.getByText('Saliste del chat con Nova_Star99.')).not.toBeNull();
  });

  it('Fer dice ser un niño de la misma edad; aun así aparece la señal número uno, "no es tu culpa" dos veces, y el orden completo: guardar la prueba antes de bloquear, bloquear antes de contarlo', () => {
    const { container } = abrirMensajes();
    completarS1();
    completarS2();
    completarS3();
    abrirContacto('Fer');
    expect(screen.getByText('yo también tengo 9 años y me encanta dibujar')).not.toBeNull();

    // d1 — la señal de alarma más importante que hay.
    pulsar('Está bien, no les digo nada, será nuestro secreto');
    expect(screen.getByText(/la señal más importante de todas/)).not.toBeNull();
    pulsar('Dejo de contestar y se lo digo a un adulto');
    expect(screen.getAllByText(/no es tu culpa/i).length).toBeGreaterThanOrEqual(1);

    // d2 — la foto que nunca se manda, y la segunda vez que se dice.
    pulsar('Se la mando, para que no se enoje');
    expect(screen.getByText(/otra señal mala/)).not.toBeNull();
    pulsar('No se la mando y dejo de contestar');
    expect(screen.getAllByText(/no es tu culpa/i).length).toBeGreaterThanOrEqual(2);

    // d3 — primero se guarda la prueba, nunca se borra antes.
    pulsar('Borro toda la conversación');
    expect(screen.getByText(/se pierde la prueba de lo que pasó/)).not.toBeNull();
    pulsar('Tomo una captura de la conversación');

    // d4 — bloquear y reportar.
    pulsar('Nada más, ya la guardé');
    expect(screen.getByText(/Falta un paso/)).not.toBeNull();
    pulsar('Bloqueo y reporto a Fer');

    // d5 — y por último, contárselo a un adulto.
    pulsar('Ya está, no hace falta nada más');
    expect(screen.getByText(/Falta lo más importante/)).not.toBeNull();
    pulsar('Se lo cuento a un adulto de confianza');

    // El orden en el hilo es el orden real: captura → bloqueo → se lo cuenta.
    const texto = container.textContent ?? '';
    const iCaptura = texto.indexOf('Guardaste una captura de la conversación.');
    const iBloqueo = texto.indexOf('Bloqueaste y reportaste a Fer.');
    const iConto = texto.indexOf('Sofi le contó a un adulto lo que pasó con Fer.');
    expect(iCaptura).toBeGreaterThan(-1);
    expect(iBloqueo).toBeGreaterThan(iCaptura);
    expect(iConto).toBeGreaterThan(iBloqueo);
  });

  it('en el Grupo 4°B, "contar no es acusar" nombra el miedo a meter a alguien en un lío', () => {
    abrirMensajes();
    completarS1();
    completarS2();
    completarS3();
    completarS4();
    abrirContacto('Grupo 4°B');

    pulsar('No digo nada, no quiero meter a nadie en problemas');
    expect(screen.getByText(/contar no es acusar/i)).not.toBeNull();

    pulsar('Me da miedo que digan que soy soplona');
    expect(screen.getByText(/Ese miedo es normal/)).not.toBeNull();

    pulsar('Se lo cuento a la maestra, aunque me dé miedo');
    expect(screen.getByText('Le escribiste a la maestra Lucía.')).not.toBeNull();
    // Se dijo dos veces: al elegir mal y al elegir bien.
    expect(screen.getAllByText(/contar no es acusar/i).length).toBeGreaterThanOrEqual(2);
  });

  it('el cierre con Bit ofrece más de un adulto, y si el primero no escucha se busca otro', () => {
    const { onComplete } = abrirMensajes();
    completarS1();
    completarS2();
    completarS3();
    completarS4();
    completarS5();

    const botonBit = screen.getByRole('button', { name: 'Abrir conversación con Bit' }) as HTMLButtonElement;
    expect(botonBit.disabled).toBe(false);
    fireEvent.click(botonBit);

    // Más de un adulto posible.
    expect(screen.getByRole('button', { name: 'Mi mamá o mi papá' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Un maestro o una maestra' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Un tío, tía o adulto de mi familia' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'La orientadora de la escuela' })).not.toBeNull();

    pulsar('Un maestro o una maestra');
    expect(screen.getByText(/anda ocupada/)).not.toBeNull();

    pulsar('Ya no le digo a nadie más');
    expect(screen.getByText(/Hay más de un adulto de confianza/)).not.toBeNull();

    pulsar('Se lo cuento a otra persona de mi confianza');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100 });
    expect(screen.getByText('Ya sabes qué hacer si algo te incomoda en línea')).not.toBeNull();
  });

  it('recorrido completo jugando MAL en cada decisión antes de acertar: el puntaje nunca baja y la actividad sí termina', () => {
    const { onProgress, onScore, onComplete } = abrirMensajes();

    // Club de Dibujo — se calla, y pelea, antes de irse bien.
    pulsar('Les contesto algo feo también');
    pulsar('Me quedo callada, aunque me sienta mal');
    completarS1();

    // Emilio.
    abrirContacto('Emilio');
    pulsar('Le hago caso, no es tan grave');
    pulsar('Sigo contestando para no quedar mal');
    pulsar('Le repito que no y silencio el chat un rato');

    // Nova_Star99 — le contesta al desconocido antes de aprender a no hacerlo.
    abrirContacto('Nova_Star99');
    pulsar('Le digo el nombre de mi escuela');
    pulsar('Le pregunto yo también cosas de él');
    pulsar('No contesto esa pregunta y sigo jugando');
    pulsar('Le digo mi edad, eso no tiene nada de malo');
    pulsar('No contesto y salgo del chat del juego');

    // Fer — incluida la trampa de borrar la prueba antes de guardarla.
    abrirContacto('Fer');
    pulsar('Está bien, no les digo nada, será nuestro secreto');
    pulsar('Sigo hablando, no es para tanto');
    pulsar('Dejo de contestar y se lo digo a un adulto');
    pulsar('Se la mando, para que no se enoje');
    pulsar('Le pregunto para qué la quiere');
    pulsar('No se la mando y dejo de contestar');
    pulsar('Borro toda la conversación');
    pulsar('Bloqueo a Fer de una vez');
    pulsar('Tomo una captura de la conversación');
    pulsar('Nada más, ya la guardé');
    pulsar('Bloqueo y reporto a Fer');
    pulsar('Ya está, no hace falta nada más');
    pulsar('Se lo cuento a un adulto de confianza');

    // Grupo 4°B.
    abrirContacto('Grupo 4°B');
    pulsar('No digo nada, no quiero meter a nadie en problemas');
    pulsar('Me da miedo que digan que soy soplona');
    pulsar('Se lo cuento a la maestra, aunque me dé miedo');

    // Bit: primero se rinde, luego busca a otro adulto.
    abrirContacto('Bit');
    pulsar('La orientadora de la escuela');
    pulsar('Ya no le digo a nadie más');
    pulsar('Se lo cuento a otra persona de mi confianza');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100 });
    expect(ultimo(onProgress)).toBe(1);
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);

    // El cierre no habla de XP ni de estrellas: insignia y pasos, nada más.
    expect(screen.queryByText(/\bXP\b/)).toBeNull();
    expect(screen.getByText('Insignia: Sabe pedir ayuda')).not.toBeNull();
  });
});
