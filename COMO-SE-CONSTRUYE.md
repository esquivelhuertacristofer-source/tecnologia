# Cómo se construye en Tecnia

**Léete este archivo entero y no explores más de lo que necesites.** Existe porque
el 15-ago-2026 diecinueve agentes gastaron sus primeras treinta o cuarenta
llamadas cada uno **redescubriendo exactamente lo mismo**. Aquí está, escrito una
vez. Si algo de aquí resulta falso al medirlo, **corrígelo aquí mismo** con la
medición y la causa: es lo que se hizo con `CANON-ARMAZONES.md`, que tenía dos
afirmaciones falsas.

Proyecto: `c:\Users\crist\.gemini\antigravity\scratch\Plataforma de tecnologia\tecnia-plataforma`.
Next 16 · React 19 · TypeScript estricto · Jest + jsdom + Testing Library.

---

## 0 · Lo primero, porque cuesta trabajo perdido

**NO HAY GIT EN ESTE REPO.** Quien escribe último borra al otro **en silencio**.

- **`Edit` siempre. `Write` JAMÁS** sobre un archivo que ya existe.
- Si un `Edit` falla porque el texto no coincide, **relee el archivo y repite**:
  significa que otro agente acaba de escribir ahí.
- **Los archivos compartidos** (mira si hay otro agente antes de tocarlos):
  `src/data/curriculo.ts` · `src/components/activities/registry.ts` ·
  `src/__tests__/actividades-contrato.test.tsx` ·
  `src/components/activities/office/registroOffice.ts` · `jest.setup.ts` ·
  `DOCUMENTO-MAESTRO-PEDAGOGICO.md`.
- **Tócalos al final y de una vez**, con tu trabajo ya hecho.

**No leas `DOCUMENTO-MAESTRO-PEDAGOGICO.md` entero** — pasa de 13.000 líneas.
Búscalo con `grep` por el id de la actividad.

---

## 1 · El patrón de la casa

Los dieciséis armazones del proyecto tienen la misma forma. **Cópiala, no la
inventes.** El ejemplar de referencia más corto es
`src/components/simuladores/asistente/`:

```
simuladores/<nombre>/
  tipos<Nombre>.ts     ← datos puros y funciones puras. SIN React.
  use<Nombre>.ts       ← el estado. Aquí viven los hooks.
  Ventana<Nombre>.tsx  ← presentación. CERO useState. Todo por parámetro.
  ventana<Nombre>.css
  index.ts             ← la puerta pública
```

Reglas que salieron de construir los dieciséis:

- **Recibe TODO por parámetro**, como `VentanaHojas`. Probado en 23 clases.
- **Datos inmutables, operaciones puras**, y **devolver el mismo objeto por
  identidad** cuando no hay cambio. Se comprueba con `toBe`, no `toEqual`.
- **El armazón NO corrige.** Da hechos; el juicio es de la clase. Si te ves
  escribiendo `esPhishing()` o `acertó()`, estás en el sitio equivocado.
- **NO son motores de plantillas** — el cliente los rechazó explícitamente. Un
  armazón simula *un programa*; no recibe una lista de ejercicios y los pinta.
- **La lógica va aparte de los eventos.** El navegador fabrica **un dato** (un
  sitio, un rayo, un punto) y de ahí todo son funciones puras. Por eso 23 de 25
  pruebas de un armazón no tocan el DOM.

### Piezas compartidas — úsalas, no las reescribas

| Pieza | Dónde | Qué da |
|---|---|---|
| `VentanaBase` | `simuladores/VentanaBase.tsx` | El marco: barra de título, cuerpo, pantalla de arranque. Props: `marca`, `subtitulo?`, `arranque?`, `encendida?`, `barraEstado?`, `claseMarco?`, `children` |
| `useLabActividad` | `activities/lib/useLabActividad.ts` | **El arnés de sesión**: progreso, intentos, puntaje, estrellas, `onComplete`. Opciones: `{ piso, penalizacionError, estrellas }`. Ojo: `ocupar()`/`liberar()`, no mutar la ref. **Y lee el renglón de abajo antes de llamar a `terminar()`** |
| `EditorCodigo` | `simuladores/codigo/ventana/EditorCodigo.tsx` | Editor de código **sin nada de Python dentro**: números de línea, capa coloreada alineada al carácter, Tab a la siguiente parada de cuatro, Esc+Tab para salir, línea resaltada, `soloLectura`. **Le pasas tu propio coloreador.** Lo heredan Python, SQL y web |
| `SalaCodigo` | junto a las clases de Python | Chasis: portada + sala + `VentanaBase` + `VentanaCodigo` + cierre |
| `AmbienteEstudio` | `activities/arcade3d/EscenaArcade3D.tsx` | Los ocho focos, sin CDN. **El estándar de luz de la casa**, con `Bloom`/ACES/dpr |

**El arnés está copiado a mano en 56 laboratorios todavía. No hagas el 57.**

**El único parámetro de `terminar()` es `tiempoSegundos`** — no el puntaje y no
el xp. El puntaje lo calcula el arnés solo (`const score = puntaje()`, y luego
`xp: score`), así que lo que le pases se publica tal cual como **el tiempo que
tardó el alumno**. Medido el 21-ago-2026: **cinco clases pasan un número
inventado** (`terminar(labActividad.pasos * 20)` en cuatro y `* 25` en una), y
otras seis pasan un `0` o un `120` fijos. No rompe la clase —el puntaje sale
bien igual— pero el tiempo que reporta al contrato es mentira. Lo correcto es
lo que hacen las 34 mayoritarias: `terminar(Math.round((Date.now() - inicio) / 1000))`.
*Nadie lo cazó porque el defecto está en el sitio donde un número cuadra con
otro número: el compilador ve un `number` y se calla.*

---

## 2 · Los armazones que ya existen

Todos en `src/components/simuladores/`, todos cerrados el 15-ago-2026 con sus
pruebas. La columna de la derecha es **a cuántas actividades sirve de verdad**,
medido por quien lo construyó — no lo que prometía la auditoría.

| Paquete | Qué simula | Sirve entera a |
|---|---|---|
| `codigo/` + `codigo/ventana/` | Intérprete de Python + su editor | 11 de 14 |
| `asistente/` | Chat de IA guionizado | 11 de 16 |
| `web/` | HTML y CSS con vista previa | 9 de 11 |
| `laboratorio3d/` | Banco de montaje físico en 3D | 5 de 7 |
| `datos/` + `datos/ventana/` | SQL sobre tablas en memoria | 4 de 4 |
| `aprendizaje/` | Clasificador explicable (árbol de decisión) | 4 de 4 |
| `diseno/` | Editor gráfico con capas | 4 de 8 |
| `muro/` | Red social | 4 de 8 |
| `bloques/` | Editor de bloques tipo Scratch | 3 de 8 |
| `sistema/` | Escritorio y explorador de archivos | 2 de 6 |
| `nube/` | Archivos en la nube, conflicto, sin conexión | 2 de 5 |
| `navegador/` | Navegador con pestañas, ventanas emergentes y candado | 1 de 1 |
| `correo/` · `tablero/` · `agenda/` | Cliente de correo · kanban · calendario | 1 cada uno |

**`navegador/` lo estrena `n7-verifica-a-la-ia` (21-ago-2026):** las 1.069
líneas del armazón, medidas en su primer uso real, sin necesitar tocar
`VentanaNavegador.tsx` ni `tiposNavegador.ts`. Lo que faltaba: un slot de
acción por párrafo (`CuerpoPagina.articulo.parrafos` es `string[]` puro, sin
metadatos, así que un artículo no trae de fábrica un botón «📎 Adjuntar» por
párrafo) y `pagina.titulo` de `paginaNoEncontrada` nunca llega al DOM (el
`CuerpoPaginaView` de la variante `'vacio'` sólo pinta `cuerpo.mensaje`). La
clase resolvió las dos cosas fuera del armazón, con datos propios
(`META_PARRAFOS` en `verificaALaIa.ts`), no parcheando el armazón — la
misma disciplina que ya se aplicó con `sistema/Escritorio.tsx` unas horas
antes.

Y fíjate en **por dónde se escapó**, que es lo reutilizable: el censo de
`armazones-un-solo-aviso.test.tsx` **sí** lo tenía —lee las carpetas del disco y
las compara con su registro, así que un armazón nuevo pone la prueba en rojo el
día que nace—. Lo que no lo tenía era **esta tabla**, y *una tabla no falla
ninguna prueba*. El inventario que la gente lee y el inventario que la máquina
comprueba llevaban semanas sin coincidir. (Las quince carpetas más el
`VentanaBase.tsx` suelto son los «dieciséis» que se nombran arriba.)

**`sistema/` NO son «cuatro pieles». Medido el 21-ago-2026** construyendo
`n7-sistemas-operativos`, que es la clase para la que `CANON-ARMAZONES.md:296`
—y la cabecera del propio `Escritorio.tsx`— prometían *«Windows, Android, iOS y
Linux son cuatro pieles del mismo armazón; la piel entra por `marca`,
`fondoClase` y los iconos»*. Falso en dos puntos:

- **`fondoClase` no existe.** `EscritorioProps` declara `iconos`, `ventanas`,
  `contenido`, `horaTexto`, `marca`, cinco callbacks y `className`. La cabecera
  nombra una prop que nadie escribió.
- **Y lo que importa: la estructura está clavada al escritorio.** Siempre pinta
  `.tsd-barra-tareas` abajo con su botón de inicio, iconos en cuadrícula y
  ventanas flotantes con `─`/`✕`. **Un teléfono no tiene nada de eso.** Cambiar
  `marca` deja cuatro escritorios con nombres distintos, que es lo contrario de
  lo que esa clase enseña. *El árbol de archivos y el explorador sí son sólidos
  y sirven: lo que no existe es el cambio de forma.*

Tercera afirmación de «esto ya existe» que se cae al medirla —van tres— y
siempre por lo mismo: **se midió lo que se ve en pantalla, no lo que hay
detrás.** Si una fila de estas tablas te promete justo la capacidad que
necesitas, ábrela y cuéntala antes de planear encima.

**La lección que ordena el plan:** una auditoría agrupa por **tema** y la
construcción se hace por **programa**, y no coinciden. Antes de asignarle un
armazón a una clase, la pregunta no es «¿de qué habla?» sino **«¿qué programa
abre el alumno?»**.

### Deudas con nombre (no las descubras otra vez)

- **No hay intérprete de JavaScript** → 2 clases de web a medias.
- **No hay disco ni `import` en Python** → `n9-datos-con-python` y
  `n10-python-intermedio` no encajan como los describe el canon.
- **Bloques no tiene corridas simultáneas** → dos personajes a la vez, imposible.
- Faltan: línea de tiempo (vídeo/audio), máscara de capa, medidor de contraseña,
  bloquear a una persona, pantalla de ajustes de privacidad, enlace visible entre
  dos piezas 3D.
- **La capa 3D vieja (27 archivos, 17.391 líneas) no tiene ni una prueba que la
  ejecute**: `detectarWebGL()` da falso en jsdom y todo cae al respaldo.

---

## 3 · Cómo se construye una clase

```
activities/<nivel>/<sala>/
  Entrada<Xxx>.tsx     ← la portada
  Lab<Xxx>.tsx         ← la actividad
  <xxx>.css
```
Y luego, **al final y de una vez**: entrada en `registry.ts` con
`layout: 'inmersivo'` · `estado: 'disponible'` en `curriculo.ts` · las fixtures
que exija `actividades-contrato.test.tsx`. Las clases de Office van en
`registroOffice.ts`.

**Lee entera una clase ya cerrada antes de escribir la tuya.** Copia la forma, no
la inventes.

### Obligatorio, y todo esto costó caro cuando faltó

1. **Portada de objetivos al entrar.** Entrar a un laboratorio sin saber el tema
   ni el objetivo está **declarado defecto** por el cliente.
2. **Verifica el nivel y la edad en `src/data/curriculo.ts`** antes de escribir
   una palabra, y no te fíes del encargo. Ya se repartieron seis encargos con la
   edad equivocada y sólo lo cazó el agente que siguió el currículo. El tono, la
   longitud de las frases y los ejemplos salen de esa edad.
   *N4 = 4.º de primaria (9–10) · N6 = 6.º de primaria (11–12) · N7 = 1.º de
   secundaria (12–13). El resto, míralo.*
3. **El documento pedagógico va ANTES que el código.** Busca el temario por grep;
   si no existe, **escríbelo primero** en `DOCUMENTO-MAESTRO-PEDAGOGICO.md` (mira
   cuál es la siguiente sección `§` libre y no pises la de otro) y luego construye.
4. **Si copias una entrada, revisa CADA cadena de texto**: título, objetivo,
   pasos, ruta. *Un port que sólo cambia el import deja las entradas mintiendo*,
   y ya pasó aquí.
5. **Usa `useLabActividad`**, no lo copies a mano.

### Las reglas del cliente sobre cómo se ve

- **Color pleno y saturado, estilo videojuego, fondo oscuro con drama de luz.**
  **Nunca pastel, nunca blanco sobre blanco, nunca bordes punteados.** Saturado a
  secas ya no basta: hace falta luz.
- **Nada de botones flotantes genéricos.** Los controles se integran en la escena.
- **Software ultra-LITE:** todo lo que en la vida real es software (correo,
  navegador, chat, Office, videollamada…) se construye como **simulador interno
  que parezca el programa de verdad y se vea genial**. No metáforas físicas, no
  capturas de pantalla, no incrustar software real, **nada de marcas existentes**.

### Y las reglas del 3D, por las que ya se tiró trabajo a la basura

Sólo **7 de las 104 pendientes** llevan 3D: aquellas donde el espacio *es* el
contenido. Si dudas, no es 3D.

1. **«3D feo y forzado con interfaz encima» está RECHAZADO.** Una escena con
   paneles de HTML flotando delante no es 3D: es una interfaz normal con fondo
   bonito. Por esto se declaró inutilizable una actividad entera.
2. **Lo que va en el mundo, gira con el mundo.** Nada que se rompa al girar.
3. **Geometrías de colores sin valor pedagógico no valen.** Un cubo rojo no es
   una fuente de alimentación.
4. *Medido: los paneles de HTML son la causa de que la cámara esté atada a
   ±0,55 rad con el zoom apagado. Sin ellos, la cámara se suelta sola.*

---

## 4 · Cómo se verifica

### Se prueba jugando MAL a propósito
Una clase de este proyecto pasó la verificación de su autor y **tenía 30
defectos**, todos hallados jugando mal. Pulsar el botón equivocado, hacer el paso
3 antes que el 2, deshacer lo hecho, terminar sin hacer nada, pulsar cien veces,
borrar la plantilla entera, acertar sin leer.

### Recorre la clase de punta a punta, hasta la pantalla de cierre
**La lección más cara del proyecto:** *el motor sólo está probado hasta donde
llegan las clases que se han jugado.* El recorrido completo de Excel encontró
**nueve clases imposibles de terminar** con las pruebas unitarias en verde. El de
Word encontró dos, y **una reventaba al pulsar «Salir»** — o sea, para todo
alumno que la terminase.

Comprueba siempre: **(a)** que se puede terminar · **(b)** que una partida
perfecta saca 100 y tres estrellas · **(c)** que **ningún encargo posterior
deshace un predicado anterior** (*un predicado que un encargo posterior deshace
está mal escrito*) · **(d)** el camino de salida.

### Rompe tu propio trabajo a propósito
Mete el defecto, corre, comprueba que se pone rojo, revierte. **Cuando plantes un
defecto y NO caiga ninguna prueba, la primera hipótesis no es «era inocuo»: es
que la prueba no comprobaba lo que creías.**

### Un defecto que se repite pasa a ser una medida
Si el mismo fallo aparece en dos sitios, **es del motor** y se arregla allí, no
dos veces. **Y un aviso escrito en un comentario NO es una medida.**

### Nada de épsilons inventados
Regla de la casa: **dos cosas son iguales si al alumno se le enseñan iguales**,
no si difieren en menos de un número que elegimos nosotros. Se cuadricula y se
compara exacto. Si el precio es que algo quede «casi», **se paga a la vista**
—ajustar y centrar de verdad— en vez de esconderlo en una tolerancia.

---

## 5 · Las trampas de jsdom — la prueba verde y vacía

Todas tienen la misma forma: **la prueba pasa sin comprobar nada.**

1. **`PointerEvent` no existe.** `fireEvent.pointerDown(el, {clientX: 300})`
   construye un `Event` pelado y **pierde las coordenadas en silencio**. Toda
   prueba de arrastre escrita así es verde y hueca. *Salida buena: que la lógica
   de arrastre sea pura y no necesite eventos.*
2. **`getBoundingClientRect` devuelve ceros.** Nada que dependa de medir en
   pantalla es probable aquí. Por eso `activities/lib/usePointerDrag.ts` **no
   sirve** para superficies continuas.
3. **La fecha de hoy que coincide con la de la prueba.** Un agente plantó el
   defecto «lee el reloj en vez del parámetro» y la prueba siguió verde porque su
   constante `HOY` era casualmente la fecha real. **Usa un día que no sea hoy.**
   Y nunca `Date.now()` ni `new Date()` sin argumentos en la lógica.
