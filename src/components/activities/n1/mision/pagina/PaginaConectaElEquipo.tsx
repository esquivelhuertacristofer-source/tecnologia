'use client';

import { useState } from 'react';
import Image from 'next/image';
import { dmSans, manrope } from '@/app/fonts';
import './pagina-educativa.css';

/**
 * Página educativa de «Conecta el equipo» (N1 · U1 · parada 3).
 *
 * Va en la hoja izquierda del laboratorio de dos hojas: se lee mientras se
 * practica en el simulador de al lado, no antes. Su razón de ser está en
 * DOC-PEDAGOGICO-PAGINA-CONECTA-EL-EQUIPO.md — el simulador enseña la
 * secuencia motriz sobre geometrías de colores, y el alumno salía sin haber
 * visto nunca un conector real. Aquí están las fotografías del objeto de
 * verdad, al lado y en el mismo momento.
 *
 * Está escrita a mano para este tema, como CenLanding.tsx: no es un motor que
 * genere páginas desde una config. Cada tema merece su propio tratamiento.
 *
 * Las nueve fotografías son de Wikimedia Commons y varias son CC BY-SA, así
 * que la atribución es obligatoria: vive en el bloque de créditos del final y
 * en creditos.json, junto a los archivos.
 */

const FOTO = '/assets/actividades/n1-conecta-el-equipo';

/** Las cuatro reglas del taller, en el formato de tira de cifras de la landing. */
const REGLAS: { dato: string; unidad: string; pie: string; acento: string }[] = [
  { dato: '1', unidad: 'forma', pie: 'Cada conector entra de una sola manera', acento: 'var(--pe-blue)' },
  { dato: '0', unidad: 'fuerza', pie: 'Si no entra, está al revés — no lo empujes', acento: 'var(--pe-red)' },
  { dato: '6', unidad: 'cables', pie: 'Los que vas a conectar en el laboratorio', acento: 'var(--pe-cyan)' },
  { dato: '2', unidad: 'manos', pie: 'Una sujeta el equipo, la otra el conector', acento: 'var(--pe-green)' },
];

/**
 * Llamadas sobre foto-panel-trasero.jpg (ZotacION2.jpg, 1908 × 566).
 * Las coordenadas son porcentajes del recuadro de la foto y salen de medir
 * sobre la imagen, no de estimarlas: PS/2 morado en (118, 250) px, VGA azul
 * en (845, 245), la pila central de USB en (1200, 320), el RJ-45 en
 * (1420, 245) y el jack verde en (1625, 340).
 */
const LLAMADAS: { x: number; y: number; nombre: string; texto: string; acento: string }[] = [
  {
    x: 6.2,
    y: 44,
    nombre: 'PS/2 · los de antes',
    texto: 'Aquí iban el teclado y el ratón hace veinte años. Todavía los verás en equipos escolares: morado para el teclado, verde para el ratón.',
    acento: 'var(--pe-violet)',
  },
  {
    x: 44.3,
    y: 43,
    nombre: 'VGA · imagen',
    texto: 'Azul, ancho y con un tornillo a cada lado. Lleva la imagen hasta el monitor, y solo la imagen.',
    acento: 'var(--pe-blue)',
  },
  {
    x: 62.9,
    y: 52,
    nombre: 'USB · casi todo',
    texto: 'El puerto de todo: teclado, ratón, memoria, impresora. Casi siempre hay varios juntos.',
    acento: 'var(--pe-cyan)',
  },
  {
    x: 74.4,
    y: 43,
    nombre: 'Red · internet',
    texto: 'Aquí entra el cable de internet. Hace clic al entrar, y ese clic es la señal de que quedó bien.',
    acento: 'var(--pe-green)',
  },
  {
    x: 85.2,
    y: 60,
    nombre: 'Audio · sonido',
    texto: 'Tres agujeros pequeños de colores: verde para bocinas, rosa para micrófono, azul para entrada de línea.',
    acento: 'var(--pe-yellow)',
  },
];

