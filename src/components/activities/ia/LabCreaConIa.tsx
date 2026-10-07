'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  ELEMENTOS,
  ESTILOS,
  FORMATOS,
  generar,
  LienzoImagen,
  mismaPeticion,
  PETICION_VACIA,
  peticionCubre,
  piezasDe,
  queLeFalta,
  TEMAS,
  textoDePeticion,
  type Elemento,
  type Estilo,
  type Formato,
  type ImagenGenerada,
  type Peticion,
  type Requisitos,
  type Tanda,
  type Tema,
} from '@/components/simuladores/generador';
import { barajadas } from '@/lib/ordenDeOpciones';
import { PortadaDiseno, type DatosPortadaDiseno } from '../diseno/PortadaDiseno';
import './estudioImagina.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N6 · «Diseño y multimedia», parada 3 de 3 · `n6-crea-con-ia`
 * 6.º de Primaria · 11–12 años (verificado en `src/data/curriculo.ts:623`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Reescrita el 6-oct-2026 sobre `simuladores/generador` (§69.3). Antes las
 * tandas eran fijas y salían según el número de encargo; ahora la imagen sale
 * de la PETICIÓN: lo que no se pide lo decide el generador, lo prohibido a
 * veces se cuela, y la misma petición dos veces no da lo mismo.
 *
 * Nada aquí sabe de antemano qué imagen es la buena: el comité juzga con
 * `queLeFalta(imagen, ENCARGO)` y la firma se compara contra la generación
 * de la que salió la imagen del cartel. Ninguna tarjeta trae escrito su
 * defecto: se descubre mirando (la lupa).
 *
 * Cuestan 6 puntos (piso 60) sólo dos cosas: poner en el cartel una imagen
 * que no cumple y firmar con datos que no corresponden. Generar no cuesta:
 * explorar es la clase.
 */

type Fase = 'portada' | 'estudio';

export const ENCARGO: Requisitos = { tema: 'volcan', estilo: 'plastilina', formato: 'vertical', sin: ['texto', 'persona', 'marca'] };
export const FECHA_TRABAJO = '14 de septiembre de 2026';
export const HERRAMIENTA = 'Tecnia Imagina';
const HERRAMIENTAS = [HERRAMIENTA, 'Un buscador de imágenes', 'Lo dibujé yo'];
const FECHAS = [FECHA_TRABAJO, '14 de septiembre de 2025', 'No me acuerdo'];

export const ENCARGOS = [
  { titulo: 'Prueba el generador con la petición más corta que puedas', situacion: 'Una sola pieza y Generar. Mira qué decide la máquina por ti.' },
  { titulo: 'Pide lo que necesita el comité', situacion: 'Cada cosa que pide la Profe Ávila es una pieza de tu petición, también lo que NO quiere.' },
  { titulo: 'Vuelve a pedir exactamente lo mismo', situacion: 'Sin cambiar nada, genera otra vez y compara las dos tandas.' },
  { titulo: 'Pon en el cartel una imagen que cumpla el encargo', situacion: 'Abre las imágenes, míralas de cerca y elige. El comité la revisa.' },
  { titulo: 'Firma de dónde salió', situacion: 'Con qué herramienta, qué pediste y cuándo. Todo está en el historial.' },
  { titulo: 'Contesta al comité', situacion: 'Una última pregunta antes de colgar el cartel.' },
];
export const TOTAL_ENCARGOS = ENCARGOS.length;

export const PREGUNTA = {
  texto: '¿Por qué hace falta firmar una imagen generada?',
  opciones: [
    {
      texto: 'Porque la hizo una máquina y no se puede volver a pedir igual: quien la vea tiene que saber con qué se hizo, qué se pidió y cuándo.',
      correcta: true,
      porque: '',
    },
    {
      texto: 'Porque si no la firmas, el generador te cobra.',
      correcta: false,
      porque: 'Nadie te cobra. Se firma para que quien vea el cartel sepa la verdad sobre de dónde salió la imagen.',
    },
    {
      texto: 'No hace falta: la pedí yo, así que la hice yo.',
      correcta: false,
      porque: 'Tú la pediste, pero la fabricó una máquina. Decirlo no te quita el mérito; esconderlo sí.',
    },
  ],
};

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 3 de 3 · Diseño y multimedia',
  tema: 'Crea con IA: pídelo bien, míralo, y di de dónde salió',
  objetivo:
    'Sabrás armar una petición que diga todo lo que necesitas, revisar cada imagen generada contra lo que pediste antes de usarla, y firmar de dónde salió con la petición que de verdad la generó.',
  vasAHacer: [
    'Probar el generador con una sola pieza y ver qué decide él.',
    'Pedir todo lo que necesita el comité, incluido lo que NO quiere.',
    'Pedir lo mismo otra vez y comparar.',
    'Mirar de cerca y poner en el cartel una imagen que cumpla.',
    'Firmar con qué, qué pediste y cuándo.',
  ],
  encargos: TOTAL_ENCARGOS,
  minutos: 20,
  insignia: { nombre: 'Creador que cita', emoji: '🪄' },
  boton: 'Abrir Tecnia Imagina',
  acento: '#a78bfa',
};

