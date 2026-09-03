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
import { archivosInicialesCapstone, DATOS_CLIENTE, GUION_CAPSTONE, PLANTILLAS_CAPSTONE } from './guionCapstone';

/**
 * `n10-capstone` — el CAPSTONE DE TODA LA PLATAFORMA (`n10-capstone-y-
 * portafolio`, `integradora: true`). **Bachillerato, 15–18 años.** Es la
 * ÚLTIMA actividad que cierra los DIEZ niveles completos de Tecnia, de N1 a
 * N10 — no sólo Bachillerato, como sí hacía `n9-proyecto-integrador` con
 * secundaria.
 *
 * ── Por qué reusa, a propósito, la arquitectura de `n9-proyecto-integrador` ──
 *
 * Mismo problema de fondo (nueve encargos en cuatro actos, y los actos no
 * comparten un solo tipo de pantalla: paneles de decisión puros para los
 * Actos 1-2 y 4, el motor `EstudioWeb` para el Acto 3) tiene la misma
 * solución ya probada en producción: `ArcadeSala` envuelve el laboratorio
 * entero, y lo que cambia por dentro —panel o `EstudioWeb`— es sólo el
 * `children` de turno, exactamente como documenta
 * `n9/integrador/LabProyectoIntegrador.tsx`. Un capstone final no es el
 * lugar para estrenar una arquitectura sin probar; si mañana aparece un
 * defecto en este patrón de dos armazones, ya se sabe exactamente dónde
 * mirar porque es el mismo código que ya corrió con alumnos reales.
 *
 * `useEstudioWeb` se llama SIEMPRE (regla de los hooks), aunque su editor no
 * se pinte hasta el Acto 3 — mismo motivo que en N9.
 *
 * ── Diferencia real con `n9-proyecto-integrador`, no sólo de tema ───────────
 *
 * El caso de hoy (Estudio Cronos, un fotógrafo profesional independiente) es
 * nuevo, con cinco casos de clasificación del Acto 1 también nuevos —ninguno
 * repetido de N9 ni de las unidades hermanas de N10—, y el cierre del Acto 4
 * conecta explícitamente con TODO el recorrido de diez niveles, y por nombre
 * con las dos paradas que ya construyó el alumno en esta misma unidad
 * (`n10-portafolio-y-cv`, `n10-carreras-y-certificaciones`), no sólo con el
 * Acto 1 de esta clase — el mismo patrón de cierre-que-integra-sin-repetir
 * que ya usó `n10-carreras-y-certificaciones` con las paradas de SQL y CV.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · Acto 1 «Qué tipo de solución digital resuelve cada problema» — 1–2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cinco negocios reales nuevos, con registro profesional (N10 = Bachillerato,
 * «Perfil profesional»), ninguno reutilizado del Acto 2 (Estudio Cronos) ni
 * de N9 (`tienda-stock`, `gimnasio-reservas`, `veterinaria-info`,
 * `liga-desempeno`, `taller-info`).
 */

interface ItemClasificable {
  id: string;
  texto: string;
  correcta: string;
}

const PROBLEMAS_ACTO1: ItemClasificable[] = [
  {
    id: 'contable-gastos',
    texto:
      'El despacho contable Peña & Asociados quiere comparar los gastos mensuales de sus tres áreas —nómina, insumos, servicios— de los últimos dos años, para decidir en dónde recortar el próximo trimestre.',
    correcta: 'datos',
  },
  {
    id: 'dental-historial',
    texto:
      'La clínica dental Sonrisa Plena quiere que cada paciente vea su propio historial de tratamientos y agende su próxima cita desde su cuenta personal, semana tras semana.',
    correcta: 'app',
  },
  {
    id: 'arquitectos-portafolio',
    texto:
      'El despacho de arquitectos Bloque Vertical quiere que cualquiera que los busque en línea encuentre su portafolio de proyectos, su ubicación y sus datos de contacto, sin necesitar ninguna cuenta.',
    correcta: 'sitio',
  },
  {
    id: 'cafeteria-sucursal',
    texto:
      'La franquicia de cafeterías Grano Norte quiere decidir en qué zona conviene abrir su próxima sucursal, comparando ventas, tráfico peatonal y renta de cada zona candidata.',
    correcta: 'datos',
  },
  {
    id: 'tatuajes-catalogo',
    texto:
      'El estudio de tatuajes Tinta Franca quiere que la gente vea su catálogo de diseños, su dirección y su horario, sin necesitar crear ninguna cuenta.',
    correcta: 'sitio',
  },
];

