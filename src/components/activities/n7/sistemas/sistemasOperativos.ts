/**
 * `n7-sistemas-operativos` · N7·U1 «Arquitectura y sistemas», parada 3 de 4.
 * Temario propio en `DOC-N7-n7-sistemas-operativos.md` (§0 explica en qué se
 * aparta del §31.3 del documento maestro y por qué). **12–13 años**, leído en
 * `curriculo.ts`.
 *
 * ── Qué es este archivo ───────────────────────────────────────────────────
 *
 * Datos puros y funciones puras: los cinco oficios del sistema operativo, los
 * seis encargos del acto 1, las tres tareas del acto 2 y las **cinco pieles**
 * —cuatro que se comparan y una que el alumno no ha visto nunca—. Ni React ni
 * DOM: aquí no se pinta nada (eso es `PantallaSistema.tsx`) y aquí no hay
 * estado (eso es `LabSistemasOperativos.tsx`).
 *
 * ── Las tres decisiones que ordenan el archivo ────────────────────────────
 *
 * 1. **Una piel es una descripción, no un componente.** Cada sistema declara
 *    su `forma` (dónde van sus barras) y una lista de `puntos` con la `zona`
 *    donde vive cada uno. Un solo componente los pinta a los cinco. Eso NO es
 *    un motor de plantillas —no recibe ejercicios, no los pinta y no corrige—:
 *    es lo mismo que hace `VentanaExplorador` con un listado. Y que sea uno
 *    solo es pedagógicamente obligatorio: si cada pantalla la escribiera otra
 *    mano, el alumno vería diferencias de acabado en vez de diferencias de
 *    sistema, que es lo único que esta clase quiere que note.
 *
 * 2. **Ningún nombre de marca real dentro de la simulación.** Regla de la
 *    casa (software ultra-LITE). Los nombres reales —Windows, Linux, Android,
 *    iOS, macOS— viven en `familiaReal`, que es lo que **Bit dice en voz
 *    alta**, nunca lo que se pinta como interfaz. El alumno aprende el nombre
 *    real como conocimiento y toca una pantalla que no copia a nadie.
 *
 * 3. **Un punto que no resuelve la tarea SIEMPRE explica qué hace de verdad.**
 *    `queHace` no es opcional: el error es media clase. «Instalar no es abrir»
 *    (el centro de programas de Raíz) enseña más que el acierto.
 *
 * ── El predicado de la tarea `abrir`, y por qué dice «que no ves» ─────────
 *
 * La tarea 1 pide abrir **Tecnia Calculadora, que no está a la vista**. Sin esa
 * condición el predicado estaría mal escrito: tocar el icono de una app
 * TAMBIÉN la abre en un teléfono o una tablet, así que marcar ese toque como
 * error castigaría una respuesta correcta. Con la calculadora fuera de la
 * vista, la única respuesta buena en cada sistema es **la puerta a todo lo
 * instalado** — y es justo la que cambia de sitio y de nombre en los cinco.
 */

/* ── los oficios del sistema operativo ─────────────────────────────────── */

export type OficioId = 'memoria' | 'turnos' | 'archivos' | 'hardware' | 'permisos' | 'aplicacion';

export interface Oficio {
  id: OficioId;
  nombre: string;
  emoji: string;
  acento: string;
}

/**
 * Los cinco oficios, más la sexta opción que NO es un oficio del sistema. El
 * orden es el de la teórica y es el que se pinta.
 */
export const OFICIOS: readonly Oficio[] = Object.freeze([
  { id: 'memoria', nombre: 'Reparte la memoria', emoji: '🧠', acento: '#22d3ee' },
  { id: 'turnos', nombre: 'Da turnos al CPU', emoji: '⏱️', acento: '#fbbf24' },
  { id: 'archivos', nombre: 'Organiza los archivos', emoji: '🗂️', acento: '#a78bfa' },
  { id: 'hardware', nombre: 'Habla con el hardware', emoji: '🔌', acento: '#34d399' },
  { id: 'permisos', nombre: 'Controla los permisos', emoji: '🔑', acento: '#f472b6' },
  { id: 'aplicacion', nombre: 'Eso lo hace una aplicación', emoji: '📦', acento: '#fb7185' },
]);

