# CANON DE ARMAZONES

**Auditoría de armazones · 15-ago-2026.** El canon contra el que se construyen las actividades que faltan.

---

## 0. La cuenta, antes de nada

Contada fila por fila sobre `src/data/curriculo.ts` (parser en el anexo A, no a ojo):

| | |
|---|---|
| Actividades declaradas en `CURRICULO` | **197** |
| Ejercicios exclusivos en `EJERCICIOS_OFFICE` | **38** |
| **Total de la plataforma** | **235** |
| Construidas (`estado: 'disponible'`) | **131** (96 + 35) |
| **Pendientes** | **104** (101 + 3) |

Pendientes por nivel: **N5 11 · N6 15 · N7 17 · N8 22 · N9 18 · N10 18 · sala M365 3**.

> **Corrección al encargo.** El encargo pedía 106 y daba «N5 faltan 13». Son **104**, y las dos de más están todas en N5: `n5-el-cerebro-de-la-compu` y `n5-nube-o-local` ya están `disponible` en el currículo **y** registradas en `registry.ts` (líneas 1295 y 1313), con sus dos ficheros construidos —`LabElCerebroDeLaCompu.tsx`, 653 líneas, y `LabNubeOLocal.tsx`, 629—. El resto de los niveles cuadra exactamente con el encargo. **Todas las cuentas de este documento son sobre 104.**

Pendientes por eje: programación 39 · datos-IA 23 · ciudadanía 19 · creatividad 12 · sistemas 8. Reparto en 34 unidades.

---

## 1. La línea que no se cruza, dicha en esta plataforma

Un armazón es **el programa simulado**, no el ejercicio.

`VentanaHojas` sirvió a 23 clases de Excel y ninguna de las 23 perdió su guion: la ventana recibe `cinta`, `guion`, `panelFijo`, `controles`, `accesorios` y `backstage`, y **el libro sólo cambia por gestos que emite la clase**. La ventana no sabe qué se enseña. Ése es el patrón, literal, y es el único que se copia.

Las tres pruebas que tiene que pasar una propuesta antes de entrar en esta lista:

1. **Nómbrame el programa.** Si no puedo decir «esto es Thonny», «esto es Instagram», «esto es el Explorador de Windows», no es un armazón: es una plantilla con otro nombre.
2. **Enséñame dos clases que lo monten y salgan distintas.** No parecidas: distintas de mecánica.
3. **El armazón no corrige.** La corrección la trae la clase. Un armazón que sabe si el alumno acertó es un motor de plantillas.

Todo lo que en la vida real es software se construye como software y tiene que parecer el programa de verdad. Nada de metáforas físicas para cosas que son pantallas, nada de capturas, nada de software real embebido. **3D sólo donde el 3D es el contenido.**

---

## 2. Lo que ya es común, y la Pieza 0 que falta

Antes de la lista, el mapa de lo que hoy comparten los 133 `Lab*.tsx` de la plataforma: **70 arcade** (`ArcadeSala` / `ArcadeSala3D`), **61 de Office** (`VentanaTextos` / `VentanaHojas` / `VentanaDiapositivas`) y 2 sueltos.

### Lo que NO hay que construir porque ya está

| Pieza | Dónde | Quién la usa |
|---|---|---|
| **Contrato de actividad** | `src/types/activity-contract.ts` — `ActivityProps` con `onProgress` (0–1), `onScore` (0–100), `onComplete`, más `ActivityMeta` | todas |
| **Registro** | `activities/registry.ts` (97) y `activities/office/registroOffice.ts` (35), con `load` diferido y pruebas de integridad. Lo registrado casi nunca es el `Lab*.tsx`: es una `Entrada*` que recibe `ActivityProps` y monta el laboratorio dándole `alSalir` | todas |
| **Chasis 2D** | `n1/arcade/ArcadeSala.tsx` (191 líneas): marquesina, pips de ronda, marcador, Salir, Bit con voz, y `FinalMaquina` con insignia | **71 archivos** |
| **Chasis 3D** | `arcade3d/ArcadeSala3D.tsx` (216): el mismo chrome + puerta WebGL con `respaldo` HTML | **52 archivos** |
| **Temporizadores** | `arcade3d/useTemporizadores.ts` | **70** |
| **Voz y tonos** | `n1/mision/audio.ts` | **76** |
| **Chrome de Office** | `office/chrome/piezas.tsx`: `BotonCinta` con sus tres estados, `FichaHerramienta`, `PanelMaestro`, **`PortadaPractica`**; `chrome/ganchos.ts`: `useCajaDelObjetivo`, `useHuecoEnElBody`, `esDesvio` | las 3 ventanas → 61 labs |
| **Modo guía** | `office/motor/guia.ts`: `ubicar`, `ubicarPestana`, `comoLlegar`, `explicarDesvio` — **genérico, toma sus tablas por parámetro**; el sitio se deriva de la cinta, no se escribe | las 3 ventanas |

**Nota importante que corrige un error fácil:** el chasis 2D **sí existe** y lo usan 71 archivos. Lo que pasa es que cuatro laboratorios lo esquivaron y rehicieron la pantalla final a mano —`LabCompruebaLaRespuesta` (`.car-final`), `LabRealOGenerado` (`.rog-final`), `LabPreguntaALaIA` (`.pia-cierre`) y `LabSiAlgoMeIncomoda`—, y son justo cuatro de los que se van a extraer. Al extraerlos, vuelven al chasis.

### Pieza 0 · `VentanaBase` — lo que sí falta

El marco de ventana **no está compartido ni siquiera dentro de Office**: barra de título, cinta, backstage, zoom y el pintado del señalador están reimplementados en `VentanaTextos.tsx` (1 007 líneas), `VentanaHojas.tsx` (3 972) y `VentanaDiapositivas.tsx` (4 820). Lo que comparten es el botón, la ficha, el panel del maestro, la portada, dos ganchos y el CSS `txtw-*`.

Fuera de Office el efecto es peor:

- `LabVirusYAntivirus.tsx` (556 líneas) y `LabNubeOLocal.tsx` (629) son **la misma ventana escrita dos veces**: mismo marco, misma barra de título con marca + subtítulo + los tres puntitos, misma pantalla de arranque con `⏻ Encender`, mismo cuerpo maestro-detalle. Cambia el prefijo del CSS: `av-` en uno, `ex-` en el otro.
- Los tres laboratorios de correo redibujan a mano el marco, la barra, la columna de carpetas y la lista de la bandeja: **~545 líneas de anatomía repetida**, y `const BUZON = 'sofi.aprendiz@tecnia-escuela.mx'` declarado tres veces.
- **El modo guía y la portada de objetivos no existen fuera de Office.** Los 70 labs arcade no señalan ningún botón; su equivalente es Bit hablando. Y de portada sólo tienen la pantalla `Entrada*Base` de la unidad.

`VentanaBase` —marco, barra de título, arranque, hueco de contenido, señalador y portada— **no entra en la lista de armazones** por la prueba 1: no sé decir qué programa simula. Es el chrome. Se extrae primero, cuesta poco, y lo heredan los siete armazones que son ventanas. El modo guía viene detrás sin tocarle una línea, porque ya toma sus tablas por parámetro: es lo mismo que pasó al construir Excel sobre el chrome de Word.

**Punto de partida:** `LabVirusYAntivirus.tsx` líneas 407-519, diffeado contra `LabNubeOLocal.tsx`, más lo que `VentanaTextos.tsx` tiene de marco y no de Word. Destino: `src/components/labs/ventana/VentanaBase.tsx`.

### La otra deuda transversal: el arnés de sesión

