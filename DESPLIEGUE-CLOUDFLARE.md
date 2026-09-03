# Desplegar Tecnia en Cloudflare

**centecnologia.com.mx** · Next.js 16 sobre Cloudflare Workers con
`@opennextjs/cloudflare` · escrito el 3-sep-2026

Este documento es la receta completa. Está pensado para poder repetirse dentro
de seis meses sin acordarse de nada.

---

## 0. Lo que hace falta antes de empezar

- Una cuenta de Cloudflare con el dominio `centecnologia.com.mx` añadido (los
  nameservers apuntando a Cloudflare).
- Node 22 y este repositorio con sus dependencias (`npm ci`).
- **Los videos**. No están en git (4,46 GB): o están en `public/assets/` en el
  equipo desde el que se despliega, o ya están subidos a R2. Ver §3.

### ¿Hace falta el plan de pago?

No por tamaño: el Worker pesa **2,57 MiB comprimido** y el techo del plan
gratuito son 3 MiB. Sí conviene por otra razón: el gratuito corta a 100 000
peticiones al día, y una escuela de 500 alumnos las gasta. Workers Paid son
$5 USD/mes.

---

## 1. Entrar

```bash
npx wrangler login          # abre el navegador, una sola vez por equipo
npx wrangler whoami         # comprueba que es la cuenta correcta
```

---

## 2. El bucket de los videos

```bash
npx wrangler r2 bucket create tecnia-medios
```

El nombre tiene que ser exactamente ése, o hay que cambiarlo también en
`wrangler.jsonc` (`r2_buckets[0].bucket_name`).

---

## 3. Subir los videos (una sola vez, y luego sólo los nuevos)

```bash
npm run medios:subir
```

Son 238 archivos y 4,46 GB, así que tarda. El guion lleva su propia lista en
`.medios/subidos.txt`: si se corta, se vuelve a lanzar y sigue donde iba.

```bash
npm run medios:estado       # dónde están los videos y cuántos van subidos
```

**Por qué los videos van aparte.** Workers Assets —el almacén de estáticos del
Worker— rechaza cualquier archivo de más de **25 MiB**, y 30 de los videos lo
pasan (el mayor, 49,9 MB). No es una preferencia: con ellos dentro, el
despliegue falla. Las imágenes sí se quedan en Assets, porque `next/image` las
lee por ese binding y una imagen en R2 sería una imagen que el optimizador no
encuentra.

Los sirve `src/app/assets/[...ruta]/route.ts`, que responde a las mismas URL de
siempre (`/assets/actividades/<id>/video-explicativo.mp4`) y entiende
peticiones parciales (`Range`), que es lo que usa el navegador para saltar
dentro de un video.

---

## 4. Desplegar

```bash
npm run deploy:cf
```

Eso hace tres cosas: aparta los videos de `public/` (si están), construye, y
despliega. Los videos vuelven a su sitio al terminar, pase lo que pase.

Para verlo antes de publicarlo, en el mismo runtime que usa Cloudflare:

```bash
npm run preview:cf          # http://localhost:8787
```

### Las variables de entorno

Las que empiezan por `NEXT_PUBLIC_` **las incrusta `next build` en el paquete
del navegador**: lo que vale es su valor en el momento de construir, o sea el
`.env.local` del equipo que despliega (o las variables del entorno en CI). Las
mismas están declaradas en `wrangler.jsonc` para el código de servidor.

| variable | valor | dónde |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `0` | `.env.local` y `wrangler.jsonc` |
| `NEXT_PUBLIC_APP_URL` | `https://centecnologia.com.mx` | igual |
| `NEXT_PUBLIC_SUPABASE_URL` | la del proyecto | igual |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la llave **publicable** | igual |
| `SUPABASE_SERVICE_ROLE_KEY` | la llave **secreta** | **sólo `.env.local`, nunca desplegada** |

La llave secreta se salta todas las políticas RLS. No la usa ningún archivo de
`src/`: sirve para administrar el proyecto (crear cuentas, migraciones) desde
un equipo de confianza. Una llave que no está desplegada no se puede filtrar
desde el despliegue.

`NEXT_PUBLIC_DEMO_MODE=1` haría dos cosas malas en producción: `robots.ts`
prohibiría a Google indexar el sitio entero, y los clientes de Supabase se
construirían con valores inservibles. Que esté en `0` es parte del despliegue,
no un detalle.

---

## 5. El dominio

**Estado al 3-sep-2026: pendiente, y por una razón concreta.**
`centecnologia.com.mx` ya tiene los nameservers de Cloudflare
(`val.ns.cloudflare.com`, `finley.ns.cloudflare.com`), pero la zona **no está
en la cuenta desde la que se despliega** (`campanaeducativanacional@gmail.com`,
id `226aa1ea…`). Cloudflare lo dice sin rodeos: «The zone
"centecnologia.com.mx" does not exist on your account» (código 10083). Y el
dominio todavía no resuelve a ninguna IP.

Hay dos caminos:

1. **Añadir el sitio a esta cuenta**: panel de Cloudflare → *Add a site* →
   `centecnologia.com.mx`. Como los nameservers ya apuntan a Cloudflare, la
   activación es rápida (hay que comprobar que los que asigne coinciden con
   los que tiene puestos el registrador).
