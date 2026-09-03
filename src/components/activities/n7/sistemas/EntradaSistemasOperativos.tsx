'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN7Unidad1Base, type ConfigEntradaN7Unidad1 } from '../bahia/EntradaN7Unidad1Base';
import { LabSistemasOperativos } from './LabSistemasOperativos';

/**
 * Entrada de `n7-sistemas-operativos` — N7·U1 «Arquitectura y sistemas»,
 * **parada 3 de 4**. Temario propio en `DOC-N7-n7-sistemas-operativos.md`.
 *
 * Edad de referencia del tono: **12–13 años** (N7, 1.º de Secundaria), leída en
 * `curriculo.ts`, no en el encargo.
 *
 * Cada cadena de esta configuración está escrita para ESTA clase —globo,
 * arranque, stats, letrero, las cuatro fichas y el CTA—: un port que sólo
 * cambia el import deja las entradas mintiendo, y aquí no hay ninguna heredada.
 * Las cuatro fichas cubren los cuatro tramos de la clase (qué hace el sistema,
 * la frontera con las aplicaciones, las cuatro puertas, el equipo desconocido),
 * así que su chapa es su ordinal y no llevan `numero` a mano.
 *
 * Las fichas declaran `img` porque `ConfigEntradaN7Unidad1` lo exige; los
 * archivos todavía no están generados y quedan anotados como deuda de assets en
 * el temario de la clase (§2), igual que en las otras tres paradas de esta
 * unidad. El video sí se grabó y se publicó el 2-sep-2026, así que la bandera
 * `assetsPendientes` que se había puesto en `true` el 1-sep bajó a `false` y la
 * entrada vuelve a enseñar el cubrepantalla y el reproductor. OJO si escribes
 * pruebas: con el video puesto, el primer `<button>` del documento ya no es el
 * CTA sino el de la portada — búscalo por su texto, no por posición.
 */

const CONFIG: ConfigEntradaN7Unidad1 = {
  actividadId: 'n7-sistemas-operativos',
  laboratorio: LabSistemasOperativos,
  parada: 3,
  globo: 'El equipo ya está armado. Sin sistema operativo no arranca, y no hay uno solo: hay varios, y todos hacen lo mismo.',
  arranqueSub:
    'Entra al Banco de Sistemas: descubre los cinco oficios del sistema operativo y haz la misma tarea en cuatro sistemas distintos, para terminar en uno que nadie te enseñó.',
  stats: [
    { etiqueta: 'Oficios', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Sistemas', valor: '5', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El Banco de Sistemas',
  fichas: [
    {
      key: 'reparte',
      tag: 'Acto 1',
      titulo: 'El que reparte la máquina',
      detalle:
        'Es el primer programa que arranca. Reparte la RAM, da turnos al CPU, guarda tus archivos, habla con la impresora y decide qué puede hacer cada cuenta.',
      img: 'ficha-reparte.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'frontera',
      tag: 'Acto 1',
      titulo: 'Sistema o aplicación',
      detalle:
        'El sistema administra la máquina; la aplicación hace una tarea concreta. Recortar una foto es de ella; prestarle la memoria para hacerlo es de él.',
      img: 'ficha-frontera.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'puertas',
      tag: 'Acto 2',
      titulo: 'Cuatro puertas, un cuarto',
      detalle:
        'Windows abre los programas desde Inicio, Linux escribiendo en el buscador, Android desde el cajón y iOS buscando. Cambia la puerta, no lo que hay detrás.',
      img: 'ficha-puertas.webp',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'desconocido',
      tag: 'Acto 3',
      titulo: 'El equipo que no conoces',
      detalle:
        'Al final te sientas frente a un sistema que nadie te enseñó, con las barras en otro sitio y otros nombres. Si entendiste la idea, no necesitas ayuda.',
      img: 'ficha-desconocido.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Reparte seis encargos entre los cinco oficios del sistema y haz la misma tarea en cinco sistemas distintos.',
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n7-sistemas-operativos/video-explicativo.mp4`. `EntradaN7Unidad1Base`
   * SÍ admite esta bandera desde la parada 2 —el comentario de cabecera que
   * decía lo contrario se quedó viejo—, y sin declararla llega `undefined`, que
   * es falsy: el `<video>` se pintaba igual y pedía un archivo inexistente. El
   * alumno veía un reproductor muerto en vez del aviso de video pendiente.
   * Cuando el video exista, esto se quita en el mismo commit que lo publica.
   */
  assetsPendientes: false,
};

export function EntradaSistemasOperativos(props: ActivityProps) {
  return <EntradaN7Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaSistemasOperativos;
