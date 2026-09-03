# Auditoría de la plataforma Tecnia — 1 de septiembre de 2026

Auditoría adversarial completa: estado del contenido, deuda técnica, vulnerabilidades
y fallas de lógica. Todo lo que se afirma aquí se comprobó leyendo el código o
midiéndolo; lo que no pude demostrar va marcado como sospecha, y lo que no revisé va
dicho como no revisado, no como limpio.

---

## 1 · El estado, en números

| | |
|---|---|
| Actividades registradas y jugables | **235** — 197 de nivel (N1–N10) + 38 exclusivas de Office |
| Actividades declaradas pero sin construir | **0** (`curriculo.ts` no tiene ni una en estado `planeada`) |
| Salas de Office | Word 19/19 · PowerPoint 19/19 · Excel 23/23 · M365 (5 temas cubiertos) |
| Navegación del hub docente | 7 destinos declarados, 7 existen y están enlazados |
| Suite de pruebas | 153 suites · 3 567 pruebas (§8) |
| Videos explicativos | **161 de 235** (74 clases muestran el aviso de «video en grabación») |
| Imágenes rotas en las 235 entradas | **0** — eran 12, en 3 clases, y ninguna prueba las veía (§3.1 bis) |

**El currículo está completo.** No falta ninguna clase ni ningún laboratorio: no hay
una sola actividad prometida en el temario que no se pueda jugar. Lo que falta es
producción audiovisual (74 videos) y el trabajo de servidor que describe el §5.

---

## 2 · Lo más grave que encontré: la plataforma no se podía desplegar

`npm run build` **fallaba**. No en un caso raro: siempre.

`tsconfig.json` incluía `.next/dev/types/**/*.ts` —los tipos que Next.js genera
mientras corre el servidor de desarrollo— y ese archivo estaba truncado a media
escritura desde el 30 de agosto a las 22:33, cuando un `next dev` murió a la mitad.
El type-check del build lo leía, encontraba una línea partida y abortaba con
`Failed to type check`.

Es la clase de defecto que no aparece jugando ni en las pruebas: `jest` pasaba, la
plataforma corría en desarrollo, y sin embargo no había manera de publicarla.

**Corregido**: se retiró esa línea del `include` (los tipos del build son
`.next/types`, no `.next/dev/types`) y se borró el artefacto corrupto. El build pasa.

---

## 3 · Lo que estaba roto en la cara del alumno, y ya no

### 3.1 · Siete clases pintaban un reproductor de video muerto

`n5-la-ia-en-mi-vida`, `n8-javascript-basico`, `n9-casa-inteligente`,
`n10-proyecto-web-real`, `n10-amenazas-y-defensa`, `n7-sistemas-operativos` y
`n7-diagnostica-y-soluciona` no tienen su `video-explicativo.mp4`, pero no lo
declaraban: cinco decían `assetsPendientes: false` y dos no declaraban nada (llega
`undefined`, que es falsy). El `<video>` se pintaba igual y pedía un archivo
inexistente. El alumno veía un reproductor muerto en vez del aviso de que el video
todavía se está grabando. En `n7-sistemas-operativos` había además un comentario que
afirmaba lo contrario de lo que hace su propia base.

### 3.1 bis · Y tres clases enseñaban doce huecos donde iban sus tarjetas

Esto **no lo encontré leyendo código**, y creo que no se podía: lo encontré abriendo
la entrada de las 235 clases con un navegador de verdad y apuntando toda respuesta
`>= 400` que fuera una imagen. Aparecieron tres, y las tres por lo mismo: su carpeta
`public/assets/actividades/<id>/` no existe, así que sus cuatro tarjetas de portada
pedían un PNG que nunca se generó.

| clase | tarjetas rotas |
|---|---|
| `n7-sistemas-operativos` | `ficha-reparte`, `ficha-frontera`, `ficha-puertas`, `ficha-desconocido` |
| `n7-diagnostica-y-soluciona` | `ficha-sintoma`, `ficha-simple`, `ficha-aisla`, `ficha-minima` |
| `of-m365-otra-caja` | `ficha-oficio`, `ficha-documentos`, `ficha-hojas`, `ficha-presentaciones` |

Vale la pena decir cómo apareció la tercera: las 38 clases de Office viven en otra
ruta (`/hub/office/<app>/actividad/<id>`) y hubo que barrerlas aparte. Si el barrido
se hubiera quedado en las 197 de nivel, esas cuatro seguirían rotas.

**Generadas las doce**, con el flujo krea2 que ya usa la plataforma, y revisadas una
por una antes de darlas por buenas — tres se rehicieron. Lo que enseñaron:

- **La primera salió pastel**, y la causa no era el modelo. `krea2-n7-u1.mjs` lleva
  su propio sufijo de estilo escrito a mano, y a ese sufijo **le falta la línea
  `solid saturated colours, never pastel, never washed out`** que sí tiene el
  `ESTILO` canónico de `krea2-lib.mjs`. Copiar el sufijo del vecino en vez de
  importar el canon reintroduce justo lo que llevas rechazado tres veces. El script
  nuevo importa el canon.
