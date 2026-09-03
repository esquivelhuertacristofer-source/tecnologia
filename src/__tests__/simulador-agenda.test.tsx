/**
 * TECNIA AGENDA · el armazón del calendario.
 *
 * Tres alturas: los datos puros, la máquina (`useAgenda`) y la ventana
 * (`VentanaAgenda`, que no debe ofrecer ni un control sin que se lo pidan).
 *
 * Y se prueba JUGANDO MAL: una cita que acaba antes de empezar, una que no
 * dura nada, un 30 de febrero, dos citas idénticas, invitar dos veces a la
 * misma persona, contestar una invitación que no se recibió y mover una cita
 * que ya no está.
 *
 * REGLA DURA: en este archivo no hay ni un `Date.now()` ni un `new Date()` sin
 * argumentos. Todas las fechas son literales. Si no fuera así, estas pruebas
 * pasarían hoy y fallarían mañana sin que nadie supiera por qué.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  crearCita,
  cuentaInvitados,
  diaValido,
  disponerDia,
  invitar,
  moverCita,
  rejillaDelMes,
  responderInvitacion,
  revisarCita,
  seSolapan,
  semanaDe,
  type CitaAgenda,
  type PersonaAgenda,
} from '@/components/simuladores/agenda/tiposAgenda';
import { useAgenda } from '@/components/simuladores/agenda/useAgenda';
import { VentanaAgenda } from '@/components/simuladores/agenda/VentanaAgenda';

/* Sábado 20 de marzo de 2027 y el lunes de su semana. Dos literales.
   A propósito NO son la fecha de hoy: si lo fueran, un armazón que leyera el
   reloj en vez del parámetro pasaría estas pruebas sin que se notara — y ése
   es justo el defecto que hay que cazar. */
const HOY = '2027-03-20';
const LUNES = '2027-03-15';

const SOFI: PersonaAgenda = { id: 'sofi', nombre: 'Sofi' };
const DIEGO: PersonaAgenda = { id: 'diego', nombre: 'Diego' };

function cita(parcial: Partial<CitaAgenda> & { id: string; titulo: string }): CitaAgenda {
  return { dia: LUNES, inicio: '10:00', fin: '11:00', invitados: [], ...parcial };
}

const ENSAYO = cita({ id: 'c1', titulo: 'Ensayo de la obra', inicio: '10:00', fin: '11:30', lugar: 'Patio' });
const CIENCIAS = cita({ id: 'c2', titulo: 'Club de ciencias', inicio: '11:00', fin: '12:00' });
const RECREO = cita({ id: 'c3', titulo: 'Recreo', inicio: '11:30', fin: '12:00' });

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros', () => {
  it('JUGAR MAL · una cita que acaba antes de empezar, o que no dura nada', () => {
    const base = { titulo: 'Ensayo', dia: LUNES };
    expect(revisarCita({ ...base, inicio: '10:00', fin: '11:00' })).toEqual({ ok: true });
    expect(revisarCita({ ...base, inicio: '11:00', fin: '10:00' })).toMatchObject({
      ok: false,
      motivo: 'fin-antes-de-inicio',
    });
    expect(revisarCita({ ...base, inicio: '10:00', fin: '10:00' })).toMatchObject({ ok: false, motivo: 'sin-duracion' });
    expect(revisarCita({ ...base, inicio: '25:00', fin: '26:00' })).toMatchObject({ ok: false, motivo: 'hora-invalida' });
    expect(revisarCita({ ...base, titulo: '  ', inicio: '10:00', fin: '11:00' })).toMatchObject({
      ok: false,
      motivo: 'sin-titulo',
    });
  });

  it('JUGAR MAL · un 30 de febrero pasa el patrón pero no existe en el calendario', () => {
    expect(diaValido('2026-02-28')).toBe(true);
    expect(diaValido('2026-02-30')).toBe(false);
    expect(diaValido('2026-13-01')).toBe(false);
    expect(diaValido('15/08/2026')).toBe(false);
    expect(revisarCita({ titulo: 'X', dia: '2026-02-30', inicio: '10:00', fin: '11:00' })).toMatchObject({
      ok: false,
      motivo: 'dia-invalido',
    });
  });

  it('solaparse es chocar de verdad; tocarse por el borde no lo es', () => {
    expect(seSolapan(ENSAYO, CIENCIAS)).toBe(true); // 10:00–11:30 contra 11:00–12:00
    expect(seSolapan(ENSAYO, RECREO)).toBe(false); // acaba 11:30, empieza 11:30
    expect(seSolapan(ENSAYO, { ...CIENCIAS, dia: '2027-03-16' })).toBe(false); // otro día
    expect(seSolapan(ENSAYO, ENSAYO)).toBe(false); // consigo misma, nunca
  });

  it('JUGAR MAL · dos citas idénticas se crean y SE VEN: cada una en su carril', () => {
    const gemela = { ...ENSAYO, id: 'c1b' };
    const puestas = disponerDia([ENSAYO, gemela], LUNES);
    expect(puestas).toHaveLength(2);
    expect(puestas.map((p) => p.carril)).toEqual([0, 1]);
    expect(puestas.every((p) => p.carriles === 2)).toBe(true); // media anchura cada una
  });

  it('disponerDia devuelve el ancho entero cuando no hay choque', () => {
    const puestas = disponerDia([ENSAYO, RECREO], LUNES);
    expect(puestas.map((p) => p.carriles)).toEqual([1, 1]);
    expect(disponerDia([ENSAYO], '2027-03-16')).toEqual([]); // otro día: nada
    // Y las devuelve ordenadas por hora, no en el orden en que llegaron.
    expect(disponerDia([RECREO, ENSAYO], LUNES).map((p) => p.cita.id)).toEqual(['c1', 'c3']);
  });

  it('la semana empieza en lunes y el mes son 42 casillas, siempre', () => {
    expect(semanaDe(HOY)).toEqual([
      '2027-03-15',
      '2027-03-16',
      '2027-03-17',
      '2027-03-18',
      '2027-03-19',
      '2027-03-20',
      '2027-03-21',
    ]);
    expect(semanaDe('2027-03-21')[0]).toBe(LUNES); // el domingo cierra su semana, no abre la siguiente
    const rejilla = rejillaDelMes(HOY);
    expect(rejilla).toHaveLength(42);
    expect(rejilla).toContain('2027-03-01');
    expect(rejilla).toContain('2027-03-31');
  });

  it('mover conserva la duración; a un hueco imposible no se mueve nada', () => {
    const citas = [ENSAYO, CIENCIAS];
    const r = moverCita(citas, 'c1', { dia: '2027-03-17', inicio: '09:00' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cita).toMatchObject({ dia: '2027-03-17', inicio: '09:00', fin: '10:30' }); // sigue durando 1h30
    expect(citas[0].dia).toBe(LUNES); // el original, intacto

    expect(moverCita(citas, 'c1', { fin: '09:00' })).toMatchObject({ ok: false, motivo: 'fin-antes-de-inicio' });
    expect(moverCita(citas, 'fantasma', { inicio: '09:00' })).toMatchObject({ ok: false, motivo: 'no-existe' });
    // Mover al mismo sitio no cambia la lista: identidad.
    const quieta = moverCita(citas, 'c1', { dia: LUNES, inicio: '10:00' });
    expect(quieta.ok && quieta.citas).toBe(citas);
  });

  it('JUGAR MAL · invitar dos veces a la misma persona no le borra su respuesta', () => {
    const uno = invitar(ENSAYO, DIEGO);
    expect(uno.ok).toBe(true);
    if (!uno.ok) return;
    const dicho = responderInvitacion(uno.cita, 'diego', 'rechaza');
    expect(dicho.ok).toBe(true);
    if (!dicho.ok) return;

    const otra = invitar(dicho.cita, DIEGO);
    expect(otra).toMatchObject({ ok: false, motivo: 'ya-invitado' });
    expect(otra.cita.invitados).toHaveLength(1);
    expect(otra.cita.invitados[0].respuesta).toBe('rechaza'); // su «no puedo» sigue en pie
  });

  it('JUGAR MAL · contestar una invitación que no se recibió', () => {
    expect(responderInvitacion(ENSAYO, 'diego', 'acepta')).toMatchObject({ ok: false, motivo: 'no-invitado' });
    const con = invitar(ENSAYO, SOFI);
    if (!con.ok) return;
    expect(cuentaInvitados(con.cita)).toEqual({ pendiente: 1, acepta: 0, rechaza: 0 });
    // Repetir la misma respuesta es una no-operación: misma cita por identidad.
    const igual = responderInvitacion(con.cita, 'sofi', 'pendiente');
    expect(igual.ok && igual.cita).toBe(con.cita);
  });

  it('crear rechaza el id repetido y admite una cita sin invitados ni lugar', () => {
    const r = crearCita([ENSAYO], { id: 'c9', titulo: 'Junta', dia: LUNES, inicio: '08:00', fin: '08:30' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cita.invitados).toEqual([]);
    expect(crearCita(r.citas, { id: 'c9', titulo: 'Otra', dia: LUNES, inicio: '09:00', fin: '09:30' })).toMatchObject({
      ok: false,
      motivo: 'id-repetido',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useAgenda)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina de la agenda', () => {
  const montar = () => renderHook(() => useAgenda({ hoy: HOY, citas: [ENSAYO, CIENCIAS] }));

  it('arranca en la semana de hoy y las flechas la mueven siete días de golpe', () => {
    const { result } = montar();
    expect(result.current.dia).toBe(HOY);
    expect(result.current.semana[0]).toBe(LUNES);
    act(() => {
      result.current.avanzar(1);
    });
    expect(result.current.dia).toBe('2027-03-27');
    act(() => {
      result.current.avanzar(-2);
    });
    expect(result.current.dia).toBe('2027-03-13');
  });

  it('choquesDe encuentra el solape que el alumno viene a resolver', () => {
    const { result } = montar();
    expect(result.current.choquesDe('c1').map((c) => c.id)).toEqual(['c2']);
    act(() => {
      result.current.mover('c2', { inicio: '11:30', fin: '12:30' });
    });
    expect(result.current.choquesDe('c1')).toEqual([]);
    expect(result.current.choquesDe('fantasma')).toEqual([]);
  });

  it('JUGAR MAL · crear una cita imposible no toca la agenda', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.crear({ id: 'cX', titulo: 'Al revés', dia: LUNES, inicio: '12:00', fin: '11:00' })).toMatchObject({
        ok: false,
        motivo: 'fin-antes-de-inicio',
      });
    });
    expect(result.current.citas).toHaveLength(2);
  });

  it('borrar una cita la quita y suelta la selección si era la elegida', () => {
    const { result } = montar();
    act(() => {
      result.current.seleccionar('c1');
    });
    expect(result.current.seleccionada?.titulo).toBe('Ensayo de la obra');
    act(() => {
      result.current.borrar('c1');
    });
    expect(result.current.seleccionId).toBeNull();
    expect(result.current.citas.map((c) => c.id)).toEqual(['c2']);
  });

  it('invitar y contestar viajan al estado; una cita que no existe se rechaza', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.invitarA('c1', DIEGO).ok).toBe(true);
    });
    act(() => {
      expect(result.current.responder('c1', 'diego', 'acepta').ok).toBe(true);
    });
    expect(result.current.citas[0].invitados[0]).toEqual({ persona: DIEGO, respuesta: 'acepta' });
    act(() => {
      expect(result.current.invitarA('fantasma', DIEGO)).toMatchObject({ ok: false, motivo: 'no-existe' });
      expect(result.current.responder('fantasma', 'diego', 'acepta')).toMatchObject({ ok: false, motivo: 'no-existe' });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaAgenda)
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana de la agenda', () => {
  const gemela = { ...ENSAYO, id: 'c1b' };

  it('la vista de semana pinta siete columnas y marca la de hoy', () => {
    render(<VentanaAgenda citas={[ENSAYO]} hoy={HOY} dia={HOY} />);
    const columnas = screen.getAllByTestId('agenda-columna');
    expect(columnas).toHaveLength(7);
    expect(columnas.filter((c) => c.className.includes('es-hoy')).map((c) => c.dataset.dia)).toEqual([HOY]);
    expect(screen.getByTestId('agenda-cita').textContent).toContain('Ensayo de la obra');
  });

  it('dos citas a la misma hora salen las DOS, a media anchura cada una', () => {
    render(<VentanaAgenda citas={[ENSAYO, gemela]} hoy={HOY} dia={HOY} />);
    const bloques = screen.getAllByTestId('agenda-cita');
    expect(bloques).toHaveLength(2);
    expect(bloques.map((b) => b.dataset.carriles)).toEqual(['2', '2']);
    expect(bloques.map((b) => b.dataset.carril)).toEqual(['0', '1']);
    expect(bloques.every((b) => b.className.includes('es-solapada'))).toBe(true);
  });

  it('la vista de mes son 42 casillas y las de fuera del mes se apagan', () => {
    render(<VentanaAgenda citas={[ENSAYO]} hoy={HOY} dia={HOY} vista="mes" />);
    const casillas = screen.getAllByTestId('agenda-casilla');
    expect(casillas).toHaveLength(42);
    expect(casillas.filter((c) => c.className.includes('es-fuera')).length).toBeGreaterThan(0);
    expect(screen.getByTestId('agenda-cita').textContent).toContain('Ensayo de la obra');
  });

  it('sin manejadores no hay ni flechas ni botones de vista, y las citas no se pulsan', () => {
    const { rerender } = render(<VentanaAgenda citas={[ENSAYO]} hoy={HOY} dia={HOY} />);
    expect(screen.queryByTestId('agenda-adelante')).toBeNull();
    expect(screen.getByTestId('agenda-cita').tagName).toBe('SPAN');

    const saltos: number[] = [];
    const pulsadas: string[] = [];
    rerender(
      <VentanaAgenda
        citas={[ENSAYO]}
        hoy={HOY}
        dia={HOY}
        onAvanzar={(s) => saltos.push(s)}
        onCita={(id) => pulsadas.push(id)}
      />,
    );
    fireEvent.click(screen.getByTestId('agenda-adelante'));
    fireEvent.click(screen.getByTestId('agenda-cita'));
    expect(saltos).toEqual([1]);
    expect(pulsadas).toEqual(['c1']);
  });
});
