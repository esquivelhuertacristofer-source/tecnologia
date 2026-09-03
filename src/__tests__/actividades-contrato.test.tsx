/**
 * Harness de cumplimiento de contrato (F0.7).
 *
 * Toda actividad del registro pasa por estas pruebas SIN escribir tests
 * nuevos: se carga con `cargarActividad()`, se monta con callbacks instrumentados y
 * se verifica que respeta el contrato v1.1 en runtime (rangos de
 * onProgress/onScore, no autocompletarse, tolerar la ausencia de
 * onSaveState, reanudar desde un estado guardado serializado).
 *
 * Al registrar una actividad nueva hay que añadir su fixture de
 * reanudación en SAVED_STATE_FIXTURES (o `null` si la actividad no
 * guarda estado); el primer test lo exige.
 */

import { createElement } from 'react';
import { render } from '@testing-library/react';
import { REGISTRO_ACTIVIDADES } from '@/components/activities/registry';
import { cargarActividad } from '@/components/activities/cargadores';
import type { ActividadComponente } from '@/components/activities/registry';

/**
 * Estado guardado de ejemplo por actividad, como lo serializaría el
 * repositorio de progreso (JSON roundtrip). `null` = la actividad no
 * persiste estado parcial.
 */
/**
 * Estado de ejemplo del núcleo de Misión: Aprende Computación (MisionEstado
 * en index.tsx). Las 7 actividades del nivel 1 comparten un único
 * componente (moduloInicial distinto), así que reutilizan el mismo estado.
 */
const ESTADO_MISION_GUARDADO = {
  student: 'Alumno de prueba',
  currentModule: 0,
  unlocked: 3,
  completed: [0, 1],
  stars: 6,
  errors: 2,
  hints: 1,
  startedAt: '2026-01-01T12:00:00.000Z',
  playSeconds: 42,
  badges: ['🖥️', '🧠'],
  moduleStats: {
    '0': { seconds: 30, errors: 1, completedAt: '2026-01-01T12:00:00.000Z' },
    '1': { seconds: 40, errors: 1, completedAt: '2026-01-01T12:01:00.000Z' },
  },
  savedFiles: [],
  folders: [],
};

