/**
 * TECNIA NUBE · el armazón del que cuelgan (de verdad) 2 de las 5 filas
 * (CANON-ARMAZONES.md, «10 · Tecnia Nube»): `n5-documentos-compartidos` y
 * `n9-trabajo-colaborativo`. Ver la respuesta final de la tanda para las
 * otras tres (`n8-malware-e-ingenieria-social`, `n9-gestiona-tu-proyecto`,
 * `of-m365-calendario`), que son otros programas (correo, tablero,
 * calendario) y no archivos en la nube.
 *
 * Se prueba en tres alturas, como `simulador-sistema.test.tsx`: los datos
 * puros (`tiposNube.ts`), la máquina (`useNube`) y la ventana
 * (`VentanaNube`). Y se prueba JUGANDO MAL, tal como lo pide el encargo:
 * compartir con uno mismo, quitar el permiso a quien está dentro, editar lo
 * que otro ya guardó (el conflicto), resolver un conflicto dos veces,
 * restaurar una versión que ya no existe, subir sin conexión, y llenar el
 * espacio y seguir subiendo.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ArchivoSO } from '@/components/simuladores/sistema/tiposSistema';
import {
  abrirEnlace,
  calcularEspacioNube,
  compartirCon,
  entrarAEditar,
  espacioLlenoParaSubir,
  generarEnlace,
  guardarCambios,
  quitarAcceso,
  resolverConflicto,
  restaurarVersion,
  revocarEnlace,
  type ArchivoNube,
  type PersonaNube,
} from '@/components/simuladores/nube/tiposNube';
import { useNube } from '@/components/simuladores/nube/useNube';
import { VentanaNube } from '@/components/simuladores/nube/VentanaNube';

const SOFI: PersonaNube = { id: 'sofi', nombre: 'Sofi' };
const DIEGO: PersonaNube = { id: 'diego', nombre: 'Diego' };
const MAESTRA: PersonaNube = { id: 'maestra', nombre: 'Maestra Ana' };

function nodo(parcial: Partial<ArchivoSO> & { id: string; nombre: string }): ArchivoSO {
  return { tipo: 'archivo', tamano: 100, fecha: '10 ago 2026', ...parcial };
}

function archivoNube(parcial: Partial<ArchivoNube> & { nodo: ArchivoSO; propietario: PersonaNube }): ArchivoNube {
  return { estado: 'subido', compartidoCon: [], historial: [], versionActualId: null, editandoAhora: [], ...parcial };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los datos puros (tiposNube.ts)
// ═══════════════════════════════════════════════════════════════════════════

describe('los datos puros de Tecnia Nube', () => {
  it('compartirCon: rechaza compartir con uno mismo, comparte y actualiza el permiso sin duplicar, y no hace nada si ya tenía ese permiso — jugar MAL', () => {
    const base = archivoNube({ nodo: nodo({ id: 'a1', nombre: 'tarea.docx' }), propietario: SOFI });

    const conUnoMismo = compartirCon(base, SOFI, 'editar');
    expect(conUnoMismo.ok).toBe(false);
    if (!conUnoMismo.ok) expect(conUnoMismo.motivo).toBe('uno-mismo');

    const r1 = compartirCon(base, DIEGO, 'ver');
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('debía compartirse');
    expect(r1.archivo.compartidoCon).toHaveLength(1);

    const r2 = compartirCon(r1.archivo, DIEGO, 'editar'); // cambia el permiso, no duplica la entrada
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('debía actualizarse');
    expect(r2.archivo.compartidoCon).toHaveLength(1);
    expect(r2.archivo.compartidoCon[0].permiso).toBe('editar');

    const r3 = compartirCon(r2.archivo, DIEGO, 'editar'); // el mismo permiso otra vez: no-operación
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.archivo).toBe(r2.archivo); // identidad
  });

  it('quitarAcceso: identidad si no tenía acceso, y si estaba editando también sale de "editando ahora" — jugar MAL (quitar el permiso a quien está dentro)', () => {
    const base = archivoNube({ nodo: nodo({ id: 'a1', nombre: 'cartel.pptx' }), propietario: SOFI });
    const r0 = quitarAcceso(base, 'diego');
    expect(r0.archivo).toBe(base); // identidad: nunca tuvo acceso

    const compartido = compartirCon(base, DIEGO, 'editar');
    if (!compartido.ok) throw new Error('debía compartirse');
    const editando = entrarAEditar(compartido.archivo, DIEGO);
    expect(editando.editandoAhora).toHaveLength(1);

    const r1 = quitarAcceso(editando, 'diego');
    expect(r1.estabaEditando).toBe(true);
    expect(r1.archivo.compartidoCon).toHaveLength(0);
    expect(r1.archivo.editandoAhora).toHaveLength(0);
    expect(r1.aviso).toMatch(/seguía editando/);
  });

  it('el enlace público: generar, que alguien lo abra (dos veces es no-operación), y revocarlo NUNCA borra quién ya entró — decisión 2', () => {
    let archivo = archivoNube({ nodo: nodo({ id: 'a1', nombre: 'permiso.pdf' }), propietario: SOFI });
    archivo = generarEnlace(archivo, 'ver');
    expect(archivo.enlace?.activo).toBe(true);

    const r1 = abrirEnlace(archivo, DIEGO);
    expect(r1.ok).toBe(true);
    archivo = r1.archivo;
    expect(archivo.enlace?.abiertoPor).toHaveLength(1);

    const r2 = abrirEnlace(archivo, DIEGO); // el mismo otra vez: no-operación
    expect(r2.archivo).toBe(archivo); // identidad

    archivo = revocarEnlace(archivo);
    expect(archivo.enlace?.activo).toBe(false);
    expect(archivo.enlace?.abiertoPor).toHaveLength(1); // Diego sigue ahí: ya lo vio

    const r3 = abrirEnlace(archivo, MAESTRA); // el enlace ya no funciona
    expect(r3.ok).toBe(false);
  });

  it('guardarCambios: guarda en línea, guarda sin conexión como "solo-local", un choque de bases crea un conflicto real, y no deja guardar más encima — jugar MAL (editar lo que otro ya guardó)', () => {
    const base = archivoNube({ nodo: nodo({ id: 'a1', nombre: 'informe.docx' }), propietario: SOFI });

    const v1 = guardarCambios(base, { id: 'v1', autor: SOFI, fecha: 'Hoy 9:00', basadaEnVersionId: null }, 'en-linea');
    if (!v1.ok) throw new Error();
    expect(v1.conflicto).toBe(false);
    expect(v1.archivo.estado).toBe('subido');

    const sinConexion = guardarCambios(v1.archivo, { id: 'v-local', autor: SOFI, fecha: '9:04', basadaEnVersionId: 'v1' }, 'sin-conexion');
    if (!sinConexion.ok) throw new Error();
    expect(sinConexion.archivo.estado).toBe('solo-local');

    // Sofi guarda v2 sobre v1 (en línea)...
    const sofiGuarda = guardarCambios(v1.archivo, { id: 'v2', autor: SOFI, fecha: '9:05', basadaEnVersionId: 'v1' }, 'en-linea');
    if (!sofiGuarda.ok) throw new Error();
    // ...y Diego, que seguía viendo v1 sin saberlo, también guarda sobre v1:
    const diegoGuarda = guardarCambios(sofiGuarda.archivo, { id: 'v-diego', autor: DIEGO, fecha: '9:03', basadaEnVersionId: 'v1' }, 'en-linea');
    expect(diegoGuarda.ok).toBe(true);
    if (!diegoGuarda.ok) throw new Error();
    expect(diegoGuarda.conflicto).toBe(true);
    expect(diegoGuarda.archivo.estado).toBe('conflicto');
    expect(diegoGuarda.archivo.conflicto?.local.autor.nombre).toBe('Diego');
    expect(diegoGuarda.archivo.conflicto?.remota.autor.nombre).toBe('Sofi');
    expect(diegoGuarda.archivo.historial).toHaveLength(2); // NO se agregó nada: sigue sin decidir

    const otroGuardado = guardarCambios(diegoGuarda.archivo, { id: 'v3', autor: SOFI, fecha: '9:10', basadaEnVersionId: 'v2' }, 'en-linea');
    expect(otroGuardado.ok).toBe(false);
    if (!otroGuardado.ok) expect(otroGuardado.motivo).toBe('ya-en-conflicto');
  });

  it('resolverConflicto: local, remota o conservar-ambas destraban el archivo, y resolver una segunda vez se rechaza — jugar MAL', () => {
    const conConflicto: ArchivoNube = archivoNube({
      nodo: nodo({ id: 'a1', nombre: 'x.docx' }),
      propietario: SOFI,
      estado: 'conflicto',
      historial: [{ id: 'v1', autor: SOFI, fecha: '9:00' }],
      versionActualId: 'v1',
      conflicto: { local: { id: 'v-diego', autor: DIEGO, fecha: '9:03' }, remota: { id: 'v2', autor: SOFI, fecha: '9:05' } },
    });

    const rLocal = resolverConflicto(conConflicto, 'local');
    expect(rLocal.ok).toBe(true);
    if (!rLocal.ok) throw new Error();
    expect(rLocal.archivo.conflicto).toBeUndefined();
    expect(rLocal.archivo.versionActualId).toBe('v-diego');
    expect(rLocal.archivo.estado).toBe('subido');

    const rOtraVez = resolverConflicto(rLocal.archivo, 'remota');
    expect(rOtraVez.ok).toBe(false);
    if (!rOtraVez.ok) expect(rOtraVez.motivo).toBe('no-hay-conflicto');

    const rAmbas = resolverConflicto(conConflicto, 'conservar-ambas');
    if (!rAmbas.ok) throw new Error();
    expect(rAmbas.archivo.historial).toHaveLength(3); // v1 + remota + local
    expect(rAmbas.archivo.versionActualId).toBe('v-diego');
  });

  it('restaurarVersion: vuelve a una versión anterior, no hace nada si ya era la actual (identidad), y rechaza una que ya no existe — jugar MAL', () => {
    const archivo = archivoNube({
      nodo: nodo({ id: 'a1', nombre: 'y.docx' }),
      propietario: SOFI,
      historial: [{ id: 'v1', autor: SOFI, fecha: '9:00' }, { id: 'v2', autor: DIEGO, fecha: '9:10' }],
      versionActualId: 'v2',
    });
    const r1 = restaurarVersion(archivo, 'v1');
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.archivo.versionActualId).toBe('v1');

    const r2 = restaurarVersion(archivo, 'v2');
    expect(r2.archivo).toBe(archivo); // identidad: ya era la actual

    const r3 = restaurarVersion(archivo, 'fantasma');
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.motivo).toBe('no-existe');
  });

  it('calcularEspacioNube sólo cuenta lo que ya llegó a la nube, y espacioLlenoParaSubir detecta cuando ya no cabe — jugar MAL (llenar el espacio y seguir subiendo)', () => {
    const archivos: ArchivoNube[] = [
      archivoNube({ nodo: nodo({ id: 'a', nombre: 'a.docx', tamano: 1000 }), propietario: SOFI, estado: 'subido' }),
      archivoNube({ nodo: nodo({ id: 'b', nombre: 'b.docx', tamano: 2000 }), propietario: SOFI, estado: 'solo-local' }), // no cuenta
      archivoNube({ nodo: nodo({ id: 'c', nombre: 'c.docx', tamano: 500 }), propietario: SOFI, estado: 'conflicto' }),
    ];
    const espacio = calcularEspacioNube(archivos, 1200);
    expect(espacio.usados).toBe(1500); // 1000 + 500, NUNCA los 2000 de "solo-local"
    expect(espacio.libres).toBe(0);
    expect(espacioLlenoParaSubir(espacio, 1)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La máquina (useNube)
// ═══════════════════════════════════════════════════════════════════════════

describe('la máquina de Tecnia Nube (useNube)', () => {
  it('subir: en línea pasa por "subiendo" a "subido"; sin conexión no transiciona y se encola, y al volver arranca solo — jugar MAL + qué pasa al volver', () => {
    const { result } = renderHook(() =>
      useNube({
        archivos: [
          archivoNube({ nodo: nodo({ id: 'a', nombre: 'a.docx', tamano: 100 }), propietario: SOFI, estado: 'solo-local' }),
          archivoNube({ nodo: nodo({ id: 'b', nombre: 'b.docx', tamano: 50 }), propietario: SOFI, estado: 'solo-local' }),
        ],
        capacidad: 1_000_000,
      }),
    );
    act(() => {
      result.current.subir('a');
    });
    expect(result.current.archivos.find((x) => x.nodo.id === 'a')?.estado).toBe('subiendo');
    act(() => result.current.completarSubida('a'));
    expect(result.current.archivos.find((x) => x.nodo.id === 'a')?.estado).toBe('subido');

    act(() => result.current.perderConexion());
    act(() => {
      const r = result.current.subir('b');
      expect(r.ok).toBe(false);
    });
    expect(result.current.archivos.find((x) => x.nodo.id === 'b')?.estado).toBe('solo-local'); // no cambió
    expect(result.current.colaPendiente).toEqual(['b']);

    act(() => result.current.recuperarConexion());
    expect(result.current.colaPendiente).toEqual([]);
    expect(result.current.archivos.find((x) => x.nodo.id === 'b')?.estado).toBe('subiendo'); // arrancó solo
  });

  it('subir se rechaza si ya no cabe en el espacio contratado, sin cambiar el estado — jugar MAL (llenar el espacio y seguir subiendo)', () => {
    const { result } = renderHook(() =>
      useNube({
        archivos: [
          archivoNube({ nodo: nodo({ id: 'a', nombre: 'grande.mp4', tamano: 900 }), propietario: SOFI, estado: 'subido' }),
          archivoNube({ nodo: nodo({ id: 'b', nombre: 'otro.docx', tamano: 200 }), propietario: SOFI, estado: 'solo-local' }),
        ],
        capacidad: 1000,
      }),
    );
    act(() => {
      const r = result.current.subir('b');
      expect(r.ok).toBe(false);
      expect(r.aviso).toMatch(/no hay espacio/i);
    });
    expect(result.current.archivos.find((x) => x.nodo.id === 'b')?.estado).toBe('solo-local');
  });

  it('compartir y quitarAcceso vía el gancho: quitarle el acceso a quien edita también lo saca de "editando ahora"', () => {
    const { result } = renderHook(() =>
      useNube({ archivos: [archivoNube({ nodo: nodo({ id: 'a', nombre: 'plan.xlsx' }), propietario: SOFI })], capacidad: 1_000_000 }),
    );
    act(() => result.current.compartir('a', DIEGO, 'editar'));
    act(() => result.current.entrarAEditar('a', DIEGO));
    expect(result.current.archivos[0].editandoAhora).toHaveLength(1);

    act(() => result.current.quitarAcceso('a', 'diego'));
    expect(result.current.archivos[0].compartidoCon).toHaveLength(0);
    expect(result.current.archivos[0].editandoAhora).toHaveLength(0);
  });

  it('guardarCambios vía el gancho detecta el choque cuando dos personas guardan sobre la misma versión base', () => {
    const { result } = renderHook(() =>
      useNube({ archivos: [archivoNube({ nodo: nodo({ id: 'a', nombre: 'ensayo.docx' }), propietario: SOFI })], capacidad: 1_000_000 }),
    );
    act(() => result.current.guardarCambios('a', { autor: SOFI, fecha: '9:00', basadaEnVersionId: null }));
    const primera = result.current.archivos[0].versionActualId;
    act(() => {
      const r = result.current.guardarCambios('a', { autor: DIEGO, fecha: '9:05', basadaEnVersionId: primera });
      expect(r.ok).toBe(true);
    });
    act(() => {
      // Sofi seguía viendo la primera versión cuando también guarda:
      const r = result.current.guardarCambios('a', { autor: SOFI, fecha: '9:04', basadaEnVersionId: primera });
      expect(r.ok).toBe(true);
    });
    expect(result.current.archivos[0].estado).toBe('conflicto');
    expect(result.current.archivos[0].conflicto).toBeDefined();
  });

  it('reiniciar vuelve exactamente al estado con el que se montó', () => {
    const { result } = renderHook(() =>
      useNube({ archivos: [archivoNube({ nodo: nodo({ id: 'a', nombre: 'a.docx' }), propietario: SOFI })], capacidad: 1_000_000 }),
    );
    act(() => result.current.compartir('a', DIEGO, 'ver'));
    act(() => result.current.perderConexion());
    expect(result.current.archivos[0].compartidoCon).toHaveLength(1);

    act(() => result.current.reiniciar());
    expect(result.current.archivos[0].compartidoCon).toHaveLength(0);
    expect(result.current.conexion).toBe('en-linea');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana (VentanaNube) — cero `useState`, todo por parámetro
// ═══════════════════════════════════════════════════════════════════════════

describe('VentanaNube', () => {
  it('pinta la lista con el badge de estado de cada archivo, y sin selección se ve el mensaje vacío del detalle', () => {
    const archivos = [
      archivoNube({ nodo: nodo({ id: 'a', nombre: 'tarea.docx' }), propietario: SOFI, estado: 'subido' }),
      archivoNube({ nodo: nodo({ id: 'b', nombre: 'fotos.zip' }), propietario: SOFI, estado: 'conflicto' }),
    ];
    render(<VentanaNube archivos={archivos} seleccionId={null} conexion="en-linea" />);
    expect(screen.getAllByTestId('nube-fila')).toHaveLength(2);
    expect(screen.getByText(/Sincronizado/)).toBeInTheDocument();
    expect(screen.getByText(/En conflicto/)).toBeInTheDocument();
    expect(screen.getByText(/Elige un archivo/)).toBeInTheDocument();
  });

  it('clic en una fila llama a onSeleccionar con el id del nodo', () => {
    const archivo = archivoNube({ nodo: nodo({ id: 'a', nombre: 'x.docx' }), propietario: SOFI });
    const onSeleccionar = jest.fn();
    render(<VentanaNube archivos={[archivo]} seleccionId={null} conexion="en-linea" onSeleccionar={onSeleccionar} />);
    fireEvent.click(screen.getByTestId('nube-fila'));
    expect(onSeleccionar).toHaveBeenCalledWith('a');
  });

  it('al seleccionar un archivo se pinta su historial con la versión actual marcada', () => {
    const archivo = archivoNube({
      nodo: nodo({ id: 'a', nombre: 'informe.docx' }),
      propietario: SOFI,
      historial: [{ id: 'v1', autor: SOFI, fecha: '9:00' }, { id: 'v2', autor: DIEGO, fecha: '9:10' }],
      versionActualId: 'v2',
    });
    render(<VentanaNube archivos={[archivo]} seleccionId="a" conexion="en-linea" />);
    expect(screen.getAllByTestId('nube-version')).toHaveLength(2);
    expect(screen.getByText('Versión actual')).toBeInTheDocument();
  });

  it('el formulario de compartir dispara onCompartir con la persona y el permiso elegidos', () => {
    const archivo = archivoNube({ nodo: nodo({ id: 'a', nombre: 'x.docx' }), propietario: SOFI });
    const onCompartir = jest.fn();
    render(
      <VentanaNube
        archivos={[archivo]}
        seleccionId="a"
        conexion="en-linea"
        compartirForm={{ candidatos: [DIEGO], personaId: 'diego', onCambiarPersona: () => {}, permiso: 'editar', onCambiarPermiso: () => {}, onCompartir }}
      />,
    );
    fireEvent.click(screen.getByText('Compartir'));
    expect(onCompartir).toHaveBeenCalledTimes(1);
  });

  it('quitar acceso desde la UI llama a onQuitarAcceso con el archivo y la persona correctos', () => {
    const archivo = archivoNube({
      nodo: nodo({ id: 'a', nombre: 'x.docx' }),
      propietario: SOFI,
      compartidoCon: [{ persona: DIEGO, permiso: 'ver' }],
    });
    const onQuitarAcceso = jest.fn();
    render(<VentanaNube archivos={[archivo]} seleccionId="a" conexion="en-linea" onQuitarAcceso={onQuitarAcceso} />);
    fireEvent.click(screen.getByLabelText('Quitar acceso a Diego'));
    expect(onQuitarAcceso).toHaveBeenCalledWith('a', 'diego');
  });

  it('el enlace: "No hay enlace activo" cuando está revocado, y quien ya lo abrió se sigue viendo — la irrevocabilidad, visible', () => {
    const archivo = archivoNube({
      nodo: nodo({ id: 'a', nombre: 'y.docx' }),
      propietario: SOFI,
      enlace: { activo: false, permiso: 'ver', abiertoPor: [DIEGO] },
    });
    render(
      <VentanaNube
        archivos={[archivo]}
        seleccionId="a"
        conexion="en-linea"
        enlaceForm={{ permiso: 'ver', onCambiarPermiso: () => {}, onGenerar: () => {}, onRevocar: () => {} }}
      />,
    );
    expect(screen.getByText(/No hay enlace activo/)).toBeInTheDocument();
    expect(screen.getByTestId('nube-enlace-vistos')).toHaveTextContent('Diego');
  });

  it('el conflicto pinta las dos versiones y "Usar esta" llama a onResolverConflicto con la elección correcta', () => {
    const archivo = archivoNube({
      nodo: nodo({ id: 'a', nombre: 'z.docx' }),
      propietario: SOFI,
      estado: 'conflicto',
      historial: [{ id: 'v1', autor: SOFI, fecha: '9:00' }],
      versionActualId: 'v1',
      conflicto: { local: { id: 'vl', autor: DIEGO, fecha: '9:03' }, remota: { id: 'vr', autor: SOFI, fecha: '9:05' } },
    });
    const onResolverConflicto = jest.fn();
    render(<VentanaNube archivos={[archivo]} seleccionId="a" conexion="en-linea" onResolverConflicto={onResolverConflicto} />);
    const botones = screen.getAllByText('Usar esta');
    expect(botones).toHaveLength(2);
    fireEvent.click(botones[0]);
    expect(onResolverConflicto).toHaveBeenCalledWith('a', 'local');
  });

  it('la barra pinta la conexión, la cola pendiente y el espacio usado', () => {
    const archivo = archivoNube({ nodo: nodo({ id: 'a', nombre: 'x.docx', tamano: 500 }), propietario: SOFI });
    render(
      <VentanaNube
        archivos={[archivo]}
        seleccionId={null}
        conexion="sin-conexion"
        colaPendiente={['a']}
        espacio={{ capacidad: 1000, usados: 500, libres: 500, porcentaje: 0.5 }}
      />,
    );
    expect(screen.getByTestId('nube-conexion')).toHaveTextContent(/Sin conexión/);
    expect(screen.getByTestId('nube-cola')).toHaveTextContent(/1 en espera de subir/);
    expect(screen.getByTestId('nube-espacio')).toHaveTextContent('500 B usados de 1000 B');
  });

  it('coautoría: se ve quién edita ahora, y "Entrar a editar" / "Guardar cambios" llaman a sus manejadores con el id del archivo', () => {
    const archivo = archivoNube({ nodo: nodo({ id: 'a', nombre: 'x.docx' }), propietario: SOFI, editandoAhora: [DIEGO] });
    const onEntrarAEditar = jest.fn();
    const onGuardarCambios = jest.fn();
    render(
      <VentanaNube
        archivos={[archivo]}
        seleccionId="a"
        conexion="en-linea"
        onEntrarAEditar={onEntrarAEditar}
        onGuardarCambios={onGuardarCambios}
      />,
    );
    expect(screen.getByTestId('nube-coautoria')).toHaveTextContent('Diego');
    fireEvent.click(screen.getByText('✏️ Entrar a editar'));
    expect(onEntrarAEditar).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByTestId('nube-guardar'));
    expect(onGuardarCambios).toHaveBeenCalledWith('a');
  });
});