export interface Encargo {
  id: string;
  texto: string;
  respuesta: OficioId;
  /** Por qué es ése. Se dice al acertar. */
  razon: string;
}

export const ENCARGOS: readonly Encargo[] = Object.freeze([
  {
    id: 'e-memoria',
    texto: 'Tecnia Música acaba de abrirse y pide 300 MB para cargar tus canciones.',
    respuesta: 'memoria',
    razon:
      'El sistema lleva la cuenta de cuánta RAM queda libre y decide cuánta le presta a cada programa. Si no quedara, sencillamente no lo abre.',
  },
  {
    id: 'e-turnos',
    texto: 'Tecnia Textos y el navegador quieren el CPU al mismo tiempo, y sólo hay un CPU.',
    respuesta: 'turnos',
    razon:
      'El sistema les da turnos tan cortos que a ti te parecen simultáneos. Eso es la multitarea: no hacen dos cosas a la vez, se turnan muy rápido.',
  },
  {
    id: 'e-archivos',
    texto: 'Diste «Guardar» a tu dibujo y hay que meterlo en la carpeta Tareas del disco.',
    respuesta: 'archivos',
    razon:
      'El programa dice QUÉ guardar; dónde y cómo se escribe en el disco, en qué carpeta y con qué nombre, lo decide el sistema.',
  },
  {
    id: 'e-hardware',
    texto: 'Conectaste una impresora que este equipo nunca había visto.',
    respuesta: 'hardware',
    razon:
      'El sistema busca su controlador —el programa que sabe hablarle a ese aparato— y lo carga. Sin controlador, la impresora es un adorno.',
  },
  {
    id: 'e-permisos',
    texto: 'La cuenta de invitado quiere borrar los archivos de la cuenta del maestro.',
    respuesta: 'permisos',
    razon:
      'Cada cuenta puede hacer unas cosas y otras no, y el sistema es quien dice que no. Por eso una cuenta de invitado no puede tocar lo de nadie más.',
  },
  {
    id: 'e-app',
    texto: 'Hay que recortar la foto y subirle el brillo.',
    respuesta: 'aplicacion',
    razon:
      'Ésa era la trampa, y es la frontera de toda la clase: el sistema administra la máquina, la aplicación hace la tarea. El sistema le presta memoria y le guarda el archivo, pero el recorte es de ella.',
  },
]);

/** Lo que Bit dice cuando se elige un oficio que no era. Uno por oficio: el
 *  error explica qué hace de verdad el que se eligió. */
export const EXPLICACION_OFICIO: Readonly<Record<OficioId, string>> = Object.freeze({
  memoria: 'Repartir la memoria es decidir cuánta RAM le toca a cada programa abierto. No es eso lo que te están pidiendo aquí.',
  turnos: 'Dar turnos al CPU es la multitarea: repartir el procesador entre los programas. No es eso lo que te están pidiendo aquí.',
  archivos: 'Organizar los archivos es decidir dónde y cómo se escriben en el disco. No es eso lo que te están pidiendo aquí.',
  hardware: 'Hablar con el hardware es cargar el controlador de un aparato para poder usarlo. No es eso lo que te están pidiendo aquí.',
  permisos: 'Controlar los permisos es decidir qué puede hacer cada cuenta. No es eso lo que te están pidiendo aquí.',
  aplicacion:
    'Ojo con la frontera: eso SÍ lo hace el sistema. Una aplicación hace una tarea concreta para ti; administrar la máquina es del sistema.',
});

/* ── las tareas que se comparan ────────────────────────────────────────── */

export type TareaId = 'abrir' | 'archivos' | 'ajustes';

export interface Tarea {
  id: TareaId;
  /** El nombre corto: el encabezado de la fila de la tabla. */
  nombre: string;
  emoji: string;
  /** El encargo completo que se le lee al alumno. */
  encargo: string;
  acento: string;
}

