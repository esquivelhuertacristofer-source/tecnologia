# Robustecimiento de secundaria y bachillerato (N7–N10)

**Fecha:** 12 de septiembre de 2026 · **Plataforma:** Tecnia · **Cliente:** CEN Campaña Educativa Nacional
**Encargo de Cristofer:** «Necesito un robustecimiento general de la plataforma, sobre todo en los laboratorios de los últimos niveles, preparatoria, secundaria, ya que la dinámica y la interfaz es mala y superbásica; estamos viendo cosas como programación y creación de videojuegos pero son superbásicas, con geometrías o tonterías básicas.»

Este documento responde en tres partes: **qué hay** (medido, no recordado), **por qué está así** (cinco familias de avería, no setenta defectos sueltos) y **qué se construye y en qué orden**.

---

## 0. Método

Nada de lo que sigue está afirmado de memoria.

- Se leyeron íntegros los **71 `Lab*.tsx`** de N7, N8, N9 y N10 que no montan una ventana de Office (las 9 de Excel/Word/M365 corren sobre motores ya cerrados y auditados en §45–§48 y §66; sólo se confirmó que existen). Cuatro lectores, uno por nivel, con la misma ficha de siete campos: archivo y líneas, chasis, mecánica, evaluación, 3D, exigencia 1–5 para la edad, defecto más grave.
- Se midió el motor que hay debajo: `simuladores/codigo` (intérprete de Python, 7 049 líneas con IDE), `simuladores/datos` (motor SQL, 5 329), `simuladores/web` (HTML+CSS con cascada real, 5 729), `simuladores/diseno` (editor gráfico, ~3 300), `simuladores/bloques` (1 612), `simuladores/aprendizaje` (árbol de decisión, 1 818), `simuladores/asistente` (1 640), `correo`, `navegador`, `nube`, `tablero`, `muro`, `laboratorio3d` (banco físico con raycast, 1 993).
- Se abrió la plataforma en un navegador real (Playwright, 1440×900) y se capturaron 12 laboratorios representativos en sus tres pantallas: entrada, portada y práctica.
- Estado técnico de partida: `tsc` limpio, **164 suites / 3 991 pruebas en verde**. `node_modules` no existía en la copia (se reinstaló con `npm ci` desde el `package-lock`).

**Criterio de «evaluación real»:** el laboratorio mira **lo que el alumno produjo** (el código ejecutado, las filas que devolvió el motor SQL, el DOM analizado, el documento del editor) y no una bandera `correcta: true` escrita a mano en los datos ni un `includes` sobre el texto.

**Criterio de exigencia:** 1 = cuestionario de opción múltiple o pulsar botones en orden; 3 = usa el programa de verdad pero cada paso viene dictado; 5 = trabajo real como en el programa auténtico (resolver, no copiar).

---

## 1. Veredicto en números

| | N7 · 1.º Sec. | N8 · 2.º Sec. | N9 · 3.º Sec. | N10 · Bach. | **Total** |
|---|---:|---:|---:|---:|---:|
| Actividades del nivel | 22 | 22 | 18 | 18 | **80** |
| Auditadas (sin Office) | 18 | 18 | 18 | 17 | **71** |
| Con evaluación real | 10 | 10 | 9 | 13 | **42** |
| Sin evaluación real (bandera o `includes`) | 8 | 8 | 9 | 4 | **29** |
| Exigencia ≤ 2 (cuestionario) | 6 | 6 | 9 | 6 | **27** |
| Exigencia ≥ 4 (trabajo real) | 3 | 8 | 5 | 3 | **19** |
| Exigencia media | 2,7 | 3,2 | 2,5 | 2,8 | **2,8 / 5** |
| Sin ningún motor de la plataforma (DOM + botones) | 3 | 5 | 6 | 4 | **18** |
| Código dictado línea por línea | 5 | 1 | 2 | 6 | **14** |
| 3D que es decorado | 0 | 1 | 3 | 0 | **4** |

Tres lecturas que salen de la tabla y no de la intuición:

1. **La queja es exacta, pero no es de 3D.** En N10 no hay una sola línea de three.js; en N9 el 3D es una casa de `RoundedBox` y `sphereGeometry` que se sustituye por tres `div` con emojis (el propio archivo trae ese respaldo) y la clase funciona igual. Las «geometrías básicas» son un síntoma de algo más general: **27 de 71 laboratorios son cuestionarios con estética de programa.**
2. **El motor es mucho mejor que las clases.** Debajo hay siete simuladores que suman más de 40 000 líneas —un intérprete de Python que ejecuta de verdad, un motor SQL con claves foráneas, una cascada CSS con `@media`— y **18 laboratorios no montan ninguno**. Cinco de los diecisiete de bachillerato son `<div>` con botones.
3. **Donde sí hay motor, se dicta.** Las 14 clases de código (Python y SQL) escriben la solución completa en la instrucción o en la pista y comprueban con regex que se copió bien. N10 «Problemas tipo concurso» no tiene un solo problema que resolver: la solución viene escrita. El alumno transcribe; no programa.

---

## 2. Nivel por nivel

Exigencia en escala 1–5. «Real» = evaluación sobre lo producido.

### N7 · Bajo el cofre (12–13 años)

