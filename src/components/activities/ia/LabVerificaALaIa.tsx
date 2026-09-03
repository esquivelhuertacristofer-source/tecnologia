'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente } from '@/components/simuladores/asistente';
import { VentanaNavegador, useNavegador, paginaDe } from '@/components/simuladores/navegador';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  CITA_TEXTO,
  ETIQUETA_SENAL,
  FICHA_PEDIR_CIERRE,
  FICHA_PREGUNTAR_1,
  FICHA_PREGUNTAR_2,
  FILAS_ACTO1,
  FILAS_ACTO3,
  GUION_CLASE,
  MAPA_SITIOS,
  OPCIONES_CIERRE,
  OPCIONES_CITA,
  RESPUESTA_ACTO_1_2,
  TODAS_LAS_FILAS,
  TOTAL_ENCARGOS,
  URL_INFORME_P40,
  URL_INICIO,
  agregarPrueba,
  filaPorId,
  puedeConfirmar,
  puedeJuzgar,
  pruebaDeParrafo,
  pruebaDeVacio,
  type Chip,
  type Fila,
  type OpcionCierre,
  type OpcionCita,
  type Prueba,
  type Veredicto,
} from './verificaALaIa';
import './salaIA.css';
import './verificaALaIa.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N7 · «IA I», parada 3 · `n7-verifica-a-la-ia`
 * 1.º de secundaria · 12–13 años (comprobado en `src/data/curriculo.ts:697`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ver `DISENO-N7-n7-verifica-a-la-ia.md` para el porqué de cada decisión. En
 * resumen: dos programas abiertos a la vez —Tecnia Asistente (el chat) y
 * Tecnia Consulta (el navegador, estrenado aquí)— y entre los dos, la Hoja
 * de verificación, que vive en el hueco `panel` de `VentanaAsistente`.
 *
 * ── El riesgo nº 1: que la interfaz delate la verdad ──────────────────────
 *
 * `fila.correcto` (la Hoja) nunca se pinta en una clase CSS ni en un
 * `data-` antes de que la fila esté resuelta. `ParteRespuesta.veracidad` del
 * guion NUNCA se rellena en este archivo —las cuatro afirmaciones no
 * necesitan que el armazón esconda nada porque aquí no hay nada que
 * esconder—, así que la garantía «la verdad no llega al DOM» de
 * `VentanaAsistente` queda intacta sin ni siquiera rozarla.
 *
 * ── Los cuatro estados de una fila, y por qué no se pueden saltar ─────────
 *
 *   1 · ANCLAR   `elegirAncla`     escribe `fila.ancla`
 *   2 · BUSCAR    ocurre en Tecnia Consulta, aparte, y nunca resta
 *   3 · ADJUNTAR  `agregarPruebaAFila`  crece `fila.pruebas`
 *   4 · JUZGAR    `darVeredicto`    sólo se puede pulsar si `puedeJuzgar`/
 *                 `puedeConfirmar` lo habilitan, y sólo SELLA la fila
 *                 (`resuelta = true`) si el veredicto es el correcto — uno
 *                 equivocado resta y dEJA LA FILA ABIERTA para reintentar.
 *
 * ── El gasto del acto 3 ────────────────────────────────────────────────────
 *
 * Cada fila del acto 3 cuesta UNA consulta la primera vez que recibe una
 * prueba (`filasCosteadas`); una segunda prueba a esa misma fila, mientras
 * queden consultas, es gratis. En cuanto `consultas === 0` se apaga el 📎 de
 * TODAS las filas del acto 3, tal como lo dice el pliego, y aparece el único
 * camino: «Cerrar la ficha».
 */

type Fase = 'portada' | 'acto1' | 'acto2' | 'acto3' | 'cierre' | 'fin';

interface EstadoFila {
  ancla: string | null;
  pruebas: readonly Prueba[];
  veredicto: Veredicto | null;
  resuelta: boolean;
}

const filaVacia = (): EstadoFila => ({ ancla: null, pruebas: [], veredicto: null, resuelta: false });
const filasIniciales = (): Record<string, EstadoFila> =>
  Object.fromEntries(TODAS_LAS_FILAS.map((f) => [f.id, filaVacia()]));

/**
 * Fuera del componente a propósito: `Date.now()` es impuro, y sacar la
 * lectura del reloj a una función de módulo evita que el linter de pureza
 * (`react-hooks/purity`) tenga que probar que la llamada sólo ocurre desde
 * un gesto y no desde el cuerpo de render.
 */
function segundosDesde(inicio: number): number {
  return Math.max(1, Math.round((Date.now() - inicio) / 1000));
}

const PORTADA: DatosPortadaIA = {
  situacion: 'Tienes que entregar una ficha de Historia y Tecnología sobre cómo llegó Internet a México, y ya le preguntaste a un asistente.',
  tema: 'Verifica lo que dice la IA',
  objetivo:
    'Comprobar cada afirmación de una IA en una fuente independiente, y saber qué hacer con las tres respuestas posibles: confirmada, contradicha y sin respaldo.',
  vasAHacer: [
    'Trocear la respuesta y elegir qué de cada frase se puede comprobar.',
    'Buscarlo en el Archivo y en la Enciclopedia, y adjuntar el párrafo como prueba.',
    'Descubrir que dos fuentes que se copian cuentan como una.',
    'Decidir qué comprobar cuando ya no queda tiempo.',
  ],
  encargos: TOTAL_ENCARGOS,
  minutos: 25,
  insignia: { nombre: 'Lo comprobé yo', emoji: '🔍' },
  boton: 'Abrir Tecnia Asistente y Tecnia Consulta',
  acento: '#22d3ee',
};

// ── Sub-vistas de la Hoja, con todo por parámetro ───────────────────────────

function ChapaSenal({ id }: { id: number }) {
  if (id === 6) return <span className="tva-chapa-senal es-sin-pistas">Sin pistas</span>;
  return <span className="tva-chapa-senal">{ETIQUETA_SENAL[id]}</span>;
}

function Chapas({ senales }: { senales: readonly number[] }) {
  if (senales.length === 0) return <ChapaSenal id={6} />;
  return (
    <>
      {senales.map((s) => (
        <ChapaSenal key={s} id={s} />
      ))}
    </>
  );
}

interface IndiceProps {
  filas: readonly Fila[];
  estados: Record<string, EstadoFila>;
  activa: string | null;
  onElegir: (id: string) => void;
}

function Indice({ filas, estados, activa, onElegir }: IndiceProps) {
  return (
    <div className="tva-indice" data-testid="tva-indice">
      {filas.map((f, i) => {
        const estado = estados[f.id];
        return (
          <button
            key={f.id}
            type="button"
            className={`tva-indice-fila${activa === f.id ? ' es-activa' : ''}${estado?.resuelta ? ' es-resuelta' : ''}`}
            data-fila={f.id}
            onClick={() => onElegir(f.id)}
          >
            <span className="tva-indice-numero">{estado?.resuelta ? '✓' : i + 1}</span>
            <span className="tva-indice-chapas">
              <Chapas senales={f.senales} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface DetalleFilaProps {
  fila: Fila;
  estado: EstadoFila;
  onElegirAncla: (anclaId: string) => void;
  onVeredicto: (v: Veredicto) => void;
}

const VEREDICTOS: { id: Veredicto; etiqueta: string; icono: string }[] = [
  { id: 'confirmada', etiqueta: 'Confirmada', icono: '✅' },
  { id: 'contradicha', etiqueta: 'Contradicha', icono: '⛔' },
  { id: 'sin-respaldo', etiqueta: 'Sin respaldo', icono: '❔' },
];

function DetalleFila({ fila, estado, onElegirAncla, onVeredicto }: DetalleFilaProps) {
  if (estado.resuelta) {
    const dado = VEREDICTOS.find((v) => v.id === estado.veredicto);
    return (
      <div className="tva-resuelta" data-testid="tva-resuelta">
        {dado?.icono} {dado?.etiqueta} · {estado.pruebas.length} {estado.pruebas.length === 1 ? 'prueba' : 'pruebas'} adjunta
        {estado.pruebas.length === 1 ? '' : 's'}.
      </div>
    );
  }

  const relevantes = estado.ancla ? estado.pruebas.filter((p) => p.hablaDe.includes(estado.ancla as string)) : [];
  const habilitaJuzgar = puedeJuzgar(estado.pruebas, estado.ancla);
  const habilitaConfirmar = puedeConfirmar(estado.pruebas, estado.ancla);

  // La imagen central de la clase: dos pruebas relevantes, misma fuente raíz.
  const copiaDetectada =
    relevantes.length >= 2 &&
    !habilitaConfirmar &&
    relevantes.some((a, i) => relevantes.slice(i + 1).some((b) => a.texto === b.texto));

  return (
    <div className="tva-detalle" data-testid="tva-detalle">
      <div>
        <p className="tva-paso-etiqueta">1 · Ancla en lo que se puede comprobar</p>
        <div className="tva-anclas">
          {fila.anclas.map((chip: Chip) => (
            <button
              key={chip.id}
              type="button"
              className={`tva-ancla${estado.ancla === chip.id ? ' es-elegida' : ''}`}
              data-ancla={chip.id}
              onClick={() => onElegirAncla(chip.id)}
            >
              {chip.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="tva-paso-etiqueta">3 · Pruebas adjuntadas</p>
        <div className="tva-contador-pruebas" data-testid="tva-contador">
          <span className={`tva-casilla${estado.pruebas.length >= 1 ? ' es-llena' : ''}`} />
          <span className={`tva-casilla${estado.pruebas.length >= 2 ? ' es-llena' : ''}`} />
          <span>{estado.pruebas.length} adjuntada{estado.pruebas.length === 1 ? '' : 's'}</span>
        </div>
        {estado.pruebas.length === 0 && <p className="tva-prueba-nota">Abre una página en Tecnia Consulta y adjúntala aquí.</p>}
        <div className="tva-pruebas">
          {estado.pruebas.map((p, i) => (
            <div key={`${p.url}-${i}`} className={`tva-prueba${p.esVacio ? ' es-vacio' : ''}`}>
              <span className="tva-prueba-fuente">
                {p.autor ?? 'Sin autor'} · {p.fecha ?? 'Sin fecha'}
              </span>
              {p.esVacio ? <span className="tva-prueba-etiqueta-vacio">{p.texto}</span> : p.texto}
              {!p.hablaDe.includes(estado.ancla ?? '') && (
                <p className="tva-prueba-nota">Este párrafo no habla de lo que estás comprobando.</p>
              )}
            </div>
          ))}
        </div>

        {copiaDetectada && (
          <div className="tva-copia" data-testid="tva-copia">
            <p className="tva-copia-titulo">Los mismos párrafos, palabra por palabra</p>
            <p className="tva-copia-parrafo">{relevantes[0].texto}</p>
            <p className="tva-copia-parrafo">{relevantes[1].texto}</p>
            <p className="tva-copia-pie">Con información del Archivo Tecnia. Copiar no es confirmar: busca una tercera fuente.</p>
          </div>
        )}
      </div>

      <div>
        <p className="tva-paso-etiqueta">4 · Juzga</p>
        <div className="tva-veredictos">
          {VEREDICTOS.map((v) => {
            const habilitado = v.id === 'confirmada' ? habilitaConfirmar : habilitaJuzgar;
            return (
              <button
                key={v.id}
                type="button"
                className={`tva-veredicto es-${v.id}`}
                data-veredicto={v.id}
                disabled={!habilitado}
                onClick={() => onVeredicto(v.id)}
              >
                <span className="tva-veredicto-icono" aria-hidden="true">
                  {v.icono}
                </span>
                {v.etiqueta}
              </button>
            );
          })}
        </div>
        <p className="tva-veredicto-motivo">
          {habilitaConfirmar
            ? 'Con dos pruebas independientes, puedes confirmarla.'
            : habilitaJuzgar
              ? `Con una prueba alcanza para Contradicha o Sin respaldo. Confirmada pide una segunda que no copie a la primera.`
              : 'Adjunta al menos una prueba que hable de lo que elegiste anclar.'}
        </p>
      </div>
    </div>
  );
}

interface BandaAdjuntarProps {
  pagina: (typeof MAPA_SITIOS)[string];
  puedeAdjuntar: boolean;
  onAdjuntarParrafo: (indice: number) => void;
  onAdjuntarVacio: () => void;
}

function BandaAdjuntar({ pagina, puedeAdjuntar, onAdjuntarParrafo, onAdjuntarVacio }: BandaAdjuntarProps) {
  const cuerpo = pagina.cuerpo;
  return (
    <div className="tva-banda" data-testid="tva-banda">
      <p className="tva-banda-titulo">Adjuntar como prueba</p>
      {cuerpo.tipo === 'articulo' &&
        cuerpo.parrafos.map((texto, i) => (
          <div className="tva-banda-item" key={i}>
            <span className="tva-banda-texto">{texto}</span>
            <button
              type="button"
              className="tva-banda-boton"
              data-testid="tva-adjuntar"
              disabled={!puedeAdjuntar}
              onClick={() => onAdjuntarParrafo(i)}
            >
              📎 Adjuntar
            </button>
          </div>
        ))}
      {cuerpo.tipo === 'vacio' && (
        <div className="tva-banda-item">
          <span className="tva-banda-texto">{cuerpo.mensaje}</span>
          <button
            type="button"
            className="tva-banda-boton"
            data-testid="tva-adjuntar-vacio"
            disabled={!puedeAdjuntar}
            onClick={onAdjuntarVacio}
          >
            📎 Adjuntar
          </button>
        </div>
      )}
      {cuerpo.tipo === 'resultados' && <p className="tva-banda-vacio">Abre uno de los resultados para leerlo y adjuntarlo.</p>}
      {cuerpo.tipo === 'ficha' && <p className="tva-banda-vacio">Esta página no tiene nada que adjuntar.</p>}
    </div>
  );
}

// ── El laboratorio ───────────────────────────────────────────────────────

export function LabVerificaALaIa(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [filas, setFilas] = useState<Record<string, EstadoFila>>(filasIniciales);
  const [parteActiva, setParteActiva] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [consultas, setConsultas] = useState(2);
  const [filasCosteadas, setFilasCosteadas] = useState<Set<string>>(new Set());
  const [acto2Elegida, setActo2Elegida] = useState<OpcionCita | null>(null);
  const [acto2Resuelto, setActo2Resuelto] = useState(false);
  const [cierreElegida, setCierreElegida] = useState<OpcionCierre | null>(null);
  const [cierreResuelto, setCierreResuelto] = useState(false);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_ENCARGOS);
  const ia = useAsistente({ guion: GUION_CLASE, saludo: RESPUESTA_ACTO_1_2, velocidad: 0 });
  const nav = useNavegador({ mapa: MAPA_SITIOS, inicio: URL_INICIO });

  const seleccionarFila = (id: string) => {
    if (lab.terminado || parteActiva === id) return;
    reproducirTono('select');
    const anterior = parteActiva;
    setParteActiva(id);
    if (anterior && !filas[anterior]?.resuelta) ia.marcarParte(anterior, 'oculta');
    if (!filas[id]?.resuelta) ia.marcarParte(id, 'senalada');
  };

  const elegirAncla = (filaId: string, anclaId: string) => {
    const chip = filaPorId(filaId)?.anclas.find((a) => a.id === anclaId);
    if (!chip) return;
    setFilas((prev) => ({ ...prev, [filaId]: { ...prev[filaId], ancla: anclaId } }));
    setDireccion(chip.consulta);
  };

  const agregarPruebaAFila = (filaId: string, prueba: Prueba) => {
    const estado = filas[filaId];
    const filaDef = filaPorId(filaId);
    if (!estado || !filaDef || estado.resuelta) return;

    const yaEstaba = estado.pruebas.some((p) => p.url === prueba.url && p.texto === prueba.texto);
    const esActo3 = FILAS_ACTO3.some((f) => f.id === filaId);

    if (esActo3 && !yaEstaba && !filasCosteadas.has(filaId)) {
      if (consultas <= 0) return; // el 📎 debería estar apagado; defensa por si acaso
      setConsultas((c) => c - 1);
      setFilasCosteadas((prev) => new Set(prev).add(filaId));
      lab.avanzar(); // encargo «gasto-1» o «gasto-2»
      if (!filaDef.vaEnElTrabajo) {
        lab.restar();
        hablar('Con el tiempo que te queda, no es ahí. Esa frase no va en tu trabajo.');
      } else {
        hablar('Gastaste una consulta ahí. Vamos a ver qué encuentras.');
      }
    }

    reproducirTono(yaEstaba ? 'select' : 'correct');
    setFilas((prev) => ({ ...prev, [filaId]: { ...prev[filaId], pruebas: agregarPrueba(prev[filaId].pruebas, prueba) } }));
  };

  const adjuntarParrafo = (indice: number) => {
    if (!parteActiva) return;
    const prueba = pruebaDeParrafo(nav.paginaActual, indice);
    if (!prueba) return;
    agregarPruebaAFila(parteActiva, prueba);
  };

  const adjuntarVacio = () => {
    if (!parteActiva) return;
    const prueba = pruebaDeVacio(nav.paginaActual, filas[parteActiva]?.ancla ?? null);
    if (!prueba) return;
    agregarPruebaAFila(parteActiva, prueba);
  };

  const darVeredicto = (filaId: string, veredicto: Veredicto) => {
    const estado = filas[filaId];
    const filaDef = filaPorId(filaId);
    if (!estado || !filaDef || estado.resuelta) return;
    const habilitado = veredicto === 'confirmada' ? puedeConfirmar(estado.pruebas, estado.ancla) : puedeJuzgar(estado.pruebas, estado.ancla);
    if (!habilitado) return;

    const esCorrecto = filaDef.correcto === null || filaDef.correcto === veredicto;
    if (!esCorrecto) {
      lab.restar();
      hablar('Vuelve a mirar la prueba: no sostiene ese veredicto.');
      return;
    }

    reproducirTono('correct');
    setFilas((prev) => ({ ...prev, [filaId]: { ...prev[filaId], veredicto, resuelta: true } }));
    ia.marcarParte(filaId, 'acierto');

    if (FILAS_ACTO1.some((f) => f.id === filaId)) {
      lab.avanzar();
      /*
       * La transición acto1→acto2 se dispara desde ESTE gesto, no desde un
       * efecto (regla de la casa: el aviso sale del gesto). `filas` todavía
       * no tiene la actualización de arriba —`setFilas` es asíncrono—, así
       * que comprobar «las OTRAS tres ya estaban resueltas» sobre el estado
       * actual equivale exactamente a «las cuatro quedan resueltas tras
       * ésta».
       */
      const eraLaUltima = FILAS_ACTO1.filter((f) => f.id !== filaId).every((f) => filas[f.id]?.resuelta);
      if (eraLaUltima) {
        setFase('acto2');
        hablar(CITA_TEXTO);
      } else {
        hablar(
          veredicto === 'confirmada'
            ? 'Confirmada de verdad, no sólo porque suene segura.'
            : veredicto === 'contradicha'
              ? 'La corriges y sigues. Así se escribe distinto en tu trabajo.'
              : 'Nadie la sostiene. No es lo mismo que sea mentira, y por eso tiene su propio botón.',
        );
      }
    }
  };

  const irABuscar = () => {
    if (direccion.trim() === '') return;
    nav.buscar(direccion);
  };

  const irAUrl = (url: string) => {
    nav.navegar(url);
    setDireccion(url);
  };

  const compositorFichas =
    fase === 'acto3' || fase === 'cierre'
      ? [{ id: FICHA_PREGUNTAR_2, etiqueta: 'Pregúntale otra vez', icono: '💬' }]
      : fase === 'acto2'
        ? [
            { id: FICHA_PREGUNTAR_1, etiqueta: 'Pregúntale otra vez', icono: '💬' },
            { id: FICHA_PEDIR_CIERRE, etiqueta: 'Pídele el cierre del trabajo', icono: '✍️' },
          ]
        : [{ id: FICHA_PREGUNTAR_1, etiqueta: 'Pregúntale otra vez', icono: '💬' }];

  const onEnviarFicha = (id: string) => {
    /*
     * `VentanaAsistente` avisa el clic con el id pelado (`compositor.
     * onEnviarFicha?.(f.id)`), pero `useAsistente.enviarFicha` acepta el
     * objeto completo — y hace falta pasarlo así: si se le pasa sólo el id,
     * la burbuja del alumno queda con el id interno («pedir-cierre») en vez
     * de un texto legible. `pregunta` es lo que se escribe en esa burbuja.
     */
    const ficha = compositorFichas.find((f) => f.id === id);
    if (!ficha) return;
    const resultado = ia.enviarFicha({ id: ficha.id, etiqueta: ficha.etiqueta, pregunta: ficha.etiqueta });
    if (resultado !== 'enviado') return;

    if (id === FICHA_PREGUNTAR_1 || id === FICHA_PREGUNTAR_2) {
      lab.restar();
      hablar('Ya te lo dijo. Preguntar otra vez no comprueba nada: te repite lo mismo, esté bien o mal.');
      return;
    }
    if (id === FICHA_PEDIR_CIERRE) {
      setFase('acto3');
      setConsultas(2);
      hablar('Llegaron cinco frases más, y sólo te alcanza para comprobar dos. Elige bien dónde gastarlas.');
    }
  };

  const elegirOpcionCita = (opcion: OpcionCita) => {
    if (fase !== 'acto2' || acto2Resuelto) return;
    if (!nav.historial.some((h) => h.url === URL_INFORME_P40)) return;
    const def = OPCIONES_CITA.find((o) => o.id === opcion);
    if (!def) return;
    if (!def.ok) {
      lab.restar();
      setActo2Elegida(opcion);
      hablar(def.ayuda);
      return;
    }
    reproducirTono('correct');
    setActo2Elegida(opcion);
    setActo2Resuelto(true);
    lab.avanzar();
    hablar('Existe, y no dice eso. Es la trampa más eficaz de todas: una cita da autoridad sin dar acceso.');
  };

  const cerrarLaFicha = () => {
    if (fase !== 'acto3' || consultas > 0) return;
    reproducirTono('select');
    setFase('cierre');
    hablar('Antes de entregar: ¿qué haces con lo que no alcanzaste a comprobar?');
  };

  const responderCierre = (opcion: OpcionCierre) => {
    if (fase !== 'cierre' || cierreResuelto) return;
    const def = OPCIONES_CIERRE.find((o) => o.id === opcion);
    if (!def) return;
    if (!def.ok) {
      lab.restar();
      setCierreElegida(opcion);
      hablar(def.ayuda);
      return;
    }
    reproducirTono('correct');
    setCierreElegida(opcion);
    setCierreResuelto(true);
    lab.avanzar();
    const segundos = segundosDesde(lab.sim.current.inicio);
    setFase('fin');
    lab.terminar(segundos, () => hablar('¡Ficha lista, y sin inventar nada que no comprobaste!'));
  };

  const repetir = () => {
    setFilas(filasIniciales());
    setParteActiva(null);
    setDireccion('');
    setConsultas(2);
    setFilasCosteadas(new Set());
    setActo2Elegida(null);
    setActo2Resuelto(false);
    setCierreElegida(null);
    setCierreResuelto(false);
    ia.reiniciar();
    nav.reiniciar();
    lab.reiniciar(() => hablar('Otra vez, desde el principio.'));
    setFase('acto1');
  };

  const onEmpezar = () => {
    reproducirTono('power');
    setFase('acto1');
    hablar('Lee las cuatro afirmaciones y elige con cuál empezar.');
  };

  // ── Derivados para pintar ────────────────────────────────────────────────

  const resueltasActo1 = FILAS_ACTO1.filter((f) => filas[f.id]?.resuelta).length;
  const filasTrabajo = FILAS_ACTO3.filter((f) => f.vaEnElTrabajo);
  const filaSinComprobar = filasTrabajo.find((f) => !filasCosteadas.has(f.id));

  const marcador =
    fase === 'acto3' || fase === 'cierre' ? { etiqueta: 'Consultas', valor: `${consultas}` } : { etiqueta: 'Pruebas', valor: `${resueltasActo1}/4` };

  const filasDeLaHoja = fase === 'acto3' || fase === 'cierre' ? FILAS_ACTO3 : FILAS_ACTO1;
  const filaActivaDef = parteActiva ? filaPorId(parteActiva) : null;
  const estadoActivo = parteActiva ? filas[parteActiva] : null;

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Verifica lo que dice la IA"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_ENCARGOS : lab.pasos}
        pasosTotal={TOTAL_ENCARGOS}
        marcadorEtiqueta={marcador.etiqueta}
        marcadorValor={marcador.valor}
        bit={fase === 'portada' || fase === 'fin' ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Lo comprobé yo',
                insigniaEmoji: '🔍',
                titulo: '¡La ficha quedó a salvo!',
                detalle:
                  'Troceaste la respuesta en afirmaciones, comprobaste cada una en una fuente independiente, cazaste una copia disfrazada de segunda opinión y, cuando ya no dio tiempo para todo, elegiste qué comprobar en vez de comprobarlo todo. Ni comprobando todo se está a salvo del todo — pero ahora sabes qué hacer con lo que no alcanzaste.',
                resumen: [
                  { etiqueta: 'Comprobadas', valor: `${TODAS_LAS_FILAS.filter((f) => filas[f.id]?.resuelta).length}` },
                  { etiqueta: 'Sin respaldo', valor: `${TODAS_LAS_FILAS.filter((f) => filas[f.id]?.veredicto === 'sin-respaldo').length}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase === 'portada' && <PortadaIA portada={PORTADA} onEmpezar={onEmpezar} />}

          {fase !== 'portada' && fase !== 'fin' && (
            <div className="tia-cuerpo">
              <div className="tva-caja-ventana">
                <VentanaBase marca="Tecnia Asistente" subtitulo="Chat guionizado" claseMarco="tia-marco">
                  <VentanaAsistente
                    className="tva-asistente"
                    mensajes={ia.mensajes}
                    escribiendo={ia.ocupado}
                    onSaltarTecleo={ia.saltarTecleo}
                    onTocarParte={seleccionarFila}
                    parteActiva={parteActiva}
                    vacio="Ábrelo para leer la respuesta."
                    compositor={{
                      titulo: 'Pídele al asistente',
                      deshabilitado: ia.ocupado,
                      fichas: compositorFichas,
                      onEnviarFicha,
                    }}
                    panel={
                      <div data-testid="tva-hoja">
                        <p className="tva-paso-etiqueta">Hoja de verificación</p>
                        <Indice filas={filasDeLaHoja} estados={filas} activa={parteActiva} onElegir={seleccionarFila} />

                        {fase === 'acto2' && (
                          <div className="tva-detalle">
                            <p className="tva-paso-etiqueta">El asistente se ofrece a citar</p>
                            <p className="tva-cita" data-testid="tva-cita">
                              «{CITA_TEXTO}»
                            </p>
                            <p className="tva-veredicto-motivo">
                              Busca el informe en Tecnia Consulta y ábrelo por su página 40 antes de elegir.
                            </p>
                            <div className="tva-opciones">
                              {OPCIONES_CITA.map((o) => (
                                <button
                                  key={o.id}
                                  type="button"
                                  className={`tva-opcion${acto2Elegida === o.id && !o.ok ? ' es-mal' : ''}`}
                                  data-opcion-cita={o.id}
                                  disabled={acto2Resuelto || !nav.historial.some((h) => h.url === URL_INFORME_P40)}
                                  onClick={() => elegirOpcionCita(o.id)}
                                >
                                  {o.etiqueta}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(fase === 'acto1' || fase === 'acto3') && filaActivaDef && estadoActivo && (
                          <DetalleFila
                            fila={filaActivaDef}
                            estado={estadoActivo}
                            onElegirAncla={(anclaId) => elegirAncla(filaActivaDef.id, anclaId)}
                            onVeredicto={(v) => darVeredicto(filaActivaDef.id, v)}
                          />
                        )}

                        {fase === 'acto3' && (
                          <div className="tva-detalle">
                            <p className="tva-consultas" data-testid="tva-consultas">
                              Consultas: {consultas}
                            </p>
                            {consultas === 0 && (
                              <button type="button" className="tva-opcion" data-testid="tva-cerrar-ficha" onClick={cerrarLaFicha}>
                                Cerrar la ficha →
                              </button>
                            )}
                          </div>
                        )}

                        {fase === 'cierre' && (
                          <div className="tva-detalle" data-testid="tva-revelacion">
                            <p className="tva-paso-etiqueta">Lo que había en las tres del trabajo</p>
                            <div className="tva-revelacion">
                              {filasTrabajo.map((f) => {
                                const sinTiempo = f.id === filaSinComprobar?.id;
                                return (
                                  <p key={f.id} className={`tva-revelacion-fila${sinTiempo ? ' es-sin-tiempo' : ''}`}>
                                    {sinTiempo ? 'No alcanzaste a comprobar ésta. ' : 'Sí la comprobaste. '}
                                    {f.correcto === 'contradicha' && 'Ojo: ésta es la que no se sostenía.'}
                                  </p>
                                );
                              })}
                            </div>
                            <p className="tva-veredicto-motivo">
                              {filaSinComprobar
                                ? filaSinComprobar.correcto === 'contradicha'
                                  ? 'Te faltó tiempo justo para la que estaba mal. No es culpa tuya: eran tres y tenías dos.'
                                  : 'Esta vez elegiste bien. No siempre se elige bien, y la que dejaste fuera también podía haber estado mal.'
                                : 'Comprobaste dos de las tres. Con la tercera, hubieras necesitado una consulta más.'}
                            </p>
                            <p className="tva-paso-etiqueta">Las que no alcanzaste, ¿qué haces con ellas?</p>
                            <div className="tva-opciones">
                              {OPCIONES_CIERRE.map((o) => (
                                <button
                                  key={o.id}
                                  type="button"
                                  className={`tva-opcion${cierreElegida === o.id && !o.ok ? ' es-mal' : ''}`}
                                  data-opcion-cierre={o.id}
                                  disabled={cierreResuelto}
                                  onClick={() => responderCierre(o.id)}
                                >
                                  {o.etiqueta}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </VentanaBase>
              </div>

              <div className="tva-caja-ventana">
                <VentanaBase
                  marca="Tecnia Consulta"
                  subtitulo="Archivo y Enciclopedia"
                  claseMarco="tia-marco"
                  barraEstado={
                    <BandaAdjuntar
                      pagina={nav.paginaActual}
                      puedeAdjuntar={Boolean(
                        parteActiva &&
                          !filas[parteActiva]?.resuelta &&
                          !(FILAS_ACTO3.some((f) => f.id === parteActiva) && consultas <= 0),
                      )}
                      onAdjuntarParrafo={adjuntarParrafo}
                      onAdjuntarVacio={adjuntarVacio}
                    />
                  }
                >
                  <VentanaNavegador
                    pestanas={nav.pestanas.map((p) => ({
                      id: p.id,
                      activa: p.id === nav.activaId,
                      titulo: paginaDe(MAPA_SITIOS, p.url).pestana,
                    }))}
                    pagina={nav.paginaActual}
                    puedeAtras={nav.puedeAtras}
                    puedeAdelante={nav.puedeAdelante}
                    barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: irABuscar }}
                    onAtras={() => nav.atras()}
                    onAdelante={() => nav.adelante()}
                    onRecargar={() => nav.recargar()}
                    onIrAUrl={irAUrl}
                  />
                </VentanaBase>
              </div>
            </div>
          )}
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabVerificaALaIa;
