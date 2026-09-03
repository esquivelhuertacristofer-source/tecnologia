import type { GrupoCinta, PestanaId } from '@/components/activities/office/tecniaTextos';

/**
 * Una cinta cualquiera, no sólo la de Word.
 *
 * Se abrió el 10-ago-2026 (§40) para que Tecnia Diapositivas use este mismo
 * mecanismo sin copiarlo. `PestanaId` es la unión CERRADA de las siete pestañas
 * de Word, y aparecía en la firma de `ubicar`, `ubicarPestana` y `Ubicacion`;
 * PowerPoint necesita Diseño, Transiciones, Animaciones y Presentación.
 *
 * El parámetro se INFIERE de lo que se le pase, así que las diecinueve clases de
 * Word siguen recibiendo `Ubicacion<PestanaId>` y su `setPestana` sigue tipando.
 * No hubo que tocar una sola de ellas.
 */
export interface PestanaLike<T extends string = string> {
  id: T;
  nombre: string;
  grupos: GrupoCinta[];
}

/** La tabla de los controles que la cinta no lista por no ser botones. */
export type TablaDesplegables = Record<string, { grupo: string; etiqueta: string; glifo: string }>;

/**
 * El modo guía (doc §37).
 *
 * El cliente pidió que en el laboratorio se SEÑALE dónde hay que pulsar, se
 * EXPLIQUE qué hace esa herramienta, y que un desvío no deje al alumno peor de
 * como estaba. Este archivo es la mitad de datos de eso; la otra mitad —el
 * señalador, la ficha y «Enséñamelo»— la pinta `VentanaTextos`.
 *
 * ── POR QUÉ EL SITIO NO SE ESCRIBE, SE DERIVA ───────────────────────────────
 * Diecinueve clases por siete u ocho encargos son unos ciento treinta. Escribir
 * a mano en cada uno «esto está en Inicio, grupo Fuente, el botón de la N» es
 * garantizar que el día que un botón cambie de grupo haya ciento treinta sitios
 * mintiendo, y ninguna prueba lo detectaría porque son cadenas de texto.
 *
 * La cinta ya sabe dónde está todo: cada pestaña tiene su nombre, cada grupo el
 * suyo y cada control su etiqueta y su glifo. `ubicar()` recorre esa estructura.
 * Si mañana Negrita se muda de grupo, la guía se muda con ella el mismo día y
 * sin que nadie toque una clase.
 *
 * Lo único que se escribe a mano —y una sola vez— es QUÉ HACE cada herramienta,
 * y sirve para dos cosas que no se pueden contradecir porque son el mismo dato:
 * explicarla ANTES de pulsarla, y explicar qué se pulsó de más al equivocarse.
 */

/**
 * Qué hace cada herramienta, en la voz de un maestro y no de un manual.
 *
 * Regla al escribir una nueva: **el efecto, no el nombre**. «Pone negrita» no
 * enseña nada, porque el botón ya se llama Negrita. «Engrosa la letra para que
 * una palabra destaque» dice para qué serviría usarlo.
 */
