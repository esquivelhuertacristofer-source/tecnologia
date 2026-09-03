'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { reproducirTono } from '../n1/mision/audio';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  VentanaAsistente,
  useAsistente,
  type FichaPrompt,
} from '@/components/simuladores/asistente';
import {
  brechaDe,
  entrenar,
  evaluar,
  examinar,
  informeDe,
  predecir,
  senalDePrediccion,
  senalesDe,
  type Auditoria,
  type Ejemplo,
  type Informe,
  type Nodo,
  type Prediccion,
  type Senal,
} from '@/components/simuladores/aprendizaje';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  candidataComoEjemplo,
  comoEjemplo,
  comoSeLee,
  EJEMPLOS_DE_PRUEBA,
  ESQUEMA,
  FICHAS,
  GATO,
  PERRO,
  PRUEBAS,
  RONDAS,
  type Candidata,
} from './bancoMascotas';
import {
  FICHAS_CONTESTADAS,
  F_COMO_APRENDES,
  F_HOJA_LIMPIA,
  F_QUE_MIRAS,
  F_QUE_NO_MIRASTE,
  F_YA_ENTRENE,
  GUION,
  PON,
  SALUDO,
} from './guionAprendeConDatos';
import './salaIA.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N5 · «IA a mi alcance», parada 2 · `n5-la-ia-aprende-con-datos`
 * 5.º de primaria · 10–11 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **La primera clase que monta los dos motores de IA a la vez**, y la que
 * desbloquea las otras tres del clasificador (`n7-como-aprende-la-ia`,
 * `n8-sesgos-y-errores`, `n10-como-funcionan-los-modelos`).
 *
 *   `simuladores/aprendizaje/`  DECIDE  — árbol de decisión explicable
 *   `simuladores/asistente/`    CUENTA  — chat con respuestas guionizadas
 *
 * Ninguno de los dos corrige: los dos dan hechos. **Corregir es trabajo de
 * esta clase**, y aquí está escrito lo que hace con ellos.
 *
 * ── La junta, en tres líneas ──────────────────────────────────────────────
 *
 * El panel calcula, se queda con la primera señal que el guion sepa contestar
 * y la manda al chat como una ficha:
 *
 *     const s = senalDePrediccion(prediccion);      // 'valor-no-visto:color=gris'
 *     ia.enviarFicha({ id: s.id, etiqueta: '¿Por qué dijiste eso?', pregunta });
 *
 * El alumno lee la pregunta; el id de abajo es el del motor. Por eso el guion
 * es portable a las otras tres clases sin cambiar una palabra.
 *
 * ── Las cinco escenas ─────────────────────────────────────────────────────
 *
 *   0 · portada de objetivos (entrar sin saber el tema está declarado defecto)
 *   1 · etiquetar   8 fichas. «Entrenar» no se enciende hasta las ocho.
 *   2 · entrenar    el árbol, EN PALABRAS, y lo que no miró. Y el aviso del
 *                   punto ciego —`informeDe().ciegos`— ANTES de probar.
 *   3 · probar      4 fichas nuevas. El gato negro falla al 100 %; el perro
 *                   gris se atasca. Los dos estaban anunciados.
 *   4 · arreglar    dos rondas: poner en la mesa la ficha que faltaba y
 *                   volver a entrenar. Si no cura, se quita y se prueba otra.
 *
 * ── El puntaje se queda en 100, y es una decisión ─────────────────────────
 *
 * Aquí **no se resta nunca**. Ni cuando la máquina falla —el fallo es el
 * contenido de la clase, no un error del alumno— ni cuando el alumno pone una
 * ficha que no cura: eso es un experimento, y el experimento que sale mal
 * también enseña. Por eso no hay una sola llamada a `restar()` en el archivo.
 */

const TOTAL_PASOS = FICHAS.length + 1 + PRUEBAS.length + RONDAS.length;

type Fase = 'portada' | 'etiquetar' | 'entrenado' | 'probando' | 'boletin' | 'arreglando' | 'fin';

