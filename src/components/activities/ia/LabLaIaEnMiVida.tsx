'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaAsistente, useAsistente } from '@/components/simuladores/asistente';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  CASOS_CORAZONADA,
  CASOS_RADAR,
  CRITERIOS,
  F_RADAR,
  GUION_MI_VIDA,
  PENALIZACION,
  SALUDO_MI_VIDA,
  TOTAL_PASOS,
  motivoDelFallo,
  preguntaDe,
  probarCriterio,
  type CasoDelDia,
  type Criterio,
} from './casosDelDia';
import './salaIA.css';
import './laIaEnMiVida.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N5 · «IA a mi alcance», parada 1 · `n5-la-ia-en-mi-vida`
 * 5.º de primaria · 10–11 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **El radar de IA.** Tres actos, y el orden es la clase entera:
 *
 *  · **Acto 1 — la corazonada.** Cuatro aparatos de la mañana. El alumno
 *    apuesta ANTES de saber nada y sólo después el asistente cuenta cómo
 *    llegó cada uno a hacer lo que hace. La calculadora parece listísima y no
 *    aprendió nada; el teclado parece tonto y aprendió de millones de
 *    mensajes. **Fallar la corazonada no resta.**
 *  · **Acto 2 — el alto.** Cuatro preguntas candidatas, probadas contra la
 *    pizarra que el alumno acaba de llenar. Tres se caen enseñando el
 *    contraejemplo de su propia pizarra; la cuarta la parte en dos. Probar
 *    una que falla **tampoco resta**: es el experimento.
 *  · **Acto 3 — el radar.** Cuatro aparatos de la tarde, ya con la pregunta
 *    en la mano. **Aquí sí cuesta**, seis puntos, porque ya no es corazonada.
 *
 * ── Lo que se cuidó, y por qué ────────────────────────────────────────────
 *
 * 1. **La pizarra sólo crece.** Ni el alto ni un fallo del radar quitan nada
 *    de ella: lo que el alumno descubrió en el encargo 2 sigue dicho en el 9.
 *    Ningún encargo posterior deshace un predicado anterior.
 * 2. **La verdad de un caso no se enseña hasta que el aparato la cuenta.**
 *    En el acto 1 la cuenta él, después de la apuesta; en el acto 3, después
 *    de la respuesta. Nunca antes, ni en un `title`, ni en una clase CSS.
 * 3. **Los avisos salen del gesto**, nunca de dentro de un actualizador de
 *    `setState` — en modo estricto se llamarían dos veces y el progreso iría
 *    al doble.
 * 4. **La IA nunca es real (§29).** Todo lo que contesta está escrito a mano
 *    en `casosDelDia.ts`, el compositor va deshabilitado y no hay ninguna
 *    cara dibujada en ningún sitio.
 */

type Fase = 'portada' | 'corazonada' | 'alto' | 'radar' | 'fin';

/** Una tarjeta puesta en la pizarra. Entra una vez y no se mueve nunca más. */
interface EnLaPizarra {
  caso: CasoDelDia;
  /** Lo que el alumno dijo: `true` = «creo que sí es IA». */
  eleccion: boolean;
  acto: 1 | 3;
}

