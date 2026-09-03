'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, RUTA_N4U6 } from './EntradaN4Base';
import { LabAtrapaElPhishing } from './LabAtrapaElPhishing';

/**
 * Entrada de N4·U6 parada 2 «Atrapa el phishing».
 *
 * ── LA RUTA, DE UNA SOLA FUENTE ─────────────────────────────────────────────
 *
 * Esta entrada nació derivando su ruta del currículo con `getUnidad`, que es lo
 * que hacen las clases de Excel desde §45 y es mejor idea. Se cambió a la
 * constante compartida `RUTA_N4U6` al ver que las otras dos paradas de la
 * unidad —`n4-virus-y-antivirus` y `n4-si-algo-me-incomoda`— ya la usaban: tres
 * hermanas que pintan la MISMA tira con dos fuentes distintas es el defecto de
 * §44.6 partido en dos, y el día que la unidad crezca una diría cuatro paradas
 * y las otras dos tres. Si algún día se deriva, se deriva en la base y para las
 * tres a la vez.
 *
 * Las cuatro fichas son las cuatro lupas del laboratorio, en el mismo orden en
 * que el programa las pone en la barra, y la cuarta —«qué te piden»— es la que
 * se lee justo antes del CTA porque es la única que nunca falla.
 *
 * ── EL TONO ES DE 4º DE PRIMARIA ────────────────────────────────────────────
 *
 * Nivel 4 son nueve y diez años (`curriculo.ts`: «4° de Primaria», «9–10»), no
 * secundaria. Por eso los ejemplos son las monedas de un juego, una tablet de
 * regalo y las calificaciones, y no hay ni un banco ni una tarjeta en toda la
 * clase. Frases cortas y palabras que ya usan.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-atrapa-el-phishing',
  laboratorio: LabAtrapaElPhishing,
  ruta: RUTA_N4U6,
  parada: 2,
  globo:
    'Hoy la bandeja de Sofi trae diez correos y cinco son trampas. Te presto las cuatro lupas para mirarlos.',
  arranqueSub:
    'Sofi tiene diez correos sin abrir. Cinco son de verdad y cinco son **anzuelos**: correos con trampa, escritos para que sueltes algo tuyo. Y no se notan a simple vista. La maestra escribe con muchas faltas y es de verdad. La biblioteca te manda a una página y es de verdad. Y hay uno **sin una sola falta, con el escudo de la escuela y sin ninguna prisa** que es mentira. Antes de decidir puedes mirar cuatro cosas: **quién escribe de verdad**, **a dónde va el enlace**, **qué te piden** y **con qué prisa te lo piden**.',
  stats: [
    { etiqueta: 'Correos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Lupas', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las cuatro lupas',
  fichas: [
    {
      key: 'remitente',
      tag: 'Lupa 1',
      numero: 1,
      titulo: 'Quién escribe de verdad',
      detalle:
        'El nombre grande de arriba lo escribe el que manda el correo: ahí pone lo que quiere. Debajo está la dirección, y ésa no se puede inventar. **Cualquiera puede firmar «Dirección de la escuela».**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'enlaces',
      tag: 'Lupa 2',
      numero: 2,
      titulo: 'A dónde va el enlace',
      detalle:
        'Un enlace tiene dos cosas: lo que dice y a dónde va. **No siempre son lo mismo.** Uno puede decir el nombre de tu juego y llevarte a otro lado. Se mira antes de pulsar, nunca después.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'prisa',
      tag: 'Lupa 3',
      numero: 3,
      titulo: 'Con qué prisa',
      detalle:
        '«Sólo hoy», «contesta ya», «o lo pierdes». La prisa está para que no pienses. Pero **la prisa sola no delata a nadie**: un amigo con un problema también corre.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'piden',
      tag: 'Lupa 4 · la que nunca falla',
      numero: 4,
      titulo: 'Qué te piden',
      detalle:
        'Ésta es la buena. **Nadie te pide tu contraseña por correo: ni tu escuela, ni un juego, ni nadie. Nunca.** Ni para darte monedas, ni para enseñarte tus calificaciones. Si te la piden, es mentira aunque esté todo perfecto.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la bandeja de Sofi',
  ctaDetalle:
    'Enciende el monitor y entra a Tecnia Correo. Diez correos, uno por uno, con las cuatro lupas a la mano. Equivocarte no te deja fuera: el programa te enseña qué había que mirar y te deja arreglarlo. Y ojo con lo último: cuando cazas un anzuelo, **borrarlo no basta**. No se pulsa, no se contesta y se le avisa a un adulto.',
};

export function EntradaAtrapaElPhishing(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAtrapaElPhishing;
