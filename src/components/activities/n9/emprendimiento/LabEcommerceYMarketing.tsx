'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  estadoSeguridad,
  paginaDe,
  urlDeBusqueda,
  useNavegador,
  VentanaNavegador,
  type MapaSitios,
  type PaginaWeb,
  type ResultadoBusqueda,
} from '../../../simuladores/navegador';

/**
 * N9 · «Emprendimiento e identidad digital» — «E-commerce y marketing
 * digital» (nociones), parada 2 de 3. Nivel 9 = 3° de Secundaria, 14–15 años.
 *
 * Corre sobre `simuladores/navegador` (el mismo armazón de N8·ciberseguridad):
 * una página de producto ES una `PaginaWeb` con `cuerpo.tipo === 'ficha'`
 * (precio, datos, botón de acción), y una lista de resultados con anuncios
 * mezclados ya trae `esAnuncio` de fábrica — nada de esto se inventó para
 * esta clase, sólo se reusa con datos de tienda en vez de datos de banco.
 *
 * ── Por qué el candado de Acto 3 no repite `n8-cifrado-basico` ─────────────
 *
 * Esa clase enseña «https con candado = seguro». Aquí Tienda B tiene candado
 * VÁLIDO (`estadoSeguridad` real, reusada, nunca duplicada a mano) y sigue
 * siendo sospechosa: reseñas fabricadas el mismo día, sin contacto real, sin
 * política de devolución. El criterio se aplica a un caso nuevo — el candado
 * es necesario, nunca suficiente — sin volver a explicar qué es HTTPS.
 *
 * ── La regla anti-épsilon aplicada a comercio (documento §46) ──────────────
 *
 * Cada veredicto se calcula con una función real sobre los datos del caso
 * (`claridadFicha`, `elementoFaltante`, `esTiendaConfiable`), nunca contra una
 * respuesta copiada a mano por id. Si mañana se agrega una cuarta tienda o un
 * tercer anuncio, el mismo cálculo sigue sirviendo.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Acto 1 «Cómo funciona una tienda en línea» — tres fichas, un predicado
// ═══════════════════════════════════════════════════════════════════════════

interface FichaProducto {
  id: string;
  url: string;
  nombre: string;
  tienePrecio: boolean;
  /** Materiales, tamaño o tiempo de entrega — un dato real, no relleno. */
  descripcionInformativa: boolean;
  llamadaAccionFunciona: boolean;
}

function claridadFicha(f: FichaProducto): 'clara' | 'confusa' {
  return f.tienePrecio && f.descripcionInformativa && f.llamadaAccionFunciona ? 'clara' : 'confusa';
}

const FICHA_LUNA: FichaProducto = {
  id: 'ficha-luna',
  url: 'tienda-clara-resina.mx/pulsera-luna',
  nombre: 'Pulsera «Luna» — Taller Regina',
  tienePrecio: true,
  descripcionInformativa: true,
  llamadaAccionFunciona: true,
};

const FICHA_BAZAR: FichaProducto = {
  id: 'ficha-bazar',
  url: 'bazar-improvisado.mx/prod48213',
  nombre: 'Producto 48213',
  tienePrecio: false,
  descripcionInformativa: false,
  llamadaAccionFunciona: false,
};

const FICHA_MODA: FichaProducto = {
  id: 'ficha-moda',
  url: 'moda-en-linea.mx/collar-artesanal',
  nombre: 'Collar artesanal — moda-en-linea.mx',
  tienePrecio: true,
  descripcionInformativa: false,
  llamadaAccionFunciona: true,
};

const FICHAS_ACTO1: FichaProducto[] = [FICHA_LUNA, FICHA_BAZAR, FICHA_MODA];

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_DIAGNOSTICO_MODA: OpcionMcq[] = [
  { id: 'a', texto: 'Le falta el precio', correcta: false, explicacion: 'No: el precio sí está — $220 MXN, bien visible.' },
  {
    id: 'b',
    texto: 'Le falta una descripción con datos reales: materiales, tamaño o tiempo de entrega',
    correcta: true,
    explicacion:
      '«¡El accesorio que estabas esperando! Único y especial» no dice de qué está hecho, qué tamaño tiene ni cuándo llega — son palabras de relleno, no información. Un precio y un botón no bastan si la descripción no dice nada real.',
  },
  { id: 'c', texto: 'Le falta un botón de compra', correcta: false, explicacion: 'No: el botón «Comprar ahora» está y funciona.' },
  {
    id: 'd',
    texto: 'No le falta nada, está lista para vender',
    correcta: false,
    explicacion: 'Tiene precio y botón, pero la descripción no dice nada que ayude a decidir la compra — eso también es una página incompleta.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto 2 «Marketing digital» — resultados de búsqueda + dos anuncios
// ═══════════════════════════════════════════════════════════════════════════

const CONSULTA_BUSQUEDA = 'pulseras personalizadas';
const URL_BUSQUEDA = urlDeBusqueda(CONSULTA_BUSQUEDA);

const RESULTADOS_BUSQUEDA: ResultadoBusqueda[] = [
  {
    id: 'r-guia',
    titulo: 'Cómo elegir el material correcto para pulseras personalizadas',
    url: 'blogmanualidades.mx/guia-pulseras',
    descripcion: 'Comparamos resina, hilo encerado y cuentas: cuál conviene según el uso.',
    esAnuncio: false,
  },
  {
    id: 'r-regina',
    titulo: 'Pulseras Luna — hechas a mano, envío en 3 días | Taller Regina',
    url: FICHA_LUNA.url,
    descripcion: 'Personaliza colores y tamaño. Desde $180 MXN.',
    esAnuncio: true,
  },
  {
    id: 'r-foro',
    titulo: '¿Alguien recomienda un taller de pulseras de resina en México?',
    url: 'forocraft.mx/hilo-1029',
    descripcion: 'Varias personas comparten talleres y experiencias reales.',
    esAnuncio: false,
  },
  {
    id: 'r-oferta',
    titulo: 'Pulseras personalizadas 50% OFF sólo hoy — envío gratis',
    url: 'ofertononstop.click/pulseras',
    descripcion: 'Compra ya, unidades limitadas.',
    esAnuncio: true,
  },
];

const PAGINA_BUSQUEDA: PaginaWeb = {
  url: URL_BUSQUEDA,
  pestana: 'Buscador',
  titulo: `Resultados para "${CONSULTA_BUSQUEDA}"`,
  autor: null,
  fecha: null,
  cuerpo: { tipo: 'resultados', consulta: CONSULTA_BUSQUEDA, resultados: RESULTADOS_BUSQUEDA },
};

const OPCIONES_REFLEXION_ANUNCIOS: OpcionMcq[] = [
  { id: 'a', texto: 'Porque los anuncios siempre llevan a páginas falsas', correcta: false, explicacion: 'No: el anuncio de Taller Regina lleva a una página de producto real y clara — un anuncio pagado puede ser honesto.' },
  {
    id: 'b',
    texto: 'Porque saber quién pagó para aparecer primero te deja decidir con esa información, en vez de asumir que ganó por ser el mejor resultado',
    correcta: true,
    explicacion:
      'Exacto. Un anuncio marcado no es un engaño — es información: alguien pagó por ese lugar. Ignorarla es la mitad del riesgo; la otra mitad es asumir que «arriba» siempre significa «mejor».',
  },
  { id: 'c', texto: 'Porque los resultados orgánicos siempre son mejores que los anuncios', correcta: false, explicacion: 'No siempre: la guía y el foro son útiles, pero el anuncio de Taller Regina también lo es — depende del caso, no de la etiqueta.' },
  { id: 'd', texto: 'Porque un anuncio nunca dice la verdad sobre el producto', correcta: false, explicacion: 'No: el anuncio de Taller Regina describe el producto real. El problema no es que sea anuncio, es cuando además miente — como «Pulseras 50% OFF» sin decir de qué tienda es.' },
];

interface AnuncioRegina {
  id: string;
  texto: string;
  mencionaProducto: boolean;
  publicoClaro: boolean;
  tieneLlamadaAccion: boolean;
}

type ElementoAnuncio = 'producto' | 'publico' | 'llamada' | 'completo';

function elementoFaltante(a: AnuncioRegina): ElementoAnuncio {
  if (!a.mencionaProducto) return 'producto';
  if (!a.publicoClaro) return 'publico';
  if (!a.tieneLlamadaAccion) return 'llamada';
  return 'completo';
}

const ANUNCIO_SIN_PRODUCTO: AnuncioRegina = {
  id: 'anuncio-sin-producto',
  texto: '«¡Los accesorios que todos van a querer! Escríbenos por Instagram @tallerregina para hacer el tuyo.»',
  mencionaProducto: false,
  publicoClaro: true,
  tieneLlamadaAccion: true,
};

const ANUNCIO_SIN_LLAMADA: AnuncioRegina = {
  id: 'anuncio-sin-llamada',
  texto:
    '«Pulseras de resina personalizadas, ideales para regalo de cumpleaños o graduación. Cada una se hace a mano, con los colores y el nombre que elijas.»',
  mencionaProducto: true,
  publicoClaro: true,
  tieneLlamadaAccion: false,
};

const ANUNCIOS: AnuncioRegina[] = [ANUNCIO_SIN_PRODUCTO, ANUNCIO_SIN_LLAMADA];

const OPCIONES_ELEMENTO: { id: ElementoAnuncio; etiqueta: string }[] = [
  { id: 'producto', etiqueta: 'Le falta decir qué vende' },
  { id: 'publico', etiqueta: 'Le falta un público o una ocasión claros' },
  { id: 'llamada', etiqueta: 'Le falta decir cómo comprarlo' },
  { id: 'completo', etiqueta: 'No le falta nada' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto 3 «Confianza y señales reales» — dos tiendas, candado incluido
// ═══════════════════════════════════════════════════════════════════════════

interface SenalesTienda {
  id: string;
  url: string;
  nombre: string;
  resenasCreibles: boolean;
  contactoReal: boolean;
  politicaDevolucion: boolean;
}

/** El candado se lee en vivo con `estadoSeguridad` sobre la página real del
 *  mapa — nunca un booleano copiado a mano que pueda desincronizarse. */
function esTiendaConfiable(t: SenalesTienda, mapa: MapaSitios): boolean {
  const candadoOk = estadoSeguridad(paginaDe(mapa, t.url)) === 'segura';
  return candadoOk && t.resenasCreibles && t.contactoReal && t.politicaDevolucion;
}

const TIENDA_A: SenalesTienda = {
  id: 'tienda-a',
  url: 'resina-luna-mx.tecnia/tienda',
  nombre: 'Resina Luna',
  resenasCreibles: true,
  contactoReal: true,
  politicaDevolucion: true,
};

const TIENDA_B: SenalesTienda = {
  id: 'tienda-b',
  url: 'ofertononstop.click/tienda',
  nombre: 'OfertaNonStop',
  resenasCreibles: false,
  contactoReal: false,
  politicaDevolucion: false,
};

const TIENDAS: SenalesTienda[] = [TIENDA_A, TIENDA_B];

const PAGINA_TIENDA_A: PaginaWeb = {
  url: TIENDA_A.url,
  pestana: 'Resina Luna',
  titulo: 'Resina Luna — pulseras y dijes hechos a mano',
  autor: null,
  fecha: null,
  protocolo: 'https',
  certificado: { emisor: 'AC Confianza Digital', valido: true },
  cuerpo: {
    tipo: 'ficha',
    datos: [
      { etiqueta: 'Reseñas', valor: '212 reseñas verificadas de compradores reales · 4.7★' },
      { etiqueta: 'Contacto', valor: 'Instagram @tallerregina y correo contacto@resinaluna.mx' },
      { etiqueta: 'Política de devolución', valor: 'Cambios dentro de 5 días si la pieza llega dañada' },
    ],
  },
  senales: [
    {
      id: 'sa-resenas',
      tono: 'buena',
      texto: 'Las reseñas tienen fecha y foto, y son de compradores distintos a lo largo de varios meses.',
      explica: 'Así se ven las reseñas reales: se acumulan con el tiempo, no todas de golpe.',
    },
  ],
};

const PAGINA_TIENDA_B: PaginaWeb = {
  url: TIENDA_B.url,
  pestana: 'OfertaNonStop',
  titulo: 'OfertaNonStop — todo con 50% de descuento',
  autor: null,
  fecha: null,
  protocolo: 'https',
  certificado: { emisor: 'AC Confianza Digital', valido: true },
  cuerpo: {
    tipo: 'ficha',
    datos: [
      { etiqueta: 'Reseñas', valor: '300 reseñas, todas de 5 estrellas, publicadas el mismo día' },
      { etiqueta: 'Contacto', valor: 'Sólo un botón de WhatsApp a un número personal, sin nombre de negocio' },
      { etiqueta: 'Política de devolución', valor: 'No se aceptan devoluciones ni cambios' },
    ],
  },
  senales: [
    {
      id: 'sb-resenas',
      tono: 'alerta',
      texto: 'Las 300 reseñas se publicaron el mismo día.',
      explica:
        'Las reseñas reales de un negocio real se acumulan a lo largo de semanas o meses, de compradores distintos, en fechas distintas — trescientas el mismo día es un patrón fabricado, no orgánico.',
    },
  ],
};

const OPCIONES_REFLEXION_CANDADO: OpcionMcq[] = [
  { id: 'a', texto: 'Porque el candado de OfertaNonStop no es real', correcta: false, explicacion: 'Sí es real: el certificado es válido. El problema no está en la conexión.' },
  {
    id: 'b',
    texto: 'Porque el candado sólo protege los datos mientras viajan por internet; no dice nada sobre si el vendedor es honesto, cumple lo que promete o tiene reseñas reales',
    correcta: true,
    explicacion:
      'Exacto — es la misma idea de HTTPS aplicada a un caso nuevo: el candado cifra la conexión, punto. No audita reseñas, no verifica un negocio, no obliga a nadie a aceptar devoluciones. Es necesario, nunca suficiente.',
  },
  { id: 'c', texto: 'Porque las tiendas con candado siempre son más caras', correcta: false, explicacion: 'El candado no tiene nada que ver con el precio.' },
  { id: 'd', texto: 'Porque un dominio .click nunca puede tener candado', correcta: false, explicacion: 'Cualquier dominio puede tener HTTPS, incluido uno .click — el candado no depende de la terminación del dominio.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto 4 «El plan de Regina» — cierre: seleccionar y rechazar
// ═══════════════════════════════════════════════════════════════════════════

interface ItemPlan {
  id: string;
  texto: string;
  recomendable: boolean;
}

const PLAN_OPCIONES: ItemPlan[] = [
  { id: 'precio-visible', texto: 'Poner el precio de cada pulsera junto a su foto', recomendable: true },
  { id: 'descripcion-real', texto: 'Describir materiales, tamaño y tiempo de entrega real de cada pulsera', recomendable: true },
  { id: 'boton-claro', texto: 'Poner un mensaje claro de cómo comprar («Pide por WhatsApp»)', recomendable: true },
  { id: 'marcar-publicidad', texto: 'Si paga para que Instagram le muestre su publicación a más gente, marcarla como «Publicidad»', recomendable: true },
  { id: 'contacto-real', texto: 'Poner un contacto real: su cuenta de Instagram verdadera o un correo que sí revisa', recomendable: true },
  { id: 'politica-honesta', texto: 'Ofrecer una política de cambios que sí pueda cumplir (p. ej. «cambios en 5 días si llega dañada»)', recomendable: true },
  { id: 'resenas-falsas', texto: 'Pedirle a 50 amigos que dejen una reseña de 5 estrellas el mismo día para verse más popular', recomendable: false },
  { id: 'fotos-ajenas', texto: 'Usar fotos de pulseras de una marca famosa para que su catálogo se vea más profesional', recomendable: false },
  { id: 'envio-gratis-falso', texto: 'Anunciar «envío gratis a todo México» aunque en realidad ella sí lo cobra', recomendable: false },
];

function seleccionPlanCorrecta(seleccion: Record<string, boolean>): boolean {
  return PLAN_OPCIONES.every((o) => Boolean(seleccion[o.id]) === o.recomendable);
}

const OPCIONES_REFLEXION_CIERRE: OpcionMcq[] = [
  { id: 'a', texto: 'Porque inflar reseñas y prometer envíos falsos es ilegal en todos los casos', correcta: false, explicacion: 'Esa no es la razón central de esta clase: el problema es de confianza, no sólo de reglamento.' },
  {
    id: 'b',
    texto: 'Porque en cuanto un comprador note el engaño —una reseña que no cuadra, un cobro que no esperaba— deja de confiar en la tienda, y se lo cuenta a otros',
    correcta: true,
    explicacion:
      'Exacto — es el mismo patrón que viste en Tienda B: se puede vender rápido una vez engañando, pero la confianza que se rompe no vuelve sola. Un plan honesto vende menos la primera semana y sigue vendiendo la que sigue.',
  },
  { id: 'c', texto: 'Porque Instagram elimina cuentas con reseñas positivas', correcta: false, explicacion: 'No: el riesgo no viene de la plataforma, viene de que el comprador descubra que le mintieron.' },
  { id: 'd', texto: 'Porque cobrar envío siempre es obligatorio', correcta: false, explicacion: 'No es sobre si se cobra o no el envío — es sobre decir la verdad de lo que se cobra.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5 · El mapa de sitios — una sola fuente para las tres fases navegables
// ═══════════════════════════════════════════════════════════════════════════

const PAGINA_LUNA: PaginaWeb = {
  url: FICHA_LUNA.url,
  pestana: 'Pulsera Luna',
  titulo: 'Pulsera de resina «Luna» — hecha a mano',
  autor: 'Taller Regina',
  fecha: null,
  cuerpo: {
    tipo: 'ficha',
    precio: '$180 MXN',
    datos: [
      { etiqueta: 'Materiales', valor: 'Resina epóxica + hilo encerado' },
      { etiqueta: 'Tamaño', valor: 'Ajustable, 16-20 cm' },
      { etiqueta: 'Entrega', valor: '3 a 5 días hábiles' },
      { etiqueta: 'Reseñas', valor: '34 reseñas · 4.8★' },
    ],
    acciones: [{ id: 'comprar', etiqueta: 'Añadir al carrito' }],
  },
};

const PAGINA_BAZAR: PaginaWeb = {
  url: FICHA_BAZAR.url,
  pestana: 'Producto 48213',
  titulo: 'Producto 48213',
  autor: null,
  fecha: null,
  cuerpo: {
    tipo: 'ficha',
    datos: [{ etiqueta: 'Descripción', valor: 'Artículo bonito, calidad garantizada.' }],
    acciones: [{ id: 'comprar', etiqueta: 'Comprar', deshabilitada: true }],
  },
};

const PAGINA_MODA: PaginaWeb = {
  url: FICHA_MODA.url,
  pestana: 'Collar artesanal',
  titulo: 'Collar artesanal para toda ocasión',
  autor: null,
  fecha: null,
  cuerpo: {
    tipo: 'ficha',
    precio: '$220 MXN',
    datos: [{ etiqueta: 'Descripción', valor: '¡El accesorio que estabas esperando! Único y especial.' }],
    acciones: [{ id: 'comprar', etiqueta: 'Comprar ahora' }],
  },
};

const MAPA_SITIOS: MapaSitios = {
  [PAGINA_LUNA.url]: PAGINA_LUNA,
  [PAGINA_BAZAR.url]: PAGINA_BAZAR,
  [PAGINA_MODA.url]: PAGINA_MODA,
  [PAGINA_BUSQUEDA.url]: PAGINA_BUSQUEDA,
  [PAGINA_TIENDA_A.url]: PAGINA_TIENDA_A,
  [PAGINA_TIENDA_B.url]: PAGINA_TIENDA_B,
};

// ═══════════════════════════════════════════════════════════════════════════
// 6 · El laboratorio — 9 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 9;

const NOMBRES_ACTO = ['Cómo funciona una tienda en línea', 'Marketing digital', 'Confianza y señales reales', 'El plan de Regina'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 2, 5, 7, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  'Regina va a abrir su catálogo. Antes, mira estas tres páginas de producto reales y clasifica cada una: ¿clara o confusa?',
  'La de moda-en-linea.mx tiene precio y botón, y aun así la marcaste confusa. ¿Qué le falta exactamente?',
  'Regina buscó «pulseras personalizadas». Clasifica cada resultado: ¿contenido orgánico o anuncio pagado?',
  '¿Por qué importa distinguir un resultado orgánico de un anuncio pagado?',
  'Dos anuncios reales de emprendimientos. A cada uno le falta exactamente una cosa. Diagnostica cuál.',
  'Dos tiendas en línea. Lee sus señales —reseñas, contacto, política de devolución— y decide: ¿confiable o sospechosa?',
  'OfertaNonStop también tiene candado 🔒 válido. ¿Por qué sigue siendo sospechosa?',
  'Regina va a armar su plan. Marca lo que SÍ debería hacer.',
  'Podría vender más rápido esta semana inflando reseñas y prometiendo envío gratis falso. ¿Por qué no conviene?',
];

export function LabEcommerceYMarketing(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [veredictosFichas, setVeredictosFichas] = useState<Record<string, string | undefined>>({});
  const [diagnosticoModaId, setDiagnosticoModaId] = useState<string | null>(null);

  // Acto 2
  const [veredictosResultados, setVeredictosResultados] = useState<Record<string, string | undefined>>({});
  const [reflexionAnunciosId, setReflexionAnunciosId] = useState<string | null>(null);
  const [diagnosticosAnuncios, setDiagnosticosAnuncios] = useState<Record<string, ElementoAnuncio | undefined>>({});

  // Acto 3
  const [veredictosTiendas, setVeredictosTiendas] = useState<Record<string, string | undefined>>({});
  const [reflexionCandadoId, setReflexionCandadoId] = useState<string | null>(null);

  // Acto 4
  const [seleccionPlan, setSeleccionPlan] = useState<Record<string, boolean>>({});
  const [reflexionCierreId, setReflexionCierreId] = useState<string | null>(null);

  const nav = useNavegador({ mapa: MAPA_SITIOS, inicio: FICHA_LUNA.url });
  const [direccion, setDireccion] = useState(FICHA_LUNA.url);

  // La barra de direcciones sigue a la pestaña activa, venga de un clic, de
  // `navegar` o de una pestaña abierta a propósito por el guion.
  useEffect(() => {
    setDireccion(nav.paginaActual.url);
  }, [nav.paginaActual.url]);

  // Abrir las pestañas de comparación de cada acto UNA sola vez — guardas por
  // `ref`, no por dependencia de `nav` (sus callbacks son estables pero el
  // objeto que los envuelve no, igual que en `LabCifradoBasico`).
  const abrioFichasRef = useRef(false);
  const abrioTiendaBRef = useRef(false);
  useEffect(() => {
    if (pasoActual === 0 && !abrioFichasRef.current) {
      abrioFichasRef.current = true;
      nav.nuevaPestana(FICHA_BAZAR.url);
      nav.nuevaPestana(FICHA_MODA.url);
    }
    if (pasoActual === 2) {
      nav.navegar(URL_BUSQUEDA);
    }
    if (pasoActual === 5 && !abrioTiendaBRef.current) {
      abrioTiendaBRef.current = true;
      nav.navegar(TIENDA_A.url);
      nav.nuevaPestana(TIENDA_B.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual]);

  const marcarAcierto = (texto: string) => {
    lab.avanzar();
    setMensaje({ ok: true, texto });
    setBloqueado(true);
  };

  const marcarError = (texto: string) => {
    lab.restar();
    setMensaje({ ok: false, texto });
  };

  const siguiente = () => {
    setMensaje(null);
    setBloqueado(false);
    setPasoActual((p) => p + 1);
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  // ── Acto 1 ────────────────────────────────────────────────────────────
  const comprobarFichas = () => {
    if (bloqueado) return;
    const todasCorrectas = FICHAS_ACTO1.every((f) => veredictosFichas[f.id] === claridadFicha(f));
    if (todasCorrectas) {
      marcarAcierto(
        'Las tres coinciden: la Pulsera Luna tiene precio, descripción real y botón — clara. El Producto 48213 no tiene ninguno de los tres — confusa. Y el collar de moda-en-linea.mx tiene precio y botón, pero su descripción no dice nada real — también confusa, aunque a primera vista parezca completa.',
      );
    } else {
      marcarError('Todavía no coinciden las tres. Revisa cada página: ¿tiene precio, una descripción con datos reales, y un botón que funcione?');
    }
  };

  const elegirDiagnosticoModa = (op: OpcionMcq) => {
    if (bloqueado) return;
    setDiagnosticoModaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const comprobarResultados = () => {
    if (bloqueado) return;
    const todosCorrectos = RESULTADOS_BUSQUEDA.every(
      (r) => veredictosResultados[r.id] === (r.esAnuncio ? 'anuncio' : 'organico'),
    );
    if (todosCorrectos) {
      marcarAcierto(
        'Los cuatro coinciden: la guía y el hilo del foro son contenido orgánico — nadie pagó por ese lugar. El de Taller Regina y el de «50% OFF» están marcados «Anuncio»: alguien pagó para aparecer ahí, aunque uno sea honesto (Taller Regina) y el otro no diga siquiera de qué tienda es.',
      );
    } else {
      marcarError('Todavía no coinciden los cuatro. Revisa la etiqueta «Anuncio» en cada resultado dentro del navegador — no todos la tienen.');
    }
  };

  const elegirReflexionAnuncios = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionAnunciosId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirElementoAnuncio = (id: string, valor: ElementoAnuncio) => {
    if (bloqueado) return;
    setDiagnosticosAnuncios((prev) => ({ ...prev, [id]: valor }));
  };

  const comprobarAnuncios = () => {
    if (bloqueado) return;
    const todosCorrectos = ANUNCIOS.every((a) => diagnosticosAnuncios[a.id] === elementoFaltante(a));
    if (todosCorrectos) {
      marcarAcierto(
        'Los dos coinciden: el primer anuncio nunca dice que vende pulseras —sólo «accesorios»—, así que aunque tenga público y forma de contactar, no dice qué vende. El segundo describe el producto y a quién le sirve, pero nunca dice cómo comprarlo — le falta la llamada a la acción.',
      );
    } else {
      marcarError('Todavía no coinciden los dos. Revisa cada anuncio: ¿dice qué vende? ¿para quién es? ¿dice cómo comprarlo?');
    }
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const comprobarTiendas = () => {
    if (bloqueado) return;
    const todasCorrectas = TIENDAS.every((t) => veredictosTiendas[t.id] === (esTiendaConfiable(t, MAPA_SITIOS) ? 'confiable' : 'sospechosa'));
    if (todasCorrectas) {
      marcarAcierto(
        'Las dos coinciden: Resina Luna tiene candado válido, reseñas creíbles a lo largo de meses, contacto real y una política de devolución que puede cumplir — confiable. OfertaNonStop también tiene candado válido, pero sus 300 reseñas salieron el mismo día, su único contacto es un WhatsApp personal sin nombre de negocio, y no acepta devoluciones — sospechosa, aunque el candado esté ahí.',
      );
    } else {
      marcarError('Todavía no coinciden las dos. El candado no es lo único que importa: revisa también reseñas, contacto y política de devolución de cada tienda.');
    }
  };

  const elegirReflexionCandado = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCandadoId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const alternarSeleccionPlan = (id: string) => {
    if (bloqueado) return;
    setSeleccionPlan((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const comprobarPlan = () => {
    if (bloqueado) return;
    if (seleccionPlanCorrecta(seleccionPlan)) {
      marcarAcierto(
        'El plan de Regina queda completo con las seis primeras: precio visible, descripción real, forma clara de comprar, publicidad marcada como tal, contacto real y una política que sí puede cumplir. Inflar reseñas, usar fotos ajenas o prometer un envío gratis falso no son parte del plan — son el mismo engaño que viste en OfertaNonStop, sólo que esta vez sería ella quien lo hace.',
      );
    } else {
      marcarError('Todavía no. Revisa cada elemento: ¿ayuda a que la tienda sea clara y confiable, o es un atajo que engaña para vender más rápido?');
    }
  };

  const elegirReflexionCierre = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCierreId(op.id);
    if (op.correcta) {
      lab.avanzar();
      setMensaje({ ok: true, texto: op.explicacion });
      setBloqueado(true);
    } else {
      marcarError(op.explicacion);
    }
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Navegador" subtitulo="Tienda en línea y marketing digital">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🛒
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Vender con criterio</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Distinguiste una página de producto clara de una confusa, separaste contenido orgánico de anuncios pagados
            y diagnosticaste qué le faltaba a dos anuncios reales, decidiste qué tienda era confiable aunque las dos
            tuvieran candado, y armaste el plan honesto de Regina — el que vende más despacio la primera semana y
            sigue vendiendo la que sigue.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-violet-500 text-white font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);
  const todasFichasElegidas = FICHAS_ACTO1.every((f) => veredictosFichas[f.id]);
  const todosResultadosElegidos = RESULTADOS_BUSQUEDA.every((r) => veredictosResultados[r.id]);
  const todosAnunciosElegidos = ANUNCIOS.every((a) => diagnosticosAnuncios[a.id]);
  const todasTiendasElegidas = TIENDAS.every((t) => veredictosTiendas[t.id]);

  return (
    <VentanaBase marca="Tecnia Navegador" subtitulo={NOMBRES_ACTO[acto]}>
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-400">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> de {TOTAL}
          </p>
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
            {NOMBRES_ACTO.map((nombre, i) => {
              const activa = acto === i;
              const hecha = pasoActual >= LIMITES_ACTO[i + 1];
              return (
                <span
                  key={nombre}
                  className={`px-3 py-1.5 rounded-full ${
                    activa ? 'bg-violet-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {nombre}
                </span>
              );
            })}
          </div>
        </div>

        {/* Encargo 1 · clasificar tres fichas de producto */}
        {pasoActual === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <VentanaNavegador
              pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: paginaDe(MAPA_SITIOS, p.url).pestana }))}
              pagina={nav.paginaActual}
              puedeAtras={nav.puedeAtras}
              puedeAdelante={nav.puedeAdelante}
              barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
              onAtras={() => nav.atras()}
              onAdelante={() => nav.adelante()}
              onRecargar={() => nav.recargar()}
              onActivarPestana={(id) => nav.activarPestana(id)}
            />
            <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
              <p className="text-sm text-slate-200 leading-relaxed">{INSTRUCCIONES[0]}</p>
              <ListaClasificacion
                items={FICHAS_ACTO1.map((f) => ({ id: f.id, etiqueta: f.nombre }))}
                opciones={[
                  { valor: 'clara', etiqueta: '🟢 Clara' },
                  { valor: 'confusa', etiqueta: '🔴 Confusa' },
                ]}
                seleccion={veredictosFichas}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosFichas((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarFichas}
                puedeComprobar={todasFichasElegidas}
              />
              <MensajeYAvance mensaje={mensaje} esUltimo={false} onSiguiente={siguiente} onTerminar={terminar} />
            </div>
          </div>
        )}

        {/* Encargo 2 · diagnóstico de la ficha engañosa */}
        {pasoActual === 1 && (
          <McqBloque
            pregunta={INSTRUCCIONES[1]}
            opciones={OPCIONES_DIAGNOSTICO_MODA}
            elegidoId={diagnosticoModaId}
            bloqueado={bloqueado}
            onElegir={elegirDiagnosticoModa}
            mensaje={mensaje}
            esUltimo={false}
            onSiguiente={siguiente}
            onTerminar={terminar}
          />
        )}

        {/* Encargo 3 · orgánico vs. anuncio en resultados de búsqueda */}
        {pasoActual === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <VentanaNavegador
              pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: paginaDe(MAPA_SITIOS, p.url).pestana }))}
              pagina={nav.paginaActual}
              puedeAtras={nav.puedeAtras}
              puedeAdelante={nav.puedeAdelante}
              barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
              onAtras={() => nav.atras()}
              onAdelante={() => nav.adelante()}
              onRecargar={() => nav.recargar()}
              onIrAUrl={(url) => nav.navegar(url)}
            />
            <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
              <p className="text-sm text-slate-200 leading-relaxed">{INSTRUCCIONES[2]}</p>
              <ListaClasificacion
                items={RESULTADOS_BUSQUEDA.map((r) => ({ id: r.id, etiqueta: r.titulo, sub: r.url }))}
                opciones={[
                  { valor: 'organico', etiqueta: '🌱 Orgánico' },
                  { valor: 'anuncio', etiqueta: '💰 Anuncio' },
                ]}
                seleccion={veredictosResultados}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosResultados((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarResultados}
                puedeComprobar={todosResultadosElegidos}
              />
              <MensajeYAvance mensaje={mensaje} esUltimo={false} onSiguiente={siguiente} onTerminar={terminar} />
            </div>
          </div>
        )}

        {/* Encargo 4 · reflexión sobre por qué distinguir anuncio de orgánico */}
        {pasoActual === 3 && (
          <McqBloque
            pregunta={INSTRUCCIONES[3]}
            opciones={OPCIONES_REFLEXION_ANUNCIOS}
            elegidoId={reflexionAnunciosId}
            bloqueado={bloqueado}
            onElegir={elegirReflexionAnuncios}
            mensaje={mensaje}
            esUltimo={false}
            onSiguiente={siguiente}
            onTerminar={terminar}
          />
        )}

        {/* Encargo 5 · diagnosticar dos anuncios reales */}
        {pasoActual === 4 && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
            <p className="text-sm text-slate-300">{INSTRUCCIONES[4]}</p>
            <ul className="flex flex-col gap-3" data-testid="lista-anuncios">
              {ANUNCIOS.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                  <span className="text-sm text-slate-200 leading-relaxed">{a.texto}</span>
                  <div className="flex flex-wrap gap-2">
                    {OPCIONES_ELEMENTO.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        data-testid="elemento-opcion"
                        disabled={bloqueado}
                        onClick={() => elegirElementoAnuncio(a.id, op.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                          diagnosticosAnuncios[a.id] === op.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {op.etiqueta}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            {!bloqueado && (
              <button
                type="button"
                data-testid="comprobar-anuncios"
                disabled={!todosAnunciosElegidos}
                onClick={comprobarAnuncios}
                className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
              >
                Comprobar
              </button>
            )}
            <MensajeYAvance mensaje={mensaje} esUltimo={false} onSiguiente={siguiente} onTerminar={terminar} />
          </div>
        )}

        {/* Encargo 6 · confiable vs. sospechosa */}
        {pasoActual === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <VentanaNavegador
              pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: paginaDe(MAPA_SITIOS, p.url).pestana }))}
              pagina={nav.paginaActual}
              puedeAtras={nav.puedeAtras}
              puedeAdelante={nav.puedeAdelante}
              barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
              onAtras={() => nav.atras()}
              onAdelante={() => nav.adelante()}
              onRecargar={() => nav.recargar()}
              onActivarPestana={(id) => nav.activarPestana(id)}
            />
            <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
              <p className="text-sm text-slate-200 leading-relaxed">{INSTRUCCIONES[5]}</p>
              <ListaClasificacion
                items={TIENDAS.map((t) => ({ id: t.id, etiqueta: t.nombre }))}
                opciones={[
                  { valor: 'confiable', etiqueta: '🟢 Confiable' },
                  { valor: 'sospechosa', etiqueta: '🔴 Sospechosa' },
                ]}
                seleccion={veredictosTiendas}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosTiendas((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarTiendas}
                puedeComprobar={todasTiendasElegidas}
              />
              <MensajeYAvance mensaje={mensaje} esUltimo={false} onSiguiente={siguiente} onTerminar={terminar} />
            </div>
          </div>
        )}

        {/* Encargo 7 · reflexión: el candado no basta */}
        {pasoActual === 6 && (
          <McqBloque
            pregunta={INSTRUCCIONES[6]}
            opciones={OPCIONES_REFLEXION_CANDADO}
            elegidoId={reflexionCandadoId}
            bloqueado={bloqueado}
            onElegir={elegirReflexionCandado}
            mensaje={mensaje}
            esUltimo={false}
            onSiguiente={siguiente}
            onTerminar={terminar}
          />
        )}

        {/* Encargo 8 · el plan de Regina */}
        {pasoActual === 7 && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
            <p className="text-sm text-slate-300">{INSTRUCCIONES[7]}</p>
            <ul className="flex flex-col gap-2" data-testid="lista-plan">
              {PLAN_OPCIONES.map((o) => (
                <li key={o.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                  <span className="text-sm text-white flex-1">{o.texto}</span>
                  <button
                    type="button"
                    data-testid="toggle-plan"
                    disabled={bloqueado}
                    onClick={() => alternarSeleccionPlan(o.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 ${
                      seleccionPlan[o.id] ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {seleccionPlan[o.id] ? '✓ Incluir' : 'No incluir'}
                  </button>
                </li>
              ))}
            </ul>
            {!bloqueado && (
              <button
                type="button"
                data-testid="comprobar-plan"
                onClick={comprobarPlan}
                className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold self-start"
              >
                Comprobar
              </button>
            )}
            <MensajeYAvance mensaje={mensaje} esUltimo={false} onSiguiente={siguiente} onTerminar={terminar} />
          </div>
        )}

        {/* Encargo 9 · reflexión de cierre */}
        {pasoActual === 8 && (
          <McqBloque
            pregunta={INSTRUCCIONES[8]}
            opciones={OPCIONES_REFLEXION_CIERRE}
            elegidoId={reflexionCierreId}
            bloqueado={bloqueado}
            onElegir={elegirReflexionCierre}
            mensaje={mensaje}
            esUltimo={true}
            onSiguiente={siguiente}
            onTerminar={terminar}
          />
        )}
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar», el mismo patrón
 *  que se repetía en cada bloque de `LabDerechosYLicencias` y `LabCifradoBasico`. */
function MensajeYAvance({
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  if (!mensaje) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? '¡Correcto!' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'terminar' : 'siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

/** Lista de N ítems, cada uno con dos opciones de clasificación —reusada por
 *  fichas, resultados de búsqueda y tiendas: el mismo patrón de tres casos
 *  reales que justificó extraer `UsosLicencia` en la clase de créditos. */
function ListaClasificacion({
  items,
  opciones,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  items: { id: string; etiqueta: string; sub?: string }[];
  opciones: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }];
  seleccion: Record<string, string | undefined>;
  bloqueado: boolean;
  onElegir: (id: string, valor: string) => void;
  onComprobar: () => void;
  puedeComprobar: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="lista-clasificacion">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm text-white">{it.etiqueta}</span>
            {it.sub && <span className="text-xs text-slate-400">{it.sub}</span>}
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid="clasificacion-opcion"
                  disabled={bloqueado}
                  onClick={() => onElegir(it.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    seleccion[it.id] === op.valor ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-clasificacion"
          disabled={!puedeComprobar}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las cuatro reflexiones. */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
      <p className="text-lg text-white font-semibold leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
      <MensajeYAvance mensaje={mensaje} esUltimo={esUltimo} onSiguiente={onSiguiente} onTerminar={onTerminar} />
    </div>
  );
}

export default LabEcommerceYMarketing;
