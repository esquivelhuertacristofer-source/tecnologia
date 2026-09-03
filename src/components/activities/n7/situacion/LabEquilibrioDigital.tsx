'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';

/**
 * N7·«Ciudadanía digital crítica» · «Equilibrio digital» — tercera y última
 * clase de la unidad, y la única de las tres que NO abre Tecnia Muro: el
 * programa que el alumno usa aquí es "Tecnia Avisos", el centro de
 * notificaciones del teléfono, construido local a este archivo (ver nota en
 * `EntradaEquilibrioDigital.tsx` sobre por qué no es un armazón compartido).
 *
 * La mecánica NO castiga con puntaje —igual que sus dos hermanas
 * (`n6-privacidad-en-juegos`, `n6-alto-al-ciberacoso`, `n7-privacidad-en-
 * redes`), nunca se llama `restar()` aquí—: elegir la opción menos
 * conveniente no baja el puntaje ni te saca de la clase, sólo te enseña la
 * consecuencia natural y te deja el botón bueno disponible para intentarlo
 * otra vez. Lo que SÍ cambia aviso a aviso, a propósito, es CUÁL de los dos
 * botones es el que avanza: con el meme de los amigos avanza "espera"; con
 * mamá avanza "contesta ya". La lección no es "ignora siempre" ni "revisa
 * siempre" — es que el equilibrio depende de qué tan urgente es el aviso,
 * no de qué tan fuerte suena.
 *
 * `terminar()` reporta el tiempo real jugado
 * (`Math.round((Date.now() - inicio) / 1000)`), no un número inventado — el
 * defecto que `COMO-SE-CONSTRUYE.md` §1 documenta en cinco clases de la casa
 * (`pasos * 20` / `* 25`) y que esta clase no repite.
 */

interface FuenteAviso {
  nombre: string;
  icono: string;
  acento: string;
}

const FUENTE_AMIGOS: FuenteAviso = { nombre: 'Grupo Amigos 9°B', icono: '💬', acento: '#22d3ee' };
const FUENTE_MAMA: FuenteAviso = { nombre: 'Mamá', icono: '👩', acento: '#34d399' };
const FUENTE_JUEGO: FuenteAviso = { nombre: 'Reino de Cristal', icono: '🎮', acento: '#f87171' };
const FUENTE_KEVIN: FuenteAviso = { nombre: 'Kevin', icono: '🧑', acento: '#a78bfa' };

type Fase = 'inicio' | 'amigos' | 'mama' | 'app-trampa' | 'modo-enfoque' | 'noche' | 'cierre';

const TOTAL_PASOS = 6;

