'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  accion,
  capaDe,
  capasDe,
  documentoEn,
  enlacesRotos,
  huerfanas,
  LIENZOS,
  PALETA_BASE,
  textosDe,
  useDiseno,
  vecesQueUso,
  VentanaDiseno,
  type Documento,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N9·U «Desarrollo de aplicaciones», parada 1 · «Boceta tu app»
 * (documento §54.3). **N9 = 3.º de Secundaria = 14–15 años**, verificado en
 * `curriculo.ts`.
 *
 * Tercera clase de Tecnia Diseño y la primera en usar el lado de PROTOTIPO
 * del armazón: pantallas y `enlazar`. `VentanaDiseno` no trae control para
 * `enlazar` (herramienta «enlace» sin fila de opciones propia — hueco
 * anotado en el reporte); el panel de esta clase lo construye.
 */

const CAPA_LIENZO = LIENZOS.pantalla; // 10×18, un móvil

export const DOC_INICIAL: Documento = {
  lienzo: CAPA_LIENZO,
  paleta: PALETA_BASE,
  banco: {},
  paginas: [{ id: 'inicio', nombre: 'Inicio', fondo: null, capas: [] }],
};

const capasTotales = (doc: Documento): number => doc.paginas.reduce((n, p) => n + p.capas.length, 0);

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'inicio',
    titulo: 'Boceta la pantalla de Inicio',
    instruccion: 'Pon un título con «Texto» y un botón con «Formas» — el botón que va a llevar a la segunda pantalla.',
    pista: 'No hace falta que se vea bonito todavía: un boceto es texto y cajas.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      return !!p0 && textosDe(d.documento, p0.id).length >= 1 && capasDe(d.documento, p0.id).some((c) => c.tipo === 'forma');
    },
    aprendido: 'Un boceto de app es texto y cajas — la forma final llega después, el flujo se piensa primero.',
  },
  {
    id: 'nueva-pantalla',
    titulo: 'Crea la segunda pantalla',
    instruccion: 'Abajo, en «Pantallas», pulsa «+ Pantalla» para crear el «Detalle» de tu app.',
    pista: 'Cada pantalla es un documento aparte, con sus propias capas.',
    comprueba: (d) => d.documento.paginas.length >= 2,
    aprendido: 'Una app no es una pantalla: es varias, y alguien tiene que decidir cómo se llega de una a otra.',
  },
  {
    id: 'contenido-detalle',
    titulo: 'Dale contenido a Detalle',
    instruccion: 'Cambia a la pantalla «Detalle» (pestaña de abajo) y pon un título ahí también.',
    pista: 'Las pestañas de «Pantallas» cambian de documento sin perder lo que hiciste en Inicio.',
    comprueba: (d) => {
      const p1 = d.documento.paginas[1];
      return !!p1 && textosDe(d.documento, p1.id).length >= 1;
    },
    aprendido: 'Cada pantalla se diseña por separado, pero todas son del mismo proyecto.',
  },
  {
    id: 'enlaza',
    titulo: 'Enlaza el botón',
    instruccion: 'Vuelve a Inicio, selecciona tu botón y en el panel «Enlazar a» elige «Detalle». Así se prueba el flujo, no sólo se dibuja.',
    pista: 'Un botón que no lleva a ningún lado es un botón que no sirve, aunque se vea perfecto.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      const p1 = d.documento.paginas[1];
      if (!p0 || !p1) return false;
      const boton = capasDe(d.documento, p0.id).find((c) => c.tipo === 'forma');
      return (
        !!boton &&
        boton.enlaceA === p1.id &&
        vecesQueUso(d.historia, 'enlazar') >= 1 &&
        huerfanas(d.documento).length === 0 &&
        enlacesRotos(d.documento).length === 0
      );
    },
    aprendido: 'Eso es un prototipo probable: ya no es un dibujo, es algo que se puede tocar y que lleva a alguna parte.',
  },
];

