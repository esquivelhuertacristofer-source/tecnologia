'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LineaPintada } from '../codigo/ventana/coloreado';
import { recorrerElementos, type NodoElemento } from './arbolHtml';
import { colorearWeb } from './coloreadoWeb';
import { estiloVacio, type EstiloResuelto } from './cascada';
import { analizarPagina, type PaginaAnalizada, type RecursoWeb } from './pagina';
import { ANCHO_ESCRITORIO, ANCHO_MOVIL } from './subconjunto';
import type { ProblemaWeb } from './errores';
import {
  archivoDe,
  conTexto,
  type ArchivoWeb,
  type AvisoWeb,
  type EncargoWeb,
  type GuionWeb,
  type Publicacion,
  type ResumenWeb,
  type Vista,
  type VistaDeLaPagina,
} from './tiposWeb';

/**
 * TECNIA WEB · LA MÁQUINA DEL ESTUDIO
 *
 * Todo el estado vive aquí y `EstudioWeb` no tiene ni un `useState`: recibe lo
 * que este gancho devuelve y lo pinta. Es el trato de `VentanaHojas` con sus
 * 23 clases y el de `useCodigo` con `VentanaCodigo`, y por el mismo motivo: la
 * clase necesita el mando —para corregir, para reaccionar, para meter sus
 * propios botones— y no se lo puede dar una ventana que se guarda el estado
 * dentro.
 *
 * ── Lo que este gancho NO hace ─────────────────────────────────────────────
 *
 * No sabe si el alumno acertó. Los encargos traen su predicado escrito por la
 * clase; aquí sólo se llama y se cuenta (canon, prueba 3).
 *
 * ── Cuándo sale sola la pista ──────────────────────────────────────────────
 *
 * En el editor de Python la pista aparece «tras el primer intento fallido»,
 * y un intento es darle a ▶. Aquí no hay botón de ejecutar: **la página se
 * rehace en cada tecla**, así que no existe el momento «lo intentó y falló».
 * Lo que hay es una cuenta: tras 25 pulsaciones dentro del mismo encargo sin
 * cumplirlo, la pista se enseña sola. Y el botón «Necesito una pista» está
 * siempre. Nada de temporizadores: una prueba no puede esperar tres segundos.
 *
 * ── Dos defectos arreglados el 15-ago-2026, al montar las tres primeras ────
 *
 * Los encontró jugando MAL la primera clase de páginas web (§51), y los dos
 * eran del armazón, no de la clase:
 *
 * 1. **Un encargo que ya estaba cumplido al abrirse no se marcaba nunca.** El
 *    predicado sólo se llamaba dentro de `escribir`, así que si el alumno se
 *    adelantaba —escribía de una vez lo que pedían dos encargos, o pulsaba
 *    «devolver la plantilla» y con eso ya cumplía el siguiente— el encargo se
 *    quedaba pendiente para siempre por mucho que la página estuviera bien.
 *    La única salida era teclear un carácter cualquiera. En una clase cuyo
 *    último encargo es «que no quede ningún aviso» eso deja la clase
 *    **imposible de terminar**, que es exactamente el defecto que el recorrido
 *    de punta a punta busca. Arreglo: `siguienteEncargo` —el gesto que abre el
 *    encargo— le pregunta a su predicado ahí mismo. En el gesto y no en un
 *    efecto: un efecto que llama a `setState` encadena renders y la regla
 *    `react-hooks/set-state-in-effect` del proyecto lo prohíbe.
 * 2. **`onAvance` y `onTerminado` se llamaban dentro del updater de
 *    `setHechos`.** Un updater tiene que ser puro: React lo invoca dos veces
 *    en `StrictMode` (que en esta plataforma está encendido, porque Next lo
 *    trae de fábrica y `next.config.ts` no lo apaga), así que la clase recibía
 *    **el avance por duplicado** y su contador de pasos —el de los pips de la
 *    marquesina y el de `onProgress`— se iba al doble. Arreglo: la cuenta vive
 *    en un `useRef` y los avisos salen fuera del updater, en el mismo gesto
 *    que los provoca.
 */

const TECLAS_PARA_LA_PISTA = 25;

