/**
 * `n7-sistemas-operativos` · N7·U1 «Arquitectura y sistemas», parada 3 de 4.
 * Temario propio en `DOC-N7-n7-sistemas-operativos.md`. **12–13 años**, leído
 * en `curriculo.ts` y comprobado aquí abajo.
 *
 * Lo que esta suite vigila:
 *
 *  · Que **cada piel resuelva las tres tareas exactamente una vez**. Un
 *    `resuelve` mal copiado entre dos pieles no lo caza el compilador —los dos
 *    son `TareaId` válidos— ni una partida que no llegue a esa pantalla.
 *  · Que **las cinco puertas de la tarea `abrir` sean cinco puntos distintos**.
 *    Si dos sistemas resolvieran la tarea en el mismo sitio con el mismo
 *    nombre, la clase entera se quedaría sin nada que enseñar.
 *  · Que **ningún icono de aplicación resuelva `abrir`**: es el predicado que
 *    haría injusta la ronda (tocar un icono TAMBIÉN abre una app en un táctil).
 *  · Que un punto que resuelve **otra** de las tres tareas se explique distinto
 *    que uno que no resuelve ninguna: si dijeran lo mismo, media lección —«eso
 *    también está en la lista, pero no es lo que te pedí»— se habría perdido.
 *  · Jugando MAL: tocar el reloj, confundir instalar con abrir, insistir en el
 *    mismo punto malo, y pulsar dos veces el que ya acertó.
 *  · Y el recorrido completo: 21 pasos hasta la insignia, con 100 y 3 estrellas.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import EntradaSistemasOperativos from '@/components/activities/n7/sistemas/EntradaSistemasOperativos';
import { PantallaSistema } from '@/components/activities/n7/sistemas/PantallaSistema';
import {
  BRUMA,
  ENCARGOS,
  OFICIOS,
  PIELES_COMPARADAS,
  TAREAS,
  TODAS_LAS_PIELES,
  TOTAL_PASOS,
  juzgarToque,
  puntoQueResuelve,
  validarPieles,
  type PielSistema,
  type TareaId,
} from '@/components/activities/n7/sistemas/sistemasOperativos';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

/* ── utilidades ───────────────────────────────────────────────────────── */

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaSistemasOperativos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

function abrirLaboratorio() {
  const api = montar();
  fireEvent.click(screen.getByText('Entra al laboratorio'));
  fireEvent.click(screen.getByTestId('so-empezar'));
  return api;
}

const bitDice = () => screen.getByTestId('so-bit').textContent ?? '';
const tocarPunto = (puntoId: string) =>
  fireEvent.click(screen.getByTestId('so-aparato').querySelector(`[data-punto="${puntoId}"]`) as HTMLElement);
const elegirOficio = (oficioId: string) =>
  fireEvent.click(document.querySelector(`[data-oficio="${oficioId}"]`) as HTMLElement);
const celda = (tareaId: string, pielId: string) =>
  screen.getByTestId('so-tabla').querySelector(`[data-celda="${tareaId}|${pielId}"]`)?.textContent ?? '';

/** Contesta bien los seis encargos del acto 1 y entra al banco. */
function resolverLosEncargos() {
  for (const encargo of ENCARGOS) {
    elegirOficio(encargo.respuesta);
    fireEvent.click(screen.getByRole('button', { name: /Siguiente encargo|Ir al banco de sistemas/ }));
  }
}

/** Acierta la tarea `tarea` en la piel que esté en pantalla y pasa a la siguiente. */
function resolverPantalla(piel: PielSistema, tarea: TareaId) {
  const punto = puntoQueResuelve(piel, tarea);
  tocarPunto(punto!.id);
  fireEvent.click(screen.getByRole('button', { name: /^(Siguiente|Terminar)$/ }));
}

/* ── las tablas, en aritmética pura ───────────────────────────────────── */

