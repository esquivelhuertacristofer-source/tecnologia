'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import { detectarWebGL } from '../../arcade3d/EscenaArcade3D';
import '../../n6/web/paginasWeb.css';

/**
 * N8·U «Producción multimedia y videojuegos», parada 3 · «Diseña tu videojuego»
 * **N8 = 2.º de Secundaria = 13–14 años**.
 * Escena 3D real con Three.js (WebGL), no una imagen: el salto que se ve en
 * pantalla lo calcula la gravedad y el impulso que el alumno acaba de mover.
 *
 * Los textos de portada y de la entrada se reescribieron el 2-sep-2026 porque
 * prometían piezas que este archivo no tiene —jerarquía de nodos, sistemas de
 * partículas, portales—. Lo que hay son los cinco pasos de `TOTAL_PASOS`, y ni
 * uno más.
 */

const TOTAL_PASOS = 5;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 4 · Diseña tu videojuego',
  tema: 'Un nivel 3D: la gravedad, el salto, y las piezas que decides tú',
  objetivo:
    'Vas a construir un nivel 3D que se juega de verdad. Primero ajustas los dos números que mandan sobre el salto, luego añades las piezas que faltan, y al final lo juegas tú con el teclado para comprobar si lo que decidiste funciona.',
  vasAHacer: [
    'Subir la gravedad a 14 o más y el impulso del salto a 16 o más.',
    'Añadir la plataforma alta, la que hay que alcanzar de un salto.',
    'Añadir el cristal, que es lo que hay que recoger.',
    'Encender la luz de neón para que el cristal se vea.',
    'Jugar tu propio nivel con el teclado hasta recoger el cristal.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Arquitecto de Juegos 3D WebGL', emoji: '🕹️' },
  boton: 'Abrir el editor del nivel',
  acento: '#a855f7',
};

const LINEAS = {
  inicio:
    'Este nivel aún no se puede superar: con la gravedad y el salto de fábrica no se llega arriba, y no hay nada que recoger. Eso es lo que vas a arreglar tú.',
  fin: 'Lo montaste y lo superaste tú. Ese salto que ahora sí llega es exactamente el par de números que elegiste al principio.',
};

