'use client';

import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, ControlHtml, PedestalBoton3D, type EstadoPieza } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { TecladoMapa, type FamiliaTecla, type EstadoTecla } from './TecladoMapa';

/**
 * «Explora tu teclado» (N2·U2, parada 1) — El mapa del teclado, ahora en WebGL 3D real.
 *
 * El mapa del teclado se monta como un tablero físico del gabinete: un bastidor
 * 3D con el diagrama (billboard `<Html>` con `<button>` reales por tecla). R1
 * «¿A qué familia pertenece?»: el mapa es solo referencia (apagado, con la tecla
 * objetivo latiendo) y el alumno presiona uno de los cuatro pedestales de familia
 * integrados al mostrador. R2 «Encuentra la tecla»: el mapa se activa y el alumno
 * la toca directamente sobre el diagrama. Líneas de Bit verbatim del documento.
 */

const LINEAS = {
  inicio: '¡Bienvenido al mapa de mi teclado! ¿A qué familia pertenece esta tecla?',
  acertada: '¡Correcto! Esa tecla vive justo ahí.',
  fallada: 'Mmm, esa tecla vive en otra zona. Piénsalo de nuevo.',
  ronda2: 'Ahora usa el mapa: encuentra la tecla que te pido.',
  encontrada: '¡Esa es! La encontraste en el mapa.',
  completar: '¡Mapa completado! Ya conoces las zonas de tu teclado.',
} as const;

interface RetoFamilia {
  id: string;
  nombre: string;
  familia: FamiliaTecla;
}

/** R1: seis teclas nombradas, en el orden en que Bit las pide. */
const R1_RETOS: RetoFamilia[] = [
  { id: 'm', nombre: 'la letra M', familia: 'letras' },
  { id: 'n7', nombre: 'el número 7', familia: 'numeros' },
  { id: 'flecha-arriba', nombre: 'la flecha arriba', familia: 'flechas' },
  { id: 'enter', nombre: 'la tecla Enter', familia: 'especiales' },
  { id: 's', nombre: 'la letra S', familia: 'letras' },
  { id: 'n3', nombre: 'el número 3', familia: 'numeros' },
];

interface RetoMapa {
  id: string;
  nombre: string;
}

/** R2: cuatro retos de señalar-en-el-diagrama. */
const R2_RETOS: RetoMapa[] = [
  { id: 'enter', nombre: 'Enter' },
  { id: 'n5', nombre: 'el número 5' },
  { id: 'flecha-derecha', nombre: 'la flecha derecha' },
  { id: 'espacio', nombre: 'Espacio' },
];

const FAMILIAS_BOTON: { familia: FamiliaTecla; nombre: string; emoji: string }[] = [
  { familia: 'letras', nombre: 'Letras', emoji: '🔤' },
  { familia: 'numeros', nombre: 'Números', emoji: '🔢' },
  { familia: 'flechas', nombre: 'Flechas', emoji: '🧭' },
  { familia: 'especiales', nombre: 'Especiales', emoji: '⚙️' },
];

/** Posiciones X de los cuatro pedestales de familia, repartidos en el frente. */
const FAMILIA_X = [-2.3, -0.77, 0.77, 2.3];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * El mapa del teclado montado como tablero físico del gabinete: un bastidor 3D
 * (RoundedBox) ancla el diagrama al mostrador, y encima un `<Html>` billboard con
 * el `TecladoMapa` (botones reales por tecla). Componente de módulo para que el
 * handler `onTecla` cruce el límite de componente (react-hooks/refs).
 */
function TableroTeclado3D({
  objetivo,
  estados,
  deshabilitada,
  onTecla,
}: {
  objetivo: string | null;
  estados: Record<string, EstadoTecla>;
  deshabilitada: boolean;
  onTecla?: (id: string) => void;
}) {
  return (
    <group position={[0, MOSTRADOR_Y + 1.5, -0.1]}>
      <RoundedBox args={[3.5, 2.1, 0.1]} radius={0.08} smoothness={3} position={[0, 0, -0.06]} receiveShadow>
        <meshStandardMaterial color="#0B2A3A" roughness={0.55} metalness={0.15} emissive="#0A1E2C" emissiveIntensity={0.2} />
      </RoundedBox>
      <ControlHtml position={[0, 0, 0.02]}>
        <TecladoMapa
          objetivo={objetivo}
          estados={estados}
          mostrarLeyenda
          deshabilitada={deshabilitada}
          onTecla={onTecla}
        />
      </ControlHtml>
    </group>
  );
}

