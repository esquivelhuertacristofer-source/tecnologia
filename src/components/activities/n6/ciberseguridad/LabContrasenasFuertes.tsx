'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { useNavegador, VentanaNavegador, paginaDe, type MapaSitios, type PaginaWeb } from '../../../simuladores/navegador';
import {
  BOLSA_PALABRAS,
  DICCIONARIO_COMUN,
  combinacionesDeFrase,
  intentarAdivinar,
  reutilizada,
  sacarPalabras,
  type Intento,
  type PasoAtaque,
  type PerfilPublico,
} from './adivinador';

/**
 * N6·«Ciberseguridad» · «Contraseñas fuertes y 2 pasos» — parada 1 de 3.
 * Primera clase construida sobre `simuladores/navegador/` (armazón cerrado
 * el 15-ago-2026, ninguna clase encima todavía: ver el informe de medición
 * en el pliego de diseño y en `COMO-SE-CONSTRUYE.md`).
 *
 * El argumento del pliego para este armazón: reutilizar no es una propiedad
 * de UNA contraseña, es una propiedad de VARIAS cuentas a la vez, y sólo un
 * navegador con pestañas enseña varias cuentas en la misma pantalla. Por eso
 * las tres pestañas (NivelMax, Aula Tecnia, ClipZone) están abiertas TODA la
 * clase — incluso durante E1/E2, la pestaña de NivelMax hace una escala en
 * `laboratorio.tecnia.mx` antes de volver a ser la cuenta del juego.
 *
 * NO hay medidor de contraseña. La pieza `adivinador.ts` (pura, sin React)
 * enseña el ataque paso por paso — riesgo nº1 del pliego: que esto se lea
 * como una barrita con más pasos. El informe que se pinta aquí NUNCA lleva
 * un número de fuerza: paso, motivo, intento. Punto.
 *
 * Ningún encargo llama a `labActividad.restar()`: es una clase de ciudadanía
 * digital, y ninguna decisión de seguridad resta puntos (mismo tono que
 * `LabAltoAlCiberacoso`/`LabPrivacidadEnJuegos`). El "malo" nunca tiene cara:
 * quien adivina es "un programa"; la ventana emergente dice ser "el soporte
 * de NivelMax", nunca una persona.
 */

type CuentaId = 'juego' | 'escuela' | 'videos';
type Fase = 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'cierre';

const TOTAL_PASOS = 7;
const CODIGO_VERIFICACION = '482913';

const URL_MAQUINA = 'laboratorio.tecnia.mx/maquina';
const URL_FRASES = 'laboratorio.tecnia.mx/frases';
const URL_JUEGO = 'nivelmax.mx/cuenta';
const URL_ESCUELA = 'aula.tecnia.mx/cuenta';
const URL_VIDEOS = 'clipzone.mx/cuenta';
const URL_NOTICIA = 'clipzone.mx/noticia';
const URL_EMERGENTE = 'soporte-nivelmax.mx/verificacion';

const NOMBRE_CUENTA: Record<CuentaId, string> = { juego: 'NivelMax', escuela: 'Aula Tecnia', videos: 'ClipZone' };

interface PersonajeMarcador {
  id: string;
  nombre: string;
  clave: string;
  perfil: PerfilPublico;
}

/** Tres personajes DEL MARCADOR DEL JUEGO — nunca del alumno (regla de
 *  privacidad heredada del §24: ninguna contraseña de esta clase la teclea
 *  el alumno, ni la suya ni una inventada). */
const PERSONAJES_E1: PersonajeMarcador[] = [
  {
    id: 'capiveloz',
    nombre: 'CapiVeloz',
    clave: '123456',
    perfil: { nombre: 'Bruno', mascota: 'Rex', equipo: 'Tiburones', juego: 'CarreraMax', anios: [2015] },
  },
  {
    id: 'lunagamer',
    nombre: 'LunaGamer',
    clave: 'luna2014',
    perfil: { nombre: 'Karla', mascota: 'Luna', equipo: 'Aguilas', juego: 'MegaCarrera', anios: [2014] },
  },
  {
    id: 'reypixel',
    nombre: 'ReyPixel',
    // Nota de construcción: el pliego usa "P@ssw0rd!" en la prosa pedagógica,
    // pero la pieza `sinDisfraz` es deliberadamente mínima (sólo las 5
    // sustituciones, "no intenta ser un normalizador general") y no quita un
    // signo de puntuación final. Con el "!" la clave se leería "password!" y
    // NUNCA caería en el paso 3 — se rompería el único ejemplo de disfraz de
    // toda la clase. Se usa "P@ssw0rd" (sin el "!") para que el paso 3
    // funcione de verdad con la pieza tal y como el pliego la especifica.
    clave: 'P@ssw0rd',
    perfil: { nombre: 'Iker', mascota: 'Toby', equipo: 'Cometas', juego: 'PixelWars', anios: [2016] },
  },
];

