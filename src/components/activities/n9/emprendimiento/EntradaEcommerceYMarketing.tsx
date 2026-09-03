'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabEcommerceYMarketing } from './LabEcommerceYMarketing';

/**
 * Entrada de `n9-ecommerce-y-marketing` — N9 · «Emprendimiento e identidad
 * digital», parada 2 de 3. Nivel 9 = 3° de Secundaria, 14–15 años.
 *
 * Misma ruta derivada de `getUnidad('n9-emprendimiento-e-identidad')`, nunca
 * a mano — igual que hace `EntradaTrabajoColaborativo.tsx` con su unidad. Se
 * eligió a propósito en vez de un archivo de rutas nuevo: la parada 1
 * (`n9-marca-personal`) puede estar construyéndose en paralelo y también
 * necesita esta misma lista — con `getUnidad()` las dos la leen del mismo
 * currículo, sin un archivo compartido que las dos sesiones tengan que tocar.
 */

const RUTA_N9: PasoRuta[] = (getUnidad('n9-emprendimiento-e-identidad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-ecommerce-y-marketing';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabEcommerceYMarketing,
  ruta: RUTA_N9,
  parada: Math.max(1, RUTA_N9.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Regina, de tercero, hace pulseras de resina y quiere venderlas en línea. Antes de abrir su propio catálogo, te toca a ti: vas a mirar tres páginas de producto reales, cuatro resultados de búsqueda, dos anuncios y dos tiendas — y decidir cuáles funcionan y cuáles esconden algo.',
  arranqueSub:
    'Vas a clasificar **tres páginas de producto** (clara vs. confusa), separar **cuatro resultados de búsqueda** entre contenido orgánico y anuncio pagado, diagnosticar qué le falta a **dos anuncios** reales, y decidir si **dos tiendas** son confiables o sospechosas — una de ellas con candado 🔒 válido y aun así sospechosa. Cierras armando el plan honesto de Regina: qué sí poner, y qué NO, aunque venda más rápido a corto plazo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#2dd4bf' },
    { etiqueta: 'Casos reales', valor: '11', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Una página clara no es la más bonita: es la que no esconde nada',
  fichas: [
    {
      key: 'pagina-de-producto-clara',
      tag: 'Antes de vender nada',
      numero: 1,
      titulo: 'Precio, descripción y botón — los tres, no dos',
      detalle:
        'Una página de producto puede tener fotos hermosas y aun así estar incompleta: si falta el precio, la descripción real o un botón que funcione, no está lista para vender.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'anuncio-marcado-es-honesto',
      tag: 'Marketing digital',
      numero: 2,
      titulo: 'Un anuncio marcado no es un anuncio tramposo',
      detalle:
        'Distinguir lo orgánico de lo pagado no es desconfiar de la publicidad — es saber cuándo alguien pagó para aparecer primero, y decidir con esa información.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'candado-no-basta',
      tag: 'Confianza',
      numero: 3,
      titulo: 'El candado protege la conexión, no al vendedor',
      detalle:
        'Una tienda puede tener HTTPS válido y seguir siendo sospechosa: reseñas fabricadas el mismo día, sin contacto real, sin política de devolución. El candado es necesario, pero no es suficiente.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'honesto-a-largo-plazo',
      tag: 'El plan de Regina',
      numero: 4,
      titulo: 'Lo que vende rápido y lo que vende siempre',
      detalle:
        'Inflar reseñas o prometer envío gratis falso puede funcionar una semana. En cuanto alguien lo nota, deja de confiar — y se lo cuenta a otros.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Evalúa tiendas reales',
  ctaDetalle:
    'Se abre Tecnia Navegador con el catálogo de Regina: clasifica páginas de producto, separa anuncios de contenido orgánico, verifica qué tiendas son confiables, y arma el plan honesto que ella va a usar de verdad.',
  assetsPendientes: false,
};

export function EntradaEcommerceYMarketing(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEcommerceYMarketing;
