/**
 * Registro central de actividades (F0.4).
 *
 * Único lugar donde un id de actividad se resuelve a sus metadatos. El
 * componente se resuelve en `cargadores.ts`, que es el que tiene los
 * `import()` (y por qué están separados se explica más abajo, junto a
 * `ActividadRegistrada`).
 *
 * Reglas (verificadas por src/__tests__/registro-actividades.test.ts):
 *  - Toda actividad "disponible" en curriculo.ts tiene entrada aquí, y toda
 *    entrada aquí está declarada como disponible en su unidad del currículo.
 *  - meta.unidadId, meta.nivel y meta.eje coinciden con el currículo.
 */

import type { ComponentType } from 'react';
import type { ActivityMeta, ActivityProps } from '@/types/activity-contract';

/**
 * Tipo homogéneo del registro. Cada actividad define sus propios TConfig y
 * TState; en el registro se borran a `unknown` (el host no conoce mecánicas
 * internas — solo el contrato).
 */
export type ActividadComponente = ComponentType<ActivityProps<unknown, unknown>>;

export interface ActividadRegistrada {
  meta: ActivityMeta;
}

/*
 * AQUÍ YA NO ESTÁN LOS `import()` (3-sep-2026). Se fueron a `cargadores.ts`.
 *
 * Este archivo lo lee también código de servidor —la planeación docente
 * resuelve `meta` desde aquí—, y mientras los `import()` de las 197
 * actividades vivieran en él, webpack compilaba la plataforma entera para el
 * servidor: three.js, jsPDF, ProseMirror y recharts acababan dentro del Worker
 * de Cloudflare (11 MB medidos con el metafile de esbuild) sin ejecutarse
 * nunca, porque el host monta la actividad en un `useEffect`. Los metadatos se
 * quedan; los cargadores viven detrás de los dos hosts, que se montan con
 * `ssr: false`.
 */

