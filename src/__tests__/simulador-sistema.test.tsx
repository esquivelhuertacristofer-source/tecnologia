/**
 * TECNIA SISTEMA · el armazón de las 6 actividades de sistema operativo
 * (CANON-ARMAZONES.md, «8 · Tecnia Escritorio»).
 *
 * Se prueba en tres alturas, como `simulador-muro.test.tsx`: los datos puros
 * del árbol (`tiposSistema.ts`), la máquina (`useSistema`) y las ventanas
 * (`VentanaExplorador`, `Escritorio`).
 *
 * Y se prueba JUGANDO MAL, tal como lo pide el encargo: mover una carpeta
 * dentro de sí misma, mover una carpeta dentro de su propia nieta, borrar la
 * papelera (vaciarla dos veces), restaurar algo cuya carpeta ya no existe,
 * renombrar a nombre vacío, crear cien carpetas, subir desde la raíz, borrar
 * la raíz, y pegar sin haber cortado ni copiado nada.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  abrirVentana,
  borrar,
  buscar,
  calcularEspacio,
  cerrarVentana,
  copiar,
  crearCarpeta,
  enfocarVentana,
  extensionDe,
  minimizarVentana,
  mover,
  nombreDisponible,
  nombreValido,
  programaDe,
  renombrar,
  restaurar,
  tamanoDe,
  vaciarPapelera,
  type ArchivoSO,
  type CarpetaSO,
  type ElementoPapelera,
  type VentanaSO,
} from '@/components/simuladores/sistema/tiposSistema';
import { useSistema } from '@/components/simuladores/sistema/useSistema';
import { VentanaExplorador } from '@/components/simuladores/sistema/VentanaExplorador';
import { Escritorio } from '@/components/simuladores/sistema/Escritorio';

function archivo(parcial: Partial<ArchivoSO> & { id: string; nombre: string }): ArchivoSO {
  return { tipo: 'archivo', tamano: 100, fecha: '10 ago 2026', ...parcial };
}
function carpeta(parcial: Partial<CarpetaSO> & { id: string; nombre: string }): CarpetaSO {
  return { tipo: 'carpeta', fecha: '10 ago 2026', hijos: [], ...parcial };
}

/** Mi PC › (Documentos › (tarea.docx, Fotos › playa.jpg), notas.txt). */
function arbolSemilla(): CarpetaSO {
  return carpeta({
    id: 'raiz',
    nombre: 'Mi PC',
    hijos: [
      carpeta({
        id: 'c-doc',
        nombre: 'Documentos',
        hijos: [
          archivo({ id: 'a-tarea', nombre: 'tarea.docx', tamano: 20_000 }),
          carpeta({ id: 'c-fotos', nombre: 'Fotos', hijos: [archivo({ id: 'a-playa', nombre: 'playa.jpg', tamano: 500_000, contenidoReal: 'imagen' })] }),
        ],
      }),
      archivo({ id: 'a-notas', nombre: 'notas.txt', tamano: 1_000 }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros del árbol
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros del árbol', () => {
  it('los nombres: se resuelve el choque con «(2)», «(3)»…, y un nombre imposible se rechaza — jugar MAL', () => {
    const c = carpeta({ id: 'p', nombre: 'p', hijos: [archivo({ id: 'x', nombre: 'foto.jpg' }), archivo({ id: 'y', nombre: 'foto (2).jpg' })] });
    expect(nombreDisponible(c, 'informe.docx')).toBe('informe.docx'); // libre: tal cual
    expect(nombreDisponible(c, 'foto.jpg')).toBe('foto (3).jpg'); // (2) también choca

    expect(nombreValido('').ok).toBe(false);
    expect(nombreValido('   ').ok).toBe(false);
    expect(nombreValido('a/b').ok).toBe(false);
    expect(nombreValido('a:b*c?').ok).toBe(false);
    expect(nombreValido('..').ok).toBe(false);
    expect(nombreValido('informe final.docx').ok).toBe(true);
  });

  it('tamanoDe suma recursivamente el árbol entero', () => {
    expect(tamanoDe(arbolSemilla())).toBe(20_000 + 500_000 + 1_000);
  });

  it('crearCarpeta cien veces da cien nombres únicos — jugar MAL con volumen', () => {
    let raiz = carpeta({ id: 'raiz', nombre: 'Mi PC' });
    for (let i = 0; i < 100; i++) {
      const r = crearCarpeta(raiz, 'raiz', 'Nueva carpeta', `n${i}`, 'Hoy');
      expect(r.ok).toBe(true);
      if (r.ok) raiz = r.raiz;
    }
    expect(raiz.hijos).toHaveLength(100);
    expect(new Set(raiz.hijos.map((h) => h.nombre)).size).toBe(100);
  });

  it('renombrar rechaza un nombre ya ocupado y explica por qué, sin tocar el árbol', () => {
    const raiz = arbolSemilla();
    expect(renombrar(raiz, 'a-notas', 'tarea.docx').ok).toBe(true); // no choca: viven en carpetas distintas
    const r2 = renombrar(raiz, 'a-tarea', 'Fotos'); // sí choca: "Fotos" ya es hermana suya en Documentos
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.motivo).toBe('nombre-ocupado');
      expect(r2.aviso).toMatch(/no pueden llamarse igual/);
      expect(r2.raiz).toBe(raiz); // por identidad: ni una hoja se tocó
    }
  });

  it('mover: cambia de carpeta de verdad, rechaza el choque de nombres, y nunca dentro de sí misma ni de su nieta — jugar MAL', () => {
    const raiz = arbolSemilla();
    const dentroDeSiMisma = mover(raiz, 'c-doc', 'c-doc');
    const dentroDeSuNieta = mover(raiz, 'c-doc', 'c-fotos'); // Fotos cuelga de Documentos
    expect(dentroDeSiMisma.ok).toBe(false);
    expect(dentroDeSuNieta.ok).toBe(false);
    if (!dentroDeSuNieta.ok) expect(dentroDeSuNieta.motivo).toBe('dentro-de-si-mismo');
    expect(dentroDeSiMisma.raiz).toBe(raiz); // el árbol no cambió en ninguno de los dos intentos
    expect(dentroDeSuNieta.raiz).toBe(raiz);

    const r = mover(raiz, 'a-notas', 'c-doc');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.raiz.hijos.map((h) => h.id)).not.toContain('a-notas'); // salió de la raíz
      const doc = r.raiz.hijos.find((h) => h.id === 'c-doc') as CarpetaSO;
      expect(doc.hijos.map((h) => h.id)).toContain('a-notas'); // y entró a Documentos
    }

    const arbolConDuplicado = carpeta({ id: 'r', nombre: 'r', hijos: [carpeta({ id: 'd', nombre: 'd', hijos: [archivo({ id: 'x', nombre: 'igual.txt' })] }), archivo({ id: 'y', nombre: 'igual.txt' })] });
    expect(mover(arbolConDuplicado, 'y', 'd').ok).toBe(false); // "d" ya tiene un "igual.txt"
  });

  it('copiar SIEMPRE resuelve el choque con «(2)», nunca lo rechaza, y da un id nuevo', () => {
    const raiz = arbolSemilla();
    let n = 0;
    const r = copiar(raiz, 'a-tarea', 'c-doc', () => `copia${++n}`, 'Hoy'); // copiar en su propia carpeta
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.nombreFinal).toBe('tarea (2).docx');
      const doc = r.raiz.hijos.find((h) => h.id === 'c-doc') as CarpetaSO;
      expect(doc.hijos.filter((h) => h.nombre.startsWith('tarea'))).toHaveLength(2);
      expect(doc.hijos.some((h) => h.id === 'copia1')).toBe(true); // id nuevo, no reusa "a-tarea"
    }
  });

  it('borrar saca el nodo del árbol de verdad (no es una bandera) y lo manda a la papelera', () => {
    const raiz = arbolSemilla();
    const r = borrar(raiz, [], 'c-fotos', 'Hoy');
    expect(r.ok).toBe(true);
    const doc = r.raiz.hijos.find((h) => h.id === 'c-doc') as CarpetaSO;
    expect(doc.hijos.some((h) => h.id === 'c-fotos')).toBe(false); // ya no vive en el árbol
    expect(r.papelera).toHaveLength(1);
    expect(r.papelera[0].nodo.id).toBe('c-fotos');
    expect(r.papelera[0].origenId).toBe('c-doc');
  });

  it('restaurar: cae al disco principal si la carpeta original ya no existe, y un id que ya no está en la papelera no rompe nada — jugar MAL', () => {
    const raiz = arbolSemilla();
    const b1 = borrar(raiz, [], 'a-playa', 'Hoy'); // primero borra el archivo...
    const b2 = borrar(b1.raiz, b1.papelera, 'c-fotos', 'Hoy'); // ...y luego SU carpeta contenedora
    const r = restaurar(b2.raiz, b2.papelera, 'a-playa');
    expect(r.ok).toBe(true);
    expect(r.origenPerdido).toBe(true);
    expect(r.aviso).toMatch(/ya no existe/);
    expect(r.raiz.hijos.some((h) => h.id === 'a-playa')).toBe(true); // apareció en la raíz

    const fantasma = restaurar(raiz, [], 'fantasma');
    expect(fantasma.ok).toBe(false);
    expect(fantasma.raiz).toBe(raiz);
  });

  it('vaciar la papelera ya vacía es un no-operación por identidad, y la raíz no se borra ni se mueve ni se renombra — jugar MAL', () => {
    const vacia: ElementoPapelera[] = [];
    expect(vaciarPapelera(vacia)).toBe(vacia);
    const conAlgo: ElementoPapelera[] = [{ nodo: archivo({ id: 'z', nombre: 'z.txt' }), origenId: 'raiz', fechaBorrado: 'Hoy' }];
    expect(vaciarPapelera(conAlgo)).toEqual([]);

    const raiz = arbolSemilla();
    expect(borrar(raiz, [], 'raiz', 'Hoy').ok).toBe(false);
    expect(mover(raiz, 'raiz', 'c-doc').ok).toBe(false);
    expect(renombrar(raiz, 'raiz', 'Otro nombre').ok).toBe(false);
  });

  it('buscar recorre TODO el árbol, por nombre y por tipo', () => {
    const raiz = arbolSemilla();
    expect(buscar(raiz, { texto: 'ta' }).map((n) => n.id).sort()).toEqual(['a-notas', 'a-tarea']); // "no-TA-s" también casa: es subcadena
    expect(buscar(raiz, { tipo: 'carpeta' }).map((n) => n.id).sort()).toEqual(['c-doc', 'c-fotos']);
  });

  it('calcularEspacio cuenta lo vivo y lo de la papelera, y nunca deja el espacio libre en negativo', () => {
    const raiz = arbolSemilla();
    const papelera: ElementoPapelera[] = [{ nodo: archivo({ id: 'w', nombre: 'w.txt', tamano: 500 }), origenId: 'raiz', fechaBorrado: 'Hoy' }];
    const e = calcularEspacio(raiz, papelera, 1_000);
    expect(e.usadosVivos).toBe(521_000);
    expect(e.usadosPapelera).toBe(500);
    expect(e.libres).toBe(0); // ya se pasó de la capacidad
  });

  it('la extensión no es el contenido: renombrar «foto.jpg» a «foto.txt» no toca `contenidoReal`', () => {
    const raiz = carpeta({ id: 'r', nombre: 'r', hijos: [archivo({ id: 'f', nombre: 'foto.jpg', contenidoReal: 'imagen' })] });
    const r = renombrar(raiz, 'f', 'foto.txt');
    expect(r.ok).toBe(true);
    if (r.ok) {
      const f = r.raiz.hijos[0] as ArchivoSO;
      expect(f.nombre).toBe('foto.txt');
      expect(extensionDe(f.nombre)).toBe('txt');
      expect(f.contenidoReal).toBe('imagen'); // sigue siendo una imagen de verdad
      expect(programaDe(f.nombre)).toBe('Tecnia Textos'); // pero Tecnia intentará abrirla como texto
    }
  });

  it('las ventanas: abrir una que ya existe la trae al frente sin duplicarla, y las demás son no-operación por identidad si no aplican', () => {
    const v1: VentanaSO = { id: 'w1', titulo: 'Uno', programa: 'x' };
    const abiertas = abrirVentana([v1], { id: 'w1', titulo: 'Uno (repetido)', programa: 'x' });
    expect(abiertas).toHaveLength(1);
    expect(abiertas[0].titulo).toBe('Uno'); // no la reemplaza: es la misma ventana

    const original = [v1];
    expect(cerrarVentana(original, 'fantasma')).toBe(original);
    expect(enfocarVentana(original, 'fantasma')).toBe(original);
    expect(minimizarVentana(original, 'fantasma')).toBe(original);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useSistema)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina del sistema (useSistema)', () => {
  function montar() {
    return renderHook(() => useSistema({ raiz: arbolSemilla(), capacidadDisco: 10_000_000 }));
  }

  it('subir desde la raíz no rompe nada — jugar MAL', () => {
    const { result } = montar();
    expect(result.current.ruta).toHaveLength(1);
    act(() => result.current.subir());
    expect(result.current.carpetaActual.id).toBe('raiz'); // sigue en la raíz, sin errores
  });

  it('entrar navega, subir vuelve, y navegar a un id inexistente no mueve nada', () => {
    const { result } = montar();
    act(() => {
      expect(result.current.entrar('c-doc')).toBe(true);
    });
    expect(result.current.carpetaActual.nombre).toBe('Documentos');
    act(() => {
      expect(result.current.entrar('fantasma')).toBe(false);
    });
    expect(result.current.carpetaActual.nombre).toBe('Documentos'); // no se movió
    act(() => result.current.subir());
    expect(result.current.carpetaActual.id).toBe('raiz');
  });

  it('borrar la carpeta donde el alumno está parado lo regresa solo a la raíz', () => {
    const { result } = montar();
    act(() => result.current.entrar('c-fotos'));
    expect(result.current.carpetaActual.id).toBe('c-fotos');
    act(() => {
      result.current.borrar('c-fotos');
    });
    expect(result.current.carpetaActual.id).toBe('raiz'); // no se queda en una carpeta fantasma
  });

  it('el portapapeles: pegar sin haber cortado ni copiado nada no rompe nada, y cortar + pegar mueve — jugar MAL', () => {
    const { result } = montar();
    act(() => {
      const r = result.current.pegarAqui();
      expect(r.ok).toBe(false);
    });
    act(() => result.current.cortar('a-notas'));
    act(() => result.current.entrar('c-doc'));
    act(() => {
      const r = result.current.pegarAqui();
      expect(r.ok).toBe(true);
    });
    expect(result.current.listado.some((n) => n.id === 'a-notas')).toBe(true);
    expect(result.current.portapapeles).toBeNull(); // cortar se gasta al pegar
  });

  it('copiar y pegar duplica, y el portapapeles sigue lleno para pegar otra vez', () => {
    const { result } = montar();
    act(() => result.current.copiarAlPortapapeles('a-notas'));
    act(() => result.current.entrar('c-doc'));
    act(() => {
      result.current.pegarAqui();
    });
    expect(result.current.portapapeles).not.toBeNull();
    expect(result.current.raiz.hijos.some((h) => h.id === 'a-notas')).toBe(true); // el original sigue en la raíz
  });

  it('abrirNodo abre el programa de un archivo conocido, y entrar en una carpeta no abre ningún programa', () => {
    const { result } = montar();
    act(() => {
      const r = result.current.abrirNodo('a-notas');
      expect(r.ok).toBe(true);
      expect(r.programa).toBe('Tecnia Textos');
    });
    expect(result.current.ventanas).toHaveLength(1);
    act(() => {
      const r = result.current.abrirNodo('c-fotos'); // esto es una carpeta: entra, no abre programa
      expect(r.programa).toBeNull();
    });
    expect(result.current.carpetaActual.id).toBe('c-fotos');
  });

  it('buscarTexto filtra el listado en todo el disco y limpiarBusqueda regresa a la carpeta', () => {
    const { result } = montar();
    act(() => result.current.buscarTexto('play'));
    expect(result.current.buscando).toBe(true);
    expect(result.current.listado.map((n) => n.id)).toEqual(['a-playa']);
    act(() => result.current.limpiarBusqueda());
    expect(result.current.buscando).toBe(false);
    expect(result.current.listado.map((n) => n.id).sort()).toEqual(['a-notas', 'c-doc']);
  });

  it('ordenarPor invierte la dirección al pulsar dos veces el mismo campo', () => {
    const { result } = montar();
    act(() => result.current.ordenarPor('tamano'));
    expect(result.current.orden).toEqual({ campo: 'tamano', direccion: 'asc' });
    act(() => result.current.ordenarPor('tamano'));
    expect(result.current.orden.direccion).toBe('desc');
  });

  it('reiniciar vuelve exactamente al árbol y al estado con el que se montó', () => {
    const { result } = montar();
    act(() => {
      result.current.entrar('c-doc');
      result.current.crearCarpeta('temporal');
      result.current.borrar('a-tarea');
    });
    expect(result.current.papelera).toHaveLength(1);
    act(() => result.current.reiniciar());
    expect(result.current.carpetaActual.id).toBe('raiz');
    expect(result.current.papelera).toHaveLength(0);
    expect(result.current.raiz.hijos.map((h) => h.id).sort()).toEqual(['a-notas', 'c-doc']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Las ventanas
// ═══════════════════════════════════════════════════════════════════════════

describe('VentanaExplorador', () => {
  function Wrapper() {
    const sis = useSistema({ raiz: arbolSemilla(), capacidadDisco: 10_000_000 });
    return (
      <VentanaExplorador
        ruta={sis.ruta}
        listado={sis.listado}
        vista={sis.vista}
        orden={sis.orden}
        seleccionId={sis.seleccionId}
        espacio={sis.espacio}
        onEntrar={sis.entrar}
        onSubir={sis.subir}
        onIrA={sis.navegarA}
        onSeleccionar={sis.seleccionar}
        onBorrar={sis.borrar}
      />
    );
  }

  it('pinta la ruta y el listado de la raíz, con el botón subir deshabilitado', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('explorador-ruta')).toHaveTextContent('Mi PC');
    expect(screen.getAllByTestId('explorador-fila')).toHaveLength(2); // Documentos, notas.txt
    expect(screen.getByLabelText('Subir un nivel')).toBeDisabled();
  });

  it('doble clic en una carpeta navega dentro, y el botón borrar de una fila dispara la baja', () => {
    render(<Wrapper />);
    fireEvent.doubleClick(screen.getByText('Documentos'));
    expect(screen.getByTestId('explorador-ruta')).toHaveTextContent('Documentos');
    expect(screen.getAllByTestId('explorador-fila')).toHaveLength(2); // tarea.docx, Fotos
    fireEvent.click(screen.getByLabelText('Borrar tarea.docx'));
    expect(screen.queryByText('tarea.docx')).not.toBeInTheDocument();
  });
});

describe('Escritorio', () => {
  it('abrir un icono abre una ventana, y su ✕ la cierra', () => {
    function WrapperEscritorio() {
      const sis = useSistema({ raiz: arbolSemilla(), capacidadDisco: 10_000_000 });
      return (
        <Escritorio
          iconos={[{ id: 'i-notas', etiqueta: 'notas.txt', emoji: '📄', nodoId: 'a-notas' }]}
          ventanas={sis.ventanas}
          contenido={{}}
          onAbrirIcono={(icono) => icono.nodoId && sis.abrirNodo(icono.nodoId)}
          onCerrarVentana={sis.cerrarVentana}
        />
      );
    }
    render(<WrapperEscritorio />);
    expect(screen.queryByTestId('escritorio-ventana')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('escritorio-icono'));
    expect(screen.getByTestId('escritorio-ventana')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Cerrar/));
    expect(screen.queryByTestId('escritorio-ventana')).not.toBeInTheDocument();
  });
});
