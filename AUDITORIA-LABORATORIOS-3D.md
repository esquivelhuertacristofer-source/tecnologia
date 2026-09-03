# Auditoría de laboratorios — ¿cuáles son 3D de verdad?

**Fecha:** 6 de agosto de 2026 · **Plataforma:** Tecnia · **Cliente:** CEN Campaña Educativa Nacional
**Encargo:** «identifica cuáles [no son 3D] y dame una lista completa así como una propuesta para refactorizarlos».

Este documento responde a las tres observaciones de la revisión, que resultaron ser **una sola avería** vista desde tres ángulos:

1. **«Hay laboratorios que no son 3D.»** — «Por ejemplo todos los de nivel 1 unidad 3, ninguno es 3D.»
2. **«Doble interfaz.»** — «el objeto 3D del fondo que no se mueve y una sobrepantalla o letrero que al rotar la cámara hace que todo se vea muy mal.»
3. **«3D falso.»** — «haces un entorno 3D pero realmente ese 3D no tiene ninguna utilidad porque lo que haces es escribir interfaz sobre esos 3D… no hace ninguna diferencia si fuera 3D o si fuera 2D.»

Y el caso concreto: **`crea tu videojuego` es inutilizable** — «se ve increíble… pero el planteamiento de usabilidad está mal.»

---

## 1. Método

Nada aquí está afirmado de memoria (pauta: *medir, no adivinar*). Cada clasificación sale de leer el archivo o de un conteo sobre el árbol de código:

- Se leyeron íntegros `arcade3d/piezas3d.tsx`, `arcade3d/ArcadeSala3D.tsx`, `arcade3d/EscenaArcade3D.tsx`, `n1/arcade/ArcadeSala.tsx`, `n3/arcade/museoN3.tsx`.
- Se extrajo el mapa de importaciones de **los 60 archivos `Lab*.tsx`** y de los 7 módulos de misión de N1.
- Se contaron, archivo por archivo, los `<Html>`/`<ControlHtml>`, los `<button>` y los manejadores de raycast (`onClick`/`onPointerDown` sobre `<group>`/`<mesh>`).

**Criterio de «3D real» usado:** *el clic del alumno viaja por el raycaster de three y toca una malla*. Si la geometría se puede borrar y el ejercicio sigue funcionando igual, no es 3D: es un decorado.

---

## 2. Veredicto

> De **67 actividades jugables**, sólo **5** son 3D real. **45** tienen escenario 3D que no interviene en la mecánica y **15** no tienen ni una línea de three.js.

| Categoría | Qué significa | Actividades |
|---|---|---:|
| **A · 3D real** | El clic va por raycast a una malla. Girar la cámara no rompe nada. | **5** |
| **B · Mixto (3D real + pantalla de software)** | La geometría captura lo físico; hay DOM sólo donde en la vida real hay una pantalla. Correcto de planteamiento, roto de ejecución. | **2** |
| **C · 3D falso / doble interfaz** | Hay `<Canvas>` y mueble, pero **toda** la mecánica vive en láminas HTML flotantes. | **45** |
| **D · Sin 3D** | No hay `<Canvas>`. Arcade 2D o simulador de software a pantalla completa. | **15** |
| | | **67** |

Las tres quejas caen así:

- «no son 3D» → categoría **D** (15).
- «doble interfaz» y «3D falso» → categoría **C** (45); son el mismo defecto, sólo que se nota más cuando el panel es grande.
- «`crea tu videojuego` inutilizable» → categoría **B**, y por un motivo distinto y peor: es el único laboratorio que obliga al alumno a operar **dos modelos de interacción incompatibles a la vez**.

---

## 3. La causa raíz: una sola decisión, escrita en el código

Está declarada como regla en la cabecera de `src/components/activities/arcade3d/piezas3d.tsx`:

> «Regla de oro del proyecto: los controles con los que el alumno interactúa son **SIEMPRE `<button>` reales del DOM**, montados vía drei `<Html transform={false} center>` en modo BILLBOARD… La geometría (pedestales, objetos, cantos) es three puro y **solo decora/ancla; nunca captura la interacción**.»

La última frase es, literalmente, la definición del defecto que se reportó. Y el motivo por el que se adoptó la regla también está anotado, en `n1/Ordenador3D.tsx`:

> «se probó antes `<Html transform>` (proyección con matriz CSS 3D) y el hit-testing del navegador fallaba de forma consistente sobre el canvas WebGL (confirmado con Playwright: clicks reales, incluso forzados, no llegaban al botón).»

Esa medición era correcta. **La conclusión que se sacó de ella, no.** Ante «el DOM en 3D no recibe clics» la salida elegida fue *sacar la interacción del 3D*, cuando la salida correcta era *no meter la interacción en el DOM*: react-three-fiber tiene raycasting nativo sobre mallas y funciona sin problema en canvas — el propio repositorio lo demuestra en cuatro módulos (§5).

### Cómo se convierte esa decisión en lo que se ve en pantalla

`ControlHtml` —el envoltorio por el que pasa **todo** panel de la plataforma— hace esto:

```tsx
<Html transform={false} center position={position}>…</Html>
```

`transform={false}` significa: drei proyecta la posición del ancla a coordenadas de pantalla y **suelta ahí un `<div>` normal, sin rotar y sin escalar**. Consecuencias medidas, una por queja:

| Síntoma reportado | Mecánica exacta |
|---|---|
| «al rotar la cámara todo se ve muy mal» | El mueble gira con la cámara; el `<div>` no. `RigArcade3D` permite ±0,55 rad de guiñada (**±31,5°**) — exactamente el margen que despega el letrero del mueble en las capturas. |
| «una sobrepantalla que tapa» | El `<Html>` nunca lleva `occlude`, así que se pinta **encima** de toda la geometría, esté delante o detrás. |
| «el 3D no aporta nada» | Por diseño: *«nunca captura la interacción»*. Quitar el `<Canvas>` no cambiaría una sola mecánica en 45 actividades. |
| No se puede acercar la cámara | El zoom está **desactivado a propósito** en `EscenaArcade3D.tsx`, con este comentario: *«los paneles de mecánica son billboards de tamaño fijo en px, así que si el alumno pudiera acercar… el mueble crecería y el panel no»*. Es decir: se sacrificó una capacidad del 3D para tapar el defecto. |

### Tamaño de la avería, en números

| Medición | Valor |
|---|---:|
| Usos de `<Html transform>` (DOM realmente colocado en 3D) en todo el repositorio | **0** |
| Instancias de billboard (`<ControlHtml>` / `<Html>`) | **102** |
| `<button>` del DOM dentro de módulos que sí montan un `<Canvas>` | **339** |
| Actividades afectadas | **60 de 67** (45 de C + 15 de D) |

---

## 4. Inventario completo — las 67 actividades

Leyenda: **A** 3D real · **B** mixto · **C** 3D falso/doble interfaz · **D** sin 3D.

### Nivel 1 — 20 actividades · 5 A · 15 D

| # | Unidad | Actividad | Cat. | Motor |
|---|---|---|:--:|---|
| 1 | U1 Mi primera computadora | Conoce las partes | **A** | `mision/laboratorio.ts` — three.js + `Raycaster` propio |
| 2 | U1 | Dentro del gabinete | **A** | ídem |
| 3 | U1 | Conecta el equipo | **A** | ídem ← *el de los cables* |
| 4 | U1 | Enciende con seguridad | **A** | ídem |
| 5 | U1 | Misión final | **A** | ídem |
| 6 | U2 Mouse y teclado | Explora EduOS | **D** | EduOS — simulador de sistema operativo en DOM, **sin escenario** |
| 7 | U2 | Caza clics | **D** | `ArcadeSala` (CSS puro, cero three.js) |
| 8 | U2 | Laberinto del mouse | **D** | `ArcadeSala` |
| 9 | U2 | Lluvia de letras | **D** | `ArcadeSala` |
| 10 | U2 | Teclas gigantes | **D** | `ArcadeSala` |
| 11 | U2 | Mapa de flechas | **D** | `ArcadeSala` |
| 12 | **U3 Pienso paso a paso** | Ordena los pasos | **D** | `ArcadeSala` |
| 13 | **U3** | Sigue el patrón | **D** | `ArcadeSala` |
| 14 | **U3** | ¿Quién usa qué? | **D** | `ArcadeSala` |
| 15 | U4 Creo con la compu | Utiliza programas | **D** | EduOS, sin escenario |
| 16 | U4 | Pinta con la compu | **D** | `ArcadeSala` |
| 17 | U4 | Guarda tu obra de arte | **D** | `ArcadeSala` |
| 18 | U5 Uso seguro y saludable | El semáforo de la pantalla | **D** | `ArcadeSala` |
| 19 | U5 | Pido ayuda a un adulto | **D** | `ArcadeSala` |
| 20 | U5 | Mis datos son un tesoro | **D** | `ArcadeSala` |

> **Confirmado el señalamiento:** las **tres** actividades de N1·U3 son 2D. Pero el alcance real es mayor: **U2, U3, U4 y U5 completas** — 15 de las 20 actividades del nivel. Las únicas 3D del nivel son las 5 de U1, y son además **las únicas 3D reales de toda la plataforma**.

### Nivel 2 — 17 actividades · 17 C

Todas montan `ArcadeSala3D` (mueble + luz + bloom) y ponen la mecánica en billboards. Dos subtipos por gravedad:

**C1 · Panel único (`PanelBastidor3D`) — la mecánica entera en UNA lámina delante del mueble.** Es el caso más visible de doble interfaz.

| # | Unidad | Actividad |
|---|---|---|
| 21 | U1 Dispositivos a mi alrededor | ¿Entrada o salida? |
| 22 | U1 | ¿Dónde viven mis archivos? |
| 23 | U3 Ventanas, archivos y carpetas | Abre y cierra ventanas |
| 24 | U3 | Guarda y encuentra tu trabajo |
| 25 | U4 Algoritmos con juegos | El laberinto de bloques |
| 26 | U4 | Caza el error |
| 27 | U4 | ¡Repite, repite! (bucles) |
| 28 | U5 Escribo y dibujo | Mis primeras oraciones |
| 29 | U5 | Mi cuento ilustrado |

**C2 · Controles en billboard (`PedestalBoton3D` / `RejillaTiles3D` / `ObjetoFlotante3D`).** El mueble sí sostiene los controles, pero la cara de cada control es HTML.

| # | Unidad | Actividad | Nota |
|---|---|---|---|
| 30 | U1 | Safari de dispositivos | |
| 31 | U2 Teclado y mecanografía | Explora tu teclado | |
| 32 | U2 | Mayúsculas y acentos | |
| 33 | U2 | Escribe a dos manos | |
| 34 | U5 | Viste tus letras | |
| 35 | U6 Ciudadanía digital | ¿Secreto o público? | **← la captura de las pastillas y la ficha «Tu dirección»** |
| 36 | U6 | ¿Con quién sí hablo en línea? | |
| 37 | U6 | Héroes del respeto | |

> La ficha flotante de las capturas es `ObjetoFlotante3D`: una caja 3D de 1,1 × 0,72 con un `<Html>` encima que lleva el emoji y el nombre. Por eso la palabra «Mouse» o «Tu dirección» se queda derecha mientras la caja gira.

### Nivel 3 — 19 actividades · 19 C

Mobiliario propio y bien construido por unidad (`piezasN3U1`…`U6`), pero el mismo patrón. Además, las tres primitivas de arrastre de N3 —`FichaTomable3D`, `ZonaSoltar3D`— **no son 3D pese al nombre**: son un `<button draggable>` y un `<div onDrop>` corrientes.

| # | Unidad | Actividad | Mueble |
|---|---|---|---|
| 38–40 | U1 Historia de la computación | Viaje en el tiempo tecnológico · Las generaciones de las compus · Conoce a los inventores | `piezasN3U1` |
| 41–43 | U2 Hardware y software | ¿Hardware o software? · Explora el escritorio · Carpetas y atajos | `piezasN3U2` |
| 44–47 | U3 Internet seguro | ¿Qué es internet? · Busca con palabras clave · Detector de sitios confiables · Netiqueta y contraseñas | `piezasN3U3` |
| 48–50 | U4 Bloques 1 · Scratch | Conoce Scratch · Eventos y movimiento · Mi primera animación | `piezasN3U4` |
| 51–53 | U5 Procesador de textos 1 | Dale formato · Ortografía e imágenes · La fila guía | `piezasN3U5` |
| 54–56 | U6 La IA a mi alrededor | La IA en mi día · ¿Piensan las máquinas? · La IA se equivoca | `piezasN3U6` |

> Las cabeceras de `piezasN3U3`…`U6` documentan el problema sin nombrarlo: *«los paneles `<Html>` de drei son capas del DOM y su caja se traga los clics»* — de ahí la «regla de reparto» que obliga a repartir el ejercicio entre paneles que no se solapen. Es un sistema entero de reglas construido para convivir con la avería.

