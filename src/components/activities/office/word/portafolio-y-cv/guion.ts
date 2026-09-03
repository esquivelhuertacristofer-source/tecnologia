import type { GuionClase } from '@/components/office/motor/guion';
import {
  bloqueQueContiene,
  cuantos,
  cumple,
  leerBloques,
} from '@/components/office/motor/consultas';
import type { Node as NodoPM } from 'prosemirror-model';

/**
 * `n10-portafolio-y-cv` · «Siete segundos» (doc §49.5).
 *
 * N10 · «Proyecto capstone y portafolio» · eje `creatividad`. Monta
 * `VentanaTextos` tal cual: es una de las siete filas que el
 * `CANON-ARMAZONES.md` marca como `OFFICE`, y no hay motor que escribir.
 *
 * ── QUÉ LA SEPARA DE LAS DOS CLASES DE WORD QUE SE LE PARECEN ───────────────
 *
 * Los estilos ya se enseñaron en `of-word-estilos-e-indice` —allí un Título 1
 * sirve para que la máquina escriba el índice— y guardar en PDF en
 * `of-word-guardar-e-imprimir`. Aquí las herramientas vuelven **al servicio de
 * un lector con prisa**: quien recibe un currículum le dedica siete segundos
 * antes de decidir si sigue leyendo, y todo lo que se hace en esta clase se
 * juzga contra ese cronómetro. El primer encargo es literalmente mirar el
 * documento siete segundos sin tocar nada, y el último es contestar qué se
 * quedó de esos siete segundos ahora que está arreglado.
 *
 * ── EL CASO ─────────────────────────────────────────────────────────────────
 *
 * Sofía terminó el bachillerato técnico y escribió su currículum como le salió:
 * todo en Normal, el correo que se hizo a los trece años, un objetivo
 * profesional de once renglones que no dice nada, los logros escondidos dentro
 * de párrafos, y una sección de pasatiempos. **Todo lo que hay en el documento
 * es verdad.** Lo que está mal es el orden, el peso y lo que sobra.
 *
 * ── LA REGLA QUE ESTE GUION TUVO QUE OBEDECER, Y DÓNDE CASI SE ROMPE ────────
 *
 * §36.8 B: el motor relee en cada cambio los encargos ya palomeados y devuelve
 * al alumno al primero que deje de valer. O sea que **ningún encargo puede
 * dejar de cumplirse por culpa de uno posterior**.
 *
 * Aquí la trampa estaba servida: la primera versión de esta clase pedía poner a
 * Título 2 **los cuatro rótulos** —Objetivo profesional, Experiencia, Formación,
 * Habilidades y Pasatiempos— y tres encargos después mandaba **borrar la
 * sección de Pasatiempos entera**. Con eso, el encargo de los rótulos se volvía
 * falso en el momento exacto en que el alumno hacía bien el de borrar, y la
 * clase quedaba imposible de terminar con las pruebas unitarias en verde: el
 * defecto que el recorrido de punta a punta de la sala de Excel encontró en
 * nueve clases. Se arregló pidiendo **los cuatro que se quedan** y dejando
 * Pasatiempos fuera de esa lista a propósito, que además es más honesto: no se
 * le pone estilo a algo que estás a punto de borrar.
 */

/* ── el documento ───────────────────────────────────────────────────────────*/

export const ARCHIVO = 'Currículum · Sofía Aranda.docx';

/** El correo de los trece años, y el que hay que dejar puesto. */
export const CORREO_VIEJO = 'sofi_lachida2007@hotmail.com';
export const CORREO_NUEVO = 'sofia.aranda@correo.mx';

/** Los cuatro rótulos que se quedan. **Pasatiempos no está, y es a propósito.** */
export const ROTULOS = ['Objetivo profesional', 'Experiencia', 'Formación', 'Habilidades'];

/** Lo que hay que dejar escrito donde estaban los once renglones. */
export const OBJETIVO_CORTO =
  'Técnica en programación recién egresada. Busco mi primer empleo como apoyo en pruebas y desarrollo web.';