- **Al modelo hay que darle cosas contables, no relaciones.** «Cuatro puertas y detrás
  de cada una el mismo cuarto» le sale mal siempre: pinta cuatro cuartos distintos, o
  sea lo contrario de la idea. «Un solo cuarto y cuatro puertas alrededor» sale a la
  primera. Igual con «una variable a la vez»: pedir dos cables y una mano dio dos
  salchichas lisas; pedir tres enchufados y la mano sacando el de en medio se lee.
- Los tres intentos de cada una están escritos en `scripts/krea2-n7-fichas-faltantes.mjs`,
  con cuál se quedó y por qué, para que nadie los «mejore» de vuelta.

**Comprobado al final, en vivo y sobre las 235: cero imágenes rotas.**

**Hasta dónde llega esa comprobación, dicho con precisión**: el barrido abre la
ENTRADA de cada clase, no el laboratorio de dentro. Cubre las portadas, las fichas y
los reproductores, que es donde estaban los doce huecos, pero **si un laboratorio pide
una textura o un sonido que no existe, esto no lo ve**. Entrar a los 235 laboratorios
pide pulsar un CTA distinto en cada uno y no me dio la noche. Queda apuntado como lo
que es: un hueco conocido de la medición, no una zona declarada limpia.

### 3.2 · Se podía terminar `n7-tu-sitio-personal` sin hacer dos de las tres páginas

El motor `useEstudioWeb` evaluaba cada encargo contra la **pestaña de vista previa
abierta**, no contra el archivo que el encargo declara. Los encargos 1, 3 y 5 de esa
clase reutilizan el mismo predicado para `index.html`, `sobre-mi.html` y
`mis-pasatiempos.html`. Como el alumno no tiene motivo para cambiar de pestaña, al
pulsar «Siguiente encargo» el 3 se evaluaba contra `index.html`, que ya cumplía desde
el 1: se daba por hecho al instante. Igual el 5. Insignia de «Desarrollador Web» y
100 % con dos páginas en blanco. Su propia prueba ya daba por supuesto el
comportamiento correcto, pero lo simulaba a mano sin pasar por el motor.

El arreglo está en el motor, no en la clase, así que cura también a las otras dos que
declaran encargos sobre páginas distintas de `index.html` y tenían el mismo defecto
latente: `n8-sitio-multipagina` (dos encargos sobre `proyectos.html`) y `n10-capstone`
(uno sobre `servicios.html`). Comprobé una por una las ocho declaraciones de página no
principal que hay en toda la plataforma: en las ocho el predicado pregunta por esa
misma página, así que alinear la evaluación con el archivo declarado es correcto en
todos los casos y no cambia el comportamiento de ninguna otra clase.

### 3.3 · La portada de `n6-proyecto-integrador` se veía en blanco

Misma familia que el defecto de altura cero de agosto: `PortadaWeb` es
`position:absolute; inset:0`, y esta clase la devuelve desnuda como raíz, así que su
padre (`.act-frame--inmersivo`, sin altura) colapsaba a 0 px. El alumno entraba y no
veía la situación, ni el objetivo, ni el botón de empezar. Sus tres clases hermanas la
usan anidada dentro de `ArcadeSala`, que sí da altura — por eso sólo fallaba ésta. Se
curó con una regla CSS de hijo directo, la misma técnica que ya funcionó en agosto.

### 3.4 · Cinco de los doce encargos de `of-excel-auditoria` se cumplían sin hacer nada

Los encargos de «rastrea los precedentes de B5 / B3 / B4» y «los dependientes de B6»
se aprobaban con sólo **pulsar el botón**, desde cualquier celda: el motor comparaba
el nombre del control y nada más. Un alumno podía ponerse en una celda vacía y pulsar
cuatro veces para cerrar el corazón de la clase. Ahora el encargo puede exigir también
la celda y la hoja donde se pulsa, y esos cinco lo hacen.

### 3.5 · El último encargo del temario de Excel se aprobaba solo al repetir la clase

`of-excel-dashboard` cierra preguntándole a la bandeja de la impresora si hay un
trabajo de una página. Esa bandeja vive fuera del libro y sólo se acumula; se vaciaba
al montar el laboratorio, pero «Empezar de cero» no remonta nada. Quien terminaba la
clase y volvía a empezarla encontraba el encargo final ya cumplido con el rastro de la
partida anterior.

### 3.6 · Un evaluador de CSS que aprobaba con un comentario

En `n10-proyecto-web-real`, el encargo del borde se comprobaba con
`css.includes('#kpi-usuarios')` y `css.includes('border-color')` sobre el texto del
archivo. La propia instrucción contiene las dos cadenas: pegarla dentro de un
comentario CSS aprobaba el encargo sin escribir una sola regla. Y al revés: escribir
la forma corta `border: 3px solid #a855f7`, que pinta exactamente lo pedido, era
rechazada. Ahora se pregunta por el estilo resuelto del elemento.

