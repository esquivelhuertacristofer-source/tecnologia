# Poner en marcha una escuela, de principio a fin

5 de septiembre de 2026.

Este documento cubre tres cosas: instalar el esquema (que hoy no existe),
entender por qué hay una tabla `escuelas`, y dar de alta a un colegio entero.

---

## 0. Lo primero: qué está roto y qué no

La base `tnobteemrdhcqqmjwxbt` está **vacía**: cero tablas, cero funciones. Se
comprobó contra el catálogo OpenAPI de PostgREST. Ninguna migración del
repositorio se aplicó nunca.

**Producción no está caída.** Comprobado el 5-sep-2026:

| qué | resultado |
|---|---|
| `centecnologia.com.mx/` y `/hub` | HTTP 200 |
| Auth de Supabase | responde (`invalid_credentials` con credencial falsa) |
| Usuarios existentes | 2: `alumno@` y `docente@centecnologia.com.mx` |
| Rol de esos usuarios | en `app_metadata.rol`, **no** en `profiles` |

Eso es lo que la salva. `rolDe()` en `src/lib/auth/sesion.ts` lee el rol del
JWT, el progreso del alumno vive en `localStorage`, y las 235 clases son
contenido estático. Un alumno entra, juega y avanza sin tocar una sola tabla.

**Lo que sí está muerto** es todo lo que la base sostiene: no hay grupos, no hay
cuentas más allá de esas dos, el progreso no sobrevive a cambiar de equipo, el
panel de administración del estudio no puede leer nada, y `requireAdmin` en
`src/lib/supabase-server.ts` lanza `FORBIDDEN: perfil no encontrado` para
cualquiera, porque consulta `profiles`.

O sea: la plataforma se ve entera y no lo es.

---

## 1. Instalar el esquema

Un solo archivo, un solo pegado:

```
supabase/INSTALAR_TODO.sql
```

Supabase Dashboard → SQL Editor → New Query → pegar entero → Run.

Sin comentarios de doble guion, sin acentos y sin un solo carácter fuera de
ASCII, para que sobreviva a copiarlo desde cualquier sitio. Es idempotente: se
puede volver a ejecutar. Termina con una consulta que enumera lo que quedó mal;
si no sale ninguna fila de problema, la última dice `INSTALACION COMPLETA`.

### Qué sustituye, y por qué no se aplican los archivos sueltos

El repositorio tiene nueve archivos SQL. Aplicarlos en fila deja la base
**rota**, y por tres motivos distintos:

**1. `handle_new_user` está definida cinco veces.** En `schema.sql`,
`security_triggers.sql`, `migration_v2.sql`, `institutional_full.sql` y
`fix_handle_new_user_role_escalation.sql`. Gana la última que se ejecute, y no
son equivalentes: la de `institutional_full.sql` es la única que apunta el
correo y vincula al alumno con su grupo. Aplicar el `fix_` al final —que es lo
que sugiere su nombre— **borra las dos cosas**. Ese `fix_` además ya no arregla
nada: la auditoría del 1-sep-2026 corrigió el `COALESCE` peligroso en los otros
cuatro archivos, así que hoy es una regresión disfrazada de parche.

**2. Tres policies causan recursión infinita.** Una policy sobre
`public.profiles` que hace `SELECT ... FROM public.profiles` vuelve a disparar
las policies de `profiles`. PostgreSQL lo corta con:

```
42P17 infinite recursion detected in policy for relation "profiles"
```

y a partir de ese momento **ningún usuario autenticado puede leer su propio
perfil**. Están en `schema.sql` (`teacher_reads_group_profiles`,
`admin_reads_all_profiles`) y en `fix_rls_alumno_ve_su_perfil.sql`
(`teacher_reads_assigned_students`). El propio repositorio sabe por qué no se
hace: el comentario de `get_my_role()` en `security_triggers.sql` dice
literalmente que es `SECURITY DEFINER` «para evitar recursión infinita en las
policies de la tabla profiles». Tres policies se saltaron esa regla.

En `INSTALAR_TODO.sql` todas preguntan por el rol a través de funciones
`SECURITY DEFINER`, que no vuelven a entrar en RLS. Y la verificación final
trae una comprobación que busca justo ese patrón: si algún día alguien vuelve a
escribir una policy recursiva, sale como `RECURSIVA`.

