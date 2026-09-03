'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente, type AccionAsistente, type ResultadoGuion } from '@/components/simuladores/asistente';
import { PortadaDiseno, type DatosPortadaDiseno } from '../diseno/PortadaDiseno';
import {
  construirPeticion,
  ENCARGOS,
  FIRMA_VACIA,
  firmaFaltante,
  GUION_CREA_CON_IA,
  OPCIONES_CUANDO,
  OPCIONES_HERRAMIENTA,
  OPCIONES_QUE_PEDISTE,
  PIEZAS_COMO,
  PIEZAS_PARA_DONDE,
  PIEZAS_QUE,
  PIEZAS_QUE_NO,
  PIEZAS_VACIAS,
  piezasFaltantes,
  TOTAL_ENCARGOS,
  type CategoriaFirma,
  type CategoriaPieza,
  type DatosGeneracion,
  type FirmaSeleccion,
  type IdTanda,
  type ImagenGenerada,
  type OpcionFirma,
  type PiezaOpcion,
  type Piezas,
} from './guionCreaConIa';
import './creaConIa.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N6 · «Diseño y multimedia», parada 3 de 3 · `n6-crea-con-ia`
 * 6.º de Primaria · 11–12 años (verificado en `src/data/curriculo.ts:623`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Sobre el armazón `simuladores/asistente` con el panel «Generador con
 * marca»: el alumno arma una petición con cuatro huecos de piezas (nada de
 * texto libre), recibe tres tandas de imágenes SIMULADAS y fijas —cero
 * azar—, descarta las que no cumplen, descubre que la misma
 * petición nunca vuelve a dar lo mismo, y firma de dónde salió la que usó.
 *
 * ── El riesgo n.º 1: que salga otro chat más ──────────────────────────────
 * El Estudio de Generación ocupa la mayor parte de la pantalla vía la clase
 * `cia-asis` (creaConIa.css invierte las proporciones del armazón: el hilo
 * se hace estrecho y el `panel` se hace ancho). El hilo de la ventana lleva,
 * de principio a fin, un saludo y tres respuestas cortas: cuatro o cinco
 * frases en total. Todo lo demás —las piezas, la bandeja, el sello, el
 * cartel— vive en el `panel`, no en burbujas.
 *
 * ── Por qué el avance sale del gesto ──────────────────────────────────────
 * Los encargos 1, 2 y 4 cierran cuando `onFinTecleo` avisa que llegó la
 * respuesta esperada; ese callback NO depende de en qué encargo cree estar
 * el componente, porque cada ficha (`pide-1`, `pide-4`, `pide-otra-vez`) sólo
 * se manda desde el paso que le corresponde — así no hay cierre de índice
 * viejo que leer. Los encargos 3, 5, 6 y 7 cierran dentro del manejador de
 * un clic del panel, calculando el conjunto nuevo ANTES de llamar a
 * `setState` (nunca `avanzar()` dentro de un actualizador).
 */

type Fase = 'portada' | 'estudio' | 'fin';
type EstadoImagen = 'ninguno' | 'descartada' | 'elegida';
type Tandas = Partial<Record<IdTanda, ImagenGenerada[]>>;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 3 de 3 · Diseño y multimedia',
  tema: 'Crea con IA: pídelo bien, míralo, y di de dónde salió',
  objetivo:
    'Sabrás armar una petición con las cuatro piezas que importan, descartar lo que la IA entrega mal, y firmar la procedencia de una imagen generada con las tres cosas que hay que decir.',
  vasAHacer: [
    'Pedir una imagen con una sola pieza y ver que no basta.',
    'Armar la petición completa: qué, cómo, para dónde y qué no.',
    'Descartar las dos que no cumplen y elegir la que sí.',
    'Pedir lo mismo otra vez y descubrir que nunca sale igual.',
    'Poner la imagen en el cartel y firmar de dónde salió.',
  ],
  encargos: TOTAL_ENCARGOS,
  minutos: 18,
  insignia: { nombre: 'Creador que cita', emoji: '🪄' },
  boton: 'Abrir el generador',
  acento: '#a78bfa',
};

