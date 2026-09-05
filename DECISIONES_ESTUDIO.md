# Estudio de impacto — decisiones y por qué

5 de septiembre de 2026. Las decisiones que no eran obvias, con su razón y su
precio. Están aquí para que quien venga después pueda **discutirlas**, no para
justificarlas.

---

## 1. El identificador de estudio es un UUID separado de la cuenta

**Decisión.** Ninguna tabla del estudio guarda el `uid` de Supabase ni el
correo. Guardan un UUID sin significado. El puente entre ese UUID y la cuenta
real vive en **una sola tabla**, `estudio_alumnos`, cerrada con RLS y excluida
de la exportación.

**Por qué.** Se trata de menores de edad y el volcado sale de la organización
rumbo a una universidad. Con este diseño, ese volcado no identifica a nadie
aunque se pierda. Sin él, cualquier CSV con `uid` es reidentificable en cuanto
alguien tenga acceso a la tabla de perfiles.

**Precio.** Una consulta más al entrar (buscar o crear la fila del puente) y una
tabla más que mantener. Y que filtrar por escuela en la exportación no es
directo (ver `PENDIENTES_ESTUDIO.md` §5).

---

## 2. Todo pasa por una cola local antes de tocar la red

**Decisión.** Respuestas, eventos, consentimientos, bitácora y errores se
escriben en IndexedDB (o `localStorage`, o memoria) y se mandan después, por
lotes de 100, con `upsert` sobre un `evento_id` generado en el cliente.

**Por qué.** Tres razones, y las tres son del encargo. Escribir en local tarda
milisegundos, así que **nunca bloquea al alumno**. **Funciona sin conexión**, y
la conectividad intermitente es literalmente uno de los campos de la ficha de
plantel: sin cola, las escuelas peor conectadas —las más interesantes de medir—
no aportarían datos. Y el UUID del cliente hace que **reenviar un lote que ya
llegó no duplique nada**, que es el caso normal cuando se corta la red entre la
escritura y la confirmación.

**Precio.** Los datos llegan con retraso, a veces de días. Por eso hay dos
marcas de tiempo: `ts_cliente` dice cuándo pasó y `recibido_en` cuándo llegó.

---

## 3. La bandera de participación está apagada por omisión, y eso es peligroso

**Decisión.** `estudio_escuelas.participa` nace en `false`. Una escuela que no
está encendida no ve ni un cuestionario.

**Por qué.** Lo pide el encargo, y es lo correcto: aplicarle un cuestionario a
un alumno de una escuela que no aceptó participar es un problema legal, no un
descuido.

**El peligro, dicho en voz alta.** Una escuela mal configurada **no genera datos
y no avisa de nada**: los alumnos entran, juegan, todo funciona, y la medición
de entrada de ese día se pierde para siempre. Es indistinguible del éxito.

**Lo que se hizo contra eso.** El panel de administración enseña en grande
«Ninguna escuela participa todavía: no se está midiendo a nadie», con las
palabras completas. Y hay una salida de emergencia por variable de entorno
(`NEXT_PUBLIC_ESTUDIO_FORZAR=1`) para el piloto en el que los alumnos ya están
en el salón y no hay nada en la base todavía.

---

## 4. El cuestionario se elige y se confirma: dos toques, no uno

**Decisión.** Pulsar una opción la marca; hay que pulsar «Continuar» para
mandarla.

**Por qué.** Con un solo toque, un dedo de siete años que resbala queda grabado
como lo que ese alumno sabe. Medimos conocimiento, no puntería.

**Precio.** Un toque más por reactivo: 18 toques más en el cuestionario
completo.

---

## 5. Existe «Aún no lo sé»

**Decisión.** Un botón discreto que guarda `respuesta = null` y
`correcta = false`.

