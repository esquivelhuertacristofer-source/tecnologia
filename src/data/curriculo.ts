/**
 * Currículo Tecnia — temario v2 completo, tipado (F0.3).
 *
 * Fuente de verdad curricular de la plataforma: 10 niveles → unidades → temas,
 * cada unidad con eje formativo y estado de construcción, más el bloque Office
 * transversal con sus tres grados de dominio.
 *
 * Transcripción 1:1 de TEMARIO-PROPUESTA-V1.md (v2, julio 2026, en revisión
 * con el cliente). Si el cliente ajusta el temario, este archivo es el único
 * lugar que se edita: contadores y listados se derivan de aquí.
 */

import type { Etapa } from './niveles';

// ─── Ejes formativos (presentes en todos los niveles) ─────────────────────────

export type EjeFormativoId =
  | 'sistemas'      // La computadora y sus sistemas
  | 'programacion'  // Pensamiento computacional y programación
  | 'ciudadania'    // Ciudadanía digital y ciberseguridad
  | 'creatividad'   // Productividad y creatividad digital
  | 'datos-ia';     // Datos e inteligencia artificial

export interface EjeFormativo {
  id: EjeFormativoId;
  nombre: string;
  progresion: string; // cómo evoluciona el eje de primaria a bachillerato
}

export const EJES_FORMATIVOS: EjeFormativo[] = [
  {
    id: 'sistemas',
    nombre: 'La computadora y sus sistemas',
    progresion: 'Partes de la compu → sistema de cómputo → arquitectura, binario y redes.',
  },
  {
    id: 'programacion',
    nombre: 'Pensamiento computacional y programación',
    progresion: 'Secuencias y patrones → Scratch → Python, web y apps.',
  },
  {
    id: 'ciudadania',
    nombre: 'Ciudadanía digital y ciberseguridad',
    progresion: 'Cuidado y datos personales → redes sociales y phishing → ética y seguridad profesional.',
  },
  {
    id: 'creatividad',
    nombre: 'Productividad y creatividad digital',
    progresion: 'Paint y primeros textos → Office y Canva → dashboards, portafolio y publicación.',
  },
  {
    id: 'datos-ia',
    nombre: 'Datos e inteligencia artificial',
    progresion: 'Reconocer la IA a mi alrededor → cómo aprende, buenos prompts, crear con IA → análisis de datos y ética profesional.',
  },
];

// ─── Estados de construcción del contenido ────────────────────────────────────

export type EstadoContenido = 'disponible' | 'en-construccion' | 'planeada';

// ─── Estructura curricular ────────────────────────────────────────────────────

export interface ActividadPlan {
  /** Id estable; si estado = disponible, debe existir en el registro de actividades (F0.4). */
  id: string;
  titulo: string;
  estado: EstadoContenido;
  /** Emoji de la ficha en el hub de nivel; si falta, se usa el del eje formativo. */
  icono?: string;
  /**
   * Casilla del bloque Office transversal que esta actividad cubre (doc §33).
   *
   * La actividad se declara a sí misma, y por eso el campo vive aquí y no en una
   * tabla aparte: la sala de Office es una VISTA derivada de estas marcas, igual
   * que `niveles.ts` deriva sus contadores y que `insignias.ts` deriva su
   * catálogo. Con una lista paralela, las dos vistas se desincronizarían en
   * cuanto alguien renombrara un id; así no pueden.
   *
   * Marcarla NO la duplica: la actividad sigue viviendo en su nivel y en su
   * unidad, con el mismo id, el mismo progreso y la misma insignia. La sala sólo
   * la muestra otra vez, ordenada por programa en vez de por nivel.
   */
  office?: { app: AppOfficeId; grado: GradoDominio; tema?: string };
}

export interface UnidadCurricular {
  /** Id estable con prefijo de nivel, p. ej. "n1-mi-primera-computadora". */
  id: string;
  titulo: string;
  eje: EjeFormativoId;
  /** Subtemas tal como aparecen en el temario v2. */
  temas: string[];
  estado: EstadoContenido;
  /** Actividades construidas o en construcción para esta unidad. */
  actividades: ActividadPlan[];
  /** Proyecto de cierre de etapa (niveles 6, 9 y 10). */
  integradora?: boolean;
}

export interface NivelCurricular {
  n: number; // 1-10
  etapa: Etapa;
  grado: string;
  edad: string;
  titulo: string;
  unidades: UnidadCurricular[];
}

