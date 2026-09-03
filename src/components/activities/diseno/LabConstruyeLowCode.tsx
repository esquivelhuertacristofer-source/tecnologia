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
  enlacesRotos,
  huerfanas,
  LIENZOS,
  PALETA_BASE,
  textosDe,
  useDiseno,
  vecesQueUso,
  VentanaDiseno,
  type Capa,
  type Documento,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N9·U «Desarrollo de aplicaciones», parada 2 · «Constrúyela low-code»
 * (documento §54.3, currículo: «Construcción low-code — App Inventor o
 * similar»). **N9 = 3.º de Secundaria = 14–15 años**, verificado en
 * `curriculo.ts`. Continúa a `n9-boceta-tu-app` (parada 1): mismo armazón
 * `simuladores/diseno`, mismo lado de PROTOTIPO, un grafo más grande.
 *
 * Dónde profundiza sobre la parada 1, y por qué no es «bocetar tres veces en
 * vez de dos»:
 *
 * 1. **Tres pantallas y CUATRO enlaces, no una cadena.** Inicio tiene DOS
 *    salidas (a Lista y un atajo directo a Detalle) y Detalle vuelve a
 *    Inicio: hay dos caminos distintos hasta Detalle y un ciclo, no una
 *    línea recta. Es la diferencia entre «un boceto que se toca» y «una app
 *    que se recorre».
 * 2. **Los controles se nombran.** `renombrar` existe en el motor
 *    (`comandos.ts`) pero `VentanaDiseno` no le da fila propia — igual que
 *    `enlazar` en la parada 1—, así que el panel de esta clase construye un
 *    campo de texto que lo dispara. Es la disciplina real de un editor
 *    low-code: en App Inventor cada botón se llama por su nombre («Button1»)
 *    y las piezas de código lo usan; aquí el alumno practica esa disciplina
 *    aunque no haya piezas de código todavía.
 * 3. **No todo control navega.** El campo de nota de Detalle representa un
 *    control real (donde el usuario escribiría algo) y **no se enlaza a
 *    ninguna pantalla** — el botón «Volver» sí. Verlos uno al lado del otro
 *    es la lección: un control tiene un propósito, y navegar es sólo uno de
 *    los posibles.
 */

const CAPA_LIENZO = LIENZOS.pantalla; // 10×18, un móvil

export const DOC_INICIAL: Documento = {
  lienzo: CAPA_LIENZO,
  paleta: PALETA_BASE,
  banco: {},
  paginas: [{ id: 'inicio', nombre: 'Inicio', fondo: null, capas: [] }],
};

/** El nombre que pone el motor por omisión («Forma 3», «Texto 1»…). Un
 *  control se queda sin propósito mientras conserve ese nombre. */
const ES_NOMBRE_POR_OMISION = /^(Forma|Texto|Imagen)\s\d+$/;
const tieneNombrePropio = (nombre: string): boolean => !ES_NOMBRE_POR_OMISION.test(nombre.trim());

const formasDe = (doc: Documento, pagina: string): Capa[] => capasDe(doc, pagina).filter((c) => c.tipo === 'forma');

/** ¿Al menos dos formas de esa pantalla tienen nombre propio Y distinto entre sí? */
function dosControlesNombrados(doc: Documento, pagina: string): boolean {
  const nombrados = formasDe(doc, pagina).filter((c) => tieneNombrePropio(c.nombre));
  const unicos = new Set(nombrados.map((c) => c.nombre.trim().toLowerCase()));
  return nombrados.length >= 2 && unicos.size >= 2;
}

/** Cuántos controles de TODA la app enlazan a una pantalla — el número que
 *  demuestra que hay más de un camino hasta ahí. */
function cuantosEnlazanA(doc: Documento, destino: string): number {
  return doc.paginas.flatMap((p) => p.capas).filter((c) => c.enlaceA === destino).length;
}

