'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { paginaDe, useNavegador, VentanaNavegador } from '../../../simuladores/navegador';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import { CINTA_PPT_INTERMEDIO } from '@/components/activities/office/tecniaDiapositivas';
import { PortadaWeb, type DatosPortadaWeb } from '../web/PortadaWeb';
import { MAPA_SITIOS, URL_ANUNCIO, URL_ARTICULO_A, URL_ARTICULO_B, URL_ESCUELA, URL_RESULTADOS, URL_SIN_FIRMA } from './mapaSitios';
import { desdeMarcadores, type Prueba } from './pruebas';
import { crearGuion, galeriaDePruebas, TIPOS_GRAFICO } from './guionProyecto';
import { PanelDelProyecto } from './PanelDelProyecto';
import { AuditorioDelProyecto } from './AuditorioDelProyecto';
import './proyectoIntegrador.css';

/**
 * `n6-proyecto-integrador` · «Tu proyecto integrador» — la última clase de la
 * primaria. Tres actos, dos programas (DISEÑO-N6-proyecto-integrador.md):
 *
 *   Acto 1 · Investigar  → Tecnia Navegador (E1, E2)
 *   Acto 2 · Analizar/diseñar → Tecnia Diapositivas (E3–E6)
 *   Acto 3 · Presentar   → el mismo motor, con el auditorio (E7–E9)
 *
 * El hilo que cose los dos actos es `pruebas.ts`: lo que el alumno marcó con
 * la estrella en el acto 1 se congela en `pruebasRef` al pasar de fase y se
 * convierte en la galería `imagen` del E6 — nunca se vuelve a leer en vivo
 * (DISEÑO, «las tres reglas», 2).
 */

const TOTAL_PASOS = 9;
const PASOS_ACTO_2 = 7; // E3..E9, lo que queda tras los 2 del acto 1

const PORTADA: DatosPortadaWeb = {
  situacion: 'Proyecto integrador · La última clase de la primaria',
  tema: 'Investigar, analizar datos, diseñar y presentar, todo junto',
  objetivo: 'Vas a sostener una afirmación con tus propios datos, y a decir hasta dónde llega lo que sabes.',
  vasAHacer: [
    'Buscar y guardar sólo lo que sirva',
    'Añadir la fuente que midieron ustedes',
    'Escribir lo que vas a sostener',
    'Elegir la gráfica que habla de eso',
    'Defenderlo delante del público',
  ],
  encargos: 9,
  minutos: 20,
  insignia: { nombre: 'Lo sostengo con datos', emoji: '🎓' },
  boton: 'Empezar a investigar',
  acento: '#A78BFA',
};

type SubActo1 = 'e1' | 'e2';

