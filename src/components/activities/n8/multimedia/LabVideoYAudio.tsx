'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  accion,
  cortesDe,
  duracionDe,
  inicioDe,
  LIENZOS,
  ordenDeRecursos,
  PALETA_BASE,
  pistaDe,
  useDiseno,
  vecesQueUso,
  VentanaDiseno,
  type Documento,
  type Recurso,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from '../../diseno/PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from '../../diseno/useGuionDiseno';
import '../../diseno/diseno-sala.css';

/**
 * N8·U «Producción multimedia y videojuegos», parada 2 · «Video y audio»
 * (curriculo.ts: «Video y audio (guion, cortes, música)»). **N8 = 2.º de
 * Secundaria = 13–14 años**, verificado en `curriculo.ts`. Parada hermana de
 * `n8-imagen-con-capas` (capas) y `n8-disena-tu-videojuego` (motor 3D); ésta
 * es la única de las tres que abre la cinta (`simuladores/diseno/cinta.ts`,
 * estrenada en `n6-edita-imagen-y-video`).
 *
 * ── QUÉ SOPORTA DE VERDAD EL MOTOR (leído en `comandos.ts` antes de diseñar) ──
 *
 * `poner-corte`, `recortar-corte` (recorte real: `desde` y `dura`, absolutos),
 * `mover-corte` (reordenar dentro de su pista) y `quitar-corte`. Y **una quinta
 * pieza que nadie usa todavía**: `silenciar` — muy real, con su `revisar` y su
 * `aplicar` en `comandos.ts` — pero **sin un solo botón que la dispare** en
 * `LineaDeTiempo.tsx` ni en `VentanaDiseno.tsx`. Esta clase es la primera que
 * la estrena, con un control propio en el `panel` (abajo, «el control de
 * silenciar»), tal como el canon deja hacer: la actividad manda `Accion`
 * directamente con `d.hacer`, no sólo a través de los botones de fábrica.
 *
 * Lo que el motor **NO** tiene —y por eso no está en este guion— es volumen
 * graduado. `Corte` y `Recurso` no llevan ningún campo de nivel de sonido; lo
 * único que existe es silenciar la pista ENTERA (on/off). «Que la música no
 * tape la voz» se enseña con las dos herramientas reales que sí hay: recortar
 * la música para que termine antes de que alguien hable (CUÁNDO suena) y
 * silenciarla entera para una segunda versión (SI suena). Ninguna de las dos
 * es un volumen, y se dice así en la propia clase (ficha 4 de la entrada).
 *
 * ── EL BANCO LLEGA DESORDENADO A PROPÓSITO ────────────────────────────────
 *
 * `BANCO` no declara los cuatro clips en el orden de la historia: los botones
 * de la barra de «Línea de tiempo» siguen `Object.values(doc.banco)`, así que
 * si el banco ya viniera en orden narrativo, poner los clips en el orden que
 * aparecen en pantalla ya daría la respuesta correcta sin que nadie tocara
 * `mover-corte`. Desordenado, el encargo de reordenar es un encargo de
 * verdad.
 *
 * ── EL UMBRAL DE LA MÚSICA SE CALCULA, NO SE ESCRIBE A MANO ───────────────
 *
 * El encargo «recortar-musica» no compara contra el número 7: compara
 * `duracionDe(audio)` contra `inicioDe(pistaVideo, testimonio)` calculado en
 * el momento. Si el alumno recortó la entrada o el patio distinto a lo
 * previsto, el objetivo de la música se mueve con él — igual que en la vida
 * real el punto donde debe callar la música depende de cuándo empieza a
 * hablar la persona, no de un cronómetro fijo.
 */

export const PAGINA = 'portada';