describe('n7-sistemas-operativos · los datos, sin montar nada', () => {
  it('el nivel y la edad son los del currículo: N7 es secundaria, no primaria', () => {
    const n7 = CURRICULO.find((n) => n.n === 7);
    const unidad = n7?.unidades.find((u) => u.id === 'n7-arquitectura-y-sistemas');
    expect(n7?.edad).toBe('12–13');
    expect(n7?.grado).toBe('1° de Secundaria');
    expect(n7?.etapa).toBe('secundaria');
    expect(unidad?.eje).toBe('sistemas');
    expect(unidad?.actividades.find((a) => a.id === 'n7-sistemas-operativos')).toBeDefined();
  });

  it('las cinco pieles están bien escritas: tres tareas, una vez cada una', () => {
    expect(validarPieles()).toEqual([]);
    expect(TODAS_LAS_PIELES).toHaveLength(5);
    expect(PIELES_COMPARADAS).toHaveLength(4);
  });

  it('`validarPieles` de verdad caza una piel rota — la autoprueba de la medida', () => {
    const rota: PielSistema = {
      ...BRUMA,
      id: 'rota',
      puntos: [
        // «Mis cosas» resuelve `abrir` además de `todo-instalado`: dos puertas
        // para la misma tarea, que es justo el error que no puede pasar.
        { ...BRUMA.puntos[0] },
        { ...BRUMA.puntos[1], resuelve: 'abrir' as const },
        { ...BRUMA.puntos[2] },
        { ...BRUMA.puntos[3] },
        { ...BRUMA.puntos[4] },
      ],
    };
    const problemas = validarPieles([rota]);
    expect(problemas.some((p) => p.includes('«abrir» la resuelven 2'))).toBe(true);
    expect(problemas.some((p) => p.includes('«archivos» la resuelven 0'))).toBe(true);
  });

  it('las cinco puertas de «abrir un programa» son cinco sitios con cinco nombres distintos', () => {
    const puertas = TODAS_LAS_PIELES.map((p) => puntoQueResuelve(p, 'abrir')!);
    expect(puertas).toHaveLength(5);
    expect(new Set(puertas.map((p) => p.id)).size).toBe(5);
    expect(new Set(puertas.map((p) => p.etiqueta)).size).toBe(5);
    // Y ninguna de las cinco vive en la misma zona en los cinco sistemas: si
    // todas estuvieran abajo a la izquierda no habría nada que comparar.
    expect(new Set(puertas.map((p) => p.zona)).size).toBeGreaterThan(1);
  });

  it('ningún icono de aplicación resuelve «abrir»: ése sería un predicado injusto', () => {
    // Tocar el icono de una app TAMBIÉN la abre en un teléfono o una tablet.
    // Por eso el encargo dice «que no ves» y la respuesta buena es siempre la
    // puerta a todo lo instalado, nunca un icono suelto del lienzo.
    for (const piel of TODAS_LAS_PIELES) {
      const puerta = puntoQueResuelve(piel, 'abrir')!;
      expect(puerta.zona).not.toBe('lienzo');
    }
  });

  it('los seis encargos cubren los cinco oficios y la trampa de la frontera', () => {
    expect(ENCARGOS).toHaveLength(6);
    expect(new Set(ENCARGOS.map((e) => e.respuesta)).size).toBe(6);
    expect(ENCARGOS.filter((e) => e.respuesta === 'aplicacion')).toHaveLength(1);
    expect(OFICIOS).toHaveLength(6);
  });

  it('los pasos son 6 + 4×3 + 3 = 21', () => {
    expect(TOTAL_PASOS).toBe(21);
  });

  it('tocar un punto que resuelve OTRA tarea no se explica igual que uno que no resuelve ninguna', () => {
    const otraTarea = juzgarToque(BRUMA, 'mis-cosas', 'abrir');
    const ninguna = juzgarToque(BRUMA, 'hora-bruma', 'abrir');
    expect(otraTarea.acierto).toBe(false);
    expect(ninguna.acierto).toBe(false);
    expect(otraTarea).toMatchObject({ motivo: 'otra-tarea' });
    expect(ninguna).toMatchObject({ motivo: 'no-es-eso' });
    expect(otraTarea.linea).not.toBe(ninguna.linea);
    expect(otraTarea.linea).toContain('Ver tus archivos');
  });

  it('el acierto devuelve el resultado del punto, no su descripción genérica', () => {
    const v = juzgarToque(BRUMA, 'todo-instalado', 'abrir');
    expect(v.acierto).toBe(true);
    expect(v.linea).toBe(BRUMA.puntos[0].resultado);
  });

  it('ninguna interfaz simulada lleva una marca real: los nombres reales sólo los dice Bit', () => {
    const marcas = /windows|android|linux|ios|macos|apple|microsoft|google/i;
    for (const piel of TODAS_LAS_PIELES) {
      expect(piel.nombre).not.toMatch(marcas);
      expect(piel.columna).not.toMatch(marcas);
      for (const punto of piel.puntos) {
        expect(punto.etiqueta).not.toMatch(marcas);
      }
    }
    // Y sí están donde tienen que estar: en lo que Bit dice en voz alta.
    expect(PIELES_COMPARADAS.map((p) => p.familiaReal).join(' ')).toMatch(marcas);
  });
});

