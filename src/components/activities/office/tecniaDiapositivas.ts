/**
 * La cinta de Tecnia Diapositivas (§40.5).
 *
 * Misma forma que la de Tecnia Textos y a propósito: los tipos `ControlCinta`,
 * `GrupoCinta` y `Pestana` no dicen una palabra sobre texto —son id, glifo,
 * etiqueta, nombre corto, ancho, inerte y activo—, así que se reutilizan tal
 * cual. Lo único que hubo que abrir fue `PestanaId`, que era la unión cerrada de
 * las siete pestañas de Word (§40.6).
 *
 * La progresión por grado copia la de Word: **Básico 4 pestañas, Intermedio 6,
 * Avanzado 8**. No es simetría bonita: un niño de tercero delante de la cinta
 * entera no ve herramientas, ve ruido, y eso ya está medido en la sala de Word.
 *
 * El Básico empezó con dos —Inicio e Insertar— y creció dos veces el 11-ago-2026,
 * las dos por el mismo motivo y ninguna por gusto:
 *
 *   · `Diseño`, al construir la clase 1: el §27.1 cierra su primera fase
 *     **eligiendo el tema del mazo**, y en PowerPoint de verdad los temas viven
 *     ahí. Las salidas eran meter «Temas» en Inicio —una mentira sobre dónde
 *     está el botón el lunes—, quitarle el tema a la clase, o abrir la pestaña
 *     con un solo grupo.
 *   · `Presentación`, al construir la clase 3: no se enseña a presentar frente
 *     al grupo sin el botón que empieza la presentación.
 *
 * **Manda el programa; la que cede es la simetría.** Y cada vez que el Básico
 * gana una pestaña la gana también el Intermedio, porque un botón no cambia de
 * sitio al subir de grado — eso lo vigila una prueba, no la buena voluntad.
 *
 * Los grupos y su orden salen del temario del §40.2, no de mirar capturas.
 */

import type { ControlCinta, GrupoCinta } from './tecniaTextos';

/** Las pestañas de PowerPoint que esta plataforma llega a enseñar. */
export type PestanaPPT =
  | 'archivo'
  | 'inicio'
  | 'insertar'
  | 'diseno'
  | 'transiciones'
  | 'animaciones'
  | 'presentacion'
  | 'revisar'
  | 'vista'
  | 'formato-imagen'
  | 'formato-forma'
  | 'reproduccion';

export interface PestanaDiapos {
  id: PestanaPPT;
  nombre: string;
  grupos: GrupoCinta[];
  /**
   * Una pestaña **contextual**: sólo existe mientras hay algo seleccionado.
   *
   * Es de PowerPoint y no un invento: seleccionar una imagen hace aparecer
   * «Formato de imagen» a la derecha de todo, con su color propio, y quitar la
   * selección la hace desaparecer. Entró el 11-ago-2026 con §42.2 y resolvió un
   * problema de domicilio que si no se habría resuelto mintiendo: Recortar y
   * Texto alternativo NO viven en Insertar, y meterlos ahí habría dejado dos
   * fichas de guía diciendo dónde no están.
   *
   * `'libre'` = hay un objeto suelto seleccionado (imagen, texto, audio).
   * `'video'` = hay un VIDEO seleccionado, y sólo entonces (§43.3). Hizo falta
   * afinar: «Reproducción» habla de arrancar y de repetir, y aparecer al
   * seleccionar una foto la convertiría en una pestaña que ofrece lo que no
   * puede hacer. El mismo motivo por el que existe `'libre'`, un paso más fino.
   */
  contextual?: 'libre' | 'video' | 'forma';
}

const g = (id: string, nombre: string, controles: ControlCinta[]): GrupoCinta => ({
  id,
  nombre,
  controles,
});

/* ── Básico: dos pestañas ─────────────────────────────────────────────────── */

