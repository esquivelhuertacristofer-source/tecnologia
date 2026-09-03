'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N5U1 } from '../../n4/estudio/EntradaN4Base';
import { LabElCerebroDeLaCompu } from './LabElCerebroDeLaCompu';

/**
 * Entrada de N5·U1 parada 1 «El cerebro de la compu».
 *
 * Regla de la casa: nada de metáfora física (ni cerebros con ojos, ni
 * obreritos) y nada de 3D. Lo que en la vida real es software se construye
 * como software: el laboratorio ES «Tecnia Monitor», el administrador de
 * tareas de verdad, montado en la pantalla plana de `ArcadeSala` (la misma
 * que ya usa N4·U6 «Virus y antivirus»), reusando `EntradaN4Base` — la
 * plantilla de oro es agnóstica de nivel pese al nombre.
 *
 * Las cuatro fichas son las cuatro ideas que el laboratorio pide antes de
 * entrar, en el orden en que las va a usar: que los tres recursos hacen
 * cosas distintas (la idea entera), la prueba de que la memoria no guarda
 * nada (el apagón con el que cierra), que "va lento" no es un diagnóstico
 * (el motivo de que cada situación pida dos decisiones, no una) y que el
 * arreglo equivocado no mueve el medidor que no es el suyo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-el-cerebro-de-la-compu',
  laboratorio: LabElCerebroDeLaCompu,
  ruta: RUTA_N5U1,
  parada: 1,
  globo:
    'Tu computadora no es una caja mágica: tiene tres partes que hacen trabajos distintos. Te presto Tecnia Monitor para que las descubras mirando cómo se llenan.',
  arranqueSub:
    'Siéntate frente al equipo: hoy abres Tecnia Monitor y le mandas diez trabajos distintos para descubrir qué parte de la computadora hace cada uno.',
  stats: [
    { etiqueta: 'Trabajos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Medidores', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El monitor de tareas',
  fichas: [
    {
      key: 'tres-recursos',
      tag: 'La idea entera',
      numero: 1,
      titulo: 'Tres partes, tres trabajos',
      detalle: 'El procesador hace cuentas. La memoria sostiene lo que está abierto ahora. El disco guarda lo que sigue ahí mañana.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'no-diagnostico',
      tag: 'La trampa más común',
      numero: 2,
      titulo: '"Va lento" no es un diagnóstico',
      detalle: 'Hay tres motivos distintos, y cada uno se arregla distinto. Cerrar pestañas no sirve de nada si lo que está al tope es el disco.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'arreglo-equivocado',
      tag: 'El arreglo que no hace nada',
      numero: 3,
      titulo: 'Más memoria no arregla el procesador',
      detalle: 'Y al revés. Si le aplicas el arreglo equivocado, el medidor que de verdad está lleno se queda exactamente igual.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'apagon',
      tag: 'La prueba',
      numero: 4,
      titulo: 'La memoria no guarda nada',
      detalle: 'Se va la luz a media escritura de un trabajo sin guardar: lo que estaba en el disco sigue ahí; lo que sólo vivía en la memoria, no.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Monitor',
  ctaDetalle:
    'Enciende el equipo, manda diez trabajos distintos —desde veinte pestañas hasta un apagón a media escritura—, lee los tres medidores para saber cuál se llenó y aplica el arreglo que de verdad le corresponde.',
  assetsPendientes: false,
};

export function EntradaElCerebroDeLaCompu(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaElCerebroDeLaCompu;
