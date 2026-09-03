'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, ConfigEntradaN5, RUTA_N5_MI_HUELLA_DIGITAL } from './EntradaN5Base';
import { LabDocumentosCompartidos } from './LabDocumentosCompartidos';

/**
 * Entrada de N5·«Mi huella digital», parada 3 y ÚLTIMA: «Documentos
 * compartidos» (currículo, unidad `n5-mi-huella-digital`). Nivel 5 = 5.º de
 * Primaria, 10–11 años, verificado en `src/data/curriculo.ts`.
 *
 * Clase **prestada al bloque Office** (`office: { app: 'm365', grado:
 * 'intermedio' }`): además de su unidad aparece en la sala de Microsoft 365 del
 * Edificio de Oficinas, así que se lee al lado de clases de ofimática. Se
 * registra igual en el `registry.ts` normal: las prestadas viven en su unidad y
 * sólo las exclusivas `of-` van en `registroOffice.ts`.
 *
 * No repite a sus dos hermanas y cierra el arco de la unidad:
 *  · parada 1 enseñó el TIEMPO (borrar quita tu copia, no la de los demás),
 *  · parada 2 enseñó la SUMA (piezas sueltas dibujan un retrato),
 *  · ésta enseña la LLAVE: de quién es el archivo cuando ya no es sólo tuyo.
 * Por eso las cuatro fichas hablan de llaves y de un solo archivo, nunca de
 * copias ni de retratos.
 *
 * SIN 3D a propósito: lo que abre el alumno es un programa —Tecnia Nube, el
 * armazón `simuladores/nube/` de verdad—, y el software se simula en DOM plano.
 *
 * VIDEO: publicado el 2-sep-2026 (`video-explicativo.mp4`, 33 escenas, la voz
 * nueva de la plataforma), así que la bandera quedó en `false`. Lo que había
 * escrito aquí —que el video no existía y la campaña seguía pausada— dejó de
 * ser cierto ese día; se corrige el hecho, no se borra el rastro.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-documentos-compartidos',
  laboratorio: LabDocumentosCompartidos,
  ruta: RUTA_N5_MI_HUELLA_DIGITAL,
  parada: 3,
  globo:
    'Tu cartel de la Feria de Ciencias lo van a hacer entre varios. Vas a ver qué pasa de verdad cuando un archivo deja de ser sólo tuyo.',
  arranqueSub:
    'Cuando compartes en la nube **no mandas una copia: das una llave.** Hay un solo cartel, y lo que el otro escribe —o borra— pasa en el tuyo. Vas a dar llaves, chocar con un compañero, recuperar un bloque perdido y apagar un enlace que se fue de paseo.',
  stats: [
    { etiqueta: 'Permisos', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Personas', valor: '4', acento: '#a78bfa' },
    { etiqueta: 'Carteles', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Compartir no es mandar una copia',
  fichas: [
    {
      key: 'la-llave',
      tag: 'La idea entera',
      numero: 1,
      titulo: 'Es una llave, no una copia',
      detalle:
        'No sale un archivo de tu compu y llega otro a la suya. **Hay uno solo**, y le abriste la puerta. Por eso lo que él escribe, aparece aquí.',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'el-tamano',
      tag: 'Qué es un permiso',
      numero: 2,
      titulo: 'La llave tiene tamaños',
      detalle:
        'Ver, comentar o **editar**. Quien va a escribir necesita la grande; quien sólo va a mirar, con la chica le sobra. Una llave grande permite accidentes que una chica no.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'la-red',
      tag: 'Cuando algo sale mal',
      numero: 3,
      titulo: 'El historial es la red',
      detalle:
        'Si alguien borra un pedazo sin querer, **se borra para todos** — pero la nube guardó cada versión, con quién y cuándo. Volver atrás no quita nada.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'recoger',
      tag: 'La otra mitad',
      numero: 4,
      titulo: 'Quitar la llave también es tu trabajo',
      detalle:
        'Un enlace lo tiene **quien lo tenga**, porque los enlaces se reenvían. Se revoca y ya no abre… aunque a quien alcanzó a entrar no se le borra lo que vio.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Nube',
  ctaDetalle:
    'Seis encargos con un solo cartel: **da las llaves, chócate con un compañero, recupera lo que se borró y recoge las llaves al final.** Nadie es el malo, y todo se arregla.',
  assetsPendientes: false,
};

export function EntradaDocumentosCompartidos(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaDocumentosCompartidos;