/** Cuántas palabras puede tener un objetivo profesional que alguien vaya a leer. */
export const TOPE_DE_PALABRAS = 30;

/**
 * El currículum tal como lo escribió Sofía: todo en Normal, sin una sola
 * viñeta, y con los dos logros que valen la pena enterrados dentro de párrafos.
 */
const DOCUMENTO = `
<p>Sofía Aranda Molina</p>
<p>${CORREO_VIEJO} · 55 1234 5678 · Ciudad de México</p>
<p><strong>Objetivo profesional</strong></p>
<p>Mi objetivo profesional es poder desarrollarme dentro de una empresa que me permita crecer tanto en lo personal como en lo profesional, aportando siempre lo mejor de mí misma y buscando la sinergia con el equipo de trabajo, ya que considero que soy una persona muy responsable, proactiva y con muchas ganas de aprender cosas nuevas todos los días, siempre dispuesta a asumir nuevos retos que me permitan seguir superándome día con día en el ámbito que se me presente.</p>
<p><strong>Experiencia</strong></p>
<p>Prácticas profesionales · Soluciones Nube MX · enero a junio de 2026</p>
<p>Apoyé en las pruebas de una aplicación web, documenté 40 errores con sus pasos para reproducirlos y aprendí a usar el control de versiones del equipo.</p>
<p>Servicio social · Biblioteca de la escuela · 2025</p>
<p>Capturé el catálogo de 1 200 libros en una hoja de cálculo y armé el buscador que hoy usa la bibliotecaria todos los días.</p>
<p><strong>Formación</strong></p>
<p>Bachillerato técnico en Programación · CBTis 45 · 2023 a 2026</p>
<p><strong>Habilidades</strong></p>
<p>Python, HTML y CSS, hojas de cálculo, trabajo en equipo, responsabilidad, puntualidad, muchas ganas de aprender y facilidad de palabra.</p>
<p><strong>Pasatiempos</strong></p>
<p>Me gusta ver series, salir con mis amigas y coleccionar llaveros de los lugares a los que voy de vacaciones con mi familia.</p>
`;

/* ── lo que el maestro le pregunta al documento ──────────────────────────────*/

/** El nombre, que es el primer renglón, en Título 1. */
export function elNombreEsUnTitulo(doc: NodoPM): boolean {
  return cumple(doc, { contiene: 'Sofía Aranda', tipo: 'titulo', nivel: 1 });
}

/**
 * Los cuatro rótulos que se quedan, en Título 2.
 *
 * **Pasatiempos no está en la lista y no puede estarlo** (ver la cabecera): el
 * encargo 6 borra esa sección, y pedir aquí su estilo dejaría este encargo en
 * falso justo cuando el alumno hace bien el otro.
 */
export function losRotulosSonRotulos(doc: NodoPM): boolean {
  if (!elNombreEsUnTitulo(doc)) return false;
  return ROTULOS.every((r) => cumple(doc, { empiezaCon: r, tipo: 'titulo', nivel: 2 }));
}

/** El correo de los trece años, cambiado por uno que se pueda poner en un CV. */
export function elCorreoEstaCambiado(doc: NodoPM): boolean {
  if (!losRotulosSonRotulos(doc)) return false;
  return bloqueQueContiene(doc, CORREO_VIEJO) === null && bloqueQueContiene(doc, CORREO_NUEVO) !== null;
}

/** Los dos logros, sacados del párrafo y puestos en viñetas. */
export function losLogrosEstanEnVinetas(doc: NodoPM): boolean {
  if (!elCorreoEstaCambiado(doc)) return false;
  return cuantos(doc, 'lista_vinetas') >= 2;
}

