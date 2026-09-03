'use client';

/**
 * La página educativa de «Conecta los periféricos» (N5·U1, parada 2).
 *
 * Va en la hoja izquierda del laboratorio de dos hojas: **se lee mientras se
 * practica en el simulador de al lado**, no antes. Es el encargo del cliente
 * del 6-ago-2026 —«que los reciba esa página nueva y el simulador 3D a la
 * vez»— y esta clase es la parada que lo pide con más razón: el simulador
 * enseña a leer una forma, y aquí está la fotografía de esa forma en el objeto
 * de verdad, al lado y en el mismo momento.
 *
 * ─── Las fotografías son reales y son las mismas de N1; el texto, no ─────────
 *
 * Los nueve archivos de `n1-conecta-el-equipo/` se descargaron de Wikimedia
 * Commons y se revisaron a tamaño completo en su día (ver
 * DOC-PEDAGOGICO-PAGINA-CONECTA-EL-EQUIPO.md). Un conector HDMI es el mismo
 * objeto en primero y en quinto de primaria, así que **se reusan los binarios y
 * se reescribe la página entera**: aquí no se hereda ni una sección ni una
 * frase. N1 aprende a no forzar un cable; N5 aprende qué es entrada y qué es
 * salida, la familia USB, por qué el HDMI también lleva sonido y por qué el
 * jack verde y no el rosa. Un port que sólo cambia el import deja la página
 * mintiendo, y en esta plataforma ya pasó.
 *
 * Varias de las nueve son CC BY-SA: la atribución no es opcional y vive en el
 * bloque de créditos del final.
 *
 * Está escrita a mano para este tema, como `PaginaConectaElEquipo` y como la
 * landing: no es un motor que genere páginas desde una config.
 */

import { useState } from 'react';
import Image from 'next/image';
import { dmSans, manrope } from '@/app/fonts';
import '../n1/mision/pagina/pagina-educativa.css';

/** Los binarios viven donde se descargaron; no se duplican por cambiar de nivel. */
const FOTO = '/assets/actividades/n1-conecta-el-equipo';

/** Ancho declarado a next/image: la hoja no pasa de ~720 px de medida. */
const TAM_COLUMNA = '(max-width: 1180px) 100vw, 46vw';
/** El hero es un panorama de 3,37:1 recortado con `cover`: se sirve a su ancho real. */
const TAM_HERO = '1920px';

const CIFRAS: { dato: string; unidad: string; pie: string; acento: string }[] = [
  { dato: '6', unidad: 'cables', pie: 'Los que vas a conectar en el laboratorio', acento: 'var(--pe-cyan)' },
  { dato: '9', unidad: 'puertos', pie: 'Y tres de ellos son idénticos por dentro', acento: 'var(--pe-blue)' },
  { dato: '1', unidad: 'forma', pie: 'Cada conector entra de una sola manera', acento: 'var(--pe-yellow)' },
  { dato: '0', unidad: 'fuerza', pie: 'Si no entra, no es su puerto — no lo empujes', acento: 'var(--pe-red)' },
];

/**
 * Llamadas sobre `foto-panel-trasero.jpg` (ZotacION2.jpg, 1908 × 566). Las
 * coordenadas están medidas sobre la imagen y no estimadas desde el código; son
 * las mismas cinco zonas que ya se comprobaron con captura para N1, con los
 * textos reescritos para este nivel.
 */
const LLAMADAS: { x: number; y: number; nombre: string; texto: string; acento: string }[] = [
  {
    x: 6.2,
    y: 44,
    nombre: 'PS/2 · entrada',
    texto:
      'Los puertos del teclado y el ratón de hace veinte años. Son de entrada: sólo meten información. Todavía los verás en equipos de escuela, y son redondos y de color.',
    acento: 'var(--pe-violet)',
  },
  {
    x: 44.3,
    y: 43,
    nombre: 'VGA · salida de imagen',
    texto:
      'Azul, ancho y con un tornillo a cada lado. Saca la imagen hacia el monitor, y sólo la imagen: el sonido tiene que ir por otro cable.',
    acento: 'var(--pe-blue)',
  },
  {
    x: 62.9,
    y: 52,
    nombre: 'USB · entrada y salida',
    texto:
      'El puerto de casi todo. Por aquí entra lo que escribes con el teclado y sale lo que mandas a la impresora, así que hace las dos cosas. Casi siempre hay varios juntos.',
    acento: 'var(--pe-cyan)',
  },
  {
    x: 74.4,
    y: 43,
    nombre: 'Red · las dos direcciones',
    texto:
      'Aquí entra el cable de internet. Por él sale lo que pides y entra lo que te contestan, todo el rato y en los dos sentidos.',
    acento: 'var(--pe-green)',
  },
  {
    x: 85.2,
    y: 60,
    nombre: 'Audio · tres agujeros iguales',
    texto:
      'Por dentro son idénticos, y por eso están pintados: verde para las bocinas, rosa para el micrófono, azul para meter sonido de otro aparato.',
    acento: 'var(--pe-yellow)',
  },
];