export const CURRICULO: NivelCurricular[] = [
  {
    n: 1, etapa: 'primaria', grado: '1° de Primaria', edad: '6–7',
    titulo: 'Descubro la tecnología',
    unidades: [
      {
        id: 'n1-mi-primera-computadora', titulo: 'Mi primera computadora', eje: 'sistemas',
        temas: [
          'Qué es y para qué sirve',
          'Partes principales (monitor, teclado, mouse, bocinas)',
          'Encendido y apagado',
          'La tecnología en casa y escuela',
          'Cuidado del equipo y postura',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n1-conoce-las-partes', titulo: 'Conoce las partes', estado: 'disponible', icono: '🖥️' },
          { id: 'n1-dentro-del-gabinete', titulo: 'Dentro del gabinete', estado: 'disponible', icono: '🧠' },
          { id: 'n1-conecta-el-equipo', titulo: 'Conecta el equipo', estado: 'disponible', icono: '🔌' },
          { id: 'n1-enciende-con-seguridad', titulo: 'Enciende con seguridad', estado: 'disponible', icono: '⏻' },
          { id: 'n1-mision-final', titulo: 'Misión final', estado: 'disponible', icono: '🏆' },
        ],
      },
      {
        id: 'n1-mouse-y-teclado', titulo: 'Mouse y teclado en acción', eje: 'sistemas',
        temas: [
          'Clic, doble clic y arrastrar (unir puntos, laberintos)',
          'Letras y números',
          'Teclas grandes (Enter, espacio, borrar)',
          'Arriba/abajo, izquierda/derecha',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n1-explora-eduos', titulo: 'Explora EduOS', estado: 'disponible', icono: '🪟' },
          { id: 'n1-caza-clics', titulo: 'Caza clics', estado: 'disponible', icono: '🎯' },
          { id: 'n1-laberinto-del-mouse', titulo: 'Laberinto del mouse', estado: 'disponible', icono: '🐭' },
          { id: 'n1-lluvia-de-letras', titulo: 'Lluvia de letras', estado: 'disponible', icono: '🔤' },
          { id: 'n1-teclas-gigantes', titulo: 'Teclas gigantes', estado: 'disponible', icono: '⌨️' },
          { id: 'n1-mapa-de-flechas', titulo: 'Mapa de flechas', estado: 'disponible', icono: '🧭' },
        ],
      },
      {
        id: 'n1-pienso-paso-a-paso', titulo: 'Pienso paso a paso', eje: 'programacion',
        temas: [
          'Seguir y ordenar instrucciones (secuencias)',
          'Patrones y clasificación',
          'Profesiones y sus herramientas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n1-ordena-los-pasos', titulo: 'Ordena los pasos', estado: 'disponible', icono: '👣' },
          { id: 'n1-sigue-el-patron', titulo: 'Sigue el patrón', estado: 'disponible', icono: '🔁' },
          { id: 'n1-quien-usa-que', titulo: '¿Quién usa qué?', estado: 'disponible', icono: '👩‍🚒' },
        ],
      },
      {
        id: 'n1-creo-con-la-compu', titulo: 'Creo con la compu', eje: 'creatividad',
        temas: [
          'Dibujo digital (trazos, formas, colores, relleno)',
          'Primer dibujo guardado con ayuda',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n1-utiliza-programas', titulo: 'Utiliza programas', estado: 'disponible', icono: '📝' },
          { id: 'n1-pinta-con-la-compu', titulo: 'Pinta con la compu', estado: 'disponible', icono: '🖌️' },
          { id: 'n1-guarda-tu-obra', titulo: 'Guarda tu obra de arte', estado: 'disponible', icono: '💾' },
        ],
      },
      {
        id: 'n1-uso-seguro-y-saludable', titulo: 'Uso seguro y saludable', eje: 'ciudadania',
        temas: [
          'Tiempo de pantalla',
          'Pedir ayuda a un adulto',
          'Mis datos no se comparten',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n1-semaforo-de-pantalla', titulo: 'El semáforo de la pantalla', estado: 'disponible', icono: '🚦' },
          { id: 'n1-pide-ayuda', titulo: 'Pido ayuda a un adulto', estado: 'disponible', icono: '🙋' },
          { id: 'n1-mis-datos-son-un-tesoro', titulo: 'Mis datos son un tesoro', estado: 'disponible', icono: '💎' },
        ],
      },
    ],
  },
  {
    n: 2, etapa: 'primaria', grado: '2° de Primaria', edad: '7–8',
    titulo: 'Exploro mi equipo',
    unidades: [
      {
        id: 'n2-dispositivos-a-mi-alrededor', titulo: 'Dispositivos a mi alrededor', eje: 'sistemas',
        temas: [
          'Computadora, laptop, tablet, smartphone, smart TV',
          'Entrada y salida',
          'Dónde viven mis archivos (USB, disco, nube inicial)',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-safari-de-dispositivos', titulo: 'Safari de dispositivos', estado: 'disponible', icono: '📱' },
          { id: 'n2-entrada-o-salida', titulo: '¿Entrada o salida?', estado: 'disponible', icono: '🔀' },
          { id: 'n2-donde-viven-mis-archivos', titulo: '¿Dónde viven mis archivos?', estado: 'disponible', icono: '🏠' },
        ],
      },
      {
        id: 'n2-teclado-y-mecanografia', titulo: 'Teclado y mecanografía inicial', eje: 'sistemas',
        temas: [
          'Secciones del teclado',
          'Mayúsculas y acentos',
          'Escritura a dos manos',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-explora-tu-teclado', titulo: 'Explora tu teclado', estado: 'disponible', icono: '⌨️' },
          { id: 'n2-mayusculas-y-acentos', titulo: 'Mayúsculas y acentos', estado: 'disponible', icono: '🔠' },
          { id: 'n2-escribe-a-dos-manos', titulo: 'Escribe a dos manos', estado: 'disponible', icono: '🙌' },
        ],
      },
      {
        id: 'n2-ventanas-archivos-carpetas', titulo: 'Ventanas, archivos y carpetas', eje: 'sistemas',
        temas: [
          'Abrir y cerrar programas',
          'Guardar, nombrar y encontrar el trabajo',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-abre-y-cierra-ventanas', titulo: 'Abre y cierra ventanas', estado: 'disponible', icono: '🪟' },
          { id: 'n2-guarda-y-encuentra', titulo: 'Guarda y encuentra tu trabajo', estado: 'disponible', icono: '🗂️' },
        ],
      },
      {
        id: 'n2-algoritmos-con-juegos', titulo: 'Algoritmos con juegos', eje: 'programacion',
        temas: [
          'Secuencias con bloques (laberintos)',
          'Depuración inicial',
          'Bucles («repetir»)',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-laberinto-de-bloques', titulo: 'El laberinto de bloques', estado: 'disponible', icono: '🧱' },
          { id: 'n2-caza-el-error', titulo: 'Caza el error', estado: 'disponible', icono: '🐞' },
          { id: 'n2-repite-repite', titulo: '¡Repite, repite! (bucles)', estado: 'disponible', icono: '🔁' },
        ],
      },
      {
        id: 'n2-escribo-y-dibujo', titulo: 'Escribo y dibujo', eje: 'creatividad',
        temas: [
          'Primeras oraciones en el procesador de textos',
          'Tamaño y color de letra',
          'Texto + dibujo',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-mis-primeras-oraciones', titulo: 'Mis primeras oraciones', estado: 'disponible', icono: '✏️', office: { app: 'word', grado: 'basico' } },
          { id: 'n2-viste-tus-letras', titulo: 'Viste tus letras', estado: 'disponible', icono: '🎨', office: { app: 'word', grado: 'basico' } },
          { id: 'n2-cuento-ilustrado', titulo: 'Mi cuento ilustrado', estado: 'disponible', icono: '📖', office: { app: 'word', grado: 'basico' } },
        ],
      },
      {
        id: 'n2-ciudadania-digital', titulo: 'Ciudadanía digital', eje: 'ciudadania',
        temas: [
          'Datos personales privados',
          'Con quién sí hablo en línea',
          'Respeto en pantalla',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n2-secreto-o-publico', titulo: '¿Secreto o público?', estado: 'disponible', icono: '🤫' },
          { id: 'n2-con-quien-hablo', titulo: '¿Con quién sí hablo en línea?', estado: 'disponible', icono: '💬' },
          { id: 'n2-heroes-del-respeto', titulo: 'Héroes del respeto', estado: 'disponible', icono: '🦸' },
        ],
      },
    ],
  },
  {
    n: 3, etapa: 'primaria', grado: '3° de Primaria', edad: '8–9',
    titulo: 'De las máquinas a las apps',
    unidades: [
      {
        id: 'n3-historia-de-la-computacion', titulo: 'Historia de la computación', eje: 'sistemas',
        temas: [
          'Del ábaco al smartphone',
          'Generaciones (versión simple)',
          'Inventores clave',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-viaje-en-el-tiempo', titulo: 'Viaje en el tiempo tecnológico', estado: 'disponible', icono: '🕰️' },
          { id: 'n3-generaciones-de-compus', titulo: 'Las generaciones de las compus', estado: 'disponible', icono: '🧬' },
          { id: 'n3-conoce-a-los-inventores', titulo: 'Conoce a los inventores', estado: 'disponible', icono: '👩‍🔬' },
        ],
      },
      {
        id: 'n3-hardware-y-software', titulo: 'Hardware y software', eje: 'sistemas',
        temas: [
          'Diferencias entre hardware y software',
          'Sistema operativo, escritorio, íconos y ventanas',
          'Carpetas y atajos',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-hardware-o-software', titulo: '¿Hardware o software?', estado: 'disponible', icono: '⚙️' },
          { id: 'n3-explora-el-escritorio', titulo: 'Explora el escritorio', estado: 'disponible', icono: '🖥️' },
          { id: 'n3-carpetas-y-atajos', titulo: 'Carpetas y atajos', estado: 'disponible', icono: '📁' },
        ],
      },
      {
        id: 'n3-internet-seguro', titulo: 'Internet seguro', eje: 'ciudadania',
        temas: [
          'Qué es internet y el navegador',
          'Palabras clave',
          'Sitios confiables',
          'Netiqueta y contraseñas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-que-es-internet', titulo: '¿Qué es internet?', estado: 'disponible', icono: '🌐' },
          { id: 'n3-busca-con-palabras-clave', titulo: 'Busca con palabras clave', estado: 'disponible', icono: '🔎' },
          { id: 'n3-detector-de-sitios-confiables', titulo: 'Detector de sitios confiables', estado: 'disponible', icono: '✅' },
          { id: 'n3-netiqueta-y-contrasenas', titulo: 'Netiqueta y contraseñas', estado: 'disponible', icono: '🔑' },
        ],
      },
      {
        id: 'n3-bloques-1-scratch', titulo: 'Programación en bloques I (Scratch)', eje: 'programacion',
        temas: [
          'Escenario, objetos, disfraces',
          'Eventos, movimiento, bucles',
          'Primera animación',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-conoce-scratch', titulo: 'Conoce Scratch', estado: 'disponible', icono: '🐱' },
          { id: 'n3-eventos-y-movimiento', titulo: 'Eventos y movimiento', estado: 'disponible', icono: '🕹️' },
          { id: 'n3-mi-primera-animacion', titulo: 'Mi primera animación', estado: 'disponible', icono: '🎬' },
        ],
      },
      {
        id: 'n3-procesador-de-textos-1', titulo: 'Procesador de textos I', eje: 'creatividad',
        temas: [
          'Formato (negritas, cursivas, alineación)',
          'Ortografía e imágenes',
          'Mecanografía: fila guía',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-dale-formato', titulo: 'Dale formato', estado: 'disponible', icono: '✍️', office: { app: 'word', grado: 'basico' } },
          { id: 'n3-ortografia-e-imagenes', titulo: 'Ortografía e imágenes', estado: 'disponible', icono: '🖼️', office: { app: 'word', grado: 'basico' } },
          { id: 'n3-la-fila-guia', titulo: 'La fila guía', estado: 'disponible', icono: '⌨️', office: { app: 'word', grado: 'basico' } },
        ],
      },
      {
        id: 'n3-la-ia-a-mi-alrededor', titulo: 'La IA a mi alrededor', eje: 'datos-ia',
        temas: [
          'Asistentes de voz, traductores y recomendaciones de videos',
          'Máquinas que «parecen pensar»: qué pueden y qué no',
          'La IA también se equivoca',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n3-la-ia-en-mi-dia', titulo: 'La IA en mi día', estado: 'disponible', icono: '🤖' },
          { id: 'n3-piensan-las-maquinas', titulo: '¿Piensan las máquinas?', estado: 'disponible', icono: '🧠' },
          { id: 'n3-la-ia-se-equivoca', titulo: 'La IA se equivoca', estado: 'disponible', icono: '🙈' },
        ],
      },
    ],
  },
  {
    n: 4, etapa: 'primaria', grado: '4° de Primaria', edad: '9–10',
    titulo: 'Creadores digitales',
    unidades: [
      {
        id: 'n4-como-funciona-internet', titulo: '¿Cómo funciona internet?', eje: 'sistemas',
        temas: [
          'Red, servidores y URL en versión simple',
          'Buscar mejor y comparar fuentes',
          'Qué es la nube',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-el-viaje-de-un-mensaje', titulo: 'El viaje de un mensaje', estado: 'disponible', icono: '📡' },
          { id: 'n4-busca-y-compara', titulo: 'Busca y compara fuentes', estado: 'disponible', icono: '🧐' },
          { id: 'n4-que-es-la-nube', titulo: '¿Qué es la nube?', estado: 'disponible', icono: '☁️', office: { app: 'm365', grado: 'intermedio' } },
        ],
      },
      {
        id: 'n4-correo-y-comunicacion', titulo: 'Correo y comunicación', eje: 'ciudadania',
        temas: [
          'Primera cuenta supervisada',
          'Partes del correo',
          'Enviar, responder, adjuntar',
          'Mensajería y videollamadas con respeto',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-mi-primera-cuenta', titulo: 'Mi primera cuenta (supervisada)', estado: 'disponible', icono: '🪪', office: { app: 'm365', grado: 'intermedio' } },
          { id: 'n4-partes-del-correo', titulo: 'Las partes del correo', estado: 'disponible', icono: '📬', office: { app: 'm365', grado: 'intermedio' } },
          { id: 'n4-envia-responde-adjunta', titulo: 'Envía, responde y adjunta', estado: 'disponible', icono: '📎', office: { app: 'm365', grado: 'intermedio' } },
          { id: 'n4-videollamadas-con-respeto', titulo: 'Videollamadas con respeto', estado: 'disponible', icono: '🎥', office: { app: 'm365', grado: 'intermedio' } },
        ],
      },
      {
        id: 'n4-bloques-2', titulo: 'Programación en bloques II', eje: 'programacion',
        temas: [
          'Condicionales',
          'Variables y puntajes',
          'Proyecto: videojuego sencillo',
          'Depuración',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-si-pasa-esto', titulo: 'Si pasa esto… (condicionales)', estado: 'disponible', icono: '🚦' },
          { id: 'n4-variables-y-puntajes', titulo: 'Variables y puntajes', estado: 'disponible', icono: '🧮' },
          { id: 'n4-crea-tu-videojuego', titulo: 'Crea tu videojuego', estado: 'disponible', icono: '👾' },
          { id: 'n4-depura-tu-juego', titulo: 'Depura tu juego', estado: 'disponible', icono: '🐞' },
        ],
      },
      {
        id: 'n4-procesador-de-textos-2', titulo: 'Procesador de textos II', eje: 'creatividad',
        temas: [
          'Tablas y columnas',
          'Formas, WordArt e imágenes',
          'Documentos de varias páginas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-tablas-y-columnas', titulo: 'Tablas y columnas', estado: 'disponible', icono: '🧾', office: { app: 'word', grado: 'intermedio' } },
          { id: 'n4-formas-y-wordart', titulo: 'Formas, WordArt e imágenes', estado: 'disponible', icono: '✨', office: { app: 'word', grado: 'basico' } },
          { id: 'n4-documento-de-varias-paginas', titulo: 'Documentos de varias páginas', estado: 'disponible', icono: '📄', office: { app: 'word', grado: 'intermedio' } },
        ],
      },
      {
        id: 'n4-presentaciones-1', titulo: 'Presentaciones I', eje: 'creatividad',
        temas: [
          'Diapositivas, diseño, temas',
          'Imágenes y texto',
          'Presentar frente al grupo',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-tus-primeras-diapositivas', titulo: 'Tus primeras diapositivas', estado: 'disponible', icono: '📽️', office: { app: 'powerpoint', grado: 'basico' } },
          { id: 'n4-imagenes-y-texto', titulo: 'Imágenes y texto que se entienden', estado: 'disponible', icono: '🖼️', office: { app: 'powerpoint', grado: 'basico' } },
          { id: 'n4-presenta-al-grupo', titulo: 'Presenta frente al grupo', estado: 'disponible', icono: '🎤', office: { app: 'powerpoint', grado: 'basico' } },
        ],
      },
      {
        id: 'n4-seguridad-digital', titulo: 'Seguridad digital', eje: 'ciudadania',
        temas: [
          'Virus y antivirus',
          'Phishing básico',
          'Qué hacer si algo me incomoda en línea',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-virus-y-antivirus', titulo: 'Virus y antivirus', estado: 'disponible', icono: '🦠' },
          { id: 'n4-atrapa-el-phishing', titulo: 'Atrapa el phishing', estado: 'disponible', icono: '🎣' },
          { id: 'n4-si-algo-me-incomoda', titulo: 'Si algo me incomoda en línea', estado: 'disponible', icono: '🛟' },
        ],
      },
      {
        id: 'n4-aprendo-con-la-ia', titulo: 'Aprendo con la IA', eje: 'datos-ia',
        temas: [
          'Preguntar a un asistente de IA (con supervisión)',
          'Comparar la respuesta con otras fuentes',
          'Real o generado: primeras pistas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n4-pregunta-a-la-ia', titulo: 'Pregunta a la IA', estado: 'disponible', icono: '💬' },
          { id: 'n4-comprueba-la-respuesta', titulo: 'Comprueba la respuesta', estado: 'disponible', icono: '🔍' },
          { id: 'n4-real-o-generado', titulo: '¿Real o generado?', estado: 'disponible', icono: '🪄' },
        ],
      },
    ],
  },
  {
    n: 5, etapa: 'primaria', grado: '5° de Primaria', edad: '10–11',
    titulo: 'Datos y proyectos',
    unidades: [
      {
        id: 'n5-el-sistema-de-computo', titulo: 'El sistema de cómputo', eje: 'sistemas',
        temas: [
          'CPU, memoria y almacenamiento',
          'Periféricos',
          'Nube vs. local',
          'Mantenimiento básico',
        ],
        // Cerrada el 15-ago-2026 con `n5-conecta-perifericos` y
        // `n5-manos-al-mantenimiento` (doc §53): las cuatro paradas ya se
        // pueden jugar. Si esta marca se quedara en `en-construccion`, el hub
        // del nivel le colgaría un 🚧 a una unidad terminada — el mismo defecto
        // que ya se corrigió en `n5-hoja-de-calculo-1` y por el mismo motivo.
        estado: 'disponible',
        actividades: [
          { id: 'n5-el-cerebro-de-la-compu', titulo: 'El cerebro de la compu', estado: 'disponible', icono: '🧠' },
          { id: 'n5-conecta-perifericos', titulo: 'Conecta los periféricos', estado: 'disponible', icono: '🖱️' },
          { id: 'n5-nube-o-local', titulo: '¿Nube o local?', estado: 'disponible', icono: '☁️' },
          { id: 'n5-manos-al-mantenimiento', titulo: 'Manos al mantenimiento', estado: 'disponible', icono: '🧰' },
        ],
      },
      {
        id: 'n5-hoja-de-calculo-1', titulo: 'Hoja de cálculo I', eje: 'creatividad',
        temas: [
          'Celdas, filas, columnas',
          'Capturar y ordenar datos',
          'Fórmulas básicas',
          'Primera gráfica',
        ],
        // Las 4 clases ya están 'disponible' desde el 13-ago-2026 (Tecnia
        // Hojas, grado Básico cerrado); esta marca se había quedado atrás y
        // le colgaba a la unidad un 🚧 "planeada" en el hub del nivel aunque
        // las cuatro ya se pueden jugar. Defecto encontrado de paso al
        // registrar n5-lo-que-publico-permanece — no es de esta unidad, pero
        // se corrige donde está.
        estado: 'disponible',
        actividades: [
          { id: 'n5-celdas-filas-columnas', titulo: 'Celdas, filas y columnas', estado: 'disponible', icono: '🔢', office: { app: 'excel', grado: 'basico', tema: 'Entorno, celdas y direcciones' } },
          { id: 'n5-captura-y-ordena', titulo: 'Captura y ordena datos', estado: 'disponible', icono: '🗃️', office: { app: 'excel', grado: 'basico', tema: 'Capturar, autorrellenar y ordenar' } },
          { id: 'n5-tus-primeras-formulas', titulo: 'Tus primeras fórmulas', estado: 'disponible', icono: '➕', office: { app: 'excel', grado: 'basico', tema: 'Tus primeras fórmulas (SUMA, PROMEDIO, CONTAR)' } },
          { id: 'n5-mi-primera-grafica', titulo: 'Mi primera gráfica', estado: 'disponible', icono: '📈', office: { app: 'excel', grado: 'basico', tema: 'Gráficas básicas e imprimir' } },
        ],
      },
      {
        id: 'n5-presentaciones-2', titulo: 'Presentaciones II', eje: 'creatividad',
        temas: [
          'Transiciones y animaciones con propósito',
          'Audio e imágenes',
          'Reglas de una buena diapositiva',
        ],
        // Mismo defecto que n5-hoja-de-calculo-1: las 3 clases están
        // 'disponible' desde la sala de PowerPoint cerrada (12-ago-2026) y
        // esta marca se había quedado en 'planeada'. Corregido de paso.
        estado: 'disponible',
        actividades: [
          // Intermedio, no básico (corregido el 10-ago-2026, §40.7): su tema es
          // «Animaciones con propósito y propiedades», que OFFICE_CURRICULO da a
          // PowerPoint Intermedio. Con `basico` la sala enseñaba el bloque
          // Intermedio descubierto y le colgaba al Básico una clase que no le toca.
          { id: 'n5-transiciones-con-proposito', titulo: 'Transiciones con propósito', estado: 'disponible', icono: '🎞️', office: { app: 'powerpoint', grado: 'intermedio' } },
          { id: 'n5-audio-e-imagenes', titulo: 'Audio e imágenes', estado: 'disponible', icono: '🎵', office: { app: 'powerpoint', grado: 'intermedio' } },
          { id: 'n5-la-buena-diapositiva', titulo: 'Las reglas de la buena diapositiva', estado: 'disponible', icono: '🔍', office: { app: 'powerpoint', grado: 'intermedio' } },
        ],
      },
      {
        id: 'n5-bloques-3', titulo: 'Programación en bloques III', eje: 'programacion',
        temas: [
          'Bloques propios (funciones) y mensajes',
          'Historia interactiva o juego con niveles',
          'Planeación de proyecto',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n5-bloques-propios', titulo: 'Bloques propios y mensajes', estado: 'disponible', icono: '🧩' },
          { id: 'n5-juego-con-niveles', titulo: 'Historia o juego con niveles', estado: 'disponible', icono: '🎮' },
          { id: 'n5-planea-tu-proyecto', titulo: 'Planea tu proyecto', estado: 'disponible', icono: '🗺️' },
        ],
      },
      {
        id: 'n5-ia-a-mi-alcance', titulo: 'IA a mi alcance', eje: 'datos-ia',
        temas: [
          'Qué es la IA y dónde la uso a diario',
          'La IA aprende con datos',
          'Uso responsable',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n5-la-ia-en-mi-vida', titulo: 'La IA en mi vida diaria', estado: 'disponible', icono: '🤖' },
          { id: 'n5-la-ia-aprende-con-datos', titulo: 'La IA aprende con datos', estado: 'disponible', icono: '📚' },
          { id: 'n5-uso-responsable-de-ia', titulo: 'Uso responsable de la IA', estado: 'disponible', icono: '🤝' },
        ],
      },
      {
        id: 'n5-mi-huella-digital', titulo: 'Mi huella digital', eje: 'ciudadania',
        temas: [
          'Lo que publico permanece',
          'Identidad digital',
          'Documentos compartidos',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n5-lo-que-publico-permanece', titulo: 'Lo que publico permanece', estado: 'disponible', icono: '👣' },
          { id: 'n5-mi-identidad-digital', titulo: 'Mi identidad digital', estado: 'disponible', icono: '🪞' },
          { id: 'n5-documentos-compartidos', titulo: 'Documentos compartidos', estado: 'disponible', icono: '🔗', office: { app: 'm365', grado: 'intermedio' } },
        ],
      },
    ],
  },
  {
    n: 6, etapa: 'primaria', grado: '6° de Primaria', edad: '11–12',
    titulo: 'Integro y comparto',
    unidades: [
      {
        id: 'n6-hoja-de-calculo-2', titulo: 'Hoja de cálculo II', eje: 'creatividad',
        temas: [
          'Funciones (suma, promedio, mín/máx, contar)',
          'Tipos de gráficas',
          'Interpretar información',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n6-funciones-esenciales', titulo: 'Funciones esenciales', estado: 'disponible', icono: '🧮', office: { app: 'excel', grado: 'intermedio', tema: 'Funciones condicionales y de fecha' } },
          { id: 'n6-elige-la-grafica', titulo: 'Elige la gráfica correcta', estado: 'disponible', icono: '📊', office: { app: 'excel', grado: 'intermedio', tema: 'Elegir la gráfica correcta (y las que mienten)' } },
          { id: 'n6-interpreta-la-informacion', titulo: 'Interpreta la información', estado: 'disponible', icono: '🕵️', office: { app: 'excel', grado: 'intermedio', tema: 'Revisar el libro e interpretar la información' } },
        ],
      },
      {
        id: 'n6-diseno-y-multimedia', titulo: 'Diseño y multimedia', eje: 'creatividad',
        temas: [
          'Carteles e infografías (Canva o similar)',
          'Edición básica de imagen y video',
          'Crear con IA: imágenes e ideas generadas (uso guiado y citado)',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n6-carteles-e-infografias', titulo: 'Carteles e infografías', estado: 'disponible', icono: '🪧' },
          { id: 'n6-edita-imagen-y-video', titulo: 'Edita imagen y video', estado: 'disponible', icono: '🎬' },
          { id: 'n6-crea-con-ia', titulo: 'Crea con IA (guiado y citado)', estado: 'disponible', icono: '🪄' },
        ],
      },
      {
        id: 'n6-robotica-y-steam', titulo: 'Robótica y STEAM', eje: 'programacion',
        temas: [
          'Qué es un robot (sensores y actuadores)',
          'Programar un micro:bit en simulador (o físico si hay kits)',
          'Reto: solucionar un problema con el robot',
        ],
        // 'disponible' desde que las dos paradas de bloques se cerraron el
        // 15-ago-2026 (documento §55); 'n6-que-es-un-robot' se cerró el
        // 21-ago-2026 sobre `laboratorio3d` (DISEÑO-N6-que-es-un-robot.md).
        estado: 'disponible',
        actividades: [
          { id: 'n6-que-es-un-robot', titulo: '¿Qué es un robot?', estado: 'disponible', icono: '🤖' },
          { id: 'n6-programa-un-microbit', titulo: 'Programa un micro:bit', estado: 'disponible', icono: '📟' },
          { id: 'n6-reto-robot', titulo: 'Reto: resuélvelo con tu robot', estado: 'disponible', icono: '🦾' },
        ],
      },
      {
        id: 'n6-mi-primera-pagina-web', titulo: 'Mi primera página web', eje: 'programacion',
        temas: [
          'Cómo se hace una página',
          'HTML básico',
          'Publicar en entorno seguro',
        ],
        // Unidad completa (3/3) desde el 15-ago-2026: las tres primeras clases
        // montadas sobre el armazón `Tecnia Web` (documento §51).
        estado: 'disponible',
        actividades: [
          { id: 'n6-como-se-hace-una-pagina', titulo: '¿Cómo se hace una página?', estado: 'disponible', icono: '🌐' },
          { id: 'n6-html-basico', titulo: 'HTML básico', estado: 'disponible', icono: '🧱' },
          { id: 'n6-publica-tu-pagina', titulo: 'Publica tu página', estado: 'disponible', icono: '🚀' },
        ],
      },
      {
        id: 'n6-de-bloques-a-texto', titulo: 'De bloques a texto', eje: 'programacion',
        temas: [
          'El mismo programa en bloques y en código',
          'Primeras instrucciones en Python',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n6-bloques-vs-codigo', titulo: 'El mismo programa, dos caras', estado: 'disponible', icono: '🎭' },
          { id: 'n6-primeras-lineas-python', titulo: 'Primeras líneas de Python', estado: 'disponible', icono: '🐍' },
        ],
      },
      {
        id: 'n6-ciberseguridad', titulo: 'Ciberseguridad', eje: 'ciudadania',
        temas: [
          'Contraseñas fuertes y verificación en dos pasos',
          'Privacidad en redes y juegos',
          'Ciberacoso',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n6-contrasenas-fuertes', titulo: 'Contraseñas fuertes y 2 pasos', estado: 'disponible', icono: '🔐' },
          { id: 'n6-privacidad-en-juegos', titulo: 'Privacidad en redes y juegos', estado: 'disponible', icono: '🕶️' },
          { id: 'n6-alto-al-ciberacoso', titulo: 'Alto al ciberacoso', estado: 'disponible', icono: '🛑' },
        ],
      },
      {
        id: 'n6-proyecto-integrador-primaria', titulo: 'Proyecto integrador de primaria', eje: 'datos-ia',
        temas: ['Investigar, analizar datos, diseñar y presentar'],
        estado: 'disponible',
        actividades: [
          { id: 'n6-proyecto-integrador', titulo: 'Tu proyecto integrador', estado: 'disponible', icono: '🎓' },
        ],
        integradora: true,
      },
    ],
  },
  {
    n: 7, etapa: 'secundaria', grado: '1° de Secundaria', edad: '12–13',
    titulo: 'Bajo el cofre',
    unidades: [
      {
        id: 'n7-arquitectura-y-sistemas', titulo: 'Arquitectura y sistemas', eje: 'sistemas',
        temas: [
          'CPU, RAM, almacenamiento, tarjeta gráfica',
          'Binario y unidades',
          'Sistemas operativos (Windows, Android, iOS, Linux)',
          'Mantenimiento y solución de problemas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-dentro-del-gabinete', titulo: 'Dentro del gabinete', estado: 'disponible', icono: '🔧' },
          { id: 'n7-binario-y-unidades', titulo: 'Binario y unidades', estado: 'disponible', icono: '🔢' },
          { id: 'n7-sistemas-operativos', titulo: 'Sistemas operativos', estado: 'disponible', icono: '💿' },
          { id: 'n7-diagnostica-y-soluciona', titulo: 'Diagnostica y soluciona', estado: 'disponible', icono: '🩺' },
        ],
      },
      {
        id: 'n7-python-1', titulo: 'Programación en texto I (Python)', eje: 'programacion',
        temas: [
          'Variables y tipos',
          'Entrada/salida',
          'Condicionales',
          'Bucles',
          'Retos guiados',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-variables-y-tipos', titulo: 'Variables y tipos', estado: 'disponible', icono: '📦' },
          { id: 'n7-entrada-y-salida', titulo: 'Entrada y salida', estado: 'disponible', icono: '💬' },
          { id: 'n7-condicionales-python', titulo: 'Condicionales', estado: 'disponible', icono: '🔀' },
          { id: 'n7-bucles-python', titulo: 'Bucles', estado: 'disponible', icono: '🔁' },
          { id: 'n7-retos-python', titulo: 'Retos guiados', estado: 'disponible', icono: '🏅' },
        ],
      },
      {
        id: 'n7-desarrollo-web-1', titulo: 'Desarrollo web I', eje: 'programacion',
        temas: [
          'HTML (estructura)',
          'CSS (colores, tipografías, cajas)',
          'Proyecto: sitio personal',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-html-estructura', titulo: 'HTML: la estructura', estado: 'disponible', icono: '🧱' },
          { id: 'n7-css-estilo', titulo: 'CSS: el estilo', estado: 'disponible', icono: '🎨' },
          { id: 'n7-tu-sitio-personal', titulo: 'Proyecto: tu sitio personal', estado: 'disponible', icono: '🌐' },
        ],
      },
      {
        id: 'n7-hoja-de-calculo-aplicada', titulo: 'Hoja de cálculo aplicada', eje: 'creatividad',
        temas: [
          'Referencias absolutas/relativas',
          'Función SI',
          'Formato condicional',
          'Datos reales',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-referencias', titulo: 'Referencias absolutas y relativas', estado: 'disponible', icono: '🎯', office: { app: 'excel', grado: 'intermedio', tema: 'Referencias absolutas y rangos con nombre' } },
          { id: 'n7-funcion-si', titulo: 'La función SI', estado: 'disponible', icono: '❓', office: { app: 'excel', grado: 'intermedio', tema: 'La función SI, Y/O/NO y el SI anidado' } },
          { id: 'n7-formato-condicional', titulo: 'Formato condicional', estado: 'disponible', icono: '🚦', office: { app: 'excel', grado: 'intermedio', tema: 'Formato condicional y minigráficos' } },
          { id: 'n7-datos-reales', titulo: 'Trabaja con datos reales', estado: 'disponible', icono: '📊', office: { app: 'excel', grado: 'intermedio', tema: 'Importar datos y preparar la salida' } },
        ],
      },
      {
        id: 'n7-ciudadania-digital-critica', titulo: 'Ciudadanía digital crítica', eje: 'ciudadania',
        temas: [
          'Privacidad en redes',
          'Ciberacoso, grooming y sexting (riesgos y marco legal)',
          'Equilibrio digital',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-privacidad-en-redes', titulo: 'Privacidad en redes', estado: 'disponible', icono: '🕶️' },
          { id: 'n7-riesgos-y-marco-legal', titulo: 'Riesgos en línea y marco legal', estado: 'disponible', icono: '⚖️' },
          { id: 'n7-equilibrio-digital', titulo: 'Equilibrio digital', estado: 'disponible', icono: '🧘' },
        ],
      },
      {
        id: 'n7-ia-1', titulo: 'IA I', eje: 'datos-ia',
        temas: [
          'Cómo «aprende» una IA (datos y entrenamiento)',
          'Buenos prompts',
          'Verificar lo que dice la IA',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n7-como-aprende-la-ia', titulo: '¿Cómo aprende una IA?', estado: 'disponible', icono: '🧠' },
          { id: 'n7-buenos-prompts', titulo: 'Escribe buenos prompts', estado: 'disponible', icono: '✍️' },
          { id: 'n7-verifica-a-la-ia', titulo: 'Verifica lo que dice la IA', estado: 'disponible', icono: '🔍' },
        ],
      },
    ],
  },
  {
    n: 8, etapa: 'secundaria', grado: '2° de Secundaria', edad: '13–14',
    titulo: 'Construyo soluciones',
    unidades: [
      {
        id: 'n8-python-2', titulo: 'Programación en texto II', eje: 'programacion',
        temas: [
          'Listas y diccionarios',
          'Funciones',
          'Proyectos (juegos de consola, calculadoras, bots)',
          'Buenas prácticas y depuración',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-listas-y-diccionarios', titulo: 'Listas y diccionarios', estado: 'disponible', icono: '📚' },
          { id: 'n8-funciones-python', titulo: 'Funciones', estado: 'disponible', icono: '🧩' },
          { id: 'n8-proyectos-consola', titulo: 'Juegos, calculadoras y bots', estado: 'disponible', icono: '🤖' },
          { id: 'n8-buenas-practicas', titulo: 'Buenas prácticas y depuración', estado: 'disponible', icono: '🧹' },
        ],
      },
      {
        id: 'n8-desarrollo-web-2', titulo: 'Desarrollo web II', eje: 'programacion',
        temas: [
          'CSS responsivo',
          'JavaScript básico',
          'Proyecto: sitio de varias páginas',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-css-responsivo', titulo: 'CSS responsivo', estado: 'disponible', icono: '📱' },
          { id: 'n8-javascript-basico', titulo: 'JavaScript básico', estado: 'disponible', icono: '⚡' },
          { id: 'n8-sitio-multipagina', titulo: 'Proyecto: sitio de varias páginas', estado: 'disponible', icono: '🌐' },
        ],
      },
      {
        id: 'n8-datos-y-analisis', titulo: 'Datos y análisis', eje: 'datos-ia',
        temas: [
          'Limpieza y organización',
          'Tablas dinámicas iniciales',
          'Visualización efectiva',
          'Conclusiones',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-limpieza-de-datos', titulo: 'Limpieza y organización', estado: 'disponible', icono: '🧽' },
          { id: 'n8-tablas-dinamicas', titulo: 'Tablas dinámicas iniciales', estado: 'disponible', icono: '🔄' },
          { id: 'n8-visualizacion-efectiva', titulo: 'Visualización efectiva', estado: 'disponible', icono: '📈' },
          { id: 'n8-concluye-con-datos', titulo: 'Concluye con datos', estado: 'disponible', icono: '💡' },
        ],
      },
      {
        id: 'n8-redes-y-ciberseguridad', titulo: 'Redes y ciberseguridad', eje: 'ciudadania',
        temas: [
          'IP, wifi, servidores',
          'Malware e ingeniería social',
          'Cifrado básico',
          'Hábitos de protección',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-ip-wifi-servidores', titulo: 'IP, wifi y servidores', estado: 'disponible', icono: '📡' },
          { id: 'n8-malware-e-ingenieria-social', titulo: 'Malware e ingeniería social', estado: 'disponible', icono: '🎭' },
          { id: 'n8-cifrado-basico', titulo: 'Cifrado básico', estado: 'disponible', icono: '🔐' },
          { id: 'n8-habitos-de-proteccion', titulo: 'Hábitos de protección', estado: 'disponible', icono: '🛡️' },
        ],
      },
      {
        id: 'n8-multimedia-y-videojuegos', titulo: 'Producción multimedia y videojuegos', eje: 'creatividad',
        temas: [
          'Imagen con capas',
          'Video y audio (guion, cortes, música)',
          'Diseño de videojuegos (mecánicas, niveles, prueba con jugadores)',
          'Derechos de autor y licencias',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-imagen-con-capas', titulo: 'Imagen con capas', estado: 'disponible', icono: '🖼️' },
          { id: 'n8-video-y-audio', titulo: 'Video y audio', estado: 'disponible', icono: '🎬' },
          { id: 'n8-disena-tu-videojuego', titulo: 'Diseña tu videojuego', estado: 'disponible', icono: '👾' },
          { id: 'n8-derechos-y-licencias', titulo: 'Derechos de autor y licencias', estado: 'disponible', icono: '📜' },
        ],
      },
      {
        id: 'n8-ia-2', titulo: 'IA II', eje: 'datos-ia',
        temas: [
          'Generación de texto, imagen y audio',
          'Sesgos y errores',
          'Ética (plagio, deepfakes, citar a la IA)',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n8-genera-con-ia', titulo: 'Genera texto, imagen y audio', estado: 'disponible', icono: '🪄' },
          { id: 'n8-sesgos-y-errores', titulo: 'Sesgos y errores de la IA', estado: 'disponible', icono: '⚠️' },
          { id: 'n8-etica-de-la-ia', titulo: 'Ética: plagio, deepfakes y citas', estado: 'disponible', icono: '⚖️' },
        ],
      },
    ],
  },
  {
    n: 9, etapa: 'secundaria', grado: '3° de Secundaria', edad: '14–15',
    titulo: 'Del prototipo al producto',
    unidades: [
      {
        id: 'n9-desarrollo-de-aplicaciones', titulo: 'Desarrollo de aplicaciones', eje: 'programacion',
        temas: [
          'Diseño de app (bocetos, flujo de usuario)',
          'Construcción low-code (App Inventor o similar)',
          'Pruebas con usuarios',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n9-boceta-tu-app', titulo: 'Boceta tu app', estado: 'disponible', icono: '✏️' },
          { id: 'n9-construye-low-code', titulo: 'Constrúyela low-code', estado: 'disponible', icono: '🏗️' },
          { id: 'n9-pruebas-con-usuarios', titulo: 'Pruébala con usuarios', estado: 'disponible', icono: '🧪' },
        ],
      },
      {
        id: 'n9-algoritmos-y-datos', titulo: 'Algoritmos y datos', eje: 'programacion',
        temas: [
          'Búsqueda y ordenamiento (noción de eficiencia)',
          'Bases de datos iniciales (tablas, registros, consultas)',
          'Proyectos de datos con Python',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n9-busqueda-y-ordenamiento', titulo: 'Búsqueda y ordenamiento', estado: 'disponible', icono: '🔍' },
          { id: 'n9-bases-de-datos-iniciales', titulo: 'Bases de datos iniciales', estado: 'disponible', icono: '🗄️' },
          { id: 'n9-datos-con-python', titulo: 'Proyectos de datos con Python', estado: 'disponible', icono: '🐍' },
        ],
      },
      {
        id: 'n9-nube-y-colaboracion', titulo: 'Nube y colaboración profesional', eje: 'creatividad',
        temas: [
          'Trabajo colaborativo',
          'Gestión de proyectos (tableros, tareas, versiones)',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n9-trabajo-colaborativo', titulo: 'Trabajo colaborativo en la nube', estado: 'disponible', icono: '☁️', office: { app: 'm365', grado: 'intermedio' } },
          { id: 'n9-gestiona-tu-proyecto', titulo: 'Gestiona tu proyecto', estado: 'disponible', icono: '📋', office: { app: 'm365', grado: 'intermedio' } },
        ],
      },
      {
        id: 'n9-robotica-e-iot', titulo: 'Robótica e internet de las cosas', eje: 'sistemas',
        temas: [
          'Sensores conectados a internet (IoT)',
          'Casa y ciudad inteligentes',
          'Proyecto en simulador: automatizar un espacio',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n9-sensores-iot', titulo: 'Sensores conectados (IoT)', estado: 'disponible', icono: '📡' },
          { id: 'n9-casa-inteligente', titulo: 'Casa y ciudad inteligentes', estado: 'disponible', icono: '🏙️' },
          { id: 'n9-automatiza-un-espacio', titulo: 'Automatiza un espacio', estado: 'disponible', icono: '🎛️' },
        ],
      },
      {
        id: 'n9-emprendimiento-e-identidad', titulo: 'Emprendimiento e identidad digital', eje: 'ciudadania',
        temas: [
          'Marca personal y portafolio en línea',
          'E-commerce y marketing digital (nociones)',
          'Nuevos empleos tecnológicos',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n9-marca-personal', titulo: 'Marca personal y portafolio', estado: 'disponible', icono: '🪪' },
          { id: 'n9-ecommerce-y-marketing', titulo: 'E-commerce y marketing digital', estado: 'disponible', icono: '🛒' },
          { id: 'n9-empleos-tecnologicos', titulo: 'Los nuevos empleos tech', estado: 'disponible', icono: '💼' },
        ],
      },
      {
        id: 'n9-ia-y-automatizacion', titulo: 'IA y automatización', eje: 'datos-ia',
        temas: [
          'Automatizar tareas repetitivas',
          'IA como copiloto',
          'Impacto de la IA en el trabajo',
        ],
        // 'disponible' desde que la primera parada se cerró el 15-ago-2026
        // (documento §55); las otras dos siguen planeadas.
        estado: 'disponible',
        actividades: [
          { id: 'n9-automatiza-tareas', titulo: 'Automatiza tareas repetitivas', estado: 'disponible', icono: '⚙️' },
          { id: 'n9-ia-copiloto', titulo: 'La IA como copiloto', estado: 'disponible', icono: '🧑‍✈️' },
          { id: 'n9-ia-y-trabajo', titulo: 'El impacto de la IA en el trabajo', estado: 'disponible', icono: '🌍' },
        ],
      },
      {
        id: 'n9-proyecto-integrador-secundaria', titulo: 'Proyecto integrador de secundaria', eje: 'programacion',
        temas: ['Problema real → solución digital (app, sitio o análisis de datos)'],
        estado: 'disponible',
        actividades: [
          { id: 'n9-proyecto-integrador', titulo: 'Problema real, solución digital', estado: 'disponible', icono: '🎓' },
        ],
        integradora: true,
      },
    ],
  },
  {
    n: 10, etapa: 'bachillerato', grado: 'Bachillerato', edad: '15–18',
    titulo: 'Perfil profesional',
    unidades: [
      {
        id: 'n10-programacion-aplicada', titulo: 'Programación aplicada', eje: 'programacion',
        temas: [
          'Python intermedio (archivos, módulos, librerías)',
          'Problemas tipo concurso',
          'Intro a análisis de datos con código',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-python-intermedio', titulo: 'Python intermedio', estado: 'disponible', icono: '🐍' },
          { id: 'n10-problemas-de-concurso', titulo: 'Problemas tipo concurso', estado: 'disponible', icono: '🏆' },
          { id: 'n10-analisis-con-codigo', titulo: 'Analiza datos con código', estado: 'disponible', icono: '📊' },
        ],
      },
      {
        id: 'n10-bases-de-datos-y-sql', titulo: 'Bases de datos y SQL', eje: 'datos-ia',
        temas: [
          'Modelado básico',
          'SELECT, filtros y uniones simples',
          'Conexión con hojas de cálculo y apps',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-modela-tus-datos', titulo: 'Modela tus datos', estado: 'disponible', icono: '🗄️' },
          { id: 'n10-consultas-sql', titulo: 'Consultas SQL', estado: 'disponible', icono: '🔍' },
          { id: 'n10-conecta-tus-datos', titulo: 'Conecta datos con hojas y apps', estado: 'disponible', icono: '🔗' },
        ],
      },
      {
        id: 'n10-desarrollo-web-integral', titulo: 'Desarrollo web integral', eje: 'programacion',
        temas: [
          'HTML/CSS/JS en un proyecto real',
          'Publicación',
          'Nociones de UX/UI',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-proyecto-web-real', titulo: 'HTML/CSS/JS en un proyecto real', estado: 'disponible', icono: '🌐' },
          { id: 'n10-publica-tu-sitio', titulo: 'Publica tu sitio', estado: 'disponible', icono: '🚀' },
          { id: 'n10-ux-ui', titulo: 'Nociones de UX/UI', estado: 'disponible', icono: '🎨' },
        ],
      },
      {
        id: 'n10-ia-y-ciencia-de-datos', titulo: 'IA y ciencia de datos', eje: 'datos-ia',
        temas: [
          'Cómo funcionan los modelos (entrenamiento y límites)',
          'Flujos de trabajo con IA',
          'Ética profesional y regulación',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-como-funcionan-los-modelos', titulo: 'Cómo funcionan los modelos', estado: 'disponible', icono: '🧠' },
          { id: 'n10-flujos-con-ia', titulo: 'Flujos de trabajo con IA', estado: 'disponible', icono: '🔄' },
          { id: 'n10-etica-y-regulacion', titulo: 'Ética profesional y regulación', estado: 'disponible', icono: '⚖️' },
        ],
      },
      {
        id: 'n10-ciberseguridad-profesional', titulo: 'Ciberseguridad profesional', eje: 'ciudadania',
        temas: [
          'Amenazas actuales y defensa',
          'Identidad, autenticación y cifrado',
          'Carreras en ciberseguridad',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-amenazas-y-defensa', titulo: 'Amenazas actuales y defensa', estado: 'disponible', icono: '🛡️' },
          { id: 'n10-identidad-y-cifrado', titulo: 'Identidad, autenticación y cifrado', estado: 'disponible', icono: '🔐' },
          { id: 'n10-carreras-ciber', titulo: 'Carreras en ciberseguridad', estado: 'disponible', icono: '🧑‍💻' },
        ],
      },
      {
        id: 'n10-capstone-y-portafolio', titulo: 'Proyecto capstone y portafolio', eje: 'creatividad',
        temas: [
          'Proyecto final documentado',
          'Portafolio digital y currículum',
          'Orientación a carreras y certificaciones',
        ],
        estado: 'disponible',
        actividades: [
          { id: 'n10-capstone', titulo: 'Tu proyecto capstone', estado: 'disponible', icono: '🎯' },
          { id: 'n10-portafolio-y-cv', titulo: 'Portafolio digital y currículum', estado: 'disponible', icono: '📁' },
          { id: 'n10-carreras-y-certificaciones', titulo: 'Carreras y certificaciones', estado: 'disponible', icono: '🎓' },
        ],
        integradora: true,
      },
    ],
  },
];