// Web Audio API Synth FX
function reproducirEfectoJuego(tipo: 'salto' | 'gema' | 'victoria') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    /*
     * CIERRA EL CONTEXTO AL ACABAR EL SONIDO (1-sep-2026, auditoría).
     * Esta función abre un `AudioContext` NUEVO en cada llamada, y se llama en
     * cada gesto del alumno. Los navegadores limitan cuántos pueden vivir a la
     * vez —WebKit ronda los seis—, así que en una clase de verdad el audio se
     * apagaba a los pocos minutos, o el navegador lanzaba una excepción. El
     * resto de la plataforma usa el hook compartido `lib/useSfx.ts`, que guarda
     * un solo contexto en un `ref` y lo cierra al desmontar; estos cinco
     * laboratorios se escribieron aparte y se quedaron sin esa red. Migrar a
     * `useSfx` es lo correcto de fondo, pero toca más superficie: aquí se cierra
     * en cuanto el oscilador termina, que resuelve la fuga sin mover nada más.
     */
    osc.onended = () => { void ctx.close().catch(() => {}); };
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'salto') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (tipo === 'gema') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (tipo === 'victoria') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio no disponible
  }
}

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabDisenaTuVideojuego(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  // Engine Parameters
  const [gravedad, setGravedad] = useState(10);
  const [fuerzaSalto, setFuerzaSalto] = useState(12);
  const [plataformaAlta, setPlataformaAlta] = useState(false);
  const [cristalPresente, setCristalPresente] = useState(false);
  const [luzNeon, setLuzNeon] = useState(false);
  const [modoJuego, setModoJuego] = useState(false);

  // Runtime State
  const [puntos, setPuntos] = useState(0);
  const [cristalRecogido, setCristalRecogido] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Igual que ArcadeSala3D/Ordenador3D: primero respaldo (coincide con SSR),
  // luego 3D — y bajo Jest/jsdom, que no implementa WebGL, se queda en el
  // respaldo en vez de reventar al construir el WebGLRenderer.
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    setWebgl(detectarWebGL());
  }, []);

  // Estado físico del jugador, fuera de cualquier efecto — sobrevive re-renders
  // sin que un cambio de estado lo reinicie de vuelta al punto de partida.
  const fisicaRef = useRef({ px: -6, py: 0.5, vx: 0, vy: 0, enSuelo: true });

  // Espejo de lo último conocido, leído dentro del bucle de render persistente
  // (mismo patrón `propsRef` que usa useLabActividad): así el slider de
  // gravedad o cualquier otro control puede cambiar sin reconstruir la
  // escena de Three.js — sólo la escena inicial se crea una vez.
  const liveRef = useRef({
    gravedad,
    fuerzaSalto,
    plataformaAlta,
    cristalPresente,
    luzNeon,
    modoJuego,
    cristalRecogido,
    pasos,
    avanzar,
    terminar,
    hablar,
  });
  useEffect(() => {
    liveRef.current = {
      gravedad,
      fuerzaSalto,
      plataformaAlta,
      cristalPresente,
      luzNeon,
      modoJuego,
      cristalRecogido,
      pasos,
      avanzar,
      terminar,
      hablar,
    };
  });

  // Helper for progress verification
  const comprobarProgreso = useCallback(
    (g: number, f: number, plat: boolean, cris: boolean, luz: boolean) => {
      if (pasos === 0 && g >= 14 && f >= 16) {
        avanzar();
        reproducirTono('correct');
        setAviso('⚡ Encargo 1: ¡Físicas 3D calibradas!');
        hablar('Excelente. Has ajustado la gravedad 3D y el impulso de salto del robot.');
      } else if (pasos === 1 && plat) {
        avanzar();
        reproducirTono('correct');
        setAviso('🏗️ Encargo 2: ¡Plataforma 3D creada!');
        hablar('Genial. Has posicionado la plataforma flotante en el espacio 3D.');
      } else if (pasos === 2 && cris) {
        avanzar();
        reproducirTono('correct');
        setAviso('💎 Encargo 3: ¡Cristal Octaédrico 3D colocado!');
        hablar('Perfecto. El cristal de energía 3D está girando en la escena.');
      } else if (pasos === 3 && luz) {
        avanzar();
        reproducirTono('correct');
        setAviso('💡 Encargo 4: ¡Iluminación Neón Activada!');
        hablar('¡Impresionante! Las luces puntuales neón añaden sombreado realista.');
      }
    },
    [pasos, avanzar, hablar],
  );

  const cambiarGravedad = (v: number) => {
    setGravedad(v);
    comprobarProgreso(v, fuerzaSalto, plataformaAlta, cristalPresente, luzNeon);
  };

  const cambiarFuerzaSalto = (v: number) => {
    setFuerzaSalto(v);
    comprobarProgreso(gravedad, v, plataformaAlta, cristalPresente, luzNeon);
  };

  const alternarPlataforma = () => {
    const n = !plataformaAlta;
    setPlataformaAlta(n);
    comprobarProgreso(gravedad, fuerzaSalto, n, cristalPresente, luzNeon);
  };

  const alternarCristal = () => {
    const n = !cristalPresente;
    setCristalPresente(n);
    comprobarProgreso(gravedad, fuerzaSalto, plataformaAlta, n, luzNeon);
  };

  const alternarLuz = () => {
    const n = !luzNeon;
    setLuzNeon(n);
    comprobarProgreso(gravedad, fuerzaSalto, plataformaAlta, cristalPresente, n);
  };

  // Three.js 3D WebGL Engine Viewport Effect
  useEffect(() => {
    if (!webgl) return;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = 340;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.035);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 11);
    camera.lookAt(0, 1, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Grid Floor (Holographic Cyber Grid)
    const gridHelper = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Dynamic Point Light (Neon Glow)
    const pointLight = new THREE.PointLight(0xa855f7, liveRef.current.luzNeon ? 3 : 0.5, 15);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    // 6. Base Floor Mesh
    const floorGeo = new THREE.BoxGeometry(18, 0.6, 6);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.3, 0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 7. Elevated Platform Mesh
    const platGeo = new THREE.BoxGeometry(4.5, 0.4, 4);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      emissive: 0x6366f1,
      emissiveIntensity: 0.5,
      roughness: 0.1,
    });
    const platMesh = new THREE.Mesh(platGeo, platMat);
    platMesh.position.set(0, 2.2, 0);
    platMesh.castShadow = true;
    platMesh.receiveShadow = true;
    platMesh.visible = liveRef.current.plataformaAlta;
    scene.add(platMesh);

    // 8. 3D Energy Crystal Mesh (Octahedron)
    const gemGeo = new THREE.OctahedronGeometry(0.55);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.set(0, 3.2, 0);
    gemMesh.visible = liveRef.current.cristalPresente && !liveRef.current.cristalRecogido;
    scene.add(gemMesh);

    // 9. 3D Goal Portal Mesh (Torus)
    const portalGeo = new THREE.TorusGeometry(1.0, 0.12, 16, 32);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.0,
    });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(6, 1.6, 0);
    scene.add(portalMesh);

    // 10. 3D Player Character Mesh Group (Robot/Hero)
    const playerGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.8, 1.0, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6, metalness: 0.8 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);

    // Robot Visor
    const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.3);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 1.0 });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.25, 0.35);
    playerGroup.add(visorMesh);

    playerGroup.position.set(-6, 0.5, 0);
    scene.add(playerGroup);

    // 11. 3D Space Starfield Particles
    const partCount = 120;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(partCount * 3);

    for (let i = 0; i < partCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 30;
      positions[i + 1] = Math.random() * 15;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ size: 0.08, color: 0xa855f7, transparent: true, opacity: 0.8 });
    const particleSystem = new THREE.Points(partGeo, partMat);
    scene.add(particleSystem);

    // Physics Engine State — vive en fisicaRef, no en variables locales del
    // efecto, para que un cambio de estado (que ya no reconstruye la
    // escena) tampoco reinicie la posición del jugador.
    let animId: number;
    const fis = fisicaRef.current;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (['ArrowUp', 'Space', 'KeyW'].includes(e.code) && fis.enSuelo) {
        fis.vy = liveRef.current.fuerzaSalto * 0.035;
        fis.enSuelo = false;
        reproducirEfectoJuego('salto');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 60 FPS Render & Physics Loop
    const renderLoop = () => {
      const live = liveRef.current;

      // Los controles del Inspector se leen aquí cada cuadro — cambiarlos
      // ya no dispara una reconstrucción de la escena.
      platMesh.visible = live.plataformaAlta;
      gemMesh.visible = live.cristalPresente && !live.cristalRecogido;
      pointLight.intensity = live.luzNeon ? 3 : 0.5;

      // Rotate 3D Elements
      if (gemMesh.visible) {
        gemMesh.rotation.y += 0.03;
        gemMesh.rotation.x += 0.01;
      }
      portalMesh.rotation.z += 0.04;
      particleSystem.rotation.y += 0.001;

      // Real 3D Physics logic in game mode
      if (live.modoJuego) {
        if (keys['ArrowLeft'] || keys['KeyA']) fis.vx = -0.15;
        else if (keys['ArrowRight'] || keys['KeyD']) fis.vx = 0.15;
        else fis.vx = 0;

        fis.vy -= live.gravedad * 0.0025;
        fis.px += fis.vx;
        fis.py += fis.vy;

        // X Bounds
        if (fis.px < -8) fis.px = -8;
        if (fis.px > 7.5) fis.px = 7.5;

        // Base Floor Collision
        const sueloY = 0.5;
        if (fis.py <= sueloY) {
          fis.py = sueloY;
          fis.vy = 0;
          fis.enSuelo = true;
        }

        // Elevated Platform Collision
        if (live.plataformaAlta && fis.px >= -2.2 && fis.px <= 2.2 && fis.py >= 2.4 && fis.py <= 2.7 && fis.vy <= 0) {
          fis.py = 2.7;
          fis.vy = 0;
          fis.enSuelo = true;
        }

        playerGroup.position.set(fis.px, fis.py, 0);

        // Crystal Collision Check
        if (live.cristalPresente && !live.cristalRecogido && Math.abs(fis.px - 0) < 1.2 && Math.abs(fis.py - 3.2) < 1.2) {
          setCristalRecogido(true);
          setPuntos((n) => n + 100);
          reproducirEfectoJuego('gema');
        }

        // Goal Portal Victory Check
        if (Math.abs(fis.px - 6) < 1.2 && Math.abs(fis.py - 1.6) < 1.5) {
          if (live.pasos === 4) {
            live.avanzar();
            reproducirEfectoJuego('victoria');
            const segundos = Math.round((Date.now() - sim.current.inicio) / 1000);
            live.terminar(segundos, () => live.hablar(LINEAS.fin));
          }
        }
      } else {
        fis.px = -6;
        fis.py = 0.5;
        fis.vx = 0;
        fis.vy = 0;
        fis.enSuelo = true;
        playerGroup.position.set(-6, 0.5, 0);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
    // Se crea una sola vez que `webgl` es cierto: los controles del
    // Inspector y el progreso se leen en vivo desde liveRef/fisicaRef dentro
    // del bucle, no de estas dependencias — así el WebGL nunca se reconstruye
    // a media partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl]);

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Diseña tu videojuego"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntuación"
      marcadorValor={`${puntos} PTS`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">CyberEngine 3D WebGL Studio N8 · Three.js 60 FPS Game Engine</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Arquitecto de Juegos 3D WebGL',
              insigniaEmoji: '🕹️',
              titulo: '¡Nivel 3D Diseñado y Superado!',
              detalle:
                'Has configurado parámetros de física 3D, mallas, iluminación neón y superado la prueba WebGL a 60 FPS.',
              resumen: [
                { etiqueta: 'Puntuación', valor: `${puntos} PTS` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase claseMarco="pgw-marco" marca="CyberEngine 3D Studio" subtitulo="Three.js WebGL Engine · 3D Mesh & Lights">
        <div
          className="act-ide-grid"
          style={{
            '--ide-col-izq': '200px',
            '--ide-col-der': '240px',
            gap: '12px',
            padding: '12px',
            background: '#060913',
            minHeight: '540px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          } as React.CSSProperties}
        >
          
          {/* Left Panel: 3D Scene Hierarchy */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>📐 Jerarquía 3D (Scene)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', color: '#38bdf8' }}>🤖 Mesh: CyberRobot (Group)</div>
              <div style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', color: '#f8fafc' }}>🧱 Mesh: Suelo Metal (Box)</div>
              <div style={{ padding: '6px', background: plataformaAlta ? '#312e81' : '#1e293b', borderRadius: '4px', color: plataformaAlta ? '#a855f7' : '#94a3b8' }}>
                {plataformaAlta ? '✅ Mesh: Plataforma 3D' : '➕ (Sin plataforma)'}
              </div>
              <div style={{ padding: '6px', background: cristalPresente ? '#422006' : '#1e293b', borderRadius: '4px', color: cristalPresente ? '#facc15' : '#94a3b8' }}>
                {cristalPresente ? '💎 Mesh: Octaedro 3D' : '➕ (Sin cristal)'}
              </div>
              <div style={{ padding: '6px', background: '#064e3b', borderRadius: '4px', color: '#34d399' }}>🌀 Mesh: Toro Portal 3D</div>
              <div style={{ padding: '6px', background: luzNeon ? '#4c1d95' : '#1e293b', borderRadius: '4px', color: luzNeon ? '#c084fc' : '#94a3b8' }}>
                {luzNeon ? '💡 Light: PointLight Neón' : '💡 Light: Luz Básica'}
              </div>
            </div>
          </div>

          {/* Center Viewport: Three.js 3D Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🌐 Viewport 3D WebGL (60 FPS)</span>
              <button
                onClick={() => setModoJuego(!modoJuego)}
                disabled={!webgl}
                style={{ background: modoJuego ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: webgl ? 'pointer' : 'not-allowed', opacity: webgl ? 1 : 0.5 }}
              >
                {modoJuego ? '⏹ Detener Pruebas' : '▶ Probar Juego 3D'}
              </button>
            </div>
            {webgl ? (
              <div ref={containerRef} style={{ width: '100%', height: '340px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #38bdf8', boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)' }} />
            ) : (
              <div
                style={{ width: '100%', height: '340px', borderRadius: '8px', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px', background: '#0f172a' }}
              >
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  🚫 Tu navegador no admite WebGL, así que este motor 3D no puede renderizarse aquí. Prueba con Chrome, Edge o Firefox actualizados en una computadora o tablet reciente.
                </p>
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
              Controles: Usa las flechas ◀ ▶ o Teclas A / D para mover el robot en 3D y ESPACIO para saltar.
            </p>
          </div>

          {/* Right Panel: 3D Physics & Shaders Inspector */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
            <h4 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>🎛️ Inspector 3D WebGL</h4>
            
            <div style={{ marginBottom: '14px' }}>
              {/* La meta se dice ANTES de acertar (1-sep-2026, auditoría). El encargo 1
                  exige gravedad >= 14 Y salto >= 16 a la vez, y ninguno de los dos
                  números aparecía en ninguna parte: el aviso llegaba DESPUÉS de dar
                  con ellos. Mover un solo control no producía ningún cambio visible,
                  así que el alumno tenía que adivinar dos umbrales a ciegas — lo
                  contrario de lo que hace el resto de la plataforma, donde cada
                  encargo dice qué se espera. */}
              <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>
                Gravedad 3D: <strong>{gravedad} m/s²</strong>
                {pasos === 0 && <span style={{ color: '#a855f7', fontWeight: 700 }}> · súbela a 14 o más</span>}
              </label>
              <input type="range" min={5} max={25} value={gravedad} onChange={(e) => cambiarGravedad(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>
                Impulso de Salto: <strong>{fuerzaSalto} N</strong>
                {pasos === 0 && <span style={{ color: '#a855f7', fontWeight: 700 }}> · y éste a 16 o más</span>}
              </label>
              <input type="range" min={8} max={24} value={fuerzaSalto} onChange={(e) => cambiarFuerzaSalto(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={alternarPlataforma}
                style={{ background: plataformaAlta ? '#312e81' : '#1e293b', color: '#f8fafc', border: '1px solid #a855f7', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {plataformaAlta ? '✅ Quitar Plataforma 3D' : '➕ Añadir Plataforma 3D'}
              </button>

              <button
                onClick={alternarCristal}
                style={{ background: cristalPresente ? '#78350f' : '#1e293b', color: '#f8fafc', border: '1px solid #facc15', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {cristalPresente ? '✅ Quitar Cristal 3D' : '💎 Añadir Cristal 3D'}
              </button>

              <button
                onClick={alternarLuz}
                style={{ background: luzNeon ? '#4c1d95' : '#1e293b', color: '#f8fafc', border: '1px solid #c084fc', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {luzNeon ? '💡 Luz Neón Activada' : '💡 Activar Luz Neón'}
              </button>
            </div>
          </div>
        </div>
      </VentanaBase>
      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${pasos}`} />}
    </ArcadeSala>
  );
}

export default LabDisenaTuVideojuego;
