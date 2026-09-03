/**
 * TECNIA MURO · el armazón de las 8 actividades de red social.
 *
 * Se prueba en tres alturas, como `simulador-asistente.test.tsx`: los datos
 * puros (`publicacionesVisibles`), la máquina (`useMuro`) y la ventana
 * (`VentanaMuro`, que no debe ofrecer ni un control sin que se lo pidan).
 *
 * Y se prueba JUGANDO MAL: publicar vacío, publicar cien veces, dar «me
 * gusta» mil veces, borrar algo ya borrado, comentar en una publicación que
 * ya no está, y abrir el perfil de un autor sin publicaciones.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  publicacionesVisibles,
  type AutorMuro,
  type PublicacionMuro,
} from '@/components/simuladores/muro/tiposMuro';
import { useMuro } from '@/components/simuladores/muro/useMuro';
import { VentanaMuro } from '@/components/simuladores/muro/VentanaMuro';

const SOFI: AutorMuro = { id: 'sofi', nombre: 'Sofi', usuario: '@sofi', esAlumno: true };
const DIEGO: AutorMuro = { id: 'diego', nombre: 'Diego', usuario: '@diego' };
const DESCONOCIDO: AutorMuro = { id: 'x1', nombre: 'Persona desconocida' };

function publicacion(
  parcial: Partial<PublicacionMuro> & { id: string; autor: AutorMuro; texto: string },
): PublicacionMuro {
  return {
    fecha: 'hace 1 día',
    visibilidad: 'publico',
    meGusta: 0,
    comentarios: [],
    compartidos: 0,
    acciones: ['me-gusta', 'comentar', 'compartir', 'reportar', 'borrar'],
    copiasSobrevivientes: [],
    ...parcial,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros', () => {
  it('publicacionesVisibles esconde lo borrado por omisión y respeta el filtro de visibilidad', () => {
    const datos = [
      publicacion({ id: 'a', autor: SOFI, texto: 'a', visibilidad: 'publico' }),
      publicacion({ id: 'b', autor: SOFI, texto: 'b', visibilidad: 'amigos' }),
      publicacion({ id: 'c', autor: SOFI, texto: 'c', borrada: true }),
    ];
    expect(publicacionesVisibles(datos).map((p) => p.id)).toEqual(['a', 'b']);
    expect(publicacionesVisibles(datos, { incluirBorradas: true }).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(publicacionesVisibles(datos, { visibilidad: ['publico'] }).map((p) => p.id)).toEqual(['a']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina del muro (useMuro)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina del muro', () => {
  it('publicar agrega al frente con el alumno como autor por omisión', () => {
    const { result } = renderHook(() => useMuro({ alumno: SOFI }));
    act(() => {
      expect(result.current.publicar({ texto: 'Hola muro' })).toBe('publicada');
    });
    expect(result.current.publicaciones).toHaveLength(1);
    expect(result.current.publicaciones[0]).toMatchObject({ autor: SOFI, texto: 'Hola muro', meGusta: 0 });
    expect(result.current.publicaciones[0].borrada).toBeUndefined();
  });

  it('publicar vacío (o sólo espacios) no agrega nada — jugar MAL', () => {
    const { result } = renderHook(() => useMuro({ alumno: SOFI }));
    act(() => {
      expect(result.current.publicar({ texto: '' })).toBe('vacia');
      expect(result.current.publicar({ texto: '   \n ' })).toBe('vacia');
    });
    expect(result.current.publicaciones).toHaveLength(0);
  });

  it('publicar cien veces da cien publicaciones con ids únicos — jugar MAL con volumen', () => {
    const { result } = renderHook(() => useMuro({ alumno: SOFI }));
    act(() => {
      for (let i = 0; i < 100; i++) result.current.publicar({ texto: `post ${i}` });
    });
    expect(result.current.publicaciones).toHaveLength(100);
    expect(new Set(result.current.publicaciones.map((p) => p.id)).size).toBe(100);
  });

  it('dar «me gusta» mil veces alterna sin desincronizar el contador — jugar MAL', () => {
    const { result } = renderHook(() =>
      useMuro({ alumno: SOFI, publicaciones: [publicacion({ id: 'p1', autor: DIEGO, texto: 'x' })] }),
    );
    act(() => {
      for (let i = 0; i < 1000; i++) result.current.darMeGusta('p1');
    });
    // 1000 clics (par): el interruptor vuelve exactamente a donde empezó.
    const final = result.current.publicaciones[0];
    expect(final.meGustaDelAlumno).toBe(false);
    expect(final.meGusta).toBe(0);
  });

  it('las acciones sobre un id inexistente devuelven "no-existe" y no rompen nada — jugar MAL', () => {
    const { result } = renderHook(() => useMuro({ alumno: SOFI }));
    act(() => {
      expect(result.current.darMeGusta('fantasma')).toBe('no-existe');
      expect(result.current.comentar('fantasma', 'hola')).toBe('no-existe');
      expect(result.current.compartir('fantasma')).toBe('no-existe');
      expect(result.current.reportar('fantasma')).toBe('no-existe');
      expect(result.current.cambiarVisibilidad('fantasma', 'amigos')).toBe('no-existe');
      expect(result.current.borrar('fantasma')).toBe('no-existe');
    });
    expect(result.current.publicaciones).toHaveLength(0);
  });

  it('comentar vacío no agrega comentario', () => {
    const { result } = renderHook(() =>
      useMuro({ alumno: SOFI, publicaciones: [publicacion({ id: 'p1', autor: DIEGO, texto: 'x' })] }),
    );
    act(() => {
      expect(result.current.comentar('p1', '   ')).toBe('vacio');
    });
    expect(result.current.publicaciones[0].comentarios).toHaveLength(0);
  });

  it('«borrar no borra»: la publicación se queda en los datos, y borrar otra vez es idempotente — jugar MAL', () => {
    const { result } = renderHook(() =>
      useMuro({ alumno: SOFI, publicaciones: [publicacion({ id: 'p1', autor: SOFI, texto: 'ups' })] }),
    );
    act(() => {
      expect(result.current.borrar('p1')).toBe('ok');
    });
    expect(result.current.publicaciones).toHaveLength(1); // sigue en el arreglo
    expect(result.current.publicaciones[0].borrada).toBe(true);

    act(() => {
      expect(result.current.borrar('p1')).toBe('borrada'); // ya estaba
    });
    expect(result.current.publicaciones).toHaveLength(1);
  });

  it('comentar en algo ya borrado se rechaza, pero `inyectarConsecuencia` sí puede tocarlo', () => {
    const { result } = renderHook(() =>
      useMuro({ alumno: SOFI, publicaciones: [publicacion({ id: 'p1', autor: SOFI, texto: 'ups' })] }),
    );
    act(() => {
      result.current.borrar('p1');
    });
    act(() => {
      // jugar MAL: el alumno intenta comentar algo que él mismo borró.
      expect(result.current.comentar('p1', 'esto no debería colar')).toBe('borrada');
    });
    act(() => {
      result.current.inyectarConsecuencia({
        tipo: 'copia',
        publicacionId: 'p1',
        copia: { texto: 'Diego le tomó captura hace 2 días' },
      });
      result.current.inyectarConsecuencia({ tipo: 'compartido', publicacionId: 'p1', cantidad: 3 });
    });
    const final = result.current.publicaciones[0];
    expect(final.borrada).toBe(true);
    expect(final.comentarios).toHaveLength(0); // el intento del alumno no coló
    expect(final.copiasSobrevivientes).toHaveLength(1);
    expect(final.copiasSobrevivientes[0].texto).toContain('Diego');
    expect(final.compartidos).toBe(3);
  });

  it('perfilDe de un autor sin publicaciones no truena: perfil vacío, no null — jugar MAL', () => {
    const { result } = renderHook(() => useMuro({ alumno: SOFI }));
    const perfil = result.current.perfilDe(DESCONOCIDO);
    expect(perfil.autor).toBe(DESCONOCIDO);
    expect(perfil.publicaciones).toEqual([]);
    expect(perfil.pistas).toEqual([]);
  });

  it('perfilDe respeta el filtro de visibilidad de quien mira', () => {
    const { result } = renderHook(() =>
      useMuro({
        alumno: SOFI,
        publicaciones: [
          publicacion({ id: 'pub', autor: DIEGO, texto: 'público', visibilidad: 'publico' }),
          publicacion({ id: 'priv', autor: DIEGO, texto: 'privado', visibilidad: 'solo-yo' }),
        ],
      }),
    );
    const comoExtrano = result.current.perfilDe(DIEGO, { visibilidad: ['publico'] });
    expect(comoExtrano.publicaciones.map((p) => p.id)).toEqual(['pub']);

    const comoDueno = result.current.perfilDe(DIEGO);
    expect(comoDueno.publicaciones.map((p) => p.id).sort()).toEqual(['priv', 'pub']);
  });

  it('reiniciar regresa al arreglo inicial', () => {
    const inicial = [publicacion({ id: 'p1', autor: SOFI, texto: 'semilla' })];
    const { result } = renderHook(() => useMuro({ alumno: SOFI, publicaciones: inicial }));
    act(() => {
      result.current.publicar({ texto: 'nueva' });
    });
    expect(result.current.publicaciones).toHaveLength(2);
    act(() => {
      result.current.reiniciar();
    });
    expect(result.current.publicaciones).toEqual(inicial);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaMuro)
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana', () => {
  it('sin compositor, sin acciones en los datos y sin `onAbrirPerfil` no ofrece NI UN control', () => {
    const datos = [publicacion({ id: 'p1', autor: DIEGO, texto: 'hola', acciones: [] })];
    const { container } = render(<VentanaMuro publicaciones={datos} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(screen.getByText('hola')).toBeInTheDocument();
  });

  it('sólo pinta los botones de acción que la publicación trae en `acciones`', () => {
    const datos = [publicacion({ id: 'p1', autor: DIEGO, texto: 'hola', acciones: ['me-gusta', 'reportar'] })];
    const { container } = render(<VentanaMuro publicaciones={datos} onAccion={jest.fn()} />);
    expect(container.querySelectorAll('[data-accion]')).toHaveLength(2);
    expect(container.querySelector('[data-accion="me-gusta"]')).toBeInTheDocument();
    expect(container.querySelector('[data-accion="comentar"]')).toBeNull();
    expect(container.querySelector('[data-accion="borrar"]')).toBeNull();
  });

  it('una publicación borrada se pinta fantasma con sus copias, sin texto ni botones de acción', () => {
    const datos = [
      publicacion({
        id: 'p1',
        autor: SOFI,
        texto: 'esto no debería verse',
        borrada: true,
        copiasSobrevivientes: [{ id: 'k1', texto: 'Diego le tomó captura' }],
      }),
    ];
    const { container } = render(<VentanaMuro publicaciones={datos} onAccion={jest.fn()} />);
    expect(screen.queryByText('esto no debería verse')).toBeNull();
    expect(screen.getByText('Diego le tomó captura')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-accion]')).toHaveLength(0);
  });

  it('el compositor no deja publicar con el cuadro vacío, ni con cien clics', () => {
    const publicarFn = jest.fn();
    render(<VentanaMuro compositor={{ valor: '', onCambiar: () => {}, onPublicar: publicarFn }} />);
    const boton = screen.getByTestId('muro-compositor-enviar');
    expect(boton).toBeDisabled();
    for (let i = 0; i < 100; i++) fireEvent.click(boton);
    expect(publicarFn).not.toHaveBeenCalled();
  });

  it('abrir perfil dispara `onAbrirPerfil` con el autor completo', () => {
    const abrir = jest.fn();
    const datos = [publicacion({ id: 'p1', autor: DIEGO, texto: 'hola' })];
    const { container } = render(<VentanaMuro publicaciones={datos} onAbrirPerfil={abrir} />);
    fireEvent.click(container.querySelector('.tm-avatar')!);
    expect(abrir).toHaveBeenCalledWith(DIEGO);
  });

  it('la vista `perfil` no truena con un autor sin publicaciones', () => {
    render(<VentanaMuro vista="perfil" perfil={{ autor: DESCONOCIDO, publicaciones: [], pistas: [] }} />);
    expect(screen.getByText('Todavía no hay nada publicado aquí.')).toBeInTheDocument();
  });

  it('de punta a punta: publicar, dar «me gusta», comentar, borrar, y ver que sobrevive con su copia', () => {
    function Clase() {
      const muro = useMuro({ alumno: SOFI });
      const [texto, setTexto] = useState('');
      const [comentario, setComentario] = useState('');
      const [comentandoId, setComentandoId] = useState<string | null>(null);
      return (
        <VentanaMuro
          publicaciones={muro.visibles({ incluirBorradas: true })}
          compositor={{
            valor: texto,
            onCambiar: setTexto,
            onPublicar: () => {
              muro.publicar({ texto });
              setTexto('');
            },
          }}
          comentando={
            comentandoId
              ? {
                  publicacionId: comentandoId,
                  valor: comentario,
                  onCambiar: setComentario,
                  onEnviar: () => {
                    muro.comentar(comentandoId, comentario);
                    setComentario('');
                    setComentandoId(null);
                  },
                }
              : null
          }
          onAccion={(accion, id) => {
            if (accion === 'me-gusta') muro.darMeGusta(id);
            else if (accion === 'comentar') setComentandoId(id);
            else if (accion === 'borrar') {
              muro.borrar(id);
              muro.inyectarConsecuencia({
                tipo: 'copia',
                publicacionId: id,
                copia: { texto: 'Alguien ya la había visto' },
              });
            }
          }}
        />
      );
    }
    const { container } = render(<Clase />);
    fireEvent.change(screen.getByTestId('muro-compositor-cuadro'), { target: { value: 'Mi primera publicación' } });
    fireEvent.click(screen.getByTestId('muro-compositor-enviar'));
    expect(screen.getByText('Mi primera publicación')).toBeInTheDocument();

    const post = container.querySelector('[data-post]')!;
    fireEvent.click(post.querySelector('[data-accion="me-gusta"]')!);
    expect(post.querySelector('[data-accion="me-gusta"]')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(post.querySelector('[data-accion="comentar"]')!);
    fireEvent.change(screen.getByTestId('muro-comentar-cuadro'), { target: { value: 'qué bien' } });
    fireEvent.click(screen.getByTestId('muro-comentar-enviar'));
    expect(screen.getByText('qué bien')).toBeInTheDocument();

    fireEvent.click(post.querySelector('[data-accion="borrar"]')!);
    expect(post).toHaveAttribute('data-borrada', 'si');
    expect(screen.getByText('Alguien ya la había visto')).toBeInTheDocument();
  });
});
