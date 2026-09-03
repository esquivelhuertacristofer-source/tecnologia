'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabCifradoBasico } from './LabCifradoBasico';

/**
 * Entrada de `n8-cifrado-basico` — N8 · «Redes y ciberseguridad» (doc §56.3).
 * Nivel 8 = 2° de Secundaria, 13–14 años.
 *
 * La ruta se deriva de `getUnidad('n8-redes-y-ciberseguridad')`, no se
 * escribe a mano — mismo criterio que `n8-malware-e-ingenieria-social`.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n8-cifrado-basico/video-explicativo.mp4` y la
 * bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el
 * de la portada, así que no lo busques por posición.
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-redes-y-ciberseguridad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-cifrado-basico';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabCifradoBasico,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Un mensaje cifrado con clave 3, otro con clave 11, y uno interceptado sin firma que vas a tener que romper tú solo. Después, cuatro sitios web y un candado que hay que aprender a leer.',
  arranqueSub:
    'Cifrar es tan viejo como los mensajes secretos: cambiar cada letra por otra, siempre la misma cantidad de posiciones. Esa cantidad es la **clave**. Hoy vas a construir mensajes cifrados de verdad moviendo el dial de una máquina César, vas a romper uno por **fuerza bruta** —probando las 25 claves posibles hasta que aparezca texto legible—, y vas a cruzar la puerta de Tecnia Navegador para aprender a leer el **candado** de la barra de direcciones: cuándo significa que tu contraseña viaja protegida, y cuándo no.',
  stats: [
    { etiqueta: 'Mensajes', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Sitios', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Una clave, veinticinco intentos, y un candado que nunca miente',
  fichas: [
    {
      key: 'clave-cesar',
      tag: 'La idea',
      numero: 1,
      titulo: 'Cifrar es correr el alfabeto',
      detalle:
        'El cifrado César cambia cada letra por otra que está un número fijo de posiciones adelante. Ese número —la **clave**— es lo único que hace falta para descifrar el mensaje de regreso.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'fuerza-bruta',
      tag: 'La debilidad',
      numero: 2,
      titulo: 'Sólo 25 claves posibles',
      detalle:
        'Si no sabes la clave, puedes probarlas TODAS: son sólo 25. Eso hace al César fácil de romper por **fuerza bruta** — divertido para aprender, inútil para proteger algo de verdad hoy.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'candado',
      tag: 'La protección real',
      numero: 3,
      titulo: 'El candado tiene tres estados',
      detalle:
        '🔒 seguro (HTTPS con certificado válido), ⚠️ advertencia (HTTPS pero el certificado no es de fiar) y sin candado (HTTP, sin cifrar). Sólo el primero es seguro para escribir una contraseña.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'wifi-abierta',
      tag: 'La conclusión',
      numero: 4,
      titulo: 'La wifi abierta no es el peligro',
      detalle:
        'Una wifi sin contraseña sólo controla quién SE CONECTA. Lo que protege tus datos MIENTRAS VIAJAN es el candado: con HTTPS, hasta en la wifi más abierta, nadie puede leer lo que escribes.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Enciende la máquina César',
  ctaDetalle:
    'Se abre Tecnia Cifrador con la máquina César lista. Ajusta el dial, envía mensajes cifrados y rompe uno interceptado por fuerza bruta. Luego cruzas a Tecnia Navegador para decidir, sitio por sitio, cuándo el candado dice que sí y cuándo dice que no. Equivocarte resta puntos pero nunca te deja fuera.',
};

export function EntradaCifradoBasico(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCifradoBasico;
