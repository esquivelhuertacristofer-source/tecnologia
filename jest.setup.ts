/*
 * Este archivo estuvo en el `exclude` del `tsconfig.json` hasta el 15-ago-2026, y
 * eso era una trampa con la forma exacta de una que este proyecto persigue: **la
 * prueba salía verde y el build rojo**.
 *
 * El import de abajo trae los matchers de `jest-dom` (`toBeInTheDocument`,
 * `toHaveTextContent`, `toBeEnabled`…) y, con ellos, la ampliación de tipos que
 * los declara. En tiempo de ejecución llegaba —jest carga este archivo—, pero
 * `tsc` nunca lo miraba, así que quien los usaba veía sus pruebas pasar y el
 * compilador quejarse de que esos matchers no existen.
 *
 * Lo pisaron **dos agentes distintos el mismo día** construyendo las actividades
 * de N4·U6, y ninguno de los dos lo arregló aquí: uno los cambió por matchers
 * pelados y el otro añadió el import a mano en el archivo de pruebas ajeno. Dos
 * parches y ninguna cura, que es lo que pasa cuando el defecto vive en un archivo
 * de configuración y quien lo encuentra tiene otra cosa entre manos.
 *
 * Sacándolo del `exclude`, `tsc` sigue en 0 y los matchers quedan disponibles en
 * todas las pruebas sin que nadie tenga que importarlos otra vez.
 */
import "@testing-library/jest-dom";

// ── Supabase browser client mock ────────────────────────────────────────────
const supabaseMock = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock("@/lib/supabase-browser", () => ({ supabase: supabaseMock }));
jest.mock("./src/lib/supabase-browser", () => ({ supabase: supabaseMock }));

// ── Sentry mock (disable in tests) ──────────────────────────────────────────
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
  withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setExtra: jest.fn() })),
}));

// ── Next.js router mock ──────────────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

/*
 * ── El lienzo que jsdom no tiene ────────────────────────────────────────────
 *
 * jsdom no implementa `HTMLCanvasElement.prototype.getContext`. Cuando algo lo
 * llama —y `detectarWebGL()` lo llama en cada escena 3D— jsdom **no lanza una
 * excepción: registra un error**. Por eso el `try/catch` que rodea la llamada
 * no lo atrapa, y la suite entera se llena de ruido rojo que no corresponde a
 * ningún fallo.
 *
 * Devolver `null` deja el comportamiento exactamente igual que antes
 * —`detectarWebGL()` sigue dando falso y las escenas siguen cayendo a su
 * respaldo—, sólo que en silencio.
 *
 * Lo encontró el armazón 3D el 15-ago-2026 mientras medía la capa que ya
 * existía, y lo curé desde fuera a propósito: es la segunda vez este mes que
 * un defecto vive en un archivo de configuración, y las dos veces quien lo
 * encontró tenía otra cosa entre manos y lo parcheó en su sitio en vez de
 * curarlo aquí. Ver el comentario de la cabecera de este mismo archivo.
 */
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement["getContext"];
}

/*
 * ── Los rectángulos que jsdom no mide ───────────────────────────────────────
 *
 * `Range.prototype.getClientRects` **no existe en jsdom**, y en la suite de
 * Office lo piden dos cosas a la vez: ProseMirror, para saber dónde está el
 * cursor, y el paginador de esta casa (§35), para medir dónde parte una hoja.
 * Sin esto, la primera pulsación de cualquier clase de Word revienta con
 * «r.getClientRects is not a function» y no se puede jugar ni un encargo.
 * Devolver una lista vacía es lo correcto en una prueba: no hay pantalla, así
 * que no hay rectángulos, y el paginador ya sabe no partir nada cuando no mide.
 * `Element.scrollTo` va con ellos porque el editor desplaza el lienzo al mover
 * el cursor.
 *
 * Vivió a mano en `ventana-textos-portafolio-y-cv.test.tsx` desde el 14-ago-2026
 * —la primera prueba del repo que jugaba una clase de Word entera—, y su autor
 * lo dejó escrito: «el día que la sala de Word tenga sus diecinueve recorridos,
 * este bloque sube aquí y se escribe una vez». Ese día es hoy (15-ago-2026): el
 * recorrido de punta a punta de la sala de Word lo necesita en veinte archivos.
 * Es la tercera vez este mes que un defecto vive en este archivo de
 * configuración; las dos anteriores están contadas arriba y las dos se
 * parchearon en su sitio en vez de curarse aquí.
 *
 * Se comprueba antes de asignar para no pisar una implementación de verdad si
 * un día jsdom la trae.
 */