/* ── las pantallas, de verdad distintas ───────────────────────────────── */

describe('n7-sistemas-operativos · las cinco pantallas no son la misma con otro color', () => {
  /**
   * La premisa entera de la clase es que las interfaces son **estructuralmente**
   * distintas. Si las cinco pintaran las mismas barras en los mismos sitios, la
   * clase seguiría pasando todas las demás pruebas —los datos serían correctos—
   * y no enseñaría nada. Es exactamente el motivo por el que
   * `simuladores/sistema/Escritorio.tsx` no servía: su `marca` cambia el nombre,
   * no la estructura.
   */
  const zonasDe = (piel: PielSistema) => {
    const { container, unmount } = render(<PantallaSistema piel={piel} />);
    const zonas = ['arriba', 'abajo', 'muelle', 'derecha']
      .filter((z) => container.querySelector(`.so-barra--${z}`) !== null)
      .join('+');
    const forma = container.querySelector('.so-pantalla')?.className ?? '';
    unmount();
    return `${forma}|${zonas}`;
  };

  it('las cinco reparten sus barras de cinco maneras distintas', () => {
    const firmas = TODAS_LAS_PIELES.map(zonasDe);
    expect(new Set(firmas).size).toBe(5);
  });

  it('el escritorio tiene barra abajo y el teléfono además barra de estado arriba', () => {
    expect(zonasDe(PIELES_COMPARADAS[0])).toContain('|abajo');
    expect(zonasDe(PIELES_COMPARADAS[2])).toContain('arriba+abajo');
    // Y el desconocido no tiene ninguna barra horizontal: sólo la del borde derecho.
    expect(zonasDe(BRUMA)).toContain('|derecha');
  });

  it('un punto acertado abre su panel dentro de la pantalla, no flotando fuera', () => {
    const puerta = puntoQueResuelve(BRUMA, 'abrir')!;
    const { container } = render(<PantallaSistema piel={BRUMA} abierto={puerta} bloqueado />);
    const panel = container.querySelector('.so-abierto');
    expect(panel).not.toBeNull();
    expect(container.querySelector('.so-pantalla')?.contains(panel as Node)).toBe(true);
    expect(panel?.textContent).toContain(puerta.resultado);
  });
});

/* ── la entrada ───────────────────────────────────────────────────────── */

describe('n7-sistemas-operativos · la entrada y la portada de objetivos', () => {
  it('la entrada es la de ESTA clase, no una heredada de su hermana', () => {
    montar();
    expect(screen.getByText('El Banco de Sistemas')).toBeInTheDocument();
    expect(screen.getByText(/Sin sistema operativo no arranca/)).toBeInTheDocument();
    expect(screen.getByText('Cuatro puertas, un cuarto')).toBeInTheDocument();
    // Es la parada 3 de la ruta de la unidad, no la 1 ni la 4.
    expect(screen.getByText('Sistemas operativos')).toBeInTheDocument();
    expect(screen.getByText('Dentro del gabinete')).toBeInTheDocument();
  });

  it('entrar al laboratorio enseña primero el tema y el objetivo, no la práctica', () => {
    montar();
    fireEvent.click(screen.getByText('Entra al laboratorio'));
    expect(screen.getByText(/cinco oficios/)).toBeInTheDocument();
    expect(screen.getByText(/sistema que nadie te enseñó/)).toBeInTheDocument();
    expect(screen.getByTestId('so-empezar')).toBeInTheDocument();
    // La mesa de encargos todavía no está: la portada va antes.
    expect(document.querySelector('[data-testid="so-oficio"]')).toBeNull();
  });
});

