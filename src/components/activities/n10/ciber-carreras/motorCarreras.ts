/**
 * N10 · «Ciberseguridad profesional» — «Carreras en ciberseguridad»
 * (parada 3 de 3, CIERRE de la unidad, `RUTA_N10_CIBERSEGURIDAD`).
 * **N10 = Bachillerato, 15–18 años**, tono «Perfil profesional».
 *
 * ── El predicado real: `mejorRolPara()` ─────────────────────────────────────
 *
 * Mismo patrón que `mejorEmpleoPara` en `n9-empleos-tecnologicos` (documento
 * §46, regla anti-épsilon): nunca hay una tabla oculta «este candidato → este
 * rol». Cada rol declara sus DOS rasgos clave de un vocabulario compartido de
 * seis, cada candidato declara sus rasgos reales, y `mejorRolPara` calcula
 * qué rol comparte más rasgos con ese candidato. Si mañana se agrega un
 * sexto rol o un candidato nuevo, el mismo cálculo sigue sirviendo sin tocar
 * el veredicto de nadie más.
 *
 * ── El mito que este cierre desmiente, también sin tabla aparte ────────────
 *
 * `requiereProgramarComoTareaCentral` vive en cada rol, junto a sus rasgos:
 * de los cinco roles reales, sólo Pentester y Especialista en respuesta a
 * incidentes lo tienen en `true`. Analista SOC, Arquitecto/a de seguridad y
 * Oficial de cumplimiento lo tienen en `false` — «todos programan todo el
 * día» es falso para tres de los cinco roles reales de la profesión.
 *
 * ── Qué NO repite de las dos paradas anteriores ─────────────────────────────
 *
 * `n10-amenazas-y-defensa` (parada 1) ya enseñó a leer tráfico de red, aislar
 * una IP en el firewall y validar una firma digital. `n10-identidad-y-cifrado`
 * (parada 2) ya enseñó a construir una contraseña, evaluar un segundo factor
 * y detectar un correo de phishing. Aquí no se repite ninguna de esas dos
 * mecánicas: los dos encargos de integración (`OPCIONES_REFLEXION_SOC` y
 * `OPCIONES_REFLEXION_IDENTIDAD`) sólo preguntan qué ROL usa cada habilidad ya
 * aprendida como su tarea diaria — la aplican, no la vuelven a enseñar.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · El vocabulario de rasgos y los cinco roles reales — el predicado real
// ═══════════════════════════════════════════════════════════════════════════

export type RasgoCiber =
  | 'detecta-anomalias'
  | 'piensa-como-atacante'
  | 'disena-arquitectura'
  | 'traduce-normativa'
  | 'reconstruye-hechos'
  | 'programa-herramientas';

export interface RolCiber {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Los dos rasgos que de verdad definen este rol — nunca una lista arbitraria. */
  rasgosClave: [RasgoCiber, RasgoCiber];
  requiereProgramarComoTareaCentral: boolean;
}

export const ROL_SOC: RolCiber = {
  id: 'analista-soc',
  nombre: 'Analista de Centro de Operaciones de Seguridad (SOC)',
  emoji: '📡',
  descripcion:
    'Vigila en tiempo real el tráfico y las alertas de una organización con herramientas ya construidas, y decide —minuto a minuto— cuáles son ataques reales y cuáles son ruido.',
  rasgosClave: ['detecta-anomalias', 'reconstruye-hechos'],
  requiereProgramarComoTareaCentral: false,
};

export const ROL_PENTESTER: RolCiber = {
  id: 'pentester',
  nombre: 'Pentester / Hacker ético',
  emoji: '🗝️',
  descripcion:
    'Ataca, con permiso, los propios sistemas de una organización para encontrar la grieta antes que un adversario real; suele escribir sus propios scripts para automatizar cada prueba.',
  rasgosClave: ['piensa-como-atacante', 'programa-herramientas'],
  requiereProgramarComoTareaCentral: true,
};

export const ROL_ARQUITECTO: RolCiber = {
  id: 'arquitecto-seguridad',
  nombre: 'Arquitecto/a de seguridad',
  emoji: '🏛️',
  descripcion:
    'Diseña, desde cero, la estructura de defensa completa de una organización: qué se cifra, qué se separa en capas y qué controles exige cada sistema nuevo antes de construirse.',
  rasgosClave: ['disena-arquitectura', 'traduce-normativa'],
  requiereProgramarComoTareaCentral: false,
};

