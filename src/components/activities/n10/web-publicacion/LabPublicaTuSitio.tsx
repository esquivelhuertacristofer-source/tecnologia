'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  EstudioWeb,
  atributo,
  buscar,
  primero,
  texto,
  useEstudioWeb,
  type ArchivoWeb,
  type Estudio,
  type EventoPagina,
  type GuionWeb,
  type HerramientaWeb,
  type PaginaAnalizada,
  type Publicacion,
} from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';
import { IMAGENES_ESTUDIO_LUMEN } from './recursosLumen';

/**
 * N10·U «Desarrollo web integral», parada 2 de 3 · «Publica tu sitio»
 * **N10 = Bachillerato = 15–18 años. Tono profesional.**
 *
 * ── El motor: `useEstudioWeb`, y por qué esta vez con `publicacion` real ────
 *
 * `n10-proyecto-web-real` (parada 1) enseñó a construir un sitio de cero.
 * Aquí el sitio YA está construido —el de Estudio Lumen, el despacho de
 * Renata Solís— y lo que se enseña es lo que pasa DESPUÉS de terminar de
 * escribir código: la revisión antes de publicar. Se usa el mismo mecanismo
 * de `publicacion` que estrenó `n6-publica-tu-pagina`
 * (`pasosPublicados` / `publicarPaso` / `publicado` / `direccion`, ver
 * `useEstudioWeb.ts`), pero un nivel más a fondo: dos páginas reales
 * (`index.html` + `contacto.html`, no una), un enlace roto que aparece DOS
 * veces (no una), un dato falso que es una exageración de confianza y no un
 * dato de contacto, y un dominio que hay que ELEGIR entre tres candidatos, no
 * uno que ya viene decidido.
 *
 * ── Por qué el guion mezcla `eleccion` y `pagina` (mismo patrón que N9) ──────
 *
 * Publicar no es sólo código: es criterio. Los encargos de `eleccion` —¿por
 * qué un dominio propio?, ¿por qué HTTPS?, ¿qué dominio elegir?— alternan con
 * los de `pagina` —corregir el dato falso, el enlace roto, lo que quedó a
 * medias—, exactamente el patrón que fijó `LabMarcaPersonal.tsx`: el armazón
 * no corrige por sí solo (canon, prueba 3), así que la clase envuelve
 * `estudio.elegir` para restar puntos y hablar en el primer fallo de cada
 * opción.
 *
 * ── Por qué los predicados de página comprueban `p.archivo === 'index.html'` ─
 *
 * El proyecto tiene DOS páginas, así que el estudio muestra el selector de
 * pestañas del navegador simulado desde el primer encargo (`EstudioWeb.tsx`,
 * `estudio.paginas.length > 1`). Si el alumno cambia la vista previa a
 * «contacto.html» mientras un encargo de `index.html` sigue abierto, el
 * predicado se llamaría sobre la página equivocada. La salida no es fingir
 * que eso no puede pasar: es que el predicado **conteste que no está hecho**,
 * nunca que tire ni que acierte por accidente. Mismo candado que
 * `tieneEnlaceAAdopta` en `n9-proyecto-integrador/guionSitio.ts`.
 *
 * ── El botón que no lleva a ninguna parte, dos veces y no una ───────────────
 *
 * El CTA «Contáctanos» existe en el menú Y al pie de la página, y las DOS
 * apariciones apuntan a «contact.html» en vez de «contacto.html». Corregir
 * sólo la primera y darlo por bueno es exactamente el defecto que este
 * encargo busca que el alumno no cometa: un enlace hay que probarlo, no sólo
 * mirarlo una vez.
 */

/* ═══ Los archivos con los que arranca el proyecto ══════════════════════════ */

