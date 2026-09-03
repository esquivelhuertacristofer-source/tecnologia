/**
 * Vitrina de insignias (F1.4) — medallas de colección en vez de XP/estrellas.
 * Puramente presentacional: recibe el estado ya calculado (lib/insignias.ts)
 * y lo pinta como medallas de eje/categoría, conseguidas o bloqueadas.
 */

import type { CSSProperties } from 'react';
import type { CategoriaInsignia, InsigniaEstado } from '@/lib/insignias';
import type { EjeFormativoId } from '@/data/curriculo';

const EJE_COLOR: Record<EjeFormativoId, { color: string; deep: string }> = {
  sistemas: { color: '#1463ff', deep: '#0a3fb8' },
  programacion: { color: '#8b5cf6', deep: '#5b32c7' },
  ciudadania: { color: '#17b26a', deep: '#0b7a47' },
  creatividad: { color: '#ff7a1a', deep: '#d95a00' },
  'datos-ia': { color: '#00b8d9', deep: '#007d99' },
};

const CATEGORIA_COLOR: Record<CategoriaInsignia, { color: string; deep: string }> = {
  inicio: { color: '#2f8fff', deep: '#0a3fb8' },
  racha: { color: '#ff5d73', deep: '#c62339' },
  unidad: { color: '#1463ff', deep: '#0a3fb8' },
  nivel: { color: '#ffc93c', deep: '#d98a00' },
  integradora: { color: '#ffc93c', deep: '#d98a00' },
};

function colorDe(insignia: InsigniaEstado) {
  return insignia.eje ? EJE_COLOR[insignia.eje] : CATEGORIA_COLOR[insignia.categoria];
}

export default function CenInsignias({ insignias }: { insignias: InsigniaEstado[] }) {
  const conseguidas = insignias.filter(i => i.conseguida).length;

  return (
    <section className="section section-insignias" id="insignias">
      <div className="container">
        <div className="section-head reveal">
          <div>
            <span className="section-tag">Tus logros</span>
            <h2>Vitrina de insignias.</h2>
          </div>
          <p>
            {conseguidas} de {insignias.length} insignias conseguidas. Se desbloquean solas
            al completar unidades, niveles y rachas de sesiones.
          </p>
        </div>
        <div className="insignias-grid">
          {insignias.map(insignia => {
            const c = colorDe(insignia);
            return (
              <div
                key={insignia.id}
                className={`insignia-medalla cat-${insignia.categoria} ${insignia.conseguida ? 'conseguida' : 'bloqueada'} reveal`}
                style={{ '--ins-c': c.color, '--ins-deep': c.deep } as CSSProperties}
              >
                <span className="medalla-cinta" aria-hidden="true" />
                <span className="medalla-cuerpo" aria-hidden="true">
                  <span className="medalla-icono">{insignia.conseguida ? insignia.icono : '🔒'}</span>
                </span>
                <h3>{insignia.titulo}</h3>
                <p>{insignia.descripcion}</p>
                {insignia.progresoTexto && <span className="medalla-progreso">{insignia.progresoTexto}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