export const REGISTRO_ACTIVIDADES: Record<string, ActividadRegistrada> = {
  'n1-conoce-las-partes': {
    meta: {
      id: 'n1-conoce-las-partes',
      titulo: 'Conoce las partes',
      nivel: 1,
      unidadId: 'n1-mi-primera-computadora',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Explora el laboratorio de Bit y descubre las partes externas de la computadora: monitor, teclado, mouse y bocinas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-dentro-del-gabinete': {
    meta: {
      id: 'n1-dentro-del-gabinete',
      titulo: 'Dentro del gabinete',
      nivel: 1,
      unidadId: 'n1-mi-primera-computadora',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Abre el gabinete con seguridad junto a Bit y descubre para qué sirve cada componente interno. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-conecta-el-equipo': {
    meta: {
      id: 'n1-conecta-el-equipo',
      titulo: 'Conecta el equipo',
      nivel: 1,
      unidadId: 'n1-mi-primera-computadora',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'Une cada cable con su puerto correcto: video, teclado, mouse y corriente. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-enciende-con-seguridad': {
    meta: {
      id: 'n1-enciende-con-seguridad',
      titulo: 'Enciende con seguridad',
      nivel: 1,
      unidadId: 'n1-mi-primera-computadora',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Sigue el orden correcto para encender la computadora sin dañarla: regulador, monitor y gabinete. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-explora-eduos': {
    meta: {
      id: 'n1-explora-eduos',
      titulo: 'Explora EduOS',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'Entra a EduOS y practica abrir, minimizar, restaurar y cerrar ventanas como en una computadora real. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-caza-clics': {
    meta: {
      id: 'n1-caza-clics',
      titulo: 'Caza clics',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Apunta, haz clic y doble clic para reventar las burbujas de la máquina arcade de Bit. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-laberinto-del-mouse': {
    meta: {
      id: 'n1-laberinto-del-mouse',
      titulo: 'Laberinto del mouse',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Arrastra sin soltar: une las estrellas y guía a Pixel por el laberinto hasta el queso. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-lluvia-de-letras': {
    meta: {
      id: 'n1-lluvia-de-letras',
      titulo: 'Lluvia de letras',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Encuentra cada tecla y atrapa la lluvia: vocales, las letras de tu nombre y los números. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-teclas-gigantes': {
    meta: {
      id: 'n1-teclas-gigantes',
      titulo: 'Teclas gigantes',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Desbloquea los superpoderes de espacio, Enter y borrar en el circuito de teclas gigantes. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-mapa-de-flechas': {
    meta: {
      id: 'n1-mapa-de-flechas',
      titulo: 'Mapa de flechas',
      nivel: 1,
      unidadId: 'n1-mouse-y-teclado',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Mueve a Bit con las flechas de dirección: junta estrellas, esquiva charcos y llega al tesoro. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-ordena-los-pasos': {
    meta: {
      id: 'n1-ordena-los-pasos',
      titulo: 'Ordena los pasos',
      nivel: 1,
      unidadId: 'n1-pienso-paso-a-paso',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Arma recetas de pasos en la máquina de Bit: sigue, ordena y prueba secuencias hasta el sándwich del robot. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-sigue-el-patron': {
    meta: {
      id: 'n1-sigue-el-patron',
      titulo: 'Sigue el patrón',
      nivel: 1,
      unidadId: 'n1-pienso-paso-a-paso',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Descubre qué sigue en el tren de patrones, repite los ritmos de la botonera y clasifica tesoros en sus cajas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-quien-usa-que': {
    meta: {
      id: 'n1-quien-usa-que',
      titulo: '¿Quién usa qué?',
      nivel: 1,
      unidadId: 'n1-pienso-paso-a-paso',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Devuelve a cada oficio su herramienta, arregla el taller que revolvió Glitch y entrega la herramienta de todos: la computadora. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-utiliza-programas': {
    meta: {
      id: 'n1-utiliza-programas',
      titulo: 'Utiliza programas',
      nivel: 1,
      unidadId: 'n1-creo-con-la-compu',
      eje: 'creatividad',
      duracionMin: 12,
      descripcion:
        'Usa Texto Fácil, Paint y Calculadora dentro de EduOS: escribe, dibuja, calcula y guarda tus archivos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-pinta-con-la-compu': {
    meta: {
      id: 'n1-pinta-con-la-compu',
      titulo: 'Pinta con la compu',
      nivel: 1,
      unidadId: 'n1-creo-con-la-compu',
      eje: 'creatividad',
      duracionMin: 7,
      descripcion:
        'Pinta en la cabina de Bit: traza con el pincel, estampa formas con los sellos y termina tu obra con el relleno mágico. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-guarda-tu-obra': {
    meta: {
      id: 'n1-guarda-tu-obra',
      titulo: 'Guarda tu obra de arte',
      nivel: 1,
      unidadId: 'n1-creo-con-la-compu',
      eje: 'creatividad',
      duracionMin: 7,
      descripcion:
        'Ponle nombre a tu obra, guárdala en la bóveda de Bit y vuelve a abrirla: el ciclo completo de los artistas digitales. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-semaforo-de-pantalla': {
    meta: {
      id: 'n1-semaforo-de-pantalla',
      titulo: 'El semáforo de la pantalla',
      nivel: 1,
      unidadId: 'n1-uso-seguro-y-saludable',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Enciende la luz correcta en la torre del semáforo, arma un día equilibrado y ejecuta la rutina de descanso que cuida tus ojos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-pide-ayuda': {
    meta: {
      id: 'n1-pide-ayuda',
      titulo: 'Pido ayuda a un adulto',
      nivel: 1,
      unidadId: 'n1-uso-seguro-y-saludable',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Elige a tu equipo de confianza, presiona el botón de AYUDA ante las pantallas raras y aprende el plan del valiente: alto, aviso, juntos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-mis-datos-son-un-tesoro': {
    meta: {
      id: 'n1-mis-datos-son-un-tesoro',
      titulo: 'Mis datos son un tesoro',
      nivel: 1,
      unidadId: 'n1-uso-seguro-y-saludable',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Guarda tus datos personales en el cofre de Bit, forja tu llave secreta y no dejes que nadie te saque un tesoro. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n1-mision-final': {
    meta: {
      id: 'n1-mision-final',
      titulo: 'Misión final',
      nivel: 1,
      unidadId: 'n1-mi-primera-computadora',
      eje: 'sistemas',
      duracionMin: 15,
      descripcion:
        'Demuestra todo lo aprendido: identifica, conecta, enciende y usa la computadora sin ayuda constante. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-safari-de-dispositivos': {
    meta: {
      id: 'n2-safari-de-dispositivos',
      titulo: 'Safari de dispositivos',
      nivel: 2,
      unidadId: 'n2-dispositivos-a-mi-alrededor',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Reconoce por su silueta a la computadora, la laptop, la tablet, el smartphone y la smart TV, y acomódalos según su tamaño. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-entrada-o-salida': {
    meta: {
      id: 'n2-entrada-o-salida',
      titulo: '¿Entrada o salida?',
      nivel: 2,
      unidadId: 'n2-dispositivos-a-mi-alrededor',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Clasifica cada dispositivo en la banda de Bit: ¿le da información a la compu o se la devuelve? Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-donde-viven-mis-archivos': {
    meta: {
      id: 'n2-donde-viven-mis-archivos',
      titulo: '¿Dónde viven mis archivos?',
      nivel: 2,
      unidadId: 'n2-dispositivos-a-mi-alrededor',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Encuentra la casa de cada archivo entre mi compu, la USB y la nube, y sigue su viaje de una casa a otra. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-explora-tu-teclado': {
    meta: {
      id: 'n2-explora-tu-teclado',
      titulo: 'Explora tu teclado',
      nivel: 2,
      unidadId: 'n2-teclado-y-mecanografia',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Descubre las cuatro zonas escondidas en tu teclado: letras, números, flechas y teclas especiales. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-mayusculas-y-acentos': {
    meta: {
      id: 'n2-mayusculas-y-acentos',
      titulo: 'Mayúsculas y acentos',
      nivel: 2,
      unidadId: 'n2-teclado-y-mecanografia',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Aprende cuándo usar mayúscula y cómo completar palabras con su acento o su ñ. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-escribe-a-dos-manos': {
    meta: {
      id: 'n2-escribe-a-dos-manos',
      titulo: 'Escribe a dos manos',
      nivel: 2,
      unidadId: 'n2-teclado-y-mecanografia',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Descubre qué mano usa cada tecla y escribe tus primeras palabras a dos manos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-abre-y-cierra-ventanas': {
    meta: {
      id: 'n2-abre-y-cierra-ventanas',
      titulo: 'Abre y cierra ventanas',
      nivel: 2,
      unidadId: 'n2-ventanas-archivos-carpetas',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Descubre qué botón abre, guarda a un lado o cierra una ventana, y aprende a cambiar entre varios programas abiertos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-guarda-y-encuentra': {
    meta: {
      id: 'n2-guarda-y-encuentra',
      titulo: 'Guarda y encuentra tu trabajo',
      nivel: 2,
      unidadId: 'n2-ventanas-archivos-carpetas',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Ponle a tu trabajo un nombre que describa lo que hiciste y luego encuéntralo dentro del archivero. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-laberinto-de-bloques': {
    meta: {
      id: 'n2-laberinto-de-bloques',
      titulo: 'El laberinto de bloques',
      nivel: 2,
      unidadId: 'n2-algoritmos-con-juegos',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Arma la tira completa de bloques de avanzar y girar para guiar al robot de Bit, paso a paso, hasta la meta. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-caza-el-error': {
    meta: {
      id: 'n2-caza-el-error',
      titulo: 'Caza el error',
      nivel: 2,
      unidadId: 'n2-algoritmos-con-juegos',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Busca el bloque equivocado en una tira de programa casi correcta y corrígelo para que el robot llegue a la meta. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-repite-repite': {
    meta: {
      id: 'n2-repite-repite',
      titulo: '¡Repite, repite! (bucles)',
      nivel: 2,
      unidadId: 'n2-algoritmos-con-juegos',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Descubre el bloque repetir y combínalo con giros y avances para recorrer caminos larguísimos con menos piezas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-mis-primeras-oraciones': {
    meta: {
      id: 'n2-mis-primeras-oraciones',
      titulo: 'Mis primeras oraciones',
      nivel: 2,
      unidadId: 'n2-escribo-y-dibujo',
      eje: 'creatividad',
      duracionMin: 12,
      descripcion:
        'Escribe tus primeras oraciones en un documento de verdad: mayúscula al empezar, un espacio entre palabra y palabra y punto al terminar. Las tres las pone el alumno con las teclas, no la máquina. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-viste-tus-letras': {
    meta: {
      id: 'n2-viste-tus-letras',
      titulo: 'Viste tus letras',
      nivel: 2,
      unidadId: 'n2-escribo-y-dibujo',
      eje: 'creatividad',
      duracionMin: 12,
      descripcion:
        'Viste las letras de la portada de tu cuento con negrita, cursiva, tamaño y color. La regla que se aprende aquí es que el formato actúa sobre lo que está seleccionado: con el cursor suelto no pasa nada. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-cuento-ilustrado': {
    meta: {
      id: 'n2-cuento-ilustrado',
      titulo: 'Mi cuento ilustrado',
      nivel: 2,
      unidadId: 'n2-escribo-y-dibujo',
      eje: 'creatividad',
      duracionMin: 12,
      descripcion:
        'Ponle título a tu cuento, escríbele el final y elige el dibujo que cuenta lo mismo que dice el texto —no el más bonito, el que cuenta lo mismo. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-secreto-o-publico': {
    meta: {
      id: 'n2-secreto-o-publico',
      titulo: '¿Secreto o público?',
      nivel: 2,
      unidadId: 'n2-ciudadania-digital',
      eje: 'ciudadania',
      duracionMin: 10,
      descripcion:
        'Clasifica cada dato en la banda con la charola de candado o de megáfono, y decide antes de responder un mensaje. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-con-quien-hablo': {
    meta: {
      id: 'n2-con-quien-hablo',
      titulo: '¿Con quién sí hablo en línea?',
      nivel: 2,
      unidadId: 'n2-ciudadania-digital',
      eje: 'ciudadania',
      duracionMin: 10,
      descripcion:
        'Conecta la clavija de la centralita solo con tu gente de confianza y presiona AYUDA ante un desconocido. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n2-heroes-del-respeto': {
    meta: {
      id: 'n2-heroes-del-respeto',
      titulo: 'Héroes del respeto',
      nivel: 2,
      unidadId: 'n2-ciudadania-digital',
      eje: 'ciudadania',
      duracionMin: 10,
      descripcion:
        'Elige la máscara con la respuesta respetuosa en cada escena del escenario y ejecuta el plan del héroe ante el mal trato. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 1 «Historia de la computación» (documento §16) ── */
  'n3-viaje-en-el-tiempo': {
    meta: {
      id: 'n3-viaje-en-el-tiempo',
      titulo: 'Viaje en el tiempo tecnológico',
      nivel: 3,
      unidadId: 'n3-historia-de-la-computacion',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Ordena seis máquinas históricas en la línea del tiempo del museo de Bit, del ábaco al smartphone. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-generaciones-de-compus': {
    meta: {
      id: 'n3-generaciones-de-compus',
      titulo: 'Las generaciones de las compus',
      nivel: 3,
      unidadId: 'n3-historia-de-la-computacion',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Clasifica seis máquinas en las vitrinas de bulbos, transistores y microchips y descubre por qué las compus encogieron. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-conoce-a-los-inventores': {
    meta: {
      id: 'n3-conoce-a-los-inventores',
      titulo: 'Conoce a los inventores',
      nivel: 3,
      unidadId: 'n3-historia-de-la-computacion',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Empareja en la galería del museo a Babbage, Ada Lovelace, Alan Turing y Grace Hopper con su aporte. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 2 «Hardware y software» (documento §17) ── */
  'n3-hardware-o-software': {
    meta: {
      id: 'n3-hardware-o-software',
      titulo: '¿Hardware o software?',
      nivel: 3,
      unidadId: 'n3-hardware-y-software',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Separa en la mesa de dos mundos ocho cosas entre lo que se toca y lo que se ejecuta en la pantalla. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-explora-el-escritorio': {
    meta: {
      id: 'n3-explora-el-escritorio',
      titulo: 'Explora el escritorio',
      nivel: 3,
      unidadId: 'n3-hardware-y-software',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Reconoce en el monitor encendido los íconos, la ventana abierta, la barra de tareas y el botón de cerrar. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-carpetas-y-atajos': {
    meta: {
      id: 'n3-carpetas-y-atajos',
      titulo: 'Carpetas y atajos',
      nivel: 3,
      unidadId: 'n3-hardware-y-software',
      eje: 'sistemas',
      duracionMin: 7,
      descripcion:
        'Guarda seis archivos en los cajones del archivero y domina el atajo Ctrl + C y Ctrl + V. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 3 «Internet seguro» (documento §18) ── */
  'n3-que-es-internet': {
    meta: {
      id: 'n3-que-es-internet',
      titulo: '¿Qué es internet?',
      nivel: 3,
      unidadId: 'n3-internet-seguro',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Tiende los cables del mapa de la red, mira viajar un paquete de información y abre una página con el navegador. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-busca-con-palabras-clave': {
    meta: {
      id: 'n3-busca-con-palabras-clave',
      titulo: 'Busca con palabras clave',
      nivel: 3,
      unidadId: 'n3-internet-seguro',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Deja en la ranura de la consola solo las palabras clave de tres búsquedas y encuentra la respuesta exacta. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-detector-de-sitios-confiables': {
    meta: {
      id: 'n3-detector-de-sitios-confiables',
      titulo: 'Detector de sitios confiables',
      nivel: 3,
      unidadId: 'n3-internet-seguro',
      eje: 'ciudadania',
      duracionMin: 7,
      descripcion:
        'Lee las señales de cinco sitios en el detector y baja la palanca verde o roja según sean confiables o sospechosos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-netiqueta-y-contrasenas': {
    meta: {
      id: 'n3-netiqueta-y-contrasenas',
      titulo: 'Netiqueta y contraseñas',
      nivel: 3,
      unidadId: 'n3-internet-seguro',
      eje: 'ciudadania',
      duracionMin: 8,
      descripcion:
        'Elige los mensajes de buen trato en el muro de netiqueta y arma en la caja fuerte una contraseña larga y mezclada. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 4 «Programación en bloques I (Scratch)» (documento §19) ── */
  'n3-conoce-scratch': {
    meta: {
      id: 'n3-conoce-scratch',
      titulo: 'Conoce Scratch',
      nivel: 3,
      unidadId: 'n3-bloques-1-scratch',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Recorre el estudio de bloques: toca el escenario, el personaje y los disfraces, y vístele una pose nueva al gato. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-eventos-y-movimiento': {
    meta: {
      id: 'n3-eventos-y-movimiento',
      titulo: 'Eventos y movimiento',
      nivel: 3,
      unidadId: 'n3-bloques-1-scratch',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Encaja bloques de evento, movimiento y repetición en el riel del estudio y presiona la bandera verde para verlos correr. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-mi-primera-animacion': {
    meta: {
      id: 'n3-mi-primera-animacion',
      titulo: 'Mi primera animación',
      nivel: 3,
      unidadId: 'n3-bloques-1-scratch',
      eje: 'programacion',
      duracionMin: 7,
      descripcion:
        'Elige dos disfraces con apoyos distintos, arma un bucle que los alterne y haz que el gato cruce el escenario caminando. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 5 «Procesador de textos I» (documento §20) ── */
  'n3-dale-formato': {
    meta: {
      id: 'n3-dale-formato',
      titulo: 'Dale formato',
      nivel: 3,
      unidadId: 'n3-procesador-de-textos-1',
      eje: 'creatividad',
      duracionMin: 14,
      descripcion:
        'Pinta el texto y busca la herramienta en la cinta: negrita, cursiva, tamaño y alineación, hasta dejar el reporte impecable. Y un título que Word reconozca como título, que no es lo mismo que negrita más grande. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-ortografia-e-imagenes': {
    meta: {
      id: 'n3-ortografia-e-imagenes',
      titulo: 'Ortografía e imágenes',
      nivel: 3,
      unidadId: 'n3-procesador-de-textos-1',
      eje: 'creatividad',
      duracionMin: 15,
      descripcion:
        'Revisa las palabras que el corrector subraya en rojo —una está bien escrita y el corrector se equivoca— y coloca la imagen que sí ayuda a entender el texto. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-la-fila-guia': {
    meta: {
      id: 'n3-la-fila-guia',
      titulo: 'La fila guía',
      nivel: 3,
      unidadId: 'n3-procesador-de-textos-1',
      eje: 'creatividad',
      duracionMin: 12,
      descripcion:
        'Apoya los dedos en la fila guía y teclea tres rondas sobre un documento de verdad, siguiendo en el teclado de la pantalla qué dedo va a cada tecla. Sin cronómetro. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 3 · Unidad 6 «La IA a mi alrededor» (documento §21) ── */
  'n3-la-ia-en-mi-dia': {
    meta: {
      id: 'n3-la-ia-en-mi-dia',
      titulo: 'La IA en mi día',
      nivel: 3,
      unidadId: 'n3-la-ia-a-mi-alrededor',
      eje: 'datos-ia',
      duracionMin: 7,
      descripcion:
        'Recorre la vitrina de la Sala de la IA: separa los tres aparatos que usan inteligencia artificial de los que no y pruébalos uno por uno. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-piensan-las-maquinas': {
    meta: {
      id: 'n3-piensan-las-maquinas',
      titulo: '¿Piensan las máquinas?',
      nivel: 3,
      unidadId: 'n3-la-ia-a-mi-alrededor',
      eje: 'datos-ia',
      duracionMin: 7,
      descripcion:
        'Clasifica ocho tarjetas en el mueble de la sala: lo que la IA sí puede hacer y lo que no hace como una persona. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n3-la-ia-se-equivoca': {
    meta: {
      id: 'n3-la-ia-se-equivoca',
      titulo: 'La IA se equivoca',
      nivel: 3,
      unidadId: 'n3-la-ia-a-mi-alrededor',
      eje: 'datos-ia',
      duracionMin: 7,
      descripcion:
        'Lee las cinco respuestas de la pantalla de IA y baja la balanza de la verdad hacia acierto o hacia error; al cazar un fallo aparece la corrección. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 4 · Unidad 1 «¿Cómo funciona internet?» (documento §23) ── */
  'n4-el-viaje-de-un-mensaje': {
    meta: {
      id: 'n4-el-viaje-de-un-mensaje',
      titulo: 'El viaje de un mensaje',
      nivel: 4,
      unidadId: 'n4-como-funciona-internet',
      eje: 'sistemas',
      duracionMin: 8,
      descripcion:
        'Lleva el paquete de datos por las cinco escalas de la maqueta de la red y arma después la dirección https://tecnia.mx pieza por pieza. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-busca-y-compara': {
    meta: {
      id: 'n4-busca-y-compara',
      titulo: 'Busca y compara fuentes',
      nivel: 4,
      unidadId: 'n4-como-funciona-internet',
      eje: 'sistemas',
      duracionMin: 9,
      descripcion:
        'Tres páginas responden la misma pregunta y no dicen lo mismo: marca sus nueve señales de confianza y de alerta, elige la más confiable y resuelve la contradicción. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-que-es-la-nube': {
    meta: {
      id: 'n4-que-es-la-nube',
      titulo: '¿Qué es la nube?',
      nivel: 4,
      unidadId: 'n4-como-funciona-internet',
      eje: 'sistemas',
      duracionMin: 9,
      descripcion:
        'Reparte seis archivos entre el gabinete de tu casa y la torre de la nube, predice qué le pasa a cada montón cuando se rompe la laptop o se va el internet, y decide qué guardar arriba, qué guardar abajo y qué no subir nunca. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · U2 «Correo y comunicación» (documento §24) ──
  'n4-mi-primera-cuenta': {
    meta: {
      id: 'n4-mi-primera-cuenta',
      titulo: 'Mi primera cuenta (supervisada)',
      nivel: 4,
      unidadId: 'n4-correo-y-comunicacion',
      eje: 'ciudadania',
      duracionMin: 9,
      descripcion:
        'Cuelga el gafete del adulto para abrir el mostrador, pasa cuatro nombres de usuario por el lector y señala el dato que delata a cada uno, forja una contraseña prediciendo si cada ingrediente sube o baja el medidor, y contesta los cuatro sobres que piden algo de tu cuenta. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n4-partes-del-correo': {
    meta: {
      id: 'n4-partes-del-correo',
      titulo: 'Las partes del correo',
      nivel: 4,
      unidadId: 'n4-correo-y-comunicacion',
      eje: 'ciudadania',
      duracionMin: 9,
      descripcion:
        'Enciende el monitor de la estación y entra a «Tecnia Correo»: encuentra las cinco partes de un correo que ya llegó, llena tú solo los cinco huecos de uno nuevo —cada trozo en su hueco, y el que se equivoca te dice por qué— y deja la libreta de direcciones sin una sola rota. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n4-envia-responde-adjunta': {
    meta: {
      id: 'n4-envia-responde-adjunta',
      titulo: 'Envía, responde y adjunta',
      nivel: 4,
      unidadId: 'n4-correo-y-comunicacion',
      eje: 'ciudadania',
      duracionMin: 9,
      descripcion:
        'Vuelve a «Tecnia Correo»: di con cuál de los tres botones se empieza cada encargo —y el que falla te dice qué habría pasado—, manda dos correos de verdad eligiendo cada campo, y rescata los tres borradores de la carpeta antes de que salgan con el clip mal: el que no se pegó, el equivocado y el que no cabe. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n4-videollamadas-con-respeto': {
    meta: {
      id: 'n4-videollamadas-con-respeto',
      titulo: 'Videollamadas con respeto',
      nivel: 4,
      unidadId: 'n4-correo-y-comunicacion',
      eje: 'ciudadania',
      duracionMin: 9,
      descripcion:
        'Entra a «Tecnia Reunión» desde la cabina de la oficina: deja bien las cuatro comprobaciones de la antesala —y la luz y el fondo se arreglan moviendo la lámpara y el biombo de tu mesa, que la vista previa enseña en vivo—, resuelve los cinco momentos de la reunión con la barra de controles del programa, y cuida la puerta de coanfitriona diciendo por qué dejas pasar a cada quien. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · U3 «Programación en bloques II» (documento §25) ──
  'n4-si-pasa-esto': {
    meta: {
      id: 'n4-si-pasa-esto',
      titulo: 'Si pasa esto… (condicionales)',
      nivel: 4,
      unidadId: 'n4-bloques-2',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Abre «Tecnia Bloques» en el monitor del Laboratorio de Juegos y resuelve tres retos que se prueban de verdad en la vitrina de al lado: mete el bloque «si» dentro del por siempre para que recoja la moneda sólo cuando la esté tocando, elige entre cuatro piezas la única que avisa de la pared —dos rebotan por su forma y una entra y falla—, y arma los dos caminos del «si… si no…». El bloque que se está ejecutando se enciende en ámbar. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-variables-y-puntajes': {
    meta: {
      id: 'n4-variables-y-puntajes',
      titulo: 'Variables y puntajes',
      nivel: 4,
      unidadId: 'n4-bloques-2',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Tu juego ya decide, pero no lleva la cuenta. Fabrica en «Tecnia Bloques» una variable con el nombre que tú le pongas —el diálogo rechaza «x», «cosa» y los nombres con números dentro— y resuelve tres retos que se ven en el tablero de aeropuerto colgado sobre la vitrina: que el marcador empiece en cero de verdad, que sume un punto sólo dentro del «si» que toca la moneda, y que aparezca ¡GANASTE! cuando la cuenta llegue a cinco. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-crea-tu-videojuego': {
    meta: {
      id: 'n4-crea-tu-videojuego',
      titulo: 'Crea tu videojuego',
      nivel: 4,
      unidadId: 'n4-bloques-2',
      eje: 'programacion',
      duracionMin: 12,
      descripcion:
        'El proyecto integrador de la unidad: la vitrina se vuelve cancha —piso cuadriculado, cinco monedas y una criaturita que patrulla— y en «Tecnia Bloques» armas las cuatro reglas que hacen un videojuego, una por una y probándolas al vuelo. Cómo se mueve con las flechas, qué pasa al recoger la moneda, qué pasa si te atrapan y cómo se gana. Con las cuatro puestas, Bit te suelta el mando: la actividad no se cierra hasta que juegues tú y llegues a los cinco puntos. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-depura-tu-juego': {
    meta: {
      id: 'n4-depura-tu-juego',
      titulo: 'Depura tu juego',
      nivel: 4,
      unidadId: 'n4-bloques-2',
      eje: 'programacion',
      duracionMin: 10,
      descripcion:
        'Bit te presta tres juegos que armó él… y los tres están rotos. No falta ninguna pieza: en cada uno hay una mal puesta. Con la palanca de PROBAR miras qué hace de raro, con la lupa señalas el bloque culpable y eliges entre tres tarjetas con qué cambiarlo —y vuelves a probar, porque arreglar no es haber cambiado algo, es haberlo visto funcionar. Un marcador que sube solo, un muñeco que se teletransporta y una moneda que castiga: tres bugs y la insignia de Cazador de bugs. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · U4 «Procesador de textos II» (documento §26) ──
  'n4-tablas-y-columnas': {
    meta: {
      id: 'n4-tablas-y-columnas',
      titulo: 'Tablas y columnas',
      nivel: 4,
      unidadId: 'n4-procesador-de-textos-2',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'Hoy no escribes: acomodas, que es otra cosa y se nota desde lejos. Insertas una tabla contando bien cuántas filas y cuántas columnas hacen falta, la encabezas con nombres que sí dicen qué guarda cada columna, la pones en negrita y escribes cada dato en su celda saltando con el tabulador. Después repartes el párrafo en dos columnas y decides, en tres casos, si conviene una o dos. Insignia de Arquitecto de tablas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-formas-y-wordart': {
    meta: {
      id: 'n4-formas-y-wordart',
      titulo: 'Formas, WordArt e imágenes',
      nivel: 4,
      unidadId: 'n4-procesador-de-textos-2',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'El documento amanece en blanco: hoy compones la PORTADA del folleto. Conviertes el título en título artístico y eliges su estilo viéndolo puesto, y lo compruebas bajándole el zoom a la página, porque un título que no se lee de lejos no sirve aunque se vea bonito. Marcas con una forma el dato que importa —una flecha y un globo de diálogo no dicen lo mismo—, y terminas colocando la foto junto a su renglón y agrandándola siempre desde una esquina. Insignia de Artista del título. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-documento-de-varias-paginas': {
    meta: {
      id: 'n4-documento-de-varias-paginas',
      titulo: 'Documentos de varias páginas',
      nivel: 4,
      unidadId: 'n4-procesador-de-textos-2',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'Tu monografía del desierto no cabe en una hoja, y ahí empieza todo. Aprendes a empezar una hoja nueva sin llenar la anterior de renglones vacíos, a escribir el encabezado una sola vez para que salga en todas, y a poner el número de página, que no se teclea: se inserta, y cambia solo en cada hoja. Insignia de Documento largo. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · U5 «Presentaciones I» (documento §27, reescrito §40) ──
  'n4-tus-primeras-diapositivas': {
    meta: {
      id: 'n4-tus-primeras-diapositivas',
      titulo: 'Tus primeras diapositivas',
      nivel: 4,
      unidadId: 'n4-presentaciones-1',
      eje: 'creatividad',
      duracionMin: 14,
      descripcion:
        'Abres Tecnia Diapositivas con la presentación vacía y la llenas tú: la portada de la mano, con el aro señalándote cada botón, y luego tres ideas más eligiendo tú el acomodo que le va a cada una —dos columnas para comparar, una foto grande cuando la imagen es la idea—. Al final miras la tira, descubres que la historia no se entiende en ese orden y la arreglas arrastrando. Insignia de Director de diapositivas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-imagenes-y-texto': {
    meta: {
      id: 'n4-imagenes-y-texto',
      titulo: 'Imágenes y texto que se entienden',
      nivel: 4,
      unidadId: 'n4-presentaciones-1',
      eje: 'creatividad',
      duracionMin: 14,
      descripcion:
        'Bit te sienta en la última butaca del auditorio y desde ahí tu presentación del desierto no aguanta: un muro de texto que ni cabe en su caja, un título chiquito y de un color que se pierde, y una diapositiva que promete una foto y no la trae. Recortas, agrandas, arreglas el contraste y eliges entre tres imágenes bonitas la única que de verdad apoya lo que cuentas. Insignia de Ojo del público. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n4-presenta-al-grupo': {
    meta: {
      id: 'n4-presenta-al-grupo',
      titulo: 'Presenta frente al grupo',
      nivel: 4,
      unidadId: 'n4-presentaciones-1',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'Hoy no tocas la presentación: la das. Preparas tus notas del presentador —lo que lees tú y el público no ve—, ensayas las cuatro a pantalla completa con un medidor de ritmo que avisa si vas corriendo o te eternizas, y entonces se apaga la luz del salón: butacas llenas, tu atril con tus notas encima y la pantalla encendida a tu espalda. Cuatro decisiones en vivo, ninguna con aro. Si te das la vuelta a leer, lo vas a oír. Insignia de Voz del auditorio. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · U6 «Seguridad digital» ──
  'n4-virus-y-antivirus': {
    meta: {
      id: 'n4-virus-y-antivirus',
      titulo: 'Virus y antivirus',
      nivel: 4,
      unidadId: 'n4-seguridad-digital',
      eje: 'ciudadania',
      duracionMin: 13,
      descripcion:
        'Enciendes Tecnia Antivirus, analizas los diez programas instalados y revisas cada uno por sus tres caras: lo que dice que hace, los permisos que pide y lo que hace de verdad. El antivirus marca "limpio" uno que no lo es —lo cazas tú, mirando su comportamiento y no su etiqueta— y decides, programa por programa, si se queda, se revisa con un adulto o se va. Insignia de Guardián del equipo. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n4-atrapa-el-phishing': {
    meta: {
      id: 'n4-atrapa-el-phishing',
      titulo: 'Atrapa el phishing',
      nivel: 4,
      unidadId: 'n4-seguridad-digital',
      eje: 'ciudadania',
      duracionMin: 14,
      descripcion:
        'Abres la bandeja de Sofi en Tecnia Correo con diez correos sin decidir: cinco de verdad y cinco anzuelos. Antes de decidir cada uno puedes mirar cuatro cosas —quién escribe de verdad, a dónde va el enlace de verdad, qué te piden y con qué prisa—. No todo lo raro es falso: la maestra escribe con faltas, la biblioteca te manda a una página y Diego grita con prisa, y los tres son de verdad; y hay uno sin una sola falta, con el escudo de la escuela y con la dirección cambiada por un pelo (un «.com» de más) que es mentira. Si caes, el programa te enseña qué había que mirar en vez de regañarte. Insignia de Detector de anzuelos. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n4-si-algo-me-incomoda': {
    meta: {
      id: 'n4-si-algo-me-incomoda',
      titulo: 'Si algo me incomoda en línea',
      nivel: 4,
      unidadId: 'n4-seguridad-digital',
      eje: 'ciudadania',
      duracionMin: 14,
      descripcion:
        'Entra a Tecnia Mensajes y vive cinco conversaciones que empiezan normales y se van torciendo: decide qué contestar, cuándo no contestar y cuándo pedir ayuda —si te equivocas, se te explica y lo intentas otra vez, aquí nunca se pierde—, reconoce la señal más importante de todas y cierra eligiendo, entre varios adultos de confianza, a quién se lo cuentas. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · «Aprendo con la IA» — primera parada: preguntar con supervisión ──
  'n4-pregunta-a-la-ia': {
    meta: {
      id: 'n4-pregunta-a-la-ia',
      titulo: 'Pregunta a la IA',
      nivel: 4,
      unidadId: 'n4-aprendo-con-la-ia',
      eje: 'datos-ia',
      duracionMin: 13,
      descripcion:
        'Abres Tecnia Asistente y armas la misma pregunta de ocho maneras: vaga o específica, cambiando para qué la quieres y para quién es, y probando qué tan larga la pides. Le preguntas algo que solo tú sabes de tu escuela y descubres que contesta tan segura estando mal como estando bien, sin avisar. Y aprendes qué no se le cuenta nunca a un asistente. Insignia de Detective de la IA. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · «Aprendo con la IA» — segunda parada: comparar con otras fuentes ──
  'n4-comprueba-la-respuesta': {
    meta: {
      id: 'n4-comprueba-la-respuesta',
      titulo: 'Comprueba la respuesta',
      nivel: 4,
      unidadId: 'n4-aprendo-con-la-ia',
      eje: 'datos-ia',
      duracionMin: 12,
      descripcion:
        'Tecnia Asistente le contestó a Sofi, troceado en cinco afirmaciones que se comprueban una por una en Tecnia Buscador: preguntarle otra vez al asistente no cuenta, y un blog sin firma que copia a otra página palabra por palabra tampoco. Cazas la afirmación falsa colada entre las buenas, la corriges, y descubres que el libro que el asistente recomendó no existe. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N4 · «Aprendo con la IA» — tercera parada: real o generado ──
  'n4-real-o-generado': {
    meta: {
      id: 'n4-real-o-generado',
      titulo: '¿Real o generado?',
      nivel: 4,
      unidadId: 'n4-aprendo-con-la-ia',
      eje: 'datos-ia',
      duracionMin: 15,
      descripcion:
        'Te prestan Tecnia Muro, un visor de publicaciones. Diez, una por una: al principio sólo puedes examinar la imagen —manos raras, letras que no se leen, fondos que se repiten—, pero esas pistas caducan, así que la app te va desbloqueando herramientas nuevas para ver la cuenta que publicó y si alguien más lo cuenta. Hay una foto real que miente sin estar retocada, una ilustración generada que no engaña a nadie, y una publicación donde lo correcto es decir «no estoy segura» y no compartir. Insignia de Investigador de pantalla. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── N5 · U1 «El sistema de cómputo» — parada 1: el cerebro de la compu ── */
  'n5-el-cerebro-de-la-compu': {
    meta: {
      id: 'n5-el-cerebro-de-la-compu',
      titulo: 'El cerebro de la compu',
      nivel: 5,
      unidadId: 'n5-el-sistema-de-computo',
      eje: 'sistemas',
      duracionMin: 15,
      descripcion:
        'Enciendes «Tecnia Monitor», el administrador de tareas de verdad, y le mandas diez trabajos distintos —veinte pestañas, exportar un video, copiar una carpeta enorme, el antivirus analizando de fondo…—. En cada uno lees los tres medidores para descubrir cuál se llenó y por qué, y eliges el arreglo que de verdad le corresponde: el equivocado no mueve ni un número. Cierra con un apagón a media escritura de un trabajo sin guardar, la prueba de que la memoria no guarda nada. Insignia de Técnico del rendimiento. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N5 · U1 «El sistema de cómputo» ──
  'n5-nube-o-local': {
    meta: {
      id: 'n5-nube-o-local',
      titulo: '¿Nube o local?',
      nivel: 5,
      unidadId: 'n5-el-sistema-de-computo',
      eje: 'sistemas',
      duracionMin: 15,
      descripcion:
        'Enciendes «Tecnia Archivos» y decides, sin saber todavía qué va a pasar, dónde guardar nueve cosas tuyas —la tarea de mañana, las fotos del viaje, un video de 4 GB, tu diario secreto— entre Esta computadora y Mi nube, o los dos. Después, una por una, pasan cosas de verdad: se va el internet justo antes de entregar, se rompe el disco, pierdes la laptop, un compañero necesita el archivo hoy. Ninguna decisión sirve siempre. Insignia de Dueño de tus archivos. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N5 · «Hoja de cálculo I» (temario §45) ──
   *
   * La primera clase de Tecnia Hojas, y una PRESTADA y no una exclusiva: vive en
   * su unidad del nivel 5 con su id `n5-`, y la sala de Excel la muestra desde
   * ahí. Por eso se registra aquí y no en `registroOffice.ts`, que es sólo para
   * las que no pertenecen a ningún nivel — meterla allí le habría dado dos URL y
   * dos progresos que se pisan, y las pruebas del §33.2 lo cazan.
   */
  'n5-celdas-filas-columnas': {
    meta: {
      id: 'n5-celdas-filas-columnas',
      titulo: 'Celdas, filas y columnas',
      nivel: 5,
      unidadId: 'n5-hoja-de-calculo-1',
      eje: 'creatividad',
      duracionMin: 14,
      descripcion:
        'La tesorera de tu salón apuntó lo que costó la salida a Teotihuacán y no hay ni una fórmula todavía, porque hoy no toca calcular: hoy toca saber dónde está cada cosa. Aprendes a leer el domicilio de un dato —columna y fila—, a distinguir las dos preguntas que contestan el cuadro de nombres y la barra de fórmulas, y a marcar un rectángulo entero de celdas y verlo sumarse solo en la barra de estado. Después metes la fila que faltaba, quitas la que sobraba y abres una columna, descubriendo lo que casi nadie entiende el primer día: que insertar no hace un hueco, empuja. Insignia de Domicilio conocido.',
      layout: 'inmersivo',
    },
  },

  /*
   * La segunda de Tecnia Hojas, y prestada igual que la primera: su id es `n5-`,
   * vive en la unidad del nivel 5 y la sala de Excel la enseña desde ahí. En
   * `registroOffice.ts` tendría dos URL y dos progresos que se pisan.
   */
  'n5-captura-y-ordena': {
    meta: {
      id: 'n5-captura-y-ordena',
      titulo: 'Captura y ordena datos',
      nivel: 5,
      unidadId: 'n5-hoja-de-calculo-1',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'Una semana después, en el mismo archivo: la tesorera lleva a medias la lista de quién ya entregó su cuota para la salida a Teotihuacán. Falta una alumna, hay un apunte de más, los folios de los recibos están tecleados en la columna equivocada y la hoja se sigue llamando «Hoja3». Hoy no tecleas doce veces lo mismo: arrastras el cuadrito verde de la esquina y llenas doce celdas de un tirón, mudas con Cortar y Pegar lo que está mal puesto, pegas sólo la pinta de una celda o sólo el resultado —congelando el corte de caja y dejando la fórmula atrás—, le pones nombre, sitio y color a la hoja, y ordenas la lista de la A a la Z marcando la tabla entera, que es lo que evita que cada quien se quede con el pago de otro. Insignia de Dedo rápido.',
      layout: 'inmersivo',
    },
  },

  /*
   * La cuarta de Tecnia Hojas —la primera con fórmulas— y prestada como las dos
   * anteriores: su id es `n5-`, vive en la unidad del nivel 5 y la sala de Excel
   * la enseña desde ahí. En `registroOffice.ts` tendría dos URL y dos progresos
   * que se pisan.
   */
  'n5-tus-primeras-formulas': {
    meta: {
      id: 'n5-tus-primeras-formulas',
      titulo: 'Tus primeras fórmulas',
      nivel: 5,
      unidadId: 'n5-hoja-de-calculo-1',
      eje: 'creatividad',
      duracionMin: 18,
      descripcion:
        'Mismo archivo, dos semanas después, y hoy escribes tu primer signo igual. Empieza por ver el problema: le subes el precio al camión y «Lo pagado» sigue diciendo lo de antes, porque ese número lo tecleó alguien con una calculadora y no sabe de dónde vino. Lo arreglas con =B4*C4, llenas la columna entera con esa sola regla —y ves que cada copia se acomoda a su renglón—, sacas el total con Autosuma y lo cazas adivinando mal el rango, escribes MAX, MIN, PROMEDIO, CONTAR y CONTARA, y le pierdes el miedo a un #¡DIV/0!, que no es que se rompa nada: es la hoja diciéndote que le pediste repartir entre nadie. Al final, con los números en pantalla, descubres por qué una celda vacía no es un cero. Insignia de Cuenta sola.',
      layout: 'inmersivo',
    },
  },

  /*
   * La quinta y última de Tecnia Hojas —cierra el grado Básico de Excel— y
   * prestada como las cuatro anteriores: su id es `n5-`, vive en la unidad del
   * nivel 5 y la sala de Excel la enseña desde ahí.
   */
  'n5-mi-primera-grafica': {
    meta: {
      id: 'n5-mi-primera-grafica',
      titulo: 'Mi primera gráfica',
      nivel: 5,
      unidadId: 'n5-hoja-de-calculo-1',
      eje: 'creatividad',
      duracionMin: 17,
      descripcion:
        'Vas a convertir la tabla de gastos en una gráfica de columnas, y la vas a hacer mal la primera vez a propósito: marcas hasta la fila del Total y sale una barra que aplasta a las demás. La arreglas sin borrar nada, editándole el rango a la misma gráfica, y compruebas que no es un dibujo fijo: le subes el precio al camión y la barra se mueve sola. Le pones título, rótulos de dato exactos, nombre a los dos ejes y le quitas una leyenda que sobraba. Y la entregas de verdad: guardas tu libro, ves una vista previa mala de dos páginas partidas, y la arreglas con un área de impresión hasta dejarla en una sola hoja limpia. Insignia de Se ve solo. Cierra el grado Básico.',
      layout: 'inmersivo',
    },
  },

  // ── N5 · «Presentaciones II» (documento §42) ──
  'n5-transiciones-con-proposito': {
    meta: {
      id: 'n5-transiciones-con-proposito',
      titulo: 'Transiciones con propósito',
      nivel: 5,
      unidadId: 'n5-presentaciones-2',
      eje: 'creatividad',
      duracionMin: 15,
      descripcion:
        'Diego le puso una transición a cada una de sus seis diapositivas sobre los volcanes de México, y un título que entra solo. Primero la ves entera a pantalla completa y aguantas el mareo; después quitas las que sobran y dejas la única que avisa de algo —tú decides cuál—; y al final haces lo contrario: animas un corte de volcán por partes, en el orden en que sube el magma, para que el público mire la que estás nombrando. Insignia de Mano quieta. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n5-audio-e-imagenes': {
    meta: {
      id: 'n5-audio-e-imagenes',
      titulo: 'Audio e imágenes',
      nivel: 5,
      unidadId: 'n5-presentaciones-2',
      eje: 'creatividad',
      duracionMin: 14,
      descripcion:
        'Vuelves a la presentación de Diego y le metes el retumbe de un volcán en la diapositiva de las erupciones, porque ahí el sonido ES el tema. Cuando Bit te ofrezca música de fondo para todas, decides tú. Después arreglas una foto que entró estirada a lo ancho —desde la esquina, no desde el lado—, la recortas para quitarle un estacionamiento que no viene al caso y le escribes la descripción para quien no puede verla. Insignia de Oído fino. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n5-la-buena-diapositiva': {
    meta: {
      id: 'n5-la-buena-diapositiva',
      titulo: 'Las reglas de la buena diapositiva',
      nivel: 5,
      unidadId: 'n5-presentaciones-2',
      eje: 'creatividad',
      duracionMin: 16,
      descripcion:
        'La única clase de la sala que no enseña a construir: enseña a revisar. Diego volvió a romper su presentación la noche antes de entregar y tú tienes al lado una ficha con siete reglas. Cinco se marcan solas; las otras dos no las puede juzgar ningún programa. Encuentras los tres defectos —una diapositiva que cuenta dos cosas, tres tarjetas puestas a ojo y un cierre que no se lee—, los arreglas y te haces la prueba de los tres segundos. Insignia de Ojo de revisor. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N5 · «Mi huella digital» — primera parada: lo que publico permanece ──
  'n5-lo-que-publico-permanece': {
    meta: {
      id: 'n5-lo-que-publico-permanece',
      titulo: 'Lo que publico permanece',
      nivel: 5,
      unidadId: 'n5-mi-huella-digital',
      eje: 'ciudadania',
      duracionMin: 16,
      descripcion:
        'Entra a Tecnia Muro —pero esta vez es TU perfil— y publica diez cosas a lo largo de una semana. Después, pasado el tiempo, intenta borrarlas: descubre que borrar quita tu copia pero no las de quien ya le tomó captura, que a los diez segundos casi siempre se salva y a los tres días casi nunca, y que un grupo "privado" de veinte amigos no lo es tanto. Cierra practicando la única herramienta que sí actúa a tiempo: la pregunta de antes de publicar. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N5 · «Mi huella digital» — segunda parada: mi identidad digital ──
  'n5-mi-identidad-digital': {
    meta: {
      id: 'n5-mi-identidad-digital',
      titulo: 'Mi identidad digital',
      nivel: 5,
      unidadId: 'n5-mi-huella-digital',
      eje: 'ciudadania',
      duracionMin: 16,
      descripcion:
        'Publica en Tecnia Muro cinco cosas que no tienen nada de malo —un torneo, un perro, un cumpleaños, una mochila, la natación de los martes— y después mira ese mismo perfil como lo ve alguien que no te conoce. Junta las piezas tú mismo y arma el retrato: nombre y escuela, el rumbo donde vive, los días en que se sabe dónde está. Descubre que la pieza que más revela no es la más secreta sino la que aparece en más lugares, y cierra eligiendo tu propio perfil, cuadro por cuadro. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  // ── N5 · «Mi huella digital» — tercera parada y CIERRE: documentos compartidos ──
  'n5-documentos-compartidos': {
    meta: {
      id: 'n5-documentos-compartidos',
      titulo: 'Documentos compartidos',
      nivel: 5,
      unidadId: 'n5-mi-huella-digital',
      eje: 'ciudadania',
      duracionMin: 18,
      descripcion:
        'Abre Tecnia Nube con el cartel de tu equipo para la Feria de Ciencias y descubre que compartir no es mandar una copia: es dar una llave. Reparte llaves del tamaño justo (ver, comentar, editar), chócate con un compañero que guardó a la vez que tú, recupera con el historial un bloque que él borró sin querer, apaga un enlace que se fue de chat en chat —y comprueba que revocar no borra que ya entraron— y recoge las llaves al terminar. Nadie es el malo y todo se arregla.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── Las clases de inteligencia artificial (documento §52) ───────────────
   *
   * Van juntas en `activities/ia/`, como las de Python en `activities/python/`
   * y las de Office en `activities/office/`: lo que las hermana es el armazón
   * que montan —`simuladores/asistente/`, y `n5-la-ia-aprende-con-datos`
   * además `simuladores/aprendizaje/`—, no el grado. Tres son de 5.º de
   * primaria y una de 1.º de secundaria; cada una declara aquí su nivel y su
   * unidad, que es lo que el currículo comprueba.
   *
   * Las tres de 5.º son las tres paradas de `n5-ia-a-mi-alcance`, en orden:
   * `n5-la-ia-en-mi-vida` (dónde está ya) → `n5-la-ia-aprende-con-datos`
   * (cómo aprende) → `n5-uso-responsable-de-ia` (cómo se usa).
   */
  'n5-la-ia-en-mi-vida': {
    meta: {
      id: 'n5-la-ia-en-mi-vida',
      titulo: 'La IA en mi vida diaria',
      nivel: 5,
      unidadId: 'n5-ia-a-mi-alcance',
      eje: 'datos-ia',
      duracionMin: 15,
      descripcion:
        'Revisas tu propio día, aparato por aparato, buscando algo que ya estaba ahí. Primero apuestas por corazonada —sin saber nada todavía— y sólo después cada aparato te cuenta cómo llegó a hacer lo que hace: la calculadora parece listísima y resulta que alguien le escribió los pasos uno por uno; el teclado que adivina tu palabra parece una tontería y aprendió leyendo millones de mensajes. Con tu pizarra llena buscas la pregunta que los separa, probando cuatro contra tus propios aparatos: la pantalla no sirve, la voz tampoco, hacer algo difícil tampoco. Sólo una sirve, y te la llevas puesta para los cuatro de la tarde. Insignia de Radar de IA.',
      layout: 'inmersivo',
    },
  },

  'n5-la-ia-aprende-con-datos': {
    meta: {
      id: 'n5-la-ia-aprende-con-datos',
      titulo: 'La IA aprende con datos',
      nivel: 5,
      unidadId: 'n5-ia-a-mi-alcance',
      eje: 'datos-ia',
      duracionMin: 16,
      descripcion:
        'Abres «Tecnia Entrena» y le enseñas a una máquina con ocho fichas de mascotas: ella no ve fotos, sólo lee el color, las orejas y la cola. Cuando entrena, te enseña su árbol de preguntas escrito en palabras y te avisa, antes de probarla, de lo que todavía no sabe. Y entonces falla: al gato negro le dice «perro» con el 100 % de seguridad, porque todas las fichas negras que le enseñaste eran perros; y con el perro gris se atasca. Lo arreglas tú poniéndole en la mesa la ficha que le faltaba y volviendo a entrenar. Aquí no se resta ni un punto: el fallo es de los datos, no tuyo. Insignia de Entrenadora de máquinas.',
      layout: 'inmersivo',
    },
  },

  'n5-uso-responsable-de-ia': {
    meta: {
      id: 'n5-uso-responsable-de-ia',
      titulo: 'Uso responsable de la IA',
      nivel: 5,
      unidadId: 'n5-ia-a-mi-alcance',
      eje: 'datos-ia',
      duracionMin: 14,
      descripcion:
        'Tienes que entregar un trabajo sobre los volcanes y el asistente te ayuda de verdad. Aquí el mensaje no se escribe: se arma con piezas —qué le pides y qué le cuentas de ti—, y los extras suenan útiles, que es justo como se dan los datos personales en la vida real. A la derecha hay una ficha con lo que el asistente ya sabe de ti, y se llena sola sin que él te avise. Vas a pedirle que la borre y no va a poder. También descubres lo que un buen asistente NO te hace: tu trabajo. Insignia de Dueña de tus datos.',
      layout: 'inmersivo',
    },
  },

  'n7-como-aprende-la-ia': {
    meta: {
      id: 'n7-como-aprende-la-ia',
      titulo: '¿Cómo aprende una IA?',
      nivel: 7,
      unidadId: 'n7-ia-1',
      eje: 'datos-ia',
      duracionMin: 20,
      descripcion:
        'Armas el Lote de Acopio con el que se entrena una IA de reconocimiento de gatos, decidiendo qué imágenes entran y cuáles sesgan el resultado, ves en vivo cómo un lote torcido produce una IA torcida, y cierras entendiendo por qué una IA nunca "sabe" nada: repite patrones de los datos que le diste. Insignia ENTRENADOR DE MODELOS.',
      layout: 'inmersivo',
    },
  },

  'n7-buenos-prompts': {
    meta: {
      id: 'n7-buenos-prompts',
      titulo: 'Escribe buenos prompts',
      nivel: 7,
      unidadId: 'n7-ia-1',
      eje: 'datos-ia',
      duracionMin: 18,
      descripcion:
        'La única clase en la que escribes tú: nada de elegir entre tres opciones. Cuatro encargos de la misma exposición sobre el agua en tu ciudad, y bajo el cuadro de texto cuatro criterios que se encienden mientras tecleas —para quién es, qué formato, qué contexto y qué tan largo—. El asistente contesta exactamente igual de bien o de mal que le pidas: con uno encendido te suelta un párrafo sonoro e inservible, con los cuatro te da algo que puedes usar el lunes. Y comprueba la trampa: el prompt más largo que escribas no será el mejor. Cada intento queda anotado en tu cuaderno. Insignia de Buena preguntadora.',
      layout: 'inmersivo',
    },
  },
  'n7-verifica-a-la-ia': {
    meta: {
      id: 'n7-verifica-a-la-ia',
      titulo: 'Verifica lo que dice la IA',
      nivel: 7,
      unidadId: 'n7-ia-1',
      eje: 'datos-ia',
      duracionMin: 22,
      descripcion:
        'Dos programas abiertos a la vez: el asistente que contesta cuatro afirmaciones sobre cómo llegó Internet a México, y el buscador donde se comprueban una por una contra fuentes independientes. Tres veredictos —confirmada, contradicha, sin respaldo— y una trampa deliberada: la frase con la fecha más exacta es cierta, y la más aburrida es falsa. Cierra citando el Informe con dos consultas de más, para el trabajo final.',
      layout: 'inmersivo',
    },
  },

  'n8-genera-con-ia': {
    meta: {
      id: 'n8-genera-con-ia',
      titulo: 'Genera texto, imagen y audio',
      nivel: 8,
      unidadId: 'n8-ia-2',
      eje: 'datos-ia',
      duracionMin: 25,
      descripcion:
        'El comité de la Semana de la Ciencia te encarga un artículo, una imagen y un anuncio: pides cada uno vago y luego con precisión real, en texto, imagen y audio, y ves la misma distancia las tres veces. Descubres que «sin ningún error» no es lo mismo que «seguro de publicar» —una imagen sin defectos se rechaza igual, por ser tan realista que se confunde con una persona real— y que hay una petición, clonar una voz real sin permiso, que el generador se niega a cumplir. Diez encargos. Insignia de Editor de Multimedia.',
      layout: 'inmersivo',
    },
  },

  'n8-sesgos-y-errores': {
    meta: {
      id: 'n8-sesgos-y-errores',
      titulo: 'Sesgos y errores de la IA',
      nivel: 8,
      unidadId: 'n8-ia-2',
      eje: 'datos-ia',
      duracionMin: 22,
      descripcion:
        'Del otro lado del mostrador: la IA ya está entrenada, no la vas a auditar, sólo vas a ver lo que contesta. Comparas una respuesta segura contra una ficha de referencia y encuentras la alucinación que suena igual que las verdades, generas la misma imagen cuatro veces y mides el único dato que nunca cambia, y comparas dos resúmenes contra su fuente —uno que omite un dato, otro que lo dice al revés—. Cierra clasificando cuatro resultados según el tipo de revisión que cada uno necesita. Ocho encargos. Insignia de Auditor de Resultados.',
      layout: 'inmersivo',
    },
  },

  'n9-ia-copiloto': {
    meta: {
      id: 'n9-ia-copiloto',
      titulo: 'La IA como copiloto',
      nivel: 9,
      unidadId: 'n9-ia-y-automatizacion',
      eje: 'datos-ia',
      duracionMin: 25,
      descripcion:
        'El Club de Robótica tiene el reporte a medio terminar. Usas a Tecnia Asistente como copiloto: comparas cuándo pedir ayuda ahorra tiempo y cuándo lo gasta, pruebas cada sugerencia antes de aceptarla —código y texto—, y cazas dos errores que no saltan a la vista: una función que corre sin errores y da un número equivocado, y un párrafo que se lee perfecto con un dato que nadie confirmó. Cierras repartiendo cuatro tareas reales entre el copiloto y tú. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n9-ia-y-trabajo': {
    meta: {
      id: 'n9-ia-y-trabajo',
      titulo: 'El impacto de la IA en el trabajo',
      nivel: 9,
      unidadId: 'n9-ia-y-automatizacion',
      eje: 'datos-ia',
      duracionMin: 25,
      descripcion:
        'Cierre de la unidad. Clasificas tareas de trabajos reales entre las que la IA ya automatiza bien y las que siguen pidiendo criterio humano, comparas empleos reales antes y después de la IA para ver que reemplazar el empleo completo es la excepción, separas el criterio real del pánico y del optimismo ciego, y cierras repartiendo un día real de trabajo entre una regla, un copiloto probado y tu propio criterio. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n9-proyecto-integrador': {
    meta: {
      id: 'n9-proyecto-integrador',
      titulo: 'Problema real, solución digital',
      nivel: 9,
      unidadId: 'n9-proyecto-integrador-secundaria',
      eje: 'programacion',
      duracionMin: 45,
      descripcion:
        'El capstone de todo N9. Clasificas cinco problemas reales entre app, sitio web y análisis de datos, aplicas ese mismo criterio al caso real de un refugio de animales pequeño, y construyes su sitio de dos páginas con HTML y CSS reales —el nombre real, el horario real, un enlace entre páginas y un aviso real que corriges— usando sólo los datos que te dio la encargada. Nueve encargos, cuatro actos.',
      layout: 'inmersivo',
    },
  },

  'n8-etica-de-la-ia': {
    meta: {
      id: 'n8-etica-de-la-ia',
      titulo: 'Ética: plagio, deepfakes y citas',
      nivel: 8,
      unidadId: 'n8-ia-2',
      eje: 'datos-ia',
      duracionMin: 22,
      descripcion:
        'Cierras «IA II» decidiendo si lo que hiciste con contenido de IA estuvo bien: cuándo entregar un texto de IA como propio es plagio —según si lo declaras y si lo transformas—, por qué «se ve bien hecho» no verifica un deepfake y qué señales sí lo hacen, y cómo escribir una cita que diga de verdad qué hizo la IA y qué hiciste tú. Cierra auditando un trabajo escolar real con los tres problemas a la vez. Nueve encargos. Insignia de Auditor de Ética.',
      layout: 'inmersivo',
    },
  },

  // ── N7 · U1 «Arquitectura y sistemas» (documento §31) ──
  /*
   * ── Tecnia Código · las clases de Python ────────────────────────────────
   *
   * Van juntas en `activities/python/` y no repartidas por nivel, igual que
   * las de Office viven en `activities/office/`: lo que las hermana es el
   * programa que montan (el editor), no el grado. La primera es de 6.º de
   * primaria y las otras de 1.º de secundaria; cada una declara su nivel y su
   * unidad aquí, que es lo que el currículo comprueba.
   */
  'n6-primeras-lineas-python': {
    meta: {
      id: 'n6-primeras-lineas-python',
      titulo: 'Primeras líneas de Python',
      nivel: 6,
      unidadId: 'n6-de-bloques-a-texto',
      eje: 'programacion',
      duracionMin: 25,
      descripcion:
        'Tu primer archivo .py. Ejecutas un programa ya escrito y lo miras ir despacio, línea por línea; escribes tu propio print; guardas tu nombre en una variable; le quitas las comillas para romperlo A PROPÓSITO y aprender a leer el error que sale, con su línea y su pista; lo arreglas; y terminas haciendo que el programa decida solo con un if y un else. Insignia de Primera línea.',
      layout: 'inmersivo',
    },
  },
  /*
   * La parada 1 de esa misma unidad, y va ANTES que la de arriba: es el puente
   * entre los bloques y el texto. Vive con las de `bloques/` y no con las de
   * `python/` porque el programa que abre el alumno es el editor de bloques —
   * la cara de texto es una columna suya, en sólo lectura, con un solo ▶.
   */
  'n6-bloques-vs-codigo': {
    meta: {
      id: 'n6-bloques-vs-codigo',
      titulo: 'El mismo programa, dos caras',
      nivel: 6,
      unidadId: 'n6-de-bloques-a-texto',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Armas un programa con bloques y ves, en la misma ventana, cómo se reescribe solo en Python: el bloque que corre y su línea se encienden a la vez. El ejercicio central es meter un bloque dentro de la boca de un «repetir» y sacar otro fuera, para descubrir que la única diferencia en el texto son cuatro espacios de sangría.',
      layout: 'inmersivo',
    },
  },
  'n7-variables-y-tipos': {
    meta: {
      id: 'n7-variables-y-tipos',
      titulo: 'Variables y tipos',
      nivel: 7,
      unidadId: 'n7-python-1',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Guardas cuatro datos en cuatro cajas y ves de qué tipo nace cada una en la Mesa de tipos: int, float, str y bool. Le preguntas el tipo a Python con type(), descubres por qué 10 / 2 escribe 5.0 y 10 // 2 escribe 5, y después mezclas tipos A PROPÓSITO hasta romper el programa de dos maneras distintas —TypeError al sumar texto con número, ValueError al convertir «trece»—. Terminas decidiendo tú cada conversión: str() para pegar, int() para sumar. Insignia de Cada dato en su caja.',
      layout: 'inmersivo',
    },
  },
  'n7-entrada-y-salida': {
    meta: {
      id: 'n7-entrada-y-salida',
      titulo: 'Entrada y salida',
      nivel: 7,
      unidadId: 'n7-python-1',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Escribes un programa que te entrevista: pregunta con input, se detiene a esperarte y tú le contestas en la consola. Le sumas 1 a la edad que acabas de escribir y revienta, que es como se descubre que input devuelve SIEMPRE texto; lo conviertes con int(), contestas «trece» con letras para ver el otro error, y armas una ficha con tres datos usando print con comas y una f-string. Insignia de Pregunta y responde.',
      layout: 'inmersivo',
    },
  },
  'n7-condicionales-python': {
    meta: {
      id: 'n7-condicionales-python',
      titulo: 'Condicionales',
      nivel: 7,
      unidadId: 'n7-python-1',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Tu programa decide: un camino u otro con if/else, tres caminos o más con elif, y descubres por qué == y = no son lo mismo. Combinas dos condiciones a la vez con and y con or, y provocas a propósito el único error que este intérprete no sólo señala sino que explica: Python no deja escribir «120 <= altura <= 150» de un tirón. Lo arreglas con and, y cierras con una pregunta sobre por qué el orden de un elif puede darte la respuesta equivocada sin avisar. Insignia de Tu programa ya decide.',
      layout: 'inmersivo',
    },
  },
  /* Sonnet solo, sin pliego de diseño (método estándar) — parada 4 de 5 de esta unidad. */
  'n7-bucles-python': {
    meta: {
      id: 'n7-bucles-python',
      titulo: 'Bucles',
      nivel: 7,
      unidadId: 'n7-python-1',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Escribes cuatro bucles distintos: repites con for y range() hasta escribir la tabla del 7 en dos líneas, acumulas la suma de diez números en la misma caja vuelta tras vuelta, y cuentas hacia atrás con while. Luego borras la línea que lo detiene para provocar un bucle infinito de verdad y ver cómo el editor te protege — lo arreglas, sales de un bucle con break antes de tiempo, y cierras distinguiendo cuál de tres bucles nunca termina solo. Insignia de Sobreviviste al bucle infinito.',
      layout: 'inmersivo',
    },
  },
  /* Sonnet solo, sin pliego de diseño (método estándar) — parada 5 de 5, cierre de la unidad. */
  'n7-retos-python': {
    meta: {
      id: 'n7-retos-python',
      titulo: 'Retos guiados',
      nivel: 7,
      unidadId: 'n7-python-1',
      eje: 'programacion',
      duracionMin: 35,
      descripcion:
        'Cierras la unidad armando tres programas completos, uno detrás de otro: decides un descuento con if/elif/else sobre un total que tú mismo calculaste con float() e int(), cuentas y clasificas un grupo acumulando dos variables en el mismo for, y abres un candado con while, input y break —después de comprobar que un acierto sin break no basta para detenerlo—. No aprendes ninguna herramienta nueva: combinas las cuatro de la unidad. Insignia de Resolviste los tres retos.',
      layout: 'inmersivo',
    },
  },

  /* ── N8·U «Programación en texto II» (n8-python-2) — continuación directa de
     n7-python-1 sobre el mismo motor SalaCodigo/intérprete real. ── */
  'n8-listas-y-diccionarios': {
    meta: {
      id: 'n8-listas-y-diccionarios',
      titulo: 'Listas y diccionarios',
      nivel: 8,
      unidadId: 'n8-python-2',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Guardas varios datos juntos en una sola caja: una lista para tu mochila (indexar con positivos y negativos, append(), una rebanada, recorrerla con for) y un diccionario para la ficha de un alumno (acceso por clave, .items(), el operador in). En medio, provocas a propósito un IndexError de verdad pidiendo una posición que no existe, lo lees con calma y lo corriges. Insignia de Ordenaste tu mochila.',
      layout: 'inmersivo',
    },
  },
  'n8-funciones-python': {
    meta: {
      id: 'n8-funciones-python',
      titulo: 'Funciones',
      nivel: 8,
      unidadId: 'n8-python-2',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Escribes tus propias funciones con def, les pasas parámetros y descubres la diferencia real entre return (te entrega un dato) y print (sólo lo enseña en pantalla) — la trampa de que una función sin return siempre "devuelve" None. Provocas a propósito un TypeError llamando con el número equivocado de argumentos y un NameError leyendo una variable local fuera de su función. Insignia de Tu caja de herramientas.',
      layout: 'inmersivo',
    },
  },
  'n8-proyectos-consola': {
    meta: {
      id: 'n8-proyectos-consola',
      titulo: 'Juegos, calculadoras y bots',
      nivel: 8,
      unidadId: 'n8-python-2',
      eje: 'programacion',
      duracionMin: 35,
      descripcion:
        'Cierras combinando todo lo de la unidad en tres programas completos: una calculadora con tres funciones y un menú if/elif/else, una trivia que recorre dos listas a la vez con for/range(len()) y lleva la cuenta de tus aciertos, y un bot que responde según un diccionario y no deja de hablar hasta que escribes "adios" (while True + break). Insignia de Armaste tres programas completos.',
      layout: 'inmersivo',
    },
  },
  'n8-buenas-practicas': {
    meta: {
      id: 'n8-buenas-practicas',
      titulo: 'Buenas prácticas y depuración',
      nivel: 8,
      unidadId: 'n8-python-2',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Abres un programa que no escribiste tú, con nombres que no dicen nada (x, f) y tres errores reales ya metidos adentro —un IndexError, un TypeError de argumentos y un NameError de alcance— y los encuentras leyendo cada mensaje, sin que nadie te diga dónde están. Renombras para que el código se entienda solo y cambias un comentario que repetía el código por uno que explica una decisión. Insignia de El Detective de Errores.',
      layout: 'inmersivo',
    },
  },

  // ── N6·U «Robótica y STEAM», parada 1 — volumen 3D sobre `laboratorio3d` (DISEÑO-N6) ──
  'n6-que-es-un-robot': {
    meta: {
      id: 'n6-que-es-un-robot',
      titulo: '¿Qué es un robot?',
      nivel: 6,
      unidadId: 'n6-robotica-y-steam',
      eje: 'programacion',
      duracionMin: 22,
      descripcion:
        'Clasificas siete piezas de un robot de mesa —sensores, tarjeta y actuadores— por su oficio, en un laboratorio 3D en volumen. Las montas en el cuerpo de un carrito donde de verdad le sirvan y lo pruebas contra un obstáculo, descubriendo que el mismo sensor de distancia montado en el techo deja de ver lo que se le viene encima. Termina con una pregunta y la insignia Ojo de robot.',
      layout: 'inmersivo',
    },
  },

  // ── Tecnia Bloques · las tres clases que sirve entero el armazón (documento §55) ──
  'n6-programa-un-microbit': {
    meta: {
      id: 'n6-programa-un-microbit',
      titulo: 'Programa un micro:bit',
      nivel: 6,
      unidadId: 'n6-robotica-y-steam',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Programas una placa micro:bit simulada con tres guiones distintos: qué pasa al presionar A, qué pasa al presionar B y qué pasa al empezar. Ves un guion vacío avisar en vez de fallar, provocas un resultado equivocado A PROPÓSITO cambiando el orden de los bloques y lo arreglas, y terminas decidiendo qué es lo que de verdad dispara cada guion. Insignia de Programador de placas.',
      layout: 'inmersivo',
    },
  },
  'n6-reto-robot': {
    meta: {
      id: 'n6-reto-robot',
      titulo: 'Reto: resuélvelo con tu robot',
      nivel: 6,
      unidadId: 'n6-robotica-y-steam',
      eje: 'programacion',
      duracionMin: 22,
      descripcion:
        'Mueves a un robot por una cuadrícula hasta chocar con un límite A PROPÓSITO, y le enseñas a preguntar «¿hay pared adelante?» con un bloque «si» antes de girar, para llegar a la meta sin volver a chocar. Terminas quitándole la pregunta al «si» para descubrir que, sin ella, la respuesta es siempre que no. Insignia de Domador de robots.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N5·U4 «Programación en bloques III», paradas 1 y 2 ──────────────────
   *
   * Van aquí, con las demás de `bloques/`, porque lo que las hermana es el
   * armazón que montan. La parada 3 —`n5-planea-tu-proyecto`— NO está aquí:
   * cierra esta misma unidad pero sobre el editor de diseño, y vive con las
   * de `diseno/`. El porqué está escrito en el §54 del documento maestro.
   */
  'n5-bloques-propios': {
    meta: {
      id: 'n5-bloques-propios',
      titulo: 'Bloques propios y mensajes',
      nivel: 5,
      unidadId: 'n5-bloques-3',
      eje: 'programacion',
      duracionMin: 24,
      descripcion:
        'Le programas la coreografía a Chispa, una robot bailarina. Primero copias el mismo paso de baile TRES veces a mano —nueve bloques— y lo borras uno por uno, para descubrir con las manos por qué hace falta un bloque propio: se define una vez, se llama tres, y el baile sale idéntico. Después cambias el final del paso en UN solo sitio y ves cambiar las tres repeticiones. Y enciendes los focos con un mensaje: un guion que empieza con «al recibir» no arranca solo, espera a que alguien le avise. Insignia de Coreógrafa de bloques.',
      layout: 'inmersivo',
    },
  },
  'n5-juego-con-niveles': {
    meta: {
      id: 'n5-juego-con-niveles',
      titulo: 'Historia o juego con niveles',
      nivel: 5,
      unidadId: 'n5-bloques-3',
      eje: 'programacion',
      duracionMin: 26,
      descripcion:
        'Construyes un juego de tres niveles con bloques. Pintas tres pantallas seguidas y descubres A PROPÓSITO que salen las tres iguales porque nadie cambió la memoria del juego; le añades «subir de nivel» y las mismas piezas dan bosque, río y torre. Después haces los tres niveles con dos piezas dentro de un bucle, cambias el «3 veces» por la pregunta «¿ya no quedan niveles?», y cierras el juego enviando el mensaje ¡FIN! a la pantalla final. Insignia de Arquitecta de niveles.',
      layout: 'inmersivo',
    },
  },

  'n9-automatiza-tareas': {
    meta: {
      id: 'n9-automatiza-tareas',
      titulo: 'Automatiza tareas repetitivas',
      nivel: 9,
      unidadId: 'n9-ia-y-automatizacion',
      eje: 'datos-ia',
      duracionMin: 25,
      descripcion:
        'Armas una regla de automatización de bandeja de entrada —«cuando llega un correo, si el asunto contiene esto, entonces archívalo ahí»— con sus dos ramas, sí y no. Simulas dos correos distintos con la misma regla, y terminas quitándole la pregunta a la condición A PROPÓSITO para ver el error clásico de automatización: una condición vacía se contesta que no, siempre. Insignia de Automatiza de verdad.',
      layout: 'inmersivo',
    },
  },

  'n7-dentro-del-gabinete': {
    meta: {
      id: 'n7-dentro-del-gabinete',
      titulo: 'Dentro del gabinete',
      nivel: 7,
      unidadId: 'n7-arquitectura-y-sistemas',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'Arma un equipo pieza por pieza en el orden real de montaje —CPU, disipador, RAM, SSD, tarjeta gráfica y fuente—, explica cuatro síntomas como técnico y enciende la torre para leer su ficha técnica. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n7-binario-y-unidades': {
    meta: {
      id: 'n7-binario-y-unidades',
      titulo: 'Binario y unidades',
      nivel: 7,
      unidadId: 'n7-arquitectura-y-sistemas',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'Formas cinco números en binario subiendo ocho interruptores con su valor posicional grabado —incluido el 65, que es la letra A en código ASCII—, armas la escalera completa de unidades de bit a terabyte, estimas en qué escalón cae un mensaje, una canción, una película y un respaldo, y terminas explicando por qué un disco de 500 GB aparece como 465 GB. Insignia LECTOR DE BITS.',
      layout: 'inmersivo',
    },
  },
  'n7-sistemas-operativos': {
    meta: {
      id: 'n7-sistemas-operativos',
      titulo: 'Sistemas operativos',
      nivel: 7,
      unidadId: 'n7-arquitectura-y-sistemas',
      eje: 'sistemas',
      duracionMin: 12,
      descripcion:
        'Diagnosticas cuatro computadoras enfermas —Windows, macOS, Android y Linux— identificando qué sistema operativo corre cada una por sus pistas visuales, decides qué proceso cerrar y qué actualización aplicar sin romper nada, y armas la Banca de Sistemas: qué SO usarías para cada tarea real. Insignia MÉDICO DE SISTEMAS.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N7 · «Hoja de cálculo aplicada» (temario §45) ──
   *
   * La primera clase del grado Intermedio de Tecnia Hojas, y PRESTADA igual que
   * las cuatro de N5·U2: vive en su unidad del nivel 7 con su id `n7-`, y la
   * sala de Excel la muestra desde ahí. Por eso se registra aquí y no en
   * `registroOffice.ts` — meterla allí le daría dos URL y dos progresos que se
   * pisan, y las pruebas del §33.2 lo cazan.
   */
  'n7-referencias': {
    meta: {
      id: 'n7-referencias',
      titulo: 'Referencias absolutas y relativas',
      nivel: 7,
      unidadId: 'n7-hoja-de-calculo-aplicada',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'Un mes después de la salida, la papelería cotiza los recuerdos del salón sin IVA. Rellenas una columna del IVA sin un solo `$` y ves el desastre que sale —un cero, un #¡VALOR! y un número que se ve normal y está mal—, antes de que aparezca el `$`: la manera de decirle a una fórmula copiada qué parte se mueve y qué parte se queda quieta. Clavas una celda, pones medio `$` donde va medio `$` en una tabla de doble entrada, y le pones nombre a una celda y a un rango para que tus fórmulas se lean en vez de descifrarse. Insignia de El ancla del dólar.',
      layout: 'inmersivo',
    },
  },

  /*
   * La segunda del grado Intermedio, y prestada igual que la anterior: su id es
   * `n7-`, vive en la unidad del nivel 7 y la sala de Excel la enseña desde ahí.
   */
  'n7-funcion-si': {
    meta: {
      id: 'n7-funcion-si',
      titulo: 'La función SI',
      nivel: 7,
      unidadId: 'n7-hoja-de-calculo-aplicada',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'Hasta hoy tus fórmulas calculaban. Escribes la primera que contesta una pregunta: mira una celda, la compara con la cuota y decide «Sí» o «Le falta», sustituyendo una palabra escrita a mano que se había quedado mintiendo. Provocas a propósito el error número uno del bloque —el texto sin comillas— y ya sabes por qué sale #¿NOMBRE?; metes un SI dentro de otro para contestar tres cosas en vez de dos; y cambias una O por una Y para ver a medio salón cambiar de lado sobre los mismos datos, sin que el programa te avise de nada. Insignia de La celda que contesta.',
      layout: 'inmersivo',
    },
  },

  /*
   * La tercera del grado Intermedio, y prestada como las dos anteriores: su id
   * es `n6-`, vive en la unidad del nivel 6 y la sala de Excel la enseña desde
   * ahí. En el temario cae entre `n7-funcion-si` y `of-excel-buscarx` —ésta se
   * construyó fuera de orden—, así que aquí se completan de un tirón el bloque
   * 25 (SUMAR.SI, CONTAR.SI, PROMEDIO.SI) y el 29 (fechas), que no tenían dueño.
   */
  'n6-funciones-esenciales': {
    meta: {
      id: 'n6-funciones-esenciales',
      titulo: 'Funciones esenciales',
      nivel: 6,
      unidadId: 'n6-hoja-de-calculo-2',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'La tesorera le puso categoría a cada gasto de la salida —transporte, entradas, comida, material— y hoy contestas cuánto se fue en cada una sin partir la tabla en cuatro: SUMAR.SI, CONTAR.SI y PROMEDIO.SI suman, cuentan y reparten sólo lo que cumple una condición. Provocas a propósito el error de escribir el criterio sin comillas, descubres que hasta un criterio con un número las lleva si trae un signo de comparación, y cazas un rango corrido que da un número y está mal sin que nada avise. Después, en la hoja de los pagos, escribes =HOY() y sale un número de cinco cifras en vez de una fecha: la vistes de fecha, le quitas el mismo disfraz a la fecha de la salida, y las restas para saber cuántos días faltan. Insignia de El número disfrazado.',
      layout: 'inmersivo',
    },
  },

  /*
   * La cuarta del grado Intermedio, y prestada como la anterior: su id es
   * `n6-`, vive en la misma unidad del nivel 6 y la sala de Excel la enseña
   * desde ahí. Bloques 37 (elegir entre las cinco gráficas) y 38 (las que
   * mienten: el eje cortado, el pastel de veinte porciones), con el panel
   * «Gráficas» —`PanelGraficas.tsx`— que entra por `panelFijo` para los dos
   * tipos que la cinta del grado Básico no declara (barras y dispersión), el
   * mismo criterio que ya usó `n7-formato-condicional` para el suyo.
   */
  'n6-elige-la-grafica': {
    meta: {
      id: 'n6-elige-la-grafica',
      titulo: 'Elige la gráfica correcta',
      nivel: 6,
      unidadId: 'n6-hoja-de-calculo-2',
      eje: 'creatividad',
      duracionMin: 24,
      descripcion:
        'La feria de la escuela ya pasó, y hay números de sobra. Descubres que cada gráfica contesta una pregunta distinta —barras compara, líneas sigue el tiempo, pastel reparte un total, dispersión busca relación— eligiendo mal a propósito dos veces, para ver la respuesta dejar de leerse sin que ningún número cambie. Construyes la misma gráfica dos veces con los mismos datos y le cortas el eje a una: la misma diferencia real se ve casi nada en una y enorme en la otra. Armas un pastel de veinte porciones ilegibles y otro de datos que no suman ningún total. Insignia de El ojo que desconfía.',
      layout: 'inmersivo',
    },
  },

  /*
   * La quinta del grado Intermedio, y prestada como las cuatro anteriores: su
   * id es `n7-`, vive en la unidad del nivel 7 y la sala de Excel la enseña
   * desde ahí. Bloques 30 (barras, escala, iconos, destacar) y 31
   * (minigráficos), con el panel «Formato condicional» —`PanelReglas.tsx`—
   * que entra por `panelFijo` en vez de por un botón nuevo de la cinta.
   */
  'n7-formato-condicional': {
    meta: {
      id: 'n7-formato-condicional',
      titulo: 'Formato condicional',
      nivel: 7,
      unidadId: 'n7-hoja-de-calculo-aplicada',
      eje: 'creatividad',
      duracionMin: 22,
      descripcion:
        'Antes de aprender la regla, pintas a mano el gasto más caro de hoy —y ves ese color quedarse ciego en cuanto aparece uno más caro todavía—. Después escribes una regla de verdad y la ves pintarse sola, dos veces, sin volver a tocar nada. Pones barras, escala de color e iconos sobre el mismo rango y descubres que cada una contesta una pregunta distinta, hasta que las cuatro juntas dejan de decir algo y tienes que quitar la que sobra. Cazas a quien se apuntó dos veces en una lista de pagos, y resumes una fila entera de números en una sola celda con un minigráfico, sin borrar ni un dato de abajo. Insignia de El semáforo de la hoja.',
      layout: 'inmersivo',
    },
  },

  /*
   * La sexta de la sala, y prestada como las cuatro anteriores de Intermedio:
   * su id es `n7-`, vive en la unidad del nivel 7 y la sala de Excel la
   * enseña desde ahí. Bloque 43 (importar un `.csv` o un `.txt`, con el panel
   * que abrió esta clase en `VentanaHojas.tsx` y el botón nuevo de
   * `CINTA_EXCEL_INTERMEDIO`) y bloque 41 (encabezado, pie y repetir los
   * títulos, que ya vivían enteros en el Backstage desde `n5-mi-primera-grafica`).
   */
  'n7-datos-reales': {
    meta: {
      id: 'n7-datos-reales',
      titulo: 'Trabaja con datos reales',
      nivel: 7,
      unidadId: 'n7-hoja-de-calculo-aplicada',
      eje: 'creatividad',
      duracionMin: 22,
      descripcion:
        'Los datos empiezan a llegar de fuera, y llegan sucios. Importas la misma lista de asistencia con el separador equivocado —todo cae en una sola columna— antes de importarla bien, en la misma celda, y le contestas al aviso de que va a sustituir lo que ya había. Cazas la trampa de la coma: un precio de mil pesos sin comillas que parte una fila en tres campos. Ves una columna de códigos quedarse como texto para no perder sus ceros, la sumas y sale un 0 que ningún error avisa. Y traes el pedido real de la papelería —46 artículos de un tirón— para entregarlo impreso: primero sin nada configurado, con la segunda página ilegible, y después con encabezado, pie y la fila de títulos repetida en cada hoja. Insignia de El dato que llega de fuera.',
      layout: 'inmersivo',
    },
  },

  /*
   * La séptima de la sala, y prestada como las cinco anteriores de
   * Intermedio: su id es `n6-`, vive en la unidad del nivel 6 y la sala de
   * Excel la enseña desde ahí. Bloque 42 (Mostrar fórmulas e Inspeccionar
   * libro, el segundo en su propia ficha del Backstage) y bloque 40
   * (hipervínculos, con la puerta nueva de `CINTA_EXCEL_INTERMEDIO_VINCULOS`
   * en `tecniaHojas.ts`) — la primera clase de la sala en la que el archivo
   * no lo escribió el propio alumno, sino «otra persona».
   */
  'n6-interpreta-la-informacion': {
    meta: {
      id: 'n6-interpreta-la-informacion',
      titulo: 'Interpreta la información',
      nivel: 6,
      unidadId: 'n6-hoja-de-calculo-2',
      eje: 'creatividad',
      duracionMin: 22,
      descripcion:
        'El tesorero del Club de Ajedrez ya se graduó y su último archivo se quedó sin ninguna nota: cuatro hojas, fórmulas por todos lados, dos errores escondidos y un índice a medias. Enciendes «Mostrar fórmulas» y cazas un número escrito a mano en medio de una columna de reglas —la avería más común del mundo real—, y la apagas otra vez cuando ya no la necesitas. Le preguntas al libro con «Inspeccionar libro» lo que a ojo no se ve: 2 errores y 1 hoja escondida. Lees un #¡REF! como la historia de algo que alguien borró y lo arreglas editando la fórmula; lees un #¡DIV/0! como la historia de un dato que faltaba y lo arreglas rellenando el hueco. Y terminas el índice con hipervínculos de verdad, quitando el que ya no lleva a ningún lado. Insignia de La hoja ajena.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N8 · «Datos y análisis» ───────────────────────────────────────────────
   *
   * Las dos primeras de las siete filas que el `CANON-ARMAZONES.md` marca como
   * `OFFICE`: montan `VentanaHojas` tal cual, sin motor nuevo. No pertenecen a
   * la sala de Excel —su id es `n8-` y su unidad es del nivel 8—, y lo que
   * enseñan no es el programa sino el oficio de analizar: la sala pregunta
   * «¿dónde está el botón?» y éstas preguntan «¿qué le pasa a estos datos, y
   * qué puedes decir con ellos sin mentir?» (doc §49.1, la regla que las separa
   * de `of-excel-datos-limpios` y de `of-excel-dashboard`).
   */
  'n8-limpieza-de-datos': {
    meta: {
      id: 'n8-limpieza-de-datos',
      titulo: 'Limpieza y organización',
      nivel: 8,
      unidadId: 'n8-datos-y-analisis',
      eje: 'datos-ia',
      duracionMin: 24,
      descripcion:
        'Dieciocho alumnos de 3°B contestaron una encuesta de transporte en papel y cuatro compañeros distintos la pasaron a la computadora. Contestas una sola pregunta —cuánto gasta al día un alumno de 3°B— y la ves dar tres números distintos con la misma fórmula: 11,07 · 12 · 10. Cazas una edad de 130 años mirando el máximo antes que el promedio; descubres una celda que SUMA se salta en silencio porque dice «$25 pesos»; decides qué significan tres huecos en vez de dejar que lo decida la fórmula; metes metros y kilómetros en una sola unidad con una regla que cualquiera puede leer; y cuentas diez alumnos donde CONTAR.SI dice seis, porque el mismo camión está escrito de cinco maneras. Ninguna de las cinco averías avisa de nada. Insignia de El número que parecía bueno.',
      layout: 'inmersivo',
    },
  },

  'n8-tablas-dinamicas': {
    meta: {
      id: 'n8-tablas-dinamicas',
      titulo: 'Tablas dinámicas iniciales',
      nivel: 8,
      unidadId: 'n8-datos-y-analisis',
      eje: 'datos-ia',
      duracionMin: 24,
      descripcion:
        'La kermés de fin de bimestre de 1°D anotó veintidós ventas sin ningún orden, mezclando cinco categorías. Construyes a mano lo que una tabla dinámica hace sola: tres fórmulas —SUMAR.SI, CONTAR.SI, PROMEDIO.SI— que agrupan y resumen por categoría, copiadas hacia abajo con las referencias absolutas en su lugar. El resumen no cuadra con el total del día por 35 pesos, y la única manera de cazarlo es descubrir que dos ventas de "Boletos de rifa" se anotaron como "Boleto de rifa" — SUMAR.SI compara letra por letra. Insignia de Tu tabla dinámica, a mano.',
      layout: 'inmersivo',
    },
  },

  'n8-visualizacion-efectiva': {
    meta: {
      id: 'n8-visualizacion-efectiva',
      titulo: 'Visualización efectiva',
      nivel: 8,
      unidadId: 'n8-datos-y-analisis',
      eje: 'datos-ia',
      duracionMin: 24,
      descripcion:
        'El torneo intramuros terminó: resumes el marcador con SUMA antes de graficar nada, y construyes tres gráficas reales —columnas para comparar equipos, líneas para una tendencia real, un pastel que sí suma su total—. Encuentras dos tablas que NO deberían volverse pastel, cada una por una razón distinta (demasiadas rebanadas; partes que no son parte de la misma cosa), y una gráfica que alguien más dejó ya manipulada, con el eje cortado, disfrazando un empate casi perfecto de goliza — sin inventar un solo número, sólo mirando dónde empieza el eje. Insignia de El eje no miente si lo revisas.',
      layout: 'inmersivo',
    },
  },

  /*
   * La que cierra la unidad, y la única clase de las tres salas de Office en la
   * que el alumno **no construye nada**: los datos ya están y ya están bien, y
   * lo que se pone a prueba es qué se atreve a afirmar con ellos. Seis parejas
   * de encargos —la cuenta primero, la frase después— y más `eleccion` que
   * `documento`, que es su forma y no un atajo (§49.4).
   */
  'n8-concluye-con-datos': {
    meta: {
      id: 'n8-concluye-con-datos',
      titulo: 'Concluye con datos',
      nivel: 8,
      unidadId: 'n8-datos-y-analisis',
      eje: 'datos-ia',
      duracionMin: 22,
      descripcion:
        'La escuela juntó 1 050 kilos en seis meses de campaña de reciclaje y la subdirección quiere una frase para el mural. Hay seis candidatas escritas por seis personas, ninguna es mentira y sólo tres se pueden sostener. Escribes once cuentas —ninguna cambia un dato— y con cada una desarmas una frase: el 100 % de 5°C que son dos kilos; el promedio de 131 kilos por salón que no describe a ningún salón de la escuela; el ganador que cambia de nombre en cuanto divides entre cuántos alumnos son; el marzo que fue el doble que febrero porque febrero fue el peor mes de los seis; y las novecientas botellas de la feria del agua, que estaban en otra hoja del mismo archivo y explican el pico de abril mejor que la temperatura. La frase que se lleva el mural es la que dice menos. Insignia de Lo que el número no dice.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N10 · «Capstone y portafolio» ─────────────────────────────────────────
   *
   * La tercera fila `OFFICE` del canon, y la única de las tres que monta
   * `VentanaTextos` en vez de `VentanaHojas`. Sin `controles` ni `accesorios`:
   * no necesita ampliar el motor de Word por ningún lado, que es la mejor
   * prueba de que ese motor está terminado (§49.5).
   */
  'n10-portafolio-y-cv': {
    meta: {
      id: 'n10-portafolio-y-cv',
      titulo: 'Portafolio digital y currículum',
      nivel: 10,
      unidadId: 'n10-capstone-y-portafolio',
      eje: 'creatividad',
      duracionMin: 18,
      descripcion:
        'El currículum de Sofía no tiene ni un dato falso y aun así no funciona: todo en Normal, el correo que se hizo a los trece años, un objetivo profesional de once renglones que habla de sinergia, los dos logros que valen la pena enterrados dentro de párrafos y una sección de pasatiempos. El primer encargo es mirarlo siete segundos sin tocar nada —lo que le dedica quien tiene otros cuarenta encima de la mesa—, y contra ese cronómetro se decide todo lo demás: estilos en vez de negritas para que la mirada encuentre dónde saltar; un correo con nombre y apellido; los cuarenta errores documentados y el buscador del catálogo sacados a viñetas; once renglones recortados a dos; y una sección entera borrada, bien escrita y verdadera, porque le quitaba sitio a algo mejor. Al terminar no hay ni un dato nuevo. Insignia de Siete segundos.',
      layout: 'inmersivo',
    },
  },

  'n10-carreras-y-certificaciones': {
    meta: {
      id: 'n10-carreras-y-certificaciones',
      titulo: 'Carreras y certificaciones',
      nivel: 10,
      unidadId: 'n10-capstone-y-portafolio',
      eje: 'creatividad',
      duracionMin: 34,
      descripcion:
        'Panel de orientación profesional de Tecnia Rumbo, cierre de la unidad. Clasificas cinco familias reales de carreras tecnológicas —desarrollo, datos e IA, ciberseguridad, diseño UX/UI, redes e infraestructura en la nube— más allá del mito de que todas exigen programar todo el día. Aprendes a leer una certificación por lo que de verdad certifica y por lo que nunca garantiza, y decides —cruzando rasgos reales con situación real— la familia de carrera y el siguiente paso de tres estudiantes, justo antes de emprender tu propio proyecto capstone. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-capstone': {
    meta: {
      id: 'n10-capstone',
      titulo: 'Tu proyecto capstone',
      nivel: 10,
      unidadId: 'n10-capstone-y-portafolio',
      eje: 'creatividad',
      duracionMin: 45,
      descripcion:
        'El CAPSTONE de toda la plataforma: la última actividad, cierre de los diez niveles completos de Tecnia. Clasificas cinco problemas profesionales reales entre app, sitio web y análisis de datos, aplicas ese criterio al caso real de Estudio Cronos —un fotógrafo independiente—, y construyes su sitio de dos páginas con HTML y CSS reales: el nombre real, el precio real, un enlace entre páginas y un aviso real que corriges. Cierras conectando este criterio con tu portafolio y tu camino profesional ya decididos. Nueve encargos en cuatro actos. Insignia Graduado/a de Tecnia.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── N6 · «Mi primera página web» (documento §51) ──
   *
   * Las tres primeras clases montadas sobre el armazón `Tecnia Web`, y la
   * unidad entera: la misma página del club en tres estados —se abre por
   * dentro, se llena, se revisa y se publica—. N6 = 6.º de Primaria = 11–12
   * años, verificado en `curriculo.ts` y `niveles.ts`.
   */
  'n6-como-se-hace-una-pagina': {
    meta: {
      id: 'n6-como-se-hace-una-pagina',
      titulo: '¿Cómo se hace una página?',
      nivel: 6,
      unidadId: 'n6-mi-primera-pagina-web',
      eje: 'programacion',
      duracionMin: 15,
      descripcion:
        'Abres por dentro la página del club de robótica de tu escuela: el texto a la izquierda, la página a la derecha, y todo lo que escribes se ve al momento sin guardar. Le cambias el nombre al club, le pones nombre a la pestaña, y después la rompes a propósito —borras el cierre </h1>— para ver qué pasa: el párrafo de abajo se vuelve gigante y el programa te dice el archivo, la línea y el arreglo. La arreglas leyendo el aviso, no adivinando, y escribes tú una línea nueva. Siete encargos. Insignia de Abre el código. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n6-html-basico': {
    meta: {
      id: 'n6-html-basico',
      titulo: 'HTML básico',
      nivel: 6,
      unidadId: 'n6-mi-primera-pagina-web',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Tu página llega con la cabecera puesta y el cuerpo vacío, y la llenas tú con las cinco etiquetas de las que está hecha casi cualquier página: título, párrafo, lista, imagen y enlace. Pones una lista de tres proyectos sin escribir ni una viñeta, y aprendes las dos reglas que casi nadie cumple: contar con palabras lo que se ve en la foto —el aviso amarillo aparece aunque la foto se vea perfectamente— y escribir enlaces que digan a dónde llevan, porque «pincha aquí» no lo da por bueno. Siete encargos. Insignia de Constructor de páginas. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  'n6-publica-tu-pagina': {
    meta: {
      id: 'n6-publica-tu-pagina',
      titulo: 'Publica tu página',
      nivel: 6,
      unidadId: 'n6-mi-primera-pagina-web',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Hoy casi no escribes: revisas. Tu página llega terminada y con cuatro cosas mal, y la primera no es un error de código —es un teléfono, una calle y la hora a la que sales de la escuela, en una página que va a poder abrir cualquiera—. Quitas eso sin llevarte por delante el resto, arreglas el error rojo (el enlace al estilo tiene una letra de más, y al quitarla la página se llena de color de golpe), arreglas los dos avisos amarillos y le pones nombre a la pestaña. Sólo entonces se abre el panel de publicar, y la barra del navegador pasa a decir tu dirección. Cinco revisiones y tres pasos. Insignia de Publica con cabeza. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 7 · Unidad «Desarrollo web I» ── */
  'n7-html-estructura': {
    meta: {
      id: 'n7-html-estructura',
      titulo: 'HTML: la estructura',
      nivel: 7,
      unidadId: 'n7-desarrollo-web-1',
      eje: 'programacion',
      duracionMin: 15,
      descripcion:
        'Aprende a maquetar la arquitectura semántica de un sitio web con etiquetas HTML5: header, nav, main, section, article y footer. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  /* TEST 3 (Sonnet solo, sin pliego) — parada 2 de 3. El HTML llega con candado, el CSS nace en blanco. */
  'n7-css-estilo': {
    meta: {
      id: 'n7-css-estilo',
      titulo: 'CSS: el estilo',
      nivel: 7,
      unidadId: 'n7-desarrollo-web-1',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'La estructura del portal de ciencias ya no se toca: hoy escribes su hoja de estilos desde cero. Pintas el fondo y la letra de toda la página con dos colores que no se confundan entre sí, das color a los enlaces del menú y les quitas el subrayado, eliges tipografía y tamaño para el título y pones el subtítulo en mayúsculas y en negrita, justificas un párrafo y separas sus renglones, y cierras con el modelo de cajas completo: relleno, borde redondeado y margen en una tarjeta. Insignia de Estilista Web. Guardado automático.',
      layout: 'inmersivo',
    },
  },
  /* Parada 3 de 3 — cierre de la unidad. Tema libre, verificación estructural. */
  'n7-tu-sitio-personal': {
    meta: {
      id: 'n7-tu-sitio-personal',
      titulo: 'Proyecto: tu sitio personal',
      nivel: 7,
      unidadId: 'n7-desarrollo-web-1',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'El cierre de la unidad: construyes tu propio sitio de tres páginas HTML enlazadas entre sí —inicio, sobre mí y tus pasatiempos— sobre el tema que tú elijas, con una sola hoja de estilos compartida. Repites la cabecera y el menú en cada página, presentas tu tema, muestras tres tarjetas de pasatiempos, y vistes todo el sitio con colores y, por primera vez, "display: flex" para poner el menú y las tarjetas en fila. Insignia de Desarrollador Web. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 8 · Unidad «Desarrollo web II» ── */
  'n8-css-responsivo': {
    meta: {
      id: 'n8-css-responsivo',
      titulo: 'CSS responsivo',
      nivel: 8,
      unidadId: 'n8-desarrollo-web-2',
      eje: 'programacion',
      duracionMin: 25,
      descripcion:
        'TecniZine ya tiene una hoja de estilos completa, hecha para un monitor de escritorio, que se rompe en un celular: la adaptas sin borrar nada. Cambias anchos fijos en px por relativos en % con un tope de max-width, la tipografía a rem, dejas que las tarjetas salten de renglón con flex-wrap, y escribes tu primer punto de quiebre con @media (max-width: 600px) que cambia el menú, las tarjetas y el relleno del header en un celular — viendo las dos pantallas a la vez, nunca una sola que se encoge. Insignia de Diseño Responsivo.',
      layout: 'inmersivo',
    },
  },

  'n8-javascript-basico': {
    meta: {
      id: 'n8-javascript-basico',
      titulo: 'JavaScript básico',
      nivel: 8,
      unidadId: 'n8-desarrollo-web-2',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Tu proyecto tiene tres archivos —index.html, estilo.css y script.js— y hoy escribes el tercero. Cinco encargos: buscas un elemento de la página, te quedas a la escucha del clic de quien la usa, cambias el texto que se ve y enciendes una clase de CSS. Nada se recarga: la vista previa de al lado te lo enseña al momento. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n8-disena-tu-videojuego': {
    meta: {
      id: 'n8-disena-tu-videojuego',
      titulo: 'Diseña tu videojuego',
      nivel: 8,
      unidadId: 'n8-multimedia-y-videojuegos',
      eje: 'creatividad',
      duracionMin: 25,
      descripcion:
        'Cinco encargos sobre un nivel 3D que se juega de verdad: subes la gravedad y el impulso de salto hasta que el personaje alcance lo alto, añades la plataforma y el cristal que faltan, enciendes la luz de neón, y lo pruebas con el teclado hasta recoger el cristal. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n8-video-y-audio': {
    meta: {
      id: 'n8-video-y-audio',
      titulo: 'Video y audio',
      nivel: 8,
      unidadId: 'n8-multimedia-y-videojuegos',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'Montas un anuncio de quince segundos para las redes de la escuela: pones cuatro clips en la línea de tiempo, los ordenas en el orden que cuenta la historia, los recortas al segundo exacto, y controlas una música de fondo con las dos herramientas reales del editor —recortarla para que calle antes de una voz, y silenciarla entera para una segunda versión accesible. Diez encargos. Insignia de Editor de sonido.',
      layout: 'inmersivo',
    },
  },

  'n8-derechos-y-licencias': {
    meta: {
      id: 'n8-derechos-y-licencias',
      titulo: 'Derechos de autor y licencias',
      nivel: 8,
      unidadId: 'n8-multimedia-y-videojuegos',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'Cierras la unidad decidiendo, sin programa nuevo que aprender: clasificas recursos de procedencia distinta —propia, protegida, con licencia Creative Commons, dominio público—, decides si un uso concreto respeta tres tipos de licencia CC, escribes atribuciones que llevan nombre del autor y licencia, y cierras armando el conjunto completo de créditos que necesita un proyecto con varios recursos a la vez. Nueve encargos. Insignia de Créditos en regla.',
      layout: 'inmersivo',
    },
  },

  'n8-sitio-multipagina': {
    meta: {
      id: 'n8-sitio-multipagina',
      titulo: 'Proyecto: sitio de varias páginas',
      nivel: 8,
      unidadId: 'n8-desarrollo-web-2',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Cierras la unidad combinando todo: un sitio real de dos páginas (index.html y proyectos.html) con el mismo menú y el mismo estilo.css enlazado en las dos, navegación de verdad —un clic en un <a href> de tu vista previa te lleva a la otra página—, un punto de quiebre @media que apila el menú en móvil, y un botón de modo noche conectado con querySelector/addEventListener funcionando igual en ambas páginas. Insignia de Arquitecto de Sitios Web.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 9 · Unidad «Robótica e internet de las cosas» ── */
  'n9-casa-inteligente': {
    meta: {
      id: 'n9-casa-inteligente',
      titulo: 'Casa y ciudad inteligentes',
      nivel: 9,
      unidadId: 'n9-robotica-e-iot',
      eje: 'sistemas',
      duracionMin: 25,
      descripcion:
        'Cinco encargos sobre el plano de una casa: ajustas los tres sensores —luz, temperatura y presencia—, escribes las reglas «si esto, entonces aquello» que los conectan con las luces, el clima y el portón, y compruebas que la casa se mueve sola cuando toca. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n9-sensores-iot': {
    meta: {
      id: 'n9-sensores-iot',
      titulo: 'Sensores conectados (IoT)',
      nivel: 9,
      unidadId: 'n9-robotica-e-iot',
      eje: 'sistemas',
      duracionMin: 22,
      descripcion:
        'Antecede a «Casa y ciudad inteligentes»: nada de reglas IFTTT todavía. Identificas qué mide cada sensor del SmartSpace IoT Studio —LDR, DHT22, PIR— y por qué no son intercambiables, cazas lecturas físicamente imposibles (una humedad de 150%), descubres qué distingue a un sensor conectado a internet de uno aislado, y cierras diagnosticando un caso real sin programar ninguna automatización. Nueve encargos. Insignia de Lector de Sensores.',
      layout: 'inmersivo',
    },
  },

  'n9-automatiza-un-espacio': {
    meta: {
      id: 'n9-automatiza-un-espacio',
      titulo: 'Automatiza un espacio',
      nivel: 9,
      unidadId: 'n9-robotica-e-iot',
      eje: 'sistemas',
      duracionMin: 28,
      descripcion:
        'Proyecto final de la unidad: elige el objetivo de ahorro energético, decide qué sensor sirve para cada tarea, programa de verdad las reglas de Iluminación y Climatización en el motor IFTTT, corrige un bug real —una regla de acceso con la condición del sensor invertida—, prueba el plan en dos escenarios (día/noche) y cierra con el reporte de resultados. Nueve encargos sobre el mismo SmartSpace IoT Studio de sus dos hermanas. Insignia de Ingeniero de Automatización.',
      layout: 'inmersivo',
    },
  },

  /* ── Nivel 10 · Unidad «Desarrollo web integral» ── */
  'n10-proyecto-web-real': {
    meta: {
      id: 'n10-proyecto-web-real',
      titulo: 'HTML/CSS/JS en un proyecto real',
      nivel: 10,
      unidadId: 'n10-desarrollo-web-integral',
      eje: 'programacion',
      duracionMin: 25,
      descripcion:
        'Cinco encargos con los tres archivos abiertos: maquetas las tarjetas del tablero con CSS Grid, sacas los colores a variables para poder cambiarlos en un solo sitio, y escribes el filtro que va recortando la lista mientras alguien escribe. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n10-publica-tu-sitio': {
    meta: {
      id: 'n10-publica-tu-sitio',
      titulo: 'Publica tu sitio',
      nivel: 10,
      unidadId: 'n10-desarrollo-web-integral',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'El sitio de Estudio Lumen, el despacho de la arquitecta recién egresada Renata Solís, ya está construido — falta revisarlo como se revisa uno de verdad antes de publicarlo. Corriges un dato falso, arreglas un enlace roto en sus dos apariciones, terminas un texto y una foto que quedaron a medias, eliges el dominio correcto entre tres candidatos y activas HTTPS antes de que el formulario de contacto reciba un solo dato real. Nueve encargos, con el mecanismo real de publicación de Tecnia Web.',
      layout: 'inmersivo',
    },
  },

  'n10-ux-ui': {
    meta: {
      id: 'n10-ux-ui',
      titulo: 'Nociones de UX/UI',
      nivel: 10,
      unidadId: 'n10-desarrollo-web-integral',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Cierre de la unidad. Corriges tres defectos reales del sitio de Órbita Estudio —jerarquía tipográfica, contraste de color con la fórmula WCAG real y tamaño de texto— midiendo cada uno en el CSS de verdad, abres un flujo con más de un camino entre sus páginas, y cierras revisando el lanzamiento de un cliente nuevo combinando código, publicación y UX/UI: las tres paradas de la unidad juntas. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-amenazas-y-defensa': {
    meta: {
      id: 'n10-amenazas-y-defensa',
      titulo: 'Amenazas actuales y defensa',
      nivel: 10,
      unidadId: 'n10-ciberseguridad-profesional',
      eje: 'ciudadania',
      duracionMin: 25,
      descripcion:
        'Cinco encargos en la terminal de un centro de operaciones: miras las conexiones abiertas hasta dar con la que sobra, escribes la regla del cortafuegos que la deja fuera, abres el código que entró para ver qué hacía, y compruebas una firma antes de dar el incidente por cerrado. Guardado automático.',
      layout: 'inmersivo',
    },
  },

  'n10-identidad-y-cifrado': {
    meta: {
      id: 'n10-identidad-y-cifrado',
      titulo: 'Identidad, autenticación y cifrado',
      nivel: 10,
      unidadId: 'n10-ciberseguridad-profesional',
      eje: 'ciudadania',
      duracionMin: 30,
      descripcion:
        'En Orbitatek Soluciones, la pasante Regina Paredes acaba de recibir sus credenciales. Diagnosticas y construyes una contraseña real que no reutiliza datos de su perfil público, decides caso por caso si un segundo factor de autenticación detiene un ataque real, inspeccionas un correo de phishing dirigido a robar su identidad, y separas lo que el candado del navegador cifra de lo que sólo un certificado válido confirma. Diez encargos, todos evaluados con cómputo real, nunca contra un texto fijo.',
      layout: 'inmersivo',
    },
  },

  'n10-carreras-ciber': {
    meta: {
      id: 'n10-carreras-ciber',
      titulo: 'Carreras en ciberseguridad',
      nivel: 10,
      unidadId: 'n10-ciberseguridad-profesional',
      eje: 'ciudadania',
      duracionMin: 30,
      descripcion:
        'Cierre de la unidad. En Orbitatek Soluciones, Tadeo tiene que decidir qué camino de ciberseguridad seguir. Clasificas cinco roles reales —Analista SOC, Pentester, Arquitecto/a de seguridad, Oficial de cumplimiento y Especialista en respuesta a incidentes— separando el mito de que todos programan todo el día de lo que cada uno hace de verdad, decides qué candidato encaja en cuál según sus habilidades reales, y cierras conectando la defensa técnica y la protección de identidad de las dos paradas anteriores con el trabajo diario de cada rol. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── Tecnia Diseño (documento §54) ──
   *
   * Las tres primeras clases sobre el armazón `simuladores/diseno` (editor
   * gráfico con capas, cerrado con 30 pruebas verdes). Van juntas aquí
   * —aunque sean de tres niveles distintos— porque comparten armazón,
   * portada y motor de guion (`activities/diseno/useGuionDiseno.ts`), igual
   * que las clases de volumen comparten el Banco Físico 3D.
   */
  'n6-carteles-e-infografias': {
    meta: {
      id: 'n6-carteles-e-infografias',
      titulo: 'Carteles e infografías',
      nivel: 6,
      unidadId: 'n6-diseno-y-multimedia',
      eje: 'creatividad',
      duracionMin: 15,
      descripcion:
        'Tu lienzo llega vacío y construyes un cartel con las cuatro reglas de un buen cartel: un título que se lee primero, agrandado y centrado con la herramienta —no a ojo—, la información de apoyo debajo y estrictamente más chica (jerarquía de verdad), y un fondo de color cuidando no pasarte de cuatro colores distintos en total. El editor cuadricula el lienzo: o algo está centrado exacto, o no lo está. Cuatro encargos. Insignia de Diseñador de carteles.',
      layout: 'inmersivo',
    },
  },
  'n6-crea-con-ia': {
    meta: {
      id: 'n6-crea-con-ia',
      titulo: 'Crea con IA (guiado y citado)',
      nivel: 6,
      unidadId: 'n6-diseno-y-multimedia',
      eje: 'creatividad',
      duracionMin: 18,
      descripcion:
        'Abres el Estudio de Generación —no un chat de texto libre— y armas una petición eligiendo cuatro piezas: qué, cómo, para dónde y qué no. Con una sola pieza salen tres imágenes genéricas; con las cuatro, salen otras más cercanas y descartas las dos que no cumplen (una con letras revueltas, otra con una persona que pediste que no saliera). Pides exactamente lo mismo otra vez y compruebas que nunca sale igual, pones la elegida de fondo en tu cartel y firmas de dónde salió con tres datos: herramienta, petición y fecha. Siete encargos. Insignia de Creador que cita.',
      layout: 'inmersivo',
    },
  },
  /*
   * Parada 2 de la misma unidad, y la que estrenó la línea de tiempo del editor
   * (`simuladores/diseno/cinta.ts`): la primera pieza de vídeo del proyecto.
   */
  'n6-edita-imagen-y-video': {
    meta: {
      id: 'n6-edita-imagen-y-video',
      titulo: 'Edita imagen y video',
      nivel: 6,
      unidadId: 'n6-diseno-y-multimedia',
      eje: 'creatividad',
      duracionMin: 20,
      descripcion:
        'Endereza y encuadra la foto de portada de un video, y la cambia por otra que sí sirve. Monta tres clips con su música en una línea de tiempo nueva que va en segundos enteros, cortando lo que sobra hasta que el video dure doce segundos exactos y la canción termine justo con la imagen.',
      layout: 'inmersivo',
    },
  },
  'n8-imagen-con-capas': {
    meta: {
      id: 'n8-imagen-con-capas',
      titulo: 'Imagen con capas',
      nivel: 8,
      unidadId: 'n8-multimedia-y-videojuegos',
      eje: 'creatividad',
      duracionMin: 15,
      descripcion:
        'Apilas tres capas —fondo, personaje y un marco decorativo— y aprendes que cada imagen nueva nace encima de las anteriores: cuando el marco tapa tu composición, la arreglas con «Enviar atrás», no borrando y empezando de nuevo, y esa reordenación queda contada en tu historial. Cierra dando crédito a la autora de la imagen que pide atribución, escribiendo su nombre en el propio cartel. Cuatro encargos. Insignia de Compositor de capas.',
      layout: 'inmersivo',
    },
  },
  'n9-boceta-tu-app': {
    meta: {
      id: 'n9-boceta-tu-app',
      titulo: 'Boceta tu app',
      nivel: 9,
      unidadId: 'n9-desarrollo-de-aplicaciones',
      eje: 'programacion',
      duracionMin: 15,
      descripcion:
        'Bocetas dos pantallas de una app —Inicio y Detalle— con texto y formas, y enlazas un botón de una a la otra para que el prototipo se pueda TOCAR y no sólo mirarse: tocar el botón de verdad lleva a la otra pantalla. El editor revisa al final que ninguna pantalla se quede huérfana y que ningún enlace apunte a la nada. Cuatro encargos. Insignia de Diseñador de flujos.',
      layout: 'inmersivo',
    },
  },

  'n9-construye-low-code': {
    meta: {
      id: 'n9-construye-low-code',
      titulo: 'Constrúyela low-code',
      nivel: 9,
      unidadId: 'n9-desarrollo-de-aplicaciones',
      eje: 'programacion',
      duracionMin: 25,
      descripcion:
        'Construyes «Mis tareas», una app de tres pantallas —Inicio, Lista y Detalle— con una herramienta low-code de verdad: nombras cada control con propósito (nada de «Botón 1»), enlazas cuatro caminos —Inicio tiene dos salidas y Detalle se alcanza por más de un camino— y el editor revisa que el mapa completo navegue sin pantallas huérfanas ni enlaces rotos. Nueve encargos. Insignia de Constructor low-code.',
      layout: 'inmersivo',
    },
  },

  'n9-pruebas-con-usuarios': {
    meta: {
      id: 'n9-pruebas-con-usuarios',
      titulo: 'Pruébala con usuarios',
      nivel: 9,
      unidadId: 'n9-desarrollo-de-aplicaciones',
      eje: 'programacion',
      duracionMin: 22,
      descripcion:
        'Cierras la unidad: cinco personas probaron «Mis tareas» y tú lees lo que hicieron, no lo que dijeron. Diagnosticas cuatro sesiones por su comportamiento real, distingues un patrón —tres de cinco personas perdidas en el mismo botón— de una opinión aislada, priorizas los arreglos por severidad × frecuencia, y decides si la app está lista para publicarse o necesita otra ronda. Nueve encargos. Insignia de Analista de Usabilidad.',
      layout: 'inmersivo',
    },
  },

  /*
   * Cierre de N5·U4 «Programación en bloques III». Vive aquí, con las de
   * `diseno/`, porque monta ese editor —el §54 lo dejó escrito—, pero sus
   * preguntas NO son de diseño gráfico: el lienzo es papel para bocetar y lo
   * que se corrige es si el plan está completo, si cabe y si el orden se
   * puede hacer. Sus dos paradas anteriores están con las de `bloques/`.
   */
  'n5-planea-tu-proyecto': {
    meta: {
      id: 'n5-planea-tu-proyecto',
      titulo: 'Planea tu proyecto',
      nivel: 5,
      unidadId: 'n5-bloques-3',
      eje: 'programacion',
      duracionMin: 20,
      descripcion:
        'Metes en un tablero todas las piezas del juego que quieres hacer y descubres, en papel, que tu idea cuesta diez semanas y sólo tienes seis. Recortas hasta que quepa sin quedarte sin juego —lo que sale no se tira, se guarda para más adelante—, ordenas lo que queda para que nada vaya antes de lo que necesita, y bocetas la primera pantalla que vas a programar. Seis encargos. Insignia de Jefe de proyecto.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── Las clases de volumen (documento §53) ──
   *
   * Tres de las SIETE actividades de las 104 que llevan 3D, y las tres primeras
   * montadas sobre el armazón `simuladores/laboratorio3d/`. Van juntas aquí
   * —aunque sean de dos niveles distintos— porque comparten armazón, chasis,
   * portada y geometría: un equipo de escritorio, visto por detrás, por dentro
   * y sobre la mesa de diagnóstico.
   */
  'n5-conecta-perifericos': {
    meta: {
      id: 'n5-conecta-perifericos',
      titulo: 'Conecta los periféricos',
      nivel: 5,
      unidadId: 'n5-el-sistema-de-computo',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'El laboratorio se abre en dos hojas: a la izquierda una página con fotografías de conectores reales, a la derecha el equipo en 3D, girable de verdad hasta ponerte detrás. Conectas seis cables leyendo su forma —dos USB, HDMI, jack de 3,5 mm, RJ-45 y corriente— sobre un panel trasero con nueve puertos. El HDMI rebota en el VGA porque no entra, los dos USB son intercambiables porque de verdad lo son, y el jack de las bocinas entra en los tres agujeros de audio y sólo el verde es el suyo: ahí aprendes que «entra» y «está bien» no son lo mismo. Cierras subiendo la palanca del regulador. Insignia de Maestro del panel trasero.',
      layout: 'inmersivo',
    },
  },
  'n5-manos-al-mantenimiento': {
    meta: {
      id: 'n5-manos-al-mantenimiento',
      titulo: 'Manos al mantenimiento',
      nivel: 5,
      unidadId: 'n5-el-sistema-de-computo',
      eje: 'sistemas',
      duracionMin: 10,
      descripcion:
        'El equipo del salón se apaga solo a los diez minutos y no está roto: está sucio. Le das mantenimiento en 3D y en el orden que no se negocia —fuera la corriente, descarga la estática tocando el chasis, los dos tornillos de mariposa, la tapa, el aire comprimido en el ventilador y en el disipador, la RAM reasentada— y después todo al revés, sin dejar un solo tornillo fuera. Intentar abrir con el cable puesto o meter la mano dentro sin descargar la estática no se ignora: se explica y resta. Insignia de Manos de mantenimiento.',
      layout: 'inmersivo',
    },
  },
  'n7-diagnostica-y-soluciona': {
    meta: {
      id: 'n7-diagnostica-y-soluciona',
      titulo: 'Diagnostica y soluciona',
      nivel: 7,
      unidadId: 'n7-arquitectura-y-sistemas',
      eje: 'sistemas',
      duracionMin: 12,
      descripcion:
        'Cierre de la Bahía de Montaje. Primero armas el protocolo de diagnóstico en el carril de la mesa: cinco chapas grabadas en su casilla, y dos que parecen soluciones —«reinstala el sistema», «cambia la pieza más cara»— y son el último recurso. Después resuelves cinco averías reales sobre un equipo destripado: lees el síntoma en la pizarra, eliges de la caja el instrumento que descarta y el punto exacto donde aplicarlo, y sólo entonces aplicas la solución mínima. Fallar tiene dos formas y las dos enseñan: el instrumento que no mide eso, y el instrumento correcto en el sitio donde el problema no está. Insignia de Técnico junior.',
      layout: 'inmersivo',
    },
  },

  // ── Tres primeras clases sobre `simuladores/muro/` (armazón cerrado el
  // 15-ago-2026; construidas el mismo día) ──
  'n6-privacidad-en-juegos': {
    meta: {
      id: 'n6-privacidad-en-juegos',
      titulo: 'Privacidad en redes y juegos',
      nivel: 6,
      unidadId: 'n6-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 12,
      descripcion:
        'Entras a Tecnia Muro y encuentras una publicación tuya ya en "Público" con tus horarios de juego. Un desconocido comenta algo que sólo pudo saber por haberla leído — la consecuencia llega un turno después, nunca con un aviso al publicar. Ajustas la visibilidad, y practicas publicar de nuevo eligiendo la audiencia ANTES: público, sólo amigos o sólo tú. Insignia de Elige quién te ve.',
      layout: 'inmersivo',
    },
  },
  'n6-alto-al-ciberacoso': {
    meta: {
      id: 'n6-alto-al-ciberacoso',
      titulo: 'Alto al ciberacoso',
      nivel: 6,
      unidadId: 'n6-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 12,
      descripcion:
        'Publicas un dibujo tuyo en Tecnia Muro y, un turno después, alguien escribe un comentario cruel. Decides qué hacer: contestar igual, quedarte callada o reportar y bloquear — equivocarte no baja el puntaje ni cierra el paso, se explica y la decisión sigue abierta. La actividad más delicada de la tanda: "No es tu culpa" se dice cinco veces, con esas letras exactas. Insignia de Sabe defenderse sin pelear.',
      layout: 'inmersivo',
    },
  },
  /*
   * La parada 1 de esa unidad, y la primera clase de toda la casa que monta
   * `simuladores/navegador/`. Va ahí y no en `muro/` como sus dos hermanas por
   * el motivo que decidió su diseño: reutilizar una contraseña no es propiedad
   * de UNA contraseña sino de VARIAS cuentas a la vez, y el único programa que
   * enseña varias cuentas a la vez es un navegador con pestañas.
   */
  'n6-contrasenas-fuertes': {
    meta: {
      id: 'n6-contrasenas-fuertes',
      titulo: 'Contraseñas fuertes y 2 pasos',
      nivel: 6,
      unidadId: 'n6-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 14,
      descripcion:
        'Pruebas tres contraseñas de personajes de ficción en la máquina de adivinar y descubres en qué paso caen: la lista, un dato de su perfil o un disfraz. Sacas tu propia frase de cuatro palabras, le pones llave a tus tres cuentas abiertas (juego, escuela y videos), y reparas sin culpa una filtración cuando el sitio de videos pierde su lista. Cierras activando la verificación en dos pasos y aprendiendo a no darle el código a una ventana emergente que dice ser el soporte del juego.',
      layout: 'inmersivo',
    },
  },
  /*
   * Y el cierre de toda la primaria: la única actividad `integradora` de N6.
   * Monta DOS programas —el navegador para investigar y la ventana de
   * diapositivas más el auditorio para analizar, diseñar y presentar— porque
   * un artefacto viaja de punta a punta: lo que marca en el acto 1 es la
   * galería del acto 2, y el público del acto 3 pregunta sobre lo que montó.
   */
  'n6-proyecto-integrador': {
    meta: {
      id: 'n6-proyecto-integrador',
      titulo: 'Tu proyecto integrador',
      nivel: 6,
      unidadId: 'n6-proyecto-integrador-primaria',
      eje: 'datos-ia',
      duracionMin: 20,
      descripcion:
        'Investigas en el navegador y guardas sólo lo que sirve para sostener algo. Armas cuatro diapositivas: escribes lo que vas a sostener, eliges la gráfica que habla de eso y pegas tus fuentes. Subes al escenario y defiendes tu proyecto delante de un público que pregunta.',
      layout: 'inmersivo',
    },
  },
  'n7-privacidad-en-redes': {
    meta: {
      id: 'n7-privacidad-en-redes',
      titulo: 'Privacidad en redes',
      nivel: 7,
      unidadId: 'n7-ciudadania-digital-critica',
      eje: 'ciudadania',
      duracionMin: 14,
      descripcion:
        'Auditas tu propio perfil de Tecnia Muro tal como lo vería un desconocido: tres publicaciones públicas sueltan pistas —tu escuela, tu mascota, tu calle— y las vas cerrando, una por una, cambiando su audiencia o borrándolas. La de la calle llevaba semanas pública: borrarla la saca del perfil al instante, pero un turno después descubres que alguien ya la había visto — auditar tarde no deshace lo ya visto, pero sí evita que lo vea alguien más desde hoy. Insignia de Sabe auditar su perfil.',
      layout: 'inmersivo',
    },
  },
  'n7-riesgos-y-marco-legal': {
    meta: {
      id: 'n7-riesgos-y-marco-legal',
      titulo: 'Riesgos en línea y marco legal',
      nivel: 7,
      unidadId: 'n7-ciudadania-digital-critica',
      eje: 'ciudadania',
      duracionMin: 20,
      descripcion:
        'Tres conversaciones en Tecnia Mensajes: Ruy, que se gana tu confianza poco a poco hasta pedirte secreto y verte a solas; el grupo del salón, donde alguien empieza a pasar una foto privada de una compañera y tú decides si la reenvías o la detienes; y una cuenta nueva que te amenaza con exponer algo tuyo si no le das tu cuenta del juego. El Radar de Señales se enciende con cada patrón que reconoces y ya no se apaga, y una mesa legal te explica —sin sustos ni artículos de ley— qué dice la ley y a quién acudir. Insignia de La ley está de tu lado.',
      layout: 'inmersivo',
    },
  },
  'n7-equilibrio-digital': {
    meta: {
      id: 'n7-equilibrio-digital',
      titulo: 'Equilibrio digital',
      nivel: 7,
      unidadId: 'n7-ciudadania-digital-critica',
      eje: 'ciudadania',
      duracionMin: 15,
      descripcion:
        'Es viernes en la noche: tienes tarea pendiente, la cena está por servirse y el teléfono no deja de sonar. Decides, aviso por aviso, qué puede esperar y qué no —el meme de los amigos, el mensaje urgente de mamá, el cofre "por tiempo limitado" del juego que finge ser urgente sin serlo— y armas tu propio modo de enfoque eligiendo a quién dejas sonar mientras trabajas. Equilibrio digital no es apagar el teléfono: es aprender a distinguir qué aviso sí puede esperar. Insignia de Sabe elegir cuándo conectarse.',
      layout: 'inmersivo',
    },
  },
  'n8-malware-e-ingenieria-social': {
    meta: {
      id: 'n8-malware-e-ingenieria-social',
      titulo: 'Malware e ingeniería social',
      nivel: 8,
      unidadId: 'n8-redes-y-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 16,
      descripcion:
        'Cinco correos en la bandeja de Mateo. Dos son de verdad. Los otros tres combinan más de un truco a la vez —un adjunto con doble extensión, un pretexto fabricado, una urgencia diseñada a propósito, una dirección que suplanta a alguien real— y ya no basta con mirar la prisa. Tecnia Correo trae las lupas para destapar la dirección real, a dónde va el enlace y qué tipo de archivo es el adjunto. Insignia de Cazador de correos.',
      layout: 'inmersivo',
    },
  },
  'n8-ip-wifi-servidores': {
    meta: {
      id: 'n8-ip-wifi-servidores',
      titulo: 'IP, wifi y servidores',
      nivel: 8,
      unidadId: 'n8-redes-y-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 20,
      descripcion:
        'La tablet de Bit ve cuatro redes wifi, dos con el mismo nombre: eliges la real entre una gemela abierta, escribes la contraseña de la etiqueta del router, y distingues una IP local (192.168.x.x) de una pública. Descubres que toda una casa comparte una sola IP hacia afuera, qué hace un router de verdad, mandas una petición real a un servidor y ves a otro quedarse sin contestar porque está apagado. Insignia de Lees el panel de red como quien entiende.',
      layout: 'inmersivo',
    },
  },
  'n8-cifrado-basico': {
    meta: {
      id: 'n8-cifrado-basico',
      titulo: 'Cifrado básico',
      nivel: 8,
      unidadId: 'n8-redes-y-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 20,
      descripcion:
        'Cifras mensajes reales con la máquina César moviendo un dial, descifras uno interceptado probando las 25 claves posibles por fuerza bruta, y descubres por qué ese cifrado ya no protege nada de verdad. Luego navegas cuatro sitios reales con Tecnia Navegador y decides si es seguro escribir tu contraseña, leyendo el candado con sus tres estados: seguro, certificado inválido, o sin cifrar. Insignia de El candado y la clave.',
      layout: 'inmersivo',
    },
  },
  'n8-habitos-de-proteccion': {
    meta: {
      id: 'n8-habitos-de-proteccion',
      titulo: 'Hábitos de protección',
      nivel: 8,
      unidadId: 'n8-redes-y-ciberseguridad',
      eje: 'ciudadania',
      duracionMin: 25,
      descripcion:
        'Cierras la unidad combinando todo: forjas una contraseña fuerte de verdad (el medidor evalúa en vivo cualquier cosa que escribas), reconoces qué app necesita actualizarse antes de que el malware la aproveche, bloqueas un intento de acceso aunque tenía tu contraseña correcta, y terminas cambiando tu clave —distinta de la anterior— y activando la verificación en dos pasos, cruzando de vuelta por Tecnia Correo y Tecnia Navegador con contenido nuevo. Insignia de Tus hábitos ya son tu escudo.',
      layout: 'inmersivo',
    },
  },
  'n9-gestiona-tu-proyecto': {
    meta: {
      id: 'n9-gestiona-tu-proyecto',
      titulo: 'Gestiona tu proyecto',
      nivel: 9,
      unidadId: 'n9-nube-y-colaboracion',
      eje: 'creatividad',
      duracionMin: 15,
      descripcion:
        'El tablero real de un equipo de tres —Iker, Melissa y Diego— construyendo una app: siete tarjetas, tres sin dueño y dos sin fecha. Asignas responsables, pones fechas, mueves tarjetas con las flechas ◀▶ (nunca arrastre) y cierras el proyecto archivando una columna que se rechaza sola si todavía tiene tarjetas dentro. Insignia de Nada se queda huérfano.',
      layout: 'inmersivo',
    },
  },

  'n9-trabajo-colaborativo': {
    meta: {
      id: 'n9-trabajo-colaborativo',
      titulo: 'Trabajo colaborativo en la nube',
      nivel: 9,
      unidadId: 'n9-nube-y-colaboracion',
      eje: 'creatividad',
      duracionMin: 22,
      descripcion:
        'Entras a la propuesta compartida del equipo: decides cuándo la llave correcta es editar y cuándo es comentar, revisas quién anda dentro del documento antes de escribir para no pisar a nadie, resuelves un choque de verdad conservando ambas versiones sin fundirlas, mides el riesgo de un enlace que se escapó al chat del grado, y cierras ajustando el permiso de un colaborador de editar a comentar. Ocho encargos, cuatro colaboradores con papeles distintos.',
      layout: 'inmersivo',
    },
  },

  'n9-marca-personal': {
    meta: {
      id: 'n9-marca-personal',
      titulo: 'Marca personal y portafolio',
      nivel: 9,
      unidadId: 'n9-emprendimiento-e-identidad',
      eje: 'ciudadania',
      duracionMin: 26,
      descripcion:
        'Bruno postula a un programa de verano y necesita un portafolio en línea. Construyes sus cinco piezas —encabezado, presentación, proyectos, habilidades, contacto— con HTML y CSS real, y en el camino tomas cuatro decisiones con casos reales: el mismo dato juzgado no por si es peligroso, sino por si le sirve a quien va a leer esta página en concreto. Cierras dándole a todo el sitio el mismo acento de marca. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n9-ecommerce-y-marketing': {
    meta: {
      id: 'n9-ecommerce-y-marketing',
      titulo: 'E-commerce y marketing digital',
      nivel: 9,
      unidadId: 'n9-emprendimiento-e-identidad',
      eje: 'ciudadania',
      duracionMin: 24,
      descripcion:
        'Regina quiere vender sus pulseras de resina en línea. Clasificas tres páginas de producto (clara vs. confusa), separas cuatro resultados de búsqueda entre contenido orgánico y anuncio pagado, diagnosticas qué le falta a dos anuncios reales, y decides si dos tiendas son confiables o sospechosas —una con candado HTTPS válido y aun así sospechosa: el candado protege la conexión, no al vendedor—. Cierras armando el plan honesto de Regina, descartando lo que vende rápido pero rompe la confianza. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n9-empleos-tecnologicos': {
    meta: {
      id: 'n9-empleos-tecnologicos',
      titulo: 'Los nuevos empleos tech',
      nivel: 9,
      unidadId: 'n9-emprendimiento-e-identidad',
      eje: 'ciudadania',
      duracionMin: 24,
      descripcion:
        'Cierras la unidad: clasificas cinco empleos tech reales más allá de "programador" y relacionas dos perfiles con el puesto que de verdad les queda, separas habilidades técnicas de transferibles con el caso de alguien que no sabe programar y sí trabaja en tecnología, decides qué tareas de un empleo ya automatiza una IA y cuáles siguen pidiendo criterio humano, y cierras un caso que integra el portafolio de Bruno y el plan de Regina para decidir un camino tech con criterio. Nueve encargos, panel Tecnia Brújula.',
      layout: 'inmersivo',
    },
  },

  /*
   * ── Tecnia Datos · las clases de SQL ─────────────────────────────────────
   *
   * Van juntas en `activities/datos/`, igual que Python y Office viven en su
   * propia carpeta: lo que las hermana es el programa que montan (el editor
   * de consultas), no el nivel. La primera es de 3.º de secundaria y las
   * otras dos de bachillerato; cada una declara su nivel y su unidad aquí.
   * `n10-conecta-tus-datos` (canon, fila 89) sigue bloqueada: monta
   * `VentanaHojas` y ese puente todavía no está escrito (documento §49.2).
   */
  'n9-bases-de-datos-iniciales': {
    meta: {
      id: 'n9-bases-de-datos-iniciales',
      titulo: 'Bases de datos iniciales',
      nivel: 9,
      unidadId: 'n9-algoritmos-y-datos',
      // El eje lo manda el currículo, no el tema: `n9-algoritmos-y-datos` es de
      // eje `programacion`. Escrito aquí como `datos-ia` —que es de lo que habla
      // la clase— rompía `registro-actividades.test.ts`, que exige que el eje
      // del registro coincida con el de su unidad.
      eje: 'programacion',
      duracionMin: 28,
      descripcion:
        'Abres biblioteca.sql: una base con dos tablas ya cargadas. Lees el árbol de tablas y su clave primaria, escribes tu primer SELECT * FROM, y rompes una consulta A PROPÓSITO —una tabla mal escrita— para aprender a leer el error en vez de temerle. Después cae la trampa clásica: WHERE prestado_a = NULL nunca encuentra los libros que están en el estante, porque NULL no es un cero ni un vacío, es «no se sabe» — y para preguntar por él existe IS NULL. Insignia de Primera consulta.',
      layout: 'inmersivo',
    },
  },

  'n9-busqueda-y-ordenamiento': {
    meta: {
      id: 'n9-busqueda-y-ordenamiento',
      titulo: 'Búsqueda y ordenamiento',
      nivel: 9,
      unidadId: 'n9-algoritmos-y-datos',
      eje: 'programacion',
      duracionMin: 30,
      descripcion:
        'Escribes dos programas que usa cualquier app de verdad: una búsqueda lineal contando cada comparación real —y comprobando que buscar al final cuesta más que buscar al principio—, y un ordenamiento burbuja completo con bucles anidados, que rompes a propósito con un IndexError real y arreglas. Cierras comparando el costo de buscar en una lista ordenada contra una desordenada. Nada de notación Big-O: todo se mide con contadores que tu propio código lleva. Diez encargos. Insignia de Algoritmos con Números Reales.',
      layout: 'inmersivo',
    },
  },

  'n9-datos-con-python': {
    meta: {
      id: 'n9-datos-con-python',
      titulo: 'Proyectos de datos con Python',
      nivel: 9,
      unidadId: 'n9-algoritmos-y-datos',
      eje: 'programacion',
      duracionMin: 28,
      descripcion:
        'Cierras la unidad con un proyecto de datos real —ocho registros, uno sin calificación—: provocas y arreglas un error real al sumar un dato que falta (None), filtras construyendo listas nuevas, agregas con sum(), max() y min() (su primer uso en todo el curso), encuentras el nombre detrás del extremo, y cierras con un reporte que decide una conclusión sobre el grupo. Nueve encargos. Insignia de Analista de Datos.',
      layout: 'inmersivo',
    },
  },

  'n10-modela-tus-datos': {
    meta: {
      id: 'n10-modela-tus-datos',
      titulo: 'Modela tus datos',
      nivel: 10,
      unidadId: 'n10-bases-de-datos-y-sql',
      eje: 'datos-ia',
      duracionMin: 32,
      descripcion:
        'proyecto.sql arranca vacío: diseñas tú la base del club de robótica. Provocas un error de orden —una tabla que apunta a otra que no existe todavía—, creas las dos tablas relacionadas con CREATE TABLE, PRIMARY KEY y REFERENCES, y las pueblas con INSERT. Por el camino topas con NOT NULL a propósito, y con la lección central de la clase: la clave foránea SE CUMPLE de verdad, y el motor no te deja anotar a nadie en un equipo que no existe. Insignia de Arquitecta de datos.',
      layout: 'inmersivo',
    },
  },
  'n10-consultas-sql': {
    meta: {
      id: 'n10-consultas-sql',
      titulo: 'Consultas SQL',
      nivel: 10,
      unidadId: 'n10-bases-de-datos-y-sql',
      eje: 'datos-ia',
      duracionMin: 34,
      descripcion:
        'consultas.sql ya tiene datos: el mismo club de robótica, ahora con integrantes de verdad. Filtras con WHERE, ordenas con ORDER BY y DESC, buscas por patrón con LIKE, cortas el resultado con LIMIT y lees el pie de una tabla de 150 filas que la pantalla sólo dibuja hasta la 100. Terminas uniendo dos tablas con JOIN … ON, provocando a propósito el error de columna ambigua, y descubriendo por qué un compañero sin equipo asignado desaparece del resultado: NULL no casa con nada, ni siquiera dentro de un JOIN. Insignia de Consultora de datos.',
      layout: 'inmersivo',
    },
    /*
     * APUNTA A `datos/`, NO A `n10/datos/` (2-sep-2026).
     *
     * De esta clase hay DOS implementaciones completas en el arbol, y
     * hasta hoy el registro cargaba la equivocada. La prueba de cual es
     * la buena no es de gusto, son tres hechos que ya estaban escritos:
     *   1. La `descripcion` de aqui arriba —LIKE, LIMIT, el pie de una
     *      tabla de 150 filas, la columna ambigua, el NULL que no casa—
     *      describe palabra por palabra `datos/LabConsultasSql.tsx`.
     *   2. El video publicado para este id narra el club de robotica con
     *      WHERE y ORDER BY … DESC; el otro laboratorio va de una tienda
     *      llamada TecniMarket. El alumno veia un video y jugaba otra cosa.
     *   3. `datos/LabConsultasSql.tsx` corrige contra el RESULTADO que
     *      devuelve el motor de `simuladores/datos` (las filas, su orden,
     *      la clase del error); `n10/datos/LabConsultasSql.tsx` corregia
     *      buscando palabras dentro del texto tecleado, asi que
     *      `SELECT * FROM productos WHERE nombre = 'completado'` —que no
     *      devuelve ni una fila— daba la clase por terminada con 500
     *      puntos.
     * La ruta de la unidad es identica en los dos (mismos ids, mismos
     * titulos), asi que la navegacion no cambia. El archivo de
     * `n10/datos/` se deja donde esta: aqui no se borra nada.
     */
  },

  'n10-conecta-tus-datos': {
    meta: {
      id: 'n10-conecta-tus-datos',
      titulo: 'Conecta datos con hojas y apps',
      nivel: 10,
      unidadId: 'n10-bases-de-datos-y-sql',
      eje: 'datos-ia',
      duracionMin: 34,
      descripcion:
        'Cierre de «Bases de datos y SQL». TecniMarket necesita un resumen de ventas por categoría, y ese resumen no vive en la base de datos: vive en una hoja de cálculo. Escribes una consulta SQL real con JOIN, GROUP BY y HAVING sobre el motor real, lees los resultados —ningún cable conecta los dos programas—, los transcribes a mano a una hoja de cálculo real, y sacas SUMA, MAX, PROMEDIO y un conteo condicional con fórmulas reales. Diez encargos, dos programas reales.',
      layout: 'inmersivo',
    },
  },

  'n10-python-intermedio': {
    meta: {
      id: 'n10-python-intermedio',
      titulo: 'Python intermedio',
      nivel: 10,
      unidadId: 'n10-programacion-aplicada',
      eje: 'programacion',
      duracionMin: 35,
      descripcion:
        'TecniMarket cerró la semana y necesita su reporte de ventas. Escribes dos funciones propias con una sola responsabilidad cada una —suma_manual y clasifica_venta, la regla que sólo conoce este negocio—, comparas ese mismo cálculo con las funciones nativas de la librería estándar (sum, max, min, sorted, round), y decides, sin escribir código, por qué un proyecto real se organiza en archivos y en módulos. Cierras con un reporte que integra tu código con el de la librería. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-problemas-de-concurso': {
    meta: {
      id: 'n10-problemas-de-concurso',
      titulo: 'Problemas tipo concurso',
      nivel: 10,
      unidadId: 'n10-programacion-aplicada',
      eje: 'programacion',
      duracionMin: 35,
      descripcion:
        'TecniMarket organiza un torneo interno de programación para su equipo júnior. Resuelves cinco problemas breves con Python real: contar quién avanza de ronda, encontrar el mejor tiempo a mano y confirmarlo con min(), invertir una lista de finalistas sin atajos, sumar los dígitos de un folio, y escribir tu propia función es_primo() —probada con casos conocidos antes de aplicarla a todos los datos— para clasificar los números de mesa de la final. Ocho encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-analisis-con-codigo': {
    meta: {
      id: 'n10-analisis-con-codigo',
      titulo: 'Analiza datos con código',
      nivel: 10,
      unidadId: 'n10-programacion-aplicada',
      eje: 'programacion',
      duracionMin: 35,
      descripcion:
        'Cierre de «Programación aplicada». TecniMarket quiere analizar su catálogo completo —no una sola columna de números, sino una tabla con nombre, categoría y precio de seis productos—. Recorres la lista de diccionarios con tus propios bucles, usas las funciones nativas para totales y promedios, y decides cuándo un atajo de la librería no alcanza —max() no compara diccionarios— y hay que resolverlo a mano. Diez encargos, sin ninguna librería de análisis de datos: todo con lo que ya sabes.',
      layout: 'inmersivo',
    },
  },

  'n10-como-funcionan-los-modelos': {
    meta: {
      id: 'n10-como-funcionan-los-modelos',
      titulo: 'Cómo funcionan los modelos',
      nivel: 10,
      unidadId: 'n10-ia-y-ciencia-de-datos',
      eje: 'datos-ia',
      duracionMin: 35,
      descripcion:
        'La Mesa de Soporte de TecniMarket construyó un clasificador interno de prioridad de tickets. Auditas su pipeline completo con un motor real de árbol de decisión: separas entrenamiento y examen, lees el informe del árbol —qué regla es memoria pura (overfitting) y cuál generaliza, dónde tiene un punto ciego antes de probarlo—, mides contra una semana de campo real una brecha de 1,00 por grupo, y entrenas un segundo modelo dos veces —con y sin la opción insistir— para ver el límite exacto de un árbol de decisión ante una interacción entre rasgos. Nueve encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-flujos-con-ia': {
    meta: {
      id: 'n10-flujos-con-ia',
      titulo: 'Flujos de trabajo con IA',
      nivel: 10,
      unidadId: 'n10-ia-y-ciencia-de-datos',
      eje: 'datos-ia',
      duracionMin: 35,
      descripcion:
        'La Mesa de Soporte de TecniMarket quiere usar un asistente de IA generativa para su reporte semanal a gerencia. Clasificas los seis pasos reales del flujo con una sola regla —qué puede seguir la IA sola, qué necesita revisión humana, qué no se delega nunca— y la aplicas a un paso nuevo. Encadenas dos peticiones reales a Tecnia Asistente —un resumen interno, un borrador de correo— y cazas un dato inventado distinto en cada una antes de que llegue a gerencia. Ocho encargos.',
      layout: 'inmersivo',
    },
  },

  'n10-etica-y-regulacion': {
    meta: {
      id: 'n10-etica-y-regulacion',
      titulo: 'Ética profesional y regulación',
      nivel: 10,
      unidadId: 'n10-ia-y-ciencia-de-datos',
      eje: 'datos-ia',
      duracionMin: 35,
      descripcion:
        'Cierre de «IA y ciencia de datos». TecniMarket ya sabe, con el número real de la parada 1, que su clasificador falla contra el área de pago: una brecha de 1,00. Reconectas ese hallazgo con lo que corresponde hacer después —transparencia, revisión humana, corrección de la causa, rendición de cuentas—, clasificas seis respuestas reales que la empresa podría dar, distingues «legal» de «correcto», y cierras construyendo tú mismo la respuesta responsable con el mismo criterio. Nueve encargos.',
      layout: 'inmersivo',
    },
  },
};

export function getActividadRegistrada(id: string): ActividadRegistrada | undefined {
  return REGISTRO_ACTIVIDADES[id];
}

export function idsRegistrados(): string[] {
  return Object.keys(REGISTRO_ACTIVIDADES);
}
