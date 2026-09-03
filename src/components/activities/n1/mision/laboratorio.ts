/**
 * Misión: Aprende Computación — laboratorio 3D imperativo.
 *
 * Port fiel de la sección Three.js de app.js del prototipo de referencia
 * (r128) adaptado a three r185: outputColorSpace en lugar de sRGBEncoding
 * y decay = 0 en las PointLight para replicar la caída suave original.
 * Todos los valores (posiciones, medidas, colores, tiempos) son verbatim.
 */

import * as THREE from 'three';
import type { CategoriaObjeto, LabAPI, LabCallbacks } from './tipos';

/** Terna numérica [x, y, z] o [ancho, alto, fondo]. */
type Terna = readonly [number, number, number];

/** Campos que la referencia guarda en userData de cada objeto. */
interface DatosObjeto {
  key?: string;
  category?: CategoriaObjeto;
  label?: string;
  rootInteractive?: THREE.Object3D;
  originalEmissive?: THREE.Color | null;
  baseEmissive?: number;
  persistentHighlight?: boolean;
  floatBase?: number;
}

const datosDe = (objeto: THREE.Object3D): DatosObjeto => objeto.userData as DatosObjeto;

const esMesh = (objeto: THREE.Object3D): objeto is THREE.Mesh =>
  (objeto as THREE.Mesh).isMesh === true;

const materialEstandar = (mesh: THREE.Mesh): THREE.MeshStandardMaterial | null =>
  mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material : null;

/**
 * Construye la escena completa del laboratorio sobre el canvas dado.
 * Devuelve null si WebGL no está disponible (p. ej. jsdom en tests).
 */