### 3.7 · Un campo de combinación que se aprobaba tecleando comillas

En `of-word-correspondencia` bastaba escribir a mano los caracteres del hueco. Lo que
distingue un campo real es la marca de resaltado que pone el botón —justo lo que la
clase enseña: que un campo es una instrucción y no texto—. Ahora se comprueba la marca
sobre ese trozo de texto.

### 3.8 · Atribución: la licencia de un autor valía por la del otro

En `n8-derechos-y-licencias`, «cc by» es subcadena literal de «cc by-nc». En el
encargo de cierre, quien escribía la licencia de Diego y **no** la de Ana aprobaba
igual. Ahora se descarta primero la licencia confundible, de la más larga a la más
corta.

### 3.9 · La retroalimentación anterior se quedaba pegada sobre la pregunta nueva

En `n7-como-aprende-la-ia` y `n8-sesgos-y-errores`, al acertar y avanzar se limpiaba
la selección pero no el veredicto: el texto del encargo resuelto seguía en pantalla
encima del enunciado siguiente, como si ya estuviera contestado. Es el mismo defecto
que se corrigió en `n8-etica-de-la-ia`, la tercera copia del mismo armazón: se arregló
en una y no en las otras dos.

### 3.10 · El audio se apagaba a media clase

Cinco laboratorios (`n10-amenazas-y-defensa`, `n9-automatiza-un-espacio`,
`n9-casa-inteligente`, `n8-disena-tu-videojuego`, `n10-consultas-sql`) abrían un
`AudioContext` **nuevo en cada sonido** y no lo cerraban nunca. Los navegadores
permiten unos pocos a la vez; en una clase de verdad el sonido se apagaba en minutos.
El resto de la plataforma usa un hook compartido que sí lo cierra; estos cinco se
escribieron aparte.

### 3.11 · Contadores y tiempos que mentían

- `n4-envia-responde-adjunta` declaraba 21 pasos y daba 24: el alumno leía «Paso 22
  de 21» en el tramo final, y a la plataforma le llegaba un progreso de 1,14.
- `n6-alto-al-ciberacoso` declaraba 4 y daba 3: la barra se quedaba clavada en 75 %.
- `n9-casa-inteligente` mostraba **siempre** «Tiempo 2:00» en la insignia final,
  tardara el alumno 40 segundos o doce minutos.
- `n7-privacidad-en-redes` fabricaba el tiempo a partir del número de pasos.
- `n7-riesgos-y-marco-legal` abría diciendo «Paso 0 de 12».
- `n3-que-es-internet`: tras un fallo, el letrero seguía pidiendo «toca la otra
  máquina» cuando ya no había nada resaltado en pantalla.
- `of-excel-interpreta-la-informacion` exigía el texto exacto «5»: escribir `5.0`
  —que el motor acepta y calcula igual— dejaba al alumno atascado sin explicación.
- `n8-buenas-practicas` mandaba cambiar la variable «en las CUATRO líneas donde
  aparece» y sólo hay tres; la cuarta está bajo candado y no se puede tocar.

### 3.12 · Si fallaba la carga de una actividad, el alumno se quedaba mirando el vacío

Cada actividad se pide por red al abrirla. Si esa petición falla —wifi de escuela, o
un despliegue nuevo mientras alguien tiene la pestaña abierta— la promesa se rechazaba
sin que nadie la recogiera y el esqueleto gris se quedaba girando para siempre. Ahora
hay mensaje y botón de reintentar.

### 3.13 · La pantalla de error mentía

Decía «Tu progreso está guardado en la nube». No hay nube: todo vive en el
`localStorage` de ese navegador. Prometerle eso a un niño justo en la pantalla de
error es la clase de mentira que se descubre borrando el historial.

---

## 4 · Seguridad

### 4.1 · Corregido: escalada de privilegios en el proyecto Supabase

**Éste es el hallazgo más serio de seguridad.** Cuatro archivos SQL (`schema.sql`,
`migration_v2.sql`, `migrations/institutional_full.sql` y `security_triggers.sql`)
creaban el perfil del usuario nuevo tomando el rol **del metadato que manda el propio
usuario al registrarse**. Cualquiera con la llave pública anónima —que viaja en cada
página— podía registrarse pidiendo el rol `admin` contra el REST de Supabase, sin
pasar siquiera por la interfaz, y nacer administrador.

Existía ya un arreglo (`migrations/fix_handle_new_user_role_escalation.sql`), pero los
otros cuatro archivos lo reintroducían — y la cabecera de `security_triggers.sql`
manda ejecutarlo entero «para restaurar la seguridad» si el proyecto se recrea. **El
remedio reponía la enfermedad.** Cerrado en los cuatro.

**Y un escalón más arriba**: el disparador que impide que un profesor se ascienda
comparaba literalmente contra `'admin'`, y desde mayo existe un rol más alto,
`'super_admin'`. Un profesor podía actualizar su propio perfil a `super_admin` desde
el navegador y quedarse con el rol más alto de la plataforma. Cerrado, y añadido el
caso simétrico para que tampoco un administrador se ascienda solo.

