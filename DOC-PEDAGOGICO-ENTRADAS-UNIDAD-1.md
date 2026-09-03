# Documento pedagógico — Entradas de la Unidad 1 «Mi primera computadora»

**Alcance:** las 4 entradas restantes de la unidad, replicando elemento por elemento la
plantilla de oro aprobada (`EntradaConoceLasPartes.tsx`): *Dentro del gabinete*,
*Conecta el equipo*, *Enciende con seguridad* y *Misión final*. Cada una con su propio
video Remotion narrado, sus propias fichas con ilustraciones nuevas (ComfyUI · krea2,
único flujo autorizado) y su propio acceso al laboratorio 3D (mismo juego, distinto
`moduloInicial`).

**Regla de fidelidad:** todo texto que ya existe en `src/components/activities/n1/mision/datos.ts`
se usa **verbatim** (port fiel). Los textos nuevos de este documento (globos de Bit,
letreros, narración de video, detalles de fichas donde el juego no tiene descripción)
son copy pedagógico nuevo de la entrada, definido aquí antes de construir.

**Plantilla de oro (los 9 elementos, iguales en las 4 entradas):**
1. Host: act-hero con H1 gigante + act-nav (automáticos, ya construidos).
2. Escenario navy `.hero.escenario-bit`: Bit + globo, video con poster real 16:9,
   cubrepantalla «Inicia tu aventura».
3. `.stats-strip` de 3 columnas.
4. Letrero `<h2 class="entrada-titulo">` a escala H1 con `camino-grad` en el primero.
5. Grid de fichas `.ficha-parte` color pleno (contenido port fiel).
6. `.laboratorio-cta` gigante → `moduloInicial` propio.
7. «Tu ruta en esta unidad» con la parada actual marcada.
8. Fondo `.entrada-lienzo`.
9. Contrato: `onProgress(0)` + `onScore(100)` al montar; `useSfx` `pop` en interacciones.

**Estilo canónico de ilustración (derivado de las imágenes ya aprobadas):**
plastilina claymation mate, formas regordetas y redondeadas, fondo teal-navy profundo
con orbes bokeh cian/ámbar, luz suave de estudio, acabado tipo corto de Pixar/Blender.

Prompt base (todas las imágenes, krea2, 1024×1024, 8 pasos, cfg 1, `er_sde`, sin negativo):

> Hand-sculpted soft claymation style 3D render, matte plasticine textures, plump
> rounded shapes with smoothed edges, deep teal-navy studio background with soft
> glowing bokeh orbs in cyan and warm amber floating around, gentle wraparound studio
> lighting with a soft shadow beneath, polished like a Pixar or Blender short film,
> friendly children's educational illustration. No text, no letters, no watermark,
> no logos. — **[SUJETO]**

Bit (cuando aparece): *a small friendly white clay robot mascot with a rounded body,
dark visor face with glowing cyan oval eyes and a smiling mouth, and a little ball
antenna on top*.

---

## 1. Dentro del gabinete (`n1-dentro-del-gabinete`, `moduloInicial={1}`)

**Objetivo pedagógico:** que el alumno reconozca los 6 componentes internos y su
función antes de buscarlos en el gabinete 3D abierto.

- **Globo de Bit:** «¡Hola! Soy Bit. Mira el video y luego abre el gabinete conmigo
  para descubrir qué hay adentro.»
- **Cubrepantalla:** «Inicia tu aventura» / «Bit te espera para mirar dentro del gabinete».
- **Stats:** Componentes = 6 (`SECUENCIA_INTERNA.length`, azul) · Duración = 8 min
  (meta del registro, cielo) · Guardado = Automático (púrpura).
- **Letrero fichas:** tag «Antes de empezar» + H1 arcoíris «Estos son los componentes
  que vas a descubrir».
- **CTA:** «3D» / 🔬 / «Siguiente paso» / «Entra al laboratorio 3D» / «Abre el gabinete
  junto con Bit».
