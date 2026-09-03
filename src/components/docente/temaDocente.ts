/**
 * Hub de profesor — tokens visuales.
 *
 * Antes de esta versión el hub usaba azul/navy genérico, tomado sin querer
 * del componente de login (`CenLogin.css`, con sus propias variables
 * `--navy-950`/`--blue`, aisladas bajo `.cen-login`). Esos NO son los colores
 * de marca de Tecnia — la paleta real vive en `src/app/globals.css`
 * (bloque "CONFIGURACIÓN DE MARCA"): teal profundo + ámbar + cyan, con
 * Epilogue como tipografía. `globals.css` incluso trae clases ya pensadas
 * para esta pantalla («Clases específicas para Dashboard de profesor») que
 * nunca se usaron. Este archivo es el único lugar que fija esos valores
 * para las páginas del hub, para que no se vuelvan a desviar por accidente.
 */

export const COLOR = {
  // Fondo — variación oscura del teal de marca (`--color-brand-primary`),
  // no el navy de CenLogin.
  fondo: 'linear-gradient(165deg, #041920 0%, #0B2E37 52%, #072228 100%)',
  fondoHud: 'rgba(4,25,32,0.86)',
  fondoTarjetaFuerte: '#0C333D',

  superficie: 'rgba(255,255,255,0.045)',
  superficieHover: 'rgba(255,255,255,0.08)',
  borde: 'rgba(255,255,255,0.09)',
  bordeFuerte: 'rgba(255,255,255,0.18)',

  // De `--color-brand-primary` / `--color-brand-primary-soft`.
  primario: '#155E75',
  primarioClaro: '#1B7A96',
  // De `--color-brand-accent` — "Ámbar, CTAs, highlights, botones".
  acento: '#F5A524',
  acentoSuave: '#FDEBC8',
  // De `--color-brand-cyan` — "Tercer color, badges, logros".
  cyan: '#22D3EE',
  cyanSuave: '#D5F5FC',

  texto: '#EAF3F2',
  textoMuted: '#9FB8B6',
  textoTenue: '#5E7A79',

  // Semántico — distinto del acento de marca a propósito (regla de diseño:
  // el color semántico no dobla como acento). Verde real para "bien",
  // rojo-coral para "atención"; el ámbar de marca cubre "medio" porque ya
  // significa precaución en cualquier lectura.
  verde: '#34D399',
  verdeSuave: 'rgba(52,211,153,0.12)',
  rojo: '#FB7185',
  rojoSuave: 'rgba(251,113,133,0.12)',
  amarillo: '#F5A524',
  amarilloSuave: 'rgba(245,165,36,0.12)',
} as const;

export const SOMBRA_PREMIUM = '0 40px 90px rgba(2,15,19,0.45)';

// Sombra de piezas con gradiente ámbar (logo, badges activos, avatares) —
// misma fórmula de "sombra de color + inset highlight" que usa la referencia
// de Bachillerato para sus insignias doradas, aplicada al ámbar de Tecnia.
export const SOMBRA_ACENTO = '0 6px 16px rgba(245,165,36,0.30), inset 0 1px 0 rgba(255,255,255,0.45)';
export const SOMBRA_ACENTO_LG = '0 10px 24px rgba(245,165,36,0.28), inset 0 1px 0 rgba(255,255,255,0.06)';