> **Comprueba esto el día que conectes Supabase**, porque el repositorio no puede
> saber qué versión está viva en el proyecto real:
> `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`
> Tiene que asignar `'student'` a pie de código, no leerlo del metadato.

### 4.2 · Corregido: la puerta se abría sola si Supabase fallaba

`src/proxy.ts` es la única puerta de autenticación del sitio (Next 16 renombró
`middleware` a `proxy`; el build lo confirma imprimiendo `ƒ Proxy (Middleware)`). Su
`catch` dejaba pasar **toda** petición sin validar sesión, rutas protegidas incluidas.
Cualquier caída de Supabase —o una variable mal puesta— abría `/hub`, donde están los
datos de menores. Ahora falla **cerrado en lo privado y abierto en lo público**: la
portada y los avisos legales siguen sirviéndose, pero una ruta protegida que no se
puede verificar manda a iniciar sesión. No poder comprobar quién eres no es lo mismo
que estar comprobado.

### 4.3 · Corregido: dos puertas de seguridad, y la que se leía no era la que corría

Había un `middleware.ts` en la raíz que **es código muerto** desde Next 16, y no traía
ninguna de las nueve cabeceras de seguridad ni la CSP que sí trae `src/proxy.ts`.
Quien lo leyera creería que la plataforma no tiene cabeceras. Ya cobró una víctima: el
17 de agosto alguien arregló ahí el fallo de arranque y el sitio siguió caído. Se
retiró de la raíz (respaldado en `_backups/2026-09-01-auditoria/`).

### 4.4 · Corregido: ocho CVEs de Next.js

`next@16.2.9` arrastra 8 avisos de severidad alta/moderada. Actualizado a **16.2.12**,
el último parche de la misma rama (no salto de versión menor, para no arriesgar el
comportamiento). Se revisó el más grave, el de evasión del middleware (CVSS 8.3): no
era explotable en este despliegue porque exige build con Turbopack e `i18n` con un
solo idioma, y aquí el build es con webpack y no hay `i18n` — pero los otros siete sí
quedaban en rango.

### 4.5 · Corregido: los bancos de pruebas ya no se indexan

23 rutas de instrumento (22 bancos —`/banco-word/*`, `/banco-hojas`,
`/banco-diapositiva`, `/banco-paginacion`— más `/diagnostico-voz`) se publican como
páginas estáticas y eran rastreables por Google. No son una fuga de datos, pero «Tecnia · banco de pruebas» en
Google bajo el nombre del cliente es un resultado difícil de explicar a una escuela.

### 4.6 · Revisado a fondo y **sin hallazgo** (vale la pena decirlo)

- **El intérprete de Python del alumno no es una vía de ejecución.** Sin `eval`, sin
  `new Function`, sin acceso a `window` ni `document`. Y con topes reales medidos en
  el código: un millón de pasos, mil de recursión, cinco mil líneas de salida. Un
  `while True:` da un error amable en vez de colgar la pestaña.
- **El motor de HTML/CSS/JS no ejecuta nada.** Pinta nodo a nodo con lista blanca, sin
  `dangerouslySetInnerHTML` y sin `<iframe>`, por decisión documentada.
- **La calculadora de EduOS** usa `new Function`, pero sólo puede recibir lo que dan
  sus botones fijos: no hay entrada de teclado. No es explotable.
- **Los `innerHTML` de Word** vienen siempre de ProseMirror, cuyo esquema es un
  conjunto cerrado de nodos sin HTML crudo ni enlaces con `href`.
- **La llave de servicio de Supabase** no aparece en una sola línea de `src/`, y está
  excluida de `.gitignore` y `.vercelignore`.
- **Sentry** enmascara texto, campos y medios en las repeticiones de sesión, y no
  identifica usuarios. Es la configuración correcta tratándose de menores.
- **Cero `any`, cero `@ts-ignore`, cero `TODO`/`FIXME` reales** en código de
  producción. Y los 266 `as unknown as`, contados uno a uno: **235 están en los dos
  registros** (197 en `registry.ts` + 38 en `registroOffice.ts`) y son el borrado de
  genéricos documentado de la carga perezosa; de los 31 restantes, 21 son el
  `window as unknown as Record<string, unknown>` de las sondas de medición, 6 son el
  `webkitAudioContext` de Safari y los 4 últimos son formas de prueba o de tipado de
  documento. **Ninguno tapa un error de tipos.** Es un repositorio inusualmente
  disciplinado.

---

## 5 · Lo que NO toqué, y por qué — esto necesita tu decisión

Estas cosas no son bugs: son trabajo pendiente cuyo alcance no me corresponde decidir.

### 5.1 · No hay autenticación real. Ninguna.