| Actividad | Chasis | Mecánica | Real | Exig. |
|---|---|---|:-:|:-:|
| `n7-dentro-del-gabinete` | ArcadeSala3D + HTML flotante | arrastra 6 piezas con **el número de paso impreso en el anclaje** | no | 2 |
| `n7-binario-y-unidades` | VentanaBase propia | 8 interruptores, ordena unidades | sí | 3 |
| `n7-sistemas-operativos` | DOM puro | caza el botón en 5 maquetas | no | 2 |
| `n7-diagnostica-y-soluciona` | BancoFisico3D (raycast real) | 6 instrumentos × puntos, 5 averías | no (tabla) | 3 |
| `n7-variables-y-tipos` … `n7-bucles-python` (4) | Tecnia Código | escribe Python, provoca errores reales | sí | 3 |
| `n7-retos-python` | Tecnia Código | tres programas completos | sí | 4 |
| `n7-html-estructura` | Tecnia Web | 5 etiquetas, la pista trae el HTML | sí | 2 |
| `n7-css-estilo` | Tecnia Web | 7 reglas desde cero, inspector | sí | 3 |
| `n7-tu-sitio-personal` | Tecnia Web | 3 páginas + hoja compartida, tema libre | sí | 4 |
| `n7-privacidad-en-redes` | Muro | **el botón verde siempre es el correcto** | no | 1 |
| `n7-riesgos-y-marco-legal` | guion local | 12 decisiones, nunca resta | no | 2 |
| `n7-equilibrio-digital` | teléfono local | 4 botones verdes, 3 interruptores | casi no | 1 |
| `n7-como-aprende-la-ia` | motor de aprendizaje | pulsa, lee informes, elige frase | verdad calculada | 3 |
| `n7-buenos-prompts` | Asistente | escribe prompts; rúbrica léxica | palabras clave | 3 |
| `n7-verifica-a-la-ia` | Asistente + Navegador | ancla, busca, adjunta prueba, juzga | sí | 4 |

### N8 · Construyo soluciones (13–14 años)

| Actividad | Chasis | Mecánica | Real | Exig. |
|---|---|---|:-:|:-:|
| `n8-listas-y-diccionarios`, `-funciones-python`, `-proyectos-consola`, `-buenas-practicas` | Tecnia Código | tres programas, depura archivo ajeno, IndexError real | sí | **5** |
| `n8-css-responsivo` | Tecnia Web | CSS evaluado a dos anchos | sí | 4 |
| `n8-javascript-basico` | Tecnia Web | **4 líneas validadas con `includes`; el JS nunca corre** | no | 1 |
| `n8-sitio-multipagina` | Tecnia Web | dos páginas desde cero | 6/10 | 4 |
| `n8-ip-wifi-servidores` | DOM puro | 6 MCQ; teclea la contraseña impresa arriba | no | 2 |
| `n8-malware-e-ingenieria-social` | Correo | 5 correos, dos botones; ignora los predicados del motor | no | 1 |
| `n8-cifrado-basico` | dial + Navegador | César real, fuerza bruta | sí | 3 |
| `n8-habitos-de-proteccion` | Correo + Navegador | contraseña propia contra medidor real | sí | 4 |
| `n8-imagen-con-capas` | Tecnia Diseño | 4 encargos sobre motor de 3 000 líneas | sí | 3 |
| `n8-video-y-audio` | Tecnia Diseño (cinta) | ordena y recorta a 15 s, objetivo calculado | sí | 4 |
| `n8-derechos-y-licencias` | DOM puro | clasifica; atribución por subcadena | parcial | 3 |
| **`n8-disena-tu-videojuego`** | three.js a mano | **2 deslizadores, 3 botones; se gana caminando a la derecha** | no | **1** |
| `n8-genera-con-ia` | Asistente | arma prompt con botones | no | 3 |
| `n8-sesgos-y-errores` | DOM puro | señala 8 veces | 1/8 | 2 |
| `n8-etica-de-la-ia` | DOM puro | clasifica 9 casos | no | 2 |

**El caso estrella, medido.** `LabDisenaTuVideojuego.tsx` (650 líneas) dibuja siete mallas: un cubo por robot, un toro por portal, un octaedro por cristal. Los tres botones sólo alternan `.visible` de mallas que existen desde el primer cuadro. La corrección compara los cinco parámetros del panel (`g >= 14 && f >= 16`), no la escena. Y hay tres errores aritméticos: con la gravedad de fábrica el salto sube 3,53 unidades y la plataforma pide 1,9 (la premisa «no se llega arriba» es falsa); el portal acepta al jugador de pie en el suelo, así que **se gana manteniendo la flecha derecha sin saltar**; y el cristal se recoge sin plataforma. Toda la mecánica es 2D en `z = 0` con cámara fija. El canon lo había asignado a **Tecnia Bloques**; se construyó fuera de todo armazón.

### N9 · Del prototipo al producto (14–15 años)

