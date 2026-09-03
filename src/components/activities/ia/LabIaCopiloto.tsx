'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente, type AccionAsistente, type ResultadoGuion } from '@/components/simuladores/asistente';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  EQUIPOS_CON_MEDALLA,
  EQUIPOS_PARTICIPANTES,
  FICHA_E0_PIDE,
  FICHA_E1_PIDE,
  FICHA_E3_PIDE,
  FICHA_E4_PIDE,
  FICHA_E5_PIDE,
  FICHA_E6_PIDE,
  GUION_IA_COPILOTO,
  OPCIONES_REFLEXION,
  PARTE_FALSA_ID,
  PUNTAJES_CON_DESCALIFICADOS,
  PUNTAJES_SIMPLE,
  TAREAS_CIERRE,
  TOTAL_ENCARGOS,
  formatResultado,
  promedioArreglado,
  promedioConBug,
  promedioSimple,
  type Destino,
} from './guionIaCopiloto';
import './salaIA.css';
import './iaCopiloto.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N9 · «IA y automatización», parada 2 de 3 · `n9-ia-copiloto`
 * 3.º de secundaria · 14–15 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ver la cabecera de `guionIaCopiloto.ts` para el arco completo de la clase
 * y para en qué se diferencia de `n9-automatiza-tareas` (parada 1, motor
 * Tecnia Bloques, reglas fijas) — aquí no hay ninguna regla que el alumno
 * escriba: hay un chat que sugiere, y el criterio de qué aceptar es suyo.
 *
 * ── Arquitectura: un solo `VentanaAsistente`, como `n8-genera-con-ia` ──────
 *
 * No hace falta un segundo programa (no hay nada que buscar en una fuente
 * externa, a diferencia de `n7-verifica-a-la-ia`): la fuente contra la que
 * se compara el párrafo del volante es un dato del propio trabajo —la hoja
 * de resultados—, así que vive en el panel de la misma ventana. Un solo
 * `VentanaBase` + `VentanaAsistente`, con el hilo estrecho y el panel ancho
 * invertidos (`.iac-asis`, el mismo truco que `.gia-asis`).
 *
 * ── Por qué el código nunca se ejecuta de verdad ────────────────────────
 *
 * Se investigó combinar esto con `SalaCodigo` (el intérprete real de
 * `src/components/simuladores/codigo/`, usado por las clases de Python de
 * N7–N8): técnicamente es otro armazón con su propio chasis (`ArcadeSala` +
 * `VentanaCodigo`/`useCodigo`) pensado para UNA ventana de editor, no para
 * vivir al lado de un chat — construir esa combinación exigiría el mismo
 * trabajo de `LabVerificaALaIa` (chasis a mano con dos ventanas), pero para
 * un solo ejercicio. La ganancia pedagógica no lo justificaba: lo que esta
 * clase enseña —probar una sugerencia con datos conocidos y comparar el
 * resultado contra la cuenta hecha a mano— no necesita que Python corra de
 * verdad, y `useAsistente`/`resolverGuion` ya garantiza (por tipo, no por
 * buena fe) que el «bug» del copiloto es exactamente el que escribió el
 * profesor, nunca uno improvisado. El código que se muestra es texto
 * literal del guion; el resultado de «Probar» es una función pura de este
 * archivo (`promedioConBug`, `promedioArreglado`) — determinista, sin
 * intérprete de por medio.
 *
 * ── Los dos arcos gemelos: código (3–4) y texto (5–6) ──────────────────────
 *
 * Los dos siguen el mismo compás —pedir, entregar, PROBAR/COMPARAR, juzgar—
 * a propósito: es la misma habilidad aplicada a dos materiales distintos, y
 * repetir la forma es lo que deja ver que es una habilidad, no una
 * casualidad del ejercicio del robot.
 */

type Fase = 'portada' | 'estudio';
type Veredicto = 'aceptar' | 'corregir';