**3. El orden de los archivos no es el orden de las dependencias.** Las
policies de `institutional_full.sql` llaman a `get_my_role()`, que se define en
`security_triggers.sql`, que a su vez necesita `profiles`, que está en
`schema.sql`. El orden correcto no es «tablas, después seguridad», sino
**tablas → funciones auxiliares → policies**, y ningún archivo lo respeta por sí
solo.

Y un cuarto motivo que no es un defecto sino una oportunidad: **la base está
vacía, así que esto no es una migración, es una instalación**. No hay por qué
crear `grupos.nombre UNIQUE` global para después alterarlo. Se instala la forma
final directamente.

Los archivos originales se dejan donde están, como historia. El que se ejecuta
es `INSTALAR_TODO.sql`.

### Dos minas que el esquema evita a propósito

Vienen de una avería real en la plataforma hermana de NEM, no de teoría.

**1. El trigger no puede leer `raw_app_meta_data`.** El admin API de GoTrue crea
al usuario en dos pasos: primero `INSERT` en `auth.users`, y **después** aplica
el `app_metadata` con un `UPDATE`. Un trigger `AFTER INSERT` corre en medio, así
que sólo ve `provider` y `providers`. Ni rol, ni escuela.

Y falla en silencio: el perfil nace con el rol por omisión y sin escuela, la
llamada responde 200 y el alta parece haber ido bien. En NEM dejó **52 cuentas
recién creadas y 13 anteriores sin escuela, y sus 8 docentes guardados como
alumno**, sin poder entrar a su panel.

`handle_new_user` aquí lee sólo `raw_user_meta_data`, que sí viaja dentro del
`INSERT`. Y la verificación final comprueba que siga siendo así: si alguien
vuelve a meter `raw_app_meta_data` en el trigger, sale como
`LEE app_metadata: CARRERA DE GoTrue`.

**2. El guardia anti-escalada no puede eximir por `auth.uid() IS NULL`.** Es la
segunda mitad de la trampa. Si el guardia exige un rol elevado para tocar
`profiles`, la llave de servicio queda fuera —no tiene sesión ni perfil—, y
entonces **ningún proceso de backend puede corregir nada**: entre el trigger que
escribe mal y el guardia que impide arreglarlo, esas 65 cuentas eran
irreparables desde código.

Eximir con `auth.uid() IS NULL` tampoco vale, porque **eso no distingue la llave
de servicio de la anónima**: las dos tienen `uid` nulo. Aquí se distingue por el
claim del JWT:

| quién | `request.jwt.claims` | ¿exento? |
|---|---|---|
| SQL Editor / psql | `NULL` (no hay contexto PostgREST) | sí |
| llave de servicio | `role = service_role` | sí |
| anónimo | `role = anon` | **no** |
| sesión normal | `role = authenticated` | **no** |

**3. Y todas las comparaciones van en `COALESCE`.** `get_my_role()` devuelve
`NULL` cuando quien llama no tiene perfil, y en SQL una condición `NULL` no es
falsa: un `IF` con condición `NULL` **no entra**. O sea que el caso más
sospechoso —alguien autenticado sin perfil— era justo el que se saltaba todas
las comprobaciones. Sin perfil se trata como el rol más restrictivo.

---

## 2. Por qué hay una tabla `escuelas`

**La decisión: tabla `escuelas` con `escuela_id` y RLS por inquilino. No
prefijar los nombres de grupo.**

El problema es real: `grupos.nombre` era `UNIQUE` global, así que el segundo
colegio que intentara crear un «1A» chocaba con el primero.

Prefijar los nombres (`FROEBEL-1A`) hace que ese choque desaparezca, y no
resuelve nada más:

- **No aísla los datos.** La convención vive en la cabeza de quien da de alta.
  El día que alguien escriba `1A` sin prefijo, ese grupo queda visible para
  quien sepa buscarlo. Un `escuela_id` con RLS no depende de que nadie se
  acuerde de nada.
- **No hay a quién preguntarle por una escuela.** ¿Cuántos alumnos tiene
  Froebel? Con prefijos, un `LIKE 'FROEBEL-%'`. Con `escuela_id`, una clave
  foránea.
