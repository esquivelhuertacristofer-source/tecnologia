'use client';

import { ESTILOS, FORMATOS, TEMAS, type ImagenGenerada } from './imagen';
import './generador.css';

/**
 * Cómo se VE una imagen generada (§69.3): el fondo del estilo, el glifo del
 * tema, la proporción del formato y, encima, lo que se coló. Ninguna leyenda
 * dice qué tiene mal: se descubre mirando.
 */
export function LienzoImagen({ imagen, ancho = 150 }: { imagen: ImagenGenerada; ancho?: number }) {
  const prop = FORMATOS[imagen.formato].proporcion;
  const alto = Math.round(ancho / prop);
  return (
    <div
      className={`gen-lienzo es-${imagen.estilo}`}
      style={{ width: ancho, height: alto, backgroundImage: ESTILOS[imagen.estilo].fondo }}
      data-imagen={imagen.id}
      role="img"
      aria-label={`Imagen generada ${imagen.id}`}
    >
      {imagen.estilo === 'noche' && <span className="gen-estrellas" aria-hidden="true" />}
      <span
        className="gen-tema"
        aria-hidden="true"
        style={{
          left: `${imagen.encuadre.x}%`,
          top: `${imagen.encuadre.y}%`,
          fontSize: Math.round(Math.min(ancho, alto) * 0.55 * imagen.encuadre.escala),
          transform: `translate(-50%, -50%) rotate(${imagen.encuadre.giro}deg)`,
        }}
      >
        {TEMAS[imagen.tema].glifo}
      </span>
      {imagen.elementos.includes('texto') && (
        <span className="gen-letras" aria-hidden="true">
          FREIA DE CEINSIAS
        </span>
      )}
      {imagen.elementos.includes('persona') && (
        <span className="gen-persona" aria-hidden="true">
          🧍
        </span>
      )}
      {imagen.elementos.includes('marca') && (
        <span className="gen-marca" aria-hidden="true">
          <span>Kola</span>
        </span>
      )}
    </div>
  );
}

export default LienzoImagen;