// ─── Bloque Office transversal (Microsoft 365) ────────────────────────────────

export type GradoDominio = 'basico' | 'intermedio' | 'avanzado';

export interface GradoOffice {
  dominio: GradoDominio;
  /** Niveles Tecnia sugeridos para cursarlo (Básico 3–5, Intermedio 6–8, Avanzado 9–10). */
  nivelesSugeridos: number[];
  temas: string[];
}

export type AppOfficeId = 'word' | 'excel' | 'powerpoint' | 'm365';

export interface AppOffice {
  id: AppOfficeId;
  nombre: string;
  grados: GradoOffice[];
}

export const OFFICE_CURRICULO: AppOffice[] = [
  {
    id: 'word', nombre: 'Word',
    grados: [
      {
        dominio: 'basico', nivelesSugeridos: [3, 4, 5],
        temas: [
          'Entorno y cinta de opciones',
          'Formato de texto y párrafo',
          'Imágenes, formas y WordArt',
          'Guardar, imprimir, PDF',
        ],
      },
      {
        dominio: 'intermedio', nivelesSugeridos: [6, 7, 8],
        temas: [
          'Tablas y columnas',
          'Estilos, índices y tablas de contenido',
          'Encabezados/pies y saltos de sección',
          'Revisión (ortografía, comentarios, control de cambios)',
        ],
      },
      {
        dominio: 'avanzado', nivelesSugeridos: [9, 10],
        // «Documento maestro y subdocumentos» se retiró el 9-ago-2026 (doc §33.1).
        // Es un tema de nicho que en la práctica sustituyen los estilos más la
        // tabla de contenido, que sí se enseñan en `of-word-estilos-e-indice`;
        // mantenerlo obligaba a un ejercicio que nadie iba a usar.
        temas: [
          'Correspondencia masiva (cartas y etiquetas)',
          'Formularios y protección',
          'Plantillas y macros',
          'Coautoría en la nube',
        ],
      },
    ],
  },
  {
    id: 'excel', nombre: 'Excel',
    /*
     * ── REESCRITO EL 13-ago-2026 CON EL TEMARIO DEL §45 ──────────────────────
     *
     * Los temas de arriba se escribieron en julio a ojo. El §45 los sustituye por
     * el reparto medido de los **58 bloques** que salen de cruzar MOS MO-210
     * (Associate), **MO-211 (Expert)** —de donde vienen las macros, las tablas
     * dinámicas y la auditoría—, ICDL Spreadsheets y K-12.
     *
     * Y se escriben AQUÍ y no sólo en el documento por la lección de §44: **una
     * medida que no está en el código no avisa cuando se incumple**. Los 43
     * bloques de PowerPoint vivieron un mes en una tabla de Markdown mientras la
     * sala se declaraba cerrada, y una tabla no falla ninguna prueba.
     *
     * Un tema por clase, en el orden en que se dan.
     */
    grados: [
      {
        dominio: 'basico', nivelesSugeridos: [3, 4, 5],
        temas: [
          'Entorno, celdas y direcciones',
          'Capturar, autorrellenar y ordenar',
          'El tipo de la celda y su formato',
          'Tus primeras fórmulas (SUMA, PROMEDIO, CONTAR)',
          'Gráficas básicas e imprimir',
        ],
      },
      {
        dominio: 'intermedio', nivelesSugeridos: [6, 7, 8],
        temas: [
          'Referencias absolutas y rangos con nombre',
          'La función SI, Y/O/NO y el SI anidado',
          'Funciones condicionales y de fecha',
          'BUSCARX y las funciones de texto',
          'Formato condicional y minigráficos',
          'Validación de datos',
          'Tablas, filtros y paneles inmovilizados',
          'Elegir la gráfica correcta (y las que mienten)',
          'Revisar el libro e interpretar la información',
          'Importar datos y preparar la salida',
        ],
      },
      {
        dominio: 'avanzado', nivelesSugeridos: [9, 10],
        /*
         * «Intro a Power Query» se retiró el 13-ago-2026 (doc §45.3), decidido
         * por Cristofer. Es una ventana y un lenguaje aparte —M—, y simularlo
         * cuesta más que todo este grado junto. Lo que el tema quería —traer
         * datos de fuera y limpiarlos— sigue enseñándose: importar `.csv` está
         * en el Intermedio y quitar duplicados y el relleno rápido, aquí.
         *
         * Mismo criterio que el «Documento maestro» de Word, y escrito por el
         * mismo motivo: un recorte que no deja rastro se convierte en un tema
         * que nadie sabe por qué falta.
         *
         * El grado pasó de 4 temas a 8 en la misma decisión: cuatro clases para
         * quince bloques dejaban SIETE sin casa —auditoría, errores, formato de
         * datos, consolidar, proteger y «Y si»— y además «Consolidación y
         * protección» no tenía dueño mientras «Tablas y gráficos dinámicos»
         * tenía dos. **Las cuentas cuadraban y el reparto no**, que es el mismo
         * defecto que §40.2 encontró en PowerPoint.
         */
        temas: [
          'Datos limpios: duplicados, relleno rápido y formato personalizado',
          'Auditoría de fórmulas y los errores de Excel',
          'Tablas dinámicas',
          'Gráficos dinámicos y segmentación',
          'Consolidación y protección',
          'Análisis Y si (buscar objetivo y escenarios)',
          'Macros (grabar, ejecutar, asignar)',
          'Un tablero de una sola pantalla',
        ],
      },
    ],
  },
  {
    id: 'powerpoint', nombre: 'PowerPoint',
    grados: [
      {
        dominio: 'basico', nivelesSugeridos: [3, 4, 5],
        temas: [
          'Diapositivas, diseños y temas',
          'Texto, imágenes y formas',
          'Transiciones sencillas',
          'Presentar y PDF',
          // Entró el 12-ago-2026 con §44: es el bloque 3 del temario de §40.2
          // —las vistas— más el 11 (ocultar) y el 27 (secciones), que no tenían
          // clase. Los cubre `of-ppt-ordena-el-mazo`.
          'Vistas, ocultar y secciones',
        ],
      },
      {
        dominio: 'intermedio', nivelesSugeridos: [6, 7, 8],
        temas: [
          'SmartArt, tablas y gráficos',
          'Animaciones con propósito y propiedades',
          'Audio, video e intervalos',
          // §44.2, 12-ago-2026: bloques 15, 16, 17 y 43 del temario de §40.2,
          // que no tenía clase ninguno. El 43 —modelos 3D— es el que el §40.2
          // dio por enseñado en la clase de SmartArt sin que nadie lo hiciera.
          'Formas, cuadros de texto y modelos 3D',
        ],
      },
      {
        dominio: 'avanzado', nivelesSugeridos: [9, 10],
        temas: [
          'Patrones, plantillas reutilizables y temas propios',
          'Presentaciones personalizadas e interactivas',
          'Comentarios de revisión e inspector de documentos',
          'Proteger y exportar a video',
          // §44.4, 12-ago-2026: bloques 31 y 42 del temario de §40.2. El 42 —los
          // patrones de notas y documentos— es el rincón que nadie visita: todo
          // el mundo sabe que hay patrón de diapositivas y casi nadie sabe que
          // las hojas impresas también tienen molde. Lo cubre `of-ppt-en-papel`.
          'Imprimir, patrones de notas y de documentos',
          // §44.5, 12-ago-2026: bloques 32 y 33 del temario de §40.2. Es el tema
          // donde los dos programas del Edificio se tocan —un esquema de Word se
          // convierte en diapositivas— y donde los estilos de título de Word
          // dejan de ser una regla de estilo y se ven servir para algo.
          'Reutilizar diapositivas, esquema de Word y Zoom de resumen',
          // «Macros» se retiró el 10-ago-2026 (§40.2), y con él el bloque queda en
          // cuatro temas para las cuatro clases avanzadas de la sala. Era el único
          // tema sin ejercicio que lo cubriera, y además es VBA: del mundo de Excel
          // avanzado y de una edad que esta plataforma no cubre. Es el mismo recorte
          // que Word dejó escrito aquí con «Documento maestro y subdocumentos».
          // Lo de los modelos 3D se corrigió el 12-ago-2026: no se enseñaban en
          // `of-ppt-smartart-y-graficos` —esa clase nunca los tocó— y ahora son
          // parte del tema «Formas, cuadros de texto y modelos 3D» del Intermedio.
        ],
      },
    ],
  },
  {
    id: 'm365', nombre: 'Complemento Microsoft 365',
    grados: [
      {
        dominio: 'intermedio', nivelesSugeridos: [6, 7, 8, 9],
        temas: [
          'Outlook (correo profesional y calendario)',
          'OneDrive (nube y coautoría)',
          'Teams (clases, tareas, reuniones)',
        ],
      },
      {
        dominio: 'avanzado', nivelesSugeridos: [10],
        temas: [
          'Equivalencias con Google Workspace',
          'IA dentro de Office (Copilot): panorama',
        ],
      },
    ],
  },
];

