/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Declaramos la fuente oficial para que funcione en toda la app
      fontFamily: {
        epilogue: ["var(--font-epilogue)", "sans-serif"],
      },
      // Tokens de marca — se configuran vía CSS variables en globals.css
      // Para cambiar la paleta de un cliente: editar :root en globals.css
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',   // Color principal (dark)
          accent:  'var(--color-brand-accent)',    // Color de acento (call to action)
          cyan:    'var(--color-brand-cyan)',      // Tercer color (highlights)
          navy:    "#1a1a2e",
          dark:    "#2d2d1e",
          cream:   "#F5F2ED",
          bg:      "#F9FAFB",
        },
        // Alias legacy — permite que clases 'cen-*' sigan funcionando durante la migración
        cen: {
          blue:   'var(--color-brand-primary)',
          orange: 'var(--color-brand-accent)',
          cyan:   'var(--color-brand-cyan)',
          navy:   "#1a1a2e",
          dark:   "#2d2d1e",
          cream:  "#F5F2ED",
          bg:     "#F9FAFB",
        }
      }
    },
  },
  plugins: [],
};