if (typeof Element !== "undefined" && typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = function scrollTo() {};
}
/*
 * Su hermano, y lo pidieron TRES clases el mismo día, cada una desde un sitio
 * distinto: `of-word-estilos-e-indice` en su primer encargo —`PanelNavegacion`
 * salta a una sección—, `of-word-revisa-y-comenta` en su panel de comentarios y
 * `of-word-plantillas` al abrir el encabezado, que lleva la hoja 1 a la vista.
 * Sin esto el clic revienta con «scrollIntoView is not a function» dentro de un
 * efecto y la clase parece rota cuando lo que falta es la pantalla.
 *
 * Estuvo escrito dos veces seguidas en este mismo archivo, por dos sesiones que
 * lo encontraron a la vez y ninguna vio a la otra. Queda una.
 */
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
if (typeof Range !== "undefined" && typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
}
if (typeof Range !== "undefined" && typeof Range.prototype.getBoundingClientRect !== "function") {
  Range.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
}

/*
 * ── El observador de tamaño que jsdom no trae ───────────────────────────────
 *
 * `ResizeObserver` **no existe en jsdom 26**, y no es un adorno: cuatro piezas
 * del repo lo instancian dentro de un efecto —la capa de encabezado y pie de
 * `of-word-plantillas`, el panel de `of-word-coautoria`, el de
 * `of-word-revisa-y-comenta` y el proyector de PowerPoint—, así que montar
 * cualquiera de esas cuatro clases en una prueba revienta con «ResizeObserver is
 * not defined» antes de que se pueda jugar un solo encargo. Es el mismo agujero
 * y de la misma forma que `Range.getClientRects` de aquí arriba: no es un
 * defecto de la clase, es una pieza del navegador que falta.
 *
 * El doble no observa nada, y eso está bien en una prueba: sin motor de
 * maquetación no hay cambios de tamaño que observar, y todas las piezas que lo
 * usan miden también una primera vez por su cuenta —con `requestAnimationFrame`
 * o al montarse—, que es la medida de la que dependen. Un doble que llamara al
 * callback fingiría un cambio que no ha ocurrido.
 *
 * Se comprueba antes de asignar para no pisar una implementación de verdad si un
 * día jsdom la trae. Cuarta vez este mes que un hueco del entorno se cura aquí
 * en vez de parchearse en el archivo de quien lo encuentra; ver la cabecera.
 */
if (typeof globalThis !== "undefined" && typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === "undefined") {
  class ResizeObserverDoble {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverDoble;
}

/*
 * ── El observador de tamaño que jsdom no trae ───────────────────────────────
 *
 * `ResizeObserver` **no existe en jsdom**, y en cuanto una prueba monta el
 * «laboratorio de dos hojas» —la página educativa y el simulador a la vez, que
 * es el encargo del cliente del 6-ago-2026— el componente revienta con
 * «ResizeObserver is not defined» antes de pintar nada. Lo usa para avisar al
 * simulador de que su panel cambió de ancho, porque lo que cambia de tamaño es
 * el panel y no la ventana.
 *
 * Un doble que no observa nada es lo correcto en una prueba: en jsdom ningún
 * elemento cambia de tamaño nunca, así que un observador de verdad tampoco
 * emitiría. Lo que hace falta es que la clase exista.
 *
 * Va aquí y no en el archivo de pruebas que lo encontró: es la cuarta vez este
 * mes que un defecto vive en este archivo de configuración, y las tres
 * anteriores —contadas arriba— se parchearon en su sitio en vez de curarse. La
 * quinta prueba que monte dos hojas no debería volver a tropezar.
 *
 * Se comprueba antes de asignar para no pisar una implementación de verdad si
 * un día jsdom la trae.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverDoble {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverDoble as unknown as typeof ResizeObserver;
}

/*
 * ── La consulta de medios que jsdom no responde ─────────────────────────────
 *
 * `window.matchMedia` **no existe en jsdom**, y lo llama todo laboratorio 3D de
 * esta casa nada más montar: `useReduceMotion` (arcade3d) y `useReduceMotion3D`
 * (las clases de volumen) preguntan por `prefers-reduced-motion` en su primer
 * efecto. Hasta hoy nadie lo había pisado por un accidente: en las entradas con
 * video, el primer `<button>` del documento es el del cubrepantalla, así que el
 * harness de contrato —que pulsa el primero que encuentra— nunca llegaba a
 * abrir el laboratorio. En cuanto una clase declara `assetsPendientes` no hay
 * cubrepantalla, el primer botón es el CTA, y el laboratorio se monta de verdad.
 *
 * El doble devuelve `matches: false` —sin preferencia de movimiento reducido,
 * que es el valor por omisión de un navegador— y trae los dos juegos de
 * oyentes: `addEventListener`, que es el que usa esta casa, y `addListener`, el
 * antiguo, por si alguna dependencia todavía lo pide.
 *
 * Se comprueba antes de asignar para no pisar una implementación de verdad.
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// ── Suppress React 19 act() noise ────────────────────────────────────────────
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("Warning: ReactDOM.render is no longer supported") ||
      msg.includes("act(") ||
      msg.includes("not wrapped in act")
    ) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => { console.error = originalError; });