const MOTIVOS_E1: { paso: PasoAtaque; texto: string }[] = [
  { paso: 'lista', texto: 'Estaba en la lista de las contraseñas más usadas.' },
  { paso: 'dato', texto: 'Era un dato de su perfil, combinado con un año.' },
  { paso: 'disfraz', texto: 'Era una palabra común disfrazada con símbolos.' },
  { paso: 'fuerza', texto: 'No cayó: había que probarla a lo bruto.' },
];

const TARJETAS_E7: { id: string; texto: string; correcta: boolean }[] = [
  { id: 'gestor', texto: 'En un gestor de contraseñas, con tu adulto.', correcta: true },
  { id: 'cuaderno', texto: 'En un cuaderno que se queda en casa.', correcta: true },
  { id: 'papel-pegado', texto: 'En un papel pegado a la pantalla.', correcta: false },
  { id: 'misma-siempre', texto: 'Uso la misma en todas para acordarme.', correcta: false },
];

const LINEAS = {
  inicio1: 'En cuarto abriste tu primera cuenta. Hoy tienes tres, y eso cambia la pregunta.',
  inicio2: 'La pregunta ya no es si tu contraseña es rara. Es cuánto tarda un programa en adivinarla.',
  e1Intro: 'Abre la máquina de adivinar. Es una página, y prueba contraseñas en orden — empieza siempre por la lista de las más usadas.',
  e1AciertoLista: 'Cayó en el intento número uno. Es la contraseña más usada del planeta.',
  e1AciertoDato: 'Ésta no estaba en la lista. La sacó de su perfil: la mascota se llama Luna, y el año está ahí mismo.',
  e1AciertoDisfraz1: 'Mira bien ésta. Tiene mayúscula, número y símbolo — y aun así cayó.',
  e1AciertoDisfraz2: 'El programa le quitó el disfraz. Sin la arroba y sin el cero, dice password.',
  e1Fallo: 'Vuelve a leer el informe. La máquina dice exactamente en qué paso cayó — no hay límite de intentos.',
  e2Intro: 'Ahora te toca a ti, y no vas a escribir nada. Vas a sacar cuatro palabras de una bolsa.',
  e2Acierto: 'Mira el informe: no está en la lista, no es un dato tuyo, no es un disfraz. Y a lo bruto habría que probar miles de millones de combinaciones.',
  e3Intro: 'Tienes tres cuentas abiertas en tres pestañas. Ponle llave a cada una.',
  e3Acierto: 'Las tres cuentas tienen llave, y ninguna cae en la máquina.',
  e4Intro: 'Noticia de hoy: el sitio de videos perdió su lista de contraseñas.',
  e4ReveloReutilizada: 'Mira lo que acaba de pasar con las otras dos cuentas: la misma llave abría las tres.',
  e4ReveloSolo: 'Aquí nadie adivinó nada: ya tienen tu llave escrita, porque la perdió la página. Eso no es culpa tuya.',
  e4Pide: 'Ahora cámbiala donde haga falta. Donde haga falta quiere decir en todas las que compartían esa llave.',
  e4Cierre: 'Arreglado. Ninguna cuenta se quedó con la llave que se filtró.',
  e5Intro: 'Falta la segunda llave, y va en la cuenta que más te importa: la de la escuela.',
  e5Pregunta: 'La pregunta secreta no vale: el nombre de la mascota está en el perfil, a la vista de cualquiera.',
  e5Acierto: 'Con los dos pasos puestos, saber la contraseña ya no alcanza para entrar.',
  e6Intro: 'Se abrió una ventana que dice ser el soporte de NivelMax, y te pide el código.',
  e6Detalle: 'El código es para escribirlo tú, en la página donde tú acabas de entrar. Nadie que sea de verdad te lo pide.',
  e6Detalle2: 'Y hay algo más: si te llegó un código que tú no pediste, alguien ya tiene tu contraseña.',
  e6DioCodigo: 'Le diste el código, y le pasa a muchísima gente adulta. No te quedes ahí: cambia la llave del juego.',
  e6CerroIncompleto: 'Cerrar la ventana estuvo bien. Falta la otra mitad: cambiar esa llave hoy.',
  e6Cierre: 'Arreglado. Eso es lo importante: esto se arregla, no se aguanta.',
  e7Intro: 'Última pregunta: tres frases largas no caben en la cabeza, y eso no es un defecto tuyo.',
  e7Fallo: 'Revisa otra vez las cuatro: dos van, y dos no.',
  e7Acierto: 'En un gestor, o en un cuaderno que se queda en casa. Un papel pegado a la pantalla es dejar la llave puesta en la puerta.',
  cierre: 'Tres llaves distintas, la más importante con dos pasos, y la filtrada ya cambiada. Eso es una cuenta bien cuidada.',
};

function etiquetaPaso(paso: PasoAtaque | null): string {
  switch (paso) {
    case 'lista':
      return 'la lista de las más usadas';
    case 'dato':
      return 'un dato de su perfil';
    case 'disfraz':
      return 'un disfraz de una palabra común';
    default:
      return 'a lo bruto (y no cayó)';
  }
}

