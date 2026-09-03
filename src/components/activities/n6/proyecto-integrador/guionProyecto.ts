import type { Mazo } from '@/components/office/motor-diapos/mazo';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { ItemGaleria } from '@/components/office/VentanaDiapositivas';
import { TIPOS_GRAFICO } from '@/components/activities/office/powerpoint/smartart-y-graficos/guion';
import { PREGUNTA } from './mapaSitios';
import {
  afirmacionDe,
  laPortadaEstaHecha,
  lasFuentesEstanCompletas,
  sostiene,
  tipoDeGraficoDe,
  type Prueba,
} from './pruebas';

/**
 * `n6-proyecto-integrador` · Actos 2 y 3, montados sobre Tecnia Diapositivas.
 *
 * `crearGuion(pruebas)` es una FUNCIÓN y no una constante porque las pruebas
 * llegan congeladas del acto 1 (DISEÑO, «Cómo se cosen los dos actos») — cada
 * partida las recibe distintas según lo que ese alumno marcó, así que el guion
 * no puede escribirse una sola vez para siempre. Se llama UNA vez, al entrar
 * en la fase 2 (`LabProyectoIntegrador.tsx`), nunca en cada render.
 *
 * Reexporta `TIPOS_GRAFICO` desde `of-ppt-smartart-y-graficos`: son los mismos
 * tres tipos, con la misma cinta (`CINTA_PPT_INTERMEDIO`) y el mismo control
 * `gráfico` — escribirlos otra vez sería una segunda fuente de verdad para el
 * mismo catálogo.
 */

const D_PORTADA: Diapositiva = {
  diseno: 'portada',
  marcadores: [
    { rol: 'titulo', contenido: null, casilla: null },
    // La pregunta ya está puesta: «sin pregunta no hay proyecto» se enseña
    // teniéndola siempre ahí, no pidiendo que se invente.
    { rol: 'subtitulo', contenido: PREGUNTA, casilla: null },
  ],
  libres: [],
  notas: 'Di el nombre de tu proyecto y lee la pregunta en voz alta.',
};

const D_AFIRMACION: Diapositiva = {
  diseno: 'titulo-texto',
  marcadores: [
    { rol: 'titulo', contenido: null, casilla: null },
    // Los datos YA están: lo que falta es la frase de arriba y, con el
    // control «gráfico», decidir qué dicen estos cuatro números.
    { rol: 'cuerpo', contenido: 'Papel: 45\nPlástico: 30\nComida: 18\nOtros: 12', casilla: null },
  ],
  libres: [],
  notas: 'Lee tu frase primero. Luego señala la gráfica: por eso la elegiste así.',
};

const D_PROPUESTA: Diapositiva = {
  diseno: 'titulo-texto',
  marcadores: [
    { rol: 'titulo', contenido: 'Lo que proponemos', casilla: null },
    { rol: 'cuerpo', contenido: 'Lo decimos en el escenario, cuando el público pregunte.', casilla: null },
  ],
  libres: [],
  notas: '',
};

const D_FUENTES: Diapositiva = {
  diseno: 'solo-titulo',
  marcadores: [{ rol: 'titulo', contenido: 'Nuestras fuentes', casilla: null }],
  libres: [],
  notas: 'Enséñales exactamente dónde está el número que te pregunten.',
};

/** Con qué presentación arranca el acto 2. Cuatro diapositivas, como pide el cierre. */
export function mazoDelProyecto(): Mazo {
  return {
    tema: 'noche',
    activa: 0,
    diapositivas: [D_PORTADA, D_AFIRMACION, D_PROPUESTA, D_FUENTES].map((d) => ({
      ...d,
      marcadores: d.marcadores.map((m) => ({ ...m })),
      libres: d.libres.map((l) => ({ ...l })),
    })),
  };
}

/** La galería `prueba` del E6 (DISEÑO, «Lo que NO dan»): se construye con lo que el alumno marcó. */
export function galeriaDePruebas(pruebas: Prueba[]): ItemGaleria[] {
  return pruebas.map((p): ItemGaleria => ({
    valor: `${p.id}|`,
    nombre: p.titulo,
    detalle:
      p.tipo === 'medicion'
        ? `Lo que midió tu grupo · ${p.fecha ?? ''}`
        : p.tipo === 'anuncio'
          ? 'Anuncio'
          : `${p.autor ?? 'Sin autor'} · ${p.fecha ?? 'Sin fecha'}`,
  }));
}

export { TIPOS_GRAFICO };