export const PLANTILLA_INDEX_LUMEN = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Estudio Lumen — Arquitectura & Interiorismo</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <span class="marca">ESTUDIO LUMEN</span>
    <nav class="nav">
      <a href="index.html">Inicio</a>
      <a href="contact.html">Contáctanos</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Arquitectura e interiorismo con luz propia</h1>
    <p>Proyectos residenciales y comerciales, diseñados de principio a fin.</p>
  </section>

  <section id="sobre-nosotros">
    <h2>Sobre el estudio</h2>
    <p>Con más de siete años transformando espacios en la ciudad, Estudio Lumen es sinónimo de confianza.</p>
  </section>

  <section id="proyectos">
    <h2>Proyectos destacados</h2>
    <article class="proyecto">
      <img src="casa-jacaranda.jpg">
      <h3>Casa Jacaranda</h3>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
    </article>
    <article class="proyecto">
      <img src="cafe-almendro.jpg" alt="Interior del Café Almendro, con muros de madera clara y luz natural sobre la barra">
      <h3>Café Almendro</h3>
      <p>Rediseño de interior para una cafetería de 60 metros cuadrados, pensado para que la luz de la mañana entre hasta la barra.</p>
    </article>
  </section>

  <section id="testimonios">
    <h2>Lo que dicen quienes ya trabajaron con nosotros</h2>
    <blockquote>«Renata entendió exactamente lo que queríamos, incluso antes que nosotros» — Familia Reyes, Casa Jacaranda</blockquote>
  </section>

  <footer class="pie">
    <a class="cta" href="contact.html">Contáctanos</a>
    <p>Estudio Lumen · Arquitectura & Interiorismo</p>
  </footer>

</body>
</html>`;

export const PLANTILLA_CONTACTO_LUMEN = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Contacto — Estudio Lumen</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>

  <header class="cabecera">
    <span class="marca">ESTUDIO LUMEN</span>
    <nav class="nav">
      <a href="index.html">Inicio</a>
      <a href="contacto.html">Contáctanos</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Hablemos de tu proyecto</h1>
    <p>Cuéntanos qué espacio quieres transformar y te respondemos en menos de 48 horas.</p>
  </section>

  <section id="datos-contacto">
    <h2>Datos de contacto</h2>
    <ul class="lista-contacto">
      <li>Correo: hola@estudiolumen.mx</li>
      <li>Teléfono: 55 8811 0234</li>
      <li>Oficina: Colonia Roma Norte, Ciudad de México</li>
    </ul>
  </section>

  <footer class="pie">
    <a class="cta" href="index.html">Volver al inicio</a>
    <p>Estudio Lumen · Arquitectura & Interiorismo</p>
  </footer>

</body>
</html>`;

export const PLANTILLA_ESTILO_LUMEN = `/* estilo.css — con candado: el checklist de esta clase es de contenido,
   no de diseño. Fíjate en el nombre del archivo, arriba en su pestaña. */

body {
  background-color: #f5f1e8;
  color: #241c15;
  font-family: Georgia, 'Times New Roman', serif;
  margin: 0;
  padding: 0;
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 3px solid #b8863b;
}

.marca {
  font-weight: 900;
  letter-spacing: 3px;
  font-size: 1.1rem;
}

.nav a {
  margin-left: 24px;
  color: #241c15;
  text-decoration: none;
  font-family: Verdana, sans-serif;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero {
  padding: 56px 32px;
  text-align: center;
}

.hero h1 {
  font-size: 2rem;
  margin-bottom: 12px;
}

.hero p {
  color: #6b5f4f;
  font-family: Verdana, sans-serif;
  font-size: 1rem;
}

section {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
}

.proyecto {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ddd0b8;
}

.proyecto img {
  width: 100%;
  max-width: 320px;
  border-radius: 6px;
  display: block;
  margin-bottom: 12px;
}

.proyecto h3 {
  margin-bottom: 8px;
}

.proyecto p {
  font-family: Verdana, sans-serif;
  color: #4a4033;
  line-height: 1.6em;
}

blockquote {
  font-style: italic;
  border-left: 4px solid #b8863b;
  padding-left: 20px;
  color: #4a4033;
}

.lista-contacto {
  list-style-type: none;
  padding: 0;
}

.lista-contacto li {
  padding: 8px 0;
  font-family: Verdana, sans-serif;
}

.pie {
  text-align: center;
  padding: 40px 32px;
  border-top: 1px solid #ddd0b8;
}

.cta {
  display: inline-block;
  background-color: #b8863b;
  color: white;
  padding: 14px 32px;
  border-radius: 6px;
  text-decoration: none;
  font-family: Verdana, sans-serif;
  font-weight: bold;
  margin-bottom: 16px;
}`;

export const PLANTILLAS_LUMEN: Readonly<Record<string, string>> = {
  'index.html': PLANTILLA_INDEX_LUMEN,
  'contacto.html': PLANTILLA_CONTACTO_LUMEN,
  'estilo.css': PLANTILLA_ESTILO_LUMEN,
};

