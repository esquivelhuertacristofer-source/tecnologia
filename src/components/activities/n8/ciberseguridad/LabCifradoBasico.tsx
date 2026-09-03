'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  estadoSeguridad,
  paginaDe,
  useNavegador,
  VentanaNavegador,
  type EstadoSeguridad,
  type MapaSitios,
} from '../../../simuladores/navegador';

/**
 * N8 · «Redes y ciberseguridad» — «Cifrado básico» (doc §56.3).
 *
 * Dos programas, un mismo hilo: el candado de Tecnia Navegador (§56.1 ya lo
 * dejó listo con TRES estados —`tiposNavegador.ts` lo dice a propósito, «para
 * `n8-cifrado-basico`») ES el cifrado moderno, y el César es el mismo truco
 * en miniatura: cambiar cada letra un número fijo de posiciones. La clase no
 * mezcla los dos programas en una sola pantalla; los cruza en dos fases
 * consecutivas del mismo laboratorio, con el mismo `indice` lineal —
 * primero «Tecnia Cifrador» (mensajes 1-3), luego «Tecnia Navegador»
 * (sitios 4-8), cierre reflexivo (9).
 *
 * ── Por qué el cifrado NUNCA se compara contra un texto fijo ────────────────
 *
 * `cifrarCesar`/`descifrarCesar` son las funciones reales: cada veredicto
 * (`resolverCifrar`, `resolverDescifrar`) llama a la MISMA función con la
 * clave del alumno y la compara contra la MISMA función con la clave
 * objetivo — nunca contra una cadena copiada a mano. Es la regla anti-épsilon
 * de §46 aplicada a texto en vez de números: si algún día se cambia el
 * alfabeto o el módulo, ningún veredicto queda huérfano.
 *
 * ── Por qué «seguro / inseguro» tampoco se duplica a mano ───────────────────
 *
 * `resolverSitio` no tiene su propia tabla de qué sitio es seguro: llama a
 * `estadoSeguridad()`, la MISMA función pura que ya pinta el candado dentro
 * de `VentanaNavegador`. Duplicarla a mano sería exactamente el defecto de
 * los «10 sitios calculando fila↔píxel a mano» que cerró Excel — un segundo
 * lugar que se puede desincronizar del primero.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El cifrado César — función real, sin texto pre-calculado
// ───────────────────────────────────────────────────────────────────────────

/**
 * Cifrado César: desplaza cada letra `clave` posiciones en el alfabeto,
 * ida y vuelta con módulo 26. Espacios, números y signos quedan intactos —
 * igual que cualquier cifrado por sustitución de letras de verdad. Los
 * mensajes de esta clase van sin acentos a propósito: una «Ñ» o una «É» no
 * tienen un desplazamiento limpio dentro de un alfabeto de 26 letras.
 */
export function cifrarCesar(texto: string, clave: number): string {
  const desplazamiento = ((clave % 26) + 26) % 26; // normaliza negativos: -19 → 7
  return texto
    .split('')
    .map((caracter) => {
      const esMayuscula = caracter >= 'A' && caracter <= 'Z';
      const esMinuscula = caracter >= 'a' && caracter <= 'z';
      if (!esMayuscula && !esMinuscula) return caracter;
      const base = esMayuscula ? 65 : 97;
      const posicion = caracter.charCodeAt(0) - base;
      return String.fromCharCode(base + ((posicion + desplazamiento) % 26));
    })
    .join('');
}

