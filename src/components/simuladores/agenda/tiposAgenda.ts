/**
 * TECNIA AGENDA · los datos, sin React.
 *
 * El calendario de Tecnia. No es Outlook ni Google Calendar —ningún logotipo
 * real—: es la agenda de la plataforma. Sale de partir «10 · Tecnia Nube» del
 * canon, que lo tenía metido dentro del armazón de archivos compartidos.
 *
 * ── LA REGLA DURA: aquí nadie mira el reloj ────────────────────────────────
 *
 * En este archivo NO se llama a `Date.now()` ni a `new Date()` sin argumentos,
 * nunca. El día de hoy —y el día que se está mirando— entran POR PARÁMETRO,
 * siempre en ISO `AAAA-MM-DD`. Si no fuera así, una prueba que hoy pasa
 * fallaría mañana y nadie sabría por qué.
 *
 * `new Date(Date.UTC(a, m - 1, d))` sí se usa, con los tres argumentos
 * explícitos y en UTC: es aritmética de calendario (¿qué día de la semana cae
 * el 1?, ¿cuántos días tiene febrero?), no una lectura del reloj, y en UTC no
 * hay husos que corran un día arriba o abajo.
 *
 * ── Las cuatro decisiones de datos ──────────────────────────────────────────
 *
 * 1. **Día y hora son cadenas, no `Date`.** `dia: 'AAAA-MM-DD'` y
 *    `'HH:MM'` en 24 horas. Comparar esas cadenas como texto ES comparar
 *    fechas y horas, sin husos, sin horario de verano y sin sorpresas al
 *    serializar. `minutosDe` convierte a número sólo cuando hace falta medir.
 *
 * 2. **Solaparse es legal y se ve.** Dos citas a la misma hora no son un
 *    error: son el problema que el alumno tiene que descubrir. `disponerDia`
 *    reparte las citas de un día en CARRILES —el reparto clásico de un
 *    calendario— para que las dos se pinten una al lado de la otra en vez de
 *    esconderse. Tocarse por el borde (una acaba 10:00 y la otra empieza
 *    10:00) NO es solaparse.
 *
 * 3. **Una cita que acaba antes de empezar se rechaza; dos citas idénticas
 *    no.** La primera es imposible: no existe un rato que dure menos que
 *    nada. La segunda es sólo una mala idea, y juzgar es de la clase, no del
 *    armazón. Se crean las dos y `disponerDia` las enseña solapadas — que es
 *    la lección, dicha por los datos y no por un cartel.
 *
 * 4. **Invitar es un estado, no una lista de nombres.** Cada invitado lleva su
 *    `respuesta` (`pendiente` / `acepta` / `rechaza`), porque la mitad de lo
 *    que enseña una agenda compartida es que invitar no es lo mismo que
 *    contar con alguien. Invitar dos veces a la misma persona se rechaza:
 *    borraría su respuesta anterior sin decirlo.
 *
 * Datos inmutables y operaciones puras: si no hay cambio se devuelve el MISMO
 * objeto por identidad (`toBe`, no `toEqual`), igual que en `tiposMuro.ts`.
 */

/* ── el vocabulario del tiempo ──────────────────────────────────────────── */

const DIA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA_ISO = /^([01]\d|2[0-3]):[0-5]\d$/;

export function diaValido(dia: string): boolean {
  if (!DIA_ISO.test(dia)) return false;
  // Un 2026-02-30 pasa el patrón pero no existe: se comprueba de ida y vuelta.
  const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

export function horaValida(hora: string): boolean {
  return HORA_ISO.test(hora);
}

/** `'09:30'` → 570. Devuelve `-1` si la hora no es válida. */
export function minutosDe(hora: string): number {
  if (!horaValida(hora)) return -1;
  const [h, m] = hora.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const acotado = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutos)));
  const h = Math.floor(acotado / 60);
  const m = acotado % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Días de diferencia entre dos días ISO. Aritmética de calendario en UTC. */
export function sumarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
  const fecha = new Date(Date.UTC(a, m - 1, d + dias));
  return fecha.toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo. La semana española empieza en lunes. */
