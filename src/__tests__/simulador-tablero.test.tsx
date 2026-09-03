/**
 * TECNIA TABLERO · el armazón del tablero de tareas por columnas.
 *
 * Tres alturas: los datos puros, la máquina (`useTablero`) y la ventana
 * (`VentanaTablero`, que no debe ofrecer ni un control sin que se lo pidan).
 *
 * Y se prueba JUGANDO MAL: mover una tarjeta a una columna que no existe,
 * moverla a la que ya está, borrar la columna donde hay tarjetas, mandarla a
 * un destino inventado, crear una tarjeta sin título y empujar la última
 * tarjeta más allá de la última columna.
 *
 * NO hay ni una prueba de arrastre, y es a propósito: jsdom no implementa
 * `PointerEvent` y `getBoundingClientRect` devuelve ceros, así que una prueba
 * de arrastre escrita de la forma natural pasa en verde sin comprobar nada.
 * Mover es `moverTarjeta`, una función pura, y se prueba como tal.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  borrarColumna,
  crearTarjeta,
  editarTarjeta,
  estadoFecha,
  moverTarjeta,
  tarjetasDe,
  tarjetasSinFecha,
  tarjetasSinResponsable,
  type ColumnaTablero,
  type DatosTablero,
  type PersonaTablero,
  type TarjetaTablero,
} from '@/components/simuladores/tablero/tiposTablero';
import { useTablero } from '@/components/simuladores/tablero/useTablero';
import { VentanaTablero } from '@/components/simuladores/tablero/VentanaTablero';

/* El día de hoy es un DATO, nunca el reloj. Y a propósito NO es la fecha de
   hoy de verdad: si lo fuera, un armazón que leyera el reloj en vez del
   parámetro pasaría estas pruebas sin que se notara. */
const HOY = '2027-03-20';

const SOFI: PersonaTablero = { id: 'sofi', nombre: 'Sofi', avatar: '🦊' };
const DIEGO: PersonaTablero = { id: 'diego', nombre: 'Diego' };

const COLUMNAS: ColumnaTablero[] = [
  { id: 'por-hacer', titulo: 'Por hacer' },
  { id: 'haciendo', titulo: 'Haciendo' },
  { id: 'hecho', titulo: 'Hecho' },
];

function tarjeta(parcial: Partial<TarjetaTablero> & { id: string; columnaId: string; titulo: string }): TarjetaTablero {
  return { etiquetas: [], ...parcial };
}

const SEMILLA: TarjetaTablero[] = [
  tarjeta({ id: 't1', columnaId: 'por-hacer', titulo: 'Buscar fotos', responsable: SOFI, fecha: '2027-03-25' }),
  tarjeta({ id: 't2', columnaId: 'por-hacer', titulo: 'Escribir el guion', fecha: '2027-03-10' }),
  tarjeta({ id: 't3', columnaId: 'haciendo', titulo: 'Montar la maqueta', responsable: DIEGO }),
];