// ─── Ejercicios exclusivos del bloque Office (doc §33.2) ──────────────────────

/**
 * Los ejercicios que SÓLO existen dentro de la sala de su programa, porque
 * cubren temas del catálogo que ningún nivel toca.
 *
 * Por qué existen. Cotejados los temas de `OFFICE_CURRICULO` contra las
 * actividades de nivel marcadas con `office`, el temario no está escueto de
 * manera uniforme: está sano en el grado Básico y **vacío en el Avanzado**. Y no
 * se va a llenar por la vía de los niveles, porque ni N9 ni N10 tienen unidad de
 * Word, Excel o PowerPoint —comprobado unidad por unidad—. Sin estos ejercicios,
 * la vitrina del hub prometería a bachillerato una columna que no existe.
 *
 * Por qué llevan prefijo `of-` y viven FUERA de `CURRICULO`. Dos motivos, y los
 * dos importan. El primero es de producto: no pertenecen a ningún nivel, así que
 * aparecer en el hub de un nivel sería mentira. El segundo es de arnés: la
 * prueba del temario exige que toda actividad de nivel lleve el prefijo de su
 * nivel en el id, y meterlos en `CURRICULO` la rompería con razón.
 *
 * Lo que NO hay aquí. Ninguna actividad de nivel se copia a esta lista. Las
 * clases prestadas —las 34 marcadas con `office`— siguen viviendo en su unidad y
 * la sala las muestra desde ahí, con el mismo id y el mismo progreso.
 */
