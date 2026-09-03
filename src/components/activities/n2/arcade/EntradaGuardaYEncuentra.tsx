import { EntradaN2Unidad3Base, type ConfigEntradaN2Unidad3 } from './EntradaN2Unidad3Base';
import { LabGuardaYEncuentra } from './LabGuardaYEncuentra';
import type { ActivityProps } from '@/types/activity-contract';

const CONFIG: ConfigEntradaN2Unidad3 = {
  actividadId: 'n2-guarda-y-encuentra',
  laboratorio: LabGuardaYEncuentra,
  parada: 2,
  globo: 'Mi archivero guarda tesoros con buenos nombres. ¿Me ayudas a ordenarlo?',
  arranqueSub: 'Aprende a ponerle un buen nombre a tu trabajo y a encontrarlo dentro del archivero.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#38bdf8' },
    { etiqueta: 'Archivos', valor: '8', acento: '#ff9d2e' },
    { etiqueta: 'Insignia', valor: '1', acento: '#ffd25a' },
  ],
  letrero: 'El archivero de Bit',
  fichas: [
    {
      key: 'guardar-trabajo',
      tag: 'Idea clave',
      titulo: 'Guardar tu trabajo',
      detalle: 'Guardar tu trabajo evita que lo pierdas si cierras el programa o apagas la máquina.',
      img: 'ficha-guardar-trabajo.webp',
      acento: { c: '#5ce1e6', deep: '#0e7490' },
    },
    {
      key: 'buen-nombre',
      tag: 'Idea clave',
      titulo: 'Un buen nombre',
      detalle: 'Un nombre que describe lo que hay dentro te ayuda a encontrar tu trabajo después.',
      img: 'ficha-buen-nombre.webp',
      acento: { c: '#ffd25a', deep: '#ff9d2e' },
    },
    {
      key: 'carpetas-cajones',
      tag: 'Idea clave',
      titulo: 'Carpetas como cajones',
      detalle: 'Las carpetas guardan tus archivos como los cajones de un archivero guardan papeles.',
      img: 'ficha-carpetas-cajones.webp',
      acento: { c: '#ff6d7c', deep: '#b91457' },
    },
    {
      key: 'encontrar-archivo',
      tag: 'Idea clave',
      titulo: 'Encontrar el archivo',
      detalle: 'Para encontrar un archivo, recuerda su nombre y en qué carpeta lo guardaste.',
      img: 'ficha-encontrar-archivo.webp',
      acento: { c: '#38bdf8', deep: '#155e9c' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Ponle un buen nombre a cada trabajo y luego encuéntralo dentro del archivero.',
};

export function EntradaGuardaYEncuentra(props: ActivityProps) {
  return <EntradaN2Unidad3Base {...props} entrada={CONFIG} />;
}

export default EntradaGuardaYEncuentra;