export interface OpcionesEstudio {
  /** Los archivos con los que arranca la clase. Al menos uno tiene que ser `.html`. */
  archivos: readonly ArchivoWeb[];
  vista?: Vista;
  /** Las imágenes de la práctica. No hay red: la clase las trae. */
  recursos?: readonly RecursoWeb[];
  guion?: GuionWeb;
  publicacion?: Publicacion;
  onAvance?: (avance: number) => void;
  onTerminado?: (resumen: ResumenWeb) => void;
}

export interface Estudio {
  // ── los archivos ─────────────────────────────────────────────────────────
  archivos: readonly ArchivoWeb[];
  activo: ArchivoWeb;
  abrir: (nombre: string) => void;
  /** Devuelve `false` si el archivo es de sólo lectura. */
  escribir: (texto: string) => boolean;
  lineas: LineaPintada[];
  editable: boolean;

  // ── la vista previa ──────────────────────────────────────────────────────
  /** Los `.html` del proyecto, en orden. */
  paginas: readonly string[];
  paginaVista: string;
  verPagina: (nombre: string) => void;
  /** Una vista, o dos con `vista: 'ambas'`. */
  vistas: readonly VistaDeLaPagina[];
  pagina: PaginaAnalizada;
  vista: Vista;
  cambiarVista: (v: Vista) => void;

  // ── lo que está mal ──────────────────────────────────────────────────────
  problemas: readonly ProblemaWeb[];
  errores: number;
  avisos: number;

  // ── el inspector ─────────────────────────────────────────────────────────
  seleccion: number | null;
  seleccionar: (n: number | null) => void;
  nodoSeleccionado: NodoElemento | null;
  estiloSeleccionado: EstiloResuelto;

  // ── señalar ──────────────────────────────────────────────────────────────
  senalar: (archivo: string, linea: number) => void;
  foco: { linea: number; sello: number } | null;
  aviso: AvisoWeb | null;
  descartarAviso: () => void;

  // ── el guion ─────────────────────────────────────────────────────────────
  encargo: EncargoWeb | null;
  hechos: number;
  elegir: (opcion: number) => void;
  confirmar: () => void;
  siguienteEncargo: () => void;
  mostrarPista: () => void;
  terminado: boolean;

  // ── publicar ─────────────────────────────────────────────────────────────
  pasosPublicados: readonly string[];
  publicarPaso: (id: string) => void;
  publicado: boolean;
  direccion: string | null;
}