- **El estudio de impacto compara escuelas.** Es su unidad de análisis; sin
  tabla, no hay a qué colgar el contexto del plantel (§8) ni la bandera de
  participación.
- **Bachillerato ya lo resolvió así.** `cen-bachillerato` tiene `escuelas` con
  `cct` y `UNIQUE (escuela_id, nombre)` en grupos desde su primera migración.
  Que las siete plataformas guarden lo mismo de la misma manera es justo lo que
  permite compararlas.

Lo que cuesta: una tabla más y una columna más en `profiles`. Es un rato de
trabajo hoy contra una migración de datos con alumnos dentro mañana.

Lo que trae, además del nombre de grupo:

```sql
CREATE TABLE public.escuelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cct text UNIQUE,
  nivel text CHECK (nivel IN ('primaria','secundaria','bachillerato','mixto')),
  estado text, municipio text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.grupos (
  ...
  escuela_id uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,
  CONSTRAINT grupos_nombre_por_escuela UNIQUE (escuela_id, nombre)
);
```

Y cuatro roles con alcance distinto: `student` ve lo suyo, `teacher` ve a los
alumnos **de sus grupos**, `admin` ve **su escuela** y nada más, `super_admin`
ve todo. El aislamiento entre colegios lo hace la base, no la interfaz.

---

## 3. Dar de alta un colegio

```bash
node scripts/altas/alta-masiva.mjs \
  --archivo listas/froebel.csv \
  --escuela "Colegio Federico Froebel Zinacantepec" \
  --cct 15PPR0000X \
  --dominio froebel.tecnia.mx \
  --nivel mixto \
  --simulacro
```

**Empieza siempre por `--simulacro`.** Imprime los correos que va a fabricar y
no escribe nada. Las listas de niños llegan en una hoja de cálculo hecha a mano:
revisarla cuesta cinco minutos y deshacer cincuenta cuentas cuesta la mañana.

El CSV, con cabecera en cualquier orden (`scripts/altas/plantilla.csv`):

```
nombre,apellidos,rol,grupo,grado
Ana Sofia,Perez Lopez,alumno,P1,P1
Marisol,Aguilar Trejo,docente,"P1,P2",
```

`rol` es `alumno | docente | admin`. Un docente puede llevar varios grupos
separados por coma y queda como titular de todos.

### Cómo se fabrican los correos

`nombre.apellido@dominio`, y cuando ya está tomado se sube un escalón **con
significado** antes de recurrir a un número:

```
ana.perez  ->  ana.perez.l  ->  ana.g.perez.l  ->  ana.perez.lopez  ->  ana.perez2
```

Porque `ana.perez.l` le dice algo a la maestra que reparte contraseñas en el
salón —es Ana Pérez López— y `ana.perez2` no le dice nada.

Probado con 55 personas del tamaño real de Froebel, incluidas seis «Ana Pérez»:
55 correos, 55 distintos, ninguno malformado. La lógica está en
`scripts/altas/correos.mjs` y la vigilan 18 pruebas en
`src/__tests__/altas-correos.test.ts`.

Las contraseñas evitan los caracteres que un niño de seis años confunde al
copiarlos de un papel: fuera `0/O`, `1/l/I`, `5/S`, `2/Z`, las dos formas de
cada pareja.

### Escribe y vuelve a leer

El guion **no da por buena una escritura porque no diera error**. Después de
crear la cuenta escribe el perfil explícitamente —con un *upsert*, no un
`PATCH`, porque un `PATCH` sobre una fila que no existe afecta a cero filas y
PostgREST responde `204 No Content`, exactamente lo mismo que cuando sí
actualizó— y después **relee la fila** y compara campo a campo: rol, nombre,
correo, escuela y los grupos.

Al final imprime `COMPROBADO RELEYENDO: N de M perfiles quedaron como se pidió`
y, si alguno no quedó, dice quién y qué falló. **Termina con código distinto de
cero.** Un alta a medias que devuelve 0 es la forma de que nadie la mire.

Esa lógica está en `scripts/altas/verificacion.mjs` y la vigilan 14 pruebas en
`src/__tests__/altas-verificacion.test.ts`, escritas caso por caso desde la
avería de NEM: el docente guardado como alumno, el perfil sin escuela, la fila
que no existe, y el alumno cuyo perfil está perfecto pero no quedó en su grupo.

### Al terminar

