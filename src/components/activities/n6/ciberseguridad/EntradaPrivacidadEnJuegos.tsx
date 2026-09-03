'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN6Base, ConfigEntradaN6, RUTA_N6_CIBERSEGURIDAD } from './EntradaN6Base';
import { LabPrivacidadEnJuegos } from './LabPrivacidadEnJuegos';

/**
 * Entrada de N6·«Ciberseguridad», parada 2 «Privacidad en redes y juegos»
 * (currículo, unidad `n6-ciberseguridad`). Nivel 6 = 6.º de Primaria, 11–12
 * años.
 *
 * Primera de las tres clases construidas sobre `simuladores/muro/` (armazón
 * cerrado el 15-ago-2026, sin clases todavía). Se eligió construirla PRIMERO
 * porque es la más simple de las tres: sólo pone en juego la decisión de
 * datos #1 del armazón (`visibilidad` como dato de primera clase), sin tocar
 * acciones sociales delicadas — sirve para probar que el cableo con
 * `useMuro`/`VentanaMuro` funciona antes de construir encima la clase que sí
 * es delicada (`n6-alto-al-ciberacoso`).
 */

const CONFIG: ConfigEntradaN6 = {
  actividadId: 'n6-privacidad-en-juegos',
  laboratorio: LabPrivacidadEnJuegos,
  ruta: RUTA_N6_CIBERSEGURIDAD,
  parada: 2,
  globo:
    'Te presto Tecnia Muro otra vez. Esta vez el tema es a QUIÉN le llega lo que publicas — porque "público" significa cualquiera, y "cualquiera" incluye gente que juega los mismos juegos que tú.',
  arranqueSub:
    'Tienes una publicación pública sobre tus horarios de juego. Vas a ver quién la puede leer, decidir quién debería verla de verdad, y practicar publicando con la audiencia correcta desde el principio.',
  stats: [
    { etiqueta: 'Niveles de visibilidad', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Publicación a revisar', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Los tres niveles de audiencia',
  fichas: [
    {
      key: 'publico',
      tag: 'Nivel 1',
      numero: 1,
      titulo: '🌐 Público: cualquiera',
      detalle:
        'Lo ve gente que no conoces, incluso gente que **busca justo ese tipo de dato** —como a qué hora juegas solo—. No hace falta que nadie sea mala persona para que eso sea un riesgo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'amigos',
      tag: 'Nivel 2',
      numero: 2,
      titulo: '👥 Sólo amigos: tu círculo real',
      detalle:
        'Sólo lo ven las personas que agregaste de verdad. **Sigue sin ser un candado perfecto** —un amigo puede reenviarlo—, pero ya no es cualquiera del planeta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'solo-yo',
      tag: 'Nivel 3',
      numero: 3,
      titulo: '🔒 Sólo yo: tu diario',
      detalle: 'Nadie más lo ve. Sirve para anotar cosas para ti, sin la presión de que alguien más las lea.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'antes-no-despues',
      tag: 'La que sí funciona',
      numero: 4,
      titulo: 'Elige la audiencia ANTES de publicar',
      detalle:
        'Cambiar la visibilidad después ayuda a que no lo vea gente nueva, **pero no borra a quien ya lo vio.** Por eso hoy también vas a practicar elegir bien desde el primer clic.',
      acento: { c: '#fb923c', deep: '#c2410c' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle:
    'Revisa quién puede ver tu publicación sobre tus horarios de juego, ajústala, y después practica publicando algo nuevo eligiendo la audiencia correcta **desde antes**.',
  assetsPendientes: false,
};

export function EntradaPrivacidadEnJuegos(props: ActivityProps) {
  return <EntradaN6Base {...props} entrada={CONFIG} />;
}

export default EntradaPrivacidadEnJuegos;