- **Ruta:** actual = parada 2; siguiente en color = parada 3.

**Fichas (6, grid 2/3 col):** datos verbatim de `SECUENCIA_INTERNA`; tag verbatim
`TEXTOS['tag-componente-interno']` = «COMPONENTE INTERNO».

| # | key | Título (verbatim) | Detalle (verbatim) | Acento |
|---|---|---|---|---|
| 1 | motherboard | Tarjeta madre | Conecta las piezas y permite que trabajen juntas. | verde `#17b26a/#0e7a45` |
| 2 | cpu | Procesador | Es como el cerebro: interpreta instrucciones y realiza operaciones. | azul `var(--blue)/var(--blue-deep)` |
| 3 | ram | Memoria RAM | Es el espacio de trabajo temporal de los programas abiertos. | ámbar `#ffab00/#e07800` |
| 4 | ssd | Almacenamiento SSD | Guarda programas, documentos, imágenes y otros archivos. | cian `#00b8d9/#00789b` |
| 5 | psu | Fuente de poder | Convierte y distribuye energía a los componentes internos. | naranja `#ff7a1a/#d95800` |
| 6 | fan | Ventilador | Ayuda a mantener una temperatura adecuada dentro del gabinete. | púrpura `#8b5cf6/#5b21b6` |

**Ilustraciones nuevas (7):** `titulo` (Bit junto a un gabinete de plastilina abierto
mostrando piezas de colores adentro), `tarjeta-madre` (placa de plastilina con
circuitos que brillan en cian), `procesador` (chip cuadrado de plastilina con
patitas doradas y núcleo brillante), `ram` (barra de memoria de plastilina con
chips de colores), `ssd` (unidad SSD de plastilina compacta con lucecita cian),
`fuente` (caja de fuente de poder de plastilina con cable y rejilla), `ventilador`
(ventilador redondo de plastilina con aspas suaves y brillo cian).

**Guion del video (9 escenas, patrón `timelinePartes`):**

| Escena | Imagen | Narración de Bit (= subtítulo del globo) |
|---|---|---|
| titulo (2.5s) | titulo | — («Dentro del gabinete» / «Tecnia · Nivel 1 · Mi primera computadora») |
| bienvenida | titulo | «¡Hola otra vez! Soy Bit. Hoy vamos a abrir el gabinete con mucho cuidado, para conocer las piezas que viven adentro. ¿Me acompañas?» |
| tarjeta-madre | tarjeta-madre | «Esta es la Tarjeta madre. Es como una gran ciudad donde todas las piezas se conectan y trabajan juntas.» |
| procesador | procesador | «Este pequeñito es el Procesador. Es el cerebro de la computadora: piensa y resuelve todo muy rápido.» |
| ram | ram | «Esta es la Memoria RAM. Es la mesa de trabajo donde la computadora pone lo que está usando en ese momento.» |
| ssd | ssd | «Este es el Almacenamiento SSD. Aquí se guardan tus juegos, tus dibujos y tus documentos.» |
| fuente | fuente | «Esta caja es la Fuente de poder. Convierte la electricidad y la reparte a todas las piezas.» |
| ventilador | ventilador | «Y este es el Ventilador. Da aire fresco para que nada se caliente demasiado.» (cara 🎉) |
| cierre (3s) | bit-cierre-exito | — («Ya conoces el gabinete por dentro» / pastilla ámbar «Toca el botón para explorarlo en 3D») |

---

## 2. Conecta el equipo (`n1-conecta-el-equipo`, `moduloInicial={2}`)

**Objetivo pedagógico:** que el alumno asocie cada cable con su dispositivo y su
puerto, apoyándose en el código de color educativo del juego («Los colores ayudan a
distinguirlo»).

- **Globo de Bit:** «¡Hola! Soy Bit. Mira el video y luego conecta conmigo cada cable
  en su puerto correcto.»