function describirIntento(i: Intento): string {
  if (!i.cae) return `No cayó · a lo bruto habría que probar demasiadas combinaciones.`;
  return `Cayó por: ${etiquetaPaso(i.paso)} · intento nº ${i.intento}`;
}

interface ContenidoDinamico {
  resultadosE1: Record<string, Intento | null>;
  fraseE2: string[] | null;
  llaves: Record<CuentaId, string | null>;
  fase: Fase;
  intrusionRevelada: boolean;
  cuentasComprometidas: Set<CuentaId>;
  dosFactor: { activo: boolean; tipo: 'app' | 'sms' | null };
  factorElegido: 'app' | 'sms' | 'pregunta' | null;
  intrusionJuego: boolean;
  sesionesJuegoCerradas: boolean;
  dioCodigoE6: boolean;
}

function construirMapa(c: ContenidoDinamico): MapaSitios {
  const gestionDesbloqueada = c.fase === 'e4' ? c.intrusionRevelada : c.fase !== 'e1' && c.fase !== 'e2' && c.fase !== 'e3';

  const paginaMaquina: PaginaWeb = {
    url: URL_MAQUINA,
    pestana: 'Máquina',
    titulo: 'La máquina de adivinar',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: PERSONAJES_E1.map((p) => ({
        etiqueta: p.nombre,
        valor: c.resultadosE1[p.id] ? describirIntento(c.resultadosE1[p.id]!) : 'Sin probar todavía.',
      })),
      acciones: PERSONAJES_E1.map((p) => ({
        id: `probar-${p.id}`,
        etiqueta: `Probar a ${p.nombre}`,
        hecha: Boolean(c.resultadosE1[p.id]),
      })),
    },
  };

  const paginaFrases: PaginaWeb = {
    url: URL_FRASES,
    pestana: 'Bolsa de palabras',
    titulo: 'La bolsa de palabras',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Tu frase', valor: c.fraseE2 ? c.fraseE2.join(' ') : 'Todavía no sacaste ninguna.' },
        ...(c.fraseE2
          ? [
              {
                etiqueta: 'Informe de la máquina',
                valor: `No cayó · no está en la lista, no es un dato tuyo, no es un disfraz. A lo bruto: ${combinacionesDeFrase(
                  BOLSA_PALABRAS.length,
                  c.fraseE2.length,
                ).toLocaleString('es-MX')} combinaciones.`,
              },
            ]
          : []),
      ],
      acciones: [{ id: 'sacar-palabras', etiqueta: 'Sacar cuatro palabras', hecha: Boolean(c.fraseE2) }],
    },
  };

  const paginaJuego: PaginaWeb = {
    url: URL_JUEGO,
    pestana: 'NivelMax',
    titulo: 'NivelMax — mi cuenta',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Cuenta', valor: 'Dani' },
        { etiqueta: 'Llave', valor: c.llaves.juego ?? 'Sin llave todavía' },
        ...(c.intrusionJuego ? [{ etiqueta: 'Sesiones abiertas', valor: 'Un dispositivo que no reconoces sigue conectado.' }] : []),
      ],
      acciones: [
        ...(gestionDesbloqueada ? [{ id: 'cambiar-llave-juego', etiqueta: 'Cambiar la llave' }] : []),
        ...(c.intrusionJuego ? [{ id: 'cerrar-sesiones-juego', etiqueta: 'Cerrar sesiones', hecha: c.sesionesJuegoCerradas }] : []),
      ],
    },
    senales:
      c.cuentasComprometidas.has('juego') || c.intrusionJuego
        ? [{ id: 'alerta-juego', tono: 'alerta', texto: 'Alguien más entró a esta cuenta.', explica: 'Cambia la llave y cierra las sesiones que no reconozcas.' }]
        : undefined,
  };

  const paginaEscuela: PaginaWeb = {
    url: URL_ESCUELA,
    pestana: 'Aula Tecnia',
    titulo: 'Aula Tecnia — mi cuenta',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Cuenta', valor: 'Dani' },
        { etiqueta: 'Llave', valor: c.llaves.escuela ?? 'Sin llave todavía' },
        {
          etiqueta: 'Verificación en dos pasos',
          valor: c.dosFactor.activo ? `Activada (${c.dosFactor.tipo === 'app' ? 'app de códigos' : 'código por teléfono'})` : 'Desactivada',
        },
      ],
      acciones: [
        ...(gestionDesbloqueada ? [{ id: 'cambiar-llave-escuela', etiqueta: 'Cambiar la llave' }] : []),
        // El bloque de activación se queda en pantalla incluso después de la
        // fase 'e5' (una vez activada, y en las fases siguientes): el pliego
        // pide que «Activar verificación en dos pasos» sea un botón que SIGUE
        // en pantalla tras la acción, para poder probar de verdad su guarda
        // (pulsarlo otra vez no debe avanzar el encargo una segunda vez).
        ...(c.fase !== 'e1' && c.fase !== 'e2' && c.fase !== 'e3' && c.fase !== 'e4'
          ? [
              { id: 'factor-app', etiqueta: 'Elegir: app de códigos en el teléfono de tu adulto', hecha: c.factorElegido === 'app' },
              { id: 'factor-sms', etiqueta: 'Elegir: código al teléfono de tu adulto', hecha: c.factorElegido === 'sms' },
              { id: 'factor-pregunta', etiqueta: 'Elegir: la pregunta secreta — ¿cómo se llama tu mascota?', hecha: c.factorElegido === 'pregunta' },
              {
                id: 'activar-2-pasos',
                etiqueta: 'Activar verificación en dos pasos',
                hecha: c.dosFactor.activo,
                deshabilitada: c.factorElegido === null || c.factorElegido === 'pregunta',
              },
            ]
          : []),
      ],
    },
  };

  const paginaVideos: PaginaWeb = {
    url: URL_VIDEOS,
    pestana: 'ClipZone',
    titulo: 'ClipZone — mi cuenta',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Cuenta', valor: 'Dani' },
        { etiqueta: 'Llave', valor: c.llaves.videos ?? 'Sin llave todavía' },
      ],
      acciones: gestionDesbloqueada ? [{ id: 'cambiar-llave-videos', etiqueta: 'Cambiar la llave' }] : [],
    },
    senales: c.cuentasComprometidas.has('videos')
      ? [{ id: 'alerta-videos', tono: 'alerta', texto: 'Esta página perdió su lista de contraseñas.', explica: 'No fue nada que hicieras tú: cambia la llave para cerrar esa puerta.' }]
      : undefined,
    enlaces: c.fase === 'e4' ? [{ etiqueta: 'Ver la noticia', url: URL_NOTICIA }] : undefined,
  };

  const paginaNoticia: PaginaWeb = {
    url: URL_NOTICIA,
    pestana: 'Noticia',
    titulo: 'ClipZone perdió su lista de contraseñas',
    autor: 'Redacción ClipZone',
    fecha: 'Edición de hoy',
    cuerpo: {
      tipo: 'articulo',
      parrafos: [
        'ClipZone confirmó que alguien copió la lista completa de contraseñas de sus cuentas.',
        'La empresa recomienda cambiar la contraseña de esta cuenta — y de cualquier otra cuenta que usara la misma llave.',
      ],
    },
    enlaces: [{ etiqueta: 'Volver a mi cuenta', url: URL_VIDEOS }],
  };

  const paginaEmergente: PaginaWeb = {
    url: URL_EMERGENTE,
    pestana: 'Soporte NivelMax',
    titulo: 'Soporte de NivelMax',
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'ficha',
      datos: [{ etiqueta: 'Mensaje', valor: 'Detectamos un acceso raro a tu cuenta. Escribe aquí el código que te acabamos de enviar.' }],
      acciones: [{ id: 'dar-codigo', etiqueta: 'Escribir el código', hecha: c.dioCodigoE6 }],
    },
  };

  return {
    [URL_MAQUINA]: paginaMaquina,
    [URL_FRASES]: paginaFrases,
    [URL_JUEGO]: paginaJuego,
    [URL_ESCUELA]: paginaEscuela,
    [URL_VIDEOS]: paginaVideos,
    [URL_NOTICIA]: paginaNoticia,
    [URL_EMERGENTE]: paginaEmergente,
  };
}