export const TAREAS: readonly Tarea[] = Object.freeze([
  {
    id: 'abrir',
    nombre: 'Abrir un programa',
    emoji: '🚀',
    encargo:
      'Abre Tecnia Calculadora. Está instalada, pero NO la ves por ningún lado: busca dónde se ve todo lo que hay instalado.',
    acento: '#22d3ee',
  },
  {
    id: 'archivos',
    nombre: 'Ver tus archivos',
    emoji: '🗂️',
    encargo: 'Enseña los archivos que tienes guardados en este equipo.',
    acento: '#a78bfa',
  },
  {
    id: 'ajustes',
    nombre: 'Cambiar un ajuste',
    emoji: '🎚️',
    encargo: 'Cambia el volumen o el brillo de este equipo.',
    acento: '#fbbf24',
  },
]);

/* ── las pieles ────────────────────────────────────────────────────────── */

/** Dónde vive un punto dentro de la pantalla. La `forma` de la piel decide
 *  qué zonas existen y cómo se dibujan. */
export type ZonaPantalla = 'barra-superior' | 'barra-inferior' | 'muelle-izq' | 'lienzo' | 'barra-derecha';

/** La estructura de la interfaz. Es lo ÚNICO que de verdad cambia entre un
 *  sistema de escritorio y uno táctil, y es lo que `marca` de
 *  `simuladores/sistema/Escritorio.tsx` no puede cambiar — ver §0 del temario. */
export type FormaInterfaz = 'barra-abajo' | 'panel-arriba' | 'tactil-cajon' | 'tactil-plana' | 'borde-derecho';

export type Aparato = 'escritorio' | 'laptop' | 'telefono' | 'tablet' | 'todo-en-uno';

export interface PuntoSistema {
  id: string;
  etiqueta: string;
  emoji: string;
  zona: ZonaPantalla;
  /** Pegado al extremo final de su barra (derecha, o abajo en las verticales). */
  alFinal?: boolean;
  /** Qué tarea resuelve este punto. `null` = no resuelve ninguna. */
  resuelve: TareaId | null;
  /** Qué hace de verdad. Obligatorio incluso en los que resuelven: es lo que
   *  se dice cuando se toca buscando OTRA cosa. */
  queHace: string;
  /** Lo que se ve al acertar con él. Obligatorio si `resuelve` no es `null`. */
  resultado?: string;
}

export interface PielSistema {
  id: string;
  nombre: string;
  emoji: string;
  aparato: Aparato;
  forma: FormaInterfaz;
  /** Lo que Bit dice en voz alta. Aquí —y sólo aquí— aparecen los nombres
   *  reales: la interfaz simulada nunca lleva marca. */
  familiaReal: string;
  /** La columna de la tabla comparativa. */
  columna: string;
  acento: string;
  acentoProfundo: string;
  fondo: string;
  puntos: readonly PuntoSistema[];
}

/** Sistema de escritorio de muchas marcas — la familia de Windows. */
export const VENTANAL: PielSistema = {
  id: 'ventanal',
  nombre: 'Tecnia Ventanal',
  emoji: '🪟',
  aparato: 'escritorio',
  forma: 'barra-abajo',
  familiaReal: 'Así son los sistemas de escritorio que corren en computadoras de muchas marcas, como Windows: barra de tareas abajo y un botón de inicio en la esquina.',
  columna: 'Ventanal',
  acento: '#38bdf8',
  acentoProfundo: '#0c4a6e',
  fondo: 'linear-gradient(160deg, #0b2545 0%, #071528 100%)',
  puntos: [
    {
      id: 'inicio',
      etiqueta: 'Inicio',
      emoji: '⊞',
      zona: 'barra-inferior',
      resuelve: 'abrir',
      queHace: 'Abre el menú con la lista de TODOS los programas instalados, estén o no en el escritorio.',
      resultado:
        'Se abrió el menú de Inicio y ahí está Tecnia Calculadora, en la lista de todo lo instalado. En este sistema la puerta a todo está abajo a la izquierda.',
    },
    {
      id: 'explorador',
      etiqueta: 'Explorador',
      emoji: '🗂️',
      zona: 'barra-inferior',
      resuelve: 'archivos',
      queHace: 'Abre el explorador de archivos: Documentos, Imágenes, Descargas y el disco entero.',
      resultado: 'Se abrió el explorador: Documentos, Imágenes, Descargas. Aquí vive todo lo que has guardado.',
    },
    {
      id: 'volumen',
      etiqueta: 'Volumen y red',
      emoji: '🔊',
      zona: 'barra-inferior',
      alFinal: true,
      resuelve: 'ajustes',
      queHace: 'Abre el panel rápido con volumen, brillo y red, sin salir de lo que estabas haciendo.',
      resultado:
        'Bajó el panel rápido: volumen, brillo y red. No hace falta abrir nada más grande para mover el volumen.',
    },
    {
      id: 'reloj',
      etiqueta: 'Reloj y avisos',
      emoji: '🕐',
      zona: 'barra-inferior',
      alFinal: true,
      resuelve: null,
      queHace: 'Ahí están la hora, la fecha y la lista de avisos. Los ajustes rápidos son el icono del volumen, justo a su izquierda.',
    },
    {
      id: 'papelera',
      etiqueta: 'Papelera',
      emoji: '🗑️',
      zona: 'lienzo',
      resuelve: null,
      queHace: 'Guarda lo que borras hasta que la vacías. Tus archivos guardados no están aquí: están en el explorador.',
    },
  ],
};

