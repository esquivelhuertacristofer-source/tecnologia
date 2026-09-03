'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaM365, rutaM365 } from '../comun/rutas';
import { LabM365Calendario } from './Lab';

/**
 * Entrada de `of-m365-calendario` — «Calendario y citas», la primera
 * exclusiva del grado Intermedio de la sala de M365 (§58.1).
 *
 * Plantilla de oro sin tocarla, como las 19 clases ya cerradas de PowerPoint
 * y las de Word. La ruta sale de `office/m365/comun/rutas.ts` —derivada de
 * `EJERCICIOS_OFFICE`, nunca escrita a mano (§44.6)—, así que en cuanto el
 * coordinador cambie el `estado` de esta clase a `'disponible'` en
 * `curriculo.ts`, `parada` deja de ser 0 sin tocar esta línea.
 *
 * Las cuatro fichas van sin `img`.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/of-m365-calendario/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-m365-calendario',
  laboratorio: LabM365Calendario,
  ruta: rutaM365('intermedio'),
  parada: paradaM365('intermedio', 'of-m365-calendario'),
  globo:
    '¡Hola! Soy Bit. Si dos reuniones ocurren a la misma hora, alguien quedará mal. ¡Vamos a poner orden en este calendario!',
  arranqueSub:
    'La Feria Científica arranca este miércoles y el equipo no sabe a qué hora exponer ni cuándo reunirse con los jueces. Vas a abrir Tecnia Calendario y organizar la agenda tú mismo: agendar la demostración del robot, invitar al profesor de tecnología, aceptar la invitación de la Coordinación y —cuando las dos reuniones se crucen en la misma hora— reagendar la tuya con un par de clics, nunca arrastrando nada. Siete encargos, y al final tu equipo va a saber exactamente dónde y cuándo estar.',
  stats: [
    { etiqueta: 'Citas agendadas', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Choques de hora', valor: '0', acento: '#22d3ee' },
    { etiqueta: 'Asistentes confirmados', valor: '100%', acento: '#34d399' },
  ],
  letrero: 'Sincronización de Agenda Semanal',
  fichas: [
    {
      key: 'mensajes-sueltos',
      tag: 'El problema',
      numero: 1,
      titulo: 'Los mensajes sueltos se pierden',
      detalle:
        'Cuando coordinas un proyecto en equipo, la bandeja de entrada no basta. Para organizar reuniones y entregas sin depender de mensajes sueltos se usa el **calendario digital**: una agenda viva y sincronizada que conecta los horarios de varias personas en tiempo real.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'crear-cita',
      tag: 'Crear una cita',
      numero: 2,
      titulo: 'Título, hora e invitados',
      detalle:
        'Crear una cita implica definir un título claro, la fecha, la hora de inicio y fin, y el lugar. Cuando agregas **asistentes**, el sistema les manda una invitación que se refleja en su propio calendario en cuanto la aceptan.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'solapamiento',
      tag: 'El choque',
      numero: 3,
      titulo: 'Dos eventos, la misma hora',
      detalle:
        'El mayor peligro de una agenda es el **solapamiento**: dos actividades distintas a la misma hora para la misma persona. La **vista semanal** es la herramienta clave para detectar estos choques de un vistazo, antes de que se conviertan en un problema real.',
      acento: { c: '#f5a524', deep: '#9a5b0a' },
    },
    {
      key: 'reagendar',
      tag: 'La solución',
      numero: 4,
      titulo: 'Reagendar con un par de clics',
      detalle:
        'No hace falta arrastrar nada: se abre la cita en conflicto, se elige una nueva hora en el selector y se confirma. Reagendar a tiempo evita inasistencias y descoordinación en todo el equipo.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Calendario',
  ctaDetalle:
    'La ventana se convierte en el calendario entero: arriba, el botón «+ Nueva Cita»; a la derecha, tu maestro con el encargo actual. Vas a agendar la demostración del robot, invitar al profesor, aceptar la invitación del jurado y —cuando las dos reuniones se crucen el mismo miércoles— resolver el choque eligiendo una nueva hora en un selector y confirmando. Todo a clics: nada que arrastrar.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