const ORO: string[] = [
  'Entrada mete información; salida la saca; algunos hacen las dos cosas.',
  'El puerto manda la forma. Si no entra, está al revés o no es el suyo.',
  'Los dos USB son iguales: el teclado va en cualquiera de los dos.',
  'El jack entra en los tres agujeros de audio. El de las bocinas es el verde.',
  'La corriente se conecta al final y se toma siempre del conector.',
];

const CREDITOS: { archivo: string; autor: string; licencia: string }[] = [
  { archivo: 'ZotacION2.jpg', autor: 'Fabexplosive', licencia: 'CC BY-SA 3.0' },
  { archivo: 'HDMI connector female.jpg', autor: 'Wikimedia Commons', licencia: 'CC BY-SA 3.0' },
  { archivo: 'HDMI Cable 1.JPG', autor: 'Kannan shanmugam', licencia: 'CC BY-SA 4.0' },
  { archivo: 'Vga-cable.jpg', autor: 'Evan-Amos', licencia: 'Dominio público' },
  { archivo: 'USB A Connector Dual Side.JPG', autor: 'wdwd', licencia: 'CC BY-SA 4.0' },
  { archivo: 'Usb connectors.JPG', autor: 'Wikimedia Commons', licencia: 'Dominio público' },
  { archivo: 'Audio-TRS-Mini-Plug.jpg', autor: 'Evan-Amos', licencia: 'Dominio público' },
  { archivo: '8p8c crimpable.JPG', autor: 'Thomas Wydra', licencia: 'Dominio público' },
  { archivo: 'Cabo de forca computador 01.jpg', autor: 'Luis Dantas', licencia: 'Dominio público' },
];

