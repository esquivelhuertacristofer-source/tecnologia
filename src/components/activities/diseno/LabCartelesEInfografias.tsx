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
  cuantosColores,
  estaCentradaH,
  hayJerarquia,
  LIENZOS,
  paginaDe,
  PALETA_BASE,
  ptAbajo,
  ptArriba,
  textosDe,
  useDiseno,
  VentanaDiseno,
  type Documento,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N6·U «Diseño y multimedia», parada 1 · «Carteles e infografías»
 * (documento §54.1). **N6 = 6.º de Primaria = 11–12 años**, verificado en
 * `curriculo.ts`.
 *
 * Primera clase construida sobre `simuladores/diseno` (armazón cerrado,
 * 4 de 8 actividades servidas de verdad). Enseña los cuatro principios de un
 * cartel legible: un título que se lee primero, jerarquía entre título e
 * información, centrado exacto (cuadriculado, sin épsilon) y una paleta con
 * tope de colores. Nada de imágenes ni licencias todavía — eso es
 * `n8-imagen-con-capas`, la segunda parada de esta serie.
 */

export const PAGINA = 'cartel';

export const DOC_INICIAL: Documento = {
  lienzo: LIENZOS.cartel,
  paleta: PALETA_BASE,
  banco: {},
  paginas: [{ id: PAGINA, nombre: 'Cartel', fondo: null, capas: [] }],
};

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'titulo',
    titulo: 'Escribe el título',
    instruccion:
      'Un cartel dice UNA cosa clara. Pulsa «Texto» → «+ Cuadro de texto» y escribe el título de tu cartel (por ejemplo, «Feria de Ciencias»).',
    pista: 'Con el cuadro seleccionado, cambia lo que dice en el campo de texto de arriba.',
    comprueba: (d) => textosDe(d.documento, PAGINA).some((t) => t.texto.trim().length >= 3),
    aprendido: 'Todo cartel dice una cosa clara, y se lee primero.',
  },
  {
    id: 'grande-centrado',
    titulo: 'Hazlo grande y céntralo',
    instruccion:
      'Selecciona el título. Con los botones «A+» del panel súbelo hasta al menos 44 pt, y con «Alinear» → «Centrar ↔» déjalo centrado.',
    pista: 'El centro se cuenta en casillas exactas: o está centrado, o no lo está — nada de «casi».',
    comprueba: (d) =>
      textosDe(d.documento, PAGINA).some((t) => t.pt >= 44 && estaCentradaH(d.documento, PAGINA, t.id)),
    aprendido: 'Un título grande y centrado es lo primero que ve el ojo. Por eso va arriba.',
  },
  {
    id: 'info',
    titulo: 'Añade la información',
    instruccion:
      'Crea un segundo cuadro de texto, más chico, con la fecha y el lugar. Ponlo DEBAJO del título — ahí es donde tiene que quedar.',
    pista: 'No lo agrandes: si queda del mismo tamaño que el título, el cartel deja de tener un «primero» y un «después».',
    comprueba: (d) => hayJerarquia(d.documento, PAGINA),
    aprendido: 'Hay jerarquía cuando lo más grande es estrictamente más grande, Y además va arriba.',
  },
  {
    id: 'fondo-paleta',
    titulo: 'Dale color, sin pasarte',
    instruccion:
      'Haz clic fuera de las cajas para soltar la selección y pinta el fondo de la página con un color. Cuida tu paleta: no uses más de 4 colores en total.',
    pista: 'Cuenta como color lo que se VE, no el bote: dos tintas que pintan igual son un solo color.',
    comprueba: (d) => {
      const pag = paginaDe(d.documento, PAGINA);
      return !!pag?.fondo && cuantosColores(d.documento, PAGINA) <= 4;
    },
    aprendido: 'Un cartel con pocos colores se lee más rápido que uno con muchos. Menos, pero a propósito.',
  },
];

const TOTAL_PASOS = GUION.length;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 1 de 3 · Diseño y multimedia',
  tema: 'Carteles e infografías: que se lea de un vistazo',
  objetivo:
    'Sabrás componer un cartel con un título que se lee primero, información de apoyo más chica, todo centrado de verdad y una paleta de colores que no cansa al ojo.',
  vasAHacer: [
    'Escribir el título de tu cartel.',
    'Agrandarlo y centrarlo con las herramientas, no a ojo.',
    'Añadir la información debajo, más chica: eso es jerarquía.',
    'Pintar el fondo cuidando no pasarte de 4 colores.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Diseñador de carteles', emoji: '🪧' },
  boton: 'Abrir el editor',
  acento: '#f97316',
};

const LINEAS = {
  inicio:
    'Tu lienzo está vacío. Un cartel bueno dice una cosa sola y se lee de lejos: hoy vas a construir el tuyo, paso a paso.',
  fin: 'Tu cartel está hecho: título grande y centrado, información debajo, y una paleta que no se pasa de cuatro colores. Eso es lo que hace que un cartel se lea de un vistazo.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCartelesEInfografias(props: PropsLab) {
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

  const d = useDiseno({ documento: DOC_INICIAL, herramientas: ['seleccion', 'texto', 'alinear', 'color'] });

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

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {unica?.tipo === 'texto' && (
        <div className="dsg-panel-extra">
          <button
            type="button"
            className="dis-btn"
            data-accion="letra-mas"
            onClick={() => d.hacer(accion('tamano', { pagina: d.pagina, capa: unica.id, pt: ptArriba(unica.pt) }))}
          >
            A+ ({unica.pt}pt)
          </button>
          <button
            type="button"
            className="dis-btn"
            data-accion="letra-menos"
            onClick={() => d.hacer(accion('tamano', { pagina: d.pagina, capa: unica.id, pt: ptAbajo(unica.pt) }))}
          >
            A-
          </button>
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Carteles e infografías"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · cartel vertical · cuadriculado, sin épsilon</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Diseñador de carteles',
              insigniaEmoji: '🪧',
              titulo: '¡Tu cartel está listo!',
              detalle:
                'Título grande y centrado, información debajo con jerarquía de verdad, y una paleta de máximo 4 colores. Con esos cuatro principios se compone casi cualquier cartel.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Pasos dados', valor: `${d.pasos.length}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="cartel-feria · 12×16 casillas">
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
          panel={panel}
        />
      </VentanaBase>
      {!empezado && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
    </ArcadeSala>
  );
}

export default LabCartelesEInfografias;
