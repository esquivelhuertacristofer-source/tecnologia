import type { Metadata } from 'next';
import CenHub from '@/components/hub/CenHub';

export const metadata: Metadata = {
  title: 'Tu hub · CEN',
  description: 'Tu ruta de aprendizaje: 10 niveles de tecnología y la Paquetería Office.',
};

export default function HubPage() {
  return <CenHub />;
}
