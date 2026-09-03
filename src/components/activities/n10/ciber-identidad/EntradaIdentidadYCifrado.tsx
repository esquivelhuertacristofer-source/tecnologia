'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_CIBERSEGURIDAD } from '../ciberseguridad/rutaCiberseguridadN10';
import { LabIdentidadYCifrado } from './LabIdentidadYCifrado';

/**
 * Entrada de `n10-identidad-y-cifrado` — N10·«Ciberseguridad profesional»,
 * parada 2 de 3. **N10 = Bachillerato, 15–18 años**, tono «Perfil
 * profesional»: sin diminutivos, registro corporativo.
 *
 * La ruta se IMPORTA de `RUTA_N10_CIBERSEGURIDAD` (declarada por la parada 1)
 * y nunca se reescribe aquí, para no chocar con la parada 3 construida en
 * paralelo.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-identidad-y-cifrado/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-identidad-y-cifrado';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabIdentidadYCifrado,
  ruta: RUTA_N10_CIBERSEGURIDAD,
  parada: Math.max(1, RUTA_N10_CIBERSEGURIDAD.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Antes de defender una red hay que blindar cada cuenta que la abre. Vas a construir una contraseña que un atacante no pueda adivinar, decidir cuándo un segundo factor detiene un ataque real, cazar un correo que finge venir de soporte técnico, y aprender qué protege de verdad el candado del navegador — y qué no.',
  arranqueSub:
    'En **Orbitatek Soluciones**, la pasante Regina Paredes acaba de recibir sus credenciales. Vas a analizar por qué su primera contraseña es débil y a construir una que sí resista, vas a decidir —caso por caso— si un segundo factor de autenticación detiene o no un intento de acceso real, vas a inspeccionar un correo que finge venir de soporte técnico para robar su identidad, y vas a separar dos preguntas que el candado del navegador responde por separado: si tus datos viajan cifrados, y si puedes confirmar con quién estás hablando.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#a78bfa' },
  ],
  letrero: 'Una identidad se defiende en capas: contraseña, segundo factor, criterio y cifrado',
  fichas: [
    {
      key: 'contrasena-fuerte',
      tag: 'Capa 1',
      numero: 1,
      titulo: 'Una contraseña no es un dato personal',
      detalle:
        'Longitud, variedad de caracteres y **cero información que cualquiera pueda encontrar de ti** —nombre, fecha de nacimiento, mascota—. Si aparece en tu perfil público, no debe aparecer en tu contraseña.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'doble-factor',
      tag: 'Capa 2',
      numero: 2,
      titulo: 'El segundo factor no siempre protege igual',
      detalle:
        'Un código por **SMS** puede interceptarse si alguien duplica tu tarjeta SIM. Una **aplicación autenticadora** vive en tu dispositivo físico y resiste ese mismo ataque. No todos los segundos factores son el mismo candado.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'phishing-identidad',
      tag: 'Capa 3',
      numero: 3,
      titulo: 'El phishing va tras tu identidad, no tu dinero',
      detalle:
        'Un correo que finge ser de soporte técnico busca robar tu **contraseña**, no tu tarjeta. El dominio real del remitente y el destino de cada enlace —no el logotipo— son lo que hay que verificar.',
      acento: { c: '#f5a524', deep: '#92400e' },
    },
    {
      key: 'candado-profundo',
      tag: 'Capa 4',
      numero: 4,
      titulo: 'El candado responde dos preguntas, no una',
      detalle:
        'HTTPS cifra el **canal** por el que viajan tus datos. Sólo un certificado válido confirma la **identidad** de quien está del otro lado. Son dos protecciones distintas, y un sitio puede tener una sin la otra.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al perfil de Regina Paredes',
  ctaDetalle:
    'Se abre el entorno de identidad de Orbitatek: construyes una contraseña profesional, decides caso por caso si el doble factor detiene un ataque, inspeccionas un correo sospechoso y separas lo que el candado del navegador protege de lo que no. Equivocarte resta puntos, nunca te deja fuera.',
};

export function EntradaIdentidadYCifrado(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaIdentidadYCifrado;
