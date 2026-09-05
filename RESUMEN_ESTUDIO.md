# Estudio de impacto — qué se hizo, cómo probarlo, cómo desplegarlo

5 de septiembre de 2026.

---

## ⚠ LO PRIMERO: antes de que entre el primer alumno

El cuestionario de entrada **sólo se puede aplicar una vez**, el día que el
alumno entra por primera vez. Si la escuela no está encendida ese día, ese
alumno queda fuera del estudio para siempre.

La bandera está **apagada por omisión** a propósito (una escuela que no aceptó
participar no puede ver un cuestionario). Encenderla es esto:

1. Ejecutar `supabase/migrations/estudio_impacto.sql` en el SQL Editor de
   Supabase, entero, de una vez. Es idempotente.
2. Entrar como **administrador** a `/hub/docente/estudio`.
3. Añadir la escuela (clave corta + nombre) y pulsar el interruptor hasta que
   diga **«Participa en el estudio»**.
4. Comprobar que el aviso naranja «no se está midiendo a nadie» **ya no
   aparece**.

Si los alumnos ya están en el salón y no hay tiempo para nada de esto, la salida
de emergencia es una variable de entorno, y con ella participa todo el que entre:

```bash
NEXT_PUBLIC_ESTUDIO_FORZAR=1
NEXT_PUBLIC_ESTUDIO_ESCUELA=sec-14-toluca
```

Recuerda que `NEXT_PUBLIC_*` se incrusta **al construir**: hay que reconstruir y
volver a desplegar para que surta efecto.

**Y una decisión que hay que tomar hoy, no después:** que las escuelas del
estudio entren **con cuenta**. Sin cuenta, el identificador es del navegador y no
de la persona; en un aula con equipos compartidos las respuestas de varios niños
se mezclan en un mismo sujeto y el pretest/postest deja de medir aprendizaje.
Está explicado en `PENDIENTES_ESTUDIO.md` §3.

---

## Qué se hizo

### §3 · Cuestionario de entrada y salida — completo

Un **módulo genérico** que se configura con un JSON de reactivos y sirve para
entrada, salida, la escala de actitud y lo que venga después.

- `src/lib/estudio/cuestionario/tipos.ts` — el contrato: id, enunciado,
  opciones, correcta, competencia, dificultad.
- `motor.ts` — lógica pura: qué reactivo toca, retomar, no repetir, validar el
  banco. No toca DOM ni red.
- `bancos.ts` — carga los cuatro JSON. Se importan estáticamente para que **un
  alumno sin conexión pueda contestar el primer día**.
- `almacen.ts` — el avance en el navegador; es lo que garantiza «al volver
  continúa donde quedó».
- `aplicacion.ts` — une motor, almacén y cola; escribe las dos tablas.
- `src/components/estudio/Cuestionario.tsx` — la pantalla.
- `src/components/estudio/PuertaEstudio.tsx` — decide si toca aplicar algo.
  Montada en `CenHubRoot`, cubre hub, niveles, salas de Office y actividades, y
  ninguna pantalla del docente.

Cumple lo pedido: se aplica una sola vez, retoma donde se quedó, **sin
retroalimentación de ninguna clase**, sin límite de tiempo pero midiendo el
tiempo por reactivo, orden fijo, y tono neutro sin la palabra «examen».

**Los reactivos:** 18 de entrada y 18 de salida en forma paralela, 4 opciones,
seis fáciles / seis medios / seis difíciles, seis competencias medidas cada una
en las tres dificultades. En `data/estudio/`. **Son provisionales y hay que
validarlos con la universidad** — ver `PENDIENTES_ESTUDIO.md` §1.

### §4 · Consentimiento

Tabla `consentimientos` con versión del aviso, IP truncada y user-agent.

**La casilla no existía**: el login sólo tenía «Mantener mi sesión». Se añadió,
es obligatoria, y el aviso de privacidad ahora **enseña su versión** (antes sólo
tenía una fecha en prosa, que no acredita nada). Al subir `VERSION_AVISO` en
`src/lib/estudio/config.ts`, a todo el mundo se le vuelve a pedir.

