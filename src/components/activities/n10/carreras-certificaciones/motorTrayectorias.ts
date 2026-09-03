/**
 * N10 · «Proyecto capstone y portafolio» — «Carreras y certificaciones»
 * (parada 3 de 3, CIERRE de la unidad y de la orientación profesional de
 * TODA la plataforma). **N10 = Bachillerato, 15–18 años**, tono «Perfil
 * profesional»: sin diminutivos, registro corporativo.
 *
 * ── Los dos predicados reales, nunca una tabla de veredictos ────────────────
 *
 * Mismo patrón que `mejorRolPara` en `n10-carreras-ciber` y `mejorEmpleoPara`
 * en `n9-empleos-tecnologicos` (documento §46, regla anti-épsilon), con
 * vocabulario y alcance propios — no se reimporta ni se copia
 * `motorCarreras.ts`. Aquí hacen falta DOS predicados independientes, porque
 * la decisión real tiene dos preguntas distintas:
 *
 *   1. `mejorFamiliaPara()` — QUÉ familia de carrera tecnológica encaja según
 *      lo que a alguien de verdad se le da bien e interesa (vocabulario de
 *      seis `RasgoInteres`, cada familia declara sus dos rasgos clave).
 *
 *   2. `mejorSiguientePasoPara()` — QUÉ TIPO de siguiente paso encaja según
 *      la situación real de esa persona —no según la familia elegida: la
 *      misma familia admite un siguiente paso distinto según cuánto tiempo
 *      tiene alguien, si ya cuenta con una base y qué tan rápido necesita
 *      entrar a trabajar (vocabulario independiente de seis `SenalDecision`,
 *      cada tipo de siguiente paso declara sus dos señales clave).
 *
 * Los tres casos (Fernanda, Joaquín, Renata) declaran DOS rasgos de interés
 * Y DOS señales de decisión cada uno; ambos predicados se calculan sobre esos
 * datos declarados, nunca contra un id de familia o de siguiente paso fijado
 * a mano en cada caso. Si mañana se agrega una sexta familia o un cuarto
 * caso, el mismo cálculo sigue sirviendo sin tocar el veredicto de nadie más.
 *
 * ── Qué NO repite de las unidades y paradas anteriores de N10 ───────────────
 *
 * `n10-carreras-ciber` ya clasificó cinco roles DENTRO de ciberseguridad con
 * su propio vocabulario (`detecta-anomalias`, `piensa-como-atacante`, etc.).
 * Aquí «Ciberseguridad» es sólo UNA de cinco familias —junto a Desarrollo de
 * software, Datos e IA, Diseño UX/UI y Redes e infraestructura en la nube—,
 * con un vocabulario de interés distinto y más amplio; no se reescribe el
 * detalle de los cinco roles de esa parada, sólo se referencia por nombre en
 * una reflexión de integración. `n10-portafolio-y-cv` (parada 2, motor de
 * Word) ya armó el currículum de Sofía; aquí se referencia por nombre, sin
 * repetir su ejercicio de edición de documento.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Las cinco familias de carreras tecnológicas — predicado real #1
// ═══════════════════════════════════════════════════════════════════════════

export type RasgoInteres =
  | 'construye-software'
  | 'analiza-datos-y-modelos'
  | 'defiende-y-anticipa-riesgos'
  | 'disena-para-personas'
  | 'opera-infraestructura'
  | 'comunica-con-claridad';

export interface FamiliaCarrera {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Los dos rasgos que de verdad definen esta familia — nunca una lista arbitraria. */
  rasgosClave: [RasgoInteres, RasgoInteres];
  requiereProgramarComoTareaCentral: boolean;
}

export const FAMILIA_DESARROLLO: FamiliaCarrera = {
  id: 'desarrollo-software',
  nombre: 'Desarrollo de software',
  emoji: '💻',
  descripcion:
    'Diseña y construye las aplicaciones y sitios que la gente usa todos los días: desde la lógica que procesa la información hasta la interfaz con la que interactúan.',
  rasgosClave: ['construye-software', 'analiza-datos-y-modelos'],
  requiereProgramarComoTareaCentral: true,
};

export const FAMILIA_DATOS_IA: FamiliaCarrera = {
  id: 'datos-ia',
  nombre: 'Datos e inteligencia artificial',
  emoji: '📊',
  descripcion:
    'Encuentra patrones en volúmenes grandes de información y construye o ajusta modelos que ayudan a una organización a decidir con evidencia, no con intuición.',
  rasgosClave: ['analiza-datos-y-modelos', 'comunica-con-claridad'],
  requiereProgramarComoTareaCentral: true,
};