4. **El banco de rendimiento vacío.** Un motor midió «5.000 ejemplos en 3 ms» y
   era falso: su generador se salía de 2^53 y el banco tenía tres combinaciones.
   **Una prueba de rendimiento necesita una aserción de que la carga es real.**
5. **Al medir tiempos**, toma el **mínimo de varias tandas**, nunca la media: jest
   lanza un obrero por archivo y el reloj de pared mide también la máquina. Mejor
   aún: mide el **suelo** de jsdom en la misma tanda y compara contra él.

Ya tapados en `jest.setup.ts` (no lo rehagas): `HTMLCanvasElement.getContext`,
`Range.getClientRects`, `Range.getBoundingClientRect`, `Element.scrollTo`,
`Element.scrollIntoView`, `ResizeObserver`, `window.matchMedia`, y los matchers
de `jest-dom`.

6. **`window.matchMedia` tampoco existe, y el defecto estuvo escondido meses.**
   Lo llama todo laboratorio 3D nada más montar (`useReduceMotion` del arcade y
   `useReduceMotion3D` de las clases de volumen preguntan por
   `prefers-reduced-motion` en su primer efecto). Nadie lo había pisado por un
   accidente: en las entradas **con video** el primer `<button>` del documento es
   el del cubrepantalla, así que `actividades-contrato` —que pulsa el primero que
   encuentra— nunca llegaba a abrir el laboratorio. En cuanto una clase declara
   `assetsPendientes` no hay cubrepantalla, el primer botón **es el CTA**, y el
   laboratorio se monta de verdad: `matchMedia is not a function`. Encontrado el
   15-ago-2026 por `n5-conecta-perifericos` y curado en la configuración, no en
   el archivo de pruebas.
7. **La prueba de «doble clic» que no prueba ningún doble clic.** Medido el
   21-ago-2026 en `n5-documentos-compartidos`, plantando el defecto tres veces:
   - Dos `fireEvent.click` seguidos **no son el mismo tick**: Testing Library
     envuelve cada uno en su `act` y React vuelve a pintar en medio.
   - Los dos `dispatchEvent` dentro de **un mismo `act` tampoco**: `click` es un
     evento discreto y React 19 vacía la cola al terminar cada despacho.
   - Y el caso más común de todos: **el botón que avanza de acto se desmonta**
     con el primer clic, así que el segundo cae sobre un elemento que ya no está
     en el documento y **nunca llega al listener de React**. Se quitó la guarda
     entera de uno de esos botones y las 23 pruebas siguieron **verdes**.

   O sea: `useRef` para los índices sigue siendo lo correcto, pero **no lo
   demuestra una prueba escrita así**. Lo que sí se puede probar es lo
   observable —«esto ocurrió una sola vez»— y sólo en los botones que **siguen
   en pantalla después de la acción** (los del armazón, típicamente: «Guardar
   cambios» con el conflicto ya abierto, «Generar enlace» ya generado). Ahí
   quitar la guarda **sí** pone la prueba roja.

**Si necesitas tapar algo más, súbelo ahí con su comentario** — tres veces ya
alguien parcheó en su archivo un defecto que vivía en la configuración.

### El defecto del aviso duplicado — BARRIDO Y SELLADO (15-ago-2026)
Un callback de props llamado **desde dentro del actualizador de un `setState`**
corre durante el pintado, y **React en modo estricto —el que Next trae de
fábrica— invoca el actualizador dos veces**: progreso al doble, actividad
completada dos veces. Lo encontraron dos agentes el mismo día en dos armazones
sin relación. **El aviso sale del gesto, o de un efecto con su contador en
`useRef`. Nunca de dentro del actualizador.**

**Cuántos eran de verdad.** Se barrieron los dieciséis armazones y todo
`src/components` emparejando paréntesis a mano (un `grep` se para en la primera
llave, que es por donde se escapó meses). La familia era **más pequeña de lo que
parecía y estaba muy concentrada**: sólo **tres** de los dieciséis armazones
declaran avisos de avance —`codigo/ventana`, `web` y `datos`— y **el tercero,
`datos/ventana/useDatos.ts`, tenía el defecto entero**, copiado palabra por
palabra de `useCodigo` antes de que aquél se curara. Ya está arreglado con la
misma forma: efecto + `avisadosRef`. Los otros tres armazones con callbacks
(`asistente`, `bloques`, `diseno`) estaban **limpios**: avisan desde el gesto.
Y `activities/lib/useLabActividad.ts` —el arnés que heredarán los 59
laboratorios— **está limpio**: `avanzar`, `terminar` y `restar` llaman a
`onProgress`/`onScore`/`onComplete` desde el gesto, nunca desde un actualizador.

