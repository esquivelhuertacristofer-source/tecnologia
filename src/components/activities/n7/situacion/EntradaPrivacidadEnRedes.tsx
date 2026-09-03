'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN7SituacionBase, ConfigEntradaN7Situacion, RUTA_N7_CIUDADANIA_DIGITAL_CRITICA } from './EntradaN7SituacionBase';
import { LabPrivacidadEnRedes } from './LabPrivacidadEnRedes';

/**
 * Entrada de N7·«Ciudadanía digital crítica», parada 1 «Privacidad en
 * redes» (currículo, unidad `n7-ciudadania-digital-critica`; canon del
 * documento la nombra «La Sala de Situación», §30). Nivel 7 = 1.º de
 * Secundaria, 12–13 años: un peldaño más analítico que N6 — aquí no se trata
 * de reaccionar a algo que YA pasó, sino de auditar el propio perfil ANTES.
 *
 * Tercera y última de las tres clases de esta tanda sobre
 * `simuladores/muro/`; se construyó al final porque usa la pieza más
 * elaborada del armazón — `perfilDe()` y sus `pistas` — que las dos
 * anteriores no necesitaban.
 */

const CONFIG: ConfigEntradaN7Situacion = {
  actividadId: 'n7-privacidad-en-redes',
  laboratorio: LabPrivacidadEnRedes,
  ruta: RUTA_N7_CIUDADANIA_DIGITAL_CRITICA,
  parada: 1,
  globo:
    'Cada publicación tuya que sigue pública deja una pista suelta. Junta suficientes pistas y cualquiera arma un mapa de tu vida sin que tú se lo hayas contado directo. Vamos a auditar tu perfil.',
  arranqueSub:
    'Tu perfil ya tiene publicaciones de hace meses. Vas a revisarlas una por una: cuáles se quedan, cuáles cambian de audiencia y cuáles ya no deberían estar ahí.',
  stats: [
    { etiqueta: 'Publicaciones a auditar', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Pistas que sueltan', valor: '3', acento: '#f87171' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de auditar',
  fichas: [
    {
      key: 'pista',
      tag: 'El concepto clave',
      numero: 1,
      titulo: 'Una pista no es todo el dato',
      detalle:
        'Nadie publica su dirección completa de golpe. **Publica pedazos** —el nombre de la escuela, el de la mascota, la hora en que llega sola a casa— y quien junta suficientes, arma el resto.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'audita',
      tag: 'La herramienta',
      numero: 2,
      titulo: 'Auditar es mirar tu perfil como un desconocido',
      detalle: 'No como tú lo ves —tú sabes qué es broma y qué no—. **Como lo vería alguien que nunca te ha visto.**',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'no-es-magia',
      tag: 'Lo que sí logra',
      numero: 3,
      titulo: 'Auditar tarde sigue sirviendo',
      detalle: 'No borra lo que alguien ya vio. **Pero sí evita que lo vea alguien más, a partir de ahora.** No es magia, pero tampoco es inútil.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'no-todo-se-esconde',
      tag: 'El equilibrio',
      numero: 4,
      titulo: 'No todo tiene que ser privado',
      detalle: 'Ganaste un concurso, hiciste algo bien: eso puede seguir público. **La auditoría no es esconderse — es elegir qué sí y qué no.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle: 'Revisa tus tres publicaciones más reveladoras y decide, una por una, qué hacer con cada una.',
  assetsPendientes: false,
};

export function EntradaPrivacidadEnRedes(props: ActivityProps) {
  return <EntradaN7SituacionBase {...props} entrada={CONFIG} />;
}

export default EntradaPrivacidadEnRedes;