const OPCIONES_TIPO: { valor: string; etiqueta: string }[] = [
  { valor: 'app', etiqueta: '📱 Necesita una app' },
  { valor: 'sitio', etiqueta: '🌐 Necesita un sitio web' },
  { valor: 'datos', etiqueta: '📊 Necesita un análisis de datos' },
];

const MENSAJE_ACIERTO_CLASIFICACION =
  'Coinciden los cinco: Peña & Asociados y Grano Norte necesitan comparar números para decidir algo —eso es análisis de datos—. Sonrisa Plena necesita que el MISMO paciente vuelva una y otra vez a su propia cuenta —eso es una app—. Y el despacho de arquitectos y el estudio de tatuajes sólo necesitan que cualquiera encuentre su información fija, sin cuenta de nadie —eso es un sitio web. El mismo criterio con el que decidiste desde tu primer proyecto integrador.';

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
    explicacion: 'Exacto. Ninguno de los tres es «mejor» que los otros — cada uno resuelve un problema distinto, y el problema es el que decide cuál construir.',
  },
  {
    id: 'b',
    texto: 'Depende de qué tan grande sea el negocio: los negocios grandes necesitan una app y los pequeños un sitio web.',
    correcta: false,
    explicacion:
      'No: el tamaño del negocio no decide nada. Bloque Vertical puede ser un despacho grande y de todos modos sólo necesita un sitio, mientras que un negocio chico podría necesitar análisis de datos si su problema es decidir algo comparando números.',
  },
  {
    id: 'c',
    texto: 'Depende de si el dueño del negocio sabe programar o no.',
    correcta: false,
    explicacion: 'No: lo que sabe hacer el dueño no cambia qué tipo de solución resuelve su problema. Eso lo decide el problema mismo, no quién lo va a construir.',
  },
  {
    id: 'd',
    texto: 'Depende de cuánto presupuesto tenga el cliente: los proyectos caros son apps y los baratos son sitios web.',
    correcta: false,
    explicacion: 'No: el presupuesto no es el criterio. Lo que importa es qué necesita resolver el problema, no cuánto esté dispuesto a pagar el cliente.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · Acto 2 «El problema de hoy: Estudio Cronos» — 3–4
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CASO_CRONOS =
  'Estudio Cronos es el negocio independiente de Mateo Cronos, fotógrafo profesional. Quiere que cualquiera que lo busque en línea vea su trabajo, conozca sus tarifas y sepa cómo contactarlo — no necesita que nadie inicie sesión, ni tiene ningún número que comparar para decidir algo: sólo necesita que su información llegue a quien la busca.';

const OPCIONES_POR_QUE_SITIO: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque es información fija —su trabajo, sus tarifas, su contacto— que cualquiera puede consultar sin crear una cuenta, y no hay ningún número que comparar para decidir algo.',
    correcta: true,
    explicacion:
      'Exacto. No hay una persona que vuelva todos los días a revisar su propio progreso (eso sería app), y no hay que comparar cifras para tomar una decisión (eso sería datos). Sólo hace falta que la información llegue a quien la busca.',
  },
  {
    id: 'b',
    texto: 'Porque un fotógrafo independiente nunca podría pagar una app.',
    correcta: false,
    explicacion: 'El dinero no es el criterio: la razón de que sea un sitio es lo que el problema necesita, no lo que cuesta construirlo.',
  },
  {
    id: 'c',
    texto: 'Porque los sitios web son más fáciles de hacer que las apps, y Mateo trabaja solo.',
    correcta: false,
    explicacion: 'Que trabaje solo tampoco es el criterio — repásalo con el criterio del Acto 1: ¿hay una cuenta de usuario que vuelve, o es información fija?',
  },
  {
    id: 'd',
    texto: 'Porque Estudio Cronos todavía no tiene ningún dato que analizar.',
    correcta: false,
    explicacion:
      'Se acerca, pero no es la razón completa: aunque tuviera muchos datos guardados, ninguna decisión de HOY depende de compararlos — el problema de hoy es que la gente encuentre su información.',
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
      'Porque necesitaba información fija —su trabajo real, su precio real, su contacto real— que cualquier persona pudiera consultar sin cuenta, y ninguna decisión dependía de comparar números.',
    correcta: true,
    explicacion:
      'Exacto. Es el mismo criterio de todo tu recorrido en Tecnia: sin cuenta de usuario que regresa y sin números que comparar, la solución correcta es un sitio — y por eso construiste index.html y servicios.html, no una app con inicio de sesión ni un panel de cifras.',
  },
  {
    id: 'b',
    texto: 'Porque HTML y CSS son más fáciles que hacer una app.',
    correcta: false,
    explicacion: 'La dificultad no es el criterio — es lo que el problema necesita. Un sitio no es «la opción fácil»: es la solución correcta para ESTE problema en concreto.',
  },
  {
    id: 'c',
    texto: 'Porque los fotógrafos siempre necesitan sitios web, nunca apps.',
    correcta: false,
    explicacion:
      'No hay una regla fija por tipo de negocio: un estudio más grande, con varios fotógrafos y clientes que agendan y pagan por su cuenta, sí podría necesitar una app. Aquí, el problema concreto de Mateo es el que decide.',
  },
  {
    id: 'd',
    texto: 'Porque todavía no habías aprendido a hacer un análisis de datos.',
    correcta: false,
    explicacion:
      'No: el motivo no es lo que sabes hacer tú —ya lo demostraste en «Bases de datos y SQL» y en «IA y ciencia de datos». Es lo que el problema de Estudio Cronos necesita, y ya viste, con el criterio del Acto 1, que eso es información fija sin cuenta ni números que comparar.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · El laboratorio
 * ═══════════════════════════════════════════════════════════════════════════
 */

const TOTAL = 9;
const NOMBRES_ACTO = ['Qué solución encaja', 'El problema de hoy', 'Constrúyelo de verdad', 'Cierre'] as const;

type Fase = 'clasificar-tipos' | 'mcq-tipos' | 'mcq-cronos' | 'confirma-datos' | 'construye' | 'mcq-cierre';

const ACTO_DE_FASE: Record<Fase, number> = {
  'clasificar-tipos': 0,
  'mcq-tipos': 0,
  'mcq-cronos': 1,
  'confirma-datos': 1,
  construye: 2,
  'mcq-cierre': 3,
};

const PORTADA_GENERAL: DatosPortadaWeb = {
  situacion: 'Tu proyecto capstone · el cierre de los diez niveles de Tecnia',
  tema: 'Problema real → solución digital: app, sitio o análisis de datos',
  objetivo:
    'Vas a decidir, con cinco casos profesionales reales, qué tipo de solución digital resuelve cada problema; vas a aplicar ese mismo criterio al caso real de un fotógrafo independiente; y vas a construir su sitio de verdad, con HTML y CSS reales y los datos que te dio el cliente.',
  vasAHacer: [
    'Clasificar cinco problemas profesionales reales entre app, sitio web y análisis de datos.',
    'Decidir qué distingue exactamente a los tres tipos de solución.',
    'Conocer el caso real de Estudio Cronos y justificar por qué es un sitio web.',
    'Confirmar los datos reales que vas a usar — nada inventado.',
    'Escribir el nombre real del estudio en tu sitio.',
    'Escribir el precio real de la sesión.',
    'Enlazar tu portada con la página de servicios.',
    'Corregir un aviso real que ya trae el sitio.',
    'Cerrar conectando este criterio con todo tu recorrido en Tecnia, del nivel 1 al nivel 10.',
  ],
  encargos: TOTAL,
  minutos: 45,
  insignia: { nombre: 'Graduado/a de Tecnia', emoji: '🎓' },
  boton: 'Empezar tu proyecto capstone',
  acento: '#a78bfa',
};

const PORTADA_ACTO3: DatosPortadaWeb = {
  situacion: 'Acto 3 de 4 · con los datos reales de Mateo Cronos',
  tema: 'Construye el sitio de Estudio Cronos: HTML y CSS reales',
  objetivo:
    'Vas a construir dos páginas reales —index.html y servicios.html— con el nombre real del estudio, su precio real, un enlace que conecte las dos páginas, y vas a corregir un aviso real que ya trae el sitio.',
  vasAHacer: [
    'Escribir el nombre real del estudio en el encabezado.',
    'Escribir el precio real de la sesión.',
    'Enlazar tu portada con la de servicios.',
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
    'Bienvenido a tu proyecto capstone: el cierre de los diez niveles completos de Tecnia. Antes de construir nada, vas a decidir qué tipo de solución digital resuelve cada problema — porque construir bien algo que no hacía falta no sirve de nada, ni en la escuela ni en un trabajo real.',
  tomaLosDatos: 'Éstos son los datos reales del estudio. A partir de aquí, todo lo que escribas tiene que salir de esta tarjeta.',
  inicioConstruccion: 'Ahora sí: vas a construir el sitio de Estudio Cronos de verdad, con HTML y CSS reales.',
  finConstruccion: 'Sitio terminado: el nombre real, el precio real, el enlace entre tus dos páginas y un aviso real corregido. Falta una última pregunta.',
  fin: 'Proyecto capstone terminado. Decidiste con criterio qué tipo de solución construir, y la construiste de verdad. Ese es el cierre de tu formación completa en Tecnia, del nivel 1 al nivel 10.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCapstone(props: PropsLab) {
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
      if (f === 'mcq-tipos') return 'mcq-cronos';
      if (f === 'mcq-cronos') return 'confirma-datos';
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
        'Todavía no coinciden los cinco. Pregúntate de cada negocio: ¿la respuesta sale de comparar números, necesita que la MISMA persona regrese con su cuenta, o sólo necesita enseñar información fija que cualquiera consulta?',
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
      const hechosWeb = Math.round(avance * GUION_CAPSTONE.pasos.length);
      lab.avanzar();
      reproducirTono('correct');
      setAviso('✔ ¡Encargo cumplido!');
      const paso = GUION_CAPSTONE.pasos[hechosWeb - 1];
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
    archivos: archivosInicialesCapstone(),
    guion: GUION_CAPSTONE,
    onAvance: alAvanceWeb,
    onTerminado: alTerminadoWeb,
  });

  /* El clic en el enlace propio de "index.html" navega de verdad hacia
   * "servicios.html": la misma prueba de que el enlace del encargo 3 sirve
   * para algo, y el mismo mecanismo de `n7-tu-sitio-personal`/
   * `n9-proyecto-integrador`. */
  const alEventoWeb = (evento: EventoPagina) => {
    if (evento.tipo === 'enlace' && evento.interno && estudioWeb.paginas.includes(evento.destino)) {
      estudioWeb.verPagina(evento.destino);
    }
  };

  const herramientasWeb: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-capstone',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: estudioWeb.terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_CAPSTONE[estudioWeb.activo.nombre];
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
      titulo="Proyecto capstone: problema real, solución digital"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia · Proyecto capstone final · el cierre de toda la plataforma</p>}
      alSalir={props.alSalir}
      final={
        lab.terminado
          ? {
              insigniaNombre: 'Graduado/a de Tecnia',
              insigniaEmoji: '🎓',
              titulo: '¡Proyecto capstone terminado!',
              detalle: `Clasificaste cinco problemas profesionales reales entre app, sitio web y análisis de datos, decidiste con ese mismo criterio el caso real de ${DATOS_CLIENTE.fotografo}, y construiste su sitio de dos páginas con HTML y CSS reales: el nombre, el precio, el enlace entre páginas y la corrección de un aviso real — todo con los datos que te dio el cliente. Ese criterio es con el que cierras los diez niveles completos de Tecnia.`,
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
        <VentanaBase marca="Tecnia · Proyecto capstone" subtitulo="problema real → solución digital">
          <div className="p-4 sm:p-6 flex flex-col gap-5">
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
              {NOMBRES_ACTO.map((nombre, i) => {
                const activa = ACTO_DE_FASE[fase] === i;
                const hecha = ACTO_DE_FASE[fase] > i;
                return (
                  <span
                    key={nombre}
                    className={`px-3 py-1.5 rounded-full ${
                      activa ? 'bg-violet-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {hecha ? '✓ ' : ''}
                    {nombre}
                  </span>
                );
              })}
            </div>

            <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
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

              {/* Encargo 3 · el caso de Estudio Cronos */}
              {fase === 'mcq-cronos' && (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed">{CASO_CRONOS}</p>
                  <McqBloque
                    pregunta="¿Por qué el problema de Estudio Cronos se resuelve con un SITIO WEB y no con una app ni con un análisis de datos?"
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
                    Éstos son los datos reales que te dio Mateo Cronos. A partir de aquí, todo lo que escribas en el sitio tiene que salir
                    de esta tarjeta — nada inventado.
                  </p>
                  <dl className="flex flex-col gap-3 bg-slate-800 rounded-xl px-4 py-4">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Nombre del estudio</dt>
                      <dd className="text-white font-bold">{DATOS_CLIENTE.nombre}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Servicio</dt>
                      <dd className="text-slate-200">{DATOS_CLIENTE.servicio}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Precio real</dt>
                      <dd className="text-white font-bold">{DATOS_CLIENTE.precioTexto}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">Contacto</dt>
                      <dd className="text-slate-200">{DATOS_CLIENTE.contacto}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    data-testid="confirmar-datos-cronos"
                    onClick={confirmarDatos}
                    className="px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
                  >
                    Entendido, vamos a construirlo →
                  </button>
                </div>
              )}

              {/* Encargo 9 · reflexión de cierre, conecta TODA la plataforma */}
              {fase === 'mcq-cierre' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ya construiste el sitio de Estudio Cronos de principio a fin. Con el mismo criterio documentaste tu currículum en{' '}
                    <b>«Portafolio digital y currículum»</b> y decidiste tu camino profesional en{' '}
                    <b>«Carreras y certificaciones»</b> — este proyecto es la pieza que demuestra, con trabajo real, todo lo que
                    aprendiste desde tu primer nivel en Tecnia.
                  </p>
                  <McqBloque
                    pregunta="Ya construiste el sitio de Estudio Cronos de principio a fin. ¿Por qué ESTE problema —el de Mateo Cronos— era un sitio web y no una app ni un análisis de datos?"
                    opciones={OPCIONES_CIERRE}
                    elegidoId={cierreId}
                    bloqueado={bloqueado}
                    onElegir={elegirCierre}
                  />
                </div>
              )}

              <MensajeYAvance mensaje={mensaje} esUltimo={fase === 'mcq-cierre'} onSiguiente={avanzarPanel} onTerminar={terminarLab} />
            </div>
          </div>
        </VentanaBase>
      ) : (
        <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N10" subtitulo="estudio-cronos · el sitio de verdad">
          <EstudioWeb estudio={estudioWeb} proyecto="estudio-cronos" inspector={true} herramientas={herramientasWeb} onEvento={alEventoWeb} />
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
 *  patrón que `n9-proyecto-integrador`/`LabIaYTrabajo.tsx`. */
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

/** Lista de N ítems, cada uno con sus opciones de clasificación. */
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
                    seleccion[it.id] === op.valor ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
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
          className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
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

export default LabCapstone;