const INICIO_BASICO: PestanaDiapos = {
  id: 'inicio',
  nombre: 'Inicio',
  grupos: [
    /*
     * «Diapositivas» va PRIMERO y no es capricho: en Word el primer grupo de
     * Inicio es Portapapeles porque lo primero que se hace es escribir, y aquí
     * lo primero que se hace es CREAR UNA DIAPOSITIVA. El orden de la cinta
     * enseña por dónde se empieza.
     */
    g('diapositivas', 'Diapositivas', [
      { id: 'nueva', glifo: '⊞', etiqueta: 'Nueva diapositiva', corto: 'Nueva', ancho: true },
      { id: 'diseno-diapo', glifo: '▤', etiqueta: 'Diseño', ancho: true },
      { id: 'duplicar', glifo: '⧉', etiqueta: 'Duplicar' },
      { id: 'quitar', glifo: '🗑', etiqueta: 'Quitar diapositiva', corto: 'Quitar' },
      /*
       * «Sección» entró el 12-ago-2026 con §44.1, y aquí porque aquí está en
       * PowerPoint: Inicio → Diapositivas, al lado de Nueva y Diseño. La
       * tentación era ponerla en Vista, junto al Clasificador, porque es ahí
       * donde se usan — y habría sido una ficha de guía mintiendo el lunes.
       */
      { id: 'seccion', glifo: '⌗', etiqueta: 'Sección', ancho: true },
    ]),
    g('fuente', 'Fuente', [
      { id: 'negrita', glifo: 'N', etiqueta: 'Negrita' },
      { id: 'cursiva', glifo: 'K', etiqueta: 'Cursiva' },
      { id: 'subrayado', glifo: 'S', etiqueta: 'Subrayado' },
      { id: 'mayor', glifo: 'A▲', etiqueta: 'Agrandar letra' },
      { id: 'menor', glifo: 'A▼', etiqueta: 'Reducir letra' },
      { id: 'color', glifo: 'A', etiqueta: 'Color de letra' },
    ]),
    g('parrafo', 'Párrafo', [
      { id: 'vinetas', glifo: '•≡', etiqueta: 'Viñetas' },
      { id: 'numeros', glifo: '1≡', etiqueta: 'Lista numerada' },
      { id: 'izquierda', glifo: '≡', etiqueta: 'Alinear a la izquierda' },
      { id: 'centro', glifo: '≡', etiqueta: 'Centrar' },
      { id: 'derecha', glifo: '≡', etiqueta: 'Alinear a la derecha' },
    ]),
  ],
};

const INSERTAR_BASICO: PestanaDiapos = {
  id: 'insertar',
  nombre: 'Insertar',
  grupos: [
    g('imagenes', 'Imágenes', [{ id: 'imagen', glifo: '🖼', etiqueta: 'Imagen', ancho: true }]),
    g('texto-grupo', 'Texto', [
      { id: 'cuadro', glifo: '▭', etiqueta: 'Cuadro de texto', corto: 'Cuadro', ancho: true },
    ]),
  ],
};

/**
 * El grupo Texto del Intermedio, con el número de diapositiva.
 *
 * Se separa del Básico porque el pie es de §42.3 y no de primer año: un niño de
 * tercero no necesita numerar sus cuatro diapositivas. Del Intermedio en
 * adelante sí, porque a partir de ahí las presentaciones son largas y alguien
 * del público va a querer preguntar «la seis».
 */
const TEXTO_INTERMEDIO = g('texto-grupo', 'Texto', [
  { id: 'cuadro', glifo: '▭', etiqueta: 'Cuadro de texto', corto: 'Cuadro', ancho: true },
  { id: 'pie', glifo: '#', etiqueta: 'Número de diapositiva', corto: 'Número', ancho: true },
]);

/**
 * La pestaña Diseño del Básico: un solo grupo, y a propósito.
 *
 * Elegir el tema es **un gesto que le cambia la cara a toda la presentación**
 * (§40.2, bloque 12) y es de primer día. `Formato del fondo` y `Tamaño de
 * diapositiva` no lo son: se deciden cuando ya hay algo que enmarcar, y por eso
 * esperan al Intermedio.
 */