export function useEstudioWeb(opciones: OpcionesEstudio): Estudio {
  const { archivos: iniciales, guion, publicacion, recursos, onAvance, onTerminado } = opciones;

  const [archivos, setArchivos] = useState<readonly ArchivoWeb[]>(iniciales);
  const [activoNombre, setActivoNombre] = useState<string>(iniciales[0]?.nombre ?? 'index.html');
  const [vista, setVista] = useState<Vista>(opciones.vista ?? 'escritorio');
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [foco, setFoco] = useState<{ linea: number; sello: number } | null>(null);
  const [aviso, setAviso] = useState<AvisoWeb | null>(null);
  const [indice, setIndice] = useState(0);
  const [hechos, setHechos] = useState(0);
  const [hecho, setHecho] = useState(false);
  const [pistaVisible, setPistaVisible] = useState(false);
  const [eleccion, setEleccion] = useState<number | null>(null);
  const [teclas, setTeclas] = useState(0);
  const [tropiezos, setTropiezos] = useState(0);
  const [pasosPublicados, setPasosPublicados] = useState<readonly string[]>([]);

  const sello = useRef(0);
  /* El reloj se pone al montar y no al pintar: leer la hora durante el render
   * es impuro y React lo prohíbe con razón — dos renders darían dos horas. Es
   * la misma solución que en `useCodigo`. */
  const inicio = useRef(0);
  useEffect(() => {
    inicio.current = Date.now();
  }, []);
  const terminadoRef = useRef(false);

  const paginasHtml = useMemo(() => archivos.filter((a) => a.lenguaje === 'html').map((a) => a.nombre), [archivos]);
  const [paginaVista, setPaginaVista] = useState<string>(paginasHtml[0] ?? 'index.html');

  const activo = archivoDe(archivos, activoNombre) ?? archivos[0];
  const hojas = useMemo(() => archivos.filter((a) => a.lenguaje === 'css').map((a) => ({ nombre: a.nombre, texto: a.texto })), [archivos]);
  const htmlVista = archivoDe(archivos, paginaVista) ?? archivos.find((a) => a.lenguaje === 'html') ?? null;

  const escritorio = useMemo(
    () =>
      analizarPagina({
        html: htmlVista?.texto ?? '',
        archivo: htmlVista?.nombre ?? 'index.html',
        hojas,
        recursos,
        paginas: paginasHtml,
        ancho: ANCHO_ESCRITORIO,
      }),
    [htmlVista, hojas, recursos, paginasHtml],
  );

  const movil = useMemo(
    () =>
      analizarPagina({
        html: htmlVista?.texto ?? '',
        archivo: htmlVista?.nombre ?? 'index.html',
        hojas,
        recursos,
        paginas: paginasHtml,
        ancho: ANCHO_MOVIL,
      }),
    [htmlVista, hojas, recursos, paginasHtml],
  );

  const vistas = useMemo<VistaDeLaPagina[]>(() => {
    if (vista === 'movil') return [{ nombre: 'Móvil', ancho: ANCHO_MOVIL, pagina: movil }];
    if (vista === 'ambas') {
      return [
        { nombre: 'Escritorio', ancho: ANCHO_ESCRITORIO, pagina: escritorio },
        { nombre: 'Móvil', ancho: ANCHO_MOVIL, pagina: movil },
      ];
    }
    return [{ nombre: 'Escritorio', ancho: ANCHO_ESCRITORIO, pagina: escritorio }];
  }, [vista, escritorio, movil]);

  /** La página con la que se corrige: la que el alumno tiene delante. */
  const pagina = vista === 'movil' ? movil : escritorio;

  /*
   * ── LA PÁGINA QUE JUZGA UN ENCARGO ES LA QUE EL ENCARGO DECLARA ──────────
   *
   * Corregido el 1-sep-2026 (auditoría). Antes, todo predicado de tipo
   * `'pagina'` se evaluaba contra `pagina`, que es la pestaña de VISTA PREVIA
   * que el alumno tiene abierta — un estado que no tiene nada que ver con el
   * archivo que el encargo pide tocar (`abrir()` y `verPagina()` son gestos
   * independientes).
   *
   * El daño no era teórico. En `n7-tu-sitio-personal` los encargos 1, 3 y 5
   * reutilizan a propósito el MISMO predicado —«repite la cabecera y el menú»—
   * para `index.html`, `sobre-mi.html` y `mis-pasatiempos.html`. Como el alumno
   * nunca tiene motivo para cambiar de pestaña de vista previa, al pulsar
   * «Siguiente encargo» el encargo 3 se evaluaba contra `index.html`, que ya
   * cumplía desde el encargo 1: se daba por hecho al instante. Lo mismo el 5.
   * Resultado: la insignia de «Desarrollador Web» y el 100 % con dos de las tres
   * páginas todavía en blanco — justo lo contrario de lo que la clase enseña.
   *
   * Su propia prueba (`n7-tu-sitio-personal.test.tsx`) ya daba por supuesto este
   * comportamiento: analiza cada paso contra el archivo de su `senal`. Lo hacía
   * a mano, sin pasar por el hook, así que nunca tocó el cableado real.
   *
   * Sólo se desvía cuando la señal nombra un `.html` que existe de verdad. Si
   * nombra una hoja de estilos (`estilo.css`) o no nombra nada, se sigue usando
   * la página que el alumno mira, que es lo correcto: una regla CSS se juzga
   * sobre la página donde se ve.
   */
  const analizarDeclarada = useCallback(
    (nombre: string | undefined, lista: readonly ArchivoWeb[]) => {
      if (nombre === undefined || !nombre.endsWith('.html')) return null;
      const html = lista.find((a) => a.nombre === nombre && a.lenguaje === 'html');
      if (html === undefined) return null;
      return analizarPagina({
        html: html.texto,
        archivo: html.nombre,
        hojas: lista.filter((a) => a.lenguaje === 'css').map((a) => ({ nombre: a.nombre, texto: a.texto })),
        recursos,
        paginas: lista.filter((a) => a.lenguaje === 'html').map((a) => a.nombre),
        ancho: vista === 'movil' ? ANCHO_MOVIL : ANCHO_ESCRITORIO,
      });
    },
    [recursos, vista],
  );

  const lineas = useMemo(() => colorearWeb(activo?.texto ?? '', activo?.lenguaje ?? 'html'), [activo?.texto, activo?.lenguaje]);

  /* Se recorre el árbol para encontrarlo, en vez de guardar un índice por `n`:
   * el árbol se rehace en cada tecla, y un mapa aparte sería una segunda
   * verdad con su propia manera de desincronizarse. */
  const nodoSeleccionado = useMemo<NodoElemento | null>(() => {
    if (seleccion === null) return null;
    const hallados: NodoElemento[] = [];
    recorrerElementos(pagina.arbol.raiz, (e) => {
      if (e.n === seleccion) hallados.push(e);
    });
    return hallados[0] ?? null;
  }, [seleccion, pagina]);

  const estiloSeleccionado = (seleccion === null ? undefined : pagina.cascada.porNodo.get(seleccion)) ?? estiloVacio();

  /* ── El guion ─────────────────────────────────────────────────────────── */

  /* Memorizado porque `siguienteEncargo` depende de la lista entera —tiene que
   * mirar el predicado del encargo que abre—, y un `?? []` nuevo en cada render
   * rehacía ese `useCallback` en cada tecla. */
  const pasos = useMemo(() => guion?.pasos ?? [], [guion]);
  const paso = pasos[indice] ?? null;

  const comprobar = useCallback(
    (paginaAhora: PaginaAnalizada, archivosAhora: readonly ArchivoWeb[]): boolean => {
      if (!paso) return false;
      if (paso.logro.tipo === 'pagina') return paso.logro.comprueba(paginaAhora);
      if (paso.logro.tipo === 'codigo') return paso.logro.comprueba(archivosAhora);
      return false;
    },
    [paso],
  );

  /* La cuenta vive en un ref y no sólo en el estado: los dos avisos de fuera
   * —`onAvance` y `onTerminado`— tienen que salir UNA vez por encargo, y
   * dentro del updater de `setHechos` salían dos en `StrictMode`. */
  const hechosRef = useRef(0);

  const darPorHecho = useCallback(() => {
    setHecho(true);
    const nuevos = hechosRef.current + 1;
    hechosRef.current = nuevos;
    setHechos(nuevos);
    onAvance?.(pasos.length === 0 ? 1 : nuevos / pasos.length);
    if (nuevos >= pasos.length && !terminadoRef.current) {
      terminadoRef.current = true;
      onTerminado?.({
        encargos: pasos.length,
        hechos: nuevos,
        tropiezos,
        segundos: inicio.current === 0 ? 0 : Math.round((Date.now() - inicio.current) / 1000),
      });
    }
  }, [onAvance, onTerminado, pasos.length, tropiezos]);

  const escribir = useCallback(
    (texto: string): boolean => {
      if (!activo) return false;
      if (activo.soloLectura === true) {
        setAviso((a) => ({ id: (a?.id ?? 0) + 1, texto: `«${activo.nombre}» lo trae la clase escrito: se lee, no se toca.`, tono: 'candado' }));
        return false;
      }
      const nuevos = conTexto(archivos, activo.nombre, texto);
      if (nuevos === archivos) return true;
      setArchivos(nuevos);
      setTeclas((t) => t + 1);

      if (paso && !hecho && (paso.logro.tipo === 'pagina' || paso.logro.tipo === 'codigo')) {
        const declarada = analizarDeclarada(paso.senal?.archivo, nuevos);
        const htmlAhora = nuevos.find((a) => a.nombre === paginaVista) ?? nuevos.find((a) => a.lenguaje === 'html');
        const paginaAhora = declarada ?? analizarPagina({
          html: htmlAhora?.texto ?? '',
          archivo: htmlAhora?.nombre ?? 'index.html',
          hojas: nuevos.filter((a) => a.lenguaje === 'css').map((a) => ({ nombre: a.nombre, texto: a.texto })),
          recursos,
          paginas: nuevos.filter((a) => a.lenguaje === 'html').map((a) => a.nombre),
          ancho: vista === 'movil' ? ANCHO_MOVIL : ANCHO_ESCRITORIO,
        });
        if (comprobar(paginaAhora, nuevos)) darPorHecho();
        else if (teclas + 1 >= TECLAS_PARA_LA_PISTA) setPistaVisible(true);
      }
      return true;
    },
    [activo, archivos, paso, hecho, paginaVista, recursos, vista, comprobar, darPorHecho, teclas, analizarDeclarada],
  );

  const elegir = useCallback(
    (opcion: number) => {
      if (!paso || paso.logro.tipo !== 'eleccion' || hecho) return;
      setEleccion(opcion);
      if (opcion === paso.logro.correcta) darPorHecho();
      else {
        setTropiezos((t) => t + 1);
        setPistaVisible(true);
      }
    },
    [paso, hecho, darPorHecho],
  );

  const confirmar = useCallback(() => {
    if (!paso || paso.logro.tipo !== 'confirma' || hecho) return;
    darPorHecho();
  }, [paso, hecho, darPorHecho]);

  /**
   * Pasar al siguiente encargo… **y preguntarle a su predicado ahí mismo.**
   *
   * Sin esa segunda mitad, un encargo que ya estaba cumplido cuando le llegaba
   * el turno se quedaba pendiente para siempre: el predicado sólo se llamaba
   * al escribir, y no había nada que escribir. Ver el defecto 1 de arriba.
   *
   * Se hace aquí, en el gesto que abre el encargo, y no en un efecto: un
   * efecto que llama a `setState` provoca renders en cascada y la regla
   * `react-hooks/set-state-in-effect` del proyecto lo prohíbe con razón.
   */
  const siguienteEncargo = useCallback(() => {
    if (indice >= pasos.length - 1) return;
    const abre = pasos[indice + 1];
    setIndice(indice + 1);
    setPistaVisible(false);
    setEleccion(null);
    setTeclas(0);
    const paginaDelQueAbre = analizarDeclarada(abre.senal?.archivo, archivos) ?? pagina;
    const yaCumplido =
      (abre.logro.tipo === 'pagina' && abre.logro.comprueba(paginaDelQueAbre)) ||
      (abre.logro.tipo === 'codigo' && abre.logro.comprueba(archivos));
    if (yaCumplido) darPorHecho();
    else setHecho(false);
  }, [indice, pasos, pagina, archivos, darPorHecho, analizarDeclarada]);

  const encargo = useMemo<EncargoWeb | null>(() => {
    if (!paso) return null;
    return { paso, indice, total: pasos.length, hecho, pistaVisible, eleccion };
  }, [paso, indice, pasos.length, hecho, pistaVisible, eleccion]);

  /* ── Lo demás ─────────────────────────────────────────────────────────── */

  const abrir = useCallback((nombre: string) => setActivoNombre(nombre), []);

  const verPagina = useCallback((nombre: string) => {
    setPaginaVista(nombre);
    setSeleccion(null);
  }, []);

  const senalar = useCallback((archivo: string, linea: number) => {
    setActivoNombre(archivo);
    sello.current += 1;
    setFoco({ linea, sello: sello.current });
  }, []);

  const publicarPaso = useCallback(
    (id: string) => {
      if (!publicacion) return;
      setPasosPublicados((hechosAhora) => (hechosAhora.includes(id) ? hechosAhora : [...hechosAhora, id]));
    },
    [publicacion],
  );

  const publicado = publicacion !== undefined && publicacion.pasos.length > 0 && publicacion.pasos.every((p) => pasosPublicados.includes(p.id));

  return {
    archivos,
    activo,
    abrir,
    escribir,
    lineas,
    editable: activo?.soloLectura !== true,

    paginas: paginasHtml,
    paginaVista,
    verPagina,
    vistas,
    pagina,
    vista,
    cambiarVista: setVista,

    problemas: pagina.problemas,
    errores: pagina.errores,
    avisos: pagina.avisos,

    seleccion,
    seleccionar: setSeleccion,
    nodoSeleccionado,
    estiloSeleccionado,

    senalar,
    foco,
    aviso,
    descartarAviso: () => setAviso(null),

    encargo,
    hechos,
    elegir,
    confirmar,
    siguienteEncargo,
    mostrarPista: () => setPistaVisible(true),
    terminado: pasos.length > 0 && hechos >= pasos.length,

    pasosPublicados,
    publicarPaso,
    publicado,
    direccion: publicacion === undefined ? null : `https://${publicacion.dominio}`,
  };
}