export interface EjercicioOffice {
  /** Id estable con prefijo `of-`; si estado = disponible debe existir en el registro. */
  id: string;
  app: AppOfficeId;
  grado: GradoDominio;
  titulo: string;
  /** Qué enseña, en una frase. Es lo único que el temario fija; los cinco ejes se escriben al construir. */
  aprendizaje: string;
  estado: EstadoContenido;
  icono: string;
  /**
   * El tema de `OFFICE_CURRICULO` que esta clase cubre, **literal** (§45.3).
   *
   * ── POR QUÉ EXISTE ESTE CAMPO ───────────────────────────────────────────
   *
   * Porque contar no basta. En PowerPoint, `OFFICE_CURRICULO` daba cinco temas
   * al grado Avanzado y había cuatro clases: eso lo caza un conteo. En Excel el
   * defecto era peor y ningún conteo lo veía — cuatro temas y cuatro clases,
   * pero «Tablas y gráficos dinámicos» tenía **dos** dueños y «Consolidación y
   * protección» **ninguno**—. Las cuentas cuadraban y el reparto no.
   *
   * Con el tema escrito aquí, «cada tema tiene clase» es una prueba y no una
   * lectura atenta. Y la prueba obliga por programa entero: en cuanto UNA clase
   * de una sala lo declara, **todas** las de esa sala tienen que declararlo y
   * todos sus temas tienen que quedar cubiertos. Así no se puede empezar a
   * medir una sala y dejarla a medio medir, que es como se pierden estas cosas.
   */
  tema?: string;
}