No existe una sola llamada a `signInWithPassword` en todo el repositorio. El formulario
de acceso entra con cualquier correo con forma válida, hay un botón «entrar sin
cuenta», y **hay un botón que entrega el panel docente completo de un clic**. La
autorización de ese panel se comprueba en el navegador leyendo `localStorage`, que es
evitable en diez segundos.

Hoy el daño es acotado porque el panel docente lee alumnos ficticios de
`datosDemo.ts`, no datos reales. Pero el día que se conecte Supabase con alumnos de
verdad, ese botón sigue ahí.

### 5.2 · Conectar Supabase no hará que el progreso se guarde

`ProgresoRepo` tiene una sola implementación: `LocalProgresoRepo`, sobre
`localStorage`. No existe `SupabaseProgresoRepo`. El XP, la racha, las insignias y el
avance de cada actividad viven en el navegador de cada equipo. Un alumno que cambie de
máquina empieza de cero, y el panel docente nunca verá nada real.

**Puedo construirlo** (la interfaz son once métodos y el esquema SQL ya tiene tablas),
pero es trabajo de producto, no una corrección de auditoría: prefiero que lo pidas.

### 5.3 · En un equipo compartido, el progreso de un alumno se le atribuye al siguiente

«Salir» sólo borra el perfil (nombre, grado, avatar). El XP, la racha y las actividades
completadas viven en claves fijas del navegador, sin separar por alumno. En un
laboratorio escolar con equipos compartidos esto va a pasar todos los días: el alumno B
entra después del A y ve el avance de A como suyo. Se arregla limpiando esas claves al
salir, o separándolas por perfil — pero cambia el comportamiento de guardado de toda la
plataforma y no quise tocarlo sin avisarte.

### 5.4 · El limitador de intentos de acceso no limita nada

Guarda los contadores en memoria del proceso: en Vercel cada invocación puede caer en
una instancia distinta con el contador a cero. Además vigila un `POST` a `/log-in` que
el formulario nunca hace. Da igual hoy (no hay login real), pero no servirá de nada el
día que lo haya.

### 5.5 · 73 MB de assets muertos, y una trampa al lado

`public/assets/actividades/conexiones-v2/` (37 MB) y `encendido-v2/` (36 MB) son dos
carpetas archivadas bajo un id de actividad que ya no existe. Cada una guarda lo mismo:
una `portada.png` y un `video-explicativo.mp4`.

**Y son copias, comprobado por bytes, no por parecido de nombre** — que es la
diferencia entre una sospecha y un hecho:

| bytes | dónde |
|---|---|
| 37 696 061 | `conexiones-v2/` · **`n1-conecta-el-equipo/`** · `video-explicativo/out/conexiones-v2.mp4` |
| 36 311 457 | `encendido-v2/` · **`n1-enciende-con-seguridad/`** · `video-explicativo/out/encendido-v2.mp4` |

O sea que cada video vive tres veces: en la carpeta vieja, en la carpeta de la
actividad que de verdad lo usa, y en la salida del render. Borrar las dos primeras
columnas no le quita el video a ningún alumno.

**Pero cuidado con la tercera, que es la trampa.** Cruzando las carpetas de
`public/assets/actividades/` contra los dos registros salen exactamente tres que no
corresponden a ninguna actividad viva, y la tercera es `n1-enciende-y-apaga` (6,7 MB).
Parece huérfana por el mismo motivo —esa actividad se renombró— pero no lo es:

| archivo | quién lo usa |
|---|---|
| `bit-cara.png` | **32 archivos de `src/`, por su ruta completa.** Es la cara de Bit. |
| `video-explicativo.mp4` | nadie por esa ruta, y **no está duplicado en ningún sitio**: es la única copia |
| `bit-y-ordenador.png` | nadie |
| `ordenador-cuerpo.png` | nadie |

O sea que borrar «las tres carpetas huérfanas» **dejaría a Bit sin cara en toda la
plataforma**, y de paso tiraría el único ejemplar de un video. Lo que sí sobra de esa
carpeta son los dos PNG sin usar. No borré nada: sin control de versiones no hay vuelta
atrás.

### 5.6 · No hay control de versiones

No existe `.git`. Cada cambio es definitivo y dos sesiones que trabajen a la vez se
pisan en silencio. Es, con diferencia, el mayor riesgo operativo del proyecto, y es de
los que no avisan hasta el día que duelen. Puedo inicializarlo cuando digas.

### 5.7 · Código muerto identificado, no borrado

`security-logger.ts`, `supabase-browser.ts`, `supabase-server.ts`,
`config/branding.ts`, `activities/datos/LabConsultasSql.tsx` y su `Entrada`,
`n1/EscenaParaQueSirve.tsx`, `n2/arcade/LabPrensaDeCuentos.tsx`, y nueve dependencias
de `package.json` que nadie importa. Todo verificado sin importadores. No borré nada
por lo mismo del §5.6.

### 5.8 · El build `standalone` sale incompleto, y no avisa

Esto apareció de rebote, montando el servidor para el barrido en vivo, y es de las que
sólo duelen el día que las pisas.

