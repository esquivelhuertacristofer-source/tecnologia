/**
 * `of-m365-calendario` · «Calendario y citas» (DOC-PEDAGOGICO-M365-58.md
 * §58.1), jugada entera desde el primer clic hasta la insignia.
 *
 * Corrección del coordinador sobre el pliego original: el reagendado del
 * encargo 6 NUNCA usa arrastre (jsdom pierde las coordenadas de puntero y una
 * prueba de arrastre pasa en verde sin comprobar nada — COMO-SE-CONSTRUYE.md
 * §5.1-5.2). Aquí es un `<select>` de hora + un botón «Confirmar cambio»:
 * puro `fireEvent.click`/`fireEvent.change`, cero `pointerdown/move/up` con
 * coordenadas. Este archivo entero no llama nunca a `fireEvent.pointerDown`,
 * `.pointerMove` ni a nada con `clientX`/`clientY`.
 *
 * Lo que se juega mal a propósito, en la segunda mitad: un formulario a
 * medio llenar, un «Guardar» sin invitado, un «Rechazar» a la invitación,
 * un clic en la cita ajena («Reunión Jurado») cuando toca editar la propia,
 * un reagendado que deja la cita en la MISMA hora (sigue chocando, aunque el
 * armazón lo acepte como no-op válido) y un «Confirmar Agenda» sin activar
 * el recordatorio.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabM365Calendario } from '@/components/activities/office/m365/calendario/Lab';
import { MIERCOLES } from '@/components/activities/office/m365/calendario/datos';
import type { ActivityResult } from '@/types/activity-contract';

function montar(extra: Record<string, unknown> = {}) {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabM365Calendario config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} {...extra} />);
  return { onProgress, onScore, onComplete };
}

const boton = (testId: string) => screen.getByTestId(testId);
const pulsar = (testId: string) => fireEvent.click(boton(testId));
const escribir = (testId: string, texto: string) => fireEvent.change(boton(testId), { target: { value: texto } });
const elegir = (testId: string, valor: string) => fireEvent.change(boton(testId), { target: { value: valor } });

const avisoActual = (): string => screen.queryByTestId('calx-aviso')?.textContent ?? '';
const pasoActual = (): string => screen.getByText(/^Paso \d de \d$/).textContent ?? '';

const citaEnPantalla = (id: string): HTMLElement | null => document.querySelector(`[data-cita="${id}"]`);

/* ── el recorrido completo, jugado bien ─────────────────────────────────── */

function abrirYLlenarDatos() {
  pulsar('calx-nueva-cita');
  escribir('calx-input-titulo', 'Demostración Robot');
  elegir('calx-select-dia', MIERCOLES);
  elegir('calx-select-inicio', '10:00');
  elegir('calx-select-fin', '10:30');
  pulsar('calx-siguiente-invitados');
}

function invitarYGuardar() {
  escribir('calx-input-invitado', 'profesor@tecnia.edu');
  pulsar('calx-agregar-invitado');
  pulsar('calx-guardar-cita');
}

function abrirYAceptarInvitacion() {
  pulsar('calx-notif-abrir');
  pulsar('calx-notif-aceptar');
}

function editarLaPropia() {
  const bloque = citaEnPantalla('cita-demo-robot');
  if (!bloque) throw new Error('no está el bloque «Demostración Robot» en la parrilla');
  fireEvent.click(bloque);
}

function reagendarA(hora: string) {
  elegir('calx-select-reagendar', hora);
  pulsar('calx-confirmar-reagendar');
}

function confirmarConRecordatorio() {
  fireEvent.click(boton('calx-recordatorio'));
  pulsar('calx-confirmar-agenda');
}