/** Descifrar es cifrar con el desplazamiento contrario: misma función, clave negativa. */
export function descifrarCesar(texto: string, clave: number): string {
  return cifrarCesar(texto, -clave);
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · El guion — 9 encargos, un solo índice lineal
// ───────────────────────────────────────────────────────────────────────────

interface PasoCifrar {
  tipo: 'cifrar';
  id: string;
  quien: string;
  mensaje: string;
  clave: number;
  instruccion: string;
}

interface PasoDescifrar {
  tipo: 'descifrar';
  id: string;
  origen: string;
  mensajeOriginal: string;
  clave: number;
  instruccion: string;
}

interface OpcionReflexion {
  id: string;
  texto: string;
}

interface PasoReflexion {
  tipo: 'reflexion';
  id: string;
  pregunta: string;
  opciones: OpcionReflexion[];
  correctaId: string;
  explicacion: string;
}

interface PasoSitio {
  tipo: 'sitio';
  id: string;
  url: string;
  instruccion: string;
}

type Paso = PasoCifrar | PasoDescifrar | PasoReflexion | PasoSitio;

const PASOS: Paso[] = [
  {
    tipo: 'cifrar',
    id: 'p1-cifra-ana',
    quien: 'Ana, del club de robótica',
    mensaje: 'REUNION HOY',
    clave: 3,
    instruccion: 'Ana te pidió usar la clave 3. Mueve el dial hasta 3 y envía el mensaje cifrado.',
  },
  {
    tipo: 'cifrar',
    id: 'p2-cifra-luis',
    quien: 'Luis',
    mensaje: 'TRAE TU LAPTOP',
    clave: 11,
    instruccion: 'Esta vez la clave es 11 — un desplazamiento más grande, misma máquina.',
  },
  {
    tipo: 'descifrar',
    id: 'p3-descifra',
    origen: 'alguien lo dejó sin firmar en el pizarrón del club',
    mensajeOriginal: 'CUIDADO CON EL VIRUS',
    clave: 19,
    instruccion: 'No sabes la clave: pruébalas TODAS moviendo el dial hasta que el mensaje se lea de verdad.',
  },
  {
    tipo: 'reflexion',
    id: 'p4-reflexion-cesar',
    pregunta: '¿Por qué el cifrado César es fácil de romper hoy en día?',
    opciones: [
      { id: 'a', texto: 'Porque las computadoras no pueden hacer sumas' },
      { id: 'b', texto: 'Porque sólo hay 25 claves posibles: una computadora las prueba todas en un instante' },
      { id: 'c', texto: 'Porque el mensaje original tiene que ser muy corto' },
      { id: 'd', texto: 'Porque siempre hay que escribirlo en mayúsculas' },
    ],
    correctaId: 'b',
    explicacion:
      'Tú mismo lo acabas de hacer: probaste claves hasta encontrar la correcta. Con sólo 25 opciones posibles, una computadora las revisa TODAS en menos de un segundo — por eso el César sirve para aprender, pero nadie lo usa hoy para proteger algo de verdad. Lo que sí protege internet —el mismo candado que vas a ver ahora— usa claves con billones de combinaciones.',
  },
  {
    tipo: 'sitio',
    id: 'p5-sitio-banco',
    url: 'bancojoven.mx',
    instruccion: '¿Es seguro escribir tu contraseña en este sitio?',
  },
  {
    tipo: 'sitio',
    id: 'p6-sitio-wifi',
    url: 'wifi-cafe-gratis.net',
    instruccion: 'Esta página pide tu correo y contraseña para «desbloquear velocidad». ¿Es seguro escribirlos aquí?',
  },
  {
    tipo: 'sitio',
    id: 'p7-sitio-club',
    url: 'clubgamer-mx.net',
    instruccion: 'Promete un premio si inicias sesión. ¿Es seguro escribir tu contraseña en este sitio?',
  },
  {
    tipo: 'sitio',
    id: 'p8-sitio-portal',
    url: 'secutec.edu.mx/portal',
    instruccion: 'El portal de calificaciones de tu propia escuela. ¿Es seguro escribir tu contraseña aquí?',
  },
  {
    tipo: 'reflexion',
    id: 'p9-reflexion-cierre',
    pregunta:
      'Estás en una cafetería, conectado a su wifi gratuita que NO pide contraseña para conectarte. Abres bancojoven.mx y ves el candado 🔒 en la barra de direcciones. ¿Alguien más en esa misma wifi puede leer tu contraseña mientras la escribes?',
    opciones: [
      { id: 'a', texto: 'Sí, porque la wifi no tiene contraseña' },
      { id: 'b', texto: 'No, porque el candado significa que tus datos van cifrados hasta el banco, aunque la wifi sea abierta' },
      { id: 'c', texto: 'Sólo si el banco usa la misma clave César que tú aprendiste' },
      { id: 'd', texto: 'Depende de qué tan rápido escribas la contraseña' },
    ],
    correctaId: 'b',
    explicacion:
      'La contraseña de la wifi sólo controla quién SE CONECTA a esa red; no tiene nada que ver con lo que pasa después. Lo que protege tus datos MIENTRAS VIAJAN es el candado —HTTPS—: los cifra antes de que salgan de tu pantalla. Aunque alguien esté escuchando esa misma wifi abierta, sólo vería datos cifrados — igual de ilegibles que el mensaje que tuviste que romper letra por letra.',
  },
];

const PRIMER_SITIO = PASOS.find((p): p is PasoSitio => p.tipo === 'sitio')!;

// ───────────────────────────────────────────────────────────────────────────
// 3 · El mapa de sitios — el candado es un dato de cada página, no un adorno
// ───────────────────────────────────────────────────────────────────────────

const MAPA_SITIOS: MapaSitios = {
  'bancojoven.mx': {
    url: 'bancojoven.mx',
    pestana: 'BancoJoven',
    titulo: 'Inicia sesión en tu cuenta de ahorro',
    autor: null,
    fecha: null,
    protocolo: 'https',
    certificado: { emisor: 'AC Confianza Digital', valido: true },
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Usuario', valor: 'tu_usuario' },
        { etiqueta: 'Contraseña', valor: '••••••••' },
      ],
    },
  },
  'wifi-cafe-gratis.net': {
    url: 'wifi-cafe-gratis.net',
    pestana: 'WiFi Café',
    titulo: 'Desbloquea la velocidad completa: inicia sesión',
    autor: null,
    fecha: null,
    protocolo: 'http',
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Correo', valor: 'tu_correo@ejemplo.com' },
        { etiqueta: 'Contraseña', valor: '••••••••' },
      ],
    },
  },
  'clubgamer-mx.net': {
    url: 'clubgamer-mx.net',
    pestana: 'ClubGamer',
    titulo: 'Reclama tu premio: inicia sesión',
    autor: null,
    fecha: null,
    protocolo: 'https',
    certificado: { emisor: 'Desconocido', valido: false },
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Usuario', valor: 'tu_usuario' },
        { etiqueta: 'Contraseña', valor: '••••••••' },
      ],
    },
  },
  'secutec.edu.mx/portal': {
    url: 'secutec.edu.mx/portal',
    pestana: 'Portal secutec',
    titulo: 'Consulta tus calificaciones',
    autor: null,
    fecha: null,
    protocolo: 'https',
    certificado: { emisor: 'AC Educación Digital', valido: true },
    cuerpo: {
      tipo: 'ficha',
      datos: [
        { etiqueta: 'Matrícula', valor: 'tu_matricula' },
        { etiqueta: 'Contraseña', valor: '••••••••' },
      ],
    },
  },
};

