import { urlDeBusqueda, type DatoFicha, type MapaSitios } from '@/components/simuladores/navegador';

/**
 * `n6-proyecto-integrador` · Acto 1 (Investigar) · el mapa de sitios.
 *
 * Datos puros, sin React, como pide el armazón (`tiposNavegador.ts`). La
 * pregunta del proyecto es fija (DISEÑO-N6-proyecto-integrador.md, «El
 * encargo»): «¿qué se tira en el bote de nuestro salón?». No se calcula
 * ninguna fecha con el reloj — todas son cadenas fijas, y ninguna es hoy
 * (21-ago-2026), a propósito (COMO-SE-CONSTRUYE.md §5.3).
 */

export const PREGUNTA = '¿Qué se tira en el bote de nuestro salón?';

/** La URL de resultados, construida con la MISMA función que usa el armazón. */
export const URL_RESULTADOS = urlDeBusqueda(PREGUNTA);

export const URL_ANUNCIO = 'superbote.mx/comprar';
export const URL_SIN_FIRMA = 'datosdelmundo.net/basura-escolar';
export const URL_ARTICULO_A = 'ecologiahoy.mx/como-reciclar-en-la-escuela';
export const URL_ARTICULO_B = 'revistaverde.mx/la-basura-que-no-vemos';
export const URL_ESCUELA = 'nuestraescuela.tecnia.mx/el-bote-del-salon';

/** Id corto y estable por URL — lo usa `pruebas.ts` y la galería del E6. */
export const ID_DE_URL: Record<string, string> = {
  [URL_ANUNCIO]: 'anuncio',
  [URL_SIN_FIRMA]: 'sinfirma',
  [URL_ARTICULO_A]: 'articulo-a',
  [URL_ARTICULO_B]: 'articulo-b',
  [URL_ESCUELA]: 'medicion',
};

/** La tabla del grupo — el mismo dato que ve el panel de Bit en el acto 2. */
export const DATOS_ESCUELA: DatoFicha[] = [
  { etiqueta: 'Lunes', valor: 'Papel 8 · Plástico 5 · Comida 3 · Otros 2' },
  { etiqueta: 'Martes', valor: 'Papel 9 · Plástico 6 · Comida 4 · Otros 2' },
  { etiqueta: 'Miércoles', valor: 'Papel 7 · Plástico 5 · Comida 3 · Otros 3' },
  { etiqueta: 'Jueves', valor: 'Papel 12 · Plástico 8 · Comida 5 · Otros 3' },
  { etiqueta: 'Viernes', valor: 'Papel 9 · Plástico 6 · Comida 3 · Otros 2' },
  { etiqueta: 'Total de la semana', valor: 'Papel 45 · Plástico 30 · Comida 18 · Otros 12' },
];

export const MAPA_SITIOS: MapaSitios = {
  [URL_RESULTADOS]: {
    url: URL_RESULTADOS,
    pestana: 'Buscador',
    titulo: `Resultados para «${PREGUNTA}»`,
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'resultados',
      consulta: PREGUNTA,
      resultados: [
        {
          id: 'r-anuncio',
          titulo: 'SúperBote: el bote que tu salón necesita',
          url: URL_ANUNCIO,
          descripcion: 'Envío gratis. Compra ya el bote que se vacía solo.',
          esAnuncio: true,
        },
        {
          id: 'r-sinfirma',
          titulo: 'Cuánta basura hacen las escuelas',
          url: URL_SIN_FIRMA,
          descripcion: 'Un resumen sobre la basura escolar en general.',
        },
        {
          id: 'r-a',
          titulo: 'Cómo reciclar en la escuela',
          url: URL_ARTICULO_A,
          descripcion: 'Guía para separar la basura en el salón de clases.',
        },
        {
          id: 'r-b',
          titulo: 'La basura que no vemos',
          url: URL_ARTICULO_B,
          descripcion: 'Qué pasa con lo que tiramos, paso a paso.',
        },
      ],
    },
    // El sitio de la escuela NO sale en los resultados: es un enlace aparte,
    // porque «no está en internet» (Sonora, línea 9) — está en la intranet.
    enlaces: [{ etiqueta: 'La página de nuestra escuela', url: URL_ESCUELA }],
  },

  [URL_ANUNCIO]: {
    url: URL_ANUNCIO,
    pestana: 'SúperBote',
    titulo: 'SúperBote: el bote que tu salón necesita',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'articulo',
      parrafos: ['El SúperBote se vacía solo y huele a menta todo el día.', '¡Cómpralo hoy con 20% de descuento!'],
    },
  },

  [URL_SIN_FIRMA]: {
    url: URL_SIN_FIRMA,
    pestana: 'Datos del mundo',
    titulo: 'Cuánta basura hacen las escuelas',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'articulo',
      parrafos: [
        'Las escuelas del mundo producen mucha basura todos los días.',
        'Nadie firma este texto ni dice cuándo se escribió.',
      ],
    },
  },

  [URL_ARTICULO_A]: {
    url: URL_ARTICULO_A,
    pestana: 'Ecología Hoy',
    titulo: 'Cómo reciclar en la escuela',
    autor: 'Redacción de Ecología Hoy',
    fecha: '3 de marzo de 2024',
    cuerpo: {
      tipo: 'articulo',
      parrafos: [
        'Separar el papel del plástico es el primer paso en cualquier salón.',
        'Contar lo que se tira durante una semana ayuda a saber por dónde empezar.',
      ],
    },
  },

  [URL_ARTICULO_B]: {
    url: URL_ARTICULO_B,
    pestana: 'Revista Verde',
    titulo: 'La basura que no vemos',
    autor: 'Iván Cortés',
    fecha: '18 de octubre de 2023',
    cuerpo: {
      tipo: 'articulo',
      parrafos: [
        'La mitad de lo que tiramos podría separarse antes de llegar al bote.',
        'Medir durante unos días es la única forma de saber qué se tira más.',
      ],
    },
  },

  [URL_ESCUELA]: {
    url: URL_ESCUELA,
    pestana: 'Nuestra escuela',
    titulo: 'El bote del salón: lo que contamos',
    autor: 'Grupo de Dani',
    fecha: 'Esta semana',
    cuerpo: { tipo: 'ficha', datos: DATOS_ESCUELA },
  },
};