const BANCO: Record<string, Recurso> = {
  'clip-testimonio': {
    id: 'clip-testimonio',
    nombre: 'Testimonio de Valentina',
    autor: 'Comunicación Social',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#ec4899,#0f172a)',
    glifo: '🗣️',
    segundos: 6,
    tipoMedia: 'video',
  },
  'clip-cierre': {
    id: 'clip-cierre',
    nombre: 'Cierre con el lema',
    autor: 'Comunicación Social',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#34d399,#0f172a)',
    glifo: '✨',
    segundos: 4,
    tipoMedia: 'video',
  },
  'clip-logo-entrada': {
    id: 'clip-logo-entrada',
    nombre: 'Entrada con el logotipo',
    autor: 'Comunicación Social',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#22d3ee,#0f172a)',
    glifo: '🏫',
    segundos: 5,
    tipoMedia: 'video',
  },
  'clip-patio': {
    id: 'clip-patio',
    nombre: 'Patio en un día normal',
    autor: 'Comunicación Social',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#f97316,#0f172a)',
    glifo: '🏃',
    segundos: 6,
    tipoMedia: 'video',
  },
  'musica-anuncio': {
    id: 'musica-anuncio',
    nombre: 'Pista instrumental',
    autor: 'Comunicación Social',
    licencia: 'con-permiso',
    fondo: 'linear-gradient(155deg,#facc15,#0f172a)',
    glifo: '🎵',
    segundos: 10,
    tipoMedia: 'audio',
  },
};

export const DOC_INICIAL: Documento = {
  lienzo: LIENZOS.video,
  paleta: PALETA_BASE,
  banco: BANCO,
  // Sin capas: esta parada es sólo la cinta. Componer imágenes ya se enseñó
  // en `n8-imagen-con-capas` (parada 1) y `paginas` no puede faltar —lo pide
  // el tipo `Documento`— pero se queda vacía a propósito.
  paginas: [{ id: PAGINA, nombre: 'Portada', fondo: null, capas: [] }],
  cinta: [
    { id: 'video', tipo: 'video', nombre: 'Video', cortes: [] },
    { id: 'audio', tipo: 'audio', nombre: 'Música', cortes: [] },
  ],
};

/** Sólo la cinta: nada de formas, texto ni imágenes de capa en esta clase. */
const HERRAMIENTAS = ['cinta'] as const;

const ORDEN_HISTORIA = ['clip-logo-entrada', 'clip-patio', 'clip-testimonio', 'clip-cierre'];