const DISENO_BASICO: PestanaDiapos = {
  id: 'diseno',
  nombre: 'Diseño',
  grupos: [
    g('temas', 'Temas', [{ id: 'tema', glifo: '🎨', etiqueta: 'Temas', ancho: true }]),
    /*
     * `Formato del fondo` bajó al Básico el 11-ago-2026, al construir la clase 2:
     * el §27.2 arregla el contraste con **el color de la letra y el del fondo**,
     * decididos por separado, y sin fondo la lección se queda a medias —o peor,
     * obliga a cambiar el tema y con él la cara de las cuatro diapositivas—.
     * `Tamaño de diapositiva` sigue en Intermedio: eso no es de primer año.
     */
    g('personalizar', 'Personalizar', [
      { id: 'fondo', glifo: '▨', etiqueta: 'Formato del fondo', corto: 'Fondo', ancho: true },
    ]),
  ],
};

/**
 * La pestaña Presentación del Básico, con un solo botón.
 *
 * Entró el 11-ago-2026, al construir la clase 3, y con ella el Básico pasó de
 * tres pestañas a cuatro. La simetría de §40.5 —3 · 5 · 8— cede otra vez por el
 * mismo motivo que cedió con Diseño: **manda el programa**. No se puede enseñar
 * a presentar frente al grupo sin el botón que empieza la presentación, y el
 * §27.3 lo nombra con su domicilio exacto, `Presentación → Iniciar`.
 *
 * **Vista Moderador bajó aquí el 11-ago-2026**, al construir
 * `of-ppt-presenta-y-comparte` (§43.1), y es el mismo movimiento que hizo
 * `Formato del fondo`: el tema del Básico es «Presentar y PDF», y no se puede
 * enseñar a presentar mirando al público si el botón que enseña que hay DOS
 * pantallas vive tres grados más arriba. **No cambia de domicilio**, cambia de
 * grado: sigue en `Presentación → Configurar`, con su id, su glifo y su nombre.
 * `Presentación personalizada`, `Ensayar intervalos` y `Grabar` siguen donde
 * estaban.
 *
 * Id, grupo, glifo y etiqueta son **los mismos** en los tres grados, y no por
 * ahorro: si el mismo botón se llamara de dos maneras según el grado, la ficha
 * de la guía diría una cosa en tercero y otra en sexto. Desde hoy eso ya no
 * depende de la disciplina de nadie —los tres grados se derivan uno de otro—.
 */
const PRESENTACION_BASICO: PestanaDiapos = {
  id: 'presentacion',
  nombre: 'Presentación',
  grupos: [
    g('iniciar', 'Iniciar presentación', [
      {
        id: 'desde-principio',
        glifo: '▷',
        etiqueta: 'Desde el principio',
        corto: 'Desde el inicio',
        ancho: true,
      },
    ]),
    g('configurar-presentacion', 'Configurar', [
      { id: 'vista-moderador', glifo: '⧉', etiqueta: 'Vista Moderador', corto: 'Moderador', ancho: true },
      /*
       * «Ocultar diapositiva» está en Configurar y no en Inicio con Duplicar y
       * Quitar, y eso NO es un detalle de cinta: es la lección de §44.1 dicha
       * por el sitio del botón. Duplicar y Quitar cambian el archivo; ocultar
       * cambia **lo que se presenta**, y por eso vive en la pestaña de
       * presentar. Igual que en PowerPoint.
       */
      { id: 'ocultar', glifo: '⊘', etiqueta: 'Ocultar diapositiva', corto: 'Ocultar', ancho: true },
    ]),
  ],
};

/** Ensancha un grupo de una pestaña sin repetir lo que ya trae. */
const ensanchar = (
  pestana: PestanaDiapos,
  mas: Record<string, ControlCinta[]>,
): PestanaDiapos => ({
  ...pestana,
  grupos: pestana.grupos.map((gr) =>
    mas[gr.id] ? { ...gr, controles: [...gr.controles, ...mas[gr.id]] } : gr,
  ),
});