export const QUE_HACE: Record<string, string> = {
  /* ── La barra de acceso rápido, que también recibe el aro ── */
  guardar: 'Deja el documento guardado en este equipo. Hasta que lo pulsas, lo escrito sólo existe en la pantalla.',
  deshacer: 'Da marcha atrás al último cambio. Se puede pulsar muchas veces seguidas.',
  rehacer: 'Vuelve a hacer lo que acabas de deshacer, por si te arrepentiste.',
  buscar: 'Recorre el documento entero por ti y te enseña dónde está lo que escribas.',
  reemplazar: 'Cambia una palabra por otra en todo el documento de una vez. Ojo: en TODO el documento.',

  /* ── Portapapeles ── */
  pegar: 'Suelta aquí lo último que copiaste o cortaste, en donde tengas el cursor.',
  copiar: 'Se queda con una copia de lo que tengas seleccionado, sin quitarlo de su sitio.',
  cortar: 'Se lleva lo seleccionado para soltarlo en otro lado: desaparece de aquí hasta que lo pegues.',

  /* ── Fuente ── */
  'fuente-familia': 'Cambia la forma de la letra. Cada tipo de letra tiene su carácter: unos son para leer mucho rato y otros para un título.',
  'fuente-tamano': 'Elige de cuántos puntos es la letra. Un texto normal va en 11 o 12; un título, en 20 o más.',
  negrita: 'Engrosa la letra para que una palabra destaque sobre las demás.',
  cursiva: 'Inclina la letra. Se usa para los títulos de libros y para las palabras en otro idioma.',
  subrayado: 'Le pinta una raya debajo. Ojo: en un documento, subrayar mucho cansa más que ayuda.',
  mayor: 'Sube el tamaño de la letra un escalón cada vez que lo pulsas.',
  menor: 'Baja el tamaño de la letra un escalón cada vez que lo pulsas.',
  color: 'Cambia el color de la letra seleccionada.',

  /* ── Párrafo ── */
  vinetas: 'Convierte los renglones en una lista con bolitas, para enumerar cosas sueltas.',
  numeros: 'Convierte los renglones en una lista numerada, para pasos que van en orden.',
  sangria: 'Empuja el párrafo hacia la derecha, separándolo del borde.',
  'quitar-sangria': 'Devuelve el párrafo hacia la izquierda, deshaciendo la sangría.',
  interlineado: 'Separa o junta los renglones entre sí, para que el texto respire.',
  izquierda: 'Pega todos los renglones al borde izquierdo y deja el derecho desparejo.',
  centro: 'Empuja el renglón al centro de la hoja, con el mismo hueco a los dos lados.',
  derecha: 'Pega todos los renglones al borde derecho. Se usa para fechas y firmas.',
  justificado: 'Estira los renglones para que los DOS bordes queden parejos, como en un periódico.',

  /* ── Estilos ── */
  normal: 'Devuelve el renglón a texto corriente, quitándole el estilo de título.',
  titulo1: 'Marca el renglón como título principal. No es negrita grande: es una etiqueta, y por eso el índice puede encontrarlo solo.',
  titulo2: 'Marca el renglón como subtítulo, un escalón por debajo del Título 1.',
  wordart: 'Convierte el renglón en un título artístico, con relleno y contorno de color.',

  /* ── Insertar ── */
  tabla: 'Mete una rejilla de filas y columnas para acomodar datos en su sitio.',
  imagen: 'Mete una imagen en el documento, donde tengas el cursor.',
  formas: 'Dibuja una figura encima del documento: una flecha, una estrella, un globo de diálogo.',
  cuadro: 'Mete una caja de texto que se puede mover por la hoja sin seguir a los renglones.',
  encabezado: 'Abre la franja de arriba de la hoja. Lo que escribas ahí sale en TODAS las hojas.',
  pie: 'Abre la franja de abajo de la hoja. Lo que escribas ahí sale en TODAS las hojas.',
  numero: 'Pone el número de la hoja, y cambia solo en cada una. No se teclea: se inserta.',
  salto: 'Termina la hoja aquí y empieza la siguiente, sin llenar el hueco de renglones vacíos.',
  nota: 'Pone una llamada pequeñita y su explicación al pie de la hoja.',
  campo: 'Deja un hueco con nombre que después se rellena solo con el dato de cada persona.',

  /* ── Disposición ── */
  columnas: 'Parte el texto en varias columnas, como un periódico.',
  margenes: 'Cambia el hueco blanco que rodea al texto por los cuatro lados de la hoja.',

  /* ── Tabla ── */
  combinar: 'Junta varias celdas seleccionadas en una sola, más ancha.',

  /* ── Revisar ── */
  ortografia: 'Repasa el documento y subraya en rojo lo que cree que está mal escrito. Cree: no siempre acierta.',
  sinonimos: 'Propone otras palabras que significan casi lo mismo, para no repetir.',
  comentario: 'Pega una nota al margen sin tocar el texto: sirve para proponer, no para corregir.',
  'control-cambios': 'Apunta todo lo que cambies para que el dueño del texto decida después si lo acepta.',
  aceptar: 'Da por bueno el cambio propuesto y lo deja escrito de verdad.',
  rechazar: 'Descarta el cambio propuesto y deja el texto como estaba.',

  /* ── Correspondencia ── */
  destinatarios: 'Abre la lista de personas a las que va la carta. Una fila por persona.',

  /* ── Referencias ── */
  tdc: 'Escribe el índice solo, buscando los renglones que marcaste como títulos.',
  'actualizar-tdc': 'Vuelve a leer los títulos y pone el índice al día.',

  /* ── Vista ── */
  'vista-previa': 'Enseña cómo va a salir en el papel antes de gastar tinta.',
  'una-pagina': 'Aleja la hoja hasta que quepa entera en la pantalla.',
  ancho: 'Acerca la hoja hasta que ocupe todo el ancho de la pantalla.',
};

