'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { type EstadoPuesto } from './estudioN4';
import {
  MostradorAlta3D,
  type DatoDelator,
  type FaseCuenta,
  type FichaCharola,
  type RespuestaSobre,
  type SobreVista,
  type TeclaBotonera,
} from './piezasN4U2';

/**
 * N4·U2 parada 1 · «Mi primera cuenta (supervisada)» (documento §24.1).
 *
 * Un solo mueble —el mostrador de altas— y tres fases que escalan sin cambiar
 * de escenario, precedidas de un gesto de apertura que es en sí el primer
 * contenido de la parada:
 *
 *   0 · EL GESTO — colgar el gafete del adulto. Mientras el gancho esté vacío
 *       el mostrador está dormido: tocarlo da un tope seco y la línea 9. NO
 *       resta puntos, porque no es un error: es la regla. Una cuenta de un niño
 *       no se abre sola, y eso no se dice, se hace.
 *   1 · RECONOCER — cuatro tarjetas de nombre de usuario. Por cada una, el
 *       alumno dice SIRVE o NO SIRVE; y cuando dice NO SIRVE tiene que señalar
 *       *cuál* dato la delata. Reconocer que algo huele mal es la mitad; saber
 *       qué exactamente es lo que se lleva a la vida.
 *   2 · APLICAR — siete ingredientes, uno a uno, con predicción antes de meter:
 *       ¿el medidor SUBE o BAJA? Cuatro suben y encienden los cuatro segmentos;
 *       tres bajan y la forja los escupe. El sexto es el propio nombre de
 *       usuario que el alumno acaba de encajar arriba: la línea que más enseña.
 *   3 · DIAGNOSTICAR — cuatro sobres del buzón y tres respuestas posibles. No
 *       es «di que no a todo»: al compañero que pide el usuario SÍ se le da,
 *       porque el usuario es público; y al adulto que abrió la cuenta también.
 *
 * PRIVACIDAD (regla dura de §24): el alumno no teclea ni un carácter propio. Los
 * nombres, domicilios, escuelas y mensajes son constantes ficticias fijas, y la
 * credencial que se rellena es la de Sofi, no la suya.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso 60).
 */

/** Las 24 líneas de Bit del documento §24.1, palabra por palabra. */
const LINEAS = {
  // 1–7 · el guion original de la parada, intacto.
  inicio: 'Vas a abrir tu primera cuenta… pero nunca solo: siempre con un adulto. ¿Empezamos?',
  usuarioBien: '¡Ese usuario está perfecto! No dice dónde vives ni cómo te apellidas.',
  usuarioSucio: 'Ese lleva un dato personal. Mejor busca uno que no diga quién eres.',
  masLarga: 'Más larga… ¡así! Cuanto más larga, más difícil de adivinar.',
  numerosSimbolo: 'Números y un símbolo. Ahora sí es una llave de verdad.',
  noSePresta: 'Tu contraseña no se le presta a nadie. A nadie de nadie.',
  fin: '¡Cuenta lista! Y bien protegida. Guarda esa llave.',
  // 8–9 · el gesto de apertura.
  cuelgaGafete: 'Primero cuelga el gafete del adulto. Sin él, este mostrador no abre.',
  todaviaNo: 'Todavía no. Cuelga el gafete del adulto y volvemos a empezar.',
  // 10–14 · la fase del nombre de usuario.
  queDato: 'Ahora dime qué dato lo delata. Ahí está lo importante.',
  esApellido: 'Exacto: ese es el apellido. Con eso ya saben cómo te llamas de verdad.',
  esDomicilio: 'Ahí está: la calle y el número. Eso dice dónde vives.',
  esEscuela: 'Correcto: la escuela y el salón. Con eso te encuentran en persona.',
  datoMal: 'Ese no es el dato que lo delata. Vuelve a leerlo despacio.',
  // 15–19 · la forja de la contraseña.
  predice: 'Antes de meterlo: ¿el medidor sube o baja? Tú decide.',
  prediccionBien: 'Lo dijiste antes de verlo. Eso es entender, no adivinar.',
  mezclaTamanos: 'Mezclar tamaños multiplica las combinaciones. Nadie las prueba todas.',
  baja: 'Baja. Cualquiera que te conozca sabe eso de ti.',
  bajaUsuario:
    'Ese es tu nombre de usuario… y está escrito en tu credencial, a la vista. No sirve de llave.',
  cuatroSegmentos:
    'Cuatro segmentos. Y no tuviste que anotarla en ningún papel: te acuerdas de la frase.',
  // 20–24 · el buzón.
  llegoSobre: 'Llegó un sobre. Léelo y decide: se lo das, no se lo das, o sólo con tu adulto.',
  sobreUsuario: 'Tu usuario sí. Para eso existe: para que te encuentren.',
  sobreAmigo: 'Ni al mejor amigo. Si quiere ver tu dibujo, se lo enseñas tú desde tu cuenta.',
  sobreMensaje: 'Nadie pide contraseñas por mensaje. Ese sobre se lo enseñas a tu adulto.',
  sobreAdulto:
    'Ése sí, y es el único: el adulto que abrió la cuenta contigo ya la sabía desde el principio.',
  // Ayuda incorporada: tocar un aparato hace que Bit recuerde para qué sirve.
  tocarMedidor:
    'Cuatro cosas hacen fuerte una contraseña: que sea larga, que mezcle mayúsculas y minúsculas, que lleve números y que lleve un símbolo.',
};