| Actividad | Chasis | Mecánica | Real | Exig. |
|---|---|---|:-:|:-:|
| `n9-boceta-tu-app` | Tecnia Diseño | pantallas, enlaces; **no se puede recorrer** | sí | 3 |
| `n9-construye-low-code` | Tecnia Diseño | 3 pantallas, 4 enlaces, nombres; sin comportamiento | sí | 4 |
| `n9-pruebas-con-usuarios` | DOM puro | clasifica sesiones de texto fijo, no su app | no | 2 |
| `n9-busqueda-y-ordenamiento` | Tecnia Código | búsqueda lineal y burbuja, dictadas | sí | 4 |
| `n9-bases-de-datos-iniciales` | Tecnia Datos | SELECT, WHERE, IS NULL; nunca JOIN ni CREATE | sí | 4 |
| `n9-datos-con-python` | Tecnia Código | limpia, filtra, agrega, dictado | sí | 4 |
| `n9-trabajo-colaborativo` | Nube | permisos, conflicto real; nunca redacta | sí | 3 |
| `n9-gestiona-tu-proyecto` | Tablero | **4 botones que ya traen la respuesta** («Asignar a Melissa») | trivial | 1 |
| `n9-sensores-iot` | 3D propio + DOM | 6 MCQ de 9; «¿qué mide el LDR?» | no | 1 |
| `n9-casa-inteligente` | 3D propio + DOM | 2 deslizadores hasta un umbral, 3 interruptores; **las reglas IFTTT son `useState<boolean>`** | umbral | 1 |
| `n9-automatiza-un-espacio` | 3D propio + DOM | 5 MCQ, 2 interruptores | 5/9 no | 2 |
| `n9-marca-personal` | Tecnia Web | portafolio de 5 secciones | sí | 4 |
| `n9-ecommerce-y-marketing` | Navegador | clasifica fichas, nunca construye una | no | 2 |
| `n9-empleos-tecnologicos` | DOM puro | test vocacional de 9 rondas | no | 1 |
| `n9-automatiza-tareas` | Tecnia Bloques | anida condición real; catálogo de 5 fichas | sí | 3 |
| `n9-ia-copiloto` | Asistente | «probar el código» sin usar el intérprete que existe | no | 2 |
| `n9-ia-y-trabajo` | DOM puro | clasifica frases en dos cubetas | no | 1 |
| `n9-proyecto-integrador` | panel + Tecnia Web | 4 encargos web reales + 5 MCQ; **no integra nada del nivel** | 4/9 | 3 |

### N10 · Perfil profesional (15–18 años)

| Actividad | Chasis | Mecánica | Real | Exig. |
|---|---|---|:-:|:-:|
| `n10-python-intermedio` | Tecnia Código | suma 6 números; «módulos» son 2 MCQ porque el motor no tiene `import` | sí | 3 |
| `n10-problemas-de-concurso` | Tecnia Código | **5 problemas con la solución escrita en el enunciado** | sí | 3 |
| `n10-analisis-con-codigo` | Tecnia Código | lista de dicts, dictado; teclear 6 diccionarios con acentos | sí | 3 |
| `n10-modela-tus-datos` | Tecnia Datos | DDL y errores reales; la pista es la sentencia | sí | 3 |
| `n10-consultas-sql` | Tecnia Datos | 7 de 9 consultas vienen escritas | sí | 3 |
| `n10-conecta-tus-datos` | Datos → Hojas | GROUP BY + HAVING, fórmulas reales | sí | 4 |
| `n10-proyecto-web-real` | Tecnia Web | pega un div, un li y dos `console.log` por `includes` | parcial | 2 |
| `n10-publica-tu-sitio` | Tecnia Web | corrige 3 defectos reales; 3 pasos son botones | sí | 3 |
| `n10-ux-ui` | Tecnia Web | **contraste WCAG calculado a mano**, jerarquía medida | sí | 4 |
| `n10-como-funcionan-los-modelos` | motor de aprendizaje | fuga de datos, memoria, XOR; sólo clics | sí | 4 |
| `n10-flujos-con-ia` | Asistente | escribe prompt, caza dato inventado | mixta | 3 |
| `n10-etica-y-regulacion` | DOM puro | 9 preguntas | 1/9 | 2 |
| **`n10-amenazas-y-defensa`** | DOM puro | **5 botones que teclean el comando por ti; `if/else` con strings de película** | no | **1** |
| `n10-identidad-y-cifrado` | Correo + Navegador | contraseña medida, 2FO, dominio | sí | 3 |
| `n10-carreras-ciber` | DOM puro | 9 pantallas de botones | casi no | 2 |
| **`n10-capstone`** | panel + Tecnia Web | **cierre de los diez niveles: 4 ediciones de un minuto y 5 MCQ; sin Python, SQL, datos ni IA** | 4/9 | 2 |
| `n10-carreras-y-certificaciones` | DOM puro | mismos widgets que las dos anteriores: 27 MCQ seguidos | casi no | 2 |

---

## 3. Las cinco familias de avería

Setenta defectos sueltos no se arreglan; cinco familias sí. Cada laboratorio flojo cae en una o dos.

### F1 · El cuestionario disfrazado de programa — 19 laboratorios

`VentanaBase` con un panel de botones dentro: el alumno elige 1 de 3, clasifica frases en dos cubetas, empareja. La evaluación es `opcion.correcta`. Se reconoce porque **el archivo mide 800–1 000 líneas y no importa ningún simulador**: `n8-derechos-y-licencias` 1 007, `n9-ecommerce` 1 076, `n8-habitos` 1 073, `n7-riesgos` 1 024. Tres de N10 copian literalmente los mismos tres widgets (`McqBloque`, `ClasificacionDosOpciones`, `MensajeYAvance`).