const ORO: string[] = [
  'Mira la forma antes de empujar.',
  'Si no entra, está al revés. Gíralo, no lo fuerces.',
  'Toma siempre el conector, nunca el cable.',
  'La corriente, al final.',
  'Si algo no enciende, revisa primero el regulador.',
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

/** Ancho declarado a next/image: la hoja nunca pasa de ~720 px de medida. */
const TAM_COLUMNA = '(max-width: 1180px) 100vw, 46vw';

/**
 * El hero es otra historia: la foto es un panorama de 3,37:1 recortado con
 * `cover` dentro de un recuadro casi cuadrado, así que se amplía hasta cubrir
 * el alto y su anchura real de pintado ronda los 1 880 px — no los 704 del
 * recuadro. Medido: pidiendo el ancho del recuadro llegaba un archivo de
 * 736 px que `cover` estiraba ×2,6 y se veía borroso. El original tiene
 * 1 908 px de ancho, de modo que a 1 920 se sirve prácticamente 1:1.
 */
const TAM_HERO = '1920px';

export function PaginaConectaElEquipo() {
  const [llamada, setLlamada] = useState<number | null>(null);

  return (
    <article className={`pagina-edu ${manrope.variable} ${dmSans.variable}`}>
      {/* ── Hero: el panel trasero real, que es de lo que trata todo ── */}
      <header className="pe-hero">
        <div className="pe-hero-foto" aria-hidden="true">
          <Image
            src={`${FOTO}/foto-panel-trasero.jpg`}
            alt=""
            fill
            sizes={TAM_HERO}
            priority
          />
        </div>
        <div className="pe-hero-texto pe-medida">
          <span className="pe-eyebrow">Nivel 1 · Unidad 1 · Parada 3</span>
          <h1>
            Cada cable tiene <em>un solo lugar</em>
          </h1>
          <p className="pe-lead">
            La parte de atrás de una computadora parece un desorden de agujeros. No lo es. Cada agujero
            tiene una forma distinta a propósito, para que sea imposible equivocarse. Aquí aprendes a leer
            esas formas; en el laboratorio de al lado las practicas.
          </p>

          <div className="pe-reglas">
            {REGLAS.map((regla) => (
              <div key={regla.unidad} className="pe-regla" style={{ ['--pe-acc' as string]: regla.acento }}>
                <b>{regla.dato}</b>
                <i>{regla.unidad}</i>
                <span>{regla.pie}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Puerto y cable ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Lo primero</span>
        <h2>Puerto y cable no son lo mismo</h2>
        <p>
          Confundirlos es el error número uno. Uno está fijo en la computadora y no se mueve nunca; el otro
          va suelto y lo llevas tú. Aprender a nombrarlos por separado te ahorra media clase.
        </p>

        <div className="pe-duo">
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-cyan)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">El puerto</span>
              <Image
                src={`${FOTO}/foto-hdmi-puerto.jpg`}
                alt="Puerto HDMI hembra en el costado de un equipo, con la palabra HDMI impresa junto a la ranura"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Es el hueco</h3>
              <p>
                Está fijo en el equipo y no se mueve. Casi siempre tiene su nombre escrito al lado: HDMI, USB,
                LAN. <strong>Ese letrero es tu mapa.</strong>
              </p>
            </div>
          </div>

          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-yellow)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">El cable</span>
              <Image
                src={`${FOTO}/foto-hdmi-cable.jpg`}
                alt="Cable HDMI enrollado, con sus dos puntas planas a la vista"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Es la punta</h3>
              <p>
                Va suelto y tiene una punta en cada extremo. La punta es la que entra en el puerto. Si la punta
                y el hueco tienen <strong>la misma forma</strong>, son pareja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mapa del panel trasero ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Recórrelo</span>
        <h2>El mapa del panel trasero</h2>
        <p>
          Esta es la parte de atrás de una computadora real. Toca cada número para saber qué es. Fíjate en que
          los colores no son adorno: dicen para qué sirve cada agujero.
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
            acertar un círculo de 30 px ni de tener ratón. Y cada entrada trae
            su lupa: el mismo recorte de la fotografía, ampliado sobre ese
            puerto, para que el nombre y el objeto real se vean juntos. */}
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
                <Image
                  src={`${FOTO}/foto-panel-trasero.jpg`}
                  alt=""
                  width={1908}
                  height={566}
                  sizes="1024px"
                />
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

      {/* ── La corriente ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Con cuidado</span>
        <h2>Primero entiende la corriente</h2>

        <figure className="pe-lamina">
          <div className="pe-lamina-foto">
            <Image
              src={`${FOTO}/foto-corriente.jpg`}
              alt="Cable de corriente de computadora con sus dos extremos: la clavija de pared y el conector que entra en la fuente del equipo"
              fill
              sizes={TAM_COLUMNA}
            />
          </div>
          <figcaption className="pe-lamina-texto">
            <h3>Un extremo a la pared, el otro al equipo</h3>
            <p>
              Este cable es el único que trae electricidad de verdad. Un extremo va al regulador o al contacto
              de la pared; el otro, a la fuente de la computadora, atrás de todo. Es grueso y tiene tres
              patitas porque una de ellas es la de tierra.
            </p>
          </figcaption>
        </figure>

        <div className="pe-aviso">
          <span aria-hidden="true">⚡</span>
          <p>
            Manos secas. Se toma <b>siempre del conector</b>, nunca jalando del cable. Y es el último que se
            conecta y el primero que se revisa cuando algo no enciende.
          </p>
        </div>
      </section>

      {/* ── La imagen ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La imagen</span>
        <h2>VGA y HDMI llevan la imagen al monitor</h2>
        <p>Los dos hacen el mismo viaje, pero no son iguales y no se parecen en nada al tacto.</p>

        <div className="pe-duo">
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
              <h3>El azul de los tornillos</h3>
              <p>
                Ancho, con quince agujeritos en tres filas y un tornillo a cada lado. Solo lleva imagen. Los
                tornillos se aprietan con los dedos para que no se zafe.
              </p>
            </div>
          </div>

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
              <h3>El plano moderno</h3>
              <p>
                Delgado, con las esquinas de abajo recortadas. Lleva imagen <strong>y sonido</strong> por el
                mismo cable. No tiene tornillos: entra a presión y se queda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── USB ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">La familia</span>
        <h2>USB: el puerto de casi todo</h2>

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
            <h3>Todos son USB, y ninguno se parece</h3>
            <p>
              Teclado, ratón, memoria, impresora, cámara: casi todo entra por USB. La regla de la foto está a
              propósito, para que veas el tamaño real de cada uno.
            </p>
          </figcaption>
        </figure>

        <div className="pe-duo" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-green)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">USB tipo A</span>
              <Image
                src={`${FOTO}/foto-usb-a.jpg`}
                alt="Punta de un cable USB tipo A vista de cerca, con la barra de plástico blanca de un solo lado"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>El truco de la barrita</h3>
              <p>
                Fíjate en la punta: es un rectángulo con una barra de plástico <strong>de un solo lado</strong>.
                Esa barra decide cómo entra. Si no entra, gíralo media vuelta. Nunca lo fuerces: se doblan los
                contactos de adentro y ya no sirve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sonido y red ── */}
      <section className="pe-bloque pe-medida">
        <span className="pe-eyebrow">Los dos pequeños</span>
        <h2>El sonido y la red</h2>

        <div className="pe-duo">
          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-green)' }}>
            <div className="pe-ficha-foto">
              <span className="pe-ficha-etiqueta">Audio 3,5 mm</span>
              <Image
                src={`${FOTO}/foto-audio-jack.jpg`}
                alt="Conector de audio de 3,5 milímetros de color verde, con sus dos rayas negras en el tubito metálico"
                fill
                sizes={TAM_COLUMNA}
              />
            </div>
            <div className="pe-ficha-texto">
              <h3>Se guía por color</h3>
              <p>
                Es el más pequeño de todos: un tubito de 3,5 milímetros con dos rayas negras. <strong>Verde</strong>{' '}
                para bocinas y audífonos, <strong>rosa</strong> para el micrófono, <strong>azul</strong> para
                conectar otro aparato que reproduzca sonido.
              </p>
            </div>
          </div>

          <div className="pe-ficha" style={{ ['--pe-acc' as string]: 'var(--pe-blue)' }}>
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
              <h3>Tiene que hacer clic</h3>
              <p>
                El cable de internet termina en una punta transparente con ocho hilitos dorados y una pestaña de
                plástico que hace <strong>clic</strong> al entrar. Para sacarlo se aprieta la pestaña primero; si
                jalas sin apretar, la rompes.
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

export default PaginaConectaElEquipo;