export const FAMILIA_CIBERSEGURIDAD: FamiliaCarrera = {
  id: 'ciberseguridad',
  nombre: 'Ciberseguridad',
  emoji: '🛡️',
  descripcion:
    'Protege los sistemas, los datos y las identidades digitales de una organización, anticipando cómo intentaría vulnerarlos alguien con malas intenciones.',
  rasgosClave: ['defiende-y-anticipa-riesgos', 'construye-software'],
  requiereProgramarComoTareaCentral: false,
};

export const FAMILIA_UX: FamiliaCarrera = {
  id: 'diseno-ux-ui',
  nombre: 'Diseño de experiencia de usuario (UX/UI)',
  emoji: '🎨',
  descripcion:
    'Investiga cómo interactúa una persona real con un producto digital y diseña esa interacción para que sea clara, útil y agradable de usar.',
  rasgosClave: ['disena-para-personas', 'comunica-con-claridad'],
  requiereProgramarComoTareaCentral: false,
};

export const FAMILIA_INFRAESTRUCTURA: FamiliaCarrera = {
  id: 'redes-infraestructura-nube',
  nombre: 'Redes e infraestructura en la nube',
  emoji: '☁️',
  descripcion:
    'Diseña, configura y mantiene los servidores, las redes y los servicios en la nube sobre los que corren todos los sistemas anteriores, cuidando que sigan funcionando y protegidos.',
  rasgosClave: ['opera-infraestructura', 'defiende-y-anticipa-riesgos'],
  requiereProgramarComoTareaCentral: false,
};

export const FAMILIAS_CARRERA: FamiliaCarrera[] = [
  FAMILIA_DESARROLLO,
  FAMILIA_DATOS_IA,
  FAMILIA_CIBERSEGURIDAD,
  FAMILIA_UX,
  FAMILIA_INFRAESTRUCTURA,
];

/** Cuenta cuántos rasgos comparte una persona con cada familia y devuelve la
 *  que más comparte — el predicado real, nunca un id copiado a mano. */
export function mejorFamiliaPara(rasgosPersona: RasgoInteres[]): FamiliaCarrera {
  let mejor = FAMILIAS_CARRERA[0];
  let mejorPuntaje = -1;
  for (const familia of FAMILIAS_CARRERA) {
    const puntaje = familia.rasgosClave.filter((r) => rasgosPersona.includes(r)).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = familia;
    }
  }
  return mejor;
}

export const MENSAJE_ACIERTO_CAMINOS =
  'Coinciden los cinco: Desarrollo de software y Datos e IA sí tienen programar como tarea central —construir código o modelos es el trabajo del día a día—. Ciberseguridad, Diseño UX/UI y Redes e infraestructura en la nube NO: su tarea central es proteger, investigar y diseñar, u operar sistemas, aunque en cualquiera de los cinco caminos escribir algo de código puede ayudar. La tecnología profesional es mucho más amplia que «programar todo el día».';

export const MENSAJE_ERROR_CAMINOS =
  'Todavía no coinciden los cinco. Piensa en la tarea del día a día de cada camino: ¿escribir código es el centro de ese trabajo, o es sólo una herramienta que a veces se usa para otra tarea central?';

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Los tres tipos de siguiente paso — predicado real #2, independiente
// ═══════════════════════════════════════════════════════════════════════════

export type SenalDecision =
  | 'ya-tiene-base-relacionada'
  | 'quiere-entrar-rapido-al-trabajo'
  | 'quiere-teoria-profunda'
  | 'quiere-validar-una-habilidad-puntual'
  | 'tiene-tiempo-y-recursos-para-varios-anos'
  | 'prefiere-aprender-haciendo-proyectos';

export interface TipoSiguientePaso {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Las dos señales de la situación real de una persona que de verdad definen este siguiente paso. */
  senalesClave: [SenalDecision, SenalDecision];
}

export const PASO_UNIVERSIDAD: TipoSiguientePaso = {
  id: 'universidad',
  nombre: 'Universidad',
  emoji: '🎓',
  descripcion:
    'Una carrera completa, de varios años, con una base teórica profunda —matemáticas, ciencias de la computación, estadística— antes de especializarse.',
  senalesClave: ['quiere-teoria-profunda', 'tiene-tiempo-y-recursos-para-varios-anos'],
};

