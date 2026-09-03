import { CINTA_BASICO, type ControlCinta, type Pestana } from '@/components/activities/office/tecniaTextos';
import { TINTAS } from './controles';

/**
 * La cinta de `n2-viste-tus-letras`: Inicio, y dentro sólo el grupo Fuente.
 *
 * ── POR QUÉ SE RECORTA ──────────────────────────────────────────────────────
 * El alumno tiene siete u ocho años. El grado Básico entero son dos pestañas y
 * ocho grupos —Portapapeles, Fuente, Párrafo, Estilos, Tablas, Ilustraciones,
 * Texto, Encabezado y pie—, y de todo eso esta clase usa exactamente uno. Un
 * niño de segundo delante de treinta botones no ve herramientas, ve ruido, y
 * los que no toca durante la clase son treinta ocasiones de perderse.
 *
 * Menos botones no es un programa recortado: es lo que hace Word de verdad con
 * su modo simplificado, y es lo que hace un maestro cuando enseña una sola
 * cosa. Los grupos que faltan no desaparecen del curso —Párrafo llega en la
 * clase de alinear, Insertar en la del cuento ilustrado—; verlos aparecer al
 * subir de clase es la progresión hecha visible (§34).
 *
 * ── QUÉ SE QUITÓ DEL PROPIO GRUPO FUENTE ────────────────────────────────────
 * El botón `color` del motor, que pinta siempre del mismo naranja. En su lugar
 * va la fila de seis tintas de esta clase más «Automático», porque la mitad de
 * la lección del ejercicio viejo era **elegir** el color y con un solo color no
 * hay nada que elegir. Los seis cuadritos son la fila «Colores estándar» de
 * Word y contienen los cuatro del perchero viejo.
 *
 * ── QUÉ SE DEJÓ AUNQUE NO SE USE EN NINGÚN ENCARGO ──────────────────────────
 * Los dos desplegables de tipografía —familia y tamaño— los pinta el motor
 * dentro de este grupo, y se quedan: el cuadro del tamaño es el camino corto
 * del primer encargo, y el de la familia es donde un niño descubre solo que la
 * letra se puede cambiar entera. A▼ tampoco tiene encargo y también se queda,
 * porque es la vuelta de A▲ y sin él agrandar no tiene deshacer visible.
 *
 * ── LA REJILLA ──────────────────────────────────────────────────────────────
 * El motor reparte el grupo Fuente en filas de seis, así que los doce controles
 * caen en dos filas exactas: arriba las cinco de la letra más «Automático»,
 * abajo la fila de colores entera. Que los seis colores queden juntos y solos
 * en su renglón es lo que los hace leerse como una paleta y no como seis
 * botones más.
 */

const GRUPO_FUENTE = CINTA_BASICO.find((p) => p.id === 'inicio')?.grupos.find((g) => g.id === 'fuente');

/** Negrita, Cursiva, Subrayado, A▲ y A▼, tal cual las trae el grado Básico. */
const LETRA: ControlCinta[] = (GRUPO_FUENTE?.controles ?? []).filter((c) => c.id !== 'color');

/**
 * El glifo de cada cuadrito, que en la cinta NO se ve y en la ficha SÍ.
 *
 * En la cinta el cuadrito es un fondo de color puesto por `estilo.css`, que
 * apaga el glifo con `font-size: 0`: la muestra tiene que ser exactamente la
 * tinta que va a caer en el papel y un emoji no lo garantiza. Pero el modo guía
 * (§37) enseña ese mismo glifo dentro de la ficha de la herramienta, y ahí no
 * hay CSS que valga: se pinta el carácter tal cual. Medido el 10-ago-2026: con
 * `■` la ficha de «Color rojo» enseñaba un cuadrado BLANCO —el ■ hereda el
 * color del texto del panel— justo en el encargo que trata de qué color usar.
 *
 * Con el emoji, la cinta se ve igual (sigue apagado) y la ficha enseña un
 * cuadro rojo. El tono del emoji lo pone la fuente del sistema y no es
 * exactamente #FF0000, y por eso no se usa donde el niño ELIGE mirando —la
 * cinta—, sino sólo donde el programa ILUSTRA de qué botón habla.
 */
const CUADRO: Record<string, string> = {
  'color-rojo': '🟥',
  'color-naranja': '🟧',
  'color-amarillo': '🟨',
  'color-verde': '🟩',
  'color-azul': '🟦',
  'color-morado': '🟪',
};

const PALETA: ControlCinta[] = [
  { id: 'color-auto', glifo: '⬛', etiqueta: 'Color automático (negro)' },
  ...TINTAS.map((t) => ({
    id: t.id,
    glifo: CUADRO[t.id] ?? '■',
    etiqueta: `Color ${t.nombre.toLowerCase()}`,
  })),
];

export const CINTA_VESTIR_LETRAS: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: [
      {
        id: 'fuente',
        nombre: GRUPO_FUENTE?.nombre ?? 'Fuente',
        controles: [...LETRA, ...PALETA],
      },
    ],
  },
];