export const CINTA_PPT_BASICO: PestanaDiapos[] = [
  INICIO_BASICO,
  INSERTAR_BASICO,
  DISENO_BASICO,
  PRESENTACION_BASICO,
];

/* ── Intermedio: añade Transiciones, Animaciones y el resto de Diseño ─────── */

export const CINTA_PPT_INTERMEDIO: PestanaDiapos[] = [
  {
    ...INICIO_BASICO,
    grupos: [
      ...INICIO_BASICO.grupos,
      g('dibujo', 'Dibujo', [
        { id: 'formas', glifo: '◇', etiqueta: 'Formas', ancho: true },
        { id: 'organizar', glifo: '⇱', etiqueta: 'Organizar', ancho: true },
      ]),
    ],
  },
  {
    ...INSERTAR_BASICO,
    grupos: [
      INSERTAR_BASICO.grupos[0],
      TEXTO_INTERMEDIO,
      g('ilustraciones', 'Ilustraciones', [
        { id: 'smartart', glifo: '⌗', etiqueta: 'SmartArt', ancho: true },
        { id: 'gráfico', glifo: '▥', etiqueta: 'Gráfico', ancho: true },
        /*
         * El modelo 3D vive en `Insertar → Ilustraciones`, al lado de SmartArt
         * e Iconos, que es donde está en PowerPoint. Entró el 12-ago-2026 con
         * §44.2 y **paga una promesa vieja**: el §40.2 declaró que los modelos
         * 3D se enseñaban dentro de `of-ppt-smartart-y-graficos` y aquella
         * clase se construyó sin un solo encargo de 3D. La justificación era
         * correcta —aquí es donde viven— y no construía nada.
         */
        { id: 'modelo3d', glifo: '◈', etiqueta: 'Modelo 3D', corto: '3D', ancho: true },
      ]),
      g('tablas-diapo', 'Tablas', [{ id: 'tabla', glifo: '▦', etiqueta: 'Tabla', ancho: true }]),
      g('multimedia', 'Multimedia', [
        { id: 'video', glifo: '▶', etiqueta: 'Video', ancho: true },
        { id: 'audio', glifo: '🔊', etiqueta: 'Audio', ancho: true },
      ]),
      g('vinculos', 'Vínculos', [
        { id: 'vinculo', glifo: '🔗', etiqueta: 'Vínculo', ancho: true },
      ]),
    ],
  },
  {
    ...DISENO_BASICO,
    grupos: [
      DISENO_BASICO.grupos[0],
      g('personalizar', 'Personalizar', [
        { id: 'fondo', glifo: '▨', etiqueta: 'Formato del fondo', corto: 'Fondo', ancho: true },
        { id: 'tamano-diapo', glifo: '⬓', etiqueta: 'Tamaño de diapositiva', corto: 'Tamaño', ancho: true },
      ]),
    ],
  },
  {
    id: 'transiciones',
    nombre: 'Transiciones',
    grupos: [
      g('transicion', 'Transición', [
        { id: 'transicion-ninguna', glifo: '—', etiqueta: 'Ninguna', ancho: true },
        { id: 'transicion-desvanecer', glifo: '◐', etiqueta: 'Desvanecer', ancho: true },
        { id: 'transicion-empujar', glifo: '⇥', etiqueta: 'Empujar', ancho: true },
      ]),
      g('intervalos', 'Intervalos', [
        { id: 'duracion', glifo: '⏱', etiqueta: 'Duración', ancho: true },
        { id: 'aplicar-todo', glifo: '⇊', etiqueta: 'Aplicar a todo', corto: 'A todo', ancho: true },
      ]),
    ],
  },
  {
    id: 'animaciones',
    nombre: 'Animaciones',
    grupos: [
      g('animacion', 'Animación', [
        { id: 'anim-aparecer', glifo: '✦', etiqueta: 'Aparecer', ancho: true },
        { id: 'anim-enfasis', glifo: '◎', etiqueta: 'Énfasis', ancho: true },
        { id: 'anim-salir', glifo: '✧', etiqueta: 'Salir', ancho: true },
      ]),
      g('anim-avanzada', 'Animación avanzada', [
        { id: 'panel-animacion', glifo: '☰', etiqueta: 'Panel de animación', corto: 'Panel', ancho: true },
      ]),
    ],
  },
  /*
   * «Formato de imagen» es CONTEXTUAL: no cuenta como una de las seis pestañas
   * del grado porque no está puesta, aparece. Vive aquí y no en Insertar
   * porque en el programa de verdad vive aquí, y una guía que diga «Insertar →
   * Recortar» estaría enseñando un domicilio falso (§36.12).
   */
  {
    id: 'formato-imagen',
    nombre: 'Formato de imagen',
    contextual: 'libre',
    grupos: [
      g('tamano-imagen', 'Tamaño', [
        { id: 'recortar', glifo: '⌗', etiqueta: 'Recortar', ancho: true },
      ]),
      g('accesibilidad', 'Accesibilidad', [
        { id: 'texto-alt', glifo: '🏷', etiqueta: 'Texto alternativo', corto: 'Texto alt.', ancho: true },
      ]),
    ],
  },
  /*
   * «Formato de forma», la contextual de una forma dibujada (§44.2).
   *
   * Es una pestaña APARTE de «Formato de imagen» y no un grupo dentro de ella,
   * porque en PowerPoint son dos pestañas distintas y porque enseñan cosas
   * distintas: una foto se recorta, una forma se rellena. Meter Relleno en la
   * de imagen habría dejado a la ficha de guía diciendo que el relleno vive en
   * «Formato de imagen», que es falso el lunes.
   *
   * Y de paso empieza a pagar la deuda de §43.3.6 D: un SmartArt seleccionado
   * enseñaba «Formato de imagen», que tampoco es donde vive lo suyo. Esta
   * pestaña no lo arregla —eso es de la clase de SmartArt— pero deja el camino
   * abierto: `contextual` ya sabe distinguir por clase de objeto.
   */
  {
    id: 'formato-forma',
    nombre: 'Formato de forma',
    contextual: 'forma',
    grupos: [
      /*
       * Sólo un grupo, y `Organizar` NO está aquí aunque en PowerPoint también
       * salga en esta pestaña: ya vive en `Inicio → Dibujo` desde §42.3, un
       * control no puede salir dos veces —lo vigila la prueba de duplicados de
       * §40— y de las dos casas manda la que ya existe. Es la misma regla que
       * §43.5 aplicó a Formas.
       */
      g('estilos-forma', 'Estilos de forma', [
        { id: 'relleno', glifo: '🪣', etiqueta: 'Relleno de forma', corto: 'Relleno', ancho: true },
        { id: 'contorno', glifo: '▢', etiqueta: 'Contorno de forma', corto: 'Contorno', ancho: true },
      ]),
    ],
  },
  /*
   * «Reproducción», la contextual del video (§43.3). Un solo control, y no es
   * una pestaña a medio hacer: en PowerPoint esta pestaña tiene una fila entera
   * de cosas que aquí no existirían más que como botones muertos —recortar el
   * video, subirle el volumen, ponerle marcadores—. Un botón que no hace nada
   * enseña un domicilio y luego lo desmiente. Cuando haga falta otro, cabe.
   */
  {
    id: 'reproduccion',
    nombre: 'Reproducción',
    contextual: 'video',
    grupos: [
      g('opciones-video', 'Opciones de video', [
        { id: 'al-clic', glifo: '👆', etiqueta: 'Al hacer clic', corto: 'Al clic', ancho: true },
      ]),
    ],
  },
  /*
   * La pestaña Presentación también en Intermedio, y no por simetría: la regla
   * de la casa es que **un botón no cambia de sitio al subir de grado**, y en
   * cuanto el Básico estrenó `Desde el principio` para la clase 3, dejarlo
   * fuera del Intermedio habría hecho desaparecer del programa una herramienta
   * que el alumno ya sabe usar. Lo cazó la prueba de contención de la cinta, no
   * la lectura. `Ensayar intervalos` entra aquí porque es la pareja del grupo
   * Intervalos de Transiciones, que también es de este grado.
   */
  /*
   * Presentación tampoco se escribe aquí desde el 11-ago-2026: se ENSANCHA la
   * del Básico, por el mismo motivo por el que el Avanzado ensancha ésta. Antes
   * estaba escrita a mano y repetía `desde-principio`; la disciplina aguantó
   * dos clases y se rompió a la tercera, cuando `Vista Moderador` bajó de grado
   * y este bloque no se enteró. Lo que se deriva no se escribe.
   */
  ensanchar(PRESENTACION_BASICO, {
    'configurar-presentacion': [
      { id: 'ensayar', glifo: '⏲', etiqueta: 'Ensayar intervalos', corto: 'Ensayar', ancho: true },
    ],
  }),
];