/*
 * El contrato de actividad, comprobado también aquí, a mano.
 *
 * Cuando se escribió esto la clase no estaba en el registro y `actividades-contrato.test.tsx`
 * —el harness compartido— no la tocaba. Ya lo está, así que estas dos pruebas
 * dejaron de ser la única red: son la misma exigencia escrita al lado de la
 * clase, que es donde se lee cuando alguien la modifica.
 *
 * El trato: montar sin `onSaveState`, pulsar el PRIMER botón del documento y
 * comprobar que nada truena ni se completa solo. Es exactamente lo que reventó
 * en `n5-conecta-perifericos` (§5.6 de `COMO-SE-CONSTRUYE.md`): allí el primer
 * botón era el CTA porque la clase declaraba `assetsPendientes`, el laboratorio
 * se montaba de verdad y `matchMedia` no existía.
 *
 * ESE DÍA LLEGÓ: el video se grabó y se publicó el 2-sep-2026, `public/assets/
 * actividades/n7-sistemas-operativos/video-explicativo.mp4` existe, la bandera
 * `assetsPendientes` bajó a `false` y la primera prueba de abajo —escrita a
 * propósito para fallar el día de la publicación— falló y avisó. Cumplió su
 * oficio y ahora afirma el estado nuevo: cubrepantalla delante, reproductor
 * detrás y ningún aviso de «se está grabando».
 *
 * La segunda prueba no cambia ni una línea, y esa es la gracia: sigue pulsando
 * el PRIMER botón del documento sin saber cuál es —antes el CTA, ahora el de la
 * portada— y sigue exigiendo que la clase no se complete sola. Es la exigencia
 * que reventó en `n5-conecta-perifericos`, y aguanta el cambio de bandera.
 */
