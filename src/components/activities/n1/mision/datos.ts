/**
 * Misión: Aprende Computación — datos y textos del juego.
 *
 * Transcripción VERBATIM del prototipo de referencia (app.js). Único cambio
 * autorizado por el cliente: el robot "BYTE" se llama "BIT" en los textos
 * visibles/hablados (el diseño visual queda idéntico).
 *
 * Las cadenas plantilla usan marcadores {nombre}, {descripcion}, {mensaje},
 * {n}, {tiempo} u {objetivo}; cada una está comentada con su origen.
 */

// ─── Módulos ──────────────────────────────────────────────────────────────────

export interface ModuloDef {
  indice: number;
  icono: string;
  titulo: string;
  resumen: string;
  /** Objetivo inicial (paso 0) que muestra el HUD al cargar el módulo. */
  objetivo: string;
  insignia: string;
  /** Total de pasos del módulo (totals de getModuleProgress). */
  total: number;
  /** Mensaje que dice Bit al cargar el módulo (say() en loadModule/openOS). */
  saludo: string;
  /** Texto de giveHint del módulo (plantillas comentadas por campo). */
  pista: string;
}

/**
 * Port del array MODULES + totals [6,6,4,3,4,4,10] de getModuleProgress.
 * - objetivo: getObjectiveText() con el módulo recién cargado (paso 0).
 * - saludo: say() de loadModule (módulos 0-3 y 6) u openOS (módulos 4-5).
 * - pista: giveHint(); los módulos 0-2 y 6 interpolan (ver marcadores);
 *   en 3 el núcleo usa SECUENCIA_ENCENDIDO[paso].mensaje y en 4-5 el
 *   objetivo del paso actual (giveHint cae en getObjectiveText()).
 */
export const MODULOS: ModuloDef[] = [
  {
    indice: 0,
    icono: '🖥️',
    titulo: 'Conoce las partes',
    resumen: 'Identifica los dispositivos externos de una computadora.',
    objetivo: 'Selecciona: Monitor.',
    insignia: 'Explorador tecnológico',
    total: 6,
    // Plantilla: {nombre} = nombre del estudiante.
    saludo: 'Bienvenido, {nombre}. Observa la estación y selecciona el monitor.',
    // Plantilla: {nombre} = pieza esperada de SECUENCIA_EXTERNA.
    pista: 'Busca {nombre}. Los objetos se iluminan al pasar el cursor.'
  },
  {
    indice: 1,
    icono: '🧠',
    titulo: 'Dentro del gabinete',
    resumen: 'Descubre para qué sirven las piezas internas.',
    objetivo: 'Encuentra: Tarjeta madre.',
    insignia: 'Experto en componentes',
    total: 6,
    saludo: 'El gabinete está abierto de forma segura. Selecciona la tarjeta madre.',
    // Plantilla: {nombre} = pieza esperada de SECUENCIA_INTERNA.
    pista: 'Busca {nombre} dentro del gabinete transparente.'
  },
  {
    indice: 2,
    icono: '🔌',
    titulo: 'Conecta el equipo',
    resumen: 'Une cada cable con el puerto correcto.',
    objetivo: 'Selecciona el cable de video.',
    insignia: 'Maestro de las conexiones',
    total: 4,
    saludo: 'Selecciona primero el cable de video. Después elige su puerto correcto.',
    // Plantilla sin cable elegido: {nombre} = nombre del cable esperado.
    // Con cable elegido el núcleo usa TEXTOS['pista-conexion-cable-seleccionado'].
    pista: 'El {nombre} está alineado sobre la mesa.'
  },
  {
    indice: 3,
    icono: '⏻',
    titulo: 'Enciende con seguridad',
    resumen: 'Sigue el orden correcto para iniciar la computadora.',
    objetivo: 'Primero enciende el regulador.',
    insignia: 'Encendido perfecto',
    total: 3,
    saludo: 'Antes de encender, revisamos las conexiones. Todo está listo: enciende el regulador.',
    // giveHint usa el mensaje del paso actual de SECUENCIA_ENCENDIDO.
    pista: 'Primero enciende el regulador.'
  },
  {
    indice: 4,
    icono: '🪟',
    titulo: 'Explora EduOS',
    resumen: 'Abre, minimiza, restaura y cierra ventanas.',
    objetivo: 'Abre Mis archivos con doble clic.',
    insignia: 'Navegante digital',
    total: 4,
    saludo: 'Bienvenido a EduOS. Haz doble clic en Mis archivos.',
    // giveHint usa el objetivo del paso actual (TEXTOS['os-nav-objetivo-*']).
    pista: 'Abre Mis archivos con doble clic.'
  },
  {
    indice: 5,
    icono: '📝',
    titulo: 'Utiliza programas',
    resumen: 'Escribe, dibuja, calcula y organiza archivos.',
    objetivo: 'Crea y guarda un texto.',
    insignia: 'Creador de documentos',
    total: 4,
    saludo: 'Comenzaremos con Texto Fácil. Abre el programa, escribe una oración y guárdala.',
    // giveHint usa el objetivo del paso actual (TEXTOS['os-apps-objetivo-*']).
    pista: 'Crea y guarda un texto.'
  },
  {
    indice: 6,
    icono: '🏆',
    titulo: 'Misión final',
    resumen: 'Demuestra todo lo aprendido sin ayuda constante.',
    objetivo: 'Selecciona el monitor.',
    insignia: 'Técnico principiante',
    total: 10,
    saludo: 'Misión final: identifica el monitor, el teclado y el ratón. Tendrás tres pistas disponibles.',
    // Plantilla: {n} = mín(pistas usadas, 3); {objetivo} = TEXTOS['final-objetivo-*'].
    pista: 'Pista {n}/3: {objetivo}'
  }
];