/** Sistema libre y gratuito — la familia de Linux. */
export const RAIZ: PielSistema = {
  id: 'raiz',
  nombre: 'Tecnia Raíz',
  emoji: '🌱',
  aparato: 'laptop',
  forma: 'panel-arriba',
  familiaReal: 'Así son los sistemas libres y gratuitos, como Linux: se pueden instalar y modificar, mueven casi todos los servidores del mundo, y casi todo se busca escribiendo.',
  columna: 'Raíz',
  acento: '#fb923c',
  acentoProfundo: '#7c2d12',
  fondo: 'linear-gradient(160deg, #2a1206 0%, #140801 100%)',
  puntos: [
    {
      id: 'actividades',
      etiqueta: 'Actividades',
      emoji: '🔎',
      zona: 'barra-superior',
      resuelve: 'abrir',
      queHace: 'Abre el buscador del sistema: escribes el nombre del programa y aparece, esté donde esté.',
      resultado:
        'Se abrió el buscador y escribiste «calc»: ahí está Tecnia Calculadora. Aquí la puerta a todo lo instalado está arriba a la izquierda y se usa con el teclado.',
    },
    {
      id: 'archivos-raiz',
      etiqueta: 'Archivos',
      emoji: '🗂️',
      zona: 'muelle-izq',
      resuelve: 'archivos',
      queHace: 'Abre el gestor de archivos: la carpeta personal, el disco y lo que hayas conectado.',
      resultado: 'Se abrió el gestor de archivos. Se llama distinto que en Ventanal y enseña exactamente lo mismo.',
    },
    {
      id: 'menu-sistema',
      etiqueta: 'Menú del sistema',
      emoji: '🔧',
      zona: 'barra-superior',
      alFinal: true,
      resuelve: 'ajustes',
      queHace: 'Abre el menú del sistema con volumen, red y el botón de apagar, todo en la esquina de arriba.',
      resultado:
        'Se abrió el menú del sistema: volumen, brillo, red y apagar. Mismo panel que en Ventanal, en la esquina contraria.',
    },
    {
      id: 'terminal',
      etiqueta: 'Terminal',
      emoji: '⌨️',
      zona: 'muelle-izq',
      resuelve: null,
      queHace: 'Es la ventana donde se le escriben órdenes al sistema con el teclado. Es potentísima, pero no es donde se abren los programas del día a día.',
    },
    {
      id: 'centro-programas',
      etiqueta: 'Centro de programas',
      emoji: '📦',
      zona: 'muelle-izq',
      resuelve: null,
      queHace: 'Aquí se INSTALAN programas nuevos. Instalar no es abrir: lo que ya tienes instalado se abre desde Actividades.',
    },
  ],
};