const TOTAL_PASOS = GUION.length;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 1 de 3 · Desarrollo de aplicaciones',
  tema: 'Boceta tu app: de la idea al flujo que se toca',
  objetivo:
    'Sabrás bocetar dos pantallas de una app, y enlazar un botón de una a la otra para que el boceto se pueda TOCAR, no sólo mirar.',
  vasAHacer: [
    'Bocetar la pantalla de Inicio: título y un botón.',
    'Crear la segunda pantalla, «Detalle».',
    'Ponerle contenido a Detalle.',
    'Enlazar el botón de Inicio para que lleve a Detalle.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Diseñador de flujos', emoji: '✏️' },
  boton: 'Abrir el editor',
  acento: '#22d3ee',
};

const LINEAS = {
  inicio: 'Una app no es una imagen: son varias pantallas y los caminos entre ellas. Hoy bocetas dos y las conectas.',
  fin: 'Tu prototipo ya se puede tocar: dos pantallas y un botón que de verdad lleva de una a la otra. Así se prueba una idea antes de programarla.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabBocetaTuApp(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alSalir, alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const { pasos, terminado, tiempoFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const d = useDiseno({
    documento: DOC_INICIAL,
    herramientas: ['seleccion', 'forma', 'texto', 'paginas', 'enlace'],
  });

  const guion = useGuionDiseno(d, GUION, {
    onAvance: (paso) => {
      avanzar();
      reproducirTono('correct');
      hablar(paso.aprendido);
    },
    onTerminado: () => terminar(0, () => hablar(LINEAS.fin)),
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const unica = d.seleccion.length === 1 ? capaDe(d.documento, d.pagina, d.seleccion[0]) : null;
  const otrasPaginas = d.documento.paginas.filter((p) => p.id !== d.pagina);

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {unica && otrasPaginas.length > 0 && (
        <div className="dsg-panel-extra">
          <span className="dis-nota">Enlazar «{unica.nombre}» a:</span>
          {otrasPaginas.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`dis-btn${unica.enlaceA === p.id ? ' dis-on' : ''}`}
              data-enlazar={p.id}
              onClick={() => d.hacer(accion('enlazar', { pagina: d.pagina, capa: unica.id, aPagina: p.id }))}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;
  const mitad = documentoEn(d.historia, Math.max(1, Math.floor(d.historia.hechas.length / 2)));

  return (
    <ArcadeSala
      titulo="Boceta tu app"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · pantalla de móvil · pantallas y enlaces</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Diseñador de flujos',
              insigniaEmoji: '✏️',
              titulo: '¡Tu prototipo se puede tocar!',
              detalle:
                'Dos pantallas, cada una con su contenido, y un botón que de verdad lleva de Inicio a Detalle. Eso es lo que separa un dibujo de un prototipo.',
              resumen: [
                { etiqueta: 'Pantallas', valor: `${d.documento.paginas.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Piezas a medio camino → al final', valor: `${capasTotales(mitad)} → ${capasTotales(d.documento)}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="boceto-app · 10×18 casillas">
        <VentanaDiseno
          documento={d.documento}
          pagina={d.pagina}
          seleccion={d.seleccion}
          herramientas={d.herramientas}
          herramienta={d.herramienta}
          onHerramienta={d.elegirHerramienta}
          gesto={d.gesto}
          pasos={d.pasos}
          rechazo={d.rechazo}
          onSeleccionar={(id, mas) => d.seleccionar(id ? [id] : [], mas)}
          onGestoInicio={d.iniciarGesto}
          onGestoMover={d.moverGesto}
          onGestoSoltar={d.soltarGesto}
          onAccion={d.hacer}
          nuevoId={d.nuevoId}
          onDeshacer={d.deshacer}
          onRehacer={d.rehacer}
          puedeDeshacer={d.puedeDeshacer}
          puedeRehacer={d.puedeRehacer}
          onIrA={d.irA}
          panel={panel}
        />
      </VentanaBase>
      {!empezado && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
    </ArcadeSala>
  );
}

export default LabBocetaTuApp;