export const PASO_BOOTCAMP: TipoSiguientePaso = {
  id: 'bootcamp',
  nombre: 'Bootcamp',
  emoji: '🚀',
  descripcion:
    'Un programa intensivo y corto —semanas o pocos meses—, enfocado en construir proyectos reales para entrar al mercado laboral lo antes posible.',
  senalesClave: ['quiere-entrar-rapido-al-trabajo', 'prefiere-aprender-haciendo-proyectos'],
};

export const PASO_CERTIFICACION: TipoSiguientePaso = {
  id: 'certificacion',
  nombre: 'Certificación profesional',
  emoji: '📜',
  descripcion:
    'Un examen —y a veces algunos ejercicios prácticos— que valida un conocimiento puntual y específico, para alguien que ya tiene una base y quiere comprobarla formalmente.',
  senalesClave: ['ya-tiene-base-relacionada', 'quiere-validar-una-habilidad-puntual'],
};

export const TIPOS_SIGUIENTE_PASO: TipoSiguientePaso[] = [PASO_UNIVERSIDAD, PASO_BOOTCAMP, PASO_CERTIFICACION];

/** Mismo cálculo que `mejorFamiliaPara`, sobre un vocabulario independiente:
 *  la situación real de una persona, no la familia de carrera que eligió. */
export function mejorSiguientePasoPara(senalesPersona: SenalDecision[]): TipoSiguientePaso {
  let mejor = TIPOS_SIGUIENTE_PASO[0];
  let mejorPuntaje = -1;
  for (const paso of TIPOS_SIGUIENTE_PASO) {
    const puntaje = paso.senalesClave.filter((s) => senalesPersona.includes(s)).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = paso;
    }
  }
  return mejor;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Los tres casos — el mismo par de predicados, tres historias distintas
// ═══════════════════════════════════════════════════════════════════════════

export interface CasoEstudiante {
  id: string;
  nombre: string;
  historia: string;
  rasgos: RasgoInteres[];
  senales: SenalDecision[];
}

export const CASO_FERNANDA: CasoEstudiante = {
  id: 'fernanda',
  nombre: 'Fernanda',
  historia:
    'Fernanda pasó los últimos dos veranos construyendo, sola, un modelo en hojas de cálculo que predecía qué contenedores de reciclaje de su escuela se llenarían primero, cruzando semanas de datos reales. Le fascinó tanto encontrar el patrón como explicárselo, con gráficas claras, al comité ambiental de la escuela para que decidieran con evidencia dónde poner más contenedores. Quiere entender a fondo las matemáticas y la estadística detrás de un modelo, y está dispuesta a dedicarle varios años completos de estudio formal antes de trabajar en esto.',
  rasgos: ['analiza-datos-y-modelos', 'comunica-con-claridad'],
  senales: ['quiere-teoria-profunda', 'tiene-tiempo-y-recursos-para-varios-anos'],
};

export const CASO_JOAQUIN: CasoEstudiante = {
  id: 'joaquin',
  nombre: 'Joaquín',
  historia:
    'Joaquín aprendió a programar por su cuenta, viendo tutoriales y armando proyectos pequeños. Ahora dedica su tiempo libre a probar, con permiso, si puede encontrar la manera de vulnerar las apps que arman sus amigos del club de tecnología —antes de que alguien más lo intente de verdad— y luego les explica exactamente cómo lo logró para que la corrijan. No le interesa pasar años sentado en clases teóricas: quiere empezar a trabajar pronto, y aprende mejor construyendo y rompiendo cosas reales que leyendo sobre ellas.',
  rasgos: ['defiende-y-anticipa-riesgos', 'construye-software'],
  senales: ['quiere-entrar-rapido-al-trabajo', 'prefiere-aprender-haciendo-proyectos'],
};

export const CASO_RENATA: CasoEstudiante = {
  id: 'renata',
  nombre: 'Renata',
  historia:
    'Desde hace dos años, Renata es voluntaria en una asociación civil pequeña: instaló y mantiene la red inalámbrica de sus oficinas, configuró sus servidores en la nube, y resuelve las fallas de conexión cuando algo deja de funcionar un lunes por la mañana. Disfruta mantener los sistemas funcionando sin que nadie note el esfuerzo detrás, y cuidar que estén bien protegidos. Ya tiene la base práctica que le hace falta: lo único que quiere ahora es una credencial reconocida que compruebe, frente a un empleador, que sabe administrar infraestructura en la nube de forma profesional — no quiere empezar de cero con una carrera completa.',
  rasgos: ['opera-infraestructura', 'defiende-y-anticipa-riesgos'],
  senales: ['ya-tiene-base-relacionada', 'quiere-validar-una-habilidad-puntual'],
};

