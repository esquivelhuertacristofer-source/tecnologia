# Plan de calidad N6–N10 (6-oct-2026)

> Encargo de Cristofer, 6-oct-2026: «El cliente solicitó una mejora sustancial de
> calidad en toda la plataforma… lo mejor construido es Office, los bloques del
> nivel 6 hacia adelante son deficientes: dinámicas o 3D pobre o no cumplen con
> lo que promete la clase». Autorizado entero: «Adelante, te autorizo todo…
> optimiza los tokens, Sonnet para lo que corresponda y Opus en ocasiones
> especiales».

Este plan **continúa** `ROBUSTECIMIENTO-SECUNDARIA-Y-BACHILLERATO.md` (N7–N10,
12-sep-2026) y le suma N6, que nunca se había auditado.

---

## 1. Diagnóstico medido

| | N6 (6-oct) | N7–N10 (12-sep) |
|---|---:|---:|
| Laboratorios | 18 | 71 |
| Cuestionario disfrazado (exigencia ≤ 2) | 8 | 27 |
| Trabajo real (exigencia ≥ 4) | 1 | 19 |
| Dictan la solución | 14 + 2 parciales | 14 (código) |
| Un botón o etiqueta delata la respuesta | 14 | varios |
| Exigencia media (1–5) | 2,44 | 2,8 |
| Ya reconstruidos | 0 | 7 |

Verificado a mano antes de escribir esto:
- el botón correcto en esmeralda y los demás en pizarra (`LabAltoAlCiberacoso.tsx:170`);
- la «IA» que responde por número de encargo y no por la petición (`LabCreaConIa.tsx:133`);
- `VentanaCodigo.tsx` pinta las opciones en el orden escrito. En N6, 8 de 9 respuestas correctas son la segunda.

**Por qué Office funciona y N6+ no.** Office es *un programa profundo por
materia, muchas clases encima*: `motor-hojas` (17 134 líneas) sostiene 23 clases
de Excel, cada clase abre el mismo programa y se corrige leyendo el documento.
De N6 en adelante es al revés: un laboratorio suelto por clase, de 200–1 000
líneas, que dicta la fórmula o el código y usa el motor para comprobar la copia.

### Familias de avería en N6 (además de F1–F5 del documento de robustecimiento)

1. Motor bueno, solución dictada.
2. Opción múltiple sin barajar: la correcta casi siempre es la segunda, y suele ser la más larga.
3. Un color o una etiqueta delata la respuesta: botón esmeralda, «(nítida)», el motivo escrito en la tarjeta.
4. Bit narra la respuesta antes de que el alumno haga el gesto.
5. Se pide «provocar el error», pero no se comprueba.
6. El simulador está montado como pantalla. El muro no tiene `onAccion`, el asistente da respuestas fijas, y la decisión vive en botones de un panel lateral.

---

## 2. El estándar (sin cambios, extendido a N6)

Las 7 reglas del §4 del documento de robustecimiento valen desde N6, con una
concesión de edad (11–12 años): **en N6 se admite que la primera vez que se usa
una herramienta se nombre** (modo guía al estilo Office); lo que no se dicta
nunca es *el resultado* —la fórmula, el código, la respuesta—.

---

## 3. Fases