export function LabEquilibrioDigital(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});

  const [fase, setFase] = useState<Fase>('inicio');
  const [historial, setHistorial] = useState<string[]>([
    'Es viernes en la noche. Tienes tarea pendiente, la cena está por servirse y mañana hay clase temprano. El teléfono no ha dejado de sonar.',
  ]);

  const [amigosOn, setAmigosOn] = useState(true);
  const [juegoOn, setJuegoOn] = useState(true);
  const [mamaOn, setMamaOn] = useState(true);

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  const empezar = () => {
    labActividad.avanzar();
    setFase('amigos');
  };

  // --- Aviso 1: el meme de los amigos, en medio del ejercicio de mate ---
  const amigosAbrirAhora = () => {
    decir(
      'Cierras el meme a los veinte segundos... pero te cuesta seis minutos volver a entender en qué paso del ejercicio ibas. Cambiar de tarea tiene un costo, aunque el aviso dure un segundo.',
    );
  };
  const amigosSeguirTarea = () => {
    decir('Terminas el ejercicio de un tirón. El meme sigue ahí para cuando hagas una pausa real — no se va a ir a ningún lado.');
    labActividad.avanzar();
    setFase('mama');
  };

  // --- Aviso 2: mamá avisa que la cena se enfría ---
  const mamaDejarParaDespues = () => {
    decir(
      'Pasan diez minutos y mamá toca la puerta preocupada: pensó que no habías visto el mensaje. No es que hayas hecho algo malo — es que este aviso sí era de los que no esperan.',
    );
  };
  const mamaContestarYa = () => {
    decir('"¡Ya voy!" — tres palabras y sigues con lo tuyo. Contestar rápido a lo que sí importa no te saca de nada.');
    labActividad.avanzar();
    setFase('app-trampa');
  };

  // --- Aviso 3: el cofre "por tiempo limitado" del juego ---
  const trampaAbrir = () => {
    decir(
      'Adentro, el cofre "gratis" pide ver un anuncio de treinta segundos. Apenas termina, aparece OTRO cofre "por tiempo limitado" distinto. El reloj nunca se acaba de verdad — está hecho para que sigas mirando.',
    );
  };
  const trampaIgnorar = () => {
    decir(
      'El juego va a seguir ofreciendo cofres "urgentes" toda la noche, todas las noches. Reconocer la trampa es la mitad del trabajo — la otra mitad es no picar.',
    );
    labActividad.avanzar();
    setFase('modo-enfoque');
  };

  // --- Ajuste de avisos: elegir qué se queda sonando para el resto de la tarea ---
  const guardarAjuste = () => {
    if (mamaOn === false) {
      decir('Silenciaste hasta a mamá. Si de verdad pasa algo, no te vas a enterar a tiempo — a ella siempre la dejas sonando.');
      return;
    }
    if (amigosOn || juegoOn) {
      decir('Dejaste sonando algo que sí puede esperar. Mientras siga encendido, vas a seguir cortando el ejercicio cada rato.');
      return;
    }
    decir(
      'Silenciaste lo que podía esperar y dejaste sonando lo único que no. Eso es el equilibrio de verdad: no es apagar todo, es elegir qué se queda prendido.',
    );
    labActividad.avanzar();
    setFase('noche');
  };

  // --- Aviso 5: Kevin, ya de noche, quiere intercambiar algo del juego ---
  const nocheContestar = () => {
    decir(
      'Veinte minutos después siguen platicando de intercambios. No pasa nada grave por una vez, pero acostarte más tarde sí se nota mañana en clase.',
    );
  };
  const nocheDejarParaManana = () => {
    decir(
      'Apagas la pantalla. Kevin lo va a leer en la mañana y no le va a importar la espera — un intercambio de un juego siempre puede esperar a que hayas dormido.',
    );
    labActividad.avanzar();
    setFase('cierre');
  };

  const terminar = () => {
    const segundos = Math.round((Date.now() - labActividad.sim.current.inicio) / 1000);
    labActividad.terminar(segundos);
  };

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Avisos" subtitulo="Equilibrio digital">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🧘
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe elegir cuándo conectarse</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            No revisaste todo, y tampoco lo apagaste todo. Fuiste distinguiendo qué sí podía esperar y qué no — eso es
            el equilibrio digital: no una regla fija, una decisión que se repite cada vez que suena el teléfono.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  return (
    <VentanaBase marca="Tecnia Avisos" subtitulo="Equilibrio digital">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <PantallaTelefono fase={fase} amigosOn={amigosOn} juegoOn={juegoOn} mamaOn={mamaOn} />
        </div>

        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          <div className="flex flex-col gap-2">
            {historial.map((linea, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">
                {linea}
              </p>
            ))}
          </div>

          {fase === 'inicio' && (
            <button type="button" onClick={empezar} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Empezar
            </button>
          )}

          {fase === 'amigos' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Aviso 1 de 4 · A media tarea</p>
              <button type="button" onClick={amigosAbrirAhora} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Lo abro tantito
              </button>
              <button type="button" onClick={amigosSeguirTarea} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Sigo con el ejercicio, lo veo en el descanso
              </button>
            </div>
          )}

          {fase === 'mama' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Aviso 2 de 4 · Antes de cenar</p>
              <button type="button" onClick={mamaDejarParaDespues} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Lo dejo para cuando termine, así no pierdo el hilo
              </button>
              <button type="button" onClick={mamaContestarYa} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Le contesto ya, es un segundo
              </button>
            </div>
          )}

          {fase === 'app-trampa' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Aviso 3 de 4 · El cofre urgente</p>
              <button type="button" onClick={trampaAbrir} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Lo abro, dice que se acaba en dos minutos
              </button>
              <button type="button" onClick={trampaIgnorar} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Ese tiempo límite no es real, sigo en lo mío
              </button>
            </div>
          )}

          {fase === 'modo-enfoque' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Antes de seguir con la tarea</p>
              <p className="text-sm text-slate-300">Elige a quién dejas sonar el resto de la noche.</p>
              <Interruptor etiqueta={FUENTE_AMIGOS.nombre} encendido={amigosOn} onCambiar={() => setAmigosOn((v) => !v)} />
              <Interruptor etiqueta={FUENTE_JUEGO.nombre} encendido={juegoOn} onCambiar={() => setJuegoOn((v) => !v)} />
              <Interruptor etiqueta={FUENTE_MAMA.nombre} encendido={mamaOn} onCambiar={() => setMamaOn((v) => !v)} />
              <button type="button" onClick={guardarAjuste} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Guardar y seguir con la tarea
              </button>
            </div>
          )}

          {fase === 'noche' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Aviso 4 de 4 · Ya es de noche</p>
              <button type="button" onClick={nocheContestar} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                Le contesto, nomás reviso
              </button>
              <button type="button" onClick={nocheDejarParaManana} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Le contesto mañana, ya toca dormir
              </button>
            </div>
          )}

          {fase === 'cierre' && (
            <button type="button" onClick={terminar} className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

/** La pantalla del teléfono: una tarjeta de aviso, o el panel de ajustes en la fase `modo-enfoque`. */
function PantallaTelefono({
  fase,
  amigosOn,
  juegoOn,
  mamaOn,
}: {
  fase: Fase;
  amigosOn: boolean;
  juegoOn: boolean;
  mamaOn: boolean;
}) {
  const AVISO_POR_FASE: Partial<Record<Fase, { fuente: FuenteAviso; hora: string; texto: string; urgente?: boolean }>> = {
    amigos: { fuente: FUENTE_AMIGOS, hora: '8:12 pm', texto: 'Mira este meme 😂😂😂' },
    mama: { fuente: FUENTE_MAMA, hora: '8:31 pm', texto: '¿Ya casi? La cena se enfría' },
    'app-trampa': { fuente: FUENTE_JUEGO, hora: '8:34 pm', texto: '¡Cofre legendario gratis! Sólo por 2 minutos ⏳', urgente: true },
    noche: { fuente: FUENTE_KEVIN, hora: '11:02 pm', texto: '¿ya viste que se puede cambiar el arma del evento? te cambio la mía' },
  };

  const aviso = AVISO_POR_FASE[fase];

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-gradient-to-b from-[#0a1120] to-[#050810] p-6 flex flex-col items-center gap-5 min-h-[360px]">
      <p className="text-slate-400 text-sm font-semibold tracking-wide">{aviso ? aviso.hora : 'Tu teléfono'}</p>

      {fase === 'modo-enfoque' ? (
        <div className="w-full max-w-sm rounded-2xl bg-[#0f1b30] border border-slate-700 p-5 flex flex-col gap-3">
          <p className="text-white font-bold">Avisos activos</p>
          <FilaFuente fuente={FUENTE_AMIGOS} encendido={amigosOn} />
          <FilaFuente fuente={FUENTE_JUEGO} encendido={juegoOn} />
          <FilaFuente fuente={FUENTE_MAMA} encendido={mamaOn} />
        </div>
      ) : aviso ? (
        <div
          className="w-full max-w-sm rounded-2xl bg-[#0f1b30] border-2 p-5 flex flex-col gap-2"
          style={{ borderColor: aviso.urgente ? '#f87171' : aviso.fuente.acento }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {aviso.fuente.icono}
            </span>
            <span className="text-white font-bold flex-1">{aviso.fuente.nombre}</span>
            {aviso.urgente && (
              <span className="text-xs font-extrabold text-red-400 uppercase tracking-wide">2:00 restantes</span>
            )}
          </div>
          <p className="text-slate-200 text-sm">{aviso.texto}</p>
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-2xl bg-[#0f1b30] border border-slate-800 p-8 text-center">
          <p className="text-slate-400 text-sm">Sin avisos pendientes por ahora.</p>
        </div>
      )}
    </div>
  );
}

function FilaFuente({ fuente, encendido }: { fuente: FuenteAviso; encendido: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg" aria-hidden="true">
        {fuente.icono}
      </span>
      <span className="text-slate-200 text-sm flex-1">{fuente.nombre}</span>
      <span className={`text-xs font-bold ${encendido ? 'text-emerald-400' : 'text-slate-500'}`}>
        {encendido ? 'Sonando' : 'Silenciado'}
      </span>
    </div>
  );
}

function Interruptor({ etiqueta, encendido, onCambiar }: { etiqueta: string; encendido: boolean; onCambiar: () => void }) {
  return (
    <button
      type="button"
      onClick={onCambiar}
      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0f1b30] border border-slate-700"
      aria-pressed={encendido}
    >
      <span className="text-slate-200 text-sm">{etiqueta}</span>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${encendido ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
        {encendido ? 'Sonando' : 'Silenciado'}
      </span>
    </button>
  );
}

export default LabEquilibrioDigital;
