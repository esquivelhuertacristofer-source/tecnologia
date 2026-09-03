# Página educativa junto al simulador — N1 · U1 · «Conecta el equipo»

**Fecha:** 7 de agosto de 2026
**Actividad:** `n1-conecta-el-equipo` (Nivel 1, Unidad 1, parada 3 de 5)
**Encargo del cliente (Cristofer, 6-ago-2026), literal:**

> «hay practicas como la de conectar los cables en las que literal son geometrias
> de colores, eso no tiene ningun valor pedagogico… viste lo que hiciste en el
> hero? …quiero que hagas eso dentro de ese tipo de ejercicios pero obvio en
> lugar de ser el hero o la landing es una pagina sobre el tema, con imagenes
> reales, visual, tan bien ordenado como lo que hiciste con la landing, es pagina
> educativa sobre el tema en cuestion, vamos a tomar este ejercicio de la unidad
> 1 de conectar los cables, osea **no cambies nada de la visual inicial de ese
> ejercicio**, pero en cuanto le den a entrar laboratorio que los reciba esa
> pagina nueva y el simulador 3d **a la vez**.»

Este documento se escribe **antes** de tocar código, según la pauta «documento
antes que código». Lo que aquí se decide es lo que después se transcribe.

---

## 1. El problema que resuelve

El simulador de «Conecta el equipo» enseña una secuencia motriz correcta —tomar
el cable, llevarlo a su puerto— pero enseña esa secuencia sobre **geometrías de
colores**. El alumno aprende que «el prisma azul va en la ranura azul» y sale sin
haber visto nunca un conector VGA de verdad. El día que se siente frente a una
computadora real, no reconoce nada.

La página educativa cierra ese hueco: pone **la fotografía del objeto real** al
lado de la práctica, en el mismo momento, sin que el alumno tenga que salir del
laboratorio ni recordar algo que vio hace tres pantallas.

**No es un manual previo.** Es una referencia abierta mientras se practica —como
el póster que cuelga en la pared del taller.

---

## 2. Qué NO se toca

La pantalla de entrada de la actividad (`EntradaUnidad1Base`, fase `'entrada'`)
queda **exactamente igual**: video Remotion, stats, letreros, fichas, CTA
gigante, ruta y act-nav. Orden expresa del cliente. Lo único que cambia es qué
aparece **después** de pulsar «Entrar al laboratorio».

---

## 3. Arquitectura de pantalla — «laboratorio de dos hojas»

El simulador es `position: fixed; inset: 0; z-index: 80`: hoy se apodera de toda
la ventana. Para que convivan «a la vez» hace falta re-encuadrarlo, no
sustituirlo.

```
┌──────────────────────────────────┬──┬──────────────────────────────┐
│  HOJA IZQUIERDA                  │▮▮│  HOJA DERECHA                │
│  Página educativa                │▮▮│  Simulador 3D                │
│  (scroll propio)                 │▮▮│  (fijo, alto completo)       │
│                                  │▮▮│                              │
│  hero · cifras · secciones       │  │  canvas + HUD + Byte         │
│  con fotos reales                │  │  (sin tocar su lógica)       │
└──────────────────────────────────┴──┴──────────────────────────────┘
                                    ▲
                          riel divisor con el mando
                       📖 lectura · ⚖ mitad · 🔬 laboratorio
```

**Decisiones y por qué:**

| Decisión | Razón |
|---|---|
| Dos columnas simultáneas, no pestañas | «a la vez» es literal. Con pestañas el alumno vería una cosa o la otra. |
| Página a la izquierda, simulador a la derecha | Se lee de izquierda a derecha: primero el dato, luego la acción. |
| Reparto por defecto 44 / 56 | A 1600 px la columna de lectura mide ~700 px: medida editorial correcta (~65 caracteres). El simulador conserva más de la mitad. |
| Mando de tres posiciones **dentro del riel divisor** | Pauta vigente: los controles se integran al mueble, nunca flotan como overlay genérico. El riel es el mueble. |
| Bajo 1180 px: apilado, simulador arriba en banda fija de 46 vh | En pantalla estrecha dos columnas matan las dos. La banda fija mantiene el 3D siempre visible mientras se lee debajo. |
| El simulador NO se reconstruye | Es el único bloque de la plataforma con raycast 3D real (categoría A de la auditoría). Se le cambia el encuadre, no las tripas. |

**Riesgo medido y su remedio.** `laboratorio.ts:817` redimensiona con
`canvas.getBoundingClientRect()` pero sólo escucha `window.resize`. Si el mando
cambia el reparto sin que la ventana cambie, el lienzo queda estirado. Remedio:
`ResizeObserver` sobre la hoja derecha que emite `window.dispatchEvent(new
Event('resize'))`. Se comprueba con captura, no se da por bueno.

