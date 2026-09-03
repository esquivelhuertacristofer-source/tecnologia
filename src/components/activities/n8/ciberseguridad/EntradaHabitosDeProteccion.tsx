'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabHabitosDeProteccion } from './LabHabitosDeProteccion';

/**
 * Entrada de `n8-habitos-de-proteccion` — N8 · «Redes y ciberseguridad»
 * (currículo §56.4). Nivel 8 = 2° de Secundaria, 13–14 años.
 *
 * CIERRE de la unidad: combina las tres hermanas —IP/wifi/servidores,
 * malware/ingeniería social, cifrado/candado— con tres hábitos nuevos
 * (contraseñas, actualizaciones, verificación en dos pasos) y un escenario
 * final que cruza Tecnia Correo y Tecnia Navegador con contenido nuevo.
 *
 * La ruta se deriva de `getUnidad('n8-redes-y-ciberseguridad')`, no se
 * escribe a mano — mismo criterio que las tres hermanas.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n8-habitos-de-proteccion/video-explicativo.mp4`
 * y la bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con
 * el video puesto, el primer `<button>` del documento ya no es el CTA sino el
 * de la portada, así que no lo busques por posición.
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-redes-y-ciberseguridad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-habitos-de-proteccion';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabHabitosDeProteccion,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya sabes de wifi, de malware y de candados. Hoy cierras la unidad: forjas una contraseña fuerte de verdad, decides qué app actualizar antes de que sea tarde, bloqueas un intento de acceso, y cierras un escenario que cruza Tecnia Correo y Tecnia Navegador otra vez — con todo lo que ya aprendiste, en una situación nueva.',
  arranqueSub:
    'Ésta es la última parada de «Redes y ciberseguridad». No vas a aprender un programa nuevo: vas a usar los tres que ya conoces —el panel de red, Tecnia Correo, Tecnia Navegador— para practicar cuatro **hábitos de protección** que se aplican todos los días: una **contraseña fuerte** de verdad (medida con un medidor real, no adivinada), mantener el software **actualizado** para no dejar abierta la puerta que el malware aprovecha, la **verificación en dos pasos** que protege tu cuenta aunque alguien ya tenga tu contraseña, y un escenario final donde vas a combinar los cuatro a la vez.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Hábitos', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cuatro hábitos, un solo alumno protegido',
  fichas: [
    {
      key: 'contrasena-fuerte',
      tag: 'Hábito 1',
      numero: 1,
      titulo: 'Un medidor real, no una lista memorizada',
      detalle:
        'Una contraseña fuerte mezcla longitud, mayúsculas, minúsculas, números y un símbolo — y nunca es una de las más usadas del mundo, ni tu propio nombre. El medidor de hoy evalúa CUALQUIER contraseña que escribas, en vivo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'actualizaciones',
      tag: 'Hábito 2',
      numero: 2,
      titulo: 'Actualizar cierra la puerta que ya conoces',
      detalle:
        'Un boletín de seguridad es un mapa publicado de por dónde se puede entrar. La actualización tapa exactamente esa falla — la misma clase de truco del adjunto disfrazado que ya viste en los correos de Mateo.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: '2fa',
      tag: 'Hábito 3',
      numero: 3,
      titulo: 'La verificación en dos pasos protege aunque roben tu clave',
      detalle:
        'Un código que sólo llega a tu propio dispositivo: aunque alguien escriba tu contraseña correcta desde el otro lado del mundo, sin ese segundo aparato no puede entrar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'cierre',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Los cuatro hábitos, en una situación nueva',
      detalle:
        'Un correo legítimo de tu propia escuela, un candado seguro en Tecnia Navegador, una contraseña nueva y distinta de la anterior, y la verificación en dos pasos activada: todo lo que aprendiste en esta unidad, trabajando junto.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a Tecnia Escudo',
  ctaDetalle:
    'Se abre el centro de seguridad de Bit: forja una contraseña y clasifica otras cuatro, decide qué app actualizar, bloquea un intento de acceso sospechoso, y cierra un escenario que cruza Tecnia Correo y Tecnia Navegador combinando todo lo aprendido en la unidad. Equivocarte resta puntos pero nunca te deja fuera.',
};

export function EntradaHabitosDeProteccion(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaHabitosDeProteccion;
