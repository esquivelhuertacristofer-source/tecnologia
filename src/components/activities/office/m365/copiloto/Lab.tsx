'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../../../n1/arcade/ArcadeSala';
import { reproducirTono } from '../../../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente, type FichaPrompt } from '@/components/simuladores/asistente';
import {
  CIFRA_FALSA,
  CIFRA_REAL,
  CONCLUSION_IMPRUDENTE,
  FICHAS_BASE,
  FICHA_CONCLUIR,
  FICHA_REDACTAR,
  FICHA_RESUMIR,
  FUENTE_TEXTO,
  FUENTE_TITULO,
  GUION,
  LINEAS,
  OPCIONES_CIFRA,
  OPCIONES_CONCLUSION,
  PARRAFOS_BORRADOR,
  PUNTO_1_RESUMEN,
  PUNTO_2_PREFIJO,
  PUNTO_2_SUFIJO,
  PUNTO_3_RESUMEN,
  TOTAL_PASOS,
  type OpcionCifra,
  type OpcionConclusion,
} from './guion';
import './copiloto.css';

/**
 * `of-m365-copiloto` · «Qué hace y qué no hace un copiloto» (§58.3, grado
 * Avanzado de la sala de M365).
 *
 * Dos ventanas simuladas lado a lado: «Tecnia Documentos» (el panel
 * principal, con dos pestañas — el informe y la fuente de referencia) y
 * «Tecnia Copiloto» (el armazón `simuladores/asistente` sin tocar, en un
 * costado). El copiloto contesta con tres respuestas fijas del guion; el
 * alumno nunca escribe texto libre, sólo pulsa fichas y botones.
 *
 * ── §29 aplicado, no sólo declarado ────────────────────────────────────────
 *
 * `VentanaAsistente` no tiene ninguna prop de rostro/avatar, así que usarla
 * tal cual ya cumple «el copiloto nunca se dibuja con cara» sin trabajo
 * extra. El compositor sólo recibe `fichas`; `libre` nunca se enciende.
 *
 * ── La corrección vive en el DOCUMENTO, no en el chat ──────────────────────
 *
 * La cifra que el copiloto dijo (`CIFRA_FALSA`) es del hilo del chat y nunca
 * cambia — no se puede editar lo que ya se dijo—. Lo que el alumno corrige es
 * la copia que ÉL insertó en su informe, comparándola con la pestaña
 * `Fuente_Oficial.pdf`. Tres opciones fijas (`OPCIONES_CIFRA`), nunca un
 * input libre.
 *
 * ── Publicar sólo se habilita con las cuatro casillas ──────────────────────
 *
 * Borrador insertado + resumen insertado + cifra corregida + conclusión
 * propia elegida (nunca la sugerencia imprudente, que sólo se puede
 * RECHAZAR: pulsar «Insertar» sobre ella resta y no cambia nada). Jugar mal
 * a propósito dos veces —publicar con la cifra sin corregir, e insertar la
 * sugerencia imprudente en vez de rechazarla— nunca cierra la clase.
 */

type Pestana = 'informe' | 'fuente';

function fichaDeIa(fichas: readonly FichaPrompt[], id: string): FichaPrompt | undefined {
  return fichas.find((f) => f.id === id);
}