**El primo, el que sí quedaba suelto.** Escribir una `ref` dentro del
actualizador es el mismo defecto con otra cara. `navegador/useNavegador.ts`
pedía el id de la descarga (`nuevoId('d')`, que sube un contador) **dentro** del
`setDescargas`: en modo estricto el contador saltaba de dos en dos. Arreglado —
el valor se calcula antes y entra cerrado. **Queda uno vivo y anotado, de otra
sala:** `src/components/office/VentanaDiapositivas.tsx` (~1056) empuja la pila de
deshacer dentro del actualizador de `setMazo`, así que **un cambio cuesta dos
Ctrl+Z**. No se tocó por ser de la sala de PowerPoint.

**El lint NO lo avisaba, y no puede.** Se comprobó con el defecto puesto:
`npx eslint` daba 0. `react-hooks/purity` y `react-hooks/refs` **no miran dentro
de la función que se le pasa a `setState`**. No esperes que el linter te salve
de esto. (Señal de que el arreglo entró bien: en cuanto el actualizador queda
pelado, `react-hooks/set-state-in-effect` empieza a saltar donde antes callaba.)

**La medida: `src/__tests__/armazones-un-solo-aviso.test.tsx`.** Cuatro capas,
y hacen falta las cuatro:

1. **El censo** — la lista de paquetes se lee **del disco** y se compara con el
   registro del archivo. El armazón diecisiete pone la prueba en rojo **el día
   que nace**, aunque nadie lo registre.
2. **El censo de avisos** — de cada `export interface Opciones*` se extraen los
   callbacks `on…`/`al…`. Añadir un `onTerminado` a un armazón que hoy no avisa
   lo pone rojo hasta que se le escriba un conductor.
3. **La guarda estática** — barre `src/components` entero buscando avisos dentro
   de actualizadores, y los armazones buscando `ref` **escritas** ahí. Ésta caza
   el diecisiete escrito mal **sin registro de ninguna clase**. Lleva su propia
   autoprueba: se fabrica un archivo con el defecto y comprueba que lo señala.
4. **La conducta en `<StrictMode>`** — cada armazón se monta de verdad y un
   gesto tiene que producir **un** aviso (y, en los que no avisan, **un** efecto:
   una cita, un correo, una descarga). Empieza comprobando que este React
   **sigue doblando** los actualizadores: sin ese cimiento, el día que dejara de
   doblar todo el apartado pasaría sin medir nada.

**Se rompió a propósito tres veces y las tres se puso roja:** devolviendo el
defecto a `useDatos` (rojo en la guarda *y* en la conducta, `onAvance = 3`);
plantando un `onPublicada` en `useMuro`, que hoy no avisa a nadie (rojo en el
censo de avisos *y* en la guarda); y creando un armazón diecisiete con el defecto
dentro (rojo en el censo de armazones *y* en la guarda). **Si escribes un armazón
nuevo, esta prueba te va a pedir su conductor. Escríbelo: es de las pocas cosas
que cazan un progreso al doble antes de que lo vea un alumno.**

---

## 6 · Las puertas

Al final, **una sola vez**:

1. `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` → **0**
2. `npx eslint <tus archivos>` → **0**
3. `npx jest <tus pruebas>` + `actividades-contrato.test.tsx` → **verdes**

**NO corras la suite entera.** Son más de cien suites, tarda minutos y casi
siempre hay otro agente escribiendo, así que el resultado no es tuyo. La suite
completa la corre el coordinador una vez por tanda.

### La cuarta puerta, que ninguna de las tres cubre

**`jest` simula todos los imports de `.css`** (`identity-obj-proxy`, en
`jest.config.ts`), y `tsc` no resuelve imports que no son código. Un archivo
`.css` que se importa y **nunca se escribió** pasa las tres puertas en verde y
sólo lo ve `next build` — que es justo la puerta que ningún encargo corre.

Pasó de verdad el 15-ago-2026: `BackstageHojas.tsx` importaba
`backstageHojas.css`, el archivo no existía, y no se supo hasta un despliegue a
producción.