| Fase | Qué | Clases | Notas |
|---|---|---|---|
| **0** | Terminar los videos de `n7-entrada-y-salida` y `n7-condicionales-python` | 2 | deuda del 13-sep |
| **A** | Quitar las respuestas regaladas en toda la plataforma: barajar opciones (determinista, por id del paso) en los 3 renderizadores comunes + labs que pintan sus propias opciones; colores iguales; quitar etiquetas que delatan | transversal | primero: es lo que vería CEN al probar |
| **B1** | Hojas: `n6-interpreta-la-informacion`, `n6-funciones-esenciales`, `n6-elige-la-grafica` | 3 | pregunta en vez de fórmula; errores sembrados que hay que cazar |
| **B2** | Red social: `n6-alto-al-ciberacoso`, `n6-privacidad-en-juegos`, `n7-privacidad-en-redes`, `n7-equilibrio-digital` | 4 | conectar `onAccion` del muro; evaluar el estado del muro |
| **B3** | Código + juez: `n7-bucles-python`, `n7-retos-python`, `n7-variables-y-tipos`, `n8-listas-y-diccionarios`, `n10-python-intermedio`, `n6-primeras-lineas-python` | 6 | el juez de programas ya existe (§68.4) |
| **B4** | Web + JavaScript real (M3) y las clases web de N6, N8 y N10 | ~7 | motor nuevo: `iframe sandbox` |
| **B5** | Asistente de IA: `n6-crea-con-ia` y hermanas de N7 | ~3 | la respuesta depende de la petición |
| **B6** | Bloques/Juegos: `n6-reto-robot`, `n6-programa-un-microbit`, `n6-bloques-vs-codigo` | 3 | meta y mapa, no receta |
| **C** | 3D donde el espacio es contenido: robots con sensor de rayo (N6, N9), casa IoT (M6), Tecnia Red (M5) | ~8 | decisión 3D de Cristofer: SÍ |
| **D** | Integradores: N6, N9, capstone N10 con los artefactos del nivel | 3 | al final |
| **E** | El resto de reescrituras de N7–N10 del documento de robustecimiento | ~30 | en el orden de aquel §6 |

Cada clase reescrita incluye su § en el documento maestro, el laboratorio, su
entrada, el registro, el plan docente (`src/lib/planeacion/contenido.ts`), la
fila del canon, las pruebas (jugando mal), la quinta puerta con Chromium y el
video (renarrar con sufijo `b` si las imágenes valen; si no, imágenes nuevas).

---

## 4. Política de modelos y de tokens

El 14-ago-2026 nueve agentes Opus gastaron el 20 % de la cuota semanal en 4 h
sin entregar (`flotas-lo-que-cuestan`). La regla de entonces se mantiene y se
afina:

| Quién | Para qué |
|---|---|
| **Opus (la sesión principal)** | diseño pedagógico (los §), elegir problemas, casos ocultos y señuelos, cambios a motores compartidos (intérprete, juez, renderizadores comunes), verificar lo que entregan los agentes, jugar mal, la quinta puerta |
| **Sonnet (agentes)** | cambios mecánicos con el extracto pegado: igualar colores en N archivos, actualizar entrada/registro/canon/plan desde un texto ya escrito, escribir pruebas desde una especificación, borradores de guion de video desde un § pegado, correr la cadena de video, barridos con Chromium y hojas de contactos |
| **Haiku (agentes Explore)** | inventarios y conteos de solo lectura |

Reglas de tokens:
1. **Máximo 2 agentes a la vez**, sobre archivos disjuntos (no hay git: el último que escribe borra al otro).
2. **El extracto va pegado dentro del encargo**; nunca «lee el documento entero».
3. Informe del agente ≤ 300 palabras, con archivo:línea; nada de volcar archivos.
4. La sesión principal lee rangos (`sed -n`, `grep -n`), no archivos enteros, y reutiliza los guiones del scratchpad (`rep.js`, `puerta5-*.mjs`, `entrar.mjs`).
5. Pruebas: correr sólo las suites tocadas mientras se trabaja; la suite entera, `tsc` y lint al cerrar cada fase.
6. ComfyUI sólo si faltan imágenes; antes, renarrar sobre las que ya hay.

---

## 5. Bitácora