const BIT = {
  inicio:
    'La feria del año que viene ya tiene fecha, y hace falta un cartel nuevo. Falta una ilustración que nadie tiene: un volcán de bicarbonato de noche. Nadie fue a fotografiar eso. Vas a pedírsela a un generador de imágenes: ojo, no la va a buscar, la va a fabricar. Empieza con lo mínimo — elige sólo qué quieres y pulsa Generar.',
  faltanPiezas: (nombres: string[]) => `Todavía te falta elegir: ${nombres.join(', ')}.`,
  encargo1Logra:
    'Salieron tres. Míralas: ninguna es la que tenías en la cabeza. No es que la máquina sea tonta — le dijiste una palabra y te contestó a una palabra.',
  encargo2Entra: 'Ahora rellena las cuatro piezas: qué, cómo, para dónde y qué no. La pieza de qué no es la más olvidada y la más útil.',
  encargo2Logra: 'Otras tres, y ahora sí se parecen a lo que pediste.',
  encargo3Entra: 'No elijas la primera bonita. Míralas de cerca, una por una: alguna trae letras mal escritas, y eso le pasa mucho a las imágenes generadas.',
  encargo3Falla: 'Esa no cumple lo que pediste. Descártala y sigue mirando.',
  encargo3Logra: 'Bien mirado. Dos fuera y una elegida, por lo que dice y no por lo bonita.',
  encargo4Entra: 'Ahora haz una prueba: pide exactamente lo mismo otra vez.',
  encargo4TandaLlego: 'Fíjate bien: salieron otras tres. Distintas.',
  encargo4Logra: 'Esto es lo importante del día: la imagen que elegiste no se puede volver a pedir. Si la pierdes, se acabó.',
  encargo5Entra: 'Ponla de fondo en el cartel. Es material, como una foto.',
  encargo5Logra: 'Ahí está el cartel de la feria del año que viene.',
  encargo6Entra:
    'Falta lo que hace que este trabajo se pueda entregar: decir de dónde salió esa ilustración. Son tres cosas: con qué herramienta, qué le pediste, y cuándo.',
  encargo6Falla: (faltan: string[]) => `No me acuerdo no vale como respuesta. Todavía falta: ${faltan.join(', ')}.`,
  encargo6Logra: 'Sellado. Ahora cualquiera que vea el cartel sabe de dónde salió el fondo.',
  encargo7Entra: 'La maestra pregunta si el dibujo lo hiciste tú. Contesta.',
  encargo7Falla: 'Si dices que lo hiciste tú, la ficha se marca vacía y el cartel no puede ir a la galería. Puedes corregirlo.',
  encargo7Logra: 'Eso es. Decir que te ayudó una IA no te quita el mérito. Esconderlo sí te lo quita.',
  cierre: 'Pediste bien, miraste antes de usar, descubriste que nunca sale igual dos veces, y firmaste de dónde salió. Así se crea con IA.',
};

const ENTRA_AL_ENCARGO: Record<number, string> = {
  1: BIT.encargo2Entra,
  2: BIT.encargo3Entra,
  3: BIT.encargo4Entra,
  4: BIT.encargo5Entra,
  5: BIT.encargo6Entra,
  6: BIT.encargo7Entra,
};

const REQUERIDAS_POR_INDICE: Partial<Record<number, CategoriaPieza[]>> = {
  0: ['que'],
  1: ['que', 'como', 'paraDonde', 'queNo'],
  3: ['que', 'como', 'paraDonde', 'queNo'],
};

const FICHA_POR_INDICE: Partial<Record<number, 'pide-1' | 'pide-4' | 'pide-otra-vez'>> = {
  0: 'pide-1',
  1: 'pide-4',
  3: 'pide-otra-vez',
};