**Si tu clase o tu armazón añade un `import './algo.css'` a un archivo nuevo**,
antes de dar por cerrado el encargo:
```
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```
no basta — usa
```
npx next build --webpack 2>&1 | tail -40
```
sobre **lo que tocaste**, o al menos comprueba con `ls` que cada `.css` que
importaste existe de verdad. Es barato y evita que el defecto se descubra en
producción.

*Conocido y pre-existente: `ventana-hojas-tablas-clase.test.tsx` flaquea bajo
carga (falla una distinta cada vez, pasa sola o con `--maxWorkers=3`). Si algo
falla, **compruébalo en aislado** antes de darlo por roto tuyo.*
*Actualización del 2-sep-2026: el tope de la casa subió de 30 a 90 s por esto
mismo, con la medida escrita en `jest.config.ts`. **No pongas topes por prueba**
(`}, 60_000)`): un tope suelto acaba siendo más BAJO que el global el día que el
global suba.*

*Y si la máquina va justa de memoria, la suite entera **muere sin imprimir
resumen** — pasó con 6,7 GB libres de 31, y `--runInBand` lo empeora porque
acumula las 153 suites en un solo proceso (bajó a 1 GB). Lo que funciona es
reciclar el worker cuando engorda:*
```
npx jest --maxWorkers=1 --workerIdleMemoryLimit=1200MB --silent
```
*Así salieron las 153 suites y las 3 567 pruebas en verde en 1 478 s.*

### La quinta puerta: abrir la plataforma de verdad

La cuarta mira los archivos que el build necesita. Ésta mira los que necesita el
ALUMNO, y es otra cosa.

**Ninguna de las cuatro anteriores sabe si una imagen existe.** `tsc` ve
`img: 'ficha-reparte.png'` como un string y compila. **`jsdom` no descarga
imágenes**, así que un `<img src>` roto monta igual y la prueba pasa. Y
`next build` copia `public/` sin comprobarla.

Pasó de verdad, y en grande: el 2-sep-2026, con las cuatro puertas en verde,
**tres clases enseñaban cuatro huecos cada una** donde iban sus tarjetas
(`n7-sistemas-operativos`, `n7-diagnostica-y-soluciona`, `of-m365-otra-caja`):
las tres sin carpeta en `public/assets/actividades/`.

```
npm run build && npx next start -p 3002
PLAYWRIGHT_PATH="$(npm root -g)/playwright" node scripts/auditoria/barrido-assets.mjs --todo
```

Abre la entrada de las 235 y sale con código 1 si algo pide un archivo que no
está. **Antes de cada entrega**, y sobre todo después de añadir una clase nueva.
Dos cosas que costaron rato aprender y están en su cabecera: las 38 de Office
viven en otra ruta y hay que barrerlas también (`--todo` lo hace), y `next start`
sirve una FOTO de `public/` tomada en el build, así que **si acabas de añadir
imágenes hay que reconstruir antes de barrer**.

Lo que NO cubre: entra a la entrada, no al laboratorio. Si un laboratorio pide
una textura que no existe, esto no lo ve todavía.

El lint tiene reglas que muerden y casi siempre tienen razón:
`react-hooks/purity`, `react-hooks/refs`, `react-hooks/set-state-in-effect`,
`react-hooks/immutability`. **No las silencies: normalmente el código sale mejor
haciéndoles caso.**

---

## 7 · Cómo trabajar

- **Una cosa a la vez, terminada, antes de empezar la siguiente.** No repartas la
  atención.
- **Mide antes de fiarte.** Las afirmaciones de «esto ya existe» de
  `CANON-ARMAZONES.md` salieron de una auditoría rápida: **dos resultaron
  falsas** porque se midió por lo que se ve en pantalla y no por lo que hay
  detrás.
- **No inventes capacidades que nadie pide.** Un armazón construyó ocho y sólo
  dos las usaba alguien. Las capacidades salen de las filas del canon.
- **Si algo no vale la pena, dilo y no lo hagas.** Es una respuesta válida.
- **Si encuentras un defecto fuera de tu paquete**, arréglalo donde vive si nadie
  más está ahí; si hay otro agente en esa zona, **anótalo con su causa** y dilo.
- **Presupuesto: unas 60 llamadas a herramientas.** Si necesitas muchas más, el
  encargo está mal acotado — dilo en vez de dar vueltas. Cada llamada reenvía la
  conversación entera, así que dar vueltas es lo que cuesta dinero de verdad.
