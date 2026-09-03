/**
 * Branding config — punto de entrada único para personalizar el template.
 * Todos los valores son sobreescribibles via variables de entorno (.env.local).
 * Ver .env.local.example para la lista completa.
 */
export const BRAND = {
  // Identidad
  name:         process.env.NEXT_PUBLIC_BRAND_NAME      ?? 'Tecnia',
  tagline:      process.env.NEXT_PUBLIC_BRAND_TAGLINE   ?? 'Tecnología de primaria a bachillerato',
  logoPath:     process.env.NEXT_PUBLIC_BRAND_LOGO      ?? '/assets/logo.png',
  legalEntity:  process.env.NEXT_PUBLIC_LEGAL_ENTITY    ?? 'Tecnia — Plataforma Educativa de Tecnología',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL   ?? 'contacto@tudominio.com',

  // Colores (sincronizar con tailwind.config.ts → theme.extend.colors)
  colors: {
    primary: process.env.NEXT_PUBLIC_COLOR_PRIMARY ?? '#155E75',
    accent:  process.env.NEXT_PUBLIC_COLOR_ACCENT  ?? '#F5A524',
    cyan:    process.env.NEXT_PUBLIC_COLOR_CYAN    ?? '#22D3EE',
  },
} as const;

export type Brand = typeof BRAND;
