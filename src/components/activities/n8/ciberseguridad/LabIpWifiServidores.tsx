'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';

/**
 * N8 · «Redes y ciberseguridad» — «IP, wifi y servidores» (currículo §56.0,
 * primera parada de la unidad, antes de `n8-malware-e-ingenieria-social`).
 * Nivel 8 = 2° de Secundaria, 13–14 años.
 *
 * No existe todavía ningún simulador de router/wifi/red en `simuladores/`
 * (se revisó la carpeta entera: `simuladores/navegador` es un NAVEGADOR WEB
 * —pestañas, URL, candado http/https—, un concepto distinto de "estás
 * conectado a esta red wifi con esta IP"). Construir aquí mismo un tercer
 * `simuladores/x` de un solo uso, sin una segunda clase que lo vaya a
 * reutilizar, sería la abstracción prematura que este proyecto evita
 * (mismo criterio que ya usó `LabSistemasOperativos`, que tampoco cuelga de
 * un simulador compartido). Panel ultra-lite: la app "Tecnia Red", con la
 * pinta de los ajustes de wifi de cualquier celular o router doméstico.
 *
 * Nueve encargos, tres actos — Wi-Fi (elegir la red real entre una gemela
 * abierta y una variante de nombre, escribir la contraseña de la etiqueta,
 * explicar el riesgo de una red abierta), IP (distinguir una IP local de
 * una pública y de una inválida, entender que varios aparatos de la MISMA
 * casa comparten una sola IP pública, qué hace el router) y Servidores
 * (una petición real a una URL, un servidor apagado que no contesta, y un
 * repaso final de las tres palabras). Cada uno evalúa una acción real del
 * alumno sobre el panel —nunca "leer y pasar a la siguiente pantalla".
 */

const TOTAL = 9;

// ── Acto 1 · Wi-Fi ──────────────────────────────────────────────────────

interface RedWifi {
  id: string;
  nombre: string;
  segura: boolean;
  senal: 1 | 2 | 3 | 4;
  correcta: boolean;
  explicacion: string;
}

const REDES: RedWifi[] = [
  {
    id: 'casa-segura',
    nombre: 'CasaMorales_5G',
    segura: true,
    senal: 4,
    correcta: true,
    explicacion:
      'Correcto: mismo nombre exacto de la casa Y con candado, es decir que pide contraseña. Cuando dos redes se llaman IGUAL pero una no tiene candado, desconfía siempre de la que está abierta.',
  },
  {
    id: 'casa-abierta',
    nombre: 'CasaMorales_5G',
    segura: false,
    senal: 3,
    correcta: false,
    explicacion:
      'Se llama exactamente igual que la red de la casa, pero no tiene candado: no pide contraseña. Alguien de afuera pudo crear una red abierta con el mismo nombre para que te conectes ahí sin darte cuenta — se llama red gemela.',
  },
  {
    id: 'casa-libre',
    nombre: 'CasaMorales_5G_Libre',
    segura: false,
    senal: 2,
    correcta: false,
    explicacion:
      'El nombre se parece pero no es idéntico, y tampoco tiene candado: es otra trampa, un nombre parecido para confundirte.',
  },
  {
    id: 'vecino',
    nombre: 'Wifi_Familia_Ponce',
    segura: true,
    senal: 1,
    correcta: false,
    explicacion: 'Ésta sí tiene candado, pero es la red de otra casa. No es la que buscas.',
  },
];

const CONTRASENA_CORRECTA = 'MoralesWifi24*';

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_RIESGO: OpcionMcq[] = [
  {
    id: 'nadie-ve',
    texto: 'Nadie puede espiar lo que envías: va directo al destino.',
    correcta: false,
    explicacion: 'Es justo al revés: una red SIN candado es la que menos protege lo que envías.',
  },
  {
    id: 'espiar',
    texto: 'Cualquier otra persona conectada a esa misma red puede ver información que no está protegida.',
    correcta: true,
    explicacion:
      'Correcto. Sin contraseña, cualquiera puede unirse a la red — y desde adentro, con las herramientas correctas, puede ver lo que otros conectados envían por sitios que tampoco tengan su propio candado (el mismo https del navegador).',
  },
  {
    id: 'bateria',
    texto: 'Se gasta más batería del celular.',
    correcta: false,
    explicacion: 'La batería no tiene nada que ver con que la red tenga o no contraseña.',
  },
  {
    id: 'calienta',
    texto: 'El router se calienta más.',
    correcta: false,
    explicacion: 'Eso tampoco depende de si la red pide contraseña o no.',
  },
];