const PORTADA: DatosPortadaIA = {
  situacion: 'El club de mascotas de la escuela quiere una app que reconozca gatos y perros.',
  tema: 'La IA aprende con datos',
  objetivo:
    'Explicar por qué una máquina se equivoca mirando los datos con los que la entrenaron, y arreglarla añadiendo el ejemplo que le faltaba.',
  vasAHacer: [
    'Etiquetar ocho fichas: gato o perro.',
    'Entrenar a la máquina y ver, en palabras, lo que aprendió.',
    'Preguntarle qué es lo que todavía NO sabe, antes de probarla.',
    'Probarla con cuatro fichas nuevas y ver dónde falla.',
    'Ponerle en la mesa la ficha que le faltaba y volver a entrenar.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 16,
  insignia: { nombre: 'Entrenadora de máquinas', emoji: '🧠' },
  boton: 'Abrir Tecnia Entrena',
  acento: '#22d3ee',
};

const ENCARGO: Record<Fase, string> = {
  portada: '',
  etiquetar: 'Pon la etiqueta a las ocho fichas: gato o perro. La máquina sólo va a saber lo que tú le pongas.',
  entrenado:
    'Ya entrenó. Mira su árbol de preguntas y, antes de probarla, pregúntale qué es lo que todavía no sabe.',
  probando: 'Preséntale las fichas nuevas, una por una, y mira qué contesta y con cuánta seguridad.',
  boletin: 'Mira su boletín color por color. La nota de arriba no cuenta toda la verdad.',
  arreglando: 'Pon en la mesa la ficha que le faltaba y vuelve a entrenar. Si no la arregla, la quitas y pruebas otra.',
  fin: '',
};

/* ── Cómo se elige qué le cuenta el chat ──────────────────────────────────── */

/**
 * De qué habla el asistente ANTES de probar. El orden es a propósito: primero
 * lo que impide jugar (no hay modelo, falta una etiqueta entera) y luego el
 * punto ciego, que es la lección. La primera señal de la lista que el guion
 * sepa contestar es la que se manda.
 */
const ORDEN_AVISO = ['sin-modelo', 'etiqueta-vacia', 'ciego', 'pocos-ejemplos'] as const;

function avisoPrevio(senales: Senal[]): Senal | null {
  for (const clase of ORDEN_AVISO) {
    const s = senales.find((x) => x.clase === clase && FICHAS_CONTESTADAS.has(x.id));
    if (s) return s;
  }
  return null;
}

/**
 * El id de señal que explica una respuesta concreta. Se busca en este orden:
 *
 *  1. lo que dice el propio motor de la predicción (`senalDePrediccion`):
 *     atasco, empate, sin modelo;
 *  2. si falló desde una hoja limpia, el HUECO por el que se fue: recorrió
 *     `color = negro` y en el banco no hay ni un gato negro;
 *  3. si acertó pero la hoja se sostiene en un ejemplo, que lo diga;
 *  4. y si no, la pregunta de siempre: ¿por qué estás tan segura?
 */
function idQueExplica(p: Prediccion, verdad: string, auditoria: Auditoria, informe: Informe): string {
  const s = senalDePrediccion(p);
  if (s && FICHAS_CONTESTADAS.has(s.id)) return s.id;

  if (p.etiqueta !== verdad) {
    for (const c of p.condiciones) {
      const hueco = auditoria.huecos.find(
        (h) => h.rasgo === c.rasgo && h.valor === c.valor && h.etiqueta === verdad,
      );
      if (hueco) {
        const id = `hueco:${hueco.rasgo}=${hueco.valor}/${hueco.etiqueta}`;
        if (FICHAS_CONTESTADAS.has(id)) return id;
      }
    }
  }

  if (p.nodo && informe.memorizadas.some((r) => r.nodo === p.nodo)) {
    const id = `memoriza:${p.nodo}`;
    if (FICHAS_CONTESTADAS.has(id)) return id;
  }

  return F_HOJA_LIMPIA;
}

/* ── El árbol, en palabras ────────────────────────────────────────────────── */

function ArbolEnPalabras({ nodo, sangria = 0 }: { nodo: Nodo; sangria?: number }) {
  if (nodo.tipo === 'hoja') {
    return (
      <p className="tia-arbol-hoja" style={{ marginLeft: sangria * 14 }} data-nodo={nodo.id}>
        <span className="tia-arbol-flecha" aria-hidden="true">
          →
        </span>
        digo <b>{comoSeLee(nodo.mayoria)}</b>
        <span className="tia-arbol-apoyo">
          {nodo.total === 1 ? '1 ficha' : `${nodo.total} fichas`}
          {nodo.empate ? ' · empatadas' : ''}
        </span>
      </p>
    );
  }

  return (
    <div className="tia-arbol-bloque" data-nodo={nodo.id}>
      <p className="tia-arbol-pregunta" style={{ marginLeft: sangria * 14 }}>
        pregunto por: <b>{comoSeLee(nodo.rasgo)}</b>
      </p>
      {nodo.ramas.map((r) => (
        <div key={r.valor}>
          <p className="tia-arbol-rama" style={{ marginLeft: (sangria + 1) * 14 }}>
            si dice «<b>{comoSeLee(r.valor)}</b>»
          </p>
          <ArbolEnPalabras nodo={r.nodo} sangria={sangria + 2} />
        </div>
      ))}
      {nodo.sinRama.length > 0 && (
        <p className="tia-arbol-sinrama" style={{ marginLeft: (sangria + 1) * 14 }}>
          si dice «<b>{nodo.sinRama.map(comoSeLee).join('» o «')}</b>» · no tengo ni una ficha así, me atasco
        </p>
      )}
    </div>
  );
}

/* ── El laboratorio ───────────────────────────────────────────────────────── */

export function LabLaIaAprendeConDatos(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [etiquetas, setEtiquetas] = useState<Record<string, string>>({});
  const [anadidas, setAnadidas] = useState<Ejemplo[]>([]);
  const [enMesa, setEnMesa] = useState<Candidata | null>(null);
  const [indiceP, setIndiceP] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Prediccion>>({});
  const [ronda, setRonda] = useState(0);
  const [avisoDado, setAvisoDado] = useState(false);
  const [pregunta, setPregunta] = useState<FichaPrompt | null>(null);

  const { linea, hablar } = useBit();
  const lab = useLabActividad(props, TOTAL_PASOS);
  const ia = useAsistente({ guion: GUION, saludo: SALUDO, velocidad: 14, paso: 4 });

  /*
   * Aquí NO hay espejo `vivo` de los 59 laboratorios arcade, y es a propósito:
   * ese ref existe porque allí los manejadores corren dentro de temporizadores
   * y se quedarían con estado viejo. Esta clase no programa ni un
   * `setTimeout` —cada paso lo da un clic— así que los manejadores leen el
   * estado del render que los pintó, que es exactamente el que el alumno está
   * viendo. Copiar el ref sin sus temporizadores sería copiar la forma sin el
   * motivo, y añade un sitio más donde el estado puede quedarse atrás.
   */

  /* ── Lo que sabe la máquina, ahora mismo ─────────────────────────────── */

  const ejemplos = useMemo<Ejemplo[]>(() => {
    const delAlumno = FICHAS.filter((f) => etiquetas[f.id]).map((f) => comoEjemplo(f, etiquetas[f.id]));
    const puesta = enMesa ? [candidataComoEjemplo(enMesa)] : [];
    return [...delAlumno, ...anadidas, ...puesta];
  }, [etiquetas, anadidas, enMesa]);

  const auditoria = useMemo(() => examinar(ESQUEMA, ejemplos), [ejemplos]);
  const modelo = useMemo(() => entrenar(ESQUEMA, ejemplos), [ejemplos]);
  const informe = useMemo(() => informeDe(modelo), [modelo]);

  /** El examen entero sólo se mira cuando ya se preguntaron las cuatro. */
  const examen = useMemo(() => evaluar(modelo, EJEMPLOS_DE_PRUEBA), [modelo]);
  const brechaColor = useMemo(() => brechaDe(examen, 'color'), [examen]);

  const senales = useMemo(
    () => senalesDe({ auditoria, informe, examen, brechas: ['color'] }),
    [auditoria, informe, examen],
  );

  const faltanEtiquetas = FICHAS.filter((f) => !etiquetas[f.id]).length;
  const pruebaActual = PRUEBAS[indiceP];
  const rondaActual = RONDAS[ronda];
  const pruebaDeRonda = PRUEBAS.find((p) => p.id === rondaActual?.pruebaId) ?? PRUEBAS[0];

  /* ── Hablar con la máquina ───────────────────────────────────────────── */

  /**
   * Manda una pregunta al chat y **dice si entró**.
   *
   * Devolver el resultado no es adorno: `useAsistente` rechaza lo que llegue
   * mientras está escribiendo (`'ocupado'`), y el primer recorrido a mano
   * enseñó lo que pasa si no se mira. Al pulsar «Entrenar» sale un mensaje;
   * si el alumno pulsaba enseguida «Pregúntale qué NO sabe», el aviso del
   * punto ciego —que es LA lección de la clase— se perdía en silencio y el
   * botón se convertía igualmente en «Empezar a probarla». El aviso no se
   * daba y nadie se enteraba.
   *
   * Se cura por los dos lados: los botones de la mesa que hablan se apagan
   * mientras el chat escribe (así se ve por qué no se puede), y además el
   * paso sólo se da por dado si el mensaje entró de verdad.
   */
  const preguntar = useCallback(
    (f: FichaPrompt) => {
      const r = ia.enviarFicha(f);
      if (r === 'enviado') reproducirTono('select');
      return r === 'enviado';
    },
    [ia],
  );

  /* ── 1 · etiquetar ───────────────────────────────────────────────────── */

  const etiquetar = (fichaId: string, etiqueta: string) => {
    if (fase !== 'etiquetar') return;
    const nueva = !etiquetas[fichaId];
    reproducirTono(nueva ? 'correct' : 'select');
    setEtiquetas((prev) => ({ ...prev, [fichaId]: etiqueta }));
    if (nueva) lab.avanzar();
  };

  /* ── 2 · entrenar ────────────────────────────────────────────────────── */

  const entrenarAhora = () => {
    if (fase !== 'etiquetar') return;
    reproducirTono('power');
    lab.avanzar();
    setFase('entrenado');
    hablar(ENCARGO.entrenado);
    preguntar({ id: F_YA_ENTRENE, etiqueta: '¿Qué aprendiste?', pregunta: '¿Qué aprendiste de mis fichas?' });
  };

  const aviso = avisoPrevio(senales);

  const pedirElAviso = () => {
    if (fase !== 'entrenado') return;
    const entro = preguntar({
      id: aviso ? aviso.id : F_QUE_NO_MIRASTE,
      etiqueta: '¿Hay algo que todavía NO sepas?',
      pregunta: '¿Hay algo que todavía no sepas?',
      icono: '⚠️',
    });
    if (entro) setAvisoDado(true);
  };

  const empezarAProbar = () => {
    if (fase !== 'entrenado') return;
    reproducirTono('select');
    setFase('probando');
    setIndiceP(0);
    setPregunta(null);
    hablar(ENCARGO.probando);
  };

  /* ── 3 · probar ──────────────────────────────────────────────────────── */

  const preguntarALaMaquina = () => {
    if (fase !== 'probando') return;
    const prueba = PRUEBAS[indiceP];
    if (!prueba || respuestas[prueba.id]) return;

    const p = predecir(modelo, { color: prueba.color, orejas: prueba.orejas, cola: prueba.cola });
    reproducirTono(p.etiqueta === prueba.verdad ? 'correct' : 'error');
    setRespuestas((prev) => ({ ...prev, [prueba.id]: p }));
    lab.avanzar();

    const id = idQueExplica(p, prueba.verdad, auditoria, informe);
    setPregunta({
      id,
      etiqueta: p.etiqueta === prueba.verdad ? '¿Por qué estás tan segura?' : `¿Por qué dijiste «${comoSeLee(p.etiqueta ?? '')}»?`,
      pregunta:
        p.etiqueta === prueba.verdad
          ? '¿Por qué estás tan segura?'
          : `¿Por qué dijiste que ${prueba.nombre} es un ${comoSeLee(p.etiqueta ?? '')}?`,
    });
  };

  const siguientePrueba = () => {
    if (fase !== 'probando') return;
    reproducirTono('select');
    setPregunta(null);
    const siguiente = indiceP + 1;
    if (siguiente >= PRUEBAS.length) {
      setFase('boletin');
      hablar(ENCARGO.boletin);
    } else {
      setIndiceP(siguiente);
    }
  };

  const irAArreglar = () => {
    if (fase !== 'boletin') return;
    reproducirTono('select');
    setFase('arreglando');
    setRonda(0);
    setPregunta(null);
    hablar(ENCARGO.arreglando);
  };

  /* ── 4 · arreglar ────────────────────────────────────────────────────── */

  const ponerEnLaMesa = (c: Candidata) => {
    if (fase !== 'arreglando' || enMesa) return;
    const meta = RONDAS[ronda];
    const objetivo = PRUEBAS.find((p) => p.id === meta.pruebaId);
    if (!objetivo) return;

    /*
     * Se vuelve a entrenar de verdad con la ficha puesta y se vuelve a
     * preguntar. **No se lee el campo `cura` de la candidata**: si la clase
     * decidiera por la etiqueta en vez de por el motor, podría estar
     * mintiendo. El campo existe sólo para que la prueba compruebe que el
     * motor y el material dicen lo mismo.
     */
    const conLaFicha = entrenar(ESQUEMA, [...ejemplos, candidataComoEjemplo(c)]);
    const p = predecir(conLaFicha, { color: objetivo.color, orejas: objetivo.orejas, cola: objetivo.cola });
    const curo = p.etiqueta === objetivo.verdad;

    reproducirTono(curo ? 'correct' : 'error');
    setEnMesa(c);
    setRespuestas((prev) => ({ ...prev, [objetivo.id]: p }));
    preguntar({
      id: `${PON}${c.id}`,
      etiqueta: c.etiquetaBoton,
      pregunta: `Puse en la mesa: ${c.etiquetaBoton.toLowerCase()}. Vuelve a entrenar.`,
    });
  };

  const quitarDeLaMesa = () => {
    if (fase !== 'arreglando' || !enMesa) return;
    reproducirTono('close');
    setEnMesa(null);
  };

  const cerrarRonda = () => {
    if (fase !== 'arreglando') return;
    const puesta = enMesa;
    if (!puesta) return;
    reproducirTono('correct');
    setAnadidas((prev) => [...prev, candidataComoEjemplo(puesta)]);
    setEnMesa(null);
    const hechos = lab.avanzar();
    const siguiente = ronda + 1;
    if (siguiente >= RONDAS.length) {
      const segundos = Math.max(1, Math.round((Date.now() - lab.sim.current.inicio) / 1000));
      setFase('fin');
      lab.terminar(segundos, () =>
        hablar('¡Lo arreglaste! La máquina no era tonta: le faltaban fichas. Y se las pusiste tú.'),
      );
      return;
    }
    setRonda(siguiente);
    hablar(`Faltan ${TOTAL_PASOS - hechos} pasos. Ahora, ${RONDAS[siguiente].titulo.toLowerCase()}.`);
  };

  const repetir = () => {
    setFase('etiquetar');
    setEtiquetas({});
    setAnadidas([]);
    setEnMesa(null);
    setIndiceP(0);
    setRespuestas({});
    setRonda(0);
    setAvisoDado(false);
    setPregunta(null);
    ia.reiniciar();
    lab.reiniciar(() => hablar(ENCARGO.etiquetar));
  };

  /* ── Las fichas que el alumno puede pulsar en el chat ─────────────────── */

  const fichas = useMemo<FichaPrompt[]>(() => {
    if (fase === 'etiquetar') {
      return [
        { id: F_QUE_MIRAS, etiqueta: '¿Tú ves las fotos?', pregunta: '¿Tú ves las fotos?', icono: '👀' },
        { id: F_COMO_APRENDES, etiqueta: '¿Cómo vas a aprender?', pregunta: '¿Cómo vas a aprender?', icono: '🧩' },
      ];
    }
    if (fase === 'entrenado') {
      return [
        { id: F_QUE_NO_MIRASTE, etiqueta: '¿Miraste la cola?', pregunta: '¿Miraste la cola?', icono: '🐈' },
      ];
    }
    if (fase === 'probando' && pregunta) return [pregunta];
    if (fase === 'boletin') {
      const b = senales.find((s) => s.clase === 'brecha' && FICHAS_CONTESTADAS.has(s.id));
      return b
        ? [{ id: b.id, etiqueta: '¿Y tu boletín por colores?', pregunta: '¿Y tu boletín color por color?', icono: '📊' }]
        : [];
    }
    return [];
  }, [fase, pregunta, senales]);

  /* ── Lo que se ve ────────────────────────────────────────────────────── */

  const aciertos = PRUEBAS.filter((p) => respuestas[p.id]?.etiqueta === p.verdad).length;

  const marcador =
    fase === 'etiquetar'
      ? { etiqueta: 'Fichas', valor: `${FICHAS.length - faltanEtiquetas}/${FICHAS.length}` }
      : fase === 'entrenado'
        ? { etiqueta: 'Preguntas', valor: `${informe.rasgosUsados.length}` }
        : fase === 'probando' || fase === 'boletin'
          ? { etiqueta: 'Acierta', valor: `${aciertos}/${PRUEBAS.length}` }
          : { etiqueta: 'Arreglos', valor: `${ronda}/${RONDAS.length}` };

  const apoyoEncendido = new Set(
    fase === 'probando' && pruebaActual && respuestas[pruebaActual.id]
      ? respuestas[pruebaActual.id].apoyo
      : [],
  );

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="La IA aprende con datos"
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
                insigniaNombre: 'Entrenadora de máquinas',
                insigniaEmoji: '🧠',
                titulo: '¡La arreglaste tú!',
                detalle:
                  'La máquina no era tonta ni lista: era sus fichas. Le faltaba un gato negro y le faltaba algo gris, y por eso fallaba siempre en lo mismo. Se lo pusiste en la mesa, volvió a entrenar y ahora acierta las cuatro. Eso es lo que hace de verdad quien entrena una IA: mirar los datos, no la máquina.',
                resumen: [
                  { etiqueta: 'Fichas enseñadas', valor: `${ejemplos.length}` },
                  { etiqueta: 'Acierta', valor: `${aciertos}/${PRUEBAS.length}` },
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
                setFase('etiquetar');
                hablar(ENCARGO.etiquetar);
              }}
            />
          )}

          {/*
            El programa no se monta hasta pasar la portada. Con la portada
            encima parecía dar igual —tapa la pantalla entera—, pero detrás
            quedaba una mesa con el encargo vacío y el título de la última
            escena («Arregla el gato negro»): un lector de pantalla lo leía y
            era, además, el final de la clase contado antes de empezarla. Lo
            cazó la prueba de la portada.
          */}
          {fase !== 'portada' && fase !== 'fin' && (
          <VentanaBase marca="Tecnia Entrena" subtitulo="Clasificador de mascotas del club" claseMarco="tia-marco">
            <div className="tia-cuerpo">
              {/* ── La mesa: el programa de verdad ── */}
              <section className="tia-mesa" data-testid="tia-mesa" data-fase={fase}>
                <header className="tia-mesa-cabecera">
                  <h2 className="tia-mesa-titulo">
                    {fase === 'etiquetar'
                      ? 'Tu montón de fichas'
                      : fase === 'entrenado'
                        ? 'Lo que aprendió'
                        : fase === 'probando'
                          ? 'Fichas que nunca vio'
                          : fase === 'boletin'
                            ? 'Su boletín, color por color'
                            : rondaActual?.titulo ?? 'Arreglar'}
                  </h2>
                  <p className="tia-mesa-encargo">{ENCARGO[fase]}</p>
                </header>

                {/* 1 · etiquetar */}
                {fase === 'etiquetar' && (
                  <>
                    <div className="tia-rejilla">
                      {FICHAS.map((f) => {
                        const puesta = etiquetas[f.id];
                        return (
                          <article key={f.id} className={`tia-ficha${puesta ? ' es-puesta' : ''}`} data-ficha={f.id}>
                            <span className="tia-ficha-dibujo" aria-hidden="true">
                              {f.emoji}
                            </span>
                            <p className="tia-ficha-nombre">{f.nombre}</p>
                            <ul className="tia-ficha-rasgos">
                              <li>{comoSeLee(f.color)}</li>
                              <li>orejas {comoSeLee(f.orejas)}</li>
                              <li>cola {comoSeLee(f.cola)}</li>
                            </ul>
                            <div className="tia-etiquetadores">
                              <button
                                type="button"
                                className={`tia-etiquetador es-gato${puesta === GATO ? ' es-elegida' : ''}`}
                                aria-pressed={puesta === GATO}
                                onClick={() => etiquetar(f.id, GATO)}
                              >
                                gato
                              </button>
                              <button
                                type="button"
                                className={`tia-etiquetador es-perro${puesta === PERRO ? ' es-elegida' : ''}`}
                                aria-pressed={puesta === PERRO}
                                onClick={() => etiquetar(f.id, PERRO)}
                              >
                                perro
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <div className="tia-banda">
                      <p className="tia-banda-cuenta">
                        {auditoria.porEtiqueta[GATO] ?? 0} gatos · {auditoria.porEtiqueta[PERRO] ?? 0} perros ·{' '}
                        {faltanEtiquetas} sin etiqueta
                      </p>
                      <button
                        type="button"
                        className="tia-boton"
                        disabled={faltanEtiquetas > 0 || ia.ocupado}
                        onClick={entrenarAhora}
                        data-testid="tia-entrenar"
                      >
                        ⚡ Entrenar a la máquina
                      </button>
                    </div>
                  </>
                )}

                {/* 2 · lo que aprendió */}
                {fase === 'entrenado' && (
                  <>
                    <div className="tia-arbol" data-testid="tia-arbol">
                      <p className="tia-arbol-cabeza">Su árbol de preguntas, entero:</p>
                      {modelo.raiz ? (
                        <ArbolEnPalabras nodo={modelo.raiz} />
                      ) : (
                        <p className="tia-arbol-hoja">No aprendió nada: no tiene ni una ficha.</p>
                      )}
                    </div>
                    {informe.rasgosIgnorados.length > 0 && (
                      <p className="tia-nota" data-testid="tia-ignorados">
                        Ni siquiera miró: {informe.rasgosIgnorados.map(comoSeLee).join(', ')}.
                      </p>
                    )}
                    <div className="tia-banda">
                      {!avisoDado ? (
                        <button
                          type="button"
                          className="tia-boton es-aviso"
                          disabled={ia.ocupado}
                          onClick={pedirElAviso}
                          data-testid="tia-aviso"
                        >
                          ⚠️ Pregúntale qué NO sabe
                        </button>
                      ) : (
                        <button type="button" className="tia-boton" onClick={empezarAProbar} data-testid="tia-probar">
                          🔍 Empezar a probarla
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* 3 · probar */}
                {fase === 'probando' && pruebaActual && (
                  <>
                    <article className="tia-prueba" data-prueba={pruebaActual.id}>
                      <span className="tia-ficha-dibujo" aria-hidden="true">
                        {pruebaActual.emoji}
                      </span>
                      <div>
                        <p className="tia-ficha-nombre">{pruebaActual.nombre}</p>
                        <ul className="tia-ficha-rasgos">
                          <li>{comoSeLee(pruebaActual.color)}</li>
                          <li>orejas {comoSeLee(pruebaActual.orejas)}</li>
                          <li>cola {comoSeLee(pruebaActual.cola)}</li>
                        </ul>
                      </div>
                      <p className="tia-prueba-porque">{pruebaActual.porQue}</p>
                    </article>

                    {respuestas[pruebaActual.id] ? (
                      <div
                        className={`tia-veredicto${respuestas[pruebaActual.id].etiqueta === pruebaActual.verdad ? ' es-bien' : ' es-mal'}`}
                        data-testid="tia-veredicto"
                      >
                        <p className="tia-veredicto-dijo">
                          La máquina dice: <b>{comoSeLee(respuestas[pruebaActual.id].etiqueta ?? '—')}</b>
                        </p>
                        <p className="tia-veredicto-verdad">
                          {respuestas[pruebaActual.id].etiqueta === pruebaActual.verdad
                            ? 'Acertó.'
                            : `Se equivocó: ${pruebaActual.nombre} es un ${comoSeLee(pruebaActual.verdad)}.`}
                        </p>
                        <p className="tia-seguridad">
                          Seguridad: <b>{Math.round(respuestas[pruebaActual.id].confianza * 100)} %</b>
                          {respuestas[pruebaActual.id].motivo === 'valor-no-visto' && (
                            <span className="tia-atasco"> · se atascó, no tenía por dónde seguir</span>
                          )}
                        </p>
                        <p className="tia-apoyo">
                          Se apoyó en {apoyoEncendido.size === 0 ? 'ninguna ficha' : `${apoyoEncendido.size} de tus fichas`}
                          {apoyoEncendido.size > 0 && `: ${FICHAS.filter((f) => apoyoEncendido.has(f.id)).map((f) => f.nombre).join(', ')}`}
                          {apoyoEncendido.size > 0 &&
                            [...apoyoEncendido].filter((id) => !FICHAS.some((f) => f.id === id)).length > 0 &&
                            ' y alguna que pusiste tú'}
                          .
                        </p>
                      </div>
                    ) : (
                      <p className="tia-nota">Todavía no la ha visto. Preséntasela.</p>
                    )}

                    <div className="tia-banda">
                      {!respuestas[pruebaActual.id] ? (
                        <button
                          type="button"
                          className="tia-boton"
                          onClick={preguntarALaMaquina}
                          data-testid="tia-preguntar"
                        >
                          🔎 Preguntarle por {pruebaActual.nombre}
                        </button>
                      ) : (
                        <button type="button" className="tia-boton" onClick={siguientePrueba} data-testid="tia-siguiente">
                          {indiceP + 1 >= PRUEBAS.length ? 'Ver su boletín →' : 'Siguiente ficha →'}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* 3b · el boletín por colores */}
                {fase === 'boletin' && (
                  <>
                    <p className="tia-nota">
                      Nota general: <b>{Math.round((aciertos / PRUEBAS.length) * 100)} %</b>. Suena a «regular». Mira por
                      colores:
                    </p>
                    <ul className="tia-boletin" data-testid="tia-boletin">
                      {brechaColor.grupos.map((g) => (
                        <li key={g.valor} className={`tia-boletin-fila${g.acierto === 0 ? ' es-cero' : ''}`}>
                          <span className="tia-boletin-color">{comoSeLee(g.valor)}</span>
                          <span className="tia-boletin-barra">
                            <i style={{ width: `${Math.round(g.acierto * 100)}%` }} />
                          </span>
                          <b>{Math.round(g.acierto * 100)} %</b>
                        </li>
                      ))}
                    </ul>
                    <p className="tia-nota">
                      La diferencia entre el color que mejor le sale y el que peor es de{' '}
                      <b>{Math.round(brechaColor.diferencia * 100)} puntos</b>.
                    </p>
                    <div className="tia-banda">
                      <button type="button" className="tia-boton" onClick={irAArreglar} data-testid="tia-arreglar">
                        🔧 Vamos a arreglarla
                      </button>
                    </div>
                  </>
                )}

                {/* 4 · arreglar */}
                {fase === 'arreglando' && rondaActual && (
                  <>
                    <article className="tia-prueba" data-prueba={pruebaDeRonda.id}>
                      <span className="tia-ficha-dibujo" aria-hidden="true">
                        {pruebaDeRonda.emoji}
                      </span>
                      <div>
                        <p className="tia-ficha-nombre">{pruebaDeRonda.nombre}</p>
                        <ul className="tia-ficha-rasgos">
                          <li>{comoSeLee(pruebaDeRonda.color)}</li>
                          <li>orejas {comoSeLee(pruebaDeRonda.orejas)}</li>
                          <li>cola {comoSeLee(pruebaDeRonda.cola)}</li>
                        </ul>
                      </div>
                      <p className="tia-prueba-porque">
                        Es un {comoSeLee(pruebaDeRonda.verdad)}, y ahora mismo la máquina dice{' '}
                        <b>{comoSeLee(respuestas[pruebaDeRonda.id]?.etiqueta ?? '—')}</b>.
                      </p>
                    </article>

                    {!enMesa ? (
                      <>
                        <p className="tia-nota">¿Qué ficha crees que le falta? Pon una en la mesa.</p>
                        <div className="tia-bandeja" data-testid="tia-bandeja">
                          {rondaActual.candidatas.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="tia-candidata"
                              data-candidata={c.id}
                              disabled={ia.ocupado}
                              onClick={() => ponerEnLaMesa(c)}
                            >
                              <span className="tia-candidata-dibujo" aria-hidden="true">
                                {c.emoji}
                              </span>
                              <span className="tia-candidata-nombre">{c.etiquetaBoton}</span>
                              <span className="tia-candidata-rasgos">
                                {comoSeLee(c.color)} · orejas {comoSeLee(c.orejas)} · cola {comoSeLee(c.cola)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className={`tia-veredicto${respuestas[pruebaDeRonda.id]?.etiqueta === pruebaDeRonda.verdad ? ' es-bien' : ' es-mal'}`}
                          data-testid="tia-veredicto"
                        >
                          <p className="tia-veredicto-dijo">
                            Con «{enMesa.etiquetaBoton.toLowerCase()}» en la mesa, ahora dice:{' '}
                            <b>{comoSeLee(respuestas[pruebaDeRonda.id]?.etiqueta ?? '—')}</b>
                          </p>
                          <p className="tia-seguridad">
                            Seguridad: <b>{Math.round((respuestas[pruebaDeRonda.id]?.confianza ?? 0) * 100)} %</b>
                            {respuestas[pruebaDeRonda.id]?.motivo === 'valor-no-visto' && (
                              <span className="tia-atasco"> · sigue atascada</span>
                            )}
                          </p>
                        </div>
                        <div className="tia-banda">
                          {respuestas[pruebaDeRonda.id]?.etiqueta === pruebaDeRonda.verdad ? (
                            <button type="button" className="tia-boton" onClick={cerrarRonda} data-testid="tia-cerrar-ronda">
                              {ronda + 1 >= RONDAS.length ? '¡Terminar!' : 'Dejarla puesta y seguir →'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="tia-boton es-fantasma"
                              onClick={quitarDeLaMesa}
                              data-testid="tia-quitar"
                            >
                              ↩ Quitar la ficha y probar otra
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>

              {/* ── El chat: la máquina se explica ── */}
              <div className="tia-chat">
                <VentanaAsistente
                  mensajes={ia.mensajes}
                  escribiendo={ia.ocupado}
                  onSaltarTecleo={ia.saltarTecleo}
                  compositor={{
                    titulo: fichas.length > 0 ? 'Pregúntale' : 'Ahora mismo no hay nada que preguntarle',
                    fichas,
                    onEnviarFicha: (id) => {
                      const f = fichas.find((x) => x.id === id);
                      if (f) preguntar(f);
                    },
                    deshabilitado: ia.ocupado,
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

export default LabLaIaAprendeConDatos;
