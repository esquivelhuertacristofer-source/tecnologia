/**
 * `of-m365-calendario` · «Calendario y citas» — los datos, sin React.
 *
 * Construida sobre el armazón `simuladores/agenda` (nadie más lo consumía
 * todavía). Sale de DOC-PEDAGOGICO-M365-58.md §58.1, con una corrección
 * obligatoria del coordinador: el pliego original decía «arrastra la hora de
 * inicio a las once» — prohibido, porque jsdom pierde las coordenadas de
 * puntero y una prueba de arrastre pasa en verde sin comprobar nada
 * (COMO-SE-CONSTRUYE.md §5.1-5.2). El reagendado aquí es un SELECT de hora +
 * un botón «Confirmar cambio»: puro clic, cero arrastre.
 *
 * ── LA REGLA DURA DEL ARMAZÓN, HEREDADA AQUÍ ────────────────────────────────
 * Ni este archivo ni `Lab.tsx` llaman a `Date.now()` ni a `new Date()` sin
 * argumentos. `HOY` es una constante ISO fija; `sumarDias`/`minutosAHora` son
 * aritmética pura sobre esa constante, no lecturas del reloj.
 *
 * ── EL RECORDATORIO ──────────────────────────────────────────────────────
 * `CitaAgenda`/`NuevaCita` (tiposAgenda.ts) no tienen campo «recordatorio»:
 * no se toca el armazón para inventárselo. La casilla «Recordatorio 15 min
 * antes» del encargo 7 vive como estado local de `Lab.tsx` — decorativa, no
 * persiste en ninguna cita, la suite de pruebas no la trata como si
 * cambiara el estado del armazón. Sigue contando como encargo real porque
 * gatea el botón «Confirmar Agenda»: sin marcarla, ese botón avisa y no
 * cierra la clase.
 */

import { minutosAHora, semanaDe, sumarDias, type CitaAgenda } from '@/components/simuladores/agenda';

/** Lunes de la semana de la Feria Científica. Constante, nunca el reloj. */
export const HOY = '2026-08-17';

/** El miércoles de esa misma semana — el día de la Feria. */
export const MIERCOLES = sumarDias(HOY, 2);

/** Lunes a viernes de la semana de la Feria, con su etiqueta corta. */
const ETIQUETAS_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const DIAS_FORMULARIO: { id: string; etiqueta: string }[] = semanaDe(HOY)
  .slice(0, 5)
  .map((dia, i) => ({ id: dia, etiqueta: ETIQUETAS_DIA[i] }));

/** De 8:00 a 15:30 cada media hora — la franja de trabajo de la escuela. */
export const HORAS_DISPONIBLES: string[] = Array.from({ length: 16 }, (_, i) => minutosAHora(8 * 60 + i * 30));

export const ID_SEED = 'cita-entrenamiento';
export const ID_DEMO_ROBOT = 'cita-demo-robot';
export const ID_JURADO = 'cita-jurado';

export const TITULO_ESPERADO = 'Demostración Robot';
export const INICIO_ESPERADO = '10:00';
export const FIN_ESPERADO = '10:30';
export const CORREO_PROFESOR = 'profesor@tecnia.edu';

/** Lo único que hay en el calendario al abrir la clase: una cita ajena a la
 *  Feria, para que el calendario no se vea vacío y no choque con nada. */
export const SEMILLA_CITAS: CitaAgenda[] = [
  {
    id: ID_SEED,
    titulo: 'Entrenamiento de Robótica',
    dia: HOY,
    inicio: '08:00',
    fin: '09:00',
    invitados: [],
    color: '#0e7490',
  },
];

/* ── las líneas de Bit ──────────────────────────────────────────────────── */

export const APERTURA =
  '¡Hola! Soy Bit. Si dos reuniones ocurren a la misma hora, alguien quedará mal. ¡Vamos a poner orden en este calendario!';

export const LINEAS = {
  trasAbrirFormulario: 'Escribe el título de la cita, elige el miércoles y pon la hora de las diez de la mañana.',
  trasGuardar: '¡Guardada! Fíjate en el panel: acaba de llegar una invitación.',
  trasAceptar:
    '¡Atención! Mira la parrilla del miércoles: la Demostración del Robot y la Reunión del Jurado se cruzan.',
  trasReagendar: '¡Perfecto! El bloque ya no está en choque. Sólo falta confirmar la agenda.',
  cierre: '¡Excelente trabajo organizando Tecnia Calendario! Tu equipo ya sabe dónde y cuándo estar.',
};

/** El texto del encargo actual, por número de paso (1 a 7). */
export const INSTRUCCIONES: Record<number, string> = {
  1: 'Pulsa «+ Nueva Cita» en la barra superior para agendar la demostración del robot.',
  2: 'Escribe el título «Demostración Robot», elige el día Miércoles y la hora de 10:00 a 10:30.',
  3: 'Escribe profesor@tecnia.edu en Invitados, pulsa «+ Agregar» y luego «Guardar cita».',
  4: 'Abre la notificación «Reunión Jurado» en el panel y pulsa «Aceptar».',
  5: 'Mira la parrilla: hay un choque de horario. Pulsa el bloque «Demostración Robot» para editarlo.',
  6: 'Elige una nueva hora de inicio que no choque y pulsa «Confirmar cambio».',
  7: 'Activa «Recordatorio 15 min antes» y pulsa «Confirmar Agenda».',
};

export const TOTAL_PASOS = 7;