---

## 4. Lenguaje visual

Se hereda el de la landing v4 —«sala oscura, pantallas encendidas»— porque es
justo lo que el cliente señaló como referencia.

- **Fondo:** `#04122a` → `#06101c` (el mismo azul-noche del simulador, así las
  dos hojas se leen como un solo mueble).
- **Acentos:** `#32a8ff` (azul), `#5ce1e6` (cian), `#58e29c` (verde), `#ffd25a`
  (ámbar) — los ya declarados en `mision.css`.
- **Fotografías a sangre** dentro de su medida, con degradado inferior hacia el
  fondo para que no floten recortadas sobre el azul.
- **Color pleno, jamás pastel. Nunca `dashed`. Sin XP ni estrellas.**
- Tipografía: las mismas `dmSans` / `manrope` de la landing.

---

## 5. Contenido — secciones y copia final

Público: Nivel 1. Frases cortas, concretas, sin infantilismo. Cada sección
responde a «qué es», «cómo se reconoce» y «qué hago con eso».

### 5.0 · Hero
- **Foto:** `foto-panel-trasero.jpg` a sangre, con velo oscuro.
- **Eyebrow:** `NIVEL 1 · UNIDAD 1 · PARADA 3`
- **H1:** «Cada cable tiene un solo lugar»
- **Entrada:** «La parte de atrás de una computadora parece un desorden de
  agujeros. No lo es. Cada agujero tiene una forma distinta a propósito, para que
  sea imposible equivocarse. Aquí aprendes a leer esas formas; en el laboratorio
  de al lado las practicas.»

### 5.1 · Tira de reglas (cifras)
Cuatro datos, formato `{dato, unidad, pie}`:

| dato | unidad | pie |
|---|---|---|
| 1 | forma | Cada conector entra de una sola manera |
| 0 | fuerza | Si no entra, está al revés — no lo empujes |
| 6 | cables | Los que vas a conectar en el laboratorio |
| 2 | manos | Una sujeta el equipo, la otra el conector |

### 5.2 · «Puerto y cable no son lo mismo»
Dos fichas en pareja.

- **Ficha A — El puerto.** Foto `foto-hdmi-puerto.jpg`.
  «Está fijo en el equipo, es el hueco. Casi siempre tiene su nombre escrito
  al lado: HDMI, USB, LAN. Ese letrero es tu mapa.»
- **Ficha B — El cable.** Foto `foto-hdmi-cable.jpg`.
  «Va suelto y tiene una punta en cada extremo. La punta es la que entra en el
  puerto. Si la punta y el hueco tienen la misma forma, son pareja.»

**Idea que se lleva:** la forma manda. No el color, no la etiqueta: la forma.

### 5.3 · Mapa del panel trasero (interactivo ligero)
La foto `foto-panel-trasero.jpg` grande con cinco llamadas numeradas encima. Al
pasar el ratón o tocar, la llamada se abre.

| № | Zona | Texto |
|---|---|---|
| 1 | PS/2 morado | «Los de antes. Aquí iban el teclado y el ratón hace veinte años. Todavía los verás en equipos escolares.» |
| 2 | VGA azul | «Imagen para el monitor. Azul, con dos tornillos a los lados.» |
| 3 | USB | «El puerto de todo: teclado, ratón, memoria, impresora.» |
| 4 | Red | «El cable de internet. Hace clic al entrar.» |
| 5 | Audio | «Verde para bocinas, rosa para micrófono, azul para entrada.» |

Las coordenadas de las llamadas se ajustan **mirando la captura**, no a ojo desde
el código.

### 5.4 · «Primero la corriente, y con cuidado»
- **Foto:** `foto-corriente.jpg`.
- «Este cable es el único que trae electricidad de verdad. Un extremo va al
  regulador o al contacto de la pared; el otro, a la fuente de la computadora,
  atrás de todo. Manos secas. Se toma siempre del conector, nunca del cable. Y es
  el **último** que se conecta y el **primero** que se revisa cuando algo no
  enciende.»

### 5.5 · «La imagen: HDMI y VGA»
Dos fichas.
- **VGA.** Foto `foto-vga.jpg`. «Azul, ancho, con quince agujeritos en tres
  filas y un tornillo a cada lado. Sólo lleva imagen. Los tornillos se aprietan
  con los dedos para que no se zafe.»
- **HDMI.** Foto `foto-hdmi-cable.jpg`. «Plano, delgado, con las esquinas de
  abajo recortadas. Lleva imagen **y** sonido por el mismo cable. No tiene
  tornillos: entra a presión y se queda.»