const SAVED_STATE_FIXTURES: Record<string, unknown | null> = {
  'n1-conoce-las-partes': ESTADO_MISION_GUARDADO,
  'n1-dentro-del-gabinete': ESTADO_MISION_GUARDADO,
  'n1-conecta-el-equipo': ESTADO_MISION_GUARDADO,
  'n1-enciende-con-seguridad': ESTADO_MISION_GUARDADO,
  'n1-explora-eduos': ESTADO_MISION_GUARDADO,
  'n1-utiliza-programas': ESTADO_MISION_GUARDADO,
  'n1-mision-final': ESTADO_MISION_GUARDADO,
  // Arcade U2: la partida es corta y se juega completa; no persiste estado parcial.
  'n1-caza-clics': null,
  'n1-laberinto-del-mouse': null,
  'n1-lluvia-de-letras': null,
  'n1-teclas-gigantes': null,
  'n1-mapa-de-flechas': null,
  // Arcade U3: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n1-ordena-los-pasos': null,
  'n1-sigue-el-patron': null,
  'n1-quien-usa-que': null,
  // Arcade U4: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n1-pinta-con-la-compu': null,
  'n1-guarda-tu-obra': null,
  // Arcade U5: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n1-semaforo-de-pantalla': null,
  'n1-pide-ayuda': null,
  'n1-mis-datos-son-un-tesoro': null,
  // N2·U1: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-safari-de-dispositivos': null,
  'n2-entrada-o-salida': null,
  'n2-donde-viven-mis-archivos': null,
  // N2·U2: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-explora-tu-teclado': null,
  'n2-mayusculas-y-acentos': null,
  'n2-escribe-a-dos-manos': null,
  // N2·U3: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-abre-y-cierra-ventanas': null,
  'n2-guarda-y-encuentra': null,
  // N2·U4: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-laberinto-de-bloques': null,
  'n2-caza-el-error': null,
  'n2-repite-repite': null,
  // N2·U5: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-mis-primeras-oraciones': null,
  'n2-viste-tus-letras': null,
  'n2-cuento-ilustrado': null,
  // N2·U6: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n2-secreto-o-publico': null,
  'n2-con-quien-hablo': null,
  'n2-heroes-del-respeto': null,
  // N3·U1: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-viaje-en-el-tiempo': null,
  'n3-generaciones-de-compus': null,
  'n3-conoce-a-los-inventores': null,
  // N3·U2: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-hardware-o-software': null,
  'n3-explora-el-escritorio': null,
  'n3-carpetas-y-atajos': null,
  // N3·U3: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-que-es-internet': null,
  'n3-busca-con-palabras-clave': null,
  'n3-detector-de-sitios-confiables': null,
  'n3-netiqueta-y-contrasenas': null,
  // N3·U4: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-conoce-scratch': null,
  'n3-eventos-y-movimiento': null,
  'n3-mi-primera-animacion': null,
  // N3·U5: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-dale-formato': null,
  'n3-ortografia-e-imagenes': null,
  'n3-la-fila-guia': null,
  // N3·U6: mismas máquinas cortas de una sesión; no persisten estado parcial.
  'n3-la-ia-en-mi-dia': null,
  'n3-piensan-las-maquinas': null,
  'n3-la-ia-se-equivoca': null,
  // N4·U1: la Central de Enlace se juega de corrido; no persiste estado parcial.
  'n4-el-viaje-de-un-mensaje': null,
  'n4-busca-y-compara': null,
  'n4-que-es-la-nube': null,
  // N4·U2: el Mostrador de Altas y la Estación de Correo se juegan de corrido;
  // no persisten estado parcial.
  'n4-mi-primera-cuenta': null,
  'n4-partes-del-correo': null,
  'n4-envia-responde-adjunta': null,
  // La cabina de videollamada tampoco: la reunión es una máquina de estados en
  // memoria y se juega de un tirón (§24.4).
  'n4-videollamadas-con-respeto': null,
  // Tecnia Asistente también se juega de corrido: las ocho rondas viven en
  // memoria y una respuesta a medio revelar no se puede reanudar.
  'n4-pregunta-a-la-ia': null,
  // Y la segunda parada tampoco: las cinco afirmaciones y las pestañas del
  // buscador son una máquina de estados en memoria, de un solo tirón.
  'n4-comprueba-la-respuesta': null,
  // Tecnia Muro también se juega de corrido: las diez publicaciones viven en
  // memoria, una por una, y una decisión a medio tomar no se puede reanudar.
  'n4-real-o-generado': null,
  // N4·U3: el Laboratorio de Juegos tampoco. El programa que el alumno arma vive
  // en memoria y se vuelve a armar en cada reto, así que guardar a medias sería
  // guardar un lienzo que ya no existe (§25.1).
  'n4-si-pasa-esto': null,
  // Lo mismo la parada 2: la cajita se fabrica al vuelo y su nombre sólo tiene
  // sentido junto al programa que lo usa (§25.2).
  'n4-variables-y-puntajes': null,
  // Y la parada 3 menos todavía: es una partida en marcha —muñeco, monedas,
  // enemigo y reloj— y un juego a medio jugar no se puede reanudar (§25.3).
  'n4-crea-tu-videojuego': null,
  // Y la parada 4 hereda tres juegos rotos que se reparan en una sentada: lo que
  // habría que guardar es a media caza, y una caza a medias no se reanuda (§25.4).
  'n4-depura-tu-juego': null,
  // N4·U4: las tres paradas viven ya dentro de Tecnia Textos (§36.11), y ahí el
  // documento NO se guarda por el contrato de actividad sino por el disquete del
  // propio programa, que es la lección de `of-word-guardar-e-imprimir`: el
  // anfitrión no le guarda el trabajo a nadie a sus espaldas.
  'n4-tablas-y-columnas': null,
  'n4-formas-y-wordart': null,
  'n4-documento-de-varias-paginas': null,
  // N7·U1: la Bahía de Montaje se juega de corrido; no persiste estado parcial.
  'n7-dentro-del-gabinete': null,
  'n7-binario-y-unidades': null,
  // N7·U1: la Banca de Sistemas vive sólo en memoria del componente; no persiste.
  'n7-sistemas-operativos': null,
  // N4·U5: Tecnia Diapositivas guarda la presentación en el propio equipo desde
  // la ventana, igual que Tecnia Textos, y por el mismo motivo: el anfitrión no
  // le guarda el trabajo a nadie a sus espaldas.
  'n4-tus-primeras-diapositivas': null,
  'n4-imagenes-y-texto': null,
  'n4-presenta-al-grupo': null,
  // N4·U6: la mesa de triaje se juega de corrido, un programa a la vez; no
  // persiste estado parcial.
  'n4-virus-y-antivirus': null,
  // Y la bandeja de Sofi tampoco: los diez correos se deciden de una sentada, y
  // guardar a medias sería guardar media bandeja — el orden en que se abren es
  // la mitad de la lección (§24.2 y el bien hecho en el séptimo lugar).
  'n4-atrapa-el-phishing': null,
  // Y Tecnia Mensajes menos todavía: las cinco conversaciones se viven de
  // corrido en una sola sesión, igual que sus hermanas de N4·Estudio.
  'n4-si-algo-me-incomoda': null,
  // N5·U1: Tecnia Monitor se juega de corrido, un trabajo a la vez, hasta el
  // apagón; no persiste estado parcial.
  'n5-el-cerebro-de-la-compu': null,
  // Los nueve archivos se deciden y se viven de corrido en una sola sesión,
  // igual que la mesa de triaje de N4·U6; no persiste estado parcial.
  'n5-nube-o-local': null,
  // N5·U2: la misma ventana, el mismo trato.
  'n5-transiciones-con-proposito': null,
  'n5-audio-e-imagenes': null,
  'n5-la-buena-diapositiva': null,
  // Tecnia Hojas no guarda estado todavía: la ventana no llama a `onSaveState`.
  'n5-celdas-filas-columnas': null,
  'n5-captura-y-ordena': null,
  'n5-tus-primeras-formulas': null,
  'n5-mi-primera-grafica': null,
  // Tecnia Muro (tu perfil) también se juega de corrido: publicar, borrar y
  // el epílogo viven en memoria, un paso a la vez; no persiste estado parcial.
  'n5-lo-que-publico-permanece': null,
  // Las otras dos paradas de «Mi huella digital», que la cierran. La 2 juega
  // sobre `simuladores/muro/` y la 3 estrena `simuladores/nube/`; las dos se
  // juegan de corrido, un paso a la vez, y no persisten estado parcial.
  'n5-mi-identidad-digital': null,
  'n5-documentos-compartidos': null,
  // Las tres primeras clases sobre el armazón `simuladores/muro/` (cerrado
  // el 15-ago-2026): igual que su hermana de N5, se juegan de corrido en
  // una sola sesión; no persisten estado parcial.
  'n6-privacidad-en-juegos': null,
  'n6-alto-al-ciberacoso': null,
  'n7-privacidad-en-redes': null,
  // Las tres conversaciones de Tecnia Mensajes se viven de corrido en
  // memoria, la mesa legal y el cierre también; no persiste estado parcial.
  'n7-riesgos-y-marco-legal': null,
  // Tecnia Avisos también se juega de corrido en memoria, un aviso a la vez;
  // no persiste estado parcial.
  'n7-equilibrio-digital': null,
  'n7-referencias': null,
  'n7-funcion-si': null,
  'n6-funciones-esenciales': null,
  'n6-elige-la-grafica': null,
  'n7-formato-condicional': null,
  'n7-datos-reales': null,
  'n6-interpreta-la-informacion': null,
  /*
   * Tecnia Código: las clases de Python no persisten estado parcial. El
   * archivo del alumno vive en el editor y el avance del guion en la sesión;
   * guardar «media clase» sería guardar un programa a medio escribir cuyo
   * siguiente encargo ya no cuadra con lo que hay en pantalla.
   */
  'n6-primeras-lineas-python': null,
  'n7-variables-y-tipos': null,
  'n7-entrada-y-salida': null,
  'n7-condicionales-python': null,
  'n7-bucles-python': null,
  'n7-retos-python': null,
  /*
   * Tecnia Datos: las clases de SQL tampoco persisten estado parcial, por la
   * misma razón que Tecnia Código. El SQL del alumno vive en el editor y el
   * avance del guion en la sesión; guardar «media clase» sería guardar una
   * consulta a medio escribir cuyo siguiente encargo ya no cuadra con lo que
   * hay en pantalla — y en `n10-modela-tus-datos` además con una base que ya
   * tiene tablas creadas que no se podrían recrear sin reventar.
   */
  'n9-bases-de-datos-iniciales': null,
  'n10-modela-tus-datos': null,
  'n10-consultas-sql': null,
  /*
   * Las tres clases de N8 y N10 que montan una ventana de Office ya cerrada
   * (doc §49). No persisten estado parcial por la misma razón que las otras
   * doce de Tecnia Hojas y las diecinueve de Tecnia Textos: **ninguna de las
   * tres ventanas llama a `onSaveState`**. El trabajo del alumno vive en el
   * libro o en el documento, y el avance del guion en la sesión; guardar media
   * clase sería guardar una hoja a medio limpiar cuyo encargo siguiente ya no
   * cuadra con lo que hay en pantalla. Lo que sí se guarda —y eso es del motor,
   * no del contrato— es el documento en `localStorage`, para que «Empezar de
   * cero» tenga de dónde volver.
   */
  'n8-limpieza-de-datos': null,
  'n8-concluye-con-datos': null,
  'n9-trabajo-colaborativo': null,
  'n9-gestiona-tu-proyecto': null,
  'n10-portafolio-y-cv': null,
  /*
   * Tecnia Web (doc §51): las tres clases de páginas web tampoco persisten
   * estado parcial, y por el mismo motivo que las de Python. El proyecto del
   * alumno vive en el editor y el avance del guion en la sesión; guardar media
   * clase sería guardar una página a medio escribir cuyo encargo siguiente ya
   * no cuadra con lo que hay en pantalla. «Jugar otra vez» remonta el estudio
   * entero y devuelve la plantilla, que es lo que un editor sabe hacer.
   */
  'n6-como-se-hace-una-pagina': null,
  'n6-html-basico': null,
  'n6-publica-tu-pagina': null,
  'n7-html-estructura': null,
  'n7-css-estilo': null,
  'n7-tu-sitio-personal': null,
  'n8-javascript-basico': null,
  'n8-disena-tu-videojuego': null,
  'n8-malware-e-ingenieria-social': null,
  'n9-casa-inteligente': null,
  'n10-proyecto-web-real': null,
  'n10-amenazas-y-defensa': null,
  /*
   * Las cuatro clases de inteligencia artificial (doc §52). Ninguna persiste
   * estado parcial, y por la misma razón en las cuatro: lo que habría que
   * guardar es una conversación a medias JUNTO CON el estado que la explica
   * —la pizarra de aparatos, el banco a medio etiquetar, la ficha de datos a
   * medio llenar, el cuaderno de prompts—, y al reanudar el hilo del chat
   * contaría una historia que ya no cuadra con lo que hay en la mesa. Se
   * juegan de corrido, como las tres de N4·U7, que montan el mismo armazón.
   */
  'n5-la-ia-en-mi-vida': null,
  'n5-la-ia-aprende-con-datos': null,
  'n5-uso-responsable-de-ia': null,
  'n7-como-aprende-la-ia': null,
  'n7-buenos-prompts': null,
  'n7-verifica-a-la-ia': null,
  /*
   * `n6-crea-con-ia` (doc §54.3, cierra la unidad de Diseño y multimedia):
   * el Estudio de Generación no guarda estado parcial — «Jugar otra vez»
   * remonta el laboratorio entero, igual que las clases de Tecnia Diseño.
   */
  'n6-crea-con-ia': null,
  /*
   * Las tres clases de volumen (doc §53), las primeras montadas sobre el Banco
   * Físico 3D. No persisten estado parcial: lo que habría que guardar es un
   * banco a medio montar —un cable en la mano, la tapa abierta y un tornillo en
   * la charola— y ese estado sólo significa algo junto al gesto que venía
   * después. Se juegan de corrido, como las demás máquinas de una sesión.
   */
  'n5-conecta-perifericos': null,
  'n5-manos-al-mantenimiento': null,
  'n7-diagnostica-y-soluciona': null,
  /*
   * Las tres primeras clases de Tecnia Diseño (doc §54). No persisten estado
   * parcial: lo que habría que guardar es un documento a medio componer junto
   * con qué encargo del guion sigue, y «Jugar otra vez» ya remonta el editor
   * entero — mismo trato que las clases de Tecnia Web.
   */
  'n6-carteles-e-infografias': null,
  'n8-imagen-con-capas': null,
  'n9-boceta-tu-app': null,
  /* La cuarta del editor, y la única que no es de diseño gráfico: cierra
   * N5·U4 usando el lienzo como papel para planear un juego (doc §54). Mismo
   * trato — un tablero a medio recortar sólo significa algo junto al encargo
   * que lo pedía, y «Jugar otra vez» remonta el editor entero. */
  'n5-planea-tu-proyecto': null,
  /*
   * Las tres clases de Tecnia Bloques (doc §55). No persisten estado parcial:
   * lo que habría que guardar es un programa a medio encajar junto con qué
   * encargo del guion sigue, y un árbol de bloques a medias sólo significa algo
   * al lado del reto que lo pedía. Mismo trato que Diseño y que Web.
   *
   * Añadidas desde fuera el 15-ago-2026: el agente que construyó las tres murió
   * por el límite de sesión **justo mientras insertaba sus entradas en el
   * registro**, así que las clases quedaron registradas y sin declarar aquí.
   * Es exactamente lo que esta prueba existe para cazar, y lo cazó.
   */
  'n6-que-es-un-robot': null,
  'n6-programa-un-microbit': null,
  /*
   * Las cuatro que cierran N6 (doc §61), y con ellas toda la primaria. Ninguna
   * persiste estado parcial, cada una por su motivo:
   *  - `edita-imagen-y-video`: la cinta a medio cortar sólo significa algo junto
   *    al encargo que la pedía, y «Jugar otra vez» remonta el editor entero.
   *  - `bloques-vs-codigo`: `SalaBloques` arranca siempre en la portada y el
   *    programa vive en `useBloques`, que lo lee una sola vez al montar.
   *  - `contrasenas-fuertes`: las tres pestañas son una máquina de estados en
   *    memoria; media reparación no se reanuda.
   *  - `proyecto-integrador`: habría que serializar A LA VEZ el estado del
   *    navegador y el mazo de diapositivas, a través de un límite que el
   *    contrato de la clase no ofrece hoy.
   */
  'n6-edita-imagen-y-video': null,
  'n6-bloques-vs-codigo': null,
  'n6-contrasenas-fuertes': null,
  'n6-proyecto-integrador': null,
  'n6-reto-robot': null,
  'n9-automatiza-tareas': null,
  /* Las dos primeras paradas de N5·U4 sobre el mismo armazón de bloques. Igual
   * que sus hermanas: `SalaBloques` arranca siempre en la portada de objetivos
   * y el programa vive en `useBloques`, que lo lee una sola vez al montar. */
  'n5-bloques-propios': null,
  'n5-juego-con-niveles': null,
  /*
   * N8 · Programación en texto II (§54, Tecnia Código): mismo motivo que sus
   * hermanas de N6/N7 — el programa del alumno vive en el editor y el avance
   * del guion en la sesión; guardar «media clase» guardaría un programa a
   * medio escribir cuyo siguiente encargo ya no cuadra con lo que hay en
   * pantalla.
   */
  'n8-listas-y-diccionarios': null,
  'n8-funciones-python': null,
  'n8-proyectos-consola': null,
  'n8-buenas-practicas': null,
  /*
   * N8 · Desarrollo web II (Tecnia Web): mismo motivo que sus hermanas de
   * N6/N7 — el proyecto vive en el editor y «Jugar otra vez» remonta el
   * estudio entero.
   */
  'n8-css-responsivo': null,
  'n8-sitio-multipagina': null,
  /*
   * N8 · Datos y análisis (Tecnia Hojas): mismo motivo que sus hermanas de
   * N5/N8 — la ventana no llama a onSaveState; el libro vive en localStorage
   * por cuenta del propio motor, no del contrato de actividad.
   */
  'n8-tablas-dinamicas': null,
  'n8-visualizacion-efectiva': null,
  /*
   * N8 · Redes y ciberseguridad: paneles de decisión propios sobre
   * `useLabActividad`, que no llama a onSaveState. Guardar a medias
   * guardaría una tarjeta clasificada sin el caso que la explica.
   */
  'n8-ip-wifi-servidores': null,
  'n8-cifrado-basico': null,
  'n8-habitos-de-proteccion': null,
  /*
   * N8 · Producción multimedia y videojuegos: `video-y-audio` es la cinta de
   * Tecnia Diseño (mismo trato que `n8-imagen-con-capas`/`n9-boceta-tu-app`:
   * «Jugar otra vez» remonta el editor entero); `derechos-y-licencias` es un
   * panel de decisión propio sobre `useLabActividad`, mismo trato que las de
   * ciberseguridad.
   */
  'n8-video-y-audio': null,
  'n8-derechos-y-licencias': null,
  /*
   * N8 · IA II: mismo motivo que las clases de IA de N5/N7 — lo que habría
   * que guardar es una decisión a medias junto con el caso o la generación
   * que la explica, y al reanudar contaría una historia que ya no cuadra con
   * lo que hay en pantalla.
   */
  'n8-genera-con-ia': null,
  'n8-sesgos-y-errores': null,
  'n8-etica-de-la-ia': null,
  /*
   * N9 · Desarrollo de aplicaciones: `construye-low-code` es Tecnia Diseño
   * (mismo trato que `n9-boceta-tu-app`); `pruebas-con-usuarios` es un panel
   * de decisión propio, mismo trato que las de ciberseguridad.
   */
  'n9-construye-low-code': null,
  'n9-pruebas-con-usuarios': null,
  /*
   * N9 · Algoritmos y datos: `busqueda-y-ordenamiento`/`datos-con-python` son
   * Tecnia Código (mismo motivo que sus hermanas de N6/N7/N8 — el programa
   * vive en el editor y el guion en la sesión).
   */
  'n9-busqueda-y-ordenamiento': null,
  'n9-datos-con-python': null,
  /*
   * N9 · Robótica e IoT: panel propio sobre `ArcadeSala`/`VentanaBase` sin
   * llamar a `onSaveState` — mismo motivo que el resto de esta sesión.
   * (`n9-trabajo-colaborativo` ya estaba declarada más arriba, junto a
   * `n9-gestiona-tu-proyecto`, desde antes de construirse.)
   */
  'n9-sensores-iot': null,
  'n9-automatiza-un-espacio': null,
  // N9 · Emprendimiento e identidad digital: Tecnia Web (EstudioWeb), mismo
  // motivo que sus hermanas de N6/N7/N8.
  'n9-marca-personal': null,
  // Tecnia Navegador (mismo armazón de N8·ciberseguridad), mismo motivo.
  'n9-ecommerce-y-marketing': null,
  // Cierre de la unidad: panel de decisión puro sobre `useLabActividad`,
  // mismo motivo que `n9-pruebas-con-usuarios`/`n8-derechos-y-licencias`.
  'n9-empleos-tecnologicos': null,
  // Tecnia Asistente (mismo armazón de N7/N8), mismo motivo.
  'n9-ia-copiloto': null,
  // Panel de decisión puro (Tecnia Radar) sobre VentanaBase + useLabActividad,
  // mismo motivo que n9-empleos-tecnologicos.
  'n9-ia-y-trabajo': null,
  // Capstone de N9: ArcadeSala + panel de decisión + EstudioWeb, ninguno de
  // los dos llama a onSaveState (mismo motivo que el resto de la sesión).
  'n9-proyecto-integrador': null,
  // N10 · Desarrollo web integral: Tecnia Web (EstudioWeb), mismo motivo que
  // sus hermanas de N6/N7/N8/N9.
  'n10-publica-tu-sitio': null,
  'n10-ux-ui': null,
  // Paneles de decisión propios (Tecnia Identidad/Accesos/Correo/Navegador),
  // sin onSaveState, mismo motivo que el resto de la sesión.
  'n10-identidad-y-cifrado': null,
  // Panel de decisión (Tecnia Trayectoria), mismo motivo que
  // n9-empleos-tecnologicos.
  'n10-carreras-ciber': null,
  // SalaCodigo/Python, mismo motivo que sus hermanas de N8/N9.
  'n10-python-intermedio': null,
  'n10-problemas-de-concurso': null,
  'n10-analisis-con-codigo': null,
  // Motor simuladores/aprendizaje (árbol de decisión determinista), sin onSaveState.
  'n10-como-funcionan-los-modelos': null,
  // Motor simuladores/asistente (Tecnia Asistente), sin onSaveState.
  'n10-flujos-con-ia': null,
  // Panel de decisión propio (motorEtica.ts), sin onSaveState.
  'n10-etica-y-regulacion': null,
  // VentanaDatos + VentanaHojas (dos motores reales), sin onSaveState.
  'n10-conecta-tus-datos': null,
  // Panel de decisión propio (motorTrayectorias.ts), sin onSaveState.
  'n10-carreras-y-certificaciones': null,
  // ArcadeSala + EstudioWeb (mismo patrón que n9-proyecto-integrador), sin onSaveState.
  'n10-capstone': null,
};

