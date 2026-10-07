'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabListasYDiccionarios } from './LabListasYDiccionarios';
import { RUTA_N8_PYTHON_2 } from './rutaN8Python2';

/**
 * Entrada de N8 · U «Programación en texto II» (n8-python-2) · parada 1
 * «Listas y diccionarios».
 *
 * Viene de `n7-bucles-python` (última parada construida de N7 · U2), así que
 * las fichas dan por sabido `for`, `while` y que un error se lee, no se
 * evita — y no lo repiten. Registro de secundaria (§30.4): término técnico
 * correcto con su traducción al lado, se explica el porqué y no sólo el
 * qué, refuerzo informativo. Cada cadena está escrita para esta clase.
 *
 * Reescrita con la clase el 6-oct-2026 (§69.20): las fichas ya no anuncian
 * diez encargos dictados sino cinco problemas que un juez prueba cambiando la
 * mochila y el inventario. La ficha «Una lista es una referencia» salió de
 * aquí: no tiene encargo, y el plan docente la hace en el pizarrón al cierre
 * (`otra = mochila`), que es donde se entiende.
 *
 * El video se grabó y se publicó el 2-sep-2026:
 * `public/assets/actividades/n8-listas-y-diccionarios/video-explicativo.mp4`
 * ya existe y `assetsPendientes` bajó a `false`, así que la entrada enseña el
 * cubrepantalla primero y el reproductor después. OJO si escribes pruebas:
 * con el video puesto, el primer `<button>` del documento ya no es el CTA
 * sino el de la portada, así que no lo busques por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-listas-y-diccionarios',
  laboratorio: LabListasYDiccionarios,
  ruta: RUTA_N8_PYTHON_2,
  parada: 1,
  globo:
    'Hasta ahora cada dato tuyo vivía solo, en su propia variable. Las listas y los diccionarios guardan varios datos juntos, en una sola caja — y hoy vas a usar los dos.',
  arranqueSub:
    'Abres **mochila.py** y escribes cinco programas con listas y diccionarios. Un juez los prueba con **mochilas e inventarios que no ves**: una cosa, cinco, ninguna, un producto en cero.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Problemas con juez', valor: '5', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos formas de guardar varios datos',
  fichas: [
    {
      key: 'lista',
      tag: 'Datos en orden, por posición',
      numero: 1,
      titulo: 'Listas',
      detalle:
        'Una lista guarda varios datos en una sola caja, en el orden en que los escribiste. Las posiciones empiezan en 0, no en 1, y también se pueden contar desde el final: así se pide la última sin saber cuántas hay.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'diccionario',
      tag: 'Datos por nombre, no por número',
      numero: 2,
      titulo: 'Diccionarios',
      detalle:
        'Un diccionario (`dict`) guarda cada dato bajo una CLAVE, no bajo una posición: el inventario de la cooperativa sabe cuántos lápices hay sin que importe en qué orden se apuntaron. Antes de pedir una clave, se pregunta si existe.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'error-real',
      tag: 'Se lee, no se evita',
      numero: 3,
      titulo: 'IndexError y KeyError',
      detalle:
        'Pedir una posición o una clave que no existe **no rompe el editor**: te dice qué pediste. Hoy vas a pedir una casilla que no existe a propósito y La Mochila te va a enseñar cuáles sí.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'juez',
      tag: 'Tu mochila no es la del juez',
      numero: 4,
      titulo: 'El juez cambia los datos',
      detalle:
        'Arriba de cada celda está la lista o el diccionario del ejemplo. El juez la cambia en cada caso, así que escribir «regla» a mano o pedir la casilla 2 por «la última» funciona con tu mochila y con la suya no.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Siete encargos: lo primero y lo último de la mochila, la casilla que no existe, el pedido nuevo, lo que cuesta, ¿lo tenemos? y los agotados — **cinco programas que un juez prueba con datos que no ves** — y una pregunta para cerrar.',
  assetsPendientes: false,
};

export function EntradaListasYDiccionarios(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaListasYDiccionarios;
