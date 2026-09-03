'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  capaDe,
  cortesDe,
  descuadre,
  duracionDe,
  imagenesDe,
  LIENZOS,
  ordenDeRecursos,
  PALETA_BASE,
  recorteDe,
  useDiseno,
  vecesQueUso,
  VentanaDiseno,
  type Documento,
  type Recurso,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N6·U «Diseño y multimedia», parada 2 · «Edita imagen y video»
 * (DISEÑO-N6-edita-imagen-y-video.md). **N6 = 6.º de Primaria = 11–12 años**,
 * verificado en `curriculo.ts`.
 *
 * «Editar es quitar»: el recorte quita en el espacio, el corte quita en el
 * tiempo. Acto 1 (lienzo `video`) endereza y encuadra la foto de portada, y
 * enseña de paso que hay material que no se arregla —hay que cambiarlo—.
 * Acto 2 abre la cinta (§ `simuladores/diseno/cinta.ts`, motor nuevo de esta
 * clase) y monta tres clips con su música, cuadrados al segundo.
 */

export const PAGINA = 'portada';

const BANCO: Record<string, Recurso> = {
  'foto-movida': {
    id: 'foto-movida',
    nombre: 'Foto de la feria (movida)',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#7c3aed,#0f172a)',
    glifo: '🌋',
    proporcion: { cols: 11, filas: 8 },
  },
  'foto-nitida': {
    id: 'foto-nitida',
    nombre: 'Foto de la feria (nítida)',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#f97316,#0f172a)',
    glifo: '🌋',
    proporcion: { cols: 11, filas: 8 },
  },
  'clip-entrada': {
    id: 'clip-entrada',
    nombre: 'Entrada al patio',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(160deg,#22d3ee,#0f172a)',
    glifo: '🚪',
    segundos: 6,
    tipoMedia: 'video',
  },
  'clip-volcan': {
    id: 'clip-volcan',
    nombre: 'El volcán en la maqueta',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(160deg,#f97316,#0f172a)',
    glifo: '🌋',
    segundos: 5,
    tipoMedia: 'video',
  },
  'clip-aplauso': {
    id: 'clip-aplauso',
    nombre: 'Los aplausos',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(160deg,#34d399,#0f172a)',
    glifo: '👏',
    segundos: 4,
    tipoMedia: 'video',
  },
  'musica-feria': {
    id: 'musica-feria',
    nombre: 'Música de la feria',
    autor: 'Prof. Ávila',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(160deg,#facc15,#0f172a)',
    glifo: '🎵',
    segundos: 15,
    tipoMedia: 'audio',
  },
};

export const DOC_INICIAL: Documento = {
  lienzo: LIENZOS.video,
  paleta: PALETA_BASE,
  banco: BANCO,
  paginas: [
    {
      id: PAGINA,
      nombre: 'Portada',
      fondo: null,
      capas: [
        {
          tipo: 'imagen',
          id: 'foto-portada',
          nombre: 'Foto de portada',
          // Nace torcida (345° = un giro de 15° antes de quedar recta) y con
          // tres columnas de pasillo vacío a la izquierda: el mismo defecto
          // que trae una carpeta de verdad.
          caja: { col: 2, fila: 1, cols: 11, filas: 8 },
          giro: 345,
          opacidad: 10,
          recurso: 'foto-movida',
          recorte: { arriba: 0, derecha: 0, abajo: 0, izquierda: 0 },
        },
      ],
    },
  ],
  cinta: [
    { id: 'video', tipo: 'video', nombre: 'Video', cortes: [] },
    { id: 'audio', tipo: 'audio', nombre: 'Música', cortes: [] },
  ],
};

const HERRAMIENTAS = ['seleccion', 'imagen', 'giro', 'recorte', 'borrar', 'cinta'] as const;

/** ¿La imagen de este `recurso` está enderezada Y encuadrada (>= 3 a la izquierda)? */
const arreglada = (giro: number, izquierda: number): boolean => giro === 0 && izquierda >= 3;

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'enderezar',
    titulo: 'Enderézala',
    instruccion:
      'La foto está torcida quince grados. Selecciónala y usa los botones de «Girar» hasta dejarla recta.',
    pista: 'Con la herramienta «Girar» activa aparecen dos botones: ↺15° y ↻15°.',
    comprueba: (d) => imagenesDe(d.documento, PAGINA).some((c) => c.giro === 0) && vecesQueUso(d.historia, 'girar') >= 1,
    aprendido: 'Recta. Un giro de la herramienta y ya se ve seria.',
  },
  {
    id: 'encuadrar',
    titulo: 'Encuádrala',
    instruccion:
      'Sobran tres columnas de pasillo vacío a la izquierda. Con «Recortar» activa, pulsa «Izquierda +» tres veces.',
    pista: 'Recortar quita el borde; encoger aplasta lo de dentro. Hoy sólo se recorta.',
    comprueba: (d) => imagenesDe(d.documento, PAGINA).some((c) => recorteDe(c).izquierda >= 3),
    aprendido: 'Ahí está. Ahora el volcán llena el cuadro y se entiende de un vistazo.',
  },
  {
    id: 'cambiar-material',
    titulo: 'Cámbiala por la que sirve',
    instruccion:
      'Ya arreglada, se ve que está movida. En el banco de «Imágenes» hay otra del mismo momento — ponla y borra la vieja. Llega con el mismo pasillo vacío: encuádrala otra vez.',
    pista: 'La nueva viene mal encuadrada igual que la primera: es la misma cámara, el mismo sitio.',
    comprueba: (d) => {
      const imgs = imagenesDe(d.documento, PAGINA);
      if (imgs.some((c) => c.recurso === 'foto-movida')) return false;
      const nitida = imgs.find((c) => c.recurso === 'foto-nitida');
      return !!nitida && arreglada(nitida.giro, recorteDe(nitida).izquierda);
    },
    aprendido: 'Cambiada y arreglada. Te costó hacerlo dos veces, y por eso no se te olvida: se mira el material antes de ponerse a arreglarlo.',
  },
  {
    id: 'poner-clips',
    titulo: 'Pon los tres clips',
    instruccion:
      'Abajo se abre la línea de tiempo. Con «Línea de tiempo» activa, pon los tres clips del banco en la pista de Video, uno por uno.',
    pista: 'Un clic pone un clip. No te preocupes del orden todavía.',
    comprueba: (d) => cortesDe(d.documento, 'video').length === 3,
    aprendido: 'Tres clips en fila. Van pegados, y el que está antes se ve antes.',
  },
  {
    id: 'ordenar-clips',
    titulo: 'Ponlos en el orden de la historia',
    instruccion: 'Primero se llega, luego pasa la cosa, y al final aplauden: entrada, volcán, aplausos.',
    pista: 'Selecciona un clip en la cinta y usa las flechas ◀ ▶ para moverlo de sitio.',
    comprueba: (d) => {
      const orden = ordenDeRecursos(d.documento, 'video');
      return orden.length === 3 && orden[0] === 'clip-entrada' && orden[1] === 'clip-volcan' && orden[2] === 'clip-aplauso';
    },
    aprendido: 'Entrada, volcán, aplausos. Eso ya es una historia.',
  },
  {
    id: 'cortar-entrada',
    titulo: 'Corta la entrada',
    instruccion: 'Reproduce y mira el principio: los dos primeros segundos la cámara apunta al suelo. Selecciona ese clip y usa «Empezar 1 s después» dos veces.',
    pista: 'Cortar no borra el clip. Sólo dice desde qué segundo se empieza a usar.',
    comprueba: (d) => {
      const corte = cortesDe(d.documento, 'video').find((c) => c.recurso === 'clip-entrada');
      return !!corte && corte.desde >= 2;
    },
    aprendido: 'Ahora empieza cuando se ve el patio. Eso es un corte de verdad.',
  },
  {
    id: 'cuadrar-doce',
    titulo: 'Que dure doce segundos justos',
    instruccion: 'El video tiene que durar doce segundos. Con la entrada en 4 y los aplausos en 4, al volcán le sobra 1: recórtaselo con «−1 s».',
    pista: 'Cuatro más cuatro más cuatro son doce.',
    comprueba: (d) => duracionDe(d.documento, 'video') === 12,
    aprendido: 'Doce clavados. La duración de un montaje siempre es una suma.',
  },
  {
    id: 'poner-musica',
    titulo: 'Pon la música y cuádrala',
    instruccion: 'Pon la música en la pista de Música. La canción dura quince segundos y tu video doce: sobran tres. Selecciónala y recórtalos con «−1 s».',
    pista: 'El video se acaba y la canción sigue sonando sola si no la cuadras.',
    comprueba: (d) => cortesDe(d.documento, 'audio').length > 0 && descuadre(d.documento) === 0,
    aprendido: 'Cuadrado. Imagen y sonido se acaban en el mismo segundo.',
  },
];

const TOTAL_PASOS = GUION.length;
const EMPIEZA_LA_CINTA = 3; // índice del primer encargo del Acto 2 ('poner-clips')

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 2 de 3 · Diseño y multimedia',
  tema: 'Edita imagen y video: quitar lo que sobra',
  objetivo:
    'Sabrás enderezar y recortar una foto sin deformarla, descartar el material que no sirve, y montar tres clips con su música en una línea de tiempo que cuadra al segundo.',
  vasAHacer: [
    'Enderezar y encuadrar la foto de portada.',
    'Descubrir que está movida y cambiarla por la buena.',
    'Poner tres clips en la línea de tiempo y ordenarlos.',
    'Cortarles lo que sobra hasta que el video dure doce segundos.',
    'Poner la música y cuadrarla con la imagen.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Montador de video', emoji: '🎬' },
  boton: 'Abrir el editor',
  acento: '#22d3ee',
};

const LINEAS = {
  inicio:
    'El cartel de la feria ya está hecho. Ahora falta el video, y el video lo montas tú. Editar no es añadir cosas: es quitar lo que sobra hasta que se vea lo que importa.',
  fin: 'Enderezaste, recortaste, cambiaste lo que no servía, cortaste y cuadraste la música. Eso es editar.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabEditaImagenYVideo(props: PropsLab) {
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
  const labActividad = useLabActividad(props, TOTAL_PASOS);
  const { pasos, terminado, tiempoFinal, avanzar, terminar } = labActividad;
  const { linea, hablar } = useBit();

  const d = useDiseno({ documento: DOC_INICIAL, herramientas: [...HERRAMIENTAS] });

  const guion = useGuionDiseno(d, GUION, {
    onAvance: (paso) => {
      avanzar();
      reproducirTono('correct');
      hablar(paso.aprendido);
    },
    onTerminado: () =>
      terminar(Math.round((Date.now() - labActividad.sim.current.inicio) / 1000), () => hablar(LINEAS.fin)),
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const unica = d.seleccion.length === 1 ? capaDe(d.documento, d.pagina, d.seleccion[0]) : null;

  // La cinta sólo se abre en el Acto 2 (§ pliego): antes de eso la clase es
  // el editor de imagen puro, y forzar dos programas a la vez confundiría
  // más de lo que enseña.
  const cintaAbierta = guion.indice >= EMPIEZA_LA_CINTA || terminado;

  const cintaProps = useMemo(
    () =>
      cintaAbierta
        ? {
            cinta: d.documento.cinta ?? [],
            banco: d.documento.banco,
            segundo: d.segundo,
            reproduciendo: d.reproduciendo,
            seleccion: d.corteSel,
            onIrASegundo: d.irASegundo,
            onReproducir: d.reproducir,
            onPausar: d.pausar,
            onSeleccionarCorte: d.seleccionarCorte,
            onAccion: d.hacer,
          }
        : undefined,
    [
      cintaAbierta,
      d.documento.cinta,
      d.documento.banco,
      d.segundo,
      d.reproduciendo,
      d.corteSel,
      d.irASegundo,
      d.reproducir,
      d.pausar,
      d.seleccionarCorte,
      d.hacer,
    ],
  );

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {unica?.tipo === 'imagen' && (
        <div className="dsg-panel-extra">
          <span className="dis-nota" data-testid="giro-recorte-actual">
            Giro {unica.giro}° · recorte izq. {unica.recorte.izquierda}
          </span>
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Edita imagen y video"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · video apaisado · cinta en segundos enteros</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Montador de video',
              insigniaEmoji: '🎬',
              titulo: '¡Tu video está montado!',
              detalle:
                'Enderezaste y encuadraste la portada, descartaste la foto movida, ordenaste tres clips, les cortaste lo que sobraba y cuadraste la música al segundo.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Segundos de video', valor: '12' },
                { etiqueta: 'Cortes hechos', valor: `${vecesQueUso(d.historia, 'recortar-corte')}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="feria-de-ciencias · 16×10 casillas">
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
          cinta={cintaProps}
        />
      </VentanaBase>
      {!empezado && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
    </ArcadeSala>
  );
}

export default LabEditaImagenYVideo;