describe('n7-sistemas-operativos · el contrato de actividad', () => {
  it('con el video publicado, el primer botón es el de la portada y el reproductor ocupa su sitio', () => {
    const { container } = montar();
    const primero = container.querySelector('button') as HTMLButtonElement;
    expect(primero.getAttribute('aria-label')).toBe('Iniciar video');
    expect(container.querySelector('video')).not.toBeNull();
    expect(container.querySelector('.video-pendiente')).toBeNull();
  });

  it('monta sin `onSaveState`, tolera el clic genérico del harness y no se completa sola', () => {
    const onProgress = jest.fn();
    const onScore = jest.fn();
    const onComplete = jest.fn();
    const { container } = render(
      <EntradaSistemasOperativos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
    );
    expect(container.firstChild).not.toBeNull();
    expect(onProgress).toHaveBeenCalled();
    fireEvent.click(container.querySelector('button') as HTMLButtonElement);
    expect(onProgress.mock.calls.every(([v]) => v >= 0 && v <= 1)).toBe(true);
    expect(onScore.mock.calls.every(([v]) => v >= 0 && v <= 100)).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

/* ── jugando mal a propósito ──────────────────────────────────────────── */

describe('n7-sistemas-operativos · jugando mal a propósito', () => {
  it('elegir el oficio equivocado explica qué hace ESE oficio y deja el encargo abierto', () => {
    const { onScore } = abrirLaboratorio();
    elegirOficio('permisos');
    expect(bitDice()).toContain('qué puede hacer cada cuenta');
    expect(onScore).toHaveBeenLastCalledWith(94);
    // El encargo sigue abierto: los seis botones siguen ahí y se puede acertar.
    elegirOficio('memoria');
    expect(bitDice()).toContain('cuánta RAM queda libre');
    expect(screen.getByRole('button', { name: 'Siguiente encargo' })).toBeInTheDocument();
  });

  it('decir «lo hace una aplicación» cuando sí lo hace el sistema avisa de la frontera', () => {
    abrirLaboratorio();
    elegirOficio('aplicacion');
    expect(bitDice()).toContain('eso SÍ lo hace el sistema');
  });

  it('insistir en el mismo botón malo cuesta cada vez, y no avanza ni un paso', () => {
    const { onScore, onProgress } = abrirLaboratorio();
    for (let i = 0; i < 5; i += 1) elegirOficio('turnos');
    expect(onScore).toHaveBeenLastCalledWith(70);
    // Ni un solo onProgress mayor que 0: no se avanzó nada equivocándose.
    expect(onProgress.mock.calls.every(([v]) => v === 0)).toBe(true);
  });

  it('tocar el reloj buscando los ajustes dice qué es el reloj y dónde están los ajustes', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    // Fase «abrir», en Ventanal. El reloj no resuelve nada.
    tocarPunto('reloj');
    expect(bitDice()).toContain('la hora, la fecha');
    expect(bitDice()).toContain('icono del volumen');
  });

  it('confundir instalar con abrir se explica, y es la lección del distractor', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    resolverPantalla(PIELES_COMPARADAS[0], 'abrir'); // Ventanal
    // Ahora Raíz. El centro de programas instala; Actividades abre.
    tocarPunto('centro-programas');
    expect(bitDice()).toContain('Instalar no es abrir');
    /*
     * Y el toque fue RECHAZADO, no sólo comentado. Sin estas dos líneas la
     * prueba se quedaba verde con el defecto plantado «centro-programas
     * resuelve abrir»: el texto salía igual porque un punto sin `resultado`
     * cae a su `queHace`. Medido plantando el defecto el 21-ago-2026.
     */
    expect(screen.queryByTestId('so-abierto')).toBeNull();
    expect(celda('abrir', 'raiz')).toBe('—');
  });

  it('tocar el explorador buscando abrir un programa avisa de que ESO es otra tarea de la lista', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    tocarPunto('explorador');
    expect(bitDice()).toContain('Ver tus archivos');
    // Y no rellenó la celda de «ver tus archivos»: acertar por accidente en la
    // tarea equivocada no cuenta como haberla hecho.
    expect(celda('archivos', 'ventanal')).toBe('—');
  });

  it('acertado el punto, sus botones quedan bloqueados: un segundo clic no avanza dos veces', () => {
    const { onProgress } = abrirLaboratorio();
    resolverLosEncargos();
    tocarPunto('inicio');
    const antes = onProgress.mock.calls.length;
    /*
     * Medido plantando el defecto (`disabled={false}`): esta prueba se pone
     * roja en la línea de abajo, y SÓLO en ella. Lo que demuestra es que la
     * guarda existe, no que un segundo aviso sea imposible — el segundo clic
     * ni siquiera llega al listener mientras el botón esté deshabilitado, así
     * que la guarda del manejador (`if (fase.abierto !== null) return`) es una
     * segunda capa que desde fuera no se puede ejercitar. Es la trampa 7 de
     * `COMO-SE-CONSTRUYE.md`: lo honesto es medir lo observable y decir hasta
     * dónde llega la medida.
     */
    const boton = screen.getByTestId('so-aparato').querySelector('[data-punto="inicio"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    fireEvent.click(boton);
    expect(onProgress.mock.calls.length).toBe(antes);
  });

  it('en el sistema desconocido, «Ayuda» contesta lo que cierra la clase', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    for (const tarea of TAREAS) for (const piel of PIELES_COMPARADAS) resolverPantalla(piel, tarea.id);
    expect(screen.getByTestId('so-aparato')).toHaveAttribute('data-piel', 'bruma');
    tocarPunto('ayuda');
    expect(bitDice()).toContain('no te hace falta');
  });
});

/* ── la tabla comparativa, que es el artefacto de la clase ────────────── */

describe('n7-sistemas-operativos · la tabla se llena con lo que el alumno encuentra', () => {
  it('cada acierto escribe el nombre del sitio de ESE sistema, no el de otro', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    expect(celda('abrir', 'ventanal')).toBe('—');

    resolverPantalla(PIELES_COMPARADAS[0], 'abrir');
    expect(celda('abrir', 'ventanal')).toBe('Inicio');
    expect(celda('abrir', 'raiz')).toBe('—');

    resolverPantalla(PIELES_COMPARADAS[1], 'abrir');
    expect(celda('abrir', 'raiz')).toBe('Actividades');

    resolverPantalla(PIELES_COMPARADAS[2], 'abrir');
    expect(celda('abrir', 'bolsillo')).toBe('Cajón de aplicaciones');

    resolverPantalla(PIELES_COMPARADAS[3], 'abrir');
    expect(celda('abrir', 'cristal')).toBe('Buscar');
    // Fila completa: cuatro nombres distintos para el mismo trabajo. Ésa es
    // toda la clase, y aquí está medida.
    expect(bitDice()).toContain('Mismo trabajo, otra puerta');
  });

  it('la columna del sistema desconocido no existe hasta que llega su turno', () => {
    abrirLaboratorio();
    resolverLosEncargos();
    const tabla = () => screen.getByTestId('so-tabla');
    expect(within(tabla()).queryByText(/Bruma/)).toBeNull();

    for (const tarea of TAREAS) for (const piel of PIELES_COMPARADAS) resolverPantalla(piel, tarea.id);
    expect(within(tabla()).getByText(/Bruma/)).toBeInTheDocument();
  });
});

