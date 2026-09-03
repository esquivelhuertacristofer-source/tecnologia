'use client';

import type { Node as NodoPM } from 'prosemirror-model';
import { useEffect, useRef, useState } from 'react';
import { marcador, pulsacionesPorMinuto, suscribir, ultimaFoto, type Instantanea } from './pizarra';
import {
  apuroDeMayusculas,
  DEDO,
  escrito,
  etiquetaTecla,
  FILAS,
  letrasBuenas,
  LINEAS_DE_LA_HOJA,
  mayusculaDe,
  MODELOS,
  NOMBRE_DEDO,
  RENGLONES,
  zonaDeLaHoja,
  type ApuroMayusculas,
} from './renglones';
import './teclado.css';

/**
 * El teclado guía · el accesorio de `p-la-fila-guia`.
 *
 * Va acoplado al fondo de la ventana, debajo de la barra de estado, como el
 * teclado en pantalla de Windows debajo de la ventana de un programa. No flota
 * encima del documento y no tapa la hoja: es un aparato más, no un HUD.
 *
 * Hace tres cosas, y las tres las hacía ya la clase vieja con su mueble de
 * madera —de ahí que estén aquí y no se hayan perdido en el puerto—:
 *
 *  1. **Enseña la tecla siguiente**, encendida en azul, con la fila guía marcada
 *     y las rayitas de la F y la J dibujadas donde están de verdad.
 *  2. **Dice qué dedo la pulsa**, con las ocho huellas y su nombre escrito. Y
 *     cuando toca mayúscula enciende DOS teclas: la letra y el Mayús del meñique
 *     de la otra mano, que es la regla entera.
 *  3. **Lleva el marcador**: pulsaciones por minuto, errores y renglones. Las
 *     pulsaciones por minuto se miden sobre el tiempo tecleando y no sobre el
 *     reloj de pared, para no desmentir lo que la clase vieja prometía —«sin
 *     cronómetro, ve a tu ritmo»— en cuanto el niño se para a pensar.
 *
 * ── LAS TECLAS NO SE PULSAN CON EL RATÓN ────────────────────────────────────
 * En el arcade viejo el teclado gigante era jugable a clics: era un mueble y
 * había que poder tocarlo. Aquí sería la puerta de atrás — se escribiría el
 * renglón entero con el ratón sin colocar un solo dedo, que es exactamente lo
 * contrario de lo que la clase enseña—. Son teclas dibujadas, no botones, y se
 * dice así al lector de pantalla.
 *
 * ── NINGÚN RECADO PUEDE MANDAR BORRAR EL TRABAJO ────────────────────────────
 * Es la regla que gobierna `mirar` y `recado`, y sale de dos defectos medidos
 * en esta misma clase (§36.8 (C)). Antes de decir «te sobran N letras, bórralas»
 * hay que estar seguro de que esas letras son del alumno: si el cursor está en
 * la hoja del taller, o si lo que sobra es media página, el consejo correcto es
 * DESHACER. Y nunca se cuenta un error por letra cuando el despiste es uno solo
 * —Bloq Mayús—, porque entonces la clase castiga la trampa que ella misma pone.
 */

/** A partir de aquí, borrar deja de ser un consejo: se deshace. */
const MAXIMO_A_BORRAR = 10;

/** A partir de aquí, lo escrito ya no puede ser un tropiezo de tecla. */
const LARGO_INCONFUNDIBLE = 4;

interface Vista {
  situacion:
    | 'sin-cursor'
    | 'fija'
    | 'hoja-tocada'
    | 'enredado'
    | 'otro-renglon'
    | 'hecho'
    | 'escribiendo'
    | 'terminado';
  /** Renglón en curso, o −1 si ya están todos. */
  indice: number;
  /** Letras buenas del renglón en curso. */
  avance: number;
  /** Lo que sobra y hay que borrar. */
  sobra: string;
  /** Sólo falla el tamaño de las letras, y eso se contesta distinto. */
  apuro: ApuroMayusculas;
  /**
   * Lo escrito es el principio de OTRO de los seis renglones.
   *
   * No es una equivocación de tecla: es un alumno que va por otro renglón de la
   * lista. Contarlo letra a letra cobraba cincuenta errores —la peor nota
   * posible— a un niño que había escrito los seis renglones perfectos y sólo
   * los había hecho en otro orden.
   */
  otro: boolean;
  /** Largo de lo escrito en el renglón del cursor. */
  largo: number;
  /** Renglones terminados. */
  hechos: number;
  ppm: number;
  errores: number;
}

