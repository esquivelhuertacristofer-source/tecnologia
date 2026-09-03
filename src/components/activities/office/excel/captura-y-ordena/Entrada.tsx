'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabCapturaYOrdena } from './Lab';

/**
 * Entrada de `n5-captura-y-ordena` — la **segunda parada** de N5 · U2 «Hoja de
 * cálculo I».
 *
 * ── LA RUTA SE DERIVA ───────────────────────────────────────────────────────
 *
 * Sale de la unidad del currículo, igual que la de la clase 1 y por lo que se
 * escribió allí: en la sala de PowerPoint cinco entradas acabaron mintiendo por
 * llevar la ruta escrita a mano (§44.6). Aquí se ve funcionando por primera vez
 * — al dar de alta esta clase en `curriculo.ts`, la tira de la clase 1 la
 * enseñó sin que nadie tocara su archivo.
 *
 * Se listan las cuatro paradas de la unidad, no sólo las construidas: una ruta
 * de unidad es un plan de trabajo y el alumno tiene que ver que después de ésta
 * vienen dos más.
 */

const RUTA_N5U2: PasoRuta[] = (getUnidad('n5-hoja-de-calculo-1')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-captura-y-ordena',
  laboratorio: LabCapturaYOrdena,
  ruta: RUTA_N5U2,
  parada: 2,
  globo: 'Doce renglones, y vas a teclear tres cosas. Te enseño a arrastrar.',
  arranqueSub:
    'Es el mismo archivo de la clase pasada, una semana después. La tesorera ya cuadró lo que costó la salida a Teotihuacán y ahora lleva la lista de quién ya entregó su cuota de 320 pesos — y la lleva a medias: falta una alumna, hay un apunte de más, los folios de los recibos están tecleados en la columna equivocada y la hoja se sigue llamando «Hoja3». Hoy no vas a teclear doce veces lo mismo: vas a arrastrar el cuadrito de la esquina y llenar doce celdas de un tirón, a mover lo que está mal puesto sin volver a escribirlo, a pegar sólo la pinta de una celda o sólo el resultado, y a dejar la lista ordenada de la A a la Z sin que nadie se quede con el pago de otro.',
  stats: [
    { etiqueta: 'Alumnos', valor: '12', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '12', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Llena la lista sin teclear de más',
  fichas: [
    {
      key: 'el-cuadrito',
      tag: 'El cuadrito',
      numero: 1,
      titulo: 'Escribes dos y salen doce',
      detalle:
        'En la esquina de abajo a la derecha de lo que tienes marcado hay un cuadradito verde. Se agarra y se arrastra, y la hoja continúa lo que ya estaba: escribe 101 y 102 y salen 103, 104, 105. Con enero salen febrero y marzo. Es la herramienta que más tiempo ahorra de todo Excel.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'copia-o-cuenta',
      tag: 'La regla',
      numero: 2,
      titulo: 'Con uno copia, con dos cuenta',
      detalle:
        'Si arrastras una celda sola con un 320, salen doce 320. Y está bien que no adivine: con un solo dato no hay manera de saber si querías 321, 322, 323 o el mismo doce veces. En cuanto escribes el segundo, la hoja ya sabe de cuánto en cuánto vas.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'cortar-no-mueve',
      tag: 'Mover',
      numero: 3,
      titulo: 'Cortar no mueve: mueve Pegar',
      detalle:
        'Al cortar no desaparece nada todavía: lo marcado se queda con una raya punteada esperando. El que lo muda es Pegar, y por eso entre uno y otro puedes cambiar de idea. Copiar deja el original donde estaba; cortar se lo lleva cuando sueltas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-tabla-entera',
      tag: 'Ordenar',
      numero: 4,
      titulo: 'Se marca la tabla ENTERA',
      detalle:
        'Ordenar sólo la columna de los nombres es el desastre clásico de las oficinas: los nombres se acomodan de la A a la Z y las cantidades se quedan quietas, así que cada quien acaba con el pago de otro. Y nadie se entera hasta que alguien reclama. Se marca todo y se ordena por la primera columna.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la lista de los pagos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» donde lo dejaste, con la hoja de los pagos delante. Doce encargos. El cuadrito de relleno está en la esquina de lo que marques; copiar, cortar y pegar están en Inicio → Portapapeles y también en Ctrl+C, Ctrl+X y Ctrl+V; a la hoja se le cambia el nombre con doble clic en su lengüeta y se mueve arrastrándola. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaCapturaYOrdena(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaCapturaYOrdena;

export default EntradaCapturaYOrdena;