- **Cubrepantalla:** «Inicia tu aventura» / «Bit te espera para conectar el equipo».
- **Stats:** Cables = 4 (`SECUENCIA_CONEXIONES.length`, azul) · Duración = 10 min
  (cielo) · Guardado = Automático (púrpura).
- **Letrero fichas:** «Estos son los cables que vas a conectar».
- **CTA:** detalle «Conecta cada cable junto con Bit».
- **Ruta:** actual = parada 3; siguiente en color = parada 4.

**Fichas (4, grid 2 col):** tag «CONEXIÓN» (etiqueta nueva de entrada; el juego no
tiene tag para cables). **El acento de cada ficha es el color educativo verbatim del
cable en `SECUENCIA_CONEXIONES`** — continuidad directa con la mecánica. Los detalles
son copy nuevo (el juego no describe cables); el dispositivo destino citado es el
verbatim de `TEXTOS['dispositivo-cable-*']`.

| # | cable | Título | Detalle (nuevo) | Acento (color del juego) |
|---|---|---|---|---|
| 1 | cable-video | Cable de video | Lleva las imágenes desde el gabinete hasta el monitor. | `#56b8ff` / deep `#1e63c4` |
| 2 | cable-keyboard | Cable del teclado | Une el teclado con el gabinete para que puedas escribir. | `#62e6a5` / deep `#1e8a5a` |
| 3 | cable-mouse | Cable del ratón | Conecta el ratón para mover el puntero por la pantalla. | `#ffd25a` / deep `#d99a00` |
| 4 | cable-power | Cable de corriente | Le da energía eléctrica al gabinete para que todo funcione. | `#ff7183` / deep `#d63a52` |

**Ilustraciones nuevas (5):** `titulo` (Bit sosteniendo un manojo de cables de
plastilina azul, verde, amarillo y rojo), `cable-video` (cable azul de plastilina con
conector ancho apuntando a un puerto azul brillante), `cable-teclado` (cable verde con
un teclado pequeñito de plastilina), `cable-mouse` (cable amarillo con un ratón de
plastilina), `cable-corriente` (cable rojo con clavija de plastilina y chispitas
suaves de energía).

**Guion del video (7 escenas):**

| Escena | Imagen | Narración de Bit |
|---|---|---|
| titulo (2.5s) | titulo | — («Conecta el equipo») |
| bienvenida | titulo | «¡Hola otra vez! Soy Bit. Hoy vamos a conectar la computadora. Cada cable tiene su puerto especial, y los colores nos van a ayudar. ¿Empezamos?» |
| video | cable-video | «Este es el cable de video. Lleva las imágenes desde el gabinete hasta el monitor. Búscalo en color azul.» |
| teclado | cable-teclado | «Este es el cable del teclado. Con él, todo lo que escribes llega a la computadora. Es el de color verde.» |
| mouse | cable-mouse | «Este es el cable del ratón. Gracias a él movemos el puntero por la pantalla. Es el de color amarillo.» |
| corriente | cable-corriente | «Y este es el cable de corriente. Le da energía a todo el equipo. Es el de color rojo. ¡Con mucho cuidado!» (cara 🎉) |
| cierre (3s) | bit-cierre-exito | — («Ya conoces los cables» / «Toca el botón para conectarlos en 3D») |

---

## 3. Enciende con seguridad (`n1-enciende-con-seguridad`, `moduloInicial={3}`)

**Objetivo pedagógico:** memorizar el orden seguro de encendido
(regulador → monitor → gabinete, una sola pulsación).

- **Globo de Bit:** «¡Hola! Soy Bit. Mira el video y luego enciende el equipo conmigo,
  paso por paso.»
- **Cubrepantalla:** «Inicia tu aventura» / «Bit te espera para encender el equipo».
- **Stats:** Pasos = 3 (`SECUENCIA_ENCENDIDO.length`, azul) · Duración = 8 min (cielo)
  · Guardado = Automático (púrpura).
