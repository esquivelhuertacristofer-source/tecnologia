'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { VentanaCorreo, type MensajeCorreo } from '@/components/simuladores/correo';
import { VentanaNavegador, type PaginaWeb } from '@/components/simuladores/navegador';
import {
  accesoBloqueado,
  analizarContrasena,
  CASOS_ACCESO,
  CONTRASENA_EJEMPLO,
  DOMINIO_OFICIAL,
  MENSAJE_LEGITIMO,
  MENSAJE_PHISHING,
  OPCIONES_DIAGNOSTICO,
  PERFIL_PUBLICO,
  SITIO_ADVERTENCIA,
  SITIO_INSEGURO,
  debilidadesReales,
  identidadConfirmada,
  mismoConjunto,
  pareceLegitimo,
  protegeEnTransito,
  type CasoAcceso,
} from './motorIdentidad';

/**
 * N10 · «Ciberseguridad profesional», parada 2 de 3 · «Identidad,
 * autenticación y cifrado». **N10 = Bachillerato = 15–18 años**, tono
 * «Perfil profesional» — sin mascota ni voz, como `n8-cifrado-basico`.
 *
 * Diez encargos en cinco fases, un solo `indice` lineal, todos con veredicto
 * calculado por `motorIdentidad.ts` sobre datos reales (el texto que escribe
 * el alumno, el caso de acceso, el correo, la página) — nunca contra un
 * string fijo escrito a mano:
 *
 *   1–2  Tecnia Identidad   — diagnóstico + construcción de contraseña real
 *   3–5  Tecnia Accesos     — tres casos de doble factor, `accesoBloqueado`
 *   6–7  Tecnia Correo      — phishing dirigido, `pareceLegitimo`
 *   8–9  Tecnia Navegador   — candado profundizado, dos preguntas reales
 *   10   Reflexión de cierre — síntesis de defensa en capas
 *
 * Cada tipo de paso necesita su propio estado local (texto tecleado,
 * casillas marcadas, respuestas de sí/no) — no cabe en un único componente
 * sin violar las reglas de hooks entre ramas condicionales, así que cada
 * fase vive en su propio componente, montado con `key={paso.id}` para que
 * el estado se reinicie solo al cambiar de encargo.
 *
 * Sin `PortadaWeb` interna ni envoltura propia: `VentanaBase` es la raíz que
 * devuelve el componente, igual que `n8-cifrado-basico`/`n9-empleos-tecnologicos`
 * (paneles sin `ArcadeSala`). Una `<div>` extra alrededor de `VentanaBase` para
 * superponer una portada de objetivos rompía la regla CSS
 * `.act-frame--inmersivo > .vtb-marco` (hijo directo) que blinda el layout
 * inmersivo — encontrado jugando en vivo: el panel se renderizaba encogido y
 * mal posicionado dentro del scroll normal del hub, no a pantalla completa.
 * La portada de objetivos de `EntradaN4Base` (fichas, arranqueSub) ya cumple
 * ese requisito antes de entrar al laboratorio; no hace falta una segunda.
 */

// ───────────────────────────────────────────────────────────────────────────
// El guion — 10 encargos, un solo índice lineal
// ───────────────────────────────────────────────────────────────────────────

interface PasoPasswordDiagnostico {
  tipo: 'password-diagnostico';
  id: string;
}
interface PasoPasswordConstruye {
  tipo: 'password-construye';
  id: string;
}
interface PasoAcceso {
  tipo: 'acceso';
  id: string;
  caso: CasoAcceso;
}
interface PasoCorreo {
  tipo: 'correo';
  id: string;
  mensaje: MensajeCorreo;
}
interface PasoCandado {
  tipo: 'candado';
  id: string;
  pagina: PaginaWeb;
  contexto: string;
}
interface PasoReflexion {
  tipo: 'reflexion';
  id: string;
  pregunta: string;
  opciones: { id: string; texto: string }[];
  correctaId: string;
  explicacion: string;
}

type Paso = PasoPasswordDiagnostico | PasoPasswordConstruye | PasoAcceso | PasoCorreo | PasoCandado | PasoReflexion;

