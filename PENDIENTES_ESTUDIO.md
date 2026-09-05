# Estudio de impacto — lo que falta y lo que hay que vigilar

5 de septiembre de 2026.

Lista honesta de lo que **no** está hecho, lo que está hecho a medias y lo que
puede invalidar el estudio si nadie lo mira. Ordenada por lo que más daño hace.

---

## 1. LOS REACTIVOS SON PROVISIONALES — validar con la universidad

**Los 36 reactivos de conocimiento (18 de entrada + 18 de salida) y las 4
preguntas de actitud los escribí yo, no un especialista en medición
psicométrica.** Están en `data/estudio/*.json` con la versión
`2026-09-05-provisional`, y esa palabra está ahí para que nadie los confunda con
un instrumento validado.

Lo que sí tienen, comprobado con pruebas automáticas
(`src/__tests__/estudio-bancos-reactivos.test.ts`):

- 18 reactivos, un tercio fáciles, un tercio medios, un tercio difíciles;
- seis competencias, cada una medida en las tres dificultades;
- forma paralela uno a uno, mismo constructo y distinto enunciado;
- la respuesta correcta repartida entre las cuatro posiciones (entre 3 y 6 por
  posición, nunca acumulada);
- la opción correcta es la más larga en 5 de 18 (28 %), cerca del 25 % que
  daría el azar — la primera versión daba 50 %, que es una pista aprovechable, y
  se corrigió alargando nueve distractoras;
- ni el título ni las instrucciones dicen «examen», «prueba» ni «test».

Lo que **no** tienen y sólo puede darlo la universidad:

- **Validez de contenido.** Que estos 18 reactivos midan de verdad lo que la
  plataforma enseña, y no otra cosa parecida.
- **Índices de dificultad y discriminación reales.** La columna `dificultad` es
  mi estimación a ojo. La dificultad real se calcula con los datos de un piloto.
- **Equivalencia de las formas paralelas.** Que `S07` sea igual de difícil que
  `E07` está *supuesto*, no medido. Si no lo es, la ganancia entre entrada y
  salida incluye la diferencia entre los dos bancos y no sólo el aprendizaje.
- **Fiabilidad** (alfa de Cronbach o equivalente) de la escala de actitud.

> **Recomendación fuerte: pilotear los dos bancos con un grupo que NO forme parte
> del estudio antes de aplicarlos a la muestra real.** Si eso no cabe en el
> calendario, aplicarlos igual —un dato imperfecto del primer día vale más que
> ningún dato— y anotar en el informe que el instrumento no está validado.

---

## 2. Un solo instrumento para alumnos de 6 a 18 años

La plataforma va de primero de primaria a bachillerato. **Los 18 reactivos son
los mismos para todos.**

Un alumno de nivel 1 no puede leer los reactivos difíciles, y eso está
parcialmente asumido en el diseño: el orden va de fácil a difícil para que se
encuentre primero con lo que puede contestar, no hay límite de tiempo, no hay
retroalimentación y existe «Aún no lo sé», así que no se atasca ni se frustra.
Un pretest en el que un niño de seis años no sabe casi nada **es un resultado
correcto**, no un fallo.

Pero hay que decidirlo explícitamente:

- **Opción A** — un solo instrumento (lo que hay). Simple, comparable entre
  niveles, con efecto suelo fuerte en primaria baja.
- **Opción B** — dos o tres formas por rango de edad. Mejor medición, pero deja
  de ser comparable entre niveles sin un trabajo de equiparación.

Como el módulo es genérico, la opción B es añadir archivos JSON y una regla de
selección por nivel; no toca código de la interfaz.

---

## 3. El identificador de alumno: en muchos casos es un EQUIPO, no una persona

**Éste es el riesgo más serio para la validez del estudio, y no viene del
estudio: viene de cómo está construida la plataforma.**

- Con cuenta (`ancla = 'cuenta'`): el sujeto es una persona, y sigue siéndolo
  aunque cambie de computadora. Correcto.
- Sin cuenta (`ancla = 'navegador'`): el identificador vive en `localStorage`, o
  sea que **identifica al navegador**. En un aula con equipos compartidos, todos
  los alumnos que usen esa máquina comparten identificador y sus respuestas
  quedan mezcladas en un mismo «sujeto».

