'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabIpWifiServidores } from './LabIpWifiServidores';

/**
 * Entrada de `n8-ip-wifi-servidores` — N8 · «Redes y ciberseguridad»,
 * primera parada de la unidad. Nivel 8 = 2° de Secundaria, 13–14 años.
 *
 * La ruta se deriva de `getUnidad('n8-redes-y-ciberseguridad')`, no se
 * escribe a mano — mismo criterio que `n8-malware-e-ingenieria-social`.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n8-ip-wifi-servidores/video-explicativo.mp4` y
 * la bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el de
 * la portada, así que no lo busques por posición.
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-redes-y-ciberseguridad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-ip-wifi-servidores';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabIpWifiServidores,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'La tablet de Bit ve cuatro redes wifi, dos con el mismo nombre. Una tiene candado. Sólo una es la de esta casa de verdad.',
  arranqueSub:
    'Todos los días te conectas a una red wifi sin pensarlo — pero detrás de ese nombre y esa contraseña hay tres cosas con nombre propio: una **dirección IP** que identifica a tu dispositivo, un **router** que reparte esas direcciones dentro de tu casa, y un **servidor**, la computadora del otro lado que siempre está prendida esperando tu petición. Hoy vas a distinguir la red real de una gemela abierta creada para engañar, la IP LOCAL de tu casa de la IP PÚBLICA que ve todo internet, y vas a ver a un servidor apagado quedarse sin contestar.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Conceptos', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Una red gemela, una IP que no es tuya, un servidor que no contesta',
  fichas: [
    {
      key: 'ip-local-publica',
      tag: 'La dirección de tu dispositivo',
      numero: 1,
      titulo: 'IP local no es lo mismo que IP pública',
      detalle:
        'Dentro de tu casa, tu celular tiene una **IP local** (algo como 192.168.1.34) que sólo existe ahí. Hacia afuera, TODA la casa comparte una sola **IP pública**: es la dirección que ve el resto de internet, sin importar cuántos aparatos estén conectados adentro.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'router-reparte',
      tag: 'El repartidor de la casa',
      numero: 2,
      titulo: 'El router reparte direcciones y conecta',
      detalle:
        'El **router** le da una IP local distinta a cada aparato de la casa y es la puerta única por la que todos salen a internet. Una red sin contraseña —o una red gemela con el mismo nombre pero sin candado— es una puerta que cualquiera puede cruzar.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'servidor-espera',
      tag: 'La computadora del otro lado',
      numero: 3,
      titulo: 'Un servidor siempre está esperando',
      detalle:
        'Un **servidor** es una computadora que nunca se apaga, esperando a que alguien le pida una página, un juego o un servicio. Si escribes una dirección y el servidor que la sirve está apagado, no hay quién conteste: la página simplemente no carga.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre los ajustes de red de la tablet',
  ctaDetalle:
    'Se abre Tecnia Red con la pantalla de wifi de la tablet de Bit. Elige la red correcta, escribe la contraseña de la etiqueta del router, distingue una IP local de una pública, y manda una petición real a un servidor. Equivocarte resta puntos pero nunca te deja fuera — y la explicación se queda escrita en cada encargo.',
};

export function EntradaIpWifiServidores(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaIpWifiServidores;