// ── Acto 2 · IP ──────────────────────────────────────────────────────────

const OPCIONES_IP: OpcionMcq[] = [
  {
    id: 'ip-privada',
    texto: '192.168.1.34',
    correcta: true,
    explicacion:
      'Exacto. Las direcciones que empiezan con 192.168. son casi siempre direcciones LOCALES: sólo existen dentro de esta red, y se repiten en millones de casas distintas al mismo tiempo sin chocar entre sí.',
  },
  {
    id: 'ip-publica-dns',
    texto: '8.8.8.8',
    correcta: false,
    explicacion:
      'Ésta sí es una IP real, pero es pública y muy famosa —es el DNS de Google—, no la dirección local de un dispositivo dentro de una casa.',
  },
  {
    id: 'ip-invalida',
    texto: '501.211.4.9',
    correcta: false,
    explicacion:
      'Esta dirección ni siquiera es válida: cada uno de los cuatro números de una IP va de 0 a 255, y aquí hay un 501.',
  },
  {
    id: 'ip-publica-mx',
    texto: '187.190.22.101',
    correcta: false,
    explicacion:
      'Parece la IP pública de un proveedor de internet: es del tipo que ve el resto de internet, no la local de un dispositivo dentro de la casa.',
  },
];

interface Dispositivo {
  id: string;
  nombre: string;
  ipLocal: string;
  deEstaCasa: boolean;
}

const IP_PUBLICA_CASA = '187.190.22.101';

const DISPOSITIVOS: Dispositivo[] = [
  { id: 'tablet', nombre: 'Tablet de Bit', ipLocal: '192.168.1.34', deEstaCasa: true },
  { id: 'laptop', nombre: 'Laptop de mamá', ipLocal: '192.168.1.12', deEstaCasa: true },
  { id: 'tv', nombre: 'Smart TV de la sala', ipLocal: '192.168.1.8', deEstaCasa: true },
  { id: 'consola', nombre: 'Consola de videojuegos', ipLocal: '192.168.1.45', deEstaCasa: true },
  { id: 'vecino-cel', nombre: 'Celular del vecino', ipLocal: '192.168.1.12', deEstaCasa: false },
];

const OPCIONES_ROUTER: OpcionMcq[] = [
  {
    id: 'reparte',
    texto: 'Reparte una dirección IP local a cada dispositivo de la casa y los conecta a internet.',
    correcta: true,
    explicacion:
      'Correcto: el router es el repartidor de la casa. Le da una IP local distinta a cada aparato y es la puerta única por la que todos salen a internet.',
  },
  {
    id: 'contrasenas',
    texto: 'Guarda las contraseñas de tus cuentas en línea.',
    correcta: false,
    explicacion: 'Eso no lo hace el router — las contraseñas de tus cuentas las guarda cada servicio, no el aparato de tu casa.',
  },
  {
    id: 'proveedor',
    texto: 'Es la empresa que te vende el servicio de internet.',
    correcta: false,
    explicacion: 'Ésa es tu proveedor de internet, el que cobra la mensualidad. El router es el aparato físico dentro de tu casa.',
  },
  {
    id: 'convierte',
    texto: 'Convierte cualquier computadora en un servidor web automáticamente.',
    correcta: false,
    explicacion: 'Un router no vuelve servidor a nada: sólo reparte direcciones locales y conecta los aparatos de la casa.',
  },
];

// ── Acto 3 · Servidores ──────────────────────────────────────────────────

const URL_ESPERADA = 'juegos.tecnia.mx';

interface EstadoServidor {
  id: string;
  enLinea: boolean;
}

const SERVIDORES: EstadoServidor[] = [
  { id: 'srv-juegos-04', enLinea: true },
  { id: 'srv-tienda-01', enLinea: false },
  { id: 'srv-correo-02', enLinea: true },
];