Y la plataforma invita a entrar sin cuenta: «Explorar sin cuenta» está en la
pantalla de acceso, a propósito, para ferias y demostraciones.

Un pretest y un postest que no son de la misma persona no miden aprendizaje.

**Lo hecho:** cada fila lleva `ancla`, así que el análisis puede separarlas o
descartarlas. **Lo que falta es una decisión operativa**, y hay que tomarla antes
del primer día:

> **Las escuelas del estudio entran con cuenta.** Es la diferencia entre medir
> alumnos y medir computadoras. Cuesta repartir credenciales; no hacerlo cuesta
> el estudio.

Relacionado: el progreso del alumno tiene exactamente el mismo defecto y es
anterior a todo esto (ver `AUDITORIA-2026-09-01.md`).

---

## 4. «Explorar sin cuenta» se mide, pero nunca consiente

Lo encontré revisando el propio trabajo, y es una decisión que no me corresponde
tomar a mí.

La casilla de consentimiento que se añadió vive en el **formulario de acceso**.
«Explorar sin cuenta» es un botón aparte que no pasa por ese formulario: entra
directo. Y sin embargo ese alumno **sí se mide** —las tablas del estudio aceptan
escrituras anónimas a propósito (§6), porque si no, las escuelas que usan la
plataforma sin repartir credenciales no aportarían ni un dato—.

Resultado: se recogen respuestas de cuestionario y telemetría de personas que no
marcaron ninguna casilla. Los datos no las identifican —no hay nombre, correo ni
cuenta, sólo un UUID del navegador— pero eso es una mitigación, no un
consentimiento.

Las tres salidas, y **la elección es legal, no técnica**:

1. **Pedir el consentimiento también en «Explorar sin cuenta»**, con una pantalla
   previa. Es lo más limpio y cuesta poco; el precio es fricción en la
   demostración de feria, que es justo para lo que existe ese botón.
2. **No medir a quien entra sin cuenta.** Cero dudas legales y se pierden los
   datos de las escuelas que no reparten credenciales — que, si se toma la
   recomendación de §3, deberían ser ninguna.
3. **Dejarlo como está**, argumentando que sin identificador personal no hay
   datos personales que consentir. Es defendible y hay que decidirlo a
   conciencia, no por omisión.

Mientras no se decida, la opción 1 es la que yo recomendaría antes del primer
día con alumnos reales.

---

## 5. El detalle por ítem está vacío

`eventos_aprendizaje` recoge desde el primer día, para las 235 clases:
`inicio`, `fin`, `abandono` y `dificultad_percibida`. Con eso ya se puede medir
dosis, tasa de finalización, duración y qué clases se atragantan.

Lo que **no** hay es el evento `respuesta` con su `item_id` y su `resultado`.
Una clase de Tecnia no es un formulario: es un simulador, y sólo la propia
actividad sabe qué es un «ítem» dentro de sí misma.

La tubería está hecha y probada (`registrarItem`, y `marcarItem` que el host
expone), pero **ninguna de las 235 clases la llama todavía**. Emitirlos es una
línea por punto de evaluación dentro de cada actividad: es trabajo repartido,
no un problema de diseño. Conviene empezar por las clases donde el ítem es
evidente (las de opción múltiple y las de arrastrar-y-soltar).

---

## 6. `escuela_id` no está en las tablas de eventos

Por eso `npm run estudio:exportar -- --escuela X` **avisa de que no filtra** y
exporta todo. Las tablas de eventos guardan el seudónimo del alumno; averiguar
su escuela obligaría a leer `estudio_alumnos`, que es justo la tabla que la
exportación tiene prohibido tocar.

Arreglo: añadir `escuela_id` a `estudio_respuestas`,
`estudio_cuestionarios_aplicados` y `eventos_aprendizaje`, y que el cliente lo
mande junto con el resto. Son unas líneas en `aplicacion.ts` y `telemetria.ts`
más una migración. No se hizo aquí porque cambia el esquema que ya está escrito
y el orden del encargo era terminar la sección 3 primero.

---

## 7. Riesgo aceptado: cualquiera puede insertar filas

Las tablas de eventos aceptan `INSERT` de usuarios **anónimos**. Es necesario:
sin eso, los alumnos que entran sin cuenta no se medirían, y ese dato no se
recupera después.

El precio: la llave publicable de Supabase viaja en cada página —por diseño— y
con ella se pueden insertar filas basura desde fuera de la plataforma.

Lo que lo acota:

- `SELECT`, `UPDATE` y `DELETE` están cerrados a todo el que no sea admin: nadie
  puede leer, cambiar ni borrar lo escrito.
- `UNIQUE (alumno, cuestionario, reactivo)` impide inflar un mismo sujeto.
- `ancla` marca esas filas.

**Lo que falta:** una regla de *Rate Limiting* de Cloudflare sobre el endpoint
REST de Supabase, o mover la escritura a una ruta propia que valide. Y revisar
`errores.csv` y los conteos del panel de vez en cuando: un salto raro de filas
es la señal.

---

## 8. La cola de IndexedDB: ya probada, con dos huecos

**Resuelto durante esta sesión, y encontró algo.** El camino de IndexedDB —el
que van a usar todos los alumnos reales, porque todos los navegadores modernos
lo traen— no se había ejecutado ni una sola vez: jsdom no trae IndexedDB, así
que las pruebas iban por el camino de respaldo (`localStorage`) y el principal
sólo estaba escrito y revisado.

Ahora hay `src/__tests__/estudio-cola-indexeddb.test.ts` con `fake-indexeddb`,
que es una implementación completa de la especificación. Al escribirlo apareció
lo que impedía usarlo: `jest-environment-jsdom` no expone `structuredClone`, que
`fake-indexeddb` necesita para copiar cada valor guardado. Se suple con el
serializador de V8 en la cabecera del archivo.

Lo que sigue sin probarse, y conviene saberlo:

- **La base bloqueada por otra pestaña.** `abrir()` tiene un `setTimeout` de dos
  segundos para no colgarse en ese caso, y esa rama no la ejercita nada.
- **Las cuotas de disco reales del navegador.** Un equipo escolar con el disco
  lleno se comporta distinto de una base en memoria.

Las dos se cubrirían con una prueba de navegador (Playwright), que además
comprobaría la cola en el equipo de verdad.

---

## 9. El banco del examen de posicionamiento está sesgado (defecto preexistente)

No es del estudio, pero es un instrumento de medición que ya está en producción
y conviene arreglarlo antes de que alguien saque conclusiones de él:

**`src/lib/posicionamiento/preguntas.ts` tiene la respuesta correcta en la
primera posición en 17 de sus 20 preguntas.** Un alumno que pulse siempre la
primera opción saca 85 % sin saber nada, y el examen lo colocaría en el nivel
10.

Arreglo: barajar las opciones de cada pregunta cuidando el `correctaIdx`, y
añadir la misma prueba de reparto que ya vigila los bancos del estudio.

---

## 10. Cosas menores, pero anotadas

- **`descarga_reporte` nunca se emite.** El panel docente no tiene descarga de
  reportes todavía. La acción está definida para cuando la tenga.
- **El consentimiento del tutor está preparado y apagado**, como se pidió: la
  tabla tiene `tutor_de` y `codigo`, y `enlaceDeTutor()` genera el enlace, pero
  no hay pantalla que lo canjee. Encenderlo es una decisión legal.
- **La puerta del cuestionario vive en `CenHubRoot`**, que cubre hub, niveles,
  salas de Office y actividades. No cubre `/hub/posicionamiento` ni las páginas
  de banco de pruebas, que usan la misma cáscara pero a las que un alumno no
  llega por navegación normal.
- **`minutos_activos` subestima a propósito.** Sólo suma huecos entre eventos de
  menos de 60 segundos, y hoy los eventos son escasos (inicio/fin/abandono). En
  cuanto se emitan eventos por ítem (punto 4), la cifra se volverá mucho más
  fiel. Mientras tanto, **es una cota inferior, no una medida**.
- **La versión del aviso de privacidad es `2026-05`** y está escrita a mano en
  `src/lib/estudio/config.ts`. Cuando el texto cambie, hay que subirla ahí —y al
  subirla, a todo el mundo se le vuelve a pedir el consentimiento.
- **No se ha desplegado nada.** El SQL no está ejecutado en Supabase. Ver
  `RESUMEN_ESTUDIO.md`.