- **Letrero fichas:** «Este es el orden para encender tu equipo».
- **CTA:** detalle «Enciende el equipo junto con Bit».
- **Ruta:** actual = parada 4; siguiente en color = parada 5.

**Fichas (3, grid 1/3 col):** tag «PASO» (el número de la ficha ya marca el orden).
Detalle **verbatim** = `mensaje` de `SECUENCIA_ENCENDIDO`. Acentos consistentes con
la identidad de cada aparato en «Conoce las partes».

| # | key | Título | Detalle (verbatim) | Acento |
|---|---|---|---|---|
| 1 | power-regulator | Regulador | Primero enciende el regulador. | púrpura `#8b5cf6/#5b21b6` |
| 2 | power-monitor | Monitor | Ahora enciende el monitor. | azul `var(--blue)/var(--blue-deep)` |
| 3 | power-tower | Gabinete | Presiona una sola vez el botón del gabinete. | naranja `#ff7a1a/#d95800` |

**Ilustraciones nuevas (4):** `titulo` (Bit con el dedo sobre un gran botón de
encendido redondo que brilla en cian), `regulador` (regulador/barra de contactos de
plastilina con botón encendido brillante), `monitor` (monitor de plastilina
despertando con la pantalla iluminándose), `gabinete-boton` (gabinete de plastilina
con botón redondo brillante y la manita de Bit presionándolo).

**Guion del video (6 escenas):**

| Escena | Imagen | Narración de Bit |
|---|---|---|
| titulo (2.5s) | titulo | — («Enciende con seguridad») |
| bienvenida | titulo | «¡Hola otra vez! Soy Bit. Encender una computadora tiene su secreto: hay un orden seguro. Te lo enseño en tres pasos.» |
| regulador | regulador | «Paso uno: enciende el regulador. Él recibe la electricidad primero y protege a todo el equipo.» |
| monitor | monitor | «Paso dos: enciende el monitor. Así verás todo lo que pasa desde el principio.» |
| gabinete | gabinete-boton | «Paso tres: presiona una sola vez el botón del gabinete. Solo una vez, y la computadora despierta.» (cara 🎉) |
| cierre (3s) | bit-cierre-exito | — («Ya sabes encender con seguridad» / «Toca el botón para practicarlo en 3D») |

---

## 4. Misión final (`n1-mision-final`, `moduloInicial={6}`)

**Objetivo pedagógico:** presentar la evaluación como una misión de 4 retos con 10
objetivos, anticipando que las pistas son limitadas (3) y nombrando la insignia meta.

- **Globo de Bit:** «¡Hola! Soy Bit. Llegó tu misión final. Mira el video y luego
  demuestra todo lo que aprendiste.»
- **Cubrepantalla:** «Inicia tu aventura» / «Bit te espera para tu misión final».
- **Stats (port fiel):** Retos = 10 (`MODULOS[6].total`, azul) · Pistas = 3 (del
  saludo «Tendrás tres pistas disponibles», cielo) · Guardado = Automático (púrpura).
- **Letrero fichas:** «Estos son los retos de tu misión final».
- **CTA:** detalle «Demuestra lo aprendido junto con Bit».
- **Ruta:** actual = parada 5 (última; no hay «siguiente» en color).

**Fichas (4, grid 2 col):** tag **verbatim** `TEXTOS['tarjeta-evaluacion']` =
«EVALUACIÓN». Cada detalle es la concatenación **verbatim, sin alterar**, de los
objetivos `final-objetivo-*` que cubre el reto (títulos = copy nuevo de agrupación).