/** Sistema de teléfono, sobre el mismo núcleo que Raíz — la familia de Android. */
export const BOLSILLO: PielSistema = {
  id: 'bolsillo',
  nombre: 'Tecnia Bolsillo',
  emoji: '📱',
  aparato: 'telefono',
  forma: 'tactil-cajon',
  familiaReal: 'Así son los sistemas de teléfono construidos sobre el núcleo de Linux, como Android. Son familia de Raíz aunque en la pantalla no se parezcan en nada: por debajo llevan el mismo núcleo.',
  columna: 'Bolsillo',
  acento: '#4ade80',
  acentoProfundo: '#14532d',
  fondo: 'linear-gradient(160deg, #06251a 0%, #021109 100%)',
  puntos: [
    {
      id: 'cajon',
      etiqueta: 'Cajón de aplicaciones',
      emoji: '⠿',
      zona: 'barra-inferior',
      resuelve: 'abrir',
      queHace: 'Abre el cajón: TODAS las aplicaciones instaladas, aunque no tengan icono en la pantalla de inicio.',
      resultado:
        'Se abrió el cajón y ahí está Tecnia Calculadora. En un teléfono no hay menú de inicio: hay cajón, y es la misma puerta con otro nombre.',
    },
    {
      id: 'archivos-bolsillo',
      etiqueta: 'Archivos',
      emoji: '🗂️',
      zona: 'lienzo',
      resuelve: 'archivos',
      queHace: 'Abre la aplicación de archivos del teléfono: descargas, fotos y documentos.',
      resultado: 'Se abrió Archivos: descargas, fotos y documentos. Es una aplicación, no una ventana, y hace lo mismo.',
    },
    {
      id: 'barra-estado',
      etiqueta: 'Deslizar la barra de arriba',
      emoji: '⌄',
      zona: 'barra-superior',
      resuelve: 'ajustes',
      queHace: 'Baja el panel rápido con brillo, volumen, wifi y datos.',
      resultado:
        'Bajó el panel rápido: brillo, volumen, wifi. Es el mismo panel de la esquina de Ventanal, pero se abre con un gesto en vez de con un clic.',
    },
    {
      id: 'atras',
      etiqueta: 'Atrás',
      emoji: '◀',
      zona: 'barra-inferior',
      resuelve: null,
      queHace: 'Vuelve a la pantalla anterior. Es del sistema, no de la aplicación: por eso funciona igual en todas.',
    },
    {
      id: 'tienda',
      etiqueta: 'Tienda',
      emoji: '🛍️',
      zona: 'lienzo',
      resuelve: null,
      queHace: 'Aquí se descargan aplicaciones nuevas. Igual que el centro de programas de Raíz: descargar no es abrir.',
    },
  ],
};

/** Sistema cerrado de una sola marca — la familia de iOS y macOS. */
export const CRISTAL: PielSistema = {
  id: 'cristal',
  nombre: 'Tecnia Cristal',
  emoji: '🔷',
  aparato: 'tablet',
  forma: 'tactil-plana',
  familiaReal: 'Así son los sistemas cerrados que sólo corren en los equipos de una marca, como iOS en los iPad y macOS en las computadoras Apple: aquí no hay cajón ni menú, todo lo instalado vive en la pantalla de inicio.',
  columna: 'Cristal',
  acento: '#c084fc',
  acentoProfundo: '#4c1d95',
  fondo: 'linear-gradient(160deg, #1d0f36 0%, #0b0518 100%)',
  puntos: [
    {
      id: 'buscar',
      etiqueta: 'Buscar',
      emoji: '🔍',
      zona: 'barra-superior',
      resuelve: 'abrir',
      queHace: 'Busca dentro del aparato y encuentra cualquier aplicación instalada, aunque su icono esté en otra pantalla.',
      resultado:
        'Escribiste «calc» y ahí está. Este sistema no tiene cajón ni menú de inicio: si no ves el icono, lo buscas escribiendo. Tercera puerta distinta, mismo trabajo.',
    },
    {
      id: 'archivos-cristal',
      etiqueta: 'Archivos',
      emoji: '🗂️',
      zona: 'lienzo',
      resuelve: 'archivos',
      queHace: 'Abre la aplicación de archivos de la tablet.',
      resultado: 'Se abrió Archivos. Cuatro sistemas, cuatro sitios distintos, y los cuatro te enseñan lo mismo que guardaste.',
    },
    {
      id: 'ajustes-cristal',
      etiqueta: 'Ajustes',
      emoji: '⚙️',
      zona: 'lienzo',
      resuelve: 'ajustes',
      queHace: 'Abre la aplicación de Ajustes: aquí no hay panel de sistema aparte, TODO se cambia dentro de esta única aplicación.',
      resultado:
        'Se abrió Ajustes. En este sistema el volumen y el brillo no viven en una esquina de la pantalla: viven dentro de una aplicación, como todo lo demás.',
    },
    {
      id: 'muelle',
      etiqueta: 'El muelle',
      emoji: '⚓',
      zona: 'barra-inferior',
      resuelve: null,
      queHace: 'Las aplicaciones que más usas, fijas abajo en todas las pantallas. Es un atajo, no la lista completa de lo instalado.',
    },
    {
      id: 'notas',
      etiqueta: 'Tecnia Notas',
      emoji: '📝',
      zona: 'lienzo',
      resuelve: null,
      queHace: 'Se abre tocando su icono, claro. Pero la calculadora que buscas no está a la vista, y por eso hace falta el buscador.',
    },
  ],
};