export const ROL_GRC: RolCiber = {
  id: 'oficial-cumplimiento',
  nombre: 'Oficial de cumplimiento (Gobierno, Riesgo y Cumplimiento)',
  emoji: '⚖️',
  descripcion:
    'Traduce leyes y estándares de seguridad —como los que exigen proteger los datos personales de los clientes— en políticas concretas que toda la organización debe firmar y seguir.',
  rasgosClave: ['traduce-normativa', 'reconstruye-hechos'],
  requiereProgramarComoTareaCentral: false,
};

export const ROL_FORENSE: RolCiber = {
  id: 'respuesta-incidentes',
  nombre: 'Especialista en respuesta a incidentes (forense digital)',
  emoji: '🔎',
  descripcion:
    'Entra en acción después de un ataque para reconstruir con evidencia exactamente qué pasó, muchas veces escribiendo pequeños scripts para peinar miles de líneas de registro en minutos.',
  rasgosClave: ['reconstruye-hechos', 'programa-herramientas'],
  requiereProgramarComoTareaCentral: true,
};

export const ROLES_CIBER: RolCiber[] = [ROL_SOC, ROL_PENTESTER, ROL_ARQUITECTO, ROL_GRC, ROL_FORENSE];

/** Cuenta cuántos rasgos comparte un candidato con cada rol y devuelve el que
 *  más comparte — el predicado real, nunca un id copiado a mano. */
export function mejorRolPara(rasgosPersona: RasgoCiber[]): RolCiber {
  let mejor = ROLES_CIBER[0];
  let mejorPuntaje = -1;
  for (const rol of ROLES_CIBER) {
    const puntaje = rol.rasgosClave.filter((r) => rasgosPersona.includes(r)).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = rol;
    }
  }
  return mejor;
}

export const MENSAJE_ACIERTO_MITOS =
  'Coinciden los cinco: sólo Pentester y Especialista en respuesta a incidentes tienen programar como tarea central —escriben sus propios scripts para atacar o para investigar—. Analista SOC vigila con herramientas ya construidas, Arquitecto/a de seguridad diseña y documenta, y Oficial de cumplimiento traduce normas en políticas. La ciberseguridad profesional es mucho más que escribir código todo el día.';

export const MENSAJE_ERROR_MITOS =
  'Todavía no coinciden los cinco. Revisa la descripción de cada rol: ¿su tarea del día a día es escribir código, o es otra cosa —vigilar, diseñar, traducir normas?';

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Los tres candidatos — el mismo predicado, tres historias distintas
// ═══════════════════════════════════════════════════════════════════════════

export interface CandidatoCiber {
  id: string;
  nombre: string;
  historia: string;
  rasgos: RasgoCiber[];
}

export const CANDIDATO_ISMAEL: CandidatoCiber = {
  id: 'ismael',
  nombre: 'Ismael',
  historia:
    'A Ismael le fascina imaginar cómo alguien rompería una app antes de que esa persona lo intente de verdad. En su tiempo libre programa pequeños scripts para probar esas ideas contra sus propios proyectos, sólo para ver si de verdad aguantan.',
  rasgos: ['piensa-como-atacante', 'programa-herramientas'],
};

export const CANDIDATO_CONSTANZA: CandidatoCiber = {
  id: 'constanza',
  nombre: 'Constanza',
  historia:
    'A Constanza le gusta empezar de cero: cuando su escuela armó un club de robótica, ella fue quien propuso cómo debían organizarse los cables, los permisos y las reglas antes de que nadie tocara una sola pieza —y se leyó el reglamento de la competencia completo para que nada quedara fuera de norma.',
  rasgos: ['disena-arquitectura', 'traduce-normativa'],
};

export const CANDIDATO_TADEO: CandidatoCiber = {
  id: 'tadeo',
  nombre: 'Tadeo',
  historia:
    'Tadeo hizo una semana de estancia en Orbitatek antes de decidir qué estudiar. Un día vio al equipo del SOC rastrear un ataque DDoS hasta su origen y bloquearlo en el firewall. Otro día, cuando un correo de phishing casi comprometió la cuenta de una pasante, vio al equipo reconstruir paso a paso qué había tocado el atacante antes de que lo detuvieran. Lo que más le fascinó, en ambos casos, no fue bloquear el ataque en el momento: fue armar, después, la historia completa de lo que había pasado —y en una ocasión, escribir un pequeño script propio para revisar miles de líneas de registro en minutos.',
  rasgos: ['reconstruye-hechos', 'programa-herramientas'],
};