2. **Desplegar desde la cuenta que ya tenga la zona**: `npx wrangler login`
   con esa cuenta y volver a `npm run deploy:cf`.

Con la zona en su sitio, se descomenta el bloque `routes` de `wrangler.jsonc`
y `wrangler deploy` crea los registros DNS y el certificado solo.

> **Cuidado, esto costó una caída de varios minutos.** Al declarar `routes`,
> wrangler **apaga el subdominio `workers.dev`**. Si el paso de dominios falla
> después —como pasó—, el sitio se queda sin ninguna dirección. Por eso
> `wrangler.jsonc` lleva `"workers_dev": true` explícito: déjalo puesto hasta
> haber comprobado que el dominio responde.

---

## 6. Las cuentas

La sesión es de Supabase y **el rol vive en `app_metadata.rol`**, no en
`user_metadata`: `app_metadata` sólo lo escribe la llave secreta desde el
servidor, así que un alumno no puede ascenderse a docente editando su propio
perfil.

| cuenta | correo | entra a |
|---|---|---|
| docente | `docente@centecnologia.com.mx` | `/hub/docente` |
| alumno | `alumno@centecnologia.com.mx` | `/hub` |

Para crear más (desde un equipo con la llave secreta en `.env.local`):

```powershell
$k = $env:SUPABASE_SERVICE_ROLE_KEY
$h = @{ apikey = $k; Authorization = "Bearer $k"; 'Content-Type' = 'application/json' }
$cuerpo = @{
  email = 'profe.martinez@centecnologia.com.mx'
  password = 'una-contraseña-larga'
  email_confirm = $true
  app_metadata = @{ rol = 'docente' }        # 'docente' | 'alumno' | 'admin'
  user_metadata = @{ nombre = 'Ana Martínez' }
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri 'https://tnobteemrdhcqqmjwxbt.supabase.co/auth/v1/admin/users' `
  -Headers $h -Method POST -Body $cuerpo -UserAgent 'tecnia-admin/1.0'
```

El `-UserAgent` no es un adorno: Supabase rechaza la llave secreta si la
petición parece venir de un navegador, y el agente por omisión de PowerShell lo
parece.

**«Explorar sin cuenta» sigue existiendo** a propósito: la plataforma se enseña
en escuelas y ferias sin repartir credenciales.

---

## 7. Lo que NO está en el repositorio

| qué | cuánto | dónde vive |
|---|---|---|
| Los 238 videos | 4,46 GB | R2 (`tecnia-medios`) |
| `video-explicativo/` | 11,2 GB | sólo en el equipo: es el taller de Remotion, no parte del sitio |
| `_backups/` | 19 MB | sólo en el equipo (contiene copia de `.env.local`) |
| `.env.local` | — | sólo en el equipo |

Las **imágenes sí están** (669 MB, 762 PNG), así que quien clone el repo puede
construir un sitio completo salvo los videos.

---

## 8. Cuando algo falla

**`EBUSY: resource busy or locked, rmdir '.open-next\assets'`**
Hay un `wrangler dev` o un `workerd` vivo agarrando la carpeta. Ciérralos:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='workerd.exe'" |
  Where-Object { $_.CommandLine -match 'wrangler' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

**`ENOSPC: no space left on device`**
El build necesita ~2 GB libres. La caché de webpack crece sin techo (se midió
en 3,76 GB): `npm run build:cf` ya la borra antes y después, pero si el disco
está al límite, empieza por ahí (`.next/cache`).

**El despliegue se queja de `images` / Images no está habilitado**
Quita el bloque `"images": { "binding": "IMAGES" }` de `wrangler.jsonc`.
OpenNext lo detecta y sirve el PNG original sin optimizar: más pesado para el
alumno, pero nada se rompe.

**Un video da 404 en producción**
No está en R2. `npm run medios:estado` y `npm run medios:subir`.

**El Worker no cabe (más de 10 MiB comprimido)**
Se mide de verdad, no se adivina: `.open-next/server-functions/default/handler.mjs.meta.json`
es el metafile de esbuild y dice byte a byte de dónde viene cada parte. Así se
encontraron los tres PNG incrustados en base64 (2,18 MB) y las 235 actividades
compilándose para un servidor donde nunca corren (11,4 MB). Lo siguiente que
sacaría son las 23 pantallas de banco de pruebas (~0,7 MB).

---

## 9. Lo que queda pendiente

- **Las imágenes están sin optimizar**: 762 PNG, 669 MB, 850 KB de media. Con
  el tamaño correcto pesarían una fracción — se vio con la imagen de redes
  sociales, que pasó de 696 KB a 81 KB sin que se note. Para un alumno con el
  wifi de una escuela pública, eso es la diferencia entre que una pantalla
  abra o no.
- **El progreso del alumno sigue en `localStorage`**, no en Supabase: en un
  equipo compartido, el avance de un alumno se le atribuye al siguiente.
- **Las páginas no se protegen en el servidor.** La sesión decide a dónde te
  manda el login y qué hub ves, pero la frontera de verdad para los datos será
  RLS en Supabase, el día que haya datos del alumno que leer.
- **El límite de intentos de login** lo hacía el proxy que se retiró. En
  Cloudflare eso es una regla de Rate Limiting del WAF sobre `/log-in`, que se
  configura en el panel y funciona mejor (es por IP y global, no por instancia).