/** Los cuatro que se comparan, en el orden del acto 2. */
export const PIELES_COMPARADAS: readonly PielSistema[] = Object.freeze([VENTANAL, RAIZ, BOLSILLO, CRISTAL]);

/**
 * El quinto, el del acto 3: un sistema que el alumno NO ha visto y que no se
 * parece a ninguno de los cuatro —su única barra es vertical y está pegada al
 * borde derecho, y sus botones se llaman de otro modo—. Es la prueba de que la
 * clase enseñó el invariante y no cuatro menús memorizados.
 */
export const BRUMA: PielSistema = {
  id: 'bruma',
  nombre: 'Tecnia Bruma',
  emoji: '🌫️',
  aparato: 'todo-en-uno',
  forma: 'borde-derecho',
  familiaReal: 'Éste no se parece a ninguno de los cuatro, y a propósito: no te voy a decir dónde está nada.',
  columna: 'Bruma',
  acento: '#f43f5e',
  acentoProfundo: '#881337',
  fondo: 'linear-gradient(160deg, #2b0713 0%, #130308 100%)',
  puntos: [
    {
      id: 'todo-instalado',
      etiqueta: 'Todo lo instalado',
      emoji: '▤',
      zona: 'barra-derecha',
      resuelve: 'abrir',
      queHace: 'Abre la lista completa de programas instalados.',
      resultado:
        'Ahí estaba. Otro sitio, otro nombre, y lo encontraste a la primera mirada: buscaste «dónde se ve todo lo instalado», que es lo que tiene todo sistema.',
    },
    {
      id: 'mis-cosas',
      etiqueta: 'Mis cosas',
      emoji: '📁',
      zona: 'barra-derecha',
      resuelve: 'archivos',
      queHace: 'Abre las carpetas y los archivos guardados en el equipo.',
      resultado:
        'Se llama «Mis cosas» y no «Explorador» ni «Archivos», y hace exactamente lo mismo. El nombre es lo de menos.',
    },
    {
      id: 'mando',
      etiqueta: 'Mando',
      emoji: '🎚️',
      zona: 'barra-derecha',
      alFinal: true,
      resuelve: 'ajustes',
      queHace: 'Abre el panel de volumen, brillo y red.',
      resultado:
        'Volumen, brillo y red. Ningún sistema que hayas visto lo llama «Mando», y aun así supiste dónde buscarlo.',
    },
    {
      id: 'hora-bruma',
      etiqueta: 'Hora',
      emoji: '🕐',
      zona: 'barra-derecha',
      alFinal: true,
      resuelve: null,
      queHace: 'La hora y la fecha. En ningún sistema los ajustes viven dentro del reloj.',
    },
    {
      id: 'ayuda',
      etiqueta: 'Ayuda',
      emoji: '❓',
      zona: 'lienzo',
      resuelve: null,
      queHace: 'Explica cómo se usa este sistema. Podrías leerla… pero no te hace falta: ya sabes qué buscar.',
    },
  ],
};

export const TODAS_LAS_PIELES: readonly PielSistema[] = Object.freeze([...PIELES_COMPARADAS, BRUMA]);

/* ── el juicio ─────────────────────────────────────────────────────────── */

export type MotivoFallo = 'otra-tarea' | 'no-es-eso' | 'no-existe';

export type Veredicto =
  | { acierto: true; linea: string }
  | { acierto: false; motivo: MotivoFallo; linea: string };

/** El punto de esta piel que resuelve esta tarea. `null` si no hay ninguno —
 *  cosa que `validarPieles` no deja pasar, pero la función no da por hecha. */
