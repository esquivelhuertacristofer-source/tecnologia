/**
 * Examen de posicionamiento — banco de preguntas (demo).
 *
 * Dos preguntas por nivel (20 en total), cada una evaluando el concepto que
 * ESE nivel enseña de verdad — grounded en `NIVELES`/`data/niveles.ts`
 * (título, descripción, ejes reales de cada nivel), no relleno genérico. La
 * pregunta `a` y la `b` de un mismo nivel miran ángulos distintos de sus
 * `ejes` para que dominar el nivel por azar (25% cada una) baje a 6.25%
 * combinado — ver `motor.ts` para el porqué de exigir las dos.
 */

import type { PreguntaPosicionamiento } from './tipos';

export const PREGUNTAS_POSICIONAMIENTO: PreguntaPosicionamiento[] = [
  // ─── Nivel 1 · Descubro la tecnología ───────────────────────────────────
  {
    nivel: 1,
    id: 'a',
    pregunta: '¿Cuál de estas partes de la computadora sirve para VER lo que escribes o dibujas?',
    opciones: ['El mouse', 'El monitor', 'El teclado', 'La bocina'],
    correctaIdx: 1,
  },
  {
    nivel: 1,
    id: 'b',
    pregunta: '¿Qué debes hacer con las manos antes de usar el teclado y el mouse?',
    opciones: [
      'Lavarlas y tenerlas limpias y secas',
      'Meterlas en agua mientras escribes',
      'No importa, pueden estar mojadas',
      'Usar solo un dedo de cada mano',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 2 · Exploro mi equipo ─────────────────────────────────────────
  {
    nivel: 2,
    id: 'a',
    pregunta: '¿Dónde guardas un dibujo para poder volver a abrirlo otro día?',
    opciones: ['En una carpeta', 'En el mouse', 'En el teclado', 'En la pantalla de bienvenida'],
    correctaIdx: 0,
  },
  {
    nivel: 2,
    id: 'b',
    pregunta: '¿Qué botón usas para cerrar una ventana que ya no necesitas?',
    opciones: ['La X en la esquina', 'El mouse al revés', 'Apagar la computadora', 'Quitar el cable'],
    correctaIdx: 0,
  },
  // ─── Nivel 3 · De las máquinas a las apps ────────────────────────────────
  {
    nivel: 3,
    id: 'a',
    pregunta: '¿Qué es el software?',
    opciones: [
      'Las piezas físicas de la computadora',
      'Los programas e instrucciones que la computadora ejecuta',
      'El cable de internet',
      'La pantalla',
    ],
    correctaIdx: 1,
  },
  {
    nivel: 3,
    id: 'b',
    pregunta: 'Si en internet un desconocido te pide tus datos personales, ¿qué debes hacer?',
    opciones: [
      'Contárselo a un adulto de confianza y no responder',
      'Responder con tu dirección',
      'Aceptar y seguir platicando',
      'Compartir tu contraseña',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 4 · Creadores digitales ───────────────────────────────────────
  {
    nivel: 4,
    id: 'a',
    pregunta: 'En programación por bloques, ¿qué bloque usarías para que un personaje repita una acción varias veces?',
    opciones: ['Un bloque de "si / entonces"', 'Un bloque de "repetir"', 'Un bloque de "esperar"', 'Un bloque de "sonido"'],
    correctaIdx: 1,
  },
  {
    nivel: 4,
    id: 'b',
    pregunta: 'Para que un personaje parezca que camina, ¿qué necesitas mostrar en la pantalla uno tras otro?',
    opciones: [
      'Varios cuadros (frames) con el personaje en distintas posiciones',
      'Un solo dibujo fijo',
      'Solo el fondo, sin personaje',
      'Un texto que diga "caminando"',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 5 · Datos y proyectos ─────────────────────────────────────────
  {
    nivel: 5,
    id: 'a',
    pregunta: 'Quieres comparar de un vistazo las calificaciones de 5 compañeros. ¿Qué te conviene usar?',
    opciones: ['Una gráfica de barras', 'Un solo párrafo de texto', 'Una fotografía', 'Un dibujo libre'],
    correctaIdx: 0,
  },
  {
    nivel: 5,
    id: 'b',
    pregunta: 'Usaste IA para investigar un tema de tu proyecto. ¿Qué es lo correcto antes de usar esa información?',
    opciones: [
      'Verificarla en otra fuente confiable antes de creerla',
      'Copiarla y pegarla sin revisar',
      'Asumir que la IA nunca se equivoca',
      'No decir que usaste IA',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 6 · Integro y comparto ────────────────────────────────────────
  {
    nivel: 6,
    id: 'a',
    pregunta: 'En un videojuego sencillo por bloques, ¿qué necesitas programar para que el personaje pierda al tocar un obstáculo?',
    opciones: [
      'Una condición que detecte el choque y reste una vida',
      'Solo cambiar el color del fondo',
      'Un bloque de texto',
      'Nada, sucede automáticamente',
    ],
    correctaIdx: 0,
  },
  {
    nivel: 6,
    id: 'b',
    pregunta: 'Un robot sigue-líneas usa un sensor para saber por dónde ir. ¿Qué detecta ese sensor?',
    opciones: [
      'El contraste entre la línea y el suelo (luz o color)',
      'La temperatura del cuarto',
      'El volumen del sonido',
      'La hora del día',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 7 · Bajo el cofre ──────────────────────────────────────────────
  {
    nivel: 7,
    id: 'a',
    pregunta: 'En Python, ¿qué instrucción se usa para mostrar un mensaje en pantalla?',
    opciones: ['print()', 'show()', 'write()', 'display()'],
    correctaIdx: 0,
  },
  {
    nivel: 7,
    id: 'b',
    pregunta: '¿Cuál de estas es una contraseña segura?',
    opciones: [
      'Una combinación larga de letras, números y símbolos que nadie más conoce',
      '123456',
      'Tu propio nombre',
      'La palabra "contraseña"',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 8 · Construyo soluciones ──────────────────────────────────────
  {
    nivel: 8,
    id: 'a',
    pregunta: '¿Qué es un sensor en un proyecto de IoT (Internet de las cosas)?',
    opciones: [
      'Un componente que detecta algo del ambiente (luz, temperatura, movimiento) y lo convierte en datos',
      'Un tipo de cable de red',
      'Un lenguaje de programación',
      'Una carpeta del sistema',
    ],
    correctaIdx: 0,
  },
  {
    nivel: 8,
    id: 'b',
    pregunta: 'Antes de programar la app completa, ¿qué conviene hacer primero para probar la idea?',
    opciones: [
      'Un prototipo sencillo para probar si la idea funciona',
      'Publicarla directamente en la tienda de aplicaciones',
      'Escribir todo el código sin planear',
      'Esperar a que otra persona la haga',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 9 · Del prototipo al producto ─────────────────────────────────
  {
    nivel: 9,
    id: 'a',
    pregunta: '¿Qué lenguaje se usa principalmente para darle estructura a una página web?',
    opciones: ['HTML', 'Excel', 'Paint', 'PowerPoint'],
    correctaIdx: 0,
  },
  {
    nivel: 9,
    id: 'b',
    pregunta: 'En el diseño de un videojuego, ¿qué es una "mecánica"?',
    opciones: [
      'Una regla de cómo interactúa el jugador con el juego (saltar, disparar, sumar puntos)',
      'El color de fondo del menú',
      'El nombre del juego',
      'La música de introducción',
    ],
    correctaIdx: 0,
  },
  // ─── Nivel 10 · Perfil profesional ───────────────────────────────────────
  {
    nivel: 10,
    id: 'a',
    pregunta: '¿Qué es un modelo de IA generativa?',
    opciones: [
      'Un sistema entrenado con datos que puede crear contenido nuevo, como texto o imágenes',
      'Un tipo de impresora',
      'Un antivirus',
      'Un cable HDMI',
    ],
    correctaIdx: 0,
  },
  {
    nivel: 10,
    id: 'b',
    pregunta: "Antes de analizar un conjunto de datos, ¿por qué es importante 'limpiarlo' (quitar errores y duplicados)?",
    opciones: [
      'Porque datos con errores llevan a conclusiones equivocadas',
      'Porque así ocupan menos espacio en disco siempre',
      'No es importante, cualquier dato sirve igual',
      'Solo se limpia si el archivo es de Excel',
    ],
    correctaIdx: 0,
  },
];