const PASOS: Paso[] = [
  { tipo: 'password-diagnostico', id: 'p1-diagnostico' },
  { tipo: 'password-construye', id: 'p2-construye' },
  { tipo: 'acceso', id: 'p3-acceso', caso: CASOS_ACCESO[0] },
  { tipo: 'acceso', id: 'p4-acceso', caso: CASOS_ACCESO[1] },
  { tipo: 'acceso', id: 'p5-acceso', caso: CASOS_ACCESO[2] },
  { tipo: 'correo', id: 'p6-correo', mensaje: MENSAJE_PHISHING },
  { tipo: 'correo', id: 'p7-correo', mensaje: MENSAJE_LEGITIMO },
  {
    tipo: 'candado',
    id: 'p8-candado',
    pagina: SITIO_INSEGURO,
    contexto:
      'El portal de prácticas no muestra ningún candado en la barra de direcciones. Antes de escribir la contraseña de Regina, responde las dos preguntas.',
  },
  {
    tipo: 'candado',
    id: 'p9-candado',
    pagina: SITIO_ADVERTENCIA,
    contexto:
      'CertificaPro sí muestra HTTPS, pero el navegador avisa que el certificado no es válido. Responde las dos preguntas para este caso.',
  },
  {
    tipo: 'reflexion',
    id: 'p10-reflexion',
    pregunta:
      'Un atacante consiguió la contraseña de Regina mediante el correo de phishing que acabas de revisar. Su cuenta de Orbitatek tiene activada una aplicación autenticadora como segundo factor. ¿Qué evita que el atacante entre?',
    opciones: [
      { id: 'a', texto: 'Nada: si ya tiene la contraseña, el segundo factor no importa.' },
      {
        id: 'b',
        texto:
          'El atacante necesitaría también el dispositivo físico donde vive la aplicación autenticadora, algo que el correo de phishing nunca le entregó.',
      },
      { id: 'c', texto: 'El candado HTTPS del sitio bloquea el inicio de sesión automáticamente.' },
      { id: 'd', texto: 'Cambiar la contraseña cada mes, sin relación con el segundo factor.' },
    ],
    correctaId: 'b',
    explicacion:
      'Cada capa cubre lo que la anterior no cubre: una contraseña fuerte no sirve de nada si viaja por phishing, pero un segundo factor que vive en un dispositivo físico —no en la línea telefónica— sigue deteniendo al atacante aunque la contraseña ya esté en sus manos. Por eso la defensa profesional nunca depende de una sola capa.',
  },
];

function nivelRiesgo(errores: number): string {
  if (errores === 0) return 'CONTROLADO';
  if (errores <= 2) return 'MODERADO';
  return 'ELEVADO';
}

// ───────────────────────────────────────────────────────────────────────────
// La pieza compartida: instrucción + controles + veredicto + avanzar
// ───────────────────────────────────────────────────────────────────────────

interface PanelAccionProps {
  instruccion: ReactNode;
  resuelto: boolean;
  acierto?: boolean;
  feedbackCorrecto: ReactNode;
  feedbackIncorrecto: ReactNode;
  onAvanzar: () => void;
  esUltimo: boolean;
  children?: ReactNode;
}

