'use client';

/**
 * Mapa del teclado (N2·U2, documento §10 «Reconciliación con el molde»).
 *
 * Diagrama interactivo compartido por las paradas 1 y 3 («Explora tu
 * teclado» y «Escribe a dos manos»); la parada 2 tiene su propio aparato
 * (máquina de escribir de juguete) y no usa este componente.
 *
 * Cuatro familias de teclas por color: letras, números, flechas, especiales.
 * `mostrarDivisor` añade la línea central + el hueco entre manos que usa la
 * parada 3 para el ejercicio de dos manos.
 */

export type FamiliaTecla = 'letras' | 'numeros' | 'flechas' | 'especiales';
export type Mano = 'izquierda' | 'derecha';
export type EstadoTecla = 'correcta' | 'incorrecta';

interface TeclaSpec {
  id: string;
  label: string;
  familia: FamiliaTecla;
  mano: Mano;
  ancho?: number;
}

const FLECHAS: TeclaSpec[] = [
  { id: 'flecha-arriba', label: '↑', familia: 'flechas', mano: 'derecha' },
  { id: 'flecha-abajo', label: '↓', familia: 'flechas', mano: 'derecha' },
  { id: 'flecha-izquierda', label: '←', familia: 'flechas', mano: 'derecha' },
  { id: 'flecha-derecha', label: '→', familia: 'flechas', mano: 'derecha' },
];

const FILAS: TeclaSpec[][] = [
  [
    { id: 'n1', label: '1', familia: 'numeros', mano: 'izquierda' },
    { id: 'n2', label: '2', familia: 'numeros', mano: 'izquierda' },
    { id: 'n3', label: '3', familia: 'numeros', mano: 'izquierda' },
    { id: 'n4', label: '4', familia: 'numeros', mano: 'izquierda' },
    { id: 'n5', label: '5', familia: 'numeros', mano: 'izquierda' },
    { id: 'n6', label: '6', familia: 'numeros', mano: 'derecha' },
    { id: 'n7', label: '7', familia: 'numeros', mano: 'derecha' },
    { id: 'n8', label: '8', familia: 'numeros', mano: 'derecha' },
    { id: 'n9', label: '9', familia: 'numeros', mano: 'derecha' },
    { id: 'n0', label: '0', familia: 'numeros', mano: 'derecha' },
    { id: 'backspace', label: '⌫', familia: 'especiales', mano: 'derecha', ancho: 2 },
  ],
  [
    { id: 'q', label: 'Q', familia: 'letras', mano: 'izquierda' },
    { id: 'w', label: 'W', familia: 'letras', mano: 'izquierda' },
    { id: 'e', label: 'E', familia: 'letras', mano: 'izquierda' },
    { id: 'r', label: 'R', familia: 'letras', mano: 'izquierda' },
    { id: 't', label: 'T', familia: 'letras', mano: 'izquierda' },
    { id: 'y', label: 'Y', familia: 'letras', mano: 'derecha' },
    { id: 'u', label: 'U', familia: 'letras', mano: 'derecha' },
    { id: 'i', label: 'I', familia: 'letras', mano: 'derecha' },
    { id: 'o', label: 'O', familia: 'letras', mano: 'derecha' },
    { id: 'p', label: 'P', familia: 'letras', mano: 'derecha' },
  ],
  [
    { id: 'a', label: 'A', familia: 'letras', mano: 'izquierda' },
    { id: 's', label: 'S', familia: 'letras', mano: 'izquierda' },
    { id: 'd', label: 'D', familia: 'letras', mano: 'izquierda' },
    { id: 'f', label: 'F', familia: 'letras', mano: 'izquierda' },
    { id: 'g', label: 'G', familia: 'letras', mano: 'izquierda' },
    { id: 'h', label: 'H', familia: 'letras', mano: 'derecha' },
    { id: 'j', label: 'J', familia: 'letras', mano: 'derecha' },
    { id: 'k', label: 'K', familia: 'letras', mano: 'derecha' },
    { id: 'l', label: 'L', familia: 'letras', mano: 'derecha' },
    { id: 'ñ', label: 'Ñ', familia: 'letras', mano: 'derecha' },
    { id: 'enter', label: '⏎', familia: 'especiales', mano: 'derecha', ancho: 2 },
  ],
  [
    { id: 'z', label: 'Z', familia: 'letras', mano: 'izquierda' },
    { id: 'x', label: 'X', familia: 'letras', mano: 'izquierda' },
    { id: 'c', label: 'C', familia: 'letras', mano: 'izquierda' },
    { id: 'v', label: 'V', familia: 'letras', mano: 'izquierda' },
    { id: 'b', label: 'B', familia: 'letras', mano: 'izquierda' },
    { id: 'n', label: 'N', familia: 'letras', mano: 'derecha' },
    { id: 'm', label: 'M', familia: 'letras', mano: 'derecha' },
  ],
  [
    { id: 'espacio', label: 'ESPACIO', familia: 'especiales', mano: 'izquierda', ancho: 6 },
    { id: 'flechas-grupo', label: '', familia: 'flechas', mano: 'derecha', ancho: 3 },
  ],
];