Peor variante: el **botón que delata la respuesta** (`bg-emerald-500` = la que avanza) en `n7-privacidad-en-redes` y `n7-equilibrio-digital`, y el **botón que trae la solución dentro** («Asignar a Melissa», «Poner fecha: 25 de agosto») en `n9-gestiona-tu-proyecto`.

### F2 · El código dictado — 14 laboratorios

Motor real, evaluación real, y la instrucción es el programa entero: «escribe `total = 0` luego `for x in lista:`…». Las regex exigen esa forma exacta, así que una solución correcta con otro nombre de variable falla y la copia aprueba. Es el defecto que hace que Python parezca «superbásico» aunque el intérprete ejecute de verdad: **nunca se le pide al alumno que resuelva un problema a partir de un enunciado y unos casos de prueba.** N10 «Problemas tipo concurso» es el ejemplo límite: se llama concurso y no hay ni un problema.

### F3 · El motor que falta — 5 huecos, 12 laboratorios

| Hueco | Qué pasa hoy | Laboratorios que lo pagan |
|---|---|---|
| **JavaScript no se ejecuta** en Tecnia Web (decisión documentada en `tiposWeb.ts`, «el guardián del js») | el botón «funciona» porque React finge el efecto; se valida con `includes('console.log')` | `n8-javascript-basico`, `n8-sitio-multipagina`, `n10-proyecto-web-real`, `n10-capstone` |
| **No hay creador de juegos** | three.js a mano con 5 toggles | `n8-disena-tu-videojuego` (y en primaria `n4-crea-tu-videojuego`, `n5-juego-con-niveles`) |
| **Python sin `import`, sin archivos, sin `random`** | «archivos, módulos y librerías» se enseña con 2 MCQ | `n10-python-intermedio`, `n10-analisis-con-codigo`, `n9-datos-con-python` |
| **No hay simulador de red ni de centro de operaciones** | strings de película, `if/else` por orden de clic | `n8-ip-wifi-servidores`, `n10-amenazas-y-defensa` |
| **No hay motor de reglas IoT** (sensor con hoja de datos, condición editable, actuador) | tres booleanos con la condición congelada en el fuente | `n9-sensores-iot`, `n9-casa-inteligente`, `n9-automatiza-un-espacio` |
| **El prototipo de app no se puede recorrer ni tiene comportamiento** | se dibujan pantallas y enlaces que nunca se prueban | `n9-boceta-tu-app`, `n9-construye-low-code`, `n9-pruebas-con-usuarios` |

### F4 · El motor que existe y no se usa — 8 laboratorios

`n8-malware` escribe una tabla de veredictos a mano mientras `simuladores/correo` expone `enlaceEnganoso`, `mismoDominio`, `adjuntoPeligroso` (su hermana `n8-habitos` sí los usa). `n9-ia-copiloto` «prueba el código de la IA» con una función precalculada en vez del intérprete de Python que usan las dos clases de al lado. `n9-bases-de-datos-iniciales` nunca escribe un `JOIN` ni un `CREATE TABLE` que el motor soporta. `n8-imagen-con-capas` pide 4 encargos a un editor de 17 herramientas. `n7-html-estructura` monta 5 729 líneas de motor para copiar 5 etiquetas. `n9-sensores-iot` y hermanas montan su propio 3D en vez del banco físico con raycast que ya existe.

### F5 · El 3D decorado y las mecánicas planas — 4 laboratorios

Ya diagnosticado en `AUDITORIA-LABORATORIOS-3D.md` (6-ago-2026): si se puede borrar la geometría y la clase sigue igual, no es 3D. Los tres de robótica de N9 traen su propio respaldo sin WebGL que lo demuestra. El de videojuegos es un plataformas 2D en perspectiva: `playerGroup.position.set(px, py, 0)`.

---

## 4. El estándar de secundaria y bachillerato

Lo que «robusto» significa a partir de N7, para que se pueda auditar y no discutir:

1. **Todo laboratorio monta un programa y el alumno entrega un artefacto.** Un programa de Python, una consulta, una página, un nivel de juego, un prototipo, una regla de automatización, una contraseña. La evaluación lee el artefacto. Queda prohibido el laboratorio-cuestionario; la opción múltiple se admite **como máximo en 1 de cada 9 encargos** y sólo para el cierre reflexivo.
2. **En código, enunciado y casos de prueba; nunca la solución.** Cada encargo de Python o SQL se plantea como problema (qué entra, qué debe salir), con **casos visibles y casos ocultos** que el motor ejecuta, y con **tres pistas escalonadas** que el alumno pide si quiere: idea → estructura → una línea concreta. La comprobación mira la salida y el estado, no la forma del fuente. Un alumno que resuelve con otra estructura aprueba.
3. **Ningún botón contiene ni delata su respuesta.** Ni por color, ni por texto, ni por orden. Si la única opción que avanza está en verde, el encargo está mal escrito.
4. **El error cuesta y la pista se paga.** `restar()` existe y se usa; pedir la tercera pista deja constancia en el cuaderno. Sin coste, la vía más rápida es probar todos los botones.
5. **3D sólo donde el espacio es el contenido.** Gabinete, banco físico, colocar un sensor cuyo alcance depende de dónde está. Todo lo que en la vida real es software se construye como software (regla de `office-ultra-lite`, 2-ago-2026).
6. **Un armazón nuevo sólo si sirve a dos clases que salen distintas** (canon, prueba 2), y el armazón nunca corrige (prueba 3).
7. **Los cierres integran.** El integrador de N9 y el capstone de N10 reúnen artefactos que el alumno ya construyó en el nivel (su base de datos, su script, su sitio), no un sitio nuevo con cuatro ediciones.

