/**
 * N5·«Mi huella digital» · parada 2 · «Mi identidad digital».
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → Tecnia Muro), no una copia de
 * sus datos, y usa el armazón `simuladores/muro/` tal cual: las publicaciones
 * que aparecen a la izquierda las pinta `VentanaMuro`, y las pistas del perfil
 * salen de `perfilDe`.
 *
 * Nada de temporizadores: cada paso avanza con un clic explícito, igual que la
 * hermana `n5-lo-que-publico-permanece`.
 *
 * Lo que se cuida aquí (todo salió de jugar MAL a propósito):
 *  · Que el Acto 1 no lleve NI UNA advertencia: cinco publicaciones normales,
 *    un solo botón, ningún dilema. Si el alumno sale creyendo que no debe
 *    publicar nada, la clase falló.
 *  · Que juntar el par equivocado explique qué SÍ dice cada pieza, no bloquee
 *    el avance y deje la misma pregunta abierta.
 *  · Que elegir dos veces la misma pieza la quite en vez de contarla dos veces
 *    (una pieza no se suma consigo misma).
 *  · Que el Acto 2b NO deshaga el retrato ya resuelto: los dos retratos se ven
 *    a la vez, el de antes intacto («un predicado que un encargo posterior
 *    deshace está mal escrito»).
 *  · Que la pieza más «personal» —el cumpleaños de la hermanita— tumbe CERO
 *    renglones, que es la lección contraintuitiva de la clase.
 *  · Dos recorridos completos hasta `onComplete`: perfecto (100, 3 estrellas,
 *    0 errores) y fallando una deducción por pregunta (82, se termina igual).
 *  · El camino de salida desde la pantalla de cierre, que ya reventó una clase
 *    de Word por faltar.
 *
 * Sin matchers de `jest-dom` (`jest.setup.ts` está fuera de `tsconfig` y
 * compilan mal aunque el test pase): el resto del proyecto usa matchers
 * pelados por el mismo motivo.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaMiIdentidadDigital } from '@/components/activities/n5/estudio/EntradaMiIdentidadDigital';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre }) as HTMLButtonElement;

const ESCUDO = 'Escudo de la playera';
const LETRERO = 'Letrero del fondo';
const HORARIO = 'Hora de la natación';
const EMI = 'Cumple de Emi';
const ETIQUETA = 'Etiqueta de la mochila';

function montarEntrada() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaMiIdentidadDigital config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra a Tecnia Muro por el CTA, sin depender de dónde caiga en el documento. */
function abrirMuro() {
  const utils = montarEntrada();
  pulsar(/Abre Tecnia Muro/);
  return utils;
}

/** Acto 1 completo: las cinco publicaciones, un clic cada una. */
function publicarLaSemana() {
  for (let i = 0; i < 5; i += 1) pulsar('Publicar');
}

/** Junta dos piezas y aprieta el botón. */
function juntar(a: string, b: string) {
  pulsar(a);
  pulsar(b);
  pulsar(/Juntar estas dos/);
}

/** Las tres deducciones, acertando a la primera. */
function armarElRetrato() {
  juntar(ETIQUETA, ESCUDO);
  pulsar(/Continuar/);
  juntar(ESCUDO, LETRERO);
  pulsar(/Continuar/);
  juntar(LETRERO, HORARIO);
  pulsar(/Continuar/);
}

/** Acto 3 completo, eligiendo la opción indicada de cada cuadro. */
function armarElPerfil(opciones: string[]) {
  for (const opcion of opciones) {
    pulsar(opcion);
    pulsar(/Continuar|Ver mi perfil/);
  }
}

const PERFIL_SIN_PIEZAS = ['Xime Dibuja', 'Un dibujo que hice yo', 'Me encanta el fútbol y dibujar', '14 de marzo', 'Sólo mis amigos'];
const PERFIL_CON_PIEZAS = [
  'Ximena Robles Vela',
  'Yo con el uniforme, en la puerta de la escuela',
  '5.º B de la Primaria Bosques del Río',
  '14 de marzo de 2016',
  'Todos',
];