/* ── Avanzado: añade Presentación y Vista, y Revisar con comentarios ──────── */

export const CINTA_PPT_AVANZADO: PestanaDiapos[] = [
  /*
   * Presentación ya no se AÑADE aquí: se ENSANCHA la del Intermedio. Escrita de
   * cero, el Avanzado repetía `desde-principio` y `ensayar` —el mismo botón con
   * dos domicilios—, y eso es lo que la prueba de duplicados lleva desde el §40
   * vigilando: un control que sale dos veces es una ficha de guía que no sabe
   * qué contestar.
   */
  /*
   * Inicio también se ensancha, y sólo aquí: «Restablecer» le devuelve a la
   * diapositiva lo que dice el patrón, y sin patrón —o sea en Básico y en
   * Intermedio, donde esa vista no existe— sería un botón que no puede
   * significar nada. Entra con la clase que lo enseña (§43.4).
   */
  ensanchar(CINTA_PPT_INTERMEDIO.find((p) => p.id === 'inicio')!, {
    diapositivas: [
      { id: 'restablecer', glifo: '↺', etiqueta: 'Restablecer', ancho: true },
      /*
       * Los dos atajos para NO hacer una diapositiva dos veces (§44.5). Viven
       * en `Inicio → Diapositivas` porque es donde están en PowerPoint —dentro
       * del menú de «Nueva diapositiva», que aquí no existe— y no en Insertar,
       * que es donde el documento los había colocado de memoria. Manda el
       * programa: una entrada que promete un domicilio falso es el defecto de
       * §36.12 y se paga el día que el alumno abra el de verdad.
       */
      { id: 'reutilizar', glifo: '♻', etiqueta: 'Reutilizar diapositivas', corto: 'Reutilizar', ancho: true },
      { id: 'esquema-word', glifo: '≣', etiqueta: 'Diapositivas del esquema', corto: 'Del esquema', ancho: true },
    ],
  }),
  ...CINTA_PPT_INTERMEDIO.filter((p) => p.id !== 'presentacion' && p.id !== 'inicio').map((p) =>
    /*
     * El Zoom de resumen entra en `Insertar → Vínculos`, al lado del vínculo
     * que §43.5 enseñó a poner a mano — y esa vecindad es media lección: son
     * la misma idea, uno escrito por ti y otro armado por el programa.
     */
    p.id === 'insertar'
      ? ensanchar(p, {
          vinculos: [
            { id: 'zoom-resumen', glifo: '⊞', etiqueta: 'Zoom de resumen', corto: 'Zoom', ancho: true },
          ],
        })
      : p,
  ),
  ensanchar(CINTA_PPT_INTERMEDIO.find((p) => p.id === 'presentacion')!, {
    iniciar: [
      { id: 'personalizada', glifo: '⌸', etiqueta: 'Presentación personalizada', corto: 'Personalizada', ancho: true },
    ],
    'configurar-presentacion': [
      { id: 'grabar', glifo: '⏺', etiqueta: 'Grabar presentación', corto: 'Grabar', ancho: true },
      /*
       * Al lado de Grabar, que es donde está en PowerPoint —dentro del propio
       * menú de grabación— y donde hay que encontrarlo: se busca justo después
       * de haber grabado, cuando resulta que sí vas a poder ir tú.
       */
      { id: 'quitar-narracion', glifo: '🔇', etiqueta: 'Quitar la narración', corto: 'Sin voz', ancho: true },
    ],
  }),
  {
    id: 'revisar',
    nombre: 'Revisar',
    grupos: [
      g('revision-diapo', 'Revisión', [
        { id: 'ortografia', glifo: '✓ᴬ', etiqueta: 'Ortografía', ancho: true },
      ]),
      g('comentarios-diapo', 'Comentarios', [
        { id: 'comentario', glifo: '💬', etiqueta: 'Nuevo comentario', corto: 'Comentario', ancho: true },
      ]),
    ],
  },
  {
    id: 'vista',
    nombre: 'Vista',
    grupos: [
      g('vistas', 'Vistas de presentación', [
        { id: 'vista-normal', glifo: '▣', etiqueta: 'Normal', ancho: true },
        { id: 'vista-clasificador', glifo: '⊞', etiqueta: 'Clasificador de diapositivas', corto: 'Clasificador', ancho: true },
        { id: 'vista-notas', glifo: '▤', etiqueta: 'Página de notas', corto: 'Notas', ancho: true },
        { id: 'vista-lectura', glifo: '▭', etiqueta: 'Vista de lectura', corto: 'Lectura', ancho: true },
      ]),
      /*
       * Los tres patrones juntos y en este orden, que es el de PowerPoint: el de
       * la pantalla primero y los dos de papel después. Verlos en el mismo grupo
       * es media lección de §44.4 — **las hojas también tienen molde**, y nadie
       * lo sabe porque nadie abre este menú.
       */
      /*
       * Los tres cortos empiezan por «De» y no por el nombre pelado, y eso salió
       * mirando la captura: bajo el rótulo «Patrones», un botón que pone «Notas»
       * está a cuatro centímetros de otro que pone «Notas» en «Vistas de
       * presentación», y son cosas distintas —la página y su molde—. Con «De
       * notas» los dos grupos se leen como una frase y no hay dos botones con el
       * mismo nombre en la misma pestaña.
       */
      g('patrones', 'Patrones', [
        { id: 'patron', glifo: '⌘', etiqueta: 'Patrón de diapositivas', corto: 'De diapositivas', ancho: true },
        { id: 'patron-documentos', glifo: '▦', etiqueta: 'Patrón de documentos', corto: 'De documentos', ancho: true },
        { id: 'patron-notas', glifo: '▤', etiqueta: 'Patrón de notas', corto: 'De notas', ancho: true },
      ]),
    ],
  },
];

/** Los tamaños de letra de una diapositiva. No son los de un documento. */
export const TAMANOS_DIAPO = [12, 16, 18, 20, 24, 28, 32, 40, 44, 54, 60] as const;

/**
 * Por qué estos y no los de Word: en una hoja un texto normal va a 11 o 12 pt y
 * el título a 16; en una diapositiva que se ve **desde el fondo del salón** el
 * cuerpo empieza en 18 y el título ronda los 40. Heredar la lista de Word haría
 * que «agrandar la letra» diera un resultado que sigue sin leerse — y la lección
 * de §27.2 se caería sola.
 */
export const TAMANO_BASE_DIAPO: Record<string, number> = {
  titulo: 40,
  subtitulo: 24,
  cuerpo: 24,
  'cuerpo-2': 24,
  imagen: 18,
};