const VACIA: Vista = {
  situacion: 'sin-cursor',
  indice: 0,
  avance: 0,
  sobra: '',
  apuro: null,
  otro: false,
  largo: 0,
  hechos: 0,
  ppm: 0,
  errores: 0,
};

/** Lee la instantánea y decide qué hay que enseñar. */
function mirar(foto: Instantanea): Omit<Vista, 'ppm' | 'errores'> {
  const hechos = MODELOS.filter((m) => escrito(foto.doc, m)).length;
  const indice = MODELOS.findIndex((m) => !escrito(foto.doc, m));
  const base = {
    indice,
    avance: 0,
    sobra: '',
    apuro: null as ApuroMayusculas,
    otro: false,
    largo: 0,
    hechos,
  };

  if (indice < 0) return { ...base, situacion: 'terminado' };
  if (!foto.hayCursor) return { ...base, situacion: 'sin-cursor' };

  // Los espacios de la izquierda no cuentan: la corrección tampoco los cuenta.
  const texto = foto.texto.replace(/^\s+/, '');
  const limpio = texto.trim();
  const donde = { ...base, largo: texto.length };

  if (MODELOS.includes(limpio)) return { ...donde, situacion: 'hecho' };
  if (LINEAS_DE_LA_HOJA.includes(limpio)) return { ...donde, situacion: 'fija' };

  /*
   * ¿El cursor está en la hoja del taller? Se contesta por POSICIÓN.
   *
   * Se contestaba mirando el texto del renglón —«¿empieza igual que una de las
   * cuatro líneas?»—, y bastaba teclear dentro de la palabra «Práctica» para
   * que dejara de reconocerse: el recado pasaba a decir «sobran 26 letras,
   * bórralas con Retroceso» y el niño, obediente, se llevaba por delante el
   * título de la hoja. Un encargo no se ancla nunca al texto que el alumno
   * puede reescribir, y una AYUDA tampoco.
   */
  if (foto.indice >= 0 && foto.indice < zonaDeLaHoja(foto.doc)) {
    return { ...donde, situacion: 'hoja-tocada' };
  }

  const modelo = MODELOS[indice];
  const avance = letrasBuenas(texto, modelo);
  // Si todo lo escrito va bien encaminado, es su renglón y no hay más que mirar.
  if (avance === texto.length) return { ...donde, situacion: 'escribiendo', avance };

  const sobra = texto.slice(avance);
  const apuro = apuroDeMayusculas(texto, modelo);

  /*
   * ¿Está escribiendo OTRO de los seis renglones?
   *
   * Se pregunta después de comprobar que lo escrito ya no encaja con el modelo
   * de ahora: antes, una «d» sería el principio de cuatro renglones a la vez.
   * El aviso sólo cambia cuando lo escrito es inconfundible —cuatro letras—,
   * porque «de» todavía puede ser un dedo que se equivocó al teclear «dcd»;
   * pero para la NOTA cuenta desde la primera letra, que es lo que impide
   * cobrarle cincuenta errores a quien escribe los seis renglones en otro orden.
   */
  const otro = MODELOS.some((m, k) => k !== indice && m.startsWith(texto));
  if (otro && texto.length >= LARGO_INCONFUNDIBLE) {
    return { ...donde, situacion: 'otro-renglon', otro };
  }
  // Segunda red, por si el enredo llega por un camino que nadie previó: a nadie
  // se le manda borrar media hoja a golpe de Retroceso.
  if (!apuro && sobra.length > MAXIMO_A_BORRAR) {
    return { ...donde, situacion: 'enredado', avance, sobra, otro };
  }
  return { ...donde, situacion: 'escribiendo', avance, sobra, apuro, otro };
}

/** La tecla que toca ahora, en el alfabeto del mapa de dedos. */
function teclaSiguiente(v: Vista): string | null {
  if (v.situacion !== 'hecho' && v.situacion !== 'escribiendo') return null;
  if (v.situacion === 'hecho') return '⏎';
  if (v.sobra.length > 0) return '⌫';
  const modelo = MODELOS[v.indice];
  return v.avance >= modelo.length ? '⏎' : modelo[v.avance];
}