export const LEYENDA_FAMILIAS: { familia: FamiliaTecla; nombre: string }[] = [
  { familia: 'letras', nombre: 'Letras' },
  { familia: 'numeros', nombre: 'Números' },
  { familia: 'flechas', nombre: 'Flechas' },
  { familia: 'especiales', nombre: 'Especiales' },
];

export interface TecladoMapaProps {
  objetivo?: string | null;
  estados?: Record<string, EstadoTecla>;
  mostrarDivisor?: boolean;
  mostrarLeyenda?: boolean;
  deshabilitada?: boolean;
  onTecla?: (id: string) => void;
}

export function TecladoMapa({
  objetivo = null,
  estados,
  mostrarDivisor = false,
  mostrarLeyenda = false,
  deshabilitada = false,
  onTecla,
}: TecladoMapaProps) {
  const claseTecla = (tecla: TeclaSpec) => {
    const clases = [`teclado-tecla`, `familia-${tecla.familia}`];
    if (objetivo === tecla.id) clases.push('objetivo');
    const estado = estados?.[tecla.id];
    if (estado) clases.push(estado);
    return clases.join(' ');
  };

  return (
    <div className={`teclado-mapa${mostrarDivisor ? ' con-divisor' : ''}`}>
      {mostrarDivisor && <span className="teclado-mapa-divisor" aria-hidden="true" />}
      <div className="teclado-mapa-filas">
        {FILAS.map((fila, fi) => (
          <div className="teclado-fila" key={fi}>
            {fila.map((tecla, i) => {
              const siguiente = fila[i + 1];
              const cierraGrupoIzq = mostrarDivisor && tecla.mano === 'izquierda' && siguiente?.mano === 'derecha';

              if (tecla.id === 'flechas-grupo') {
                return (
                  <div
                    key={tecla.id}
                    className={`teclado-flechas${cierraGrupoIzq ? ' divisor-fila' : ''}`}
                    style={{ flexGrow: tecla.ancho ?? 1 }}
                  >
                    <button
                      type="button"
                      className={claseTecla(FLECHAS[0])}
                      style={{ gridArea: 'arriba' }}
                      disabled={deshabilitada}
                      onClick={() => onTecla?.(FLECHAS[0].id)}
                      aria-label="Flecha arriba"
                    >
                      {FLECHAS[0].label}
                    </button>
                    <button
                      type="button"
                      className={claseTecla(FLECHAS[2])}
                      style={{ gridArea: 'izquierda' }}
                      disabled={deshabilitada}
                      onClick={() => onTecla?.(FLECHAS[2].id)}
                      aria-label="Flecha izquierda"
                    >
                      {FLECHAS[2].label}
                    </button>
                    <button
                      type="button"
                      className={claseTecla(FLECHAS[1])}
                      style={{ gridArea: 'abajo' }}
                      disabled={deshabilitada}
                      onClick={() => onTecla?.(FLECHAS[1].id)}
                      aria-label="Flecha abajo"
                    >
                      {FLECHAS[1].label}
                    </button>
                    <button
                      type="button"
                      className={claseTecla(FLECHAS[3])}
                      style={{ gridArea: 'derecha' }}
                      disabled={deshabilitada}
                      onClick={() => onTecla?.(FLECHAS[3].id)}
                      aria-label="Flecha derecha"
                    >
                      {FLECHAS[3].label}
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={tecla.id}
                  type="button"
                  className={`${claseTecla(tecla)}${cierraGrupoIzq ? ' divisor-fila' : ''}`}
                  style={{ flexGrow: tecla.ancho ?? 1 }}
                  disabled={deshabilitada}
                  onClick={() => onTecla?.(tecla.id)}
                  aria-label={tecla.label || tecla.id}
                >
                  {tecla.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {mostrarLeyenda && (
        <div className="teclado-leyenda">
          {LEYENDA_FAMILIAS.map((item) => (
            <span key={item.familia} className={`teclado-leyenda-item familia-${item.familia}`}>
              <span className="teclado-leyenda-punto" aria-hidden="true" />
              {item.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default TecladoMapa;
