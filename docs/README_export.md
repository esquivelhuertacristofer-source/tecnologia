# Exportación del estudio de impacto — descripción de columnas

Este documento describe **cada columna** de los CSV que produce
`npm run estudio:exportar`. Es lo que acompaña al volcado que recibe la
universidad.

```bash
SUPABASE_URL=https://TU_PROYECTO.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
  npm run estudio:exportar -- --salida ./export-estudio
```

---

## Antes de leer una sola cifra

**El sujeto no siempre es una persona.** Todas las tablas traen una columna
`ancla`:

| valor | qué significa |
|---|---|
| `cuenta` | El alumno entró con la cuenta de su escuela. **El sujeto es una persona**, y sigue siendo el mismo aunque cambie de computadora. |
| `navegador` | El alumno entró con «Explorar sin cuenta». **El sujeto es un NAVEGADOR, no una persona.** En un aula con equipos compartidos, todos los alumnos que usen esa máquina comparten identificador y sus respuestas quedan mezcladas. |

Un pretest y un postest con `ancla = 'navegador'` pueden ser de dos niños
distintos. **La decisión de qué hacer con esas filas es de la universidad**,
pero hay que tomarla explícitamente; lo que no se puede es promediarlas con las
demás sin mirar. La recomendación del equipo técnico es analizar por separado, o
restringir el estudio a `ancla = 'cuenta'`.

**No hay datos personales en ningún archivo.** `alumno` y `docente` son UUID sin
significado. La tabla que une esos UUID con la identidad real (`estudio_alumnos`)
**no se exporta nunca**: es lo que hace anónimo a este volcado.

**Dos relojes.** `ts_cliente` es el reloj del alumno —cuándo pasó de verdad— y
`recibido_en` el del servidor —cuándo llegó—. Pueden separarse días si el equipo
estaba sin internet: la plataforma encola y manda después. Para analizar
**cuándo ocurrió algo se usa `ts_cliente`**; `recibido_en` sirve para medir la
conectividad de la escuela y para detectar relojes mal puestos.

---

## `respuestas.csv` — una fila por reactivo contestado

Cuestionarios de entrada, salida y las dos escalas de actitud.

| columna | tipo | descripción |
|---|---|---|
| `evento_id` | uuid | Identificador único de la escritura. Generado en el navegador; sirve para que un reenvío no duplique. |
| `alumno` | uuid | Seudónimo del sujeto. |
| `ancla` | texto | `cuenta` o `navegador`. **Leer la advertencia de arriba.** |
| `cuestionario` | texto | `entrada`, `salida`, `actitud_entrada` o `actitud_salida`. |
| `version_cuestionario` | texto | Versión del banco de reactivos, p. ej. `2026-09-05-provisional`. Si cambia a mitad del estudio, las respuestas de versiones distintas no son comparables sin revisar qué cambió. |
| `reactivo` | texto | Id del reactivo: `E01`–`E18` en entrada, `S01`–`S18` en salida, `A01`–`A04` en actitud. |
| `respuesta` | entero | Índice de la opción elegida, empezando en 0. En opción múltiple, 0–3. En la escala de actitud, 0–4 (0 = «Nada», 4 = «Mucho»). **Vacío** = el alumno pulsó «Aún no lo sé». |
| `correcta` | booleano | `true`/`false` en los reactivos de conocimiento. **Vacío** en los de actitud, que no tienen respuesta correcta. Un «aún no lo sé» va como `false`. |
| `tiempo_ms` | entero | Milisegundos desde que el reactivo apareció hasta que se confirmó la respuesta. No hay límite de tiempo, así que valores enormes son normales (el alumno se levantó). |
| `orden` | entero | Posición en la que se presentó, empezando en 1. **El orden es fijo para todos los alumnos**, así que esta columna coincide siempre con la posición del reactivo en el banco; se guarda de todos modos para poder detectar si algún día deja de ser así. |
| `ts_cliente` | timestamp | Cuándo contestó, según su reloj. |
| `recibido_en` | timestamp | Cuándo llegó al servidor. |

### Cómo cruzar entrada con salida

Los dos bancos son **formas paralelas**: mismo constructo, distinto enunciado.
Cada reactivo de salida declara de cuál de entrada es equivalente. Esa
correspondencia está en `data/estudio/cuestionario_salida.json`, en el campo
`paraleloDe`, y es un mapeo uno a uno: `S01`↔`E01`, `S02`↔`E02`… `S18`↔`E18`.

También comparten `competencia` y `dificultad`, que están en los JSON de
`data/estudio/` y **no se repiten en el CSV** para no duplicar una fuente de
verdad que la universidad va a corregir.

Las seis competencias: `alfabetizacion_digital`, `ciudadania_digital`,
`pensamiento_computacional`, `datos_e_informacion`, `productividad_office`,
`ia_y_criterio`. Cada una se mide con tres reactivos: uno fácil, uno medio y
uno difícil.

La escala de actitud **no** es de forma paralela: son las mismas cuatro
preguntas literales en entrada y en salida, que es como se mide un cambio de
actitud. Sus competencias son `actitud_gusto`, `actitud_autoeficacia`,
`actitud_utilidad` y `actitud_continuidad`.

---

## `cuestionarios_aplicados.csv` — una fila por cuestionario empezado

Sirve para distinguir **«lo empezó y lo dejó»** de **«no lo abrió nunca»**. Sin
esta tabla los dos casos son el mismo silencio.

| columna | descripción |
|---|---|
| `evento_id`, `alumno`, `ancla`, `cuestionario`, `version_cuestionario` | Igual que arriba. |
| `inicio` | Cuándo se le mostró por primera vez. |
| `fin` | Cuándo contestó el último reactivo. **Vacío** si no lo terminó. |
| `completado` | `true` sólo si contestó todos los reactivos. |
| `dispositivo` | `escritorio`, `tablet`, `movil` o `desconocido`. Etiqueta gruesa: **no se guarda el user-agent completo**, que junto con la hora y la escuela se acercaría a identificar a una persona. |
| `version_app` | Versión de la plataforma. Permite descartar los datos de una compilación con un defecto conocido sin descartar la escuela entera. |

Puede haber **dos filas por alumno y cuestionario**: una al empezar
(`completado = false`) y otra al terminar (`completado = true`). Para contar
cuántos terminaron, filtrar por `completado = true`; para cuántos empezaron,
contar `alumno` distintos.

---

## `eventos.csv` — telemetría de las clases

Formato estándar, común a las siete plataformas del estudio.

| columna | descripción |
|---|---|
| `evento_id` | UUID generado en el cliente. |
| `alumno`, `ancla` | Igual que arriba. |
| `actividad_id` | Id de la clase, p. ej. `n1-arma-tu-computadora` o `of-word-la-cinta`. |
| `item_id` | Ítem dentro de la clase, si aplica. **Hoy casi siempre vacío** — ver la advertencia de abajo. Para `tipo = 'dificultad_percibida'` lleva la etiqueta en texto. |
| `tipo` | `inicio`, `respuesta`, `abandono`, `fin` o `dificultad_percibida`. |
| `resultado` | `-1` sin respuesta · `0` incorrecto · `1` correcto. Para `dificultad_percibida`: **`1` = fácil, `0` = normal, `-1` = difícil**. |
| `tiempo_ms` | Duración. En `fin` y `abandono`, lo que duró la sesión con la clase abierta. |
| `intentos` | Número de intentos, cuando la actividad lo reporta. |
| `ts_cliente`, `recibido_en` | Los dos relojes. |
| `version_app` | Versión de la plataforma. |

> **Aviso sobre `item_id`: hoy el detalle por ítem está casi vacío, y es
> importante saberlo antes de diseñar un análisis que dependa de él.**
>
> Una clase de Tecnia no es un formulario de reactivos: es un simulador. Sólo
> la propia actividad sabe qué es un «ítem» dentro de sí misma. La plataforma
> tiene la tubería lista (`onItem` en el contrato de actividad) pero **ninguna
> de las 235 clases la llama todavía**.
>
> Lo que sí hay para las 235 desde el primer día: `inicio`, `fin` y `abandono`
> con su duración, que ya permiten medir dosis, tasa de finalización y qué
> clases se atragantan. Ver `PENDIENTES_ESTUDIO.md`.

---

## `dosis_semanal.csv` — cuánto usó cada alumno la plataforma

Una fila por alumno y semana. Es una **vista**, calculada de `eventos`, así que
nunca puede estar desincronizada de ellos.

| columna | descripción |
|---|---|
| `alumno`, `ancla` | Igual que arriba. |
| `semana` | Lunes de la semana (`date_trunc('week')`). |
| `sesiones` | Número de sesiones. Una sesión nueva empieza cuando pasaron **más de 30 minutos** sin ningún evento. |
| `minutos_activos` | **La definición importa.** NO son minutos con la pestaña abierta: se suman sólo los huecos entre eventos consecutivos **menores de 60 segundos**. Un hueco mayor cuenta como cero, porque ahí el alumno se fue a otra cosa aunque la pestaña siguiera abierta. Consecuencia asumida: una clase que se juega en silencio durante tres minutos sin generar eventos cuenta menos de lo que duró. Es una medida **conservadora** — subestima, no infla. |
| `actividades_iniciadas` | Eventos de tipo `inicio`. |
| `actividades_completadas` | Eventos de tipo `fin`. |
| `dias_distintos` | Días de calendario con alguna actividad. Es la medida de regularidad. |

---

## `contexto_escuela.csv` — la ficha del plantel

Una fila por escuela. Explica gran parte del resultado: una escuela sin internet
y con un equipo para todo el grupo no se puede comparar con una de uno por
alumno. **Sin controlar por esto, esas diferencias se leen como diferencias de
aprendizaje.**

| columna | valores |
|---|---|
| `escuela_id` | Clave corta del plantel. |
| `conectividad` | `buena`, `intermitente`, `sin_internet` |
| `dispositivos` | `uno_por_alumno`, `compartidos`, `solo_docente` |
| `modalidad` | `presencial`, `mixta`, `a_distancia` |
| `zona` | `urbana`, `rural` |
| `notas` | Texto libre del administrador. |
| `capturado_en` | Cuándo se capturó. |

`capturado_por` se **elimina en la exportación**: identifica a la persona que
llenó la ficha.

---

## `consentimientos.csv` — el registro legal

Se exporta **agregable, no identificable**: se eliminan `cuenta`, `user_agent`,
`ip_truncada`, `tutor_de` y `codigo`. Lo que queda sirve para responder «cuántos
consintieron, con qué versión del aviso y cuándo», que es lo que el análisis
necesita.

| columna | descripción |
|---|---|
| `id` | Identificador de la fila. |
| `tipo` | `alumno`, `tutor`, `docente` o `institucion`. |
| `version_aviso` | Versión del aviso de privacidad aceptada, p. ej. `2026-05`. Cada versión genera su propia fila: no se actualiza la anterior. |
| `otorgado_en` | Cuándo. |

El registro completo —con IP truncada y user-agent— **sí existe en la base**,
como prueba legal. Simplemente no viaja al análisis.

---

## `bitacora_docente.csv` — adopción docente

De nada sirve que la plataforma enseñe bien si el docente no entra. Un grupo con
un maestro que revisa el panel cada semana y otro con un maestro que no ha
entrado nunca son **dos tratamientos distintos**.

| columna | descripción |
|---|---|
| `docente` | Seudónimo, del mismo tipo que el del alumno. Sin nombre ni correo. |
| `accion` | `inicio_sesion`, `vista_panel_grupo`, `descarga_reporte`, `accion_sobre_alumno`. |
| `detalle` | Texto corto (máx. 200 caracteres). Para las vistas, la ruta del panel. |
| `ts_cliente`, `recibido_en` | Los dos relojes. |

> `descarga_reporte` está definida pero **hoy no se emite nunca**: el panel
> docente todavía no tiene descarga de reportes. Aparecerá vacía.

---

## `errores.csv` — los fallos de la propia medición

La regla del estudio es que un fallo de medición **nunca se le enseña al
alumno**. Esta tabla es el otro lado de esa regla: si algo se está perdiendo,
aquí se ve.

| columna | descripción |
|---|---|
| `origen` | Dónde falló, p. ej. `avance.guardar`, `sincroniza.enviar`. |
| `detalle` | Mensaje del error, recortado a 500 caracteres. |
| `extra` | JSON con contexto (qué cuestionario, qué tabla). |
| `ts_cliente`, `recibido_en` | Los dos relojes. |

**Revisar este archivo antes de analizar nada.** Muchas filas de
`sincroniza.enviar` significan que hubo datos que no llegaron; muchas de
`avance.guardar`, que hubo equipos con el almacenamiento bloqueado y alumnos que
pudieron ver dos veces el mismo cuestionario.

---

## Lo que el volcado NO contiene

- `estudio_alumnos` — la tabla que une seudónimo e identidad. **Nunca se
  exporta.** Es lo que hace anónimo a todo lo demás.
- Nombres, correos, grupos escolares o cualquier otro dato que identifique a un
  menor.
- El filtro `--escuela` **todavía no funciona**: las tablas de eventos guardan el
  seudónimo del alumno y no la escuela, y averiguar la escuela obligaría a leer
  la tabla prohibida. Se exporta todo y el filtro se hace en el análisis. Está en
  `PENDIENTES_ESTUDIO.md`.
