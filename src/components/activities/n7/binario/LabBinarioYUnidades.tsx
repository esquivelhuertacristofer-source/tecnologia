'use client';

import { useRef, useState, type CSSProperties } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  BITS_APAGADOS,
  CHAPAS_BARAJADAS,
  ESCALERA,
  NUMEROS,
  OBJETOS,
  TOTAL_PASOS,
  VALORES_POSICION,
  aDecimal,
  alternar,
  bytesDelSistema,
  descomposicion,
  escalonDe,
  indiceDe,
  pistaDiferencia,
  textoBinario,
  type Bits,
} from './consolaBits';
import './consolaBits.css';

/**
 * N7·U1·parada 2 — «Binario y unidades» (documento propio de la clase:
 * `DOC-N7-n7-binario-y-unidades.md`, que también anota las tres divergencias
 * con el §31.2 del documento maestro).
 *
 * **No es 3D, y es deliberado.** El §31.2 pedía una escena `ConsolaBits3D` con
 * «cada palanca como un `<button>` sobre su cuerpo 3D», que es literalmente la
 * forma que el cliente declaró inutilizable el 6-ago-2026 (canon: «una escena
 * con paneles de HTML flotando delante no es 3D»). El tema es valor posicional
 * y magnitudes: dos ordenaciones de una dimensión. El espacio no es el
 * contenido → no es 3D.
 *
 * **No usa ningún armazón de `simuladores/`, y tampoco estrena uno.** El
 * alumno no abre un programa: opera un instrumento. Ninguno de los quince
 * paquetes modela una consola de bits, y crear el dieciséis serviría a una
 * sola actividad de todo el currículo (regla de la casa: «no inventes
 * capacidades que nadie pide»). Mismo camino y misma justificación que
 * `n7-equilibrio-digital` con «Tecnia Avisos». Lo compartido —`VentanaBase`,
 * `useLabActividad`, la entrada de la unidad— sí se reutiliza.
 *
 * Nada de arrastre: `jsdom` pierde las coordenadas de puntero en silencio y
 * toda prueba escrita sobre arrastre es verde y hueca (canon §5). Todo es un
 * clic sobre un dato discreto y toda la aritmética vive en `consolaBits.ts`,
 * puro y sin React.
 *
 * `terminar()` recibe el tiempo real jugado, no un número inventado.
 */

type Fase = 'inicio' | 'numeros' | 'escalera' | 'pesos' | 'disco' | 'cierre';

/** Capacidad del disco del ejemplo de la ronda 4, tal como la vende la caja. */
const DISCO_GB = 500;

const OPCIONES_DISCO = [
  { id: 'fallado', texto: 'El disco viene fallado y hay que devolverlo.' },
  { id: 'sistema', texto: 'El sistema operativo ya ocupó esos 35 GB.' },
  { id: 'conteo', texto: 'El fabricante cuenta de 1 000 en 1 000 y el sistema de 1 024 en 1 024.' },
] as const;

const OPCION_DISCO_CORRECTA = 'conteo';

interface Linea {
  texto: string;
  pista?: boolean;
}