/** En qué segundo del video empieza el testimonio, con el estado actual del documento. */
function inicioDelTestimonio(doc: Documento): number | null {
  const pv = pistaDe(doc, 'video');
  const corte = pv?.cortes.find((c) => c.recurso === 'clip-testimonio');
  return pv && corte ? inicioDe(pv, corte.id) : null;
}

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'poner-clips',
    titulo: 'Reúne los cuatro clips',
    instruccion:
      'Con «Línea de tiempo» activa, pon en la pista de Video los cuatro clips del banco: entrada, patio, testimonio y cierre.',
    pista: 'Un clic pone un clip al final de la pista. No importa el orden todavía.',
    comprueba: (d) => cortesDe(d.documento, 'video').length === 4,
    aprendido: 'Cuatro clips en fila. Ahora toca ponerlos en el orden que cuenta la historia.',
  },
  {
    id: 'ordenar-clips',
    titulo: 'Cuenta el anuncio en orden',
    instruccion:
      'El anuncio empieza con el logotipo, sigue con el patio, después habla Valentina y cierra con el lema. Selecciona cada clip en la cinta y muévelo con ◀ ▶ hasta ese orden.',
    pista: 'El botón ◀ mueve el clip un lugar hacia atrás; ▶, un lugar hacia adelante.',
    comprueba: (d) => ordenDeRecursos(d.documento, 'video').join(',') === ORDEN_HISTORIA.join(','),
    aprendido: 'Logotipo, patio, testimonio, cierre. Así se lee un anuncio de verdad.',
  },
  {
    id: 'recortar-entrada',
    titulo: 'El logotipo dura de más',
    instruccion: 'El clip de entrada dura 5 segundos, y con 3 basta. Selecciónalo en la cinta y usa «−1 s» dos veces.',
    pista: 'Recortar no borra el clip: sólo dice cuántos segundos de él se usan.',
    comprueba: (d) => cortesDe(d.documento, 'video').find((c) => c.recurso === 'clip-logo-entrada')?.dura === 3,
    aprendido: 'Tres segundos de logotipo alcanzan. Nadie necesita mirarlo más tiempo.',
  },
  {
    id: 'recortar-patio',
    titulo: 'El patio empieza tembloroso',
    instruccion:
      'Los dos primeros segundos del patio la cámara todavía se está acomodando. Selecciona ese clip y usa «Empezar 1 s después» dos veces.',
    pista: 'Empezar después no acorta el final: mueve el punto de arranque dentro del clip original.',
    comprueba: (d) => (cortesDe(d.documento, 'video').find((c) => c.recurso === 'clip-patio')?.desde ?? 0) >= 2,
    aprendido: 'Ahora el patio empieza ya en movimiento. Ese primer tirón de cámara no se ve.',
  },
  {
    id: 'recortar-cierre',
    titulo: 'El cierre se alarga',
    instruccion: 'El clip de cierre dura 4 segundos y el lema se lee en 2. Selecciónalo y usa «−1 s» dos veces.',
    pista: 'Mismo gesto que con la entrada: menos segundos, mismo mensaje.',
    comprueba: (d) => cortesDe(d.documento, 'video').find((c) => c.recurso === 'clip-cierre')?.dura === 2,
    aprendido: 'El lema entra y sale rápido. Un cierre no necesita quedarse.',
  },
  {
    id: 'cuadrar-quince',
    titulo: 'Que el anuncio dure quince segundos exactos',
    instruccion:
      'Un Reel no puede pasar de quince segundos. Revisa la duración total del video: tiene que dar exactamente 15 — y ni un segundo menos del testimonio de Valentina, que necesita decir su frase completa.',
    pista: '3 + 4 + 6 + 2 = 15. Si no te da, revisa qué clip quedó con el número equivocado.',
    comprueba: (d) =>
      duracionDe(d.documento, 'video') === 15 &&
      cortesDe(d.documento, 'video').find((c) => c.recurso === 'clip-testimonio')?.dura === 6,
    aprendido: 'Quince exactos, y el testimonio entero. Editar también es saber qué NO se corta.',
  },
  {
    id: 'poner-musica',
    titulo: 'Pon la música de fondo',
    instruccion: 'Con «Línea de tiempo» activa, pon la pista instrumental en la pista de Música.',
    pista: 'Es el mismo botón que usaste para los clips, ahora en la fila de Música, más abajo.',
    comprueba: (d) => cortesDe(d.documento, 'audio').length > 0,
    aprendido: 'La música ya está puesta. Pero suena los diez segundos completos — y eso incluye lo que va a hablar Valentina.',
  },
  {
    id: 'recortar-musica',
    titulo: 'Que la música calle antes del testimonio',
    instruccion:
      'La música tiene que dejar de sonar justo cuando empieza a hablar Valentina, para que se le oiga sin pelear con la canción. Selecciónala y recórtala con «−1 s» hasta que dure lo mismo que el video ANTES del testimonio.',
    pista: 'El testimonio empieza en el segundo 7 (3 de logotipo + 4 de patio). La música tiene que durar esos mismos 7 segundos.',
    comprueba: (d) => {
      const inicio = inicioDelTestimonio(d.documento);
      const dur = duracionDe(d.documento, 'audio');
      return inicio !== null && dur > 0 && dur === inicio;
    },
    aprendido: 'La música se apaga justo antes de que hable. No hiciste más silencio del necesario: hiciste el silencio exacto.',
  },
  {
    id: 'version-accesible',
    titulo: 'Una versión sin música, para subtítulos',
    instruccion:
      'Tu profesora pide una segunda versión, sólo con voz, para quien vea el video sin sonido de fondo. Usa el control de la pista de Música para silenciarla entera.',
    pista: 'El botón está en el panel de la derecha, junto al nombre «Música».',
    comprueba: (d) => pistaDe(d.documento, 'audio')?.silenciada === true,
    aprendido: 'Silenciada. Recortar y silenciar son dos herramientas distintas: una decide CUÁNDO suena; la otra, SI suena.',
  },
  {
    id: 'reactivar-musica',
    titulo: 'La versión de redes sí lleva música',
    instruccion:
      'Esa versión sin música era sólo para el caso especial de accesibilidad. La que subes a redes sociales sí necesita la canción: vuelve a activar la pista de Música.',
    pista: 'Mismo control: ahora dice «Activar música» en vez de «Silenciar música».',
    comprueba: (d) => pistaDe(d.documento, 'audio')?.silenciada === false,
    aprendido: 'Dos versiones del mismo montaje, un solo proyecto. Así se entrega trabajo de verdad.',
  },
];

