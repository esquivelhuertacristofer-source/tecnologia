'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_CIBERSEGURIDAD } from './rutaCiberseguridadN10';
import { LabAmenazasYDefensa } from './LabAmenazasYDefensa';

/**
 * Entrada de `n10-amenazas-y-defensa` — N10·«Ciberseguridad profesional», parada 1.
 * Tono de **15–18 años** (N10, Bachillerato).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-amenazas-y-defensa',
  laboratorio: LabAmenazasYDefensa,
  ruta: RUTA_N10_CIBERSEGURIDAD,
  parada: 1,
  globo:
    'En un centro de operaciones de seguridad no se adivina nada: se mira quién está conectado, se corta lo que no debería estar ahí, y se comprueba que lo cortado era de verdad el atacante. Hoy esa mesa es la tuya.',
  arranqueSub:
    'Vas a mirar las conexiones abiertas para encontrar la que sobra, a escribir la regla del cortafuegos que la deja fuera, a abrir un fragmento de código malicioso para ver qué hacía, y a comprobar una firma antes de dar el incidente por cerrado.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#10b981' },
    { etiqueta: 'Nivel de alerta', valor: 'DEFCON 1-5', acento: '#ef4444' },
    { etiqueta: 'Insignia', valor: '1', acento: '#38bdf8' },
  ],
  letrero: 'CyberSOC Sentinel: ciberseguridad y defensa de la red',
  fichas: [
    {
      key: 'traffic-sniffer',
      tag: 'Ver quién está',
      numero: 1,
      titulo: 'Las conexiones abiertas',
      detalle:
        'netstat te enseña con quién está hablando la máquina ahora mismo. Muchísimas conexiones a la vez, desde direcciones distintas, son la señal de un ataque repartido.',
      acento: { c: '#10b981', deep: '#047857' },
    },
    {
      key: 'firewall-defense',
      tag: 'Cortar el paso',
      numero: 2,
      titulo: 'La regla del cortafuegos',
      detalle:
        'Bloquear una dirección es escribir una regla: a partir de ahí sus paquetes no pasan. Lo difícil no es escribirla, es acertar con cuál bloqueas.',
      acento: { c: '#ef4444', deep: '#b91c1c' },
    },
    {
      key: 'decryption-engine',
      tag: 'Comprobar',
      numero: 3,
      titulo: 'Descifrado y firma (AES-256)',
      detalle:
        'El cifrado esconde el contenido y la firma dice quién lo mandó: son dos cosas distintas. Hacen falta las dos para que la alerta pueda volver a bajar.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a la consola CyberSOC',
  ctaDetalle:
    'Cinco encargos en la terminal: encuentras la conexión que sobra, escribes la regla que la deja fuera, miras qué hacía el código que entró y compruebas la firma antes de dar el incidente por cerrado.',
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n10-amenazas-y-defensa/video-explicativo.mp4`. Con la bandera en
   * `false` el `<video>` se pintaba igualmente y pedía un archivo que no
   * existe: el alumno veía un reproductor muerto y un 404 en la red, en vez
   * del aviso honesto de que el video todavía se está grabando. Cuando el
   * video exista, esto vuelve a `false` en el mismo commit que lo publica.
   */
  assetsPendientes: false,
};

export function EntradaAmenazasYDefensa(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAmenazasYDefensa;