const OPCIONES_FALLA: OpcionMcq[] = [
  {
    id: 'normal',
    texto: 'Carga normal, como cualquier otra página.',
    correcta: false,
    explicacion: 'No: sin el servidor prendido, no hay quién conteste la petición.',
  },
  {
    id: 'no-carga',
    texto: 'No va a cargar: el servidor que la sirve está apagado, no hay quién conteste.',
    correcta: true,
    explicacion:
      'Correcto. «tienda.tecnia.mx» vive en srv-tienda-01, y ese servidor está apagado. Sin una computadora prendida esperando la petición del otro lado, no hay respuesta posible.',
  },
  {
    id: 'lento',
    texto: 'Carga más lento pero sí abre.',
    correcta: false,
    explicacion: 'Un servidor apagado no responde lento: no responde. La página no carga.',
  },
];

interface Termino {
  id: 'ip' | 'router' | 'servidor';
  nombre: string;
}

const TERMINOS: Termino[] = [
  { id: 'ip', nombre: 'IP' },
  { id: 'router', nombre: 'Router' },
  { id: 'servidor', nombre: 'Servidor' },
];

interface Definicion {
  id: string;
  terminoId: Termino['id'];
  texto: string;
}

const DEFINICIONES: Definicion[] = [
  {
    id: 'def-servidor',
    terminoId: 'servidor',
    texto: 'Una computadora que siempre está encendida, esperando peticiones para responder con una página, un juego o un servicio.',
  },
  {
    id: 'def-ip',
    terminoId: 'ip',
    texto: 'La dirección que identifica a un dispositivo dentro de una red, o a una red completa dentro de internet.',
  },
  {
    id: 'def-router',
    terminoId: 'router',
    texto: 'El aparato que reparte direcciones locales a los dispositivos de la casa y los conecta a internet.',
  },
];

const INSTRUCCIONES: string[] = [
  'Toca la red correcta en la pantalla.',
  'Escribe la contraseña que ves en la etiqueta del router.',
  'Elige la respuesta correcta.',
  'Toca la dirección que sí podría ser una IP local.',
  'Marca los dispositivos de la casa Morales y presiona Comprobar.',
  'Elige la respuesta correcta.',
  'Escribe la dirección y presiona Ir.',
  'Elige la respuesta correcta.',
  'Une cada palabra con su definición.',
];

function etiquetaActo(paso: number): string {
  if (paso < 3) return 'Wi-Fi';
  if (paso < 6) return 'Estado de la red';
  return 'Servidores';
}