### Nivel 4 — 10 actividades · 8 C · 2 B

| # | Unidad | Actividad | Cat. | Mueble |
|---|---|---|:--:|---|
| 57 | U1 ¿Cómo funciona internet? | El viaje de un mensaje | **C** | `piezasN4U1` |
| 58 | U1 | Busca y compara fuentes | **C** | `piezasN4U1` |
| 59 | U1 | ¿Qué es la nube? | **C** | `piezasN4U1` |
| 60 | U2 Correo y comunicación | Mi primera cuenta (supervisada) | **C** | `piezasN4U2` |
| 61 | U2 | Las partes del correo | **C** | `piezasN4U2` |
| 62 | U2 | Envía, responde y adjunta | **C** | `piezasN4U2` |
| 63 | U2 | **Videollamadas con respeto** | **B** | `piezasN4U2Cabina` — **raycast real** en 3 grupos + pantalla «Tecnia Reunión» en DOM |
| 64 | U3 Bloques 2 | Si pasa esto… (condicionales) | **C** | `piezasN4U3` |
| 65 | U3 | Variables y puntajes | **C** | `piezasN4U3` |
| 66 | U3 | **Crea tu videojuego** | **B** | `piezasN4U3` (panel HTML) **+** `piezasN4U3Caja` (raycast real) |

### Nivel 7 — 1 actividad · 1 C

| # | Unidad | Actividad | Cat. | Mueble |
|---|---|---|:--:|---|
| 67 | U1 Arquitectura y sistemas | Dentro del gabinete | **C** | `bahiaN7` + `piezasN7U1`; `PiezaTomable3D` es un `<button draggable>` |

### El caso `crea tu videojuego` — por qué es inutilizable y no sólo feo

Es el único laboratorio que **mezcla los dos modelos de interacción en la misma pantalla y al mismo tiempo**:

- a la izquierda, `EstacionBloques3D` (de `piezasN4U3`): se programa con `<button>` del DOM en una lámina que no rota;
- a la derecha, `CajaJuego3D` / `MandosFlecha3D` (de `piezasN4U3Caja`): se juega con **raycast real** sobre mallas, que sí rotan.

El alumno tiene que aprender dos gramáticas de clic a la vez, y en cuanto orbita la cámara —cosa que el lado derecho invita a hacer— el lado izquierdo se le despega. No es un problema estético: el ejercicio pide dos actividades distintas (programar y probar) presentadas como si fueran una sola.

---

## 5. Lo bueno: el patrón correcto ya existe en este repositorio

No hay que inventar nada ni traer dependencias. Cuatro módulos —los más recientes— ya hacen lo que hay que generalizar:

| Módulo | Qué demuestra |
|---|---|
| `n1/mision/laboratorio.ts` | three.js con `Raycaster` propio: las 5 actividades de N1·U1, las únicas 3D reales. |
| `n4/estudio/piezasN4U2Cabina.tsx` | Raycast de r3f sobre `<group onClick>` — el micrófono, la cámara y la lámpara de la cabina se tocan como objetos. |
| `n4/estudio/piezasN4U3Caja.tsx` | `onPointerDown` sobre mallas + **`CanvasTexture`**: el texto va *pintado en la textura del objeto*, no en un `<div>` encima. |
| `n4/estudio/piezasN4U3.tsx` | La misma técnica de `CanvasTexture` para la pantalla del monitor. |

Es decir: **las dos mitades de la solución —raycast para el clic y textura para el texto— ya están escritas y funcionando en producción.** Lo que falta es convertirlas en el contrato común y retirar `ControlHtml`.

---

## 6. Propuesta de refactor

### 6.1 Sustituir `ControlHtml` por un contrato de pieza tocable

Se añade a `arcade3d/` un módulo `piezasTocables.tsx` con tres primitivas, y `piezas3d.tsx` queda marcado como obsoleto:

```tsx
// El clic viaja por el raycaster de three: la malla ES el control.
<Tocable3D id="mouse" etiqueta="Mouse" estado={estado} onActivar={elegir}>
  <RoundedBox …/>          {/* la geometría de verdad del objeto */}
</Tocable3D>

// Texto pintado en la superficie, no flotando encima.
<Rotulo3D texto="Tu dirección" ancho={1.1} sobre="cara-frontal" />

// Zona de soltar con raycast: se arrastra un objeto 3D sobre otro objeto 3D.
<Receptor3D id="privado" onSoltar={colocar} />
```

