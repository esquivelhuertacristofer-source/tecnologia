'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabMarcaPersonal } from './LabMarcaPersonal';

/**
 * Entrada de `n9-marca-personal` — N9 · «Emprendimiento e identidad digital»,
 * parada 1 de 3. Nivel 9 = 3.º de Secundaria, 14–15 años.
 *
 * Misma plantilla de oro que sus hermanas de N9 (`EntradaTrabajoColaborativo`,
 * `EntradaGestionaTuProyecto`: `EntradaN4Base`, agnóstica de nivel pese al
 * nombre) y la misma forma de derivar la ruta: directo de
 * `getUnidad('n9-emprendimiento-e-identidad')`, nunca a mano — así las tres
 * paradas de la unidad quedan siempre en el orden que declara `curriculo.ts`,
 * sin un archivo de rutas nuevo que mantener ni que otro proceso pueda pisar.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-marca-personal/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const RUTA_N9: PasoRuta[] = (getUnidad('n9-emprendimiento-e-identidad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-marca-personal';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabMarcaPersonal,
  ruta: RUTA_N9,
  parada: Math.max(1, RUTA_N9.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Bruno quiere entrar este verano a Semilla Tech, un programa de tecnología para adolescentes, y piden un portafolio en línea. Ya sabe escribir HTML y CSS de verdad — lo que le falta es criterio: qué de todo lo que ya tiene escrito para sus redes le sirve aquí, y qué no.',
  arranqueSub:
    'Vas a construir un portafolio de cinco piezas —encabezado, presentación, proyectos, habilidades y contacto— con código real, no una plantilla rellenada. Y en el camino vas a tomar **cuatro decisiones con casos reales**: la misma foto, el mismo comentario, el mismo enlace, juzgados no por si son peligrosos —eso ya lo sabes— sino por si le sirven a quien va a leer *esta* página en concreto.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#f472b6' },
    { etiqueta: 'Decisiones', valor: '4', acento: '#a78bfa' },
    { etiqueta: 'Secciones', valor: '5', acento: '#22d3ee' },
  ],
  letrero: 'El mismo dato, dos públicos distintos',
  fichas: [
    {
      key: 'mismo-dato-dos-publicos',
      tag: 'La idea entera',
      numero: 1,
      titulo: 'No es peligroso: está en el sitio equivocado',
      detalle:
        'La foto de la alberca con tus amigos no tiene nada de malo — es perfecta para tu cuenta personal. En un portafolio profesional falla por otra razón: **no contesta la pregunta que esa página está haciendo.**',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'coherente-no-escondido',
      tag: 'Lo que no es',
      numero: 2,
      titulo: 'Coherente no es lo mismo que escondido',
      detalle:
        'No se trata de borrar tu vida fuera de la escuela ni de fingir que no existe. Se trata de **elegir qué puerta le abres a quién** — tu cuenta de memes sigue ahí, nada más no es la que enlazas en el portafolio.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-marca-tambien-se-ve',
      tag: 'Hecho CSS',
      numero: 3,
      titulo: 'Un acento repetido también es coherencia',
      detalle:
        'Vas a darle el mismo color de borde a las cinco piezas de tu portafolio. No es decoración: es **la misma idea de coherencia, escrita en una hoja de estilos.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'tu-portafolio-es-tuyo',
      tag: 'La otra mitad',
      numero: 4,
      titulo: 'Nadie te dicta una fórmula de bio perfecta',
      detalle:
        'La única regla de lo que escribas de ti mismo es que **sea cierto.** Ni el chat privado con tus amigos ni el anuncio genérico que podría firmar cualquiera: lo que suena a ti.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre tu portafolio en Tecnia Web',
  ctaDetalle:
    'Construye las cinco piezas del portafolio de Bruno con HTML y CSS real, y en cuatro momentos decide entre lo que ya tiene escrito para sus redes y lo que de verdad le sirve a quien va a evaluarlo. Cierra dándole a todo el sitio un mismo acento de marca.',
  assetsPendientes: false,
};

export function EntradaMarcaPersonal(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaMarcaPersonal;
