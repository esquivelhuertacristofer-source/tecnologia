'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import './realOGenerado.css';

/**
 * N4·U6 «Aprendo con la IA» · «Real o generado: primeras pistas».
 *
 * SIN 3D (regla de la casa): esto es «Tecnia Muro», un visor de
 * publicaciones —como el de una red social— renderizado en DOM plano.
 * No hay mueble, ni mesa, ni escena: se abre la app y ya.
 *
 * No hay fotos de verdad (regla de la casa: `assetsPendientes`, nada de
 * archivos): cada publicación lleva un MARCADOR de imagen —una tarjeta de
 * color con un emoji y una descripción de la escena— y, cuando el alumno
 * examina la imagen, las pistas se listan como texto. Cuando existan las
 * imágenes reales, sólo hay que llenar `escena.foto` en `PUBLICACIONES` y
 * pintar un <Image> encima de `.rog-imagen`; el marcador ya deja el hueco
 * exacto (mismo `aspect-ratio`, mismo marco).
 *
 * La mecánica tiene diez publicaciones repartidas en tres fases que
 * desbloquean herramientas SIN volver atrás:
 *   Fase 1 (0–2) — sólo «Examinar imagen». Las pistas clásicas (manos,
 *     texto ilegible, fondos repetidos) SÍ sirven aquí y se enseñan enteras.
 *   Fase 2 (3–6) — se suma «Ver la cuenta». Aquí vive el caso que nadie
 *     enseña: una foto REAL, sin retocar, de otro país y de hace años,
 *     publicada como si fuera de aquí y de ahora. Ninguna pista de imagen
 *     la delata; la cuenta sí.
 *   Fase 3 (7–9) — se suma «¿Alguien más lo cuenta?». Incluye un caso
 *     genuinamente ambiguo cuya respuesta correcta es «no estoy segura»: la
 *     duda honesta no es un fallo, es la habilidad que no caduca.
 *
 * La decisión que se juzga NUNCA es «real o generada» a secas —eso es sólo
 * el material—: es «comparto / no comparto / no estoy segura», porque lo
 * que de verdad importa es si la publicación engaña o no, no de qué está
 * hecha (§ regla 5 del encargo).
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso
 * 60), igual que el resto de N4.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

type Veredicto = 'compartir' | 'no-compartir' | 'no-seguro';
type Herramienta = 'imagen' | 'cuenta' | 'cruce';

interface CuentaPublicadora {
  nombre: string;
  usuario: string;
  creada: string;
  publicaciones: number;
  verificada: boolean;
  inicial: string;
  acento: { c: string; deep: string };
}

interface Publicacion {
  id: string;
  cuenta: CuentaPublicadora;
  fecha: string;
  texto: string;
  escena: { emoji: string; descripcion: string };
  /** Pistas clásicas de imagen generada. Vacío = no hay ninguna (foto real o sin pistas). */
  pistasImagen: string[];
  /** Lo que dice el propio texto cuando NO hay pistas de imagen que mostrar. */
  notaImagen: string;
  /** Resultado de «¿Alguien más lo cuenta?» (sólo se lee desde fase 3). */
  cruce: string;
  veredicto: Veredicto;
  explicaciones: Record<Veredicto, string>;
}