Escribe `credenciales-<escuela>-<fecha>.csv` con nombre, rol, grupo, correo y
contraseña en claro. **Entrégalo y bórralo.** El `.gitignore` ya impide que se
suba, igual que la carpeta `listas/`.

El guion se puede repetir: un correo que ya existe no se toca ni se le cambia la
contraseña.

---

## 4. Froebel: lo que falta

10 grupos (1º a 6º de primaria, 1º a 3º de secundaria y prepa), 47 alumnos y 8
docentes. Todos llevan Tecnología, sin importar el nivel — el esquema no tiene
dimensión de materia, así que no hay nada que configurar por eso.

**Falta la lista de nombres.** No la invento: son 47 menores y un nombre mal
puesto es un niño que entra a la cuenta de otro. En cuanto llegue la hoja, se
llena `scripts/altas/plantilla.csv` y el alta es un comando.

Antes de ese comando hay que decidir dos cosas:

1. **El dominio de los correos.** `froebel.tecnia.mx` es una propuesta. No
   necesita existir ni recibir correo —las cuentas nacen confirmadas—, pero
   conviene que no choque con un dominio real del colegio.
2. **El CCT del plantel**, para que `escuelas.cct` sea el identificador oficial
   y no un nombre escrito a mano.

---

## 5. Después de instalar

1. Ascender a alguien a administrador. El trigger crea a todo el mundo como
   `student` a propósito: es lo que impide que cualquiera con la anon key —que
   viaja en cada página— se registre como admin llamando al REST de Auth.

   ```sql
   UPDATE public.profiles SET role = 'super_admin'
   WHERE email = 'quien@centecnologia.com.mx';
   ```

2. Las dos cuentas demo (`alumno@`, `docente@centecnologia.com.mx`) existen en
   Auth pero **no tienen perfil**: se crearon antes de que hubiera trigger.
   Después de instalar hay que crearles el suyo, o borrarlas y volverlas a
   crear. Sus contraseñas viajaron por chat y siguen sin rotar.

3. Comprobar que un alumno de verdad puede leer su perfil. Es la prueba que
   caza la recursión de RLS, y sólo se ve entrando con una sesión real:

   ```sql
   SELECT id, role FROM public.profiles WHERE id = auth.uid();
   ```

   Si sale `42P17`, alguien volvió a meter una policy recursiva.

---

## 6. Deudas que deja esta instalación

1. **Hay dos registros de escuelas.** `escuelas` es el inquilino —quién es el
   colegio, qué grupos tiene, quién ve qué— y `estudio_escuelas` es el registro
   del estudio de impacto: la bandera de participación y la ventana de salida.
   Se dejan separadas a propósito **hoy**, porque unirlas obliga a tocar el
   código del estudio y sus 143 pruebas, y eso no se hace el mismo día que se
   instala un esquema. Lo correcto a medio plazo es que `estudio_escuelas`
   cuelgue de `escuelas` con una clave foránea. Mientras tanto, al encender una
   escuela en el estudio hay que escribir su clave a mano y que coincida.

2. **El progreso del alumno sigue en `localStorage`.** Las tablas `progress` e
   `intentos` existen desde hoy, pero nadie escribe en ellas: la plataforma
   guarda el avance en el navegador. Un niño que cambia de equipo empieza de
   cero, y el docente no ve nada en su panel. Instalar el esquema no arregla
   esto por sí solo; hace falta enganchar el progreso, y es un trabajo aparte.

3. **`school_level` y `grade` son de la versión vieja.** Sobreviven porque
   `handle_new_user` los escribe, pero la pertenencia de verdad la da
   `alumnos_grupos`. No se usan para decidir qué ve un alumno —en Froebel todos
   llevan Tecnología, sin importar el nivel—, así que quedan como columnas
   informativas.

4. **El evento trigger `ensure_rls` de `security_triggers.sql` no se incluyó.**
   Activaba RLS automáticamente en cualquier tabla nueva. `CREATE EVENT TRIGGER`
   exige superusuario y en Supabase eso no está garantizado: incluirlo arriesga
   que el pegado entero falle a media instalación. Las 18 tablas llevan su
   `ENABLE ROW LEVEL SECURITY` explícito y la verificación final lo comprueba
   una por una, que es la misma garantía sin el riesgo.