describe('of-m365-calendario de punta a punta', () => {
  it('las siete puertas se abren en orden, sin arrastre, y la clase cierra con nota perfecta', () => {
    const { onComplete } = montar();

    expect(pasoActual()).toBe('Paso 1 de 7');

    abrirYLlenarDatos();
    expect(pasoActual()).toBe('Paso 3 de 7'); // datos + guardar llenos, en la pestaña de invitados

    invitarYGuardar();
    expect(pasoActual()).toBe('Paso 4 de 7');
    // La cita ya está en la parrilla.
    expect(citaEnPantalla('cita-demo-robot')).not.toBeNull();

    abrirYAceptarInvitacion();
    expect(pasoActual()).toBe('Paso 5 de 7');
    expect(citaEnPantalla('cita-jurado')).not.toBeNull();
    // Las dos citas del miércoles chocan: el armazón las marca solapadas.
    expect(citaEnPantalla('cita-demo-robot')?.className).toMatch(/es-solapada/);

    editarLaPropia();
    expect(pasoActual()).toBe('Paso 6 de 7');

    reagendarA('11:00');
    expect(pasoActual()).toBe('Paso 7 de 7');
    // Resuelto: ya no hay bloque solapado.
    expect(citaEnPantalla('cita-demo-robot')?.className).not.toMatch(/es-solapada/);

    confirmarConRecordatorio();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(typeof resultado.tiempoSegundos).toBe('number');

    expect(screen.getByText(/Guardián de la Agenda/)).not.toBeNull();
  });

  it('al terminar, el botón de la insignia llama al anfitrión', () => {
    const alSalir = jest.fn();
    montar({ alSalir });

    abrirYLlenarDatos();
    invitarYGuardar();
    abrirYAceptarInvitacion();
    editarLaPropia();
    reagendarA('11:00');
    confirmarConRecordatorio();

    fireEvent.click(screen.getByText('Salir del laboratorio'));
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('salir a media clase no revienta y no llama a onComplete', () => {
    const alSalir = jest.fn();
    const { onComplete } = montar({ alSalir });

    abrirYLlenarDatos();
    invitarYGuardar();

    fireEvent.click(screen.getByText('Salir'));
    expect(alSalir).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

/* ── jugando mal a propósito ───────────────────────────────────────────── */

describe('of-m365-calendario, jugando mal a propósito', () => {
  it('un formulario a medio llenar no avanza: título, día y hora se validan uno por uno', () => {
    const { onScore } = montar();
    pulsar('calx-nueva-cita');

    // Nada escrito todavía.
    pulsar('calx-siguiente-invitados');
    expect(avisoActual()).toMatch(/Demostración Robot/);
    expect(pasoActual()).toBe('Paso 2 de 7');
    expect(onScore).toHaveBeenLastCalledWith(94);

    // Título correcto, pero el día y la hora siguen sin llenar.
    escribir('calx-input-titulo', 'Demostración Robot');
    pulsar('calx-siguiente-invitados');
    expect(avisoActual()).toMatch(/Miércoles/);
    expect(pasoActual()).toBe('Paso 2 de 7');

    // Día correcto, hora todavía sin llenar.
    elegir('calx-select-dia', MIERCOLES);
    pulsar('calx-siguiente-invitados');
    expect(avisoActual()).toMatch(/10:00 a 10:30/);

    // Ahora sí, completo y correcto.
    elegir('calx-select-inicio', '10:00');
    elegir('calx-select-fin', '10:30');
    pulsar('calx-siguiente-invitados');
    expect(pasoActual()).toBe('Paso 3 de 7');
  });

  it('«Guardar cita» sin invitar al profesor no crea la cita', () => {
    montar();
    abrirYLlenarDatos();

    pulsar('calx-guardar-cita');
    expect(avisoActual()).toMatch(/profesor@tecnia\.edu/);
    expect(citaEnPantalla('cita-demo-robot')).toBeNull();

    invitarYGuardar();
    expect(citaEnPantalla('cita-demo-robot')).not.toBeNull();
  });

  it('rechazar la invitación no avanza; hay que aceptarla', () => {
    montar();
    abrirYLlenarDatos();
    invitarYGuardar();

    pulsar('calx-notif-abrir');
    pulsar('calx-notif-rechazar');
    expect(avisoActual()).toMatch(/Tenemos que aceptar/);
    expect(pasoActual()).toBe('Paso 4 de 7');
    expect(citaEnPantalla('cita-jurado')).toBeNull();

    pulsar('calx-notif-aceptar');
    expect(citaEnPantalla('cita-jurado')).not.toBeNull();
  });

  it('editar la cita ajena («Reunión Jurado») en vez de la propia no avanza', () => {
    montar();
    abrirYLlenarDatos();
    invitarYGuardar();
    abrirYAceptarInvitacion();

    const jurado = citaEnPantalla('cita-jurado');
    if (!jurado) throw new Error('no está «Reunión Jurado» en la parrilla');
    fireEvent.click(jurado);
    expect(avisoActual()).toMatch(/Coordinación/);
    expect(pasoActual()).toBe('Paso 5 de 7');
    expect(screen.queryByTestId('calx-select-reagendar')).toBeNull();

    editarLaPropia();
    expect(screen.queryByTestId('calx-select-reagendar')).not.toBeNull();
  });

  it('reagendar dejando la MISMA hora sigue chocando y no resuelve el encargo, aunque el armazón lo acepte como cambio válido', () => {
    montar();
    abrirYLlenarDatos();
    invitarYGuardar();
    abrirYAceptarInvitacion();
    editarLaPropia();

    reagendarA('10:00'); // no-op: exactamente la misma hora que ya tenía
    expect(avisoActual()).toMatch(/Sigue chocando/);
    expect(pasoActual()).toBe('Paso 6 de 7');
    expect(citaEnPantalla('cita-demo-robot')?.className).toMatch(/es-solapada/);

    reagendarA('11:00'); // ahora sí resuelve
    expect(pasoActual()).toBe('Paso 7 de 7');
    expect(citaEnPantalla('cita-demo-robot')?.className).not.toMatch(/es-solapada/);
  });

  it('«Confirmar Agenda» sin activar el recordatorio no cierra la clase', () => {
    const { onComplete } = montar();
    abrirYLlenarDatos();
    invitarYGuardar();
    abrirYAceptarInvitacion();
    editarLaPropia();
    reagendarA('11:00');

    pulsar('calx-confirmar-agenda');
    expect(avisoActual()).toMatch(/Activa el recordatorio/);
    expect(onComplete).not.toHaveBeenCalled();

    confirmarConRecordatorio();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cada tropiezo resta 6 puntos, con piso en 60', () => {
    const { onScore, onComplete } = montar();

    // Cinco errores: 100 - 5*6 = 70.
    pulsar('calx-nueva-cita');
    pulsar('calx-siguiente-invitados'); // 1: sin título
    escribir('calx-input-titulo', 'Demostración Robot');
    pulsar('calx-siguiente-invitados'); // 2: sin día
    elegir('calx-select-dia', MIERCOLES);
    pulsar('calx-siguiente-invitados'); // 3: sin horas
    elegir('calx-select-inicio', '10:00');
    elegir('calx-select-fin', '10:30');
    pulsar('calx-siguiente-invitados'); // ya completo, avanza sin error
    pulsar('calx-guardar-cita'); // 4: sin invitado
    invitarYGuardar();
    abrirYAceptarInvitacion();
    editarLaPropia();
    reagendarA('10:00'); // 5: sigue chocando

    expect(onScore).toHaveBeenLastCalledWith(70);

    reagendarA('11:00');
    confirmarConRecordatorio();

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(70);
    expect(resultado.errores).toBe(5);
  });
});