const BIT = {
  inicio:
    'El comité de la Feria de Ciencias necesita el fondo de su cartel, y esa imagen no la tiene nadie: se la vas a pedir a Tecnia Imagina. Un generador no busca imágenes, las fabrica. Primero pruébalo con lo mínimo: una sola pieza, y pulsa Generar.',
  sinPiezas: 'Con cero piezas no hay petición. Elige al menos una.',
  e1Larga: (n: number) => `Esa petición lleva ${n} piezas. Para esta prueba deja una sola y genera otra vez.`,
  e1Logra:
    'Mira las tres de cerca. El tema es el que pediste, pero el estilo, la forma y lo que trae encima lo decidió la máquina. Lo que no pides, lo decide ella.',
  e2Entra: 'Relee el mensaje de la Profe Ávila. Cada cosa que pide es una pieza de tu petición, y lo que dice que no quiere también cuenta.',
  e2Faltan: (n: number) =>
    n === 1
      ? 'A tu petición le falta una de las cosas que pidió la Profe Ávila. Vuelve a leer su mensaje, frase por frase.'
      : `A tu petición le faltan ${n} de las cosas que pidió la Profe Ávila. Vuelve a leer su mensaje, frase por frase.`,
  e2Logra: 'Esa petición dice todo lo que pidió el comité. Pero pedirlo no garantiza que salga: mira bien las tres.',
  e3Entra: 'Una prueba: sin tocar nada, vuelve a generar exactamente lo mismo.',
  e3NoCubre: 'Ésa ya no es la petición del comité. Déjala como en el encargo anterior y genera dos veces seguidas sin tocar nada.',
  e3Distinta: 'Cambiaste algo respecto a la generación anterior. Ahora genera otra vez sin tocar nada.',
  e3Logra: 'Misma petición, tres imágenes nuevas, y ninguna se repite. La que elijas no la vas a poder pedir igual nunca más.',
  e4Entra:
    'Abre las imágenes una por una y míralas de cerca: el generador no obedece del todo. Cuando encuentres una que cumpla todo el encargo, ponla en el cartel.',
  e4Otra: 'Otra tanda. Ábrelas y míralas antes de decidir.',
  e4Rechazo: 'El comité la rechazó. Lee qué le falta y busca otra. Si ninguna te sirve, puedes generar más: eso no cuesta.',
  e4Logra: 'Aprobada por el comité. Ése es el fondo del cartel.',
  e5Entra: 'Falta lo que hace que el cartel se pueda colgar: decir de dónde salió el fondo. Con qué herramienta, qué le pediste y cuándo. Todo está en el historial.',
  e5Incompleta: (falta: string) => `Todavía no eliges ${falta}.`,
  e5Mal: (mal: string) => `El comité revisó la ficha: ${mal} no coincide con la generación de la que salió tu imagen. Búscala en el historial.`,
  e5Logra: 'Firmada. Quien vea el cartel sabe con qué se hizo el fondo, qué se pidió y cuándo.',
  e6Entra: 'Última. El comité pregunta algo, y la respuesta es lo que te llevas de hoy.',
  e6Logra: 'Eso es. Decir que te ayudó una IA no te quita el mérito. Esconderlo sí te lo quita.',
  cierre: 'Pediste todo lo que hacía falta, miraste antes de usar, viste que nunca sale igual dos veces, y firmaste de dónde salió. Así se crea con IA.',
};