export function archivosInicialesLumen(): ArchivoWeb[] {
  return [
    { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA_INDEX_LUMEN },
    { nombre: 'contacto.html', lenguaje: 'html', texto: PLANTILLA_CONTACTO_LUMEN },
    { nombre: 'estilo.css', lenguaje: 'css', texto: PLANTILLA_ESTILO_LUMEN, soloLectura: true },
  ];
}

/* ═══ Publicar: dominio elegido en el encargo 6, tres pasos reales ══════════ */

export const PUBLICACION_LUMEN: Publicacion = {
  dominio: 'estudiolumen.mx',
  pasos: [
    {
      id: 'certificado',
      etiqueta: 'Activa el certificado HTTPS',
      detalle: 'El candado que acabas de explicar, ahora activado de verdad: a partir de aquí, todo lo que alguien escriba en el formulario de contacto viaja cifrado.',
    },
    {
      id: 'checklist-final',
      etiqueta: 'Confirma el checklist',
      detalle: 'Sin datos falsos, sin enlaces rotos y sin texto de relleno — exactamente lo que acabas de dejar listo en los encargos anteriores.',
    },
    {
      id: 'salir-a-produccion',
      etiqueta: 'Sal a producción',
      detalle: 'El sitio deja de vivir sólo en tu editor: se copia a un servidor real y la dirección empieza a responder de verdad.',
    },
  ],
};

/* ═══ Los predicados: cada uno se guarda de comprobar la página equivocada ══ */

/** El párrafo de "Sobre el estudio" sin la exageración, con el dato real. */
function sobreNosotrosVeraz(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  const parrafo = primero(p, '#sobre-nosotros p');
  if (!parrafo) return false;
  const t = texto(parrafo).toLowerCase();
  const sinExageracion = !t.includes('siete años') && !t.includes('7 años');
  const diceLaVerdad = t.includes('recién') || t.includes('primer despacho') || t.includes('acaba de');
  return sinExageracion && diceLaVerdad && t.trim().length >= 30;
}

/** «Contáctanos» aparece dos veces —menú y pie— y las DOS tienen que apuntar a la página real. */
function enlacesAContactoArreglados(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  const candidatos = buscar(p, 'a').filter((a) => (atributo(a, 'href') ?? '').toLowerCase().includes('contact'));
  if (candidatos.length < 2) return false;
  return candidatos.every((a) => atributo(a, 'href') === 'contacto.html');
}

/** La ficha de "Casa Jacaranda": sin el texto de relleno y con su foto descrita. */
function proyectoJacarandaListo(p: PaginaAnalizada): boolean {
  if (p.archivo !== 'index.html') return false;
  const parrafo = primero(p, '#proyectos .proyecto p');
  if (!parrafo) return false;
  const t = texto(parrafo).toLowerCase();
  const sinRelleno = !t.includes('lorem ipsum') && t.trim().length >= 30;
  const img = primero(p, '#proyectos .proyecto img');
  const altOk = img !== null && (atributo(img, 'alt') ?? '').trim().length >= 10;
  return sinRelleno && altOk;
}

/* ═══ El guion: seis encargos, alternando decidir y corregir ════════════════ */