const PORTADA: DatosPortadaIA = {
  situacion:
    'Eres del Club de Robótica y el reporte para la Feria de Ciencias de mañana no está terminado: falta una función en Python y un párrafo para el volante.',
  tema: 'La IA como copiloto',
  objetivo:
    'Vas a salir sabiendo cuándo pedirle ayuda a una IA generativa ahorra tiempo de verdad, cómo probar lo que te da —código o texto— antes de aceptarlo, y qué hacer cuando encuentras un error que no salta a la vista.',
  vasAHacer: [
    'Comparar una tarea donde pedir ayuda sobra con otra donde sí conviene.',
    'Probar una función que te da el copiloto antes de darla por buena.',
    'Encontrar un error que no truena: el programa corre, pero el número está mal.',
    'Cazar un dato inventado en un párrafo que se lee perfecto.',
    'Decidir, en una lista real de tareas, cuáles le tocan al copiloto y cuáles a ti.',
  ],
  encargos: TOTAL_ENCARGOS,
  minutos: 20,
  insignia: { nombre: 'Copiloto con criterio', emoji: '🧑‍✈️' },
  boton: 'Abrir Tecnia Asistente',
  acento: '#818cf8',
};

const BIT = {
  inicio:
    'Soy tu copiloto para el reporte de mañana. Te ayudo con lo que pidas — pero lo que se entrega, lo revisas tú. Empecemos con algo sencillo: en el panel tienes dos caminos para el letrero de la entrada.',
  pruebaPrimero: 'Pruébala primero: pulsa «Probar» antes de decidir.',
  pideloPrimero: 'Pídeselo primero al copiloto con el botón de abajo.',

  e0PideNoLogra:
    'Lo hice bien, sí: FERIA DE CIENCIAS 2026. Pero mira lo que costó — escribir la petición, esperar, leer la respuesta — para algo que tú hubieras escrito en el mismo tiempo. Pedirme ayuda no es gratis: cuesta el tiempo de armar la petición y revisar lo que contesto. Para esto, hazlo tú.',
  e0TuLogra:
    'Exacto: FERIA DE CIENCIAS 2026, en un solo paso. Cuando ya sabes hacer algo y es rápido, pedir ayuda no ahorra tiempo — lo gasta. Ahora algo distinto.',

  entra1:
    'Necesitas una función en Python que calcule el promedio de los puntajes de un robot: [78, 85, 92, 88]. Escribirla a mano no es difícil, pero hay que acordarse de sumar y dividir bien — un error de dedo y el resultado sale mal sin avisar. Elige un camino.',
  e1TuNoLogra:
    'Podrías, pero aquí sí hay lógica de por medio: sumar la lista completa y dividir entre cuántos son. Es justo el tipo de tarea donde pedir ayuda gana tiempo Y baja el riesgo de un error de dedo. Pídesela al copiloto.',
  e1PideLogra:
    'Ahí la tienes: una función de dos líneas. Antes de darla por buena, vas a probarla — nunca se acepta código sólo porque se ve bien escrito.',

  entra2: 'Antes de aceptar la función, pruébala con los datos reales del robot.',
  e2NoLogra:
    'Vuelve a mirar la cuenta: 78+85+92+88 es 343, y 343 entre 4 es 85.75 — exactamente lo que dio. La función está bien. Pedir que la corrija cuando ya funciona no es el criterio correcto.',
  e2Logra: 'Bien: la probaste antes de aceptarla, y el número cuadra. Eso es evaluar, no sólo copiar y pegar.',

  entra3: 'Ahora necesitas una versión que ignore a los robots descalificados (marcados con -1). Pídesela al copiloto.',
  e3Entrego:
    'Aquí tienes: filtra los descalificados antes de promediar. Pruébala antes de darla por buena — que la anterior estuviera bien no significa que ésta también lo esté.',
  e3NoLogra:
    'Vuelve a hacer la cuenta tú: de [80, -1, 90, 100], los válidos son 80, 90 y 100. Súmalos y divide entre TRES, no entre cuatro. ¿Te da lo mismo que mostró el copiloto?',
  e3Logra:
    'Ahí está: el programa no truena, corre perfecto — y aun así el número está mal. Filtró la lista para sumar, pero se le olvidó filtrarla también para contar cuántos eran. Es el error más difícil de cazar: uno que no lanza ningún error.',

  entra4: 'Pídele que la corrija.',
  e4Entrego: 'Ahí va, corregida. Vuelve a probarla con los mismos datos antes de aceptarla — no basta con que «diga» que ya la arregló.',
  e4NoLogra: 'Vuelve a mirar: ahora sí divide entre los válidos. 80+90+100 es 270, y 270 entre 3 es 90 — es la cuenta correcta. Ya está bien.',
  e4Logra: '90.0, y coincide con la cuenta a mano. Ahora sí, la puedes usar.',

  entra5: 'Con el código listo, falta el párrafo para el volante. Pídeselo al copiloto y compáralo con la hoja de resultados real.',
  e5Entrego: 'Ahí tienes el párrafo. Compáralo con la hoja de resultados de la derecha, frase por frase, y toca en el chat la parte que no cuadre.',
  e5NoLogra: 'Ésa coincide con la hoja de resultados; no hace falta tocarla. Sigue leyendo.',
  e5Logra:
    'Ahí está: dice que ganaron medalla 5 equipos, y la hoja real dice 3. Un párrafo se puede leer perfecto —bien escrito, sin faltas— y aun así traer un dato inventado adentro. Pídele que lo corrija.',

  entra6: 'Pídele que lo corrija con el número correcto.',
  e6Entrego: 'Ahí está de nuevo. Compáralo otra vez con la hoja de resultados antes de aceptarlo.',
  e6NoLogra: 'Vuelve a leerlo: ahora dice 3 equipos, y la hoja real también dice 3. Ya coincide.',
  e6Logra: 'Coincide con la hoja real. Ahora sí se puede usar en el volante.',

  entra7: 'Quedan cuatro tareas antes de entregar el reporte. Para cada una, decide: ¿le toca al copiloto, o la haces tú?',
  e7Logra:
    'Las cuatro bien repartidas. El criterio no es «la IA sabe más» ni «la IA sabe menos»: es de qué tipo es la tarea. Rutina con lógica clara y algo que se pueda comprobar → el copiloto ahorra tiempo de verdad. Algo trivial que ya sabes hacer, o algo personal que tiene que sonar a ti → mejor tú.',

  entra8: 'Última pregunta, sin copiloto de por medio.',
  cierre:
    'Hoy usaste al copiloto en tres formas de trabajo real: código, texto, y una decisión sobre en qué tareas conviene pedirle ayuda. En las tres, la mitad del trabajo no fue pedir — fue revisar antes de aceptar.',
} as const;