describe('n5-mi-identidad-digital · la entrada', () => {
  it('respeta la plantilla de oro, habla de juntar (no de borrar) y el CTA abre Tecnia Muro', () => {
    montarEntrada();
    expect(screen.getByText('Lo que se arma con lo que dejas suelto')).not.toBeNull();
    expect(screen.getByText('El riesgo está en la suma')).not.toBeNull();
    expect(screen.getByText('Lo que se cuela sin querer')).not.toBeNull();
    expect(screen.getByText('La que más revela no es la más secreta')).not.toBeNull();
    expect(screen.getByText('Tú eliges qué cara enseñas')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Muro')).not.toBeNull();
    // La parada 2 no repite la parada 1: aquí no se borra nada.
    expect(screen.queryByText(/[Bb]orrar/)).toBeNull();
  });
});

/*
 * `actividades-contrato.test.tsx` no puede ver esta clase hasta que el
 * coordinador la registre, así que aquí se reproduce lo que ese arnés le va a
 * hacer: montar la entrada de verdad y llegar al laboratorio — que es justo el
 * camino por el que `n5-conecta-perifericos` descubrió `matchMedia is not a
 * function`.
 *
 * OJO CON EL PRIMER BOTÓN. Hasta el 2-sep-2026 esto afirmaba que el primer
 * `<button>` del documento era el CTA, y era verdad **sólo mientras la clase no
 * tuviera video**: con `assetsPendientes` la base salta el cubrepantalla y el
 * CTA queda de primero. El día que se publicó `video-explicativo.mp4` el
 * reproductor pasó a ir delante y la prueba se cayó, señalando un cambio
 * correcto. Así que ahora se comprueba lo que de verdad importa —que hay
 * reproductor, que no queda el aviso de «se está grabando», y que el CTA abre
 * el laboratorio— buscando el CTA **por su texto** y no por su posición.
 */
describe('n5-mi-identidad-digital · el contrato de actividad', () => {
  it('monta, reporta progreso y puntaje en rango, y no se completa sola', () => {
    const { container, onProgress, onScore, onComplete } = montarEntrada();
    expect(container.firstChild).not.toBeNull();
    expect(onProgress).toHaveBeenCalled();
    expect(onScore).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(100);
    }
  });

  it('con el video publicado, el reproductor ocupa su sitio y no queda ningún aviso', () => {
    const { container } = montarEntrada();
    expect(container.querySelector('video')).not.toBeNull();
    expect(container.querySelector('.video-pendiente')).toBeNull();
  });

  it('el CTA abre el laboratorio sin tronar y sin completarlo', () => {
    const { onComplete } = montarEntrada();
    pulsar(/Abre Tecnia Muro/);
    expect(screen.getByText('Publicación 1 de 5')).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('n5-mi-identidad-digital · Acto 1 · publicar la semana', () => {
  it('abre sin 3D ni cajas de texto, con el muro vacío y el primer borrador', () => {
    abrirMuro();
    expect(document.querySelector('canvas')).toBeNull();
    expect(document.querySelectorAll('input, textarea').length).toBe(0);
    expect(screen.getByText('Publicación 1 de 5')).not.toBeNull();
    expect(screen.getByText(/El muro de Xime está vacío/)).not.toBeNull();
  });

  it('no lleva ni una advertencia: un solo botón por borrador, sin dilemas', () => {
    abrirMuro();
    expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /No publicar/ })).toBeNull();
    expect(screen.getByText(/ninguna de las cinco tiene nada de malo/i)).not.toBeNull();
  });

  it('las cinco publicaciones entran al muro del armazón y luego se abre el perfil', () => {
    abrirMuro();
    publicarLaSemana();
    expect(screen.getAllByTestId('muro-post').length).toBe(5);
    expect(screen.getByRole('button', { name: /Abrir el perfil/ })).not.toBeNull();

    pulsar(/Abrir el perfil/);
    // El perfil del armazón junta las `pistas` de las cinco publicaciones.
    expect(screen.getByTestId('muro-perfil-pistas')).not.toBeNull();
    expect(screen.getByText(/Primaria Bosques del Río/)).not.toBeNull();
    expect(screen.getByText(/Parque de los Fresnos/)).not.toBeNull();
  });
});

describe('n5-mi-identidad-digital · Acto 2 · juntar piezas', () => {
  it('elegir dos veces la misma pieza la quita: una pieza no se suma consigo misma', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);

    pulsar(ESCUDO);
    expect(boton(/Juntar estas dos/).disabled).toBe(true);
    pulsar(ESCUDO); // otra vez la misma: se quita
    expect(boton(/Juntar estas dos/).disabled).toBe(true);
    expect(screen.getAllByText('Elige una pieza').length).toBe(2);

    pulsar(ESCUDO);
    pulsar(ETIQUETA);
    expect(boton(/Juntar estas dos/).disabled).toBe(false);
  });

  it('el par equivocado explica qué SÍ dice cada pieza, no bloquea y deja la pregunta abierta', () => {
    const { onScore } = abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);

    juntar(EMI, HORARIO);
    expect(screen.getByText(/Las dos son ciertas/)).not.toBeNull();
    expect(screen.getByText(/todavía no contestan/)).not.toBeNull();
    // Sigue siendo la misma pregunta: no se saltó ninguna.
    expect(screen.getByText('Pregunta 1 de 3')).not.toBeNull();

    pulsar(/Volver a intentar/);
    expect(screen.getAllByText('Elige una pieza').length).toBe(2);

    juntar(ETIQUETA, ESCUDO);
    expect(screen.getByText(/Nadie escribió esa frase/)).not.toBeNull();
    pulsar(/Continuar/);
    expect(screen.getByText('Pregunta 2 de 3')).not.toBeNull();

    // Se restó una vez y nunca por debajo del piso.
    const puntajes = onScore.mock.calls.map(([v]) => v as number);
    expect(puntajes[puntajes.length - 1]).toBe(94);
    for (const v of puntajes) expect(v).toBeGreaterThanOrEqual(60);
  });

  it('el orden de las dos piezas da igual', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    juntar(ESCUDO, ETIQUETA); // al revés que el orden del dato
    expect(screen.getByText(/Nadie escribió esa frase/)).not.toBeNull();
  });
});