export function LabBinarioYUnidades(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});

  const [fase, setFase] = useState<Fase>('inicio');
  const [bits, setBits] = useState<Bits>(BITS_APAGADOS);
  const [idxNumero, setIdxNumero] = useState(0);
  const [confirmado, setConfirmado] = useState(false);
  const [colocados, setColocados] = useState<readonly string[]>([]);
  const [idxObjeto, setIdxObjeto] = useState(0);
  const [lineas, setLineas] = useState<Linea[]>([
    { texto: 'Aquí adentro no hay letras ni colores: hay corriente que pasa o no pasa. Uno o cero. A eso se le llama bit (binary digit, dígito binario).' },
  ]);

  /** Índice del número en curso, para el guarda de la ronda 1. */
  const idxNumeroRef = useRef(0);
  /** Índice del objeto en curso, para el guarda de la ronda 3. */
  const idxObjetoRef = useRef(0);
  /**
   * Clave del último fallo. Repetir EXACTAMENTE el mismo error (el doble clic
   * accidental sobre «Fijar» con el mismo valor, la misma chapa pulsada dos
   * veces) no vuelve a restar: es un error, no dos. Cualquier acción correcta
   * o un error distinto lo limpian.
   */
  const ultimoFalloRef = useRef<string | null>(null);

  const decir = (texto: string, pista?: boolean) => setLineas((prev) => [...prev, { texto, pista }]);

  /** Resta sólo si este fallo no es la repetición literal del anterior. */
  const fallar = (clave: string, mensaje: string) => {
    if (ultimoFalloRef.current !== clave) {
      ultimoFalloRef.current = clave;
      labActividad.restar();
    }
    decir(mensaje, true);
  };

  const acertar = () => {
    ultimoFalloRef.current = null;
    labActividad.avanzar();
  };

  // ── Arranque ───────────────────────────────────────────────────────────
  const empezar = () => {
    setFase('numeros');
    decir('Cada interruptor vale el doble que el de su derecha. Súbelos hasta que el display marque el número que te pido y pulsa Fijar.');
    decir(NUMEROS[0].consigna);
  };

  // ── Ronda 1 · los cinco números ────────────────────────────────────────
  const tocarInterruptor = (i: number) => {
    if (fase !== 'numeros' || confirmado) return;
    setBits((previos) => alternar(previos, i));
  };

  const fijar = () => {
    const i = idxNumeroRef.current;
    if (fase !== 'numeros' || confirmado || i >= NUMEROS.length) return;
    const reto = NUMEROS[i];
    const valor = aDecimal(bits);
    if (valor !== reto.objetivo) {
      fallar(`numero-${i}-${valor}`, `${pistaDiferencia(valor, reto.objetivo)} Los interruptores siguen como los dejaste: corrige y vuelve a fijar.`);
      return;
    }
    acertar();
    setConfirmado(true);
    decir(`Correcto: ${reto.objetivo} = ${descomposicion(bits)}. En binario se escribe ${textoBinario(bits)}.`);
    decir(reto.remate);
  };

  const siguienteNumero = () => {
    const i = idxNumeroRef.current + 1;
    if (i < NUMEROS.length) {
      idxNumeroRef.current = i;
      setIdxNumero(i);
      setBits(BITS_APAGADOS);
      setConfirmado(false);
      decir(NUMEROS[i].consigna);
      return;
    }
    setFase('escalera');
    decir('Ahora las unidades. Cada escalón es mil veces el anterior, no un poco más. Arma la escalera de menor a mayor.');
  };

  // ── Ronda 2 · la escalera ──────────────────────────────────────────────
  const tocarChapa = (id: string) => {
    if (fase !== 'escalera') return;
    const esperado = ESCALERA[colocados.length];
    if (id !== esperado.id) {
      const elegido = ESCALERA[indiceDe(id)];
      fallar(
        `chapa-${id}-${colocados.length}`,
        `Todavía quedan escalones más pequeños que ${elegido.abrev} sin colocar. ¿Cuál es el más chico de los que siguen en la charola?`,
      );
      return;
    }
    acertar();
    const puestos = [...colocados, id];
    setColocados(puestos);
    decir(`${esperado.nombre} (${esperado.abrev}): ${esperado.factor}.`);
    if (puestos.length === ESCALERA.length) {
      setFase('pesos');
      decir('Escalera completa. Ya puedes estimar: no hace falta el número exacto, basta con saber en qué escalón cae cada cosa.');
      decir(`¿En qué escalón va esto? ${OBJETOS[0].titulo}.`);
    }
  };

  // ── Ronda 3 · cuánto pesa cada cosa ────────────────────────────────────
  const elegirEscalon = (id: string) => {
    const i = idxObjetoRef.current;
    if (fase !== 'pesos' || i >= OBJETOS.length) return;
    const objeto = OBJETOS[i];
    const correcto = escalonDe(objeto.bytes);
    if (id !== correcto.id) {
      const elegido = ESCALERA[indiceDe(id)];
      const direccion = indiceDe(id) < indiceDe(correcto.id) ? 'Sube de escalón' : 'Baja de escalón';
      fallar(
        `objeto-${i}-${id}`,
        `En ${elegido.abrev} no cabe: ${elegido.factor}. ${direccion} y vuelve a intentarlo.`,
      );
      return;
    }
    acertar();
    decir(`${objeto.titulo}: ${objeto.cifra}. ${objeto.porQue}`);
    const siguiente = i + 1;
    idxObjetoRef.current = siguiente;
    setIdxObjeto(siguiente);
    if (siguiente < OBJETOS.length) {
      decir(`¿En qué escalón va esto? ${OBJETOS[siguiente].titulo}.`);
      return;
    }
    setFase('disco');
    decir('Falta el que confunde a todo el mundo, y no es un engaño de nadie.');
  };

  // ── Ronda 4 · la ficha del disco ───────────────────────────────────────
  const responderDisco = (id: string) => {
    if (fase !== 'disco') return;
    if (id !== OPCION_DISCO_CORRECTA) {
      const mensaje =
        id === 'fallado'
          ? 'El disco está sano: si lo formateas, sigue diciendo lo mismo. Un disco fallado da errores de lectura, no una capacidad distinta.'
          : 'No es el sistema ocupando espacio: ese hueco aparece igual en un disco recién sacado de la caja, antes de instalar nada.';
      fallar(`disco-${id}`, mensaje);
      return;
    }
    acertar();
    setFase('cierre');
    decir(
      `Exacto. ${DISCO_GB} GB del fabricante son ${DISCO_GB} 000 000 000 bytes; el sistema los divide entre 1 024 tres veces y muestra ${bytesDelSistema(DISCO_GB)} GB. No es un engaño ni una falla: son dos formas de contar el mismo espacio.`,
    );
  };

  const terminarClase = () => {
    const segundos = Math.round((Date.now() - labActividad.sim.current.inicio) / 1000);
    labActividad.terminar(segundos, () =>
      decir('Leer una ficha técnica ya no es adivinar: sabes qué es un byte y cuánto vale cada escalón.'),
    );
  };

  // ── Pantalla de cierre ─────────────────────────────────────────────────
  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Bits" subtitulo="Consola de bits">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🔢
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: LECTOR DE BITS</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-3">
            Escribiste cinco números con ocho interruptores, armaste la escalera completa de unidades y explicaste por
            qué un disco de {DISCO_GB} GB muestra {bytesDelSistema(DISCO_GB)} GB. Nada de eso era magia: era valor
            posicional y dos formas de contar.
          </p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Puntaje {labActividad.puntaje()} · errores {labActividad.erroresFinal}
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 cbits-boton cian">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const valorActual = aDecimal(bits);
  const retoActual = NUMEROS[idxNumero];
  const objetoActual = idxObjeto < OBJETOS.length ? OBJETOS[idxObjeto] : null;
  const chapasEnCharola = CHAPAS_BARAJADAS.filter((id) => !colocados.includes(id));

  return (
    <VentanaBase marca="Tecnia Bits" subtitulo="Consola de bits">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 p-4 sm:p-6">
        {/* ── El aparato ── */}
        <div className="cbits-panel">
          {fase === 'inicio' ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-extrabold text-white">Consola de bits — lo que vas a hacer</h2>
              <ul className="text-slate-300 text-sm leading-relaxed list-disc pl-5 flex flex-col gap-1.5">
                <li>Formar <strong className="text-cyan-300">cinco números</strong> subiendo interruptores: cada uno vale el doble que el de su derecha.</li>
                <li>Armar la <strong className="text-cyan-300">escalera de unidades</strong> completa, de bit a terabyte.</li>
                <li>Estimar en qué escalón cae <strong className="text-cyan-300">cada archivo</strong> de la vida real.</li>
                <li>Explicar por qué un disco de {DISCO_GB} GB muestra {bytesDelSistema(DISCO_GB)} GB.</li>
              </ul>
              <button type="button" onClick={empezar} className="cbits-boton cian self-start">
                Encender la consola
              </button>
            </div>
          ) : (
            <>
              {/* Display + interruptores: sólo mandan en la ronda 1, pero se
                  quedan a la vista el resto de la clase — lo formado no se borra. */}
              <div className="cbits-display">
                <div>
                  <p className="cbits-display-rotulo">Decimal</p>
                  <p className="cbits-display-decimal" data-testid="display-decimal">
                    {valorActual}
                  </p>
                </div>
                <div className="text-right">
                  <p className="cbits-display-rotulo">Binario · 1 byte</p>
                  <p className="cbits-display-binario" data-testid="display-binario">
                    {textoBinario(bits)}
                  </p>
                </div>
              </div>

              <div className="cbits-fila">
                {VALORES_POSICION.map((valor, i) => (
                  <button
                    key={valor}
                    type="button"
                    className={`cbits-switch${bits[i] ? ' encendido' : ''}`}
                    aria-pressed={bits[i]}
                    aria-label={`Interruptor de valor ${valor}`}
                    disabled={fase !== 'numeros' || confirmado}
                    onClick={() => tocarInterruptor(i)}
                  >
                    <span className="cbits-switch-valor">{valor}</span>
                    <span className="cbits-switch-cuerpo">
                      <span className="cbits-switch-perilla" />
                    </span>
                    <span className="cbits-switch-bit">{bits[i] ? '1' : '0'}</span>
                  </button>
                ))}
              </div>

              {/* ── La escalera: se arma en la ronda 2 y se usa como tablero en la 3 ── */}
              {(fase === 'escalera' || fase === 'pesos' || fase === 'disco' || fase === 'cierre') && (
                <div className="mt-6 flex flex-col-reverse gap-2">
                  {ESCALERA.map((peldano, i) => {
                    const puesto = colocados.includes(peldano.id);
                    const estilo = { '--peldano-color': peldano.color } as CSSProperties;
                    const contenido = (
                      <>
                        <span className="cbits-peldano-abrev">{puesto ? peldano.abrev : `${i + 1}`}</span>
                        <span className="flex-1 text-left">
                          <span className="block text-white font-bold text-sm">{puesto ? peldano.nombre : 'Peldaño vacío'}</span>
                          <span className="block text-slate-400 text-xs">{puesto ? peldano.factor : 'Coloca aquí la chapa que toca'}</span>
                        </span>
                      </>
                    );
                    return fase === 'pesos' && objetoActual ? (
                      <button
                        key={peldano.id}
                        type="button"
                        className={`cbits-peldano${puesto ? ' puesto' : ''}`}
                        style={estilo}
                        aria-label={`Elegir ${peldano.nombre} (${peldano.abrev})`}
                        onClick={() => elegirEscalon(peldano.id)}
                      >
                        {contenido}
                      </button>
                    ) : (
                      <div key={peldano.id} className={`cbits-peldano${puesto ? ' puesto' : ''}`} style={estilo}>
                        {contenido}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── La charola de chapas de la ronda 2 ── */}
              {fase === 'escalera' && (
                <div className="mt-5">
                  <p className="cbits-display-rotulo mb-2">Charola de chapas</p>
                  <div className="flex flex-wrap gap-2.5">
                    {chapasEnCharola.map((id) => {
                      const peldano = ESCALERA[indiceDe(id)];
                      return (
                        <button
                          key={id}
                          type="button"
                          className="cbits-chapa"
                          style={{ '--chapa-color': peldano.color } as CSSProperties}
                          aria-label={`Colocar ${peldano.nombre} (${peldano.abrev})`}
                          onClick={() => tocarChapa(id)}
                        >
                          {peldano.abrev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── La ficha del disco de la ronda 4 ── */}
              {fase === 'disco' && (
                <div className="mt-6 rounded-2xl border border-amber-400/50 bg-[#0d1526] p-5">
                  <p className="text-amber-300 font-extrabold text-sm uppercase tracking-wide mb-2">La ficha del disco</p>
                  <p className="text-slate-200 text-sm mb-4">
                    Compras un disco que en la caja dice <strong className="text-white">{DISCO_GB} GB</strong>. Lo
                    conectas y el sistema dice <strong className="text-white">{bytesDelSistema(DISCO_GB)} GB</strong>.
                    ¿Qué pasó?
                  </p>
                  <div className="flex flex-col gap-2">
                    {OPCIONES_DISCO.map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => responderDisco(opcion.id)}
                        className="text-left text-sm text-slate-100 font-semibold rounded-xl px-4 py-3 bg-[#152742] border border-slate-600 hover:border-amber-400"
                      >
                        {opcion.texto}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── La consola de Bit: consigna, mensajes y el botón que manda ── */}
        <div className="flex flex-col gap-4">
          <div className="cbits-consola flex-1">
            <p className="cbits-display-rotulo mb-2">Bit · consola</p>
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
              {lineas.map((linea, i) => (
                <p key={i} className={`cbits-linea${linea.pista ? ' pista' : ''}`}>
                  {linea.texto}
                </p>
              ))}
            </div>
          </div>

          {fase === 'numeros' && (
            <div className="cbits-consola flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-extrabold">
                Número {idxNumero + 1} de {NUMEROS.length}
              </p>
              <p className="text-white font-bold text-lg">Forma el {retoActual.objetivo}</p>
              {confirmado ? (
                <button type="button" onClick={siguienteNumero} className="cbits-boton verde">
                  {idxNumero + 1 < NUMEROS.length ? 'Siguiente número' : 'Pasar a las unidades'}
                </button>
              ) : (
                <button type="button" onClick={fijar} className="cbits-boton">
                  Fijar {valorActual}
                </button>
              )}
            </div>
          )}

          {fase === 'escalera' && (
            <div className="cbits-consola">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-extrabold mb-1">
                Escalera · {colocados.length} de {ESCALERA.length}
              </p>
              <p className="text-slate-300 text-sm">
                Coloca las chapas de la charola <strong className="text-white">de menor a mayor</strong>. Cada escalón
                es mil veces el anterior.
              </p>
            </div>
          )}

          {fase === 'pesos' && objetoActual && (
            <div className="cbits-consola">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-extrabold mb-1">
                Objeto {idxObjeto + 1} de {OBJETOS.length}
              </p>
              <p className="text-white font-bold text-base">
                <span aria-hidden="true">{objetoActual.icono} </span>
                {objetoActual.titulo}
              </p>
              <p className="text-slate-400 text-sm mt-1">Pulsa el escalón de la escalera en el que cae.</p>
            </div>
          )}

          {fase === 'cierre' && (
            <button type="button" onClick={terminarClase} className="cbits-boton verde">
              Terminar
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

export default LabBinarioYUnidades;
