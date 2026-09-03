'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_WEB } from '../web/rutaWebN10';
import { LabPublicaTuSitio } from './LabPublicaTuSitio';

/**
 * Entrada de `n10-publica-tu-sitio` — N10·«Desarrollo web integral», parada 2.
 * Tono de **15–18 años** (N10, Bachillerato, «Perfil profesional»).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-publica-tu-sitio',
  laboratorio: LabPublicaTuSitio,
  ruta: RUTA_N10_WEB,
  parada: 2,
  globo:
    'Ya construiste un sitio completo. Ahora toca la parte que decide si un sitio está listo para el mundo: revisarlo de verdad y publicarlo con criterio profesional.',
  arranqueSub:
    'Vas a auditar el sitio de un despacho de arquitectura real, corregir lo que no debería quedar publicado y activar su dominio, su HTTPS y su checklist final.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Nivel', valor: 'Bachillerato', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#10b981' },
  ],
  letrero: 'Publica tu sitio: Estudio Lumen, listo para producción',
  fichas: [
    {
      key: 'dominio-propio',
      tag: 'Dominio propio',
      numero: 1,
      titulo: 'De una red social a tu propio .mx',
      detalle:
        'Entiende qué gana un negocio real cuando deja de depender sólo de una red social y tiene una dirección que es completamente suya.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'https',
      tag: 'Seguridad',
      numero: 2,
      titulo: 'HTTPS antes del primer dato real',
      detalle:
        'Descubre por qué el candado de la barra de direcciones importa desde antes de recibir el primer correo de un cliente.',
      acento: { c: '#10b981', deep: '#059669' },
    },
    {
      key: 'checklist',
      tag: 'Checklist real',
      numero: 3,
      titulo: 'Datos falsos, enlaces rotos, nada a medias',
      detalle:
        'Revisa un sitio de verdad como se revisa uno antes de publicarlo: sin nada que un cliente real pudiera notar y perder la confianza.',
      acento: { c: '#f59e0b', deep: '#d97706' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al panel de publicación',
  ctaDetalle:
    'Revisa el sitio de un despacho real, corrige lo que no debería estar ahí y publícalo con el mecanismo real de dominio y checklist.',
  assetsPendientes: false,
};

export function EntradaPublicaTuSitio(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPublicaTuSitio;