/** Cuántas palabras tiene el bloque del objetivo profesional ahora mismo. */
export function palabrasDelObjetivo(doc: NodoPM): number {
  const bloques = leerBloques(doc);
  const i = bloques.findIndex((b) => b.texto.trim().toLowerCase().startsWith('objetivo profesional'));
  const cuerpo = i >= 0 ? bloques[i + 1] : undefined;
  return cuerpo ? cuerpo.texto.trim().split(/\s+/).filter(Boolean).length : 0;
}

/**
 * El objetivo, de once renglones a dos.
 *
 * Se corrige por **tres cosas a la vez** y ninguna sobra: que quede corto (el
 * tope de palabras), que el relleno se haya ido de verdad —«sinergia» es la
 * palabra que delata el párrafo original— y que **siga diciendo a qué aspira**,
 * porque un objetivo profesional que se recorta hasta no decir nada no está
 * mejor que uno de once renglones: está peor.
 */
export function elObjetivoEsCorto(doc: NodoPM): boolean {
  if (!losLogrosEstanEnVinetas(doc)) return false;
  const palabras = palabrasDelObjetivo(doc);
  return (
    palabras > 0 &&
    palabras <= TOPE_DE_PALABRAS &&
    bloqueQueContiene(doc, 'sinergia') === null &&
    bloqueQueContiene(doc, 'primer empleo') !== null
  );
}

