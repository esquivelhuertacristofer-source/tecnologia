/**
 * TECNIA NAVEGADOR · el armazón de las 6 actividades de navegador.
 *
 * Se prueba en tres alturas, como `simulador-muro.test.tsx`: los datos puros
 * (candado, la pila de atrás/adelante), la máquina (`useNavegador`) y la
 * ventana (`VentanaNavegador`, que no ofrece un panel que nadie pidió).
 *
 * Y se prueba JUGANDO MAL, tal como pide el encargo: atrás cien veces,
 * adelante sin haber ido atrás, navegar a una URL que no existe en el mapa,
 * cerrar la última pestaña, escribir una URL vacía, recargar cien veces, y
 * abrir treinta pestañas.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  estadoSeguridad,
  irAdelante,
  irAtras,
  navegarEnPestana,
  paginaDe,
  crearPestana,
  type MapaSitios,
  type PaginaWeb,
} from '@/components/simuladores/navegador/tiposNavegador';
import { useNavegador } from '@/components/simuladores/navegador/useNavegador';
import { VentanaNavegador } from '@/components/simuladores/navegador/VentanaNavegador';

const MAPA: MapaSitios = {
  'inicio.tecnia.mx': {
    url: 'inicio.tecnia.mx',
    pestana: 'Inicio',
    titulo: 'Tecnia — página de inicio',
    autor: null,
    fecha: null,
    cuerpo: { tipo: 'articulo', parrafos: ['Bienvenido a Tecnia.'] },
    enlaces: [{ etiqueta: 'Ir a la tienda', url: 'tienda.tecnia.mx/producto-1' }],
  },
  'tienda.tecnia.mx/producto-1': {
    url: 'tienda.tecnia.mx/producto-1',
    pestana: 'Tienda',
    titulo: 'Mochila espacial',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [{ etiqueta: 'Talla', valor: 'Única' }],
      precio: '$399',
      acciones: [{ id: 'agregar', etiqueta: 'Añadir al carrito' }],
    },
  },
  'banco.tecnia.mx/entrar': {
    url: 'banco.tecnia.mx/entrar',
    pestana: 'Banco Tecnia',
    titulo: 'Banco Tecnia — inicia sesión',
    autor: 'Banco Tecnia',
    fecha: 'Hoy',
    certificado: { emisor: 'Tecnia CA', valido: true },
    cuerpo: { tipo: 'articulo', parrafos: ['Ingresa tu usuario y contraseña.'] },
  },
  'banco-tecnia-segura.info/entrar': {
    url: 'banco-tecnia-segura.info/entrar',
    pestana: 'Banco (copia)',
    titulo: 'Banco Tecnia — copia falsa',
    autor: null,
    fecha: null,
    protocolo: 'http',
    cuerpo: { tipo: 'articulo', parrafos: ['Ingresa tu contraseña aquí.'] },
    senales: [{ id: 's1', tono: 'alerta', texto: 'No es una conexión segura', explica: 'Este sitio usa http, no https.' }],
  },
  'buscador.tecnia.mx/buscar?q=mochila': {
    url: 'buscador.tecnia.mx/buscar?q=mochila',
    pestana: 'Resultados',
    titulo: 'Resultados: mochila',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'resultados',
      consulta: 'mochila',
      resultados: [
        { id: 'r1', titulo: 'Mochila espacial — Tienda Tecnia', url: 'tienda.tecnia.mx/producto-1', descripcion: 'La mochila del anuncio.' },
        { id: 'r2', titulo: 'Mochilas gratis, clic aquí', url: 'trampa.biz/mochila', descripcion: 'Oferta increíble.', esAnuncio: true },
      ],
    },
  },
};

function direccionVacia(pagina: PaginaWeb) {
  return { valor: pagina.url, onCambiar: () => {}, onIr: () => {} };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros', () => {
  it('estadoSeguridad: http es insegura, https sin certificado es segura, y un certificado inválido es advertencia', () => {
    expect(estadoSeguridad(MAPA['banco-tecnia-segura.info/entrar'])).toBe('insegura'); // http
    expect(estadoSeguridad(MAPA['inicio.tecnia.mx'])).toBe('segura'); // https por omisión, sin dato de certificado
    expect(estadoSeguridad(MAPA['banco.tecnia.mx/entrar'])).toBe('segura'); // https + certificado válido
    const conCertificadoMalo: PaginaWeb = { ...MAPA['banco.tecnia.mx/entrar'], certificado: { emisor: 'x', valido: false } };
    expect(estadoSeguridad(conCertificadoMalo)).toBe('advertencia');
  });

  it('paginaDe devuelve la página del mapa, o «no encontrada» si la URL no está — jugar MAL', () => {
    expect(paginaDe(MAPA, 'inicio.tecnia.mx').titulo).toBe('Tecnia — página de inicio');
    const noEncontrada = paginaDe(MAPA, 'esto-no-existe.mx');
    expect(noEncontrada.cuerpo).toEqual({ tipo: 'vacio', mensaje: expect.stringContaining('esto-no-existe.mx') });
  });

  it('la pila: navegar a un sitio nuevo borra el «adelante» (regla 1), y atrás con la pila vacía no hace nada (regla 2)', () => {
    let p = crearPestana('t1', 'a');
    p = navegarEnPestana(p, 'b');
    p = navegarEnPestana(p, 'c');
    p = irAtras(p);
    expect(p.url).toBe('b');
    expect(p.adelante).toEqual(['c']);
    p = navegarEnPestana(p, 'd'); // sitio nuevo: borra el adelante
    expect(p.adelante).toEqual([]);
    expect(p.url).toBe('d');

    let vacia = crearPestana('t2', 'x');
    vacia = irAtras(vacia); // pila vacía: no-op
    expect(vacia).toEqual(crearPestana('t2', 'x'));
    const igualQueAntes = irAdelante(vacia); // también no-op
    expect(igualQueAntes).toEqual(vacia);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useNavegador)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina del navegador', () => {
  it('navegar cambia `paginaActual` y registra la visita en el historial', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    expect(result.current.paginaActual.titulo).toBe('Tecnia — página de inicio');
    act(() => result.current.navegar('tienda.tecnia.mx/producto-1'));
    expect(result.current.paginaActual.titulo).toBe('Mochila espacial');
    expect(result.current.historial.map((h) => h.url)).toEqual(['tienda.tecnia.mx/producto-1']);
  });

  it('atrás y adelante recorren las páginas visitadas, y navegar a un sitio nuevo borra el «adelante»', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      result.current.navegar('tienda.tecnia.mx/producto-1');
      result.current.navegar('banco.tecnia.mx/entrar');
    });
    act(() => result.current.atras());
    expect(result.current.paginaActual.url).toBe('tienda.tecnia.mx/producto-1');
    expect(result.current.puedeAdelante).toBe(true);

    act(() => result.current.navegar('inicio.tecnia.mx'));
    expect(result.current.puedeAdelante).toBe(false); // el «adelante» se borró
    act(() => result.current.adelante());
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx'); // no se movió: no había adelante
  });

  it('jugar MAL: atrás cien veces sin historial, y adelante sin haber ido atrás, no rompen nada', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      for (let i = 0; i < 100; i++) result.current.atras();
    });
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx');
    expect(result.current.puedeAtras).toBe(false);
    act(() => result.current.adelante());
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx');
  });

  it('jugar MAL: navegar a una URL fuera del mapa cae en «no encontrada», y atrás regresa bien', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => result.current.navegar('sitio-que-no-existe.mx'));
    expect(result.current.paginaActual.cuerpo.tipo).toBe('vacio');
    expect(result.current.historial[0]?.url).toBe('sitio-que-no-existe.mx');
    act(() => result.current.atras());
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx');
  });

  it('jugar MAL: navegar con una URL vacía (o sólo espacios) no hace nada', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      result.current.navegar('');
      result.current.navegar('    ');
    });
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx');
    expect(result.current.historial).toHaveLength(0);
  });

  it('jugar MAL: recargar cien veces sólo cuenta, no toca la pila ni el historial', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => result.current.navegar('tienda.tecnia.mx/producto-1'));
    act(() => {
      for (let i = 0; i < 100; i++) result.current.recargar();
    });
    expect(result.current.pestanaActiva.recargas).toBe(100);
    expect(result.current.paginaActual.url).toBe('tienda.tecnia.mx/producto-1');
    expect(result.current.puedeAtras).toBe(true);
    expect(result.current.historial).toHaveLength(1);
  });

  it('nuevaPestana/activarPestana/cerrarPestana funcionan, y cerrar la última pestaña es no-op — jugar MAL', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    let id2 = '';
    act(() => {
      id2 = result.current.nuevaPestana('tienda.tecnia.mx/producto-1');
    });
    expect(result.current.pestanas).toHaveLength(2);
    expect(result.current.activaId).toBe(id2);

    const id1 = result.current.pestanas[0].id;
    act(() => result.current.activarPestana(id1));
    expect(result.current.activaId).toBe(id1);

    act(() => result.current.cerrarPestana(id2));
    expect(result.current.pestanas).toHaveLength(1);

    act(() => result.current.cerrarPestana(result.current.pestanas[0].id)); // la única que queda
    expect(result.current.pestanas).toHaveLength(1); // no-op
  });

  it('jugar MAL: abrir treinta pestañas da treinta ids únicos', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      for (let i = 0; i < 30; i++) result.current.nuevaPestana();
    });
    expect(result.current.pestanas).toHaveLength(31);
    expect(new Set(result.current.pestanas.map((p) => p.id)).size).toBe(31);
  });

  it('buscar() arma la URL de búsqueda y navega ahí', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => result.current.buscar('mochila'));
    expect(result.current.paginaActual.url).toBe('buscador.tecnia.mx/buscar?q=mochila');
    expect(result.current.paginaActual.cuerpo.tipo).toBe('resultados');
  });

  it('marcar/desmarcar/estaMarcada, y marcar dos veces no duplica', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      result.current.marcar('inicio.tecnia.mx');
      result.current.marcar('inicio.tecnia.mx');
    });
    expect(result.current.marcadores).toHaveLength(1);
    expect(result.current.estaMarcada('inicio.tecnia.mx')).toBe(true);
    act(() => result.current.desmarcar('inicio.tecnia.mx'));
    expect(result.current.marcadores).toHaveLength(0);
  });

  it('descargar registra el origen de la pestaña activa, y abrirEmergente/cerrarEmergente funcionan', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => result.current.descargar('cosa.exe', { sospechosa: true }));
    expect(result.current.descargas[0]).toMatchObject({ nombre: 'cosa.exe', urlOrigen: 'inicio.tecnia.mx', sospechosa: true });

    let idEmergente = '';
    act(() => {
      idEmergente = result.current.abrirEmergente('banco-tecnia-segura.info/entrar');
    });
    expect(result.current.emergentes[0]?.pagina.titulo).toBe('Banco Tecnia — copia falsa');
    act(() => result.current.cerrarEmergente(idEmergente));
    expect(result.current.emergentes).toHaveLength(0);
  });

  it('reiniciar vuelve pestañas, historial, marcadores, descargas y emergentes a su estado inicial', () => {
    const { result } = renderHook(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
    act(() => {
      result.current.navegar('tienda.tecnia.mx/producto-1');
      result.current.nuevaPestana();
      result.current.marcar('inicio.tecnia.mx');
      result.current.descargar('x.exe');
      result.current.abrirEmergente('banco-tecnia-segura.info/entrar');
    });
    act(() => result.current.reiniciar());
    expect(result.current.pestanas).toHaveLength(1);
    expect(result.current.paginaActual.url).toBe('inicio.tecnia.mx');
    expect(result.current.historial).toHaveLength(0);
    expect(result.current.marcadores).toHaveLength(0);
    expect(result.current.descargas).toHaveLength(0);
    expect(result.current.emergentes).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaNavegador)
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana', () => {
  it('pinta las pestañas, la barra de direcciones y el candado según `estadoSeguridad`', () => {
    const pagina = MAPA['banco.tecnia.mx/entrar'];
    render(
      <VentanaNavegador pestanas={[{ id: 't1', titulo: 'Banco Tecnia', activa: true }]} pagina={pagina} barraDireccion={direccionVacia(pagina)} />,
    );
    expect(screen.getByText('Banco Tecnia')).toBeInTheDocument();
    expect(screen.getByTestId('nav-direccion')).toHaveValue('banco.tecnia.mx/entrar');
    expect(screen.getByTestId('nav-candado')).toHaveAttribute('data-estado', 'segura');
  });

  it('candado "insegura" para http y las señales de la página se pintan; atrás/adelante respetan sus props y disparan sus callbacks', () => {
    const pagina = MAPA['banco-tecnia-segura.info/entrar'];
    const onAtras = jest.fn();
    render(
      <VentanaNavegador
        pestanas={[{ id: 't1', titulo: 'Copia', activa: true }]}
        pagina={pagina}
        puedeAtras
        puedeAdelante={false}
        barraDireccion={direccionVacia(pagina)}
        onAtras={onAtras}
      />,
    );
    expect(screen.getByTestId('nav-candado')).toHaveAttribute('data-estado', 'insegura');
    expect(screen.getByText('No es una conexión segura')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Atrás'));
    expect(onAtras).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Adelante')).toBeDisabled();
  });

  it('clic en una pestaña dispara `onActivarPestana`; clic en cerrarla dispara `onCerrarPestana`', () => {
    const onActivar = jest.fn();
    const onCerrar = jest.fn();
    render(
      <VentanaNavegador
        pestanas={[
          { id: 't1', titulo: 'Uno', activa: true },
          { id: 't2', titulo: 'Dos', activa: false },
        ]}
        pagina={MAPA['inicio.tecnia.mx']}
        barraDireccion={direccionVacia(MAPA['inicio.tecnia.mx'])}
        onActivarPestana={onActivar}
        onCerrarPestana={onCerrar}
      />,
    );
    fireEvent.click(screen.getByText('Dos'));
    expect(onActivar).toHaveBeenCalledWith('t2');
    fireEvent.click(screen.getByLabelText('Cerrar pestaña Dos'));
    expect(onCerrar).toHaveBeenCalledWith('t2');
  });

  it('los resultados de búsqueda distinguen los anuncios de los resultados normales', () => {
    const pagina = MAPA['buscador.tecnia.mx/buscar?q=mochila'];
    const onIrAUrl = jest.fn();
    const { container } = render(
      <VentanaNavegador pestanas={[{ id: 't1', titulo: 'Resultados', activa: true }]} pagina={pagina} barraDireccion={direccionVacia(pagina)} onIrAUrl={onIrAUrl} />,
    );
    expect(container.querySelectorAll('[data-anuncio="si"]')).toHaveLength(1);
    expect(screen.getByText('Anuncio')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mochila espacial — Tienda Tecnia'));
    expect(onIrAUrl).toHaveBeenCalledWith('tienda.tecnia.mx/producto-1');
  });

  it('la ficha pinta sus acciones y dispara `onAccionFicha`; sin acciones, ni un botón de acción', () => {
    const pagina = MAPA['tienda.tecnia.mx/producto-1'];
    const onAccion = jest.fn();
    const { container, rerender } = render(
      <VentanaNavegador pestanas={[{ id: 't1', titulo: 'Tienda', activa: true }]} pagina={pagina} barraDireccion={direccionVacia(pagina)} onAccionFicha={onAccion} />,
    );
    fireEvent.click(screen.getByText('Añadir al carrito'));
    expect(onAccion).toHaveBeenCalledWith('agregar');

    const sinAcciones: PaginaWeb = {
      url: pagina.url,
      pestana: pagina.pestana,
      titulo: pagina.titulo,
      autor: pagina.autor,
      fecha: pagina.fecha,
      cuerpo: { tipo: 'ficha', datos: [{ etiqueta: 'Talla', valor: 'Única' }], precio: '$399' },
    };
    rerender(<VentanaNavegador pestanas={[{ id: 't1', titulo: 'Tienda', activa: true }]} pagina={sinAcciones} barraDireccion={direccionVacia(pagina)} />);
    expect(container.querySelectorAll('[data-accion]')).toHaveLength(0);
  });

  it('sólo se pinta el panel que pide `panelActivo`; ninguno por omisión', () => {
    const pagina = MAPA['inicio.tecnia.mx'];
    const historial = [{ url: 'inicio.tecnia.mx', titulo: 'Inicio', momento: 'Ahora' }];
    const { rerender } = render(
      <VentanaNavegador pestanas={[{ id: 't1', titulo: 'Inicio', activa: true }]} pagina={pagina} barraDireccion={direccionVacia(pagina)} historial={historial} />,
    );
    expect(screen.queryByTestId('nav-panel-historial')).toBeNull();
    rerender(
      <VentanaNavegador
        pestanas={[{ id: 't1', titulo: 'Inicio', activa: true }]}
        pagina={pagina}
        barraDireccion={direccionVacia(pagina)}
        historial={historial}
        panelActivo="historial"
      />,
    );
    expect(screen.getByTestId('nav-panel-historial')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-panel-marcadores')).toBeNull();
  });

  it('las ventanas emergentes se pintan encima y cerrar una dispara `onCerrarEmergente`', () => {
    const onCerrar = jest.fn();
    const pagina = MAPA['inicio.tecnia.mx'];
    render(
      <VentanaNavegador
        pestanas={[{ id: 't1', titulo: 'Inicio', activa: true }]}
        pagina={pagina}
        barraDireccion={direccionVacia(pagina)}
        emergentes={[{ id: 'e1', urlOrigen: pagina.url, pagina: MAPA['banco-tecnia-segura.info/entrar'] }]}
        onCerrarEmergente={onCerrar}
      />,
    );
    expect(screen.getByTestId('nav-emergente')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onCerrar).toHaveBeenCalledWith('e1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · De punta a punta
// ═══════════════════════════════════════════════════════════════════════════

describe('de punta a punta', () => {
  it('escribir y navegar, ir a un resultado con anuncio, volver atrás, y marcar la página', () => {
    function Clase() {
      const nav = useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' });
      const [direccion, setDireccion] = useState(nav.paginaActual.url);
      // Patrón «ajustar el estado durante el render» (react.dev, no un efecto):
      // cuando la página cambió por fuera (atrás, un enlace), la barra se
      // resincroniza sin flash y sin `setState` dentro de un `useEffect`.
      const [urlSincronizada, setUrlSincronizada] = useState(nav.paginaActual.url);
      if (urlSincronizada !== nav.paginaActual.url) {
        setUrlSincronizada(nav.paginaActual.url);
        setDireccion(nav.paginaActual.url);
      }
      const irA = (url: string) => nav.navegar(url);
      return (
        <VentanaNavegador
          pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: paginaDe(MAPA, p.url).pestana }))}
          pagina={nav.paginaActual}
          puedeAtras={nav.puedeAtras}
          puedeAdelante={nav.puedeAdelante}
          marcada={nav.estaMarcada(nav.paginaActual.url)}
          barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => irA(direccion) }}
          onAtras={() => nav.atras()}
          onIrAUrl={irA}
          onMarcar={() => nav.marcar(nav.paginaActual.url)}
          onDesmarcar={() => nav.desmarcar(nav.paginaActual.url)}
        />
      );
    }
    const { container } = render(<Clase />);

    fireEvent.change(screen.getByTestId('nav-direccion'), { target: { value: 'buscador.tecnia.mx/buscar?q=mochila' } });
    fireEvent.submit(container.querySelector('.tn-direccion')!);
    expect(screen.getByText('Resultados para «mochila»')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-anuncio="si"]')).toHaveLength(1);

    fireEvent.click(screen.getByText('Mochila espacial — Tienda Tecnia'));
    expect(screen.getByTestId('nav-direccion')).toHaveValue('tienda.tecnia.mx/producto-1');

    fireEvent.click(screen.getByLabelText('Atrás'));
    expect(screen.getByTestId('nav-direccion')).toHaveValue('buscador.tecnia.mx/buscar?q=mochila');

    fireEvent.click(screen.getByLabelText('Añadir marcador'));
    expect(screen.getByLabelText('Quitar marcador')).toBeInTheDocument();
  });
});