export function LabIpWifiServidores(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [redElegida, setRedElegida] = useState<string | null>(null);
  const [passwordEscrita, setPasswordEscrita] = useState('');
  const [riesgoElegido, setRiesgoElegido] = useState<string | null>(null);
  // Acto 2
  const [ipElegida, setIpElegida] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [routerElegido, setRouterElegido] = useState<string | null>(null);
  // Acto 3
  const [urlEscrita, setUrlEscrita] = useState('');
  const [respuestaServidor, setRespuestaServidor] = useState<string | null>(null);
  const [fallaElegida, setFallaElegida] = useState<string | null>(null);
  const [terminoActivo, setTerminoActivo] = useState<Termino['id'] | null>(null);
  const [parejasCorrectas, setParejasCorrectas] = useState<Set<Termino['id']>>(new Set());
  const [parejaError, setParejaError] = useState<string | null>(null);

  const marcarAcierto = (texto: string) => {
    lab.avanzar();
    setMensaje({ ok: true, texto });
    setBloqueado(true);
  };

  const marcarError = (texto: string) => {
    lab.restar();
    setMensaje({ ok: false, texto });
  };

  const siguiente = () => {
    setMensaje(null);
    setBloqueado(false);
    setPasoActual((p) => p + 1);
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  // Acto 1
  const elegirRed = (red: RedWifi) => {
    setRedElegida(red.id);
    if (red.correcta) marcarAcierto(red.explicacion);
    else marcarError(red.explicacion);
  };

  const intentarConectar = () => {
    if (passwordEscrita.trim() === CONTRASENA_CORRECTA) {
      marcarAcierto('Conectado. Ese candado significa exactamente esto: sin la contraseña de la etiqueta, nadie entra.');
    } else {
      marcarError('Contraseña incorrecta. Revisa la etiqueta del router letra por letra — mayúsculas, números y el símbolo final cuentan.');
    }
  };

  // Genérico para las cuatro pantallas de opción múltiple (riesgo, IP, router, falla)
  const responderMcq = (opcion: OpcionMcq, marcar: (id: string) => void) => {
    marcar(opcion.id);
    if (opcion.correcta) marcarAcierto(opcion.explicacion);
    else marcarError(opcion.explicacion);
  };

  // Acto 2
  const alternarDispositivo = (id: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const comprobarDispositivos = () => {
    const correctos = new Set(DISPOSITIVOS.filter((d) => d.deEstaCasa).map((d) => d.id));
    const igual = correctos.size === seleccion.size && [...correctos].every((id) => seleccion.has(id));
    if (igual) {
      marcarAcierto(
        `Exacto: los cuatro aparatos de la casa Morales salen a internet con la MISMA IP pública (${IP_PUBLICA_CASA}), aunque cada uno tenga su propia IP local distinta adentro. El celular del vecino tiene una IP local parecida, pero sale con la IP pública de OTRA casa.`,
      );
    } else {
      marcarError('No es esa combinación todavía. Pista: son los cuatro aparatos que están físicamente dentro de la casa Morales — ni uno menos, ni uno de más.');
    }
  };

  // Acto 3
  const enviarPeticion = () => {
    const normal = urlEscrita.trim().toLowerCase();
    if (normal === URL_ESPERADA) {
      setRespuestaServidor('srv-juegos-04 respondió en 41 ms · en línea');
      marcarAcierto(
        'Un servidor es una computadora que SIEMPRE está encendida, esperando a que alguien le pida algo. Tu dispositivo mandó la petición y ese servidor —no el tuyo— contestó con la página.',
      );
    } else {
      setRespuestaServidor(null);
      marcarError('No es esa dirección. Escribe exactamente juegos.tecnia.mx en la barra y presiona Ir.');
    }
  };

  const elegirTermino = (id: Termino['id']) => {
    if (parejasCorrectas.has(id)) return;
    setTerminoActivo(id);
    setParejaError(null);
  };

  const elegirDefinicion = (def: Definicion) => {
    if (!terminoActivo || parejasCorrectas.has(def.terminoId)) return;
    if (def.terminoId === terminoActivo) {
      const siguientesParejas = new Set(parejasCorrectas);
      siguientesParejas.add(terminoActivo);
      setParejasCorrectas(siguientesParejas);
      setTerminoActivo(null);
      if (siguientesParejas.size === TERMINOS.length) {
        marcarAcierto(
          'Las tres piezas encajan: la IP identifica, el router reparte y conecta, el servidor contesta. Con eso ya puedes leer los ajustes de cualquier red como quien entiende lo que ve.',
        );
      }
    } else {
      lab.restar();
      setParejaError(def.id);
      setTerminoActivo(null);
    }
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Red" subtitulo="IP, wifi y servidores">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            📡
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Lees el panel de red como quien entiende</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Elegiste la red real entre una gemela abierta, reconociste una IP local frente a una pública, entendiste
            por qué toda la casa comparte una sola IP hacia afuera, y viste a un servidor apagado quedarse sin
            contestar. IP, router y servidor ya no son sólo palabras en una etiqueta.
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

  return (
    <VentanaBase marca="Tecnia Red" subtitulo="Ajustes de red · Tablet de Bit">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        {/* ── Pantalla grande: la app de ajustes ── */}
        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 flex flex-col gap-5" data-testid="pantalla-red">
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
            {(['Wi-Fi', 'Estado de la red', 'Servidores'] as const).map((tag, i) => {
              const actIndex = i === 0 ? 0 : i === 1 ? 3 : 6;
              const activa = etiquetaActo(pasoActual) === tag;
              const hecha = pasoActual > actIndex + 2;
              return (
                <span
                  key={tag}
                  className={`px-3 py-1.5 rounded-full ${
                    activa ? 'bg-cyan-500 text-slate-950' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Encargo 1 · elegir la red */}
          {pasoActual === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">
                Bit está en casa de los Morales y quiere conectar su tablet a la red de ESTA casa. Éstas son las redes
                al alcance ahora mismo:
              </p>
              <ul className="flex flex-col gap-2" data-testid="lista-redes">
                {REDES.map((red) => (
                  <li key={red.id}>
                    <button
                      type="button"
                      data-testid="red-opcion"
                      disabled={bloqueado}
                      onClick={() => elegirRed(red)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left disabled:opacity-50 ${
                        redElegida === red.id ? (red.correcta ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-rose-500/20 border border-rose-400') : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {'▂▄▆█'.slice(0, red.senal)}
                      </span>
                      <span className="flex-1 text-white font-semibold">{red.nombre}</span>
                      <span aria-hidden="true">{red.segura ? '🔒' : '🔓'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Encargo 2 · contraseña */}
          {pasoActual === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">Conectado a CasaMorales_5G. Pide contraseña. En la parte de abajo del router hay una etiqueta:</p>
              <div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-slate-100" data-testid="etiqueta-router">
                <p>SSID: CasaMorales_5G</p>
                <p>Contraseña: {CONTRASENA_CORRECTA}</p>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bloqueado) intentarConectar();
                }}
              >
                <input
                  type="text"
                  data-testid="input-password"
                  value={passwordEscrita}
                  disabled={bloqueado}
                  onChange={(e) => setPasswordEscrita(e.target.value)}
                  placeholder="Contraseña de wifi"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-50"
                />
                <button type="submit" disabled={bloqueado} className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50">
                  Conectar
                </button>
              </form>
            </div>
          )}

          {/* Encargo 3 · riesgo red abierta */}
          {pasoActual === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">
                Bit ve otra red cerca, «Cafeteria_Libre», sin candado y sin contraseña. ¿Por qué es un riesgo conectarse
                ahí?
              </p>
              <div className="flex flex-col gap-2" data-testid="opciones-riesgo">
                {OPCIONES_RIESGO.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    data-testid="opcion-mcq"
                    disabled={bloqueado}
                    onClick={() => responderMcq(op, setRiesgoElegido)}
                    className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
                      riesgoElegido === op.id ? (op.correcta ? 'bg-emerald-500/20 border border-emerald-400 text-white' : 'bg-rose-500/20 border border-rose-400 text-white') : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Encargo 4 · IP local vs pública */}
          {pasoActual === 3 && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-100" data-testid="tarjeta-dispositivo">
                <p className="font-bold text-white mb-1">Este dispositivo</p>
                <p>Nombre: Tablet de Bit</p>
                <p>Conectado a: CasaMorales_5G</p>
                <p>Dirección IP: 192.168.1.34</p>
                <p>Dirección MAC: A4:5E:60:B2:19:0C</p>
              </div>
              <p className="text-sm text-slate-300">De estas cuatro direcciones, toca la que SÍ podría ser una IP local (de una red como ésta):</p>
              <div className="grid grid-cols-2 gap-2" data-testid="opciones-ip">
                {OPCIONES_IP.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    data-testid="opcion-mcq"
                    disabled={bloqueado}
                    onClick={() => responderMcq(op, setIpElegida)}
                    className={`px-4 py-3 rounded-xl font-mono text-sm disabled:opacity-50 ${
                      ipElegida === op.id ? (op.correcta ? 'bg-emerald-500/20 border border-emerald-400 text-white' : 'bg-rose-500/20 border border-rose-400 text-white') : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Encargo 5 · dispositivos que comparten IP pública */}
          {pasoActual === 4 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">
                El router de los Morales tiene UNA sola IP pública: <strong className="text-white">{IP_PUBLICA_CASA}</strong>. Marca todos los
                dispositivos que están dentro de esa casa (cuidado: uno de ellos no vive ahí).
              </p>
              <ul className="flex flex-col gap-2" data-testid="lista-dispositivos">
                {DISPOSITIVOS.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      data-testid="dispositivo-opcion"
                      disabled={bloqueado}
                      aria-pressed={seleccion.has(d.id)}
                      onClick={() => alternarDispositivo(d.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left disabled:opacity-50 ${
                        seleccion.has(d.id) ? 'bg-cyan-500/20 border border-cyan-400' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <span aria-hidden="true">{seleccion.has(d.id) ? '☑️' : '⬜'}</span>
                      <span className="flex-1 text-white font-semibold">{d.nombre}</span>
                      <span className="font-mono text-xs text-slate-400">{d.ipLocal}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                data-testid="comprobar-dispositivos"
                disabled={bloqueado || seleccion.size === 0}
                onClick={comprobarDispositivos}
                className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50 self-start"
              >
                Comprobar
              </button>
            </div>
          )}

          {/* Encargo 6 · qué hace el router */}
          {pasoActual === 5 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">¿Qué hace el router de tu casa?</p>
              <div className="flex flex-col gap-2" data-testid="opciones-router">
                {OPCIONES_ROUTER.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    data-testid="opcion-mcq"
                    disabled={bloqueado}
                    onClick={() => responderMcq(op, setRouterElegido)}
                    className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
                      routerElegido === op.id ? (op.correcta ? 'bg-emerald-500/20 border border-emerald-400 text-white' : 'bg-rose-500/20 border border-rose-400 text-white') : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Encargo 7 · petición a un servidor */}
          {pasoActual === 6 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">
                Escribe en la barra de direcciones <strong className="text-white">juegos.tecnia.mx</strong> y presiona Ir.
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bloqueado) enviarPeticion();
                }}
              >
                <input
                  type="text"
                  data-testid="input-url"
                  value={urlEscrita}
                  disabled={bloqueado}
                  onChange={(e) => setUrlEscrita(e.target.value)}
                  placeholder="Escribe una dirección"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono disabled:opacity-50"
                />
                <button type="submit" disabled={bloqueado} className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold disabled:opacity-50">
                  Ir
                </button>
              </form>
              {respuestaServidor && (
                <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-xl p-3 text-sm text-emerald-200" data-testid="respuesta-servidor">
                  🖥️ {respuestaServidor}
                </div>
              )}
            </div>
          )}

          {/* Encargo 8 · servidor apagado */}
          {pasoActual === 7 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-white mb-1">Panel de servidores</p>
              <ul className="flex flex-col gap-1 text-sm font-mono" data-testid="lista-servidores">
                {SERVIDORES.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-slate-200">
                    <span aria-hidden="true">{s.enLinea ? '🟢' : '🔴'}</span>
                    {s.id} · {s.enLinea ? 'en línea' : 'apagado'}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-300">
                Si ahora mismo escribes <strong className="text-white">tienda.tecnia.mx</strong> en el navegador, ¿qué va a pasar?
              </p>
              <div className="flex flex-col gap-2" data-testid="opciones-falla">
                {OPCIONES_FALLA.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    data-testid="opcion-mcq"
                    disabled={bloqueado}
                    onClick={() => responderMcq(op, setFallaElegida)}
                    className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
                      fallaElegida === op.id ? (op.correcta ? 'bg-emerald-500/20 border border-emerald-400 text-white' : 'bg-rose-500/20 border border-rose-400 text-white') : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Encargo 9 · repaso final por parejas */}
          {pasoActual === 8 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-300">Toca una palabra y luego su definición.</p>
              <div className="flex gap-2 flex-wrap" data-testid="terminos">
                {TERMINOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-testid="termino"
                    disabled={parejasCorrectas.has(t.id)}
                    onClick={() => elegirTermino(t.id)}
                    className={`px-4 py-2 rounded-xl font-bold disabled:opacity-40 ${
                      parejasCorrectas.has(t.id)
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                        : terminoActivo === t.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {t.nombre}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2" data-testid="definiciones">
                {DEFINICIONES.map((def) => (
                  <button
                    key={def.id}
                    type="button"
                    data-testid="definicion"
                    disabled={parejasCorrectas.has(def.terminoId)}
                    onClick={() => elegirDefinicion(def)}
                    className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-40 ${
                      parejasCorrectas.has(def.terminoId)
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200'
                        : parejaError === def.id
                          ? 'bg-rose-500/20 border border-rose-400 text-white'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {def.texto}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Panel de control lateral ── */}
        <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="mis-panel">
          <p className="text-sm text-slate-300">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> / {TOTAL}
          </p>
          <p className="text-xs uppercase tracking-wider font-bold text-cyan-400">{etiquetaActo(pasoActual)}</p>

          {!mensaje && <p className="text-sm text-slate-400">{INSTRUCCIONES[pasoActual]}</p>}

          {mensaje && (
            <div className="flex flex-col gap-2" data-testid="explicacion">
              <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mensaje.ok ? '¡Correcto!' : 'Todavía no.'}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
            </div>
          )}

          {mensaje?.ok && (
            <button
              type="button"
              data-testid={pasoActual === TOTAL - 1 ? 'terminar' : 'siguiente'}
              onClick={pasoActual === TOTAL - 1 ? terminar : siguiente}
              className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
            >
              {pasoActual === TOTAL - 1 ? 'Recibir la insignia' : 'Siguiente'}
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

export default LabIpWifiServidores;