/** El recado de abajo: qué hacer ahora, en una frase. */
function recado(v: Vista, tecla: string | null): { texto: string; apurado: boolean } {
  const calma = (texto: string) => ({ texto, apurado: false });
  const alarma = (texto: string) => ({ texto, apurado: true });

  switch (v.situacion) {
    case 'terminado':
      return calma('¡Fila guía dominada! Ya escribes renglones enteros sin mirar el teclado.');
    case 'sin-cursor':
      return calma('Haz clic en el renglón vacío del final de la hoja para empezar a escribir.');
    case 'fija':
      return calma('Ese renglón es de la hoja, no es el tuyo. Baja al último renglón y escribe ahí.');
    case 'hoja-tocada':
      return alarma(
        'Estás escribiendo dentro de la hoja. Aprieta la flecha ↶ de arriba para deshacerlo y haz clic en el último renglón.',
      );
    case 'enredado':
      return alarma(
        'Este renglón se enredó. Aprieta la flecha ↶ de arriba para deshacerlo y sigue en el último renglón de la hoja.',
      );
    case 'otro-renglon':
      return calma(`Ése es otro renglón de la lista. El que toca ahora es: ${MODELOS[v.indice]}`);
    case 'hecho':
      return calma('Ese renglón ya está listo. Pulsa Entrar con el meñique derecho para bajar a uno nuevo.');
    default:
      break;
  }

  /*
   * El tropiezo que esta clase provoca a propósito. Lo escrito dice lo mismo
   * que el modelo y sólo falla el tamaño de las letras: o el niño encendió Bloq
   * Mayús —y le sale TODO en mayúsculas— o no llegó a apretar Mayús y le falta
   * la primera. Son dos apuros distintos y se contestan distinto, y se avisan
   * en la SEGUNDA letra y no al terminar el renglón, que es cuando todavía se
   * acuerda de lo que acaba de hacer.
   */
  if (v.apuro === 'bloq-mayus') {
    const modelo = MODELOS[v.indice];
    return alarma(
      modelo === modelo.toLowerCase()
        ? 'Te está saliendo en MAYÚSCULA. Bórrala con Retroceso (⌫): este renglón va todo en letra pequeña. Si te salen todas grandes, apaga Bloq Mayús.'
        : 'Te está saliendo todo en MAYÚSCULAS: apaga Bloq Mayús, borra con Retroceso (⌫) y usa Mayús sólo para la primera letra.',
    );
  }
  if (v.apuro === 'falta-mayuscula') {
    return alarma(
      'Falta la mayúscula. Borra con Retroceso (⌫) y hazla otra vez: Mayús con el meñique de la otra mano y, sin soltarlo, la letra.',
    );
  }
  if (v.sobra.length > 0) {
    return alarma(
      `Sobra${v.sobra.length === 1 ? '' : 'n'} ${v.sobra.length} letra${
        v.sobra.length === 1 ? '' : 's'
      }: bórral${v.sobra.length === 1 ? 'a' : 'as'} con Retroceso (⌫) y sigue.`,
    );
  }
  if (!tecla) return calma('');

  const dedo = DEDO[tecla.toLowerCase()];
  const mayus = mayusculaDe(tecla);
  const conDedo = dedo === undefined ? '' : ` con el ${NOMBRE_DEDO[dedo]}`;
  if (mayus) {
    return calma(
      `Aprieta Mayús con el meñique de la mano ${mayus} y, sin soltarlo, la letra ${tecla.toUpperCase()}${conDedo}.`,
    );
  }
  if (tecla === '⏎') return calma('Pulsa Entrar con el meñique derecho para bajar al renglón siguiente.');
  return calma(`Ahora toca ${etiquetaTecla(tecla)}${conDedo}.`);
}

/** Cómo se dibuja una tecla en la tira del renglón. */
const simbolo = (c: string) => (c === ' ' ? '␣' : c);