| # | Reto (título nuevo) | Detalle (objetivos verbatim) | Acento |
|---|---|---|---|
| 1 | Identifica las partes | Selecciona el monitor. Selecciona el teclado. Selecciona el ratón. | azul `var(--blue)/var(--blue-deep)` |
| 2 | Conecta el video | Conecta el cable de video. | ámbar `#ffab00/#e07800` |
| 3 | Enciende en orden | Enciende el regulador. Enciende el monitor. Enciende el gabinete. | púrpura `#8b5cf6/#5b21b6` |
| 4 | Crea en EduOS | Abre Texto Fácil. Escribe una frase. Guarda el documento. | verde `#17b26a/#0e7a45` |

**Ilustraciones nuevas (5):** `titulo` (Bit celebrando con un trofeo dorado de
plastilina), `reto-identifica` (Bit señalando un escritorio con monitor, teclado y
ratón de plastilina), `reto-conecta` (conector azul de plastilina entrando a su
puerto con brillo), `reto-enciende` (botón de encendido gigante brillando con
lucecitas despertando alrededor), `reto-eduos` (Bit tecleando feliz en una
computadora de plastilina con la pantalla encendida y brillante).

**Guion del video (7 escenas):**

| Escena | Imagen | Narración de Bit |
|---|---|---|
| titulo (2.5s) | titulo | — («Misión final») |
| bienvenida | titulo | «¡Hola otra vez! Soy Bit. Llegó el gran día: la misión final. Vas a demostrar todo lo que aprendiste, casi sin mi ayuda. ¡Tú puedes!» |
| identifica | reto-identifica | «Primero, identifica las partes: el monitor, el teclado y el ratón. Ya las conoces muy bien.» |
| conecta | reto-conecta | «Después, conecta el cable de video en su puerto. Recuerda: los colores te ayudan.» |
| enciende | reto-enciende | «Luego, enciende todo en orden seguro: primero el regulador, después el monitor y al final el gabinete.» |
| eduos | reto-eduos | «Y para terminar, entra a EduOS: abre Texto Fácil, escribe una frase y guárdala. ¡Como todo un experto!» (cara 🎉) |
| cierre (3s) | bit-cierre-exito | — («Estás listo para tu misión» / pastilla ámbar «Gana la insignia: Técnico principiante») |

---

## 5. Producción (pipelines aprobados)

1. **Ilustraciones — ComfyUI · krea2 (único flujo autorizado):** API local `:8188`,
   grafo del `Flujo KREA2.json` con los bypass respetados (UNET
   `krea2TurboOfficialComfy_krea2TurboFp8` + CLIP `qwen3vl_4b_fp8_scaled` + VAE
   `qwen_image_vae`, 8 pasos, cfg 1, `er_sde`/`simple`, negativo = ConditioningZeroOut,
   sin LoRA, sin upscale), 1024×1024. Destinos: `video-explicativo/public/<slug>/…`
   y copias `ficha-*.png` en `public/assets/actividades/<id>/`.
2. **Narración — Coqui XTTS-v2, voz «Alison Dietlinde», gate F0** (`voz_util.generar_estable`,
   `C:\tts-venv\Scripts\python.exe`): script único
   `scripts/generar-narracion-unidad1.py` → WAVs en `public/audio/{gabinete,conexiones,encendido,final}/`,
   imprime duraciones reales para pegarlas en cada timeline.
3. **Video — Remotion 1280×720\@30:** por actividad `timelineX.ts` (patrón
   `timelinePartes`, GAP 0.5s) + `EscenasX.tsx` (reutilizando una base común de
   Fondo/Bit/EscenaParte con la estética ya aprobada) + composición en `Root.tsx`.
   Render MP4 → `public/assets/actividades/<id>/video-explicativo.mp4`; poster =
   `remotion still` de la escena de título → `portada.png`.
4. **Entradas:** 4 componentes `EntradaX.tsx` clonando la estructura del canon con los
   contenidos de este documento; `entradas.tsx` pasa a montar cada entrada (el
   `moduloInicial` se conserva en la fase `simulacion`).