export function LabProyectoIntegrador(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS);

  const [portadaAbierta, setPortadaAbierta] = useState(true);
  const [fase, setFase] = useState<'investigar' | 'presentar'>('investigar');
  const [sub, setSub] = useState<SubActo1>('e1');
  const [historial, setHistorial] = useState<string[]>([
    'Ésta es la última clase de la primaria, y no trae nada nuevo que aprender.',
    'La pregunta del proyecto ya está puesta: qué se tira en el bote del salón.',
    'Empieza por buscar. Guarda con la estrella sólo lo que te sirva para sostener algo.',
  ]);

  const nav = useNavegador({ mapa: MAPA_SITIOS, inicio: URL_RESULTADOS, momento: 'Hace un momento' });
  /*
   * `null` = «lo que se ve es `nav.paginaActual.url`»; una cadena = «lo que el
   * alumno está escribiendo». Nada de un efecto que sincronice los dos: cada
   * gesto que navega (`onIrAUrl`, atrás, adelante, ir) vuelve a poner `null` él
   * mismo, en el mismo evento — no en un efecto aparte (`react-hooks/
   * set-state-in-effect`).
   */
  const [direccionEditada, setDireccionEditada] = useState<string | null>(null);
  const direccion = direccionEditada ?? nav.paginaActual.url;

  const inicioRef = useRef(0);
  useEffect(() => {
    inicioRef.current = Date.now();
  }, []);
  const e1HechoRef = useRef(false);
  const e2HechoRef = useRef(false);
  const penalizadosRef = useRef<Set<string>>(new Set());
  const hechosActoRef = useRef(0);

  /*
   * `pruebas`/`guion` viajan en `useState`, no en una `ref`: `react-hooks/refs`
   * prohíbe leer `.current` durante el render (lo prohíbe aunque sólo sea para
   * comprobar si ya existe), y decidir qué fase pintar es, precisamente, leerlo
   * durante el render. Como los dos se escriben UNA sola vez —al pasar de
   * fase, nunca dentro de un actualizador— un `useState` cumple exactamente la
   * misma regla del pliego («se fabrica una vez, al entrar en la fase 2») sin
   * chocar con la regla del canon.
   */
  const [pruebas, setPruebas] = useState<Prueba[] | null>(null);
  const [guion, setGuion] = useState<ReturnType<typeof crearGuion> | null>(null);

  const decir = useCallback((linea: string) => setHistorial((prev) => [...prev, linea]), []);

  const penalizarSiEsNueva = useCallback(
    (url: string) => {
      if (!penalizadosRef.current.has(url)) {
        penalizadosRef.current.add(url);
        labActividad.restar();
      }
    },
    [labActividad],
  );

  const alMarcar = useCallback(
    (url: string) => {
      nav.marcar(url);
      if (url === URL_ANUNCIO) {
        decir('Ese lleva la etiqueta de anuncio. Está escrito para venderte algo, no para informarte.');
        penalizarSiEsNueva(url);
      } else if (url === URL_SIN_FIRMA) {
        decir('Este otro no dice quién lo escribió ni cuándo. No es que sea falso: es que nadie puede comprobarlo.');
        penalizarSiEsNueva(url);
      } else if (url === URL_ARTICULO_A || url === URL_ARTICULO_B) {
        decir('Firmado y con fecha. Ése sí se puede comprobar, y por eso sirve.');
      } else if (url === URL_ESCUELA) {
        decir('Falta la mejor de todas, y no está en internet. La midieron ustedes, cinco días, en el bote del que estamos hablando.');
      }
    },
    [nav, decir, penalizarSiEsNueva],
  );

  const alDesmarcar = useCallback((url: string) => nav.desmarcar(url), [nav]);

  const pasarAFase2 = useCallback(() => {
    // Se congela AQUÍ, en el gesto — nunca dentro de un actualizador de
    // `setState` — y de una sola vez: `nav.marcadores` no se vuelve a mirar
    // después de esto (DISEÑO, «las tres reglas», regla 2).
    setPruebas(desdeMarcadores(nav.marcadores, MAPA_SITIOS));
    setGuion(crearGuion());
    setFase('presentar');
  }, [nav]);

  const intentarSeguirE1 = useCallback(() => {
    const okA = nav.estaMarcada(URL_ARTICULO_A);
    const okB = nav.estaMarcada(URL_ARTICULO_B);
    const malAnuncio = nav.estaMarcada(URL_ANUNCIO);
    const malSinFirma = nav.estaMarcada(URL_SIN_FIRMA);
    if (okA && okB && !malAnuncio && !malSinFirma) {
      if (!e1HechoRef.current) {
        e1HechoRef.current = true;
        labActividad.avanzar();
      }
      decir('Falta la mejor de todas, y no está en internet.');
      setSub('e2');
      return;
    }
    decir('Todavía te falta guardar lo que sirve para sostener algo. Guarda con la estrella sólo eso.');
  }, [nav, labActividad, decir]);

  const elegirMotivo = useCallback(
    (i: number) => {
      if (!nav.estaMarcada(URL_ESCUELA)) {
        decir('Primero guarda la página de la escuela con la estrella.');
        return;
      }
      if (i === 1) {
        if (!e2HechoRef.current) {
          e2HechoRef.current = true;
          labActividad.avanzar();
        }
        decir('Para tu pregunta, un dato que mediste tú le gana a cualquier página del mundo.');
        pasarAFase2();
        return;
      }
      decir('Ese no es el motivo. Vuelve a mirar: ¿qué tiene esta tabla que no tiene ninguna página?');
    },
    [nav, labActividad, decir, pasarAFase2],
  );

  const alAvanzarActo2 = useCallback(
    (f: number) => {
      const objetivo = Math.round(f * PASOS_ACTO_2);
      while (hechosActoRef.current < objetivo) {
        hechosActoRef.current += 1;
        labActividad.avanzar();
      }
    },
    [labActividad],
  );

  const alTerminarPresentacion = useCallback(
    (r: { pasos: number; tropiezos: number; segundos: number }) => {
      for (let i = 0; i < r.tropiezos; i += 1) labActividad.restar();
      labActividad.terminar(Math.round((Date.now() - inicioRef.current) / 1000));
    },
    [labActividad],
  );

  if (portadaAbierta) {
    return <PortadaWeb portada={PORTADA} onEmpezar={() => setPortadaAbierta(false)} />;
  }

  if (fase === 'presentar' && guion && pruebas) {
    return (
      <VentanaDiapositivas
        cinta={CINTA_PPT_INTERMEDIO}
        guion={guion}
        galerias={{ 'gráfico': TIPOS_GRAFICO, imagen: galeriaDePruebas(pruebas) }}
        panelFijo={{ titulo: 'La tabla del grupo', Cuerpo: PanelDelProyecto }}
        escenario={AuditorioDelProyecto}
        escenarioCuando={(pasoId) =>
          pasoId === 'de-donde-sacaste-ese-numero' || pasoId === 'y-en-las-otras-escuelas' || pasoId === 'que-proponen'
        }
        onAvance={alAvanzarActo2}
        onTerminado={alTerminarPresentacion}
        onSalir={alSalir}
        minutos={20}
        insignia={{
          nombre: 'Lo sostengo con datos',
          emoji: '🎓',
          titulo: 'Cierras la primaria',
          detalle:
            'Guardaste sólo lo que servía y dejaste fuera el anuncio. Escribiste lo que ibas a sostener **antes** de elegir la gráfica, y por eso las dos dicen lo mismo. Y cuando el público preguntó por algo que no habías medido, dijiste **eso no lo medimos** — la respuesta más difícil y la más honesta de toda la primaria.',
        }}
      />
    );
  }

  return (
    <VentanaBase marca="Tecnia Navegador" subtitulo="Investigar">
      <div className="pin-cuerpo">
        <div className="pin-navegador">
          <VentanaNavegador
            pestanas={nav.pestanas.map((p) => ({
              id: p.id,
              activa: p.id === nav.activaId,
              titulo: paginaDe(MAPA_SITIOS, p.url).pestana,
            }))}
            pagina={nav.paginaActual}
            puedeAtras={nav.puedeAtras}
            puedeAdelante={nav.puedeAdelante}
            marcada={nav.estaMarcada(nav.paginaActual.url)}
            barraDireccion={{
              valor: direccion,
              onCambiar: setDireccionEditada,
              onIr: () => {
                nav.navegar(direccion);
                setDireccionEditada(null);
              },
            }}
            onAtras={() => {
              nav.atras();
              setDireccionEditada(null);
            }}
            onAdelante={() => {
              nav.adelante();
              setDireccionEditada(null);
            }}
            onIrAUrl={(url) => {
              nav.navegar(url);
              setDireccionEditada(null);
            }}
            onMarcar={() => alMarcar(nav.paginaActual.url)}
            onDesmarcar={() => alDesmarcar(nav.paginaActual.url)}
          />
        </div>

        <div className="pin-panel" data-testid="pin-panel-bit">
          <div className="pin-historial">
            {historial.map((linea, i) => (
              <p key={i}>{linea}</p>
            ))}
          </div>

          {sub === 'e1' && (
            <button type="button" className="pin-boton" data-testid="pin-seguir-e1" onClick={intentarSeguirE1}>
              Ya guardé lo que sirve → Seguir
            </button>
          )}

          {sub === 'e2' && (
            <div className="pin-opciones">
              <p className="pin-pregunta">¿Por qué es la mejor fuente para esta pregunta?</p>
              <button type="button" onClick={() => elegirMotivo(0)}>
                Porque es la más nueva
              </button>
              <button type="button" onClick={() => elegirMotivo(1)}>
                Porque la medimos nosotros, en el bote del que hablamos
              </button>
              <button type="button" onClick={() => elegirMotivo(2)}>
                Porque tiene más números
              </button>
            </div>
          )}

          {alSalir && (
            <button type="button" className="pin-salir" onClick={alSalir}>
              Salir
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

export default LabProyectoIntegrador;