- **6-oct-2026** — Plan escrito. Auditoría de N6 hecha (agente Explore + comprobación a mano de tres hallazgos).
- **6-oct-2026, noche** — Fase 0 cerrada: los videos de `n7-entrada-y-salida` (6:01) y `n7-condicionales-python` (5:16, 11 escenas renarradas) están renderizados y publicados con su póster. `node_modules` de la plataforma y de video reinstalados con `npm ci`: habían desaparecido al liberar disco.
- **Fase A** — `src/lib/ordenDeOpciones.ts` (`ordenDeOpciones` y `barajadas`, deterministas por id) en los 6 renderizadores comunes (Código, Bloques, Web, Datos, el chrome de Office y el Auditorio) y en 33 laboratorios con opciones propias (dos agentes Sonnet con archivos disjuntos). Los botones de una misma decisión quedaron neutros en 17 archivos. `n6-edita-imagen-y-video`: la toma movida ahora se DIBUJA movida (desenfoque y glifo fantasma, `Recurso.movida`) y la instrucción ya no dice cuál es. Rompió 21 pruebas: el ayudante `elegirLa(i)` de PowerPoint pulsaba por posición en pantalla y ahora busca el índice original (`data-opcion`).
- **B2 · `n6-alto-al-ciberacoso` reescrita** (§69.1). Tecnia Muro gana bloquear, capturar, reportar con motivo, mensajes privados (`BandejaMuro`). Dos misiones evaluadas por el estado del muro; los tropiezos NO restan puntos (decisión original de la clase, que se respeta). Prueba 8/8 jugando mal. Quinta puerta: sin solape, los 4 motivos con un solo estilo computado, la misión 1 se cumple en Chromium, 400 px = 400. Cazado en la puerta: el texto de la bandeja salía oscuro sobre oscuro (vivía fuera de `.tm`).
- **B2 · `n6-privacidad-en-juegos` reescrita** (§69.2). Tres misiones dentro del muro más la pestaña «Así te ve un desconocido»: ocultar lo que delata la rutina sin borrar (el dragón sigue público), bloquear y reportar a Jugador_Nocturno con el motivo «Me pide datos personales» y contárselo a un adulto, y publicar eligiendo la audiencia ANTES. Prueba 6/6. Cazado jugando mal: borrar la publicación del horario se llevaba el único comentario reportable de Nocturno y la misión 2 quedaba sin salida → llega un segundo comentario suyo con la misión.
- **B5 · `n6-crea-con-ia` reescrita** (§69.3) sobre la pieza nueva `simuladores/generador` (Tecnia Imagina): la imagen sale de la petición, determinista por semilla; el comité juzga con `cumple` y la firma se compara contra la generación de la que salió la imagen del cartel. Ya no usa el armazón `asistente`; `guionCreaConIa.ts` y `creaConIa.css` borrados. Prueba 16/16 + 10 del generador. Tres cosas que sólo salieron jugando:
  1. **La misma petición completa daba tandas idénticas ~5 % de las veces** (sólo varía lo que se cuela) → cada imagen lleva un `encuadre` propio. Medido: 0 de 300 pares iguales.
  2. **La primera generación de casi todo el grupo («volcán» a secas) salía en plastilina y vertical las tres**: la lección del encargo 1 no se veía → sin estilo pedido salen tres estilos; sin formato, nunca tres iguales.
  3. **Una imagen de la petición vaga puede pasar el comité** (pasó en la quinta puerta). No es un defecto: es la lección de la firma —se firma la petición que DE VERDAD la generó— y ahora tiene su prueba.
  Quinta puerta: recorrido entero en Chromium, consola limpia salvo el ruido conocido de desarrollo, 400 px = 400. Cazados ahí: `.arcade-n1 button { font: inherit }` le ganaba a los chips (especificidad), el globo de Bit tapaba Generar (se subió la caja de la petición) y los motivos del rechazo quedaban bajo el pliegue.