export function puntoQueResuelve(piel: PielSistema, tarea: TareaId): PuntoSistema | null {
  return piel.puntos.find((p) => p.resuelve === tarea) ?? null;
}

export function buscarPunto(piel: PielSistema, puntoId: string): PuntoSistema | null {
  return piel.puntos.find((p) => p.id === puntoId) ?? null;
}

/**
 * ¿Este toque resuelve esta tarea en esta piel? Función pura: no toca el DOM,
 * no lleva la cuenta de nada y no decide el puntaje — eso es de la clase.
 *
 * Un punto que resuelve OTRA de las tres tareas no se trata igual que uno que
 * no resuelve ninguna: al alumno se le dice que eso también está en la lista,
 * pero que no es lo que se le pidió ahora.
 */
export function juzgarToque(piel: PielSistema, puntoId: string, tarea: TareaId): Veredicto {
  const punto = buscarPunto(piel, puntoId);
  if (!punto) {
    return { acierto: false, motivo: 'no-existe', linea: 'Eso no está en esta pantalla.' };
  }
  if (punto.resuelve === tarea) {
    return { acierto: true, linea: punto.resultado ?? punto.queHace };
  }
  if (punto.resuelve !== null) {
    const otra = TAREAS.find((t) => t.id === punto.resuelve);
    return {
      acierto: false,
      motivo: 'otra-tarea',
      linea: `${punto.queHace} Eso también está en la lista de tareas —«${otra?.nombre ?? 'otra'}»—, pero no es lo que te pedí ahora.`,
    };
  }
  return { acierto: false, motivo: 'no-es-eso', linea: punto.queHace };
}

/* ── la comprobación de coherencia ─────────────────────────────────────── */

/**
 * Comprueba que las pieles están bien escritas: cada una resuelve las tres
 * tareas **exactamente una vez**, ningún punto repite id, y todo punto tiene
 * los textos que su papel exige. Devuelve la lista de problemas — vacía si
 * todo está bien.
 *
 * Existe porque un `resuelve` mal copiado entre dos pieles no lo caza ni el
 * compilador (los dos son `TareaId` válidos) ni una partida que no llegue a
 * esa pantalla. Es la medida, no un comentario.
 */
export function validarPieles(pieles: readonly PielSistema[] = TODAS_LAS_PIELES): string[] {
  const problemas: string[] = [];

  for (const piel of pieles) {
    const vistos = new Set<string>();
    for (const punto of piel.puntos) {
      if (vistos.has(punto.id)) problemas.push(`${piel.id}: el punto «${punto.id}» está dos veces.`);
      vistos.add(punto.id);

      if (punto.queHace.trim() === '') problemas.push(`${piel.id}/${punto.id}: sin «queHace».`);
      if (punto.resuelve !== null && !punto.resultado?.trim()) {
        problemas.push(`${piel.id}/${punto.id}: resuelve «${punto.resuelve}» y no tiene «resultado».`);
      }
      if (punto.resuelve === null && punto.resultado !== undefined) {
        problemas.push(`${piel.id}/${punto.id}: no resuelve nada y trae «resultado».`);
      }
    }

    for (const tarea of TAREAS) {
      const cuantos = piel.puntos.filter((p) => p.resuelve === tarea.id).length;
      if (cuantos !== 1) {
        problemas.push(`${piel.id}: la tarea «${tarea.id}» la resuelven ${cuantos} puntos, y tiene que ser exactamente 1.`);
      }
    }

    if (piel.puntos.filter((p) => p.resuelve === null).length < 1) {
      problemas.push(`${piel.id}: sin ningún punto distractor. El error es media clase.`);
    }
  }

  return problemas;
}

/* ── los pasos ─────────────────────────────────────────────────────────── */

/** 6 encargos + 4 sistemas × 3 tareas + las 3 tareas en el sistema nuevo. */
export const TOTAL_PASOS = ENCARGOS.length + PIELES_COMPARADAS.length * TAREAS.length + TAREAS.length;

export const INSIGNIA = 'ADMINISTRADOR DEL SISTEMA';

/** La frase que resume la clase. Se dice al completar cada fila de la tabla. */
export const LINEA_FILA_COMPLETA = 'Mismo trabajo, otra puerta. Ni mejor ni peor: distinta.';