export function diaDeLaSemana(dia: string): number {
  const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Los siete días de la semana que contiene `dia`, de lunes a domingo. */
export function semanaDe(dia: string): string[] {
  const lunes = sumarDias(dia, -diaDeLaSemana(dia));
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/**
 * La rejilla del mes que contiene `dia`: SIEMPRE 42 casillas (6 semanas de 7),
 * con los días de relleno del mes anterior y del siguiente. 42 fijo y no «las
 * que hagan falta» porque una rejilla que cambia de alto cada mes salta a la
 * vista cada vez que se pasa de página.
 */
export function rejillaDelMes(dia: string): string[] {
  const [a, m] = dia.split('-').map(Number) as [number, number];
  const primero = `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
  const inicio = sumarDias(primero, -diaDeLaSemana(primero));
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
}

/** `'2026-08-15'` → `'2026-08'`. Para saber qué casillas son del mes de al lado. */
export function mesDe(dia: string): string {
  return dia.slice(0, 7);
}

/* ── la cita ────────────────────────────────────────────────────────────── */

export interface PersonaAgenda {
  id: string;
  nombre: string;
  avatar?: string;
}

export type RespuestaInvitacion = 'pendiente' | 'acepta' | 'rechaza';

export interface InvitadoAgenda {
  persona: PersonaAgenda;
  respuesta: RespuestaInvitacion;
}

export interface CitaAgenda {
  id: string;
  titulo: string;
  /** ISO `AAAA-MM-DD`. */
  dia: string;
  /** `HH:MM` en 24 horas. */
  inicio: string;
  fin: string;
  lugar?: string;
  invitados: InvitadoAgenda[];
  /** Color pleno en hexadecimal. Si falta, la ventana pone el suyo. */
  color?: string;
}

export function duracionEnMinutos(cita: CitaAgenda): number {
  return minutosDe(cita.fin) - minutosDe(cita.inicio);
}

/* ── una cita que no puede existir ──────────────────────────────────────── */

export type MotivoCitaInvalida =
  | 'sin-titulo'
  | 'dia-invalido'
  | 'hora-invalida'
  | 'fin-antes-de-inicio'
  | 'sin-duracion';

export type ResultadoCita = { ok: true } | { ok: false; motivo: MotivoCitaInvalida; aviso: string };

/**
 * Decisión 3: se rechaza lo imposible, no lo desaconsejable. Una cita a la
 * misma hora que otra pasa por aquí sin una palabra — eso lo dice el
 * calendario enseñándolas solapadas, no un cartel del armazón.
 */
export function revisarCita(cita: {
  titulo: string;
  dia: string;
  inicio: string;
  fin: string;
}): ResultadoCita {
  if (cita.titulo.trim() === '') {
    return { ok: false, motivo: 'sin-titulo', aviso: 'Una cita sin título no dice a qué vas.' };
  }
  if (!diaValido(cita.dia)) {
    return { ok: false, motivo: 'dia-invalido', aviso: 'Ese día no existe en el calendario.' };
  }
  if (!horaValida(cita.inicio) || !horaValida(cita.fin)) {
    return { ok: false, motivo: 'hora-invalida', aviso: 'Las horas se escriben de 00:00 a 23:59.' };
  }
  const inicio = minutosDe(cita.inicio);
  const fin = minutosDe(cita.fin);
  if (fin < inicio) {
    return {
      ok: false,
      motivo: 'fin-antes-de-inicio',
      aviso: 'Esa cita acabaría antes de empezar. Mira otra vez las dos horas.',
    };
  }
  if (fin === inicio) {
    return { ok: false, motivo: 'sin-duracion', aviso: 'Empieza y acaba a la misma hora: no dura nada.' };
  }
  return { ok: true };
}

/* ── solaparse ──────────────────────────────────────────────────────────── */

/**
 * Decisión 2. Tocarse por el borde no es solaparse: una clase que acaba a las
 * 10:00 y otra que empieza a las 10:00 caben perfectamente en la misma mañana,
 * y marcarlas en rojo sería mentir.
 */
export function seSolapan(a: CitaAgenda, b: CitaAgenda): boolean {
  if (a.id === b.id || a.dia !== b.dia) return false;
  return minutosDe(a.inicio) < minutosDe(b.fin) && minutosDe(b.inicio) < minutosDe(a.fin);
}

/** Con cuáles de `citas` choca `cita`. Nunca consigo misma. */
export function solapesDe(cita: CitaAgenda, citas: CitaAgenda[]): CitaAgenda[] {
  return citas.filter((otra) => seSolapan(cita, otra));
}

export function citasDe(citas: CitaAgenda[], dia: string): CitaAgenda[] {
  return citas
    .filter((c) => c.dia === dia)
    .sort((x, y) => minutosDe(x.inicio) - minutosDe(y.inicio) || minutosDe(x.fin) - minutosDe(y.fin));
}

/** Dónde y con qué ancho se pinta una cita dentro de su día. */
export interface ColocacionCita {
  cita: CitaAgenda;
  /** Carril 0 es el de más a la izquierda. */
  carril: number;
  /** Cuántos carriles se reparten el ancho en el grupo de esta cita. */
  carriles: number;
  /** Minutos desde medianoche, para el `top` de la rejilla. */
  desde: number;
  hasta: number;
}

/**
 * Decisión 2: el reparto en carriles. Las citas que se solapan entre sí forman
 * un GRUPO, y el grupo entero se reparte el ancho: dos citas a la misma hora
 * salen a media anchura cada una, una al lado de la otra. Sin esto, la segunda
 * cita se escondería debajo de la primera y el alumno no vería el problema que
 * viene a resolver.
 */
export function disponerDia(citas: CitaAgenda[], dia: string): ColocacionCita[] {
  const delDia = citasDe(citas, dia);
  if (delDia.length === 0) return [];

  /* Un grupo se corta en cuanto empieza una cita después de que TODAS las
     anteriores del grupo hayan terminado: ahí el ancho vuelve a ser entero. */
  const colocadas: ColocacionCita[] = [];
  let grupo: CitaAgenda[] = [];
  let finDelGrupo = -1;

  const cerrarGrupo = () => {
    if (grupo.length === 0) return;
    const finPorCarril: number[] = [];
    const carrilDe = new Map<string, number>();
    for (const c of grupo) {
      const desde = minutosDe(c.inicio);
      let carril = finPorCarril.findIndex((fin) => fin <= desde);
      if (carril < 0) {
        carril = finPorCarril.length;
        finPorCarril.push(0);
      }
      finPorCarril[carril] = minutosDe(c.fin);
      carrilDe.set(c.id, carril);
    }
    for (const c of grupo) {
      colocadas.push({
        cita: c,
        carril: carrilDe.get(c.id) ?? 0,
        carriles: finPorCarril.length,
        desde: minutosDe(c.inicio),
        hasta: minutosDe(c.fin),
      });
    }
    grupo = [];
    finDelGrupo = -1;
  };

  for (const c of delDia) {
    const desde = minutosDe(c.inicio);
    if (grupo.length > 0 && desde >= finDelGrupo) cerrarGrupo();
    grupo.push(c);
    finDelGrupo = Math.max(finDelGrupo, minutosDe(c.fin));
  }
  cerrarGrupo();

  return colocadas;
}

/* ── operaciones sobre la lista de citas ────────────────────────────────── */

export type MotivoRechazoCita = MotivoCitaInvalida | 'id-repetido' | 'no-existe';

export type ResultadoAgenda =
  | { ok: true; citas: CitaAgenda[]; cita: CitaAgenda }
  | { ok: false; motivo: MotivoRechazoCita; aviso: string; citas: CitaAgenda[] };

export interface NuevaCita {
  id: string;
  titulo: string;
  dia: string;
  inicio: string;
  fin: string;
  lugar?: string;
  invitados?: InvitadoAgenda[];
  color?: string;
}

export function crearCita(citas: CitaAgenda[], nueva: NuevaCita): ResultadoAgenda {
  const revision = revisarCita(nueva);
  if (!revision.ok) {
    return { ok: false, motivo: revision.motivo, aviso: revision.aviso, citas };
  }
  if (citas.some((c) => c.id === nueva.id)) {
    return { ok: false, motivo: 'id-repetido', aviso: 'Ya hay una cita con ese identificador.', citas };
  }
  const cita: CitaAgenda = {
    id: nueva.id,
    titulo: nueva.titulo.trim(),
    dia: nueva.dia,
    inicio: nueva.inicio,
    fin: nueva.fin,
    lugar: nueva.lugar,
    invitados: nueva.invitados ?? [],
    color: nueva.color,
  };
  return { ok: true, citas: [...citas, cita], cita };
}

/**
 * Mover conserva la duración cuando sólo se cambian día y hora de inicio: eso
 * es lo que hace un calendario de verdad al arrastrar un bloque. Si se da un
 * `fin` explícito, manda ése y se revisa entero.
 */
export function moverCita(
  citas: CitaAgenda[],
  citaId: string,
  destino: { dia?: string; inicio?: string; fin?: string },
): ResultadoAgenda {
  const cita = citas.find((c) => c.id === citaId);
  if (!cita) {
    return { ok: false, motivo: 'no-existe', aviso: 'Esa cita ya no está en la agenda.', citas };
  }
  const dia = destino.dia ?? cita.dia;
  const inicio = destino.inicio ?? cita.inicio;
  const fin =
    destino.fin ??
    (destino.inicio !== undefined
      ? minutosAHora(minutosDe(destino.inicio) + duracionEnMinutos(cita))
      : cita.fin);

  if (dia === cita.dia && inicio === cita.inicio && fin === cita.fin) {
    return { ok: true, citas, cita }; // no-op: identidad, la lista no cambia
  }
  const revision = revisarCita({ titulo: cita.titulo, dia, inicio, fin });
  if (!revision.ok) {
    return { ok: false, motivo: revision.motivo, aviso: revision.aviso, citas };
  }
  const movida: CitaAgenda = { ...cita, dia, inicio, fin };
  return { ok: true, citas: citas.map((c) => (c.id === citaId ? movida : c)), cita: movida };
}

export function borrarCita(citas: CitaAgenda[], citaId: string): CitaAgenda[] {
  if (!citas.some((c) => c.id === citaId)) return citas; // no-op: identidad
  return citas.filter((c) => c.id !== citaId);
}

/* ── invitar y responder ────────────────────────────────────────────────── */

export type MotivoInvitar = 'ya-invitado';
export type MotivoResponder = 'no-invitado';

export type ResultadoInvitar =
  | { ok: true; cita: CitaAgenda }
  | { ok: false; motivo: MotivoInvitar; aviso: string; cita: CitaAgenda };

export type ResultadoResponder =
  | { ok: true; cita: CitaAgenda }
  | { ok: false; motivo: MotivoResponder; aviso: string; cita: CitaAgenda };

/**
 * Decisión 4: invitar dos veces a la misma persona se rechaza. Volver a
 * añadirla la devolvería a `pendiente` y borraría sin decir nada el «no
 * puedo» que ya había contestado.
 */
export function invitar(cita: CitaAgenda, persona: PersonaAgenda): ResultadoInvitar {
  const ya = cita.invitados.find((i) => i.persona.id === persona.id);
  if (ya) {
    return {
      ok: false,
      motivo: 'ya-invitado',
      aviso: `${persona.nombre} ya estaba invitada${ya.respuesta === 'pendiente' ? '' : ' y ya contestó'}.`,
      cita,
    };
  }
  return { ok: true, cita: { ...cita, invitados: [...cita.invitados, { persona, respuesta: 'pendiente' }] } };
}

export function responderInvitacion(
  cita: CitaAgenda,
  personaId: string,
  respuesta: RespuestaInvitacion,
): ResultadoResponder {
  const invitado = cita.invitados.find((i) => i.persona.id === personaId);
  if (!invitado) {
    return { ok: false, motivo: 'no-invitado', aviso: 'Esa persona no está invitada a esta cita.', cita };
  }
  if (invitado.respuesta === respuesta) return { ok: true, cita }; // no-op: identidad
  return {
    ok: true,
    cita: {
      ...cita,
      invitados: cita.invitados.map((i) => (i.persona.id === personaId ? { ...i, respuesta } : i)),
    },
  };
}

export function cuentaInvitados(cita: CitaAgenda): Record<RespuestaInvitacion, number> {
  const cuenta: Record<RespuestaInvitacion, number> = { pendiente: 0, acepta: 0, rechaza: 0 };
  for (const i of cita.invitados) cuenta[i.respuesta] += 1;
  return cuenta;
}
