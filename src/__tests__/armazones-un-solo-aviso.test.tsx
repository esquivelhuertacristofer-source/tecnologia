/**
 * LA MEDIDA · «un gesto, un aviso» — 15-ago-2026
 *
 * ── Qué defecto sella ──────────────────────────────────────────────────────
 *
 * Un aviso hacia fuera (`onAvance`, `onTerminado`, `alHacer`, `onProgress`…)
 * llamado desde DENTRO del actualizador de un `setState`:
 *
 *     setHechos((prev) => {
 *       const nuevos = [...prev, id];
 *       if (nuevos.length === total) onTerminado();   // ← el defecto
 *       return nuevos;
 *     });
 *
 * Son dos averías, no una: el aviso corre **durante el pintado** (quien lo
 * recibe no puede tocar su estado ahí), y en modo estricto —el que Next trae de
 * fábrica en desarrollo— React **invoca el actualizador dos veces** a propósito,
 * así que el avance sale doble y la actividad se completa dos veces.
 *
 * Lo encontraron dos agentes el mismo día, en `codigo/ventana/useCodigo.ts` y en
 * `web/useEstudioWeb.ts`, que no comparten una línea. Un defecto que se repite
 * pasa a ser una medida.
 *
 * ── Por qué ESTA medida y no un comentario ni una regla de lint ────────────
 *
 * El lint NO lo estaba avisando y no puede: `react-hooks/purity` y
 * `react-hooks/refs` no miran dentro de la función que se le pasa a `setState`.
 * Se comprobó: con el defecto puesto, `npx eslint` daba 0.
 *
 * Así que la medida tiene TRES capas, y hacen falta las tres:
 *
 *  1 · **El censo** — la lista de paquetes de `src/components/simuladores/` se
 *      lee del disco y se compara con el registro de este archivo. El armazón
 *      diecisiete pone esta prueba en rojo el día que nace, aunque nadie lo
 *      registre.
 *  2 · **El censo de avisos** — de cada `export interface Opciones*` se sacan
 *      los callbacks que la clase pasa hacia dentro (`on…`, `al…`). Si mañana
 *      alguien añade un `onTerminado` a un armazón que hoy no tiene ninguno, el
 *      registro deja de cuadrar y esto se pone rojo hasta que se le escriba un
 *      conductor aquí abajo.
 *  3 · **La guarda estática** — se recorre `src/components` ENTERO emparejando
 *      paréntesis a mano (una expresión suelta se para en la primera llave, que
 *      es por donde se escapó el defecto) y se busca cualquier aviso invocado
 *      dentro de un actualizador o de un inicializador perezoso. Ésta caza el
 *      diecisiete escrito mal **sin necesidad de registro alguno**, y de paso
 *      cubre los 59 laboratorios que aún tienen que migrar al arnés de sesión.
 *      Lleva además una segunda pasada para el primo del defecto: una `ref`
 *      **escrita** dentro de un actualizador (una pila de deshacer que recibe
 *      dos entradas por cambio, un contador de ids que salta de dos en dos).
 *
 * Y encima de las tres, la prueba de conducta: cada armazón que tenga avisos se
 * monta DENTRO de `<StrictMode>` y se comprueba que un gesto produce **un**
 * aviso. Los que no tienen avisos se montan igual y se comprueba la misma ley
 * en su forma observable: un gesto, un efecto (una cita, un correo, una
 * descarga…), que es donde se vería el doblado si volviera.
 *
 * ── Se rompió a propósito, tres veces, y las tres se puso roja ─────────────
 *
 *  · Devolviendo el defecto a `useDatos.ts`: rojo por partida doble — la guarda
 *    estática señalando `useDatos.ts:262`, y la conducta con `onAvance = 3`.
 *  · Plantando un `onPublicada` en `useMuro` —un armazón que hoy no avisa a
 *    nadie— y llamándolo dentro del `setPublicaciones`: rojo en el censo de
 *    avisos Y en la guarda estática.
 *  · Creando un armazón diecisiete (`simuladores/diecisiete/`) con el defecto
 *    dentro: rojo en el censo de armazones Y en la guarda estática, sin que
 *    nadie lo hubiera registrado en ningún sitio.
 */