### 5.6 · «La familia USB»
- **Banner:** `foto-usb-tipos.jpg` (comparativa con regla).
- **Ficha:** `foto-usb-a.jpg`.
- «USB es el puerto de casi todo. Fíjate en la punta: es un rectángulo con una
  barra de plástico **de un solo lado**. Esa barra decide cómo entra. Si no
  entra, gíralo media vuelta. Nunca lo fuerces: se doblan los contactos de
  adentro y ya no sirve.»

### 5.7 · «El sonido»
- **Foto:** `foto-audio-jack.jpg`.
- «Es el más pequeño de todos: un tubito de 3,5 milímetros con dos rayas negras.
  Se guía por color, y por eso el panel trasero está pintado: **verde** para las
  bocinas y los audífonos, **rosa** para el micrófono, **azul** para conectar
  otro aparato que reproduzca sonido.»

### 5.8 · «La red»
- **Foto:** `foto-ethernet.jpg`.
- «El cable de internet termina en una punta transparente con ocho hilitos
  dorados. Tiene una pestaña de plástico que hace **clic** al entrar: ese clic es
  la señal de que quedó bien. Para sacarlo se aprieta la pestaña primero; si
  jalas sin apretar, la rompes.»

### 5.9 · Reglas de oro
Cinco reglas numeradas, sin foto.
1. Mira la forma antes de empujar.
2. Si no entra, está al revés. Gíralo, no lo fuerces.
3. Toma siempre el conector, nunca el cable.
4. La corriente, al final.
5. Si algo no enciende, revisa primero que esté conectado y encendido el
   regulador.

### 5.10 · Créditos
Bloque discreto al pie: cada fotografía con su autor y su licencia. Obligatorio
—son CC BY-SA / CC BY / dominio público de Wikimedia Commons, no Unsplash.

---

## 6. Fotografías (todas descargadas y revisadas a tamaño completo)

Ubicación: `public/assets/actividades/n1-conecta-el-equipo/`.
Metadatos también en `creditos.json`, junto a los archivos.

| Archivo | Qué muestra | Autor | Licencia |
|---|---|---|---|
| `foto-panel-trasero.jpg` | Panel trasero real: PS/2, USB, VGA, DVI, red y audio de color | Fabexplosive | CC BY-SA 3.0 |
| `foto-hdmi-puerto.jpg` | Puerto HDMI hembra con su etiqueta | Wikimedia Commons | CC BY-SA 3.0 |
| `foto-hdmi-cable.jpg` | Cable HDMI enrollado, ambas puntas | Kannan shanmugam | CC BY-SA 4.0 |
| `foto-vga.jpg` | Macro de conector VGA azul con tornillos | Evan-Amos | Dominio público |
| `foto-usb-a.jpg` | Macro de punta USB-A | wdwd | CC BY-SA 4.0 |
| `foto-usb-tipos.jpg` | Comparativa de conectores USB con regla | Wikimedia Commons | Dominio público |
| `foto-audio-jack.jpg` | Jack de 3,5 mm verde | Evan-Amos | Dominio público |
| `foto-ethernet.jpg` | Dos puntas RJ-45 (8P8C) con luz dramática | Thomas Wydra | Dominio público |
| `foto-corriente.jpg` | Cable de corriente: clavija y conector IEC | Luis Dantas | Dominio público |

Por qué Wikimedia y no Unsplash: en esta máquina la búsqueda de Unsplash está
cerrada (`/s/photos` devuelve 22 bytes, la API pide clave, `source.unsplash.com`
da 503) y Pexels no responde. La API de Commons sí funciona sin clave y, para una
lección sobre conectores, aporta algo que Unsplash no: **el sujeto está
correctamente identificado**. A cambio exige atribución, que va en §5.10.

---

## 7. Accesibilidad y comportamiento

- El mando del riel son tres `<button>` con `aria-pressed`; se recorren con
  tabulador y responden a Enter/Espacio.
- Las llamadas del mapa son `<button>` con su texto en el DOM, no sólo en hover.
- Cada foto lleva `alt` descriptivo real (no «imagen de cable»).
- Los reveals por scroll respetan `prefers-reduced-motion`.
- Las fotos se sirven con `next/image` (`sizes` declarado) para no mandar 1400 px
  a una ficha de 320 px.

---

## 8. Criterio de terminado

1. Al pulsar «Entrar al laboratorio» se ven **las dos hojas a la vez**, sin
   hacer scroll.
2. La pantalla de entrada quedó intacta.
3. El mando de tres posiciones cambia el reparto y el 3D **no se deforma**
   (comprobado con captura, no supuesto).
4. Las cinco llamadas del panel caen sobre el puerto correcto (comprobado con
   captura).
5. Los créditos de las nueve fotos están visibles.
6. Las nueve fotografías se vieron a tamaño completo antes de publicarse. ✔ hecho