export default function TecladoGuia() {
  const [vista, setVista] = useState<Vista>(VACIA);
  const [abierto, setAbierto] = useState(true);
  const [festejo, setFestejo] = useState(false);
  const docAnterior = useRef<NodoPM | null>(null);
  const anterior = useRef({ indice: -1, sobra: 0, apuro: false, largo: 0 });
  const hechosAnterior = useRef(0);
  const relojFestejo = useRef<number | null>(null);

  /* ── el hilo con el documento ─────────────────────────────────────────── */

  useEffect(() => {
    const soltar = suscribir((foto) => {
      const v = mirar(foto);

      // Tiempo tecleando. Sólo cuando el documento cambió de verdad, y sin
      // contar los huecos largos: son el niño pensando, no escribiendo.
      if (foto.doc !== docAnterior.current) {
        const ahora = Date.now();
        if (marcador.ultimaTecla && ahora - marcador.ultimaTecla < 3000) {
          marcador.activoMs += ahora - marcador.ultimaTecla;
        }
        marcador.ultimaTecla = ahora;
        docAnterior.current = foto.doc;
      }

      // Letras buenas: las de los renglones terminados más las de éste. Nunca
      // baja, porque borrar un renglón no deshace el haberlo tecleado.
      const terminadas = MODELOS.filter((m) => escrito(foto.doc, m)).reduce((n, m) => n + m.length, 0);
      marcador.correctos = Math.max(marcador.correctos, terminadas + v.avance);

      /*
       * Los errores, con tres cuidados y no uno.
       *
       *  · **Uno por tecla, nunca de golpe.** Si lo que «sobra» salta de cero a
       *    veinticinco de una vez —el cursor estaba donde no debía—, eso es una
       *    equivocación, no veinticinco.
       *  · **Sólo si el renglón CRECIÓ.** Deshacer encoge el texto y removía
       *    igual el contador: al alumno le costaba un punto arrepentirse.
       *  · **El apuro de las mayúsculas se cobra UNA vez.** Escribir «HOY ES
       *    LUNES» con Bloq Mayús puesto es UN despiste; contarlo letra a letra
       *    cobraba once errores por caer en la trampa que la clase pone a
       *    propósito, y bajaba la nota veintitrés puntos.
       *  · **Escribir OTRO de los seis renglones no es equivocarse de tecla.**
       *    Medido: los seis renglones perfectos, escritos en otro orden,
       *    acababan en 50 errores y la peor nota posible.
       */
      if (v.situacion === 'escribiendo') {
        const previo = anterior.current;
        const mismoRenglon = previo.indice === v.indice;
        if (v.otro) {
          /* va por otro renglón de la lista: no se le cobra nada */
        } else if (v.apuro) {
          if (!mismoRenglon || !previo.apuro) marcador.errores += 1;
        } else if (mismoRenglon && v.sobra.length > previo.sobra && v.largo > previo.largo) {
          marcador.errores += 1;
        }
        anterior.current = {
          indice: v.indice,
          sobra: v.sobra.length,
          apuro: Boolean(v.apuro),
          largo: v.largo,
        };
      } else {
        anterior.current = { indice: -1, sobra: 0, apuro: false, largo: 0 };
      }

      // El «¡renglón listo!» de la clase vieja. Se dispara aquí, en el aviso de
      // fuera, y no en un efecto sobre el estado ya pintado: un efecto que hace
      // `setState` encadena repintados por cada tecla.
      if (v.hechos > hechosAnterior.current) {
        setFestejo(true);
        if (relojFestejo.current) window.clearTimeout(relojFestejo.current);
        relojFestejo.current = window.setTimeout(() => setFestejo(false), 1400);
      }
      hechosAnterior.current = v.hechos;

      setVista({ ...v, ppm: pulsacionesPorMinuto(), errores: marcador.errores });
    });
    return () => {
      soltar();
      if (relojFestejo.current) window.clearTimeout(relojFestejo.current);
    };
  }, []);

  /* ── el cursor empieza en el renglón vacío ────────────────────────────── */

  /*
   * Al abrir el documento, ProseMirror deja el cursor al principio —dentro del
   * título de la hoja—, y lo primero que teclea un niño se le mete ahí. La
   * ventana no tiene forma de decirle a una clase dónde quiere el cursor, así
   * que se coloca desde aquí en cuanto la portada se cierra y el documento está
   * pintado: se pone la selección del navegador al final del último renglón y
   * ProseMirror la adopta, que es como entra cualquier clic del alumno.
   */
  useEffect(() => {
    const desde = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - desde > 240000) {
        window.clearInterval(id);
        return;
      }
      if (document.querySelector('.txtw-portada')) return;
      const flujo = document.querySelector<HTMLElement>('.txtw-flujo');
      const bloques = flujo
        ? Array.from(flujo.children).filter((el) => !el.classList.contains('txt-salto-hoja'))
        : [];
      const ultimo = bloques[bloques.length - 1];
      if (!flujo || !ultimo) return;
      window.clearInterval(id);
      flujo.focus();
      const rango = document.createRange();
      rango.selectNodeContents(ultimo);
      rango.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(rango);
    }, 150);
    return () => window.clearInterval(id);
  }, []);

  /* ── el desatasco ─────────────────────────────────────────────────────── */

  /*
   * El motor corrige cuando llega una TRANSACCIÓN, y al terminar un encargo se
   * queda un segundo y medio celebrando: mientras celebra no mira nada, y
   * cuando pasa al encargo siguiente tampoco vuelve a mirar, porque el paso lo
   * adelanta un temporizador y no una tecla. Si para entonces el renglón que
   * toca YA está escrito, el maestro se queda pidiendo algo que está hecho y
   * nadie va a comprobarlo.
   *
   * No es teórico y no es raro: pasa siempre que el alumno se adelanta o que
   * arregla un renglón de arriba teniendo los de abajo ya escritos. Medido: los
   * seis renglones en la hoja, el teclado guía diciendo «¡Fila guía dominada!»,
   * el panel clavado en «5 de 6» y ninguna insignia — y el niño ya no tiene
   * nada que teclear para desatascarlo.
   *
   * Se desatasca desde aquí porque el arreglo de fondo está en la ventana
   * (volver a evaluar al cambiar de encargo) y la ventana es del motor, común a
   * las 154 clases del temario. El empujón es el gesto más barato que existe:
   * pulsar la pestaña que YA está abierta. La ventana la trata como «el alumno
   * cambió de pestaña», lo cual vuelve a corregir el documento y no cambia
   * absolutamente nada más —ni el texto, ni el cursor, ni el foco, y no cuenta
   * como tropiezo, que sólo lo cuentan los botones—.
   */
  useEffect(() => {
    let pidiendo = -1;
    let intentos = 0;
    const id = window.setInterval(() => {
      if (document.querySelector('.txtw-portada')) return; // leyendo los objetivos
      if (document.querySelector('.txtw-encargo.es-acierto')) return; // celebrando
      if (document.querySelector('.txtw-final')) return; // ya hay insignia
      const cuenta = document.querySelector('.txtw-panel-cuenta')?.textContent ?? '';
      const leido = /(\d+)\s*de\s*(\d+)/.exec(cuenta);
      if (!leido) return;
      const pide = Number(leido[1]);
      if (pide !== pidiendo) {
        pidiendo = pide;
        intentos = 0;
      }
      // Dos intentos y se para: si empujar no lo mueve, insistir tampoco.
      if (pide >= MODELOS.length || intentos >= 2) return;
      const foto = ultimaFoto();
      if (!foto || !escrito(foto.doc, MODELOS[pide])) return;
      intentos += 1;
      document.querySelector<HTMLButtonElement>('.txtw-pestana.es-activa')?.click();
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  /* ── lo que se pinta ──────────────────────────────────────────────────── */

  const renglon = vista.indice >= 0 ? RENGLONES[vista.indice] : null;
  const modelo = renglon?.modelo ?? '';
  const tecla = teclaSiguiente(vista);
  const mayus = tecla ? mayusculaDe(tecla) : null;
  const teclaBaja = tecla ? tecla.toLowerCase() : null;
  const dedo = teclaBaja !== null ? DEDO[teclaBaja] : undefined;
  const dedoMayus = mayus === 'izquierda' ? 0 : mayus === 'derecha' ? 7 : null;
  const aviso = recado(vista, tecla);
  const sobraVista = vista.sobra.slice(0, 10);

  const claseTecla = (t: string) =>
    [
      'filag-tecla',
      t === 'f' || t === 'j' ? 'es-rayita' : '',
      teclaBaja === t ? 'es-pide' : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <section className={`filag${abierto ? '' : ' es-plegado'}`} aria-label="Teclado guía">
      <div className="filag-renglon">
        <p className="filag-cab">
          {vista.situacion === 'terminado' ? (
            <span className="filag-cab-fin">Los 6 renglones, escritos</span>
          ) : (
            <>
              <span className="filag-cab-num">Renglón {vista.indice + 1} de {RENGLONES.length}</span>
              <span className="filag-cab-tit">{renglon?.titulo}</span>
            </>
          )}
          {festejo && <span className="filag-listo">¡Renglón listo!</span>}
        </p>

        <p className="filag-modelo">
          {Array.from(modelo).map((c, i) => (
            <span
              key={`${vista.indice}-${i}`}
              className={[
                'filag-letra',
                c === ' ' ? 'es-espacio' : '',
                i < vista.avance ? 'es-hecha' : '',
                i === vista.avance && vista.situacion === 'escribiendo' && vista.sobra.length === 0 ? 'es-ahora' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {simbolo(c)}
            </span>
          ))}
          {sobraVista.length > 0 &&
            Array.from(sobraVista).map((c, i) => (
              <span key={`sobra-${i}`} className="filag-letra es-sobra">
                {simbolo(c)}
              </span>
            ))}
          {vista.situacion !== 'terminado' && (
            <span className={`filag-letra es-entrar${tecla === '⏎' ? ' es-ahora' : ''}`}>⏎</span>
          )}
        </p>

        {/* Un aviso de apuro no puede vestirse igual que una instrucción: a los
            ocho años, un renglón de texto que no cambia de aspecto no se lee. */}
        <p className={`filag-orden${aviso.apurado ? ' es-apuro' : ''}`} aria-live="polite">
          {aviso.texto}
        </p>
      </div>

      {abierto && (
        <div className="filag-teclado" aria-hidden="true">
          <div className="filag-fila">
            {FILAS[0].teclas.map((t) => (
              <span key={t} className={claseTecla(t)}>
                {t.toUpperCase()}
              </span>
            ))}
            <span className={`filag-tecla es-ancha${tecla === '⌫' ? ' es-pide' : ''}`}>⌫</span>
          </div>

          <div className="filag-fila es-guia">
            {FILAS[1].teclas.map((t) => (
              <span key={t} className={claseTecla(t)}>
                {t.toUpperCase()}
              </span>
            ))}
            <span className={`filag-tecla es-ancha${tecla === '⏎' ? ' es-pide' : ''}`}>⏎</span>
          </div>

          <div className="filag-fila">
            <span className={`filag-tecla es-mayus${mayus === 'izquierda' ? ' es-pide-mayus' : ''}`}>Mayús</span>
            {FILAS[2].teclas.map((t) => (
              <span key={t} className={claseTecla(t)}>
                {t.toUpperCase()}
              </span>
            ))}
            <span className={`filag-tecla es-mayus${mayus === 'derecha' ? ' es-pide-mayus' : ''}`}>Mayús</span>
          </div>

          <div className="filag-fila">
            <span className={`filag-tecla es-barra${teclaBaja === ' ' ? ' es-pide' : ''}`}>barra espaciadora</span>
          </div>

          <div className="filag-manos">
            {NOMBRE_DEDO.slice(0, 8).map((n, i) => (
              <span
                key={n}
                className={[
                  'filag-huella',
                  i === 3 ? 'es-corte' : '',
                  dedo === i ? 'es-pide' : '',
                  dedoMayus === i ? 'es-mayus' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>
        </div>
      )}

      <div className="filag-marcador">
        <p className="filag-dato">
          <b>{vista.ppm}</b> pulsaciones por minuto
        </p>
        <p className="filag-dato">
          <b>{vista.errores}</b> {vista.errores === 1 ? 'error' : 'errores'}
        </p>
        <p className="filag-dato">
          <b>
            {vista.hechos}/{RENGLONES.length}
          </b>{' '}
          renglones
        </p>
        <p className="filag-calma">Sin reloj: aquí nadie te apura.</p>
        <button type="button" className="filag-boton" onClick={() => setAbierto((a) => !a)}>
          {abierto ? 'Ocultar teclado' : 'Mostrar teclado'}
        </button>
      </div>
    </section>
  );
}