export const GUION_PUBLICA_TU_SITIO: GuionWeb = {
  pasos: [
    {
      id: 'dominio-propio',
      titulo: '1. Antes de nada: ¿por qué un dominio propio?',
      instruccion:
        'Renata Solís, arquitecta recién egresada, está a punto de publicar el sitio de su despacho: Estudio Lumen. Hasta ahora sólo tenía un enlace en la biografía de su cuenta de Instagram. ¿Por qué le conviene tener un dominio propio, como estudiolumen.mx, en vez de depender sólo de esa cuenta?',
      pista: 'Piensa qué le queda a Renata si la red social cambia sus reglas, le limita el alcance a las cuentas nuevas, o un día deja de existir.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Un dominio propio se ve más elegante, nada más.',
          'Con un dominio propio, el sitio es suyo: no depende de una red social que puede cambiar sus reglas, limitar su alcance o desaparecer — y ella decide exactamente qué se publica.',
          'Un dominio propio es obligatorio por ley para cualquier negocio, sin excepción.',
        ],
        correcta: 1,
      },
      aprendido:
        'Un dominio propio es tuyo: nadie puede cerrarte la cuenta, cambiar el algoritmo que decide quién te ve, ni obligarte a competir por atención dentro de la plataforma de alguien más. Es el primer paso de tener presencia profesional que no depende de nadie más.',
    },
    {
      id: 'dato-verdadero',
      titulo: '2. El primer dato que hay que revisar: ¿es cierto?',
      instruccion:
        'Antes de tocar diseño ni enlaces, lee la sección «Sobre el estudio» en index.html. Dice que Estudio Lumen lleva más de siete años transformando espacios — pero Renata acaba de titularse y éste es su primer despacho. Corrige ese párrafo para que diga la verdad.',
      pista:
        'Reemplaza el párrafo por algo honesto, por ejemplo: «Renata Solís acaba de titularse como arquitecta. Estudio Lumen es su primer despacho, y éste es su primer proyecto publicado en línea.»',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: sobreNosotrosVeraz },
      aprendido:
        'Publicar un dato falso —aunque sea «sólo para verse más confiable»— es la manera más rápida de perder la confianza de un cliente real en cuanto lo note. Lo que sí construye confianza es contar la verdad bien contada: es su primer proyecto, y eso también es una historia que vender.',
    },
    {
      id: 'https-antes-de-publicar',
      titulo: '3. Por qué importa el candado en la barra de direcciones',
      instruccion:
        'En la página de contacto, un cliente real va a escribir su nombre, su correo y su teléfono para pedir una cotización. ¿Por qué es importante que el sitio use HTTPS —el candado junto a la dirección— antes de que eso pase, y no después?',
      pista: 'Piensa en el camino que recorre esa información entre el navegador del cliente y el servidor de Renata: ¿quién más podría estar viendo ese camino si no va cifrado?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Cifra la información en el camino, para que nadie más pueda leerla mientras viaja del navegador del cliente al servidor.',
          'Hace que la página cargue un poco más rápido, nada más.',
          'Es sólo un candado decorativo que el navegador dibuja solo, sin ningún efecto real.',
        ],
        correcta: 0,
      },
      aprendido:
        'Ese candado no es cosmético: sin HTTPS, cualquiera que comparta la misma red que el cliente —un wifi público, por ejemplo— podría leer su nombre, su correo y su teléfono mientras viajan hasta el servidor. Publicar un formulario real sin HTTPS es pedir datos reales sin poder garantizar que lleguen a salvo.',
    },
    {
      id: 'enlace-que-no-lleva',
      titulo: '4. El botón que no lleva a ninguna parte',
      instruccion:
        'El botón «Contáctanos» existe dos veces en index.html —en el menú y al pie de la página— y en las dos apunta a «contact.html». El archivo del proyecto se llama «contacto.html». Corrige los DOS enlaces para que sí lleven a la página real.',
      pista: 'Busca las dos veces que aparece href="contact.html" en index.html y cámbialas por href="contacto.html".',
      senal: { archivo: 'index.html', control: 'problemas' },
      logro: { tipo: 'pagina', comprueba: enlacesAContactoArreglados },
      aprendido:
        'Un enlace roto no avisa con una alarma: el botón se ve exactamente igual y sólo falla cuando alguien lo toca. Por eso un enlace hay que probarlo, no sólo mirarlo — y por eso «Contáctanos» existe dos veces en esta página: revisar sólo la primera habría dejado la segunda rota.',
    },
    {
      id: 'lo-que-quedo-a-medias',
      titulo: '5. Lo que se quedó a medias',
      instruccion:
        'La ficha de «Casa Jacaranda» todavía tiene el texto de relleno con el que empieza cualquier maqueta —«Lorem ipsum dolor sit amet…»— y su fotografía no tiene descripción. Escribe una descripción real del proyecto (mínimo 30 caracteres) y agrégale al <img> un alt que diga qué se ve en la foto.',
      pista: 'Fíjate cómo quedó resuelta la ficha de «Café Almendro», justo abajo: ese es el nivel de terminado que le falta a «Casa Jacaranda».',
      senal: { archivo: 'index.html', control: 'editor' },
      logro: { tipo: 'pagina', comprueba: proyectoJacarandaListo },
      aprendido:
        'El texto de relleno es una herramienta de quien diseña, para ver cómo se va a ver el párrafo antes de escribirlo de verdad — nunca es contenido que se publica. Y una foto sin descripción no sólo pierde una oportunidad con los buscadores: es invisible para quien navega con un lector de pantalla.',
    },
    {
      id: 'elige-el-dominio',
      titulo: '6. El nombre que va a llevar en la mano',
      instruccion: 'Con el sitio ya revisado, toca elegir el dominio de verdad. Renata tiene tres opciones disponibles. ¿Cuál eliges para Estudio Lumen?',
      pista: 'Piensa en cuál es el más corto, el que coincide con el nombre del estudio, y el que suena a un despacho de verdad y no a una cuenta improvisada.',
      logro: {
        tipo: 'eleccion',
        opciones: ['estudiolumen-arquitectura-e-interiorismo-cdmx.mx', 'estudiolumen.mx', 'lumen123.info'],
        correcta: 1,
      },
      aprendido:
        'estudiolumen.mx gana en las tres cosas que importan: es corto —se puede decir en voz alta sin perder a nadie—, coincide exactamente con el nombre del estudio, y usa una extensión que un cliente reconoce. El primero es casi imposible de teclear sin equivocarse; el tercero, con ese «123» y esa extensión, suena más a cuenta improvisada que a despacho profesional.',
    },
  ],
};