describe('n5-mi-identidad-digital · Acto 2b · quitar una pieza', () => {
  it('el dato más personal (el cumple de la hermanita) no tumba ni un renglón', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    armarElRetrato();

    pulsar('Tapar: Cumple de Emi');
    expect(screen.getByText('Se caen 0 de 3')).not.toBeNull();
    expect(screen.getByText(/no ubicaba nada/)).not.toBeNull();
  });

  it('la pieza que aparece en dos respuestas tumba dos, y el retrato de antes queda intacto', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    armarElRetrato();

    pulsar('Tapar: Escudo de la playera');
    expect(screen.getByText('Se caen 2 de 3')).not.toBeNull();

    // El encargo posterior NO deshace el anterior: los dos retratos conviven,
    // el de «con las cinco piezas» con sus tres renglones sin tachar.
    expect(screen.getByText('Con las cinco piezas')).not.toBeNull();
    const antes = screen.getByText('Con las cinco piezas').parentElement as HTMLElement;
    expect(antes.querySelectorAll('li').length).toBe(3);
    expect(antes.querySelectorAll('s').length).toBe(0);

    const despues = screen.getByText(/^Tapando:/).parentElement as HTMLElement;
    expect(despues.querySelectorAll('s').length).toBe(2);
  });
});

describe('n5-mi-identidad-digital · recorridos completos', () => {
  it('partida perfecta: 100 puntos, 3 estrellas, 0 errores, 0 piezas sueltas y progreso final 1', () => {
    const { onProgress, onScore, onComplete } = abrirMuro();

    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    armarElRetrato();
    pulsar('Tapar: Escudo de la playera');
    pulsar(/Continuar/);
    pulsar(/Armar mi perfil/);
    armarElPerfil(PERFIL_SIN_PIEZAS);

    expect(screen.getByText(/No dice dónde estás y se ve buenísimo/)).not.toBeNull();
    pulsar('Terminar');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 0 });
    expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(1);
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(60);
      expect(valor).toBeLessThanOrEqual(100);
    }

    expect(screen.getByText('Insignia · Dueña de tu retrato')).not.toBeNull();
    expect(screen.getByText('Ya sabes cómo se arma un retrato con piezas sueltas')).not.toBeNull();
    expect(screen.getByTestId('idd-tarjeta-perfil')).not.toBeNull();
  });

  it('jugando MAL de punta a punta: falla una vez por pregunta y deja las cinco piezas sueltas — se termina igual y nadie la regaña', () => {
    const { onComplete } = abrirMuro();

    publicarLaSemana();
    pulsar(/Abrir el perfil/);

    // Una deducción equivocada por pregunta, y luego la buena.
    juntar(EMI, HORARIO);
    pulsar(/Volver a intentar/);
    juntar(ETIQUETA, ESCUDO);
    pulsar(/Continuar/);

    juntar(EMI, ETIQUETA);
    pulsar(/Volver a intentar/);
    juntar(ESCUDO, LETRERO);
    pulsar(/Continuar/);

    juntar(EMI, ESCUDO);
    pulsar(/Volver a intentar/);
    juntar(LETRERO, HORARIO);
    pulsar(/Continuar/);

    // La pieza que no tumba nada: también se puede elegir y también enseña.
    pulsar('Tapar: Cumple de Emi');
    pulsar(/Continuar/);
    pulsar(/Armar mi perfil/);
    armarElPerfil(PERFIL_CON_PIEZAS);

    expect(screen.getByText(/Dejaste 5 piezas sueltas/)).not.toBeNull();
    pulsar('Terminar');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 82, stars: 3, errores: 3 });
    // El cierre cuenta las piezas y NO culpa a nadie.
    expect(screen.getByText(/ahora ya sabes cuáles son/)).not.toBeNull();
    expect(screen.getByText('Insignia · Dueña de tu retrato')).not.toBeNull();
  });

  it('el camino de salida: «Salir» desde el cierre devuelve a la portada de objetivos', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    armarElRetrato();
    pulsar('Tapar: Escudo de la playera');
    pulsar(/Continuar/);
    pulsar(/Armar mi perfil/);
    armarElPerfil(PERFIL_SIN_PIEZAS);
    pulsar('Terminar');

    pulsar('Salir');
    expect(screen.getByText('Lo que se arma con lo que dejas suelto')).not.toBeNull();
  });

  it('«Jugar otra vez» deja el muro vacío y el retrato en blanco', () => {
    abrirMuro();
    publicarLaSemana();
    pulsar(/Abrir el perfil/);
    armarElRetrato();
    pulsar('Tapar: Escudo de la playera');
    pulsar(/Continuar/);
    pulsar(/Armar mi perfil/);
    armarElPerfil(PERFIL_SIN_PIEZAS);
    pulsar('Terminar');

    pulsar('Jugar otra vez');
    expect(screen.getByText('Publicación 1 de 5')).not.toBeNull();
    expect(screen.queryAllByTestId('muro-post').length).toBe(0);
    expect(screen.getByText(/El muro de Xime está vacío/)).not.toBeNull();
  });
});