const ENTRA_AL_ENCARGO: Record<number, string> = { 1: BIT.e2Entra, 2: BIT.e3Entra, 3: BIT.e4Entra, 4: BIT.e5Entra, 5: BIT.e6Entra };

/** Cuántas de las cosas del encargo no están (o no coinciden) en la petición. */
function faltantesDelEncargo(p: Peticion, r: Requisitos): number {
  return (
    (p.tema === r.tema ? 0 : 1) +
    (p.estilo === r.estilo ? 0 : 1) +
    (p.formato === r.formato ? 0 : 1) +
    r.sin.filter((e) => !p.prohibidos.includes(e)).length
  );
}

function buscarImagen(historial: Tanda[], id: string | null): { tanda: Tanda; imagen: ImagenGenerada } | null {
  if (!id) return null;
  for (const tanda of historial) {
    const imagen = tanda.imagenes.find((im) => im.id === id);
    if (imagen) return { tanda, imagen };
  }
  return null;
}

const segundosDesde = (inicio: number) => Math.max(1, Math.round((Date.now() - inicio) / 1000));

const sinId = ({ id: _id, ...resto }: ImagenGenerada) => JSON.stringify(resto);

interface Firma {
  herramienta: string | null;
  peticion: string | null;
  fecha: string | null;
}
const FIRMA_VACIA: Firma = { herramienta: null, peticion: null, fecha: null };

