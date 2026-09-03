'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../../arcade3d/useTemporizadores';
import { formatTiempo, useLabActividad } from '../../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  CUERPO_DOCUMENTO,
  FUNCIONES_DISPONIBLES,
  FUNCION_CORRECTA,
  NOTAS_FILA5,
  RANGOS_DISPONIBLES,
  RANGO_CORRECTO,
  TEMAS_PRESENTACION,
  TEMA_INICIAL,
  TITULO_DIAPOSITIVA,
  TITULO_DOCUMENTO,
  documentoCompleto,
  promedio,
  temaPorId,
  type IdFuncion,
  type IdRango,
} from './logica';
import './otraCaja.css';

/**
 * N4·U «Microsoft 365», grado Avanzado · `of-m365-otra-caja` — «El mismo
 * trabajo en otra caja».
 *
 * No hay armazón de `simuladores/` que sirva: la clase es la única
 * consumidora de una ventana de tres pestañas minúsculas, así que se
 * construye autocontenida sobre las mismas dos piezas que ya usa N4 para
 * software que no es Office —`VentanaBase` (el chrome) y `ArcadeSala` (la
 * escenografía con Bit y el marcador)—, igual que `LabVirusYAntivirus.tsx`.
 *
 * Las tres tareas son deliberadamente pequeñas (documento §58.2): un título
 * al que aplicar negrita + tamaño 18, una celda que se calcula con la función
 * pura `promedio()` sobre `B5:D5`, y un tema de presentación que cambia de
 * verdad el fondo/acento con estado real. Nada de arrastre en ningún punto
 * —jsdom pierde coordenadas de puntero en silencio (COMO-SE-CONSTRUYE.md
 * §5.1-5.2)— así que seleccionar el título, elegir la función, confirmar el
 * rango y elegir el tema son todo clics.
 *
 * Los nombres reales (Google Workspace, Docs, Sheets, Slides) no aparecen en
 * ningún sitio de la interfaz: la ventana se llama «Tecnia Nube Suite» y sus
 * tres módulos «Documentos», «Hojas» y «Presentaciones», mismo patrón que
 * `n7-sistemas-operativos` con Windows/Android/iOS/Linux.
 */

type Pestana = 'documentos' | 'hojas' | 'presentaciones';

const LINEAS = {
  inicio:
    'Bienvenido a Tecnia Nube Suite. Los botones cambiaron de lugar, pero el oficio que aprendiste es el mismo. Empieza por Documentos.',
  docSeleccionaPrimero: 'Antes de aplicar formato, selecciona el título con un clic.',
  docListo: '¡Excelente! Como ves, el concepto de estilo de texto no cambia entre programas.',
  hojaSeleccionaCelda: 'Primero haz clic en la celda E5: ahí va el resultado.',
  hojaAbreFunciones: 'En este programa no hay cinta de opciones. Busca el icono de Funciones, la letra griega Sigma.',
  hojaGrafico: 'Ese botón es para insertar un gráfico. Busca el icono de funciones (Σ).',
  hojaFuncionMala: 'Esa función no calcula el promedio. Vuelve a mirar la lista y busca PROMEDIO.',
  hojaEligeRango: 'Ahora confirma el rango: las tres notas están en la fila 5, de la columna B a la D.',
  hojaRangoMalo: 'Ese rango no junta las tres notas de la fila 5. Vuelve a mirar B5 a D5.',
  hojaListo: '¡Exacto! El cálculo se hizo solo. La matemática no cambia de programa.',
  presAbreTema: 'Haz clic en Cambiar Tema y elige cualquier estilo distinto al de ahora.',
  presListo: '¡Impecable! La diapositiva se transformó al instante.',
  entregaIncompleta: 'Todavía falta un módulo por terminar. Revisa las pestañas: la que le falta el punto no está lista.',
  fin: 'Has completado tres tareas avanzadas en tres aplicaciones distintas sin ayuda. Ahora eres un verdadero especialista multiplataforma.',
};

/** 1 tarea de Documentos + 1 de Hojas + 1 de Presentaciones. */
const TOTAL_PASOS = 3;

