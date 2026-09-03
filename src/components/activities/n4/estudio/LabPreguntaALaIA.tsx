'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Check, Send, Sparkles } from 'lucide-react';
import { ConNegritas } from '@/components/ui/ConNegritas';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import { useSfx } from '../../lib/useSfx';
import './LabPreguntaALaIA.css';

/**
 * Laboratorio de N4·U «Aprendo con la IA», parada 1: «Pregunta a la IA».
 *
 * La ventana ES un asistente de IA (regla de la casa: lo que en la vida real
 * es software se construye como software). Cada respuesta está escrita aquí
 * mismo, a mano, en el guion — no hay ninguna llamada a ningún modelo real.
 *
 * La mecánica: la MISMA pregunta, armada de varias maneras, con las
 * respuestas apareciendo una junto a otra en el mismo hilo. El alumno no
 * escribe libremente — elige los trozos («chips») que arman la pregunta,
 * porque lo que se enseña es qué trozo cambia qué, no mecanografía.
 *
 * Ocho rondas, cada una aislando UNA variable a la vez:
 *  1. vaga ↔ específica            5. la respuesta que suena igual de segura
 *  2. el «para qué»                   y está inventada (la lección más importante)
 *  3. el «para quién»              6. «explícamelo» ↔ «escríbemelo»
 *  4. «cuánto de largo»            7. con supervisión: lo que no se cuenta
 *                                   8. cierre: arma tú la mejor versión
 */

interface ChipPregunta {
  id: string;
  /** Texto corto del botón que el alumno pulsa. */
  etiqueta: string;
  /** Pregunta completa que ese chip manda al asistente. */
  pregunta: string;
  /** Respuesta del asistente. Ausente cuando `insegura` es verdadero. */
  respuesta?: string;
  /** El chip cuenta un dato personal: en vez de respuesta, Bit avisa. */
  insegura?: boolean;
  /** Texto del aviso de Bit cuando el chip es inseguro. */
  avisoTexto?: string;
}

interface OpcionReflexion {
  id: string;
  texto: string;
  correcta: boolean;
}

interface Ronda {
  id: string;
  tema: string;
  kicker: string;
  contexto: string;
  chips: ChipPregunta[];
  reflexionPregunta: string;
  opciones: OpcionReflexion[];
  explicacionCorrecta: string;
  explicacionIncorrecta?: string;
  /** Ronda 5: además de la explicación normal, se pinta un panel de alarma. */
  esRondaDeConfianza?: boolean;
}

const AVISO_GENERICO = 'Espera — vuelve a leer las respuestas de arriba antes de contestar.';