import fs from 'node:fs';
import path from 'node:path';
import { StrictMode, useCallback, useRef, useState } from 'react';
import { act, renderHook } from '@testing-library/react';

import { useAgenda } from '@/components/simuladores/agenda/useAgenda';
import { useAsistente } from '@/components/simuladores/asistente/useAsistente';
import { useBloques } from '@/components/simuladores/bloques/useBloques';
import { nuevoBloque, type FichaBloque, type Programa } from '@/components/simuladores/bloques/arbolBloques';
import { useCodigo } from '@/components/simuladores/codigo/ventana/useCodigo';
import { useCorreo } from '@/components/simuladores/correo/useCorreo';
import type { MensajeCorreo, RemitenteCorreo } from '@/components/simuladores/correo/tiposCorreo';
import { useDatos } from '@/components/simuladores/datos/ventana/useDatos';
import { useDiseno } from '@/components/simuladores/diseno/useDiseno';
import { accion } from '@/components/simuladores/diseno/comandos';
import { LIENZOS, PALETA_BASE, type Documento } from '@/components/simuladores/diseno/modelo';
import { useMuro } from '@/components/simuladores/muro/useMuro';
import type { AutorMuro } from '@/components/simuladores/muro/tiposMuro';
import { useNavegador } from '@/components/simuladores/navegador/useNavegador';
import type { MapaSitios } from '@/components/simuladores/navegador/tiposNavegador';
import { useNube } from '@/components/simuladores/nube/useNube';
import type { ArchivoNube, PersonaNube } from '@/components/simuladores/nube/tiposNube';
import { useSistema } from '@/components/simuladores/sistema/useSistema';
import type { ArchivoSO, CarpetaSO } from '@/components/simuladores/sistema/tiposSistema';
import { useTablero } from '@/components/simuladores/tablero/useTablero';
import type { ColumnaTablero } from '@/components/simuladores/tablero/tiposTablero';
import { useEstudioWeb } from '@/components/simuladores/web/useEstudioWeb';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import type { ActivityProps } from '@/types/activity-contract';

/* ═══════════════════════════════════════════════════════════════════════════
 * 0 · El registro: los dieciséis armazones y cómo se conducen
 * ═════════════════════════════════════════════════════════════════════════ */

const RAIZ = path.join(process.cwd(), 'src', 'components', 'simuladores');

/** Cuenta cuántas veces se llamó cada espía de un gesto. */
type Cuenta = Record<string, number>;

interface Armazon {
  /**
   * Los avisos hacia fuera que declara su `Opciones*`. Vacío significa «este
   * armazón no avisa a nadie: la clase le pregunta al estado». El censo del
   * apartado 2 comprueba que esta lista sigue siendo verdad.
   */
  avisos: readonly string[];
  /**
   * Un gesto, dentro de `<StrictMode>`, y lo que salió. Devuelve tanto las
   * veces que se llamó cada aviso como los efectos observables que el gesto
   * debía producir exactamente una vez.
   */
  conducir?: () => Cuenta;
  /** Por qué este paquete no se conduce (sólo para los que no tienen gancho). */
  sinGancho?: string;
}

/* ── piezas mínimas para los conductores ──────────────────────────────────── */

const SOFI_MURO: AutorMuro = { id: 'sofi', nombre: 'Sofi', usuario: '@sofi', esAlumno: true };
const SOFI_CORREO: RemitenteCorreo = { nombre: 'Sofi', direccion: 'sofi@tecnia-escuela.mx' };
const LUCIA_CORREO: RemitenteCorreo = { nombre: 'Lucía', direccion: 'lucia@tecnia-escuela.mx' };
const SOFI_NUBE: PersonaNube = { id: 'sofi', nombre: 'Sofi' };

const MENSAJE: MensajeCorreo = {
  id: 'm1',
  de: LUCIA_CORREO,
  para: [SOFI_CORREO],
  cc: [],
  asunto: 'Materiales del viernes',
  cuerpo: ['Hola.'],
  fecha: '7:42',
  carpeta: 'recibidos',
  leido: false,
  marcado: false,
  adjuntos: [],
  enlaces: [],
};