export function LabCreaConIa(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [logrado, setLogrado] = useState(false);
  const [pedidos, setPedidos] = useState(0);

  const [piezas, setPiezas] = useState<Piezas>(PIEZAS_VACIAS);
  const [tandas, setTandas] = useState<Tandas>({});
  const [estados, setEstados] = useState<Record<string, EstadoImagen>>({});
  const [compararMostrado, setCompararMostrado] = useState(false);
  const [fondoCartelId, setFondoCartelId] = useState<string | null>(null);
  const [firma, setFirma] = useState<FirmaSeleccion>(FIRMA_VACIA);
  const [firmaHecha, setFirmaHecha] = useState(false);
  const [declaroAutoria, setDeclaroAutoria] = useState<'propia' | 'ia' | null>(null);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_ENCARGOS);

  const alFinTecleo = (r: ResultadoGuion) => {
    const datos = r.respuesta.datos as DatosGeneracion | undefined;
    if (datos) {
      setTandas((prev) => (prev[datos.tanda] ? prev : { ...prev, [datos.tanda]: datos.imagenes }));
    }
    if (r.regla?.tipo !== 'ficha') return;
    if (r.regla.ficha === 'pide-1') {
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.encargo1Logra);
    } else if (r.regla.ficha === 'pide-4') {
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.encargo2Logra);
    } else if (r.regla.ficha === 'pide-otra-vez') {
      hablar(BIT.encargo4TandaLlego);
    }
  };

  const ia = useAsistente({
    guion: GUION_CREA_CON_IA,
    saludo: 'Hola. Soy Tecnia Genera: no busco imágenes, las fabrico a partir de lo que me pidas.',
    velocidad: 14,
    paso: 5,
    onFinTecleo: alFinTecleo,
  });

  const encargo = ENCARGOS[Math.min(indice, ENCARGOS.length - 1)];

  /* ── Zona 1 · la petición ─────────────────────────────────────────────── */

  const elegirPieza = (categoria: CategoriaPieza, id: string) => {
    if (fase !== 'estudio' || logrado) return;
    if (indice !== 0 && indice !== 1 && indice !== 3) return;
    reproducirTono('select');
    setPiezas((prev) => ({ ...prev, [categoria]: id }));
  };

  const generar = () => {
    if (fase !== 'estudio' || logrado) return;
    const requeridas = REQUERIDAS_POR_INDICE[indice];
    const fichaId = FICHA_POR_INDICE[indice];
    if (!requeridas || !fichaId) return;
    const faltan = piezasFaltantes(piezas, requeridas);
    if (faltan.length > 0) {
      hablar(BIT.faltanPiezas(faltan));
      return;
    }
    const pregunta = construirPeticion(piezas);
    const resultado = ia.enviarFicha({ id: fichaId, etiqueta: pregunta, pregunta });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPedidos((n) => n + 1);
    }
  };

  /* ── Zona 2 · la bandeja (encargo 3: descartar / elegir) ─────────────────── */

  const evaluarMiraAntes = (siguiente: Record<string, EstadoImagen>) => {
    const a = siguiente['t2-a'] ?? 'ninguno';
    const b = siguiente['t2-b'] ?? 'ninguno';
    const c = siguiente['t2-c'] ?? 'ninguno';
    if (a === 'elegida' && b === 'descartada' && c === 'descartada') {
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.encargo3Logra);
    }
  };

  const alDescartar = (id: string) => {
    if (fase !== 'estudio' || indice !== 2 || logrado) return;
    const actual = estados[id] ?? 'ninguno';
    // Toggle: descartar dos veces la RECUPERA. Es la vía de salida para que
    // «descartar las tres» nunca sea un callejón sin salida.
    const nuevo: EstadoImagen = actual === 'descartada' ? 'ninguno' : 'descartada';
    const siguiente = { ...estados, [id]: nuevo };
    reproducirTono('select');
    setEstados(siguiente);
    evaluarMiraAntes(siguiente);
  };

  const alElegir = (id: string, tieneMotivo: boolean) => {
    if (fase !== 'estudio' || indice !== 2 || logrado) return;
    if (tieneMotivo) {
      reproducirTono('error');
      hablar(BIT.encargo3Falla);
    } else {
      reproducirTono('select');
    }
    const limpio: Record<string, EstadoImagen> = {};
    for (const clave of Object.keys(estados)) {
      limpio[clave] = estados[clave] === 'elegida' ? 'ninguno' : estados[clave];
    }
    const siguiente = { ...limpio, [id]: 'elegida' as EstadoImagen };
    setEstados(siguiente);
    evaluarMiraAntes(siguiente);
  };

  /* ── Zona 3 · comparar tandas (encargo 4) ─────────────────────────────── */

  const comparar = () => {
    if (fase !== 'estudio' || indice !== 3 || logrado || !tandas.tanda3) return;
    reproducirTono('select');
    setCompararMostrado(true);
    setLogrado(true);
    lab.avanzar();
    hablar(BIT.encargo4Logra);
  };

  /* ── Zona 4 · poner de fondo (encargo 5) ──────────────────────────────── */

  const ponerDeFondo = (id: string) => {
    if (fase !== 'estudio' || indice !== 4 || logrado) return;
    reproducirTono('select');
    setFondoCartelId(id);
    setLogrado(true);
    lab.avanzar();
    hablar(BIT.encargo5Logra);
  };

  /* ── Zona 5 · la firma (encargo 6) ─────────────────────────────────────── */

  const elegirFirma = (categoria: CategoriaFirma, id: string) => {
    if (fase !== 'estudio' || indice !== 5 || logrado) return;
    reproducirTono('select');
    setFirma((prev) => ({ ...prev, [categoria]: id }));
  };

  const firmar = () => {
    if (fase !== 'estudio' || indice !== 5 || logrado) return;
    const faltan = firmaFaltante(firma);
    if (faltan.length > 0) {
      reproducirTono('error');
      hablar(BIT.encargo6Falla(faltan));
      return;
    }
    reproducirTono('correct');
    setFirmaHecha(true);
    setLogrado(true);
    lab.avanzar();
    hablar(BIT.encargo6Logra);
  };

  /* ── Zona 6 · la maestra (encargo 7) ──────────────────────────────────── */

  const responderMaestra = (respuesta: 'propia' | 'ia') => {
    if (fase !== 'estudio' || indice !== 6 || logrado) return;
    setDeclaroAutoria(respuesta);
    if (respuesta === 'propia') {
      reproducirTono('error');
      hablar(BIT.encargo7Falla);
      return;
    }
    reproducirTono('correct');
    setLogrado(true);
    const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
    lab.terminar(segundos, () => hablar(BIT.cierre));
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
    setPiezas(PIEZAS_VACIAS);
    setTandas({});
    setEstados({});
    setCompararMostrado(false);
    setFondoCartelId(null);
    setFirma(FIRMA_VACIA);
    setFirmaHecha(false);
    setDeclaroAutoria(null);
    ia.reiniciar();
    lab.reiniciar(() => hablar(BIT.inicio));
  };

  /* ── Las acciones del pie de la ventana: el único gesto grande del paso ── */

  let acciones: AccionAsistente[] | undefined;
  if (fase === 'estudio') {
    if (logrado && indice < TOTAL_ENCARGOS - 1) {
      acciones = [{ id: 'siguiente', etiqueta: 'Siguiente encargo →', onClick: siguienteEncargo, principal: true }];
    } else if (indice === 0 || indice === 1) {
      acciones = [
        { id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: generar, principal: true, deshabilitada: ia.ocupado },
      ];
    } else if (indice === 3) {
      acciones = tandas.tanda3
        ? [{ id: 'comparar', etiqueta: 'Comparar con la tanda anterior', onClick: comparar, principal: true }]
        : [{ id: 'generar', etiqueta: ia.ocupado ? 'Generando…' : 'Generar', onClick: generar, principal: true, deshabilitada: ia.ocupado }];
    } else if (indice === 5) {
      acciones = [{ id: 'firmar', etiqueta: 'Firmar', onClick: firmar, principal: true }];
    } else if (indice === 6) {
      acciones = [
        { id: 'lo-hice-yo', etiqueta: 'Sí, lo hice yo', onClick: () => responderMaestra('propia') },
        { id: 'con-ia', etiqueta: 'Lo generé con una IA, y aquí está la ficha.', onClick: () => responderMaestra('ia') },
      ];
    }
  }

  const descartadas = Object.values(estados).filter((v) => v === 'descartada').length;

  return (
    <div className="cia-sala">
      <ArcadeSala
        titulo="Crea con IA (guiado y citado)"
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
                insigniaNombre: 'Creador que cita',
                insigniaEmoji: '🪄',
                titulo: '¡Tu cartel está firmado!',
                detalle:
                  'Armaste la petición con sus cuatro piezas, descartaste lo que no cumplía, descubriste que la misma petición nunca da lo mismo dos veces, y dejaste escrito de dónde salió tu ilustración.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${TOTAL_ENCARGOS}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                  { etiqueta: 'Veces que pediste', valor: `${pedidos}` },
                  { etiqueta: 'Descartadas', valor: `${descartadas}` },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="cia-lienzo">
          {fase !== 'portada' && (
            <VentanaBase marca="Tecnia Genera" subtitulo="El Estudio de Generación" claseMarco="cia-marco">
              <VentanaAsistente
                className="cia-asis"
                mensajes={ia.mensajes}
                escribiendo={ia.ocupado}
                onSaltarTecleo={ia.saltarTecleo}
                vacio="Arma tu petición en el Estudio y pulsa Generar."
                panel={
                  <Estudio
                    indice={indice}
                    encargo={encargo}
                    piezas={piezas}
                    onPieza={elegirPieza}
                    piezasBloqueadas={fase !== 'estudio' || logrado || !(indice === 0 || indice === 1 || indice === 3)}
                    tandas={tandas}
                    estados={estados}
                    onDescartar={alDescartar}
                    onElegir={alElegir}
                    miraAntesActivo={indice === 2 && !logrado}
                    ponerDeFondoActivo={indice === 4 && !logrado}
                    onPonerDeFondo={ponerDeFondo}
                    fondoCartelId={fondoCartelId}
                    compararMostrado={compararMostrado}
                    firma={firma}
                    onFirma={elegirFirma}
                    firmaBloqueada={fase !== 'estudio' || indice !== 5 || logrado}
                    firmaHecha={firmaHecha}
                    mostrarFicha={indice >= 5}
                    declaroAutoria={declaroAutoria}
                    mostrarMaestra={indice === 6}
                  />
                }
                acciones={acciones}
              />
            </VentanaBase>
          )}
          {fase === 'portada' && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
        </div>
      </ArcadeSala>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * El Estudio de Generación — el `panel` de la clase. Recibe todo por
 * parámetro; el estado entero vive en `LabCreaConIa`.
 * ══════════════════════════════════════════════════════════════════════════ */

interface EstudioProps {
  indice: number;
  encargo: { titulo: string; situacion: string };
  piezas: Piezas;
  onPieza: (categoria: CategoriaPieza, id: string) => void;
  piezasBloqueadas: boolean;
  tandas: Tandas;
  estados: Record<string, EstadoImagen>;
  onDescartar: (id: string) => void;
  onElegir: (id: string, tieneMotivo: boolean) => void;
  miraAntesActivo: boolean;
  ponerDeFondoActivo: boolean;
  onPonerDeFondo: (id: string) => void;
  fondoCartelId: string | null;
  compararMostrado: boolean;
  firma: FirmaSeleccion;
  onFirma: (categoria: CategoriaFirma, id: string) => void;
  firmaBloqueada: boolean;
  firmaHecha: boolean;
  mostrarFicha: boolean;
  declaroAutoria: 'propia' | 'ia' | null;
  mostrarMaestra: boolean;
}

function Estudio({
  indice,
  encargo,
  piezas,
  onPieza,
  piezasBloqueadas,
  tandas,
  estados,
  onDescartar,
  onElegir,
  miraAntesActivo,
  ponerDeFondoActivo,
  onPonerDeFondo,
  fondoCartelId,
  compararMostrado,
  firma,
  onFirma,
  firmaBloqueada,
  firmaHecha,
  mostrarFicha,
  declaroAutoria,
  mostrarMaestra,
}: EstudioProps) {
  const mostrarPeticion = indice <= 4;
  const mostrarBandeja = Boolean(tandas.tanda1);
  const imagenFondo = fondoCartelId ? (tandas.tanda2 ?? []).find((im) => im.id === fondoCartelId) ?? null : null;
  const repetidas =
    compararMostrado && tandas.tanda2 && tandas.tanda3
      ? tandas.tanda2.filter((a) => tandas.tanda3!.some((b) => b.id === a.id)).length
      : null;

  return (
    <div className="cia-estudio" data-testid="cia-estudio">
      <header className="cia-encargo-cabecera">
        <p className="cia-encargo-numero" data-testid="cia-encargo-numero">
          Encargo {indice + 1} de {TOTAL_ENCARGOS} · {encargo.titulo}
        </p>
        <p className="cia-encargo-situacion">{encargo.situacion}</p>
      </header>

      <div className="cia-estudio-cuerpo">
        <div className="cia-zonas">
          {mostrarPeticion && (
            <section className="cia-zona" data-testid="cia-zona-peticion">
              <p className="cia-zona-titulo">La petición</p>
              <FilaPieza etiqueta="Qué" opciones={PIEZAS_QUE} elegida={piezas.que} deshabilitada={piezasBloqueadas} onElegir={(id) => onPieza('que', id)} testId="cia-fila-que" />
              <FilaPieza etiqueta="Cómo" opciones={PIEZAS_COMO} elegida={piezas.como} deshabilitada={piezasBloqueadas} onElegir={(id) => onPieza('como', id)} testId="cia-fila-como" />
              <FilaPieza etiqueta="Para dónde" opciones={PIEZAS_PARA_DONDE} elegida={piezas.paraDonde} deshabilitada={piezasBloqueadas} onElegir={(id) => onPieza('paraDonde', id)} testId="cia-fila-para-donde" />
              <FilaPieza etiqueta="Qué no" opciones={PIEZAS_QUE_NO} elegida={piezas.queNo} deshabilitada={piezasBloqueadas} onElegir={(id) => onPieza('queNo', id)} testId="cia-fila-que-no" />
              <p className="cia-peticion-armada" data-testid="cia-peticion-armada">
                {construirPeticion(piezas) || 'Elige tus piezas…'}
              </p>
            </section>
          )}

          {mostrarBandeja && (
            <section className="cia-zona" data-testid="cia-zona-bandeja">
              <p className="cia-zona-titulo">La bandeja</p>
              {tandas.tanda1 && (
                <div className="cia-bandeja-grupo" data-testid="cia-grupo-tanda1">
                  <p className="cia-bandeja-grupo-titulo">Tanda 1</p>
                  <div className="cia-bandeja">
                    {tandas.tanda1.map((im) => (
                      <TarjetaImagen key={im.id} imagen={im} estado="ninguno" interactiva={false} mostrarPonerDeFondo={false} esFondo={false} />
                    ))}
                  </div>
                </div>
              )}
              {tandas.tanda2 && (
                <div className="cia-bandeja-grupo" data-testid="cia-grupo-tanda2">
                  <p className="cia-bandeja-grupo-titulo">Tanda 2</p>
                  <div className="cia-bandeja">
                    {tandas.tanda2.map((im) => (
                      <TarjetaImagen
                        key={im.id}
                        imagen={im}
                        estado={estados[im.id] ?? 'ninguno'}
                        interactiva={miraAntesActivo}
                        onDescartar={onDescartar}
                        onElegir={onElegir}
                        mostrarPonerDeFondo={ponerDeFondoActivo && estados[im.id] === 'elegida'}
                        onPonerDeFondo={onPonerDeFondo}
                        esFondo={fondoCartelId === im.id}
                      />
                    ))}
                  </div>
                </div>
              )}
              {tandas.tanda3 && (
                <div className="cia-bandeja-grupo" data-testid="cia-grupo-tanda3">
                  <p className="cia-bandeja-grupo-titulo">Tanda 3</p>
                  <div className="cia-bandeja">
                    {tandas.tanda3.map((im) => (
                      <TarjetaImagen key={im.id} imagen={im} estado="ninguno" interactiva={false} mostrarPonerDeFondo={false} esFondo={false} />
                    ))}
                  </div>
                  {repetidas !== null && (
                    <p className="cia-comparar-nota" data-testid="cia-comparar-nota">
                      Imágenes repetidas entre la tanda 2 y la tanda 3: <b>{repetidas}</b>
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {mostrarFicha && (
            <section className="cia-zona" data-testid="cia-zona-ficha">
              <p className="cia-zona-titulo">La ficha de procedencia</p>
              <SelectorFirma etiqueta="Herramienta" opciones={OPCIONES_HERRAMIENTA} elegida={firma.herramienta} deshabilitada={firmaBloqueada} onElegir={(id) => onFirma('herramienta', id)} testId="cia-firma-herramienta" />
              <SelectorFirma etiqueta="Qué pediste" opciones={OPCIONES_QUE_PEDISTE} elegida={firma.quePediste} deshabilitada={firmaBloqueada} onElegir={(id) => onFirma('quePediste', id)} testId="cia-firma-que-pediste" />
              <SelectorFirma etiqueta="Cuándo" opciones={OPCIONES_CUANDO} elegida={firma.cuando} deshabilitada={firmaBloqueada} onElegir={(id) => onFirma('cuando', id)} testId="cia-firma-cuando" />
            </section>
          )}

          {mostrarMaestra && (
            <section className="cia-zona cia-zona-maestra" data-testid="cia-zona-maestra">
              <p className="cia-zona-titulo">La maestra pregunta</p>
              <p className="cia-maestra-pregunta">¿Este dibujo lo hiciste tú?</p>
              {declaroAutoria === 'propia' && (
                <p className="cia-maestra-aviso" data-testid="cia-maestra-aviso">
                  Dijiste que lo hiciste tú: el cartel se marca sin fuente. Puedes corregir tu respuesta.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="cia-cartel" data-testid="cia-cartel">
          <p className="cia-cartel-titulo">Tu cartel</p>
          <div className={`cia-cartel-lienzo${imagenFondo ? ' es-con-fondo' : ''}`} data-testid="cia-cartel-lienzo">
            <p className="cia-cartel-h1">Feria de Ciencias</p>
            {imagenFondo && (
              <span className="cia-cartel-glifo" aria-hidden="true">
                {imagenFondo.glifo}
              </span>
            )}
          </div>
          {firmaHecha && declaroAutoria !== 'propia' && (
            <p className="cia-cartel-sello" data-testid="cia-cartel-sello">
              📌 Tecnia Genera · {OPCIONES_CUANDO.find((o) => o.correcta)?.etiqueta}
            </p>
          )}
          {declaroAutoria === 'propia' && (
            <p className="cia-cartel-sinfuente" data-testid="cia-cartel-sinfuente">
              ⚠ Sin fuente — no puede ir a la galería
            </p>
          )}
        </aside>
      </div>
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
  opciones: PiezaOpcion[];
  elegida: string | null;
  deshabilitada: boolean;
  onElegir: (id: string) => void;
  testId: string;
}) {
  return (
    <div className="cia-fila-pieza" data-testid={testId}>
      <p className="cia-fila-pieza-etiqueta">{etiqueta}</p>
      <div className="cia-fila-pieza-botones">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            className={`cia-pieza-boton${elegida === op.id ? ' es-elegida' : ''}`}
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
  mostrarPonerDeFondo,
  onPonerDeFondo,
  esFondo,
}: {
  imagen: ImagenGenerada;
  estado: EstadoImagen;
  interactiva: boolean;
  onDescartar?: (id: string) => void;
  onElegir?: (id: string, tieneMotivo: boolean) => void;
  mostrarPonerDeFondo: boolean;
  onPonerDeFondo?: (id: string) => void;
  esFondo: boolean;
}) {
  return (
    <div
      className={`cia-imagen${estado === 'elegida' ? ' es-elegida' : ''}${estado === 'descartada' ? ' es-descartada' : ''}`}
      data-testid="cia-imagen"
      data-imagen={imagen.id}
      data-estado={estado}
    >
      <span className="cia-imagen-glifo" aria-hidden="true">
        {imagen.glifo}
      </span>
      <p className="cia-imagen-nombre">{imagen.nombre}</p>
      {imagen.motivo && (
        <p className="cia-imagen-motivo" data-testid="cia-imagen-motivo">
          {imagen.motivo}
        </p>
      )}
      {interactiva && (
        <div className="cia-imagen-botones">
          <button type="button" className="cia-imagen-boton" onClick={() => onDescartar?.(imagen.id)} data-accion="descartar">
            {estado === 'descartada' ? 'Recuperar' : 'Descartar'}
          </button>
          <button type="button" className="cia-imagen-boton es-elegir" onClick={() => onElegir?.(imagen.id, Boolean(imagen.motivo))} data-accion="elegir">
            Elegir
          </button>
        </div>
      )}
      {mostrarPonerDeFondo && (
        <button type="button" className="cia-imagen-boton es-fondo" onClick={() => onPonerDeFondo?.(imagen.id)} data-accion="poner-de-fondo">
          Poner de fondo
        </button>
      )}
      {esFondo && (
        <span className="cia-imagen-badge" data-testid="cia-imagen-badge-fondo">
          ✓ De fondo
        </span>
      )}
    </div>
  );
}

function SelectorFirma({
  etiqueta,
  opciones,
  elegida,
  deshabilitada,
  onElegir,
  testId,
}: {
  etiqueta: string;
  opciones: OpcionFirma[];
  elegida: string | null;
  deshabilitada: boolean;
  onElegir: (id: string) => void;
  testId: string;
}) {
  return (
    <div className="cia-firma-hueco" data-testid={testId}>
      <p className="cia-firma-etiqueta">{etiqueta}</p>
      <div className="cia-firma-opciones">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            className={`cia-firma-boton${elegida === op.id ? ' es-elegida' : ''}`}
            data-opcion={op.id}
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

export default LabCreaConIa;
