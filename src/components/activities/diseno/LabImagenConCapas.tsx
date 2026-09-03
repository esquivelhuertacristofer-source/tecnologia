'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  capasDe,
  estaDeformada,
  LIENZOS,
  PALETA_BASE,
  sinCreditar,
  useDiseno,
  vecesQueUso,
  VentanaDiseno,
  type Documento,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N8·U «Producción multimedia y videojuegos», parada 1 · «Imagen con capas»
 * (documento §54.2). **N8 = 2.º de Secundaria = 13–14 años**, verificado en
 * `curriculo.ts`.
 *
 * Segunda clase de Tecnia Diseño. Su nombre en el currículo ES el nombre de
 * la mecánica: capas que se apilan (orden Z), y la licencia de cada imagen
 * como dato real del documento, no una etiqueta aparte. `vecesQueUso` corrige
 * el PROCESO en el paso 3: no basta con que el marco termine detrás, hace
 * falta que haya llegado ahí con «Enviar atrás» — no naciendo ya bien puesto.
 */

export const PAGINA = 'portada';

export const DOC_INICIAL: Documento = {
  lienzo: LIENZOS.cuadro,
  paleta: PALETA_BASE,
  banco: {
    bosque: {
      id: 'bosque',
      nombre: 'Bosque al atardecer',
      autor: 'Banco Tecnia',
      licencia: 'libre',
      fondo: 'linear-gradient(180deg,#fb923c 0%,#7c3aed 55%,#0f172a 100%)',
      glifo: '🌲',
      proporcion: { cols: 12, filas: 12 },
    },
    zorro: {
      id: 'zorro',
      nombre: 'Zorro explorador',
      autor: 'Marina Ibáñez',
      licencia: 'atribucion',
      fondo: 'radial-gradient(circle,#fdba74 0%,#9a3412 75%)',
      glifo: '🦊',
      proporcion: { cols: 4, filas: 4 },
    },
  },
  paginas: [{ id: PAGINA, nombre: 'Portada', fondo: null, capas: [] }],
};

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'fondo',
    titulo: 'Coloca la foto de fondo',
    instruccion: 'Herramienta «Imágenes» → «Bosque al atardecer». Se ajusta sola al lienzo entero: ésa es tu primera capa.',
    pista: 'La primera imagen que pones queda al fondo — todo lo demás se apila encima.',
    comprueba: (d) => capasDe(d.documento, PAGINA).some((c) => c.tipo === 'imagen' && c.recurso === 'bosque' && !estaDeformada(d.documento, PAGINA, c.id)),
    aprendido: 'Cada imagen nueva se apila encima de la anterior. Ese orden es tu «orden Z».',
  },
  {
    id: 'personaje',
    titulo: 'Añade el personaje encima',
    instruccion: 'Ahora pon el «Zorro explorador». Debe quedar VISIBLE, encima del bosque.',
    pista: 'Si lo pones y no lo ves, revisa el panel de Capas: puede estar tapado por otra.',
    comprueba: (d) => {
      const capas = capasDe(d.documento, PAGINA);
      const zorro = capas.find((c) => c.tipo === 'imagen' && c.recurso === 'zorro');
      const bosque = capas.find((c) => c.tipo === 'imagen' && c.recurso === 'bosque');
      return !!zorro && !!bosque && !estaDeformada(d.documento, PAGINA, zorro.id) && capas.indexOf(zorro) > capas.indexOf(bosque);
    },
    aprendido: 'Encima quiere decir: más adelante en la lista de capas, nada más.',
  },
  {
    id: 'marco',
    titulo: 'Añade un marco y mándalo atrás',
    instruccion:
      'Con «Formas», pon un rectángulo decorativo. Va a nacer ARRIBA de todo y tapar tu composición: selecciónalo y usa «Orden» → «Enviar atrás» para que quede detrás del bosque.',
    pista: 'Una capa nueva siempre nace encima. Si algo tapa lo que ya tenías, se manda atrás — no se borra.',
    comprueba: (d) => {
      const capas = capasDe(d.documento, PAGINA);
      const marco = capas.find((c) => c.tipo === 'forma');
      return !!marco && capas.indexOf(marco) === 0 && vecesQueUso(d.historia, 'orden') >= 1;
    },
    aprendido: 'Reordenar no es adivinar: es la herramienta «Orden», y por eso queda contado en tu historial.',
  },
  {
    id: 'credito',
    titulo: 'Da crédito a la autora',
    instruccion:
      'El zorro pide atribución: escribe un texto con el nombre de su autora en algún lugar del cartel.',
    pista: 'Se escribe tal cual aparece en el banco de imágenes: Marina Ibáñez.',
    comprueba: (d) => sinCreditar(d.documento).length === 0,
    aprendido: 'Una imagen de uso libre no pide nada. Una de atribución pide UNA cosa: decir quién la hizo.',
  },
];

const TOTAL_PASOS = GUION.length;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 1 de 4 · Producción multimedia y videojuegos',
  tema: 'Imagen con capas: apilar, ordenar y dar crédito',
  objetivo:
    'Sabrás apilar imágenes en capas, reordenarlas con la herramienta correcta cuando una tapa a otra que no debía, y dar crédito a la autora de una imagen que lo pide.',
  vasAHacer: [
    'Poner una foto de fondo que llena el lienzo entero.',
    'Poner un personaje encima, sin deformarlo.',
    'Añadir un marco, ver que tapa todo, y mandarlo atrás.',
    'Dar crédito a la autora de la imagen que lo pide.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Compositor de capas', emoji: '🖼️' },
  boton: 'Abrir el editor',
  acento: '#a78bfa',
};

const LINEAS = {
  inicio: 'Cada imagen que pones se apila sobre la anterior. Hoy vas a apilar, reordenar cuando haga falta, y dar crédito a quien corresponde.',
  fin: 'Tu composición está lista: fondo, personaje encima, el marco en su sitio y la autora del zorro, citada. Eso es trabajar con capas de verdad.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabImagenConCapas(props: PropsLab) {
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

  const d = useDiseno({ documento: DOC_INICIAL, herramientas: ['seleccion', 'imagen', 'forma', 'orden', 'texto'] });

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

  const faltanCreditos = sinCreditar(d.documento);

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {faltanCreditos.length > 0 && guion.indice >= 3 && (
        <div className="dsg-panel-extra">
          <span className="dis-nota">Debes esta autoría: {faltanCreditos.map((r) => r.autor).join(', ')}</span>
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Imagen con capas"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · imagen 12×12 · capas, orden y licencia</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Compositor de capas',
              insigniaEmoji: '🖼️',
              titulo: '¡Tu composición está lista!',
              detalle:
                'Apilaste fondo, personaje y marco, corregiste el orden con la herramienta correcta cuando algo tapó lo que no debía, y le diste crédito a quien lo pedía.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Veces que reordenó', valor: `${vecesQueUso(d.historia, 'orden')}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="composicion-zorro · 12×12 casillas">
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

export default LabImagenConCapas;