const RONDAS: Ronda[] = [
  {
    id: 'vaga-o-especifica',
    tema: 'La Revolución Mexicana',
    kicker: 'Vaga o específica',
    contexto: 'Aquí tienes dos formas de preguntar lo mismo. Pulsa las dos y compara lo que contesta cada una.',
    chips: [
      {
        id: 'vaga',
        etiqueta: 'Pregunta corta',
        pregunta: 'Háblame de la Revolución Mexicana.',
        respuesta: 'La Revolución Mexicana fue un movimiento armado que ocurrió en México a inicios del siglo XX. Hubo varios líderes, muchos cambios sociales y duró varios años. Es uno de los momentos más importantes de la historia del país.',
      },
      {
        id: 'especifica',
        etiqueta: 'Pregunta armada',
        pregunta: 'Explícame en cinco renglones por qué empezó la Revolución Mexicana, para una tarea de la escuela.',
        respuesta: 'Empezó en 1910 porque muchas personas ya no querían que Porfirio Díaz siguiera gobernando después de más de 30 años en el poder. Francisco I. Madero pidió elecciones libres y, cuando no las hubo, llamó a levantarse en armas. Se le unieron campesinos que además querían tierras, como los que seguían a Emiliano Zapata. Por eso el reclamo no fue solo político: también fue por la tierra y por la justicia. Así empezó un movimiento que cambiaría al país por años.',
      },
    ],
    reflexionPregunta: '¿Cuál de las dos podrías usar de verdad en tu tarea?',
    opciones: [
      { id: 'a', texto: 'La pregunta corta: contesta más rápido.', correcta: false },
      { id: 'b', texto: 'La armada: dice para qué la quiero, y por eso responde justo eso.', correcta: true },
    ],
    explicacionCorrecta: 'Exacto. La pregunta corta le dejó adivinar todo al asistente. **La armada le dijo qué tan larga, para qué era y sobre qué** — y contestó justo eso.',
    explicacionIncorrecta: 'Vuelve a leer las dos respuestas: una la puedes pegar tal cual en tu tarea; la otra no dice ni para qué es.',
  },
  {
    id: 'para-que',
    tema: 'Los volcanes',
    kicker: 'El «para qué»',
    contexto: 'Misma pregunta sobre los volcanes, tres veces — cambia solamente el PARA QUÉ la quieres. Pulsa las tres.',
    chips: [
      {
        id: 'resumen',
        etiqueta: 'Para un resumen de tarea',
        pregunta: 'Explícame cómo funciona un volcán, para un resumen de tarea.',
        respuesta: 'Un volcán es una abertura en la corteza terrestre por donde sale roca fundida (magma) desde el interior de la Tierra. Cuando el magma sale a la superficie se llama lava. La presión de los gases atrapados es lo que provoca la erupción. Con esto ya tienes lo esencial para tu resumen.',
      },
      {
        id: 'redes',
        etiqueta: 'Para publicarlo',
        pregunta: 'Explícame cómo funciona un volcán, para publicarlo en mis redes.',
        respuesta: '¡Imagina una olla exprés gigante dentro de la Tierra! 🌋 El magma se cocina ahí abajo, la presión sube y sube… ¡y un día explota buscando salida! Eso es un volcán: la Tierra soltando lo que traía guardado.',
      },
      {
        id: 'examen',
        etiqueta: 'Para el examen de mañana',
        pregunta: 'Explícame cómo funciona un volcán, para memorizarlo para el examen de mañana.',
        respuesta: 'Tres datos para memorizar: 1) Magma = roca fundida bajo tierra. 2) Lava = el magma cuando ya salió. 3) La erupción pasa por la presión de los gases atrapados. Con esos tres puntos contestas la mayoría de las preguntas.',
      },
    ],
    reflexionPregunta: 'Si mañana tienes examen, ¿cuál de las tres te conviene pedir?',
    opciones: [
      { id: 'a', texto: 'La de mis redes: es la más divertida.', correcta: false },
      { id: 'b', texto: 'La del examen: viene en puntos fáciles de repasar.', correcta: true },
    ],
    explicacionCorrecta: 'Así es. Las tres explican lo mismo, pero solo una viene en la forma que sirve para repasar rápido. **Decir para qué la quieres elige la forma de la respuesta.**',
    explicacionIncorrecta: 'Piénsalo otra vez: mañana hay examen, no publicación. ¿Cuál te deja algo para repasar?',
  },
  {
    id: 'para-quien',
    tema: 'El sistema solar',
    kicker: 'El «para quién»',
    contexto: 'Ahora deja fijo el «para qué» — explicarlo — y cambia solo el PARA QUIÉN.',
    chips: [
      {
        id: 'para-mi',
        etiqueta: 'Para mí (9 años)',
        pregunta: 'Explícame el sistema solar, para mí, que tengo 9 años.',
        respuesta: 'El sistema solar es el Sol y todo lo que gira a su alrededor: ocho planetas, entre ellos la Tierra, donde vives. Los planetas más cercanos al Sol son rocosos y pequeños; los más lejanos son enormes bolas de gas. Todo se mantiene girando por la gravedad del Sol, que los jala como un imán gigante.',
      },
      {
        id: 'hermanito',
        etiqueta: 'Para mi hermanito de 5 años',
        pregunta: 'Explícame el sistema solar, para mi hermanito de 5 años.',
        respuesta: '¡El Sol es como una gran lámpara amarilla y calientita! A su alrededor hay ocho planetas dando vueltas, vueltas y vueltas, ¡como en un carrusel! Uno de esos planetas es el nuestro: la Tierra, ¡donde vivimos tú y yo!',
      },
      {
        id: 'abuela',
        etiqueta: 'Para mi abuela',
        pregunta: 'Explícame el sistema solar, para mi abuela, que no usa mucho la computadora.',
        respuesta: 'Imagínese el Sol en el centro, como el foco de una lámpara. A su alrededor giran ocho planetas, cada uno a su propia distancia, igual que las manecillas de un reloj giran alrededor del centro pero a velocidades distintas. La Tierra es el tercer planeta empezando por el Sol.',
      },
    ],
    reflexionPregunta: '¿Cuál de las tres usarías para explicárselo a tu hermanito de 5 años?',
    opciones: [
      { id: 'a', texto: 'La de mi abuela: usa una comparación clara.', correcta: false },
      { id: 'b', texto: 'La de mi hermanito: usa palabras y comparaciones de su tamaño.', correcta: true },
    ],
    explicacionCorrecta: 'Correcto. El tema fue el mismo, con el mismo «para qué». **Lo único que cambió fue para quién — y la respuesta se transformó por completo.**',
    explicacionIncorrecta: 'Piensa en quién la va a escuchar: un niño de 5 años, no tu abuela.',
  },
  {
    id: 'cuanto-de-largo',
    tema: 'Los dinosaurios',
    kicker: '«Cuánto de largo»',
    contexto: 'Ahora prueba el CUÁNTO DE LARGO. Misma pregunta, tres tamaños de respuesta. Pulsa las tres.',
    chips: [
      {
        id: 'palabra',
        etiqueta: 'En una palabra',
        pregunta: 'Dime en una palabra por qué desaparecieron los dinosaurios.',
        respuesta: 'Asteroide.',
      },
      {
        id: 'renglones',
        etiqueta: 'En cinco renglones',
        pregunta: 'Explícame en cinco renglones por qué desaparecieron los dinosaurios.',
        respuesta: 'Hace unos 66 millones de años un asteroide gigante chocó contra la Tierra. El impacto levantó tanto polvo que tapó el Sol durante meses. Sin luz, las plantas dejaron de crecer y se rompió toda la cadena alimenticia. Los dinosaurios grandes no pudieron sobrevivir a esos cambios. Solo quedaron con vida algunos animales pequeños, entre ellos los antepasados de las aves de hoy.',
      },
      {
        id: 'todo',
        etiqueta: 'Todo lo que sepas',
        pregunta: 'Cuéntame todo lo que sepas sobre por qué desaparecieron los dinosaurios.',
        respuesta: 'Hace 66 millones de años, al final del periodo Cretácico, un asteroide de unos 10 kilómetros chocó cerca de lo que hoy es la península de Yucatán, en México. El impacto liberó una energía enorme: provocó incendios, tsunamis y lanzó tanto polvo y azufre a la atmósfera que bloqueó la luz del Sol durante meses. Sin luz solar murieron muchas plantas, y con ellas los animales que se alimentaban de plantas, y luego los que se alimentaban de esos animales. No todos los dinosaurios murieron por la misma causa exacta —también hubo actividad volcánica intensa en esa época—, pero el asteroide es la explicación que la mayoría de los científicos acepta como la causa principal. Algunos dinosaurios pequeños con plumas sí sobrevivieron: son los antepasados de las aves que ves hoy volando.',
      },
    ],
    reflexionPregunta: 'Tienes tres minutos para explicarlo frente al grupo. ¿Qué respuesta te sirve?',
    opciones: [
      { id: 'a', texto: 'La de una palabra: es la más rápida.', correcta: false },
      { id: 'b', texto: 'La de cinco renglones: dice lo importante y cabe en tres minutos.', correcta: true },
    ],
    explicacionCorrecta: 'Así es. «Una palabra» es demasiado poco y «todo lo que sepas» es demasiado. **Pide el tamaño que necesitas, no el que salga.**',
    explicacionIncorrecta: 'Una palabra no te deja explicar nada frente al grupo. Prueba otra vez.',
  },
  {
    id: 'suena-igual-de-segura',
    tema: 'Tu escuela',
    kicker: 'La lección más importante',
    contexto: 'Pregúntale algo que TÚ ya sabes de tu escuela — algo que el asistente jamás podría saber, porque nunca la ha visto. Pulsa las dos.',
    chips: [
      {
        id: 'color',
        etiqueta: '¿De qué color es mi escuela?',
        pregunta: '¿De qué color está pintada la fachada de mi escuela?',
        respuesta: 'Tu escuela está pintada de azul con blanco, con la fachada principal en un tono más claro y los marcos de las ventanas en azul oscuro.',
      },
      {
        id: 'salones',
        etiqueta: '¿Cuántos salones tiene?',
        pregunta: '¿Cuántos salones tiene mi escuela?',
        respuesta: 'Tu escuela tiene dieciocho salones distribuidos en dos edificios, más la biblioteca y el laboratorio de cómputo.',
      },
    ],
    reflexionPregunta: '¿Es cierto lo que contestó?',
    opciones: [
      { id: 'a', texto: 'Sí, sonó muy seguro — debe ser cierto.', correcta: false },
      { id: 'b', texto: 'No lo puede saber: nunca ha visto tu escuela. Se lo inventó.', correcta: true },
    ],
    explicacionCorrecta: 'Ahí está: contestó con un color y un número exactos, sin dudar ni un segundo — **exactamente igual de segura que cuando sí sabía la respuesta**, en las preguntas de antes. Por eso «sonar segura» no sirve para saber si algo es cierto: hay que comprobarlo tú, con lo que tú ya sabes.',
    explicacionIncorrecta: 'Piénsalo bien: ¿de dónde sacaría el asistente el color de TU escuela? Nunca la ha visto.',
    esRondaDeConfianza: true,
  },
  {
    id: 'explica-o-escribe',
    tema: 'Fracciones',
    kicker: 'Entender, no que te lo den hecho',
    contexto: 'Misma tarea de fracciones, pedida de dos formas muy distintas. Pulsa las dos y fíjate en la diferencia.',
    chips: [
      {
        id: 'explicame',
        etiqueta: 'Explícame cómo se hace',
        pregunta: 'Explícame cómo se suman fracciones con distinto denominador.',
        respuesta: 'Para sumar fracciones con distinto denominador primero busca un denominador común: un número que sea múltiplo de los dos denominadores. Después convierte cada fracción a ese denominador nuevo, multiplicando arriba y abajo por el mismo número. Ya con el mismo denominador, solo suma los numeradores y deja el denominador igual. Prueba con 1/2 + 1/3: el denominador común es 6, así que queda 3/6 + 2/6 = 5/6. Ahora inténtalo tú con otro par de fracciones.',
      },
      {
        id: 'escribeme',
        etiqueta: 'Hazme la tarea completa',
        pregunta: 'Escríbeme ya resuelta mi tarea de sumar fracciones con distinto denominador.',
        respuesta: 'Aquí tienes tu tarea resuelta: 1) 1/2 + 1/3 = 5/6. 2) 2/5 + 1/4 = 13/20. 3) 3/4 + 1/6 = 11/12. Copia estos resultados en tu cuaderno.',
      },
    ],
    reflexionPregunta: 'Tu maestra te pide pasar al pizarrón a explicar cómo resolviste el ejercicio 2. ¿Cuál de las dos te deja listo?',
    opciones: [
      { id: 'a', texto: '«Hazme la tarea»: ya tengo el resultado copiado.', correcta: false },
      { id: 'b', texto: '«Explícame cómo»: entendí el paso a paso y lo puedo repetir yo solo.', correcta: true },
    ],
    explicacionCorrecta: 'Justo eso. Pedir que te lo **expliquen** te deja sabiendo hacerlo tú. Pedir que te lo **escriban** te deja con la respuesta… pero sin poder defenderla si alguien te pregunta cómo la sacaste.',
    explicacionIncorrecta: 'Si solo copiaste el resultado, ¿podrías explicar en el pizarrón cómo se saca? Vuelve a pensarlo.',
  },
  {
    id: 'con-supervision',
    tema: 'Invitación de cumpleaños',
    kicker: 'Con supervisión',
    contexto: 'Le vas a pedir ayuda al asistente para una tarjeta de cumpleaños. Pulsa las cuatro formas de pedirlo — dos son seguras y dos cuentan de más.',
    chips: [
      {
        id: 'tema',
        etiqueta: 'El tema que quiero',
        pregunta: 'Ayúdame a escribir una tarjeta de cumpleaños con dinosaurios.',
        respuesta: '¡Claro! Aquí va una idea: «¡Rugido de felicidades! Que este cumpleaños sea tan grande como un T-Rex y tan divertido como una manada completa de dinosaurios. ¡Feliz cumpleaños!» ¿Quieres que la haga más corta o más chistosa?',
      },
      {
        id: 'direccion',
        etiqueta: 'Mi dirección',
        pregunta: 'La fiesta es en Av. Insurgentes 123, Colonia Roma. Escribe eso en la tarjeta.',
        insegura: true,
        avisoTexto: 'Espera — eso es tu dirección exacta. Eso no se le cuenta a un asistente: no sabes dónde queda guardado. Invita sin decir dónde vives; ese dato se da en persona o lo comparte un adulto.',
      },
      {
        id: 'fecha',
        etiqueta: 'El día y la hora',
        pregunta: 'Ayúdame a poner que la fiesta es el sábado a las cuatro de la tarde.',
        respuesta: 'Buena idea. Puedes escribir: «Te espero el sábado a las 4:00 p. m. para celebrar juntos.» Así invitas sin dar más datos de los necesarios.',
      },
      {
        id: 'nombre-escuela',
        etiqueta: 'Mi nombre y mi escuela',
        pregunta: 'Soy Cristofer Esquivel, voy en el salón 4B de la Escuela Miguel Hidalgo. Pon eso en la tarjeta.',
        insegura: true,
        avisoTexto: 'Espera — ahí van tu nombre completo Y tu escuela, juntos. Con eso alguien podría encontrarte. Pídeselo sin ese dato: al asistente no le hace falta saber quién eres para ayudarte.',
      },
    ],
    reflexionPregunta: '¿Qué NO se le cuenta a un asistente de IA?',
    opciones: [
      { id: 'a', texto: 'El tema que quieres, o el día de tu fiesta.', correcta: false },
      { id: 'b', texto: 'Tu dirección, tu nombre completo con tu escuela, o una foto tuya.', correcta: true },
    ],
    explicacionCorrecta: 'Eso es. El tema, la fecha, lo que te gusta: eso sí se puede decir. **Tu dirección, tu nombre completo, tu escuela o una foto: eso no** — porque no sabes dónde queda guardado ni quién más lo puede leer. Por eso siempre con un adulto cerca.',
    explicacionIncorrecta: 'Fíjate en los dos avisos que salieron: ¿qué tenían en común esos dos chips?',
  },
  {
    id: 'cierre',
    tema: 'El reciclaje',
    kicker: 'Arma tú la mejor versión',
    contexto: 'Última pregunta: elige para qué la quieres y qué tan larga, y compara las cuatro combinaciones antes de contestar.',
    chips: [
      {
        id: 'cartel-corta',
        etiqueta: 'Para un cartel · corto',
        pregunta: 'Dame tres frases cortas sobre el reciclaje para un cartel del salón.',
        respuesta: '1) Separar es fácil: papel, plástico y orgánico, cada uno en su bote. 2) Una botella tarda cientos de años en desaparecer: mejor reciclarla. 3) Reciclar hoy es cuidar la escuela de mañana.',
      },
      {
        id: 'cartel-larga',
        etiqueta: 'Para un cartel · con datos',
        pregunta: 'Explícame con datos por qué reciclar en la escuela, para un cartel del salón.',
        respuesta: 'El reciclaje reduce la basura que va a los rellenos sanitarios, que ya están casi llenos en muchas ciudades. Una botella de plástico puede tardar más de 400 años en desaparecer sola. Separar papel, plástico y orgánico en botes distintos hace que ese material se pueda volver a usar en vez de tirarse. Y como cartel, un dato así de fuerte se queda en la memoria.',
      },
      {
        id: 'expo-corta',
        etiqueta: 'Para exponer · un minuto',
        pregunta: 'Dame lo esencial del reciclaje para exponer un minuto frente al grupo.',
        respuesta: 'Reciclar es separar la basura en papel, plástico y orgánico para que se pueda volver a usar en vez de tirarse junta. Eso reduce la basura que llega a los rellenos, que ya están casi llenos. Con separar en tres botes ya estás ayudando.',
      },
      {
        id: 'expo-larga',
        etiqueta: 'Para exponer · cinco minutos',
        pregunta: 'Explícame el reciclaje completo, con ejemplos, para exponer cinco minutos frente al grupo.',
        respuesta: 'Reciclar es separar los materiales que usamos —papel, plástico, vidrio, orgánico— para que, en vez de convertirse en basura mezclada, se puedan transformar en algo nuevo. El papel reciclado se puede volver a convertir en hojas nuevas; las botellas de plástico se derriten y se convierten en fibra para ropa o para otros envases; los restos de comida, si se separan, se pueden convertir en composta para las plantas. El problema es que si todo se tira junto, ya no se puede separar después: por eso el momento de reciclar es antes de tirar, no después. En tu casa y en tu escuela puedes empezar con tres botes: uno para papel y cartón, uno para plástico y metal, y uno para orgánico. Es un cambio pequeño que, si lo hace todo el salón junto, sí se nota.',
      },
    ],
    reflexionPregunta: 'Tu maestra pidió «expón el reciclaje, cinco minutos, frente al grupo». ¿Cuál de las cuatro pediste que sirve?',
    opciones: [
      { id: 'a', texto: '«Para exponer, cinco minutos»: pedí el tema, el uso y el tamaño exactos.', correcta: true },
      { id: 'b', texto: 'Cualquiera: total, todas hablan de reciclaje.', correcta: false },
    ],
    explicacionCorrecta: 'Viste las cuatro: mismo tema, resultados completamente distintos. **Armar la pregunta —para qué, para quién, cuánto de largo— es lo que hace que un asistente te dé algo que sí puedes usar.**',
    explicacionIncorrecta: 'Las cuatro hablan de reciclaje, sí — pero solo una pide exactamente lo que tu maestra encargó.',
  },
];

