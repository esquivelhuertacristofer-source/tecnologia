'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN7SituacionBase, ConfigEntradaN7Situacion, RUTA_N7_CIUDADANIA_DIGITAL_CRITICA } from './EntradaN7SituacionBase';
import { LabEquilibrioDigital } from './LabEquilibrioDigital';

/**
 * Entrada de N7·«Ciudadanía digital crítica», parada 3 y última «Equilibrio
 * digital» (currículo, unidad `n7-ciudadania-digital-critica`). Nivel 7 =
 * 1.º de Secundaria, 12–13 años (verificado en `src/data/curriculo.ts:697`
 * y `:775`).
 *
 * Cierra la unidad que abrió `n7-privacidad-en-redes` (auditar el perfil) y
 * que seguirá `n7-riesgos-y-marco-legal` (todavía `planeada`, fuera de
 * alcance). Aquí el tema no es qué se publica sino **cuándo se atiende**:
 * el alumno decide, aviso por aviso, qué puede esperar y qué no — nunca
 * "usa menos el celular", que es justo el sermón que el canon pide evitar
 * (`feedback-sin-xp-estrellas-insignias.md` / la regla repetida de esta
 * unidad de "no es tu culpa").
 *
 * No reutiliza `simuladores/muro/`: el programa que el alumno abre aquí no
 * es un muro social, es el centro de avisos del teléfono — "Tecnia Avisos"
 * — construido local a esta clase porque ningún armazón de la casa modela
 * hoy notificaciones/tiempo de atención y sólo esta clase lo necesita
 * (regla de la casa: "no inventes capacidades que nadie pide" — si una
 * segunda clase llegara a necesitarlo, ahí sí pasaría a ser un armazón
 * compartido, no antes).
 */

const CONFIG: ConfigEntradaN7Situacion = {
  actividadId: 'n7-equilibrio-digital',
  laboratorio: LabEquilibrioDigital,
  ruta: RUTA_N7_CIUDADANIA_DIGITAL_CRITICA,
  parada: 3,
  globo:
    'Tu teléfono no va a dejar de sonar nunca — ni debería. La pregunta no es cuánto lo usas, es si sabes elegir cuándo un aviso puede esperar y cuándo no. Eso es el equilibrio digital, y hoy lo vas a practicar aviso por aviso.',
  arranqueSub:
    'Es viernes en la noche. Tienes tarea pendiente y el teléfono suena cada pocos minutos: vas a decidir, aviso por aviso, qué puede esperar y qué no.',
  stats: [
    { etiqueta: 'Avisos a decidir', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Trampa de atención', valor: '1', acento: '#f87171' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de que suene el teléfono',
  fichas: [
    {
      key: 'no-es-apagar-todo',
      tag: 'El concepto clave',
      numero: 1,
      titulo: 'Equilibrio no es apagar todo',
      detalle:
        'No se trata de usar menos el celular a fuerzas. Se trata de **elegir cuándo** revisarlo y cuándo dejarlo sonar sin culpa.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'costo-de-cambiar',
      tag: 'Lo que cuesta de verdad',
      numero: 2,
      titulo: 'Cambiar de tarea tiene un precio',
      detalle:
        'Un aviso dura un segundo, pero **volver a concentrarte** en lo que dejaste puede tardar varios minutos. Ese costo no se ve, pero es real.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'urgencia-fabricada',
      tag: 'La trampa que hay que ver',
      numero: 3,
      titulo: 'No toda urgencia es urgencia de verdad',
      detalle:
        'Un "cofre por tiempo limitado" está diseñado para que **sientas prisa** aunque no exista ningún límite real. Reconocerlo es una habilidad.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'silenciar-no-es-desconectar',
      tag: 'Lo que sí importa',
      numero: 4,
      titulo: 'Silenciar no es lo mismo que desconectarte',
      detalle:
        'Puedes bajarle el volumen a lo que puede esperar y **dejar sonando** lo que de verdad importa — como tu familia.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Avisos',
  ctaDetalle: 'Viernes en la noche, tarea pendiente y el teléfono sonando. Decide, aviso por aviso, qué puede esperar.',
  assetsPendientes: false,
};

export function EntradaEquilibrioDigital(props: ActivityProps) {
  return <EntradaN7SituacionBase {...props} entrada={CONFIG} />;
}

export default EntradaEquilibrioDigital;
