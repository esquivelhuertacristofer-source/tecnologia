import { DM_Sans, Inter, Manrope } from "next/font/google";

// Tipografías del diseño CEN (landing + login). next/font las aloja localmente:
// sin peticiones a Google Fonts en producción.
export const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    display: "swap",
});

export const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
    display: "swap",
});

// Tipografía de Misión: Aprende Computación (port fiel de styles.css, que
// declara `font-family: Inter, ...` sin alojarla — aquí sí se aloja).
export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});