Detalles que trae cada una:

- **`Tocable3D`** — `onPointerDown` sobre el `<group>`, `onPointerOver`/`Out` para cambiar el cursor y subir el `emissiveIntensity` (efecto de foco real, con luz, no un borde CSS), y `stopPropagation` para que la pieza de delante gane a la de detrás. Se acabó la «regla de reparto» de N3: el raycaster ya resuelve el orden por profundidad, que es justo lo que las cajas del DOM no sabían hacer.
- **`Rotulo3D`** — genera un `CanvasTexture` (misma técnica que `piezasN4U3Caja.tsx`) y lo aplica a la cara del objeto. El texto gira con el mueble, se ilumina con la escena y se ocluye solo. **Aquí desaparecen los letreros flotantes de las capturas.**
- **`Receptor3D`** — arrastre con raycast contra un plano de trabajo, sustituyendo `FichaTomable3D`/`ZonaSoltar3D` en N3 y `PiezaTomable3D` en N7.

### 6.2 Cómo se conserva la accesibilidad (el motivo original de la regla)

El argumento que justificaba los `<button>` del DOM era válido: teclado, foco y lector de pantalla. No se pierde:

- Cada `Tocable3D` se **registra en un contexto** y `ArcadeSala3D` pinta, fuera del `<canvas>`, una lista `<ul>` visualmente oculta con un `<button aria-label>` por pieza. El tabulador recorre las piezas, Enter las activa, el lector de pantalla las lee.
- La misma lista es la que ya consumen las **587 pruebas de Jest**, porque en jsdom no hay WebGL y `ArcadeSala3D` cae al `respaldo` HTML. **El refactor no debería tocar ni una prueba**; ese es el criterio de aceptación técnico.

### 6.3 Qué hacer con las pantallas de software (pauta ultra-LITE)

Hay pantallas que **deben** ser DOM: EduOS, Tecnia Correo, Tecnia Bloques, Tecnia Reunión. Ahí se escribe, se selecciona texto, se navega. Convertirlas a textura sería absurdo y rompería la pauta de simuladores.

Para ellas no se cambia la tecnología, se cambia **la cámara**: se introduce el **modo consola**.

- **De pie (cámara libre):** se orbita la sala, las piezas físicas son `Tocable3D`, la pantalla del monitor muestra su contenido *pintado en textura* (una imagen fiel, no interactiva).
- **Sentado (cámara fija):** al tocar el monitor, la cámara vuela a un plano frontal exacto y **se bloquea la órbita**. Ahí, y sólo ahí, se monta el `<Html>` sobre la pantalla. Como la cámara no se mueve, el panel **no puede despegarse**: el defecto es imposible por construcción, sin pelearse con el fallo de hit-testing ya medido en `Ordenador3D.tsx`.
- Un gesto claro para levantarse (botón físico en el mueble, tecla Esc).

Esto además **arregla `crea tu videojuego`**: deja de ser una pantalla con dos gramáticas y pasa a ser un ciclo de dos estados explícitos —**PROGRAMAR** sentado frente a Tecnia Bloques, **PROBAR** de pie con la caja del juego en 3D real— que es exactamente cómo funciona la robótica educativa y lo que el ejercicio quería enseñar desde el principio.

### 6.4 Los 15 laboratorios sin 3D

No basta con «meterlos en un canvas»: hay que decidir, uno por uno, qué gana el ejercicio al ser un objeto. Tres destinos:

- **Reformular a 3D real** (11 de los 13 de arcade): *Ordena los pasos* pasa a ser una cinta con fichas físicas que se colocan en un riel; *Sigue el patrón*, una hilera de piezas que se giran; *Mapa de flechas*, un mando con teclas que se hunden. En todos, el 3D aporta lo mismo: **manipular en lugar de señalar**.
- **Montar sobre pantalla en modo consola** (2 + 2): *Pinta con la compu* y *Guarda tu obra* son software → van dentro de la pantalla de un equipo 3D, igual que *Explora EduOS* y *Utiliza programas*. Así cumplen las dos pautas a la vez: siguen siendo simuladores fieles y dejan de vivir en el vacío.
- **Revisar el planteamiento pedagógico primero** (*Mis datos son un tesoro*, *Pido ayuda a un adulto*): son ejercicios de decisión, no de manipulación. Antes de forzar geometría hay que decidir qué objeto real toca el alumno; si no lo hay, el ejercicio está mal formulado y se rehace, no se decora.

