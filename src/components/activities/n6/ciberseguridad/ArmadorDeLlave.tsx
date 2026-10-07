'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { barajadas } from '@/lib/ordenDeOpciones';
import { BOLSA_PALABRAS, DICCIONARIO_COMUN, intentarAdivinar, sacarPalabras, type Intento, type PerfilPublico } from './adivinador';

/**
 * El armador de llaves (§69.4). La llave se arma con FICHAS, nunca con el
 * teclado: la regla de privacidad del §24 —el alumno no teclea ninguna
 * contraseña, ni la suya ni una «inventada»— sigue en pie, y por eso aquí no
 * hay un solo `<input>` de texto.
 *
 * Es un diálogo del sitio (como el «cambiar contraseña» de cualquier cuenta),
 * no un panel de la clase. Probar no cuesta nada; guardar guarda la llave
 * AUNQUE CAIGA: la cuenta se queda con su informe y el encargo no se cumple.
 */

export const MAX_FICHAS = 6;
const LISTA_COMUN = ['123456', 'password', 'qwerty', 'minecraft', 'pokemon', 'dragon'];
const NUMEROS_Y_SIGNOS = ['1', '2', '3', '0', '!', '@'];

/** a→@, o→0, e→3: el disfraz que la gente cree que salva. */
export function disfrazar(ficha: string): string {
  return ficha.replace(/a/g, '@').replace(/o/g, '0').replace(/e/g, '3');
}

export function llaveDe(fichas: string[], disfraz: boolean): string {
  return fichas.map((f) => (disfraz ? disfrazar(f) : f)).join(' ');
}

export function fichasDelPerfil(perfil: PerfilPublico): string[] {
  return [perfil.nombre, perfil.mascota, perfil.equipo, perfil.juego, ...perfil.anios.map(String)].map((d) => d.toLowerCase());
}

export interface ArmadorDeLlaveProps {
  /** Lo que dice la cabecera del diálogo: «NivelMax · Cambiar la llave». */
  titulo: string;
  perfil: PerfilPublico;
  /** Llaves que ya tienen otras cuentas: la ficha «Reusar». */
  otras: { etiqueta: string; llave: string }[];
  /** Sin `onGuardar` es la mesa de pruebas de la bolsa (E2): sólo se prueba. */
  onGuardar?: (llave: string, informe: Intento) => void;
  onProbar?: (llave: string, informe: Intento) => void;
  onCerrar: () => void;
  /** Para las pruebas: el azar de la bolsa entra por parámetro. */
  azar?: () => number;
}