interface Montaje {
  container: HTMLElement;
  unmount: () => void;
  onProgress: jest.Mock;
  onScore: jest.Mock;
  onComplete: jest.Mock;
  onSaveState: jest.Mock;
}

async function montar(
  Comp: ActividadComponente,
  opts: { savedState?: unknown; sinOnSaveState?: boolean } = {},
): Promise<Montaje> {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const onSaveState = jest.fn();

  const { container, unmount } = render(
    createElement(Comp, {
      config: {},
      savedState: opts.savedState,
      onSaveState: opts.sinOnSaveState ? undefined : onSaveState,
      onProgress,
      onScore,
      onComplete,
    }),
  );

  return { container, unmount, onProgress, onScore, onComplete, onSaveState };
}

const ids = Object.keys(REGISTRO_ACTIVIDADES);

it('toda actividad registrada tiene fixture de reanudación declarada', () => {
  for (const id of ids) {
    expect(SAVED_STATE_FIXTURES).toHaveProperty(id);
  }
});

describe.each(ids)('contrato de actividad: %s', (id) => {
  let Comp: ActividadComponente;

  beforeAll(async () => {
    Comp = (await cargarActividad(id))!;
  });

  beforeEach(() => localStorage.clear());

  it('monta sin tronar y pinta contenido', async () => {
    const { container, unmount } = await montar(Comp);
    expect(container.firstChild).not.toBeNull();
    unmount();
  });

  it('reporta progreso inicial y todo onProgress queda en [0, 1]', async () => {
    const { onProgress, unmount } = await montar(Comp);
    expect(onProgress).toHaveBeenCalled();
    for (const [valor] of onProgress.mock.calls) {
      expect(typeof valor).toBe('number');
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    unmount();
  });

  it('todo onScore queda en [0, 100]', async () => {
    const { onScore, unmount } = await montar(Comp);
    expect(onScore).toHaveBeenCalled();
    for (const [valor] of onScore.mock.calls) {
      expect(typeof valor).toBe('number');
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(100);
    }
    unmount();
  });

  it('no se completa sola al montar', async () => {
    const { onComplete, unmount } = await montar(Comp);
    expect(onComplete).not.toHaveBeenCalled();
    unmount();
  });

  it('funciona sin onSaveState (el contrato lo marca opcional)', async () => {
    const { container, unmount } = await montar(Comp, { sinOnSaveState: true });
    expect(container.firstChild).not.toBeNull();
    unmount();
  });

  it('reanuda desde un estado guardado serializado sin tronar', async () => {
    const fixture = SAVED_STATE_FIXTURES[id];
    if (fixture === null) return; // la actividad no persiste estado

    // El mismo roundtrip JSON que hace el repositorio de progreso.
    const savedState = JSON.parse(JSON.stringify(fixture));
    const { container, onProgress, onComplete, unmount } = await montar(Comp, { savedState });

    expect(container.firstChild).not.toBeNull();
    expect(onProgress).toHaveBeenCalled();
    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    expect(onComplete).not.toHaveBeenCalled();
    unmount();
  });

  it('si guarda estado al interactuar, el estado es JSON-serializable', async () => {
    const { container, onSaveState, unmount } = await montar(Comp);

    // Interacción genérica mínima: click al primer botón visible (si hay).
    const boton = container.querySelector('button');
    if (boton) {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(boton);
    }

    for (const [estado] of onSaveState.mock.calls) {
      // Debe sobrevivir el roundtrip del repositorio sin perder datos.
      expect(JSON.parse(JSON.stringify(estado))).toEqual(estado);
    }
    unmount();
  });
});