export async function crearLaboratorio(
  canvas: HTMLCanvasElement,
  callbacks: LabCallbacks,
): Promise<LabAPI | null> {
  if (typeof window === 'undefined') return null;

  // El renderer se crea primero: si lanza (sin WebGL), devolvemos null.
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch {
    return null;
  }

  // Import dinámico tras crear el renderer con éxito: jest nunca parsea este ESM.
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Cámara inicial, igual que la referencia.
  const camaraInicial = {
    position: new THREE.Vector3(8.8, 6.4, 10.5),
    target: new THREE.Vector3(0, 1.2, 0),
  };

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x06101c);
  escena.fog = new THREE.Fog(0x06101c, 17, 38);

  const camara = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camara.position.copy(camaraInicial.position);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.copy(camaraInicial.target);
  controles.enableDamping = true;
  controles.dampingFactor = 0.06;
  controles.minDistance = 5;
  controles.maxDistance = 19;
  controles.maxPolarAngle = Math.PI * 0.48;
  controles.minPolarAngle = Math.PI * 0.16;

  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();

  const mapaObjetos = new Map<string, THREE.Object3D>();
  const interactivos: THREE.Object3D[] = [];
  const lineasConexion: THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>[] = [];
  let sobrevolado: THREE.Object3D | null = null;
  let dispuesto = false;
  let idRAF = 0;
  let temporizadorArranque = 0;
  let tokenCamara = 0;

  // ── Constructores base (mismos helpers que la referencia) ──────────────────

  function caja(
    nombre: string,
    tam: Terna,
    pos: Terna,
    color: number,
    opciones: THREE.MeshStandardMaterialParameters = {},
  ): THREE.Mesh {
    const geometria = new THREE.BoxGeometry(...tam);
    const material = new THREE.MeshStandardMaterial({ color, ...opciones });
    const mesh = new THREE.Mesh(geometria, material);
    mesh.name = nombre;
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function cilindro(
    nombre: string,
    radio: number,
    altura: number,
    pos: Terna,
    color: number,
    rot: Terna = [0, 0, 0],
    opciones: THREE.MeshStandardMaterialParameters = {},
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radio, radio, altura, 32),
      new THREE.MeshStandardMaterial({ color, ...opciones }),
    );
    mesh.name = nombre;
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function registrarInteractivo(objeto: THREE.Object3D, key: string, categoria: CategoriaObjeto): void {
    const d = datosDe(objeto);
    d.key = key;
    d.category = categoria;
    objeto.traverse((hijo) => {
      if (!esMesh(hijo)) return;
      const dh = datosDe(hijo);
      dh.rootInteractive = objeto;
      const material = materialEstandar(hijo);
      dh.originalEmissive = material ? material.emissive.clone() : null;
    });
    interactivos.push(objeto);
    mapaObjetos.set(key, objeto);
  }

  function crearBotonEncendido(
    padre: THREE.Object3D,
    key: string,
    pos: Terna,
    radio: number,
    color: number,
  ): void {
    const boton = cilindro(key, radio, 0.08, pos, color, [Math.PI / 2, 0, 0], {
      emissive: color,
      emissiveIntensity: 0.25,
    });
    const d = datosDe(boton);
    d.key = key;
    d.category = 'power';
    d.baseEmissive = 0.25;
    padre.add(boton);
    interactivos.push(boton);
    mapaObjetos.set(key, boton);
  }

  // ── Sala, luces y mobiliario ────────────────────────────────────────────────

  function construirLaboratorio(): void {
    const hemisferica = new THREE.HemisphereLight(0x9cddff, 0x07101c, 1.2);
    escena.add(hemisferica);
    const principal = new THREE.DirectionalLight(0xc6ecff, 2.6);
    principal.position.set(6, 10, 7);
    principal.castShadow = true;
    principal.shadow.mapSize.set(2048, 2048);
    principal.shadow.camera.left = -12;
    principal.shadow.camera.right = 12;
    principal.shadow.camera.top = 12;
    principal.shadow.camera.bottom = -12;
    escena.add(principal);
    // decay = 0: replica la caída suave de las luces legacy de r128.
    const luzAzul = new THREE.PointLight(0x2b9cff, 2.2, 18, 0);
    luzAzul.position.set(-6, 4, 1);
    escena.add(luzAzul);
    const luzCian = new THREE.PointLight(0x54f1dc, 1.5, 14, 0);
    luzCian.position.set(5, 3, -4);
    escena.add(luzCian);

    // Piso y sala
    const piso = caja('floor', [24, 0.35, 18], [0, -0.2, 0], 0x0b1a2a, { roughness: 0.9 });
    piso.receiveShadow = true;
    escena.add(piso);
    escena.add(caja('back-wall', [24, 8, 0.3], [0, 3.8, -8.7], 0x0a1928, { roughness: 0.95 }));
    escena.add(caja('left-wall', [0.3, 8, 18], [-11.8, 3.8, 0], 0x081521, { roughness: 0.95 }));

    agregarRejillaPiso();
    agregarDecoracionPared();
    agregarEstantes();

    // Mesa principal
    const cubierta = caja('table-top', [10.5, 0.35, 4.2], [0, 1.65, 0], 0x17334a, {
      roughness: 0.55,
      metalness: 0.25,
    });
    cubierta.castShadow = cubierta.receiveShadow = true;
    escena.add(cubierta);
    const posicionesPatas: readonly Terna[] = [
      [-4.6, 0.7, -1.55],
      [4.6, 0.7, -1.55],
      [-4.6, 0.7, 1.55],
      [4.6, 0.7, 1.55],
    ];
    posicionesPatas.forEach((p, i) => {
      const pata = caja(`leg-${i}`, [0.35, 1.6, 0.35], p, 0x122638, { metalness: 0.5, roughness: 0.45 });
      pata.castShadow = true;
      escena.add(pata);
    });
  }

  function agregarRejillaPiso(): void {
    const rejilla = new THREE.GridHelper(24, 24, 0x1e5b7f, 0x12324a);
    rejilla.position.y = 0.01;
    const materialRejilla = rejilla.material as THREE.Material;
    materialRejilla.opacity = 0.34;
    materialRejilla.transparent = true;
    escena.add(rejilla);
  }

  function agregarDecoracionPared(): void {
    const panel = caja('wall-panel', [7.2, 3.2, 0.18], [-4, 4.3, -8.45], 0x102b43, {
      emissive: 0x07111d,
      roughness: 0.6,
    });
    escena.add(panel);
    for (let i = 0; i < 5; i++) {
      const linea = caja(
        `wall-line-${i}`,
        [5.8 - i * 0.35, 0.06, 0.03],
        [-4.2 + i * 0.12, 5.2 - i * 0.42, -8.31],
        i % 2 ? 0x38a8ff : 0x54e6d5,
        { emissive: i % 2 ? 0x0b4f83 : 0x0c5d58 },
      );
      escena.add(linea);
    }
    const placaTitulo = caja('title-plate', [5.5, 0.85, 0.12], [4.1, 5.7, -8.42], 0x15344d, {
      emissive: 0x081a28,
    });
    escena.add(placaTitulo);
    const puntos = [0x32a8ff, 0x58e29c, 0xffd25a, 0xff6d7c];
    puntos.forEach((c, i) => {
      const punto = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6 }),
      );
      punto.position.set(2.2 + i * 0.55, 5.7, -8.25);
      escena.add(punto);
    });
  }

  function agregarEstantes(): void {
    const estante = caja('shelf', [4.4, 0.25, 1.3], [-8.7, 3.1, -5.9], 0x173247, { metalness: 0.3 });
    escena.add(estante);
    const coloresCajas = [0x1e6da0, 0x1f826f, 0xb7912e, 0x8d4251];
    for (let i = 0; i < 4; i++) {
      const cajaAlmacen = caja(
        `storage-${i}`,
        [0.75, 0.75 + i * 0.08, 0.75],
        [-10 + i * 0.9, 3.6, -5.9],
        coloresCajas[i],
        { roughness: 0.65 },
      );
      escena.add(cajaAlmacen);
    }
  }

  // ── Equipo externo ──────────────────────────────────────────────────────────

  function crearComponentesExternos(padre: THREE.Group): void {
    // Monitor
    const monitor = new THREE.Group();
    monitor.name = 'monitor';
    monitor.position.set(-0.8, 3.35, -0.35);
    const marco = caja('monitor-frame', [4.3, 2.65, 0.3], [0, 0, 0], 0x101923, { metalness: 0.45, roughness: 0.35 });
    const pantalla = caja('monitor-screen', [3.8, 2.15, 0.08], [0, 0.02, 0.18], 0x0c4b73, {
      emissive: 0x0c5f93,
      emissiveIntensity: 0.55,
      roughness: 0.28,
    });
    const soporte = caja('monitor-stand', [0.45, 1.05, 0.35], [0, -1.7, 0.05], 0x142230, { metalness: 0.55 });
    const base = caja('monitor-base', [1.8, 0.18, 1.1], [0, -2.22, 0.08], 0x142230, { metalness: 0.55 });
    monitor.add(marco, pantalla, soporte, base);
    padre.add(monitor);
    registrarInteractivo(monitor, 'monitor', 'external');
    crearBotonEncendido(monitor, 'power-monitor', [1.9, -1.19, 0.2], 0.1, 0x56b8ff);

    // Gabinete
    const gabinete = new THREE.Group();
    gabinete.name = 'tower';
    gabinete.position.set(3.35, 3.28, -0.15);
    const carcasa = caja('tower-case', [2.1, 3.2, 2.5], [0, 0, 0], 0x111d29, { metalness: 0.45, roughness: 0.38 });
    const frente = caja('tower-front', [1.75, 2.75, 0.08], [0, 0, 1.29], 0x172a39, { roughness: 0.25 });
    const tira = caja('tower-glow', [0.09, 2.1, 0.04], [-0.65, 0, 1.35], 0x32a8ff, {
      emissive: 0x32a8ff,
      emissiveIntensity: 0.9,
    });
    gabinete.add(carcasa, frente, tira);
    padre.add(gabinete);
    registrarInteractivo(gabinete, 'tower', 'external');
    crearBotonEncendido(gabinete, 'power-tower', [0.46, 0.78, 1.38], 0.14, 0x5ce1e6);

    // Teclado
    const teclado = new THREE.Group();
    teclado.name = 'keyboard';
    teclado.position.set(-1.15, 1.98, 1.25);
    teclado.rotation.x = -0.09;
    teclado.add(caja('keyboard-body', [3.8, 0.18, 1.25], [0, 0, 0], 0x172432, { metalness: 0.25, roughness: 0.5 }));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 12; c++) {
        const tecla = caja(
          `key-${r}-${c}`,
          [0.22, 0.055, 0.18],
          [-1.55 + c * 0.28, 0.12, -0.38 + r * 0.24],
          0x334a5c,
          { roughness: 0.55 },
        );
        teclado.add(tecla);
      }
    }
    padre.add(teclado);
    registrarInteractivo(teclado, 'keyboard', 'external');

    // Ratón
    //
    // Antes la cúpula llevaba `rotation.x = Math.PI / 2`, que la ponía de
    // canto: el ratón se veía parado sobre su costado. Aquí va acostada, con
    // proporciones tomadas de un ratón real (62 × 110 × 38 mm ≈ 1 : 1.77 :
    // 0.61) y apoyada en la mesa, cuya cubierta está en y = 1.825
    // (centro 1.65 + medio grosor 0.175; el teclado apoya en 1.834, coincide).
    //
    // El cordón entre botones es geometría, no una raya pintada encima: la
    // cúpula se parte en dos mitades por el eje X (phi π/2…3π/2 = mitad
    // derecha) separadas 0.014 a cada lado. Así la ranura sigue la curva del
    // lomo en vez de cruzarla recta, que es lo que delataba el truco.
    const raton = new THREE.Group();
    raton.name = 'mouse';
    // ESCALA_RATON = [ancho, alto, largo] sobre la esfera de radio 0.43.
    const ESCALA_RATON: Terna = [0.72, 0.643, 1.2];
    // Borde inferior de la cúpula: cos(0.62π) · 0.43 · alto = −0.1018.
    const bordeRaton = Math.cos(Math.PI * 0.62) * 0.43 * ESCALA_RATON[1];
    raton.position.set(1.45, 1.825 - bordeRaton, 1.2);

    const materialCarcasa = new THREE.MeshStandardMaterial({
      color: 0x203749,
      metalness: 0.25,
      roughness: 0.45,
    });
    ([
      ['mouse-shell-r', Math.PI / 2, 0.014],
      ['mouse-shell-l', -Math.PI / 2, -0.014],
    ] as const).forEach(([nombre, phi, dx]) => {
      const mitad = new THREE.Mesh(
        new THREE.SphereGeometry(0.43, 24, 16, phi, Math.PI, 0, Math.PI * 0.62),
        materialCarcasa,
      );
      mitad.name = nombre;
      mitad.scale.set(...ESCALA_RATON);
      mitad.position.x = dx;
      mitad.castShadow = true;
      raton.add(mitad);
    });

    // Forro interior: la esfera abierta no tiene tapas laterales, así que sin
    // esto la ranura dejaría ver el hueco. Al 94 % queda justo debajo.
    const forroRaton = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: 0x0a1622, roughness: 0.8 }),
    );
    forroRaton.name = 'mouse-inner';
    forroRaton.scale.set(ESCALA_RATON[0] * 0.94, ESCALA_RATON[1] * 0.94, ESCALA_RATON[2] * 0.94);
    raton.add(forroRaton);

    // Suela: cierra el borde abierto para que no se vea hueco por debajo.
    const suelaRaton = cilindro('mouse-base', 0.4, 0.04, [0, bordeRaton + 0.02, 0], 0x0d1c2b, [0, 0, 0], {
      roughness: 0.7,
    });
    suelaRaton.scale.set(ESCALA_RATON[0], 1, ESCALA_RATON[2]);
    raton.add(suelaRaton);

    // Luz de la ranura: dentro del cordón, sin sobresalir del lomo.
    raton.add(
      caja('mouse-line', [0.022, 0.14, 0.44], [0, 0.16, 0.02], 0x56d9e5, {
        emissive: 0x1f8f9d,
        emissiveIntensity: 0.9,
      }),
    );
    // Rueda: eje en X, asomando 0.04 por encima del lomo (que ahí mide 0.250).
    raton.add(
      cilindro('mouse-wheel', 0.058, 0.028, [0, 0.235, -0.22], 0x56d9e5, [0, 0, Math.PI / 2], {
        emissive: 0x1f8f9d,
        emissiveIntensity: 0.7,
        roughness: 0.4,
      }),
    );
    padre.add(raton);
    registrarInteractivo(raton, 'mouse', 'external');

    // Bocinas
    [-3.65, 2.05].forEach((x, i) => {
      const bocina = new THREE.Group();
      bocina.name = `speaker-${i}`;
      bocina.position.set(x, 2.65, -0.25);
      bocina.add(caja('speaker-box', [0.65, 1.55, 0.65], [0, 0, 0], 0x132433, { roughness: 0.4 }));
      [0.34, -0.35].forEach((y, j) => {
        const cono = cilindro('speaker-cone', 0.18 + j * 0.05, 0.05, [0, y, 0.34], 0x263f52, [Math.PI / 2, 0, 0], {
          metalness: 0.2,
        });
        bocina.add(cono);
      });
      padre.add(bocina);
      registrarInteractivo(bocina, `speaker-${i}`, 'external');
    });

    // Webcam
    const webcam = new THREE.Group();
    webcam.name = 'webcam';
    webcam.position.set(-0.8, 4.82, -0.16);
    webcam.add(caja('webcam-body', [0.75, 0.35, 0.35], [0, 0, 0], 0x172a3a, { roughness: 0.4 }));
    const lente = cilindro('webcam-lens', 0.11, 0.08, [0, 0, 0.2], 0x32a8ff, [Math.PI / 2, 0, 0], {
      emissive: 0x0b4370,
    });
    webcam.add(lente);
    padre.add(webcam);
    registrarInteractivo(webcam, 'webcam', 'external');

    // Impresora
    const impresora = new THREE.Group();
    impresora.name = 'printer';
    impresora.position.set(-4.2, 2.45, 0.15);
    impresora.add(caja('printer-body', [1.9, 1.15, 1.7], [0, 0, 0], 0xe7edf1, { roughness: 0.5 }));
    impresora.add(caja('printer-slot', [1.35, 0.12, 0.08], [0, 0.22, 0.89], 0x193446, { roughness: 0.3 }));
    impresora.add(caja('printer-paper', [1.25, 0.04, 0.9], [0, 0.65, -0.15], 0xf8fbff, { roughness: 0.85 }));
    padre.add(impresora);
    registrarInteractivo(impresora, 'printer', 'external');

    // Regulador
    const regulador = new THREE.Group();
    regulador.name = 'regulator';
    regulador.position.set(4.2, 1.98, 1.5);
    regulador.add(caja('regulator-body', [1.85, 0.55, 1.1], [0, 0, 0], 0x1b2e3c, { metalness: 0.2, roughness: 0.55 }));
    for (let i = 0; i < 3; i++) {
      regulador.add(caja(`outlet-${i}`, [0.25, 0.04, 0.25], [-0.5 + i * 0.5, 0.3, 0], 0x637d8e, { roughness: 0.6 }));
    }
    padre.add(regulador);
    registrarInteractivo(regulador, 'regulator', 'external');
    crearBotonEncendido(regulador, 'power-regulator', [0.7, 0.34, 0.25], 0.11, 0xffd25a);

    // USB y audífonos como interactivos decorativos
    const usb = new THREE.Group();
    usb.name = 'usb';
    usb.position.set(2.1, 1.95, 1.6);
    usb.add(caja('usb-body', [0.2, 0.12, 0.48], [0, 0, 0], 0xffd25a, { metalness: 0.2 }));
    usb.add(caja('usb-tip', [0.18, 0.08, 0.18], [0, 0, -0.32], 0xc6d1d8, { metalness: 0.75 }));
    padre.add(usb);
    registrarInteractivo(usb, 'usb', 'external');

    const audifonos = new THREE.Group();
    audifonos.name = 'headphones';
    audifonos.position.set(-4.45, 2.2, 1.35);
    audifonos.rotation.z = 0.3;
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.07, 12, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x58e29c, metalness: 0.25, roughness: 0.4 }),
    );
    arco.rotation.z = Math.PI;
    audifonos.add(arco);
    audifonos.add(caja('ear-l', [0.22, 0.45, 0.18], [-0.52, -0.05, 0], 0x173446));
    audifonos.add(caja('ear-r', [0.22, 0.45, 0.18], [0.52, -0.05, 0], 0x173446));
    padre.add(audifonos);
    registrarInteractivo(audifonos, 'headphones', 'external');
  }

  // ── Componentes internos ────────────────────────────────────────────────────

  function crearInternos(padre: THREE.Group): void {
    padre.position.set(3.25, 3.25, -0.1);
    const carcasa = caja('open-case', [2.55, 3.55, 2.85], [0, 0, 0], 0x122231, {
      transparent: true,
      opacity: 0.24,
      metalness: 0.45,
      roughness: 0.35,
    });
    padre.add(carcasa);
    const trasera = caja('case-back', [2.25, 3.15, 0.12], [0, 0, -1.25], 0x162d40, { metalness: 0.35 });
    padre.add(trasera);

    const tarjetaMadre = caja('motherboard', [1.9, 2.45, 0.12], [0, 0, -1.1], 0x1c765f, {
      metalness: 0.2,
      roughness: 0.55,
    });
    padre.add(tarjetaMadre);
    registrarInteractivo(tarjetaMadre, 'motherboard', 'internal');
    const cpu = caja('cpu', [0.62, 0.62, 0.16], [-0.25, 0.45, -0.98], 0xc9d4dc, { metalness: 0.7, roughness: 0.25 });
    padre.add(cpu);
    registrarInteractivo(cpu, 'cpu', 'internal');
    const ram = caja('ram', [0.18, 1.25, 0.14], [0.55, 0.4, -0.96], 0x32a8ff, { emissive: 0x0c4771 });
    padre.add(ram);
    registrarInteractivo(ram, 'ram', 'internal');
    const ssd = caja('ssd', [0.75, 1.15, 0.18], [-0.5, -0.75, -0.94], 0x333f4b, { metalness: 0.5 });
    padre.add(ssd);
    registrarInteractivo(ssd, 'ssd', 'internal');
    const fuente = caja('psu', [1.75, 0.72, 1.8], [0, -1.25, 0.15], 0x252f37, { metalness: 0.55 });
    padre.add(fuente);
    registrarInteractivo(fuente, 'psu', 'internal');
    // Rieles frontales del chasis: dan a qué atornillar el ventilador de
    // admisión para que no quede flotando en el aire.
    const RIEL_X = 0.79;
    const RIEL_Z = 1.3;
    padre.add(caja('front-rail-l', [0.12, 3.4, 0.14], [-RIEL_X, 0, RIEL_Z], 0x1a3245, { metalness: 0.45, roughness: 0.45 }));
    padre.add(caja('front-rail-r', [0.12, 3.4, 0.14], [RIEL_X, 0, RIEL_Z], 0x1a3245, { metalness: 0.45, roughness: 0.45 }));

    // Ventilador de admisión: DE PIE contra la pared frontal (marco en el plano
    // XY, hélice girando sobre Z), no acostado. Con 1.30 de fondo y 0.08 de
    // medio grosor queda en z ≤ 1.38, dentro de la carcasa (cara frontal 1.425).
    const ventilador = new THREE.Group();
    ventilador.name = 'fan';
    ventilador.position.set(0, 0.55, RIEL_Z);
    const LADO = 1.46;
    const CANTO = 0.12;
    const GROSOR = 0.16;
    const BRAZO = (LADO - CANTO) / 2;
    const marco: THREE.MeshStandardMaterialParameters = { metalness: 0.45, roughness: 0.4 };
    ventilador.add(caja('fan-frame-top', [LADO, CANTO, GROSOR], [0, BRAZO, 0], 0x20394d, marco));
    ventilador.add(caja('fan-frame-bottom', [LADO, CANTO, GROSOR], [0, -BRAZO, 0], 0x20394d, marco));
    ventilador.add(caja('fan-frame-left', [CANTO, LADO - CANTO * 2, GROSOR], [-BRAZO, 0, 0], 0x20394d, marco));
    ventilador.add(caja('fan-frame-right', [CANTO, LADO - CANTO * 2, GROSOR], [BRAZO, 0, 0], 0x20394d, marco));
    const ESQUINAS: ReadonlyArray<readonly [number, number]> = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    ESQUINAS.forEach(([sx, sy], i) => {
      ventilador.add(
        cilindro(`fan-screw-${i}`, 0.045, 0.2, [sx * BRAZO, sy * BRAZO, 0], 0xa8bccb, [Math.PI / 2, 0, 0], {
          metalness: 0.8,
          roughness: 0.25,
        }),
      );
    });
    // El toro nace en el plano XY: sin rotarlo queda de pie, mirando al frente.
    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 12, 36),
      new THREE.MeshStandardMaterial({ color: 0x2b4a63, metalness: 0.4, roughness: 0.35 }),
    );
    aro.name = 'fan-ring';
    aro.castShadow = true;
    ventilador.add(aro);
    const helice = new THREE.Group();
    helice.name = 'fan-blades';
    helice.add(
      cilindro('fan-hub', 0.17, 0.18, [0, 0, 0], 0x16293a, [Math.PI / 2, 0, 0], { metalness: 0.55, roughness: 0.3 }),
    );
    for (let i = 0; i < 7; i++) {
      const pivote = new THREE.Group();
      pivote.rotation.z = (i * Math.PI * 2) / 7;
      const aspa = caja(`blade-${i}`, [0.2, 0.46, 0.03], [0, 0.38, 0], 0x4a738b, { metalness: 0.25, roughness: 0.45 });
      aspa.rotation.y = 0.45;
      pivote.add(aspa);
      helice.add(pivote);
    }
    ventilador.add(helice);
    padre.add(ventilador);
    registrarInteractivo(ventilador, 'fan', 'internal');
  }

  // ── Cables y puertos ────────────────────────────────────────────────────────

  function crearConexiones(padre: THREE.Group): void {
    // Puertos colocados junto al gabinete para mayor claridad
    const datosPuertos: ReadonlyArray<readonly [string, number, Terna, string]> = [
      ['port-video', 0x56b8ff, [4.55, 3.8, 1.35], 'VIDEO'],
      ['port-keyboard', 0x62e6a5, [4.55, 3.3, 1.35], 'USB'],
      ['port-mouse', 0xffd25a, [4.55, 2.8, 1.35], 'USB'],
      ['port-power', 0xff7183, [4.55, 2.3, 1.35], 'POWER'],
    ];
    datosPuertos.forEach(([key, color, pos, etiqueta]) => {
      const puerto = caja(key, [0.38, 0.28, 0.09], pos, color, { emissive: color, emissiveIntensity: 0.2 });
      const d = datosDe(puerto);
      d.key = key;
      d.category = 'port';
      d.label = etiqueta;
      padre.add(puerto);
      interactivos.push(puerto);
      mapaObjetos.set(key, puerto);
    });
    const datosCables: ReadonlyArray<readonly [string, number, Terna]> = [
      ['cable-video', 0x56b8ff, [-4.4, 1.98, 2.1]],
      ['cable-keyboard', 0x62e6a5, [-2.8, 1.98, 2.1]],
      ['cable-mouse', 0xffd25a, [-1.2, 1.98, 2.1]],
      ['cable-power', 0xff7183, [0.4, 1.98, 2.1]],
    ];
    datosCables.forEach(([key, color, pos]) => {
      const grupo = new THREE.Group();
      grupo.name = key;
      grupo.position.set(...pos);
      const cuerpo = caja(`${key}-body`, [1.1, 0.12, 0.18], [0, 0, 0], color, {
        emissive: color,
        emissiveIntensity: 0.12,
      });
      const punta = caja(`${key}-end`, [0.25, 0.22, 0.26], [0.62, 0, 0], 0xd7e3e9, { metalness: 0.65 });
      grupo.add(cuerpo, punta);
      padre.add(grupo);
      registrarInteractivo(grupo, key, 'cable');
    });
  }

  // ── Robot ambiental (BIT; diseño idéntico al original) ──────────────────────

  function agregarRobotAmbiental(): void {
    const bot = new THREE.Group();
    bot.name = 'byte-3d';
    bot.position.set(-7.7, 2.25, -1.5);
    const cuerpo = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 28, 22),
      new THREE.MeshStandardMaterial({ color: 0x278dd7, metalness: 0.45, roughness: 0.25, emissive: 0x07365a }),
    );
    cuerpo.scale.y = 0.82;
    bot.add(cuerpo);
    const cara = caja('bot-face', [0.9, 0.42, 0.08], [0, 0.05, 0.62], 0x06111c, { emissive: 0x06111c });
    bot.add(cara);
    [-0.22, 0.22].forEach((x) => {
      const ojo = caja('bot-eye', [0.1, 0.14, 0.03], [x, 0.06, 0.69], 0x5ce1e6, {
        emissive: 0x5ce1e6,
        emissiveIntensity: 1,
      });
      bot.add(ojo);
    });
    const antena = cilindro('bot-ant', 0.035, 0.55, [0, 0.95, 0], 0x5ce1e6);
    bot.add(antena);
    const puntaAntena = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd25a, emissive: 0xffd25a, emissiveIntensity: 0.8 }),
    );
    puntaAntena.position.y = 1.25;
    bot.add(puntaAntena);
    datosDe(bot).floatBase = bot.position.y;
    escena.add(bot);
    registrarInteractivo(bot, 'byte-3d', 'ambient');
  }

  // ── Construcción de la escena ───────────────────────────────────────────────

  construirLaboratorio();

  const grupoPrincipal = new THREE.Group();
  grupoPrincipal.name = 'main-computer';
  escena.add(grupoPrincipal);
  crearComponentesExternos(grupoPrincipal);

  const grupoInternos = new THREE.Group();
  grupoInternos.name = 'internals';
  escena.add(grupoInternos);
  crearInternos(grupoInternos);
  grupoInternos.visible = false;

  const grupoConexiones = new THREE.Group();
  grupoConexiones.name = 'connections';
  escena.add(grupoConexiones);
  crearConexiones(grupoConexiones);
  grupoConexiones.visible = false;

  agregarRobotAmbiental();

  // ── Resaltes ────────────────────────────────────────────────────────────────

  function aplicarResalte(objeto: THREE.Object3D, encendido: boolean): void {
    if (datosDe(objeto).persistentHighlight) return;
    objeto.traverse((hijo) => {
      if (!esMesh(hijo)) return;
      const material = materialEstandar(hijo);
      if (!material) return;
      if (encendido) {
        material.emissive.setHex(0x1688b8);
        material.emissiveIntensity = 0.65;
      } else {
        const dh = datosDe(hijo);
        if (dh.originalEmissive) material.emissive.copy(dh.originalEmissive);
        material.emissiveIntensity = dh.baseEmissive ?? 0;
      }
    });
  }

  // ── Puntero y raycaster ─────────────────────────────────────────────────────

  function visibleEnJerarquia(objeto: THREE.Object3D): boolean {
    let actual: THREE.Object3D | null = objeto;
    while (actual) {
      if (!actual.visible) return false;
      actual = actual.parent;
    }
    return true;
  }

  function actualizarPuntero(evento: MouseEvent): void {
    // NDC relativo al canvas: idéntico al original cuando ocupa toda la ventana.
    const rect = canvas.getBoundingClientRect();
    const ancho = rect.width || window.innerWidth;
    const alto = rect.height || window.innerHeight;
    puntero.x = ((evento.clientX - rect.left) / ancho) * 2 - 1;
    puntero.y = -((evento.clientY - rect.top) / alto) * 2 + 1;
  }

  function intersecciones(): THREE.Intersection[] {
    raycaster.setFromCamera(puntero, camara);
    return raycaster
      .intersectObjects(interactivos, true)
      .filter((impacto) => impacto.object.visible && visibleEnJerarquia(impacto.object));
  }

  function alMoverPuntero(evento: PointerEvent): void {
    actualizarPuntero(evento);
    const impactos = intersecciones();
    const raiz = impactos[0] ? (datosDe(impactos[0].object).rootInteractive ?? impactos[0].object) : null;
    if (sobrevolado !== raiz) {
      if (sobrevolado) aplicarResalte(sobrevolado, false);
      sobrevolado = raiz;
      if (sobrevolado) aplicarResalte(sobrevolado, true);
    }
    renderer.domElement.style.cursor = raiz ? 'pointer' : 'grab';
  }

  function alClic(evento: MouseEvent): void {
    actualizarPuntero(evento);
    const impactos = intersecciones();
    if (!impactos.length) return;
    const raiz = datosDe(impactos[0].object).rootInteractive ?? impactos[0].object;
    const d = datosDe(raiz);
    // Solo reporta; el núcleo del juego decide qué hacer.
    if (typeof d.key === 'string' && typeof d.category === 'string') {
      callbacks.onObjectClick(d.key, d.category);
    }
  }

  canvas.addEventListener('pointermove', alMoverPuntero);
  canvas.addEventListener('click', alClic);

  // ── Cámara animada ──────────────────────────────────────────────────────────

  function animarCamara(haciaPos: THREE.Vector3, haciaTarget: THREE.Vector3): void {
    if (dispuesto) return;
    const desdePos = camara.position.clone();
    const desdeTarget = controles.target.clone();
    const inicio = performance.now();
    const duracion = 650;
    const token = ++tokenCamara;
    const paso = (ahora: number): void => {
      if (dispuesto || token !== tokenCamara) return;
      const t = Math.min(1, (ahora - inicio) / duracion);
      const e = 1 - Math.pow(1 - t, 3);
      camara.position.lerpVectors(desdePos, haciaPos, e);
      controles.target.lerpVectors(desdeTarget, haciaTarget, e);
      if (t < 1) window.requestAnimationFrame(paso);
    };
    window.requestAnimationFrame(paso);
  }

  function enfocarPrincipal(): void {
    animarCamara(new THREE.Vector3(8.2, 5.7, 10), new THREE.Vector3(0, 2.3, 0));
  }

  function enfocarInternos(): void {
    animarCamara(new THREE.Vector3(7.6, 4.8, 7.2), new THREE.Vector3(3.25, 3.2, 0));
  }

  function enfocarConexiones(): void {
    animarCamara(new THREE.Vector3(8.8, 5.8, 10.5), new THREE.Vector3(0, 2.3, 0.6));
  }

  // ── Utilidades de materiales de la misión ───────────────────────────────────

  function materialPantallaMonitor(): THREE.MeshStandardMaterial | null {
    const monitor = mapaObjetos.get('monitor');
    const pantalla = monitor?.getObjectByName('monitor-screen');
    return pantalla && esMesh(pantalla) ? materialEstandar(pantalla) : null;
  }

  function limpiarConexiones(): void {
    lineasConexion.splice(0).forEach((linea) => {
      escena.remove(linea);
      linea.geometry.dispose();
      linea.material.dispose();
    });
  }

  // Apagado del resalte persistente (rama "off" de setPersistentHighlight
  // del original); la API pública solo expone el encendido.
  function quitarResaltePersistente(objeto: THREE.Object3D): void {
    datosDe(objeto).persistentHighlight = false;
    objeto.traverse((hijo) => {
      if (!esMesh(hijo)) return;
      const material = materialEstandar(hijo);
      if (!material) return;
      const dh = datosDe(hijo);
      if (dh.originalEmissive) material.emissive.copy(dh.originalEmissive);
      material.emissiveIntensity = 0;
    });
  }

  // ── Tamaño y loop ───────────────────────────────────────────────────────────

  function alRedimensionar(): void {
    const rect = canvas.getBoundingClientRect();
    const ancho = rect.width || window.innerWidth;
    const alto = rect.height || window.innerHeight;
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    renderer.setSize(ancho, alto, false);
  }

  window.addEventListener('resize', alRedimensionar);
  alRedimensionar();

  function animar(tiempo: number): void {
    idRAF = window.requestAnimationFrame(animar);
    controles.update();
    const bot = mapaObjetos.get('byte-3d');
    if (bot) {
      const base = datosDe(bot).floatBase ?? bot.position.y;
      bot.position.y = base + Math.sin(tiempo * 0.0018) * 0.14;
      bot.rotation.y = Math.sin(tiempo * 0.001) * 0.12;
    }
    const helice = mapaObjetos.get('fan')?.getObjectByName('fan-blades');
    if (helice) helice.rotation.z = tiempo * 0.0018;
    renderer.render(escena, camara);
  }

  idRAF = window.requestAnimationFrame(animar);

  // ── API pública ─────────────────────────────────────────────────────────────

  const api: LabAPI = {
    focusMain() {
      if (dispuesto) return;
      enfocarPrincipal();
    },

    focusInternals() {
      if (dispuesto) return;
      enfocarInternos();
    },

    focusConnections() {
      if (dispuesto) return;
      enfocarConexiones();
    },

    focusObject(key) {
      if (dispuesto) return;
      const objeto = mapaObjetos.get(key);
      if (!objeto) return;
      const posicion = new THREE.Vector3();
      objeto.getWorldPosition(posicion);
      const direccion = camara.position.clone().sub(controles.target).normalize();
      animarCamara(posicion.clone().add(direccion.multiplyScalar(5.2)).add(new THREE.Vector3(0, 1, 0)), posicion);
    },

    resetCamera() {
      if (dispuesto) return;
      animarCamara(camaraInicial.position.clone(), camaraInicial.target.clone());
    },

    setModuleEnvironment(modulo) {
      if (dispuesto) return;
      // Igual que loadModule del original.
      grupoPrincipal.visible = modulo !== 1;
      grupoInternos.visible = modulo === 1;
      grupoConexiones.visible = modulo === 2 || modulo === 6;
      // Los módulos 4 y 5 abren EduOS sin mover la cámara (openOS en la
      // referencia no llama a ningún focus*): la vista queda donde estaba.
      if (modulo === 1) enfocarInternos();
      else if (modulo === 2) enfocarConexiones();
      else if (modulo !== 4 && modulo !== 5) enfocarPrincipal();
    },

    setPersistentHighlight(key) {
      if (dispuesto) return;
      const objeto = mapaObjetos.get(key);
      if (!objeto) return;
      datosDe(objeto).persistentHighlight = true;
      objeto.traverse((hijo) => {
        if (!esMesh(hijo)) return;
        const material = materialEstandar(hijo);
        if (!material) return;
        material.emissive.setHex(0x52e3e7);
        material.emissiveIntensity = 1;
      });
    },

    resetObjectVisuals() {
      if (dispuesto) return;
      interactivos.forEach((objeto) => {
        datosDe(objeto).persistentHighlight = false;
        objeto.scale.setScalar(1);
        objeto.traverse((hijo) => {
          if (!esMesh(hijo)) return;
          const material = materialEstandar(hijo);
          if (!material) return;
          const dh = datosDe(hijo);
          if (dh.originalEmissive) material.emissive.copy(dh.originalEmissive);
          material.emissiveIntensity = dh.baseEmissive ?? 0;
        });
      });
    },

    drawConnection(cableKey, portKey, color) {
      if (dispuesto) return;
      const desde = mapaObjetos.get(cableKey);
      const hasta = mapaObjetos.get(portKey);
      if (!desde || !hasta) return;
      // El original quita el resalte del cable justo al conectar.
      quitarResaltePersistente(desde);
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      desde.getWorldPosition(a);
      hasta.getWorldPosition(b);
      const medio = a.clone().lerp(b, 0.5);
      medio.y += 0.6;
      const curva = new THREE.CatmullRomCurve3([a, a.clone().lerp(medio, 0.5), medio, medio.clone().lerp(b, 0.5), b]);
      const tubo = new THREE.Mesh(
        new THREE.TubeGeometry(curva, 40, 0.045, 8, false),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.4 }),
      );
      escena.add(tubo);
      lineasConexion.push(tubo);
    },

    clearConnections() {
      if (dispuesto) return;
      limpiarConexiones();
    },

    preparePowerModule() {
      if (dispuesto) return;
      ['power-regulator', 'power-monitor', 'power-tower'].forEach((key) => {
        const objeto = mapaObjetos.get(key);
        if (!objeto || !esMesh(objeto)) return;
        const material = materialEstandar(objeto);
        if (material) material.emissiveIntensity = 0.18;
        objeto.scale.setScalar(1);
      });
      const pantalla = materialPantallaMonitor();
      if (pantalla) pantalla.emissiveIntensity = 0.05;
    },

    setRegulatorOn() {
      if (dispuesto) return;
      const boton = mapaObjetos.get('power-regulator');
      if (!boton || !esMesh(boton)) return;
      const material = materialEstandar(boton);
      if (material) material.emissiveIntensity = 1.5;
      boton.scale.setScalar(1.18);
    },

    setMonitorOn() {
      if (dispuesto) return;
      const pantalla = materialPantallaMonitor();
      if (!pantalla) return;
      pantalla.color.setHex(0x1487c7);
      pantalla.emissiveIntensity = 0.95;
    },

    playBootAnimation(onDone) {
      if (dispuesto) return;
      // Botón del gabinete activo (como handlePowerClick del original).
      const boton = mapaObjetos.get('power-tower');
      if (boton && esMesh(boton)) {
        const material = materialEstandar(boton);
        if (material) material.emissiveIntensity = 1.5;
        boton.scale.setScalar(1.18);
      }
      // 8 parpadeos de pantalla cada 180 ms (bootAnimation del original).
      if (temporizadorArranque) window.clearInterval(temporizadorArranque);
      const pantalla = materialPantallaMonitor();
      let parpadeos = 0;
      temporizadorArranque = window.setInterval(() => {
        if (pantalla) pantalla.emissiveIntensity = parpadeos % 2 ? 0.25 : 1.2;
        parpadeos++;
        if (parpadeos > 7) {
          window.clearInterval(temporizadorArranque);
          temporizadorArranque = 0;
          if (pantalla) {
            pantalla.color.setHex(0x195c8e);
            pantalla.emissiveIntensity = 0.7;
          }
          onDone();
        }
      }, 180);
    },

    dispose() {
      if (dispuesto) return;
      dispuesto = true;
      window.cancelAnimationFrame(idRAF);
      if (temporizadorArranque) {
        window.clearInterval(temporizadorArranque);
        temporizadorArranque = 0;
      }
      window.removeEventListener('resize', alRedimensionar);
      canvas.removeEventListener('pointermove', alMoverPuntero);
      canvas.removeEventListener('click', alClic);
      canvas.style.cursor = '';
      controles.dispose();
      limpiarConexiones();
      // Libera geometrías y materiales de toda la escena.
      const geometrias = new Set<THREE.BufferGeometry>();
      const materiales = new Set<THREE.Material>();
      escena.traverse((objeto) => {
        const recursos = objeto as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        if (recursos.geometry) geometrias.add(recursos.geometry);
        if (Array.isArray(recursos.material)) recursos.material.forEach((m) => materiales.add(m));
        else if (recursos.material) materiales.add(recursos.material);
      });
      geometrias.forEach((g) => g.dispose());
      materiales.forEach((m) => m.dispose());
      escena.clear();
      renderer.dispose();
    },
  };

  return api;
}