/** La sección de pasatiempos, borrada entera: el rótulo y su párrafo. */
export function losPasatiemposSeFueron(doc: NodoPM): boolean {
  if (!elObjetivoEsCorto(doc)) return false;
  return bloqueQueContiene(doc, 'Pasatiempos') === null && bloqueQueContiene(doc, 'llaveros') === null;
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_PORTAFOLIO_Y_CV: GuionClase = {
  archivo: ARCHIVO,
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · N10 · Capstone y portafolio · Parada 2 de 3',
    tema: 'El currículum, leído por alguien que tiene prisa',
    objetivo:
      'Vas a arreglar un currículum que no tiene ni un dato falso y aun así no funciona. Al terminar vas a saber lo único que hay que saber para escribir el tuyo: que quien lo recibe le dedica siete segundos antes de decidir si sigue leyendo, y que todo —el orden, el estilo, lo que se borra— se decide contra ese cronómetro.',
    vasAHacer: [
      'Mirarlo siete segundos sin tocar nada, y quedarte con lo que se te quedó',
      'Hacer que el nombre y las secciones se vean en un vistazo, con estilos y no con negritas',
      'Cambiar el correo que se hizo a los trece años',
      'Sacar los dos logros que valen la pena del párrafo donde están enterrados',
      'Recortar once renglones a dos, y borrar una sección entera que está bien escrita',
    ],
    requisitos:
      'Los estilos Título 1 y Título 2, las viñetas, y escribir dentro de un párrafo. Todo eso ya lo has hecho; lo nuevo es para qué se usa.',
    ayuda:
      'Los estilos y las viñetas están en la pestaña Inicio: Estilos y Párrafo. Para cambiar un texto, selecciónalo y escribe encima. Para borrar una sección, selecciona sus dos renglones y bórralos.',
  },

  pasos: [
    {
      id: 'siete-segundos',
      titulo: 'Míralo siete segundos y no toques nada',
      instruccion:
        'Éste es el currículum de Sofía, y **no tiene ni un dato falso**. Míralo siete segundos, como lo miraría alguien que tiene otros cuarenta encima de la mesa. Luego dime que ya lo miraste.',
      pista: 'No leas: mira. La pregunta es qué se te queda a los siete segundos, no qué dice.',
      logro: { tipo: 'confirma', boton: 'Ya lo miré' },
      aprendido:
        'A los siete segundos, de este documento no se queda nada: es una pared gris de párrafos iguales donde el nombre pesa lo mismo que el teléfono y lo mismo que los pasatiempos. **Y eso no es culpa de Sofía, que escribió la verdad**: es que un currículum no se lee, se barre con la mirada, y este documento no le da a la mirada dónde agarrarse. Lo que viene ahora no cambia ni un dato: cambia el orden, el peso y lo que sobra.',
    },
    {
      id: 'el-nombre-arriba',
      titulo: 'Lo primero que se ve tiene que ser el nombre',
      instruccion:
        'Selecciona el primer renglón, **Sofía Aranda Molina**, y ponle el estilo **Título 1**.',
      pista: 'Los estilos están en Inicio → Estilos. No le subas el tamaño a mano: eso lo hace más grande y no lo hace un título.',
      senal: { control: 'titulo1' },
      logro: { tipo: 'documento', comprueba: elNombreEsUnTitulo },
      aprendido:
        'Con una sola pulsación el nombre dejó de pesar lo mismo que el teléfono. Y fíjate en lo que **no** hiciste: no le subiste el tamaño ni le pusiste negrita. Un estilo dice **qué es** ese renglón, y de ahí sale cómo se ve; una negrita sólo dice cómo se ve. Parecen lo mismo hasta el día que hay que cambiar el aspecto de las diez secciones a la vez, o que un programa tiene que leer tu documento para sacar algo de él.',
    },
    {
      id: 'los-rotulos',
      titulo: 'Las cuatro secciones que se quedan',
      instruccion:
        'Ponle **Título 2** a los cuatro rótulos: **Objetivo profesional**, **Experiencia**, **Formación** y **Habilidades**. Uno por uno, seleccionándolos y pulsando el mismo botón.',
      pista: 'Están en negrita, pero la negrita no es un estilo: para el programa siguen siendo párrafos normales. Pasatiempos déjalo como está, por ahora.',
      senal: { control: 'titulo2' },
      logro: { tipo: 'documento', comprueba: losRotulosSonRotulos },
      aprendido:
        'Ahora el documento tiene esqueleto: un nombre y cuatro secciones, y la mirada puede saltar de una a otra sin leer nada. Eso es lo que pasa en los siete segundos. **Y te habrás fijado en que Pasatiempos se quedó fuera de la lista.** No es un olvido, y dentro de tres encargos vas a ver por qué.',
    },
    {
      id: 'el-correo',
      titulo: 'El correo que se hizo a los trece años',
      instruccion: `El segundo renglón dice **${CORREO_VIEJO}**. Selecciona esa parte y escribe encima **${CORREO_NUEVO}**.`,
      pista: 'Sólo el correo: el teléfono y la ciudad se quedan. Un correo con nombre y apellido se lee igual de rápido y no cuenta nada de ti que no quieras contar.',
      logro: { tipo: 'documento', comprueba: elCorreoEstaCambiado },
      aprendido:
        'Es la línea que más devuelve por carácter escrito de todo el documento. Un correo de la secundaria no dice que seas peor técnica: dice que no lo revisaste antes de mandarlo, y eso quien lee cuarenta currículums lo lee como falta de cuidado. **Nada de lo que hay en un currículum es sólo información**: todo cuenta además algo sobre quien lo escribió.',
    },
    {
      id: 'los-logros-en-vinetas',
      titulo: 'Saca los dos logros del párrafo',
      instruccion:
        'Debajo de cada trabajo hay un párrafo con lo que Sofía hizo de verdad —los **40 errores documentados** y el **buscador del catálogo**—. Ponle **viñetas** a cada uno de esos dos párrafos.',
      pista: 'Las viñetas están en Inicio → Párrafo, el primer botón. Selecciona un párrafo, pulsa; luego el otro, y pulsa otra vez.',
      senal: { control: 'vinetas' },
      logro: { tipo: 'documento', comprueba: losLogrosEstanEnVinetas },
      aprendido:
        'Lo que estaba enterrado dentro de un párrafo ahora se ve solo. Y son **lo mejor que tiene este currículum**: no dicen «soy responsable», dicen cuántos errores documentó y qué construyó. Una viñeta no es un adorno: es una promesa de que ahí abajo hay una cosa por renglón, y quien tiene prisa la acepta. Un párrafo, en cambio, hay que leerlo entero para saber si valía la pena.',
    },
    {
      id: 'once-renglones-a-dos',
      titulo: 'Once renglones que no dicen nada',
      instruccion: `Selecciona el párrafo entero del objetivo profesional —el que habla de sinergia y de crecer día con día— y escribe encima: **${OBJETIVO_CORTO}**`,
      pista: 'Menos de treinta palabras. Y tiene que seguir diciendo a qué aspira: un objetivo recortado hasta no decir nada está peor que uno largo.',
      logro: { tipo: 'documento', comprueba: elObjetivoEsCorto },
      aprendido:
        'De once renglones a dos, y ahora sí dice algo: qué es y qué busca. Lee lo que había antes con atención — **«responsable», «proactiva», «ganas de aprender»**— y fíjate en que ninguna de esas palabras se puede comprobar, y que las escribe todo el mundo. Las de abajo, en las viñetas, sí: cuarenta errores documentados y un buscador que usa la bibliotecaria. **Lo que se puede comprobar vale; lo que se puede decir de cualquiera, no.**',
    },
    {
      id: 'lo-que-sobra',
      titulo: 'Lo más difícil: borrar algo que está bien',
      instruccion:
        'Selecciona los dos renglones de **Pasatiempos** —el rótulo y el párrafo de abajo— y **bórralos**.',
      pista: 'Los dos renglones enteros, no sólo uno. Sí, está bien escrito. Ése es justo el problema.',
      logro: { tipo: 'documento', comprueba: losPasatiemposSeFueron },
      aprendido:
        'Por eso Pasatiempos no llevaba estilo: no se le pone esqueleto a algo que vas a borrar. Y borrarlo cuesta, porque está bien escrito y es verdad. Pero en siete segundos **todo lo que se lee le quita sitio a otra cosa**, y las series y los llaveros le estaban quitando sitio a los cuarenta errores documentados. Quitar es la decisión de diseño más difícil que hay, y la que más se nota: lo mismo en un currículum que en un cartel, en una diapositiva o en un tablero de datos.',
    },
    {
      id: 'que-se-lee-ahora',
      titulo: 'Otra vez siete segundos: ¿qué se te queda ahora?',
      instruccion:
        'Míralo otra vez como al principio, siete segundos, y elige qué se lleva quien lo mire con prisa.',
      pista: 'No es lo que más te gusta a ti: es lo que la mirada encuentra sin leer.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que Sofía es responsable, proactiva y tiene muchas ganas de aprender.',
          'Un nombre, cuatro secciones, y dos cosas concretas que hizo: 40 errores documentados y un buscador que se usa todos los días.',
          'Que sabe Python, HTML y CSS.',
        ],
        correcta: 1,
      },
      aprendido:
        'Ni un dato nuevo entró en este documento y ahora dice algo. La tercera opción es cierta y sigue enterrada en un renglón corrido de habilidades: si mañana quieres que **eso** sea lo que se lea, ya sabes qué hacer — sacarlo del párrafo y ponerlo donde la mirada cae. **Ésa es la clase entera: no escribiste nada más verdadero, escribiste lo mismo de forma que se pueda leer en siete segundos.** Y es exactamente el mismo trabajo que hiciste con los datos de la campaña de reciclaje, sólo que ahora el dato eres tú.',
    },
  ],

  cierre:
    'Arreglaste un currículum sin cambiar ni un dato: todo lo que decía al empezar seguía siendo verdad al terminar. Le diste esqueleto con estilos en vez de negritas, cambiaste un correo que contaba algo que Sofía no quería contar, sacaste de un párrafo los dos logros que sí se pueden comprobar, recortaste once renglones de palabras que escribe todo el mundo, y borraste una sección entera que estaba bien escrita porque le quitaba sitio a algo mejor. Siete segundos es todo lo que tienes, y ahora sabes en qué gastarlos.',
};

export default GUION_PORTAFOLIO_Y_CV;
