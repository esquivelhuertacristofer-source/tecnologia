'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente, type AccionAsistente, type ResultadoGuion } from '@/components/simuladores/asistente';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  AUDIO_ESPECIFICO,
  AUDIO_VAGO,
  CATEGORIAS_AUDIO,
  CATEGORIAS_IMAGEN,
  CATEGORIAS_TEXTO,
  construirPeticion,
  crearPiezasVacias,
  ENCARGOS,
  ETIQUETA_VEREDICTO,
  GUION_GENERA_CON_IA,
  ITEMS_REVISION,
  IMAGEN_SEGURA_ID,
  NOMBRE_CATEGORIA_AUDIO,
  NOMBRE_CATEGORIA_IMAGEN,
  NOMBRE_CATEGORIA_TEXTO,
  OPCIONES_AUDIO,
  OPCIONES_IMAGEN,
  OPCIONES_RIESGO,
  OPCIONES_TEXTO,
  piezasFaltantes,
  PREGUNTA_AUDIO_CLONA,
  PREGUNTA_AUDIO_VAGO,
  PREGUNTA_IMAGEN_VAGO,
  PREGUNTA_TEXTO_VAGO,
  TANDA_IMAGEN_VAGO,
  TOTAL_ENCARGOS,
  type AudioGenerado,
  type CategoriaAudio,
  type CategoriaImagen,
  type CategoriaTexto,
  type DatosGeneracion,
  type EncargoGeneraConIa,
  type ImagenGenerada,
  type ItemRevision,
  type Piezas,
  type Veredicto,
} from './guionGeneraConIa';
import './salaIA.css';
import './generaConIa.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N8 · «IA II», parada 1 de 3 · `n8-genera-con-ia`
 * 2.º de secundaria · 13–14 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * El comité de la Semana de la Ciencia encarga tres piezas para el mismo
 * evento: un artículo, una imagen y un anuncio de altavoz. Diez encargos, y
 * la clase entera es una comparación repetida tres veces —texto, imagen,
 * audio— más un cierre que las junta:
 *
 *  0–1  · TEXTO. Pedir con lo mínimo produce una alucinación (*hallucination*):
 *         un dato falso dicho con total seguridad. Pedir con las piezas
 *         completas —y, sobre todo, exigiendo la fuente de cualquier
 *         cifra— produce un texto comprobable. Comprobable no es lo mismo
 *         que comprobado: eso vuelve en el encargo 10.
 *  2–4  · IMAGEN. Pedir con lo mínimo produce los defectos típicos de un
 *         generador (manos con dedos de más, piezas que no van a ningún
 *         sitio). Pedir completo no basta para elegir bien: de las tres que
 *         salen, una tiene el defecto de siempre, pero otra no tiene NINGÚN
 *         defecto y aun así hay que descartarla, porque es tan realista que
 *         se puede confundir con la foto de una persona que no existe. El
 *         criterio deja de ser «¿está bien dibujada?» y pasa a ser
 *         «¿se puede confundir con alguien real?».
 *  5–7  · AUDIO. Mismo patrón vago/específico, y una petición que NO se
 *         puede cumplir: clonar la voz de una persona real e identificable.
 *         El guion se niega con `tipo: 'aviso'` — el mismo mecanismo que usa
 *         el armazón para «dato personal, encargo que no se hace».
 *  8    · El riesgo. De las seis peticiones del día —usadas o no—, cuál
 *         habría sido la más peligrosa de publicar sin que nadie la frenara.
 *  9    · Revisar antes de publicar. El cierre: ni el texto bueno ni la
 *         imagen elegida se publican solos con que «no tengan error» — hay
 *         una decisión aparte, y la toma el alumno, no el generador.
 *
 * ── Cómo se diferencia de `n6-crea-con-ia` (guionCreaConIa.ts, N6, 6.º de
 *    primaria) ────────────────────────────────────────────────────────────
 * Aquella pide UNA sola imagen y el criterio para descartar es el defecto
 * visual. Aquí se piden TRES tipos de contenido, cada uno comparado vago
 * contra específico, y en imagen el criterio decisivo ya no es el defecto
 * —hay una candidata SIN ningún defecto que también hay que rechazar— sino
 * el riesgo de que se confunda con una persona real. El audio, además, trae
 * una petición que el generador rechaza, cosa que `n6-crea-con-ia` no
 * tiene en absoluto.
 *
 * ── Medidas heredadas de `n6-crea-con-ia`, con la misma razón ────────────
 * El avance de los encargos «automáticos» (0,1,2,3,5,6) sale de
 * `onFinTecleo`, que NO depende de en qué encargo cree estar el componente:
 * cada ficha se manda sólo desde el paso que le corresponde. Los encargos
 * de selección (4, 8, 9) calculan el conjunto nuevo ANTES de llamar a
 * `setState`, nunca dentro de un actualizador — el mismo cuidado que exige
 * el encabezado de `LabComoAprendeLaIa.tsx`.
 */

type Fase = 'portada' | 'estudio';
type EstadoImagen = 'ninguno' | 'descartada' | 'elegida';