export function LabContrasenasFuertes(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});

  const [mostrarPortada, setMostrarPortada] = useState(true);
  const [fase, setFase] = useState<Fase>('e1');
  const [historial, setHistorial] = useState<string[]>([LINEAS.inicio1, LINEAS.inicio2, LINEAS.e1Intro]);

  const [resultadosE1, setResultadosE1] = useState<Record<string, Intento | null>>({});
  const [acertadosE1, setAcertadosE1] = useState<Record<string, boolean>>({});

  const [fraseE2, setFraseE2] = useState<string[] | null>(null);

  const [llaves, setLlaves] = useState<Record<CuentaId, string | null>>({ juego: null, escuela: null, videos: null });
  const [intrusionRevelada, setIntrusionRevelada] = useState(false);
  const [cuentasComprometidas, setCuentasComprometidas] = useState<Set<CuentaId>>(new Set());

  const [factorElegido, setFactorElegido] = useState<'app' | 'sms' | 'pregunta' | null>(null);
  const [dosFactor, setDosFactor] = useState<{ activo: boolean; tipo: 'app' | 'sms' | null }>({ activo: false, tipo: null });

  const [emergenteId, setEmergenteId] = useState<string | null>(null);
  const [dioCodigoE6, setDioCodigoE6] = useState(false);
  const [intrusionJuego, setIntrusionJuego] = useState(false);
  const [sesionesJuegoCerradas, setSesionesJuegoCerradas] = useState(false);

  const [respuestasE7, setRespuestasE7] = useState<Record<string, 'si' | 'no' | null>>({
    gestor: null,
    cuaderno: null,
    'papel-pegado': null,
    'misma-siempre': null,
  });

  const mapa = construirMapa({
    resultadosE1,
    fraseE2,
    llaves,
    fase,
    intrusionRevelada,
    cuentasComprometidas,
    dosFactor,
    factorElegido,
    intrusionJuego,
    sesionesJuegoCerradas,
    dioCodigoE6,
  });

  // t0 arranca en la máquina de adivinar: es lo primero que hace la clase. Se
  // convierte en la pestaña del juego en cuanto termina E2 (`continuarAE3`).
  const navegador = useNavegador({ mapa, inicio: URL_MAQUINA, momento: 'Hace un momento' });
  const idJuegoRef = useRef(navegador.pestanas[0].id);
  const idEscuelaRef = useRef<string | null>(null);
  const idVideosRef = useRef<string | null>(null);
  const tabsCreadasRef = useRef(false);

  const { nuevaPestana, activarPestana } = navegador;
  useEffect(() => {
    if (tabsCreadasRef.current) return;
    tabsCreadasRef.current = true;
    idEscuelaRef.current = nuevaPestana(URL_ESCUELA);
    idVideosRef.current = nuevaPestana(URL_VIDEOS);
    activarPestana(idJuegoRef.current);
  }, [nuevaPestana, activarPestana]);

  // `direccion` NO se sincroniza con un efecto ni con una `ref` leída durante
  // el render (`react-hooks/set-state-in-effect` y `react-hooks/refs` del
  // lint de la casa rechazan las dos formas). Se actualiza a mano, en cada
  // sitio que navega — el mismo estilo que ya usa el propio ejemplo del
  // armazón en `simuladores/navegador/index.ts` para `onIrAUrl`.
  const [direccion, setDireccion] = useState(navegador.paginaActual.url);

  const e1AvanzadoRef = useRef(false);
  const e2AvanzadoRef = useRef(false);
  const e3AvanzadoRef = useRef(false);
  const e4AvanzadoRef = useRef(false);
  const e4RevelacionRef = useRef(false);
  const e5AvanzadoRef = useRef(false);
  const e6AvanzadoRef = useRef(false);
  const e7AvanzadoRef = useRef(false);
  const llaveFiltradaOriginalRef = useRef<string | null>(null);
  const llaveJuegoAlEmpezarE6Ref = useRef<string | null>(null);

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  // ── E1 ────────────────────────────────────────────────────────────────
  function probarPersonaje(personajeId: string) {
    const personaje = PERSONAJES_E1.find((p) => p.id === personajeId);
    if (!personaje || resultadosE1[personajeId]) return;
    const r = intentarAdivinar(personaje.clave, personaje.perfil, DICCIONARIO_COMUN);
    setResultadosE1((prev) => ({ ...prev, [personajeId]: r }));
    if (personajeId === 'capiveloz') decir(LINEAS.e1AciertoLista);
    else if (personajeId === 'lunagamer') decir(LINEAS.e1AciertoDato);
    else if (personajeId === 'reypixel') {
      decir(LINEAS.e1AciertoDisfraz1);
      decir(LINEAS.e1AciertoDisfraz2);
    }
  }

  function elegirMotivoE1(personajeId: string, pasoElegido: PasoAtaque) {
    const resultado = resultadosE1[personajeId];
    if (!resultado || acertadosE1[personajeId]) return;
    if (pasoElegido !== resultado.paso) {
      decir(LINEAS.e1Fallo);
      return;
    }
    const nuevosAcertados = { ...acertadosE1, [personajeId]: true };
    setAcertadosE1(nuevosAcertados);
    const todos = PERSONAJES_E1.every((p) => nuevosAcertados[p.id]);
    if (todos && !e1AvanzadoRef.current) {
      e1AvanzadoRef.current = true;
      labActividad.avanzar();
      decir(LINEAS.e2Intro);
      navegador.navegar(URL_FRASES, idJuegoRef.current);
      setDireccion(URL_FRASES);
      setFase('e2');
    }
  }

  // ── E2 ────────────────────────────────────────────────────────────────
  function sacarFrase() {
    const nueva = sacarPalabras(BOLSA_PALABRAS, 4, Math.random);
    setFraseE2(nueva);
    if (!e2AvanzadoRef.current) {
      e2AvanzadoRef.current = true;
      labActividad.avanzar();
      decir(LINEAS.e2Acierto);
    }
  }

  function continuarAE3() {
    navegador.navegar(URL_JUEGO, idJuegoRef.current);
    setDireccion(URL_JUEGO);
    decir(LINEAS.e3Intro);
    setFase('e3');
  }

  // ── E3 ────────────────────────────────────────────────────────────────
  function fijarLlaves(nuevas: Record<CuentaId, string>) {
    setLlaves(nuevas);
    if (!e3AvanzadoRef.current) {
      e3AvanzadoRef.current = true;
      labActividad.avanzar();
    }
    llaveFiltradaOriginalRef.current = nuevas.videos;
    decir(LINEAS.e3Acierto);
    decir(LINEAS.e4Intro);
    // Deliberado: NO se fuerza la pestaña de ClipZone a navegar a la noticia.
    // Si lo hiciera, el título de esa pestaña pasaría de "ClipZone" a
    // "Noticia" (el título de la pestaña es el de la página actual, como en
    // un navegador real) y el alumno perdería de vista cuál pestaña es cuál
    // de las tres cuentas. La noticia queda disponible como un enlace desde
    // la cuenta de ClipZone; lo que de verdad mueve el encargo es "Seguir"
    // en el panel de Bit, no haber leído la página.
    setFase('e4');
  }

  function elegirMismaFrase() {
    const frase = sacarPalabras(BOLSA_PALABRAS, 4, Math.random).join(' ');
    fijarLlaves({ juego: frase, escuela: frase, videos: frase });
  }

  function elegirFrasesDistintas() {
    fijarLlaves({
      juego: sacarPalabras(BOLSA_PALABRAS, 4, Math.random).join(' '),
      escuela: sacarPalabras(BOLSA_PALABRAS, 4, Math.random).join(' '),
      videos: sacarPalabras(BOLSA_PALABRAS, 4, Math.random).join(' '),
    });
  }

  // ── E4 ────────────────────────────────────────────────────────────────
  function seguirE4() {
    if (e4RevelacionRef.current) return;
    e4RevelacionRef.current = true;
    setIntrusionRevelada(true);
    const otras = reutilizada(llaves.videos ?? '', [
      { id: 'juego', llave: llaves.juego ?? '' },
      { id: 'escuela', llave: llaves.escuela ?? '' },
    ]) as CuentaId[];
    setCuentasComprometidas(new Set<CuentaId>(['videos', ...otras]));
    decir(otras.length > 0 ? LINEAS.e4ReveloReutilizada : LINEAS.e4ReveloSolo);
    decir(LINEAS.e4Pide);
  }

  // ── Cambiar llave — compartido entre E4 y E6 ───────────────────────────
  function cambiarLlave(cuentaId: CuentaId) {
    const nueva = sacarPalabras(BOLSA_PALABRAS, 4, Math.random).join(' ');
    const llavesNuevas = { ...llaves, [cuentaId]: nueva };
    setLlaves(llavesNuevas);
    decir(`Cambiaste la llave de ${NOMBRE_CUENTA[cuentaId]}.`);

    if (fase === 'e4' && intrusionRevelada) {
      const filtrada = llaveFiltradaOriginalRef.current;
      const quedaAlguna =
        filtrada !== null && (llavesNuevas.juego === filtrada || llavesNuevas.escuela === filtrada || llavesNuevas.videos === filtrada);
      if (!quedaAlguna && !e4AvanzadoRef.current) {
        e4AvanzadoRef.current = true;
        labActividad.avanzar();
        decir(LINEAS.e4Cierre);
        decir(LINEAS.e5Intro);
        if (idEscuelaRef.current) {
          navegador.activarPestana(idEscuelaRef.current);
          setDireccion(URL_ESCUELA);
        }
        setFase('e5');
      }
    }

    if (fase === 'e6' && cuentaId === 'juego') {
      if (llavesNuevas.juego !== llaveJuegoAlEmpezarE6Ref.current && !e6AvanzadoRef.current) {
        e6AvanzadoRef.current = true;
        labActividad.avanzar();
        decir(LINEAS.e6Cierre);
        decir(LINEAS.e7Intro);
        setFase('e7');
      }
    }
  }

  function cerrarSesionesJuego() {
    setSesionesJuegoCerradas(true);
    decir('Cerraste las sesiones que no reconocías.');
  }

  // ── E5 ────────────────────────────────────────────────────────────────
  function elegirFactor(tipo: 'app' | 'sms' | 'pregunta') {
    setFactorElegido(tipo);
    if (tipo === 'pregunta') decir(LINEAS.e5Pregunta);
  }

  function activarDosPasos() {
    if (factorElegido === null || factorElegido === 'pregunta') return;
    if (e5AvanzadoRef.current) return;
    e5AvanzadoRef.current = true;
    setDosFactor({ activo: true, tipo: factorElegido });
    decir(LINEAS.e5Acierto);
    labActividad.avanzar();
    decir(LINEAS.e6Intro);
    decir(LINEAS.e6Detalle);
    decir(LINEAS.e6Detalle2);
    llaveJuegoAlEmpezarE6Ref.current = llaves.juego;
    const id = navegador.abrirEmergente(URL_EMERGENTE);
    setEmergenteId(id);
    setFase('e6');
  }

  // ── E6 ────────────────────────────────────────────────────────────────
  function darCodigoE6() {
    if (dioCodigoE6) return;
    setDioCodigoE6(true);
    setIntrusionJuego(true);
    decir(LINEAS.e6DioCodigo);
    if (emergenteId) {
      navegador.cerrarEmergente(emergenteId);
      setEmergenteId(null);
    }
  }

  function manejarCerrarEmergente(id: string) {
    navegador.cerrarEmergente(id);
    if (id === emergenteId) {
      setEmergenteId(null);
      if (!dioCodigoE6) decir(LINEAS.e6CerroIncompleto);
    }
  }

  function reabrirEmergenteE6() {
    const id = navegador.abrirEmergente(URL_EMERGENTE);
    setEmergenteId(id);
  }

  // ── E7 ────────────────────────────────────────────────────────────────
  function responderE7(id: string, resp: 'si' | 'no') {
    const nuevas = { ...respuestasE7, [id]: resp };
    setRespuestasE7(nuevas);
    if (Object.values(nuevas).every((v) => v !== null)) {
      const todasBien = TARJETAS_E7.every((t) => (nuevas[t.id] === 'si') === t.correcta);
      if (todasBien) {
        if (!e7AvanzadoRef.current) {
          e7AvanzadoRef.current = true;
          labActividad.avanzar();
          decir(LINEAS.e7Acierto);
          decir(LINEAS.cierre);
          setFase('cierre');
        }
      } else {
        decir(LINEAS.e7Fallo);
        setRespuestasE7({ gestor: null, cuaderno: null, 'papel-pegado': null, 'misma-siempre': null });
      }
    }
  }

  // ── Despachador de acciones de ficha (páginas Y ventana emergente) ─────
  function manejarAccionFicha(id: string) {
    if (id.startsWith('probar-')) return probarPersonaje(id.slice('probar-'.length));
    if (id === 'sacar-palabras') return sacarFrase();
    if (id === 'cambiar-llave-juego') return cambiarLlave('juego');
    if (id === 'cambiar-llave-escuela') return cambiarLlave('escuela');
    if (id === 'cambiar-llave-videos') return cambiarLlave('videos');
    if (id === 'cerrar-sesiones-juego') return cerrarSesionesJuego();
    if (id === 'factor-app') return elegirFactor('app');
    if (id === 'factor-sms') return elegirFactor('sms');
    if (id === 'factor-pregunta') return elegirFactor('pregunta');
    if (id === 'activar-2-pasos') return activarDosPasos();
    if (id === 'dar-codigo') return darCodigoE6();
  }

  function terminar() {
    labActividad.terminar(Math.round((Date.now() - labActividad.sim.current.inicio) / 1000));
  }

  if (mostrarPortada) {
    return <PortadaObjetivos onEmpezar={() => setMostrarPortada(false)} />;
  }

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Navegador" subtitulo="Contraseñas fuertes y 2 pasos">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🔐
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Una llave por puerta</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Viste el ataque por dentro y sabes por qué un símbolo al final no salva a nadie. Armaste una llave larga con
            cuatro palabras que no tienen nada que ver. Y cuando una página perdió su lista no fue culpa tuya: sólo
            tuviste que cambiar una puerta, porque las otras dos tenían su propia llave.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const codigoVisible = fase === 'e6' || fase === 'e7' || fase === 'cierre';

  return (
    <VentanaBase marca="Tecnia Navegador" subtitulo="Contraseñas fuertes y 2 pasos">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        <div>
          <VentanaNavegador
            pestanas={navegador.pestanas.map((p) => ({ id: p.id, activa: p.id === navegador.activaId, titulo: paginaDe(mapa, p.url).pestana }))}
            pagina={navegador.paginaActual}
            puedeAtras={navegador.puedeAtras}
            puedeAdelante={navegador.puedeAdelante}
            barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => navegador.navegar(direccion) }}
            onAtras={() => {
              const activa = navegador.pestanaActiva;
              if (activa.atras.length > 0) setDireccion(activa.atras[activa.atras.length - 1]);
              navegador.atras();
            }}
            onAdelante={() => {
              const activa = navegador.pestanaActiva;
              if (activa.adelante.length > 0) setDireccion(activa.adelante[0]);
              navegador.adelante();
            }}
            onRecargar={() => navegador.recargar()}
            onActivarPestana={(id) => {
              const pestana = navegador.pestanas.find((p) => p.id === id);
              if (pestana) setDireccion(pestana.url);
              navegador.activarPestana(id);
            }}
            onCerrarPestana={(id) => navegador.cerrarPestana(id)}
            onNuevaPestana={() => navegador.nuevaPestana(URL_MAQUINA)}
            onIrAUrl={(url) => {
              navegador.navegar(url);
              setDireccion(url);
            }}
            onAccionFicha={manejarAccionFicha}
            emergentes={navegador.emergentes}
            onCerrarEmergente={manejarCerrarEmergente}
          />
        </div>

        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          {codigoVisible && (
            <div className="bg-violet-500/10 border border-violet-400/40 rounded-xl p-3" data-testid="tira-telefono">
              <p className="text-xs uppercase tracking-wide text-violet-300 font-bold mb-1">Tira del teléfono</p>
              <p className="text-2xl font-mono font-extrabold text-white tracking-widest">{CODIGO_VERIFICACION}</p>
              <p className="text-xs text-slate-400 mt-1">No lo compartas: es para escribirlo tú, no para dárselo a nadie.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {historial.map((linea, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">
                {linea}
              </p>
            ))}
          </div>

          {fase === 'e1' && (
            <div className="flex flex-col gap-3">
              {PERSONAJES_E1.filter((p) => resultadosE1[p.id] && !acertadosE1[p.id]).map((p) => (
                <div key={p.id} className="flex flex-col gap-2 bg-slate-900/50 rounded-xl p-3">
                  <p className="text-sm text-slate-200">
                    ¿Por qué cayó <b>{p.nombre}</b>?
                  </p>
                  {MOTIVOS_E1.map((m) => (
                    <button
                      key={m.paso}
                      type="button"
                      onClick={() => elegirMotivoE1(p.id, m.paso)}
                      className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm text-left"
                    >
                      {m.texto}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {fase === 'e2' && fraseE2 && (
            <button type="button" onClick={continuarAE3} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}

          {fase === 'e3' && (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={elegirMismaFrase} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Usar la misma frase en las tres cuentas
              </button>
              <button type="button" onClick={elegirFrasesDistintas} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Sacar una frase distinta para cada cuenta
              </button>
            </div>
          )}

          {fase === 'e4' && !intrusionRevelada && (
            <button type="button" onClick={seguirE4} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {fase === 'e4' && intrusionRevelada && <p className="text-sm text-amber-300">Ve a las pestañas y cambia la llave donde haga falta.</p>}

          {fase === 'e5' && <p className="text-sm text-slate-300">Ve a la pestaña de Aula Tecnia y elige el segundo paso.</p>}

          {fase === 'e6' && emergenteId === null && (
            <button type="button" onClick={reabrirEmergenteE6} className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Volver a abrir la ventana
            </button>
          )}
          {fase === 'e6' && <p className="text-sm text-slate-300">Cuando termines, cambia la llave de NivelMax.</p>}

          {fase === 'e7' && (
            <div className="flex flex-col gap-3">
              {TARJETAS_E7.map((t) => (
                <div key={t.id} className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-sm text-slate-200 mb-2">{t.texto}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => responderE7(t.id, 'si')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${respuestasE7[t.id] === 'si' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'}`}
                    >
                      Sí, ahí se guarda
                    </button>
                    <button
                      type="button"
                      onClick={() => responderE7(t.id, 'no')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${respuestasE7[t.id] === 'no' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'}`}
                    >
                      No, ahí no
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fase === 'cierre' && (
            <button type="button" onClick={terminar} className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

/**
 * Sobrepantalla obligatoria antes del navegador (pliego, §«Portada de
 * objetivos»): entrar a un laboratorio sin saber el tema ni el objetivo está
 * declarado defecto de la casa. Copia la FORMA de `PortadaWeb`
 * (`n6/web/PortadaWeb.tsx`) — situación, tema, objetivo, lo que vas a hacer,
 * encargos/minutos/insignia, un botón — con Tailwind propio en vez de
 * importar el CSS de una familia de clases distinta que otro agente está
 * tocando a la vez.
 */
function PortadaObjetivos({ onEmpezar }: { onEmpezar: () => void }) {
  const boton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => boton.current?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onEmpezar();
      }
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [onEmpezar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la clase"
      data-testid="cf-portada"
    >
      <div className="max-w-xl w-full bg-[#0b1220] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <p className="text-cyan-300 text-sm font-bold uppercase tracking-wide mb-1">Ciberseguridad · Clase 1 de 3 · Tienes tres cuentas abiertas</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Contraseñas fuertes y verificación en dos pasos</h2>

        <div className="bg-slate-900/60 rounded-2xl p-4 mb-4">
          <span className="text-xs uppercase tracking-wide text-emerald-400 font-bold">Al terminar</span>
          <p className="text-slate-200 mt-1">
            Vas a saber armar una llave que un programa no adivina, y dejar que una filtración no se lleve más que una cuenta.
          </p>
        </div>

        <div className="mb-5">
          <span className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Lo que vas a hacer</span>
          <ol className="list-decimal list-inside text-slate-200 mt-2 space-y-1">
            <li>Ver cómo adivina un programa, paso por paso</li>
            <li>Sacar tu frase de cuatro palabras</li>
            <li>Ponerle llave a tus tres cuentas</li>
            <li>Aguantar una filtración y arreglarla</li>
            <li>Encender la segunda llave y no dar el código</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-300 mb-6">
          <span>
            <b className="text-white">7</b> encargos
          </span>
          <span>
            <b className="text-white">14</b> minutos
          </span>
          <span>
            <b aria-hidden="true">🔐</b> Una llave por puerta
          </span>
        </div>

        <button
          type="button"
          ref={boton}
          onClick={onEmpezar}
          data-testid="cf-empezar"
          className="w-full px-6 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold text-lg"
        >
          Abrir el navegador
        </button>
        <p className="text-center text-xs text-slate-500 mt-2">Puedes pulsar Enter para empezar.</p>
      </div>
    </div>
  );
}

export default LabContrasenasFuertes;