export const EJERCICIOS_OFFICE: EjercicioOffice[] = [
  // ── Word ────────────────────────────────────────────────────────────────
  {
    id: 'of-word-la-cinta', app: 'word', grado: 'basico', estado: 'disponible', icono: '🎀',
    titulo: 'La cinta por dentro',
    aprendizaje:
      'Que las herramientas no están sueltas: hay pestañas y dentro grupos, y el grupo dice para qué sirve lo que contiene. Se busca una herramienta por lo que hace, no por dónde se recuerda.',
  },
  {
    id: 'of-word-parrafos-que-respiran', app: 'word', grado: 'basico', estado: 'disponible', icono: '📐',
    titulo: 'Párrafos que respiran',
    aprendizaje:
      'Que el espacio en blanco no es adorno: separar las ideas en párrafos, abrir el interlineado, emparejar los bordes y marcar la sangría es lo que hace que un texto se lea. Y que todo eso es del párrafo entero, no de la palabra seleccionada.',
  },
  {
    id: 'of-word-guardar-e-imprimir', app: 'word', grado: 'basico', estado: 'disponible', icono: '🖨️',
    titulo: 'Guardar, imprimir y PDF',
    aprendizaje:
      'Guardar contra guardar como, elegir la carpeta a conciencia, la vista previa antes de imprimir, y por qué se manda un PDF y no el documento.',
  },
  {
    id: 'of-word-estilos-e-indice', app: 'word', grado: 'intermedio', estado: 'disponible', icono: '🗂️',
    titulo: 'Estilos y tabla de contenido',
    aprendizaje:
      'Que poner «Título 1» no es poner negrita grande: es marcar la estructura, y por eso el índice se genera y se actualiza solo. Se gana cuando el alumno cambia un título y ve moverse el índice.',
  },
  {
    id: 'of-word-revisa-y-comenta', app: 'word', grado: 'intermedio', estado: 'disponible', icono: '💬',
    titulo: 'Revisa y comenta',
    aprendizaje:
      'Comentarios y control de cambios: proponer sin borrar, aceptar, rechazar y responder. Es la mecánica de trabajar sobre el texto de otra persona.',
  },
  {
    id: 'of-word-busca-y-reemplaza', app: 'word', grado: 'intermedio', estado: 'disponible', icono: '🔎',
    titulo: 'Busca y reemplaza',
    aprendizaje:
      'Buscar, reemplazar todo —y el susto de reemplazar todo mal—, sinónimos y contar palabras.',
  },
  {
    id: 'of-word-correspondencia', app: 'word', grado: 'avanzado', estado: 'disponible', icono: '✉️',
    titulo: 'Combinar correspondencia',
    aprendizaje:
      'Una carta modelo más una lista igual a treinta cartas personalizadas. El concepto es plantilla más datos, que es el mismo de una consulta y el mismo de un bucle.',
  },
  {
    id: 'of-word-plantillas', app: 'word', grado: 'avanzado', estado: 'disponible', icono: '📑',
    titulo: 'Lo que sale en todas las hojas',
    aprendizaje:
      'Que lo que se escribe una vez y sale en todas las hojas —encabezado, pie y número de página— no es texto del cuerpo sino otra capa del documento. Y que una plantilla es un documento de partida ya armado, no un tema de colores.',
  },
  {
    id: 'of-word-formularios', app: 'word', grado: 'avanzado', estado: 'disponible', icono: '🔒',
    titulo: 'Formularios y protección',
    aprendizaje:
      'Campos rellenables y bloquear todo lo demás, para que quien rellene no pueda romper el documento.',
  },
  {
    id: 'of-word-coautoria', app: 'word', grado: 'avanzado', estado: 'disponible', icono: '👥',
    titulo: 'Escribir entre tres',
    aprendizaje:
      'Edición simultánea, historial de versiones y qué pasa cuando dos personas escriben en el mismo renglón. Se propone sin borrar lo de nadie, y el choque se resuelve mirando, no adivinando.',
  },

  // ── Excel ───────────────────────────────────────────────────────────────
  {
    id: 'of-excel-formato-de-celda', app: 'excel', grado: 'basico', estado: 'disponible', icono: '🔢',
    tema: 'El tipo de la celda y su formato',
    titulo: 'Número, moneda y fecha',
    aprendizaje:
      'Que una celda tiene TIPO, y que por eso «03/05» puede ser marzo o mayo y «007» se convierte en siete. Es el origen de casi todos los errores de captura.',
  },
  {
    id: 'of-excel-buscarx', app: 'excel', grado: 'intermedio', estado: 'disponible', icono: '🔗',
    tema: 'BUSCARX y las funciones de texto',
    titulo: 'Traer un dato de otra tabla',
    aprendizaje: 'BUSCARX y CONCAT: dos tablas que se hablan entre sí en vez de copiar a mano.',
  },
  {
    id: 'of-excel-validacion', app: 'excel', grado: 'intermedio', estado: 'disponible', icono: '🔽',
    tema: 'Validación de datos',
    titulo: 'Que no se pueda escribir cualquier cosa',
    aprendizaje:
      'Validación de datos: listas desplegables y rangos permitidos. Enseña a diseñar para que el otro no se equivoque.',
  },
  {
    id: 'of-excel-tablas-y-filtros', app: 'excel', grado: 'intermedio', estado: 'disponible', icono: '🧊',
    tema: 'Tablas, filtros y paneles inmovilizados',
    titulo: 'Tabla, filtros y paneles fijos',
    aprendizaje:
      'Convertir un rango en tabla, filtrar sin borrar, e inmovilizar la fila de encabezado para no perderse entre mil filas.',
  },
  /*
   * ── LAS CUATRO DEL §45.3, decididas el 13-ago-2026 ─────────────────────────
   *
   * El grado Avanzado tenía cuatro clases para quince bloques del temario y
   * siete se quedaban sin casa. Éstas son las cuatro que faltaban, y van
   * primero porque van antes: no se audita una fórmula que no se ha escrito, y
   * no se resume en una dinámica una tabla que todavía tiene duplicados.
   */
  {
    id: 'of-excel-datos-limpios', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🧽',
    tema: 'Datos limpios: duplicados, relleno rápido y formato personalizado',
    titulo: 'Antes de calcular, limpia',
    aprendizaje:
      'Quitar duplicados, partir una columna con el relleno rápido y darle a un número el formato que le toca. Media hoja mal hecha son datos sucios, no fórmulas malas.',
  },
  {
    id: 'of-excel-auditoria', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🔎',
    tema: 'Auditoría de fórmulas y los errores de Excel',
    titulo: 'Por qué esta celda dice eso',
    aprendizaje:
      'Rastrear de dónde sale un número, leer #¡REF!, #¡DIV/0! y #¿NOMBRE? en vez de asustarse, y por qué SI.ERROR no se usa para tapar un error sin haberlo mirado.',
  },
  {
    id: 'of-excel-consolida-y-protege', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🔐',
    tema: 'Consolidación y protección',
    titulo: 'Juntar hojas y cerrar con llave',
    aprendizaje:
      'Tres grupos entregan sus datos en tres hojas iguales y las juntas en una sola con fórmulas que se recalculan solas; después proteges la hoja, un rango y la estructura del libro, dejando escribir sólo donde toca, que es lo que se hace cuando la hoja la va a llenar otra persona.',
  },
  {
    id: 'of-excel-y-si', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🎚️',
    tema: 'Análisis Y si (buscar objetivo y escenarios)',
    titulo: '¿Y si fuera de otra manera?',
    aprendizaje:
      'Buscar objetivo y escenarios: preguntarle a la hoja «¿cuánto tendría que vender para llegar a esto?» en vez de ir probando números a mano.',
  },
  {
    id: 'of-excel-tabla-dinamica', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🔄',
    tema: 'Tablas dinámicas',
    titulo: 'Tu primera tabla dinámica',
    aprendizaje:
      'Resumir mil filas en cinco sin escribir una fórmula, y entender que arrastrar un campo a filas o a columnas es hacer una pregunta distinta.',
  },
  {
    id: 'of-excel-grafico-dinamico', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '📈',
    tema: 'Gráficos dinámicos y segmentación',
    titulo: 'Gráfico dinámico y segmentación',
    aprendizaje: 'Que el gráfico obedezca al filtro, y los botones de segmentación como mando.',
  },
  {
    id: 'of-excel-macros', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '⏺️',
    tema: 'Macros (grabar, ejecutar, asignar)',
    titulo: 'Graba tu primera macro',
    aprendizaje:
      'Grabar, ejecutar y asignar a un botón. Es programar sin escribir código, y el puente natural hacia el Python de N7.',
  },
  {
    id: 'of-excel-dashboard', app: 'excel', grado: 'avanzado', estado: 'disponible', icono: '🧮',
    tema: 'Un tablero de una sola pantalla',
    titulo: 'Un tablero de una sola pantalla',
    aprendizaje:
      'Qué va arriba, qué va grande y qué sobra. No enseña ninguna herramienta nueva: obliga a elegir entre las veintidós anteriores, y a borrar lo que no contesta ninguna pregunta. Cierra la sala de Excel y el eje de datos del bachillerato.',
  },

  // ── PowerPoint ──────────────────────────────────────────────────────────
  {
    id: 'of-ppt-presenta-y-comparte', app: 'powerpoint', grado: 'basico', estado: 'disponible', icono: '🎤',
    titulo: 'Modo presentador y PDF',
    aprendizaje:
      'Que la pantalla del que presenta y la del público son distintas: notas y siguiente diapositiva de un lado, sólo la diapositiva del otro. Y exportar a PDF para mandarla.',
  },
  {
    id: 'of-ppt-ordena-el-mazo', app: 'powerpoint', grado: 'basico', estado: 'disponible', icono: '🗂️',
    titulo: 'Cuando se hace larga',
    aprendizaje:
      'Las tres vistas del programa, ordenar en el Clasificador, ocultar sin borrar y partir el mazo en secciones. Empieza la segunda tanda del §44.',
  },
  {
    id: 'of-ppt-smartart-y-graficos', app: 'powerpoint', grado: 'intermedio', estado: 'disponible', icono: '🕸️',
    titulo: 'SmartArt, tablas y gráficos',
    aprendizaje:
      'Cuándo un proceso se dibuja como diagrama y cuándo un dato se dibuja como gráfico, en vez de escribirlo en viñetas.',
  },
  {
    id: 'of-ppt-video-e-intervalos', app: 'powerpoint', grado: 'intermedio', estado: 'disponible', icono: '⏱️',
    titulo: 'Video, intervalos y ensayo',
    aprendizaje: 'Insertar video, ensayar con reloj y descubrir cuánto se tarda de verdad.',
  },
  {
    id: 'of-ppt-para-que-pantalla', app: 'powerpoint', grado: 'intermedio', estado: 'disponible', icono: '📐',
    titulo: 'El proyector del salón',
    aprendizaje:
      'Preparar la presentación para la pantalla donde se va a ver: 16:9 frente a 4:3, por qué el tamaño se decide antes de maquetar, y el pie que sale en todas menos en la portada.',
  },
  {
    id: 'of-ppt-formas-y-cajas', app: 'powerpoint', grado: 'intermedio', estado: 'disponible', icono: '🔷',
    titulo: 'Lo que dibujas tú',
    aprendizaje:
      'Cuadro de texto frente a marcador, formas con relleno y contorno, orden Z y agrupar, y el modelo 3D. Cierra los bloques 15, 16, 17 y 43 del §40.2.',
  },
  {
    id: 'of-ppt-patron', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🧬',
    titulo: 'El patrón de diapositivas',
    aprendizaje:
      'Cambiar una vez y que cambien las cuarenta. Es la misma idea que los estilos de Word y que una clase de CSS.',
  },
  {
    id: 'of-ppt-interactiva', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🕹️',
    titulo: 'Presentación que se navega',
    aprendizaje:
      'Hipervínculos, botones y presentación personalizada: una presentación que no va en línea recta.',
  },
  {
    id: 'of-ppt-revision', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🧐',
    titulo: 'Comentarios e inspector',
    aprendizaje: 'Revisar el trabajo de otro y limpiar los datos ocultos antes de entregar.',
  },
  {
    id: 'of-ppt-exporta-video', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🎞️',
    titulo: 'Proteger y exportar a video',
    aprendizaje: 'Convertir la presentación en un video que se ve solo, y protegerla.',
  },
  {
    id: 'of-ppt-en-papel', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🖨️',
    titulo: 'Lo que se imprime',
    aprendizaje: 'Sacarla en papel para quien te escucha y para ti, y decidir el color mirando el previo.',
  },
  {
    id: 'of-ppt-traela-hecha', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '♻️',
    titulo: 'No la hagas dos veces',
    aprendizaje: 'Traer diapositivas de otro archivo, convertir un esquema de Word y hacer el índice de un clic.',
  },
  {
    id: 'of-ppt-grabala', app: 'powerpoint', grado: 'avanzado', estado: 'disponible', icono: '🎙️',
    titulo: 'Que hable sola',
    aprendizaje: 'Grabar la presentación con tu voz, repetir sólo la diapositiva que salió mal, y quitarle la narración si al final vas tú.',
  },

  // ── Microsoft 365 ───────────────────────────────────────────────────────
  {
    id: 'of-m365-calendario', app: 'm365', grado: 'intermedio', estado: 'disponible', icono: '📅',
    titulo: 'Calendario y citas',
    aprendizaje:
      'Crear una cita, invitar, aceptar y leer el calendario de la semana. Es lo único de Outlook que la U2 de N4 no tocó.',
  },
  {
    id: 'of-m365-otra-caja', app: 'm365', grado: 'avanzado', estado: 'disponible', icono: '🔁',
    titulo: 'El mismo trabajo en otra caja',
    aprendizaje:
      'Equivalencias con Google Workspace: Docs es Word, Sheets es Excel, Slides es PowerPoint. Lo que se aprendió no era el programa, era el oficio.',
  },
  {
    id: 'of-m365-copiloto', app: 'm365', grado: 'avanzado', estado: 'disponible', icono: '🤖',
    titulo: 'Qué hace y qué no hace un copiloto',
    aprendizaje:
      'Panorama de la IA dentro de la ofimática, con el tono de §29: la IA no es real dentro de la plataforma, las respuestas son guionadas, no hay llamada a ningún modelo y no se dibuja con cara.',
  },
];