export function crearGuion(): GuionDiapos {
  return {
    archivo: 'Tu proyecto integrador.pptx',
    mazo: mazoDelProyecto,

    portada: {
      situacion: 'Proyecto integrador · Actos 2 y 3',
      tema: 'Analizar, diseñar y presentar',
      objetivo: 'Vas a armar cuatro diapositivas que sostengan tu afirmación, y a defenderlas delante del público.',
      vasAHacer: [
        'Ponerle título a tu proyecto',
        'Escribir lo que vas a sostener',
        'Elegir la gráfica que habla de eso',
        'Pegar tus fuentes',
        'Subir al escenario',
      ],
      requisitos: 'Lo que guardaste en el navegador. Ya está aquí, en la galería de fuentes.',
      ayuda: 'El panel de Bit, a la derecha, tiene la tabla del salón y las seis frases para elegir.',
    },

    pasos: [
      {
        id: 'la-portada',
        titulo: 'La portada',
        instruccion: 'Ponle título a tu proyecto. Debajo ya está la pregunta: sin pregunta no hay proyecto.',
        pista: 'Haz clic donde dice el título de la diapositiva 1 y escribe el nombre de tu proyecto.',
        logro: { tipo: 'documento', comprueba: laPortadaEstaHecha },
        aprendido: 'Título y pregunta, los dos puestos. Ahora sí hay algo que defender.',
      },
      {
        id: 'lo-que-vas-a-sostener',
        titulo: 'Lo que vas a sostener',
        instruccion:
          'En la diapositiva 2, escribe como título UNA de las frases que la tabla del salón puede sostener. Mira el panel de Bit.',
        pista: 'Esa frase no la sostiene tu tabla. Vuelve a mirar los números antes de elegir.',
        logro: { tipo: 'documento', comprueba: (m) => afirmacionDe(m)?.sostenida === true },
        aprendido: 'Elegiste lo que vas a sostener. Ahora la gráfica tiene que hablar de eso mismo.',
      },
      {
        id: 'la-grafica-que-habla-de-eso',
        titulo: 'La gráfica que habla de eso',
        instruccion:
          'En la misma diapositiva, usa Insertar → Gráfico y elige el tipo que habla de lo que acabas de escribir — no el que se ve más bonito.',
        pista: 'Barras compara cantidades. Líneas es cómo cambia con los días. Pastel es partes de un total.',
        senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'gráfico' },
        logro: { tipo: 'documento', comprueba: (m) => sostiene(afirmacionDe(m), tipoDeGraficoDe(m)) },
        aprendido: 'Tu frase y tu gráfica dicen lo mismo. Eso es sostener algo.',
      },
      {
        id: 'las-fuentes',
        titulo: 'Las fuentes',
        instruccion:
          'En la diapositiva de fuentes, usa Insertar → Imágenes y pega la medición del grupo y al menos un artículo firmado.',
        pista: 'Lo que guardaste con la estrella en el navegador está ahora en esa galería.',
        senal: { pestana: 'insertar', grupo: 'ilustraciones', control: 'imagen' },
        logro: { tipo: 'documento', comprueba: lasFuentesEstanCompletas },
        aprendido: 'Dar crédito no es cortesía: es lo que deja que otro compruebe lo que dijiste.',
      },
      {
        id: 'de-donde-sacaste-ese-numero',
        titulo: 'De dónde sacaste ese número',
        instruccion: 'El público pregunta. Ve a tu diapositiva de fuentes y señala la que sostiene tu número.',
        pista: 'La medición de tu grupo o un artículo firmado. El anuncio no sostiene nada.',
        logro: { tipo: 'control', control: 'defender-fuente' },
        aprendido: 'Un proyecto se defiende señalando, no repitiendo.',
      },
      {
        id: 'y-en-las-otras-escuelas',
        titulo: 'Y en las otras escuelas, ¿pasa igual?',
        instruccion: 'Piensa hasta dónde llega lo que mediste antes de contestar.',
        pista: 'Contaron un salón, una semana. No otra cosa.',
        logro: { tipo: 'control', control: 'eso-no-lo-medimos' },
        aprendido: 'Decir hasta dónde llega tu dato no es no saber: es saber exactamente lo que sabes.',
      },
      {
        id: 'que-proponen',
        titulo: '¿Qué proponen?',
        instruccion: 'Elige la propuesta que se deduce de tu propia gráfica.',
        pista: 'Vuelve a mirar lo que escribiste en el E4: la propuesta tiene que hablar de eso mismo.',
        logro: { tipo: 'control', control: 'propuesta-correcta' },
        aprendido: 'Dijiste algo, lo sostuviste con tus datos, y dijiste hasta dónde llegaba. Eso es un proyecto.',
      },
    ],

    cierre:
      'Seis niveles de primaria caben en esa presentación tuya. Sostuviste una frase con tus propios datos y dijiste hasta dónde llegaba. Nos vemos en secundaria.',
  };
}