/* ── recorrido completo ───────────────────────────────────────────────── */

describe('n7-sistemas-operativos · recorrido completo', () => {
  it('21 pasos hasta la insignia, y una partida perfecta saca 100 y tres estrellas', () => {
    const { onComplete, onProgress, onScore } = abrirLaboratorio();

    resolverLosEncargos();
    for (const tarea of TAREAS) for (const piel of PIELES_COMPARADAS) resolverPantalla(piel, tarea.id);
    for (const tarea of TAREAS) resolverPantalla(BRUMA, tarea.id);

    // Todas las celdas de la tabla llenas: 3 tareas × 5 sistemas.
    for (const tarea of TAREAS) {
      for (const piel of [...PIELES_COMPARADAS, BRUMA]) {
        expect(celda(tarea.id, piel.id)).not.toBe('—');
      }
    }

    fireEvent.click(screen.getByTestId('so-terminar'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 0 });
    expect(typeof resultado.tiempoSegundos).toBe('number');

    // El progreso llegó a 1 y nunca se salió del rango del contrato.
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(onProgress.mock.calls.every(([v]) => v >= 0 && v <= 1)).toBe(true);
    expect(onScore.mock.calls.every(([v]) => v >= 0 && v <= 100)).toBe(true);

    expect(screen.getByText('ADMINISTRADOR DEL SISTEMA')).toBeInTheDocument();
    expect(screen.getByText(/la interfaz cambia, el trabajo del sistema operativo es el mismo/i)).toBeInTheDocument();
  });

  it('el camino de salida existe y «Jugar otra vez» devuelve la clase al principio', () => {
    const { onComplete } = abrirLaboratorio();
    resolverLosEncargos();
    for (const tarea of TAREAS) for (const piel of PIELES_COMPARADAS) resolverPantalla(piel, tarea.id);
    for (const tarea of TAREAS) resolverPantalla(BRUMA, tarea.id);
    fireEvent.click(screen.getByTestId('so-terminar'));
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
    expect(screen.getByTestId('so-empezar')).toBeInTheDocument();
    // Y la tabla vuelve vacía: no se queda con los hallazgos de la partida anterior.
    fireEvent.click(screen.getByTestId('so-empezar'));
    resolverLosEncargos();
    expect(celda('abrir', 'ventanal')).toBe('—');
    // Terminar no se volvió a disparar solo al reiniciar.
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('una partida con errores baja el puntaje pero se puede terminar igual', () => {
    const { onComplete } = abrirLaboratorio();
    elegirOficio('hardware'); // mal: el primero es la memoria
    elegirOficio('archivos'); // mal otra vez
    resolverLosEncargos();
    for (const tarea of TAREAS) for (const piel of PIELES_COMPARADAS) resolverPantalla(piel, tarea.id);
    for (const tarea of TAREAS) resolverPantalla(BRUMA, tarea.id);
    fireEvent.click(screen.getByTestId('so-terminar'));

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.errores).toBe(2);
    expect(resultado.score).toBe(88);
    expect(resultado.stars).toBe(3);
  });
});
