/**
 * N5 · «IA a mi alcance», parada 3 · `n5-uso-responsable-de-ia`.
 *
 * Lo que hay que cuidar aquí es distinto de lo de la parada 2: esta clase no
 * entrena nada. Lo que se mide es **la ficha que el asistente se queda**, que
 * sólo crece y no se vacía por ningún camino, y **el corte del guion**
 * (`tipo: 'aviso'`), que esta clase estrena en la plataforma.
 *
 * Se juega mal a propósito: enviar el mensaje vacío, adjuntarlo todo, pedirle
 * que haga el trabajo una y otra vez, quitar la pieza después de mandarla, y
 * pedirle que borre lo que ya sabe.
 *
 * Dos de las once son recorridos completos hasta `onComplete`: el del alumno
 * que se cuida y el del que lo cuenta todo. Los dos terminan y los dos con
 * 100 — dar un dato personal no resta, es la lección, no un examen.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaUsoResponsableDeIa } from '@/components/activities/ia/EntradaUsoResponsableDeIa';
import {
  ENCARGOS,
  EXTRAS,
  GUION_RESPONSABLE,
  TOTAL_PASOS,
} from '@/components/activities/ia/mensajesResponsable';
import { RUTA_N5_IA_A_MI_ALCANCE } from '@/components/activities/ia/rutasIA';
import { resolverGuion, validarGuion } from '@/components/simuladores/asistente';
import { CURRICULO } from '@/data/curriculo';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaUsoResponsableDeIa config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

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

const pieza = (selector: string) => document.querySelector(selector) as HTMLElement;

/** Elige la petición, adjunta los extras que se le digan, y envía. */
function enviarMensaje(peticionId: string, extras: string[] = []) {
  fireEvent.click(pieza(`[data-peticion="${peticionId}"]`));
  for (const x of extras) fireEvent.click(pieza(`[data-extra="${x}"]`));
  fireEvent.click(screen.getByTestId('tia-enviar'));
  saltarSiTeclea();
}

/** La petición que NO corta de cada encargo, en orden. */
const BUENAS = ['p-que-es', 'p-donde', 'p-magma', 'p-revisa', 'p-portada'];

/** Pasa el alto en el camino: mira la ficha, pide que la borre, sigue. */
function pasarElAlto() {
  fireEvent.click(screen.getByTestId('tia-que-sabes'));
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId('tia-borrar'));
  saltarSiTeclea();
  fireEvent.click(screen.getByTestId('tia-seguir-alto'));
}