export const MENSAJE_ERROR_PERFIL =
  'Todavía no. Relee la historia: ¿qué es lo que de verdad se le da bien, más allá de qué tan familiar te suene el nombre del rol?';

export const MENSAJE_ACIERTO_ISMAEL =
  'Coincide: a Ismael le fascina encontrar cómo romper algo antes que nadie más, y programa para probar esas ideas. Exactamente el trabajo de un/a Pentester: atacar con permiso los propios sistemas de una organización para encontrar la grieta primero.';

export const MENSAJE_ACIERTO_CONSTANZA =
  'Coincide: a Constanza le gusta diseñar la estructura completa antes de que nadie toque una pieza, y no deja nada fuera del reglamento. Exactamente el trabajo de un/a Arquitecto/a de seguridad: diseñar la defensa completa de una organización cumpliendo cada norma que aplica.';

export const MENSAJE_ACIERTO_TADEO =
  'Coincide: a Tadeo no lo mueve bloquear el ataque en el momento, sino reconstruir con evidencia exactamente qué pasó después —igual con un ataque de red que con un correo de phishing— y no le incomoda escribir un script para lograrlo. Ese es el corazón de la respuesta a incidentes: unir la vigilancia técnica que dominaste en la parada 1 con la protección de identidad que dominaste en la parada 2, después de que algo ya ocurrió.';

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Habilidades técnicas y transferibles — un vocabulario propio de ciber
// ═══════════════════════════════════════════════════════════════════════════

export interface TareaCiber {
  id: string;
  texto: string;
  esTecnicaEspecifica: boolean;
}

export const TAREAS_CIBER: TareaCiber[] = [
  { id: 'siem', texto: 'Configurar las reglas de un SIEM para separar alertas reales del ruido', esTecnicaEspecifica: true },
  {
    id: 'explica-junta',
    texto: 'Explicar en una junta directiva, sin tecnicismos, por qué un ataque reciente representa un riesgo real para el negocio',
    esTecnicaEspecifica: false,
  },
  { id: 'script-python', texto: 'Escribir un script en Python que automatice la búsqueda de una vulnerabilidad conocida', esTecnicaEspecifica: true },
  {
    id: 'coordina-equipos',
    texto: 'Coordinar al equipo legal, al de sistemas y al de comunicación durante la respuesta a un incidente',
    esTecnicaEspecifica: false,
  },
  {
    id: 'interpreta-norma',
    texto: 'Interpretar un estándar internacional de seguridad y traducirlo en controles concretos para la empresa',
    esTecnicaEspecifica: true,
  },
  {
    id: 'reporte-claro',
    texto: 'Escribir el reporte de un incidente que cualquier persona del equipo directivo entienda sin ser experta',
    esTecnicaEspecifica: false,
  },
];

export const MENSAJE_ACIERTO_TAREAS =
  'Las seis coinciden: configurar un SIEM, escribir un script en Python e interpretar un estándar de seguridad piden conocimiento específico del oficio. Explicar un riesgo en una junta directiva, coordinar tres equipos distintos y escribir un reporte claro son habilidades transferibles: sirven en cualquier profesión, y en ciberseguridad pesan tanto como las técnicas.';

export const MENSAJE_ERROR_TAREAS =
  'Todavía no coinciden las seis. Pregúntate de cada una: ¿esto se aprende sólo para ESTE oficio, o sirve en cualquier trabajo donde haya que decidir y comunicar?';

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Opción múltiple — vignette de Lucía + las dos reflexiones de integración
//     + la reflexión final de cierre
// ═══════════════════════════════════════════════════════════════════════════

export interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

export const HISTORIA_LUCIA =
  'Lucía nunca ha escrito una línea de código. Lleva tres años como oficial de cumplimiento en una empresa financiera: lee cada nueva ley de protección de datos que aprueba el gobierno, y se asegura de que todos los sistemas que programan otros la cumplan antes de lanzarse. El año pasado detuvo el lanzamiento de una app nueva porque guardaba los datos de los clientes sin cifrar, algo que ningún desarrollador había marcado como prioridad.';