const DATOS: DatosTablero = { columnas: COLUMNAS, tarjetas: SEMILLA };

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros', () => {
  it('mover deja la tarjeta en la columna nueva y la quita de la vieja', () => {
    const r = moverTarjeta(DATOS, 't1', 'hecho');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(tarjetasDe(r.datos, 'hecho').map((t) => t.id)).toEqual(['t1']);
    expect(tarjetasDe(r.datos, 'por-hacer').map((t) => t.id)).toEqual(['t2']);
    expect(r.datos.tarjetas).toHaveLength(3); // ni se pierde ni se duplica
    expect(DATOS.tarjetas[0].columnaId).toBe('por-hacer'); // el original, intacto
  });

  it('JUGAR MAL · mover a una columna que no existe, o a la que ya está', () => {
    const fantasma = moverTarjeta(DATOS, 't1', 'archivado');
    expect(fantasma).toMatchObject({ ok: false, motivo: 'columna-no-existe' });
    expect(fantasma.datos).toBe(DATOS); // identidad: nada se tocó

    const mismo = moverTarjeta(DATOS, 't1', 'por-hacer');
    expect(mismo).toMatchObject({ ok: false, motivo: 'ya-esta-ahi' });

    const nadie = moverTarjeta(DATOS, 'fantasma', 'hecho');
    expect(nadie).toMatchObject({ ok: false, motivo: 'tarjeta-no-existe' });
  });

  it('JUGAR MAL · borrar la columna donde hay tarjetas se rechaza, y dice cuántas hay', () => {
    const r = borrarColumna(DATOS, 'por-hacer');
    expect(r).toMatchObject({ ok: false, motivo: 'tiene-tarjetas' });
    expect(r.aviso).toContain('2');
    expect(r.datos).toBe(DATOS);
    // Una columna vacía sí cae, sin más.
    expect(borrarColumna(DATOS, 'hecho').ok).toBe(true);
  });

  it('con destino, borrar la columna muda las tarjetas; un destino inventado se rechaza', () => {
    const r = borrarColumna(DATOS, 'por-hacer', { destino: 'haciendo' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mudadas).toBe(2);
    expect(r.datos.columnas.map((c) => c.id)).toEqual(['haciendo', 'hecho']);
    expect(tarjetasDe(r.datos, 'haciendo')).toHaveLength(3);

    expect(borrarColumna(DATOS, 'por-hacer', { destino: 'ninguna' })).toMatchObject({
      ok: false,
      motivo: 'destino-no-existe',
    });
    // Mudarlas a sí misma tampoco vale.
    expect(borrarColumna(DATOS, 'por-hacer', { destino: 'por-hacer' })).toMatchObject({ ok: false });
  });

  it('crear admite una tarjeta sin dueño y sin fecha, pero no sin título ni en columna fantasma', () => {
    const suelta = crearTarjeta(DATOS, { id: 't9', columnaId: 'hecho', titulo: 'Repartir el trabajo' });
    expect(suelta.ok).toBe(true);
    if (!suelta.ok) return;
    expect(suelta.tarjeta.responsable).toBeUndefined();
    expect(suelta.tarjeta.etiquetas).toEqual([]);

    expect(crearTarjeta(DATOS, { id: 'tX', columnaId: 'hecho', titulo: '   ' })).toMatchObject({
      ok: false,
      motivo: 'titulo-vacio',
    });
    expect(crearTarjeta(DATOS, { id: 'tX', columnaId: 'inventada', titulo: 'Algo' })).toMatchObject({
      ok: false,
      motivo: 'columna-no-existe',
    });
    expect(crearTarjeta(DATOS, { id: 't1', columnaId: 'hecho', titulo: 'Otra' })).toMatchObject({
      ok: false,
      motivo: 'id-repetido',
    });
  });

  it('editar devuelve el MISMO tablero cuando el cambio no cambia nada', () => {
    expect(editarTarjeta(DATOS, 't1', { titulo: 'Buscar fotos' })).toBe(DATOS);
    expect(editarTarjeta(DATOS, 'fantasma', { titulo: 'Nada' })).toBe(DATOS);
    const cambiado = editarTarjeta(DATOS, 't1', { responsable: DIEGO });
    expect(cambiado).not.toBe(DATOS);
    expect(cambiado.tarjetas.find((t) => t.id === 't1')?.responsable).toEqual(DIEGO);
  });

  it('quién hace qué y para cuándo: los dos selectores que enseñan el tablero', () => {
    expect(tarjetasSinResponsable(DATOS).map((t) => t.id)).toEqual(['t2']);
    expect(tarjetasSinFecha(DATOS).map((t) => t.id)).toEqual(['t3']);
  });

  it('estadoFecha recibe HOY por parámetro y por eso no caduca', () => {
    const [t1, t2, t3] = SEMILLA;
    expect(estadoFecha(t1, HOY)).toBe('proxima'); // vence el 2027-03-25
    expect(estadoFecha(t2, HOY)).toBe('vencida'); // venció el 2027-03-10
    expect(estadoFecha(t3, HOY)).toBe('sin-fecha');
    expect(estadoFecha(t1, '2027-03-25')).toBe('hoy');
    // El mismo dato leído otro día da otra cosa: eso es lo que se quiere.
    expect(estadoFecha(t2, '2027-03-01')).toBe('proxima');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useTablero)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina del tablero', () => {
  const montar = () => renderHook(() => useTablero({ columnas: COLUMNAS, tarjetas: SEMILLA }));

  it('mover con las flechas usa la misma regla que la función pura', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.moverVecina('t1', 1).ok).toBe(true);
    });
    expect(result.current.enColumna('haciendo').map((t) => t.id)).toEqual(['t3', 't1']);
    act(() => {
      expect(result.current.moverVecina('t1', -1).ok).toBe(true);
    });
    expect(result.current.enColumna('por-hacer').map((t) => t.id)).toEqual(['t2', 't1']);
  });

  it('JUGAR MAL · empujar más allá de la última columna, o antes de la primera', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.moverVecina('t1', -1)).toMatchObject({ ok: false, motivo: 'columna-no-existe' });
    });
    act(() => {
      result.current.mover('t1', 'hecho');
    });
    act(() => {
      const r = result.current.moverVecina('t1', 1);
      expect(r).toMatchObject({ ok: false });
      expect(r.aviso).toContain('última');
    });
    expect(result.current.tarjetas).toHaveLength(3);
  });

  it('columnasVecinas dice a dónde llevan las dos flechas, o null en las puntas', () => {
    const { result } = montar();
    expect(result.current.columnasVecinas('t1')).toEqual({ anterior: null, siguiente: COLUMNAS[1] });
    expect(result.current.columnasVecinas('t3')).toEqual({ anterior: COLUMNAS[0], siguiente: COLUMNAS[2] });
    expect(result.current.columnasVecinas('fantasma')).toEqual({ anterior: null, siguiente: null });
  });

  it('borrar una tarjeta la quita y suelta la selección si era la elegida', () => {
    const { result } = montar();
    act(() => {
      result.current.seleccionar('t1');
    });
    expect(result.current.seleccionada?.id).toBe('t1');
    act(() => {
      result.current.borrar('t1');
    });
    expect(result.current.seleccionId).toBeNull();
    expect(result.current.tarjetas.map((t) => t.id)).toEqual(['t2', 't3']);
  });

  it('los selectores de «sin dueño» y «sin fecha» siguen al estado, no a la semilla', () => {
    const { result } = montar();
    expect(result.current.sinResponsable.map((t) => t.id)).toEqual(['t2']);
    act(() => {
      result.current.editar('t2', { responsable: SOFI });
    });
    expect(result.current.sinResponsable).toEqual([]);
    expect(result.current.carga.find((c) => c.persona.id === 'sofi')?.tarjetas).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaTablero)
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana del tablero', () => {
  it('pinta cada tarjeta en su columna, con su cuenta', () => {
    render(<VentanaTablero datos={DATOS} />);
    expect(screen.getAllByTestId('tablero-columna')).toHaveLength(3);
    expect(screen.getAllByTestId('tablero-tarjeta')).toHaveLength(3);
    const porHacer = screen.getByTestId('tablero-columnas').querySelector('[data-columna="por-hacer"]')!;
    expect(porHacer.querySelectorAll('[data-testid="tablero-tarjeta"]')).toHaveLength(2);
    expect(porHacer.querySelector('[data-testid="tablero-cuenta"]')!.textContent).toBe('2');
  });

  it('sin `onMover` no hay flechas: la ventana no ofrece un control que nadie atiende', () => {
    const { rerender } = render(<VentanaTablero datos={DATOS} />);
    expect(screen.queryAllByTestId('tablero-adelante')).toHaveLength(0);
    expect(screen.queryAllByTestId('tablero-nueva')).toHaveLength(0);
    rerender(<VentanaTablero datos={DATOS} onMover={() => {}} />);
    expect(screen.getAllByTestId('tablero-adelante')).toHaveLength(3);
  });

  it('las flechas piden mover a la columna vecina, y se apagan en las puntas', () => {
    const movidas: [string, string][] = [];
    render(<VentanaTablero datos={DATOS} onMover={(t, c) => movidas.push([t, c])} />);
    const t1 = screen.getByTestId('tablero-columnas').querySelector('[data-tarjeta="t1"]')!;
    expect(t1.querySelector('[data-testid="tablero-atras"]')).toHaveProperty('disabled', true);
    fireEvent.click(t1.querySelector('[data-testid="tablero-adelante"]')!);
    expect(movidas).toEqual([['t1', 'haciendo']]);
  });

  it('una tarjeta sin responsable lo dice a la cara; con responsable, lo nombra', () => {
    render(<VentanaTablero datos={DATOS} />);
    const sinDueno = screen.getByTestId('tablero-columnas').querySelector('[data-tarjeta="t2"]')!;
    expect(sinDueno.querySelector('[data-sin-responsable="si"]')!.textContent).toBe('Sin responsable');
    const conDueno = screen.getByTestId('tablero-columnas').querySelector('[data-tarjeta="t1"]')!;
    expect(conDueno.querySelector('[data-testid="tablero-responsable"]')!.textContent).toContain('Sofi');
  });

  it('sin `hoy` no se pinta ningún estado de fecha; con `hoy`, la vencida se marca', () => {
    const { rerender } = render(<VentanaTablero datos={DATOS} />);
    expect(screen.getAllByTestId('tablero-fecha').every((e) => e.dataset.estado === 'sin-fecha')).toBe(true);
    rerender(<VentanaTablero datos={DATOS} hoy={HOY} />);
    const estados = screen.getAllByTestId('tablero-fecha').map((e) => e.dataset.estado);
    expect(estados).toEqual(['proxima', 'vencida']);
  });
});