---

## 5. Qué se construye

Siete piezas de motor, ordenadas por cuántos laboratorios levantan y por dependencias. Después, las reescrituras de clase que no necesitan motor nuevo.

### M1 · Tecnia Juegos — el creador de videojuegos (nuevo armazón)

Lo que el currículo pide en N8 es literal: «mecánicas, niveles, prueba con jugadores». Un creador de juegos 2D de verdad, en la línea de lo que un alumno de 13 años usa fuera de la escuela (Scratch, MakeCode Arcade, GDevelop), construido sobre lo que ya hay:

- **Escena y actores** con sprites de píxel dibujados a mano (héroe, moneda, pincho, puerta, plataformas), no cubos ni esferas.
- **Motor de juego puro** (sin React): físicas de plataformas con gravedad y salto reales, colisiones de caja, teclado, reloj, vidas y puntos. Determinista y probable en Jest.
- **Comportamiento con Tecnia Bloques**: cada actor lleva sus guiones (`cuando empieza`, `cuando pulsan ←/→/espacio`, `cuando toca X`, `cada tic`). El intérprete de bloques ya avanza un bloque por llamada; el motor de juego lo llama por actor y por tic, que es la ejecución simultánea que el canon anotaba como pendiente.
- **Editor de niveles** con rejilla, paleta y propiedades por actor; **modo jugar** en la misma ventana.
- **Prueba con jugadores**: un jugador de prueba automático que intenta el nivel y devuelve dónde murió, cuántos intentos necesitó y si el nivel se puede terminar — la mecánica de «probarlo con alguien que no lo hizo» del canon, medida.

Sirve a `n8-disena-tu-videojuego` (N8), `n5-juego-con-niveles` (N5) y `n4-crea-tu-videojuego` (N4, declarado inutilizable el 6-ago-2026). Tres clases, tres mecánicas distintas: en N4 se programa un solo actor; en N5 se encadenan niveles; en N8 se diseña la mecánica, se equilibra la dificultad y se prueba con jugadores.

### M2 · El juez — casos de prueba en Tecnia Código y Tecnia Datos

Una pieza de motor pequeña (un panel de casos con entrada, salida esperada y veredicto, corridos por el intérprete o el motor SQL) y la reescritura de los **14 laboratorios dictados** a enunciado + casos + pistas escalonadas. Es lo que convierte «Problemas tipo concurso» en un concurso, y lo que hace que cinco clases de N7, cuatro de N8, dos de N9 y seis de N10 pasen de transcribir a resolver.

### M3 · JavaScript de verdad en Tecnia Web

El JS del alumno corre en un `iframe` con `sandbox` y `srcdoc` (sin origen, sin red), con un arnés inyectado que devuelve por `postMessage` el DOM resultante y la consola, para que los predicados sigan leyendo la página producida. Levanta `n8-javascript-basico`, la parte JS de `n8-sitio-multipagina`, `n10-proyecto-web-real` y el capstone.

### M4 · Python: módulos propios, archivos virtuales y `random`/`math`

Varios archivos `.py` en la misma ventana con `import` entre ellos, un disco virtual con `open`/`with` para leer un CSV de datos, y los dos módulos de fábrica. Levanta `n10-python-intermedio` (que hoy no puede enseñar su tema), `n10-analisis-con-codigo` y `n9-datos-con-python`.

### M5 · Tecnia Red — dispositivos, direcciones, paquetes, cortafuegos

Un simulador de red pequeña (router, equipos, servidor, IP, puertos, un paquete que se ve viajar) con reglas de cortafuegos de verdad. Levanta `n8-ip-wifi-servidores` y sustituye entero `n10-amenazas-y-defensa`.

### M6 · Motor de reglas IoT y la casa como espacio real

Sensores con hoja de datos (rango, unidad, alcance), reglas editables (sensor, comparador, umbral, `Y`, actuador), reloj del día y eventos. Las tres de N9 robótica pasan a escribir reglas que se pueden equivocar. **Decisión pendiente de Cristofer:** si la casa se queda en 3D, tiene que ser porque colocar el PIR mirando a la puerta o el LDR junto a la ventana cambia la lectura (3D como contenido, con el banco físico existente); si no, panel de software y se quita la geometría.

### M7 · Prototipo recorrible y comportamiento low-code en Tecnia Diseño

Modo «probar» que navega el prototipo, y bloques de evento («al tocar el botón → ir a pantalla / cambiar texto / sumar») montados como escenario de Tecnia Bloques, que es lo que la portada de `n9-construye-low-code` promete. `n9-pruebas-con-usuarios` pasa a probar **la app del alumno**, no sesiones de texto fijo.

### Reescrituras sin motor nuevo (13 laboratorios)