const ENCARGOS = GUION_PUBLICA_TU_SITIO.pasos.length;
const TOTAL_PASOS = ENCARGOS + PUBLICACION_LUMEN.pasos.length;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 2 de 3 · Renata Solís va a publicar el sitio de su primer despacho',
  tema: 'Publicación profesional: dominio, HTTPS y el checklist antes del botón',
  objetivo:
    'Vas a revisar un sitio real de principio a fin —un dato falso, un enlace roto, contenido a medias— y vas a decidir con criterio qué dominio y qué medidas de seguridad le corresponden a un negocio real antes de darle su dirección a un cliente.',
  vasAHacer: [
    'Entender por qué un dominio propio no es lo mismo que un enlace en una red social.',
    'Corregir un dato falso que el sitio da por hecho.',
    'Explicar por qué HTTPS importa antes de recibir datos reales de un cliente.',
    'Arreglar un enlace que no lleva a ninguna parte — dos veces.',
    'Terminar lo que se quedó a medias: un texto de relleno y una foto sin descripción.',
    'Elegir el dominio que de verdad representa al negocio.',
    'Publicar el sitio, paso a paso, con el panel real de publicación.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 30,
  insignia: { nombre: 'Ingeniería de lanzamiento', emoji: '🛰️' },
  boton: 'Abrir el proyecto de Estudio Lumen',
  acento: '#b8863b',
};

const LINEAS = {
  inicio:
    'Renata Solís acaba de titularse como arquitecta y está a punto de publicar el sitio de su primer despacho: Estudio Lumen. Antes de repartir la dirección a un solo cliente, hay que revisarlo de verdad — no basta con que se vea bien.',
  fallo: 'Ésa todavía no. Vuelve a leer la situación completa: ¿qué es lo que de verdad está en juego ahí?',
  construido: 'Los seis encargos están cumplidos: sin datos falsos, sin enlaces rotos y sin nada a medias. Ahora, y sólo ahora, se abre el panel de publicar.',
  publicando: [
    'Con HTTPS activo, lo que un cliente escriba en el formulario de contacto ya viaja cifrado — es justo lo que decidiste que importaba en el encargo 3.',
    'El checklist queda confirmado: nada falso, nada roto, nada a medias. Eso es lo que se revisa antes de dar una dirección a un cliente real.',
    'Publicado. Mira arriba, en la barra del navegador: ya no dice «archivo local».',
  ],
  fin: 'Estudio Lumen está en línea, en estudiolumen.mx. Y lo que te llevas no es el botón de publicar —eso es un clic—: es la lista de lo que se revisa antes de dártelo a apretar. Dominio propio, HTTPS, datos verdaderos, enlaces que sí llevan a alguna parte, y nada a medias.',
};