const PORTADA: DatosPortadaIA = {
  situacion: 'El comité de la Semana de la Ciencia te encargó tres piezas para el mismo evento.',
  tema: 'Genera texto, imagen y audio',
  objetivo:
    'Vas a comparar, en las tres formas de contenido, qué sale cuando pides poco y qué sale cuando pides con precisión — y vas a decidir cuál de los tres trae más riesgo si nadie lo revisa antes de publicarlo.',
  vasAHacer: [
    'Pedir un texto, una imagen y un audio con lo mínimo, y ver qué tan flojo sale.',
    'Volver a pedir los tres con una petición completa, y comparar.',
    'Elegir, de tres imágenes sin ningún error visible, la única segura de publicar.',
    'Probar a clonar una voz real, y ver por qué el generador se niega.',
    'Decidir cuál de las tres piezas trae más riesgo si se publica sin revisar.',
    'Marcar, pieza por pieza, qué se publica directo y qué hay que revisar antes.',
  ],
  encargos: TOTAL_ENCARGOS,
  minutos: 22,
  insignia: { nombre: 'Editor con criterio', emoji: '🧭' },
  boton: 'Abrir Tecnia Multimedia',
  acento: '#fbbf24',
};

const BIT = {
  inicio:
    'El comité de la Semana de la Ciencia te encargó tres piezas para el mismo evento: un artículo para la Gaceta, una imagen para el cartel y un anuncio para el altavoz. Las tres se las vas a pedir a Tecnia Multimedia con un prompt (*la petición que le escribes*) — y las tres se pueden pedir mal. Empieza por el texto, con lo mínimo: pulsa Generar.',
  faltanPiezas: (nombres: string[]) => `Todavía te falta elegir: ${nombres.join(', ')}.`,
  textoVerificableAviso: 'Elige qué hacer con las cifras: la opción que de verdad sirve es la que pide citar la fuente, no cualquiera de las otras dos.',
  textoVagoLogra:
    'Léelo bien. Dice que casi el 80 % del agua de la Tierra es dulce y se puede beber. Es falso: el dato real es apenas 2,5 %, y la mayoría está congelada. La IA no mintió a propósito — no tiene manera de saber si acertó. Eso se llama alucinación (*hallucination*): decir algo falso con total seguridad.',
  textoEspecificoEntra: 'Ahora arma la petición completa: para quién es, qué tan largo, y qué hacer con cualquier cifra que use.',
  textoEspecificoLogra:
    'Mejor: trae una cifra Y de dónde salió. Ojo — eso no la hace verdadera todavía, sólo comprobable. Te vas a acordar de esto en el último encargo.',
  imagenVagoEntra: 'Ahora la imagen del cartel: una estudiante con un microscopio. Pide con lo mínimo.',
  imagenVagoLogra:
    'Míralas: a la del microscopio le sobra una manivela que no lleva a ningún sitio, a la estudiante le sobra un dedo, y el fondo no parece un laboratorio. Un generador de imágenes no entiende lo que dibuja: junta formas que suelen ir juntas, y a veces las junta mal.',
  imagenEspecificoEntra: 'Arma la petición completa: la escena, para dónde es, y qué no debe llevar.',
  imagenEspecificoLogra: 'Ahí están las tres. Esta vez mira con más cuidado que antes: no basta con buscar el error.',
  imagenElijeEntra: 'Descarta la que tenga un error. De las otras dos, elige la que nadie pueda confundir con una fotografía real.',
  imagenElijeLogra:
    'Ésa. No es la más bonita ni la más realista: es la única que nadie va a confundir con la fotografía de una persona que no existe.',
  audioVagoEntra: 'Falta el anuncio para el altavoz. Pide con lo mínimo.',
  audioVagoLogra: 'Léelo: dice las palabras bien, pero una por una, sin las pausas ni el tono de alguien hablando de verdad. Nadie anuncia así por un altavoz.',
  audioEspecificoEntra: 'Arma la petición completa: el tono y el ritmo que necesita un anuncio de altavoz.',
  audioEspecificoLogra: 'Ahora sí suena a un anuncio, no a una lista leída.',
  audioClonaEntra: 'Antes de dar el anuncio por bueno, prueba algo: pídele que suene como el director.',
  audioClonaAviso:
    'El generador se negó. Y está bien que se niegue: clonar la voz de una persona real e identificable —el director, un compañero, quien sea— sin su permiso no es una opción aquí, exista o no la tecnología para hacerlo. Si de verdad hiciera falta su voz, habría que pedírsela a él.',
  audioClonaResuelto: 'Sigues con la voz genérica del encargo anterior. Es la que se usa.',
  riesgoEntra:
    'Generaste seis peticiones hoy, y dos de ellas no llegaron a usarse: la imagen fotorrealista que descartaste y la voz del director que el generador rechazó. De TODO lo que pediste, ¿qué habría sido lo más peligroso si se hubiera publicado sin que nadie lo frenara?',
  riesgoLogra:
    'Eso es. Un texto mal se corrige con una búsqueda. Una imagen falsa, mirándola con cuidado, se puede desmentir. Pero una voz que suena exactamente como el director, dicha por el altavoz de toda la escuela, la oye todo el mundo antes de que nadie pueda pararla — y nadie desconfía de una voz conocida. Por eso el generador se negó antes de que llegaras a pedirlo tú.',
  revisarEntra: 'Última decisión: pieza por pieza, ¿qué se publica directo y qué hay que revisar antes?',
  cierre:
    'Pediste tres cosas vagas y salieron flojas. Las volviste a pedir con precisión y mejoraron — pero ninguna, ni la buena, se publicó sola con que «no tuviera error». Ese último paso, revisar antes de publicar, es el que no hace el generador por ti.',
};