/* ── fase 1 · las cuatro tarjetas ────────────────────────────────────────────
   Tres sucias y una limpia, y la limpia va al final: si la buena saliera
   primero el alumno se llevaría «casi cualquiera sirve». Los datos son de Sofi,
   una alumna inventada; el alumno no escribe nada suyo en toda la parada. */

interface CandidatoUsuario {
  id: string;
  /** El nombre de usuario tal cual se lee en la tarjeta. */
  texto: string;
  sirve: boolean;
  /** Qué dato lo delata, o `null` si está limpio. */
  dato: DatoDelator | null;
  /** Lo que Bit dice cuando el alumno señala bien el dato (o acepta la limpia). */
  linea: string;
}

const CANDIDATOS: CandidatoUsuario[] = [
  {
    id: 'apellidos',
    texto: 'sofia.ramirez.lopez2016',
    sirve: false,
    dato: 'apellido',
    linea: LINEAS.esApellido,
  },
  {
    id: 'calle',
    texto: 'sofi.calle.pinos.14',
    sirve: false,
    dato: 'domicilio',
    linea: LINEAS.esDomicilio,
  },
  {
    id: 'escuela',
    texto: 'sofi.primaria.tecnia.4b',
    sirve: false,
    dato: 'escuela',
    linea: LINEAS.esEscuela,
  },
  {
    id: 'buena',
    texto: 'sofi.aprendiz',
    sirve: true,
    dato: null,
    linea: LINEAS.usuarioBien,
  },
];

/** Las tres chapas del lector. Nombran el dato, no lo repiten. */
const DATOS: { id: DatoDelator; etiqueta: string }[] = [
  { id: 'apellido', etiqueta: 'Mi apellido' },
  { id: 'domicilio', etiqueta: 'Dónde vivo' },
  { id: 'escuela', etiqueta: 'Mi escuela y mi salón' },
];

/* ── fase 2 · los siete ingredientes ─────────────────────────────────────────
   Van intercalados sube/baja para que el ritmo no se vuelva un patrón («van
   cuatro buenos, ahora tocan los malos»), la trampa que más enseña —el propio
   nombre de usuario— cae en la sexta posición, cuando el alumno ya se confió, y
   la serie cierra con la que enciende el cuarto segmento.

   Las frases son las del documento §24.1 sin tocar una coma, con un único
   traslado: la línea 5 («Números y un símbolo…») nombra dos ingredientes, así
   que suena en el símbolo —el segundo de los dos— y no en los números, porque
   dicha sobre los números sería literalmente falsa: el símbolo aún no está. */

interface Ingrediente {
  id: string;
  emoji: string;
  texto: string;
  /** true = enciende un segmento; false = la forja lo escupe. */
  sube: boolean;
  /** Lo que se lee en el letrero de ronda al comprobarlo. */
  aviso: string;
  /** La línea de Bit, o `null` cuando el letrero ya lo dice todo. */
  linea: string | null;
}