**Por qué.** Sin él, un alumno de primero de primaria ante un reactivo de nivel
9 se queda atascado, y atascar a un niño para medirlo es justo lo que el encargo
prohíbe. Además, **«no lo sé» es un dato distinto de «falló adivinando»** y el
análisis puede separarlos.

**Alternativa descartada.** Añadir «No lo sé» como quinta opción del reactivo.
Habría cambiado la probabilidad de acierto por azar de 25 % a 20 % y roto la
comparabilidad con cualquier norma de opción múltiple de cuatro alternativas.

---

## 6. Los reactivos van de fácil a difícil, y el orden es fijo

**Decisión.** El orden del banco no se baraja nunca, y va agrupado por
dificultad ascendente: seis fáciles, seis medios, seis difíciles.

**Por qué el orden fijo.** Lo pide el encargo, y hace comparables los tiempos
por reactivo entre alumnos: el reactivo número 7 es el mismo para todos.

**Por qué ascendente.** Con un solo instrumento para edades de 6 a 18 (ver
`PENDIENTES_ESTUDIO.md` §2), un alumno pequeño que se encontrara un reactivo
difícil de entrada abandonaría en el primero. Así contesta primero lo que puede.

**Precio.** El efecto de fatiga y el de dificultad quedan confundidos: los
reactivos difíciles son también los últimos. Se puede separar comparando con la
forma paralela, que tiene el mismo orden.

---

## 7. La forma paralela cambia el enunciado Y la posición de la correcta

**Decisión.** Cada reactivo de salida mide la misma competencia con la misma
dificultad y otro enunciado, y además su respuesta correcta está en otra
posición (coinciden como mucho un tercio, y hay una prueba que lo vigila).

**Por qué.** Si coincidieran, el alumno que recuerda «era la tercera» acertaría
en la salida sin haber aprendido nada, y esa ganancia falsa iría directa al
informe.

---

## 8. La escala de actitud NO es de forma paralela: se repite literal

**Decisión.** Las mismas cuatro preguntas, palabra por palabra, en entrada y en
salida.

**Por qué.** Es lo contrario que en conocimiento, y a propósito: una escala de
actitud mide el cambio comparando la misma pregunta consigo misma. Cambiarle el
enunciado destruiría esa comparación. Las formas paralelas existen para evitar
que el alumno recuerde la respuesta correcta, y aquí no hay respuesta correcta
que recordar.

---

## 9. La piel del cuestionario es sobria, contra el estilo de la plataforma

**Decisión.** Sin color pleno de videojuego, sin brillos, sin insignias, sin
celebración. Ni un verde ni un rojo en todo el CSS.

**Por qué.** El resto de Tecnia es deliberadamente vistoso, y está bien: es una
plataforma para niños. Pero esto no es una actividad, es un instrumento de
medición, y todo lo que emocione al alumno mientras contesta se cuela en el
dato. Que no haya ningún color con significado además hace que el día que
alguien añada un `.correcta` verde se note: rompería una regla escrita.

---

## 10. La telemetría se engancha en el host, no en las actividades

**Decisión.** `useTelemetriaActividad` vive en `CenActividadHost` y
`CenActividadOfficeHost`. Dos archivos miden las 235 clases.

**Por qué.** Editar 238 componentes de actividad para meter telemetría es una
tarde de trabajo mecánico y 238 oportunidades de romper una clase que funciona.

**Precio.** El host sólo sabe lo que el contrato le cuenta: inicio, fin,
abandono. El detalle por ítem necesita que cada actividad lo reporte (ver
`PENDIENTES_ESTUDIO.md` §4).

---

## 11. `abandono` se captura con `pagehide`, no con `beforeunload`

**Decisión.** El evento de abandono se dispara desde la limpieza del efecto de
React (navegación interna) y desde `pagehide` (cerrar pestaña o navegador).

**Por qué.** `beforeunload` y `unload` no se disparan de forma fiable en
navegadores móviles; `pagehide` sí. Y el evento se **encola**, no se manda: un
`fetch` en ese instante no llegaría, la página ya se está muriendo. Sale en la
siguiente visita, que es exactamente para lo que existe la cola.