export const CASOS_ESTUDIANTES: CasoEstudiante[] = [CASO_FERNANDA, CASO_JOAQUIN, CASO_RENATA];

export const MENSAJE_ERROR_CASO =
  'Todavía no. Vuelve a leer la historia completa: la familia de carrera depende de lo que de verdad se le da bien e interesa; el siguiente paso depende de su situación real —cuánto tiempo tiene, si ya cuenta con una base, qué tan rápido necesita trabajar— y son dos preguntas distintas, no una sola.';

export function mensajeAciertoCaso(caso: CasoEstudiante, familia: FamiliaCarrera, paso: TipoSiguientePaso): string {
  return `Coincide: ${caso.nombre} encaja con ${familia.nombre} y con ${paso.nombre} como siguiente paso. Fíjate en que llegaste a esa doble respuesta cruzando dos cosas distintas de su historia —qué se le da bien, y en qué situación real está— no adivinando el nombre más familiar.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Cómo leer una certificación — sin inventar nombres ni detalles falsos
// ═══════════════════════════════════════════════════════════════════════════

export const TEXTO_CERTIFICACION_NUBE =
  'Piensa en una certificación profesional de nube: la otorga la propia empresa que fabrica esa plataforma, después de que la persona aprueba un examen de opción múltiple y algunos ejercicios prácticos sobre los servicios básicos de ESA plataforma en particular. Prepararla cuesta tiempo y dinero, y tiene fecha de vencimiento: hay que volver a examinarse cada uno o dos años para conservarla vigente.';

export interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

export const OPCIONES_QUE_CERTIFICA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Que, en el momento del examen, la persona demostró conocer los servicios básicos de ESA plataforma de nube en particular.',
    correcta: true,
    explicacion:
      'Exacto. Una certificación certifica un conocimiento puntual, verificado en un examen concreto, sobre una tecnología específica — ni más ni menos que eso.',
  },
  {
    id: 'b',
    texto: 'Que la persona ya tiene años de experiencia real administrando sistemas en producción.',
    correcta: false,
    explicacion:
      'No: un examen de opción múltiple no puede comprobar experiencia real. Por eso muchas ofertas de trabajo piden la certificación Y experiencia — una no sustituye a la otra.',
  },
  {
    id: 'c',
    texto: 'Que la persona sabrá trabajar igual de bien en cualquier otra plataforma de nube.',
    correcta: false,
    explicacion: 'No: la certificación es específica de ESA plataforma. Otro proveedor de nube organiza sus servicios distinto y pide su propia certificación.',
  },
  {
    id: 'd',
    texto: 'Que nunca más tendrá que volver a estudiar el tema.',
    correcta: false,
    explicacion: 'Al contrario: como la certificación vence, exige volver a examinarse — la tecnología cambia, y está diseñada para no quedarse obsoleta.',
  },
];

export const OPCIONES_QUIEN_LA_EMITE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Ninguna es automáticamente «mejor»: lo que cambia es el alcance. Una certifica dominio de una plataforma concreta; la otra, un cuerpo de conocimiento más general reconocido por toda la industria. Conviene revisar cuál pide el tipo de trabajo que se busca.',
    correcta: true,
    explicacion:
      'Exacto. Quién emite una certificación —un fabricante o un organismo independiente— cambia lo que certifica y quién la reconoce, no cuánto «vale» en abstracto.',
  },
  {
    id: 'b',
    texto: 'La del fabricante siempre vale más, porque la empresa es más grande.',
    correcta: false,
    explicacion: 'El tamaño de la empresa que la emite no es el criterio: lo que importa es si certifica exactamente lo que el puesto que buscas necesita.',
  },
  {
    id: 'c',
    texto: 'La del organismo independiente siempre vale más, porque no la vende ninguna empresa.',
    correcta: false,
    explicacion: 'Tampoco: ser independiente no la hace automáticamente más valiosa. De nuevo, depende de qué pida el puesto que buscas.',
  },
  {
    id: 'd',
    texto: 'Da exactamente igual cuál se elija, porque todas las certificaciones sirven para todo.',
    correcta: false,
    explicacion: 'No: cada certificación certifica algo puntual y específico. Ninguna «sirve para todo» — ésa es la idea completa de esta parte del panel.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Reflexiones de integración y cierre
// ═══════════════════════════════════════════════════════════════════════════

export const OPCIONES_REFLEXION_DATOS: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Datos e inteligencia artificial',
    correcta: true,
    explicacion:
      'Exacto: escribir una consulta para encontrar un patrón en información real —lo que ya practicaste en la unidad de bases de datos y SQL— es el corazón del trabajo diario en Datos e IA.',
  },
  {
    id: 'b',
    texto: 'Diseño de experiencia de usuario (UX/UI)',
    correcta: false,
    explicacion: 'El diseño UX/UI investiga cómo interactúa una persona con un producto; no es quien escribe la consulta que encuentra el patrón en los datos.',
  },
  {
    id: 'c',
    texto: 'Redes e infraestructura en la nube',
    correcta: false,
    explicacion: 'Infraestructura mantiene los servidores donde viven esos datos; no es quien escribe la consulta que responde la pregunta con ellos.',
  },
  {
    id: 'd',
    texto: 'Ciberseguridad',
    correcta: false,
    explicacion: 'Ciberseguridad protege esos datos de un acceso indebido; no es quien los consulta a diario para encontrar un patrón.',
  },
];

export const OPCIONES_REFLEXION_PORTAFOLIO: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque los tres caminos, al final, necesitan demostrarse con evidencia concreta frente a alguien que decide —un reclutador, un comité de admisión, o quien revisa una certificación— y esa evidencia se comunica con el mismo criterio de claridad, sin importar el camino.',
    correcta: true,
    explicacion:
      'Exacto. Sea universidad, bootcamp o certificación, en algún punto alguien va a revisar, con prisa, qué hiciste de verdad — el mismo criterio de los siete segundos que ya aplicaste en el currículum de Sofía.',
  },
  {
    id: 'b',
    texto: 'Porque un currículum sólo sirve para conseguir trabajo, y la universidad no lo pide.',
    correcta: false,
    explicacion: 'No es así: muchas admisiones universitarias y becas también piden un perfil o un resumen de logros —el mismo criterio de claridad aplica.',
  },
  {
    id: 'c',
    texto: 'En realidad no importa: cada camino tiene su propio documento, sin relación con el currículum.',
    correcta: false,
    explicacion: 'Al contrario: los tres caminos comparten la misma necesidad de mostrar evidencia clara de lo que alguien ya hizo.',
  },
  {
    id: 'd',
    texto: 'Sólo importa para quien elige un bootcamp.',
    correcta: false,
    explicacion: 'No: un bootcamp no es distinto de los otros dos caminos en esto — los tres necesitan la misma evidencia clara.',
  },
];

export const OPCIONES_REFLEXION_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Cruzar lo que de verdad se te da bien y te interesa —construir software, analizar datos, defender sistemas, diseñar para personas u operar infraestructura— con tu situación real: cuánto tiempo y recursos tienes, si ya cuentas con una base, y qué tan rápido necesitas entrar a trabajar.',
    correcta: true,
    explicacion:
      'Exacto. Fernanda, Joaquín y Renata terminaron en tres familias y tres siguientes pasos distintos porque cada uno cruzó sus propios rasgos con su propia situación real — el mismo criterio que te toca aplicar a ti, justo antes de tu propio proyecto capstone.',
  },
  {
    id: 'b',
    texto: 'Elegir siempre la universidad, porque es el único camino que un empleador toma en serio.',
    correcta: false,
    explicacion:
      'Ya viste que no: Joaquín entra a trabajar por un bootcamp y Renata valida su base con una certificación — los tres caminos son reales y reconocidos, según la situación de cada quien.',
  },
  {
    id: 'c',
    texto: 'Elegir el camino que curse la mayoría de tus compañeros de clase.',
    correcta: false,
    explicacion: 'Eso ignora tanto tus propios rasgos como tu propia situación real — la decisión de otra persona no resuelve la tuya.',
  },
  {
    id: 'd',
    texto: 'Elegir la certificación con el nombre más conocido, sin revisar qué certifica en realidad.',
    correcta: false,
    explicacion: 'Justo lo contrario de lo que acabas de practicar: una certificación certifica algo puntual y específico, nunca «todo» por tener un nombre conocido.',
  },
];
