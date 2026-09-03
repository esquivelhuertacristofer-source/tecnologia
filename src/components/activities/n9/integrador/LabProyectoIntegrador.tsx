'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { EstudioWeb, useEstudioWeb, type EventoPagina, type HerramientaWeb } from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';
import {
  archivosInicialesProyectoIntegrador,
  DATOS_REFUGIO,
  GUION_PROYECTO_INTEGRADOR,
  PLANTILLAS_PROYECTO_INTEGRADOR,
} from './guionSitio';

/**
 * `n9-proyecto-integrador` — el CAPSTONE de todo N9 (documento §54,
 * `n9-proyecto-integrador-secundaria`, `integradora: true`). **3.º de
 * secundaria, 14–15 años.** Es la ÚLTIMA actividad del nivel: cierra los
 * nueve niveles de secundaria de Tecnia.
 *
 * ── Por qué es la única clase de la plataforma con DOS armazones a la vez ───
 *
 * Nueve encargos en cuatro actos, y los actos no comparten un solo tipo de
 * pantalla:
 *
 *   Acto 1 (1–2) · clasificar 5 problemas + MCQ  → panel de decisión puro,
 *   Acto 2 (3–4) · el caso del refugio            → panel de decisión puro,
 *   Acto 3 (5–8) · construir el sitio de verdad    → el motor `EstudioWeb`,
 *   Acto 4 (9)   · cierre                          → panel de decisión puro.
 *
 * `n9-ia-y-trabajo` (panel puro) usa `VentanaBase` a secas, sin `ArcadeSala`,
 * porque «no hay nada que enseñar a operar». `n9-marca-personal` (motor
 * puro) sí usa `ArcadeSala` alrededor de `EstudioWeb`. Esta clase tiene las
 * dos cosas dentro de la MISMA sesión, así que se decidió una sola cáscara
 * para las nueve: `ArcadeSala` envuelve el laboratorio entero del primer
 * encargo al noveno, y lo que cambia por dentro —panel o `EstudioWeb`— es
 * sólo el `children` de turno. La alternativa (montar y desmontar
 * `ArcadeSala` al cruzar hacia el Acto 3) habría partido la marquesina de
 * pips 1→9 en dos máquinas distintas a media partida, que es justo el efecto
 * que la plantilla de oro busca evitar.
 *
 * `useEstudioWeb` se llama SIEMPRE (regla de los hooks), aunque su editor no
 * se pinte hasta el Acto 3: no hay riesgo de que un predicado se dé por
 * cumplido antes de tiempo porque nada llama a `estudio.escribir` ni a
 * `estudio.siguienteEncargo` hasta que el alumno teclea dentro del editor
 * montado, y el `<h1>` inicial de `index.html` no contiene el nombre real del
 * refugio (ver `guionSitio.ts`).
 *
 * ── Los dos contadores de progreso, y por qué no coinciden a propósito ──────
 *
 * La marquesina de `ArcadeSala` cuenta 1→9 (el capstone entero, vía
 * `useLabActividad`). El panel `<Encargo>` que trae `EstudioWeb` por dentro
 * cuenta 1→4 (su propio `GuionWeb`, ver `guionSitio.ts`). Los dos números son
 * correctos a la vez porque miden cosas distintas —el capstone completo
 * contra el sub-guion del Acto 3—, igual que un capítulo puede decir «3 de
 * 10» dentro de un libro que arriba dice «página 214 de 480». `lab.avanzar()`
 * se llama una vez por cada uno de los nueve encargos (cinco desde los
 * paneles, cuatro desde `onAvance` del estudio); el noveno NO llama a
 * `avanzar()` —se cuenta con `terminado ? TOTAL : lab.pasos`, el mismo truco
 * de `LabMarcaPersonal`— sino que dispara `lab.terminar()` desde un botón
 * aparte, exactamente como hace `LabIaYTrabajo` con «Recibir la insignia».
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · Acto 1 «Qué tipo de solución digital resuelve cada problema» — 1–2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cinco negocios reales, ninguno reutilizado del Acto 2 (Refugio Patitas) ni
 * de las unidades hermanas de N9 (`n9-construye-low-code`,
 * `n9-datos-con-python`, `n9-marca-personal`): mismo espíritu, casos nuevos.
 */