const ENTRA_AL_ENCARGO: Record<number, string> = {
  1: BIT.entra1,
  2: BIT.entra2,
  3: BIT.entra3,
  4: BIT.entra4,
  5: BIT.entra5,
  6: BIT.entra6,
  7: BIT.entra7,
  8: BIT.entra8,
};

const SITUACION_TEXTO: Record<number, string> = {
  0: 'Un texto para el letrero: «Feria de Ciencias 2026» en mayúsculas.',
  1: 'Necesitas una función en Python que calcule el promedio de puntajes.',
  2: 'Antes de aceptar la función, pruébala con los datos reales del robot.',
  3: 'Ahora que ignore a los robots descalificados (puntaje -1) antes de promediar.',
  4: 'Pídele que la corrija, y vuelve a probarla con los mismos datos.',
  5: 'Un párrafo para el volante — compáralo con la hoja de resultados real.',
  6: 'Pídele que lo corrija con el dato correcto, y vuelve a compararlo.',
  7: 'Cuatro tareas más para entregar el reporte: ¿le tocan al copiloto, o a ti?',
  8: 'Antes de cerrar, una pregunta sin copiloto de por medio.',
};

// ── El panel: lo que cambia entre encargos ──────────────────────────────────

interface PanelCopilotoProps {
  indice: number;
  logrado: boolean;
  ocupado: boolean;
  entregado: boolean;
  probado: boolean;
  onHazloTu0: () => void;
  onPide0: () => void;
  onHazloTu1: () => void;
  onPide1: () => void;
  datosPrueba: readonly number[];
  resultadoPrueba: number;
  onProbar: () => void;
  onVeredictoCodigo: (v: Veredicto) => void;
  onVeredictoTexto: (v: Veredicto) => void;
  clasificaciones: Partial<Record<string, Destino>>;
  tareaConError: string | null;
  onClasificar: (id: string, destino: Destino) => void;
  opcionReflexion: string | null;
  reflexionResuelta: boolean;
  onReflexion: (id: string) => void;
}