const INGREDIENTES: Ingrediente[] = [
  {
    id: 'larga',
    emoji: '📏',
    texto: 'Que sea larga: más de 8 letras',
    sube: true,
    aviso: 'SUBE · más de 8 caracteres',
    linea: LINEAS.masLarga,
  },
  {
    id: 'cumple',
    emoji: '🎂',
    texto: 'Mi fecha de cumpleaños',
    sube: false,
    aviso: 'BAJA · tu cumpleaños lo sabe medio salón',
    linea: LINEAS.baja,
  },
  {
    id: 'mezcla',
    emoji: '🔠',
    texto: 'Mayúsculas y minúsculas mezcladas',
    sube: true,
    aviso: 'SUBE · mezclar tamaños multiplica las combinaciones',
    linea: LINEAS.mezclaTamanos,
  },
  {
    id: 'mascota',
    emoji: '🐶',
    texto: 'El nombre de mi mascota',
    sube: false,
    aviso: 'BAJA · tu mascota sale en todas tus fotos',
    linea: LINEAS.baja,
  },
  {
    id: 'numeros',
    emoji: '🔢',
    texto: 'Unos números en medio',
    sube: true,
    aviso: 'SUBE · números',
    linea: null,
  },
  {
    id: 'usuario',
    emoji: '🪪',
    texto: 'Mi nombre de usuario otra vez',
    sube: false,
    aviso: 'BAJA · tu usuario está escrito ahí arriba',
    linea: LINEAS.bajaUsuario,
  },
  {
    id: 'simbolo',
    emoji: '❗',
    texto: 'Un símbolo, como !',
    sube: true,
    aviso: 'SUBE · un símbolo',
    linea: LINEAS.numerosSimbolo,
  },
];

/** La contraseña que queda forjada, enmascarada como la vería el alumno. */
const CONTRASENA_VISIBLE = 'Mpd•••2026!';
/** La regla mnemotécnica que Bit destapa al cerrar la fase 2. */
const CONTRASENA_FRASE = 'Mi perro duerme en la cocina · 2026 · !';

/* ── fase 3 · los cuatro sobres ──────────────────────────────────────────────
   Dos «no», un «sí» y un «sólo con mi adulto»: si todos fueran «no», el alumno
   aprendería a decir que no sin entender qué está protegiendo. El tercero es la
   semilla del phishing que se trabaja en N6. */

interface Sobre extends SobreVista {
  correcta: RespuestaSobre;
  linea: string;
  /** Lo que aparece en el letrero cuando la respuesta no es la que toca. */
  ayuda: string;
}

const SOBRES: Sobre[] = [
  {
    id: 'companero',
    emoji: '🧒',
    dequien: 'Un compañero de tu salón',
    mensaje: '¿Cuál es tu nombre de usuario? Te quiero mandar mi dibujo.',
    correcta: 'doy',
    linea: LINEAS.sobreUsuario,
    ayuda: 'El usuario es público: para eso existe. Ahí no hay nada que esconder.',
  },
  {
    id: 'amigo',
    emoji: '🧑',
    dequien: 'Tu mejor amigo',
    mensaje: 'Somos mejores amigos, ¿me dices tu contraseña? Nada más quiero ver tus dibujos.',
    correcta: 'no-doy',
    linea: LINEAS.sobreAmigo,
    ayuda: 'Es tu contraseña. Ésa no se presta, ni al mejor amigo.',
  },
  {
    id: 'mensaje',
    emoji: '📩',
    dequien: 'Un mensaje que dice ser de tu maestra',
    mensaje: 'Soy tu maestra. Mándame tu usuario y tu contraseña para revisar tu tarea.',
    correcta: 'no-doy',
    linea: LINEAS.sobreMensaje,
    ayuda: 'Un mensaje no es una persona. Nadie pide contraseñas por mensaje.',
  },
  {
    id: 'adulto',
    emoji: '🧑‍🏫',
    dequien: 'El adulto que abrió la cuenta contigo',
    mensaje: 'Compramos una tablet nueva. Vamos a entrar juntos a tu cuenta: necesito la contraseña.',
    correcta: 'adulto',
    linea: LINEAS.sobreAdulto,
    ayuda: 'Es el adulto que abrió la cuenta contigo. Con él sí, y es el único.',
  },
];

/** El encargo de cada fase, en la placa del riel. */
const ROTULOS: Record<FaseCuenta, { n: string; texto: string }> = {
  gafete: { n: '1', texto: 'Cuelga el gafete del adulto en su gancho.' },
  usuario: { n: '2', texto: 'Pasa cada tarjeta por el lector y di si sirve de nombre de usuario.' },
  forja: { n: '3', texto: 'Predice si el medidor sube o baja, y después mete la ficha.' },
  buzon: { n: '4', texto: 'Llegan cuatro sobres. Decide qué haces con cada uno.' },
  fin: { n: '4', texto: 'Cuenta abierta, y bien protegida.' },
};