const MAPA: MapaSitios = {
  'inicio.tecnia.mx': {
    url: 'inicio.tecnia.mx',
    pestana: 'Inicio',
    titulo: 'Tecnia — página de inicio',
    autor: null,
    fecha: null,
    cuerpo: { tipo: 'articulo', parrafos: ['Bienvenido.'] },
    enlaces: [],
  },
};

const COLUMNAS: ColumnaTablero[] = [
  { id: 'por-hacer', titulo: 'Por hacer' },
  { id: 'hecho', titulo: 'Hecho' },
];

function arbolSistema(): CarpetaSO {
  return { tipo: 'carpeta', id: 'raiz', nombre: 'Mi PC', fecha: '10 ago 2026', hijos: [] };
}

function archivoDeNube(): ArchivoNube {
  const nodo: ArchivoSO = { tipo: 'archivo', id: 'a', nombre: 'tarea.docx', tamano: 100, fecha: '10 ago 2026' };
  return { nodo, propietario: SOFI_NUBE, estado: 'solo-local', compartidoCon: [], historial: [], versionActualId: null, editandoAhora: [] };
}

function docDiseno(): Documento {
  return { lienzo: LIENZOS.cartel, paleta: PALETA_BASE, banco: {}, paginas: [{ id: 'p1', nombre: 'Cartel', fondo: 'tinta', capas: [] }] };
}

const CATALOGO_BLOQUES: FichaBloque[] = [
  { id: 'avanza', categoria: 'mov', etiqueta: 'avanza una casilla', semantica: { tipo: 'accion' } },
];

function programaDeUnBloque(): Programa {
  const b = nuevoBloque(CATALOGO_BLOQUES, 'avanza', 'n1');
  if (!b) throw new Error('la ficha «avanza» tiene que existir en el catálogo de la prueba');
  return { pilas: [{ id: 'p1', sombrero: null, bloques: [b] }] };
}

/** Un encargo de los de «pulsa el botón»: el gesto más corto que hay. */
const ENCARGO_CONFIRMA = {
  id: 'unico',
  titulo: 'Di que lo entendiste',
  instruccion: 'Pulsa el botón.',
  pista: 'Está justo ahí.',
  aprendido: 'Ya está.',
  logro: { tipo: 'confirma' as const, boton: 'Entendido' },
};

/** Monta un gancho dentro de `<StrictMode>`. Todo el sentido de esta prueba. */
function enModoEstricto<T>(usar: () => T) {
  return renderHook(usar, { wrapper: StrictMode });
}

/* ── el registro ──────────────────────────────────────────────────────────── */