export function LabExploraTuTeclado(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoTecla>>({});
  const [mal, setMal] = useState<FamiliaTecla | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx });

  // Sync de refs FUERA del render (react-hooks/refs): nunca escribir refs en el
  // cuerpo del componente ni leer `.current` en JSX.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    hablar(LINEAS.fallada);
    propsRef.current.onScore(puntaje());
  };

  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · Encuentra la tecla');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const marcarTecla = (id: string, estado: EstadoTecla, duracion: number) => {
    setEstados((e) => ({ ...e, [id]: estado }));
    timers.despues(() => {
      setEstados((e) => {
        if (e[id] !== estado) return e;
        const siguiente = { ...e };
        delete siguiente[id];
        return siguiente;
      });
    }, duracion);
  };

  const responderFamilia = (familia: FamiliaTecla) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const reto = R1_RETOS[v.idx];
    if (familia === reto.familia) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      marcarTecla(reto.id, 'correcta', 650);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R1_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          cambiarRonda();
        }
      }, 650);
    } else {
      errar();
      setMal(familia);
      timers.despues(() => setMal((m) => (m === familia ? null : m)), 460);
    }
  };

  const alTocarTecla = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = R2_RETOS[v.idx];
    if (id === reto.id) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.encontrada, { una: true });
      marcarTecla(id, 'correcta', 650);
      const esUltimo = v.idx + 1 >= R2_RETOS.length;
      if (esUltimo) propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (esUltimo) {
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        } else {
          s.ocupado = false;
          setIdx(v.idx + 1);
        }
      }, 650);
    } else {
      errar();
      marcarTecla(id, 'incorrecta', 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setEstados({});
    setMal(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const enR1 = ronda === 0;
  const retoR1 = R1_RETOS[idx];
  const retoR2 = R2_RETOS[idx];

  const marcador = enR1
    ? { etiqueta: 'Teclas', valor: `${idx + 1}/${R1_RETOS.length}` }
    : { etiqueta: 'Mapa', valor: `${terminado ? R2_RETOS.length : idx + 1}/${R2_RETOS.length}` };

  const consigna = enR1
    ? { titulo: '¿A qué familia pertenece?', texto: `Bit señala ${retoR1.nombre}. Elige su familia en la botonera.` }
    : { titulo: 'Encuentra la tecla', texto: `Toca ${retoR2.nombre} directamente en el mapa.` };

  const bloqueado = terminado || !!aviso;

  // ── Escena 3D ──
  const escena = enR1 ? (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.55, -0.35]} />
      <TableroTeclado3D objetivo={retoR1.id} estados={estados} deshabilitada />
      {FAMILIAS_BOTON.map((f, i) => {
        const estado: EstadoPieza = mal === f.familia ? 'mal' : 'normal';
        return (
          <PedestalBoton3D
            key={f.familia}
            position={[FAMILIA_X[i], MOSTRADOR_Y, 1.1]}
            estado={estado}
            emoji={f.emoji}
            etiqueta={f.nombre}
            ariaLabel={`Familia: ${f.nombre.toLowerCase()}`}
            onClick={() => responderFamilia(f.familia)}
            disabled={bloqueado}
            reduceMotion={reduceMotion}
            ancho={1.35}
          />
        );
      })}
    </>
  ) : (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.55, -0.35]} />
      <TableroTeclado3D objetivo={null} estados={estados} deshabilitada={false} onTecla={alTocarTecla} />
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo = enR1 ? (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <TecladoMapa objetivo={retoR1.id} estados={estados} mostrarLeyenda deshabilitada />
      <div className="safari-opciones" role="group" aria-label="Elige la familia">
        {FAMILIAS_BOTON.map((f) => (
          <button
            key={f.familia}
            type="button"
            className={`safari-opcion${mal === f.familia ? ' mal' : ''}`}
            onClick={() => responderFamilia(f.familia)}
            aria-label={`Familia: ${f.nombre.toLowerCase()}`}
          >
            {f.nombre}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      <TecladoMapa objetivo={null} estados={estados} mostrarLeyenda deshabilitada={false} onTecla={alTocarTecla} />
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Explora tu teclado"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Cartógrafo del teclado',
              insigniaEmoji: '🗺️',
              titulo: '¡Mapa completado!',
              detalle: 'Reconociste las cuatro zonas del teclado y encontraste cada tecla en el mapa del taller.',
              resumen: [
                { etiqueta: 'Teclas', valor: `${R1_RETOS.length + R2_RETOS.length}` },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
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

export default LabExploraTuTeclado;