const EXPLICACION_SEGURIDAD: Record<EstadoSeguridad, string> = {
  segura:
    'El candado 🔒 significa conexión cifrada y certificado válido: nadie que esté espiando la red puede leer lo que escribes. Aquí sí es seguro escribir tu contraseña.',
  advertencia:
    'El navegador avisa ⚠️ «Certificado no válido»: la conexión dice ser cifrada pero no hay forma de confirmar que el sitio es quien dice ser. Nunca escribas una contraseña cuando aparece esta advertencia.',
  insegura:
    'No hay candado: es HTTP, sin cifrar. Cualquiera conectado a la misma red —sobre todo una wifi abierta— puede leer exactamente lo que escribes, letra por letra.',
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · El laboratorio
// ───────────────────────────────────────────────────────────────────────────

export function LabCifradoBasico(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, PASOS.length, {});

  const [indice, setIndice] = useState(0);
  const [dialClave, setDialClave] = useState(1);
  const [veredictos, setVeredictos] = useState<Record<string, boolean>>({});

  const nav = useNavegador({ mapa: MAPA_SITIOS, inicio: PRIMER_SITIO.url });
  const [direccion, setDireccion] = useState(PRIMER_SITIO.url);

  const pasoActual = PASOS[indice];
  const yaResuelto = pasoActual.id in veredictos;
  const esUltimo = indice === PASOS.length - 1;

  // Al entrar a un paso de sitio, el navegador salta a esa URL — el alumno no
  // teclea nada para llegar, igual que abrir un correo ya lo abre `useCorreo`.
  useEffect(() => {
    if (pasoActual.tipo === 'sitio' && nav.paginaActual.url !== pasoActual.url) {
      nav.navegar(pasoActual.url);
      setDireccion(pasoActual.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  const mensajeCifrado = useMemo(() => {
    if (pasoActual.tipo !== 'descifrar') return '';
    return cifrarCesar(pasoActual.mensajeOriginal, pasoActual.clave);
  }, [pasoActual]);

  const marcar = (id: string, acierto: boolean) => {
    if (id in veredictos) return; // jugar MAL: doble clic no cuenta dos veces
    setVeredictos((prev) => ({ ...prev, [id]: acierto }));
    if (!acierto) labActividad.restar();
    labActividad.avanzar();
  };

  const resolverCifrar = (paso: PasoCifrar) => {
    const enVivo = cifrarCesar(paso.mensaje, dialClave);
    const esperado = cifrarCesar(paso.mensaje, paso.clave);
    marcar(paso.id, enVivo === esperado);
  };

  const resolverDescifrar = (paso: PasoDescifrar) => {
    const enVivo = descifrarCesar(mensajeCifrado, dialClave);
    marcar(paso.id, enVivo === paso.mensajeOriginal);
  };

  const resolverReflexion = (paso: PasoReflexion, opcionId: string) => {
    marcar(paso.id, opcionId === paso.correctaId);
  };

  const resolverSitio = (paso: PasoSitio, eligioSeguro: boolean) => {
    const real = estadoSeguridad(MAPA_SITIOS[paso.url]) === 'segura';
    marcar(paso.id, eligioSeguro === real);
  };

  const avanzarPaso = () => {
    setDialClave(1);
    setIndice((i) => i + 1);
  };

  const terminarLab = () => labActividad.terminar(labActividad.pasos * 20);

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Navegador" subtitulo="Cifrado básico">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🔐
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: El candado y la clave</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Cifraste mensajes con la clave César, rompiste uno por fuerza bruta y aprendiste a leer el candado del
            navegador: seguro, con advertencia, o sin cifrar. Ahora sabes que una wifi abierta no es el problema —
            escribir tu contraseña sin ese candado sí lo es.
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

  const fase: 'cifrador' | 'navegador' = indice <= 3 ? 'cifrador' : 'navegador';
  const marca = fase === 'cifrador' ? 'Tecnia Cifrador' : 'Tecnia Navegador';
  const subtitulo = fase === 'cifrador' ? 'Máquina César' : 'mateo.reyes@secutec.edu.mx';

  return (
    <VentanaBase marca={marca} subtitulo={subtitulo}>
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <p className="text-sm text-slate-400">
          Encargo <strong className="text-white">{indice + 1}</strong> de {PASOS.length}
        </p>

        {(pasoActual.tipo === 'cifrar' || pasoActual.tipo === 'descifrar') && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 flex flex-col gap-4">
              {pasoActual.tipo === 'cifrar' ? (
                <>
                  <p className="text-sm text-slate-300">Mensaje para {pasoActual.quien}:</p>
                  <p className="font-mono text-xl tracking-widest text-white break-all">{pasoActual.mensaje}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-300">Mensaje interceptado — {pasoActual.origen}:</p>
                  <p className="font-mono text-xl tracking-widest text-rose-300 break-all">{mensajeCifrado}</p>
                </>
              )}

              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Clave del dial: <span className="text-cyan-400 font-bold text-lg">{dialClave}</span>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={dialClave}
                  disabled={yaResuelto}
                  onChange={(e) => setDialClave(Number(e.target.value))}
                  aria-label="Clave del dial"
                />
              </label>

              <div>
                <p className="text-sm text-slate-400">
                  {pasoActual.tipo === 'cifrar' ? 'Mensaje cifrado (en vivo):' : 'Si esta clave es la correcta, así se lee:'}
                </p>
                <p className="font-mono text-xl tracking-widest text-emerald-400 break-all">
                  {pasoActual.tipo === 'cifrar'
                    ? cifrarCesar(pasoActual.mensaje, dialClave)
                    : descifrarCesar(mensajeCifrado, dialClave)}
                </p>
              </div>
            </div>

            <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
              <p className="text-sm text-slate-200 leading-relaxed">{pasoActual.instruccion}</p>
              {!yaResuelto && (
                <button
                  type="button"
                  onClick={() =>
                    pasoActual.tipo === 'cifrar' ? resolverCifrar(pasoActual) : resolverDescifrar(pasoActual)
                  }
                  className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  {pasoActual.tipo === 'cifrar' ? 'Enviar mensaje cifrado' : 'Es este el mensaje'}
                </button>
              )}
              {yaResuelto && (
                <div className="flex flex-col gap-2">
                  <p className={`text-sm font-bold ${veredictos[pasoActual.id] ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {veredictos[pasoActual.id]
                      ? '¡Coincide! La máquina te da la razón.'
                      : pasoActual.tipo === 'cifrar'
                        ? `No coincide todavía: con clave ${pasoActual.clave} el cifrado real es «${cifrarCesar(pasoActual.mensaje, pasoActual.clave)}».`
                        : `Esa clave no era: el mensaje de verdad decía «${pasoActual.mensajeOriginal}».`}
                  </p>
                  <button
                    type="button"
                    onClick={esUltimo ? terminarLab : avanzarPaso}
                    className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
                  >
                    {esUltimo ? 'Terminar' : 'Siguiente'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {pasoActual.tipo === 'sitio' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <VentanaNavegador
              pestanas={nav.pestanas.map((p) => ({
                id: p.id,
                activa: p.id === nav.activaId,
                titulo: paginaDe(MAPA_SITIOS, p.url).pestana,
              }))}
              pagina={nav.paginaActual}
              puedeAtras={nav.puedeAtras}
              puedeAdelante={nav.puedeAdelante}
              barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
              onAtras={() => nav.atras()}
              onAdelante={() => nav.adelante()}
              onRecargar={() => nav.recargar()}
            />
            <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit">
              <p className="text-sm text-slate-200 leading-relaxed">{pasoActual.instruccion}</p>
              {!yaResuelto && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => resolverSitio(pasoActual, true)}
                    className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                  >
                    🔒 Sí, es seguro
                  </button>
                  <button
                    type="button"
                    onClick={() => resolverSitio(pasoActual, false)}
                    className="px-4 py-3 rounded-xl bg-rose-500 text-white font-bold"
                  >
                    ⚠️ No, mejor no
                  </button>
                </div>
              )}
              {yaResuelto && (
                <div className="flex flex-col gap-2">
                  <p className={`text-sm font-bold ${veredictos[pasoActual.id] ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {veredictos[pasoActual.id] ? 'Correcto.' : 'No exactamente.'}
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {EXPLICACION_SEGURIDAD[estadoSeguridad(MAPA_SITIOS[pasoActual.url])]}
                  </p>
                  <button
                    type="button"
                    onClick={esUltimo ? terminarLab : avanzarPaso}
                    className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
                  >
                    {esUltimo ? 'Terminar' : 'Siguiente'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {pasoActual.tipo === 'reflexion' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6">
            <p className="text-lg text-white font-semibold leading-relaxed">{pasoActual.pregunta}</p>
            {!yaResuelto && (
              <div className="flex flex-col gap-2">
                {pasoActual.opciones.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => resolverReflexion(pasoActual, o.id)}
                    className="px-4 py-3 rounded-xl bg-slate-700 text-white text-sm font-semibold text-left"
                  >
                    {o.texto}
                  </button>
                ))}
              </div>
            )}
            {yaResuelto && (
              <div className="flex flex-col gap-2">
                <p className={`text-sm font-bold ${veredictos[pasoActual.id] ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {veredictos[pasoActual.id] ? 'Correcto.' : 'No exactamente.'}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">{pasoActual.explicacion}</p>
                <button
                  type="button"
                  onClick={esUltimo ? terminarLab : avanzarPaso}
                  className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
                >
                  {esUltimo ? 'Terminar' : 'Siguiente'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </VentanaBase>
  );
}

export default LabCifradoBasico;