const ARMAZONES: Record<string, Armazon> = {
  agenda: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useAgenda({ hoy: '2027-03-20', citas: [] }));
      act(() => {
        result.current.crear({ id: 'c1', titulo: 'Ensayo', dia: '2027-03-20', inicio: '10:00', fin: '11:00' });
      });
      return { citas: result.current.citas.length };
    },
  },

  aprendizaje: { avisos: [], sinGancho: 'módulos puros (arbol, examen, modelo, senales): ni un `useState`' },

  asistente: {
    avisos: ['onRespuesta', 'onFinTecleo'],
    conducir: () => {
      const onRespuesta = jest.fn();
      const onFinTecleo = jest.fn();
      const { result } = enModoEstricto(() =>
        useAsistente({
          guion: {
            respuestas: [{ id: 'r', texto: 'Un volcán es una montaña.' }],
            reglas: [{ tipo: 'ficha', ficha: 'f', responde: 'r' }],
            porDefecto: { id: 'nada', texto: 'No sé de eso.' },
          },
          velocidad: 0,
          onRespuesta,
          onFinTecleo,
        }),
      );
      act(() => {
        result.current.enviarFicha('f');
      });
      return {
        onRespuesta: onRespuesta.mock.calls.length,
        onFinTecleo: onFinTecleo.mock.calls.length,
        mensajesDelAlumno: result.current.mensajes.filter((m) => m.tipo === 'usuario').length,
      };
    },
  },

  bloques: {
    avisos: ['onEvento', 'onFin'],
    conducir: () => {
      const onEvento = jest.fn();
      const onFin = jest.fn();
      const { result } = enModoEstricto(() =>
        useBloques({ catalogo: CATALOGO_BLOQUES, inicial: programaDeUnBloque(), velocidad: 0, onEvento, onFin }),
      );
      act(() => {
        result.current.pasoAPaso();
      });
      const acciones = onEvento.mock.calls.filter(([e]) => e.tipo === 'accion').length;
      return { onEventoAccion: acciones };
    },
  },

  codigo: {
    avisos: ['onAvance', 'onTerminado'],
    conducir: () => {
      const onAvance = jest.fn();
      const onTerminado = jest.fn();
      const { result } = enModoEstricto(() =>
        useCodigo({ plantilla: 'print("Hola")', guion: { pasos: [ENCARGO_CONFIRMA] }, onAvance, onTerminado }),
      );
      act(() => {
        result.current.confirmar();
      });
      return { onAvance: onAvance.mock.calls.length, onTerminado: onTerminado.mock.calls.length };
    },
  },

  correo: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useCorreo({ yo: SOFI_CORREO, mensajes: [MENSAJE] }));
      act(() => {
        result.current.redactar({ para: [LUCIA_CORREO], asunto: 'Hola', cuerpo: ['Qué tal'] });
      });
      act(() => {
        result.current.enviar('8:00');
      });
      return { enviados: result.current.enCarpeta('enviados').length };
    },
  },

  datos: {
    avisos: ['onAvance', 'onTerminado'],
    conducir: () => {
      const onAvance = jest.fn();
      const onTerminado = jest.fn();
      const { result } = enModoEstricto(() =>
        useDatos({ plantilla: 'SELECT 1;', guion: { pasos: [ENCARGO_CONFIRMA] }, onAvance, onTerminado }),
      );
      act(() => {
        result.current.confirmar();
      });
      return { onAvance: onAvance.mock.calls.length, onTerminado: onTerminado.mock.calls.length };
    },
  },

  diseno: {
    avisos: ['alHacer', 'alRechazar'],
    conducir: () => {
      const alHacer = jest.fn();
      const { result } = enModoEstricto(() => useDiseno({ documento: docDiseno(), herramientas: 'todas', alHacer }));
      act(() => {
        result.current.hacer(accion('nueva-forma', { pagina: 'p1', id: 'f1', figura: 'rect', col: 0, fila: 0, cols: 4, filas: 4, relleno: 'cian' }));
      });
      return { alHacer: alHacer.mock.calls.length, capas: result.current.documento.paginas[0].capas.length };
    },
  },

  laboratorio3d: { avisos: [], sinGancho: 'transiciones puras `EstadoBanco → EstadoBanco`; a propósito no trae ningún `useBanco3D`' },

  muro: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useMuro({ alumno: SOFI_MURO }));
      act(() => {
        result.current.publicar({ texto: 'Hola muro' });
      });
      return { publicaciones: result.current.publicaciones.length };
    },
  },

  navegador: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useNavegador({ mapa: MAPA, inicio: 'inicio.tecnia.mx' }));
      act(() => {
        result.current.descargar('cosa.pdf');
      });
      act(() => {
        result.current.nuevaPestana();
      });
      return {
        descargas: result.current.descargas.length,
        /* El id se pide FUERA del actualizador: si volviera dentro, el contador
         * correría dos veces y esta descarga se llamaría `d2`. */
        primerIdDeDescarga: result.current.descargas[0]?.id === 'd1' ? 1 : 0,
        pestanasNuevas: result.current.pestanas.length - 1,
      };
    },
  },

  nube: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useNube({ archivos: [archivoDeNube()], capacidad: 1_000_000 }));
      act(() => {
        result.current.compartir('a', { id: 'diego', nombre: 'Diego' }, 'editar');
      });
      return { compartidoCon: result.current.archivos[0].compartidoCon.length };
    },
  },

  sistema: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useSistema({ raiz: arbolSistema(), capacidadDisco: 10_000_000 }));
      act(() => {
        result.current.crearCarpeta('Nueva');
      });
      act(() => {
        result.current.abrirVentana({ id: 'v1', titulo: 'Explorador', programa: 'explorador', minimizada: false });
      });
      return { hijos: result.current.carpetaActual.hijos.length, ventanas: result.current.ventanas.length };
    },
  },

  tablero: {
    avisos: [],
    conducir: () => {
      const { result } = enModoEstricto(() => useTablero({ columnas: COLUMNAS, tarjetas: [] }));
      act(() => {
        result.current.crear({ id: 't1', titulo: 'Buscar fotos', columnaId: 'por-hacer' });
      });
      return { tarjetas: result.current.tarjetas.length };
    },
  },

  web: {
    avisos: ['onAvance', 'onTerminado'],
    conducir: () => {
      const onAvance = jest.fn();
      const onTerminado = jest.fn();
      const { result } = enModoEstricto(() =>
        useEstudioWeb({
          archivos: [{ nombre: 'index.html', lenguaje: 'html', texto: '' }],
          guion: { pasos: [ENCARGO_CONFIRMA] },
          onAvance,
          onTerminado,
        }),
      );
      act(() => {
        result.current.confirmar();
      });
      return { onAvance: onAvance.mock.calls.length, onTerminado: onTerminado.mock.calls.length };
    },
  },

  /* No es un paquete: es el archivo `VentanaBase.tsx` suelto, el marco de
   * ventana que comparten todas. No tiene estado ni avisa a nadie. */
  'VentanaBase.tsx': { avisos: [], sinGancho: 'marco de ventana sin estado propio' },
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · El censo: ningún armazón se queda fuera de esta prueba
 * ═════════════════════════════════════════════════════════════════════════ */