const TOTAL_PASOS = GUION.length;
/** A partir de aquí aparece el control de silenciar (§ panel, abajo). */
const APARECE_CONTROL_SILENCIAR = 8;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 2 de 4 · Producción multimedia y videojuegos',
  tema: 'Video y audio: cortar, ordenar y no tapar la voz',
  objetivo:
    'Sabrás recortar un clip a la duración que pide el proyecto, ordenar varios clips en la línea de tiempo, y controlar cuándo y si suena una música de fondo para que no tape una voz.',
  vasAHacer: [
    'Poner cuatro clips en la línea de tiempo y ordenarlos como cuenta la historia.',
    'Recortarlos hasta que el anuncio dure quince segundos exactos.',
    'Poner una música de fondo y recortarla para que calle antes del testimonio.',
    'Silenciar y reactivar la música para dos versiones distintas del mismo video.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Editor de sonido', emoji: '🎧' },
  boton: 'Abrir el editor',
  acento: '#22d3ee',
};

const LINEAS = {
  inicio:
    'La escuela quiere un anuncio para sus redes: cuatro clips sueltos y una canción que dura de más. Móntalo tú, y que la música no le gane la voz a quien habla.',
  fin: 'Ordenaste los clips, los recortaste al segundo, y le enseñaste a la música cuándo callarse y cuándo sonar. Eso es editar video y audio de verdad.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabVideoYAudio(props: PropsLab) {
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

  const cintaProps = useMemo(
    () => ({
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
    }),
    [
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

  const pistaAudio = pistaDe(d.documento, 'audio');
  const musicaSilenciada = pistaAudio?.silenciada ?? false;

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {/*
       * El control de silenciar: `LineaDeTiempo`/`VentanaDiseno` no traen
       * ningún botón para el comando `silenciar` (comprobado leyendo los dos
       * archivos), así que esta clase manda la `Accion` directamente con
       * `d.hacer` — la puerta que el canon deja abierta para eso.
       */}
      {pistaAudio && guion.indice >= APARECE_CONTROL_SILENCIAR && (
        <div className="dsg-panel-extra">
          <button
            type="button"
            className="dis-btn"
            data-accion="silenciar-musica"
            aria-pressed={musicaSilenciada}
            onClick={() => d.hacer(accion('silenciar', { pista: 'audio', valor: !musicaSilenciada }))}
          >
            {musicaSilenciada ? '🔊 Activar música' : '🔇 Silenciar música'}
          </button>
          <span className="dis-nota">
            {musicaSilenciada ? 'Música silenciada: en esta versión sólo se oye la voz.' : 'Música activa.'}
          </span>
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Video y audio"
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
              insigniaNombre: 'Editor de sonido',
              insigniaEmoji: '🎧',
              titulo: '¡Tu anuncio está montado!',
              detalle:
                'Ordenaste cuatro clips, los recortaste hasta los quince segundos exactos que pide un Reel, y controlaste la música con las dos herramientas reales del editor: recortarla y silenciarla.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Segundos de anuncio', valor: '15' },
                { etiqueta: 'Recortes hechos', valor: `${vecesQueUso(d.historia, 'recortar-corte')}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="anuncio-escuela · 16×10 casillas">
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

export default LabVideoYAudio;