const PORTADA: DatosPortadaIA = {
  situacion: 'Hoy vas a revisar tu propio día, hora por hora, buscando algo que ya estaba ahí.',
  tema: 'La IA en mi vida diaria',
  objetivo:
    'Reconocer si un aparato lleva inteligencia artificial dentro con una sola pregunta, sin abrirlo y sin ser experto.',
  vasAHacer: [
    'Apostar por corazonada si cuatro aparatos de tu mañana son IA o no.',
    'Dejar que cada uno te cuente cómo llegó a hacer lo que hace.',
    'Buscar la pregunta que separa a unos de otros… probándolas todas.',
    'Revisar cuatro aparatos más de tu tarde, ya con esa pregunta.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 15,
  insignia: { nombre: 'Radar de IA', emoji: '📡' },
  boton: 'Abrir Tecnia Asistente',
  acento: '#22d3ee',
};

/** El texto de la bandeja, ya con el criterio descubierto. */
const BANDEJAS: { lado: 'ia' | 'regla'; titulo: string; pie: string }[] = [
  { lado: 'ia', titulo: 'Aprendió de ejemplos', pie: 'Entonces es IA' },
  { lado: 'regla', titulo: 'Le escribieron los pasos', pie: 'Entonces no lo es' },
];

export function LabLaIaEnMiVida(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [indice, setIndice] = useState(0);
  /** La apuesta del caso en curso, antes de que el aparato hable. */
  const [corazonada, setCorazonada] = useState<boolean | null>(null);
  /** Si el aparato del caso en curso ya contó su historia. */
  const [contado, setContado] = useState(false);
  /** La pizarra. **Sólo crece.** */
  const [pizarra, setPizarra] = useState<EnLaPizarra[]>([]);
  /** Lo que pasó con cada pregunta candidata que se probó. Cadena vacía = separa. */
  const [probadas, setProbadas] = useState<Record<string, string>>({});
  const [radar, setRadar] = useState<Criterio | null>(null);
  /** El acto 3: si la última colocación estuvo bien, y la pista si no. */
  const [pista, setPista] = useState<string | null>(null);
  const [colocado, setColocado] = useState(false);
  /*
   * Si este aparato ya se falló una vez. **Sólo el primer fallo resta.**
   * Encontrado jugando mal a mano: bandejas hay dos, así que el segundo clic
   * equivocado es literalmente el mismo clic repetido, y un niño aporreando el
   * mismo botón diez veces se comía sesenta puntos por un solo error de
   * criterio. El error se cobra una vez y el aparato sigue esperando.
   */
  const [yaFallo, setYaFallo] = useState(false);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_PASOS, { penalizacionError: PENALIZACION });
  const ia = useAsistente({ guion: GUION_MI_VIDA, saludo: SALUDO_MI_VIDA, velocidad: 14, paso: 4 });

  const caso: CasoDelDia | undefined =
    fase === 'radar' ? CASOS_RADAR[indice] : fase === 'corazonada' ? CASOS_CORAZONADA[indice] : undefined;

  /** Los casos que hay hoy en la pizarra: contra ellos se prueban las preguntas. */
  const enPizarra = useMemo(() => pizarra.map((p) => p.caso), [pizarra]);
  const sorpresas = useMemo(() => pizarra.filter((p) => p.eleccion !== p.caso.esIa).length, [pizarra]);
  /*
   * Cuántos aparatos de la tarde están YA colocados. No es «cuántos acertó»:
   * en el acto 3 sólo entra en la pizarra la colocación buena, así que esto
   * cuenta avance, no puntería. La puntería se lee en `lab.erroresFinal`, que
   * es lo que de verdad sabe cuántas veces se falló antes de acertar.
   */
  const colocadosRadar = useMemo(() => pizarra.filter((p) => p.acto === 3).length, [pizarra]);

  const contar = useCallback(
    (c: CasoDelDia) => ia.enviarFicha({ id: c.id, etiqueta: c.nombre, pregunta: preguntaDe(c) }) === 'enviado',
    [ia],
  );

  /* ── Acto 1 · la corazonada ──────────────────────────────────────────── */

  const apostar = (valor: boolean) => {
    if (fase !== 'corazonada' || contado) return;
    reproducirTono('select');
    setCorazonada(valor);
  };

  const preguntarComo = () => {
    if (fase !== 'corazonada' || contado || corazonada === null || !caso) return;
    if (!contar(caso)) return;
    reproducirTono('select');
    setContado(true);
    setPizarra((prev) => [...prev, { caso, eleccion: corazonada, acto: 1 }]);
    hablar(
      corazonada === caso.esIa
        ? `Le atinaste. Pero fíjate en el porqué, que es lo que vale: ${caso.resumen}.`
        : `Te salió al revés, y le pasa a todo el mundo: ${caso.resumen}. Aquí no se resta nada por eso; para eso estamos.`,
    );
  };

  const seguirCorazonada = () => {
    if (fase !== 'corazonada' || !contado) return;
    reproducirTono('select');
    lab.avanzar();
    setCorazonada(null);
    setContado(false);
    const hechos = indice + 1;
    if (hechos >= CASOS_CORAZONADA.length) {
      setFase('alto');
      hablar('Para. Mira tu pizarra entera de una vez: dos aprendieron de ejemplos y dos no. ¿Qué pregunta los separa?');
      return;
    }
    setIndice(hechos);
  };

  /* ── Acto 2 · el alto: la pregunta que separa ────────────────────────── */

  const probar = (criterio: Criterio) => {
    if (fase !== 'alto' || ia.ocupado) return;
    const prueba = probarCriterio(criterio.id, enPizarra);
    reproducirTono('select');
    if (prueba.separa) {
      // `enviarFicha` devuelve 'enviado' | 'ocupado' | 'vacio', no un booleano:
      // comparar con la cadena, o un 'ocupado' se leería como éxito.
      if (ia.enviarFicha({ id: F_RADAR, etiqueta: criterio.pregunta, pregunta: criterio.pregunta }) !== 'enviado') {
        return;
      }
      setProbadas((prev) => ({ ...prev, [criterio.id]: '' }));
      setRadar(criterio);
      hablar('Ésa es. Deja a los dos que aprendieron de un lado y a los dos que obedecen del otro, sin colarse ninguno.');
      return;
    }
    const motivo = motivoDelFallo(criterio, prueba);
    setProbadas((prev) => ({ ...prev, [criterio.id]: motivo }));
    hablar(motivo);
  };

  const empezarRadar = () => {
    if (fase !== 'alto' || !radar) return;
    reproducirTono('select');
    lab.avanzar();
    setFase('radar');
    setIndice(0);
    setColocado(false);
    setPista(null);
    setYaFallo(false);
    hablar('Ahora tú. Cuatro aparatos más de tu tarde, y ya no vale la corazonada: usa la pregunta.');
  };

  /* ── Acto 3 · el radar ───────────────────────────────────────────────── */

  const colocar = (esIa: boolean) => {
    if (fase !== 'radar' || colocado || !caso || ia.ocupado) return;
    if (esIa !== caso.esIa) {
      if (!yaFallo) lab.restar();
      setYaFallo(true);
      setPista(
        esIa
          ? `Todavía no. Pregúntatelo otra vez: ¿alguien pudo escribirle los pasos de eso, uno por uno, y que saliera siempre igual?`
          : `Todavía no. Pregúntatelo otra vez: ¿de verdad se pueden escribir a mano todos los casos de eso, sin dejarse ninguno?`,
      );
      hablar('Ojo, ésa no es. Vuelve a leer lo que hace y pregúntaselo otra vez.');
      return;
    }
    if (!contar(caso)) return;
    reproducirTono('select');
    setColocado(true);
    setPista(null);
    setPizarra((prev) => [...prev, { caso, eleccion: esIa, acto: 3 }]);
  };

  const seguirRadar = () => {
    if (fase !== 'radar' || !colocado) return;
    reproducirTono('select');
    setColocado(false);
    setPista(null);
    setYaFallo(false);
    const hechos = indice + 1;
    if (hechos >= CASOS_RADAR.length) {
      const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      setIndice(hechos);
      setFase('fin');
      lab.terminar(segundos, () => hablar('Ya tienes el radar puesto. Esa pregunta te sirve para cualquier aparato del mundo.'));
      return;
    }
    lab.avanzar();
    setIndice(hechos);
  };

  const repetir = () => {
    setFase('corazonada');
    setIndice(0);
    setCorazonada(null);
    setContado(false);
    setPizarra([]);
    setProbadas({});
    setRadar(null);
    setPista(null);
    setColocado(false);
    setYaFallo(false);
    ia.reiniciar();
    lab.reiniciar(() => hablar('Otra vez, y ahora ya sabes lo que buscas. A ver si te sorprende alguno.'));
  };

  /* ── Lo que se ve ────────────────────────────────────────────────────── */

  const marcador =
    fase === 'alto'
      ? { etiqueta: 'Preguntas', valor: `${Object.keys(probadas).length}/${CRITERIOS.length}` }
      : fase === 'radar' || fase === 'fin'
        ? { etiqueta: 'Radar', valor: `${colocadosRadar}/${CASOS_RADAR.length}` }
        : { etiqueta: 'Aparatos', valor: `${Math.min(indice, CASOS_CORAZONADA.length)}/${CASOS_CORAZONADA.length}` };

  const cabecera =
    fase === 'alto'
      ? 'La pregunta que los separa'
      : fase === 'radar'
        ? `Tu tarde · aparato ${Math.min(indice + 1, CASOS_RADAR.length)} de ${CASOS_RADAR.length}`
        : `Tu mañana · aparato ${Math.min(indice + 1, CASOS_CORAZONADA.length)} de ${CASOS_CORAZONADA.length}`;

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="La IA en mi vida diaria"
        pasoEtiqueta="Paso"
        pasoActual={lab.terminado ? TOTAL_PASOS : lab.pasos}
        pasosTotal={TOTAL_PASOS}
        marcadorEtiqueta={marcador.etiqueta}
        marcadorValor={marcador.valor}
        bit={fase === 'portada' || fase === 'fin' ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Radar de IA',
                insigniaEmoji: '📡',
                titulo:
                  lab.erroresFinal === 0
                    ? '¡Radar perfecto! Los cuatro de la tarde, a la primera'
                    : 'Radar puesto. Ya reconoces una IA sin abrirla',
                detalle:
                  sorpresas > 0
                    ? `Revisaste ocho aparatos de tu día y ${sorpresas === 1 ? 'uno te sorprendió' : `${sorpresas} te sorprendieron`}: eso es justo de lo que iba la clase. La inteligencia artificial no es un robot del futuro con cara — es el teclado que adivina tu palabra y el filtro que encuentra tu cara. Y te llevas una pregunta que sirve para cualquier aparato: ¿aprendió mirando montones de ejemplos, o alguien le escribió los pasos?`
                    : 'Revisaste ocho aparatos de tu día sin que se te colara ni uno. Te llevas la pregunta que sirve para todos: ¿aprendió mirando montones de ejemplos, o alguien le escribió los pasos? Y la pista de regalo: lo que aprendió de ejemplos se equivoca de vez en cuando; lo que sigue pasos escritos, jamás.',
                resumen: [
                  { etiqueta: 'Aparatos', valor: `${CASOS_CORAZONADA.length + CASOS_RADAR.length}` },
                  { etiqueta: 'Te sorprendieron', valor: `${sorpresas}` },
                  { etiqueta: 'Fallos del radar', valor: `${lab.erroresFinal}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase === 'portada' && (
            <PortadaIA
              portada={PORTADA}
              onEmpezar={() => {
                setFase('corazonada');
                hablar('Apuesta primero, sin pensarlo mucho. Después te cuento cómo llegó a hacer eso.');
              }}
            />
          )}

          {fase !== 'portada' && fase !== 'fin' && (
            <VentanaBase marca="Tecnia Asistente" subtitulo="Tu día, aparato por aparato" claseMarco="tia-marco">
              <div className="tia-cuerpo">
                <section className="tia-mesa" data-testid="tvida-mesa" data-fase={fase}>
                  <header className="tia-mesa-cabecera">
                    <h2 className="tia-mesa-titulo">{cabecera}</h2>
                    <p className="tia-mesa-encargo">
                      {fase === 'alto'
                        ? 'Éstos son los cuatro de tu mañana, ya con su historia. Dos aprendieron de ejemplos y dos obedecen pasos escritos. Prueba las preguntas: sólo una los separa.'
                        : fase === 'radar'
                          ? 'Coloca el aparato del lado que le toca. Ahora ya no vale la corazonada.'
                          : 'Apuesta primero. Después pregúntale cómo llegó a hacer eso.'}
                    </p>
                  </header>

                  {/* ── El aparato en turno ─────────────────────────────── */}
                  {caso && (
                    <article className="tvida-caso" data-testid="tvida-caso" data-caso={caso.id}>
                      <span className="tvida-caso-icono" aria-hidden="true">
                        {caso.icono}
                      </span>
                      <div className="tvida-caso-cuerpo">
                        <p className="tvida-caso-momento">{caso.momento}</p>
                        <h3 className="tvida-caso-nombre">{caso.nombre}</h3>
                        <p className="tvida-caso-situacion">{caso.situacion}</p>
                      </div>
                    </article>
                  )}

                  {/* ── Acto 1 · apostar y preguntar ────────────────────── */}
                  {fase === 'corazonada' && caso && (
                    <>
                      <p className="tia-bandeja-titulo">Sin saber nada todavía · ¿lleva inteligencia artificial dentro?</p>
                      <div className="tvida-apuestas">
                        <button
                          type="button"
                          className={`tvida-apuesta es-si${corazonada === true ? ' es-elegida' : ''}`}
                          data-testid="tvida-si"
                          aria-pressed={corazonada === true}
                          disabled={contado}
                          onClick={() => apostar(true)}
                        >
                          🤔 Yo creo que sí
                        </button>
                        <button
                          type="button"
                          className={`tvida-apuesta es-no${corazonada === false ? ' es-elegida' : ''}`}
                          data-testid="tvida-no"
                          aria-pressed={corazonada === false}
                          disabled={contado}
                          onClick={() => apostar(false)}
                        >
                          🤔 Yo creo que no
                        </button>
                      </div>

                      <div className="tia-banda">
                        {!contado ? (
                          <button
                            type="button"
                            className="tia-boton"
                            data-testid="tvida-preguntar"
                            disabled={corazonada === null || ia.ocupado}
                            onClick={preguntarComo}
                          >
                            🎤 Pregúntale cómo llegó a hacer eso
                          </button>
                        ) : (
                          <button type="button" className="tia-boton" data-testid="tvida-seguir" onClick={seguirCorazonada}>
                            {indice + 1 >= CASOS_CORAZONADA.length ? 'Ver tu pizarra entera →' : 'Siguiente aparato →'}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Acto 2 · las cuatro preguntas ───────────────────── */}
                  {fase === 'alto' && (
                    <>
                      <div className="tvida-preguntas">
                        {CRITERIOS.map((k) => {
                          const motivo = probadas[k.id];
                          const buena = radar?.id === k.id;
                          const caida = motivo !== undefined && motivo !== '';
                          return (
                            <button
                              key={k.id}
                              type="button"
                              className={`tvida-pregunta${buena ? ' es-buena' : ''}${caida ? ' es-caida' : ''}`}
                              data-criterio={k.id}
                              disabled={ia.ocupado}
                              onClick={() => probar(k)}
                            >
                              <span className="tvida-pregunta-texto">{k.pregunta}</span>
                              {caida && <span className="tvida-pregunta-motivo">{motivo}</span>}
                              {buena && <span className="tvida-pregunta-motivo">Ésta los separa. Ésta es tu radar.</span>}
                            </button>
                          );
                        })}
                      </div>

                      {radar && (
                        <div className="tia-banda">
                          <button type="button" className="tia-boton" data-testid="tvida-empezar-radar" onClick={empezarRadar}>
                            Estrenar el radar →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Acto 3 · las dos bandejas ───────────────────────── */}
                  {fase === 'radar' && (
                    <>
                      {radar && (
                        <div className="tvida-radar" data-testid="tvida-radar">
                          <span className="tvida-radar-etiqueta">Tu radar</span>
                          <p className="tvida-radar-pregunta">{radar.pregunta}</p>
                        </div>
                      )}
                      <div className="tvida-bandejas">
                        {BANDEJAS.map((b) => (
                          <button
                            key={b.lado}
                            type="button"
                            className={`tvida-bandeja es-${b.lado}`}
                            data-bandeja={b.lado}
                            disabled={colocado || ia.ocupado}
                            onClick={() => colocar(b.lado === 'ia')}
                          >
                            <span className="tvida-bandeja-titulo">{b.titulo}</span>
                            <span className="tvida-bandeja-pie">{b.pie}</span>
                          </button>
                        ))}
                      </div>

                      {pista && (
                        <p className="tvida-pista" data-testid="tvida-pista" role="status">
                          {pista}
                        </p>
                      )}

                      {colocado && (
                        <div className="tia-banda">
                          <button type="button" className="tia-boton" data-testid="tvida-seguir" onClick={seguirRadar}>
                            {indice + 1 >= CASOS_RADAR.length ? 'Terminar el día →' : 'Siguiente aparato →'}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── La pizarra: entra y no se mueve nunca más ───────── */}
                  <div className="tvida-pizarra" data-testid="tvida-pizarra">
                    <p className="tvida-pizarra-titulo">Tu pizarra del día</p>
                    {pizarra.length === 0 ? (
                      <p className="tvida-pizarra-vacia">Todavía no has apostado por ninguno.</p>
                    ) : (
                      <ul className="tvida-pizarra-lista">
                        {pizarra.map((p) => (
                          <li key={p.caso.id} className={`tvida-tarjeta${p.caso.esIa ? ' es-ia' : ' es-regla'}`}>
                            <span className="tvida-tarjeta-icono" aria-hidden="true">
                              {p.caso.icono}
                            </span>
                            <span className="tvida-tarjeta-cuerpo">
                              <b className="tvida-tarjeta-nombre">{p.caso.nombre}</b>
                              <span className="tvida-tarjeta-resumen">{p.caso.resumen}</span>
                            </span>
                            <span className={`tvida-sello${p.eleccion === p.caso.esIa ? ' es-bien' : ' es-sorpresa'}`}>
                              {p.eleccion === p.caso.esIa ? 'le atinaste' : 'te sorprendió'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                <div className="tia-chat">
                  <VentanaAsistente
                    mensajes={ia.mensajes}
                    escribiendo={ia.ocupado}
                    onSaltarTecleo={ia.saltarTecleo}
                    compositor={{
                      titulo: 'Aquí no se escribe: los aparatos se eligen en la mesa',
                      deshabilitado: true,
                    }}
                  />
                </div>
              </div>
            </VentanaBase>
          )}
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabLaIaEnMiVida;