El flujo del tutor está **preparado y apagado**, como se pidió: columnas
`tutor_de` y `codigo`, y `enlaceDeTutor()`. No hay pantalla que lo canjee.

> **Ojo con «Explorar sin cuenta»:** es un botón aparte que no pasa por el
> formulario, así que entra sin marcar la casilla — y sin embargo sí se mide.
> Es una decisión legal pendiente, explicada en `PENDIENTES_ESTUDIO.md` §4.

### §5 · Telemetría

`eventos_aprendizaje` con el formato estándar exacto: `resultado` −1/0/1,
`evento_id` generado en el cliente, dos marcas de tiempo. Cola en IndexedDB con
respaldo a `localStorage` y sincronía por lotes.

Enganchada en los dos hosts de actividad: **dos archivos miden las 235 clases**.
Hoy emite `inicio`, `fin` y `abandono`; el detalle por ítem necesita que cada
actividad lo reporte (`PENDIENTES_ESTUDIO.md` §4).

### §6 · Dosis

Vista `estudio_dosis` por alumno y semana. **`minutos_activos` = suma de huecos
entre eventos consecutivos menores de 60 segundos**, no minutos con la pestaña
abierta. Hoy subestima; es una cota inferior.

### §7 · Escala de actitud

Las cuatro preguntas, 1 a 5, mismo módulo, al terminar cada cuestionario. Se
repiten **literales** en entrada y salida (una escala de actitud se compara
consigo misma).

### §8 · Contexto del plantel

`estudio_contexto_escuela` y su ficha en `/hub/docente/estudio`.

### §9 · Auto-reporte de dificultad

Tira de tres botones al terminar cada clase. Opcional, no modal, los tres
botones iguales.

### §10 · Bitácora docente

`estudio_bitacora_docente`. Sin interfaz nueva: un componente que no pinta nada,
montado en el layout de `/hub/docente`.

### §11 · Exportación

`npm run estudio:exportar` produce ocho CSV. `docs/README_export.md` describe
cada columna. **`estudio_alumnos` no se exporta nunca**: es lo que hace anónimo
el volcado.

### §12 · Restricciones

- Nada de esto puede bloquear al alumno. Todos los fallos van a
  `estudio_errores`, y hay pruebas que, con el almacenamiento roto, comprueban
  las dos mitades: que el cuestionario **sigue avanzando** reactivo a reactivo,
  y que al terminarlo **la puerta se abre** y el alumno entra a la plataforma.
  La segunda mitad faltaba y ahí había un defecto — ver más abajo.
- Ninguna tabla del estudio guarda nombre ni correo.
- Bandera por escuela, apagada por omisión.
- Pruebas para todo lo nuevo.
- **No se desplegó nada.**

### El defecto que apareció al revisar esto

Vale la pena contarlo porque es la avería que el encargo prohíbe, y estaba
escrita por mí en el archivo que menos parecía tenerla.

La puerta preguntaba «¿qué toca ahora?» al almacén cada vez que el alumno
terminaba un cuestionario. En un equipo con `localStorage` bloqueado —modo
privado, política del equipo escolar, cuota llena— guardar el avance falla en
silencio, así que el almacén contestaba «nada contestado» y devolvía **el mismo
cuestionario**. Y como el valor no cambiaba, React ni siquiera volvía a pintar:
el botón «Continuar» dejaba de hacer nada y el alumno se quedaba encerrado
detrás de la medición, con el hub al otro lado.

No daba error, no llegaba a `estudio_errores`, y la suite estaba en verde: las
pruebas del almacenamiento roto llegaban hasta «sigue avanzando» y se paraban
justo antes de la salida.

Ahora la puerta se acuerda **en memoria** de lo que se terminó en la sesión
(`lectorConMemoria`), y eso vale aunque no se haya podido escribir en ningún
sitio. Se pierde el dato de ese alumno; no se pierde al alumno. Lo mismo cubre
el cuestionario que ni siquiera se pudo empezar, que era otra jaula igual.