interface ItemClasificable {
  id: string;
  texto: string;
  correcta: string;
}

const PROBLEMAS_ACTO1: ItemClasificable[] = [
  {
    id: 'tienda-stock',
    texto:
      'Comercial La Esperanza tiene tres sucursales y quiere saber qué producto se agota más rápido cada mes, comparando las cifras de venta entre las tres, para no quedarse sin existencias.',
    correcta: 'datos',
  },
  {
    id: 'gimnasio-reservas',
    texto:
      'El gimnasio Vitalfit quiere que cada socio reserve su clase de la semana y revise su propio progreso —peso, rutinas cumplidas— cada semana, desde su celular y con su propia cuenta.',
    correcta: 'app',
  },
  {
    id: 'veterinaria-info',
    texto:
      'La veterinaria San Roque quiere que cualquiera que la busque en internet encuentre su horario, su dirección y la lista de servicios que ofrece, sin necesidad de crear ninguna cuenta.',
    correcta: 'sitio',
  },
  {
    id: 'liga-desempeno',
    texto:
      'El organizador de la liga infantil Copa Vecinal quiere decidir qué equipo se lleva el premio al mejor desempeño de la temporada, comparando goles a favor, goles en contra y partidos ganados de cada equipo.',
    correcta: 'datos',
  },
  {
    id: 'taller-info',
    texto:
      'El taller mecánico Motor Listo quiere que la gente encuentre en línea su horario, su teléfono y qué tipos de reparación hace, sin pedirle a nadie que se registre.',
    correcta: 'sitio',
  },
];

const OPCIONES_TIPO: { valor: string; etiqueta: string }[] = [
  { valor: 'app', etiqueta: '📱 Necesita una app' },
  { valor: 'sitio', etiqueta: '🌐 Necesita un sitio web' },
  { valor: 'datos', etiqueta: '📊 Necesita un análisis de datos' },
];

