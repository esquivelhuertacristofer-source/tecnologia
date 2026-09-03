'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U6 } from './EntradaN4Base';
import { LabVirusYAntivirus } from './LabVirusYAntivirus';

/**
 * Entrada de N4·U6 parada 1 «Virus y antivirus».
 *
 * Regla de la casa para esta unidad: nada de metáfora física (ni bichos, ni
 * jeringas) y nada de 3D forzado. Lo que en la vida real es software se
 * construye como software: el laboratorio ES «Tecnia Antivirus», una ventana
 * con su lista de programas, su panel de detalle y su botón de analizar,
 * montada en la pantalla plana de `ArcadeSala` (la misma que usaban las
 * primeras máquinas de N1, antes del gabinete WebGL de N2 en adelante).
 *
 * Las cuatro fichas son las cuatro ideas que hay que tener antes de entrar,
 * en el orden en que el laboratorio las pide: la definición completa (fase
 * 0 del programa), la distancia entre lo que un programa dice y lo que pide
 * (la lectura de las tres pestañas), el límite del propio antivirus —que
 * sólo reconoce lo que ya conoce, y por eso hay que cazar el que declara
 * limpio sin estarlo—, y el reflejo correcto para cuando la duda no se
 * resuelve solo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-virus-y-antivirus',
  laboratorio: LabVirusYAntivirus,
  ruta: RUTA_N4U6,
  parada: 1,
  globo: 'Un virus no es un bicho: es un programa que hace algo que tú no pediste. Te presto Tecnia Antivirus para que aprendas a cazarlo.',
  arranqueSub: 'Siéntate frente al equipo: hoy abres Tecnia Antivirus y decides, programa por programa, qué se queda y qué no.',
  stats: [
    { etiqueta: 'Programas', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Pestañas', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La mesa de triaje',
  fichas: [
    {
      key: 'definicion',
      tag: 'La definición completa',
      numero: 1,
      titulo: 'Un programa, no un bicho',
      detalle: 'Un virus es un programa que hace algo que tú no pediste. Alguien lo escribió, a propósito, para eso.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'distancia',
      tag: 'Lo que lo delata',
      numero: 2,
      titulo: 'Lo que pide contra lo que hace',
      detalle: 'Una linterna que pide leer tus contactos no necesita tus contactos para encender la luz. Esa distancia es la señal.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'antivirus',
      tag: 'Por qué no basta',
      numero: 3,
      titulo: 'Sólo conoce lo que ya conoce',
      detalle: 'El antivirus reconoce los programas de su lista. El peligroso de verdad es el que todavía no está en ninguna lista.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'reflejo',
      tag: 'El reflejo correcto',
      numero: 4,
      titulo: 'Ante la duda, un adulto',
      detalle: 'No lo borras tú solo ni lo instalas para averiguar: si algo no cuadra, se lo enseñas a un adulto antes de decidir.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Antivirus',
  ctaDetalle:
    'Enciende el equipo, analiza los 10 programas instalados, revisa cada uno por sus tres caras —qué dice, qué pide y qué hace de verdad— y decide: lo dejas, lo revisas con un adulto o lo quitas.',
  assetsPendientes: false,
};

export function EntradaVirusYAntivirus(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVirusYAntivirus;