/** Una clase dentro de una sala: puede venir prestada de un nivel o ser exclusiva. */
export interface ClaseSalaOffice {
  id: string;
  titulo: string;
  estado: EstadoContenido;
  icono?: string;
  /** `null` en las exclusivas; en las prestadas, de dónde vienen. */
  origen: { nivel: number; unidad: string; unidadId: string } | null;
  /** Sólo en las exclusivas: qué enseña. */
  aprendizaje?: string;
  /**
   * El tema del currículo que cubre (§45.3). Viene de sitios distintos —de
   * `office.tema` si es prestada, de `EjercicioOffice.tema` si es exclusiva— y
   * llega aquí con un solo nombre: quien pregunta por el reparto no tiene por
   * qué saber de dónde vino la clase.
   */
  tema?: string;
}

export interface GradoSalaOffice {
  dominio: GradoDominio;
  nivelesSugeridos: number[];
  temas: string[];
  clases: ClaseSalaOffice[];
}

/**
 * Arma la sala de un programa: los tres grados con sus temas y, dentro de cada
 * uno, las clases prestadas de los niveles seguidas de las exclusivas.
 *
 * Es una DERIVACIÓN, no un catálogo guardado: recorre `CURRICULO` buscando la
 * marca `office` y añade lo que haya en `EJERCICIOS_OFFICE`. Añadir una unidad
 * de ofimática a cualquier nivel la hace aparecer aquí sola, y renombrar un id
 * no puede desincronizar nada porque no hay una segunda lista que mantener.
 * Mismo patrón que `resumenNivel()` en niveles.ts y que `calcularInsignias()`.
 */