const MENSAJE_ACIERTO_CLASIFICACION =
  'Las cinco coinciden: Comercial La Esperanza y la Copa Vecinal necesitan comparar números para decidir algo —eso es análisis de datos—. Vitalfit necesita que el MISMO socio vuelva una y otra vez a su propia cuenta desde su celular —eso es una app—. Y la veterinaria y el taller sólo necesitan que cualquiera encuentre su información fija, sin cuenta de nadie —eso es un sitio web.';

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_DISTINGUE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Depende de qué necesita el problema: si la respuesta sale de comparar números, es análisis de datos; si la MISMA persona regresa una y otra vez a su propia cuenta, es una app; si es información fija que cualquiera consulta sin iniciar sesión, es un sitio web.',
    correcta: true,
    explicacion:
      'Exacto. Ninguno de los tres es "mejor" que los otros — cada uno resuelve un problema distinto, y el problema es el que decide cuál construir.',
  },
  {
    id: 'b',
    texto: 'Depende de qué tan grande sea el negocio: los negocios grandes necesitan una app y los pequeños un sitio web.',
    correcta: false,
    explicacion:
      'No: el tamaño del negocio no decide nada. El taller Motor Listo puede ser chiquito y de todos modos sólo necesita un sitio, mientras que un negocio grande podría necesitar análisis de datos si su problema es decidir algo comparando números.',
  },
  {
    id: 'c',
    texto: 'Depende de si el dueño del negocio sabe programar o no.',
    correcta: false,
    explicacion: 'No: lo que sabe hacer el dueño no cambia qué tipo de solución resuelve su problema. Eso lo decide el problema mismo, no quién lo va a construir.',
  },
  {
    id: 'd',
    texto: 'Depende de si el problema es urgente: los urgentes se resuelven con datos y los demás con un sitio.',
    correcta: false,
    explicacion:
      'No: la urgencia no es el criterio. Un sitio web puede ser tan urgente como cualquier otra cosa — lo que importa es qué tipo de problema es, no qué tan rápido hay que resolverlo.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · Acto 2 «El problema de hoy: Refugio Patitas» — 3–4
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CASO_REFUGIO =
  'Refugio Patitas es un refugio de animales pequeño, real y sin fines de lucro. La encargada, Doña Marisol, atiende a la gente que llega preguntando cómo adoptar, a qué hora pueden visitar y qué necesitan traer. No lleva cuentas de usuario ni tiene que decidir nada comparando cifras: sólo necesita que la información llegue a quien la busca.';

const OPCIONES_POR_QUE_SITIO: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque es información fija —horario, dirección, cómo adoptar— que cualquiera puede consultar sin crear una cuenta, y no hay ningún número que comparar para decidir algo.',
    correcta: true,
    explicacion:
      'Exacto. No hay una persona que vuelva todos los días a revisar su propio progreso (eso sería app), y no hay que comparar cifras para tomar una decisión (eso sería datos). Sólo hace falta que la información llegue a quien la busca.',
  },
  {
    id: 'b',
    texto: 'Porque un refugio de animales nunca podría pagar una app.',
    correcta: false,
    explicacion: 'El dinero no es el criterio: la razón de que sea un sitio es lo que el problema necesita, no lo que cuesta construirlo.',
  },
  {
    id: 'c',
    texto: 'Porque los sitios web son más fáciles de hacer que las apps, y Refugio Patitas es una organización chica.',
    correcta: false,
    explicacion: 'El tamaño de la organización tampoco es el criterio — repásalo con el criterio del Acto 1: ¿hay una cuenta de usuario que vuelve, o es información fija?',
  },
  {
    id: 'd',
    texto: 'Porque Refugio Patitas todavía no tiene ningún dato que analizar.',
    correcta: false,
    explicacion:
      'Se acerca, pero no es la razón completa: aunque tuviera muchos datos guardados, ninguna decisión de HOY depende de compararlos — el problema de hoy es que la gente encuentre la información.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · Acto 4 «Cierre» — 9
 * ═══════════════════════════════════════════════════════════════════════════
 */

const OPCIONES_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque necesitaba información fija —el nombre real, el horario real, cómo adoptar— que cualquier persona pudiera consultar sin cuenta, y ninguna decisión dependía de comparar números.',
    correcta: true,
    explicacion:
      'Exacto. Es el mismo criterio del Acto 1: sin cuenta de usuario que regresa y sin números que comparar, la solución correcta es un sitio — y por eso construiste index.html y adopta.html, no una app con inicio de sesión ni una tabla de cifras.',
  },
  {
    id: 'b',
    texto: 'Porque HTML y CSS son más fáciles que hacer una app.',
    correcta: false,
    explicacion: 'La dificultad no es el criterio — es lo que el problema necesita. Un sitio no es "la opción fácil": es la solución correcta para ESTE problema en concreto.',
  },
  {
    id: 'c',
    texto: 'Porque los refugios de animales siempre necesitan sitios web, nunca apps.',
    correcta: false,
    explicacion:
      'No hay una regla fija por tipo de negocio: un refugio más grande podría necesitar una app si, por ejemplo, sus voluntarios tuvieran que registrar visitas día tras día con su propia cuenta. Aquí, el problema concreto de Doña Marisol es el que decide.',
  },
  {
    id: 'd',
    texto: 'Porque todavía no habías aprendido a hacer una app.',
    correcta: false,
    explicacion:
      'No: el motivo no es lo que sabes hacer tú. Es lo que el problema de Refugio Patitas necesita — y ya viste, con el criterio del Acto 1, que eso es información fija sin cuenta ni números que comparar.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · El laboratorio
 * ═══════════════════════════════════════════════════════════════════════════
 */

const TOTAL = 9;
const NOMBRES_ACTO = ['Qué solución encaja', 'El problema de hoy', 'Constrúyelo de verdad', 'Cierre'] as const;

type Fase = 'clasificar-tipos' | 'mcq-tipos' | 'mcq-refugio' | 'confirma-datos' | 'construye' | 'mcq-cierre';

const ACTO_DE_FASE: Record<Fase, number> = {
  'clasificar-tipos': 0,
  'mcq-tipos': 0,
  'mcq-refugio': 1,
  'confirma-datos': 1,
  construye: 2,
  'mcq-cierre': 3,
};

const PORTADA_GENERAL: DatosPortadaWeb = {
  situacion: 'El proyecto integrador · el cierre de los nueve niveles de secundaria',
  tema: 'Problema real → solución digital: app, sitio o análisis de datos',
  objetivo:
    'Vas a decidir, con cinco casos reales, qué tipo de solución digital resuelve cada problema; vas a aplicar ese mismo criterio al caso real de un refugio de animales; y vas a construir su sitio de verdad, con HTML y CSS reales y los datos que te dio la encargada.',
  vasAHacer: [
    'Clasificar cinco problemas reales entre app, sitio web y análisis de datos.',
    'Decidir qué distingue exactamente a los tres tipos de solución.',
    'Conocer el caso real de Refugio Patitas y justificar por qué es un sitio web.',
    'Confirmar los datos reales que vas a usar — nada inventado.',
    'Escribir el nombre real del refugio en tu sitio.',
    'Escribir el horario real de visitas.',
    'Enlazar tu página de inicio con la página de adopción.',
    'Corregir un aviso real que ya trae el sitio.',
    'Cerrar explicando, con el mismo criterio, por qué este problema era un sitio web.',
  ],
  encargos: TOTAL,
  minutos: 45,
  insignia: { nombre: 'Graduado/a de desarrollo digital', emoji: '🎓' },
  boton: 'Empezar el proyecto integrador',
  acento: '#22d3ee',
};

const PORTADA_ACTO3: DatosPortadaWeb = {
  situacion: 'Acto 3 de 4 · con los datos reales de Doña Marisol',
  tema: 'Construye el sitio de Refugio Patitas: HTML y CSS reales',
  objetivo:
    'Vas a construir dos páginas reales —index.html y adopta.html— con el nombre real del refugio, su horario real, un enlace que conecte las dos páginas, y vas a corregir un aviso real que ya trae el sitio.',
  vasAHacer: [
    'Escribir el nombre real del refugio en el encabezado.',
    'Escribir el horario real de visitas.',
    'Enlazar tu página de inicio con la de adopción.',
    'Corregir el aviso real que señala el motor.',
  ],
  encargos: 4,
  minutos: 20,
  insignia: { nombre: 'Sitio construido', emoji: '🛠️' },
  boton: 'Empezar a construir',
  acento: '#34d399',
};

const LINEAS = {
  inicio:
    'Bienvenido al proyecto integrador: el cierre de todo tercero de secundaria. Antes de construir nada, vas a decidir qué tipo de solución digital resuelve cada problema — porque construir bien algo que no hacía falta no sirve de nada.',
  tomaLosDatos: 'Éstos son los datos reales del refugio. A partir de aquí, todo lo que escribas tiene que salir de esta tarjeta.',
  inicioConstruccion: 'Ahora sí: vas a construir el sitio de Refugio Patitas de verdad, con HTML y CSS reales.',
  finConstruccion: 'Sitio terminado: el nombre real, el horario real, el enlace entre tus dos páginas y un aviso real corregido. Falta una última pregunta.',
  fin: 'Proyecto integrador terminado. Decidiste con criterio qué tipo de solución construir, y la construiste de verdad. Ese es el cierre de tu formación en Tecnia, del nivel 1 al nivel 9.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabProyectoIntegrador(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const lab = useLabActividad(props, TOTAL);
  const { linea, hablar } = useBit();

  const [empezado, setEmpezado] = useState(false);
  const [empezadoActo3, setEmpezadoActo3] = useState(false);
  const [fase, setFase] = useState<Fase>('clasificar-tipos');
  const [aviso, setAviso] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [clasifTipos, setClasifTipos] = useState<Record<string, string | undefined>>({});
  const [distingueId, setDistingueId] = useState<string | null>(null);

  // Acto 2
  const [porQueSitioId, setPorQueSitioId] = useState<string | null>(null);

  // Acto 4
  const [cierreId, setCierreId] = useState<string | null>(null);

  const marcarAcierto = useCallback(
    (texto: string) => {
      lab.avanzar();
      reproducirTono('correct');
      setMensaje({ ok: true, texto });
      setAviso('✔ ¡Encargo cumplido!');
      hablar(texto);
      setBloqueado(true);
    },
    [lab, hablar],
  );

  const marcarError = useCallback(
    (texto: string) => {
      lab.restar();
      setMensaje({ ok: false, texto });
      hablar(texto);
    },
    [lab, hablar],
  );

  const avanzarPanel = useCallback(() => {
    setMensaje(null);
    setBloqueado(false);
    setAviso(null);
    setFase((f) => {
      if (f === 'clasificar-tipos') return 'mcq-tipos';
      if (f === 'mcq-tipos') return 'mcq-refugio';
      if (f === 'mcq-refugio') return 'confirma-datos';
      return f;
    });
  }, []);

  const terminarLab = useCallback(() => {
    lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
  }, [lab, hablar]);

  // ── Acto 1 ──────────────────────────────────────────────────────────────
  const comprobarClasificacion = useCallback(() => {
    if (bloqueado) return;
    const todas = PROBLEMAS_ACTO1.every((p) => clasifTipos[p.id] === p.correcta);
    if (todas) marcarAcierto(MENSAJE_ACIERTO_CLASIFICACION);
    else
      marcarError(
        'Todavía no coinciden las cinco. Pregúntate de cada negocio: ¿la respuesta sale de comparar números, necesita que la MISMA persona regrese con su cuenta, o sólo necesita enseñar información fija que cualquiera consulta?',
      );
  }, [bloqueado, clasifTipos, marcarAcierto, marcarError]);

  const elegirDistingue = useCallback(
    (op: OpcionMcq) => {
      if (bloqueado) return;
      setDistingueId(op.id);
      if (op.correcta) marcarAcierto(op.explicacion);
      else marcarError(op.explicacion);
    },
    [bloqueado, marcarAcierto, marcarError],
  );

  // ── Acto 2 ──────────────────────────────────────────────────────────────
  const elegirPorQueSitio = useCallback(
    (op: OpcionMcq) => {
      if (bloqueado) return;
      setPorQueSitioId(op.id);
      if (op.correcta) marcarAcierto(op.explicacion);
      else marcarError(op.explicacion);
    },
    [bloqueado, marcarAcierto, marcarError],
  );

  const confirmarDatos = useCallback(() => {
    lab.avanzar();
    reproducirTono('select');
    hablar(LINEAS.tomaLosDatos);
    setFase('construye');
  }, [lab, hablar]);

  // ── Acto 3: EstudioWeb, siempre montado (regla de los hooks) ────────────
  const alAvanceWeb = useCallback(
    (avance: number) => {
      const hechosWeb = Math.round(avance * GUION_PROYECTO_INTEGRADOR.pasos.length);
      lab.avanzar();
      reproducirTono('correct');
      setAviso('✔ ¡Encargo cumplido!');
      const paso = GUION_PROYECTO_INTEGRADOR.pasos[hechosWeb - 1];
      if (paso) hablar(paso.aprendido);
    },
    [lab, hablar],
  );

  const alTerminadoWeb = useCallback(() => {
    setAviso(null);
    hablar(LINEAS.finConstruccion);
    setFase('mcq-cierre');
  }, [hablar]);

  const estudioWeb = useEstudioWeb({
    archivos: archivosInicialesProyectoIntegrador(),
    guion: GUION_PROYECTO_INTEGRADOR,
    onAvance: alAvanceWeb,
    onTerminado: alTerminadoWeb,
  });

  /* El clic en el enlace propio de "index.html" navega de verdad hacia
   * "adopta.html": la misma prueba de que el enlace del encargo 3 sirve para
   * algo, y el mismo mecanismo de `n7-tu-sitio-personal`. */
  const alEventoWeb = (evento: EventoPagina) => {
    if (evento.tipo === 'enlace' && evento.interno && estudioWeb.paginas.includes(evento.destino)) {
      estudioWeb.verPagina(evento.destino);
    }
  };

  const herramientasWeb: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-proyecto-integrador',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: estudioWeb.terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_PROYECTO_INTEGRADOR[estudioWeb.activo.nombre];
        if (plantilla !== undefined) {
          estudioWeb.escribir(plantilla);
          setAviso(`↺ «${estudioWeb.activo.nombre}» restablecido`);
        }
      },
    },
  ];

  // ── Acto 4 ──────────────────────────────────────────────────────────────
  const elegirCierre = useCallback(
    (op: OpcionMcq) => {
      if (bloqueado) return;
      setCierreId(op.id);
      if (op.correcta) marcarAcierto(op.explicacion);
      else marcarError(op.explicacion);
    },
    [bloqueado, marcarAcierto, marcarError],
  );

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const empezarActo3 = useCallback(() => {
    setEmpezadoActo3(true);
    reproducirTono('select');
    hablar(LINEAS.inicioConstruccion);
  }, [hablar]);

  const hechos = lab.terminado ? TOTAL : lab.pasos;
  const todasClasificadas = PROBLEMAS_ACTO1.every((p) => clasifTipos[p.id]);
  const panelActivo = fase !== 'construye';

  return (
    <ArcadeSala
      titulo="Proyecto integrador: problema real, solución digital"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia · Proyecto integrador de N9 · el cierre de toda la secundaria</p>}
      alSalir={props.alSalir}
      final={
        lab.terminado
          ? {
              insigniaNombre: 'Graduado/a de desarrollo digital',
              insigniaEmoji: '🎓',
              titulo: '¡Proyecto integrador terminado!',
              detalle:
                'Clasificaste cinco problemas reales entre app, sitio web y análisis de datos, decidiste con ese mismo criterio el caso real del Refugio Patitas, y construiste su sitio de dos páginas con HTML y CSS reales: el nombre, el horario, el enlace entre páginas y la corrección de un aviso real — todo con los datos que te dio Doña Marisol. Ese criterio es con el que cierras los nueve niveles de Tecnia.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      {panelActivo ? (
        <VentanaBase marca="Tecnia · Proyecto integrador" subtitulo="problema real → solución digital">
          <div className="p-4 sm:p-6 flex flex-col gap-5">
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
              {NOMBRES_ACTO.map((nombre, i) => {
                const activa = ACTO_DE_FASE[fase] === i;
                const hecha = ACTO_DE_FASE[fase] > i;
                return (
                  <span
                    key={nombre}
                    className={`px-3 py-1.5 rounded-full ${
                      activa ? 'bg-sky-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {hecha ? '✓ ' : ''}
                    {nombre}
                  </span>
                );
              })}
            </div>

            <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-sky-500/30 rounded-2xl p-6">
              {/* Encargo 1 · clasificar cinco problemas reales */}
              {fase === 'clasificar-tipos' && (
                <>
                  <p className="text-sm text-slate-300">
                    Cinco negocios reales, cada uno con un problema distinto. Para cada uno, decide: ¿qué tipo de solución digital lo resuelve?
                  </p>
                  <ClasificacionOpciones
                    items={PROBLEMAS_ACTO1.map((p) => ({ id: p.id, etiqueta: p.texto }))}
                    opciones={OPCIONES_TIPO}
                    seleccion={clasifTipos}
                    bloqueado={bloqueado}
                    onElegir={(id, v) => setClasifTipos((prev) => ({ ...prev, [id]: v }))}
                    onComprobar={comprobarClasificacion}
                    puedeComprobar={todasClasificadas}
                  />
                </>
              )}

              {/* Encargo 2 · qué distingue a los tres tipos */}
              {fase === 'mcq-tipos' && (
                <McqBloque
                  pregunta="¿Qué distingue exactamente a los tres tipos de solución digital que acabas de usar?"
                  opciones={OPCIONES_DISTINGUE}
                  elegidoId={distingueId}
                  bloqueado={bloqueado}
                  onElegir={elegirDistingue}
                />
              )}

              {/* Encargo 3 · el caso de Refugio Patitas */}
              {fase === 'mcq-refugio' && (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed">{CASO_REFUGIO}</p>
                  <McqBloque
                    pregunta="¿Por qué el problema de Refugio Patitas se resuelve con un SITIO WEB y no con una app ni con un análisis de datos?"
                    opciones={OPCIONES_POR_QUE_SITIO}
                    elegidoId={porQueSitioId}
                    bloqueado={bloqueado}
                    onElegir={elegirPorQueSitio}
                  />
                </>
              )}

              {/* Encargo 4 · confirmar los datos reales, única fuente de verdad */}
              {fase === 'confirma-datos' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Éstos son los datos reales que te dio Doña Marisol. A partir de aquí, todo lo que escribas en el sitio tiene que salir de
                    esta tarjeta — nada inventado.
                  </p>
                  <dl className="flex flex-col gap-3 bg-slate-800 rounded-xl px-4 py-4">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Nombre del refugio</dt>
                      <dd className="text-white font-bold">{DATOS_REFUGIO.nombre}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Horario de visitas</dt>
                      <dd className="text-white font-bold">{DATOS_REFUGIO.horario}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Antes de adoptar</dt>
                      <dd className="text-slate-200">{DATOS_REFUGIO.adopcion1}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Sobre los animales</dt>
                      <dd className="text-slate-200">{DATOS_REFUGIO.adopcion2}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    data-testid="confirmar-datos-refugio"
                    onClick={confirmarDatos}
                    className="px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
                  >
                    Entendido, vamos a construirlo →
                  </button>
                </div>
              )}

              {/* Encargo 9 · reflexión de cierre */}
              {fase === 'mcq-cierre' && (
                <McqBloque
                  pregunta="Ya construiste el sitio de Refugio Patitas de principio a fin. ¿Por qué ESTE problema —el de Doña Marisol— era un sitio web y no una app ni un análisis de datos?"
                  opciones={OPCIONES_CIERRE}
                  elegidoId={cierreId}
                  bloqueado={bloqueado}
                  onElegir={elegirCierre}
                />
              )}

              <MensajeYAvance mensaje={mensaje} esUltimo={fase === 'mcq-cierre'} onSiguiente={avanzarPanel} onTerminar={terminarLab} />
            </div>
          </div>
        </VentanaBase>
      ) : (
        <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N9" subtitulo="refugio-patitas · el sitio de verdad">
          <EstudioWeb estudio={estudioWeb} proyecto="refugio-patitas" inspector={true} herramientas={herramientasWeb} onEvento={alEventoWeb} />
        </VentanaBase>
      )}

      {!empezado && <PortadaWeb portada={PORTADA_GENERAL} onEmpezar={empezar} />}
      {empezado && fase === 'construye' && !empezadoActo3 && <PortadaWeb portada={PORTADA_ACTO3} onEmpezar={empezarActo3} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${hechos}`} />}
    </ArcadeSala>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 5 · Widgets locales
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Mensaje de acierto/error + botón «Siguiente»/«Recibir la insignia» — mismo
 *  patrón que `LabIaYTrabajo.tsx` y las paradas de decisión pura de N9. */
function MensajeYAvance({
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  if (!mensaje) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? '¡Correcto!' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'terminar' : 'siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

/** Lista de N ítems, cada uno con sus opciones de clasificación — mismo
 *  patrón que `ClasificacionDosOpciones` de `LabIaYTrabajo.tsx`, generalizado
 *  a más de dos valores porque el Acto 1 clasifica entre TRES tipos de
 *  solución (app / sitio / datos), no dos. */
function ClasificacionOpciones({
  items,
  opciones,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  items: { id: string; etiqueta: string }[];
  opciones: readonly { valor: string; etiqueta: string }[];
  seleccion: Record<string, string | undefined>;
  bloqueado: boolean;
  onElegir: (id: string, valor: string) => void;
  onComprobar: () => void;
  puedeComprobar: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="lista-clasificacion">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm text-white">{it.etiqueta}</span>
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid="clasificacion-opcion"
                  disabled={bloqueado}
                  onClick={() => onElegir(it.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    seleccion[it.id] === op.valor ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-clasificacion"
          disabled={!puedeComprobar}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-sky-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las cuatro reflexiones. */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg text-white font-semibold leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LabProyectoIntegrador;