| Laboratorio | Qué cambia |
|---|---|
| `n8-malware-e-ingenieria-social` | veredictos con los predicados del motor de correo; las lupas obligatorias; 10 correos |
| `n9-ia-copiloto` | el código de la IA se ejecuta en Tecnia Código y el alumno lo arregla |
| `n9-gestiona-tu-proyecto` | el alumno decide a quién y para cuándo, con criterios (carga, fechas) que el tablero verifica |
| `n7-privacidad-en-redes`, `n7-equilibrio-digital` | botones sin delatar, consecuencia diferida en el muro, `restar()` |
| `n7-html-estructura`, `n8-imagen-con-capas` | 9 encargos sobre el motor que ya tienen, sin la solución en la pista |
| `n9-bases-de-datos-iniciales` | `CREATE TABLE`, `INSERT` y el primer `JOIN` |
| `n8-sesgos-y-errores` | generador sobre el motor de aprendizaje, no una tabla que se revela |
| `n7-dentro-del-gabinete` | sin el número de paso en el anclaje; las piezas con raycast, no botones HTML |
| `n9-proyecto-integrador`, `n10-capstone` | integran artefactos del nivel (estándar 7) |
| `n10-etica-y-regulacion`, `n10-carreras-ciber`, `n10-carreras-y-certificaciones`, `n9-empleos-tecnologicos`, `n9-ia-y-trabajo` | dejan de ser cuestionarios: expediente con un artefacto (un plan de carrera con su ruta de certificaciones en el navegador; una evaluación de impacto sobre un caso con el motor de IA) |

---

## 6. Orden

El orden va por lo que Cristofer nombró y por lo que desbloquea más:

| Fase | Qué | Levanta | Depende de |
|---|---|---|---|
| **1** | M1 Tecnia Juegos + `n8-disena-tu-videojuego` reconstruido | 1 ahora, 3 en total | nada |
| **2** | M2 el juez + las 14 clases de código reescritas; M4 módulos y archivos | 14 | nada |
| **3** | M3 JavaScript real + 4 clases | 4 | nada |
| **4** | M5 Tecnia Red, M6 reglas IoT, M7 prototipo recorrible + sus 8 clases | 8 | decisión 3D (M6) |
| **5** | las 13 reescrituras sin motor nuevo | 13 | M2 para dos de ellas |
| **6** | los dos cierres integradores | 2 | todo lo anterior |

Regla de trabajo, la misma del estándar robusto (30-jul-2026): **una actividad a la vez, documento pedagógico antes que código, y no se avanza hasta que la anterior pasa la prueba de jugar mal.** Máximo dos agentes en paralelo con extracto pegado dentro del encargo; nunca «lee el documento entero».

**Fase 1 arranca en esta misma sesión** con el documento pedagógico de Tecnia Juegos y la clase de N8 (§67 del documento maestro), y su construcción.

> **Estado, 12-sep-2026 (misma sesión): fase 1 CONSTRUIDA.** §67 escrito; `src/components/simuladores/juego/` (modelo, sprites, catálogo, físicas, ejecución con caché, partida, jugador de prueba A*, sondas, guiones, ventana) y `n8-disena-tu-videojuego` reescrita con nueve encargos comprobados por simulación. Medido: `juego-motor.test.ts` 20/20 (el jugador de prueba termina «La mina» en 41–204 nodos y 17–30 ms por perfil; declara imposible un hueco de 8 casillas en 418 nodos), `n8-disena-tu-videojuego.test.tsx` 10/10 (recorrido entero sin ratón, jugando mal), censo de armazones 39/39 con Tecnia Juegos registrado como el 17.º, `tsc` limpio, jest 4 021/4 021, y la quinta puerta con Chromium en `/hub/nivel/8/actividad/n8-disena-tu-videojuego`. El video se **regrabó el mismo día**: guion nuevo de 33 escenas (`n8-jgo-*`, prefijo nuevo para que ninguna narración vieja pueda reaparecer), 24 imágenes, 5:32 de narración, póster rehecho del fotograma nuevo y `assetsPendientes: false`. Deuda viva: llevar N5 y N4 al mismo armazón (fase 6).