### 6.5 La página educativa junto al simulador

El encargo separado —«en cuanto le den a entrar laboratorio que los reciba esa página nueva y el simulador 3D a la vez», con calidad de la landing e imágenes reales, piloto en *Conecta el equipo*— **encaja con este refactor y debe hacerse en la misma pasada**, porque toca la misma pantalla. Al reformular cada laboratorio se define su página de acompañamiento. La visual de la entrada no se toca en ningún caso.

---

## 7. Plan de trabajo

Se respeta la regla vigente: **una actividad a la vez y no se avanza hasta terminarla.** El orden está pensado para que cada lote deje algo mostrable y para que el trabajo de infraestructura se amortice cuanto antes.

| Lote | Contenido | Actividades | Por qué va aquí |
|---:|---|---:|---|
| **0** | `piezasTocables.tsx` (`Tocable3D`, `Rotulo3D`, `Receptor3D`) + capa de accesibilidad + **modo consola** + reactivar el zoom en `EscenaArcade3D` | — | Es el cimiento; sin él cada lote reinventaría el patrón. |
| **1** | **`crea tu videojuego`** rehecho como ciclo PROGRAMAR / PROBAR | 1 | Es el que está declarado inutilizable y el que valida el modo consola. |
| **2** | **N1·U1 «Conecta el equipo»**: página educativa + simulador, y corrección de las geometrías de colores por objetos reconocibles | 1 | Es el piloto ya pedido y ya tiene 3D real: sólo sube de calidad. |
| **3** | **N1·U3 completa** (Ordena los pasos, Sigue el patrón, ¿Quién usa qué?) | 3 | Es el ejemplo que se señaló explícitamente. |
| **4** | Resto de N1 sin 3D: U2 (5), U4 (3), U5 (3) | 11 | Cierra el nivel de entrada, el que más alumnos verán. |
| **5** | **N2 C1** — los 9 de panel único | 9 | Es el caso más aparatoso de doble interfaz. |
| **6** | **N2 C2** — los 8 de controles en billboard, empezando por *¿Secreto o público?* | 8 | Están en las capturas. |
| **7** | **N3** por unidades, U1→U6 | 19 | El más grande; ya tiene mueble bueno, sólo cambia quién captura el clic. |
| **8** | **N4** C (8) + revisión de *Videollamadas* | 9 | Parte ya está bien; es el lote más barato. |
| **9** | **N7 Dentro del gabinete** | 1 | Cierra con la actividad de demostración. |

**Criterios de aceptación, iguales para toda actividad refactorizada:**

1. Girar la cámara de tope a tope (±31,5°) sin que ningún elemento se despegue del mueble ni tape geometría que debería estar delante. **Verificado con captura, no de palabra.**
2. Todo control responde al raycast; ningún `<button>` del DOM fuera del modo consola.
3. Todo texto de escena va en textura o en geometría.
4. Tabulador + Enter + lector de pantalla siguen recorriendo el ejercicio completo.
5. `tsc` limpio y **587/587 pruebas verdes sin modificar ninguna**.
6. Zoom reactivado y usable.

**Estimación honesta:** el lote 0 es el más delicado (es un contrato nuevo). Los lotes 5–7, que son 36 actividades, deberían acelerar mucho una vez el contrato esté probado, porque el mobiliario 3D ya está construido y bien hecho — lo que cambia es de dónde cuelga el clic, no la escena.

---

## 8. Lo que este refactor NO toca

- **Las pantallas de entrada.** La plantilla de oro (video, stats, letreros, fichas, CTA, ruta, act-nav) se queda exactamente como está en las 67 actividades. La instrucción fue explícita: «no cambies nada de la visual inicial de ese ejercicio».
- **El contenido pedagógico** ni los textos de las actividades, salvo en los dos casos de §6.4 donde el ejercicio está mal formulado de origen y se dirá antes de tocarlo.
- **Los muebles 3D de N3 y N4**, que están bien construidos y se conservan íntegros.
- **La campaña de robustecimiento de videos**, congelada en 8 de 60 por indicación expresa.