---

## Cómo probarlo

```bash
npx tsc --noEmit
npx jest estudio                      # las pruebas del estudio
npm test                              # la suite completa
```

Las pruebas nuevas:

| archivo | qué vigila |
|---|---|
| `estudio-motor-cuestionario.test.ts` | orden fijo, no repetir, doble clic, sin retroalimentación |
| `estudio-bancos-reactivos.test.ts` | los JSON reales: reparto, forma paralela, posición de la correcta, tono |
| `estudio-cola-y-aplicacion.test.ts` | cola, idempotencia, errores en silencio, IP truncada |
| `estudio-cola-indexeddb.test.ts` | la cola sobre IndexedDB de verdad, no el respaldo |
| `estudio-sincronia.test.ts` | que una fila mala no se lleve por delante el lote |
| `estudio-secuencia.test.ts` | qué cuestionario toca, que sin participación no toque ninguno, y que **con el almacenamiento roto el alumno acabe saliendo** |
| `estudio-cuestionario-ui.test.tsx` | el cuestionario jugado entero con DOM |
| `estudio-participacion-y-telemetria.test.ts` | apagada por omisión, ventana de salida, formato estándar |

### A mano, en el navegador

```bash
NEXT_PUBLIC_ESTUDIO_FORZAR=1 npm run dev
```

1. Entra a `/hub`. Debe aparecer «Antes de empezar».
2. Contesta tres reactivos y **recarga**. Debe retomar en el cuarto, sin portada.
3. Termínalo. Aparece la escala de actitud, y al acabarla, el hub.
4. Vuelve a `/hub`. **No debe volver a aparecer nada.**
5. Abre una clase, complétala: debe salir «¿Cómo se te hizo esta clase?».
6. En DevTools → Application → IndexedDB → `tecnia_estudio` → `cola` están las
   filas pendientes.
7. **La prueba del equipo bloqueado**, que es la que importa: en una ventana
   privada con las cookies y el almacenamiento del sitio bloqueados, contesta
   el cuestionario entero. Debe dejarte pasar al hub igual. Si te quedas
   pulsando «Continuar» sin que ocurra nada, la puerta volvió a atrapar al
   alumno.

---

## Cómo desplegarlo

**No se ha desplegado nada.** El procedimiento:

1. **SQL.** `supabase/migrations/estudio_impacto.sql` en el SQL Editor, entero.
   Después, comprobar que las nueve tablas tienen RLS activada:

   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public'
     AND (tablename LIKE 'estudio_%' OR tablename IN ('consentimientos', 'eventos_aprendizaje'))
   ORDER BY tablename;
   ```

   Si alguna sale en `false`, esa tabla está abierta al mundo. Parar y revisar.

2. **Un administrador.** El panel exige `profiles.role = 'admin'`. Para ascender
   a alguien, desde un equipo con la llave secreta:

   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'quien@centecnologia.com.mx';
   ```

3. **Construir y publicar**, como siempre:

   ```bash
   npm run build:cf
   npx wrangler deploy
   ```

4. **Encender la escuela** en `/hub/docente/estudio` (ver el bloque del
   principio).

5. **Comprobar en producción** que llegan datos: abrir el hub como alumno,
   contestar dos reactivos, y mirar el pulso del panel. Si los contadores siguen
   en cero a los pocos minutos, revisar `estudio_errores`.

---

## Qué falta

En `PENDIENTES_ESTUDIO.md`, por orden de daño. Los tres primeros:

1. **Los reactivos son provisionales** y hay que validarlos con la universidad.
2. **Un solo instrumento para alumnos de 6 a 18 años** — decisión pendiente.
3. **El identificador es del navegador cuando no hay cuenta**, y eso convierte
   equipos compartidos en sujetos falsos.
4. **Quien entra con «Explorar sin cuenta» se mide sin haber consentido.**
   Decisión legal, no técnica, y conviene tomarla antes del primer día.

Y las decisiones discutibles, con su precio, en `DECISIONES_ESTUDIO.md`.