/** Los paquetes (carpetas) y el `VentanaBase.tsx` suelto. Los `.css` no cuentan. */
function paquetesEnDisco(): string[] {
  return fs
    .readdirSync(RAIZ, { withFileTypes: true })
    .filter((e) => e.isDirectory() || /\.tsx?$/.test(e.name))
    .map((e) => e.name)
    .sort();
}

describe('1 · el censo de armazones', () => {
  it('el registro de esta prueba nombra EXACTAMENTE los armazones que hay en disco', () => {
    /* Si esto se pone rojo es que nació el armazón diecisiete. No se arregla
     * añadiendo el nombre a secas: hay que escribirle su conductor abajo, que
     * es lo que de verdad comprueba que no avisa dos veces. */
    expect(paquetesEnDisco()).toEqual(Object.keys(ARMAZONES).sort());
  });

  it('todo armazón con gancho tiene conductor, y el que no lo tiene dice por qué', () => {
    for (const [nombre, a] of Object.entries(ARMAZONES)) {
      /* Sin conductor sólo se libra quien no tiene gancho — y tiene que
       * explicarlo, y no puede declarar avisos: un armazón que avisa y no se
       * conduce es exactamente el agujero por el que se coló el defecto. */
      if (a.sinGancho) {
        expect(`${nombre}: ${a.avisos.length} avisos`).toBe(`${nombre}: 0 avisos`);
        continue;
      }
      expect(`${nombre}: ${typeof a.conducir}`).toBe(`${nombre}: function`);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · El censo de avisos: un `onTerminado` nuevo no puede entrar de tapadillo
 * ═════════════════════════════════════════════════════════════════════════ */

function archivosDe(dir: string): string[] {
  const salida: string[] = [];
  const stat = fs.statSync(dir);
  if (stat.isFile()) return /\.tsx?$/.test(dir) ? [dir] : [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...archivosDe(p));
    else if (/\.tsx?$/.test(e.name)) salida.push(p);
  }
  return salida;
}

/**
 * Los avisos que un paquete declara en sus `export interface Opciones*`: los
 * callbacks que la CLASE pasa hacia dentro. No se miran las props internas de
 * las `Ventana*` (`onCita`, `onDia`…), que son cableado entre la ventana y su
 * propio gancho y no cruzan la frontera del armazón.
 */
function avisosDeclarados(paquete: string): string[] {
  const encontrados = new Set<string>();
  for (const archivo of archivosDe(path.join(RAIZ, paquete))) {
    const src = fs.readFileSync(archivo, 'utf8');
    const bloques = src.matchAll(/export interface Opciones\w*\s*\{([\s\S]*?)\n\}/g);
    for (const [, cuerpo] of bloques) {
      for (const [, nombre] of cuerpo.matchAll(/^\s{2}((?:on|al)[A-Z]\w*)\??\s*:/gm)) encontrados.add(nombre);
    }
  }
  return [...encontrados].sort();
}

describe('2 · el censo de avisos', () => {
  it.each(Object.keys(ARMAZONES))('«%s» declara los avisos que este archivo dice que declara', (nombre) => {
    /* Rojo aquí = alguien le puso un aviso nuevo a un armazón. Hay que
     * registrarlo arriba Y conducirlo, o el apartado 4 no lo probaría nunca. */
    expect(avisosDeclarados(nombre)).toEqual([...ARMAZONES[nombre].avisos].sort());
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · La guarda estática: ni un aviso dentro de un actualizador
 * ═════════════════════════════════════════════════════════════════════════ */

/**
 * El barrido de avisos se hace sobre **`src/components` entero**, no sólo sobre
 * los dieciséis armazones. Es gratis —se comprobó: cero falsos positivos en el
 * árbol completo— y cubre de paso los 59 laboratorios que aún tienen que migrar
 * al arnés de sesión, que es donde el defecto haría más daño: `onProgress` y
 * `onComplete` son los avisos que cuentan el progreso del alumno de verdad.
 */
const ZONA_AVISOS = path.join(process.cwd(), 'src', 'components');

/**
 * El barrido de `ref` escritas dentro de un actualizador se queda en los
 * armazones y el arnés, que es lo que este encargo audita y deja limpio.
 *
 * Fuera de esta zona queda UNO vivo, encontrado el 15-ago-2026 y anotado sin
 * tocar porque es de otra sala: `src/components/office/VentanaDiapositivas.tsx`
 * (~línea 1056) empuja la pila de deshacer (`antes.current`) dentro del
 * actualizador de `setMazo`, así que en modo estricto **un cambio cuesta dos
 * Ctrl+Z**. Cuando se cure, súbase esta zona a `src/components` y esta prueba
 * lo cuidará también.
 */
const ZONAS_REFS = [RAIZ, path.join(process.cwd(), 'src', 'components', 'activities', 'lib')];

/** `setX(`, `useState(`, `useReducer(` — los tres sitios donde React repite el cuerpo. */
const ACTUALIZADOR = /\b(set[A-Z]\w*|useState|useReducer)\s*\(/g;
/** Relojes: `setTimeout`/`setInterval` casan con `set[A-Z]` y no son estado. */
const RELOJES = new Set(['setTimeout', 'setInterval', 'setImmediate']);
/**
 * Un aviso hacia fuera: un callback que llegó por props/opciones. Se cubren las
 * cuatro formas que usa la casa — `onAvance(...)`, `opciones.onAvance(...)`,
 * `opcionesRef.current.onAvance(...)` y `propsRef.current.onProgress(...)` —
 * más los `alHacer`/`alRechazar` de `useDiseno`.
 */
const AVISO =
  /(?:^|[^\w.])(?:(?:props|opciones|o)\??\.|(?:\w*Ref)\.current\??\.)?((?:on|al)[A-Z]\w*)\s*\??\.?\s*\(/;

/**
 * El primo del defecto: **escribir** una `ref` dentro del actualizador. Un
 * actualizador corre durante el pintado, así que empujar ahí una pila de
 * deshacer o subir un contador de ids se hace DOS veces en modo estricto.
 * Leerla no dobla nada, así que sólo se persigue la escritura.
 */
const REF_ESCRITA = /(\w+\.current(?:\.\w+)*)\s*(?:=[^=]|\+=|-=|\+\+|--)/;

interface Hallazgo {
  archivo: string;
  linea: number;
  actualizador: string;
  /** El aviso invocado, o la `ref` escrita. */
  culpa: string;
}

/**
 * Recorre un archivo emparejando paréntesis, aísla el cuerpo de cada
 * actualizador (`setX(fn)`, `useState(fn)`, `useReducer`) y le aplica un
 * buscador. Se empareja a mano en vez de con una expresión porque un cuerpo de
 * actualizador tiene llaves y paréntesis anidados, y una expresión suelta se
 * para en la primera llave que encuentra — que es justo por donde se escapó el
 * defecto durante meses.
 */
function dentroDeActualizadores(archivo: string, buscar: RegExp): Hallazgo[] {
  const src = fs.readFileSync(archivo, 'utf8');
  const hallazgos: Hallazgo[] = [];
  ACTUALIZADOR.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ACTUALIZADOR.exec(src)) !== null) {
    if (RELOJES.has(m[1])) continue;
    let i = m.index + m[0].length;
    let prof = 1;
    while (i < src.length && prof > 0) {
      const c = src[i];
      if (c === '(') prof += 1;
      else if (c === ')') prof -= 1;
      i += 1;
    }
    const argumentos = src.slice(m.index + m[0].length, i - 1);
    /* Sólo la forma de actualizador: el primer argumento es una función. Un
     * `setFoo(valor)` corriente no repite nada. */
    const flecha = argumentos.indexOf('=>');
    if (flecha === -1 || flecha > 80) continue;
    const hit = argumentos.slice(flecha + 2).match(buscar);
    if (!hit) continue;
    hallazgos.push({
      archivo: path.relative(process.cwd(), archivo).split(path.sep).join('/'),
      linea: src.slice(0, m.index).split('\n').length,
      actualizador: m[1],
      culpa: hit[1],
    });
  }
  return hallazgos;
}

const avisosDentroDeActualizadores = (archivo: string) => dentroDeActualizadores(archivo, AVISO);

describe('3 · la guarda estática', () => {
  it('en TODO src/components: ni un aviso hacia fuera dentro de un actualizador', () => {
    const hallazgos = archivosDe(ZONA_AVISOS)
      .filter((f) => !/__tests__|\.test\./.test(f))
      .flatMap(avisosDentroDeActualizadores);

    /* El mensaje explica el arreglo, porque quien lo lea estará viendo esto por
     * primera vez y con prisa. */
    const detalle = hallazgos
      .map((h) => `  · ${h.archivo}:${h.linea} — ${h.actualizador}((prev) => { … ${h.culpa}() … })`)
      .join('\n');
    expect(
      hallazgos.length === 0
        ? ''
        : `Un aviso hacia fuera se llama dentro de un actualizador de estado:\n${detalle}\n\n` +
          'React invoca ese cuerpo DOS VECES en modo estricto (el que Next trae de fábrica), así que el\n' +
          'aviso sale doble: el progreso avanza el doble y la actividad se completa dos veces. Además corre\n' +
          'durante el pintado, y quien lo recibe no puede tocar su estado ahí.\n' +
          'Arreglo: saca el aviso al GESTO que lo provoca, o a un efecto con su propio contador en `useRef`.\n' +
          'Mira `codigo/ventana/useCodigo.ts` (efecto + `avisadosRef`) o `web/useEstudioWeb.ts` (gesto + `hechosRef`).',
    ).toBe('');
  });

  it('en los armazones y el arnés: ni una `ref` ESCRITA dentro de un actualizador', () => {
    const hallazgos = ZONAS_REFS.flatMap(archivosDe)
      .filter((f) => !/__tests__|\.test\./.test(f))
      .flatMap((f) => dentroDeActualizadores(f, REF_ESCRITA));

    const detalle = hallazgos
      .map((h) => `  · ${h.archivo}:${h.linea} — ${h.actualizador}((prev) => { … ${h.culpa} = … })`)
      .join('\n');
    expect(
      hallazgos.length === 0
        ? ''
        : `Una \`ref\` se escribe dentro de un actualizador de estado:\n${detalle}\n\n` +
          'Un actualizador corre durante el pintado y en modo estricto se invoca dos veces, así que esa\n' +
          'escritura se hace DOS veces: una pila de deshacer recibe dos entradas por cambio, un contador de\n' +
          'ids salta de dos en dos. Arreglo: calcula el valor ANTES y pásalo cerrado al actualizador.\n' +
          'Mira `navegador/useNavegador.ts`, `descargar` (el `nuevoId` se pide fuera).',
    ).toBe('');
  });

  it('la guarda sabe encontrarlo: sobre el defecto de mentira, lo caza', () => {
    /* Una guarda que nunca ha visto el defecto no vale nada. Se le enseña uno
     * escrito a mano —con llaves anidadas, que es donde se atraganta un `grep`—
     * y tiene que señalar las dos caras: el aviso y la `ref` escrita. */
    const falso = path.join(process.cwd(), 'src', 'components', 'simuladores', '.guarda-de-mentira.ts');
    fs.writeFileSync(
      falso,
      [
        'export function useFalso(onTerminado: () => void) {',
        '  const marcar = (id: string) => {',
        '    setHechos((prev) => {',
        '      const nuevos = [...prev, id];',
        '      if (nuevos.length === 3) { onTerminado(); }',
        '      contador.current += 1;',
        '      return nuevos;',
        '    });',
        '  };',
        '  return marcar;',
        '}',
        '',
      ].join('\n'),
      'utf8',
    );
    try {
      const avisos = avisosDentroDeActualizadores(falso);
      expect(avisos).toHaveLength(1);
      expect(avisos[0]).toMatchObject({ actualizador: 'setHechos', culpa: 'onTerminado' });

      const refs = dentroDeActualizadores(falso, REF_ESCRITA);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toMatchObject({ actualizador: 'setHechos', culpa: 'contador.current' });
    } finally {
      fs.unlinkSync(falso);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · La conducta: un gesto, un aviso — DENTRO de `<StrictMode>`
 * ═════════════════════════════════════════════════════════════════════════ */

const CONDUCIBLES = Object.entries(ARMAZONES).filter(([, a]) => a.conducir);

/**
 * El cimiento de todo el apartado: un actualizador impuro a propósito, para
 * comprobar que este React y este `<StrictMode>` de verdad lo invocan dos veces.
 * Sin esto, el día que React dejara de doblar, las once pruebas de abajo
 * pasarían sin medir absolutamente nada y nadie se enteraría.
 */
function useCimiento() {
  const contador = useRef(0);
  const [, setN] = useState(0);
  const subir = useCallback(() => {
    setN((p) => {
      contador.current += 1;
      return p + 1;
    });
  }, []);
  return { subir, veces: () => contador.current };
}

describe('4 · un gesto, un aviso (modo estricto)', () => {
  it('el modo estricto de esta prueba SÍ dobla los actualizadores impuros', () => {
    /* El cimiento. Si React dejara de doblar, todo el apartado 4 pasaría sin
     * medir nada y nadie se enteraría. Así que se comprueba primero. */
    const { result } = renderHook(() => useCimiento(), { wrapper: StrictMode });
    act(() => result.current.subir());
    expect(result.current.veces()).toBe(2);
  });

  it.each(CONDUCIBLES)('«%s»: cada aviso y cada efecto, exactamente una vez', (nombre, armazon) => {
    const cuenta = armazon.conducir!();
    /* Todo lo que el conductor devuelve tiene que valer 1. Si algo vale 2, es
     * que el gesto se contó dos veces — que es el defecto. */
    for (const [que, veces] of Object.entries(cuenta)) {
      expect(`${nombre}.${que} = ${veces}`).toBe(`${nombre}.${que} = 1`);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 5 · El arnés de sesión: el que toca a más laboratorios
 * ═════════════════════════════════════════════════════════════════════════ */

function propsDeMentira(): ActivityProps & { espias: Record<string, jest.Mock> } {
  const espias = {
    onProgress: jest.fn(),
    onScore: jest.fn(),
    onComplete: jest.fn(),
  };
  return { ...(espias as unknown as ActivityProps), espias };
}

describe('5 · useLabActividad (el arnés que heredarán los 59 laboratorios)', () => {
  it('avanzar() una vez avisa a onProgress una vez, y terminar() completa una sola vez', () => {
    const props = propsDeMentira();
    const { result } = enModoEstricto(() => useLabActividad(props, 4));

    act(() => {
      result.current.avanzar();
    });
    expect(props.espias.onProgress).toHaveBeenCalledTimes(1);
    expect(props.espias.onProgress).toHaveBeenLastCalledWith(0.25);
    expect(result.current.pasos).toBe(1);

    act(() => {
      result.current.terminar(30);
    });
    expect(props.espias.onComplete).toHaveBeenCalledTimes(1);
  });

  it('restar() una vez baja el puntaje un escalón, no dos', () => {
    const props = propsDeMentira();
    const { result } = enModoEstricto(() => useLabActividad(props, 4));
    act(() => {
      result.current.restar();
    });
    expect(props.espias.onScore).toHaveBeenCalledTimes(1);
    expect(props.espias.onScore).toHaveBeenLastCalledWith(94);
  });
});