> **Estado, 12-sep-2026 (misma sesión): fase 2 (M2) CONSTRUIDA.** §68 escrito. `src/components/simuladores/juez/` (modelo con tachado de casos ocultos en el propio dato, juez de Python sobre el intérprete real, juez de SQL con siembra por caso, tablero de veredictos fuera de React, panel) y `n10-problemas-de-concurso` reescrita: **seis problemas, 29 casos de los cuales 20 ocultos**, tres pistas en escalera por problema —la tercera cuesta— y un encargo final en el que el alumno escribe el caso de prueba que desenmascara una solución rota, contra su propia solución como referencia. La única pregunta de opción de la clase es la última.
>
> Medido: `juez-y-concurso.test.ts` 32/32 —las seis soluciones de referencia salen aceptadas y **los seis señuelos fallan en el caso oculto que los caza**—, `n10-problemas-de-concurso.test.tsx` 10/10 (recorrido entero, jugando mal primero), censo de armazones con el juez registrado y conducido en modo estricto, `tsc` limpio, jest **168 suites / 4 067 pruebas**, y la quinta puerta en Chromium: el panel no tapa el editor (editor x 230–921, panel x 951–1250), el veredicto se lee, los casos ocultos no filtran ni un dígito en el texto visible y a 400 px `scrollWidth` = 400.
>
> Lo que costó: `print("\u0001")` imprime `u0001` —el léxico no tiene escapes unicode—, que obligó a construir la marca con el carácter crudo y de paso la volvió infalsificable; el tope de pasos del juez bajó a 100 000 (medido: la solución más cara gasta 1 694); el panel saltaba al problema siguiente antes de que el alumno viera su veredicto (se ancla al enviar, y el ancla caduca con el texto); y el encargo no se cerraba hasta la siguiente tecla, lo que obligó a ampliar el contrato de Tecnia Código con `revisar()`.
>
> Deuda viva de esta fase: quedan **12 de los 14 laboratorios dictados**; y el video de `n10-problemas-de-concurso` explica los cinco problemas dictados de la versión vieja (`assetsPendientes: true` hasta regrabar — 8 de sus 18 imágenes hechas).
>
> **Segunda clase de la fase 2: `n10-consultas-sql`, el mismo día (§68.1).** La peor de las catorce —su primer encargo tenía la consulta como instrucción **y** como pista— pasa a **siete problemas, 21 casos de los cuales 14 ocultos**, y los casos ocultos corren sobre **otras dos siembras**: otro club, con otra gente y otros números de equipo. El problema 7 existe para eso: «Los Circuitos» lleva un número distinto en cada siembra, así que filtrar por el número **pasa el caso visible** y cae en los ocultos. Los dos encargos de cierre (las 150 sesiones y el tope de 100 filas) se quedan: es lo único de la clase que hay que ver en pantalla.
>
> Medido: `juez-sql-y-consultas.test.ts` 29/29, `n10-consultas-sql.test.tsx` 15/15 —incluida la regresión de que **sin `ORDER BY` el problema 1 se rechaza**—, `tsc` limpio, lint limpio, jest **170 suites / 4 110 pruebas**, y la quinta puerta en Chromium: editor x 176–902 contra panel x 916–1264 (sin solape), ninguna de las dos siembras ocultas se asoma al texto visible, el pie dice «Se muestran las primeras 100 de 150 filas» y a 400 px el cuerpo mide 400.
>
> Lo que costó: una **pista que mentía** —decía «ojo con las mayúsculas» y `LIKE` no las distingue (`modelo.ts:297`, a propósito, «como SQLite»)—, cazada porque el señuelo de la prueba fue **aceptado con razón**; el segundo cliente obligó a partir `PanelJuez.tsx` en `TableroJuez.tsx` + dos envoltorios y a volverlo genérico sobre los props del armazón, porque recortarlos dejaba al pie de la clase sin `ejecucion`; y el botón «Enviar al juez» estaba **a 942 px de una columna que enseña 544** (medido, no deducido), lo que se arregló acotando el cotejo a 8 líneas y el ejemplo a 6 filas —872 px— y nombrando el botón en el propio encargo. Regla nueva: **cada pista es una afirmación sobre el motor y necesita una prueba que la ate.**
>
> El video de `n10-consultas-sql` **también se regraba**: el publicado es de la tanda vieja (32 escenas, sin `papeles`) y narra otra clase —habla de «proyectos» y de «la tabla alumnos con la tabla notas», que no existen aquí, y no menciona el juez—. Los conceptos sí cuadran, así que no dice nada falso sobre SQL; dice cosas falsas sobre esta clase.
>
> **Tercera clase de la fase 2: `n9-busqueda-y-ordenamiento`, el mismo día (§68.2).** Once encargos dictados —el primero exigía con nueve expresiones regulares cada línea tal cual— pasan a **seis problemas, 30 casos de los cuales 18 ocultos**. Cuatro de los seis devuelven un número de trabajo (comparaciones, intercambios, pasadas), y eso es lo que cierra el atajo: `sorted()` ordena en una línea, pero ninguna función de Python cuenta por ti lo que costó. Medido: 19 + 7 pruebas nuevas, jest **172 suites / 4 137**, quinta puerta limpia. **El video ya está regrabado y publicado** (5:05) sin tocar ComfyUI: diez escenas con narración nueva sobre sus imágenes de siempre.
>
> Dos hallazgos que valen para las once que faltan: **los planes docentes de las tres clases reescritas seguían describiendo la versión dictada** —se rehicieron los tres, y reescribir una clase incluye desde ahora su plan—; y una llamada de varias líneas se pintaba en un solo renglón (`pre-wrap`).
>
> Al preparar la cuarta (`n9-datos-con-python`) apareció un defecto del intérprete: **`round(x, n)` no redondeaba como Python** —`round(6.35, 1)` daba 6.4, `round(2.675, 2)` 2.68—, porque redondeaba `x * 10^n` y esa multiplicación ya redondea. Corregido en `maquina.ts` y medido contra CPython 3.14, que está instalado en esta máquina y desde hoy es la referencia para las salidas de los casos.
>
> **Cuarta clase de la fase 2: `n9-datos-con-python`, el mismo día (§68.3).** Nueve encargos dictados —con los textos de cada `print` exigidos con `fuente.includes`— pasan a **seis problemas, 31 casos de los cuales 19 ocultos**, sobre registros de calificaciones donde la calificación puede ser `None`. El centro de la clase es que **un dato que falta no es un cero**: `if calificacion:` confunde al que no entregó con el que sacó cero, no revienta y da un número que parece bueno; por eso hay un cero oculto en cinco de los seis. Las salidas y los siete señuelos se midieron primero con **CPython 3.14** y luego con el intérprete (21 + 7 pruebas, jest **174 suites / 4 165**). Video regrabado y publicado (5:05) renarrando 5 de 31 escenas.
>
> Al medirlo en Chromium salió un defecto que tenían **todas** las clases del juez: **«Enviar al juez» no se veía al entrar** —la columna lateral enseña 544 px y el botón quedaba a 871 (SQL), 893 (búsqueda) y 986 px (datos)—. Ahora va pegado abajo de la columna (`position: sticky`), medido en las cuatro clases: se ve, recibe el clic y saca el veredicto. Y los ejemplos visibles se acotan a tres registros: un grupo de ocho ocupaba doce renglones.
>
> **Lo que viene: las cinco de N7 y `n8-listas-y-diccionarios` van antes de que el alumno sepa `def`**, así que el juez que llama a funciones no les sirve. El intérprete ya acepta una cola de `entradas` para `input()`: el siguiente paso es **§68.4, el juez de programas** —cada caso trae lo que se teclea y se comparan sólo las líneas de `print`— y reescribir encima las clases de N7, que además tienen predicados que ya leen el resultado (tipos, errores) y sólo dictan en la instrucción.
>
> **Los videos de `n10-consultas-sql` y `n10-problemas-de-concurso`, regrabados el mismo día.** La deuda que estaba «parada por el disco» no lo estaba: con 25,8 GB libres tras el reinicio, ComfyUI cargó el modelo con un mínimo de 3,1 GB libres (medido cada 20 s) y generó las 28 imágenes que faltaban sin caerse. Una salió con letras inventadas en una placa («H03ba4e») y se rehízo pidiendo una forma en vez de texto. SQL: 33 escenas, 5:40, y se retiraron 40 audios y el render del 18-ago de la versión vieja. Concurso: 33 escenas, 5:42, y `assetsPendientes` vuelve a `false`. Los dos comprobados en Chromium (340,05 s y 341,59 s) y con fotogramas que narran la clase del juez. **Las cuatro clases de la fase 2 tienen ya su video al día.** Queda subirlos a R2.