---

## 12. «Minutos activos» se define por huecos entre eventos, y subestima

**Decisión.** Sólo suman los huecos entre eventos consecutivos **menores de 60
segundos**.

**Por qué.** Contar minutos con la pestaña abierta convertiría una computadora
encendida toda la tarde en cuatro horas de estudio.

**Precio, y hay que decirlo en el informe.** Hoy los eventos son escasos
(inicio, fin, abandono), así que una clase jugada en silencio durante tres
minutos suma cerca de cero. **Es una cota inferior, no una medida.** Mejorará
sola en cuanto se emitan eventos por ítem.

---

## 13. El auto-reporte de dificultad no es un diálogo

**Decisión.** Una tira bajo la actividad terminada, sin capa oscura, sin robar
el foco, que se puede ignorar navegando a otro sitio. Los tres botones se ven
iguales.

**Por qué.** El encargo pide «no interrumpir el flujo». Y los botones se ven
iguales porque en cuanto un color sugiere que una respuesta es la buena, el
alumno contesta lo que cree que se espera de él.

---

## 14. La exportación es un guion, no un endpoint

**Decisión.** `npm run estudio:exportar`, con la llave de servicio, en el equipo
de quien la tiene.

**Por qué.** Un endpoint de administrador que devuelve el volcado entero es una
puerta permanente al dato más sensible del proyecto, abierta a quien consiga una
sesión de admin. Un guion local no está expuesto a internet, y la llave de
servicio **no está desplegada** a propósito.

**Precio.** No se puede exportar desde el navegador; hace falta un equipo con la
llave.

---

## 15. Los usuarios anónimos pueden escribir en las tablas del estudio

La decisión completa, con su riesgo y lo que lo acota, está en
`PENDIENTES_ESTUDIO.md` §6. Resumen: es necesario para no perder a los alumnos
que entran sin cuenta, y se acota cerrando `SELECT`, `UPDATE` y `DELETE` a todo
el que no sea admin.

---

## 16. Un lote que falla se reintenta fila a fila

**Decisión.** La sincronía manda hasta 100 filas en una petición. Si esa
petición falla, se vuelven a mandar **una a una**, y las que fallan por
duplicado se dan por buenas y se sacan de la cola.

**Por qué.** Un lote va en una sola petición: si la base rechaza **una** fila,
falla la petición entera y las otras 99 se quedan sin escribir. Y hay un caso
realista en el que eso pasa: `estudio_respuestas` tiene
`UNIQUE (alumno, cuestionario, reactivo)`, así que un alumno al que se le borró
el `localStorage` a media faena vuelve a contestar un reactivo ya guardado y
genera exactamente esa fila. Como el `onConflict` del `upsert` es por
`evento_id` y no por esa clave, la fila choca **para siempre**: sin el reintento
individual se llevaría por delante 99 filas buenas en cada pasada, hasta agotar
los veinte intentos y descartarlas todas.

Se encontró leyendo el esquema, no en producción. En producción habría sido una
pérdida de datos silenciosa: los contadores del panel subiendo despacio y nadie
sabiendo por qué.

**Y un duplicado no se apunta como error.** Significa que el dato ya está
guardado, que es una condición normal. Apuntarlo llenaría `estudio_errores` de
ruido, y esa tabla sólo sirve si cuando tiene filas quiere decir algo.

**Precio.** Un lote con una fila mala cuesta 101 peticiones en vez de una. Pasa
rara vez y es el precio de no perder las otras 100.

---

## 17. `<<la materia>>` es «la tecnología»

Las cuatro preguntas de actitud del encargo traían un hueco. En esta plataforma
la materia es la tecnología, y así están escritas. Si el mismo módulo se usa en
otra de las siete plataformas, se cambia el JSON y nada más.