const ENTRA_AL_ENCARGO: Record<number, string> = {
  1: BIT.textoEspecificoEntra,
  2: BIT.imagenVagoEntra,
  3: BIT.imagenEspecificoEntra,
  4: BIT.imagenElijeEntra,
  5: BIT.audioVagoEntra,
  6: BIT.audioEspecificoEntra,
  7: BIT.audioClonaEntra,
  8: BIT.riesgoEntra,
  9: BIT.revisarEntra,
};

export function LabGeneraConIa(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [logrado, setLogrado] = useState(false);
  const [pedidos, setPedidos] = useState(0);

  const [piezasTexto, setPiezasTexto] = useState<Piezas<CategoriaTexto>>(() => crearPiezasVacias(CATEGORIAS_TEXTO));
  const [piezasImagen, setPiezasImagen] = useState<Piezas<CategoriaImagen>>(() => crearPiezasVacias(CATEGORIAS_IMAGEN));
  const [piezasAudio, setPiezasAudio] = useState<Piezas<CategoriaAudio>>(() => crearPiezasVacias(CATEGORIAS_AUDIO));

  const [textos, setTextos] = useState<Partial<Record<'vago' | 'especifico', string>>>({});
  const [imagenes, setImagenes] = useState<Partial<Record<'vago' | 'especifico', ImagenGenerada[]>>>({});
  const [audios, setAudios] = useState<Partial<Record<'vago' | 'especifico', AudioGenerado>>>({});
  const [estadosImg, setEstadosImg] = useState<Record<string, EstadoImagen>>({});

  const [avisoClonVisto, setAvisoClonVisto] = useState(false);
  const [riesgoElegido, setRiesgoElegido] = useState<string | null>(null);
  const [revisiones, setRevisiones] = useState<Partial<Record<string, Veredicto>>>({});

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_ENCARGOS);

  const alFinTecleo = (r: ResultadoGuion) => {
    const datos = r.respuesta.datos as DatosGeneracion | undefined;
    if (datos) {
      if (datos.tipo === 'texto') {
        setTextos((prev) => (prev[datos.paso] ? prev : { ...prev, [datos.paso]: datos.texto }));
      } else if (datos.tipo === 'imagen') {
        setImagenes((prev) => (prev[datos.paso] ? prev : { ...prev, [datos.paso]: datos.imagenes }));
      } else if (datos.tipo === 'audio') {
        setAudios((prev) => (prev[datos.paso] ? prev : { ...prev, [datos.paso]: datos.audio }));
      }
    }
    if (r.regla?.tipo !== 'ficha') return;
    switch (r.regla.ficha) {
      case 'texto-vago':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.textoVagoLogra);
        break;
      case 'texto-especifico':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.textoEspecificoLogra);
        break;
      case 'imagen-vago':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.imagenVagoLogra);
        break;
      case 'imagen-especifico':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.imagenEspecificoLogra);
        break;
      case 'audio-vago':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.audioVagoLogra);
        break;
      case 'audio-especifico':
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.audioEspecificoLogra);
        break;
      case 'audio-clona-director':
        // No avanza: falta pulsar «usa una voz genérica» para resolver el encargo.
        setAvisoClonVisto(true);
        hablar(BIT.audioClonaAviso);
        break;
      default:
        break;
    }
  };

  const ia = useAsistente({
    guion: GUION_GENERA_CON_IA,
    saludo:
      'Hola. Soy Tecnia Multimedia. Genero texto, imagen y audio a partir de lo que me pidas: no busco nada que ya exista, lo fabrico en el momento.',
    velocidad: 14,
    paso: 5,
    onFinTecleo: alFinTecleo,
  });

  const encargo: EncargoGeneraConIa = ENCARGOS[Math.min(indice, ENCARGOS.length - 1)];

  /* ── Texto ─────────────────────────────────────────────────────────────── */

  const generarTexto = (paso: 'vago' | 'especifico') => {
    if (fase !== 'estudio' || logrado) return;
    if (paso === 'vago') {
      const resultado = ia.enviarFicha({ id: 'texto-vago', etiqueta: PREGUNTA_TEXTO_VAGO, pregunta: PREGUNTA_TEXTO_VAGO });
      if (resultado === 'enviado') {
        reproducirTono('select');
        setPedidos((n) => n + 1);
      }
      return;
    }
    const faltan = piezasFaltantes(piezasTexto, CATEGORIAS_TEXTO, NOMBRE_CATEGORIA_TEXTO);
    if (faltan.length > 0) {
      hablar(BIT.faltanPiezas(faltan));
      return;
    }
    if (piezasTexto.verificable !== 'cifra-con-fuente') {
      hablar(BIT.textoVerificableAviso);
      return;
    }
    const pregunta = construirPeticion(piezasTexto, CATEGORIAS_TEXTO, OPCIONES_TEXTO);
    const resultado = ia.enviarFicha({ id: 'texto-especifico', etiqueta: pregunta, pregunta });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPedidos((n) => n + 1);
    }
  };

  const elegirPiezaTexto = (categoria: CategoriaTexto, id: string) => {
    if (fase !== 'estudio' || logrado || indice !== 1) return;
    reproducirTono('select');
    setPiezasTexto((prev) => ({ ...prev, [categoria]: id }));
  };

  /* ── Imagen ────────────────────────────────────────────────────────────── */

  const generarImagen = (paso: 'vago' | 'especifico') => {
    if (fase !== 'estudio' || logrado) return;
    if (paso === 'vago') {
      const resultado = ia.enviarFicha({ id: 'imagen-vago', etiqueta: PREGUNTA_IMAGEN_VAGO, pregunta: PREGUNTA_IMAGEN_VAGO });
      if (resultado === 'enviado') {
        reproducirTono('select');
        setPedidos((n) => n + 1);
      }
      return;
    }
    const faltan = piezasFaltantes(piezasImagen, CATEGORIAS_IMAGEN, NOMBRE_CATEGORIA_IMAGEN);
    if (faltan.length > 0) {
      hablar(BIT.faltanPiezas(faltan));
      return;
    }
    const pregunta = construirPeticion(piezasImagen, CATEGORIAS_IMAGEN, OPCIONES_IMAGEN);
    const resultado = ia.enviarFicha({ id: 'imagen-especifico', etiqueta: pregunta, pregunta });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPedidos((n) => n + 1);
    }
  };

  const elegirPiezaImagen = (categoria: CategoriaImagen, id: string) => {
    if (fase !== 'estudio' || logrado || indice !== 3) return;
    reproducirTono('select');
    setPiezasImagen((prev) => ({ ...prev, [categoria]: id }));
  };

  const evaluarSeleccionImagen = (siguiente: Record<string, EstadoImagen>) => {
    const tanda = imagenes.especifico;
    if (!tanda) return;
    const todasCorrectas = tanda.every((im) => {
      const est = siguiente[im.id] ?? 'ninguno';
      return im.motivo ? est === 'descartada' : est === 'elegida';
    });
    if (todasCorrectas) {
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.imagenElijeLogra);
    }
  };

  const descartarImagen = (id: string) => {
    if (fase !== 'estudio' || indice !== 4 || logrado) return;
    const actual = estadosImg[id] ?? 'ninguno';
    // Toggle: descartar dos veces la RECUPERA — misma vía de salida que `n6-crea-con-ia`.
    const nuevo: EstadoImagen = actual === 'descartada' ? 'ninguno' : 'descartada';
    const siguiente = { ...estadosImg, [id]: nuevo };
    reproducirTono('select');
    setEstadosImg(siguiente);
    evaluarSeleccionImagen(siguiente);
  };

  const elegirImagen = (id: string) => {
    if (fase !== 'estudio' || indice !== 4 || logrado) return;
    const imagen = imagenes.especifico?.find((im) => im.id === id);
    if (!imagen) return;
    if (imagen.motivo) {
      reproducirTono('error');
      hablar(imagen.motivo);
    } else {
      reproducirTono('select');
    }
    const limpio: Record<string, EstadoImagen> = {};
    for (const clave of Object.keys(estadosImg)) {
      limpio[clave] = estadosImg[clave] === 'elegida' ? 'ninguno' : estadosImg[clave];
    }
    const siguiente = { ...limpio, [id]: 'elegida' as EstadoImagen };
    setEstadosImg(siguiente);
    evaluarSeleccionImagen(siguiente);
  };

  /* ── Audio ─────────────────────────────────────────────────────────────── */

  const generarAudio = (paso: 'vago' | 'especifico') => {
    if (fase !== 'estudio' || logrado) return;
    if (paso === 'vago') {
      const resultado = ia.enviarFicha({ id: 'audio-vago', etiqueta: PREGUNTA_AUDIO_VAGO, pregunta: PREGUNTA_AUDIO_VAGO });
      if (resultado === 'enviado') {
        reproducirTono('select');
        setPedidos((n) => n + 1);
      }
      return;
    }
    const faltan = piezasFaltantes(piezasAudio, CATEGORIAS_AUDIO, NOMBRE_CATEGORIA_AUDIO);
    if (faltan.length > 0) {
      hablar(BIT.faltanPiezas(faltan));
      return;
    }
    const pregunta = construirPeticion(piezasAudio, CATEGORIAS_AUDIO, OPCIONES_AUDIO);
    const resultado = ia.enviarFicha({ id: 'audio-especifico', etiqueta: pregunta, pregunta });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPedidos((n) => n + 1);
    }
  };

  const elegirPiezaAudio = (categoria: CategoriaAudio, id: string) => {
    if (fase !== 'estudio' || logrado || indice !== 6) return;
    reproducirTono('select');
    setPiezasAudio((prev) => ({ ...prev, [categoria]: id }));
  };

  const pedirClonDirector = () => {
    if (fase !== 'estudio' || indice !== 7 || logrado) return;
    const resultado = ia.enviarFicha({ id: 'audio-clona-director', etiqueta: PREGUNTA_AUDIO_CLONA, pregunta: PREGUNTA_AUDIO_CLONA });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPedidos((n) => n + 1);
    }
  };

  const resolverClonAudio = () => {
    if (fase !== 'estudio' || indice !== 7 || logrado || !avisoClonVisto) return;
    reproducirTono('select');
    setLogrado(true);
    lab.avanzar();
    hablar(BIT.audioClonaResuelto);
  };

  /* ── El riesgo (encargo 9) ─────────────────────────────────────────────── */

  const elegirRiesgo = (id: string) => {
    if (fase !== 'estudio' || indice !== 8 || logrado) return;
    setRiesgoElegido(id);
    const opcion = OPCIONES_RIESGO.find((o) => o.id === id);
    if (!opcion) return;
    if (opcion.correcta) {
      reproducirTono('select');
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.riesgoLogra);
    } else {
      reproducirTono('error');
      hablar(opcion.porque ?? 'No es ésa. Piensa en cuál se puede desmentir más despacio.');
    }
  };

  /* ── Revisar antes de publicar (encargo 10, cierra la clase) ─────────────── */

  const elegirVeredicto = (itemId: string, veredicto: Veredicto) => {
    if (fase !== 'estudio' || indice !== 9 || logrado) return;
    const item = ITEMS_REVISION.find((i) => i.id === itemId);
    if (!item) return;
    const bien = veredicto === item.correcta;
    reproducirTono(bien ? 'select' : 'error');
    const siguiente = { ...revisiones, [itemId]: veredicto };
    setRevisiones(siguiente);
    const todasCorrectas = ITEMS_REVISION.every((it) => siguiente[it.id] === it.correcta);
    if (todasCorrectas) {
      setLogrado(true);
      const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      lab.terminar(segundos, () => hablar(BIT.cierre));
    } else if (!bien) {
      hablar(item.porque);
    }
  };

  /* ── Navegación entre encargos y arranque/repetición ──────────────────── */

  const siguienteEncargo = () => {
    if (fase !== 'estudio' || !logrado || indice >= TOTAL_ENCARGOS - 1) return;
    reproducirTono('select');
    const hechos = indice + 1;
    setIndice(hechos);
    setLogrado(false);
    const linea_ = ENTRA_AL_ENCARGO[hechos];
    if (linea_) hablar(linea_);
  };

  const empezar = () => {
    setFase('estudio');
    reproducirTono('select');
    hablar(BIT.inicio);
  };

  const repetir = () => {
    reproducirTono('select');
    setIndice(0);
    setLogrado(false);
    setPedidos(0);
    setPiezasTexto(crearPiezasVacias(CATEGORIAS_TEXTO));
    setPiezasImagen(crearPiezasVacias(CATEGORIAS_IMAGEN));
    setPiezasAudio(crearPiezasVacias(CATEGORIAS_AUDIO));
    setTextos({});
    setImagenes({});
    setAudios({});
    setEstadosImg({});
    setAvisoClonVisto(false);
    setRiesgoElegido(null);
    setRevisiones({});
    ia.reiniciar();
    lab.reiniciar(() => hablar(BIT.inicio));
  };

  /* ── Las acciones del pie de la ventana ───────────────────────────────── */

  let acciones: AccionAsistente[] | undefined;
  if (fase === 'estudio') {
    if (logrado && indice < TOTAL_ENCARGOS - 1) {
      acciones = [{ id: 'siguiente', etiqueta: 'Siguiente encargo →', onClick: siguienteEncargo, principal: true }];
    } else if (indice === 0) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarTexto('vago'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 1) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarTexto('especifico'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 2) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarImagen('vago'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 3) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarImagen('especifico'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 5) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarAudio('vago'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 6) {
      acciones = [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: () => generarAudio('especifico'), principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 7) {
      acciones = avisoClonVisto
        ? [{ id: 'usa-generica', etiqueta: 'Usa una voz genérica, como antes', onClick: resolverClonAudio, principal: true }]
        : [{ id: 'pide-clon', etiqueta: 'Pide que suene como el director', onClick: pedirClonDirector, deshabilitada: ia.ocupado }];
    }
    // indice 4 (elige la segura), 8 (riesgo) y 9 (revisar antes) resuelven todo
    // dentro del panel: no hace falta ningún botón en el pie.
  }

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Genera texto, imagen y audio"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_ENCARGOS : lab.pasos}
        pasosTotal={TOTAL_ENCARGOS}
        marcadorEtiqueta="Encargo"
        marcadorValor={`${Math.min(indice + 1, TOTAL_ENCARGOS)}/${TOTAL_ENCARGOS}`}
        bit={fase === 'estudio' ? linea : null}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Editor con criterio',
                insigniaEmoji: '🧭',
                titulo: '¡Los cuatro veredictos, correctos!',
                detalle:
                  'Generaste tres tipos de contenido —texto, imagen y audio— y en los tres viste la misma distancia entre pedir poco y pedir con precisión. También viste que «sin errores» no es lo mismo que «seguro de publicar»: la imagen más realista era la más arriesgada, y la voz más pedida —la del director— fue la única que el generador se negó a dar. Publicar no fue el último paso de generar: fue una decisión aparte, y la tomaste tú.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${TOTAL_ENCARGOS}` },
                  { etiqueta: 'Peticiones enviadas', valor: `${pedidos}` },
                  { etiqueta: 'Piezas revisadas bien', valor: `${ITEMS_REVISION.length}/${ITEMS_REVISION.length}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase !== 'portada' && (
            <VentanaBase marca="Tecnia Multimedia" subtitulo="El Estudio de la Semana de la Ciencia" claseMarco="tia-marco">
              <VentanaAsistente
                className="gia-asis"
                mensajes={ia.mensajes}
                escribiendo={ia.ocupado}
                onSaltarTecleo={ia.saltarTecleo}
                vacio="Arma tu petición en el Estudio y pulsa Generar."
                panel={
                  <Estudio
                    indice={indice}
                    encargo={encargo}
                    texto={{
                      piezas: piezasTexto,
                      onPieza: elegirPiezaTexto,
                      bloqueadas: fase !== 'estudio' || logrado || indice !== 1,
                      vago: textos.vago,
                      especifico: textos.especifico,
                    }}
                    imagen={{
                      piezas: piezasImagen,
                      onPieza: elegirPiezaImagen,
                      bloqueadas: fase !== 'estudio' || logrado || indice !== 3,
                      vago: imagenes.vago,
                      especifico: imagenes.especifico,
                      estados: estadosImg,
                      interactiva: indice === 4 && !logrado,
                      onDescartar: descartarImagen,
                      onElegir: elegirImagen,
                    }}
                    audio={{
                      piezas: piezasAudio,
                      onPieza: elegirPiezaAudio,
                      bloqueadas: fase !== 'estudio' || logrado || indice !== 6,
                      vago: audios.vago,
                      especifico: audios.especifico,
                      avisoClonVisto,
                    }}
                    riesgo={{ elegido: riesgoElegido, onElegir: elegirRiesgo }}
                    revision={{ veredictos: revisiones, onElegir: elegirVeredicto, bloqueado: logrado }}
                  />
                }
                acciones={acciones}
              />
            </VentanaBase>
          )}
          {fase === 'portada' && <PortadaIA portada={PORTADA} onEmpezar={empezar} />}
        </div>
      </ArcadeSala>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * El Estudio de la Semana de la Ciencia — el `panel` de la clase.
 * ══════════════════════════════════════════════════════════════════════════ */

interface EstudioProps {
  indice: number;
  encargo: EncargoGeneraConIa;
  texto: {
    piezas: Piezas<CategoriaTexto>;
    onPieza: (categoria: CategoriaTexto, id: string) => void;
    bloqueadas: boolean;
    vago?: string;
    especifico?: string;
  };
  imagen: {
    piezas: Piezas<CategoriaImagen>;
    onPieza: (categoria: CategoriaImagen, id: string) => void;
    bloqueadas: boolean;
    vago?: ImagenGenerada[];
    especifico?: ImagenGenerada[];
    estados: Record<string, EstadoImagen>;
    interactiva: boolean;
    onDescartar: (id: string) => void;
    onElegir: (id: string) => void;
  };
  audio: {
    piezas: Piezas<CategoriaAudio>;
    onPieza: (categoria: CategoriaAudio, id: string) => void;
    bloqueadas: boolean;
    vago?: AudioGenerado;
    especifico?: AudioGenerado;
    avisoClonVisto: boolean;
  };
  riesgo: { elegido: string | null; onElegir: (id: string) => void };
  revision: { veredictos: Partial<Record<string, Veredicto>>; onElegir: (itemId: string, v: Veredicto) => void; bloqueado: boolean };
}

function Estudio({ indice, encargo, texto, imagen, audio, riesgo, revision }: EstudioProps) {
  const mostrarTexto = indice <= 1;
  const mostrarImagen = indice >= 2 && indice <= 4;
  const mostrarAudio = indice >= 5 && indice <= 7;
  const mostrarRiesgo = indice === 8;
  const mostrarRevision = indice === 9;

  return (
    <div className="gia-estudio" data-testid="gia-estudio">
      <header className="gia-encargo-cabecera">
        <p className="gia-encargo-numero" data-testid="gia-encargo-numero">
          Encargo {indice + 1} de {TOTAL_ENCARGOS} · {encargo.titulo}
        </p>
        <p className="gia-encargo-situacion">{encargo.situacion}</p>
      </header>

      {mostrarTexto && (
        <section className="gia-zona" data-testid="gia-zona-texto">
          <p className="gia-zona-titulo">El artículo de la Gaceta</p>
          <FilaPieza
            etiqueta="Para quién"
            opciones={OPCIONES_TEXTO.audiencia}
            elegida={texto.piezas.audiencia}
            deshabilitada={texto.bloqueadas}
            onElegir={(id) => texto.onPieza('audiencia', id)}
            testId="gia-fila-audiencia"
          />
          <FilaPieza
            etiqueta="Qué tan largo"
            opciones={OPCIONES_TEXTO.extension}
            elegida={texto.piezas.extension}
            deshabilitada={texto.bloqueadas}
            onElegir={(id) => texto.onPieza('extension', id)}
            testId="gia-fila-extension"
          />
          <FilaPieza
            etiqueta="Qué hacer con las cifras"
            opciones={OPCIONES_TEXTO.verificable}
            elegida={texto.piezas.verificable}
            deshabilitada={texto.bloqueadas}
            onElegir={(id) => texto.onPieza('verificable', id)}
            testId="gia-fila-verificable"
          />
          <p className="gia-peticion-armada" data-testid="gia-peticion-texto">
            {construirPeticion(texto.piezas, CATEGORIAS_TEXTO, OPCIONES_TEXTO) || 'Elige tus piezas…'}
          </p>
          {texto.vago && (
            <div className="gia-resultado-texto es-vago" data-testid="gia-resultado-texto-vago">
              <p className="gia-resultado-etiqueta">Pedido vago</p>
              <p>{texto.vago}</p>
            </div>
          )}
          {texto.especifico && (
            <div className="gia-resultado-texto es-especifico" data-testid="gia-resultado-texto-especifico">
              <p className="gia-resultado-etiqueta">Pedido con precisión</p>
              <p>{texto.especifico}</p>
            </div>
          )}
        </section>
      )}

      {mostrarImagen && (
        <section className="gia-zona" data-testid="gia-zona-imagen">
          <p className="gia-zona-titulo">La imagen del cartel</p>
          <FilaPieza
            etiqueta="La escena"
            opciones={OPCIONES_IMAGEN.escena}
            elegida={imagen.piezas.escena}
            deshabilitada={imagen.bloqueadas}
            onElegir={(id) => imagen.onPieza('escena', id)}
            testId="gia-fila-escena"
          />
          <FilaPieza
            etiqueta="Para dónde"
            opciones={OPCIONES_IMAGEN.contexto}
            elegida={imagen.piezas.contexto}
            deshabilitada={imagen.bloqueadas}
            onElegir={(id) => imagen.onPieza('contexto', id)}
            testId="gia-fila-contexto"
          />
          <FilaPieza
            etiqueta="Qué no"
            opciones={OPCIONES_IMAGEN.quenoImagen}
            elegida={imagen.piezas.quenoImagen}
            deshabilitada={imagen.bloqueadas}
            onElegir={(id) => imagen.onPieza('quenoImagen', id)}
            testId="gia-fila-quenoimagen"
          />
          <p className="gia-peticion-armada" data-testid="gia-peticion-imagen">
            {construirPeticion(imagen.piezas, CATEGORIAS_IMAGEN, OPCIONES_IMAGEN) || 'Elige tus piezas…'}
          </p>
          {imagen.vago && (
            <div className="gia-bandeja" data-testid="gia-bandeja-vago">
              {imagen.vago.map((im) => (
                <TarjetaImagen key={im.id} imagen={im} estado="ninguno" interactiva={false} mostrarMotivo />
              ))}
            </div>
          )}
          {imagen.especifico && (
            <div className="gia-bandeja" data-testid="gia-bandeja-especifico">
              {imagen.especifico.map((im) => (
                <TarjetaImagen
                  key={im.id}
                  imagen={im}
                  estado={imagen.estados[im.id] ?? 'ninguno'}
                  interactiva={imagen.interactiva}
                  onDescartar={imagen.onDescartar}
                  onElegir={imagen.onElegir}
                  mostrarMotivo={false}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {mostrarAudio && (
        <section className="gia-zona" data-testid="gia-zona-audio">
          <p className="gia-zona-titulo">El anuncio del altavoz</p>
          <FilaPieza
            etiqueta="El tono"
            opciones={OPCIONES_AUDIO.tono}
            elegida={audio.piezas.tono}
            deshabilitada={audio.bloqueadas}
            onElegir={(id) => audio.onPieza('tono', id)}
            testId="gia-fila-tono"
          />
          <FilaPieza
            etiqueta="El ritmo"
            opciones={OPCIONES_AUDIO.ritmo}
            elegida={audio.piezas.ritmo}
            deshabilitada={audio.bloqueadas}
            onElegir={(id) => audio.onPieza('ritmo', id)}
            testId="gia-fila-ritmo"
          />
          <p className="gia-peticion-armada" data-testid="gia-peticion-audio">
            {construirPeticion(audio.piezas, CATEGORIAS_AUDIO, OPCIONES_AUDIO) || 'Elige tus piezas…'}
          </p>
          {audio.vago && <TarjetaAudio audio={audio.vago} />}
          {audio.especifico && <TarjetaAudio audio={audio.especifico} />}
          {audio.avisoClonVisto && indice === 7 && (
            <p className="gia-resultado-etiqueta" data-testid="gia-clon-aviso-visto">
              El generador se negó a clonar la voz del director.
            </p>
          )}
        </section>
      )}

      {mostrarRiesgo && (
        <section className="gia-zona" data-testid="gia-zona-riesgo">
          <p className="gia-zona-titulo">De todo lo que pediste hoy</p>
          <div className="gia-opciones" data-testid="gia-opciones-riesgo">
            {OPCIONES_RIESGO.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`gia-opcion${riesgo.elegido === op.id ? (op.correcta ? ' es-correcta' : ' es-incorrecta') : ''}`}
                data-testid={`gia-riesgo-${op.id}`}
                onClick={() => riesgo.onElegir(op.id)}
              >
                {op.texto}
              </button>
            ))}
          </div>
        </section>
      )}

      {mostrarRevision && (
        <section className="gia-zona" data-testid="gia-zona-revision">
          <p className="gia-zona-titulo">Antes de publicar</p>
          <div className="gia-revision-lista">
            {ITEMS_REVISION.map((item) => (
              <ItemRevisionCard
                key={item.id}
                item={item}
                elegido={revision.veredictos[item.id]}
                onElegir={(v) => revision.onElegir(item.id, v)}
                bloqueado={revision.bloqueado}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FilaPieza({
  etiqueta,
  opciones,
  elegida,
  deshabilitada,
  onElegir,
  testId,
}: {
  etiqueta: string;
  opciones: { id: string; etiqueta: string }[];
  elegida: string | null;
  deshabilitada: boolean;
  onElegir: (id: string) => void;
  testId: string;
}) {
  return (
    <div className="gia-fila-pieza" data-testid={testId}>
      <p className="gia-fila-pieza-etiqueta">{etiqueta}</p>
      <div className="gia-fila-pieza-botones">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            className={`gia-pieza-boton${elegida === op.id ? ' es-elegida' : ''}`}
            data-pieza={op.id}
            aria-pressed={elegida === op.id}
            disabled={deshabilitada}
            onClick={() => onElegir(op.id)}
          >
            {op.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

function TarjetaImagen({
  imagen,
  estado,
  interactiva,
  onDescartar,
  onElegir,
  mostrarMotivo,
}: {
  imagen: ImagenGenerada;
  estado: EstadoImagen;
  interactiva: boolean;
  onDescartar?: (id: string) => void;
  onElegir?: (id: string) => void;
  mostrarMotivo: boolean;
}) {
  return (
    <div
      className={`gia-imagen${estado === 'elegida' ? ' es-elegida' : ''}${estado === 'descartada' ? ' es-descartada' : ''}`}
      data-testid="gia-imagen"
      data-imagen={imagen.id}
      data-estado={estado}
      data-segura={imagen.id === IMAGEN_SEGURA_ID ? 'si' : 'no'}
    >
      <span className="gia-imagen-glifo" aria-hidden="true">
        {imagen.glifo}
      </span>
      <p className="gia-imagen-nombre">{imagen.nombre}</p>
      {mostrarMotivo && imagen.motivo && (
        <p className="gia-imagen-motivo" data-testid="gia-imagen-motivo">
          {imagen.motivo}
        </p>
      )}
      {interactiva && (
        <div className="gia-imagen-botones">
          <button type="button" className="gia-imagen-boton" onClick={() => onDescartar?.(imagen.id)} data-accion="descartar">
            {estado === 'descartada' ? 'Recuperar' : 'Descartar'}
          </button>
          <button type="button" className="gia-imagen-boton es-elegir" onClick={() => onElegir?.(imagen.id)} data-accion="elegir">
            Elegir
          </button>
        </div>
      )}
    </div>
  );
}

function TarjetaAudio({ audio }: { audio: AudioGenerado }) {
  return (
    <div
      className={`gia-audio-tarjeta${audio.calidad === 'plana' ? ' es-plana' : ' es-lograda'}`}
      data-testid="gia-audio"
      data-calidad={audio.calidad}
    >
      <span className="gia-audio-onda" aria-hidden="true">
        🔊
      </span>
      <div className="gia-audio-cuerpo">
        <p className="gia-audio-transcripcion">«{audio.transcripcion}»</p>
        <p className="gia-audio-nota">{audio.nota}</p>
      </div>
    </div>
  );
}

function ItemRevisionCard({
  item,
  elegido,
  onElegir,
  bloqueado,
}: {
  item: ItemRevision;
  elegido: Veredicto | undefined;
  onElegir: (v: Veredicto) => void;
  bloqueado: boolean;
}) {
  const resuelto = elegido === item.correcta;
  const fallado = elegido !== undefined && !resuelto;
  const veredictos: Veredicto[] = ['publicar', 'revisar', 'rechazar'];

  return (
    <div className={`gia-revision-item${resuelto ? ' es-resuelto' : ''}`} data-testid={`gia-revision-${item.id}`}>
      <p className="gia-revision-descripcion">{item.descripcion}</p>
      <div className="gia-revision-botones">
        {veredictos.map((v) => (
          <button
            key={v}
            type="button"
            className={`gia-revision-boton${elegido === v ? (v === item.correcta ? ' es-elegida-bien' : ' es-elegida-mal') : ''}`}
            data-testid={`gia-revision-${item.id}-${v}`}
            disabled={resuelto || bloqueado}
            onClick={() => onElegir(v)}
          >
            {ETIQUETA_VEREDICTO[v]}
          </button>
        ))}
      </div>
      {fallado && (
        <p className="gia-revision-porque" data-testid={`gia-revision-porque-${item.id}`}>
          {item.porque}
        </p>
      )}
    </div>
  );
}

export default LabGeneraConIa;