function PanelAccion({
  instruccion,
  resuelto,
  acierto,
  feedbackCorrecto,
  feedbackIncorrecto,
  onAvanzar,
  esUltimo,
  children,
}: PanelAccionProps) {
  return (
    <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
      <p className="text-sm text-slate-200 leading-relaxed">{instruccion}</p>
      {!resuelto && children}
      {resuelto && (
        <div className="flex flex-col gap-2">
          <p className={`text-sm font-bold ${acierto ? 'text-emerald-400' : 'text-rose-400'}`}>
            {acierto ? 'Correcto.' : 'No exactamente.'}
          </p>
          <div className="text-sm text-slate-200 leading-relaxed">{acierto ? feedbackCorrecto : feedbackIncorrecto}</div>
          <button
            type="button"
            onClick={onAvanzar}
            className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold mt-2"
          >
            {esUltimo ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );
}

interface PropsPaso {
  resuelto: boolean;
  acierto?: boolean;
  onResolver: (acierto: boolean) => void;
  onAvanzar: () => void;
  esUltimo: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// 1 · Diagnóstico de contraseña
// ───────────────────────────────────────────────────────────────────────────

function PasoDiagnosticoView({ resuelto, acierto, onResolver, onAvanzar, esUltimo }: PropsPaso) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const analisis = useMemo(() => analizarContrasena(CONTRASENA_EJEMPLO, PERFIL_PUBLICO), []);
  const correctas = useMemo(() => debilidadesReales(analisis), [analisis]);

  const alternar = (id: string) => {
    if (resuelto) return;
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  };

  const textoCorrectas = OPCIONES_DIAGNOSTICO.filter((o) => correctas.has(o.id))
    .map((o) => o.texto)
    .join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 flex flex-col gap-4">
        <p className="text-sm text-slate-300">
          Ficha pública de {PERFIL_PUBLICO.nombrePila} {PERFIL_PUBLICO.apellido} — visible para cualquiera:
        </p>
        <ul className="text-sm text-slate-300 grid grid-cols-2 gap-y-2 gap-x-4">
          <li>
            Nombre completo: {PERFIL_PUBLICO.nombrePila} {PERFIL_PUBLICO.apellido}
          </li>
          <li>Año de nacimiento: {PERFIL_PUBLICO.anioNacimiento}</li>
          <li>Mascota: {PERFIL_PUBLICO.mascota}</li>
          <li>Equipo favorito: {PERFIL_PUBLICO.equipoFavorito}</li>
        </ul>
        <p className="text-sm text-slate-400 mt-2">Contraseña que Regina usó para su cuenta nueva en Orbitatek:</p>
        <p className="font-mono text-2xl tracking-widest text-white break-all">{CONTRASENA_EJEMPLO}</p>
      </div>

      <PanelAccion
        instruccion="Marca todas las debilidades reales de esta contraseña, comparándola contra la ficha pública de Regina."
        resuelto={resuelto}
        acierto={acierto}
        onAvanzar={onAvanzar}
        esUltimo={esUltimo}
        feedbackCorrecto="Identificaste exactamente las debilidades que existen: nada de más, nada de menos."
        feedbackIncorrecto={`El análisis real de «${CONTRASENA_EJEMPLO}»: ${textoCorrectas || 'ninguna de las opciones listadas aplica.'}`}
      >
        <div className="flex flex-col gap-2">
          {OPCIONES_DIAGNOSTICO.map((o) => (
            <label key={o.id} className="flex items-start gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={seleccion.has(o.id)} onChange={() => alternar(o.id)} className="mt-1" />
              {o.texto}
            </label>
          ))}
          <button
            type="button"
            onClick={() => onResolver(mismoConjunto(seleccion, correctas))}
            className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold mt-2"
          >
            Confirmar diagnóstico
          </button>
        </div>
      </PanelAccion>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Construcción de contraseña
// ───────────────────────────────────────────────────────────────────────────

function PasoConstruyeView({ resuelto, acierto, onResolver, onAvanzar, esUltimo }: PropsPaso) {
  const [valor, setValor] = useState('');
  const analisis = useMemo(() => analizarContrasena(valor, PERFIL_PUBLICO), [valor]);

  const criterios = [
    { ok: analisis.longitudSuficiente, texto: `Al menos 12 caracteres (lleva ${analisis.longitud}).` },
    { ok: analisis.variedadSuficiente, texto: `Combina al menos 3 tipos de caracteres (lleva ${analisis.variedadDeClases}).` },
    {
      ok: analisis.datosPublicosReutilizados.length === 0,
      texto:
        analisis.datosPublicosReutilizados.length === 0
          ? 'No reutiliza ningún dato de la ficha pública.'
          : `Reutiliza: ${analisis.datosPublicosReutilizados.join(', ')}.`,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Escribe una contraseña profesional para la cuenta de Regina en Orbitatek:
          <input
            type="text"
            value={valor}
            disabled={resuelto}
            onChange={(e) => setValor(e.target.value)}
            className="font-mono text-lg bg-[#050811] border border-cyan-500/40 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
            aria-label="Nueva contraseña"
          />
        </label>
        <ul className="flex flex-col gap-1 text-sm">
          {criterios.map((c, i) => (
            <li key={i} className={c.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {c.ok ? '✔' : '✘'} {c.texto}
            </li>
          ))}
        </ul>
      </div>

      <PanelAccion
        instruccion="Construye una contraseña que cumpla los tres criterios de la izquierda antes de guardarla."
        resuelto={resuelto}
        acierto={acierto}
        onAvanzar={onAvanzar}
        esUltimo={esUltimo}
        feedbackCorrecto="Cumple longitud, variedad y no reutiliza ningún dato público: así se ve una contraseña profesional."
        feedbackIncorrecto="No llegó a cumplir los tres criterios."
      >
        <button
          type="button"
          disabled={!analisis.esFuerte}
          onClick={() => onResolver(true)}
          className="px-4 py-3 rounded-xl bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold"
        >
          Guardar contraseña
        </button>
      </PanelAccion>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · Casos de doble factor
// ───────────────────────────────────────────────────────────────────────────

function PasoAccesoView({ caso, resuelto, acierto, onResolver, onAvanzar, esUltimo }: PropsPaso & { caso: CasoAcceso }) {
  const bloqueado = accesoBloqueado(caso);

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-cyan-400 font-bold">{caso.titulo}</p>
      <p className="text-base text-white leading-relaxed">{caso.descripcion}</p>
      {!resuelto && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onResolver(bloqueado)}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold"
          >
            🛡️ El acceso queda bloqueado
          </button>
          <button
            type="button"
            onClick={() => onResolver(!bloqueado)}
            className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-bold"
          >
            ⚠️ La cuenta queda comprometida
          </button>
        </div>
      )}
      {resuelto && (
        <div className="flex flex-col gap-2">
          <p className={`text-sm font-bold ${acierto ? 'text-emerald-400' : 'text-rose-400'}`}>
            {acierto ? 'Correcto.' : 'No exactamente.'}
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {bloqueado
              ? 'En este caso el segundo factor detiene al atacante: no controla el medio por el que llega el código.'
              : 'En este caso el segundo factor no protege: el atacante controla exactamente lo que hacía falta para completarlo.'}
          </p>
          <button
            type="button"
            onClick={onAvanzar}
            className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold mt-2"
          >
            {esUltimo ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · Correos — phishing dirigido a la identidad
// ───────────────────────────────────────────────────────────────────────────

function PasoCorreoView({ mensaje, resuelto, acierto, onResolver, onAvanzar, esUltimo }: PropsPaso & { mensaje: MensajeCorreo }) {
  const [inspeccionado, setInspeccionado] = useState(false);
  const legitimo = pareceLegitimo(mensaje, DOMINIO_OFICIAL);

  const decidir = (creeLegitimo: boolean) => onResolver(creeLegitimo === legitimo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <VentanaCorreo
        carpetas={['recibidos']}
        carpetaActiva="recibidos"
        mensajes={[mensaje]}
        abierto={mensaje}
        mostrarDireccion
        mostrarDestino={inspeccionado}
        onEnlace={() => setInspeccionado(true)}
      />

      <PanelAccion
        instruccion="Revisa la dirección real del remitente y, antes de decidir, pulsa el enlace del correo para inspeccionar a dónde lleva de verdad. ¿Es un correo legítimo o un intento de robar la identidad de Regina?"
        resuelto={resuelto}
        acierto={acierto}
        onAvanzar={onAvanzar}
        esUltimo={esUltimo}
        feedbackCorrecto={
          legitimo
            ? 'El dominio del remitente coincide con orbitatek.mx y el enlace lleva exactamente a donde dice ir: es legítimo.'
            : 'El dominio del remitente no es orbitatek.mx, o el enlace lleva a un destino distinto del que muestra: es un intento de phishing.'
        }
        feedbackIncorrecto={
          legitimo
            ? 'En realidad el dominio del remitente y el destino del enlace sí coinciden con orbitatek.mx: era legítimo.'
            : 'En realidad el dominio del remitente o el destino del enlace no coinciden con orbitatek.mx: era phishing.'
        }
      >
        <div className="flex flex-col gap-2">
          {!inspeccionado && (
            <p className="text-xs text-amber-300">
              Pulsa el enlace dentro del correo para ver a dónde lleva de verdad antes de decidir.
            </p>
          )}
          <button
            type="button"
            disabled={!inspeccionado}
            onClick={() => decidir(true)}
            className="px-4 py-3 rounded-xl bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold"
          >
            Es legítimo
          </button>
          <button
            type="button"
            disabled={!inspeccionado}
            onClick={() => decidir(false)}
            className="px-4 py-3 rounded-xl bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
          >
            Es un intento de phishing
          </button>
        </div>
      </PanelAccion>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 5 · Candado profundizado — tránsito vs. identidad
// ───────────────────────────────────────────────────────────────────────────

function BotonSiNo({
  etiqueta,
  valor,
  onElegir,
}: {
  etiqueta: string;
  valor: boolean | null;
  onElegir: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm text-slate-300 mb-1">{etiqueta}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onElegir(true)}
          className={`flex-1 px-3 py-2 rounded-lg font-bold ${valor === true ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-white'}`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onElegir(false)}
          className={`flex-1 px-3 py-2 rounded-lg font-bold ${valor === false ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-white'}`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function PasoCandadoView({
  pagina,
  contexto,
  resuelto,
  acierto,
  onResolver,
  onAvanzar,
  esUltimo,
}: PropsPaso & { pagina: PaginaWeb; contexto: string }) {
  const [transito, setTransito] = useState<boolean | null>(null);
  const [identidad, setIdentidad] = useState<boolean | null>(null);
  const transitoReal = protegeEnTransito(pagina);
  const identidadReal = identidadConfirmada(pagina);
  const listo = transito !== null && identidad !== null;

  const decidir = () => {
    if (!listo) return;
    onResolver(transito === transitoReal && identidad === identidadReal);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <VentanaNavegador
        pestanas={[{ id: 't1', activa: true, titulo: pagina.pestana }]}
        pagina={pagina}
        barraDireccion={{ valor: pagina.url, onCambiar: () => {}, onIr: () => {} }}
      />

      <PanelAccion
        instruccion={contexto}
        resuelto={resuelto}
        acierto={acierto}
        onAvanzar={onAvanzar}
        esUltimo={esUltimo}
        feedbackCorrecto="Distinguiste bien las dos protecciones: cifrar el canal no es lo mismo que confirmar quién está del otro lado."
        feedbackIncorrecto={`En este sitio, el canal ${transitoReal ? 'SÍ' : 'NO'} viaja cifrado, y la identidad del sitio ${identidadReal ? 'SÍ' : 'NO'} está confirmada.`}
      >
        <div className="flex flex-col gap-3">
          <BotonSiNo etiqueta="¿Tus datos viajan cifrados mientras cruzan la red?" valor={transito} onElegir={setTransito} />
          <BotonSiNo etiqueta="¿Puedes confirmar que hablas con el sitio real?" valor={identidad} onElegir={setIdentidad} />
          <button
            type="button"
            disabled={!listo}
            onClick={decidir}
            className="px-4 py-3 rounded-xl bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold mt-2"
          >
            Confirmar
          </button>
        </div>
      </PanelAccion>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 6 · Reflexión de cierre
// ───────────────────────────────────────────────────────────────────────────

function PasoReflexionView({
  paso,
  resuelto,
  acierto,
  onResolver,
  onAvanzar,
  esUltimo,
}: PropsPaso & { paso: PasoReflexion }) {
  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6">
      <p className="text-lg text-white font-semibold leading-relaxed">{paso.pregunta}</p>
      {!resuelto && (
        <div className="flex flex-col gap-2">
          {paso.opciones.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onResolver(o.id === paso.correctaId)}
              className="px-4 py-3 rounded-xl bg-slate-700 text-white text-sm font-semibold text-left"
            >
              {o.texto}
            </button>
          ))}
        </div>
      )}
      {resuelto && (
        <div className="flex flex-col gap-2">
          <p className={`text-sm font-bold ${acierto ? 'text-emerald-400' : 'text-rose-400'}`}>
            {acierto ? 'Correcto.' : 'No exactamente.'}
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">{paso.explicacion}</p>
          <button
            type="button"
            onClick={onAvanzar}
            className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold mt-2"
          >
            {esUltimo ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// El laboratorio
// ───────────────────────────────────────────────────────────────────────────

export function LabIdentidadYCifrado(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, PASOS.length, {});

  const [indice, setIndice] = useState(0);
  const [veredictos, setVeredictos] = useState<Record<string, boolean>>({});
  const [erroresVivos, setErroresVivos] = useState(0);

  const pasoActual = PASOS[indice];
  const yaResuelto = pasoActual.id in veredictos;
  const esUltimo = indice === PASOS.length - 1;

  const marcar = (id: string, acierto: boolean) => {
    if (id in veredictos) return; // jugar MAL: doble clic no cuenta dos veces
    setVeredictos((prev) => ({ ...prev, [id]: acierto }));
    if (!acierto) {
      labActividad.restar();
      setErroresVivos((n) => n + 1);
    }
    labActividad.avanzar();
  };

  const avanzarPaso = () => setIndice((i) => i + 1);
  const terminarLab = () => labActividad.terminar(Math.round((Date.now() - labActividad.sim.current.inicio) / 1000));

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Identidad" subtitulo="Identidad, autenticación y cifrado">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🔐
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Especialista en Identidad Digital</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Construiste una contraseña profesional que no reutiliza datos públicos, distinguiste cuándo el segundo
            factor detiene un ataque real y cuándo no, detectaste un intento de phishing dirigido a robar una
            identidad, y separaste lo que el candado protege —el canal— de lo que no garantiza por sí solo: la
            identidad de quien contesta.
          </p>
          {alSalir && (
            <button
              type="button"
              onClick={alSalir}
              className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold"
            >
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const marca =
    pasoActual.tipo === 'password-diagnostico' || pasoActual.tipo === 'password-construye'
      ? 'Tecnia Identidad'
      : pasoActual.tipo === 'acceso'
        ? 'Tecnia Accesos'
        : pasoActual.tipo === 'correo'
          ? 'Tecnia Correo'
          : pasoActual.tipo === 'candado'
            ? 'Tecnia Navegador'
            : 'Tecnia Identidad';
  const subtitulo = pasoActual.tipo === 'candado' ? pasoActual.pagina.pestana : 'regina.paredes@orbitatek.mx';

  return (
    <VentanaBase marca={marca} subtitulo={subtitulo}>
      <div className="p-4 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-slate-400">
              Encargo <strong className="text-white">{indice + 1}</strong> de {PASOS.length}
            </p>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Nivel de riesgo: <span className="text-cyan-400">{nivelRiesgo(erroresVivos)}</span>
            </p>
          </div>

          {pasoActual.tipo === 'password-diagnostico' && (
            <PasoDiagnosticoView
              key={pasoActual.id}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}

          {pasoActual.tipo === 'password-construye' && (
            <PasoConstruyeView
              key={pasoActual.id}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}

          {pasoActual.tipo === 'acceso' && (
            <PasoAccesoView
              key={pasoActual.id}
              caso={pasoActual.caso}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}

          {pasoActual.tipo === 'correo' && (
            <PasoCorreoView
              key={pasoActual.id}
              mensaje={pasoActual.mensaje}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}

          {pasoActual.tipo === 'candado' && (
            <PasoCandadoView
              key={pasoActual.id}
              pagina={pasoActual.pagina}
              contexto={pasoActual.contexto}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}

          {pasoActual.tipo === 'reflexion' && (
            <PasoReflexionView
              key={pasoActual.id}
              paso={pasoActual}
              resuelto={yaResuelto}
              acierto={veredictos[pasoActual.id]}
              onResolver={(ok) => marcar(pasoActual.id, ok)}
              onAvanzar={esUltimo ? terminarLab : avanzarPaso}
              esUltimo={esUltimo}
            />
          )}
      </div>
    </VentanaBase>
  );
}

export default LabIdentidadYCifrado;