---

## 7. Depuración del 12-sep-2026 (tarde), a pedido de Cristofer

> «busca y arregla bugs, depura la plataforma»

**1. Las 80 actividades de N7–N10 abiertas con Chromium, una por una** (`scratchpad/recorrido.mjs`, dos recorredores en sentidos opuestos): entrada, CTA, portada de objetivos, laboratorio, y a 400 px. **Resultado: 0 errores de consola, 0 respuestas HTTP ≥ 400, 0 imágenes rotas, 80 videos con 200, 0 desbordes a 1440 y a 400 px.** Técnicamente limpias.

**2. Lo que las señales automáticas no veían y las capturas sí: la burbuja de Bit tapaba el trabajo.** Una sonda midió la intersección de `.bit-globo` con campos, editores, consolas y botones: **en 39 de 80 tapaba algo usable y seguía ahí a los 10 s** — el 43–48 % de la consola en las 13 clases de Tecnia Código, parte del editor en las de Tecnia Web, un botón de respuesta entero (70–100 %) en `n10-capstone` y `n9-proyecto-integrador`, el 75–84 % de botones de Tecnia Diseño. La causa: `bit` sólo cambia cuando Bit vuelve a hablar, así que el globo no se iba nunca. **Arreglado en la pieza común** (`useGloboDeBit` en `ArcadeSala.tsx`, usada también por `ArcadeSala3D` y `SalaBanco3D`, debajo de 109 archivos): el globo se recoge tras un tiempo de lectura proporcional al texto (7–18 s) o en cuanto el alumno teclea o entra en un campo, vuelve con cada línea nueva y asoma al pasar el ratón por la cara de Bit. El retrato **no** se volvió botón: la misma sonda lo encontró encima de botones (hasta 84 %) y habría bloqueado sus clics. El texto no sale del DOM (la voz, `aria-live` y 12 pruebas lo siguen leyendo). **Medido otra vez en Chromium: de 39 a 0 a los 20 s.** `bit-se-recoge.test.tsx` 6/6; jest 175 suites / 4 171.

**3. El script de subida a R2 no habría subido los videos regrabados.** `medios.mjs subir` se saltaba toda clave presente en `.medios/subidos.txt`, y las cinco regrabadas de hoy (incluida `n8-disena-tu-videojuego`) ya estaban: producción habría seguido con los videos viejos sin un solo error. Ahora manda el bucket (clave y peso) y la lista es sólo respaldo. **La subida no se pudo hacer**: la llave de `.medios/credenciales.env` da 403 hasta en una lectura, y la sesión de `wrangler` es de otra cuenta (la de CEN, sin el bucket `tecnia-medios`). Hace falta una llave nueva de R2 de la cuenta de Tecnia.

**4. Jest sin avisos de React** (0 `key` duplicadas, 0 actualizaciones en render) y `n10-analisis-con-codigo` con la duración del catálogo corregida (35 → 40 min, la de la clase).

---

## Anexo · Capturas y evidencia

Los cuatro informes de lectura íntegros (una ficha de siete campos por laboratorio, con líneas citadas) están en `docs/auditoria-2026-09-12/` — `n7.md`, `n8.md`, `n9.md`, `n10.md`. Las capturas de las tres pantallas de 12 laboratorios se tomaron con Playwright contra el servidor de desarrollo en el puerto 3002.
