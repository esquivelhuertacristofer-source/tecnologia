/**
 * Tanda 0 · las dos piezas que van antes de los diez armazones
 * (CANON-ARMAZONES.md, «Pieza 0» y «La otra deuda transversal»).
 *
 *  · `VentanaBase` (src/components/simuladores/VentanaBase.tsx) — el marco
 *    que `LabVirusYAntivirus.tsx` y `LabNubeOLocal.tsx` traían escrito dos
 *    veces, carácter por carácter, con distinto prefijo de CSS. Aquí se
 *    prueba el componente suelto, con `children` de utilería — sus dos
 *    adoptantes reales ya tienen su propia prueba de extremo a extremo en
 *    `n4-virus-y-antivirus.test.tsx` y `n5-nube-o-local.test.tsx`, que
 *    siguen en verde después de la adopción.
 *  · `useLabActividad` (src/components/activities/lib/useLabActividad.ts) —
 *    el arnés de sesión copiado en ~59 laboratorios arcade: progreso,
 *    errores, puntaje con piso, estrellas y `onComplete`. Se prueba aislado
 *    con `renderHook`, sin montar ningún laboratorio completo.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import type { ActivityProps } from '@/types/activity-contract';

function crearProps(): ActivityProps & {
  onProgress: jest.Mock;
  onScore: jest.Mock;
  onComplete: jest.Mock;
} {
  return {
    config: {},
    onProgress: jest.fn(),
    onScore: jest.fn(),
    onComplete: jest.fn(),
  };
}

describe('VentanaBase · el marco', () => {
  it('pinta la marca y el subtítulo en la barra de título', () => {
    render(
      <VentanaBase marca="Tecnia Antivirus" subtitulo="10 programas instalados">
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(screen.getByText('Tecnia Antivirus')).not.toBeNull();
    expect(screen.getByText('10 programas instalados')).not.toBeNull();
  });

  it('sin subtítulo, no pinta ningún nodo de subtítulo', () => {
    render(
      <VentanaBase marca="Tecnia Archivos">
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(document.querySelector('.vtb-barra-sub')).toBeNull();
  });

  it('la barra de título lleva tres puntos decorativos', () => {
    render(
      <VentanaBase marca="Tecnia Archivos">
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(document.querySelectorAll('.vtb-barra-punto')).toHaveLength(3);
  });

  it('sin `arranque`, pinta `children` directamente aunque no se pase `encendida`', () => {
    render(
      <VentanaBase marca="Tecnia Muro">
        <p>El muro</p>
      </VentanaBase>,
    );
    expect(screen.getByText('El muro')).not.toBeNull();
    expect(document.querySelector('.vtb-encender')).toBeNull();
  });

  it('con `arranque` y `encendida=false`, pinta el botón de encender y NO `children`', () => {
    const onEncender = jest.fn();
    render(
      <VentanaBase
        marca="Tecnia Antivirus"
        arranque={{ pie: 'Listo para revisar', onEncender }}
        encendida={false}
      >
        <p>Programas instalados</p>
      </VentanaBase>,
    );
    expect(screen.getByText('⏻ Encender')).not.toBeNull();
    expect(screen.getByText('Listo para revisar')).not.toBeNull();
    expect(screen.queryByText('Programas instalados')).toBeNull();
  });

  it('pulsar el botón de arranque llama a `onEncender`', () => {
    const onEncender = jest.fn();
    render(
      <VentanaBase marca="Tecnia Antivirus" arranque={{ pie: 'Listo', onEncender }} encendida={false}>
        <p>contenido</p>
      </VentanaBase>,
    );
    fireEvent.click(screen.getByText('⏻ Encender'));
    expect(onEncender).toHaveBeenCalledTimes(1);
  });

  it('la etiqueta del botón de arranque se puede sobreescribir', () => {
    render(
      <VentanaBase
        marca="Tecnia Nube"
        arranque={{ pie: 'Listo', etiquetaBoton: '▶ Iniciar sesión', onEncender: jest.fn() }}
        encendida={false}
      >
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(screen.getByText('▶ Iniciar sesión')).not.toBeNull();
    expect(screen.queryByText('⏻ Encender')).toBeNull();
  });

  it('con `arranque` dado y `encendida=true`, pinta `children` y no la pantalla de arranque', () => {
    render(
      <VentanaBase marca="Tecnia Antivirus" arranque={{ pie: 'Listo', onEncender: jest.fn() }} encendida>
        <p>Programas instalados</p>
      </VentanaBase>,
    );
    expect(screen.getByText('Programas instalados')).not.toBeNull();
    expect(screen.queryByText('⏻ Encender')).toBeNull();
  });

  it('`claseMarco` se añade AL LADO de `vtb-marco`, no en su lugar', () => {
    render(
      <VentanaBase marca="Tecnia Antivirus" claseMarco="av-marco">
        <p>contenido</p>
      </VentanaBase>,
    );
    const marco = document.querySelector('.vtb-marco');
    expect(marco).not.toBeNull();
    expect(marco?.classList.contains('av-marco')).toBe(true);
  });

  it('`barraEstado` sólo se pinta cuando se pasa por parámetro', () => {
    const { rerender } = render(
      <VentanaBase marca="Tecnia Antivirus">
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(document.querySelector('.vtb-estado')).toBeNull();

    rerender(
      <VentanaBase marca="Tecnia Antivirus" barraEstado={<span>3 elementos</span>}>
        <p>contenido</p>
      </VentanaBase>,
    );
    expect(document.querySelector('.vtb-estado')?.textContent).toBe('3 elementos');
  });
});

describe('useLabActividad · el arnés de sesión', () => {
  it('empieza en 0 pasos, sin terminar y con `sim.ocupado` en false', () => {
    const { result } = renderHook(() => useLabActividad(crearProps(), 5));
    expect(result.current.pasos).toBe(0);
    expect(result.current.terminado).toBe(false);
    expect(result.current.sim.current.ocupado).toBe(false);
  });

  it('`avanzar()` reporta `onProgress(hechos / totalPasos)` y devuelve el total de pasos hechos', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 4));
    act(() => {
      result.current.avanzar();
    });
    expect(result.current.pasos).toBe(1);
    expect(props.onProgress).toHaveBeenLastCalledWith(0.25);

    let hechos = 0;
    act(() => {
      hechos = result.current.avanzar();
    });
    expect(hechos).toBe(2);
    expect(props.onProgress).toHaveBeenLastCalledWith(0.5);
  });

  it('`restar()` aplica la fórmula 100 − errores·6 con piso 60, por defecto', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 10));
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.restar();
      });
    }
    expect(result.current.puntaje()).toBe(82); // 100 - 3*6
    expect(props.onScore).toHaveBeenLastCalledWith(82);

    // Insistir en el error nunca baja del piso.
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.restar();
      });
    }
    expect(result.current.puntaje()).toBe(60);
  });

  it('el piso y la penalización por error se reciben por parámetro, sin tocar la fórmula por defecto', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 10, { piso: 40, penalizacionError: 10 }));
    act(() => {
      result.current.restar();
      result.current.restar();
    });
    expect(result.current.puntaje()).toBe(80); // 100 - 2*10
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.restar();
      });
    }
    expect(result.current.puntaje()).toBe(40);
  });

  it('`terminar()` cierra con `onComplete({ score, stars: 3, xp: score, errores, tiempoSegundos })`', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 2));
    act(() => {
      result.current.restar();
    });
    act(() => {
      result.current.terminar(37);
    });
    expect(props.onComplete).toHaveBeenCalledWith({ score: 94, stars: 3, xp: 94, errores: 1, tiempoSegundos: 37 });
    expect(props.onProgress).toHaveBeenLastCalledWith(1);
    expect(result.current.terminado).toBe(true);
    expect(result.current.tiempoFinal).toBe(37);
    expect(result.current.erroresFinal).toBe(1);
  });

  it('`estrellas` se recibe por parámetro para el laboratorio que no reparte 3', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 1, { estrellas: 1 }));
    act(() => {
      result.current.terminar(5);
    });
    expect(props.onComplete).toHaveBeenCalledWith(expect.objectContaining({ stars: 1 }));
  });

  it('`terminar()` corre `antesDeSonar` antes de reportar el resultado final', () => {
    const props = crearProps();
    const orden: string[] = [];
    props.onComplete.mockImplementation(() => orden.push('onComplete'));
    const { result } = renderHook(() => useLabActividad(props, 1));
    act(() => {
      result.current.terminar(1, () => orden.push('antesDeSonar'));
    });
    expect(orden).toEqual(['antesDeSonar', 'onComplete']);
  });

  it('`reiniciar()` vuelve `pasos`/`terminado` a su estado inicial y reporta `onProgress(0)`/`onScore(100)`', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 2));
    act(() => {
      result.current.avanzar();
      result.current.restar();
      result.current.terminar(9);
    });
    expect(result.current.terminado).toBe(true);

    act(() => {
      result.current.reiniciar();
    });
    expect(result.current.pasos).toBe(0);
    expect(result.current.terminado).toBe(false);
    expect(result.current.tiempoFinal).toBe(0);
    expect(result.current.erroresFinal).toBe(0);
    expect(result.current.sim.current.errores).toBe(0);
    expect(props.onProgress).toHaveBeenLastCalledWith(0);
    expect(props.onScore).toHaveBeenLastCalledWith(100);
  });

  it('`reiniciar()` corre `alReiniciar` al final, el hueco donde cada clase pone su propio `hablar(...)`', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 1));
    const alReiniciar = jest.fn();
    act(() => {
      result.current.reiniciar(alReiniciar);
    });
    expect(alReiniciar).toHaveBeenCalledTimes(1);
  });

  it('después de reiniciar, `avanzar()` vuelve a contar desde 1 (el contador interno también se reinicia)', () => {
    const props = crearProps();
    const { result } = renderHook(() => useLabActividad(props, 2));
    act(() => {
      result.current.avanzar();
      result.current.avanzar();
    });
    expect(result.current.pasos).toBe(2);

    act(() => {
      result.current.reiniciar();
    });
    let hechos = 0;
    act(() => {
      hechos = result.current.avanzar();
    });
    expect(hechos).toBe(1);
    expect(result.current.pasos).toBe(1);
  });
});
