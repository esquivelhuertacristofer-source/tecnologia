'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, ConfigEntradaN5, RUTA_N5_MI_HUELLA_DIGITAL } from './EntradaN5Base';
import { LabMiIdentidadDigital } from './LabMiIdentidadDigital';

/**
 * Entrada de N5·«Mi huella digital», parada 2 «Mi identidad digital»
 * (currículo, unidad `n5-mi-huella-digital`). Nivel 5 = 5.º de Primaria,
 * 10–11 años, verificado en `src/data/curriculo.ts`.
 *
 * Va DESPUÉS de `n5-lo-que-publico-permanece` y no repite nada suyo: aquella
 * enseñó el tiempo (borrar quita tu copia, no las de los demás); ésta enseña
 * la suma (cinco publicaciones sin nada de malo dejan cinco piezas, y con dos
 * piezas se deduce algo que nadie escribió). Por eso las cuatro fichas hablan
 * de juntar, nunca de borrar.
 *
 * SIN 3D a propósito: el alumno abre un programa —Tecnia Muro, el armazón
 * `simuladores/muro/` de verdad, con `perfilDe` y el campo `pistas`—, y el
 * software se simula en DOM plano.
 *
 * VIDEO: existe desde el 2-sep-2026 (`video-explicativo.mp4`, 33 escenas, la
 * voz nueva de la plataforma), así que esta entrada **no** lleva
 * `assetsPendientes`. La frase que había aquí decía que el video no existía y
 * la campaña estaba pausada: las dos cosas dejaron de ser ciertas.
 *
 * Y lleva escarmiento. Esa misma frase nombraba la bandera, y
 * `publicar-videos-guion.mjs` cambiaba la **primera** aparición del texto en el
 * archivo — es decir, la del comentario — dejando la del `CONFIG` intacta: el
 * video publicado y el alumno viendo «se está grabando». Si vuelves a escribir
 * el nombre de la bandera en un comentario, que sea sabiendo esto.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-mi-identidad-digital',
  laboratorio: LabMiIdentidadDigital,
  ruta: RUTA_N5_MI_HUELLA_DIGITAL,
  parada: 2,
  globo:
    'Vas a publicar la semana de Xime: cinco cosas normales, sin nada de malo. Y luego vas a ver qué se puede armar con ellas.',
  arranqueSub:
    'Un torneo, un perro, un cumpleaños, una mochila, la natación de los martes. **Ninguna es peligrosa.** Juntas, sí dicen dónde encontrarla. Vas a armar tú ese retrato — y después vas a elegir el tuyo.',
  stats: [
    { etiqueta: 'Publicaciones', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Piezas sueltas', valor: '5', acento: '#a78bfa' },
    { etiqueta: 'Retrato', valor: '3', acento: '#fbbf24' },
  ],
  letrero: 'Lo que se arma con lo que dejas suelto',
  fichas: [
    {
      key: 'la-suma',
      tag: 'La idea entera',
      numero: 1,
      titulo: 'El riesgo está en la suma',
      detalle:
        'Ninguna de tus fotos es peligrosa ella sola. **El retrato se arma juntándolas** — y para eso no hace falta que nadie sea malo, basta con que estén abiertas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-pieza',
      tag: 'Qué es una pieza',
      numero: 2,
      titulo: 'Lo que se cuela sin querer',
      detalle:
        'El escudo del uniforme. El letrero que se lee al fondo. La hora de siempre. **Eso es una pieza:** un detallito que no escribiste y que ahí quedó.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-sorpresa',
      tag: 'La sorpresa',
      numero: 3,
      titulo: 'La que más revela no es la más secreta',
      detalle:
        'Es **la que aparece en más lugares.** Vas a tapar una sola pieza y a ver cuántos renglones del retrato se caen. El resultado no es el que esperas.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tu-mandas',
      tag: 'La otra mitad',
      numero: 4,
      titulo: 'Tú eliges qué cara enseñas',
      detalle:
        'Un perfil es una elección, **no un formulario que haya que llenar entero.** Un cuadro vacío no es un cuadro sin terminar: es un cuadro que decidiste tú.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle:
    'Publica cinco cosas normales, mira el perfil como lo ve alguien que no te conoce y **junta las piezas tú mismo.** Después armas tu propio perfil, cuadro por cuadro, y decides qué se ve.',
};

export function EntradaMiIdentidadDigital(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaMiIdentidadDigital;