// ─── Secuencias de piezas ─────────────────────────────────────────────────────

export interface ParteDef {
  key: string;
  nombre: string;
  descripcion: string;
}

/** Port de externalSequence (módulo 0). */
export const SECUENCIA_EXTERNA: ParteDef[] = [
  { key: 'monitor', nombre: 'Monitor', descripcion: 'Muestra imágenes, textos, videos y todo lo que hacemos en la computadora.' },
  { key: 'keyboard', nombre: 'Teclado', descripcion: 'Permite escribir letras, números y utilizar diferentes comandos.' },
  { key: 'mouse', nombre: 'Ratón', descripcion: 'Mueve el puntero, selecciona objetos y abre programas.' },
  { key: 'tower', nombre: 'Gabinete', descripcion: 'Protege y reúne los componentes principales de la computadora.' },
  { key: 'printer', nombre: 'Impresora', descripcion: 'Convierte documentos e imágenes digitales en copias sobre papel.' },
  { key: 'regulator', nombre: 'Regulador', descripcion: 'Ayuda a proteger el equipo y distribuye la energía eléctrica.' }
];

/** Port de internalSequence (módulo 1). */
export const SECUENCIA_INTERNA: ParteDef[] = [
  { key: 'motherboard', nombre: 'Tarjeta madre', descripcion: 'Conecta las piezas y permite que trabajen juntas.' },
  { key: 'cpu', nombre: 'Procesador', descripcion: 'Es como el cerebro: interpreta instrucciones y realiza operaciones.' },
  { key: 'ram', nombre: 'Memoria RAM', descripcion: 'Es el espacio de trabajo temporal de los programas abiertos.' },
  { key: 'ssd', nombre: 'Almacenamiento SSD', descripcion: 'Guarda programas, documentos, imágenes y otros archivos.' },
  { key: 'psu', nombre: 'Fuente de poder', descripcion: 'Convierte y distribuye energía a los componentes internos.' },
  { key: 'fan', nombre: 'Ventilador', descripcion: 'Ayuda a mantener una temperatura adecuada dentro del gabinete.' }
];

// ─── Conexiones (módulo 2) ────────────────────────────────────────────────────

export interface ConexionDef {
  cable: string;
  puerto: string;
  color: number;
  /** Nombre del cable tal como aparece en los mensajes ("label" original). */
  nombre: string;
}

/**
 * Port de connectionSequence. El dispositivo destino de cada cable
 * ("device" original) vive en TEXTOS['dispositivo-<cable>'].
 */
export const SECUENCIA_CONEXIONES: ConexionDef[] = [
  { cable: 'cable-video', puerto: 'port-video', color: 0x56b8ff, nombre: 'cable de video' },
  { cable: 'cable-keyboard', puerto: 'port-keyboard', color: 0x62e6a5, nombre: 'cable del teclado' },
  { cable: 'cable-mouse', puerto: 'port-mouse', color: 0xffd25a, nombre: 'cable del ratón' },
  { cable: 'cable-power', puerto: 'port-power', color: 0xff7183, nombre: 'cable de corriente' }
];