/* ═══ El laboratorio ═════════════════════════════════════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabPublicaTuSitio(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, restar, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * ENCARGOS);
      avanzar();
      reproducirTono('correct');
      setAviso('✔ ¡Encargo cumplido!');
      const paso = GUION_PUBLICA_TU_SITIO.pasos[hechos - 1];
      if (paso) hablar(paso.aprendido);
    },
    [avanzar, hablar],
  );

  /** Los seis encargos hechos: se abre el panel de publicar. */
  const alRevisado = useCallback(() => hablar(LINEAS.construido), [hablar]);

  const estudio = useEstudioWeb({
    archivos: archivosInicialesLumen(),
    guion: GUION_PUBLICA_TU_SITIO,
    recursos: IMAGENES_ESTUDIO_LUMEN,
    publicacion: PUBLICACION_LUMEN,
    onAvance: alAvanzar,
    onTerminado: alRevisado,
  });

  const fallosVistos = useRef(new Set<string>());
  const publicados = estudio.pasosPublicados.length;

  /*
   * La clase se pone delante de dos gestos del estudio, y de ninguno más —
   * mismo trato que `LabPublicaTuPagina.tsx` (N6) y `LabMarcaPersonal.tsx` (N9):
   *
   * `elegir` — los tres encargos de decisión son los únicos que el armazón no
   * corrige por sí solo (canon, prueba 3); la clase sabe cuál era la correcta
   * porque el guion es suyo, y penaliza/habla en el primer fallo de cada
   * opción (no en cada clic, para no castigar dos veces la misma equivocación).
   *
   * `publicarPaso` — los tres pasos de publicar también son parte de la
   * actividad y el armazón tampoco los cuenta solo: aquí se anota el avance y
   * se cierra el laboratorio al completar el último.
   *
   * Los dos, en el gesto y no en un efecto: un efecto que llama a `setState`
   * encadena renders (`react-hooks/set-state-in-effect`).
   */
  const conCuenta: Estudio = {
    ...estudio,
    elegir: (opcion: number) => {
      const e = estudio.encargo;
      if (e !== null && !e.hecho && e.paso.logro.tipo === 'eleccion' && opcion !== e.paso.logro.correcta) {
        const clave = `${e.paso.id}:${opcion}`;
        if (!fallosVistos.current.has(clave)) {
          fallosVistos.current.add(clave);
          restar();
          setAviso('✘ Ésa no era');
          hablar(LINEAS.fallo);
        }
      }
      estudio.elegir(opcion);
    },
    publicarPaso: (id: string) => {
      if (estudio.pasosPublicados.includes(id)) return;
      const cual = publicados;
      estudio.publicarPaso(id);
      avanzar();
      reproducirTono('correct');
      const quedan = PUBLICACION_LUMEN.pasos.filter((p) => p.id !== id && !estudio.pasosPublicados.includes(p.id));
      if (quedan.length > 0) {
        setAviso('✔ Paso dado');
        hablar(LINEAS.publicando[cual] ?? LINEAS.publicando[LINEAS.publicando.length - 1]);
        return;
      }
      setAviso(null);
      terminar(sim.current.inicio === 0 ? 0 : Math.round((Date.now() - sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
    },
  };

  /* El clic en «Contáctanos»/«Volver al inicio», una vez arreglado, navega de
   * verdad entre las dos páginas — misma prueba de que el enlace sirve para
   * algo que usa `n9-proyecto-integrador`. */
  const alEvento = useCallback(
    (evento: EventoPagina) => {
      if (evento.tipo === 'enlace' && evento.interno && estudio.paginas.includes(evento.destino)) {
        estudio.verPagina(evento.destino);
      }
    },
    [estudio],
  );

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const herramientas: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-lumen',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: estudio.activo.soloLectura === true || terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_LUMEN[estudio.activo.nombre];
        if (plantilla !== undefined) {
          estudio.escribir(plantilla);
          setAviso(`↺ «${estudio.activo.nombre}» restablecido`);
        }
      },
    },
  ];

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Publica tu sitio"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={estudio.terminado ? 'Publicando' : 'Revisado'}
      marcadorValor={estudio.terminado ? `${publicados}/${PUBLICACION_LUMEN.pasos.length}` : `${Math.min(hechos, ENCARGOS)}/${ENCARGOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Web N10 · antes de publicar, se revisa de verdad</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Ingeniería de lanzamiento',
              insigniaEmoji: '🛰️',
              titulo: '¡Estudio Lumen está publicado!',
              detalle:
                'Revisaste el sitio como se revisa uno de verdad antes de repartir su dirección: corregiste un dato falso, arreglaste un enlace roto en sus dos apariciones, terminaste un texto y una foto que se habían quedado a medias, elegiste el dominio correcto entre tres candidatos y activaste HTTPS antes de que el formulario recibiera un solo dato real. Ese es el checklist que se lleva cualquier sitio antes del botón de publicar.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N10" subtitulo="estudio-lumen · listo para producción">
        <EstudioWeb
          estudio={conCuenta}
          proyecto="estudio-lumen"
          recursos={IMAGENES_ESTUDIO_LUMEN}
          onEvento={alEvento}
          inspector={true}
          herramientas={herramientas}
          publicacion={estudio.terminado ? PUBLICACION_LUMEN : undefined}
        />
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}-${sim.current.errores}`} />}
    </ArcadeSala>
  );
}

export default LabPublicaTuSitio;