const TOTAL_RONDAS = RONDAS.length;
const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

type Mensaje =
  | { tipo: 'pregunta'; texto: string }
  | { tipo: 'respuesta'; texto: string }
  | { tipo: 'aviso'; texto: string };

function calcularEstrellas(score: number): 1 | 2 | 3 {
  if (score >= 90) return 3;
  if (score >= 60) return 2;
  return 1;
}

export function LabPreguntaALaIA({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const { play } = useSfx();
  const [rondaIdx, setRondaIdx] = useState(0);
  const [reveladas, setReveladas] = useState<Set<string>>(new Set());
  const [opcionCorrecta, setOpcionCorrecta] = useState<string | null>(null);
  const [opcionFallida, setOpcionFallida] = useState<string | null>(null);
  const [falloEnEstaRonda, setFalloEnEstaRonda] = useState(false);
  const [aciertosPrimerIntento, setAciertosPrimerIntento] = useState(0);
  const [erroresTotales, setErroresTotales] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const inicioRef = useRef<number>(Date.now());

  const ronda = RONDAS[rondaIdx];
  const enCierre = rondaIdx >= TOTAL_RONDAS;
  const todasReveladas = !enCierre && ronda.chips.every((c) => reveladas.has(c.id));

  const score = useMemo(
    () => Math.round((aciertosPrimerIntento / TOTAL_RONDAS) * 100),
    [aciertosPrimerIntento],
  );

  useEffect(() => {
    const avance = enCierre ? 1 : rondaIdx / TOTAL_RONDAS;
    onProgress(avance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rondaIdx, enCierre]);

  useEffect(() => {
    onScore(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const mensajes: Mensaje[] = useMemo(() => {
    if (enCierre) return [];
    const lista: Mensaje[] = [];
    for (const chip of ronda.chips) {
      if (!reveladas.has(chip.id)) continue;
      lista.push({ tipo: 'pregunta', texto: chip.pregunta });
      if (chip.insegura) {
        lista.push({ tipo: 'aviso', texto: chip.avisoTexto ?? AVISO_GENERICO });
      } else {
        lista.push({ tipo: 'respuesta', texto: chip.respuesta ?? '' });
      }
    }
    return lista;
  }, [ronda, reveladas, enCierre]);

  const revelarChip = useCallback((chipId: string) => {
    setReveladas((prev) => {
      if (prev.has(chipId)) return prev;
      const next = new Set(prev);
      next.add(chipId);
      return next;
    });
    play('pop');
  }, [play]);

  const elegirOpcion = useCallback((opcionId: string) => {
    if (opcionCorrecta) return;
    const opcion = ronda.opciones.find((o) => o.id === opcionId);
    if (!opcion) return;
    if (opcion.correcta) {
      play('ok');
      setOpcionCorrecta(opcionId);
      setOpcionFallida(null);
      if (!falloEnEstaRonda) setAciertosPrimerIntento((n) => n + 1);
    } else {
      play('error');
      setOpcionFallida(opcionId);
      setFalloEnEstaRonda(true);
      setErroresTotales((n) => n + 1);
    }
  }, [opcionCorrecta, ronda, falloEnEstaRonda, play]);

  const siguienteRonda = useCallback(() => {
    play('pop');
    if (rondaIdx + 1 >= TOTAL_RONDAS) {
      setRondaIdx(TOTAL_RONDAS);
    } else {
      setRondaIdx((i) => i + 1);
      setReveladas(new Set());
      setOpcionCorrecta(null);
      setOpcionFallida(null);
      setFalloEnEstaRonda(false);
    }
  }, [rondaIdx, play]);

  const terminar = useCallback(() => {
    play('win');
    setTerminado(true);
    const resultado: ActivityResult = {
      score,
      stars: calcularEstrellas(score),
      xp: 130,
      errores: erroresTotales,
      tiempoSegundos: Math.round((Date.now() - inicioRef.current) / 1000),
    };
    onComplete(resultado);
  }, [play, score, erroresTotales, onComplete]);

  return (
    <div className="pia-lienzo">
      <header className="pia-barra">
        <button type="button" className="pia-salir" onClick={() => alSalir?.()} aria-label="Salir del laboratorio">
          <ArrowLeft className="w-4 h-4" strokeWidth={3} /> Salir
        </button>
        <span className="pia-barra-titulo">Tecnia Asistente</span>
        {!enCierre && (
          <span className="pia-progreso" data-testid="pia-progreso">
            Pregunta {rondaIdx + 1} de {TOTAL_RONDAS}
          </span>
        )}
      </header>

      {!enCierre && (
        <div className="pia-cuerpo" data-ronda={ronda.id}>
          <div className="pia-bit">
            <span className="pia-bit-retrato">
              <Image src={BIT_CARA} alt="Bit" fill sizes="56px" className="object-cover" />
            </span>
            <div className="pia-bit-globo">
              <span className="pia-bit-kicker">{ronda.kicker}</span>
              <p>{ronda.contexto}</p>
            </div>
          </div>

          <div className="pia-ventana">
            <div className="pia-ventana-barra">
              <span className="pia-ventana-avatar" aria-hidden="true"><Sparkles className="w-4 h-4" /></span>
              <span className="pia-ventana-nombre">Asistente de IA</span>
              <span className="pia-ventana-tema">{ronda.tema}</span>
            </div>

            <div className="pia-hilo" data-testid="pia-hilo">
              {mensajes.length === 0 && (
                <p className="pia-hilo-vacio">Elige abajo cómo quieres preguntar.</p>
              )}
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.tipo === 'pregunta' ? 'pia-msg pia-msg-tu' :
                    m.tipo === 'aviso' ? 'pia-msg pia-msg-aviso' : 'pia-msg pia-msg-ia'
                  }
                  data-testid={m.tipo === 'aviso' ? 'pia-aviso' : undefined}
                >
                  {m.texto}
                </div>
              ))}
            </div>

            <div className="pia-compone">
              <p className="pia-compone-titulo">Elige cómo preguntar:</p>
              <div className="pia-chips">
                {ronda.chips.map((chip) => {
                  const revelado = reveladas.has(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className={`pia-chip${revelado ? ' revelado' : ''}`}
                      onClick={() => revelarChip(chip.id)}
                      disabled={revelado}
                      data-chip={chip.id}
                    >
                      {revelado && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      {chip.etiqueta}
                      {!revelado && <Send className="w-3.5 h-3.5 pia-chip-enviar" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {todasReveladas && (
            <div className="pia-reflexion">
              <p className="pia-reflexion-pregunta">{ronda.reflexionPregunta}</p>
              <div className="pia-reflexion-opciones">
                {ronda.opciones.map((op) => {
                  const esElegidaCorrecta = opcionCorrecta === op.id;
                  const esElegidaFallida = opcionFallida === op.id && !opcionCorrecta;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      className={
                        'pia-reflexion-opcion' +
                        (esElegidaCorrecta ? ' correcta' : '') +
                        (esElegidaFallida ? ' fallida' : '')
                      }
                      onClick={() => elegirOpcion(op.id)}
                      disabled={Boolean(opcionCorrecta)}
                      data-opcion={op.id}
                    >
                      {op.texto}
                    </button>
                  );
                })}
              </div>

              {opcionFallida && !opcionCorrecta && (
                <p className="pia-reflexion-feedback fallida">
                  {ronda.explicacionIncorrecta ?? AVISO_GENERICO}
                </p>
              )}

              {opcionCorrecta && (
                <>
                  <p className="pia-reflexion-feedback correcta">
                    <ConNegritas texto={ronda.explicacionCorrecta} />
                  </p>
                  {ronda.esRondaDeConfianza && (
                    <p className="pia-revelacion" data-testid="pia-revelacion">
                      🚩 Recuerda esto: el asistente puede sonar seguro y estar equivocado. Siempre comprueba con lo que tú ya sabes.
                    </p>
                  )}
                  <button type="button" className="pia-siguiente" onClick={siguienteRonda} data-testid="pia-siguiente">
                    {rondaIdx + 1 >= TOTAL_RONDAS ? 'Ver el cierre' : 'Siguiente pregunta'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {enCierre && (
        <div className="pia-cierre">
          <span className="pia-cierre-icono" aria-hidden="true">🏅</span>
          <h2 className="pia-cierre-titulo">Insignia de Detective de la IA</h2>
          <p className="pia-cierre-texto">
            Ocho preguntas, ocho formas distintas de contestar. Encontraste la que suena
            segura y está mal, y aprendiste a armar la pregunta que sí te sirve.
          </p>
          <p className="pia-cierre-score">Puntaje: {score}</p>
          {!terminado ? (
            <button type="button" className="pia-terminar" onClick={terminar} data-testid="pia-terminar">
              Terminar
            </button>
          ) : (
            <button type="button" className="pia-terminar" onClick={() => alSalir?.()} data-testid="pia-volver">
              Volver
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default LabPreguntaALaIA;
