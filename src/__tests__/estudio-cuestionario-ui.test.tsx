/**
 * Estudio de impacto — el cuestionario tal como lo ve el alumno.
 *
 * Se juega el cuestionario entero con DOM de verdad, porque las reglas que más
 * importan son de comportamiento y no de lógica: que no se filtre ni una pista
 * de si acertó, que cerrar y volver no reinicie nada, y que un fallo de la
 * medición no deje al alumno encerrado.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cuestionario from '@/components/estudio/Cuestionario';
import { bancoDe } from '@/lib/estudio/cuestionario/bancos';
import { leerAvance } from '@/lib/estudio/cuestionario/almacen';
import { pendientes, vaciarCola } from '@/lib/estudio/cola';
import { limpiarErroresRecientes } from '@/lib/estudio/errores';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';

const IDENT: IdentidadEstudio = { estudioId: '33333333-3333-4333-8333-333333333333', ancla: 'cuenta' };
const banco = bancoDe('entrada');

beforeEach(async () => {
  localStorage.clear();
  limpiarErroresRecientes();
  await vaciarCola();
});

/** Contesta el reactivo que esté en pantalla eligiendo la opción `i`. */
async function contesta(user: ReturnType<typeof userEvent.setup>, i = 0) {
  const opciones = await screen.findAllByRole('button', { pressed: false });
  // Las opciones son los botones con `aria-pressed`; los otros no lo llevan.
  await user.click(opciones[i]);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('la portada', () => {
  it('usa el texto neutro del encargo, sin la palabra «examen»', async () => {
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    expect(
      await screen.findByText('Antes de empezar queremos saber qué ya sabes. No hay calificación. Responde lo que creas.'),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/examen|prueba|test/i);
  });

  it('avisa de cuántas preguntas son y de que no hay prisa', async () => {
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    expect(await screen.findByText(/Tómate el tiempo que quieras\. Son 18 preguntas\./)).toBeInTheDocument();
  });
});

describe('contestar', () => {
  it('enseña un reactivo a la vez, en el orden del banco', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));

    expect(screen.getByText(banco.reactivos[0].enunciado)).toBeInTheDocument();
    expect(screen.queryByText(banco.reactivos[1].enunciado)).not.toBeInTheDocument();

    await contesta(user);
    await waitFor(() => expect(screen.getByText(banco.reactivos[1].enunciado)).toBeInTheDocument());
  });

  it('hay que elegir antes de poder continuar', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('NO dice si la respuesta fue correcta, ni con texto ni con clases', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));

    // El primer reactivo tiene la correcta en la posición 1. Se contesta bien
    // a propósito: si algo se fuera a filtrar, sería aquí.
    await contesta(user, 1);
    await waitFor(() => expect(screen.getByText(banco.reactivos[1].enunciado)).toBeInTheDocument());

    expect(document.body.textContent).not.toMatch(/correct|bien|acertaste|¡muy bien!|incorrect|error/i);
    expect(document.querySelector('.correcta, .incorrecta, .acierto, .fallo')).toBeNull();
  });

  it('«Aún no lo sé» guarda respuesta nula aunque hubiera una opción marcada', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));

    // Elige una opción y CAMBIA de idea: lo que se guarda debe ser el null.
    await user.click(screen.getAllByRole('button', { pressed: false })[2]);
    await user.click(screen.getByRole('button', { name: 'Aún no lo sé' }));

    await waitFor(() => expect(leerAvance('entrada')!.respuestas).toHaveLength(1));
    const r = leerAvance('entrada')!.respuestas[0];
    expect(r.respuesta).toBeNull();
    expect(r.correcta).toBe(false);
  });

  it('mide el tiempo de cada reactivo por separado', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    await contesta(user);
    await waitFor(() => expect(leerAvance('entrada')!.respuestas).toHaveLength(1));
    await contesta(user);
    await waitFor(() => expect(leerAvance('entrada')!.respuestas).toHaveLength(2));

    const [a, b] = leerAvance('entrada')!.respuestas;
    expect(a.tiempoMs).toBeGreaterThanOrEqual(0);
    expect(b.tiempoMs).toBeGreaterThanOrEqual(0);
    expect(a.orden).toBe(1);
    expect(b.orden).toBe(2);
  });

  it('el avance que se enseña cuenta reactivos, nunca aciertos', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    expect(screen.getByText('1 de 18')).toBeInTheDocument();
    await contesta(user);
    await waitFor(() => expect(screen.getByText('2 de 18')).toBeInTheDocument());
  });
});

describe('no se reinicia ni se repite', () => {
  it('al volver, retoma por donde iba y no vuelve a enseñar la portada', async () => {
    const user = userEvent.setup();
    const primera = render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    await contesta(user);
    await waitFor(() => expect(leerAvance('entrada')!.respuestas).toHaveLength(1));
    primera.unmount();

    // «Cerró la pestaña y volvió al día siguiente».
    render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
    expect(await screen.findByText(banco.reactivos[1].enunciado)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Empezar' })).not.toBeInTheDocument();
  });

  it('un cuestionario ya contestado no se vuelve a enseñar: se sale solo', async () => {
    const user = userEvent.setup();
    const terminar = jest.fn();
    const primera = render(
      <Cuestionario cuestionarioId="actitud_entrada" identidad={IDENT} onTerminar={terminar} />,
    );
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    for (let i = 0; i < 4; i += 1) await contesta(user);
    await waitFor(() => expect(screen.getByText('Gracias, ya puedes continuar.')).toBeInTheDocument());
    primera.unmount();

    const segunda = jest.fn();
    render(<Cuestionario cuestionarioId="actitud_entrada" identidad={IDENT} onTerminar={segunda} />);
    await waitFor(() => expect(segunda).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('el cierre', () => {
  it('agradece y no adelanta ningún resultado', async () => {
    const user = userEvent.setup();
    const terminar = jest.fn();
    render(<Cuestionario cuestionarioId="actitud_entrada" identidad={IDENT} onTerminar={terminar} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    for (let i = 0; i < 4; i += 1) await contesta(user);

    expect(await screen.findByText('Gracias, ya puedes continuar.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d+\s*(de|\/)\s*\d+\s*correct/i);
    expect(document.body.textContent).not.toMatch(/puntaje|calificación|resultado|acertaste/i);

    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(terminar).toHaveBeenCalled();
  });

  it('deja las respuestas en la cola para mandarlas', async () => {
    const user = userEvent.setup();
    render(<Cuestionario cuestionarioId="actitud_entrada" identidad={IDENT} onTerminar={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Empezar' }));
    for (let i = 0; i < 4; i += 1) await contesta(user);

    const filas = await pendientes();
    expect(filas.filter((f) => f.tabla === 'estudio_respuestas')).toHaveLength(4);
    expect(filas.filter((f) => f.tabla === 'estudio_cuestionarios_aplicados').length).toBeGreaterThanOrEqual(1);
  });
});

describe('la medición nunca encierra al alumno', () => {
  it('si no se puede guardar nada, el cuestionario avanza igual', async () => {
    const user = userEvent.setup();
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('almacenamiento bloqueado'); };
    try {
      render(<Cuestionario cuestionarioId="entrada" identidad={IDENT} onTerminar={() => {}} />);
      await user.click(await screen.findByRole('button', { name: 'Empezar' }));
      await contesta(user);
      // Avanzó al segundo reactivo pese a que ninguna escritura funcionó.
      await waitFor(() => expect(screen.getByText(banco.reactivos[1].enunciado)).toBeInTheDocument());
    } finally {
      Storage.prototype.setItem = set;
    }
  });
});