const contarEnlaces = (doc: Documento): number =>
  doc.paginas.flatMap((p) => p.capas).filter((c) => c.enlaceA !== undefined).length;

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'inicio-controles',
    titulo: 'Boceta Inicio con dos salidas',
    instruccion:
      'Pon un título con «Texto» y DOS formas: van a ser dos botones que llevan a sitios distintos de tu app.',
    pista: 'Una pantalla de inicio con más de una salida no es un defecto — casi ninguna app deja un solo camino.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      return !!p0 && textosDe(d.documento, p0.id).length >= 1 && formasDe(d.documento, p0.id).length >= 2;
    },
    aprendido: 'Un hub con dos salidas es la forma más común de pantalla de inicio: reparte, no encierra.',
  },
  {
    id: 'inicio-nombres',
    titulo: 'Dales nombre a tus botones',
    instruccion:
      'Selecciona cada botón y, en el panel «Nombre del control», escribe qué hace — no «Forma 1». Los dos nombres deben ser distintos.',
    pista: 'En una herramienta low-code de verdad cada control se llama por su nombre: así lo referencia el resto de la app.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      return !!p0 && dosControlesNombrados(d.documento, p0.id);
    },
    aprendido: 'Un control sin nombre con propósito es imposible de mantener, aunque hoy nadie más lo use.',
  },
  {
    id: 'crea-lista',
    titulo: 'Construye la pantalla Lista',
    instruccion:
      'Abajo, en «Pantallas», pulsa «+ Pantalla». Cámbiate a ella, ponle un título y al menos dos formas: van a ser tarjetas de tarea.',
    pista: 'Cada tarjeta representa un dato real que existiría en la app terminada — no es decoración.',
    comprueba: (d) => {
      const p1 = d.documento.paginas[1];
      return !!p1 && textosDe(d.documento, p1.id).length >= 1 && formasDe(d.documento, p1.id).length >= 2;
    },
    aprendido: 'Una lista sin contenido no enseña nada: hace falta ver más de una fila para creer que es una lista.',
  },
  {
    id: 'crea-detalle',
    titulo: 'Construye la pantalla Detalle, y nómbrala',
    instruccion:
      'Pulsa «+ Pantalla» otra vez. En la nueva pantalla pon un título, un campo (una forma, para una nota) y un botón «Volver» (otra forma) — y nombra los dos con el panel de la derecha.',
    pista: 'El campo no va a enlazar a ningún lado: representa dónde el usuario escribiría algo, no un camino.',
    comprueba: (d) => {
      const p2 = d.documento.paginas[2];
      if (!p2) return false;
      return textosDe(d.documento, p2.id).length >= 1 && dosControlesNombrados(d.documento, p2.id);
    },
    aprendido: 'No todo control navega: uno lleva a otra pantalla, el otro sólo guarda lo que escribiste. Los dos tienen propósito.',
  },
  {
    id: 'enlaza-lista',
    titulo: 'Enlaza el primer botón a Lista',
    instruccion: 'Vuelve a Inicio, selecciona uno de tus botones y en «Enlazar a» elige «Lista».',
    pista: 'El botón de vuelta a Lista es el camino principal: el que casi todo el mundo va a usar.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      const p1 = d.documento.paginas[1];
      if (!p0 || !p1) return false;
      return formasDe(d.documento, p0.id).some((c) => c.enlaceA === p1.id);
    },
    aprendido: 'Ese es el camino principal: Inicio → Lista, el que casi todo el mundo va a usar.',
  },
  {
    id: 'enlaza-atajo',
    titulo: 'Enlaza el segundo botón directo a Detalle',
    instruccion: 'Selecciona tu OTRO botón de Inicio y enlázalo a Detalle — un atajo que se salta la Lista.',
    pista: 'Dentro de un momento, Lista también va a llevar a Detalle: entonces habrá dos caminos hasta ahí.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      const p2 = d.documento.paginas[2];
      if (!p0 || !p2) return false;
      return formasDe(d.documento, p0.id).some((c) => c.enlaceA === p2.id);
    },
    aprendido: 'Un atajo es una segunda entrada a la misma pantalla: ahora Detalle ya se puede alcanzar de dos formas.',
  },
  {
    id: 'enlaza-tarjeta',
    titulo: 'Enlaza una tarjeta de Lista a Detalle',
    instruccion: 'En Lista, selecciona una de tus tarjetas y enlázala a Detalle.',
    pista: 'Ahora Detalle tiene DOS entradas: el atajo de Inicio y esta tarjeta. Eso es «más de un camino».',
    comprueba: (d) => {
      const p1 = d.documento.paginas[1];
      const p2 = d.documento.paginas[2];
      if (!p1 || !p2) return false;
      return formasDe(d.documento, p1.id).some((c) => c.enlaceA === p2.id);
    },
    aprendido: 'Tocar la tarjeta y usar el atajo llevan al mismo sitio por rutas distintas — así navega una app de verdad.',
  },
  {
    id: 'enlaza-vuelta',
    titulo: 'Cierra el círculo: el botón Volver',
    instruccion: 'En Detalle, selecciona tu botón «Volver» y enlázalo a Inicio.',
    pista: 'Sin este enlace, quien llega a Detalle se queda encerrado — no hay forma de regresar.',
    comprueba: (d) => {
      const p0 = d.documento.paginas[0];
      const p2 = d.documento.paginas[2];
      if (!p0 || !p2) return false;
      return formasDe(d.documento, p2.id).some((c) => c.enlaceA === p0.id);
    },
    aprendido: 'Ahora tu app tiene un ciclo completo: se puede ir y volver sin quedarse atrapado en ninguna pantalla.',
  },
  {
    id: 'revision',
    titulo: 'Revisión final del flujo',
    instruccion:
      'Nada que hacer aquí: el editor revisa solo que las tres pantallas se alcanzan, que ningún enlace apunta a la nada y que Detalle tiene más de un camino.',
    pista: 'Es el mismo tipo de revisión que hace el motor en la parada 1, pero sobre un mapa más grande.',
    comprueba: (d) => {
      const p2 = d.documento.paginas[2];
      if (!p2) return false;
      return (
        d.documento.paginas.length >= 3 &&
        huerfanas(d.documento).length === 0 &&
        enlacesRotos(d.documento).length === 0 &&
        vecesQueUso(d.historia, 'enlazar') >= 4 &&
        cuantosEnlazanA(d.documento, p2.id) >= 2
      );
    },
    aprendido: 'Eso es una app construida, no sólo bocetada: tres pantallas, controles con nombre y un mapa sin huecos.',
  },
];