export function Lab(props: ActivityProps & { alSalir?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('informe');

  // Qué se le pidió al copiloto (marca la ficha como usada).
  const [envioRedactar, setEnvioRedactar] = useState(false);
  const [envioResumir, setEnvioResumir] = useState(false);
  const [envioConcluir, setEnvioConcluir] = useState(false);

  // Qué se insertó en el documento.
  const [borradorInsertado, setBorradorInsertado] = useState(false);
  const [resumenInsertado, setResumenInsertado] = useState(false);

  // La cifra: el popover de corrección y qué se eligió.
  const [cifraAbierta, setCifraAbierta] = useState(false);
  const [cifraElegida, setCifraElegida] = useState<string | null>(null);
  const cifraCorregida = cifraElegida === 'real';

  const [fuenteAbierta, setFuenteAbierta] = useState(false);

  // La conclusión: rechazo de la sugerencia imprudente y elección propia.
  const [conclusionRechazada, setConclusionRechazada] = useState(false);
  const [conclusionElegida, setConclusionElegida] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const lab = useLabActividad(props, TOTAL_PASOS);
  const ia = useAsistente({ guion: GUION, velocidad: 0 });

  const fichas: FichaPrompt[] = FICHAS_BASE.map((f) => ({
    id: f.id,
    etiqueta: f.etiqueta,
    icono: f.icono,
    usada: f.id === FICHA_REDACTAR ? envioRedactar : f.id === FICHA_RESUMIR ? envioResumir : envioConcluir,
    deshabilitada:
      f.id === FICHA_RESUMIR ? !borradorInsertado : f.id === FICHA_CONCLUIR ? !cifraCorregida : false,
  }));

  const onEnviarFicha = (id: string) => {
    const ficha = fichaDeIa(fichas, id);
    if (!ficha || ficha.usada || ficha.deshabilitada) return;
    const resultado = ia.enviarFicha({ id: ficha.id, etiqueta: ficha.etiqueta, pregunta: ficha.etiqueta });
    if (resultado !== 'enviado') return;
    reproducirTono('select');
    if (id === FICHA_REDACTAR) setEnvioRedactar(true);
    if (id === FICHA_RESUMIR) setEnvioResumir(true);
    if (id === FICHA_CONCLUIR) setEnvioConcluir(true);
  };

  /* ── El documento: insertar lo que el copiloto ya contestó ─────────────── */

  const insertarBorrador = () => {
    if (!envioRedactar || borradorInsertado || ia.ocupado) return;
    reproducirTono('correct');
    setBorradorInsertado(true);
    lab.avanzar();
    hablar(LINEAS.yaInsertaBorrador);
  };

  const insertarResumen = () => {
    if (!envioResumir || resumenInsertado || ia.ocupado) return;
    reproducirTono('correct');
    setResumenInsertado(true);
    lab.avanzar();
    hablar(LINEAS.cifraSinCorregir);
  };

  const irAPestana = (p: Pestana) => {
    setPestana(p);
    if (p === 'fuente' && !fuenteAbierta) {
      reproducirTono('select');
      setFuenteAbierta(true);
      lab.avanzar();
    }
  };

  /* ── La cifra ────────────────────────────────────────────────────────── */

  const alternarCifra = () => {
    if (!resumenInsertado || cifraCorregida) return;
    reproducirTono('select');
    setCifraAbierta((v) => !v);
  };

  const elegirCifra = (opcion: OpcionCifra) => {
    if (!resumenInsertado || cifraCorregida) return;
    if (!opcion.correcta) {
      lab.restar();
      hablar(LINEAS.cifraCorregidaMal);
      return;
    }
    reproducirTono('correct');
    setCifraElegida(opcion.id);
    setCifraAbierta(false);
    lab.avanzar();
    hablar(LINEAS.cifraCorregidaBien);
  };

  /* ── La conclusión ───────────────────────────────────────────────────── */

  const aceptarConclusionImprudente = () => {
    if (!envioConcluir || conclusionRechazada || conclusionElegida) return;
    lab.restar();
    hablar(LINEAS.conclusionAceptadaMal);
  };

  const rechazarConclusion = () => {
    if (!envioConcluir || conclusionRechazada) return;
    reproducirTono('correct');
    setConclusionRechazada(true);
    lab.avanzar();
    hablar(LINEAS.conclusionRechazada);
  };

  const elegirConclusion = (opcion: OpcionConclusion) => {
    if (!conclusionRechazada || conclusionElegida) return;
    reproducirTono('select');
    setConclusionElegida(opcion.id);
  };

  /* ── Publicar ────────────────────────────────────────────────────────── */

  const canPublicar = borradorInsertado && resumenInsertado && cifraCorregida && conclusionElegida !== null;

  const publicar = () => {
    if (!canPublicar || lab.terminado) return;
    const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
    lab.avanzar();
    lab.terminar(segundos, () => hablar(LINEAS.fin));
  };

  const repetir = () => {
    setPestana('informe');
    setEnvioRedactar(false);
    setEnvioResumir(false);
    setEnvioConcluir(false);
    setBorradorInsertado(false);
    setResumenInsertado(false);
    setCifraAbierta(false);
    setCifraElegida(null);
    setFuenteAbierta(false);
    setConclusionRechazada(false);
    setConclusionElegida(null);
    ia.reiniciar();
    lab.reiniciar(() => hablar(LINEAS.inicio));
  };

  /* ── Lo que se ve ────────────────────────────────────────────────────── */

  const conclusionTexto = conclusionElegida
    ? OPCIONES_CONCLUSION.find((o) => o.id === conclusionElegida)?.texto
    : null;

  const requisitos = [
    { id: 'borrador', ok: borradorInsertado, texto: 'Borrador insertado' },
    { id: 'resumen', ok: resumenInsertado, texto: 'Resumen insertado' },
    { id: 'cifra', ok: cifraCorregida, texto: 'Cifra corregida' },
    { id: 'conclusion', ok: conclusionElegida !== null, texto: 'Conclusión propia' },
  ];
  const completados = requisitos.filter((r) => r.ok).length;

  const barraEstado = (
    <div className="mcp-dock">
      <ul className="mcp-checklist" data-testid="mcp-checklist">
        {requisitos.map((r) => (
          <li key={r.id} className={r.ok ? 'es-lista' : ''}>
            {r.ok ? '✔' : '○'} {r.texto}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mcp-publicar"
        data-testid="mcp-publicar"
        disabled={!canPublicar}
        onClick={publicar}
      >
        🚀 Publicar Informe Auditado
      </button>
    </div>
  );

  return (
      <ArcadeSala
        titulo="Qué hace y qué no hace un copiloto"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_PASOS : lab.pasos}
        pasosTotal={TOTAL_PASOS}
        marcadorEtiqueta="Auditado"
        marcadorValor={`${lab.terminado ? requisitos.length : completados}/${requisitos.length}`}
        bit={linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Auditor de IA',
                insigniaEmoji: '🤖',
                titulo: '¡Informe auditado y publicado!',
                detalle:
                  'Le pediste al copiloto un borrador y un resumen, y no te los tragaste enteros: cazaste una cifra inventada comparándola con la fuente oficial, la corregiste en tu documento, y rechazaste una sugerencia que sonaba igual de segura que las buenas y estaba mal. La IA propuso; tú verificaste y decidiste.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                  { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
          <div className="mcp-lienzo">
            <div className="mcp-caja-ventana">
              <VentanaBase marca="Tecnia Documentos" subtitulo="Informe.docx" claseMarco="mcp-marco" barraEstado={barraEstado}>
                <div className="mcp-doc-cuerpo">
                  <div className="mcp-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pestana === 'informe'}
                      className={`mcp-tab${pestana === 'informe' ? ' es-activa' : ''}`}
                      onClick={() => irAPestana('informe')}
                    >
                      📄 Informe.docx
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pestana === 'fuente'}
                      className={`mcp-tab${pestana === 'fuente' ? ' es-activa' : ''}${fuenteAbierta ? ' es-vista' : ''}`}
                      onClick={() => irAPestana('fuente')}
                    >
                      📎 {FUENTE_TITULO}
                    </button>
                  </div>

                  <div className="mcp-toolbar" aria-hidden="true">
                    <span className="mcp-toolbar-icono">B</span>
                    <span className="mcp-toolbar-icono mcp-toolbar-icono--italic">I</span>
                    <span className="mcp-toolbar-icono mcp-toolbar-icono--underline">U</span>
                    <span className="mcp-toolbar-sep" />
                    <span className="mcp-toolbar-icono">≡</span>
                    <span className="mcp-toolbar-icono">≣</span>
                  </div>

                  <div className="mcp-doc-scroll">
                    {pestana === 'informe' ? (
                      <div data-testid="mcp-doc">
                        <h3 className="mcp-doc-titulo">Feria de Ciencias — Informe del equipo del periódico</h3>

                        <section className="mcp-seccion">
                          <p className="mcp-seccion-titulo">Introducción</p>
                          {borradorInsertado ? (
                            PARRAFOS_BORRADOR.map((p, i) => (
                              <p key={i} className="mcp-parrafo">
                                {p}
                              </p>
                            ))
                          ) : envioRedactar ? (
                            <button
                              type="button"
                              className="mcp-insertar"
                              data-testid="mcp-insertar-borrador"
                              disabled={ia.ocupado}
                              onClick={insertarBorrador}
                            >
                              📥 Insertar borrador en el documento
                            </button>
                          ) : (
                            <p className="mcp-vacio">Pide un borrador al copiloto para ver esta sección.</p>
                          )}
                        </section>

                        <section className="mcp-seccion">
                          <p className="mcp-seccion-titulo">Resumen de costos</p>
                          {resumenInsertado ? (
                            <ol className="mcp-resumen">
                              <li>{PUNTO_1_RESUMEN}</li>
                              <li>
                                {PUNTO_2_PREFIJO}
                                <span className="mcp-cifra-envoltura">
                                  <button
                                    type="button"
                                    className={`mcp-cifra${cifraCorregida ? ' es-corregida' : ' es-riesgo'}`}
                                    data-testid="mcp-cifra-chip"
                                    disabled={cifraCorregida}
                                    onClick={alternarCifra}
                                  >
                                    {cifraCorregida ? CIFRA_REAL : CIFRA_FALSA}
                                    {!cifraCorregida && (
                                      <span className="mcp-cifra-editar" aria-hidden="true">
                                        ✏️
                                      </span>
                                    )}
                                    {cifraCorregida && (
                                      <span className="mcp-cifra-check" aria-hidden="true">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                  {cifraAbierta && !cifraCorregida && (
                                    <span className="mcp-cifra-popover" data-testid="mcp-cifra-opciones">
                                      <span className="mcp-cifra-popover-titulo">¿Cuál es la cifra correcta?</span>
                                      {OPCIONES_CIFRA.map((op) => (
                                        <button
                                          key={op.id}
                                          type="button"
                                          className="mcp-cifra-op"
                                          data-testid={`mcp-cifra-op-${op.id}`}
                                          onClick={() => elegirCifra(op)}
                                        >
                                          {op.valor}
                                        </button>
                                      ))}
                                    </span>
                                  )}
                                </span>
                                {PUNTO_2_SUFIJO}
                              </li>
                              <li>{PUNTO_3_RESUMEN}</li>
                            </ol>
                          ) : envioResumir ? (
                            <button
                              type="button"
                              className="mcp-insertar"
                              data-testid="mcp-insertar-resumen"
                              disabled={ia.ocupado}
                              onClick={insertarResumen}
                            >
                              📥 Insertar resumen en el documento
                            </button>
                          ) : (
                            <p className="mcp-vacio">Pide un resumen al copiloto para ver esta sección.</p>
                          )}
                        </section>

                        <section className="mcp-seccion">
                          <p className="mcp-seccion-titulo">Conclusión</p>
                          {conclusionTexto ? (
                            <p className="mcp-parrafo mcp-parrafo--propia">{conclusionTexto}</p>
                          ) : conclusionRechazada ? (
                            <div className="mcp-opciones-conclusion" data-testid="mcp-opciones-conclusion">
                              <p className="mcp-vacio">Elige tu propia conclusión:</p>
                              {OPCIONES_CONCLUSION.map((op) => (
                                <button
                                  key={op.id}
                                  type="button"
                                  className="mcp-opcion"
                                  data-testid={`mcp-conclusion-op-${op.id}`}
                                  onClick={() => elegirConclusion(op)}
                                >
                                  {op.texto}
                                </button>
                              ))}
                            </div>
                          ) : envioConcluir ? (
                            <div className="mcp-sugerencia-riesgo" data-testid="mcp-sugerencia-riesgo">
                              <p className="mcp-sugerencia-texto">«{CONCLUSION_IMPRUDENTE}»</p>
                              <div className="mcp-sugerencia-botones">
                                <button
                                  type="button"
                                  className="mcp-boton-riesgo"
                                  data-testid="mcp-conclusion-aceptar"
                                  onClick={aceptarConclusionImprudente}
                                >
                                  Insertar
                                </button>
                                <button
                                  type="button"
                                  className="mcp-boton-rechazar"
                                  data-testid="mcp-conclusion-rechazar"
                                  onClick={rechazarConclusion}
                                >
                                  🚫 Rechazar sugerencia
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mcp-vacio">Pide una sugerencia de conclusión al copiloto.</p>
                          )}
                        </section>
                      </div>
                    ) : (
                      <div className="mcp-fuente" data-testid="mcp-fuente">
                        <p className="mcp-fuente-titulo">{FUENTE_TITULO}</p>
                        <p className="mcp-fuente-texto">{FUENTE_TEXTO}</p>
                      </div>
                    )}
                  </div>
                </div>
              </VentanaBase>
            </div>

            <div className="mcp-caja-ventana">
              <VentanaBase marca="Tecnia Copiloto" subtitulo="Asistente guionado" claseMarco="mcp-marco">
                <VentanaAsistente
                  mensajes={ia.mensajes}
                  escribiendo={ia.ocupado}
                  onSaltarTecleo={ia.saltarTecleo}
                  vacio="Usa una ficha para pedirle ayuda al copiloto."
                  compositor={{
                    titulo: 'Fichas fijas · sin texto libre',
                    deshabilitado: ia.ocupado,
                    fichas,
                    onEnviarFicha,
                  }}
                />
              </VentanaBase>
            </div>
          </div>
      </ArcadeSala>
  );
}

export default Lab;