// ─── Encendido (módulo 3) ─────────────────────────────────────────────────────

export interface PasoEncendido {
  key: string;
  mensaje: string;
}

/** Port de powerSequence. */
export const SECUENCIA_ENCENDIDO: PasoEncendido[] = [
  { key: 'power-regulator', mensaje: 'Primero enciende el regulador.' },
  { key: 'power-monitor', mensaje: 'Ahora enciende el monitor.' },
  { key: 'power-tower', mensaje: 'Presiona una sola vez el botón del gabinete.' }
];

// ─── Textos fijos restantes ───────────────────────────────────────────────────

/**
 * Todas las demás cadenas visibles/habladas de app.js que la lógica usa,
 * con clave kebab-case y comentario de origen. Las plantillas llevan
 * marcadores {nombre}, {descripcion}, {mensaje}, {n}, {tiempo}, {objetivo}.
 */
export const TEXTOS: Record<string, string> = {
  // ── Inicio de partida ──
  // beginGame: nombre por defecto cuando el campo queda vacío.
  'nombre-default': 'Estudiante',

  // ── HUD (updateHUD) ──
  // updateHUD: eyebrow del módulo 6.
  'hud-evaluacion-final': 'EVALUACIÓN FINAL',
  // updateHUD y renderModuleCards: {n} = índice de módulo + 1.
  'modulo-numero': 'MÓDULO {n}',
  // renderModuleCards: etiqueta de la tarjeta del módulo 6.
  'tarjeta-evaluacion': 'EVALUACIÓN',

  // ── Objetivos dinámicos (getObjectiveText) ──
  // Módulo 0: {nombre} = pieza de SECUENCIA_EXTERNA del paso actual.
  'objetivo-selecciona': 'Selecciona: {nombre}.',
  // Módulo 1: {nombre} = pieza de SECUENCIA_INTERNA del paso actual.
  'objetivo-encuentra': 'Encuentra: {nombre}.',
  // Módulos 0 y 1: objetivo al terminar la secuencia.
  'objetivo-modulo-completado': 'Módulo completado.',
  // Módulo 2 con cable elegido: {nombre} = nombre del cable.
  'objetivo-conecta-cable': 'Conecta el {nombre} al puerto correcto.',
  // Módulo 2 sin cable elegido: {nombre} = nombre del cable.
  'objetivo-selecciona-cable': 'Selecciona el {nombre}.',
  // Módulo 2: objetivo al terminar las conexiones.
  'objetivo-conexiones-completadas': 'Conexiones completadas.',
  // Módulo 3: objetivo al terminar el encendido.
  'objetivo-encendido-completado': 'Encendido completado.',
  // Módulo 4: objetivos por paso (osStep 0..3) + cierre.
  'os-nav-objetivo-0': 'Abre Mis archivos con doble clic.',
  'os-nav-objetivo-1': 'Minimiza la ventana.',
  'os-nav-objetivo-2': 'Restáurala desde la barra de tareas.',
  'os-nav-objetivo-3': 'Cierra la ventana.',
  'os-nav-objetivo-fin': 'Exploración completada.',
  // Módulo 5: objetivos por paso (osStep 0..3) + cierre.
  'os-apps-objetivo-0': 'Crea y guarda un texto.',
  'os-apps-objetivo-1': 'Realiza un dibujo.',
  'os-apps-objetivo-2': 'Resuelve 2 + 3.',
  'os-apps-objetivo-3': 'Crea y renombra una carpeta.',
  'os-apps-objetivo-fin': 'Programas completados.',

  // ── Módulos 0 y 1: identificación de piezas ──
  // handleSequenceClick (incorrecto): {nombre} = pieza esperada.
  'error-secuencia': 'Ese no es {nombre}. Observa su forma y vuelve a intentarlo.',
  // handleSequenceClick (correcto): {descripcion} = descripción de la pieza.
  'correcto-descripcion': '¡Correcto! {descripcion}',
  // showInfo: etiqueta de la tarjeta en el módulo 0.
  'tag-dispositivo': 'DISPOSITIVO',
  // showInfo: etiqueta de la tarjeta en el módulo 1.
  'tag-componente-interno': 'COMPONENTE INTERNO',
  // advanceAfterInfo: {nombre} = siguiente pieza de la secuencia.
  'avanza-selecciona': 'Muy bien. Ahora selecciona {nombre}.',

  // ── Módulo 2: conexiones ──
  // handleConnectionClick: clic fuera de los cables sin cable elegido.
  'error-conexion-no-cable': 'Primero selecciona uno de los cables sobre la mesa.',
  // handleConnectionClick: cable equivocado; {nombre} = cable esperado.
  'error-conexion-cable-equivocado': 'Busca el {nombre}. Los colores ayudan a distinguirlo.',
  // handleConnectionClick: cable correcto; {nombre} = dispositivo destino
  // (TEXTOS['dispositivo-<cable>']).
  'conexion-cable-seleccionado': 'Cable seleccionado. Busca el puerto para {nombre}.',
  // handleConnectionClick: clic fuera de los puertos con cable en mano.
  'error-conexion-no-puerto': 'Ahora selecciona un puerto del gabinete.',
  // handleConnectionClick: puerto equivocado.
  'error-conexion-puerto-equivocado': 'Ese conector no corresponde. Observa su forma y busca otro puerto.',
  // handleConnectionClick: toast al conectar bien.
  'toast-conexion-correcta': 'Conexión correcta',
  // handleConnectionClick: {nombre} = siguiente cable de la secuencia.
  'conexion-siguiente': 'Excelente. Ahora selecciona el {nombre}.',
  // connectionSequence: dispositivo destino de cada cable ("device" original).
  'dispositivo-cable-video': 'monitor',
  'dispositivo-cable-keyboard': 'teclado',
  'dispositivo-cable-mouse': 'ratón',
  'dispositivo-cable-power': 'gabinete',
  // giveHint módulo 2 con cable elegido: {nombre} = nombre del cable.
  'pista-conexion-cable-seleccionado': 'El puerto correcto tiene el mismo color educativo que el {nombre}.',

  // ── Módulo 3: encendido ──
  // handlePowerClick (botón equivocado): {mensaje} = mensaje del paso esperado.
  'error-encendido': 'Todavía no. {mensaje}',
  // bootAnimation: locución al presionar el botón del gabinete.
  'encendido-arranque': 'Perfecto. Presionaste una sola vez. El sistema está iniciando…',

  // ── Módulo 6: misión final ──
  // finalObjective: objetivo por etapa (finalStage 0..9).
  'final-objetivo-0': 'Selecciona el monitor.',
  'final-objetivo-1': 'Selecciona el teclado.',
  'final-objetivo-2': 'Selecciona el ratón.',
  'final-objetivo-3': 'Conecta el cable de video.',
  'final-objetivo-4': 'Enciende el regulador.',
  'final-objetivo-5': 'Enciende el monitor.',
  'final-objetivo-6': 'Enciende el gabinete.',
  'final-objetivo-7': 'Abre Texto Fácil.',
  'final-objetivo-8': 'Escribe una frase.',
  'final-objetivo-9': 'Guarda el documento.',
  // handleFinalClick (identificación incorrecta): {nombre} = pieza esperada.
  'final-error-identifica': 'Busca {nombre}.',
  // handleFinalClick: toast por identificación correcta.
  'toast-identificacion-correcta': 'Identificación correcta',
  // handleFinalClick: al completar las tres identificaciones.
  'final-conecta-video': 'Ahora conecta el cable de video al puerto azul.',
  // handleFinalClick: {nombre} = siguiente pieza a identificar.
  'final-siguiente-identifica': 'Correcto. Ahora selecciona {nombre}.',
  // handleFinalClick: clic incorrecto buscando el cable de video.
  'final-error-cable-video': 'Selecciona el cable de video.',
  // handleFinalClick: cable de video en mano.
  'final-puerto-video': 'Ahora selecciona el puerto de video.',
  // handleFinalClick: puerto incorrecto.
  'final-error-puerto-video': 'Ese no es el puerto de video.',
  // handleFinalClick: conexión hecha, pasa al encendido.
  'final-enciende-regulador': 'Enciende el regulador.',
  // handleFinalClick: encendido completo, pasa a EduOS.
  'final-entra-eduos': 'El equipo está listo. Entra a EduOS y guarda una frase en Texto Fácil.',

  // ── EduOS: instrucciones de la topbar (#osInstruction) ──
  // openOS('navigation') y transiciones de openApp/minimize/restore.
  'os-nav-instruccion-0': 'Haz doble clic en “Mis archivos”.',
  'os-nav-instruccion-1': 'Minimiza la ventana con el botón “—”.',
  'os-nav-instruccion-2': 'Restaura la ventana desde la barra de tareas.',
  'os-nav-instruccion-3': 'Cierra la ventana con el botón “×”.',
  // openOS('apps') y transiciones al guardar texto/dibujo/cálculo.
  'os-apps-instruccion-0': 'Abre Texto Fácil y guarda una oración.',
  'os-apps-instruccion-1': 'Abre Arte Digital y realiza un dibujo.',
  'os-apps-instruccion-2': 'Abre Calculadora y resuelve 2 + 3.',
  'os-apps-instruccion-3': 'Abre Mis archivos, crea una carpeta y cámbiale el nombre.',
  // openOS('final'), openApp final y textarea con frase suficiente.
  'os-final-instruccion-0': 'Abre Texto Fácil.',
  'os-final-instruccion-1': 'Escribe una frase completa.',
  'os-final-instruccion-2': 'Guarda el documento.',

  // ── EduOS: locuciones de pasos ──
  // openApp (navigation, paso 0→1).
  'os-nav-voz-1': 'Muy bien. Ahora minimiza la ventana.',
  // minimizeWindow (navigation, paso 1→2).
  'os-nav-voz-2': 'La ventana sigue abierta. Recupérala desde la barra de tareas.',
  // restoreWindow (navigation, paso 2→3).
  'os-nav-voz-3': 'Perfecto. Ahora cierra la ventana.',
  // renderTextEditor guardar (apps, paso 0→1).
  'os-apps-voz-1': 'Documento guardado. Ahora abre Arte Digital y crea un dibujo.',
  // renderPaint guardar (apps, paso 1→2).
  'os-apps-voz-2': '¡Dibujo guardado! Ahora utiliza la calculadora.',
  // renderCalculator resultado 5 (apps, paso 2→3).
  'os-apps-voz-3': 'Resultado correcto. Falta organizar una carpeta en Mis archivos.',

  // ── EduOS: errores de misión (incorrectOS en openApp) ──
  'os-error-abre-archivos': 'La misión indica abrir Mis archivos.',
  'os-error-abre-texto': 'Primero abre Texto Fácil.',
  'os-error-abre-paint': 'Ahora abre Arte Digital.',
  'os-error-abre-calc': 'Ahora abre Calculadora.',
  'os-error-abre-archivos-final': 'Por último abre Mis archivos.',
  'os-error-abre-texto-final': 'Abre Texto Fácil para completar la evaluación.',

  // ── EduOS: varios ──
  // openApp('trash'): toast.
  'os-papelera-vacia': 'La papelera está vacía.',
  // botón ◈ de la taskbar (bindUI): toast.
  'os-menu-toast': 'Menú EduOS: selecciona una aplicación del escritorio.',
  // exitOS: locución al salir en módulos 4 y 5.
  'os-salir': 'Puedes volver al escritorio desde el módulo cuando quieras.',
  // openApp: meta de las ventanas (icono y título de cada app).
  'app-icono-files': '📁',
  'app-nombre-files': 'Mis archivos',
  'app-icono-text': '📝',
  'app-nombre-text': 'Texto Fácil',
  'app-icono-paint': '🎨',
  'app-nombre-paint': 'Arte Digital',
  'app-icono-calc': '🧮',
  'app-nombre-calc': 'Calculadora Escolar',
  // openApp: glifos de los controles de ventana.
  'ventana-minimizar': '—',
  'ventana-maximizar': '□',
  'ventana-cerrar': '×',

  // ── Texto Fácil (renderTextEditor) ──
  // Botones de la barra del editor.
  'editor-toolbar-negrita': 'B',
  'editor-toolbar-cursiva': 'I',
  'editor-toolbar-tamano': '12 px',
  'editor-toolbar-deshacer': '↶',
  // placeholder del textarea.
  'editor-placeholder': 'Escribe aquí…',
  // Contador de palabras: {n} = número de palabras.
  'editor-palabras': '{n} palabras',
  // Botón de guardado.
  'editor-guardar': '💾 Guardar documento',
  // incorrectOS: frase demasiado corta (< 8 caracteres).
  'os-error-texto-corto': 'Escribe una oración un poco más completa antes de guardar.',
  // Nombre del archivo guardado: {n} = número consecutivo.
  'archivo-documento': 'Documento {n}.txt',
  // Toast al guardar el documento.
  'toast-documento-guardado': 'Documento guardado',

  // ── Arte Digital (renderPaint) ──
  // aria-label del selector de color.
  'paint-color-aria': 'Color',
  'paint-pincel': '🖌️',
  'paint-borrador': '🧽',
  'paint-limpiar': 'Limpiar',
  'paint-guardar': '💾 Guardar',
  // incorrectOS: menos de 5 trazos al guardar.
  'os-error-dibujo-vacio': 'Realiza algunos trazos antes de guardar.',
  // Toast al guardar el dibujo.
  'toast-dibujo-guardado': 'Dibujo guardado',

  // ── Calculadora (renderCalculator) ──
  // Teclas en orden de cuadrícula (separadas por coma; la última es el punto).
  'calc-teclas': 'C,⌫,÷,×,7,8,9,−,4,5,6,+,1,2,3,=,0,.',
  // Pantalla ante expresión inválida.
  'calc-error': 'Error',
  // Toast al resolver 2 + 3.
  'toast-calculo-correcto': '2 + 3 = 5',

  // ── Mis archivos (renderFiles) ──
  'archivos-nueva-carpeta': '＋ Nueva carpeta',
  'archivos-subtitulo': 'Documentos del estudiante',
  // Archivos decorativos fijos de la cuadrícula.
  'archivos-ejemplo-png': 'Ejemplo.png',
  'archivos-bienvenida-txt': 'Bienvenida.txt',
  // prompt de nueva carpeta y su valor por defecto.
  'prompt-nueva-carpeta': 'Nombre de la nueva carpeta:',
  'prompt-nueva-carpeta-default': 'Mi trabajo',
  // Nombre de respaldo si el nombre queda vacío.
  'carpeta-default': 'Nueva carpeta',
  // Toast al crear carpeta.
  'toast-carpeta-creada': 'Carpeta creada. Haz doble clic para renombrarla.',
  // prompt al renombrar con doble clic.
  'prompt-renombrar': 'Nuevo nombre:',

  // ── Módulo completado (completeModule) ──
  // Locución: {nombre} = insignia del módulo.
  'modulo-completado-voz': '¡Módulo completado! Obtuviste la insignia “{nombre}”.',
  // Toast: {nombre} = insignia del módulo.
  'toast-modulo-completado': '+3 estrellas · {nombre}',

  // ── Pantalla de cierre (showCompletion) ──
  // Etiquetas de las métricas.
  'stat-estrellas': 'Estrellas',
  'stat-modulos': 'Módulos',
  'stat-errores': 'Errores',
  'stat-tiempo': 'Tiempo',
  // completionCopy: {nombre} = nombre del estudiante.
  'final-copy': '{nombre}, ya puedes reconocer, conectar, encender y utilizar una computadora con mayor seguridad.',

  // ── Sonido (toggleSound) ──
  'toast-sonido-activado': 'Sonido activado',
  'toast-sonido-desactivado': 'Sonido desactivado',
  'icono-sonido-on': '🔊',
  'icono-sonido-off': '🔇',

  // ── Panel docente (showTeacherPanel) ──
  'docente-sin-nombre': 'Sin nombre',
  'stat-estudiante': 'Estudiante',
  'stat-progreso': 'Progreso',
  // Fila por módulo: {tiempo} = formatTime(segundos).
  'docente-completado-en': 'Completado en {tiempo}',
  'estado-pendiente': 'Pendiente',
  'estado-completado': 'Completado',

  // ── Exportación CSV (exportCSV) ──
  // Encabezados de columna (separados por coma, orden original).
  'csv-encabezado': 'Estudiante,Módulo,Estado,Tiempo_segundos,Errores,Insignia',
  // Nombre del archivo: {nombre} = slug del estudiante.
  'csv-nombre-archivo': 'reporte-{nombre}.csv',

  // ── Reinicio (restartProgress) ──
  'confirmar-reinicio': '¿Deseas borrar todo el progreso de este estudiante?',

  // ── Textos del DOM inicial (index.html; BYTE→BIT aplicado) ──
  // #loadingScreen h1 y p.
  'carga-titulo': 'Preparando el laboratorio…',
  'carga-subtitulo': 'Bit está revisando los equipos.',
  // #bytePanel strong y #byteMessage inicial.
  'bit-nombre': 'BIT',
  'bit-mensaje-inicial': '¡Hola! Hoy convertirás este laboratorio en una estación lista para aprender.',
  // #continueButton de la tarjeta de interacción.
  'boton-continuar': 'Continuar'
};