- **Videos de las tres clases del muro y la IA** — escenas renarradas con sufijo `b`, cada video con SU voz para no mezclar dos en uno: `n6-crea-con-ia` 7 escenas con la voz nueva (`narracion-vox`); `n6-alto-al-ciberacoso` 15 y `n6-privacidad-en-juegos` 9 con XTTS (`narracion.py`), que es la voz con la que se publicaron. En las dos del muro había además una escena repetida palabra por palabra (g3 = g6).
- **Pendiente de Cristofer (voz):** el modelo XTTS (voz Alison) ya no está en disco y su licencia es la CPML no comercial. Los guiones de `n6-alto-al-ciberacoso` y `n6-privacidad-en-juegos` ya están reescritos (24 escenas con sufijo b), pero sin audio: los WAV viejos de esas escenas se borraron antes de tener los nuevos (error mío; ver memoria `xtts-modelo-borrado`). Sus mp4 publicados siguen intactos, con el contenido viejo. Opciones: recuperar XTTS con su licencia, o narrar los dos enteros con la voz nueva.
- **B1 · `n6-contrasenas-fuertes` reescrita** (§69.4). La regla del §24 sigue (el alumno no teclea ninguna contraseña): las llaves se ARMAN con fichas en `ArmadorDeLlave` —un diálogo del sitio, en portal al body—, con el perfil de Dani, palabras de siempre, la bolsa, números y signos, el disfraz y «reusar». El motor ganó dos pasos: **piezas conocidas** y **a lo bruto con paciencia** (mil millones). Hueco cerrado: antes `gato` o tres palabras «no caían». Medido: rocky 2014 cae en el intento 65; tres palabras, 36,6 millones → cae; cuatro, 12 149 millones → aguanta. E2, E3, E4 y E6 juzgan la llave armada; guardar una que cae deja la cuenta diciéndolo. Pruebas 49/49 (18 de la clase, 31 del motor). Quinta puerta E1→E5 en Chromium, consola limpia, 400 px = 400; cazado ahí: el diálogo quedaba cortado por el alto de la ventana del navegador y Probar/Guardar bajo el pliegue. Video: 6 escenas renarradas con la voz nueva (había un «contador de contraseñas tecleadas» que no existe).
- **B1 · `n6-proyecto-integrador`** (§69.5). El E4 comparaba el título con seis frases fijas (escribir = copiar una de seis). Ahora `juezDeAfirmaciones.ts` (puro) juzga la frase PROPIA del alumno contra la tabla del salón: sostenida, falsa (con los números), fuera de alcance (país, otros años, el futuro, lo que habría que hacer) o no entiendo (dice qué falta). Cinco tipos de frase, cada uno con su gráfica; empates y «no» incluidos. La gráfica del E5 y la propuesta del E9 salen de esa frase. Pruebas 32/32 (9 del juez, que comprueba también que las seis frases viejas dan el mismo veredicto y que su tabla es la de la página). Quinta puerta: cinco frases propias juzgadas en Chromium, consola limpia. Cazado ahí, y era de antes: **el panel de la tabla era texto claro sobre el fondo claro del panel de PowerPoint** —ilegible— → fondo propio. El video ya contaba la clase así («escribes tu afirmación en una línea»); no se renarra.
- **C (adelantada) · `n6-que-es-un-robot`** (§69.6). Dos defectos: Bit dictaba la charola al levantar la pieza («El motor gira la rueda. Salida.»), y `robotSeDetiene` era `dondeEsta(...) === 'frente'`, una consulta de tabla. Ahora el sensor de distancia lanza un **rayo** desde su anclaje hacia donde mira (`sensorVeLaCaja`, método de las losas) y la caja se para donde el sensor lee 0,35 (`dondeSeDetiene`); el dibujo de la caja usa las mismas constantes. Bit describe la pieza sin clasificarla. Pruebas 23/23. Quinta puerta, con dos hallazgos que eran de antes: **sin WebGL no se podía montar ninguna pieza** en ninguna de las cuatro clases de `BancoFisico3D` (el `pointerup` global devolvía la pieza antes del `click` de «Poner en…»; jsdom no lo ve), corregido en la pieza compartida, con las otras tres clases en 33/33 y la del robot jugada entera en Chromium sin WebGL; y **los letreros de las charolas se tapaban** desde la cámara inicial. Video sin tocar.
- **Control completo** (después de B1): jest 4253/4259; las 6 que fallan son de tiempo bajo carga, en `ventana-codigo` (coloreado < 40 ms) y en dos suites de Excel, y se repiten solas. tsc: 1 error mío (`mira` opcional), corregido. Lint: 7 errores en archivos que esta fase no tocó (`altas-*.test.ts`, `global-error.tsx`, `estudio/*`, `useJuego.ts`), anotados y sin tocar.
- **B1 · `n6-funciones-esenciales`** (§69.7). Los seis encargos del bloque 25 dictaban la fórmula entera y los predicados exigían el rango exacto (una respuesta correcta con encabezado no pasaba). Ahora cada encargo es una pregunta de la tesorera; la función se nombra la primera vez con lo que pide. Los predicados juzgan lo que hace la fórmula (`cuentaSoloEstosRenglones`: toca cada renglón y la respuesta tiene que moverse exactamente con los de la pregunta). **El rango corrido ya no se cuenta: se siembra** en B19, que abre en 3170 sin ningún error. La resta de fechas también pasa a pregunta. Pruebas 13/13 (3 nuevas: el número tecleado, la suma a mano y el SUMAR.SI parcial no pasan; la forma con `$` y encabezado sí; ninguna instrucción trae fórmula), contrato 1380/1380. Quinta puerta limpia. Deudas: la columna A corta el texto (el modelo de hoja no guarda ancho: es de toda la sala) y el video sigue en XTTS con una escena desfasada.
- **B1 · `n6-elige-la-grafica`** (§69.8). La clase de ELEGIR la gráfica dictaba el tipo y el rango en los cuatro encargos de elegir, la señal del modo guía apuntaba al botón exacto y la primera ficha de la entrada traía la tabla de respuestas. Ahora las cuatro son preguntas (la señal apunta al grupo), se acepta lo que contesta (barras o columnas; el rango con o sin encabezado), y las cinco gráficas viven juntas en Insertar → Gráficos con una cinta propia de la clase. **El panel aparte se quitó porque cortaba la gráfica justo en la barra de la respuesta** (lo cazó la quinta puerta). Pieza nueva del motor de Office, opcional: `PasoClase.equivocado`, que cobra y explica una elección que no contesta (sin él, probar los cinco tipos al tanteo salía gratis). Las provocaciones y el experimento del eje cortado se quedan. Pruebas 11/11; la del recorrido completo lleva límite propio de 240 s (medido: 101 s sin panel, 79 s con panel).
- **B1 · `n6-interpreta-la-informacion`** (§69.9). Clase de auditar el libro ajeno, con tres averías que llegaban cazadas: el texto del encargo 1 nombraba a Camila y el 2 dictaba la celda y la fórmula; el `#¡REF!` y el `#¡DIV/0!` daban celda, causa y arreglo. Ahora se buscan desde lo que dice la herramienta (Mostrar fórmulas, el parte de Inspeccionar libro). Los predicados del 2 y del 5 exigen que la fórmula lea su fila: `=150` y `=900-300` ya no cierran. Pruebas 10/10. La sección del documento se escribió después del parche (anotado ahí). **Con esto B1 queda completa: las tres clases de Hojas.**
- **Batería de Office** tras los cambios compartidos (`PasoClase.equivocado`, `VentanaHojas`): 28 suites, 1772/1772.
- **B6 · `n6-reto-robot`** (§69.10). Era receta (seis encargos dictando bloque por bloque en un 3×3 sin obstáculos). Ahora: dos mapas 5×5 con paredes en pestañas, la bandera detiene al robot, y el reto es UN programa que llegue en los dos sin chocar; el juez lo corre en ambos sin pintarlos (`correrEnMapa`), así que contar pasos no basta y hace falta «si» dentro de «repetir». Se nombran los bloques nuevos, nunca su orden. Prueba propia nueva, 7/7 (antes no tenía). Cazado en la quinta puerta: la sala de bloques pinta texto plano (los `**` salían literales) y **la cara de Bit tapaba el texto del encargo en las tres clases de la sala** → margen en `.blqs-panel`. La entrada traía como ficha la respuesta de la pregunta final.
- **Videos desfasados que esperan la decisión de XTTS** (todos en la voz vieja, sin `papeles`): `n6-funciones-esenciales` (g4 promete provocar el error de las comillas; g2 = g6) y `n6-reto-robot` (c3 y c10 hablan de un sensor que «mide la distancia» y de «ajustar la distancia de detección», que la clase no tiene; g3 = g6). Se suman a `n6-alto-al-ciberacoso` y `n6-privacidad-en-juegos`.
- **B6 · `n6-programa-un-microbit`** (§69.11). El encargo 1 dictaba bajo qué sombrero iba el bloque —la respuesta de la clase— y se cumplía con cualquier cara feliz en pantalla, saliera del sombrero que saliera; el 5 dictaba el orden. Ahora 1 y 2 son metas («que al pulsar A salga una cara feliz») y el juez corre sin pantalla la pila de ESE botón (`pantallaTras`) contra la foto del programa con la que corrió; el 5 pide la estrella al reiniciar con los mismos dos bloques, sin quitar ninguno. Prueba propia nueva, 14/14. Quinta puerta jugando mal el 1 con el editor de verdad, consola limpia. Video desfasado desde antes (números, pausa, «A y B a la vez», corazón; g3 = g6): se suma a la lista de arriba.
- **B6 · `n6-bloques-vs-codigo`** (§69.12). Los encargos 3–5 eran receta («pon repetir, elige 3, suelta un decir DENTRO») con jueces sueltos (cinco renglones cualesquiera), y la clase que promete «leer en texto» nunca pedía leer texto para hacer algo. Ahora 3 y 4 son metas juzgadas por lo que sale («una palabra tres veces con UN solo bloque», «después, otra una sola vez»), y el 5 es nuevo: **el programa se da en Python y se arma en bloques**. **El texto mentía**: `for vuelta in range(3): print(vuelta)` salía 1 2 3 y contaba por renglón; ahora cuenta como Python (desde 0, una vez por vuelta, una sola variable). Pieza opcional nueva en la sala: `EncargoBloques.codigo`. Suite 29/29, sala 119/119. Cazado en la quinta puerta y de antes: **la consola cortaba en silencio lo que pasara de seis renglones**. Video: c10 decía algo falso de Python (cinco espacios); c10 y a3 renarradas con la voz nueva. **Con esto B6 queda completa.** Video renderizado (5:22, 24,9 MB), sólo local.
- **B4 (parte N6) · las tres clases web** (§69.13): `n6-como-se-hace-una-pagina`, `n6-html-basico`, `n6-publica-tu-pagina`. Los jueces ya leían el árbol; lo que dictaba eran las instrucciones (`html-basico` traía las siete líneas, la pista de la lista el `<ul>` entero; `publica` señalaba «la línea 10 entera» y daba los dos arreglos). Ahora se nombra la etiqueta y **la meta se ve**: pieza nueva de la sala, `PasoWeb.modelo`, que pinta en pequeño la página que hay que conseguir. En `publica` los datos que delatan están repartidos en tres sitios. Pruebas nuevas: ninguna línea dictada en las tres, y dos jugadas malas más en `publica`. Cazado en la quinta puerta y de antes: **la mesa de imágenes tapaba «Lo que hay que arreglar» en `html-basico`**, justo lo que se pide leer → el cuerpo ya no encoge en el marco `.pgw-marco`. La entrada de `publica` daba la respuesta del encargo 3. Videos (voz vieja) desfasados: `publica` y `como-se-hace`, a la lista.
- **Control de fase** (tras B6 y la parte N6 de B4): tsc limpio, **jest 4294/4294 en 181 suites**, lint con los mismos 7 errores de siempre en archivos que esta fase no tocó.
- **`n6-carteles-e-infografias`** (§69.14). Se llamaba «Carteles e infografías» y no tenía infografía: cuatro encargos de un cartel de feria, todos dictando los botones en orden. Ahora es la encuesta del salón («¿Cómo llegas a la escuela?») convertida en infografía: la pregunta de título, cuatro barras **proporcionales a su número** (se da una escala y el alumno calcula las otras tres; el juez acepta cualquier escala proporcional), misma base y ancho, la etiqueta con el número de SU barra, la respuesta destacada, la fuente abajo y en chico, y el cartel con jerarquía, sin tapar nada y con ≤ 4 colores. Ocho encargos, 25 min. En el panel, la medida en casillas y «Alto ±». Pruebas 16/16 (suite propia nueva). Quinta puerta limpia. Deuda: el cartel no se ve entero en la ventana (el tapete se desplaza). Video: hace falta guion nuevo, a la lista.
- **`n7-privacidad-en-redes`** (§69.15). El panel decía qué publicación delataba y daba dos botones, uno la respuesta; la consecuencia llegaba con «Seguir». Ahora, tres misiones dentro del muro (el patrón de `n6-privacidad-en-juegos` un nivel arriba): auditar con «Así te ve un desconocido» sin cerrar de más (el concurso y el cine siguen públicos), el reto viral «mascota + calle» que el salón ya contestó (se cumple con el perfil callado y el reto reportado por datos personales; contestar con Rocko trae a alguien que lo «guarda»), y Cuenta_Nueva21 que ya lo había visto (captura → adulto con la captura → bloqueo; al amigo no vale; bloquear primero esconde la prueba y se desbloquea en la pestaña nueva «Bloqueados»). 20 min. Pruebas 12/12. Quinta puerta limpia a 1440 y 400. Arreglado de paso el tiempo inventado en las dos de N6. Deuda: a 400 px el panel queda bajo el muro (también en N6). Video: guion nuevo, a la lista.
- **`n7-equilibrio-digital`** (§69.16). Era un cuestionario de cuatro avisos con dos botones (la respuesta en el texto del botón) y tres interruptores con una sola combinación buena; el teléfono era una imagen y la entrada prometía 5 avisos con 4. Ahora «Tecnia Avisos» es un teléfono que se usa: Bienestar digital con los datos de la semana, notificaciones por app y por categoría, una tarde del viernes con reloj que avanza con lo que haces (cinco ejercicios de mate de verdad, avisos que cuestan concentración, Mamá esperando) y Hora de dormir (de fábrica viene de lunes a viernes: la noche que falta es la del domingo). 25 min. Pruebas 13/13. Quinta puerta limpia a 1440 y 400. **B2 cerrada.** Video: guion nuevo, a la lista.
- **B3 · `n7-bucles-python`** (§69.17). Nueve encargos que dictaban la línea y predicados con expresiones regulares sobre ESA línea; ningún bucle dependía de un dato. Ahora, cuatro problemas con juez del entrenamiento (las vueltas, los kilómetros, la meta, la alcancía; 16 casos, 12 ocultos en el 0, el 1 y justo en la meta), el experimento del bucle infinito sin dictar qué quitar, y el cierre del `<=` que pidió un dato de más. El juez gana `repiteElUltimo`. Pruebas 26 + 5. Quinta puerta limpia. Video: guion nuevo, a la lista.
- **B3 · `n7-retos-python`** (§69.18). Dictaba programas enteros (el candado con sus once líneas) y los datos venían en el código. Ahora, tres retos con juez que juntan la unidad —el precio con dos descuentos, aprobados y promedio con el grupo vacío, el candado con dos salidas—, 15 casos (10 ocultos), y un cierre sobre la división entre cero. Pruebas 20 + 4. Quinta puerta limpia. Video: guion nuevo, a la lista.
- **B3 · `n7-variables-y-tipos`** (§69.19). Nueve encargos dictados y los datos con candado para comprobar una salida fija (`print("Tengo 13 años")` aprobaba). Como aquí no hay `input`, **el juez aprende `datos`**: cambia la primera línea `nombre = …` de la celda caso a caso sin mover ninguna. Cuatro exploraciones con la meta dicha y tres problemas (credencial, pizzas, marcador; 12 casos, 9 ocultos). Pruebas 28 + 3. Quinta puerta limpia (cazó el rótulo «lee, en este orden» sobre «nada por teclado»: ahora va por problema). Video: guion nuevo, a la lista.
- **B3 · `n8-listas-y-diccionarios`** (§69.20). Diez encargos dictados y una mochila fija (`mochila[2]` aprobaba igual que `mochila[-1]`). Con `datos` el juez cambia la lista o el diccionario: cinco problemas (extremos, pedido, lo que cuesta, ¿lo tenemos?, agotados; 22 casos, 16 ocultos), la casilla que no existe y un cierre sobre `mochila[len(mochila)]`. El caso que separa es la goma en 0: «¿hay piezas?» en vez de «¿existe?» cae sólo ahí. Pruebas 30 + 3 (la clase no tenía). Quinta puerta limpia. Video: guion nuevo, a la lista.
- **B3 · `n10-python-intermedio`** (§69.21), **con M4 en el motor**. La clase prometía módulos, archivos y librerías y el intérprete no sabía importar ni abrir nada. Ahora sí: `import`/`from`/`with`, módulos del proyecto en pestañas (el error dice el archivo y abre su pestaña), disco con `open` en r/w/a, `math` y `statistics`; 33 programas medidos con CPython 3.14, y de paso tres infidelidades que ya estaban (`sum` sin compensar, `repr`, `print` con `\n`). El juez gana CSV por caso, lo que se escribe y un `principal` oculto que prueba el módulo solo —el que tumba la regla copiada en el principal—. Tres problemas (la semana, clasifica, el reporte; 14 casos, 11 ocultos), 45 min. Pruebas 34 + 5. Quinta puerta limpia a 1440 y 400. **Cazado ahí y de todas las clases de código: a 400 px el editor quedaba en 111 px** (scroll dentro de scroll) → arreglado en `salaCodigo.css`, 376 px. Control: tsc limpio; jest 2648/2648 en 56 suites (dos de tiempo bajo carga, verdes solas). Video: guion nuevo, a la lista.
- **B3 · `n6-primeras-lineas-python`** (§69.22). El arco de §50.2 se queda; se cae cómo se comprobaba: la caja y el `if` venían dictados y se juzgaban con expresiones regulares sobre ESA línea (`print("Mucho gusto, Sofi")` aprobaba y `>= 7` no). **El juez entra en primaria con `datos`**: cambia el nombre de la caja. Dos problemas —el saludo y ¿largo o corto?, 8 casos, 6 ocultos, con la frontera en 6 y 7 letras justas—; «arréglalo» se cumple cuando el juez vuelve a aceptar, no cuando se va la caja roja. 30 min. Pruebas 26 + 10. **Cazado en la quinta puerta**: el botón «Enviar al juez» de «arréglalo» estaba dentro de un `hidden` (jsdom pulsa botones escondidos) → opción `vuelven` en la pieza compartida, y la prueba ahora exige que el botón se vea. Cazado en la captura del error: la pista del motor para un texto sin comillas hablaba de mayúsculas → pista nueva para «todo el lado derecho de una asignación no existe». Quinta puerta limpia a 1440 y 400. Batería de código 2878/2878. **Con esto B3 queda completa: las seis clases.** Video: guion nuevo, a la lista.
