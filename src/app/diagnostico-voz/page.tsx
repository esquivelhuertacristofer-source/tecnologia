'use client';

import { useEffect, useState } from 'react';
import { decir, diagnosticoVoz, prepararVoz } from '@/components/activities/n1/mision/audio';

/**
 * Diagnóstico de voz de la plataforma.
 *
 * No reimplementa la heurística: llama al mismo módulo que narran los 56
 * laboratorios (`mision/audio.ts`), así que lo que se ve aquí es exactamente
 * la voz que oirá el alumno en este navegador. Sirve para comprobar en cada
 * equipo si hay voces neuronales de Microsoft disponibles.
 */

type Diagnostico = ReturnType<typeof diagnosticoVoz>;

const FRASE = 'Hola, soy Bit. Vamos a encender la computadora y conocer sus partes.';

export default function PaginaDiagnosticoVoz() {
  const [diag, setDiag] = useState<Diagnostico | null>(null);

  useEffect(() => {
    prepararVoz();
    let reportado = false;
    const leer = () => {
      const d = diagnosticoVoz();
      setDiag(d);
      // En desarrollo deja constancia en el log del servidor: así la
      // comprobación queda medida y no depende de que alguien mire la
      // pantalla. En producción no se emite nada.
      if (process.env.NODE_ENV === 'development' && !reportado && d.elegida) {
        reportado = true;
        new Image().src =
          `/__diag-voz-app?elegida=${encodeURIComponent(d.elegida)}` +
          `&premium=${d.premium}&candidatas=${d.candidatas.length}`;
      }
    };
    leer();
    // El catálogo llega asíncrono y en Edge en dos tandas (locales primero,
    // neuronales después): se relee unas cuantas veces.
    const t1 = window.setTimeout(leer, 800);
    const t2 = window.setTimeout(leer, 2500);
    const t3 = window.setTimeout(leer, 5000);
    window.speechSynthesis?.addEventListener?.('voiceschanged', leer);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.speechSynthesis?.removeEventListener?.('voiceschanged', leer);
    };
  }, []);

  const ok = diag?.premium ?? false;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#04122a',
        color: '#e8f0ff',
        padding: '48px 32px',
        font: '16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ fontSize: 34, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Voz de la plataforma
      </h1>
      <p style={{ margin: '0 0 28px', color: '#8fb2e0' }}>
        Esta página usa el mismo módulo de narración que los ejercicios. Lo que diga aquí es
        lo que oirá el alumno en este navegador.
      </p>

      <div
        style={{
          display: 'inline-block',
          padding: '16px 22px',
          borderRadius: 14,
          fontWeight: 700,
          marginBottom: 24,
          background: ok ? '#0b3d1f' : '#4a1220',
          color: ok ? '#7dffab' : '#ff9db1',
        }}
      >
        {diag === null
          ? 'Leyendo el catálogo de voces…'
          : diag.elegida === null
            ? '‼ Este navegador no expone ninguna voz en español'
            : `${ok ? '✓ Voz neuronal' : '‼ Voz vieja del sistema'} · ${diag.elegida}`}
      </div>

      <p>
        <button
          type="button"
          onClick={() => decir(FRASE, { forzar: true })}
          style={{
            font: 'inherit',
            fontWeight: 700,
            padding: '10px 18px',
            border: 0,
            borderRadius: 10,
            background: '#1d6fe0',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Escuchar a Bit
        </button>
      </p>

      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 940, marginTop: 20 }}>
        <thead>
          <tr>
            {['#', 'Voz', 'Idioma', 'Origen', 'Puntos'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid #1d3a63',
                  color: '#8fb2e0',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(diag?.candidatas ?? []).map((c, i) => {
            const elegida = diag?.elegida?.startsWith(c.nombre) ?? false;
            return (
              <tr
                key={c.nombre + c.lang}
                style={{
                  background: elegida ? '#0d3a24' : undefined,
                  color: elegida ? '#b8ffd4' : undefined,
                  fontWeight: elegida ? 700 : undefined,
                }}
              >
                <td style={celda}>{i + 1}</td>
                <td style={celda}>{c.nombre}</td>
                <td style={celda}>
                  <code style={{ background: '#0b1f3d', padding: '2px 6px', borderRadius: 6 }}>
                    {c.lang}
                  </code>
                </td>
                <td style={celda}>{c.local ? 'local (SAPI)' : 'servidor Microsoft'}</td>
                <td style={{ ...celda, fontVariantNumeric: 'tabular-nums' }}>{c.puntos}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

const celda: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #1d3a63' };