/** 1 gesto + (4 veredictos + 3 datos) + 7 ingredientes + 4 sobres. */
const TOTAL_PASOS = 1 + 7 + INGREDIENTES.length + SOBRES.length;

/** Lo que dura el medidor en rojo. Medido en la parada anterior: por debajo de
    900 ms el rojo no alcanza a leerse mientras Bit explica por qué baja. */
const MS_ROJO = 900;

const TECLAS_USUARIO: TeclaBotonera[] = [
  { id: 'sirve', etiqueta: 'SIRVE', tono: 'verde' },
  { id: 'no-sirve', etiqueta: 'NO SIRVE', tono: 'rojo' },
];

const TECLAS_FORJA: TeclaBotonera[] = [
  { id: 'sube', etiqueta: 'SUBE ▲', tono: 'verde' },
  { id: 'baja', etiqueta: 'BAJA ▼', tono: 'rojo' },
];

const TECLAS_BUZON: TeclaBotonera[] = [
  { id: 'doy', etiqueta: 'Se lo doy', tono: 'cian' },
  { id: 'no-doy', etiqueta: 'No se lo doy', tono: 'rojo' },
  { id: 'adulto', etiqueta: 'Sólo con mi adulto', tono: 'ambar' },
];

export function LabMiPrimeraCuenta(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<FaseCuenta>('gafete');
  const [gafeteColgado, setGafeteColgado] = useState(false);
  const [indiceTarjeta, setIndiceTarjeta] = useState(0);
  const [enLector, setEnLector] = useState(false);
  const [pidiendoDato, setPidiendoDato] = useState(false);
  const [chapaMal, setChapaMal] = useState<DatoDelator | null>(null);
  const [chapaOk, setChapaOk] = useState<DatoDelator | null>(null);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [indiceIngrediente, setIndiceIngrediente] = useState(0);
  const [prediccion, setPrediccion] = useState<'sube' | 'baja' | null>(null);
  const [segmentos, setSegmentos] = useState(0);
  const [bajando, setBajando] = useState(false);
  const [contrasena, setContrasena] = useState<string | null>(null);
  const [indiceSobre, setIndiceSobre] = useState(0);
  const [pasos, setPasos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.cuelgaGafete);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, dijo16: false });
  const propsRef = useRef(props);
  const vivo = useRef({
    terminado,
    fase,
    indiceTarjeta,
    enLector,
    pidiendoDato,
    indiceIngrediente,
    prediccion,
    segmentos,
    indiceSobre,
    pasos,
  });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = {
      terminado,
      fase,
      indiceTarjeta,
      enLector,
      pidiendoDato,
      indiceIngrediente,
      prediccion,
      segmentos,
      indiceSobre,
      pasos,
    };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Un paso resuelto: avanza la barra de la sala sin tocar el puntaje. */
  const avanzar = () => {
    const hechos = vivo.current.pasos + 1;
    setPasos(hechos);
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
    return hechos;
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
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

  /* ── fase 0 · el gesto de apertura ─────────────────────────────────────── */

  /* Tocar el mostrador antes de tiempo NO resta: no es un error del alumno, es
     la regla de la parada haciéndose notar. Lo que se lleva es el tope. */
  const tocarDormido = () => {
    if (vivo.current.terminado || vivo.current.fase !== 'gafete') return;
    reproducirTono('select');
    hablar(LINEAS.todaviaNo);
    setAviso('El mostrador no abre sin el adulto');
  };

  const colgarGafete = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'gafete') return;
    if (id !== 'gafete-adulto') return;
    sim.current.ocupado = true;
    reproducirTono('power');
    setGafeteColgado(true);
    setAviso('Adulto presente · el mostrador abre');
    hablar(LINEAS.inicio);
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      setFase('usuario');
    }, 1600);
  };

  /* ── fase 1 · reconocer el nombre de usuario ───────────────────────────── */

  const pasarTarjeta = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'usuario') return;
    if (vivo.current.enLector) return;
    const tarjeta = CANDIDATOS[vivo.current.indiceTarjeta];
    if (!tarjeta || tarjeta.id !== id) return;
    reproducirTono('select');
    setEnLector(true);
    setAviso(null);
  };

  const siguienteTarjeta = () => {
    const siguiente = vivo.current.indiceTarjeta + 1;
    setIndiceTarjeta(siguiente);
    setEnLector(false);
    setPidiendoDato(false);
    setChapaOk(null);
    setChapaMal(null);
  };

  const veredictoTarjeta = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'usuario') return;
    if (!vivo.current.enLector || vivo.current.pidiendoDato) return;
    const tarjeta = CANDIDATOS[vivo.current.indiceTarjeta];
    if (!tarjeta) return;
    const dijoSirve = id === 'sirve';

    if (dijoSirve && tarjeta.sirve) {
      sim.current.ocupado = true;
      reproducirTono('power');
      hablar(tarjeta.linea);
      setUsuario(tarjeta.texto);
      setAviso('Usuario encajado en la credencial');
      avanzar();
      timers.despues(() => {
        sim.current.ocupado = false;
        setEnLector(false);
        setAviso(null);
        setFase('forja');
        hablar(LINEAS.predice);
      }, 2200);
      return;
    }

    if (!dijoSirve && !tarjeta.sirve) {
      reproducirTono('correct');
      hablar(LINEAS.queDato);
      setPidiendoDato(true);
      setAviso(null);
      avanzar();
      return;
    }

    restar();
    if (dijoSirve) {
      // Declaró buena una sucia: la línea 3 nombra exactamente el fallo.
      hablar(LINEAS.usuarioSucio);
      setAviso('Léela otra vez: ahí hay un dato tuyo');
    } else {
      // Declaró sucia la limpia. No hay línea del guion para esto, y no la
      // inventamos: el letrero dice por qué, que es lo que hace falta.
      setAviso('Ésa no dice tu apellido, ni dónde vives, ni tu escuela');
    }
  };

  const elegirDato = (dato: DatoDelator) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'usuario') return;
    if (!vivo.current.pidiendoDato) return;
    const tarjeta = CANDIDATOS[vivo.current.indiceTarjeta];
    if (!tarjeta) return;

    if (dato !== tarjeta.dato) {
      restar();
      hablar(LINEAS.datoMal);
      setChapaMal(dato);
      timers.despues(() => setChapaMal(null), MS_ROJO);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    hablar(tarjeta.linea);
    setChapaOk(dato);
    setChapaMal(null);
    avanzar();
    timers.despues(() => {
      sim.current.ocupado = false;
      siguienteTarjeta();
    }, 2400);
  };

  /* ── fase 2 · forjar la contraseña ─────────────────────────────────────── */

  const predecir = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'forja') return;
    if (vivo.current.prediccion !== null) return;
    const ing = INGREDIENTES[vivo.current.indiceIngrediente];
    if (!ing) return;
    const acerto = (id === 'sube') === ing.sube;
    setPrediccion(id === 'sube' ? 'sube' : 'baja');

    if (acerto) {
      reproducirTono('correct');
      if (sim.current.dijo16) {
        setAviso('Lo dijiste antes de verlo');
      } else {
        sim.current.dijo16 = true;
        hablar(LINEAS.prediccionBien);
        setAviso(null);
      }
    } else {
      restar();
      setAviso('No era eso. Mételo y míralo');
    }
  };

  const meterIngrediente = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'forja') return;
    const ing = INGREDIENTES[vivo.current.indiceIngrediente];
    if (!ing || ing.id !== id) return;
    if (vivo.current.prediccion === null) {
      setAviso('Primero predice: ¿sube o baja?');
      return;
    }
    sim.current.ocupado = true;
    setAviso(ing.aviso);
    if (ing.linea) hablar(ing.linea);

    const ultimo = vivo.current.indiceIngrediente + 1 >= INGREDIENTES.length;

    if (ing.sube) {
      reproducirTono('power');
      const nuevos = vivo.current.segmentos + 1;
      setSegmentos(nuevos);
      if (nuevos >= 4) setContrasena(CONTRASENA_VISIBLE);
    } else {
      // La contraseña no «pierde» lo que ya ganó: el medidor se pone rojo
      // entero y la forja escupe la ficha. El BAJA se ve, y lo que queda es
      // que ese ingrediente no habría servido de llave.
      reproducirTono('error');
      setBajando(true);
      timers.despues(() => setBajando(false), MS_ROJO);
    }

    avanzar();

    timers.despues(
      () => {
        sim.current.ocupado = false;
        setPrediccion(null);
        setAviso(null);
        setIndiceIngrediente(vivo.current.indiceIngrediente + 1);
        if (ultimo) cerrarForja();
      },
      ing.sube ? 1700 : MS_ROJO + 1400,
    );
  };

  /** El cierre de la fase 2: la llave impresa, la frase destapada y el buzón. */
  const cerrarForja = () => {
    sim.current.ocupado = true;
    timers.despues(() => {
      hablar(LINEAS.cuatroSegmentos);
      setAviso('Llave forjada · Mpd•••2026!');
    }, 1200);
    timers.despues(() => {
      sim.current.ocupado = false;
      setAviso(null);
      setFase('buzon');
      hablar(LINEAS.noSePresta);
    }, 6200);
    timers.despues(() => hablar(LINEAS.llegoSobre), 10600);
  };

  /* ── fase 3 · el buzón ─────────────────────────────────────────────────── */

  const responderSobre = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'buzon') return;
    const sobre = SOBRES[vivo.current.indiceSobre];
    if (!sobre) return;

    if (id !== sobre.correcta) {
      restar();
      setAviso(sobre.ayuda);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    hablar(sobre.linea);
    setAviso(null);
    avanzar();
    const ultimo = vivo.current.indiceSobre + 1 >= SOBRES.length;
    timers.despues(
      () => {
        sim.current.ocupado = false;
        if (ultimo) {
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        } else {
          setIndiceSobre(vivo.current.indiceSobre + 1);
        }
      },
      ultimo ? 3200 : 3000,
    );
  };

  /* ── la botonera: un solo mando que se rerotula ────────────────────────── */

  const pulsarTecla = (id: string) => {
    if (vivo.current.fase === 'usuario') veredictoTarjeta(id);
    else if (vivo.current.fase === 'forja') predecir(id);
    else if (vivo.current.fase === 'buzon') responderSobre(id);
  };

  /** La charola ofrece una sola pieza, y usarla es un clic o un arrastre. */
  const usarFicha = (id: string) => {
    if (vivo.current.fase === 'gafete') colgarGafete(id);
    else if (vivo.current.fase === 'usuario') pasarTarjeta(id);
    else if (vivo.current.fase === 'forja') meterIngrediente(id);
  };

  const tocarMedidor = () => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    hablar(LINEAS.tocarMedidor);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now(), dijo16: false };
    setFase('gafete');
    setGafeteColgado(false);
    setIndiceTarjeta(0);
    setEnLector(false);
    setPidiendoDato(false);
    setChapaMal(null);
    setChapaOk(null);
    setUsuario(null);
    setIndiceIngrediente(0);
    setPrediccion(null);
    setSegmentos(0);
    setBajando(false);
    setContrasena(null);
    setIndiceSobre(0);
    setPasos(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.cuelgaGafete);
  };

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  /* ── lo que ve la sala ─────────────────────────────────────────────────── */

  const tarjeta = CANDIDATOS[indiceTarjeta] ?? null;
  const ingrediente = INGREDIENTES[indiceIngrediente] ?? null;
  const sobre = fase === 'buzon' ? (SOBRES[indiceSobre] ?? null) : null;

  /* Una pieza cada vez: el gafete, la tarjeta de turno o el ingrediente de
     turno. En la fase 2 la ficha nace bloqueada y sólo se arma cuando el alumno
     ya se mojó con la predicción; ése es el «predecir antes de meter». */
  let ficha: FichaCharola | null = null;
  if (fase === 'gafete' && !gafeteColgado) {
    ficha = {
      id: 'gafete-adulto',
      emoji: '🧑‍🏫',
      texto: 'Gafete del adulto',
      pie: 'Cuélgalo en el gancho de la izquierda',
    };
  } else if (fase === 'usuario' && tarjeta && !enLector) {
    ficha = {
      id: tarjeta.id,
      emoji: '🪪',
      texto: tarjeta.texto,
      pie: 'Pásala por el lector',
    };
  } else if (fase === 'forja' && ingrediente) {
    ficha = {
      id: ingrediente.id,
      emoji: ingrediente.emoji,
      texto: ingrediente.texto,
      pie: prediccion ? 'Métela en la credencial' : 'Primero predice: ¿sube o baja?',
      bloqueada: prediccion === null,
    };
  }

  const estadoLector: EstadoPuesto = pidiendoDato ? 'mal' : enLector ? 'listo' : 'espera';

  const teclas: TeclaBotonera[] =
    fase === 'usuario'
      ? enLector && !pidiendoDato
        ? TECLAS_USUARIO
        : []
      : fase === 'forja'
        ? ingrediente && prediccion === null
          ? TECLAS_FORJA
          : []
        : fase === 'buzon' && sobre
          ? TECLAS_BUZON
          : [];

  const rotulo = (
    <div className="alta3d-rotulo">
      <span className="alta3d-rotulo-n">{ROTULOS[fase].n}</span>
      <p className="alta3d-rotulo-txt">{ROTULOS[fase].texto}</p>
    </div>
  );

  const panelLector = (
    <>
      <p className="alta3d-lector-tit">Lector de tarjetas</p>
      {enLector && tarjeta ? (
        <p className="alta3d-lector-tarjeta">{tarjeta.texto}</p>
      ) : (
        <p className="alta3d-lector-vacio">Ranura vacía</p>
      )}
      {pidiendoDato ? (
        <>
          <p className="alta3d-lector-pregunta">¿Qué dato lo delata?</p>
          <div className="alta3d-chapas">
            {DATOS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`alta3d-chapa${chapaMal === d.id ? ' es-mal' : ''}${
                  chapaOk === d.id ? ' es-ok' : ''
                }`}
                onClick={() => elegirDato(d.id)}
              >
                {d.etiqueta}
              </button>
            ))}
          </div>
        </>
      ) : enLector ? (
        <p className="alta3d-lector-pregunta">¿Sirve de nombre de usuario?</p>
      ) : null}
    </>
  );

  const panelCredencial = (
    <div className="alta3d-credencial">
      <p className="alta3d-cred-tit">Credencial de Sofi</p>
      {/*
        Cada ranura va en dos renglones y no en dos columnas: el nombre del campo
        a la izquierda y quién lo ve a la derecha, y debajo el valor a lo ancho.
        En una sola línea la etiqueta se partía en cuatro renglones al lado de un
        valor de uno solo, y lo que tiene que saltar a la vista es justo el
        contraste entre «lo puede ver cualquiera» y «no la ve nadie».
      */}
      <div className={`alta3d-cred-ranura${usuario ? ' es-publica' : ' es-hueca'}`}>
        <span className="alta3d-cred-eti">
          <span className="alta3d-cred-campo">Usuario</span>
          <span className="alta3d-cred-quien">lo puede ver cualquiera</span>
        </span>
        <span className={`alta3d-cred-valor${usuario ? '' : ' es-hueco'}`}>{usuario ?? '—'}</span>
      </div>
      <div className={`alta3d-cred-ranura${contrasena ? ' es-secreta' : ' es-hueca'}`}>
        <span className="alta3d-cred-eti">
          <span className="alta3d-cred-campo">Contraseña</span>
          <span className="alta3d-cred-quien es-secreto">no la ve nadie</span>
        </span>
        <span className={`alta3d-cred-valor${contrasena ? '' : ' es-hueco'}`}>
          {contrasena ?? '—'}
        </span>
      </div>
      <p className="alta3d-cred-pie">
        {contrasena
          ? CONTRASENA_FRASE
          : usuario
            ? 'Ahora la llave: mete aquí los ingredientes que suban.'
            : 'Encaja arriba la tarjeta que sirva.'}
      </p>
    </div>
  );

  const panelMedidor = (
    <div className={`alta3d-medidor${bajando ? ' es-baja' : ''}`}>
      <p className="alta3d-medidor-tit">Fuerza de la llave</p>
      <div className="alta3d-medidor-barra">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`alta3d-medidor-seg${i < segmentos ? ' es-on' : ''}`} />
        ))}
      </div>
      <p className="alta3d-medidor-pie">{bajando ? 'BAJA' : `${segmentos} de 4`}</p>
      <button type="button" className="alta3d-medidor-ayuda" onClick={tocarMedidor}>
        ¿Qué la hace fuerte?
      </button>
    </div>
  );

  const panelSobre = sobre ? (
    <div className="alta3d-sobre">
      <p className="alta3d-sobre-de">
        <span className="alta3d-sobre-emoji" aria-hidden="true">
          {sobre.emoji}
        </span>
        {sobre.dequien}
      </p>
      <p className="alta3d-sobre-mensaje">«{sobre.mensaje}»</p>
    </div>
  ) : null;

  const escena = (
    <MostradorAlta3D
      fase={fase}
      reduceMotion={reduceMotion}
      rotulo={rotulo}
      gafeteColgado={gafeteColgado}
      onColgarGafete={colgarGafete}
      ficha={ficha}
      fichaLista={fase === 'forja' && prediccion !== null}
      onElegirFicha={() => ficha && usarFicha(ficha.id)}
      lector={panelLector}
      estadoLector={estadoLector}
      onSoltarEnLector={pasarTarjeta}
      credencial={panelCredencial}
      credencialLista={contrasena !== null}
      onSoltarEnForja={meterIngrediente}
      medidor={panelMedidor}
      segmentos={segmentos}
      bajando={bajando}
      onTocarMedidor={tocarMedidor}
      sobre={sobre}
      sobrePanel={panelSobre}
      teclas={teclas}
      onTecla={pulsarTecla}
      onTocarDormido={tocarDormido}
    />
  );

  /* jsdom no tiene WebGL: el respaldo lleva los mismos rótulos y las mismas
     etiquetas accesibles que los controles de la escena, para que la actividad
     se pueda jugar y probar entera sin tarjeta gráfica. */
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{ROTULOS[fase].texto}</p>

      {fase === 'gafete' && (
        <div className="escena3d-respaldo-fila">
          <button
            type="button"
            className="pieza3d-boton"
            onClick={() => colgarGafete('gafete-adulto')}
          >
            Gafete del adulto
          </button>
        </div>
      )}

      {fase === 'usuario' && (
        <>
          {tarjeta && !enLector && (
            <div className="escena3d-respaldo-fila">
              <button
                type="button"
                className="pieza3d-boton"
                onClick={() => pasarTarjeta(tarjeta.id)}
              >
                {tarjeta.texto}
              </button>
            </div>
          )}
          {enLector && !pidiendoDato && (
            <div className="escena3d-respaldo-fila">
              {TECLAS_USUARIO.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => veredictoTarjeta(t.id)}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          )}
          {pidiendoDato && (
            <div className="escena3d-respaldo-fila">
              {DATOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="pieza3d-boton"
                  onClick={() => elegirDato(d.id)}
                >
                  {d.etiqueta}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {fase === 'forja' && ingrediente && (
        <>
          <div className="escena3d-respaldo-fila">
            {TECLAS_FORJA.map((t) => (
              <button
                key={t.id}
                type="button"
                className="pieza3d-boton"
                onClick={() => predecir(t.id)}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
          <div className="escena3d-respaldo-fila">
            <button
              type="button"
              className="pieza3d-boton"
              onClick={() => meterIngrediente(ingrediente.id)}
            >
              {ingrediente.texto}
            </button>
          </div>
        </>
      )}

      {fase === 'buzon' && sobre && (
        <>
          <p className="escena3d-respaldo-titulo">
            {sobre.dequien}: «{sobre.mensaje}»
          </p>
          <div className="escena3d-respaldo-fila">
            {TECLAS_BUZON.map((t) => (
              <button
                key={t.id}
                type="button"
                className="pieza3d-boton"
                onClick={() => responderSobre(t.id)}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const marcador =
    fase === 'gafete'
      ? { etiqueta: 'Adulto', valor: gafeteColgado ? '1/1' : '0/1' }
      : fase === 'usuario'
        ? { etiqueta: 'Usuarios', valor: `${indiceTarjeta}/${CANDIDATOS.length}` }
        : fase === 'forja'
          ? { etiqueta: 'Fuerza', valor: `${segmentos}/4` }
          : { etiqueta: 'Sobres', valor: `${terminado ? SOBRES.length : indiceSobre}/${SOBRES.length}` };

  return (
    <ArcadeSala3D
      titulo="Mi primera cuenta"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      /* Mismo caso que en «Las partes del correo»: MostradorAlta3D monta su
         propio mueble (cubierta de 1.9 de fondo + faldon + patas) y el
         mostrador del rig, de 2.5, asomaba por delante y metia sus patas
         entre los mandos. La estacion es el unico mueble de la escena. */
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          El mostrador de altas · con un adulto · usuario público, contraseña secreta
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Titular responsable',
              insigniaEmoji: '🪪',
              titulo: '¡Tu cuenta quedó abierta y bien cerrada!',
              detalle:
                'Elegiste un usuario que no dice quién eres, forjaste una llave de cuatro segmentos que puedes recordar sin apuntarla, y supiste a quién sí y a quién no se le dan tus datos.',
              resumen: [
                { etiqueta: 'Usuarios', valor: `${CANDIDATOS.length}` },
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

export default LabMiPrimeraCuenta;