function PanelCopiloto(props: PanelCopilotoProps) {
  const {
    indice,
    logrado,
    ocupado,
    entregado,
    probado,
    onHazloTu0,
    onPide0,
    onHazloTu1,
    onPide1,
    datosPrueba,
    resultadoPrueba,
    onProbar,
    onVeredictoCodigo,
    onVeredictoTexto,
    clasificaciones,
    tareaConError,
    onClasificar,
    opcionReflexion,
    reflexionResuelta,
    onReflexion,
  } = props;

  return (
    <div className="iac-panel" data-testid="iac-panel">
      <div className="iac-encargo-cabecera">
        <p className="iac-encargo-numero">
          Encargo {indice + 1} de {TOTAL_ENCARGOS}
        </p>
        <p className="iac-encargo-situacion">{SITUACION_TEXTO[indice]}</p>
      </div>

      {indice === 0 && (
        <div className="iac-caminos">
          <button type="button" className="iac-camino" data-testid="iac-hazlo-tu" onClick={onHazloTu0} disabled={logrado}>
            <span className="iac-camino-titulo">✋ Hazlo tú mismo</span>
            <span className="iac-camino-detalle">FERIA DE CIENCIAS 2026 — ya sabes hacerlo.</span>
          </button>
          <button type="button" className="iac-camino" data-testid="iac-pide-copiloto" onClick={onPide0} disabled={logrado || ocupado}>
            <span className="iac-camino-titulo">🧑‍✈️ Pídele al copiloto</span>
            <span className="iac-camino-detalle">{ocupado ? 'Pidiendo…' : 'Que lo escriba él por ti.'}</span>
          </button>
        </div>
      )}

      {indice === 1 && (
        <div className="iac-caminos">
          <button type="button" className="iac-camino" data-testid="iac-hazlo-tu" onClick={onHazloTu1} disabled={logrado}>
            <span className="iac-camino-titulo">✋ Hazlo tú mismo</span>
            <span className="iac-camino-detalle">Sumar y dividir a mano, sin equivocarte.</span>
          </button>
          <button type="button" className="iac-camino" data-testid="iac-pide-copiloto" onClick={onPide1} disabled={logrado || ocupado}>
            <span className="iac-camino-titulo">🧑‍✈️ Pídele al copiloto</span>
            <span className="iac-camino-detalle">{ocupado ? 'Pidiendo…' : 'Una función que lo calcule.'}</span>
          </button>
        </div>
      )}

      {(indice === 2 || indice === 3 || indice === 4) && (
        <div className="iac-prueba" data-testid="iac-prueba">
          <p className="iac-prueba-titulo">Pruébala</p>
          <p className="iac-prueba-datos">Puntajes: [{datosPrueba.join(', ')}]</p>
          {!entregado ? (
            <p className="iac-prueba-datos">Pídesela al copiloto antes de poder probarla.</p>
          ) : (
            <>
              <button type="button" className="iac-prueba-boton" data-testid="iac-probar" onClick={onProbar} disabled={logrado}>
                {probado ? 'Volver a probar' : 'Probar'}
              </button>
              {probado && (
                <p className="iac-prueba-resultado" data-testid="iac-resultado">
                  Con estos datos, da: {formatResultado(resultadoPrueba)}
                </p>
              )}
              <div className="iac-veredictos">
                <button
                  type="button"
                  className="iac-veredicto es-aceptar"
                  data-testid="iac-veredicto-aceptar"
                  onClick={() => onVeredictoCodigo('aceptar')}
                  disabled={logrado || !probado}
                >
                  ✅ Aceptar, funciona bien
                </button>
                <button
                  type="button"
                  className="iac-veredicto es-corregir"
                  data-testid="iac-veredicto-corregir"
                  onClick={() => onVeredictoCodigo('corregir')}
                  disabled={logrado || !probado}
                >
                  🛠️ Pedir que la corrija
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {indice === 5 && (
        <div className="iac-hoja" data-testid="iac-hoja">
          <p className="iac-hoja-titulo">Hoja de resultados real</p>
          <p className="iac-hoja-dato">{EQUIPOS_PARTICIPANTES} equipos participaron.</p>
          <p className="iac-hoja-dato">{EQUIPOS_CON_MEDALLA} equipos ganaron medalla.</p>
          <p className="iac-hoja-nota">
            {entregado ? 'Compáralo con el párrafo, frase por frase, y toca en el chat la parte que no cuadre.' : 'Pídele el párrafo con el botón de abajo.'}
          </p>
        </div>
      )}

      {indice === 6 && (
        <div className="iac-hoja" data-testid="iac-hoja">
          <p className="iac-hoja-titulo">Hoja de resultados real</p>
          <p className="iac-hoja-dato">{EQUIPOS_PARTICIPANTES} equipos participaron.</p>
          <p className="iac-hoja-dato">{EQUIPOS_CON_MEDALLA} equipos ganaron medalla.</p>
          {!entregado ? (
            <p className="iac-hoja-nota">Pídele que lo corrija con el botón de abajo.</p>
          ) : (
            <>
              <p className="iac-hoja-nota">Compáralo otra vez con estos datos.</p>
              <div className="iac-veredictos">
                <button
                  type="button"
                  className="iac-veredicto es-aceptar"
                  data-testid="iac-veredicto-aceptar"
                  onClick={() => onVeredictoTexto('aceptar')}
                  disabled={logrado}
                >
                  ✅ Aceptar, ya coincide
                </button>
                <button
                  type="button"
                  className="iac-veredicto es-corregir"
                  data-testid="iac-veredicto-corregir"
                  onClick={() => onVeredictoTexto('corregir')}
                  disabled={logrado}
                >
                  🛠️ Pedir que lo corrija otra vez
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {indice === 7 && (
        <div className="iac-clasifica" data-testid="iac-clasifica">
          {TAREAS_CIERRE.map((t) => {
            const elegida = clasificaciones[t.id];
            return (
              <div key={t.id} className={`iac-tarea${elegida ? ' es-resuelta' : ''}`} data-testid={`iac-tarea-${t.id}`}>
                <p className="iac-tarea-texto">{t.texto}</p>
                <div className="iac-tarea-botones">
                  <button
                    type="button"
                    className={`iac-tarea-boton${elegida === 'tu' ? ' es-resuelta-tu' : ''}`}
                    data-testid={`iac-tarea-${t.id}-tu`}
                    onClick={() => onClasificar(t.id, 'tu')}
                    disabled={Boolean(elegida)}
                  >
                    ✋ Mejor lo hago yo
                  </button>
                  <button
                    type="button"
                    className={`iac-tarea-boton${elegida === 'copiloto' ? ' es-resuelta-copiloto' : ''}`}
                    data-testid={`iac-tarea-${t.id}-copiloto`}
                    onClick={() => onClasificar(t.id, 'copiloto')}
                    disabled={Boolean(elegida)}
                  >
                    🧑‍✈️ Buen trabajo para el copiloto
                  </button>
                </div>
                {tareaConError === t.id && !elegida && <p className="iac-tarea-porque">{t.porque}</p>}
              </div>
            );
          })}
        </div>
      )}

      {indice === 8 && (
        <div className="iac-opciones" data-testid="iac-opciones">
          {OPCIONES_REFLEXION.map((o) => {
            const elegida = opcionReflexion === o.id;
            const estado = elegida ? (o.correcta ? ' es-correcta' : ' es-incorrecta') : '';
            return (
              <button
                key={o.id}
                type="button"
                className={`iac-opcion${estado}`}
                data-testid={`iac-opcion-${o.id}`}
                onClick={() => onReflexion(o.id)}
                disabled={reflexionResuelta}
              >
                {o.etiqueta}
              </button>
            );
          })}
          {opcionReflexion && !reflexionResuelta && (
            <p className="iac-opcion-porque">{OPCIONES_REFLEXION.find((o) => o.id === opcionReflexion)?.porque}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── El laboratorio ───────────────────────────────────────────────────────

export function LabIaCopiloto(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  const [logrado, setLogrado] = useState(false);
  const [peticiones, setPeticiones] = useState(0);

  // encargos 2–4: la caja de prueba
  const [probado, setProbado] = useState(false);
  // encargos 3–6: ¿ya entregó el copiloto su respuesta de este encargo? El
  // encargo 2 arranca en `true`: la función ya está a la vista desde el 1.
  const [entregado, setEntregado] = useState(false);

  // encargo 7
  const [clasificaciones, setClasificaciones] = useState<Partial<Record<string, Destino>>>({});
  const [tareaConError, setTareaConError] = useState<string | null>(null);

  // encargo 8
  const [opcionReflexion, setOpcionReflexion] = useState<string | null>(null);
  const [reflexionResuelta, setReflexionResuelta] = useState(false);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_ENCARGOS);

  const alFinTecleo = (r: ResultadoGuion) => {
    if (r.regla?.tipo !== 'ficha') return;
    switch (r.regla.ficha) {
      case FICHA_E0_PIDE:
        lab.restar();
        hablar(BIT.e0PideNoLogra);
        break;
      case FICHA_E1_PIDE:
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.e1PideLogra);
        break;
      case FICHA_E3_PIDE:
        setEntregado(true);
        hablar(BIT.e3Entrego);
        break;
      case FICHA_E4_PIDE:
        setEntregado(true);
        hablar(BIT.e4Entrego);
        break;
      case FICHA_E5_PIDE:
        setEntregado(true);
        hablar(BIT.e5Entrego);
        break;
      case FICHA_E6_PIDE:
        setEntregado(true);
        hablar(BIT.e6Entrego);
        break;
      default:
        break;
    }
  };

  const ia = useAsistente({
    guion: GUION_IA_COPILOTO,
    saludo: 'Hola. Soy tu copiloto para el reporte del Club de Robótica. Te ayudo con lo que pidas — pero lo que se entrega, lo revisas tú.',
    velocidad: 14,
    paso: 4,
    onFinTecleo: alFinTecleo,
  });

  const pedir = (ficha: string, pregunta: string) => {
    const resultado = ia.enviarFicha({ id: ficha, etiqueta: pregunta, pregunta });
    if (resultado === 'enviado') {
      reproducirTono('select');
      setPeticiones((n) => n + 1);
    }
    return resultado;
  };

  /* ── Encargo 0: cuándo NO conviene ─────────────────────────────────────── */

  const elegirHazloTu0 = () => {
    if (fase !== 'estudio' || indice !== 0 || logrado) return;
    reproducirTono('select');
    setLogrado(true);
    lab.avanzar();
    hablar(BIT.e0TuLogra);
  };
  const pedirAyuda0 = () => {
    if (fase !== 'estudio' || indice !== 0 || logrado || ia.ocupado) return;
    pedir(FICHA_E0_PIDE, 'Ponlo en mayúsculas: «Feria de Ciencias 2026».');
  };

  /* ── Encargo 1: cuándo SÍ conviene ─────────────────────────────────────── */

  const pedirAyuda1 = () => {
    if (fase !== 'estudio' || indice !== 1 || logrado || ia.ocupado) return;
    pedir(FICHA_E1_PIDE, 'Necesito una función que calcule el promedio de estos puntajes: [78, 85, 92, 88].');
  };
  const elegirHazloTu1 = () => {
    if (fase !== 'estudio' || indice !== 1 || logrado) return;
    reproducirTono('error');
    lab.restar();
    hablar(BIT.e1TuNoLogra);
  };

  /* ── Encargos 2–4: probar antes de aceptar ─────────────────────────────── */

  const probar = () => {
    if (fase !== 'estudio' || logrado || !entregado) return;
    if (indice !== 2 && indice !== 3 && indice !== 4) return;
    reproducirTono('select');
    setProbado(true);
  };

  const pedirAyuda3 = () => {
    if (fase !== 'estudio' || indice !== 3 || entregado || ia.ocupado) return;
    pedir(FICHA_E3_PIDE, 'Ahora que ignore a los robots descalificados (puntaje -1) antes de promediar.');
  };

  const pedirCorreccion4 = () => {
    if (fase !== 'estudio' || indice !== 4 || entregado || ia.ocupado) return;
    pedir(FICHA_E4_PIDE, 'Vuelve a revisarla: con estos datos no me da el promedio correcto.');
  };

  const elegirVeredictoCodigo = (v: Veredicto) => {
    if (fase !== 'estudio' || logrado || !probado) {
      if (fase === 'estudio' && !probado) hablar(BIT.pruebaPrimero);
      return;
    }
    if (indice === 2) {
      if (v === 'aceptar') {
        reproducirTono('select');
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.e2Logra);
      } else {
        reproducirTono('error');
        lab.restar();
        hablar(BIT.e2NoLogra);
      }
      return;
    }
    if (indice === 3) {
      if (v === 'corregir') {
        reproducirTono('select');
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.e3Logra);
      } else {
        reproducirTono('error');
        lab.restar();
        hablar(BIT.e3NoLogra);
      }
      return;
    }
    if (indice === 4) {
      if (v === 'aceptar') {
        reproducirTono('select');
        setLogrado(true);
        lab.avanzar();
        hablar(BIT.e4Logra);
      } else {
        reproducirTono('error');
        lab.restar();
        hablar(BIT.e4NoLogra);
      }
    }
  };

  /* ── Encargos 5–6: un dato inventado, no un error que truena ─────────────── */

  const pedirParrafo5 = () => {
    if (fase !== 'estudio' || indice !== 5 || entregado || ia.ocupado) return;
    pedir(FICHA_E5_PIDE, 'Escribe un párrafo corto para el volante, sobre cómo nos fue en la feria.');
  };

  const onTocarParte = (id: string) => {
    if (fase !== 'estudio' || indice !== 5 || logrado || !entregado) return;
    if (id === PARTE_FALSA_ID) {
      reproducirTono('select');
      ia.marcarParte(id, 'senalada');
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.e5Logra);
    } else {
      reproducirTono('error');
      lab.restar();
      hablar(BIT.e5NoLogra);
    }
  };

  const pedirCorreccion6 = () => {
    if (fase !== 'estudio' || indice !== 6 || entregado || ia.ocupado) return;
    pedir(FICHA_E6_PIDE, 'Corrígelo: la hoja de resultados dice otro número.');
  };

  const elegirVeredictoTexto = (v: Veredicto) => {
    if (fase !== 'estudio' || indice !== 6 || logrado) return;
    if (!entregado) {
      hablar(BIT.pideloPrimero);
      return;
    }
    if (v === 'aceptar') {
      reproducirTono('select');
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.e6Logra);
    } else {
      reproducirTono('error');
      lab.restar();
      hablar(BIT.e6NoLogra);
    }
  };

  /* ── Encargo 7: clasificar tareas reales ──────────────────────────────── */

  const elegirClasificacion = (tareaId: string, destino: Destino) => {
    if (fase !== 'estudio' || indice !== 7 || logrado) return;
    if (clasificaciones[tareaId]) return;
    const tarea = TAREAS_CIERRE.find((t) => t.id === tareaId);
    if (!tarea) return;
    if (destino !== tarea.correcta) {
      reproducirTono('error');
      lab.restar();
      setTareaConError(tareaId);
      hablar(tarea.porque);
      return;
    }
    reproducirTono('select');
    setTareaConError(null);
    const siguiente = { ...clasificaciones, [tareaId]: destino };
    setClasificaciones(siguiente);
    if (Object.keys(siguiente).length === TAREAS_CIERRE.length) {
      setLogrado(true);
      lab.avanzar();
      hablar(BIT.e7Logra);
    }
  };

  /* ── Encargo 8: la reflexión final, cierra la clase ───────────────────── */

  const elegirReflexion = (id: string) => {
    if (fase !== 'estudio' || indice !== 8 || reflexionResuelta) return;
    const opcion = OPCIONES_REFLEXION.find((o) => o.id === id);
    if (!opcion) return;
    setOpcionReflexion(id);
    if (!opcion.correcta) {
      reproducirTono('error');
      lab.restar();
      hablar(opcion.porque ?? '');
      return;
    }
    reproducirTono('select');
    setReflexionResuelta(true);
    setLogrado(true);
    const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
    lab.terminar(segundos, () => hablar(BIT.cierre));
  };

  /* ── Navegación entre encargos, arranque y repetición ─────────────────── */

  const siguienteEncargo = () => {
    if (fase !== 'estudio' || !logrado || indice >= TOTAL_ENCARGOS - 1) return;
    reproducirTono('select');
    const hechos = indice + 1;
    setIndice(hechos);
    setLogrado(false);
    setProbado(false);
    setEntregado(hechos === 2);
    if (hechos === 7) {
      setClasificaciones({});
      setTareaConError(null);
    }
    if (hechos === 8) {
      setOpcionReflexion(null);
      setReflexionResuelta(false);
    }
    const l = ENTRA_AL_ENCARGO[hechos];
    if (l) hablar(l);
  };

  const empezar = () => {
    setFase('estudio');
    reproducirTono('power');
    hablar(BIT.inicio);
  };

  const repetir = () => {
    reproducirTono('select');
    setIndice(0);
    setLogrado(false);
    setPeticiones(0);
    setProbado(false);
    setEntregado(false);
    setClasificaciones({});
    setTareaConError(null);
    setOpcionReflexion(null);
    setReflexionResuelta(false);
    ia.reiniciar();
    lab.reiniciar(() => hablar(BIT.inicio));
  };

  /* ── Las acciones del pie de la ventana ───────────────────────────────── */

  let acciones: AccionAsistente[] | undefined;
  if (fase === 'estudio') {
    if (logrado && indice < TOTAL_ENCARGOS - 1) {
      acciones = [{ id: 'siguiente', etiqueta: 'Siguiente encargo →', onClick: siguienteEncargo, principal: true }];
    } else if (indice === 3 && !entregado) {
      acciones = [
        {
          id: 'e3-pide',
          etiqueta: ia.ocupado ? 'Pidiendo…' : 'Pídele que ignore a los descalificados',
          onClick: pedirAyuda3,
          principal: true,
          deshabilitada: ia.ocupado,
        },
      ];
    } else if (indice === 4 && !entregado) {
      acciones = [
        { id: 'e4-pide', etiqueta: ia.ocupado ? 'Pidiendo…' : 'Pídele que la corrija', onClick: pedirCorreccion4, principal: true, deshabilitada: ia.ocupado },
      ];
    } else if (indice === 5 && !entregado) {
      acciones = [
        {
          id: 'e5-pide',
          etiqueta: ia.ocupado ? 'Pidiendo…' : 'Pídele el párrafo para el volante',
          onClick: pedirParrafo5,
          principal: true,
          deshabilitada: ia.ocupado,
        },
      ];
    } else if (indice === 6 && !entregado) {
      acciones = [
        { id: 'e6-pide', etiqueta: ia.ocupado ? 'Pidiendo…' : 'Pídele que lo corrija', onClick: pedirCorreccion6, principal: true, deshabilitada: ia.ocupado },
      ];
    }
    // indices 0, 1, 2, 7 y 8 resuelven todo dentro del panel: sin botón de pie.
  }

  const datosPrueba = indice === 2 ? PUNTAJES_SIMPLE : PUNTAJES_CON_DESCALIFICADOS;
  const resultadoPrueba =
    indice === 2 ? promedioSimple(PUNTAJES_SIMPLE) : indice === 3 ? promedioConBug(PUNTAJES_CON_DESCALIFICADOS) : promedioArreglado(PUNTAJES_CON_DESCALIFICADOS);

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="La IA como copiloto"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_ENCARGOS : lab.pasos}
        pasosTotal={TOTAL_ENCARGOS}
        marcadorEtiqueta="Encargo"
        marcadorValor={`${Math.min(indice + 1, TOTAL_ENCARGOS)}/${TOTAL_ENCARGOS}`}
        bit={fase === 'estudio' ? linea : null}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Copiloto con criterio',
                insigniaEmoji: '🧑‍✈️',
                titulo: '¡Reporte listo, con criterio!',
                detalle:
                  'Usaste al copiloto en tareas reales de código y de texto, y en las dos veces que se equivocó —un número mal calculado que no truena, y un dato inventado en un párrafo que se lee perfecto— lo encontraste probando antes de aceptar, no confiando en que «se veía bien». También aprendiste cuándo de plano no vale la pena pedir ayuda. Ese criterio, no el copiloto, es lo que entregaste hoy.',
                resumen: [
                  { etiqueta: 'Encargos', valor: `${TOTAL_ENCARGOS}` },
                  { etiqueta: 'Peticiones al copiloto', valor: `${peticiones}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase !== 'portada' && (
            <VentanaBase marca="Tecnia Asistente" subtitulo="Copiloto del Club de Robótica" claseMarco="tia-marco">
              <VentanaAsistente
                className="iac-asis"
                mensajes={ia.mensajes}
                escribiendo={ia.ocupado}
                onSaltarTecleo={ia.saltarTecleo}
                onTocarParte={onTocarParte}
                vacio="Pide ayuda o hazlo tú mismo — las dos opciones están en el panel."
                panel={
                  <PanelCopiloto
                    indice={indice}
                    logrado={logrado}
                    ocupado={ia.ocupado}
                    entregado={entregado}
                    probado={probado}
                    onHazloTu0={elegirHazloTu0}
                    onPide0={pedirAyuda0}
                    onHazloTu1={elegirHazloTu1}
                    onPide1={pedirAyuda1}
                    datosPrueba={datosPrueba}
                    resultadoPrueba={resultadoPrueba}
                    onProbar={probar}
                    onVeredictoCodigo={elegirVeredictoCodigo}
                    onVeredictoTexto={elegirVeredictoTexto}
                    clasificaciones={clasificaciones}
                    tareaConError={tareaConError}
                    onClasificar={elegirClasificacion}
                    opcionReflexion={opcionReflexion}
                    reflexionResuelta={reflexionResuelta}
                    onReflexion={elegirReflexion}
                  />
                }
                acciones={acciones}
              />
            </VentanaBase>
          )}
          {fase === 'portada' && <PortadaIA portada={PORTADA} onEmpezar={empezar} />}
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabIaCopiloto;