const PUBLICACIONES: Publicacion[] = [
  {
    id: 'fiesta-abuelo',
    cuenta: {
      nombre: 'Marta',
      usuario: '@marta.cocina',
      creada: 'hace 3 años',
      publicaciones: 340,
      verificada: false,
      inicial: 'M',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    fecha: 'Hace 2 horas',
    texto: '¡Así quedó el pastel de cumpleaños de mi abuelo! 🎂🥳',
    escena: { emoji: '🎂', descripcion: 'Mesa con un pastel y personas festejando alrededor.' },
    pistasImagen: [
      'Las manos que sostienen el cuchillo tienen un dedo de más.',
      'El letrero de fondo dice "FELIZ CUMPLE", pero las letras no forman esas palabras si las miras de cerca.',
      'La piel de las caras se ve perfecta, sin una sola arruga ni brillo: como pintada.',
    ],
    notaImagen: '',
    cruce: 'Nadie más volvió a publicar esta fiesta. Es normal: una fiesta familiar no la cuenta nadie más.',
    veredicto: 'no-compartir',
    explicaciones: {
      'no-compartir':
        'Bien visto. El cuchillo con un dedo de más, el letrero que no se lee y la piel de plástico son tres pistas clásicas juntas: esta imagen está generada, y se publicó como si fuera una foto real de una fiesta.',
      compartir:
        'Vuelve a mirar la mano que sostiene el cuchillo, y el letrero de atrás. Esta imagen trae pistas clásicas de estar generada, y se presenta como si fuera una foto real.',
      'no-seguro':
        'Aquí sí puedes estar segura: las manos, el letrero y la piel son tres pistas juntas, no una sola dudosa. Cuando se acumulan varias, ya no es duda: es una imagen generada haciéndose pasar por real.',
    },
  },
  {
    id: 'perro-toby',
    cuenta: {
      nombre: 'Diego',
      usuario: '@diego.patineta',
      creada: 'hace 5 años',
      publicaciones: 812,
      verificada: false,
      inicial: 'D',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    fecha: 'Hace 5 horas',
    texto: 'Mi perro Toby esperando a que le tire la pelota 🐶🎾',
    escena: { emoji: '🐕', descripcion: 'Un perro sentado en un jardín, mirando hacia la cámara.' },
    pistasImagen: [],
    notaImagen: 'No aparece ninguna pista clásica: ni manos, ni letras, ni fondos repetidos. Es una foto sencilla.',
    cruce: '',
    veredicto: 'compartir',
    explicaciones: {
      compartir:
        'Exacto. No hay manos raras, ni letras ilegibles, ni nada que se repita: es una foto sencilla de un perro en un jardín, y no promete nada raro.',
      'no-compartir':
        'Vuelve a mirar con calma: no hay dedos de más, ni texto ilegible, ni fondo repetido. Es una foto sencilla; no todo lo que ves necesita desconfianza.',
      'no-seguro':
        'Aquí sí puedes estar segura: es una foto sencilla, sin ninguna de las pistas que aprendiste. No siempre hace falta dudar.',
    },
  },
  {
    id: 'salto-barda',
    cuenta: {
      nombre: 'Mundo Animal',
      usuario: '@el.mundo.animal',
      creada: 'hace 2 meses',
      publicaciones: 14,
      verificada: false,
      inicial: 'M',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    fecha: 'Hace 1 día',
    texto: '¡Miren a este perrito saltando una barda gigante! 🐕🤸',
    escena: { emoji: '🐩', descripcion: 'Un perro saltando sobre una barda muy alta, en un jardín.' },
    pistasImagen: [
      'Las patas del perro tienen un dedo de más cada una.',
      'El pasto del fondo se repite igual, como un papel tapiz.',
      'El letrero del jardín tiene letras que no forman ninguna palabra.',
    ],
    notaImagen: '',
    cruce: '',
    veredicto: 'no-compartir',
    explicaciones: {
      'no-compartir':
        'Muy bien. Las patas con un dedo de más, el pasto repetido y el letrero que no se lee: tres pistas juntas. Este perrito saltarín no es de verdad, está generado.',
      compartir:
        'Cuenta las patas del perro, mira el pasto del fondo y el letrero. Son tres pistas de que esta imagen está generada.',
      'no-seguro':
        'Aquí sí puedes estar segura: hay tres pistas juntas, no una sola dudosa. Cuando se juntan varias, ya no es duda.',
    },
  },
  {
    id: 'ola-gigante',
    cuenta: {
      nombre: 'Noticias Ya',
      usuario: '@noticias.ya',
      creada: 'hace 4 días',
      publicaciones: 3,
      verificada: false,
      inicial: 'N',
      acento: { c: '#f87171', deep: '#b91c1c' },
    },
    fecha: 'Hace 20 minutos',
    texto: '😱 ¡Miren la ola gigante que llegó ayer a nuestra playa!',
    escena: { emoji: '🌊', descripcion: 'Una ola enorme, a punto de caer sobre la playa.' },
    pistasImagen: [],
    notaImagen: 'No hay pistas: ni manos, ni letras, ni nada repetido. La foto se ve completamente real.',
    cruce:
      'Esta misma foto ya se publicó hace 8 años, en la playa de otro país. La foto es real: nadie la generó ni la retocó.',
    veredicto: 'no-compartir',
    explicaciones: {
      'no-compartir':
        '¡Exacto, y esto es lo importante de hoy! La foto es real, no está generada. Pero es de otro país y de hace ocho años, y dicen que es de aquí y de ayer. Ninguna pista de imagen te lo iba a decir: lo dice la cuenta, creada hace apenas 4 días, con sólo 3 publicaciones.',
      compartir:
        'Mira la cuenta: se creó hace apenas 4 días y sólo tiene 3 publicaciones. Y esta misma foto ya existía hace 8 años, en otro país. Una foto real también puede contar una mentira.',
      'no-seguro':
        'Aquí sí puedes decidir: la cuenta es nueva, y la foto ya existía hace 8 años en otro país. Con esos dos datos ya se sabe: no se comparte.',
    },
  },
  {
    id: 'torneo-futbol',
    cuenta: {
      nombre: 'Club Deportivo Halcones',
      usuario: '@halcones.club',
      creada: 'hace 4 años',
      publicaciones: 620,
      verificada: true,
      inicial: 'H',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    fecha: 'Hace 40 minutos',
    texto: 'Confirmado: el torneo de fútbol infantil es este sábado a las 10am, cancha 2. ⚽',
    escena: { emoji: '⚽', descripcion: 'Una cancha de fútbol vacía, lista para el torneo.' },
    pistasImagen: [],
    notaImagen: 'No hay pistas: es una foto sencilla de una cancha, sin nada raro.',
    cruce: 'El entrenador confirmó el mismo horario en el grupo de la escuela.',
    veredicto: 'compartir',
    explicaciones: {
      compartir:
        'Bien decidido. La cuenta lleva 4 años, está verificada, y el entrenador confirmó lo mismo por su lado. Todo dice lo mismo.',
      'no-compartir':
        'Revisa la cuenta: 4 años, verificada, y el entrenador confirmó el mismo horario. No hay ninguna señal de alerta aquí.',
      'no-seguro':
        'Aquí sí hay con qué decidir: cuenta verificada de 4 años, y el entrenador dijo lo mismo. Cuando coinciden, ya se puede compartir.',
    },
  },
  {
    id: 'feria-escuela',
    cuenta: {
      nombre: 'Feria de la Escuela',
      usuario: '@feriadelaescuela',
      creada: 'hace 2 años',
      publicaciones: 96,
      verificada: false,
      inicial: 'F',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    fecha: 'Hace 3 horas',
    texto: 'Así se verá el castillo inflable gigante del sábado (dibujo del diseño, todavía no está armado) 🎨🏰',
    escena: { emoji: '🏰', descripcion: 'Un dibujo de un castillo inflable enorme, de colores.' },
    pistasImagen: [],
    notaImagen: 'No hace falta buscar pistas escondidas: el propio texto ya dice que es un dibujo del diseño.',
    cruce: '',
    veredicto: 'compartir',
    explicaciones: {
      compartir:
        'Así es. Esta imagen sí está hecha por computadora… y no engaña a nadie: el propio texto dice que es un dibujo del diseño, todavía no armado. Que algo esté generado no lo hace falso — lo que importa es si te dicen la verdad.',
      'no-compartir':
        'Lee el texto otra vez: dice que es un dibujo del diseño, todavía no armado. Que una imagen esté generada no la hace mentirosa; lo que importa es si te dicen la verdad, y aquí sí te la dijeron.',
      'no-seguro':
        'No hace falta dudar aquí: el texto ya te dijo lo que es, un dibujo del diseño. Cuando te cuentan algo tal como es, no hay engaño.',
    },
  },
  {
    id: 'record-cuerda',
    cuenta: {
      nombre: 'Récords Virales',
      usuario: '@records.virales',
      creada: 'hace 1 semana',
      publicaciones: 5,
      verificada: false,
      inicial: 'R',
      acento: { c: '#fb923c', deep: '#c2410c' },
    },
    fecha: 'Hace 10 minutos',
    texto: '🏆 ¡Este niño saltó la cuerda 1000 veces sin parar y rompió el récord del mundo!',
    escena: { emoji: '🪢', descripcion: 'Un niño saltando la cuerda, con un letrero de "RÉCORD" detrás.' },
    pistasImagen: [
      'La mano que sostiene la cuerda tiene un dedo de más.',
      'El letrero de "RÉCORD" tiene letras que no forman esa palabra.',
    ],
    notaImagen: '',
    cruce: 'Ninguna cuenta oficial de récords menciona a este niño.',
    veredicto: 'no-compartir',
    explicaciones: {
      'no-compartir':
        'Muy bien. Dos pistas de imagen (la mano, el letrero) más una cuenta de una semana con 5 publicaciones, más que nadie oficial lo confirma: todo apunta al mismo lado.',
      compartir:
        'Mira la mano que sostiene la cuerda, y el letrero de "RÉCORD". Y fíjate en la cuenta: una semana de creada, 5 publicaciones. Son varias señales juntas.',
      'no-seguro':
        'Aquí no hace falta quedarse con la duda: la imagen tiene pistas, la cuenta es nueva y nadie oficial lo confirma. Con varias señales apuntando igual, ya se puede decidir.',
    },
  },
  {
    id: 'animal-raro',
    cuenta: {
      nombre: 'Testigo',
      usuario: '@lo.vi.anoche',
      creada: 'hace 3 meses',
      publicaciones: 2,
      verificada: false,
      inicial: '?',
      acento: { c: '#94a3b8', deep: '#334155' },
    },
    fecha: 'Hace 8 minutos',
    texto: 'Dicen que vieron un animal rarísimo cerca de mi casa anoche. No sé si es cierto, pero aquí está la foto.',
    escena: { emoji: '🌫️', descripcion: 'Una foto oscura y borrosa. No se distingue bien qué es.' },
    pistasImagen: [],
    notaImagen: 'La foto está tan oscura que no se ve nada claro: ni para creerlo, ni para dudarlo.',
    cruce: 'Nadie más ha hablado de esto todavía.',
    veredicto: 'no-seguro',
    explicaciones: {
      'no-seguro':
        'Elegiste "no estoy segura", ¡y es la respuesta correcta! La foto está muy oscura, la cuenta es nueva y nadie más lo cuenta. No pasa nada por no saber: lo honesto es decir "no sé" y no compartir.',
      compartir:
        'La foto está muy oscura, la cuenta es nueva y nadie más lo cuenta: no hay con qué asegurar nada todavía. No pasa nada por decir "no estoy segura".',
      'no-compartir':
        'Ojo: tampoco hay pruebas de que sea falsa. Cuando de verdad no lo sabes, lo más honesto no es decir que sí es mentira: es decir "no estoy segura".',
    },
  },
  {
    id: 'arbol-caido',
    cuenta: {
      nombre: 'Vecinos Unidos',
      usuario: '@vecinos.unidos',
      creada: 'hace 3 años',
      publicaciones: 540,
      verificada: false,
      inicial: 'V',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    fecha: 'Hace 25 minutos',
    texto: 'Se cayó un árbol grande en la avenida principal, tengan cuidado al pasar 🌳🚧',
    escena: { emoji: '🌳', descripcion: 'Un árbol caído sobre la banqueta de una avenida.' },
    pistasImagen: [],
    notaImagen: 'No hay pistas de imagen: es una foto sencilla de un árbol caído.',
    cruce: 'Otras 4 cuentas del barrio publicaron fotos del mismo árbol, desde ángulos distintos, en la última hora.',
    veredicto: 'compartir',
    explicaciones: {
      compartir:
        'Exacto: esto es lo que no caduca nunca. Cuatro cuentas distintas, que no se conocen entre ellas, mostrando lo mismo desde ángulos distintos: esa es la mejor prueba que hay.',
      'no-compartir':
        'Usa la herramienta de "¿Alguien más lo cuenta?": cuatro cuentas del barrio publicaron el mismo árbol desde ángulos distintos. Cuando varias fuentes que no se conocen dicen lo mismo, eso es prueba fuerte.',
      'no-seguro':
        'Aquí sí puedes estar segura: cuatro cuentas distintas confirmaron lo mismo, desde ángulos distintos, en la última hora. Eso ya es suficiente para compartir.',
    },
  },
  {
    id: 'rescate-heroico',
    cuenta: {
      nombre: 'Noticias Express 24',
      usuario: '@noticias.express24',
      creada: 'hace 2 semanas',
      publicaciones: 8,
      verificada: false,
      inicial: 'N',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    fecha: 'Hace 5 minutos',
    texto: '🐶🔥 Un bombero rescató a un perrito de un incendio. ¡Todo un héroe!',
    escena: { emoji: '🔥', descripcion: 'Un bombero cargando a un perrito, con humo de fondo.' },
    pistasImagen: [
      'La mano del bombero que sostiene al perrito tiene un dedo de más.',
      'Las orejas del perrito son de distinto tamaño entre sí.',
      'El humo del fondo se repite en el mismo patrón, como si fuera un solo pedazo copiado y pegado.',
    ],
    notaImagen: '',
    cruce: 'Ningún cuerpo de bomberos oficial, ni ninguna otra cuenta, menciona este rescate.',
    veredicto: 'no-compartir',
    explicaciones: {
      'no-compartir':
        'Reuniste las tres cosas: la mano, las orejas y el humo repetido dicen que la imagen está generada. Y la cuenta —dos semanas, ocho publicaciones— más que ningún bombero lo confirme, dicen que además nadie responde por ella. Cuando la imagen, la cuenta y el cruce apuntan al mismo lugar, ya no hay duda.',
      compartir:
        'Mira la mano del bombero, las orejas del perrito y el humo del fondo. Y revisa la cuenta: dos semanas, ocho publicaciones, y ningún bombero oficial lo confirma. Las tres cosas apuntan igual.',
      'no-seguro':
        'Aquí ya no es duda: la imagen tiene tres pistas, la cuenta es nueva y nadie oficial lo confirma. Con las tres herramientas apuntando igual, ya se puede decidir.',
    },
  },
];

const TOTAL = PUBLICACIONES.length;

function fase(idx: number): 1 | 2 | 3 {
  if (idx < 3) return 1;
  if (idx < 7) return 2;
  return 3;
}

function herramientasDe(idx: number): Herramienta[] {
  const lista: Herramienta[] = ['imagen'];
  if (idx >= 3) lista.push('cuenta');
  if (idx >= 7) lista.push('cruce');
  return lista;
}

const FASE_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Fase 1 · Mira la imagen',
  2: 'Fase 2 · Investiga la cuenta',
  3: 'Fase 3 · Cruza la información',
};

const TOOL_META: Record<Herramienta, { emoji: string; etiqueta: string }> = {
  imagen: { emoji: '🔍', etiqueta: 'Examinar imagen' },
  cuenta: { emoji: '👤', etiqueta: 'Ver la cuenta' },
  cruce: { emoji: '🌐', etiqueta: '¿Alguien más lo cuenta?' },
};

const VEREDICTO_META: Record<Veredicto, { emoji: string; etiqueta: string }> = {
  compartir: { emoji: '📤', etiqueta: 'Compartir' },
  'no-compartir': { emoji: '🚫', etiqueta: 'No compartir' },
  'no-seguro': { emoji: '🤔', etiqueta: 'No estoy segura' },
};

const LINEA_INICIO =
  'Bienvenida a Tecnia Muro. Publicaciones de mentira, pero se comportan igual que las de verdad. Tú decides qué se comparte.';

const TRANSICION_CADUCA =
  'Ya aprendiste tres pistas que sirven hoy: manos con dedos de más, letras que no se leen, fondos que se repiten. Pero toca decir la verdad incómoda: esas pistas caducan. Si sólo aprendes a mirar las manos, dentro de un año no vas a saber nada. Desde ahora tienes una herramienta nueva: Ver la cuenta.';

const TRANSICION_CRUCE =
  'Ya sabes mirar la imagen y revisar la cuenta. Falta la pregunta que nunca caduca: ¿alguien más lo está contando? Desde ahora tienes la tercera herramienta: ¿Alguien más lo cuenta?';

/**
 * Lo que dice Bit al elegir un veredicto es corto A PROPÓSITO y nunca repite
 * la explicación completa: esa vive, por escrito, en el panel bajo los
 * botones (`.rog-feedback`) — así el alumno la puede releer sin que Bit
 * recite un párrafo entero en voz alta cada vez.
 */
const NUDGE_BIEN = [
  '¡Eso es! Lee por qué, ahí abajo.',
  '¡Bien decidido! La explicación quedó escrita abajo.',
  '¡Acertaste! Léela con calma antes de seguir.',
];

const NUDGE_MAL = [
  'Casi. Lee la explicación de abajo y vuelve a intentarlo.',
  'Mmm, no es así. Ahí abajo te digo por qué.',
  'Todavía no. Revisa la explicación y decide otra vez.',
];

function lineaDeEntrada(idx: number): string {
  if (idx === 3) return TRANSICION_CADUCA;
  if (idx === 7) return TRANSICION_CRUCE;
  const lineas: Record<number, string> = {
    0: 'Ábrelo con calma: fíjate en las manos, en los carteles, en lo que se repite.',
    1: 'No todo necesita sospecha. A veces es sólo una foto de un perro en el jardín.',
    2: 'Última publicación con sólo la imagen disponible. Después la cosa cambia.',
    4: 'Ya puedes ver la cuenta. Ábrela: desde cuándo existe, cuántas publicaciones, si está verificada.',
    5: 'Lee bien lo que dice el propio texto antes de decidir.',
    6: 'Un récord tan grande merece revisarse con calma antes de creerlo.',
    8: 'Aquí es donde más sirve preguntar: ¿alguien más lo está contando?',
    9: 'La última. Usa las tres herramientas si hace falta.',
  };
  return lineas[idx] ?? `Publicación ${idx + 1} de ${TOTAL}.`;
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabRealOGenerado(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [abiertas, setAbiertas] = useState<Set<Herramienta>>(new Set());
  const [malElegido, setMalElegido] = useState<Veredicto | null>(null);
  const [feedback, setFeedback] = useState<{ texto: string; bien: boolean } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [puntajeMostrado, setPuntajeMostrado] = useState(100);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEA_INICIO);
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx, abiertas });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx, abiertas };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    const score = puntaje();
    propsRef.current.onScore(score);
    setPuntajeMostrado(score);
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
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
    setTerminado(true);
  };

  const alternarHerramienta = (h: Herramienta) => {
    if (!herramientasDe(vivo.current.idx).includes(h)) return;
    reproducirTono('select');
    setAbiertas((previas) => {
      const nuevas = new Set(previas);
      if (nuevas.has(h)) nuevas.delete(h);
      else nuevas.add(h);
      return nuevas;
    });
  };

  const elegirVeredicto = (v: Veredicto) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const publicacion = PUBLICACIONES[vivo.current.idx];

    if (v !== publicacion.veredicto) {
      restar();
      setMalElegido(v);
      setFeedback({ texto: publicacion.explicaciones[v], bien: false });
      hablar(NUDGE_MAL[vivo.current.idx % NUDGE_MAL.length]);
      timers.despues(() => setMalElegido(null), 900);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    setFeedback({ texto: publicacion.explicaciones[v], bien: true });
    hablar(NUDGE_BIEN[vivo.current.idx % NUDGE_BIEN.length]);
    const hechos = vivo.current.idx + 1;
    propsRef.current.onProgress(hechos / TOTAL);

    timers.despues(() => {
      sim.current.ocupado = false;
      setFeedback(null);
      setMalElegido(null);
      setAbiertas(new Set());
      if (hechos >= TOTAL) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        return;
      }
      setIdx(hechos);
      const siguienteLinea = lineaDeEntrada(hechos);
      hablar(siguienteLinea);
      if (hechos === 3) {
        setAviso('Nueva herramienta: Ver la cuenta 👤 · Las pistas de imagen caducan');
        timers.despues(() => setAviso(null), 3200);
      } else if (hechos === 7) {
        setAviso('Nueva herramienta: ¿Alguien más lo cuenta? 🌐');
        timers.despues(() => setAviso(null), 3200);
      }
    }, 2200);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setIdx(0);
    setAbiertas(new Set());
    setMalElegido(null);
    setFeedback(null);
    setAviso(null);
    setPuntajeMostrado(100);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEA_INICIO);
  };

  if (terminado) {
    return (
      <div className="rog-sala">
        <div className="rog-final">
          <div className="rog-final-insignia" aria-hidden="true">
            🕵️
          </div>
          <p className="rog-final-nombre">Insignia · Investigador de pantalla</p>
          <h2 className="rog-final-titulo">¡Ya sabes mirar más allá de la imagen!</h2>
          <p className="rog-final-detalle">
            Revisaste diez publicaciones: viste manos raras y letras ilegibles cuando servían, y
            aprendiste que esas pistas caducan. Lo que no caduca es lo que hiciste al final:
            preguntar quién lo publicó, desde cuándo, y si alguien más lo cuenta. Y cuando no
            supiste, lo dijiste — «no estoy segura» — y eso también fue acertar.
          </p>
          <div className="rog-final-resumen">
            <div className="rog-final-dato">
              <span>Publicaciones</span>
              <strong>{TOTAL}</strong>
            </div>
            <div className="rog-final-dato">
              <span>Tiempo</span>
              <strong>{formatTiempo(tiempoFinal)}</strong>
            </div>
            <div className="rog-final-dato">
              <span>Errores</span>
              <strong>{erroresFinal}</strong>
            </div>
          </div>
          <div className="rog-final-botones">
            <button type="button" className="rog-final-boton es-primario" onClick={repetir}>
              Jugar otra vez
            </button>
            {props.alSalir && (
              <button type="button" className="rog-final-boton es-fantasma" onClick={props.alSalir}>
                Volver a la entrada
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const publicacion = PUBLICACIONES[idx];
  const faseActual = fase(idx);
  const herramientas = herramientasDe(idx);
  const acentoStyle = {
    '--acento': publicacion.cuenta.acento.c,
    '--acento-deep': publicacion.cuenta.acento.deep,
  } as CSSProperties;

  return (
    <div className="rog-sala">
      <div className="rog-barra">
        <span className="rog-barra-marca">Tecnia Muro</span>
        <span className="rog-barra-fase">{FASE_LABEL[faseActual]}</span>
        <span className="rog-barra-paso">
          Publicación {idx + 1} de {TOTAL}
        </span>
        <span className="rog-barra-marcador">
          Puntaje <strong>{puntajeMostrado}</strong>
        </span>
        {props.alSalir && (
          <button type="button" className="rog-barra-salir" onClick={props.alSalir}>
            Salir
          </button>
        )}
      </div>

      {aviso && <div className="rog-toast" aria-live="polite">{aviso}</div>}

      <div className="rog-lateral">
        <div className="rog-bit">
          <span className="rog-bit-retrato">
            <Image src={BIT_CARA} alt="" fill sizes="46px" className="object-cover" />
          </span>
          <p className="rog-bit-globo" aria-live="polite">
            <strong>Bit</strong>
            {linea}
          </p>
        </div>

        <div className="rog-objetivo">
          <strong>Tu tarea</strong>
          Usa las herramientas que ya tienes y decide: ¿la compartes, no la compartes, o no estás
          segura?
        </div>

        <div className="rog-herramientas">
          {(['imagen', 'cuenta', 'cruce'] as Herramienta[]).map((h) => {
            const disponible = herramientas.includes(h);
            const meta = TOOL_META[h];
            return (
              <div key={h} className={`rog-herramienta-estado${disponible ? ' es-activa' : ''}`}>
                <span className="rog-herramienta-icono" aria-hidden="true">
                  {meta.emoji}
                </span>
                {meta.etiqueta}
                {!disponible && (
                  <span className="rog-herramienta-candado" aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rog-visor">
        <article className="rog-tarjeta" aria-label={`Publicación de ${publicacion.cuenta.nombre}`}>
          <div className="rog-tarjeta-cabecera">
            <span className="rog-avatar" style={acentoStyle} aria-hidden="true">
              {publicacion.cuenta.inicial}
            </span>
            <div className="rog-cabecera-textos">
              <span className="rog-cabecera-nombre">
                {publicacion.cuenta.nombre}
                {publicacion.cuenta.verificada && (
                  <span className="rog-verificada" title="Cuenta verificada" aria-label="Cuenta verificada">
                    ✔️
                  </span>
                )}
              </span>
              <span className="rog-cabecera-meta">
                {publicacion.cuenta.usuario} · {publicacion.fecha}
              </span>
            </div>
          </div>

          <p className="rog-tarjeta-texto">{publicacion.texto}</p>

          <div className="rog-imagen" style={acentoStyle}>
            <span className="rog-imagen-etiqueta">Marcador de imagen · sin archivo</span>
            <span className="rog-imagen-marco" aria-hidden="true" />
            <span className="rog-imagen-emoji" aria-hidden="true">
              {publicacion.escena.emoji}
            </span>
            <p className="rog-imagen-desc">{publicacion.escena.descripcion}</p>
          </div>

          <div className="rog-acciones">
            {herramientas.map((h) => {
              const meta = TOOL_META[h];
              const abierta = abiertas.has(h);
              return (
                <button
                  key={h}
                  type="button"
                  className={`rog-accion${abierta ? ' es-abierta' : ''}`}
                  onClick={() => alternarHerramienta(h)}
                  aria-pressed={abierta}
                  aria-label={meta.etiqueta}
                >
                  <span aria-hidden="true">{meta.emoji}</span> {meta.etiqueta}
                </button>
              );
            })}
          </div>

          {abiertas.has('imagen') && (
            <div className="rog-panel">
              <p className="rog-panel-titulo">Pistas de la imagen</p>
              {publicacion.pistasImagen.length > 0 ? (
                <ul className="rog-pistas-lista">
                  {publicacion.pistasImagen.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="rog-panel-vacio">{publicacion.notaImagen || 'No se encontraron pistas clásicas en la imagen.'}</p>
              )}
            </div>
          )}

          {abiertas.has('cuenta') && (
            <div className="rog-panel">
              <p className="rog-panel-titulo">La cuenta que publicó</p>
              <div className="rog-cuenta-grid">
                <div className="rog-cuenta-dato">
                  <span>Usuario</span>
                  <strong>{publicacion.cuenta.usuario}</strong>
                </div>
                <div className="rog-cuenta-dato">
                  <span>Cuenta creada</span>
                  <strong>{publicacion.cuenta.creada}</strong>
                </div>
                <div className="rog-cuenta-dato">
                  <span>Publicaciones</span>
                  <strong>{publicacion.cuenta.publicaciones.toLocaleString('es-MX')}</strong>
                </div>
                <div className="rog-cuenta-dato">
                  <span>Verificada</span>
                  <strong>{publicacion.cuenta.verificada ? 'Sí ✔️' : 'No'}</strong>
                </div>
              </div>
            </div>
          )}

          {abiertas.has('cruce') && (
            <div className="rog-panel">
              <p className="rog-panel-titulo">¿Alguien más lo cuenta?</p>
              <p className="rog-panel-vacio" style={{ fontStyle: 'normal', color: '#dfe4ff' }}>
                {publicacion.cruce || 'Nadie más lo menciona todavía.'}
              </p>
            </div>
          )}

          <div className="rog-veredicto">
            {(['compartir', 'no-compartir', 'no-seguro'] as Veredicto[]).map((v) => {
              const meta = VEREDICTO_META[v];
              return (
                <button
                  key={v}
                  type="button"
                  className={`rog-veredicto-boton es-${v}${malElegido === v ? ' es-mal' : ''}`}
                  onClick={() => elegirVeredicto(v)}
                  disabled={feedback?.bien}
                  aria-label={meta.etiqueta}
                >
                  <span aria-hidden="true">{meta.emoji}</span> {meta.etiqueta}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div className={`rog-feedback${feedback.bien ? ' es-bien' : ' es-mal'}`} aria-live="polite">
              {feedback.texto}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

export default LabRealOGenerado;
