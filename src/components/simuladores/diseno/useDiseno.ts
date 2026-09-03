'use client';

/**
 * TECNIA DISEÑO · el estado
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Todo lo que en un editor cambia y NO es el documento: qué está seleccionado,
 * qué herramienta está activa, qué pantalla se está viendo y qué gesto se está
 * haciendo con el ratón ahora mismo. El documento no está aquí: está en
 * `historia.ts`, y sólo se toca mandando acciones.
 *
 * ── LA SELECCIÓN NO ENTRA EN EL HISTORIAL ─────────────────────────────────
 *
 * Escrito en `comandos.ts` y ejecutado aquí: seleccionar no es una acción.
 * Pero la selección sí tiene que sobrevivir a un «deshacer» con sentido, y por
 * eso lo que se guarda son ids y lo que se devuelve son **los ids que todavía
 * existen**. Al deshacer «añadir forma», la forma desaparece y deja de estar
 * seleccionada sola, sin código que lo vigile.
 *
 * ── LOS IDENTIFICADORES LOS DA EL ESTADO, NO EL COMANDO ───────────────────
 *
 * `nuevoId()` vive aquí porque un comando que se inventa un id no se puede
 * reproducir (§45.6). El gancho lo pide una vez, lo mete en la acción, y desde
 * ese momento el id es un dato más de la lista: rehacer vuelve a crear la misma
 * capa con el mismo nombre interno, y las pruebas dan lo mismo dos veces.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  capaTocada,
  type Accion,
  type HerramientaId,
} from './comandos';
import {
  deshacer as deshacerHistoria,
  documento as documentoDe,
  hacer as hacerEnHistoria,
  nuevaHistoria,
  pasos as pasosDe,
  puedeDeshacer,
  puedeRehacer,
  rehacer as rehacerHistoria,
  type Historia,
  type Paso,
} from './historia';
import { iniciar, mover as moverGestoPuro, soltar, type Gesto, type TipoGesto } from './arrastre';
import { acotar, capaDe, type CapaId, type Documento, type PaginaId, type Tirador } from './modelo';
import { duracionTotal } from './cinta';

export interface OpcionesDiseno {
  /** El documento de partida. La actividad lo trae hecho; esto no lo inventa. */
  documento: Documento;
  /**
   * Qué puede usar el alumno. `'todas'` es para el banco de pruebas: una clase
   * de verdad pasa su lista, y lo que no esté se rechaza también por dentro.
   */
  herramientas?: readonly HerramientaId[] | 'todas';
  /** Con qué herramienta se empieza. */
  herramientaInicial?: HerramientaId;
  /** Zoom de la vista: 1 = 100 %. Sólo lo usa el arrastre para dividir. */
  escala?: number;
  /** Se llama tras cada acción aceptada. Es el gancho para corregir en vivo. */
  alHacer?: (doc: Documento, acc: Accion) => void;
  /** Se llama cuando el programa dice que no. Sirve para el mensaje en pantalla. */
  alRechazar?: (motivo: string, acc: Accion) => void;
  tope?: number;
}

export interface Diseno {
  documento: Documento;
  historia: Historia;
  pagina: PaginaId;
  irA: (pagina: PaginaId) => void;

  seleccion: CapaId[];
  seleccionar: (ids: readonly CapaId[], sumar?: boolean) => void;

  herramientas: readonly HerramientaId[] | 'todas';
  herramienta: HerramientaId;
  elegirHerramienta: (h: HerramientaId) => void;
  hay: (h: HerramientaId) => boolean;

  hacer: (acc: Accion) => boolean;
  deshacer: () => void;
  rehacer: () => void;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  pasos: Paso[];
  /** Lo último que el programa se negó a hacer, para enseñarlo. */
  rechazo: string | null;

  gesto: Gesto | null;
  iniciarGesto: (o: {
    tipo: TipoGesto;
    capa: CapaId;
    x: number;
    y: number;
    tirador?: Tirador;
  }) => void;
  moverGesto: (x: number, y: number) => void;
  soltarGesto: () => void;
  cancelarGesto: () => void;

  nuevoId: (prefijo?: string) => string;