export function PaginaPerifericos() {
  const [llamada, setLlamada] = useState<number | null>(null);

  return (
    <article className={`pagina-edu ${manrope.variable} ${dmSans.variable}`}>
      {/* ── Hero ── */}
      <header className="pe-hero">
        <div className="pe-hero-foto" aria-hidden="true">
          <Image src={`${FOTO}/foto-panel-trasero.jpg`} alt="" fill sizes={TAM_HERO} priority />
        </div>
        <div className="pe-hero-texto pe-medida">
          <span className="pe-eyebrow">Nivel 5 · El sistema de cómputo · Parada 2</span>
          <h1>
            La compu sola <em>no hace nada</em>
          </h1>
          <p className="pe-lead">
            Una computadora sin nada conectado no puede ver lo que escribes ni enseñarte nada. Todo lo que se le
            conecta se llama <strong>periférico</strong>, y cada uno entra por un puerto distinto que está hecho a
            propósito para que sólo entre el suyo. Aquí aprendes a leer esas formas; en el laboratorio de al lado las
            conectas.
          </p>

          <div className="pe-reglas">
            {CIFRAS.map((c) => (
              <div key={c.unidad} className="pe-regla" style={{ ['--pe-acc' as string]: c.acento }}>
                <b>{c.dato}</b>
                <i>{c.unidad}</i>
                <span>{c.pie}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Entrada, salida y los dos ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La primera clasificación</span>
        <h2>Unos meten información y otros la sacan</h2>
        <p>
          Ésta es la pregunta que te va a servir toda la vida delante de cualquier aparato:{' '}
          <strong>¿la información va hacia dentro de la computadora o hacia fuera?</strong>
        </p>

        <div className="pe-duo">
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-cyan)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">Entrada</span>
              <Image
                src={`${FOTO}/foto-usb-a.jpg`}
                alt="Punta de un cable USB tipo A vista de cerca, con la barra de plástico blanca de un solo lado"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Hacia dentro</h3>
              <p>
                Teclado, ratón, micrófono, cámara, escáner. Le <strong>meten</strong> datos a la computadora: letras,
                movimientos, sonido, imágenes. Casi todos entran por USB.
              </p>
            </div>
          </div>

          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-yellow)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">Salida</span>
              <Image
                src={`${FOTO}/foto-hdmi-puerto.jpg`}
                alt="Puerto HDMI hembra en el costado de un equipo, con la palabra HDMI impresa junto a la ranura"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Hacia fuera</h3>
              <p>
                Monitor, bocinas, impresora, audífonos. Le <strong>sacan</strong> datos: te enseñan, te suenan o te
                imprimen lo que la computadora acaba de hacer.
              </p>
            </div>
          </div>
        </div>

        <div className="pe-aviso">
          <span aria-hidden="true">🔁</span>
          <p>
            Y hay <b>periféricos que hacen las dos cosas</b>: una memoria USB, porque le pasas archivos y le sacas
            archivos; una pantalla táctil, porque te enseña y a la vez le tocas; una multifuncional, porque imprime y
            escanea.
          </p>
        </div>
      </section>

      {/* ── Puerto y conector ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Dos palabras que no son la misma</span>
        <h2>El puerto es el hueco; el conector es la punta</h2>
        <p>
          El puerto está fijo en la computadora y no se mueve nunca. El conector va en la punta del cable y lo llevas
          tú. Cuando los dos tienen la misma forma, son pareja — y sólo entonces.
        </p>

        <figure className="pe-lamina">
          <div className="pe-lamina-foto">
            <Image
              src={`${FOTO}/foto-hdmi-cable.jpg`}
              alt="Cable HDMI enrollado, con sus dos puntas planas de esquinas recortadas a la vista"
              fill
              sizes={TAM_COLUMNA}
            />
          </div>
          <figcaption className="pe-lamina-texto">
            <h3>Y casi siempre hay un letrero</h3>
            <p>
              Al lado de cada puerto suele estar escrito su nombre: HDMI, USB, LAN. Ese letrero pequeñito es tu mapa, y
              casi nadie lo mira. Cuando no hay letrero, hay color.
            </p>
          </figcaption>
        </figure>
      </section>

      {/* ── El mapa del panel ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Recórrelo</span>
        <h2>El mapa del panel trasero</h2>
        <p>
          Ésta es la parte de atrás de una computadora real, la misma que tienes girando en el laboratorio. Toca cada
          número para saber qué es y en qué dirección viaja la información por ahí.
        </p>

        <div className="pe-mapa-lienzo">
          <div className="pe-mapa">
            <Image
              src={`${FOTO}/foto-panel-trasero.jpg`}
              alt="Panel trasero de una placa madre: conector PS/2 morado, salida de video VGA azul, conector DVI blanco, seis puertos USB, un conector de red y tres jacks de audio de color"
              fill
              sizes={TAM_COLUMNA}
            />
            {LLAMADAS.map((punto, i) => (
              <button
                key={punto.nombre}
                type="button"
                className="pe-marca"
                style={{ left: `${punto.x}%`, top: `${punto.y}%`, ['--pe-acc' as string]: punto.acento }}
                aria-pressed={llamada === i}
                aria-label={punto.nombre}
                onClick={() => setLlamada(llamada === i ? null : i)}
                onMouseEnter={() => setLlamada(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* La leyenda repite la información fuera de la foto: nadie depende de
            acertar un círculo de 30 px ni de tener ratón. */}
        <div className="pe-leyenda">
          {LLAMADAS.map((punto, i) => (
            <button
              key={punto.nombre}
              type="button"
              className="pe-leyenda-item"
              style={{ ['--pe-acc' as string]: punto.acento }}
              aria-pressed={llamada === i}
              onClick={() => setLlamada(llamada === i ? null : i)}
              onMouseEnter={() => setLlamada(i)}
            >
              <span
                className="pe-lupa"
                aria-hidden="true"
                style={{ ['--pe-lx' as string]: `${punto.x}%`, ['--pe-ly' as string]: `${punto.y}%` }}
              >
                <Image src={`${FOTO}/foto-panel-trasero.jpg`} alt="" width={1908} height={566} sizes="1024px" />
                <span className="pe-lupa-num">{i + 1}</span>
              </span>
              <span className="pe-leyenda-texto">
                <b>{punto.nombre}</b>
                <span>{punto.texto}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── USB ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La familia grande</span>
        <h2>USB: el mismo nombre y cuatro tamaños</h2>

        <figure className="pe-lamina">
          <div className="pe-lamina-foto">
            <Image
              src={`${FOTO}/foto-usb-tipos.jpg`}
              alt="Fila de conectores USB de distintos tamaños —micro, mini, tipo A y tipo B— con una regla debajo que muestra su tamaño real"
              fill
              sizes={TAM_COLUMNA}
            />
          </div>
          <figcaption className="pe-lamina-texto">
            <h3>Todos son USB y ninguno se parece</h3>
            <p>
              El grande y plano es el <b>tipo A</b>, el de la computadora. El pequeñito es el <b>micro</b>, el de
              muchos aparatos viejos. El ovalado que entra por los dos lados es el <b>tipo C</b>, el más nuevo. La
              regla de la foto está a propósito, para que veas el tamaño real de cada uno.
            </p>
          </figcaption>
        </figure>

        <div className="pe-aviso">
          <span aria-hidden="true">🔎</span>
          <p>
            El truco del tipo A: mira dentro del conector y verás una <b>barra de plástico pegada a un solo lado</b>.
            Ésa decide cómo entra. Si no entra, gíralo media vuelta. Nunca lo fuerces: se doblan los contactos y ya no
            sirve.
          </p>
        </div>
      </section>

      {/* ── Imagen ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La imagen</span>
        <h2>HDMI y VGA no hacen lo mismo</h2>
        <p>Los dos llevan la imagen al monitor. Uno lleva además el sonido, y ésa es toda la diferencia práctica.</p>

        <div className="pe-duo">
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-cyan)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">HDMI</span>
              <Image
                src={`${FOTO}/foto-hdmi-cable.jpg`}
                alt="Cable HDMI, con la punta plana de esquinas recortadas"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Imagen y sonido</h3>
              <p>
                Plano y delgado, con <strong>las dos esquinas de abajo recortadas</strong> y ninguna arriba. Entra a
                presión y se queda. Si conectas el monitor por HDMI, el sonido ya va por ahí.
              </p>
            </div>
          </div>

          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-blue)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">VGA</span>
              <Image
                src={`${FOTO}/foto-vga.jpg`}
                alt="Conector VGA azul visto de cerca, con sus quince agujeritos en tres filas y un tornillo a cada lado"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Sólo imagen</h3>
              <p>
                Azul, ancho, con quince agujeritos en tres filas y un tornillo a cada lado que se aprieta con los
                dedos. Es el antiguo. Por él <strong>no pasa el sonido</strong>: las bocinas van aparte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audio ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La trampa del laboratorio</span>
        <h2>Tres agujeros idénticos y sólo uno es el tuyo</h2>

        <figure className="pe-lamina">
          <div className="pe-lamina-foto">
            <Image
              src={`${FOTO}/foto-audio-jack.jpg`}
              alt="Conector de audio de 3,5 milímetros de color verde, con sus dos anillos negros sobre el tubito metálico"
              fill
              sizes={TAM_COLUMNA}
            />
          </div>
          <figcaption className="pe-lamina-texto">
            <h3>El jack de 3,5 milímetros</h3>
            <p>
              Un tubito metálico con <b>dos anillos negros</b>. Es el más pequeño de todos y el único que no se guía
              por la forma: los tres agujeros de audio son iguales por dentro y el jack entra en los tres.
            </p>
          </figcaption>
        </figure>

        <div className="pe-aviso">
          <span aria-hidden="true">🎨</span>
          <p>
            Por eso están pintados, y ése es el único mapa que tienes: <b>verde</b> para las bocinas y los audífonos,{' '}
            <b>rosa</b> para el micrófono, <b>azul</b> para meter el sonido de otro aparato. Si conectas las bocinas en
            el rosa, entra perfecto y no se oye nada — y no está roto.
          </p>
        </div>
      </section>

      {/* ── Red y corriente ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Los dos que no se parecen a nada</span>
        <h2>La red y la corriente</h2>

        <div className="pe-duo">
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-green)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">Red · RJ-45</span>
              <Image
                src={`${FOTO}/foto-ethernet.jpg`}
                alt="Dos puntas de cable de red transparentes vistas de cerca, con sus ocho hilos de colores y la pestaña de plástico"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>El que hace clic</h3>
              <p>
                Punta transparente con <strong>ocho hilitos de colores</strong> y una pestaña que hace clic al entrar.
                Ese clic es la señal de que quedó bien. Para sacarlo se aprieta la pestaña primero; si jalas sin
                apretar, la rompes.
              </p>
            </div>
          </div>

          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-red)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">Corriente</span>
              <Image
                src={`${FOTO}/foto-corriente.jpg`}
                alt="Cable de corriente de computadora con sus dos extremos: la clavija de pared y el conector que entra en la fuente del equipo"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>El único con electricidad</h3>
              <p>
                Grueso, con tres patas —una es la de tierra— y una esquina achaflanada para que entre de un solo modo.
                Va <strong>al final</strong>, con las manos secas, y se toma siempre del conector.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reglas de oro ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Para no olvidar</span>
        <h2>Cinco reglas de oro</h2>
        <ol className="pe-oro">
          {ORO.map((regla) => (
            <li key={regla}>{regla}</li>
          ))}
        </ol>
      </section>

      {/* ── Créditos: obligatorios, no opcionales ── */}
      <footer className="pe-creditos pe-medida">
        <span className="pe-eyebrow">De dónde salen las fotos</span>
        <div className="pe-creditos-lista">
          {CREDITOS.map((credito) => (
            <div key={credito.archivo}>
              <b>{credito.archivo}</b> — {credito.autor} · {credito.licencia} · Wikimedia Commons
            </div>
          ))}
        </div>
      </footer>
    </article>
  );
}

export default PaginaPerifericos;