`next.config.ts` activa `output: 'standalone'` cuando **no** hay Vercel, y su propio
comentario dice para qué: «servirla nosotros — un contenedor, un servidor propio». Es
la configuración correcta para ese caso. El problema es lo que produce:

```
.next/standalone/   →   node_modules   package.json   server.js
```

Y nada más. **No lleva `public/` ni `.next/static`.** Es comportamiento documentado de
Next.js —esas dos carpetas se copian a mano— pero significa que
`node .next/standalone/server.js` levanta la plataforma **sin una sola imagen, sin
CSS y sin los chunks de JavaScript**. Arranca, responde 200 y se ve destrozada. No hay
ningún error que lo anuncie.

Hoy no molesta porque el despliegue es Vercel, que ignora `standalone` y hace su
propio empaquetado. Molesta el día que decidas servirla tú, que es justo el día para
el que está puesta la opción. **La cura son dos líneas** en el script de despliegue,
después del build:

```
cp -r public         .next/standalone/public
cp -r .next/static   .next/standalone/.next/static
```

No las escribí porque no sé aún si vas a auto-hospedar ni con qué (Docker, un VPS,
`pm2`), y el sitio donde van depende de eso. Es una línea de tu `Dockerfile` o de tu
script de arranque, no del repositorio.

*Nota al margen, por si lo ves en un log:* `npx next start` imprime
`"next start" does not work with "output: standalone"`. Para el barrido sirvió —sirvió
las 235 páginas y sus imágenes correctamente— pero la forma buena de correr la
producción en local es `node .next/standalone/server.js` **con las dos copias hechas**.

### 5.9 · Dos actividades por debajo del estándar de la casa

`n10-consultas-sql` aprueba comprobando que la consulta escrita contenga ciertas
palabras, sin ejecutarla nunca contra el motor SQL real —que existe, y que su gemela
huérfana sí usa—, y `n10-amenazas-y-defensa` es una terminal con IPs y hashes
cableados. Las dos son **teatro**: parecen motores y no lo son. Reescribirlas es un
encargo de construcción, no una corrección, así que las dejo señaladas.

---

## 6 · Los videos

74 de las 235 clases no tienen video explicativo. No es un defecto —cada una muestra
el aviso honesto de que se está grabando, y eso ya está bien conectado en las siete
que lo tenían roto—, pero es la mayor deuda de contenido.

Producir uno exige cuatro cosas: escribir su guion (unas 30 escenas), generar sus
ilustraciones con ComfyUI, narrarlo y renderizarlo con Remotion. Los 91 guiones que
existen ya tienen su video; para los 74 que faltan no hay guion escrito.

### 6.1 · Traje la voz nueva de robótica, y hubo que reafinarla

Me pediste usar «el flujo que se utilizó en la plataforma de robótica, una nueva forma
de crear los videos, nueva voz y nuevo ritmo». Fui a buscarlo y lo que cambió allá es
exactamente **un** eslabón: la narración. Todo lo demás de esta plataforma —las
ilustraciones con ComfyUI, el timeline, `RootGuiones.tsx`, el render— ya está montado y
sirve igual. Aquí seguíamos con XTTS clonando a Alison Dietlinde; robótica se pasó a
`es-MX-DaliaNeural` de Microsoft, **dirigida frase por frase**: cada frase hace un papel
—entrada, dato, contraste, giro, remate— y cada papel tiene su ritmo y su silencio.

Está portado y funcionando:

- `video-explicativo/scripts/direccion.py` — la dirección de voz.
- `video-explicativo/scripts/narracion-vox.py` — el reemplazo de `narracion.py`.
  Misma línea de comandos, mismos archivos de salida (un WAV por escena y el
  `.duraciones.json`), así que el render no se entera del cambio.

**Y no se pueden copiar las tasas de robótica.** Eso fue lo primero que probé y suena
mal. Medido sobre diez clips reales ya publicados de esta plataforma, comparando el WAV
que hay en disco contra el mismo texto dicho por la voz nueva:

| | palabras por minuto |
|---|---|
| XTTS / Alison — lo que suena hoy en los 91 videos | **125** |
| Dalia con la tasa de robótica (+22 %) | **207** |

Un video nuevo a esa velocidad no suena a voz nueva: suena a otra plataforma pegada al
lado de las 91 publicadas. Bajé la escalera entera conservando el espaciado entre
papeles y la anclé en 150-160 palabras por minuto, que es el paso de una narración
educativa de secundaria. Cada número está medido con las tasas ya puestas, no
calculado, y está escrito en el propio archivo.

De la misma medición sale algo que conviene saber: **XTTS va de 85 a 196 palabras por
minuto con frases del mismo largo.** Esa inestabilidad es la razón de que `voz_util.py`
tenga cuatro reintentos y una reja de F0. La voz nueva no la necesita porque no clona.