export const OPCIONES_LUCIA: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque una vulnerabilidad no siempre es un error de código: guardar datos sin cifrar es un riesgo real que alguien tiene que detectar y detener, tenga o no relación con programar',
    correcta: true,
    explicacion:
      'Exacto. Lucía detuvo un riesgo real que ningún desarrollador había marcado como prioridad. Su criterio —no su código— evitó una filtración antes de que existiera.',
  },
  {
    id: 'b',
    texto: 'Porque en realidad ella también programa, sólo que no lo cuenta',
    correcta: false,
    explicacion: 'No hay ningún dato en su historia que diga eso — es inventar información que no está.',
  },
  {
    id: 'c',
    texto: 'Porque cumplir la ley no tiene relación con proteger los datos de nadie',
    correcta: false,
    explicacion: 'Es lo contrario: la ley que Lucía aplicó existe precisamente para proteger los datos de los clientes.',
  },
  {
    id: 'd',
    texto: 'Porque las empresas financieras no necesitan a nadie que programe',
    correcta: false,
    explicacion: 'Sí necesitan: alguien programó la app que Lucía detuvo. Lo que cambia es que su propio rol no es ese.',
  },
];

export const OPCIONES_REFLEXION_SOC: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Analista SOC',
    correcta: true,
    explicacion:
      'Exacto: detectar patrones anómalos en el tráfico en tiempo real —lo que acabas de ver en la consola SOC de la parada 1— es la tarea central de un/a analista SOC, día tras día, no un caso aislado.',
  },
  {
    id: 'b',
    texto: 'Oficial de cumplimiento',
    correcta: false,
    explicacion: 'El oficial de cumplimiento traduce normas en políticas; no es quien vigila el tráfico de red minuto a minuto.',
  },
  {
    id: 'c',
    texto: 'Arquitecto/a de seguridad',
    correcta: false,
    explicacion: 'El/la arquitecto/a diseña la estructura de defensa antes de que exista un ataque; no es quien vigila el tráfico en vivo.',
  },
  {
    id: 'd',
    texto: 'Pentester',
    correcta: false,
    explicacion: 'El/la pentester ataca sistemas propios para encontrar huecos; no es quien vigila alertas de tráfico en tiempo real.',
  },
];

export const OPCIONES_REFLEXION_IDENTIDAD: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Especialista en respuesta a incidentes (forense digital)',
    correcta: true,
    explicacion:
      'Exacto: reconstruir con evidencia real qué hizo un atacante después de robar una identidad —lo que viste con Regina en la parada 2— es el trabajo central de quien responde a incidentes, muchas veces escribiendo scripts propios para revisar miles de líneas de registro.',
  },
  {
    id: 'b',
    texto: 'Pentester',
    correcta: false,
    explicacion: 'El/la pentester ataca ANTES de que ocurra un incidente real, para encontrar la grieta primero; no es quien investiga DESPUÉS.',
  },
  {
    id: 'c',
    texto: 'Arquitecto/a de seguridad',
    correcta: false,
    explicacion: 'El/la arquitecto/a diseña la defensa desde cero; investigar un incidente ya ocurrido no es su tarea central.',
  },
  {
    id: 'd',
    texto: 'Oficial de cumplimiento',
    correcta: false,
    explicacion: 'El oficial de cumplimiento reporta el incidente ante la ley, pero no es quien reconstruye técnicamente qué hizo el atacante paso a paso.',
  },
];

export const OPCIONES_REFLEXION_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Lo que de verdad se te da bien —¿vigilar en tiempo real, atacar para encontrar huecos, diseñar desde cero, traducir normas, o reconstruir lo que pasó?— cruzado con qué tan dispuesto estás a programar como tarea central, porque unos roles lo piden a diario y otros casi nunca',
    correcta: true,
    explicacion:
      'Exacto. Ismael, Constanza y Tadeo terminaron en tres roles distintos porque cada uno cruzó sus propios rasgos reales con lo que ese rol de verdad exige — el mismo criterio que te toca aplicar a ti.',
  },
  {
    id: 'b',
    texto: 'Cuál de los cinco roles paga mejor, sin importar nada más',
    correcta: false,
    explicacion:
      'El salario importa, pero decidir sólo por eso ignora si el trabajo diario de verdad te va a gustar — la mitad de la decisión que acabas de practicar con Tadeo.',
  },
  {
    id: 'c',
    texto: 'El único camino real en ciberseguridad es programar, así que hay que aprender a hacerlo bien',
    correcta: false,
    explicacion:
      'Ya viste que no: Analista SOC, Arquitecto/a de seguridad y Oficial de cumplimiento no tienen programar como tarea central, y son igual de reales y necesarios que los otros dos.',
  },
  {
    id: 'd',
    texto: 'Cualquier persona sirve igual de bien para cualquiera de los cinco roles',
    correcta: false,
    explicacion:
      'Al contrario: cada rol pide un cruce distinto de habilidades — por eso Ismael, Constanza y Tadeo terminaron en tres roles distintos, no en el mismo.',
  },
];