Aparece **idéntico, comentarios incluidos, en los 70 laboratorios arcade**: `sim = useRef({ ocupado, errores, inicio })`, el espejo `vivo`, `propsRef`, `formatTiempo()`, `puntaje() = Math.max(60, Math.min(100, 100 - errores * 6))`, `restar()`, `avanzar()`, `terminar()` con `onComplete({ score, stars: 3, xp: score, errores, tiempoSegundos })` y `repetir()`. Son ~120 líneas por archivo.

Tampoco es un armazón: es la fontanería del contrato, y por eso se extrae aparte, como `useLabActividad(props, totalPasos)`. Va en `src/components/activities/lib/`, que hoy está casi vacío —tres archivos, y `usePointerDrag.ts` sin un solo consumidor fuera de sus pruebas—. Va antes que los diez armazones porque los diez lo van a usar.

---

## 3. Los diez armazones, por cuántas actividades desbloquean

| # | Armazón | Programa que simula | Desbloquea | Punto de partida |
|---|---|---|---|---|
| 1 | **Tecnia Código** | Thonny / VS Code / Replit | **18** | nada — desde cero (molde: `VentanaHojas`) |
| 2 | **Tecnia Asistente** | ChatGPT / Copilot | **16** | `LabPreguntaALaIA.tsx` |
| 3 | **Tecnia Web** | VS Code + Live Server / CodePen | **11** | nada — desde cero (comparte editor con #1) |
| 4 | **Tecnia Bloques** | Scratch / MakeCode / App Inventor | **8** | `n4/estudio/tecniaBloques.tsx` — **ya escrito al 80 %** |
| 5 | **Tecnia Muro** | Instagram / TikTok / LinkedIn | **8** | `LabRealOGenerado.tsx` + `LabSiAlgoMeIncomoda.tsx` |
| 6 | **Tecnia Diseño** | Canva / Figma | **8** | nada — desde cero |
| 7 | **Banco Físico 3D** | *(no es software: es materia)* | **7** | `LabDentroDelGabinete.tsx` + `arcade3d/piezas3d.tsx` |
| 8 | **Tecnia Escritorio** | Windows / Android / iOS / Linux | **6** | `LabExploraElEscritorio.tsx` + `LabVirusYAntivirus.tsx` |
| 9 | **Tecnia Navegador** | Chrome / Edge + su buscador | **6** | `LabCompruebaLaRespuesta.tsx` |
| 10 | **Tecnia Nube** | Microsoft 365 (Outlook, OneDrive, Planner) | **5** | `LabPartesDelCorreo.tsx` |
| — | *Ventanas de Office* | *ya construidas* | *7* | *se montan tal cual* |
| — | *Únicas* | — | *4* | — |

18 + 16 + 11 + 8 + 8 + 8 + 7 + 6 + 6 + 5 = **93**, más 7 de Office y 4 únicas = **104**.

---

### 1 · Tecnia Código — 18 actividades

**Qué simula.** Un editor de código con su consola: Thonny para el que empieza, VS Code para el que ya no. Barra de título con el nombre del archivo, editor con números de línea y coloreado, botón ▶ Ejecutar y ⏹ Parar, consola de salida abajo, y el error señalado **en su línea**, que es la mitad de aprender a programar.

**Qué recibe por parámetro.**

```ts
interface VentanaCodigoProps {
  archivo: string;                    // "retos.py" — sale en la barra de título
  lenguaje: 'python' | 'sql';
  plantilla: string;                  // el código con el que arranca la clase
  soloLectura?: number[];             // líneas que el alumno no puede tocar
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelDeClaseProps> };
  //   ↑ el árbol de tablas en las clases de SQL, la pila en las de algoritmos
  entradas?: string[];                // lo que responde input() cuando lo pida
  guion: GuionCodigo;                 // encargos, pistas y qué se señala en cada uno
  salida: 'consola' | 'tabla' | ((r: Ejecucion) => ReactNode);
  controles?: ControlesDeClase;       // herramientas que aporta la clase
  onAvance / onTerminado / onSalir / insignia / minutos
}
```

**La deuda de motor, y es la mayor del plan entero.** No hay ni un `textarea` de código en toda la plataforma: cero. Hace falta un intérprete de Python de subconjunto —números, cadenas, listas, diccionarios, `if`/`while`/`for`, `def`, `input`, `print`— con errores por línea. Es exactamente el problema del §46 con el evaluador de fórmulas, y se resuelve igual: **el intérprete se escribe, se mide y se cierra antes de la primera clase**, con su banco de pruebas propio. `programaBloques.ts` ya demuestra en este repo que un intérprete pequeño con tests se sostiene.

Anotado del §46: lo caro no fue el grafo, fue construir cadenas de texto. Aquí el equivalente es el coloreado y el repintado del editor en cada tecla.

**Las 18:** `n6-primeras-lineas-python`, `n7-variables-y-tipos`, `n7-entrada-y-salida`, `n7-condicionales-python`, `n7-bucles-python`, `n7-retos-python`, `n8-listas-y-diccionarios`, `n8-funciones-python`, `n8-proyectos-consola`, `n8-buenas-practicas`, `n9-busqueda-y-ordenamiento`, `n9-bases-de-datos-iniciales`, `n9-datos-con-python`, `n10-python-intermedio`, `n10-problemas-de-concurso`, `n10-analisis-con-codigo`, `n10-modela-tus-datos`, `n10-consultas-sql`.

**Dónde está el filo.** Las cuatro de SQL (`n9-bases-de-datos-iniciales`, `n10-modela-tus-datos`, `n10-consultas-sql`, y `n10-conecta-tus-datos` que va a Office) montan la misma ventana con `lenguaje: 'sql'`, el árbol de tablas en `panelFijo` y `salida: 'tabla'`. Es el mismo programa —DB Browser es un editor con una rejilla debajo—, pero si al escribirlas el esquema empieza a pedir un diagrama arrastrable, `n10-modela-tus-datos` se sale y pasa a única. **Que se decida al escribirla, no antes.**

---

### 2 · Tecnia Asistente — 16 actividades

**Qué simula.** Un asistente de IA conversacional. Barra de la app, hilo de burbujas, compositor. Ya existe medio construido en `LabPreguntaALaIA.tsx` (601 líneas, sin 3D) y en el panel izquierdo de `LabCompruebaLaRespuesta.tsx`.

**La regla que el armazón cierra por diseño.** Comprobado con grep sobre `src/components/activities`: **cero** `fetch`, cero SDK, cero `/api/`. Todas las respuestas son literales de un guion. El armazón lo vuelve estructural de dos maneras: recibe `mensajes: MensajeIA[]` **ya resueltos** y su compositor es de fichas, no un `textarea` libre. Sin entrada libre no hay tentación de conectar un modelo.

```ts
type MensajeIA =
  | { tipo: 'usuario'; texto: string }
  | { tipo: 'asistente'; texto: string }
  | { tipo: 'asistente-troceado'; partes: { id: string; texto: string; estado?: 'neutro'|'ok'|'mal' }[] }
  | { tipo: 'aviso'; texto: string };          // cuando el guion corta: dato personal

interface VentanaAsistenteProps {
  marca: string; subtitulo?: string;
  mensajes: MensajeIA[];
  compositor?: { titulo?: string; fichas: FichaPrompt[]; onEnviar: (id: string) => void };
  panel?: ReactNode;        // ← AQUÍ divergen las 16; ver abajo
  acciones?: { id: string; etiqueta: string; onClick: () => void }[];
  onTocarParte?: (id: string) => void; parteActiva?: string | null;
}
```

**El riesgo, dicho en alto: dieciséis clases sobre una ventana de chat pueden salir dieciséis veces la misma clase.** El armazón trae la ventana; el `panel` lo trae cada clase, y son distintos de verdad:

- **Banco de entrenamiento** (etiquetar ejemplos, entrenar, probar, ver dónde falla) → `n5-la-ia-aprende-con-datos`, `n7-como-aprende-la-ia`, `n8-sesgos-y-errores`, `n10-como-funcionan-los-modelos`.
- **Comparador** (la respuesta troceada en afirmaciones + las fuentes al lado) → `n7-verifica-a-la-ia`, `n9-ia-copiloto`.
- **Generador con marca** (texto/imagen/audio y de dónde salió) → `n6-crea-con-ia`, `n8-genera-con-ia`, `n8-etica-de-la-ia`.
- **Cuaderno de prompts** (el mismo encargo escrito de cinco maneras y qué cambia) → `n7-buenos-prompts`, `n10-flujos-con-ia`, `of-m365-copiloto`.
- **Panel de decisión** (casos y consecuencias) → `n5-la-ia-en-mi-vida`, `n5-uso-responsable-de-ia`, `n9-ia-y-trabajo`, `n10-etica-y-regulacion`.

**Si dos clases salen con el mismo panel y el mismo guion, se ha construido un motor de plantillas.** Es la señal de alarma de este armazón y hay que mirarla clase a clase.

**Las 16:** las listadas arriba, cinco paneles, ninguna repetida.

---

### 3 · Tecnia Web — 11 actividades

**Qué simula.** El editor con vista previa en vivo: pestañas de archivo (`index.html`, `estilo.css`, `guion.js`), el panel de la página renderizándose al lado, y un inspector que enseña la caja de cada elemento. Es CodePen; es VS Code con Live Server.

```ts
interface EstudioWebProps {
  archivos: { nombre: string; lenguaje: 'html'|'css'|'js'; texto: string; soloLectura?: boolean }[];
  vista: 'escritorio' | 'movil' | 'ambas';   // la de `n8-css-responsivo`
  inspector?: boolean;                        // la caja, el margen y el relleno señalados
  publicacion?: { dominio: string; pasos: PasoPublicar[] };  // n6-publica / n10-publica
  guion: GuionWeb; controles?: ControlesDeClase;
  onAvance / onTerminado / onSalir / insignia / minutos
}
```

**Comparte el editor con #1** —numeración, coloreado, aro del modo guía, error por línea—, así que construir #1 primero abarata #3 a la mitad. Ésa es la razón de peso para que el orden por cuenta y el orden por coste coincidan aquí.

**La decisión que hay que tomar al abrirlo, no después:** la vista previa pinta **el documento del propio alumno**, en un contenedor controlado. Eso no es «software real embebido» —lo que la regla prohíbe es meter Chrome o Word dentro—, pero el `js` de `n8-javascript-basico` sí necesita un guardián. Se decide al escribir el armazón y se escribe por qué.

**Las 11:** `n6-como-se-hace-una-pagina`, `n6-html-basico`, `n6-publica-tu-pagina`, `n7-html-estructura`, `n7-css-estilo`, `n7-tu-sitio-personal`, `n8-css-responsivo`, `n8-javascript-basico`, `n8-sitio-multipagina`, `n10-proyecto-web-real`, `n10-publica-tu-sitio`.

---

### 4 · Tecnia Bloques — 8 actividades

**Qué simula.** Scratch, MakeCode y App Inventor son el mismo programa con otra piel: paleta por categorías, guion que se arma arrastrando y anida, botón 🚩, y un escenario que obedece.

**Y ya está construido casi entero, sin que nadie lo haya llamado armazón.** `src/components/activities/n4/estudio/tecniaBloques.tsx` (49 KB) es un componente **100 % controlado, sin un solo `useState`**, con su interfaz de props en la línea 1067: `reto`, `fichas`, `categoria`, `programa`, `activo`, `corriendo`, `variable`, `caza`, `arreglo`, `onCategoria`, `onSoltar`, `onQuitar`, `onCorrer`, `onParar`. El intérprete es aparte y tiene pruebas: `programaBloques.ts` + `src/__tests__/programa-bloques.test.ts`. El escenario 3D ya entra por parámetro (`EstacionBloques3D`, `piezasN4U3.tsx:1351`).

Lo que falta para llamarlo armazón son tres cosas concretas:

1. **Subir la edición del árbol adentro.** `ponerCondicion`, `ponerOrden`, `quitarCondicion`, `quitarNodo` y `lecturaDe` están copiadas casi textuales en `LabSiPasaEsto` (222-293), `LabVariablesYPuntajes` (341-418) y `LabCreaTuVideojuego` (250-329). Es la duplicación número uno de este armazón.
2. **Sacarlo del monitor 3D.** Ver §5.
3. **Un motor de dos modos**: diferido (`simular`, que ya existe) y tiempo real (`motorJuego.ts`, que también).

**Las 8:** `n5-bloques-propios`, `n5-juego-con-niveles`, `n6-programa-un-microbit`, `n6-reto-robot`, `n6-bloques-vs-codigo`, `n8-disena-tu-videojuego`, `n9-construye-low-code`, `n9-automatiza-tareas`.

**Dos notas.** `n6-bloques-vs-codigo` monta #4 y #1 a la vez, uno al lado del otro: es literalmente lo que enseña. Y `n6-programa-un-microbit` no lleva 3D: el simulador de MakeCode es una placa en SVG, y ahí la placa entra como `escenario`.

**Deuda heredada que este armazón paga de paso:** `LabEventosYMovimiento.tsx` y `LabMiPrimeraAnimacion.tsx` (N3) **aparentan Scratch y entregan un puzzle de ordenar**: el riel tiene ranuras fijas precalculadas y al pulsar 🚩 no se interpreta nada, se reproduce un array escrito a mano. No se extrae nada de ahí: se reescriben encima del armazón, y ahí es donde más vale.

---

### 5 · Tecnia Muro — 8 actividades

**Qué simula.** Una red social: muro con publicaciones, perfil, ajustes de privacidad y mensajes directos. Las cuatro cosas viven en el mismo programa —Instagram las tiene—, y las cuatro hacen falta.

Hay dos mitades ya escritas y sin juntar: `LabRealOGenerado.tsx` (810 líneas, sin 3D) tiene la tarjeta de publicación completa —cabecera con cuenta verificada, marcador de imagen sin archivo, paneles con candado, fila de veredicto—, y `LabSiAlgoMeIncomoda.tsx` (649, sin 3D) tiene la app de mensajes entera: lista de conversaciones con avatar y punto de nuevo, hilo con burbujas de cinco variantes, y el pie de opciones **donde el alumno nunca teclea**, que es la decisión de diseño que hay que conservar.

```ts
interface TecniaMuroProps {
  marca: string;
  vista: 'muro' | 'perfil' | 'ajustes' | 'mensajes';
  publicaciones?: PublicacionMuro[];
  perfil?: FichaCuenta;
  ajustes?: { grupos: GrupoAjuste[]; onCambiar: (id: string, v: unknown) => void };
  conversaciones?: ContactoMsg[]; hilo?: ItemHilo[];
  respuestas?: { pregunta: string; opciones: OpcionRespuesta[]; onElegir: (id: string) => void };
  herramientas?: { id: string; icono: string; etiqueta: string; bloqueada?: boolean }[];
  onAlternarHerramienta?: (id: string) => void;
  veredicto?: { opciones: OpcionVeredicto[]; onElegir: (id: string) => void; bloqueado?: boolean };
}
```

Lo que hace falta escribir nuevo es **la vista de ajustes de privacidad** —quién ve qué, y que al cambiarlo se vea cambiar el muro—, que es el contenido de tres de las ocho.

**Las 8:** `n5-lo-que-publico-permanece`, `n5-mi-identidad-digital`, `n6-contrasenas-fuertes`, `n6-privacidad-en-juegos`, `n6-alto-al-ciberacoso`, `n7-privacidad-en-redes`, `n7-riesgos-y-marco-legal`, `n9-marca-personal`.

---

### 6 · Tecnia Diseño — 8 actividades

**Qué simula.** Canva y Figma: lienzo, capas, plantillas, banco de recursos con su licencia, línea de tiempo cuando lo que se monta es video, y exportar. No hay nada parecido construido; `LabPintaConLaCompu.tsx` (N1, 641 líneas) es un lienzo de pintar, no un editor de capas.

```ts
interface EstudioDisenoProps {
  documento: { ancho: number; alto: number; capas: Capa[] };
  herramientas: HerramientaDiseno[];         // texto, forma, imagen, recorte, máscara
  banco?: { recursos: Recurso[] };            // cada uno con su licencia visible
  linea?: { pistas: PistaTiempo[]; duracion: number };   // sólo video y audio
  plantillas?: Plantilla[];
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelDeClaseProps> };
  guion: GuionDiseno; controles?: ControlesDeClase;
}
```

**Cuadricular, no medir** (§39): el lienzo va a rejilla y las guías se derivan, igual que en `VentanaDiapositivas`. Ahí hay una prueba de concepto que pasó con 0 épsilons y no hay que volver a descubrirla.

**Las 8:** `n5-planea-tu-proyecto` (guion gráfico del juego), `n6-carteles-e-infografias`, `n6-edita-imagen-y-video`, `n8-imagen-con-capas`, `n8-video-y-audio`, `n9-boceta-tu-app`, `n9-pruebas-con-usuarios`, `n10-ux-ui`.

**La más floja del grupo es `n9-pruebas-con-usuarios`**: usa el prototipo del armazón pero lo que enseña es mirar a alguien usarlo. Si al escribirla el armazón sólo aporta el lienzo, declárala única y no la fuerces.

---

### 7 · Banco Físico 3D — 7 actividades

**Qué es.** El único armazón que no simula software, y por eso el único que lleva 3D: piezas y cables en un espacio, cámara orbital, encaje por proximidad, herramienta en la mano. Ya está construido de hecho en `LabDentroDelGabinete.tsx` (N7, 569 líneas) y en `n1-conecta-el-equipo`, y `arcade3d/piezas3d.tsx` da el rig.

```ts
interface BancoFisico3DProps {
  modelo: ReactNode;                    // el gabinete, la placa, la casa
  piezas: Pieza3D[];                    // con su encaje y su tolerancia
  puertos: Punto3D[];
  herramientas?: Herramienta3D[];
  sonda?: boolean;                      // medir, no adivinar
  guion: GuionFisico;
  respaldo: ReactNode;                  // la cara sin WebGL, con los mismos aria-label
}
```

`respaldo` no es opcional: las pruebas corren en jsdom y los cinco laboratorios 3D existentes ya pasan las dos caras a `ArcadeSala3D`.

**La regla que este armazón tiene prohibido romper.** `ControlHtml` (`arcade3d/piezas3d.tsx:56`) renderiza `<Html transform={false} center>`: modo cartel, el DOM se ancla en 3D pero **no se proyecta sobre la superficie ni se ocluye**. Ése es exactamente el defecto por el que `LabCreaTuVideojuego` quedó declarado inutilizable —escena WebGL con la interfaz plana pegada encima— y `LabDepuraTuJuego` lo tiene igual. **En este armazón no hay interfaz escrita encima: lo que se toca son las piezas.** Cualquier control que no sea una pieza va fuera de la escena, en el chasis.

Y el corolario para #4: el editor de bloques **sale del monitor 3D** y pasa a ser ventana 2D honesta, con el escenario 3D dentro de ella y no al revés. Es lo más barato de los tres arreglos posibles, es lo que se lee en pantalla pequeña, y es lo que ya hace `VentanaHojas`.

**Las 7:** ver §6.

---

### 8 · Tecnia Escritorio — 6 actividades

**Qué simula.** El sistema operativo: iconos, ventanas con su ✕, barra de tareas con inicio y reloj, y las ventanas del propio sistema —explorador, configuración, centro de seguridad, administrador de tareas, calculadora—. Windows, Android, iOS y Linux son cuatro pieles del mismo armazón, que es justo lo que `n7-sistemas-operativos` enseña.

Existe a medias y atado: `MonitorEscritorio3D` (`n3/arcade/piezasN3U2.tsx:296`) tiene el escritorio entero dentro de un `<Html>` —a propósito, por el hit-testing— con un solo consumidor. Se saca el `<Html>` interno (líneas 349-413) del mueble 3D y se queda en DOM. Las ventanas del sistema son la Pieza 0 con contenido: `LabVirusYAntivirus` es ya un centro de seguridad.

> **CORREGIDO el 15-ago-2026, midiendo.** Este párrafo decía además que «`LabNubeOLocal` es ya un explorador», **y es falso**. Leído entero (629 líneas), no es un explorador: es un juego de dos paneles —«decide dónde guardar y mira la consecuencia»— con nueve archivos fijos y una elección `local | nube | ambos` por archivo. **No tiene árbol de carpetas, ni navegación, ni renombrar, ni mover, ni copiar, ni borrar, ni papelera, ni búsqueda, ni espacio en disco.** El armazón `src/components/simuladores/sistema/` se escribió de cero por esto, no como extracción. *Lección para quien lea el resto de este documento: las afirmaciones de «esto ya existe» de este canon salieron de una auditoría rápida y **hay que medirlas antes de fiarse**. Tres se han comprobado ciertas (`tecniaBloques` al 80%, la semilla de navegador en `LabCompruebaLaRespuesta`, el muro cosido a mano en `LabLoQuePublicoPermanece`) y ésta salió falsa.*

**Las 6:** `n7-binario-y-unidades` (calculadora en modo programador + los tamaños del explorador), `n7-sistemas-operativos`, `n7-equilibrio-digital` (tiempo de uso), `n8-habitos-de-proteccion`, `n10-amenazas-y-defensa`, `n10-identidad-y-cifrado`.

---

### 9 · Tecnia Navegador — 6 actividades

**Qué simula.** Un navegador: pestañas, barra de direcciones con su candado, página, y el buscador **como una pestaña más**. Eso último no es una propuesta: `LabCompruebaLaRespuesta.tsx` ya lo hace así —la lista de resultados es `TabId = 'resultados'` y reusa el mismo tipo `Fuente` que las páginas de contenido—. Buscador y navegador son un armazón, no dos.

```ts
interface PaginaWeb {
  id: string; pestana: string; url: string; titulo: string;
  autor: string | null; fecha: string | null;
  cuerpo: { tipo: 'articulo'; parrafos: string[] }
        | { tipo: 'resultados'; consulta: string; resultados: ResultadoBusqueda[] }
        | { tipo: 'vacio'; mensaje: string }
        | { tipo: 'libre'; contenido: ReactNode };
  certificado?: { emisor: string; valido: boolean };   // el candado, n8-cifrado-basico
  senales?: { id: string; tono: 'buena'|'alerta'; texto: string; explica: string }[];
}
```

**Las 6:** `n8-cifrado-basico` (http vs https, el candado, el certificado), `n8-derechos-y-licencias` (banco de imágenes con el filtro de licencia), `n9-ecommerce-y-marketing`, `n9-empleos-tecnologicos`, `n10-carreras-ciber`, `n10-carreras-y-certificaciones`.

**Aviso honesto sobre las tres últimas.** `n9-empleos-tecnologicos`, `n10-carreras-ciber` y `n10-carreras-y-certificaciones` son «navegar y leer fichas». El armazón les sirve, pero son las tres más flojas del canon entero: si al escribirlas salen tres veces el mismo ejercicio, el problema no es el armazón, es que hacen falta tres mecánicas distintas y hay que inventarlas. Escríbanse en tres tandas separadas, no seguidas.

**Bonus de porteo:** `LabBuscaConPalabrasClave` y `LabDetectorDeSitiosConfiables` (N3) son este mismo contenido montado sobre muebles 3D. Portarlos jubilaría del orden de 2 400 líneas de piezas 3D.

---

### 10 · Tecnia Nube — 5 actividades

**Qué simula.** Microsoft 365: bandeja de correo, calendario, archivos compartidos con historial de versiones y coautoría, y tablero de tareas.

> **CORREGIDO el 15-ago-2026, midiendo. Esta fila estaba mal de dos maneras.**
>
> **1 · No es un armazón, son cuatro programas.** Se construyeron por separado y así se reparten sus 5 filas: `simuladores/nube/` (archivos, compartir, conflicto, sin conexión) sirve a `n5-documentos-compartidos` y `n9-trabajo-colaborativo`; `simuladores/correo/` a `n8-malware-e-ingenieria-social`; `simuladores/tablero/` a `n9-gestiona-tu-proyecto`; `simuladores/agenda/` a `of-m365-calendario`. Agruparlos por tema —«Microsoft 365»— y no por programa fue el error de método de este canon, y se repitió en varias filas.
>
> **2 · Este párrafo decía que `LabPartesDelCorreo.tsx` «ya tiene el cliente de correo completo de un extremo a otro», y es falso.** Leído entero (1 363 líneas), es **la anatomía de un correo dibujada a mano**: tiene el marco, la columna de carpetas, la lista y el panel de lectura, pero **ni un mensaje como dato** —`CORREO_ABIERTO` es una constante y el panel la pinta siempre—, **las cuatro carpetas están `disabled`**, las tres filas de la bandeja no seleccionan nada (las tres llaman a `tocarZona('hora')`, línea 987), y **no existe ninguna de las cinco acciones** (responder, responder a todos, reenviar, marcar, borrar). Fue obra nueva, no extracción. *Causa del error: se midió por lo que se ve en pantalla y no por lo que hay detrás.* Quien sí tenía modelada la mentira del remitente era `LabAtrapaElPhishing.tsx`, en constantes privadas.

`LabEnviaRespondeAdjunta` es el banco de pruebas —tres ventanas flotantes a la vez, botonera al pie, lista que cambia de fuente— y `LabAtrapaElPhishing` es el que obliga a que el armazón **no dependa del monitor 3D**: se monta a pantalla completa.

La clave del diseño: **`lectura` es un hueco opaco**. Ahí es donde las clases divergen de verdad (zonas señalables, lupas, veredicto) y no hay abstracción que las una sin romperlas.

**Las 5:** `n5-documentos-compartidos`, `n8-malware-e-ingenieria-social` (el phishing entra por la bandeja), `n9-trabajo-colaborativo`, `n9-gestiona-tu-proyecto` (tablero), `of-m365-calendario`.

---

## 4. La tabla de las 104

Columna **armazón**: `CÓDIGO` · `IA` · `WEB` · `BLOQUES` · `MURO` · `DISEÑO` · `3D` · `SO` · `NAVEGADOR` · `NUBE` · `OFFICE` (ya construido) · `ÚNICA`.

### N5 · Datos y proyectos — 11

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 1 | `n5-conecta-perifericos` | El sistema de cómputo | **3D** | Enchufa teclado, ratón, monitor y bocinas en los puertos de detrás; cada uno con su forma y su color. |
| 2 | `n5-manos-al-mantenimiento` | El sistema de cómputo | **3D** | Abre el gabinete, sopla el polvo, reasienta la RAM y vuelve a cerrar sin dejar tornillos. |
| 3 | `n5-bloques-propios` | Bloques III | **BLOQUES** | Empaqueta cinco bloques repetidos en uno propio y lo llama desde dos sitios. |
| 4 | `n5-juego-con-niveles` | Bloques III | **BLOQUES** | Arma un juego de tres niveles con mensajes entre escenas. |
| 5 | `n5-planea-tu-proyecto` | Bloques III | **DISEÑO** | Guion gráfico del proyecto: pantallas, qué pasa en cada una, qué falta. |
| 6 | `n5-la-ia-en-mi-vida` | IA a mi alcance | **IA** | Panel de decisión: dónde hay IA en su día y dónde sólo lo parece. |
| 7 | `n5-la-ia-aprende-con-datos` | IA a mi alcance | **IA** | Banco de entrenamiento: etiqueta ejemplos, entrena, prueba y ve fallar lo que no enseñó. |
| 8 | `n5-uso-responsable-de-ia` | IA a mi alcance | **IA** | Casos: qué se le pregunta a un asistente y qué no, y qué se cita. |
| 9 | `n5-lo-que-publico-permanece` | Mi huella digital | **MURO** | Publica, borra, y encuentra la copia que quedó. |
| 10 | `n5-mi-identidad-digital` | Mi huella digital | **MURO** | Arma un perfil y mira qué cuenta de ella sin querer. |
| 11 | `n5-documentos-compartidos` | Mi huella digital | **NUBE** | Comparte un archivo, elige permisos y revisa quién entró. |

### N6 · Integro y comparto — 15

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 12 | `n6-carteles-e-infografias` | Diseño y multimedia | **DISEÑO** | Un cartel con jerarquía: qué va grande, qué va arriba, qué sobra. |
| 13 | `n6-edita-imagen-y-video` | Diseño y multimedia | **DISEÑO** | Recorta, ajusta y monta tres clips con música en la línea de tiempo. |
| 14 | `n6-crea-con-ia` | Diseño y multimedia | **IA** | Generador con marca: pide una imagen, la usa y la cita. |
| 15 | `n6-que-es-un-robot` | Robótica y STEAM | **3D** | Señala sensores y actuadores sobre un robot y ve qué hace cada uno. |
| 16 | `n6-programa-un-microbit` | Robótica y STEAM | **BLOQUES** | Programa la placa en bloques; el escenario es la placa en pantalla. |
| 17 | `n6-reto-robot` | Robótica y STEAM | **BLOQUES** | Resuelve un recorrido con sensores; escenario de arena, sin 3D. |
| 18 | `n6-como-se-hace-una-pagina` | Mi primera página web | **WEB** | Ve el código detrás de una página y cambia una línea. |
| 19 | `n6-html-basico` | Mi primera página web | **WEB** | Etiquetas de estructura: títulos, párrafos, listas, imagen y enlace. |
| 20 | `n6-publica-tu-pagina` | Mi primera página web | **WEB** | Publica en un dominio de práctica y comparte la dirección. |
| 21 | `n6-bloques-vs-codigo` | De bloques a texto | **BLOQUES** | El mismo programa en las dos ventanas a la vez, línea contra bloque. |
| 22 | `n6-primeras-lineas-python` | De bloques a texto | **CÓDIGO** | `print`, una variable y un `if`: el primer archivo `.py`. |
| 23 | `n6-contrasenas-fuertes` | Ciberseguridad | **MURO** | Crea contraseña, ve el medidor y activa la verificación en dos pasos. |
| 24 | `n6-privacidad-en-juegos` | Ciberseguridad | **MURO** | Ajusta quién ve qué y comprueba en el muro que cambió. |
| 25 | `n6-alto-al-ciberacoso` | Ciberseguridad | **MURO** | Recibe, reconoce, reporta y bloquea; y avisa a un adulto. |
| 26 | `n6-proyecto-integrador` | Proyecto integrador | **ÚNICA** | Cierre de primaria: investigar, analizar, diseñar y presentar. |

### N7 · Bajo el cofre — 17

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 27 | `n7-binario-y-unidades` | Arquitectura y sistemas | **SO** | Calculadora en modo programador y los tamaños reales del explorador. |
| 28 | `n7-sistemas-operativos` | Arquitectura y sistemas | **SO** | El mismo escritorio en cuatro pieles: Windows, Android, iOS, Linux. |
| 29 | `n7-diagnostica-y-soluciona` | Arquitectura y sistemas | **3D** | El equipo no arranca: mide, abre, cambia la pieza y comprueba. |
| 30 | `n7-variables-y-tipos` | Python I | **CÓDIGO** | Guarda datos en variables y ve qué pasa al mezclar tipos. |
| 31 | `n7-entrada-y-salida` | Python I | **CÓDIGO** | `input` y `print`: el programa pregunta y responde. |
| 32 | `n7-condicionales-python` | Python I | **CÓDIGO** | `if`/`elif`/`else` y el error de sangría en su línea. |
| 33 | `n7-bucles-python` | Python I | **CÓDIGO** | `for` y `while`, y el bucle infinito con su ⏹. |
| 34 | `n7-retos-python` | Python I | **CÓDIGO** | Cinco retos cortos con pruebas que pasan o no. |
| 35 | `n7-html-estructura` | Desarrollo web I | **WEB** | Estructura semántica: cabecera, secciones, pie. |
| 36 | `n7-css-estilo` | Desarrollo web I | **WEB** | Colores, tipografías y el modelo de cajas con el inspector. |
| 37 | `n7-tu-sitio-personal` | Desarrollo web I | **WEB** | Proyecto de tres páginas enlazadas con estilo propio. |
| 38 | `n7-privacidad-en-redes` | Ciudadanía crítica | **MURO** | Recorre los ajustes reales y deja la cuenta como la quiere. |
| 39 | `n7-riesgos-y-marco-legal` | Ciudadanía crítica | **MURO** | Conversaciones directas: reconocer el patrón, cortar, guardar prueba, denunciar. |
| 40 | `n7-equilibrio-digital` | Ciudadanía crítica | **SO** | Panel de tiempo de uso: mira el suyo y pone límites. |
| 41 | `n7-como-aprende-la-ia` | IA I | **IA** | Banco de entrenamiento con datos torcidos a propósito. |
| 42 | `n7-buenos-prompts` | IA I | **IA** | Cuaderno de prompts: el mismo encargo de cinco maneras. |
| 43 | `n7-verifica-a-la-ia` | IA I | **IA** | Comparador: trocea la respuesta y busca cada afirmación. |

### N8 · Construyo soluciones — 22

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 44 | `n8-listas-y-diccionarios` | Python II | **CÓDIGO** | Guarda muchos datos y búscalos por posición y por clave. |
| 45 | `n8-funciones-python` | Python II | **CÓDIGO** | `def`, parámetros y retorno; la misma idea que el bloque propio. |
| 46 | `n8-proyectos-consola` | Python II | **CÓDIGO** | Un juego de consola, una calculadora y un bot de respuestas. |
| 47 | `n8-buenas-practicas` | Python II | **CÓDIGO** | Nombres, comentarios y depurar leyendo el error, no adivinando. |
| 48 | `n8-css-responsivo` | Desarrollo web II | **WEB** | Vista doble escritorio/móvil y los puntos de quiebre. |
| 49 | `n8-javascript-basico` | Desarrollo web II | **WEB** | La página responde: un botón que hace algo. |
| 50 | `n8-sitio-multipagina` | Desarrollo web II | **WEB** | Varias páginas, navegación común y publicación. |
| 51 | `n8-limpieza-de-datos` | Datos y análisis | **OFFICE** | Duplicados, relleno rápido y formato: monta `VentanaHojas`. |
| 52 | `n8-tablas-dinamicas` | Datos y análisis | **OFFICE** | Mil filas en cinco; `VentanaHojas` con su motor de dinámicas. |
| 53 | `n8-visualizacion-efectiva` | Datos y análisis | **OFFICE** | Elegir la gráfica que no miente; `VentanaHojas`. |
| 54 | `n8-concluye-con-datos` | Datos y análisis | **OFFICE** | Del número a la frase: qué dicen los datos y qué no. |
| 55 | `n8-ip-wifi-servidores` | Redes y ciberseguridad | **ÚNICA** | Simulador de red: nodos, rutas y el paquete que viaja. |
| 56 | `n8-malware-e-ingenieria-social` | Redes y ciberseguridad | **NUBE** | Diez correos en la bandeja; cuáles muerden y por qué. |
| 57 | `n8-cifrado-basico` | Redes y ciberseguridad | **NAVEGADOR** | El candado, el certificado y qué se ve en http y en https. |
| 58 | `n8-habitos-de-proteccion` | Redes y ciberseguridad | **SO** | Actualizaciones, copias, permisos y el centro de seguridad. |
| 59 | `n8-imagen-con-capas` | Multimedia | **DISEÑO** | Capas, máscara y orden: lo de arriba tapa lo de abajo. |
| 60 | `n8-video-y-audio` | Multimedia | **DISEÑO** | Guion, cortes y música en la línea de tiempo. |
| 61 | `n8-disena-tu-videojuego` | Multimedia | **BLOQUES** | Mecánica, niveles y probarlo con alguien que no lo hizo. |
| 62 | `n8-derechos-y-licencias` | Multimedia | **NAVEGADOR** | Busca imágenes con filtro de licencia y lee lo que permite. |
| 63 | `n8-genera-con-ia` | IA II | **IA** | Generador: texto, imagen y audio, y de dónde salió cada uno. |
| 64 | `n8-sesgos-y-errores` | IA II | **IA** | Banco de entrenamiento sesgado: se ve el sesgo en la salida. |
| 65 | `n8-etica-de-la-ia` | IA II | **IA** | Plagio, deepfakes y citar a la IA, con el muro al lado. |

### N9 · Del prototipo al producto — 18

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 66 | `n9-boceta-tu-app` | Desarrollo de aplicaciones | **DISEÑO** | Pantallas, flujo y qué pasa al tocar cada cosa. |
| 67 | `n9-construye-low-code` | Desarrollo de aplicaciones | **BLOQUES** | Diseñador de pantalla más bloques, como App Inventor. |
| 68 | `n9-pruebas-con-usuarios` | Desarrollo de aplicaciones | **DISEÑO** | Da el prototipo a alguien, mira dónde tropieza, apunta y arregla. |
| 69 | `n9-busqueda-y-ordenamiento` | Algoritmos y datos | **CÓDIGO** | Dos algoritmos paso a paso y cuántas comparaciones cuesta cada uno. |
| 70 | `n9-bases-de-datos-iniciales` | Algoritmos y datos | **CÓDIGO** | Tablas, registros y la primera consulta; modo SQL. |
| 71 | `n9-datos-con-python` | Algoritmos y datos | **CÓDIGO** | Lee un archivo, cuenta, ordena y saca una conclusión. |
| 72 | `n9-trabajo-colaborativo` | Nube y colaboración | **NUBE** | Dos personas en el mismo archivo, historial y choques. |
| 73 | `n9-gestiona-tu-proyecto` | Nube y colaboración | **NUBE** | Tablero de tareas: columnas, dueños y fechas. |
| 74 | `n9-sensores-iot` | Robótica e IoT | **3D** | Coloca sensores en el espacio y ve qué mide cada uno. |
| 75 | `n9-casa-inteligente` | Robótica e IoT | **3D** | Recorre una casa conectada y descubre qué habla con qué. |
| 76 | `n9-automatiza-un-espacio` | Robótica e IoT | **3D** | Proyecto: reglas sobre la casa y que funcione sola. |
| 77 | `n9-marca-personal` | Emprendimiento | **MURO** | Perfil profesional: qué se enseña y qué se guarda. |
| 78 | `n9-ecommerce-y-marketing` | Emprendimiento | **NAVEGADOR** | Una tienda simulada: ficha, carrito y de dónde viene la visita. |
| 79 | `n9-empleos-tecnologicos` | Emprendimiento | **NAVEGADOR** | Bolsa de trabajo: qué pide cada puesto y qué le falta a él. |
| 80 | `n9-automatiza-tareas` | IA y automatización | **BLOQUES** | Constructor de flujos: cuando pase esto, haz esto otro. |
| 81 | `n9-ia-copiloto` | IA y automatización | **IA** | Comparador: la IA propone, él revisa y decide. |
| 82 | `n9-ia-y-trabajo` | IA y automatización | **IA** | Panel de decisión: qué oficios cambian y en qué. |
| 83 | `n9-proyecto-integrador` | Proyecto integrador | **ÚNICA** | Cierre de secundaria: problema real, solución digital. |

### N10 · Perfil profesional — 18

| # | id | unidad | armazón | qué hace |
|---|---|---|---|---|
| 84 | `n10-python-intermedio` | Programación aplicada | **CÓDIGO** | Archivos, módulos y una librería; el programa crece. |
| 85 | `n10-problemas-de-concurso` | Programación aplicada | **CÓDIGO** | Problemas con juez: entrada, salida y tiempo. |
| 86 | `n10-analisis-con-codigo` | Programación aplicada | **CÓDIGO** | Analiza un conjunto de datos y dibuja el resultado. |
| 87 | `n10-modela-tus-datos` | Bases de datos y SQL | **CÓDIGO** | Tablas, campos y relaciones; el esquema en el panel fijo. |
| 88 | `n10-consultas-sql` | Bases de datos y SQL | **CÓDIGO** | `SELECT`, filtros y una unión; salida en rejilla. |
| 89 | `n10-conecta-tus-datos` | Bases de datos y SQL | **OFFICE** | La consulta aterriza en la hoja: `VentanaHojas` con datos de fuera. |
| 90 | `n10-proyecto-web-real` | Desarrollo web integral | **WEB** | Un sitio de verdad con HTML, CSS y JS. |
| 91 | `n10-publica-tu-sitio` | Desarrollo web integral | **WEB** | Publicación, dominio y qué revisar antes de dar la dirección. |
| 92 | `n10-ux-ui` | Desarrollo web integral | **DISEÑO** | Jerarquía, contraste y espacio: la misma pantalla, mejor. |
| 93 | `n10-como-funcionan-los-modelos` | IA y ciencia de datos | **IA** | Banco de entrenamiento: qué aprende, qué memoriza y dónde se rompe. |
| 94 | `n10-flujos-con-ia` | IA y ciencia de datos | **IA** | Cuaderno de prompts encadenados dentro de un trabajo real. |
| 95 | `n10-etica-y-regulacion` | IA y ciencia de datos | **IA** | Panel de decisión con casos y la norma que aplica. |
| 96 | `n10-amenazas-y-defensa` | Ciberseguridad profesional | **SO** | Centro de seguridad: detectar, contener y explicar. |
| 97 | `n10-identidad-y-cifrado` | Ciberseguridad profesional | **SO** | Llavero, factores de autenticación y cifrar la unidad. |
| 98 | `n10-carreras-ciber` | Ciberseguridad profesional | **NAVEGADOR** | Perfiles de puesto reales y qué camino lleva a cada uno. |
| 99 | `n10-capstone` | Capstone y portafolio | **ÚNICA** | Proyecto final documentado de principio a fin. |
| 100 | `n10-portafolio-y-cv` | Capstone y portafolio | **OFFICE** | El currículum en `VentanaTextos`, con estilos y PDF. |
| 101 | `n10-carreras-y-certificaciones` | Capstone y portafolio | **NAVEGADOR** | Qué certifica cada examen y qué pide cada carrera. |

### Sala de Office · Microsoft 365 — 3

| # | id | grado | armazón | qué hace |
|---|---|---|---|---|
| 102 | `of-m365-calendario` | intermedio | **NUBE** | Crear cita, invitar, aceptar y leer la semana. |
| 103 | `of-m365-otra-caja` | avanzado | **OFFICE** | Las tres ventanas con piel de Google: Docs, Sheets, Slides. |
| 104 | `of-m365-copiloto` | avanzado | **IA** | Cuaderno de prompts dentro de una ventana de Office; qué hace y qué no. |

**Cuadre:** CÓDIGO 18 · IA 16 · WEB 11 · BLOQUES 8 · MURO 8 · DISEÑO 8 · 3D 7 · SO 6 · NAVEGADOR 6 · NUBE 5 · OFFICE 7 · ÚNICA 4 = **104**.

---

## 5. Las que no encajan en ningún armazón — 4

Decir «ésta es única» es una respuesta. Forzarla, no.

| id | Por qué no encaja |
|---|---|
| `n6-proyecto-integrador` | Es integradora por definición: investigar, analizar, diseñar y presentar cruza cuatro armazones distintos en una sesión. Lo que necesita no es un programa, es un **hilo** que lleve del uno al otro y guarde el trabajo por el camino. Si se le asigna un armazón, se convierte en una clase más de ese armazón y deja de ser el cierre de primaria. |
| `n9-proyecto-integrador` | Igual, con más piezas: problema real → app, sitio o análisis. La rama la elige el alumno, así que el «armazón» sería un selector de armazones. |
| `n10-capstone` | Igual, y además documentado: la entrega es tanto el proyecto como la memoria. |
| `n8-ip-wifi-servidores` | Una red no es un programa: es un mapa de nodos y un paquete que viaja. Ningún armazón de ventana la sirve. **Pero no nace de cero:** `LabElViajeDeUnMensaje.tsx` (N4, 371 líneas) ya hizo la versión sencilla y ésta es la misma idea con IP, wifi y servidores encima. |

Las tres integradoras comparten forma. Si al construirlas resulta que las tres piden lo mismo —un hilo de fases con entregas y un portafolio donde se acumula—, entonces ahí hay un armazón número once y se declara. **No se declara antes de tener las tres escritas**: eso es exactamente el error que §45 encontró en Excel, cuentas que cuadran y reparto que no.

---

## 6. Las que llevan 3D — 7 de 104

3D sólo donde el 3D **es** el contenido. Una escena 3D con la interfaz escrita encima está rechazada y ya costó un laboratorio inutilizable. Si dudo, no es 3D.

| id | Justificación, en una línea |
|---|---|
| `n5-conecta-perifericos` | El cable entra por detrás y sólo encaja en un puerto: sin espacio no hay ejercicio. |
| `n5-manos-al-mantenimiento` | Abrir, soplar, reasentar y cerrar es una secuencia de manos sobre materia. |
| `n6-que-es-un-robot` | El sensor está en un sitio del cuerpo del robot y el actuador en otro; el sitio es la lección. |
| `n7-diagnostica-y-soluciona` | Hay que abrir el equipo, mirar dentro y cambiar la pieza que falla. |
| `n9-sensores-iot` | Un sensor mide **dónde está puesto**: colocarlo mal es el error que enseña. |
| `n9-casa-inteligente` | La casa es el contenido; una lista de dispositivos no dice que el sensor de la puerta está en la puerta. |
| `n9-automatiza-un-espacio` | Proyecto sobre la misma casa: la regla se comprueba viéndola dispararse en su habitación. |

**Las que parecían 3D y no lo son, con el motivo:**

- `n6-programa-un-microbit` y `n6-reto-robot` → **BLOQUES**. Lo que se enseña es el programa; la placa es un dibujo y la arena, una cuadrícula. El simulador de MakeCode es SVG plano y le sobra.
- `n8-disena-tu-videojuego` → **BLOQUES**. Mecánicas y niveles, no volumen.
- `n7-binario-y-unidades` → **SO**. Es una calculadora, y una calculadora es software.
- Todo lo que es una pantalla —correo, chat, muro, navegador, editor— es software y se construye como software. Ésa es la regla, y de las 104 la cumplen 97.

---

## 7. Qué se extrae y qué se escribe de cero

### Se extrae de código que ya funciona (6 armazones)

| Armazón | De dónde sale | Cuánto hay |
|---|---|---|
| **BLOQUES** | `n4/estudio/tecniaBloques.tsx` (49 KB, componente controlado, props en línea 1067) + `programaBloques.ts` con pruebas + `motorJuego.ts` + `EstacionBloques3D` | **~80 %.** Falta subir la edición del árbol adentro y sacarlo del monitor 3D. |
| **NUBE** | ~~`LabPartesDelCorreo.tsx` (1 363 líneas, anatomía completa)~~ **Medido el 15-ago-2026: ~0 %.** Es la anatomía dibujada, no el programa — sin mensajes como dato, sin carpetas vivas, sin ninguna de las cinco acciones. Ver la corrección en la sección 10. | **Se escribieron los cuatro de cero**: `nube/`, `correo/`, `tablero/`, `agenda/`. |
| **IA** | `LabPreguntaALaIA.tsx` (601, sin 3D) + el panel troceado de `LabCompruebaLaRespuesta.tsx` | **~50 %.** La ventana está; los cinco paneles, no. |
| **NAVEGADOR** | `LabCompruebaLaRespuesta.tsx` líneas 678-808: pestañas, barra de dirección, página con autor y fecha, y la SERP ya como pestaña | **~60 %.** Falta el tipo `ResultadoBusqueda` (no existe en el repo) y el candado. |
| **MURO** | `LabRealOGenerado.tsx` líneas 682-804 (tarjeta) + `LabSiAlgoMeIncomoda.tsx` líneas 521-646 (mensajes) | **~60 %.** Falta la vista de ajustes de privacidad. |
| **3D** | `LabDentroDelGabinete.tsx`, `n1-conecta-el-equipo`, `arcade3d/piezas3d.tsx`, `EscenaArcade3D.tsx` | **~70 %**, con la prohibición de `<Html transform={false}>` para controles. |

Y **Pieza 0** (`VentanaBase`) sale de diffear `LabVirusYAntivirus.tsx` contra `LabNubeOLocal.tsx`: son la misma ventana con dos prefijos de CSS. Con ella entran gratis la portada de objetivos (`PortadaPractica`) y el modo guía (`office/motor/guia.ts`), que ya son genéricos por parámetro y hoy sólo los ve Office.

Y **OFFICE** no se extrae ni se escribe: `VentanaHojas`, `VentanaTextos` y `VentanaDiapositivas` ya están cerradas y sirven a 7 pendientes tal cual. Coste cero.

### Se escribe de cero (3 armazones)

| Armazón | Qué falta | Deuda de motor |
|---|---|---|
| **CÓDIGO** | Todo. **No hay un solo `textarea` de código en la plataforma.** | **La mayor del plan:** intérprete de Python de subconjunto con errores por línea. Se escribe, se mide y se cierra antes de la primera clase, como el evaluador de fórmulas del §46. |
| **WEB** | Todo, pero **el editor lo hereda de CÓDIGO** | Renderizado en vivo del documento del alumno y el guardián del `js`. |
| **DISEÑO** | Todo. `LabPintaConLaCompu` es un lienzo de pintar, no un editor de capas | Capas con orden Z, transformaciones y línea de tiempo. Cuadricular, no medir (§39). |

### Antes de los diez: la deuda transversal

| Pieza | Estado | Por qué va primero |
|---|---|---|
| `useLabActividad(props, pasos)` | Copiado en los 70 labs arcade, ~120 líneas cada uno | Los diez armazones lo usan. Extraerlo después es reescribir diez veces. |
| **Pieza 0 · `VentanaBase`** | Duplicado exacto en 2 archivos, parcial en 3 de correo, y ni siquiera compartido entre las tres ventanas de Office | Siete de los diez armazones son ventanas. Con ella entran la portada de objetivos y el modo guía, que ya existen y hoy sólo los ve Office. |
| Volver los 4 díscolos al chasis | `LabCompruebaLaRespuesta`, `LabRealOGenerado`, `LabPreguntaALaIA`, `LabSiAlgoMeIncomoda` rehacen a mano la pantalla final que `ArcadeSala` ya da a 71 archivos | Son cuatro de los seis de los que se extrae; se arregla al extraer, no después. |

---

## 8. Orden de construcción

Ordenados por cuántas actividades desbloquean, que aquí coincide con el orden por coste: **CÓDIGO antes que WEB** porque WEB hereda su editor, y **la deuda transversal antes que todo** porque los diez la usan.

| Tanda | Qué se construye | Desbloquea | Acumulado |
|---|---|---|---|
| **0** | `useLabActividad` + Pieza 0 (`VentanaBase`, con portada y modo guía) | 0 directas | 0 |
| **1** | **CÓDIGO** (con su intérprete cerrado y medido) | 18 | **18** |
| **2** | **IA** (ventana + los cinco paneles) | 16 | **34** |
| **3** | **WEB** (hereda el editor de la tanda 1) | 11 | **45** |
| **4** | **BLOQUES** (extraer, no escribir) | 8 | 53 |
| **5** | **MURO** | 8 | 61 |
| **6** | **DISEÑO** | 8 | 69 |
| **7** | **3D** | 7 | 76 |
| **8** | **SO** | 6 | 82 |
| **9** | **NAVEGADOR** | 6 | 88 |
| **10** | **NUBE** | 5 | 93 |
| — | OFFICE, tal cual | 7 | 100 |
| — | Las 4 únicas, al final | 4 | **104** |

**Construyendo los tres primeros —CÓDIGO, IA y WEB— se desbloquean 45 de las 104: el 43 % de lo que falta.**

Y la lección que la sala de Excel dejó medida: **la sala se aceleró de golpe en el momento exacto en que se acabaron de pagar las deudas de motor**, no cuando se empezaron a escribir clases. La tanda 0 y el intérprete de la tanda 1 son eso mismo, y saltárselos es el único modo garantizado de que estas 104 cuesten lo que costaron las primeras 129.

---

## Anexo A · Cómo se contaron

`node` sobre `src/data/curriculo.ts`, recorriendo `CURRICULO` nivel → unidad → actividad y `EJERCICIOS_OFFICE` aparte; se cuenta `estado !== 'disponible'`. Resultado reproducible: 197 + 38 = 235 declaradas, 96 + 35 = 131 disponibles, 101 + 3 = **104 pendientes**, en 34 unidades.

Ninguna cifra de este documento es una estimación: cada una sale de una lista que se puede enumerar, y las listas están escritas arriba entera por armazón.