**Escúchalo antes de decidir.** En `video-explicativo/out/comparacion-voz/` te dejé las
mismas ocho escenas del guion real de `n5-audio-e-imagenes`, palabra por palabra
idénticas, con el mismo hueco entre escenas: `A-como-suena-hoy-xtts.wav` (77,3 s) y
`B-la-voz-nueva-dalia.wav` (61,7 s, 148 palabras/min). El `LEEME.md` de al lado explica
qué estás oyendo.

**No he vuelto a narrar ninguno de los 91 videos publicados.** Cambiar la voz de la
plataforma entera es decisión tuya, no un efecto secundario de que la herramienta ya
exista.

### 6.2 · Por qué no produje los 74

Tres razones, y ninguna es que no se pueda:

1. Tu propia regla del ESTÁNDAR ROBUSTO v2 prohíbe la generación en masa y manda una
   actividad a la vez, y la campaña de videos la pausaste tú. Setenta y cuatro videos
   generados sin que nadie los vea son setenta y cuatro apuestas.
2. Lo caro no es la máquina: son 74 guiones de unas 30 escenas cada uno, o sea unas
   2 200 frases de contenido pedagógico escritas a mano. Eso es autoría, no proceso.
3. Y esta noche, en concreto, **la GPU no estaba libre**: hay otra sesión trabajando en
   la plataforma de robótica ahora mismo, con ComfyUI levantado desde las 00:13 y un
   barrido de laboratorios con navegadores. Ponerme a generar ilustraciones habría sido
   pelearme con ella por la tarjeta. No toqué nada suyo.

Lo que sí queda listo para el día que digas que sí: el eslabón que faltaba, medido y
afinado para esta plataforma.

---

## 7 · La lista del día del dominio y Supabase

1. `NEXT_PUBLIC_APP_URL` con el dominio real. Sin ella, las tarjetas de WhatsApp y
   Google apuntan a `https://tu-dominio.com`.
2. Decidir el buzón legal. **Rectifico aquí una afirmación que hice antes en este
   mismo informe y que resultó falsa**: dije que el Aviso de Privacidad ofrecía
   `contacto@tudominio.com`. No es cierto. Ese texto sólo existe como valor por
   omisión dentro de `src/config/branding.ts`, que **no lo importa nadie** (está en
   la lista de código muerto del §5.7), así que nunca llega a una pantalla. Lo que
   el Aviso de Privacidad enseña de verdad son cuatro apariciones de
   `campanaeducativanacional@gmail.com`, escritas a mano en `src/app/privacidad/page.tsx`,
   como canal para ejercer derechos ARCO y para revocar el consentimiento.
   No es un marcador de posición: es un buzón real y funciona. La decisión es si el
   día del dominio quieres que el canal legal siga siendo un Gmail o pase a un correo
   del dominio institucional — y si es lo segundo, se cambia en ese archivo, en los
   cuatro sitios.
3. Proyecto nuevo de Supabase, y ejecutar el SQL en el orden que ahora documenta
   `.env.local.example` (reescrito: el anterior seguía anunciando «Educación
   Financiera» y no mencionaba ni el dominio ni el modo demo).
4. Comprobar el disparador `handle_new_user` con la consulta del §4.1.
5. `NEXT_PUBLIC_DEMO_MODE` fuera de `1`. Mientras esté en `1`, `/hub` está abierto sin
   cuenta y Google no indexa nada. Que se quede puesto por descuido es una puerta
   abierta, no un detalle.
6. Y antes de todo lo anterior: decidir el §5.1 y el §5.2, porque sin autenticación
   real y sin repositorio de progreso, conectar Supabase no cambia nada de lo que ve
   un alumno o un maestro.

---

## 8 · Las pruebas, y las dos que tuve que tocar

Las tres puertas, corridas al final y en este orden: `npx tsc --noEmit` limpio,
`npm run build` pasa —y su última línea dice `ƒ Proxy (Middleware)`, que es la
confirmación de que la puerta que corre es la buena después de borrar el
`middleware.ts` muerto del §4.3— y la suite entera.

**Y una nueva que no existía: abrir la plataforma de verdad.** Con el servidor de
producción levantado, un navegador recorrió las 235 entradas y midió lo que el alumno
recibe. Es lo que cazó las doce tarjetas rotas del §3.1 bis, que ninguna de las puertas
anteriores podía ver: `tsc` no sabe si un PNG existe, `jest` corre en jsdom —que no
descarga imágenes— y el build no comprueba los archivos de `public/`. Queda escrita en
`COMO-SE-CONSTRUYE.md` §6 como **la quinta puerta** (la cuarta ya existía y es otra
cosa: mira los `.css` que se importan y nunca se escribieron). Quedó guardado
**dentro del proyecto**, en `scripts/auditoria/barrido-assets.mjs`, y sale con código
1 si encuentra algo, para que pueda ser una puerta de verdad:

```
npm run build && npx next start -p 3002
PLAYWRIGHT_PATH="$(npm root -g)/playwright" node scripts/auditoria/barrido-assets.mjs --todo
```

