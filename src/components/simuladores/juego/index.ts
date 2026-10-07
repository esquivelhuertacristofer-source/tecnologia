/**
 * TECNIA JUEGOS — el creador de videojuegos 2D de la plataforma (documento
 * maestro §67, 12-sep-2026). Es a `n8-disena-tu-videojuego`, `n5-juego-con-
 * niveles` y `n4-crea-tu-videojuego` lo que Tecnia Hojas es a las clases de
 * Excel: el programa, no el ejercicio.
 *
 *   modelo.ts           el nivel: losetas, actores, propiedades, la huella
 *   sprites.ts          píxel-art como texto → SVG
 *   catalogo.ts         las fichas de Tecnia Bloques con las que se programa un actor
 *   fisica.ts           gravedad, colisiones por ejes, altura de salto
 *   ejecucion.ts        correr un guion por tic, con caché de respuestas
 *   partida.ts          nuevaPartida, tic, simular: puntos, vidas, monedas, gano, perdio
 *   jugadorDePrueba.ts  la búsqueda que intenta terminar el nivel con tres perfiles
 *   sondas.ts           «dejar caer al héroe sobre la moneda»: preguntar al nivel sin llegar
 *   guiones.ts          armar guiones sin ratón, por la puerta del editor
 *   ventana/            useJuego + VentanaJuego: el editor, el escenario, el modo jugar
 *
 * Lo que NO hay aquí a propósito: ninguna función que diga si el alumno
 * acertó. El motor da `simular`, `probarNivel` y `alturaDeSaltoDelHeroe`; la
 * corrección la escribe cada clase con eso (canon, prueba 3).
 */

export * from './modelo';
export * from './sprites';
export * from './catalogo';
export * from './fisica';
export * from './ejecucion';
export * from './partida';
export * from './jugadorDePrueba';
export * from './sondas';
export * from './guiones';
export { useJuego } from './ventana/useJuego';
export type { Juego, Herramienta, Modo, OpcionesJuego, PruebaEnCurso } from './ventana/useJuego';
export { VentanaJuego } from './ventana/VentanaJuego';
export type { VentanaJuegoProps } from './ventana/VentanaJuego';