export function LabOtraCaja(props: ActivityProps & { alSalir?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('documentos');
  const [aviso, setAviso] = useState<string | null>(null);

  // Documentos
  const [tituloSeleccionado, setTituloSeleccionado] = useState(false);
  const [negrita, setNegrita] = useState(false);
  const [tamano, setTamano] = useState(14);
  const [documentoListo, setDocumentoListo] = useState(false);

  // Hojas
  const [celdaActiva, setCeldaActiva] = useState<string | null>(null);
  const [menuFuncionAbierto, setMenuFuncionAbierto] = useState(false);
  const [funcionElegida, setFuncionElegida] = useState<IdFuncion | null>(null);
  const [resultado, setResultado] = useState<number | null>(null);

  // Presentaciones
  const [temaId, setTemaId] = useState(TEMA_INICIAL);
  const [menuTemaAbierto, setMenuTemaAbierto] = useState(false);
  const [temaCambiado, setTemaCambiado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, TOTAL_PASOS);

  const avisar = (texto: string) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), 1900);
  };

  /* ── Documentos ─────────────────────────────────────────────────────── */

  const seleccionarTitulo = () => {
    if (terminado) return;
    reproducirTono('select');
    setTituloSeleccionado(true);
  };

  const comprobarDocumento = (siguienteNegrita: boolean, siguienteTamano: number) => {
    if (documentoCompleto(siguienteNegrita, siguienteTamano) && !documentoListo) {
      setDocumentoListo(true);
      reproducirTono('correct');
      hablar(LINEAS.docListo);
      avisar('Documentos · listo');
      avanzar();
    }
  };

  const aplicarNegrita = () => {
    if (terminado) return;
    if (!tituloSeleccionado) {
      restar();
      hablar(LINEAS.docSeleccionaPrimero);
      avisar('Primero selecciona el título');
      return;
    }
    reproducirTono('select');
    setNegrita(true);
    comprobarDocumento(true, tamano);
  };

  const aplicarTamano18 = () => {
    if (terminado) return;
    if (!tituloSeleccionado) {
      restar();
      hablar(LINEAS.docSeleccionaPrimero);
      avisar('Primero selecciona el título');
      return;
    }
    reproducirTono('select');
    setTamano(18);
    comprobarDocumento(negrita, 18);
  };

  /* ── Hojas ──────────────────────────────────────────────────────────── */

  const seleccionarCelda = (id: string) => {
    if (terminado || id !== 'E5' || resultado !== null) return;
    reproducirTono('select');
    setCeldaActiva(id);
    if (!menuFuncionAbierto && !funcionElegida) hablar(LINEAS.hojaAbreFunciones);
  };

  const abrirFunciones = () => {
    if (terminado || resultado !== null) return;
    if (celdaActiva !== 'E5') {
      restar();
      hablar(LINEAS.hojaSeleccionaCelda);
      avisar('Primero haz clic en E5');
      return;
    }
    reproducirTono('select');
    setMenuFuncionAbierto((abierto) => !abierto);
  };

  const clicGrafico = () => {
    if (terminado) return;
    if (resultado === null) restar();
    hablar(LINEAS.hojaGrafico);
    avisar('Ese botón no calcula nada aquí');
  };

  const elegirFuncion = (id: IdFuncion) => {
    if (terminado || resultado !== null) return;
    if (id !== FUNCION_CORRECTA) {
      restar();
      hablar(LINEAS.hojaFuncionMala);
      avisar('Esa no es la función que necesitas');
      return;
    }
    reproducirTono('select');
    setFuncionElegida(id);
    setMenuFuncionAbierto(false);
    hablar(LINEAS.hojaEligeRango);
  };

  const elegirRango = (id: IdRango) => {
    if (terminado || resultado !== null) return;
    if (id !== RANGO_CORRECTO) {
      restar();
      hablar(LINEAS.hojaRangoMalo);
      avisar('Ese no es el rango de las tres notas');
      return;
    }
    const valor = promedio(NOTAS_FILA5.map((n) => n.valor));
    setResultado(valor);
    reproducirTono('correct');
    hablar(LINEAS.hojaListo);
    avisar('Hojas · listo');
    avanzar();
  };

  /* ── Presentaciones ─────────────────────────────────────────────────── */

  const alternarMenuTema = () => {
    if (terminado) return;
    reproducirTono('select');
    setMenuTemaAbierto((abierto) => !abierto);
    if (!menuTemaAbierto && !temaCambiado) hablar(LINEAS.presAbreTema);
  };

  const elegirTema = (id: string) => {
    if (terminado) return;
    reproducirTono('select');
    setTemaId(id);
    setMenuTemaAbierto(false);
    if (id !== TEMA_INICIAL && !temaCambiado) {
      setTemaCambiado(true);
      hablar(LINEAS.presListo);
      avisar('Presentaciones · listo');
      avanzar();
    }
  };

  /* ── Entrega final ─────────────────────────────────────────────────── */

  const entregar = () => {
    if (terminado) return;
    if (!(documentoListo && resultado !== null && temaCambiado)) {
      restar();
      hablar(LINEAS.entregaIncompleta);
      avisar('Todavía falta completar un módulo');
      return;
    }
    const segundos = Math.round((Date.now() - sim.current.inicio) / 1000);
    terminar(segundos, () => hablar(LINEAS.fin));
  };

  const repetir = () => {
    timers.limpiar();
    setPestana('documentos');
    setAviso(null);
    setTituloSeleccionado(false);
    setNegrita(false);
    setTamano(14);
    setDocumentoListo(false);
    setCeldaActiva(null);
    setMenuFuncionAbierto(false);
    setFuncionElegida(null);
    setResultado(null);
    setTemaId(TEMA_INICIAL);
    setMenuTemaAbierto(false);
    setTemaCambiado(false);
    reiniciar(() => hablar(LINEAS.inicio));
  };

  /* ── lo que ve la pantalla ─────────────────────────────────────────── */

  const tema = temaPorId(temaId);
  const completados = [documentoListo, resultado !== null, temaCambiado].filter(Boolean).length;

  const barraEstado = (
    <div className="otc-estado">
      <div className="otc-estado-lista">
        <span className={documentoListo ? 'es-lista' : ''}>Documentos</span>
        <span className={resultado !== null ? 'es-lista' : ''}>Hojas</span>
        <span className={temaCambiado ? 'es-lista' : ''}>Presentaciones</span>
      </div>
      <button type="button" className="otc-entregar" onClick={entregar}>
        🚀 Entregar Proyecto Multiplataforma
      </button>
    </div>
  );

  const cuerpo = (
    <VentanaBase
      marca="Tecnia Nube Suite"
      subtitulo="3 módulos · Documentos · Hojas · Presentaciones"
      barraEstado={barraEstado}
    >
      <div className="otc-cuerpo">
        <div className="otc-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`otc-tab${pestana === 'documentos' ? ' es-activa' : ''}`}
            onClick={() => setPestana('documentos')}
          >
            📄 Documentos {documentoListo && <span className="otc-check">✔</span>}
          </button>
          <button
            type="button"
            role="tab"
            className={`otc-tab${pestana === 'hojas' ? ' es-activa' : ''}`}
            onClick={() => setPestana('hojas')}
          >
            📊 Hojas {resultado !== null && <span className="otc-check">✔</span>}
          </button>
          <button
            type="button"
            role="tab"
            className={`otc-tab${pestana === 'presentaciones' ? ' es-activa' : ''}`}
            onClick={() => setPestana('presentaciones')}
          >
            📽️ Presentaciones {temaCambiado && <span className="otc-check">✔</span>}
          </button>
        </div>

        {pestana === 'documentos' && (
          <div className="otc-panel">
            <div className="otc-toolbar">
              <span className="otc-toolbar-label">Formato</span>
              <button type="button" className={`otc-toolbar-btn${negrita ? ' es-aplicado' : ''}`} onClick={aplicarNegrita}>
                Negrita
              </button>
              <button type="button" className={`otc-toolbar-btn${tamano === 18 ? ' es-aplicado' : ''}`} onClick={aplicarTamano18}>
                Tamaño 18
              </button>
            </div>
            <div className="otc-doc-hoja">
              <button
                type="button"
                className={`otc-doc-titulo${tituloSeleccionado ? ' es-seleccionado' : ''}${negrita ? ' es-negrita' : ''}`}
                style={{ fontSize: tamano }}
                onClick={seleccionarTitulo}
              >
                {TITULO_DOCUMENTO}
              </button>
              <p className="otc-doc-cuerpo">{CUERPO_DOCUMENTO}</p>
            </div>
          </div>
        )}

        {pestana === 'hojas' && (
          <div className="otc-panel">
            <div className="otc-toolbar">
              <button type="button" className="otc-toolbar-btn" onClick={abrirFunciones}>
                Σ Funciones
              </button>
              <button type="button" className="otc-toolbar-btn otc-toolbar-btn--distractor" onClick={clicGrafico}>
                📊 Insertar gráfico
              </button>
            </div>
            <div className="otc-hoja-tabla">
              {NOTAS_FILA5.map((n) => (
                <div key={n.id} className="otc-hoja-celda">
                  <span className="otc-hoja-celda-id">{n.id}</span>
                  <span className="otc-hoja-celda-valor">{n.valor}</span>
                </div>
              ))}
              <button
                type="button"
                className={`otc-hoja-celda otc-hoja-celda--clicable${celdaActiva === 'E5' ? ' es-activa' : ''}${resultado !== null ? ' es-calculada' : ''}`}
                onClick={() => seleccionarCelda('E5')}
              >
                <span className="otc-hoja-celda-id">E5</span>
                <span className="otc-hoja-celda-valor">{resultado !== null ? resultado : ''}</span>
              </button>
            </div>

            {menuFuncionAbierto && (
              <div className="otc-menu-funciones">
                {FUNCIONES_DISPONIBLES.map((f) => (
                  <button key={f} type="button" className="otc-menu-item" onClick={() => elegirFuncion(f)}>
                    {f}
                  </button>
                ))}
              </div>
            )}

            {funcionElegida && resultado === null && (
              <div className="otc-rangos">
                <span className="otc-rangos-label">Confirma el rango:</span>
                {RANGOS_DISPONIBLES.map((r) => (
                  <button key={r} type="button" className="otc-rango-chip" onClick={() => elegirRango(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'presentaciones' && (
          <div className="otc-panel">
            <div className="otc-toolbar">
              <button type="button" className="otc-toolbar-btn" onClick={alternarMenuTema}>
                🎨 Cambiar Tema
              </button>
            </div>
            <div className="otc-slide-envoltura">
              <div className="otc-slide" style={{ background: tema.fondo }}>
                <span className="otc-slide-acento" style={{ background: tema.acento }} />
                <p className="otc-slide-titulo" style={{ color: tema.acento }}>
                  {TITULO_DIAPOSITIVA}
                </p>
                <span className="otc-slide-tema-nombre">{tema.nombre}</span>
              </div>

              {menuTemaAbierto && (
                <div className="otc-menu-temas">
                  {TEMAS_PRESENTACION.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`otc-tema-swatch${t.id === temaId ? ' es-actual' : ''}`}
                      onClick={() => elegirTema(t.id)}
                    >
                      <span className="otc-tema-swatch-color" style={{ background: t.fondo }} />
                      {t.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </VentanaBase>
  );

  return (
    <ArcadeSala
      titulo="El mismo trabajo en otra caja"
      pasoEtiqueta="Módulo"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Completados"
      marcadorValor={`${terminado ? 3 : completados}/3`}
      bit={linea}
      base={<p className="gabinete-nota">Tecnia Nube Suite · el mismo oficio, otra caja</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Maestro Multiplataforma',
              // (nombre visible con mayúscula inicial; el pliego lo cita en
              // versalitas — «MAESTRO MULTIPLATAFORMA» — como el resto de
              // insignias de la casa, que siempre se pintan en mayúsculas
              // vía CSS y se guardan en el código con mayúscula inicial).
              insigniaEmoji: '🔄',
              titulo: '¡Proyecto multiplataforma entregado!',
              detalle:
                'Diste formato a un título, calculaste un promedio real con una función distinta y cambiaste el tema de una diapositiva, en tres programas que nunca habías visto. Los botones cambiaron de lugar; el oficio no.',
              resumen: [
                { etiqueta: 'Módulos', valor: '3' },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {cuerpo}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}

export default LabOtraCaja;