describe('n5-uso-responsable-de-ia', () => {
  it('vive donde dice el currículo: N5, 10–11 años, y es la parada 3 de su unidad', () => {
    const n5 = CURRICULO.find((n) => n.n === 5)!;
    expect(n5.edad).toBe('10–11');
    const unidad = n5.unidades.find((u) => u.id === 'n5-ia-a-mi-alcance')!;
    expect(unidad.actividades[2].id).toBe('n5-uso-responsable-de-ia');
    expect(RUTA_N5_IA_A_MI_ALCANCE[2].titulo).toBe(unidad.actividades[2].titulo);
    expect(TOTAL_PASOS).toBe(ENCARGOS.length + 1);
  });

  it('la entrada es suya y el laboratorio abre con la portada de objetivos', () => {
    montar();
    expect(screen.getByText('Se queda con lo que le cuentas')).toBeInTheDocument();
    expect(screen.getByText('Lo dado no se recoge')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Asistente/ }));
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('Uso responsable de la IA')).toBeInTheDocument();
    expect(within(portada).getByText(/Al terminar/)).toBeInTheDocument();
    expect(screen.queryByTestId('tia-mesa')).toBeNull();
  });

  it('el guion está sano y cada petición que corta devuelve un aviso, no una respuesta', () => {
    expect(validarGuion(GUION_RESPONSABLE)).toEqual([]);
    for (const encargo of ENCARGOS) {
      for (const p of encargo.peticiones) {
        const { respuesta, porDefecto } = resolverGuion(GUION_RESPONSABLE, { ficha: p.id });
        expect(porDefecto).toBe(false);
        expect(respuesta.tipo === 'aviso').toBe(Boolean(p.corta));
      }
    }
  });

  it('la ficha empieza vacía y el mensaje se arma pieza a pieza', () => {
    abrirLaboratorio();
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Nada\. Y te está ayudando igual/);
    // Sin petición no se puede enviar: no hay mensaje que mandar.
    expect(screen.getByTestId('tia-enviar')).toBeDisabled();

    fireEvent.click(pieza('[data-peticion="p-que-es"]'));
    expect(screen.getByTestId('tia-enviar')).toBeEnabled();
    expect(screen.getByTestId('tia-armado').textContent).toMatch(/Explícame qué es un volcán/);

    // Los extras se apilan y se pueden quitar ANTES de enviar.
    fireEvent.click(pieza('[data-extra="x-nombre"]'));
    expect(screen.getByTestId('tia-armado').textContent).toMatch(/Sofía Ramírez Luna/);
    fireEvent.click(pieza('[data-extra="x-nombre"]'));
    expect(screen.getByTestId('tia-armado').textContent).not.toMatch(/Sofía Ramírez Luna/);
    // Y quitarla a tiempo deja la ficha limpia.
    fireEvent.click(screen.getByTestId('tia-enviar'));
    saltarSiTeclea();
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Nada\./);
  });

  it('adjuntar un dato lo deja en la ficha para siempre, y el asistente no avisa', () => {
    abrirLaboratorio();
    enviarMensaje('p-que-es', ['x-nombre']);

    // Contestó la pregunta tan tranquilo: ni una palabra sobre el dato.
    const hilo = screen.getByTestId('asis-hilo').textContent ?? '';
    expect(hilo).toMatch(/Un volcán es una abertura/);
    expect(hilo).not.toMatch(/no me des/i);

    // Y se lo quedó.
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Tu nombre completo y tu escuela/);
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/no se borra/);

    // Pasar de encargo no lo limpia.
    fireEvent.click(screen.getByTestId('tia-seguir'));
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Tu nombre completo/);
  });

  it('jugar mal: pedirle que haga el trabajo — corta, no cuenta como encargo, y se puede reintentar', () => {
    abrirLaboratorio();
    enviarMensaje('p-hazlo');

    const aviso = document.querySelector('[data-tipo="aviso"]');
    expect(aviso).not.toBeNull();
    expect(aviso!.textContent).toMatch(/Eso no lo voy a hacer/);

    // El encargo NO se dio por hecho: el botón invita a pedir otra cosa.
    expect(screen.getByTestId('tia-seguir').textContent).toMatch(/Pedirle otra cosa/);
    fireEvent.click(screen.getByTestId('tia-seguir'));
    expect(screen.getByTestId('tia-mesa').textContent).toMatch(/Encargo 1 de 5/);

    // Y ahora sí, pidiendo bien, avanza.
    enviarMensaje('p-que-es');
    fireEvent.click(screen.getByTestId('tia-seguir'));
    expect(screen.getByTestId('tia-mesa').textContent).toMatch(/Encargo 2 de 5/);
  });

  it('el corte no le borra lo que ya leyó: negarse y quedarse el dato pasan a la vez', () => {
    abrirLaboratorio();
    enviarMensaje('p-hazlo', ['x-casa']);
    expect(document.querySelector('[data-tipo="aviso"]')).not.toBeNull();
    // Dijo que no… y aun así apuntó dónde vives.
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Dónde vives/);
  });

  it('jugar mal: adjuntarlo TODO — los tres datos quedan y no se repiten', () => {
    abrirLaboratorio();
    enviarMensaje('p-que-es', ['x-nombre', 'x-casa', 'x-telefono']);
    const expediente = () => screen.getByTestId('tia-expediente');
    expect(expediente().querySelectorAll('li')).toHaveLength(EXTRAS.length);

    // Volver a mandarlos no los duplica: ya los tenía.
    fireEvent.click(screen.getByTestId('tia-seguir'));
    enviarMensaje('p-donde', ['x-nombre', 'x-casa']);
    expect(expediente().querySelectorAll('li')).toHaveLength(EXTRAS.length);
  });

  it('el alto en el camino: pedirle que borre no borra nada', () => {
    abrirLaboratorio();
    enviarMensaje(BUENAS[0], ['x-nombre']);
    fireEvent.click(screen.getByTestId('tia-seguir'));
    enviarMensaje(BUENAS[1]);
    fireEvent.click(screen.getByTestId('tia-seguir'));
    enviarMensaje(BUENAS[2]);
    fireEvent.click(screen.getByTestId('tia-seguir'));

    // Se paró solo a mirar la ficha.
    expect(screen.getByTestId('tia-mesa').textContent).toMatch(/Lo que ya sabe de ti/);
    fireEvent.click(screen.getByTestId('tia-que-sabes'));
    saltarSiTeclea();
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/me lo diste tú/);

    fireEvent.click(screen.getByTestId('tia-borrar'));
    saltarSiTeclea();
    expect(screen.getByTestId('asis-hilo').textContent).toMatch(/Lo que ya se dio, no se recoge/);
    // Y sigue ahí.
    expect(screen.getByTestId('tia-expediente').textContent).toMatch(/Tu nombre completo/);
  });

  it('recorrido completo cuidándose: termina con la ficha vacía y 100', () => {
    const { onComplete, onScore, onProgress } = abrirLaboratorio();
    for (let i = 0; i < ENCARGOS.length; i += 1) {
      enviarMensaje(BUENAS[i]);
      fireEvent.click(screen.getByTestId('tia-seguir'));
      if (i === 2) pasarElAlto();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].score).toBe(100);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);
    expect(screen.getByText('¡Trabajo entregado, y sin dar nada tuyo!')).toBeInTheDocument();
    expect(screen.getByText(/Dueña de tus datos/)).toBeInTheDocument();
  });

  it('recorrido completo contándolo todo: también termina, también con 100, y la ficha lo dice', () => {
    const { onComplete, onScore } = abrirLaboratorio();
    for (let i = 0; i < ENCARGOS.length; i += 1) {
      enviarMensaje(BUENAS[i], i === 0 ? ['x-nombre', 'x-casa', 'x-telefono'] : []);
      fireEvent.click(screen.getByTestId('tia-seguir'));
      if (i === 2) pasarElAlto();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    // Dar datos personales NO resta: es la lección, no un examen sorpresa.
    expect(onComplete.mock.calls[0][0].score).toBe(100);
    expect(onComplete.mock.calls[0][0].errores).toBe(0);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);
    expect(screen.getByText('Trabajo entregado… y algo se quedó')).toBeInTheDocument();
    expect(screen.getByText(/se quedó con 3 datos tuyos/)).toBeInTheDocument();
  });
});