/**
 * Qué guarda cada pestaña. Va en su propia tabla y no mezclada con la de los
 * controles por una razón que no es de orden: **`tabla` es las dos cosas**, el
 * botón que inserta una tabla y la pestaña de herramientas de tabla. En una
 * tabla sola, una de las dos se comía a la otra en silencio.
 */
export const QUE_HACE_PESTANA: Record<string, string> = {
  inicio: 'El cajón de lo que más se usa: cómo se ve la letra y cómo se acomoda el párrafo.',
  insertar: 'Todo lo que se METE nuevo en el documento y no se teclea: tablas, imágenes, formas, encabezados.',
  disposicion: 'Cómo se reparte el espacio de la hoja: márgenes, columnas y por dónde se corta una página.',
  referencias: 'Lo que el documento se escribe solo a partir de lo que ya hay: el índice y las notas al pie.',
  revisar: 'Trabajar sobre el texto sin pisarlo: ortografía, comentarios y control de cambios.',
  correspondencia: 'Una carta modelo más una lista de personas igual a muchas cartas, cada una con su nombre.',
  vista: 'Cómo miras tú la hoja. No cambia el documento: cambia lo que ves de él.',
  tabla: 'Las herramientas que sólo tienen sentido con el cursor dentro de una tabla.',
  archivo: 'Lo que se hace con el documento entero: guardarlo, imprimirlo, mandarlo.',
};

/**
 * Los dos desplegables de tipografía, que la cinta NO lista.
 *
 * `GrupoCinta.controles` sólo tiene botones; el tipo y el tamaño de letra los
 * inyecta la ventana al pintar el grupo Fuente, porque son `<select>` y no
 * botones. Sin esta tabla, `ubicar()` no los encontraba y un encargo que
 * señalara el tamaño se quedaba sin rótulo, sin ficha y sin «Enséñamelo»
 * —medido el 10-ago-2026 en `p-viste-tus-letras`—.
 */
export const DESPLEGABLES: TablaDesplegables = {
  'fuente-familia': { grupo: 'Fuente', etiqueta: 'Tipo de letra', glifo: 'Aa' },
  'fuente-tamano': { grupo: 'Fuente', etiqueta: 'Tamaño de letra', glifo: '11' },
};

/** Dónde vive un control dentro de la cinta que la clase tiene puesta. */
export interface Ubicacion<T extends string = PestanaId> {
  pestanaId: T;
  /** «Inicio», «Insertar»… */
  pestana: string;
  /** «Fuente», «Párrafo»… */
  grupo: string;
  /** «Negrita». */
  etiqueta: string;
  /** «N». */
  glifo: string;
}