  /* ── el cabezal de la cinta (§ cinta.ts), sólo lo usan las clases de video ── */
  segundo: number;
  reproduciendo: boolean;
  /** id del corte seleccionado en la cinta, o `null`. */
  corteSel: string | null;
  irASegundo: (s: number) => void;
  reproducir: () => void;
  pausar: () => void;
  seleccionarCorte: (id: string | null) => void;
}

export function useDiseno(o: OpcionesDiseno): Diseno {
  const [historia, setHistoria] = useState<Historia>(() => nuevaHistoria(o.documento, o.tope));
  const [pagina, setPagina] = useState<PaginaId>(() => o.documento.paginas[0]?.id ?? '');
  const [seleccionCruda, setSeleccion] = useState<CapaId[]>([]);
  const [herramienta, setHerramienta] = useState<HerramientaId>(o.herramientaInicial ?? 'seleccion');
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [gesto, setGesto] = useState<Gesto | null>(null);
  const contador = useRef(0);
  const [segundo, setSegundo] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [corteSelCruda, setCorteSel] = useState<string | null>(null);

  const herramientas = o.herramientas ?? 'todas';
  const doc = documentoDe(historia);
  const escala = o.escala && o.escala > 0 ? o.escala : 1;

  const hay = useCallback(
    (h: HerramientaId) => herramientas === 'todas' || herramientas.includes(h),
    [herramientas],
  );

  /** Sólo lo que existe. Deshacer limpia la selección sin que nadie la vigile. */
  const seleccion = useMemo(
    () => seleccionCruda.filter((id) => capaDe(doc, pagina, id) !== null),
    [seleccionCruda, doc, pagina],
  );

  const { alHacer, alRechazar } = o;

  /*
   * Ni un efecto secundario dentro de un actualizador de estado. React llama
   * dos veces a los actualizadores en modo estricto, así que un `alHacer`
   * escrito ahí dentro se dispararía dos veces por acción, y una actividad que
   * puntúa en `alHacer` puntuaría el doble sin que nada pareciera roto.
   */
  const hacer = useCallback(
    (acc: Accion): boolean => {
      const r = hacerEnHistoria(historia, acc, herramientas);
      setRechazo(r.rechazo);
      if (r.rechazo) {
        alRechazar?.(r.rechazo, acc);
        return false;
      }
      setHistoria(r.historia);
      alHacer?.(documentoDe(r.historia), acc);
      return true;
    },
    [historia, herramientas, alHacer, alRechazar],
  );

  const deshacer = useCallback(() => {
    setRechazo(null);
    setHistoria((h) => deshacerHistoria(h));
  }, []);

  const rehacer = useCallback(() => {
    setRechazo(null);
    const nueva = rehacerHistoria(historia);
    setHistoria(nueva);
    /* Rehacer devuelve el foco a lo que se rehizo: es lo que hace un editor de
     * verdad y evita que el alumno pulse dos veces sin ver dónde pasó. */
    const ultima = nueva.hechas[nueva.hechas.length - 1];
    const id = ultima ? capaTocada(ultima) : null;
    if (id) setSeleccion([id]);
  }, [historia]);

  const seleccionar = useCallback((ids: readonly CapaId[], sumar = false) => {
    setSeleccion((s) => (sumar ? [...new Set([...s, ...ids])] : [...ids]));
  }, []);

  const nuevoId = useCallback(
    (prefijo = 'c'): string => {
      let id = '';
      do {
        contador.current += 1;
        id = `${prefijo}${contador.current}`;
      } while (
        doc.paginas.some((p) => p.capas.some((c) => c.id === id)) ||
        (doc.cinta ?? []).some((p) => p.cortes.some((c) => c.id === id))
      );
      return id;
    },
    [doc],
  );

  const iniciarGesto = useCallback(
    (g: { tipo: TipoGesto; capa: CapaId; x: number; y: number; tirador?: Tirador }) => {
      const c = capaDe(doc, pagina, g.capa);
      if (!c) return;
      /* Una capa bloqueada no se agarra. Se dice y no se empieza el gesto: si se
       * empezara, el fantasma se movería y al soltar no pasaría nada, que es la
       * peor forma de decir que no. */
      if (c.bloqueada) {
        setRechazo(`la capa «${c.nombre}» está bloqueada`);
        return;
      }
      if (g.tipo === 'girar' ? !hay('giro') : !hay('seleccion')) {
        setRechazo('esa herramienta no está disponible aquí');
        return;
      }
      const nat = c.tipo === 'imagen' ? doc.banco[c.recurso]?.proporcion : undefined;
      setRechazo(null);
      setSeleccion([g.capa]);
      setGesto(
        iniciar({
          tipo: g.tipo,
          pagina,
          capa: g.capa,
          caja: c.caja,
          giro: c.giro,
          x: g.x,
          y: g.y,
          tirador: g.tirador,
          escala,
          proporcion: nat ? nat.cols / nat.filas : undefined,
          lienzo: doc.lienzo,
        }),
      );
    },
    [doc, pagina, escala, hay],
  );

  const moverGesto = useCallback(
    (x: number, y: number) => {
      setGesto((g) => (g ? moverGestoPuro(g, x, y, doc.lienzo) : g));
    },
    [doc.lienzo],
  );

  const soltarGesto = useCallback(() => {
    if (!gesto) return;
    const acc = soltar(gesto);
    setGesto(null);
    /* `soltar` devuelve `null` si el gesto no cambió nada: un clic para
     * seleccionar no es un paso del trabajo y no debe ocupar un «deshacer». */
    if (acc) hacer(acc);
  }, [gesto, hacer]);

  const cancelarGesto = useCallback(() => setGesto(null), []);

  const irA = useCallback((p: PaginaId) => {
    setPagina(p);
    setSeleccion([]);
  }, []);

  /*
   * ── el cabezal de la cinta ──────────────────────────────────────────────
   * `duracionTotal` depende de `doc`, así que se recalcula cada render, y el
   * intervalo sólo se crea o destruye cuando cambia `reproduciendo` o el
   * total (por ejemplo, al recortar el último clip mientras se reproduce).
   *
   * `actual` es un contador LOCAL del efecto, no un `setState` leído dentro
   * de sí mismo: arranca en el `segundo` de cuando se dio a «Reproducir» y
   * desde ahí cuenta solo, tick a tick, sin volver a depender de `segundo`
   * (si dependiera, cada tick recrearía el intervalo). Parar al llegar al
   * final —y con él, avisar que se dejó de reproducir— pasa DENTRO del
   * propio callback del `setInterval`, que es un contexto asíncrono y no
   * «dentro del actualizador de un `setState`»: la trampa del aviso doblado
   * en modo estricto es sobre lo segundo, no sobre esto.
   */
  const total = duracionTotal(doc);

  useEffect(() => {
    if (!reproduciendo || total <= 0) return;
    let actual = segundo;
    const id = window.setInterval(() => {
      actual += 1;
      if (actual >= total) {
        setSegundo(total);
        setReproduciendo(false);
        window.clearInterval(id);
        return;
      }
      setSegundo(actual);
    }, 1000);
    return () => window.clearInterval(id);
    // `segundo` se captura sólo como punto de arranque, a propósito: no debe
    // recrear el intervalo en cada tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reproduciendo, total]);

  const irASegundo = useCallback(
    (s: number) => setSegundo(acotar(Math.round(s), 0, Math.max(0, total))),
    [total],
  );
  const reproducir = useCallback(() => setReproduciendo(true), []);
  const pausar = useCallback(() => setReproduciendo(false), []);
  const seleccionarCorte = useCallback((id: string | null) => setCorteSel(id), []);

  /* Sólo el que todavía existe — deshacer o quitar un corte no deja un
   * fantasma seleccionado, igual que `seleccion` con las capas. */
  const corteSel = useMemo(
    () => (corteSelCruda && (doc.cinta ?? []).some((p) => p.cortes.some((c) => c.id === corteSelCruda)) ? corteSelCruda : null),
    [corteSelCruda, doc],
  );

  return {
    documento: doc,
    historia,
    pagina,
    irA,
    seleccion,
    seleccionar,
    herramientas,
    herramienta,
    elegirHerramienta: setHerramienta,
    hay,
    hacer,
    deshacer,
    rehacer,
    puedeDeshacer: puedeDeshacer(historia),
    puedeRehacer: puedeRehacer(historia),
    pasos: pasosDe(historia),
    rechazo,
    gesto,
    iniciarGesto,
    moverGesto,
    soltarGesto,
    cancelarGesto,
    nuevoId,
    segundo,
    reproduciendo,
    corteSel,
    irASegundo,
    reproducir,
    pausar,
    seleccionarCorte,
  };
}