export function getSalaOffice(app: AppOfficeId): GradoSalaOffice[] | undefined {
  const ficha = OFFICE_CURRICULO.find(a => a.id === app);
  if (!ficha) return undefined;

  const prestadas = new Map<GradoDominio, ClaseSalaOffice[]>();
  for (const nivel of CURRICULO) {
    for (const unidad of nivel.unidades) {
      for (const actividad of unidad.actividades) {
        if (actividad.office?.app !== app) continue;
        const lista = prestadas.get(actividad.office.grado) ?? [];
        lista.push({
          id: actividad.id,
          titulo: actividad.titulo,
          estado: actividad.estado,
          icono: actividad.icono,
          origen: { nivel: nivel.n, unidad: unidad.titulo, unidadId: unidad.id },
          tema: actividad.office.tema,
        });
        prestadas.set(actividad.office.grado, lista);
      }
    }
  }

  return ficha.grados.map(grado => ({
    dominio: grado.dominio,
    nivelesSugeridos: grado.nivelesSugeridos,
    temas: grado.temas,
    clases: [
      ...(prestadas.get(grado.dominio) ?? []),
      ...EJERCICIOS_OFFICE.filter(e => e.app === app && e.grado === grado.dominio).map(e => ({
        id: e.id,
        titulo: e.titulo,
        estado: e.estado,
        icono: e.icono,
        origen: null,
        aprendizaje: e.aprendizaje,
        tema: e.tema,
      })),
    ],
  }));
}

/** Cuántas clases tiene una sala y cuántas están jugables. Alimenta el pie de la tarjeta del hub. */
export function resumenSalaOffice(app: AppOfficeId): { total: number; disponibles: number } {
  const grados = getSalaOffice(app) ?? [];
  const clases = grados.flatMap(g => g.clases);
  return {
    total: clases.length,
    disponibles: clases.filter(c => c.estado === 'disponible').length,
  };
}

// ─── Consultas derivadas ──────────────────────────────────────────────────────

export function getNivelCurricular(n: number): NivelCurricular | undefined {
  return CURRICULO.find(nivel => nivel.n === n);
}

export function getUnidad(id: string): UnidadCurricular | undefined {
  for (const nivel of CURRICULO) {
    const unidad = nivel.unidades.find(u => u.id === id);
    if (unidad) return unidad;
  }
  return undefined;
}

export interface ResumenNivel {
  unidades: number;
  temas: number;
  actividadesDisponibles: number;
  tieneIA: boolean;
  tieneIntegradora: boolean;
}

export function resumenNivel(n: number): ResumenNivel {
  const nivel = getNivelCurricular(n);
  if (!nivel) return { unidades: 0, temas: 0, actividadesDisponibles: 0, tieneIA: false, tieneIntegradora: false };
  return {
    unidades: nivel.unidades.length,
    temas: nivel.unidades.reduce((acc, u) => acc + u.temas.length, 0),
    actividadesDisponibles: nivel.unidades.reduce(
      (acc, u) => acc + u.actividades.filter(a => a.estado === 'disponible').length, 0,
    ),
    tieneIA: nivel.unidades.some(u => u.eje === 'datos-ia'),
    tieneIntegradora: nivel.unidades.some(u => u.integradora === true),
  };
}

/** Todas las actividades declaradas en el currículo (para validar contra el registro, F0.4). */
export function todasLasActividades(): ActividadPlan[] {
  return CURRICULO.flatMap(nivel => nivel.unidades.flatMap(u => u.actividades));
}