/**
 * Busca un control en la cinta viva y devuelve su domicilio completo.
 *
 * Devuelve `null` si el control no está en la cinta de ESTA clase, que es un
 * dato útil y no un error: significa que el encargo pide algo que la clase no
 * enseña, y eso hay que verlo en la prueba, no en el aula.
 */
export function ubicar<T extends string>(
  cinta: PestanaLike<T>[],
  control: string,
  desplegables: TablaDesplegables = DESPLEGABLES,
): Ubicacion<T> | null {
  const suelto = desplegables[control];
  if (suelto) {
    // Vive donde esté su grupo en ESTA clase, que puede no ser Inicio.
    for (const pestana of cinta) {
      const g = pestana.grupos.find((x) => x.nombre === suelto.grupo);
      if (g) {
        return {
          pestanaId: pestana.id,
          pestana: pestana.nombre,
          grupo: g.nombre,
          etiqueta: suelto.etiqueta,
          glifo: suelto.glifo,
        };
      }
    }
    return null;
  }
  for (const pestana of cinta) {
    for (const grupo of pestana.grupos) {
      const c = grupo.controles.find((x) => x.id === control);
      if (c) {
        return {
          pestanaId: pestana.id,
          pestana: pestana.nombre,
          grupo: grupo.nombre,
          etiqueta: c.etiqueta,
          glifo: c.glifo,
        };
      }
    }
  }
  return null;
}

/**
 * Lo mismo para una pestaña, que también es una herramienta y también se
 * explica: sin esto, los encargos que se resuelven abriendo una pestaña
 * llevaban aro y rótulo pero se quedaban sin ficha y sin «Enséñamelo» —media
 * guía: el alumno veía dónde pulsar y seguía sin saber qué guarda ese cajón.
 */
export function ubicarPestana<T extends string>(cinta: PestanaLike<T>[], id: string): Ubicacion<T> | null {
  const p = cinta.find((x) => x.id === id);
  if (!p) return null;
  return {
    pestanaId: p.id,
    pestana: p.nombre,
    grupo: 'Pestañas',
    etiqueta: p.nombre,
    glifo: p.nombre.slice(0, 2),
  };
}

/** «Inicio → Fuente → Negrita», para decirlo en una línea. */
export function comoLlegar(u: Ubicacion<string>): string {
  // Una pestaña no vive dentro de sí misma: «Insertar → Pestañas → Insertar»
  // sería verdad y no diría nada.
  if (u.grupo === 'Pestañas') return `Pestaña ${u.etiqueta}, arriba del todo`;
  return `${u.pestana} → ${u.grupo} → ${u.etiqueta}`;
}

/**
 * El recado de cuando se pulsa el botón equivocado.
 *
 * Tiene tres partes y las tres hacen falta: **nombra** lo que pulsó —si no,
 * el alumno no sabe ni qué tocó—, dice **qué hace** eso —que es una lección
 * gratis, no un regaño— y **vuelve a mandarlo** al correcto. El deshacer del
 * cambio accidental no se decide aquí: lo hace la ventana, porque necesita la
 * vista del editor.
 */
export function explicarDesvio<T extends string>(
  cinta: PestanaLike<T>[],
  pulsado: string,
  esperado?: string,
  /** La tabla del programa. Por omisión, la de Word. */
  queHace: Record<string, string> = QUE_HACE,
  desplegables: TablaDesplegables = DESPLEGABLES,
): { titulo: string; queHace: string; aDonde: string | null } {
  const p = ubicar(cinta, pulsado, desplegables);
  const e = esperado ? ubicar(cinta, esperado, desplegables) : null;
  return {
    titulo: p ? `Eso es «${p.etiqueta}».` : 'Ése no es el botón de este encargo.',
    queHace: queHace[pulsado] ?? '',
    aDonde: e ? `El que buscas es «${e.etiqueta}», en ${e.pestana} → ${e.grupo}.` : null,
  };
}