Conviene pasarlo antes de cada entrega. Un aviso que costó un rato aprender y está
escrito en su cabecera: `next start` sirve una foto de `public/` tomada en el build,
así que **si acabas de añadir imágenes hay que reconstruir antes de barrer** o salen
404 que ya no son ciertos.
De la misma corrida salieron las cinco cabeceras de seguridad comprobadas en vivo y
la portada de `n6-proyecto-integrador` midiendo 1440 × 900 en vez de colapsar a cero.

Toqué dos archivos de prueba, los dos por el mismo motivo: **decían algo que había
dejado de ser verdad.** Ninguna aserción se aflojó.

**`n7-sistemas-operativos.test.tsx`.** Exigía que el primer botón del documento fuera
el del cubrepantalla del video. Al declarar `assetsPendientes` en esa clase (§3.1)
—porque su video no existe— la base deja de pintar el cubrepantalla y el primer botón
pasa a ser el CTA. La prueba estaba escrita cuando la bandera no estaba. Ahora exige
lo que de verdad tiene que pasar: que no haya `<video>`, que esté el aviso, y que el
primer botón sea el CTA. Y está escrita para **volver a fallar el día que se publique
el video** y haya que quitar la bandera, que es cuando conviene que avise.

**`ventana-hojas-tablas-clase.test.tsx`.** Cinco de sus pruebas reproducen la clase de
Excel entera contra el motor de verdad: unos 25 segundos cada una, con el tope de la
casa en 30. Estaban corriendo a dos segundos del límite. En la corrida del 1 de
septiembre pasaron; en cuanto la máquina tuvo algo más que hacer, se cayeron por
tiempo. **Comprobé que no era mío**: restauré el `VentanaHojas.tsx` anterior a esta
auditoría y falla igual. Les puse 60 segundos, que es lo que ya hace
`ventana-hojas-elige-grafica.test.tsx` con su recorrido completo, y lo que pide el
comentario del propio `jest.config.js`: *«una prueba que falla según lo ocupada que
esté la máquina no se la cree nadie, y lo que pasa después es que se mira para otro
lado cuando falla de verdad»*.

Y una prueba nueva, la del §3.2: reproduce dos encargos con el MISMO predicado sobre
archivos distintos. **La verifiqué al revés**, que es la única forma de saber que una
prueba sirve: saboteé el arreglo del motor a propósito y la prueba falló diciendo
exactamente lo que tenía que decir —el segundo encargo nacía cumplido—. Luego restauré
el arreglo. Una prueba verde que nunca se ha visto en rojo no prueba nada.

**Y el tope de la casa pasó de 30 a 90 segundos.** No es tapar una lentitud, y el
razonamiento ya estaba escrito en `jest.config.ts` desde que alguien lo subió de 5 a
30: *«el tope de jest no mide nada, sólo corta un cuelgue»*. Lo que se midió esa noche
para volver a subirlo: cuatro corridas completas seguidas cayeron con **dos suites cada
vez y nunca las mismas** —`tablas-clase` y `elige-grafica` primero, `buscarx` y
`condicional` después—. Aisladas, todas pasan: 16 de 16 en 46 s las dos últimas, contra
214 s bajo carga. Es exactamente el «hoy `buscarx`, mañana `datos-reales`» que el
propio comentario ya describía, un tamaño más grande. De paso se quitaron los topes
sueltos por prueba: un `}, 60_000)` es un tope **más bajo** que el global el día que el
global suba.

**Un aviso sobre los números de esta sección, y es importante para leerlos bien.**
Mientras corría todo esto había **otra sesión trabajando en la plataforma de robótica
en esta misma máquina** —barrido de laboratorios con navegadores, dos servidores y
ComfyUI con su modelo cargado—. Con esa carga encima pasaron dos cosas:

1. Las suites pesadas de `ventana-hojas-*` fallan **por tiempo, no por código**. Que no
   era mío lo comprobé restaurando el `VentanaHojas.tsx` anterior a la auditoría: falla
   igual.
2. Y al final la corrida completa dejó de terminar: con **6,7 GB libres de 31**, jest
   con dos procesos muere sin llegar a imprimir el resumen. `--runInBand` tampoco
   sirve —acumula las 153 suites en un solo proceso y bajó la máquina a 1 GB libre—.
   Lo que sí funciona es el remedio que jest trae para esto, que **recicla el worker
   cuando se pasa de memoria**:

```
npx jest --maxWorkers=1 --workerIdleMemoryLimit=1200MB --silent
```

Si al leer esto ves una corrida en rojo o cortada, mira primero qué más había
corriendo antes de buscar el defecto.

### El resultado

```
Test Suites: 153 passed, 153 total
Tests:       3567 passed, 3567 total
Time:        1478.6 s
```

**Cero fallos.** Con el `tsc` limpio, el `npm run build` pasando y las 235 entradas
barridas sin una imagen rota, ésas son las cuatro medidas con las que se cierra esta
auditoría.

---

*Respaldos de todo lo que se tocó, en `_backups/2026-09-01-auditoria/`.*