export function LabCreaConIa(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [logrado, setLogrado] = useState(false);
  const [peticion, setPeticion] = useState<Peticion>(PETICION_VACIA);
  const [historial, setHistorial] = useState<Tanda[]>([]);
  const [mirando, setMirando] = useState<string | null>(null);
  const [comparadas, setComparadas] = useState<[number, number] | null>(null);
  const [cartel, setCartel] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<{ id: string; faltas: string[] } | null>(null);
  const [rechazos, setRechazos] = useState(0);
  const [firma, setFirma] = useState<Firma>(FIRMA_VACIA);
  const [firmada, setFirmada] = useState(false);
  const [respuesta, setRespuesta] = useState<number | null>(null);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_ENCARGOS, { penalizacionError: 6, piso: 60 });

  const encargo = ENCARGOS[Math.min(indice, TOTAL_ENCARGOS - 1)];
  const activo = fase === 'estudio' && !lab.terminado;

  const lograr = (frase: string) => {
    reproducirTono('correct');
    setLogrado(true);
    lab.avanzar();
    hablar(frase);
  };

  /* ── La petición ──────────────────────────────────────────────────────── */

  const peticionAbierta = activo && !logrado && indice <= 3;

  const tocarTema = (t: Tema) => peticionAbierta && setPeticion((p) => ({ ...p, tema: p.tema === t ? null : t }));
  const tocarEstilo = (e: Estilo) => peticionAbierta && setPeticion((p) => ({ ...p, estilo: p.estilo === e ? null : e }));
  const tocarFormato = (f: Formato) => peticionAbierta && setPeticion((p) => ({ ...p, formato: p.formato === f ? null : f }));
  const tocarProhibido = (e: Elemento) =>
    peticionAbierta &&
    setPeticion((p) => ({ ...p, prohibidos: p.prohibidos.includes(e) ? p.prohibidos.filter((x) => x !== e) : [...p.prohibidos, e] }));

  const generarTanda = () => {
    if (!peticionAbierta) return;
    const piezas = piezasDe(peticion);
    if (piezas === 0) {
      reproducirTono('error');
      hablar(BIT.sinPiezas);
      return;
    }
    reproducirTono('select');
    const previa = historial[historial.length - 1];
    const tanda = generar(peticion, historial.length + 1);
    const nuevo = [...historial, tanda];
    setHistorial(nuevo);

    if (indice === 0) {
      if (piezas === 1) lograr(BIT.e1Logra);
      else hablar(BIT.e1Larga(piezas));
    } else if (indice === 1) {
      if (peticionCubre(peticion, ENCARGO)) lograr(BIT.e2Logra);
      else hablar(BIT.e2Faltan(faltantesDelEncargo(peticion, ENCARGO)));
    } else if (indice === 2) {
      if (!peticionCubre(peticion, ENCARGO)) hablar(BIT.e3NoCubre);
      else if (!previa || !mismaPeticion(previa.peticion, peticion)) hablar(BIT.e3Distinta);
      else {
        setComparadas([nuevo.length - 2, nuevo.length - 1]);
        lograr(BIT.e3Logra);
      }
    } else {
      hablar(BIT.e4Otra);
    }
  };

  /* ── El cartel (encargo 4) ────────────────────────────────────────────── */

  const alCartel = (id: string) => {
    if (!activo || logrado || indice !== 3) return;
    const hallada = buscarImagen(historial, id);
    if (!hallada) return;
    const faltas = queLeFalta(hallada.imagen, ENCARGO);
    if (faltas.length > 0) {
      lab.restar();
      setRechazo({ id, faltas });
      setRechazos((n) => n + 1);
      hablar(BIT.e4Rechazo);
      return;
    }
    setRechazo(null);
    setCartel(id);
    lograr(BIT.e4Logra);
  };

  /* ── La firma (encargo 5) ─────────────────────────────────────────────── */

  const origen = buscarImagen(historial, cartel);
  const peticionesDelHistorial = Array.from(new Set(historial.map((t) => t.texto || '(sin piezas)')));

  const elegirFirma = (campo: keyof Firma, valor: string) => {
    if (!activo || logrado || indice !== 4) return;
    reproducirTono('select');
    setFirma((f) => ({ ...f, [campo]: valor }));
  };

  const firmar = () => {
    if (!activo || logrado || indice !== 4 || !origen) return;
    const sinElegir = [
      !firma.herramienta && 'la herramienta',
      !firma.peticion && 'la petición',
      !firma.fecha && 'la fecha',
    ].filter(Boolean) as string[];
    if (sinElegir.length > 0) {
      reproducirTono('error');
      hablar(BIT.e5Incompleta(sinElegir.join(', ')));
      return;
    }
    const mal = [
      firma.herramienta !== HERRAMIENTA && 'la herramienta',
      firma.peticion !== origen.tanda.texto && 'la petición',
      firma.fecha !== FECHA_TRABAJO && 'la fecha',
    ].filter(Boolean) as string[];
    if (mal.length > 0) {
      lab.restar();
      hablar(BIT.e5Mal(mal.join(', ')));
      return;
    }
    setFirmada(true);
    lograr(BIT.e5Logra);
  };

  /* ── La pregunta (encargo 6) ──────────────────────────────────────────── */

  const responder = (i: number) => {
    if (!activo || indice !== 5) return;
    setRespuesta(i);
    const op = PREGUNTA.opciones[i];
    if (!op.correcta) {
      reproducirTono('error');
      hablar(op.porque);
      return;
    }
    setLogrado(true);
    lab.terminar(segundosDesde(lab.sim.current.inicio), () => hablar(BIT.cierre));
  };

  /* ── Navegación ───────────────────────────────────────────────────────── */

  const siguienteEncargo = () => {
    if (!activo || !logrado || indice >= TOTAL_ENCARGOS - 1) return;
    reproducirTono('select');
    const hechos = indice + 1;
    setIndice(hechos);
    setLogrado(false);
    const frase = ENTRA_AL_ENCARGO[hechos];
    if (frase) hablar(frase);
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
    setPeticion(PETICION_VACIA);
    setHistorial([]);
    setMirando(null);
    setComparadas(null);
    setCartel(null);
    setRechazo(null);
    setRechazos(0);
    setFirma(FIRMA_VACIA);
    setFirmada(false);
    setRespuesta(null);
    lab.reiniciar(() => hablar(BIT.inicio));
  };

  const lupa = buscarImagen(historial, mirando);
  const enCartel = buscarImagen(historial, rechazo?.id ?? cartel);

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
                  'Pediste todo lo que necesitaba el comité, miraste cada imagen antes de usarla, comprobaste que la misma petición nunca da lo mismo dos veces, y firmaste de dónde salió el fondo.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${TOTAL_ENCARGOS}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                  { etiqueta: 'Generaciones', valor: `${historial.length}` },
                  { etiqueta: 'Rechazadas por el comité', valor: `${rechazos}` },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="cia-lienzo">
          {fase === 'portada' ? (
            <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />
          ) : (
            <VentanaBase
              marca="Tecnia Imagina"
              subtitulo="Estudio de imágenes"
              claseMarco="cia-marco"
              barraEstado={<span>Lunes {FECHA_TRABAJO} · {historial.length} generaciones</span>}
            >
              <div className="cia-estudio" data-testid="cia-estudio">
                <header className="cia-cabecera">
                  <div>
                    <p className="cia-encargo-numero" data-testid="cia-encargo-numero">
                      Encargo {indice + 1} de {TOTAL_ENCARGOS} · {encargo.titulo}
                    </p>
                    <p className="cia-encargo-situacion">{encargo.situacion}</p>
                  </div>
                  {logrado && indice < TOTAL_ENCARGOS - 1 && (
                    <button type="button" className="cia-siguiente" data-testid="cia-siguiente" onClick={siguienteEncargo}>
                      Siguiente encargo →
                    </button>
                  )}
                </header>

                <div className="cia-columnas">
                  {/* ── Izquierda: el encargo y lo que el alumno hace ahora ── */}
                  <section className="cia-col cia-col-mando">
                    <blockquote className="cia-brief" data-testid="cia-brief">
                      <p className="cia-brief-de">📨 Profe Ávila · comité de la Feria de Ciencias</p>
                      <p>
                        «Necesito el fondo del cartel vertical de la Feria de Ciencias: un volcán de bicarbonato, en dibujo de plastilina. El título lo
                        pongo yo encima, así que la imagen va sin texto. No tenemos permiso de nadie para usar su cara, y es para la escuela: nada de
                        marcas.»
                      </p>
                    </blockquote>

                    {indice <= 3 && (
                      <div className="cia-peticion" data-testid="cia-peticion">
                        <p className="cia-titulo">Tu petición</p>
                        <div className="cia-caja-peticion">
                          <p className="cia-peticion-texto" data-testid="cia-peticion-texto">
                            {textoDePeticion(peticion) || 'Todavía no pides nada: toca piezas aquí abajo.'}
                          </p>
                          <button type="button" className="cia-generar" data-testid="cia-generar" onClick={generarTanda} disabled={!peticionAbierta}>
                            ✨ Generar
                          </button>
                        </div>
                        <FilaChips
                          etiqueta="Qué"
                          testId="cia-fila-tema"
                          semilla="tema"
                          opciones={(Object.keys(TEMAS) as Tema[]).map((t) => ({ valor: t, texto: TEMAS[t].etiqueta, puesto: peticion.tema === t }))}
                          onTocar={tocarTema}
                          bloqueada={!peticionAbierta}
                        />
                        <FilaChips
                          etiqueta="Cómo"
                          testId="cia-fila-estilo"
                          semilla="estilo"
                          opciones={(Object.keys(ESTILOS) as Estilo[]).map((e) => ({ valor: e, texto: ESTILOS[e].etiqueta, puesto: peticion.estilo === e }))}
                          onTocar={tocarEstilo}
                          bloqueada={!peticionAbierta}
                        />
                        <FilaChips
                          etiqueta="Para dónde"
                          testId="cia-fila-formato"
                          semilla="formato"
                          opciones={(Object.keys(FORMATOS) as Formato[]).map((f) => ({
                            valor: f,
                            texto: FORMATOS[f].etiqueta,
                            puesto: peticion.formato === f,
                          }))}
                          onTocar={tocarFormato}
                          bloqueada={!peticionAbierta}
                        />
                        <FilaChips
                          etiqueta="Qué no"
                          testId="cia-fila-sin"
                          semilla="sin"
                          opciones={(Object.keys(ELEMENTOS) as Elemento[]).map((e) => ({
                            valor: e,
                            texto: ELEMENTOS[e].prohibicion,
                            puesto: peticion.prohibidos.includes(e),
                          }))}
                          onTocar={tocarProhibido}
                          bloqueada={!peticionAbierta}
                          prohibicion
                        />
                      </div>
                    )}

                    {indice === 4 && (
                      <div className="cia-ficha" data-testid="cia-ficha">
                        <p className="cia-titulo">Ficha de procedencia del fondo</p>
                        <FilaFirma
                          etiqueta="Con qué herramienta"
                          testId="cia-firma-herramienta"
                          opciones={HERRAMIENTAS}
                          elegida={firma.herramienta}
                          onElegir={(v) => elegirFirma('herramienta', v)}
                          bloqueada={logrado}
                        />
                        <FilaFirma
                          etiqueta="Qué le pediste"
                          testId="cia-firma-peticion"
                          opciones={peticionesDelHistorial}
                          elegida={firma.peticion}
                          onElegir={(v) => elegirFirma('peticion', v)}
                          bloqueada={logrado}
                        />
                        <FilaFirma
                          etiqueta="Cuándo"
                          testId="cia-firma-fecha"
                          opciones={FECHAS}
                          elegida={firma.fecha}
                          onElegir={(v) => elegirFirma('fecha', v)}
                          bloqueada={logrado}
                        />
                        <button type="button" className="cia-generar" data-testid="cia-firmar" onClick={firmar} disabled={logrado}>
                          ✍️ Firmar
                        </button>
                      </div>
                    )}

                    {indice === 5 && (
                      <div className="cia-pregunta" data-testid="cia-pregunta">
                        <p className="cia-titulo">El comité pregunta</p>
                        <p className="cia-pregunta-texto">{PREGUNTA.texto}</p>
                        {barajadas(PREGUNTA.opciones, PREGUNTA.texto).map(([op, i]) => (
                          <button
                            key={i}
                            type="button"
                            className={`cia-respuesta${respuesta === i ? (op.correcta ? ' es-bien' : ' es-mal') : ''}`}
                            data-opcion={i}
                            aria-pressed={respuesta === i}
                            onClick={() => responder(i)}
                            disabled={lab.terminado}
                          >
                            {op.texto}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ── Centro: el historial de generaciones ── */}
                  <section className="cia-col cia-col-historial" data-testid="cia-historial">
                    <p className="cia-titulo">Historial</p>
                    {historial.length === 0 && <p className="cia-vacio">Aquí aparecen las imágenes que generes. Cada vez salen tres.</p>}
                    {historial
                      .map((tanda, posicion) => ({ tanda, posicion }))
                      .reverse()
                      .map(({ tanda, posicion }) => {
                        const comparada = comparadas?.includes(posicion) ?? false;
                        return (
                          <article
                            key={tanda.numero}
                            className={`cia-tanda${comparada ? ' es-comparada' : ''}`}
                            data-testid="cia-tanda"
                            data-numero={tanda.numero}
                          >
                            <p className="cia-tanda-cabeza">
                              <b>Generación n.º {tanda.numero}</b> · {FECHA_TRABAJO}
                            </p>
                            <p className="cia-tanda-peticion">«{tanda.texto || '(sin piezas)'}»</p>
                            <div className="cia-tanda-imagenes">
                              {tanda.imagenes.map((im, i) => (
                                <button
                                  key={im.id}
                                  type="button"
                                  className={`cia-mirar${mirando === im.id ? ' es-mirada' : ''}${cartel === im.id ? ' es-cartel' : ''}`}
                                  data-testid="cia-mirar"
                                  data-imagen={im.id}
                                  aria-label={`Mirar de cerca la imagen ${i + 1} de la generación ${tanda.numero}`}
                                  onClick={() => {
                                    reproducirTono('select');
                                    setMirando(im.id);
                                  }}
                                >
                                  <LienzoImagen imagen={im} ancho={im.formato === 'vertical' ? 84 : 132} />
                                </button>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                    {comparadas && (
                      <p className="cia-comparar-nota" data-testid="cia-comparar-nota">
                        Generaciones n.º {comparadas[0] + 1} y n.º {comparadas[1] + 1}: la misma petición, y de seis imágenes se repiten{' '}
                        <b>
                          {
                            historial[comparadas[1]].imagenes.filter((b) => historial[comparadas[0]].imagenes.some((a) => sinId(a) === sinId(b)))
                              .length
                          }
                        </b>
                        .
                      </p>
                    )}
                  </section>

                  {/* ── Derecha: la lupa y el cartel ── */}
                  <section className="cia-col cia-col-cartel">
                    <div className="cia-lupa" data-testid="cia-lupa">
                      <p className="cia-titulo">De cerca</p>
                      {lupa ? (
                        <>
                          <LienzoImagen imagen={lupa.imagen} ancho={lupa.imagen.formato === 'vertical' ? 120 : 210} />
                          <p className="cia-lupa-origen">
                            Generación n.º {lupa.tanda.numero} · «{lupa.tanda.texto || '(sin piezas)'}»
                          </p>
                          {activo && indice === 3 && !logrado && (
                            <button type="button" className="cia-al-cartel" data-testid="cia-al-cartel" onClick={() => alCartel(lupa.imagen.id)}>
                              🖼️ Poner en el cartel
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="cia-vacio">Toca una imagen del historial para verla grande.</p>
                      )}
                    </div>

                    <div className="cia-cartel" data-testid="cia-cartel">
                      <p className="cia-titulo">El cartel</p>
                      {rechazo && (
                        <ul className="cia-rechazo" aria-label="Lo que dice el comité" data-testid="cia-rechazo">
                          {rechazo.faltas.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      )}
                      <div className={`cia-cartel-hoja${rechazo ? ' es-rechazado' : ''}`}>
                        {enCartel && <LienzoImagen imagen={enCartel.imagen} ancho={138} />}
                        <p className="cia-cartel-h1">Feria de Ciencias 2027</p>
                        {rechazo && (
                          <span className="cia-sello" aria-hidden="true">
                            RECHAZADA
                          </span>
                        )}
                      </div>
                      {firmada && origen && (
                        <p className="cia-cartel-firma" data-testid="cia-cartel-firma">
                          Fondo generado con {HERRAMIENTA} el {FECHA_TRABAJO}. Petición: «{origen.tanda.texto}».
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </VentanaBase>
          )}
        </div>
      </ArcadeSala>
    </div>
  );
}

function FilaChips<T extends string>({
  etiqueta,
  testId,
  semilla,
  opciones,
  onTocar,
  bloqueada,
  prohibicion = false,
}: {
  etiqueta: string;
  testId: string;
  semilla: string;
  opciones: { valor: T; texto: string; puesto: boolean }[];
  onTocar: (v: T) => void;
  bloqueada: boolean;
  prohibicion?: boolean;
}) {
  return (
    <div className="cia-fila" data-testid={testId}>
      <p className="cia-fila-etiqueta">{etiqueta}</p>
      <div className="cia-chips">
        {barajadas(opciones, semilla).map(([op]) => (
          <button
            key={op.valor}
            type="button"
            className={`cia-chip${op.puesto ? ' es-puesto' : ''}${prohibicion ? ' es-prohibicion' : ''}`}
            data-pieza={op.valor}
            aria-pressed={op.puesto}
            disabled={bloqueada}
            onClick={() => {
              reproducirTono('select');
              onTocar(op.valor);
            }}
          >
            {prohibicion && <span aria-hidden="true">🚫 </span>}
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilaFirma({
  etiqueta,
  testId,
  opciones,
  elegida,
  onElegir,
  bloqueada,
}: {
  etiqueta: string;
  testId: string;
  opciones: string[];
  elegida: string | null;
  onElegir: (v: string) => void;
  bloqueada: boolean;
}) {
  return (
    <div className="cia-fila" data-testid={testId}>
      <p className="cia-fila-etiqueta">{etiqueta}</p>
      <div className="cia-chips es-columna">
        {barajadas(opciones, testId).map(([op]) => (
          <button
            key={op}
            type="button"
            className={`cia-chip${elegida === op ? ' es-puesto' : ''}`}
            data-valor={op}
            aria-pressed={elegida === op}
            disabled={bloqueada}
            onClick={() => onElegir(op)}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LabCreaConIa;