const TOTAL_PASOS = GUION.length;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 2 de 3 · Desarrollo de aplicaciones',
  tema: 'Constrúyela low-code: de dos pantallas a una app que navega de verdad',
  objetivo:
    'Vas a construir una app de tres pantallas con controles que tienen nombre propio y con varios botones enlazados — la misma idea que usa una herramienta **low-code** (código reducido: arrastras y conectas piezas en vez de escribir cada línea a mano), como App Inventor.',
  vasAHacer: [
    'Bocetar Inicio con dos botones, y darles nombre propio.',
    'Construir Lista, con tarjetas de tarea.',
    'Construir Detalle, con un campo y un botón «Volver», también con nombre.',
    'Enlazar los cuatro caminos: dos salidas desde Inicio, la tarjeta y la vuelta.',
    'Dejar que el editor revise el mapa completo.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Constructor low-code', emoji: '🏗️' },
  boton: 'Abrir el editor',
  acento: '#a78bfa',
};

const LINEAS = {
  inicio:
    'Ya bocetaste el flujo con dos pantallas y un botón. Ahora lo construyes de verdad: tres pantallas, controles con nombre, y una app que se puede recorrer por más de un camino.',
  fin: 'Tres pantallas, cada control con un nombre que dice qué hace, y más de un camino hasta Detalle. Eso ya no es un boceto: es una app que navega.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabConstruyeLowCode(props: PropsLab) {
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
    herramientas: ['seleccion', 'forma', 'texto', 'paginas', 'enlace', 'capas'],
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
      {unica && (
        <div className="dsg-panel-extra">
          <span className="dis-nota">Nombre del control:</span>
          <input
            className="dis-entrada"
            aria-label="Nombre del control seleccionado"
            data-entrada="nombre-control"
            value={unica.nombre}
            onChange={(e) => d.hacer(accion('renombrar', { pagina: d.pagina, capa: unica.id, nombre: e.target.value }))}
          />
        </div>
      )}
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
          {unica.enlaceA && (
            <button
              type="button"
              className="dis-btn dis-peligro"
              data-accion="quitar-enlace"
              onClick={() => d.hacer(accion('enlazar', { pagina: d.pagina, capa: unica.id, aPagina: '' }))}
            >
              Quitar enlace
            </button>
          )}
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Constrúyela low-code"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · pantalla de móvil · pantallas, nombres y enlaces</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Constructor low-code',
              insigniaEmoji: '🏗️',
              titulo: '¡Tu app ya navega!',
              detalle:
                'Tres pantallas, cada control con un nombre que dice qué hace, y Detalle alcanzable por dos caminos distintos. Así se ve una app construida, no sólo bocetada.',
              resumen: [
                { etiqueta: 'Pantallas', valor: `${d.documento.paginas.length}` },
                { etiqueta: 'Enlaces', valor: `${contarEnlaces(d.documento)}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="app-low-code · 10×18 casillas">
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

export default LabConstruyeLowCode;
