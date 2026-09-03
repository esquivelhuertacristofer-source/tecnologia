'use client';

/**
 * N4 · U2 · parada 4 — «Videollamadas con respeto» (§24.4 del documento maestro).
 *
 * DOS CAPAS, y el puente entre ellas es la mitad de la lección:
 *
 *   · La CABINA (3D, `SalaLlamada3D`) tiene dos objetos de verdad: la lámpara de
 *     brazo y el biombo. Se tocan en la escena o en sus dos placas de latón
 *     atornilladas a la mesa. No son «ajustes»: son muebles.
 *   · El PROGRAMA («Tecnia Reunión», este archivo) vive DENTRO de la pantalla del
 *     monitor. Sus controles —🎤 📷 ✋ 💬 🚪— viven en la barra de abajo porque en
 *     la vida real están ahí, y el niño los va a reconocer el lunes en la escuela
 *     precisamente porque se ven así. Nada de esto flota sobre la escena.
 *
 *   El puente: la VISTA PREVIA de la antesala dibuja en vivo lo que hacen la
 *   lámpara y el biombo. Mover el brazo de la lámpara en la mesa cambia la cara
 *   de Sofi en la pantalla. Eso es lo que hay que entender: la cámara no ve el
 *   programa, ve el cuarto.
 *
 * POR QUÉ «Entrar» SE ENCIENDE CON EL MICRÓFONO ABIERTO. El §24.4 pide dos cosas
 * que parecen chocar: que el botón esté «apagado hasta que las cuatro están bien»
 * y que, con el micrófono abierto, «el programa no lo impida». No chocan: la luz,
 * el fondo y la cámara son defectos que el programa VE en su propia vista previa
 * y por eso los bloquea; el micrófono abierto no es un defecto, es una descortesía
 * —ningún programa de verdad te impide entrar sin silenciar—. Así que con los tres
 * primeros en verde el botón se enciende, pero en ámbar y diciendo «Entrar de
 * todos modos», y quien entra así se lleva la escena que se merece.
 *
 * Tres fases que ESCALAN:
 *   1. reconocer   — la antesala: cuatro comprobaciones antes de que te vean.
 *   2. aplicar     — la reunión: cinco momentos, cinco decisiones con el control
 *                    correcto (ruido, turno, me toca, grabación, enlace).
 *   3. diagnosticar— la puerta: tres solicitudes de entrada, cada una decidida Y
 *                    con motivo, y un cierre en el que hay que salir y avisar.
 *
 * Todos los textos de pantalla y las trece frases de voz de Bit salen verbatim de
 * §24.4. El alumno no teclea nunca (§22.3), no hay cámara ni micrófono de verdad
 * —la vista previa es un dibujo de la escena, no una imagen de nadie— y el
 * programa no se conecta a ninguna parte: la reunión es una máquina de estados en
 * memoria. Ningún error termina la llamada: el momento se repite con una pista
 * más clara y el contador de errores lo anota.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { SalaLlamada3D, type PosicionLampara } from './piezasN4U2Cabina';

/** Los catorce pasos de la barra: 4 comprobaciones + entrar + 5 momentos + 3 + cierre. */
const TOTAL_PASOS = 14;

/** Las trece frases de voz de Bit, verbatim del §24.4. */
const VOZ = {
  antesala:
    'Esta es la antesala. Antes de entrar a cualquier videollamada te ves aquí, tal como te van a ver los demás. Arréglate cuatro cosas y entramos.',
  luzDetras: 'Con la lámpara detrás, la cámara mira la luz y a ti te deja de sombra. Ponla de tu lado.',
  luzFrente: 'Ahora sí se te ve la cara. Mírate: eso es lo que va a ver la maestra.',
  fondo: 'Cierra el biombo. Lo que hay detrás de ti también sale en la llamada.',
  micro:
    'A una reunión que ya empezó se entra silenciado. Siempre. Nadie sabe qué se está oyendo en tu casa.',
  silencioBien: '¡Buena! Con el micrófono apagado ya no se cuela el ruido de tu casa.',
  ruidoTarda: 'Se está oyendo todo lo de tu casa y nadie escucha a Diego. ¿Qué botón te falta?',
  manoFisica:
    'La mano que se ve es la del botón, no la tuya. Levántala ahí y quedas apuntada en la lista.',
  meToca: 'Ahora sí te toca. Enciende el micrófono y baja la mano.',
  grabacion:
    'Tu cara y tu voz son tuyas. Para grabar hay que pedir permiso a todos, y tú puedes decir que no.',
  enlace: 'El enlace es la puerta de la reunión. A esta reunión invita la maestra, no nosotros.',
  puerta: 'No conoces a quien está tocando. No lo dejes pasar y avísale a la maestra.',
  fin: '¡Excelente reunión! Silenciada cuando tocaba, con la mano en su turno y con la puerta bien cuidada.',
};

/** Las demás líneas de Bit: las razones de cada fallo, que son la enseñanza. */
const LINEAS = {
  arranque:
    'Ahí está la cabina. El monitor está apagado y la maestra ya nos espera: enciéndelo y entramos juntos.',
  encendido:
    'Fíjate: no entramos de golpe. Todo programa de videollamada te deja primero en una sala de espera.',
  luzApagada: 'Apagada tampoco vale: sales oscura. La cámara necesita luz de tu lado, no detrás.',
  fondoAbierto: 'Todavía se ve tu cuarto entero. Cierra el biombo y deja una pared lisa.',
  fondoBien: 'Así. Ahora detrás de ti no hay nada que contar.',
  camara: 'Con la cámara apagada, la maestra habla con un cuadro gris. Aquí sí toca verse.',
  camaraBien: 'Ya te ves. Esa de ahí es tu ventana, y la enciendes tú.',
  microBien: 'Silenciada. Así se entra a una reunión que ya empezó.',
  entrarBloqueado:
    'Todavía no. Mírate en la vista previa: hay algo que los demás van a ver antes que a ti.',
  luzEnLaMesa: 'Esa no se arregla aquí dentro: la lámpara está en tu mesa. Muévela tú.',
  fondoEnLaMesa: 'Esa tampoco: el biombo está detrás de ti, en el cuarto. Ciérralo tú.',
  entrada:
    'Ya estamos dentro. Mira los cuatro recuadros: Bit, tú, Diego y la maestra. Quien habla se enmarca solo.',
  saludo:
    'Encendiste el micrófono para saludar y ahí se te quedó, abierto. Eso le pasa a todo el mundo.',
  ruido: 'Espera, algo se está colando por tu micrófono. Lee el aviso de arriba.',
  turno: 'La maestra pide quién quiere contar. Tú quieres. Pero no se habla encima: se pide turno.',
  turnoBien:
    'Ahí estás, segunda en la lista, detrás de Bit. La maestra ahora sabe a quién le toca y en qué orden.',
  dosHablando:
    'Cuando hablan dos, no se entiende nadie. Baja el micrófono y pide turno con el botón de la mano.',
  meTocaBien: 'Eso. Micrófono arriba, mano abajo: ya contaste lo tuyo y la lista sigue limpia.',
  grabacionBien:
    'Dijiste que no y no pasó nada malo. Eso también se puede hacer en una videollamada.',
  grabacionSi:
    'Ahora tu cara y tu voz quedan guardadas en la computadora de Diego, y ya no puedes decidir a dónde van.',
  enlaceMal:
    'Con ese enlace entra cualquiera a quien Diego se lo pase, y tú ya no sabes quién. Vuelve a decidir.',
  coanfitriona:
    'Te dejaron cuidando la puerta. Cada quien que toque se decide con un motivo, no de puro sí o no.',
  esperar: 'No pasa nada por dejar a alguien esperando. Pasa más por abrir sin saber.',
  insiste: 'No se discute con alguien así. Se sale y se avisa. Eso no es huir.',
  chat: 'Aquí sólo se lee. En esta reunión el chat lo escriben la maestra y Diego.',
  salirPronto: 'Todavía no. El botón rojo es para cuando algo va mal de verdad, no para asomarse.',
};

/* ── quiénes están en la llamada ─────────────────────────────────────────── */

const YO = 'Sofi (tú)';

interface Participante {
  id: string;
  nombre: string;
  /** Lo que se dibuja en el recuadro cuando no hay cámara: inicial o carita. */
  ficha: string;
  color: string;
}

const PARTICIPANTES: Participante[] = [
  { id: 'bit', nombre: 'Bit', ficha: '🤖', color: '#22D3EE' },
  { id: 'sofi', nombre: YO, ficha: 'S', color: '#F5A524' },
  { id: 'diego', nombre: 'Diego', ficha: 'D', color: '#7C5CBF' },
  { id: 'lucia', nombre: 'maestra Lucía', ficha: 'L', color: '#34D399' },
];

/* ── los cinco controles de la barra de abajo ────────────────────────────── */

type ControlId = 'micro' | 'camara' | 'mano' | 'chat' | 'salir';

interface Control {
  id: ControlId;
  icono: string;
  nombre: string;
  /** El globito de ayuda al pasar por encima (§24.4, «ayuda incorporada»). */
  tip: string;
}

const CONTROLES: Control[] = [
  { id: 'micro', icono: '🎤', nombre: 'Silenciar', tip: 'Apaga tu micrófono. Nadie te oye.' },
  { id: 'camara', icono: '📷', nombre: 'Cámara', tip: 'Enciende o apaga tu ventana.' },
  { id: 'mano', icono: '✋', nombre: 'Levantar la mano', tip: 'Pides turno sin interrumpir.' },
  { id: 'chat', icono: '💬', nombre: 'Chat', tip: 'Lo que se escribe durante la reunión.' },
  { id: 'salir', icono: '🚪', nombre: 'Salir', tip: 'Te sales de la reunión.' },
];

/* ── fase 1 · las cuatro comprobaciones de la antesala ───────────────────── */

type CheckId = 'luz' | 'fondo' | 'micro' | 'camara';

interface Comprobacion {
  id: CheckId;
  icono: string;
  nombre: string;
  /** Dónde se arregla: en el cuarto (mueble) o en el programa (interruptor). */
  donde: 'cuarto' | 'programa';
}

const COMPROBACIONES: Comprobacion[] = [
  { id: 'luz', icono: '💡', nombre: 'Luz', donde: 'cuarto' },
  { id: 'fondo', icono: '🪟', nombre: 'Fondo', donde: 'cuarto' },
  { id: 'micro', icono: '🎤', nombre: 'Micrófono', donde: 'programa' },
  { id: 'camara', icono: '📷', nombre: 'Cámara', donde: 'programa' },
];

/* ── fase 2 · los cinco momentos de la reunión ───────────────────────────── */

type MomentoId = 'ruido' | 'turno' | 'me-toca' | 'grabacion' | 'enlace';

interface Momento {
  id: MomentoId;
  /** Quién tiene la palabra: su recuadro se enmarca en ámbar. */
  hablando: string;
  /** Lo que se lee bajo el recuadro de quien habla. */
  dice: string;
  /** El aviso amarillo dentro del programa, o `null`. */
  aviso: string | null;
  /** Lo que Bit dice al llegar el momento. */
  entrada: string;
  /** El control con el que se resuelve, para la pista de la segunda vuelta. */
  pista: string;
}

const MOMENTOS: Momento[] = [
  {
    id: 'ruido',
    hablando: 'Diego',
    dice: 'Nosotros medimos el volcán con la regla y…',
    aviso: 'Tu micrófono está captando ruido',
    entrada: LINEAS.ruido,
    pista: 'Busca el botón del micrófono, el primero de la barra.',
  },
  {
    id: 'turno',
    hablando: 'maestra Lucía',
    dice: '¿Quién quiere contarnos cómo va su maqueta?',
    aviso: null,
    entrada: LINEAS.turno,
    pista: 'El botón de la mano, el tercero. Ahí se pide turno.',
  },
  {
    id: 'me-toca',
    hablando: 'maestra Lucía',
    dice: 'Sofi, tú tenías la mano.',
    aviso: null,
    entrada: VOZ.meToca,
    pista: 'Dos cosas: enciende el micrófono y baja la mano.',
  },
  {
    id: 'grabacion',
    hablando: 'Diego',
    dice: 'Maestra, ¿puedo grabar para enseñárselo a mi primo?',
    aviso: 'Diego quiere grabar esta reunión',
    entrada: VOZ.grabacion,
    pista: 'Tu cara y tu voz son tuyas: puedes decir que no.',
  },
  {
    id: 'enlace',
    hablando: 'Diego',
    dice: 'Sofi, mira el chat.',
    aviso: null,
    entrada: 'Diego te escribió por el chat. Léelo antes de tocar nada.',
    pista: 'Piensa quién invita a esta reunión.',
  },
];

/** Las razones de cada control equivocado, momento por momento. */
const RECHAZO_CONTROL: Record<string, string> = {
  'ruido|camara':
    'La cámara no es lo que se está oyendo. Apagarla sólo hace que la maestra te deje de ver.',
  'ruido|mano': 'Levantar la mano no apaga el ruido de tu casa. Se sigue colando todo.',
  'turno|micro': LINEAS.dosHablando,
  'turno|camara': 'Apagar la cámara no pide turno: sólo desapareces mientras hablan los demás.',
  'me-toca|micro':
    'Ya es tu turno; si te silencias, la maestra pasa al siguiente y te quedas sin contar.',
  'me-toca|camara': LINEAS.camara,
};

/* ── fase 3 · las tres solicitudes de la puerta ──────────────────────────── */

type MotivoId = 'ya-estaba' | 'no-se-quien' | 'invita-maestra';

const MOTIVOS: { id: MotivoId; texto: string }[] = [
  { id: 'ya-estaba', texto: 'Ya estaba en la reunión y se le cortó' },
  { id: 'no-se-quien', texto: 'No sé quién es' },
  { id: 'invita-maestra', texto: 'A esta reunión invita la maestra' },
];

interface Solicitud {
  id: string;
  /** Lo que el programa sabe de quien toca: eso y nada más. */
  nombre: string;
  ficha: string | null;
  color: string;
  camara: boolean;
  detalle: string;
  admitir: boolean;
  motivo: MotivoId;
  /** Si además hay que avisar a la maestra (§24.4). */
  avisar: boolean;
  /** Lo que Bit dice al aparecer la tarjeta. */
  entrada: string;
  /** Lo que Bit dice al resolverla bien. */
  acierto: string;
  /** La razón de la decisión equivocada. */
  rechazo: string;
}

const SOLICITUDES: Solicitud[] = [
  {
    id: 's-diego',
    nombre: 'Diego Ramírez',
    ficha: 'D',
    color: '#7C5CBF',
    camara: true,
    detalle: '4.º B · con foto y cámara',
    admitir: true,
    motivo: 'ya-estaba',
    avisar: false,
    entrada: 'Alguien toca. Antes de decidir, lee lo que el programa sabe de quien está ahí.',
    acierto: 'Bien: es el mismo Diego que estaba hace un minuto y se le cortó. Ese sí vuelve.',
    rechazo:
      'A Diego lo conoces, lleva toda la reunión aquí y se le cortó. Dejarlo fuera no cuida nada.',
  },
  {
    id: 's-invitado',
    nombre: 'Invitado',
    ficha: null,
    color: '#F87171',
    camara: false,
    detalle: 'Sin nombre · sin foto · sin cámara',
    admitir: false,
    motivo: 'no-se-quien',
    avisar: true,
    entrada: VOZ.puerta,
    acierto: LINEAS.esperar,
    rechazo:
      'Acabas de abrirle a alguien que no tiene nombre ni cara. Ciérrale y avísale a la maestra.',
  },
  {
    id: 's-primo',
    nombre: 'Primo de Diego',
    ficha: 'P',
    color: '#7C5CBF',
    camara: true,
    detalle: 'Con foto · lo manda Diego',
    admitir: false,
    motivo: 'invita-maestra',
    avisar: false,
    entrada: 'Otro más. Este sí tiene nombre y foto. Piénsalo igual.',
    acierto: 'Aunque sepas quién es, no te toca a ti invitarlo. La reunión es de la maestra.',
    rechazo:
      'Tener foto y nombre no es lo mismo que estar invitado. A esta reunión la convocó la maestra.',
  },
];

/** Por qué no es ese el motivo. La clave es «motivo bueno|motivo elegido». */
const RECHAZO_MOTIVO: Record<string, string> = {
  'ya-estaba|no-se-quien': 'Sí sabes quién es: es Diego, lleva toda la reunión contigo.',
  'ya-estaba|invita-maestra': 'A Diego ya lo había invitado la maestra. Sólo se le cortó.',
  'no-se-quien|ya-estaba': 'Nadie con ese nombre estaba en la reunión. Es la primera vez que toca.',
  'no-se-quien|invita-maestra': 'Eso también es cierto, pero aquí hay algo más grave: ni sabes quién es.',
  'invita-maestra|ya-estaba': 'El primo de Diego no estaba antes: nunca ha entrado a esta reunión.',
  'invita-maestra|no-se-quien': 'Sí sabes quién es, viene con nombre y foto. El problema es quién invita.',
};

/* ── la vista previa: un DIBUJO de la cabina, no una imagen de nadie ─────── */

/* Los foquitos de la guirnalda, colgando en parábola de x 10 a x 266 con 14 de
   caída. Son los mismos once del 3D y en los mismos tres colores: la previa
   tiene que enseñar el cuarto que hay detrás, no otro cuarto. */
const FOQUITOS_PREVIA = Array.from({ length: 11 }, (_, i) => {
  const t = i / 10;
  return {
    x: 10 + t * 256,
    y: 14 + 14 * 4 * t * (1 - t),
    color: ['#FFD9A0', '#22D3EE', '#34D399'][i % 3],
  };
});

/**
 * Lo que la cámara de pinza «ve» del cuarto, dibujado a mano con formas.
 *
 * Es el puente entre las dos capas: la lámpara y el biombo son objetos del 3D y
 * aquí se convierten en luz y en fondo. No hay cámara de verdad en toda la
 * actividad (§22.3): esto son cuatro elipses y un degradado.
 *
 * ── POR QUÉ EL FONDO ESTÁ CALCADO DEL 3D ────────────────────────────────────
 * Esta previa es el espejo del cuarto de atrás, y el niño compara las dos
 * capas con los ojos: si en el 3D hay un póster de un planeta y aquí sale una
 * hoja beige con rayas, «se ve tu cuarto» deja de significar nada. Por eso el
 * póster, la guirnalda y la cama de aquí son los mismos objetos de
 * `CuartoDetras3D`, con las medidas pasadas a este viewBox de 276 × 222.
 *
 * Y con el biombo cerrado se dibuja un biombo DE VERDAD —tres hojas con sus
 * montantes de madera— y no la raya única que había en x 138: esa raya caía
 * en el centro exacto del cuadro, justo detrás de la cabeza de Sofi, y no se
 * leía como un pliegue sino como una costura del render. Los pliegues nuevos
 * van en 91 y 185, fuera de la silueta de la cabeza (96–180).
 */
function VistaPrevia({
  camara,
  lampara,
  biomboCerrado,
  clase,
}: {
  camara: boolean;
  lampara: PosicionLampara;
  biomboCerrado: boolean;
  clase: string;
}) {
  if (!camara) {
    return (
      <svg className={clase} viewBox="0 0 276 222" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="276" height="222" fill="#1A222E" />
        <circle cx="138" cy="105" r="38" fill="#2C3644" />
        <text x="138" y="120" textAnchor="middle" fontSize="38" fontWeight="900" fill="#7C8798">
          S
        </text>
        <text x="138" y="176" textAnchor="middle" fontSize="13" fontWeight="700" fill="#63707F">
          Cámara apagada
        </text>
      </svg>
    );
  }

  const silueta = lampara === 'detras';
  const oscura = lampara === 'apagada';
  const piel = silueta ? '#060C14' : oscura ? '#4A3B32' : '#C98A5E';
  const pelo = silueta ? '#03070C' : oscura ? '#2A2119' : '#4A3020';
  const ropa = silueta ? '#050A11' : oscura ? '#22354A' : '#2F5D8A';
  const luzAmbiente = oscura ? 0.18 : 1;

  return (
    <svg className={clase} viewBox="0 0 276 222" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="rev-halo" cx="50%" cy="42%" r="52%">
          <stop offset="0%" stopColor="#FFF3D6" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#FFD9A0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFD9A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rev-frente" cx="38%" cy="34%" r="60%">
          <stop offset="0%" stopColor="#FFE7C0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFE7C0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* el cuarto o el biombo: lo que hay DETRÁS de ti también sale en la llamada */}
      <rect width="276" height="222" fill={biomboCerrado ? '#123043' : '#241812'} />
      {biomboCerrado ? (
        /* El biombo cerrado: tres hojas de tela con sus montantes de madera.
           Los montantes van en 78 y 192 y no en 88 y 182 porque el marco de la
           previa mide 276 × 270 y el `slice` escala 1.216: de este viewBox sólo
           se ven las x 24.5–251.5, y ahí la cabeza de Sofi ocupa de 96 a 180.
           En 88 y 182 los pliegues caían justo sobre el canto de la cara.
           Y son MÁS OSCUROS que el paño, como en el 3D: puestos más claros se
           leían como dos barras ámbar pegadas encima, no como un biombo. */
        <>
          <rect x="0" y="0" width="78" height="222" fill="#2E4351" />
          <rect x="84" y="0" width="108" height="222" fill="#243642" />
          <rect x="198" y="0" width="78" height="222" fill="#1A2830" />
          <rect x="78" y="0" width="6" height="222" fill="#20140A" />
          <rect x="192" y="0" width="6" height="222" fill="#20140A" />
          <rect x="0" y="196" width="276" height="26" fill="#20140A" />
        </>
      ) : (
        <>
          {/* el suelo y el rodapié del cuarto */}
          <rect x="0" y="182" width="276" height="40" fill="#241A12" />

          {/* la cama: cabecera con su barra de latón, edredón morado y almohada */}
          <rect x="150" y="88" width="126" height="6" fill="#C8A13C" />
          <rect x="150" y="94" width="126" height="30" fill="#3E2712" />
          <rect x="150" y="118" width="126" height="12" fill="#D8E3EA" />
          <rect x="150" y="126" width="126" height="58" rx="6" fill="#7C5CBF" />
          <rect x="158" y="104" width="46" height="20" rx="8" fill="#EDE3CF" />

          {/* el póster pegado con cinta: el mismo planeta con anillo del 3D */}
          <g transform="rotate(-4 60 85)">
            <rect x="34" y="52" width="52" height="66" rx="1" fill="#14243A" />
            <circle cx="60" cy="78" r="15" fill="#22D3EE" />
            <ellipse
              cx="60"
              cy="78"
              rx="21"
              ry="6.7"
              fill="none"
              stroke="#F5A524"
              strokeWidth="4.4"
              transform="rotate(-22 60 78)"
            />
            <rect x="41" y="100" width="38" height="4" fill="#F5A524" />
            <rect x="41" y="108" width="32" height="3" fill="#34D399" />
            <rect x="30" y="48" width="12" height="5" rx="1" fill="#F2F2F2" opacity="0.65" transform="rotate(-28 36 50)" />
            <rect x="78" y="48" width="12" height="5" rx="1" fill="#F2F2F2" opacity="0.65" transform="rotate(28 84 50)" />
          </g>

          {/* la guirnalda: el cable y los once foquitos, con su halo */}
          <path d="M10 14 Q138 42 266 14" fill="none" stroke="#241608" strokeWidth="2" />
          {FOQUITOS_PREVIA.map((f) => (
            <g key={f.x}>
              <circle cx={f.x} cy={f.y} r="9" fill={f.color} opacity="0.22" />
              <circle cx={f.x} cy={f.y} r="4" fill={f.color} />
            </g>
          ))}
        </>
      )}

      {/* la luz: detrás te vuelve sombra, de frente te enseña la cara */}
      {silueta && <circle cx="138" cy="92" r="118" fill="url(#rev-halo)" />}
      {lampara === 'frente' && <rect width="276" height="222" fill="url(#rev-frente)" />}

      {/* Sofi: hombros, cuello, cara y pelo. Cuatro formas, ninguna foto. */}
      <g opacity={luzAmbiente}>
        <path d="M46 222 Q46 168 138 168 Q230 168 230 222 Z" fill={ropa} />
        <rect x="122" y="128" width="32" height="30" rx="10" fill={piel} />
        <ellipse cx="138" cy="106" rx="42" ry="48" fill={piel} />
        <path d="M96 100 Q100 52 138 52 Q176 52 180 100 Q168 74 138 74 Q108 74 96 100 Z" fill={pelo} />
        {lampara === 'frente' && (
          <>
            <ellipse cx="122" cy="104" rx="5" ry="6" fill="#1B2330" />
            <ellipse cx="154" cy="104" rx="5" ry="6" fill="#1B2330" />
            <path d="M124 126 Q138 137 152 126" stroke="#8A4E3A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}

/* ── la actividad ────────────────────────────────────────────────────────── */

type Fase = 'apagado' | 'antesala' | 'ruidosa' | 'reunion' | 'puerta' | 'fin';
type DialogoId = null | 'grabacion' | 'enlace' | 'solicitud' | 'insiste' | 'avisar';
type PasoSolicitud = 'decidir' | 'motivo' | 'avisar';

interface Recado {
  id: number;
  de: string;
  texto: string;
}

const SIGUIENTE_LAMPARA: Record<PosicionLampara, PosicionLampara> = {
  detras: 'apagada',
  apagada: 'frente',
  frente: 'detras',
};

const ETIQUETA_LAMPARA: Record<PosicionLampara, string> = {
  detras: 'Detrás de ti',
  apagada: 'Apagada',
  frente: 'De frente',
};

export function LabVideollamadasConRespeto(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('apagado');

  /* el cuarto: los dos objetos de madera */
  const [lampara, setLampara] = useState<PosicionLampara>('detras');
  const [biomboCerrado, setBiomboCerrado] = useState(false);
  const [mano3d, setMano3d] = useState(false);

  /* el programa */
  const [micro, setMicro] = useState(true);
  const [camara, setCamara] = useState(false);
  const [manoBoton, setManoBoton] = useState(false);
  const [manos, setManos] = useState<string[]>(['Bit']);
  const [chat, setChat] = useState<Recado[]>([]);
  const [avisoPrograma, setAvisoPrograma] = useState<string | null>(null);
  const [controlMal, setControlMal] = useState<ControlId | null>(null);
  const [encimados, setEncimados] = useState(false);
  const [diegoCaido, setDiegoCaido] = useState(false);
  const [reloj, setReloj] = useState(0);

  /* fase 2 */
  const [momento, setMomento] = useState(0);
  const [dialogo, setDialogo] = useState<DialogoId>(null);
  const [pista, setPista] = useState<string | null>(null);

  /* fase 3 */
  const [solicitud, setSolicitud] = useState(0);
  const [pasoSolicitud, setPasoSolicitud] = useState<PasoSolicitud>('decidir');
  const [motivoMal, setMotivoMal] = useState<MotivoId | null>(null);
  const [resueltas, setResueltas] = useState(0);

  /* comunes */
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.arranque);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, segundos: 0 });
  const contados = useRef<Set<string>>(new Set());
  const recadoId = useRef(0);
  const propsRef = useRef(props);
  const vivo = useRef({
    terminado,
    fase,
    lampara,
    biomboCerrado,
    mano3d,
    micro,
    camara,
    manoBoton,
    momento,
    dialogo,
    solicitud,
    pasoSolicitud,
    pasos,
  });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = {
      terminado,
      fase,
      lampara,
      biomboCerrado,
      mano3d,
      micro,
      camara,
      manoBoton,
      momento,
      dialogo,
      solicitud,
      pasoSolicitud,
      pasos,
    };
  });
  /* Dos relojes distintos, y por eso son dos.

     Éste es el de la actividad: cuenta desde que se monta hasta que se cierra,
     antesala incluida, y es el que se reporta en `tiempoSegundos`. Vive en el
     ref y no en un estado porque nadie lo pinta —sólo se lee una vez, al
     terminar—, y así `terminar` no tiene que llamar a `Date.now()` en cuerpo de
     componente, que es impuro y el linter lo rechaza con razón. */
  useEffect(() => {
    const id = window.setInterval(() => {
      sim.current.segundos += 1;
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Y éste es el de la barra de título: el tiempo que llevas dentro de la
     reunión. Corre sólo cuando estás dentro, como el de cualquier programa de
     verdad. */
  useEffect(() => {
    if (fase !== 'reunion' && fase !== 'puerta' && fase !== 'ruidosa') return;
    const id = window.setInterval(() => setReloj((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [fase]);

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Un paso resuelto. La clave evita contar dos veces lo que se puede deshacer. */
  const avanzar = (clave: string) => {
    if (contados.current.has(clave)) return;
    contados.current.add(clave);
    const hechos = contados.current.size;
    setPasos(hechos);
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
  };

  const escribir = (de: string, texto: string) => {
    recadoId.current += 1;
    const id = recadoId.current;
    setChat((previos) => [...previos, { id, de, texto }]);
  };

  const terminar = () => {
    const tiempoSegundos = Math.max(1, sim.current.segundos);
    reproducirTono('complete');
    hablar(VOZ.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setFase('fin');
    setTerminado(true);
  };

  /* ── el cuarto: lámpara y biombo ───────────────────────────────────────── */

  const ponerLampara = (destino: PosicionLampara) => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    setLampara(destino);
    if (destino === 'frente') {
      avanzar('luz');
      if (vivo.current.fase === 'antesala') hablar(VOZ.luzFrente);
      return;
    }
    if (vivo.current.fase !== 'antesala') return;
    hablar(destino === 'apagada' ? LINEAS.luzApagada : VOZ.luzDetras);
  };

  const girarLampara = () => ponerLampara(SIGUIENTE_LAMPARA[vivo.current.lampara]);

  const moverBiombo = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    const cerrado = !vivo.current.biomboCerrado;
    setBiomboCerrado(cerrado);
    if (cerrado) {
      avanzar('fondo');
      if (vivo.current.fase === 'antesala') hablar(LINEAS.fondoBien);
      return;
    }
    if (vivo.current.fase === 'antesala') hablar(LINEAS.fondoAbierto);
  };

  /** La mano de verdad, la que está sobre la mesa. No la ve nadie. */
  const tocarMano3D = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    setMano3d((arriba) => !arriba);
    if (vivo.current.fase === 'reunion' && MOMENTOS[vivo.current.momento]?.id === 'turno') {
      restar();
      hablar(VOZ.manoFisica);
      return;
    }
    hablar(VOZ.manoFisica);
  };

  /* ── fase 0 · encender el monitor ──────────────────────────────────────── */

  const encender = () => {
    if (sim.current.ocupado || vivo.current.fase !== 'apagado') return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setFase('antesala');
    setAviso('Tecnia Reunión · antesala');
    hablar(LINEAS.encendido);
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      hablar(VOZ.antesala);
    }, 2600);
  };

  /* ── fase 1 · la antesala ──────────────────────────────────────────────── */

  const alternarMicro = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    const abierto = !vivo.current.micro;
    setMicro(abierto);
    if (!abierto) {
      avanzar('micro');
      hablar(LINEAS.microBien);
      return;
    }
    hablar(VOZ.micro);
  };

  const alternarCamara = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    const encendida = !vivo.current.camara;
    setCamara(encendida);
    if (encendida) {
      avanzar('camara');
      hablar(LINEAS.camaraBien);
      return;
    }
    hablar(LINEAS.camara);
  };

  /** Tocar una comprobación que no se arregla aquí: Bit dice dónde se arregla. */
  const tocarCheck = (id: CheckId) => {
    if (vivo.current.terminado) return;
    if (id === 'micro') return alternarMicro();
    if (id === 'camara') return alternarCamara();
    reproducirTono('select');
    hablar(id === 'luz' ? LINEAS.luzEnLaMesa : LINEAS.fondoEnLaMesa);
  };

  const entrar = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'antesala') return;
    const v = vivo.current;
    if (v.lampara !== 'frente' || !v.biomboCerrado || !v.camara) {
      restar();
      hablar(LINEAS.entrarBloqueado);
      return;
    }

    /* El micrófono abierto no lo impide el programa: lo impide la educación. Y
       eso no se enseña con un botón gris, se enseña entrando así una vez. */
    if (v.micro) {
      restar();
      sim.current.ocupado = true;
      reproducirTono('open');
      setFase('ruidosa');
      setAvisoPrograma('Estás entrando con el micrófono abierto');
      escribir('Diego', 'Sofi, se te oye la tele.');
      hablar(VOZ.micro);
      timers.despues(() => {
        sim.current.ocupado = false;
      }, 1200);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('power');
    avanzar('entrar');
    setFase('reunion');
    setMomento(0);
    setAviso('Reunión · Equipo de ciencias');
    setAvisoPrograma(null);
    escribir('maestra Lucía', 'Bienvenida, Sofi. Ya empezamos.');
    hablar(LINEAS.entrada);
    timers.despues(() => {
      setAviso(null);
      /* Sofi contesta el saludo, y para contestar hay que encender. Esto no es
         un capricho del guion: el micrófono que se queda abierto después de
         saludar es EXACTAMENTE como empieza el problema en la vida real, y si
         entráramos silenciados y el programa avisara de ruido sin que nadie
         hubiera tocado nada, el aviso sería mentira. */
      setMicro(true);
      escribir(YO, 'Hola a todos, perdón, ya llegué.');
      hablar(LINEAS.saludo);
      timers.despues(() => {
        setAvisoPrograma(MOMENTOS[0].aviso);
        hablar(MOMENTOS[0].entrada);
        sim.current.ocupado = false;
        armarPista(0);
      }, 3400);
    }, 3000);
  };

  /** Volver a la antesala desde la entrada ruidosa: el micrófono sigue abierto. */
  const salirDeLaRuidosa = () => {
    if (sim.current.ocupado || vivo.current.fase !== 'ruidosa') return;
    sim.current.ocupado = true;
    reproducirTono('close');
    setFase('antesala');
    setAvisoPrograma(null);
    hablar('Bien pensado: saliste. Ahora silénciate ahí en la antesala y vuelve a entrar.');
    timers.despues(() => {
      sim.current.ocupado = false;
    }, 900);
  };

  /* ── fase 2 · los cinco momentos ───────────────────────────────────────── */

  /** Si el momento se atora, la pista se hace más clara. Nunca se acaba la llamada. */
  const armarPista = (indice: number) => {
    setPista(null);
    timers.despues(() => {
      if (vivo.current.fase !== 'reunion' || vivo.current.momento !== indice) return;
      setPista(MOMENTOS[indice].pista);
      if (MOMENTOS[indice].id === 'ruido') {
        setDiegoCaido(true);
        escribir('Diego', '¿hola?, ¿se cortó?');
        hablar(VOZ.ruidoTarda);
      }
    }, 9000);
  };

  const siguienteMomento = () => {
    const proximo = vivo.current.momento + 1;
    setPista(null);
    setDiegoCaido(false);
    if (proximo < MOMENTOS.length) {
      setMomento(proximo);
      setAvisoPrograma(MOMENTOS[proximo].aviso);
      hablar(MOMENTOS[proximo].entrada);
      if (MOMENTOS[proximo].id === 'grabacion') {
        timers.despues(() => setDialogo('grabacion'), 1800);
      }
      if (MOMENTOS[proximo].id === 'enlace') {
        timers.despues(() => {
          escribir('Diego', 'Sofi, pásame el enlace y meto a mi primo, quiere ver la maqueta.');
          setDialogo('enlace');
        }, 1800);
      }
      armarPista(proximo);
      sim.current.ocupado = false;
      return;
    }

    /* Se acabaron los momentos: la maestra deja la puerta a cargo de Sofi. */
    setAvisoPrograma(null);
    setAviso('Ahora cuidas la puerta');
    escribir('maestra Lucía', 'Sofi, te dejo de coanfitriona un momento, cuídame la puerta.');
    hablar(LINEAS.coanfitriona);
    timers.despues(() => {
      setAviso(null);
      setFase('puerta');
      setSolicitud(0);
      setPasoSolicitud('decidir');
      setDialogo('solicitud');
      hablar(SOLICITUDES[0].entrada);
      sim.current.ocupado = false;
    }, 3200);
  };

  const resolverMomento = (mensaje: string) => {
    sim.current.ocupado = true;
    reproducirTono('correct');
    avanzar(`m-${MOMENTOS[vivo.current.momento].id}`);
    setAvisoPrograma(null);
    hablar(mensaje);
    timers.despues(siguienteMomento, 2400);
  };

  const errorControl = (id: ControlId, razon: string) => {
    restar();
    setControlMal(id);
    hablar(razon);
    timers.despues(() => setControlMal(null), 900);
  };

  const pulsarControl = (id: ControlId) => {
    if (vivo.current.terminado) return;

    /* La entrada ruidosa: lo único que se puede hacer es salir. */
    if (vivo.current.fase === 'ruidosa') {
      if (id === 'salir') return salirDeLaRuidosa();
      reproducirTono('select');
      hablar('Ya estás dentro y se te oye todo. Sal, silénciate y vuelve a entrar.');
      return;
    }

    if (id === 'chat') {
      reproducirTono('select');
      hablar(LINEAS.chat);
      return;
    }

    /* El cierre de la fase 3: aquí el botón rojo SÍ es la respuesta. */
    if (vivo.current.fase === 'puerta' && vivo.current.dialogo === 'insiste') {
      if (id !== 'salir') {
        errorControl(id, 'Ese botón no te saca de aquí. El de la puerta es el rojo del final.');
        return;
      }
      sim.current.ocupado = true;
      reproducirTono('power');
      setDialogo('avisar');
      hablar(LINEAS.insiste);
      timers.despues(() => {
        sim.current.ocupado = false;
      }, 800);
      return;
    }

    if (id === 'salir') {
      errorControl('salir', LINEAS.salirPronto);
      return;
    }

    if (sim.current.ocupado || vivo.current.fase !== 'reunion') {
      reproducirTono('select');
      const control = CONTROLES.find((c) => c.id === id);
      if (control) hablar(`${control.nombre}: ${control.tip}`);
      return;
    }

    const actual = MOMENTOS[vivo.current.momento];

    if (actual.id === 'ruido') {
      if (id !== 'micro') {
        errorControl(id, RECHAZO_CONTROL[`ruido|${id}`] ?? 'Ese no apaga lo que se está oyendo.');
        return;
      }
      setMicro(false);
      setDiegoCaido(false);
      resolverMomento(VOZ.silencioBien);
      return;
    }

    if (actual.id === 'turno') {
      if (id === 'micro') {
        /* Los dos recuadros en rojo: el de quien habla y el tuyo. */
        setMicro(true);
        setEncimados(true);
        errorControl('micro', LINEAS.dosHablando);
        timers.despues(() => {
          setMicro(false);
          setEncimados(false);
        }, 1600);
        return;
      }
      if (id !== 'mano') {
        errorControl(id, RECHAZO_CONTROL[`turno|${id}`] ?? 'Con ese botón no se pide turno.');
        return;
      }
      setManoBoton(true);
      setManos(['Bit', YO]);
      resolverMomento(LINEAS.turnoBien);
      return;
    }

    if (actual.id === 'me-toca') {
      /* Dos acciones, en cualquier orden: micrófono arriba y mano abajo. */
      if (id === 'camara') {
        errorControl('camara', RECHAZO_CONTROL['me-toca|camara']);
        return;
      }
      if (id === 'micro') {
        if (vivo.current.micro) {
          setMicro(false);
          errorControl('micro', RECHAZO_CONTROL['me-toca|micro']);
          return;
        }
        reproducirTono('select');
        setMicro(true);
        if (!vivo.current.manoBoton) {
          hablar('Ya se te oye. Ahora baja la mano: ya no estás pidiendo turno, ya lo tienes.');
          return;
        }
        return;
      }
      if (id === 'mano') {
        if (!vivo.current.manoBoton) {
          errorControl('mano', 'Tu mano ya está abajo. Lo que falta es que se te oiga.');
          return;
        }
        reproducirTono('select');
        setManoBoton(false);
        setManos(['Bit']);
        if (!vivo.current.micro) {
          hablar('Mano abajo. Falta que enciendas el micrófono, que si no cuentas nada.');
          return;
        }
      }
      /* Si al salir de aquí están las dos condiciones, el momento se cierra. */
      timers.despues(() => {
        if (vivo.current.micro && !vivo.current.manoBoton && vivo.current.fase === 'reunion') {
          setManos(['Bit']);
          resolverMomento(LINEAS.meTocaBien);
        }
      }, 60);
      return;
    }

    /* Los momentos 4 y 5 se resuelven en su diálogo, no en la barra. */
    reproducirTono('select');
    hablar('Eso se decide en la ventana que está abierta, no en la barra de abajo.');
  };

  /* ── los dos diálogos del programa ─────────────────────────────────────── */

  const responderGrabacion = (permite: boolean) => {
    if (sim.current.ocupado || vivo.current.dialogo !== 'grabacion') return;
    setDialogo(null);
    if (permite) {
      restar();
      hablar(LINEAS.grabacionSi);
      escribir('Diego', 'Ya está grabando.');
      timers.despues(() => {
        escribir('maestra Lucía', 'Diego, para la grabación. Vuelve a preguntar, Sofi.');
        setDialogo('grabacion');
        setPista('Puedes decir que no: es tu cara y es tu voz.');
      }, 2600);
      return;
    }
    escribir(
      'maestra Lucía',
      'Bien dicho, Sofi. Hoy no grabamos: para grabar tenemos que estar todos de acuerdo y avisar a sus familias.',
    );
    resolverMomento(LINEAS.grabacionBien);
  };

  const responderEnlace = (pasa: boolean) => {
    if (sim.current.ocupado || vivo.current.dialogo !== 'enlace') return;
    setDialogo(null);
    if (pasa) {
      restar();
      hablar(LINEAS.enlaceMal);
      timers.despues(() => {
        setDialogo('enlace');
        setPista('Piensa quién invita a esta reunión.');
      }, 2400);
      return;
    }
    escribir('Sofi (tú)', 'Pregúntale a la maestra, Diego.');
    resolverMomento(VOZ.enlace);
  };

  /* ── fase 3 · la puerta ────────────────────────────────────────────────── */

  const decidirPuerta = (admite: boolean) => {
    if (sim.current.ocupado || vivo.current.fase !== 'puerta') return;
    if (vivo.current.pasoSolicitud !== 'decidir') return;
    const s = SOLICITUDES[vivo.current.solicitud];
    if (!s) return;

    if (admite !== s.admitir) {
      restar();
      hablar(s.rechazo);
      return;
    }
    reproducirTono('correct');
    setPasoSolicitud('motivo');
    hablar('Ahora di por qué. La decisión sin motivo no se sostiene la próxima vez.');
  };

  const elegirMotivo = (id: MotivoId) => {
    if (sim.current.ocupado || vivo.current.fase !== 'puerta') return;
    if (vivo.current.pasoSolicitud !== 'motivo') return;
    const s = SOLICITUDES[vivo.current.solicitud];
    if (!s) return;

    if (id !== s.motivo) {
      restar();
      setMotivoMal(id);
      hablar(RECHAZO_MOTIVO[`${s.motivo}|${id}`] ?? 'Ese no es el motivo de esta decisión.');
      timers.despues(() => setMotivoMal(null), 900);
      return;
    }

    reproducirTono('correct');
    setMotivoMal(null);
    if (s.avisar) {
      setPasoSolicitud('avisar');
      hablar('Falta lo último y es lo más importante: díselo a la maestra.');
      return;
    }
    cerrarSolicitud(s);
  };

  const avisarMaestra = () => {
    if (sim.current.ocupado || vivo.current.fase !== 'puerta') return;
    const s = SOLICITUDES[vivo.current.solicitud];

    /* El mismo botón cierra la solicitud del invitado y el cierre de la fase. */
    if (vivo.current.dialogo === 'avisar') {
      sim.current.ocupado = true;
      reproducirTono('complete');
      avanzar('cierre');
      setDialogo(null);
      escribir('Sofi (tú)', 'Maestra, alguien sin nombre estaba insistiendo. Me salí.');
      timers.despues(terminar, 900);
      return;
    }

    if (vivo.current.pasoSolicitud !== 'avisar' || !s) return;
    reproducirTono('correct');
    escribir('Sofi (tú)', 'Maestra, tocó alguien sin nombre y no lo dejé pasar.');
    cerrarSolicitud(s);
  };

  const cerrarSolicitud = (s: Solicitud) => {
    sim.current.ocupado = true;
    avanzar(s.id);
    setResueltas((n) => n + 1);
    setDialogo(null);
    hablar(s.acierto);
    if (s.admitir) escribir('maestra Lucía', 'Gracias, Sofi.');

    const proxima = vivo.current.solicitud + 1;
    timers.despues(() => {
      if (proxima < SOLICITUDES.length) {
        setSolicitud(proxima);
        setPasoSolicitud('decidir');
        setDialogo('solicitud');
        hablar(SOLICITUDES[proxima].entrada);
        sim.current.ocupado = false;
        return;
      }
      /* El cierre: el invitado insiste. Con eso no se discute. */
      setDialogo('insiste');
      setAvisoPrograma('Alguien está insistiendo en la puerta');
      hablar('Vuelve el que no tiene nombre, y ahora te está hablando a ti. Léelo.');
      sim.current.ocupado = false;
    }, 2600);
  };

  const responderleAlInsistente = () => {
    if (vivo.current.terminado || vivo.current.dialogo !== 'insiste') return;
    restar();
    hablar(LINEAS.insiste);
  };

  /* ── reinicio ──────────────────────────────────────────────────────────── */

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, segundos: 0 };
    contados.current = new Set();
    recadoId.current = 0;
    setFase('apagado');
    setLampara('detras');
    setBiomboCerrado(false);
    setMano3d(false);
    setMicro(true);
    setCamara(false);
    setManoBoton(false);
    setManos(['Bit']);
    setChat([]);
    setAvisoPrograma(null);
    setControlMal(null);
    setEncimados(false);
    setDiegoCaido(false);
    setReloj(0);
    setMomento(0);
    setDialogo(null);
    setPista(null);
    setSolicitud(0);
    setPasoSolicitud('decidir');
    setMotivoMal(null);
    setResueltas(0);
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.arranque);
  };

  /* ── valores derivados ─────────────────────────────────────────────────── */

  const checkOk: Record<CheckId, boolean> = {
    luz: lampara === 'frente',
    fondo: biomboCerrado,
    micro: !micro,
    camara,
  };
  const estadoCheck: Record<CheckId, string> = {
    luz: ETIQUETA_LAMPARA[lampara],
    fondo: biomboCerrado ? 'Pared lisa' : 'Se ve tu cuarto',
    micro: micro ? 'Abierto' : 'Silenciado',
    camara: camara ? 'Encendida' : 'Apagada',
  };
  const razonCheck: Record<CheckId, string> = {
    luz: 'La cámara se ajusta a lo que más brilla. Si la luz está detrás, tú te vuelves la sombra.',
    fondo: 'Lo que hay detrás de ti también sale en la llamada. Deja una pared lisa.',
    micro: 'A una reunión que ya empezó se entra silenciado.',
    camara: 'Con la cámara apagada, la maestra habla con un cuadro gris.',
  };

  const listoParaEntrar = checkOk.luz && checkOk.fondo && checkOk.camara;
  const todoBien = listoParaEntrar && checkOk.micro;
  const enReunion = fase === 'reunion' || fase === 'puerta' || fase === 'ruidosa';
  const momentoActual = fase === 'reunion' ? MOMENTOS[momento] : null;
  const solicitudActual = fase === 'puerta' ? SOLICITUDES[solicitud] : null;

  /** Quién tiene la palabra ahora mismo. */
  const hablando =
    fase === 'ruidosa' ? 'maestra Lucía' : fase === 'puerta' ? 'maestra Lucía' : momentoActual?.hablando ?? null;

  const estadoControl = (id: ControlId): boolean => {
    if (id === 'micro') return micro;
    if (id === 'camara') return camara;
    if (id === 'mano') return manoBoton;
    return false;
  };

  /* ── el programa: «Tecnia Reunión» ─────────────────────────────────────── */

  const barra = (
    <div className="reunion3d-barra">
      <span className="reunion3d-barra-marca">Tecnia Reunión</span>
      <span className="reunion3d-barra-sala">Equipo de ciencias · 4.º B</span>
      <span className="reunion3d-barra-reloj">{enReunion ? formatTiempo(reloj) : '—:—'}</span>
    </div>
  );

  const antesala = (
    <div className="reunion3d-antesala">
      <div className="reunion3d-previa-caja">
        <div className="reunion3d-previa-marco">
          <VistaPrevia
            camara={camara}
            lampara={lampara}
            biomboCerrado={biomboCerrado}
            clase="reunion3d-previa"
          />
          <span className="reunion3d-previa-nombre">Sofi</span>
          {!micro && (
            <span className="reunion3d-previa-mudo" aria-hidden="true">
              🎤
            </span>
          )}
        </div>
        <p className="reunion3d-previa-pie">Así te van a ver los demás</p>
      </div>

      <div className="reunion3d-checks">
        <p className="reunion3d-checks-tit">Antes de entrar</p>
        {COMPROBACIONES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`reunion3d-check${checkOk[c.id] ? ' es-ok' : ''}`}
            onClick={() => tocarCheck(c.id)}
            title={razonCheck[c.id]}
          >
            <span className="reunion3d-check-icono" aria-hidden="true">
              {c.icono}
            </span>
            <span className="reunion3d-check-txt">
              <b>{c.nombre}</b>
              {estadoCheck[c.id]}
            </span>
            <span className={`reunion3d-check-luz${checkOk[c.id] ? ' es-ok' : ''}`}>
              {checkOk[c.id] ? '✓' : c.donde === 'cuarto' ? 'en tu mesa' : 'tócalo'}
            </span>
          </button>
        ))}
        <button
          type="button"
          className={`reunion3d-entrar${todoBien ? ' es-listo' : listoParaEntrar ? ' es-aviso' : ''}`}
          onClick={entrar}
          disabled={!listoParaEntrar}
        >
          {todoBien ? 'Entrar a la reunión' : listoParaEntrar ? 'Entrar de todos modos' : 'Entrar a la reunión'}
        </button>
      </div>
    </div>
  );

  const rejilla = (
    <div className="reunion3d-rejilla">
      {PARTICIPANTES.map((p) => {
        const soyYo = p.nombre === YO;
        const habla = hablando === p.nombre;
        const rojo = encimados && (soyYo || habla);
        const caido = diegoCaido && p.id === 'diego';
        const mudo = soyYo ? !micro : p.id === 'bit' ? false : !habla;
        const mano = manos.includes(p.nombre);
        return (
          <div
            key={p.id}
            className={`reunion3d-tile${habla ? ' es-habla' : ''}${rojo ? ' es-rojo' : ''}${
              caido ? ' es-caido' : ''
            }${fase === 'ruidosa' && !soyYo ? ' es-mirando' : ''}`}
          >
            {soyYo && camara ? (
              <VistaPrevia
                camara={camara}
                lampara={lampara}
                biomboCerrado={biomboCerrado}
                clase="reunion3d-tile-video"
              />
            ) : (
              <span className="reunion3d-tile-ficha" style={{ background: p.color }}>
                {caido ? '…' : p.ficha}
              </span>
            )}
            <span className="reunion3d-tile-nombre">{p.nombre}</span>
            {mudo && (
              <span className="reunion3d-tile-mudo" title="Micrófono apagado">
                🎤
              </span>
            )}
            {mano && (
              <span className="reunion3d-tile-mano" title="Tiene la mano levantada">
                ✋
              </span>
            )}
            {fase === 'ruidosa' && !soyYo && (
              <span className="reunion3d-tile-mira" aria-hidden="true">
                👀
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  const panel = (
    <div className="reunion3d-panel">
      <p className="reunion3d-panel-tit">Participantes</p>
      <ul className="reunion3d-lista">
        {PARTICIPANTES.map((p) => (
          <li key={p.id} className="reunion3d-lista-fila">
            <span className="reunion3d-lista-punto" style={{ background: p.color }} />
            <span className="reunion3d-lista-nombre">{p.nombre}</span>
            <span className="reunion3d-lista-mic">
              {p.nombre === YO ? (micro ? '🎤' : '🔇') : hablando === p.nombre ? '🎤' : '🔇'}
            </span>
          </li>
        ))}
      </ul>

      <p className="reunion3d-panel-tit">Manos levantadas</p>
      <ol className="reunion3d-manos">
        {manos.length === 0 && <li className="reunion3d-manos-vacio">Nadie por ahora</li>}
        {manos.map((n, i) => (
          <li key={n} className={`reunion3d-manos-fila${n === YO ? ' es-yo' : ''}`}>
            <span className="reunion3d-manos-num">{i + 1}</span>
            {n}
          </li>
        ))}
      </ol>

      <p className="reunion3d-panel-tit">Chat · sólo lectura</p>
      <div className="reunion3d-chat">
        {chat.length === 0 && <p className="reunion3d-chat-vacio">Todavía nadie escribe</p>}
        {chat.map((r) => (
          <p key={r.id} className={`reunion3d-chat-msg${r.de === YO ? ' es-yo' : ''}`}>
            <b>{r.de}</b>
            {r.texto}
          </p>
        ))}
      </div>
    </div>
  );

  const barraControles = (
    <div className="reunion3d-controles">
      {CONTROLES.map((c) => {
        const on = estadoControl(c.id);
        return (
          <button
            key={c.id}
            type="button"
            className={`reunion3d-ctrl${on ? ' es-on' : ''}${c.id === 'salir' ? ' es-salir' : ''}${
              controlMal === c.id ? ' es-mal' : ''
            }`}
            onClick={() => pulsarControl(c.id)}
            title={c.tip}
          >
            <span className="reunion3d-ctrl-icono" aria-hidden="true">
              {c.icono}
            </span>
            <span className="reunion3d-ctrl-txt">
              {c.id === 'micro' ? (micro ? 'Silenciar' : 'Silenciado') : c.nombre}
            </span>
            <span className="reunion3d-ctrl-tip">{c.tip}</span>
          </button>
        );
      })}
    </div>
  );

  /* Los subtítulos son una franja del programa, no un cartel encima de los
     recuadros: flotando tapaban el nombre del que habla y se metían en el
     panel de participantes. Se pinta siempre, hable alguien o no, para que la
     reunión no pegue un brinco de 30 px cada vez que alguien abre la boca. */
  const hablaAhora = Boolean(momentoActual) && fase === 'reunion' && !dialogo;
  const subtitulos = (
    <p className={`reunion3d-subtitulo${hablaAhora ? ' es-activo' : ''}`}>
      <span className="reunion3d-cc" aria-hidden="true">
        CC
      </span>
      {hablaAhora && momentoActual ? (
        <>
          <b>{momentoActual.hablando}</b>
          <span className="reunion3d-subtitulo-txt">{momentoActual.dice}</span>
        </>
      ) : (
        <span className="reunion3d-subtitulo-txt es-espera">Subtítulos en vivo</span>
      )}
    </p>
  );

  const ventanaGrabacion =
    dialogo === 'grabacion' ? (
      <div className="reunion3d-dialogo">
        <p className="reunion3d-dialogo-tit">Diego quiere grabar esta reunión</p>
        <p className="reunion3d-dialogo-txt">¿Permites que se grabe tu cámara y tu voz?</p>
        <div className="reunion3d-dialogo-pie">
          <button type="button" className="reunion3d-dbtn" onClick={() => responderGrabacion(true)}>
            Permitir
          </button>
          <button
            type="button"
            className="reunion3d-dbtn es-fuerte"
            onClick={() => responderGrabacion(false)}
          >
            No permitir
          </button>
        </div>
      </div>
    ) : null;

  const ventanaEnlace =
    dialogo === 'enlace' ? (
      <div className="reunion3d-dialogo">
        <p className="reunion3d-dialogo-tit">Diego te escribió por el chat</p>
        <p className="reunion3d-dialogo-txt">
          «Sofi, pásame el enlace y meto a mi primo, quiere ver la maqueta.»
        </p>
        <div className="reunion3d-dialogo-pie">
          <button type="button" className="reunion3d-dbtn" onClick={() => responderEnlace(true)}>
            Pasar el enlace
          </button>
          <button type="button" className="reunion3d-dbtn es-fuerte" onClick={() => responderEnlace(false)}>
            No pasarlo
          </button>
        </div>
      </div>
    ) : null;

  const ventanaSolicitud =
    dialogo === 'solicitud' && solicitudActual ? (
      <div className="reunion3d-dialogo es-alta">
        <p className="reunion3d-dialogo-tit">Alguien quiere entrar a la reunión</p>
        <div className="reunion3d-tarjeta">
          <span
            className={`reunion3d-tarjeta-foto${solicitudActual.ficha ? '' : ' es-vacia'}`}
            style={{ background: solicitudActual.ficha ? solicitudActual.color : undefined }}
          >
            {solicitudActual.ficha ?? '?'}
          </span>
          <span className="reunion3d-tarjeta-txt">
            <b>{solicitudActual.nombre}</b>
            {solicitudActual.detalle}
          </span>
        </div>

        {pasoSolicitud === 'decidir' && (
          <div className="reunion3d-dialogo-pie">
            <button type="button" className="reunion3d-dbtn" onClick={() => decidirPuerta(true)}>
              Admitir
            </button>
            <button type="button" className="reunion3d-dbtn es-fuerte" onClick={() => decidirPuerta(false)}>
              No admitir
            </button>
          </div>
        )}

        {pasoSolicitud === 'motivo' && (
          <div className="reunion3d-motivos">
            <p className="reunion3d-motivos-tit">¿Por qué?</p>
            {MOTIVOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`reunion3d-motivo${motivoMal === m.id ? ' es-mal' : ''}`}
                onClick={() => elegirMotivo(m.id)}
              >
                {m.texto}
              </button>
            ))}
          </div>
        )}

        {pasoSolicitud === 'avisar' && (
          <div className="reunion3d-dialogo-pie">
            <button type="button" className="reunion3d-dbtn es-fuerte" onClick={avisarMaestra}>
              Avisar a la maestra
            </button>
          </div>
        )}
      </div>
    ) : null;

  const ventanaInsiste =
    dialogo === 'insiste' ? (
      <div className="reunion3d-dialogo es-alarma">
        <p className="reunion3d-dialogo-tit">Invitado está tocando otra vez</p>
        <p className="reunion3d-dialogo-txt">«ábreme, no seas así»</p>
        <div className="reunion3d-dialogo-pie">
          <button type="button" className="reunion3d-dbtn" onClick={responderleAlInsistente}>
            Responderle
          </button>
        </div>
        <p className="reunion3d-dialogo-nota">Con esto no se discute. Mira la barra de abajo.</p>
      </div>
    ) : null;

  const ventanaAvisar =
    dialogo === 'avisar' ? (
      <div className="reunion3d-dialogo">
        <p className="reunion3d-dialogo-tit">Saliste de la reunión</p>
        <p className="reunion3d-dialogo-txt">Falta lo que hace que esto sirva de algo.</p>
        <div className="reunion3d-dialogo-pie">
          <button type="button" className="reunion3d-dbtn es-fuerte" onClick={avisarMaestra}>
            Avisar a un adulto
          </button>
        </div>
      </div>
    ) : null;

  const pantalla =
    fase === 'apagado' ? (
      <div className="reunion3d-espera">
        <span className="reunion3d-espera-marca">Tecnia Reunión</span>
        <button type="button" className="reunion3d-encender" onClick={encender}>
          <span aria-hidden="true">⏻</span> Encender
        </button>
      </div>
    ) : (
      <div className="reunion3d-marco">
        {barra}
        {fase === 'antesala' ? (
          antesala
        ) : (
          <div className="reunion3d-reunion">
            <div className="reunion3d-medio">
              {rejilla}
              {panel}
            </div>
            {subtitulos}
            {barraControles}
          </div>
        )}

        {avisoPrograma && (
          <div className="reunion3d-aviso">
            <span aria-hidden="true">⚠</span>
            {avisoPrograma}
          </div>
        )}
        {pista && fase !== 'antesala' && <p className="reunion3d-pista">{pista}</p>}
        {ventanaGrabacion}
        {ventanaEnlace}
        {ventanaSolicitud}
        {ventanaInsiste}
        {ventanaAvisar}
      </div>
    );

  /* ── las dos placas de latón atornilladas a la mesa ────────────────────── */

  const mandoLampara = (
    <button type="button" className="reunion3d-mando" onClick={girarLampara}>
      <span className="reunion3d-mando-eti">
        <b>Lámpara</b>
        {ETIQUETA_LAMPARA[lampara]}
      </span>
      <span className={`reunion3d-mando-luz${lampara === 'frente' ? ' es-ok' : ''}`}>
        {lampara === 'apagada' ? '○' : '●'}
      </span>
    </button>
  );

  const mandoBiombo = (
    <button type="button" className="reunion3d-mando" onClick={moverBiombo}>
      <span className="reunion3d-mando-eti">
        <b>Biombo</b>
        {biomboCerrado ? 'Cerrado' : 'Abierto'}
      </span>
      <span className={`reunion3d-mando-luz${biomboCerrado ? ' es-ok' : ''}`}>
        {biomboCerrado ? '▮' : '▯'}
      </span>
    </button>
  );

  const escena = (
    <SalaLlamada3D
      reduceMotion={reduceMotion}
      encendido={fase !== 'apagado'}
      camaraOn={camara && fase !== 'apagado'}
      manoArriba={mano3d}
      posicionLampara={lampara}
      biomboCerrado={biomboCerrado}
      pantalla={pantalla}
      mandoLampara={mandoLampara}
      mandoBiombo={mandoBiombo}
      alTocarLampara={girarLampara}
      alTocarBiombo={moverBiombo}
      alTocarMano={tocarMano3D}
    />
  );

  /* jsdom no tiene WebGL: el respaldo lleva los mismos controles con las mismas
     etiquetas accesibles, para que la actividad se pueda jugar y probar entera
     sin tarjeta gráfica. */
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      {fase === 'apagado' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={encender}>
            Encender el monitor
          </button>
        </div>
      )}

      {fase !== 'apagado' && (
        <>
          <p className="escena3d-respaldo-titulo">La cabina</p>
          <div className="escena3d-respaldo-fila">
            {(Object.keys(ETIQUETA_LAMPARA) as PosicionLampara[]).map((p) => (
              <button
                key={p}
                type="button"
                className="pieza3d-boton"
                onClick={() => ponerLampara(p)}
              >
                Lámpara: {ETIQUETA_LAMPARA[p]}
              </button>
            ))}
            <button type="button" className="pieza3d-boton" onClick={moverBiombo}>
              Biombo: {biomboCerrado ? 'Cerrado' : 'Abierto'}
            </button>
            <button type="button" className="pieza3d-boton" onClick={tocarMano3D}>
              Tu mano de verdad
            </button>
          </div>
        </>
      )}

      {fase === 'antesala' && (
        <>
          <p className="escena3d-respaldo-titulo">Antesala</p>
          <div className="escena3d-respaldo-fila">
            <button type="button" className="pieza3d-boton" onClick={alternarMicro}>
              Micrófono: {micro ? 'Abierto' : 'Silenciado'}
            </button>
            <button type="button" className="pieza3d-boton" onClick={alternarCamara}>
              Cámara: {camara ? 'Encendida' : 'Apagada'}
            </button>
            <button type="button" className="pieza3d-boton" onClick={entrar} disabled={!listoParaEntrar}>
              Entrar a la reunión
            </button>
          </div>
        </>
      )}

      {enReunion && (
        <>
          <p className="escena3d-respaldo-titulo">
            {fase === 'ruidosa'
              ? 'Entraste con el micrófono abierto'
              : (momentoActual?.dice ?? 'Cuidando la puerta')}
          </p>
          <div className="escena3d-respaldo-fila">
            {CONTROLES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="pieza3d-boton"
                onClick={() => pulsarControl(c.id)}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </>
      )}

      {dialogo === 'grabacion' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={() => responderGrabacion(true)}>
            Permitir
          </button>
          <button type="button" className="pieza3d-boton" onClick={() => responderGrabacion(false)}>
            No permitir
          </button>
        </div>
      )}

      {dialogo === 'enlace' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={() => responderEnlace(true)}>
            Pasar el enlace
          </button>
          <button type="button" className="pieza3d-boton" onClick={() => responderEnlace(false)}>
            No pasarlo
          </button>
        </div>
      )}

      {dialogo === 'solicitud' && solicitudActual && (
        <>
          <p className="escena3d-respaldo-titulo">
            {solicitudActual.nombre} · {solicitudActual.detalle}
          </p>
          {pasoSolicitud === 'decidir' && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={() => decidirPuerta(true)}>
                Admitir
              </button>
              <button type="button" className="pieza3d-boton" onClick={() => decidirPuerta(false)}>
                No admitir
              </button>
            </div>
          )}
          {pasoSolicitud === 'motivo' && (
            <div className="escena3d-respaldo-fila">
              {MOTIVOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirMotivo(m.id)}
                >
                  {m.texto}
                </button>
              ))}
            </div>
          )}
          {pasoSolicitud === 'avisar' && (
            <div className="escena3d-respaldo-fila">
              <button type="button" className="pieza3d-boton" onClick={avisarMaestra}>
                Avisar a la maestra
              </button>
            </div>
          )}
        </>
      )}

      {dialogo === 'insiste' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={responderleAlInsistente}>
            Responderle
          </button>
        </div>
      )}

      {dialogo === 'avisar' && (
        <div className="escena3d-respaldo-fila">
          <button type="button" className="pieza3d-boton" onClick={avisarMaestra}>
            Avisar a un adulto
          </button>
        </div>
      )}
    </div>
  );

  const marcador =
    fase === 'antesala' || fase === 'apagado'
      ? {
          etiqueta: 'Listo',
          valor: `${Object.values(checkOk).filter(Boolean).length}/4`,
        }
      : /* Al terminar, la fase ya no es 'puerta' pero el contador de momentos se
            quedó en 4 (el índice del último), así que el marcador decía «4/5»
            justo encima del panel que presume «Momentos 5». Medido en la
            captura 32 de la sonda. En el cierre manda lo último que hiciste: la
            puerta, y esa sí está entera. */
        fase === 'puerta' || fase === 'fin'
        ? { etiqueta: 'Puerta', valor: `${resueltas}/${SOLICITUDES.length}` }
        : { etiqueta: 'Momentos', valor: `${momento}/${MOMENTOS.length}` };

  return (
    <ArcadeSala3D
      titulo="Videollamadas con respeto"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      /* La cabina trae su mesa entera: el mostrador genérico del rig se colaría
         por delante del faldón que esconde el pie del monitor. */
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La cabina de videollamada · Tecnia Reunión · la lámpara y el biombo son tuyos
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Anfitrión respetuoso',
              insigniaEmoji: '🎥',
              titulo: '¡Sabes estar en una videollamada!',
              detalle:
                'Te arreglaste la luz y el fondo antes de que te vieran, entraste silenciada, pediste turno con el botón de la mano, dijiste que no a una grabación y no pasaste el enlace. Y cuando alguien sin nombre insistió en la puerta, no discutiste: saliste y avisaste.',
              resumen: [
                { etiqueta: 'Momentos', valor: `${MOMENTOS.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabVideollamadasConRespeto;