export function ArmadorDeLlave({ titulo, perfil, otras, onGuardar, onProbar, onCerrar, azar = Math.random }: ArmadorDeLlaveProps) {
  const [fichas, setFichas] = useState<string[]>([]);
  const [disfraz, setDisfraz] = useState(false);
  const [bolsa, setBolsa] = useState(() => sacarPalabras(BOLSA_PALABRAS, 6, azar));
  const [informe, setInforme] = useState<{ llave: string; intento: Intento } | null>(null);

  const llave = llaveDe(fichas, disfraz);
  const informeVigente = informe && informe.llave === llave ? informe.intento : null;

  const poner = (f: string) => setFichas((prev) => (prev.length >= MAX_FICHAS ? prev : [...prev, f]));
  const reusar = (otra: string) => {
    setDisfraz(false);
    setFichas(otra.split(' ').slice(0, MAX_FICHAS));
  };
  const probar = () => {
    if (!llave) return;
    const intento = intentarAdivinar(llave, perfil, DICCIONARIO_COMUN);
    setInforme({ llave, intento });
    onProbar?.(llave, intento);
  };
  const guardar = () => {
    if (!llave || !onGuardar) return;
    onGuardar(llave, informeVigente ?? intentarAdivinar(llave, perfil, DICCIONARIO_COMUN));
  };

  const bandejas: { titulo: string; testId: string; fichas: string[] }[] = [
    { titulo: `Del perfil de ${perfil.nombre}`, testId: 'armador-perfil', fichas: fichasDelPerfil(perfil) },
    { titulo: 'Palabras de siempre', testId: 'armador-comunes', fichas: LISTA_COMUN },
    { titulo: 'De la bolsa', testId: 'armador-bolsa', fichas: bolsa },
    { titulo: 'Números y signos', testId: 'armador-signos', fichas: NUMEROS_Y_SIGNOS },
  ];

  // Al body, como un diálogo de verdad: dentro de la ventana del navegador quedaba
  // cortado por su alto y Probar/Guardar caían bajo el pliegue (medido el 6-oct-2026).
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/75 p-3 sm:p-6" data-testid="armador">
      <div role="dialog" aria-label={titulo} className="w-full max-w-2xl rounded-2xl border-2 border-cyan-400 bg-[#0d1830] shadow-[0_0_40px_rgba(34,211,238,0.35)]">
        <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-gradient-to-r from-cyan-600 to-indigo-700 px-4 py-3">
          <p className="font-extrabold text-white">🔑 {titulo}</p>
          <button type="button" onClick={onCerrar} className="rounded-lg bg-black/30 px-3 py-1 text-sm font-bold text-white" data-testid="armador-cerrar">
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-xl border border-cyan-500/40 bg-black/40 p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Tu llave · {fichas.length} de {MAX_FICHAS} fichas</p>
            <p className="min-h-[2rem] break-all font-mono text-xl font-bold text-white" data-testid="armador-llave">
              {llave || <span className="text-slate-500">Toca fichas para armarla.</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFichas((p) => p.slice(0, -1))}
                disabled={fichas.length === 0}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                data-testid="armador-quitar"
              >
                ⌫ Quitar la última
              </button>
              <button
                type="button"
                onClick={() => setFichas([])}
                disabled={fichas.length === 0}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={() => setDisfraz((d) => !d)}
                aria-pressed={disfraz}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${disfraz ? 'bg-fuchsia-500 text-white' : 'bg-slate-700 text-white'}`}
                data-testid="armador-disfraz"
              >
                🎭 Disfrazar (a→@ o→0 e→3)
              </button>
            </div>
          </div>

          {informeVigente && (
            <div
              className={`rounded-xl border-2 p-3 ${informeVigente.cae ? 'border-rose-400 bg-rose-950/70' : 'border-emerald-400 bg-emerald-950/70'}`}
              data-testid="armador-informe"
              data-cae={informeVigente.cae ? 'si' : 'no'}
            >
              <p className="font-extrabold text-white">
                {informeVigente.cae ? `Cayó en el intento nº ${informeVigente.intento.toLocaleString('es-MX')}` : 'No cayó'}
              </p>
              <p className="mt-1 text-sm text-slate-100">{informeVigente.motivo}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={probar}
              disabled={!llave}
              className="rounded-xl bg-amber-400 px-4 py-2.5 font-extrabold text-slate-950 disabled:opacity-40"
              data-testid="armador-probar"
            >
              🤖 Probar en la máquina
            </button>
            {onGuardar && (
              <button
                type="button"
                onClick={guardar}
                disabled={!llave}
                className="rounded-xl bg-emerald-400 px-4 py-2.5 font-extrabold text-slate-950 disabled:opacity-40"
                data-testid="armador-guardar"
              >
                Guardar esta llave
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bandejas.map((b) => (
              <div key={b.testId} className="rounded-xl bg-slate-900/70 p-3" data-testid={b.testId}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{b.titulo}</p>
                  {b.testId === 'armador-bolsa' && (
                    <button
                      type="button"
                      onClick={() => setBolsa(sacarPalabras(BOLSA_PALABRAS, 6, azar))}
                      className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white"
                      data-testid="armador-sacar"
                    >
                      🎲 Sacar otras
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {barajadas(b.fichas, b.testId).map(([f]) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => poner(f)}
                      disabled={fichas.length >= MAX_FICHAS}
                      className="rounded-lg border-2 border-cyan-300/60 bg-cyan-900/60 px-2.5 py-1 font-mono text-sm font-bold text-cyan-50 hover:bg-cyan-700 disabled:opacity-40"
                      data-ficha={f}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {otras.length > 0 && (
            <div className="rounded-xl bg-slate-900/70 p-3" data-testid="armador-reusar">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">Reusar una llave que ya tienes</p>
              <div className="flex flex-wrap gap-1.5">
                {otras.map((o) => (
                  <button
                    key={o.etiqueta}
                    type="button"
                    onClick={() => reusar(o.llave)}
                    className="rounded-lg border-2 border-amber-300/60 bg-amber-900/50 px-2.5 py-1 text-sm font-bold text-amber-50"
                    data-reusar={o.etiqueta}
                  >
                    La de {o.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  );
}
